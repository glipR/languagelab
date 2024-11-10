import { Scene, SceneManager } from "../scene.js";

const sceneHTML = (id) => `
<div class="scene" id="${id}">
  <button class="playScene" id="${id}Play">
    <span class="playTriangle"></span>
  </button>
  <div class="modal successModal">
    <div class="imprint"></div>
    <div class="modalContent">
      <h2>Success!</h2>
      <p class="successMsg">You did the thing</p>
    </div>
    <img src="/img/pin.png" class="iconPin"></img>
    <div class="modalActions">
      <button class="modalButton">Next</button>
    </div>
  </div>
  <div class="modal failureModal">
    <div class="imprint"></div>
    <div class="modalContent">
      <h2>Failed!</h2>
      <p class="failureMsg">You did the thing</p>
    </div>
    <img src="/img/pin.png" class="iconPin"></img>
    <div class="modalActions">
      <button class="modalButton">Retry</button>
    </div>
  </div>
</div>
`

export const addScene = (id, div) => {
  div.insertAdjacentHTML('beforeend', sceneHTML(id));
}

export const registerScene = (loader, unloader, id, sceneOpts, onSuccess, onFailure) => {
  window.afterAssetLoad.push(() => {
    SceneManager.registerScene(new Scene(id, loader, unloader, id, onSuccess, onFailure));

    SceneManager.attachButton(id, `${id}Play`, sceneOpts ?? {});
  })
}
