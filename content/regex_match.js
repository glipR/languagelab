import { addScene, registerScene } from '../templates/scene.js';
import regexMatch from '../anims/regex_match.js';
import { StepScenes } from '../utils.js';
import { markComplete } from '../tools/completion.js';

const tasks = [
  {
    description: "All words that start with the same letter they end with (Alphabet: a, b)",
    regex: "(a(a|b)*a)|(b(a|b)*b)|a|b",
    editStyle: {
      allowedChars: ['a', 'b', 'ε', '(', ')', '|', '*', '+'],
    }
  },
  {
    description: "All words not containing the substring 'ab' (Alphabet: a, b, c)",
    regex: "((aa*c)|b|c)*a*",
    editStyle: {
      allowedChars: ['a', 'b', 'c', 'ε', '(', ')', '|', '*', '+'],
    }
  },
  {
    description: "All words starting with a and with no adjacent letters that are equal (Alphabet: a, b, c)",
    regex: "a|((a((bc)+|(cb)+))+(a|ε))",
    editStyle: {
      allowedChars: ['a', 'b', 'c', 'ε', '(', ')', '|', '*', '+'],
    }
  }
];


const contentText = `
Let's write some Regular Expressions that match particular languages.

For each of the descriptions below, write a Regular Expression that matches the language described. Once you have written your Regular Expression, press 'Enter' to check if it is correct.
<br>
Also, we can use the symbol '+' to represent <span class="highlight-small highlight-blue">one</span> or more of the preceding character.
<br>
If you'd like, you can also use press the ';' key to insert the 'ε' character into your regex.
This should be particularly useful for the third problem.
`

const progress = `
<p id="regexMatchInstructions"></p>
<div id="regexMatchProgressBorder" class="progressBorder">
  <div id="regexMatchProgressBar" class="progressBar"></div>
</div>
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('regex_match', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const creationContainer = document.querySelector('#regex_match');
  const taskSteps = new StepScenes(creationContainer, "regex_match", tasks, () => {
    markComplete('regexMatch');
    // Redirect to next page
    window.location.href = "/pages/regex_game";

  }, false, tasks.map((task) => task.description), {
    progressContainer: document.getElementById("regexMatchProgressBorder"),
    progress: document.getElementById("regexMatchProgressBar"),
    instructionText: document.getElementById("regexMatchInstructions"),
    storageKey: 'regexMatchProgress',
  });
  registerScene(regexMatch.loader, regexMatch.unloader, 'regex_match', tasks[taskSteps.progress.current], taskSteps.makeOnSuccess(), taskSteps.makeOnFailure());
}

export default addContent;
