import { addScene, registerScene } from '../templates/scene.js';
import nfaCreate from '../anims/nfa_create.js';
import NFACreateTasks from '../graphs/nfaMatch.js'
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const t4Tasks = [
  {
    checkingNFA: NFACreateTasks.t1.graph,
    description: NFACreateTasks.t1.description,
    solution_image: NFACreateTasks.t1.solution_image,
    hints: NFACreateTasks.t1.hints,
  },
  {
    checkingNFA: NFACreateTasks.t2.graph,
    description: NFACreateTasks.t2.description,
    solution_image: NFACreateTasks.t2.solution_image,
    hints: NFACreateTasks.t2.hints,
  },
  {
    checkingNFA: NFACreateTasks.t3.graph,
    description: NFACreateTasks.t3.description,
    solution_image: NFACreateTasks.t3.solution_image,
    hints: NFACreateTasks.t3.hints,
  }
];


const contentText = `
Let's make some NFAs that recognise a specific language.
<br>
When entering in label characters, you can press '.' and this will be replaced with 'ε'.
<br>
The third and final language is rather challenging, feel free to intentionally submit the wrong NFA so you can peek the hints if need be!
`

const progress = `
<p id="nfaMatchInstructions"></p>
<div id="nfaMatchProgressBorder" class="progressBorder">
  <div id="nfaMatchProgressBar" class="progressBar"></div>
</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('nfa_match', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const creationContainer = document.querySelector('#nfa_match');
  const t4Steps = new StepScenes(creationContainer, "nfa_match", t4Tasks, () => {
    markComplete('nfaMatch');
    // Redirect to next page
    window.location.href = "/pages/nfa_algorithm";

  }, false, t4Tasks.map((task) => task.description), {
    progressContainer: document.getElementById("nfaMatchProgressBorder"),
    progress: document.getElementById("nfaMatchProgressBar"),
    instructionText: document.getElementById("nfaMatchInstructions"),
    storageKey: 'nfaMatchProgress',
  });
  registerScene(nfaCreate.loader, nfaCreate.unloader, 'nfa_match', t4Tasks[t4Steps.progress.current], t4Steps.makeOnSuccess(), t4Steps.makeOnFailure());
}

export default addContent;
