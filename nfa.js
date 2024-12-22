import Graph from "./graph.js";
import DFA from "./dfa.js";

class NFA extends Graph {
  toDFA() {
    // Convert this NFA to a DFA
    const stateMap = {};
    Object.keys(this.nodes).forEach((node, i) => {
      stateMap[node] = i;
    });
    const startState = Object.values(this.nodes).find((node) => node.style.isEntry);
    const nullState = 0;
    const initialState = this._includeEpsilonTransitions(1 << stateMap[startState.label], stateMap);
    const alph = this.alphabet();

    const stateSet = new Set([nullState, initialState]);
    const edgeMap = {
      [nullState]: {}
    };
    alph.forEach((char) => edgeMap[nullState][char] = nullState);
    const curQueue = [initialState];

    while (curQueue.length > 0) {
      const curState = curQueue.shift();
      edgeMap[curState] = {};
      alph.forEach((char) => {
        const newState = this._includeEpsilonTransitions(this._stateSetAfterChar(curState, char, stateMap), stateMap);
        edgeMap[curState][char] = newState;
        if (!stateSet.has(newState)) {
          curQueue.push(newState);
          stateSet.add(newState);
        }
      });
    }

    const dfa = new DFA();
    const dfaJSON = {
      nodes: {},
      edges: [],
    }
    stateSet.forEach((state) => {
      const label = this._stateSetToString(state);
      const acceptingSet = Object.values(this.nodes).filter(node => node.style.doubleBorder).reduce((acc, node) => {
        acc |= (1 << stateMap[node.label]);
        return acc;
      }, 0);
      const isAccepting = (acceptingSet & state) > 0;
      const isEntry = state === initialState;
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
          from: this._stateSetToString(parseInt(s1)),
          to: this._stateSetToString(parseInt(s2)),
          label: c,
        });
      })
    });
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

  _stateSetToString(stateSet) {
    // TODO: Append to the right until the length is the same as the number of states.
    const smallString = stateSet.toString(2).split('').reverse().join('');
    const nodeCount = Object.keys(this.nodes).length;
    const padding = '0'.repeat(nodeCount - smallString.length);
    return smallString + padding;
  }

  _stateSetAfterChar(curStateBitset, char, stateMap) {
    let newStates = 0;
    this.edges.forEach((edge) => {
      if (!edge.style.edgeLabel.includes(char)) return;
      const from = stateMap[edge.from.label];
      const to = stateMap[edge.to.label];
      if (curStateBitset & (1 << from)) {
        newStates |= (1 << to);
      }
    });
    return newStates;
  }

  _includeEpsilonTransitions(curStateBitset, stateMap) {
    while (true) {
      const newSet = curStateBitset | this._stateSetAfterChar(curStateBitset, 'ε', stateMap);
      if (newSet === curStateBitset) return newSet;
      curStateBitset = newSet;
    }
  }
}

export default NFA;
