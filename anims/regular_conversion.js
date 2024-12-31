import { black, green, purple, yellow, blue, orange, white, bg_dark, highlightColours, rainbow, red } from "../colours.js";
import NFA from "../nfa.js";
import Screen from "../screen.js";
import TextChanger from "../tools/change_text.js";
import { RectangleCover } from "../tools/paper_cover.js";
import { delay, fade, ImmediateTween, interpValue, repeatTween, TweenManager, ValueTween } from "../tween.js";
import { wordGroups, gridNFA, extraAccepting, GS as playgroundGS } from "./video_playground.js";
import { makeHighlight, UnderLine } from "./regex_intro.js";
import { DrawnBezier } from "../tools/drawnBezier.js";
import { AbstractEdge } from "../graph.js";
import { GS as NFAGS, createFakeNFAEnvironment } from "./intro.js";
import { moveBetween, NodePointer } from "../tools/word.js";
import Table from "../tools/table.js";
import DFA from "../dfa.js";
import nfaMatch from "../graphs/nfaMatch.js";

const gsc = window.gameScaling ?? 1;

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 128,
  fill: black,
  align: 'center',
};

const GS = {
  mother: new NFA(),
};

const simpleRegex = "(ab)*";
const fullRegex = "(ab)*aa((a*b)|(b*a))";

const mergeNFA = (...nfas) => {
  const states = [];
  const transitions = [];
  for (const nfa of nfas) {
    // Might have states defined in multiple selections.
    states.push(...nfa.states.filter(s => !states.find(s2 => s2.name === s.name)));
    transitions.push(...nfa.transitions);
  }
  return { states, transitions };
}
const selectStates = (nfa, source) => {
  return source.states.map(s => Object.keys(nfa.nodes).find(k => k === s.name)).map(k => nfa.nodes[k]);
}
const selectEdges = (nfa, source) => {
  return source.transitions.map(e => nfa.edgeMap[`${e.from}->${e.to}`]);
}

const exampleNFA = {
  states: [
    { name: "1", position: {x: 1000, y: 1200}, starting: true, accepting: false },
    { name: "2", position: {x: 1500, y: 2000}, starting: false, accepting: true },
    { name: "3", position: {x: 2500, y: 2000}, starting: false, accepting: false },
    { name: "4", position: {x: 3000, y: 1200}, starting: false, accepting: false },
  ],
  transitions: [
    { from: "1", to: "2", label: "a" },
    { from: "2", to: "3", label: "b" },
    { from: "3", to: "4", label: "ε" },
    { from: "3", to: "3", label: "a" },
    { from: "1", to: "4", label: "c" }, // Will become simpleRegex.
    { from: "4", to: "2", label: "a", style: { edgeAnchor: { x: -150, y: -150 } } },
  ],
}
const simpleNFA = {
  states: [
    { name: "simpleA", position: {x: 2000, y: 800}, starting: true, accepting: true },
    { name: "simpleB", position: {x: 2000, y: 200}, starting: false, accepting: false },
  ],
  transitions: [
    { from: "simpleA", to: "simpleB", label: "a", style: { edgeAnchor: { x: -200, y: 0 } } },
    { from: "simpleB", to: "simpleA", label: "b", style: { edgeAnchor: { x: 200, y: 0 } } },
  ],
}
const simpleNFABridging = {
  states: [],
  transitions: [
    { from: "1", to: "simpleA", label: "ε" },
    { from: "simpleA", to: "4", label: "ε" },
  ]
}

const compressRegexNFA = {
  states: [
    { name: "compressX", position: { x: 500, y: 700 }, starting: true, accepting: false },
    { name: "compressY", position: { x: 3500, y: 700 }, starting: false, accepting: true },
  ],
  transitions: [
    { from: "compressX", to: "compressY", label: fullRegex },
  ]
}

const expandedLevel1NFA = {
  states: [
    { name: "expandA", position: { x: 1400, y: 1300 } },
    { name: "expandB", position: { x: 1900, y: 1300 } },
    { name: "expandC", position: { x: 2400, y: 1300 } },
  ],
  transitions: [
    { from: "compressX", to: "expandA", label: "(ab)*" },
    { from: "expandA", to: "expandB", label: "a" },
    { from: "expandB", to: "expandC", label: "a" },
    { from: "expandC", to: "compressY", label: "(a*b)|(b*a)" },
  ]
}

const firstExpandedNFA = {
  states: [
    { name: "first1", position: { x: 950, y: 1300 }, starting: true, accepting: true },
    { name: "first2", position: { x: 950, y: 1800 }, starting: false, accepting: false },
  ],
  transitions: [
    { from: "first1", to: "first2", label: "a", style: { edgeAnchor: { x: 200, y: 0 } } },
    { from: "first2", to: "first1", label: "b", style: { edgeAnchor: { x: -200, y: 0 } } },
  ],
}

const firstExpandedNFABridging = {
  states: [],
  transitions: [
    { from: "compressX", to: "first1", label: "ε" },
    { from: "first1", to: "expandA", label: "ε" },
  ]
}

const secondExpandedNFAP1 = {
  states: [
    { name: "secondi", position: { x: 2750, y: 1300 }, starting: true, accepting: false },
    { name: "secondj", position: { x: 3150, y: 1300 }, starting: false, accepting: true },
  ],
  transitions: [
    { from: "secondi", to: "secondi", label: "a" },
    { from: "secondi", to: "secondj", label: "b" },
  ]
}
const secondExpandedNFAP2 = {
  states: [
    { name: "secondn", position: { x: 2750, y: 2100 }, starting: true, accepting: false },
    { name: "secondm", position: { x: 3150, y: 2100 }, starting: false, accepting: true },
  ],
  transitions: [
    { from: "secondn", to: "secondn", label: "b" },
    { from: "secondn", to: "secondm", label: "a" },
  ]
}
const secondExpandedNFAStartEnd = {
  states: [
    { name: "seconds", position: { x: 2400, y: 1700 }, starting: true, accepting: false },
    { name: "seconde", position: { x: 3500, y: 1700 }, starting: false, accepting: true },
  ],
  transitions: [
    { from: "seconds", to: "secondi", label: "ε" },
    { from: "secondj", to: "seconde", label: "ε" },
    { from: "seconds", to: "secondn", label: "ε" },
    { from: "secondm", to: "seconde", label: "ε" },
  ]
}
const secondExpandedNFAEpsilons = {
  states: [],
  transitions: [
    { from: "expandC", to: "seconds", label: "ε" },
    { from: "seconde", to: "compressY", label: "ε" },
  ]
}

const rule1NFA = {
  states: [
    { name: "rule1A", position: { x: 400, y: 600 } },
    { name: "rule1B", position: { x: 1000, y: 600 } },
  ],
  transitions: [
    { from: "rule1A", to: "rule1B", label: "XY" },
  ],
}
const rule1NFATranslate = {
  states: [
    { name: "rule1X", position: { x: 300, y: 1800 } },
    { name: "rule1Y", position: { x: 750, y: 1800 } },
    { name: "rule1Z", position: { x: 1200, y: 1800 } },
  ],
  transitions: [
    { from: "rule1X", to: "rule1Y", label: "X" },
    { from: "rule1Y", to: "rule1Z", label: "Y" },
  ],
}

const rule2NFA = {
  states: [
    { name: "rule2A", position: { x: 1700, y: 600 } },
    { name: "rule2B", position: { x: 2300, y: 600 } },
  ],
  transitions: [
    { from: "rule2A", to: "rule2B", label: "(X)*" },
  ],
}
const rule2NFATranslate = {
  states: [
    { name: "rule2X", position: { x: 1600, y: 1800 } },
    { name: "rule2Y", position: { x: 2000, y: 2200 } },
    { name: "rule2Z", position: { x: 2400, y: 1800 } },
  ],
  transitions: [
    { from: "rule2X", to: "rule2Y", label: "ε" },
    { from: "rule2Y", to: "rule2Y", label: "X", style: { loopOffset: { x: 0, y: -250 } } },
    { from: "rule2Y", to: "rule2Z", label: "ε" },
  ],
}

const rule3FakeState = {
  states: [
    { name: "fakeY", position: { x: 3500, y: 1800 } },
  ],
  transitions: [],
}
const rule3NFA = {
  states: [
    { name: "rule3A", position: { x: 2800, y: 600 } },
    { name: "rule3B", position: { x: 3500, y: 600 } },
  ],
  transitions: [
    { from: "rule3A", to: "rule3B", label: "(X)|(Y)" },
  ]
}
const rule3NFATranslate = {
  states: [
    { name: "rule3X", position: { x: 2800, y: 1800 } },
    { name: "rule3Y", position: { x: 3500, y: 1800 } },
  ],
  transitions: [
    { from: "rule3X", to: "rule3Y", label: "X", style: { edgeAnchor: { x: 0, y: -200 } } },
    { from: "rule3X", to: "fakeY", label: "Y", style: { edgeAnchor: { x: 0, y: 200 } } },
  ],
}

const resultNFA = {
  states: [
    { name: "resultA", position: {x: 4000, y: 1600}, starting: true, accepting: false },
    { name: "resultB", position: {x: 4800, y: 1600}, starting: false, accepting: true },
  ],
  transitions: [
    { from: "resultA", to: "resultB", label: "R" },
  ],
}

const consolidateOriginal = {
  states: [
    { name: "consolidateA", position: { x: 1300, y: 1200 } },
    { name: "consolidateB", position: { x: 2700, y: 1200 } },
  ],
  transitions: [
    { from: "consolidateA", to: "consolidateB", label: "X", style: { edgeAnchor: { x: 0, y: -300 } } },
    { from: "consolidateA", to: "consolidateFakeB", label: "Y", style: { edgeAnchor: { x: 0, y: 300 } } },
  ]
}
const consolidateFake = {
  states: [
    { name: "consolidateFakeA", position: { x: 1300, y: 1200 } },
    { name: "consolidateFakeB", position: { x: 2700, y: 1200 } },
  ],
  transitions: [],
}
const consolidateNew = {
  states: [
    { name: "consolidateA", position: { x: 1300, y: 1200 } },
    { name: "consolidateB", position: { x: 2700, y: 1200 } },
  ],
  transitions: [
    { from: "consolidateFakeA", to: "consolidateB", label: "(X)|(Y)" },
  ]
}

const mergeOriginal = {
  states: [
    { name: "mergeOriginalS", position: { x: 2000, y: 500 } },
    { name: "mergeOriginal1", position: { x: 600, y: 1000 } },
    { name: "mergeOriginal2", position: { x: 1000, y: 1600 } },
    { name: "mergeOriginal3", position: { x: 2000, y: 2000 } },
    { name: "mergeOriginalDupe3", position: { x: 2000, y: 2000 } },
    { name: "mergeOriginal4", position: { x: 3000, y: 1600 } },
    { name: "mergeOriginal5", position: { x: 3400, y: 1000 } },
  ],
  transitions: [
    { from: "mergeOriginal1", to: "mergeOriginalS", label: "A" },
    { from: "mergeOriginal2", to: "mergeOriginalS", label: "B" },
    { from: "mergeOriginal3", to: "mergeOriginalS", label: "C", style: { edgeAnchor: { x: -200, y: 0 } } },
    { from: "mergeOriginalS", to: "mergeOriginalDupe3", label: "D", style: { edgeAnchor: { x: 200, y: 0 } } },
    { from: "mergeOriginalS", to: "mergeOriginal4", label: "E" },
    { from: "mergeOriginalS", to: "mergeOriginal5", label: "F" },
    { from: "mergeOriginalS", to: "mergeOriginalS", label: "X" },
  ],
}

const mergeNewTransitionsWithDupe = {
  states: [],
  transitions: [
    { from: "mergeOriginal1", to: "mergeOriginalDupe3", label: "A(X)*D" },
    { from: "mergeOriginal1", to: "mergeOriginal4", label: "A(X)*E" },
    { from: "mergeOriginal1", to: "mergeOriginal5", label: "A(X)*F" },
    { from: "mergeOriginal2", to: "mergeOriginalDupe3", label: "B(X)*D" },
    { from: "mergeOriginal2", to: "mergeOriginal4", label: "B(X)*E" },
    { from: "mergeOriginal2", to: "mergeOriginal5", label: "B(X)*F" },
    { from: "mergeOriginal3", to: "mergeOriginalDupe3", label: "C(X)*D", style: { edgeAnchor: { x: 0, y: 0 } } },
    { from: "mergeOriginal3", to: "mergeOriginal4", label: "C(X)*E" },
    { from: "mergeOriginal3", to: "mergeOriginal5", label: "C(X)*F" },
  ]
}

const mergeNewTransitionsWithoutDupe = {
  states: [],
  transitions: [
    { from: "mergeOriginal3", to: "mergeOriginal3", label: "C(X)*D" },
  ]
}

const multiAcceptNFA = {
  states: [
    { name: "multiAcceptA", position: { x: 1400, y: 1600 }, starting: true, accepting: true },
    { name: "multiAcceptB", position: { x: 2000, y: 800 }, starting: false, accepting: true },
    { name: "multiAcceptC", position: { x: 3000, y: 800 }, starting: false, accepting: true },
    { name: "multiAcceptD", position: { x: 2500, y: 1600 }, starting: false, accepting: true },
  ],
  transitions: [
    { from: "multiAcceptA", to: "multiAcceptB", label: "V" },
    { from: "multiAcceptB", to: "multiAcceptB", label: "W" },
    { from: "multiAcceptB", to: "multiAcceptC", label: "X" },
    { from: "multiAcceptC", to: "multiAcceptD", label: "Y" },
    { from: "multiAcceptD", to: "multiAcceptB", label: "Z" },
  ],
}
const multiAcceptNFAExtraState = {
  states: [
    { name: "multiAcceptE", position: { x: 3400, y: 1200 }, accepting: true },
  ],
  transitions: [
    { from: "multiAcceptB", to: "multiAcceptE", label: "ε", style: { stroke: { color: red } } },
    { from: "multiAcceptC", to: "multiAcceptE", label: "ε", style: { stroke: { color: red } } },
    { from: "multiAcceptD", to: "multiAcceptE", label: "ε", style: { stroke: { color: red } } },
  ]
}

const copyRightNFA = {
  states: [
    { name: "copyRightA", position: { x: 1400, y: 1600 }, starting: true, accepting: false },
    { name: "copyRightE", position: { x: 3400, y: 1200 }, starting: false, accepting: true },
  ],
  transitions: [],
}

const splitNFATransitions = {
  states: [],
  transitions: [
    { from: "multiAcceptA", to: "multiAcceptA", label: "X" },
    { from: "copyRightA", to: "copyRightA", label: "X" },
    { from: "copyRightA", to: "copyRightE", label: "Y" },
    { from: "copyRightE", to: "copyRightE", label: "Z" },
  ]
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();

  GS.mother = new NFA();
  GS.mother.import(mergeNFA(
    exampleNFA,
    simpleNFA,
    simpleNFABridging,
    compressRegexNFA,
    expandedLevel1NFA,
    firstExpandedNFA,
    firstExpandedNFABridging,
    secondExpandedNFAP1,
    secondExpandedNFAP2,
    secondExpandedNFAStartEnd,
    secondExpandedNFAEpsilons,
    rule1NFA,
    rule1NFATranslate,
    rule2NFA,
    rule2NFATranslate,
    rule3NFA,
    rule3NFATranslate,
    rule3FakeState,
    resultNFA,
    consolidateOriginal,
    consolidateFake,
    consolidateNew,
    mergeOriginal,
    mergeNewTransitionsWithDupe,
    mergeNewTransitionsWithoutDupe,
    multiAcceptNFA,
    multiAcceptNFAExtraState,
    copyRightNFA,
    splitNFATransitions,
  ));

  Object.values(GS.mother.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  })
  GS.mother.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0;
    e.updateGraphic();
  });
  GS.screen.addChild(GS.mother.graph);
  // Relabelling the states (some duplicates)
  GS.mother.nodes["simpleA"].labelText.text = "A";
  GS.mother.nodes["simpleB"].labelText.text = "B";
  GS.mother.nodes["compressX"].labelText.text = "X";
  GS.mother.nodes["compressY"].labelText.text = "Y";
  GS.mother.nodes["expandA"].labelText.text = "A";
  GS.mother.nodes["expandB"].labelText.text = "B";
  GS.mother.nodes["expandC"].labelText.text = "C";
  GS.mother.nodes["first1"].labelText.text = "1";
  GS.mother.nodes["first2"].labelText.text = "2";
  GS.mother.nodes["secondi"].labelText.text = "I";
  GS.mother.nodes["secondj"].labelText.text = "J";
  GS.mother.nodes["secondn"].labelText.text = "N";
  GS.mother.nodes["secondm"].labelText.text = "M";
  GS.mother.nodes["seconds"].labelText.text = "S";
  GS.mother.nodes["seconde"].labelText.text = "E";
  GS.mother.nodes["rule1A"].labelText.text = "A";
  GS.mother.nodes["rule1B"].labelText.text = "B";
  GS.mother.nodes["rule1X"].labelText.text = "X";
  GS.mother.nodes["rule1Y"].labelText.text = "Y";
  GS.mother.nodes["rule1Z"].labelText.text = "Z";
  GS.mother.nodes["rule2A"].labelText.text = "A";
  GS.mother.nodes["rule2B"].labelText.text = "B";
  GS.mother.nodes["rule2X"].labelText.text = "X";
  GS.mother.nodes["rule2Y"].labelText.text = "Y";
  GS.mother.nodes["rule2Z"].labelText.text = "Z";
  GS.mother.nodes["rule3A"].labelText.text = "A";
  GS.mother.nodes["rule3B"].labelText.text = "B";
  GS.mother.nodes["rule3X"].labelText.text = "X";
  GS.mother.nodes["rule3Y"].labelText.text = "Y";
  GS.mother.nodes["resultA"].labelText.text = "A";
  GS.mother.nodes["resultB"].labelText.text = "B";
  GS.mother.nodes["consolidateA"].labelText.text = "A";
  GS.mother.nodes["consolidateB"].labelText.text = "B";
  GS.mother.nodes["mergeOriginalS"].labelText.text = "S";
  GS.mother.nodes["mergeOriginal1"].labelText.text = "1";
  GS.mother.nodes["mergeOriginal2"].labelText.text = "2";
  GS.mother.nodes["mergeOriginal3"].labelText.text = "3";
  GS.mother.nodes["mergeOriginal4"].labelText.text = "4";
  GS.mother.nodes["mergeOriginal5"].labelText.text = "5";
  GS.mother.nodes["mergeOriginalDupe3"].labelText.text = "3";
  GS.mother.nodes["multiAcceptA"].labelText.text = "A";
  // Hide the starting state is accepting for now.
  GS.mother.nodes["multiAcceptA"].innerCircle.alpha = 0;
  GS.mother.nodes["multiAcceptB"].labelText.text = "B";
  GS.mother.nodes["multiAcceptC"].labelText.text = "C";
  GS.mother.nodes["multiAcceptD"].labelText.text = "D";
  GS.mother.nodes["multiAcceptE"].labelText.text = "E";
  GS.mother.nodes["copyRightA"].labelText.text = "A";
  GS.mother.nodes["copyRightE"].labelText.text = "E";

  // Helpful variables
  const regexEdge = GS.mother.edgeMap["1->4"];

  // In the last page, we looked at variations of non-deterministic finite automata that are equivalent to NFAs (and by extension DFAs).
  {
  GS.gridContainer = new PIXI.Container();
  GS.gridContainer.alpha = 0;
  GS.gridContainer.pivot.set(2000, 1200);
  GS.gridContainer.position.set(1600, 1700);
  GS.gridContainer.scale.set(0.5);
  GS.screen.addChild(GS.gridContainer);
  GS.extraAcceptingContainer = new PIXI.Container();
  GS.extraAcceptingContainer.alpha = 0;
  GS.extraAcceptingContainer.pivot.set(2000, 1200);
  GS.extraAcceptingContainer.position.set(500, 600);
  GS.extraAcceptingContainer.scale.set(0.5);
  GS.screen.addChild(GS.extraAcceptingContainer);
  GS.wordGroupsContainer = new PIXI.Container();
  GS.wordGroupsContainer.alpha = 0;
  GS.wordGroupsContainer.pivot.set(2000, 1200);
  GS.wordGroupsContainer.position.set(3000, 700);
  GS.wordGroupsContainer.scale.set(0.5);
  GS.screen.addChild(GS.wordGroupsContainer);
  playgroundGS.screen = GS.gridContainer
  playgroundGS.easings = easings;
  const gridTween = gridNFA();
  TweenManager.add(gridTween);
  playgroundGS.screen = GS.extraAcceptingContainer
  const extraAcceptingTween = extraAccepting();
  TweenManager.add(extraAcceptingTween);
  playgroundGS.screen = GS.wordGroupsContainer
  const wordGroupsTween = wordGroups();
  TweenManager.add(wordGroupsTween);
  // Pre-skip the animations - we just want final result.
  TweenManager.skipToEnd();
  }

  // Let's continue these efforts, and try to think how we might prove that allowing each transition in our NFA to be a <span class="highlight-small highlight-orange-long">regular expression</span> instead of a single symbol doesn't change the power of the machine.
  {
  const showExampleStates = selectStates(GS.mother, exampleNFA).map(s => s.tweenPop(60));
  const drawExampleEdges = selectEdges(GS.mother, exampleNFA).map(e => {
    return e.growEdgeTween(60, easings.easeInOutQuad)
      .during(e.showLabelTween(60, easings.easeInOutQuad));
  });
  GS.showExampleNFA = delay(0).then(
    ...showExampleStates,
    delay(30).then(...drawExampleEdges)
  );
  const regexEdgeNewLabel = new PIXI.Text(simpleRegex, { ...baseStyle });
  const regexEdgeBacking = new RectangleCover(regexEdgeNewLabel, { points: 20, randMult: 0.1 })
  const regexEdgeTransform = regexEdge.getLabelTransform();
  regexEdgeNewLabel.position.set(regexEdgeTransform.position.x, regexEdgeTransform.position.y);
  regexEdgeNewLabel.anchor.set(0.5, 0.5);
  regexEdgeBacking.position.set(regexEdgeTransform.position.x, regexEdgeTransform.position.y);
  regexEdgeNewLabel.alpha = 0;
  regexEdgeBacking.alpha = 0;
  regexEdge.graphic.addChild(regexEdgeBacking);
  regexEdge.graphic.addChild(regexEdgeNewLabel);
  regexEdge.newLabelGraphics = [regexEdgeBacking, regexEdgeNewLabel];
  GS.fadeToRegex = regexEdge.hideLabelTween(60, easings.easeInOutQuad)
    .during(fade([regexEdgeBacking, regexEdgeNewLabel], true, 60))
    .then(new ImmediateTween(() => {
      // For when it fades back in later.
      regexEdge.labelText.text = simpleRegex;
      regexEdge.style.edgeLabel = simpleRegex;
    }));
  }

  // For a particular regular expression, if we can find an NFA that accepts the same language, then plugging this NFA in-place of an transition is rather simple:
  {
  const showSimpleStates = selectStates(GS.mother, simpleNFA).map(s => s.tweenPop(60));
  const drawSimpleEdges = selectEdges(GS.mother, simpleNFA).map(e => {
    return e.growEdgeTween(60, easings.easeInOutQuad)
      .during(e.showLabelTween(60, easings.easeInOutQuad));
  });
  GS.showSimpleNFA = delay(0).then(
    ...showSimpleStates,
    delay(30).then(...drawSimpleEdges)
  );
  GS.removeSimpleStartAccept = fade([
    GS.mother.nodes["simpleA"].entry,
    GS.mother.nodes["simpleA"].innerCircle,
  ], false)
  GS.showSimpleEpsilonEdges = delay(0).then(
    ...selectEdges(GS.mother, simpleNFABridging).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    }),
    fade(regexEdge.newLabelGraphics, false),
    regexEdge.hideEdgeTween(60, easings.easeInOutQuad),
  )
  const currentStates = [
    ...selectStates(GS.mother, exampleNFA),
    ...selectStates(GS.mother, simpleNFA),
  ]
  const hideAllCurrentStates = fade([
    ...currentStates.map(s => s.graphic),
    ...currentStates.map(s => s.separatedGraphic),
  ], false);
  const hideAllCurrentEdges = [
    ...selectEdges(GS.mother, exampleNFA),
    ...selectEdges(GS.mother, simpleNFA),
    ...selectEdges(GS.mother, simpleNFABridging),
  ].filter(e => e.labelKey !== regexEdge.labelKey).map(e => e.hideEdgeTween(60, easings.easeInOutQuad).during(e.hideLabelTween(60, easings.easeInOutQuad)));
  GS.hideSampleMother = delay(0).then(
    ...hideAllCurrentEdges,
    delay(30).then(hideAllCurrentStates),
  )
  }

  // So let's try converting a regular expression to an NFA. Just as how we understood Regular Expressions originally, let's break apart and simplify the regular expression into smaller parts, and keep going until our transitions are just singular symbols.
  {
    // Fuck modularisation we're just going to copy all of this garbage.
    const fenceExample = new TextChanger("cbaaaaabcabbac");
    fenceExample.pivot.set(0, fenceExample.height / 2);
    fenceExample.position.set(2000, 200);
    const coverFence = new RectangleCover(fenceExample, { randMult: 0.1, points: 20, width: 1300, height: 180 });
    coverFence.position.set(2000, 200);

    const complex = new TextChanger("(c(abbb*a)|(baaa*b))*c");
    complex.pivot.set(0, complex.height / 2);
    complex.position.set(2000, 600);
    const coverComplex = new RectangleCover(complex, { randMult: 0.1, points: 20, width: 1300, height: 180 });
    coverComplex.position.set(2000, 600);

    const largeCopy1 = new TextChanger("c(abbb*a)|(baaa*b)");
    const largeCopy2 = new TextChanger("c(abbb*a)|(baaa*b)");
    const terminal1c = new TextChanger("c");
    largeCopy1.pivot.set(0, largeCopy1.height / 2);
    largeCopy1.position.set(800, 1050);
    largeCopy2.pivot.set(0, largeCopy2.height / 2);
    largeCopy2.position.set(2300, 1050);
    terminal1c.pivot.set(0, terminal1c.height / 2);
    terminal1c.position.set(3500, 1050);
    const largeCover1 = new RectangleCover(largeCopy1, { randMult: 0.1, points: 20, width: 1200, height: 180 });
    largeCover1.position.set(largeCopy1.position.x, largeCopy1.position.y);
    const largeCover2 = new RectangleCover(largeCopy2, { randMult: 0.1, points: 20, width: 1200, height: 180 });
    largeCover2.position.set(largeCopy2.position.x, largeCopy2.position.y);
    const terminalCover1 = new RectangleCover(terminal1c, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
    terminalCover1.position.set(terminal1c.position.x, terminal1c.position.y);

    const underlineComplexDerivation = new UnderLine({ color: purple });
    underlineComplexDerivation.setConfig(complex.transform(complex.curText, 1), complex.transform(complex.curText, 18));
    underlineComplexDerivation.position.set(complex.position.x, complex.position.y);
    const underlineComplexTerminal = new UnderLine({ color: green });
    underlineComplexTerminal.setConfig(complex.transform(complex.curText, 21), complex.transform(complex.curText, 21));
    underlineComplexTerminal.position.set(complex.position.x, complex.position.y);
    const derivationLine1 = new PIXI.Graphics();
    derivationLine1.moveTo(underlineComplexDerivation.midPoint().x, underlineComplexDerivation.midPoint().y);
    derivationLine1.lineTo(largeCopy1.position.x, largeCopy1.position.y);
    derivationLine1.stroke({ color: purple, width: 10 });
    const derivationLine2 = new PIXI.Graphics();
    derivationLine2.moveTo(underlineComplexDerivation.midPoint().x, underlineComplexDerivation.midPoint().y);
    derivationLine2.lineTo(largeCopy2.position.x, largeCopy2.position.y);
    derivationLine2.stroke({ color: purple, width: 10 });
    const terminalLine1 = new PIXI.Graphics();
    terminalLine1.moveTo(underlineComplexTerminal.midPoint().x, underlineComplexTerminal.midPoint().y);
    terminalLine1.lineTo(terminal1c.position.x, terminal1c.position.y);
    terminalLine1.stroke({ color: green, width: 10 });

    const terminal2c = new TextChanger("c");
    const terminal3c = new TextChanger("c");
    terminal2c.pivot.set(0, terminal2c.height / 2);
    terminal2c.position.set(400, 1550);
    terminal3c.pivot.set(0, terminal3c.height / 2);
    terminal3c.position.set(2100, 1550);
    const fence1Derivation = new TextChanger("baaa*b");
    const fence2Derivation = new TextChanger("abbb*a");
    fence1Derivation.pivot.set(0, fence1Derivation.height / 2);
    fence1Derivation.position.set(1200, 1550);
    fence2Derivation.pivot.set(0, fence2Derivation.height / 2);
    fence2Derivation.position.set(2900, 1550);
    const terminalCover2 = new RectangleCover(terminal2c, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
    terminalCover2.position.set(terminal2c.position.x, terminal2c.position.y);
    const terminalCover3 = new RectangleCover(terminal3c, { randMult: 0.1, points: 20, width: 250, height: 180, fill: green });
    terminalCover3.position.set(terminal3c.position.x, terminal3c.position.y);
    const fence1Cover = new RectangleCover(fence1Derivation, { randMult: 0.1, points: 20, width: 800, height: 180 });
    fence1Cover.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
    const fence2Cover = new RectangleCover(fence2Derivation, { randMult: 0.1, points: 20, width: 800, height: 180 });
    fence2Cover.position.set(fence2Derivation.position.x, fence2Derivation.position.y);

    const derivation1Terminal = new UnderLine({ color: green });
    derivation1Terminal.setConfig(largeCopy1.transform(largeCopy1.curText, 0), largeCopy1.transform(largeCopy1.curText, 0));
    derivation1Terminal.position.set(largeCopy1.position.x, largeCopy1.position.y);
    const derivation1Fence = new UnderLine({ color: orange });
    derivation1Fence.setConfig(largeCopy1.transform(largeCopy1.curText, 11), largeCopy1.transform(largeCopy1.curText, 16));
    derivation1Fence.position.set(largeCopy1.position.x, largeCopy1.position.y);
    const derivation2Terminal = new UnderLine({ color: green });
    derivation2Terminal.setConfig(largeCopy2.transform(largeCopy2.curText, 0), largeCopy2.transform(largeCopy2.curText, 0));
    derivation2Terminal.position.set(largeCopy2.position.x, largeCopy2.position.y);
    const derivation2Fence = new UnderLine({ color: blue });
    derivation2Fence.setConfig(largeCopy2.transform(largeCopy2.curText, 2), largeCopy2.transform(largeCopy2.curText, 7));
    derivation2Fence.position.set(largeCopy2.position.x, largeCopy2.position.y);
    const derivation1TerminalLine = new PIXI.Graphics();
    derivation1TerminalLine.moveTo(derivation1Terminal.midPoint().x, derivation1Terminal.midPoint().y);
    derivation1TerminalLine.lineTo(terminal2c.position.x, terminal2c.position.y);
    derivation1TerminalLine.stroke({ color: green, width: 10 });
    const derivation1FenceLine = new PIXI.Graphics();
    derivation1FenceLine.moveTo(derivation1Fence.midPoint().x, derivation1Fence.midPoint().y);
    derivation1FenceLine.lineTo(fence1Derivation.position.x, fence1Derivation.position.y);
    derivation1FenceLine.stroke({ color: orange, width: 10 });
    const derivation2TerminalLine = new PIXI.Graphics();
    derivation2TerminalLine.moveTo(derivation2Terminal.midPoint().x, derivation2Terminal.midPoint().y);
    derivation2TerminalLine.lineTo(terminal3c.position.x, terminal3c.position.y);
    derivation2TerminalLine.stroke({ color: green, width: 10 });
    const derivation2FenceLine = new PIXI.Graphics();
    derivation2FenceLine.moveTo(derivation2Fence.midPoint().x, derivation2Fence.midPoint().y);
    derivation2FenceLine.lineTo(fence2Derivation.position.x, fence2Derivation.position.y);
    derivation2FenceLine.stroke({ color: blue, width: 10 });


    const fence1DerivationLeftTerm = new TextChanger("baa");
    const fence1DerivationMiddle = new TextChanger("aaa");
    const fence1DerivationRightTerm = new TextChanger("b");
    const fence2DerivationLeftTerm = new TextChanger("abb");
    const fence2DerivationMiddle = new TextChanger("");
    const fence2DerivationRightTerm = new TextChanger("a");
    fence1DerivationLeftTerm.pivot.set(0, fence1DerivationLeftTerm.height / 2);
    fence1DerivationLeftTerm.position.set(800, 2050);
    fence1DerivationMiddle.pivot.set(0, fence1DerivationMiddle.height / 2);
    fence1DerivationMiddle.position.set(1300, 2050);
    fence1DerivationRightTerm.pivot.set(0, fence1DerivationRightTerm.height / 2);
    fence1DerivationRightTerm.position.set(1700, 2050);
    fence2DerivationLeftTerm.pivot.set(0, fence2DerivationLeftTerm.height / 2);
    fence2DerivationLeftTerm.position.set(2400, 2050);
    fence2DerivationMiddle.pivot.set(0, fence2DerivationMiddle.height / 2);
    fence2DerivationMiddle.position.set(2850, 2050);
    fence2DerivationRightTerm.pivot.set(0, fence2DerivationRightTerm.height / 2);
    fence2DerivationRightTerm.position.set(3200, 2050);
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

    const derivation1LeftTerm = new UnderLine({ color: green });
    derivation1LeftTerm.setConfig(fence1Derivation.transform(fence1Derivation.curText, 0), fence1Derivation.transform(fence1Derivation.curText, 2));
    derivation1LeftTerm.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
    const derivation1FenceMiddle = new UnderLine({ color: yellow });
    derivation1FenceMiddle.setConfig(fence1Derivation.transform(fence1Derivation.curText, 3), fence1Derivation.transform(fence1Derivation.curText, 4));
    derivation1FenceMiddle.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
    const derivation1RightTerm = new UnderLine({ color: green });
    derivation1RightTerm.setConfig(fence1Derivation.transform(fence1Derivation.curText, 5), fence1Derivation.transform(fence1Derivation.curText, 5));
    derivation1RightTerm.position.set(fence1Derivation.position.x, fence1Derivation.position.y);
    const derivation2LeftTerm = new UnderLine({ color: green });
    derivation2LeftTerm.setConfig(fence2Derivation.transform(fence2Derivation.curText, 0), fence2Derivation.transform(fence2Derivation.curText, 2));
    derivation2LeftTerm.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
    const derivation2FenceMiddle = new UnderLine({ color: yellow });
    derivation2FenceMiddle.setConfig(fence2Derivation.transform(fence2Derivation.curText, 3), fence2Derivation.transform(fence2Derivation.curText, 4));
    derivation2FenceMiddle.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
    const derivation2RightTerm = new UnderLine({ color: green });
    derivation2RightTerm.setConfig(fence2Derivation.transform(fence2Derivation.curText, 5), fence2Derivation.transform(fence2Derivation.curText, 5));
    derivation2RightTerm.position.set(fence2Derivation.position.x, fence2Derivation.position.y);
    const derivation1LeftTermLine = new PIXI.Graphics();
    derivation1LeftTermLine.moveTo(derivation1LeftTerm.midPoint().x, derivation1LeftTerm.midPoint().y);
    derivation1LeftTermLine.lineTo(fence1DerivationLeftTerm.position.x, fence1DerivationLeftTerm.position.y);
    derivation1LeftTermLine.stroke({ color: green, width: 10 });
    const derivation1FenceMiddleLine = new PIXI.Graphics();
    derivation1FenceMiddleLine.moveTo(derivation1FenceMiddle.midPoint().x, derivation1FenceMiddle.midPoint().y);
    derivation1FenceMiddleLine.lineTo(fence1DerivationMiddle.position.x, fence1DerivationMiddle.position.y);
    derivation1FenceMiddleLine.stroke({ color: yellow, width: 10 });
    const derivation1RightTermLine = new PIXI.Graphics();
    derivation1RightTermLine.moveTo(derivation1RightTerm.midPoint().x, derivation1RightTerm.midPoint().y);
    derivation1RightTermLine.lineTo(fence1DerivationRightTerm.position.x, fence1DerivationRightTerm.position.y);
    derivation1RightTermLine.stroke({ color: green, width: 10 });
    const derivation2LeftTermLine = new PIXI.Graphics();
    derivation2LeftTermLine.moveTo(derivation2LeftTerm.midPoint().x, derivation2LeftTerm.midPoint().y);
    derivation2LeftTermLine.lineTo(fence2DerivationLeftTerm.position.x, fence2DerivationLeftTerm.position.y);
    derivation2LeftTermLine.stroke({ color: green, width: 10 });
    const derivation2FenceMiddleLine = new PIXI.Graphics();
    derivation2FenceMiddleLine.moveTo(derivation2FenceMiddle.midPoint().x, derivation2FenceMiddle.midPoint().y);
    derivation2FenceMiddleLine.lineTo(fence2DerivationMiddle.position.x, fence2DerivationMiddle.position.y);
    derivation2FenceMiddleLine.stroke({ color: yellow, width: 10 });
    const derivation2RightTermLine = new PIXI.Graphics();
    derivation2RightTermLine.moveTo(derivation2RightTerm.midPoint().x, derivation2RightTerm.midPoint().y);
    derivation2RightTermLine.lineTo(fence2DerivationRightTerm.position.x, fence2DerivationRightTerm.position.y);
    derivation2RightTermLine.stroke({ color: green, width: 10 });

    const connectingContainer = new PIXI.Container();
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
    fenceHighlightLeft.alpha = 1;
    fenceHighlightRight.alpha = 1;
    fenceHighlightOrange.alpha = 1;
    fenceHighlightBlue.alpha = 1;
    fenceHighlightYellow1.alpha = 1;
    fenceHighlightYellow2.alpha = 1;

    GS.derivationContainer = new PIXI.Container();

    GS.derivationContainer.addChild(coverFence);
    GS.derivationContainer.addChild(fenceExample);
    GS.derivationContainer.addChild(coverComplex);
    GS.derivationContainer.addChild(complex);

    GS.derivationContainer.addChild(connectingContainer);

    GS.derivationContainer.addChild(derivationLine1);
    GS.derivationContainer.addChild(derivationLine2);
    GS.derivationContainer.addChild(terminalLine1);
    GS.derivationContainer.addChild(underlineComplexDerivation);
    GS.derivationContainer.addChild(underlineComplexTerminal);

    GS.derivationContainer.addChild(largeCover1);
    GS.derivationContainer.addChild(largeCover2);
    GS.derivationContainer.addChild(terminalCover1);
    GS.derivationContainer.addChild(largeCopy1);
    GS.derivationContainer.addChild(largeCopy2);
    GS.derivationContainer.addChild(terminal1c);

    GS.derivationContainer.addChild(derivation1TerminalLine);
    GS.derivationContainer.addChild(derivation1FenceLine);
    GS.derivationContainer.addChild(derivation2TerminalLine);
    GS.derivationContainer.addChild(derivation2FenceLine);
    GS.derivationContainer.addChild(derivation1Terminal);
    GS.derivationContainer.addChild(derivation1Fence);
    GS.derivationContainer.addChild(derivation2Terminal);
    GS.derivationContainer.addChild(derivation2Fence);

    GS.derivationContainer.addChild(terminalCover2);
    GS.derivationContainer.addChild(terminalCover3);
    GS.derivationContainer.addChild(fence1Cover);
    GS.derivationContainer.addChild(fence2Cover);
    GS.derivationContainer.addChild(terminal2c);
    GS.derivationContainer.addChild(terminal3c);
    GS.derivationContainer.addChild(fence1Derivation);
    GS.derivationContainer.addChild(fence2Derivation);

    GS.derivationContainer.addChild(derivation1LeftTermLine);
    GS.derivationContainer.addChild(derivation1FenceMiddleLine);
    GS.derivationContainer.addChild(derivation1RightTermLine);
    GS.derivationContainer.addChild(derivation2LeftTermLine);
    GS.derivationContainer.addChild(derivation2FenceMiddleLine);
    GS.derivationContainer.addChild(derivation2RightTermLine);
    GS.derivationContainer.addChild(derivation1LeftTerm);
    GS.derivationContainer.addChild(derivation1FenceMiddle);
    GS.derivationContainer.addChild(derivation1RightTerm);
    GS.derivationContainer.addChild(derivation2LeftTerm);
    GS.derivationContainer.addChild(derivation2FenceMiddle);
    GS.derivationContainer.addChild(derivation2RightTerm);

    GS.derivationContainer.addChild(fence1LeftCover);
    GS.derivationContainer.addChild(fence1MiddleCover);
    GS.derivationContainer.addChild(fence1RightCover);
    GS.derivationContainer.addChild(fence2LeftCover);
    GS.derivationContainer.addChild(fence2MiddleCover);
    GS.derivationContainer.addChild(fence2RightCover);
    GS.derivationContainer.addChild(fence1DerivationLeftTerm);
    GS.derivationContainer.addChild(fence1DerivationMiddle);
    GS.derivationContainer.addChild(fence1DerivationRightTerm);
    GS.derivationContainer.addChild(fence2DerivationLeftTerm);
    GS.derivationContainer.addChild(fence2DerivationMiddle);
    GS.derivationContainer.addChild(fence2DerivationRightTerm);

    GS.derivationContainer.alpha = 0;
    GS.screen.addChild(GS.derivationContainer);
  }

  // [X] <(ab)*aa((a*b)|(b*a))> [Y]
  {
    const showCompressStates = selectStates(GS.mother, compressRegexNFA).map(s => s.tweenPop(60));
    const drawCompressEdges = selectEdges(GS.mother, compressRegexNFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showCompressNFA = delay(0).then(
      ...showCompressStates,
      delay(30).then(...drawCompressEdges)
    );
  }

  // First, we can break down the regular expression into constituent parts, which need to be read in sequence:
  // [X] <(ab)*> [A] <a> [B] <a> [C] <(a*b)|(b*a)> [Y]
  {
    const hideInsideEdge = GS.mother.edgeMap["compressX->compressY"].hideLabelTween(60, easings.easeInOutQuad)
      .during(fade([
        GS.mother.edgeMap["compressX->compressY"].edgeLine,
        GS.mother.edgeMap["compressX->compressY"].arrowGraphic,
      ], false))
      // This is needed so the fadeout doesn't show the edge line.
      .then(new ImmediateTween(() => GS.mother.edgeMap["compressX->compressY"].drawnAmount = 0));
    const showExpandedStates = selectStates(GS.mother, expandedLevel1NFA).map(s => s.tweenPop(60));
    const showExpandedEdges = selectEdges(GS.mother, expandedLevel1NFA).map(e => {
      return e.growEdgeTween(30, easings.easeInOutQuad)
        .during(e.showLabelTween(30, easings.easeInOutQuad));
    });
    GS.swapExpandedNFA = delay(0).then(
      ...showExpandedStates,
      delay(30).then(...showExpandedEdges)
    );
    GS.moveExpanded = delay(0).then(
      hideInsideEdge,
      new ValueTween(1300, 700, 60, easings.easeInOutQuad, (v) => {
        const nodes = selectStates(GS.mother, expandedLevel1NFA);
        nodes.forEach(n => n.moveTo({x: n.position.x, y: v}));
        selectEdges(GS.mother, expandedLevel1NFA).forEach(e => e.updateGraphic());
      }),
    );
  }

  // Take the first part, '(ab)*'. This is a simple loop that accepts any number of 'ab' pairs. We can represent this as a simple NFA:
  // [X] <a> [A] <b> [X], X starting and accepting.
  // We can then embed this in the larger NFA, using epsilon transitions to connect the transitions:
  {
    const showFirstStates = selectStates(GS.mother, firstExpandedNFA).map(s => s.tweenPop(60));
    const showFirstEdges = selectEdges(GS.mother, firstExpandedNFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showFirstNFA = delay(0).then(
      ...showFirstStates,
      delay(30).then(...showFirstEdges)
    );
    GS.hideFirstStartAccept = fade([
      GS.mother.nodes["first1"].entry,
      GS.mother.nodes["first1"].innerCircle,
    ], false);
    const hideFirstEdge = GS.mother.edgeMap["compressX->expandA"].hideLabelTween(60, easings.easeInOutQuad)
      .during(GS.mother.edgeMap["compressX->expandA"].hideEdgeTween(60, easings.easeInOutQuad));
    GS.showFirstEpsilons = delay(0).then(
      ...selectEdges(GS.mother, firstExpandedNFABridging).map(e => {
        return e.growEdgeTween(60, easings.easeInOutQuad)
          .during(e.showLabelTween(60, easings.easeInOutQuad));
      }),
      hideFirstEdge,
    );
  }

  // Next is the (a*b)|(b*a) part. Again, we can break this down into smaller parts, and make NFAs for each of them:
  // [X] <a> [X] <b> [Y] and [X] <b> [X] <a> [Y]
  // Then to form the pipe, simply use new starting and accepting states, and use epsilon transitions to allow one of the paths to be chosen:
  // Finally, we can connect all the parts together:
  {
    const showSecondP1States = selectStates(GS.mother, secondExpandedNFAP1).map(s => s.tweenPop(60));
    const showSecondP1Edges = selectEdges(GS.mother, secondExpandedNFAP1).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    const showSecondP2States = selectStates(GS.mother, secondExpandedNFAP2).map(s => s.tweenPop(60));
    const showSecondP2Edges = selectEdges(GS.mother, secondExpandedNFAP2).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showSecondPaths = delay(0).then(
      ...showSecondP1States,
      delay(30).then(...showSecondP1Edges),
      delay(15).then(...showSecondP2States),
      delay(45).then(...showSecondP2Edges),
    )
    GS.hideStartEnd = fade([
      GS.mother.nodes["secondi"].entry,
      GS.mother.nodes["secondj"].innerCircle,
      GS.mother.nodes["secondn"].entry,
      GS.mother.nodes["secondm"].innerCircle,
    ], false);
    const showStartEndStates = selectStates(GS.mother, secondExpandedNFAStartEnd).map(s => s.tweenPop(60));
    const showStartEndEdges = selectEdges(GS.mother, secondExpandedNFAStartEnd).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showSecondStartEnd = delay(0).then(
      ...showStartEndStates,
      delay(30).then(...showStartEndEdges),
    );
    GS.hideStartEndAgain = fade([
      GS.mother.nodes["seconds"].entry,
      GS.mother.nodes["seconde"].innerCircle,
    ], false);
    GS.growSecondEpsilons = delay(0).then(
      ...selectEdges(GS.mother, secondExpandedNFAEpsilons).map(e => {
        return e.growEdgeTween(60, easings.easeInOutQuad)
          .during(e.showLabelTween(60, easings.easeInOutQuad));
      }),
      GS.mother.edgeMap["expandC->compressY"].hideLabelTween(60, easings.easeInOutQuad),
      GS.mother.edgeMap["expandC->compressY"].hideEdgeTween(60, easings.easeInOutQuad),
    );
    const hideAllEdges = [
      ...selectEdges(GS.mother, firstExpandedNFA),
      ...selectEdges(GS.mother, firstExpandedNFABridging),
      ...selectEdges(GS.mother, secondExpandedNFAP1),
      ...selectEdges(GS.mother, secondExpandedNFAP2),
      ...selectEdges(GS.mother, secondExpandedNFAStartEnd),
      ...selectEdges(GS.mother, secondExpandedNFAEpsilons),
      ...selectEdges(GS.mother, expandedLevel1NFA),
      ...selectEdges(GS.mother, compressRegexNFA),
    ].map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
      .during(e.hideLabelTween(60, easings.easeInOutQuad)));
    const hideAllStates = [
      ...selectStates(GS.mother, firstExpandedNFA),
      ...selectStates(GS.mother, firstExpandedNFABridging),
      ...selectStates(GS.mother, secondExpandedNFAP1),
      ...selectStates(GS.mother, secondExpandedNFAP2),
      ...selectStates(GS.mother, secondExpandedNFAStartEnd),
      ...selectStates(GS.mother, secondExpandedNFAEpsilons),
      ...selectStates(GS.mother, expandedLevel1NFA),
      ...selectStates(GS.mother, compressRegexNFA),
    ].map(s => fade([s.graphic, s.separatedGraphic], false));
    GS.hideRegexNFA = delay(0).then(
      ...hideAllEdges,
      delay(30).then(...hideAllStates),
    );
  }

  // And we've got our NFA!

  // That's it really, we can convert Regular Expressions to NFAs, by using the following three rules:
  {
    const showRule1States = selectStates(GS.mother, rule1NFA).map(s => s.tweenPop(60));
    const showRule1Edges = selectEdges(GS.mother, rule1NFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    const showRule2States = selectStates(GS.mother, rule2NFA).map(s => s.tweenPop(60));
    const showRule2Edges = selectEdges(GS.mother, rule2NFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    const showRule3States = selectStates(GS.mother, rule3NFA).map(s => s.tweenPop(60));
    const showRule3Edges = selectEdges(GS.mother, rule3NFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });

    GS.showRules = delay(0).then(
      ...showRule1States,
      delay(30).then(...showRule1Edges),
      delay(15).then(...showRule2States),
      delay(45).then(...showRule2Edges),
      delay(30).then(...showRule3States),
      delay(60).then(...showRule3Edges),
    );

    const show1TranslateStates = selectStates(GS.mother, rule1NFATranslate).map(s => s.tweenPop(60));
    const show1TranslateEdges = selectEdges(GS.mother, rule1NFATranslate).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    const show2TranslateStates = selectStates(GS.mother, rule2NFATranslate).map(s => s.tweenPop(60));
    const show2TranslateEdges = selectEdges(GS.mother, rule2NFATranslate).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    const show3TranslateStates = selectStates(GS.mother, rule3NFATranslate).map(s => s.tweenPop(60));
    const show3TranslateEdges = selectEdges(GS.mother, rule3NFATranslate).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showTranslate = delay(0).then(
      ...show1TranslateStates,
      delay(30).then(...show1TranslateEdges),
      delay(120).then(...show2TranslateStates),
      delay(150).then(...show2TranslateEdges),
      delay(240).then(...show3TranslateStates),
      delay(270).then(...show3TranslateEdges),
    );

    const drawArrow = (arrow) => delay(0).then(
      new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        arrow.drawnAmount = v;
        arrow.updateGraphic();
      }),
      new ValueTween(0, 1, 15, easings.easeInOutQuad, (v) => {
        arrow.graphic.alpha = v;
      }),
    );
    const hideArrow = (arrow) => delay(0).then(
      new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
        arrow.drawnAmount = v;
        arrow.updateGraphic();
      }),
      delay(30).then(fade([arrow.graphic], false, 30)),
    );
    const downArrow1 = AbstractEdge.decide({ label: "G1", position: { x: 700, y: 1000 }, style: { radius: 0 } }, { label: "G2", position: { x: 700, y: 1400 }, style: { radius: 0 } }, { maxLineDist: 10 })
    const downArrow2 = AbstractEdge.decide({ label: "G1", position: { x: 2000, y: 1000 }, style: { radius: 0 } }, { label: "G2", position: { x: 2000, y: 1400 }, style: { radius: 0 } }, { maxLineDist: 10 })
    const downArrow3 = AbstractEdge.decide({ label: "G1", position: { x: 3150, y: 1000 }, style: { radius: 0 } }, { label: "G2", position: { x: 3150, y: 1400 }, style: { radius: 0 } }, { maxLineDist: 10 })
    downArrow1.graphic.alpha = 0;
    downArrow2.graphic.alpha = 0;
    downArrow3.graphic.alpha = 0;
    GS.screen.addChild(downArrow1.graphic);
    GS.screen.addChild(downArrow2.graphic);
    GS.screen.addChild(downArrow3.graphic);
    GS.drawArrows = delay(0).then(
      drawArrow(downArrow1),
      delay(120).then(drawArrow(downArrow2)),
      delay(240).then(drawArrow(downArrow3)),
    );


    const hideRuleStates = [
      ...selectStates(GS.mother, rule1NFA),
      ...selectStates(GS.mother, rule2NFA),
      ...selectStates(GS.mother, rule3NFA),
      ...selectStates(GS.mother, rule1NFATranslate),
      ...selectStates(GS.mother, rule2NFATranslate),
      ...selectStates(GS.mother, rule3NFATranslate),
    ].map(s => fade([s.graphic, s.separatedGraphic], false));
    const hideRuleEdges = [
      ...selectEdges(GS.mother, rule1NFA),
      ...selectEdges(GS.mother, rule2NFA),
      ...selectEdges(GS.mother, rule3NFA),
      ...selectEdges(GS.mother, rule1NFATranslate),
      ...selectEdges(GS.mother, rule2NFATranslate),
      ...selectEdges(GS.mother, rule3NFATranslate),
    ].map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
      .during(e.hideLabelTween(60, easings.easeInOutQuad)));
    GS.hideRules = delay(0).then(
      ...hideRuleEdges,
      hideArrow(downArrow1),
      hideArrow(downArrow2),
      hideArrow(downArrow3),
      delay(30).then(...hideRuleStates),
    );
  }

  // <h3>Can we go the other way?</h3>

  // We've shown that:

  // <ul>
  //   <li>NFAs and FAs are equivalent (They can accept the same languages)</li>
  //   <li>Regular expressions are at most as powerful as NFAs (Any language accepted by an regular expression can be represented by an NFA)</li>
  // </ul>
  {
    NFAGS.easings = GS.easings;
    GS.nfaContainer = new PIXI.Container();
    GS.nfaContainer.alpha = 0;
    GS.screen.addChild(GS.nfaContainer);
    const nfaApp = Screen.fakeApp(GS.nfaContainer, 4000, 2400);
    GS.nfaAnim = createFakeNFAEnvironment(nfaApp);
  }

  // < and =. Change to =.
  {
    const regexText = new TextChanger("Regex", {});
    const firstComp = new TextChanger("<", {});
    const NFAText = new TextChanger("NFA", {});
    const secondComp = new TextChanger("=", {});
    const DFAText = new TextChanger("DFA", {});
    regexText.position.set(1000, 1200);
    firstComp.position.set(1500, 1200);
    NFAText.position.set(2000, 1200);
    secondComp.position.set(2500, 1200);
    DFAText.position.set(3000, 1200);
    const texts = [regexText, firstComp, NFAText, secondComp, DFAText];
    const covers = texts.map(t => {
      t.pivot.set(0, t.height/2);
      t.alpha = 0;
      const c = new RectangleCover(t, {});
      c.position.set(t.position.x, t.position.y);
      c.alpha = 0;
      GS.screen.addChild(c);
      GS.screen.addChild(t);
      t.cover = c;
      return c;
    });

    const nfadfaEdge = AbstractEdge.decide(
      { label: "A", position: { x: 2200, y: 1000 }, style: { radius: 0 }},
      { label: "B", position: { x: 2800, y: 1000 }, style: { radius: 0 }},
      { edgeAnchor: { x: 0, y: -200 }, anchorOffsetMult: 0.5, maxLineDist: 8 },
    )
    nfadfaEdge.drawnAmount = 0;
    nfadfaEdge.updateGraphic();
    GS.screen.addChild(nfadfaEdge.graphic);
    const dfanfaEdge = AbstractEdge.decide(
      { label: "A", position: { x: 2800, y: 1400 }, style: { radius: 0 }},
      { label: "B", position: { x: 2200, y: 1400 }, style: { radius: 0 }},
      { edgeAnchor: { x: 0, y: 200 }, anchorOffsetMult: 0.5, maxLineDist: 8 },
    )
    dfanfaEdge.drawnAmount = 0;
    dfanfaEdge.updateGraphic();
    GS.screen.addChild(dfanfaEdge.graphic);

    const regexnfaEdge = AbstractEdge.decide(
      { label: "A", position: { x: 1200, y: 1000 }, style: { radius: 0 }},
      { label: "B", position: { x: 1800, y: 1000 }, style: { radius: 0 }},
      { edgeAnchor: { x: 0, y: -200 }, anchorOffsetMult: 0.5, maxLineDist: 8 },
    )
    regexnfaEdge.drawnAmount = 0;
    regexnfaEdge.updateGraphic();
    GS.screen.addChild(regexnfaEdge.graphic);
    const nfaregexEdge = AbstractEdge.decide(
      { label: "A", position: { x: 1800, y: 1400 }, style: { radius: 0 }},
      { label: "B", position: { x: 1200, y: 1400 }, style: { radius: 0 }},
      { edgeAnchor: { x: 0, y: 200 }, anchorOffsetMult: 0.5, maxLineDist: 8 },
    )
    nfaregexEdge.drawnAmount = 0;
    nfaregexEdge.updateGraphic();
    GS.screen.addChild(nfaregexEdge.graphic);

    GS.showTexts = fade([regexText, NFAText, DFAText, regexText.cover, NFAText.cover, DFAText.cover]);
    GS.showEqual = fade([secondComp, secondComp.cover]).during(
      nfadfaEdge.growEdgeTween(60, easings.easeInOutQuad)
    ).during(
      dfanfaEdge.growEdgeTween(60, easings.easeInOutQuad)
    );
    GS.showComp = fade([firstComp, firstComp.cover]).during(
      regexnfaEdge.growEdgeTween(60, easings.easeInOutQuad)
    );
    GS.swapComp = delay(0).then(
      firstComp.changeText("="),
      nfaregexEdge.growEdgeTween(60, easings.easeInOutQuad),
    );
    GS.hideAllTexts = fade([
      regexText, NFAText, DFAText, firstComp, secondComp,
      regexText.cover, NFAText.cover, DFAText.cover, firstComp.cover, secondComp.cover,
      nfaregexEdge.graphic, regexnfaEdge.graphic, nfadfaEdge.graphic, dfanfaEdge.graphic,
    ], false);
  }

  // But are they equivalent? Can we convert an NFA to a regular expression?

  // Take the previous example of NFAs that allowed regular expressions on their transitions.
  // Rather than trying to break apart these transitions into characters, let's go the other direction and try to compress the entire NFA into a single transition.
  {
    const showExampleStates = selectStates(GS.mother, exampleNFA).map(s => s.tweenPop(60));
    const showExampleEdges = selectEdges(GS.mother, exampleNFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showExampleNFAAgain = delay(0).then(
      new ImmediateTween(() => {
        // Move the mother graph and scale
        GS.mother.graph.position.set(-600, -300);
        GS.mother.graph.scale.set(0.9);
      }),
      ...showExampleStates,
      delay(30).then(...showExampleEdges),
    );
    const showResultStates = selectStates(GS.mother, resultNFA).map(s => s.tweenPop(60));
    const showResultEdges = selectEdges(GS.mother, resultNFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    const resultArrow = AbstractEdge.decide({ label: "R", position: { x: 2200, y: 1150 }, style: { radius: 0 } }, { label: "E", position: { x: 2600, y: 1150 }, style: { radius: 0 } }, { maxLineDist: 10 });
    resultArrow.graphic.alpha = 0;
    GS.screen.addChild(resultArrow.graphic);
    GS.showResultNFA = delay(0).then(
      ...showResultStates,
      delay(30).then(...showResultEdges),
      new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
        resultArrow.drawnAmount = v;
        resultArrow.updateGraphic();
      }),
      new ValueTween(0, 1, 15, easings.easeInOutQuad, (v) => {
        resultArrow.graphic.alpha = v;
      }),
    );
    const hideAllStates = [
      ...selectStates(GS.mother, exampleNFA),
      ...selectStates(GS.mother, resultNFA),
    ].map(s => fade([s.graphic, s.separatedGraphic], false));
    const hideAllEdges = [
      ...selectEdges(GS.mother, exampleNFA),
      ...selectEdges(GS.mother, resultNFA),
    ].map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
      .during(e.hideLabelTween(60, easings.easeInOutQuad)));
    GS.hideExampleAndResult = delay(0).then(
      ...hideAllEdges,
      delay(30).then(...hideAllStates),
      fade(resultArrow.graphic, false),
    ).then(new ImmediateTween(() => { // Reset the mother graph
      GS.mother.graph.position.set(0, 0);
      GS.mother.graph.scale.set(1);
    }));
  }

  // We can do this with two main operations:

  // <ul style="list-style-type: decimal;">
  //   <li>Consolidating transitions</li>
  //   <li>Removing states</li>
  // </ul>

  // <h4>Consolidating transitions</h4>

  // If we have two states ${addIcon('a')} and ${addIcon('b')} with multiple transitions between them, we can consolidate these transitions into a single transition, and join the labels with a pipe.
  {
    const showConsolidateStates = selectStates(GS.mother, consolidateOriginal).map(s => s.tweenPop(60));
    const showConsolidateEdges = selectEdges(GS.mother, consolidateOriginal).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showConsolidateNFA = delay(0).then(
      ...showConsolidateStates,
      delay(30).then(...showConsolidateEdges),
    );
    GS.mergeConsolidate = delay(0).then(
      new ValueTween({x:0,y:-300}, {x:0,y:0}, 60, GS.easings.easeInOutQuad, (v) => {
        GS.mother.edgeMap["consolidateA->consolidateB"].style.edgeAnchor = v;
        GS.mother.edgeMap["consolidateA->consolidateFakeB"].style.edgeAnchor = {...v, y: -v.y};
        GS.mother.edgeMap["consolidateA->consolidateB"].updateGraphic();
        GS.mother.edgeMap["consolidateA->consolidateFakeB"].updateGraphic();
      }),
      delay(45).then(new ValueTween(0, 1, 15, GS.easings.easeInOutQuad, (v) => {
        GS.mother.edgeMap["consolidateA->consolidateB"].graphic.alpha = 1 - v;
        GS.mother.edgeMap["consolidateA->consolidateFakeB"].graphic.alpha = 1 - v;
        GS.mother.edgeMap["consolidateFakeA->consolidateB"].graphic.alpha = v;
      }, () => {
        GS.mother.edgeMap["consolidateFakeA->consolidateB"].graphic.alpha = 0;
        GS.mother.edgeMap["consolidateFakeA->consolidateB"].drawnAmount = 1;
        GS.mother.edgeMap["consolidateFakeA->consolidateB"].updateGraphic();
      })),
    )
    const hideConsolidateNewStates = selectStates(GS.mother, consolidateNew).map(s => fade([s.graphic, s.separatedGraphic], false));
    const hideConsolidateNewEdges = selectEdges(GS.mother, consolidateNew).map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
      .during(e.hideLabelTween(60, easings.easeInOutQuad)));
    GS.hideConsolidateNFA = delay(0).then(
      ...hideConsolidateNewEdges,
      delay(30).then(...hideConsolidateNewStates),
    );
  }


  // <h4>Removing states</h4>

  // This is the much more complicated step.

  // Let's say we have some state which is not the starting state, and not accepting, and we want to remove it from the NFA.

  // This state could have both incoming and outgoing transitions, as well as loop transitions on the state itself.
  {
    const showMergeOriginalStates = selectStates(GS.mother, mergeOriginal).map(s => s.tweenPop(60));
    const showMergeOriginalEdges = selectEdges(GS.mother, mergeOriginal).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showMergeOriginal = delay(0).then(
      ...showMergeOriginalStates,
      delay(30).then(...showMergeOriginalEdges),
    );

    GS.highlightIncoming = delay(0).then(
      ...selectEdges(GS.mother, mergeOriginal).filter(e => e.from.label !== "mergeOriginalS")
        .map(e => e.colorEdgeTween(green, 30, GS.easings.easeInOutQuad)),
      delay(90).then(
        ...selectEdges(GS.mother, mergeOriginal).filter(e => e.from.label !== "mergeOriginalS")
          .map(e => e.colorEdgeTween(black, 30, GS.easings.easeInOutQuad)),
      )
    )
    GS.highlightOutgoing = delay(0).then(
      ...selectEdges(GS.mother, mergeOriginal).filter(e => e.to.label !== "mergeOriginalS")
        .map(e => e.colorEdgeTween(red, 30, GS.easings.easeInOutQuad)),
      delay(90).then(
        ...selectEdges(GS.mother, mergeOriginal).filter(e => e.to.label !== "mergeOriginalS")
          .map(e => e.colorEdgeTween(black, 30, GS.easings.easeInOutQuad)),
      )
    )
    GS.highlightLoop = delay(0).then(
      GS.mother.edgeMap["mergeOriginalS->mergeOriginalS"].colorEdgeTween(blue, 30, GS.easings.easeInOutQuad),
      delay(90).then(GS.mother.edgeMap["mergeOriginalS->mergeOriginalS"].colorEdgeTween(black, 30, GS.easings.easeInOutQuad)),
    )

    const stateMap = {
      "mergeOriginalS": {
        position: { x: 2000, y: 1200 },
        color: bg_dark,
      },
      "mergeOriginal1": {
        position: { x: 800, y: 700 },
        color: highlightColours[0],
      },
      "mergeOriginal2": {
        position: { x: 800, y: 1200 },
        color: highlightColours[1],
      },
      "mergeOriginal3": {
        position: { x: 800, y: 1900 },
        color: highlightColours[2],
      },
      "mergeOriginal5": {
        position: { x: 3200, y: 700 },
        color: highlightColours[4],
      },
      "mergeOriginal4": {
        position: { x: 3200, y: 1200 },
        color: highlightColours[3],
      },
      "mergeOriginalDupe3": {
        position: { x: 3200, y: 1900 },
        color: highlightColours[2],
      },
    }
    const copyColor = (c) => {
      return {
        ...c,
        red: c.red,
        green: c.green,
        blue: c.blue,
        alpha: c.alpha,
      }
    }
    GS.originalStateOriginalPositions = {};
    GS.moveOriginalStates = delay(0).then(
      ...selectStates(GS.mother, mergeOriginal).map(s => {
        GS.originalStateOriginalPositions[s.label] = {...s.position};
        return new ValueTween({...s.position}, stateMap[s.label].position, 60, easings.easeInOutQuad, (v) => {
          s.moveTo(v);
        });
      }),
      ...selectStates(GS.mother, mergeOriginal).map(s => {
        return new ValueTween(copyColor(s.style.fill), stateMap[s.label].color, 60, easings.easeInOutQuad, (v) => {
          s.style.fill = v;
          s.updateGraphic();
        });
      }),
      new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
        GS.mother.edgeMap["mergeOriginal3->mergeOriginalS"].style.edgeAnchor = {
          x: 200 * v,
          y: 0
        };
        GS.mother.edgeMap["mergeOriginalS->mergeOriginalDupe3"].style.edgeAnchor = {
          x: -200 * v,
          y: 0
        };
      }),
      repeatTween(() => {selectEdges(GS.mother, mergeOriginal).forEach(e => e.updateGraphic())}, 60)
    );
  }

  // To remove this state, we need to add additional transitions to the rest of the NFA, which essentially 'simulate' moving through this state.

  // Any path which goes through this state must use both an incoming and outgoing transition, since we didn't start or end on this state, and the path has the option of taking the loop transition 0 or more times.
  {
    const pointer = new NodePointer(GS.mother, GS.mother.nodes["mergeOriginal2"]);
    GS.movePointer = new ImmediateTween(() => {
      pointer.moveToNode(GS.mother.nodes["mergeOriginal3"]);
    })
      .then(fade(pointer))
      .then(moveBetween("mergeOriginal3", "mergeOriginalS", 60, GS.mother, pointer))
      .then(delay(30))
      .then(moveBetween("mergeOriginalS", "mergeOriginalS", 60, GS.mother, pointer))
      .then(moveBetween("mergeOriginalS", "mergeOriginalS", 60, GS.mother, pointer))
      .then(delay(30))
      .then(moveBetween("mergeOriginalS", "mergeOriginal5", 60, GS.mother, pointer))
      .then(delay(30))
      .then(fade(pointer, false))
    ;

    GS.movePointerAgain = new ImmediateTween(() => {
      // We've shifted the node.
      pointer.moveToNode(GS.mother.nodes["mergeOriginal2"]);
    })
      .then(fade(pointer))
      .then(moveBetween("mergeOriginal2", "mergeOriginalS", 60, GS.mother, pointer))
      .then(delay(30))
      .then(moveBetween("mergeOriginalS", "mergeOriginalS", 60, GS.mother, pointer))
      .then(moveBetween("mergeOriginalS", "mergeOriginalS", 60, GS.mother, pointer))
      .then(delay(30))
      .then(moveBetween("mergeOriginalS", "mergeOriginalDupe3", 60, GS.mother, pointer))
      .then(delay(30))
      .then(fade(pointer, false))

    const moveRegex = new TextChanger("B(X)*D");
    const moveRegexCover = new RectangleCover(moveRegex, {});
    moveRegex.alpha = 0;
    moveRegexCover.alpha = 0;
    moveRegex.pivot.set(0, moveRegex.height / 2);
    moveRegex.position.set(2000, 2000);
    moveRegexCover.position.set(2000, 2000);
    GS.screen.addChild(moveRegexCover);
    GS.screen.addChild(moveRegex);

    GS.showMoveRegex = fade([moveRegex, moveRegexCover]);
    GS.hideMoveRegex = fade([moveRegex, moveRegexCover], false);
  }

  // But we can write this as a regular expression! XY*Z represents reading X, then any number of Y, then Z.

  // So, to simulate all possible paths through this state, we can simply:

  // <ul style="list-style-type: decimal;">
  //   <li>Take every possible pairing of incoming and outgoing transitions</li>
  //   <li>Create the regular expression representing the incoming transition, loop transition repeated, then outgoing transition</li>
  //   <li>Set the start and end of this transition to be the start of the incoming transition and the end of the outgoing transition</li>
  // </ul>
  {
    const table = new Table({
      itemHeight: 400,
      itemWidth: 550,
      headerHeight: 400,
      headerWidth: 550,
      totalWidth: 2200,
      totalHeight: 1600,
    });
    table.resize(3, 3);
    table.pivot.set(table.width / 2, table.height / 2);
    table.position.set(1500, 1200);
    table.alpha = 0;
    GS.screen.addChild(table);

    table.getContainer(0, 0).background.alpha = 0.2;
    table.getContainer(1, 0).background.alpha = 0.2;
    table.getContainer(2, 0).background.alpha = 0.2;
    table.getContainer(3, 0).background.alpha = 0.2;
    table.getContainer(0, 1).background.alpha = 0.2;
    table.getContainer(0, 2).background.alpha = 0.2;
    table.getContainer(0, 3).background.alpha = 0.2;

    // Header row
    const allTableNFAs = [];
    const topLeft = new NFA();
    topLeft.import({
      states: [
        { name: "S", position: { x: 0, y: 0 }, style: { fill: bg_dark } },
      ],
      transitions: [
        { from: "S", to: "S", label: "X" },
      ]
    });
    topLeft.graph.position.set(0, 100);
    allTableNFAs.push(topLeft);
    table.getContainer(0, 0).addChild(topLeft.graph);

    const rows = [
      { name: "1", label: "A", fill: highlightColours[0] },
      { name: "2", label: "B", fill: highlightColours[1] },
      { name: "3", label: "C", fill: highlightColours[2] },
    ]
    const cols = [
      { name: "3", label: "D", fill: highlightColours[2] },
      { name: "4", label: "E", fill: highlightColours[3] },
      { name: "5", label: "F", fill: highlightColours[4] },
    ]

    const rowNFAs = rows.map(({ name, label, fill }, i) => {
      const nfa = new NFA();
      nfa.import({
        states: [
          { name: "S", position: { x: 300, y: 0 } },
          { name, position: { x: -300, y: 0 }, style: { fill } },
        ],
        transitions: [
          { from: name, to: "S", label },
        ]
      });
      allTableNFAs.push(nfa);
      table.getContainer(i+1, 0).addChild(nfa.graph);
    });
    const colNFAs = cols.map(({ name, label, fill }, i) => {
      const nfa = new NFA();
      nfa.import({
        states: [
          { name: "S", position: { x: -300, y: 0 } },
          { name, position: { x: 300, y: 0 }, style: { fill } },
        ],
        transitions: [
          { from: "S", to: name, label },
        ]
      });
      allTableNFAs.push(nfa);
      table.getContainer(0, i+1).addChild(nfa.graph);
    });
    const cellNFAs = rows.map((row, i) => cols.map((col, j) => {
      const nfa = new NFA();
      nfa.import({
        states: [
          { name: `R${row.name}`, position: { x: -300, y: 0 }, style: { fill: row.fill } },
          { name: `C${col.name}`, position: { x: 300, y: 0 }, style: { fill: col.fill } },
        ],
        transitions: [
          { from: `R${row.name}`, to: `C${col.name}`, label: `${row.label}(X)*${col.label}` },
        ]
      });
      Object.values(nfa.nodes).forEach(n => n.labelText.text = n.labelText.text.slice(1));
      allTableNFAs.push(nfa);
      table.getContainer(i+1, j+1).addChild(nfa.graph);
      return nfa;
    }));
    const cellAnims = cellNFAs.map((row, i) => row.map((nfa, j) => {
      Object.values(nfa.nodes).forEach(n => {
        n.graphic.alpha = 0;
        n.separatedGraphic.alpha = 0;
        n.actualFill = n.style.fill;
        n.style.fill = bg_dark;
        n.isLeft = n.label.startsWith("R");
        n.labelText.alpha = 0;
        n.updateGraphic();
      })
      nfa.edges.forEach(e => {
        e.drawnAmount = 0;
        e.updateGraphic();
      });
      return {
        create: delay(0).then(
          ...Object.values(nfa.nodes).map(n => n.tweenPop(60)),
          ...nfa.edges.map(e => e.showLabelTween(60, easings.easeInOutQuad)
          .during(e.growEdgeTween(60, easings.easeInOutQuad))
          ),
        ),
        start: delay(0).then(
          new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
            const start = Object.values(nfa.nodes).find(n => n.isLeft);
            start.style.fill = interpValue(bg_dark, start.actualFill, v);
            start.labelText.alpha = v;
            start.updateGraphic();
          }),
        ),
        end: delay(0).then(
          new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
            const end = Object.values(nfa.nodes).find(n => !n.isLeft);
            end.style.fill = interpValue(bg_dark, end.actualFill, v);
            end.labelText.alpha = v;
            end.updateGraphic();
          }),
        ),
      }
    }));

    const tableGraphScale = 0.5;
    allTableNFAs.forEach(nfa => {
      nfa.graph.scale.set(tableGraphScale);
      nfa.edges.forEach(e => e.labelBG.alpha = 1);
    });

    GS.showTable = delay(0).then(
      fade(table),
      fade(GS.mother.graph, false),
    )

    GS.drawGraphs = delay(0).then(
      cellAnims[0][0].create,
      delay(120).then(...cellAnims.flat().slice(1).map(a => a.create)),
    )

    GS.tableStarts = delay(0).then(
      ...cellAnims.flat().map(a => a.start),
    )

    GS.tableEnds = delay(0).then(
      ...cellAnims.flat().map(a => a.end),
    )

    GS.fadeTable = delay(0).then(
      fade(table, false),
      fade(GS.mother.graph),
    )
  }

  {
    GS.hideOldOriginalEdges = delay(0).then(
      ...selectEdges(GS.mother, mergeOriginal).map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
        .during(e.hideLabelTween(60, easings.easeInOutQuad)))
    );
    GS.drawNewOriginalEdges = delay(0).then(
      ...selectEdges(GS.mother, mergeNewTransitionsWithDupe).map(e => {
        return e.growEdgeTween(60, easings.easeInOutQuad)
          .during(e.showLabelTween(60, easings.easeInOutQuad));
      }),
      new ValueTween({ x: 2000, y: 1200 }, { x: 2000, y: 300 }, 60, GS.easings.easeInOutQuad, (v) => {
        GS.mother.nodes["mergeOriginalS"].moveTo(v);
      }),
    );

    GS.squishThrees = delay(0).then(
      new ValueTween({ x: 3200, y: 1900 }, { x: 2000, y: 1900 }, 60, GS.easings.easeInOutQuad, (v) => {
        GS.mother.nodes["mergeOriginalDupe3"].moveTo(v);
      }),
      new ValueTween({ x: 800, y: 1900 }, { x: 2000, y: 1900 }, 60, GS.easings.easeInOutQuad, (v) => {
        GS.mother.nodes["mergeOriginal3"].moveTo(v);
      }),
      new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
        GS.mother.edgeMap["mergeOriginal3->mergeOriginalDupe3"].style.edgeAnchor = interpValue(
          { x: 0, y: 0 },
          { x: 0, y: -500 },
          v,
        );
        GS.mother.edgeMap["mergeOriginal3->mergeOriginalDupe3"].style.anchorOffsetMult = interpValue(
          2,
          0.5,
          v,
        );
        GS.mother.edgeMap["mergeOriginal3->mergeOriginalDupe3"].updateGraphic();
      }),
      delay(45).then(fade([
        GS.mother.edgeMap["mergeOriginal3->mergeOriginalDupe3"].graphic,
      ], false, 15)),
      delay(45).then(
        new ImmediateTween(() => {
          selectEdges(GS.mother, mergeNewTransitionsWithoutDupe).forEach(e => {
            e.graphic.alpha = 0;
            e.drawnAmount = 1;
            e.updateGraphic();
          })
        }),
        fade(GS.mother.edgeMap["mergeOriginal3->mergeOriginal3"].graphic, true, 15),
      ),
      repeatTween(() => {
        selectEdges(GS.mother, mergeNewTransitionsWithDupe).forEach(e => e.updateGraphic());
        selectEdges(GS.mother, mergeNewTransitionsWithoutDupe).forEach(e => e.updateGraphic());
      }, 60),
    )

    GS.fadeS = fade([
      GS.mother.nodes["mergeOriginalS"].graphic,
      GS.mother.nodes["mergeOriginalS"].separatedGraphic,
    ], false);

    GS.fadeRest = delay(0).then(
      delay(30).then(...selectStates(GS.mother, mergeOriginal).map(s => fade([s.graphic, s.separatedGraphic], false))),
      ...selectEdges(GS.mother, mergeNewTransitionsWithDupe).map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
        .during(e.hideLabelTween(60, easings.easeInOutQuad))
      ),
      ...selectEdges(GS.mother, mergeNewTransitionsWithoutDupe).map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
        .during(e.hideLabelTween(60, easings.easeInOutQuad))
      )
    )
  }

  // What happens if we do this for all non-starting, non-accepting states? We'll be close to our goal, but not quite - we could have a few different accepting states, with transitions between eachother.
  // But to fix this, we can consolidate our accepting states into a single one using epsilon transitions, and then use our technique above.
  {
    const showMultipleStates = selectStates(GS.mother, multiAcceptNFA).map(s => s.tweenPop(60));
    const showMultipleEdges = selectEdges(GS.mother, multiAcceptNFA).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showMultiple = delay(0).then(
      ...showMultipleStates,
      delay(30).then(...showMultipleEdges),
    );

    const showMultipleFinalStates = selectStates(GS.mother, multiAcceptNFAExtraState).map(s => s.tweenPop(60));
    const showMultipleFinalEdges = selectEdges(GS.mother, multiAcceptNFAExtraState).map(e => {
      return e.growEdgeTween(60, easings.easeInOutQuad)
        .during(e.showLabelTween(60, easings.easeInOutQuad));
    });
    GS.showMultipleFinal = delay(0).then(
      ...showMultipleFinalStates,
      delay(30).then(...showMultipleFinalEdges),
      delay(30).then(...selectStates(GS.mother, multiAcceptNFA).map(s=>fade(s.innerCircle, false)))
    );
  }

  // This means we'll be left with one or two states - the starting and accepting states.
  {
    const fadeOthers = delay(0).then(
      delay(30).then(...selectStates(GS.mother, multiAcceptNFA).filter(s=>s.label!=="multiAcceptA").map(s=>fade([s.graphic, s.separatedGraphic], false))),
      ...selectEdges(GS.mother, multiAcceptNFA).concat(selectEdges(GS.mother, multiAcceptNFAExtraState)).map(e=>
        fade(e.graphic, false)
        .during(e.hideEdgeTween(60, easings.easeInOutQuad))
      ),
    );
    const shiftLeftStart = new ValueTween({ x: 1400, y: 1600 }, { x: 1200, y: 1000 }, 60, GS.easings.easeInOutQuad, (v) => {
      GS.mother.nodes["multiAcceptA"].moveTo(v);
    });
    const shiftLeftEnd = new ValueTween({ x: 3400, y: 1200 }, { x: 1200, y: 1000 }, 60, GS.easings.easeInOutQuad, (v) => {
      GS.mother.nodes["multiAcceptE"].moveTo(v);
    });
    const shiftRightStart = new ValueTween({ x: 1400, y: 1600 }, { x: 2400, y: 1000 }, 60, GS.easings.easeInOutQuad, (v) => {
      GS.mother.nodes["copyRightA"].moveTo(v);
    });
    const shiftRightEnd = new ValueTween({ x: 3400, y: 1200 }, { x: 3200, y: 1000 }, 60, GS.easings.easeInOutQuad, (v) => {
      GS.mother.nodes["copyRightE"].moveTo(v);
    });
    const fadeInStart = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      GS.mother.nodes["multiAcceptA"].innerCircle.alpha = v;
    });
    GS.copyAndShift = delay(0).then(
      fadeOthers,
      delay(30).then(
        shiftLeftStart,
        shiftLeftEnd,
        shiftRightStart,
        shiftRightEnd,
        fadeInStart,
        new ImmediateTween(() => {
          GS.mother.nodes["copyRightA"].graphic.alpha = 1;
          GS.mother.nodes["copyRightA"].separatedGraphic.alpha = 1;
          GS.mother.nodes["copyRightE"].graphic.alpha = 1;
          GS.mother.nodes["copyRightE"].separatedGraphic.alpha = 1;
        }),
        delay(50).then(fade([
          GS.mother.nodes["multiAcceptE"].graphic,
          GS.mother.nodes["multiAcceptE"].separatedGraphic,
        ], false, 10)),
      ),
    )

    GS.drawEdgesSplit = delay(0).then(
      ...selectEdges(GS.mother, splitNFATransitions).map(e => {
        return e.growEdgeTween(60, easings.easeInOutQuad)
          .during(e.showLabelTween(60, easings.easeInOutQuad));
      })
    )

  }

  // If we have a single state, then our only transition is a loop one. Sounds like a job for the kleene star!
  // Otherwise, we've got a start state and an accepting state, with a transition between them, and maybe some loops on either state. This is also pretty simple to write as a regular expression!
  {
    const rightRegex = new TextChanger("(X)*");
    const rightCover = new RectangleCover(rightRegex, {});
    const leftRegex = new TextChanger("(X)*Y(Z)*");
    const leftCover = new RectangleCover(leftRegex, {});
    GS.screen.addChild(rightCover);
    GS.screen.addChild(leftCover);
    GS.screen.addChild(rightRegex);
    GS.screen.addChild(leftRegex);
    rightCover.alpha = 0;
    leftCover.alpha = 0;
    rightRegex.alpha = 0;
    leftRegex.alpha = 0;
    rightRegex.position.set(1200, 1500);
    rightRegex.pivot.set(0, rightRegex.height/2);
    leftRegex.position.set(2800, 1500);
    leftRegex.pivot.set(0, leftRegex.height/2);
    rightCover.position.set(1200, 1500);
    leftCover.position.set(2800, 1500);

    GS.fadeRegexRight = fade([rightCover, rightRegex]);
    GS.fadeRegexLeft = fade([leftCover, leftRegex]);

    GS.hideAll = delay(0).then(
      delay(30).then(...[
          ...selectStates(GS.mother, multiAcceptNFA),
          ...selectStates(GS.mother, multiAcceptNFAExtraState),
          ...selectStates(GS.mother, copyRightNFA),
        ].map(s => fade([s.graphic, s.separatedGraphic], false)),
      ),
      ...selectEdges(GS.mother, splitNFATransitions).map(e => e.hideEdgeTween(60, easings.easeInOutQuad)
        .during(e.hideLabelTween(60, easings.easeInOutQuad))),
      fade([leftCover, leftRegex, rightCover, rightRegex], false),
    );
  }



  // Therefore all three of the structures we've looked at so far are equivalent. This is a pretty neat fact, don't you think?
  {
    const dfa = new DFA();
    dfa.import({
      states: [
        { name: "E", position: { x: -300, y: 0 }, starting: true, accepting: true },
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

    const regex = new TextChanger("a|((a((bc)+|(cb)+))+(a|ε))");
    regex.pivot.set(0, regex.height/2);
    regex.position.set(2000, 2200);
    const regexCover = new RectangleCover(regex, { points: 20, randMult: 0.1 });
    regex.alpha = 0;
    regexCover.alpha = 0;
    regexCover.position.set(2000, 2200);
    GS.screen.addChild(regexCover);
    GS.screen.addChild(regex);

    GS.drawAll3 = delay(0).then(
      delay(100).then(drawDFA),
      drawNFA,
      delay(45).then(fade([regex, regexCover])),
    );

    GS.fadeAll3 = delay(0).then(
      fade([dfa.graph, nfa.graph, regex, regexCover], false),
    );
  }

  // Regular expressions and Finite Automato use completely different approaches and structures to represent languages, but ultimately their abilities are the same.

  // Since this result is so special, the languages recognised by these machines are given a name - <span class="highlight-small highlight-green-long">Regular Languages</span>!
  {
    const title = new TextChanger("Regular Languages", { text: { fill: 0xffffff } } );
    title.pivot.set(0, title.height/2);
    title.scale.set(3);
    title.position.set(2000, 1200);
    title.alpha = 0;
    GS.screen.addChild(title);

    GS.fadeTitle = fade(title);

    const jiggle = char => new ValueTween(0, 1, 30, easings.easeOutCubic, (v) => {
      char.position.y = interpValue(char.startY, char.startY - 100, v);
    }, () => { char.startY = char.position.y }).then(new ValueTween(1, 0, 30, easings.easeInCubic, (v) => {
      char.position.y = interpValue(char.startY, char.startY - 100, v);
    }));
    GS.jiggleWord = () => delay(0).then(
      ...title.word.map((w, i) => delay(5*i).then(jiggle(w)))
    )
    const rainbowShift = offset => w => new ValueTween(360*13 + offset, offset, 360*13, easings.linear, (v) => {
      w.tint = rainbow(v % 360);
    });
    GS.rainbowText = delay(0).then(
      ...title.word.map((w, i) => rainbowShift(360 * i / title.word.length)(w))
    )
  }

  // Now that we have multiple ways to represent Regular languages, and have a good grasp of how they come about, we finally are ready to prove some really neat results about regular expressions, which is what this section is all about!

  TweenManager.add(delay(60)
    .then(fade([GS.gridContainer, GS.extraAcceptingContainer, GS.wordGroupsContainer]))
    .then(delay(60))
    .then(fade([GS.gridContainer, GS.extraAcceptingContainer, GS.wordGroupsContainer], false))
    .then(delay(60))
    .then(GS.showExampleNFA)
    .then(delay(60))
    .then(GS.fadeToRegex)
    .then(delay(60))
    .then(GS.showSimpleNFA)
    .then(delay(60))
    .then(GS.removeSimpleStartAccept)
    .then(GS.showSimpleEpsilonEdges)
    .then(delay(60))
    .then(GS.hideSampleMother)
    .then(delay(60))
    .then(fade(GS.derivationContainer))
    .then(delay(60))
    .then(fade(GS.derivationContainer, false))
    .then(delay(60))
    .then(GS.showCompressNFA)
    .then(delay(60))
    .then(GS.swapExpandedNFA)
    .then(GS.moveExpanded)
    .then(delay(60))
    .then(GS.showFirstNFA)
    .then(delay(60))
    .then(GS.hideFirstStartAccept)
    .then(GS.showFirstEpsilons)
    .then(delay(60))
    .then(GS.showSecondPaths)
    .then(delay(60))
    .then(GS.hideStartEnd)
    .then(GS.showSecondStartEnd)
    .then(delay(60))
    .then(GS.hideStartEndAgain)
    .then(GS.growSecondEpsilons)
    .then(delay(60))
    .then(GS.hideRegexNFA)
    .then(delay(60))
    .then(
      GS.showRules,
      delay(120).then(
        GS.showTranslate,
        GS.drawArrows,
      ),
    )
    .then(delay(60))
    .then(GS.hideRules)
    /*.then(fade(GS.nfaContainer))
    .then(GS.nfaAnim)
    .then(fade(GS.nfaContainer, false))*/
    .then(delay(60))
    .then(GS.showTexts)
    .then(delay(60))
    .then(GS.showEqual)
    .then(delay(60))
    .then(GS.showComp)
    .then(delay(60))
    .then(GS.swapComp)
    .then(delay(60))
    .then(GS.hideAllTexts)
    .then(delay(60))
    .then(GS.showExampleNFAAgain)
    .then(delay(60))
    .then(GS.showResultNFA)
    .then(delay(60))
    .then(GS.hideExampleAndResult)
    .then(delay(60))
    .then(GS.showConsolidateNFA)
    .then(delay(60))
    .then(GS.mergeConsolidate)
    .then(delay(60))
    .then(GS.hideConsolidateNFA)
    .then(delay(60))
    .then(GS.showMergeOriginal)
    .then(delay(60))
    .then(GS.highlightIncoming)
    .then(delay(60))
    .then(GS.highlightOutgoing)
    .then(delay(60))
    .then(GS.highlightLoop)
    .then(delay(60))
    .then(GS.moveOriginalStates)
    .then(delay(60))
    .then(GS.movePointer)
    .then(delay(60))
    .then(GS.movePointerAgain)
    .then(delay(60))
    .then(GS.showMoveRegex)
    .then(delay(60))
    .then(GS.showTable, GS.hideMoveRegex)
    .then(delay(60))
    .then(GS.drawGraphs)
    .then(delay(60))
    .then(GS.tableStarts)
    .then(delay(60))
    .then(GS.tableEnds)
    .then(delay(60))
    .then(GS.fadeTable)
    .then(delay(60))
    .then(GS.hideOldOriginalEdges)
    .then(delay(60))
    .then(GS.drawNewOriginalEdges)
    .then(delay(60))
    .then(GS.squishThrees)
    .then(delay(60))
    .then(GS.fadeS)
    .then(delay(60))
    .then(GS.fadeRest)
    .then(delay(60))
    .then(GS.showMultiple)
    .then(delay(60))
    .then(GS.showMultipleFinal)
    .then(delay(60))
    .then(GS.copyAndShift)
    .then(GS.drawEdgesSplit)
    .then(delay(60))
    .then(GS.fadeRegexRight)
    .then(delay(60))
    .then(GS.fadeRegexLeft)
    .then(delay(60))
    .then(GS.hideAll)
    .then(delay(60))
    .then(GS.drawAll3)
    .then(delay(60))
    .then(GS.fadeAll3)
    .then(delay(60))
    .then(
      GS.rainbowText,
      GS.fadeTitle,
      GS.jiggleWord(),
      delay(180).then(GS.jiggleWord()),
      delay(360).then(GS.jiggleWord()),
      delay(540).then(GS.jiggleWord()),
      delay(720).then(GS.jiggleWord()),
      delay(900).then(GS.jiggleWord()),
    )
  )
}

const unloader = () => {}

export default { loader, unloader }
