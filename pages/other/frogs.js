import { addScene, registerScene } from '../../templates/scene.js';
import { StepScenes } from '../../utils.js';
import Screen from '../../screen.js';
import { black } from '../../colours.js';

const GS = {};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.app = app;
  GS.easings = easings;
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(4000, 2400);
  GS.screen.scaleToFit();
  GS.opts = opts;

  const box_size = 400;
  const top_left = (i) => {
    return {
      x: 2000 + (i - (opts.initial.length+1) / 2) * box_size,
      y: 1200 - box_size / 2,
    }
  }

  const board = new PIXI.Graphics();
  const l = top_left(0);
  const r = top_left(opts.initial.length);
  board.moveTo(l.x, l.y);
  board.lineTo(r.x, l.y);
  board.lineTo(r.x, l.y + box_size);
  board.lineTo(l.x, l.y + box_size);
  for (let i = 0; i < opts.initial.length; i++) {
    const tl = top_left(i);
    board.moveTo(tl.x, tl.y);
    board.lineTo(tl.x, tl.y + box_size);
  }
  board.stroke({ color: black, width: 10 });

  GS.screen.addChild(board);

  const entities = [];
  for (let i=0; i<opts.initial.length; i++) {
    if (opts.initial[i] === 'L') {
      const tl = top_left(i);
      const toad = new PIXI.Sprite(PIXI.Texture.from('toad'));
      toad.pivot.set(toad.width/2, toad.height/2)
      toad.scale.set(0.35);
      toad.position.set(tl.x + box_size/2, tl.y + box_size/2);
      GS.screen.addChild(toad);
      entities.push(toad);
    }
    if (opts.initial[i] === 'R') {
      const tl = top_left(i);
      const frog = new PIXI.Sprite(PIXI.Texture.from('frog'));
      frog.pivot.set(frog.width/2, frog.height/2)
      frog.scale.set(0.25);
      frog.position.set(tl.x + box_size/2, tl.y + box_size/2);
      console.log(frog);
      GS.screen.addChild(frog);
      entities.push(frog);

      const newFrog = new PIXI.Sprite(PIXI.Texture.from('frog'));
      newFrog.scale.set(0.25);
      newFrog.tint = 0x000000;
      newFrog.alpha = 0.6;

      const shadowContainer = new PIXI.Container();
      shadowContainer.position.set(tl.x, tl.y + 3 * box_size/2);

      shadowContainer.addChild(newFrog);
      GS.screen.addChild(shadowContainer);

    }
  }

}

const unloader = () => {

}

const boardOpts = {
  initial: [
    'L', '', 'L', '', '', 'R', 'R'
  ]
}

const contentText = `
Frogs.
`

const addContent = () => {
  const div = document.createElement("div");
  div.innerHTML = contentText;
  document.querySelector('.articleBodyCenter').appendChild(div);
  MathJax.typeset();
  addScene('frogs', document.querySelector('.articleBodyCenter'), ['sceneFill']);
  const frogContainer = document.querySelector('#frogs');
  const steps = new StepScenes(frogContainer, 'frogs', [boardOpts], () => {}, true, null, {});
  registerScene(loader, unloader, 'frogs', boardOpts, steps.makeOnSuccess(), steps.makeOnFailure());
}

export default addContent;
