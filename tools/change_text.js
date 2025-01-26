// Allows you to modifying text and have characters shift to fit.

import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { black } from "../colours.js";
import { delay, interpValue, ValueTween } from "../tween.js";
import { mergeDeep } from "../utils.js";

const gsc = window.gameScaling ?? 1;

export const editDistance = (t1, t2, allowModify) => {
  const len1 = t1.length;
  const len2 = t2.length;
  const memTable = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  for (let i=0; i<=len1; i++) {
    for (let j=0; j<=len2; j++) {
      if (i === 0) {
        memTable[i][j] = j;
        continue;
      }
      if (j === 0) {
        memTable[i][j] = i;
        continue;
      }
      // We have the string t1[0..i-1] and t2[0..j-1] to compare
      const cost = t1[i-1] === t2[j-1] ? 0 : (allowModify ? 1 : Infinity);
      memTable[i][j] = Math.min(
        memTable[i-1][j] + 1, // Delete
        memTable[i][j-1] + 1, // Insert
        memTable[i-1][j-1] + cost // Replace (or do nothing)
      );
    }
  }
  return {
    distance: memTable[len1][len2],
    table: memTable,
  };
}

export const findCharacterMapping = (t1, t2, allowModify, forcedMaps={}) => {
  if (Object.entries(forcedMaps).length !== 0) {
    // Check forcedMaps are feasible
    for (let [from, to] of Object.entries(forcedMaps)) {
      if (t1[from] !== t2[to]) {
        throw new Error(`Forced map ${from} -> ${to} [${t1[from]} -> ${t2[to]}] is not feasible`);
      }
    }
    // Assumes that forcedMaps has no crossings (i.e. f[x] = y and f[x+a] = y-b)
    // Backtick shouldn't really show up ever
    const t1Split = Array.from(t1).map((char, index) => forcedMaps[index] !== undefined ? "`" : char).join("").split("`");
    const t2Split = Array.from(t2).map((char, index) => Object.values(forcedMaps).includes(index) ? "`" : char).join("").split("`");
    if (t1Split.length !== t2Split.length) {
      throw new Error(`Forced maps do not match up in length`);
    }
    let characterMapping = {...forcedMaps};
    let offset1 = 0;
    let offset2 = 0;
    for (let i=0; i<t1Split.length; i++) {
      const subMapping = findCharacterMapping(t1Split[i], t2Split[i], allowModify);
      for (let [from, to] of Object.entries(subMapping)) {
        characterMapping[parseInt(from) + offset1] = parseInt(to) + offset2;
      }
      offset1 += t1Split[i].length + 1; // +1 for the backtick
      offset2 += t2Split[i].length + 1; // +1 for the backtick
    }
    return characterMapping;
  }
  const { table } = editDistance(t1, t2, allowModify);
  // Find the path from t1,t2 to 0,0 which uses the least modifications.
  const modificationCountTable = Array(t1.length + 1).fill().map(() => Array(t2.length + 1).fill().map(() => ({ i: 0, j: 0, modified: 0 })));
  for (let i=1; i<= t1.length; i++) {
    modificationCountTable[i][0].i = i-1;
  }
  for (let j=1; j<= t2.length; j++) {
    modificationCountTable[0][j].j = j-1;
  }
  for (let i=1; i<= t1.length; i++) {
    for (let j=1; j<= t2.length; j++) {
      const options = [];
      if (table[i-1][j] === table[i][j] - 1) {
        options.push({
          i: i-1,
          j,
          modified: modificationCountTable[i-1][j].modified
        });
      }
      if (table[i][j-1] === table[i][j] - 1) {
        options.push({
          i,
          j: j-1,
          modified: modificationCountTable[i][j-1].modified
        });
      }
      const cost = t1[i-1] === t2[j-1] ? 0 : (allowModify ? 1 : Infinity);
      if (table[i-1][j-1] === table[i][j] - cost) {
        options.push({
          i: i-1,
          j: j-1,
          modified: modificationCountTable[i-1][j-1].modified + cost
        });
      }
      const bestOption = options.sort((a, b) => a.modified - b.modified)[0];
      modificationCountTable[i][j] = bestOption;
    }
  }
  const characterMapping = {};
  let i = t1.length;
  let j = t2.length;
  while (i > 0 || j > 0) {
    const bestOption = modificationCountTable[i][j];
    if (bestOption.i < i && bestOption.j < j) {
      characterMapping[i-1] = j-1;
    }
    i = bestOption.i;
    j = bestOption.j;
  }
  return characterMapping;
}

export class TextChanger extends PIXI.Container {
  static baseStyle = {
    text: {
      fontFamily: "Ittybittynotebook",
      fontSize: 32 * gsc,
      fill: black,
      align: 'center',
    },
    tweenDuration: 60,
    shiftHeight: 20 * gsc,
    charHeight: 30 * gsc, // 25 for regex intro animation.
    allowModify: false,
    deleteDelay: 0,
    moveDelay: 15,
    insertDelay: 30,
    align: 'center',
    transformOverwrites: {
      default: {
        width: 13 * gsc,
        xOffset: 0,
        yOffset: 0,
        scale: 1,
      },
      "l": {
        width: 10 * gsc,
        xOffset: 3 * gsc,
      },
      " ": {
        width: 10 * gsc,
      },
      ",": {
        width: 5 * gsc,
      },
      "r": {
        width: 11 * gsc,
      },
      "i": {
        width: 7 * gsc,
      },
      "o": {
        width: 15 * gsc,
      },
      "g": {
        width: 14 * gsc,
      },
      "(": {
        width: 11 * gsc,
      },
      ")": {
        width: 11 * gsc,
      },
      "b": {
        width: 14 * gsc,
        xOffset: -1 * gsc,
      },
      "|": {
        width: 10 * gsc,
        xOffset: 2 * gsc,
      },
      "*": {
        width: 8 * gsc,
        yOffset: -2 * gsc,
        xOffset: -2 * gsc,
      }
    }
  };
  constructor(text = "", style = {}) {
    super();
    this.curText = text;
    this.style = mergeDeep({}, TextChanger.baseStyle, style);
    this.word = Array.from(text).map((char, index) => this._createChar(char, index));
  }

  _createChar(char, index, curText) {
    const c = new PIXI.Text({ text: char, style: this.style.text });
    const pos = this._computePosition(curText ?? this.curText, index);
    c.position.set(pos.x, pos.y);
    const scale = this.style.transformOverwrites[char]?.scale ?? this.style.transformOverwrites.default.scale;
    c.scale.set(scale);
    this.addChildAt(c, 0); // Add this to the back, so highlights work.
    return c;
  }

  _computePosition(text, index) {
    const totalWidth = Array.from(text).reduce((acc, char) => acc + (this.style.transformOverwrites[char]?.width ?? this.style.transformOverwrites.default.width), 0);
    const pos = {
      x: this.style.transformOverwrites[text[index]]?.xOffset ?? this.style.transformOverwrites.default.xOffset,
      y: this.style.transformOverwrites[text[index]]?.yOffset ?? this.style.transformOverwrites.default.yOffset,
    }
    for (let i=0; i<index; i++) {
      pos.x += this.style.transformOverwrites[text[i]]?.width ?? this.style.transformOverwrites.default.width;
    }
    // Default is for 0 to be the leftmost character.
    if (this.style.align === 'center') {
      pos.x -= totalWidth / 2;
    }
    if (this.style.align === 'right') {
      pos.x -= totalWidth;
    }
    return pos;
  }

  transform(text, index) {
    const pos = this._computePosition(text, index);
    return {
      ...pos,
      width: (this.style.transformOverwrites[text[index]]?.width ?? this.style.transformOverwrites.default.width) - (this.style.transformOverwrites[text[index]]?.xOffset ?? this.style.transformOverwrites.default.xOffset),
      height: this.style.charHeight,
    }
  }

  changeText(newText, forceSubstring = false, forceMapping = {}) {
    let charMap = {};
    let solved = false;
    if (forceSubstring) {
      // We are letting this class know that our new text is either a substring, or contains the old text as a substring (pure delete/pure insert)
      if (newText.length < this.curText.length) {
        // Find newText substring in curText
        const index = this.curText.indexOf(newText);
        if (index !== -1) {
          for (let i=0; i<newText.length; i++) {
            charMap[index + i] = i;
          }
          solved = true;
        }
      }
      if (newText.length > this.curText.length) {
        // Find curText substring in newText
        const index = newText.indexOf(this.curText);
        if (index !== -1) {
          for (let i=0; i<this.curText.length; i++) {
            charMap[i] = index + i;
          }
          solved = true;
        }
      }
    }
    if (!solved) {
      charMap = findCharacterMapping(this.curText, newText, this.style.allowModify, forceMapping);
    }
    const reverseCharMap = Object.entries(charMap).reduce((acc, [from, to]) => {
      acc[to] = from;
      return acc;
    }, {});
    const deletedChars = Array.from(this.curText).map((_, index) => index).filter((index) => charMap[index] === undefined);
    const addedChars = Array.from(newText).map((_, index) => index).filter((index) => !Object.values(charMap).includes(index));
    let tweens = [];
    tweens = tweens.concat(deletedChars.map(index => this._deleteTween(this.word[index])));
    const addedWord = addedChars.map(index => this._createChar(newText[index], index, newText));
    tweens = tweens.concat(addedWord.map(c => this._addTween(c)));
    tweens = tweens.concat(Object.entries(charMap).map(([from, to]) => this._moveTween(this.word[from], from, this.curText, to, newText)));
    this.curText = newText;
    this.word = Array.from(newText).map((_, index) => reverseCharMap[index] !== undefined ? this.word[reverseCharMap[index]] : addedWord[addedChars.indexOf(index)]);
    if (tweens.length === 0) {
      return delay(0);
    }
    return delay(0).then(...tweens);
  }

  colorText(color, start, end) {
    return new ValueTween(0, 1, this.style.tweenDuration, easings.easeInOutQuad, (value) => {
      this.word.forEach((char, index) => {
        if (index >= start && index < end) {
          char.style.fill = interpValue(char.startFill, color, value);
        }
      });
    }, () => {
      this.word.forEach((char, index) => {
        if (index >= start && index < end) {
          char.startFill = char.style.fill;
        }
      });
    });
  }

  _deleteTween(char) {
    return delay(this.style.deleteDelay).then(
        new ValueTween(1, 0, this.style.tweenDuration, easings.easeInOutQuad, (value) => {
        char.alpha = value;
      }),
      new ValueTween(0, 1, this.style.tweenDuration, easings.easeInOutQuad, (value) => {
        const pos = interpValue(char.startPosition, char.finalPosition, value);
        char.position.set(pos.x, pos.y);
      }, () => {
        char.startPosition = { x: char.position.x, y: char.position.y };
        char.finalPosition = { x: char.position.x, y: char.position.y + this.style.shiftHeight };
      })
    );
  }

  _addTween(char) {
    // We are adding - start invisible.
    char.alpha = 0;
    return delay(this.style.insertDelay).then(
      new ValueTween(0, 1, this.style.tweenDuration, easings.easeInOutQuad, (value) => {
        char.alpha = value;
        const pos = interpValue(char.startPosition, char.finalPosition, value);
        char.position.set(pos.x, pos.y);
      }, () => {
        char.startPosition = { x: char.position.x, y: char.position.y - this.style.shiftHeight };
        char.finalPosition = { x: char.position.x, y: char.position.y };
      })
    )
  }

  _moveTween(char, from, oldText, to, newText) {
    const oldPos = this._computePosition(oldText, from);
    const newPos = this._computePosition(newText, to);
    return delay(this.style.moveDelay).then(new ValueTween(oldPos, newPos, this.style.tweenDuration, easings.easeInOutQuad, (value) => {
      char.position.set(value.x, value.y);
    }));
  }
}

export default TextChanger;
