import Graph, { AbstractEdge, Node } from "./graph.js";
import DFA from "./dfa.js";
import Regex from "./regex.js";
import { magnitude, mergeDeep, multiply, negate, rotate, vectorCombine } from "./utils.js";
import createGraph from 'https://cdn.jsdelivr.net/npm/ngraph.graph@20.0.1/+esm'
import createLayout from 'https://cdn.jsdelivr.net/npm/ngraph.forcelayout@3.3.1/+esm';

const gsc = window.gameScaling ?? 1;

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
    }, new Set())).sort();
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

  static randomConfiguration = {
    minNodes: 3,
    maxNodes: 6,
    chanceNumChar: {
      0: 0.2,
      1: 0.7,
      2: 0.08,
      3: 0.02,
    },
    chanceIncludeEpsilon: 0.1,
    chanceAccepting: 0.5,
    forceConnected: true, // TODO: Implement this
    area: {
      width: 1000 * gsc,
      height: 600 * gsc,
      x: 0,
      y: 0,
    },
    alphabet: null,
  }

  static randomNFA(config={}, nodeStyle={}, edgeStyle={}) {
    const merged = mergeDeep({}, NFA.randomConfiguration, config);
    if (merged.alphabet === null) {
      merged.alphabet = Array.from({length: Math.floor(Math.random() * 5) + 2}, (_, i) => String.fromCharCode(97 + i));
    }
    const nfa = new NFA();
    const g = createGraph();
    const numNodes = Math.floor(Math.random() * (merged.maxNodes - merged.minNodes + 1)) + merged.minNodes;
    const labels = Array.from({length: numNodes}, (_, i) => String.fromCharCode(65 + i));
    for (let i = 0; i < numNodes; i++) {
      nfa.addNode(new Node(labels[i], {x: Math.random() * merged.area.width + merged.area.x, y: Math.random() * merged.area.height + merged.area.y}, {
        ...nodeStyle,
        doubleBorder: Math.random() < merged.chanceAccepting,
        isEntry: i === 0,
      }));
      g.addNode(labels[i]);
    }
    const alphabet = merged.alphabet;
    const nodes = Object.values(nfa.nodes);
    const charMapping = {};
    nodes.forEach((node) => {
      charMapping[node.label] = {};
      alphabet.forEach((char) => {
        let num = Math.random();
        let chosen;
        for (let [i, chance] of Object.entries(merged.chanceNumChar)) {
          if (num < chance) {
            chosen = i;
            break;
          } else {
            num -= chance;
          }
        }
        // Select chosen random nodes to connect to.
        // Shuffle the nodes and select the first `chosen` nodes.
        const shuffled = nodes.sort(() => Math.random() - 0.5);
        const targets = shuffled.slice(0, chosen);
        targets.forEach((target) => {
          if (!charMapping[node.label][target.label]) charMapping[node.label][target.label] = [];
          charMapping[node.label][target.label].push(char);
        });
      });
      nodes.forEach((target) => {
        if (node.label === target.label) return;
        if (Math.random() < merged.chanceIncludeEpsilon) {
          if (!charMapping[node.label][target.label]) charMapping[node.label][target.label] = [];
          charMapping[node.label][target.label].push('ε');
        }
      })
    });
    Object.entries(charMapping).forEach(([from, tos]) => {
      Object.entries(tos).forEach(([to, chars]) => {
        g.addLink(from, to);
      });
    });

    if (merged.forceConnected) {
      // DFS from i=0 to make sure all nodes are connected.
      const visited = new Set([nodes[0].label]);
      const stack = [nodes[0].label];
      while (stack.length > 0) {
        const cur = stack.pop();
        visited.add(cur);
        Object.keys(charMapping[cur] ?? {}).forEach((next) => {
          if (!visited.has(next)) stack.push(next);
        });
      }
      const epsilonAlphabet = merged.alphabet.concat(['ε']);
      nodes.forEach((node) => {
        if (!visited.has(node.label)) {
          const target = nodes.filter((n) => visited.has(n.label)).sort(() => Math.random() - 0.5)[0];

          if (!charMapping[target.label]) charMapping[target.label] = {};
          if (!charMapping[target.label][node.label]) charMapping[target.label][node.label] = [];
          charMapping[target.label][node.label].push(epsilonAlphabet[Math.floor(Math.random() * epsilonAlphabet.length)]);
          console.log("forcibly adding", target.label, node.label);
          g.addLink(target.label, node.label);
        }
      });
    }

    const layout = createLayout(g);
    for (let i = 0; i < 500; i++) layout.step();

    const { min_x, min_y, max_x, max_y } = layout.getGraphRect();
    Object.keys(nfa.nodes).forEach((node, i) => {
      const pos = layout.getNodePosition(node);
      const transformed = {
        x: (pos.x - min_x) / (max_x - min_x) * merged.area.width + merged.area.x,
        y: (pos.y - min_y) / (max_y - min_y) * merged.area.height + merged.area.y,
      }
      nfa.nodes[node].moveTo(transformed);
    });

    Object.entries(charMapping).forEach(([from, tos]) => {
      Object.entries(tos).forEach(([to, chars]) => {
        const reverse = !!(charMapping[to]??{})[from] && from !== to;
        const vec = vectorCombine(nfa.nodes[to].position, negate(nfa.nodes[from].position));
        const normal = multiply(rotate(vec, Math.PI / 2), 1/magnitude(vec));
        const extraStyle = {};
        if (reverse) {
          extraStyle.edgeAnchor = multiply(normal, 40);
        }
        nfa.addEdge(AbstractEdge.decide(nfa.nodes[from], nfa.nodes[to], {
          ...edgeStyle,
          ...extraStyle,
          edgeLabel: chars.join(','),
        }));
      })
    });

    return nfa
  }
}

export default NFA;
