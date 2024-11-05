export const t1JSON = {
  nodes: {
    A: { x: 300, y: 400, start: true, final: true },
    B: { x: 500, y: 250 },
    C: { x: 500, y: 550 },
    D: { x: 700, y: 250, final: true },
    E: { x: 700, y: 550 },
  },
  edges: [
    { from: 'A', to: 'B', label: 'a' },
    { from: 'A', to: 'C', label: 'b' },
    { from: 'B', to: 'D', label: 'b' },
    { from: 'B', to: 'E', label: 'a', style: {labelRatio: 0.25} },
    { from: 'C', to: 'D', label: 'a', style: {labelRatio: 0.25} },
    { from: 'C', to: 'E', label: 'b' },
    { from: 'D', to: 'D', label: 'a, b' },
    { from: 'E', to: 'E', label: 'a, b' },
  ],
}

export const t2JSON = {
  nodes: {
    A: {x: 300, y: 400, start: true, final: true},
    B: {x: 700, y: 400},
  },
  edges: [
    {from: 'A', to: 'A', label: 'b'},
    {from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 0, y: 40 }}},
    {from: 'B', to: 'A', label: 'a', style: { edgeAnchor: { x: 0, y: -40 }}},
    {from: 'B', to: 'B', label: 'b'},
  ],
}

export const t3JSON = {
  nodes: {
    A: { x: 300, y: 400},
    B: { x: 450, y: 250, start: true },
    C: { x: 600, y: 400, final: true },
    D: { x: 750, y: 250, final: true },
  },
  edges: [
    { from: 'A', to: 'B', label: 'a,b', style: { edgeAnchor: { x: 30, y: 30 }} },
    { from: 'A', to: 'C', label: 'c' },
    { from: 'B', to: 'A', label: 'a,c', style: { edgeAnchor: { x: -30, y: -30 }} },
    { from: 'B', to: 'D', label: 'b' },
    { from: 'C', to: 'B', label: 'a,c'},
    { from: 'C', to: 'C', label: 'b' },
    { from: 'D', to: 'C', label: 'b,c' },
    { from: 'D', to: 'D', label: 'a' },
  ],
}

export default { t1JSON, t2JSON, t3JSON };
