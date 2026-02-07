import Graph, { AbstractEdge, Node } from "./graph.js";
import { bg_dark, black } from "./colours.js";
import { magnitude, mergeDeep, multiply, negate, rotate, vectorCombine } from "./utils.js";
import createGraph from 'https://cdn.jsdelivr.net/npm/ngraph.graph@20.0.1/+esm'
import createLayout from 'https://cdn.jsdelivr.net/npm/ngraph.forcelayout@3.3.1/+esm';

const gsc = window.gameScaling ?? 1;

class DFA extends Graph {

  validate(fixedAlphabet) {
    let startNodes = Object.values(this.nodes).filter((node) => node.style.isEntry);
    if (startNodes.length !== 1) {
      return "There must be exactly one start node";
    }
    let edges = this.edges;
    const charSets = [];
    for (let node of Object.values(this.nodes)) {
      let outgoingEdges = edges.filter((edge) => edge.from.label === node.label);
      const charSet = [];
      let bad = null;
      outgoingEdges.forEach((edge) => {
        let label = edge.style.edgeLabel;
        label = label.replace(" ", "");
        if (label === "") {
          return `Transition ${edge.from.label}->${edge.to.label} has no label`;
        }
        const labelSplit = label.split(",");
        labelSplit.forEach((char) => {
          char = char.trim();
          if (char.length !== 1) {
            bad = "Labels must be single characters separated by commas"
          } else if (charSet.includes(char)) {
            bad = "You can't have 2 transitions with the same character"
          }
          charSet.push(char);
        })
        if (bad) {
          return bad;
        }
      })
      charSets.push(charSet);
      if (bad) {
        return bad;
      }
    }
    let largestCharSet = charSets.reduce((acc, cur) => cur.length > acc.length ? cur : acc, []);
    if (fixedAlphabet) {
      largestCharSet = fixedAlphabet;
    }
    for (let i=0; i<charSets.length; i++) {
      const nodeLabel = Object.values(this.nodes)[i].label;
      const charSet = charSets[i];
      for (let char of largestCharSet) {
        if (!charSet.includes(char)) {
          return `Node ${nodeLabel} is missing a transition for character ${char}`;
        }
      }
      if (charSet.length !== largestCharSet.length) {
        return `Node ${nodeLabel} has extra transitions`;
      }
    }
    if (largestCharSet.length === 0) {
      return "You must have at least one transition";
    }

    return null;
  }

  // Intuit the alphabet from the DFA labels
  collectAlphabet() {
    if (this.validate()) {
      return null;
    }
    const alphabet = new Set();
    const node = Object.values(this.nodes)[0];
    const edges = this.edges.filter((edge) => edge.from.label === node.label);
    edges.forEach((edge) => edge.style.edgeLabel.split(",").forEach((char) => alphabet.add(char.trim())));
    return Array.from(alphabet);
  }

  getNextNode(node, char) {
    const edge = this.edges.find((edge) => edge.from.label === node.label && edge.style.edgeLabel.includes(char));
    return edge ? this.nodes[edge.to.label] : null;
  }

  // Returns "Crash", "Accept", or "Reject"
  simulateWord(input) {
    if (this.validate()) {
      return "Crash";
    }
    let startNode = Object.values(this.nodes).find((node) => node.style.isEntry);
    let currentNode = startNode;
    for (let char of input) {
      let edge = this.edges.find((edge) => edge.from.label === currentNode.label && edge.style.edgeLabel.includes(char));
      if (!edge) {
        return "Crash";
      }
      currentNode = this.nodes[edge.to.label];
    }
    return currentNode.style.doubleBorder ? "Accept" : "Reject";
  }

  checkWordArray(tests) {
    return tests
      .map((test) => this.simulateWord(test.word) === test.expected)
      .reduce((acc, cur) => acc && cur, true);
  }

  // Returns a new DFA
  minimise() {
    if (this.validate()) {
      return null;
    }
    // Start by removing unreachable nodes
    const marked = {};
    Object.values(this.nodes).forEach((node) => marked[node.label] = false);
    const startNode = Object.values(this.nodes).find((node) => node.style.isEntry);
    const stack = [startNode];
    marked[startNode.label] = true;
    while (stack.length > 0) {
      const node = stack.pop();
      const edges = this.edges.filter((edge) => edge.from.label === node.label);
      edges.forEach((edge) => {
        if (!marked[edge.to.label]) {
          marked[edge.to.label] = true;
          stack.push(this.nodes[edge.to.label])
        }
      });
    }


    // Separate accepting and non-accepting states
    let newStates = [
      Object.values(this.nodes).filter((node) => !node.style.doubleBorder && marked[node.label]),
      Object.values(this.nodes).filter((node) => node.style.doubleBorder && marked[node.label]),
    ];
    if (newStates[0].length === 0 || newStates[1].length === 0) {
      // No accepting states - just a single node.
      const newDFA = new DFA();
      newDFA.fromJSON({
        nodes: {
          'S': {
            x: 0,
            y: 0,
            start: true,
            accepting: newStates[1].length > 0,
          }
        },
        edges: [
          { from: 'S', to: 'S', label: this.collectAlphabet().join(", ") }
        ]
      });
      return newDFA;
    }
    // Set group index.
    newStates.forEach((state, i) => state.forEach((node) => node.groupIndex = i));
    const alphabet = this.collectAlphabet();

    let done = false;
    let nextGroupIndex = newStates.length;
    while (!done) {
      done = true;
      // Shallow copy is fine.
      const newStatesCopy = [...newStates];
      for (let state of newStates) {
        const alphMaps = {};
        for (let node of state) {
          const outcomes = [];
          for (let char of alphabet) {
            outcomes.push(`${char}->${this.getNextNode(node, char).label}`);
          }
          const key = outcomes.join(",");
          if (!alphMaps[key]) {
            alphMaps[key] = [];
          }
          alphMaps[key].push(node);
        }
        const newGroups = Object.values(alphMaps);
        if (newGroups.length > 1) {
          done = false;
          newGroups.forEach((group) => {
            newStatesCopy.push(group);
            group.forEach((node) => node.groupIndex = nextGroupIndex);
            nextGroupIndex++;
          });
          newStatesCopy.splice(newStatesCopy.indexOf(state), 1);
          break;
        }
      }
      newStates = newStatesCopy;
    }
    // Reset group indicies.
    newStates.forEach((state, i) => state.forEach((node) => node.groupIndex = i));
    // Create the new DFA
    const newDFA = new DFA();
    newDFA.fromJSON({
      nodes: Object.assign({}, newStates.map((state, i) => ({
        // Average position
        x: state.reduce((acc, cur) => acc + cur.position.x, 0) / state.length,
        y: state.reduce((acc, cur) => acc + cur.position.y, 0) / state.length,
        start: state.some((node) => node.style.isEntry),
        accepting: state.some((node) => node.style.doubleBorder),
      }))),
      edges: newStates
        .map((state, i) =>
          this.edges
            .filter((edge) => edge.from.label === state[0].label)
            .map((edge) => ({
              from: i,
              to: this.nodes[edge.to.label].groupIndex,
              label: edge.style.edgeLabel,
            })
        )).flat()
    });
    return newDFA;
  }

  isomorphic(dfa) {
    // Whether myself and dfa are isomorphic (no state grouping)
    if (Object.keys(this.nodes).length !== Object.keys(dfa.nodes).length) {
      return false;
    }
    const alphabet = this.collectAlphabet();
    const dfaAlphabet = dfa.collectAlphabet();
    if (alphabet.length !== dfaAlphabet.length) {
      return false;
    }
    const myStart = Object.values(this.nodes).find((node) => node.style.isEntry);
    const dfaStart = Object.values(dfa.nodes).find((node) => node.style.isEntry);
    if (!myStart || !dfaStart) {
      return false;
    }
    const myMarked = {};
    const dfaMarked = {};
    Object.values(this.nodes).forEach((node) => myMarked[node.label] = false);
    Object.values(dfa.nodes).forEach((node) => dfaMarked[node.label] = false);
    const myStack = [myStart];
    const dfaStack = [dfaStart];
    myMarked[myStart.label] = true;
    dfaMarked[dfaStart.label] = true;
    const dfaMap = {};
    dfaMap[dfaStart.label] = myStart.label;
    while (myStack.length > 0 && dfaStack.length > 0) {
      const myNode = myStack.pop();
      const dfaNode = dfaStack.pop();
      const myEdges = this.edges.filter((edge) => edge.from.label === myNode.label);
      const dfaEdges = dfa.edges.filter((edge) => edge.from.label === dfaNode.label);
      for (let char of alphabet) {
        const myEdge = myEdges.find((edge) => edge.style.edgeLabel.includes(char));
        const dfaEdge = dfaEdges.find((edge) => edge.style.edgeLabel.includes(char));
        if (!myEdge || !dfaEdge) {
          return false;
        }
        if (!!this.nodes[myEdge.to.label].style.doubleBorder !== !!dfa.nodes[dfaEdge.to.label].style.doubleBorder) {
          return false;
        }
        if (myMarked[myEdge.to.label] !== dfaMarked[dfaEdge.to.label]) {
          return false;
        }
        if (!myMarked[myEdge.to.label]) {
          myStack.push(this.nodes[myEdge.to.label]);
          dfaStack.push(dfa.nodes[dfaEdge.to.label]);
          dfaMap[dfaEdge.to.label] = myEdge.to.label;
          myMarked[myEdge.to.label] = true;
          dfaMarked[dfaEdge.to.label] = true;
        } else {
          if (dfaMap[dfaEdge.to.label] !== myEdge.to.label) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // New DFA which recognises the complement of the language of this DFA
  invert() {
    const newDFA = new DFA();
    const json = {
      nodes: {},
      edges: this.edges.map((edge) => ({
        from: edge.from.label,
        to: edge.to.label,
        label: edge.style.edgeLabel,
        style: mergeDeep({}, edge.style),
      }))
    }
    Object.values(this.nodes).forEach((node) => {
      json.nodes[node.label] = {
        x: node.position.x,
        y: node.position.y,
        start: !!node.style.isEntry,
        accepting: !node.style.doubleBorder,
      }
    });
    newDFA.fromJSON(json);
    return newDFA;
  }

  // Make a new DFA which recognises me and other
  combine(other, accepts = (me, other) => boolean) {
    const meTrue = this.invert().findAcceptingString() === null;
    const meFalse = this.findAcceptingString() === null;
    const otherTrue = other.invert().findAcceptingString() === null;
    const otherFalse = other.findAcceptingString() === null;
    const alphabet = this.collectAlphabet();
    const otherAlphabet = other.collectAlphabet();
    const combinedAlphabet = Array.from(new Set([...alphabet, ...otherAlphabet]));
    const alphabetSame = combinedAlphabet.length === alphabet.length && combinedAlphabet.length === otherAlphabet.length;

    if ((meTrue || meFalse) && alphabetSame) {
      const normal = accepts(meTrue, false);
      const accept = accepts(meTrue, true);
      return other.combine(other, (a, b) => a ? accept : normal);
    }
    if ((otherTrue || otherFalse) && alphabetSame) {
      const normal = accepts(false, otherTrue);
      const accept = accepts(true, otherTrue);
      return this.combine(this, (a, b) => a ? accept : normal);
    }

    const newDFA = new DFA();
    const json = {
      nodes: {},
      edges: []
    }
    this.nodes = {...this.nodes, 'ME_DEATH': {
      label: 'ME_DEATH',
      position: { x: 0, y: 0 },
      style: { isEntry: false, doubleBorder: false },
    }};
    other.nodes = {...other.nodes, 'OTHER_DEATH': {
      label: 'OTHER_DEATH',
      position: { x: 0, y: 0 },
      style: { isEntry: false, doubleBorder: false },
    }};
    // Temporarily add edges to death nodes
    const myMissing = Array.from(combinedAlphabet).filter(char => !alphabet.includes(char)).join(", ");
    const otherMissing = Array.from(combinedAlphabet).filter(char => !otherAlphabet.includes(char)).join(", ");
    const oldEdges = [...this.edges];
    const otherOldEdges = [...other.edges];
    if (myMissing) {
      this.edges = this.edges.concat(Object.values(this.nodes).map((node) => ({
        from: node,
        to: this.nodes['ME_DEATH'],
        style: { edgeLabel: myMissing },
      })));
    }
    this.edges = this.edges.concat([{
      from: this.nodes['ME_DEATH'],
      to: this.nodes['ME_DEATH'],
      style: { edgeLabel: `${alphabet.join(`, `)}, ${myMissing}` }
    }])
    if (otherMissing) {
      other.edges = other.edges.concat(Object.values(other.nodes).map((node) => ({
        from: node,
        to: other.nodes['OTHER_DEATH'],
        style: { edgeLabel: otherMissing },
      })));
    }
    other.edges = other.edges.concat([{
      from: other.nodes['OTHER_DEATH'],
      to: other.nodes['OTHER_DEATH'],
      style: { edgeLabel: `${otherAlphabet.join(`, `)}, ${otherMissing}` }
    }])
    Object.values(this.nodes).forEach((node) => {
      Object.values(other.nodes).forEach((otherNode) => {
        json.nodes[`${node.label},${otherNode.label}`] = {
          x: node.position.x,
          y: node.position.y,
          start: node.style.isEntry && otherNode.style.isEntry,
          accepting: accepts(node.style.doubleBorder, otherNode.style.doubleBorder),
        }
      });
    });
    Object.values(this.nodes).forEach((node) => {
      Object.values(other.nodes).forEach((otherNode) => {
        combinedAlphabet.forEach((char) => {
          const myNext = this.getNextNode(node, char);
          const otherNext = other.getNextNode(otherNode, char);
          json.edges.push({
            from: `${node.label},${otherNode.label}`,
            to: `${myNext.label},${otherNext.label}`,
            label: char,
          });
        });
      });
    });
    newDFA.fromJSON(json);
    // reset nodes
    delete this.nodes['ME_DEATH'];
    delete other.nodes['OTHER_DEATH'];
    // reset edges
    this.edges = oldEdges;
    other.edges = otherOldEdges;
    return newDFA;
  }

  findAcceptingString() {
    // Do I accept any string?
    const marked = {};
    const parent = {};
    Object.values(this.nodes).forEach((node) => marked[node.label] = false);
    const startNode = Object.values(this.nodes).find((node) => node.style.isEntry);
    const stack = [startNode];
    marked[startNode.label] = true;
    while (stack.length > 0) {
      const node = stack.pop();
      const edges = this.edges.filter((edge) => edge.from.label === node.label);
      edges.forEach((edge) => {
        if (!marked[edge.to.label]) {
          marked[edge.to.label] = true;
          parent[edge.to.label] = node.label;
          stack.push(this.nodes[edge.to.label])
        }
      });
    }
    const endLabel = Object.values(this.nodes).find((node) => node.style.doubleBorder && marked[node.label]);
    if (!endLabel) {
      return null;
    }
    let current = endLabel.label;
    let result = [];
    while (current !== startNode.label) {
      const edge = this.edges.find((edge) => edge.from.label === parent[current] && edge.to.label === current);
      result.push(edge.style.edgeLabel.split(",")[0].trim());
      current = parent[current];
    }
    return result.reverse().join("");
  }

  empty() {
    return this.findAcceptingString() === null;
  }

  // Do I recognise the same language as other?
  equivalent(other) {
    const myAlpha = this.collectAlphabet().sort();
    const otherAlpha = other.collectAlphabet().sort();
    if (myAlpha.length !== otherAlpha.length) {
      return false;
    }
    for (let i=0; i<myAlpha.length; i++) {
      if (myAlpha[i] !== otherAlpha[i]) {
        return false;
      }
    }
    return this.combine(other, (me, other) => !!me !== !!other).empty();
  }

  static randomConfiguration = {
    minNodes: 3,
    maxNodes: 6,
    chanceAccepting: 0.5,
    forceConnected: true,
    area: {
      width: 1000 * gsc,
      height: 600 * gsc,
      x: 0,
      y: 0,
    },
    alphabet: null,
  }

  static randomDFA(config = {}, nodeStyle={}, edgeStyle={}) {
    const merged = mergeDeep({}, DFA.randomConfiguration, config);
    if (merged.alphabet === null) {
      merged.alphabet = Array.from({length: Math.floor(Math.random() * 3) + 2}, (_, i) => String.fromCharCode(97 + i));
    }
    const dfa = new DFA();
    const g = createGraph();
    const numNodes = Math.floor(Math.random() * (merged.maxNodes - merged.minNodes + 1)) + merged.minNodes;
    const labels = Array.from({length: numNodes}, (_, i) => String.fromCharCode(65 + i));
    for (let i = 0; i < numNodes; i++) {
      dfa.addNode(new Node(labels[i], {x: Math.random() * merged.area.width + merged.area.x, y: Math.random() * merged.area.height + merged.area.y}, {
        ...nodeStyle,
        doubleBorder: Math.random() < merged.chanceAccepting,
        isEntry: i === 0,
      }));
      g.addNode(labels[i]);
    }
    const alphabet = merged.alphabet;
    const nodes = Object.values(dfa.nodes);
    const charMapping = {};
    nodes.forEach((node) => {
      charMapping[node.label] = {};
      for (let char of alphabet) {
        const target = nodes[Math.floor(Math.random() * nodes.length)];
        if (!charMapping[node.label][target.label]) {
          charMapping[node.label][target.label] = [];
        }
        charMapping[node.label][target.label].push(char);
      }
    })
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
      nodes.forEach((node) => {
        if (!visited.has(node.label)) {
          console.log(node.label, mergeDeep({}, charMapping))
          // Find all possible edges that could be redirected.
          const possible = [];
          nodes.forEach(n => n.curCount = 0);
          nodes.forEach(start => {
            Object.keys(charMapping[start.label] ?? {}).forEach((end) => {
              if (visited.has(start.label) && visited.has(end)) {
                dfa.nodes[end].curCount++;
              }
            })
          })
          nodes.forEach(start => {
            Object.keys(charMapping[start.label] ?? {}).forEach((e) => {
              if (charMapping[start.label][e].length === 0) return;
              const end = dfa.nodes[e];
              if (start.label === end.label) {
                possible.push([start.label, end.label]);
              } else if (charMapping[start.label][end.label].length > 1) {
                possible.push([start.label, end.label]);
              } else if (end.curCount > 1) {
                possible.push([start.label, end.label]);
              }
            });
          });
          const [start, end] = possible[Math.floor(Math.random() * possible.length)];
          const char = charMapping[start][end].pop();
          charMapping[start][node.label] = [char];
        }
      })
    }

    nodes.forEach((node) => {
      Object.keys(charMapping[node.label] ?? {}).forEach((end) => {
        if (charMapping[node.label][end].length === 0) return;
        g.addLink(node.label, `${node.label}-${end}`)
        g.addLink(`${node.label}-${end}`, end);
      });
    });

    const layout = createLayout(g);
    for (let i = 0; i < 500; i++) layout.step();

    const { min_x, min_y, max_x, max_y } = layout.getGraphRect();
    Object.keys(dfa.nodes).forEach((node, i) => {
      const pos = layout.getNodePosition(node);
      const transformed = {
        x: (pos.x - min_x) / (max_x - min_x) * merged.area.width + merged.area.x,
        y: (pos.y - min_y) / (max_y - min_y) * merged.area.height + merged.area.y,
      }
      dfa.nodes[node].moveTo(transformed);
    });

    Object.entries(charMapping).forEach(([from, tos]) => {
      Object.entries(tos).forEach(([to, chars]) => {
        if (chars.length === 0) return;
        const reverse = !!(charMapping[to]??{})[from] && from !== to;
        const vec = vectorCombine(dfa.nodes[to].position, negate(dfa.nodes[from].position));
        const normal = multiply(rotate(vec, Math.PI / 2), 1/magnitude(vec));
        const extraStyle = {};
        if (reverse) {
          extraStyle.edgeAnchor = multiply(normal, 40);
        }
        dfa.addEdge(AbstractEdge.decide(dfa.nodes[from], dfa.nodes[to], {
          ...edgeStyle,
          ...extraStyle,
          edgeLabel: chars.join(','),
        }));
      })
    });

    return dfa;
  }

}

export default DFA;
