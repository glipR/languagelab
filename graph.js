import { interpValue, ValueTween, Tween } from './tween.js';
import { magnitude, vectorCombine, negate, bezier, partialBezier } from './utils.js';
import { CircleCover, RectangleCover } from './tools/paper_cover.js';
import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';

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
  constructor(from, to, style) {
    this.from = from;
    this.to = to;
    this.style = {...style};
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
    this.edgeLine = new PIXI.Graphics();
    this.graphic.addChild(this.edgeLine);
    this.clickableEdge = new PIXI.GraphicsContext();
    // Assign clickableEdge to hitArea of edgeLine.
    this.edgeLine.interactive = true;
    this.edgeLine.buttonMode = true;
    this.edgeLine.hitArea = {
      contains: (x, y) => {
        return this.clickableEdge.containsPoint({x, y});
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
    throw new Error('Not implemented');
  }

  getArrowTransform(position) {
    throw new Error('Not implemented');
  }

  getLabelTransform(position) {
    throw new Error('Not implemented');
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

  updateArrow() {
    this.arrowGraphic.clear();
    if (!this.style.arrow || this.drawnAmount === 0) return;

    const arrowStyle = this.style.arrow;
    const arrowWidth = arrowStyle.width;
    const arrowSize = arrowStyle.size;
    const arrowStroke = arrowStyle.stroke ?? this.style.stroke;
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

  static decide(from, to, style) {
    if (style.edgeAnchor) {
      return new CurveEdge(from, to, style);
    }
    if (from === to) {
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
      this.style.stroke = interpValue(this.oldColor, color, value);
      this.updateGraphic();
    }, () => { this.oldColor = this.style.stroke });
    if (colorLabels !== undefined) {
      strokeTween.during(new ValueTween(0, 1, duration, easing, (value) => {
        this.style.labelStyle.fill = interpValue(this.oldStyle.fill ?? new PIXI.Color(0), this.newStyle.fill, value);
        this.updateGraphic();
      }, () => { this.oldStyle = {...this.style.labelStyle}; this.style.labelStyle = {...this.oldStyle}; this.newStyle = {...this.style.labelStyle, fill: color} }));
    }
    return strokeTween;
  }
}

class StraightEdge extends AbstractEdge {

  edgeInterp(t) {
    const diff = this.diff().angle;
    return {
      position: interpValue(this.getEdgeStart(), this.getEdgeEnd(), t),
      angle: diff,
    }
  }

  drawnEdgeStart() {
    const diff = {
      x: this.getEdgeEnd().x - this.getEdgeStart().x,
      y: this.getEdgeEnd().y - this.getEdgeStart().y,
    }
    const diffAngle = Math.atan2(diff.y, diff.x);
    return {
      x: this.getEdgeStart().x + Math.cos(diffAngle) * this.from.style.radius,
      y: this.getEdgeStart().y + Math.sin(diffAngle) * this.from.style.radius,
    }
  }

  drawnEdgeEnd() {
    const diffAngle = this.diff().angle
    const actualEnd = {
      x: this.getEdgeEnd().x - Math.cos(diffAngle) * this.to.style.radius,
      y: this.getEdgeEnd().y - Math.sin(diffAngle) * this.to.style.radius,
    }
    return interpValue(this.drawnEdgeStart(), actualEnd, this.drawnAmount);
  }

  diff() {
    const diff = {
      x: this.getEdgeEnd().x - this.getEdgeStart().x,
      y: this.getEdgeEnd().y - this.getEdgeStart().y,
    }
    return {
      magnitude: magnitude(diff),
      angle: Math.atan2(diff.y, diff.x),
      vector: diff,
    }
  }

  preDrawLine(graphics) {
    graphics.clear();
    const start = this.drawnEdgeStart();
    const end = this.drawnEdgeEnd();
    graphics
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y);
  }

  updateLine() {
    this.preDrawLine(this.edgeLine);
    this.edgeLine
      .stroke({width: this.style.lineWidth, color: this.style.stroke});
  }

  updateClickable() {
    this.preDrawLine(this.clickableEdge);
    this.clickableEdge
      .stroke({width: this.style.clickWidth ?? (3 * this.style.lineWidth)});
    this.edgeLine.cursor = Object.keys(this.onActions).length > 0 ? 'pointer' : 'default';
  }

  getArrowTransform(position) {
    const arrowAngle = this.diff().angle;
    if (position === "middle") {
      return {
        position: interpValue(this.drawnEdgeStart(), this.drawnEdgeEnd(), 0.5),
        angle: arrowAngle,
      }
    } else if (position === "end") {
      return {
        position: this.drawnEdgeEnd(),
        angle: arrowAngle,
      }
    }
    throw new Error('Invalid position');
  }

  getLabelTransform() {
    let lineAngle = this.diff().angle;
    const upsideDown = lineAngle > Math.PI / 2 || lineAngle < -Math.PI / 2;
    // Upside down? Flip it 180
    if (upsideDown) {
      lineAngle += lineAngle > 0 ? Math.PI : -Math.PI;
    }
    const normalOff = this.style.lineWidth * (this.style.edgeLabelOffset ?? 6);
    const offsetAngle = lineAngle + Math.PI / 2;
    const startPoint = this.edgeInterp(this.style.labelRatio ?? 0.5).position;
    return {
      position: {
        x: (
          startPoint.x
          - Math.cos(offsetAngle) * normalOff
        ),
        y: (
          startPoint.y
          - Math.sin(offsetAngle) * normalOff
        ),
      },
      angle: lineAngle,
    }
  }

}

class CurveEdge extends AbstractEdge {

  getPartialBezierPoints(t) {
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

    return partialBezier(t, start, fullAnchor1, fullAnchor2, fullEnd);
  }

  edgeInterp(t) {
    return bezier(t, ...this.getPartialBezierPoints(1));
  }

  preDrawLine(graphics) {
    graphics.clear();
    const [start, anchor1, anchor2, end] = this.getPartialBezierPoints(this.drawnAmount);
    graphics.moveTo(start.x, start.y)
    graphics.bezierCurveTo(
      anchor1.x, anchor1.y,
      anchor2.x, anchor2.y,
      end.x, end.y,
    );
  }

  updateLine() {
    this.preDrawLine(this.edgeLine);
    this.edgeLine.stroke({width: this.style.lineWidth, color: this.style.stroke});
  }

  updateClickable() {
    this.preDrawLine(this.clickableEdge);
    this.clickableEdge.stroke({width: this.style.clickWidth ?? (3 * this.style.lineWidth)});
    this.edgeLine.cursor = Object.keys(this.onActions).length > 0 ? 'pointer' : 'default';
  }

  getArrowTransform(position) {
    if (position === "middle") {
      return this.edgeInterp(0.5);
    } else if (position === "end") {
      return this.edgeInterp(Math.min(this.drawnAmount, this.findRadiusRatio(false, this.to.style.radius)));
    }
    throw new Error(`Invalid position ${position}`);
  }

  getLabelTransform() {
    const midTransform = this.edgeInterp(this.style.labelRatio ?? 0.5);
    const upsideDown = midTransform.angle > Math.PI / 2 || midTransform.angle < -Math.PI / 2;
    // Upside down? Flip it 180
    if (upsideDown) {
      midTransform.angle += midTransform.angle > 0 ? Math.PI : -Math.PI;
    }
    const normalOff = this.style.lineWidth * (this.style.edgeLabelOffset ?? 6);
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

}

class LoopEdge extends AbstractEdge {

  bezierLines(t) {
    const loopOffset = this.style.loopOffset ?? {x: 0, y: -75};
    const loopAngle = Math.atan2(loopOffset.y, loopOffset.x);
    const startLoop = this.getEdgeStart();
    const anchorPoint = {
      x: startLoop.x + loopOffset.x,
      y: startLoop.y + loopOffset.y
    }
    const controlOffset = {
      x: Math.cos(loopAngle + Math.PI / 2) * magnitude(loopOffset) * (this.style.loopAnchorMult ?? 0.3),
      y: Math.sin(loopAngle + Math.PI / 2) * magnitude(loopOffset) * (this.style.loopAnchorMult ?? 0.3)
    }
    const controlCenter = interpValue(startLoop, anchorPoint, 0.8);

    const line1 = partialBezier(Math.min(2*t, 1),
      startLoop,
      vectorCombine(controlCenter, negate(controlOffset)),
      vectorCombine(anchorPoint, negate(controlOffset)),
      anchorPoint,
    );
    const line2 = partialBezier(Math.max(2*t - 1, 0),
      anchorPoint,
      vectorCombine(anchorPoint, controlOffset),
      vectorCombine(controlCenter, controlOffset),
      startLoop,
    );
    if (t < 0.5) {
      return [line1];
    } return [line1, line2];
  }

  edgeInterp(t) {
    const lines = this.bezierLines(1);
    if (t < 0.5) {
      return bezier(2*t, ...lines[0]);
    }
    return bezier(2*t - 1, ...lines[1]);
  }

  preDrawLine(graphics) {
    const lines = this.bezierLines(this.drawnAmount);
    graphics.clear();
    graphics.moveTo(lines[0][0].x, lines[0][0].y);
    for (let i = 0; i < lines.length; i++) {
      graphics.bezierCurveTo(
        lines[i][1].x, lines[i][1].y,
        lines[i][2].x, lines[i][2].y,
        lines[i][3].x, lines[i][3].y,
      )
    }
  }

  updateLine() {
    this.preDrawLine(this.edgeLine);
    this.edgeLine.stroke({width: this.style.lineWidth, color: this.style.stroke});
  }

  updateClickable() {
    this.preDrawLine(this.clickableEdge);
    this.clickableEdge.stroke({width: this.style.clickWidth ?? (3 * this.style.lineWidth)});
    this.edgeLine.cursor = Object.keys(this.onActions).length > 0 ? 'pointer' : 'default';
  }

  getArrowTransform(position) {
    if (position === "middle") {
      const transform = this.edgeInterp(0.5)
      return {
        position: vectorCombine(transform.position, this.style?.arrow?.offsetPosition ?? { x: 0, y: 0}),
        angle: transform.angle,
      }
    } else if (position === "end") {
      return this.edgeInterp(Math.min(this.drawnAmount, this.findRadiusRatio(false, this.from.style.radius)));
    }
    throw new Error(`Invalid position ${position}`);
  }

  getLabelTransform() {
    const midTransform = this.edgeInterp(this.style.labelRatio ?? 0.5);
    const upsideDown = midTransform.angle > Math.PI / 2 || midTransform.angle < -Math.PI / 2;
    // Upside down? Flip it 180
    if (upsideDown) {
      midTransform.angle += midTransform.angle > 0 ? Math.PI : -Math.PI;
    }
    const normalOff = this.style.lineWidth * (this.style.edgeLabelOffset ?? 6);
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
