import {
  findClosestIonContent,
  scrollToTop
} from "./chunk-OMSMWOGU.js";
import {
  componentOnReady
} from "./chunk-G2EUVSVO.js";
import {
  readTask,
  writeTask
} from "./chunk-QIP3FD7Q.js";
import {
  __async
} from "./chunk-QXFS4N4X.js";

// node_modules/@ionic/core/dist/esm/status-tap-5DQ7Fc4V.js
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
//# sourceMappingURL=status-tap-5DQ7Fc4V-JYYG6EN7.js.map
