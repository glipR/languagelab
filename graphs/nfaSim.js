export const t1JSON = {
  nodes: {
    S: { x: 300, y: 500, start: true, accepting: true },
    A: { x: 300, y: 300 },
    B: { x: 500, y: 350 },
    C: { x: 700, y: 300 },
    D: { x: 600, y: 500 },
  },
  edges: [
    { from: 'S', to: 'A', label: 'ε' },
    { from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 40, y: -40 }} },
    { from: 'B', to: 'A', label: 'a', style: { edgeAnchor: { x: -40, y: 40 }} },
    { from: 'B', to: 'C', label: 'b' },
    { from: 'B', to: 'D', label: 'b' },
    { from: 'C', to: 'D', label: 'a' },
    { from: 'D', to: 'S', label: 'a' },
  ],
}

export const t2JSON = {
  nodes: {
    A: { x: 400, y: 300, start: true },
    B: { x: 600, y: 300 },
    C: { x: 500, y: 400 },
    1: { x: 300, y: 200, accepting: true },
    2: { x: 700, y: 200, accepting: true },
    3: { x: 500, y: 550, accepting: true }
  },
  edges: [
    { from: 'A', to: 'B', label: 'ε' },
    { from: 'B', to: 'C', label: 'a' },
    { from: 'C', to: 'A', label: 'b' },
    { from: 'A', to: '1', label: 'ε' },
    { from: 'B', to: '2', label: 'a' },
    { from: 'C', to: '3', label: 'b' },
  ],
}

export const t3JSON = {
  nodes: {
    A: { x: 300, y: 300, start: true },
    B: { x: 700, y: 300, accepting: true },
    C: { x: 700, y: 500 },
    D: { x: 300, y: 500 },
  },
  edges: [
    { from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 0, y: -40}} },
    { from: 'B', to: 'C', label: 'b', style: { edgeAnchor: { x: -40, y: 0}} },
    { from: 'C', to: 'D', label: 'c', style: { edgeAnchor: { x: 0, y: 40}} },
    { from: 'D', to: 'A', label: 'd', style: { edgeAnchor: { x: 40, y: 0}} },
    { from: 'A', to: 'C', label: 'ε', style: { edgeAnchor: { x: 40, y: -40 }, labelRatio: 0.25 } },
    { from: 'C', to: 'A', label: 'e', style: { edgeAnchor: { x: -40, y: 40 }, labelRatio: 0.25 } },
    { from: 'B', to: 'D', label: 'ε', style: { edgeAnchor: { x: 40, y: 40 }, labelRatio: 0.25 } },
    { from: 'D', to: 'B', label: 'ε', style: { edgeAnchor: { x: -40, y: -40 }, labelRatio: 0.25 } },
    { from: 'C', to: 'B', label: 'ε', style: { edgeAnchor: { x: 50, y: -5 }} },
    { from: 'A', to: 'D', label: 'ε', style: { edgeAnchor: { x: -50, y: -5 }} },
  ],
}
