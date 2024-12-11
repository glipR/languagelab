import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { black } from "../colours.js";
import { interpValue } from "../tween.js";
import { bezier, bezierLength, inverseBezierRateFunction, magnitude, mergeDeep, negate, partialBezier, vectorCombine } from "../utils.js";

const gsc = window.gameScaling ?? 1;

export class DrawnBezier extends PIXI.Graphics {
  constructor(fixStyle, bezier, drawnAmount=0) {
    super();
    this.fixStyle = mergeDeep({
      stroke: {
        width: 2 * gsc,
        color: black,
      },
      points: 10,
      maxLineDist: 10,
      forcedDistance: 0.5,
      scaleRandomsWithDrawnAmount: false,
      midPointDrawEasing: (t) => t,
      smooth: true,
      smoothScaling: 0.3,

    }, {...fixStyle});
    this.drawnAmount = drawnAmount;
    this.generateDrawnRandoms();
    this.setDrawnBezier(bezier);
  }

  updateStyle(fixStyle) {
    this.fixStyle = mergeDeep(this.fixStyle, fixStyle);
    this.updateDrawnGraphic();
  }

  setDrawnBezier(points) {
    this.drawnBezierPoints = points;
    this.generateFullBeziers();
    this.updateDrawnGraphic();
  }

  generateDrawnRandoms() {
    const length = this.fixStyle.points;
    const maxLineDist = this.fixStyle.maxLineDist;
    // How much of the line should be forced between random points
    // 1 means the line will have equidistant random points
    // 0 means the line could have all random points at the start or end
    const forcedDistance = this.fixStyle.forcedDistance;
    this.drawnRandoms = Array.from({length}, () => ({
      distance: (0.5 - Math.random()) * maxLineDist,
      position: Math.random() * (1 - forcedDistance),
    }));
    this.drawnRandoms.sort((a, b) => a.position - b.position);
    this.drawnRandoms = this.drawnRandoms.map((random, index) => ({
      ...random,
      position: random.position + ((index+0.5) / length) * forcedDistance,
    }));
  }

  getDrawnPoints () {
    const scaleRandomsWithDrawnAmount = this.fixStyle.scaleRandomsWithDrawnAmount;
    const midPointDrawEasing = this.fixStyle.midPointDrawEasing;
    const inverseRateFullBezier = inverseBezierRateFunction(...this.drawnBezierPoints)
    const transforms = this.drawnRandoms.map(({distance, position}) => {
      const t = position;
      const transform = bezier(inverseRateFullBezier(t), ...this.drawnBezierPoints);
      const scaledNormal = { x: -distance * Math.sin(transform.angle), y: distance * Math.cos(transform.angle) };
      return vectorCombine(transform.position, scaledNormal);
    });
    const finalIncluded = this.drawnRandoms.length - 1;
    const allPoints = [this.drawnBezierPoints[0]];
    if (finalIncluded !== -1) {
      allPoints.push(...transforms.slice(0, finalIncluded+1));
    }
    if (scaleRandomsWithDrawnAmount) {
      allPoints.push(bezier(1, ...this.drawnBezierPoints).position);
    } else {
      // Determine the straight line mid point of transforms[finalIncluded] and transforms[finalIncluded+1]
      if (-1 < finalIncluded && finalIncluded < this.drawnRandoms.length - 1) {
        const startTime = this.drawnRandoms[finalIncluded].position;
        const endTime = this.drawnRandoms[finalIncluded + 1].position;
        const ratioTime = midPointDrawEasing((1 - startTime) / (endTime - startTime));
        const endPoint = interpValue(transforms[finalIncluded], transforms[finalIncluded + 1], ratioTime);
        allPoints.push(endPoint);
      } else if (finalIncluded === -1) {
        const startTime = 0;
        const endTime = this.drawnRandoms[0].position;
        const ratioTime = midPointDrawEasing((1 - startTime) / (endTime - startTime));
        const endPoint = interpValue(this.drawnBezierPoints[0], transforms[0], ratioTime);
        allPoints.push(endPoint);
      } else {
        const startTime = this.drawnRandoms[finalIncluded].position;
        const endTime = 1;
        const ratioTime = midPointDrawEasing((1 - startTime) / (endTime - startTime));
        const endPoint = interpValue(transforms[finalIncluded], this.drawnBezierPoints[this.drawnBezierPoints.length-1], ratioTime);
        allPoints.push(endPoint);
      }
    }
    return allPoints;
  }

  generateFullBeziers() {
    const beziers = [];
    const points = this.getDrawnPoints();
    let controlVectors = points.slice(1, -1).map((_, index) => {
      const prevPoint = points[index];
      const nextPoint = points[index+2];
      const controlVector = vectorCombine(nextPoint, negate(prevPoint));
      return { x: controlVector.x * this.fixStyle.smoothScaling, y: controlVector.y * this.fixStyle.smoothScaling };
    });
    const firstControl = vectorCombine(points[1], negate(points[0]));
    const finalControl = vectorCombine(points[points.length-1], negate(points[points.length-2]));
    controlVectors = [
      { x: firstControl.x * this.fixStyle.smoothScaling, y: firstControl.y * this.fixStyle.smoothScaling },
      ...controlVectors,
      { x: finalControl.x * this.fixStyle.smoothScaling, y: finalControl.y * this.fixStyle.smoothScaling },
    ]
    for (let i=0; i<points.length-1; i++) {
      const controlOut = vectorCombine(points[i], controlVectors[i]);
      const controlIn = vectorCombine(points[i+1], negate(controlVectors[i+1]));
      beziers.push([points[i], controlOut, controlIn, points[i+1]]);
    }
    this.fullBeziers = beziers;
    this.bezierLengths = beziers.map(bezier => bezierLength(...bezier));
  }

  generateDrawnBeziers(t) {
    const beziers = this.fullBeziers;
    const bezierLengths = this.bezierLengths;
    const totalLength = bezierLengths.reduce((acc, length) => acc + length, 0);
    const targetLength = Math.ceil(Math.min(t+1e-9, 1-1e-9) * totalLength);
    const cumulativeLengths = bezierLengths.reduce((acc, length) => {
      acc.push(acc[acc.length-1] + length);
      return acc;
    }, [0]).slice(1);
    const filteredBeziers = beziers.filter((_, index) => index === 0 || cumulativeLengths[index-1] < targetLength);
    const finalRatio = (bezierLengths[filteredBeziers.length-1] - (cumulativeLengths[filteredBeziers.length-1] - targetLength))/bezierLengths[filteredBeziers.length-1];
    const finalRateFunc = inverseBezierRateFunction(...filteredBeziers[filteredBeziers.length-1]);
    filteredBeziers[filteredBeziers.length-1] = partialBezier(finalRateFunc(finalRatio), ...filteredBeziers[filteredBeziers.length-1]);
    return filteredBeziers;
  }

  edgeInterp(t) {
    t /= this.drawnAmount;
    t = Math.min(Math.max(t, 0), 1-1e-9);
    const beziers = this.generateDrawnBeziers(this.drawnAmount);
    const interpIndex = Math.floor(t * beziers.length);
    const interpRatio = t * beziers.length - interpIndex;
    return bezier(interpRatio, ...beziers[interpIndex]);
  }

  drawSmooth() {
    const beziers = this.generateDrawnBeziers(this.drawnAmount);
    this.clear();
    if (this.drawnAmount === 0) {
      return;
    }
    this.moveTo(beziers[0][0].x, beziers[0][0].y);
    for (const [_, controlOut, controlIn, point] of beziers) {
      this.bezierCurveTo(controlOut.x, controlOut.y, controlIn.x, controlIn.y, point.x, point.y);
    }
    this.stroke(this.fixStyle.stroke);
  }

  updateDrawnGraphic() {
    const points = this.getDrawnPoints(1);
    if (this.fixStyle.smooth) {
      this.drawSmooth();
    } else {
      this.clear();
      this.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => this.lineTo(point.x, point.y));
      this.stroke(this.fixStyle.stroke);
    }
  }

  copy() {
    // Same random same everything
    const bez = new DrawnBezier({...this.fixStyle}, this.drawnBezierPoints, this.drawnAmount);
    bez.drawnRandoms = this.drawnRandoms;
    bez.setDrawnBezier(this.drawnBezierPoints);
    return bez;
  }
}
