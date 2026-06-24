// localStorage-backed save system. Tracks unlocks, results, best times and the
// one-time tutorial flag. Falls back to an in-memory store if storage is blocked.
const { OPPONENTS } = await import(`./opponents.js?v=${globalThis.__CRV || ""}`);

const KEY = "cockring.progress.v1";

const DEFAULT = {
  defeated: {},      // { [id]: true }
  bestTimes: {},     // { [id]: milliseconds }
  wins: 0,
  losses: 0,
  tutorialShown: false,
};

let memoryFallback = null;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch (_) {
    return memoryFallback ? { ...memoryFallback } : { ...DEFAULT };
  }
}

function write(state) {
  memoryFallback = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) {
    /* storage unavailable (private mode / embedded) — memory fallback holds it */
  }
}

export const Progression = {
  get() {
    return read();
  },

  // An opponent is unlocked if it's the first, or the previous one is defeated.
  isUnlocked(id) {
    const idx = OPPONENTS.findIndex((o) => o.id === id);
    if (idx <= 0) return true;
    const state = read();
    return !!state.defeated[OPPONENTS[idx - 1].id];
  },

  isDefeated(id) {
    return !!read().defeated[id];
  },

  // Next opponent the player should fight (first undefeated unlocked one).
  nextOpponentId() {
    const state = read();
    for (const o of OPPONENTS) {
      if (!state.defeated[o.id]) return o.id;
    }
    return OPPONENTS[OPPONENTS.length - 1].id;
  },

  recordWin(id, timeMs) {
    const state = read();
    state.defeated[id] = true;
    state.wins += 1;
    if (!state.bestTimes[id] || timeMs < state.bestTimes[id]) {
      state.bestTimes[id] = timeMs;
    }
    write(state);
    return state;
  },

  recordLoss(id) {
    const state = read();
    state.losses += 1;
    write(state);
    return state;
  },

  markTutorialShown() {
    const state = read();
    state.tutorialShown = true;
    write(state);
  },

  tutorialShown() {
    return read().tutorialShown;
  },

  reset() {
    write({ ...DEFAULT });
  },
};
