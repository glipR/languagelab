import { addIcon } from "../templates/icons.js";

const contentText = `\
<p>
While the game is a great way to get some experience with the pumping lemma, ultimately it is a tool for formally proving languages are irregular.

Let's get some practice writing proofs and exploring word choice completely.

<br>

For each of the questions, try writing your answer down in the box provided if you'd like, or write it down on a piece of paper. Once you're done, click on the "Show Answer" button to see the provided proof, and compare it with your own.

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
    title: "Pumping Proof 1",
    id: "q1",
    question: "Prove that the language of strings with an equal amount of a's and b's is irregular",
    hint: `${detailSummary("This was the example we explored in the video. Don't be afraid to go back and review this!", "Hint 1")}`,
    solution:  `
    For any $n \\geq 1$, consider the word $w = a^nb^n$. This has an equal amount of a's and b's, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
    </ol>

    As such, for $i=0$, $xy^iz$ will have $n$ b's, and less than $n$ a's, and the word is therefore rejected by the language.
    <br><br>
    Therefore, the language of words with an equal amount of a's and b's is irregular.
    `
  },
  {
    title: "Pumping Proof 2",
    id: "q2",
    question: "Prove that the language of palindromic strings on the alphabet {a, b, c} is irregular (Palindromic string do not change when reversed, so 'abacaba' is a palindrome.)",
    hint: `
      ${detailSummary("Palindromes require the right half of the string to be the reversed version of the left half of the string (ignoring the middle character for odd length strings). Can we make a word where we must always break just one of these two sides?", "Hint 1")}
      ${detailSummary("While you've got three characters at your disposal, using all 3 equally will likely overcomplicate your word choice. Try choosing a word where the first n characters are all the same (and therefore the final n characters are also the same). What can I add to this word to make it easy to pump out of the language?", "Hint 2")}
      ${detailSummary("Try the word $a^nba^n$. Why does this word work?", "Hint 3")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = a^nba^n$. This is a palindrome, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
    </ol>

    As such, for $i=0$, $xy^iz$ will be $a^kba^n$, where $k < n$, and the word is therefore rejected by the language as it is not a palindrome.
    <br><br>
    Therefore, the language of palindromes is irregular.
    `
  },
  {
    title: "Pumping Proof 3",
    id: "q3",
    question: "Prove that the language on the alphabet {0, 1} of strings with more 0's than 1's is irregular",
    hint: `
      ${detailSummary("The language needs more 0's than 1's. Pumping primarily allows us to increase the amount of 'y' substrings in the word. How can we select our word so that 'y' is always some collection of 1's?", "Hint 1")}
      ${detailSummary("Starting the string with $1^n$ will force the property we want. What should I add to this string to ensure it is in the language?", "Hint 2")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = 1^n0^{n+1}$. This is in the language, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $1^n$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of 1's.</li>
    </ol>

    As such, for $i=2$, $xy^iz$ will be $1^{n+k}0^{n+1}$, where $k \\geq 1$, and the word is therefore rejected by the language as there are at least as many 1's as 0's.
    <br><br>
    Therefore, the language of words with more 0's than 1's is irregular.
    `
  },
  {
    title: "Pumping Proof 4",
    id: "q4",
    question: "Prove that the language of $0^i1^j$ with $i > j$ is irregular",
    hint: `
    ${detailSummary("This is a modification of the previous language, aimed at removing our previous solution. The 'Player 1' in our game example can always pick y to be some collection of 0's. So our solution should try to reduce the number of 0's, rather than increase the number of 1's.", "Hint 1")}
    ${detailSummary("The only way for us to remove characters is using i=0. So we might only remove a single character - how can we make sure this exempts the new word from the language?", "Hint 2")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = 0^{n+1}1^n$. This is in the language, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $0^{n+1}$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of 0's.</li>
    </ol>

    As such, for $i=0$, $xy^iz$ will be $0^{n+1-k}1^n$, where $1-k \\leq 0$, and the word is therefore rejected by the language as we have at most the same amount of 0's and 1's, possible less 0's than 1's.
    <br><br>
    Therefore, the language of $0^i1^j$ with $i > j$ is irregular.
    `
  },
  {
    title: "Pumping Proof 5",
    id: "q5",
    question: "Prove the language of $a^i$, where $i$ is a prime number, is irregular",
    hint: `
    ${detailSummary("This is the first of the hard mathy ones - Picking any word longer than n will work here, and not change the logic much.", "Hint 1")}
    ${detailSummary("In general, our partitioning will have $y = a^k$, and $xy^iz = a^{p-k+ik}$, where $p$ is a prime number. How can we force this to be composite?", "Hint 2")}
    ${detailSummary("Since we are just adding some multiple of $k$ to $p$, let's try make a number which is divisible by $p$ - the first term is already divisible by $p$, we just need to make $(i-1)k$ divisible by $p$. There is any easy choice of $i$ which achieves this.", "Hint 3")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = a^{\\pi(n)}$ (The nth prime number). This is in the language, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that $y$ will be some non-empty collection of a's. Call it $a^k$.

    As such, take $$ i=\\pi(n) + 1.$$ Then $$xy^iz = a^{\\pi(n) - k + k (\\pi(n) + 1)} = a^{(k+1)\\pi(n)} $$

    This exponent is not prime, as it can be written with two integer factors.
    <br><br>
    Therefore, the language of $a^i$, where $i$ is a prime number, is irregular.
    `
  },
  {
    title: "Pumping Proof 6",
    id: "q6",
    question: "Prove the language of integers, where the digit sum is 3 times the length of the string, is irregular (The digit sum of 135 is 1+3+5=9=3*3, and 22227 is 2+2+2+2+7=15=3*5, so both are in the language.)",
    hint: `
    ${detailSummary("The language essentially requires the average digit in the string to be 3. So we can force ourselves out of the language by spamming either lots of small or lots of large numbers - how can we force this?", "Hint 1")}
    ${detailSummary("Picking a word with both small and large numbers in the first n characters doesn't work, because for a word like 22263333, one can repeat the substring 2226 and the word will still be in the language.", "Hint 2")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = 1^n35^n$. This is in the language, since the digit sum is $n + 3 + 5n = 6n+3 = 3(2n+1)$, and the string length is $2n+1$, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $1^n$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of 1's.</li>
    </ol>

    As such, for $i=2$, $xy^iz$ will be $1^{n+k}35^n$, which has digit sum $6n+3+k = 3(2n+1) + k$. This can never be equal to 3 times the string length ($3(2n+1+k)$) for any value of $k$, and the word is therefore rejected by the language.
    <br><br>
    Therefore, the language of integers, where the digit sum is 3 times the length of the string, irregular.
    `
  },
  {
    title: "Pumping Proof 7",
    id: "q7",
    question: "Prove the language of strings that can be made into palindromes after modifying 2 characters is irregular (So adaccba has 2 mistakes - d doesn't line up with b, and the second a doesn't line up with the second c - these are the only two misalignments, so this word is in the language.)",
    hint: `
    ${detailSummary("This is a tough one on the surface, but at the end of the day we just need to always force more than 2 mistakes in the palindrome. Your example word can be a perfect palindrome, and the proof can still work", "Hint 1")}
    ${detailSummary("The previously given solution, $a^nba^n$, doesn't work, because the only mistake we force in our string is the single 'b' not being located in the center. We won't need to modify our original word much to require more than 1 mistake.", "Hint 2")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = a^nbbba^n$. This is in the language, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^n$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's.</li>
    </ol>

    As such, for $i=5$, $xy^iz$ will be $a^{n+4k}bbba^n$. The length of this string is odd, and the center of the string sits within the $a^{n+4k}$ section. Therefore there are at least 3 mistakes with this palindrome, namely the three b's on the right side of the string.
    <br><br>
    Therefore, the language of strings that can be made into palindromes after modifying 2 characters is irregular.
    `
  },
  {
    title: "Pumping Proof 8",
    id: "q8",
    question: "Prove the language of $a^\\alpha b^\\beta $, where $\\alpha \\neq \\beta$, is irregular",
    hint: `
    ${detailSummary("This one is tough. Give it a think, and really go through exactly what we can/can't force on the partition choice.", "Hint 1")}
    ${detailSummary("Our word selection should probably have at least $\\alpha \\geq n$, so the y partition contains only a's. But this still means y is $a^k$ for any $1 \\leq k \\leq n$. How can I ensure that there is always some $i$ where $xy^iz$ has the same amount of a's and b's?", "Hint 2")}
    ${detailSummary("If we want to use $i=0$ to solve the problem, we'd need $w=a^\\alpha b^{\\alpha -k}$, but we don't know $k$ beforehand. So we'll use $i \\geq 2$. We need to provide $\\alpha$ and $\\beta$ so that no matter what $1 \\leq k \\leq n$ is selected, we can always write $\\beta$ as $\\alpha + k * (i-1)$ for some $i$.", "Hint 3")}
    ${detailSummary("This is easiest to do if both $\\alpha$ and $\\beta$ are both divisible by every number from $1$ to $n$. Do we know of a number that achieves this?", "Hint 4")}
    `,
    solution:  `
    For any $n \\geq 1$, consider the word $w = a^{n!}b^{2(n!)}$. This is in the language, and $|w| \\geq n$.
    For any valid partitioning of $w$, we know that:
    <br>

    <ol style="margin: 20px 0px;">
      <li>Because $|xy|\\leq n$, we know that the first two elements of the partition are contained entirely in the $a^{n!}$ section.</li>
      <li>Because $|y| \\neq 0$, we then know that $y$ is some non-zero amount of a's. Let's write this is $a^k$ for some $k > 0$.</li>
    </ol>

    Consider $i=\\frac{n!}{k}+1$ (This is an integer, since $n!$ has every number $\\leq n$ as a factor).
    <br>
    Then $xy^iz$ will be
    $$
      a^{n! - k + k(\\frac{n!}{k} + 1)}b^{2(n!)} = a^{2(n!)}b^{2(n!)}
    $$
    <br><br>
    Therefore, the language of $a^ib^j$, where $i \\neq j$, is irregular.
    `
  },
]

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  questions.forEach((question) => {
    addQuestion(question.title, question.id, question.question, question.hint, question.solution);
  });

}

export default addContent;
