import { black } from "../colours.js";
import { delay, ImmediateTween, TweenManager } from "../tween.js";
import TextChanger from "./change_text.js";

class TextEdit extends TextChanger {
  constructor (text = "", style = {}) {
    super(text, {
      tweenDuration: 0,
      moveDelay: 0,
      insertDelay: 0,
      deleteDelay: 0,
      ...style
    });
    this.cursorIndex = text.length;
    this.cursor = new PIXI.Graphics();
    this.cursor.rect(0, 0, 2, this.style.charHeight).fill(black);
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.addChild(this.cursor);

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
      } else if (e.key === "Backspace") {
        this.deletePressed();
      } else if (e.key === "Enter") {
        this.onEnter?.();
      } else if (e.key.length === 1) {
        this.keyTyped(e.key);
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
      return;
    }
    const newText = this.curText.slice(0, this.cursorIndex-1) + this.curText.slice(this.cursorIndex);
    TweenManager.add(this.changeText(newText));
    this.cursorIndex -= 1;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }
  keyTyped(key) {
    if (key === ";") key = "ε";
    if (this.style.allowedChars && !this.style.allowedChars.includes(key)) {
      return;
    }
    if (this.style.maxLength && this.curText.length >= this.style.maxLength) {
      return
    }
    const newText = this.curText.slice(0, this.cursorIndex) + key + this.curText.slice(this.cursorIndex);
    TweenManager.add(this.changeText(newText));
    this.cursorIndex += 1;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }

  clear() {
    TweenManager.add(this.changeText(""));
    this.curText = "";
    this.cursorIndex = 0;
    const pos = this.transform(this.curText, this.cursorIndex);
    this.cursor.position.set(pos.x, pos.y);
    this.cursor.alpha = 1;
  }

  activate() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  deactivate() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  destroy(options) {
    this.deactivate();
    super.destroy(options);
  }
}

export default TextEdit;
