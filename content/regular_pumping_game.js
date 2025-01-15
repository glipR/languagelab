import { addScene, registerScene } from '../templates/scene.js';
import pumpingGame from '../anims/regular_pumping_game.js';
import { StepScenes } from '../utils.js';
import { isComplete, markComplete } from '../tools/completion.js';

// TODO: Irregular language that requires i=0 selected.

const dummyPosition = { x: 0, y: 0 }

const contentText = `TODO`

export const tasks = [
  {
    type: "Regular",
    dfa: {
      states: [
        { name: "A", position: dummyPosition, starting: true, accepting: true },
        { name: "B", position: dummyPosition },
      ],
      transitions: [
        { from: "A", to: "B", label: "a" },
        { from: "B", to: "A", label: "a" },
        { from: "A", to: "A", label: "b" },
        { from: "B", to: "B", label: "b" },
      ],
    },
    wordSelector: (n) => {
      const w = Array.from({ length: n+1 }, () => Math.random() < 0.5 ? "a" : "b");
      if (w.filter(c => c === "a").length % 2 === 1) {
        w.push("a");
      }
      return w.join("");
    },
    description: "The language of strings that contain an even number of 'a's.",
    n: 3,
  },
  {
    type: "Irregular",
    acceptor: (s) => {
      const n = Math.floor(s.length / 2);
      return s.slice(0, n) === s.slice(n);
    },
    wordSelector: (n) => {
      return "a".repeat(n) + "b".repeat(n) + "a".repeat(n) + "b".repeat(n);
    },
    description: "The language of strings that are expressible as x+x for some string x.",
    n: 3,
  }
]

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('regular_pumping_game', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const gameContainer = document.querySelector('#regular_pumping_game');
  const steps = new StepScenes(gameContainer, "regular_pumping_game", tasks, () => {
    markComplete('regularPumpingGame');
    // Redirect to next page
    // TODO: Next page.
    window.location.href = "/pages/regular/dfa_form";
  }, true, null, { storageKey: 'regularPumpingGameProgress' });
  registerScene(pumpingGame.loader, pumpingGame.unloader, 'regular_pumping_game', tasks[steps.progress.current], steps.makeOnSuccess(), steps.makeOnFailure());
}

export default addContent;
