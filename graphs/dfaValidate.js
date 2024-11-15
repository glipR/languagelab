export const t1JSON = {
  nodes: {
    A: { x: 300, y: 150 },
    B: { x: 700, y: 150, accepting: true },
    C: { x: 500, y: 350, start: true },
  },
  edges: [
    { from: 'A', to: 'A', label: 'a' },
    { from: 'B', to: 'B', label: 'b' },
    { from: 'B', to: 'A', label: 'a', style: {edgeAnchor: { x: 0, y: -40 }} },
    { from: 'A', to: 'B', label: 'b', style: {edgeAnchor: { x: 0, y: 40 }} },
    { from: 'C', to: 'A', label: 'a' },
    { from: 'C', to: 'B', label: 'b' },
  ],
}

export const t2JSON = {
  nodes: {
    A: { x: 200, y: 150, start: true },
    B: { x: 350, y: 150 },
    C: { x: 500, y: 150 },
    D: { x: 650, y: 150 },
    E: { x: 800, y: 150, accepting: true },
    X: { x: 500, y: 350 }
  },
  edges: [
    { from: 'A', to: 'B', label: 'b' },
    { from: 'B', to: 'C', label: 'a' },
    { from: 'C', to: 'D', label: 'b' },
    { from: 'D', to: 'E', label: 'a' },
    { from: 'C', to: 'C', label: 'a' },
    { from: 'E', to: 'E', label: 'a' },
    // Sink everything else to X
    { from: 'A', to: 'X', label: 'a' },
    { from: 'B', to: 'X', label: 'b' },
    { from: 'D', to: 'X', label: 'b' },
    { from: 'X', to: 'X', label: 'a, b' },
  ]
}

export const t3JSON = {
  nodes: {
    A: { x: 300, y: 250, start: true },
    B: { x: 500, y: 150, accepting: true },
    C: { x: 500, y: 350, accepting: true },
    D: { x: 700, y: 250 },
  },
  edges: [
    { from: 'A', to: 'B', label: 'a' },
    { from: 'A', to: 'C', label: 'b' },
    { from: 'B', to: 'D', label: 'a' },
    { from: 'C', to: 'D', label: 'b' },
    { from: 'B', to: 'B', label: 'b' },
    { from: 'C', to: 'C', label: 'a' },
    { from: 'D', to: 'D', label: 'a, b' },
  ],
}

export const t4JSON = {
  nodes: {
    A: {x: 300, y: 250, start: true, accepting: true },
    B: {x: 500, y: 150 },
    C: {x: 500, y: 350 },
    X: {x: 700, y: 250 },
  },
  edges: [
    { from: 'A', to: 'B', label: 'a' },
    { from: 'B', to: 'C', label: 'a' },
    { from: 'C', to: 'A', label: 'a' },
    { from: 'A', to: 'A', label: 'h' },
    // Sink to X
    { from: 'B', to: 'X', label: 'h' },
    { from: 'C', to: 'X', label: 'h' },
    { from: 'X', to: 'X', label: 'a, h' },
  ]
}

export default { t1JSON, t2JSON, t3JSON, t4JSON };
