import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { mergeDeep } from "./utils.js";

class TweenManager {
  static curSpeed = 1;
  static paused = false;

  static tweens = [];
  static instance = null;

  static togglePause () {
    TweenManager.paused = !TweenManager.paused;
    if (TweenManager.instance !== null) {
      if (TweenManager.paused) {
        TweenManager.instance.speed = 0;
      } else {
        TweenManager.instance.speed = TweenManager.curSpeed;
      }
    }
  }

  static setSpeed(speed) {
    TweenManager.curSpeed = speed;
    if (TweenManager.instance !== null)
      TweenManager.instance.speed = speed;
  }

  static add(tween) {
    this.tweens.push(tween);
    tween.onStart?.();
  }

  static update(dt) {
    if (this.paused) {
      return;
    }
    const dtScaled = dt * this.curSpeed;
    const to_remove = [];
    for (let i = 0; i < this.tweens.length; i++) {
      if (!this.tweens[i].update) {
        console.log(this.tweens[i]);
      }
      this.tweens[i].update(dtScaled);
      if (this.tweens[i].finished) {
        to_remove.push(i);
        // Just in case this gets added again (probably still broken for most tweens)
        this.tweens[i].elapsed = 0;
        this.tweens[i].finished = false;
      }
    }
    this.tweens = this.tweens.filter((_, i) => !to_remove.includes(i));
  }

  static skipSeconds(seconds) {
    const fixedDT = 2;
    let curT = 0;
    const endT = seconds * 60;
    while (curT < endT - fixedDT) {
      this.update(fixedDT / TweenManager.curSpeed);
      curT += fixedDT;
    }
    this.update((endT - curT) / TweenManager.curSpeed);
  }

  static skipToEnd() {
    while (this.tweens.length > 0) {
      this.update(100000);
    }
  }

  static clear() {
    this.tweens = [];
  }
}

class Tween {
  constructor (duration, easing, onUpdate, onStart, onComplete) {
    this.duration = duration;
    this.easing = easing;
    this.onStart = onStart;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;

    this.elapsed = 0;
    this.finished = false;
    this.finalTween = null;
    this.totalDuration = duration;
  }

  update(dt) {
    if (this.finished) {
      return;
    }

    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.elapsed = this.duration;
      this.finished = true;
    }
    this.callUpdate(this, this.elapsed / this.duration);

    if (this.finished) {
      this.onComplete?.();
    }
  }

  callUpdate(self, elapsedRatio) {
    if (!self.easing) {
      console.log(self);
    }
    self.onUpdate(self.easing(elapsedRatio));
  }

  during(tween, fromStart = false) {
    // THIS ASSUMES THE DURATION AND EASING IS THE SAME
    if (this.finalTween !== null && !fromStart) {
      this.finalTween.during(tween);
      return this;
    }
    const oldStart = this.onStart;
    const oldcallUpdate = this.callUpdate;
    const oldComplete = this.onComplete;
    this.onStart = () => {
      oldStart?.(0);
      tween.onStart?.();
    };
    this.callUpdate = (self, ratio) => {
      oldcallUpdate(self, ratio);
      tween.callUpdate(tween, ratio);
    }
    this.onComplete = () => {
      oldComplete?.();
      tween.onComplete?.();
    };
    return this;
  }

  then(...tweens) {
    if (this.finalTween !== null) {
      const originalDuration = this.finalTween.duration;
      this.finalTween.then(...tweens);
      this.totalDuration = this.totalDuration - originalDuration + this.finalTween.totalDuration;
      this.finalTween = this.finalTween.finalTween;
      return this;
    }
    const oldComplete = this.onComplete;
    this.onComplete = () => {
      oldComplete?.();
      tweens.forEach(tween => TweenManager.add(tween));
    };
    let max = tweens[0];
    let maxIndex = 0;
    for (let i = 0; i < tweens.length; i++) {
      let considering = tweens[i];
      if (tweens[i].finalTween) {
        considering = tweens[i].finalTween;
      }
      if (tweens[i].totalDuration > max.totalDuration) {
        max = considering;
        maxIndex = i;
      }
    }
    this.finalTween = max;
    this.totalDuration = this.duration + tweens[maxIndex].totalDuration;
    return this;
  }
}

const interpValue = (start, end, t, tweenObj=false) => {
  if (typeof start === 'number') {
    return start + (end - start) * t;
  }
  else if (tweenObj) {
    // Tween every property of the object
    const newObj = {};
    const startMerge = mergeDeep({}, end, start);
    const endMerge = mergeDeep({}, start, end);
    for (const key in startMerge) {
      newObj[key] = interpValue(startMerge[key], endMerge[key], t);
    }
    return newObj
  }
  else if (start.x !== undefined) {
    if (end.x === NaN) { throw new Error('end.x is NaN'); }
    if (start.width !== undefined) {
      // Transform
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        width: start.width + (end.width - start.width) * t,
        height: start.height + (end.height - start.height) * t,
      }
    }
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
  }
  else if (start.red !== undefined) {
    return new PIXI.Color([
      start.red + (end.red - start.red) * t,
      start.green + (end.green - start.green) * t,
      start.blue + (end.blue - start.blue) * t,
      start.alpha + (end.alpha - start.alpha) * t,
    ])
  }
  else if (Array.isArray(start)) {
    return start.map((s, i) => s + (end[i] - s) * t);
  }
};

class PropertyTween extends Tween {
  constructor (object, property, start, end, duration, easing) {
    super(duration, easing, () => {}, (t) => {
      object[property] = interpValue(start, end, t);
    }, () => {object[property] = end});
  }
}

class ValueTween extends Tween {
  constructor (start, end, duration, easing, onUpdate, onStart, onComplete) {
    super(duration, easing, (t) => {
      onUpdate(interpValue(start, end, t));
    }, () => {
      onStart?.();
      onUpdate(interpValue(start, end, easing(0)))
    }, () => {
      onUpdate(interpValue(start, end, easing(1)))
      onComplete?.();
    });
  }
}

class ImmediateTween extends Tween {
  constructor (fn) {
    super(0, t => t, () => {}, fn);
  }
}

const delay = (duration) => new Tween(duration, t => t, () => {});
const chain = (tweens) => tweens.reduce((acc, tween) => acc.then(tween), delay(0));
const atOnce = (tweens) => tweens.slice(1).reduce((acc, tween) => acc.during(tween), tweens[0]);
const randomDelay = (tweens, maxDelay=20) => {
  const randoms = Array.from({length: tweens.length}, () => Math.random() * maxDelay);
  // Ensure the final delay time is always the same. For audio timing.
  const maxIndex = Math.floor(Math.random() * randoms.length);
  randoms[maxIndex] = maxDelay;
  return delay(0).then(...tweens.map((tween, i) => delay(randoms[i]).then(tween)))
};
const fade = (object, show=true, duration=60) => new ValueTween(0, 1, duration, easings.easeInOutQuad, (v) => {
  if (object.length !== undefined) {
    object.forEach(o => o.alpha = interpValue(o.startAlpha, o.endAlpha, v));
  } else {
    object.alpha = interpValue(object.startAlpha, object.endAlpha, v);
  }
}, () => {
  if (object.length !== undefined) {
    object.forEach(o => {
      o.startAlpha = o.alpha;
      o.endAlpha = show ? 1 : 0;
    });
  } else {
    object.startAlpha = object.alpha;
    object.endAlpha = show ? 1 : 0;
  }
});
const tweenFunction = (fn, duration) => new Tween(duration, t => t, fn);

export {
  TweenManager, Tween, PropertyTween, ValueTween, ImmediateTween,
  interpValue, delay, chain, atOnce, randomDelay, fade, tweenFunction
};
