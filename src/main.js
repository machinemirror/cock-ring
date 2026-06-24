// Entry point. Exposes the public window.CockRing API used both by the
// standalone page and by a future Egg Time embed, and auto-starts when loaded
// as a standalone page (a container with id="app" exists and isn't embedded).

import { Game } from "./game.js";
import { Progression } from "./progression.js";

let game = null;

const CockRing = {
  /**
   * Start (or restart) the game inside a container.
   * @param {Object} options
   * @param {string} [options.containerId="app"] element to mount into
   * @param {string} [options.startOpponent]     opponent id to jump straight into
   * @param {Function} [options.onWin]   ({opponent, timeMs}) => void
   * @param {Function} [options.onLose]  ({opponent}) => void
   * @param {Function} [options.onExit]  () => void
   */
  start(options = {}) {
    const containerId = options.containerId || "app";
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[CockRing] container #${containerId} not found`);
      return;
    }
    if (game) game.unmount();
    game = new Game();
    game.mount(container, options);
    return game;
  },

  stop() {
    if (game) {
      const onExit = game.callbacks && game.callbacks.onExit;
      game.unmount();
      game = null;
      if (onExit) onExit();
    }
  },

  resetProgress() {
    Progression.reset();
  },

  getProgress() {
    return Progression.get();
  },
};

window.CockRing = CockRing;
export default CockRing;

// Standalone auto-start. When embedded, the host should set
// window.COCK_RING_NO_AUTOSTART = true and call CockRing.start() itself.
function autostart() {
  if (window.COCK_RING_NO_AUTOSTART) return;
  if (document.getElementById("app")) CockRing.start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autostart);
} else {
  autostart();
}
