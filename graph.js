import { interpValue, ValueTween, Tween } from './tween.js';
import { magnitude, vectorCombine, negate, bezier, partialBezier, mergeDeep, multiply, rotate } from './utils.js';
import { CircleCover, RectangleCover } from './tools/paper_cover.js';
import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { DrawnBezier } from './tools/drawnBezier.js';
import { bg_dark, black } from './colours.js';

const gsc = window.gameScaling ?? 1;

const labelFontStyle = {
  fontFamily: 'Ittybittynotebook',
  fontSize: 32 * gsc,
}

class Node {

  baseStyle() {
    return {
      radius: 30 * gsc,
      fill: bg_dark,
      strokeWidth: 3 * gsc,
      stroke: black,
      showLabel: true,
      entryWidth: 5 * gsc
    };
  }

  constructor(label, position, style) {
    this.label = label;
    this.position = position;
    this.style = {...this.baseStyle(), ...style};

    this.graphic = new PIXI.Container();
    this.circle = new PIXI.Graphics();
    this.graphic.addChild(this.circle);
    this.innerCircle = new PIXI.Graphics();
    this.graphic.addChild(this.innerCircle);
    this.labelText = new PIXI.Text({text: "", style: {...labelFontStyle, ...style.labelStyle ?? {}}});
    this.labelText.anchor.set(0.5, 0.5);
    this.graphic.addChild(this.labelText);
    this.entry = new PIXI.Graphics();
    this.graphic.addChild(this.entry);
    this.separatedGraphic = new PIXI.Container();
    this.nodeBG = new CircleCover(this.circle, {points: 10});
    this.separatedGraphic.addChild(this.nodeBG);
    this.onActions = {};
    this.circle.interactive = this.style.button !== false;
    this.circle.buttonMode = this.style.button !== false;

    this.updateGraphic();
  }

  destroy() {
    this.graphic.destroy();
  }

  subscribe(action, callback) {
    if (!(action in this.onActions)) {
      this.onActions[action] = [];
      this.circle.on(action, (e) => {
        this.onActions[action].forEach((callback) => callback(e));
      });
    }
    this.onActions[action].push(callback);
    // Ensure pointer cursor renders.
    this.updateClickable();
  }

  moveTo({ x, y }) {
    this.position.x = x;
    this.position.y = y;

    this.graphic.position.set(this.position.x, this.position.y);
    this.separatedGraphic.position.set(this.position.x, this.position.y);
  }

  updateGraphic() {
    this.circle.clear();
    this.innerCircle.clear();
    this.entry.clear();
    this.labelText.style = {...labelFontStyle, ...this.style.labelStyle ?? {}};
    this.labelText.text = this.style.showLabel ? (this.labelText.text ? this.labelText.text : this.label) : '';
    this.graphic.position.set(this.position.x, this.position.y);
    this.separatedGraphic.position.set(this.position.x, this.position.y);
    this.circle.circle(0, 0, this.style.radius);
    this.circle.fill(this.style.fill);
    this.circle.stroke({ color: this.style.stroke, width: this.style.strokeWidth});
    this.nodeBG.updateGraphic({ radius: this.style.radius });

    if (this.style.doubleBorder) {
      this.innerCircle.circle(0, 0, this.style.radius - 2 * this.style.strokeWidth);
      this.innerCircle.stroke({ color: this.style.stroke, width: this.style.strokeWidth});
    }
    if (this.style.isEntry) {
      const entryScale = (this.style.entryScale ?? 1) * gsc;
      const entryWidth = (this.style.entryWidth ?? this.style.strokeWidth) * entryScale / gsc;
      this.entry.setStrokeStyle({
        color: this.style.entryStroke ?? this.style.stroke,
        width: entryWidth
      });
      this.entry
        .moveTo(-this.style.radius - 15*entryScale, -15*entryScale)
        .lineTo(-this.style.radius - entryWidth/2, 0)
        .lineTo(-this.style.radius - 15*entryScale, +15*entryScale)
        .stroke();
      this.entry
        .moveTo(-this.style.radius - entryWidth/2, 0)
        .lineTo(-this.style.radius - 20*entryScale, 0)
        .stroke();
      this.entry
        .arc(-this.style.radius - 20*entryScale, -15*entryScale, 15*entryScale, Math.PI/2, Math.PI)
        .stroke();
    }
  }

  updateClickable() {
    this.circle.cursor = Object.keys(this.onActions).length > 0 ? 'pointer' : 'default';
  }

  tweenPop(duration) {
    return new ValueTween(0, 1, duration, easings.easeOutElastic, (t) => {
      this.graphic.scale.set(t);
      this.separatedGraphic.scale.set(t);
    }, () => {
      this.graphic.visible = true;
      this.separatedGraphic.visible = true;
      // Maybe do this idk
      // PIXI.sound.play('pick');
    }).during(new ValueTween(0, 1, duration, easings.easeOutCubic, (t) => {
      this.graphic.alpha = t;
      this.separatedGraphic.alpha = t;
    }));
  }

  tweenFade(duration, easing, start, end) {
    return new ValueTween(start, end, duration, easing, (t) => {
      this.graphic.visible = true;
      this.graphic.alpha = t;
    });
  }

  tweenColor(color, duration, easing) {
    return new ValueTween(0, 1, duration, easing, (value) => {
      this.style.fill = interpValue(this.startColor, color, value);
      this.updateGraphic();
    }, () => { this.startColor = this.style.fill });
  }
}

class AbstractEdge {

  baseStyle() {
    const dist = magnitude(vectorCombine(negate(this.from.position), this.to.position)) - (this.from.style?.radius ?? 0) - (this.to.style?.radius ?? 0);
    return {
      points: dist > 100 * gsc ? 6 : 3,
      maxLineDist: dist > 100 * gsc ? 6 * gsc : 3 * gsc,
      toRadius: false,
      forcedDistance: 0.8,
      stroke: {
        width: 5 * gsc,
        color: black,
      },
      arrow: {
        direction: 'forward',
        position: 'end',
        size: 20 * gsc,
        width: 5 * gsc,
      },
      edgeLabelOffset: 6,
      labelRatio: 0.5,
    }
  }

  constructor(from, to, style) {
    this.from = from;
    this.to = to;
    this.style = mergeDeep({...this.baseStyle()}, style);
    this.drawnAmount = 1;
    this.onActions = {};
    this.initGraphic();
    this.updateGraphic();
  }

  subscribe(action, callback) {
    if (!(action in this.onActions)) {
      this.onActions[action] = [];
      this.edgeLine.on(action, (e) => {
        this.onActions[action].forEach((callback) => callback(e));
      });
    }
    this.onActions[action].push(callback);
    // Ensure pointer cursor renders.
    this.updateClickable();
  }

  initGraphic() {
    this.graphic = new PIXI.Container();
    this.arrowGraphic = new PIXI.Graphics();
    this.labelText = new PIXI.Text({text: "", style: {...labelFontStyle, ...this.style.labelStyle ?? {}}});
    this.labelText.anchor.set(0.5, 0.5);
    this.labelBG = new RectangleCover(this.labelText, {points: 12});
    this.labelBG.alpha = 0;
    this.graphic.addChild(this.labelBG);
    this.graphic.addChild(this.arrowGraphic);
    this.graphic.addChild(this.labelText);
    this.edgeLine = new DrawnBezier(this.style, this.getBezierPoints(), this.drawnAmount);
    this.graphic.addChild(this.edgeLine);
    this.clickableEdge = new PIXI.GraphicsContext();
    // Assign clickableEdge to hitArea of edgeLine.
    this.edgeLine.interactive = true;
    this.edgeLine.buttonMode = true;
    this.edgeLine.hitArea = {
      contains: (x, y) => {
        const labelTransform = this.getLabelTransform();
        const fgLocal = {
          x: (x - labelTransform.position.x) * Math.cos(-labelTransform.angle) - (y - labelTransform.position.y) * Math.sin(-labelTransform.angle),
          y: (x - labelTransform.position.x) * Math.sin(-labelTransform.angle) + (y - labelTransform.position.y) * Math.cos(-labelTransform.angle),
        }
        return (
          this.clickableEdge.containsPoint({x, y}) ||
          (this.style.edgeLabel && this.labelBG.fg.containsPoint(fgLocal))
        );
      }
    }
  }

  destroy() {
    this.graphic.destroy();
  }

  getEdgeStartCenter() {
    return this.from.graphic?.position ?? this.from.position;
  }

  getEdgeEndCenter() {
    return this.to.graphic?.position ?? this.to.position;
  }

  getEdgeStart() {
    const centerFrom = this.getEdgeStartCenter();
    if (this.style.toRadius) {
      const wanted = this.getEdgeEndCenter();
      const towards = vectorCombine(negate(centerFrom), wanted);
      return vectorCombine(centerFrom, multiply(towards, this.from.style.radius / magnitude(towards)));
    }
    return centerFrom;
  }

  getEdgeEnd() {
    const centerTo = this.getEdgeEndCenter();
    if (this.style.toRadius) {
      const wanted = this.getEdgeStartCenter();
      const towards = vectorCombine(negate(centerTo), wanted);
      return vectorCombine(centerTo, multiply(towards, this.to.style.radius / magnitude(towards)));
    }
    return centerTo;
  }

  edgeInterp(t) {
    return this.edgeLine.edgeInterp(t);
  }

  bezierEdgeInterp(t) {
    // Interpolates on the original bezier points, rather than the drawn points.
    const points = this.getBezierPoints();
    return bezier(t, ...points);
  }

  getBezierPoints() {
    throw new Error('Not implemented');
  }

  getArrowTransform(position) {
    if (position === "middle") {
      return this.edgeInterp(0.5 * this.drawnAmount);
    } else if (position === "end") {
      const interp = this.findRadiusRatio(false, this.to.style.radius);
      const t = Math.min(
        this.drawnAmount,
        // Only consider this interp if it's actually in the second half of the edge.
        interp > 0.5 ? interp : 1
      );
      return this.edgeInterp(t);
    }
    throw new Error('Invalid position');
  }

  getLabelTransform() {
    const midTransform = this.bezierEdgeInterp(this.style.labelRatio);
    const upsideDown = midTransform.angle > Math.PI / 2 || midTransform.angle < -Math.PI / 2;
    // Upside down? Flip it 180
    if (upsideDown) {
      midTransform.angle += midTransform.angle > 0 ? Math.PI : -Math.PI;
    }
    const normalOff = this.style.stroke.width * (this.style.edgeLabelOffset);
    const offsetAngle = midTransform.angle + Math.PI / 2;
    return {
      position: {
        x: (
          midTransform.position.x
          - Math.cos(offsetAngle) * normalOff
        ),
        y: (
          midTransform.position.y
          - Math.sin(offsetAngle) * normalOff
        ),
      },
      angle: midTransform.angle,
    }
  }

  findRadiusRatio(start, radius, interpFunc, drawnAmount) {
    // Binary searches to find the ratio of edgeInterp that sits on the radius.
    interpFunc = interpFunc === undefined ? ((v) => this.edgeInterp(v).position) : interpFunc;
    drawnAmount = drawnAmount === undefined ? this.drawnAmount : drawnAmount;
    // Can be done from the start or end of the edge.
    let lo, hi;
    const comp = (v) => magnitude(vectorCombine(interpFunc(v), negate(start ? this.getEdgeStartCenter() : this.getEdgeEndCenter()))) < radius;
    if (start) {
      lo = 0;
      hi = 0.5 * drawnAmount;
    } else {
      lo = 0.5 * drawnAmount;
      hi = 1 * drawnAmount;
    }
    while (hi - lo > 1e-6) {
      const mid = (lo + hi) / 2;
      if (comp(mid) == comp(lo)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  updateGraphic() {
    this.updateLine();
    this.updateArrow();
    this.updateLabel();
    this.updateClickable();
  }

  updateLine() {
    this.edgeLine.drawnAmount = this.drawnAmount;
    this.edgeLine.setDrawnBezier(this.getBezierPoints());
    this.edgeLine.updateDrawnGraphic();
  }

  updateClickable() {
    const points = this.edgeLine.getDrawnPoints(this.drawnAmount);
    this.clickableEdge.clear();
    this.clickableEdge.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => {
      this.clickableEdge.lineTo(point.x, point.y);
    });
    this.clickableEdge
      .stroke({width: this.style.clickWidth ?? (3 * this.style.stroke.width)});
    this.edgeLine.cursor = Object.keys(this.onActions).length > 0 ? 'pointer' : 'default';
  }

  updateArrow() {
    this.arrowGraphic.clear();
    if (!this.style.arrow || this.drawnAmount === 0) return;

    const arrowStyle = this.style.arrow;
    const arrowWidth = arrowStyle.width;
    const arrowSize = arrowStyle.size;
    const arrowStroke = arrowStyle.stroke ?? this.style.stroke.color;
    const arrowTransform = this.getArrowTransform(arrowStyle.position);

    if (arrowStyle.position === "middle") {
      // The arrowTransform is where the tip of the arrow will be.
      // So move the arrowTransform forward by half the arrowSize.
      arrowTransform.position.x += Math.cos(arrowTransform.angle) * arrowSize / 4;
      arrowTransform.position.y += Math.sin(arrowTransform.angle) * arrowSize / 4;
    }

    this.arrowGraphic
          .moveTo(
            arrowTransform.position.x - Math.cos(arrowTransform.angle - Math.PI / 6) * arrowSize,
            arrowTransform.position.y - Math.sin(arrowTransform.angle - Math.PI / 6) * arrowSize
          )
          .lineTo(arrowTransform.position.x, arrowTransform.position.y)
          .lineTo(
            arrowTransform.position.x - Math.cos(arrowTransform.angle + Math.PI / 6) * arrowSize,
            arrowTransform.position.y - Math.sin(arrowTransform.angle + Math.PI / 6) * arrowSize
          )
          .stroke({ width: arrowWidth, color: arrowStroke});
  }

  updateLabel() {
    this.labelBG.clear();
    if (!this.style.edgeLabel || this.drawnAmount === 0) {
      this.labelText.text = "";
      return;
    }
    this.labelText.text = this.style.edgeLabel;
    this.labelText.style = {...labelFontStyle, ...this.style.labelStyle ?? {}};
    const labelTransform = this.getLabelTransform();
    this.labelText.position.set(labelTransform.position.x, labelTransform.position.y);
    this.labelText.rotation = labelTransform.angle;
    this.labelBG.position.set(labelTransform.position.x, labelTransform.position.y);
    this.labelBG.rotation = labelTransform.angle;
    this.labelBG.updateGraphic();
  }

  updateStyle(style) {
    this.style = mergeDeep(this.style, style);
    this.edgeLine.updateStyle(this.style);
    // TODO: Add an onStyleChange event that subclasses attach to instead.
    // Don't call updateGraphic, as this will mean multiple updateGraphic calls.
    this.updateGraphic();
  }

  static decide(from, to, style) {
    if (style.edgeAnchor) {
      return new CurveEdge(from, to, style);
    }
    if (from.label === to.label) {
      return new LoopEdge(from, to, style);
    }
    return new StraightEdge(from, to, style);
  }

  growEdgeTween(duration, easing) {
    return new ValueTween(0, 1, duration, easing, (t) => {
      this.drawnAmount = t;
      this.updateGraphic();
    });
  }

  hideEdgeTween(duration, easing) {
    return new ValueTween(0, 1, duration, easing, (t) => {
      this.drawnAmount = interpValue(this.startingDrawnAmount, this.endingDrawnAmount, t);
      this.updateGraphic();
    }, () => {
      this.startingDrawnAmount = this.drawnAmount;
      this.endingDrawnAmount = 0;
    });
  }

  showLabelTween(duration, easing) {
    return new ValueTween(0, 1, duration, easing, (t) => {
      this.labelText.alpha = t;
      this.labelBG.alpha = t;
    });
  }

  hideLabelTween(duration, easing) {
    return new ValueTween(1, 0, duration, easing, (t) => {
      this.labelText.alpha = t;
      this.labelBG.alpha = t;
    });
  }

  colorEdgeTween(color, duration, easing, colorLabels) {
    const strokeTween = new ValueTween(0, 1, duration, easing, (value) => {
      this.updateStyle({ stroke: { color: interpValue(this.oldColor, color, value) } });
    }, () => { this.oldColor = this.style.stroke.color });
    if (colorLabels !== undefined) {
      strokeTween.during(new ValueTween(0, 1, duration, easing, (value) => {
        this.updateStyle({ labelStyle: { fill: interpValue(this.oldStyle.fill ?? new PIXI.Color(0), this.newStyle.fill, value) } });
      }, () => { this.oldStyle = {...this.style.labelStyle}; this.style.labelStyle = {...this.oldStyle}; this.newStyle = {...this.style.labelStyle, fill: color} }));
    }
    return strokeTween;
  }
}

class StraightEdge extends AbstractEdge {

  getBezierPoints() {
    return [this.getEdgeStart(), this.getEdgeEnd()];
  }

}

class CurveEdge extends AbstractEdge {

  baseStyle() {
    return {
      ...super.baseStyle(),
      edgeAnchor: { x: 0, y: -75 * gsc },
      anchorOffsetMult: 0.25,
    }
  }

  getEdgeStart() {
    if (this.style.toRadius) {
      const bezierPoints = this.getBezierPoints(true);
      const interp = this.findRadiusRatio(true, this.from.style.radius, (v) => bezier(v, ...bezierPoints).position, 1);
      return bezier(interp, ...bezierPoints).position;
    }
    return this.getEdgeStartCenter();
  }

  getEdgeEnd() {
    if (this.style.toRadius) {
      const bezierPoints = this.getBezierPoints(true);
      const func = (v) => bezier(v, ...bezierPoints).position;
      const interp = this.findRadiusRatio(false, this.to.style.radius, func, 1);
      return bezier(interp, ...bezierPoints).position;
    }
    return this.getEdgeEndCenter();
  }

  getBezierPoints(forceCenter=false) {
    const start = forceCenter ? this.getEdgeStartCenter() : this.getEdgeStart();
    const end = forceCenter ? this.getEdgeEndCenter() : this.getEdgeEnd();
    const centerStart = this.getEdgeStartCenter();
    const centerEnd = this.getEdgeEndCenter();
    const vertexMidpoint = interpValue(centerStart, centerEnd, 0.5);
    const anchorAngle = Math.atan2(this.style.edgeAnchor.y, this.style.edgeAnchor.x);
    const startDistFromAnchor = magnitude(vectorCombine(vertexMidpoint, this.style.edgeAnchor, negate(start)));
    const endDistFromAnchor = magnitude(vectorCombine(vertexMidpoint, this.style.edgeAnchor, negate(end)));
    const anchorOffset = {
      x: Math.cos(anchorAngle + Math.PI/2) * this.style.anchorOffsetMult,
      y: Math.sin(anchorAngle + Math.PI/2) * this.style.anchorOffsetMult,
    }
    const start1 = magnitude(vectorCombine(vertexMidpoint, this.style.edgeAnchor, anchorOffset, negate(centerStart)));
    const start2 = magnitude(vectorCombine(vertexMidpoint, this.style.edgeAnchor, negate(anchorOffset), negate(centerStart)));
    const fullAnchor1 = vectorCombine(vertexMidpoint, this.style.edgeAnchor, multiply(start1 < start2 ? anchorOffset : negate(anchorOffset), startDistFromAnchor));
    const fullAnchor2 = vectorCombine(vertexMidpoint, this.style.edgeAnchor, multiply(start1 < start2 ? negate(anchorOffset) : anchorOffset, endDistFromAnchor));
    return [start, fullAnchor1, fullAnchor2, end];
  }

}

class LoopEdge extends AbstractEdge {

  baseStyle() {
    return {
      ...super.baseStyle(),
      loopOffset: { x: 0, y: -75 * gsc },
      loopAnchorMult: 0.8,
      points: 10,
      maxLineDist: 0.7 * gsc,
      forcedDistance: 0.8,
      smoothScaling: 0.1,
    }
  }

  getEdgeStart() {
    const center = this.getEdgeStartCenter();
    if (this.style.toRadius) {
      const loopOffset = this.style.loopOffset;
      const rotated = rotate(loopOffset, -Math.PI/8);
      return vectorCombine(center, multiply(rotated, this.from.style.radius / magnitude(rotated)));
    }
    return center;
  }

  getEdgeEnd() {
    const center = this.getEdgeEndCenter();
    if (this.style.toRadius) {
      const loopOffset = this.style.loopOffset;
      const rotated = rotate(loopOffset, +Math.PI/8);
      return vectorCombine(center, multiply(rotated, this.to.style.radius / magnitude(rotated)));
    }
    return center;
  }

  getBezierPoints() {
    const loopOffset = this.style.loopOffset;
    const loopAngle = Math.atan2(loopOffset.y, loopOffset.x);
    const midLoop = interpValue(this.getEdgeStart(), this.getEdgeEnd(), 0.5);
    const anchorPoint = {
      x: midLoop.x + loopOffset.x * 1.4,
      y: midLoop.y + loopOffset.y * 1.4
    }
    const controlOffset = {
      x: Math.cos(loopAngle + Math.PI / 2) * magnitude(loopOffset) * (this.style.loopAnchorMult ?? 0.8),
      y: Math.sin(loopAngle + Math.PI / 2) * magnitude(loopOffset) * (this.style.loopAnchorMult ?? 0.8)
    }
    return [
      this.getEdgeStart(),
      vectorCombine(anchorPoint, negate(controlOffset)),
      vectorCombine(anchorPoint, controlOffset),
      this.getEdgeEnd(),
    ]
  }

}


class Graph {

  static baseNodeStyle = { radius: 30 * gsc, fill: bg_dark, strokeWidth: 3 * gsc, stroke: black, showLabel: true, entryWidth: 5 * gsc };
  static baseEdgeStyle = (lab) => ({ edgeLabel: lab });

  constructor() {
    this.graph = new PIXI.Container();
    this.nodeContainer = new PIXI.Container();
    this.edgeContainer = new PIXI.Container();
    this.BGContainer = new PIXI.Container();
    this.graph.addChild(this.BGContainer);
    this.graph.addChild(this.edgeContainer);
    this.graph.addChild(this.nodeContainer);
    this.nodes = {};
    this.edges = [];
    this.edgeMap = {};
  }

  changeNodeLabel(oldLabel, newLabel) {
    this.nodes[newLabel] = this.nodes[oldLabel];
    delete this.nodes[oldLabel];
    this.nodes[newLabel].label = newLabel;
    this.nodes[newLabel].labelText.text = newLabel;
    this.nodes[newLabel].updateGraphic();
  }

  changeEdgeLabel(edge, newLabel) {
    edge.style.edgeLabel = newLabel;
    edge.updateGraphic();
  }

  swapEdge(oldEdge, newEdge) {
    this.removeEdge(oldEdge);
    this.addEdge(newEdge);
  }

  updateEdges(node) {
    this.edges.forEach((edge) => {
      if (edge.from === node || edge.to === node) {
        edge.updateGraphic();
      }
    });
  }

  fromJSON(json) {
    const nodeStyle = Graph.baseNodeStyle ?? {};
    const edgeStyle = Graph.baseEdgeStyle ?? {};
    Object.keys(json.nodes).forEach((key) => {
      this.addNode(new Node(key, {
        x: json.nodes[key].x,
        y: json.nodes[key].y,
      }, mergeDeep({...Graph.baseNodeStyle}, nodeStyle, json.nodes[key].style ?? {}, {
        isEntry: json.nodes[key].start,
        doubleBorder: json.nodes[key].accepting,
      })));
    });
    json.edges.forEach((edge) => {
      this.addEdge(AbstractEdge.decide(this.nodes[edge.from], this.nodes[edge.to], mergeDeep({...Graph.baseEdgeStyle(edge.label)}, edgeStyle, edge.style ?? {}, {
        label: edge.label,
      })))}
    );
  }

  toJSON() {
    const json = {nodes: {}, edges: []};
    Object.values(this.nodes).forEach((node) => {
      json.nodes[node.label] = {
        x: node.position.x,
        y: node.position.y,
        start: !!node.style.isEntry,
        accepting: !!node.style.doubleBorder,
      };
    });
    this.edges.forEach((edge) => {
      const edgeStyle = {};
      if (edge.style.edgeAnchor) {
        edgeStyle.edgeAnchor = edge.style.edgeAnchor;
        edgeStyle.anchorOffsetMult = edge.style.anchorOffsetMult;
      }
      if (edge.style.loopOffset) {
        edgeStyle.loopOffset = edge.style.loopOffset;
        edgeStyle.loopAnchorMult = edge.style.loopAnchorMult;
      }
      json.edges.push({
        from: edge.from.label,
        to: edge.to.label,
        label: edge.style.edgeLabel,
        style: {},
      });
    });
    return json;
  }

  export() {
    return {
      states: Object.values(this.nodes).map((node) => ({
        name: node.label,
        position: { x: node.position.x, y: node.position.y },
        accepting: !!node.style.doubleBorder,
        starting: !!node.style.isEntry,
      })),
      alphabet: this.collectAlphabet?.(),
      transitions: this.edges.map((edge) => {
        const e = {
          from: edge.from.label,
          to: edge.to.label,
          label: edge.style.edgeLabel,
          style: {},
        }
        if (edge.style.edgeAnchor) {
          e.style.edgeAnchor = edge.style.edgeAnchor;
        }
        if (edge.style.loopOffset) {
          e.style.loopOffset = edge.style.loopOffset;
        }
        return e;
      }),
    }
  }

  import(data) {
    const get = (obj, key) => {
      try {
        return obj.get(key);
      } catch (e) {
        return obj[key];
      }
    }
    const json = {
      nodes: {},
      edges: [],
    }
    get(data, "states").forEach((state) => {
      json.nodes[get(state, 'name')] = {
        x: get(state, 'position')?.x ?? 0,
        y: get(state, 'position')?.y ?? 0,
        start: get(state, 'starting'),
        accepting: get(state, 'accepting'),
        style: get(state, 'style') ?? {},
      }
    });
    get(data, "transitions").forEach((transition) => {
      const e = {
        from: get(transition, 'from'),
        to: get(transition, 'to'),
        label: get(transition, 'label'),
        style: get(transition, 'style') ?? {},
      };
      if (get(transition, 'style')?.edgeAnchor) {
        e.style.edgeAnchor = get(transition, 'style').edgeAnchor;
      }
      if (transition.style?.loopOffset) {
        e.style.loopOffset = get(transition, 'style').loopOffset;
      }
      json.edges.push(e);
    });
    this.fromJSON(json);
  }

  clear() {
    this.edges.forEach((edge) => this.removeEdge(edge));
    Object.keys(this.nodes).forEach((label) => this.removeNode(this.nodes[label]));
  }

  addNode(node) {
    this.nodes[node.label] = node;
    this.nodeContainer.addChild(node.graphic);
    this.BGContainer.addChild(node.separatedGraphic);
  }

  addEdge(edge) {
    this.edges.push(edge);
    this.edgeContainer.addChild(edge.graphic);
    edge.labelKey = `${edge.from.label}->${edge.to.label}`
    this.edgeMap[edge.labelKey] = edge;
  }

  removeEdge(edge) {
    this.edgeContainer.removeChild(edge.graphic);
    this.edges = this.edges.filter((e) => e !== edge);
    delete this.edgeMap[edge.labelKey];
    edge.destroy();
  }

  removeNode(node) {
    this.nodeContainer.removeChild(node.graphic);
    this.BGContainer.removeChild(node.separatedGraphic);
    delete this.nodes[node.label];
    for (let edge of this.edges) {
      if (edge.from.label === node.label || edge.to.label === node.label) {
        this.removeEdge(edge);
      }
    }
    node.destroy();
  }

}

export { Node, AbstractEdge, StraightEdge, CurveEdge, LoopEdge, Graph };

export default Graph;
