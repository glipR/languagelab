// TODO: Use tools/dfa_draw.js to allow drawing, add a "Check" button to the screen and then call
// GS.dfa.validate() when the button is pressed.
// As well as GS.dfa.checkWordArray

// In future, also implement the FA minimisation algorithm, and check the minimised FAs are the same.

import DFADraw from "../tools/dfa_draw.js";
import DFA from "../dfa.js";
import Screen from "../screen.js";
import { bg_dark, black } from "../colours.js";
import { mergeDeep } from "../utils.js";

const GS = {
  checkingDFA: new DFA(),
};

const check = () => {
  if (GS.dfa.dfa.validate()) {
    GS.onFailure(`Your DFA is not valid: ${GS.dfa.dfa.validate()}`);
    return;
  }
  const word = GS.checkingDFA.combine(GS.dfa.dfa, (me, other) => me ^ other).findAcceptingString()
  const checkingAccepts = word !== null && GS.checkingDFA.simulateWord(word) === "Accept";
  if (word === null) {
    GS.onSuccess('You DFA is correct!');
  } else {
    GS.onFailure(`Your DFA ${checkingAccepts ? 'rejects' : 'accepts'} the string "${word}", but it shouldn't.`);
  }
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();
  GS.dfa = new DFADraw(GS.screen, opts);
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;

  GS.checkingDFA = new DFA();
  GS.checkingDFA.fromJSON(opts.checkingDFA);

  const button = new PIXI.Container();
  const buttonBG = new PIXI.Graphics();
  const buttonOpts = mergeDeep({
    width: 100,
    height: 50,
    bg: {
      fill: {color: bg_dark},
      stroke: {color: black, width: 3},
    },
    text: {
      fill: black,
      fontSize: 24,
    },
  }, opts?.button);
  buttonBG
    .rect(0, 0, buttonOpts.width, buttonOpts.height)
    .fill({...buttonOpts.bg?.fill})
    .stroke({...buttonOpts.bg?.stroke});
  buttonBG.pivot.set(buttonOpts.width/2, buttonOpts.height/2);
  button.addChild(buttonBG);
  const buttonText = new PIXI.Text({ text: "Check", style: {...buttonOpts.text}});
  buttonText.anchor.set(0.5, 0.5);
  button.addChild(buttonText);
  button.pivot.set(buttonOpts.width, buttonOpts.height);
  button.position.set(GS.screen.gameWidth, GS.screen.gameHeight);
  button.interactive = true;
  button.buttonMode = true;
  button.on("pointerdown", check);
  GS.screen.addChild(button);
}

const unloader = () => {
  GS.dfa.unload();
}

export default { loader, unloader };
