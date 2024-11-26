import { bg_dark, black, green, highlightColours, orange, purple, red } from "../colours.js";
import DFA from "../dfa.js";
import { Node } from "../graph.js";
import Screen from "../screen.js";
import { RectangleCover } from "../tools/paper_cover.js";
import { delay, interpValue, randomDelay, TweenManager, ValueTween } from "../tween.js";
import { combineEasing, reverseEasing } from "../utils.js";

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 128,
  fill: black,
  align: 'center',
};

const gsc = 4;

const flashEasing = () => combineEasing([
  GS.easings.easeInOutQuad,
  (t) => 1,
  reverseEasing(GS.easings.easeInOutQuad),
], [
  1,
  0.5,
  1,
]);

const wordIndexPosition = ((i, word) => {
  const localFirstCharPos = GS.screen.globalToLocal(word[i].getGlobalPosition().x, word[i].getGlobalPosition().y);
  return {
    x: localFirstCharPos.x,
    y: localFirstCharPos.y,
  }
});

const moveBetween = (l1, l2, duration, graph, nodePointer, wordPointer, word) => {
  const edge = graph.edgeMap[`${l1}->${l2}`];
  if (!edge) return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, () => {});
  const tween = new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
    const pos = edge.bezierEdgeInterp(v).position;
    if (nodePointer) nodePointer.position.set(pos.x, pos.y - 60 * gsc);
  })
  .during(edge.colorEdgeTween(purple, duration, flashEasing(), false));

  if (!!wordPointer || !!word) {
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

const GS = {
  curWordIndex: 0,
};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();

  TweenManager.add(delay(60)
    .then(q1())
    .then(delay(60))
    .then(q5())
    .then(delay(60))
    .then(q6())
  );
}

const q1 = () => {

  const tableContainer = new PIXI.Container();
  // 4 columns by 5 rows
  const ROW_HEIGHT = 350;
  const COLUMN_WIDTH = 350;
  const tableLines = new PIXI.Graphics();
  tableLines
    .moveTo(0, ROW_HEIGHT)
    .lineTo(COLUMN_WIDTH * 4, ROW_HEIGHT)
    .moveTo(0, ROW_HEIGHT * 2)
    .lineTo(COLUMN_WIDTH * 4, ROW_HEIGHT * 2)
    .moveTo(0, ROW_HEIGHT * 3)
    .lineTo(COLUMN_WIDTH * 4, ROW_HEIGHT * 3)
    .moveTo(0, ROW_HEIGHT * 4)
    .lineTo(COLUMN_WIDTH * 4, ROW_HEIGHT * 4)
    .moveTo(COLUMN_WIDTH, 0)
    .lineTo(COLUMN_WIDTH, ROW_HEIGHT * 5)
    .moveTo(COLUMN_WIDTH * 2, 0)
    .lineTo(COLUMN_WIDTH * 2, ROW_HEIGHT * 5)
    .moveTo(COLUMN_WIDTH * 3, 0)
    .lineTo(COLUMN_WIDTH * 3, ROW_HEIGHT * 5)
    .stroke({ color: black, width: 12 });
  const tableHeaders = [
    new PIXI.Text({ text: 'a', style: {...baseStyle, fill: black}}),
    new PIXI.Text({ text: 'b', style: {...baseStyle, fill: black}}),
    new PIXI.Text({ text: 'c', style: {...baseStyle, fill: black}}),
  ];
  const tableNodes = [
    new Node('A', { x: COLUMN_WIDTH * 0.5, y: ROW_HEIGHT * 1.5 }, { fill: highlightColours[0] }),
    new Node('B', { x: COLUMN_WIDTH * 0.5, y: ROW_HEIGHT * 2.5 }, { fill: highlightColours[1] }),
    new Node('C', { x: COLUMN_WIDTH * 0.5, y: ROW_HEIGHT * 3.5 }, { fill: highlightColours[2] }),
    new Node('D', { x: COLUMN_WIDTH * 0.5, y: ROW_HEIGHT * 4.5 }, { fill: highlightColours[3] }),
    new Node('B', { x: COLUMN_WIDTH * 1.5, y: ROW_HEIGHT * 1.5 }, { fill: highlightColours[1] }),
    new Node('B', { x: COLUMN_WIDTH * 2.5, y: ROW_HEIGHT * 1.5 }, { fill: highlightColours[1] }),
    new Node('B', { x: COLUMN_WIDTH * 3.5, y: ROW_HEIGHT * 1.5 }, { fill: highlightColours[1] }),
    new Node('C', { x: COLUMN_WIDTH * 1.5, y: ROW_HEIGHT * 2.5 }, { fill: highlightColours[2] }),
    new Node('C', { x: COLUMN_WIDTH * 2.5, y: ROW_HEIGHT * 2.5 }, { fill: highlightColours[2] }),
    new Node('C', { x: COLUMN_WIDTH * 3.5, y: ROW_HEIGHT * 2.5 }, { fill: highlightColours[2] }),
    new Node('D', { x: COLUMN_WIDTH * 1.5, y: ROW_HEIGHT * 3.5 }, { fill: highlightColours[3] }),
    new Node('D', { x: COLUMN_WIDTH * 2.5, y: ROW_HEIGHT * 3.5 }, { fill: highlightColours[3] }),
    new Node('D', { x: COLUMN_WIDTH * 3.5, y: ROW_HEIGHT * 3.5 }, { fill: highlightColours[3] }),
    new Node('A', { x: COLUMN_WIDTH * 1.5, y: ROW_HEIGHT * 4.5 }, { fill: highlightColours[0] }),
    new Node('A', { x: COLUMN_WIDTH * 2.5, y: ROW_HEIGHT * 4.5 }, { fill: highlightColours[0] }),
    new Node('A', { x: COLUMN_WIDTH * 3.5, y: ROW_HEIGHT * 4.5 }, { fill: highlightColours[0] }),
  ]
  const entryBG = (x, y) => new PIXI.Graphics().rect(x * COLUMN_WIDTH, y * ROW_HEIGHT, COLUMN_WIDTH, ROW_HEIGHT).fill(purple);
  const entryBackgrounds = {
    "0-0": entryBG(0, 0),
    "0-1": entryBG(0, 1),
    "0-2": entryBG(0, 2),
    "0-3": entryBG(0, 3),
    "0-4": entryBG(0, 4),
    "1-0": entryBG(1, 0),
    "1-1": entryBG(1, 1),
    "1-2": entryBG(1, 2),
    "1-3": entryBG(1, 3),
    "1-4": entryBG(1, 4),
    "2-0": entryBG(2, 0),
    "2-1": entryBG(2, 1),
    "2-2": entryBG(2, 2),
    "2-3": entryBG(2, 3),
    "2-4": entryBG(2, 4),
    "3-0": entryBG(3, 0),
    "3-1": entryBG(3, 1),
    "3-2": entryBG(3, 2),
    "3-3": entryBG(3, 3),
    "3-4": entryBG(3, 4),
  }
  const tablePaper = new RectangleCover(tableLines, {points: 24, randMult: 0.1});
  tablePaper.position.set(COLUMN_WIDTH * 2, ROW_HEIGHT * 2.5);
  tableContainer.addChild(tablePaper);
  tableHeaders.forEach((t, i) => {
    t.anchor.set(0.5, 0.5);
    t.position.set(COLUMN_WIDTH * (i + 1.5), ROW_HEIGHT / 2);
    tableContainer.addChild(t);
  });
  Object.values(entryBackgrounds).forEach(bg => {
    bg.alpha = 0;
    tableContainer.addChild(bg)
  });
  tableNodes.forEach(n => {
    tableContainer.addChild(n.graphic);
    n.graphic.alpha = (n.position.x === COLUMN_WIDTH * 0.5) ? 1 : 0;
  });
  tableContainer.addChild(tableLines);
  GS.tableContainer = tableContainer;
  tableContainer.position.set(300, 300);
  GS.screen.addChild(tableContainer);
  tableContainer.alpha = 0;

  GS.graph = new DFA();
  GS.graph.fromJSON({
    nodes: {
      A: { x: 0, y: 0, start: true, accepting: false },
      B: { x: 1000, y: 0, start: false, accepting: true },
      C: { x: 1000, y: 1000, start: false, accepting: true },
      D: { x: 0, y: 1000, start: false, accepting: false },
    },
    edges: [
      { from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 0, y: -250, } } },
      { from: 'A', to: 'B', label: 'b' },
      { from: 'A', to: 'B', label: 'c', style: { edgeAnchor: { x: 0, y: 250, } } },
      { from: 'B', to: 'C', label: 'a', style: { edgeAnchor: { x: 250, y: 0, } } },
      { from: 'B', to: 'C', label: 'b' },
      { from: 'B', to: 'C', label: 'c', style: { edgeAnchor: { x: -250, y: 0, } } },
      { from: 'C', to: 'D', label: 'a', style: { edgeAnchor: { x: 0, y: 250, } } },
      { from: 'C', to: 'D', label: 'b' },
      { from: 'C', to: 'D', label: 'c', style: { edgeAnchor: { x: 0, y: -250, } } },
      { from: 'D', to: 'A', label: 'a', style: { edgeAnchor: { x: 250, y: 10, } } },
      { from: 'D', to: 'A', label: 'b' },
      { from: 'D', to: 'A', label: 'c', style: { edgeAnchor: { x: -250, y: -10, } } },
      { from: 'A', to: 'B', label: 'a, b, c' },
      { from: 'B', to: 'C', label: 'a, b, c' },
      { from: 'C', to: 'D', label: 'a, b, c' },
      { from: 'D', to: 'A', label: 'a, b, c' },
    ]
  });
  GS.graph.graph.position.set(2500, 700)
  Object.values(GS.graph.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  });
  GS.graph.edges.forEach(e => {
    e.drawnAmount = 0;
    e.updateGraphic();
  });
  GS.screen.addChild(GS.graph.graph);

  const growEdge = (x, y) => {
    const s1 = GS.graph.nodes["ABCD"[y]];
    const edge = GS.graph.edges.find(e => e.from.label === s1.label && e.style.edgeLabel.includes("abc"[x]) && e.style.edgeLabel.length === 1);
    const bg = entryBackgrounds[`${x+1}-${y+1}`];

    return edge.growEdgeTween(60, GS.easings.easeInOutQuad)
      .during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
      .during(new ValueTween(0, 1, 60, flashEasing(), (v) => { bg.alpha = v } ));
  }

  const growTweens = [];
  for (let i=0; i<3; i++) {
    for (let j=0; j<4; j++) {
      growTweens.push(delay(100*j + 20*i).then(growEdge(i, j)));
    }
  }

  const squishEdge = (edge) => {
    const fading = new ValueTween(1, 0, 60, (t) => t < 0.9 ? 0 : (t - 0.9) / 0.1, (v) => {
      edge.graphic.alpha = v;
    });
    if (edge.style.edgeAnchor) {
      return new ValueTween({...edge.style.edgeAnchor}, { x: 0, y: 0 }, 60, GS.easings.easeInElastic, (v) => {
        edge.style.edgeAnchor = v;
        edge.updateGraphic();
      }).during(fading);
    } else {
      return fading;
    }
  }
  const squishTweens = [];
  for (let j=0; j<4; j++) {
    const e = GS.graph.edges.find(e => e.from.label === "ABCD"[j] && e.style.edgeLabel.length !== 1);
    e.graphic.alpha = 0;
    e.labelBG.alpha = 1;
    e.drawnAmount = 0;
    e.updateGraphic();
    for (let i=0; i<3; i++) {
      const s1 = GS.graph.nodes["ABCD"[j]];
      const edge = GS.graph.edges.find(e => e.from.label === s1.label && e.style.edgeLabel.includes("abc"[i]) && e.style.edgeLabel.length === 1);
      squishTweens.push(delay(20*j).then(squishEdge(edge)));
    }
    squishTweens.push(delay(20*j+60*0.9).then(new ValueTween(0, 1, 60 * 0.1, GS.easings.linear, (v) => {
      e.graphic.alpha = v;
    }, () => {
      e.drawnAmount = 1;
      e.updateGraphic();
    })));
  }

  const fadeGraphNodes = Object.values(GS.graph.nodes).map(n => n.tweenPop(60));
  const fadeTable = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    tableContainer.alpha = v;
  });
  const fadeEntryNodes = Object.values(tableNodes.map(n => {
    return new ValueTween(n.graphic.alpha, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.graphic.alpha = v;
    });
  }))
  const fadeOut = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    tableContainer.alpha = v;
    GS.graph.graph.alpha = v;
  });

  return delay(0)
    .then(...fadeGraphNodes)
    .then(delay(60))
    .then(fadeTable)
    .then(delay(60))
    .then(...fadeEntryNodes)
    .then(delay(60))
    .then(...growTweens)
    .then(delay(60))
    .then(...squishTweens)
    .then(delay(60))
    .then(fadeOut);
};

const q5 = () => {
  // Show the A and B DFAs
  // Show the product states
  // Show the start nodes
  // Simulate a step of the A/B DFAs, then grow an edge for that movement
  // Grow all edges
  // Simulate for a word
  // Landing in a union accepting node, fade in accepting states.

  const dfaA = new DFA();
  dfaA.fromJSON({
    nodes: {
      A: { x: 0, y: 0, start: true, accepting: false },
      B: { x: 0, y: 1000, start: false, accepting: true },
    },
    edges: [
      { from: 'A', to: 'B', label: 'a, b', style: { edgeAnchor: { x: 175, y: 0, } } },
      { from: 'B', to: 'A', label: 'a', style: { edgeAnchor: { x: -175, y: 0, } } },
      { from: 'B', to: 'B', label: 'b', style: { loopOffset: { x: 0, y: 400 } } },
    ]
  });
  dfaA.graph.position.set(500, 1000);
  dfaA.edges.forEach(e => {
    e.labelBG.alpha = 1;
  });
  dfaA.graph.alpha = 0;
  GS.screen.addChild(dfaA.graph);

  const fadeA = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    dfaA.graph.alpha = v;
  });

  const dfaB = new DFA();
  dfaB.fromJSON({
    nodes: {
      1: { x: 0, y: 0, start: true, accepting: false },
      2: { x: 1000, y: 0, start: false, accepting: true },
      3: { x: 2000, y: 0, start: false, accepting: false },
    },
    edges: [
      { from: '1', to: '1', label: 'a' },
      { from: '1', to: '2', label: 'b' },
      { from: '2', to: '2', label: 'a', style: { loopOffset: { x: 0, y: -200 } } },
      { from: '2', to: '3', label: 'b' },
      { from: '3', to: '3', label: 'a' },
      { from: '3', to: '1', label: 'b', style: { edgeAnchor: { x: 0, y: -550 } } },
    ]
  });
  dfaB.graph.position.set(1250, 600);
  dfaB.edges.forEach(e => {
    e.labelBG.alpha = 1;
  });
  dfaB.graph.alpha = 0;
  GS.screen.addChild(dfaB.graph);

  const fadeB = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    dfaB.graph.alpha = v;
  });

  const dfaProduct = new DFA();
  dfaProduct.fromJSON({
    nodes: {
      'A-1': { x: 0, y: 0, start: true, accepting: false },
      'A-2': { x: 1000, y: 0, start: false, accepting: true },
      'A-3': { x: 2000, y: 0, start: false, accepting: false },
      'B-1': { x: 0, y: 1000, start: false, accepting: true },
      'B-2': { x: 1000, y: 1000, start: false, accepting: true },
      'B-3': { x: 2000, y: 1000, start: false, accepting: true },
    },
    edges: [
      { from: 'A-1', to: 'B-1', label: 'a', style: { edgeAnchor: { x: -150, y: -10, } } },
      { from: 'A-1', to: 'B-2', label: 'b'},
      { from: 'A-2', to: 'B-2', label: 'a', style: { edgeAnchor: { x: -150, y: -10, } } },
      { from: 'A-2', to: 'B-3', label: 'b'},
      { from: 'A-3', to: 'B-3', label: 'a', style: { edgeAnchor: { x: -150, y: -10, } } },
      { from: 'A-3', to: 'B-1', label: 'b', style: { labelRatio: 0.2 }},
      { from: 'B-1', to: 'A-1', label: 'a', style: { edgeAnchor: { x: 150, y: 0, } } },
      { from: 'B-1', to: 'B-2', label: 'b'},
      { from: 'B-2', to: 'A-2', label: 'a', style: { edgeAnchor: { x: 150, y: 0, } }},
      { from: 'B-2', to: 'B-3', label: 'b'},
      { from: 'B-3', to: 'A-3', label: 'a', style: { edgeAnchor: { x: 150, y: 0, } }},
      { from: 'B-3', to: 'B-1', label: 'b', style: { edgeAnchor: { x: 0, y: 500, } }},
    ]
  });
  dfaProduct.graph.position.set(1250, 1000);
  GS.screen.addChild(dfaProduct.graph);

  Object.values(dfaProduct.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
    n.entry.alpha = 0;
    n.innerCircle.alpha = 0;
  });
  dfaProduct.edges.forEach(e => {
    e.drawnAmount = 0;
    e.labelBG.alpha = 1;
    e.updateGraphic();
  });

  const productNodes = Object.values(dfaProduct.nodes).map(n => n.tweenPop(60));
  const firstEdge = dfaProduct.edgeMap['A-1->B-2'];

  const nodePointers = Array.from({length: 3}).map(() => {
    const nodePointer = new PIXI.Graphics();
    nodePointer.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(orange);
    nodePointer.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(orange);
    nodePointer.position.set(dfaA.nodes['A'].position.x, dfaA.nodes['A'].position.y - 60 * gsc);
    nodePointer.alpha = 0;
    return nodePointer;
  });
  dfaA.graph.addChild(nodePointers[0]);
  dfaB.graph.addChild(nodePointers[1]);
  dfaProduct.graph.addChild(nodePointers[2]);

  const nodeFade = nodePointers.map(np => new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    np.alpha = v;
  }));
  const nodeFadeOut = nodePointers.map(np => new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    np.alpha = v;
  }));

  const moveToB = moveBetween('A', 'B', 60, dfaA, nodePointers[0]);
  const moveTo2 = moveBetween(1, 2, 60, dfaB, nodePointers[1]);
  const moveToB2 = moveBetween('A-1', 'B-2', 60, dfaProduct, nodePointers[2]);

  const growingAnims = {};
  Object.entries(dfaProduct.edgeMap).map(([key, edge]) => {
    growingAnims[key] = edge.growEdgeTween(60, GS.easings.easeInOutQuad)
      .during(edge.showLabelTween(60, GS.easings.easeInOutQuad))
  });

  const startFades = Object.values(dfaProduct.nodes).filter(n => n.style.isEntry).map(n => {
    return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.entry.alpha = v;
    });
  });
  const acceptingFades = Object.values(dfaProduct.nodes).filter(n => n.style.doubleBorder).map(n => {
    return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
    }).during(new ValueTween(bg_dark, green, 60, flashEasing(), (v) => {
      n.style.fill = v;
      n.updateGraphic();
    }));
  });

  const word_text = "baabab";
  const word = word_text.split('').map(c => new PIXI.Text(c, {...baseStyle}));
  const wordContainer = new PIXI.Container();
  const wordWidth = 20 * gsc;
  word.forEach((c, i) => {
    c.anchor.set(0, 1);
    c.position.set((i == 0) ? 0 : (word[i-1].position.x + wordWidth), 0);
    wordContainer.addChild(c);
  });
  wordContainer.pivot.set(wordContainer.width/2, -wordContainer.height/2);
  wordContainer.position.set(500, 500);
  wordContainer.alpha = 0;
  const wordCover = new RectangleCover(wordContainer, {points: 18, randMult: 0.1});
  wordCover.position.set(500, 500);
  wordCover.alpha = 0;
  GS.screen.addChild(wordCover);
  GS.screen.addChild(wordContainer);
  const wordPointer = new PIXI.Graphics();
  wordPointer.rect(1 * gsc, 0 * gsc, 11 * gsc, 3 * gsc).fill(orange);
  wordPointer.position.set(wordIndexPosition(0, word).x, wordIndexPosition(0, word).y);
  wordPointer.alpha = 0;
  GS.screen.addChild(wordPointer);

  const fadeAllIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    wordContainer.alpha = v;
    wordCover.alpha = v;
    wordPointer.alpha = v;
    nodePointers[0].alpha = v;
    nodePointers[1].alpha = v;
    nodePointers[2].alpha = v;
  }, () => {
    nodePointers[0].position.set(dfaA.nodes['A'].position.x, dfaA.nodes['A'].position.y - 60 * gsc);
    nodePointers[1].position.set(dfaB.nodes['1'].position.x, dfaB.nodes['1'].position.y - 60 * gsc);
    nodePointers[2].position.set(dfaProduct.nodes['A-1'].position.x, dfaProduct.nodes['A-1'].position.y - 60 * gsc);
  });

  const wordMovement = delay(0)
    .then(
      moveBetween('A', 'B', 60, dfaA, nodePointers[0], wordPointer, word),
      moveBetween(1, 2, 60, dfaB, nodePointers[1]),
      moveBetween('A-1', 'B-2', 60, dfaProduct, nodePointers[2]),
    )
    .then(delay(30))
    .then(
      moveBetween('B', 'A', 60, dfaA, nodePointers[0], wordPointer, word),
      moveBetween(2, 2, 60, dfaB, nodePointers[1]),
      moveBetween('B-2', 'A-2', 60, dfaProduct, nodePointers[2]),
    )
    .then(delay(30))
    .then(
      moveBetween('A', 'B', 60, dfaA, nodePointers[0], wordPointer, word),
      moveBetween(2, 2, 60, dfaB, nodePointers[1]),
      moveBetween('A-2', 'B-2', 60, dfaProduct, nodePointers[2]),
    )
    .then(delay(30))
    .then(
      moveBetween('B', 'B', 60, dfaA, nodePointers[0], wordPointer, word),
      moveBetween(2, 3, 60, dfaB, nodePointers[1]),
      moveBetween('B-2', 'B-3', 60, dfaProduct, nodePointers[2]),
    )
    .then(delay(30))
    .then(
      moveBetween('B', 'A', 60, dfaA, nodePointers[0], wordPointer, word),
      moveBetween(3, 3, 60, dfaB, nodePointers[1]),
      moveBetween('B-3', 'A-3', 60, dfaProduct, nodePointers[2]),
    )
    .then(delay(30))
    .then(
      moveBetween('A', 'B', 60, dfaA, nodePointers[0], wordPointer, word),
      moveBetween(3, 1, 60, dfaB, nodePointers[1]),
      moveBetween('A-3', 'B-1', 60, dfaProduct, nodePointers[2]),
    );

  const fadeAll = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    wordContainer.alpha = v;
    wordCover.alpha = v;
    wordPointer.alpha = v;
    nodePointers[0].alpha = v;
    nodePointers[1].alpha = v;
    nodePointers[2].alpha = v;
    dfaA.graph.alpha = v;
    dfaB.graph.alpha = v;
    dfaProduct.graph.alpha = v;
  });

  const badAlphabetDFA = new DFA();
  badAlphabetDFA.fromJSON({
    nodes: {
      'A': { x: 0, y: 0, start: true, accepting: false },
      'B': { x: 2000, y: 0, start: false, accepting: true },
      'C': { x: 1000, y: 1000, start: false, accepting: false },
    },
    edges: [
      { from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 0, y: -250, } } },
      { from: 'B', to: 'A', label: 'a', style: { edgeAnchor: { x: 0, y: 250, } } },
      { from: 'A', to: 'A', label: 'b' },
      { from: 'B', to: 'B', label: 'b' },
      { from: 'A', to: 'C', label: 'c, d', style: { edgeAnchor: { x: -200, y: 100 }} },
      { from: 'B', to: 'C', label: 'c, d', style: { edgeAnchor: { x: 200, y: 100 }} },
      { from: 'C', to: 'C', label: 'a, b, c, d' },
    ]
  });

  badAlphabetDFA.graph.pivot.set(1000, 500);
  badAlphabetDFA.graph.position.set(2000, 1200);

  Object.values(badAlphabetDFA.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  });
  badAlphabetDFA.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0;
    e.updateGraphic();
  });

  GS.screen.addChild(badAlphabetDFA.graph);


  const popNode = (l) => {
    const n = badAlphabetDFA.nodes[l];
    return n.tweenPop(60);
  }
  const drawEdge = (l1, l2) => {
    const e = badAlphabetDFA.edgeMap[`${l1}->${l2}`];
    return e.growEdgeTween(60, GS.easings.easeInOutQuad)
      .during(e.showLabelTween(60, GS.easings.easeInOutQuad));
  }

  const fadeOutBadAlphabet = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    badAlphabetDFA.graph.alpha = v;
  });

  return delay(0)
    .then(fadeA)
    .then(delay(30))
    .then(fadeB)
    .then(delay(30))
    .then(...productNodes)
    .then(delay(30))
    .then(nodeFade[0], delay(15).then(nodeFade[1]), delay(25).then(nodeFade[2]))
    .then(delay(30))
    .then(moveToB)
    .then(delay(30))
    .then(moveTo2)
    .then(delay(30))
    .then(growingAnims['A-1->B-2'], delay(15).then(moveToB2))
    .then(delay(30))
    .then(...nodeFadeOut)
    .then(delay(30))
    .then(
      dfaA.nodes['A'].tweenColor(orange, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['A->B'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['1->2'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['2->3'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['3->1'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(30))
    .then(growingAnims['A-2->B-3'], growingAnims['A-3->B-1'])
    .then(delay(30))
    .then(
      dfaA.nodes['A'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      dfaA.nodes['B'].tweenColor(orange, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['A->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['B->B'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(30))
    .then(
      growingAnims['B-1->B-2'],
      growingAnims['B-2->B-3'],
      growingAnims['B-3->B-1'],
    )
    .then(delay(30))
    .then(
      dfaB.edgeMap['1->2'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['2->3'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['3->1'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['1->1'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['2->2'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['3->3'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['B->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['B->A'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(30))
    .then(
      growingAnims['B-1->A-1'],
      growingAnims['B-2->A-2'],
      growingAnims['B-3->A-3'],
    )
    .then(delay(30))
    .then(
      dfaA.edgeMap['B->A'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['A->B'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      dfaA.nodes['A'].tweenColor(orange, 60, GS.easings.easeInOutQuad),
      dfaA.nodes['B'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(30))
    .then(
      growingAnims['A-1->B-1'],
      growingAnims['A-2->B-2'],
      growingAnims['A-3->B-3'],
    )
    .then(delay(30))
    .then(
      dfaA.nodes['A'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      dfaA.edgeMap['A->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['1->1'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['2->2'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      dfaB.edgeMap['3->3'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(...startFades)
    .then(delay(60))
    .then(fadeAllIn)
    .then(delay(60))
    .then(wordMovement)
    .then(delay(30))
    .then(
      dfaA.nodes['B'].tweenColor(green, 90, flashEasing()),
      dfaB.nodes['2'].tweenColor(green, 90, flashEasing()),
      delay(30).then(...acceptingFades),
    )
    .then(delay(30))
    .then(fadeAll)
    .then(popNode('A'), popNode('B'))
    .then(delay(30))
    .then(drawEdge('A', 'B'), drawEdge('B', 'A'), drawEdge('A', 'A'), drawEdge('B', 'B'))
    .then(delay(30))
    .then(popNode('C'))
    .then(delay(30))
    .then(drawEdge('A', 'C'), drawEdge('B', 'C'), drawEdge('C', 'C'))
    .then(delay(30))
    .then(fadeOutBadAlphabet);
}

const q6 = () => {
  // Show solution to q5
  // Walk through a word in the dfa that is accepted by one (same as before)
  // Highlight nodes depending red/yellow/green depending on how many DFAs accept the word
  // Change the doubleBorders to be the xor of accepting states.

  const dfaA = new DFA();
  dfaA.fromJSON({
    nodes: {
      A: { x: 0, y: 0, start: true, accepting: false },
      B: { x: 0, y: 1000, start: false, accepting: true },
    },
    edges: [
      { from: 'A', to: 'B', label: 'a, b', style: { edgeAnchor: { x: 175, y: 0, } } },
      { from: 'B', to: 'A', label: 'a', style: { edgeAnchor: { x: -175, y: 0, } } },
      { from: 'B', to: 'B', label: 'b', style: { loopOffset: { x: 0, y: 400 } } },
    ]
  });
  dfaA.graph.position.set(500, 1000);
  Object.values(dfaA.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  });
  dfaA.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0
    e.updateGraphic();
  });
  GS.screen.addChild(dfaA.graph);

  const dfaB = new DFA();
  dfaB.fromJSON({
    nodes: {
      1: { x: 0, y: 0, start: true, accepting: false },
      2: { x: 1000, y: 0, start: false, accepting: true },
      3: { x: 2000, y: 0, start: false, accepting: false },
    },
    edges: [
      { from: '1', to: '1', label: 'a' },
      { from: '1', to: '2', label: 'b' },
      { from: '2', to: '2', label: 'a', style: { loopOffset: { x: 0, y: -200 } } },
      { from: '2', to: '3', label: 'b' },
      { from: '3', to: '3', label: 'a' },
      { from: '3', to: '1', label: 'b', style: { edgeAnchor: { x: 0, y: -550 } } },
    ]
  });
  dfaB.graph.position.set(1250, 600);
  Object.values(dfaB.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  });
  dfaB.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0
    e.updateGraphic();
  });
  GS.screen.addChild(dfaB.graph);


  const dfaProduct = new DFA();
  dfaProduct.fromJSON({
    nodes: {
      'A-1': { x: 0, y: 0, start: true, accepting: false },
      'A-2': { x: 1000, y: 0, start: false, accepting: true },
      'A-3': { x: 2000, y: 0, start: false, accepting: false },
      'B-1': { x: 0, y: 1000, start: false, accepting: true },
      'B-2': { x: 1000, y: 1000, start: false, accepting: true },
      'B-3': { x: 2000, y: 1000, start: false, accepting: true },
    },
    edges: [
      { from: 'A-1', to: 'B-1', label: 'a', style: { edgeAnchor: { x: -150, y: -10, } } },
      { from: 'A-1', to: 'B-2', label: 'b'},
      { from: 'A-2', to: 'B-2', label: 'a', style: { edgeAnchor: { x: -150, y: -10, } } },
      { from: 'A-2', to: 'B-3', label: 'b'},
      { from: 'A-3', to: 'B-3', label: 'a', style: { edgeAnchor: { x: -150, y: -10, } } },
      { from: 'A-3', to: 'B-1', label: 'b', style: { labelRatio: 0.2 }},
      { from: 'B-1', to: 'A-1', label: 'a', style: { edgeAnchor: { x: 150, y: 0, } } },
      { from: 'B-1', to: 'B-2', label: 'b'},
      { from: 'B-2', to: 'A-2', label: 'a', style: { edgeAnchor: { x: 150, y: 0, } }},
      { from: 'B-2', to: 'B-3', label: 'b'},
      { from: 'B-3', to: 'A-3', label: 'a', style: { edgeAnchor: { x: 150, y: 0, } }},
      { from: 'B-3', to: 'B-1', label: 'b', style: { edgeAnchor: { x: 0, y: 500, } }},
    ]
  });
  dfaProduct.graph.position.set(1250, 1000);
  GS.screen.addChild(dfaProduct.graph);

  Object.values(dfaProduct.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  });
  dfaProduct.edges.forEach(e => {
    e.drawnAmount = 0;
    e.labelBG.alpha = 1;
    e.updateGraphic();
  });

  const fadeAB = delay(0)
    .then(
      randomDelay([
        ...Object.values(dfaA.nodes).map(n => n.tweenPop(60)),
        ...Object.values(dfaB.nodes).map(n => n.tweenPop(60)),
      ])
    )
    .then(
      randomDelay([
        ...dfaA.edges.map(e => e.growEdgeTween(60, GS.easings.easeInOutQuad).during(e.showLabelTween(60, GS.easings.easeInOutQuad))),
        ...dfaB.edges.map(e => e.growEdgeTween(60, GS.easings.easeInOutQuad).during(e.showLabelTween(60, GS.easings.easeInOutQuad))),
      ])
    );

  const fadeProduct = delay(0)
    .then(
      randomDelay([
        ...Object.values(dfaProduct.nodes).map(n => n.tweenPop(60)),
      ])
    )
    .then(
      randomDelay([
        ...dfaProduct.edges.map(e => e.growEdgeTween(60, GS.easings.easeInOutQuad).during(e.showLabelTween(60, GS.easings.easeInOutQuad))),
      ])
    );

  const word_text = "baabab";
  const word = word_text.split('').map(c => new PIXI.Text(c, {...baseStyle}));
  const wordContainer = new PIXI.Container();
  const wordWidth = 20 * gsc;
  word.forEach((c, i) => {
    c.anchor.set(0, 1);
    c.position.set((i == 0) ? 0 : (word[i-1].position.x + wordWidth), 0);
    wordContainer.addChild(c);
  });
  wordContainer.pivot.set(wordContainer.width/2, -wordContainer.height/2);
  wordContainer.position.set(500, 500);
  wordContainer.alpha = 0;
  const wordCover = new RectangleCover(wordContainer, {points: 18, randMult: 0.1});
  wordCover.position.set(500, 500);
  wordCover.alpha = 0;
  GS.screen.addChild(wordCover);
  GS.screen.addChild(wordContainer);
  const wordPointer = new PIXI.Graphics();
  wordPointer.rect(1 * gsc, 0 * gsc, 11 * gsc, 3 * gsc).fill(orange);
  wordPointer.position.set(wordIndexPosition(0, word).x, wordIndexPosition(0, word).y);
  wordPointer.alpha = 0;
  GS.screen.addChild(wordPointer);

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(orange);
  nodePointer.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(orange);
  nodePointer.position.set(dfaProduct.nodes['A-1'].position.x, dfaProduct.nodes['A-1'].position.y - 60 * gsc);
  nodePointer.alpha = 0;
  dfaProduct.graph.addChild(nodePointer);

  const fadePointerAndWord = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    wordContainer.alpha = v;
    wordCover.alpha = v;
    wordPointer.alpha = v;
    nodePointer.alpha = v;
  });

  GS.curWordIndex = 0;
  const movement = delay(0)
    .then(moveBetween('A-1', 'B-2', 60, dfaProduct, nodePointer, wordPointer, word))
    .then(moveBetween('B-2', 'A-2', 60, dfaProduct, nodePointer, wordPointer, word))
    .then(moveBetween('A-2', 'B-2', 60, dfaProduct, nodePointer, wordPointer, word))
    .then(moveBetween('B-2', 'B-3', 60, dfaProduct, nodePointer, wordPointer, word))
    .then(moveBetween('B-3', 'A-3', 60, dfaProduct, nodePointer, wordPointer, word))
    .then(moveBetween('A-3', 'B-1', 60, dfaProduct, nodePointer, wordPointer, word))

  const fadeWord = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    wordContainer.alpha = v;
    wordCover.alpha = v;
    wordPointer.alpha = v;
    nodePointer.alpha = v;
  });

  const colourNodes = (nodes, colour, duration) => {
    return nodes.map(n => n.tweenColor(colour, duration, GS.easings.easeInOutQuad));
  }

  const removeAccepting = (node) => {
    return new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      node.innerCircle.alpha = v;
    });
  }

  return delay(0)
    .then(fadeAB)
    .then(delay(60))
    .then(fadeProduct)
    .then(delay(60))
    .then(fadePointerAndWord)
    .then(delay(60))
    .then(movement)
    .then(delay(60))
    .then(fadeWord)
    .then(delay(60))
    .then(
      delay(0).then(...colourNodes([dfaProduct.nodes['A-1'], dfaProduct.nodes['A-3']], red, 60)),
      delay(120).then(...colourNodes([dfaProduct.nodes['A-2'], dfaProduct.nodes['B-1'], dfaProduct.nodes['B-3']], orange, 60)),
      delay(240).then(...colourNodes([dfaProduct.nodes['B-2']], green, 60)),
    )
    .then(delay(60))
    .then(
        ...colourNodes([dfaProduct.nodes['A-1'], dfaProduct.nodes['A-3']], bg_dark, 60),
        ...colourNodes([dfaProduct.nodes['B-2']], bg_dark, 60),
    )
    .then(delay(60))
    .then(
      ...colourNodes([dfaProduct.nodes['A-2'], dfaProduct.nodes['B-1'], dfaProduct.nodes['B-3']], bg_dark, 60),
      removeAccepting(dfaProduct.nodes['B-2']),
    )
    .then(new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      dfaProduct.graph.alpha = v;
      dfaA.graph.alpha = v;
      dfaB.graph.alpha = v;
    }))
}

const unloader = () => {
};

export default { loader, unloader };
