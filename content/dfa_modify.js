import { addScene, registerScene } from '../templates/scene.js';
import dfaPlayground from '../anims/dfa_playground.js';
import DFA from '../dfa.js';
import { markComplete } from '../tools/completion.js';
import { StepScenes } from '../utils.js';
import addCode from '../templates/code.js';
import { pythonPreamble } from '../tools/code_execution.js';
import { newLog } from '../templates/terminal.js';

const baseCode = `\
// Feel free to use console.log to help debug your code - you can see the log on the page or in the console (F12)

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

// For your testing, you can use the following methods:
// testInvert(dfa, result) - returns null if result is indeed the inverted form of dfa. Otherwise, a string with an error message if it is incorrect
// testIntersect(dfa1, dfa2, result) - returns null if result is indeed the intersection of dfa1 and dfa2. Otherwise, a string with an error message if it is incorrect
// testUnion(dfa1, dfa2, result) - returns null if result is indeed the union of dfa1 and dfa2. Otherwise, a string with an error message if it is incorrect
// testIsEmpty(dfa, result) - returns null if result is indeed the correct answer to whether the DFA is empty. Otherwise, a string with an error message if it is incorrect
// testEquivalent(dfa1, dfa2, result) - returns null if result is indeed the correct answer to whether the DFAs are equivalent. Otherwise, a string with an error message if it is incorrect

const smallDFA = {"states":[{"name":"A","position":{"x":319.746875,"y":166.79999999999995},"accepting":false,"starting":true},{"name":"B","position":{"x":708.1624999999999,"y":161.68593749999997},"accepting":false,"starting":false},{"name":"C","position":{"x":505.15156249999995,"y":411.2812499999999},"accepting":true,"starting":false}],"alphabet":["a","b","c"],"transitions":[{"from":"A","to":"A","label":"a","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"A","to":"B","label":"b, c","style":{"edgeAnchor":{"x":-10.209375000000023,"y":-46.29374999999999}}},{"from":"B","to":"A","label":"a","style":{"edgeAnchor":{"x":-1.3218749999999773,"y":35.17499999999998}}},{"from":"B","to":"B","label":"b","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"C","to":"A","label":"a","style":{}},{"from":"B","to":"C","label":"c","style":{"edgeAnchor":{"x":-22.59375,"y":-16.01249999999999}}},{"from":"C","to":"C","label":"b","style":{"loopOffset":{"x":-113.47031249999998,"y":-13.931249999999977}}},{"from":"C","to":"B","label":"c","style":{"edgeAnchor":{"x":34.284374999999955,"y":15.956250000000011}}}]};
const largeDFA = {"states":[{"name":"A","position":{"x":286.578125,"y":57.243749999999984},"accepting":false,"starting":true},{"name":"B","position":{"x":78.884375,"y":222.18281249999995},"accepting":false,"starting":false},{"name":"C","position":{"x":869.3796874999998,"y":150.18749999999997},"accepting":false,"starting":false},{"name":"D","position":{"x":725.5015624999999,"y":56.13749999999999},"accepting":false,"starting":false},{"name":"E","position":{"x":424.54531249999997,"y":343.62187499999993},"accepting":false,"starting":false},{"name":"F","position":{"x":777.0031249999998,"y":355.26562499999994},"accepting":false,"starting":false},{"name":"G","position":{"x":189.18124999999998,"y":411.0703124999999},"accepting":true,"starting":false},{"name":"H","position":{"x":624.9124999999999,"y":452.9531249999999},"accepting":true,"starting":false}],"alphabet":["a","b","c"],"transitions":[{"from":"A","to":"B","label":"a","style":{}},{"from":"B","to":"B","label":"a","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"B","to":"F","label":"b","style":{}},{"from":"B","to":"E","label":"c","style":{}},{"from":"D","to":"E","label":"b","style":{}},{"from":"D","to":"H","label":"c","style":{}},{"from":"E","to":"C","label":"a","style":{}},{"from":"E","to":"F","label":"b","style":{}},{"from":"E","to":"G","label":"c","style":{}},{"from":"F","to":"D","label":"b","style":{}},{"from":"F","to":"H","label":"c","style":{}},{"from":"G","to":"B","label":"a","style":{}},{"from":"G","to":"G","label":"b","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"G","to":"D","label":"c","style":{}},{"from":"H","to":"A","label":"a","style":{}},{"from":"H","to":"G","label":"b","style":{}},{"from":"H","to":"E","label":"c","style":{}},{"from":"A","to":"D","label":"b, c","style":{"edgeAnchor":{"x":-0.009374999999977263,"y":-19.415625}}},{"from":"C","to":"F","label":"b, c","style":{"edgeAnchor":{"x":-7.078125,"y":8.057812500000011}}},{"from":"F","to":"C","label":"a","style":{"edgeAnchor":{"x":33.76875000000007,"y":90.74531249999998}}},{"from":"D","to":"A","label":"a","style":{"edgeAnchor":{"x":2.0437499999999886,"y":35.32499999999999}}},{"from":"C","to":"A","label":"a","style":{"edgeAnchor":{"x":-19.5234375,"y":53.79843749999998}}}]};
const DFA2 = {"states":[{"name":"A","position":{"x":300.8328125,"y":203.64843749999994},"accepting":false,"starting":true},{"name":"B","position":{"x":653.2999999999998,"y":213.18281249999995},"accepting":true,"starting":false}],"alphabet":["a","b","c"],"transitions":[{"from":"A","to":"B","label":"a, b","style":{"edgeAnchor":{"x":0,"y":-59.64374999999998}}},{"from":"B","to":"A","label":"a, b","style":{"edgeAnchor":{"x":0.5578124999999545,"y":26.13749999999999}}},{"from":"A","to":"A","label":"c","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"B","to":"B","label":"c","style":{"loopOffset":{"x":0,"y":-75}}}]};

function invertDFA(dfa) {
  // Given a DFA, return a new DFA that accepts all words that were rejected by the original DFA,
  // and rejects all words previously accepted.
  // You should return an object with the same format.

  return {
    states: dfa.states,
    alphabet: dfa.alphabet,
    transitions: dfa.transitions,
  }
}

function intersectDFA(dfa1, dfa2) {
  // Given two DFAs, return a new DFA that accepts a word if it is accepted by both dfa1 *and* dfa2.
  // You should return an object with the same format.

  return {
    states: dfa1.states,
    alphabet: dfa1.alphabet,
    transitions: dfa1.transitions,
  }
}

function unionDFA(dfa1, dfa2) {
  // Given two DFAs, return a new DFA that accepts a word if it is accepted by either dfa1 *or* dfa2.
  // You should return an object with the same format.

  return {
    states: dfa1.states,
    alphabet: dfa1.alphabet,
    transitions: dfa1.transitions,
  }
}

function isEmptyDFA(dfa) {
  // Given a DFA, determines whether this DFA accepts any words.
  // If the DFA accepts any words, return false. Otherwise, return true.

  return false
}

function isEquivalent(dfa1, dfa2) {
  // Given two DFAs, determines whether they accept exactly the same language.
  // If the DFAs accept the same language, return true. Otherwise, return false.

  return false
}

console.log("inverted DFA: ", JSON.stringify(invertDFA(smallDFA)));
const inversionMessage = testInvert(smallDFA, invertDFA(smallDFA));
if (inversionMessage) {
  console.error(inversionMessage);
} else {
  console.log("Success on DFA inversion!")
}

console.log("intersected DFA: ", JSON.stringify(intersectDFA(smallDFA, DFA2)));
const intersectTest = testIntersect(smallDFA, DFA2, intersectDFA(smallDFA, DFA2));
if (intersectTest) {
  console.error(intersectTest);
} else {
  console.log("Success on DFA intersection!")
}

console.log("unioned DFA: ", JSON.stringify(unionDFA(smallDFA, DFA2)));
const unionTest = testUnion(smallDFA, DFA2, unionDFA(smallDFA, DFA2));
if (unionTest) {
  console.error(unionTest);
} else {
  console.log("Success on DFA union!")
}

console.log("is empty: ", isEmptyDFA(smallDFA));
const emptyMessage = testIsEmpty(smallDFA, isEmptyDFA(smallDFA));
if (emptyMessage) {
  console.error(emptyMessage);
} else {
  console.log("Success on DFA emptiness!")
}

console.log("is equivalent: ", isEquivalent(smallDFA, largeDFA));
let equivalentMessage = testEquivalent(smallDFA, largeDFA, isEquivalent(smallDFA, largeDFA));
if (equivalentMessage) {
  console.error(equivalentMessage);
} else {
  console.log("Success on DFA equivalence!")
}
  console.log("is equivalent: ", isEquivalent(smallDFA, DFA2));
equivalentMessage = testEquivalent(smallDFA, largeDFA, isEquivalent(smallDFA, DFA2));
if (equivalentMessage) {
  console.error(equivalentMessage);
} else {
  console.log("Success on DFA equivalence!")
}
`;

const baseCodePy = `\
# Feel free to use print to help debug your code - you can see the log on the screen or in the console (F12)

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

# For your testing, you can use the following methods:
# testInvert(dfa, result) - returns null if result is indeed the inverted form of dfa. Otherwise, a string with an error message if it is incorrect
# testIntersect(dfa1, dfa2, result) - returns null if result is indeed the intersection of dfa1 and dfa2. Otherwise, a string with an error message if it is incorrect
# testUnion(dfa1, dfa2, result) - returns null if result is indeed the union of dfa1 and dfa2. Otherwise, a string with an error message if it is incorrect
# testIsEmpty(dfa, result) - returns null if result is indeed the correct answer to whether the DFA is empty. Otherwise, a string with an error message if it is incorrect
# testEquivalent(dfa1, dfa2, result) - returns null if result is indeed the correct answer to whether the DFAs are equivalent. Otherwise, a string with an error message if it is incorrect

import json
from types import SimpleNamespace
from dfa import testInvert, testIntersect, testUnion, testIsEmpty, testEquivalent

smallDFA = json.loads('{"states":[{"name":"A","position":{"x":319.746875,"y":166.79999999999995},"accepting":false,"starting":true},{"name":"B","position":{"x":708.1624999999999,"y":161.68593749999997},"accepting":false,"starting":false},{"name":"C","position":{"x":505.15156249999995,"y":411.2812499999999},"accepting":true,"starting":false}],"alphabet":["a","b","c"],"transitions":[{"from":"A","to":"A","label":"a","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"A","to":"B","label":"b, c","style":{"edgeAnchor":{"x":-10.209375000000023,"y":-46.29374999999999}}},{"from":"B","to":"A","label":"a","style":{"edgeAnchor":{"x":-1.3218749999999773,"y":35.17499999999998}}},{"from":"B","to":"B","label":"b","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"C","to":"A","label":"a","style":{}},{"from":"B","to":"C","label":"c","style":{"edgeAnchor":{"x":-22.59375,"y":-16.01249999999999}}},{"from":"C","to":"C","label":"b","style":{"loopOffset":{"x":-113.47031249999998,"y":-13.931249999999977}}},{"from":"C","to":"B","label":"c","style":{"edgeAnchor":{"x":34.284374999999955,"y":15.956250000000011}}}]}')
largeDFA = json.loads('{"states":[{"name":"A","position":{"x":286.578125,"y":57.243749999999984},"accepting":false,"starting":true},{"name":"B","position":{"x":78.884375,"y":222.18281249999995},"accepting":false,"starting":false},{"name":"C","position":{"x":869.3796874999998,"y":150.18749999999997},"accepting":false,"starting":false},{"name":"D","position":{"x":725.5015624999999,"y":56.13749999999999},"accepting":false,"starting":false},{"name":"E","position":{"x":424.54531249999997,"y":343.62187499999993},"accepting":false,"starting":false},{"name":"F","position":{"x":777.0031249999998,"y":355.26562499999994},"accepting":false,"starting":false},{"name":"G","position":{"x":189.18124999999998,"y":411.0703124999999},"accepting":true,"starting":false},{"name":"H","position":{"x":624.9124999999999,"y":452.9531249999999},"accepting":true,"starting":false}],"alphabet":["a","b","c"],"transitions":[{"from":"A","to":"B","label":"a","style":{}},{"from":"B","to":"B","label":"a","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"B","to":"F","label":"b","style":{}},{"from":"B","to":"E","label":"c","style":{}},{"from":"D","to":"E","label":"b","style":{}},{"from":"D","to":"H","label":"c","style":{}},{"from":"E","to":"C","label":"a","style":{}},{"from":"E","to":"F","label":"b","style":{}},{"from":"E","to":"G","label":"c","style":{}},{"from":"F","to":"D","label":"b","style":{}},{"from":"F","to":"H","label":"c","style":{}},{"from":"G","to":"B","label":"a","style":{}},{"from":"G","to":"G","label":"b","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"G","to":"D","label":"c","style":{}},{"from":"H","to":"A","label":"a","style":{}},{"from":"H","to":"G","label":"b","style":{}},{"from":"H","to":"E","label":"c","style":{}},{"from":"A","to":"D","label":"b, c","style":{"edgeAnchor":{"x":-0.009374999999977263,"y":-19.415625}}},{"from":"C","to":"F","label":"b, c","style":{"edgeAnchor":{"x":-7.078125,"y":8.057812500000011}}},{"from":"F","to":"C","label":"a","style":{"edgeAnchor":{"x":33.76875000000007,"y":90.74531249999998}}},{"from":"D","to":"A","label":"a","style":{"edgeAnchor":{"x":2.0437499999999886,"y":35.32499999999999}}},{"from":"C","to":"A","label":"a","style":{"edgeAnchor":{"x":-19.5234375,"y":53.79843749999998}}}]}')
DFA2 = json.loads('{"states":[{"name":"A","position":{"x":300.8328125,"y":203.64843749999994},"accepting":false,"starting":true},{"name":"B","position":{"x":653.2999999999998,"y":213.18281249999995},"accepting":true,"starting":false}],"alphabet":["a","b","c"],"transitions":[{"from":"A","to":"B","label":"a, b","style":{"edgeAnchor":{"x":0,"y":-59.64374999999998}}},{"from":"B","to":"A","label":"a, b","style":{"edgeAnchor":{"x":0.5578124999999545,"y":26.13749999999999}}},{"from":"A","to":"A","label":"c","style":{"loopOffset":{"x":0,"y":-75}}},{"from":"B","to":"B","label":"c","style":{"loopOffset":{"x":0,"y":-75}}}]}')

def invertDFA(dfa):
    # Given a DFA, return a new DFA that accepts all words that were rejected by the original DFA,
    # and rejects all words previously accepted.
    # You should return an object with the same format.
    return {
        "states": dfa["states"],
        "alphabet": dfa["alphabet"],
        "transitions": dfa["transitions"],
    }

def intersectDFA(dfa1, dfa2):
    # Given two DFAs, return a new DFA that accepts a word if it is accepted by both dfa1 *and* dfa2.
    # You should return an object with the same format.

    return {
        "states": dfa1["states"],
        "alphabet": dfa1["alphabet"],
        "transitions": dfa1["transitions"],
    }

def unionDFA(dfa1, dfa2):
    # Given two DFAs, return a new DFA that accepts a word if it is accepted by either dfa1 *or* dfa2.
    # You should return an object with the same format.

    return {
        "states": dfa1["states"],
        "alphabet": dfa1["alphabet"],
        "transitions": dfa1["transitions"],
    }

def isEmptyDFA(dfa):
    # Given a DFA, determines whether this DFA accepts any words.
    # If the DFA accepts any words, return false. Otherwise, return true.
    return False

def isEquivalent(dfa1, dfa2):
    # Given two DFAs, determines whether they accept exactly the same language.
    # If the DFAs accept the same language, return true. Otherwise, return false.
    return True

print("inverted DFA:", invertDFA(smallDFA))
inversionMessage = testInvert(smallDFA, invertDFA(smallDFA))
if inversionMessage:
    print("ERROR", inversionMessage)
else:
    print("Success on DFA inversion!")

print("intersected DFA:", intersectDFA(smallDFA, DFA2))
intersectTest = testIntersect(smallDFA, DFA2, intersectDFA(smallDFA, DFA2))
if intersectTest:
    print("ERROR", intersectTest)
else:
    print("Success on DFA intersection!")

print("unioned DFA:", unionDFA(smallDFA, DFA2))
unionTest = testUnion(smallDFA, DFA2, unionDFA(smallDFA, DFA2))
if unionTest:
    print("ERROR", unionTest)
else:
    print("Success on DFA union!")

print("is empty:", isEmptyDFA(smallDFA))
emptyMessage = testIsEmpty(smallDFA, isEmptyDFA(smallDFA))
if emptyMessage:
    print("ERROR", emptyMessage)
else:
    print("Success on DFA emptiness!")


print("is equivalent:", isEquivalent(smallDFA, largeDFA))
equivalentMessage = testEquivalent(smallDFA, largeDFA, isEquivalent(smallDFA, largeDFA))
if equivalentMessage:
    print("ERROR", equivalentMessage)
else:
    print("Success on DFA equivalence!")

print("is equivalent:", isEquivalent(smallDFA, DFA2))
equivalentMessage = testEquivalent(smallDFA, DFA2, isEquivalent(smallDFA, DFA2));
if equivalentMessage:
    print("ERROR", equivalentMessage)
else:
    print("Success on DFA equivalence!")
`

const contentText = `
<p>Implement the following methods for transforming DFAs into other DFAs.</p>

<p>There are no tests provided for this task, so you will need to test your code yourself.</p>

<p>In order to easily test your code, you can use the playground below to create a DFA, then press the "Export" button to copy the full dfa to your clipboard.
You can then paste this into your code to test your functions.</p>

<p>That being said, 3 DFAs have been provided. smallDFA and largeDFA are equivalent, but not equivalent to DFA2</p>

<p>
You can also <code>console.log()/print()</code> a DFA, copy the object, then press the "Import" button to view a DFA in the playground.
</p>

<a id="runButton" class="button runButton">Run Code</a>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();

  addCode('dfaModify', {
    'JS': baseCode,
    'Py': baseCodePy,
  });

  document.getElementById('dfaModify-container').classList.add('editor-long');

  addScene('dfa_modify', document.querySelector('.articleBodyCenter'));
  const algorithmContainer = document.querySelector('#dfa_modify');
  const algorithmSteps = new StepScenes(algorithmContainer, "dfa_modify", [{}], () => {
    markComplete('dfaModify');
  }, true);

  registerScene(dfaPlayground.loader, dfaPlayground.unloader, 'dfa_modify', {}, algorithmSteps.makeOnSuccess(), algorithmSteps.makeOnFailure());

  window.onPyBeginLoading = () => {
    document.getElementById('runButton').disabled = true;
  }
  window.onPyDoneLoading = () => {
    document.getElementById('runButton').disabled = false;
  }

  document.getElementById('runButton').addEventListener('click', () => {
    const testInvert = (dfa, result) => {
      const original = new DFA();
      original.import(dfa);
      const inverted = new DFA();
      inverted.import(result);
      const eq = original.invert().equivalent(inverted);
      if (eq) {
        return null;
      } else {
        const comb = original.invert().combine(inverted, ((me, other) => !!me !== !!other));
        const word = comb.findAcceptingString();
        const originalAccepts = original.simulateWord(word) === "Accept";
        return "Inverted DFA is incorrect. Both dfa and result " + (originalAccepts ? "accept" : "reject") + " the word '" + word + "'";
      }
    }

    const testIntersect = (dfa1, dfa2, result) => {
      const dfa1Obj = new DFA();
      dfa1Obj.import(dfa1);
      const dfa2Obj = new DFA();
      dfa2Obj.import(dfa2);
      const combined = dfa1Obj.combine(dfa2Obj, (a, b) => a && b);
      const resultObj = new DFA();
      resultObj.import(result);
      const eq = resultObj.equivalent(combined);
      if (eq) {
        return null;
      } else {
        const comb = combined.combine(resultObj, ((me, other) => !!me !== !!other));
        const word = comb.findAcceptingString();
        const dfa1Accepts = dfa1Obj.simulateWord(word) === "Accept";
        const dfa2Accepts = dfa2Obj.simulateWord(word) === "Accept";
        const resultAccepts = resultObj.simulateWord(word) === "Accept";
        return "Result DFA is not equivalent to intersection of originals. The result dfa " + (resultAccepts ? "accepts" : "rejects") + " the word '" + word + "', while the original DFAs " + (dfa1Accepts ? "accept" : "reject") + " and " + (dfa2Accepts ? "accept" : "reject") + " it";
      }
    }

    const testUnion = (dfa1, dfa2, result) => {
      const dfa1Obj = new DFA();
      dfa1Obj.import(dfa1);
      const dfa2Obj = new DFA();
      dfa2Obj.import(dfa2);
      const combined = dfa1Obj.combine(dfa2Obj, (a, b) => a || b);
      const resultObj = new DFA();
      resultObj.import(result);
      const eq = resultObj.equivalent(combined);
      if (eq) {
        return null;
      } else {
        const comb = combined.combine(resultObj, ((me, other) => !!me !== !!other));
        const word = comb.findAcceptingString();
        const dfa1Accepts = dfa1Obj.simulateWord(word) === "Accept";
        const dfa2Accepts = dfa2Obj.simulateWord(word) === "Accept";
        const resultAccepts = resultObj.simulateWord(word) === "Accept";
        return "Result DFA is not equivalent to union of originals. The result dfa " + (resultAccepts ? "accepts" : "rejects") + " the word '" + word + "', while the original DFAs " + (dfa1Accepts ? "accept" : "reject") + " and " + (dfa2Accepts ? "accept" : "reject") + " it";
      }
    }

    const testIsEmpty = (dfa, result) => {
      const dfaObj = new DFA();
      dfaObj.import(dfa);
      const isEmpty = dfaObj.empty();
      if (isEmpty === result) {
        return null;
      } else {
        const word = dfaObj.findAcceptingString();
        return "Result is incorrect. The dfa " + (word ? ("accepts the word '" + word + "'") : "rejects all words") + " but result is " + (result ? "true" : "false");
      }
    }

    const testEquivalent = (dfa1, dfa2, result) => {
      const dfa1Obj = new DFA();
      dfa1Obj.import(dfa1);
      const dfa2Obj = new DFA();
      dfa2Obj.import(dfa2);
      const eq = dfa1Obj.equivalent(dfa2Obj);
      if (eq === result) {
        return null;
      } else if (!eq) {
        const comb = dfa1Obj.combine(dfa2Obj, ((me, other) => !!me !== !!other));
        const word = comb.findAcceptingString();
        const dfa1Accepts = dfa1Obj.simulateWord(word) === "Accept";
        const dfa2Accepts = dfa2Obj.simulateWord(word) === "Accept";
        return "Result is incorrect. The DFAs are not equivalent, as dfa1 " + (dfa1Accepts ? "accepts" : "rejects") + " the word '" + word + "', while dfa2 " + (dfa2Accepts ? "accepts" : "rejects") + " it";
      } else {
        return "Result is incorrect. The DFAs are equivalent, but result is false";
      }
    }

    async function testPy (code) {
      window.onPyBeginLoading();
      let pyodide = await loadPyodide();
      pyodide.setStdout({batched: newLog()});
      pyodide.registerJsModule("dfa", { testInvert, testIntersect, testUnion, testIsEmpty, testEquivalent });
      pyodide.runPython(pythonPreamble);
      pyodide.runPython(code);
      window.onPyDoneLoading();
      return null;
      // return pyodide.globals.get('evaluate_dfa');
    }

    async function testJS (code) {
      var console = console || {}; console.log = newLog();
      const evaluateDFA = eval(`\
      (function() {
        ${code}
        return {};
      }())`);
      return Promise.resolve(evaluateDFA);
    }

    const test = window.currentTab['dfaModify'] === 'JS' ? testJS : testPy;
    test(window.getCode['dfaModify']());
  });
}

export default addContent;
