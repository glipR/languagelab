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
        // TODO: Move elsewhere
        "bg": "/img/backgrounds/brown-paper.jpg",
        "pick": "/pick_trim.m4a",
        "Ittybittynotebook": "/itty-bitty-notebook-font/IttyBittyNotebook.ttf",
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
    }
  ]
}

const load = () => {
  return PIXI.Assets.init({ manifest }).then(() => {
    PIXI.Assets.loadBundle("fontBundle").then((bundle) => {
      window.afterAssetLoad.forEach((fn) => { fn(); });
    });
  });
}
export default load;
