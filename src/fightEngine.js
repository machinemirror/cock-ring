// ============================================================================
// FIGHT STATE MACHINE
// ============================================================================
// The opponent is driven by a small state machine. The player acts through
// playerPeck / playerSpecial / (dodging happens on the Player object directly).
//
// Opponent states and the flow between them:
//
//   intro  → idle                              bell, then start fighting
//   idle   → tell        (after idleDelay)     pick an attack, begin wind-up
//   tell   → strike|whiff (at end of tell)     IMPACT: did the player evade?
//              ├ evaded → whiff  (counter window open) → recover → idle
//              └ hit    → strike (punch lands) → recover → idle
//   (combo) recover → tell again if combo not finished
//   any    → hurt        when the player lands damage  → idle / down
//   down   → count       referee counts        → getup → idle  (or KO)
//   ko / victory / defeat are terminal-ish (engine.result is set)
//
// "Evade" is judged at the instant of impact: the player must currently be in
// the correct dodge/duck state. That makes timing the dodge the core skill.
// ============================================================================

const { PLAYER } = await import(`./player.js?v=${globalThis.__CRV || ""}`);

const COUNT_STEP_MS = 700;   // referee count cadence
const COUNT_TO = 3;          // counts before getting up / KO call
const STRIKE_MS = 220;       // how long the "punch landed/whiffed" pose shows
const HURT_MS = 260;
const WEAKSPOT_MS = 900;     // Tattler/weak-spot opening duration
const FAKE_PAUSE_MS = 260;   // gap after a feint before the real attack

const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class FightEngine {
  constructor(config, player, audio, callbacks = {}) {
    this.cfg = config;
    this.player = player;
    this.audio = audio;
    this.cb = callbacks; // onWin, onLose, onEvent(name)

    this.opp = {
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      knockdowns: 0,
      phase: 1,
      state: "intro",
      timer: 900,
      attack: null,        // current attack descriptor
      committed: false,    // Lv2-style: one dodge attempt per jab
      lastHurt: 0,         // ms since hurt flash, for renderer
      shakeUntil: 0,
    };
    this.peckCd = 0;         // rate-limit pecks during an opening (no mashing)

    this.comboLeft = 0;
    this.weakSpotTimer = 0;  // >0 while a weak-spot opening is active
    this.countValue = 0;
    this.countTimer = 0;
    this.countingPlayer = false; // is the ref counting over the player?
    this.fightTime = 0;
    this.elapsed = 0;        // total ms, for renderer animation
    this.result = null;      // 'win' | 'lose'
    this.banner = null;      // {text, until} transient on-canvas message
    this.fxFlash = 0;        // screen flash strength 0..1
    this.lens = [];          // blood splattered on the "camera lens" (screen space)
  }

  // Splatter blood across the lens (Egg Time Lv2 cock-fight style). Heavier on
  // counters; each splat fades over a few seconds.
  addLensBlood(n) {
    for (let i = 0; i < n; i++) {
      this.lens.push({
        x: 60 + Math.random() * 420,
        y: 120 + Math.random() * 620,
        r: 8 + Math.random() * 26,
        a: 0.85,
        drip: Math.random() < 0.5 ? 12 + Math.random() * 40 : 0,
      });
    }
    if (this.lens.length > 60) this.lens.splice(0, this.lens.length - 60);
  }

  get weakSpotActive() {
    return this.weakSpotTimer > 0;
  }

  event(name) {
    if (this.cb.onEvent) this.cb.onEvent(name);
  }

  setBanner(text, ms = 900) {
    this.banner = { text, until: this.elapsed + ms };
  }

  // -------------------------------------------------------------------------
  // Attack generation — reads opponent config flags.
  // -------------------------------------------------------------------------
  buildAttack({ fake = false, charge = false } = {}) {
    const c = this.cfg;
    const duckable = Math.random() < c.duckChance;
    const dir = pick(["left", "right"]);
    // Charge attacks wind up much longer and hit far harder; phase scaling on
    // the final boss tightens timing and bumps damage.
    const phaseSpeed = 1 - (this.opp.phase - 1) * 0.12;
    const tell = charge
      ? rand(c.tellMs[1] * 1.4, c.tellMs[1] * 1.8) * phaseSpeed
      : rand(c.tellMs[0], c.tellMs[1]) * phaseSpeed;
    return {
      dir,
      duckable,
      fake,
      charge,
      tellMs: tell,
      tellLeft: tell,
      // Player must dodge AWAY from the incoming hook (a left hook → dodge right),
      // unless duckable. We store the required defensive state.
      requiredDefense: duckable ? "duck" : (dir === "left" ? "dodge-right" : "dodge-left"),
      damage: (charge ? c.damage * 1.8 : c.damage) + (this.opp.phase - 1) * 2,
    };
  }

  startAttackChain() {
    const c = this.cfg;
    // Decide the upcoming attack's nature.
    const wantCharge = c.charge && Math.random() < 0.3;
    const wantFake = c.fakeChance > 0 && Math.random() < c.fakeChance;
    this.comboLeft = c.comboLength > 1 ? c.comboLength : 1;
    this.opp.attack = this.buildAttack({ fake: wantFake && !wantCharge, charge: wantCharge });
    this.opp.state = "tell";
    this.opp.committed = false;              // fresh jab — one weave allowed
    this.opp.timer = this.opp.attack.tellMs; // drive the wind-up countdown
    if (this.opp.attack.charge) this.setBanner("CHARGE!", 700);
  }

  scheduleIdle() {
    const c = this.cfg;
    const speed = 1 - (this.opp.phase - 1) * 0.15;
    this.opp.state = "idle";
    this.opp.timer = rand(c.idleDelay[0], c.idleDelay[1]) * speed;
    this.opp.attack = null;
  }

  // -------------------------------------------------------------------------
  // Impact resolution at the end of a tell.
  // -------------------------------------------------------------------------
  resolveImpact() {
    const a = this.opp.attack;
    if (a.fake) {
      // Feint: no strike. Brief pause, then a real attack follows. Biting on
      // the fake (dodging) just wastes the player's dodge window.
      this.event("fake");
      this.opp.attack = this.buildAttack({ charge: false });
      this.opp.attack.fake = false;
      this.opp.state = "feint";
      this.opp.timer = FAKE_PAUSE_MS;
      return;
    }

    // A successful weave already moved us out of "tell" (see _tryEvade); reaching
    // here means the player mis-read or never committed — the punch lands.
    this.landHitOnPlayer(a);
  }

  // -------------------------------------------------------------------------
  // Player defense — Lv2 cock-fight style: you COMMIT a weave on the first
  // input of a jab. Weave to the safe side and he whiffs (opening you can peck);
  // pick wrong (or duck a hook) and you eat it — no second chance this jab.
  // -------------------------------------------------------------------------
  playerDodge(dir) {
    if (this.result || !this.player.canAct()) return;
    this.player.dodge(dir);
    this._tryEvade(dir === "left" ? "dodge-left" : "dodge-right");
  }

  playerDuck() {
    if (this.result || !this.player.canAct()) return;
    this.player.duck();
    this._tryEvade("duck");
  }

  _tryEvade(defense) {
    const o = this.opp;
    if (o.state !== "tell") return;      // only a live wind-up can be weaved
    if (o.committed) return;             // one attempt per jab
    o.committed = true;
    if (o.attack && defense === o.attack.requiredDefense) {
      this.audio.dodge();
      this.event("evade");
      this.openCounterWindow();          // he's open — peck him now
    } else {
      this.audio.block();                // wrong read — the punch will land
    }
  }

  openCounterWindow() {
    this.opp.state = "whiff";
    this.opp.timer = this.cfg.counterWindowMs;
    // Slipping a punch also briefly exposes a weak-spot opponent's soft spot.
    if (this.cfg.weakSpot) this.weakSpotTimer = WEAKSPOT_MS;
  }

  landHitOnPlayer(a) {
    this.opp.state = "strike";
    this.opp.timer = STRIKE_MS;
    this.audio.hit();
    this.fxFlash = 1;
    this.opp.shakeUntil = this.elapsed + 180;
    const outcome = this.player.takeDamage(a.damage);
    this.event("player-hit");
    if (outcome === "down") this.beginCount(true);
  }

  // -------------------------------------------------------------------------
  // Player offense.
  // -------------------------------------------------------------------------
  playerPeck(side) {
    if (this.result) return;
    if (!this.player.canAct()) return;
    if (this.peckCd > 0) return;          // no mashing through an opening
    const factor = this.player.peck(side);
    if (factor === 0) return;             // out of stamina
    this.peckCd = 170;
    this.audio.peck();

    const s = this.opp.state;

    // He's OPEN — beak him in the face (the only place a peck deals damage).
    if (s === "whiff") {
      this.audio.counter();
      this.player.addEgg(24);
      this.damageOpponent(Math.round((this.cfg.damage * 1.4 + 5) * factor), true);
      return;
    }

    // Pecking during a wind-up is a gamble.
    if (s === "tell") {
      if (this.cfg.charge && this.opp.attack && this.opp.attack.charge &&
          this.opp.attack.tellLeft < this.opp.attack.tellMs * 0.4) {
        // Precise interrupt of a charge: huge counter, cancels the attack.
        this.audio.counter();
        this.player.addEgg(32);
        this.damageOpponent(Math.round((this.cfg.damage * 2 + 8) * factor), true);
        this.scheduleIdle();
        this.setBanner("PERFECT!", 800);
        return;
      }
      if (this.cfg.punishesMashing) {
        // Snitch / Todd punish the over-eager: the jab they were winding lands.
        this.audio.hit();
        this.fxFlash = 0.8;
        const outcome = this.player.takeDamage(Math.round(this.cfg.damage * 0.8));
        this.event("punished");
        this.setBanner("PUNISHED!", 700);
        if (outcome === "down") this.beginCount(true);
        else this.scheduleIdle();
        return;
      }
      this.audio.block();
      return;
    }

    // idle / recover / strike / hurt — a wasted jab, no damage.
    this.audio.block();
  }

  playerSpecial() {
    if (this.result) return;
    if (!this.player.hasEgg() || !this.player.canAct()) return;
    this.player.spendEgg();
    this.player._set("peck-right", PLAYER.PECK_MS);
    this.audio.special();
    this.fxFlash = 1;
    this.setBanner("GOLDEN EGG!", 1000);
    this.damageOpponent(38, true); // ignores armor/blocks
  }

  damageOpponent(amount, fromCounter) {
    this.opp.health = Math.max(0, this.opp.health - amount);
    this.opp.lastHurt = this.elapsed;
    this.opp.shakeUntil = this.elapsed + 140;
    this.addLensBlood(fromCounter ? 5 : 2);
    this.event("opponent-hit");
    if (this.opp.health <= 0) {
      this.knockOpponentDown();
    } else {
      this.opp.state = "hurt";
      this.opp.timer = HURT_MS;
    }
  }

  knockOpponentDown() {
    this.opp.knockdowns += 1;
    this.audio.knockdown();
    this.event("knockdown");
    if (this.opp.knockdowns >= this.cfg.knockdownsToWin) {
      this.opp.state = "ko";
      this.opp.timer = 1600;
      this.win();
    } else {
      this.beginCount(false);
    }
  }

  // -------------------------------------------------------------------------
  // Referee count (used for both fighters).
  // -------------------------------------------------------------------------
  beginCount(overPlayer) {
    this.countingPlayer = overPlayer;
    this.countValue = 0;
    this.countTimer = COUNT_STEP_MS;
    this.opp.state = overPlayer ? "watch" : "down";
    if (!overPlayer) this.opp.timer = 0;
  }

  // -------------------------------------------------------------------------
  // Main update.
  // -------------------------------------------------------------------------
  update(dt) {
    this.elapsed += dt;
    if (this.fxFlash > 0) this.fxFlash = Math.max(0, this.fxFlash - dt / 220);
    if (this.peckCd > 0) this.peckCd = Math.max(0, this.peckCd - dt);
    if (this.weakSpotTimer > 0) this.weakSpotTimer -= dt;
    if (this.lens.length) {
      for (const l of this.lens) l.a -= dt / 4000;
      this.lens = this.lens.filter((l) => l.a > 0);
    }

    if (this.result === "win" || this.result === "lose") {
      // Let terminal poses animate; the game layer handles screen transition.
      this.player.update(dt);
      if (this.opp.timer > 0) this.opp.timer -= dt;
      return;
    }

    // Referee counting takes over both fighters.
    if (this.countTimer > 0) {
      this.player.update(dt);
      this.countTimer -= dt;
      if (this.countTimer <= 0) {
        this.countValue += 1;
        this.audio.count();
        if (this.countValue >= COUNT_TO) {
          this.endCount();
        } else {
          this.countTimer = COUNT_STEP_MS;
        }
      }
      return;
    }

    this.fightTime += dt;
    this.player.update(dt);

    const o = this.opp;
    if (o.timer > 0) o.timer -= dt;

    switch (o.state) {
      case "intro":
        if (o.timer <= 0) { this.audio.bell(); this.scheduleIdle(); }
        break;

      case "idle":
        if (o.timer <= 0) this.startAttackChain();
        break;

      case "tell":
        if (o.attack) o.attack.tellLeft = o.timer;
        if (o.timer <= 0) this.resolveImpact();
        break;

      case "feint":
        if (o.timer <= 0) { o.state = "tell"; o.committed = false; o.timer = o.attack.tellMs; o.attack.tellLeft = o.attack.tellMs; }
        break;

      case "strike":
      case "whiff":
        if (o.timer <= 0) this.afterAttack();
        break;

      case "hurt":
        if (o.timer <= 0) this.scheduleIdle();
        break;

      case "getup":
        if (o.timer <= 0) this.scheduleIdle();
        break;

      default:
        break;
    }
  }

  afterAttack() {
    this.opp.state = "recover";
    this.comboLeft -= 1;
    if (this.comboLeft > 0) {
      // Continue a combo string after a short beat — fresh weave allowed.
      this.opp.attack = this.buildAttack();
      this.opp.state = "tell";
      this.opp.committed = false;
      this.opp.timer = this.opp.attack.tellMs;
    } else {
      this.scheduleIdle();
    }
  }

  endCount() {
    this.countTimer = 0;
    if (this.countingPlayer) {
      if (this.player.isOutOfFight()) {
        this.lose();
      } else {
        this.player.getUp();
        this.scheduleIdle();
      }
    } else {
      // Opponent gets back up with reduced health; final boss ramps a phase.
      const frac = 0.7;
      this.opp.health = Math.round(this.opp.maxHealth * frac);
      if (this.cfg.phases > 1 && this.opp.phase < this.cfg.phases) {
        this.opp.phase += 1;
        this.setBanner("PHASE " + this.opp.phase + "!", 1100);
      }
      this.opp.state = "getup";
      this.opp.timer = 900; // getup case returns to idle when this elapses
    }
  }

  win() {
    if (this.result) return;
    this.result = "win";
    this.audio.win();
    this.setBanner("K.O.!", 2000);
    if (this.cb.onWin) this.cb.onWin(this.fightTime);
  }

  lose() {
    if (this.result) return;
    this.result = "lose";
    this.audio.lose();
    this.setBanner("DOWN!", 2000);
    if (this.cb.onLose) this.cb.onLose();
  }
}
