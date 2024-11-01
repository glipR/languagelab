import { bg, black, highlightColours, red } from '../colours.js';
import { mergeDeep } from '../utils.js';

class Categories {
  constructor(categories, data, width, height, screen, options) {
    // Categories is an array of strings
    // Data is an array of objects, each containing a category and a value
    this.categories = categories;
    this.data = data;
    this.screen = screen;

    this.style = mergeDeep({
      vertPadding: [50, 10],
      horiPadding: 10,
      areaPadding: 10,
      itemVPadding: 5,
      itemWPadding: 5,
      itemColours: [black, ...highlightColours],
      area: {
        stroke: {
          width: 3,
        },
        fill: {
          color: bg,
        }
      },
      heading: {},
      background: {
        fill: {
          color: bg,
        },
        stroke: {
          color: black,
          width: 2,
        }
      },
      item: {
        box: {
          fill: {
            color: bg,
          },
          stroke: {
            width: 2,
            color: black,
          }
        },
        text: {

        }
      }
    }, {...options?.style});

    // Colour all items by category on submit.
    this.showAll = options?.showAll ?? false;
    // Highlight incorrect items on submit.
    this.showIncorrect = options?.showIncorrect ?? false;

    this.state = {
      selected: -1,
      assigned: this.data.map(() => -1),
    }

    this.graphic = new PIXI.Container();
    this.background = new PIXI.Graphics();
    this.background
      .rect(0, 0, width, height)
      .fill({...this.style.background.fill})
      .stroke({...this.style.background.stroke});
    this.graphic.addChild(this.background);
    this.background.interactive = true;
    this.background.on('pointermove', (e) => this.onMouseMove(e));

    this.areaWidth = (width - 2 * this.style.horiPadding - this.categories.length * this.style.areaPadding) / (this.categories.length + 1);
    // Areas for each category, as well as uncategorised.
    this.areas = [];
    for (let i = 0; i < this.categories.length + 1; i++) {
      const area = new PIXI.Graphics();
      area
        .rect(
          this.style.horiPadding + i * (this.areaWidth + this.style.areaPadding), this.style.vertPadding[0],
          this.areaWidth,
          height - (this.style.vertPadding[0] + this.style.vertPadding[1]),
        )
        .fill({...this.style.area.fill})
        .stroke({color: this.style.itemColours[i], ...this.style.area.stroke});
      this.areas.push(area);
      this.graphic.addChild(area);
    }

    this.headings = [];
    for (let i = 0; i < this.categories.length; i++) {
      const text = new PIXI.Text({ text: this.categories[i], style: this.style.heading });
      text.anchor.set(0.5, 1);
      text.position.set(
        this.style.horiPadding + (i + 1) * (this.areaWidth + this.style.areaPadding) + this.areaWidth / 2,
        this.style.vertPadding[0],
      );
      this.headings.push(text);
      this.graphic.addChild(text);
    }

    this.items = [];
    for (let i = 0; i < this.data.length; i++) {
      this.itemWidth = this.areaWidth - 2 * this.style.itemWPadding;
      this.itemHeight = (height - (this.style.vertPadding[0] + this.style.vertPadding[1]) - this.style.itemVPadding * (this.data.length + 1)) / this.data.length;
      const itemBox = new PIXI.Graphics();
      itemBox
        .rect(
          0,
          0,
          this.itemWidth,
          this.itemHeight,
        )
        .fill({...this.style.item.box.fill})
        .stroke({...this.style.item.box.stroke});
      const itemText = new PIXI.Text({ text: this.data[i].value, style: {...this.style.item.text} });
      itemText.anchor.set(0.5, 0.5);
      itemText.position.set(
        this.itemWidth / 2,
        this.itemHeight / 2,
      );
      const item = new PIXI.Container();
      item.position.set(
        this.style.horiPadding + this.style.itemWPadding,
        this.style.vertPadding[0] + this.style.itemVPadding + i * (this.itemHeight + this.style.itemVPadding),
      )
      item.addChild(itemBox);
      item.addChild(itemText);
      this.items.push(item);
      this.graphic.addChild(item);

      // Interactivity
      item.interactive = true;
      item.buttonMode = true;
      item.on('pointerdown', (e) => this.onMouseDown(i, e));
      item.on('pointermove', (e) => this.onMouseMove(e));
      item.on('pointerup', (e) => this.onMouseUp(e));
    }
  }

  stopInteractivity() {
    this.background.interactive = false;
    for (let item of this.items) {
      item.interactive = false;
    }
  }

  onMouseDown(itemIndex, e) {
    this.state.selected = itemIndex;
    this.state.startSelect = this.graphic.toLocal(e.data.global);
    this.state.startSelect.x -= this.items[this.state.selected].position.x;
    this.state.startSelect.y -= this.items[this.state.selected].position.y;
  }

  onMouseMove(e) {
    if (this.state.selected !== -1) {
      const newGlobal = this.graphic.toLocal(e.data.global);
      this.items[this.state.selected].position.set(
        newGlobal.x - this.state.startSelect.x,
        newGlobal.y - this.state.startSelect.y,
      );
    }
  }

  onMouseUp(e) {
    if (this.state.selected !== -1) {
      // Place strictly within area.
      const item = this.items[this.state.selected];
      const possibleXs = [];
      for (let i = 0; i < this.categories.length + 1; i++) {
        possibleXs.push(this.style.horiPadding + i * (this.areaWidth + this.style.areaPadding) + this.areaWidth/2);
      }
      const closestIndex = possibleXs.reduce((acc, cur, i) => {
        const dist = Math.abs(cur - (item.position.x + this.itemWidth/2));
        if (dist < acc.dist) {
          return {dist, index: i};
        }
        return acc;
      }, {dist: Infinity, index: -1}).index;

      // Move to closest area.
      item.position.set(
        possibleXs[closestIndex] - this.areaWidth/2 + this.style.itemWPadding,
        this.style.vertPadding[0] + this.style.itemVPadding + this.state.selected * (this.itemHeight + this.style.itemVPadding),
      );
      // This is off by one to align with category indices, and so -1 is unassigned.
      this.state.assigned[this.state.selected] = closestIndex - 1;
      if (!this.state.assigned.includes(-1)) {
        this.onSubmit?.(this.validate());
      }

      this.state.selected = -1;
    }
  }

  validate() {
    // Once validated, don't allow the user to move elements.
    this.stopInteractivity();
    let msg = null;
    if (this.state.assigned.includes(-1)) {
      msg = "Not all items have been assigned.";
    }
    const incorrectCategories = [];
    for (let i = 0; i < this.state.assigned.length; i++) {
      if (this.data[i].category !== this.categories[this.state.assigned[i]]) {
        incorrectCategories.push(i);
      }
    }
    if (incorrectCategories.length > 0) {
      msg = `Incorrect data: ${incorrectCategories.map(i => this.data[i].value).join(", ")}`;
    }
    if (this.showAll || !msg) {
      for (let i = 0; i < this.state.assigned.length; i++) {
        const box = this.items[i].children[0];
        box.clear();
        box
          .rect(
            0,
            0,
            this.itemWidth,
            this.itemHeight,
          )
          .fill({...this.style.item.box.fill, color: this.style.itemColours[this.categories.indexOf(this.data[i].category) + 1]})
          .stroke({...this.style.item.box.stroke});
      }
    }
    if (this.showIncorrect && msg) {
      for (let i of incorrectCategories) {
        const box = this.items[i].children[0];
        box.clear();
        box
          .rect(
            0,
            0,
            this.itemWidth,
            this.itemHeight,
          )
          .fill({...this.style.item.box.fill, color: red})
          .stroke({...this.style.item.box.stroke});
      }
    }
    return msg;
  }

  reset() {
    this.state.assigned = this.data.map(() => -1);
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].position.set(
        this.style.horiPadding + this.style.itemWPadding,
        this.style.vertPadding[0] + this.style.itemVPadding + i * (this.itemHeight + this.style.itemVPadding),
      );
    }
  }
}

export default Categories;
