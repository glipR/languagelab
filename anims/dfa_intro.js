import {black, bg_dark, highlightColours, green, red, purple} from '../colours.js';
import Graph, { Node, AbstractEdge } from '../graph.js';
import { Tween, TweenManager, ValueTween, interpValue, delay, randomDelay } from '../tween.js';
import { combineEasing, mergeDeep, reverseEasing, vectorCombine } from '../utils.js';
import Screen from '../screen.js';
import DFA from '../dfa.js';
import { RectangleCover } from '../tools/paper_cover.js';
import { DrawnBezier } from '../tools/drawnBezier.js';

// Since this is a video, I want to be able to scale this up for when recording.
// I should've just made it high res the whole time, but too late now.
const gsc = window.gameScaling ?? 1;

const GS = {
  curWordIndex: 0,
};

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

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
  if (!edge) return new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, () => {});
  const oldWordIndex = GS.curWordIndex;
  const curWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
  GS.curWordIndex++;
  if (word && GS.curWordIndex >= word.length) {
    GS.curWordIndex--;
  }
  const newWordIndex = GS.curWordIndex;
  const newWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
  const tween = new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
    const pos = edge.bezierEdgeInterp(v).position;
    if (nodePointer) nodePointer.position.set(pos.x, pos.y - 60 * gsc);
  })
    .during(edge.colorEdgeTween(purple, duration, flashEasing(), false));

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
  return tween;
};

const example1 = () => {
  GS.example1Container = new PIXI.Container();
  GS.example1Container.pivot.set(500 * gsc, 300 * gsc);
  GS.example1Container.position.set(500 * gsc, 300 * gsc);
  GS.screen.addChild(GS.example1Container);
  const g = new DFA();
  g.fromJSON({
    nodes: {
      S: { x: 300 * gsc, y: 300 * gsc, start: true, accepting: true },
      A: { x: 700 * gsc, y: 150 * gsc, accepting: true },
      B: { x: 700 * gsc, y: 450 * gsc },
    },
    edges: [
      { from: 'S', to: 'A', label: 'a' },
      { from: 'S', to: 'B', label: 'b' },
      { from: 'A', to: 'A', label: 'a, b' },
      { from: 'B', to: 'B', label: 'a, b' },
    ]
  });
  GS.example1Container.addChild(g.graph);
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

  const problemHeading = new PIXI.Text({ text: "Example 1", style: {...baseStyle}});
  const problemText = new PIXI.Text({ text: "Words not starting with b.", style: {...baseStyle}});
  const alphabetText = new PIXI.Text({ text: "Alphabet: {a, b}", style: {...baseStyle}});
  problemHeading.anchor.set(0.5, 0.5);
  problemHeading.scale.set(2);
  problemText.anchor.set(0.5, 0.5);
  alphabetText.anchor.set(0.5, 0.5);
  problemText.scale.set(1);
  alphabetText.scale.set(1);
  problemHeading.position.set(500 * gsc, 250 * gsc);
  problemText.position.set(500 * gsc, 350 * gsc);
  alphabetText.position.set(500 * gsc, 400 * gsc);
  problemHeading.alpha = 0;
  problemText.alpha = 0;
  alphabetText.alpha = 0;
  GS.example1Container.addChild(problemHeading);
  GS.example1Container.addChild(problemText);
  GS.example1Container.addChild(alphabetText);

  // Needed for the comparison fn.
  GS.example1ProblemText = problemText;

  const textFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    problemHeading.alpha = v;
    problemText.alpha = v;
    alphabetText.alpha = v;
  });
  const fadeOutAndShift = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    problemHeading.alpha = 1 - v;
    alphabetText.alpha = 1 - v;
    const newPos = interpValue({x: 500 * gsc, y: 350 * gsc}, {x: 500 * gsc, y: 50 * gsc}, v);
    problemText.position.set(newPos.x, newPos.y);
  });

  // Show S node
  // Show A and B node staggered
  // Show start and accepting states (S and A respectively)
  // Show edges from S to A and B
  // Show edges from A and B to themselves
  // Make S the accepting state too
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
  const acceptingFades = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
      n.updateGraphic();
    })
  }), {});
  const edgeDrags = g.edges.map(e => [e, e.growEdgeTween(120, GS.easings.easeInOutQuad), e.showLabelTween(60, GS.easings.easeInOutQuad)]);
  const fadeAll = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.example1Container.alpha = v;
  });

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(black);
  nodePointer.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(black);
  nodePointer.position.set(g.nodes['S'].position.x, g.nodes['S'].position.y - 60 * gsc);
  nodePointer.alpha = 0;
  GS.example1Container.addChild(nodePointer);

  const nodeFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  const moveMovement = moveBetween('S', 'B', 45, g, nodePointer)
    .then(moveBetween('B', 'B', 30, g, nodePointer))
    .then(moveBetween('B', 'B', 30, g, nodePointer))
    .then(new ValueTween(g.nodes['B'].position, g.nodes['S'].position, 60, GS.easings.easeInOutQuad, (v) => {
      nodePointer.position.set(v.x, v.y - 60 * gsc);
    }))
    .then(moveBetween('S', 'A', 45, g, nodePointer))
    .then(moveBetween('A', 'A', 30, g, nodePointer))
    .then(moveBetween('A', 'A', 30, g, nodePointer))

  const nodeFadeOut = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  return delay(10)
    .then(textFadeIn)
    .then(delay(120))
    .then(fadeOutAndShift)
    .then(delay(90))
    .then(nodeFadeIns['S'])
    .then(delay(180))
    .then(nodeFadeIns['A'], delay(225).then(nodeFadeIns['B']))
    .then(delay(85))
    .then(startFade, delay(40).then(acceptingFades['A']))
    .then(delay(130))
    // Edges from S
    .then(...edgeDrags.filter(e => e[0].from.label === 'S').map(e => e.slice(1)).flat())
    .then(delay(740))
    // All other edges
    .then(...edgeDrags.filter(e => e[0].from.label !== 'S').map(e => e.slice(1)).flat())
    .then(delay(80))
    // Make S accepting
    .then(acceptingFades['S'])
    .then(delay(60))
    .then(nodeFadeIn)
    .then(moveMovement)
    .then(fadeAll);
}

const example2 = () => {
  GS.example2Container = new PIXI.Container();
  GS.example2Container.pivot.set(500 * gsc, 300 * gsc);
  GS.example2Container.position.set(500 * gsc, 300 * gsc);
  GS.screen.addChild(GS.example2Container);
  const g = new DFA();
  g.fromJSON({
    nodes: {
      E: { x: 300 * gsc, y: 300 * gsc, start: true, accepting: true },
      O: { x: 700 * gsc, y: 300 * gsc },
    },
    edges: [
      { from: 'E', to: 'O', label: 'a', style: { edgeAnchor: {
        x: 0,
        y: -60 * gsc,
      } } },
      { from: 'O', to: 'E', label: 'a', style: { edgeAnchor: {
        x: 0,
        y: 60 * gsc,
      } } },
      { from: 'E', to: 'E', label: 'b' },
      { from: 'O', to: 'O', label: 'b' },
    ]
  });
  GS.example2Container.addChild(g.graph);
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

  const problemHeading = new PIXI.Text({ text: "Example 2", style: {...baseStyle}});
  const problemText = new PIXI.Text({ text: "Words with an even amount of 'a's.", style: {...baseStyle}});
  const alphabetText = new PIXI.Text({ text: "Alphabet: {a, b}", style: {...baseStyle}});
  problemHeading.anchor.set(0.5, 0.5);
  problemHeading.scale.set(2);
  problemText.anchor.set(0.5, 0.5);
  alphabetText.anchor.set(0.5, 0.5);
  problemHeading.position.set(500 * gsc, 250 * gsc);
  problemText.position.set(500 * gsc, 350 * gsc);
  alphabetText.position.set(500 * gsc, 400 * gsc);
  problemHeading.alpha = 0;
  problemText.alpha = 0;
  alphabetText.alpha = 0;
  GS.example2Container.addChild(problemHeading);
  GS.example2Container.addChild(problemText);
  GS.example2Container.addChild(alphabetText);

  const textFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    problemHeading.alpha = v;
    problemText.alpha = v;
    alphabetText.alpha = v;
  });
  const fadeOutAndShift = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    problemHeading.alpha = 1 - v;
    alphabetText.alpha = 1 - v;
    const newPos = interpValue({x: 500 * gsc, y: 350 * gsc}, {x: 500 * gsc, y: 50 * gsc}, v);
    problemText.position.set(newPos.x, newPos.y);
  });

  // Needed for the comparison fn.
  GS.example2ProblemText = problemText;

  // Show E and O node staggered, include entry
  // Show a transitions
  // Show b transitions
  // Make E accepting state
  // Simulate
  // Fade all

  const nodeFadeIns = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: n.tweenPop(60)
  }), {});

  const startFades = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.entry.alpha = v;
      n.updateGraphic();
    })
  }), {});
  const acceptingFades = Object.values(g.nodes).reduce((o, n) => ({
    ...o,
    [n.label]: new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
      n.updateGraphic();
    })
  }), {});
  const edgeDrags = g.edges.map(e => [e, e.growEdgeTween(120, GS.easings.easeInOutQuad), e.showLabelTween(60, GS.easings.easeInOutQuad)]);
  const fadeAll = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    GS.example2Container.alpha = v;
  });

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(black);
  nodePointer.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(black);
  nodePointer.position.set(g.nodes['E'].position.x, g.nodes['E'].position.y - 60 * gsc);
  nodePointer.alpha = 0;
  GS.example2Container.addChild(nodePointer);

  const nodeFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  const moveMovement = moveBetween('E', 'O', 60, g, nodePointer)
    .then(moveBetween('O', 'E', 45, g, nodePointer))
    .then(moveBetween('E', 'O', 30, g, nodePointer))
    .then(moveBetween('O', 'O', 30, g, nodePointer))
    .then(moveBetween('O', 'E', 20, g, nodePointer))
    .then(moveBetween('E', 'E', 20, g, nodePointer))

  const nodeFadeOut = new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
  });

  return delay(10)
    .then(textFadeIn)
    .then(delay(20))
    .then(fadeOutAndShift)
    .then(delay(230))
    .then(nodeFadeIns['E'], delay(120).then(nodeFadeIns['O']))
    .then(delay(540))
    // Edges from S
    .then(...edgeDrags.filter(e => e[0].from.label !== e[0].to.label).map(e => e.slice(1)).flat())
    .then(delay(290))
    // All other edges
    .then(...edgeDrags.filter(e => e[0].from.label === e[0].to.label).map(e => e.slice(1)).flat())
    .then(delay(140))
    // Make E start
    .then(startFades['E'])
    .then(delay(45))
    // Make E accepting
    .then(acceptingFades['E'])
    .then(delay(15))
    .then(nodeFadeIn)
    .then(moveMovement)
    .then(nodeFadeOut)
}

const comparison = () => {
  GS.comparisonContainer = new PIXI.Container();
  GS.screen.addChild(GS.comparisonContainer);

  const fadeExample1Tween = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    GS.example1Container.alpha = v;
    GS.example2ProblemText.alpha = 1 - v;
  }, () => {
    // On start of this, scale and set postition.
    GS.example1Container.scale.set(0.5);
    GS.example1Container.position.set(750 * gsc, 200 * gsc);
    GS.example1ProblemText.alpha = 0;
  });
  const shiftExample2Tween = new ValueTween(1, 0.5, 60, GS.easings.easeInOutQuad, (v) => {
    GS.example2Container.scale.set(v);
  }).during(new ValueTween({x: 500 * gsc, y: 300 * gsc}, {x: 750 * gsc, y: 430 * gsc}, 60, GS.easings.easeInOutQuad, (v) => {
    GS.example2Container.position.set(v.x, v.y);
  }));

  const regexText1 = new PIXI.Text("(a(a|b)*)?", {...baseStyle, fontSize: 64 * gsc});
  const regexText2 = new PIXI.Text("b*(ab*ab*)*", {...baseStyle, fontSize: 64 * gsc});
  regexText1.anchor.set(0.5, 0.5);
  regexText2.anchor.set(0.5, 0.5);
  regexText1.position.set(300 * gsc, 200 * gsc);
  regexText2.position.set(300 * gsc, 430 * gsc);
  regexText1.alpha = 0;
  regexText2.alpha = 0;
  GS.comparisonContainer.addChild(regexText1);
  GS.comparisonContainer.addChild(regexText2);

  const regexFadeIn = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    regexText1.alpha = v;
    regexText2.alpha = v;
  });

  const languageLines = new PIXI.Container();
  const vertMidLine = new DrawnBezier({ points: 20 * gsc, stroke: { width: 5 * gsc }, maxLineDist: 2.5}, [{ x: 500 * gsc, y: 50 * gsc }, { x: 500 * gsc, y: 500 * gsc }]);
  const horizMidLine = new DrawnBezier({ points: 20 * gsc, stroke: { width: 5 * gsc }, maxLineDist: 2.5}, [{ x: 100 * gsc, y: 320 * gsc }, { x: 900 * gsc, y: 320 * gsc }]);
  languageLines.addChild(vertMidLine);
  languageLines.addChild(horizMidLine);
  GS.comparisonContainer.addChild(languageLines);

  const drawLang = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    vertMidLine.drawnAmount = v;
    vertMidLine.updateDrawnGraphic();
    horizMidLine.drawnAmount = v;
    horizMidLine.updateDrawnGraphic();
  });

  const coverRects = new PIXI.Container();
  const rect1 = new PIXI.Graphics().rect(100 * gsc, 50 * gsc, 400 * gsc, 270 * gsc).fill(green);
  const rect2 = new PIXI.Graphics().rect(500 * gsc, 50 * gsc, 400 * gsc, 270 * gsc).fill(red);
  const rect3 = new PIXI.Graphics().rect(100 * gsc, 320 * gsc, 400 * gsc, 180 * gsc).fill(red);
  const rect4 = new PIXI.Graphics().rect(500 * gsc, 320 * gsc, 400 * gsc, 180 * gsc).fill(green);
  coverRects.addChild(rect1);
  coverRects.addChild(rect2);
  coverRects.addChild(rect3);
  coverRects.addChild(rect4);
  GS.comparisonContainer.addChild(coverRects);
  coverRects.alpha = 0;

  return delay(0)
    .then(fadeExample1Tween, shiftExample2Tween, regexFadeIn, drawLang)
    .then(delay(90))
    .then(new ValueTween(0, 0.4, 60, GS.easings.easeInOutQuad, (v) => {
      coverRects.alpha = v;
    }));
}

const mario = () => {
  GS.marioContainer = new PIXI.Container();
  GS.screen.addChild(GS.marioContainer);

  const extraNodeStyle = { radius: 40 * gsc }
  GS.marioDFA = new DFA();
  GS.marioDFA.fromJSON({
    nodes: {
      "Standing": { x: 500 * gsc, y: 300 * gsc, style: extraNodeStyle },
      "Sweeping": { x: 250 * gsc, y: 150 * gsc, style: extraNodeStyle },
      "Punching": { x: 500 * gsc, y: 150 * gsc, style: extraNodeStyle },
      "Crouching": { x: 250 * gsc, y: 300 * gsc, style: extraNodeStyle },
      "Running": { x: 750 * gsc, y: 300 * gsc, style: extraNodeStyle },
      "Pounding": { x: 250 * gsc, y: 450 * gsc, style: extraNodeStyle },
      "Jumping": { x: 500 * gsc, y: 450 * gsc, style: extraNodeStyle },
      "Diving": { x: 750 * gsc, y: 450 * gsc, style: extraNodeStyle },
    },
    edges: [
      { from: "Standing", to: "Punching", label: "b", style: { edgeAnchor: { x: +50 * gsc, y: 0 } } },
      { from: "Punching", to: "Standing", label: "_", style: { edgeAnchor: { x: -50 * gsc, y: 0 } } },
      { from: "Standing", to: "Crouching", label: "⬇️", style: { edgeAnchor: { x: 0, y: -15 * gsc } } },
      { from: "Crouching", to: "Standing", label: "_", style: { edgeAnchor: { x: 0, y: 15 * gsc } } },
      { from: "Crouching", to: "Sweeping", label: "b" },
      { from: "Sweeping", to: "Standing", label: "_" },
      { from: "Standing", to: "Running", label: "➡️", style: { edgeAnchor: { x: 0, y: -15 * gsc } } },
      { from: "Running", to: "Standing", label: "_", style: { edgeAnchor: { x: 0, y: 15 * gsc } } },
      { from: "Pounding", to: "Standing", label: "_" },
      { from: "Standing", to: "Jumping", label: "a", style: { edgeAnchor: { x: +30 * gsc, y: 0 } } },
      { from: "Running", to: "Jumping", label: "a" },
      { from: "Jumping", to: "Standing", label: "_", style: { edgeAnchor: { x: -30 * gsc, y: 0 } } },
      { from: "Diving", to: "Standing", label: "_" },
      { from: "Running", to: "Diving", label: "b" },
      { from: "Jumping", to: "Pounding", label: "z" },
    ]
  });


  Object.keys(GS.marioDFA.nodes).forEach(key => {
    const n = GS.marioDFA.nodes[key];
    n.separatedGraphic.visible = false;
    n.graphic.removeChild(n.labelText);
    const sprite = new PIXI.Sprite(PIXI.Assets.get(key));
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(70 / Math.max(sprite.height, sprite.width) * gsc);
    n.graphic.addChild(sprite);
  });
  GS.marioDFA.edges.forEach(e => {
    e.graphic.removeChild(e.labelText);
    let sprite;
    if (e.style.edgeLabel === "a") {
      sprite = new PIXI.Sprite(PIXI.Assets.get("ButtonA"));
    } else if (e.style.edgeLabel === "b") {
      sprite = new PIXI.Sprite(PIXI.Assets.get("ButtonB"));
    } else if (e.style.edgeLabel === "z") {
      sprite = new PIXI.Sprite(PIXI.Assets.get("ButtonZ"));
    } else if (e.style.edgeLabel === "⬇️") {
      sprite = new PIXI.Sprite(PIXI.Assets.get("Down"));
    } else if (e.style.edgeLabel === "➡️") {
      sprite = new PIXI.Sprite(PIXI.Assets.get("Right"));
    } else { return; }
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(40 / Math.max(sprite.height, sprite.width) * gsc);
    const transform = e.getLabelTransform();
    sprite.position.set(transform.position.x, transform.position.y);
    e.graphic.addChild(sprite);
    e.sprite = sprite;
  });
  const standPunch = GS.marioDFA.edgeMap["Standing->Punching"];
  standPunch.sprite.position.set(standPunch.sprite.position.x + 60 * gsc, standPunch.sprite.position.y);
  const runJump = GS.marioDFA.edgeMap["Running->Jumping"];
  runJump.sprite.position.set(runJump.sprite.position.x + 100 * gsc, runJump.sprite.position.y);

  const graphCover = new RectangleCover(GS.marioDFA.graph, {points: 18, randMult: 0.1});
  graphCover.position.set(500 * gsc, 300 * gsc);
  GS.marioContainer.addChild(graphCover);
  GS.marioContainer.addChild(GS.marioDFA.graph);
  GS.marioContainer.alpha = 0;
  GS.marioContainer.pivot.set(500 * gsc, 300 * gsc);
  GS.marioContainer.position.set(500 * gsc, 300 * gsc);

  return new ValueTween(0, 1, 60, GS.easings.linear, (v) => {
    GS.marioContainer.alpha = GS.easings.easeOutCubic(v);
    GS.marioContainer.scale = GS.easings.easeOutElastic(v);
  }).then(delay(240)).then(new ValueTween(1, 0, 60, GS.easings.linear, (v) => {
    GS.marioContainer.alpha = GS.easings.easeInCubic(v);
    GS.marioContainer.scale = GS.easings.easeInElastic(v);
  }));
}

const formalDefinition = () => {
  const definitionContainer = new PIXI.Container();
  GS.screen.addChild(definitionContainer);

  const heading = new PIXI.Text("Formal Definition", {...baseStyle});
  heading.anchor.set(0.5, 0.5);
  heading.position.set(500 * gsc, 300 * gsc);
  heading.scale.set(2);
  heading.alpha = 0;
  definitionContainer.addChild(heading);

  const showHeading = new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    heading.alpha = v;
  });
  const shiftHeading = new ValueTween({x: 500 * gsc, y: 300 * gsc}, {x: 500 * gsc, y: 50 * gsc}, 60, GS.easings.easeInOutQuad, (v) => {
    heading.position.set(v.x, v.y);
  });

  // Fullscreen html scaling is separate from the scaling of the game.
  const formalScaling = gsc === 1 ? 1 : 1.8

  const properties = document.createElement('div');
  properties.classList.add('properties');
  properties.style.fontSize = Math.ceil(32 * formalScaling) + 'px';
  properties.style.gap = Math.ceil(20 * formalScaling) + 'px';
  const nodesContainer = new PIXI.Container();
  const allNodes = Object.values(GS.graph.nodes);
  const copyNodes = allNodes.map((n, i) => new Node(n.label, { x: i * 50 * gsc, y: 0}, {strokeWidth: 3 * gsc, stroke: black, showLabel: true, radius: 20 * gsc, fill: colorMap[n.label] }));
  copyNodes.forEach(n => {
    nodesContainer.addChild(n.graphic);
  });
  nodesContainer.position.set(185 * gsc, 145 * gsc);
  nodesContainer.alpha = 0;
  definitionContainer.addChild(nodesContainer);
  const nodeText = document.createElement('div');
  const nodeBlockWidth = Math.ceil(215 * formalScaling);
  nodeText.innerHTML = `<span>$Q$: {</span><div style='display: inline-block; min-width: ${nodeBlockWidth}px;'></div><span>}</span>`
  nodeText.style.opacity = 0;
  properties.appendChild(nodeText);

  const alphabet = document.createElement('div');
  alphabet.innerHTML = "<span>$\\Sigma$: { a, b }</span>";
  alphabet.style.opacity = 0;
  properties.appendChild(alphabet);

  const transInputA = new Node('A', { x: 427 * gsc, y: 301 * gsc}, { radius: 20 * gsc, strokeWidth: 3 * gsc, stroke: black, fill: colorMap['A'], showLabel: true});
  const transOutputD = new Node('D', { x: 583 * gsc, y: 301 * gsc}, { radius: 20 * gsc, strokeWidth: 3 * gsc, stroke: black, fill: colorMap['D'], showLabel: true});
  transInputA.graphic.alpha = 0;
  transOutputD.graphic.alpha = 0;
  definitionContainer.addChild(transInputA.graphic);
  definitionContainer.addChild(transOutputD.graphic);

  const transWidth1 = Math.ceil(40 * formalScaling);
  const transWidth2 = Math.ceil(45 * formalScaling);
  const transition = document.createElement('div');
  transition.innerHTML = `<span>$\\delta$: $Q \\times \\Sigma \\rightarrow Q \\Big[\\delta($</span><div style='display: inline-block; min-width: ${transWidth1}px;'></div><span>$, b) = $</span><div style='display: inline-block; min-width: ${transWidth2}px;'></div><span>$\\Big]$</span>`;
  transition.style.opacity = 0;
  properties.appendChild(transition);

  const start = document.createElement('div');
  start.innerHTML = "<span>$q_0 \\in Q :$</span>";
  start.style.opacity = 0;
  properties.appendChild(start);

  const startNode = new Node('A', { x: 305 * gsc, y: 388 * gsc}, { radius: 20 * gsc, isEntry: true, strokeWidth: 3 * gsc, stroke: black, fill: colorMap['A'], showLabel: true});
  startNode.graphic.alpha = 0;
  definitionContainer.addChild(startNode.graphic);

  const acceptingWidth = Math.ceil(90 * formalScaling);
  const accepting = document.createElement('div');
  accepting.innerHTML = `<span>$F \\subset Q :$ {</span><div style='display: inline-block; min-width: ${acceptingWidth}px;'></div><span>}</span>`;
  accepting.style.opacity = 0;
  properties.appendChild(accepting);

  const acceptingNodes = allNodes.filter(n => n.style.doubleBorder).map(n => new Node(n.label, { x: 700 * gsc, y: 400 * gsc}, { radius: 20 * gsc, doubleBorder: black, strokeWidth: 3 * gsc, stroke: black, fill: colorMap[n.label], showLabel: true }));
  const acceptingNodeContainer = new PIXI.Container();
  acceptingNodes.forEach((n, i) => {
    n.graphic.position.set(i*50 * gsc, 0);
    acceptingNodeContainer.addChild(n.graphic);
  });
  acceptingNodeContainer.position.set(293 * gsc, 455 * gsc);
  acceptingNodeContainer.alpha = 0;
  definitionContainer.addChild(acceptingNodeContainer);



  return delay(0)
    .then(showHeading)
    .then(delay(680))
    .then(shiftHeading)
    .then(delay(300))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      nodesContainer.alpha = v;
      nodeText.style.opacity = v;
    }, () => {
      document.querySelector('.scene').appendChild(properties);
      MathJax.typeset();
    }))
    .then(delay(120))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      alphabet.style.opacity = v;
    }))
    .then(delay(120))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      transition.style.opacity = v;
      transInputA.graphic.alpha = v;
      transOutputD.graphic.alpha = v;
    }))
    .then(delay(460))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      start.style.opacity = v;
      startNode.graphic.alpha = v;
    }))
    .then(delay(150))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      accepting.style.opacity = v;
      acceptingNodeContainer.alpha = v;
    }))
    .then(delay(800))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      GS.tableContainer.alpha = v;
      GS.graphContainer.alpha = v;
      properties.style.opacity = 1-v;
      definitionContainer.alpha = 1-v;
    }, () => {
      GS.tableContainer.position.set(-500 * gsc, 0)
      GS.graphContainer.position.set(750 * gsc, 300 * gsc);
      GS.graphContainer.scale.set(0.8);
      Object.values(GS.graph.nodes).forEach(n => {
        n.style.fill = colorMap[n.label];
        n.updateGraphic();
      });
    }, () => {
      properties.remove();
    }))
    .then(delay(300))
    .then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
      Object.values(GS.copyEdges).forEach(e => {
        e.graphic.alpha = 1-v;
        GS.tableNodeFormal.forEach(n => {
          n.graphic.alpha = v;
        });
      });
    }, () => {
      // On start - add nodes in place of edges.
      GS.tableNodeFormal = Object.values(GS.copyEdges).map(e => {
        let pos = interpValue(e.from.position, e.to.position, 0.5);
        if (e.to.label === e.from.label) {
          pos = vectorCombine(pos, {x: 0, y: -25 * gsc})
        } else {
          pos = vectorCombine(pos, {x: 0, y: -10 * gsc})
        }
        const n = new Node(e.to.label, pos, { radius: 20 * gsc, strokeWidth: 3 * gsc, stroke: black, fill: colorMap[e.to.label], showLabel: true });
        GS.tableContainer.addChild(n.graphic);
        return n;
      });
    }))
    .then(delay(490))
    .then(new ValueTween(1, 0, 60, GS.easings.easeInOutQuad, (v) => {
      GS.tableContainer.alpha = v;
      GS.graphContainer.alpha = v;
    }));
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.graph = new Graph();
  const nodeStyle = { radius: 30 * gsc, fill: bg_dark, strokeWidth: 3 * gsc, stroke: black, showLabel: true };
  const edgeStyle = (lab) => ({
    edgeLabel: lab
  });
  GS.graph.fromJSON({
    nodes: {
      A: { x: 250 * gsc, y: 300 * gsc, style: {...nodeStyle, isEntry: true, entryWidth: 5 * gsc } },
      B: { x: 500 * gsc, y: 300 * gsc, style: nodeStyle },
      C: { x: 750 * gsc, y: 300 * gsc, style: {...nodeStyle, doubleBorder: black } },
      D: { x: 375 * gsc, y: 500 * gsc, style: {...nodeStyle, doubleBorder: black } },
      E: { x: 625 * gsc, y: 500 * gsc, style: nodeStyle },
    },
    edges: [
      { from: 'A', to: 'B', style: edgeStyle('a') },
      { from: 'A', to: 'D', style: edgeStyle('b') },
      { from: 'B', to: 'C', style: edgeStyle('a, b') },
      { from: 'C', to: 'A', style: {
        ...edgeStyle('b'),
        edgeAnchor: {
          x: 0,
          y: -100 * gsc,
        },
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
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();

  const graphContainer = new PIXI.Container();
  graphContainer.addChild(GS.graph.graph);
  graphContainer.pivot.set(500 * gsc, 300 * gsc);
  graphContainer.position.set(500 * gsc, 300 * gsc);
  GS.screen.addChild(graphContainer);
  GS.graphContainer = graphContainer;


  const tableContainer = new PIXI.Container();
  const tableLines = new PIXI.Graphics();
  tableLines
    .moveTo(675 * gsc, 160 * gsc)
    .lineTo(675 * gsc, 520 * gsc)
    .moveTo(787.5 * gsc, 160 * gsc)
    .lineTo(787.5 * gsc, 520 * gsc)
    .moveTo(600 * gsc, 220 * gsc)
    .lineTo(900 * gsc, 220 * gsc)
    .moveTo(600 * gsc, 280 * gsc)
    .lineTo(900 * gsc, 280 * gsc)
    .moveTo(600 * gsc, 340 * gsc)
    .lineTo(900 * gsc, 340 * gsc)
    .moveTo(600 * gsc, 400 * gsc)
    .lineTo(900 * gsc, 400 * gsc)
    .moveTo(600 * gsc, 460 * gsc)
    .lineTo(900 * gsc, 460 * gsc)
    .stroke({ color: black, width: 3 * gsc });
  const tableHeaders = [
    new PIXI.Text({ text: 'a', style: {...baseStyle, fill: black}}),
    new PIXI.Text({ text: 'b', style: {...baseStyle, fill: black}}),
  ];
  const tablePaper = new RectangleCover(tableLines, {points: 18, randMult: 0.1});
  tablePaper.position.set(750 * gsc, 330 * gsc);
  tableContainer.addChild(tablePaper);
  tableHeaders.forEach((t, i) => {
    t.anchor.set(0.5, 0.5);
    t.position.set(675 * gsc + 112.5/2 * gsc + i * 112.5 * gsc, 190 * gsc);
    tableContainer.addChild(t);
  });
  tableContainer.addChild(tableLines);
  tableContainer.alpha = 0;
  GS.tableContainer = tableContainer;


  GS.screen.addChild(tableContainer);

  const word_text = "bbabaabb";
  const word = word_text.split('').map(c => new PIXI.Text(c, {...baseStyle}));
  const wordContainer = new PIXI.Container();
  const wordWidth = 20 * gsc;
  word.forEach((c, i) => {
    c.anchor.set(0, 1);
    c.position.set((i == 0) ? 0 : (word[i-1].position.x + wordWidth), 0);
    wordContainer.addChild(c);
  });
  wordContainer.pivot.set(wordContainer.width/2, -wordContainer.height/2);
  wordContainer.position.set(500 * gsc, 120 * gsc);
  wordContainer.alpha = 0;
  const wordCover = new RectangleCover(wordContainer, {points: 18, randMult: 0.1});
  wordCover.position.set(500 * gsc, 120 * gsc);
  wordCover.alpha = 0;
  GS.screen.addChild(wordCover);
  GS.screen.addChild(wordContainer);

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5 * gsc, -10 * gsc, 10 * gsc, 20 * gsc).fill(black);
  nodePointer.moveTo(-10 * gsc, 10 * gsc).lineTo(10 * gsc, 10 * gsc).lineTo(0 * gsc, 25 * gsc).lineTo(-10 * gsc, 10 * gsc).fill(black);
  nodePointer.position.set(GS.graph.nodes['A'].position.x, GS.graph.nodes['A'].position.y - 60 * gsc);
  GS.screen.addChild(nodePointer);

  const wordPointer = new PIXI.Graphics();
  wordPointer.rect(1 * gsc, 0 * gsc, 11 * gsc, 3 * gsc).fill(purple);
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

  const testWordsData = [
    { word: "baaaa", result: true },
    { word: "bbaabb", result: false },
    { word: "abba", result: false },
    { word: "ab", result: true },
  ]
  const testWordContainer = new PIXI.Container();
  const testWords = testWordsData.map((d, i) => {
    const t = new PIXI.Text(d.word, {...baseStyle});
    t.anchor.set(0.5, 0.5);
    const wordCover = new RectangleCover(t, {points: 18, randMult: 0.15});
    const wordContainer = new PIXI.Container();
    wordContainer.position.set(500 * gsc, 150 * gsc);
    wordContainer.alpha = 0;
    wordContainer.pivot.set(wordContainer.width/2, -wordContainer.height/2);
    wordContainer.addChild(wordCover);
    wordContainer.addChild(t);
    testWordContainer.addChild(wordContainer);
    return {container: wordContainer, text: t, cover: wordCover, result: d.result};
  });
  GS.screen.addChild(testWordContainer);

  const moveTestWord = ({ container, text, cover, result }, height) => {
    const popWordIn = new ValueTween(0, 1, 20, GS.easings.easeOutElastic, (v) => {
      container.scale.set(v);
    }).during( new ValueTween(0, 1, 20, GS.easings.easeOutCubic, (v) => {
      container.alpha = v;
    }));
    const shiftToCenter = new ValueTween({x: 500 * gsc, y: 150 * gsc}, {x: 500 * gsc, y: 300 * gsc}, 20, GS.easings.easeInOutQuad, ({x, y}) => {
      container.position.set(x, y);
    }).during(new ValueTween(1, 0.3, 20, GS.easings.easeInOutQuad, (v) => {
      container.scale.set(v);
    }));
    const shiftToCorrectPosition = new ValueTween({x: 500 * gsc, y: 300 * gsc}, {x: 500 * gsc + 200 * (result ? 1 : -1) * gsc, y: height}, 20, GS.easings.easeInOutQuad, ({x, y}) => {
      container.position.set(x, y);
    }).during(new ValueTween(black, result ? green : red, 20, GS.easings.easeInOutQuad, (v) => {
      text.style.fill = v;
    })).during(new ValueTween(0.3, 1, 20, GS.easings.easeInOutQuad, (v) => {
      container.scale.set(v);
    }));
    return popWordIn.then(shiftToCenter).then(shiftToCorrectPosition);
  }
  const testWordTweens = testWords.map((w, i) => {
    return delay(i*30).then(moveTestWord(w, [450 * gsc, 450 * gsc, 400 * gsc, 400 * gsc][i]));
  });

  const abbreviated = "Deterministic Finite Automaton";
  const title = new PIXI.Text(abbreviated, {...baseStyle, fontSize: 64 * gsc});
  const titleContainer = new PIXI.Container();
  const titles = ["D", "F", "A"].map((c, i) => {
    const t = new PIXI.Text(c, {...baseStyle, fontSize: 64 * gsc});
    t.position.set([0, 290 * gsc, 418 * gsc][i], 0);
    t.alpha = 0;
    return t;
  });
  titleContainer.addChild(title);
  titles.forEach(t => titleContainer.addChild(t));
  titleContainer.pivot.set(titleContainer.width/2, titleContainer.height/2);
  titleContainer.position.set(500 * gsc, 300 * gsc);
  titleContainer.alpha = 0;
  const titleCover = new RectangleCover(titleContainer, {points: 20, randMult: 0.1, width: 150 * gsc});
  titleCover.position.set(510 * gsc, 300 * gsc);
  titleCover.alpha = 0;
  GS.screen.addChild(titleCover);
  GS.screen.addChild(titleContainer);

  const showTitle = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    titleContainer.alpha = v;
  });
  const titleShift = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    titleCover.alpha = v;
    titles.forEach((t, i) => {
      t.alpha = 1;
      t.style.fill = interpValue(black, highlightColours[i], easings.easeOutQuint(v));
      t.position.set(interpValue([0, 290 * gsc, 418 * gsc][i], titleContainer.width/2 - 45 * gsc + 45*i * gsc, v), 0);
    });
    title.alpha = 1 - v;
  });
  const titleFade = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
    titleContainer.alpha = v;
    titleCover.alpha = v;
    testWordContainer.alpha = v;
  });

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
  const graphShrinkAndShift = new ValueTween({ x: 500 * gsc, y: 300 * gsc }, { x: 300 * gsc, y: 300 * gsc }, 60, easings.easeInOutQuad, (v) => {
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
    copy.desiredPosition = { x: 630 * gsc, y: 250 * gsc + 60 * "ABCDE".indexOf(n.label) * gsc};
    copy.entry.alpha = 0;
    copy.updateGraphic();
    copyNodes.push(copy);
    // Keep the same transform
    tableContainer.addChild(copy.graphic);
  })});
  const copyEdges = {};
  GS.copyEdges = copyEdges;
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
        const fakeSource = new Node(e.from.label, e.from.position, {...e.from.style, radius: 0});
        let fakeDest = new Node(e.to.label, e.to.position, {...e.to.style, radius: 0});
        fakeSource.graphic.visible = false;
        fakeSource.startPosition = tableContainer.toLocal(GS.graph.graph.toGlobal(fakeSource.position));
        fakeDest.graphic.visible = false;
        fakeDest.startPosition = tableContainer.toLocal(GS.graph.graph.toGlobal(fakeDest.position));
        const edgeStyleCopy = mergeDeep({},
          {...edgeStyle(e.style.edgeLabel)},
          {
            stroke: {
              color: e.style.stroke.color,
              width: e.style.stroke.width,
            },
            edgeLabelOffset: 4,
          },
          e.from.label === e.to.label ? {
            loopOffset: {x: 0, y: -25 * gsc},
            loopAnchorMult: 1.7,
            edgeLabelOffset: 3,
          } : {},
        );
        const copy = AbstractEdge.decide(fakeSource, fakeDest, edgeStyleCopy);
        copy.oldArrowTransform = copy.getArrowTransform;
        copy.getArrowTransform = (position) => {
          const transform = copy.oldArrowTransform(position);
          transform.angle = copy.bezierEdgeInterp(1).angle;
          return transform;
        };
        tableContainer.addChild(copy.graphic);
        if (e.from.label === e.to.label) {
          fakeSource.desiredPosition = {x: (675 + 112.5*0.4 + "ab".indexOf(char) * 112.5) * gsc, y: (275 + 60 * "ABCDE".indexOf(e.from.label)) * gsc};
          fakeDest.desiredPosition = {x: (675 + 112.5*0.6 + "ab".indexOf(char) * 112.5) * gsc, y: (275 + 60 * "ABCDE".indexOf(e.from.label)) * gsc};
        } else {
          fakeSource.desiredPosition = {x: (675 + 112.5*(0.1) + "ab".indexOf(char) * 112.5) * gsc, y: (260 + 60 * "ABCDE".indexOf(e.from.label)) * gsc};
          fakeDest.desiredPosition = {x: (675 + 112.5*(0.9) + "ab".indexOf(char) * 112.5) * gsc, y: (260 + 60 * "ABCDE".indexOf(e.from.label)) * gsc};
        }
        copyEdges[copy.from.label + char] = copy;
      });
    });
  });

  const removeContainerAndScale = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
    tableContainer.alpha = v;
  }, () => {}).during(new ValueTween(0.8, 1, 60, easings.easeInOutQuad, (v) => {
    graphContainer.scale.set(v);
  })).during(new ValueTween({ x: 300 * gsc, y: 300 * gsc }, { x: 500 * gsc, y: 300 * gsc }, 60, easings.easeInOutQuad, (v) => {
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
    return new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      n.entry.alpha = v;
      if (n.style.isEntry) {
        n.style.fill = interpValue(n.curFill, green, v);
        n.updateGraphic();
      }
    }, () => {
      n.curFill = n.style.fill;
    }).then(new ValueTween(green, bg_dark, 30, easings.easeInOutQuad, (v) => {
      if (n.style.isEntry) {
        n.style.fill = v;
        n.updateGraphic();
      }
    }));
  });
  // T: some accepting states.
  const vertEndTweens = Object.values(GS.graph.nodes).map(n => {
    return new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      n.innerCircle.alpha = v;
      if (n.style.doubleBorder) {
        n.style.fill = interpValue(n.curFill, red, v);
        n.updateGraphic();
      }
    }, () => {
      n.curFill = n.style.fill;
    }).then(new ValueTween(red, bg_dark, 30, easings.easeInOutQuad, (v) => {
      if (n.style.doubleBorder) {
        n.style.fill = v;
        n.updateGraphic();
      }
    }));
  });
  // T: We can then place a
  // T: pointer on the start state
  const pointerFade = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
    nodePointer.alpha = v;
    wordPointer.alpha = v;
  }).during(new ValueTween(black, purple, 60, easings.easeInOutQuad, (v) => {
    word[0].style.fill = v;
  }));

  const startColorFade = GS.graph.nodes['A'].tweenColor(colorMap['A'], 60, easings.easeInOutQuad);
  const startTransitionsFade = GS.graph.edges.filter(e => e.from.label === 'A').map(e => {
    return e.colorEdgeTween(colorMap['A'], 60, easings.easeInOutQuad);
  });
  const fadeBack = GS.graph.edges.filter(e => e.from.label === 'A').map(e => {
    if (e.style.edgeLabel.includes('b'))
      return new ValueTween(black, purple, 60, flashEasing(), (value) => {
        e.updateStyle({ labelStyle: { fill: value } });
      });
    return e.colorEdgeTween(black, 60, easings.easeInOutQuad);
  });
  const firstMove = moveBetween('A', 'D', 120, GS.graph, nodePointer, wordPointer, word).during(GS.graph.nodes['A'].tweenColor(bg_dark, 120, easings.easeInOutQuad));
  const stateCover = new PIXI.Graphics();
  stateCover.rect(595 * gsc, 225 * gsc, 65 * gsc, 50 * gsc).fill(purple);
  stateCover.alpha = 0;
  tableContainer.addChild(stateCover);
  const letterCover = new PIXI.Graphics();
  letterCover.rect(800 * gsc, 165 * gsc, 87.5 * gsc, 50 * gsc).fill(purple);
  letterCover.alpha = 0;
  tableContainer.addChild(letterCover);
  const flashContainer = new ValueTween(0, 1, 30, easings.easeInOutQuad, (v) => {
    tableContainer.alpha = v;
  }).then(delay(400))
  .then(new ValueTween(0, 1, 30, easings.easeInOutQuad, (v) => {
    stateCover.alpha = v * 0.4;
  }))
  .then(delay(20))
  .then(new ValueTween(0, 1, 30, easings.easeInOutQuad, (v) => {
    letterCover.alpha = v * 0.4;
  }))
  .then(delay(100))
  .then(new ValueTween(1, 0, 30, easings.easeInOutQuad, (v) => {
    tableContainer.alpha = v;
    stateCover.alpha = v * 0.4;
    letterCover.alpha = v * 0.4;
  })).during(...GS.graph.edges.filter(e => e.from.label === 'A' && e.style.edgeLabel.includes('b')).map(e => {
    return e.colorEdgeTween(black, 30, easings.easeInOutQuad);
  }));

  // T: and begin to execute the algorithm
  // T: We do this by taking each letter in the [word], and moving along the [associated transition] to a [new state].
  // Line up the [] with elements of the first movement.
  const algorithmExecution = moveBetween('D', 'D', 120, GS.graph, nodePointer, wordPointer, word)
    .then(delay(45))
    .then(moveBetween('D', 'E', 90, GS.graph, nodePointer, wordPointer, word))
    .then(delay(30))
    .then(moveBetween('E', 'B', 60, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('B', 'C', 45, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('C', 'C', 45, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('C', 'A', 30, GS.graph, nodePointer, wordPointer, word))
    .then(delay(20))
    .then(moveBetween('A', 'D', 30, GS.graph, nodePointer, wordPointer, word))

  const fadeSuccessColours = Object.values(GS.graph.nodes).map(n => {
    return new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      n.style.fill = interpValue(bg_dark, n.style.doubleBorder ? green : red, v);
      n.updateGraphic();
    });
  });

  const fadeAll = new ValueTween(1, 0, 60, easings.easeInOutQuad, (v) => {
    graphContainer.alpha = v;
    wordContainer.alpha = v;
    wordCover.alpha = v;
    nodePointer.alpha = v;
    wordPointer.alpha = v;
  });

  //
  const def = formalDefinition();
  const e1 = example1();
  const e2 = example2();
  const comp = comparison();
  const marioFade = mario();

  const skipTime = 0;

  PIXI.sound.Sound.from({
    url: '/audio/dfaFinal.mp3',
    preload: true,
    loaded: (err, sound) => {
      TweenManager.add(delay(100) // was 510
        .then(showTitle) // 60
        .then(delay(60))
        .then(titleShift) // 60
        .then(delay(60))
        .then(...testWordTweens) // 150
        .then(delay(90))
        .then(titleFade) // 60
        .then(delay(60))
        .then(vertFadeIns) // 60
        .then(delay(90))
        .then(...edgeDrags) // 120
        .then(...edgeLabels) // 60
        .then(delay(60))
        .then(delay(110))
        .then(marioFade)
        .then(delay(170))
        .then(...vertColorTweens) // 60
        .then(delay(60))
        .then(...edgeColorTweens) // 60
        .then(graphShrinkAndShift) // 60
        .then(copyNodesMove) // 60
        .then(copyEdgesMove) // 160
        .then(delay(240))
        .then(removeContainerAndScale)
        .then(...fadeVertColorTweens, ...fadeEdgeColorTweens) // 60
        .then(delay(30))
        .then(...vertStartTweens) // 90
        .then(delay(40))
        .then(...vertEndTweens) // 90
        .then(delay(120))
        .then(fadeWordTween) // 60
        .then(delay(40))
        .then(pointerFade) // 60
        .then(delay(250))
        .then(startColorFade, ...startTransitionsFade)
        .then(delay(140))
        .then(...fadeBack)
        .then(delay(30))
        .then(firstMove)
        .then(delay(80))
        .then(flashContainer)
        .then(delay(80))
        .then(algorithmExecution)
        .then(delay(160))
        .then(...fadeSuccessColours)
        .then(delay(220))
        .then(fadeAll)
        .then(def)
        .then(delay(0))
        .then(e1)
        .then(e2).then(delay(30))
        .then(comp)
        .then(new Tween(1, easings.easeInOutQuad, ()=>{}, ()=>{}, onSuccess)));
      TweenManager.skipSeconds(skipTime);
      const playFourthSection = () => {
        TweenManager.instance = sound.play({
          start: Math.max(skipTime - 111.8, 0) + 121,
        });
        TweenManager.instance.speed = TweenManager.curSpeed;
      }
      const playThirdSection = () => {
        TweenManager.instance = sound.play({
          start: Math.max(skipTime - 71, 0) + 76.6,
          end: 117.4,
        });
        TweenManager.instance.speed = TweenManager.curSpeed;
        TweenManager.instance.on('end', () => {
          playFourthSection();
        });
      }
      const playSecondSection = () => {
        TweenManager.instance = sound.play({
          start: Math.max(skipTime - 61, 0) + 64.2,
          end: 74.2
        });
        TweenManager.instance.speed = TweenManager.curSpeed;
        TweenManager.instance.on('end', () => {
          playThirdSection();
        });
      }
      TweenManager.instance = sound.play({
        start: skipTime,
      });
      TweenManager.instance.speed = TweenManager.curSpeed;
      /*TweenManager.instance.on('end', () => {
        playSecondSection();
      });*/
    }
  });

}

const unloader = (app) => {
}

export default { loader, unloader };
