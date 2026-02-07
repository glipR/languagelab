import { addScene, registerScene } from '../../templates/scene.js';
import DFA from '../../dfa.js';
import dfaSim from '../../anims/dfa_sim.js';
import { StepScenes } from '../../utils.js';
import { markComplete } from '../../tools/completion.js';

const dfa = DFA.randomDFA({ forceConnected: true, area: { width: 400, height: 300, x: 300, y: 250 }, alphabet: [
    ['a', 'b'],
    ['a', 'b', 'c'],
    ['0', '1'],
    ['x', 'y', 'z'],
  ][Math.floor(Math.random() * 4)]
});

console.log(dfa.toJSON(), dfa.validate(), dfa.collectAlphabet())
const alph = dfa.collectAlphabet();
const word = () => {
  const len = Math.floor(Math.random() * 5) + 3;
  let w = '';
  for (let i = 0; i < len; i++) {
    w += alph[Math.floor(Math.random() * alph.length)];
  }
  return w;
}

const randomOpts = {
  graph: dfa.toJSON(),
  word: word(),
  showNextEdge: false,
  addBackwards: true,
  completeOnLast: true,
}

const contentText = `
Let's simulate some words on DFAs.

Drag the purple circle between states to recognise the word!
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('dfa_sim', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const simContainer = document.querySelector('#dfa_sim');
  const t1Steps = new StepScenes(simContainer, 'dfa_sim', [randomOpts], () => {}, true, null, {});
  registerScene(dfaSim.loader, dfaSim.unloader, 'dfa_sim', randomOpts, t1Steps.makeOnSuccess(), t1Steps.makeOnFailure());
}

export default addContent;
