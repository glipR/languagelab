import NFA from './nfa.js';

export class Regex {
  static LETTER_READ_SPACING = 100;
  static PIPE_Y_SPACING = 150;
  static CONCAT_X_SPACING = 60;

  static generateAllOfLength(length, alphabet, lossChance = 0.8) {
    if (length === 1) {
      return alphabet.filter(() => Math.random() > lossChance);
    }
    let all = [];
    // Concat
    for (let i=1; i<length; i++) {
      const left = Regex.generateAllOfLength(i, alphabet, lossChance);
      const right = Regex.generateAllOfLength(length-i, alphabet, lossChance);
      for (const l of left) {
        for (const r of right) {
          all.push(l+r);
        }
      }
    }
    // Pipe
    for (let i=1; i<length-2; i++) {
      // 2 sets of brackets.
      let j = length - i - 1 - 4;
      if (i === 1) {
        // No brackets needed.
        if (length - i - 1 === 1) {
          j = 1;
        } else if (length - i - 1 <= 3) {
          // Impossible / Unnecessary (ab) needs 4 characters..
          continue
        } else {
          j = length - i - 3;
        }
      } else {
        if (length - i - 3 === 1) {
          j = 1;
        } else if (length - i - 3 <= 3) {
          // Impossible / Unnecessary (ab) needs 4 characters..
          continue;
        } else {
          j = length - i - 5;
        }
      }
      const left = Regex.generateAllOfLength(i, alphabet, lossChance);
      const right = Regex.generateAllOfLength(j, alphabet, lossChance);
      for (const l of left) {
        for (const r of right) {
          const lw = i === 1 ? l : `(${l})`;
          const rw = j === 1 ? r : `(${r})`;
          all.push(`${lw}|${rw}`);
        }
      }
    }
    // Kleene
    if (length == 2) {
      all = all.concat(alphabet.map(a => `${a}*`));
    } else if (length > 4) {
      all = all.concat(Regex.generateAllOfLength(length-3, alphabet, lossChance).map(a => `(${a})*`));
    }

    return all.filter(() => Math.random() > lossChance);
  }

  constructor (s) {
    this.s = s;
    this.parse();
  }

  parse() {
    // First, find bracket pairs.
    const bracketStack = [];
    this.bracketPairs = {};
    for (let i=0; i<this.s.length; i++) {
      if (this.s[i] === '(') {
        bracketStack.push(i);
      }
      if (this.s[i] === ')') {
        if (bracketStack.length === 0) {
          throw new Error('Unmatched brackets in regex');
        }
        this.bracketPairs[bracketStack.pop()] = i;
      }
    }
    if (bracketStack.length > 0) {
      throw new Error('Unmatched brackets in regex');
    }
    this.tree = this.elementTree(0, this.s.length-1);
    this.parsed = this.subParse(this.tree);
  }

  elementTree(start, end) {
    // Generates a recursive list of characters, where each bracket structure combines into a list.
    const elements = [];
    let i = start;
    while (i <= end) {
      if (this.s[i] === '(') {
        elements.push(this.elementTree(i+1, this.bracketPairs[i]-1));
        i = this.bracketPairs[i]+1;
      } else {
        elements.push(this.s[i]);
        i++;
      }
    }
    return elements;
  }

  subParse(tree) {
    // If an object and not an array, this is already parsed.
    if (tree.length === undefined) {
      return tree;
    }
    // Parses a tree of elements into a recursive object.
    // Start by parsing all kleene stars.
    for (let i=0; i<tree.length; i++) {
      if (tree[i] === '*') {
        tree[i-1] = {type: 'kleene', value: this.subParse(tree[i-1])};
        tree.splice(i, 1);
      }
    }
    // Then by parsing all pluses stars.
    for (let i=0; i<tree.length; i++) {
      if (tree[i] === '+') {
        tree[i-1] = {type: 'plus', value: this.subParse(tree[i-1])};
        tree.splice(i, 1);
      }
    }
    // Next, combine adjacent pipes into a pipe object.
    for (let i=0; i<tree.length; i++) {
      if (tree[i] === '|') {
        let j = i;
        while (j+2 < tree.length && tree[j+2] === '|') {
          j += 2;
        }
        const pipe = {type: 'pipe', values: []};
        for (let k=i-1; k<=j+1; k+=2) {
          pipe.values.push(this.subParse(tree[k]));
        }
        tree[i-1] = pipe;
        tree.splice(i, j-i+2);
      }
    }
    // Finally, combine adjacent elements into a concat object.
    if (tree.length === 1) {
      return (typeof tree[0] !== 'string') ? this.subParse(tree[0]) : tree[0];
    }
    const concat = {type: 'concat', values: tree.map(e => e.length === undefined ? e : this.subParse(e))};
    return concat;
  }

  toNFA() {
    if (this.s.length === 0) {
      // Empty, NFA needs special handling.
      const nfa = new NFA();
      nfa.import({
        states: [
          {name: 'S', starting: true, accepting: true, x: 0, y: 0},
          {name: 'E', starting: false, accepting: false, x: 100, y: 0},
        ],
        transitions: [{ from: 'S', to: 'E', label: 'a'}] // Single character here is fine, we just need something.
      })
      return nfa;
    }
    // Converts the parsed regex into an NFA.
    const nfaJSON = this.recToNFA(this.parsed, '', 20, 400);
    // Import has states as a list.
    nfaJSON.states = Object.entries(nfaJSON.states).map(([k, v]) => ({...v, position: {x:v.x, y:v.y}, name: k}));
    // Combine all transitions with the same from/to into a single edge.
    const transitions = {};
    for (const edge of nfaJSON.transitions) {
      const key = `${edge.from}-${edge.to}`;
      if (transitions[key] === undefined) {
        transitions[key] = { from: edge.from, to: edge.to, label: [] };
      }
      transitions[key].label.push(edge.label)
    }
    nfaJSON.transitions = Object.values(transitions).map(({from, to, label}) => {
      // First, make unique only.
      label = [...new Set(label)];
      // Then, join.
      return {from, to, label: label.join(',')};
    });
    const nfa = new NFA();
    nfa.import(nfaJSON);
    return nfa;
  }

  recToNFA(tree, prefix, xStart, yStart) {
    if (typeof tree === 'string') {
      // Single character
      const start = prefix + 's';
      const end = prefix + 'e';
      return {
        states: {
          [start]: {x:xStart, y:yStart, starting: true},
          [end]: {x:xStart+Regex.LETTER_READ_SPACING, y:yStart, accepting: true},
        },
        transitions: [{from: start, to: end, label: tree}]
      };
    }
    if (tree.type === 'kleene') {
      const val = this.recToNFA(tree.value, prefix, xStart, yStart);
      const nfa = {
        states: {...val.states},
        transitions: [...val.transitions],
      }
      // Kleene star means that the start/end states are interchangeable.
      const start = Object.keys(val.states).find(k => val.states[k].starting);
      const end = Object.keys(val.states).find(k => val.states[k].accepting);
      nfa.transitions.push({from: start, to: end, label: 'ε'});
      nfa.transitions.push({from: end, to: start, label: 'ε'});
      return nfa;
    }
    else if (tree.type === 'plus') {
      const val = this.recToNFA(tree.value, prefix, xStart, yStart);
      const nfa = {
        states: {...val.states},
        transitions: [...val.transitions],
      }
      // Kleene star means that the start/end states are interchangeable.
      const start = Object.keys(val.states).find(k => val.states[k].starting);
      const end = Object.keys(val.states).find(k => val.states[k].accepting);
      // Don't include the edge allowing us to skip the first occurrence of the value.
      // nfa.transitions.push({from: start, to: end, label: 'ε'});
      nfa.transitions.push({from: end, to: start, label: 'ε'});
      return nfa;
    }
    else if (tree.type === 'pipe') {
      // Introduce a new start + end state, use epsilons.
      const nfas = tree.values.map((v, i) => this.recToNFA(v, prefix + `p${i}-`, xStart + Regex.LETTER_READ_SPACING, yStart + Regex.PIPE_Y_SPACING * i));
      const nfa = nfas.reduce((acc, n) => {
        acc.states = {...acc.states, ...n.states};
        acc.transitions = [...acc.transitions, ...n.transitions];
        return acc;
      }, {states: {}, transitions: []});
      const starts = nfas.map(n => Object.keys(n.states).find(k => n.states[k].starting));
      const ends = nfas.map(n => Object.keys(n.states).find(k => n.states[k].accepting));
      Object.keys(nfa.states).forEach(k => nfa.states[k] = {...nfa.states[k], starting: false, accepting: false});
      const midY = yStart + Regex.PIPE_Y_SPACING * (nfas.length-1) / 2;
      nfa.states[prefix + 's'] = {x:xStart, y:midY, starting: true};
      nfa.states[prefix + 'e'] = {x:Math.max(...Object.values(nfa.states).map(n => n.x)) + Regex.LETTER_READ_SPACING, y:midY, accepting: true};
      for (const start of starts) {
        nfa.transitions.push({from: prefix + 's', to: start, label: 'ε'});
      }
      for (const end of ends) {
        nfa.transitions.push({from: end, to: prefix + 'e', label: 'ε'});
      }
      return nfa;
    }
    else if (tree.type === 'concat') {
      // Concatenate the NFAs.
      const nfas = tree.values.reduce((acc, v, i) => {
        const prevX = i === 0 ? xStart : acc[acc.length-1].states[Object.keys(acc[acc.length-1].states).find(k => acc[acc.length-1].states[k].accepting)].x + Regex.LETTER_READ_SPACING;
        acc.push(this.recToNFA(v, prefix + `c${i}-`, prevX, yStart));
        return acc;
      }, []);
      const nfa = nfas.reduce((acc, n) => {
        acc.states = {...acc.states, ...n.states};
        acc.transitions = [...acc.transitions, ...n.transitions];
        return acc;
      }, {states: {}, transitions: []});
      const starts = nfas.map(n => Object.keys(n.states).find(k => n.states[k].starting));
      const ends = nfas.map(n => Object.keys(n.states).find(k => n.states[k].accepting));
      Object.keys(nfa.states).forEach(k => nfa.states[k] = {...nfa.states[k], starting: false, accepting: false});
      for (let i=0; i<starts.length-1; i++) {
        nfa.transitions.push({from: ends[i], to: starts[i+1], label: 'ε'});
      }
      nfa.states[starts[0]].starting = true;
      nfa.states[ends[ends.length-1]].accepting = true;
      return nfa;
    }
  }
}

export default Regex;
