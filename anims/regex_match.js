import Regex from "../regex.js";
import Screen from "../screen.js";
import TextEdit from "../tools/text_edit.js";

const GS = {};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();

  const text = new TextEdit("", {...opts.editStyle});
  text.pivot.set(0, text.height / 2);
  text.position.set(500, 300);
  GS.screen.addChild(text);

  const sol = new Regex(opts.regex);
  const solDFA = sol.toNFA().toDFA().minimise();

  text.onEnter = () => {
    let r;
    try {
      r = new Regex(text.curText);
    } catch (e) {
      onFailure(e);
      return;
    }
    const comb = solDFA.combine(r.toNFA().toDFA(), (a, b) => !!a !== !!b);
    const word = comb.findAcceptingString();
    if (word === null) {
      onSuccess('Correct!');
      text.deactivate();
    } else {
      const accepts = solDFA.simulateWord(word) === "Accept";
      onFailure(`Incorrect. The word "${word}" should be ${accepts ? 'accepted' : 'rejected'}.`);
    }
  }
}

const unloader = () => {};

export default { loader, unloader };
