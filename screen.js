// Frames the screen so that graph descriptions can be screen size agnostic.

import { black } from "./colours.js";


class Screen {
  static borderWidth = 5;
  static borderColor = 0x000000;

  constructor(app, hideBG=false, showBorder=false) {
    this.container = new PIXI.Container();
    const texture = PIXI.Texture.from('bg');
    this.bg = new PIXI.TilingSprite({
      texture: texture,
      width: app.renderer.width,
      height: app.renderer.height,
    })
    if (hideBG) {
      this.bg.alpha = 0;
    }
    this.border = new PIXI.Graphics();
    this.container.addChild(this.border);
    this.border.alpha = showBorder ? 1 : 0;
    this.childElements = new PIXI.Container();
    this.container.addChild(this.childElements);
    app.stage.addChild(this.bg);
    app.stage.addChild(this.container);
    if (!hideBG) {
      const widthScaling = window.innerWidth / texture.width;
      const heightScaling = window.innerHeight / texture.height;
      // For 20% cover.
      const actualScaling = Math.max(widthScaling, heightScaling) / 5;
      this.bg.tileScale.x = actualScaling;
      this.bg.tileScale.y = actualScaling;
      // tilePosition is based on the texture coordinates
      this.bg.tilePosition.x = -(app.canvas.getBoundingClientRect().x + window.scrollX)// / actualScaling;
      this.bg.tilePosition.y = -(app.canvas.getBoundingClientRect().y + window.scrollY)// / actualScaling;
    }

  }

  static fakeApp(container, width, height) {
    return {
      renderer: {
        width,
        height,
      },
      stage: container,
    }
  }

  setScreenSize(width, height) {
    this.width = width;
    this.height = height;
  }

  setGameSize(width, height) {
    this.gameWidth = width;
    this.gameHeight = height;

    this.border.rect(0, 0, this.gameWidth, this.gameHeight).stroke({ color: black, width: 5 });
  }

  scaleToFit(stretch=false) {
    const scaleX = this.width / this.gameWidth;
    const scaleY = this.height / this.gameHeight;
    if (stretch) {
      this.container.scale.set(scaleX, scaleY);
    } else {
      this.container.scale.set(Math.min(scaleX, scaleY));
    }

    // Shift to fit.
    this.container.position.set(
      (this.width/2 - this.gameWidth * this.container.scale.x / 2),
      (this.height/2 - this.gameHeight * this.container.scale.y / 2)
    );
  }

  addChild(child) {
    this.childElements.addChild(child);
  }

  addChildAt(child, index) {
    this.childElements.addChildAt(child, index);
  }

  globalToLocal(x, y) {
    return this.container.toLocal(new PIXI.Point(x, y));
  }

  localToGlobal(x, y) {
    return this.container.toGlobal(new PIXI.Point(x, y));
  }
}

export default Screen;
