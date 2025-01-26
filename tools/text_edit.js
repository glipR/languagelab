import { black } from "../colours.js";
import { delay, ImmediateTween, TweenManager } from "../tween.js";
import { mergeDeep } from "../utils.js";
import TextChanger from "./change_text.js";

class TextEdit extends TextChanger {
  constructor (text = "", style = {}) {
    const actualStyle = mergeDeep({
      tweenDuration: 0,
      moveDelay: 0,
      insertDelay: 0,
      deleteDelay: 0,
      keyMap: (key) => { if (key === ";") return "ε"; return key; },
      allowedChars: undefined,
      maxLength: undefined,
      textMap: (text) => text,
      cursor: { fill: black },
    }, style);
    super(text, actualStyle);
    this.cursorIndex = text.length;
    this.cursor = new PIXI.Graphics();
    this.cursor.rect(0, 0, 2, this.style.charHeight).fill(this.style.cursor.fill);
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.addChild(this.cursor);
    this.active = true;

    const makeTween = (target, duration) => {
      return new ImmediateTween(() => {
        this.cursor.alpha = target
      }).then(delay(duration)).then(new ImmediateTween(() => {
        TweenManager.add(makeTween(1-target, duration));
      }))
    }
    TweenManager.add(makeTween(1, 30));


    this.onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        this.tryMoveCursor(-1);
      } else if (e.key === "ArrowRight") {
        this.tryMoveCursor(1);
      } else if (e.key === "Escape") {
        this.onEscape?.();
      } else if (e.key === "Backspace") {
        this.deletePressed();
      } else if (e.key === "Enter") {
        if (this.active) {
          this.onEnter?.();
        }
      } else if (e.key.length === 1) {
        this.keyTyped(e.key);
        e.preventDefault();
      }
    }
    this.activate();
  }

  tryMoveCursor(delta) {
    const newIndex = this.cursorIndex + delta;
    if (newIndex < 0 || newIndex > this.curText.length) {
      return;
    }
    this.cursorIndex = newIndex;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }
  deletePressed() {
    if (this.cursorIndex === 0) {
      this.onExtraBackspace?.();
      return;
    }
    const newText = this.style.textMap(this.curText.slice(0, this.cursorIndex-1) + this.curText.slice(this.cursorIndex));
    TweenManager.add(this.changeText(newText));
    this.cursorIndex -= 1;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }
  keyTyped(key) {
    key = this.style.keyMap(key);
    if (this.style.allowedChars && !this.style.allowedChars.includes(key)) {
      return;
    }
    if (this.style.maxLength && this.curText.length >= this.style.maxLength) {
      return
    }
    const newText = this.style.textMap(this.curText.slice(0, this.cursorIndex) + key + this.curText.slice(this.cursorIndex));
    TweenManager.add(this.changeText(newText));
    this.cursorIndex += 1;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
    this.onChange?.(newText);
  }

  forceText(text, cursorIndex) {
    TweenManager.add(this.changeText(this.style.textMap(text)));
    this.cursorIndex = cursorIndex === undefined ? text.length : cursorIndex;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }

  clear() {
    TweenManager.add(this.changeText(this.style.textMap("")));
    this.curText = "";
    this.cursorIndex = 0;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }

  activate() {
    window.addEventListener("keydown", this.onKeyDown);
    this.active = true;
  }

  deactivate() {
    window.removeEventListener("keydown", this.onKeyDown);
    this.active = false;
  }

  destroy(options) {
    this.deactivate();
    super.destroy(options);
  }
}

export default TextEdit;
