import { addScene, registerScene } from '../templates/scene.js';
import dfaTest from '../anims/dfa_algorithm_test.js';
import { markComplete } from '../tools/completion.js';
import { StepScenes } from '../utils.js';
import addCode from '../templates/code.js';

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

const baseCodePy = `
from dfa import moveToState
# moveToState(state: string) -> Moves the DFA to the given state

def evaluate_dfa(dfa, string):
    # dfa is an object, with the following properties:
    # - 'dfa.states': a list of objects, representing the states of the DFA, each with the following properties:
    #   - 'state.name': the name of the state
    #   - 'state.accepting': a boolean, True if the state is accepting
    #   - 'state.starting': a boolean, True if the state is the starting state
    # - 'dfa.alphabet': a list of strings, representing the alphabet of the DFA
    # - 'dfa.transitions': a list of dictionaries, each with the following keys:
    #   - 'transition.from': the state the transition starts from
    #   - 'transition.to': the state the transition goes to
    #   - 'transition.label': the symbols that the transition reads, separated by commas
    return False
`

const actualCode = localStorage.getItem('dfaAlgorithmCode') || baseCode;
const actualCodePy = localStorage.getItem('dfaAlgorithmCodePy') || baseCodePy;

const contentText = `
<p>Add to the javascript code below to implement the algorithm for evaluating a DFA on a string.</p>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addCode('dfaAlgorithm', {
    'JS': baseCode,
    'Py': baseCodePy,
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
