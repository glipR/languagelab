import Graph from "./graph.js";
import { bg_dark, black } from "./colours.js";
import { mergeDeep } from "./utils.js";

class DFA extends Graph {
  static baseNodeStyle = { radius: 30, fill: bg_dark, strokeWidth: 3, stroke: black, showLabel: true, entryWidth: 5 };
  static baseEdgeStyle = (lab) => ({ lineWidth: 5, edgeLabel: lab, stroke: black, arrow: {
    direction: 'forward',
    position: 'end',
    size: 20,
    width: 5,
    endOffset: 30,
  } });

  fromJSON(json) {
    console.log(json);
    const nodeStyle = DFA.baseNodeStyle ?? {};
    const edgeStyle = DFA.baseEdgeStyle ?? {};
    const newObj = {};
    newObj.nodes = {};
    Object.keys(json.nodes).forEach((key) => {
      newObj.nodes[key] = {
        position: {
          x: json.nodes[key].x,
          y: json.nodes[key].y,
        },
        style: mergeDeep({...DFA.baseNodeStyle}, nodeStyle, json.nodes[key].style ?? {}, {
          isEntry: json.nodes[key].start,
          doubleBorder: json.nodes[key].final,
        }),
      }
    });
    newObj.edges = json.edges.map((edge) => ({
      ...edge,
      style: mergeDeep({...DFA.baseEdgeStyle(edge.label)}, edgeStyle, edge.style ?? {}, {
        label: edge.label,
      }),
    }));
    return super.fromJSON(newObj);
  }

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
    edges.forEach((edge) => edge.style.edgeLabel.split(",").forEach((char) => alphabet.add(char)));
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


    // Separate final and non-final states
    let newStates = [
      Object.values(this.nodes).filter((node) => !node.style.doubleBorder && marked[node.label]),
      Object.values(this.nodes).filter((node) => node.style.doubleBorder && marked[node.label]),
    ];
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
          console.log("Splitting", state.map((node) => node.label), "into", newGroups.map((group) => group.map((node) => node.label)));
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
        final: state.some((node) => node.style.doubleBorder),
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
        final: !node.style.doubleBorder,
      }
    });
    newDFA.fromJSON(json);
    return newDFA;
  }

  // Make a new DFA which recognises me and other
  combine(other, accepts = (me, other) => boolean) {
    const newDFA = new DFA();
    const json = {
      nodes: {},
      edges: []
    }
    const alphabet = this.collectAlphabet();
    const otherAlphabet = other.collectAlphabet();
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
    const myMissing = Array.from(otherAlphabet).filter(char => !alphabet.includes(char)).join(", ");
    const otherMissing = Array.from(alphabet).filter(char => !otherAlphabet.includes(char)).join(", ");
    const oldEdges = [...this.edges];
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
    const otherOldEdges = [...other.edges];
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
    console.log(this.edges, other.edges);
    Object.values(this.nodes).forEach((node) => {
      Object.values(other.nodes).forEach((otherNode) => {
        json.nodes[`${node.label},${otherNode.label}`] = {
          x: node.position.x,
          y: node.position.y,
          start: node.style.isEntry && otherNode.style.isEntry,
          final: accepts(node.style.doubleBorder, otherNode.style.doubleBorder),
        }
      });
    });
    Object.values(this.nodes).forEach((node) => {
      Object.values(other.nodes).forEach((otherNode) => {
        alphabet.forEach((char) => {
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
      result.push(edge.style.edgeLabel.split(",")[0]);
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
}

export default DFA;
