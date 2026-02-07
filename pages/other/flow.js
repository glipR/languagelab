import { addScene, registerScene } from '../../templates/scene.js';
import { bezier, magnitude, multiply, negate, rotate, StepScenes, vectorCombine } from '../../utils.js';
import Screen from '../../screen.js';
import { bg_dark, black, blue, rainbow, white } from '../../colours.js';
import { DrawnBezier, DrawnBezierGroup } from '../../tools/drawnBezier.js';
import { delay, interpValue, randomDelay, TweenManager, ValueTween } from '../../tween.js';
import { FlowTree } from '../../tools/flow/flow_tree.js';

const GS = {};

const WATER_LINES = 300;
const WATER_COLOUR = 0x38afcd;
const WATER_AMOUNT = 0.5;
const WATER_WIDTH = 4;
const WATER_INLINE = 0.1;
const WATER_TIME = 180;

const FLASH_LINES = 3;
const FLASH_COLOUR = 0xffffff;
const FLASH_AMOUNT = 0.05;
const FLASH_DIST = 0.1;
const FLASH_INLINE = 0.2;
const FLASH_WIDTH = 1.5;
const FLASH_TIME = 60;
const FLASH_WAIT = 60;
const FLASH_TRAVEL = 0.2;

const OTHER_FLASH_TOTAL = 5;
const OTHER_FLASH_RADIUS = [1,4];
const OTHER_FLASH_COLOUR = white;
const OTHER_FLASH_INLINE = 0.2;
const OTHER_FLASH_TRAVEL = [0.15, 0.5];
const OTHER_FLASH_TIME = [120, 150];
const OTHER_FLASH_WAIT = [20, 40];
const OTHER_FLASH_MAX_ALPHA = 0.7;

const vertRadius = 20;
const maxRadius = 50;
const edgeWidth = 15;

const alignBezier1 = (r) => [
  { x: 5 - 10 * r, y: 250 },
  { x: 0, y: 550 },
  { x: 300, y: 545 + 10 * r },
]

const alignBezier2 = (r) => [
  { x: 95 + 10 * r, y: 250 },
  { x: 100, y: 450 },
  { x: 300, y: 455 - 10 * r },
]

const waterAnim = (line) => new ValueTween(0, 1 + WATER_AMOUNT, WATER_TIME, (t)=>t, (v) => {
  line.startDrawnAmount = Math.max(0, v - WATER_AMOUNT);
  line.drawnAmount = Math.min(1, v);
  // console.log(line.startDrawnAmount, line.drawnAmount);
  line.updateDrawnGraphic();
}, undefined, () => {
  TweenManager.add(waterAnim(line));
});

const flashAnim = (line) => new ValueTween(0, FLASH_TRAVEL, FLASH_TIME, (t)=>t, (v) => {
  line.startDrawnAmount = line.startTime + v;
  line.drawnAmount = line.startTime + v + FLASH_AMOUNT;
  line.updateDrawnGraphic();
  if (v < FLASH_TRAVEL / 2) {
    line.alpha = v / (FLASH_TRAVEL / 2);
  }
  if (v > FLASH_TRAVEL / 2) {
    line.alpha = (FLASH_TRAVEL - v) / (FLASH_TRAVEL / 2);
  }
}, () => {
  line.startTime = FLASH_DIST + (1 - 2 * FLASH_DIST - FLASH_AMOUNT - FLASH_TRAVEL) * Math.random()
}, () => {
  line.startDrawnAmount = 0;
  line.drawnAmount = 0;
  line.updateDrawnGraphic();
  TweenManager.add(delay(Math.random() * FLASH_WAIT).then(flashAnim(line)));
});

const otherFlashAnim = (circ) => new ValueTween(0, 1, OTHER_FLASH_TIME[0] + Math.random() * (OTHER_FLASH_TIME[1] - OTHER_FLASH_TIME[0]), (t)=>t, (v) => {
  const pos = bezier(v, ...circ.followLine).position;
  circ.position.set(pos.x, pos.y);
  if (v < circ.startTime) {
    circ.alpha = 0;
  } else if (v < circ.startTime + circ.travel) {
    // 1/8: Fade in, 3/4: Stay, 1/8: Fade out
    const travelled = (v - circ.startTime) / circ.travel;
    if (travelled < 0.125) {
      circ.alpha = 8 * travelled * OTHER_FLASH_MAX_ALPHA;
    } else if (travelled < 0.875) {
      circ.alpha = 1 * OTHER_FLASH_MAX_ALPHA;
    } else {
      circ.alpha = (8 - 8 * travelled) * OTHER_FLASH_MAX_ALPHA;
    }
  } else {
    circ.alpha = 0;
  }
}, () => {
  const moveR = OTHER_FLASH_INLINE + (1 - 2 * OTHER_FLASH_INLINE) * Math.random();
  circ.followLine = alignBezier1(0).map((p, i) => {
    return interpValue(p, alignBezier2(0)[i], moveR);
  });
  const travel = OTHER_FLASH_TRAVEL[0] + Math.random() * (OTHER_FLASH_TRAVEL[1] - OTHER_FLASH_TRAVEL[0]);
  circ.travel = travel;
  const startTime = Math.random() * (1 - travel);
  circ.startTime = startTime;
}, () => {
  circ.alpha = 0;
  circ.position.set(0, 0);
  TweenManager.add(otherFlashAnim(circ));
});

const loader = (app, easings, onSuccess, onFailure, opts) => {

  GS.app = app;
  GS.easings = easings;
  GS.screen = new Screen(app, false);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();
  GS.opts = opts;

  const tree = new FlowTree();
  tree.fromJSON({
    nodes: {
      top: {
        x: 500,
        y: 100,
        isRoot: true,
      },
      topLeft: {
        x: 300,
        y: 200,
      },
      topRight: {
        x: 700,
        y: 200,
      },
      centre: {
        x: 500,
        y: 300,
      },
      bottomLeft: {
        x: 300,
        y: 400,
      },
      bottomRight: {
        x: 700,
        y: 400,
      },
      bottomCentre: {
        x: 500,
        y: 400,
      },
      bottom: {
        x: 500,
        y: 500,
      },
    },
    edges: [
      { from: 'top', to: 'topLeft', capacity: 4, flow: 4 },
      { from: 'top', to: 'topRight', capacity: 4, flow: 4 },
      { from: 'topLeft', to: 'centre', capacity: 4, flow: 2 },
      { from: 'topLeft', to: 'bottomLeft', capacity: 4, flow: 2 },
      { from: 'topRight', to: 'centre', capacity: 4, flow: 2 },
      { from: 'topRight', to: 'bottomRight', capacity: 4, flow: 2 },
      { from: 'centre', to: 'bottomLeft', capacity: 4, flow: 1 },
      { from: 'centre', to: 'bottomRight', capacity: 4, flow: 1 },
      { from: 'centre', to: 'bottomCentre', capacity: 4, flow: 2 },
      { from: 'bottomLeft', to: 'bottom', capacity: 4, flow: 3 },
      { from: 'bottomRight', to: 'bottom', capacity: 4, flow: 3 },
      { from: 'bottomCentre', to: 'bottom', capacity: 4, flow: 2 },
    ]
  });
  tree.generateFlowGroups();

  /*
  const top = {
    x: 500,
    y: 100,
    children: [],
  };
  const topLeft = {
    x: 300,
    y: 200,
    children: [],
  }
  const topRight = {
    x: 700,
    y: 200,
    children: [],
  }
  const centre = {
    x: 500,
    y: 300,
    children: [],
  }
  const bottomLeft = {
    x: 300,
    y: 400,
    children: [],
  }
  const bottomRight = {
    x: 700,
    y: 400,
    children: [],
  }
  const bottomCentre = {
    x: 500,
    y: 400,
    children: [],
  }
  const bottom = {
    x: 500,
    y: 500,
    children: [],
  }
  const nodes = [top, topLeft, topRight, centre, bottomLeft, bottomRight, bottomCentre, bottom];
  top.children = [
    { node: topLeft, flow: 4 },
    { node: topRight, flow: 4 },
  ]
  topLeft.children = [
    { node: centre, flow: 2 },
    { node: bottomLeft, flow: 2, offset: { x: -50, y: 0 } },
  ]
  topRight.children = [
    { node: centre, flow: 2 },
    { node: bottomRight, flow: 2, offset: { x: 50, y: 0 } },
  ]
  centre.children = [
    { node: bottomLeft, flow: 1 },
    { node: bottomRight, flow: 1 },
    { node: bottomCentre, flow: 2 },
  ]
  bottomLeft.children = [
    { node: bottom, flow: 3 },
  ]
  bottomRight.children = [
    { node: bottom, flow: 3 },
  ]
  bottomCentre.children = [
    { node: bottom, flow: 2 },
  ]

  */

  /*
  const getOrderedChildren = (node) => {
    return node.children.sort((a, b) => a.node.x - b.node.x);
  }
  const getOrderedParents = (node) => {
    return nodes.filter((n) => n.children.find((c) => c.node === node)).sort((a, b) => a.x - b.x).map((n) => ({
      ...n.children.find((c) => c.node === node),
      parent: n,
    }));
  }

  const getFlowPath = (r) => {
    const totalFlow = getOrderedChildren(top).reduce((acc, c) => acc + c.flow, 0);
    const queue = nodes.slice().sort((a, b) => a.y - b.y);
    queue.shift();
    const children = getOrderedChildren(top);
    let lowFlow = 0;
    for (let i=0; i<children.length; i++) {
      children[i].lowFlow = lowFlow;
      lowFlow += children[i].flow;
      children[i].highFlow = lowFlow;
    }
    while (queue.length > 0) {
      const node = queue.shift();
      const parents = getOrderedParents(node);
      let lowestFlow = parents.reduce((acc, p) => Math.min(p.lowFlow, acc), totalFlow);
      const qChildren = getOrderedChildren(node);
      for (let i=0; i<qChildren.length; i++) {
        qChildren[i].lowFlow = lowestFlow;
        lowestFlow += qChildren[i].flow;
        qChildren[i].highFlow = lowestFlow;
      }
    }

    const intFlow = r * totalFlow;
    // Now we know for each node the range of flows that it can have.
    let node = top;
    let positions = [top];
    let flow = intFlow;
    while (true) {
      const children = getOrderedChildren(node);
      let found = false
      for (let child of children) {
        if (child.lowFlow <= flow && child.highFlow > flow) {
          node = child.node;
          positions.push(child.node);
          found = true;
          break;
        }
      }
      if (!found) {
        break;
      }
    }

    const vertexRadius = 15;
    const edgeWidth = 5;

    const beziers = [];
    for (let i=0; i<positions.length; i++) {
      let prevPoint = i === 0 ? top : positions[i-1];
      let nextPoint = i === positions.length - 1 ? bottom : positions[i+1];
      // from positions[i-1] to positions[i] to positions[i+1]
      // We'll handle the top of positions[i] to bottom of positions[i], and then the bottom of positions[i] to top of positions[i+1].
      let dist1 = vectorCombine(positions[i], negate(prevPoint));
      let dist2 = vectorCombine(nextPoint, negate(positions[i]));
      dist1 = i === 0 ? dist1 : multiply(dist1, 1 / magnitude(dist1));
      dist2 = i === positions.length - 1 ? dist2 : multiply(dist2, 1 / magnitude(dist2));
      const upEdge = getOrderedChildren(prevPoint).find((c) => c.node === positions[i]);
      const upWidth = edgeWidth * (i === 0 ? 0 : upEdge.flow)
      const upRatio = i === 0 ? 0 : (intFlow - upEdge.lowFlow) / (upEdge.highFlow - upEdge.lowFlow);
      const downEdge = getOrderedChildren(positions[i]).find((c) => c.node === nextPoint);
      const downWidth = edgeWidth * (i === positions.length - 1 ? 0 : downEdge.flow)
      const downRatio = i === positions.length - 1 ? 0 : (intFlow - downEdge.lowFlow) / (downEdge.highFlow - downEdge.lowFlow);
      const normal1 = rotate(dist1, Math.PI / 2);
      const normal2 = rotate(dist2, Math.PI / 2);
      const topPoint = vectorCombine(positions[i], multiply(dist1, -vertexRadius), multiply(normal1, (0.5 - upRatio) * upWidth));
      const bottomPoint = vectorCombine(positions[i], multiply(dist2, vertexRadius), multiply(normal2, (0.5 - downRatio) * downWidth));
      beziers.push([
        topPoint,
        vectorCombine(topPoint, multiply(dist1, vertexRadius * 0.6)),
        vectorCombine(bottomPoint, multiply(dist2, -vertexRadius * 0.6)),
        bottomPoint,
      ]);
      const nextTopPoint = vectorCombine(nextPoint, multiply(dist2, -vertexRadius), multiply(normal2, (0.5 - downRatio) * downWidth));
      beziers.push([
        bottomPoint,
        nextTopPoint,
      ]);
    }

    return { positions, beziers };
  }
  */

  /*for (let i=0; i<100; i++) {
    const p = getFlowPath(i / 100);
    const flowPath = new DrawnBezierGroup({
      maxLineDist: 3,
      forcedDistance: 0.5,
      stroke: { color: rainbow(360 * i / 100), width: 2 },
      smoothScaling: 0.15,
    }, p.beziers, 1);
    GS.screen.addChild(flowPath);
  }*/

  const line1 = [];
  for (let i = 0; i < 10; i++) {
    const line = new DrawnBezier({
      stroke: { width: 1.5, color: 0x583927 },
      forcedDistance: 0.8,
      maxLineDist: 5,
      smoothScaling: 0.2,
    }, alignBezier1(Math.random()));
    GS.screen.addChild(line);
    line1.push(line);
  }

  const line2 = [];
  for (let i = 0; i < 10; i++) {
    const line = new DrawnBezier({
      stroke: { width: 1.5, color: 0x583927 },
      forcedDistance: 0.8,
      maxLineDist: 5,
      smoothScaling: 0.2,
    }, alignBezier2(Math.random()));
    GS.screen.addChild(line);
    line2.push(line);
  }

  const waterLines = [];
  for (let i=0; i<WATER_LINES; i++) {
    const r = WATER_INLINE + (1 - 2 * WATER_INLINE) * Math.random();
    const bezier = alignBezier1(0).map((p, i) => {
      return interpValue(p, alignBezier2(0)[i], r);
    });
    const line = new DrawnBezier({
      stroke: { width: WATER_WIDTH, color: interpValue(new PIXI.Color(WATER_COLOUR), blue, Math.random()) },
      forcedDistance: 0.8,
      maxLineDist: 5,
      smoothScaling: 0.4,
    }, bezier);
    line.alpha = 0.8;
    GS.screen.addChild(line);
    waterLines.push(line);
  }

  const flashLines = [];
  const otherFlashes = [];

  for (let i=0; i<FLASH_LINES; i++) {
    const r = FLASH_INLINE + (1 - 2 * FLASH_INLINE) * Math.random();
    const bezier = alignBezier1(0).map((p, i) => {
      return interpValue(p, alignBezier2(0)[i], r);
    });
    const line = new DrawnBezier({
      stroke: { width: FLASH_WIDTH, color: FLASH_COLOUR },
      forcedDistance: 0.8,
      maxLineDist: 5,
      smoothScaling: 0.4,
    }, bezier);
    GS.screen.addChild(line);
    flashLines.push(line);
  }

  for (let i=0; i<OTHER_FLASH_TOTAL; i++) {
    const g = new PIXI.Graphics();
    const r = Math.random();
    g.circle(0, 0, OTHER_FLASH_RADIUS[0] + r * (OTHER_FLASH_RADIUS[1] - OTHER_FLASH_RADIUS[0])).fill(OTHER_FLASH_COLOUR);
    g.alpha = 0;
    GS.screen.addChild(g);
    otherFlashes.push(g);
  }

  TweenManager.add(randomDelay(
    line1.concat(line2).map(line => new ValueTween(
      0, 1, 60, GS.easings.easeInOutQuad,
      (v) => {line.drawnAmount = v; line.updateDrawnGraphic()}
    )), 30,
  ));

  TweenManager.add(delay(60).then(randomDelay(waterLines.map(waterAnim), WATER_TIME)));
  TweenManager.add(delay(120).then(randomDelay(flashLines.map(flashAnim), FLASH_TIME + FLASH_WAIT)));
  TweenManager.add(delay(120).then(randomDelay(otherFlashes.map(otherFlashAnim), OTHER_FLASH_WAIT[1] + OTHER_FLASH_TIME[1])));

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      TweenManager.togglePause();
      e.preventDefault();
    }
  })

  // Graph background for depth
  const regions = [
    { size: vertRadius * 0.7, colour: 0xEBBC70 },
    { size: vertRadius * 0.5, colour: 0xE8B35E },
    { size: vertRadius * 0.3, colour: 0xE6AB4C },
    { size: vertRadius * 0.1, colour: 0xE3A23B },
  ]
  for (const { size, colour } of regions) {
    Object.keys(tree.edges).forEach((startNodeId) => {
      Object.keys(tree.edges[startNodeId]).forEach((endNodeId) => {
        const node = tree.nodes[startNodeId];
        const child = tree.nodes[endNodeId];
        const edge = tree.edges[startNodeId][endNodeId];
        // Draw multiple regions from node to child.
        const g = new PIXI.Graphics();
        let vec = vectorCombine(child.position, negate(node.position));
        vec = multiply(vec, 1 / magnitude(vec));
        const normal = rotate(vec, Math.PI / 2);
        const start = vectorCombine(node.position, multiply(normal, size))
        const startControl = vectorCombine(node.position, multiply(vec, -size));
        const startEnd = vectorCombine(node.position, multiply(normal, -size))
        const other = vectorCombine(child.position, multiply(normal, size))
        const otherControl = vectorCombine(child.position, multiply(vec, size));
        const otherEnd = vectorCombine(child.position, multiply(normal, -size))
        g.moveTo(start.x, start.y);
        g.lineTo(other.x, other.y);
        g.arcTo(otherControl.x, otherControl.y, otherEnd.x, otherEnd.y, size);
        g.lineTo(startEnd.x, startEnd.y);
        g.arcTo(startControl.x, startControl.y, start.x, start.y, size);
        g.closePath();
        g.fill(colour);
        GS.screen.addChild(g);
      });
    });
  };

  const graphWaterLines = [];
  for (let i=0; i<WATER_LINES; i++) {
    const r = Math.random();
    const path = tree.getFlowPath(r);
    const line = new DrawnBezierGroup({
      stroke: { width: WATER_WIDTH / 2, color: interpValue(new PIXI.Color(WATER_COLOUR), blue, Math.random()) },
      forcedDistance: 0.8,
      maxLineDist: 3,
      smoothScaling: 0.15,
      points: 30,
      spacePointsBetweenBeziers: true,
    }, path.beziers);
    line.alpha = 0.8;
    GS.screen.addChild(line);
    graphWaterLines.push(line);
  }

  const graphFlashLines = [];

  for (let i=0; i<FLASH_LINES; i++) {
    const r = Math.random();
    const path = tree.getFlowPath(r);
    const line = new DrawnBezierGroup({
      stroke: { width: FLASH_WIDTH, color: FLASH_COLOUR },
      forcedDistance: 0.8,
      maxLineDist: 3,
      smoothScaling: 0.15,
      points: 30,
      spacePointsBetweenBeziers: true,
    }, path.beziers);
    GS.screen.addChild(line);
    graphFlashLines.push(line);
  }

  TweenManager.add(delay(60).then(randomDelay(graphWaterLines.map(waterAnim), WATER_TIME)));
  TweenManager.add(delay(120).then(randomDelay(graphFlashLines.map(flashAnim), FLASH_TIME + FLASH_WAIT)));


  // Graph outline logic.
  const expanded = {};
  const outlines = [];
  const expand = (node1, node2, side, curKeys) => {
    // curKeys is the nodes read so far.
    // The point we are looking at is the point where the n1-n2 edge meets n1. Side determines whether we are looking at the counter-clockwise or clockwise side of this edge (-1 or 1).
    const key = `${node1.x},${node1.y},${node2.x},${node2.y},${side}`;
    if (expanded[key]) {
      return;
    }
    expanded[key] = true;
    const allAdjacent =
      getOrderedChildren(node1)
        .concat(getOrderedParents(node1).map(p => ({...p, node: p.parent})))
        .map(p => ({
          ...p,
          angle: Math.atan2(p.node.y - node1.y, p.node.x - node1.x),
          node: p.node,
        }))
        .sort((a, b) => a.angle - b.angle);

    const index = allAdjacent.findIndex(p => p.node === node2);
    const next = allAdjacent[(index + side + allAdjacent.length) % allAdjacent.length];
    curKeys.push(node1);
    if (curKeys.includes(next.node)) {
      outlines.push(curKeys.slice());
    } else {
      expand(next.node, node1, side, curKeys);
    }
  }

  /*for (let node of nodes) {
    for (let child of getOrderedChildren(node)) {
      expand(node, child.node, 1, []);
    }
  }*/

  const outlineBeziers = (points) => {
    // Now, to draw the actual outline.
    const beziers = [];
    const distances = [];
    for (let i=0; i<points.length; i++) {
      const prev = points[(i-1+points.length) % points.length];
      const next = points[(i+1) % points.length];
      // What should be the height of the intersection at points[i]?
      // Find the angle created by prev and next
      let prevAngle = Math.atan2(prev.y - points[i].y, prev.x - points[i].x);
      let nextAngle = Math.atan2(next.y - points[i].y, next.x - points[i].x);
      if (nextAngle < prevAngle) {
        nextAngle += Math.PI * 2;
      }
      const angle = nextAngle - prevAngle;
      // Try placing the start point of the intersection exactly where the two lines meet.
      let nextDist = vectorCombine(next, negate(points[i]));
      let prevDist = vectorCombine(prev, negate(points[i]));
      nextDist = multiply(nextDist, 1 / magnitude(nextDist));
      prevDist = multiply(prevDist, 1 / magnitude(prevDist));
      const nextNormal = rotate(nextDist, -Math.PI / 2);
      const prevNormal = rotate(prevDist, Math.PI / 2);
      let lo = vertRadius;
      let hi = maxRadius;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        const midPointNext = vectorCombine(points[i], multiply(nextDist, mid), multiply(nextNormal, edgeWidth));
        const midPointPrev = vectorCombine(points[i], multiply(prevDist, mid), multiply(prevNormal, edgeWidth));
        let midAngleNext = Math.atan2(midPointNext.y - points[i].y, midPointNext.x - points[i].x);
        let midAnglePrev = Math.atan2(midPointPrev.y - points[i].y, midPointPrev.x - points[i].x);
        if (midAngleNext < midAnglePrev) {
          midAngleNext += Math.PI * 2;
        }
        const midAngle = midAngleNext - midAnglePrev;
        if (midAngle > angle + 0.1) {
          // We aren't out enough, intersection is overlapping
          lo = mid;
        } else {
          // We could go further
          hi = mid;
        }
      }
      // We can go to `lo` for the points relating to prev->node->next.
      distances.push(lo);
    }
    for (let i=0; i<points.length; i++) {
      const next = points[(i+1) % points.length];
      const nextDist = distances[(i+1) % points.length];
      // From points[i] to points[i+1] straight line.
      let dist = vectorCombine(next, negate(points[i]));
      dist = multiply(dist, 1 / magnitude(dist));
      const normal = rotate(dist, -Math.PI / 2);
      const topPoint = vectorCombine(points[i], multiply(dist, distances[i]), multiply(normal, edgeWidth));
      const bottomPoint = vectorCombine(next, multiply(dist, -nextDist), multiply(normal, edgeWidth));
      beziers.push([
        topPoint,
        bottomPoint,
      ]);
      // From points[i+1] start to points[i+1] end.
      const nextNext = points[(i+2) % points.length];
      let dist2 = vectorCombine(nextNext, negate(next));
      dist2 = multiply(dist2, 1 / magnitude(dist2));
      const normal2 = rotate(dist2, -Math.PI / 2);
      const bottomPoint2 = vectorCombine(next, multiply(dist2, nextDist), multiply(normal2, edgeWidth));

      const bottomMoving = magnitude(vectorCombine(bottomPoint, negate(bottomPoint2)));
      if (bottomMoving > 5) {
        // We should circle around.
        let point1Angle = Math.atan2(bottomPoint.y - next.y, bottomPoint.x - next.x);
        let point2Angle = Math.atan2(bottomPoint2.y - next.y, bottomPoint2.x - next.x);
        if (point2Angle < point1Angle) {
          point2Angle += Math.PI * 2;
        }
        const midPointAngle = (point1Angle + point2Angle) / 2;
        const midPointVector = {
          x: Math.cos(midPointAngle),
          y: Math.sin(midPointAngle),
        }
        console.log(bottomMoving)
        beziers.push([
          bottomPoint,
          vectorCombine(next, multiply(midPointVector, 1.5 * vertRadius)),
          bottomPoint2,
        ]);
      } else {
        beziers.push([
          bottomPoint,
          bottomPoint2,
        ]);
      }

    }
    return beziers;
  }

  /*
  const graphContainer = new PIXI.Container();
  for (let outline of outlines) {
    const beziers = outlineBeziers(outline);
    const outlinePath = new DrawnBezierGroup({
      maxLineDist: 0.5,
      forcedDistance: 0.9,
      stroke: { color: black, width: 2 },
      smoothScaling: 0.15,
      points: 90,
    }, beziers, 1);
    graphContainer.addChild(outlinePath);
  }
  GS.screen.addChild(graphContainer);
  */
}

const unloader = () => {

}

const contentText = `
Flow.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('flow', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const flowContainer = document.querySelector('#flow');
  const steps = new StepScenes(flowContainer, 'flow', [{}], () => {}, true, null, {});
  registerScene(loader, unloader, 'flow', [], steps.makeOnSuccess(), steps.makeOnFailure());
}

export default addContent;
