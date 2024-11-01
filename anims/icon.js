import DFA from "../dfa.js";
import Screen from "../screen.js"
import { RectangleCover } from "../tools/paper_cover.js";

const loader = (app, easings, onSuccess, onFailure, opts) => {
  const screen = new Screen(app);
  screen.setScreenSize(app.renderer.width, app.renderer.height);
  screen.setGameSize(1000, 600);
  screen.scaleToFit();

  const graph = new DFA();
  graph.graph.position.set(500, 300);
  graph.fromJSON({
    nodes: {
      A: { x: 0, y: -100 },
      B: { x: -40, y: 0 },
      C: { x: 70, y: 30 },
      D: { x: 10, y: 100 },
    },
    edges: [
      { from: "A", to: "B" },
      { from: "A", to: "C" },
      { from: "C", to: "D" },
      { from: "D", to: "A" },
      { from: "C", to: "C", style: {loopOffset: {x: 30, y: -60}} },
      { from: "B", to: "B", style: {loopOffset: {x: 0, y: 75}} },
    ]
  });
  const bigBG = new PIXI.Graphics();
  bigBG.beginFill(0x000000);
  bigBG.drawRect(0, 0, 1000, 600);
  bigBG.endFill();
  screen.addChild(bigBG);
  const cover = new RectangleCover(graph.graph, { points: 15, fill: 0x60d394, randMult: 0.05, shadowAlpha: 0 });
  cover.position.set(500, 300);
  screen.addChild(cover);
  screen.addChild(graph.graph);

}
const unloader = () => {}

export default { loader, unloader }
