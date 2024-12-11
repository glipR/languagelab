import { white } from "../colours.js";
import { mergeDeep } from "../utils.js";
import { DrawnBezier } from "./drawnBezier.js";
import { RectangleCover } from "./paper_cover.js";

const gsc = window.gameScaling ?? 1;

class Table extends PIXI.Container {

  static baseStyle = {
    headerHeight: gsc * 80,
    headerWidth: gsc * 120,
    itemHeight: gsc * 50,
    itemWidth: gsc * 120,
    totalHeight: gsc * 500,
    totalWidth: gsc * 360,
    lines: {
      maxLineDist: gsc * 2,
      forcedDistance: 1,
    },
    cover: {
      points: 20,
      randMult: 0.05,
      paddingRatio: 1.1,
    },
  }

  constructor(style) {
    super();
    this.style = mergeDeep({...Table.baseStyle}, style);
    this.data = [];
    this.colHeaders = [];
    this.rowStarts = [];

    this.cover = new RectangleCover(this, {
      width: this.style.totalWidth * this.style.cover.paddingRatio,
      height: this.style.totalHeight * this.style.cover.paddingRatio,
      ...this.style.cover,
    });
    this.cover.position.set(this.style.totalWidth*0.5, this.style.totalHeight*0.5);
    this.addChild(this.cover);
    this.scrollContainer = new PIXI.Container();
    this.scrollContainer.mask = new PIXI.Graphics();
    this.scrollContainer.mask.rect(0, 0, this.style.totalWidth, this.style.totalHeight).fill(0x000000);
    this.scrollContainer.interactive = true;
    this.scrollContainer.addChild(this.scrollContainer.mask);
    this.scrollContainer.on('wheel', (e) => {
      // preventDefault doesn't work in PIXI :( so we have to do this.
      window.scrollBy(-e.deltaX, -e.deltaY);
      const newX = Math.max(0,Math.min(
        this.style.headerWidth + (this.data[0].length-1) * this.style.itemWidth - this.style.totalWidth,
        this.scrollContainer.pivot.x + e.deltaX
      ));
      const newY = Math.max(0,Math.min(
        this.style.headerHeight + (this.data.length-1) * this.style.itemHeight - this.style.totalHeight,
        this.scrollContainer.pivot.y + e.deltaY
      ));
      this.scrollContainer.pivot.set(newX, newY);
      this.scrollContainer.mask.position.set(newX, newY);
      this.topHeaderContainer.position.set(0, newY);
      this.topHeaderBGContainer.position.set(0, newY);
      this.topHeaderBGLineContainer.position.set(0, -newY);
    })
    this.addChild(this.scrollContainer);
    this.scrollContainer.pivot.set(0, 0);
    this.topHeaderContainer = new PIXI.Container();
    this.topHeaderBG = new PIXI.Graphics();
    this.topHeaderBG.rect(0, 0, this.style.totalWidth, this.style.headerHeight).fill(white);
    this.verticalLineContainer = new PIXI.Container();
    this.horizontalLineContainer = new PIXI.Container();
    this.elementContainers = new PIXI.Container();
    this.topHeaderBGContainer = new PIXI.Container();
    this.topHeaderBGLineContainer = new PIXI.Container();
    this.topHeaderBGContainer.addChild(this.topHeaderBG);
    this.topHeaderBGContainer.addChild(this.topHeaderBGLineContainer);
    this.topHeaderBGContainer.addChild(new DrawnBezier(this.style.lines, [{x:0, y:this.style.headerHeight}, {x:this.style.totalWidth, y:this.style.headerHeight}], 1));
    this.topHeaderBGContainer.mask = new PIXI.Graphics();
    this.topHeaderBGContainer.mask.rect(0, 0, this.style.totalWidth, this.style.headerHeight+1).fill(0x000000);
    this.topHeaderBGContainer.mask.position.set(0, 0);
    this.topHeaderBGContainer.addChild(this.topHeaderBGContainer.mask);
    this.scrollContainer.addChild(this.horizontalLineContainer);
    this.scrollContainer.addChild(this.verticalLineContainer);
    this.scrollContainer.addChild(this.elementContainers);
    this.scrollContainer.addChild(this.topHeaderBGContainer);
    this.scrollContainer.addChild(this.topHeaderContainer);
  }

  makeElementContainer(i, j) {
    const container = new PIXI.Container();
    // Add a clickable background to the container.
    const background = new PIXI.Graphics();
    const { width, height } = this.getElementSize(i, j);
    const { x, y } = this.getElementPosition(i, j);
    background.rect(-width/2, -height/2, width, height).fill(0x000000);
    background.alpha = 0;
    container.interactive = true;
    container.buttonMode = true;
    container.background = background;
    container.addChild(background);

    container.pivot.set(-width/2, -height/2);
    container.position.set(x, y);
    if (i === 0) {
      this.topHeaderContainer.addChild(container);
    }
    else {
      this.elementContainers.addChild(container);
    }

    container.onActions = {};
    container.subscribe = (action, callback) => {
      if (!(action in container.onActions)) {
        container.onActions[action] = [];
        container.on(action, (e) => {
          container.onActions[action].forEach((callback) => callback(e));
        });
        container.cursor = 'pointer';
      }
      container.onActions[action].push(callback);
    }

    container.contents = new PIXI.Container();
    container.addChild(container.contents);
    return container;
  }

  getElementPosition(i, j) {
    let x = 0;
    let y = 0;
    if (i !== 0) {
      // Not top row
      y = this.style.headerHeight + (i - 1) * this.style.itemHeight;
    }
    if (j !== 0) {
      // Not left column
      x = this.style.headerWidth + (j - 1) * this.style.itemWidth;
    }
    return { x, y };
  }

  getElementSize(i, j) {
    let width = this.style.itemWidth;
    let height = this.style.itemHeight;
    if (i === 0) {
      // Top row
      height = this.style.headerHeight;
    }
    if (j === 0) {
      // Left column
      width = this.style.headerWidth;
    }
    return { width, height };
  }

  resize(r, c) {
    this.data = Array(r+1).fill().map((_, r_i) => Array(c+1).fill().map((_, c_i) => {
      if (r_i < this.data.length && c_i < this.data[r_i].length) {
        return this.data[r_i][c_i];
      }
      return this.makeElementContainer(r_i, c_i);
    }));
    this.horizontalLineContainer.removeChildren();
    this.verticalLineContainer.removeChildren();
    this.topHeaderBGLineContainer.removeChildren();
    for (let i = 1; i <= r; i++) {
      const { x: x1, y: y1 } = this.getElementPosition(i, 0);
      const { x: x2, y: y2 } = this.getElementPosition(i, c+1);
      const drawnLine = new DrawnBezier(this.style.lines, [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ], 1);
      this.horizontalLineContainer.addChild(drawnLine);
    }
    for (let j = 1; j <= c; j++) {
      const { x: x1, y: y1 } = this.getElementPosition(0, j);
      const { x: x2, y: y2 } = this.getElementPosition(r+1, j);
      const drawnLine = new DrawnBezier(this.style.lines, [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ], 1);
      this.verticalLineContainer.addChild(drawnLine);
      const copy = drawnLine.copy();
      this.topHeaderBGLineContainer.addChild(copy);
    }
  }

  getContainer(i, j) {
    return this.data[i][j];
  }
}

export default Table;
