// Canvas renderer. Everything is drawn with primitives — no image assets — so
// the game is self-contained. Drawing happens in a fixed logical coordinate
// space (LOGICAL_W x LOGICAL_H); game.js scales the canvas to fit the screen.

export const LOGICAL_W = 540;
export const LOGICAL_H = 960;

const RING_TOP = 250;     // y where the canvas floor begins
const OPP_Y = 600;        // opponent's feet baseline

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.crowd = this._makeCrowd();
  }

  _makeCrowd() {
    const hens = [];
    for (let row = 0; row < 3; row++) {
      const count = 9 + row;
      for (let i = 0; i < count; i++) {
        hens.push({
          x: (i + 0.5) / count,
          row,
          phase: Math.random() * Math.PI * 2,
          blink: Math.random() * 4,
          hue: 18 + Math.random() * 24, // warm hen tones
        });
      }
    }
    return hens;
  }

  // ---- Background: ring + animated hen crowd ----
  drawArena(t, excite = 0) {
    const ctx = this.ctx;
    // Sky / hall gradient
    const g = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
    g.addColorStop(0, "#241640");
    g.addColorStop(0.5, "#2f1d52");
    g.addColorStop(1, "#160d2b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    this._drawCrowd(t, excite);

    // Ring canvas floor (perspective trapezoid)
    ctx.fillStyle = "#3a2c1c";
    ctx.beginPath();
    ctx.moveTo(40, RING_TOP);
    ctx.lineTo(LOGICAL_W - 40, RING_TOP);
    ctx.lineTo(LOGICAL_W, LOGICAL_H);
    ctx.lineTo(0, LOGICAL_H);
    ctx.closePath();
    ctx.fill();
    // Mat
    ctx.fillStyle = "#e9dcc2";
    ctx.beginPath();
    ctx.moveTo(70, RING_TOP + 30);
    ctx.lineTo(LOGICAL_W - 70, RING_TOP + 30);
    ctx.lineTo(LOGICAL_W - 10, LOGICAL_H - 40);
    ctx.lineTo(10, LOGICAL_H - 40);
    ctx.closePath();
    ctx.fill();
    // Center logo: an egg
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#c9a227";
    ctx.beginPath();
    ctx.ellipse(LOGICAL_W / 2, RING_TOP + 230, 60, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawRopes();
  }

  _drawCrowd(t, excite) {
    const ctx = this.ctx;
    ctx.fillStyle = "#1a1030";
    ctx.fillRect(0, 0, LOGICAL_W, RING_TOP);
    for (const h of this.crowd) {
      const x = 20 + h.x * (LOGICAL_W - 40);
      const baseY = 60 + h.row * 56;
      const bob = Math.sin(t / 380 + h.phase) * (3 + excite * 6);
      const flap = excite > 0.5 && Math.sin(t / 120 + h.phase) > 0.4;
      const y = baseY - bob;
      const r = 15 - h.row * 1.5;
      // body
      ctx.fillStyle = `hsl(${h.hue}, 45%, ${70 - h.row * 6}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      // comb
      ctx.fillStyle = "#e2574c";
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.9, r * 0.5, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      // beak
      ctx.fillStyle = "#f2b33a";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + r * 0.6, y + 1);
      ctx.lineTo(x, y + r * 0.4);
      ctx.closePath();
      ctx.fill();
      // eye / blink
      const blinkOn = ((t / 1000 + h.blink) % 4) < 0.12;
      ctx.fillStyle = "#111";
      if (!blinkOn) {
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.15, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // wings flapping when excited
      if (flap) {
        ctx.strokeStyle = `hsl(${h.hue}, 40%, ${55 - h.row * 5}%)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - r, y);
        ctx.lineTo(x - r - 6, y - 6);
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + r + 6, y - 6);
        ctx.stroke();
      }
    }
  }

  _drawRopes() {
    const ctx = this.ctx;
    const posts = [
      [40, RING_TOP], [LOGICAL_W - 40, RING_TOP],
      [10, LOGICAL_H - 60], [LOGICAL_W - 10, LOGICAL_H - 60],
    ];
    // turnbuckle posts
    ctx.fillStyle = "#7a1f1f";
    for (const [x, y] of [posts[0], posts[1]]) ctx.fillRect(x - 6, y - 70, 12, 80);
    // three ropes across the back
    const ropeColors = ["#d23b3b", "#e8e8e8", "#3b6bd2"];
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ropeColors[i];
      ctx.lineWidth = 5;
      const y = RING_TOP - 14 - i * 18;
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(LOGICAL_W - 40, y);
      ctx.stroke();
    }
  }

  // ---- Opponent (front-facing, center of ring) ----
  drawOpponent(engine) {
    const ctx = this.ctx;
    const o = engine.opp;
    const cfg = engine.cfg;
    const p = cfg.palette;
    const t = engine.elapsed;

    const scale = cfg.build === "huge" ? 1.5 : cfg.build === "stocky" ? 1.25 : 1.0;
    const cx = LOGICAL_W / 2;
    let cy = OPP_Y;

    // shake on getting hit
    let shake = 0;
    if (t < o.shakeUntil) shake = Math.sin(t / 20) * 5;

    // pose offsets
    let lean = 0, drop = 0, armExtend = 0, armSide = 0, down = false, hurt = false;
    switch (o.state) {
      case "idle": case "recover": drop = Math.sin(t / 360) * 4; break;
      case "feint": lean = Math.sin(t / 60) * 6; break;
      case "tell": {
        const a = o.attack;
        const wind = a ? 1 - a.tellLeft / a.tellMs : 0;
        lean = (a && a.dir === "left" ? -1 : 1) * (a && a.charge ? -1 : 1) * 14 * wind;
        if (a && a.charge) { lean = -22 * wind; drop = -10 * wind; }
        armSide = a ? (a.dir === "left" ? -1 : 1) : 0;
        break;
      }
      case "strike": armExtend = 1; lean = o.attack ? (o.attack.dir === "left" ? 8 : -8) : 0;
        armSide = o.attack ? (o.attack.dir === "left" ? -1 : 1) : 0; break;
      case "whiff": lean = 16; drop = 6; break;
      case "hurt": hurt = true; lean = Math.sin(t / 30) * 6; break;
      case "down": case "watch": break;
      case "getup": drop = 14; break;
      case "ko": down = true; break;
    }

    ctx.save();
    ctx.translate(cx + shake, cy);

    if (down || o.state === "down") {
      this._drawDownedOpponent(p, scale, o.state === "ko");
      ctx.restore();
      this._drawWeakSpot(engine);
      return;
    }

    ctx.translate(lean, drop);
    const s = scale;

    // shadow
    ctx.save();
    ctx.translate(-lean, -drop + 6);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 8, 70 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // legs
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 10 * s;
    ctx.beginPath();
    ctx.moveTo(-22 * s, -10); ctx.lineTo(-26 * s, 4);
    ctx.moveTo(22 * s, -10); ctx.lineTo(26 * s, 4);
    ctx.stroke();

    // body
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.ellipse(0, -90 * s, 64 * s, 78 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // belly accent
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.ellipse(0, -70 * s, 34 * s, 48 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // arms / gloves
    this._drawGlove(p, armSide < 0 ? -1 : 1, armExtend, s, true, armSide);
    // resting other glove
    if (armExtend < 1) this._drawGlove(p, armSide < 0 ? 1 : -1, 0, s, false, 0);

    // head
    const headY = -180 * s;
    ctx.fillStyle = hurt ? "#ffffff" : p.body;
    ctx.beginPath();
    ctx.ellipse(0, headY, 40 * s, 38 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // comb
    ctx.fillStyle = p.comb;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 14 * s, headY - 36 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // wattle
    ctx.beginPath();
    ctx.ellipse(-6 * s, headY + 30 * s, 8 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = "#f2b33a";
    ctx.beginPath();
    ctx.moveTo(-4 * s, headY + 6 * s);
    ctx.lineTo(28 * s, headY + 12 * s);
    ctx.lineTo(-4 * s, headY + 22 * s);
    ctx.closePath();
    ctx.fill();
    // eyes
    if (hurt) {
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3 * s;
      for (const ex of [-16, 12]) {
        ctx.beginPath();
        ctx.moveTo(ex * s - 6, headY - 8 * s); ctx.lineTo(ex * s + 6, headY + 2 * s);
        ctx.moveTo(ex * s + 6, headY - 8 * s); ctx.lineTo(ex * s - 6, headY + 2 * s);
        ctx.stroke();
      }
    } else {
      for (const ex of [-16, 12]) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(ex * s, headY - 4 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.eye;
        ctx.beginPath(); ctx.arc(ex * s + 2, headY - 4 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();

    this._drawTell(engine);
    this._drawWeakSpot(engine);
  }

  _drawGlove(p, dir, extend, s, isAttacking, armSide) {
    const ctx = this.ctx;
    const baseX = dir * 58 * s;
    const baseY = -70 * s;
    let gx = baseX, gy = baseY;
    if (isAttacking && extend > 0) {
      // punch toward the viewer (down/forward + bigger)
      gx = (armSide || dir) * 26 * s;
      gy = baseY + 70 * s + extend * 30;
    }
    const size = (isAttacking && extend > 0 ? 26 : 20) * s;
    // arm
    ctx.strokeStyle = p.dark;
    ctx.lineWidth = 14 * s;
    ctx.beginPath();
    ctx.moveTo(dir * 40 * s, baseY);
    ctx.lineTo(gx, gy);
    ctx.stroke();
    // glove
    ctx.fillStyle = "#c33";
    ctx.beginPath();
    ctx.arc(gx, gy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(gx - size * 0.3, gy - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawDownedOpponent(p, s, isKo) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(0, -10);
    ctx.fillStyle = p.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 80 * s, 30 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // head to the side
    ctx.beginPath();
    ctx.ellipse(-70 * s, -6, 34 * s, 30 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isKo) {
      // dizzy stars / X eyes
      ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
      for (const ex of [-78, -60]) {
        ctx.beginPath();
        ctx.moveTo(ex * s - 5, -10); ctx.lineTo(ex * s + 5, 0);
        ctx.moveTo(ex * s + 5, -10); ctx.lineTo(ex * s - 5, 0);
        ctx.stroke();
      }
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
    const y = OPP_Y - 320;
    // direction arrow telling the player which way to slip / to duck
    ctx.save();
    ctx.globalAlpha = flash ? 0.6 + 0.4 * Math.sin(engine.elapsed / 60) : 0.55;
    ctx.fillStyle = a.charge ? "#ff4040" : "#ffe14a";
    ctx.font = "bold 56px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let glyph;
    if (a.requiredDefense === "duck") glyph = "⬇";
    else glyph = a.requiredDefense === "dodge-left" ? "⬅" : "➡";
    ctx.fillText(glyph, cx, y);
    if (a.charge) ctx.fillText("⚡", cx, y - 56);
    ctx.restore();
  }

  _drawWeakSpot(engine) {
    if (!engine.weakSpotActive) return;
    const ctx = this.ctx;
    const cx = LOGICAL_W / 2;
    const y = OPP_Y - 120;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(engine.elapsed / 80);
    ctx.fillStyle = "#ffe14a";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✦", cx, y);
    ctx.restore();
  }

  // ---- Player rooster (back view, foreground) ----
  drawPlayer(player, t) {
    const ctx = this.ctx;
    const cx = LOGICAL_W / 2;
    const cy = LOGICAL_H - 70;

    let lean = 0, drop = 0, leftFwd = 0, rightFwd = 0, down = false;
    switch (player.state) {
      case "idle": drop = Math.sin(t / 400) * 4; break;
      case "dodge-left": lean = -70; break;
      case "dodge-right": lean = 70; break;
      case "duck": drop = 70; break;
      case "peck-left": leftFwd = 1; break;
      case "peck-right": rightFwd = 1; break;
      case "hit": lean = Math.sin(t / 25) * 8; break;
      case "stunned": lean = Math.sin(t / 40) * 12; break;
      case "down": case "getup": down = true; break;
    }

    ctx.save();
    ctx.translate(cx + lean, cy + drop);

    if (down) {
      ctx.fillStyle = "#caa14a";
      ctx.beginPath();
      ctx.ellipse(0, 30, 90, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // gloves (player's own, reaching up into frame)
    this._drawPlayerGlove(-110, 10, leftFwd);
    this._drawPlayerGlove(110, 10, rightFwd);

    // back of head + neck
    ctx.fillStyle = "#e8b84a";
    ctx.beginPath();
    ctx.ellipse(0, -10, 70, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    // feather tuft / comb from behind
    ctx.fillStyle = "#d23b3b";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 22, -70, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    // neck feathers
    ctx.fillStyle = "#c79a36";
    ctx.beginPath();
    ctx.ellipse(0, 50, 80, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawPlayerGlove(x, y, fwd) {
    const ctx = this.ctx;
    const size = 40 + fwd * 26;
    const gy = y - fwd * 220; // thrust up toward the opponent on a peck
    ctx.fillStyle = "#1b6ed0";
    ctx.beginPath();
    ctx.arc(x * (1 - fwd * 0.6), gy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.arc(x * (1 - fwd * 0.6) - size * 0.3, gy - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Referee fox (appears during the count) ----
  drawReferee(engine) {
    if (engine.countTimer <= 0) return;
    const ctx = this.ctx;
    const overPlayer = engine.countingPlayer;
    const x = LOGICAL_W / 2 + (overPlayer ? 120 : 120);
    const y = overPlayer ? LOGICAL_H - 230 : OPP_Y - 60;
    ctx.save();
    ctx.translate(x, y);
    // body
    ctx.fillStyle = "#e07b2a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    // white shirt stripes (referee)
    ctx.fillStyle = "#fff";
    ctx.fillRect(-30, -20, 8, 60);
    ctx.fillRect(-8, -20, 8, 60);
    ctx.fillRect(14, -20, 8, 60);
    // head
    ctx.fillStyle = "#e07b2a";
    ctx.beginPath();
    ctx.arc(0, -64, 26, 0, Math.PI * 2);
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(-22, -80); ctx.lineTo(-30, -104); ctx.lineTo(-8, -86); ctx.closePath();
    ctx.moveTo(22, -80); ctx.lineTo(30, -104); ctx.lineTo(8, -86); ctx.closePath();
    ctx.fill();
    // snout
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(0, -60); ctx.lineTo(26, -56); ctx.lineTo(0, -50); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(26, -56, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // the big count number, center stage
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 160px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.9;
    ctx.fillText(String(engine.countValue + 1), LOGICAL_W / 2, LOGICAL_H / 2);
    ctx.restore();
  }

  // ---- HUD: bars, meters, banners, flash ----
  drawHud(engine, player) {
    const ctx = this.ctx;
    const cfg = engine.cfg;

    // Player health (top-left) and opponent health (top-right)
    this._bar(20, 30, 200, 18, player.health / 100, "#6ddf7a", "#2a5a30");
    this._label(20, 22, "LARGE COCK", "left");
    this._bar(LOGICAL_W - 220, 30, 200, 18, engine.opp.health / engine.opp.maxHealth, "#ff6a6a", "#5a2a2a");
    this._label(LOGICAL_W - 20, 22, cfg.name.toUpperCase(), "right");

    // Opponent knockdown dots
    for (let i = 0; i < cfg.knockdownsToWin; i++) {
      ctx.fillStyle = i < engine.opp.knockdowns ? "#ffd24a" : "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(LOGICAL_W - 30 - i * 18, 60, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // boss phase
    if (cfg.phases > 1) {
      this._label(LOGICAL_W - 20, 70, "PHASE " + engine.opp.phase + "/" + cfg.phases, "right");
    }

    // Player knockdown dots (top-left under bar)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < player.knockdowns ? "#ff6a6a" : "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(30 + i * 18, 60, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Golden Egg meter — center-top (this is the special-attack tap zone)
    this._drawEggMeter(player, engine.elapsed);

    // Timer
    this._label(LOGICAL_W / 2, 130, this._fmtTime(engine.fightTime), "center", "rgba(255,255,255,0.7)", 16);

    // Stamina bar above the player
    this._bar(LOGICAL_W / 2 - 120, LOGICAL_H - 200, 240, 14, player.stamina / 100, "#4ab0ff", "#1d3a55");
    this._label(LOGICAL_W / 2, LOGICAL_H - 214, "PECK POWER", "center", "rgba(255,255,255,0.6)", 12);

    // Hit flash
    if (engine.fxFlash > 0) {
      ctx.fillStyle = `rgba(255,80,80,${engine.fxFlash * 0.35})`;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }

    // Banner
    if (engine.banner && engine.elapsed < engine.banner.until) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 64px sans-serif";
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#ffd24a";
      const y = LOGICAL_H / 2 - 120;
      ctx.strokeText(engine.banner.text, LOGICAL_W / 2, y);
      ctx.fillText(engine.banner.text, LOGICAL_W / 2, y);
      ctx.restore();
    }
  }

  _drawEggMeter(player, t) {
    const ctx = this.ctx;
    const cx = LOGICAL_W / 2;
    const cy = 70;
    const r = 34;
    const full = player.hasEgg();
    // ring background
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // fill arc
    ctx.strokeStyle = full ? "#ffd24a" : "#c9a227";
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (player.egg / 100) * Math.PI * 2);
    ctx.stroke();
    // egg
    ctx.fillStyle = full ? "#fff3c4" : "#9a8a55";
    if (full) {
      ctx.shadowColor = "#ffd24a";
      ctx.shadowBlur = 12 + Math.sin(t / 120) * 6;
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy, 16, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (full) {
      this._label(cx, cy + r + 6, "TAP!", "center", "#ffd24a", 13);
    } else {
      this._label(cx, cy + r + 6, "EGG", "center", "rgba(255,255,255,0.5)", 11);
    }
  }

  _bar(x, y, w, h, frac, fill, bg) {
    const ctx = this.ctx;
    frac = Math.max(0, Math.min(1, frac));
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w * frac, h);
  }

  _label(x, y, text, align = "left", color = "#fff", size = 14) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px sans-serif`;
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
