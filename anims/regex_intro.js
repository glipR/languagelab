import { black, blue, green, orange, purple, red, white, yellow } from "../colours.js";
import Screen from "../screen.js";
import TextChanger from "../tools/change_text.js";
import { TweenManager, ValueTween, delay, interpValue } from "../tween.js";
import { mergeDeep } from "../utils.js";
import { RectangleCover } from "../tools/paper_cover.js"
import DFA from '../dfa.js';
const gsc = window.gameScaling ?? 1;

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 128,
  fill: black,
  align: 'center',
};

const GS = {};

const fade = (obj, show=true, duration=60) => (new ValueTween(show ? 0 : 1, show ? 1 : 0, duration, GS.easings.easeInOutQuad, (v) => {
  if (obj.length !== undefined) {
    obj.forEach(o => o.alpha = v);
  } else {
    obj.alpha = v;
  }
 }));

const loader = (app, easings, onSuccess, onFailure, opts) => {

  GS.opts = opts;
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();

  // <h2>Regular Expressions</h2>
  const title = new TextChanger("Regular Expressions", { allowModify: false, shiftHeight: 0 });
  title.pivot.set(0, title.height / 2);
  title.position.set(2000, 1200);
  title.scale.set(2);
  title.alpha = 0;
  GS.screen.addChild(title);

  const squishTitle = title.changeText("RegEx")

  // The next way we define languages is something you might've already seen if you've done some programming, or used a terminal before - <span class="highlight-small highlight-blue-long">regular expressions</span>!

  // <h3>What are regular expressions?</h3>

  // Regular expressions are essentially just an extension of basic strings that allows a few operations.

  // For example, $aab$ is a valid Regular Expression, and it defines the language that contains the word 'aab' and nothing else.
  const wordContainer = new PIXI.Container();
  wordContainer.alpha = 0;
  const words = [
    "b",
    "ab",
    "aab",
    "aaaaaab",
    "bba",
    "baab",
    "abb",
  ].map(word => {
    const text = new TextChanger(word, { align: 'left' });
    wordContainer.addChild(text);
    return text;
  });

  const startingPositions = [
    { x: 700, y: 1250 },
    { x: 1400, y: 1700 },
    { x: 2800, y: 1400 },
    { x: 900, y: 1800 },
    { x: 650, y: 1700 },
    { x: 1300, y: 1400 },
    { x: 1700, y: 1500 },
  ];
  words.forEach((word, i) => {
    word.position.set(startingPositions[i].x, startingPositions[i].y);
  });

  const afterStar = [
    { x: 700, y: 1250 },
    { x: 2300, y: 1700 },
    { x: 2800, y: 1400 },
    { x: 2200, y: 1350 },
    { x: 650, y: 1700 },
    { x: 1300, y: 1400 },
    { x: 1700, y: 1500 },
  ];
  const moveStar = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    words.forEach((word, i) => {
      const newPos = interpValue(startingPositions[i], afterStar[i], v);
      word.position.set(newPos.x, newPos.y);
    });
  });

  const basic = new TextChanger("aab");
  basic.pivot.set(0, basic.height / 2);
  basic.position.set(2000, 600);
  basic.alpha = 0;
  const basicCover = new RectangleCover(basic, { randMult: 0.1, points: 20, width: 700, height: 180 });
  basicCover.position.set(2000, 600);
  basicCover.alpha = 0;
  GS.screen.addChild(basicCover);
  GS.screen.addChild(basic);

  const addStar = basic.changeText("aa*b")

  class Highlight extends PIXI.Graphics {
    constructor(style) {
      super();
      this.style = mergeDeep({
        color: purple,
        xShift: 0,
        yShift: 0,
        widthShift: 0,
        heightShift: 20,
        fillAlpha: 0.2,
        strokeAlpha: 0.8,
      }, style);
    }

    setConfig(start, end, opts={}) {
      this.style = mergeDeep(this.style, opts);
      this.setTransform(this.computeTransform(start, end));
    }

    setTransform(transform) {
      this.curTransform = transform;
      this.clear();
      this.rect(this.curTransform.x, this.curTransform.y, this.curTransform.width, this.curTransform.height)
        .fill({ color: this.style.color, alpha: this.style.fillAlpha })
        .stroke({ color: this.style.color, width: 5, alpha: this.style.strokeAlpha });
    }

    computeTransform(start, end) {
      const x = start.x + this.style.xShift;
      const y = start.y + this.style.yShift;
      const width = end.x - start.x + end.width + this.style.widthShift;
      const height = end.height + this.style.heightShift;
      return { x, y, width, height };
    }
  }

  class UnderLine extends PIXI.Graphics {
    constructor(style) {
      super();
      this.style = mergeDeep({
        color: purple,
        xShift: 0,
        yShift: 50,
        widthShift: 0,
        strokeWidth: 10,
      }, style);
    }

    setConfig(start, end, opts={}) {
      this.style = mergeDeep(this.style, opts);
      this.setTransform(this.computeTransform(start, end));
    }

    setTransform(transform) {
      this.curTransform = transform;
      this.clear();
      this.moveTo(this.curTransform.x, this.curTransform.y)
      this.lineTo(this.curTransform.x + this.curTransform.width, this.curTransform.y)
      this.stroke({ color: this.style.color, width: this.style.strokeWidth });
    }

    computeTransform(start, end) {
      const x = start.x + this.style.xShift;
      const y = start.y + this.style.yShift;
      const width = end.x - start.x + end.width + this.style.widthShift;
      return { x, y, width };
    }

    midPoint() {
      return {
        x: this.position.x + this.curTransform.x + this.curTransform.width / 2,
        y: this.position.y + this.curTransform.y,
      }
    }
  }

  const makeHighlight = (word, start, end, opts) => {
    const startTransform = word.transform(word.curText, start);
    const endTransform = word.transform(word.curText, end-1);
    const highlight = new Highlight(opts);
    highlight.setConfig(startTransform, endTransform);
    highlight.alpha = 0;
    word.addChild(highlight);
    return highlight;
  }

  const starHighlights = [
    makeHighlight(basic, 1, 3),
    makeHighlight(words[1], 1, 1),
    makeHighlight(words[2], 1, 2),
    makeHighlight(words[3], 1, 6),
  ];

  const langContainer = new PIXI.Container();
  const redBorder = new PIXI.Graphics();
  redBorder.rect(500, 1200, 3000, 800).fill(red).stroke({ color: black, width: 10 });
  redBorder.position.set(0, 0);
  const greenBorder = new PIXI.Graphics();
  greenBorder.rect(2050, 1250, 1400, 700).fill(green).stroke({ color: black, width: 10 });

  langContainer.alpha = 0;
  langContainer.addChild(redBorder);
  langContainer.addChild(greenBorder);
  GS.screen.addChild(langContainer);
  GS.screen.addChild(wordContainer);


  // But, if we add a star to the word like so: $aa^*b$, this defines the language that contains at least one a (but possibly more) followed by a single b. So the language includes 'ab', 'aab', 'aaaaab', and so on.

  // Let's cover all of the operators before we go further:

  // <h4>Kleene Star ($*$)</h4>

  // The Kleene Star is the first operator. It means <span class="highlight highlight-blue">'zero or more'</span> of the previous character. So in our previous example, $aa^*b$, the preceding a means that we expect one a, <span class="highlight-small highlight-blue-long">followed by zero or more a's</span>, and then a b.

  // <h4>Pipe ($|$)</h4>

  // The pipe operator acts on the character before and after it. It means <span class="highlight-small highlight-orange">'or'</span>. It only acts on single elements, so $a|b$ means 'a or b', and $aa|bb$ means 'a, followed by a or b, followed by b'.
  const pipeChange = basic.changeText("a|b")

  const afterPipe = [
    { x: 3000, y: 1500 },
    { x: 1300, y: 1700 },
    { x: 1800, y: 1400 },
    { x: 800, y: 1300 },
    { x: 650, y: 1700 },
    { x: 1300, y: 1400 },
    { x: 1700, y: 1600 },
  ];
  const movePipe = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    words.forEach((word, i) => {
      const newPos = interpValue(afterStar[i], afterPipe[i], v);
      word.position.set(newPos.x, newPos.y);
    });
  });

  const doublePipeChange = basic.changeText("aa|bb")
  const afterDoublePipe = [
    { x: 700, y: 1550 },
    { x: 1300, y: 1700 },
    { x: 2800, y: 1400 },
    { x: 800, y: 1300 },
    { x: 650, y: 1700 },
    { x: 1300, y: 1400 },
    { x: 2700, y: 1600 },
  ];
  const moveDoublePipe = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    words.forEach((word, i) => {
      const newPos = interpValue(afterPipe[i], afterDoublePipe[i], v);
      word.position.set(newPos.x, newPos.y);
    });
  });

  const pipeHighlights = [
    makeHighlight(basic, 1, 4),
    makeHighlight(words[2], 1, 2),
    makeHighlight(words[6], 1, 2),
  ];

  // <h4>Brackets ($()$)</h4>

  // Brackets are used to group expressions together, so that the two previous operators can act on <span class="highlight highlight-purple">larger elements</span>. For example, $((ab)|(ba))^*$ means 'either ab or ba, repeated zero or more times'.

  const bracketChange = basic.changeText("((ab)|(ba))*");
  const afterBrackets = [
    { x: 700, y: 1550 },
    { x: 2600, y: 1700 },
    { x: 1800, y: 1400 },
    { x: 800, y: 1300 },
    { x: 650, y: 1700 },
    { x: 2700, y: 1400 },
    { x: 1300, y: 1600 },
  ];
  const moveBrackets = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    words.forEach((word, i) => {
      const newPos = interpValue(afterDoublePipe[i], afterBrackets[i], v);
      word.position.set(newPos.x, newPos.y);
    });
  });

  const bracketHighlights = [
    makeHighlight(basic, 0, 11, { fillAlpha: 0.4 }),
    makeHighlight(basic, 1, 5, { color: blue, yShift: 5, heightShift: 10 }),
    makeHighlight(basic, 6, 10, { color: orange, yShift: 5, heightShift: 10 }),
    makeHighlight(words[1], 0, 2, { xShift: -10, yShift: -10, widthShift: 20, heightShift: 40, fillAlpha: 0.4 }),
    makeHighlight(words[5], 0, 2, { xShift: -10, yShift: -10, widthShift: 5, heightShift: 40, fillAlpha: 0.4 }),
    makeHighlight(words[5], 2, 4, { xShift: 5, yShift: -10, widthShift: 5, heightShift: 40, fillAlpha: 0.4 }),
    makeHighlight(words[1], 0, 2, { color: blue }),
    makeHighlight(words[5], 0, 2, { color: orange, widthShift: -10 }),
    makeHighlight(words[5], 2, 4, { color: blue, widthShift: -10, xShift: 10 }),
  ]

  // <h3>An example</h3>

  // Let's look at a more complicated regular expression to understand this deeper:

  // $$
  // (c(abbb^*a)|(baaa^*b))^*c
  // $$


  const complex = new TextChanger("(c(abbb*a)|(baaa*b))*c");
  complex.pivot.set(0, complex.height / 2);
  complex.position.set(2000, 600);
  complex.alpha = 0;
  const coverComplex = new RectangleCover(complex, { randMult: 0.1, points: 20, width: 1300, height: 180 });
  coverComplex.position.set(2000, 600);
  coverComplex.alpha = 0;
  GS.screen.addChild(coverComplex);
  GS.screen.addChild(complex);

  const smaller = new TextChanger("abbb*a", { moveDelay: 0, insertDelay: 0 });
  smaller.pivot.set(0, smaller.height / 2);
  smaller.position.set(2000, 1100);
  smaller.alpha = 0;
  const coverSmaller = new RectangleCover(smaller, { randMult: 0.1, points: 20, width: 1300, height: 180 });
  coverSmaller.position.set(2000, 1100);
  coverSmaller.alpha = 0;
  GS.screen.addChild(coverSmaller);
  GS.screen.addChild(smaller);
  const fenceExample = new TextChanger("abba", { shiftHeight: 0, moveDelay: 0, insertDelay: 0 });
  fenceExample.pivot.set(0, fenceExample.height / 2);
  fenceExample.position.set(2000, 1500);
  fenceExample.alpha = 0;
  const coverFence = new RectangleCover(fenceExample, { randMult: 0.1, points: 20, width: 1300, height: 180 });
  coverFence.position.set(2000, 1500);
  coverFence.alpha = 0;
  GS.screen.addChild(coverFence);
  GS.screen.addChild(fenceExample);

  const smallerFenceHighlight1 = makeHighlight(smaller, 3, 5);
  const fenceHighlight1 = makeHighlight(fenceExample, 3, 3 );
  const colorFence1 = complex.colorText(orange, 3, 9);

  const moveFenceHighlight = (word, highlight, start, end, newOpts={}) => {
    const sTransform = word.transform(word.curText, start);
    const eTransform = word.transform(word.curText, end-1);
    return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      const newTransform = interpValue(highlight.startTransform, highlight.endTransform, v);
      const opts = interpValue(highlight.startOpts, highlight.endOpts, v, true);
      highlight.style = mergeDeep(highlight.style, opts);
      highlight.setTransform(newTransform);
    }, () => {
      highlight.startOpts = {...highlight.style};
      highlight.startTransform = {...highlight.curTransform}
      highlight.endTransform = highlight.computeTransform(sTransform, eTransform);
      highlight.endOpts = {...newOpts};
    });
  };
  const fence1_1 = fenceExample.changeText("abbba", false, { 2: 2 });
  const fence1_Move1 = moveFenceHighlight(fenceExample, fenceHighlight1, 3, 4);
  const fence1_2 = fenceExample.changeText("abbbba", false, { 3: 3 });
  const fence1_Move2 = moveFenceHighlight(fenceExample, fenceHighlight1, 3, 5);
  const fence1_3 = fenceExample.changeText("abbbbba", false, { 4: 4 });
  const fence1_Move3 = moveFenceHighlight(fenceExample, fenceHighlight1, 3, 6);

  const fence2_start = fenceExample.changeText("baab").during(smaller.changeText("baaa*b"));
  const smallerFenceHighlight2 = makeHighlight(smaller, 3, 5);
  const fenceHighlight2 = makeHighlight(fenceExample, 3, 3 );
  const colorFence2 = complex.colorText(green, 3, 9).during(complex.colorText(orange, 12, 18));

  const fence2_1 = fenceExample.changeText("baaab", false, { 2: 2 });
  const fence2_Move1 = moveFenceHighlight(fenceExample, fenceHighlight2, 3, 4);
  const fence2_2 = fenceExample.changeText("baaaab", false, { 3: 3 });
  const fence2_Move2 = moveFenceHighlight(fenceExample, fenceHighlight2, 3, 5);
  const fence2_3 = fenceExample.changeText("baaaaab", false, { 4: 4 });
  const fence2_Move3 = moveFenceHighlight(fenceExample, fenceHighlight2, 3, 6);

  const choiceStart = fenceExample.changeText("cabbbba").during(smaller.changeText("c(abbb*a)|(baaa*b)"));
  const smallerCEncompassingHighlight = makeHighlight(smaller, 1, 18, { color: purple, yShift: -10, heightShift: 40 });
  const smallerCHighlight = makeHighlight(smaller, 0, 1, { color: green })
  const smallerCFence1Highlight = makeHighlight(smaller, 1, 9, { color: orange })
  const smallerCFence2Highlight = makeHighlight(smaller, 10, 18, { color: blue })
  const fenceHighlight4 = makeHighlight(fenceExample, 1, 7, { color: purple, widthShift: 10, xShift: -5, yShift: -10, heightShift: 40 });
  const fenceHighlight3 = makeHighlight(fenceExample, 0, 1, { color: green });
  const fenceHighlight5 = makeHighlight(fenceExample, 1, 7, { color: orange });
  const colorChoice = complex.colorText(orange, 1, 19);

  const fence3_1 = fenceExample.changeText("cabba");
  const fence3_Move1 = moveFenceHighlight(fenceExample, fenceHighlight4, 1, 5)
    .during(moveFenceHighlight(fenceExample, fenceHighlight5, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlight3, 0, 1)) // Empty - just needed since the word will shift.
  const fence3_2 = fenceExample.changeText("cbaaaaab");
  const fence3_Move2 = moveFenceHighlight(fenceExample, fenceHighlight4, 1, 8)
    .during(moveFenceHighlight(fenceExample, fenceHighlight5, 1, 8, { color: blue }))
    .during(moveFenceHighlight(fenceExample, fenceHighlight3, 0, 1)) // Empty - just needed since the word will shift.
  const fence3_3 = fenceExample.changeText("cbaaab");
  const fence3_Move3 = moveFenceHighlight(fenceExample, fenceHighlight4, 1, 6)
    .during(moveFenceHighlight(fenceExample, fenceHighlight5, 1, 6))
    .during(moveFenceHighlight(fenceExample, fenceHighlight3, 0, 1)) // Empty - just needed since the word will shift.

  const doubleFenceStart = fenceExample.changeText("cbaaabcbaab", true).during(smaller.changeText("(c(abbb*a)|(baaa*b))*", true));
  const smallerMassiveHighlight = makeHighlight(smaller, 0, 20, { color: yellow, yShift: -15, heightShift: 50 });
  const smallerMassiveCHighlight = makeHighlight(smaller, 1, 2, { color: green })
  const smallerChoiceHighlight = makeHighlight(smaller, 2, 19, { color: purple, yShift: -10, heightShift: 40, widthShift: 10, xShift: -5 });
  const smallerChoiceHighlight1 = makeHighlight(smaller, 2, 10, { color: orange })
  const smallerChoiceHighlight2 = makeHighlight(smaller, 11, 19, { color: blue })
  const colorMassive = complex.colorText(orange, 0, 21);

  const fenceHighlightG1Cover = makeHighlight(fenceExample, 0, 6, { color: yellow, yShift: -15, heightShift: 50, widthShift: 10, xShift: -5 });
  const fenceHighlightG1C = makeHighlight(fenceExample, 0, 1, { color: green });
  const fenceHighlightG1FenceEnclose = makeHighlight(fenceExample, 1, 6, { color: purple, yShift: -10, heightShift: 40, widthShift: 5, xShift: -5 });
  const fenceHighlightG1Fence = makeHighlight(fenceExample, 1, 6, { color: blue, widthShift: -10 });
  const fenceHighlightG2Cover = makeHighlight(fenceExample, 6, 11, { color: yellow, yShift: -15, heightShift: 50, widthShift: 5 });
  const fenceHighlightG2C = makeHighlight(fenceExample, 6, 7, { color: green });
  const fenceHighlightG2FenceEnclose = makeHighlight(fenceExample, 7, 11, { color: purple, yShift: -10, heightShift: 40, widthShift: 5, xShift: -5 });
  const fenceHighlightG2Fence = makeHighlight(fenceExample, 7, 11, { color: blue, widthShift: -10 });

  const fence4_1 = fenceExample.changeText("cbaabcbaaaab");
  const fence4_Move1 = moveFenceHighlight(fenceExample, fenceHighlightG1Cover, 0, 5)
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1C, 0, 1))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1FenceEnclose, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1Fence, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Cover, 5, 12))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2C, 5, 6))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2FenceEnclose, 6, 12))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Fence, 6, 12))
  const fence4_2 = fenceExample.changeText("cbaabcabbba");
  const fence4_Move2 = moveFenceHighlight(fenceExample, fenceHighlightG1Cover, 0, 5)
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1C, 0, 1))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1FenceEnclose, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1Fence, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Cover, 5, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2C, 5, 6))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2FenceEnclose, 6, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Fence, 6, 11, {color: orange}))
  const fence4_3 = fenceExample.changeText("cbaabcabbbacbaab");
  const fenceHighlightG3Cover = makeHighlight(fenceExample, 11, 16, { color: yellow, yShift: -15, heightShift: 50, widthShift: 5 });
  const fenceHighlightG3C = makeHighlight(fenceExample, 11, 12, { color: green });
  const fenceHighlightG3FenceEnclose = makeHighlight(fenceExample, 12, 16, { color: purple, yShift: -10, heightShift: 40, widthShift: 5, xShift: -5 });
  const fenceHighlightG3Fence = makeHighlight(fenceExample, 12, 16, { color: blue, widthShift: -10 });
  const fence4_Move3 = moveFenceHighlight(fenceExample, fenceHighlightG1Cover, 0, 5)
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1C, 0, 1))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1FenceEnclose, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1Fence, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Cover, 5, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2C, 5, 6))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2FenceEnclose, 6, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Fence, 6, 11))
    .during(fade([fenceHighlightG3Cover, fenceHighlightG3C, fenceHighlightG3FenceEnclose, fenceHighlightG3Fence]));

  const fence4_4 = fenceExample.changeText("cbaabcabbbacbaabc")
  const fence4_4_2 = smaller.changeText("(c(abbb*a)|(baaa*b))*c", true);
  const fence4_Move4 = moveFenceHighlight(fenceExample, fenceHighlightG1Cover, 0, 5)
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1C, 0, 1))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1FenceEnclose, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG1Fence, 1, 5))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Cover, 5, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2C, 5, 6))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2FenceEnclose, 6, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG2Fence, 6, 11))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG3Cover, 11, 16))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG3C, 11, 12))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG3FenceEnclose, 12, 16))
    .during(moveFenceHighlight(fenceExample, fenceHighlightG3Fence, 12, 16))
    .during(moveFenceHighlight(smaller, smallerMassiveHighlight, 0, 20))
    .during(moveFenceHighlight(smaller, smallerMassiveCHighlight, 1, 2))
    .during(moveFenceHighlight(smaller, smallerChoiceHighlight, 2, 19))
    .during(moveFenceHighlight(smaller, smallerChoiceHighlight1, 2, 10))
    .during(moveFenceHighlight(smaller, smallerChoiceHighlight2, 11, 19))
  const colorMassive2 = complex.colorText(green, 0, 21).during(complex.colorText(orange, 21, 22));

  // Let's understand each component of the regular expression, and build up to the full expression.

  // <ul>
  //   <li>$abbb^*a$ Matches words that start with an 'a', then have at least 2 'b's, then finish with an 'a'. This is kind of like a fence - some 'a's surrounding at least 2 'b's</li>
  //   <li>$baaa^*b$ Matches words that start with an 'b', then have at least 2 'a's, then finish with an 'b'. This is kind of like a fence - some 'b's surrounding at least 2 'a's</li>
  //   <li>$c(abbb^*a)|(baaa^*b)$ Matches a single c, followed by either one of the two fences above</li>
  //   <li>$(c(abbb^*a)|(baaa^*b))^*$ Allows zero or multiple instances of this 'c'+fence pattern</li>
  //   <li>$(c(abbb^*a)|(baaa^*b))^*c$ Matches the exact same thing, but adds a 'c' on the end.</li>
  // </ul>

  // So the end result is multiple of these 'fences', that are themselves fenced in by 'c's:

  // <ul>
  //   <li>cabbbacbaabc</li>
  //   <li>cabbbacabbbbbacbaabc</li>
  // </ul>

  // Notice that when using the kleene star to accept multiple copies of the fence, we don't have to use the same subword each time - as long as each subword matches the pattern, it works.

  // In other words, we can make different 'choices' for each fence.

  // The derivation of the word 'cbaaaaabcabbac' might look something like this:

  const moveExample = new ValueTween(1500, 200, 60, GS.easings.easeInOutQuad, (v) => {
    fenceExample.position.set(fenceExample.position.x, v);
    coverFence.position.set(coverFence.position.x, v);
  });
  const changeExample = fenceExample.changeText("cbaaaaabcabbac");
  const hideHighlights = fade([
    fenceHighlightG1Cover, fenceHighlightG1C,
    fenceHighlightG1FenceEnclose, fenceHighlightG1Fence,
    fenceHighlightG2Cover, fenceHighlightG2C,
    fenceHighlightG2FenceEnclose, fenceHighlightG2Fence,
    fenceHighlightG3Cover, fenceHighlightG3C,
    fenceHighlightG3FenceEnclose, fenceHighlightG3Fence,

  ], false);

  const resetColor = complex.colorText(black, 0, 22);
  const largeCopy1 = new TextChanger("c(abbb*a)|(baaa*b)");
  const largeCopy2 = new TextChanger("c(abbb*a)|(baaa*b)");
  const terminal1c = new TextChanger("c");
  largeCopy1.pivot.set(0, largeCopy1.height / 2);
  largeCopy1.position.set(800, 1050);
  largeCopy1.alpha = 0;
  largeCopy2.pivot.set(0, largeCopy2.height / 2);
  largeCopy2.position.set(2300, 1050);
  largeCopy2.alpha = 0;
  terminal1c.pivot.set(0, terminal1c.height / 2);
  terminal1c.position.set(3500, 1050);
  terminal1c.alpha = 0;
  const largeCover1 = new RectangleCover(largeCopy1, { randMult: 0.1, points: 20, width: 1200, height: 180 });
  largeCover1.position.set(largeCopy1.position.x, largeCopy1.position.y);
  largeCover1.alpha = 0;
  const largeCover2 = new RectangleCover(largeCopy2, { randMult: 0.1, points: 20, width: 1200, height: 180 });
  largeCover2.position.set(largeCopy2.position.x, largeCopy2.position.y);
  largeCover2.alpha = 0;
  const terminalCover1 = new RectangleCover(terminal1c, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
  terminalCover1.position.set(terminal1c.position.x, terminal1c.position.y);
  terminalCover1.alpha = 0;

  const underlineComplexDerivation = new UnderLine({ color: purple });
  underlineComplexDerivation.setConfig(complex.transform(complex.curText, 1), complex.transform(complex.curText, 18));
  underlineComplexDerivation.alpha = 0;
  underlineComplexDerivation.position.set(complex.position.x, complex.position.y);
  const underlineComplexTerminal = new UnderLine({ color: green });
  underlineComplexTerminal.setConfig(complex.transform(complex.curText, 21), complex.transform(complex.curText, 21));
  underlineComplexTerminal.alpha = 0;
  underlineComplexTerminal.position.set(complex.position.x, complex.position.y);
  const derivationLine1 = new PIXI.Graphics();
  derivationLine1.moveTo(underlineComplexDerivation.midPoint().x, underlineComplexDerivation.midPoint().y);
  derivationLine1.lineTo(largeCopy1.position.x, largeCopy1.position.y);
  derivationLine1.stroke({ color: purple, width: 10 });
  derivationLine1.alpha = 0;
  const derivationLine2 = new PIXI.Graphics();
  derivationLine2.moveTo(underlineComplexDerivation.midPoint().x, underlineComplexDerivation.midPoint().y);
  derivationLine2.lineTo(largeCopy2.position.x, largeCopy2.position.y);
  derivationLine2.stroke({ color: purple, width: 10 });
  derivationLine2.alpha = 0;
  const terminalLine1 = new PIXI.Graphics();
  terminalLine1.moveTo(underlineComplexTerminal.midPoint().x, underlineComplexTerminal.midPoint().y);
  terminalLine1.lineTo(terminal1c.position.x, terminal1c.position.y);
  terminalLine1.stroke({ color: green, width: 10 });
  terminalLine1.alpha = 0;

  const terminal2c = new TextChanger("c");
  const terminal3c = new TextChanger("c");
  terminal2c.pivot.set(0, terminal2c.height / 2);
  terminal2c.position.set(400, 1550);
  terminal2c.alpha = 0;
  terminal3c.pivot.set(0, terminal3c.height / 2);
  terminal3c.position.set(2100, 1550);
  terminal3c.alpha = 0;
  const fence1Derivation = new TextChanger("baaa*b");
  const fence2Derivation = new TextChanger("abbb*a");
  fence1Derivation.pivot.set(0, fence1Derivation.height / 2);
  fence1Derivation.position.set(1200, 1550);
  fence1Derivation.alpha = 0;
  fence2Derivation.pivot.set(0, fence2Derivation.height / 2);
  fence2Derivation.position.set(2900, 1550);
  fence2Derivation.alpha = 0;
  const terminalCover2 = new RectangleCover(terminal2c, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
  terminalCover2.position.set(terminal2c.position.x, terminal2c.position.y);
  terminalCover2.alpha = 0;
  const terminalCover3 = new RectangleCover(terminal3c, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
  terminalCover3.position.set(terminal3c.position.x, terminal3c.position.y);
  terminalCover3.alpha = 0;
  const fence1Cover = new RectangleCover(fence1Derivation, { randMult: 0.1, points: 20, width: 800, height: 180 });
  fence1Cover.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
  fence1Cover.alpha = 0;
  const fence2Cover = new RectangleCover(fence2Derivation, { randMult: 0.1, points: 20, width: 800, height: 180 });
  fence2Cover.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
  fence2Cover.alpha = 0;

  const derivation1Terminal = new UnderLine({ color: green });
  derivation1Terminal.setConfig(largeCopy1.transform(largeCopy1.curText, 0), largeCopy1.transform(largeCopy1.curText, 0));
  derivation1Terminal.alpha = 0;
  derivation1Terminal.position.set(largeCopy1.position.x, largeCopy1.position.y);
  const derivation1Fence = new UnderLine({ color: orange });
  derivation1Fence.setConfig(largeCopy1.transform(largeCopy1.curText, 11), largeCopy1.transform(largeCopy1.curText, 16));
  derivation1Fence.alpha = 0;
  derivation1Fence.position.set(largeCopy1.position.x, largeCopy1.position.y);
  const derivation2Terminal = new UnderLine({ color: green });
  derivation2Terminal.setConfig(largeCopy2.transform(largeCopy2.curText, 0), largeCopy2.transform(largeCopy2.curText, 0));
  derivation2Terminal.alpha = 0;
  derivation2Terminal.position.set(largeCopy2.position.x, largeCopy2.position.y);
  const derivation2Fence = new UnderLine({ color: blue });
  derivation2Fence.setConfig(largeCopy2.transform(largeCopy2.curText, 2), largeCopy2.transform(largeCopy2.curText, 7));
  derivation2Fence.alpha = 0;
  derivation2Fence.position.set(largeCopy2.position.x, largeCopy2.position.y);
  const derivation1TerminalLine = new PIXI.Graphics();
  derivation1TerminalLine.moveTo(derivation1Terminal.midPoint().x, derivation1Terminal.midPoint().y);
  derivation1TerminalLine.lineTo(terminal2c.position.x, terminal2c.position.y);
  derivation1TerminalLine.stroke({ color: green, width: 10 });
  derivation1TerminalLine.alpha = 0;
  const derivation1FenceLine = new PIXI.Graphics();
  derivation1FenceLine.moveTo(derivation1Fence.midPoint().x, derivation1Fence.midPoint().y);
  derivation1FenceLine.lineTo(fence1Derivation.position.x, fence1Derivation.position.y);
  derivation1FenceLine.stroke({ color: orange, width: 10 });
  derivation1FenceLine.alpha = 0;
  const derivation2TerminalLine = new PIXI.Graphics();
  derivation2TerminalLine.moveTo(derivation2Terminal.midPoint().x, derivation2Terminal.midPoint().y);
  derivation2TerminalLine.lineTo(terminal3c.position.x, terminal3c.position.y);
  derivation2TerminalLine.stroke({ color: green, width: 10 });
  derivation2TerminalLine.alpha = 0;
  const derivation2FenceLine = new PIXI.Graphics();
  derivation2FenceLine.moveTo(derivation2Fence.midPoint().x, derivation2Fence.midPoint().y);
  derivation2FenceLine.lineTo(fence2Derivation.position.x, fence2Derivation.position.y);
  derivation2FenceLine.stroke({ color: blue, width: 10 });
  derivation2FenceLine.alpha = 0;


  const fence1DerivationLeftTerm = new TextChanger("baa");
  const fence1DerivationMiddle = new TextChanger("aaa");
  const fence1DerivationRightTerm = new TextChanger("b");
  const fence2DerivationLeftTerm = new TextChanger("abb");
  const fence2DerivationMiddle = new TextChanger("");
  const fence2DerivationRightTerm = new TextChanger("a");
  fence1DerivationLeftTerm.pivot.set(0, fence1DerivationLeftTerm.height / 2);
  fence1DerivationLeftTerm.position.set(800, 2050);
  fence1DerivationLeftTerm.alpha = 0;
  fence1DerivationMiddle.pivot.set(0, fence1DerivationMiddle.height / 2);
  fence1DerivationMiddle.position.set(1300, 2050);
  fence1DerivationMiddle.alpha = 0;
  fence1DerivationRightTerm.pivot.set(0, fence1DerivationRightTerm.height / 2);
  fence1DerivationRightTerm.position.set(1700, 2050);
  fence1DerivationRightTerm.alpha = 0;
  fence2DerivationLeftTerm.pivot.set(0, fence2DerivationLeftTerm.height / 2);
  fence2DerivationLeftTerm.position.set(2400, 2050);
  fence2DerivationLeftTerm.alpha = 0;
  fence2DerivationMiddle.pivot.set(0, fence2DerivationMiddle.height / 2);
  fence2DerivationMiddle.position.set(2850, 2050);
  fence2DerivationMiddle.alpha = 0;
  fence2DerivationRightTerm.pivot.set(0, fence2DerivationRightTerm.height / 2);
  fence2DerivationRightTerm.position.set(3200, 2050);
  fence2DerivationRightTerm.alpha = 0;
  const fence1LeftCover = new RectangleCover(fence1DerivationLeftTerm, { randMult: 0.1, points: 20, width: 400, height: 180, fill: green });
  const fence1MiddleCover = new RectangleCover(fence1DerivationMiddle, { randMult: 0.1, points: 20, width: 350, height: 180, fill: green });
  const fence1RightCover = new RectangleCover(fence1DerivationRightTerm, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
  const fence2LeftCover = new RectangleCover(fence2DerivationLeftTerm, { randMult: 0.1, points: 20, width: 400, height: 180, fill: green });
  const fence2MiddleCover = new RectangleCover(fence2DerivationMiddle, { randMult: 0.1, points: 20, width: 200, height: 180, fill: green });
  const fence2RightCover = new RectangleCover(fence2DerivationRightTerm, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
  fence1LeftCover.position.set(fence1DerivationLeftTerm.position.x, fence1DerivationLeftTerm.position.y);
  fence1MiddleCover.position.set(fence1DerivationMiddle.position.x, fence1DerivationMiddle.position.y);
  fence1RightCover.position.set(fence1DerivationRightTerm.position.x, fence1DerivationRightTerm.position.y);
  fence2LeftCover.position.set(fence2DerivationLeftTerm.position.x, fence2DerivationLeftTerm.position.y);
  fence2MiddleCover.position.set(fence2DerivationMiddle.position.x, fence2DerivationMiddle.position.y);
  fence2RightCover.position.set(fence2DerivationRightTerm.position.x, fence2DerivationRightTerm.position.y);
  fence1LeftCover.alpha = 0;
  fence1MiddleCover.alpha = 0;
  fence1RightCover.alpha = 0;
  fence2LeftCover.alpha = 0;
  fence2MiddleCover.alpha = 0;
  fence2RightCover.alpha = 0;

  const derivation1LeftTerm = new UnderLine({ color: green });
  derivation1LeftTerm.setConfig(fence1Derivation.transform(fence1Derivation.curText, 0), fence1Derivation.transform(fence1Derivation.curText, 2));
  derivation1LeftTerm.alpha = 0;
  derivation1LeftTerm.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
  const derivation1FenceMiddle = new UnderLine({ color: yellow });
  derivation1FenceMiddle.setConfig(fence1Derivation.transform(fence1Derivation.curText, 3), fence1Derivation.transform(fence1Derivation.curText, 4));
  derivation1FenceMiddle.alpha = 0;
  derivation1FenceMiddle.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
  const derivation1RightTerm = new UnderLine({ color: green });
  derivation1RightTerm.setConfig(fence1Derivation.transform(fence1Derivation.curText, 5), fence1Derivation.transform(fence1Derivation.curText, 5));
  derivation1RightTerm.alpha = 0;
  derivation1RightTerm.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
  const derivation2LeftTerm = new UnderLine({ color: green });
  derivation2LeftTerm.setConfig(fence2Derivation.transform(fence2Derivation.curText, 0), fence2Derivation.transform(fence2Derivation.curText, 2));
  derivation2LeftTerm.alpha = 0;
  derivation2LeftTerm.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
  const derivation2FenceMiddle = new UnderLine({ color: yellow });
  derivation2FenceMiddle.setConfig(fence2Derivation.transform(fence2Derivation.curText, 3), fence2Derivation.transform(fence2Derivation.curText, 4));
  derivation2FenceMiddle.alpha = 0;
  derivation2FenceMiddle.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
  const derivation2RightTerm = new UnderLine({ color: green });
  derivation2RightTerm.setConfig(fence2Derivation.transform(fence2Derivation.curText, 5), fence2Derivation.transform(fence2Derivation.curText, 5));
  derivation2RightTerm.alpha = 0;
  derivation2RightTerm.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
  const derivation1LeftTermLine = new PIXI.Graphics();
  derivation1LeftTermLine.moveTo(derivation1LeftTerm.midPoint().x, derivation1LeftTerm.midPoint().y);
  derivation1LeftTermLine.lineTo(fence1DerivationLeftTerm.position.x, fence1DerivationLeftTerm.position.y);
  derivation1LeftTermLine.stroke({ color: green, width: 10 });
  derivation1LeftTermLine.alpha = 0;
  const derivation1FenceMiddleLine = new PIXI.Graphics();
  derivation1FenceMiddleLine.moveTo(derivation1FenceMiddle.midPoint().x, derivation1FenceMiddle.midPoint().y);
  derivation1FenceMiddleLine.lineTo(fence1DerivationMiddle.position.x, fence1DerivationMiddle.position.y);
  derivation1FenceMiddleLine.stroke({ color: yellow, width: 10 });
  derivation1FenceMiddleLine.alpha = 0;
  const derivation1RightTermLine = new PIXI.Graphics();
  derivation1RightTermLine.moveTo(derivation1RightTerm.midPoint().x, derivation1RightTerm.midPoint().y);
  derivation1RightTermLine.lineTo(fence1DerivationRightTerm.position.x, fence1DerivationRightTerm.position.y);
  derivation1RightTermLine.stroke({ color: green, width: 10 });
  derivation1RightTermLine.alpha = 0;
  const derivation2LeftTermLine = new PIXI.Graphics();
  derivation2LeftTermLine.moveTo(derivation2LeftTerm.midPoint().x, derivation2LeftTerm.midPoint().y);
  derivation2LeftTermLine.lineTo(fence2DerivationLeftTerm.position.x, fence2DerivationLeftTerm.position.y);
  derivation2LeftTermLine.stroke({ color: green, width: 10 });
  derivation2LeftTermLine.alpha = 0;
  const derivation2FenceMiddleLine = new PIXI.Graphics();
  derivation2FenceMiddleLine.moveTo(derivation2FenceMiddle.midPoint().x, derivation2FenceMiddle.midPoint().y);
  derivation2FenceMiddleLine.lineTo(fence2DerivationMiddle.position.x, fence2DerivationMiddle.position.y);
  derivation2FenceMiddleLine.stroke({ color: yellow, width: 10 });
  derivation2FenceMiddleLine.alpha = 0;
  const derivation2RightTermLine = new PIXI.Graphics();
  derivation2RightTermLine.moveTo(derivation2RightTerm.midPoint().x, derivation2RightTerm.midPoint().y);
  derivation2RightTermLine.lineTo(fence2DerivationRightTerm.position.x, fence2DerivationRightTerm.position.y);
  derivation2RightTermLine.stroke({ color: green, width: 10 });
  derivation2RightTermLine.alpha = 0;

  const connectingContainer = new PIXI.Container();
  connectingContainer.alpha = 0;
  [
    { color: green, width: 30 },
    { color: white, width: 12 },
  ].forEach(({ color, width }) => {
    const connectingLine = new PIXI.Graphics();
    connectingLine.moveTo(terminal2c.position.x, terminal2c.position.y);
    connectingLine.lineTo(fence1DerivationLeftTerm.position.x, fence1DerivationLeftTerm.position.y);
    connectingLine.lineTo(fence1DerivationMiddle.position.x, fence1DerivationMiddle.position.y);
    connectingLine.lineTo(fence1DerivationRightTerm.position.x, fence1DerivationRightTerm.position.y);
    connectingLine.lineTo(terminal3c.position.x, terminal3c.position.y);
    connectingLine.lineTo(fence2DerivationLeftTerm.position.x, fence2DerivationLeftTerm.position.y);
    connectingLine.lineTo(fence2DerivationMiddle.position.x, fence2DerivationMiddle.position.y);
    connectingLine.lineTo(fence2DerivationRightTerm.position.x, fence2DerivationRightTerm.position.y);
    connectingLine.lineTo(terminal1c.position.x, terminal1c.position.y);
    connectingLine.stroke({ color, width });
    connectingContainer.addChild(connectingLine);
  });

  const fenceHighlightLeft = makeHighlight(fenceExample, 0, 8, { color: purple, yShift: -10, heightShift: 40, widthShift: 2.5, xShift: -5 });
  const fenceHighlightRight = makeHighlight(fenceExample, 8, 13, { color: purple, yShift: -10, heightShift: 40, widthShift: 2.5, xShift: 2.5 });
  const fenceHighlightOrange = makeHighlight(fenceExample, 1, 8, { color: orange, widthShift: -4 });
  const fenceHighlightBlue = makeHighlight(fenceExample, 9, 13, { color: blue, xShift: 5, widthShift: -4 });
  const fenceHighlightYellow1 = makeHighlight(fenceExample, 4, 7, { color: yellow, yShift: 5, heightShift: 0 });
  const fenceHighlightYellow2 = makeHighlight(fenceExample, 12, 12, { color: yellow, yShift: 5, heightShift: 0 });

  GS.screen.addChild(connectingContainer);

  GS.screen.addChild(derivationLine1);
  GS.screen.addChild(derivationLine2);
  GS.screen.addChild(terminalLine1);
  GS.screen.addChild(underlineComplexDerivation);
  GS.screen.addChild(underlineComplexTerminal);

  GS.screen.addChild(largeCover1);
  GS.screen.addChild(largeCover2);
  GS.screen.addChild(terminalCover1);
  GS.screen.addChild(largeCopy1);
  GS.screen.addChild(largeCopy2);
  GS.screen.addChild(terminal1c);

  GS.screen.addChild(derivation1TerminalLine);
  GS.screen.addChild(derivation1FenceLine);
  GS.screen.addChild(derivation2TerminalLine);
  GS.screen.addChild(derivation2FenceLine);
  GS.screen.addChild(derivation1Terminal);
  GS.screen.addChild(derivation1Fence);
  GS.screen.addChild(derivation2Terminal);
  GS.screen.addChild(derivation2Fence);

  GS.screen.addChild(terminalCover2);
  GS.screen.addChild(terminalCover3);
  GS.screen.addChild(fence1Cover);
  GS.screen.addChild(fence2Cover);
  GS.screen.addChild(terminal2c);
  GS.screen.addChild(terminal3c);
  GS.screen.addChild(fence1Derivation);
  GS.screen.addChild(fence2Derivation);

  GS.screen.addChild(derivation1LeftTermLine);
  GS.screen.addChild(derivation1FenceMiddleLine);
  GS.screen.addChild(derivation1RightTermLine);
  GS.screen.addChild(derivation2LeftTermLine);
  GS.screen.addChild(derivation2FenceMiddleLine);
  GS.screen.addChild(derivation2RightTermLine);
  GS.screen.addChild(derivation1LeftTerm);
  GS.screen.addChild(derivation1FenceMiddle);
  GS.screen.addChild(derivation1RightTerm);
  GS.screen.addChild(derivation2LeftTerm);
  GS.screen.addChild(derivation2FenceMiddle);
  GS.screen.addChild(derivation2RightTerm);

  GS.screen.addChild(fence1LeftCover);
  GS.screen.addChild(fence1MiddleCover);
  GS.screen.addChild(fence1RightCover);
  GS.screen.addChild(fence2LeftCover);
  GS.screen.addChild(fence2MiddleCover);
  GS.screen.addChild(fence2RightCover);
  GS.screen.addChild(fence1DerivationLeftTerm);
  GS.screen.addChild(fence1DerivationMiddle);
  GS.screen.addChild(fence1DerivationRightTerm);
  GS.screen.addChild(fence2DerivationLeftTerm);
  GS.screen.addChild(fence2DerivationMiddle);
  GS.screen.addChild(fence2DerivationRightTerm);

  // <h3>How does this compare to DFAs?</h3>

  // It'll take some more understanding before we can compare the two, but some things are easier with Regular Expressions, but some things understandably seem much harder.

  // For example, take the language of words in alphabetical order we saw earlier. This is relatively easy in Regular Expressions, since we can write this as $a*b*c*d*$

  const example1 = new TextChanger("a*b*c*d*");
  const exampleCover1 = new RectangleCover(example1, { randMult: 0.1, points: 20, width: 700, height: 180 });
  example1.pivot.set(0, example1.height / 2);
  example1.position.set(1000, 1200);
  example1.alpha = 0;
  exampleCover1.position.set(example1.position.x, example1.position.y);
  exampleCover1.alpha = 0;
  GS.screen.addChild(exampleCover1);
  GS.screen.addChild(example1);

  const dfaAlphabeticJSON = {"states":[{"name":"A","position":{"x":gsc*99.2796875,"y":gsc*271.22343749999993},"accepting":true,"starting":true},{"name":"B","position":{"x":gsc*315.7015624999999,"y":gsc*149.56406249999998},"accepting":true,"starting":false},{"name":"C","position":{"x":gsc*454.634375,"y":gsc*260.81718749999993},"accepting":true,"starting":false},{"name":"D","position":{"x":gsc*298.5921874999999,"y":gsc*437.5968749999999},"accepting":true,"starting":false},{"name":"X","position":{"x":gsc*734.7031249999999,"y":gsc*250.84218749999994},"accepting":false,"starting":false}],"alphabet":["a","b","c","d"],"transitions":[{"from":"A","to":"A","label":"a","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"A","to":"B","label":"b","style":{}},{"from":"A","to":"C","label":"c","style":{}},{"from":"A","to":"D","label":"d","style":{}},{"from":"B","to":"C","label":"c","style":{}},{"from":"C","to":"D","label":"d","style":{}},{"from":"B","to":"B","label":"b","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"C","to":"C","label":"c","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"C","to":"X","label":"a, b","style":{}},{"from":"X","to":"X","label":"a, b, c, d","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"B","to":"X","label":"a","style":{"edgeAnchor":{"x":gsc*9.431249999999977,"y":gsc*-83.59687499999998}}},{"from":"D","to":"X","label":"a, b, c","style":{"edgeAnchor":{"x":gsc*39.168750000000045,"y":gsc*46.556250000000034}}},{"from":"D","to":"D","label":"d","style":{"loopOffset":{"x":gsc*-32.292187499999955,"y":gsc*-81.65625}}},{"from":"B","to":"D","label":"d","style":{"edgeAnchor":{"x":gsc*25.832812499999932,"y":gsc*24.21562499999999}}}]};
  const dfaAlphabetic = new DFA();
  dfaAlphabetic.import(dfaAlphabeticJSON);
  dfaAlphabetic.graph.scale.set(0.55);
  dfaAlphabetic.graph.position.set(2100, 650);
  dfaAlphabetic.alpha = 0;
  Object.values(dfaAlphabetic.nodes).forEach((state) => {
    state.graphic.alpha = 0;
    state.separatedGraphic.alpha = 0;
  });
  dfaAlphabetic.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0;
    e.updateGraphic();
  })
  GS.screen.addChild(dfaAlphabetic.graph);


  // But others, even relatively simple languages, become rather unruly in Regular Expressions. For example, the language of words with an even amount of 'a's, is definable, but not in a very natural way:
  // $$
  //   b^*(ab^*ab^*)^*
  // $$

  const example2 = new TextChanger("b*(ab*ab*)*");
  const exampleCover2 = new RectangleCover(example2, { randMult: 0.1, points: 20, width: 700, height: 180 });
  example2.pivot.set(0, example2.height / 2);
  example2.position.set(1000, 1200);
  example2.alpha = 0;
  exampleCover2.position.set(example2.position.x, example2.position.y);
  exampleCover2.alpha = 0;
  GS.screen.addChild(exampleCover2);
  GS.screen.addChild(example2);

  const dfaEvenJSON = {"states":[{"name":"E","position":{"x":286.203125*gsc,"y":264.79218749999995*gsc},"accepting":true,"starting":true},{"name":"O","position":{"x":568.9999999999999*gsc,"y":262.33124999999995*gsc},"accepting":false,"starting":false}],"alphabet":["b","a"],"transitions":[{"from":"E","to":"E","label":"b","style":{"loopOffset":{"x":0,"y":-75*gsc}}},{"from":"O","to":"O","label":"b","style":{"loopOffset":{"x":0,"y":-75*gsc}}},{"from":"E","to":"O","label":"a","style":{"edgeAnchor":{"x":0.9140625*gsc,"y":-55.50468749999999*gsc}}},{"from":"O","to":"E","label":"a","style":{"edgeAnchor":{"x":1.171875*gsc,"y":48.80624999999998*gsc}}}]}
  const dfaEven = new DFA();
  dfaEven.import(dfaEvenJSON);
  dfaEven.graph.scale.set(0.8);
  dfaEven.graph.position.set(1650, 400);
  dfaEven.alpha = 0;
  Object.values(dfaEven.nodes).forEach((state) => {
    state.graphic.alpha = 0;
    state.separatedGraphic.alpha = 0;
  });
  dfaEven.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0;
    e.updateGraphic();
  });
  GS.screen.addChild(dfaEven.graph);

  const overlayLeftGreen = new PIXI.Graphics();
  overlayLeftGreen.rect(50, 50, 1900, 2300).fill(green);
  overlayLeftGreen.alpha = 0;
  const overlayRightGreen = new PIXI.Graphics();
  overlayRightGreen.rect(2050, 50, 1900, 2300).fill(green);
  overlayRightGreen.alpha = 0;
  const overlayLeftRed = new PIXI.Graphics();
  overlayLeftRed.rect(50, 50, 1900, 2300).fill(red);
  overlayLeftRed.alpha = 0;
  const overlayRightRed = new PIXI.Graphics();
  overlayRightRed.rect(2050, 50, 1900, 2300).fill(red);
  overlayRightRed.alpha = 0;
  GS.screen.addChild(overlayLeftGreen);
  GS.screen.addChild(overlayRightGreen);
  GS.screen.addChild(overlayLeftRed);
  GS.screen.addChild(overlayRightRed);

  // Over the next few lessons, let's get comfortable with Regular Expressions, and how we can define some ourself!

  TweenManager.add(delay(60)
    .then(fade(title))
    .then(delay(60))
    .then(squishTitle)
    .then(delay(60))
    .then(fade(title, false))
    .then(delay(60))
    .then(fade([basic, basicCover]))
    .then(delay(60))
    .then(fade(langContainer))
    .then(fade(wordContainer))
    .then(addStar)
    .then(delay(60))
    .then(moveStar)
    .then(fade(starHighlights))
    .then(delay(60))
    .then(fade(starHighlights, false))
    .then(delay(60))
    .then(pipeChange)
    .then(delay(60))
    .then(movePipe)
    .then(delay(60))
    .then(doublePipeChange)
    .then(delay(60))
    .then(moveDoublePipe)
    .then(delay(60))
    .then(fade(pipeHighlights))
    .then(delay(60))
    .then(fade(pipeHighlights, false))
    .then(bracketChange)
    .then(delay(60))
    .then(moveBrackets)
    .then(delay(60))
    .then(fade(bracketHighlights))
    .then(delay(60))
    .then(fade([basic, wordContainer, langContainer, basicCover], false))
    .then(delay(60))
    .then(fade([complex, coverComplex]))
    .then(delay(60))
    .then(fade([smaller, coverSmaller]), colorFence1)
    .then(fade([fenceExample, coverFence]))
    .then(fade([fenceHighlight1, smallerFenceHighlight1]))
    .then(delay(60))
    .then(fence1_1, fence1_Move1)
    .then(delay(60))
    .then(fence1_2, fence1_Move2)
    .then(delay(60))
    .then(fence1_3, fence1_Move3)
    .then(delay(60))
    .then(fade([fenceHighlight1, smallerFenceHighlight1], false))
    .then(delay(60))
    .then(colorFence2, fence2_start)
    .then(fade([fenceHighlight2, smallerFenceHighlight2]))
    .then(delay(60))
    .then(fence2_1, fence2_Move1)
    .then(delay(60))
    .then(fence2_2, fence2_Move2)
    .then(delay(60))
    .then(fence2_3, fence2_Move3)
    .then(delay(60))
    .then(fade([fenceHighlight2, smallerFenceHighlight2], false))
    .then(delay(60))
    .then(choiceStart, colorChoice)
    .then(delay(60))
    .then(fade([fenceHighlight3, fenceHighlight4, fenceHighlight5, smallerCHighlight, smallerCEncompassingHighlight, smallerCFence1Highlight, smallerCFence2Highlight]))
    .then(delay(60))
    .then(fence3_1, fence3_Move1)
    .then(delay(60))
    .then(fence3_2, fence3_Move2)
    .then(delay(60))
    .then(fence3_3, fence3_Move3)
    .then(delay(60))
    .then(fade([fenceHighlight3, fenceHighlight4, fenceHighlight5, smallerCHighlight, smallerCEncompassingHighlight, smallerCFence1Highlight, smallerCFence2Highlight], false))
    .then(delay(60))
    .then(doubleFenceStart, colorMassive)
    .then(delay(60))
    .then(fade([
      smallerMassiveHighlight, smallerMassiveCHighlight, smallerChoiceHighlight, smallerChoiceHighlight1, smallerChoiceHighlight2,
      fenceHighlightG1Cover, fenceHighlightG1C, fenceHighlightG1FenceEnclose, fenceHighlightG1Fence,
      fenceHighlightG2Cover, fenceHighlightG2C, fenceHighlightG2FenceEnclose, fenceHighlightG2Fence,
    ]))
    .then(delay(60))
    .then(fence4_1, fence4_Move1)
    .then(delay(60))
    .then(fence4_2, fence4_Move2)
    .then(delay(60))
    .then(fence4_3, fence4_Move3)
    .then(delay(60))
    .then(fence4_4, fence4_4_2, fence4_Move4, colorMassive2)
    .then(delay(60))
    .then(fade([smaller, coverSmaller], false))
    .then(delay(60))
    .then(moveExample)
    .then(changeExample, hideHighlights, resetColor)
    .then(fade([
      underlineComplexDerivation, underlineComplexTerminal,
      terminalLine1, derivationLine1, derivationLine2,
      terminal1c, terminalCover1, largeCopy1,
      largeCover1, largeCopy2, largeCover2
    ]))
    .then(delay(60))
    .then(fade([
      derivation1Terminal, derivation1Fence, derivation2Terminal, derivation2Fence,
      derivation1TerminalLine, derivation1FenceLine, derivation2TerminalLine, derivation2FenceLine,
      terminal2c, terminalCover2,
      fence1Derivation, fence1Cover,
      terminal3c, terminalCover3,
      fence2Derivation, fence2Cover,
    ]))
    .then(delay(60))
    .then(fade([
      derivation1LeftTerm, derivation1FenceMiddle, derivation1RightTerm,
      derivation2LeftTerm, derivation2FenceMiddle, derivation2RightTerm,
      derivation1LeftTermLine, derivation1FenceMiddleLine, derivation1RightTermLine,
      derivation2LeftTermLine, derivation2FenceMiddleLine, derivation2RightTermLine,
      fence1DerivationLeftTerm, fence1DerivationMiddle, fence1DerivationRightTerm,
      fence2DerivationLeftTerm, fence2DerivationMiddle, fence2DerivationRightTerm,
      fence1LeftCover, fence1MiddleCover, fence1RightCover,
      fence2LeftCover, fence2MiddleCover, fence2RightCover,
    ]))
    .then(delay(60))
    .then(fade([
      connectingContainer,
      fenceHighlightLeft, fenceHighlightRight, fenceHighlightOrange, fenceHighlightBlue, fenceHighlightYellow1, fenceHighlightYellow2
    ]))
    .then(delay(60))
    .then(fade([
      fenceHighlightLeft, fenceHighlightRight, fenceHighlightOrange, fenceHighlightBlue, fenceHighlightYellow1, fenceHighlightYellow2,
      connectingContainer,
      derivation1LeftTerm, derivation1FenceMiddle, derivation1RightTerm,
      derivation2LeftTerm, derivation2FenceMiddle, derivation2RightTerm,
      derivation1LeftTermLine, derivation1FenceMiddleLine, derivation1RightTermLine,
      derivation2LeftTermLine, derivation2FenceMiddleLine, derivation2RightTermLine,
      fence1DerivationLeftTerm, fence1DerivationMiddle, fence1DerivationRightTerm,
      fence2DerivationLeftTerm, fence2DerivationMiddle, fence2DerivationRightTerm,
      fence1LeftCover, fence1MiddleCover, fence1RightCover,
      fence2LeftCover, fence2MiddleCover, fence2RightCover,
      derivation1Terminal, derivation1Fence, derivation2Terminal, derivation2Fence,
      derivation1TerminalLine, derivation1FenceLine, derivation2TerminalLine, derivation2FenceLine,
      terminal2c, terminalCover2,
      fence1Derivation, fence1Cover,
      terminal3c, terminalCover3,
      fence2Derivation, fence2Cover,
      underlineComplexDerivation, underlineComplexTerminal,
      terminalLine1, derivationLine1, derivationLine2,
      terminal1c, terminalCover1, largeCopy1,
      largeCover1, largeCopy2, largeCover2,
      underlineComplexDerivation, underlineComplexTerminal,
      terminalLine1, derivationLine1, derivationLine2,
      terminal1c, terminalCover1, largeCopy1,
      largeCover1, largeCopy2, largeCover2,
      complex, coverComplex,
      fenceExample, coverFence,
    ], false))
    .then(delay(60))
    .then(
      ...Object.values(dfaAlphabetic.nodes).map(node => node.tweenPop(60)),
      delay(30).then(
        ...dfaAlphabetic.edges.map(edge =>
          edge.growEdgeTween(60, GS.easings.easeInOutQuad)
          .during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
        )
      )
    )
    .then(delay(60))
    .then(fade([example1, exampleCover1]))
    .then(delay(60))
    .then(new ValueTween(0, 0.3, 60, GS.easings.easeInOutQuad, (v) => {
      overlayLeftGreen.alpha = v;
      overlayRightRed.alpha = v;
    }))
    .then(delay(60))
    .then(new ValueTween(0.3, 0, 60, GS.easings.easeInOutQuad, (v) => {
      overlayLeftGreen.alpha = v;
      overlayRightRed.alpha = v;
    }))
    .then(delay(60))
    .then(fade([example1, exampleCover1, dfaAlphabetic.graph], false))
    .then(delay(60))
    .then(
      ...Object.values(dfaEven.nodes).map(node => node.tweenPop(60)),
      delay(30).then(
        ...dfaEven.edges.map(edge =>
          edge.growEdgeTween(60, GS.easings.easeInOutQuad)
          .during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
        )
      )
    )
    .then(fade([example2, exampleCover2]))
    .then(delay(60))
    .then(new ValueTween(0, 0.3, 60, GS.easings.easeInOutQuad, (v) => {
      overlayLeftRed.alpha = v;
      overlayRightGreen.alpha = v;
    }))
    .then(delay(60))
    .then(new ValueTween(0.3, 0, 60, GS.easings.easeInOutQuad, (v) => {
      overlayLeftRed.alpha = v;
      overlayRightGreen.alpha = v;
    }))
    .then(delay(60))
    .then(fade([example2, exampleCover2, dfaEven.graph], false))
    .then(delay(60))
  )

};

const unloader = () => {};

export default { loader, unloader };

