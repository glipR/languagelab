import { highlightColours } from "../colours.js";

export const t1JSON = {
  nodes: {
    S: { x: -200, y: 0, start: true, style: { fill: highlightColours[0] } },
    A: { x: 0, y: 0, style: { fill: highlightColours[1] } },
    B: { x: 0, y: 200, style: { fill: highlightColours[2] } },
    C: { x: 200, y: -100, accepting: true, style: { fill: highlightColours[3] } },
    D: { x: 200, y: 100, accepting: true, style: { fill: highlightColours[4] } },
  },
  edges: [
    { from: 'S', to: 'A', label: 'ε' },
    { from: 'B', to: 'D', label: 'ε' },
    { from: 'S', to: 'B', label: 'b' },
    { from: 'A', to: 'C', label: 'b' },
    { from: 'A', to: 'D', label: 'a' },
    { from: 'B', to: 'A', label: 'a' },
    { from: 'C', to: 'S', label: 'a', style: { edgeAnchor: { x: -30, y: -70 } } },
  ],
}

export const t2JSON = {
  nodes: {
    S: { x: -200, y: 0, start: true, style: { fill: highlightColours[0] } },
    A: { x: 0, y: -150, style: { fill: highlightColours[1] } },
    B: { x: 0, y: 150, style: { fill: highlightColours[2] } },
    C: { x: 200, y: 0, accepting: true, style: { fill: highlightColours[3] } },
  },
  edges: [
    { from: 'S', to: 'A', label: 'ε' },
    { from: 'B', to: 'A', label: 'ε' },
    { from: 'S', to: 'B', label: 'a' },
    { from: 'A', to: 'C', label: 'a' },
    { from: 'B', to: 'C', label: 'b' },
    { from: 'C', to: 'C', label: 'b' },
    { from: 'A', to: 'A', label: 'b' },
    { from: 'B', to: 'B', label: 'b' },
  ],
}

export const t3JSON = {
  nodes: {
    1: { x: 0, y: -200, start: true, accepting: true, style: { fill: highlightColours[0] } },
    2: { x: 200, y: -50, style: { fill: highlightColours[1] } },
    3: { x: 100, y: 150, style: { fill: highlightColours[2] } },
    4: { x: -100, y: 150, style: { fill: highlightColours[3] } },
    5: { x: -200, y: -50, style: { fill: highlightColours[4] } },
  },
  edges: [
    { from: '1', to: '2', label: 'a' },
    { from: '2', to: '3', label: 'a' },
    { from: '3', to: '4', label: 'b', style: { edgeAnchor: {x: 0, y: 50 }, anchorOffsetMult: 1} },
    { from: '4', to: '5', label: 'b' },
    { from: '5', to: '1', label: 'b' },
    { from: '3', to: '4', label: 'ε', style: { edgeAnchor: { x: 0, y: -50 }, anchorOffsetMult: 1} },
    { from: '5', to: '3', label: 'ε', style: { edgeAnchor: { x: 50, y: -50 }} },
  ],
}

export default { t1JSON, t2JSON, t3JSON };
