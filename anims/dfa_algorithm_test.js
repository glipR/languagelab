import {black, bg_dark, highlightColours, green, red} from '../colours.js';
import Graph from '../graph.js';
import { TweenManager, Tween, ValueTween } from '../tween.js';
import Screen from '../screen.js';
import { RectangleCover } from '../tools/paper_cover.js';
import { FloatingButton } from '../ui.js';
import { combineEasing, reverseEasing } from '../utils.js';
import { newLog } from '../templates/terminal.js';
import { objectToMap, pythonPreamble } from '../tools/code_execution.js';

const GS = {
  currentState: 'A'
};

const baseStyle = new PIXI.TextStyle({
  fontFamily: "Ittybittynotebook",
  fontSize: 32,
  fill: black,
  align: 'center',
});

const flashEasing = () => combineEasing([
  GS.easings.easeInOutQuad,
  (t) => 1,
  reverseEasing(GS.easings.easeInOutQuad),
], [
  1,
  0.5,
  1,
]);

const wordIndexPosition = ((i, word) => {
  const localFirstCharPos = GS.screen.globalToLocal(word[i].getGlobalPosition().x, word[i].getGlobalPosition().y);
  return {
    x: localFirstCharPos.x,
    y: localFirstCharPos.y,
  }
});

const moveBetween = (l1, l2, duration, graph, nodePointer, wordPointer, word) => {
  const edge = graph.edgeMap[`${l1}->${l2}`];
  const oldWordIndex = GS.curWordIndex;
  const curWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
  GS.curWordIndex++;
  if (word && GS.curWordIndex >= word.length) {
    GS.curWordIndex--;
  }
  const newWordIndex = GS.curWordIndex;
  const newWordPos = word ? wordIndexPosition(GS.curWordIndex, word) : 0;
  const tween = new ValueTween(0, 1, duration, GS.easings.easeInOutQuad, (v) => {
    const pos = edge.edgeInterp(v).position;
    if (nodePointer) nodePointer.position.set(pos.x, pos.y - 60);
  })
    .during(edge.colorEdgeTween(red, duration, flashEasing(), false));

  if (oldWordIndex != newWordIndex) {
    if (wordPointer) tween.during(new ValueTween(curWordPos, newWordPos, duration, GS.easings.easeInOutQuad, (v) => {
      wordPointer.position.set(v.x, v.y);
    }));
    if (word) tween.during(new ValueTween(black, red, duration, GS.easings.easeInOutQuad, (v) => {
      word[newWordIndex].style.fill = v;
    }));
  }
  if (word) tween.during(new ValueTween(red, bg_dark, duration, GS.easings.easeInOutQuad, (v) => {
    word[oldWordIndex].style.fill = v;
  }));
  return tween;
};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.easings = easings;
  GS.currentState = 'A';
  GS.curWordIndex = 0;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;
  GS.graph = new Graph();
  const nodeStyle = { radius: 30, fill: bg_dark, strokeWidth: 3, stroke: black, showLabel: true };
  const edgeStyle = (lab) => ({ edgeLabel: lab });
  GS.graph.fromJSON({
    nodes: {
      A: { position: { x: 250, y: 300 }, style: {...nodeStyle, isEntry: true, entryWidth: 5 } },
      B: { position: { x: 500, y: 300 }, style: nodeStyle },
      C: { position: { x: 750, y: 300 }, style: {...nodeStyle, doubleBorder: black } },
      D: { position: { x: 375, y: 500 }, style: {...nodeStyle, doubleBorder: black } },
      E: { position: { x: 625, y: 500 }, style: nodeStyle },
    },
    edges: [
      { from: 'A', to: 'B', style: edgeStyle('a') },
      { from: 'A', to: 'D', style: edgeStyle('b') },
      { from: 'B', to: 'C', style: edgeStyle('a, b') },
      { from: 'C', to: 'A', style: {
        ...edgeStyle('b'),
        edgeAnchor: {
          x: 0,
          y: -100,
        },
      } },
      { from: 'C', to: 'C', style: edgeStyle('a') },
      { from: 'D', to: 'D', style: edgeStyle('b') },
      { from: 'D', to: 'E', style: edgeStyle('a') },
      { from: 'E', to: 'B', style: edgeStyle('b') },
      { from: 'E', to: 'C', style: edgeStyle('a') },
    ]
  });

  GS.graph.edges.forEach((edge) => {
    edge.labelBG.alpha = 1;
  });

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();

  const graphContainer = new PIXI.Container();
  graphContainer.addChild(GS.graph.graph);
  graphContainer.pivot.set(500, 300);
  graphContainer.position.set(500, 300);
  GS.screen.addChild(graphContainer);

  const word_text = 'a' + (Math.random() > 0.5 ? 'a' : 'b') + 'a' + Array.from({length: 5}, () => (Math.random() > 0.75 ? 'a' : 'b')).join('');
  GS.word = word_text.split('').map(c => new PIXI.Text({ text: c, style: {...baseStyle}}));
  const wordContainer = new PIXI.Container();
  const wordWidth = 20;
  GS.word.forEach((c, i) => {
    c.anchor.set(0, 1);
    c.position.set((i == 0) ? 0 : (GS.word[i-1].position.x + wordWidth), 0);
    wordContainer.addChild(c);
  });
  wordContainer.pivot.set(wordContainer.width/2, -wordContainer.height/2);
  wordContainer.position.set(500, 120);
  const wordCover = new RectangleCover(wordContainer, {points: 18, randMult: 0.1});
  wordCover.position.set(500, 120);
  GS.screen.addChild(wordCover);
  GS.screen.addChild(wordContainer);

  GS.nodePointer = new PIXI.Graphics();
  GS.nodePointer.rect(-5, -10, 10, 20).fill(black);
  GS.nodePointer.moveTo(-10, 10).lineTo(10, 10).lineTo(0, 25).lineTo(-10, 10).fill(black);
  GS.nodePointer.position.set(GS.graph.nodes['A'].position.x, GS.graph.nodes['A'].position.y - 60);
  GS.screen.addChild(GS.nodePointer);

  GS.wordPointer = new PIXI.Graphics();
  GS.wordPointer.rect(1, 0, 11, 3).fill(highlightColours[2]);
  GS.wordPointer.position.set(wordIndexPosition(0, GS.word).x, wordIndexPosition(0, GS.word).y);
  GS.screen.addChild(GS.wordPointer);

  const button = new FloatingButton({
    label: { text: "Check" },
    bg: { fill: green },
    width: 200,
    height: 60,
  });
  button.position.set(800, 500);
  GS.screen.addChild(button);

  window.onPyBeginLoading = () => {
    button.setDisabled(true);
  }
  window.onPyDoneLoading = () => {
    button.setDisabled(false);
  }

  button.onClick = () => {
    const userCode = window.getCode['dfaAlgorithm']();

    let idx = 0;
    const delayFromTween = (func) => {
      if (TweenManager.tweens.length == 0) {
        func();
      } else {
        TweenManager.tweens[0].then(new Tween(0, GS.easings.linear, ()=>{}, func));
      }
    }

    const moveToState = (state) => {
      const curChar = GS.word[GS.curWordIndex];
      const oldState = GS.currentState;
      const transitionEdge = GS.graph.edges.filter(e => e.from.label === oldState && e.to.label === state && e.style.edgeLabel.includes(curChar.text));
      GS.currentState = state;
      if (!transitionEdge.length) {
        throw new Error(`No transition found between states ${oldState} and ${state} with character ${curChar.text}`);
      }
      idx ++;

      const tween = moveBetween(oldState, state, 60, GS.graph, GS.nodePointer, GS.wordPointer, GS.word);
      if (TweenManager.tweens.length == 0) {
        TweenManager.add(tween);
      } else {
        TweenManager.tweens[0].then(tween);
      }
    }

    async function testPy () {
      window.onPyBeginLoading();
      let pyodide = await loadPyodide();
      pyodide.setStdout({batched: newLog()});
      pyodide.setStderr({batched: newLog('error')});
      pyodide.registerJsModule("dfa", { moveToState });
      pyodide.runPython(pythonPreamble);
      try {
        pyodide.runPython(userCode);
      } catch (e) {
        newLog('error')(e);
      }
      window.onPyDoneLoading();
      return pyodide.globals.get('evaluate_dfa');
    }

    const savedConsole = console;
    async function testJS () {
      var console = {...savedConsole};
      console.log = newLog();
      console.error = newLog('error')
      let evaluateDFA;
      try {
        evaluateDFA = eval(`\
        (function() {
          ${userCode}
          return evaluateDFA;
        }())`);
      } catch (e) {
        newLog('error')(e);
        delayFromTween(() => {
          GS.onFailure('Your code threw an error: ' + e.message);
          console.error(e);
        });
      }
      return Promise.resolve(evaluateDFA);
    }

    function testDFA (evaluateDFA) {
      let raised = false;
      let response = null;
      try {
        const sampleDFA = {
          states: [
            { name: 'A', accepting: false, starting: true },
            { name: 'B', accepting: false, starting: false },
            { name: 'C', accepting: true, starting: false },
            { name: 'D', accepting: true, starting: false },
            { name: 'E', accepting: false, starting: false },
          ],
          alphabet: ['a', 'b'],
          transitions: [
            { from: 'A', to: 'B', label: 'a' },
            { from: 'A', to: 'D', label: 'b' },
            { from: 'B', to: 'C', label: 'a, b' },
            { from: 'C', to: 'A', label: 'b' },
            { from: 'C', to: 'C', label: 'a' },
            { from: 'D', to: 'D', label: 'b' },
            { from: 'D', to: 'E', label: 'a' },
            { from: 'E', to: 'B', label: 'b' },
            { from: 'E', to: 'C', label: 'a' },
          ],
        }
        response = evaluateDFA(window.currentTab['dfaAlgorithm'] === 'JS' ? sampleDFA : objectToMap(sampleDFA), `${word_text}`);
      } catch (e) {
        newLog()(e);
        delayFromTween(() => {
          GS.onFailure('Your code threw an error: ' + e.message);
          console.error(e);
        });
        raised = true;
      }

      const check = () => {
        console.log(response, !!response, !!GS.graph.nodes[GS.currentState].style.doubleBorder);
        if (idx === 0) {
          GS.onFailure('Your DFA did not move to any states (make sure to call moveToState).');
        } else if (idx === GS.word.length && !!response === !!GS.graph.nodes[GS.currentState].style.doubleBorder) {
          GS.onSuccess(`Your DFA correctly ${response ? 'accepted' : 'rejected'} the string!`);
        } else {
          GS.onFailure('Your DFA did not correctly accept the string.');
        }
      }

      if (!raised) {
        delayFromTween(check);
      }
    }

    const test = window.currentTab['dfaAlgorithm'] === 'JS' ? testJS : testPy;
    test().then((fn) => {
      testDFA(fn);
    });
  }
};

const unloader = (app) => {
}

export default { loader, unloader };
