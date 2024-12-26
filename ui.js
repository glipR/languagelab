import { black, white, red, lightGrey } from "./colours.js";
import { mergeDeep } from "./utils.js";

const gsc = window.gameScaling ?? 1;

class KeyEntryModal extends PIXI.Container {
  static acceptedCharacters = "abcdefghiklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  constructor(prompt, maxKeyLength, acceptedCharacters, promptStyle, showText) {
    super();
    this.maxKeyLength = maxKeyLength;
    this.curText = "";
    this.acceptedCharacters = acceptedCharacters ?? KeyEntryModal.acceptedCharacters;
    this.visible = false;
    this.bg = new PIXI.Graphics();
    this.bg.alpha = 0.4;
    this.prompt = new PIXI.Text({ text: prompt, style: { ...promptStyle, fill: white, fontSize: 48 } });
    this.prompt.anchor.set(0.5, 0.5);
    this.showText = showText === undefined ? this.maxKeyLength > 1 : showText;
    this.enteredText = new PIXI.Text({ text: "", style: { fill: white, fontSize: 36 } });
    this.enteredText.anchor.set(0.5, 0.5);
    this.validationText = new PIXI.Text({ text: "", style: { fill: red, fontSize: 24 } });
    this.validationText.anchor.set(0.5, 0.5);
    this.addChild(this.bg);
    this.addChild(this.prompt);
    this.addChild(this.enteredText);
    this.addChild(this.validationText);

    // Extra features:
    // Map text
    this.textMap = (text) => text;
    this.validation = (text) => null;

    this.keydownListener = (e) => {
      if (!this.visible) return;
      if (e.key === "Backspace") {
        this.validationText.text = "";
        if (this.curText.length > 0) {
          this.curText = this.curText.slice(0, -1)
          this.curText = this.textMap(this.curText);
          this.onChange?.(this.curText);
        } else {
          this.onExtraBackspace?.();
          this.deactivate();
        }
      } else if (this.acceptedCharacters.includes(e.key) && this.curText.length < this.maxKeyLength) {
        const addedChar = e.key === ";" ? "ε" : e.key;
        this.validationText.text = "";
        this.curText = this.curText + addedChar;
        this.curText = this.textMap(this.curText);
        this.onChange?.(this.curText);
        if (this.maxKeyLength == 1) {
          this.onEnter?.(this.curText);
          this.deactivate();
        }
        e.preventDefault();
      } else if (e.key === "Enter") {
        const curValidation = this.validation(this.curText);
        if (curValidation) {
          this.validationText.text = curValidation;
        } else {
          this.onEnter?.(this.curText);
          this.deactivate();
        }
      } else if (e.key === "Escape") {
        this.deactivate();
      }
      if (this.showText) {
        this.enteredText.text = this.curText;
      }
    };
    window.addEventListener("keydown", this.keydownListener);
    this.setDimensions(400, 400);
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.bg.clear();
    this.bg.rect(0, 0, width, height).fill(black);
    this.prompt.position.set(width / 2, height / 2);
    this.enteredText.position.set(width / 2, height / 2 + 60);
    this.validationText.position.set(width / 2, height / 2 + 100);
    // For some reason this depends on the previous width/height?
    this.scale.set(1);
  }

  activate() {
    this.visible = true;
    this.curText = "";
    this.enteredText.text = this.curText;
  }

  deactivate() {
    this.visible = false;
  }

  destroy() {
    window.removeEventListener("keydown", this.keydownListener);
    super.destroy();
  }
}

class FloatingButton extends PIXI.Container {
  constructor(opts) {
    super();
    this.opts = mergeDeep({
      label: {
        text: "",
        fill: black,
        fontSize: 24 * gsc,
      },
      bg: {
        fill: white,
        disabledFill: lightGrey,
        stroke: { color: black, width: 2 },
      },
      width: 100 * gsc,
      height: 100 * gsc,
    }, opts);
    this.disabled = false;
    this.bg = new PIXI.Graphics()
      .rect(0, 0, this.opts.width, this.opts.height)
      .fill(new PIXI.Color(0xffffff))
      .stroke(this.opts.bg.stroke);
    this.bg.tint = this.opts.bg.fill;
    this.addChild(this.bg);

    this.interactive = true;
    this.buttonMode = true;
    this.cursor = "pointer";
    this.on("pointerdown", () => {
      if (!this.disabled) {
        this.onClick?.();
      }
    });

    if (this.opts?.label?.text) {
      this.label = new PIXI.Text({ text: this.opts?.label?.text, style: { ...this.opts.label } });
      this.label.anchor.set(0.5, 0.5);
      this.label.position.set(this.opts.width / 2, this.opts.height / 2);
      this.addChild(this.label);
    }
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    if (this.disabled) {
      this.bg.cursor = "default";
      this.bg.tint = this.opts.bg.disabledFill;
    } else {
      this.bg.cursor = "pointer";
      this.bg.tint = this.opts.bg.fill;
    }
  }
}

class Checkbox extends PIXI.Container {

  constructor(checked) {
    super();
    this.box = new PIXI.Graphics().rect(0, 0, 20, 20).fill(white).stroke({ color: black, width: 2 });
    this.tick = new PIXI.Graphics().moveTo(5, 8).lineTo(10, 15).lineTo(20, -5).stroke({ color: black, width: 5 });
    this.addChild(this.box);
    this.addChild(this.tick);
    this.setChecked(checked);

    this.box.interactive = true;
    this.box.buttonMode = true;
    this.box.cursor = "pointer";
    this.box.on("pointerdown", () => {
      this.tick.visible = !this.tick.visible;
      this.onChange?.(this.tick.visible);
    });
  }

  setChecked(checked) {
    this.tick.visible = checked;
  }

  isChecked() {
    return this.tick.visible;
  }

}

class TextEntry extends PIXI.Container {
  constructor(maxKeyLength, startText, opts) {
    super();
    this.maxKeyLength = maxKeyLength;
    this.curText = startText ?? "";
    this.opts = mergeDeep({
      bg: {
        width: 150,
        height: 30,
        fill: white,
        stroke: { color: black, width: 2 },
      },
      text: {
        leftPad: 5,
        style: { fill: black, fontSize: 24, fontFamily: "Firasans Regular" }
      },
      cursor: {
        heightPad: 5,
        style: {
          color: black,
          width: 2,
        }
      }
    }, opts);
    this.bg = new PIXI.Graphics();
    this.bg
      .rect(0, 0, this.opts.bg.width, this.opts.bg.height)
      .fill(this.opts.bg.fill)
      .stroke(this.opts.bg.stroke);
    this.bg.interactive = true;
    this.bg.buttonMode = true;
    this.bg.cursor = "text";
    this.maskRect = new PIXI.Graphics().rect(0, 0, this.opts.bg.width, this.opts.bg.height).fill(white);
    this.text = new PIXI.Text({ text: this.curText, style: this.opts.text.style });
    this.text.anchor.set(0, 0.5);
    this.text.position.set(this.opts.text.leftPad, this.opts.bg.height / 2);
    this.cursor = new PIXI.Graphics()
      .moveTo(this.opts.text.leftPad, this.opts.cursor.heightPad)
      .lineTo(this.opts.text.leftPad, this.opts.bg.height - this.opts.cursor.heightPad)
      .stroke(this.opts.cursor.style);
    // Hide
    this.cursor.position.set(-100, 0);
    this.focused = false;
    this.focusedIndex = startText.length;
    this.bg.on("pointerdown", (e) => {
      this.focused = true;
      const curX = this.toLocal(e.data.global).x;
      const unPadded = curX - this.opts.text.leftPad;
      // Get the character index
      let charIndex = 0;
      let curWidth = 0;
      while (charIndex < this.curText.length && curWidth < unPadded) {
        curWidth += this.text.width / this.curText.length;
        charIndex++;
      }
      this.cursor.position.set(curWidth, 0);
      this.focusedIndex = charIndex;
    });
    this.keydownListener = (e) => {
      if (this.focused) {
        if (e.key === "Backspace") {
          this.curText = this.curText.slice(0, this.focusedIndex - 1) + this.curText.slice(this.focusedIndex);
          this.focusedIndex = Math.max(0, this.focusedIndex - 1);
        } else if (e.key.length === 1 && (!this.maxKeyLength || this.curText.length < this.maxKeyLength)) {
          this.curText = this.curText.slice(0, this.focusedIndex) + e.key + this.curText.slice(this.focusedIndex);
          this.focusedIndex = Math.min(this.curText.length, this.focusedIndex + 1);
          e.preventDefault();
        } else if (e.key === "Enter" || e.key === "Escape") {
          this.focused = false;
        } else if (e.key === "ArrowLeft") {
          this.focusedIndex = Math.max(0, this.focusedIndex - 1);
        } else if (e.key === "ArrowRight") {
          this.focusedIndex = Math.min(this.curText.length, this.focusedIndex + 1);
        }
        this.text.text = this.curText;
        this.cursor.position.set(this.text.width / this.curText.length * this.focusedIndex, 0);
        this.onChange?.(this.curText);
        return;
      }
    };
    window.addEventListener("keydown", this.keydownListener);

    this.addChild(this.maskRect);
    this.mask = this.maskRect;
    this.addChild(this.bg);
    this.addChild(this.text);
    this.addChild(this.cursor);
  }

  destroy() {
    window.removeEventListener("keydown", this.keydownListener);
    super.destroy();
  }

}

export { KeyEntryModal, Checkbox, TextEntry, FloatingButton };
