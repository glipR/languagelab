import { SceneManager } from './scene.js';
import Progress from './tools/progress.js';
import {rgb_to_oklab, oklab_to_rgb} from 'https://cdn.jsdelivr.net/npm/oklab.ts@2.2.7/+esm'

// Keys ignored from deep merge.
const IGNORED_KEYS = [
  "physicsArea",
]

export const color_to_lch = (color) => {
  const {L, a, b} = rgb_to_oklab({r: color.red * 255, g: color.green * 255, b: color.blue * 255});
  const C = Math.sqrt(a ** 2 + b ** 2);
  const h = Math.atan2(b, a);
  return {L, C, h};
}
export const lch_to_color = ({L, C, h}) => {
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const rgb = oklab_to_rgb({L, a, b});
  return new PIXI.Color(rgb);
}

export const average_color = (colors, weights) => {

  weights = weights ?? colors.map(() => 1);
  const lch = colors.map(color_to_lch);
  const { L, C, h } = lch.reduce((acc, color, i) => {
    acc.L += color.L * weights[i];
    acc.C += color.C * weights[i];
    acc.h += color.h * weights[i];
    return acc;
  }, { L: 0, C: 0, h: 0 });
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  return lch_to_color({ L: L / totalWeight, C: C / totalWeight, h: h / totalWeight });
}

export const magnitude = (vector) => {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2);
}

export const applyAxisWise = (func, ...vectors) => {
  return vectors.reduce((acc, vector) => {
    acc.x = func(acc.x, vector.x);
    acc.y = func(acc.y, vector.y);
    return acc;
  }, { x: 0, y: 0 });
}

export const vectorCombine = (...vectors) => {
  return applyAxisWise((a, b) => a + b, ...vectors);
}

export const negate = (vector) => {
  return { x: -vector.x, y: -vector.y };
}

export const multiply = (vector, scalar) => {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

export const rotate = (vector, angle) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

export const bezier = (t, ...points) => {
  if (points.length === 1) {
    return {
      position: points[0],
      angle: 0,
      tangent: { x: 0, y: 0 },
    }
  }
  else if (points.length === 2) {
    return {
      position: {
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
      },
      angle: Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x),
      tangent: {
        x: points[1].x - points[0].x,
        y: points[1].y - points[0].y,
      },
    }
  }

  const nextPoints = [];
  for (let i = 0; i < points.length - 1; i++) {
    nextPoints.push({
      x: points[i].x + (points[i + 1].x - points[i].x) * t,
      y: points[i].y + (points[i + 1].y - points[i].y) * t,
    });
  }

  return bezier(t, ...nextPoints);
}

export const bezierLength = (...points) => {
  const steps = 100;
  let totalLength = 0;
  for (let i=1; i<=steps; i++) {
    totalLength += magnitude(bezier(i / steps, ...points).tangent)
  }
  return totalLength;
}

export const inverseBezierRateFunction = (...points) => {
  // Generates a function which takes a time t, and will try to then return a time t such that the partial distance covered over the bexier function is t.
  const steps = 50;
  const lengths = [0];
  for (let i=1; i<=steps; i++) {
    lengths.push(lengths[i-1] + magnitude(bezier(i / steps, ...points).tangent));
  }
  return (t) => {
    const targetLength = Math.max(t * lengths[lengths.length-1], 1e-9);
    // Binary search for the correct index, then linearly interpolate between the two indices.
    let left = 0;
    let right = steps;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (lengths[mid] < targetLength) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    let ratio = (targetLength - lengths[left-1]) / (lengths[left] - lengths[left-1]);
    if (lengths[left] === lengths[left-1]) {
      ratio = 0;
    }
    return (left - 1 + ratio) / steps;
  }
}

export const partialBezier = (t, ...points) => {
  // Generate the bezier anchors for a partial bezier curve.
  if (points.length === 1) {
    return points[0];
  }
  const startPoint = points[0];
  const endPoint = bezier(t, ...points).position;
  const internalAnchors = [];

  // This is always the first anchor of each iteration of the bezier curve.
  const anchorsLength = points.length - 2;
  for (let iter=0; iter < anchorsLength; iter++) {
    let nextPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      nextPoints.push({
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      });
    }
    internalAnchors.push(nextPoints[0]);
    points = nextPoints;
  }
  // Insert the first anchor of this iteration.
  return [startPoint, ...internalAnchors, endPoint];
}

export const reverseEasing = (easing) => {
  return (t) => easing(1 - t);
}

export const combineEasing = (easings, proportions) => {
  const totalProportion = proportions.reduce((acc, proportion) => acc + proportion, 0);
  return (t) => {
    let val = t * totalProportion;
    for (let i=0; i<easings.length; i++) {
      if (0 < val && val <= proportions[i]) {
        return easings[i](val / proportions[i]);
      }
      val -= proportions[i];
    }
    return easings[0](0);
  }
}

const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

const isColor = (item) => {
  return item && item.red !== undefined;
}

export const mergeDeep = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  // Merge single source into target.
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isColor(source[key])) {
        target[key] = new PIXI.Color(source[key]);
      } else if (isObject(source[key]) && !IGNORED_KEYS.includes(key)) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key]
      }
    }
  }
  return mergeDeep(target, ...sources);
}

export class StepScenes {
  constructor (container, taskKey, tasks, onComplete, reloadOnFailure, instructions, progressOpts) {
    this.tasks = tasks;
    this.taskKey = taskKey;
    this.container = container;
    this.onComplete = onComplete;
    this.reloadOnFailure = reloadOnFailure;
    this.successModal = this.container.getElementsByClassName("successModal")[0];
    this.failureModal = this.container.getElementsByClassName("failureModal")[0];
    this.progress = new Progress(instructions ?? tasks.map(()=>'empty'), progressOpts ?? {});
    this.index = this.progress.current;

    this.successModal.getElementsByClassName("modalButton")[0].addEventListener("click", () => {
      this.successModal.style.display = "none";
      this.index++;
      if (this.index >= this.tasks.length) {
        SceneManager.unloadScene(this.taskKey);
        this.onComplete?.();
      } else {
        SceneManager.loadScene(this.taskKey, this.tasks[this.index]);
      }
    });
    this.failureModal.getElementsByClassName("modalButton")[0].addEventListener("click", () => {
      this.failureModal.style.display = "none";
      if (this.reloadOnFailure) {
        SceneManager.loadScene(this.taskKey, this.tasks[this.index]);
      }
    });
  }

  makeOnSuccess() {
    return (msg) => this.onSuccess(msg);
  }

  makeOnFailure() {
    return (msg) => this.onFailure(msg);
  }

  onSuccess (msg) {
    this.successModal.getElementsByClassName("successMsg")[0].innerHTML = msg;
    this.successModal.style.display = "flex";
    this.progress.markCompleted(this.index);
    console.log(this.index, this.progress);
  }

  onFailure (msg) {
    this.failureModal.getElementsByClassName("failureMsg")[0].innerHTML = msg;
    this.failureModal.style.display = "flex";
  }
}

export const trueOnce = (key) => {
  const res = localStorage.getItem(key);
  localStorage.setItem(key, "true");
  return res === null;
}
