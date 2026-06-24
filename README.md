# 🥊 Cock Ring

A mobile-first, **HTML5 Canvas** boxing game. You play **Large Cock**, a rooster
boxer fighting his way through the **Barnyard Circuit** — read each opponent's
tells, slip their punches, manage your stamina, charge the **Golden Egg** meter,
and knock them all out.

The fight feel is inspired by classic reflex/pattern-recognition boxing
boss-rush games, but **everything here is original**: original code, original
characters, original canvas-drawn art, and original synthesized audio. No
third-party sprites, music, ROM data, or copyrighted assets are used.

---

## What it is

- One-on-one reflex fights against **8 opponents**, each teaching a distinct mechanic.
- Pure **vanilla HTML/CSS/JS**, ES modules, **no build step**.
- **Canvas rendering** — every character is drawn with shapes; no image files.
- Synthesized sound via the **Web Audio API** — no audio files.
- **localStorage** save system: unlocks, defeats, best times, win/loss record.
- Designed to drop into the existing **Egg Time** game later as a module.

## How to run locally

Because the game uses ES modules, you need to serve the folder over HTTP
(opening `index.html` via `file://` will be blocked by the browser). Any static
server works:

```bash
# Python (any 3.x)
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000> and play. Portrait orientation is preferred;
it scales responsively to any screen.

## How to publish with GitHub Pages

1. Push this repo to GitHub (public).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**.
4. Choose branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait a minute; your game is live at
   `https://<your-username>.github.io/cock-ring/`.

No build step or workflow is required — it's all static files.

## Controls

**Mobile**
- Tap **left side** of the screen → left peck
- Tap **right side** of the screen → right peck
- Swipe **left** → dodge left
- Swipe **right** → dodge right
- Swipe **down** → duck / block
- Tap the **Golden Egg meter** (center-top) → special attack (when charged)

**Desktop**
- `A` / `←` → dodge left
- `D` / `→` → dodge right
- `S` / `↓` → duck / block
- `J` → left peck
- `K` → right peck
- `Space` → Golden Egg special

### How a fight works

When an opponent winds up, an arrow shows which way to slip (or to duck). Dodge
at the right moment and they **whiff**, opening a **counter window** — peck then
for big damage and to build your Golden Egg meter. Pecking carelessly costs
stamina (and some opponents punish it). Fill the meter for a screen-clearing
special. Drop an opponent enough times to win; get dropped three times and you
lose.

## Opponent lineup (Barnyard Circuit)

| #  | Opponent     | Teaches                                              |
| -- | ------------ | --------------------------------------------------- |
| 1  | **Rat**      | Tutorial — basic dodging and countering             |
| 2  | **Fink**     | Reading clear left/right attack tells               |
| 3  | **Narc**     | Stamina management vs. fast combo strings           |
| 4  | **Snitch**   | Patience — punishes button-mashing                  |
| 5  | **Tattler**  | Waiting for a brief weak-spot opening               |
| 6  | **GBS Agent**| Telling real attacks from fake tells                |
| 7  | **GBS Leader** | Precise timing to counter a devastating charge    |
| 8  | **Todd**     | Final boss — every mechanic, multiple phases        |

Supporting cast: a crowd of **hens**, a **fox** referee who counts knockdowns,
and **Coach Hamhock**, the **pig** corner-man who gives a tip before each fight.

## Future Egg Time integration

The game mounts its entire UI into a single container, so it can be embedded
anywhere. It exposes a small public API on `window.CockRing`:

```js
window.CockRing = {
  start(options),   // mount and run
  stop(),           // unmount + fire onExit
  resetProgress(),  // wipe the save
  getProgress(),    // read the save object
};
```

`start(options)` accepts:

```js
CockRing.start({
  containerId: "my-host-element", // defaults to "app"
  startOpponent: "rat",           // optional: jump straight into a fight
  onWin:  ({ opponent, timeMs }) => {},
  onLose: ({ opponent }) => {},
  onExit: () => {},
});
```

To embed inside Egg Time, set `window.COCK_RING_NO_AUTOSTART = true` before
loading `src/main.js`, then call `CockRing.start({ containerId, ... })` from the
host. The fight engine, renderer, player, opponents and progression are all
separate ES modules under `src/`, so individual pieces can be reused too.

## Project structure

```txt
cock-ring/
  index.html        # mount point + module entry
  style.css         # mobile-first layout, overlays, HUD chrome
  README.md
  LICENSE           # MIT
  src/
    main.js         # window.CockRing API + standalone auto-start
    game.js         # UI build, screens, loop, input wiring
    input.js        # touch/swipe + keyboard → game intents
    renderer.js     # all canvas drawing (arena, fighters, HUD)
    fightEngine.js  # the fight state machine (documented at top of file)
    player.js       # player state, stamina, egg meter
    opponents.js    # opponent config data (the roster)
    audio.js        # Web Audio synthesized sound
    progression.js  # localStorage save system
```

## Legal

All code and assets in this repository are **original work**. This game is **not
affiliated with, endorsed by, or derived from** Nintendo or any other company,
and contains **no** Nintendo (or other third-party) names, sprites, music, ROM
code, reverse-engineered code, or copyrighted assets. Character and mechanic
"inspirations" noted in the code are creative homages only; the implementation
is independent and original.

Licensed under the [MIT License](LICENSE).
