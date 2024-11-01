import { addScene, registerScene } from '../templates/scene.js';
import dfaDraw from '../anims/dfa_drawing_tasks.js';
import { markComplete } from '../tools/completion.js';

const progress = `
<p id="dfaDrawInstructions"></p>
<div id="dfaDrawProgressBorder" class="progressBorder">
  <div id="dfaDrawProgressBar" class="progressBar"></div>
</div>
`

const contentText = `
Follow the instructions below to make your own DFAs, so you can complete the subsequent tasks!
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  // Insert progress bar
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();

  const task3Instructions = document.getElementById("dfaDrawInstructions");
  const task3ProgressContainer = document.getElementById("dfaDrawProgressBorder");
  const task3Progress = document.getElementById("dfaDrawProgressBar");
  const task3Opts = {
    instructionText: task3Instructions,
    progressContainer: task3ProgressContainer,
    progress: task3Progress,
    allowSkipping: true,
    onSuccess: () => {
      markComplete('dfaCreate');
    }
  }
  addScene('dfa_create', document.querySelector('.articleBodyCenter'));
  registerScene(dfaDraw.loader, dfaDraw.unloader, 'dfa_create', task3Opts);
}

export default addContent;
