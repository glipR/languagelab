// Handler for multiple canvases on screen and their interaction
import easings from 'https://cdn.jsdelivr.net/npm/easings.net@1.0.3/+esm';
import { bg, green } from './colours.js';
import { TweenManager } from './tween.js';

class SceneManager {
  // Close all canvases when playing a single canvas.
  static closeAllOnPlay = true;
  static registeredScenes = {};

  static registerScene(scene) {
    SceneManager.registeredScenes[scene.name] = scene;
  }

  static async loadScene(sceneName, opts) {
    if (SceneManager.closeAllOnPlay) {
      SceneManager.closeAll();
    }

    const scene = SceneManager.registeredScenes[sceneName];
    if (scene === undefined) {
      console.error(`Scene with name ${sceneName} not found!`);
      return;
    }
    if (scene.loaded) {
      scene.unload();
    }

    await scene.load(opts);
  }

  static unloadScene(sceneName) {
    const scene = SceneManager.registeredScenes[sceneName];
    if (scene === undefined) {
      console.error(`Scene with name ${sceneName} not found!`);
      return;
    }
    if (scene.loaded) {
      scene.unload();
    }
    TweenManager.clear();
  }

  static closeAll() {
    TweenManager.clear();
    for (const scene of Object.values(SceneManager.registeredScenes)) {
      if (scene.loaded) {
        scene.unload();
      }
    }
  }

  static attachButton(sceneName, buttonID, sceneOpts) {
    const button = document.getElementById(buttonID);
    if (button === null) {
      console.error(`Button with ID ${buttonID} not found!`);
      return;
    }
    const scene = SceneManager.registeredScenes[sceneName];
    if (scene === undefined) {
      console.error(`Scene with name ${sceneName} not found!`);
      return;
    }

    button.addEventListener('click', () => {
      SceneManager.loadScene(sceneName, sceneOpts);
    });

    scene.button = button;
  }

}

class Scene {
  constructor(name, loader, unloader, parentID, onSuccess, onFailure) {
    this.name = name;
    this.loader = loader;
    this.unloader = unloader;
    this.parentID = parentID;
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;
    this.loaded = false;
  }

  async load(opts) {
    this.loaded = true;
    if (this.button) {
      this.button.style.display = 'none';
    }
    this.parent = document.getElementById(this.parentID);
    if (this.parent === null) {
      console.error(`Element with ID ${this.canvasID} not found!`);
      this.loaded = false;
      return;
    }
    // Log position of parent element.
    console.log(this.parent.getBoundingClientRect());

    const app = new PIXI.Application();
    await app.init({
      width: this.parent.clientWidth,
      height: this.parent.clientHeight,
      antialias: true,
      backgroundColor: bg,
    });
    app.ticker.add(({deltaTime}) => {
      TweenManager.update(deltaTime);
    });
    this.parent.appendChild(app.canvas);

    this.app = app;
    this.loader(this.app, easings, this.onSuccess, this.onFailure, opts || {});
  }

  unload() {
    this.unloader(this.app);
    this.parent.removeChild(this.app.canvas);
    this.app.destroy();
    this.loaded = false;
    if (this.button) {
      this.button.style.display = 'block';
    }
  }
}

export { Scene, SceneManager };
