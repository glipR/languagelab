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
        "bg": "/brown-paper.jpg",
        "pick": "/pick_trim.m4a",
        "Ittybittynotebook": "/itty-bitty-notebook-font/IttyBittyNotebook.ttf"
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
