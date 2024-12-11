export const t1 = {
  graph: {
    nodes: {
      S: { x: 0, y: 0, start: true , accepting: false },
      A: { x: 0, y: 0, start: false , accepting: false },
      BP: { x: 0, y: 0, start: false , accepting: false },
      AP: { x: 0, y: 0, start: false , accepting: false },
      S1: { x: 0, y: 0, start: false , accepting: false },
      S2: { x: 0, y: 0, start: false , accepting: false },
      S3: { x: 0, y: 0, start: false , accepting: false },
      E: { x: 0, y: 0, start: false , accepting: true },
    },
    edges: [
      { from: 'S', to: 'A', label: 'a' },
      { from: 'A', to: 'BP', label: 'b' },
      { from: 'BP', to: 'AP', label: 'a' },
      { from: 'AP', to: 'AP', label: 'a, b' },
      { from: 'AP', to: 'A', label: 'ε' },
      { from: 'A', to: 'S1', label: 'b' },
      { from: 'S1', to: 'S2', label: 'a' },
      { from: 'S2', to: 'S3', label: 'b' },
      { from: 'S3', to: 'E', label: 'a' },
    ],
  },
  description: "Words starting with aba, and ending with baba (Alphabet: a, b)",
  hints: [
    "We've seen NFAs make it easy to enforce certain things like prefixes and suffixes without needing to handle unexpected characters. The easiest way to do this is just to generate one NFA that matches the prefix, one NFA that matches the suffix, then join them with some transitions.",
    `
      Once you've made an NFA that matches the prefix, and an NFA that matches the suffix,
      you can join the accepting state of the first, to the starting state of the second, using an epsilon transition.
      This won't work, but it is close. Why won't it work, and how can you fix it?
    `,
  ],
  solution_image: "/img/match/nfa1.png",
}

export const t2 = {
  graph: {
    nodes: {
      S: { x: 0, y: 0, start: true , accepting: true },
      A1: { x: 0, y: 0, start: false , accepting: false },
      A2: { x: 0, y: 0, start: false , accepting: false },
      B1: { x: 0, y: 0, start: false , accepting: false },
      B2: { x: 0, y: 0, start: false , accepting: false },
      C1: { x: 0, y: 0, start: false , accepting: false },
      C2: { x: 0, y: 0, start: false , accepting: false },
    },
    edges: [
      { from: 'S', to: 'A1', label: 'a' },
      { from: 'A1', to: 'A2', label: 'a' },
      { from: 'A2', to: 'S', label: 'a' },
      { from: 'S', to: 'B1', label: 'b' },
      { from: 'B1', to: 'B2', label: 'b' },
      { from: 'B2', to: 'S', label: 'b' },
      { from: 'S', to: 'C1', label: 'c' },
      { from: 'C1', to: 'C2', label: 'c' },
      { from: 'C2', to: 'S', label: 'c' },
    ],
  },
  description: "Words where all letters appear in groups of 3 (Alphabet: a, b, c) Example word: aaacccbbbaaa",
  hints: [
    "This is relatively easy to do, we just want to hammer down how much less tedious it is to write NFAs over DFAs. How would we do this in a DFA?",
    "We can solve this by having three distinct 'cycles' in our NFA, one for each letter in the alphabet."
  ],
  solution_image: "/img/match/nfa2.png",
}

export const t3 = {
  graph: {
    nodes: {
      S: { x: 0, y: 0, start: true , accepting: false },
      E: { x: 0, y: 0, start: false , accepting: false },
      0: { x: 0, y: 0, start: false , accepting: true },
      1: { x: 0, y: 0, start: false , accepting: false },
      2: { x: 0, y: 0, start: false , accepting: false },
    },
    edges: [
      { from: 'S', to: 'S', label: '0,1,2,3,4,5,6,7,8,9'},
      { from: 'S', to: 'E', label: '0,2,4,6,8' },
      { from: 'E', to: '0', label: '0,3,6,9' },
      { from: 'E', to: '1', label: '1,4,7' },
      { from: 'E', to: '2', label: '2,5,8' },
      { from: '0', to: '0', label: '0,3,6,9' },
      { from: '1', to: '1', label: '0,3,6,9' },
      { from: '2', to: '2', label: '0,3,6,9' },
      { from: '0', to: '1', label: '1,4,7' },
      { from: '1', to: '2', label: '1,4,7' },
      { from: '2', to: '0', label: '1,4,7' },
      { from: '0', to: '2', label: '2,5,8' },
      { from: '1', to: '0', label: '2,5,8' },
      { from: '2', to: '1', label: '2,5,8' },
    ],
  },
  description: `
    String of characters which can be split into two numbers,
    where the first number is even and the second number is divisible by 3.
    <br>
    As an example, 7812348 is a valid string because 7812 is even and 348 is divisible by 3.
    <br>
    Numbers starting with 0 are considered valid (05 is a number)
    `,
  hints: [
    `
    Some number facts:
    <ul>
      <li>Even numbers always end in a 0,2,4,6,8</li>
      <li>The digit sum of x has the same remainder when divided by 3 as x.</li>
    </ul>
    For the second point, an example: 957 when divided by 3, gives remainder 0. So does 9+5+7 = 21.

    Try making NFAs which match each of these numbers (divisible by 2 and divisible by 3) separately.
    `,
    `
    For even numbers, this is just checking for a particular suffix (or just final character) on the number.
    <img src="/img/match/nfaevens.png" />
    <br>
    For numbers divisible by 3, another way of looking at it is that we can keep track of the remainder when divided by 3, as we read the number.

    For example, take the number 123456. For each prefix of the number, we can calculate the remainder when divided by 3, purely using the next number in the string.

    <ul>
      <li>1 % 3 = 1</li>
      <li>12 % 3 = (1 + 2) % 3 = 0</li>
      <li>123 % 3 = (0 + 3) % 3 = 0</li>
      <li>1234 % 3 = (0 + 4) % 3 = 1</li>
      <li>12345 % 3 = (1 + 5) % 3 = 0</li>
      <li>123456 % 3 = (0 + 6) % 3 = 0</li>
    </ul>

    Your NFA can take a very similar strategy to this. What is the acceptance condition?
    `,
    `
    For numbers divisible by 3, create three states, to represent the current remainder when divided by 3.
    Each state should have a transition to itself, with label 0,3,6,9, since these, if added to the current number, would not change the remainder.
    For 1,4,7 and 2,5,8, these would change the remainder, so they should transition to one of the two other states. Which?
    `,
    `
    This NFA matches strings of numbers representing numbers divisible by 3:

    <img src="/img/match/nfadiv3.png" />

    1,4,7 should increase the remainder of the total number by 1, going to 0 when the previous remainder was 2.
    2,5,8 should increase the remainder of the total number by 2 (Which is the same as decreasing the remainder by 1), going to 2 when the previous remainder was 0.
    `,
  ],
  solution_image: "/img/match/nfa3.png",
}

export default { t1, t2, t3 };
