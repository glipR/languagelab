// Frames the screen so that graph descriptions can be screen size agnostic.


class Screen {
  static borderWidth = 5;
  static borderColor = 0x000000;

  constructor(app) {
    this.container = new PIXI.Container();
    const texture = PIXI.Texture.from('bg');
    this.bg = new PIXI.TilingSprite({
      texture: texture,
      width: app.renderer.width,
      height: app.renderer.height,
    })
    this.childElements = new PIXI.Container();
    this.container.addChild(this.childElements);
    app.stage.addChild(this.bg);
    app.stage.addChild(this.container);
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

  setScreenSize(width, height) {
    this.width = width;
    this.height = height;
  }

  setGameSize(width, height) {
    this.gameWidth = width;
    this.gameHeight = height;
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

  globalToLocal(x, y) {
    return this.container.toLocal(new PIXI.Point(x, y));
  }

  localToGlobal(x, y) {
    return this.container.toGlobal(new PIXI.Point(x, y));
  }
}

export default Screen;
