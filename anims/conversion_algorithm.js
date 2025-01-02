import Screen from "../screen.js";
import DFADraw from "../tools/dfa_draw.js";
import { black, green, red, white } from "../colours.js";
import { FloatingButton } from "../ui.js";
import { TweenManager, ValueTween } from "../tween.js";
import NFA from "../nfa.js";
import Progress from "../tools/progress.js";

export const STATE_UNKNOWN = 'unknown';
export const STATE_EQUAL = 'equal';
export const STATE_NOT_EQUAL = 'not_equal';

export const GS = {
  screen: null,
  draws: [new DFADraw({ addChild: () => {}}, {})],
  scrollContainer: new PIXI.Container(),
  curIndex: 0,
  compareState: STATE_UNKNOWN,
  copyClicked: false,
  progress: new Progress([], {}),
  compareOriginal: false,
};

const addDraw = (prevNFA, index, container) => {
  const nfaContainer = new PIXI.Container();
  nfaContainer.position.set(index * 500, 0);
  GS.scrollContainer.addChild(nfaContainer);
  const nfaApp = Screen.fakeApp(nfaContainer, 500, 600);
  const nfaScreen = new Screen(nfaApp, true);
  nfaScreen.setScreenSize(500, 600);
  nfaScreen.setGameSize(500, 600);
  nfaScreen.scaleToFit();
  const draw = new DFADraw(nfaScreen, { alphabet: 'abc; ,()*|', maxLength: 40 });
  if (prevNFA) {
    draw.import(prevNFA.export());
  }
  GS.draws.push(draw);
  container.addChild(nfaContainer);

  const splitLine = new PIXI.Graphics();
  splitLine.moveTo(500, 0).lineTo(500, 600).stroke({ color: black, width: 3 });
  nfaContainer.addChild(splitLine);

  draw.onEdgeCreate = () => { setCompareState(STATE_UNKNOWN); }
  draw.onNodeCreate = () => { setCompareState(STATE_UNKNOWN); }
  draw.onEdgeDelete = () => { setCompareState(STATE_UNKNOWN); }
  draw.onNodeDelete = () => { setCompareState(STATE_UNKNOWN); }
  draw.onEdgeStateChange = () => { setCompareState(STATE_UNKNOWN); }
  draw.onNodeStateChange = () => { setCompareState(STATE_UNKNOWN); }
}

const moveIndex = (diff) => {
  GS.curIndex = GS.curIndex + diff;
  while (GS.curIndex >= GS.draws.length - 1) {
    addDraw(GS.draws[GS.draws.length - 1].dfa, GS.draws.length, GS.scrollContainer);
  }
  TweenManager.add(new ValueTween(GS.scrollContainer.pivot.x, GS.curIndex * 500, 30, GS.easings.easeInOutQuad, (v) => {
    GS.scrollContainer.pivot.set(v, 0);
  }))
  if (GS.curIndex === 0) {
    GS.prevButton.setDisabled(true);
  } else {
    GS.prevButton.setDisabled(false);
  }
}

const setCompareState = (state) => {
  GS.compareState = state;
  switch (state) {
    case STATE_UNKNOWN:
      GS.compareButton.label.text = "?";
      break;
    case STATE_EQUAL:
      GS.compareButton.label.text = "=";
      GS.compareButton.bg.tint = green;
      GS.compareButton.opts.bg.fill = green;
      break;
      case STATE_NOT_EQUAL:
        GS.compareButton.label.text = "!";
        GS.compareButton.bg.tint = red;
        GS.compareButton.opts.bg.fill = red;
      break;
  }
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;
  GS.easings = easings;
  GS.copyClicked = false;

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();

  GS.draws = [];
  GS.scrollContainer = new PIXI.Container();
  GS.screen.addChild(GS.scrollContainer);
  GS.curIndex = 0;
  const baseNFA = new NFA();
  baseNFA.import(opts.graph);
  addDraw(baseNFA, 0, GS.scrollContainer);
  addDraw(null, 1, GS.scrollContainer);

  GS.nextButton = new FloatingButton({
    label: {
      text: ">",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 50,
    height: 50,
  });
  GS.nextButton.position.set(500, 550);
  GS.screen.addChild(GS.nextButton);
  GS.nextButton.onClick = () => { moveIndex(1); GS.progress.checkCompleted(); }
  GS.prevButton = new FloatingButton({
    label: {
      text: "<",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 50,
    height: 50,
  });
  GS.prevButton.position.set(450, 550);
  GS.screen.addChild(GS.prevButton);
  GS.prevButton.setDisabled(true);
  GS.prevButton.onClick = () => { moveIndex(-1); GS.progress.checkCompleted(); }

  GS.compareButton = new FloatingButton({
    label: {
      text: "?",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 100,
    height: 50,
  })
  GS.compareButton.position.set(450, 500);
  GS.screen.addChild(GS.compareButton);
  GS.compareButton.onClick = () => {
    GS.compareButton.setDisabled(true);
    setTimeout(() => { try {
      // Check NFAs
      const dfa1 = GS.draws[GS.curIndex].dfa.export();
      const dfa2 = GS.draws[GS.curIndex + 1].dfa.export();
      const nfa1 = new NFA();
      nfa1.import(dfa1);
      const nfa2 = new NFA();
      nfa2.import(dfa2);
      const actual1 = nfa1.fromGNFAtoNFA().toDFA();
      const actual2 = nfa2.fromGNFAtoNFA().toDFA();
      const equal = actual1.equivalent(actual2);
      if (equal) {
        setCompareState(STATE_EQUAL);
        const original = new NFA();
        original.import(GS.opts.graph);
        const converted = original.fromGNFAtoNFA().toDFA();
        GS.compareOriginal = converted.equivalent(actual2);
      } else {
        setCompareState(STATE_NOT_EQUAL);
        const word = actual1.combine(actual2, (a, b) => !!a !== !!b).findAcceptingString();
        console.log(word, actual1.simulateWord(word), actual2.simulateWord(word));
        console.log(nfa1.export(), nfa2.export());
        console.log(nfa1.fromGNFAtoNFA().export(), nfa2.fromGNFAtoNFA().export());
        console.log(actual1.export(), actual2.export());
      }
      GS.compareButton.setDisabled(false);
      GS.progress.checkCompleted();
    } catch (e) {
      console.error(e);
      onFailure(`An error occurred: ${e.message}`);
    }
    }, 50);
  }

  GS.copyButton = new FloatingButton({
    label: {
      text: "Copy",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 100,
    height: 50,
  });
  GS.copyButton.position.set(450, 450);
  GS.screen.addChild(GS.copyButton);
  GS.copyButton.onClick = () => {
    const dfa = GS.draws[GS.curIndex].dfa.export();
    GS.draws[GS.curIndex + 1].import(dfa)
    GS.copyClicked = true;
    GS.progress.checkCompleted();
  }

  setCompareState(STATE_UNKNOWN);

  if (opts.progress) {
    GS.progress = new Progress(opts.progress.instructions, {...opts.progress, onSuccess: () => onSuccess('You successfully converted between Regex and NFA!') }, GS);
  }
}

const unloader = () => {}


export default { loader, unloader };
