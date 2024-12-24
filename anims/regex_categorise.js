import Screen from "../screen.js";
import Categories from "./categorise.js";
import { FloatingButton } from "../ui.js";
import { darkGrey, green } from "../colours.js";
import TextChanger from "../tools/change_text.js";

const GS = {};

const unloader = (app) => {
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;
  GS.easings = easings;

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 700);
  GS.screen.scaleToFit();

  GS.regex = new TextChanger(opts.regex);
  GS.regex.position.set(500, 150);
  GS.regex.scale.set(2);
  GS.screen.addChild(GS.regex);

  const checkDisabled = () => {
    if (!GS.categories.state.assigned.includes(-1)) {
      GS.verify.setDisabled(false);
      GS.verifyIcon.tint = green;
      return;
    }
    GS.verify.setDisabled(true);
    GS.verifyIcon.tint = darkGrey;
  }

  GS.categories = new Categories(GS.opts.categories, GS.opts.data, 800, 400, GS.screen, {showIncorrect: true});
  GS.categories.graphic.position.set(100, 300);
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
  GS.verify.position.set(910, 610);
  GS.verify.setDisabled(true);
  GS.verify.onClick = () => {
    const msg = GS.categories.validate();
    msg ? onFailure(msg) : onSuccess(`Correct!`);
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
