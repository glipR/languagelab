export const t1JSON = {
  nodes: {
    X: { x: 0, y: 0, start: true },
    A: { x: 100, y: -100, final: true },
    B: { x: 100, y: 100 },
  },
  edges: [
    { from: 'X', to: 'A', label: 'a' },
    { from: 'X', to: 'B', label: 'b' },
    { from: 'A', to: 'A', label: 'a' },
    { from: 'A', to: 'B', label: 'b' },
    { from: 'B', to: 'A', label: 'a' },
    { from: 'B', to: 'B', label: 'b' },
  ],
}
