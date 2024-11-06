import { black } from "../colours.js";
import { interpValue } from "../tween.js";
import { bezier, combineEasing, magnitude, mergeDeep, negate, vectorCombine } from "../utils.js";

export class DrawnBezier extends PIXI.Graphics {
  constructor(fixStyle, bezier, drawnAmount=0) {
    super();
    this.fixStyle = mergeDeep({
      stroke: {
        width: 2,
        color: black,
      },
      points: 10,
      maxLineDist: 10,
      forcedDistance: 0.5,
      scaleRandomsWithDrawnAmount: false,
      midPointDrawEasing: (t) => t,
      smooth: true,
      smoothScaling: 10,

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

  getDrawnPoints (interpTime) {
    const scaleRandomsWithDrawnAmount = this.fixStyle.scaleRandomsWithDrawnAmount;
    const midPointDrawEasing = this.fixStyle.midPointDrawEasing;
    const transforms = this.drawnRandoms.map(({distance, position}) => {
      const t = scaleRandomsWithDrawnAmount ? interpTime * position : position;
      const transform = bezier(t, ...this.drawnBezierPoints);
      const scaledNormal = { x: -distance * Math.sin(transform.angle), y: distance * Math.cos(transform.angle) };
      return vectorCombine(transform.position, scaledNormal);
    });
    const finalIncluded = this.drawnRandoms.filter(({position}) => this.scaleRandomsWithDrawnAmount || position <= interpTime).length - 1;
    const allPoints = [this.drawnBezierPoints[0]];
    if (finalIncluded !== -1) {
      allPoints.push(...transforms.slice(0, finalIncluded+1));
    }
    if (scaleRandomsWithDrawnAmount) {
      allPoints.push(bezier(interpTime, ...this.drawnBezierPoints).position);
    } else {
      // Determine the straight line mid point of transforms[finalIncluded] and transforms[finalIncluded+1]
      if (-1 < finalIncluded && finalIncluded < this.drawnRandoms.length - 1) {
        const startTime = this.drawnRandoms[finalIncluded].position;
        const endTime = this.drawnRandoms[finalIncluded + 1].position;
        const ratioTime = midPointDrawEasing((interpTime - startTime) / (endTime - startTime));
        const endPoint = interpValue(transforms[finalIncluded], transforms[finalIncluded + 1], ratioTime);
        allPoints.push(endPoint);
      } else if (finalIncluded === -1) {
        const startTime = 0;
        const endTime = this.drawnRandoms[0].position;
        const ratioTime = midPointDrawEasing((interpTime - startTime) / (endTime - startTime));
        const endPoint = interpValue(this.drawnBezierPoints[0], transforms[0], ratioTime);
        allPoints.push(endPoint);
      } else {
        const startTime = this.drawnRandoms[finalIncluded].position;
        const endTime = 1;
        const ratioTime = midPointDrawEasing((interpTime - startTime) / (endTime - startTime));
        const endPoint = interpValue(transforms[finalIncluded], this.drawnBezierPoints[this.drawnBezierPoints.length-1], ratioTime);
        allPoints.push(endPoint);
      }
    }
    return allPoints;
  }

  drawSmooth() {
    const points = this.getDrawnPoints(this.drawnAmount);
    let controlVectors = points.slice(1, -1).map((_, index) => {
      const prevPoint = points[index];
      const nextPoint = points[index+2];
      const controlVector = vectorCombine(nextPoint, negate(prevPoint));
      const controlMag = magnitude(controlVector) / this.fixStyle.smoothScaling;
      return { x: controlVector.x / controlMag, y: controlVector.y / controlMag };
    });
    const firstControl = vectorCombine(points[1], negate(points[0]));
    const firstControlMag = magnitude(firstControl) / this.fixStyle.smoothScaling;
    const finalControl = vectorCombine(points[points.length-1], negate(points[points.length-2]));
    const finalControlMag = magnitude(finalControl) / this.fixStyle.smoothScaling;
    controlVectors = [
      { x: firstControl.x / firstControlMag, y: firstControl.y / firstControlMag },
      ...controlVectors,
      { x: finalControl.x / finalControlMag, y: finalControl.y / finalControlMag },
    ]
    this.clear();
    this.moveTo(points[0].x, points[0].y);
    for (let i=0; i<points.length-1; i++) {
      const controlOut = vectorCombine(points[i], controlVectors[i]);
      const controlIn = vectorCombine(points[i+1], negate(controlVectors[i+1]));
      this.bezierCurveTo(
        controlOut.x, controlOut.y,
        controlIn.x, controlIn.y,
        points[i+1].x, points[i+1].y
      );
    }
    this.stroke(this.fixStyle.stroke);
  }

  updateDrawnGraphic() {
    const points = this.getDrawnPoints(this.drawnAmount);
    if (this.fixStyle.smooth) {
      this.drawSmooth();
    } else {
      this.clear();
      this.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => this.lineTo(point.x, point.y));
      this.stroke(this.fixStyle.stroke);
    }
  }
}
