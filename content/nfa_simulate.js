import { addScene, registerScene } from '../templates/scene.js';
import dfaSim from '../anims/dfa_sim.js';
import { t1JSON, t2JSON, t3JSON } from '../graphs/nfaSim.js'
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const t1Opts = {
  graph: t1JSON,
  word: 'aaabaabaa',
  showNextEdge: false,
  allowReset: true,
  acceptRejectButtons: true,
  shouldFail: false,
};
const t2Opts = {
  graph: t2JSON,
  word: 'ababb',
  showNextEdge: false,
  allowReset: true,
  acceptRejectButtons: true,
  shouldFail: true,
}
const t3Opts = {
  graph: t3JSON,
  word: 'abdeadb',
  showNextEdge: false,
  allowReset: true,
  acceptRejectButtons: true,
  shouldFail: false,
}

const t1Tasks = [t1Opts, t2Opts, t3Opts];

const contentText = `
For each of the following NFAs, determine whether that NFA accepts or rejects the given word.
<br>
If the NFA rejects the word (no valid path to an accepting state exists), then simply click the "Reject" button.
<br>
If the NFA accepts the word (a valid path to an accepting state exists), then drag the purple pointer along the path that the NFA takes to accept the word. Once you have reached the accepting state, click the "Accept" button.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('nfa_sim', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const simContainer = document.querySelector('#nfa_sim');
  const t1Steps = new StepScenes(simContainer, 'nfa_sim', t1Tasks, () => {
    markComplete('nfaSimulate');
    // Redirect to next page
    window.location.href = "/pages/nfa_categorise";
  }, true, null, {
    storageKey: 'nfaSimProgress',
  });
  registerScene(dfaSim.loader, dfaSim.unloader, 'nfa_sim', t1Tasks[t1Steps.progress.current], t1Steps.makeOnSuccess(), t1Steps.makeOnFailure());
}

export default addContent;
