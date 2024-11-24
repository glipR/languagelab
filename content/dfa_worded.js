const contentText = `\
<p>
Before we start creating some DFAs ourselves, let's first ask ourselves a few questions about DFAs, and understand how we can transform DFAs to have different properties.

<br>

For each of the questions, try writing your answer down in the box provided if you'd like, or write it down on a piece of paper. Once you're done, click on the "Show Answer" button to see the answer.

<br>

Need a hint? Feel free to click the "Hint" button to access the hints for a question.
</p>
`

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
    question: "For a DFA with $n$ states and an alphabet of size $m$, what is the maximum/minimum number of transitions that can be present in the DFA?",
    hint: `${detailSummary("Try to think about the particular rule about DFAs, and the number of transitions per a particular state/character that was covered in the first section.", "Hint 1")}
          ${detailSummary("Try to think about how many transitions are needed for each state in the DFA.", "Hint 2")}
          ${detailSummary("For the maximal case, no transition should have a label with multiple characters - this could be split into multiple transitions.", "Hint 3")}
          ${detailSummary("For the minimal case, each state still needs at least one transition beginning there, is this enough, or do we need more transitions?", "Hint 4")}`,
    solution:  `The maximum number of transitions that can be present in the DFA is $n \\times m$, this is because of the rule that for every state/letter combination, there should be exactly one transition that begins at that state, and includes that letter in the label.
                <img class="stopHeight" src="/img/theory/maximal-transitions.png" />
                In this example, there are 4 states, 3 letters in the alphabet, and so 12 transitions in total.<br>
                The minimum number of transitions that can be present in the DFA is $n$, this is because we can have a transition that includes every letter in the alphabet for each state, and this would be the minimum number of transitions that can be present in the DFA.
                <img class="stopHeight" src="/img/theory/minimal-transitions.png" />
                In this example, there are 4 states, and 4 transitions in total.`,
  },
  {
    title: "Question 2",
    id: "q2",
    question: "DFAs have a finite number of states and transitions, how can they accept/reject strings with more characters than the DFA has states/transitions?",
    hint: ` ${detailSummary("This is best seen by simply executing the DFA algorithm! Try the odd/even example from the intro video.", "Hint 1")}
            ${detailSummary("When executing just like above, you'll notice that the same state might be reached multiple times.", "Hint 2")}`,
    solution: `This is because a DFA contains loops, and since there is always an outward transition present for every state/letter combination, there is always a new state to move to.
               If we imposed any requirements on the DFA, such as visiting any state a maximum number of times, or the same for transitions, then the language would immediately become finite.
               This property, that if we take a word long enough, executing it on our DFA will always result in a loop, is a property of DFAs that we will exploit in future...
    `,
  },
  {
    title: "Question 3",
    id: "q3",
    question: "Consider we have some DFA $M$, and we want to create a new DFA $M'$ that accepts all words that $M$ rejects. How would we create $M'$ by modifying $M$?",
    hint: ` ${detailSummary("DFAs will accept/reject a word based on whether the final state the word lands on is/is not an accepting state.", "Hint 1")}
            ${detailSummary("Following from Hint 1, your solution should probably involve changing the accepting states of the DFA.", "Hint 2")}
            ${detailSummary("For any state that was not an accepting state in $M$, it should be an accepting state in $M'$, since any word that lands in this state would previously have been rejected.", "Hint 3")}
            `,
    solution: `
              To create $M'$, we just need to swap which states are accepting/non-accepting in $M$.
              For any word $w$, let's say it lands in state $C$ in $M$.
              <br>
              If $C$ was an accepting state in $M$, then $M$ accepts $w$, while $M'$ rejects $w$, since $C$ is now a non-accepting state in $M'$.
              <br>
              If $C$ was not an accepting state in $M$, then $M$ rejects $w$, while $M'$ accepts $w$, since $C$ is now an accepting state in $M'$.
              <br>

              So for this $M$:
              <img class="stopHeight" src="/img/theory/pre-invert.png" />

              $M'$ would be:
              <img class="stopHeight" src="/img/theory/post-invert.png" />
              `
  },
  {
    title: "Question 4",
    id: "q4",
    question: `DFAs have particular rules around transitions, namely that there is exactly one per state/letter combination. What would happen if this rule was broken and we allow zero/multiple transitions for a particular pairing? Describe how this would impact the algorithm, and how you might modify the algorithm so it still makes sense.`,
    hint: `
      ${detailSummary("In the case of zero transitions, imagine a DFA graph with no transitions at all. What would be the problem we run into when executing the algorithm?", "Hint 1")}
      ${detailSummary("In the case of multiple transitions, our DFA algorithm would probably execute just fine (somewhat dependant on implementation), but the result would not be consistent, why?", "Hint 2")}
      ${detailSummary("For our algorithm modification, we might make it so that if the algorithm crashes (when does this happen), the algorithm rejects the word. When the algorithm has multiple options, we could either: <ul><li> Accept the word if <span class='highlight highlight-blue'>either</span> option lands on an accepting state </li><li> Accept the word if <span class='highlight highlight-blue'>all</span> options land on an accepting state. </li></ul>", "Hint 3")}
    `,
    solution: `
      If this rule was broken, there would be two issues:

      <ul>
        <li> If there were zero transitions for a particular state/letter combination, the algorithm would crash, since there would be no way to move to the next state when reading a particular character. </li>
        <li> If there were multiple transitions for a particular state/letter combination, the algorithm would execute just fine (depending on implementation), but the result would not be consistent, since there would be multiple possible paths to take. </li>
      </ul>

      In the first case, we can amend the algorithm to reject the word if no transition is available.
      <br>

      In the second case, we could either:

      <ul>
        <li> Accept the word if <span class='highlight highlight-blue'>either</span> option lands on an accepting state </li>
        <li> Accept the word if <span class='highlight highlight-blue'>all</span> options land on an accepting state. </li>
      </ul>

      We could achieve this by making DFA execution a recursive function, where we pass in the word and starting state ourselves, see below for python code.

      <div class="codes">
        <div class="editor" id="q4-code-pseudo" style="min-height: 300px">def execute_dfa(dfa, word, startState):
  if len(word) == 0:
    return startState.accepting
  nextStates = set()
  for transition in dfa.transitions:
    if transition.from == startState and word[0] in transition.label:
      nextStates.add(transition.to)
  # No transitions available
  if len(nextStates) == 0:
    return False
  # Multiple transitions available - simulate all possible nextStates
  solved = [execute_dfa(dfa, word[1:], state) for state in nextStates]

  # If we wanted to accept if any path leads to an accepting state
  return any(solved)

  # If we wanted to accept if all paths lead to an accepting state
  return all(solved)</div>
      </div>
    `,
  },
  {
    title: "Question 5",
    id: "q5",
    question: `Suppose we have two DFAs, $A$ and $B$, that share the same alphabet, and we want to create a new DFA $C$ that accepts all words that are accepted by either $A$ or $B$. How would we create $C$?<br>This is a hard question. Don't be afraid to peek at some hints!`,
    hint: `
      ${detailSummary("If $A$ has $n$ states and $B$ has $m$ states, your solution for $C$ will need <span class='highlight highlight-red'>more</span> than $n+m$ states.", "Hint 1")}
      ${detailSummary("We want moving through $C$ to somewhat simulate moving through $A$ and $B$ independently. So our states of $C$ need to encode a state in $A$ <span class='highlight highlight-blue'>and</span> a state in $B$", "Hint 2")}
      ${detailSummary("We'll need $n \\times m$ states in total. For every pair of states $a \\in A$ and $b \\in B$, we'll have a state $(a,b) \\in C$. How should these be connected by transtitions? What are starting/accepting states?", "Hint 3")}
      ${detailSummary("Because we are simulating $A$ and $B$ simultaneously, every transition in $C$ is kind of a merger of a transition in $A$ and a transition in $B$.", "Hint 4")}
    `,
    solution: `
      Our DFA $C$ is essentially going to simulate moving through $A$ and $B$ independently. We'll need $n \\times m$ states in total to achieve this.
      <br>

      For every pair of states $a \\in A$ and $b \\in B$, we'll have a state $(a,b) \\in C$.
      Suppose we are in state $(a,b)$ in $C$, and we read a letter $x$. We should move to state $(a',b')$ in $C$ where $a'$ is the state in $A$ that $a$ moves to when reading $x$, and $b'$ is the state in $B$ that $b$ moves to when reading $x$.
      This allows us to continue simulating the word in $A$ and $B$ simultaneously.
      <br>

      Our starting state in $C$ is $(a_1, b_1)$, where $a_1$ is the starting state in $A$, and $b_1$ is the starting state in $B$.
      $(a, b)$ is an accepting state in $C$ if $a$ is an accepting state in $A$, or $b$ is an accepting state in $B$.
      This means that $C$ accepts a word if it is accepted by either $A$ or $B$.
      <br>

      <img class="stopHeight" src="/img/theory/cartesian-product.png" />

      Here, $A$ is the DFA with states $A, B$, $B$ is the DFA with states $1, 2, 3$, and $C$ is the 6 states in the centre that use $A$ and $B$ states as rows/columns.
      Notice how the starting state in $C$ is aligned to $A, 1$ in the grid, and the accepting states in $C$ are all states in the same row/column as an accepting state in $A$/$B$.
      <br>

      If we wanted to allow the two DFAs to have different alphabets, we can fix this by turning the original DFAs into DFAs with the same alphabet, by adding a sink state which receives all letters that are not present in the original DFA's alphabet.

      <img class="stopHeight" src="/img/theory/extra-alphabet.png" />

      Here we have added the letters c, d and e to the DFA, and any word that includes those letters will be rejected by the DFA.
    `,
  },
  {
    title: "Question 6",
    id: "q6",
    question: `Suppose we have two DFAs, $A$ and $B$, that share the same alphabet, and we want to create a new DFA $C$ that that only accepts words if $A$ and $B$ are not equivalent, and the language of words that $C$ accepts is exactly those words that make the languages of $A$ and $B$ not equivalent. How would we create $C$?`,
    hint: `
      ${detailSummary("The solution is extremely close to Question 5.", "Hint 1")}
      ${detailSummary("The solution needs to accept all words that are accepted by one DFA, but rejected by the other", "Hint 2")}
      ${detailSummary("Your solution should look exactly the same as Question 5, except with different accepting states.", "Hint 3")}
    `,
    solution: `
      Assuming you've done question 5, the solution to this question is suprisingly simple. We want the DFA to accept words which are accepted by one DFA but not the other.
      <br>
      So take our union DFA from the previous question, and simply make any state an accepting state if exactly one of the row/column states are an accepting state.
      <br>
      This means we only stop at this state if the current word is accepted by exactly one of the DFAs!
      <br><br>
      In future tasks, where you're creating DFAs matching a language, this is exactly the process used to test them! This way we can also find out what word discerns two DFAs, if they are not equivalent.
    `,
  }
]

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  questions.forEach((question) => {
    addQuestion(question.title, question.id, question.question, question.hint, question.solution);
  });

  const q4Editor = ace.edit(`q4-code-pseudo`);
  q4Editor.setReadOnly(true);
  q4Editor.setTheme("ace/theme/monokai");
  q4Editor.session.setMode(`ace/mode/python`);
  MathJax.typeset();


}

export default addContent;
