import DFA from "../dfa.js";
import Screen from "../screen.js";
import Categories from "./categorise.js";
import { FloatingButton, TextEntry } from "../ui.js";
import { darkGrey, green } from "../colours.js";

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

  const checkDisabled = () => {
    if (GS.textInput.value) {
      if (!GS.categories.state.assigned.includes(-1)) {
        GS.verify.setDisabled(false);
        GS.verifyIcon.tint = green;
        return;
      }
    }
    GS.verify.setDisabled(true);
    GS.verifyIcon.tint = darkGrey;
  }

  const TL = GS.screen.localToGlobal(200, 475);
  const BR = GS.screen.localToGlobal(800, 525);

  GS.textInput = document.createElement("input");
  GS.textInput.style.position = "absolute";
  GS.textInput.style.width = `${BR.x - TL.x}px`;
  GS.textInput.style.height = `${BR.y - TL.y}px`;
  GS.textInput.style.left = `${TL.x}px`;
  GS.textInput.style.top = `${TL.y}px`;
  // GS.textInput.style.transform = "translate(-50%, -65%)";
  GS.textInput.style.fontSize = "20px";
  GS.textInput.addEventListener("input", () => {
    checkDisabled();
  });
  document.querySelector('.scene').appendChild(GS.textInput);

  GS.categories = new Categories(GS.opts.categories, GS.opts.data, 800, 400, GS.screen, {showIncorrect: true});
  GS.categories.graphic.position.set(100, 600);
  GS.categories.onChange = () => {
    checkDisabled();
  }
  GS.categories.onSubmit = (msg) => {
    GS.lastMsg = msg;
  }
  GS.screen.addChild(GS.categories.graphic);

  GS.verify = new FloatingButton({
    width: 80,
    height: 80,
  });
  GS.verify.position.set(910, 910);
  GS.verify.setDisabled(true);
  GS.verify.onClick = () => {
    const msg = GS.categories.validate();
    msg ? onFailure(msg) : onSuccess(`Correct! One possible description is: ${opts.exampleDescription}.`);
  }
  GS.screen.addChild(GS.verify);
  GS.verifyIcon = new PIXI.Graphics();
  GS.verifyIcon
    .moveTo(-30, -10)
    .lineTo(0, 20)
    .lineTo(60, -40)
    .lineTo(50, -50)
    .lineTo(0, 0)
    .lineTo(-20, -20)
    .lineTo(-30, -10)
    .fill(new PIXI.Color(0xffffff));
  GS.verifyIcon.tint = darkGrey;
  GS.verifyIcon.scale.set(0.7);
  GS.verifyIcon.position.set(30, 50);
  GS.verify.addChild(GS.verifyIcon);
}

export default { loader, unloader };
