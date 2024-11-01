import { t1JSON } from "./graphs/dfaMinimise.js";
import DFA from "./dfa.js";

const t1 = new DFA();
t1.fromJSON(t1JSON);
console.log(t1.validate());
console.log(t1.collectAlphabet());

const minimised = t1.minimise();
console.log(minimised.validate());
console.log(minimised);

const simple = new DFA();
simple.fromJSON({
  nodes: {
    A: { x: 0, y: 0 },
    B: { x: 0, y: 0, start: true, final: true },
  },
  edges: [
    { from: 'A', to: 'A', label: 'a' },
    { from: 'A', to: 'B', label: 'b' },
    { from: 'B', to: 'A', label: 'a' },
    { from: 'B', to: 'B', label: 'b' },
  ]
})

const other = simple.invert();


// Other is equivalent to minimised and t1.

console.log(t1.empty());
console.log(other.empty());
const comb1 = t1.combine(other, (me, other) => me ^ other);
console.log(comb1.empty());
console.log(t1.equivalent(other));
console.log(t1.equivalent(simple));
console.log(t1.findAcceptingString());
console.log(comb1.findAcceptingString());
console.log(simple.findAcceptingString());

export default 'test';
