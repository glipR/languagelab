import { bg_dark, black, green, lightGrey, red } from "../colours.js";
import NFA from "../nfa.js";
import Screen from "../screen.js";
import Table from "../tools/table.js";
import { Node } from "../graph.js";
import { delay, interpValue, Tween, TweenManager, ValueTween } from "../tween.js";
import Progress from "../tools/progress.js";
import { FloatingButton } from "../ui.js";
import NodeGroup from "../tools/node_group.js";

const gsc = window.gameScaling ?? 1;

const GS = {
  data: [],
  curSelected: { x: 0, y: 0 },
  nfa: new NFA(),
  table: new Table({}),
  progress: new Progress([], {}),
  matched: false,
};

const baseStyle = {
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
  animSpeed: 15,
}

function toggleNode(n) {
  if (GS.curSelected.x === 0) {
    // Header row, not selectable
    return;
  }
  const curNodes = GS.data[GS.curSelected.x][GS.curSelected.y];
  if (curNodes.includes(n.label)) {
    curNodes.splice(curNodes.indexOf(n.label), 1);
  } else {
    curNodes.push(n.label);
  }
  curNodes.sort();
  TweenManager.add(GS.nodeGroups[GS.curSelected.x][GS.curSelected.y].setNodes(curNodes, baseNodeGroupOptions.animSpeed));

  toggleHighlight(n);
}

function highlightBorder(i, j, color) {
  const container = GS.table.getContainer(i, j);
  if (!container.border) {
    container.border = new PIXI.Graphics();
    container.border
      .rect(-120/2 * gsc, -70/2 * gsc, 120 * gsc, 70 * gsc)
      .stroke({ color, width: 5 * gsc });
    container.addChild(container.border);
  }
  TweenManager.add(new ValueTween(container.border.alpha, 1, 30, GS.easings.easeInOutQuad, (v) => {
    container.border.alpha = v;
  }));

  return () => {
    TweenManager.add(new ValueTween(container.border.alpha, 0, 30, GS.easings.easeInOutQuad, (v) => {
      container.border.alpha = v;
    }));
  }
}
GS.highlightBorder = highlightBorder;

function highlightEdges(edges, color) {
  const tweens = [];
  edges.forEach(edge => {
    tweens.push(edge.colorEdgeTween(color, 30, GS.easings.easeInOutQuad, true));
  })
  if (tweens.length === 0) return;
  TweenManager.add(delay(0).then(...tweens));
  return () => {
    TweenManager.add(delay(0).then(...edges.map(e => e.colorEdgeTween(black, 30, GS.easings.easeInOutQuad, true))));
  }
}
GS.highlightEdges = highlightEdges;

function getStatesAndEdgesFromStatesWithEpsilon(states) {
  const edges = [];
  const finalStates = [...states];
  const marked = {};
  let curStates = states;
  states.forEach(state => marked[state] = true);
  while (curStates.length > 0) {
    const newStates = [];
    curStates.forEach(state => {
      GS.nfa.edges.forEach(edge => {
        if (edge.from.label === state && edge.style.edgeLabel === "ε") {
          edges.push(edge);
          if (!marked[edge.to.label]) {
            newStates.push(edge.to.label);
            finalStates.push(edge.to.label);
            marked[edge.to.label] = true;
          }
        }
      });
    });
    curStates = newStates;
  }
  return { states: finalStates, edges };
}
GS.getStatesAndEdgesFromStatesWithEpsilon = getStatesAndEdgesFromStatesWithEpsilon;

function getStatesAndEdgesFromStatesWithCharacterAndEpsilon(states, char) {
  const edges = [];
  const marked = {};
  const curStates = [];
  states.forEach(state => {
    GS.nfa.edges.forEach(edge => {
      if (edge.from.label === state && edge.style.edgeLabel.includes(char)) {
        edges.push(edge);
        if (!marked[edge.to.label]) {
          curStates.push(edge.to.label);
          marked[edge.to.label] = true;
        }
      }
    });
  });
  const { states: finalStates, edges: epsilonEdges } = getStatesAndEdgesFromStatesWithEpsilon(curStates);
  return { states: finalStates, edges: edges.concat(epsilonEdges), epsilonEdges, charEdges: edges };
}
GS.getStatesAndEdgesFromStatesWithCharacterAndEpsilon = getStatesAndEdgesFromStatesWithCharacterAndEpsilon;

function highlightEpsilonsFromStates(states, color) {
  const { edges } = getStatesAndEdgesFromStatesWithEpsilon(states);
  return highlightEdges(edges, color);
}
GS.highlightEpsilonsFromStates = highlightEpsilonsFromStates;

function highlightCharacterPlusEpsilonsFromStates(states, char, color1, color2) {
  const { edges, epsilonEdges, charEdges } = getStatesAndEdgesFromStatesWithCharacterAndEpsilon(states, char);
  if (color2) {
    const c1 = highlightEdges(charEdges, color1);
    const c2 = highlightEdges(epsilonEdges, color2);
    return () => {
      c1?.();
      c2?.();
    }
  }
  return highlightEdges(edges, color1);
}
GS.highlightCharacterPlusEpsilonsFromStates = highlightCharacterPlusEpsilonsFromStates;

function setNodeBorder(colour, width, ...nodes) {
  nodes.forEach((n) => {
    n.style.stroke = colour;
    n.style.strokeWidth = width;
    n.updateGraphic();
  });
}
GS.setNodeBorder = setNodeBorder;

function clearHighlights() {
  GS.highlightContainer.removeChildren();
  GS.highlightedNodes = {};
}

function toggleHighlight(n) {
  if (GS.highlightedNodes[n.label]) {
    GS.highlightedNodes[n.label].destroy();
    delete GS.highlightedNodes[n.label];
  } else {
    const circle = new PIXI.Graphics();
    circle
      .circle(n.position.x, n.position.y, n.style.radius - n.style.strokeWidth/2)
      .fill(0xffffff)
    circle.alpha = 0.5;
    GS.highlightedNodes[n.label] = circle;
    GS.highlightContainer.addChild(circle);
  }
  return () => {toggleHighlight(n)};
}

function showArrow() {
  const showTween = new ValueTween(GS.checkButtonArrow.alpha, 1, 30, GS.easings.easeInOutQuad, (v) => {
    GS.checkButtonArrow.alpha = v;
  });
  const queueShift = (fn, b) => {
    TweenManager.add(new ValueTween(Number(b), 1 - Number(b), 30, GS.easings.easeInOutQuad, (v) => {
      const newPosition = interpValue({ x: 940, y: 510 }, { x: 940, y: 500 }, v);
      GS.checkButtonArrow.position.set(newPosition.x, newPosition.y);
    }, undefined, () => {
      // Do the opposite, if still visible.
      if (GS.checkButtonArrow.alpha > 0) {
        fn(fn, !b);
      }
    }));
  }
  TweenManager.add(showTween);
  queueShift(queueShift, false);
  return () => {
    hideArrow();
  }
}
GS.showArrow = showArrow;

function hideArrow() {
  TweenManager.add(new ValueTween(GS.checkButtonArrow.alpha, 0, 30, GS.easings.easeInOutQuad, (v) => {
    GS.checkButtonArrow.alpha = v;
  }));
}
GS.hideArrow = hideArrow;

// Functionality for checking NFA conversion table
function validState(i) {
  const nodes = GS.data[i][0];
  if (nodes.length === 0) return true;
  for (let k=1; k<i; k++) {
    for (let l=1; l<=GS.opts.alphabet.length; l++) {
      if (GS.data[k][l].toString() === nodes.toString()) return true;
    }
  }
  return false;
}
GS.validState = validState;

function uniqueHeader(i) {
  for (let k=1; k<i; k++) {
    if (GS.data[i][0].toString() === GS.data[k][0].toString()) return false;
  }
  return true;
}
GS.uniqueHeader = uniqueHeader;

function correctTransition(i, j) {
  const char = GS.opts.alphabet[j-1];
  const nodes = GS.data[i][j];
  const from = GS.data[i][0];
  const { states: expectedStates } = getStatesAndEdgesFromStatesWithCharacterAndEpsilon(from, char);
  return nodes.sort().toString() === expectedStates.sort().toString();
}
GS.correctTransition = correctTransition;

function validConversion() {
  // Check that:
  // - Start state is present in headers.
  // - Each header is unique (if non-empty) and valid
  // - All transitions are correct
  // - Every mentioned state has a header present.

  // Start state is present.
  const { states: startStates } = getStatesAndEdgesFromStatesWithEpsilon([Object.values(GS.nfa.nodes).find(n => n.style.isEntry).label]);
  console.log(startStates.sort().toString(), GS.data.slice(1).map(row => row[0].toString()));
  if (!GS.data.slice(1).map(row => row[0].toString()).includes(startStates.sort().toString())) return "The expected start state is not present in the table headers.";
  // Each header is unique and valid
  for (let i=1; i<GS.data.length; i++) {
    if (GS.data[i][0].length !== 0 && !uniqueHeader(i)) return `The state ${GS.data[i][0].toString()} is not unique amongst the headers.`;
  }
  // All transitions are correct
  for (let i=1; i<GS.data.length; i++) {
    for (let j=1; j<GS.opts.alphabet.length+1; j++) {
      if (!correctTransition(i, j)) return `The transition from ${GS.data[i][0].toString()} on character '${GS.opts.alphabet[j-1]}' is incorrect.`;
    }
  }
  // Every mentioned state has a header present
  const headers = GS.data.slice(1).map(row => row[0].toString())
  for (let i=1; i<GS.data.length; i++) {
    for (let j=1; j<GS.opts.alphabet.length+1; j++) {
      const dataString = GS.data[i][j].sort().toString();
      if (!headers.includes(dataString)) return `The state ${dataString} is mentioned in the table but does not have a header with transitions.`;
    }
  }
  return;
}
GS.validConversion = validConversion;

const checkExtraLineCreation = () => {
  if (GS.curSelected.x === GS.data.length-1 && GS.data[GS.curSelected.x][GS.curSelected.y].length > 0) {
    GS.table.resize(GS.data.length, GS.data[0].length-1);
    GS.nodeGroups.push(Array.from({length: GS.data[0].length}, () => new NodeGroup(baseNodeGroupOptions, GS.nfa, [])));
    GS.data.push(Array.from({length: GS.data[0].length}, () => []));
    const nextRow = GS.curSelected.x + 1;
    for (let k=0; k<GS.data[0].length; k++) {
      GS.table.getContainer(nextRow, k).subscribe('click', makeContainerClick(nextRow, k));
      GS.table.getContainer(nextRow, k).contents.addChild(GS.nodeGroups[nextRow][k]);
    }
  }
}

const makeContainerClick = (i, j) => {
  return (e) => {
    if (e.shiftKey) {
      // Copy the data from this cell into the selected cell.
      GS.data[GS.curSelected.x][GS.curSelected.y] = GS.data[i][j].slice();
      TweenManager.add(GS.nodeGroups[GS.curSelected.x][GS.curSelected.y].setNodes(GS.data[GS.curSelected.x][GS.curSelected.y], baseNodeGroupOptions.animSpeed));
      // Update the graphics.
      clearHighlights();
      GS.data[i][j].forEach(lab => toggleHighlight(GS.nfa.nodes[lab]));
      GS.progress.checkCompleted();
      // TODO: Move this into the steps somehow.
      if (GS.progress.current === 7 && GS.curSelected.x === 2 && GS.curSelected.y === 0) {
        GS.progress.completeInstruction(7);
      }
      if (GS.progress.current === 9 && GS.curSelected.x === 3 && GS.curSelected.y === 0) {
        GS.progress.completeInstruction(9);
      }
      checkExtraLineCreation();
      return;
    }
    const oldContainerBackground = GS.table.getContainer(GS.curSelected.x, GS.curSelected.y).background;
    const newContainerBackground = GS.table.getContainer(i, j).background;
    TweenManager.add(new ValueTween(oldContainerBackground.alpha, 0, 30, GS.easings.easeInOutQuad, (v) => {
      oldContainerBackground.alpha = v;
    }));
    TweenManager.add(new ValueTween(newContainerBackground.alpha, 0.2, 30, GS.easings.easeInOutQuad, (v) => {
      newContainerBackground.alpha = v;
    }));
    GS.curSelected = { x: i, y: j };
    const rowHeaderSelected = GS.data[i][0];
    // Borders
    setNodeBorder(black, 3, ...Object.values(GS.nfa.nodes));
    setNodeBorder(lightGrey, 5, ...rowHeaderSelected.map((lab) => GS.nfa.nodes[lab]));
    // Highlights
    clearHighlights();
    GS.data[i][j].forEach(lab => toggleHighlight(GS.nfa.nodes[lab]));
    GS.progress.checkCompleted();
    GS.nodeGroups[i][j].style.cross.visible = true;
    TweenManager.add(GS.nodeGroups[i][j].setNodes(GS.data[i][j], baseNodeGroupOptions.animSpeed));
    if (GS.curSelected.y === 0) {
      // Header row, rerender the entire row
      for (let k=1; k<=GS.opts.alphabet.length; k++) {
        GS.nodeGroups[i][k].style.cross.visible = true;
        TweenManager.add(GS.nodeGroups[i][k].setNodes(GS.data[i][k], baseNodeGroupOptions.animSpeed));
      }
    }
    checkExtraLineCreation()
  }
}

const nodeClick = (n) => {
  toggleNode(GS.nfa.nodes[n]);
  GS.progress.checkCompleted();
  checkExtraLineCreation();
}
GS.nodeClick = nodeClick;

// Just used in the intro video.
const containerClick = (i, j, e_overwrite={}) => {
  const e = {...e_overwrite}
  makeContainerClick(i, j)(e);
}
GS.containerClick = containerClick;

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.screen = new Screen(app, opts.hideBG);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();
  GS.easings = easings;
  GS.matched = false;

  GS.opts = opts;

  GS.nfa = new NFA();
  GS.nfa.fromJSON(opts.nfa);
  GS.nfa.graph.position.set(750 * gsc, 300 * gsc);
  GS.nfa.edges.forEach(e => e.labelBG.alpha = 1);
  GS.screen.addChild(GS.nfa.graph);

  GS.highlightContainer = new PIXI.Container();
  GS.highlightedNodes = {};
  GS.nfa.graph.addChild(GS.highlightContainer);

  // Make a big table
  const preferredWidth = 240 * gsc / GS.opts.alphabet.length;
  GS.table = new Table({ itemHeight: 70 * gsc, itemWidth: Math.max(80 * gsc, Math.min(preferredWidth, 120 * gsc)) });
  GS.table.resize(5, GS.opts.alphabet.length);
  GS.data = Array.from({length: 6}, () => Array.from({length: GS.opts.alphabet.length + 1}, () => []));
  GS.nodeGroups = Array.from({length: 6}, () => Array.from({length: GS.opts.alphabet.length + 1}, () => new NodeGroup(baseNodeGroupOptions, GS.nfa, [])));
  GS.nodeGroups.forEach((row, i) => {
    row.forEach((ng, j) => {
      GS.table.getContainer(i, j).contents.addChild(ng);
    });
  });
  GS.table.position.set(50 * gsc, 25 * gsc);
  GS.screen.addChild(GS.table);

  GS.checkButton = new FloatingButton({
    label: {
      text: "Check",
    },
    bg: {
      fill: bg_dark,
    },
    height: 50 * gsc,
  });
  GS.checkButton.position.set(890 * gsc, 540 * gsc);
  GS.checkButton.onClick = () => {
    const error = GS.validConversion();
    if (error) {
      onFailure(error);
    } else {
      GS.matched = true;
      GS.progress.checkCompleted();
      onSuccess(GS.opts.solution);
    }
  }
  GS.screen.addChild(GS.checkButton);
  GS.checkButtonArrow = new PIXI.Graphics();
  GS.checkButtonArrow.rect(-12.5 * gsc, -10 * gsc, 25 * gsc, 20 * gsc).fill(green);
  GS.checkButtonArrow.moveTo(-20, 10 * gsc).lineTo(20 * gsc, 10 * gsc).lineTo(0, 25 * gsc).lineTo(-20 * gsc, 10 * gsc).fill(green);
  GS.checkButtonArrow.position.set(940 * gsc, 510 * gsc);
  GS.checkButtonArrow.alpha = 0;
  GS.screen.addChild(GS.checkButtonArrow);

  const queueHighlight = (fn, b) => {
    TweenManager.add(new ValueTween(Number(b), 1 - Number(b), 30, easings.easeInOutQuad, (v) => {
      GS.highlightContainer.alpha = v;
    }, undefined, () => {
      // Do the opposite.
      fn(fn, !b);
    }));
  }

  queueHighlight(queueHighlight, false);

  const letters = GS.opts.alphabet.map(c => {
    const text = new PIXI.Text({ text: c, style: baseStyle });
    text.anchor.set(0.5, 0.5);
    return text;
  });
  letters.forEach((letter, i) => {
    GS.table.getContainer(0, i+1).contents.addChild(letter);
  });

  for (let i=1; i<=5; i++) {
    for (let j=0; j<=GS.opts.alphabet.length; j++) {
      GS.table.getContainer(i, j).subscribe('click', makeContainerClick(i, j));
    }
  }

  Object.values(GS.nfa.nodes).forEach((n) => {
    n.subscribe('click', () => {
      nodeClick(n.label);
    });
  });

  if (opts.progress) {
    GS.progress = new Progress(opts.progress.instructions, opts.progress, GS);
  }
}

const unloader = () => {

}

export default { loader, unloader, GS };
