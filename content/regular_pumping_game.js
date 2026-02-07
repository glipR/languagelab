import { addScene, registerScene } from '../templates/scene.js';
import pumpingGame from '../anims/regular_pumping_game.js';
import { StepScenes } from '../utils.js';
import { isComplete, markComplete } from '../tools/completion.js';

// TODO: Irregular language that requires i=0 selected.

const dummyPosition = { x: 0, y: 0 }

const contentText = `
Play the game below and get some intuition for using the pumping lemma from both perspectives - both from regular and irregular languages.

If you think the language is regular, you should be able to always win as player 1, and if you think the language is irregular, you should be able to always win as player 2 (in our examples, not always).
`

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
  },
  {
    type: "Regular",
    dfa: {
      states: [
        { name: "S", position: dummyPosition, starting: true, accepting: true },
        { name: "1", position: dummyPosition, accepting: true },
        { name: "2", position: dummyPosition, accepting: true },
        { name: "3", position: dummyPosition, accepting: true },
        { name: "4", position: dummyPosition, accepting: true },
        { name: "E", position: dummyPosition },
      ],
      transitions: [
        { from: "S", to: "1", label: "1" },
        { from: "S", to: "2", label: "2" },
        { from: "S", to: "3", label: "3" },
        { from: "S", to: "4", label: "4" },
        { from: "1", to: "2", label: "2" },
        { from: "1", to: "E", label: "1,3,4" },
        { from: "2", to: "1", label: "1" },
        { from: "2", to: "3", label: "3" },
        { from: "2", to: "E", label: "2,4" },
        { from: "3", to: "4", label: "4" },
        { from: "3", to: "2", label: "2" },
        { from: "3", to: "E", label: "3,1" },
        { from: "4", to: "3", label: "3" },
        { from: "4", to: "E", label: "4,2,1" },
        { from: "E", to: "E", label: "1,2,3,4" },
      ]
    },
    wordSelector: (n) => {
      const substr = "123432";
      return substr.repeat(Math.ceil(n / substr.length)).slice(0, n);
    },
    description: "Strings on {1,2,3,4} where adjacent characters are adjacent on the number line.",
    n: 6,
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
