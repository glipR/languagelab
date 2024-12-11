import DFA from "../dfa.js";
import NFA from "../nfa.js";

export const t1JSON = {
  nodes: {
    W: { x: 300, y: 300, start: true },
    X: { x: 450, y: 300 },
    Y: { x: 650, y: 300 },
    Z: { x: 800, y: 300, accepting: true },
  },
  edges: [
    { from: 'W', to: 'X', label: 'b' },
    { from: 'X', to: 'Y', label: 'b' },
    { from: 'Y', to: 'Z', label: 'b' },
    { from: 'X', to: 'X', label: 'a' },
    { from: 'Y', to: 'Y', label: 'a' },
  ],
}

export const t2JSON = {
  nodes: {
    S: { x: 300, y: 250, start: true },
    I: { x: 450, y: 175 },
    T: { x: 600, y: 175 },
    A: { x: 450, y: 325 },
    B: { x: 600, y: 325 },
    Z: { x: 750, y: 250, accepting: true },
  },
  edges: [
    { from: 'S', to: 'I', label: 'h' },
    { from: 'S', to: 'A', label: 'h' },
    { from: 'I', to: 'T', label: 'i', style: { edgeAnchor: { x: 0, y: -40 }} },
    { from: 'T', to: 'I', label: 't', style: { edgeAnchor: { x: 0, y: 40 }} },
    { from: 'A', to: 'B', label: 'a', style: { edgeAnchor: { x: 0, y: -40 }} },
    { from: 'B', to: 'A', label: 'b', style: { edgeAnchor: { x: 0, y: 40 }} },
    { from: 'T', to: 'Z', label: 'ε' },
    { from: 'B', to: 'Z', label: 'b' },
    { from: 'Z', to: 'S', label: 'ε', style: { edgeAnchor: { x: 0, y: -225 }, anchorOffsetMult: 1 } },
  ]
}

export const t3JSON = {
  nodes: {
    S: { x: 200, y: 250, start: true, accepting: true },
    1: { x: 400, y: 150 },
    2: { x: 400, y: 250 },
    3: { x: 400, y: 350 },
    '2-1': { x: 550, y: 250 },
    '3-1': { x: 550, y: 350 },
    '3-2': { x: 700, y: 350 },
    T: { x: 800, y: 200 },
  },
  edges: [
    { from: 'S', to: '1', label: '1' },
    { from: 'S', to: '2', label: '2' },
    { from: 'S', to: '3', label: '3' },
    { from: '1', to: 'T', label: 'a' },
    { from: '2', to: '2-1', label: 'a' },
    { from: '2-1', to: 'T', label: 'a' },
    { from: '3', to: '3-1', label: 'a' },
    { from: '3-1', to: '3-2', label: 'a' },
    { from: '3-2', to: 'T', label: 'a' },
    { from: 'T', to: 'T', label: 'b' },
    { from: 'T', to: 'S', label: 'ε', style: { edgeAnchor: { x: -130, y: -200 }, anchorOffsetMult: 0.9 } },
  ],
}

const startAngle = -Math.PI * 0.7
const diff = Math.PI * 2/7;
const xMag = 200;
const yMag = 140;
export const t4JSON = {
  nodes: {
    0: { x: 500 + Math.cos(startAngle) * xMag, y: 270 + Math.sin(startAngle) * yMag, start: true, accepting: true },
    1: { x: 500 + Math.cos(startAngle + diff) * xMag, y: 270 + Math.sin(startAngle + diff) * yMag },
    2: { x: 500 + Math.cos(startAngle + diff * 2) * xMag, y: 270 + Math.sin(startAngle + diff * 2) * yMag },
    3: { x: 500 + Math.cos(startAngle + diff * 3) * xMag, y: 270 + Math.sin(startAngle + diff * 3) * yMag },
    4: { x: 500 + Math.cos(startAngle + diff * 4) * xMag, y: 270 + Math.sin(startAngle + diff * 4) * yMag },
    5: { x: 500 + Math.cos(startAngle + diff * 5) * xMag, y: 270 + Math.sin(startAngle + diff * 5) * yMag },
    6: { x: 500 + Math.cos(startAngle + diff * 6) * xMag, y: 270 + Math.sin(startAngle + diff * 6) * yMag },
  },
  edges: [
    { from: '0', to: '0', label: 'h' },
    { from: '0', to: '1', label: 'a' },
    { from: '1', to: '2', label: 'a' },
    { from: '2', to: '3', label: 'a' },
    { from: '3', to: '4', label: 'a' },
    { from: '4', to: '5', label: 'a' },
    { from: '5', to: '6', label: 'a' },
    { from: '6', to: '0', label: 'a' },
    { from: '0', to: '2', label: 'ε', style: { edgeAnchor: { x: 0, y: 60 }} },
  ],
}
