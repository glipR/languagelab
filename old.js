// Random Options Stuff - Probably not needed until you get to the sandbox sim.

const OPT_NODE_FILL = "Node Fill";
const OPT_EDGE_WIDTH = "Edge Width";

const optionsValues = {
  [OPT_NODE_FILL]: 0x00ff00,
  [OPT_EDGE_WIDTH]: 3,
}

setOptions(app, optionsValues, null);

// Graph

const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const g = new Graph();
const nodeStyle = { radius: 30, fill: bg_dark, strokeWidth: 3, stroke: black, showLabel: true };
const edgeStyle = (lab) => ({ lineWidth: 5, edgeLabel: lab, stroke: black, arrow: {
  direction: 'forward',
  position: 'end',
  size: 20,
  width: 5,
  endOffset: 30,
} });
g.fromJSON({
  nodes: {
    A: { position: { x: center.x - 250, y: center.y }, style: {...nodeStyle, isEntry: true, entryWidth: 5 } },
    B: { position: { x: center.x, y: center.y }, style: nodeStyle },
    C: { position: { x: center.x + 250, y: center.y }, style: {...nodeStyle, doubleBorder: black } },
    D: { position: { x: center.x - 125, y: center.y + 200 }, style: {...nodeStyle, doubleBorder: black } },
    E: { position: { x: center.x + 125, y: center.y + 200 }, style: nodeStyle },
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

// FA Creation

const g = new Graph();
const nodeStyle = { radius: 30, fill: bg_dark, strokeWidth: 3, stroke: black, showLabel: true };
const edgeStyle = (lab) => ({ lineWidth: 5, edgeLabel: lab, stroke: black, arrow: {
  direction: 'forward',
  position: 'end',
  size: 20,
  width: 5,
  endOffset: 30,
} });
g.fromJSON({
  nodes: {
    A: { position: { x: 250, y: 150 }, style: {...nodeStyle, isEntry: true, entryWidth: 5 } },
    B: { position: { x: 300, y: 600 }, style: nodeStyle },
    C: { position: { x: 350, y: 350 }, style: nodeStyle },
    D: { position: { x: 600, y: 400 }, style: {...nodeStyle, doubleBorder: black } },
  },
  edges: [
    { from: 'A', to: 'B', style: edgeStyle('a') },
    { from: 'A', to: 'C', style: edgeStyle('b') },
    { from: 'B', to: 'D', style: edgeStyle('a, b') },
    { from: 'C', to: 'D', style: edgeStyle('b') },
    { from: 'C', to: 'C', style: {
      ...edgeStyle('a'),
      loopOffset: {
        x: -20,
        y: 75
      }
    } },
    { from: 'D', to: 'A', style: edgeStyle('a, b') },
  ]
})

stage.addChild(g.graph);

const n = new PIXI.Graphics();
n.position.set(g.nodes['A'].position.x, g.nodes['A'].position.y);
const c = new PIXI.Color([180, 0, 0, 0.5]);
n.circle(0, 0, 15).fill(c);
stage.addChild(n);

g.edges.forEach(edge => {edge.graphic.visible = false});
g.edges.forEach(edge => {edge.labelText.alpha = 0});

window.setTimeout(() => {
  g.edges.forEach(edge => {
    TweenManager.add(
      edge.growEdgeTween(120, easings.easeInOutQuad)
        .then(edge.showLabelTween(60, easings.easeInOutQuad))
        .then(edge.colorEdgeTween(red, 60, easings.easeInOutQuad, true))
    );
  });
}, 1000);

window.setTimeout(() => {
  const tween = new ValueTween(g.nodes['A'].position, g.nodes['B'].position, 60, easings.easeInOutQuad, (value) => {
    n.position.set(value.x, value.y);
  });
  const lineTweens = tween.then(new ValueTween(g.nodes['B'].position, g.nodes['D'].position, 60, easings.easeInOutQuad, (value) => {
    n.position.set(value.x, value.y);
  })).then(new ValueTween(g.nodes['D'].position, g.nodes['A'].position, 60, easings.easeInOutQuad, (value) => {
    n.position.set(value.x, value.y);
  })).then(new ValueTween(g.nodes['A'].position, g.nodes['C'].position, 60, easings.easeInOutQuad, (value) => {
    n.position.set(value.x, value.y);
  }));
  lineTweens.then(new Tween(60, easings.easeInOutQuad, (t) => {
    g.edges.forEach(edge => {
      if (edge.from === edge.to && edge.from === g.nodes['C']) {
        const pos = edge.edgeInterp(t).position;
        n.position.set(pos.x, pos.y);
      }
    })
  })).then(new Tween(60, easings.easeInOutQuad, (t) => {
    g.edges.forEach(edge => {
      if (edge.from === edge.to && edge.from === g.nodes['C']) {
        const pos = edge.edgeInterp(t).position;
        n.position.set(pos.x, pos.y);
      }
    })
  })).then(new ValueTween(g.nodes['C'].position, g.nodes['D'].position, 60, easings.easeInOutQuad, (value) => {
    n.position.set(value.x, value.y);
  }));
  TweenManager.add(tween);
}, 5000)
