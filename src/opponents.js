// Pecking Order roster. The opponents are the Egg Time cast (the narcs, the
// GBS agents and Todd), drawn in Egg Time's own canvas-primitive style. Each
// entry is pure config — the fight engine reads these flags to shape behavior,
// so a new opponent is "just data".
//
// Fields:
//   id, name            identity
//   inspiration         the classic fighter it nods to (credit only; original impl)
//   personality         name-led scouting line Coach Hamhock reads in the tutorial
//   mechanic            one-line description of what this fight teaches
//   art                 which Egg Time character art to use: 'narc' | 'gbs' | 'todd'
//   palette             {body, accent, dark, comb, eye} canvas colors (tints the art)
//   build               body shape hint for the renderer: 'lean' | 'stocky' | 'huge'
//   maxHealth           opponent HP per knockdown
//   knockdownsToWin     how many knockdowns the player must score to KO them
//   idleDelay           [min,max] ms the opponent waits between attacks
//   tellMs              [min,max] ms the wind-up (tell) lasts before impact
//   counterWindowMs     ms the counter window stays open after the player evades
//   damage              HP the player loses per clean hit
//   comboLength         attacks thrown back-to-back (>1 = combo strings)
//   duckChance          chance an attack must be ducked instead of dodged
//   fakeChance          chance an attack is a feint (tell with no strike)
//   punishesMashing     pecking outside a counter window gets you hit
//   weakSpot            normal pecks bounce off; only counters/weak-spot hits land
//   charge              has a slow, heavy charge attack needing precise timing
//   phases              becomes more aggressive after each knockdown (final boss)

export const OPPONENTS = [
  {
    id: "rat",
    name: "Rat",
    art: "narc",
    inspiration: "Glass Joe",
    personality: "Rat is a twitchy snitch who folds under pressure.",
    mechanic: "Tutorial. Slow, obvious tells — learn to dodge and counter.",
    palette: { body: "#9aa0a8", accent: "#cfd4da", dark: "#5d636b", comb: "#ff7a7a", eye: "#111" },
    build: "lean",
    maxHealth: 60,
    knockdownsToWin: 1,
    idleDelay: [1100, 1700],
    tellMs: [820, 1000],
    counterWindowMs: 720,
    damage: 6,
    comboLength: 1,
    duckChance: 0,
    fakeChance: 0,
    punishesMashing: false,
    weakSpot: false,
    charge: false,
    phases: 1,
  },
  {
    id: "fink",
    name: "Fink",
    art: "narc",
    inspiration: "Von Kaiser",
    personality: "Fink is drilled and stiff — he telegraphs everything he does.",
    mechanic: "Clear left/right tells — read the attack direction before you slip.",
    palette: { body: "#7fae5a", accent: "#bfe39a", dark: "#4c6f33", comb: "#ffd24a", eye: "#111" },
    build: "lean",
    maxHealth: 80,
    knockdownsToWin: 2,
    idleDelay: [950, 1500],
    tellMs: [620, 820],
    counterWindowMs: 600,
    damage: 8,
    comboLength: 1,
    duckChance: 0.25,
    fakeChance: 0,
    punishesMashing: false,
    weakSpot: false,
    charge: false,
    phases: 1,
  },
  {
    id: "narc",
    name: "Narc",
    art: "narc",
    inspiration: "Piston Honda",
    personality: "Narc is a slick informant who never stops talking — or swinging.",
    mechanic: "Fast combo strings. Manage stamina; don't panic-swipe.",
    palette: { body: "#5a8bd6", accent: "#a9c8f5", dark: "#34568c", comb: "#ff5a5a", eye: "#111" },
    build: "lean",
    maxHealth: 95,
    knockdownsToWin: 2,
    idleDelay: [800, 1200],
    tellMs: [460, 600],
    counterWindowMs: 480,
    damage: 9,
    comboLength: 3,
    duckChance: 0.2,
    fakeChance: 0,
    punishesMashing: false,
    weakSpot: false,
    charge: false,
    phases: 1,
  },
  {
    id: "snitch",
    name: "Snitch",
    art: "narc",
    inspiration: "Don Flamenco",
    personality: "Snitch is vain and theatrical, waiting for you to overcommit.",
    mechanic: "Punishes button-mashing. Only peck inside a counter window.",
    palette: { body: "#b15ad6", accent: "#e0a9f5", dark: "#6f348c", comb: "#ffd24a", eye: "#111" },
    build: "lean",
    maxHealth: 100,
    knockdownsToWin: 2,
    idleDelay: [950, 1500],
    tellMs: [520, 700],
    counterWindowMs: 520,
    damage: 10,
    comboLength: 1,
    duckChance: 0.2,
    fakeChance: 0,
    punishesMashing: true,
    weakSpot: false,
    charge: false,
    phases: 1,
  },
  {
    id: "tattler",
    name: "Tattler",
    art: "narc",
    inspiration: "King Hippo",
    personality: "Tattler is an enormous gossip with an armored gut and one soft spot.",
    mechanic: "Has a weak spot that opens briefly. Wait for the opening.",
    palette: { body: "#e58fb0", accent: "#ffd0e0", dark: "#a85070", comb: "#ffd24a", eye: "#111" },
    build: "huge",
    maxHealth: 120,
    knockdownsToWin: 2,
    idleDelay: [1100, 1600],
    tellMs: [640, 820],
    counterWindowMs: 640,
    damage: 12,
    comboLength: 1,
    duckChance: 0.15,
    fakeChance: 0,
    punishesMashing: false,
    weakSpot: true,
    charge: false,
    phases: 1,
  },
  {
    id: "gbs-agent",
    name: "GBS Agent",
    art: "gbs",
    inspiration: "Great Tiger",
    personality: "GBS Agent is a faceless operative who fights with feints and misdirection.",
    mechanic: "Uses fake tells. Read real attacks from bluffs — patience wins.",
    palette: { body: "#3fb6a8", accent: "#9ff0e6", dark: "#1f6e64", comb: "#ffd24a", eye: "#fff" },
    build: "lean",
    maxHealth: 110,
    knockdownsToWin: 2,
    idleDelay: [900, 1400],
    tellMs: [520, 700],
    counterWindowMs: 520,
    damage: 11,
    comboLength: 1,
    duckChance: 0.15,
    fakeChance: 0.45,
    punishesMashing: false,
    weakSpot: false,
    charge: false,
    phases: 1,
  },
  {
    id: "gbs-leader",
    name: "GBS Leader",
    art: "gbs",
    inspiration: "Bald Bull",
    personality: "GBS Leader is the bureau's enforcer — one charge can end you.",
    mechanic: "Devastating charge attack — counter it with precise timing.",
    palette: { body: "#d65a5a", accent: "#f5a9a9", dark: "#8c3434", comb: "#ffd24a", eye: "#111" },
    build: "stocky",
    maxHealth: 130,
    knockdownsToWin: 2,
    idleDelay: [950, 1400],
    tellMs: [520, 700],
    counterWindowMs: 480,
    damage: 13,
    comboLength: 1,
    duckChance: 0.15,
    fakeChance: 0,
    punishesMashing: false,
    weakSpot: false,
    charge: true,
    phases: 1,
  },
  {
    id: "todd",
    name: "Todd",
    art: "todd",
    inspiration: "Mr. Sandman / Tyson",
    personality: "Todd is the champ of the Pecking Order, and he knows every trick you've learned.",
    mechanic: "Final boss. Combines every mechanic and grows stronger each knockdown.",
    palette: { body: "#23232b", accent: "#ffd24a", dark: "#000", comb: "#ff5a5a", eye: "#ffd24a" },
    build: "stocky",
    maxHealth: 120,
    knockdownsToWin: 3,
    idleDelay: [780, 1200],
    tellMs: [440, 620],
    counterWindowMs: 460,
    damage: 14,
    comboLength: 3,
    duckChance: 0.2,
    fakeChance: 0.35,
    punishesMashing: true,
    weakSpot: false,
    charge: true,
    phases: 3,
  },
];

export function opponentById(id) {
  return OPPONENTS.find((o) => o.id === id) || null;
}

export function opponentIndex(id) {
  return OPPONENTS.findIndex((o) => o.id === id);
}
