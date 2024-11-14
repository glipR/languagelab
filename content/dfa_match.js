import { addScene, registerScene } from '../templates/scene.js';
import dfaCreate from '../anims/dfa_create.js';
import DFACreateTasks from '../graphs/dfaMatch.js'
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

// TODO: Show progress bar with steps.
const t4Tasks = [
  {
    checkingDFA: DFACreateTasks.t1.graph,
    description: DFACreateTasks.t1.description,
    solution_image: DFACreateTasks.t1.solution_image,
    hints: DFACreateTasks.t1.hints,
  },
  {
    checkingDFA: DFACreateTasks.t2.graph,
    description: DFACreateTasks.t2.description,
    solution_image: DFACreateTasks.t2.solution_image,
    hints: DFACreateTasks.t2.hints,
  },
  {
    checkingDFA: DFACreateTasks.t3.graph,
    description: DFACreateTasks.t3.description,
    solution_image: DFACreateTasks.t3.solution_image,
    hints: DFACreateTasks.t3.hints,
  },
  {
    checkingDFA: DFACreateTasks.t4.graph,
    description: DFACreateTasks.t4.description,
    solution_image: DFACreateTasks.t4.solution_image,
    hints: DFACreateTasks.t4.hints,
  },
];

const contentText = `
Now that you've got creation under control, let's make some DFAs which recognise particular languages.
`

const progress = `
<p id="dfaMatchInstructions"></p>
<div id="dfaMatchProgressBorder" class="progressBorder">
  <div id="dfaMatchProgressBar" class="progressBar"></div>
</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('dfa_match', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const creationContainer = document.querySelector('#dfa_match');
  const t4Steps = new StepScenes(creationContainer, "dfa_match", t4Tasks, () => {
    markComplete('dfaMatch');
    // Redirect to next page
    window.location.href = "/pages/dfa_code_execute";

  }, false, t4Tasks.map((task) => task.description), {
    progressContainer: document.getElementById("dfaMatchProgressBorder"),
    progress: document.getElementById("dfaMatchProgressBar"),
    instructionText: document.getElementById("dfaMatchInstructions"),
    storageKey: 'dfaMatchProgress',
  });
  registerScene(dfaCreate.loader, dfaCreate.unloader, 'dfa_match', t4Tasks[t4Steps.progress.current], t4Steps.makeOnSuccess(), t4Steps.makeOnFailure());
}

export default addContent;
