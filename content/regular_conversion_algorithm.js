import { addScene, registerScene } from '../templates/scene.js';
import regexCategorise, { STATE_EQUAL } from '../anims/conversion_algorithm.js';
import { StepScenes } from '../utils.js';
import { isComplete, markComplete } from '../tools/completion.js';
import { bg_dark, black, darkPurple, green, purple, red } from '../colours.js';
import { TweenManager, ValueTween } from '../tween.js';

const badChars = ['*', '+', '|', '(', ')'];

const flashButton = ({ button, GS, color1=purple, color2=darkPurple, colorComplete=green }) => {
  let flashing = true;
  const tweenDark = new ValueTween(color1, color2, 30, GS.easings.easeInOutQuad, (v) => {
    if (flashing) {
      button.setFill(v);
    }
  });
  const tweenLight = new ValueTween(color2, color1, 30, GS.easings.easeInOutQuad, (v) => {
    if (flashing) {
      button.setFill(v);
    }
  });
  tweenDark.onComplete = () => {
    if (flashing) {
      TweenManager.add(tweenLight);
    }
  }
  tweenLight.onComplete = () => {
    if (flashing) {
      TweenManager.add(tweenDark);
    }
  }
  TweenManager.add(tweenDark);
  return () => {
    flashing = false;
    TweenManager.add(new ValueTween(button.opts.bg.fill, colorComplete, 30, GS.easings.easeInOutQuad, (v) => {
      button.setFill(v);
    }));
  }
}

const tasks = [{
  graph: {
    states: [
      { name: "A", position: { x: 100, y: 300 }, starting: true, accepting: false },
      { name: "B", position: { x: 250, y: 150 }, starting: false, accepting: false },
      { name: "C", position: { x: 250, y: 450 }, starting: false, accepting: false },
      { name: "D", position: { x: 400, y: 300 }, starting: false, accepting: true },
    ],
    transitions: [
      { from: "A", to: "B", label: "a*b" },
      { from: "A", to: "C", label: "b" },
      { from: "B", to: "D", label: "b" },
      { from: "C", to: "D", label: "(ab)|(baa*)" },
    ],
  },
  progress: {
    instructions: [
      { // 0
        text: "Press the Copy button to copy the NFA to the right",
        onStart: (GS, task, progress) => {
          return flashButton({ button: GS.copyButton, GS });
        },
        isComplete: (GS, task) => {
          console.log(GS.copyClicked);
          return GS.copyClicked;
        },
      },
      { // 1
        text: "Now, modify the right NFA to change the 'a*b' transition into something else that doesn't use regular expressions. Once you've done this, click the '?' button to compare the two NFAs, to ensure they still accept the same language.",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
          const edge = GS.draws[1].dfa.edges.find(e => e.style.edgeLabel === "a*b");
          TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
          return () => {
            TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
          }
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 2) return false;
          const regexTransitions = GS.draws[1].dfa.edges.filter(e => badChars.some(c => e.style.edgeLabel.includes(c)) ).map(t=>t.style.edgeLabel);
          console.log(regexTransitions);
          task.completed = (
            regexTransitions.length <= 1 && regexTransitions[0] === "(ab)|(baa*)"
            &&
            GS.compareState === STATE_EQUAL
          );
          return task.completed;
        },
      },
      { // 2
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 3 && GS.curIndex === 1;
          return task.completed;
        },
      },
      { // 3
        text: "Now, modify the right NFA to change the '(ab)|(baa*)' transition into something else that doesn't use regular expressions. Once you've done this, click the '?' button to compare the two NFAs, to ensure they still accept the same language.",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
          const edge = GS.draws[2].dfa.edges.find(e => e.style.edgeLabel === "(ab)|(baa*)");
          TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
          return () => {
            TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
          }
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 3) return false;
          const regexTransitions = GS.draws[2].dfa.edges.filter(e => badChars.some(c => e.style.edgeLabel.includes(c)) ).map(t=>t.style.edgeLabel);
          task.completed = (
            regexTransitions.length === 0
            &&
            GS.compareState === STATE_EQUAL
            &&
            GS.compareOriginal
          );
          return task.completed;
        },
      }
    ]
  }
}, {
  graph: {
    states: [
      { name: "A", position: { x: 100, y: 300 }, starting: true, accepting: false },
      { name: "B", position: { x: 400, y: 300 }, starting: false, accepting: true },
    ],
    transitions: [
      { from: "A", to: "B", label: "((a*)|b)ab(ab*a)*" },
    ],
  },
  progress: {
    instructions: [
      { // 0
        text: "Press the Copy button to copy the NFA to the right",
        onStart: (GS, task, progress) => {
          return flashButton({ button: GS.copyButton, GS });
        },
        isComplete: (GS, task) => {
          return GS.copyClicked;
        },
      },
      { // 1
        text: "Split the transition into 4 parts, representing the different concatenated parts of the Regular Expression. Once you've done this, click the '?' button to compare the two NFAs, to ensure they still accept the same language.",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
          const edge = GS.draws[1].dfa.edges.find(e => e.style.edgeLabel === "((a*)|b)ab(ab*a)*");
          if (edge) {
            TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
          }
          return () => {
            if (edge) {
              TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
            }
          }
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 2) return false;
          const transitions = GS.draws[1].dfa.edges.map(t=>t.style.edgeLabel);
          const first = transitions.find(t => t.includes("a*") && t.includes("|b"));
          const second = transitions.find(t => t.includes("ab*a"))
          task.completed = (
            transitions.length === 4
            && first
            && second
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      },
      { // 2
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 3 && GS.curIndex === 1;
          return task.completed;
        },
      },
      { // 3
        text: "Now, modify the right NFA to contain no regular expressions, but still be equivalent to the left NFA. Once you've done this, click the '?' button to compare the two NFAs, to ensure they still accept the same language.",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
          const edges = GS.draws[2].dfa.edges.filter(e => badChars.some(c => e.style.edgeLabel.includes(c)));
          edges.forEach(edge => {
            TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
          });
          return () => {
            edges.forEach(edge => {
              TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
            });
          }
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 3) return false;
          const regexTransitions = GS.draws[2].dfa.edges.filter(t => badChars.some(c => t.style.edgeLabel.includes(c))).map(t=>t.style.edgeLabel);
          task.completed = (
            regexTransitions.length === 0
            && GS.compareState === STATE_EQUAL
            && GS.compareOriginal
          )
          return task.completed;
        }
      }
    ]
  },
}, {
  graph: {
    states: [
      { name: "A", position: { x: 100, y: 150 }, starting: true, accepting: false },
      { name: "B", position: { x: 400, y: 150 }, starting: false, accepting: false },
      { name: "C", position: { x: 100, y: 350 }, starting: false, accepting: false },
      { name: "D", position: { x: 400, y: 350 }, starting: false, accepting: true },
    ],
    transitions: [
      { from: "A", to: "B", label: "b" },
      { from: "A", to: "C", label: "a" },
      { from: "B", to: "B", label: "a" },
      { from: "B", to: "D", label: "b" },
      { from: "C", to: "C", label: "b" },
      { from: "C", to: "B", label: "b" },
      { from: "C", to: "D", label: "a" },
    ],
  },
  progress: {
    instructions: [
      { // 0
        text: "Press the Copy button to copy the NFA to the right",
        onStart: (GS, task, progress) => {
          GS.reduceCheckIndex = 0;
          return flashButton({ button: GS.copyButton, GS });
        },
        isComplete: (GS, task) => {
          return GS.copyClicked;
        },
      },
      { // 1
        text: "Modify the right NFA to remove the top-right state, adding new transitions to simulate this state. Once you've done this, click the '?' button to compare the two NFAs, to ensure they still accept the same language.",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
          const node = Object.values(GS.draws[1].dfa.nodes).find(n => n.label === "B");
          TweenManager.add(node.tweenColor(red, 60, GS.easings.easeInOutQuad));
          return () => {
            // TweenManager.add(node.tweenColor(bg_dark, 60, GS.easings.easeInOutQuad));
          }
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 2) return false;
          const states = Object.values(GS.draws[1].dfa.nodes).map(n => n.label);
          task.completed = (
            states.length <= 3
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      },
      { // 2
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 3 && GS.curIndex === 1;
          return task.completed;
        },
      },
      { // 3
        text: "Modify the right NFA to consolidate multiple transitions between the same states (And press the '?' button to compare the two NFAs)",
        onStart: (GS, task, progress) => {
          const edgeMapArray = GS.draws[2].dfa.edges.reduce((acc, edge) => {
            const key = `${edge.from.label}->${edge.to.label}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(edge);
            return acc;
          }, {});
          if (Object.values(edgeMapArray).filter(edges => edges.length > 1).length === 0) {
            // We need to skip the next step, and also mark the index to look at in the next steps to reduce by 1.
            progress.instructions[4].completed = true;
            GS.reduceCheckIndex --;
          }
          Object.values(edgeMapArray).filter(edges => edges.length > 1).forEach(edges => {
            edges.forEach(edge => {
              TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
            });
          });
          return () => {
            Object.values(edgeMapArray).filter(edges => edges.length > 1).forEach(edges => {
              edges.forEach(edge => {
                TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
              });
            });
          }
        },
        isComplete: (GS, task) => {
          if (GS.draws.length < 3) return false;
          if (task.completed) return true;
          const edgeMapArray = GS.draws[2].dfa.edges.reduce((acc, edge) => {
            const key = `${edge.from.label}->${edge.to.label}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(edge);
            return acc;
          }, {});
          console.log(edgeMapArray);
          task.completed = (
            Object.values(edgeMapArray).filter(edges => edges.length > 1).length === 0
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      },
      { // 4
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 4 && GS.curIndex === 2;
          return task.completed;
        },
      },
      { // 5
        text: "Now remove the final non-starting and non-accepting state, adding new transitions to simulate this state. Once you've done this, click the '?' button to compare the two NFAs, to ensure they still accept the same language.",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
          const node = Object.values(GS.draws[3+GS.reduceCheckIndex].dfa.nodes).find(n => !n.style.doubleBorder && !n.style.isEntry);
          TweenManager.add(node.tweenColor(red, 60, GS.easings.easeInOutQuad));
          return () => {}
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 4+GS.reduceCheckIndex) return false;
          const states = Object.values(GS.draws[3+GS.reduceCheckIndex].dfa.nodes).map(n => n.label);
          task.completed = (
            states.length <= 2
            && GS.compareState === STATE_EQUAL
            && GS.compareOriginal
          );

          const edgeMapArray = GS.draws[3+GS.reduceCheckIndex].dfa.edges.reduce((acc, edge) => {
            const key = `${edge.from.label}->${edge.to.label}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(edge);
            return acc;
          }, {});
          if (task.completed && Object.values(edgeMapArray).filter(edges => edges.length > 1).length === 0) {
            // Next step should be completed early.
            progress.instructions[6].completed = true;
          }
          return task.completed;
        }
      },
      { // 6
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 5+GS.reduceCheckIndex && GS.curIndex === 3+GS.reduceCheckIndex;
          return task.completed;
        },
      },
      {
        text: "Now consolidate the remaining transitions between the same states (And press the '?' button to compare the two NFAs)",
        onStart: (GS, task) => {
          const edgeMapArray = GS.draws[4+GS.reduceCheckIndex].dfa.edges.reduce((acc, edge) => {
            const key = `${edge.from.label}->${edge.to.label}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(edge);
            return acc;
          }, {});
          Object.values(edgeMapArray).filter(edges => edges.length > 1).forEach(edges => {
            edges.forEach(edge => {
              TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
            });
          });
          return () => {
            Object.values(edgeMapArray).filter(edges => edges.length > 1).forEach(edges => {
              edges.forEach(edge => {
                TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
              });
            });
          }
        },
        isComplete: (GS, task) => {
          if (GS.draws.length < 5+GS.reduceCheckIndex) return false;
          if (task.completed) return true;
          const edgeMapArray = GS.draws[4+GS.reduceCheckIndex].dfa.edges.reduce((acc, edge) => {
            const key = `${edge.from.label}->${edge.to.label}`;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(edge);
            return acc;
          }, {});
          task.completed = (
            Object.values(edgeMapArray).filter(edges => edges.length > 1).length === 0
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      }
    ]
  },
}, {
  graph: {
    states: [
      { name: "A", position: { x: 100, y: 150 }, starting: true, accepting: true },
      { name: "B", position: { x: 400, y: 150 }, starting: false, accepting: true },
      { name: "C", position: { x: 400, y: 350 }, starting: false, accepting: true },
      { name: "D", position: { x: 100, y: 350 }, starting: false, accepting: false },
    ],
    transitions: [
      { from: "A", to: "B", label: "a" },
      { from: "B", to: "C", label: "a" },
      { from: "C", to: "D", label: "a" },
      { from: "D", to: "A", label: "a" },
      { from: "A", to: "A", label: "b" },
      { from: "A", to: "C", label: "b" },
    ],
  },
  progress: {
    instructions: [
      { // 0
        text: "Press the Copy button to copy the NFA to the right",
        onStart: (GS, task, progress) => {
          return flashButton({ button: GS.copyButton, GS });
        },
        isComplete: (GS, task) => {
          return GS.copyClicked;
        },
      },
      { // 1
        text: "Modify the right NFA to make it so there is only a single accepting state, then click the compare button",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          if (GS.draws.length < 2) return false;
          const acceptingStates = Object.values(GS.draws[1].dfa.nodes).filter(n => n.style.doubleBorder).map(n => n.label);
          task.completed = (
            acceptingStates.length === 1
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      },
      { // 2
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 3 && GS.curIndex === 1;
          return task.completed;
        },
      },
      { // 3
        text: "Remove one of the states from the right NFA, then click the compare button",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          const acceptingStates = Object.values(GS.draws[GS.curIndex+1].dfa.nodes).filter(n => n.style.doubleBorder).map(n => n.label);
          const states = Object.values(GS.draws[GS.curIndex+1].dfa.nodes).map(n => n.label);
          task.completed = (
            acceptingStates.length === 1
            && states.length <= 4
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      },
      { // 4
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 4 && GS.curIndex === 2;
          return task.completed;
        }
      },
      { // 5
        text: "Remove one of the states from the right NFA, then click the compare button",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          const acceptingStates = Object.values(GS.draws[GS.curIndex+1].dfa.nodes).filter(n => n.style.doubleBorder).map(n => n.label);
          const states = Object.values(GS.draws[GS.curIndex+1].dfa.nodes).map(n => n.label);
          task.completed = (
            acceptingStates.length === 1
            && states.length <= 3
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      },
      { // 6
        text: "Press the Right button to move to the next frame!",
        onStart: (GS, task) => {
          return flashButton({ button: GS.nextButton, GS });
        },
        isComplete: (GS, task) => {
          task.completed = !!task.completed || GS.draws.length >= 5 && GS.curIndex === 3;
          return task.completed;
        }
      },
      { // 7
        text: "Remove one of the states from the right NFA, then click the compare button",
        onStart: (GS, task) => {
          GS.compareButton.setFill(purple);
        },
        isComplete: (GS, task) => {
          if (task.completed) return true;
          const acceptingStates = Object.values(GS.draws[GS.curIndex+1].dfa.nodes).filter(n => n.style.doubleBorder).map(n => n.label);
          const states = Object.values(GS.draws[GS.curIndex+1].dfa.nodes).map(n => n.label);
          task.completed = (
            acceptingStates.length === 1
            && states.length <= 2
            && GS.compareState === STATE_EQUAL
          );
          return task.completed;
        }
      }
    ],
  },
}, {
  graph: {
    states: [
      { name: "A", position: { x: 100, y: 150 }, starting: true, accepting: true },
      { name: "B", position: { x: 400, y: 150 }, starting: false, accepting: false },
      { name: "C", position: { x: 100, y: 350 }, starting: false, accepting: true },
      { name: "D", position: { x: 250, y: 350 }, starting: false, accepting: false },
      { name: "E", position: { x: 400, y: 350 }, starting: false, accepting: true },
    ],
    transitions: [
      { from: "A", to: "B", label: "a" },
      { from: "A", to: "C", label: "a" },
      { from: "B", to: "B", label: "b" },
      { from: "B", to: "D", label: "b" },
      { from: "B", to: "E", label: "a" },
      { from: "C", to: "B", label: "b" },
      { from: "C", to: "C", label: "c", style: { loopOffset: { x:-45, y: -50}} },
      { from: "C", to: "D", label: "c" },
      { from: "D", to: "E", label: "c" },
      { from: "E", to: "C", label: "b", style: { edgeAnchor: {x: 0, y: 125}}}
    ],
  },
  progress: {
    instructions: [
      {
        text: "Convert the following NFA into an NFA with just three states (We won't do the last step because the regex gets too long, and it's just tedious). Use as many intermediate frames as you need!",
        isComplete: (GS, task) => {
          const dfa = GS.draws[GS.curIndex+1].dfa;
          return (
            Object.values(dfa.nodes).length <= 3
            && GS.compareState === STATE_EQUAL
            && GS.compareOriginal
          )
        }
      }
    ]
  }
}];

const contentText = `
Follow the instructions below to convert from regular expressions to NFAs and vice-versa!

Remember that:

<ul>
  <li>You can press ';' to add an epsilon to your transition.</li>
  <li>You can't mix and match transition/regex. 'a,bb' is not a valid transition. You would need to write 'a|(bb)'</li>
</ul>
`

const progress = `
<p id="regularConvertInstructions"></p>
<div id="regularConvertProgressBorder" class="progressBorder">
  <div id="regularConvertProgressBar" class="progressBar"></div>
</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('conversion_algorithm', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  // Now we can attach the arguments to progress
  tasks.forEach(task => {
    task.progress.progressContainer = document.getElementById("regularConvertProgressBorder");
    task.progress.progress = document.getElementById("regularConvertProgressBar");
    task.progress.instructionText = document.getElementById("regularConvertInstructions");
    task.progress.resetOnComplete =  false;
  })
  const algorithmContainer = document.querySelector('#conversion_algorithm');
  const steps = new StepScenes(algorithmContainer, "conversion_algorithm", tasks, () => {
    markComplete('regularConversionAlgorithm');
    // Redirect to next page
    window.location.href = "/pages/regular/pumping";
  }, true, null, { storageKey: 'regularConversionProgress', resetOnComplete: true });
  registerScene(regexCategorise.loader, regexCategorise.unloader, 'conversion_algorithm', tasks[steps.progress.current], steps.makeOnSuccess(), steps.makeOnFailure());
}

export default addContent;
