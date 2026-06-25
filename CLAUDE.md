# Cock Ring — working notes for Claude

A mobile-first HTML5 Canvas boxing game. Standalone now; designed to later embed
into the **Egg Time** game as a module. Live at
<https://machinemirror.github.io/cock-ring/> (repo: `machinemirror/cock-ring`).

## What it is right now

- Title **COCK RING**; the campaign is the **PECKING ORDER**; launch subtitle
  "Are you a featherweight champion?".
- You play **Large Cock** — a rooster seen from **behind**, **armless**, who
  strikes with **pecks** (head/beak lunges, not punches). His big tail feathers
  are drawn IN FRONT (closest to camera).
- 8 opponents, all the **Egg Time cast**, drawn in a **Punch-Out presentation
  style** (big torso-up cartoon boxers, bold outlines, telegraphed wind-ups):
  Rat, Fink, Narc, Snitch, Tattler (suited "narc" art), GBS Agent (Egg Time Lv6
  Downtown riot trooper — armor + visor helmet + "GBS"), GBS Leader (Egg Time
  Lv7 fat officer — olive uniform, peaked cap, medals, aviators), Todd (shirtless
  beefy final boss, multi-phase).
- Supporting cast: a dense, overlapping crowd of **hens + front-facing pigs**;
  a **chick referee** in the lower-right who counts via a **speech bubble**
  ("1".."3", then "K.O.!"); **Coach Hamhock** (pig) gives a tip in the tutorial.

## Fight mechanics (modeled on Egg Time's Lv2 cock fight)

- **Commit-based weave:** each jab you get ONE dodge attempt during the wind-up.
  An arrow shows the safe side. Weave correctly → opponent whiffs **open**
  immediately; wrong side / duck a hook / never react → you eat the punch.
- **Peck the opening:** pecks deal damage ONLY while he's open (no idle chip),
  rate-limited (`peckCd`) so you can't mash through. Damage piles up as **face
  wounds → bloody pecked-out eyes**; **blood splatters on the lens**.
- Per-opponent flavor still layers on: Narc combo strings, Snitch/Todd punish
  premature pecks (`punishesMashing`), GBS Agent **fake** wind-ups, GBS
  Leader/Todd **charge** attacks you can precisely interrupt, Tattler weak-spot.
- **Golden Egg** meter fills on counters → `Space`/center-tap special (big hit).
- Stamina = **PECK POWER**; knockdowns counted by the chick; 3 player knockdowns
  = loss. Difficulty is globally eased via `EASE_TELL/EASE_IDLE/EASE_DMG` in
  `fightEngine.js`.

## Architecture (vanilla ES modules, NO build step)

```
index.html      mount point (#app) + cache-busting bootstrap
style.css       overlays, the Egg-Time-style "PECKING ORDER" level menu, HUD chrome
src/main.js     window.CockRing API + standalone auto-start
src/game.js     UI build (TEMPLATE), screens, rAF loop, input wiring, VERSION
src/renderer.js ALL canvas drawing (arena, crowd, fighters, HUD, blood, bubble)
src/fightEngine.js  the fight state machine (documented at top of file)
src/player.js   player state, stamina, egg meter
src/opponents.js opponent config DATA (the roster) — `art: narc|gbs|todd`
src/audio.js    Web Audio synthesized SFX (no audio files)
src/progression.js  localStorage save (key `cockring.progress.v1`)
```

- Logical render space is `540×960` (`LOGICAL_W/H`); the canvas is scaled to fit
  and drawn at devicePixelRatio. All art is canvas primitives — **no image or
  audio assets**.
- Public API on `window.CockRing`: `start(options)`, `stop()`, `resetProgress()`,
  `getProgress()`. `start({containerId, startOpponent, onWin, onLose, onExit})`.
  Set `window.COCK_RING_NO_AUTOSTART=true` to suppress the standalone auto-start
  when embedding.
- **Embedding (Egg Time host), backwards-compatible** — extra `start()` options:
  `embedded` (land on the roster + show a host Exit button), `hideReset` (hide Reset
  Progress; defaults to `embedded`), `exitLabel` (Exit button text), `progressAdapter`
  (host save: `get/isUnlocked/isDefeated/recordWin/recordLoss/markTutorialShown/
  tutorialShown` — swapped in for the local `Progression`), and `economyAdapter`
  (`startBout(id)→{ok}|{ok:false,reason}`, `costLabel?()` — gates **FIGHT!**, spent on
  fight start). Implemented in `Game` (game.js): `this.prog`/`this.economy` replace
  direct `Progression` reads; standalone keeps using `Progression` + the title screen.
  Egg Time vendors a copy of this `src/` under `egg-time/src/vendor/cock-ring/`.

## Cache-busting + versioning (IMPORTANT)

GitHub Pages serves everything `Cache-Control: max-age=600`, and mobile browsers
cache ES modules hard. So `index.html` stamps `window.__CRV = Date.now()` and
loads CSS + `src/main.js` with `?v=<token>`; every inter-module import is a
**versioned dynamic import** (`await import('./x.js?v=' + globalThis.__CRV)`).
Net effect: a fresh build shows up immediately, even from a cached index.html.

- Modules use top-level `await` + dynamic imports — keep that pattern when adding
  files (use `globalThis.__CRV`, falling back to `""` so Node tooling/tests work).
- `VERSION` in `src/game.js` is the **on-screen "beta build X.Y.Z"** — bump it
  every deploy the user will look at.

## Deploy

Commit to `main` and push; GitHub Pages builds from `main` / root. No workflow.
`gh` lives at `~/.local/bin/gh` (not always on PATH for non-interactive shells —
prefix `export PATH="$HOME/.local/bin:$PATH"` or use the absolute path).
After pushing, the user usually just hard-refreshes on their phone.

## Testing (no test runner; verify before pushing)

- **Fight logic:** a Node sim that drives `FightEngine.playerDodge/playerDuck/
  playerPeck` with a perfect-play bot and asserts every opponent is winnable.
  Write it to the scratchpad, `import` the `src/*.js` modules (query strings in
  imports work in Node), run with `node`.
- **Runtime/no-errors + visuals:** headless Chrome at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
  (`--headless=new --disable-gpu --no-sandbox`). Use `--dump-dom` with a harness
  page that records `window.onerror`, and `--screenshot=...` to eyeball scenes.
  Drive a small debug HTML that imports the renderer and draws one frame for a
  given opponent/state. Serve via `python3 -m http.server` from the repo root.
- Keep scratch/test files OUT of the repo (use the session scratchpad dir).

## Legal / IP boundary (the user keeps testing this — hold the line)

Everything shipped is **original** or the user's **own** work:

- The character/UI art is **ported from the user's own Egg Time repo**
  (`machinemirror/egg-time`) — that's their copyright, fine to reuse here.
- **Do NOT** copy assets from third-party Punch-Out projects. Specifically:
  - `justin-austria/PunchOut` contains **ripped Nintendo sprites + game music**
    (Glass Joe/Little Mac/King Hippo/Mario PNGs, theme MP3s) — off-limits.
  - `nmikstas/mike-tysons-punch-out-disassembly` is a **reverse-engineered ROM
    disassembly** (Nintendo's copyrighted code) — off-limits, even though the
    user offered "permission" (it's not theirs to grant).
- Game **mechanics/behaviors and genre presentation are NOT copyrightable** — it
  is fine to make it *play and look like* a Punch-Out-style boxer. Only specific
  code/art/audio is protected. The README carries the legal note.

## Conventions

- Match the existing code style: terse, minimal comments (only the non-obvious
  WHY), constants/config objects for opponents, small focused modules.
- Co-author commits: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- `0_prompt.pages` (the original spec) is gitignored; don't commit it.
