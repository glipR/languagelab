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
import NFA from "../nfa.js";

const GS = {
  checkingDFA: new DFA(),
};

const check = () => {
  GS.checkButton.setDisabled(true);

  // Put the rest of this behind a timeout to allow the button to update
  const checkTimeout = () => {

  const hintDetails = GS.opts.hints.map((hint, i) => `<details><summary>Hint ${i + 1}</summary><p>${hint}</p></details>`).join('');
  if (Object.values(GS.dfa.dfa.nodes).length === 0) {
    GS.onFailure(`<div><p>Your NFA doesn't have any states!</p>${hintDetails}</div>`);
    GS.checkButton.setDisabled(false);
    return;
  }
  // invalid dfa->nfa->valid dfa
  const nfa = new NFA();
  nfa.fromJSON(GS.dfa.dfa.toJSON());
  const comparedDFA = nfa.toDFA();
  const word = GS.checkingDFA.combine(comparedDFA, (me, other) => me ^ other).findAcceptingString()
  const checkingAccepts = word !== null && GS.checkingDFA.simulateWord(word) === "Accept";
  if (word === null) {
    GS.onSuccess(`<div><p>You NFA is correct! One possible solution is the following:</p> <img src="${GS.opts.solution_image}" /></div>`);
  } else {
    GS.onFailure(`<div><p>Your NFA ${checkingAccepts ? 'rejects' : 'accepts'} the string "${word}", but it shouldn't.</p>${hintDetails}</div>`);
  }
  GS.checkButton.setDisabled(false);

  }

  setTimeout(checkTimeout, 20);
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

  const checkNFA = new NFA();
  checkNFA.fromJSON(opts.checkingNFA);
  GS.checkingDFA = checkNFA.toDFA();

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

  GS.checkButton = new FloatingButton({
    label: {
      text: "Check",
    },
    bg: {
      fill: bg_dark,
    },
    width: 100,
    height: 50,
  });
  GS.checkButton.position.set(GS.screen.gameWidth - 110, GS.screen.gameHeight - 10 - 50);
  GS.checkButton.onClick = check;
  GS.screen.addChild(GS.checkButton);
}

const unloader = () => {
  GS.dfa.unload();
}

export default { loader, unloader };
