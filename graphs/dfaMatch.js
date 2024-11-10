export const t1 = {
  graph: {
    nodes: {
      A: { x: 0, y: 0, start: false, final: true },
      B: { x: 0, y: 0, start: true, final: false },
    },
    edges: [
      { from: 'A', to: 'A', label: 'a' },
      { from: 'A', to: 'B', label: 'b' },
      { from: 'B', to: 'A', label: 'a' },
      { from: 'B', to: 'B', label: 'b' },
    ],
  },
  description: "Accepts words ending with a (Alphabet: a, b)."
}

export const t2 = {
  graph: {
    nodes: {
      A: { x: 0, y: 0, start: true , final: true },
      B: { x: 0, y: 0, start: false, final: true },
      C: { x: 0, y: 0, start: false, final: true },
      D: { x: 0, y: 0, start: false, final: true },
      X: { x: 0, y: 0, start: false, final: false },
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
  description: "Accepts words in alphabetic order (Alphabet: a, b, c, d)."
}

export const t3 = {
  graph: {
    nodes: {
      X1: { x: 0, y: 0, start: true , final: false },
      X2: { x: 0, y: 0, start: false , final: false },
      M: { x: 0, y: 0, start: false , final: false },
      Y1: { x: 0, y: 0, start: false, final: false },
      Y2: { x: 0, y: 0, start: false, final: true },
      END: { x: 0, y: 0, start: false, final: false },
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
}

export const t4 = {
  graph: {
    nodes: {
      S: { x: 0, y: 0, start: true , final: false },
      P1: { x: 0, y: 0, start: false , final: false },
      P2: { x: 0, y: 0, start: false , final: false },
      P3: { x: 0, y: 0, start: false , final: false },
      P4: { x: 0, y: 0, start: false , final: true },
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
}

export default { t1, t2, t3, t4 };
