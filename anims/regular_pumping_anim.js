import Screen from '../screen.js';
import DFA from '../dfa.js';
import NFA from '../nfa.js';
import { delay, fade, TweenManager, ValueTween, ImmediateTween, tweenFunction, interpValue } from '../tween.js';
import TextChanger from '../tools/change_text.js';
import { RectangleCover } from '../tools/paper_cover.js';
import { blue, black, darkPurple, green, orange, yellow, purple, bg_dark, red } from '../colours.js';
import nfaMatch from '../graphs/nfaMatch.js';
import DFAMinimisation, { check, GS as MinimGS, onSplit, toggleSelection } from "./dfa_minimise.js";
import { minimiseTasks } from "../content/dfa_minimise.js";
import word, { moveBetween, NodePointer, Word } from '../tools/word.js';
import { makeHighlight } from './regex_intro.js';
import RegularPumpingGame, { GS as GameGS, setI, setN, setSelection, setWord, startGame } from './regular_pumping_game.js';
import { highlight } from '../templates/colours.js';
import { DrawnBezier } from '../tools/drawnBezier.js';

const gsc = window.gameScaling ?? 1;

const GS = {};

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 128,
  fill: black,
  align: 'center',
};

const loader = (app, easings, onSuccess, onFailure, opts) => {

  GS.app = app;
  GS.opts = opts;
  GS.easings = easings;
  GS.screen = new Screen(app, true, false);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;

  // In the last page, we mentioned two properties of regular languages:

  // <ul>
  //   <li>Regular Languages have a finite number of states</li>
  //   <li>Regular Languages require looping to recognise words of a certain length</li>
  // </ul>

  // Show the three examples and loops again.
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

    GS.drawAll3 = () => delay(0).then(
      fade(nfa.graph, true, 0),
      drawNFA,
      delay(25).then(fade([regex, regexCover])),
      delay(50).then(drawDFA, fade(dfa.graph, true, 0)),
    );

    GS.redrawAll3 = () => delay(0).then(
      fade([dfa.graph, nfa.graph, regex, regexCover]),
    )

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

    GS.fadeAll3 = () => delay(0).then(
      fade([dfa.graph, nfa.graph, regex, regexCover], false),
    );

    GS.keepDFA = delay(0).then(
      fade([nfa.graph, regex, regexCover], false),
      new ValueTween({ x: 700, y: 600 }, { x: 2000, y: 1200 }, 60, easings.easeInOutQuad, (v) => dfa.graph.position.set(v.x, v.y)),
    );
  }

  {
    const overlayBGHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: black; z-index: 1000; opacity: 0;">
    </div>`;
    const ruleHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; display: flex; justify-content: space-evenly; align-items: center; flex-direction: column; color: white; font-size: xx-large; opacity: 0;">
      <div id="rule1">1: Regular Languages have a finite number of states (previous video).</div>
      <div id="rule2">2: Regular Languages require looping to recognise words of a certain length (this video).</div>
    </div>`

    const div = document.createElement('div');
    div.innerHTML = overlayBGHTML + ruleHTML;
    document.body.appendChild(div);
    const overlay = div.children[0];
    const rule = div.children[1];
    MathJax.typeset([rule]);

    GS.showOverlay = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.7;
    });

    GS.hideOverlay = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.7;
    });

    GS.showProperties = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.7;
      rule.style.opacity = v;
    });
    GS.hideProperties = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      overlay.style.opacity = v * 0.7;
      rule.style.opacity = v;
    });
  }

  // Previously, we covered the first property, and from that we were able to learn a lot about another way to view regular languages, as well as an algorithm for minimising our DFAs that we probably couldn't have come up with without that viewpoint.

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
    GS.showMinim = () => fade(minimContainer);
    GS.hideMinim = () => fade(minimContainer, false);

    GS.split1 = delay(0).then(
      GS.toggleSelection(6),
      GS.toggleSelection(7),
      delay(90).then(
        new ImmediateTween(() => {onSplit()})
      )
    )
    GS.split2 = delay(0).then(
      GS.toggleSelection(1),
      GS.toggleSelection(2),
      GS.toggleSelection(5),
      delay(90).then(
        new ImmediateTween(() => {onSplit()})
      )
    )
  }

  // On this page, we'll be scrutinising the second property, and we'll see what we can glean from it.

  // Back to the highlighted rules.

  // Just as with the first property, since our language is regular, we'll look at a DFA that recognises it, since this form is very well structured, and easy to prove things about.

  // Fade out rule, and fade out the regex/nfa.

  // <h3>What is this property, exactly?</h3>

  // For non-finite languages, DFAs need loops to recognise words of a certain length. But before we continue, let's drill down on exactly why this is, and what it implies.

  // Take any DFA (and therefore any regular language), and consider a word that is accepted by this DFA,
  // where the number of characters is at least the number of states in the DFA, $n$.

  // Anim: Fade in DFA, then word, with the first n characters coloured green.
  const dfaJSON = {
    states: [
      { name: "A", position: { x: -1000, y: -500 }, starting: true, accepting: true },
      { name: "B", position: { x: -1000, y: 500 } },
      { name: "C", position: { x: 0, y: -500 } },
      { name: "D", position: { x: 0, y: 500 } },
      { name: "E", position: { x: 1000, y: -500 } },
      { name: "F", position: { x: 1000, y: 500 } },
    ],
    transitions: [
      { from: "A", to: "B", label: "b", style: { edgeAnchor: { x: 150, y: 0 } } },
      { from: "B", to: "A", label: "b", style: { edgeAnchor: { x: -150, y: -10 } } },
      { from: "C", to: "D", label: "b", style: { edgeAnchor: { x: 150, y: 0 } } },
      { from: "D", to: "C", label: "b", style: { edgeAnchor: { x: -150, y: -10 } } },
      { from: "E", to: "F", label: "b", style: { edgeAnchor: { x: 150, y: 0 } } },
      { from: "F", to: "E", label: "b", style: { edgeAnchor: { x: -150, y: -10 } } },
      { from: "A", to: "C", label: "a" },
      { from: "C", to: "E", label: "a" },
      { from: "E", to: "A", label: "a", style: { edgeAnchor: { x: 0, y: -350 }} },
      { from: "B", to: "D", label: "a" },
      { from: "D", to: "F", label: "a" },
      { from: "F", to: "B", label: "a", style: { edgeAnchor: { x: 0, y: 450 }} },
    ],
  };
  {
    // 2000 * 1500 graph, 6 nodes.
    const dfa = new DFA();
    dfa.import(dfaJSON);
    Object.values(dfa.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
    });
    dfa.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    dfa.graph.position.set(2600, 1000);
    GS.actualDFA = dfa;
    GS.screen.addChild(dfa.graph);

    GS.showActualDFA = delay(0).then(
      ...Object.values(dfa.nodes).map(n => n.tweenPop(60)),
      delay(45).then(...dfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
        .during(e.growEdgeTween(60, easings.easeInOutQuad))
      )),
    );

    const word = new Word("babababbb", { x: 750, y: 500 });
    GS.screen.addChild(word.wordCover);
    GS.screen.addChild(word.wordContainer);
    GS.dfaWord = word;

    const graphPointer = new NodePointer(dfa, dfa.nodes['A']);

    GS.showWord = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      word.wordCover.alpha = v;
      word.wordContainer.alpha = v;
    });
    GS.colorWord = delay(0).then(
      ...word.word.slice(0, 6).map(c => new ValueTween(black, green, 60, easings.easeInOutQuad, (v) => {
        c.style.fill = v;
      })),
    )

    GS.showPointers = delay(0).then(
      fade([word.wordPointer, graphPointer])
    );

    GS.actualDFAMove = (l1, l2) => moveBetween(l1, l2, 60, dfa, graphPointer, word.wordPointer, word.word);

    GS.hideEverythingActualDFA = fade([
      dfa.graph,
      word.wordContainer,
      word.wordCover,
      word.wordPointer,
      graphPointer,
    ], false);
  }

  // Let's look at the path taken by this word on our DFA:

  {
    const baseStyle = { radius: 90 }
    const path = new DFA();
    GS.pathDFA = path;
    path.import({
      states: [
        { name: "1-A", position: { x: -1800, y: 0 }, style: baseStyle },
        { name: "2-B", position: { x: -1800 + 400 * 1, y: 0 }, style: baseStyle },
        { name: "3-D", position: { x: -1800 + 400 * 2, y: 0 }, style: baseStyle },
        { name: "4-C", position: { x: -1800 + 400 * 3, y: 0 }, style: baseStyle },
        { name: "5-E", position: { x: -1800 + 400 * 4, y: 0 }, style: baseStyle },
        { name: "6-F", position: { x: -1800 + 400 * 5, y: 0 }, style: baseStyle },
        { name: "7-B", position: { x: -1800 + 400 * 6, y: 0 }, style: baseStyle },
        { name: "8-A", position: { x: -1800 + 400 * 7, y: 0 }, style: baseStyle },
        { name: "9-B", position: { x: -1800 + 400 * 8, y: 0 }, style: baseStyle },
        { name: "10-A", position: { x: -1800 + 400 * 9, y: 0 }, style: baseStyle },
      ],
      transitions: [
        { from: "1-A", to: "2-B", label: "b" },
        { from: "2-B", to: "3-D", label: "a" },
        { from: "3-D", to: "4-C", label: "b" },
        { from: "4-C", to: "5-E", label: "a" },
        { from: "5-E", to: "6-F", label: "b" },
        { from: "6-F", to: "7-B", label: "a" },
        { from: "7-B", to: "8-A", label: "b" },
        { from: "8-A", to: "9-B", label: "b" },
        { from: "9-B", to: "10-A", label: "b" },
        { from: "2-B", to: "2-B", label: "y" },
      ],
    });
    Object.values(path.nodes).forEach(n => {
      n.graphic.alpha = 0;
      n.separatedGraphic.alpha = 0;
      n.actualLabel = n.label;
      n.label = n.label.split("-")[1];
      n.labelText.text = n.label;
      n.updateGraphic();
    });
    path.edges.forEach(e => {
      e.labelBG.alpha = 0;
      e.drawnAmount = 0;
      e.updateGraphic();
    });
    path.graph.position.set(2000, 2100);
    GS.screen.addChild(path.graph);

    const showEdge = (e) => e.showLabelTween(60, easings.easeInOutQuad).during(e.growEdgeTween(60, easings.easeInOutQuad));

    GS.showPath = delay(0).then(
      path.nodes["1-A"].tweenPop(60),
      delay(45).then(
        path.nodes["2-B"].tweenPop(60),
        showEdge(path.edges[0]),
        GS.actualDFAMove("A", "B"),
      ),
      delay(105).then(
        path.nodes["3-D"].tweenPop(60),
        showEdge(path.edges[1]),
        GS.actualDFAMove("B", "D"),
      ),
      delay(165).then(
        path.nodes["4-C"].tweenPop(60),
        showEdge(path.edges[2]),
        GS.actualDFAMove("D", "C"),
      ),
      delay(225).then(
        path.nodes["5-E"].tweenPop(60),
        showEdge(path.edges[3]),
        GS.actualDFAMove("C", "E"),
      ),
      delay(285).then(
        path.nodes["6-F"].tweenPop(60),
        showEdge(path.edges[4]),
        GS.actualDFAMove("E", "F"),
      ),
      delay(345).then(
        path.nodes["7-B"].tweenPop(60),
        showEdge(path.edges[5]),
        GS.actualDFAMove("F", "B"),
      ),
      delay(405).then(
        path.nodes["8-A"].tweenPop(60),
        showEdge(path.edges[6]),
        GS.actualDFAMove("B", "A"),
      ),
      delay(465).then(
        path.nodes["9-B"].tweenPop(60),
        showEdge(path.edges[7]),
        GS.actualDFAMove("A", "B"),
      ),
      delay(525).then(
        path.nodes["10-A"].tweenPop(60),
        showEdge(path.edges[8]),
        GS.actualDFAMove("B", "A"),
      ),
    )

    GS.hidePath = () => fade(path.graph, false);

    GS.reshowPath = fade(path.graph);

    GS.mergePath = delay(0).then(
      fade([
        path.nodes["3-D"].graphic,
        path.nodes["3-D"].separatedGraphic,
        path.nodes["4-C"].graphic,
        path.nodes["4-C"].separatedGraphic,
        path.nodes["5-E"].graphic,
        path.nodes["5-E"].separatedGraphic,
        path.nodes["6-F"].graphic,
        path.nodes["6-F"].separatedGraphic,
      ], false),
      ...path.edges.slice(1, 6).map(e => fade(e.graphic, false)),
      delay(30).then(
        new ValueTween({...path.nodes["2-B"].position}, {...path.nodes["7-B"].position}, 60, easings.easeInOutQuad, (v) => path.nodes["2-B"].moveTo(v)),
        tweenFunction(() => {
          path.edges[0].updateGraphic();
        }, 60),
        delay(45).then(fade([
          path.nodes["7-B"].graphic,
          path.nodes["7-B"].separatedGraphic,
        ], false, 15))
      )
    )

    GS.showLoop = showEdge(path.edges[9])
  }

  // Notice that in reading the first $n$ characters of the word, we will visit $n+1$ states (since we visit a state before reading any characters).
  // Therefore, there must be at least one state that is ${highlight('visited twice or more', 'purple', true, true)} in the first $n$ characters being read.

  // Anim: Highlight the repeated states purple, reset word
  {
    GS.highlightFirstNCharStates = delay(0).then(
      GS.pathDFA.nodes["1-A"].tweenColor(green, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["2-B"].tweenColor(green, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["3-D"].tweenColor(green, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["4-C"].tweenColor(green, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["5-E"].tweenColor(green, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["6-F"].tweenColor(green, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["7-B"].tweenColor(green, 60, easings.easeInOutQuad),
      ...GS.pathDFA.edges.slice(0, 6).map(e => e.colorEdgeTween(green, 60, easings.easeInOutQuad)),
      ...GS.dfaWord.word.slice(0, 6).map(c => new ValueTween(bg_dark, green, 60, easings.easeInOutQuad, (v) => {
        c.style.fill = v;
      })),
    )

    GS.highlightRepeatedState = delay(0).then(
      GS.pathDFA.nodes["2-B"].tweenColor(purple, 60, easings.easeInOutQuad),
      GS.pathDFA.nodes["7-B"].tweenColor(purple, 60, easings.easeInOutQuad),
    );
  }

  // This corresponds to some substring of the first $n$ characters in the word:

  // Anim: Highlight the repeated substring purple, in both the path and word.
  {
    const highlightBox = new PIXI.Graphics();
    highlightBox.rect(70, -GS.dfaWord.word[0].height - 5, 80*5, GS.dfaWord.word[0].height)
      .fill({ color: purple, alpha: 0.2 })
      .stroke({ color: purple, alpha: 0.8, width: 5 });
    highlightBox.alpha = 0;
    GS.dfaWord.wordContainer.addChild(highlightBox);

    const cycleEdges = [
      ["B", "D"],
      ["D", "C"],
      ["C", "E"],
      ["E", "F"],
      ["F", "B"],
    ].map(([from, to]) => GS.actualDFA.edges.find(e => e.from.label === from && e.to.label === to));

    GS.highlightPath = delay(0).then(
      ...GS.pathDFA.edges.slice(1, 6).map(e => e.colorEdgeTween(purple, 60, easings.easeInOutQuad, true)),
      fade(highlightBox),
      ...cycleEdges.map(e => e.colorEdgeTween(purple, 60, easings.easeInOutQuad)),
    )
  }

  // which goes from ${addIcon('b')} to ${addIcon('b')}, and so knowing such a path exists as part of our word allows us to generate an infinite family of words that also must be in the language.

  // If we split our original word into three parts, ${highlight('$x$', 'green', true)} being the string before our loop, ${highlight('$y$', 'purple', true)} being the loop itself, and ${highlight('$z$', 'orange', true)} being the string after the loop,
  // then we can generate words in the language by starting with $x$, repeating some amount of $y$ strings, and then capping it off with a $z$ string.

  {
    const xStr = new TextChanger("b", { text: { fill: green } });
    const yStr = new TextChanger("ababa", { text: { fill: purple } });
    const zStr = new TextChanger("bbb", { text: { fill: orange } });
    xStr.position.set(300, 1200);
    yStr.position.set(750, 1200);
    zStr.position.set(1200, 1200);
    const xStrCover = new RectangleCover(xStr, { points: 20, randMult: 0.1 });
    const yStrCover = new RectangleCover(yStr, { points: 20, randMult: 0.1 });
    const zStrCover = new RectangleCover(zStr, { points: 20, randMult: 0.1 });
    xStrCover.position.set(300, 1200 + xStr.height/2);
    yStrCover.position.set(750, 1200 + yStr.height/2);
    zStrCover.position.set(1200, 1200 + zStr.height/2);
    xStrCover.alpha = 0;
    yStrCover.alpha = 0;
    zStrCover.alpha = 0;
    xStr.alpha = 0;
    yStr.alpha = 0;
    zStr.alpha = 0;
    GS.screen.addChild(xStrCover);
    GS.screen.addChild(yStrCover);
    GS.screen.addChild(zStrCover);
    GS.screen.addChild(xStr);
    GS.screen.addChild(yStr);
    GS.screen.addChild(zStr);

    const x = new TextChanger("x", {});
    const y = new TextChanger("y", {});
    const z = new TextChanger("z", {});
    x.position.set(300, 900);
    y.position.set(750, 900);
    z.position.set(1200, 900);
    x.alpha = 0;
    y.alpha = 0;
    z.alpha = 0;
    GS.screen.addChild(x);
    GS.screen.addChild(y);
    GS.screen.addChild(z);

    GS.showX = delay(0).then(
      fade(x),
      delay(15).then(fade([xStrCover, xStr])),
    )
    GS.showY = delay(0).then(
      fade(y),
      delay(15).then(fade([yStrCover, yStr])),
    )
    GS.showZ = delay(0).then(
      fade(z),
      delay(15).then(fade([zStrCover, zStr])),
    )

    const headerI = new TextChanger("i");
    const headerICover = new RectangleCover(headerI, { points: 20, randMult: 0.1 });
    headerI.position.set(1800, 300);
    headerICover.position.set(1800, 300 + headerI.height/2);
    headerI.alpha = 0;
    headerICover.alpha = 0;
    GS.screen.addChild(headerICover);
    GS.screen.addChild(headerI);

    const headerCombine = new TextChanger("xyiz", { transformOverwrites: { i: {
      width: 8 * gsc,
      yOffset: -5 * gsc,
      xOffset: 2 * gsc,
      scale: 0.8,
    }} });
    const headerCombineCover = new RectangleCover(headerCombine, { points: 20, randMult: 0.1 });
    headerCombine.position.set(3000, 300);
    headerCombineCover.position.set(3000, 300 + headerCombine.height/2);
    headerCombine.alpha = 0;
    headerCombineCover.alpha = 0;
    GS.screen.addChild(headerCombineCover);
    GS.screen.addChild(headerCombine);

    GS.showHeaders = fade([headerI, headerICover, headerCombine, headerCombineCover]);
    GS.hideHeaders = fade([headerI, headerICover, headerCombine, headerCombineCover], false);

    const iVal1 = new TextChanger("0");
    const iVal2 = new TextChanger("1");
    const iVal3 = new TextChanger("2");
    const iVal1Cover = new RectangleCover(iVal1, { points: 20, randMult: 0.1 });
    const iVal2Cover = new RectangleCover(iVal2, { points: 20, randMult: 0.1 });
    const iVal3Cover = new RectangleCover(iVal3, { points: 20, randMult: 0.1 });
    iVal1.position.set(1800, 800);
    iVal2.position.set(1800, 1400);
    iVal3.position.set(1800, 2000);
    iVal1Cover.position.set(1800, 800 + iVal1.height/2);
    iVal2Cover.position.set(1800, 1400 + iVal2.height/2);
    iVal3Cover.position.set(1800, 2000 + iVal3.height/2);
    iVal1.alpha = 0;
    iVal2.alpha = 0;
    iVal3.alpha = 0;
    iVal1Cover.alpha = 0;
    iVal2Cover.alpha = 0;
    iVal3Cover.alpha = 0;
    GS.screen.addChild(iVal1Cover);
    GS.screen.addChild(iVal2Cover);
    GS.screen.addChild(iVal3Cover);
    GS.screen.addChild(iVal1);
    GS.screen.addChild(iVal2);
    GS.screen.addChild(iVal3);

    GS.showIVals = delay(0).then(
      fade([iVal1, iVal1Cover]),
      delay(30).then(fade([iVal2, iVal2Cover])),
      delay(60).then(fade([iVal3, iVal3Cover])),
    );

    const word1 = new TextChanger("bbbb");
    const word2 = new TextChanger("babababbb");
    const word3 = new TextChanger("bababaabababbb");
    const word1Cover = new RectangleCover(word1, { points: 20, randMult: 0.1 });
    const word2Cover = new RectangleCover(word2, { points: 20, randMult: 0.1 });
    const word3Cover = new RectangleCover(word3, { points: 20, randMult: 0.1 });
    word1.position.set(3000, 800);
    word2.position.set(3000, 1400);
    word3.position.set(3000, 2000);
    word1Cover.position.set(3000, 800 + word1.height/2);
    word2Cover.position.set(3000, 1400 + word2.height/2);
    word3Cover.position.set(3000, 2000 + word3.height/2);
    word1.alpha = 0;
    word2.alpha = 0;
    word3.alpha = 0;
    word1Cover.alpha = 0;
    word2Cover.alpha = 0;
    word3Cover.alpha = 0;
    GS.screen.addChild(word1Cover);
    GS.screen.addChild(word2Cover);
    GS.screen.addChild(word3Cover);
    GS.screen.addChild(word1);
    GS.screen.addChild(word2);
    GS.screen.addChild(word3);

    const highlight11 = makeHighlight(word1, 0, 1, { color: green });
    const highlight12 = makeHighlight(word1, 1, 4, { color: orange });
    const highlight21 = makeHighlight(word2, 0, 1, { color: green });
    const highlight22 = makeHighlight(word2, 1, 6, { color: purple });
    const highlight23 = makeHighlight(word2, 6, 9, { color: orange });
    const highlight31 = makeHighlight(word3, 0, 1, { color: green });
    const highlight32 = makeHighlight(word3, 1, 6, { color: purple });
    const highlight33 = makeHighlight(word3, 6, 11, { color: purple });
    const highlight34 = makeHighlight(word3, 11, 14, { color: orange });


    GS.showWords = delay(0).then(
      fade([word1, word1Cover, highlight11, highlight12]),
      delay(30).then(fade([word2, word2Cover, highlight21, highlight22, highlight23])),
      delay(60).then(fade([word3, word3Cover, highlight31, highlight32, highlight33, highlight34])),
    );

    GS.hideAllWordStuff = fade([
      xStr, yStr, zStr, xStrCover, yStrCover, zStrCover,
      x, y, z,
      headerI, headerICover, headerCombine, headerCombineCover,
      iVal1, iVal2, iVal3, iVal1Cover, iVal2Cover, iVal3Cover,
      word1, word2, word3, word1Cover, word2Cover, word3Cover,
    ], false);
  }

  // This property, that we need to be able to find some repeatable string in the first $n$ characters, is surprisingly good at separating regular languages from many irregular languages.

  // Let's write out formally what we've just shown is true:

  // Anim: Fade in definition, and dark overlay.
  {
    const definitionHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; display: flex; justify-content: space-evenly; align-items: center; flex-direction: column; opacity: 0;">
      <div class="definitionBlock">
        <h3>Pumping Lemma for Regular Languages</h3>
        If $R$ is a regular language, then there exists some integer $n$ such that
        for all words $w$ accepted by $R$ with $|w| \\geq n$,
        there exists a partitioning of $w = xyz$ such that:
        <ul>
          <li>$|y| \\neq 0$</li>
          <li>$|xy| \\leq n$</li>
        </ul>
        and for all $i \\geq 0$, $xy^iz$ is accepted by $R$.
      </div>
    </div>`

    const div = document.createElement('div');
    div.innerHTML = definitionHTML;
    document.body.appendChild(div);
    const definition = div.children[0];
    MathJax.typeset([definition]);

    GS.showPumpingLemma = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      definition.style.opacity = v;
    });

    GS.hidePumpingLemma = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      definition.style.opacity = v;
    });

  }

  // <h3>The pumping game</h3>

  // Personally it helps me to think about this lemma as a game, played between two players as follows:

  // Anim: Show summary screen from pumping game.
  const pumpingOpts = {
    type: "Regular",
    dfa: dfaJSON,
    wordSelector: (n) => {
      const bs = Math.ceil(n / 5 * 2);
      const as = Math.ceil(n / 5 * 3);
      const word = "b".repeat(bs) + "a".repeat(as);
      return word;
    },
    description: "Even b's and a's divisible by 3.",
    n: 6,
  }

  const pumpingContainer = new PIXI.Container();
  GS.screen.addChild(pumpingContainer);
  pumpingContainer.alpha = 0;
  const pumpingApp = Screen.fakeApp(pumpingContainer, 4000, 2400);
  RegularPumpingGame.loader(pumpingApp, GS.easings, () => {}, () => {}, {...pumpingOpts, hideButtons: true, hideBG: true });
  {
    GameGS.player1CPU = false;
    GameGS.player2CPU = false;
    startGame();

    GS.showGame = delay(0).then(
      fade(pumpingContainer),
      new ImmediateTween(() => GameGS.showScreen("SUMMARY")),
      delay(90).then(new ImmediateTween(() => setN(6))),
    );

    GS.selectWord = delay(0).then(
      new ImmediateTween(() => setWord("babababbb"))
    );

    GS.selectPartition = delay(0).then(
      new ImmediateTween(() => setSelection(1, 6))
    );

    GS.selectI = delay(0).then(
      new ImmediateTween(() => setI(0))
    );

    const result = new TextChanger("xyiz = bbbb", { transformOverwrites: { i: {
      width: 8 * gsc,
      yOffset: -5 * gsc,
      xOffset: 2 * gsc,
      scale: 0.8,
    }} });
    const resultCover = new RectangleCover(result, { points: 20, randMult: 0.1 });
    result.position.set(2000, 1600);
    resultCover.position.set(2000, 1600 + result.height/2);
    result.alpha = 0;
    resultCover.alpha = 0;
    GS.screen.addChild(resultCover);
    GS.screen.addChild(result);

    GS.showResult = delay(0).then(
      fade([result, resultCover]),
    );

    GS.colorResult = result.colorText(green, 0, result.curText.length);

    GS.hideResult = fade([result, resultCover], false);

    GS.hideGame = fade(pumpingContainer, false);
  }

  // <ol>
  //   <li>A non-finite language is chosen between the two players</li>
  //   <li>Player 1 provides an integer, $n$</li>
  //   <li>Player 2 provides a word $w$ which is accepted by the language and whose length is at least $n$</li>
  //   <li>Player 1 provides a partitioning of $w$ into three parts $xyz$, where $xy$ has length at most $n$ and $y$ is non-empty</li>
  //   <li>Player 2 picks some non-negative integer $i$</li>
  //   <li>If $xy^iz$ is in the language, Player 1 wins. Otherwise Player 2 wins.</li>
  // </ol>

  // The pumping lemma essentially states that for regular languages, there is a strategy for Player 1 to always win this game,
  // and in the text before we described exactly what this strategy was:

  // <ul>
  //   <li>Our language is Regular, so it has a DFA that recognises it. Pick one.</li>
  //   <li>Choose $n$ equal to the number of states in our DFA.</li>
  //   <li>Player 2 then ${highlight('has to', 'green', true)} respond with a word that meets the same state twice in the first $n$ characters.</li>
  //   <li>Identify these states, and use this to partition the word into $xyz$</li>
  //   <li>Player 2 will respond with some $i$, but because $y$ represents a path from a state to itself, ${highlight('no matter what', 'green', true, true)}, the word will be accepted!</li>
  // </ul>

  {
    const dfa = new DFA();
    dfa.import(dfaJSON);
    dfa.graph.position.set(3300, 400);
    dfa.graph.scale.set(0.35);
    dfa.graph.alpha = 0;
    GS.screen.addChild(dfa.graph);

    GS.showMiniDFA = fade(dfa.graph);
    GS.hideMiniDFA = fade(dfa.graph, false);

    const nText = GameGS.nText;
    const nHighlight = new PIXI.Graphics();
    nHighlight.alpha = 0;
    GS.screen.addChild(nHighlight);

    const selectionText = GameGS.selectionText;
    const splitHighlight = new PIXI.Graphics();
    splitHighlight.alpha = 0;
    GS.screen.addChild(splitHighlight);

    GS.highlightN = delay(0).then(
      new ImmediateTween(() => {
        nHighlight
          .rect(600, 0, nText.width - 610, nText.height)
          .fill({ color: blue, alpha: 0.2 })
          .stroke({ color: blue, alpha: 0.8, width: 5 });
        nHighlight.position.set(nText.position.x, nText.position.y - nText.height/2);
      }),
      fade(nHighlight)
    )

    GS.highlightSplit = delay(0).then(
      new ImmediateTween(() => {
        splitHighlight
          .rect(1920, 0, selectionText.width - 2365, selectionText.height)
          .fill({ color: purple, alpha: 0.2 })
          .stroke({ color: purple, alpha: 0.8, width: 5 });
        splitHighlight.position.set(selectionText.position.x, selectionText.position.y - selectionText.height/2);
      }),
      fade(splitHighlight)
    );

    GS.hideHighlights = fade([nHighlight, splitHighlight], false);
  }

  // <h3>When it isn't true?</h3>

  // We've just shown a property that must hold true for Regular Languages. So if we wanted to show a language was ${highlight('not', 'red', true)} regular, we could prove the property is false! What does this imply?

  // Anim: Tree example you had thought of. - Show moves on the right (Player choose n, Player 2 chooses word).
  {
    class Circle extends PIXI.Graphics {
      constructor(radius, color) {
        super();
        this.radius = radius;
        this.color = color;
        this.lineStroke = black;
        this.lineWidth = 5;
        this.render();
      }

      render() {
        this.clear();
        this.circle(0, 0, this.radius)
        this.fill(this.color)
        this.stroke({ color: this.lineStroke, width: this.lineWidth})
      }

      changeColor(color, originalColor) {
        return new ValueTween(originalColor ?? this.color, color, 60, easings.easeInOutQuad, (v) => {
          this.color = v;
          this.render();
        });
      }

      highlightStroke() {
        return new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
          this.lineStroke = interpValue(black, red, v);
          this.lineWidth = interpValue(5, 10, v);
          this.render();
        });
      }
    }

    const tree = new PIXI.Container();
    const treeLines = new PIXI.Container();
    tree.addChild(treeLines);

    const circlesMap = {};
    const treeLinesMap = {};

    const treeJSON = {
      key: "C",
      color: blue,
      x: 0,
      children: [
        {
          key: "L",
          color: orange,
          x: -1000,
          children: [
            {
              key: "L",
              color: orange,
              x: -1200,
              children: [
                {
                  key: "L",
                  color: orange,
                  x: -1300,
                  children: [
                    {
                      key: "L",
                      color: blue,
                      x: -1500,
                    },
                    {
                      key: "R",
                      color: orange,
                      x: -1300,
                    }
                  ]
                },
                {
                  key: "R",
                  color: orange,
                  x: -1100,
                  children: [
                    {
                      key: "C",
                      color: orange,
                      x: -1100,
                    }
                  ]
                }
              ],
            },
            {
              key: "R",
              color: blue,
              x: -800,
              children: [{
                key: "C",
                color: blue,
                x: -800,
                children: [
                  {
                    key: "L",
                    color: blue,
                    x: -850,
                  },
                  {
                    key: "R",
                    color: blue,
                    x: -700,
                  }
                ]
              }]
            }
          ]
        },
        {
          key: "C",
          color: orange,
          x: 0,
          children: [
            {
              key: "L",
              color: blue,
              x: -400,
              children: [
                {
                  key: "L",
                  color: orange,
                  x: -450,
                  children: [
                    {
                      key: "L",
                      color: blue,
                      x: -550,
                    },
                    {
                      key: "R",
                      color: orange,
                      x: -400,
                    }
                  ]
                },
                {
                  key: "R",
                  color: blue,
                  x: -250,
                  children: [
                    {
                      key: "C",
                      color: blue,
                      x: -250,
                    }
                  ]
                }
              ]
            },
            {
              key: "C",
              color: orange,
              x: 0,
              children: [
                {
                  key: "L",
                  color: orange,
                  x: -100,
                  children: [{
                    key: "C",
                    color: orange,
                    x: -100,
                  }]
                },
                {
                  key: "R",
                  color: orange,
                  x: 200,
                  children: [
                    {
                      key: "L",
                      color: blue,
                      x: 50,
                    },
                    {
                      key: "R",
                      color: orange,
                      x: 200,
                    }
                  ]
                }
              ]
            },
            {
              key: "R",
              color: orange,
              x: 400,
              children: [
                {
                  key: "L",
                  color: orange,
                  x: 350,
                  children: [{
                    key: "C",
                    color: orange,
                    x: 350,
                  }]
                },
                {
                  key: "R",
                  color: orange,
                  x: 600,
                  children: [
                    {
                      key: "L",
                      color: blue,
                      x: 500,
                    },
                    {
                      key: "R",
                      color: orange,
                      x: 650,
                    },
                  ],
                }
              ]
            }
          ]
        },
        {
          key: "R",
          color: blue,
          x: 1000,
          children: [
            {
              key: "L",
              color: blue,
              x: 800,
              children: [{
                key: "C",
                color: blue,
                x: 800,
                children: [{
                  key: "C",
                  color: blue,
                  x: 800,
                }]
              }]
            },
            {
              key: "R",
              color: blue,
              x: 1225,
              children: [
                {
                  key: "L",
                  color: blue,
                  x: 1050,
                  children: [
                    {
                      key: "L",
                      color: blue,
                      x: 950,
                    },
                    {
                      key: "R",
                      color: blue,
                      x: 1150,
                    }
                  ]
                },
                {
                  key: "R",
                  color: orange,
                  x: 1400,
                  children: [
                    {
                      key: "L",
                      color: orange,
                      x: 1300,
                    },
                    {
                      key: "R",
                      color: blue,
                      x: 1500,
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }

    function createCircles(json, depth=0, curKey='') {
      const circle = new Circle(50, json.color);
      circle.position.set(json.x, depth * 450);
      circle.alpha = 0;
      tree.addChild(circle);
      circlesMap[curKey + json.key] = circle;
      if (json.children) {
        json.children.forEach(c => {
          const child = createCircles(c, depth + 1, curKey + json.key);
          const lineStyle = {
            stroke: {
              width: 10,
            },
            maxLineDist: 10,
            smoothScaling: 0.2,
            points: 5,
          }
          const line = new DrawnBezier(lineStyle, [
            {x: circle.x, y: circle.y},
            {x: child.x, y: child.y},
          ], 0);
          line.updateDrawnGraphic();
          treeLines.addChild(line);
          treeLinesMap[curKey + json.key + c.key] = line;
        });
      }
      return circle;
    }

    createCircles(treeJSON);
    tree.position.set(1600, 300);
    GS.screen.addChild(tree);

    const chooseN = new PIXI.Text({ text: "Choose n", style: {...baseStyle} });
    chooseN.position.set(3900, 525);
    chooseN.anchor.set(1, 0.5);
    chooseN.alpha = 0;

    const chooseWord = new PIXI.Text({ text: "Choose word", style: {...baseStyle} });
    chooseWord.position.set(3900, 975);
    chooseWord.anchor.set(1, 0.5);
    chooseWord.alpha = 0;

    const chooseSelection = new PIXI.Text({ text: "Choose partition", style: {...baseStyle} });
    chooseSelection.position.set(3900, 1425);
    chooseSelection.anchor.set(1, 0.5);
    chooseSelection.alpha = 0;

    const chooseI = new PIXI.Text({ text: "Choose i", style: {...baseStyle} });
    chooseI.position.set(3900, 1875);
    chooseI.anchor.set(1, 0.5);
    chooseI.alpha = 0;

    GS.screen.addChild(chooseN);
    GS.screen.addChild(chooseWord);
    GS.screen.addChild(chooseSelection);
    GS.screen.addChild(chooseI);

    const showChooseNText = fade([chooseN]);
    const showChooseWordText = fade([chooseWord]);
    const showChooseSelectionText = fade([chooseSelection]);
    const showChooseIText = fade([chooseI]);

    GS.showTree = delay(0).then(
      ...Object.keys(circlesMap).map(k => {
        return delay((k.length-1) * 60).then(
          new ValueTween(0, 1, 60, easings.easeOutElastic, (t) => {
              circlesMap[k].scale.set(t);
            }),
          new ValueTween(0, 1, 60, easings.easeOutCubic, (t) => {
            circlesMap[k].alpha = t;
          }),
        )
      }),
      ...Object.keys(treeLinesMap).map(k => {
        return delay((k.length-2) * 60 + 30).then(
          new ValueTween(0, 1, 60, easings.easeInOutQuad, (t) => {
            treeLinesMap[k].drawnAmount = t;
            treeLinesMap[k].updateDrawnGraphic();
          }),
        )
      }),
      delay(30).then(showChooseNText),
      delay(90).then(showChooseWordText),
      delay(150).then(showChooseSelectionText),
      delay(210).then(showChooseIText),
    )
    GS.recolorTree = delay(0).then(
      circlesMap["C"].changeColor(orange),
      circlesMap["CR"].changeColor(orange),
      circlesMap["CRR"].changeColor(orange),
      circlesMap["CRRL"].changeColor(orange),
      circlesMap["CRRLR"].changeColor(orange),
    )

    const highlightEdge = (key, color) => {
      return new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        const col = interpValue(black, color, v);
        const stroke = interpValue(10, 20, v);
        treeLinesMap[key].updateStyle({
          stroke:{
            color: col,
            width: stroke,
          }
        })
      });
    }
    const colorText = (text, color) => {
      return new ValueTween(black, color, 60, easings.easeInOutQuad, (v) => {
        text.style.fill = v;
      });
    }

    GS.highlightFirst = delay(0).then(
      highlightEdge("CL", blue),
      highlightEdge("CC", blue),
      highlightEdge("CR", blue),
      colorText(chooseN, blue),
    );

    GS.highlightSecond = delay(0).then(
      highlightEdge("CLL", orange),
      highlightEdge("CCC", orange),
      highlightEdge("CRR", orange),
      colorText(chooseWord, orange),
    );

    GS.highlightThird = delay(0).then(
      highlightEdge("CLLL", blue),
      highlightEdge("CLLR", blue),
      highlightEdge("CCCL", blue),
      highlightEdge("CCCR", blue),
      highlightEdge("CRRL", blue),
      highlightEdge("CRRR", blue),
      colorText(chooseSelection, blue),
    );

    GS.highlightFourth = delay(0).then(
      highlightEdge("CLLLR", orange),
      highlightEdge("CLLRC", orange),
      highlightEdge("CCCLC", orange),
      highlightEdge("CCCRR", orange),
      highlightEdge("CRRLR", orange),
      highlightEdge("CRRRL", orange),
      colorText(chooseI, orange),
    );

    GS.highlightEndNodes = delay(0).then(
      circlesMap["CLLLR"].highlightStroke(),
      circlesMap["CLLLR"].changeColor(red, orange),
      circlesMap["CLLRC"].highlightStroke(),
      circlesMap["CLLRC"].changeColor(red, orange),
      circlesMap["CCCLC"].highlightStroke(),
      circlesMap["CCCLC"].changeColor(red, orange),
      circlesMap["CCCRR"].highlightStroke(),
      circlesMap["CCCRR"].changeColor(red, orange),
      circlesMap["CRRLR"].highlightStroke(),
      circlesMap["CRRLR"].changeColor(red, orange),
      circlesMap["CRRRL"].highlightStroke(),
      circlesMap["CRRRL"].changeColor(red, orange),
    );

    GS.hideTree = fade([tree, chooseN, chooseWord, chooseSelection, chooseI], false);

  }

  // Well, the game analogy from earlier might prove fruitful in determining what exactly this means.

  // The game is played between two players, with no random elements, and no draws.
  // So when played perfectly, either Player 1 will win or Player 2 will win.
  // In other words, if there is no winning strategy for Player 1, then there must exist a winning strategy for Player 2.

  // We can use this to rephrase our Pumping Lemma:

  // Anim: Show this text on the screen.
  {
    const pumpingAltHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001;">
      <div class="definitionBlock" style="position: absolute; top: 25%; left: 50%; transform: translate(-50%, -50%); transition: 1s; width: 60%; opacity: 0;">
        <h3>Pumping Lemma for Regular Languages</h3>
        If $R$ is a regular language, then ${highlight('there exists', 'blue')} some integer $n$ such that
        ${highlight('for all', 'orange')} words $w$ accepted by $R$ with $|w| \\geq n$,
        ${highlight('there exists', 'blue')} a partitioning of $w = xyz$ such that:
        <ul>
          <li>$|y| \\neq 0$</li>
          <li>$|xy| \\leq n$</li>
        </ul>
        and ${highlight('for all', 'orange')} $i \\geq 0$, $xy^iz$ is ${highlight('accepted', 'green')} by $R$.
      </div>
      <div class="definitionBlock" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: 1s; width: 60%; opacity: 0;">
        <h3>Pumping Lemma for Regular Languages (alt)</h3>
        Take some language $R$.
        If ${highlight('for all', 'orange')} integer $n$, ${highlight('there exists', 'blue')} a word $w$ accepted by $R$ with $|w| \\geq n$, such that
        ${highlight('for all', 'orange')} partitionings of $w = xyz$ satisfying:
        <ul>
          <li>$|y| \\neq 0$</li>
          <li>$|xy| \\leq n$</li>
        </ul>
        there ${highlight('must be some', 'blue')} $i \\geq 0$, such that $xy^iz$ is ${highlight('rejected', 'red')} by $R$.

        Then $R$ must be irregular.
      </div>
    </div>`;
    const div = document.createElement('div');
    div.innerHTML = pumpingAltHTML;
    document.body.appendChild(div);
    const originalPumping = div.children[0].children[0];
    const pumpingAlt = div.children[0].children[1];
    MathJax.typeset([originalPumping, pumpingAlt]);

    GS.showPumpingAlt = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      pumpingAlt.style.opacity = v;
    });

    GS.shiftPumpingAlt = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      originalPumping.style.opacity = 1;
      pumpingAlt.style.top = '75%';
    });

    GS.hidePumpingAlt = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      originalPumping.style.opacity = v;
      pumpingAlt.style.opacity = v;
    });
  }

  // We can also get this same statement by negating our original lemma and using some logic rules (and I would encourage you at home to try this).

  // <h3>An example</h3>

  // Let's use our newfound tool to ${highlight('prove', 'green', true)} that a language is irregular, that a language ${highlight('can never', 'red')} be represented by a DFA.

  // One thing we've had trouble doing with DFAs is requiring two parts of a string to be equal, so let's consider the language of all words with an equal amount of a's and b's, and we'll try to show that Player 2 can always win the game.
  // Anim: Fade back in the game view, remove the previous responses, and change the text to be a's = b's.
  {
    GS.showGameAgain = delay(0).then(
      fade(pumpingContainer),
      new ImmediateTween(() => {
        GameGS.description = "Equal a's and b's";
        GameGS.resetGame();
        GameGS.player1CPU = false;
        GameGS.player2CPU = false;
        startGame();
        GameGS.showScreen("SUMMARY");
      }),
    )
  }

  // The first move is Player 1's, and they will respond with some number $n$.

  // As Player 2, we can then respond with the word $a^nb^n$. This has an equal amount of a's and b's, and is double the length requirement.

  // Anim: Show a^nb^n, but then have it expand it aaaabbbb, since n was 4.
  {
    // Show $n$,
    GS.setNAgain = new ImmediateTween(() => {
      GameGS.nText = new TextChanger("n = 4", { align: 'left' } );
      GameGS.nText.pivot.set(0, GameGS.nText.height/2);
      GameGS.screenContainers["SUMMARY"].addChild(GameGS.nText);
      setN(4);
    });
    // Then show $a^nb^n$ (Text Changer)
    GS.respondWithWord = new ImmediateTween(() => {
      GameGS.wordText = new PIXI.Container();;
      const firstText = new TextChanger("anbn", {
        transformOverwrites: { n: {
          width: 12 * gsc,
          yOffset: -5 * gsc,
          xOffset: -1 * gsc,
          scale: 0.8,
        }},
        align: 'center'
      });
      const secondText = new TextChanger("aaaabbbb", { align: 'right' });
      secondText.alpha = 0;
      secondText.pivot.set(0, secondText.height/2);
      // Centered with relation to the second text (what we'll grow into)
      firstText.pivot.set(0, firstText.height/2);
      firstText.position.set(-secondText.width/2, 0);
      GS.firstText = firstText;
      GameGS.wordText.addChild(firstText);
      GameGS.wordText.addChild(secondText);
      GameGS.wordText.visible = false;
      GameGS.screenContainers["SUMMARY"].addChild(GameGS.wordText);
      setWord("anbn", true);
    })
    // Then change n and a^nb^n to the actual values

    GS.changeNAndWord = new ImmediateTween(() => {
      TweenManager.add(delay(0).then(
        // GameGS.nText.changeText("n = 4"),
        delay(60).then(GS.firstText.changeText("aaaabbbb")),
      ));
    })
  }

  // Player 1 then responds with some partitioning of $w$ into $xyz$. But, because of the word we've chosen, and the restrictions on the partition, we know a few things:

  // Anim: Move the highlights on the word, first draw a red line between the a's and b's.
  {
    const selectionText = new TextChanger("aaaabbbb", { align: 'left' } );
    selectionText.pivot.set(0, selectionText.height/2);
    const xH = makeHighlight(selectionText, 0, 1, { color: green });
    const yH = makeHighlight(selectionText, 1, 4, { color: purple });
    const zH = makeHighlight(selectionText, 4, 8, { color: orange });
    xH.alpha = 1;
    yH.alpha = 1;
    zH.alpha = 1;

    GS.showPartition = new ImmediateTween(() => {
      GameGS.selectionText = selectionText
      GameGS.screenContainers["SUMMARY"].addChild(selectionText);
      setSelection(1, 4);
    });

    GS.movePartition1 = delay(0).then(
      xH.move(0, 2),
      yH.move(2, 3),
      zH.move(3, 8),
    )

    GS.movePartition2 = delay(0).then(
      xH.move(0, 2),
      yH.move(2, 4),
      zH.move(4, 8),
    )

    const lineH = makeHighlight(selectionText, 4, 4, { color: black, heightShift: 15 * gsc, yShift: -5 * gsc });
    GS.showLine = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      lineH.alpha = v;
    });

    GS.hideLine = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      lineH.alpha = v;
    });

    GS.movePartition3 = delay(0).then(
      yH.move(2, 2),
      zH.move(2, 8),
    )

    GS.movePartition4 = delay(0).then(
      xH.move(0, 1),
      yH.move(1, 2),
    )

    GS.xH = xH;
    GS.yH = yH;
    GS.zH = zH;
  }

  // <ol>
  //   <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
  //   <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
  // </ol>

  // As such, as Player 2, we can simply pick $i=0$ (But really, any $i \\neq 1$). $xy^iz$ will then have an unequal amount of a's and b's, and the word is therefore rejected by the language.

  // Anim: Show final move with Player 2 winning.
  {
    GS.setIAgain = new ImmediateTween(() => {
      GameGS.iText = new TextChanger("i = 0", { align: 'right' } );
      GameGS.iText.pivot.set(0, GameGS.iText.height/2);
      GameGS.screenContainers["SUMMARY"].addChild(GameGS.iText);
      setI(0);
    });

    const result = new TextChanger("xyiz = aaabbbb", { transformOverwrites: { i: {
      width: 8 * gsc,
      yOffset: -5 * gsc,
      xOffset: 2 * gsc,
      scale: 0.8,
    }} });
    GS.finalResult = result;
    const resultCover = new RectangleCover(result, { points: 20, randMult: 0.1, width: result.width * 1.2 + 60 * gsc });
    result.position.set(2000, 1600);
    resultCover.position.set(2000, 1600 + result.height/2);
    result.alpha = 0;
    resultCover.alpha = 0;
    GS.screen.addChild(resultCover);
    GS.screen.addChild(result);

    GS.showResultAgain = delay(0).then(
      fade([result, resultCover]),
    );

    GS.colorResultAgain = result.colorText(red, 0, result.curText.length);
    GS.recolorResultAgain = result.colorText(black, 0, result.curText.length);

    GS.hideResultAgain = fade([result, resultCover], false);
  }

  // A formal proof of the irregularity of this language looks no different, except 'Player 1' and 'Player 2' are replaced with 'for all's and 'there exists's everywhere:

  // Anim: Show the proof.

  {
    const proofHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; display: flex; justify-content: space-evenly; align-items: center; flex-direction: column; opacity: 0;">
      <div class="definitionBlock">
        <h3>Proof that #a's=#b's is irregular.</h3>
        ${highlight('For any', 'orange')} $n \\geq 0$, ${highlight('consider the word', 'blue', true, true)} $w = a^nb^n$. This has an equal amount of a's and b's, and $|w| \\geq n$.
        ${highlight('For any', 'orange')} any partitioning of $w$, we know that:
        <br>

        <ol style="margin: 20px 0px;">
          <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
          <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
        </ol>

        As such, for ${highlight('$i=0$', 'blue')}, $xy^iz$ will have an unequal amount of a's and b's, and the word is therefore rejected by the language.
        <br><br>
        Therefore, the language of words with an equal amount of a's and b's is irregular.
      </div>
    </div>`;
    const div = document.createElement('div');
    div.innerHTML = proofHTML;
    document.body.appendChild(div);
    const proof = div.children[0];
    MathJax.typeset([proof]);

    GS.showProof = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      proof.style.opacity = v;
    });

    GS.hideProof = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      proof.style.opacity = v;
    });
  }

  // Notice that our word choice mattered there. If instead we selected $w = (ab)^n$, then a partitioning of $x$ = 'ε', $y$ = 'ab', and $z$ = $(ab)^{n-1}$ would've secured the win for Player 1.

  // Anim: Show the game again, show what player 1 can respond with for a player 1 win.
  {
    GS.replaceWord = new ImmediateTween(() => {
      TweenManager.add(GS.firstText.changeText("abababab"));
    });
    GS.replaceSelection = delay(0).then(
      new ImmediateTween(() => {
        TweenManager.add(GameGS.selectionText.changeText("abababab"))
      }),
      GS.xH.move(0, 0),
      GS.yH.move(0, 2),
      GS.zH.move(2, 8),
    )
    GS.replaceResult = new ImmediateTween(() => {
      TweenManager.add(GS.finalResult.changeText("xyiz = ababab"));
    });
    GS.replaceI1 = new ImmediateTween(() => {
      TweenManager.add(delay(0).then(
        GameGS.iText.changeText("i = 1"),
        GS.finalResult.changeText("xyiz = abababab", false, { 7: 9 }),
      ));
    });
    GS.replaceI2 = new ImmediateTween(() => {
      TweenManager.add(delay(0).then(
        GameGS.iText.changeText("i = 2"),
        GS.finalResult.changeText("xyiz = ababababab", false, { 7: 9 }),
      ));
    });
  }

  // We are proving that there ${highlight('exists', 'blue', true)} a strategy that wins for Player 2, not that Player 2 ${highlight('always', 'blue', true)} wins.

  // <h3>Tips for using the Pumping lemma</h3>

  // This is probably the hardest part of regular languages, so let's review some tips and tricks for how to use this lemma effectively:

  // Don't forget that i=0 is an option.
  {
    GS.replaceI0 = new ImmediateTween(() => {
      TweenManager.add(delay(0).then(
        GameGS.iText.changeText("i = 0"),
        GS.finalResult.changeText("xyiz = ababab", false, { 11: 7 }),
      ));
    });
  }

  // Some languages are irregular, but do satisfy the pumping lemma. We've just shown that no pumping lemma implies irregularity, but not the other way around.
  {
    const setContainer = new PIXI.Container();
    const setBorder = new PIXI.Graphics();
    setBorder.rect(50, 50, 3900, 2300).stroke({ color: black, width: 10 });
    setContainer.addChild(setBorder);

    const outside = new PIXI.Text("All languages", { ...baseStyle, fontSize: 128 });
    outside.anchor.set(1, 0);
    outside.position.set(3800, 100);
    setContainer.addChild(outside);

    const circle1 = new PIXI.Graphics();
    circle1.circle(1900, 1250, 800).fill({ color: blue, alpha: 0.25}).stroke({ color: blue, alpha: 0.9, width: 10 })

    const circle2 = new PIXI.Graphics();
    circle2.circle(1800, 1100, 600).fill({ color: purple, alpha: 0.25}).stroke({ color: purple, alpha: 0.9, width: 10 })

    setContainer.addChild(circle2);
    setContainer.addChild(circle1);

    const circ2text = new PIXI.Text("Regular languages", { ...baseStyle, fontSize: 128, fill: purple });
    circ2text.anchor.set(1, 1);
    circ2text.position.set(1500, 550);
    const circ2Cover = new RectangleCover(circ2text, { points: 20, randMult: 0.1, width: circ2text.width + 20 * gsc });
    circ2Cover.position.set(1500 - circ2text.width/2, 550 - circ2text.height/2);
    setContainer.addChild(circ2Cover);
    setContainer.addChild(circ2text);

    const circ1text = new PIXI.Text("Pumping property satisfied", { ...baseStyle, fontSize: 128, fill: blue });
    circ1text.anchor.set(0, 0);
    circ1text.position.set(2700, 1650);
    const circ1Cover = new RectangleCover(circ1text, { points: 20, randMult: 0.1, width: circ1text.width + 40 * gsc });
    circ1Cover.position.set(2700 + circ1text.width/2, 1650 + circ1text.height/2);
    setContainer.addChild(circ1Cover);
    setContainer.addChild(circ1text);

    GS.showSets = fade([setContainer]);
    GS.hideSets = fade([setContainer], false);
    GS.screen.addChild(setContainer);
    setContainer.alpha = 0;
  }

  // Often your word choice is exploiting some 'asymmetry' in first n characters of the word. Notice how in our example, we needed the a's to equal the b's, but we forcefully chose the first n characters to only have a's, so any partitioning would force this out of wack.
  // Anim: Go back to the aaaabbbb example, highlight the first 4 a's.
  {
    const newWordContainer = new PIXI.Container();
    const wordText = new TextChanger("aaaabbbb", { align: 'right' } );
    wordText.pivot.set(0, wordText.height/2);
    const highlight = makeHighlight(wordText, 0, 4, { color: purple });
    newWordContainer.visible = false;
    pumpingContainer.addChild(newWordContainer);
    newWordContainer.addChild(wordText);

    GS.resetGameToAAAA = new ImmediateTween(() => {
      GameGS.description = "Equal a's and b's";
      GameGS.resetGame();
      GameGS.player1CPU = false;
      GameGS.player2CPU = false;
      startGame();
      GameGS.wordText = newWordContainer;
      setN(4);
      setWord("aaaabbbb", true);
      GameGS.showScreen("SUMMARY");
    });

    GS.highlightAssymetry = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      highlight.alpha = v;
    });
  }

  // Sometimes, there are multiple choices for valid words that Player 2 can win with, however one will be a lot easier to prove is a winning strategy. Try to make your n character segment as simple as possible!
  // Anim: Change lang to num a's equals num b's, and num a's is odd, then start with n = 5, w = 'baaabb', then swap to 'aaaaabbbbb'. Both work.
  {
    const newWordContainer = new PIXI.Container();
    newWordContainer.visible = false;
    pumpingContainer.addChild(newWordContainer);
    const wordText = new TextChanger("baaabb", { align: 'right' } );
    wordText.pivot.set(0, wordText.height/2);
    const highlightOld = makeHighlight(wordText, 0, 5, { color: red });
    newWordContainer.addChild(wordText);
    const wordTextNew = new TextChanger("aaaaabbbbb", { align: 'right' } );
    wordTextNew.pivot.set(0, wordTextNew.height/2);
    const highlightNew = makeHighlight(wordTextNew, 0, 5, { color: green });
    newWordContainer.addChild(wordTextNew);
    wordTextNew.alpha = 0;

    GS.resetGameToBAAAB = new ImmediateTween(() => {
      GameGS.wordText.alpha = 0;
      GameGS.description = "Equal a's and b's, and odd a's";
      GameGS.resetGame();
      GameGS.player1CPU = false;
      GameGS.player2CPU = false;
      startGame();
      GameGS.wordText = newWordContainer;
      setN(5);
      setWord("baaabb", true);
      GameGS.showScreen("SUMMARY");
    });

    GS.showBadCharacters = fade(highlightOld);

    GS.changeWordToBeSimpler = delay(0).then(fade([wordText, highlightOld], false), fade(wordTextNew));

    GS.highlightSimplicity = fade(highlightNew);

  }

  // It is hard to choose the right word, but this is something that requires intution and gets better with practice. So let's get some practice on the next two worksheets!
  // No anim.

  // Anim: Show the tips.
  {
    const tipsHTML = `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1001; display: flex; justify-content: space-evenly; align-items: center; flex-direction: column; opacity: 0;">
      <div class="definitionBlock">
        <ul>
          <li>Don't forget that $i=0$ is an option - we can remove the $y$ element entirely. Sometimes this choice is the only way to prove irregularity.</li>
          <li>Some languages are irregular, but do satisfy the pumping lemma. We've just shown that no pumping lemma implies irregularity, but not the other way around.</li>
          <li>Often your word choice is exploiting some 'asymmetry' in first $n$ characters of the word. Notice how in our example, we needed the a's to equal the b's, but we forcefully chose the first $n$ characters to only have a's, so any partitioning would force this out of wack.</li>
          <li>Sometimes, there are multiple choices for valid words that Player 2 can win with, however one will be a lot easier to prove is a winning strategy. Try to make your $n$ character segment as simple as possible!</li>
          <li>It is hard to choose the right word, but this is something that requires intution and gets better with practice. So let's get some practice on the next two worksheets!</li>
        </ul>
      </div>
    </div>`;
    const div = document.createElement('div');
    div.innerHTML = tipsHTML;
    document.body.appendChild(div);
    const tips = div.children[0];
    MathJax.typeset([tips]);

    GS.showTips = () => new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      tips.style.opacity = v;
    });

    GS.hideTips = () => new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
      tips.style.opacity = v;
    });
  }

  TweenManager.add(delay(60)
    .then(GS.showProperties())
    .then(delay(60))
    .then(GS.hideProperties(), GS.fadeAll3())
    .then(delay(60))
    .then(GS.showMinim())
    .then(delay(90))
    .then(GS.split1)
    .then(delay(120))
    .then(GS.split2)
    .then(delay(120))
    .then(GS.hideMinim(), GS.showProperties())
    .then(delay(60))
    .then(GS.hideProperties(), GS.drawAll3())
    .then(delay(60))
    .then(GS.highlightLoops)
    .then(delay(60))
    .then(GS.keepDFA)
    .then(delay(60))
    .then(GS.fadeAll3())
    .then(delay(60))
    .then(GS.showActualDFA)
    .then(delay(60))
    .then(GS.showWord)
    .then(delay(60))
    .then(GS.colorWord)
    .then(delay(60))
    .then(GS.showPointers)
    .then(delay(60))
    .then(GS.showPath)
    .then(delay(60))
    .then(GS.highlightFirstNCharStates)
    .then(delay(60))
    .then(GS.highlightRepeatedState)
    .then(delay(60))
    .then(GS.highlightPath)
    .then(delay(60))
    .then(
      GS.showX,
      delay(90).then(GS.showY),
      delay(180).then(GS.showZ),
    )
    .then(delay(60))
    .then(GS.hideEverythingActualDFA, GS.hidePath())
    .then(delay(60))
    .then(GS.showHeaders)
    .then(delay(60))
    .then(GS.showIVals)
    .then(delay(60))
    .then(GS.showWords)
    .then(delay(60))
    .then(GS.showOverlay(), GS.showPumpingLemma())
    .then(delay(60))
    .then(GS.hideAllWordStuff, GS.hideOverlay(), GS.hidePumpingLemma())
    .then(delay(60))
    .then(GS.showGame)
    .then(delay(90))
    .then(GS.selectWord)
    .then(delay(90))
    .then(GS.selectPartition)
    .then(delay(90))
    .then(GS.selectI)
    .then(delay(90))
    .then(GS.showResult)
    .then(delay(60))
    .then(GS.colorResult)
    .then(delay(60))
    .then(GS.showMiniDFA)
    .then(delay(60))
    .then(GS.highlightN)
    .then(delay(60))
    .then(GS.reshowPath)
    .then(delay(60))
    .then(GS.highlightSplit)
    .then(delay(60))
    .then(GS.mergePath)
    .then(delay(60))
    .then(GS.showLoop)
    .then(delay(60))
    .then(fade(pumpingContainer, false), GS.hidePath(), GS.hideResult, GS.hideHighlights, GS.hideMiniDFA)
    .then(GS.showTree)
    .then(delay(60))
    .then(GS.recolorTree)
    .then(delay(60))
    .then(GS.highlightFirst)
    .then(delay(60))
    .then(GS.highlightSecond)
    .then(delay(60))
    .then(GS.highlightThird)
    .then(delay(60))
    .then(GS.highlightFourth)
    .then(delay(60))
    .then(GS.highlightEndNodes)
    .then(delay(60))
    .then(GS.hideTree)
    .then(delay(120))
    .then(GS.showOverlay(), GS.showPumpingAlt())
    .then(delay(120))
    .then(GS.shiftPumpingAlt())
    .then(delay(60))
    .then(GS.hidePumpingAlt(), GS.hideOverlay())
    .then(GS.showGameAgain)
    .then(delay(60))
    .then(GS.setNAgain)
    .then(delay(120))
    .then(GS.respondWithWord)
    .then(delay(120))
    .then(GS.changeNAndWord)
    .then(delay(120))
    .then(GS.showPartition)
    .then(delay(120))
    .then(GS.movePartition1)
    .then(delay(60))
    .then(GS.movePartition2)
    .then(delay(60))
    .then(GS.showLine)
    .then(delay(60))
    .then(GS.movePartition3)
    .then(delay(60))
    .then(GS.movePartition4)
    .then(delay(60))
    .then(GS.setIAgain)
    .then(delay(120))
    .then(GS.showResultAgain)
    .then(delay(60))
    .then(GS.colorResultAgain)
    .then(delay(60))
    .then(GS.showOverlay(), GS.showProof())
    .then(delay(60))
    .then(GS.hideProof(), GS.hideOverlay(), GS.recolorResultAgain)
    .then(GS.replaceWord)
    .then(delay(60))
    .then(GS.replaceSelection, GS.hideLine)
    .then(delay(60))
    .then(GS.replaceResult)
    .then(delay(120))
    .then(GS.replaceI1)
    .then(delay(120))
    .then(GS.replaceI2)
    .then(delay(120))
    .then(GS.replaceI0)
    .then(delay(60))
    .then(fade(pumpingContainer, false), GS.hideResultAgain)
    .then(GS.showSets)
    .then(delay(60))
    .then(GS.hideSets)
    .then(delay(60))
    .then(fade(pumpingContainer), GS.resetGameToAAAA)
    .then(delay(60))
    .then(GS.highlightAssymetry)
    .then(delay(60))
    .then(fade(pumpingContainer, false))
    .then(delay(60))
    .then(fade(pumpingContainer), GS.resetGameToBAAAB)
    .then(delay(60))
    .then(GS.showBadCharacters)
    .then(delay(60))
    .then(GS.changeWordToBeSimpler)
    .then(delay(60))
    .then(GS.highlightSimplicity)

    // .then(GS.showTips(), GS.showOverlay())
  )

  // TweenManager.skipSeconds(100)

};

const unloader = () => {};

export default { loader, unloader };
