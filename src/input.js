// Touch + mouse + keyboard input. Translates raw gestures into game intents and
// fires callbacks. Built to be forgiving on mobile: generous swipe distance,
// short time window, large invisible tap zones (no on-screen buttons to miss).
const SWIPE_MIN_DIST = 26;   // px before a drag counts as a swipe
const SWIPE_MAX_TIME = 600;  // ms; slower drags still count as long as they move
const SPECIAL_ZONE = { xMin: 0.34, xMax: 0.66, yMin: 0.0, yMax: 0.18 }; // egg meter at top-center

export class InputHandler {
  constructor(target, callbacks) {
    this.target = target;
    this.cb = callbacks; // { onDodge(dir), onDuck(), onPeck(side), onSpecial() }
    this.enabled = false;
    this.active = null; // pointer in progress

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onKey = this._onKey.bind(this);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    const t = this.target;
    t.addEventListener("pointerdown", this._onDown, { passive: false });
    t.addEventListener("pointermove", this._onMove, { passive: false });
    t.addEventListener("pointerup", this._onUp, { passive: false });
    t.addEventListener("pointercancel", this._onUp, { passive: false });
    window.addEventListener("keydown", this._onKey);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    const t = this.target;
    t.removeEventListener("pointerdown", this._onDown);
    t.removeEventListener("pointermove", this._onMove);
    t.removeEventListener("pointerup", this._onUp);
    t.removeEventListener("pointercancel", this._onUp);
    window.removeEventListener("keydown", this._onKey);
    this.active = null;
  }

  _rectFrac(e) {
    const r = this.target.getBoundingClientRect();
    return {
      fx: (e.clientX - r.left) / r.width,
      fy: (e.clientY - r.top) / r.height,
    };
  }

  _onDown(e) {
    e.preventDefault();
    const { fx, fy } = this._rectFrac(e);
    this.active = { x: e.clientX, y: e.clientY, fx, fy, t: performance.now(), swiped: false };
  }

  _onMove(e) {
    if (!this.active || this.active.swiped) return;
    e.preventDefault();
    const dx = e.clientX - this.active.x;
    const dy = e.clientY - this.active.y;
    if (Math.hypot(dx, dy) < SWIPE_MIN_DIST) return;
    // Resolve direction by dominant axis as soon as the threshold is crossed —
    // feels snappier than waiting for pointer-up.
    this.active.swiped = true;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.cb.onDodge(dx < 0 ? "left" : "right");
    } else if (dy > 0) {
      this.cb.onDuck();
    } else {
      // Up-swipe is unused; treat as a dodge in the horizontal lean if any.
      if (Math.abs(dx) > SWIPE_MIN_DIST / 2) this.cb.onDodge(dx < 0 ? "left" : "right");
      else this.active.swiped = false;
    }
  }

  _onUp(e) {
    if (!this.active) return;
    e.preventDefault();
    const a = this.active;
    this.active = null;
    if (a.swiped) return;
    if (performance.now() - a.t > SWIPE_MAX_TIME) return;
    // A clean tap. Center-top egg meter = special; otherwise left/right peck.
    if (a.fx >= SPECIAL_ZONE.xMin && a.fx <= SPECIAL_ZONE.xMax &&
        a.fy >= SPECIAL_ZONE.yMin && a.fy <= SPECIAL_ZONE.yMax) {
      this.cb.onSpecial();
      return;
    }
    this.cb.onPeck(a.fx < 0.5 ? "left" : "right");
  }

  _onKey(e) {
    if (e.repeat) return;
    switch (e.key.toLowerCase()) {
      case "a": case "arrowleft": this.cb.onDodge("left"); break;
      case "d": case "arrowright": this.cb.onDodge("right"); break;
      case "s": case "arrowdown": this.cb.onDuck(); break;
      case "j": this.cb.onPeck("left"); break;
      case "k": this.cb.onPeck("right"); break;
      case " ": case "spacebar": this.cb.onSpecial(); e.preventDefault(); break;
      default: return;
    }
  }
}
