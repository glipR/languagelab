import DFA from "../dfa.js";
import Screen from "../screen.js";
import Categories from "./categorise.js";
import { TextEntry } from "../ui.js";

const GS = {};

const unloader = (app) => {
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;
  GS.easings = easings;
  GS.graph = new DFA();
  GS.graph.fromJSON(opts.graph);

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 1000);
  GS.screen.scaleToFit();

  GS.graph.edges.forEach((edge) => {
    edge.labelBG.alpha = 1;
  });

  GS.screen.addChild(GS.graph.graph);

  GS.categories = new Categories(GS.opts.categories, GS.opts.data, 800, 400, GS.screen, {showIncorrect: true});
  GS.categories.graphic.position.set(100, 600);
  GS.categories.onSubmit = (msg) => {msg ? onFailure(msg) : onSuccess("Correct!")};
  GS.screen.addChild(GS.categories.graphic);

  GS.text = new TextEntry(0, "", { bg: {width: 700, height: 35 } });
  GS.text.position.set(150, 560);
  GS.screen.addChild(GS.text);
}

export default { loader, unloader };
