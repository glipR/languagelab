import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { black, green, white } from "../colours.js";
import { interpValue } from "../tween.js";
import { bezier, bezierLength, inverseBezierRateFunction, magnitude, mergeDeep, multiply, negate, partialBezier, vectorCombine } from "../utils.js";

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
    this.startDrawnAmount = 0;
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
      return multiply(controlVector, 1/magnitude(controlVector));
    });
    const firstControl = vectorCombine(points[1], negate(points[0]));
    const finalControl = vectorCombine(points[points.length-1], negate(points[points.length-2]));
    controlVectors = [
      multiply(firstControl, 1/magnitude(firstControl)),
      ...controlVectors,
      multiply(finalControl, 1/magnitude(finalControl)),
    ]
    for (let i=0; i<points.length-1; i++) {
      const dist = magnitude(vectorCombine(points[i], negate(points[i+1])));
      const controlOut = vectorCombine(points[i], multiply(controlVectors[i], dist * this.fixStyle.smoothScaling));
      const controlIn = vectorCombine(points[i+1], multiply(negate(controlVectors[i+1]), dist * this.fixStyle.smoothScaling));
      beziers.push([points[i], controlOut, controlIn, points[i+1]]);
    }
    this.fullBeziers = beziers;
    this.bezierLengths = beziers.map(bezier => bezierLength(...bezier));
  }

  generateDrawnBeziers(t1, t2) {
    const beziers = this.fullBeziers;
    const bezierLengths = this.bezierLengths;
    const totalLength = bezierLengths.reduce((acc, length) => acc + length, 0);
    const targetStartLength = Math.ceil(Math.min(t1 + 1e-9, 1-1e-9) * totalLength);
    const targetEndLength = Math.ceil(Math.min(t2 + 1e-9, 1-1e-9) * totalLength);
    const cumulativeLengths = bezierLengths.reduce((acc, length) => {
      acc.push(acc[acc.length-1] + length);
      return acc;
    }, [0]).slice(1);
    let startIndex = beziers.findIndex((_, index) => cumulativeLengths[index] > targetStartLength);
    let endIndex = beziers.findIndex((_, index) => cumulativeLengths[index] > targetEndLength);
    if (startIndex === -1) {
      startIndex = beziers.length - 1;
    }
    if (endIndex === -1) {
      endIndex = beziers.length - 1;
    }
    // From what portion of the first bezier should we draw.
    const startRatio = Math.min(1, (bezierLengths[startIndex] - (cumulativeLengths[startIndex] - targetStartLength))/bezierLengths[startIndex]);
    // From what portion of the final bezier should we draw.
    const finalRatio = Math.min(1, (bezierLengths[endIndex] - (cumulativeLengths[endIndex] - targetEndLength))/bezierLengths[endIndex]);

    const startRateFunc = inverseBezierRateFunction(...beziers[startIndex]);
    const finalRateFunc = inverseBezierRateFunction(...beziers[endIndex]);
    const filteredBeziers = beziers.slice(startIndex, endIndex+1);
    filteredBeziers[0] = partialBezier(1 - startRateFunc(startRatio), ...filteredBeziers[0].slice().reverse()).slice().reverse();
    filteredBeziers[filteredBeziers.length-1] = partialBezier(finalRateFunc(finalRatio), ...filteredBeziers[filteredBeziers.length-1]);
    this.startRation = startRatio;
    this.finalRatio = finalRatio;
    return filteredBeziers;
  }

  edgeInterp(t) {
    t /= (this.drawnAmount - this.startDrawnAmount);
    t = Math.min(Math.max(t, 0), 1-1e-9);
    const beziers = this.generateDrawnBeziers(this.startDrawnAmount, this.drawnAmount);
    const actualLength = (beziers.length - 1 + this.finalRatio)
    const interpIndex = Math.floor(t * actualLength);
    let interpRatio = t * actualLength - interpIndex;
    if (interpIndex === beziers.length - 1) {
      interpRatio = interpRatio / this.finalRatio;
    }
    // console.log(interpRatio, ...beziers[interpIndex]);
    return bezier(interpRatio, ...beziers[interpIndex]);
  }

  drawSmooth() {
    const beziers = this.generateDrawnBeziers(this.startDrawnAmount, this.drawnAmount);
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

export class DrawnBezierGroup extends DrawnBezier {
  constructor(fixStyle, beziers, drawnAmount=0) {
    super({
      forceIntermediatePoints: true,
      spacePointsBetweenBeziers: false,
      ...fixStyle,
    }, beziers, drawnAmount);
    // drawnBezierPoints is now an array of bezier arrays.
  }

  getDrawnPoints () {
    const forceIntermediatePoints = this.fixStyle.forceIntermediatePoints;
    const spacePointsBetweenBeziers = this.fixStyle.spacePointsBetweenBeziers;
    const scaleRandomsWithDrawnAmount = this.fixStyle.scaleRandomsWithDrawnAmount;
    const bezierDistances = this.drawnBezierPoints.map(bezier => bezierLength(...bezier));
    const inverseRateFullBeziers = this.drawnBezierPoints.map(bezier => inverseBezierRateFunction(...bezier));
    const completeDistance = bezierDistances.reduce((acc, distance) => acc + distance, 0);
    const completeInverseRate = (t) => {
      // Returns the bezier index and the t value within that bezier
      let currentDistance = 0;
      for (let i=0; i<bezierDistances.length; i++) {
        const nextDistance = currentDistance + bezierDistances[i];
        if (nextDistance >= t * completeDistance) {
          return { bezierIndex: i, t: inverseRateFullBeziers[i]((t * completeDistance - currentDistance) / bezierDistances[i]) };
        }
        currentDistance = nextDistance;
      }
      return { bezierIndex: bezierDistances.length - 1, t: 1 };
    }
    const randoms = this.drawnRandoms.slice();
    if (forceIntermediatePoints) {
      for (let i=0; i<bezierDistances.length-1; i++) {
        if (spacePointsBetweenBeziers) {
          // The random remap will place the beziers at equal distances from 0-1.
          randoms.push({ distance: 0, position: (i+1) / bezierDistances.length });
        } else {
          randoms.push({distance: 0, position: bezierDistances.slice(0, i+1).reduce((acc, distance) => acc + distance, 0) / completeDistance});
        }
      }
    }
    randoms.sort((a, b) => a.position - b.position);

    const transforms = randoms.map(({distance, position}) => {
      let bezierIndex;
      let t;
      if (spacePointsBetweenBeziers) {
        const index = Math.floor(position * bezierDistances.length);
        bezierIndex = index;
        t = inverseRateFullBeziers[index](position * bezierDistances.length - index);
      }
      else {
        const res = completeInverseRate(position);
        bezierIndex = res.bezierIndex;
        t = res.t;
      }
      const transform = bezier(t, ...this.drawnBezierPoints[bezierIndex]);
      const scaledNormal = { x: -distance * Math.sin(transform.angle), y: distance * Math.cos(transform.angle) };
      return vectorCombine(transform.position, scaledNormal);
    });
    const finalIncluded = randoms.length - 1;
    const allPoints = [this.drawnBezierPoints[0][0]];
    if (finalIncluded !== -1) {
      allPoints.push(...transforms.slice(0, finalIncluded+1));
    }
    if (scaleRandomsWithDrawnAmount) {
      allPoints.push(bezier(1, ...this.drawnBezierPoints[this.drawnBezierPoints.length - 1]).position);
    } else {
      const finalBezier = this.drawnBezierPoints[this.drawnBezierPoints.length - 1];
      const endPoint = finalBezier[finalBezier.length - 1];
      allPoints.push(endPoint);
    }
    this.transforms = transforms;
    return allPoints;
  }

  updateDrawnGraphic() {
    super.updateDrawnGraphic();
    /*this.transforms.forEach(transform => {
      this.circle(transform.x, transform.y, 3).fill(white);
    })*/
    /*this.drawnBezierPoints.forEach(bezier => {
      this.circle(bezier[0].x, bezier[0].y, 3).fill(white);
      this.moveTo(bezier[0].x, bezier[0].y);
      for (let i=1; i<bezier.length; i++) {
        this.lineTo(bezier[i].x, bezier[i].y);
      }
      this.stroke({ color: green, width: 1 });
      this.circle(bezier[bezier.length-1].x, bezier[bezier.length-1].y, 3).fill(white);
    });*/
  }

}
