class TweenManager {
  static curSpeed = 1;
  static paused = false;

  static tweens = [];

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
      }
    }
    this.tweens = this.tweens.filter((_, i) => !to_remove.includes(i));
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

const interpValue = (start, end, t) => {
  if (typeof start === 'number') {
    return start + (end - start) * t;
  }
  else if (start.x !== undefined) {
    if (end.x === NaN) { throw new Error('end.x is NaN'); }
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

const delay = (duration) => new Tween(duration, t => t, () => {});
const chain = (tweens) => tweens.reduce((acc, tween) => acc.then(tween), delay(0));
const atOnce = (tweens) => tweens.slice(1).reduce((acc, tween) => acc.during(tween), tweens[0]);
const randomDelay = (tweens, maxDelay=20) => delay(0).then(...tweens.map(tween => delay(Math.random() * maxDelay).then(tween)));

export {
  TweenManager, Tween, PropertyTween, ValueTween,
  interpValue, delay, chain, atOnce, randomDelay
};
