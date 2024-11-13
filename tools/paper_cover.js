const gsc = window.gameScaling ?? 1;

class Cover extends PIXI.Container {
  static covers = [];
  static generateCovers() {
    Cover.covers.forEach(cover => {
      cover.generateRandoms();
      cover.updateGraphic();
    });
  }

  constructor(object, style) {
    super();
    this.object = object;
    this.style = {...style};
    Cover.covers.push(this);
    this.bg = new PIXI.Graphics();
    this.bg.position.set(style.shadowOffset?.x ?? (3 * gsc), style.shadowOffset?.y ?? (3 * gsc));
    this.bg.alpha = style.shadowAlpha ?? 0.3;
    this.fg = new PIXI.Graphics();
    this.addChild(this.bg);
    this.addChild(this.fg);
    this.generateRandoms();
    this.updateGraphic();
  }

  clear() {
    this.bg.clear();
    this.fg.clear();
  }

  generateRandoms() {}
  updateGraphic() {}
}

// window.setInterval(() => { Cover.generateCovers() }, 1000);

export class CircleCover extends Cover {
  generateRandoms() {
    const length = this.style?.points || 10;
    this.randoms = Array.from({length}, () => ({
      radiusDiff: 0.5 - Math.random(),
      angleDiff: (0.5 - Math.random()) * Math.PI / length,
    }));
  }

  updateGraphic(extraStyle = {}) {
    this.style = {...this.style, ...extraStyle};
    this.bg.clear();
    this.fg.clear();
    const radius = this.style?.radius ?? this.object.width / 2;

    this.points = this.randoms.map(({radiusDiff, angleDiff}, index) => ({
      x: (1.4 * radius + radiusDiff * radius / 5) * Math.cos(angleDiff + index * 2 * Math.PI / this.randoms.length),
      y: (1.4 * radius + radiusDiff * radius / 5) * Math.sin(angleDiff + index * 2 * Math.PI / this.randoms.length),
    }));
    this.bg.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
    this.fg.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
    this.points.forEach(point => this.bg.lineTo(point.x, point.y));
    this.points.forEach(point => this.fg.lineTo(point.x, point.y));
    this.bg.fill(this.style?.shadow ?? 0x000000);
    this.fg.fill(this.style?.fill ?? 0xffffff);
  }
}

export class RectangleCover extends Cover {
  generateRandoms() {
    const length = this.style?.points || 12;
    this.randoms = Array.from({length}, () => ({
      xDiff: 0.5 - Math.random(),
      yDiff: 0.5 - Math.random(),
    }));
  }

  updateGraphic(extraStyle = {}) {
    this.style = {...this.style, ...extraStyle};
    const width = this.style?.width ?? this.object.width * 1.2 + 10 * gsc;
    const height = this.style?.height ?? this.object.height * 1.2;
    const randMult = this.style?.randMult ?? 0.2;
    this.bg.clear();
    this.fg.clear();
    this.points = this.randoms.map(({xDiff, yDiff}, index) => {
      const ratio = index / this.randoms.length;
      // Not actual perimeter but works for ratios
      const perimeter = 2 * width + 2 * height;
      let base = {};
      if (ratio < width / perimeter) {
        base = {
          x: -width / 2 + perimeter * ratio,
          y: -height / 2,
        }
      } else if (ratio < (width + height) / perimeter) {
        base = {
          x: width / 2,
          y: -height / 2 + perimeter * (ratio - width / perimeter),
        }
      } else if (ratio < (2 * width + height) / perimeter) {
        base = {
          x: width / 2 - perimeter * (ratio - (width + height) / perimeter),
          y: height / 2,
        }
      } else {
        base = {
          x: -width / 2,
          y: height / 2 - perimeter * (ratio - (2 * width + height) / perimeter),
        }
      }
      return {
        x: base.x + xDiff * width * randMult,
        y: base.y + yDiff * height * randMult,
      }
    });
    this.bg.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
    this.fg.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
    this.points.forEach(point => this.bg.lineTo(point.x, point.y));
    this.points.forEach(point => this.fg.lineTo(point.x, point.y));
    this.bg.fill(this.style?.shadow ?? 0x000000);
    this.fg.fill(this.style?.fill ?? 0xffffff);
  }
}
