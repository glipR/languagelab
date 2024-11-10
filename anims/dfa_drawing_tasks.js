import { bg_dark } from "../colours.js";
import Screen from "../screen.js";
import DFADraw from "../tools/dfa_draw.js";
import Progress from "../tools/progress.js";
import { FloatingButton } from "../ui.js";

const GS = {
  instructions: [
    "Tap anywhere on the screen to add a new state!",
    "Create 3 states",
    "Tap one of the states, and make it a final state",
    "Drag from one state to another to create a transition",
    "Create a loop transition by dragging from a state to itself (your finger must exit the state)",
    "Tap a transition to edit it's label",
    "Make a state with label X, either by making a bunch of states or by editing the label of an existing state",
    "Tap a state, then drag it to move the state",
    "Move an edge by dragging it",
    "Delete an edge by clicking it then pressing backspace, rather than entering a new label",
    "Delete a state and make it remove 3 transitions at once",
  ],
  progress: new Progress([], {}),
  oldNodeStates: {},
  oldEdgeStates: [],
};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  screen = new Screen(app);
  screen.setScreenSize(app.renderer.width, app.renderer.height);
  screen.setGameSize(1000, 600);
  screen.scaleToFit();
  GS.screen = screen;
  GS.dfa = new DFADraw(screen, opts);
  GS.progress = new Progress(GS.instructions, opts);

  const clearButton = new FloatingButton({
    label: {
      text: "Clear",
    },
    bg: {
      fill: bg_dark,
    },
    width: 100,
    height: 50,
  });
  clearButton.position.set(10, GS.screen.gameHeight - 10 - 50);
  clearButton.onClick = () => {
    GS.dfa.dfa.clear();
  };
  GS.screen.addChild(clearButton);

  const resetNodeStates = () => {
    GS.oldNodeStates = {};
    Object.values(GS.dfa.dfa.nodes).forEach((n) => {
      GS.oldNodeStates[n.label] = {
        label: n.label,
        final: n.style.doubleBorder,
        start: n.style.isEntry,
        position: n.position,
      };
    });
  }

  const resetEdgeStates = () => {
    GS.oldEdgeStates = [];
    Object.values(GS.dfa.dfa.edges).forEach((e) => {
      GS.oldEdgeStates.push({
        from: e.from.label,
        to: e.to.label,
        label: e.labelText.text,
      });
    });
  }

  GS.dfa.onNodeCreate = (node, dfa) => {
    GS.progress.markCompleted(0);
    if (Object.keys(dfa.nodes).length >= 3) {
      GS.progress.markCompleted(1);
    } if (node.label === "X") {
      GS.progress.markCompleted(6);
    }
    resetNodeStates();
  }
  GS.dfa.onNodeStateChange = (node, dfa) => {
    if (node.style.doubleBorder) {
      GS.progress.markCompleted(2);
    }
    if (node.label === "X") {
      GS.progress.markCompleted(6);
    }
    if (GS.oldNodeStates[node.label] !== undefined) {
      if (GS.oldNodeStates[node.label].position !== node.position) {
        // Drag node.
        GS.progress.markCompleted(7);
      }
    }
    resetNodeStates();
  }
  GS.dfa.onNodeDelete = (node, dfa) => {
    // Check for 3 removed edges.
    const prevEdge = GS.oldEdgeStates.length;
    const newEdge = Object.values(dfa.edges).length;
    if (prevEdge - newEdge >= 3) {
      GS.progress.markCompleted(10);
    }
    resetNodeStates();
    resetEdgeStates();
  }

  GS.dfa.onEdgeCreate = (edge, dfa) => {
    GS.progress.markCompleted(3);
    if (edge.from.label === edge.to.label) {
      GS.progress.markCompleted(4)
    }
    // Dragged edges get recreated.
    if (edge.from.label === edge.to.label && edge.style.loopOffset) {
      // Loop drag
      GS.progress.markCompleted(8);
    } else if (edge.from.label !== edge.to.label && edge.style.edgeAnchor) {
      // Curve drag
      GS.progress.markCompleted(8);
    }
    resetEdgeStates();
  }
  GS.dfa.onEdgeStateChange = (edge, dfa) => {
    const existingEdge = GS.oldEdgeStates.find((e) => e.from === edge.from.label && e.to === edge.to.label);
    if (edge.labelText.text !== "" && existingEdge && existingEdge.label !== edge.labelText.text) {
      GS.progress.markCompleted(5);
    }
    resetEdgeStates();
  }
  GS.dfa.onEdgeDelete = (edge, dfa) => {
    GS.progress.markCompleted(9);
    resetEdgeStates();
  }
}

const unloader = (app) => {
  GS.dfa.unload();
}

export default { loader, unloader };
