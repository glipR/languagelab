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

// const video = (s) => `<div class="aspect-ratio" style="margin-bottom: 20px"><iframe src="https://www.youtube.com/embed/TXfRQkQTiU0?si=tZ8q30tTQF8_Sm3t&amp;start=${s}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`

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
    hint: `TODO`,
    solution: `We can just convert the $\\star$ to a transition which includes all letters in the alphabet of the language.
    Image: TODO
    `,
  },
  {
    title: "Conversion Q2",
    id: "q3",
    question: "A list of words $w_1, w_2, \\ldots, w_n$ is provided, and a word is matched by this machine if it contains any of $w_1, w_2, \\ldots w_n$ as a substring.",
    hint: `TODO`,
    solution: `
      We can achieve this by making a string of states for each of $w_1$ through to $w_n$, then connecting the start and end of these strings to two states with epsilon transitions.
      This two states should then be able to read as many characters as they want with self-transitions, and then we can make the end state an accepting state:

      Image: TODO
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
    hint: `TODO`,
    solution: `
      We can just replace every word transition with a string of states and transitions that only read one character at a time.

      Image: TODO
    `,
  },
  {
    title: "Conversion Q4",
    id: "q5",
    question: `An NFA that accepts a word if we can reach an accepting state (no need to read the entire word).`,
    hint: `
      TODO
    `,
    solution: `
      We can turn this into a normal NFA by introducing a new accepting state, which has transitions to itself for every character, and then adding epsilon transitions from every existing accepting state into this new one.

      Image: TODO
    `,
  },
  {
    title: "Conversion Q5",
    id: "q6",
    question: `
      NFA, but it only accepts a word if <span class="highlight-small highlight-blue">all</span> paths can read the entire word and land on an accepting state.
      As an example, this NFA would accept aaaaaabaaaaaaaaaaaa, but not baab

      <img src="/img/theory/nfa-all-paths.png" />
    `,
    hint: `
      TODO
    `,
    solution: `
      We can do this by turning into a DFA using the same table algorithm, with some major adjustments:
      <ul>
        <li>Obviously, the accepting condition of the DFA state changes - they accept only if all states in the collection are accepting.</li>
        <li>To ensure all paths work, and never die out, we have another condition - if at any point, some possible state does not have a transition for the next character, then the collection transition for that character is empty, regardless of if there were other states that did have the transition.</li>
      </ul>

      To follow on that second point, imagine we are figuring out the transitions for collection A, B, C on character 'a'. If A and C have a transition that reads 'a', but B does not, then the transition for 'a' on the collection A, B, C is empty, where as usually, we would just transitions from A and C, and ignore B.

      Image: TODO
    `,
  },
  {
    title: "Conversion Q6",
    id: "q7",
    question: `An NFA, but you can give transitions a weight $w$, such that you can only traverse this transition at most $w$ times while reading a word.

      As an example, this NFA accepts caaaaabac, but not abacaba.

      <img src="/img/theory/nfa-fixed.png" />
    `,
    hint: `
      TODO
    `,
    solution: `
      We can do this by having many copies of the NFA, and these weighted transitions move us between these copies.

      The reason for this is that then these copies can represent how many times we have traversed a particular transition, and we can keep track of this as we read the word, and remove transitions from the copies accordingly.

      For example, suppose we had one transition that had weight 2, and another with weight 1. Call them $a$ and $b$.

      Then we make 6 copies of the NFA, representing:

      <ul>
        <li>0 copies of $a$ and 0 copies of $b$ remaining</li>
        <li>1 copy of $a$ and 0 copies of $b$ remaining</li>
        <li>2 copies of $a$ and 0 copies of $b$ remaining</li>
        <li>0 copies of $a$ and 1 copy of $b$ remaining</li>
        <li>1 copy of $a$ and 1 copy of $b$ remaining</li>
        <li>2 copies of $a$ and 1 copy of $b$ remaining</li>
      </ul>

      For the $a$ transition, instead of pointing to the end state in it's own copy, will point to the end state in the copy with 1 less $a$ transition remaining, and the copies with 0 remaining will have no such transition.

      Similarly, the $b$ transition will point to the end state in the copy with 1 less $b$ transition remaining, and the copies with 0 remaining will have no such transition.

      TODO: Image.
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
