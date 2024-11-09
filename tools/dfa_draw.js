import { bg, black, white } from "../colours.js";
import DFA from "../dfa.js";
import { Node, AbstractEdge, LoopEdge, CurveEdge } from "../graph.js";
import { KeyEntryModal, Checkbox } from '../ui.js';
import { mergeDeep } from "../utils.js";

class DFADraw {
  static baseStyle = {...DFA.baseNodeStyle};
  static baseEdgeStyle = {...DFA.baseEdgeStyle('')};

  static SELECT_EMPTY = "EMPTY";
  static SELECT_NODE = "NODE";
  static SELECT_EDGE = "EDGE";
  static DRAW_EDGE = "DRAW_EDGE";
  static DRAG_EDGE = "DRAG_EDGE";
  static DRAG_NODE = "DRAG_NODE";

  constructor(screen, opts) {
    this.screen = screen;
    this.opts = opts;

    this.onNodeCreate = null;      // (node, dfa) => {}
    this.onEdgeCreate = null;      // (edge, dfa) => {}
    this.onNodeDelete = null;      // (node, dfa) => {}
    this.onEdgeDelete = null;      // (edge, dfa) => {}
    this.onNodeStateChange = null; // (node, dfa) => {}
    this.onEdgeStateChange = null; // (edge, dfa) => {}

    this.curState = DFADraw.SELECT_EMPTY;
    this.nodeLabelModal = new KeyEntryModal("Enter a label for the node", 1);
    this.transitionLabelModal = new KeyEntryModal("Enter a label for the transition (or delete)", 20, "abcdefghijklmnopqrstuvwxyz123456789, ");
    this.fakeTargetNode = new Node("ABCDEF", { x: 0, y: 0 }, {...DFADraw.baseStyle});
    this.fakeTargetNode.graphic.visible = false;
    this.fakeEdge = AbstractEdge.decide(this.fakeTargetNode, this.fakeTargetNode, {...DFADraw.baseEdgeStyle});
    this.fakeEdge.edgeLine.interactive = false;
    this.nodeLabelModal.textMap = (text) => text.toUpperCase();
    this.transitionLabelModal.validation = (text) => {
      // TODO: Ensure valid transition label
      if (text === "ab")
        return "Bad transition label";
    };

    this.dfa = new DFA();
    this.nodeLabelModal.setDimensions(1000, 600);
    this.transitionLabelModal.setDimensions(1000, 600);
    this.bg_rect = new PIXI.Graphics().rect(0, 0, this.screen.gameWidth, this.screen.gameHeight).fill(bg);
    this.bg_rect.interactive = true;
    this.bg_rect.buttonMode = true;
    this.bg_rect.alpha = 0;
    this.bg_rect.on("click", (e) => {
      if (this.curState === DFADraw.SELECT_NODE) {
        this.deselectNode();
      } else if (this.curState === DFADraw.SELECT_EDGE) {
        this.deselectEdge();
      } else if (this.curState === DFADraw.SELECT_EMPTY) {
        const pos = this.screen.globalToLocal(e.data.global.x, e.data.global.y);
        this.createNode(pos.x, pos.y);
      }
    });
    this.bg_rect.on("pointermove", (e) => {
      if (this.curState === DFADraw.DRAW_EDGE) {
        this.draggingLeftNode = true;

        if (this.fakeEdge.to === this.fakeEdge.from) {
          // Was a loop, reupdate the fake edge
          this.removeFakeEdge();
          this.fakeEdge = AbstractEdge.decide(this.selectedNode, this.fakeTargetNode, {...DFADraw.baseEdgeStyle});
          this.fakeEdge.edgeLine.interactive = false;
          this.dfa.edgeContainer.addChild(this.fakeEdge.graphic);
        }
        const pos = this.screen.globalToLocal(e.data.global.x, e.data.global.y);
        this.fakeTargetNode.position = pos;
        this.fakeTargetNode.style.radius = 0;
        this.fakeEdge.to = this.fakeTargetNode;
        this.fakeEdge.updateGraphic();
      } else if (this.curState === DFADraw.DRAG_EDGE) {
        const pos = this.screen.globalToLocal(e.data.global.x, e.data.global.y);
        const dist = Math.sqrt((pos.x - this.draggingEdgeCenter.x) ** 2 + (pos.y - this.draggingEdgeCenter.y) ** 2);
        this.draggingEdgeMaxDist = Math.max(this.draggingEdgeMaxDist, dist);
        if (this.selectedEdge.from.label === this.selectedEdge.to.label) {
          this.fakeEdge.style.loopOffset = { x: pos.x - this.selectedEdge.from.position.x, y: pos.y - this.selectedEdge.from.position.y };
        } else {
          this.fakeEdge.style.edgeAnchor = { x: pos.x - this.draggingEdgeCenter.x, y: pos.y - this.draggingEdgeCenter.y };
        }
        this.fakeEdge.updateGraphic();
      } else if (this.curState === DFADraw.DRAG_NODE) {
        this.selectedNode.position = this.screen.globalToLocal(e.data.global.x, e.data.global.y);
        this.selectedNode.updateGraphic();
        this.dfa.updateEdges(this.selectedNode);
      }
    });
    this.genericMouseUp = (e) => {
      if (this.curState === DFADraw.DRAW_EDGE) {
        this.removeFakeEdge();
        this.curState = DFADraw.SELECT_EMPTY;
      } else if (this.curState === DFADraw.DRAG_EDGE) {
        let newStyle;
        if (this.selectedEdge.from.label === this.selectedEdge.to.label) {
          newStyle = mergeDeep({...this.selectedEdge.style}, { loopOffset: this.fakeEdge.style.loopOffset });
        } else {
          newStyle = mergeDeep({...this.selectedEdge.style}, { edgeAnchor: this.fakeEdge.style.edgeAnchor });
        }
        this.dfa.removeEdge(this.selectedEdge);
        this.removeFakeEdge();
        this.createEdge(this.selectedEdge.from, this.selectedEdge.to, newStyle);
        this.curState = DFADraw.SELECT_EMPTY;
      } else if (this.curState === DFADraw.DRAG_NODE) {
        this.curState = DFADraw.SELECT_EMPTY;
        this.onNodeStateChange?.(this.selectedNode, this.dfa);
      }
    }
    this.bg_rect.on("pointerup", this.genericMouseUp);

    this.screen.addChild(this.bg_rect);
    this.screen.addChild(this.dfa.graph);

    this._setupNodeContext();

    this.screen.addChild(this.nodeLabelModal);
    this.screen.addChild(this.transitionLabelModal);
  }

  startDraggingNode (node) {
    this.curState = DFADraw.DRAG_NODE;
    this.selectedNode = node;
  }

  startDraggingNodeEdge (node) {
    this.curState = DFADraw.DRAW_EDGE;
    this.selectedNode = node;
    this.draggingLeftNode = false;
    this.fakeTargetNode.position = {...node.position};
    this.fakeEdge = AbstractEdge.decide(node, this.fakeTargetNode, {...DFADraw.baseEdgeStyle});
    this.fakeEdge.edgeLine.interactive = false;
    this.dfa.edgeContainer.addChild(this.fakeEdge.graphic);
  }

  startDraggingEdge (edge, pos) {
    this.curState = DFADraw.DRAG_EDGE;
    this.selectedEdge = edge;
    this.draggingEdgeMaxDist = 0;
    this.draggingEdgeCenter = pos;
    if (edge.from.label === edge.to.label) {
      this.fakeEdge = new LoopEdge(edge.from, edge.to, mergeDeep({...DFADraw.baseEdgeStyle}, edge.style, {loopOffset: { x: 0, y: -75 }}));
    } else {
      this.fakeEdge = new CurveEdge(edge.from, edge.to, mergeDeep({...DFADraw.baseEdgeStyle}, edge.style, {edgeAnchor: { x: 0, y: 0 }}));
    }
    this.fakeEdge.graphic.alpha = 0.5;
    this.fakeEdge.edgeLine.interactive = false;
    this.dfa.edgeContainer.addChild(this.fakeEdge.graphic);
  }

  removeFakeEdge () {
    this.dfa.edgeContainer.removeChild(this.fakeEdge.graphic);
    this.fakeEdge.destroy();
  }

  selectNode (node) {
    this.selectedNode = node;
    this.stateContext.visible = true;
    this.stateContext.position.set(node.position.x + 50, node.position.y - 100);
    this.stateContextLabelBoxValue.text = node.label;
    this.stateContextMakeStartCheck.setChecked(node.style.isEntry);
    this.stateContextMakeFinalCheck.setChecked(node.style.doubleBorder);
    this.curState = DFADraw.SELECT_NODE;
  }

  deselectNode () {
    this.selectedNode = null;
    this.stateContext.visible = false;
    this.curState = DFADraw.SELECT_EMPTY;
  }

  selectEdge (edge) {
    this.selectedEdge = edge;
    this.curState = DFADraw.SELECT_EDGE;
  }
  deselectEdge () {
    this.selectedEdge = null;
    this.curState = DFADraw.SELECT_EMPTY;
  }

  _findNodeLabel () {
    // Finds the next appropriate label for a node.
    const labels = Object.keys(this.dfa.nodes);
    for (let i = 65; i < 91; i++) {
      const label = String.fromCharCode(i);
      if (!labels.includes(label)) {
        return label;
      }
    }
    for (let i=1;;i++) {
      const label = i.toString();
      if (!labels.includes(label)) {
        return label;
      }
    }
  }

  import (data) {
    this.dfa.clear();
    data.states.forEach((state) => {
      this.createNode(
        state.position?.x ?? 500,
        state.position?.y ?? 300,
        state.name,
        {
          isEntry: !!state.starting,
          doubleBorder: !!state.accepting,
        }
      )
    });
    data.transitions.forEach((transition) => {
      const e = {
        from: this.dfa.nodes[transition.from],
        to:  this.dfa.nodes[transition.to],
        style: {
          edgeLabel: transition.label,
        }
      };
      if (transition.style?.loopOffset) {
        e.style.loopOffset = transition.style.loopOffset;
      }
      if (transition.style?.edgeAnchor) {
        e.style.edgeAnchor = transition.style.edgeAnchor;
      }
      this.createEdge(e.from, e.to, e.style);
    });
  }

  createNode (x, y, forceName, extraStyle) {
    const node = new Node(forceName ?? this._findNodeLabel(), { x, y }, {
      ...DFADraw.baseStyle,
      ...this.opts.nodeStyle ?? {},
      isEntry: Object.keys(this.dfa.nodes).length === 0, // Auto set first node as the entry node
      ...extraStyle ?? {}
    });
    node.subscribe('pointerdown', () => {
      // This also fires for clicks but we can safely update the curState here
      // since click events are handled after and will override this.
      if (this.curState === DFADraw.SELECT_NODE) {
        const saveSelected = this.selectedNode;
        this.deselectNode();
        if (saveSelected === node) {
          this.startDraggingNode(node);
        }
      } else if (this.curState === DFADraw.SELECT_EDGE) {
        this.deselectEdge();
      }
      else {
        this.startDraggingNodeEdge(node);
      }
    });
    node.subscribe('pointermove', (e) => {
      if (this.curState === DFADraw.DRAW_EDGE) {
        if (this.selectedNode !== node || this.draggingLeftNode) {
          // We should make/modify the fake edge.
          if (this.fakeEdge.to !== node) {
            if (this.selectedNode === node) {
              this.removeFakeEdge();
              this.fakeEdge = AbstractEdge.decide(node, node, {...DFADraw.baseEdgeStyle});
              this.fakeEdge.edgeLine.interactive = false;
              this.dfa.edgeContainer.addChild(this.fakeEdge.graphic);
            }
            this.fakeEdge.to = node;
            this.fakeEdge.updateGraphic();
          }
        }
      }
      if (this.curState === DFADraw.DRAG_NODE) {
        this.selectedNode.position = this.screen.globalToLocal(e.data.global.x, e.data.global.y);
        this.selectedNode.updateGraphic();
        this.dfa.updateEdges(this.selectedNode);
      }
    });
    node.subscribe('pointerup', () => {
      if (this.curState === DFADraw.DRAW_EDGE && !this.draggingLeftNode) {
        this.removeFakeEdge();
        this.selectNode(node);
      } else if (this.curState === DFADraw.DRAG_NODE) {
        this.curState = DFADraw.SELECT_EMPTY;
        this.onNodeStateChange?.(this.selectedNode, this.dfa);
      } else if (this.curState === DFADraw.SELECT_EMPTY) {
        // Do nothing
      } else {
        this.createEdge(this.selectedNode, node);
        this.removeFakeEdge();
        this.curState = DFADraw.SELECT_EMPTY;
      }
    });
    this.dfa.addNode(node);
    this.onNodeCreate?.(node, this.dfa);
    return node;
  }

  createEdge (from, to, extraStyle) {
    const edge = AbstractEdge.decide(from, to, mergeDeep({...DFADraw.baseEdgeStyle}, extraStyle ?? {}));
    edge.labelBG.alpha = 1;
    edge.subscribe('pointerdown', (e) => {
      if (this.curState === DFADraw.SELECT_EMPTY) {
        this.startDraggingEdge(edge, this.screen.globalToLocal(e.data.global.x, e.data.global.y));
      }
    });
    edge.subscribe('pointerup', (e) => {
      if (this.curState === DFADraw.DRAG_EDGE) {
        if (this.draggingEdgeMaxDist < 10) {
          this.removeFakeEdge();
          // Enter label modal
          this.transitionLabelModal.onEnter = (text) => {
            this.dfa.changeEdgeLabel(edge, text);
            this.onEdgeStateChange?.(edge, this.dfa);
          };
          this.transitionLabelModal.onExtraBackspace = () => {
            this.dfa.removeEdge(edge);
            this.onEdgeDelete?.(edge, this.dfa);
          }
          this.transitionLabelModal.activate();
          this.curState = DFADraw.SELECT_EMPTY;
        }
      } else {
        this.genericMouseUp(e);
      }
    })
    this.dfa.addEdge(edge);
    this.onEdgeCreate?.(edge, this.dfa);
    return edge;
  }

  _setupNodeContext () {
    this.stateContext = new PIXI.Container();
    this.stateContextBG = new PIXI.Graphics().rect(0, 0, 150, 200).fill(white).stroke(black, 3);
    this.stateContextLabel = new PIXI.Text({ text: "State Options", style: { fill: black, fontSize: 20 } });
    this.stateContextLabel.position.set(10, 10);
    this.stateContextLabelLabel = new PIXI.Text({ text: "Label:", style: { fill: black, fontSize: 18 } });
    this.stateContextLabelLabel.anchor.set(0, 0.5);
    this.stateContextLabelLabel.position.set(10, 60);
    this.stateContextLabelBox = new PIXI.Graphics().rect(120, 50, 20, 20).fill(white).stroke({ color: black, width: 2 });
    this.stateContextLabelBoxValue = new PIXI.Text({ text: "A", style: { fill: black, fontSize: 18 } });
    this.stateContextLabelBoxValue.anchor.set(0.5, 0.5);
    this.stateContextLabelBoxValue.position.set(130, 60);
    this.stateContextMakeStartLabel = new PIXI.Text({ text: "Start State:", style: { fill: black, fontSize: 18 } });
    this.stateContextMakeStartLabel.anchor.set(0, 0.5);
    this.stateContextMakeStartLabel.position.set(10, 90);
    this.stateContextMakeStartCheck = new Checkbox(false);
    this.stateContextMakeStartCheck.position.set(120, 80);
    this.stateContextMakeFinalLabel = new PIXI.Text({ text: "Final State:", style: { fill: black, fontSize: 18 } });
    this.stateContextMakeFinalLabel.anchor.set(0, 0.5);
    this.stateContextMakeFinalLabel.position.set(10, 120);
    this.stateContextMakeFinalCheck = new Checkbox(false);
    this.stateContextMakeFinalCheck.position.set(120, 110);
    this.stateContextDeleteBox = new PIXI.Graphics().rect(70, 165, 70, 25).fill(white).stroke({ color: black, width: 2 });
    this.stateContextDeleteLabel = new PIXI.Text({ text: "Delete?", style: { fill: black, fontSize: 18 } });
    this.stateContextDeleteLabel.anchor.set(0.5, 0.5);
    this.stateContextDeleteLabel.position.set(105, 177.5);

    this.stateContext.addChild(this.stateContextBG);
    this.stateContext.addChild(this.stateContextLabel);
    this.stateContext.addChild(this.stateContextLabelLabel);
    this.stateContext.addChild(this.stateContextLabelBox);
    this.stateContext.addChild(this.stateContextLabelBoxValue);
    this.stateContext.addChild(this.stateContextMakeStartLabel);
    this.stateContext.addChild(this.stateContextMakeStartCheck);
    this.stateContext.addChild(this.stateContextMakeFinalLabel);
    this.stateContext.addChild(this.stateContextMakeFinalCheck);
    this.stateContext.addChild(this.stateContextDeleteBox);
    this.stateContext.addChild(this.stateContextDeleteLabel);
    this.stateContext.visible = false;

    // State Context Menu blocks click
    this.stateContextBG.interactive = true;
    // State Context Actions
    this.stateContextLabelBox.interactive = true;
    this.stateContextLabelBox.cursor = "pointer";
    this.stateContextLabelBox.on("pointerdown", () => {
      this.nodeLabelModal.onEnter = (text) => {
        this.stateContextLabelBoxValue.text = text;
        this.dfa.changeNodeLabel(this.selectedNode.label, text);
        this.onNodeStateChange?.(this.selectedNode, this.dfa);
      };
      this.nodeLabelModal.activate();
    });
    this.stateContextMakeStartCheck.onChange = (checked) => {
      this.selectedNode.style.isEntry = checked;
      this.selectedNode.updateGraphic();
      this.onNodeStateChange?.(this.selectedNode, this.dfa);
    };
    this.stateContextMakeFinalCheck.onChange = (checked) => {
      this.selectedNode.style.doubleBorder = checked;
      this.selectedNode.updateGraphic();
      this.onNodeStateChange?.(this.selectedNode, this.dfa);
    };

    this.stateContextDeleteBox.interactive = true;
    this.stateContextDeleteBox.cursor = "pointer";
    this.stateContextDeleteBox.on("pointerdown", () => {
      this.dfa.removeNode(this.selectedNode);
      this.stateContext.visible = false;
      this.curState = DFADraw.SELECT_EMPTY;
      this.onNodeDelete?.(this.selectedNode, this.dfa);
      this.selectedNode = null;
    });

    this.screen.addChild(this.stateContext);
  }

  unload() {
    this.nodeLabelModal.destroy();
    this.transitionLabelModal.destroy();
  }

}

export default DFADraw;
