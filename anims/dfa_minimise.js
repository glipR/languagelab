import { black, green, highlightColours, rainbow, red, white } from "../colours.js";
import { AbstractEdge, Node } from "../graph.js";
import Screen from "../screen.js";
import Progress from "../tools/progress.js";
import Table from "../tools/table.js";
import { delay, ImmediateTween, interpValue, TweenManager, ValueTween } from "../tween.js";
import { FloatingButton } from "../ui.js";
import { color_to_lch, lch_to_color, multiply, vectorCombine } from "../utils.js";
import { Globs, PhysicsArea, GS as GlobGS } from "./glob_testing.js";

const gsc = window.gameScaling ?? 1;

export const GS = {
  table: new Table({}),
  curSelection: new Set([]),
  // glob: new Globs({}, {}),
  allNodes: [],
  allEdges: [],
  findEdge: (from, char) => { return GS.allEdges.find(edge => edge.from.label === from && edge.style.edgeLabel === char) },
  solved: false,
  progress: new Progress([], {}),
  globNodes: {},
};

const baseTextStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

window.GS = GS;

export const toggleSelection = (index) => {
  if (GS.curSelection.has(index)) {
    GS.curSelection.delete(index);
    TweenManager.add(delay(0)
      .then(new ValueTween(0.2, 0, 20, GS.easings.easeInOutQuad, (v) => {
        for (let j=0; j<=GS.dfa.alphabet.length; j++) {
          GS.table.getContainer(index, j).background.alpha = v;
        }
      }))
    );
  } else {
    GS.curSelection.add(index);
    TweenManager.add(delay(0)
      .then(new ValueTween(0, 0.2, 20, GS.easings.easeInOutQuad, (v) => {
        for (let j=0; j<=GS.dfa.alphabet.length; j++) {
          GS.table.getContainer(index, j).background.alpha = v;
        }
      }))
    );
  }
  checkSplit();
}

const clearSelection = () => {
  Array.from(GS.curSelection).forEach((index) => {
    toggleSelection(index);
  });
}

const canSplit = () => {
  // Selection is non-empty
  if (GS.curSelection.size === 0) return false;
  // Selection is all the same colour
  const curKeys = Array.from(GS.curSelection).map(index => GS.dfa.rows[index-1].curKey);
  if (new Set(curKeys).size !== 1) return false;
  // Selection is not the same as the merged key
  if (GS.dfa.rows.filter(row => row.curKey === curKeys[0]).length === GS.curSelection.size) return false;
  return true;
}
const checkSplit = () => {
  GS.splitButton.setDisabled(!canSplit());
}

export const onSplit = () => {
  const transitionGroupString = {};
  GS.dfa.rows.forEach(row => {
    const transitionGroups = row.cells.split('').map(cell => GS.dfa.rows.find(r => r.head === cell).curKey).sort().join(':');
    transitionGroupString[row.head] = transitionGroups;
  });

  const currentKey = Array.from(GS.curSelection).map(index => GS.dfa.rows[index-1].curKey)[0];
  const splitNodes = Array.from(GS.curSelection).map(index => GS.dfa.rows[index-1].head);
  const splitKey = splitNodes.sort().join('+');
  const otherNodes = GS.dfa.rows.filter(row => {
    return !splitNodes.includes(row.head) && row.curKey === currentKey;
  }).map(row => row.head);
  const otherKey = otherNodes.sort().join('+');

  if (GS.dfa.rows.filter(row => row.curKey !== currentKey).length === 0) {
    // We should be splitting accepting and non-accepting states.
    const splitAccepting = new Set(splitNodes.map(node => GS.dfa.rows.find(row => row.head === node).accepting));
    const otherAccepting = new Set(otherNodes.map(node => GS.dfa.rows.find(row => row.head === node).accepting));
    const correct = (
      splitAccepting.intersection(otherAccepting).size === 0 &&
      splitAccepting.union(otherAccepting).size === 2
    );
    if (!correct) {
      alert("Your first split should be separating all accepting and non-accepting states.");
      return;
    }
  } else {
    // Check we aren't splitting anything we shouldn't be.
    for (const splitNode of splitNodes) {
      for (const otherNode of otherNodes) {
        if (transitionGroupString[splitNode] === transitionGroupString[otherNode]) {
          alert(`You shouldn't be splitting ${splitNode} and ${otherNode} as both have transitions to the same globs.`);
          return;
        }
      }
    }
  }

  const splitColor = GS.colorFromKeys(splitNodes);
  const otherColor = GS.colorFromKeys(otherNodes);
  GS.glob.splitGlobs(currentKey, splitKey, otherColor, splitColor);
  GS.dfa.rows.forEach((row, i) => {
    if (splitNodes.includes(row.head)) {
      row.curKey = splitKey;
    }
    if (otherNodes.includes(row.head)) {
      row.curKey = otherKey;
    }
  });
  GS.allNodes.forEach(node => {
    if (splitNodes.includes(node.label)) {
      TweenManager.add(node.tweenColor(splitColor, 30, GS.easings.easeInOutQuad));
    }
    if (otherNodes.includes(node.label)) {
      TweenManager.add(node.tweenColor(otherColor, 30, GS.easings.easeInOutQuad));
    }
  });
  clearSelection();
  GS.progress.checkCompleted();
}

export const check = () => {
  // Check we are done.
  // 1 - Are all accepting states in a different curKey to non-accepting states?
  const acceptingStates = new Set(GS.dfa.rows.filter(row => row.accepting).map(row => row.curKey));
  const nonAcceptingStates = new Set(GS.dfa.rows.filter(row => !row.accepting).map(row => row.curKey));
  if (acceptingStates.intersection(nonAcceptingStates).size > 0) {
    alert(`You need to split accepting and non-accepting states. Currently the glob of ${Array.from(acceptingStates.intersection(nonAcceptingStates))[0]} contains both accepting and non-accepting states.`);
    return;
  }
  // 2 - Within each curKey glob, the transition groups are the same.
  const transitionGroupString = {};
  GS.dfa.rows.forEach(row => {
    const transitionGroups = row.cells.split('').map(cell => GS.dfa.rows.find(r => r.head === cell).curKey).sort().join(':');
    transitionGroupString[row.head] = transitionGroups;
  });
  const curKeys = new Set(GS.dfa.rows.map(row => row.curKey));
  for (const curKey of curKeys) {
    const nodes = GS.dfa.rows.filter(row => row.curKey === curKey).map(row => row.head);
    const transitionGroups = new Set(nodes.map(node => transitionGroupString[node]));
    if (transitionGroups.size > 1) {
      alert(`The glob of ${curKey} contains states with transitions to different globs.`);
      return;
    }
  }

  // Disable physics on the globs.
  GS.glob.physicsDisabled = true;
  const moveTweens = []
  const offset = { x: 400 * gsc, y: 0 };
  GS.dfa.graph.states.forEach(state => {
    state.position = multiply(state.position, gsc);
  });
  Object.keys(GS.glob.points).forEach(key => {
    const graphPosition = GS.dfa.graph.states.find(state => state.name === key).position;
    moveTweens.push(new ValueTween(GS.glob.points[key].position, vectorCombine(graphPosition, offset), 60, GS.easings.easeInOutQuad, (v) => {
      GS.glob.points[key].position = v;
      GS.glob.points[key].physicsArea.style.outerPush.x = v.x;
      GS.glob.points[key].physicsArea.style.outerPush.y = v.y;
    }));
  })
  moveTweens.push(new ValueTween(0.3, 0.8, 60, GS.easings.easeInOutQuad, (v) => {
    GS.glob.style.fillAlpha = v;
  }));
  const edgeTweens = [];
  GS.checkEdges = GS.dfa.graph.transitions.map(transition => {
    if (transition?.style?.loopOffset) {
      transition.style.loopOffset = multiply(transition.style.loopOffset, gsc);
    }
    if (transition?.style?.edgeAnchor) {
      transition.style.edgeAnchor = multiply(transition.style.edgeAnchor, gsc);
    }
    const startPosition = GS.dfa.graph.states.find(state => state.name === transition.from).position;
    const start = { label: transition.from, position: vectorCombine(startPosition, offset), style: { radius: GS.glob.points[transition.from].physicsArea.style.outerPush.radius } };
    const endPosition = GS.dfa.graph.states.find(state => state.name === transition.to).position;
    const end = { label: transition.to, position: vectorCombine(endPosition, offset), style: { radius: GS.glob.points[transition.to].physicsArea.style.outerPush.radius } };
    const edge = AbstractEdge.decide(start, end, {
      edgeLabel: transition.label,
      ...(transition.style ?? {}),
    });
    edge.labelBG.alpha = 1;
    edge.drawnAmount = 0;
    edge.updateGraphic();
    GS.screen.addChild(edge.graphic);
    edgeTweens.push(edge.showLabelTween(60, GS.easings.easeInOutQuad));
    edgeTweens.push(edge.growEdgeTween(60, GS.easings.easeInOutQuad));
    return edge;
  });
  Object.keys(GS.glob.points).forEach(key => {
    const graphAccepting  = GS.dfa.graph.states.find(state => state.name === key).accepting;
    if (graphAccepting) {
      const { L, C, h } = color_to_lch(GS.glob.points[key].color);
      GS.glob.points[key].doubleBorderColor = lch_to_color({ L: L - 0.2, C, h });
      edgeTweens.push(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
        GS.glob.points[key].doubleBorderAlpha = v;
      }));
    }
  });
  const start = GS.dfa.graph.states.find(state => state.starting).name;
  const { L, C, h } = color_to_lch(GS.glob.points[start].color);
  const startCol = lch_to_color({ L: L - 0.2, C, h });
  const fakeStartNode = new Node('', GS.glob.points[start].position, {
    isEntry: true,
    radius: GS.glob.points[start].physicsArea.style.outerPush.radius,
    stroke: startCol,
  });
  fakeStartNode.circle.alpha = 0;
  fakeStartNode.labelText.alpha = 0;
  fakeStartNode.entry.alpha = 0;
  GS.screen.addChild(fakeStartNode.graphic);
  edgeTweens.push(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
    fakeStartNode.entry.alpha = v;
  }, () => {
    fakeStartNode.moveTo(GS.glob.points[start].position);
  }));
  TweenManager.add(delay(0).then(...moveTweens).then(delay(30).then(...edgeTweens)).then(new ImmediateTween(() => {
    GS.solved = true;
    GS.progress.checkCompleted();
  })));
}

export const selectEdges = (glob, char) => {
  GS.allEdges.filter(edge => glob.includes(edge.start.label) && edge.style.edgeLabel.includes(char));
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.app = app;
  GS.easings = easings;
  GS.screen = new Screen(app, opts.hideBG);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();
  GS.opts = opts;
  GlobGS.app = app;
  GlobGS.screen = GS.screen;

  GS.dfa = opts.table;
  const mergedKey = GS.dfa.rows.map(row => row.head).sort().join('+');
  const keyColors = {};
  GS.dfa.rows.forEach((row, i) => {
    keyColors[row.head] = rainbow(360 * i / GS.dfa.rows.length);
  });
  GS.colorFromKeys = (keys) => {
    return keyColors[GS.dfa.rows.filter(row => keys.includes(row.head))[0].head];
  }
  const mergedColour = GS.colorFromKeys(mergedKey.split('+'));

  GS.table = new Table({
    headerWidth: 120 * gsc,
    headerHeight: 50 * gsc,
    itemWidth: 80 * gsc,
    itemHeight: 50 * gsc,
    totalHeight: (50 + 50 * GS.dfa.rows.length) * gsc,
    totalWidth: (120 + 80 * GS.dfa.alphabet.length) * gsc,
  });
  GS.table.resize(GS.dfa.rows.length, GS.dfa.alphabet.length);
  GS.table.pivot.set(0, GS.table.height / 2);
  GS.table.position.set(50 * gsc, 275 * gsc);
  GS.screen.addChild(GS.table);
  GS.allNodes = [];
  for (let i=0; i<GS.dfa.rows.length; i++) {
    GS.dfa.rows[i].curKey = mergedKey;
    const rowHeader = GS.table.getContainer(i+1, 0);
    const rowNode = new Node(GS.dfa.rows[i]["head"], { x: 0, y: 0 }, {
      doubleBorder: GS.dfa.rows[i].accepting,
      isEntry: GS.dfa.rows[i].starting,
      radius: 20 * gsc,
      entryWidth: 5 * gsc,
      entryScale: 0.7,
      fill: mergedColour,
      strokeWidth: 2 * gsc,
    });
    rowNode.labelText.scale.set(0.7);
    GS.allNodes.push(rowNode);
    rowHeader.addChild(rowNode.graphic);
    rowHeader.interactive = true;
    rowHeader.buttonMode = true;
    rowHeader.on('pointerdown', () => toggleSelection(i+1));
    for (let j=0; j<GS.dfa.alphabet.length; j++) {
      const container = GS.table.getContainer(i+1, j+1);
      const endRow = GS.dfa.rows.find(row => row.head === GS.dfa.rows[i].cells[j]);
      const node = new Node(endRow.head, { x: 0, y: 0 }, {
        doubleBorder: endRow.accepting,
        radius: 20 * gsc,
        fill: mergedColour,
        strokeWidth: 2 * gsc,
      });
      node.labelText.scale.set(0.7);
      GS.allNodes.push(node);
      container.addChild(node.graphic);
      container.interactive = true;
      container.buttonMode = true;
      container.on('pointerdown', () => toggleSelection(i+1));
    }
  }
  GS.dfa.alphabet.split('').forEach((letter, i) => {
    const container = GS.table.getContainer(0, i+1);
    const t = new PIXI.Text({ text: letter, style: baseTextStyle});
    t.anchor.set(0.5, 0.5);
    container.addChild(t);
  });

  GS.splitButton = new FloatingButton({
    label: {
      text: "Split",
      fill: white,
    },
    bg: {
      fill: green,
      disabledFill: red,
    },
    width: 95 * gsc,
    height: 50 * gsc,
  });
  GS.splitButton.position.set(GS.table.width/2 - 95 * gsc, 525 * gsc);
  GS.screen.addChild(GS.splitButton);
  GS.splitButton.onClick = onSplit;
  GS.splitButton.alpha = opts.hideButtons ? 0 : 1;

  GS.checkButton = new FloatingButton({
    label: {
      text: "Check",
      fill: white,
    },
    bg: {
      fill: green,
      disabledFill: red,
    },
    width: 100 * gsc,
    height: 50 * gsc,
  });
  GS.checkButton.position.set(GS.table.width/2 + 5 * gsc, 525 * gsc);
  GS.screen.addChild(GS.checkButton);
  GS.checkButton.onClick = check;
  GS.checkButton.alpha = opts.hideButtons ? 0 : 1;

  GS.globNodes = {};
  // Physics
  const globData = {};
  GS.dfa.rows.forEach((row, i) => {
    const position = { x: 700 * gsc + Math.random(), y: 300 * gsc + Math.random() };
    const radius = 50 * gsc;
    const physicsArea = new PhysicsArea({
      outerPush: {
        type: 'circle',
        radius,
        ...position,
        force: 4,
      },
      defaultChildRadius: 30 * gsc,
    });

    const n = new Node(row.head, { x: 0, y: 0 }, {
      radius: 25 * gsc,
      doubleBorder: row.accepting,
    });
    GS.globNodes[row.head] = n;
    n.moveTo(position);
    physicsArea.addPhysicsChild(n.graphic);
    n.graphic.globKey = row.head;
    GS.screen.addChild(physicsArea);
    physicsArea.start();
    globData[row.head] = {
      color: keyColors[row.head],
      radius,
      position,
      physicsArea,
    }
  });
  GS.glob = new Globs(globData, {
    physicsBound: {
      type: 'rectangle',
      width: 600 * gsc,
      height: 550 * gsc,
      x: 700 * gsc,
      y: 275 * gsc,
      force: 4,
    },
    ...opts.globOpts,
  });
  GS.glob.start();
  GS.glob.initialCombine(GS.dfa.rows.map(row => row.head), GS.colorFromKeys(mergedKey.split('+')));

  if (opts.drawEdges) {
    GS.allEdges = [];
    for (let i=0; i<GS.dfa.rows.length; i++) {
      for (let j=0; j<GS.dfa.alphabet.length; j++) {
        const start = GS.dfa.rows[i].head;
        const end = GS.dfa.rows[i].cells[j];
        const edge = AbstractEdge.decide(GS.globNodes[start], GS.globNodes[end], {
          edgeLabel: GS.dfa.alphabet[j],
        });
        edge.labelBG.alpha = 1;
        GS.allEdges.push(edge);
      }
    }
    app.ticker.add(() => {
      GS.allEdges.forEach(edge => edge.updateGraphic());
    })
    GS.allEdges.forEach(edge => GS.screen.addChild(edge.graphic));
  }

  Object.values(GS.globNodes).forEach(node => GS.screen.addChild(node.graphic));
  GS.screen.addChild(GS.glob);

  checkSplit();
  GS.solved = false;

  if (opts.progress) {
    GS.progress = new Progress(opts.progress.instructions, {...opts.progress, onSuccess: () => onSuccess('You successfully minimised the DFA!') }, GS);
  }

}

const unloader = () => {}

export default { loader, unloader };
