// TODO: Modify the "Each vertex has a state for each transition" animation to move a copy of each edge into a table of values.

import {black, bg_dark, highlightColours, green, red} from '../colours.js';
import Graph from '../graph.js';
import { Tween, TweenManager, ValueTween, interpValue, delay } from '../tween.js';
import { combineEasing, reverseEasing } from '../utils.js';
import StyledText from '../text.js';

const GS = {};

const unloader = () => {};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  const center = { x: app.renderer.width / 2, y: app.renderer.height / 2 };

  // Only load the fonts you need, otherwise you get lag.
  const baseStyle = new PIXI.TextStyle({
    fontFamily: "Firasans Regular",
    fontSize: 24,
    fill: black,
    align: 'center',
  });

  // font-family: 'Firasans Bold' missing
  const text1 = new StyledText(["A ", "DFA", " is kind of like an algorithm for testing if a particular word is in a language."], [null, "font-weight: 700", null], baseStyle);
  const text2 = new StyledText(["It is made up of ", "states", ", and those states are connected by ", "transitions", "."], [null, "color: red", null, "color: red"], baseStyle);
  const text3 = new StyledText(["In a DFA, ","every state"," has exactly one transition per ","letter"," in the alphabet,", "", "which points to some other state."], [null, "color: red", null, "color: red", null, "br", null], baseStyle);
  const text4 = new StyledText(["To use the DFA, we provide a ","word",", and we can use the DFA to determine ", "br", "if this word is in the language."], [null, "color: red", null, "br", null], baseStyle);
  const text5 = new StyledText(["The DFA needs two more things before we can use it:", "br", "A ", "starting state", ", and some ", "final states"], [null, "br", null, "color: red", null, "color: red"], baseStyle);
  const text6 = new StyledText(["Now, we can execute the algorithm by placing a ", "pointer", " on the start state,", "br", "and reading each letter of the word, following the ", "related", " transition at each step."], [null, "color: red", null, "br", null, "color: blue", null], baseStyle);
  const texts = [text1, text2, text3, text4, text5, text6];

  const word_text = "bbabaabb";
  const word = word_text.split('').map(c => new PIXI.Text(c, {...baseStyle}));
  const wordContainer = new PIXI.Container();
  word.forEach((c, i) => {
    c.position.set(i == 0 ? 0 : word[i-1].position.x + c.width, c.height);
    wordContainer.addChild(c);
  });
  wordContainer.pivot.set(wordContainer.width/2, wordContainer.height/2);
  wordContainer.position.set(center.x, center.y - 180);
  wordContainer.alpha = 0;
  app.stage.addChild(wordContainer);

  texts.forEach(t => {
    t.graphic.pivot.set(t.graphic.width/2, t.graphic.height/2);
    t.graphic.position.set(center.x, center.y - 220);
    t.setCurrentCharacters(0);
    app.stage.addChild(t.graphic);
  })

  const g = new Graph();
  const nodeStyle = { radius: 30, fill: bg_dark, strokeWidth: 3, stroke: black, showLabel: true };
  const edgeStyle = (lab) => ({ lineWidth: 5, edgeLabel: lab, stroke: black, arrow: {
    direction: 'forward',
    position: 'end',
    size: 20,
    width: 5,
    endOffset: 30,
  } });
  g.fromJSON({
    nodes: {
      A: { position: { x: center.x - 250, y: center.y }, style: {...nodeStyle, isEntry: true, entryWidth: 5 } },
      B: { position: { x: center.x, y: center.y }, style: nodeStyle },
      C: { position: { x: center.x + 250, y: center.y }, style: {...nodeStyle, doubleBorder: black } },
      D: { position: { x: center.x - 125, y: center.y + 200 }, style: {...nodeStyle, doubleBorder: black } },
      E: { position: { x: center.x + 125, y: center.y + 200 }, style: nodeStyle },
    },
    edges: [
      { from: 'A', to: 'B', style: edgeStyle('a') },
      { from: 'A', to: 'D', style: edgeStyle('b') },
      { from: 'B', to: 'C', style: edgeStyle('a, b') },
      { from: 'C', to: 'A', style: {
        ...edgeStyle('b'),
        edgeAnchor: {
          x: 0,
          y: -100,
        },
        arrow: {...edgeStyle('b').arrow, endOffsetPortion: 0.09},
      } },
      { from: 'C', to: 'C', style: edgeStyle('a') },
      { from: 'D', to: 'D', style: edgeStyle('b') },
      { from: 'D', to: 'E', style: edgeStyle('a') },
      { from: 'E', to: 'B', style: edgeStyle('b') },
      { from: 'E', to: 'C', style: edgeStyle('a') },
    ]
  });

  app.stage.addChild(g.graph);

  Object.values(g.nodes).forEach(n => {
    n.graphic.visible = false;
    n.innerCircle.alpha = 0;
    n.entry.alpha = 0;
  });
  g.edges.forEach(e => {
    e.drawnAmount = 0;
    e.labelText.alpha = 0;
    e.updateGraphic();
  });

  const nodePointer = new PIXI.Graphics();
  nodePointer.rect(-5, -10, 10, 20).fill(black);
  nodePointer.moveTo(-10, 10).lineTo(10, 10).lineTo(0, 25).lineTo(-10, 10).fill(black);
  nodePointer.position.set(g.nodes['A'].position.x, g.nodes['A'].position.y - 60);
  nodePointer.alpha = 0;
  app.stage.addChild(nodePointer);

  const wordPointer = new PIXI.Graphics();
  wordPointer.rect(1, 0, 11, 3).fill(highlightColours[2]);
  wordPointer.position.set(word[0].getGlobalPosition().x, word[0].getGlobalPosition().y + word[0].height);
  wordPointer.alpha = 0;
  let curWordIndex = 0;
  app.stage.addChild(wordPointer);

  // const n = new PIXI.Graphics();
  // n.circle(0, 0, 15).fill(red);
  // n.position.set(g.nodes['C'].position.x, g.nodes['C'].position.y);
  // app.stage.addChild(n);

  window.setTimeout(() => {
    const vertFadeIns = Object.values(g.nodes).map(n => {
      return n.tweenFade(60, easings.easeInOutQuad, 0, 1);
    });
    const edgeDrags = g.edges.map(e => {
      return e.growEdgeTween(120, easings.easeInOutQuad);
    });
    const edgeLabels = g.edges.map(e => {
      return e.showLabelTween(60, easings.easeInOutQuad);
    });

    const colorMap = {
      'A': highlightColours[0],
      'B': highlightColours[1],
      'C': highlightColours[2],
      'D': highlightColours[3],
      'E': highlightColours[4],
    }

    const flashEasing = combineEasing([
      easings.easeInOutQuad,
      (t) => 1,
      reverseEasing(easings.easeInOutQuad),
    ], [
      1,
      0.5,
      1,
    ]);

    const vertColorTweens = Object.values(g.nodes).map(n => {
      return n.tweenColor(colorMap[n.label], 60, easings.easeInOutQuad);
    });
    const edgeColorTweens = g.edges.map(e => {
      return e.colorEdgeTween(colorMap[e.from.label], 60, easings.easeInOutQuad, true);
    });
    const fadeVertColorTweens = Object.values(g.nodes).map(n => {
      return n.tweenColor(bg_dark, 60, easings.easeInOutQuad);
    });
    const fadeEdgeColorTweens = g.edges.map(e => {
      return e.colorEdgeTween(black, 60, easings.easeInOutQuad, true);
    });

    const fadeWordTween = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      wordContainer.alpha = v;
    });

    const vertStartTweens = Object.values(g.nodes).map(n => {
      return new ValueTween(0, 1, 90, easings.easeInOutQuad, (v) => {
        n.entry.alpha = v;
        if (n.style.isEntry) {
          n.style.fill = interpValue(n.curFill, green, v);
          n.updateGraphic();
        }
      }, () => {
        n.curFill = n.style.fill;
      });
    });

    const vertEndTweens = Object.values(g.nodes).map(n => {
      return new ValueTween(0, 1, 90, easings.easeInOutQuad, (v) => {
        n.innerCircle.alpha = v;
        if (n.style.doubleBorder) {
          n.style.fill = interpValue(n.curFill, red, v);
          n.updateGraphic();
        }
      }, () => {
        n.curFill = n.style.fill;
      });
    });

    const pointerFade = new ValueTween(0, 1, 60, easings.easeInOutQuad, (v) => {
      nodePointer.alpha = v;
      wordPointer.alpha = v;
    }).during(new ValueTween(black, red, 60, easings.easeInOutQuad, (v) => {
      word[0].style.fill = v;
    }));

    const moveBetween = (l1, l2, duration) => {
      const edge = g.edgeMap[`${l1}->${l2}`];
      const oldWordIndex = curWordIndex;
      const curWordPos = {
        x: word[curWordIndex].getGlobalPosition().x,
        y: word[curWordIndex].getGlobalPosition().y + word[0].height
      }
      curWordIndex++;
      if (curWordIndex >= word.length) {
        curWordIndex--;
      }
      const newWordIndex = curWordIndex;
      const newWordPos = {
        x: word[curWordIndex].getGlobalPosition().x,
        y: word[curWordIndex].getGlobalPosition().y + word[0].height
      }
      const tween = new ValueTween(0, 1, duration, easings.easeInOutQuad, (v) => {
        const pos = edge.edgeInterp(v).position;
        nodePointer.position.set(pos.x, pos.y - 60);
      })
        .during(edge.colorEdgeTween(red, duration, flashEasing, false));

      if (oldWordIndex != newWordIndex) {
        tween.during(new ValueTween(curWordPos, newWordPos, duration, easings.easeInOutQuad, (v) => {
          wordPointer.position.set(v.x, v.y);
        }));
        tween.during(new ValueTween(black, red, duration, easings.easeInOutQuad, (v) => {
          word[newWordIndex].style.fill = v;
        }));
      }
      tween.during(new ValueTween(red, bg_dark, duration, easings.easeInOutQuad, (v) => {
        word[oldWordIndex].style.fill = v;
      }));
      return tween;
    };

    const graphTween1 = delay(86)
      .then(...vertFadeIns)
      .then(delay(160))
      .then(...edgeDrags)
      .then(...edgeLabels)

    const graphTween2 = delay(40)
      .then(...vertColorTweens)
      .then(delay(80))
      .then(...edgeColorTweens)
      .then(delay(200))
      .then(...fadeVertColorTweens, ...fadeEdgeColorTweens)

    const graphTween3 = delay(100)
      .then(fadeWordTween)

    const graphTween4 = delay(213)
      .then(...vertStartTweens)
      .then(...vertEndTweens)

    const graphTween5 = delay(200)
      .then(pointerFade)
      .then(delay(300))
      .then(moveBetween('A', 'D', 120))
      .then(delay(60))
      .then(moveBetween('D', 'D', 120))
      .then(delay(45))
      .then(moveBetween('D', 'E', 90))
      .then(delay(30))
      .then(moveBetween('E', 'B', 60))
      .then(delay(20))
      .then(moveBetween('B', 'C', 60))
      .then(delay(20))
      .then(moveBetween('C', 'C', 60))
      .then(delay(20))
      .then(moveBetween('C', 'A', 60))
      .then(delay(20))
      .then(moveBetween('A', 'D', 60))

    const text1Tween = text1.writeTween(360, easings.linear)
      .then(delay(60))
      .then(text1.fadeTween(60, easings.easeInOutQuad))

    const text2Tween = text2.writeTween(360, easings.linear)
      .then(delay(60))
      .then(text2.fadeTween(60, easings.easeInOutQuad))

    const text3Tween = text3.writeTween(360, easings.linear)
      .then(delay(150))
      .then(text3.fadeTween(60, easings.easeInOutQuad))

    const text4Tween = text4.writeTween(360, easings.linear)
      .then(delay(60))
      .then(text4.fadeTween(60, easings.easeInOutQuad))

    const text5Tween = text5.writeTween(360, easings.linear)
      .then(delay(60))
      .then(text5.fadeTween(60, easings.easeInOutQuad))

    const text6Tween = text6.writeTween(720, easings.linear)
      .then(delay(60))
      .then(text6.fadeTween(60, easings.easeInOutQuad))

    text1Tween.then(
      text2Tween,
      graphTween1,
    ).then(
      text3Tween,
      graphTween2,
    ).then(
      text4Tween,
      graphTween3
    ).then(
      text5Tween,
      graphTween4,
    ).then(
      text6Tween,
      graphTween5,
    ).then(
      new Tween(0, easings.easeInOutQuad, ()=>{}, null, onSuccess)
    );

    TweenManager.add(text1Tween);
    const backing = PIXI.sound.Sound.from('audio/dfa_intro.m4a');
    backing.play();
  }, 1000)
}

export default { loader, unloader };
