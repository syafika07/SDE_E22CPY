import {
  findClosestIonContent,
  scrollToTop
} from "./chunk-FSRGTU3M.js";
import {
  readTask,
  writeTask
} from "./chunk-XLSUGCRP.js";
import {
  componentOnReady
} from "./chunk-OV3HA55U.js";
import "./chunk-D5QKZW3X.js";
import {
  __async
} from "./chunk-QXFS4N4X.js";

// ../node_modules/@ionic/core/components/status-tap.js
var startStatusTap = () => {
  const win = window;
  win.addEventListener("statusTap", () => {
    readTask(() => {
      const width = win.innerWidth;
      const height = win.innerHeight;
      const el = document.elementFromPoint(width / 2, height / 2);
      if (!el) {
        return;
      }
      const contentEl = findClosestIonContent(el);
      if (contentEl) {
        new Promise((resolve) => componentOnReady(contentEl, resolve)).then(() => {
          writeTask(() => __async(null, null, function* () {
            contentEl.style.setProperty("--overflow", "hidden");
            yield scrollToTop(contentEl, 300);
            contentEl.style.removeProperty("--overflow");
          }));
        });
      }
    });
  });
};
export {
  startStatusTap
};
/*! Bundled license information:

@ionic/core/components/status-tap.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=status-tap-UPWDJTV7.js.map
