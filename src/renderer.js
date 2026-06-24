// Canvas renderer. Punch-Out-style presentation (big torso-up cartoon boxers
// facing the camera, bold outlines, telegraphed wind-up poses, in-ring framing)
// drawing the Egg Time cast — the narcs, the GBS agents and Todd — plus the
// player rooster "Large Cock" seen from behind, ARMLESS, striking with PECKS.
//
// All art is canvas primitives (no image assets). The character art is ported
// from the Egg Time game's own drawing routines and restyled for the ring.

export const LOGICAL_W = 540;
export const LOGICAL_H = 960;

const FLOOR_Y = LOGICAL_H * 0.72;  // ring mat line
const POST_H = 250;                // corner-post / rope height (taller ring)
const RING_TOP = FLOOR_Y - POST_H; // top of the ropes — crowd fills down to here
const OPP_BASE = LOGICAL_H * 0.64; // opponent waist baseline
const FONT = "'Courier New', Courier, monospace"; // everything is courier

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.crowd = this._makeCrowd();
  }

  _makeCrowd() {
    // A DENSE, overlapping wall of hens (and the odd front-facing pig) filling
    // the whole stand from the top down to the ropes. Back rows are smaller and
    // drawn first, so each row overlaps the one behind it.
    const crowd = [];
    const rows = 13;
    for (let row = 0; row < rows; row++) {
      const frac = row / (rows - 1);
      const y = 10 + frac * (RING_TOP - 18);
      const r = 11 + frac * 13;                 // perspective: bigger toward front
      const count = Math.max(8, Math.round(LOGICAL_W / (r * 1.05))); // overlap
      for (let i = 0; i < count; i++) {
        const jitter = (Math.random() - 0.5) * (0.9 / count);
        crowd.push({
          x: (i + 0.5) / count + jitter,
          y,
          r,
          kind: Math.random() < 0.18 ? "pig" : "hen",
          phase: Math.random() * Math.PI * 2,
          blink: Math.random() * 4,
          tint: 0.84 + Math.random() * 0.16,
        });
      }
    }
    return crowd;
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
    // tall corner posts + ropes; fighters stand in front of them
    for (const px of [16, LOGICAL_W - 16]) {
      ctx.fillStyle = "#b22";
      ctx.fillRect(px - 8, RING_TOP, 16, POST_H);
      ctx.fillStyle = "#ffd24a";
      ctx.fillRect(px - 10, RING_TOP, 20, 12);
    }
    ctx.strokeStyle = "#e23b6e";
    ctx.lineWidth = 7;
    for (let i = 0; i < 4; i++) {
      const ry = RING_TOP + 14 + i * ((POST_H - 28) / 3);
      ctx.beginPath();
      ctx.moveTo(16, ry);
      ctx.lineTo(LOGICAL_W - 16, ry);
      ctx.stroke();
    }
  }

  _drawCrowd(t, excite) {
    // dark stand behind the crowd, all the way down to the ropes
    const ctx = this.ctx;
    ctx.fillStyle = "#140d28";
    ctx.fillRect(0, 0, LOGICAL_W, RING_TOP);
    for (const h of this.crowd) {
      const x = 8 + h.x * (LOGICAL_W - 16);
      const bob = Math.sin(t / 340 + h.phase) * (1.5 + excite * 5);
      const y = h.y - bob;
      if (h.kind === "pig") {
        this._pigSmall(x, y, h.r, t, h);
      } else {
        const flap = excite > 0.4 && Math.sin(t / 100 + h.phase) > 0.3;
        this._henSmall(x, y, h.r, t, h, flap);
      }
    }
  }

  // Front-facing pig in the crowd: round pink head, ears, snout, beady eyes.
  _pigSmall(x, y, r, t, h) {
    const ctx = this.ctx;
    const pink = `rgba(242,168,184,${h.tint})`;
    // ears (behind head)
    ctx.fillStyle = "#e58aa0";
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sgn * r * 0.5, y - r * 0.7);
      ctx.lineTo(x + sgn * r * 0.95, y - r * 1.15);
      ctx.lineTo(x + sgn * r * 0.95, y - r * 0.55);
      ctx.closePath(); ctx.fill();
    }
    // head
    ctx.fillStyle = pink;
    ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, Math.PI * 2); ctx.fill();
    // snout
    ctx.fillStyle = "#e58aa0";
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.25, r * 0.42, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b05a72";
    ctx.beginPath(); ctx.arc(x - r * 0.16, y + r * 0.25, r * 0.08, 0, Math.PI * 2); ctx.arc(x + r * 0.16, y + r * 0.25, r * 0.08, 0, Math.PI * 2); ctx.fill();
    // eyes
    const blinkOn = ((t / 1000 + h.blink) % 4) < 0.12;
    if (!blinkOn) {
      ctx.fillStyle = "#2b2118";
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.arc(x + sgn * r * 0.34, y - r * 0.18, r * 0.11, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Small Egg-Time-style hen: round white body, jagged red comb, beak, wide
  // worried eyes — packed shoulder-to-shoulder into the crowd.
  _henSmall(x, y, r, t, h, flap) {
    const ctx = this.ctx;
    const white = `rgba(255,255,255,${h.tint})`;
    // body
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r, r * 1.05, 0, 0, Math.PI * 2); ctx.fill();
    // flapping wings when excited
    if (flap) {
      ctx.fillStyle = "rgba(244,246,249,0.95)";
      for (const sgn of [-1, 1]) {
        ctx.save();
        ctx.translate(x + sgn * r * 0.9, y + r * 0.4);
        ctx.rotate(sgn * (0.5 + Math.sin(t / 90) * 0.3));
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.35, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
    // head
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.62, 0, Math.PI * 2); ctx.fill();
    // jagged red comb
    ctx.fillStyle = "#ff5d4d";
    for (const dx of [-0.32, 0, 0.32]) {
      ctx.beginPath(); ctx.arc(x + dx * r, y - r * 0.95, r * 0.2, 0, Math.PI * 2); ctx.fill();
    }
    // beak
    ctx.fillStyle = "#ffb01f";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.18, y - r * 0.2); ctx.lineTo(x + r * 0.18, y - r * 0.2); ctx.lineTo(x, y - r * 0.02); ctx.closePath();
    ctx.fill();
    // worried eyes
    const blinkOn = ((t / 1000 + h.blink) % 4) < 0.12;
    if (!blinkOn) {
      ctx.fillStyle = "#2b2118";
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.arc(x + sgn * r * 0.26, y - r * 0.42, r * 0.1, 0, Math.PI * 2); ctx.fill();
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

  _oppScale(cfg) {
    return cfg.build === "huge" ? 2.2 : cfg.build === "stocky" ? 1.95 : 1.7;
  }

  // Dispatch to the right character art (upright, at cx/baseY).
  _drawFigure(cfg, cx, baseY, s, pose, woundFrac, t) {
    if (cfg.art === "todd") this._drawTodd(cx, baseY, s, pose, woundFrac, t);
    else if (cfg.id === "gbs-agent") this._drawRiotAgent(cx, baseY, s, pose, woundFrac, t);
    else if (cfg.id === "gbs-leader") this._drawFatLeader(cx, baseY, s, pose, woundFrac, t);
    else this._drawSuit(cx, baseY, s, this._skin(cfg), pose, woundFrac, t);
  }

  drawOpponent(engine) {
    const cfg = engine.cfg;
    const pose = this._oppPose(engine);
    const woundFrac = 1 - engine.opp.health / engine.opp.maxHealth;
    const s = this._oppScale(cfg);

    if (pose.down) {
      this._drawDowned(engine, pose, woundFrac);
      return; // no tell/weak-spot indicators while flat on the mat
    }

    this._drawFigure(cfg, LOGICAL_W / 2, OPP_BASE, s, pose, woundFrac, engine.elapsed);
    this._drawTell(engine);
    this._drawWeakSpot(engine);
  }

  // Knocked-down opponent: their FULL character art, rotated flat onto the mat
  // (recognizably themself, not an oval), down in the lower-center of the ring.
  _drawDowned(engine, pose, woundFrac) {
    const ctx = this.ctx;
    const cfg = engine.cfg;
    const s = this._oppScale(cfg);
    const layPose = { lean: 0, drop: 0, armSide: 0, armExtend: 0, expr: pose.ko ? "ko" : "dazed", down: false, ko: false, shake: 0 };
    ctx.save();
    // lay on the mat: rotate the upright figure onto its back, slid to the right
    // by ~half a body length so he sprawls toward the right of the ring.
    ctx.translate(LOGICAL_W * 0.5 + 84 + 190, LOGICAL_H * 0.86);
    ctx.rotate(-Math.PI / 2);
    this._drawFigure(cfg, 0, 0, s, layPose, woundFrac, engine.elapsed);
    ctx.restore();
  }

  _skin(cfg) {
    const p = cfg.palette;
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
    ctx.font = `900 ${fs}px ${FONT}`;
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

    this._face(sk.head, hy, R, pose.expr, t, woundFrac);
    this._faceWounds(hy, R, woundFrac, t);

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

  _face(head, hy, R, expr, t, woundFrac = 0) {
    const ctx = this.ctx;
    const ex = 15, ey = hy - 4;
    // When badly pecked, the eyes become bloody sockets — drawn over everything
    // (knocks the sunglasses/calm off). Handled by _faceWounds after the face.
    if (head === "sunglasses" && expr !== "hurt" && expr !== "dazed" && woundFrac < 0.55) {
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

  // Pecks land on the FACE: cuts accumulate, then the eyes get beaked into
  // bloody sockets as damage climbs (Egg Time cock-fight style).
  _faceWounds(hy, R, frac, t) {
    if (frac <= 0) return;
    const ctx = this.ctx;
    const ey = hy - 4, ex = 15;
    // cuts / gashes on the face
    const spots = [[-18, -12], [16, -8], [-8, 14], [12, 16], [0, -20], [20, 6], [-22, 4], [6, 20]];
    const n = Math.min(spots.length, Math.round(frac * spots.length));
    for (let i = 0; i < n; i++) {
      const [wx, wy] = spots[i];
      ctx.fillStyle = "rgba(120,20,30,.45)";
      ctx.beginPath(); ctx.ellipse(wx, hy + wy * 0.5, 6, 4, i, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#8a0610"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(wx - 5, hy + wy * 0.5 - 2 + (i % 2) * 4);
      ctx.lineTo(wx + 5, hy + wy * 0.5 + 2 - (i % 2) * 4);
      ctx.stroke();
    }
    // pecked-out eyes: one at 0.55, both by 0.85
    const sockets = frac >= 0.85 ? [-1, 1] : frac >= 0.55 ? [-1] : [];
    for (const sgn of sockets) {
      ctx.fillStyle = "#5a0a08";
      ctx.beginPath(); ctx.arc(sgn * ex, ey, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#2b0604"; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(sgn * ex - 5, ey - 5); ctx.lineTo(sgn * ex + 5, ey + 5);
      ctx.moveTo(sgn * ex + 5, ey - 5); ctx.lineTo(sgn * ex - 5, ey + 5);
      ctx.stroke();
      // blood drip
      ctx.fillStyle = "#9a0810";
      ctx.beginPath();
      ctx.moveTo(sgn * ex, ey + 5); ctx.lineTo(sgn * ex - 3, ey + 22); ctx.lineTo(sgn * ex + 3, ey + 22);
      ctx.closePath(); ctx.fill();
    }
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

    this._face("bald", hy, R, pose.expr, t, woundFrac);
    this._faceWounds(hy, R, woundFrac, t);

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

  // ---- GBS Agent: forward-facing riot trooper (Egg Time Lv6 Downtown agent) ----
  _drawRiotAgent(cx, baseY, s, pose, woundFrac, t) {
    const ctx = this.ctx;
    const armor = "#2b3344", plate = "#1c2230", glove = "#0a0d16";
    ctx.save();
    ctx.translate(cx + pose.shake, baseY);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, 34, 96 * 0.5, 14, 0, 0, Math.PI * 2); ctx.fill();
    if (pose.down) { this._drawArmoredDowned(s, armor, pose.ko); ctx.restore(); return; }
    ctx.translate(pose.lean, pose.drop); ctx.scale(s, s);
    ctx.lineJoin = "round"; ctx.lineCap = "round";

    // trunks
    ctx.fillStyle = "#11151f";
    ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(46, 0); ctx.lineTo(40, 44); ctx.lineTo(-40, 44); ctx.closePath(); ctx.fill();

    const restGlove = (sgn) => {
      ctx.strokeStyle = "#000"; ctx.lineWidth = 20;
      ctx.beginPath(); ctx.moveTo(sgn * 80, -120); ctx.lineTo(sgn * 104, -34); ctx.stroke();
      ctx.strokeStyle = armor; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(sgn * 80, -120); ctx.lineTo(sgn * 104, -34); ctx.stroke();
      this._glove(sgn * 104, -34, 22, glove);
    };
    const punchSide = pose.armSide || 1;
    if (pose.armExtend < 0.15) { restGlove(-1); restGlove(1); } else restGlove(-punchSide);

    // armored torso
    ctx.beginPath();
    ctx.moveTo(-58, 4); ctx.quadraticCurveTo(-74, -72, -88, -148);
    ctx.quadraticCurveTo(-50, -176, 0, -176);
    ctx.quadraticCurveTo(50, -176, 88, -148);
    ctx.quadraticCurveTo(74, -72, 58, 4); ctx.closePath();
    ctx.fillStyle = armor; ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // chest + ab plates
    ctx.fillStyle = plate;
    ctx.fillRect(-46, -150, 92, 30);
    ctx.fillRect(-46, -112, 92, 38);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3;
    ctx.strokeRect(-46, -150, 92, 30); ctx.strokeRect(-46, -112, 92, 38);
    // GBS stencil
    ctx.fillStyle = "#cfd6e0";
    ctx.font = "900 34px" + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("GBS", 0, -135);
    ctx.textBaseline = "alphabetic";

    this._wounds(woundFrac, -150, 0);

    // punching arm
    if (pose.armExtend >= 0.15) {
      const e = pose.armExtend;
      const gx = punchSide * (40 + e * 30), gy = -150 + e * 150;
      ctx.strokeStyle = "#000"; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(punchSide * 80, -132); ctx.lineTo(gx, gy); ctx.stroke();
      ctx.strokeStyle = armor; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(punchSide * 80, -132); ctx.lineTo(gx, gy); ctx.stroke();
      this._glove(gx, gy, 24 + e * 22, glove);
    }

    // neck + helmeted head
    ctx.fillStyle = "#d9b48a"; ctx.fillRect(-16, -196, 32, 30);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(-16, -196, 32, 30);
    const hy = -228, R = 40;
    // chin/face skin
    ctx.fillStyle = "#d9b48a";
    ctx.beginPath(); ctx.ellipse(0, hy, R, R + 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // visor band over the eyes (blue-tinted)
    ctx.fillStyle = plate; ctx.fillRect(-R, hy - 18, R * 2, 26);
    ctx.fillStyle = "rgba(120,165,195,.5)"; ctx.fillRect(-R + 6, hy - 14, R * 2 - 12, 12);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.strokeRect(-R, hy - 18, R * 2, 26);
    // helmet dome
    ctx.fillStyle = plate;
    ctx.beginPath(); ctx.arc(0, hy - 18, R + 2, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // grim mouth / wounds (pecked through the visor at high damage)
    if (pose.expr === "hurt" || pose.expr === "dazed") {
      ctx.strokeStyle = "#5a1e1e"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-10, hy + 22); ctx.quadraticCurveTo(0, hy + 16, 10, hy + 22); ctx.stroke();
    } else {
      ctx.fillStyle = "#5a1e1e"; ctx.fillRect(-10, hy + 18, 20, 5);
    }
    this._faceWounds(hy, R, woundFrac, t);

    ctx.restore();
  }

  _drawArmoredDowned(s, armor, ko) {
    const ctx = this.ctx;
    ctx.save(); ctx.scale(s, s); ctx.translate(0, 10);
    ctx.fillStyle = armor;
    ctx.beginPath(); ctx.ellipse(0, 0, 96, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "#1c2230";
    ctx.beginPath(); ctx.arc(-86, -6, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (ko) {
      ctx.strokeStyle = "#9af"; ctx.lineWidth = 3;
      for (const dx of [-96, -76]) {
        ctx.beginPath();
        ctx.moveTo(dx - 5, -10); ctx.lineTo(dx + 5, -2);
        ctx.moveTo(dx + 5, -10); ctx.lineTo(dx - 5, -2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- GBS Leader: fat military officer (Egg Time Lv7 fat agent), facing us ----
  _drawFatLeader(cx, baseY, s, pose, woundFrac, t) {
    const ctx = this.ctx;
    const olive = "#4f5836", olive2 = "#3c4329", skin = "#e7b48a", skin2 = "#cf9a72", gold = "#caa83a";
    ctx.save();
    ctx.translate(cx + pose.shake, baseY);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath(); ctx.ellipse(0, 34, 110 * 0.5, 14, 0, 0, Math.PI * 2); ctx.fill();
    if (pose.down) {
      ctx.save(); ctx.scale(s, s); ctx.translate(0, 10);
      ctx.fillStyle = olive;
      ctx.beginPath(); ctx.ellipse(0, 0, 104, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(-92, -6, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore(); ctx.restore();
      return;
    }
    ctx.translate(pose.lean, pose.drop); ctx.scale(s, s);
    ctx.lineJoin = "round"; ctx.lineCap = "round";

    // stocky olive legs
    ctx.fillStyle = olive2;
    ctx.fillRect(-40, 0, 32, 46); ctx.fillRect(8, 0, 32, 46);

    const restGlove = (sgn) => {
      ctx.strokeStyle = "#000"; ctx.lineWidth = 20;
      ctx.beginPath(); ctx.moveTo(sgn * 84, -96); ctx.lineTo(sgn * 110, -30); ctx.stroke();
      ctx.strokeStyle = olive; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(sgn * 84, -96); ctx.lineTo(sgn * 110, -30); ctx.stroke();
      this._glove(sgn * 110, -30, 24, "#c0271f");
    };
    const punchSide = pose.armSide || 1;
    if (pose.armExtend < 0.15) { restGlove(-1); restGlove(1); } else restGlove(-punchSide);

    // BIG belly / olive jacket
    ctx.fillStyle = olive;
    ctx.beginPath(); ctx.ellipse(0, -70, 92, 80, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // shoulders
    ctx.fillStyle = olive;
    ctx.beginPath(); ctx.moveTo(-84, -120); ctx.quadraticCurveTo(0, -150, 84, -120); ctx.lineTo(78, -96); ctx.lineTo(-78, -96); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 4; ctx.stroke();
    // centre seam + gold buttons
    ctx.strokeStyle = olive2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -128); ctx.lineTo(0, -24); ctx.stroke();
    ctx.fillStyle = gold;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(0, -116 + i * 22, 5, 0, Math.PI * 2); ctx.fill(); }
    // belt
    ctx.fillStyle = "#241c10"; ctx.fillRect(-84, -34, 168, 14);
    ctx.fillStyle = gold; ctx.fillRect(-10, -34, 20, 14);
    // epaulettes
    ctx.fillStyle = gold; ctx.fillRect(-88, -128, 28, 10); ctx.fillRect(60, -128, 28, 10);
    // medal ribbons + GBS pocket
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ["#b22", "#2a7", "#36c"][i]; ctx.fillRect(-70, -118 + i * 9, 30, 7); }
    ctx.fillStyle = olive2; ctx.fillRect(34, -120, 40, 26);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(34, -120, 40, 26);
    ctx.fillStyle = "#ffd24a"; ctx.font = "900 16px" + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("GBS", 54, -107); ctx.textBaseline = "alphabetic";

    this._wounds(woundFrac, -120, 0);

    // punching arm
    if (pose.armExtend >= 0.15) {
      const e = pose.armExtend;
      const gx = punchSide * (44 + e * 30), gy = -110 + e * 130;
      ctx.strokeStyle = "#000"; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(punchSide * 84, -100); ctx.lineTo(gx, gy); ctx.stroke();
      ctx.strokeStyle = olive; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(punchSide * 84, -100); ctx.lineTo(gx, gy); ctx.stroke();
      this._glove(gx, gy, 26 + e * 22, "#c0271f");
    }

    // neck + round head
    ctx.fillStyle = skin; ctx.fillRect(-16, -168, 32, 24);
    const hy = -196, R = 34;
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, hy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.stroke();
    // ears + nose
    ctx.fillStyle = skin2;
    ctx.beginPath(); ctx.arc(-R, hy + 2, 7, 0, Math.PI * 2); ctx.arc(R, hy + 2, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, hy + 8, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    // smug smile / grimace
    if (pose.expr === "hurt" || pose.expr === "dazed") {
      ctx.fillStyle = "#5a1e1e"; ctx.beginPath(); ctx.ellipse(0, hy + 22, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = "#5a1e1e"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-12, hy + 18); ctx.quadraticCurveTo(0, hy + 28, 12, hy + 18); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillRect(-9, hy + 18, 18, 3);
    }
    // aviator shades
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath(); ctx.ellipse(-12, hy - 6, 11, 8, 0, 0, Math.PI * 2); ctx.ellipse(12, hy - 6, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-3, hy - 8, 6, 4);
    ctx.fillStyle = "rgba(150,180,210,.5)";
    ctx.beginPath(); ctx.arc(-15, hy - 8, 3, 0, Math.PI * 2); ctx.arc(9, hy - 8, 3, 0, Math.PI * 2); ctx.fill();
    // peaked military cap
    ctx.fillStyle = olive;
    ctx.beginPath(); ctx.ellipse(0, hy - 30, R + 4, 18, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = olive2; ctx.fillRect(-R - 4, hy - 32, (R + 4) * 2, 10);
    ctx.fillStyle = "#15180e"; ctx.beginPath(); ctx.ellipse(0, hy - 22, R + 10, 8, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(0, hy - 28, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, hy - 30, R + 4, 18, 0, Math.PI, 0); ctx.stroke();

    this._faceWounds(hy, R, woundFrac, t);

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
    ctx.font = "900 30px" + FONT;
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = a.charge ? "#ff4040" : "#ffd24a";
    ctx.strokeText(glyph, gx, gy); ctx.fillText(glyph, gx, gy);
    if (a.charge) { ctx.font = "44px" + FONT; ctx.fillText("⚡", cx, gy - 44); }
    ctx.restore();
  }

  _drawWeakSpot(engine) {
    if (!engine.weakSpotActive) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(engine.elapsed / 80);
    ctx.fillStyle = "#ffe14a";
    ctx.font = "900 44px" + FONT;
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
      // Large Cock flat on his back on the mat at the bottom of the screen.
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(LOGICAL_W / 2, LOGICAL_H - 36);
      ctx.rotate(-Math.PI / 2);
      this._roosterSide(0, 0, 6.0, t / 1000);
      ctx.restore();
      return;
    }
    this._cock(cx, LOGICAL_H * 1.0 + pose.drop, s, t / 1000, pose.lunge, "body");
  }

  drawPlayerFull(player, t) {
    this.drawPlayerBody(player, t);
    this.drawPlayerTail(player, t);
  }

  // When the opponent is down for the count, Large Cock steps all the way to
  // the LOWER-LEFT corner, side profile, gazing up toward ~1–2 o'clock.
  drawPlayerCorner(player, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(70, LOGICAL_H - 46);
    ctx.rotate(-0.34); // tip his head up toward the 1–2 o'clock line
    this._roosterSide(0, 0, 5.2, t / 1000);
    ctx.restore();
  }

  // Egg Time side-profile rooster (faces right): body, sickle tail curling
  // back-left, golden hackle, comb, beak. Used for the corner profile.
  _roosterSide(x, gy, s, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, gy + Math.sin(t * 3) * 1.6);
    ctx.scale(s, s);
    // legs + claws
    ctx.strokeStyle = "#e8a13a"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-3, 0); ctx.moveTo(4, -3); ctx.lineTo(5, 0); ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-3, 0); ctx.lineTo(-6, 1); ctx.moveTo(-3, 0); ctx.lineTo(-0.5, 1.5);
    ctx.moveTo(5, 0); ctx.lineTo(2, 1.5); ctx.moveTo(5, 0); ctx.lineTo(8, 1); ctx.stroke();
    // arched sickle tail (sweeps up, curls back-left)
    const tailCols = ["#13403a", "#1f6e60", "#2e8f7d"];
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = tailCols[i % tailCols.length]; ctx.lineWidth = 4.6 - i * 0.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-7, -13);
      ctx.quadraticCurveTo(-20 - i * 3, -20 - i * 4, -13 - i * 4, -36 - i * 6);
      ctx.stroke();
    }
    ctx.strokeStyle = "#7fe6d3"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-7, -13); ctx.quadraticCurveTo(-26, -34, -15, -46); ctx.stroke();
    // body + puffed chest
    ctx.fillStyle = "#efe9d8"; ctx.beginPath(); ctx.ellipse(0, -15, 11, 14, -0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(5, -12, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
    // golden neck hackle
    ctx.fillStyle = "#e0a93f";
    ctx.beginPath(); ctx.moveTo(2, -25); ctx.lineTo(11, -30); ctx.lineTo(9, -19); ctx.lineTo(3, -17); ctx.closePath(); ctx.fill();
    // head
    const hx = 9, hy = -32;
    ctx.fillStyle = "#efe9d8"; ctx.beginPath(); ctx.arc(hx, hy, 6.4, 0, Math.PI * 2); ctx.fill();
    // comb
    ctx.fillStyle = "#e23b2e";
    ctx.beginPath();
    ctx.arc(hx - 4, hy - 6, 1.8, 0, Math.PI * 2);
    ctx.arc(hx, hy - 8, 2.2, 0, Math.PI * 2);
    ctx.arc(hx + 4, hy - 6, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // wattle
    ctx.beginPath(); ctx.ellipse(hx + 4, hy + 6, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    // beak (points right)
    ctx.fillStyle = "#e8a13a"; ctx.beginPath();
    ctx.moveTo(hx + 6, hy - 1); ctx.lineTo(hx + 14, hy + 1); ctx.lineTo(hx + 6, hy + 4); ctx.closePath(); ctx.fill();
    // eye
    ctx.fillStyle = "#2b2118"; ctx.beginPath(); ctx.arc(hx + 2, hy - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(hx + 2.6, hy - 1.6, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Egg Time pig (side view) — used for Coach Hamhock in the tutorial bubble.
  // Draws into THIS renderer's ctx; caller sets up the transform/canvas.
  drawCoachPig(x, gy, s, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, gy + Math.sin(t) * 1.5);
    ctx.scale(s, s);
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3a2b22";
    for (const lx of [-13, -5, 5, 13]) ctx.fillRect(lx - 2, -6, 4, 6);
    const body = "#f2a8b8";
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -16, 22, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = body; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-22, -20, 4, -0.6, Math.PI * 1.4); ctx.stroke(); // curly tail
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(22, -20, 12, 0, Math.PI * 2); ctx.fill(); // head
    ctx.beginPath(); ctx.moveTo(20, -30); ctx.lineTo(26, -34); ctx.lineTo(27, -28); ctx.closePath(); ctx.fill(); // ear
    ctx.fillStyle = "#e58aa0"; ctx.beginPath(); ctx.ellipse(33, -19, 5, 6, 0, 0, Math.PI * 2); ctx.fill(); // snout
    ctx.fillStyle = "#b05a72"; ctx.fillRect(32, -21, 1.5, 4); ctx.fillRect(34.5, -21, 1.5, 4);
    ctx.fillStyle = "#2b2118"; ctx.beginPath(); ctx.arc(22, -23, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
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
      // big, full sickle TAIL — the closest thing to the camera, fanned WIDE
      const tailCols = ["#0e3a34", "#13403a", "#1f6e60", "#2e8f7d", "#39ad97", "#52c9b1"];
      for (let i = -6; i <= 6; i++) {
        ctx.strokeStyle = tailCols[Math.abs(i) % tailCols.length];
        ctx.lineWidth = 14 - Math.abs(i) * 1.0;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(i * 7, -40);
        ctx.quadraticCurveTo(i * 30, -150, i * 34, -176 - Math.abs(i) * 9);
        ctx.stroke();
      }
      // glossy iridescent top sickle feathers curling back
      ctx.strokeStyle = "#9af0dd"; ctx.lineWidth = 5; ctx.lineCap = "round";
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sgn * 4, -42); ctx.quadraticCurveTo(sgn * 40, -160, sgn * 26, -224); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sgn * 12, -44); ctx.quadraticCurveTo(sgn * 60, -150, sgn * 50, -210); ctx.stroke();
      }
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
    ctx.beginPath(); ctx.ellipse(0, -58, 34, 18, 0, 0, Math.PI * 2); ctx.fill();
    // neck + head rising toward the opponent
    ctx.strokeStyle = "#efe9d8"; ctx.lineWidth = 26; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(0, -92 - rise); ctx.stroke();
    // golden HACKLE / cape feathers fanning around the neck (pointed plumes)
    const hackBase = -60;
    for (let i = -3; i <= 3; i++) {
      const tip = -96 - rise + Math.abs(i) * 4;
      ctx.fillStyle = i % 2 ? "#e8b34a" : "#caa036";
      ctx.beginPath();
      ctx.moveTo(i * 6 - 5, hackBase);
      ctx.quadraticCurveTo(i * 12, (hackBase + tip) / 2, i * 7, tip);
      ctx.quadraticCurveTo(i * 12 + 4, (hackBase + tip) / 2, i * 6 + 5, hackBase);
      ctx.closePath();
      ctx.fill();
    }
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

  // ---- Referee: a little chick in the LOWER-RIGHT corner, counting with a
  //      speech bubble ("1".."3", then "K.O.!") ----
  drawReferee(engine) {
    const counting = engine.countTimer > 0;
    const ko = engine.opp.state === "ko";
    if (!counting && !ko) return;
    const ctx = this.ctx;
    const x = LOGICAL_W - 64;
    const y = LOGICAL_H - 46;                 // lower-right corner, on the floor
    const t = engine.elapsed;

    // speech bubble up-and-left of the chick (tail points back to it)
    const text = ko ? "K.O.!" : String(engine.countValue + 1);
    this._speechBubble(x - 92, y - 150, text);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-7, 7);                         // mirrored — faces left, toward the ring
    ctx.translate(0, Math.sin(t / 250) * 1.2);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    // legs
    ctx.fillStyle = "#e8a13a"; ctx.fillRect(-2, -3, 1.6, 3); ctx.fillRect(0.4, -3, 1.6, 3);
    // body + head
    ctx.fillStyle = "#ffe05a";
    ctx.beginPath(); ctx.ellipse(0, -7, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -13, 4.5, 0, Math.PI * 2); ctx.fill();
    // counting wing, raised
    ctx.save();
    ctx.translate(5, -8);
    ctx.rotate(-0.6 - Math.abs(Math.sin(t / 180)) * 0.5);
    ctx.fillStyle = "#ffd24a";
    ctx.beginPath(); ctx.ellipse(0, -3, 2.2, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // beak + eye
    ctx.fillStyle = "#e8a13a";
    ctx.beginPath(); ctx.moveTo(4, -13); ctx.lineTo(8, -12); ctx.lineTo(4, -11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2b2118"; ctx.beginPath(); ctx.arc(1.5, -14, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // A comic speech bubble (the chick's count / KO call). (cx,cy) = its center;
  // the tail points down-right toward the chick in the corner.
  _speechBubble(cx, cy, text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "900 30px" + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const w = Math.max(64, ctx.measureText(text).width + 30);
    const h = 50;
    let x = cx - w / 2;
    if (x < 6) x = 6;
    if (x + w > LOGICAL_W - 6) x = LOGICAL_W - 6 - w;
    const y = cy - h / 2;
    const r = 14;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // tail at the bottom-right, pointing down toward the chick
    ctx.beginPath();
    ctx.moveTo(x + w - 30, y + h - 2);
    ctx.lineTo(x + w + 6, y + h + 26);
    ctx.lineTo(x + w - 8, y + h - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
    ctx.restore();
  }

  // ---- Blood splattered on the lens (screen space, over the fighters) ----
  drawLensBlood(engine) {
    const ctx = this.ctx;
    for (const l of engine.lens) {
      const a = Math.max(0, Math.min(1, l.a));
      ctx.fillStyle = `rgba(122,4,16,${a})`;
      ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(154,8,16,${a * 0.75})`;
      ctx.beginPath(); ctx.arc(l.x - l.r * 0.26, l.y - l.r * 0.26, l.r * 0.42, 0, Math.PI * 2); ctx.fill();
      if (l.drip) {
        ctx.strokeStyle = `rgba(110,5,14,${a})`;
        ctx.lineWidth = l.r * 0.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y + l.drip); ctx.stroke();
      }
    }
  }

  // ---- HUD ----
  drawHud(engine, player) {
    const ctx = this.ctx;
    const cfg = engine.cfg;

    this._bar(20, 30, 200, 18, player.health / 100, "#6ddf7a", "#2a5a30");
    this._label(20, 22, "LARGE COCK", "left", "#fff", 16, true);
    this._bar(LOGICAL_W - 220, 30, 200, 18, engine.opp.health / engine.opp.maxHealth, "#ff6a6a", "#5a2a2a");
    this._label(LOGICAL_W - 20, 22, cfg.name.toUpperCase(), "right", "#fff", 16, true);

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

    this._bar(LOGICAL_W / 2 - 120, LOGICAL_H - 30, 240, 14, player.stamina / 100, "#4ab0ff", "#1d3a55");
    this._label(LOGICAL_W / 2, LOGICAL_H - 34, "PECK POWER", "center", "#fff", 12, true);

    if (engine.fxFlash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${engine.fxFlash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }

    if (engine.banner && engine.elapsed < engine.banner.until) {
      ctx.save();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "900 64px" + FONT;
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

  _label(x, y, text, align = "left", color = "#fff", size = 14, stroke = false) {
    const ctx = this.ctx;
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "bottom";
    if (stroke) {
      ctx.lineWidth = Math.max(3, size * 0.4);
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  _fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }
}
