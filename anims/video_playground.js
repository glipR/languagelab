import { bg_dark, black, green, orange, red } from "../colours.js";
import NFA from "../nfa.js";
import Screen from "../screen.js";
import { delay, ImmediateTween, interpValue, randomDelay, TweenManager, ValueTween } from "../tween.js";
import Table from "../tools/table.js";
import NodeGroup from "../tools/node_group.js";
import { RectangleCover } from "../tools/paper_cover.js";

const gsc = 4;

const baseNodeGroupOptions = {
  node: { isEntry: false },
  frameWidth: 75*gsc,
  maxSpacing: 50*gsc,
  scaling: 0.66,
  textScaling: 0.8,
  cross: {
    visible: false,
    size: 15*gsc,
    stroke: 5*gsc,
    color: red,
  },
  animSpeed: 15,
}

const baseTextStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

export const GS = {

};

export const starTransition = () => {
  const dfa1 = new NFA();
  dfa1.fromJSON({
    nodes: {
      "A": { x: -400, y: 0 },
      "B": { x: 400, y: 0 },
    },
    edges: [
      { from: "A", to: "B", label: "★" }
    ],
  });
  const dfa2 = new NFA();
  dfa2.fromJSON({
    nodes: {
      "A": { x: -400, y: 0 },
      "B": { x: 400, y: 0 },
    },
    edges: [
      { from: "A", to: "B", label: "a,b,c" }
    ],
  });
  dfa1.graph.position.set(1300, 1200)
  dfa2.graph.position.set(2700, 1200)
  dfa1.edges.forEach(e => e.labelBG.alpha = 1);
  dfa2.edges.forEach(e => e.labelBG.alpha = 1);
  GS.screen.addChild(dfa1.graph);
  GS.screen.addChild(dfa2.graph);
  return delay(0)
}

export const wordGroups = () => {
  const words = [ "aba", "aa", "baaa" ];
  const NFAJSON = { nodes: {}, edges: [] };
  const nfa = new NFA();
  words.map((word, i) => {
    Array.from(word).forEach((c, j) => {
      NFAJSON.nodes[`${"ABC"[i]}-${j}`] = { x: (-(word.length+1)/2 + j + 0.5) * 600, y: -600 + i * 600, start: j === 0 };
    });
    NFAJSON.nodes[`${"ABC"[i]}-${word.length}`] = { x: (-(word.length+1)/2 + word.length + 0.5) * 600, y: -600 + i * 600, accepting: true };
    NFAJSON.edges = NFAJSON.edges.concat(...Array.from(word).map((c, j) => ({ from: `${"ABC"[i]}-${j}`, to: `${"ABC"[i]}-${j+1}`, label: c })));
  });
  const wordNodes = {...NFAJSON.nodes};
  const wordEdges = [...NFAJSON.edges];
  NFAJSON.nodes['S'] = { x: -1600, y: 0, start: true };
  NFAJSON.nodes['E'] = { x: 1600, y: 0, accepting: true };
  let otherEdges = words.map((word, i) => ({ from: 'S', to: `${"ABC"[i]}-0`, label: 'ε' }));
  otherEdges = otherEdges.concat(words.map((word, i) => ({ from: `${"ABC"[i]}-${word.length}`, to: 'E', label: 'ε' })))
  otherEdges = otherEdges.concat([{ from: 'S', to: 'S', label: 'a, b' }, { from: 'E', to: 'E', label: 'a, b' }]);
  NFAJSON.edges = NFAJSON.edges.concat(otherEdges);
  nfa.fromJSON(NFAJSON);
  nfa.graph.position.set(2000, 1200);
  Object.values(nfa.nodes).forEach(n => {n.graphic.alpha = 0; n.separatedGraphic.alpha = 0;});
  nfa.edges.forEach(e => {
    e.drawnAmount = 0;
    e.updateGraphic();
  });
  GS.screen.addChild(nfa.graph);
  return delay(100)
  .then(randomDelay(Object.keys(wordNodes).map(k => nfa.nodes[k].tweenPop(60))))
  .then(delay(60))
  .then(randomDelay(wordEdges.map(fakeEdge => {
    const e = nfa.edgeMap[`${fakeEdge.from}->${fakeEdge.to}`];
    return e.growEdgeTween(60, GS.easings.easeInOutQuad)
    .during(e.showLabelTween(60, GS.easings.easeInOutQuad))
  })))
  .then(delay(60))
  // Hide the starts/ends from the word nodes.
  .then(...Object.keys(wordNodes).map(k => new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, v => {
    nfa.nodes[k].innerCircle.alpha = v;
    nfa.nodes[k].entry.alpha = v;
  })), nfa.nodes['S'].tweenPop(60), nfa.nodes['E'].tweenPop(60))
  .then(delay(60))
  .then(...otherEdges.map(fakeEdge => {
    const e = nfa.edgeMap[`${fakeEdge.from}->${fakeEdge.to}`];
    return e.growEdgeTween(60, GS.easings.easeInOutQuad)
    .during(e.showLabelTween(60, GS.easings.easeInOutQuad))
  }))
}

export const extraAccepting = () => {
  const nfa = new NFA();
  nfa.fromJSON({
    nodes: {
      A: { x: -500, y: -500, start: true },
      B: { x: 500, y: -500 },
      C: { x: 0, y: 0, accepting: true },
      D: { x: -500, y: 500 },
      E: { x: 500, y: 500, accepting: true },
      T: { x: 900, y: 0, accepting: true },
    },
    edges: [
      { from: 'A', to: 'C', label: 'a' },
      { from: 'C', to: 'B', label: 'b' },
      { from: 'C', to: 'E', label: 'a', style: { labelRatio: 0.6 } },
      { from: 'B', to: 'A', label: 'a' },
      { from: 'B', to: 'E', label: 'b', style: { labelRatio: 0.3 } },
      { from: 'D', to: 'A', label: 'b' },
      { from: 'E', to: 'D', label: 'a' },
      { from: 'C', to: 'T', label: 'ε', style: { stroke: { color: red } } },
      { from: 'E', to: 'T', label: 'ε', style: { stroke: { color: red } } },
      { from: 'T', to: 'T', label: 'a, b', style: { stroke: { color: red } } },
    ],
  })
  nfa.graph.position.set(2000, 1200);
  Object.values(nfa.nodes).forEach(n => {n.graphic.alpha = 0; n.separatedGraphic.alpha = 0;});
  nfa.edges.forEach(e => {e.labelBG.alpha = 1; e.drawnAmount = 0; e.updateGraphic()});
  GS.screen.addChild(nfa.graph);

  return delay(0)
  .then(randomDelay(Object.values(nfa.nodes).filter(n => n.label !== 'T').map(n => n.tweenPop(60))))
  .then(randomDelay(nfa.edges.filter(e => e.to.label !== 'T').map(e => {
    return e.growEdgeTween(60, GS.easings.easeInOutQuad)
    .during(e.showLabelTween(60, GS.easings.easeInOutQuad))
  })))
  .then(delay(60))
  .then(...Object.values(nfa.nodes).filter(n => n.label !== 'T').map(n => {
    return new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, v => {
      n.innerCircle.alpha = v;
    })
  }))
  .then(nfa.nodes['T'].tweenPop(60), delay(20).then(
    ...nfa.edges.filter(e => e.to.label === 'T').map(e => {
      return e.growEdgeTween(60, GS.easings.easeInOutQuad)
      .during(e.showLabelTween(60, GS.easings.easeInOutQuad))
    })
  ))
}

export const allPaths = () => {
  const nfa = new NFA();
  nfa.fromJSON({
    nodes: {
      S: { x: -1000, y: 0, start: true, accepting: true },
      A: { x: -300, y: 700, accepting: true },
      B: { x: 400, y: 700 },
      1: { x: -300, y: -700, accepting: true },
      2: { x: 400, y: -700 },
      3: { x: 1100, y: -700 },
    },
    edges: [
      { from: 'S', to: 1, label: 'ε', style: { edgeAnchor: { x: 150, y: 150 } } },
      { from: 'S', to: 2, label: 'a', style: { edgeAnchor: { x: 100, y: 200 } } },
      { from: 'S', to: 'A', label: 'ε', style: { edgeAnchor: { x: 150, y: -150 } } },
      { from: 1, to: 2, label: 'a' },
      { from: 2, to: 3, label: 'a' },
      { from: 3, to: 1, label: 'a', style: { edgeAnchor: { x: 0, y: -400 } } },
      { from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 0, y: -150 } } },
      { from: 'B', to: 'A', label: 'a', style: { edgeAnchor: { x: 0, y: 150 } } },
      { from: 'A', to: 'S', label: 'b', style: { edgeAnchor: { x: -150, y: 150 } } },
      { from: 1, to: 'S', label: 'b', style: { edgeAnchor: { x: -150, y: -150 } } },
      { from: 'S', to: 'S', label: 'b', style: { loopOffset: { x: -150, y: -300 }  } },
    ],
  });
  nfa.graph.position.set(2000, 1200);
  Object.values(nfa.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
  })
  nfa.edges.forEach(e => {
    e.labelBG.alpha = 1;
    e.drawnAmount = 0;
    e.updateGraphic();
  })
  GS.screen.addChild(nfa.graph);

  const table = new Table({ itemHeight: 280 });
  table.resize(5, 2);
  table.position.set(250, 200);
  table.alpha = 0;
  const nodeGroups = Array.from({length: 6}, () => Array.from({length: 3}, () => new NodeGroup(baseNodeGroupOptions, nfa, [])));
  nodeGroups.forEach((row, i) => {
    row.forEach((ng, j) => {
      table.getContainer(i, j).contents.addChild(ng);
    });
  });
  ["a", "b"].map((l, i) => {
    const text = new PIXI.Text(l, baseTextStyle);
    text.anchor.set(0.5, 0.5);
    text.position.set(0, 0);
    table.getContainer(0, i+1).contents.addChild(text);
    return text;
  });
  GS.screen.addChild(table);

  const selectBG = (i, j, target=0.2) => {
    return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      const bg = table.getContainer(i, j).background
      bg.alpha = interpValue(bg.startAlpha, target, v);
    }, () => {
      table.getContainer(i, j).background.startAlpha = table.getContainer(i, j).background.alpha;
    });
  }

  return delay(60)
    .then(
      randomDelay(Object.values(nfa.nodes).map(n => {
        return delay(0).then(
          n.tweenPop(60),
          delay(30).then(
            ...nfa.edges.filter(e => e.from.label === n.label).map(e => {
              return e.growEdgeTween(60, GS.easings.easeInOutQuad)
              .during(e.showLabelTween(60, GS.easings.easeInOutQuad))
            })
          )
        )
      }))
    )
    .then(delay(60))
    .then(
      new ValueTween(1, 0.7, 60, GS.easings.easeInOutQuad, v => nfa.graph.scale.set(v)),
      new ValueTween({ x: 2000, y: 1200 }, { x: 2800, y: 1200 }, 60, GS.easings.easeInOutQuad, v => nfa.graph.position.set(v.x, v.y)),
      new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, v => table.alpha = v),
      nodeGroups[1][0].setNodes(['S', '1', 'A'], 0),
    )
    .then(
      selectBG(1, 1),
      nfa.edgeMap['S->2'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['1->2'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['A->B'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['S'].tweenColor(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['1'].tweenColor(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(green, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      nodeGroups[1][1].setNodes(['B', '2']),
      nfa.edgeMap['S->2'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['1->2'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['A->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.nodes['S'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['1'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      selectBG(1, 1, 0),
    )
    .then(delay(60))
    .then(
      selectBG(1, 2),
      nfa.edgeMap['S->S'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['1->S'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['A->S'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['S->1'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['S->A'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      nfa.nodes['S'].tweenColor(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['1'].tweenColor(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(green, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      selectBG(1, 2, 0),
      nodeGroups[1][2].setNodes(['S', '1', 'A']),
      nfa.edgeMap['S->S'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['1->S'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['A->S'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['S->1'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['S->A'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.nodes['S'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['1'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
    )
    .then(
      nodeGroups[2][0].setNodes(['B', '2']),
    )
    .then(
      selectBG(2, 1),
      nfa.edgeMap['2->3'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['B->A'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['B'].tweenColor(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['2'].tweenColor(green, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      selectBG(2, 1, 0),
      nodeGroups[2][1].setNodes(['3', 'A']),
      nfa.edgeMap['2->3'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['B->A'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.nodes['B'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['2'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
    )
    .then(
      selectBG(2, 2),
      nfa.nodes['B'].tweenColor(red, 60, GS.easings.easeInOutQuad),
      nfa.nodes['2'].tweenColor(red, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      selectBG(2, 2, 0),
      new ImmediateTween(() => {
        nodeGroups[2][2].style.cross.visible = true;
      }),
      nodeGroups[2][2].setNodes([]),
      nfa.nodes['B'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['2'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
    )
    .then(
      nodeGroups[3][0].setNodes(['3', 'A']),
    )
    .then(
      selectBG(3, 1),
      nfa.edgeMap['3->1'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['A->B'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['3'].tweenColor(green, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(green, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      selectBG(3, 1, 0),
      nodeGroups[3][1].setNodes(['1', 'B']),
      nfa.edgeMap['3->1'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['A->B'].colorEdgeTween(black, 60, GS.easings.easeInOutQuad),
      nfa.nodes['3'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(bg_dark, 60, GS.easings.easeInOutQuad),
    )
    .then(
      selectBG(3, 2),
      nfa.edgeMap['A->S'].colorEdgeTween(green, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['S->1'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      nfa.edgeMap['S->A'].colorEdgeTween(orange, 60, GS.easings.easeInOutQuad),
      nfa.nodes['3'].tweenColor(red, 60, GS.easings.easeInOutQuad),
      nfa.nodes['A'].tweenColor(green, 60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      selectBG(3, 2, 0),
      new ImmediateTween(() => {
        nodeGroups[3][2].style.cross.visible = true;
      }),
      nodeGroups[3][2].setNodes([]),
    )
}

export const gridNFA = () => {
  const nfa = new NFA();
  const NFAJSON = { nodes: {}, edges: [] };
  for (let i=0; i<3; i++) {
    for (let j=0; j<2; j++) {
      const prefix = `(${i},${j}):`
      const [A, B, C, D] = [`${prefix}A`, `${prefix}B`, `${prefix}C`, `${prefix}D`]
      const offset = {
        x: 800 + (2-i) * 1200,
        y: 700 + (1-j) * 1300
      }
      const miniLabel = {
        fontFamily: 'Ittybittynotebook',
        fontSize: 24 * gsc,
      }
      // Sub-NFA
      NFAJSON.nodes[A] = { x: offset.x + -250, y: offset.y + -250, start: true, accepting: true }
      NFAJSON.nodes[B] = { x: offset.x + 250, y: offset.y + -250 }
      NFAJSON.nodes[C] = { x: offset.x + 250, y: offset.y + 250 }
      NFAJSON.nodes[D] = { x: offset.x + -250, y: offset.y + 250 }
      NFAJSON.edges = NFAJSON.edges.concat(
        { from: A, to: B, label: 'a', style: { labelStyle: miniLabel, edgeLabelOffset: 4 } },
        { from: A, to: A, label: 'b', style: { loopOffset: { x: 0, y: -200 }, labelStyle: miniLabel, edgeLabelOffset: 4 } },
        { from: B, to: C, label: 'a', style: { labelStyle: miniLabel, edgeLabelOffset: 4 } },
        { from: C, to: D, label: 'a', style: { labelStyle: miniLabel, edgeLabelOffset: 4 } },
        { from: D, to: A, label: 'a', style: { labelStyle: miniLabel, edgeLabelOffset: 4 } },
        { from: B, to: D, label: 'a', style: { labelStyle: miniLabel, edgeLabelOffset: 4 } },
      );
      if (i > 0) {
        NFAJSON.edges.push({
          from: B, to: `(${i-1},${j}):D`, label: 'a', style: { labelRatio: 0.3, labelStyle: miniLabel, edgeLabelOffset: 4 }
        });
      }
      if (j > 0) {
        NFAJSON.edges.push({
          from: A, to: `(${i},${j-1}):A`, label: 'b', style: { edgeAnchor: { x: -500, y: 50 }, anchorOffsetMult: 1, labelStyle: miniLabel, edgeLabelOffset: 4 }
        });
      }
    }
  }
  nfa.fromJSON(NFAJSON);
  Object.values(nfa.nodes).forEach(n => {
    n.graphic.alpha = 0;
    n.separatedGraphic.alpha = 0;
    n.actualLabel = n.label;
    n.label = n.label.split(":")[1];
    n.labelText.text = n.label;
    n.updateGraphic();
  });
  nfa.edges.forEach(e => { e.drawnAmount = 0; e.updateGraphic(); });
  GS.screen.addChild(nfa.graph);

  const indexes = Array.from({ length: 6 }, (_, i) => ({ i: i % 3, j: Math.floor(i / 3) }));
  const headers = indexes.map(({i, j}) => {
    const container = new PIXI.Container();
    const text = new PIXI.Text(`(${i},${j})`, baseTextStyle);
    text.anchor.set(0.5, 0.5);
    const cover = new RectangleCover(text, {});
    container.addChild(cover);
    container.addChild(text);
    container.position.set(800 + (2-i) * 1200, 150 + (1-j) * 1300);
    container.alpha = 0;
    return container;
  });
  headers.forEach(h => GS.screen.addChild(h));

  const getEdge = (i, j, from, to, otherI, otherJ) => {
    return nfa.edgeMap[`(${i},${j}):${from}->(${otherI === undefined ? i : otherI},${otherJ === undefined ? j : otherJ}):${to}`];
  }

  const oldEdges = (i, j) => {
    return [
      getEdge(i, j, 'A', 'A'),
      getEdge(i, j, 'B', 'D'),
    ];
  }
  const newEdges = (i, j) => {
    const edges = [];
    if (i > 0) {
      edges.push(getEdge(i, j, 'A', 'A', i-1, j))
    }
    if (j > 0) {
      edges.push(getEdge(i, j, 'B', 'D', i, j-1))
    }
  }

  return delay(60)
    .then(...Object.values(nfa.nodes).map(n => n.tweenPop(60)), ...headers.map(h => new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, v => h.alpha = v)))
    .then(...nfa.edges.filter(e => e.from.actualLabel.split(':')[0] === e.to.actualLabel.split(':')[0]).map(e => {
      return e.showLabelTween(60, GS.easings.easeInOutQuad)
      .during(e.growEdgeTween(60, GS.easings.easeInOutQuad));
    }))
    .then(delay(60))
    .then(
      getEdge(2, 1, 'B', 'D').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(2, 0, 'B', 'D').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
    )
    .then(
      getEdge(2, 1, 'B', 'D').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 0, 'B', 'D').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 1, 'B', 'D').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 0, 'B', 'D').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 1, 'B', 'D', 1, 1).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 1, 'B', 'D', 1, 1).growEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 0, 'B', 'D', 1, 0).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 0, 'B', 'D', 1, 0).growEdgeTween(60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      getEdge(1, 1, 'B', 'D').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'B', 'D').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
    )
    .then(
      getEdge(1, 1, 'B', 'D').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'B', 'D').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'B', 'D').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'B', 'D').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'B', 'D', 0, 1).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'B', 'D', 0, 1).growEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'B', 'D', 0, 0).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'B', 'D', 0, 0).growEdgeTween(60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      getEdge(0, 1, 'B', 'D').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(0, 0, 'B', 'D').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
    )
    .then(
      getEdge(0, 1, 'B', 'D').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 0, 'B', 'D').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 1, 'B', 'D').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 0, 'B', 'D').hideEdgeTween(60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      getEdge(2, 1, 'A', 'A').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'A', 'A').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(0, 1, 'A', 'A').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
    )
    .then(
      getEdge(2, 1, 'A', 'A').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'A', 'A').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 1, 'A', 'A').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 1, 'A', 'A').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'A', 'A').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 1, 'A', 'A').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 1, 'A', 'A', 2, 0).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 1, 'A', 'A', 2, 0).growEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'A', 'A', 1, 0).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 1, 'A', 'A', 1, 0).growEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 1, 'A', 'A', 0, 0).showLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 1, 'A', 'A', 0, 0).growEdgeTween(60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      getEdge(2, 0, 'A', 'A').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'A', 'A').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
      getEdge(0, 0, 'A', 'A').colorEdgeTween(red, 60, GS.easings.easeInOutQuad),
    )
    .then(
      getEdge(2, 0, 'A', 'A').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'A', 'A').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 0, 'A', 'A').hideEdgeTween(60, GS.easings.easeInOutQuad),
      getEdge(2, 0, 'A', 'A').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(1, 0, 'A', 'A').hideLabelTween(60, GS.easings.easeInOutQuad),
      getEdge(0, 0, 'A', 'A').hideLabelTween(60, GS.easings.easeInOutQuad),
    )
    .then(delay(60))
    .then(
      ...indexes.map(({i, j}) => {
        const node = nfa.nodes[`(${i},${j}):A`];
        if (i === 2 && j === 1) return new ValueTween(green, black, 60, GS.easings.easeInOutQuad, v => {
          node.style.entryStroke = v;
          node.updateGraphic()
        });
        return new ImmediateTween(() => {
          node.style.entryStroke = red;
          node.updateGraphic()
        }).then(new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, v => node.entry.alpha = v));
      })
    )
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();
  GS.easings = easings;
  GS.opts = opts;

  TweenManager.add(allPaths());
}

const unloader = () => {}

export default { loader, unloader }
