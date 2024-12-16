import { addIcon } from "../templates/icons.js";

const contentText = `\
<p>
Let's answer a few questions about NFAs/conversion to test your understanding.

<br>

For each of the questions, try writing your answer down in the box provided if you'd like, or write it down on a piece of paper. Once you're done, click on the "Show Answer" button to see the answer.

<br>

Need a hint? Feel free to click the "Hint" button to access the hints for a question.
</p>
`

const preQuivText = `\
<p>
  For the conversion questions below, describe how you would translate these language recognising machines into DFAs or NFAs.
</p>
`

const video = (src) => `<div class="aspect-ratio" style="margin-bottom: 20px"><iframe src="${src}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`

const addQuestion = (title, id, question, hint, solution) => {
  const questionDiv = document.createElement('div');
  questionDiv.classList.add('question');
  questionDiv.innerHTML = `
  <div class='questionHeaderContainer'>
    <h3>${title}</h3>
    <div class='questionButtons'>
      <button id="${id}HintButton" class='showHintButton questionButton'></button>
      <div id="${id}HintModal" class="modal modalFixed modalLarge">
        <div class="imprint"></div>
        <div class="modalContent">
          <h2>Hints</h2>
          ${hint}
        </div>
        <div class="modalActions">
          <button id="${id}HintButtonClose" class="modalButton">Close</button>
        </div>
      </div>
      <button id="${id}SolutionButton" class="showAnswerButton questionButton"></button>
      <div id="${id}SolutionModal" class="modal modalFixed modalLarge successModal">
        <div class="imprint"></div>
        <div class="modalContent">
          <h2>Solution</h2>
          ${solution}
        </div>
        <div class="modalActions">
          <button id="${id}SolutionButtonClose" class="modalButton">Close</button>
        </div>
      </div>
    </div>
  </div>
  ${question}
  <textarea id="${id}Answer" class="answerBox" rows="4"></textarea>
  `;
  document.querySelector('.articleBodyCenter').appendChild(questionDiv);
  const hintButton = document.getElementById(`${id}HintButton`);
  const hintModal = document.getElementById(`${id}HintModal`);
  const hintButtonClose = document.getElementById(`${id}HintButtonClose`);
  const solutionButton = document.getElementById(`${id}SolutionButton`);
  const solutionModal = document.getElementById(`${id}SolutionModal`);
  const solutionButtonClose = document.getElementById(`${id}SolutionButtonClose`);

  hintButton.onclick = () => {
    hintModal.style.display = "block";
  }
  hintButtonClose.onclick = () => {
    hintModal.style.display = "none";
  }
  solutionButton.onclick = () => {
    solutionModal.style.display = "block";
  }
  solutionButtonClose.onclick = () => {
    solutionModal.style.display = "none";
  }
}

const detailSummary = (detail, summary) => {
  return `<details>
    <summary>${summary}</summary>
    ${detail}
  </details>`
}

const questions = [
  {
    title: "Question 1",
    id: "q1",
    question: "If an NFA had $n$ states, and we ran the NFA conversion algorithm, at most how many states would the resultant DFA have?",
    hint: `${detailSummary("What do states in a DFA represent with respect to the NFA?", "Hint 1")}
          ${detailSummary("The states of a DFA represent a particular collection of states in the NFA. How many possible such distinct collections are there, for n states?", "Hint 2")}`,
    solution:  `Since we might make a DFA state for every possible unique collection of NFA states, the answer is $2^n$.
                This is because there are 2^n ways of selecting a subset of n elements.`,
  },
  {
    title: "Conversion Q1",
    id: "q2",
    question: "DFAs, but you're allowed to use the character $\\star$ in transitions, which can match any character.",
    hint: `
      ${detailSummary("Think about the NFA which is just a single star transition from the start state to an accepting state. How we achieve this without the star transition, if the alphabet was a,b?", "Hint 1")}
      ${detailSummary("There is a label we can give a transition which is functionally equivalent to the $\\star$", "Hint 2")}
    `,
    solution: `We can just convert the $\\star$ to a transition which includes all letters in the alphabet of the language.
    <img class="stopHeight" src="/img/nfaTheory/ex1.png">
    `,
  },
  {
    title: "Conversion Q2",
    id: "q3",
    question: "A list of words $w_1, w_2, \\ldots, w_n$ is provided, and a word is matched by this machine if it contains any of $w_1, w_2, \\ldots w_n$ as a substring.",
    hint: `
      ${detailSummary("Can you make $n$ NFAs to match $w_1$ through $w_n$? If so, how would you combine these into a single NFA which looks for any of them as a substring.", "Hint 1")}
      ${detailSummary("The NFAs might look like this: <img class='stopHeight' src='/img/nfaTheory/ex2-1.png'> Alongside all the $n$ NFA's different states, you might introduce 2 more: One being the start state, and representing that no substring has been read yet, and an end state, representing that a substring has been read and we can accept the word, no matter what letters follow.", "Hint 2")}
      ${detailSummary("We can make epsilon transitions between these two new states and the starts/ends of the word NFAs. What other transitions do we need?", "Hint 3")}
    `,
    solution: `
      We already know we can make an NFA that that recognises each of $w_1$ through to $w_n$:
      <img class="stopHeight" src="/img/nfaTheory/ex2-1.png">

      Then all we need to do to make it a single NFA matching any of them, is connecting the start and end of these strings to two states with epsilon transitions.
      These two states should then be able to read as many characters as they want with self-transitions, and then we can make the end state an accepting state:

      <img class="stopHeight" src="/img/nfaTheory/ex2-2.png">
              `
  },
  {
    title: "Conversion Q3",
    id: "q4",
    question: `
      An NFA, that allows words as transitions (reads multiple characters in a single transition)

      As an example, 1odd11even would be a valid word for this:

      <img src="/img/theory/nfa-words.png" />
      `,
    hint: `
      ${detailSummary("We'll simply need to replace the word transitions with some extra states/transitions that achieve the same outcome.", "Hint 1")}
      ${detailSummary("What is an NFA that matches the word 'odd'? Can this be neatly 'inserted' into NFAs that use the 'odd' transition?", "Hint 2")}
    `,
    solution: `
      We can just replace every word transition with a string of states and transitions that only read one character at a time.

      <img class="stopHeight" src="/img/nfaTheory/ex4.png">
    `,
  },
  {
    title: "Conversion Q4",
    id: "q5",
    question: `An NFA that accepts a word if we can reach an accepting state (no need to read the entire word).`,
    hint: `
      ${detailSummary("If all of our accepting states already have self transitions that read every character, we are done. If not, what should we do?", "Hint 1")}
    `,
    solution: `
      We can turn this into a normal NFA by introducing a new accepting state, which has transitions to itself for every character, and then adding epsilon transitions from every existing accepting state into this new one.

      <img class="stopHeight" src="/img/nfaTheory/ex3-1.png">

      becomes

      <img class="stopHeight" src="/img/nfaTheory/ex3-2.png">
    `,
  },
  {
    title: "Conversion Q5",
    id: "q6",
    question: `
      NFA, but it only accepts a word if <span class="highlight-small highlight-blue">all</span> paths can read the entire word and land on an accepting state.
      As an example, this NFA would accept aaaaaabaaaaaaaaaaaa, but not baab

      <img src="/img/nfaTheory/ex5.png" />
    `,
    hint: `
      ${detailSummary("Our solution to convert NFAs to DFAs simulated all paths at once, maybe there's a modification to that algorithm that will work here.", "Hint 1")}
      ${detailSummary("If we just change the accepting states of the resultant DFA to be accepting if all possible states are accepting, our conversion algorithm still isn't quite right. This is because some paths in the algorithm might've been cut short because no transition was available. How should we modify our table to fix this?", "Hint 2")}
    `,
    solution: `
      We can do this by turning into a DFA using the same table algorithm, with some major adjustments:
      <ul>
        <li>Obviously, the accepting condition of the DFA state changes - they accept only if all states in the collection are accepting.</li>
        <li>To ensure all paths work, and never die out, we have another condition - if at any point, some possible state does not have a transition for the next character, then the transition for that character on that collection of states is empty, regardless of if there were other states that did have the transition.</li>
      </ul>

      Watch the algorithm being executed below - all steps are the same, except for the last step shown - notice how there are still paths to S, A and 1 upon reading a 'b', but the transition for 'b' is empty, because there is not b transition from state 3.

      ${video("https://www.youtube.com/embed/ay_k0Hui1Pw?si=Y85ciXnPHvqbRzi4")}
    `,
  },
  {
    title: "Conversion Q6",
    id: "q7",
    question: `An NFA, but you can give transitions a weight $w$, such that you can only traverse this transition at most $w$ times while reading a word.

      As an example, this NFA accepts aaabaaa, but not baaabaaaa.

      <img src="/img/theory/nfa-fixed.png" />
    `,
    hint: `
      ${detailSummary("Our transformed solution needs to encode this weight information in the current state, rather than attaching it to transitions", "Hint 1")}
      ${detailSummary("In the NFA that's shown, let's make 6 copies of the NFA, each corresponding to a different possible amount of transitions remaining (1 of the b transition and 2 of the a transition, or 1 of the b transition and 0 of the a transition, etc.). What transitions would exist between the copies? What transitions would need to be removed?", "Hint 2")}
    `,
    solution: `
      We can do this by having many copies of the NFA, and these weighted transitions move us between these copies.

      The reason for this is that then these copies can represent how many times we have traversed a particular transition, and we can keep track of this as we read the word, and remove transitions from the copies accordingly.

      For example, suppose we had one transition that had weight 2, and another with weight 1. Call them $x$ and $y$.

      Then we make 6 copies of the NFA, representing:

      <ul>
        <li>0 copies of $x$ and 0 copies of $y$ remaining</li>
        <li>1 copy of $x$ and 0 copies of $y$ remaining</li>
        <li>2 copies of $x$ and 0 copies of $y$ remaining</li>
        <li>0 copies of $x$ and 1 copy of $y$ remaining</li>
        <li>1 copy of $x$ and 1 copy of $y$ remaining</li>
        <li>2 copies of $x$ and 1 copy of $y$ remaining</li>
      </ul>

      For the $x$ transition, instead of pointing to the end state in it's own copy, will point to the end state in the copy with 1 less $x$ transition remaining, and the copies with 0 remaining will have no such transition.

      Similarly, the $y$ transition will point to the end state in the copy with 1 less $y$ transition remaining, and the copies with 0 remaining will have no such transition.

      ${video("https://www.youtube.com/embed/LOENf4rnlnU?si=Y0-4bZu8X8ym1kTT")}
    `
  }
]

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  addQuestion(questions[0].title, questions[0].id, questions[0].question, questions[0].hint, questions[0].solution);
  const div2 = document.createElement("div");
  div2.innerHTML = preQuivText;
  document.querySelector('.articleBodyCenter').appendChild(div2);
  questions.slice(1).forEach((question) => {
    addQuestion(question.title, question.id, question.question, question.hint, question.solution);
  });

  MathJax.typeset();


}

export default addContent;
