import Screen from "../screen.js";
import DFA from "../dfa.js";
import NFA from "../nfa.js";
import TextChanger from "../tools/change_text.js";
import { delay, TweenManager, ValueTween, fade, ImmediateTween, interpValue } from "../tween.js";
import { RectangleCover } from "../tools/paper_cover.js";
import nfaMatch from "../graphs/nfaMatch.js";
import { black, blue, orange, purple, green, rainbow, bg_dark, yellow, darkPurple } from "../colours.js";
import { average_color, color_to_lch, lch_to_color, magnitude, mergeDeep, multiply, negate, rotate, vectorCombine } from "../utils.js";
import { t3JSON } from "../graphs/dfaSim.js";
import { NodePointer, Word, flashEasing, moveBetween } from "../tools/word.js";
import { highlight, wrapColour } from "../templates/colours.js";
import { PhysicsArea, GS as GlobGS, Globs } from "./glob_testing.js";
import { AbstractEdge, Node } from "../graph.js";
import DFAMinimisation, { check, GS as MinimGS, onSplit, toggleSelection } from "./dfa_minimise.js";
import { minimiseTasks } from "../content/dfa_minimise.js";
import { DrawnBezier } from "../tools/drawnBezier.js";

export const GS = {};

const gsc = window.gameScaling ?? 1;

const baseTextStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.app = app;
  GS.easings = easings;
  GS.screen = new Screen(app, true, false);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();
  GS.opts = opts;

  GlobGS.screen = GS.screen;
  GlobGS.easings = easings;
  GlobGS.app = app;

  // Show all 3 machines
  // Highlight loops in all 3 machines (Kleene star in regular expression)
  {
    const dfa = new DFA();
    dfa.import({
      states: [
        { name: "E", position: { x: -300, y: 0 }, starting: { resetCurWord: true }, accepting: true },
        { name: "O", position: { x: 300, y: 0 } },
      ],
      transitions: [
        { from: "E", to: "O", label: "a", style: { edgeAnchor: { x: 0, y: -200 } } },
        { from: "O", to: "E", label: "a", style: { edgeAnchor: { x: 0, y: 200 } } },
        { from: "E", to: "E", label: "b" },
        { from: "O", to: "O", label: "b" },
      ],
    });
    Object.values(dfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    dfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    dfa.graph.position.set(700, 600);
    GS.screen.addChild(dfa.graph);

    const drawDFA = delay(0).then(
      ...Object.values(dfa.nodes).map(n => n.tweenPop(60)),
      ...dfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
    );

    const nfa = new NFA();
    nfa.fromJSON(nfaMatch.t3.graph);
    Object.values(nfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    nfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    nfa.graph.position.set(2000, 1200);
    GS.screen.addChild(nfa.graph);

    const drawNFA = delay(0).then(
      ...Object.values(nfa.nodes).map(n => n.tweenPop(60)),
      ...nfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
    );

    const regex = new TextChanger("a*((ba)|(ab))*");
    regex.pivot.set(0, regex.height/2);
    regex.position.set(2000, 2200);
    const regexCover = new RectangleCover(regex, { points: 20, randMult: 0.1 });
    regex.alpha = 0;
    regexCover.alpha = 0;
    regexCover.position.set(2000, 2200);
    GS.screen.addChild(regexCover);
    GS.screen.addChild(regex);

    GS.drawAll3 = delay(0).then(
      delay(50).then(drawDFA),
      drawNFA,
      delay(25).then(fade([regex, regexCover])),
    );

    GS.highlightLoops = delay(0).then(
      dfa.edges[0].colorEdgeTween(blue, 60, easings.easeInOutQuad),
      dfa.edges[1].colorEdgeTween(blue, 60, easings.easeInOutQuad),
      dfa.edges[2].colorEdgeTween(orange, 60, easings.easeInOutQuad),
      dfa.edges[3].colorEdgeTween(orange, 60, easings.easeInOutQuad),
      ...nfa.edges.filter(e => e.style.edgeLabel === '1,4,7' && "012".includes(e.from.label)).map(e => e.colorEdgeTween(blue, 60, easings.easeInOutQuad)),
      ...nfa.edges.filter(e => e.style.edgeLabel === '2,5,8' && "012".includes(e.from.label)).map(e => e.colorEdgeTween(orange, 60, easings.easeInOutQuad)),
      ...nfa.edges.filter(e => e.style.edgeLabel === '0,3,6,9' && "012".includes(e.from.label)).map(e => e.colorEdgeTween(purple, 60, easings.easeInOutQuad)),
      ...nfa.edges.filter(e => e.style.edgeLabel === '0,1,2,3,4,5,6,7,8,9').map(e => e.colorEdgeTween(purple, 60, easings.easeInOutQuad)),
      regex.colorText(blue, 1, 2),
      regex.colorText(orange, 13, 14),
    );

    GS.fadeAll3 = delay(0).then(
      fade([dfa.graph, nfa.graph, regex, regexCover], false),
    );
  }

  // 2 properties
  {
    const overlayBGHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: black; z-index: 1000; opacity: 0;">
    </div>`;
    const ruleHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; display: flex; justify-content: space-evenly; align-items: center; flex-direction: column; color: white; font-size: xx-large; opacity: 0;">
      <div id="rule1">1: Regular Languages have a finite number of states (this video).</div>
      <div id="rule2">2: Regular Languages require looping to recognise words of a certain length (next page).</div>
    </div>`

    const div = document.createElement('div');
    div.innerHTML = overlayBGHTML + ruleHTML;
    document.body.appendChild(div);
    const overlay = div.children[0];
    const rule = div.children[1];
    MathJax.typeset([rule]);

    GS.showProperties = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.7;
      rule.style.opacity = v;
    });
    GS.hideProperties = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.7;
      rule.style.opacity = v;
    });
  }

  // Show DFA execution. Mid execution, ask 'What was the word?' Answer: 'who cares, we're in state D and have 'aab' remaining'
  {
    const dfa = new DFA();
    Object.keys(t3JSON.nodes).forEach(k => {
      t3JSON.nodes[k].x *= gsc
      t3JSON.nodes[k].y *= gsc
      t3JSON.nodes[k].x -= 200;
      t3JSON.nodes[k].y += 500;
    });
    t3JSON.edges.forEach(e => {
      if (e.style?.edgeAnchor) {
        e.style.edgeAnchor.x *= gsc;
        e.style.edgeAnchor.y *= gsc;
      }
    });
    dfa.fromJSON(t3JSON);
    Object.values(dfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    dfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    GS.screen.addChild(dfa.graph);

    GS.showExampleDFA = delay(0).then(
      ...Object.values(dfa.nodes).map(n => n.tweenPop(60)),
      ...dfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
    );

    const word = new Word("bccab", { x: 2000, y: 1100 }, {});
    const pointer = new NodePointer(dfa, dfa.nodes.B, {});
    GS.screen.addChild(word.wordCover);
    GS.screen.addChild(word.wordContainer);

    GS.showExampleWordAndPointer = delay(0).then(
      fade([word.wordContainer, word.wordPointer, word.wordCover, pointer]),
    );

    GS.moveWordTwice = moveBetween('B', 'D', 60, dfa, pointer, word.wordPointer, word.word)
      .then(moveBetween('D', 'C', 60, dfa, pointer, word.wordPointer, word.word));

    GS.swapWords = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      word.word[0].alpha = 1 - v;
      word.word[0].position.set(word.word[0].initialPos.x, word.word[0].initialPos.y + 100 * v);
      word.word[1].alpha = 1 - v;
      word.word[1].position.set(word.word[1].initialPos.x, word.word[1].initialPos.y + 100 * v);
      word.newWord.forEach((l, i) => {
        l.alpha = v;
        l.position.set(word.word[i].initialPos.x, word.word[i].initialPos.y - 100 * (1-v));
      });
    }, () => {
      word.word[0].initialPos = { x: word.word[0].position.x, y: word.word[0].position.y };
      word.word[1].initialPos = { x: word.word[1].position.x, y: word.word[1].position.y };
      word.newWord = ["?", "?"].map((c, i) => {
        const letter = new PIXI.Text(c, {...word.style.text});
        letter.position.set(word.word[i].position.x, word.word[i].position.y);
        letter.anchor.set(0, 1);
        letter.alpha = 0;
        word.wordContainer.addChild(letter);
        return letter;
      })
    });

    const question = "What was the word again?";
    const answer = "Who cares, we're in state C and have 'cab' remaining";
    const questionText = new PIXI.Text(question, {...word.style.text});
    questionText.anchor.set(0, 0.5);
    questionText.position.set(400, 400);
    const answerText = new PIXI.Text(answer, {...word.style.text});
    answerText.anchor.set(1, 0.5);
    answerText.position.set(3600, 700);
    const questionCover = new RectangleCover(questionText, { points: 20, randMult: 0.1 });
    questionCover.position.set(questionText.position.x + questionText.width/2, questionText.position.y);
    const answerCover = new RectangleCover(answerText, { points: 20, randMult: 0.1 });
    answerCover.position.set(answerText.position.x - answerText.width/2, answerText.position.y);
    questionText.alpha = 0;
    answerText.alpha = 0;
    questionCover.alpha = 0;
    answerCover.alpha = 0;
    GS.screen.addChild(questionCover);
    GS.screen.addChild(questionText);
    GS.screen.addChild(answerCover);
    GS.screen.addChild(answerText);

    GS.showExampleQuestions = delay(0).then(
      fade([questionText, questionCover]),
      delay(90).then(fade([answerText, answerCover])),
    )

    GS.moveWordThrice = moveBetween('C', 'B', 60, dfa, pointer, word.wordPointer, word.word)
      .then(moveBetween('B', 'A', 60, dfa, pointer, word.wordPointer, word.word))
      .then(moveBetween('A', 'B', 60, dfa, pointer, word.wordPointer, word.word))

    GS.fadeExample = delay(0).then(
      fade(dfa.graph, false),
      fade([word.wordContainer, word.wordPointer, word.wordCover, pointer], false),
      fade([questionText, questionCover, answerText, answerCover], false),
    );
  }

  // Show abb substring DFA (1 copy)
  // Read bbbbba from the DFA, highlight the path in blue
  {
    const lang = new PIXI.Text({
      text: "'abb' substring",
      style: baseTextStyle,
    });
    lang.position.set(50, 50);
    lang.alpha = 0;
    GS.screen.addChild(lang);

    const dfa = new DFA();
    dfa.import({
      states: [
        { name: "S", position: { x: 500, y: 800 }, starting: true },
        { name: "A", position: { x: 1500, y: 800 } },
        { name: "B", position: { x: 2500, y: 800 } },
        { name: "C", position: { x: 3500, y: 800 }, accepting: true },
      ],
      transitions: [
        { from: "S", to: "S", label: "b" },
        { from: "S", to: "A", label: "a" },
        { from: "A", to: "A", label: "a" },
        { from: "A", to: "B", label: "b", style: { edgeAnchor: { x: 0, y: -150 } } },
        { from: "B", to: "A", label: "a", style: { edgeAnchor: { x: 0, y: +150 } } },
        { from: "B", to: "C", label: "b" },
        { from: "C", to: "C", label: "a,b" },
      ],
    });
    Object.values(dfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    dfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    GS.screen.addChild(dfa.graph);

    GS.showSubstringDFA1 = delay(0).then(
      ...Object.values(dfa.nodes).map(n => n.tweenPop(60)),
      ...dfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
      fade(lang),
    );

    const word = new Word("bbbbbababba", { x: 2200, y: 200 }, { pointer: { fill: blue } });
    const pointer = new NodePointer(dfa, dfa.nodes.S, { fill: blue });
    word.wordCover.updateGraphic({ width: word.wordContainer.width * 1.2 + 180 });
    word.wordCover.position.set(word.wordCover.position.x - 80, word.wordCover.position.y);
    GS.substringDFAWord1 = word;
    word.word.slice(6).forEach(l => l.alpha = 0);
    GS.screen.addChild(word.wordCover);
    GS.screen.addChild(word.wordContainer);

    GS.showSubstringDFAWord1 = fade([word.wordContainer, word.wordPointer, word.wordCover, pointer]);


    const opts = {
      dontFlash: true,
      edgeColor: blue,
      wordColor: blue,
      wordColorPrev: blue,
    }
    GS.moveSubstringDFA1 = moveBetween('S', 'S', 60, dfa, pointer, word.wordPointer, word.word, { ...opts, resetCurWord: true })
      .then(moveBetween('S', 'S', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('S', 'S', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('S', 'S', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('S', 'S', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('S', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts))

    GS.showSubstring1 = delay(0).then(
      fade(word.word.slice(6)),
      new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        word.word.slice(6).forEach(l => {
          l.position.set(l.startPos.x, l.startPos.y - 100 * (1-v));
        });
      }, () => {
        word.word.slice(6).forEach(l => {
          l.startPos = { x: l.position.x, y: l.position.y };
        })
      }),
    )

    const opts2 = {
      dontFlash: true,
      edgeColor: green,
      wordColor: green,
      wordColorPrev: green,
    }
    GS.moveSubstringDFA1Combine = moveBetween('A', 'B', 60, dfa, pointer, word.wordPointer, word.word, { ...opts2, wordColorPrev: blue })
      .then(moveBetween('B', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts2))
      .then(moveBetween('A', 'B', 60, dfa, pointer, word.wordPointer, word.word, opts2))
      .then(moveBetween('B', 'C', 60, dfa, pointer, word.wordPointer, word.word, opts2))
      .then(moveBetween('C', 'C', 60, dfa, pointer, word.wordPointer, word.word, opts2))



    GS.fadeSubstringDFA1 = delay(0).then(
      fade([dfa.graph, pointer, word.wordContainer, word.wordPointer, word.wordCover, lang], false),
    );
  }

  // Show second copy, read aaaaa, highlight the path in orange
  {
    const dfa = new DFA();
    dfa.import({
      states: [
        { name: "S", position: { x: 500, y: 2000 }, starting: true },
        { name: "A", position: { x: 1500, y: 2000 } },
        { name: "B", position: { x: 2500, y: 2000 } },
        { name: "C", position: { x: 3500, y: 2000 }, accepting: true },
      ],
      transitions: [
        { from: "S", to: "S", label: "b" },
        { from: "S", to: "A", label: "a" },
        { from: "A", to: "A", label: "a" },
        { from: "A", to: "B", label: "b", style: { edgeAnchor: { x: 0, y: -150 } } },
        { from: "B", to: "A", label: "a", style: { edgeAnchor: { x: 0, y: +150 } } },
        { from: "B", to: "C", label: "b" },
        { from: "C", to: "C", label: "a,b" },
      ],
    });
    Object.values(dfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    dfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    GS.screen.addChild(dfa.graph);

    GS.showSubstringDFA2 = delay(0).then(
      ...Object.values(dfa.nodes).map(n => n.tweenPop(60)),
      ...dfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
    );

    const word = new Word("aaaaababba", { x: 2200, y: 1400 }, { pointer: { fill: orange } });
    word.wordCover.updateGraphic({ width: word.wordContainer.width * 1.2 + 180 });
    word.wordCover.position.set(word.wordCover.position.x - 80, word.wordCover.position.y);
    const pointer = new NodePointer(dfa, dfa.nodes.S, { fill: orange });
    word.word.slice(5).forEach(l => l.alpha = 0);
    GS.screen.addChild(word.wordCover);
    GS.screen.addChild(word.wordContainer);

    GS.showSubstringDFAWord2 = fade([word.wordContainer, word.wordPointer, word.wordCover, pointer]);


    const opts = {
      dontFlash: true,
      edgeColor: orange,
      wordColor: orange,
      wordColorPrev: orange,
    }
    GS.moveSubstringDFA2 = moveBetween('S', 'A', 60, dfa, pointer, word.wordPointer, word.word, { ...opts, resetCurWord: true })
      .then(moveBetween('A', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('A', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('A', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts))
      .then(moveBetween('A', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts))

    GS.showSubstring2 = delay(0).then(
      fade(word.word.slice(5)),
      new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        word.word.slice(5).forEach(l => {
          l.position.set(l.startPos.x, l.startPos.y - 100 * (1-v));
        });
      }, () => {
        word.word.slice(5).forEach(l => {
          l.startPos = { x: l.position.x, y: l.position.y };
        })
      }),
    )

    const opts2 = {
      dontFlash: true,
      edgeColor: green,
      wordColor: green,
      wordColorPrev: green,
    }
    GS.moveSubstringDFA2Combine = moveBetween('A', 'B', 60, dfa, pointer, word.wordPointer, word.word, { ...opts2, wordColorPrev: orange })
      .then(moveBetween('B', 'A', 60, dfa, pointer, word.wordPointer, word.word, opts2))
      .then(moveBetween('A', 'B', 60, dfa, pointer, word.wordPointer, word.word, opts2))
      .then(moveBetween('B', 'C', 60, dfa, pointer, word.wordPointer, word.word, opts2))
      .then(moveBetween('C', 'C', 60, dfa, pointer, word.wordPointer, word.word, opts2))

    GS.fadeSubstringDFA2 = delay(0).then(
      fade([dfa.graph, pointer, word.wordContainer, word.wordPointer, word.wordCover], false),
    );

    // Labelling
    const w = new PIXI.Text("w =", {...baseTextStyle, fill: blue});
    w.anchor.set(1, 0.5);
    w.position.set(GS.substringDFAWord1.wordContainer.position.x - GS.substringDFAWord1.wordContainer.width/2 - 50, GS.substringDFAWord1.wordContainer.position.y);
    console.log(w.position);
    w.alpha = 0;
    GS.screen.addChild(w);

    const v = new PIXI.Text("v =", {...baseTextStyle, fill: orange});
    v.anchor.set(1, 0.5);
    v.position.set(word.wordContainer.position.x - word.wordContainer.width/2 - 50, word.wordContainer.position.y);
    v.alpha = 0;
    GS.screen.addChild(v);

    const wx = new PIXI.Text("x", {...baseTextStyle, fill: green});
    wx.anchor.set(0, 0.5);
    wx.position.set(GS.substringDFAWord1.word[8].position.x, GS.substringDFAWord1.word[8].position.y - 200);
    wx.alpha = 0;
    GS.substringDFAWord1.wordContainer.addChild(wx);

    const wxLine = new PIXI.Graphics();
    const startC = GS.substringDFAWord1.word[6];
    const endC = GS.substringDFAWord1.word[10];
    wxLine.rect(
      startC.position.x, startC.position.y - startC.height - 5,
      endC.position.x - startC.position.x + endC.width, 10,
    );
    wxLine.fill(green);
    wxLine.alpha = 0;
    GS.substringDFAWord1.wordContainer.addChild(wxLine);

    const vx = new PIXI.Text("x", {...baseTextStyle, fill: green});
    vx.anchor.set(0, 0.5);
    vx.position.set(word.word[7].position.x, word.word[7].position.y - 200);
    vx.alpha = 0;
    word.wordContainer.addChild(vx);

    const vxLine = new PIXI.Graphics();
    const startV = word.word[5];
    const endV = word.word[9];
    vxLine.rect(
      startV.position.x, startV.position.y - startV.height - 5,
      endV.position.x - startV.position.x + endV.width, 10,
    );
    vxLine.fill(green);
    vxLine.alpha = 0;
    word.wordContainer.addChild(vxLine);

    GS.showSubstringLabels = fade([w, v, wx, wxLine, vx, vxLine]);
    GS.hideSubstringLabels = fade([w, v, wx, wxLine, vx, vxLine], false);
  }

  // Show prefix equivalent definition box.
  {
    const content = `<div class="definitionBlock">
      <h3>Prefix-equivalence</h3>
      Two words $w$ and $v$ are ${highlight('prefix-equivalent', 'blue', true, true)}
      if for any word $x$, $w + x$ is accepted if and only if $v + x$ is accepted.
    </div>`;
    const element = document.createElement('div');
    element.innerHTML = content;
    element.style.position = 'fixed';
    element.style.top = '50%';
    element.style.left = '50%';
    element.style.transform = 'translate(-50%, -50%)';

    element.style.opacity = 0;
    document.body.appendChild(element);

    MathJax.typeset([element]);

    GS.showPrefixEquivalent = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      element.style.opacity = v;
    });
    GS.fadePrefixEquivalent = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      element.style.opacity = v;
    });
  }

  // Show physics word area, with some connections.
  {
    const physicsArea = new PhysicsArea({
      outerPush: {
        type: 'rectangle',
        width: 3000,
        height: 1500,
        x: 2000,
        y: 1200,
        force: 4,
      }
    });
    GS.screen.addChild(physicsArea);
    GS.physicsArea = physicsArea;
    const words = [
      "a",
      "b",
      "ab",
      "ba",
      "bbb",
      "aaa",
      "bba",
      "abb",
      "aab",
      "abab",
      "aa",
    ].map((word, i) => {
      const w = new Word(word, { x: 0, y: 0 }, {});
      const container = new PIXI.Container();
      container.addChild(w.wordCover);
      container.addChild(w.wordContainer);
      w.wordCover.alpha = 1;
      w.wordContainer.alpha = 1;
      container.type = 'rectangle';
      container.outerWidth = container.width + 50;
      container.outerHeight = container.height + 50;
      container.position.set(400 + 3200 * Math.random(), 200 + 2000 * Math.random());
      const drawnBorder = new PIXI.Graphics();
      drawnBorder.rect(-container.outerWidth/2, -container.outerHeight/2, container.outerWidth, container.outerHeight).stroke({ color: black, width: 5 });
      // Enable for hitboxes.
      drawnBorder.alpha = 0;
      container.addChild(drawnBorder);
      container.pullRelationships = [];
      // Make it a fake node.
      container.label = word;
      container.style = { radius: 0 };
      container.word = word;
      // physicsArea.addPhysicsChild(container);
      return container;
    });
    GS.words = words;
    const findWord = (label) => words.find(w => w.label === label);
    GS.findWord = findWord;
    const baseEdgeStyle = {
      maxLineDist: 15,
      stroke: {
        color: blue,
      },
      arrow: { position: 'middle' },
    }
    const edges = [
      AbstractEdge.decide(findWord('a'), findWord('ba'), { ...baseEdgeStyle, customEdgeAnchorDist: 120, edgeAnchor: {x:0, y:0} }),
      AbstractEdge.decide(findWord('a'), findWord('aaa'), { ...baseEdgeStyle }),
      AbstractEdge.decide(findWord('bba'), findWord('aaa'), { ...baseEdgeStyle }),
      AbstractEdge.decide(findWord('bba'), findWord('bba'), { ...baseEdgeStyle }),
      AbstractEdge.decide(findWord('ba'), findWord('a'), { ...baseEdgeStyle, customEdgeAnchorDist: 120, edgeAnchor: {x:0, y:0} }),
      AbstractEdge.decide(findWord('b'), findWord('bbb'), { ...baseEdgeStyle }),
      AbstractEdge.decide(findWord('abb'), findWord('abb'), { ...baseEdgeStyle, loopOffset: { x: 0, y: -200 } }),
      AbstractEdge.decide(findWord('ab'), findWord('ab'), { ...baseEdgeStyle, loopOffset: { x: 0, y: -200 } }),
      AbstractEdge.decide(findWord('abab'), findWord('ab'), { ...baseEdgeStyle, loopOffset: { x: 0, y: -200 } }),
    ]
    GS.edges = edges;
    GS.thirdPhaseFirstGenEdges = [
      AbstractEdge.decide(findWord('a'), findWord('bba'), { ...baseEdgeStyle, stroke: { color: darkPurple }, arrow: false }),
      AbstractEdge.decide(findWord('aaa'), findWord('ba'), { ...baseEdgeStyle, stroke: { color: darkPurple }, arrow: false }),
    ]
    GS.thirdPhaseSecondGenEdges = [
      AbstractEdge.decide(findWord('bba'), findWord('ba'), { ...baseEdgeStyle, stroke: { color: darkPurple }, arrow: false }),
    ]
    GS.mergeEdgeFirst = [
      AbstractEdge.decide(findWord('a'), findWord('aa'), { ...baseEdgeStyle, arrow: false }),
    ]
    GS.mergeEdgeSecond = [
      AbstractEdge.decide(findWord('aa'), findWord('aaa'), { ...baseEdgeStyle, arrow: false }),
      AbstractEdge.decide(findWord('aa'), findWord('bba'), { ...baseEdgeStyle, arrow: false }),
      AbstractEdge.decide(findWord('aa'), findWord('ba'), { ...baseEdgeStyle, arrow: false }),
    ]
    GS.findEdge = (from, to) => edges.find(e => e.from.label === from && e.to.label === to);
    GS.physicsEdges = edges;
    physicsArea.start();
    app.ticker.add(() => {
      edges.concat(GS.thirdPhaseFirstGenEdges, GS.thirdPhaseSecondGenEdges, GS.mergeEdgeFirst, GS.mergeEdgeSecond).forEach(e => {
        const dist = e.style.customEdgeAnchorDist ?? 0;
        if (dist > 0) {
          const vec = vectorCombine(e.to.position, negate(e.from.position));
          const mag = magnitude(vec);
          const norm = rotate(vec, Math.PI/2);
          e.style.edgeAnchor = multiply(norm, dist / mag);
        }
        e.updateGraphic()
      });

    })
    const physicsContainer = new PIXI.Container();
    GS.physicsContainer = physicsContainer;
    physicsContainer.alpha = 0;
    GS.screen.addChild(physicsContainer);
    GS.addPullRels = (edgeList) => edgeList.forEach(e => {
      if (e.from.label !== e.to.label) {
        e.from.pullRelationships.push({
          container: e.to,
          minDist: 320,
          maxDist: 800,
          mult: 2,
        });
        e.to.pullRelationships.push({
          container: e.from,
          minDist: 320,
          maxDist: 800,
          mult: 2,
        });
      }
      physicsContainer.addChildAt(e.graphic, 0)
    });
    GS.addPullRels(edges);
    words.forEach(w => {
      physicsContainer.addChild(w);
    });

    GS.showPhysics = () => fade(physicsContainer);
    GS.hidePhysics = () => fade(physicsContainer, false);
  }

  // Temporarily hide area, show single node with self loop in first third of page
  GS.rulesContainer = new PIXI.Container();
  GS.rulesContainer.alpha = 0;
  GS.screen.addChild(GS.rulesContainer);
  GS.showRules = () => fade(GS.rulesContainer);
  GS.hideRules = () => fade(GS.rulesContainer, false);
  {
    const fakeNode = { position: { x: 1000, y: 1200 }, label: 'w', style: { radius: 0 } };
    const edge = AbstractEdge.decide(fakeNode, fakeNode, { stroke: { color: blue }, arrow: { position: 'middle' }, loopOffset: { x: 0, y: -250 } });
    edge.drawnAmount = 0;
    edge.updateGraphic();
    GS.rulesContainer.addChild(edge.graphic);

    const word = new Word("w", fakeNode.position);
    GS.rulesContainer.addChild(word.wordCover);
    GS.rulesContainer.addChild(word.wordContainer);
    word.wordCover.alpha = 0;
    word.wordContainer.alpha = 0;

    GS.showFirstRule = delay(0).then(
      GS.showRules(),
      fade([word.wordCover, word.wordContainer]),
    )

    GS.firstRuleDrawEdge = edge.growEdgeTween(60, easings.easeInOutQuad);
  }

  // Go back to physics area and remove loop edges
  {
    GS.firstRuleRemoveLoops = delay(0).then(
      ...GS.physicsEdges.filter(e => e.from.label === e.to.label).map(e => fade(e.graphic, false)),
    )
  }

  // Temporarily hide area, show one edge becoming 2 edges and merging into a bidirectional edge in middle third of page
  {
    const fakeNode1 = { position: { x: 1700, y: 1200 }, label: 'w', style: { radius: 0 } };
    const fakeNode2 = { position: { x: 2300, y: 1200 }, label: 'v', style: { radius: 0 } };
    const edge1 = AbstractEdge.decide(fakeNode1, fakeNode2, { stroke: { color: blue }, arrow: { position: 'middle' }, edgeAnchor: { x: 0, y: -150 } });
    const edge2 = AbstractEdge.decide(fakeNode2, fakeNode1, { stroke: { color: darkPurple }, arrow: { position: 'middle' }, edgeAnchor: { x: 0, y: 150 } });
    const edge3 = AbstractEdge.decide(fakeNode1, fakeNode2, { stroke: { color: blue }, arrow: false });
    edge1.drawnAmount = 0;
    edge2.drawnAmount = 0;
    edge3.drawnAmount = 1;
    edge3.graphic.alpha = 0;
    edge1.updateGraphic();
    edge2.updateGraphic();
    edge3.updateGraphic();
    GS.rulesContainer.addChild(edge1.graphic);
    GS.rulesContainer.addChild(edge2.graphic);
    GS.rulesContainer.addChild(edge3.graphic);

    const word1 = new Word("w", fakeNode1.position);
    const word2 = new Word("v", fakeNode2.position);
    word1.wordCover.alpha = 0;
    word1.wordContainer.alpha = 0;
    word2.wordCover.alpha = 0;
    word2.wordContainer.alpha = 0;
    GS.rulesContainer.addChild(word1.wordCover);
    GS.rulesContainer.addChild(word1.wordContainer);
    GS.rulesContainer.addChild(word2.wordCover);
    GS.rulesContainer.addChild(word2.wordContainer);

    GS.showSecondRule = delay(0).then(
      GS.showRules(),
      fade([word1.wordCover, word1.wordContainer, word2.wordCover, word2.wordContainer]),
    )
    GS.secondRuleDrawEdges = delay(0).then(
      edge1.growEdgeTween(60, easings.easeInOutQuad),
      delay(120).then(edge2.growEdgeTween(60, easings.easeInOutQuad)),
    )
    GS.secondRuleCombineEdges = delay(0).then(
      new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        edge1.style.edgeAnchor = { x: 0, y: -150 * (1-v) };
        edge1.updateGraphic();
        edge2.style.edgeAnchor = { x: 0, y: 150 * (1-v) };
        edge2.updateGraphic();
      }),
      delay(50).then(new ValueTween(0, 1, 10, easings.easeInOutQuad, (v) => {
        edge1.graphic.alpha = 1 - v;
        edge2.graphic.alpha = 1 - v;
        edge3.graphic.alpha = v;
      })),
      edge2.colorEdgeTween(blue, 60, GS.easings.easeInOutQuad),
    )
  }

  // Go back to physics are and hide arrows + merge double edges
  {
    GS.secondRuleCombinePhysicsEdges = delay(0).then(
      new ValueTween(120, 0, 60, easings.easeInOutQuad, (v) => {
        GS.findEdge('a', 'ba').style.customEdgeAnchorDist = v;
        GS.findEdge('ba', 'a').style.customEdgeAnchorDist = v;
      }),
      delay(30).then(
        new ValueTween(0, 1, 30, easings.easeInOutQuad, (v) => {
          GS.physicsEdges.forEach(e => e.arrowGraphic.alpha = 1 - v);
        }),
      ),
      delay(50).then(
        new ValueTween(0, 1, 10, easings.easeInOutQuad, (v) => {
          GS.findEdge('ba', 'a').graphic.alpha = 1 - v;
        }),
      )
    )
  }

  // Temporarily hide area, show 3 nodes with the triangle relationship (draw A->C) in the last third of the page
  // Show w+x->v+x->u+x.
  {
    const fakeNode1 = { position: { x: 2700, y: 1000 }, label: 'x', style: { radius: 0 } };
    const fakeNode2 = { position: { x: 2700, y: 1400 }, label: 'y', style: { radius: 0 } };
    const fakeNode3 = { position: { x: 3300, y: 1400 }, label: 'z', style: { radius: 0 } };
    const edge1 = AbstractEdge.decide(fakeNode1, fakeNode2, { stroke: { color: blue }, arrow: { position: 'middle' } });
    const edge2 = AbstractEdge.decide(fakeNode2, fakeNode3, { stroke: { color: blue }, arrow: { position: 'middle' } });
    const edge3 = AbstractEdge.decide(fakeNode1, fakeNode3, { stroke: { color: darkPurple }, arrow: { position: 'middle' } });
    edge1.drawnAmount = 0;
    edge2.drawnAmount = 0;
    edge3.drawnAmount = 0;
    edge1.updateGraphic();
    edge2.updateGraphic();
    edge3.updateGraphic();
    GS.rulesContainer.addChild(edge1.graphic);
    GS.rulesContainer.addChild(edge2.graphic);
    GS.rulesContainer.addChild(edge3.graphic);

    const word1 = new Word("w", fakeNode1.position);
    const word2 = new Word("v", fakeNode2.position);
    const word3 = new Word("u", fakeNode3.position);
    word1.wordCover.alpha = 0;
    word1.wordContainer.alpha = 0;
    word2.wordCover.alpha = 0;
    word2.wordContainer.alpha = 0;
    word3.wordCover.alpha = 0;
    word3.wordContainer.alpha = 0;
    GS.rulesContainer.addChild(word1.wordCover);
    GS.rulesContainer.addChild(word1.wordContainer);
    GS.rulesContainer.addChild(word2.wordCover);
    GS.rulesContainer.addChild(word2.wordContainer);
    GS.rulesContainer.addChild(word3.wordCover);
    GS.rulesContainer.addChild(word3.wordContainer);

    GS.showThirdRule = delay(0).then(
      GS.showRules(),
      fade([word1.wordCover, word1.wordContainer, word2.wordCover, word2.wordContainer, word3.wordCover, word3.wordContainer]),
    )

    GS.showThirdInitialEdges = delay(0).then(
      edge1.growEdgeTween(60, easings.easeInOutQuad),
      delay(120).then(edge2.growEdgeTween(60, easings.easeInOutQuad)),
    )

    GS.showFinalEdge = delay(0).then(
      edge3.growEdgeTween(60, easings.easeInOutQuad),
    )

    const wx1 = new PIXI.Text("w + x accepted", baseTextStyle);
    const wx2 = new PIXI.Text("v + x accepted", baseTextStyle);
    const wx3 = new PIXI.Text("u + x accepted", baseTextStyle);
    wx1.anchor.set(0.5, 0.5);
    wx2.anchor.set(0.5, 0.5);
    wx3.anchor.set(0.5, 0.5);
    const cover = new RectangleCover(wx1, {
      width: 1000,
      height: 1700,
      randMult: 0.05,
      points: 20,
    })
    cover.position.set(1900, 1200);
    wx1.position.set(1900, 600);
    wx2.position.set(1900, 1200);
    wx3.position.set(1900, 1800);
    cover.alpha = 0;
    wx1.alpha = 0;
    wx2.alpha = 0;
    wx3.alpha = 0;
    GS.rulesContainer.addChild(cover);
    GS.rulesContainer.addChild(wx1);
    GS.rulesContainer.addChild(wx2);
    GS.rulesContainer.addChild(wx3);

    const wx1wx2Line = AbstractEdge.decide(
      { position: { x: 1900, y: 600 }, label: "w1", style: { radius: 125 } },
      { position: { x: 1900, y: 1200 }, label: "w2", style: { radius: 125 } },
      { toRadius: true },
    )

    const wx2wx3Line = AbstractEdge.decide(
      { position: { x: 1900, y: 1200 }, label: "w2", style: { radius: 125 } },
      { position: { x: 1900, y: 1800 }, label: "w3", style: { radius: 125 } },
      { toRadius: true },
    )
    wx1wx2Line.drawnAmount = 0;
    wx2wx3Line.drawnAmount = 0;
    wx1wx2Line.updateGraphic();
    wx2wx3Line.updateGraphic();
    GS.rulesContainer.addChild(wx1wx2Line.graphic);
    GS.rulesContainer.addChild(wx2wx3Line.graphic);

    GS.showCoverAndW1 = fade([wx1, cover]);
    GS.showW2 = fade(wx2);
    const { L, C, h } = color_to_lch(blue);
    const highlightBlue = lch_to_color({ L: L+0.2, C, h })
    GS.showW2Edge = delay(0).then(
      wx1wx2Line.growEdgeTween(60, easings.easeInOutQuad),
      edge1.colorEdgeTween(highlightBlue, 60, flashEasing())
    )
    GS.showW3 = fade(wx3);
    GS.showW3Edge = delay(0).then(
      wx2wx3Line.growEdgeTween(60, easings.easeInOutQuad),
      edge2.colorEdgeTween(highlightBlue, 60, flashEasing())
    )

  }

  // Go back to physics area, and one by one merge triangles (Do for every triplet of relationships and repeatedly apply the rule)
  {
    GS.showThirdPhaseFirstGenEdges = delay(0).then(
      new ImmediateTween(() => GS.thirdPhaseFirstGenEdges.forEach(e => {GS.physicsContainer.addChildAt(e.graphic, 0)})),
      ...GS.thirdPhaseFirstGenEdges.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
    );
    GS.recolorThirdPhaseFirstGenEdges = delay(0).then(
      ...GS.thirdPhaseFirstGenEdges.map(e => e.colorEdgeTween(blue, 30, easings.easeInOutQuad)),
    );

    GS.showThirdPhaseSecondGenEdges = delay(0).then(
      new ImmediateTween(() => GS.thirdPhaseSecondGenEdges.forEach(e => {GS.physicsContainer.addChildAt(e.graphic, 0)})),
      ...GS.thirdPhaseSecondGenEdges.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
    );
    GS.recolorThirdPhaseSecondGenEdges = delay(0).then(
      ...GS.thirdPhaseSecondGenEdges.map(e => e.colorEdgeTween(blue, 30, easings.easeInOutQuad)),
    );
  }

  // Place circles into globs, fade the globs and remove the edge physics constraints
  {
    const wordGroups = {
      "A": ["a", "ba", "aaa", "bba"],
      "B": ["b", "bbb"],
      "C": ["ab", "abab"],
      "D": ["aab"],
      "E": ["abb"],
      "F": ["aa"],
    }

    // Stop doing physics on the outer edges.
    const globPoints = {};
    Object.keys(wordGroups).forEach((key, i) => {
      const words = wordGroups[key];
      const avgWordPos = multiply(words.map(w => GS.findWord(w).position).reduce((acc, pos) => vectorCombine(acc, pos), { x: 0, y: 0 }), 1/words.length);
      const radius = { 1: 250, 2: 380, 4: 700}[words.length];
      const physicsArea = new PhysicsArea({
        outerPush: {
          type: 'circle',
          radius,
          ...avgWordPos,
          force: 4,
        },
        defaultChildRadius: 30,
      });
      words.map(w => GS.findWord(w)).forEach(n => {
        physicsArea.addPhysicsChild(n);
        n.globKey = key;
      });
      GS.screen.addChild(physicsArea);
      physicsArea.start();
      globPoints[key] = {
        position: {...avgWordPos},
        color: rainbow(360 * i / Object.keys(wordGroups).length),
        radius,
        physicsArea,
      }
    });
    const globs = new Globs(globPoints, {
      physicsBound: {
        type: 'rectangle',
        width: 3800,
        height: 2200,
        x: 2000,
        y: 1200,
        force: 4,
      }
    });
    GS.physicsContainer.addChild(globs);
    globs.alpha = 0;
    GS.globs = globs;
    GS.globs.start();

    const stopPhysics = () => {
      GS.physicsArea.pause();
      // Remove pull relationships
      Object.values(wordGroups).flat().forEach(w => {
        const node = GS.findWord(w);
        node.pullRelationships = [];
      });
    }

    GS.showGlobs = delay(0).then(
      new ImmediateTween(stopPhysics),
      fade(globs),
    )

    GS.mergeGlob = delay(0).then(
      // Done in immediate tweens since the globs don't exist yet.
      new ImmediateTween(() => {
        GS.mergeEdgeFirst.forEach(e => {
          GS.physicsContainer.addChildAt(e.graphic, 0);
        });
      }),
      ...GS.mergeEdgeFirst.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
      delay(120).then(
        new ImmediateTween(() => {
          GS.mergeEdgeSecond.forEach(e => {
            GS.physicsContainer.addChildAt(e.graphic, 0);
          });
        }),
        ...GS.mergeEdgeSecond.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
        delay(60).then(new ImmediateTween(() => {
          GS.globs.combineGlobs("A", "F");
        }), delay(60))
      ),

    )
  }

  // Swap words in globs for states
  {
    const stateGroups = {
      "A+F": ["S", "A", "T"],
      "B": ["B"],
      "C": ["C", "F"],
      "D": ["D"],
      "E": ["E"],
    };
    GS.initStates = delay(0).then(
      new ImmediateTween(() => {
        Object.keys(stateGroups).forEach((key, i) => {
          const pos = GS.globs.points[key].physicsArea.style.outerPush;
          const physicsArea = new PhysicsArea({
            outerPush: {
              ...GS.globs.points[key].physicsArea.style.outerPush,
            },
            defaultChildRadius: 140,
          });
          const states = stateGroups[key].map(v => {
            const n = new Node(v, pos, { radius: 120 });
            n.graphic.alpha = 0;
            GS.physicsContainer.addChild(n.graphic);
            physicsArea.addPhysicsChild(n.graphic);
            n.globKey = key;
            return n;
          });
          physicsArea.start();
          GS.globs.points[key].physicsArea = physicsArea;
          TweenManager.add(new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
            states.forEach(n => n.graphic.alpha = v);
          }));
        });
      }),
      fade([
        ...GS.words,
        ...GS.edges.map(e => e.graphic),
        ...GS.thirdPhaseFirstGenEdges.map(e => e.graphic),
        ...GS.thirdPhaseSecondGenEdges.map(e => e.graphic),
        ...GS.mergeEdgeFirst.map(e => e.graphic),
        ...GS.mergeEdgeSecond.map(e => e.graphic),
      ], false),
    );
  }

  // Show the DFA for second character 'a'.
  {
    const dfa = new DFA();
    GS.secondADFA = dfa;
    dfa.import({
      states: [
        { name: "S", position: { x: 1100, y: 400 }, starting: true, accepting: true },
        { name: "A", position: { x: 500, y: 1000 } },
        { name: "B", position: { x: 1700, y: 1000 } },
        { name: "C", position: { x: 500, y: 1900 }, accepting: true },
        { name: "D", position: { x: 1700, y: 1900 } },
      ],
      transitions: [
        { from: "S", to: "A", label: "a" },
        { from: "S", to: "B", label: "b" },
        { from: "A", to: "C", label: "a" },
        { from: "B", to: "C", label: "a", style: { labelRatio: 0.3 } },
        { from: "A", to: "D", label: "b", style: { labelRatio: 0.3 } },
        { from: "B", to: "D", label: "b", style: { edgeAnchor: { x: -5, y: -5 }} },
        { from: "C", to: "C", label: "a, b", style: { loopOffset: { x: -150, y: -150 } } },
        { from: "D", to: "D", label: "a, b", style: { loopOffset: { x: 150, y: -150 } }},
      ],
    });

    Object.values(dfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    dfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    GS.screen.addChild(dfa.graph);

    GS.showSecondADFA = delay(0).then(
      ...Object.values(dfa.nodes).map(n => n.tweenPop(60)),
      ...dfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
    );

    GS.fadeSecondDFA = delay(0).then(
      fade(dfa.graph, false),
    );
  }

  // Show 5 globs, highlight each glob in turn (half the page, still show DFA)
  {
    const wordGroups = {
      "S": ["ε"],
      "A": ["a"],
      "B": ["b"],
      "C": ["aa", "ba", "baa"],
      "D": ["ab", "bb", "bbb"],
    }
    GS.secondGlobContainer = new PIXI.Container();
    const globPoints = {};
    Object.keys(GS.secondADFA.nodes).forEach((key, i) => {
      const radius = "CD".includes(key) ? 380 : 200;
      const pos = {
        x: GS.secondADFA.nodes[key].position.x + 1800,
        y: GS.secondADFA.nodes[key].position.y,
      };
      const physicsArea = new PhysicsArea({
        outerPush: {
          type: 'circle',
          radius,
          ...pos,
          force: 4,
        },
        defaultChildRadius: 140,
      });
      const words = wordGroups[key].map((word, i) => {
        const w = new Word(word, { x: 0, y: 0 }, {});
        const container = new PIXI.Container();
        container.addChild(w.wordCover);
        container.addChild(w.wordContainer);
        w.wordCover.alpha = 1;
        w.wordContainer.alpha = 1;
        container.type = 'rectangle';
        container.outerWidth = container.width + 50;
        container.outerHeight = container.height + 50;
        container.position.set(pos.x + Math.random(), pos.y + Math.random());
        physicsArea.addPhysicsChild(container);
        container.globKey = key;
        container.word = word;
        container.label = word;
        GS.secondGlobContainer.addChild(container);
        return container;
      });
      physicsArea.start();
      globPoints[key] = {
        position: {...pos},
        color: rainbow(360 * i / Object.keys(GS.secondADFA.nodes).length),
        radius,
        physicsArea,
        words,
      }
    });
    GS.secondGlob = new Globs(globPoints, {
      physicsBound: {
        type: 'rectangle',
        width: 3000,
        height: 2400,
        x: 2500,
        y: 1200,
        force: 4,
      },
      extraPhysics: {
        frictionVelocity: 0,
      }
    });
    GS.secondGlobContainer.addChild(GS.secondGlob);
    GS.secondGlobContainer.alpha = 0;
    GS.screen.addChild(GS.secondGlobContainer);
    GS.secondGlob.start();

    GS.showSecondGlob = delay(0).then(
      fade(GS.secondGlobContainer),
    );
    GS.hideSecondGlob = fade(GS.secondGlobContainer, false);
  }

  // Highlight the a and b globs, merge them
  {
    const edge = AbstractEdge.decide(GS.secondGlob.points.A.words[0], GS.secondGlob.points.B.words[0], { stroke: { color: blue }, arrow: null });
    edge.drawnAmount = 0;
    edge.updateGraphic();
    GS.secondGlobContainer.addChildAt(edge.graphic, 0);
    app.ticker.add(() => {
      edge.updateGraphic();
    });

    GS.drawABEdge = delay(0).then(
      edge.growEdgeTween(60, easings.easeInOutQuad),
    );

    GS.mergeABGlob = delay(0).then(
      new ImmediateTween(() => {
        GS.secondGlob.combineGlobs("A", "B", 300, average_color([GS.secondGlob.points.A.color, GS.secondGlob.points.B.color]));
      }),
    )
  }

  // Merge the DFA states and edges.
  {
    GS.moveSecondDFA = delay(0).then(
      new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        GS.secondADFA.nodes.A.moveTo(interpValue({ x: 500, y: 1000 }, { x: 1100, y: 1000 }, v));
        GS.secondADFA.nodes.B.moveTo(interpValue({ x: 1700, y: 1000 }, { x: 1100, y: 1000 }, v));
        GS.secondADFA.edges.forEach(e => e.updateGraphic());
      }),
      delay(50).then(
        fade(GS.secondADFA.edges.filter(e => (
          e.from.label === 'B' && e.to.label === 'C' ||
          e.from.label === 'A' && e.to.label === 'D' ||
          e.from.label === 'S' && e.to.label === 'A'
        )).map(e=>e.graphic), false, 10),
        new ImmediateTween(() => {
          const e = GS.secondADFA.edges.find(e => e.from.label === 'S' && e.to.label === 'B');
          e.style.edgeLabel = 'a,b';
          e.updateGraphic();
        }),
        fade([GS.secondADFA.nodes.B.graphic, GS.secondADFA.nodes.B.separatedGraphic], false, 10),
      )
    )
  }

  // Fade out, back to globs, add some words to each glob.
  {
    GS.rulesGlobContainer = new PIXI.Container();
    GS.rulesGlobContainer.alpha = 0;
    GS.screen.addChild(GS.rulesGlobContainer);
    GS.rulesWords = [];
    const globPoints = {};
    const wordGroups = {
      "A": {
        words: ["a", "ba", "aaa", "bba", "aa"],
        radius: 600,
        color: rainbow(360 * 0 / 4),
        position: { x: 2200, y: 1000 },
      },
      "B": {
        words: ["b", "bb", "ε"],
        radius: 420,
        color: rainbow(360 * 1 / 4),
        position: { x: 3300, y: 800 },
      },
      "C": {
        words: ["ab", "aab", "abab"],
        radius: 450,
        color: rainbow(360 * 2 / 4),
        position: { x: 600, y: 1500 },
      },
      "D": {
        words: ["abb"],
        radius: 250,
        color: rainbow(360 * 3 / 4),
        position: { x: 3300, y: 2000 },
      },
    };
    Object.entries(wordGroups).forEach(([key, { words, radius, color, position }], i) => {
      const physicsArea = new PhysicsArea({
        outerPush: {
          type: 'circle',
          radius,
          ...position,
          force: 4,
        },
        defaultChildRadius: 140,
      });
      const wordGraphics = words.map((word, i) => {
        const container = new PIXI.Container();
        const w = new Word(word, { x: 0, y: 0 }, {});
        container.addChild(w.wordCover);
        container.addChild(w.wordContainer);
        w.wordCover.alpha = 1;
        w.wordContainer.alpha = 1;
        container.type = 'rectangle';
        container.outerWidth = container.width + 50;
        container.outerHeight = container.height + 50;
        container.position.set(position.x, position.y);
        container.word = word;
        container.label = word;
        physicsArea.addPhysicsChild(container);
        GS.rulesGlobContainer.addChild(container);
        GS.rulesWords.push(container);
        return container;
      });
      physicsArea.start();
      globPoints[key] = {
        position,
        color,
        radius,
        physicsArea,
      }
    });

    GS.rulesGlob = new Globs(globPoints, {
      physicsBound: {
        type: 'rectangle',
        width: 4000,
        height: 2200,
        x: 2000,
        y: 1200,
        force: 4,
      },
      extraPhysics: {
        frictionVelocity: 0,
      }
    });
    GS.rulesGlobContainer.addChild(GS.rulesGlob);
    GS.rulesGlob.start();

    GS.showRulesGlob = delay(0).then(
      fade(GS.rulesGlobContainer),
    );

    GS.hideRulesGlob = fade(GS.rulesGlobContainer, false);
  }

  // Fade in overlay with white rules
  {
    const overlayBGHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: black; z-index: 1000; opacity: 0;">
    </div>`;
    const ruleHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; display: flex; justify-content: space-evenly; align-items: center; flex-direction: column; color: white; font-size: xx-large; opacity: 0;">
      <div id="rule1">1: If $w$ and $v$ are in the same glob, they are either both accepted or both rejected.</div>
      <div id="rule2">2: If $w$ and $v$ are in the same glob, then $w+x$ and $v+x$ are in the same glob.</div>
    </div>`

    const div = document.createElement('div');
    div.innerHTML = overlayBGHTML + ruleHTML;
    document.body.appendChild(div);
    const overlay = div.children[0];
    const rule = div.children[1];
    MathJax.typeset([rule]);

    GS.showRule = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.6;
      rule.style.opacity = v;
    });
    GS.hideRule = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.6;
      rule.style.opacity = v;
    });
  }

  // w, v prefix-equivalent -> w=w+epsilon accepts iff. v=v+epsilon accepts.
  {
    const standardDefinition = document.createElement('div');
    standardDefinition.innerHTML = `<div class="definitionBlock">
      <h3>Prefix-equivalence</h3>
      Two words $w$ and $v$ are ${highlight('prefix-equivalent', 'blue', true, true)}
      if for any word $x$, $w + x$ is accepted if and only if $v + x$ is accepted.
    </div>`;
    standardDefinition.style.position = 'fixed';
    standardDefinition.style.top = '50%';
    standardDefinition.style.left = '50%';
    standardDefinition.style.transform = 'translate(-50%, -50%)';
    standardDefinition.style.zIndex = 1010;

    standardDefinition.style.opacity = 0;
    document.body.appendChild(standardDefinition);

    const epsilonSub = document.createElement('div');
    epsilonSub.innerHTML = `<div class="definitionBlock">
      <h3>Prefix-equivalence</h3>
      Two words $w$ and $v$ are ${highlight('prefix-equivalent', 'blue', true, true)}
      if for any word $x$, $w + \\epsilon$ is accepted if and only if $v + \\epsilon$ is accepted.
    </div>`;
    epsilonSub.style.position = 'fixed';
    epsilonSub.style.top = '50%';
    epsilonSub.style.left = '50%';
    epsilonSub.style.transform = 'translate(-50%, -50%)';
    epsilonSub.style.zIndex = 1011;

    epsilonSub.style.opacity = 0;
    document.body.appendChild(epsilonSub);

    MathJax.typeset([standardDefinition, epsilonSub]);

    GS.showStandardDefinition = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      standardDefinition.style.opacity = v;
    });
    GS.showEpsilonDefinition = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      epsilonSub.style.opacity = v;
    });
    GS.hideEpsilonDefinition = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      epsilonSub.style.opacity = v;
      standardDefinition.style.opacity = v;
    });

  }

  // w + (x + y) accepts iff. v + (x + y) accepts. -> w + x is prefix equivalent to v + x.
  {
    const box1 = document.createElement('div');
    box1.innerHTML = `<div class="definitionBlock">
      <h3>$w$ and $v$ are prefix-equivalent</h3>
      For any word $x$, $w$ + ${wrapColour('green', '$x$')} is accepted if and only if $v$ + ${wrapColour('green', '$x$')} is accepted.
    </div>`;
    box1.style.position = 'fixed';
    box1.style.top = '30%';
    box1.style.left = '50%';
    box1.style.width = '75%';
    box1.style.transform = 'translate(-50%, -50%)';
    box1.style.zIndex = 1010;

    box1.style.opacity = 0;
    document.body.appendChild(box1);

    const box1Replace = document.createElement('div');
    box1Replace.innerHTML = `<div class="definitionBlock">
      <h3>$w$ and $v$ are prefix-equivalent</h3>
      For any word $x$, $w$ + ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')} is accepted if and only if $v$ + ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')} is accepted.
    </div>`;
    box1Replace.style.position = 'fixed';
    box1Replace.style.top = '30%';
    box1Replace.style.left = '50%';
    box1Replace.style.width = '75%';
    box1Replace.style.transform = 'translate(-50%, -50%)';
    box1Replace.style.zIndex = 1010;

    box1Replace.style.opacity = 0;
    document.body.appendChild(box1Replace);

    const box2 = document.createElement('div');
    box2.innerHTML = `<div class="definitionBlock">
      <h3>$w$ + ${wrapColour('orange', '$x$')} and $v$ + ${wrapColour('orange', '$x$')} are prefix-equivalent</h3>
      For any word ${wrapColour('orange', '$y$')}, $w$ + ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')} is accepted if and only if $v$ + ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')} is accepted.
    </div>`;
    box2.style.position = 'fixed';
    box2.style.top = '70%';
    box2.style.left = '50%';
    box2.style.width = '75%';
    box2.style.transform = 'translate(-50%, -50%)';
    box2.style.zIndex = 1010;

    box2.style.opacity = 0;
    document.body.appendChild(box2);

    const box3 = document.createElement('div');
    box3.innerHTML = `<div class="definitionBlock">
      ${wrapColour('green', '$x$')} = ${wrapColour('orange', '$x$')} + ${wrapColour('orange', '$y$')}
    </div>`;
    box3.style.position = 'fixed';
    box3.style.top = '50%';
    box3.style.left = '50%';
    box3.style.transform = 'translate(-50%, -50%)';
    box3.style.zIndex = 1010;

    box3.style.opacity = 0;
    document.body.appendChild(box3);

    const tick1 = document.createElement('span');
    tick1.classList.add('checkmark');
    tick1.style.position = 'fixed';
    tick1.style.top = 'calc(30% - 20px)';
    tick1.style.left = '73%';
    tick1.style.transform = 'translate(-50%, -50%) rotate(45deg)';
    tick1.style.zIndex = 1015;
    tick1.style.opacity = 0;
    document.body.appendChild(tick1);

    const tick2 = document.createElement('span');
    tick2.classList.add('checkmark');
    tick2.style.position = 'fixed';
    tick2.style.top = 'calc(70% - 20px)';
    tick2.style.left = '73%';
    tick2.style.transform = 'translate(-50%, -50%) rotate(45deg)';
    tick2.style.zIndex = 1015;
    tick2.style.opacity = 0;
    document.body.appendChild(tick2);

    MathJax.typeset([box1, box2, box3, box1Replace]);

    GS.showTwoBoxes = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      box1.style.opacity = v;
      box2.style.opacity = v;
    });
    GS.showThirdBox = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      box3.style.opacity = v;
    });
    GS.showFirstBoxTick = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      tick1.style.opacity = v;
    });
    GS.showSecondBoxTick = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      tick2.style.opacity = v;
    });
    GS.showReplacementBox = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      box1Replace.style.opacity = v;
    }, undefined, () => {
      box1.style.opacity = 0;
    });
    GS.hideAllBoxStuff = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      box2.style.opacity = v;
      box3.style.opacity = v;
      tick1.style.opacity = v;
      tick2.style.opacity = v;
      box1Replace.style.opacity = v;
    });
  }

  // Fade out overlay

  // Double border around some globs.
  {
    const BCol = color_to_lch(GS.rulesGlob.points.B.color);
    const DCol = color_to_lch(GS.rulesGlob.points.D.color);
    GS.rulesGlob.points.B.doubleBorderColor = lch_to_color({ L: BCol.L - 0.2, C: BCol.C, h: BCol.h });
    GS.rulesGlob.points.D.doubleBorderColor = lch_to_color({ L: DCol.L - 0.2, C: DCol.C, h: DCol.h });
    GS.doubleBorderGlobs = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      GS.rulesGlob.points.D.doubleBorderAlpha = v;
    })
    GS.entryGlobs = delay(0).then(
      new ImmediateTween(() => {
        const { L, C, h } = color_to_lch(GS.rulesGlob.points.B.color);
        const color = lch_to_color({ L: L - 0.2, C, h });
        const node = new Node('', GS.rulesGlob.points.B.position, {
          radius: GS.rulesGlob.points.B.radius,
          stroke: color,
          isEntry: true
        });
        node.entry.alpha = 0;
        node.circle.alpha = 0;
        node.labelText.alpha = 0;
        GS.rulesGlobContainer.addChild(node.graphic);
        TweenManager.add(fade(node.entry))
      }),
      delay(60)
    )
  }

  // Fade in edges between individual words
  {
    const findWordRule = (label) => GS.rulesWords.find(w => w.word === label);
    const edges = [
      AbstractEdge.decide(findWordRule('ε'), findWordRule('a'), { stroke: { color: blue }, arrow: { position: 'middle' } }),
      AbstractEdge.decide(findWordRule('b'), findWordRule('ba'), { stroke: { color: blue }, arrow: { position: 'middle' } }),
      AbstractEdge.decide(findWordRule('bb'), findWordRule('bba'), { stroke: { color: blue }, arrow: { position: 'middle' } }),
    ];
    edges.forEach(e => e.drawnAmount = 0);

    const otherEdges = [
      AbstractEdge.decide(findWordRule('ε'), findWordRule('b'), { stroke: { color: orange }, arrow: { position: 'middle' } }),
      AbstractEdge.decide(findWordRule('b'), findWordRule('bb'), { stroke: { color: orange }, arrow: { position: 'middle' } }),
    ]
    otherEdges.forEach(e => e.drawnAmount = 0);

    GS.rulesGlobContainer.addChildAt(edges[0].graphic, 0);
    GS.rulesGlobContainer.addChildAt(edges[1].graphic, 0);
    GS.rulesGlobContainer.addChildAt(edges[2].graphic, 0);
    GS.rulesGlobContainer.addChildAt(otherEdges[0].graphic, 0);
    GS.rulesGlobContainer.addChildAt(otherEdges[1].graphic, 0);
    GS.app.ticker.add(() => {
      edges.forEach(e => e.updateGraphic());
      otherEdges.forEach(e => e.updateGraphic());
    });

    GS.showRulesWordEdges = delay(0).then(
      ...edges.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
    );
    GS.showRulesWordEdgesB = delay(0).then(
      ...otherEdges.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
    );
    GS.fadeRulesWordEdges = delay(0).then(
      ...edges.map(e => fade(e.graphic, false)),
    );
    GS.fadeRulesWordEdgesB = delay(0).then(
      ...otherEdges.map(e => fade(e.graphic, false)),
    );
  }

  // Merge edges into a single edge, fade in glob edge.
  {
    const globEdges = [
      { from: "A", to: "A", label: "a", style: { loopOffset: { x: 0, y: -250 } } },
      { from: "A", to: "C", label: "b", style: { edgeAnchor: { x: 0, y: -200 }, anchorOffsetMult: 0.5 } },
      { from: "B", to: "A", label: "a"},
      { from: "B", to: "B", label: "b", style: { loopOffset: { x: 0, y: -200 } }},
      { from: "C", to: "A", label: "a", style: { edgeAnchor: { x: 30, y: 200 }, anchorOffsetMult: 0.5 }},
      { from: "C", to: "D", label: "b", style: { edgeAnchor: { x: -40, y: 150 } }},
      { from: "D", to: "D", label: "a, b"},
    ].map(({ from, to, label, style }) => {
      GS.rulesGlob.points[from].label = from;
      GS.rulesGlob.points[from].style = { radius: GS.rulesGlob.points[from].radius };
      GS.rulesGlob.points[to].label = to;
      GS.rulesGlob.points[to].style = { radius: GS.rulesGlob.points[to].radius };
      const e = AbstractEdge.decide(GS.rulesGlob.points[from], GS.rulesGlob.points[to], { arrow: { position: 'end' }, edgeLabel: label, toRadius: true, ...style });
      e.drawnAmount = 0;
      e.labelBG.alpha = 1;
      e.updateGraphic();
      GS.rulesGlobContainer.addChildAt(e.graphic, 0);
      return e;
    });
    GS.app.ticker.add(() => {
      globEdges.forEach(e => e.updateGraphic());
    });

    GS.showRulesGlobEdges = delay(0).then(
      ...globEdges.map(e => e.growEdgeTween(60, easings.easeInOutQuad)),
      ...globEdges.map(e => e.showLabelTween(60, easings.easeInOutQuad)),
    );
  }

  // Show the DFA for second character 'a' again, draw a transparent ellipse around the merged states.
  {
    GS.thirdDFA = new DFA();
    GS.thirdDFA.import({
      states: [
        { name: "S", position: { x: 1000, y: 1200 }, starting: true, accepting: true },
        { name: "A", position: { x: 2000, y: 800 } },
        { name: "B", position: { x: 2000, y: 1600 } },
        { name: "C", position: { x: 3000, y: 800 }, accepting: true },
        { name: "D", position: { x: 3000, y: 1600 } },
      ],
      transitions: [
        { from: "S", to: "A", label: "a" },
        { from: "S", to: "B", label: "b" },
        { from: "A", to: "C", label: "a" },
        { from: "B", to: "C", label: "a", style: { labelRatio: 0.3 } },
        { from: "A", to: "D", label: "b", style: { labelRatio: 0.3 } },
        { from: "B", to: "D", label: "b" },
        { from: "C", to: "C", label: "a, b", style: { loopOffset: { x: 0, y: -220 } } },
        { from: "D", to: "D", label: "a, b", style: { loopOffset: { x: 0, y: -220 } }},
      ],
    });

    Object.values(GS.thirdDFA.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    GS.thirdDFA.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });

    GS.screen.addChild(GS.thirdDFA.graph);

    GS.showThirdDFA = delay(0).then(
      ...Object.values(GS.thirdDFA.nodes).map(n => n.tweenPop(60)),
      ...GS.thirdDFA.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      ),
    );

    const ellipse = new PIXI.Graphics();
    ellipse.ellipse(2000, 1200, 300, 750).stroke({ color: red, width: 10 }).fill(red.setAlpha(0.3));
    ellipse.alpha = 0;
    GS.screen.addChild(ellipse);

    GS.showEllipse = fade(ellipse);

    GS.fadeThirdDFA = delay(0).then(
      fade([GS.thirdDFA.graph, ellipse], false),
    );

  }

  // Fade in the minimisation algorithm scene
  const minimContainer = new PIXI.Container();
  GS.screen.addChild(minimContainer);
  minimContainer.alpha = 0;
  const minimApp = Screen.fakeApp(minimContainer, 4000, 2400);
  minimApp.ticker = GS.app.ticker;
  minimiseTasks[0].table.rows[0].starting = true;
  minimiseTasks[0].table.rows[6].starting = false;
  minimiseTasks[0].table.graph.states[0].starting = true;
  minimiseTasks[0].table.graph.states[4].starting = false;
  DFAMinimisation.loader(minimApp, GS.easings, () => {}, () => {}, {...minimiseTasks[0], hideBG: true, progress: null, hideButtons: true, drawEdges: true, globOpts: { radiusGrowthExponent: 1.5 } });
  MinimGS.allEdges.forEach(e => {e.drawnAmount = 0; e.updateGraphic()})
  GS.toggleSelection = (x) => new ImmediateTween(() => toggleSelection(x));
  MinimGS.dfa.graph.transitions.forEach(e => e.style = {...e.style, maxLineDist: 10});
  {
    GS.showMinim = fade(minimContainer);
  }

  // Split the accepting states
  {
    GS.splitAccepting = delay(0).then(
      GS.toggleSelection(6),
      GS.toggleSelection(7),
      delay(90).then(
        new ImmediateTween(() => {onSplit()})
      )
    )

  }

  // Highlight two states in the glob, and draw their edges to other globs
  // Highlight the two rows in the table, and highlight the transition cell
  // Highlight and select all states with the same colour, split
  {
    GS.highlightMinimStates = new ValueTween(bg_dark, yellow, 60, easings.easeInOutQuad, (v) => {
      MinimGS.globNodes.B.style.fill = v;
      MinimGS.globNodes.C.style.fill = v;
      MinimGS.globNodes.B.updateGraphic();
      MinimGS.globNodes.C.updateGraphic();
    })

    GS.drawMinimEdges = delay(0).then(
      MinimGS.findEdge('B', 'b').growEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('C', 'b').growEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('B', 'b').showLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('C', 'b').showLabelTween(60, easings.easeInOutQuad),
    )

    GS.drawOtherMinimEdges = delay(0).then(
      MinimGS.findEdge('A', 'b').growEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('D', 'b').growEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('E', 'b').growEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('A', 'b').showLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('D', 'b').showLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('E', 'b').showLabelTween(60, easings.easeInOutQuad),
      new ValueTween(yellow, bg_dark, 60, easings.easeInOutQuad, (v) => {
        MinimGS.globNodes.B.style.fill = v;
        MinimGS.globNodes.C.style.fill = v;
        MinimGS.globNodes.B.position = MinimGS.globNodes.B.graphic.position
        MinimGS.globNodes.C.position = MinimGS.globNodes.C.graphic.position
        MinimGS.globNodes.B.updateGraphic();
        MinimGS.globNodes.C.updateGraphic();
      }),
    )

    for (let i=1; i<=7; i++) {
      for (let j=1; j<=2; j++) {
        const container = MinimGS.table.getContainer(i, j);
        container.highlightBG = new PIXI.Graphics()
          .rect(-container.width/2 + 5, -container.height/2 + 5, container.width - 10, container.height - 10)
          .fill(yellow)
        container.highlightBG.alpha = 0;
        container.addChildAt(container.highlightBG, 1);
      }
    }
    GS.highlightMinimCell = (i, j) => new ValueTween(0, 0.8, 60, easings.easeInOutQuad, (v) => {
      const container = MinimGS.table.getContainer(i, j);
      container.highlightBG.alpha = v;
    });
    GS.fadeHighlightMinimCell = (i, j) => new ValueTween(0.8, 0, 60, easings.easeInOutQuad, (v) => {
      const container = MinimGS.table.getContainer(i, j);
      container.highlightBG.alpha = v;
    });


    GS.fixMinimSelection = new ImmediateTween(() => {
      toggleSelection(2);
      toggleSelection(4);
    })

    GS.split = () => new ImmediateTween(() => {onSplit()});

    GS.hideMinimEdges = delay(0).then(
      MinimGS.findEdge('A', 'b').hideEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('A', 'b').hideLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('B', 'b').hideEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('B', 'b').hideLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('C', 'b').hideEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('C', 'b').hideLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('D', 'b').hideEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('D', 'b').hideLabelTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('E', 'b').hideEdgeTween(60, easings.easeInOutQuad),
      MinimGS.findEdge('E', 'b').hideLabelTween(60, easings.easeInOutQuad),
    )
  }

  // Repeat last 3 animations, with reducing verbosity (don't show edges, then don't highlight the pairing of states)

  // Flash the DFA Minimisation Algorithm definition box.
  {
    const overlayBGHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: black; z-index: 1000; opacity: 0;">
    </div>`;
    const defnHTML = `<div style="position: absolute; top: 50%; left: 65%; width: 50%; z-index: 1002; opacity: 0; transform: translate(-50%, -50%);">
      <div class="definitionBlock" style="position: relative">
        <div id="extra" style="color: ${red.toHex()}; position: absolute; right: 20px; top: 10px; background: url(/img/backgrounds/soft-paper.jpg); padding: 10px; transform: translateX(120px) rotate(30deg); opacity: 0;">But remove unreachable states!</div>
        <h3>DFA Minimisation Algorithm</h3>
        <ol>
          <li>Start with a DFA, in tabular form.</li>
          <li>Colour the ${wrapColour('green', 'accepting')} and ${wrapColour('red', 'non-accepting')} states two different colours.</li>
          <li>Repeat until no pairing exists:
            <ol>
              <li>Find a pairing of states ${wrapColour('purple', '$x$')} and ${wrapColour('purple', '$y$')} and a character $c$ such that ${wrapColour('purple', '$x$')} is the same colour as ${wrapColour('purple', '$y$')}, but the $c$ transition for ${wrapColour('purple', '$x$')} leads to a different colour than the $c$ transition for ${wrapColour('purple', '$y$')}.</li>
              <li>Choose a ${wrapColour('orange', 'new colour')}</li>
              <li>Colour ${wrapColour('orange', '$y$')}, as well as all other states which are currently the same colour as ${wrapColour('purple', '$x$')} and whose $c$ transition is the same colour as ${wrapColour('orange', '$y$')}'s.</li>
            </ol>
          </li>
          <li>Each colour is a state in the new DFA.</li>
          <li>To read off the transitions for a state, copy the transitions from any state in the original DFA with that colour, replacing the individual end states with the colour they have.
        </ol>
      </div>
    </div>`
    const div = document.createElement('div');
    div.innerHTML = overlayBGHTML + defnHTML;
    document.body.appendChild(div);
    MathJax.typeset([div]);
    const overlay = div.children[0];
    const defn = div.children[1];
    const extra = document.getElementById('extra');
    GS.showDefn = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      defn.style.opacity = v;
      overlay.style.opacity = v * 0.4;
    });
    GS.hideDefn = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      defn.style.opacity = v;
      overlay.style.opacity = v * 0.4;
    });
    GS.showExtra = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      extra.style.opacity = v;
    });
  }

  // Just show the final DFA floating around.

  // But wait! Some of the nodes are unreachable!

  // Fade out the G and B globs, plus the edges from them.
  {
    GS.hideMinimGlobUnused = () => delay(0).then(
      new ImmediateTween(() => {
        // Needs to be wrapped because checkEdges gets set after `check` is called.
        Object.keys(MinimGS.glob.points).forEach(key => MinimGS.glob.points[key].alpha = 1);
        TweenManager.add(fade(
          [
            ...MinimGS.checkEdges.filter(e => e.from.label === 'B' || e.from.label === 'G').map(e => e.graphic),
            MinimGS.glob.points.B,
            MinimGS.glob.points.G,
            MinimGS.globNodes.B.graphic,
            MinimGS.globNodes.G.graphic,
          ], false))
      }),
      delay(60)
    )
  }

  TweenManager.add(delay(120)
    .then(GS.drawAll3)
    .then(delay(60))
    .then(GS.highlightLoops)
    .then(delay(60))
    .then(GS.showProperties())
    .then(delay(60))
    .then(GS.hideProperties())
    .then(delay(60))
    .then(GS.fadeAll3)
    .then(delay(60))
    .then(GS.showExampleDFA)
    .then(GS.showExampleWordAndPointer)
    .then(delay(60))
    .then(GS.moveWordTwice)
    .then(delay(60))
    .then(GS.swapWords)
    .then(delay(60))
    .then(GS.showExampleQuestions)
    .then(delay(60))
    .then(GS.moveWordThrice)
    .then(delay(60))
    .then(GS.fadeExample)
    .then(delay(60))
    .then(GS.showSubstringDFA1)
    .then(delay(60))
    .then(GS.showSubstringDFAWord1)
    .then(delay(60))
    .then(GS.moveSubstringDFA1)
    .then(delay(60))
    .then(GS.showSubstringDFA2)
    .then(delay(60))
    .then(GS.showSubstringDFAWord2)
    .then(delay(60))
    .then(GS.moveSubstringDFA2)
    .then(delay(60))
    .then(
      GS.showSubstring1,
      GS.showSubstring2,
      GS.showSubstringLabels,
    )
    .then(delay(60))
    .then(
      GS.moveSubstringDFA1Combine,
      GS.moveSubstringDFA2Combine
    )
    .then(delay(60))
    .then(
      GS.fadeSubstringDFA1,
      GS.fadeSubstringDFA2,
      GS.hideSubstringLabels,
    )
    .then(delay(60))
    .then(GS.showPrefixEquivalent)
    .then(delay(60))
    .then(GS.fadePrefixEquivalent)
    .then(delay(60))
    .then(GS.showPhysics())
    .then(delay(12.25*60))
    .then(GS.hidePhysics(), GS.showFirstRule)
    .then(delay(60))
    .then(GS.firstRuleDrawEdge)
    .then(GS.hideRules(), GS.showPhysics())
    .then(delay(120))
    .then(GS.firstRuleRemoveLoops)
    .then(delay(90))
    .then(GS.hidePhysics(), GS.showSecondRule)
    .then(delay(60))
    .then(GS.secondRuleDrawEdges)
    .then(delay(60))
    .then(GS.secondRuleCombineEdges)
    .then(delay(60))
    .then(GS.hideRules(), GS.showPhysics())
    .then(delay(60))
    .then(GS.secondRuleCombinePhysicsEdges)
    .then(delay(4*60))
    .then(GS.hidePhysics(), GS.showThirdRule)
    .then(delay(60))
    .then(GS.showThirdInitialEdges)
    .then(delay(60))
    .then(GS.showFinalEdge)
    .then(delay(60))
    .then(GS.showCoverAndW1)
    .then(delay(60))
    .then(GS.showW2)
    .then(delay(60))
    .then(GS.showW2Edge)
    .then(delay(60))
    .then(GS.showW3)
    .then(delay(60))
    .then(GS.showW3Edge)
    .then(delay(60))
    .then(GS.hideRules(), GS.showPhysics())
    .then(delay(2.8 * 60))
    .then(GS.showThirdPhaseFirstGenEdges)
    .then(delay(15))
    .then(GS.recolorThirdPhaseFirstGenEdges)
    .then(GS.showThirdPhaseSecondGenEdges)
    .then(delay(15))
    .then(GS.recolorThirdPhaseSecondGenEdges)
    .then(delay(240))
    .then(GS.showGlobs)
    .then(delay(450 + 6 * 60))
    .then(GS.mergeGlob)
    .then(delay(10.2 * 60))
    .then(GS.initStates)
    .then(delay(18 * 60))
    .then(GS.hidePhysics())
    .then(delay(60))
    .then(GS.showSecondADFA)
    .then(delay(60))
    .then(GS.showSecondGlob)
    .then(delay(18 * 60))
    .then(GS.drawABEdge)
    .then(delay(9.5 * 60))
    .then(GS.mergeABGlob)
    .then(delay(120))
    .then(GS.moveSecondDFA)
    .then(delay(15 * 60))
    .then(GS.fadeSecondDFA, GS.hideSecondGlob)
    .then(delay(60))
    .then(GS.showRulesGlob)
    .then(delay(8.3 * 60))
    .then(GS.showRule())
    .then(delay(19 * 60))
    .then(GS.showStandardDefinition())
    .then(delay(60))
    .then(GS.showEpsilonDefinition())
    .then(delay(5 * 60))
    .then(GS.hideEpsilonDefinition())
    .then(delay(90))
    .then(GS.showTwoBoxes)
    .then(delay(7 * 60))
    .then(GS.showFirstBoxTick)
    .then(delay(6.5 * 60))
    .then(GS.showThirdBox)
    .then(delay(3 * 60))
    .then(GS.showReplacementBox)
    .then(delay(15 * 60))
    .then(GS.showSecondBoxTick)
    .then(delay(3 * 60))
    .then(GS.hideAllBoxStuff)
    .then(delay(60))
    .then(GS.hideRule())
    .then(delay(11 * 60))
    .then(GS.showRulesWordEdges)
    .then(delay(7 * 60))
    .then(GS.showRulesWordEdgesB)
    .then(delay(3 * 60))
    .then(GS.showRulesGlobEdges, GS.fadeRulesWordEdges, GS.fadeRulesWordEdgesB)
    .then(delay(8 * 60))
    .then(GS.entryGlobs)
    .then(delay(6.5 * 60))
    .then(GS.doubleBorderGlobs)
    .then(delay(10 * 60))
    .then(GS.hideRulesGlob)
    .then(delay(60))
    .then(GS.showThirdDFA)
    .then(delay(60))
    .then(GS.showEllipse)
    .then(delay(60))
    .then(GS.fadeThirdDFA)
    .then(delay(60))
    .then(GS.showMinim)
    .then(delay(8 * 60))
    .then(GS.showRule())
    .then(delay(2 * 60))
    .then(GS.hideRule())
    .then(delay(2 * 60))
    .then(GS.splitAccepting)
    .then(delay(16 * 60))
    .then(GS.highlightMinimStates)
    .then(delay(4 * 60))
    .then(GS.drawMinimEdges)
    .then(delay(4 * 60))
    .then(
      GS.toggleSelection(2),
      GS.toggleSelection(3),
      delay(60),
    )
    .then(delay(1.5 * 60))
    .then(
      GS.highlightMinimCell(2, 2),
      GS.highlightMinimCell(3, 2),
    )
    .then(delay(24 * 60))
    .then(
      GS.drawOtherMinimEdges,
      GS.fadeHighlightMinimCell(2, 2),
      GS.fadeHighlightMinimCell(3, 2),
    )
    .then(delay(60))
    .then(
      GS.toggleSelection(2),
      GS.toggleSelection(4),
      delay(60),
    )
    .then(delay(60))
    .then(GS.split())
    .then(delay(21 * 60))
    .then(
      GS.highlightMinimCell(1, 2),
      GS.highlightMinimCell(2, 2),
    )
    .then(delay(3.25 * 60))
    .then(
      GS.fadeHighlightMinimCell(1, 2),
      GS.fadeHighlightMinimCell(2, 2),
    )
    .then(delay(60))
    .then(
      GS.toggleSelection(1),
      GS.toggleSelection(5),
      delay(60),
    )
    .then(delay(60))
    .then(GS.split())
    .then(delay(4.2 * 60))
    .then(GS.hideMinimEdges)
    .then(delay(11 * 60))
    .then(
      GS.toggleSelection(6),
      delay(60),
    )
    .then(delay(60))
    .then(GS.split())
    .then(delay(7 * 60))
    .then(new ImmediateTween(() => check()))
    .then(delay(9.5 * 60))
    .then(GS.showDefn())
    .then(delay(38 * 60))
    .then(GS.hideDefn())
    .then(delay(24 * 60))
    .then(GS.hideMinimGlobUnused())
    .then(delay(60))
    .then(GS.showDefn())
    .then(delay(3 * 60))
    .then(GS.showExtra())
  )
  // The 4 physics scenes (why did I make them so loong)

  // TweenManager.skipSeconds(310);

  // 3 Rules
  // TweenManager.skipSeconds(62);
  // Merge Example
  // TweenManager.skipSeconds(176);
  // Method 1
  // TweenManager.skipSeconds(225);
  // Method 2
  // TweenManager.skipSeconds(365);
}

const unloader = () => {}

export default { loader, unloader };
