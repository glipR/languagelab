import { bg_dark, black, blue, green, orange, purple, red, white } from "../colours.js";
import DFA from "../dfa.js";
import NFA from "../nfa.js";
import Screen from "../screen.js";
import { DrawnBezier } from "../tools/drawnBezier.js";
import { RectangleCover } from "../tools/paper_cover.js";
import { delay, interpValue, randomDelay, TweenManager, ValueTween } from "../tween.js";
import { combineEasing, reverseEasing } from "../utils.js";
import { Word, NodePointer } from "../tools/word.js";

const GS = {
  starterDFA: new DFA(),
  curWordIndex: 0,
};

const gsc = 4;

const dfaEndingBJSON = {"states":[{"name":"S","position":{"x":gsc*278.9515624999999,"y":gsc*301.7953124999999},"accepting":true,"starting":true},{"name":"A","position":{"x":gsc*559.8124999999999,"y":gsc*167.19843749999995},"accepting":true,"starting":false},{"name":"B","position":{"x":gsc*547.9671874999999,"y":gsc*430.8609374999999},"accepting":false,"starting":false}],"alphabet":["a","b"],"transitions":[{"from":"S","to":"A","label":"a","style":{}},{"from":"S","to":"B","label":"b","style":{}},{"from":"B","to":"B","label":"a, b","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"A","to":"A","label":"a, b","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}}]}
const dfaAlphabeticJSON = {"states":[{"name":"A","position":{"x":gsc*99.2796875,"y":gsc*271.22343749999993},"accepting":true,"starting":true},{"name":"B","position":{"x":gsc*315.7015624999999,"y":gsc*149.56406249999998},"accepting":true,"starting":false},{"name":"C","position":{"x":gsc*454.634375,"y":gsc*260.81718749999993},"accepting":true,"starting":false},{"name":"D","position":{"x":gsc*298.5921874999999,"y":gsc*437.5968749999999},"accepting":true,"starting":false},{"name":"X","position":{"x":gsc*734.7031249999999,"y":gsc*250.84218749999994},"accepting":false,"starting":false}],"alphabet":["a","b","c","d"],"transitions":[{"from":"A","to":"A","label":"a","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"A","to":"B","label":"b","style":{}},{"from":"A","to":"C","label":"c","style":{}},{"from":"A","to":"D","label":"d","style":{}},{"from":"B","to":"C","label":"c","style":{}},{"from":"C","to":"D","label":"d","style":{}},{"from":"B","to":"B","label":"b","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"C","to":"C","label":"c","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"C","to":"X","label":"a, b","style":{}},{"from":"X","to":"X","label":"a, b, c, d","style":{"loopOffset":{"x":gsc*0,"y":gsc*-75}}},{"from":"B","to":"X","label":"a","style":{"edgeAnchor":{"x":gsc*9.431249999999977,"y":gsc*-83.59687499999998}}},{"from":"D","to":"X","label":"a, b, c","style":{"edgeAnchor":{"x":gsc*39.168750000000045,"y":gsc*46.556250000000034}}},{"from":"D","to":"D","label":"d","style":{"loopOffset":{"x":gsc*-32.292187499999955,"y":gsc*-81.65625}}},{"from":"B","to":"D","label":"d","style":{"edgeAnchor":{"x":gsc*25.832812499999932,"y":gsc*24.21562499999999}}}]};

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

const flashEasing = () => combineEasing([
  GS.easings.linear,
  (t) => 1,
  reverseEasing(GS.easings.linear),
], [
  1,
  0.5,
  1,
]);

const wordIndexPosition = ((i, word) => {
  return word[i].position;
});

const moveBetween = (l1, l2, duration, graph, nodePointer, wordPointer, word) => {
  const edge = graph.edgeMap[`${l1}->${l2}`];
  if (!edge) return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, () => {});
  const tween = new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
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
      if (wordPointer) tween.during(new ValueTween(curWordPos, newWordPos, duration, GS.easings.easeInOutQuad, (v) => {
        wordPointer.position.set(v.x, v.y);
      }));
      if (word) tween.during(new ValueTween(black, purple, duration, GS.easings.easeInOutQuad, (v) => {
        word[newWordIndex].style.fill = v;
      }));
    }
    if (word) tween.during(new ValueTween(purple, bg_dark, duration, GS.easings.easeInOutQuad, (v) => {
      word[oldWordIndex].style.fill = v;
    }));
  }
  return tween;
};

const resetWord = (word, wordPointer) => {
  const curWordPos = wordIndexPosition(GS.curWordIndex, word);
  GS.curWordIndex = 0;
  const newWordPos = wordIndexPosition(GS.curWordIndex, word);
  return new ValueTween(curWordPos, newWordPos, 60, GS.easings.easeInOutQuad, (v) => {
    wordPointer.position.set(v.x, v.y);
  }).during(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    word.forEach((c, i) => {
      c.style.fill = interpValue(GS.oldFills[i], black, v);
    });
  }, () => {
    GS.oldFills = word.map(w => w.style.fill);
  }));
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();

  // Fade in basic DFA
  // Turn one edge into multiple
  // Remove one edge
  // Show epsilon transition, move along transition without moving word pointer
  // Show multiple paths for a word, only one accepts

  // But first, show each rule separately.

  const splitStyle = {
    stroke: {
      width: 8,
    },
    maxLineDist: 30,
    smoothScaling: 0.1,
  }
  GS.splitLines = [
    new DrawnBezier(splitStyle, [{x:4000/3, y:-50}, {x:4000/3, y: 2450}], 1),
    new DrawnBezier(splitStyle, [{x:2*4000/3, y:-50}, {x:2*4000/3, y: 2450}], 1),
  ]
  GS.splitLines.forEach(sl => {
    sl.alpha = 0;
    GS.screen.addChild(sl);
  });

  const fadeLines = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    GS.splitLines.forEach(sl => sl.alpha = v);
  });
  const fadeOutLines = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.splitLines.forEach(sl => sl.alpha = v);
  });

  GS.firstDFA = new DFA();
  GS.firstDFA.fromJSON({
    nodes: {
      'S': { x: 300, y: 1200 },
      'A': { x: 900, y: 1200 },
      'B': { x: 900, y: 1700 },
    },
    edges: [
      { from: 'S', to: 'A', label: 'a' },
      { from: 'S', to: 'B', label: 'a' },
    ],
  });
  GS.firstDFA.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  });
  Object.values(GS.firstDFA.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  GS.screen.addChild(GS.firstDFA.graph);

  const showFirstDFA = delay(0).then(
    GS.firstDFA.nodes['S'].tweenPop(60),
    GS.firstDFA.nodes['A'].tweenPop(60),
    delay(30).then(GS.firstDFA.edgeMap['S->A'].growEdgeTween(60, GS.easings.easeInOutQuad)),
    delay(30).then(GS.firstDFA.edgeMap['S->A'].showLabelTween(60, GS.easings.easeInOutQuad)),
  );
  const moveAndShowFirstDFA = delay(0).then(
    GS.firstDFA.nodes['B'].tweenPop(60),
    delay(30).then(
      GS.firstDFA.edgeMap['S->B'].growEdgeTween(60, GS.easings.easeInOutQuad),
      GS.firstDFA.edgeMap['S->B'].showLabelTween(60, GS.easings.easeInOutQuad)
    ),
    new ValueTween(GS.firstDFA.nodes['A'].position, {x: 900, y: 700}, 60, GS.easings.easeInOutQuad, (v) => {
      GS.firstDFA.nodes['A'].position = v;
      GS.firstDFA.nodes['A'].updateGraphic();
      GS.firstDFA.edgeMap['S->A'].updateGraphic();
    }),
  );
  const fadeFirstDFA = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.firstDFA.graph.alpha = v;
  });

  GS.secondDFA = new DFA();
  GS.secondDFA.fromJSON({
    nodes: {
      'S': { x: 300+4000/3, y: 1200 },
      'A': { x: 900+4000/3, y: 700  },
      'B': { x: 900+4000/3, y: 1700 },
    },
    edges: [
      { from: 'S', to: 'A', label: 'a' },
      { from: 'S', to: 'B', label: 'b' },
    ],
  });
  GS.secondDFA.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  });
  Object.values(GS.secondDFA.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  GS.screen.addChild(GS.secondDFA.graph);

  const showSecondDFA = delay(0).then(
    GS.secondDFA.nodes['S'].tweenPop(60),
    GS.secondDFA.nodes['A'].tweenPop(60),
    GS.secondDFA.nodes['B'].tweenPop(60),
    delay(30).then(
      GS.secondDFA.edgeMap['S->A'].growEdgeTween(60, GS.easings.easeInOutQuad),
      GS.secondDFA.edgeMap['S->A'].showLabelTween(60, GS.easings.easeInOutQuad),
      GS.secondDFA.edgeMap['S->B'].growEdgeTween(60, GS.easings.easeInOutQuad),
      GS.secondDFA.edgeMap['S->B'].showLabelTween(60, GS.easings.easeInOutQuad),
    ),
  );

  const removeSecondEdge = GS.secondDFA.edgeMap['S->B'].hideEdgeTween(60, GS.easings.easeInOutQuad)
    .during(GS.secondDFA.edgeMap['S->B'].hideLabelTween(60, GS.easings.easeInOutQuad));

  const fadeSecondDFA = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.secondDFA.graph.alpha = v;
  });

  const thirdDFA = new DFA();
  thirdDFA.fromJSON({
    nodes: {
      '1': { x: 300+2*4000/3, y: 1600, start: true },
      '2': { x: 300+2*4000/3, y: 1000 },
      '3': { x: 900+2*4000/3, y: 1000  },
      '4': { x: 900+2*4000/3, y: 1600, accepting: true },
    },
    edges: [
      { from: '1', to: '2', label: 'a' },
      { from: '2', to: '2', label: 'a' },
      { from: '2', to: '3', label: 'ε' },
      { from: '3', to: '4', label: 'b' },
    ],
  });
  thirdDFA.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  });
  Object.values(thirdDFA.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  GS.screen.addChild(thirdDFA.graph);

  const showThirdDFA = delay(0).then(
    thirdDFA.nodes['1'].tweenPop(60),
    thirdDFA.nodes['2'].tweenPop(60),
    thirdDFA.nodes['3'].tweenPop(60),
    thirdDFA.nodes['4'].tweenPop(60),
    delay(30).then(
      thirdDFA.edgeMap['1->2'].growEdgeTween(60, GS.easings.easeInOutQuad),
      thirdDFA.edgeMap['1->2'].showLabelTween(60, GS.easings.easeInOutQuad),
      thirdDFA.edgeMap['2->2'].growEdgeTween(60, GS.easings.easeInOutQuad),
      thirdDFA.edgeMap['2->2'].showLabelTween(60, GS.easings.easeInOutQuad),
      thirdDFA.edgeMap['3->4'].growEdgeTween(60, GS.easings.easeInOutQuad),
      thirdDFA.edgeMap['3->4'].showLabelTween(60, GS.easings.easeInOutQuad),
    ),
  );

  const showEpsilonThird = thirdDFA.edgeMap['2->3'].growEdgeTween(60, GS.easings.easeInOutQuad)
    .during(thirdDFA.edgeMap['2->3'].showLabelTween(60, GS.easings.easeInOutQuad));

  const thirdWord = new Word("aab", { x: 4000*2/3 + 600, y: 300 }, { text: {...baseStyle}});
  GS.screen.addChild(thirdWord.wordCover);
  GS.screen.addChild(thirdWord.wordContainer);

  const thirdNodePointer = new NodePointer(thirdDFA, thirdDFA.nodes['1']);

  const showThirdWord = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    thirdWord.wordContainer.alpha = v;
    thirdWord.wordCover.alpha = v;
    thirdWord.wordPointer.alpha = v;
    thirdNodePointer.alpha = v;
  });

  const fadeThirdWord = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    thirdWord.wordContainer.alpha = v;
    thirdWord.wordCover.alpha = v;
    thirdWord.wordPointer.alpha = v;
    thirdNodePointer.alpha = v;
  });

  const moveThirdDFA =
    moveBetween('1', '2', 60, thirdDFA, thirdNodePointer, thirdWord.wordPointer, thirdWord.word)
    .then(moveBetween('2', '2', 60, thirdDFA, thirdNodePointer, thirdWord.wordPointer, thirdWord.word))
    .then(delay(60))
    .then(moveBetween('2', '3', 60, thirdDFA, thirdNodePointer, thirdWord.wordPointer, thirdWord.word))
    .then(delay(60))
    .then(moveBetween('3', '4', 60, thirdDFA, thirdNodePointer, thirdWord.wordPointer, thirdWord.word));


  const fadeThirdDFA = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    thirdDFA.graph.alpha = v;
  });

  GS.starterDFA = new DFA();
  GS.starterDFA.fromJSON({
    nodes: {
      A: { x: -1500, y: 0, start: true, accepting: false },
      B: { x: -750, y: -750, start: false, accepting: false },
      C: { x: -750, y: 750, start: false, accepting: false },
      D: { x: 750, y: -750, start: false, accepting: false },
      E: { x: 750, y: 750, start: false, accepting: false },
      F: { x: 1500, y: 0, start: false, accepting: true },
    },
    edges: [
      { from: 'A', to: 'B', label: 'a' },
      { from: 'A', to: 'C', label: 'b' },
      { from: 'B', to: 'D', label: 'a' },
      { from: 'B', to: 'C', label: 'b', style: { edgeAnchor: { x: 100, y: 0 } }},
      { from: 'C', to: 'B', label: 'a', style: { edgeAnchor: { x: -100, y: 0 } }},
      { from: 'C', to: 'E', label: 'b', style: { edgeAnchor: { x: 0, y: -200 } }},
      { from: 'D', to: 'F', label: 'a'},
      { from: 'D', to: 'E', label: 'b'},
      { from: 'E', to: 'B', label: 'a'},
      { from: 'E', to: 'C', label: 'b', style: { edgeAnchor: { x: 0, y: 200 } }},
      { from: 'F', to: 'F', label: 'a, b'},
      // Added later.
      { from: 'D', to: 'E', label: 'a'},
      { from: 'A', to: 'C', label: 'ε'},
      { from: 'B', to: 'D', label: 'ε'},
      { from: 'C', to: 'D', label: 'ε'},
    ],
  });
  GS.starterDFA.graph.position.set(2000, 1200);
  Object.values(GS.starterDFA.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  })
  GS.starterDFA.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  })
  GS.screen.addChild(GS.starterDFA.graph);

  const showDFANodes = randomDelay([
    ...Object.values(GS.starterDFA.nodes).map(node => (
      node.tweenPop(60)
    )),
  ]);
  const showDFAEdges = randomDelay([
    ...GS.starterDFA.edges.filter(e => {
      return e.style.edgeLabel != 'ε' && !(e.from.label === 'D' && e.to.label === 'E' && e.style.edgeLabel === 'a');
    }).map(edge => (
      edge.growEdgeTween(60, GS.easings.easeInOutQuad).during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
    )),
  ]);
  const removeEdge = (edge) => {
    return edge.hideEdgeTween(60, GS.easings.easeInOutQuad)
      .during(edge.hideLabelTween(60, GS.easings.easeInOutQuad));
  }
  const otherAC = GS.starterDFA.edges.find(e => e.style.edgeLabel == 'b' && e.from.label == 'A' && e.to.label == 'C');
  const otherDE = GS.starterDFA.edges.find(e => e.style.edgeLabel == 'b' && e.from.label == 'D' && e.to.label == 'E');
  const otherBD = GS.starterDFA.edges.find(e => e.style.edgeLabel == 'a' && e.from.label == 'B' && e.to.label == 'D');
  const ec = GS.starterDFA.edgeMap['E->C'];
  const cb = GS.starterDFA.edgeMap['C->B'];
  const removeEdges = [
    removeEdge(otherAC),
    removeEdge(GS.starterDFA.edgeMap['B->C']),
    removeEdge(otherBD),
    removeEdge(otherDE),
    removeEdge(GS.starterDFA.edgeMap['E->B']),
    removeEdge(GS.starterDFA.edgeMap['C->E']),
    removeEdge(GS.starterDFA.edgeMap['F->F']),
    new ValueTween({...ec.style.edgeAnchor}, {x: 0, y: 0}, 60, GS.easings.easeInOutQuad, (v) => {
        ec.style.edgeAnchor = v;
        ec.updateGraphic();
      }),
    new ValueTween({...cb.style.edgeAnchor}, {x: 0, y: 0}, 60, GS.easings.easeInOutQuad, (v) => {
        cb.style.edgeAnchor = v;
        cb.updateGraphic();
      }),
  ]
  const newStarter =
    GS.starterDFA.edgeMap['D->E'].growEdgeTween(60, GS.easings.easeInOutQuad)
    .during(GS.starterDFA.edgeMap['D->E'].showLabelTween(60, GS.easings.easeInOutQuad))
    .during(GS.starterDFA.edgeMap['D->E'].colorEdgeTween(red, 60, flashEasing()))
    .during(GS.starterDFA.edgeMap['D->F'].colorEdgeTween(red, 60, flashEasing()));

  const epsilonEdges =
    GS.starterDFA.edgeMap['A->C'].growEdgeTween(60, GS.easings.easeInOutQuad)
    .during(GS.starterDFA.edgeMap['A->C'].showLabelTween(60, GS.easings.easeInOutQuad))
    .during(GS.starterDFA.edgeMap['B->D'].growEdgeTween(60, GS.easings.easeInOutQuad).during(GS.starterDFA.edgeMap['B->D'].showLabelTween(60, GS.easings.easeInOutQuad)))
    .during(GS.starterDFA.edgeMap['C->D'].growEdgeTween(60, GS.easings.easeInOutQuad).during(GS.starterDFA.edgeMap['C->D'].showLabelTween(60, GS.easings.easeInOutQuad)))

  const highlightMultipleEdges = delay(0).then(
    GS.starterDFA.edgeMap['A->B'].colorEdgeTween(red, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['A->C'].colorEdgeTween(red, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['C->B'].colorEdgeTween(purple, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['C->D'].colorEdgeTween(purple, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['D->E'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['D->F'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad, false),
  ).then(delay(30)).then(
    GS.starterDFA.edgeMap['A->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['A->C'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['C->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['C->D'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['D->E'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad, false),
    GS.starterDFA.edgeMap['D->F'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad, false),
  );

  const starterWord = new Word("aba", { x: 2000, y: 125 }, { text: {...baseStyle} });
  GS.screen.addChild(starterWord.wordCover);
  GS.screen.addChild(starterWord.wordContainer);

  const nodePointers = Array.from({length: 3}, (_, k) => {
    const fillCol = [blue, purple, orange][k]
    return new NodePointer(GS.starterDFA, GS.starterDFA.nodes['A'], { fill: fillCol });
  });

  const fadeAllWordStuff = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    starterWord.wordContainer.alpha = v;
    starterWord.wordCover.alpha = v;
    starterWord.wordPointer.alpha = v;
    nodePointers.forEach(np => np.alpha = v);
  });

  const killPointer = (pointer, node, color=red) => {
    const tween = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      pointer.alpha = v;
    }, () => {
      // Flash red
      pointer.clear();
      pointer.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(color);
      pointer.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0 * gsc, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(color);
    })
    if (node) tween.during(node.tweenColor(color, 60, flashEasing()));
    return tween;
  }

  GS.curWordIndex = 0;
  const moveFirst =
  moveBetween('A', 'C', 60, GS.starterDFA, nodePointers[2], starterWord.wordPointer, starterWord.word)
  .then(moveBetween('C', 'D', 60, GS.starterDFA, nodePointers[2], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('D', 'E', 60, GS.starterDFA, nodePointers[2], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('E', 'C', 60, GS.starterDFA, nodePointers[2], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('C', 'B', 60, GS.starterDFA, nodePointers[2], starterWord.wordPointer, starterWord.word))
  .then(killPointer(nodePointers[2], GS.starterDFA.nodes['B']))
  .then(starterWord.resetWord());

  GS.curWordIndex = 0;
  const moveSecond =
  moveBetween('A', 'C', 60, GS.starterDFA, nodePointers[1], starterWord.wordPointer, starterWord.word)
  .then(moveBetween('C', 'D', 60, GS.starterDFA, nodePointers[1], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('D', 'F', 60, GS.starterDFA, nodePointers[1], starterWord.wordPointer, starterWord.word))
  .then(
    killPointer(nodePointers[1])
    .during(new ValueTween(white, red, 60, flashEasing(), (v) => {
      starterWord.wordCover.style.fill = v;
      starterWord.wordCover.updateGraphic();
    }))
  )
  .then(starterWord.resetWord());

  GS.curWordIndex = 0;
  const moveThird =
  moveBetween('A', 'C', 60, GS.starterDFA, nodePointers[0], starterWord.wordPointer, starterWord.word)
  .then(moveBetween('C', 'D', 60, GS.starterDFA, nodePointers[0], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('D', 'E', 60, GS.starterDFA, nodePointers[0], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('E', 'C', 60, GS.starterDFA, nodePointers[0], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('C', 'D', 60, GS.starterDFA, nodePointers[0], starterWord.wordPointer, starterWord.word))
  .then(moveBetween('D', 'F', 60, GS.starterDFA, nodePointers[0], starterWord.wordPointer, starterWord.word))
  .then(
    killPointer(nodePointers[0], null, green)
    .during(new ValueTween(white, green, 60, flashEasing(), (v) => {
      starterWord.wordCover.style.fill = v;
      starterWord.wordCover.updateGraphic();
    }))
  )
  .then(resetWord(starterWord.word, starterWord.wordPointer));

  GS.curWordIndex = 0;
  const fadeAllInitial = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.starterDFA.graph.alpha = v;
    starterWord.wordContainer.alpha = v;
    starterWord.wordCover.alpha = v;
    starterWord.wordPointer.alpha = v;
  });

  // TODO: Show original DFAs, then scale and fade in new ones.

  const originalNotStartingWithB = new DFA();
  originalNotStartingWithB.import(dfaEndingBJSON);
  originalNotStartingWithB.graph.pivot.set(2000, 1200);
  originalNotStartingWithB.graph.position.set(2000, 1200);
  Object.values(originalNotStartingWithB.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  originalNotStartingWithB.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  });
  GS.screen.addChild(originalNotStartingWithB.graph);

  const showOldStartingBNodes = randomDelay([
    ...Object.values(originalNotStartingWithB.nodes).map(node => (
      node.tweenPop(60)
    )),
  ]);
  const showOldStartingBEdges = randomDelay([
    ...originalNotStartingWithB.edges.map(edge => (
      edge.growEdgeTween(60, GS.easings.easeInOutQuad).during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
    )),
  ]);
  const highlightLoop = originalNotStartingWithB.edgeMap['B->B'].colorEdgeTween(red, 60, GS.easings.easeInOutQuad, true)
  const removeLoop = originalNotStartingWithB.edgeMap['B->B'].hideEdgeTween(60, GS.easings.easeInOutQuad)
    .during(originalNotStartingWithB.edgeMap['B->B'].hideLabelTween(60, GS.easings.easeInOutQuad))

  const hideAllB = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    originalNotStartingWithB.nodes['B'].graphic.alpha = v;
    originalNotStartingWithB.nodes['B'].separatedGraphic.alpha = v;
  }).during(originalNotStartingWithB.edgeMap['S->B'].hideEdgeTween(60, GS.easings.easeInOutQuad))
    .during(originalNotStartingWithB.edgeMap['S->B'].hideLabelTween(60, GS.easings.easeInOutQuad))
    .during(new ValueTween(gsc*167.19843749999995, 301*gsc, 60, GS.easings.easeInOutQuad, (v) => {
      originalNotStartingWithB.nodes['A'].moveTo({
        x: originalNotStartingWithB.nodes['A'].position.x,
        y: v,
      })
      originalNotStartingWithB.edges.forEach(edge => edge.updateGraphic());
    }))

  const fadeB = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    originalNotStartingWithB.graph.alpha = v;
  });

  const originalAlphabetic = new DFA();
  originalAlphabetic.import(dfaAlphabeticJSON);
  originalAlphabetic.graph.pivot.set(2000, 1200);
  originalAlphabetic.graph.position.set(2000, 1200);
  Object.values(originalAlphabetic.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  originalAlphabetic.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  });
  GS.screen.addChild(originalAlphabetic.graph);

  const alphabetic = new NFA();
  alphabetic.fromJSON({
    nodes: {
      'A': { x: -1500, y: 0, start: true, accepting: true },
      'B': { x: -500, y: 0, start: false, accepting: true },
      'C': { x: 500, y: 0, start: false, accepting: true },
      'D': { x: 1500, y: 0, start: false, accepting: true },
    },
    edges: [
      { from: 'A', to: 'A', label: 'a' },
      { from: 'A', to: 'B', label: 'ε' },
      { from: 'B', to: 'B', label: 'b' },
      { from: 'B', to: 'C', label: 'ε' },
      { from: 'C', to: 'C', label: 'c' },
      { from: 'C', to: 'D', label: 'ε' },
      { from: 'D', to: 'D', label: 'd' },
    ],
  });
  alphabetic.graph.position.set(2000, 2000);
  Object.values(alphabetic.nodes).forEach(node => {
    node.graphic.alpha = 0;
    node.separatedGraphic.alpha = 0;
  });
  alphabetic.edges.forEach(edge => {
    edge.drawnAmount = 0;
    edge.labelBG.alpha = 1;
    edge.updateGraphic();
  });
  GS.screen.addChild(alphabetic.graph);

  const showOldAlphabeticNodes = randomDelay([
    ...Object.values(originalAlphabetic.nodes).map(node => (
      node.tweenPop(60)
    )),
  ]);

  const showOldAlphabeticEdges = randomDelay([
    ...originalAlphabetic.edges.map(edge => (
      edge.growEdgeTween(60, GS.easings.easeInOutQuad).during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
    )),
  ]);

  const shiftAndScaleAlphabetic = new ValueTween(1, 0.7, 60, GS.easings.easeInOutQuad, (v) => {
    originalAlphabetic.graph.scale.set(v);
  }).during(new ValueTween(originalAlphabetic.graph.position, { x: 2000, y: 750 }, 60, GS.easings.easeInOutQuad, (v) => {
    originalAlphabetic.graph.position.set(v.x, v.y);
  }));

  const showAlphabeticNodes = randomDelay([
    ...Object.values(alphabetic.nodes).map(node => (
      node.tweenPop(60)
    )),
  ]);
  const showAlphabeticEdges = randomDelay([
    ...alphabetic.edges.map(edge => (
      edge.growEdgeTween(60, GS.easings.easeInOutQuad).during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
    )),
  ]);

  // TODO: Show simulation on alphabetic for aabbbccd
  const alphabetWord = new Word("aabbbd", { x: 2000, y: 1300 }, { text: {...baseStyle}});
  const alphabetNodePointer = new NodePointer(alphabetic, alphabetic.nodes['A']);
  GS.screen.addChild(alphabetWord.wordCover);
  GS.screen.addChild(alphabetWord.wordContainer);

  const showAlphabetWord = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    alphabetWord.wordContainer.alpha = v;
    alphabetWord.wordCover.alpha = v;
    alphabetWord.wordPointer.alpha = v;
    alphabetNodePointer.alpha = v;
  });

  const moveAlphabet =
    moveBetween('A', 'A', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word)
    .then(moveBetween('A', 'A', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('A', 'B', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('B', 'B', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('B', 'B', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('B', 'B', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('B', 'C', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('C', 'D', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))
    .then(moveBetween('D', 'D', 60, alphabetic, alphabetNodePointer, alphabetWord.wordPointer, alphabetWord.word))

  const fadeAlphabetic = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    alphabetic.graph.alpha = v;
    originalAlphabetic.graph.alpha = v;
    alphabetWord.wordContainer.alpha = v;
    alphabetWord.wordCover.alpha = v;
    alphabetWord.wordPointer.alpha = v;
    alphabetNodePointer.alpha = v;
  });

  TweenManager.add(delay(60)
    .then(fadeLines)
    .then(delay(60))
    .then(showFirstDFA, showSecondDFA, showThirdDFA)
    .then(delay(60))
    .then(moveAndShowFirstDFA)
    .then(delay(60))
    .then(removeSecondEdge)
    .then(delay(60))
    .then(showEpsilonThird)
    .then(delay(60))
    .then(showThirdWord)
    .then(delay(60))
    .then(moveThirdDFA)
    .then(delay(60))
    .then(fadeOutLines, fadeFirstDFA, fadeSecondDFA, fadeThirdDFA, fadeThirdWord)
    .then(delay(60))
    .then(showDFANodes)
    .then(delay(60))
    .then(showDFAEdges)
    .then(delay(60))
    .then(...removeEdges)
    .then(delay(60))
    .then(newStarter)
    .then(delay(60))
    .then(epsilonEdges)
    .then(delay(60))
    .then(highlightMultipleEdges)
    .then(delay(60))
    .then(fadeAllWordStuff)
    .then(delay(60))
    .then(moveFirst)
    .then(delay(60))
    .then(moveSecond)
    .then(delay(60))
    .then(moveThird)
    .then(delay(60))
    .then(fadeAllInitial)
    .then(delay(60))
    .then(showOldStartingBNodes)
    .then(delay(60))
    .then(showOldStartingBEdges)
    .then(delay(60))
    .then(highlightLoop)
    .then(delay(60))
    .then(removeLoop)
    .then(delay(60))
    .then(hideAllB)
    .then(delay(60))
    .then(fadeB)
    .then(delay(60))
    .then(showOldAlphabeticNodes)
    .then(delay(60))
    .then(showOldAlphabeticEdges)
    .then(delay(60))
    .then(shiftAndScaleAlphabetic)
    .then(delay(60))
    .then(showAlphabeticNodes)
    .then(delay(60))
    .then(showAlphabeticEdges)
    .then(delay(60))
    .then(showAlphabetWord)
    .then(delay(60))
    .then(moveAlphabet)
    .then(delay(60))
    .then(fadeAlphabetic)
  );
}

const unloader = () => {}

export default { loader, unloader };
