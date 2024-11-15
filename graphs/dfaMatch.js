export const t1 = {
  graph: {
    nodes: {
      A: { x: 0, y: 0, start: false, accepting: true },
      B: { x: 0, y: 0, start: true, accepting: false },
    },
    edges: [
      { from: 'A', to: 'A', label: 'a' },
      { from: 'A', to: 'B', label: 'b' },
      { from: 'B', to: 'A', label: 'a' },
      { from: 'B', to: 'B', label: 'b' },
    ],
  },
  description: "Accepts words ending with a (Alphabet: a, b).",
  solution_image: "/img/match/sol1.png",
  hints: [
    "We can start by making two states - One if we're currently ending with an a, and one if we're not.",
    "In either state, reading an a should take us to the state where we're ending with an a.",
    "In either state, reading a b should take us to the state where we're not ending with an a.",
    "Make sure you've marked your starting and accepting states correctly.",
  ]
}

export const t2 = {
  graph: {
    nodes: {
      A: { x: 0, y: 0, start: true , accepting: true },
      B: { x: 0, y: 0, start: false, accepting: true },
      C: { x: 0, y: 0, start: false, accepting: true },
      D: { x: 0, y: 0, start: false, accepting: true },
      X: { x: 0, y: 0, start: false, accepting: false },
    },
    edges: [
      { from: 'A', to: 'A', label: 'a' },
      { from: 'A', to: 'B', label: 'b' },
      { from: 'A', to: 'C', label: 'c' },
      { from: 'A', to: 'D', label: 'd' },
      { from: 'B', to: 'B', label: 'b' },
      { from: 'B', to: 'C', label: 'c' },
      { from: 'B', to: 'D', label: 'd' },
      { from: 'C', to: 'C', label: 'c' },
      { from: 'C', to: 'D', label: 'd' },
      { from: 'D', to: 'D', label: 'd' },
      { from: 'B', to: 'X', label: 'a' },
      { from: 'C', to: 'X', label: 'a, b' },
      { from: 'D', to: 'X', label: 'a, b, c' },
      { from: 'X', to: 'X', label: 'a, b, c, d' },
    ],
  },
  description: "Accepts words in alphabetic order (Alphabet: a, b, c, d).",
  solution_image: "/img/match/sol2.png",
  hints: [
    "You'll find it helpful with this task and future ones to define a 'sink state', which is not accepting, and the only transition is to itself, accepting all letters.",
    "The solution uses 5 states - one sink state and one representing the last read letter - this determines what next letters are valid and what aren't (and should send you to the sink state). A should be the start state, since the empty string is in alphabetic order, and can have any starting character.",
    "Let's consider the transitions for state B. If we read an a, we should go to the sink state, as we're not in alphabetic order. If we read a B, we can stay in state B. Reading a c or d should take us to states C and D respectively.",
  ]
}

export const t3 = {
  graph: {
    nodes: {
      X1: { x: 0, y: 0, start: true , accepting: false },
      X2: { x: 0, y: 0, start: false , accepting: false },
      M: { x: 0, y: 0, start: false , accepting: false },
      Y1: { x: 0, y: 0, start: false, accepting: false },
      Y2: { x: 0, y: 0, start: false, accepting: true },
      END: { x: 0, y: 0, start: false, accepting: false },
    },
    edges: [
      // X1
      { from: 'X1', to: 'X2', label: 'a' },
      { from: 'X1', to: 'END', label: 'b' },
      // X2
      { from: 'X2', to: 'END', label: 'a' },
      { from: 'X2', to: 'Y1', label: 'b' },
      // M
      { from: 'M', to: 'Y1', label: 'b' },
      { from: 'M', to: 'M', label: 'a' },
      // Y1
      { from: 'Y1', to: 'Y2', label: 'a' },
      { from: 'Y1', to: 'Y1', label: 'b' },
      // Y2
      { from: 'Y2', to: 'M', label: 'a' },
      { from: 'Y2', to: 'Y1', label: 'b' },
      // END
      { from: 'END', to: 'END', label: 'a, b' },
    ]
  },
  description: "Accepts words which start with ab and end with ba (Alphabet: a, b).",
  solution_image: "/img/match/sol3.png",
  hints: [
    "The provided solution use 6 states. You need a sink state for words with the wrong prefix, two states for partially matching the correct prefix (starts with nothing, starts with a), and three states for partially matching the correct suffix (ends with a, ends with ab, ends with something else).",
  ]
}

export const t4 = {
  graph: {
    nodes: {
      S: { x: 0, y: 0, start: true , accepting: false },
      P1: { x: 0, y: 0, start: false , accepting: false },
      P2: { x: 0, y: 0, start: false , accepting: false },
      P3: { x: 0, y: 0, start: false , accepting: false },
      P4: { x: 0, y: 0, start: false , accepting: true },
    },
    edges: [
      // S
      { from: 'S', to: 'P1', label: 'a' },
      { from: 'S', to: 'S', label: 'b' },
      // P1
      { from: 'P1', to: 'P2', label: 'a' },
      { from: 'P1', to: 'S', label: 'b' },
      // P2
      { from: 'P2', to: 'P3', label: 'b' },
      { from: 'P2', to: 'P2', label: 'a' },
      // P3
      { from: 'P3', to: 'P4', label: 'a' },
      { from: 'P3', to: 'S', label: 'b' },
      // P4
      { from: 'P4', to: 'P2', label: 'a' },
      { from: 'P4', to: 'S', label: 'b' },
    ]
  },
  description: "Accepts words ending with aaba (Alphabet: a, b)",
  solution_image: "/img/match/sol4.png",
  hints: [
    "The provided solution uses 5 states. The first few transitions are easy enough to define - your DFA might look like: 1 -[a]> 2 -[a]> 3 -[b]> 4 -[a]> 5, where 1 is the start state and 5 is the end state.",
    "Using the previous example, we should have the transition 5 -[a]-> 3, why?"
  ]
}

export default { t1, t2, t3, t4 };
