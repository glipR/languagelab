import { addScene, registerScene } from '../templates/scene.js';
import dfaMinimise from '../anims/dfa_minimise.js';
import { StepScenes } from '../utils.js';
import { isComplete, markComplete } from '../tools/completion.js';

const curNumBlobs = (GS) => {
  return new Set(GS.dfa.rows.map(row => row.curKey)).size
}
export const minimiseTasks = [{
  table: {
    alphabet: "ab",
    rows: [
      { head: "A", cells: "AC" },
      { head: "B", cells: "EA" },
      { head: "C", cells: "AF" },
      { head: "D", cells: "EF" },
      { head: "E", cells: "AD" },
      { head: "F", cells: "AF", accepting: true },
      { head: "G", cells: "BF", accepting: true, starting: true },
    ],
    graph: {
      states: [
        { name: "A+E", position: { x: 100, y: 200 } },
        { name: "B", position: { x: 350, y: 100 } },
        { name: "C+D", position: { x: 100, y: 450 } },
        { name: "F", position: { x: 500, y: 450 }, accepting: true },
        { name: "G", position: { x: 500, y: 200 }, accepting: true, starting: true },
      ],
      transitions: [
        { from: "A+E", to: "A+E", label: "a", style: { toRadius: true } },
        { from: "A+E", to: "C+D", label: "b", style: { toRadius: true, edgeAnchor: { x: 20, y: 0 } } },
        { from: "B", to: "A+E", label: "a, b", style: { toRadius: true } },
        { from: "C+D", to: "A+E", label: "a", style: { toRadius: true, edgeAnchor: { x: -20, y: 0 } } },
        { from: "C+D", to: "F", label: "b", style: { toRadius: true } },
        { from: "F", to: "A+E", label: "a", style: { toRadius: true } },
        { from: "F", to: "F", label: "b", style: { toRadius: true, loopOffset: { x: 30, y: -30 } } },
        { from: "G", to: "B", label: "a", style: { toRadius: true } },
        { from: "G", to: "F", label: "b", style: { toRadius: true } },
      ],
    }
  },
  progress: {
    instructions: [
      { // 0
        text: "Click to select all of the rows for accepting states and then click the 'Split' button to split them into a separate glob.",
        isComplete: (GS, task) => {
          return curNumBlobs(GS) >= 2;
        }
      },
      { // 1
        text: "Find some states of the same colour that have different colours for the transitions. Select all same-coloured rows that share the same transition colouring as one of these states and click the 'Split' button to split them into a separate glob.",
        isComplete: (GS, task) => {
          return curNumBlobs(GS) >= 3;
        }
      },
      { // 2
        text: "Find some states of the same colour that have different colours for the transitions. Select all same-coloured rows that share the same transition colouring as one of these states and click the 'Split' button to split them into a separate glob.",
        isComplete: (GS, task) => {
          return curNumBlobs(GS) >= 4;
        }
      },
      { // 3
        text: "Find some states of the same colour that have different colours for the transitions. Select all same-coloured rows that share the same transition colouring as one of these states and click the 'Split' button to split them into a separate glob.",
        isComplete: (GS, task) => {
          return curNumBlobs(GS) >= 5;
        }
      },
      { // 4
        text: "Click the 'Check' button to double-check that you've split the states correctly!",
        isComplete: (GS, task) => {
          return GS.solved;
        }
      }
    ],
  }
}, {
  table: {
    alphabet: "01",
    rows: [
      { head: "A", cells: "BC", starting: true },
      { head: "B", cells: "AE" },
      { head: "C", cells: "AF" },
      { head: "D", cells: "AF", accepting: true },
      { head: "E", cells: "BD", accepting: true },
      { head: "F", cells: "CD", accepting: true },
    ],
    graph: {
      states: [
        { name: "A", position: { x: 300, y: 100 }, starting: true },
        { name: "B+C", position: { x: 450, y: 250 } },
        { name: "D", position: { x: 150, y: 250 }, accepting: true },
        { name: "E+F", position: { x: 300, y: 450 }, accepting: true },
      ],
      transitions: [
        { from: "A", to: "B+C", label: "01", style: { toRadius: true, edgeAnchor: { x: -20, y: 20 }, anchorOffsetMult: 0.5 } },
        { from: "B+C", to: "A", label: "0", style: { toRadius: true, edgeAnchor: { x: 20, y: -20 }, anchorOffsetMult: 0.5 } },
        { from: "B+C", to: "E+F", label: "1", style: { toRadius: true, edgeAnchor: { x: -20, y: -20 }, anchorOffsetMult: 0.5 } },
        { from: "D", to: "A", label: "0", style: { toRadius: true } },
        { from: "D", to: "E+F", label: "1", style: { toRadius: true, edgeAnchor: { x: 20, y: -20 } } },
        { from: "E+F", to: "B+C", label: "0", style: { toRadius: true, edgeAnchor: { x: 20, y: 20 }, anchorOffsetMult: 0.5 } },
        { from: "E+F", to: "D", label: "1", style: { toRadius: true, edgeAnchor: { x: -20, y: 20 } } },
      ],
    }
  },
  progress: {
    instructions: [{
      text: "Minimise the DFA, then click 'Check' to see if you're correct!",
      isComplete: (GS, task) => {
        return GS.solved;
      }
    }]
  }
}, {
  table: {
    alphabet: "abc",
    rows: [
      { head: "A", cells: "BDA", starting: true },
      { head: "B", cells: "DAF" },
      { head: "C", cells: "EBF" },
      { head: "D", cells: "BAD" },
      { head: "E", cells: "FCG" },
      { head: "F", cells: "GGC", accepting: true },
      { head: "G", cells: "FFD", accepting: true },
    ],
    graph: {
      states: [
        { name: "A+D", position: { x: 100, y: 200 }, starting: true },
        { name: "B", position: { x: 300, y: 50 } },
        { name: "C", position: { x: 450, y: 200 } },
        { name: "E", position: { x: 450, y: 450 } },
        { name: "F", position: { x: 250, y: 300 }, accepting: true },
        { name: "G", position: { x: 100, y: 450 }, accepting: true },
      ],
      transitions: [
        { from: "A+D", to: "B", label: "a", style: { toRadius: true, edgeAnchor: { x: -20, y: -20 } } },
        { from: "A+D", to: "A+D", label: "b, c", style: { toRadius: true } },
        { from: "B", to: "A+D", label: "a, b", style: { toRadius: true, edgeAnchor: { x: 20, y: 20 } } },
        { from: "B", to: "F", label: "c", style: { toRadius: true } },
        { from: "C", to: "E", label: "a", style: { toRadius: true, edgeAnchor: { x: 25, y: 0 } } },
        { from: "C", to: "B", label: "b", style: { toRadius: true } },
        { from: "C", to: "F", label: "c", style: { toRadius: true, edgeAnchor: { x: -5, y: -20 } } },
        { from: "E", to: "F", label: "a", style: { toRadius: true } },
        { from: "E", to: "C", label: "b", style: { toRadius: true, edgeAnchor: { x: -25, y: 0 } } },
        { from: "E", to: "G", label: "c", style: { toRadius: true } },
        { from: "F", to: "G", label: "a, b", style: { toRadius: true, edgeAnchor: { x: -12, y: -12 } } },
        { from: "F", to: "C", label: "c", style: { toRadius: true, edgeAnchor: { x: 5, y: 20 } } },
        { from: "G", to: "F", label: "a, b", style: { toRadius: true, edgeAnchor: { x: 12, y: 12 } } },
        { from: "G", to: "A+D", label: "c", style: { toRadius: true } },
      ],
    }
  },
  progress: {
    instructions: [{
      text: "Minimise the DFA, then click 'Check' to see if you're correct!",
      isComplete: (GS, task) => {
        return GS.solved;
      }
    }]
  }
}, {
  table: {
    alphabet: "012",
    rows: [
      { head: "A", cells: "BFC", starting: true },
      { head: "B", cells: "AEB" },
      { head: "C", cells: "BFA" },
      { head: "D", cells: "CGD" },
      { head: "E", cells: "AGE", accepting: true },
      { head: "F", cells: "HAD", accepting: true },
      { head: "G", cells: "BEE", accepting: true },
      { head: "H", cells: "FCD", accepting: true },
    ],
    graph: {
      states: [
        { name: "A+C", position: { x: 350, y: 100 }, starting: true },
        { name: "B", position: { x: 500, y: 300 } },
        { name: "D", position: { x: 100, y: 300 } },
        { name: "E", position: { x: 450, y: 550 }, accepting: true },
        { name: "F+H", position: { x: 275, y: 350 }, accepting: true },
        { name: "G", position: { x: 150, y: 550 }, accepting: true },
      ],
      transitions: [
        { from: "A+C", to: "B", label: "0", style: { toRadius: true, edgeAnchor: { x: 15, y: -15 } } },
        { from: "A+C", to: "F+H", label: "1", style: { toRadius: true, edgeAnchor: { x: -20, y: 0 } } },
        { from: "A+C", to: "A+C", label: "2", style: { toRadius: true, loopOffset: { x: 30, y: -10 } } },
        { from: "B", to: "A+C", label: "0", style: { toRadius: true, edgeAnchor: { x: -15, y: 15 } } },
        { from: "B", to: "E", label: "1", style: { toRadius: true } },
        { from: "B", to: "B", label: "2", style: { toRadius: true, loopOffset: { x: 20, y: -30} } },
        { from: "D", to: "A+C", label: "0", style: { toRadius: true } },
        { from: "D", to: "G", label: "1", style: { toRadius: true } },
        { from: "D", to: "D", label: "2", style: { toRadius: true } },
        { from: "E", to: "A+C", label: "0", style: { toRadius: true } },
        { from: "E", to: "G", label: "1", style: { toRadius: true, edgeAnchor: { x: 0, y: 20 } } },
        { from: "E", to: "E", label: "2", style: { toRadius: true, loopOffset: { x: 20, y: -30} } },
        { from: "F+H", to: "F+H", label: "0", style: { toRadius: true, loopOffset: { x: -20, y: -30 } } },
        { from: "F+H", to: "A+C", label: "1", style: { toRadius: true, edgeAnchor: { x: 20, y: 0 } } },
        { from: "F+H", to: "D", label: "2", style: { toRadius: true } },
        { from: "G", to: "B", label: "0", style: { toRadius: true, edgeAnchor: { x: 15, y: 15 } } },
        { from: "G", to: "E", label: "1, 2", style: { toRadius: true, edgeAnchor: { x: 0, y: -20 } } },
      ],
    }
  },
  progress: {
    instructions: [{
      text: "Minimise the DFA, then click 'Check' to see if you're correct!",
      isComplete: (GS, task) => {
        return GS.solved;
      }
    }]
  }
}];

const contentText = `
Let's execute the DFA Minimisation algorithm on a few DFAs. Follow the instructions below and keep an eye on the right hand side of the screen to see how our predicted 'Globs' are changing as we go through the algorithm!
`

const progress = `
<p id="DFAMinimiseInstructions"></p>
<div id="DFAMinimiseProgressBorder" class="progressBorder">
  <div id="DFAMinimiseProgressBar" class="progressBar"></div>
</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('dfa_minimise', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  minimiseTasks.forEach(task => {
    task.progress.progressContainer = document.getElementById("DFAMinimiseProgressBorder");
    task.progress.progress = document.getElementById("DFAMinimiseProgressBar");
    task.progress.instructionText = document.getElementById("DFAMinimiseInstructions");
    task.progress.resetOnComplete =  false;
  })
  const minimiseContainer = document.querySelector('#dfa_minimise');
  const steps = new StepScenes(minimiseContainer, "dfa_minimise", minimiseTasks, () => {
    markComplete('regularDFAMinimisation');
    // Redirect to next page
    // TODO: Next page.
    window.location.href = "/pages/regular/dfa_form";
  }, true, null, { storageKey: 'regularDFAMinimisationProgress' });
  registerScene(dfaMinimise.loader, dfaMinimise.unloader, 'dfa_minimise', minimiseTasks[steps.progress.current], steps.makeOnSuccess(), steps.makeOnFailure());
}

export default addContent;
