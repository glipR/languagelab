import { black, blue, green, highlightColours, lightGrey, red, white } from "../colours.js";
import Regex from "../regex.js";
import Screen from "../screen.js";
import { RectangleCover } from "../tools/paper_cover.js";
import { delay, ImmediateTween, interpValue, randomDelay, TweenManager, ValueTween } from "../tween.js";
import RegexGame from './regex_game.js'
import NFAConvert from './nfa_convert.js';
import { convertTasks } from '../content/nfa_convert.js';
import { vectorCombine } from "../utils.js";
import DFA from "../dfa.js";
import { DrawnBezier } from "../tools/drawnBezier.js";

const gsc = window.gameScaling ?? 1;

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 128,
  fill: black,
  align: 'center',
};

export const GS = {};

const movePointer = (pointer, pos, duration) => new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
  const pos = interpValue(pointer.startPos, pointer.endPos, v);
  pointer.position.set(pos.x, pos.y);
}, () => {
  pointer.startPos = {x: pointer.position.x, y: pointer.position.y};
  pointer.endPos = pos;
});
const pointerClick = (pointer) => new ValueTween(lightGrey, black, 25, GS.easings.easeInOutQuad, (v) => pointer.tint = v);

export const createFakeNFAEnvironment = (nfaApp) => {
  Object.values(convertTasks[0].nfa.nodes).forEach(node => {
    node.x = node.x * gsc;
    node.y = node.y * gsc - 400;
  });
  convertTasks[0].nfa.edges.forEach(edge => {
    if (edge.style?.edgeAnchor) {
      edge.style.edgeAnchor.x *= gsc;
      edge.style.edgeAnchor.y *= gsc;
    }
  });
  NFAConvert.loader(nfaApp, GS.easings, () => {}, () => {}, {hideBG: true, ...convertTasks[0]});
  NFAConvert.GS.checkButton.alpha = 0;
  NFAConvert.GS.containerClick(1, 0);
  NFAConvert.GS.nodeClick('S');
  NFAConvert.GS.nodeClick('A');
  const nfaPointer = new PIXI.Graphics();
  nfaPointer
    .moveTo(0, 0)
    .lineTo(0, 100)
    .lineTo(Math.cos(3 * Math.PI / 8) * 60, Math.sin(3 * Math.PI / 8) * 60)
    .lineTo(Math.cos(Math.PI / 4) * 100, Math.sin(Math.PI / 4) * 100)
    .lineTo(0, 0)
    .fill(white);
  nfaPointer.position.set(500, 400);
  nfaPointer.tint = black;
  NFAConvert.GS.screen.addChild(nfaPointer);

  const containerPos = (i, j) => {
    return vectorCombine(
      NFAConvert.GS.table.getElementPosition(i, j),
      { x: NFAConvert.GS.table.position.x, y: NFAConvert.GS.table.position.y },
      { x: 200, y: 50 },
    )
  }
  const nodePos = (label) => {
    return vectorCombine(
      NFAConvert.GS.nfa.nodes[label].position,
      {
        x: NFAConvert.GS.nfa.graph.position.x,
        y: NFAConvert.GS.nfa.graph.position.y,
      }
    )
  }

  const nfaConvertSet = delay(0)
  .then(
    movePointer(nfaPointer, containerPos(1, 1), 30),
  )
  .then(new ImmediateTween(() => NFAConvert.GS.containerClick(1, 1)), pointerClick(nfaPointer))
  .then(movePointer(nfaPointer, nodePos('D'), 30))
  .then(new ImmediateTween(() => NFAConvert.GS.nodeClick('D')), pointerClick(nfaPointer))
  .then(movePointer(nfaPointer, containerPos(1, 2), 30))
  .then(new ImmediateTween(() => NFAConvert.GS.containerClick(1, 2)), pointerClick(nfaPointer))
  .then(movePointer(nfaPointer, nodePos('B'), 30))
  .then(new ImmediateTween(() => NFAConvert.GS.nodeClick('B')), pointerClick(nfaPointer))
  .then(movePointer(nfaPointer, nodePos('C'), 30))
  .then(new ImmediateTween(() => NFAConvert.GS.nodeClick('C')), pointerClick(nfaPointer))
  .then(movePointer(nfaPointer, nodePos('D'), 30))
  .then(new ImmediateTween(() => NFAConvert.GS.nodeClick('D')), pointerClick(nfaPointer))
  return nfaConvertSet;
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.opts = opts;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();

  // What's in a language, and why on earth do we care about them in computer science?
  const title = new PIXI.Text({ text: "Language Lab", style: baseStyle});
  title.anchor.set(0.5, 0.5);
  title.position.set(2000, 1200);
  title.scale.set(3);
  title.alpha = 0;
  GS.screen.addChild(title);
  const fadeTitle = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => title.alpha = v);

  // Surprising as it may be, the study of languages underpins a large amount of computational complexity theory, and even separately from that is practically rather useful as well.
  const complexityTheory = new PIXI.Sprite(PIXI.Assets.get("complexity"));
  complexityTheory.anchor.set(0.5, 0.5);
  complexityTheory.position.set(2000, 1200);
  complexityTheory.alpha = 0;
  complexityTheory.scale.set(2000 / Math.max(complexityTheory.height, complexityTheory.width));
  GS.screen.addChild(complexityTheory);
  const fadeComplexity = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => complexityTheory.alpha = v);

  // Understanding languages helps us understand:

  // <ul>
  //   <li>How Computers can understand interpreted code and turn this into instructions</li>
  //   <li>How to write expressions to search for patterns in text</li>
  //   <li>What problems computers will never be able to solve!</li>
  // </ul>

  const codeNoAnnotation = new PIXI.Sprite(PIXI.Assets.get("plain-code"));
  codeNoAnnotation.anchor.set(0.5, 0.5);
  codeNoAnnotation.position.set(700, 1200);
  codeNoAnnotation.alpha = 0;
  codeNoAnnotation.scale.set(1250 / Math.max(codeNoAnnotation.height, codeNoAnnotation.width));
  GS.screen.addChild(codeNoAnnotation);
  const fadeCodeNoAnnotation = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => codeNoAnnotation.alpha = v);
  const codeAnnotation = new PIXI.Sprite(PIXI.Assets.get("annotated-code"));
  codeAnnotation.anchor.set(0.5, 0.5);
  codeAnnotation.position.set(700, 1200);
  codeAnnotation.alpha = 0;
  codeAnnotation.scale.set(1250 / Math.max(codeAnnotation.height, codeAnnotation.width));
  GS.screen.addChild(codeAnnotation);
  const fadeCodeAnnotation = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => codeAnnotation.alpha = v);

  const [fileWidth, fileHeight, cornerOffset] = [600, 1000, 100];
  const [numLines, linesStart, lineDiff, lineXOffset, lineWidth, finalLineEnd] = [20, 150, 40, 50, 10, 400];
  const fakeFile = new PIXI.Graphics();
  fakeFile
    .moveTo(0, 0)
    .lineTo(0, fileHeight)
    .lineTo(fileWidth, fileHeight)
    .lineTo(fileWidth, cornerOffset)
    .lineTo(fileWidth - cornerOffset, 0)
    .lineTo(0, 0)
    // More line to complete the top corner.
    .lineTo(0, cornerOffset)
    .fill(white)
    .stroke({ color: black, width: 20 })
    // The corner fold line.
    .moveTo(fileWidth, cornerOffset)
    .lineTo(fileWidth - cornerOffset, cornerOffset)
    .lineTo(fileWidth - cornerOffset, 0)
    .stroke({ color: black, width: 20 })
  for (let i=0; i<numLines; i++) {
    fakeFile
      .moveTo(lineXOffset, linesStart + i * lineDiff)
      .lineTo(i === numLines - 1 ? finalLineEnd : (fileWidth - lineXOffset), linesStart + i * lineDiff)
  }
  fakeFile.stroke({ color: black, width: lineWidth });
  fakeFile.position.set(2000 - fileWidth / 2, 1200 - fileHeight/2);
  fakeFile.alpha = 0;
  GS.screen.addChild(fakeFile);
  const fadeFakeFile = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => fakeFile.alpha = v);

  const highlightLines = [
    { line: 3, start: 0.2, end: 0.8, color: blue },
    { line: 5, start: 0.3, end: 1, color: green },
    { line: 6, start: 0, end: 0.3, color: green },
    { line: 10, start: 0.1, end: 0.7, color: blue },
    { line: 14, start: 0.6, end: 1, color: blue },
    { line: 15, start: 0, end: 0.2, color: blue },
    { line: 18, start: 0.4, end: 0.7, color: red },
  ]
  const fakeHighlights = new PIXI.Graphics();
  fakeHighlights.position.set(2000 - fileWidth / 2, 1200 - fileHeight/2);
  fakeHighlights.alpha = 0.2;
  GS.screen.addChild(fakeHighlights);
  const drawHighlights = (t) => {
    const finalLine = Math.floor(t * numLines);
    const finalLinePortion = t * numLines - finalLine;
    const totalLineWidth = fileWidth - 2 * lineXOffset;
    for (const { line, start, end, color } of highlightLines) {
      if (line < finalLine) {
        fakeHighlights
          .moveTo(lineXOffset + totalLineWidth * start, linesStart + line * lineDiff)
          .lineTo(lineXOffset + totalLineWidth * end, linesStart + line * lineDiff)
          .stroke({ color, width: lineWidth * 2.5 });
        } else if (line === finalLine && start < finalLinePortion) {
          const actualEnd = Math.min(end, finalLinePortion);
          fakeHighlights
            .moveTo(lineXOffset + totalLineWidth * start, linesStart + line * lineDiff)
            .lineTo(lineXOffset + totalLineWidth * actualEnd, linesStart + line * lineDiff)
            .stroke({ color, width: lineWidth * 2.5 });
      }
    }
  }
  const fadeHighlights = (fade) => new ValueTween(fade ? 0 : 0.2, fade ? 0.2 : 0, 60, GS.easings.easeInOutQuad, (v) => fakeHighlights.alpha = v);

  const computer = new PIXI.Sprite(PIXI.Assets.get("computer"));
  computer.anchor.set(0.5, 0.5);
  computer.position.set(3300, 1200);
  computer.alpha = 0;
  computer.scale.set(1250 / Math.max(computer.height, computer.width));
  GS.screen.addChild(computer);
  const fadeComputer = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => computer.alpha = v);
  const cog = new PIXI.Sprite(PIXI.Assets.get("cog"));
  cog.anchor.set(0.5, 0.5);
  cog.position.set(3300, 1000);
  cog.alpha = 0;
  cog.scale.set(350 / Math.max(cog.height, cog.width));
  cog.rotation = 0;
  GS.screen.addChild(cog);
  const fadeCog = (fade) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => cog.alpha = v);

  const rotateCog = (total, duration, c) => new ValueTween(0, 2 * Math.PI * total, duration, GS.easings.linear, (v) => c.rotation = v);

  // While there are some similarities between the languages we speak and the languages we use in computer science, it's important we clarify what we mean when we talk about a language in this context.

  // A language is defined over an alphabet, which is a set of symbols. Alphabets mean very much the same thing in both contexts - words in the language are composed of symbols in the alphabet.

  const alphabetText = (collection, position) => {
    const text = new PIXI.Text({ text: `{${collection}}`, style: baseStyle});
    text.anchor.set(0, 0.5);
    text.position.set(position.x, position.y);
    text.scale.set(1.5)
    text.alpha = 0;
    GS.screen.addChild(text);
    return text;
  }
  const az = alphabetText("a,b,...,z", { x: 400, y: 450 });
  const nums = alphabetText("0,1,...,9", { x: 400, y: 950 });
  const emoji = alphabetText("🚟,🔥,🅱️,🐗", { x: 400, y: 1450 });
  const strings = alphabetText("alpha,bravo,charlie", { x: 400, y: 1950 });
  const fadeIn = (fade, obj) => new ValueTween(fade ? 0 : 1, fade ? 1 : 0, 60, GS.easings.easeInOutQuad, (v) => obj.alpha = v);

  const sideContainer = new PIXI.Container();
  sideContainer.position.set(-150, 0);
  GS.screen.addChild(sideContainer);

  const rejectBox = (position) => {
    const container = new PIXI.Graphics();
    container.rect(0, 0, 1600, 450).fill(red).stroke({ color: black, width: 10 });
    container.position.set(position.x, position.y);
    container.alpha = 0;
    sideContainer.addChild(container);
    return container;
  }
  const acceptBox = (position) => {
    const container = new PIXI.Graphics();
    container.rect(0, 0, 750, 400).fill(green).stroke({ color: black, width: 10 });
    container.position.set(position.x, position.y);
    container.alpha = 0;
    sideContainer.addChild(container);
    return container;
  }

  const az_reject = rejectBox({ x: 2200, y: 200 });
  const az_accept = acceptBox({ x: 3025, y: 225 });
  const num_reject = rejectBox({ x: 2200, y: 700 });
  const num_accept = acceptBox({ x: 3025, y: 725 });
  const emoji_reject = rejectBox({ x: 2200, y: 1200 });
  const emoji_accept = acceptBox({ x: 3025, y: 1225 });
  const string_reject = rejectBox({ x: 2200, y: 1700 });
  const string_accept = acceptBox({ x: 3025, y: 1725 });

  const word = (w, position, splitChars=false, forceScale=1.5, container=undefined) => {
    let text;
    if (splitChars) {
      text = new PIXI.Container();
      const letters = [];
      Array.from(w).forEach((char, i) => {
        const letter = new PIXI.Text({ text: char, style: baseStyle});
        letter.scale.set(forceScale);
        letter.position.set(i === 0 ? 0 : letters[letters.length-1].position.x + letters[letters.length-1].width + (180 - letters[letters.length-1].width) * 0.15, 0);
        letters.push(letter);
        text.addChild(letter);
      });
      text.pivot.set(text.width / 2, text.height / 2);
      text.letters = letters;
    } else {
      text = new PIXI.Text({ text: w, style: baseStyle});
      text.anchor.set(0.5, 0.5);
      text.scale.set(forceScale)
    }
    text.position.set(position.x, position.y);
    text.alpha = 0;
    (container ?? sideContainer).addChild(text);
    return text;
  }
  const az_hello = word("hello", { x: 2500, y: 350 }, true);
  const az_world = word("world", { x: 2900, y: 500 });
  const az_testing = word("testing", { x: 3200, y: 300 });

  const num_42 = word("42", { x: 2500, y: 850 });
  const num_123 = word("123", { x: 2900, y: 1000 });
  const num_999 = word("999", { x: 3200, y: 800 });

  const emoji_1 = word("🔥🔥", { x: 2500, y: 1350 }, false, 1.2);
  const emoji_2 = word("🚟🅱️🐗🔥", { x: 2900, y: 1550 }, false, 1.2);
  const emoji_3 = word("🅱️🐗🅱️", { x: 3200, y: 1300 }, false, 1.2);

  const string_1 = word("alphabravo", { x: 2500, y: 1850 }, false, 0.8);
  const string_2 = word("charliecharliecharlie", { x: 2900, y: 2000 }, false, 0.8);
  const string_3 = word("alphacharliebravo", { x: 3200, y: 1800 }, false, 0.8);

  const rainbowWord = (obj) => new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    obj.letters.forEach((letter, i) => {
      letter.style.fill = interpValue(black, highlightColours[i % highlightColours.length], v);
    });
  });
  const blackWord = (obj) => new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    obj.letters.forEach((letter, i) => {
      letter.style.fill = interpValue(highlightColours[i % highlightColours.length], black, v);
    })
  });

  const moveWord = (word, position) => new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    const pos = interpValue(word.startPosition, position, v);
    word.position.set(pos.x, pos.y);
  }, () => {
    word.startPosition = {x: word.position.x, y: word.position.y};
  });

  const language = (v, height) => {
    const container = new PIXI.Container();
    const l = new PIXI.Text({ text: `L${v}`, style: {...baseStyle, fill: green} });
    const cover = new RectangleCover(l, { width: 200, height: 200 });
    cover.position.set(3900 + l.width*0.6, height)
    l.anchor.set(0, 0.5);
    l.position.set(3900, height);
    l.scale.set(1.5);
    container.alpha = 0;
    container.addChild(cover);
    container.addChild(l);
    sideContainer.addChild(container);
    return container
  }
  const [l1, l2, l3, l4] = [language(1, 425), language(2, 925), language(3, 1425), language(4, 1925)];


  // Considering all possible combinations of symbols in the alphabet, we can form words. These symbols could be letters like a and b, but they could also be numbers, emojis, or even entire strings themselves.

  // A language is simply a collection of these words. There is no rule on the conjugation of these words, no such thing as 'sentences' or 'grammar' in the context of languages in computer science.

  // This simple definition leads to more complexity and results than you might think at first glance.

  // Let's look at three examples of languages, and look at words that are/aren't in them.

  // <h3>Words with an even amount of 'a's (Alphabet: $\\{a, b\\}$)</h3>

  // This language considers all words made up of 'a's and 'b's, and says they are in the language if they have an even number of 'a's in total.

  const finalContainer = new PIXI.Container();
  const finalReject = new PIXI.Graphics();
  finalReject.rect(0, 0, 3500, 1000).fill(red).stroke({ color: black, width: 15 });
  finalReject.position.set(2000 - 3500 / 2, 2400 - 1000 - 100);
  const finalAccept = new PIXI.Graphics();
  finalAccept.rect(0, 0, 1700, 950).fill(green).stroke({ color: black, width: 15 });
  finalAccept.position.set(2000 - 3500 / 2 + 1775, 2400 - 1000 - 100 + 25);
  finalContainer.addChild(finalReject);
  finalContainer.addChild(finalAccept);

  const evenWords = [
    word("aaba", { x: 0, y: -2000 }, false, 1.5, finalContainer),
    word("baab", { x: 0, y: -2000 }, false, 1.5, finalContainer),
    word("bbb", { x: 0, y: -2000 }, false, 1.5, finalContainer),
    word("abbabbaa", { x: 0, y: -2000 }, false, 1.5, finalContainer),
    word("ababa", { x: 0, y: -2000 }, false, 1.5, finalContainer),
  ]

  const codeSprite = (path, scaling=2.5) => {
    const s = new PIXI.Sprite(PIXI.Assets.get(path));
    s.anchor.set(0.5, 0.5);
    s.position.set(0, -2000);
    s.scale.set(scaling);
    s.alpha = 0;
    finalContainer.addChild(s);
    return s;
  }
  const secondSprites = [
    codeSprite('valid-1'),
    codeSprite('invalid-2'),
    codeSprite('valid-2'),
    codeSprite('invalid-1'),
  ]
  const thirdSprites = [
    codeSprite('42-invalid-1'),
    codeSprite('42-invalid-2', 2),
    codeSprite('42-valid-1'),
    codeSprite('42-valid-2'),
  ]

  const evenCover = new RectangleCover(finalAccept, { width: 1150, height: 300, randMult: 0.1, points: 25 });
  evenCover.position.set(2000, 1000);
  evenCover.alpha = 0;
  finalContainer.addChild(evenCover);
  const evenLangText = new PIXI.Text({ text: "EVEN", style: {...baseStyle, fill: black} });
  evenLangText.anchor.set(0.5, 0.5);
  evenLangText.position.set(2000, 1000);
  evenLangText.scale.set(2.5);
  evenLangText.alpha = 0;
  finalContainer.addChild(evenLangText);

  const validLangText = new PIXI.Text({ text: "VALID", style: {...baseStyle, fill: black} });
  validLangText.anchor.set(0.5, 0.5);
  validLangText.position.set(2000, 1000);
  validLangText.scale.set(2);
  validLangText.alpha = 0;
  finalContainer.addChild(validLangText);

  const numLangText = new PIXI.Text({ text: "42", style: {...baseStyle, fill: black} });
  numLangText.anchor.set(0.5, 0.5);
  numLangText.position.set(2000, 1000);
  numLangText.scale.set(2.5);
  numLangText.alpha = 0;
  finalContainer.addChild(numLangText);

  const leftCog = new PIXI.Sprite(PIXI.Assets.get("cog"));
  leftCog.anchor.set(0.5, 0.5);
  leftCog.scale.set(0.5);
  leftCog.position.set(2000 - evenLangText.width / 2 - leftCog.width / 2 - 30, 1000);
  leftCog.alpha = 0;
  finalContainer.addChild(leftCog);
  const rightCog = new PIXI.Sprite(PIXI.Assets.get("cog"));
  rightCog.anchor.set(0.5, 0.5);
  rightCog.scale.set(0.5);
  rightCog.position.set(2000 + evenLangText.width / 2 + rightCog.width / 2 + 30, 1000);
  rightCog.alpha = 0;
  finalContainer.addChild(rightCog);

  finalContainer.alpha = 0;
  GS.screen.addChild(finalContainer);

  const moveThroughToPos = (word, pos, duration=60) => {
    const startPos = { x: 2000, y: -300 };
    const midPos = { x: 2000, y: 1000 };
    const endPos = pos;
    return new ValueTween(0, 2, duration, GS.easings.linear, (v) => {
      if (v < 1) {
        word.position.set(interpValue(startPos, midPos, v).x, interpValue(startPos, midPos, v).y);
      } else {
        word.position.set(interpValue(midPos, endPos, v - 1).x, interpValue(midPos, endPos, v - 1).y);
      }
    }, () => {word.alpha = 1;})
  }

  // Relatively simple to understand, right? It's also super easy to check - just count the number of 'a's in the word!

  // <h3>Python code with no syntax errors (Alphabet: Anything on your keyboard)</h3>

  // This language's alphabet is more complex, allowing spaces, brackets, numbers, and other special characters (even newlines).

  // This language is quite hard to describe in full, and also relatively hard to check - but our computers seem to be able to do it very well!

  // We'll learn how this is done, and how to define the syntax for a language like Python in future lessons.

  // <h3>Python code that will eventually print the number 42.</h3>

  // This language is even more complex - it's not just about the syntax of the code, but also about the runtime.

  // So in order to answer the question, we need to know to some extent what the code does.

  // This is a much harder problem to solve, in fact, as we'll prove near the end of this course, it's impossible for us to define a computer program to answer this question universally!

  // <h2>So what's in this course?</h2>

  // This course is about exploring the theory of more and more complex languages, algorithms for identifying words in those languages, and the limitations of those algorithms.

  // We'll start with relatively simple algorithms/languages, and use this to build towards the tough questions you've seen above.

  const regular = new PIXI.Text({ text: "Regular", style: baseStyle});
  const contextFree = new PIXI.Text({ text: "Context Free", style: baseStyle});
  const decidable = new PIXI.Text({ text: "Decidable", style: baseStyle});
  const undecidable = new PIXI.Text({ text: "Undecidable", style: baseStyle});
  const p = new PIXI.Text({ text: "P", style: baseStyle});
  const np = new PIXI.Text({ text: "NP", style: baseStyle});
  const npComplete = new PIXI.Text({ text: "NP-Complete", style: baseStyle});
  const languages = [regular, contextFree, decidable, undecidable, p, np, npComplete];
  const covers = languages.map((l) => {
    const cover = new RectangleCover(l, { points: 20, randMult: 0.1 });
    l.anchor.set(0.5, 0.5);
    l.alpha = 0;
    cover.alpha = 0;
    GS.screen.addChild(cover);
    GS.screen.addChild(l);
    return cover;
  });

  regular.position.set(300, 1200);
  contextFree.position.set(1200, 1200);
  decidable.position.set(2300, 800);
  undecidable.position.set(2300, 1600);
  p.position.set(3500, 600);
  np.position.set(3500, 1200);
  npComplete.position.set(3500, 1800);
  covers.forEach((c, i) => c.position.set(languages[i].position.x, languages[i].position.y));

  const bezOpts = { points: 3}
  const edge1 = new DrawnBezier(bezOpts, [{ x: 600, y: 1200 }, { x: 750, y: 1200 }], 1);
  const edge2 = new DrawnBezier(bezOpts, [{ x: 1700, y: 1200 }, { x: 1850, y: 1200 }], 1);
  const edge3 = new DrawnBezier(bezOpts, [{ x: 2800, y: 1200 }, { x: 2950, y: 1200 }], 1);
  const edges = [edge1, edge2, edge3];
  const arrowHeads = edges.map((edge) => {
    const arrow = new PIXI.Graphics();
    arrow
      .moveTo(0, -25)
      .lineTo(50, 0)
      .lineTo(0, 25)
      .fill(black);
    const points = edge.getDrawnPoints()
    arrow.position.set(points[points.length-1].x, points[points.length-1].y);
    GS.screen.addChild(arrow);
    GS.screen.addChild(edge);
    edge.alpha = 0;
    arrow.alpha = 0;
    return arrow;
  });

  // But more importantly than anything else, <span class="highlight-small highlight-green-long">we'll have fun doing it!</span> This course is interactive wherever possible, so you'll have the opportunity to execute, design, and explore the algorithms and languages provided.
  const fakeDFAJSON = {
    nodes: {
      A: { x: 0, y: 0, start: true, style: {radius: 90, entryWidth: 15} },
      B: { x: 600, y: 0, style: {radius: 90, entryWidth: 15} },
    },
    edges: [
      { from: 'A', to: 'B', label: 'a' },
    ],
  }
  const fakeDFA = new DFA();
  fakeDFA.fromJSON(fakeDFAJSON);
  fakeDFA.graph.position.set(2600, 600);
  GS.screen.addChild(fakeDFA.graph);
  Object.values(fakeDFA.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  fakeDFA.edges.forEach(edge => {
    edge.labelBG.alpha = 1;
    edge.drawnAmount = 0;
    edge.updateGraphic();
  })
  const fakeDFAPointer = new PIXI.Graphics();
  fakeDFAPointer
    .moveTo(0, 0)
    .lineTo(0, 100)
    .lineTo(Math.cos(3 * Math.PI / 8) * 60, Math.sin(3 * Math.PI / 8) * 60)
    .lineTo(Math.cos(Math.PI / 4) * 100, Math.sin(Math.PI / 4) * 100)
    .lineTo(0, 0)
    .fill(white);
  fakeDFAPointer.position.set(500, 400);
  fakeDFAPointer.tint = black;
  fakeDFAPointer.alpha = 0;
  fakeDFA.graph.addChild(fakeDFAPointer);


  const nfaContainer = new PIXI.Container();
  nfaContainer.position.set(100, 100);
  nfaContainer.alpha = 0;
  GS.screen.addChild(nfaContainer);
  const nfaApp = Screen.fakeApp(nfaContainer, 2000, 1600);
  const nfaAnim = createFakeNFAEnvironment(nfaApp);

  const regexContainer = new PIXI.Container();
  regexContainer.position.set(1100, 1000);
  regexContainer.alpha = 0;
  GS.screen.addChild(regexContainer);
  const regexApp = Screen.fakeApp(regexContainer, 2000, 1600);
  RegexGame.loader(regexApp, GS.easings, () => {}, () => {}, {hideBG: true, steps: [], progress: {}});
  RegexGame.showScreen(RegexGame.STATE_SLEUTH_GUESS);
  RegexGame.setCodeRegex("a*b*c")
  RegexGame.GS.sleuthGuesses = [new Regex("a*(b|c)*")]
  RegexGame.GS.codeWordDistinguishes = ["abcbc"]
  RegexGame.GS.screenContainers[RegexGame.STATE_SLEUTH_GUESS].onStart();
  RegexGame.GS.sleuthGuesses.push(new Regex("abc*"))
  RegexGame.GS.codeWordDistinguishes.push("aabc")
  RegexGame.GS.screenContainers[RegexGame.STATE_SLEUTH_GUESS].onStart();
  const regexWords = RegexGame.GS.wordContainer.children;
  regexWords[0].position.set(1600, 1500);
  const regexPointer = new PIXI.Graphics();
  regexPointer
    .moveTo(0, 0)
    .lineTo(0, 100)
    .lineTo(Math.cos(3 * Math.PI / 8) * 60, Math.sin(3 * Math.PI / 8) * 60)
    .lineTo(Math.cos(Math.PI / 4) * 100, Math.sin(Math.PI / 4) * 100)
    .lineTo(0, 0)
    .fill(white);
  regexPointer.tint = black;
  regexPointer.position.set(1400, 700);
  RegexGame.GS.screenContainers[RegexGame.STATE_SLEUTH_GUESS].addChild(regexPointer);
  const moveRegexWord = new ValueTween({ x: 1400, y: 700}, {x: 1700, y: 500}, 30, GS.easings.easeInOutQuad, (pos) => {
    regexPointer.position.set(pos.x, pos.y);
  }).then(new ValueTween({ x: 1700, y: 500 }, { x: 2600, y: 1600 }, 60, GS.easings.easeInOutQuad, (pos) => {
    regexWords[1].position.set(pos.x, pos.y);
    regexPointer.position.set(pos.x, pos.y);
  }), new ImmediateTween(() => regexPointer.tint = lightGrey))
  .then(new ImmediateTween(() => regexPointer.tint = black));
  const regexAnswer = RegexGame.GS.answerInput;
  const setAnswer = delay(0).then(
    new ImmediateTween(() => {regexAnswer.keyTyped("(")}),
    delay(10).then(new ImmediateTween(() => regexAnswer.keyTyped("a"))),
    delay(20).then(new ImmediateTween(() => regexAnswer.keyTyped("|"))),
    delay(30).then(new ImmediateTween(() => regexAnswer.keyTyped("b"))),
    delay(40).then(new ImmediateTween(() => regexAnswer.keyTyped(")"))),
    delay(50).then(new ImmediateTween(() => regexAnswer.keyTyped("*"))),
    delay(60).then(new ImmediateTween(() => regexAnswer.keyTyped("c"))),
  );
  regexAnswer.deactivate();

  // Start the cog rotations
  TweenManager.add(delay(0).then(rotateCog(300, 18000, leftCog), rotateCog(-300, 18000, rightCog)))
  TweenManager.add(delay(60)
    .then(fadeTitle(true))
    .then(delay(60))
    .then(fadeTitle(false))
    .then(fadeComplexity(true))
    .then(delay(60))
    .then(fadeComplexity(false))
    .then(delay(60))
    .then(fadeCodeNoAnnotation(true))
    .then(fadeCodeAnnotation(true))
    .then(delay(60))
    .then(fadeFakeFile(true))
    .then(new ValueTween(0, 1, 180, GS.easings.easeInOutQuad, drawHighlights))
    .then(delay(60))
    .then(fadeComputer(true), fadeCog(true), rotateCog(3, 180, cog), delay(120).then(
      fadeCodeAnnotation(false), fadeCodeNoAnnotation(false), fadeComputer(false), fadeCog(false), fadeFakeFile(false), fadeHighlights(false)
    ))
    .then(delay(60))
    .then(fadeIn(true, az))
    .then(delay(60))
    .then(fadeIn(true, az_hello))
    .then(rainbowWord(az_hello))
    .then(delay(60))
    .then(
      blackWord(az_hello),
      fadeIn(true, az_world),
      fadeIn(true, az_testing),
    )
    .then(delay(60))
    .then(
      fadeIn(true, nums),
      delay(30).then(
        fadeIn(true, num_42),
        fadeIn(true, num_123),
        fadeIn(true, num_999),
      )
    )
    .then(delay(60))
    .then(
      fadeIn(true, emoji),
      delay(30).then(
        fadeIn(true, emoji_1),
        fadeIn(true, emoji_2),
        fadeIn(true, emoji_3),
      )
    )
    .then(delay(60))
    .then(
      fadeIn(true, strings),
      delay(30).then(
        fadeIn(true, string_1),
        fadeIn(true, string_2),
        fadeIn(true, string_3),
      )
    )
    .then(delay(60))
    .then(
      fadeIn(true, az_reject),
      fadeIn(true, num_reject),
      fadeIn(true, emoji_reject),
      fadeIn(true, string_reject),
    )
    .then(
      fadeIn(true, az_accept),
      fadeIn(true, num_accept),
      fadeIn(true, emoji_accept),
      fadeIn(true, string_accept),
      fadeIn(true, l1),
      fadeIn(true, l2),
      fadeIn(true, l3),
      fadeIn(true, l4),
      moveWord(az_hello, { x: 3300, y: 350 }),
      moveWord(az_world, { x: 3300, y: 500 }),
      moveWord(az_testing, { x: 2600, y: 300 }),
      moveWord(num_42, { x: 3500, y: 900 }),
      moveWord(num_123, { x: 2800, y: 1000 }),
      moveWord(num_999, { x: 2600, y: 800 }),
      moveWord(emoji_1, { x: 3300, y: 1525 }),
      moveWord(emoji_2, { x: 2600, y: 1400 }),
      moveWord(emoji_3, { x: 3500, y: 1350 }),
      moveWord(string_1, { x: 3400, y: 1850 }),
      moveWord(string_2, { x: 2600, y: 2000 }),
      moveWord(string_3, { x: 2600, y: 1800 }),
    )
    .then(delay(60))
    .then(
      fadeIn(false, az),
      fadeIn(false, nums),
      fadeIn(false, emoji),
      fadeIn(false, strings),
      fadeIn(false, az_reject),
      fadeIn(false, num_reject),
      fadeIn(false, emoji_reject),
      fadeIn(false, string_reject),
      fadeIn(false, az_accept),
      fadeIn(false, num_accept),
      fadeIn(false, emoji_accept),
      fadeIn(false, string_accept),
      fadeIn(false, az_hello),
      fadeIn(false, az_world),
      fadeIn(false, az_testing),
      fadeIn(false, num_42),
      fadeIn(false, num_123),
      fadeIn(false, num_999),
      fadeIn(false, emoji_1),
      fadeIn(false, emoji_2),
      fadeIn(false, emoji_3),
      fadeIn(false, string_1),
      fadeIn(false, string_2),
      fadeIn(false, string_3),
      fadeIn(false, l1),
      fadeIn(false, l2),
      fadeIn(false, l3),
      fadeIn(false, l4),
    )
    .then(
      delay(60),
    )
    .then(
      fadeIn(true, finalContainer),
      fadeIn(true, evenLangText),
      fadeIn(true, evenCover),
      fadeIn(true, leftCog),
      fadeIn(true, rightCog),
    )
    .then(delay(240))
    .then(
      moveThroughToPos(evenWords[0], { x: 800, y: 1900 }),
      delay(45).then(moveThroughToPos(evenWords[1], { x: 2400, y: 2100 })),
      delay(90).then(moveThroughToPos(evenWords[2], { x: 3250, y: 1850 })),
      delay(135).then(moveThroughToPos(evenWords[3], { x: 2700, y: 1600 })),
      delay(180).then(moveThroughToPos(evenWords[4], { x: 1300, y: 1550 })),
    )
    .then(delay(630))
    .then(
      ...evenWords.map(w => fadeIn(false, w)),
      fadeIn(false, evenLangText),
      fadeIn(true, validLangText),
    )
    .then(delay(30 + 7*60))
    .then(
      moveThroughToPos(secondSprites[0], { x: 2700, y: 1600 }),
      delay(45).then(moveThroughToPos(secondSprites[1], { x: 1300, y: 1550 })),
      delay(90).then(moveThroughToPos(secondSprites[2], { x: 3250, y: 1850 })),
      delay(135).then(moveThroughToPos(secondSprites[3], { x: 1100, y: 2000 })),
    )
    .then(delay(14*60))
    .then(
      ...secondSprites.map(w => fadeIn(false, w)),
      fadeIn(false, validLangText),
      fadeIn(true, numLangText),
    )
    .then(delay(3 * 60))
    .then(
      moveThroughToPos(thirdSprites[0], { x: 1500, y: 1650 }),
      delay(45).then(moveThroughToPos(thirdSprites[1], { x: 800, y: 1800 })),
      delay(90).then(moveThroughToPos(thirdSprites[2], { x: 3250, y: 1950 })),
      delay(135).then(moveThroughToPos(thirdSprites[3], { x: 2700, y: 1600 })),
    )
    .then(delay(18 * 60))
    .then(
      ...thirdSprites.map(w => fadeIn(false, w)),
      fadeIn(false, numLangText),
      fadeIn(false, finalContainer),
      fadeIn(false, leftCog),
      fadeIn(false, rightCog),
    )
    .then(delay(60))
    .then(fadeIn(true, regular), fadeIn(true, covers[0]))
    .then(delay(60))
    .then(fadeIn(true, contextFree), fadeIn(true, covers[1]))
    .then(delay(60))
    .then(...[fadeIn(true, decidable), fadeIn(true, undecidable), fadeIn(true, covers[2]), fadeIn(true, covers[3])])
    .then(delay(60))
    .then(...[fadeIn(true, p), fadeIn(true, np), fadeIn(true, npComplete), fadeIn(true, covers[4]), fadeIn(true, covers[5]), fadeIn(true, covers[6])])
    .then(delay(60))
    .then(fadeIn(true, edge1), fadeIn(true, arrowHeads[0]))
    .then(delay(60))
    .then(fadeIn(true, edge2), fadeIn(true, arrowHeads[1]))
    .then(delay(60))
    .then(fadeIn(true, edge3), fadeIn(true, arrowHeads[2]))
    .then(
      fadeIn(false, regular),
      fadeIn(false, contextFree),
      fadeIn(false, decidable),
      fadeIn(false, undecidable),
      fadeIn(false, p),
      fadeIn(false, np),
      fadeIn(false, npComplete),
      ...covers.map(c => fadeIn(false, c)),
      ...edges.map(e => fadeIn(false, e)),
      ...arrowHeads.map(a => fadeIn(false, a)),
    )
    .then(fadeIn(true, fakeDFAPointer))
    .then(
      movePointer(fakeDFAPointer, { x: 0, y: 0 }, 60)
    )
    .then(
      fakeDFA.nodes['A'].tweenPop(60),
      pointerClick(fakeDFAPointer)
    )
    .then(
      movePointer(fakeDFAPointer, { x: 600, y: 0 }, 60)
    )
    .then(
      fakeDFA.nodes['B'].tweenPop(60),
      pointerClick(fakeDFAPointer)
    )
    .then(
      movePointer(fakeDFAPointer, { x: 0, y: 0 }, 60)
    )
    .then(
      new ImmediateTween(() => fakeDFAPointer.tint = lightGrey),
      fakeDFA.edges[0].growEdgeTween(60, GS.easings.easeInOutQuad),
      fakeDFA.edges[0].showLabelTween(60, GS.easings.easeInOutQuad),
      movePointer(fakeDFAPointer, { x: 600, y: 0 }, 60)
    )
    .then(new ImmediateTween(() => fakeDFAPointer.tint = black))
    .then(delay(60))
    .then(
      fadeIn(true, regexContainer),
    )
    .then(moveRegexWord)
    .then(setAnswer)
    .then(delay(60))
    .then(fadeIn(true, nfaContainer))
    .then(nfaAnim)
    .then(delay(60))
    .then(
      fadeIn(false, regexContainer),
      fadeIn(false, nfaContainer),
      fadeIn(false, fakeDFA.graph),
    )
    .then(fadeTitle(true))
  );

  // TweenManager.skipSeconds(55);
}

const unloader = () => {}

export default { loader, unloader }
