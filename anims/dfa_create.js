// TODO: Use tools/dfa_draw.js to allow drawing, add a "Check" button to the screen and then call
// GS.dfa.validate() when the button is pressed.
// As well as GS.dfa.checkWordArray

// In future, also implement the FA minimisation algorithm, and check the minimised FAs are the same.

import DFADraw from "../tools/dfa_draw.js";
import DFA from "../dfa.js";
import Screen from "../screen.js";
import { bg_dark, black } from "../colours.js";
import { mergeDeep } from "../utils.js";
import { FloatingButton } from "../ui.js";

const GS = {
  checkingDFA: new DFA(),
};

const check = () => {
  console.log(GS.opts);
  const hintDetails = GS.opts.hints.map((hint, i) => `<details><summary>Hint ${i + 1}</summary><p>${hint}</p></details>`).join('');
  if (GS.dfa.dfa.validate()) {
    GS.onFailure(`<div><p>Your DFA is not valid: ${GS.dfa.dfa.validate()}</p>${hintDetails}</div>`);
    return;
  }
  const word = GS.checkingDFA.combine(GS.dfa.dfa, (me, other) => me ^ other).findAcceptingString()
  const checkingAccepts = word !== null && GS.checkingDFA.simulateWord(word) === "Accept";
  if (word === null) {
    GS.onSuccess(`<div><p>You DFA is correct! One possible solution is the following:</p> <img src="${GS.opts.solution_image}" /></div>`);
  } else {
    GS.onFailure(`<div><p>Your DFA ${checkingAccepts ? 'rejects' : 'accepts'} the string "${word}", but it shouldn't.</p>${hintDetails}</div>`);
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

  const checkButton = new FloatingButton({
    label: {
      text: "Check",
    },
    bg: {
      fill: bg_dark,
    },
    width: 100,
    height: 50,
  });
  checkButton.position.set(GS.screen.gameWidth - 110, GS.screen.gameHeight - 10 - 50);
  checkButton.onClick = check;
  GS.screen.addChild(checkButton);
}

const unloader = () => {
  GS.dfa.unload();
}

export default { loader, unloader };
