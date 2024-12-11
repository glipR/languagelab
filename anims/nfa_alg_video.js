import { bg_dark, black, darkPurple, green, highlightColours, lightGrey, purple, red } from "../colours.js";
import NFA from "../nfa.js";
import Screen from "../screen.js";
import NodeGroup from "../tools/node_group.js";
import { RectangleCover } from "../tools/paper_cover.js";
import { NodePointer, Word } from "../tools/word.js";
import { delay, ImmediateTween, interpValue, randomDelay, TweenManager, ValueTween } from "../tween.js";
import Table from "../tools/table.js";
import DFA from "../dfa.js";
import { Node } from "../graph.js";

const gsc = window.gameScaling ?? 1;

const GS = {
  curWordIndex: 0,
  table: new Table(),
};

const baseTextStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

const baseNodeGroupOptions = {
  node: { isEntry: false },
  frameWidth: 75 * gsc,
  maxSpacing: 50 * gsc,
  scaling: 0.66,
  textScaling: 0.8,
  cross: {
    visible: false,
    size: 15 * gsc,
    stroke: 5 * gsc,
    color: red,
  },
  animSpeed: 30,
}

const moveBetween = (l1, l2, duration, graph, nodePointer, wordPointer, word, finalColour=black) => {
  const tweens = [];
  const edge = graph.edgeMap[`${l1}->${l2}`];
  if (!edge) return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, () => {});
  tweens.push(new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
    const pos = edge.bezierEdgeInterp(v).position;
    if (nodePointer) nodePointer.position.set(pos.x, pos.y - 60 * gsc);
  }))
  tweens.push(
    edge.colorEdgeTween(purple, duration/2, GS.easings.easeInOutQuad, false)
    .then(edge.colorEdgeTween(finalColour, duration/2, GS.easings.easeInOutQuad, false))
  );

  if ((!!wordPointer || !!word) && edge.style.edgeLabel != 'ε') {
    const oldWordIndex = GS.curWordIndex;
    const curWordPos = word ? word[GS.curWordIndex].position : 0;
    GS.curWordIndex++;
    if (word && GS.curWordIndex >= word.length) {
      GS.curWordIndex--;
    }
    const newWordIndex = GS.curWordIndex;
    const newWordPos = word ? word[GS.curWordIndex].position : 0;
    if (oldWordIndex != newWordIndex) {
      if (wordPointer) tweens.push(new ValueTween(curWordPos, newWordPos, duration, GS.easings.easeInOutQuad, (v) => {
        wordPointer.position.set(v.x, v.y);
      }));
      if (word) tweens.push(new ValueTween(black, purple, duration, GS.easings.easeInOutQuad, (v) => {
        word[newWordIndex].style.fill = v;
      }));
    }
    if (word) tweens.push(new ValueTween(purple, bg_dark, duration, GS.easings.easeInOutQuad, (v) => {
      word[oldWordIndex].style.fill = v;
    }));
  }
  return delay(0).then(...tweens);
};

GS.example = new NFA();
GS.example.fromJSON({
  nodes: {
    'A': { x: -200*gsc, y: 150*gsc, start: true, style: { fill: highlightColours[0] } },
    'B': { x: -400*gsc, y: -150*gsc, style: { fill: highlightColours[1] } },
    'C': { x: 0, y: -150*gsc, style: { fill: highlightColours[2] } },
    'D': { x: 400*gsc, y: -150*gsc, accepting: true, style: { fill: highlightColours[3] } },
    'E': { x: 200*gsc, y: 150*gsc, accepting: true, style: { fill: highlightColours[4] } },
  },
  edges: [
    { from: 'A', to: 'A', label: 'a' },
    { from: 'A', to: 'B', label: 'a' },
    { from: 'A', to: 'C', label: 'b' },
    { from: 'B', to: 'C', label: 'ε' },
    { from: 'C', to: 'D', label: 'ε' },
    { from: 'C', to: 'E', label: 'ε' },
    { from: 'D', to: 'E', label: 'b', style: {edgeAnchor: {x: 50*gsc, y:20*gsc}} },
    { from: 'E', to: 'D', label: 'a', style: {edgeAnchor: {x: -50*gsc, y:-20*gsc}} },
  ]
});
GS.example.graph.position.set(2000, 1400);
GS.example.edges.forEach(e => {
  e.labelBG.alpha = 1;
  e.drawnAmount = 0;
  e.updateGraphic();
});
Object.values(GS.example.nodes).forEach(n => {
  n.graphic.alpha = 0;
  n.separatedGraphic.alpha = 0;
});

GS.exampleDFA = new DFA();
GS.exampleDFA.fromJSON({
  nodes: {
    1: { x: -300*gsc, y: 0, start: true },
    2: { x: -200*gsc, y: -300 * gsc, accepting: true },
    3: { x: -100*gsc, y: 0, accepting: true },
    4: { x: 50*gsc, y: -300 * gsc, accepting: true },
    5: { x: 50*gsc, y: 0, accepting: true },
    6: { x: 250*gsc, y: -150 * gsc },
  },
  edges: [
    { from: 1, to: 2, label: 'a' },
    { from: 1, to: 3, label: 'b' },
    { from: 2, to: 2, label: 'a' },
    { from: 2, to: 3, label: 'b' },
    { from: 3, to: 4, label: 'a' },
    { from: 3, to: 5, label: 'b' },
    { from: 4, to: 5, label: 'b', style: { edgeAnchor: { x: 50*gsc, y: 0 } } },
    { from: 5, to: 4, label: 'a', style: { edgeAnchor: { x: -50*gsc, y: 0 } } },
    { from: 4, to: 6, label: 'a' },
    { from: 5, to: 6, label: 'b' },
    { from: 6, to: 6, label: 'a, b' },
  ]
});
GS.exampleDFA.graph.position.set(2900, 1500);
GS.exampleDFA.graph.scale.set(0.7)
GS.exampleDFA.edges.forEach(e => {
  e.labelBG.alpha = 1;
  e.drawnAmount = 1;
  e.updateGraphic();
});
Object.values(GS.exampleDFA.nodes).forEach(n => {
  n.graphic.alpha = 1;
  n.separatedGraphic.alpha = 1;
  n.innerCircle.alpha = 0;
});
GS.exampleDFA.graph.alpha = 0;

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();

  GS.screen.addChild(GS.example.graph);
  GS.screen.addChild(GS.exampleDFA.graph);

  const popNodes = Object.values(GS.example.nodes).map((node) => {
    return node.tweenPop(60);
  });
  const drawEdges = GS.example.edges.map((edge) => {
    return edge.growEdgeTween(60, easings.easeInOutQuad).during(edge.showLabelTween(60, easings.easeInOutQuad));
  });

  const nodePointers = Array.from({ length: 5 }, () => {
    return new NodePointer(GS.example, GS.example.nodes['A'], { fill: darkPurple });
  });

  const fadePointer = (index, alpha, duration=60, color) => {
    const fade = new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
      nodePointers[index].alpha = interpValue(nodePointers[index].curAlpha, alpha, v);
    }, () => { nodePointers[index].curAlpha = nodePointers[index].alpha });
    if (color !== undefined) {
      fade.during(new ValueTween(color, nodePointers[index].style.fill, duration, GS.easings.easeInOutQuad, (v) => {
        nodePointers[index].style.fill = v;
        nodePointers[index].updateGraphic();
      }));
    }
    return fade;
  }

  const colorEdge = (key, color) => {
    return GS.example.edgeMap[key].colorEdgeTween(color, 60, GS.easings.easeInOutQuad, false);
  }

  const word = new Word('aabba', { x: 2000, y: 300 });
  GS.screen.addChild(word.wordCover);
  GS.screen.addChild(word.wordContainer);

  const nodeGroup = new NodeGroup({node: {isEntry: false}}, GS.example, ['A']);
  nodeGroup.position.set(500, 300);
  const nodeGroupCover = new RectangleCover(nodeGroup, { width: 200 * gsc, height: 80 * gsc, randMult: 0.1 });
  nodeGroupCover.position.set(500, 300);
  nodeGroupCover.alpha = 0;
  nodeGroup.alpha = 0;
  GS.screen.addChild(nodeGroupCover);
  GS.screen.addChild(nodeGroup);

  GS.curWordIndex = 0;

  const wordReadSteps = [];
  wordReadSteps.push([
    fadePointer(0, 1),
    fadePointer(1, 1),
    new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      word.wordContainer.alpha = v;
      word.wordCover.alpha = v;
      word.wordPointer.alpha = v;
      nodeGroupCover.alpha = v;
      nodeGroup.alpha = v;
    }),
  ]);
  wordReadSteps.push([
    colorEdge('A->A', red),
    colorEdge('A->B', red),
  ])
  // Read an a
  wordReadSteps.push([
    moveBetween('A', 'A', 60, GS.example, nodePointers[0], word.wordPointer, word.word),
    moveBetween('A', 'B', 60, GS.example, nodePointers[1]),
    nodeGroup.setNodes(['A', 'B'], 60),
  ])
  wordReadSteps.push([
    colorEdge('B->C', green),
    colorEdge('C->D', green),
    colorEdge('C->E', green),
  ])
  // Move along epsilons - part 1
  wordReadSteps.push([
    moveBetween('B', 'C', 60, GS.example, nodePointers[2]),
    fadePointer(2, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'C'], 60),
  ])
  // Move along epsilons - part 2
  wordReadSteps.push([
    moveBetween('C', 'D', 60, GS.example, nodePointers[3]),
    moveBetween('C', 'E', 60, GS.example, nodePointers[4]),
    fadePointer(3, 1, 0),
    fadePointer(4, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'C', 'D', 'E'], 60),
  ])
  // Kill no a transitions
  wordReadSteps.push([
    colorEdge('A->A', red),
    colorEdge('A->B', red),
    colorEdge('E->D', red),
  ])
  wordReadSteps.push([
    fadePointer(1, 0, 60, red),
    fadePointer(2, 0, 60, red),
    fadePointer(3, 0, 60, red),
    nodeGroup.setNodes(['A', 'E'], 60),
  ])
  // Move along a transitions
  wordReadSteps.push([
    moveBetween('A', 'A', 60, GS.example, nodePointers[0], word.wordPointer, word.word),
    moveBetween('A', 'B', 60, GS.example, nodePointers[1]),
    moveBetween('E', 'D', 60, GS.example, nodePointers[4]),
    fadePointer(1, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'D'], 60),
  ])
  wordReadSteps.push([
    colorEdge('B->C', green),
    colorEdge('C->E', green),
  ])
  // Move along epsilongs
  wordReadSteps.push([
    moveBetween('B', 'C', 60, GS.example, nodePointers[2]),
    fadePointer(2, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'D', 'C'], 60),
  ])
  wordReadSteps.push([
    moveBetween('C', 'E', 60, GS.example, nodePointers[3]),
    fadePointer(3, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'D', 'C', 'E'], 60),
  ])
  // Kill no b transitions
  wordReadSteps.push([
    colorEdge('A->C', red),
    colorEdge('D->E', red),
  ])
  wordReadSteps.push([
    fadePointer(1, 0, 60, red),
    fadePointer(2, 0, 60, red),
    fadePointer(3, 0, 60, red),
    nodeGroup.setNodes(['A', 'D'], 60),
  ])
  // Move along b transitions
  wordReadSteps.push([
    moveBetween('A', 'C', 60, GS.example, nodePointers[0], word.wordPointer, word.word),
    moveBetween('D', 'E', 60, GS.example, nodePointers[4]),
    nodeGroup.setNodes(['C', 'E'], 60),
  ])
  wordReadSteps.push([
    colorEdge('C->D', green),
  ])
  // Move along epsilons
  wordReadSteps.push([
    moveBetween('C', 'D', 60, GS.example, nodePointers[3]),
    fadePointer(3, 1, 0),
    nodeGroup.setNodes(['C', 'E', 'D'], 60),
  ])
  // Kill no b transitions
  wordReadSteps.push([
    colorEdge('D->E', red),
  ])
  wordReadSteps.push([
    fadePointer(0, 0, 60, red),
    fadePointer(4, 0, 60, red),
    nodeGroup.setNodes(['D'], 60),
  ])
  // Move along b transitions
  wordReadSteps.push([
    moveBetween('D', 'E', 60, GS.example, nodePointers[3], word.wordPointer, word.word),
    nodeGroup.setNodes(['E'], 60),
  ])
  wordReadSteps.push([
    colorEdge('E->D', red),
  ])
  // Move along a transitions
  wordReadSteps.push([
    moveBetween('E', 'D', 60, GS.example, nodePointers[3], word.wordPointer, word.word),
    nodeGroup.setNodes(['D'], 60),
  ])

  GS.curWordIndex = 0;
  wordReadSteps.push([
    word.resetWord(),
    new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      nodeGroupCover.alpha = v;
      nodeGroup.alpha = v;
    }),
    new ValueTween(
      {x: GS.example.nodes['D'].position.x, y: GS.example.nodes['D'].position.y - 60 * gsc},
      {x: GS.example.nodes['A'].position.x, y: GS.example.nodes['A'].position.y - 60 * gsc},
      60, GS.easings.easeInOutQuad, (v) => {
        nodePointers[3].position.set(v.x, v.y);
      }
    )
  ]);

  wordReadSteps.push([moveBetween('A', 'A', 60, GS.example, nodePointers[3], word.wordPointer, word.word)]);
  wordReadSteps.push([moveBetween('A', 'A', 60, GS.example, nodePointers[3], word.wordPointer, word.word)]);
  wordReadSteps.push([moveBetween('A', 'C', 60, GS.example, nodePointers[3], word.wordPointer, word.word)]);
  wordReadSteps.push([moveBetween('C', 'D', 60, GS.example, nodePointers[3], word.wordPointer, word.word)]);
  wordReadSteps.push([moveBetween('D', 'E', 60, GS.example, nodePointers[3], word.wordPointer, word.word)]);
  wordReadSteps.push([moveBetween('E', 'D', 60, GS.example, nodePointers[3], word.wordPointer, word.word)]);

  const word2 = new Word('abbb', { x: 2000, y: 300 });
  GS.screen.addChild(word2.wordCover);
  GS.screen.addChild(word2.wordContainer);
  word2.wordContainer.alpha = 0;
  word2.wordCover.alpha = 0;

  GS.curWordIndex = 0;
  wordReadSteps.push([
    // Instant set
    nodeGroup.setNodes(['A'], 0),
    new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      nodeGroupCover.alpha = v;
      nodeGroup.alpha = v;
      word2.wordContainer.alpha = v;
      word2.wordCover.alpha = v;
      word2.wordPointer.alpha = v;
      word.wordContainer.alpha = 1 - v;
      word.wordCover.alpha = 1 - v;
      word.wordPointer.alpha = 1 - v;
    }),
    new ValueTween(
      {x: GS.example.nodes['D'].position.x, y: GS.example.nodes['D'].position.y - 60 * gsc},
      {x: GS.example.nodes['A'].position.x, y: GS.example.nodes['A'].position.y - 60 * gsc},
      60, GS.easings.easeInOutQuad, (v) => {
        nodePointers[3].position.set(v.x, v.y);
        nodePointers[2].position.set(v.x, v.y);
      },
    ),
    fadePointer(2, 1, 0)
  ]);
  wordReadSteps.push([
    colorEdge('A->A', red),
    colorEdge('A->B', red),
  ])
  wordReadSteps.push([
    moveBetween('A', 'A', 60, GS.example, nodePointers[3], word2.wordPointer, word2.word),
    moveBetween('A', 'B', 60, GS.example, nodePointers[2]),
    nodeGroup.setNodes(['A', 'B'], 60),
  ]);
  wordReadSteps.push([
    colorEdge('B->C', green),
    colorEdge('C->D', green),
    colorEdge('C->E', green),
  ])
  wordReadSteps.push([
    moveBetween('B', 'C', 60, GS.example, nodePointers[1]),
    fadePointer(1, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'C'], 60),
  ])
  wordReadSteps.push([
    moveBetween('C', 'D', 60, GS.example, nodePointers[0]),
    moveBetween('C', 'E', 60, GS.example, nodePointers[4]),
    fadePointer(0, 1, 0),
    fadePointer(4, 1, 0),
    nodeGroup.setNodes(['A', 'B', 'C', 'D', 'E'], 60),
  ])
  wordReadSteps.push([
    colorEdge('A->C', red),
    colorEdge('D->E', red),
  ])
  wordReadSteps.push([
    fadePointer(1, 0, 60, red),
    fadePointer(2, 0, 60, red),
    fadePointer(4, 0, 60, red),
    nodeGroup.setNodes(['A', 'D'], 60),
  ])
  wordReadSteps.push([
    moveBetween('A', 'C', 60, GS.example, nodePointers[3], word2.wordPointer, word2.word),
    moveBetween('D', 'E', 60, GS.example, nodePointers[0]),
    nodeGroup.setNodes(['C', 'E'], 60),
  ])
  wordReadSteps.push([
    colorEdge('C->D', green),
  ])
  wordReadSteps.push([
    moveBetween('C', 'D', 60, GS.example, nodePointers[1]),
    fadePointer(1, 1, 0),
    nodeGroup.setNodes(['C', 'E', 'D'], 60),
  ])
  wordReadSteps.push([
    colorEdge('D->E', red),
  ])
  wordReadSteps.push([
    fadePointer(0, 0, 60, red),
    fadePointer(3, 0, 60, red),
    nodeGroup.setNodes(['D'], 60),
  ])
  wordReadSteps.push([
    moveBetween('D', 'E', 60, GS.example, nodePointers[1], word2.wordPointer, word2.word),
    nodeGroup.setNodes(['E'], 60),
  ])
  wordReadSteps.push([
    fadePointer(1, 0, 60, red),
    nodeGroup.setNodes([], 60),
  ])

  const finalTween = delay(60)
    .then(randomDelay(popNodes))
    .then(randomDelay(drawEdges))

  wordReadSteps.forEach((steps) => {
    finalTween.then(delay(30));
    finalTween.then(...steps);
  });

  finalTween.then(delay(30));

  // Table and conversion animation
  GS.table = new Table({
    itemHeight: 70 * gsc,
    totalHeight: 500 * gsc,
  })
  GS.table.resize(6, 2);
  GS.nodeGroups = Array.from({length: 7}, () => Array.from({length: 3}, () => new NodeGroup(baseNodeGroupOptions, GS.example, [])));
  GS.nodeGroups.forEach((row, i) => {
    row.forEach((ng, j) => {
      const border = new PIXI.Graphics();
      border.rect(0, 0, GS.table.style.headerWidth, GS.table.style.itemHeight).fill(lightGrey).stroke({ color: purple, width: 5 * gsc });
      border.position.set(-GS.table.style.headerWidth/2, -GS.table.style.itemHeight/2);
      border.alpha = 0;
      GS.table.getContainer(i, j).contents.addChild(border);
      GS.table.getContainer(i, j).border = border;
      GS.table.getContainer(i, j).contents.addChild(ng);
    });
  });
  GS.table.position.set(50 * gsc, 50 * gsc);
  GS.table.alpha = 0;
  GS.screen.addChild(GS.table);
  const tableAlph = ["a", "b"].map((l, i) => {
    const text = new PIXI.Text(l, baseTextStyle);
    text.anchor.set(0.5, 0.5);
    text.position.set(0, 0);
    GS.table.getContainer(0, i+1).contents.addChild(text);
    return text;
  });
  const numberNodes = [1, 2, 3, 4, 5, 6].map(v => {
    const container = GS.table.getContainer(v, 0);
    const num = new Node(v,
      { x: GS.table.style.headerWidth*0.5 - 10 * gsc, y: -GS.table.style.itemHeight/2 + 10*gsc },
      { radius: 10 * gsc, strokeWidth: 1 * gsc, labelStyle: {
        fontFamily: 'Ittybittynotebook',
        fontSize: 18 * gsc,
      } },
    );
    num.graphic.alpha = 0;
    container.contents.addChild(num.graphic);
    return num;
  })

  const fadeTable = (alpha, duration=60) => {
    return new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
      GS.table.alpha = interpValue(GS.table.startAlpha, alpha, v);
    }, () => {
      GS.table.startAlpha = GS.table.alpha;
    });
  }

  const selectBG = (i, j) => {
    return new ValueTween(0, 0.2, 60, GS.easings.easeInOutQuad, (v) => {
      GS.table.getContainer(i, j).background.alpha = v;
    });
  }
  const unselectBG = (i, j) => {
    return new ValueTween(0.2, 0, 60, GS.easings.easeInOutQuad, (v) => {
      GS.table.getContainer(i, j).background.alpha = v;
    });
  }

  finalTween.then(
    fadeTable(1, 60),
    new ValueTween(1, 0.6, 60, GS.easings.easeInOutQuad, (v) => {
      GS.example.graph.scale.set(v);
    }),
    new ValueTween({ x: 2000, y: 1400 }, { x: 2700, y: 1400 }, 60, GS.easings.easeInOutQuad, (v) => {
      GS.example.graph.position.set(v.x, v.y);
    }),
    new ValueTween(1, 0.8, 60, GS.easings.easeInOutQuad, (v) => {
      Object.values(GS.example.nodes).forEach(n => {
        n.position.x = n.originalX * v;
        n.updateGraphic();
      });
      GS.example.edges.forEach(e => e.updateGraphic());
    }, () => {
      Object.values(GS.example.nodes).forEach(n => n.originalX = n.position.x);
    }),
    new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      word2.wordContainer.alpha = v;
      word2.wordCover.alpha = v;
      nodeGroupCover.alpha = v;
      nodeGroup.alpha = v;
    }),
  );
  finalTween.then(delay(60));

  // Start node: A
  finalTween.then(
    new ImmediateTween(() => {
      nodePointers[0].moveToNode(GS.example.nodes['A']);
    }),
    fadePointer(0, 1),
    GS.nodeGroups[1][0].setNodes(['A']),
    selectBG(1, 1),
  );
  finalTween.then(delay(30));

  // Reading an A
  finalTween.then(
    moveBetween('A', 'A', 60, GS.example, nodePointers[0]),
    moveBetween('A', 'B', 60, GS.example, nodePointers[1]),
    fadePointer(1, 1, 0),
    GS.nodeGroups[1][1].setNodes(['A', 'B']),
  )
  finalTween.then(delay(30));
  // Reading an epsilon (pt 1)
  finalTween.then(
    moveBetween('B', 'C', 60, GS.example, nodePointers[2]),
    fadePointer(2, 1, 0),
    GS.nodeGroups[1][1].setNodes(['A', 'B', 'C']),
  )
  finalTween.then(delay(30));
  // Reading an epsilon (pt 2)
  finalTween.then(
    moveBetween('C', 'D', 60, GS.example, nodePointers[3]),
    moveBetween('C', 'E', 60, GS.example, nodePointers[4]),
    fadePointer(3, 1, 0),
    fadePointer(4, 1, 0),
    GS.nodeGroups[1][1].setNodes(['A', 'B', 'C', 'D', 'E']),
  )
  finalTween.then(delay(30));

  // Back to reading on A
  finalTween.then(
    fadePointer(1, 0),
    fadePointer(2, 0),
    fadePointer(3, 0),
    fadePointer(4, 0),
    unselectBG(1, 1),
    selectBG(1, 2),
  )
  finalTween.then(delay(30));

  // Reading a b
  finalTween.then(
    moveBetween('A', 'C', 60, GS.example, nodePointers[0], undefined, undefined),
    GS.nodeGroups[1][2].setNodes(['C']),
  )
  finalTween.then(delay(30));
  // Epsilons
  finalTween.then(
    moveBetween('C', 'D', 60, GS.example, nodePointers[3], undefined, undefined),
    moveBetween('C', 'E', 60, GS.example, nodePointers[4], undefined, undefined),
    fadePointer(3, 1, 0),
    fadePointer(4, 1, 0),
    GS.nodeGroups[1][2].setNodes(['C', 'D', 'E']),
  )
  finalTween.then(delay(30));

  // Reading on A, B, C, D, E
  finalTween.then(
    new ImmediateTween(() => {
      nodePointers[1].moveToNode(GS.example.nodes['A']);
      nodePointers[2].moveToNode(GS.example.nodes['B']);
    }),
    fadePointer(1, 1),
    fadePointer(2, 1),
    GS.nodeGroups[2][0].setNodes(['A', 'B', 'C', 'D', 'E']),
    unselectBG(1, 2),
    selectBG(2, 1),
  )
  finalTween.then(delay(30));
  // Kill off those that cannot read an a.
  finalTween.then(
    fadePointer(0, 0, 60, red),
    fadePointer(2, 0, 60, red),
    fadePointer(3, 0, 60, red),
  )
  finalTween.then(delay(30));
  // Reading an a
  finalTween.then(
    moveBetween('A', 'A', 60, GS.example, nodePointers[0]),
    fadePointer(0, 1, 0),
    moveBetween('A', 'B', 60, GS.example, nodePointers[1]),
    moveBetween('E', 'D', 60, GS.example, nodePointers[4]),
    GS.nodeGroups[2][1].setNodes(['A', 'B', 'D']),
  )
  finalTween.then(delay(30));
  // Epsilon pt 1
  finalTween.then(
    moveBetween('B', 'C', 60, GS.example, nodePointers[2]),
    fadePointer(2, 1, 0),
    GS.nodeGroups[2][1].setNodes(['A', 'B', 'D', 'C']),
  )
  finalTween.then(delay(30));
  // Epsilon pt 2
  finalTween.then(
    moveBetween('C', 'E', 60, GS.example, nodePointers[3]),
    fadePointer(3, 1, 0),
    GS.nodeGroups[2][1].setNodes(['A', 'B', 'D', 'C', 'E']),
  )
  finalTween.then(delay(30));

  // Kill off those that cannot read a b.
  finalTween.then(
    fadePointer(1, 0, 60, red),
    fadePointer(2, 0, 60, red),
    fadePointer(3, 0, 60, red),
    unselectBG(2, 1),
    selectBG(2, 2),
  )
  finalTween.then(delay(30));
  // Reading a b
  finalTween.then(
    moveBetween('A', 'C', 60, GS.example, nodePointers[0]),
    moveBetween('D', 'E', 60, GS.example, nodePointers[4]),
    GS.nodeGroups[2][2].setNodes(['C', 'E']),
  )
  finalTween.then(delay(30));
  // Epsilon
  finalTween.then(
    moveBetween('C', 'D', 60, GS.example, nodePointers[1]),
    fadePointer(1, 1, 0),
    GS.nodeGroups[2][2].setNodes(['C', 'E', 'D']),
  )
  finalTween.then(delay(30));

  // Reset to starting from C, D, E
  finalTween.then(
    GS.nodeGroups[3][0].setNodes(['C', 'E', 'D']),
    unselectBG(2, 2),
    selectBG(3, 1),
  )
  finalTween.then(delay(30));
  // Kill off those that cannot read an a.
  finalTween.then(
    fadePointer(0, 0, 60, red),
    fadePointer(1, 0, 60, red),
  )
  finalTween.then(delay(30));
  // Reading an a
  finalTween.then(
    moveBetween('E', 'D', 60, GS.example, nodePointers[4]),
    GS.nodeGroups[3][1].setNodes(['D']),
  )
  finalTween.then(delay(30));
  // Reset to starting from C, D, E
  finalTween.then(
    new ImmediateTween(() => {
      nodePointers[0].moveToNode(GS.example.nodes['C']);
      nodePointers[1].moveToNode(GS.example.nodes['E']);
    }),
    fadePointer(0, 1),
    fadePointer(1, 1),
    unselectBG(3, 1),
    selectBG(3, 2),
  )
  finalTween.then(delay(30));
  // Kill off those that cannot read a b.
  finalTween.then(
    fadePointer(0, 0, 60, red),
    fadePointer(1, 0, 60, red),
  )
  finalTween.then(delay(30));
  // Reading a b
  finalTween.then(
    moveBetween('D', 'E', 60, GS.example, nodePointers[4]),
    GS.nodeGroups[3][2].setNodes(['E']),
  )
  finalTween.then(delay(30));

  // Starting from 'D'
  finalTween.then(
    new ImmediateTween(() => {
      nodePointers[0].moveToNode(GS.example.nodes['D']);
    }),
    GS.nodeGroups[4][0].setNodes(['D']),
    fadePointer(0, 1),
    fadePointer(4, 0),
    unselectBG(3, 2),
    selectBG(4, 1),
  )
  finalTween.then(delay(30));
  // Reading an 'a' - not
  finalTween.then(
    new ImmediateTween(() => {
      GS.nodeGroups[4][1].style.cross.visible = true;
    }).then(
      GS.nodeGroups[4][1].setNodes([]),
      fadePointer(0, 0, 60, red),
    )
  )
  finalTween.then(delay(30));
  // Reading an 'b' - D->E
  finalTween.then(
    fadePointer(0, 1),
    unselectBG(4, 1),
    selectBG(4, 2),
  )
  finalTween.then(delay(30));
  finalTween.then(
    moveBetween('D', 'E', 60, GS.example, nodePointers[0]),
    GS.nodeGroups[4][2].setNodes(['E']),
  )
  finalTween.then(delay(30));

  // Starting from 'E'
  finalTween.then(
    GS.nodeGroups[5][0].setNodes(['E']),
    unselectBG(4, 2),
    selectBG(5, 1),
  )
  finalTween.then(delay(30));
  // Reading an 'a' - E->D
  finalTween.then(
    moveBetween('E', 'D', 60, GS.example, nodePointers[0]),
    GS.nodeGroups[5][1].setNodes(['D']),
  )
  finalTween.then(delay(30));
  // Reading an 'b' - not
  finalTween.then(
    fadePointer(1, 1, 60),
    fadePointer(0, 0),
    unselectBG(5, 1),
    selectBG(5, 2),
  )
  finalTween.then(delay(30));
  finalTween.then(
    new ImmediateTween(() => {
      GS.nodeGroups[5][2].style.cross.visible = true;
    }).then(
      GS.nodeGroups[5][2].setNodes([]),
      fadePointer(1, 0, 60, red),
    ),
  )
  finalTween.then(delay(30));

  // TODO: Simulation on word 'aabba'
  const tableWord = new Word('aabba', { x: 2700, y: 400 });
  GS.screen.addChild(tableWord.wordCover);
  GS.screen.addChild(tableWord.wordContainer);
  tableWord.wordContainer.alpha = 0;
  tableWord.wordCover.alpha = 0;
  const posPointer = new Node('X', { x: 0, y: 0 }, { radius: 10 * gsc, strokeWidth: 1 * gsc, labelStyle: {
    fontFamily: 'Ittybittynotebook',
    fontSize: 18 * gsc,
  } });
  posPointer.graphic.alpha = 0;
  const topRightCorner = (i, j) => {
    return {
      x: -20 * gsc + 50 * gsc + GS.table.style.headerWidth + GS.table.style.itemWidth * j,
      y: 20 * gsc + 50 * gsc + (i === 0 ? 0 : GS.table.style.headerHeight) + Math.max(0, GS.table.style.itemHeight * (i-1)),
    }
  }
  posPointer.moveTo(topRightCorner(1, 0));
  GS.screen.addChild(posPointer.graphic);
  GS.curWordIndex = 0;

  finalTween.then(
    new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      tableWord.wordContainer.alpha = v;
      tableWord.wordCover.alpha = v;
      tableWord.wordPointer.alpha = v;
      posPointer.graphic.alpha = v;
    }),
    unselectBG(5, 2),
  )
  finalTween.then(delay(30));

  const movePosPointer = (i, j, duration=60) => {
    return new ValueTween(
      0, 1,
      duration, GS.easings.easeInOutQuad, (v) => {
        posPointer.moveTo(interpValue(posPointer.start, posPointer.end, v));
      }, () => {
        posPointer.start = {...posPointer.position};
        posPointer.end = topRightCorner(i, j);
      }
    );
  }

  finalTween.then(
    movePosPointer(1, 1),
    moveBetween('A', 'A', 60, GS.example, undefined, tableWord.wordPointer, tableWord.word),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(2, 0),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(2, 1),
    moveBetween('A', 'A', 60, GS.example, undefined, tableWord.wordPointer, tableWord.word),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(2, 0),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(2, 2),
    moveBetween('A', 'C', 60, GS.example, undefined, tableWord.wordPointer, tableWord.word),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(3, 0),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(3, 2),
    moveBetween('D', 'E', 60, GS.example, undefined, tableWord.wordPointer, tableWord.word),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(5, 0),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(5, 1),
    moveBetween('E', 'D', 60, GS.example, undefined, tableWord.wordPointer, tableWord.word),
  )
  finalTween.then(delay(30));

  finalTween.then(
    movePosPointer(4, 0),
  )
  finalTween.then(delay(30));

  finalTween.then(
    new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      tableWord.wordContainer.alpha = v;
      tableWord.wordCover.alpha = v;
      tableWord.wordPointer.alpha = v;
      posPointer.graphic.alpha = v;
    })
  )
  finalTween.then(delay(30));

  // Full empty row
  finalTween.then(
    new ImmediateTween(() => {
      GS.nodeGroups[6][0].style.cross.visible = true;
      GS.nodeGroups[6][1].style.cross.visible = true;
      GS.nodeGroups[6][2].style.cross.visible = true;
    }).then(
      GS.nodeGroups[6][0].setNodes([]),
      GS.nodeGroups[6][1].setNodes([]),
      GS.nodeGroups[6][2].setNodes([]),
    )
  )
  finalTween.then(delay(30));

  // Show the DFA.
  finalTween.then(
    new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      GS.exampleDFA.graph.alpha = v;
      GS.example.graph.alpha = 1 - v;
      numberNodes.forEach(n => n.graphic.alpha = v);
    }),
  )
  finalTween.then(delay(30));

  // Border accepting rows.
  const borderTweens = [2, 3, 4, 5].map((i) => {
    return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      GS.table.getContainer(i, 0).border.alpha = v;
    });
  });
  finalTween.then(...borderTweens, new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    Object.values(GS.exampleDFA.nodes).forEach(n => {
      n.innerCircle.alpha = v;
    })
  }));
  finalTween.then(delay(30));

  const moveDFATween = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    GS.exampleDFA.graph.position.set(2900, interpValue(1500, 1100, v));
    GS.exampleDFA.graph.scale.set(0.7 - 0.05 * v);
    GS.example.graph.alpha = v;
    GS.example.graph.scale.set(1 - 0.35 * v);
    GS.example.graph.position.set(2900, interpValue(1400, 1900, v));
  });
  finalTween.then(moveDFATween);
  finalTween.then(delay(30));

  const dfaPointer = new NodePointer(GS.exampleDFA, GS.exampleDFA.nodes[1], { fill: darkPurple });
  dfaPointer.alpha = 0;

  finalTween.then(
    new ImmediateTween(() => {
      posPointer.moveTo(topRightCorner(1, 0));
      nodePointers.forEach(np => {
        np.alpha = 0
        np.moveToNode(GS.example.nodes['A']);
      });
    }),
    new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      posPointer.graphic.alpha = v;
      dfaPointer.alpha = v;
      nodePointers[0].alpha = v;
    })
  )
  finalTween.then(delay(30));
  finalTween.then(
    movePosPointer(1, 1),
    moveBetween(1, 2, 60, GS.exampleDFA, dfaPointer),
    moveBetween('A', 'A', 60, GS.example, nodePointers[0]),
    moveBetween('A', 'B', 60, GS.example, nodePointers[1]),
    fadePointer(1, 1, 0),
  )
  finalTween.then(delay(30));
  finalTween.then(
    movePosPointer(2, 0),
    fadePointer(2, 1, 0),
    moveBetween('B', 'C', 30, GS.example, nodePointers[2])
    .then(
      moveBetween('C', 'D', 30, GS.example, nodePointers[3]),
      moveBetween('C', 'E', 30, GS.example, nodePointers[4]),
      fadePointer(3, 1, 0),
      fadePointer(4, 1, 0),
    )
  )
  finalTween.then(delay(30));
  finalTween.then(
    movePosPointer(2, 2),
    moveBetween(2, 3, 60, GS.exampleDFA, dfaPointer),
    moveBetween('A', 'C', 60, GS.example, nodePointers[0]),
    moveBetween('D', 'E', 60, GS.example, nodePointers[3]),
    fadePointer(1, 0, 60, red),
    fadePointer(2, 0, 60, red),
    fadePointer(4, 0, 60, red),
  )
  finalTween.then(delay(30));
  finalTween.then(
    movePosPointer(3, 0),
    moveBetween('C', 'D', 60, GS.example, nodePointers[1]),
    fadePointer(1, 1, 0),
  )
  finalTween.then(delay(30));
  finalTween.then(
    movePosPointer(3, 2, 30).then(movePosPointer(5, 0, 30)),
    moveBetween(3, 5, 60, GS.exampleDFA, dfaPointer),
    moveBetween('D', 'E', 60, GS.example, nodePointers[1]),
    fadePointer(0, 0, 60, red),
    fadePointer(3, 0, 60, red),
  )
  finalTween.then(delay(30));
  finalTween.then(
    movePosPointer(5, 2, 30).then(movePosPointer(6, 0, 30)),
    moveBetween(5, 6, 60, GS.exampleDFA, dfaPointer),
    fadePointer(1, 0, 60, red),
  )
  finalTween.then(delay(30));
  finalTween.then(
    moveBetween(6, 6, 60, GS.exampleDFA, dfaPointer),
  )
  finalTween.then(delay(30));

  finalTween.then(fadeTable(0, 60), new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.exampleDFA.graph.alpha = v;
    GS.example.graph.alpha = v;
    posPointer.graphic.alpha = v;
  }));


  TweenManager.add(finalTween);
}
const unloader = () => {}

export default { loader, unloader };
