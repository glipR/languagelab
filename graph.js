import { interpValue, ValueTween, Tween } from './tween.js';
import { magnitude, vectorCombine, negate, bezier, partialBezier, mergeDeep } from './utils.js';
import { CircleCover, RectangleCover } from './tools/paper_cover.js';
import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { DrawnBezier } from './tools/drawnBezier.js';
import { black } from './colours.js';

const labelFontStyle = {
  fontFamily: 'Ittybittynotebook',
  fontSize: 32,
}

class Node {
  constructor(label, position, style) {
    this.label = label;
    this.position = position;
    this.style = {...style};

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
    this.circle.interactive = true;
    this.circle.buttonMode = true;

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
    this.labelText.text = this.style.showLabel ? this.label : '';
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
      const entryScale = this.style.entryScale ?? 1;
      const entryWidth = (this.style.entryWidth ?? this.style.strokeWidth) * entryScale;
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
    return {
      points: 6,
      maxLineDist: 6,
      forcedDistance: 0.8,
      stroke: {
        width: 5,
        color: black,
      },
      arrow: {
        direction: 'forward',
        position: 'end',
        size: 20,
        width: 5,
        endOffset: 30,
      }
    }
  }

  constructor(from, to, style) {
    this.from = from;
    this.to = to;
    this.style = {...this.baseStyle(), ...style};
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

  getEdgeStart() {
    return this.from.position;
  }

  getEdgeEnd() {
    return this.to.position;
  }

  edgeInterp(t) {
    const points = this.edgeLine.getDrawnPoints(t);
    const finalPoints = this.edgeLine.getDrawnPoints(1);
    return points.length === 1 ? {
      position: points[0],
      angle: bezier(0.5, points[0], finalPoints[1]).angle,
    } : {
      position: points[points.length-1],
      angle: bezier(0.5, points[points.length-2], points[points.length-1]).angle,
    };
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
      return this.edgeInterp(0.5);
    } else if (position === "end") {
      const t = Math.min(
        this.drawnAmount,
        this.findRadiusRatio(false, this.to.style.radius)
      );
      return {
        // Use the line position, but the pure bezier angle.
        position: this.edgeInterp(t).position,
        angle: this.bezierEdgeInterp(t).angle,
      }
    }
    throw new Error('Invalid position');
  }

  getLabelTransform() {
    const midTransform = this.bezierEdgeInterp(this.style.labelRatio ?? 0.5);
    const upsideDown = midTransform.angle > Math.PI / 2 || midTransform.angle < -Math.PI / 2;
    // Upside down? Flip it 180
    if (upsideDown) {
      midTransform.angle += midTransform.angle > 0 ? Math.PI : -Math.PI;
    }
    const normalOff = this.style.stroke.width * (this.style.edgeLabelOffset ?? 6);
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

  findRadiusRatio(start, radius) {
    // Binary searches to find the ratio of edgeInterp that sits on the radius.
    // Can be done from the start or end of the edge.
    let lo, hi;
    const comp = (v) => magnitude(vectorCombine(this.edgeInterp(v).position, negate((start ? this.from : this.to).position))) < radius;
    if (start) {
      lo = 0;
      hi = 0.5;
    } else {
      lo = 0.5;
      hi = 1;
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

  showLabelTween(duration, easing) {
    return new ValueTween(0, 1, duration, easing, (t) => {
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
      edgeAnchor: { x: 0, y: -75 },
      smooth: false,
    }
  }

  getBezierPoints() {
    const vertexMidpoint = interpValue(this.getEdgeStart(), this.getEdgeEnd(), 0.5);
    const anchorAngle = Math.atan2(this.style.edgeAnchor.y, this.style.edgeAnchor.x);
    const anchorOffset = {
      x: Math.cos(anchorAngle + Math.PI/2) * magnitude(this.style.edgeAnchor) * 2,
      y: Math.sin(anchorAngle + Math.PI/2) * magnitude(this.style.edgeAnchor) * 2,
    }
    const startDist = magnitude(vectorCombine(vertexMidpoint, this.style.edgeAnchor, anchorOffset, negate(this.getEdgeStart())));
    const endDist = magnitude(vectorCombine(vertexMidpoint, this.style.edgeAnchor, anchorOffset, negate(this.getEdgeEnd())));
    const start = this.getEdgeStart();
    const fullAnchor1 = vectorCombine(vertexMidpoint, this.style.edgeAnchor, startDist < endDist ? anchorOffset : negate(anchorOffset));
    const fullAnchor2 = vectorCombine(vertexMidpoint, this.style.edgeAnchor, startDist < endDist ? negate(anchorOffset) : anchorOffset);
    const fullEnd = this.getEdgeEnd();
    return [start, fullAnchor1, fullAnchor2, fullEnd];
  }

}

class LoopEdge extends AbstractEdge {

  baseStyle() {
    return {
      ...super.baseStyle(),
      loopOffset: { x: 0, y: -75 },
      loopAnchorMult: 0.8,
      points: 10,
      maxLineDist: 1.5,
      forcedDistance: 1,
      smoothScaling: 3,
    }
  }

  getBezierPoints() {
    const loopOffset = this.style.loopOffset ?? {x: 0, y: -75};
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
    Object.keys(json.nodes).forEach((label) => {
      const node = json.nodes[label];
      this.addNode(new Node(label, node.position, node.style));
    });
    json.edges.forEach((edge) => {
      this.addEdge(AbstractEdge.decide(this.nodes[edge.from], this.nodes[edge.to], edge.style));
    });
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
    this.edgeMap[`${edge.from.label}->${edge.to.label}`] = edge;
  }

  removeEdge(edge) {
    this.edgeContainer.removeChild(edge.graphic);
    this.edges = this.edges.filter((e) => e !== edge);
    delete this.edgeMap[`${edge.from.label}->${edge.to.label}`];
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
