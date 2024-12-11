import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { Node } from "../graph.js";
import { ImmediateTween, interpValue, ValueTween } from "../tween.js";
import { mergeDeep } from "../utils.js";
import { red } from '../colours.js';

const gsc = window.gameScaling ?? 1;

class NodeGroup extends PIXI.Container {
  static baseStyle = {
    node: {},
    frameWidth: 100 * gsc,
    maxSpacing: 50 * gsc,
    scaling: 0.8,
    textScaling: 1,
    cross: {
      visible: true,
      size: 15 * gsc,
      stroke: 5 * gsc,
      color: red,
    },
    animSpeed: 60,
  }

  constructor(style, graph, curNodes=[]) {
    super();
    this.style = mergeDeep({...NodeGroup.baseStyle}, style);
    this.nodeCopies = {};
    this.active = {};
    this.numNodes = Object.values(graph.nodes).length;
    Object.keys(graph.nodes).sort().forEach((key, i) => {
      const node = graph.nodes[key];
      this.nodeCopies[node.label] = new Node(
        node.label,
        this.calcPosition(curNodes.indexOf(node.label), curNodes.length),
        mergeDeep(
          {},
          node.style,
          {
            radius: node.style.radius * this.style.scaling,
            strokeWidth: node.style.strokeWidth * this.style.scaling,
          },
          this.style.node
        )
      )
      this.nodeCopies[node.label].labelText.scale.set(this.style.textScaling);
      this.nodeCopies[node.label].separatedGraphic.alpha = 0;
      this.nodeCopies[node.label].graphic.alpha = curNodes.includes(node.label) ? 1 : 0;
      this.active[node.label] = curNodes.includes(node.label);
      this.addChild(this.nodeCopies[node.label].graphic);
    });
    this.cross = new PIXI.Graphics();
    this.cross.alpha = (this.style.cross.visible && curNodes.length === 0) ? 1 : 0;
    const size = this.style.cross.size;
    this.cross
      .moveTo(-size, -size).lineTo(size, size)
      .moveTo(-size, size).lineTo(size, -size)
      .stroke({ color: this.style.cross.color, width: this.style.cross.stroke });
    this.addChild(this.cross);
  }

  setNodes(labelList, duration) {
    if (duration === undefined) {
      duration = this.style.animSpeed;
    }
    const sortedList = Object.keys(this.active).sort().filter((label) => labelList.includes(label));
    const valueSetting = new ImmediateTween(() => {
      const wasEmpty = Object.keys(this.active).every((label) => !this.active[label]);
      Object.keys(this.active).forEach((label) => {
        this.nodeCopies[label].startAlpha = this.nodeCopies[label].graphic.alpha;
        const was = this.active[label];
        const is = labelList.includes(label);
        if (was && !is) {
          this.active[label] = false;
        } else if (!was && is) {
          this.active[label] = true;
        }
        this.nodeCopies[label].startPosition = {...this.nodeCopies[label].position};
        this.nodeCopies[label].finalPosition = {
          x: this.nodeCopies[label].position.x,
          y: this.nodeCopies[label].position.y + 60 * gsc,
        };
        if (is) {
          this.nodeCopies[label].finalPosition = this.calcPosition(sortedList.indexOf(label), labelList.length);
          if (!was) {
            this.nodeCopies[label].startPosition = {
              x: this.nodeCopies[label].finalPosition.x,
              y: this.nodeCopies[label].finalPosition.y - 60 * gsc,
            };
          }
        }
      });
      const isEmpty = Object.keys(this.active).every((label) => !this.active[label]);
      this.cross.startAlpha = this.cross.alpha;
      this.cross.endAlpha = this.style.cross.visible && isEmpty ? 1 : 0;
      this.cross.startPosition = {x: 0, y: 0};
      this.cross.finalPosition = {x: 0, y: 0};
      if (wasEmpty && !isEmpty) {
        this.cross.finalPosition = {x: 0, y: 60 * gsc};
      } else if (!wasEmpty && isEmpty) {
        this.cross.startPosition = {x: 0, y: -60 * gsc};
      }
    })
    const fadeTween = new ValueTween(0, 1, duration, easings.easeInOutQuad, (v) => {
      Object.keys(this.active).forEach((label) => {
        const node = this.nodeCopies[label];
        node.graphic.alpha = interpValue(node.startAlpha, this.active[label] ? 1 : 0, v);
      })
    });
    const moveTween = new ValueTween(0, 1, duration, easings.easeInOutQuad, (v) => {
      Object.keys(this.active).forEach((label) => {
        const node = this.nodeCopies[label];
        const pos = interpValue(node.startPosition, node.finalPosition, v);
        node.moveTo(pos);
      })
    });
    const crossTween = new ValueTween(0, 1, duration, easings.easeInOutQuad, (v) => {
      this.cross.alpha = interpValue(this.cross.startAlpha, this.cross.endAlpha, v);
      const crossPos = interpValue(this.cross.startPosition, this.cross.finalPosition, v);
      this.cross.position.set(crossPos.x, crossPos.y);
    });
    return valueSetting.then(fadeTween, moveTween, crossTween);
  }

  toggleNode(label, duration=60) {
    const oldLabelList = Object.keys(this.active).filter((label) => this.active[label]);
    const labelList = oldLabelList.includes(label) ? oldLabelList.filter((l) => l !== label) : oldLabelList.concat([label]);
    return this.setNodes(labelList, duration);
  }

  calcPosition(i, visibleNodes) {
    const spacing = Math.min(this.style.maxSpacing, this.style.frameWidth / Math.max(1, visibleNodes-1));
    return { x: spacing * (0.5 + i - visibleNodes / 2), y: 0 }
  }
}

export default NodeGroup;
