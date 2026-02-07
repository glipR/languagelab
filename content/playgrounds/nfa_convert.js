import { addScene, registerScene } from '../../templates/scene.js';
import nfaConvert from '../../anims/nfa_convert.js';
import { StepScenes } from '../../utils.js';
import { isComplete, markComplete } from '../../tools/completion.js';
import NFA from '../../nfa.js';

const nfa = NFA.randomNFA({ forceConnected: true, area: { width: 400, height: 350, x: -200, y: -175 }, alphabet: [
  ['a', 'b'],
  ['a', 'b', 'c'],
  ['0', '1'],
  ['x', 'y', 'z'],
][Math.floor(Math.random() * 4)] });
export const convertTasks = [
  {
    nfa: nfa.toJSON(),
    alphabet: nfa.alphabet(),
    progress: {
      resetOnComplete: false,
      instructions: [
        {
          text: "Do the full conversion, and press the check button when you're ready!",
          isComplete: (GS, task) => {
            return GS.matched;
          }
        }
      ]
    },
    solution: `
    Your conversion is correct!
    `
  }
];

const contentText = `
Let's convert some NFAs to DFAs.

Follow the instructions below to execute the algorithm!
`

const progress = `
<p id="nfaConvertInstructions"></p>
<div id="nfaConvertProgressBorder" class="progressBorder">
  <div id="nfaConvertProgressBar" class="progressBar"></div>
</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('nfa_convert', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  // Now we can attach the arguments to progress
  convertTasks.forEach(task => {
    task.progress.progressContainer = document.getElementById("nfaConvertProgressBorder");
    task.progress.progress = document.getElementById("nfaConvertProgressBar");
    task.progress.instructionText = document.getElementById("nfaConvertInstructions");
  })
  const creationContainer = document.querySelector('#nfa_convert');
  const t4Steps = new StepScenes(creationContainer, "nfa_convert", convertTasks, () => {
    markComplete('nfaConvert');
    // Redirect to next page
    window.location.href = "/pages/nfa_theory";
  }, false, convertTasks.map(t => ""), { storageKey: 'nfaConvertProgress', resetOnComplete: true });
  registerScene(nfaConvert.loader, nfaConvert.unloader, 'nfa_convert', convertTasks[t4Steps.progress.current], t4Steps.makeOnSuccess(), t4Steps.makeOnFailure());
}

export default addContent;
