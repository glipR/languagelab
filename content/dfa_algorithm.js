import { addScene, registerScene } from '../templates/scene.js';
import dfaTest from '../anims/dfa_algorithm_test.js';
import { markComplete } from '../tools/completion.js';
import { StepScenes } from '../utils.js';

const baseCode = `/*
  Functions you can use:
  - moveToState(state): moves the DFA to the given state
  Feel free to use console.log to help debug your code - you can see the log in the console (F12)
*/

function evaluateDFA(dfa, string) {
  // dfa is an object, with the following properties:
  // - states: an array of objects, representing the states of the DFA, each with the following properties:
  //   - name: the name of the state
  //   - accepting: a boolean, true if the state is accepting
  //   - starting: a boolean, true if the state is the starting state
  // - alphabet: an array of strings, representing the alphabet of the DFA
  // - transitions: a list of objects, each with the following properties:
  //   - from: the state the transition starts from
  //   - to: the state the transition goes to
  //   - label: the symbols that the transition reads, separated by commas
}
`;

const actualCode = localStorage.getItem('dfaAlgorithmCode') || baseCode;

const contentText = `
<p>Add to the javascript code below to implement the algorithm for evaluating a DFA on a string.</p>

<div id="editor">${actualCode}</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();

  window.editor = ace.edit("editor");
  window.editor.setTheme("ace/theme/monokai");
  window.editor.session.setMode("ace/mode/javascript");
  window.editor.session.on('change', () => {
    localStorage.setItem('dfaAlgorithmCode', window.editor.getValue());
  });

  addScene('dfa_test', document.querySelector('.articleBodyCenter'));
  const algorithmContainer = document.querySelector('#dfa_test');
  const algorithmSteps = new StepScenes(algorithmContainer, "dfa_test", [{}], () => {
    markComplete('dfaAlgorithm');
    // Redirect to next page
    window.location.href = "/pages/dfa_code_modify";
  }, true);

  registerScene(dfaTest.loader, dfaTest.unloader, 'dfa_test', {}, algorithmSteps.makeOnSuccess(), algorithmSteps.makeOnFailure());
}

export default addContent;
