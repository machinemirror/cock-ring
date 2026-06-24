// The player's rooster, "Little Cock". Pure state + a tiny timed state machine.
// The fight engine asks the player what defensive state it's in at impact and
// tells the player when it gets hit; the player owns its own timers and stamina.

export const PLAYER = {
  MAX_HEALTH: 100,
  MAX_STAMINA: 100,
  MAX_EGG: 100,
  DODGE_MS: 380,    // how long a dodge keeps you out of harm's way
  DUCK_MS: 440,
  PECK_MS: 200,
  HIT_MS: 480,
  STUN_MS: 900,
  GETUP_MS: 1400,
  PECK_COST: 14,
  STAMINA_REGEN: 26, // per second
  LOW_STAMINA: 28,   // below this, pecks are weak
  KNOCKDOWNS_TO_LOSE: 3,
};

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.health = PLAYER.MAX_HEALTH;
    this.stamina = PLAYER.MAX_STAMINA;
    this.egg = 0;
    this.knockdowns = 0;
    this.state = "idle";       // idle|dodge-left|dodge-right|duck|peck-left|peck-right|hit|stunned|down|getup
    this.stateTimer = 0;       // ms remaining in a transient state
    this.lastPeckSide = "left";
  }

  _set(state, ms) {
    this.state = state;
    this.stateTimer = ms;
  }

  // Can the player start a new action right now?
  canAct() {
    return this.state !== "hit" && this.state !== "stunned" &&
           this.state !== "down" && this.state !== "getup";
  }

  isDefending() {
    return this.state === "dodge-left" || this.state === "dodge-right" || this.state === "duck";
  }

  dodge(dir) {
    if (!this.canAct()) return false;
    this._set(dir === "left" ? "dodge-left" : "dodge-right", PLAYER.DODGE_MS);
    return true;
  }

  duck() {
    if (!this.canAct()) return false;
    this._set("duck", PLAYER.DUCK_MS);
    return true;
  }

  // Returns a damage multiplier (weak when low on stamina), or 0 if the peck
  // can't be thrown at all.
  peck(side) {
    if (!this.canAct()) return 0;
    if (this.stamina < 6) return 0;
    this.lastPeckSide = side;
    this._set(side === "left" ? "peck-left" : "peck-right", PLAYER.PECK_MS);
    const factor = this.stamina < PLAYER.LOW_STAMINA ? 0.45 : 1;
    this.stamina = Math.max(0, this.stamina - PLAYER.PECK_COST);
    return factor;
  }

  hasEgg() {
    return this.egg >= PLAYER.MAX_EGG;
  }

  addEgg(amount) {
    this.egg = Math.min(PLAYER.MAX_EGG, this.egg + amount);
  }

  spendEgg() {
    this.egg = 0;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.knockdowns += 1;
      this._set("down", 0); // engine drives the count; stays down until told
      return "down";
    }
    // Heavy hits stun; light hits just stagger.
    this._set(amount >= 11 ? "stunned" : "hit", amount >= 11 ? PLAYER.STUN_MS : PLAYER.HIT_MS);
    return "hit";
  }

  getUp() {
    // Recover with reduced health after a knockdown.
    this.health = Math.round(PLAYER.MAX_HEALTH * 0.5);
    this.stamina = PLAYER.MAX_STAMINA;
    this._set("getup", PLAYER.GETUP_MS);
  }

  isOutOfFight() {
    return this.knockdowns >= PLAYER.KNOCKDOWNS_TO_LOSE;
  }

  update(dt) {
    // Stamina always recovers (slower while acting feels fine — kept simple).
    this.stamina = Math.min(PLAYER.MAX_STAMINA, this.stamina + (PLAYER.STAMINA_REGEN * dt) / 1000);

    if (this.state === "down") return; // engine controls exit from knockdown
    if (this.stateTimer > 0) {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this._set("idle", 0);
    }
  }
}
