import {black, bg_dark, highlightColours, green, red} from '../colours.js';
import Graph, { Node, AbstractEdge } from '../graph.js';
import { Tween, TweenManager, ValueTween, interpValue, delay, randomDelay } from '../tween.js';
import { combineEasing, mergeDeep, reverseEasing } from '../utils.js';
import StyledText from '../text.js';
import Screen from '../screen.js';
import DFA from '../dfa.js';
import { RectangleCover } from '../tools/paper_cover.js';

const GS = {
  curWordIndex: 0,
};

const baseStyle = new PIXI.TextStyle({
  fontFamily: "Ittybittynotebook",
  fontSize: 32,
  fill: black,
  align: 'center',
});

const colorMap = {
  'A': highlightColours[0],
  'B': highlightColours[1],
  'C': highlightColours[2],
  'D': highlightColours[3],
  'E': highlightColours[4],
}

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
  const oldWordIndex = GS.curWordIndex;
  const curWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
  GS.curWordIndex++;
  if (word && GS.curWordIndex >= word.length) {
    GS.curWordIndex--;
  }
  const newWordIndex = GS.curWordIndex;
  const newWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
  const tween = new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
    const pos = edge.edgeInterp(v).position;
    if (nodePointer) nodePointer.position.set(pos.x, pos.y - 60);
  })
    .during(edge.colorEdgeTween(red, duration, flashEasing(), false));

  if (oldWordIndex != newWordIndex) {
    if (wordPointer) tween.during(new ValueTween(curWordPos, newWordPos, duration, GS.easings.easeInOutQuad, (v) => {
      wordPointer.position.set(v.x, v.y);
    }));
    if (word) tween.during(new ValueTween(black, red, duration, GS.easings.easeInOutQuad, (v) => {
      word[newWordIndex].style.fill = v;
    }));
  }
  if (word) tween.during(new ValueTween(red, bg_dark, duration, GS.easings.easeInOutQuad, (v) => {
    word[oldWordIndex].style.fill = v;
  }));
  return tween;
};

const example1 = () => {
  const g = new DFA();
  g.fromJSON({
    nodes: {
      S: { x: 300, y: 300, start: true, final: true },
      A: { x: 700, y: 150, final: true },
      B: { x: 700, y: 450 },
    },
    edges: [
      { from: 'S', to: 'A', label: 'a' },
      { from: 'S', to: 'B', label: 'b' },
      { from: 'A', to: 'A', label: 'a, b' },
      { from: 'B', to: 'B', label: 'a, b' },
    ]
  });
  GS.screen.addChild(g.graph);
  Object.values(g.nodes).forEach(n => {
    n.graphic.visible = false;
    n.separatedGraphic.visible = false;
    n.innerCircle.alpha = 0;
    n.entry.alpha = 0;
  });
  g.edges.forEach(e => {
    e.drawnAmount = 0;
    e.labelText.alpha = 0;
    e.updateGraphic();
  });

  // Show S node
  // Show A and B node staggered
  // Show start and final states (S and A respectively)
  // Show edges from S to A and B
  // Show edges from A and B to themselves
  // Make S the final state too
  // Simulate word starting with b
  // Simulate word starting with a
  // Fade all

  const nodeFadeIns = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: n.tweenPop(60)
  }), {});

  const startFade = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    g.nodes['S'].entry.alpha = v;
    g.nodes['S'].updateGraphic();
  });
  const finalFades = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
      n.updateGraphic();
    })
  }), {});
  const edgeDrags = g.edges.map(e => [e, e.growEdgeTween(120, GS.easings.easeInOutQuad), e.showLabelTween(60, GS.easings.easeInOutQuad)]);
  const fadeAll = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    g.graph.alpha = v;
  });

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5, -10, 10, 20).fill(black);
  nodePointer.moveTo(-10, 10).lineTo(10, 10).lineTo(0, 25).lineTo(-10, 10).fill(black);
  nodePointer.position.set(g.nodes['S'].position.x, g.nodes['S'].position.y - 60);
  nodePointer.alpha = 0;
  GS.screen.addChild(nodePointer);

  const nodeFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  const moveMovement = moveBetween('S', 'B', 60, g, nodePointer)
    .then(moveBetween('B', 'B', 45, g, nodePointer))
    .then(moveBetween('B', 'B', 45, g, nodePointer))
    .then(new ValueTween(g.nodes['B'].position, g.nodes['S'].position, 60, GS.easings.easeInOutQuad, (v) => {
      nodePointer.position.set(v.x, v.y - 60);
    }))
    .then(moveBetween('S', 'A', 60, g, nodePointer))
    .then(moveBetween('A', 'A', 45, g, nodePointer))
    .then(moveBetween('A', 'A', 45, g, nodePointer))

  const nodeFadeOut = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  return delay(0)
    .then(nodeFadeIns['S'])
    .then(delay(30))
    .then(nodeFadeIns['A'], delay(20).then(nodeFadeIns['B']))
    .then(delay(60))
    .then(startFade, finalFades['A'])
    .then(delay(60))
    // Edges from S
    .then(...edgeDrags.filter(e => e[0].from.label === 'S').map(e => e.slice(1)).flat())
    .then(delay(60))
    // All other edges
    .then(...edgeDrags.filter(e => e[0].from.label !== 'S').map(e => e.slice(1)).flat())
    .then(delay(60))
    // Make S final
    .then(finalFades['S'])
    .then(delay(60))
    .then(nodeFadeIn)
    .then(moveMovement)
    .then(nodeFadeOut)
    .then(fadeAll);
}

const example2 = () => {
  const g = new DFA();
  g.fromJSON({
    nodes: {
      E: { x: 300, y: 300, start: true, final: true },
      O: { x: 700, y: 300 },
    },
    edges: [
      { from: 'E', to: 'O', label: 'a', style: { edgeAnchor: {
        x: 0,
        y: -60,
      }, arrow: { endOffsetPortion: 0.09 } } },
      { from: 'O', to: 'E', label: 'a', style: { edgeAnchor: {
        x: 0,
        y: 60,
      }, arrow: { endOffsetPortion: 0.09 } } },
      { from: 'E', to: 'E', label: 'b' },
      { from: 'O', to: 'O', label: 'b' },
    ]
  });
  GS.screen.addChild(g.graph);
  Object.values(g.nodes).forEach(n => {
    n.graphic.visible = false;
    n.separatedGraphic.visible = false;
    n.innerCircle.alpha = 0;
  });
  g.edges.forEach(e => {
    e.drawnAmount = 0;
    e.labelText.alpha = 0;
    e.updateGraphic();
  });

  // Show E and O node staggered, include entry
  // Show a transitions
  // Show b transitions
  // Make E final state
  // Simulate
  // Fade all

  const nodeFadeIns = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: n.tweenPop(60)
  }), {});

  const finalFades = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
      n.updateGraphic();
    })
  }), {});
  const edgeDrags = g.edges.map(e => [e, e.growEdgeTween(120, GS.easings.easeInOutQuad), e.showLabelTween(60, GS.easings.easeInOutQuad)]);
  const fadeAll = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    g.graph.alpha = v;
  });

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5, -10, 10, 20).fill(black);
  nodePointer.moveTo(-10, 10).lineTo(10, 10).lineTo(0, 25).lineTo(-10, 10).fill(black);
  nodePointer.position.set(g.nodes['E'].position.x, g.nodes['E'].position.y - 60);
  nodePointer.alpha = 0;
  GS.screen.addChild(nodePointer);

  const nodeFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  const moveMovement = moveBetween('E', 'O', 60, g, nodePointer)
    .then(moveBetween('O', 'E', 45, g, nodePointer))
    .then(moveBetween('E', 'O', 45, g, nodePointer))
    .then(moveBetween('O', 'O', 45, g, nodePointer))
    .then(moveBetween('O', 'E', 45, g, nodePointer))
    .then(moveBetween('E', 'E', 45, g, nodePointer))

  const nodeFadeOut = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  return delay(0)
    .then(nodeFadeIns['E'], delay(20).then(nodeFadeIns['O']))
    .then(delay(60))
    // Edges from S
    .then(...edgeDrags.filter(e => e[0].from.label !== e[0].to.label).map(e => e.slice(1)).flat())
    .then(delay(60))
    // All other edges
    .then(...edgeDrags.filter(e => e[0].from.label === e[0].to.label).map(e => e.slice(1)).flat())
    .then(delay(60))
    // Make E final
    .then(finalFades['E'])
    .then(delay(60))
    .then(nodeFadeIn)
    .then(moveMovement)
    .then(nodeFadeOut)
    .then(fadeAll);
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.graph = new Graph();
  const nodeStyle = { radius: 30, fill: bg_dark, strokeWidth: 3, stroke: black, showLabel: true };
  const edgeStyle = (lab) => ({ lineWidth: 5, edgeLabel: lab, stroke: black, arrow: {
    direction: 'forward',
    position: 'end',
    size: 20,
    width: 5,
    endOffset: 30,
  } });
  GS.graph.fromJSON({
    nodes: {
      A: { position: { x: 250, y: 300 }, style: {...nodeStyle, isEntry: true, entryWidth: 5 } },
      B: { position: { x: 500, y: 300 }, style: nodeStyle },
      C: { position: { x: 750, y: 300 }, style: {...nodeStyle, doubleBorder: black } },
      D: { position: { x: 375, y: 500 }, style: {...nodeStyle, doubleBorder: black } },
      E: { position: { x: 625, y: 500 }, style: nodeStyle },
    },
    edges: [
      { from: 'A', to: 'B', style: edgeStyle('a') },
      { from: 'A', to: 'D', style: edgeStyle('b') },
      { from: 'B', to: 'C', style: edgeStyle('a, b') },
      { from: 'C', to: 'A', style: {
        ...edgeStyle('b'),
        edgeAnchor: {
          x: 0,
          y: -100,
        },
        arrow: {...edgeStyle('b').arrow, endOffsetPortion: 0.09},
      } },
      { from: 'C', to: 'C', style: edgeStyle('a') },
      { from: 'D', to: 'D', style: edgeStyle('b') },
      { from: 'D', to: 'E', style: edgeStyle('a') },
      { from: 'E', to: 'B', style: edgeStyle('b') },
      { from: 'E', to: 'C', style: edgeStyle('a') },
    ]
  });

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();

  const graphContainer = new PIXI.Container();
  graphContainer.addChild(GS.graph.graph);
  graphContainer.pivot.set(500, 300);
  graphContainer.position.set(500, 300);
  GS.screen.addChild(graphContainer);


  const tableContainer = new PIXI.Container();
  const tableLines = new PIXI.Graphics();
  tableLines
    .moveTo(675, 160)
    .lineTo(675, 520)
    .moveTo(787.5, 160)
    .lineTo(787.5, 520)
    .moveTo(600, 220)
    .lineTo(900, 220)
    .moveTo(600, 280)
    .lineTo(900, 280)
    .moveTo(600, 340)
    .lineTo(900, 340)
    .moveTo(600, 400)
    .lineTo(900, 400)
    .moveTo(600, 460)
    .lineTo(900, 460)
    .stroke({ color: black, width: 3 });
  const tableHeaders = [
    new PIXI.Text({ text: 'a', style: {...baseStyle, fill: black}}),
    new PIXI.Text({ text: 'b', style: {...baseStyle, fill: black}}),
  ];
  const tablePaper = new RectangleCover(tableLines, {points: 18, randMult: 0.1});
  tablePaper.position.set(750, 330);
  tableContainer.addChild(tablePaper);
  tableHeaders.forEach((t, i) => {
    t.anchor.set(0.5, 0.5);
    t.position.set(675 + 112.5/2 + i * 112.5, 190);
    tableContainer.addChild(t);
  });
  tableContainer.addChild(tableLines);
  tableContainer.alpha = 0;

  GS.screen.addChild(tableContainer);

  const word_text = "bbabaabb";
  const word = word_text.split('').map(c => new PIXI.Text(c, {...baseStyle}));
  const wordContainer = new PIXI.Container();
  const wordWidth = 20;
  word.forEach((c, i) => {
    c.anchor.set(0, 1);
    c.position.set((i == 0) ? 0 : (word[i-1].position.x + wordWidth), 0);
    wordContainer.addChild(c);
  });
  wordContainer.pivot.set(wordContainer.width/2, -wordContainer.height/2);
  wordContainer.position.set(500, 120);
  wordContainer.alpha = 0;
  const wordCover = new RectangleCover(wordContainer, {points: 18, randMult: 0.1});
  wordCover.position.set(500, 120);
  wordCover.alpha = 0;
  GS.screen.addChild(wordCover);
  GS.screen.addChild(wordContainer);

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5, -10, 10, 20).fill(black);
  nodePointer.moveTo(-10, 10).lineTo(10, 10).lineTo(0, 25).lineTo(-10, 10).fill(black);
  nodePointer.position.set(GS.graph.nodes['A'].position.x, GS.graph.nodes['A'].position.y - 60);
  GS.screen.addChild(nodePointer);

  const wordPointer = new PIXI.Graphics();
  wordPointer.rect(1, 0, 11, 3).fill(highlightColours[2]);
  wordPointer.position.set(wordIndexPosition(0, word).x, wordIndexPosition(0, word).y);
  GS.screen.addChild(wordPointer);

  // Setup to hide elements
  Object.values(GS.graph.nodes).forEach(n => {
    n.graphic.visible = false;
    n.separatedGraphic.visible = false;
    n.innerCircle.alpha = 0;
    n.entry.alpha = 0;
  });
  GS.graph.edges.forEach(e => {
    e.drawnAmount = 0;
    e.labelText.alpha = 0;
    e.updateGraphic();
  });
  nodePointer.alpha = 0;
  wordPointer.alpha = 0;

  // T: Text
  // T: A deterministic finite automaton is kind of like an algorithm for identifying if a particular word is in a language.

  // T: It's made up of
  // T: states
  const vertFadeIns = randomDelay(Object.values(GS.graph.nodes).map(n => {
    return n.tweenPop(60);
  }));
  // T: , and those states are connected by
  // T: transitions.
  const edgeDrags = GS.graph.edges.map(e => {
    return e.growEdgeTween(120, easings.easeInOutQuad);
  });
  const edgeLabels = GS.graph.edges.map(e => {
    return e.showLabelTween(60, easings.easeInOutQuad);
  });
  // T: In a DFA, every
  // T: state
  const vertColorTweens = Object.values(GS.graph.nodes).map(n => {
    return n.tweenColor(colorMap[n.label], 60, easings.easeInOutQuad);
  });
  // T: has exactly one transition,
  // T: per letter in the alphabet to some other state.
  const edgeColorTweens = GS.graph.edges.map(e => {
    return e.colorEdgeTween(colorMap[e.from.label], 60, easings.easeInOutQuad, true);
  });
  const graphShrinkAndShift = new ValueTween({ x: 500, y: 300 }, { x: 300, y: 300 }, 60, easings.easeInOutQuad, (v) => {
    graphContainer.position.set(v.x, v.y);
  }).during(new ValueTween(1, 0.8, 60, easings.easeInOutQuad, (v) => {
    graphContainer.scale.set(v);
  })).during(new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    tableContainer.alpha = v;
  }));
  const copyNodes = [];
  const copyNodesMove = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    copyNodes.forEach(n => {
      n.position = interpValue(n.startPosition, n.desiredPosition, v);
      n.updateGraphic();
    });
  }, () => {Object.values(GS.graph.nodes).forEach(n => {
    const copy = new Node(n.label, n.position, {...n.style});
    copy.graphic.scale.set(0.8);
    copy.startPosition = tableContainer.toLocal(GS.graph.graph.toGlobal(n.position));
    copy.desiredPosition = { x: 630, y: 250 + 60 * "ABCDE".indexOf(n.label)};
    copy.updateGraphic();
    copyNodes.push(copy);
    // Keep the same transform
    tableContainer.addChild(copy.graphic);
  })});
  const copyEdges = {};
  const copyEdgesMove = new ValueTween(0, 1, 160, easings.easeInOutQuad, (v) => {
    Object.values(copyEdges).forEach(e => {
      e.from.position = interpValue(e.from.startPosition, e.from.desiredPosition, v);
      e.to.position = interpValue(e.to.startPosition, e.to.desiredPosition, v);
      e.updateGraphic();
    });
  }, () => {
    GS.graph.edges.forEach(e => {
      e.style.edgeLabel.split(',').forEach((lab, i) => {
        const char = lab.trim();
        const fakeSource = new Node(e.from.label, e.from.position, {...e.from.style});
        let fakeDest = new Node(e.to.label, e.to.position, {...e.to.style});
        if (e.from.label === e.to.label) {
          fakeDest = fakeSource
        }
        fakeSource.graphic.visible = false;
        fakeSource.startPosition = tableContainer.toLocal(GS.graph.graph.toGlobal(fakeSource.position));
        fakeDest.graphic.visible = false;
        fakeDest.startPosition = tableContainer.toLocal(GS.graph.graph.toGlobal(fakeDest.position));
        const edgeStyleCopy = mergeDeep({},
          {...edgeStyle(e.style.edgeLabel)},
          {
            stroke: e.style.stroke,
            edgeLabelOffset: 4,
          },
          e.from.label === e.to.label ? {
            loopOffset: {x: 0, y: -20},
            loopAnchorMult: 0.7,
            arrow: {
              size: 15,
              width: 3,
              position: 'middle',
              offsetPosition: {x: 7, y: 0},
            }
          } : {},
        );
        const copy = AbstractEdge.decide(fakeSource, fakeDest, edgeStyleCopy);
        tableContainer.addChild(copy.graphic);
        if (e.from.label === e.to.label) {
          fakeSource.desiredPosition = {x: 675 + 112.5/2 + "ab".indexOf(char) * 112.5, y: 275 + 60 * "ABCDE".indexOf(e.from.label)};
          fakeDest.desiredPosition = {x: 675 + 112.5/2 + "ab".indexOf(char) * 112.5, y: 275 + 60 * "ABCDE".indexOf(e.from.label)};
        } else {
          fakeSource.desiredPosition = {x: 675 + 112.5*(-0.2) + "ab".indexOf(char) * 112.5, y: 260 + 60 * "ABCDE".indexOf(e.from.label)};
          fakeDest.desiredPosition = {x: 675 + 112.5*(1.2) + "ab".indexOf(char) * 112.5, y: 260 + 60 * "ABCDE".indexOf(e.from.label)};
        }
        copyEdges[copy.from.label + char] = copy;
      });
    });
  });

  const removeAll = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
    copyNodes.forEach(n => {
      n.graphic.alpha = v;
    });
    Object.values(copyEdges).forEach(e => {
      e.graphic.alpha = v;
    });
    tableContainer.alpha = v;
  }, () => {}, () => {
    copyNodes.forEach(n => {
      tableContainer.removeChild(n.graphic);
      n.graphic.destroy();
    });
    Object.values(copyEdges).forEach(e => {
      tableContainer.removeChild(e.graphic);
      e.graphic.destroy();
    });
  }).during(new ValueTween(0.8, 1, 60, easings.easeInOutQuad, (v) => {
    graphContainer.scale.set(v);
  })).during(new ValueTween({ x: 300, y: 300 }, { x: 500, y: 300 }, 60, easings.easeInOutQuad, (v) => {
    graphContainer.position.set(v.x, v.y);
  }));

  // T: To use the DFA,
  // T: we provide a
  const fadeVertColorTweens = Object.values(GS.graph.nodes).map(n => {
    return n.tweenColor(bg_dark, 60, easings.easeInOutQuad);
  });
  const fadeEdgeColorTweens = GS.graph.edges.map(e => {
    return e.colorEdgeTween(black, 60, easings.easeInOutQuad, true);
  });
  // T: word
  const fadeWordTween = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    wordContainer.alpha = v;
    wordCover.alpha = v;
  });
  // T: , and we can use the DFA to then find if this word is in the language.
  // TODO: \in L or \notin L ?
  // T: A DFA needs two more things before we can use it, a
  // T: starting state and
  const vertStartTweens = Object.values(GS.graph.nodes).map(n => {
    return new ValueTween(0, 1, 90, easings.easeInOutQuad, (v) => {
      n.entry.alpha = v;
      if (n.style.isEntry) {
        n.style.fill = interpValue(n.curFill, green, v);
        n.updateGraphic();
      }
    }, () => {
      n.curFill = n.style.fill;
    });
  });
  // T: some final states.
  const vertEndTweens = Object.values(GS.graph.nodes).map(n => {
    return new ValueTween(0, 1, 90, easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
      if (n.style.doubleBorder) {
        n.style.fill = interpValue(n.curFill, red, v);
        n.updateGraphic();
      }
    }, () => {
      n.curFill = n.style.fill;
    });
  });
  // T: We can then place a
  // T: pointer on the start state
  const pointerFade = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
    wordPointer.alpha = v;
  }).during(new ValueTween(black, red, 60, easings.easeInOutQuad, (v) => {
    word[0].style.fill = v;
  }));
  // T: and begin to execute the algorithm
  // T: We do this by taking each letter in the [word], and moving along the [associated transition] to a [new state].
  // Line up the [] with elements of the first movement.
  const algorithmExecution = moveBetween('A', 'D', 120, GS.graph, nodePointer, wordPointer, word)
    .then(delay(60))
    .then(moveBetween('D', 'D', 120, GS.graph, nodePointer, wordPointer, word))
    .then(delay(45))
    .then(moveBetween('D', 'E', 90, GS.graph, nodePointer, wordPointer, word))
    .then(delay(30))
    .then(moveBetween('E', 'B', 60, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('B', 'C', 60, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('C', 'C', 60, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('C', 'A', 60, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('A', 'D', 60, GS.graph, nodePointer, wordPointer, word))

  const fadeAll = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
    GS.graph.graph.alpha = v;
    wordContainer.alpha = v;
    wordCover.alpha = v;
    nodePointer.alpha = v;
    wordPointer.alpha = v;
  });

  //

  const e1 = example1();
  const e2 = example2();

  TweenManager.add(delay(100) // was 510
    .then(vertFadeIns) // 60
    .then(delay(90))
    .then(...edgeDrags) // 120
    .then(...edgeLabels) // 60
    .then(delay(160))
    .then(...vertColorTweens) // 60
    .then(delay(60))
    .then(...edgeColorTweens) // 60
    .then(graphShrinkAndShift) // 60
    .then(copyNodesMove) // 60
    .then(copyEdgesMove) // 160
    .then(delay(240))
    .then(removeAll)
    .then(...fadeVertColorTweens, ...fadeEdgeColorTweens) // 60
    .then(delay(60))
    .then(fadeWordTween) // 60
    .then(delay(60))
    .then(...vertStartTweens) // 90
    .then(delay(60))
    .then(...vertEndTweens) // 90
    .then(delay(60))
    .then(pointerFade) // 60
    .then(delay(60))
    .then(algorithmExecution)
    .then(fadeAll)
    .then(e1).then(delay(30))
    .then(e2).then(delay(30))
    .then(new Tween(1, easings.easeInOutQuad, ()=>{}, ()=>{}, onSuccess))
  );

}

const unloader = (app) => {
}

export default { loader, unloader };
