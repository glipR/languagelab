import Screen from "../screen.js";
import Regex from "../regex.js";
import DFA from "../dfa.js";
import { FloatingButton } from "../ui.js";
import { bg, bg_dark, black, green, red } from "../colours.js";
import TextEdit from "../tools/text_edit.js";
import { RectangleCover } from "../tools/paper_cover.js";
import TextChanger from "../tools/change_text.js";
import { TweenManager } from "../tween.js";
import Progress from "../tools/progress.js";

const gsc = window.gameScaling ?? 1;

const [
  STATE_MENU,
  STATE_CODEMASTER_ENTER,
  STATE_SLEUTH_GUESS,
  STATE_CODE_WAIT,
  STATE_CODE_DISTINGUISH,
] = [0, 1, 2, 3, 4];

const baseTextStyle = {
  fontFamily: "Ittybittynotebook",
  fontSize: 32 * gsc,
  fill: black,
  align: 'center',
};
const baseButtonOpts = {
  width: 150 * gsc,
  height: 75 * gsc,
}

const guessRegex = [
  ...Regex.generateAllOfLength(12, ['a', 'b', 'c'], 0.7),
  ...Regex.generateAllOfLength(11, ['a', 'b', 'c'], 0.7),
  ...Regex.generateAllOfLength(10, ['a', 'b', 'c'], 0.7),
  ...Regex.generateAllOfLength(9, ['a', 'b', 'c'], 0.6),
  ...Regex.generateAllOfLength(8, ['a', 'b', 'c'], 0.6),
  ...Regex.generateAllOfLength(7, ['a', 'b', 'c'], 0.6),
  ...Regex.generateAllOfLength(6, ['a', 'b', 'c'], 0.5),
  ...Regex.generateAllOfLength(5, ['a', 'b', 'c'], 0.5),
  ...Regex.generateAllOfLength(4, ['a', 'b', 'c'], 0.5),
  ...Regex.generateAllOfLength(3, ['a', 'b', 'c'], 0.4),
  ...Regex.generateAllOfLength(2, ['a', 'b', 'c'], 0.4),
  ...Regex.generateAllOfLength(1, ['a', 'b', 'c'], 0.4),
];

const GS = {
  curState: STATE_MENU,
  dragging: null,
  // TODO: Change default.
  codeMasterCPU: false,
  sleuthCPU: false,
  codeRegex: new Regex(''),
  codeRegexDFA: new DFA(),

  games: JSON.parse(localStorage.getItem('regexGames') || '[]'),
  progress: new Progress([], {}),

  sleuthGuesses: [],
  codeWordDistinguishes: [],
  possibleDistinguishCurrent: null,
  cpuPossibleRegex: [{
    regex: new Regex(guessRegex[0]),
    dfa: new Regex(guessRegex[0]).toNFA().toDFA(),
  }],

  screenContainers: {
    [STATE_MENU]: new PIXI.Container(),
    [STATE_CODEMASTER_ENTER]: new PIXI.Container(),
    [STATE_SLEUTH_GUESS]: new PIXI.Container(),
    [STATE_CODE_WAIT]: new PIXI.Container(),
    [STATE_CODE_DISTINGUISH]: new PIXI.Container(),
  }
};

const addGame = () => {
  GS.games.push({
    codeMasterCPU: GS.codeMasterCPU,
    sleuthCPU: GS.sleuthCPU,
    codeRegex: GS.codeRegex.s,
    sleuthGuesses: GS.sleuthGuesses.map(r => r.s),
    codeWordDistinguishes: GS.codeWordDistinguishes,
  });
  localStorage.setItem('regexGames', JSON.stringify(GS.games));
  GS.progress.checkCompleted();
}

const setCodeRegex = async (regexString) => {
  GS.codeRegex = new Regex(regexString);
  GS.codeRegexDFA = GS.codeRegex.toNFA().toDFA().minimise();

  if (GS.sleuthCPU) {
    const warning = "Generating a bank of guesses for the CPU, please give it ~5 seconds and don't click anything until the next screen shows!";
    document.getElementById("warningModal").querySelector('p.warningMsg').innerHTML = warning;
    document.getElementById("warningModal").style.display = "block";

    // Wait a bit for the modal to appear.
    await new Promise((resolve) => setTimeout(resolve, 200)).then(() => {
      GS.cpuPossibleRegex = [...guessRegex, regexString].map(r => ({
        regex: new Regex(r),
        dfa: new Regex(r).toNFA().toDFA(),
      }));
    });
  }
}

const setSleuthGuessLatest = (regexString) => {
  const r = new Regex(regexString);
  GS.sleuthGuesses.push(r);
  const dfa = r.toNFA().toDFA();
  // Prefer possible distinguishes that are positive (accepting for the target regex)
  // This makes it much easier when playing against with a codemaster cpu.
  const normal = dfa.combine(GS.codeRegexDFA, (a, b) => !!a !== !!b).findAcceptingString();
  const forceAccept = dfa.combine(GS.codeRegexDFA, (a, b) => !a && !!b).findAcceptingString();
  if (forceAccept !== null && Math.random() > 0.7) {
    GS.possibleDistinguishCurrent = forceAccept;
  } else {
    GS.possibleDistinguishCurrent = normal;
  }
}

const validate = (regexString) => {
  try {
    const r = new Regex(regexString);
  } catch (e) {
    return e;
  }
  return null;
}

const startGame = () => {
    if (!GS.codeMasterCPU) {
    GS.curState = STATE_CODEMASTER_ENTER;
    showScreen(GS.curState);
  } else {
    // Generate a Codemaster regex.
    const possible = guessRegex.filter((regex) => {
      // Ensure that we don't just have a long string of characters.
      const specialChars = regex.replaceAll(/[a-c]/g, '').length;
      // At least some special chars and at most 6 chars.
      return specialChars > 0 && (regex.length - specialChars < 7);
    });
    const r = possible[Math.floor(Math.random() * possible.length)];
    setCodeRegex(r);
    afterCodeMasterEnter();
  }
}

const afterCodeMasterEnter = () => {
  if (!GS.sleuthCPU) {
    GS.curState = STATE_SLEUTH_GUESS;
    showScreen(GS.curState);
  } else {
    // Generate a Sleuth guess.
    const r = GS.cpuPossibleRegex[Math.floor(Math.random() * GS.cpuPossibleRegex.length)];
    setSleuthGuessLatest(r.regex.s);
    afterSleuthGuess();
  }
}

const afterSleuthGuess = () => {
  if (!GS.codeMasterCPU) {
    if (GS.sleuthCPU) {
      // No need to wait
      GS.curState = STATE_CODE_DISTINGUISH;
      showScreen(GS.curState);
    } else {
      GS.curState = STATE_CODE_WAIT;
      showScreen(GS.curState);
    }
  } else {
    if (GS.possibleDistinguishCurrent === null) {
      alert('You correctly guessed the regex!');
      addGame();
      resetGame();
    }
    else {
      // Generate a Codemaster distinguish.
      GS.codeWordDistinguishes.push(GS.possibleDistinguishCurrent);
      afterCodeWordDistinguished();
    }
  }
}

const afterCodeWordDistinguished = () => {
  if (!GS.sleuthCPU) {
    GS.curState = STATE_SLEUTH_GUESS;
    showScreen(GS.curState);
  } else {
    // Filter down the possible regexes.
    const word = GS.codeWordDistinguishes[GS.codeWordDistinguishes.length - 1];
    const accepts = GS.codeRegexDFA.simulateWord(word) == "Accept";
    GS.cpuPossibleRegex = GS.cpuPossibleRegex.filter(({dfa}) => accepts === (dfa.simulateWord(word) == "Accept"));
    // Generate a Sleuth guess.
    const r = GS.cpuPossibleRegex[Math.floor(Math.random() * GS.cpuPossibleRegex.length)];
    setSleuthGuessLatest(r.regex.s);
    afterSleuthGuess();
  }
}

const resetGame = () => {
  GS.codeRegex = new Regex('');
  GS.codeRegexDFA = new DFA();
  GS.sleuthGuesses = [];
  GS.codeWordDistinguishes = [];
  GS.possibleDistinguishCurrent = null;

  Object.values(GS.screenContainers).forEach(c => {
    GS.screen.addChild(c);
    c.removeChildren();
    c.visible = false;
  });

  // Set up screens
  buildScreenMenu();
  buildScreenCodeMasterEnter();
  buildScreenSleuthGuess();
  buildScreenWait();
  buildScreenDistinguish();

  GS.curState = STATE_MENU;
  showScreen(GS.curState);
}

const showScreen = (state) => {
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

const buildScreenMenu = () => {
  GS.screenContainers[STATE_MENU].removeChildren();
  // BUTTONS + HEADERS
  const codeMasterCPUButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "CPU" },
    bg: { fill: GS.codeMasterCPU ? green : red }
  })
  codeMasterCPUButton.position.set(100 * gsc, 300 * gsc);
  const codeMasterPlayerButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Player" },
    bg: { fill: GS.codeMasterCPU ? red : green }
  });
  codeMasterPlayerButton.position.set(100 * gsc, 400 * gsc);
  const codeMasterHeader = new PIXI.Text({ text: "CodeMaster", style: {
    ...baseTextStyle,
  }});
  codeMasterHeader.anchor.set(0.5, 0.5);
  codeMasterHeader.position.set(175 * gsc, 200 * gsc);
  const sleuthCPUButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "CPU" },
    bg: { fill: GS.sleuthCPU ? green : red }
  })
  sleuthCPUButton.position.set(750 * gsc, 300 * gsc);
  const sleuthPlayerButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Player" },
    bg: { fill: GS.sleuthCPU ? red : green }
  });
  sleuthPlayerButton.position.set(750 * gsc, 400 * gsc);
  const sleuthHeader = new PIXI.Text({ text: "Sleuth", style: {
    ...baseTextStyle,
  }});
  sleuthHeader.anchor.set(0.5, 0.5);
  sleuthHeader.position.set(825 * gsc, 200 * gsc);

  const playGame = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Play" },
    bg: { fill: bg_dark }
  });
  playGame.position.set(425 * gsc, 250 * gsc);
  GS.screenContainers[STATE_MENU].addChild(codeMasterCPUButton);
  GS.screenContainers[STATE_MENU].addChild(codeMasterPlayerButton);
  GS.screenContainers[STATE_MENU].addChild(codeMasterHeader);
  GS.screenContainers[STATE_MENU].addChild(sleuthCPUButton);
  GS.screenContainers[STATE_MENU].addChild(sleuthPlayerButton);
  GS.screenContainers[STATE_MENU].addChild(sleuthHeader);
  GS.screenContainers[STATE_MENU].addChild(playGame);

  // CLICK LOGIC
  codeMasterCPUButton.onClick = () => {
    GS.codeMasterCPU = true;
    buildScreenMenu();
  };
  codeMasterPlayerButton.onClick = () => {
    GS.codeMasterCPU = false;
    buildScreenMenu();
  };
  sleuthCPUButton.onClick = () => {
    GS.sleuthCPU = true;
    buildScreenMenu();
  };
  sleuthPlayerButton.onClick = () => {
    GS.sleuthCPU = false;
    buildScreenMenu();
  };
  playGame.onClick = () => {
    if (GS.sleuthCPU && GS.codeMasterCPU) {
      alert('You need at least one player!');
    } else {
      startGame();
    }
  };

}

const buildScreenCodeMasterEnter = () => {
  GS.screenContainers[STATE_CODEMASTER_ENTER].removeChildren();

  const header = new PIXI.Text({ text: "Enter your regex:", style: {
    ...baseTextStyle,
  }});
  header.anchor.set(0.5, 0.5);
  header.position.set(500 * gsc, 100 * gsc);
  GS.screenContainers[STATE_CODEMASTER_ENTER].addChild(header);

  const input = new TextEdit('a*(b|c)*', {
    allowedChars: ['a', 'b', 'c', '*', '|', '(', ')'],
    maxLength: 12,
  });
  input.pivot.set(0, input.height / 2);
  input.position.set(500 * gsc, 300 * gsc);
  input.deactivate();
  const inputCover = new RectangleCover(input, { width: 250, points: 20, randMult: 0.1 });
  inputCover.position.set(500 * gsc, 300 * gsc);
  GS.screenContainers[STATE_CODEMASTER_ENTER].addChild(inputCover);
  GS.screenContainers[STATE_CODEMASTER_ENTER].addChild(input);

  GS.screenContainers[STATE_CODEMASTER_ENTER].onStart = () => {
    input.activate();
  }
  GS.screenContainers[STATE_CODEMASTER_ENTER].onEnd = () => {
    input.deactivate();
  }

  const submitButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Submit" },
    bg: { fill: bg_dark }
  });
  submitButton.position.set(425 * gsc, 400 * gsc);
  GS.screenContainers[STATE_CODEMASTER_ENTER].addChild(submitButton);

  const submit = async () => {
    const error = validate(input.curText);
    if (error) {
      alert(error);
    } else {
      await setCodeRegex(input.curText);
      afterCodeMasterEnter();
    }
  }

  submitButton.onClick = submit;
  input.onEnter = submit;

}

const buildScreenSleuthGuess = () => {
  GS.screenContainers[STATE_SLEUTH_GUESS].removeChildren();
  // Red/Green for correct/incorrect
  // List of previous guesses
  // Input and Submit button

  const header = new PIXI.Text({ text: "Enter your guess:", style: {
    ...baseTextStyle,
  }});
  header.anchor.set(0.5, 0.5);
  header.position.set(150 * gsc, 50 * gsc);
  const answerInput = new TextEdit('', {
    allowedChars: ['a', 'b', 'c', '*', '|', '(', ')'],
    maxLength: 12,
  });
  // Expose for the intro sequence.
  GS.answerInput = answerInput;
  answerInput.pivot.set(0, answerInput.height / 2);
  answerInput.position.set(150 * gsc, 100 * gsc);
  answerInput.deactivate();
  const inputCover = new RectangleCover(answerInput, { width: 250 * gsc, points: 20, randMult: 0.1 });
  inputCover.position.set(answerInput.position.x, answerInput.position.y);
  const submitButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Submit" },
    bg: { fill: bg_dark }
  });
  submitButton.pivot.set(submitButton.width / 2, submitButton.height / 2);
  submitButton.position.set(150 * gsc, 180 * gsc);
  const guessList = new PIXI.Container();
  guessList.position.set(575 * gsc, 25 * gsc)
  const incorrectBorder = new PIXI.Graphics();
  incorrectBorder.rect(50 * gsc, 250 * gsc, 900 * gsc, 300 * gsc).fill(red).stroke({ color: black, width: 5 * gsc });
  const correctBorder = new PIXI.Graphics();
  correctBorder.rect(525 * gsc, 275 * gsc, 400 * gsc, 250 * gsc).fill(green).stroke({ color: black, width: 5 * gsc });
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(incorrectBorder);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(correctBorder);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(guessList);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(header);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(inputCover);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(answerInput);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(submitButton);

  const newDerivationHeader = new PIXI.Text({ text: "\\/ Drag Me! \\/", style: {
    ...baseTextStyle,
  }});
  newDerivationHeader.anchor.set(0.5, 0.5);
  newDerivationHeader.position.set(425 * gsc, 70 * gsc);
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(newDerivationHeader);

  const guessListBG = new PIXI.Graphics();
  guessListBG.rect(0, 0, 375 * gsc, 200 * gsc).fill(bg).stroke({ color: black, width: 5 * gsc });
  guessList.addChild(guessListBG);
  const guessContainer = new PIXI.Container();
  guessContainer.bg = new PIXI.Graphics().rect(0, 0, 375 * gsc, 2000 * gsc).fill(bg);
  guessContainer.mask = new PIXI.Graphics().rect(0, 0, 375 * gsc, 200 * gsc).fill(0x000000);
  guessContainer.interactive = true;
  guessContainer.addChild(guessContainer.mask);
  guessContainer.addChild(guessContainer.bg);
  guessContainer.on('wheel', (e) => {
    const newY = Math.max(0,Math.min(
      (guessContainer.listChildren?.map(c => c.position.y + c.height) ?? []).reduce((a, b) => Math.max(a, b), 200) - 200,
      guessContainer.pivot.y + e.deltaY
    ));
    if (newY === guessContainer.pivot.y) return;
    GS.inBoxScrolling = true;
    guessContainer.pivot.set(0, newY);
    guessContainer.mask.position.set(0, newY);
  });
  guessList.addChild(guessContainer);
  const buildGuestList = () => {
    guessContainer.listChildren?.forEach(c => guessContainer.removeChild(c));
    guessContainer.listChildren = [];
    GS.sleuthGuesses.forEach((guess, i) => {
      const text = new TextChanger(guess.s, { align: 'left', text: {...baseTextStyle} });
      text.position.set(5 * gsc, (i * 40 + 5) * gsc);
      guessContainer.addChild(text);
      guessContainer.listChildren.push(text);
    });
    GS.codeWordDistinguishes.forEach((distinguish, i) => {
      const text = new TextChanger(distinguish, { align: 'left', text: { ...baseTextStyle, fill: GS.codeRegexDFA.simulateWord(distinguish) === "Accept" ? green : red } });
      text.pivot.set(text.width, 0);
      text.position.set(370 * gsc, (i * 40 + 5) * gsc);
      guessContainer.addChild(text);
      guessContainer.listChildren.push(text);
    });
  }
  buildGuestList();
  GS.wordContainer = new PIXI.Container();
  GS.screenContainers[STATE_SLEUTH_GUESS].addChild(GS.wordContainer);

  GS.screenContainers[STATE_SLEUTH_GUESS].onStart = () => {
    answerInput.clear();
    answerInput.activate();
    buildGuestList();
    if (GS.codeWordDistinguishes.length > 0) {
      newDerivationHeader.alpha = 1;
      // Add a new draggable word to the screen
      const derivationWord = new TextChanger(GS.codeWordDistinguishes[GS.codeWordDistinguishes.length - 1], { text: {...baseTextStyle}});
      derivationWord.pivot.set(0, derivationWord.height / 2);
      const derivationCover = new RectangleCover(derivationWord, { text: {...baseTextStyle}, width: Math.max(derivationWord.width * 1.2, 20), height: 50 * gsc, points: 20, randMult: 0.1 });
      const derivationContainer = new PIXI.Container();
      derivationContainer.position.set(300 * gsc+250/2 * gsc, 125 * gsc);
      derivationContainer.addChild(derivationCover);
      derivationContainer.addChild(derivationWord);
      GS.wordContainer.addChild(derivationContainer);

      derivationContainer.interactive = true;
      derivationContainer.cursor = "pointer";
      derivationContainer.on('pointerdown', (e) => {
        GS.dragging = derivationContainer;
        const pos = GS.screen.globalToLocal(e.data.global.x, e.data.global.y);
        GS.dragging.offset = {
          x: GS.dragging.x - pos.x,
          y: GS.dragging.y - pos.y,
        }
      });
      derivationContainer.on('pointerup', () => {
        GS.dragging = null;
      });
    } else {
      newDerivationHeader.alpha = 0;
    }
  }
  GS.screenContainers[STATE_SLEUTH_GUESS].onEnd = () => {
    answerInput.deactivate();
  }

  const submit = () => {
    const error = validate(answerInput.curText);
    if (error) {
      alert(error);
    } else {
      setSleuthGuessLatest(answerInput.curText);
      afterSleuthGuess();
    }
  }
  submitButton.onClick = submit;
  answerInput.onEnter = submit;
}

const buildScreenWait = () => {
  // Just a simple waiting screen with a confirm button
  GS.screenContainers[STATE_CODE_WAIT].removeChildren();
  const header = new PIXI.Text({ text: "Ready, Codemaster?", style: {
    ...baseTextStyle,
  }});
  header.anchor.set(0.5, 0.5);
  header.scale.set(1.5);
  header.position.set(500, 200);
  GS.screenContainers[STATE_CODE_WAIT].addChild(header);

  const ready = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Ready" },
    bg: { fill: bg_dark }
  });
  ready.position.set(425, 300);
  GS.screenContainers[STATE_CODE_WAIT].addChild(ready);

  ready.onClick = () => {
    GS.curState = STATE_CODE_DISTINGUISH;
    showScreen(GS.curState);
  }
}

const buildScreenDistinguish = () => {
  GS.screenContainers[STATE_CODE_DISTINGUISH].removeChildren();
  // Secret: <>
  // Guess: <>
  // Distinguish: input
  // Same + Submit buttons

  const secretHeader = new PIXI.Text({ text: "Secret:", style: {
    ...baseTextStyle,
  }});
  secretHeader.anchor.set(0, 0.5);
  secretHeader.position.set(50, 100);
  const secretText = new TextChanger(GS.codeRegex.s, { align: 'left', text: {...baseTextStyle} }); // left align for x:0 start
  secretText.pivot.set(0, secretText.height / 2);
  secretText.position.set(300, 100);
  const secretCover = new RectangleCover(secretText, { width: 250, height: 50, points: 20, randMult: 0.1 });
  secretCover.position.set(300 + 105, 100);

  const guessHeader = new PIXI.Text({ text: "Guess:", style: {
    ...baseTextStyle,
  }});
  guessHeader.anchor.set(0, 0.5);
  guessHeader.position.set(50, 200);
  const guessText = new TextChanger(GS.sleuthGuesses[GS.sleuthGuesses.length - 1]?.s || '', { align: 'left', text: {...baseTextStyle} });
  guessText.pivot.set(0, guessText.height / 2);
  guessText.position.set(300, 200);
  const guessCover = new RectangleCover(guessText, { width: 250, height: 50, points: 20, randMult: 0.1 });
  guessCover.position.set(300 + 105, 200);

  const distinguishHeader = new PIXI.Text({ text: "Distinguishing Word:", style: {
    ...baseTextStyle,
  }});
  distinguishHeader.anchor.set(0, 0.5);
  distinguishHeader.position.set(50, 300);
  const distinguishInput = new TextEdit('', {
    allowedChars: ['a', 'b', 'c'],
    maxLength: 12,
    align: 'left',
  });
  distinguishInput.pivot.set(0, distinguishInput.height / 2);
  distinguishInput.position.set(300, 300);
  const distinguishCover = new RectangleCover(distinguishInput, { width: 250, height: 50, points: 20, randMult: 0.1 });
  distinguishCover.position.set(300 + 105, 300);

  const sameButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Same!" },
    bg: { fill: bg_dark }
  });
  sameButton.position.set(600, 150);
  const submitButton = new FloatingButton({
    ...baseButtonOpts,
    label: { text: "Submit" },
    bg: { fill: bg_dark }
  });
  submitButton.position.set(600, 250);

  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(secretHeader);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(secretCover);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(secretText);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(guessHeader);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(guessCover);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(guessText);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(distinguishHeader);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(distinguishCover);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(distinguishInput);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(sameButton);
  GS.screenContainers[STATE_CODE_DISTINGUISH].addChild(submitButton);

  GS.screenContainers[STATE_CODE_DISTINGUISH].onStart = () => {
    // Refresh this screen whenever loaded - since it depends on the codeRegex and guessRegex.
    distinguishInput.deactivate();
    buildScreenDistinguish();
  }
  GS.screenContainers[STATE_CODE_DISTINGUISH].onEnd = () => {
    distinguishInput.deactivate();
  }

  sameButton.onClick = () => {
    if (GS.possibleDistinguishCurrent) {
      alert('These Regex are not the same! There is a word that distinguishes them.');
    } else {
      // Game over!
      addGame();
      resetGame();
      alert('You successfully found the regex!');
    }
  }
  const submit = () => {
    const secretAccepts = GS.codeRegexDFA.simulateWord(distinguishInput.curText) === "Accept";
    const guessAccepts = GS.sleuthGuesses[GS.sleuthGuesses.length - 1].toNFA().toDFA().simulateWord(distinguishInput.curText) === "Accept";
    if (secretAccepts === guessAccepts) {
      alert(`This word does not distinguish the two regex, both ${secretAccepts ? 'accept' : 'reject'} the word ${distinguishInput.curText}.`);
    } else {
      GS.codeWordDistinguishes.push(distinguishInput.curText);
      afterCodeWordDistinguished();
    }
  }
  submitButton.onClick = submit;
  distinguishInput.onEnter = submit;
}

const pointerMove = (e) => {
  if (GS.dragging) {
    const pos = GS.screen.globalToLocal(e.data.global.x, e.data.global.y);
    GS.dragging.position.set(pos.x + GS.dragging.offset.x, pos.y + GS.dragging.offset.y);
  }
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.easings = easings;
  GS.screen = new Screen(app, opts.hideBG);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000 * gsc, 600 * gsc);
  GS.screen.scaleToFit();
  GS.curState = STATE_MENU;
  GS.progress = new Progress(opts.steps, {onSuccess, ...opts.progress}, GS);

  resetGame();

  // For the modal.
  const close = document.getElementById("warningClose")
  if (close) {
    close.onclick = () => {
      document.getElementById("warningModal").style.display = "none";
    }
  }

  document.addEventListener('wheel', (e) => {
    if (GS.inBoxScrolling) {
      e.preventDefault();
      GS.inBoxScrolling = false;
    }
  }, { passive: false });

  GS.screen.container.interactive = true;
  GS.screen.container.on('pointermove', pointerMove);
};

const unloader = () => {
  Object.values(GS.screenContainers).forEach(cont => cont.clear());
};

export default {
  loader, unloader,
  GS,
  showScreen,
  setCodeRegex,
  STATE_CODEMASTER_ENTER, STATE_CODE_DISTINGUISH, STATE_CODE_WAIT, STATE_MENU, STATE_SLEUTH_GUESS
};
