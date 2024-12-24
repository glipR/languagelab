// Other scripts can add functions to this array to be called after the assets are loaded
window.afterAssetLoad = [];

// TODO: Split up manifest bundles
const manifest = {
  bundles: [
    {
      name: "fontBundle",
      assets: {
        "FiraSans-Regular": "/firasans/FiraSans-Regular.ttf",
        "FiraSans-Bold": "/firasans/FiraSans-Bold.ttf",
        "FiraSans-Italic": "/firasans/FiraSans-Italic.ttf",
        "FiraSans-BoldItalic": "/firasans/FiraSans-BoldItalic.ttf",
        "FiraSans-Thin": "/firasans/FiraSans-Thin.ttf",
        "ShiftNotes-Regular": "/shiftynotes/ShiftyNotesRegular.ttf",
        "Ittybittynotebook": "/itty-bitty-notebook-font/IttyBittyNotebook.ttf",
        "bg": "/img/backgrounds/brown-paper.jpg",
      }
    },
    {
      name: "dfaIntroBundle",
      assets: {
        "pick": "/pick_trim.m4a",
        "Standing": "/mario/standing.webp",
        "Running": "/mario/run.png",
        "Crouching": "/mario/crouch.png",
        "Diving": "/mario/dive.png",
        "Jumping": "/mario/jump.png",
        "Pounding": "/mario/pound.webp",
        "Punching": "/mario/punch.png",
        "Sweeping": "/mario/sweep.png",
        "ButtonA": "/mario/a.svg",
        "ButtonB": "/mario/b.svg",
        "Down": "/mario/down.svg",
        "ButtonZ": "/mario/z.svg",
        "Right": "/mario/right.svg",
      }
    },
    {
      name: "introBundle",
      assets: {
        "complexity": "/img/intro/complexity.png",
        "plain-code": "/img/intro/plain-code.png",
        "annotated-code": "/img/intro/annotated-code.png",
        "cog": "/img/intro/cog.png",
        "computer": "/img/intro/computer.png",
        "valid-1": "/img/intro/valid-1.png",
        "valid-2": "/img/intro/valid-2.png",
        "invalid-1": "/img/intro/invalid-1.png",
        "invalid-2": "/img/intro/invalid-2.png",
        "42-valid-1": "/img/intro/42-valid-1.png",
        "42-valid-2": "/img/intro/42-valid-2.png",
        "42-invalid-1": "/img/intro/42-invalid-1.png",
        "42-invalid-2": "/img/intro/42-invalid-2.png",
      }
    }
  ]
}

const load = (extraBundle) => {
  return PIXI.Assets.init({ manifest }).then(() => {
    PIXI.Assets.loadBundle("fontBundle").then(() => {
      if (extraBundle) {
        PIXI.Assets.loadBundle(extraBundle).then(() => {
          window.afterAssetLoad.forEach((fn) => { fn(); });
        });
      } else {
        window.afterAssetLoad.forEach((fn) => { fn(); });
      }
    });
  });
}
export default load;
