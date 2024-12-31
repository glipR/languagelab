import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { black, darkPurple, purple } from "../colours.js";
import { interpValue, ValueTween } from "../tween.js";
import { combineEasing, mergeDeep, reverseEasing } from "../utils.js";
import { RectangleCover } from "./paper_cover.js";

const gsc = window.gameScaling ?? 1;

export class Word {
  static baseStyle = {
    text: {
      fontFamily: "Ittybittynotebook",
      fontSize: 32 * gsc,
      fill: black,
      align: 'center',
    },
    pointer: {
      fill: purple,
    },
    wordWidth: 20 * gsc,
  }

  constructor(word, position, style) {
    this.style = mergeDeep({...Word.baseStyle}, style);
    this.word_text = word;
    this.word = word.split('').map(c => new PIXI.Text(c, {...this.style.text}));
    this.wordContainer = new PIXI.Container();
    this.word.forEach((c, i) => {
      c.anchor.set(0, 1);
      c.position.set((i == 0) ? 0 : (this.word[i-1].position.x + this.style.wordWidth), 0);
      this.wordContainer.addChild(c);
    });
    this.wordContainer.pivot.set(this.wordContainer.width/2, -this.wordContainer.height/2);
    this.wordContainer.position.set(position.x, position.y);
    this.wordContainer.alpha = 0;

    this.wordCover = new RectangleCover(this.wordContainer, {points: 18, randMult: 0.1});
    this.wordCover.position.set(position.x, position.y);
    this.wordCover.alpha = 0;

    this.wordPointer = new PIXI.Graphics();
    this.wordPointer.rect(1 * gsc, 0 * gsc, 11 * gsc, 3 * gsc).fill(this.style.pointer.fill);
    this.wordPointer.position.set(this.word[0].position.x, this.word[0].position.y);
    this.wordPointer.alpha = 0;
    this.wordContainer.addChild(this.wordPointer);
  }

  resetWord() {
    return new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      const p = interpValue(this.curWordPos, this.newWordPos, v);
      this.wordPointer.position.set(p.x, p.y);
    }, () => {
      this.curWordPos = {x: this.wordPointer.position.x, y: this.wordPointer.position.y};
      this.newWordPos = {x: this.word[0].position.x, y: this.word[0].position.y};
    }).during(new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      this.word.forEach((c, i) => {
        c.style.fill = interpValue(this.oldFills[i], this.style.text.fill, v);
      });
    }, () => {
      this.oldFills = this.word.map(w => w.style.fill);
    }));
  }
}

export class NodePointer extends PIXI.Graphics {

  static baseStyle = {
    fill: darkPurple,
  }

  constructor(graph, startNode, style) {
    super();
    this.style = mergeDeep({...NodePointer.baseStyle}, style);
    this.updateGraphic();
    this.moveToNode(startNode);
    this.alpha = 0;
    graph.graph.addChild(this);
  }

  updateGraphic() {
    this.clear();
    this.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(this.style.fill);
    this.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0 * gsc, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(this.style.fill);
  }

  moveToNode(node) {
    this.position.set(node.position.x, node.position.y - 60 * gsc);
  }
}

export const GS = {};

export const flashEasing = () => combineEasing([
  easings.easeInOutQuad,
  (t) => 1,
  reverseEasing(easings.easeInOutQuad),
], [
  1,
  0.5,
  1,
]);

export const moveBetween = (l1, l2, duration, graph, nodePointer, wordPointer, word) => {
  const edge = graph.edgeMap[`${l1}->${l2}`];
  if (!edge) return new ValueTween(0, 1, 60, easings.easeInOutQuad, () => {});
  const tween = new ValueTween(0, 1, duration, easings.easeInOutQuad, (v) => {
    const pos = edge.bezierEdgeInterp(v).position;
    if (nodePointer) nodePointer.position.set(pos.x, pos.y - 60 * gsc);
  })
  .during(edge.colorEdgeTween(purple, duration, flashEasing(), false));

  if ((!!wordPointer || !!word) && edge.style.edgeLabel != 'ε') {
    const oldWordIndex = GS.curWordIndex;
    const curWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
    GS.curWordIndex++;
    if (word && GS.curWordIndex >= word.length) {
      GS.curWordIndex--;
    }
    const newWordIndex = GS.curWordIndex;
    const newWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
    if (oldWordIndex != newWordIndex) {
      if (wordPointer) tween.during(new ValueTween(curWordPos, newWordPos, duration, easings.easeInOutQuad, (v) => {
        wordPointer.position.set(v.x, v.y);
      }));
      if (word) tween.during(new ValueTween(black, purple, duration, easings.easeInOutQuad, (v) => {
        word[newWordIndex].style.fill = v;
      }));
    }
    if (word) tween.during(new ValueTween(purple, bg_dark, duration, easings.easeInOutQuad, (v) => {
      word[oldWordIndex].style.fill = v;
    }));
  }
  return tween;
};

export default { Word, NodePointer, GS, moveBetween };
