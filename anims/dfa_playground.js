import DFADraw from "../tools/dfa_draw.js";
import Screen from "../screen.js";
import { bg_dark } from "../colours.js";
import { FloatingButton } from "../ui.js";

const GS = {};

const loader = (app, easings, onSuccess, onFailure, opts) => {
  GS.screen = new Screen(app);
  GS.screen.setScreenSize(app.renderer.width, app.renderer.height);
  GS.screen.setGameSize(1000, 600);
  GS.screen.scaleToFit();
  GS.dfa = new DFADraw(GS.screen, opts);
  if (opts?.dfa) {
    GS.dfa.dfa.fromJSON(opts.dfa);
  }
  GS.opts = opts;
  GS.onSuccess = onSuccess;
  GS.onFailure = onFailure;

  const clearButton = new FloatingButton({
    label: {
      text: "Clear",
    },
    bg: {
      fill: bg_dark,
    },
    width: 100,
    height: 50,
  });
  clearButton.position.set(GS.screen.gameWidth - 110, GS.screen.gameHeight - 10 - 50);
  clearButton.onClick = () => {
    GS.dfa.dfa.clear();
  };
  GS.screen.addChild(clearButton);

  const importButton = new FloatingButton({
    label: {
      text: "Import",
    },
    bg: {
      fill: bg_dark,
    },
    width: 100,
    height: 50,
  });
  importButton.position.set(10, GS.screen.gameHeight - 10 - 50);
  importButton.onClick = () => {
    navigator.clipboard.readText().then((text) => {
      try {
        // JS JSON parser doesn't like single quotes
        const data = JSON.parse(text.replaceAll("'", "\"").replaceAll('\n', ''));
        if (data) {
          GS.dfa.import(data);
        } else throw new Error();
      }
      catch (e) {
        alert("Invalid data. Be sure to copy the entire JSON object and only that! Example: {\"states\":[...],\"alphabet\":[...],\"transitions\":[...]}");
      }
    });
  };
  GS.screen.addChild(importButton);
  const exportButton = new FloatingButton({
    label: {
      text: "Export",
    },
    bg: {
      fill: bg_dark,
    },
    width: 100,
    height: 50,
  });
  exportButton.position.set(120, GS.screen.gameHeight - 10 - 50);
  exportButton.onClick = () => {
    const errorMsg = GS.dfa.dfa.validate();
    if (errorMsg) {
      alert(errorMsg);
      return;
    }
    const val = GS.dfa.dfa.export();
    navigator.clipboard.writeText(JSON.stringify(val));
    alert("Exported to clipboard!");
  };
  GS.screen.addChild(exportButton);
}

const unloader = () => {
  GS.dfa.unload();
}

export default { loader, unloader };
