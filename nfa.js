import Graph from "./graph.js";
import DFA from "./dfa.js";
import Regex from "./regex.js";

class NFA extends Graph {
  toDFA() {
    // Convert this NFA to a DFA
    const stateMap = {};
    Object.keys(this.nodes).forEach((node, i) => {
      stateMap[node] = i;
    });
    const startState = Object.values(this.nodes).find((node) => node.style.isEntry);
    const nullState = new Set();
    const initialState = this._includeEpsilonTransitions(new Set([stateMap[startState.label]]), stateMap);
    const alph = this.alphabet();

    const stateSet = {
      [this._stateSetToString(initialState, stateMap)]: initialState,
      [this._stateSetToString(nullState, stateMap)]: nullState,
    }
    const edgeMap = {
      [this._stateSetToString(nullState, stateMap)]: {}
    };
    alph.forEach((char) => edgeMap[this._stateSetToString(nullState, stateMap)][char] = this._stateSetToString(nullState, stateMap));
    const curQueue = [initialState];

    while (curQueue.length > 0) {
      const curState = curQueue.shift();
      const curString = this._stateSetToString(curState, stateMap);
      edgeMap[curString] = {};
      alph.forEach((char) => {
        const newState = this._includeEpsilonTransitions(this._stateSetAfterChar(curState, char, stateMap), stateMap);
        const newString = this._stateSetToString(newState, stateMap);
        edgeMap[curString][char] = newString;
        if (Object.keys(stateSet).includes(newString)) return;
        curQueue.push(newState);
        stateSet[newString] = newState;
      });
    }

    const dfa = new DFA();
    const dfaJSON = {
      nodes: {},
      edges: [],
    }
    Object.values(stateSet).forEach((state) => {
      const label = this._stateSetToString(state, stateMap);
      const acceptingSet = Object.values(this.nodes).filter(node => node.style.doubleBorder).reduce((acc, node) => {
        acc.add(stateMap[node.label]);
        return acc;
      }, new Set([]));
      const isAccepting = acceptingSet.intersection(state).size > 0;
      const isEntry = label === this._stateSetToString(initialState, stateMap);
      dfaJSON.nodes[label] = {
        accepting: isAccepting,
        start: isEntry,
        x: 0,
        y: 0,
      };
    });
    Object.keys(edgeMap).forEach((s1) => {
      Object.keys(edgeMap[s1]).forEach(c => {
        const s2 = edgeMap[s1][c];
        dfaJSON.edges.push({
          from: s1,
          to: s2,
          label: c,
        });
      })
    });
    console.log(dfaJSON);
    dfa.fromJSON(dfaJSON);
    return dfa;
  }

  alphabet() {
    return Array.from(this.edges.reduce((acc, edge) => {
      const label = edge.style.edgeLabel;
      const chars = label.split(',').map((char) => char.trim()).filter((char) => char !== 'ε');
      chars.forEach((char) => acc.add(char));
      return acc;
    }, new Set()));
  }

  fromGNFAtoNFA() {
    // Currently our transitions contain regular expressions. Convert this into an NFA.
    const validTransition = (label) => {
      return label.split(',').every(char => char.trim().length === 1 && 'abcdefghijklmnopqrstuvwxyzε'.includes(char.trim()))
    }
    const current = this.export();
    current.states = current.states.map(s => ({...s, name: `orig-${s.name}`}))
    current.transitions = current.transitions.reduce((acc, transition, i) => {
      transition.from = `orig-${transition.from}`;
      transition.to = `orig-${transition.to}`;
      if (!validTransition(transition.label)) {
        const r = new Regex(transition.label);
        const nfa = r.toNFA().export();
        current.states.push(...nfa.states.map(s => ({...s, name: `new-${i}-${s.name}`, accepting: false, starting: false })));
        acc.push(...nfa.transitions.map(t => ({...t, from: `new-${i}-${t.from}`, to: `new-${i}-${t.to}`})));
        const start = nfa.states.find(s => s.starting).name;
        const ending = nfa.states.filter(s => s.accepting).map(s => s.name);
        acc.push({from: transition.from, to: `new-${i}-${start}`, label: 'ε'});
        ending.forEach((end) => acc.push({from: `new-${i}-${end}`, to: transition.to, label: 'ε'}));
      } else {
        acc.push(transition);
      }
      return acc;
    }, []);
    const nfa = new NFA();
    nfa.import(current);
    return nfa;
  }

  _stateSetToString(stateSet, stateMap) {
    const smallString = Array.from(stateSet).sort().map(s => Object.keys(stateMap).find(k => stateMap[k] === s)).join('-');
    return smallString;
  }

  _stateSetAfterChar(curState, char, stateMap) {
    let newStates = new Set([]);
    this.edges.forEach((edge) => {
      if (!edge.style.edgeLabel.includes(char)) return;
      const from = stateMap[edge.from.label];
      const to = stateMap[edge.to.label];
      if (curState.has(from)) {
        newStates.add(to);
      }
    });
    return newStates;
  }

  _includeEpsilonTransitions(curState, stateMap) {
    while (true) {
      const newSet = curState.union(this._stateSetAfterChar(curState, 'ε', stateMap));
      if (newSet.size === curState.size) return newSet;
      curState = newSet;
    }
  }
}

export default NFA;
