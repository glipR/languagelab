import { addScene, registerScene } from '../templates/scene.js';
import nfaConvert from '../anims/nfa_convert.js';
import NFAConvertTasks from '../graphs/nfaConvert.js'
import { StepScenes } from '../utils.js';
import { isComplete, markComplete } from '../tools/completion.js';
import { green, purple, red } from '../colours.js';

const convertTasks = [
  {
    nfa: NFAConvertTasks.t1JSON,
    alphabet: ["a", "b"],
    progress: {
      // No storage key - no progress.
      resetOnComplete: false,
      instructions: [
        { // 0
          text: "Select the first row of the table, so we can define our start state.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 0, purple);
          },
          isComplete: (GS, task, progress) => {
            // Once the next step is completed, we are also complete.
            return progress.current >=2 || GS.curSelected.x === 1 && GS.curSelected.y === 0;
          },
        },
        { // 1
          text: "Select all states that are reachable from the start state without reading any characters.",
          onStart: (GS, task) => {
            // Highlight all correct edges.
            return GS.highlightEpsilonsFromStates(['S'], green);
          },
          isComplete: (GS, task) => {
            return GS.data[1][0].toString() === ["A", "S"].toString();
          },
        },
        { // 2
          text: "Select the next column of the same row, to enter the states reachable after reading an 'a'.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 1, purple);
          },
          isComplete: (GS, task, progress) => {
            // Once the next step is completed, we are also complete.
            return progress.current >= 4 || GS.curSelected.x === 1 && GS.curSelected.y === 1;
          },
        },
        { // 3
          text: "Select all states that are reachable from S and A after reading an 'a'.",
          onStart: (GS, task) => {
            return GS.highlightCharacterPlusEpsilonsFromStates(['S', 'A'], 'a', red, green);
          },
          isComplete: (GS, task) => {
            return GS.data[1][1].toString() === ["D"].toString();
          },
        },
        { // 4
          text: "Select the next column of the same row, to enter the states reachable after reading a 'b'.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 2, purple);
          },
          isComplete: (GS, task, progress) => {
            // Once the next step is completed, we are also complete.
            return progress.current >= 6 || GS.curSelected.x === 1 && GS.curSelected.y === 2;
          },
        },
        { // 5
          text: "Select all states that are reachable from S and A after reading a 'b'. Don't forget epsilon transitions after the 'b' has been read!",
          onStart: (GS, task) => {
            return GS.highlightCharacterPlusEpsilonsFromStates(['S', 'A'], 'b', red, green);
          },
          isComplete: (GS, task) => {
            return GS.data[1][2].toString() === ["B", "C", "D"].toString();
          },
        },
        { // 6
          text: "Start off the next row by selecting the first cell.",
          onStart: (GS, task) => {
            return GS.highlightBorder(2, 0, purple);
          },
          isComplete: (GS, task, progress) => {
            // Once the next step is completed, we are also complete.
            return progress.current >= 8 || GS.curSelected.x === 2 && GS.curSelected.y === 0;
          },
        },
        { // 7
          text: "Shift-Click the 'D' state cell to copy the selection onto the next row.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 1, purple);
          },
          // Completion is reported by the animation.
        },
        { // 8
          text: "There are no states reachable from D after reading an 'a' or 'b', so let's go straight to the next row.",
          onStart: (GS, task) => {
            return GS.highlightBorder(3, 0, purple);
          },
          isComplete: (GS, task, progress) => {
            // Once the next step is completed, we are also complete.
            return progress.current >= 10 || GS.curSelected.x === 3 && GS.curSelected.y === 0;
          },
        },
        { // 9
          text: "Shift-Click the 'B/C/D' state cell to copy the selection onto the next row.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 2, purple);
          },
          // Completion is reported by the animation.
        },
        { // 10
          text: "Let's now select the next cell of the row.",
          onStart: (GS, task) => {
            return GS.highlightBorder(3, 1, purple);
          },
          isComplete: (GS, task, progress) => {
            // Once the next step is completed, we are also complete.
            return progress.current >= 12 || GS.curSelected.x === 3 && GS.curSelected.y === 1;
          },
        },
        { // 11
          text: "Select all states that are reachable from B, C, and D after reading a 'a'.",
          onStart: (GS, task) => {
            return GS.highlightCharacterPlusEpsilonsFromStates(['B', 'C', 'D'], 'a', red, green);
          },
          isComplete: (GS, task) => {
            return GS.data[3][1].toString() === ["A", "S"].toString();
          },
        },
        { // 12
          text: "There are no states reachable from B, C, and D after reading a 'b', so let's go straight to the next row.",
          onStart: (GS, task) => {
            return GS.highlightBorder(4, 0, purple);
          },
          isComplete: (GS, task, progress) => {
            return GS.curSelected.x === 4 && GS.curSelected.y === 0;
          },
        },
        { // 13
          text: "Now your conversion is complete, let's press the check button!",
          onStart: (GS, task) => {
            return GS.showArrow();
          },
          isComplete: (GS, task) => {
            return GS.matched;
          }
        }
      ]
    },
    solution: `
    Your conversion is correct! The DFA you've made looks like this:

    <img src="/img/convert/dfa1.png" />
    `
  },
  {
    nfa: NFAConvertTasks.t2JSON,
    alphabet: ["a", "b"],
    progress: {
      resetOnComplete: false,
      instructions: [
        { // 0
          text: "Select the first row of the table, and select all states that are reachable from the start state without reading any characters.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 0, purple);
          },
          isComplete: (GS, task) => {
            return GS.data[1][0].toString() === ["A", "S"].toString();
          },
        },
        { // 1
          text: "Select all states that are reachable from S and A after reading an 'a'.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 1, purple);
          },
          isComplete: (GS, task) => {
            return GS.correctTransition(1, 1);
          },
        },
        { // 2
          text: "Select all states that are reachable from S and A after reading a 'b'.",
          onStart: (GS, task) => {
            return GS.highlightBorder(1, 2, purple);
          },
          isComplete: (GS, task) => {
            return GS.correctTransition(1, 2);
          },
        },
        { // 3
          text: "Select the next row and make the first cell one of the unresolved sets of states (Use shift click or select the nodes manually).",
          onStart: (GS, task) => {
            return GS.highlightBorder(2, 0, purple);
          },
          isComplete: (GS, task) => {
            const data = GS.data[2][0].toString();
            return data.length > 0 && GS.validState(2, 0) && GS.uniqueHeader(2);
          },
        },
        { // 4
          text: "Select the next cells of the row, and select the states reachable after reading an 'a' or a 'b'.",
          onStart: (GS, task) => {
            const c1 = GS.highlightBorder(2, 1, purple);
            const c2 = GS.highlightBorder(2, 2, purple);
            return () => {
              c1();
              c2();
            }
          },
          isComplete: (GS, task, progress) => {
            if (progress.current < 4) return false;
            return GS.correctTransition(2, 1) && GS.correctTransition(2, 2);
          }
        },
        { // 5
          text: "Select the next row and make the first cell one of the unresolved sets of states.",
          onStart: (GS, task) => {
            return GS.highlightBorder(3, 0, purple);
          },
          isComplete: (GS, task) => {
            const data = GS.data[3][0].toString();
            return data.length > 0 && GS.validState(3, 0) && GS.uniqueHeader(3);
          },
        },
        { // 6
          text: "Select the next cells of the row, and select the states reachable after reading an 'a' or a 'b'.",
          onStart: (GS, task) => {
            const c1 = GS.highlightBorder(3, 1, purple);
            const c2 = GS.highlightBorder(3, 2, purple);
            return () => {
              c1();
              c2();
            }
          },
          isComplete: (GS, task, progress) => {
            if (progress.current < 6) return false;
            return GS.correctTransition(3, 1) && GS.correctTransition(3, 2);
          }
        },
        { // 7
          text: "Select the next row and make the first cell one of the unresolved sets of states.",
          onStart: (GS, task) => {
            return GS.highlightBorder(4, 0, purple);
          },
          isComplete: (GS, task) => {
            const data = GS.data[4][0].toString();
            return data.length > 0 && GS.validState(4, 0) && GS.uniqueHeader(4);
          },
        },
        { // 8
          text: "Select the next cells of the row, and select the states reachable after reading an 'a' or a 'b'.",
          onStart: (GS, task) => {
            const c1 = GS.highlightBorder(4, 1, purple);
            const c2 = GS.highlightBorder(4, 2, purple);
            return () => {
              c1();
              c2();
            }
          },
          isComplete: (GS, task, progress) => {
            if (progress.current < 8) return false;
            return GS.correctTransition(4, 1) && GS.correctTransition(4, 2);
          }
        },
        {
          text: "Now you should just have the empty row to complete, select the next row",
          onStart: (GS, task) => {
            return GS.highlightBorder(5, 0, purple);
          },
          isComplete: (GS, task) => {
            if (task.stateCompleted) return true;
            task.stateCompleted = GS.curSelected.x === 5 && GS.curSelected.y === 0;
            return task.stateCompleted;
          },
          stateCompleted: false,
        },
        {
          text: "Now let's press the check button to see if your conversion is correct!",
          onStart: (GS, task) => {
            return GS.showArrow();
          },
          isComplete: (GS, task) => {
            return GS.matched;
          }
        }
      ],
    },
    solution: `
    Your conversion is correct! The DFA you've made looks like this:

    <img src="/img/convert/dfa2.png" />
    `
  },
  {
    nfa: NFAConvertTasks.t3JSON,
    alphabet: ["a", "b"],
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
    Your conversion is correct! The DFA you've made looks like this:

    <img src="/img/convert/dfa3.png" />
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
