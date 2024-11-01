import { ValueTween } from './tween.js';

class StyledText {
  constructor (texts, htmlStyles, baseStyle, currentCharacters) {
    this.baseStyle = baseStyle;
    this.setFullText(texts, htmlStyles);
    this.graphic = new PIXI.Container();
    this.containers = this.fullTextSplit.map(() => new PIXI.Container());
    this.covers = this.fullTextSplit.map(() => new PIXI.Graphics());
    this.fullMeasures = this.fullTextSplit.map((t) => PIXI.CanvasTextMetrics.measureText(t, this.baseStyle));
    this.htmlTexts = this.buildHTML(this.totalLetters, true, true).map((t) => new PIXI.HTMLText({ text: t, style: baseStyle }));
    const maxWidth = Math.max(...this.fullMeasures.map((m) => m.width));
    this.containers.forEach((container, i) => {
      container.mask = this.covers[i];
      container.addChild(this.covers[i]);
      container.addChild(this.htmlTexts[i]);
      container.position.set(maxWidth/2 - this.fullMeasures[i].width/2, i == 0 ? 0 : (this.containers[i-1].position.y + this.fullMeasures[i-1].height));
      this.graphic.addChild(container);
    });
    this.setCurrentCharacters(currentCharacters ?? this.totalLetters);
  }

  setCurrentCharacters (characters) {
    this.currentCharacters = characters;
    this.covers.forEach((cover) => cover.clear());
    const measures = this.buildHTML(this.currentCharacters, false, true).map((t) => PIXI.CanvasTextMetrics.measureText(t, this.baseStyle));
    this.covers.forEach((cover, i) => {
      if (i >= measures.length) return;
      cover.rect(0, 0, measures[i].width, measures[i].height).fill(0xffffff);
    });
  }

  setFullText(texts, htmlStyles) {
    this.texts = texts;
    this.htmlStyles = htmlStyles;
    this.totalLetters = this.texts.reduce((acc, text) => acc + text.length, 0);
    const partialSums = this.texts.reduce((acc, text) => acc.concat([[(acc.length === 0 ? 0 : acc[acc.length-1][0]) + text.length, text.length, text]]), []);
    console.log(this.totalLetters, partialSums)
    this.fullTextSplit = this.buildHTML(this.totalLetters, false, true);
    this.fullTextMetrics = this.fullTextSplit.map(t => PIXI.CanvasTextMetrics.measureText(t, this.baseStyle));
  }

  _applyStyle(text, style) {
    if (style === "br") {
      return "<br>";
    }
    return style ? `<span style="${style}">${text}</span>` : text;
  }

  buildHTML (characters, applyStyle = true, separateBreaks = false) {
    if (characters === undefined) {
      characters = this.totalLetters;
    }
    if (!separateBreaks) {
      let total = [];
      this.texts.forEach((text, i) => {
        if (characters <= 0) return;
        let style = this.htmlStyles[i];
        total.push(applyStyle ? this._applyStyle(text.slice(0, characters), style) : text.slice(0, characters));
        characters -= text.length;
      });
      return total.join('');
    } else {
      let total = [[]];
      this.texts.forEach((text, i) => {
        if (characters <= 0) return;
        let style = this.htmlStyles[i];
        if (style === "br") {
          total.push([]);
          return;
        }
        total[total.length-1].push(applyStyle ? this._applyStyle(text.slice(0, characters), style) : text.slice(0, characters));
        characters -= text.length;
      });
      return total.map((arr) => arr.join(''));
    }
  }

  writeTween (duration, easing) {
    return new ValueTween(0, this.totalLetters, duration, easing, (t) => {
      t = Math.floor(t);
      if (t !== this.currentCharacters) {
        this.setCurrentCharacters(t);
      }
    });
  }

  fadeTween (duration, easing) {
    return new ValueTween(1, 0, duration, easing, (t) => {
      this.graphic.alpha = t;
    });
  }
}

export default StyledText;
