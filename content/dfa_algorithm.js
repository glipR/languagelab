import { addScene, registerScene } from '../templates/scene.js';
import dfaTest from '../anims/dfa_algorithm_test.js';
import { markComplete } from '../tools/completion.js';
import { StepScenes } from '../utils.js';
import addCode from '../templates/code.js';

const baseCode = `\
/*
  Functions you can use:
  - moveToState(state): moves the DFA to the given state
  Feel free to use console.log to help debug your code - this will appear on the page and in the developer console.
*/

function evaluateDFA(dfa, string) {
  // dfa is an object, with the following properties:
  // - states: an array of objects, representing the states of the DFA, each with the following properties:
  //   - name: the name of the state
  //   - accepting: a boolean, true if the state is accepting
  //   - starting: a boolean, true if the state is the starting state
  // - alphabet: an array of strings, representing the alphabet of the DFA
  // - transitions: a list of objects, each with the following properties:
  //   - from: the state name the transition starts from
  //   - to: the state name the transition goes to
  //   - label: the symbols that the transition reads, separated by commas

  console.log(JSON.stringify(dfa.states))
  // Suppose the string was 'aba'
  console.log("string: " + string)
  moveToState('B')
  console.log("Moving to B")
  moveToState('C')
  moveToState('C')
  // C is an accepting state, so we return true
  console.log("Returning true")
  return true;
}
`;

const baseCodePy = `\
from dfa import moveToState
# moveToState(state: string) -> Moves the DFA to the given state

def evaluate_dfa(dfa, string):
    # dfa is an dictionary, with the following keys:
    # - 'dfa["states"]': a list of dictionariess, representing the states of the DFA, each with the following keys:
    #   - 'state["name"]': the name of the state
    #   - 'state["accepting"]': a boolean, True if the state is accepting
    #   - 'state["starting"]': a boolean, True if the state is the starting state
    # - 'dfa["alphabet"]': a list of strings, representing the alphabet of the DFA
    # - 'dfa["transitions"]': a list of dictionariess, each with the following keys:
    #   - 'transition["from"]': the state name the transition starts from
    #   - 'transition["to"]': the state name the transition goes to
    #   - 'transition["label"]': the symbols that the transition reads, separated by commas

    print(dfa["states"])
    # Suppose the string was 'aba'
    print("string: " + string)
    moveToState('B')
    print("Moving to B")
    moveToState('C')
    moveToState('C')
    # C is an accepting state, so we return True
    print("Returning True")
    return True
`

const contentText = `
<p>
Add to the javascript or python code below to implement the algorithm for evaluating a DFA on a string.
<br>
The function <code>evaluateDFA</code> takes in a DFA object and a string, and should:
</p>
<ul>
  <li>Call the <code>moveToState</code> function to move the DFA to the correct state for each symbol in the string,</li>
  <li>Return a boolean to represent whether the word is accepted.</li>
</ul>
<p>
You can use the <code>console.log()/print()</code> function to help debug your code. The log will appear on the page and in the console (F12).
</p>
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
