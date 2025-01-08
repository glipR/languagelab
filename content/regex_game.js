import { addScene, registerScene } from '../templates/scene.js';
import regexGame from '../anims/regex_game.js';
import { markComplete } from '../tools/completion.js';

const contentText = `
Let's lock in our understanding of Regular Expressions with a game!
<br>
This game has two players who play the game collaboratively - the <span class="highlight highlight-blue">CodeMaster</span> and the <span class="highlight highlight-orange">Sleuth</span>.

The CodeMaster will provide a Regular Expression (Called the 'secret', having a maximum of 12 characters), and the aim of the team is to communicate this Regular Expression to the Sleuth.
<br>
The team will achieve this by having the sleuth guess a Regular Expression, and in the event the Regular Expression is incorrect, the CodeMaster will specify a word that distinguishes the two Regular Expressions.

In other words, the CodeMaster will provide a word that is accepted by one of the Regular Expressions, but rejected by the other.
<br>
For example, suppose the CodeMaster Regular Expression was <span class="highlight highlight-blue">'aa*bb*'</span>,
and the Sleuth guesses <span class="highlight highlight-orange">'(a|b)b*'</span>.
The CodeMaster could provide the word <span class="highlight highlight-purple">'aaab'</span> to distinguish the two Regular Expressions,
since the CodeMaster Regular Expression accepts this word, but 'aaab' is rejected by the Sleuth's Regular Expression.

<div class="split-page">
<div class="split-img"><h3>CodeMaster POV</h3><img src="/img/regexGame/codemaster.png" /></div>
<div class="split-img"><h3>Sleuth POV</h3><img src="/img/regexGame/sleuth.png" /></div>
</div>

The game would then continue, allowing the Sleuth to make another guess.
<br>
Press the play button below to start the game. Each side of the game can be controlled by an AI collaborator, but if you've got a friend to play with, that's even better!

<div id="warningModal" class="modal modalFixed">
  <div class="imprint"></div>
  <div class="modalContent">
    <h2>Beep Booping...</h2>
      <p class="warningMsg"></p>
  </div>
  <div class="modalActions">
    <button id="warningClose" class="modalButton">Close</button>
  </div>
</div>
`

const progress = `
<p id="regexGameInstructions"></p>
<div id="regexGameProgressBorder" class="progressBorder">
  <div id="regexGameProgressBar" class="progressBar"></div>
</div>
`

const opts = {
  steps: [
    {
      text: "Play a game with the CodeMaster as a human.",
      isComplete: (GS, task, progress) => {
        return GS.games.filter(game => !game.codeMasterCPU).length > 0;
      },
    },
    {
      text: "Play a game with the Sleuth as a human.",
      isComplete: (GS, task, progress) => {
        return GS.games.filter(game => !game.sleuthCPU).length > 0;
      },
    },
    {
      text: "Play 3 games.",
      isComplete: (GS, task, progress) => {
        return GS.games.length >= 3;
      },
    },
  ],
  progress: {},
};

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  document.querySelector('.articleBodyCenter').insertAdjacentHTML('beforeend', progress);
  MathJax.typeset();
  addScene('regex_game', document.querySelector('.articleBodyCenter'), ['sceneFill']);

  opts.progress.progressContainer = document.getElementById("regexGameProgressBorder");
  opts.progress.progress = document.getElementById("regexGameProgressBar");
  opts.progress.instructionText = document.getElementById("regexGameInstructions");

  registerScene(regexGame.loader, regexGame.unloader, 'regex_game', opts, () => {
    markComplete('regexGame');
    window.location.href = "/pages/nfa_intro";
  }, null);
}

export default addContent;
