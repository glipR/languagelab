import { black, blue, green, orange, red, white, yellow } from "../colours.js";
import DFA from "../dfa.js";
import Screen from "../screen.js";
import { FloatingButton } from "../ui.js";
import TextEdit from "../tools/text_edit.js";
import TextChanger from "../tools/change_text.js";
import { delay, TweenManager, ValueTween } from "../tween.js";
import { Highlight } from "./regex_intro.js";
import { RectangleCover } from "../tools/paper_cover.js";

export const MENU_PLAYER_PICK = "PLAYER_PICK";
export const MENU_SUMMARY = "SUMMARY";
export const MENU_CHOOSE_N = "CHOOSE_N";
export const MENU_CHOOSE_WORD = "CHOOSE_WORD";
export const MENU_CHOOSE_SELECTION = "CHOOSE_SELECTION";
export const MENU_CHOOSE_I = "CHOOSE_I";
export const MENU_RESULT = "RESULT";

// TODO: Use the summary screen to show moves as they are made, animate them, and then have a button to continue.

const gsc = window.gameScaling ?? 1;
export const GS = {
  gameAccept: null,
  nValue: null,
  word: null,
  selection: null,
  i: null,
  description: "",

  player1CPU: false,
  player2CPU: false,

  curState: MENU_PLAYER_PICK,
  screenContainers: {
    [MENU_PLAYER_PICK]: new PIXI.Container(),
    [MENU_SUMMARY]: new PIXI.Container(),
    [MENU_CHOOSE_N]: new PIXI.Container(),
    [MENU_CHOOSE_WORD]: new PIXI.Container(),
    [MENU_CHOOSE_SELECTION]: new PIXI.Container(),
    [MENU_CHOOSE_I]: new PIXI.Container(),
    [MENU_RESULT]: new PIXI.Container(),
  },

  shownN: false,
  shownWord: false,
  shownSelection: false,
  shownI: false,
};
window.GS = GS;

const baseStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};

const resetGame = () => {
  GS.nValue = null;
  GS.word = null;
  GS.selection = null;
  GS.i = null;

  Object.values(GS.screenContainers).forEach(c => {
    GS.screen.addChild(c);
    c.removeChildren();
    c.visible = false;
    c.build?.();
  });

  GS.curState = MENU_PLAYER_PICK;
  showScreen(GS.curState);
}

const showScreen = (state) => {
  GS.curState = state;
  Object.keys(GS.screenContainers).forEach(k => {
    if (k === state.toString()) {
      GS.screenContainers[k].visible = true;
      GS.screenContainers[k].onStart?.();
    } else {
      GS.screenContainers[k].visible = false;
      GS.screenContainers[k].onEnd?.();
    }
  })
}

const setAcceptDFA = (dfa) => {
  const dfaOBJ = new DFA();
  dfaOBJ.import(dfa);
  GS.gameAccept = (word) => dfaOBJ.simulateWord(word) === "Accept";
}

const startGame = () => {
  if (GS.player1CPU) {
    setN(GS.opts.n);
  } else {
    showScreen(MENU_CHOOSE_N);
  }
}

const setN = (value) => {
  if (value <= 0) {
    alert("Invalid n - must be positive.");
    return;
  }
  if (value >= 10) {
    alert("Invalid n - must be less than 10 (Just for this version of the game, not for the pumping lemma in general).");
    return;
  }
  GS.nValue = value;
  if (GS.player2CPU) {
    // Auto select word.
    setWord(GS.opts.wordSelector(value));
  } else {
    GS.nextScreen = MENU_CHOOSE_WORD;
    showScreen(MENU_SUMMARY);
  }
}
GS.setN = setN;

const setWord = (word) => {
  if (!GS.gameAccept(word)) {
    alert("Invalid word - does not belong to the language.");
    return;
  }
  if (word.length <= GS.nValue) {
    alert("Word is too short. Needs to be longer than n.");
    return;
  }
  GS.word = word;
  if (GS.player1CPU) {
    // Auto select selection.
    for (let a1 = 0; a1 < GS.nValue; a1++) {
      for (let b1 = a1+1; b1 <= GS.nValue; b1++) {
        const start = word.slice(0, a1);
        const selection = word.slice(a1, b1);
        const end = word.slice(b1);
        let bad = false;
        for (let i=0; i<10; i++) {
          if (!GS.gameAccept(start + selection.repeat(i) + end)) {
            bad = true;
            break;
          }
        }
        if (!bad) {
          setSelection(a1, b1);
          return;
        }
      }
    }
    const a1 = Math.floor(Math.random() * GS.nValue);
    const b1 = a1 + 1 + Math.floor(Math.random() * (GS.nValue - a1));
    setSelection(a1, b1);
  } else {
    GS.nextScreen = MENU_CHOOSE_SELECTION;
    showScreen(MENU_SUMMARY);
  }
}
GS.setWord = setWord;

const setSelection = (a, b) => {
  if (b > GS.nValue) {
    alert("Invalid selection - your selection must be over the first n characters at most.");
    return;
  }
  GS.selection = { a, b };
  if (GS.player2CPU) {
    // Auto select i.
    for (let i=0; i<10; i++) {
      if (!GS.gameAccept(GS.word.slice(0, a) + GS.word.slice(a, b).repeat(i) + GS.word.slice(b))) {
        setI(i);
        return;
      }
    }
    setI(Math.floor(Math.random() * 4));
  } else {
    GS.nextScreen = MENU_CHOOSE_I;
    showScreen(MENU_SUMMARY);
  }
}
GS.setSelection = setSelection;

const setI = (i) => {
  GS.i = i;
  GS.nextScreen = MENU_RESULT;
  showScreen(MENU_SUMMARY);
}
GS.setI = setI;

const addDescription = (container) => {
  const description = new PIXI.Text({
    text: GS.description,
    style: {...baseStyle},
  });
  description.anchor.set(0.5, 0.5);
  description.position.set(500 * gsc, 50 * gsc);
  container.addChild(description);
}

GS.screenContainers[MENU_PLAYER_PICK].build = () => {

  addDescription(GS.screenContainers[MENU_PLAYER_PICK]);

  const regularButton = new FloatingButton({
    label: {
      text: "Regular (I can find the loop!)",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 400 * gsc,
    height: 200 * gsc,
  });
  regularButton.position.set(50 * gsc, 200 * gsc);
  GS.screenContainers[MENU_PLAYER_PICK].addChild(regularButton);

  const irregularButton = new FloatingButton({
    label: {
      text: "Irregular (I can find the word!)",
      fill: white,
    },
    bg: {
      fill: red,
    },
    width: 400 * gsc,
    height: 200 * gsc,
  });
  irregularButton.position.set(550 * gsc, 200 * gsc);
  GS.screenContainers[MENU_PLAYER_PICK].addChild(irregularButton);

  regularButton.onClick = () => {
    GS.player1CPU = false;
    GS.player2CPU = true;
    startGame();
  }
  irregularButton.onClick = () => {
    GS.player1CPU = true;
    GS.player2CPU = false;
    startGame();
  }
}

GS.screenContainers[MENU_CHOOSE_N].build = () => {

  addDescription(GS.screenContainers[MENU_CHOOSE_N]);

  const nInput = new TextEdit('0', {
    allowedChars: "0123456789",
  });
  nInput.position.set(500 * gsc, 300 * gsc);
  GS.screenContainers[MENU_CHOOSE_N].addChild(nInput);

  GS.screenContainers[MENU_CHOOSE_N].onStart = () => {
    nInput.activate();
  }
  GS.screenContainers[MENU_CHOOSE_N].onEnd = () => {
    nInput.deactivate();
  }

  const enterText = new PIXI.Text({
    text: "Enter n below, then press Enter.",
    style: {...baseStyle},
  });
  enterText.anchor.set(0.5, 0.5);
  enterText.position.set(500 * gsc, 200 * gsc);
  GS.screenContainers[MENU_CHOOSE_N].addChild(enterText);

  const enterButton = new FloatingButton({
    label: {
      text: "Enter",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 200 * gsc,
    height: 100 * gsc,
  });
  enterButton.position.set(400 * gsc, 400 * gsc);
  GS.screenContainers[MENU_CHOOSE_N].addChild(enterButton);

  const onEnter = () => {
    setN(parseInt(nInput.curText));
  }

  nInput.onEnter = onEnter;
  enterButton.onClick = onEnter;
}

GS.screenContainers[MENU_CHOOSE_WORD].build = () => {
  addDescription(GS.screenContainers[MENU_CHOOSE_WORD]);

  const wordInput = new TextEdit('', {
    allowedChars: "abcd0123456789",
  });
  wordInput.position.set(500 * gsc, 300 * gsc);
  GS.screenContainers[MENU_CHOOSE_WORD].addChild(wordInput);

  const enterText = new PIXI.Text({
    text: `Enter word with more than ${GS.nValue} characters below, then press Enter.`,
    style: {...baseStyle},
  });
  enterText.anchor.set(0.5, 0.5);
  enterText.position.set(500 * gsc, 200 * gsc);
  GS.screenContainers[MENU_CHOOSE_WORD].addChild(enterText);

  const enterButton = new FloatingButton({
    label: {
      text: "Enter",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 200 * gsc,
    height: 100 * gsc,
  });
  enterButton.position.set(400 * gsc, 400 * gsc);
  GS.screenContainers[MENU_CHOOSE_WORD].addChild(enterButton);

  GS.screenContainers[MENU_CHOOSE_WORD].onStart = () => {
    wordInput.activate();
    enterText.text = `Enter word with more than ${GS.nValue} characters below, then press Enter.`;
  }
  GS.screenContainers[MENU_CHOOSE_WORD].onEnd = () => {
    wordInput.deactivate();
  }

  const onEnter = () => {
    setWord(wordInput.curText);
  }
  wordInput.onEnter = onEnter;
  enterButton.onClick = onEnter;

}

GS.screenContainers[MENU_CHOOSE_SELECTION].build = () => {
  addDescription(GS.screenContainers[MENU_CHOOSE_SELECTION]);

  const instructions = new PIXI.Text({
    text: `Drag on the word below to select the substring you think can loop.`,
    style: {...baseStyle},
  });
  instructions.anchor.set(0.5, 0.5);
  instructions.position.set(500 * gsc, 200 * gsc);
  GS.screenContainers[MENU_CHOOSE_SELECTION].addChild(instructions);

  const wordText = new TextChanger(GS.word || '', {
    tweenDuration: 0,
    moveDelay: 0,
    insertDelay: 0,
    deleteDelay: 0,
  });
  wordText.position.set(500 * gsc, 300 * gsc);
  GS.screenContainers[MENU_CHOOSE_SELECTION].addChild(wordText);

  const wordHighlight = new Highlight({ color: yellow });
  wordText.addChild(wordHighlight);

  const enterButton = new FloatingButton({
    label: {
      text: "Enter",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 200 * gsc,
    height: 100 * gsc,
  });
  enterButton.position.set(400 * gsc, 400 * gsc);
  GS.screenContainers[MENU_CHOOSE_SELECTION].addChild(enterButton);

  const curSelectionInfo = {
    mouseDownVal: -1,
    mouseMoveVal: -1,
  }
  const reRenderHighlight = () => {
    const minVal = Math.min(curSelectionInfo.mouseDownVal, curSelectionInfo.mouseMoveVal);
    const maxVal = Math.max(curSelectionInfo.mouseDownVal, curSelectionInfo.mouseMoveVal);
    if (minVal < 0) {
      wordHighlight.visible = false;
      return;
    } else {
      wordHighlight.visible = true;
    }
    const startTransform = wordText.transform(GS.word, minVal);
    const endTransform = wordText.transform(GS.word, maxVal);
    wordHighlight.setConfig(startTransform, endTransform);
  }

  const getHoveredIndex = (p) => {
    for (let i=0; i<GS.word.length; i++) {
      const t = wordText.transform(GS.word, i);
      const t2 = wordText.transform(GS.word, i+1);
      if (t.x <= p.x && p.x < t2.x) {
        return i;
      }
    }
    return -1;
  }

  let dragging = false;

  wordText.interactive = true;
  wordText.on('pointerdown', (e) => {
    dragging = true;
    const p = wordText.toLocal(e.data.global);
    const index = getHoveredIndex(p);
    if (index === -1) {
      return;
    }
    curSelectionInfo.mouseDownVal = index;
    curSelectionInfo.mouseMoveVal = index;
    reRenderHighlight();
  });
  wordText.on('pointermove', (e) => {
    if (!dragging) {
      return;
    }
    const p = wordText.toLocal(e.data.global);
    const index = getHoveredIndex(p);
    if (index === -1) {
      return;
    }
    curSelectionInfo.mouseMoveVal = index;
    reRenderHighlight();
  });
  document.addEventListener('pointerup', (e) => {
    dragging = false;
  });

  GS.screenContainers[MENU_CHOOSE_SELECTION].onStart = () => {
    const tween = wordText.changeText(GS.word);
    TweenManager.add(tween);

    reRenderHighlight();
    dragging = false;
  }

  const onEnter = () => {
    setSelection(Math.min(curSelectionInfo.mouseDownVal, curSelectionInfo.mouseMoveVal), Math.max(curSelectionInfo.mouseDownVal, curSelectionInfo.mouseMoveVal)+1);
  }
  enterButton.onClick = onEnter;

}

GS.screenContainers[MENU_CHOOSE_I].build = () => {
  addDescription(GS.screenContainers[MENU_CHOOSE_I]);

  const instructions = new PIXI.Text({
    text: `Enter a value to repeat the substring, i, from 0-10.`,
    style: {...baseStyle},
  });
  instructions.anchor.set(0.5, 0.5);
  instructions.position.set(500 * gsc, 150 * gsc);
  GS.screenContainers[MENU_CHOOSE_I].addChild(instructions);

  const selection = new TextChanger(GS.word ?? '', {
    tweenDuration: 0,
    moveDelay: 0,
    insertDelay: 0,
    deleteDelay: 0,
  });
  selection.position.set(500 * gsc, 225 * gsc);
  GS.screenContainers[MENU_CHOOSE_I].addChild(selection);
  const highlight = new Highlight({ color: yellow });
  selection.addChild(highlight);

  const iText = new TextEdit('0', {
    allowedChars: "0123456789",
  });
  iText.position.set(500 * gsc, 300 * gsc);
  GS.screenContainers[MENU_CHOOSE_I].addChild(iText);

  const enterButton = new FloatingButton({
    label: {
      text: "Enter",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 200 * gsc,
    height: 100 * gsc,
  });
  enterButton.position.set(400 * gsc, 400 * gsc);
  GS.screenContainers[MENU_CHOOSE_I].addChild(enterButton);

  GS.screenContainers[MENU_CHOOSE_I].onStart = () => {
    iText.activate();
    const tween = selection.changeText(GS.word);
    TweenManager.add(tween);

    highlight.visible = true;
    const startTransform = selection.transform(GS.word, GS.selection.a);
    const endTransform = selection.transform(GS.word, GS.selection.b-1);

    highlight.setConfig(startTransform, endTransform);
  }
  GS.screenContainers[MENU_CHOOSE_I].onEnd = () => {
    iText.deactivate();
  }

  const onEnter = () => {
    setI(parseInt(iText.curText));
  }
  iText.onEnter = onEnter;
  enterButton.onClick = onEnter;
}

GS.screenContainers[MENU_RESULT].build = () => {
  addDescription(GS.screenContainers[MENU_RESULT]);

  const lines = () => {
    const accept = GS.gameAccept(GS.word.slice(0, GS.selection.a) + GS.word.slice(GS.selection.a, GS.selection.b).repeat(GS.i) + GS.word.slice(GS.selection.b));
    const expected = (GS.opts.type === "Regular") === accept;
    return [
      `The word ${GS.word} was broken down into`,
      `${GS.word.slice(0, GS.selection.a)}(${GS.word.slice(GS.selection.a, GS.selection.b)})^${GS.i}${GS.word.slice(GS.selection.b)}`,
      `This word ${accept ? "is" : "is not"} in the language.`,
      ``,
      `Player ${accept ? 1 : 2} wins!`,
      `${expected ? 'This is expected, because' : "However, this isn't the expected result, because"} the language is ${GS.opts.type}.`
    ]
  }

  const textContainer = new PIXI.Container();
  const texts = Array.from({ length: 6 }, (_, i) => {
    const text = new PIXI.Text({
      text: '',
      style: {...baseStyle},
    });
    text.anchor.set(0.5, 0.5);
    text.position.set(0, i * 50 * gsc);
    textContainer.addChild(text);
    return text;
  });
  textContainer.position.set(500 * gsc, 100 * gsc);
  GS.screenContainers[MENU_RESULT].addChild(textContainer);

  const playButton = new FloatingButton({
    label: {
      text: "Play Again",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 200 * gsc,
    height: 100 * gsc,
  });
  playButton.position.set(400 * gsc, 400 * gsc);
  GS.screenContainers[MENU_RESULT].addChild(playButton);

  playButton.onClick = () => {
    resetGame();
  }

  GS.screenContainers[MENU_RESULT].onStart = () => {
    lines().forEach((line, i) => {
      texts[i].text = line;
    });

    const accept = GS.gameAccept(GS.word.slice(0, GS.selection.a) + GS.word.slice(GS.selection.a, GS.selection.b).repeat(GS.i) + GS.word.slice(GS.selection.b));
    const expected = (GS.opts.type === "Regular") === accept;
    // If accepting - we expect player 1 to the be player
    // Otherwise - we expect player 2 to be the player.
    const playerWon = expected && (accept === GS.player2CPU);
    playButton.visible = !playerWon;
    if (playerWon) {
      setTimeout(() => {
        GS.onSuccess?.('You correctly chose the role, and played the game to perfection!');
      }, 1500);
    }
  }
}

GS.screenContainers[MENU_SUMMARY].build = () => {
  GS.shownN = false;
  GS.shownWord = false;
  GS.shownSelection = false;
  GS.shownI = false;

  addDescription(GS.screenContainers[MENU_SUMMARY]);

  const nSelection = () => (
    `Player 1 chose n = ${GS.nValue}.`
  );
  const wordSelection = () => (
    `Player 2 chose the word '${GS.word}'.`
  )
  const selectionSelection = () => (
    `Player 1 separated the word into x = '${GS.word.slice(0, GS.selection.a)}', y = '${GS.word.slice(GS.selection.a, GS.selection.b)}', z = '${GS.word.slice(GS.selection.b)}'.`
  )
  const iSelection = () => (
    `Player 2 chose i = ${GS.i}.`
  );
  const nText = new PIXI.Text({
    text: '',
    style: {...baseStyle, fill: blue},
  });
  nText.anchor.set(0, 0.5);
  GS.screenContainers[MENU_SUMMARY].addChild(nText);
  const wordText = new PIXI.Text({
    text: '',
    style: {...baseStyle, fill: orange},
  });
  wordText.anchor.set(1, 0.5);
  GS.screenContainers[MENU_SUMMARY].addChild(wordText);
  const selectionText = new PIXI.Text({
    text: '',
    style: {...baseStyle, fill: blue},
  });
  selectionText.anchor.set(0, 0.5);
  GS.screenContainers[MENU_SUMMARY].addChild(selectionText);
  const iText = new PIXI.Text({
    text: '',
    style: {...baseStyle, fill: orange},
  });
  iText.anchor.set(1, 0.5);
  GS.screenContainers[MENU_SUMMARY].addChild(iText);

  GS.screenContainers[MENU_SUMMARY].onStart = () => {
    const tween = delay(0);
    if (!GS.shownN && GS.nValue !== null) {
      nText.text = nSelection();
      const cover = new RectangleCover(nText, { points: 20, randMult: 0.1});
      cover.visible = false;
      nText.visible = false;
      GS.screenContainers[MENU_SUMMARY].addChildAt(cover, 0);
      tween.then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
        nText.position.set(50 * gsc - (nText.width + 50 * gsc) * (1 - v), 150 * gsc)
        cover.position.set(nText.position.x + nText.width / 2, nText.position.y);
      }, () => { cover.visible = true; nText.visible = true; }));
      GS.shownN = true;
    }
    if (!GS.shownWord && GS.word !== null) {
      wordText.text = wordSelection();
      const cover = new RectangleCover(wordText, { points: 20, randMult: 0.1});
      cover.visible = false;
      wordText.visible = false;
      GS.screenContainers[MENU_SUMMARY].addChildAt(cover, 0);
      tween.then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
        wordText.position.set(950 * gsc + (nText.width + 50 * gsc) * (1 - v), 200 * gsc)
        cover.position.set(wordText.position.x - wordText.width / 2, wordText.position.y);
      }, () => { cover.visible = true; wordText.visible = true; }));
      GS.shownWord = true;
    }
    if (!GS.shownSelection && GS.selection !== null) {
      selectionText.text = selectionSelection();
      const cover = new RectangleCover(selectionText, { points: 20, randMult: 0.1});
      cover.visible = false;
      selectionText.visible = false;
      GS.screenContainers[MENU_SUMMARY].addChildAt(cover, 0);
      tween.then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
        selectionText.position.set(50 * gsc - (selectionText.width + 50 * gsc) * (1 - v), 250 * gsc)
        cover.position.set(selectionText.position.x + selectionText.width / 2, selectionText.position.y);
      }, () => { cover.visible = true; selectionText.visible = true; }));
      GS.shownSelection = true;
    }
    if (!GS.shownI && GS.i !== null) {
      iText.text = iSelection();
      const cover = new RectangleCover(iText, { points: 20, randMult: 0.1});
      cover.visible = false;
      iText.visible = false;
      GS.screenContainers[MENU_SUMMARY].addChildAt(cover, 0);
      tween.then(new ValueTween(0, 1, 60, GS.easings.easeInOutQuad, (v) => {
        iText.position.set(950 * gsc + (iText.width + 50 * gsc) * (1 - v), 300 * gsc)
        cover.position.set(iText.position.x - iText.width / 2, iText.position.y);
      }, () => { cover.visible = true; iText.visible = true; }));
      GS.shownI = true;
    }
    TweenManager.add(tween);
  }

  const nextButton = new FloatingButton({
    label: {
      text: "Next",
      fill: white,
    },
    bg: {
      fill: green,
    },
    width: 200 * gsc,
    height: 100 * gsc,
  });
  nextButton.position.set(400 * gsc, 400 * gsc);
  GS.screenContainers[MENU_SUMMARY].addChild(nextButton);
  nextButton.onClick = () => {
    showScreen(GS.nextScreen)
  }

}

const loader = (app, easings, onSuccess, onFailure, opts) => {

  GS.opts = opts;
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;

  GS.description = opts.description;
  if (opts.type === "Regular") {
    setAcceptDFA(opts.dfa);
  } else {
    GS.gameAccept = opts.acceptor;
  }

  GS.player2CPU = true;
  resetGame();
  // startGame();

}

const unloader = () => {}

export default { loader, unloader }