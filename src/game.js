// Game orchestration: builds the UI, manages screens, runs the loop, and wires
// input to the fight engine. The whole DOM is created here (buildDOM) so the
// game can be mounted into any container — standalone or embedded in Egg Time.

// Versioned dynamic imports so a cached page still pulls fresh code (see index.html).
const V = globalThis.__CRV || "";
const { Renderer, LOGICAL_W, LOGICAL_H } = await import(`./renderer.js?v=${V}`);
const { InputHandler } = await import(`./input.js?v=${V}`);
const { AudioBus } = await import(`./audio.js?v=${V}`);
const { Player } = await import(`./player.js?v=${V}`);
const { FightEngine } = await import(`./fightEngine.js?v=${V}`);
const { Progression } = await import(`./progression.js?v=${V}`);
const { OPPONENTS, opponentById } = await import(`./opponents.js?v=${V}`);

const FIGHTER_NAME = "Large Cock";
const VERSION = "0.2.5";

const TEMPLATE = `
  <div class="cr-stage" id="cr-stage">
    <canvas id="cr-canvas"></canvas>

    <div class="cr-overlay" id="cr-screen-start">
      <h1 class="cr-title">COCK RING</h1>
      <p class="cr-subtitle">Are you a featherweight champion?</p>
      <button class="cr-btn" id="cr-play">FIGHT</button>
      <button class="cr-btn secondary" id="cr-reset">Reset Progress</button>
      <p class="cr-build">beta build ${VERSION}</p>
    </div>

    <div class="cr-overlay hidden" id="cr-screen-select">
      <h2 class="cr-h2">PECKING ORDER</h2>
      <p class="cr-tag">choose your opponent</p>
      <div class="cr-levels" id="cr-roster"></div>
      <p class="cr-stats" id="cr-record"></p>
      <button class="cr-btn secondary" id="cr-back-start">Back to Title</button>
    </div>

    <div class="cr-overlay hidden" id="cr-screen-tutorial">
      <h2 class="cr-h2" id="cr-tut-name">Rat</h2>
      <div class="cr-coach">
        <canvas id="cr-coach-canvas" width="72" height="72"></canvas>
        <div><span class="who">Coach Hamhock:</span> <span id="cr-tut-tip"></span></div>
      </div>
      <button class="cr-btn" id="cr-begin">FIGHT!</button>
      <button class="cr-btn secondary" id="cr-back-select">Back</button>
    </div>

    <div class="cr-overlay hidden" id="cr-screen-result">
      <h2 class="cr-title" id="cr-result-title" style="font-size:46px">K.O.!</h2>
      <p class="cr-text" id="cr-result-text"></p>
      <button class="cr-btn" id="cr-result-next">Continue</button>
      <button class="cr-btn secondary" id="cr-result-select">Pecking Order</button>
    </div>
  </div>
`;

export class Game {
  constructor() {
    this.root = null;
    this.canvas = null;
    this.ctx = null;
    this.renderer = null;
    this.input = null;
    this.audio = new AudioBus();
    this.player = new Player();
    this.engine = null;

    this.screen = "start";      // start|select|tutorial|fight|pause|result
    this.selectedId = null;
    this.callbacks = {};        // onWin/onLose/onExit from embed options

    this.raf = null;
    this.lastTs = 0;
    this.resultPending = null;  // 'win' | 'lose' once the engine settles

    this._loop = this._loop.bind(this);
    this._onResize = this._onResize.bind(this);
  }

  // ---- Mount / unmount ----
  mount(container, options = {}) {
    this.root = container;
    this.root.classList.add("cr-root");
    this.root.innerHTML = TEMPLATE;
    this.callbacks = {
      onWin: options.onWin,
      onLose: options.onLose,
      onExit: options.onExit,
    };

    this.canvas = this.root.querySelector("#cr-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.renderer = new Renderer(this.ctx);

    this.input = new InputHandler(this.canvas, {
      onDodge: (dir) => this._act(() => this.engine && this.engine.playerDodge(dir)),
      onDuck: () => this._act(() => this.engine && this.engine.playerDuck()),
      onPeck: (side) => this._act(() => this.engine && this.engine.playerPeck(side)),
      onSpecial: () => this._act(() => this.engine && this.engine.playerSpecial()),
    });

    this._wireButtons();
    this._buildRoster();
    window.addEventListener("resize", this._onResize);
    this._onResize();

    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this._loop);

    if (options.startOpponent && opponentById(options.startOpponent)) {
      this.selectedId = options.startOpponent;
      this._showTutorial();
    } else {
      this._show("start");
    }
  }

  unmount() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    if (this.input) this.input.disable();
    window.removeEventListener("resize", this._onResize);
    if (this.root) this.root.innerHTML = "";
  }

  // Only let fight gestures through while actually fighting.
  _act(fn) {
    if (this.screen !== "fight" || !this.engine || this.engine.result) return;
    this.audio.resume();
    fn();
  }

  // ---- Screen management ----
  _show(screen) {
    this.screen = screen;
    const map = {
      start: "cr-screen-start",
      select: "cr-screen-select",
      tutorial: "cr-screen-tutorial",
      result: "cr-screen-result",
    };
    for (const id of Object.values(map)) {
      this.root.querySelector("#" + id).classList.add("hidden");
    }
    const visible = map[screen];
    if (visible) this.root.querySelector("#" + visible).classList.remove("hidden");

    if (screen === "fight") this.input.enable();
    else this.input.disable();
    if (screen === "select") this._refreshRoster();
  }

  _wireButtons() {
    const q = (id) => this.root.querySelector(id);
    q("#cr-play").onclick = () => { this.audio.resume(); this._show("select"); };
    q("#cr-reset").onclick = () => { Progression.reset(); this._refreshRoster(); this._buildRoster(); };
    q("#cr-back-start").onclick = () => this._show("start");
    q("#cr-back-select").onclick = () => this._show("select");
    q("#cr-begin").onclick = () => this._startFight();
    q("#cr-result-next").onclick = () => this._afterResult();
    q("#cr-result-select").onclick = () => this._show("select");
  }

  _buildRoster() {
    const list = this.root.querySelector("#cr-roster");
    list.innerHTML = "";
    OPPONENTS.forEach((o, i) => {
      const btn = document.createElement("button");
      btn.className = "cr-level";
      btn.dataset.id = o.id;
      btn.style.setProperty("--c", o.palette.body); // per-opponent tint stripe
      btn.innerHTML = `<span class="t">Bout ${i + 1} · ${o.name}</span><small></small>`;
      btn.onclick = () => {
        if (btn.classList.contains("locked")) return;
        this.selectedId = o.id;
        this._showTutorial();
      };
      list.appendChild(btn);
    });
    this._refreshRoster();
  }

  _refreshRoster() {
    const state = Progression.get();
    this.root.querySelectorAll(".cr-level").forEach((btn, i) => {
      const id = btn.dataset.id;
      const unlocked = Progression.isUnlocked(id);
      const beaten = Progression.isDefeated(id);
      btn.classList.toggle("locked", !unlocked);
      btn.classList.toggle("beaten", beaten);
      const sub = btn.querySelector("small");
      if (!unlocked) {
        const prev = OPPONENTS[i - 1];
        sub.textContent = prev ? `🔒 beat ${prev.name} first` : "🔒 Locked";
      } else if (beaten) {
        sub.textContent = `✔ Defeated · best ${this._fmt(state.bestTimes[id])}`;
      } else {
        sub.textContent = "▶ Fight";
      }
    });
    const rec = this.root.querySelector("#cr-record");
    if (rec) rec.textContent = `Wins: ${state.wins}   Losses: ${state.losses}`;
  }

  _showTutorial() {
    const cfg = opponentById(this.selectedId);
    this.root.querySelector("#cr-tut-name").textContent = `Next up: ${cfg.name}`;
    this.root.querySelector("#cr-tut-tip").textContent = cfg.personality;
    this._drawCoach();
    this._show("tutorial");
  }

  // Draw Coach Hamhock (Egg Time pig) into the tutorial bubble's mini-canvas.
  _drawCoach() {
    const cc = this.root.querySelector("#cr-coach-canvas");
    if (!cc) return;
    const cx2 = cc.getContext("2d");
    cx2.clearRect(0, 0, cc.width, cc.height);
    if (!this._coachR) this._coachR = new Renderer(cx2);
    this._coachR.ctx = cx2;
    this._coachR.drawCoachPig(26, 60, 1.25, 0);
  }

  _startFight() {
    const cfg = opponentById(this.selectedId);
    Progression.markTutorialShown();
    this.player.reset();
    this.resultPending = null;
    this.engine = new FightEngine(cfg, this.player, this.audio, {
      onWin: (timeMs) => this._onWin(timeMs),
      onLose: () => this._onLose(),
    });
    this._show("fight");
  }

  _onWin(timeMs) {
    Progression.recordWin(this.selectedId, timeMs);
    this.resultPending = { type: "win", time: timeMs };
    if (this.callbacks.onWin) this.callbacks.onWin({ opponent: this.selectedId, timeMs });
  }

  _onLose() {
    Progression.recordLoss(this.selectedId);
    this.resultPending = { type: "lose" };
    if (this.callbacks.onLose) this.callbacks.onLose({ opponent: this.selectedId });
  }

  // The engine plays its KO/down animation for a beat before we show the screen.
  _settleResult() {
    if (!this.resultPending) return;
    if (this.engine && this.engine.opp.timer > 0) return; // let the pose finish
    const r = this.resultPending;
    const cfg = opponentById(this.selectedId);
    const titleEl = this.root.querySelector("#cr-result-title");
    const textEl = this.root.querySelector("#cr-result-text");
    const nextBtn = this.root.querySelector("#cr-result-next");
    if (r.type === "win") {
      const idx = OPPONENTS.findIndex((o) => o.id === this.selectedId);
      const last = idx === OPPONENTS.length - 1;
      titleEl.textContent = last ? "CHAMPION!" : "WINNER!";
      textEl.textContent = last
        ? `You cleaned out the whole Pecking Order in this fight at ${this._fmt(r.time)}. ${FIGHTER_NAME} is the champ!`
        : `You knocked out ${cfg.name} in ${this._fmt(r.time)}. The next contender is unlocked.`;
      nextBtn.textContent = last ? "Take a Bow" : "Next Fight";
    } else {
      titleEl.textContent = "DOWN!";
      textEl.textContent = `${cfg.name} laid your ${FIGHTER_NAME} out on the mat...`;
      nextBtn.textContent = "Rematch";
    }
    this.engine = null;
    this.resultPending = "shown";
    this._show("result");
  }

  _afterResult() {
    // Win → advance to next unlocked; Lose → rematch same opponent.
    const idx = OPPONENTS.findIndex((o) => o.id === this.selectedId);
    const next = OPPONENTS[idx + 1];
    if (this.root.querySelector("#cr-result-title").textContent !== "DOWN!" &&
        next && Progression.isUnlocked(next.id)) {
      this.selectedId = next.id;
      this._showTutorial();
    } else if (this.root.querySelector("#cr-result-title").textContent === "DOWN!") {
      this._showTutorial();
    } else {
      this._show("select");
    }
  }

  // ---- Loop ----
  _loop(ts) {
    this.raf = requestAnimationFrame(this._loop);
    let dt = ts - this.lastTs;
    this.lastTs = ts;
    if (dt > 60) dt = 60; // clamp after tab-switch / hitch

    if (this.screen === "fight" && this.engine) {
      this.engine.update(dt);
      if (this.engine.result && this.resultPending && this.resultPending !== "shown") {
        this._settleResult();
      }
    }
    this._render(ts);
  }

  _render(t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const inFight = (this.screen === "fight" || this.screen === "pause") && this.engine;
    const excite = inFight ? (this.engine.fxFlash > 0 ? 1 : 0.2) : 0.1;
    this.renderer.drawArena(t, excite);

    if (inFight) {
      const e = this.engine;
      // Is the opponent down for the count? Then Large Cock steps to the corner.
      const oppDown = e.countTimer > 0
        ? !e.countingPlayer
        : (e.opp.state === "down" || e.opp.state === "getup" || e.opp.state === "ko");
      this.renderer.drawOpponent(e);
      if (oppDown) {
        // Side profile in the left corner while the chick counts.
        this.renderer.drawPlayerCorner(this.player, e.elapsed);
      } else {
        // We're behind Large Cock: body, then his big tail feathers IN FRONT.
        this.renderer.drawPlayerBody(this.player, e.elapsed);
        this.renderer.drawPlayerTail(this.player, e.elapsed);
      }
      this.renderer.drawLensBlood(e);
      this.renderer.drawReferee(e);
      this.renderer.drawHud(e, this.player);
    } else {
      // Idle showcase rooster behind menus.
      this.renderer.drawPlayerFull(this.player, t);
    }
    ctx.restore();
  }

  // ---- Canvas sizing: fixed logical space, scaled to fit, crisp on retina ----
  _onResize() {
    const stage = this.root.querySelector("#cr-stage");
    const availW = this.root.clientWidth;
    const availH = this.root.clientHeight;
    const scale = Math.min(availW / LOGICAL_W, availH / LOGICAL_H);
    const cssW = Math.round(LOGICAL_W * scale);
    const cssH = Math.round(LOGICAL_H * scale);
    stage.style.width = cssW + "px";
    stage.style.height = cssH + "px";

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.round(LOGICAL_W * this.dpr);
    this.canvas.height = Math.round(LOGICAL_H * this.dpr);
  }

  _fmt(ms) {
    if (!ms && ms !== 0) return "—";
    const s = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${s}.${String(cs).padStart(2, "0")}s`;
  }
}
