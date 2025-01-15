import Screen from '../screen.js';
import { black, blue, green, highlightColours, orange, red, white } from '../colours.js';
import { mergeDeep, multiply, negate, vectorCombine, magnitude, rotate, average_color } from '../utils.js';
import { interpValue, TweenManager, ValueTween } from '../tween.js';
import { Node } from '../graph.js';

import {rgb_to_oklab, oklab_to_rgb} from 'https://cdn.jsdelivr.net/npm/oklab.ts@2.2.7/+esm'
window.red = red;
window.green = green;
window.rgb_to_oklab = rgb_to_oklab;
window.oklab_to_rgb = oklab_to_rgb;

const gsc = window.gameScaling ?? 1;

export const GS = {

};

const SPLIT_SCALAR = 0.0005;

export class Globs extends PIXI.Graphics {
  baseStyle() {
    return {
      fillAlpha: 0.3,
      strokeAlpha: 1,
      strokeWidth: 2.5 * gsc,
      radiusGrowthExponent: 2,
      getAngleMultipliers: (diff1, diff2) => {
        // Given the angle difference between centre point and collision, how much further should we start the bezier.
        return [Math.min(1.4, Math.PI/diff1), Math.min(1.4, Math.PI/diff2)];
      },
      getControlMultipliers: (diff1, diff2) => {
        // Given the distance between the two points, how much should we move the control point.
        return [0.1 + 1/diff1, 0.1 + 1/diff2];
      },
      physicsBound: {
        type: 'rectangle',
        x: 2000,
        y: 1200,
        width: 4000,
        height: 2400,
        force: 4,
      }
    }
  }

  constructor(points, style={}) {
    super();
    this.points = points;
    this.originalPoints = mergeDeep({}, points);
    this.style = mergeDeep({}, this.baseStyle(), style);
    this.physicsDisabled = false;
    this.physicsArea = new PhysicsArea({
      outerPush: this.style.physicsBound,
      friction: 0.05,
      frictionVelocity: 0.075 * gsc,
      maxVelocity: 12.5 * gsc,
      ...this.style.extraPhysics
    });
    this.physicsPoints = {};
    Object.keys(this.points).forEach((key) => {
      this.physicsPoints[key] = new PIXI.Container();
      this.physicsPoints[key].position.set(this.points[key].position.x, this.points[key].position.y);
      this.physicsPoints[key].pushRadius = this.points[key].radius * 1.2;
      this.physicsPoints[key].postMovement = () => {
        this.points[key].position = { x: this.physicsPoints[key].position.x, y: this.physicsPoints[key].position.y };
        this.points[key].physicsArea.style.outerPush.x = this.points[key].position.x;
        this.points[key].physicsArea.style.outerPush.y = this.points[key].position.y;
      };
      this.physicsArea.addPhysicsChild(this.physicsPoints[key]);
    });
    GS.screen.addChild(this.physicsArea);

    this.ticker = () => {
      if (!this.physicsDisabled) {
        this.physicsArea.physicsTick();
      }
      this.draw();
    }
  }

  start() {
    GS.app.ticker.add(this.ticker);
  }

  pause() {
    GS.app.ticker.remove(this.ticker);
  }

  reset() {
    this.points = mergeDeep({}, this.originalPoints);
  }

  draw() {
    this.clear();
    for (const key of Object.keys(this.points)) {
      const point = this.points[key];
      if (point.position1 !== undefined) {
        const { position1, color1, position2, color2, joinColor, joinRadius1, joinRadius2, splitRadius1, splitRadius2, key1, key2 } = point;
        const vector = vectorCombine(position2, negate(position1));
        const expectedSplitDistance = splitRadius1 + splitRadius2;
        const expectedJoinDistance = Math.max(joinRadius1, joinRadius2) - Math.min(joinRadius1, joinRadius2);
        const ratioDistance = Math.min(1, Math.max(0, (magnitude(vector) - expectedJoinDistance) / (expectedSplitDistance - expectedJoinDistance)));
        const radius1 = interpValue(joinRadius1, splitRadius1, ratioDistance);
        const radius2 = interpValue(joinRadius2, splitRadius2, ratioDistance);
        point.radius1 = radius1;
        point.radius2 = radius2;
        const unitVector = multiply(vector, 1 / magnitude(vector));
        const side1 = vectorCombine(position1, multiply(unitVector, -radius1));
        const side2 = vectorCombine(position2, multiply(unitVector, radius2));
        const firstEncroached = 1 - magnitude(vectorCombine(side1, negate(vectorCombine(position2, multiply(unitVector, -radius2))))) / (2*radius1);
        const secondEncroached = 1 - magnitude(vectorCombine(side2, negate(vectorCombine(position1, multiply(unitVector, radius1))))) / (2*radius2);
        const inside = magnitude(vector) < Math.max(radius1 - radius2, radius2 - radius1);
        const maxEncroached = Math.min(1, Math.max(firstEncroached, secondEncroached, 0));
        const strokeColor1 = new PIXI.Color(interpValue(color1, joinColor, maxEncroached));
        strokeColor1.setAlpha(this.style.strokeAlpha * (point.alpha ?? 1));
        const fillColor1 = new PIXI.Color(interpValue(color1, joinColor, maxEncroached));
        fillColor1.setAlpha(this.style.fillAlpha * (point.alpha ?? 1));
        const strokeColor2 = new PIXI.Color(interpValue(color2, joinColor, maxEncroached));
        strokeColor2.setAlpha(this.style.strokeAlpha * (point.alpha ?? 1));
        const fillColor2 = new PIXI.Color(interpValue(color2, joinColor, maxEncroached));
        fillColor2.setAlpha(this.style.fillAlpha) * (point.alpha ?? 1);
        if (firstEncroached < 0) {
          this.circle(position1.x, position1.y, radius1)
          this.stroke({ color: strokeColor1, width: this.style.strokeWidth});
          this.fill(fillColor1);
          this.circle(position2.x, position2.y, radius2)
          this.stroke({ color: strokeColor2, width: this.style.strokeWidth});
          this.fill(fillColor2);
          if (point.physicsArea !== undefined) {
            point.physicsArea.style.outerPush = {
              type: 'doubleCircle',
              position1: position1,
              radius1: radius1,
              position2: position2,
              radius2: radius2,
              force: 4,
              intersecting: false,
            }
          }
          if (!point.combining) {
            // We are now separated - so we should change the physics/blob points.
            const newPhysicsArea1 = new PhysicsArea();
            newPhysicsArea1.style = mergeDeep({}, point.physicsArea.style);
            newPhysicsArea1.style.outerPush = {
              type: 'circle',
              radius: radius1,
              x: position1.x,
              y: position1.y,
              force: 4,
            }
            const newPhysicsArea2 = new PhysicsArea();
            newPhysicsArea2.style = mergeDeep({}, point.physicsArea.style);
            newPhysicsArea2.style.outerPush = {
              type: 'circle',
              radius: radius2,
              x: position2.x,
              y: position2.y,
              force: 4,
            }
            point.physicsArea.containers.forEach((container) => {
              if (key1.includes(container.globKey)) {
                newPhysicsArea1.addPhysicsChild(container);
              }
              if (key2.includes(container.globKey)) {
                newPhysicsArea2.addPhysicsChild(container);
              }
            });
            GS.screen.addChild(newPhysicsArea1);
            GS.screen.addChild(newPhysicsArea2);
            newPhysicsArea1.start();
            newPhysicsArea2.start();
            point.physicsArea.destroy();
            this.points[key1] = {
              position: position1,
              radius: radius1,
              color: color1,
              physicsArea: newPhysicsArea1,
            }
            this.points[key2] = {
              position: position2,
              radius: radius2,
              color: color2,
              physicsArea: newPhysicsArea2,
            }
            this.physicsPoints[key1].preMovement = undefined;
            this.physicsPoints[key1].postMovement = () => {
              this.points[key1].position = { x: this.physicsPoints[key1].position.x, y: this.physicsPoints[key1].position.y };
              this.points[key1].physicsArea.style.outerPush.x = this.points[key1].position.x;
              this.points[key1].physicsArea.style.outerPush.y = this.points[key1].position.y;
            }
            this.physicsPoints[key2].preMovement = undefined;
            this.physicsPoints[key2].postMovement = () => {
              this.points[key2].position = { x: this.physicsPoints[key2].position.x, y: this.physicsPoints[key2].position.y };
              this.points[key2].physicsArea.style.outerPush.x = this.points[key2].position.x;
              this.points[key2].physicsArea.style.outerPush.y = this.points[key2].position.y;
            }
            this.physicsPoints[key1].ignoreSet.delete(this.physicsPoints[key2]);
            this.physicsPoints[key2].ignoreSet.delete(this.physicsPoints[key1]);
            this.physicsPoints[key1].pushRadius = radius1 * 1.2;
            this.physicsPoints[key2].pushRadius = radius2 * 1.2;
            delete this.points[point.key];
          }
        } else if (inside) {
          if (radius1 > radius2) {
            this.circle(position1.x, position1.y, radius1)
          } else {
            this.circle(position2.x, position2.y, radius2)
          }
          this.stroke({ color: strokeColor1, width: this.style.strokeWidth});
          this.fill(fillColor1);
          if (point.physicsArea !== undefined) {
            point.physicsArea.style.outerPush = {
              type: 'circle',
              radius: Math.max(radius1, radius2),
              x: radius1 > radius2 ? position1.x : position2.x,
              y: radius1 > radius2 ? position1.y : position2.y,
              force: 4,
            }
          }
          if (point.combining) {
            // We are now merged - so we should change the physics points.
            const [key1, key2] = [point.key1, point.key2];
            this.points[point.key] = {
              position: radius1 > radius2 ? position1 : position2,
              radius: Math.max(joinRadius1, joinRadius2),
              color: joinColor,
              physicsArea: point.physicsArea,
            };
            this.physicsPoints[point.key] = new PIXI.Container();
            this.physicsPoints[point.key].position.set(this.points[point.key].position.x, this.points[point.key].position.y);
            this.physicsPoints[point.key].pushRadius = this.points[point.key].radius * 1.2;
            this.physicsPoints[point.key].postMovement = () => {
              this.points[point.key].position = { x: this.physicsPoints[point.key].position.x, y: this.physicsPoints[point.key].position.y };
              this.points[point.key].physicsArea.style.outerPush.x = this.points[point.key].position.x;
              this.points[point.key].physicsArea.style.outerPush.y = this.points[point.key].position.y;
            };
            this.physicsArea.addPhysicsChild(this.physicsPoints[point.key]);
            this.physicsArea.removePhysicsChild(this.physicsPoints[key1]);
            this.physicsArea.removePhysicsChild(this.physicsPoints[key2]);
            delete this.physicsPoints[key1];
            delete this.physicsPoints[key2];
          }
        } else {
          // Draw merged.
          const d = magnitude(vector);
          const l = (radius1 ** 2 - radius2 ** 2 + d ** 2) / (2 * d);
          const h = Math.sqrt(radius1 ** 2 - l ** 2);
          const intersection1 = {
            x: position1.x + l * unitVector.x + h * unitVector.y,
            y: position1.y + l * unitVector.y - h * unitVector.x,
          };
          const intersection2 = {
            x: position1.x + l * unitVector.x - h * unitVector.y,
            y: position1.y + l * unitVector.y + h * unitVector.x,
          };
          const angleP11 = Math.atan2(intersection1.y - position1.y, intersection1.x - position1.x);
          const angleP12 = Math.atan2(intersection2.y - position1.y, intersection2.x - position1.x);
          const midAngleP1 = Math.atan2(position2.y - position1.y, position2.x - position1.x);
          const angleP21 = Math.atan2(intersection1.y - position2.y, intersection1.x - position2.x);
          const angleP22 = Math.atan2(intersection2.y - position2.y, intersection2.x - position2.x);
          const midAngleP2 = Math.atan2(position1.y - position2.y, position1.x - position2.x);
          let angleDiff1 = ((angleP11 - midAngleP1 + 6 * Math.PI) % (2 * Math.PI));
          let angleDiff2 = ((angleP21 - midAngleP2 + 6 * Math.PI) % (2 * Math.PI));
          if (angleDiff1 > Math.PI) {
            angleDiff1 = angleDiff1 - 2 * Math.PI;
          }
          if (angleDiff2 > Math.PI) {
            angleDiff2 = angleDiff2 - 2 * Math.PI;
          }
          const [angleMult1, angleMult2] = this.style.getAngleMultipliers(Math.abs(angleDiff1), Math.abs(angleDiff2));
          // We want avoid midAngleP1, so decide whether this is anticlockwise or clockwise.
          let anticlockwise = false;
          if (angleP11 > angleP12) {
            if (midAngleP1 > angleP11 || midAngleP1 < angleP12) {
              // The range between is what we want.
              anticlockwise = true;
            }
          } else {
            if (midAngleP1 > angleP11 && midAngleP1 < angleP12) {
              // The range between is what we want.
              anticlockwise = true;
            }
          }
          const gradient = new PIXI.FillGradient(side1.x, side1.y, side2.x, side2.y);
          const intersection = interpValue(intersection1, intersection2, 0.5);
          const intersectionRatio = Math.min(1, Math.max(0, magnitude(vectorCombine(side1, negate(intersection))) / magnitude(vectorCombine(side1, negate(side2)))));
          const blendAmount = Math.min(intersectionRatio / 2, (1 - intersectionRatio) / 2) * maxEncroached;
          gradient.addColorStop(0, fillColor1);
          if (!isNaN(intersectionRatio)) {
            gradient.addColorStop(intersectionRatio - blendAmount, fillColor1);
            gradient.addColorStop(intersectionRatio + blendAmount, fillColor2);
          }
          gradient.addColorStop(1, fillColor2);
          const strokeGradient = new PIXI.FillGradient(side1.x, side1.y, side2.x, side2.y);
          strokeGradient.addColorStop(0, strokeColor1);
          if (!isNaN(intersectionRatio)) {
            strokeGradient.addColorStop(intersectionRatio - blendAmount, strokeColor1);
            strokeGradient.addColorStop(intersectionRatio + blendAmount, strokeColor2);
          }
          strokeGradient.addColorStop(1, strokeColor2);

          const pointOnCircle = (center, radius, angle) => {
            return {
              x: center.x + radius * Math.cos(angle),
              y: center.y + radius * Math.sin(angle),
            }
          }
          const start1 = (midAngleP1 + angleDiff1 * angleMult1) % (2 * Math.PI);
          const normalS1 = pointOnCircle({x:0, y:0}, 1, start1);
          const tangentS1 = rotate(normalS1, (angleDiff1 > 0 ? -1 : 1) * Math.PI/2);
          const end1 = (midAngleP1 - angleDiff1 * angleMult1) % (2 * Math.PI);
          const normalE1 = pointOnCircle({x:0, y:0}, 1, end1);
          const tangentE1 = rotate(normalE1, (angleDiff1 > 0 ? 1 : -1) * Math.PI/2);
          const start2 = (midAngleP2 - angleDiff2 * angleMult2) % (2 * Math.PI);
          const normalS2 = pointOnCircle({x:0, y:0}, 1, start2);
          const tangentS2 = rotate(normalS2, (angleDiff2 > 0 ? 1 : -1) * Math.PI/2);
          const end2 = (midAngleP2 + angleDiff2 * angleMult2) % (2 * Math.PI);
          const normalE2 = pointOnCircle({x:0, y:0}, 1, end2);
          const tangentE2 = rotate(normalE2, (angleDiff2 > 0 ? -1 : 1) * Math.PI/2);
          const diff1 = magnitude(vectorCombine(pointOnCircle(position1, radius1, start1), negate(pointOnCircle(position1, radius1, end1))));
          const diff2 = magnitude(vectorCombine(pointOnCircle(position2, radius2, start2), negate(pointOnCircle(position2, radius2, end2))));
          const [mult1, mult2] = this.style.getControlMultipliers(diff1, diff2);
          this.moveTo(
            pointOnCircle(position1, radius1, start1).x,
            pointOnCircle(position1, radius1, start1).y,
          )
          this.arc(position1.x, position1.y, radius1, start1, end1, anticlockwise);
          this.bezierCurveTo(
            vectorCombine(pointOnCircle(position1, radius1, end1), multiply(tangentE1, diff1 * mult1)).x,
            vectorCombine(pointOnCircle(position1, radius1, end1), multiply(tangentE1, diff1 * mult1)).y,
            vectorCombine(pointOnCircle(position2, radius2, start2), multiply(tangentS2, diff2 * mult2)).x,
            vectorCombine(pointOnCircle(position2, radius2, start2), multiply(tangentS2, diff2 * mult2)).y,
            pointOnCircle(position2, radius2, start2).x,
            pointOnCircle(position2, radius2, start2).y,
          )
          this.arc(position2.x, position2.y, radius2, start2, end2, anticlockwise);
          this.bezierCurveTo(
            vectorCombine(pointOnCircle(position2, radius2, end2), multiply(tangentE2, diff2 * mult2)).x,
            vectorCombine(pointOnCircle(position2, radius2, end2), multiply(tangentE2, diff2 * mult2)).y,
            vectorCombine(pointOnCircle(position1, radius1, start1), multiply(tangentS1, diff1 * mult1)).x,
            vectorCombine(pointOnCircle(position1, radius1, start1), multiply(tangentS1, diff1 * mult1)).y,
            pointOnCircle(position1, radius1, start1).x,
            pointOnCircle(position1, radius1, start1).y,
          )
          this.fill(gradient);
          this.stroke({ fill: strokeGradient, width: this.style.strokeWidth});

          /*let i=0;
          for (let { x, y } of [
            pointOnCircle(position1, radius1, start1),
            vectorCombine(pointOnCircle(position1, radius1, start1), multiply(tangentS1, diff1 * mult1)),
            pointOnCircle(position2, radius2, start2),
            vectorCombine(pointOnCircle(position2, radius2, start2), multiply(tangentS2, diff2 * mult2)),
          ]) {
            this.circle(x, y, 10);
            this.stroke({ color: black, width: 2});
            this.fill(black);
            i++;
          }*/

          if (point.physicsArea !== undefined) {
            point.physicsArea.style.outerPush = {
              type: 'doubleCircle',
              position1: position1,
              radius1: radius1,
              position2: position2,
              radius2: radius2,
              intersectionP1L: intersection1,
              intersectionP1R: intersection2,
              intersectionP1: pointOnCircle(position1, radius1, midAngleP1),
              intersectionP2L: intersection2,
              intersectionP2R: intersection1,
              intersectionP2: pointOnCircle(position2, radius2, midAngleP2),
              intersecting: true,
              forceGlob1: point.combining ? [] : point.key1.split('+'),
              forceGlob2: point.combining ? [] : point.key2.split('+'),
              force: 4,
            }
          }

        }

      } else {
        const { position, radius, color, doubleBorderColor } = point;
        const strokeColor = new PIXI.Color(color);
        strokeColor.setAlpha(this.style.strokeAlpha * (point.alpha ?? 1));
        const fillColor = new PIXI.Color(color);
        fillColor.setAlpha(this.style.fillAlpha * (point.alpha ?? 1));
        if (position === undefined) {
          console.log(key, point);
        }
        this.circle(position.x, position.y, radius)
        this.stroke({ color: strokeColor, width: this.style.strokeWidth});
        this.fill(fillColor);
        if (point.doubleBorderAlpha ?? 0 > 0) {
          const borderColor = new PIXI.Color(doubleBorderColor ?? color).setAlpha(point.doubleBorderAlpha * (point.alpha ?? 1));
          this.circle(position.x, position.y, radius - 4 * this.style.strokeWidth)
          this.stroke({ color: borderColor, width: 2 * this.style.strokeWidth});
        }
      }
    }
  }

  initialCombine(keys, newColor) {
    // The list of keys above into a single glob.
    const newKey = keys.join('+');
    const joinRadius = Math.pow(keys.reduce((acc, key) => acc + this.points[key].radius ** this.style.radiusGrowthExponent, 0), 1/this.style.radiusGrowthExponent);
    newColor = newColor ?? average_color(keys.map((key) => this.points[key].color), keys.map((key) => this.points[key].radius));
    this.points[newKey] = {
      position: multiply(keys.reduce((acc, key) => vectorCombine(acc, this.points[key].position), { x: 0, y: 0 }), 1 / keys.length),
      radius: joinRadius,
      color: newColor,
    }
    const newPhysicsArea = new PhysicsArea();
    newPhysicsArea.style = mergeDeep({}, this.points[keys[0]].physicsArea.style);
    newPhysicsArea.style.outerPush = {
      type: 'circle',
      radius: joinRadius,
      x: this.points[newKey].position.x,
      y: this.points[newKey].position.y,
      force: 4,
    }
    for (const key of keys) {
      for (const container of this.points[key].physicsArea.containers) {
        newPhysicsArea.addPhysicsChild(container);
      }
      this.points[key].physicsArea.destroy();
      delete this.points[key];
    }
    this.points[newKey].physicsArea = newPhysicsArea;
    GS.screen.addChild(newPhysicsArea);
    newPhysicsArea.start();

    // Top level physics points.
    this.physicsPoints[newKey] = new PIXI.Container();
    this.physicsPoints[newKey].position.set(this.points[newKey].position.x, this.points[newKey].position.y);
    this.physicsPoints[newKey].pushRadius = this.points[newKey].radius * 1.2;
    this.physicsPoints[newKey].postMovement = () => {
      this.points[newKey].position = { x: this.physicsPoints[newKey].position.x, y: this.physicsPoints[newKey].position.y };
      this.points[newKey].physicsArea.style.outerPush.x = this.points[newKey].position.x;
      this.points[newKey].physicsArea.style.outerPush.y = this.points[newKey].position.y;
    };
    this.physicsArea.addPhysicsChild(this.physicsPoints[newKey]);
    for (const key of keys) {
      this.physicsArea.removePhysicsChild(this.physicsPoints[key]);
      delete this.physicsPoints[key];
    }
  }

  splitGlobs(key, separate, oldColor, newColor) {
    const oldKeys = new Set(key.split('+'));
    const newKeys = new Set(separate.split('+'));
    const remainingKeys = oldKeys.difference(newKeys);

    const newKeysArray = Array.from(newKeys).sort();
    const remainingKeysArray = Array.from(remainingKeys).sort();
    const newKey = newKeysArray.join('+');
    const remainingKey = remainingKeysArray.join('+');

    const newColorRemaining = oldColor ?? average_color(remainingKeysArray.map((key) => this.originalPoints[key].color), remainingKeysArray.map((key) => this.originalPoints[key].radius));
    const newColorNew = newColor ?? average_color(newKeysArray.map((key) => this.originalPoints[key].color), newKeysArray.map((key) => this.originalPoints[key].radius));

    const splitRadiusRemaining = Math.pow(remainingKeysArray.reduce((acc, key) => acc + this.originalPoints[key].radius ** this.style.radiusGrowthExponent, 0), 1/this.style.radiusGrowthExponent);
    const splitRadiusNew = Math.pow(newKeysArray.reduce((acc, key) => acc + this.originalPoints[key].radius ** this.style.radiusGrowthExponent, 0), 1/this.style.radiusGrowthExponent);

    const mergedPoint = {
      position1: this.points[key].position,
      position2: this.points[key].position,
      color1: newColorRemaining,
      color2: newColorNew,
      radius1: this.points[key].radius,
      radius2: this.points[key].radius,
      joinRadius1: this.points[key].radius,
      joinRadius2: this.points[key].radius,
      splitRadius1: splitRadiusRemaining,
      splitRadius2: splitRadiusNew,
      joinColor: this.points[key].color,
      key1: remainingKey,
      key2: newKey,
      combining: false,
      key,
    }
    mergedPoint.physicsArea = this.points[key].physicsArea;
    const curPosition = this.points[key].position;
    this.points[key] = mergedPoint;
    // Two new physics points
    this.physicsPoints[remainingKey] = new PIXI.Container();
    this.physicsPoints[remainingKey].position.set(curPosition.x, curPosition.y);
    this.physicsPoints[remainingKey].pushRadius = mergedPoint.splitRadius1 * 1.2;
    this.physicsPoints[remainingKey].postMovement = () => {
      this.points[key].position1 = { x: this.physicsPoints[remainingKey].position.x, y: this.physicsPoints[remainingKey].position.y };
    };
    const preferredDistance = 1.2 * (mergedPoint.splitRadius1 + mergedPoint.splitRadius2);
    this.physicsPoints[remainingKey].preMovement = () => {
      // Regardless of intersection, we want to move away from the other point.
      const repulsor = this.physicsPoints[newKey].position;
      const current = this.physicsPoints[remainingKey].position;
      const diff = vectorCombine(repulsor, negate(current));
      const diffMag = magnitude(diff);
      if (diffMag > 0) {
        const remainingDistance = Math.max(0, preferredDistance - diffMag);
        this.physicsPoints[remainingKey].acceleration = vectorCombine(this.physicsPoints[remainingKey].acceleration, multiply(diff, -SPLIT_SCALAR * remainingDistance/(diffMag)));
      }
    }
    this.physicsArea.addPhysicsChild(this.physicsPoints[remainingKey]);
    this.physicsPoints[newKey] = new PIXI.Container();
    this.physicsPoints[newKey].position.set(curPosition.x, curPosition.y);
    this.physicsPoints[newKey].pushRadius = mergedPoint.splitRadius2 * 1.2;
    this.physicsPoints[newKey].postMovement = () => {
      this.points[key].position2 = { x: this.physicsPoints[newKey].position.x, y: this.physicsPoints[newKey].position.y };
    };
    this.physicsPoints[newKey].preMovement = () => {
      // Regardless of intersection, we want to move away from the other point.
      const repulsor = this.physicsPoints[remainingKey].position;
      const current = this.physicsPoints[newKey].position;
      const diff = vectorCombine(repulsor, negate(current));
      const diffMag = magnitude(diff);
      if (diffMag > 0) {
        const remainingDistance = Math.max(0, preferredDistance - diffMag);
        this.physicsPoints[newKey].acceleration = vectorCombine(this.physicsPoints[newKey].acceleration, multiply(diff, -SPLIT_SCALAR*remainingDistance/(diffMag)));
      }
    }
    this.physicsArea.addPhysicsChild(this.physicsPoints[newKey]);
    this.physicsPoints[remainingKey].ignoreSet.add(this.physicsPoints[newKey]);
    this.physicsPoints[newKey].ignoreSet.add(this.physicsPoints[remainingKey]);
    this.physicsArea.removePhysicsChild(this.physicsPoints[key]);
    delete this.physicsPoints[key];
  }

  combineGlobs(key1, key2, newRadius, newColor) {
    const radiusRatio1 = this.points[key1].radius / (this.points[key1].radius + this.points[key2].radius);
    const radiusRatio2 = 1 - radiusRatio1;
    const firstLarger = radiusRatio1 >= radiusRatio2;
    if (newRadius === undefined) {
      // Constant area.
      newRadius = Math.pow(this.points[key1].radius ** this.style.radiusGrowthExponent + this.points[key2].radius ** this.style.radiusGrowthExponent, 1/this.style.radiusGrowthExponent);
    }
    if (newColor === undefined) {
      newColor = average_color([this.points[key1].color, this.points[key2].color], [this.points[key1].radius, this.points[key2].radius]);
    }
    const keys = key1.split('+').concat(key2.split('+'));
    keys.sort();
    const key = keys.join('+');
    const mergedPoint = {
      position1: this.points[key1].position,
      position2: this.points[key2].position,
      color1: this.points[key1].color,
      color2: this.points[key2].color,
      radius1: this.points[key1].radius,
      radius2: this.points[key2].radius,
      splitRadius1: this.points[key1].radius,
      splitRadius2: this.points[key2].radius,
      joinRadius1: firstLarger ? newRadius : this.points[key1].radius,
      joinRadius2: firstLarger ? this.points[key2].radius : newRadius,
      joinColor: newColor,
      key1: key1,
      key2: key2,
      key: key,
      combining: true,
    };
    this.points[key] = {...mergedPoint};
    if (this.points[key1].physicsArea !== undefined) {
      // Merge physics areas.
      const newPhysicsArea = new PhysicsArea();
      newPhysicsArea.style = mergeDeep({}, this.points[key1].physicsArea.style);
      for (const container of this.points[key1].physicsArea.containers) {
        newPhysicsArea.addPhysicsChild(container);
      }
      for (const container of this.points[key2].physicsArea.containers) {
        newPhysicsArea.addPhysicsChild(container);
      }
      this.points[key].physicsArea = newPhysicsArea;
      this.points[key1].physicsArea.destroy();
      this.points[key2].physicsArea.destroy();
      GS.screen.addChild(newPhysicsArea);
      newPhysicsArea.start();
    }
    this.physicsPoints[key1].ignoreSet.add(this.physicsPoints[key2]);
    this.physicsPoints[key2].ignoreSet.add(this.physicsPoints[key1]);
    this.physicsPoints[key1].preMovement = () => {
      const wanted = this.physicsPoints[key2].position;
      const current = this.physicsPoints[key1].position;
      const diff = vectorCombine(wanted, negate(current));
      this.physicsPoints[key1].acceleration = vectorCombine(this.physicsPoints[key1].acceleration, multiply(diff, 0.0003));
    }
    this.physicsPoints[key2].preMovement = () => {
      const wanted = this.physicsPoints[key1].position;
      const current = this.physicsPoints[key2].position;
      const diff = vectorCombine(wanted, negate(current));
      this.physicsPoints[key2].acceleration = vectorCombine(this.physicsPoints[key2].acceleration, multiply(diff, 0.0003));
    }
    this.physicsPoints[key1].postMovement = () => {
      this.points[key].position1 = { x: this.physicsPoints[key1].position.x, y: this.physicsPoints[key1].position.y };
    }
    this.physicsPoints[key2].postMovement = () => {
      this.points[key].position2 = { x: this.physicsPoints[key2].position.x, y: this.physicsPoints[key2].position.y };
    }
    delete this.points[key1];
    delete this.points[key2];
  }
}

export class PhysicsArea extends PIXI.Container {
  baseStyle() {
    return {
      pushRadius: 50 * gsc,
      defaultChildRadius: 30 * gsc,
      startVelocity: 0.1 * gsc,
      objectPush: 0.75 * gsc,
      friction: 0.08,
      frictionVelocity: 0.25 * gsc,
      drawArrows: false,
      drawnMultiplier: 100,
      maxVelocity: 12.5 * gsc,
      outerPush: {
        type: 'circle',
        radius: 50 * gsc,
        x: 0,
        y: 0,
        force: 4,
      }
    }
  }
  constructor(style={}) {
    super();
    this.containers = [];
    this.arrows = new PIXI.Graphics();
    this.addChild(this.arrows);
    this.style = mergeDeep({}, this.baseStyle(), style)

    this.ticker = () => {
      this.physicsTick();
    }
  }

  start() {
    GS.app.ticker.add(this.ticker);
  }

  pause() {
    GS.app.ticker.remove(this.ticker);
  }

  addPhysicsChild(child) {
    if (child.pushRadius === undefined) {
      child.pushRadius = this.style.defaultChildRadius;
    }
    this.containers.push(child);

    child.velocity = {
      x: (Math.random() * 2 - 1) * this.style.startVelocity,
      y: (Math.random() * 2 - 1) * this.style.startVelocity,
    }
    child.acceleration = { x: 0, y: 0 };
    child.vecPosition = { x: child.position.x, y: child.position.y };
    child.ignoreSet = new Set([child]);
  }

  removePhysicsChild(child) {
    this.containers = this.containers.filter((c) => c !== child);
  }

  physicsTick() {
    const outer = this.style.outerPush;
    for (const container of this.containers) {
      container.acceleration = { x: 0, y: 0 };
      // Outer barrier push

      if (outer.type === 'circle') {
        if (container.type === 'rectangle') {
          const points = [
            { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y - container.outerHeight / 2 },
            { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y - container.outerHeight / 2 },
            { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y + container.outerHeight / 2 },
            { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y + container.outerHeight / 2 },
          ];
          const { vector, dist } = points.map(point => {
            const vector = vectorCombine(point, negate(outer));
            const dist = magnitude(vector);
            return { vector, dist };
          }).sort((a, b) => b.dist - a.dist)[0];
          if (dist > outer.radius) {
            const normal = multiply(vector, 1 / dist);
            container.acceleration = vectorCombine(container.acceleration, multiply(normal, -outer.force * 2 * (dist - outer.radius) / (container.outerWidth + container.outerHeight)));
          }
        } else {
          // Circle
          const distance = magnitude(vectorCombine(container.vecPosition, negate(outer)));
          if (distance + container.pushRadius > outer.radius) {
            const normal = multiply(vectorCombine(container.vecPosition, negate(outer)), 1 / distance);
            container.acceleration = vectorCombine(container.acceleration, multiply(normal, -outer.force * (distance + container.pushRadius - outer.radius) / container.pushRadius));
          }
        }
      }
      if (outer.type === 'rectangle') {
        if (container.type === 'rectangle') {
          const points = [
            { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y - container.outerHeight / 2 },
            { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y - container.outerHeight / 2 },
            { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y + container.outerHeight / 2 },
            { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y + container.outerHeight / 2 },
          ];
          const bottomLeft = { x: outer.x - outer.width / 2, y: outer.y - outer.height / 2 };
          const topRight = { x: outer.x + outer.width / 2, y: outer.y + outer.height / 2 };
          const { vector, dist } = points.map(point => {
            const possibleVectors = [{ x: 0, y: 0}];
            if (point.x < bottomLeft.x) {
              possibleVectors.push({ x: bottomLeft.x - point.x, y: 0 });
            }
            if (point.x > topRight.x) {
              possibleVectors.push({ x: topRight.x - point.x, y: 0 });
            }
            if (point.y < bottomLeft.y) {
              possibleVectors.push({ x: 0, y: bottomLeft.y - point.y });
            }
            if (point.y > topRight.y) {
              possibleVectors.push({ x: 0, y: topRight.y - point.y });
            }
            // Largest magnitude vector
            const vector = possibleVectors.sort((a, b) => magnitude(b) - magnitude(a))[0];
            const dist = magnitude(vector);
            return { vector, dist };
          }).sort((a, b) => a.dist - b.dist)[0];

          if (dist > 0) {
            const normal = multiply(vector, 1 / dist);
            container.acceleration = vectorCombine(container.acceleration, multiply(normal, outer.force * 2 * (dist) / (container.outerWidth + container.outerHeight)));
          }
        } else {
          const bottomLeft = { x: outer.x - outer.width / 2, y: outer.y - outer.height / 2 };
          const topRight = { x: outer.x + outer.width / 2, y: outer.y + outer.height / 2 };
          if (container.vecPosition.x - container.pushRadius < bottomLeft.x) {
            const forceDist = bottomLeft.x - (container.vecPosition.x - container.pushRadius);
            container.acceleration = vectorCombine(container.acceleration, { x: outer.force * forceDist, y: 0 });
          }
          if (container.vecPosition.x + container.pushRadius > topRight.x) {
            const forceDist = (container.vecPosition.x + container.pushRadius) - topRight.x;
            container.acceleration = vectorCombine(container.acceleration, { x: -outer.force * forceDist, y: 0 });
          }
          if (container.vecPosition.y - container.pushRadius < bottomLeft.y) {
            const forceDist = bottomLeft.y - (container.vecPosition.y - container.pushRadius);
            container.acceleration = vectorCombine(container.acceleration, { x: 0, y: outer.force * forceDist });
          }
          if (container.vecPosition.y + container.pushRadius > topRight.y) {
            const forceDist = (container.vecPosition.y + container.pushRadius) - topRight.y;
            container.acceleration = vectorCombine(container.acceleration, { x: 0, y: -outer.force * forceDist });
          }
        }
      }
      if (outer.type === 'doubleCircle') {
        const { position1, radius1, position2, radius2, intersectionP1L, intersectionP1R, intersectionP1, intersectionP2L, intersectionP2R, intersectionP2, intersecting } = outer;
        let vecP1 = vectorCombine(container.vecPosition, negate(position1));
        const distP1 = magnitude(vecP1);
        vecP1 = multiply(vecP1, radius1 / distP1);
        let vecP2 = vectorCombine(container.vecPosition, negate(position2));
        const distP2 = magnitude(vecP2);
        vecP2 = multiply(vecP2, radius2 / distP2);
        let shouldCheck1 = true;
        let shouldCheck2 = true;

        if (!intersecting) {
          // Only check the closest circle.
          if (distP1 < distP2) {
            shouldCheck2 = false;
          }
          else {
            shouldCheck1 = false;
          }
        }

        if (intersecting) {
          // How far away is our circle project from the intersection?
          const intersectionDistP1 = magnitude(vectorCombine(position1, vecP1, negate(intersectionP1)));
          // How far away is our circle project from the side intersection?
          const intersectionSideDistP1 = magnitude(vectorCombine(position1, vecP1, negate(intersectionP1L)));
          if (intersectionSideDistP1 > intersectionDistP1) {
            shouldCheck1 = false;
          }
        }
        if (intersecting) {
          // How far away is our circle project from the intersection?
          const intersectionDistP2 = magnitude(vectorCombine(position2, vecP2, negate(intersectionP2)));
          // How far away is our circle project from the side intersection?
          const intersectionSideDistP2 = magnitude(vectorCombine(position2, vecP2, negate(intersectionP2L)));
          if (intersectionSideDistP2 > intersectionDistP2) {
            shouldCheck2 = false;
          }
        }
        shouldCheck1 = (
          shouldCheck1
          || outer.forceGlob1?.includes(container.globKey)
          && (!outer.forceGlob2?.includes(container.globKey))
        );
        shouldCheck2 = (
          shouldCheck2
          || outer.forceGlob2?.includes(container.globKey)
          && (!outer.forceGlob1?.includes(container.globKey))
        );
        // We're on the outside of the circle - apply push
        if (shouldCheck1 && distP1 + container.pushRadius > radius1) {
          const normal = multiply(vecP1, 1 / distP1);
          container.acceleration = vectorCombine(container.acceleration, multiply(normal, -outer.force * (distP1 + container.pushRadius - radius1) / container.pushRadius));
        }
        // We're on the outside of the circle - apply push
        if (shouldCheck2 && distP2 + container.pushRadius > radius2) {
          const normal = multiply(vecP2, 1 / distP2);
          container.acceleration = vectorCombine(container.acceleration, multiply(normal, -outer.force * (distP2 + container.pushRadius - radius2) / container.pushRadius));
        }

      }

      if (isNaN(container.acceleration.x) || isNaN(container.acceleration.y)) {
        console.log(outer, container);
        throw new Error('Acceleration is NaN');
      }
      // Object push
      for (const container2 of this.containers) {
        if (!container.ignoreSet.has(container2)) {
          if (container2.type === 'rectangle') {
            // Include center points for when one rectangle is larger than the other, so no corner intersect.
            // Not perfect but good enough.
            const points1 = [
              { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y - container.outerHeight / 2 },
              { x: container.vecPosition.x, y: container.vecPosition.y - container.outerHeight / 2 },
              { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y - container.outerHeight / 2 },
              { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y },
              { x: container.vecPosition.x + container.outerWidth / 2, y: container.vecPosition.y + container.outerHeight / 2 },
              { x: container.vecPosition.x, y: container.vecPosition.y + container.outerHeight / 2 },
              { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y + container.outerHeight / 2 },
              { x: container.vecPosition.x - container.outerWidth / 2, y: container.vecPosition.y },
            ]
            const points2BottomLeft = { x: container2.vecPosition.x - container2.outerWidth / 2, y: container2.vecPosition.y - container2.outerHeight / 2 };
            const points2TopRight = { x: container2.vecPosition.x + container2.outerWidth / 2, y: container2.vecPosition.y + container2.outerHeight / 2 };
            const { vector, dist } = points1.map(point => {
              let vector = { x: 0, y: 0 };
              if (point.x > points2BottomLeft.x && point.x < points2TopRight.x && point.y > points2BottomLeft.y && point.y < points2TopRight.y) {
                const blX = point.x - points2BottomLeft.x;
                const trX = points2TopRight.x - point.x;
                const blY = point.y - points2BottomLeft.y;
                const trY = points2TopRight.y - point.y;
                const min = Math.min(blX, trX, blY, trY);
                if (min === blX) {
                  vector = { x: -blX, y: 0 };
                } else if (min === trX) {
                  vector = { x: trX, y: 0 };
                } else if (min === blY) {
                  vector = { x: 0, y: -blY };
                } else if (min === trY) {
                  vector = { x: 0, y: trY };
                }
              }
              const dist = magnitude(vector);
              return { vector, dist };
            }).sort((a, b) => b.dist - a.dist)[0];
            if (dist > 0) {
              const normal = multiply(vector, 1 / dist);
              let wantedAccel = multiply(normal, this.style.objectPush * (dist) / (container.outerWidth + container.outerHeight));
              const towards = vectorCombine(container.vecPosition, wantedAccel, negate(container2.vecPosition));
              if (magnitude(towards) < magnitude(vectorCombine(container.vecPosition, negate(container2.vecPosition)))) {
                // Other direction.
                wantedAccel = multiply(wantedAccel, -10);
              }
              container.acceleration = vectorCombine(container.acceleration, wantedAccel);
            }
          } else {
            const distance = magnitude(vectorCombine(container.vecPosition, negate(container2.vecPosition)));
            if (0 < distance && distance < container.pushRadius + container2.pushRadius) {
              const normal = multiply(vectorCombine(container.vecPosition, negate(container2.vecPosition)), 1 / distance);
              container.acceleration = vectorCombine(container.acceleration, multiply(normal, this.style.objectPush * (container.pushRadius + container2.pushRadius - distance) / (container.pushRadius + container2.pushRadius)));
            }
          }
        }
      }
      // Friction
      if (magnitude(container.velocity) > this.style.frictionVelocity) {
        container.acceleration = vectorCombine(container.acceleration, multiply(container.velocity, -this.style.friction));
      }
      // Object pulls
      for (const { mult, minDist, maxDist, container: container2 } of container.pullRelationships ?? []) {
        const towards = vectorCombine(container2.vecPosition, negate(container.vecPosition));
        const distance = magnitude(towards);
        if (distance > maxDist) {
          // Pull towards
          const normal = multiply(towards, 1 / distance);
          container.acceleration = vectorCombine(container.acceleration, multiply(normal, (mult ?? 1) * this.style.objectPush * (distance - maxDist) / container.pushRadius));
        } else if (distance < minDist) {
          // Push away
          const normal = multiply(towards, -1 / distance);
          container.acceleration = vectorCombine(container.acceleration, multiply(normal, (mult ?? 1) * this.style.objectPush * (minDist - distance) / container.pushRadius));
        }
      }
    }
    // Update
    for (const container of this.containers) {
      container.preMovement?.();
      container.velocity = vectorCombine(container.velocity, container.acceleration);
      const curVel = magnitude(container.velocity);
      if (curVel > this.style.maxVelocity) {
        container.velocity = multiply(container.velocity, this.style.maxVelocity / curVel);
      }
      container.vecPosition = vectorCombine(container.vecPosition, multiply(container.velocity, TweenManager.curSpeed));
      container.position.set(container.vecPosition.x, container.vecPosition.y);
      container.postMovement?.();
    }

    if (this.style.drawArrows) {
      this.arrows.clear();
      for (const container of this.containers) {
        this.arrows.circle(container.position.x, container.position.y, 10).fill(black);
        this.arrows.moveTo(container.position.x, container.position.y);
        this.arrows.lineTo(container.position.x + container.velocity.x * this.style.drawnMultiplier, container.position.y + container.velocity.y * this.style.drawnMultiplier);
        this.arrows.stroke({ color: green, width: 10 });
        this.arrows.moveTo(container.position.x, container.position.y);
        this.arrows.lineTo(container.position.x + container.acceleration.x * this.style.drawnMultiplier, container.position.y + container.acceleration.y * this.style.drawnMultiplier);
        this.arrows.stroke({ color: red, width: 10 });
      }

      if (outer.type === 'circle') {
        this.arrows.circle(outer.x, outer.y, outer.radius).stroke({ color: black, width: 10 });
      }
      if (outer.type === 'doubleCircle') {
        this.arrows.circle(outer.position1.x, outer.position1.y, outer.radius1).stroke({ color: black, width: 10 });
        this.arrows.circle(outer.position2.x, outer.position2.y, outer.radius2).stroke({ color: black, width: 10 });
      }
    }
  }

  destroy() {
    super.destroy();
    GS.app.ticker.remove(this.ticker);
  }
}

const keydown = (e) => {
  if (e.key === 'k') {
    GS.globs.forEach((glob, i) => {
      // glob.reset();
      TweenManager.add(glob.combineGlobs('A', 'B'));
    });
  }
  if (e.key === 'h') {
    GS.globs[0].ticker();
  }
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;
  GS.easings = easings;

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();
  GS.app = app;

  GS.globs = [];
  /*const radiii = [50, 100, 150, 200];
  for (let i=0; i<4; i++) {
    for (let j=i; j<4; j++) {
      const globPoints = {
        A: {
          color: [red, green, blue][Math.floor(Math.random() * 3)],
          radius: radiii[i],
          position: {
            x: -radiii[i] * 1.2,
            y: 0,
          }
        },
        B: {
          color: [red, green, blue][Math.floor(Math.random() * 3)],
          radius: radiii[j],
          position: {
            x: radiii[j] * 1.2,
            y: 0,
          }
        },
      };
      const glob = new Globs(globPoints);
      GS.globs.push(glob);
    }
  }

  GS.globContainer = new PIXI.Container();
  GS.globs.forEach((glob, i) => {
    glob.position.set(500 + 1000 * ((i % 4) + (i === 9 ? 1 : 0)), 400 + 800 * (Math.floor(i / 4)));
    glob.draw();
    GS.screen.addChild(glob);
  })*/

  window.addEventListener('keydown', keydown);

  const globData = {};
  ['A', 'B', 'C', 'D', 'E'].forEach((k, i) => {
    const radius = Math.random() * 100 + 300;
    const position = {
      x: 1000 + 1000 * (i%3),
      y: 600 + 1200 * Math.floor(i/3),
    }
    const physicsArea = new PhysicsArea({
      outerPush: {
        type: 'circle',
        radius,
        ...position,
        force: 4,
      },
      defaultChildRadius: 150,
    });
    ['X', 'Y', 'Z'].forEach((l, j) => {
      const n = new Node(`${k}${l}`, { x: 0, y: 0 }, {});
      n.moveTo(position);
      physicsArea.addPhysicsChild(n.graphic);
      GS.screen.addChild(n.graphic);
      n.graphic.globKey = k;
    });
    GS.screen.addChild(physicsArea);
    physicsArea.start();
    globData[k] = {
      color: highlightColours[i % highlightColours.length],
      radius,
      position,
      physicsArea,
    }
  });

  const bigGlob = new Globs(globData);
  console.log(bigGlob.points);
  GS.screen.addChild(bigGlob);
  GS.globs = [bigGlob];
  bigGlob.start();
  bigGlob.initialCombine(['A', 'B', 'E']);
  bigGlob.initialCombine(['C', 'D']);

  window.TweenManager = TweenManager;
  window.glob = bigGlob;
}

const unloader = () => {
  window.removeEventListener('keydown', keydown);
};

export default { loader, unloader };
