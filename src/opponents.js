// Barnyard Circuit roster. Each entry is pure config — the fight engine reads
// these flags to shape behavior, so a new opponent is "just data".
//
// Fields:
//   id, name            identity
//   inspiration         the classic fighter it nods to (credit only; original impl)
//   personality         flavor text for the select screen
//   mechanic            one-line description of what this fight teaches
//   coachTip            line the pig coach says before the fight
//   palette             {body, accent, dark, comb, eye} canvas colors
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
    inspiration: "Glass Joe",
    personality: "A twitchy snitch who folds under pressure.",
    mechanic: "Tutorial. Slow, obvious tells — learn to dodge and counter.",
    coachTip: "Watch him wind up, slip the punch, then peck while he's off balance. Easy.",
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
    inspiration: "Von Kaiser",
    personality: "Drilled, stiff, telegraphs everything he does.",
    mechanic: "Clear left/right tells — read the attack direction before you slip.",
    coachTip: "He leans the way he's about to swing. Dodge the SAME way he leans to slip it.",
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
    inspiration: "Piston Honda",
    personality: "Slick informant who never stops talking — or swinging.",
    mechanic: "Fast combo strings. Manage stamina; don't panic-swipe.",
    coachTip: "He throws in bursts. Slip the whole string, THEN counter. Don't burn all your stamina.",
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
    inspiration: "Don Flamenco",
    personality: "Vain, theatrical, waiting for you to overcommit.",
    mechanic: "Punishes button-mashing. Only peck inside a counter window.",
    coachTip: "Stay patient. If you peck when he's not stunned, he'll make you pay. Counters only.",
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
    inspiration: "King Hippo",
    personality: "Enormous gossip with an armored gut and one soft spot.",
    mechanic: "Has a weak spot that opens briefly. Wait for the opening.",
    coachTip: "Your jabs bounce off him. After you slip a punch his guard drops — THAT'S when you strike.",
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
    inspiration: "Great Tiger",
    personality: "Faceless operative who fights with feints and misdirection.",
    mechanic: "Uses fake tells. Read real attacks from bluffs — patience wins.",
    coachTip: "Half his wind-ups are bluffs. If he double-pumps, it's fake — don't bite. Only slip the real one.",
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
    inspiration: "Bald Bull",
    personality: "The bureau's enforcer. One charge can end you.",
    mechanic: "Devastating charge attack — counter it with precise timing.",
    coachTip: "When he rears WAY back, that's the charge. Peck him right as he lunges to drop him, or eat a haymaker.",
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
    inspiration: "Mr. Sandman / Tyson",
    personality: "The champ of the Barnyard Circuit. Knows every trick you've learned.",
    mechanic: "Final boss. Combines every mechanic and grows stronger each knockdown.",
    coachTip: "This is everything you've trained for, kid. Fakes, combos, charges — all of it. Stay sharp every second.",
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
