import { addScene, registerScene } from '../templates/scene.js';
import dfaSim from '../anims/dfa_sim.js';
import { t1JSON, t2JSON, t3JSON } from '../graphs/dfaSim.js'
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const t1Opts = {
  graph: t1JSON,
  word: 'baab',
  showNextEdge: true,
};
const t2Opts = {
  graph: t2JSON,
  word: 'baaab',
  showNextEdge: false,
}
const t3Opts = {
  graph: t3JSON,
  word: 'bcbcca',
  showNextEdge: false,
  addBackwards: true,
}

const t1Tasks = [t1Opts, t2Opts, t3Opts];

const contentText = `
Execute the DFA algorithm by dragging the purple circle through the graph below, based on the word floating above.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('dfa_sim', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const simContainer = document.querySelector('#dfa_sim');
  const t1Steps = new StepScenes(simContainer, 'dfa_sim', t1Tasks, () => {
    markComplete('dfaExecute');
    // Redirect to next page
    window.location.href = "/pages/dfa_categorise";
  }, true, null, {
    storageKey: 'dfaSimProgress',
  });
  registerScene(dfaSim.loader, dfaSim.unloader, 'dfa_sim', t1Tasks[t1Steps.progress.current], t1Steps.makeOnSuccess(), t1Steps.makeOnFailure());
}

export default addContent;
