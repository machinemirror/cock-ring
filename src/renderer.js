// Canvas renderer. Punch-Out-style presentation (big torso-up cartoon boxers
// facing the camera, bold outlines, telegraphed wind-up poses, in-ring framing)
// drawing the Egg Time cast — the narcs, the GBS agents and Todd — plus the
// player rooster "Large Cock" seen from behind, ARMLESS, striking with PECKS.
//
// All art is canvas primitives (no image assets). The character art is ported
// from the Egg Time game's own drawing routines and restyled for the ring.

export const LOGICAL_W = 540;
export const LOGICAL_H = 960;

const FLOOR_Y = LOGICAL_H * 0.78;  // ring mat line
const OPP_BASE = LOGICAL_H * 0.70; // opponent waist baseline

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.crowd = this._makeCrowd();
  }

  _makeCrowd() {
    const hens = [];
    for (let row = 0; row < 2; row++) {
      const count = 11 + row;
      for (let i = 0; i < count; i++) {
        hens.push({
          x: (i + 0.5) / count,
          row,
          phase: Math.random() * Math.PI * 2,
          blink: Math.random() * 4,
          hue: 18 + Math.random() * 26,
        });
      }
    }
    return hens;
  }

  // ---- Arena: spotlit ring (Egg Time fight-ring style) + hen crowd ----
  drawArena(t, excite = 0) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H * 0.32, 40, LOGICAL_W / 2, LOGICAL_H * 0.32, LOGICAL_H * 0.95);
    g.addColorStop(0, "#3a3550");
    g.addColorStop(1, "#0e0c18");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    this._drawCrowd(t, excite);

    // ring floor (blue), receding
    ctx.fillStyle = "#2a4f8a";
    ctx.fillRect(0, FLOOR_Y, LOGICAL_W, LOGICAL_H - FLOOR_Y);
    ctx.fillStyle = "#22427a";
    for (let x = -LOGICAL_H; x < LOGICAL_W; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x + 30, FLOOR_Y);
      ctx.lineTo(x + 30 + (LOGICAL_H - FLOOR_Y) * 0.5, LOGICAL_H);
      ctx.lineTo(x + (LOGICAL_H - FLOOR_Y) * 0.5, LOGICAL_H);
      ctx.closePath();
      ctx.fill();
    }
    // posts + ropes sit low so the fighters stand in front
    for (const px of [16, LOGICAL_W - 16]) {
      ctx.fillStyle = "#b22";
      ctx.fillRect(px - 7, FLOOR_Y - 150, 14, 150);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(px - 8, FLOOR_Y - 150, 16, 10);
    }
    ctx.strokeStyle = "#e23b6e";
    ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      const ry = FLOOR_Y - 18 - i * 40;
      ctx.beginPath();
      ctx.moveTo(16, ry);
      ctx.lineTo(LOGICAL_W - 16, ry);
      ctx.stroke();
    }
  }

  _drawCrowd(t, excite) {
    const ctx = this.ctx;
    for (const h of this.crowd) {
      const x = 16 + h.x * (LOGICAL_W - 32);
      const baseY = 150 + h.row * 46;
      const bob = Math.sin(t / 360 + h.phase) * (2 + excite * 6);
      const y = baseY - bob;
      const r = 13 - h.row * 1.5;
      ctx.fillStyle = `hsl(${h.hue}, 42%, ${52 - h.row * 6}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d8473c";
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.9, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e6a93a";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + r * 0.55, y + 1);
      ctx.lineTo(x, y + r * 0.4);
      ctx.closePath();
      ctx.fill();
      const blinkOn = ((t / 1000 + h.blink) % 4) < 0.12;
      if (!blinkOn) {
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(x - r * 0.22, y - r * 0.15, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (excite > 0.5 && Math.sin(t / 110 + h.phase) > 0.4) {
        ctx.strokeStyle = `hsl(${h.hue}, 40%, 40%)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - r, y); ctx.lineTo(x - r - 5, y - 6);
        ctx.moveTo(x + r, y); ctx.lineTo(x + r + 5, y - 6);
        ctx.stroke();
      }
    }
  }

  // ---- Pose derived from the opponent's fight state ----
  _oppPose(engine) {
    const o = engine.opp;
    const t = engine.elapsed;
    const pose = { lean: 0, drop: 0, armSide: 0, armExtend: 0, expr: "rage", down: false, ko: false, shake: 0 };
    if (t < o.shakeUntil) pose.shake = Math.sin(t / 18) * 6;

    switch (o.state) {
      case "intro": pose.expr = "rage"; pose.drop = Math.sin(t / 380) * 4; break;
      case "idle": case "recover": pose.drop = Math.sin(t / 360) * 4; break;
      case "feint": pose.lean = Math.sin(t / 55) * 8; pose.expr = "crazed"; break;
      case "tell": {
        const a = o.attack;
        const wind = a ? 1 - a.tellLeft / a.tellMs : 0;
        const dirSign = a && a.dir === "left" ? -1 : 1;
        pose.lean = (a && a.charge ? -dirSign * 22 : dirSign * 16) * wind;
        if (a && a.charge) pose.drop = -10 * wind;
        pose.armSide = dirSign;
        pose.armExtend = a && a.charge ? 0.25 * wind : 0.35 * wind;
        pose.expr = "crazed";
        break;
      }
      case "strike":
        pose.armExtend = 1;
        pose.armSide = o.attack ? (o.attack.dir === "left" ? -1 : 1) : 1;
        pose.lean = pose.armSide * 6;
        pose.expr = "rage";
        break;
      case "whiff": pose.lean = 18; pose.drop = 6; pose.expr = "dazed"; break;
      case "hurt": pose.expr = "hurt"; pose.lean = Math.sin(t / 28) * 7; break;
      case "getup": pose.drop = 16; pose.expr = "dazed"; break;
      case "down": pose.down = true; pose.expr = "dazed"; break;
      case "watch": pose.drop = Math.sin(t / 360) * 4; break;
      case "ko": pose.down = true; pose.ko = true; break;
    }
    return pose;
  }

  drawOpponent(engine) {
    const cfg = engine.cfg;
    const pose = this._oppPose(engine);
    const woundFrac = 1 - engine.opp.health / engine.opp.maxHealth;
    const cx = LOGICAL_W / 2;
    const baseY = OPP_BASE;
    const s = cfg.build === "huge" ? 2.7 : cfg.build === "stocky" ? 2.35 : 2.0;

    if (cfg.art === "todd") {
      this._drawTodd(cx, baseY, s, pose, woundFrac, engine.elapsed);
    } else {
      this._drawSuit(cx, baseY, s, this._skin(cfg), pose, woundFrac, engine.elapsed);
    }
    this._drawTell(engine);
    this._drawWeakSpot(engine);
  }

  _skin(cfg) {
    const p = cfg.palette;
    if (cfg.art === "gbs") {
      const leader = cfg.id === "gbs-leader";
      return {
        kind: "gbs",
        suit: "#1d2436", suit2: "#2c3550",
        accent: p.body, vest: "GBS",
        label: leader ? "LEADER" : "AGENT",
        labelColor: "#cdd6df",
        head: "helmet",
        glove: "#0a0d16",
      };
    }
    return {
      kind: "narc",
      suit: "#16181c", suit2: "#262a30",
      accent: p.body, tie: p.body,
      label: cfg.name.toUpperCase(),
      labelColor: "#ffd24a",
      head: "sunglasses",
      glove: "#c0271f",
    };
  }

  // ---- Suited fighter (narcs + GBS), torso-up, facing camera ----
  // Internal coords: waist at y=0, head near y=-205. Bold outlines for the
  // chunky Punch-Out look. Pose: {lean, drop, armSide, armExtend, expr, ...}
  _drawSuit(cx, baseY, s, sk, pose, woundFrac, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx + pose.shake, baseY);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 34, 92 * s * 0.5, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    if (pose.down) {
      this._drawSuitDowned(s, sk, pose.ko);
      ctx.restore();
      return;
    }

    ctx.translate(pose.lean, pose.drop);
    ctx.scale(s, s);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // trunks / legs hint
    ctx.fillStyle = "#0c0c10";
    ctx.beginPath();
    ctx.moveTo(-46, 0); ctx.lineTo(46, 0); ctx.lineTo(40, 44); ctx.lineTo(-40, 44); ctx.closePath();
    ctx.fill();

    // ---- resting back arm (far side) ----
    const restGlove = (sgn) => {
      ctx.strokeStyle = "#000"; ctx.lineWidth = 20;
      ctx.beginPath(); ctx.moveTo(sgn * 78, -120); ctx.lineTo(sgn * 104, -34); ctx.stroke();
      ctx.strokeStyle = sk.suit2; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(sgn * 78, -120); ctx.lineTo(sgn * 104, -34); ctx.stroke();
      this._glove(sgn * 104, -34, 22, sk.glove);
    };

    const punchSide = pose.armSide || 1;
    if (pose.armExtend < 0.15) {
      restGlove(-1); restGlove(1);
    } else {
      restGlove(-punchSide);
    }

    // ---- torso: broad-shouldered suit ----
    ctx.beginPath();
    ctx.moveTo(-58, 4);
    ctx.quadraticCurveTo(-72, -70, -86, -150);
    ctx.quadraticCurveTo(-50, -176, 0, -176);
    ctx.quadraticCurveTo(50, -176, 86, -150);
    ctx.quadraticCurveTo(72, -70, 58, 4);
    ctx.closePath();
    ctx.fillStyle = sk.suit;
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 5;
    ctx.stroke();

    if (sk.kind === "gbs") {
      // tac vest + lapel highlight
      ctx.fillStyle = "#11151f";
      ctx.fillRect(-44, -132, 88, 96);
      ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(-44, -132, 88, 96);
      ctx.fillStyle = sk.accent;
      ctx.fillRect(-44, -132, 10, 96);
      ctx.fillRect(34, -132, 10, 96);
    } else {
      // white shirt + tie
      ctx.fillStyle = "#f0f0f0";
      ctx.beginPath();
      ctx.moveTo(-18, -168); ctx.lineTo(18, -168); ctx.lineTo(10, -120); ctx.lineTo(-10, -120); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = sk.tie;
      ctx.beginPath();
      ctx.moveTo(-8, -156); ctx.lineTo(8, -156); ctx.lineTo(5, -86); ctx.lineTo(0, -78); ctx.lineTo(-5, -86); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#000"; ctx.lineWidth = 2.5; ctx.stroke();
    }

    // name across the chest
    const label = sk.label;
    const fs = Math.min(30, 200 / (label.length * 0.62));
    ctx.fillStyle = sk.labelColor;
    ctx.font = `900 ${fs}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, -104);
    ctx.textBaseline = "alphabetic";

    // damage marks pile up
    this._wounds(woundFrac, -150, 0);

    // ---- punching arm (toward camera) ----
    if (pose.armExtend >= 0.15) {
      const e = pose.armExtend;
      const gx = punchSide * (40 + e * 30);
      const gy = -150 + e * 150;
      ctx.strokeStyle = "#000"; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(punchSide * 78, -132); ctx.lineTo(gx, gy); ctx.stroke();
      ctx.strokeStyle = sk.suit2; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(punchSide * 78, -132); ctx.lineTo(gx, gy); ctx.stroke();
      this._glove(gx, gy, 24 + e * 22, sk.glove);
    }

    // ---- neck + head ----
    ctx.fillStyle = "#e7b48c";
    ctx.fillRect(-18, -196, 36, 30);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(-18, -196, 36, 30);

    const hy = -228, R = 38;
    ctx.fillStyle = "#e7b48c";
    ctx.beginPath();
    ctx.ellipse(0, hy, R, R + 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();

    if (sk.head === "helmet") {
      ctx.fillStyle = "#222a3a";
      ctx.beginPath(); ctx.arc(0, hy - 4, R, Math.PI, 0); ctx.fill();
      ctx.fillRect(-R, hy - 4, R * 2, 14);
      ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = "#0b0e16";
      ctx.fillRect(-R + 4, hy - 2, R * 2 - 8, 22); // visor
      ctx.fillStyle = "rgba(140,180,220,.45)";
      ctx.fillRect(-R + 10, hy + 1, 16, 8);
    } else {
      // slicked black hair
      ctx.fillStyle = "#0c0c0c";
      ctx.beginPath(); ctx.ellipse(0, hy - 12, R - 2, R * 0.7, 0, Math.PI, Math.PI * 2); ctx.fill();
    }

    this._face(sk.head, hy, R, pose.expr, t);

    ctx.restore();
  }

  _glove(x, y, r, col) {
    const ctx = this.ctx;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f3f0ea";
    ctx.fillRect(x - r * 0.5, y + r * 0.6, r, 5);
  }

  _face(head, hy, R, expr, t) {
    const ctx = this.ctx;
    const ex = 15, ey = hy - 4;
    if (head === "sunglasses" && expr !== "hurt" && expr !== "dazed") {
      ctx.fillStyle = "#000";
      ctx.fillRect(-R * 0.78, ey - 6, R * 0.7, 14);
      ctx.fillRect(R * 0.08, ey - 6, R * 0.7, 14);
      ctx.fillRect(-4, ey - 4, 8, 5);
      ctx.fillStyle = "rgba(255,255,255,.4)";
      ctx.fillRect(-R * 0.72, ey - 4, 10, 4);
      ctx.fillRect(R * 0.14, ey - 4, 10, 4);
      // scowl
      ctx.strokeStyle = "#5a1e1e"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-9, hy + 16); ctx.lineTo(9, hy + 16); ctx.stroke();
      return;
    }
    // eyes
    if (expr === "hurt" || expr === "ko") {
      ctx.strokeStyle = "#111"; ctx.lineWidth = 4; ctx.lineCap = "round";
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sgn * ex - 7, ey - 7); ctx.lineTo(sgn * ex + 7, ey + 5);
        ctx.moveTo(sgn * ex + 7, ey - 7); ctx.lineTo(sgn * ex - 7, ey + 5);
        ctx.stroke();
      }
      ctx.fillStyle = "#5a1e1e";
      ctx.beginPath(); ctx.ellipse(0, hy + 18, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (expr === "dazed") {
      ctx.strokeStyle = "#2b2118"; ctx.lineWidth = 2;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        for (let a = 0; a < 7; a += 0.3) {
          const rr = a * 1.1;
          const px = sgn * ex + Math.cos(a + t / 250) * rr;
          const py = ey + Math.sin(a + t / 250) * rr;
          a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      return;
    }
    // default / rage / crazed eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-ex, ey, 7, 0, Math.PI * 2); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
    const px = expr === "crazed" ? Math.sin(t / 70) * 2 : 0;
    ctx.fillStyle = "#2b2118";
    ctx.beginPath(); ctx.arc(-ex + px, ey + 1, 3.2, 0, Math.PI * 2); ctx.arc(ex + px, ey + 1, 3.2, 0, Math.PI * 2); ctx.fill();
    // angry brows
    ctx.strokeStyle = "#5a3a22"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-ex - 10, ey - 13); ctx.lineTo(-ex + 8, ey - 5);
    ctx.moveTo(ex + 10, ey - 13); ctx.lineTo(ex - 8, ey - 5);
    ctx.stroke();
    // gritted mouth
    ctx.fillStyle = "#5a1e1e";
    ctx.beginPath(); ctx.ellipse(0, hy + 18, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(-9, hy + 13, 18, 4);
  }

  _wounds(frac, top, bottom) {
    if (frac <= 0) return;
    const ctx = this.ctx;
    const spots = [[-40, -70], [38, -62], [-10, -40], [28, -30], [-48, -24], [14, -84], [48, -46], [-30, -8], [6, -58], [-58, -54]];
    const n = Math.min(spots.length, Math.round(frac * spots.length));
    for (let i = 0; i < n; i++) {
      const [wx, wy] = spots[i];
      ctx.fillStyle = "rgba(90,26,80,.5)";
      ctx.beginPath(); ctx.ellipse(wx, wy, 9, 7, i, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#8a0610"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(wx - 7, wy - 4 + (i % 2) * 7); ctx.lineTo(wx + 7, wy + 4 - (i % 2) * 7); ctx.stroke();
    }
  }

  _drawSuitDowned(s, sk, ko) {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(s, s);
    ctx.translate(0, 10);
    ctx.fillStyle = sk.suit;
    ctx.beginPath(); ctx.ellipse(0, 0, 96, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "#e7b48c";
    ctx.beginPath(); ctx.arc(-86, -6, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
    if (ko) {
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
      for (const dx of [-96, -76]) {
        ctx.beginPath();
        ctx.moveTo(dx - 5, -10); ctx.lineTo(dx + 5, -2);
        ctx.moveTo(dx + 5, -10); ctx.lineTo(dx - 5, -2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- Todd: beefy shirtless boxer (Egg Time torso art, ring-styled) ----
  _drawTodd(cx, baseY, s, pose, woundFrac, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx + pose.shake, baseY);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, 34, 100, 14, 0, 0, Math.PI * 2); ctx.fill();

    if (pose.down) {
      ctx.save(); ctx.scale(s, s); ctx.translate(0, 10);
      ctx.fillStyle = "#e7b48a";
      ctx.beginPath(); ctx.ellipse(0, 0, 100, 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(-90, -6, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (pose.ko) {
        ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
        for (const dx of [-100, -80]) {
          ctx.beginPath();
          ctx.moveTo(dx - 5, -10); ctx.lineTo(dx + 5, -2);
          ctx.moveTo(dx + 5, -10); ctx.lineTo(dx - 5, -2);
          ctx.stroke();
        }
      }
      ctx.restore(); ctx.restore();
      return;
    }

    ctx.translate(pose.lean, pose.drop);
    ctx.scale(s, s);
    ctx.lineJoin = "round"; ctx.lineCap = "round";

    // trunks
    ctx.fillStyle = "#7a1812";
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.lineTo(44, 46); ctx.lineTo(-44, 46); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();

    // resting arm(s)
    const restGlove = (sgn) => {
      ctx.strokeStyle = "#000"; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(sgn * 70, -120); ctx.lineTo(sgn * 100, -36); ctx.stroke();
      ctx.strokeStyle = "#e7b48a"; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(sgn * 70, -120); ctx.lineTo(sgn * 100, -36); ctx.stroke();
      this._glove(sgn * 100, -36, 22, "#c0271f");
    };
    const punchSide = pose.armSide || 1;
    if (pose.armExtend < 0.15) { restGlove(-1); restGlove(1); }
    else restGlove(-punchSide);

    // beefy bare chest
    ctx.beginPath();
    ctx.moveTo(-60, 4); ctx.lineTo(-66, -120);
    ctx.quadraticCurveTo(0, -150, 66, -120);
    ctx.lineTo(60, 4); ctx.closePath();
    ctx.fillStyle = "#e7b48a"; ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // pecs + navel
    ctx.fillStyle = "#d99f76";
    ctx.beginPath(); ctx.ellipse(-26, -86, 22, 16, 0.2, 0, Math.PI * 2); ctx.ellipse(26, -86, 22, 16, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#9a5e3a";
    ctx.beginPath(); ctx.arc(-26, -78, 3.6, 0, Math.PI * 2); ctx.arc(26, -78, 3.6, 0, Math.PI * 2); ctx.fill();

    this._wounds(woundFrac, -120, 0);

    // punching arm
    if (pose.armExtend >= 0.15) {
      const e = pose.armExtend;
      const gx = punchSide * (36 + e * 30);
      const gy = -130 + e * 140;
      ctx.strokeStyle = "#000"; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(punchSide * 70, -120); ctx.lineTo(gx, gy); ctx.stroke();
      ctx.strokeStyle = "#e7b48a"; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(punchSide * 70, -120); ctx.lineTo(gx, gy); ctx.stroke();
      this._glove(gx, gy, 24 + e * 22, "#c0271f");
    }

    // neck + bald head
    ctx.fillStyle = "#e7b48a";
    ctx.fillRect(-16, -150, 32, 32);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(-16, -150, 32, 32);
    const hy = -188, R = 40;
    ctx.fillStyle = "#e7b48a";
    ctx.beginPath(); ctx.arc(0, hy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // side tufts
    ctx.fillStyle = "#e6e6e6";
    ctx.beginPath(); ctx.arc(-R * 0.92, hy - 4, 8, 0, Math.PI * 2); ctx.arc(R * 0.92, hy - 4, 8, 0, Math.PI * 2); ctx.fill();

    this._face("bald", hy, R, pose.expr, t);

    // sweat
    ctx.fillStyle = "rgba(150,210,255,.9)";
    for (let i = 0; i < 3; i++) {
      const a = (t / 700 + i * 1.9) % 1;
      const dx = (i % 2 ? 1 : -1) * (R * 0.85);
      const dy = hy - R * 0.3 + a * R * 1.6;
      ctx.beginPath(); ctx.ellipse(dx, dy, 3.2, 5, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }

  _drawTell(engine) {
    const o = engine.opp;
    if (o.state !== "tell" || !o.attack) return;
    const a = o.attack;
    const ctx = this.ctx;
    const flash = a.tellLeft < a.tellMs * 0.5;
    const cx = LOGICAL_W / 2;
    // arrow on the SAFE side (where the player should dodge)
    let glyph, gx = cx, gy = OPP_BASE - 360;
    if (a.requiredDefense === "duck") { glyph = "⬇ DUCK"; }
    else if (a.requiredDefense === "dodge-left") { glyph = "◀ DODGE"; gx = cx - LOGICAL_W * 0.26; }
    else { glyph = "DODGE ▶"; gx = cx + LOGICAL_W * 0.26; }
    ctx.save();
    ctx.globalAlpha = flash ? 0.7 + 0.3 * Math.sin(engine.elapsed / 55) : 0.7;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 30px sans-serif";
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = a.charge ? "#ff4040" : "#ffd24a";
    ctx.strokeText(glyph, gx, gy); ctx.fillText(glyph, gx, gy);
    if (a.charge) { ctx.font = "44px sans-serif"; ctx.fillText("⚡", cx, gy - 44); }
    ctx.restore();
  }

  _drawWeakSpot(engine) {
    if (!engine.weakSpotActive) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(engine.elapsed / 80);
    ctx.fillStyle = "#ffe14a";
    ctx.font = "900 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦ HIT!", LOGICAL_W / 2, OPP_BASE - 150);
    ctx.restore();
  }

  // ---- Player: "Large Cock" from behind, ARMLESS, pecking. ----
  // Split into tail (drawn behind the opponent) and body (drawn in front).
  _playerPose(player, t) {
    const pose = { cockX: 0, lunge: 0, drop: 0, down: false, shake: 0 };
    switch (player.state) {
      case "idle": pose.lunge = 0.08 + 0.05 * Math.sin(t / 320); break;
      case "dodge-left": pose.cockX = -130; pose.lunge = 0.05; break;
      case "dodge-right": pose.cockX = 130; pose.lunge = 0.05; break;
      case "duck": pose.drop = 90; pose.lunge = 0; break;
      case "peck-left": pose.lunge = 0.95; pose.cockX = -24; break;
      case "peck-right": pose.lunge = 0.95; pose.cockX = 24; break;
      case "hit": pose.shake = Math.sin(t / 24) * 10; break;
      case "stunned": pose.shake = Math.sin(t / 40) * 16; break;
      case "down": case "getup": pose.down = true; break;
    }
    return pose;
  }

  drawPlayerTail(player, t) {
    const pose = this._playerPose(player, t);
    if (pose.down) return;
    const s = 3.0;
    const cx = LOGICAL_W / 2 + pose.cockX + pose.shake;
    this._cock(cx, LOGICAL_H + 44 * s + pose.drop, s, t / 1000, pose.lunge, "tail");
  }

  drawPlayerBody(player, t) {
    const pose = this._playerPose(player, t);
    const s = 3.0;
    const cx = LOGICAL_W / 2 + pose.cockX + pose.shake;
    if (pose.down) {
      const ctx = this.ctx;
      ctx.save();
      ctx.fillStyle = "#caa14a";
      ctx.beginPath();
      ctx.ellipse(LOGICAL_W / 2, LOGICAL_H - 60, 140, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    this._cock(cx, LOGICAL_H * 1.0 + pose.drop, s, t / 1000, pose.lunge, "body");
  }

  drawPlayerFull(player, t) {
    this.drawPlayerTail(player, t);
    this.drawPlayerBody(player, t);
  }

  // Ported from Egg Time's drawCockBack — armless rooster seen from behind;
  // `lunge` (0..1) thrusts the head/beak up to peck. No arms, ever.
  _cock(cx, baseY, s, t, lunge, part) {
    const ctx = this.ctx;
    const rise = lunge * 26;
    ctx.save();
    ctx.translate(cx, baseY - lunge * 10);
    ctx.scale(s, s);
    if (part !== "body") {
      const tailCols = ["#13403a", "#1f6e60", "#2e8f7d", "#39ad97"];
      for (let i = -4; i <= 4; i++) {
        ctx.strokeStyle = tailCols[Math.abs(i) % tailCols.length];
        ctx.lineWidth = 11 - Math.abs(i) * 1.1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(i * 7, -44);
        ctx.quadraticCurveTo(i * 26, -132, i * 30, -150 - Math.abs(i) * 8);
        ctx.stroke();
      }
      ctx.strokeStyle = "#9af0dd"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-4, -44); ctx.quadraticCurveTo(-34, -150, -22, -198); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, -44); ctx.quadraticCurveTo(34, -150, 22, -198); ctx.stroke();
    }
    if (part === "tail") { ctx.restore(); return; }
    // body hump (cream)
    ctx.fillStyle = "#efe9d8";
    ctx.beginPath(); ctx.ellipse(0, -34, 60, 52, 0, 0, Math.PI * 2); ctx.fill();
    // wings (no gloves/arms — these are folded wings)
    for (const sgn of [-1, 1]) {
      ctx.fillStyle = "#e3dcc7";
      ctx.beginPath(); ctx.ellipse(sgn * 48, -34, 20, 40, sgn * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#cabf9f"; ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(sgn * 48, -34 - 8 + i * 12, 16 - i * 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
    // saddle feathers
    ctx.fillStyle = "#e0a93f";
    ctx.beginPath(); ctx.ellipse(0, -58, 30, 16, 0, 0, Math.PI * 2); ctx.fill();
    // neck + head rising toward the opponent
    ctx.strokeStyle = "#efe9d8"; ctx.lineWidth = 26; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(0, -92 - rise); ctx.stroke();
    const hy = -104 - rise;
    ctx.fillStyle = "#efe9d8";
    ctx.beginPath(); ctx.arc(0, hy, 16, 0, Math.PI * 2); ctx.fill();
    // red comb
    ctx.fillStyle = "#e23b2e";
    ctx.beginPath(); ctx.arc(-7, hy - 12, 5, 0, Math.PI * 2); ctx.arc(0, hy - 15, 6, 0, Math.PI * 2); ctx.arc(7, hy - 12, 5, 0, Math.PI * 2); ctx.fill();
    // beak appears when pecking
    if (lunge > 0.2) {
      ctx.fillStyle = "#e8a13a";
      ctx.beginPath(); ctx.moveTo(-3, hy + 8); ctx.lineTo(0, hy + 8 + lunge * 16); ctx.lineTo(3, hy + 8); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---- Referee fox (during the count) ----
  drawReferee(engine) {
    if (engine.countTimer <= 0) return;
    const ctx = this.ctx;
    const overPlayer = engine.countingPlayer;
    const x = LOGICAL_W / 2 + 130;
    const y = overPlayer ? LOGICAL_H - 250 : OPP_BASE - 40;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#e07b2a";
    ctx.beginPath(); ctx.ellipse(0, 0, 34, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-30, -20, 8, 60); ctx.fillRect(-8, -20, 8, 60); ctx.fillRect(14, -20, 8, 60);
    ctx.fillStyle = "#e07b2a";
    ctx.beginPath(); ctx.arc(0, -64, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#e07b2a";
    ctx.beginPath();
    ctx.moveTo(-22, -80); ctx.lineTo(-30, -104); ctx.lineTo(-8, -86); ctx.closePath();
    ctx.moveTo(22, -80); ctx.lineTo(30, -104); ctx.lineTo(8, -86); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(26, -56); ctx.lineTo(0, -50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(26, -56, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-8, -68, 3, 0, Math.PI * 2); ctx.arc(8, -68, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "900 170px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 10; ctx.strokeStyle = "rgba(0,0,0,0.6)";
    const n = String(engine.countValue + 1);
    ctx.strokeText(n, LOGICAL_W / 2, LOGICAL_H / 2);
    ctx.fillText(n, LOGICAL_W / 2, LOGICAL_H / 2);
    ctx.restore();
  }

  // ---- HUD ----
  drawHud(engine, player) {
    const ctx = this.ctx;
    const cfg = engine.cfg;

    this._bar(20, 30, 200, 18, player.health / 100, "#6ddf7a", "#2a5a30");
    this._label(20, 22, "LARGE COCK", "left");
    this._bar(LOGICAL_W - 220, 30, 200, 18, engine.opp.health / engine.opp.maxHealth, "#ff6a6a", "#5a2a2a");
    this._label(LOGICAL_W - 20, 22, cfg.name.toUpperCase(), "right");

    for (let i = 0; i < cfg.knockdownsToWin; i++) {
      ctx.fillStyle = i < engine.opp.knockdowns ? "#ffd24a" : "rgba(255,255,255,0.25)";
      ctx.beginPath(); ctx.arc(LOGICAL_W - 30 - i * 18, 60, 6, 0, Math.PI * 2); ctx.fill();
    }
    if (cfg.phases > 1) this._label(LOGICAL_W - 20, 78, "PHASE " + engine.opp.phase + "/" + cfg.phases, "right");

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < player.knockdowns ? "#ff6a6a" : "rgba(255,255,255,0.25)";
      ctx.beginPath(); ctx.arc(30 + i * 18, 60, 6, 0, Math.PI * 2); ctx.fill();
    }

    this._drawEggMeter(player, engine.elapsed);
    this._label(LOGICAL_W / 2, 130, this._fmtTime(engine.fightTime), "center", "rgba(255,255,255,0.7)", 16);

    this._bar(LOGICAL_W / 2 - 120, LOGICAL_H - 188, 240, 14, player.stamina / 100, "#4ab0ff", "#1d3a55");
    this._label(LOGICAL_W / 2, LOGICAL_H - 202, "PECK POWER", "center", "rgba(255,255,255,0.6)", 12);

    if (engine.fxFlash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${engine.fxFlash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }

    if (engine.banner && engine.elapsed < engine.banner.until) {
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 64px sans-serif";
      ctx.lineWidth = 8; ctx.strokeStyle = "#000"; ctx.fillStyle = "#ffd24a";
      const y = LOGICAL_H / 2 - 130;
      ctx.strokeText(engine.banner.text, LOGICAL_W / 2, y);
      ctx.fillText(engine.banner.text, LOGICAL_W / 2, y);
      ctx.restore();
    }
  }

  _drawEggMeter(player, t) {
    const ctx = this.ctx;
    const cx = LOGICAL_W / 2, cy = 70, r = 34;
    const full = player.hasEgg();
    ctx.lineWidth = 8; ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = full ? "#ffd24a" : "#c9a227";
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (player.egg / 100) * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = full ? "#fff3c4" : "#9a8a55";
    if (full) { ctx.shadowColor = "#ffd24a"; ctx.shadowBlur = 12 + Math.sin(t / 120) * 6; }
    ctx.beginPath(); ctx.ellipse(cx, cy, 16, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    this._label(cx, cy + r + 6, full ? "TAP!" : "EGG", "center", full ? "#ffd24a" : "rgba(255,255,255,0.5)", full ? 13 : 11);
  }

  _bar(x, y, w, h, frac, fill, bg) {
    const ctx = this.ctx;
    frac = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill; ctx.fillRect(x, y, w * frac, h);
  }

  _label(x, y, text, align = "left", color = "#fff", size = 14) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.font = `900 ${size}px sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "bottom";
    ctx.fillText(text, x, y);
  }

  _fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }
}
