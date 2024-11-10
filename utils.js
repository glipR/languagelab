import { SceneManager } from './scene.js';
import Progress from './tools/progress.js';

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

export const bezier = (t, ...points) => {
  if (points.length === 1) {
    return {
      position: points[0],
      angle: 0,
    }
  }
  else if (points.length === 2) {
    return {
      position: {
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
      },
      angle: Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x),
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
      } else if (isObject(source[key])) {
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
