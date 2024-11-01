import { black, bg_dark, green, red, blue } from '../colours.js';
import { TweenManager, ValueTween } from '../tween.js';
import { magnitude, negate, vectorCombine } from '../utils.js';
import DFA from '../dfa.js';
import Screen from '../screen.js';
import { RectangleCover } from '../tools/paper_cover.js';

// TODO: Move this into a tools class with events.

// Needed for sharing stuff between loader and unloader.
const GS = {};
const DFS_DIST = 3;

// BFS from some sphere to get all spheres within a edge distance.
const spheresBFS = (sphere, d) => {
  const visited = new Set();
  const queue = [];
  queue.push({ sphere, dist: 0 });
  visited.add(sphere);
  while (queue.length > 0) {
    const { sphere, dist } = queue.shift();
    sphere.adj.forEach(adj => {
      if (!visited.has(adj) && dist < d) {
        visited.add(adj);
        queue.push({ sphere: adj, dist: dist + 1 });
      }
    });
  }
  return [...visited];
}

// Connect two spheres, possibly one way.
const connect = (sphere1, sphere2, oneWay=false) => {
  sphere1.adj.push(sphere2);
  if (!oneWay) {
    sphere2.adj.push(sphere1);
  }
}

const interactiveMoveToKey = (key) => {
  GS.pullSpheres = [];
  GS.pullSpheres.push({
    x: GS.graph.nodes[key].graphic.x,
    y: GS.graph.nodes[key].graphic.y,
    radius: GS.graph.nodes[key].style.radius * 1.5,
    key: key,
    adj: [],
    name: key,
  });
  GS.graph.edges.forEach(edge => {
    if (edge.from === GS.graph.nodes[key] || (GS.opts.addBackwards && edge.to === GS.graph.nodes[key])) {
      const backwards = edge.from.label !== key;
      edge.backwards = backwards;
      const edgeMag = magnitude(vectorCombine(edge.from.position, negate(edge.to.position)));
      const numPullSpheres = edge.from.label === edge.to.label ? 10 : edgeMag / 10;
      const edgePositions = [];
      for (let i=0; i<numPullSpheres; i++) {
        edgePositions.push(edge.edgeInterp((backwards ? (numPullSpheres - i) : i)/numPullSpheres).position);
      }
      edgePositions.filter(pos => {
        const startMag = magnitude(vectorCombine(pos, negate(edge.from.position)));
        const endMag = magnitude(vectorCombine(pos, negate(edge.to.position)));
        return startMag > edge.from.style.radius * 0.8 && endMag > edge.to.style.radius * 0.8;
      }).forEach((pos, i, arr) => {
        GS.pullSpheres.push({
          x: pos.x,
          y: pos.y,
          radius: 15,
          adj: [],
          name: `${edge.from.label} -[${i}/${arr.length}]> ${edge.to.label}`,
          isEdge: true,
          edge: edge,
          index: i,
          length: arr.length,
          start: edge.from.label,
          end: edge.to.label,
        })
        if (i == 0) {
          connect(GS.pullSpheres[0], GS.pullSpheres[GS.pullSpheres.length - 1]);
        } else {
          connect(GS.pullSpheres[GS.pullSpheres.length - 2], GS.pullSpheres[GS.pullSpheres.length - 1]);
        }
      });
      if (edge.backwards) {
        GS.pullSpheres.push({
          x: edge.from.graphic.x,
          y: edge.from.graphic.y,
          radius: edge.from.style.radius * 1.5,
          key: edge.from.label,
          adj: [],
          name: edge.from.label,
        });
        connect(GS.pullSpheres[GS.pullSpheres.length - 2], GS.pullSpheres[GS.pullSpheres.length - 1], true);
      }
      if (edge.to.label !== key) {
        GS.pullSpheres.push({
          x: edge.to.graphic.x,
          y: edge.to.graphic.y,
          radius: edge.to.style.radius * 1.5,
          key: edge.to.label,
          adj: [],
          name: edge.to.label,
        });
        connect(GS.pullSpheres[GS.pullSpheres.length - 2], GS.pullSpheres[GS.pullSpheres.length - 1], true);
      } else {
        connect(GS.pullSpheres[GS.pullSpheres.length - 2], GS.pullSpheres[0], true);
      }
    }
  });
  if (GS.opts.showPullSpheres) {
    pullSphereContainer.removeChildren();
    GS.pullSpheres.forEach((sphere, i) => {
      const g = new PIXI.Graphics();
      g.circle(sphere.x, sphere.y, sphere.radius);
      g.fill(i === 0 ? blue : green);
      g.alpha = 0.3;
      pullSphereContainer.addChild(g);
      sphere.graphic = g;
    });
  }
  GS.curSphere = GS.pullSpheres[0];
}

const moveAlongEdge = (edge) => {
  const edgeLabel = edge.labelText.text;
  const charRead = GS.letters[GS.curWordIndex].text;
  if (edge.backwards) {
    GS.onFailure(`Wrong transition taken! You took a transition going into your current state, not out of it.`);
    return;
  }
  if (!edgeLabel.includes(charRead)) {
    GS.onFailure(`Wrong transition taken! The next letter to read was ${charRead}, but the transition you had taken only accepts ${edgeLabel}`);
    return;
  } else if (GS.curWordIndex === GS.letters.length - 1) {
    const accepted = edge.to.style.doubleBorder;
    GS.onSuccess(
      "Successfully executed the algorithm! " +
      `Since we ended on a state that is ${accepted ? 'a final state' : 'not a final state'}, the word is${accepted ? '' : ' not'} accepted.`
    );
  }

  if (GS.opts.showNextEdge) {
    TweenManager.add(edge.colorEdgeTween(black, 60, GS.easings.easeInOutQuad));
    const nextChar = GS.letters[GS.curWordIndex + 1]?.text;
    GS.graph.edges.forEach(e => {
      if (nextChar && e.from.label === edge.to.label && e.labelText.text.includes(nextChar)) {
        TweenManager.add(e.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
      }
    })
  }

  GS.curWordIndex++;
  const tweens = [];
  const curWordIndex = GS.curWordIndex;
  tweens.push(new ValueTween(GS.letters[GS.curWordIndex - 1].style.fill, bg_dark, 60, GS.easings.easeInOutQuad, (v) => {
    GS.letters[curWordIndex - 1].style.fill = v;
  }));
  if (GS.curWordIndex < GS.letters.length) {
    tweens.push(new ValueTween(GS.letters[GS.curWordIndex-1].position, GS.letters[GS.curWordIndex].position, 60, GS.easings.easeInOutQuad, (v) => {
      GS.wordPointer.position.set(v.x, v.y + GS.letters[curWordIndex].height);
    }));
  }
  tweens.forEach(tween => {
    TweenManager.add(tween);
  });
}

const pointerDown = (event) => {
  GS.positionPointer.dragging = true;
  GS.positionPointer.data = event.data;
  GS.positionPointer.wantedPoint = GS.screen.localToGlobal(GS.positionPointer.position.x, GS.positionPointer.position.y);
}

const pointerUp = () => {
  GS.positionPointer.dragging = false;
}

const pointerMove = () => {
  if (GS.positionPointer.dragging) {

    GS.positionPointer.wantedPoint = vectorCombine(
      GS.positionPointer.wantedPoint,
      GS.positionPointer.data.movement
    );

    let newPosition = GS.screen.globalToLocal(GS.positionPointer.wantedPoint.x, GS.positionPointer.wantedPoint.y);
    newPosition = {
      x: newPosition.x,
      y: newPosition.y,
    }

    if (GS.curSphere.graphic) {
      GS.curSphere.graphic.clear().circle(GS.curSphere.x, GS.curSphere.y, GS.curSphere.radius).fill(green);
    }
    const closeSpheres = spheresBFS(GS.curSphere, DFS_DIST);
    const pullSphereDist = closeSpheres.map(sphere => magnitude(vectorCombine(sphere, negate(newPosition))));
    const closestDist = Math.min(...pullSphereDist);
    const closestSphere = closeSpheres[pullSphereDist.indexOf(closestDist)];
    if (closestDist > closestSphere.radius * 1.5) {
      return;
    }
    if (
      (GS.curSphere.isEdge && GS.curSphere.index > GS.curSphere.length - DFS_DIST) // We are on the end of an edge.
      && (
        (closestSphere.isEdge && closestSphere.index < DFS_DIST) // We are moving to the start of an edge.
        || !closestSphere.isEdge // We are moving to a node.
      )
    ) {
      if (closestSphere.isEdge) {
        GS.curNodeKey = GS.curSphere.end;
      } else {
        GS.curNodeKey = closestSphere.key;
      }
      console.log(GS.curNodeKey);
      moveAlongEdge(GS.curSphere.edge);
      interactiveMoveToKey(GS.curNodeKey);
    } else {
      GS.curSphere = closestSphere;
    }
    if (GS.curSphere.graphic) {
      GS.curSphere.graphic.clear().circle(GS.curSphere.x, GS.curSphere.y, GS.curSphere.radius).fill(blue);
    }
    // Ensure the newPosition is within the pull sphere.
    const dist = magnitude(vectorCombine(closestSphere, negate(newPosition)));
    if (dist > closestSphere.radius) {
      const newVector = vectorCombine(newPosition, negate(closestSphere));
      const newVectorMag = magnitude(newVector);
      newPosition = {
        x: closestSphere.x + newVector.x * closestSphere.radius / newVectorMag,
        y: closestSphere.y + newVector.y * closestSphere.radius / newVectorMag,
      }
    }
    GS.positionPointer.position.set(
      newPosition.x,
      newPosition.y,
    );
  }
}

const unloader = (app) => {
  window.removeEventListener('pointerup', pointerUp);
  window.removeEventListener('pointermove', pointerMove);
}

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;
  GS.easings = easings;
  GS.graph = new DFA();
  GS.graph.fromJSON(opts.graph);

  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();

  // Only load the fonts you need, otherwise you get lag.
  const baseStyle = new PIXI.TextStyle({
    fontFamily: "Firasans Regular",
    fontSize: 24,
    fill: black,
    align: 'center',
  });


  GS.screen.addChild(GS.graph.graph);

  // Word
  const wordText = opts.word ?? 'abab';
  GS.letters = wordText.split('').map(c => new PIXI.Text({ text: c, style: {...baseStyle}}));
  GS.wordContainer = new PIXI.Container();
  GS.letters.forEach((c, i) => {
    c.position.set(i == 0 ? 0 : GS.letters[i-1].position.x + c.width + 3, c.height);
    GS.wordContainer.addChild(c);
  });
  GS.wordContainer.pivot.set(GS.wordContainer.width/2, GS.wordContainer.height/2);
  GS.wordContainer.position.set(GS.screen.gameWidth/2, GS.screen.gameHeight*0.2);
  const wordCover = new RectangleCover(GS.wordContainer, {points: 18, randMult: 0.1});
  wordCover.position.set(GS.screen.gameWidth/2, GS.screen.gameHeight*0.2 + GS.wordContainer.height);
  GS.screen.addChild(wordCover);
  GS.screen.addChild(GS.wordContainer);

  // Word Pointer
  GS.wordPointer = new PIXI.Graphics();
  GS.wordPointer.rect(1, 0, 11, 3).fill(red);
  GS.wordPointer.position.set(GS.letters[0].x, GS.letters[0].y + GS.letters[0].height);
  GS.curWordIndex = 0;
  GS.wordContainer.addChild(GS.wordPointer);

  // Start Node
  GS.startNodeKey = null;
  Object.values(GS.graph.nodes).forEach(node => {
    if (node.style.isEntry) {
      GS.startNodeKey = node.label;
    }
  })
  GS.graph.edges.forEach(edge => edge.labelBG.alpha = 1);
  if (opts.showNextEdge) {
    const nextChar = GS.letters[GS.curWordIndex]?.text;
    GS.graph.edges.forEach(edge => {
      if (edge.from.label === GS.startNodeKey && edge.labelText.text.includes(nextChar)) {
        TweenManager.add(edge.colorEdgeTween(red, 60, GS.easings.easeInOutQuad));
      }
    });
  }

  // Red Circle for current position
  GS.positionPointer = new PIXI.Graphics();
  GS.positionPointer.circle(0, 0, GS.graph.nodes[GS.startNodeKey].style.radius / 2).fill(new PIXI.Color(0xff0000));
  GS.positionPointer.position.set(GS.graph.nodes[GS.startNodeKey].graphic.x, GS.graph.nodes[GS.startNodeKey].graphic.y);
  GS.positionPointer.alpha = 0.4;
  // Make the pointer draggable
  GS.positionPointer.interactive = true;
  GS.positionPointer.buttonMode = true;
  GS.screen.addChild(GS.positionPointer);

  // Interactivity and Bounds
  GS.curNodeKey = GS.startNodeKey;
  GS.pullSpheres = [];
  GS.curSphere = null;
  const pullSphereContainer = new PIXI.Container();
  GS.screen.addChild(pullSphereContainer);

  interactiveMoveToKey(GS.startNodeKey);

  GS.positionPointer.on('pointerdown', pointerDown);
  window.addEventListener('pointerup', pointerUp);
  window.addEventListener('pointermove', pointerMove);
}


export default { loader, unloader };
