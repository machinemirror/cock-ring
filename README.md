# 🥊 Cock Ring

A mobile-first, **HTML5 Canvas** boxing game. You play **Large Cock**, a rooster
fighting his way up the **Pecking Order** — read each opponent's wind-up, weave
to the safe side, then peck him open. *Are you a featherweight champion?*

**▶ Play:** <https://machinemirror.github.io/cock-ring/>

The fight feel is inspired by classic reflex/pattern-recognition boxing games,
but **everything here is original or the author's own work**: original code, the
author's own **Egg Time** character art (redrawn in a ring-boxing presentation),
canvas-drawn visuals, and synthesized audio. No third-party sprites, music, ROM
data, or copyrighted assets are used.

## What it is

- One-on-one reflex fights against **8 opponents** — the Egg Time cast.
- Pure **vanilla HTML/CSS/JS**, ES modules, **no build step**.
- **Canvas rendering** — every character is drawn with shapes; no image files.
- Synthesized sound via the **Web Audio API** — no audio files.
- **localStorage** save: unlocks, defeats, best times, win/loss record.
- Designed to drop into the existing **Egg Time** game later as a module.

## How a fight works (Egg Time Lv2 "cock fight" style)

When an opponent winds up, an arrow shows which way to slip. You get **one weave
per jab**: dodge the correct way and he **whiffs open** — peck him in the face
(his eyes get beaked out as the damage piles up). Pick the wrong side, duck a
hook, or freeze, and you eat the punch. Pecks only land while he's open, and
they're rate-limited, so time them. Fill the **Golden Egg** meter with clean
counters for a screen-clearing special. Drop him enough to win; get knocked down
three times and you lose — the **chick referee** counts you both out.

## Controls

**Mobile**
- Tap **left / right** side → peck left / right
- Swipe **left / right** → weave left / right
- Swipe **down** → duck / block
- Tap the **Golden Egg meter** (center-top) → special (when charged)

**Desktop**
- `A` / `←` weave left · `D` / `→` weave right · `S` / `↓` duck
- `J` peck left · `K` peck right · `Space` Golden Egg special

## The Pecking Order (opponents)

| #  | Opponent       | Egg Time art          | Teaches                                   |
| -- | -------------- | --------------------- | ----------------------------------------- |
| 1  | **Rat**        | suited narc           | Tutorial — weaving and pecking            |
| 2  | **Fink**       | suited narc           | Reading left/right wind-ups               |
| 3  | **Narc**       | suited narc           | Combo strings; don't panic-weave          |
| 4  | **Snitch**     | suited narc           | Patience — punishes premature pecks        |
| 5  | **Tattler**    | big narc              | Waiting for the opening                    |
| 6  | **GBS Agent**  | Lv6 riot trooper      | Fake wind-ups — real vs. bluff            |
| 7  | **GBS Leader** | Lv7 fat officer       | Precise timing to counter a charge        |
| 8  | **Todd**       | shirtless brawler     | Final boss — everything, multiple phases  |

Supporting cast: a dense crowd of **hens and pigs**, a little **chick** referee,
and **Coach Hamhock** the **pig** corner-man.

## Run locally

ES modules need to be served over HTTP (not `file://`):

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Publish (GitHub Pages)

Push to `main`; in **Settings → Pages** set **Deploy from a branch → main /
(root)**. It's all static files — no build or workflow. A per-load cache-busting
token (`?v=Date.now()`) makes new builds appear immediately, even though Pages
caches for 10 minutes.

## Embedding in Egg Time

The game mounts its whole UI into one container and exposes:

```js
window.CockRing = { start(options), stop(), resetProgress(), getProgress() };
CockRing.start({ containerId: "app", startOpponent: "rat",
                 onWin: ({opponent, timeMs})=>{}, onLose: ({opponent})=>{}, onExit: ()=>{} });
```

Set `window.COCK_RING_NO_AUTOSTART = true` before loading `src/main.js`, then call
`CockRing.start({ containerId, ... })` from the host.

## Project layout

```txt
cock-ring/
  index.html        mount point + cache-busting bootstrap
  style.css         overlays, level menu, HUD chrome
  README.md  CLAUDE.md  LICENSE (MIT)
  src/
    main.js  game.js  input.js  renderer.js
    fightEngine.js  player.js  opponents.js  audio.js  progression.js
```

See **CLAUDE.md** for architecture, cache-busting/versioning, the deploy flow,
the headless test approach, and the asset/IP rules.

## Legal

All code and assets here are **original** or the author's **own** work, drawn
with canvas primitives. This game is **not affiliated with, endorsed by, or
derived from** Nintendo or any other company, and contains **no** third-party
sprites, music, ROM code, reverse-engineered code, or other copyrighted assets.
Genre/mechanic "inspirations" are creative homage only; the implementation is
independent. Licensed under the [MIT License](LICENSE).
