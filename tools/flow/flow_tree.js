import { black } from "../../colours.js";
import { vectorCombine, magnitude, negate, multiply, rotate } from "../../utils.js";

export class FlowNode {
  constructor(id, position, options) {
    this.id = id;
    this.position = position;
    this.style = {...this.baseStyle(), ...options};
  }

  baseStyle() {
    return {
      color: black,
      radius: 15,
      isRoot: false,
    }
  }
}

export class FlowEdge {
  constructor(from, to, capacity, flow, options) {
    this.from = from;
    this.to = to;
    this.capacity = capacity;
    this.flow = flow;
    this.style = {...this.baseStyle(), ...options};
  }

  baseStyle() {
    return {
      color: black,
      width: 10 * this.capacity,
    }
  }
}

export class FlowTree {
  constructor() {
    this.roots = [];
    this.nodes = {};
    this.edges = {};
  }

  addNode(node) {
    this.nodes[node.id] = node;
    this.edges[node.id] = {};
    if (node.style.isRoot) {
      this.roots.push(node);
    }
  }

  addEdge(edge) {
    this.edges[edge.from.id][edge.to.id] = edge;
  }

  fromJSON(data) {
    Object.keys(data.nodes).forEach((id) => {
      this.addNode(new FlowNode(id, {x: data.nodes[id].x, y: data.nodes[id].y}, data.nodes[id]));
    });
    data.edges.forEach((edge) => {
      this.addEdge(new FlowEdge(this.nodes[edge.from], this.nodes[edge.to], edge.capacity, edge.flow || 0, edge));
    });
  }

  orderedChildren(nodeId) {
    return Object.values(this.edges[nodeId]).sort((a, b) => a.to.position.x - b.to.position.x);
  }
  orderedParents(nodeId) {
    return Object.values(this.edges).map(edgeMap => edgeMap[nodeId]).filter(e => e).sort((a, b) => a.from.position.x - b.from.position.x);
  }

  generateFlowGroups = () => {
    const rootEdges = this.roots.reduce((acc, root) => acc.concat(this.orderedChildren(root.id)), []);
    let lowFlow = 0;
    rootEdges.forEach((edge) => {
      edge.flowGroups = [{
        start: lowFlow,
        end: lowFlow + edge.flow,
      }]
      lowFlow += edge.flow;
    });
    // TODO: The flow is a DAG, so topsort to get node expand order.
    // For now, just sorting by y level (won't work in general).
    const nodes = Object.values(this.nodes).sort((a, b) => a.position.y - b.position.y);
    nodes.filter(node => !node.style.isRoot).forEach((node) => {
      const parents = this.orderedParents(node.id);
      const parentFlowGroups = parents.reduce((acc, parent) => acc.concat(parent.flowGroups), []);
      const children = this.orderedChildren(node.id);
      let parentIndex = 0;
      let parentMidFlow = parentFlowGroups[0].start;
      children.forEach(child => {
        const childFlowGroups = [];
        let childFlow = 0;
        while (parentIndex < parentFlowGroups.length && childFlow < child.flow) {
          if (parentFlowGroups[parentIndex].end - parentMidFlow > child.flow - childFlow) {
            childFlowGroups.push({
              start: parentMidFlow,
              end: parentMidFlow + (child.flow - childFlow),
            });
            parentMidFlow = parentMidFlow + (child.flow - childFlow);
            childFlow = child.flow;
          } else {
            childFlowGroups.push({
              start: parentMidFlow,
              end: parentFlowGroups[parentIndex].end,
            });
            parentIndex++;
            if (parentIndex < parentFlowGroups.length) {
              parentMidFlow = parentFlowGroups[parentIndex].start;
            }
            childFlow += childFlowGroups[childFlowGroups.length - 1].end - childFlowGroups[childFlowGroups.length - 1].start;
          }
        }
        child.flowGroups = childFlowGroups;
      })
    });
  }

  findProportionEdgeForFlow = (edge, flow) => {
    const totalFlow = edge.flowGroups.reduce((acc, group) => acc + group.end - group.start, 0);
    let currentFlow = 0;
    for (let i = 0; i < edge.flowGroups.length; i++) {
      if (edge.flowGroups[i].end > flow && edge.flowGroups[i].start <= flow) {
        return (currentFlow + (flow - edge.flowGroups[i].start)) / totalFlow;
      }
      currentFlow += edge.flowGroups[i].end - edge.flowGroups[i].start;
    }
    return -1;
  }

  findEdgeForFlow = (edgeList, flow) => {
    return edgeList.find(edge => this.findProportionEdgeForFlow(edge, flow) >= 0);
  }

  getFlowPath = (r) => {
    const rootEdges = this.roots.reduce((acc, root) => acc.concat(this.orderedChildren(root.id)), []);
    const totalFlow = rootEdges.reduce((acc, edge) => acc + edge.flow, 0);
    const proportionalFlow = r * totalFlow;
    const firstEdge = this.findEdgeForFlow(rootEdges, proportionalFlow);
    let node = firstEdge.from;
    let positions = [];
    while (true) {
      const children = this.orderedChildren(node.id);
      const nextEdge = this.findEdgeForFlow(children, proportionalFlow);
      if (nextEdge) {
        positions.push(nextEdge.from);
        node = nextEdge.to;
      } else {
        positions.push(node);
        break;
      }
    }

    const beziers = [];
    for (let i=1; i<positions.length-1; i++) {
      const prevPoint = i === 0 ? positions[i] : positions[i-1];
      const curPoint = positions[i];
      const nextPoint = i === positions.length - 1 ? positions[i] : positions[i+1];
      // from positions[i-1] to positions[i] to positions[i+1]
      // We'll handle the top of positions[i] to bottom of positions[i], and then the bottom of positions[i] to top of positions[i+1].
      let dist1 = vectorCombine(curPoint.position, negate(prevPoint.position));
      let dist2 = vectorCombine(nextPoint.position, negate(curPoint.position));
      dist1 = i === 0 ? dist1 : multiply(dist1, 1 / magnitude(dist1));
      dist2 = i === positions.length - 1 ? dist2 : multiply(dist2, 1 / magnitude(dist2));
      const upEdge = this.orderedChildren(prevPoint.id).find((c) => c.to === curPoint);
      const upWidth = upEdge.style.width * (i === 0 ? 0 : upEdge.flow) / upEdge.capacity;
      const upRatio = i === 0 ? 0 : this.findProportionEdgeForFlow(upEdge, proportionalFlow);
      const downEdge = this.orderedChildren(curPoint.id).find((c) => c.to === nextPoint);
      const downWidth = downEdge.style.width * (i === positions.length - 1 ? 0 : downEdge.flow) / downEdge.capacity;
      const downRatio = i === positions.length - 1 ? 0 : this.findProportionEdgeForFlow(downEdge, proportionalFlow);
      const normal1 = rotate(dist1, Math.PI / 2);
      const normal2 = rotate(dist2, Math.PI / 2);
      const topPoint = vectorCombine(curPoint.position, multiply(dist1, -curPoint.style.radius), multiply(normal1, (0.5 - upRatio) * upWidth));
      const bottomPoint = vectorCombine(curPoint.position, multiply(dist2, curPoint.style.radius), multiply(normal2, (0.5 - downRatio) * downWidth));
      beziers.push([
        topPoint,
        vectorCombine(topPoint, multiply(dist1, curPoint.style.radius * 0.6)),
        vectorCombine(bottomPoint, multiply(dist2, -curPoint.style.radius * 0.6)),
        bottomPoint,
      ]);
      const nextTopPoint = vectorCombine(nextPoint.position, multiply(dist2, -curPoint.style.radius), multiply(normal2, (0.5 - downRatio) * downWidth));
      beziers.push([
        bottomPoint,
        nextTopPoint,
      ]);
    }
    return {
      positions,
      beziers,
    }
  }
}
