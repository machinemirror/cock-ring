// All sound is synthesized with the Web Audio API — no audio files, so the game
// stays asset-free and works straight off GitHub Pages. The context is created
// lazily and resumed on the first user gesture (mobile autoplay policy).
export class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  // Call from a user gesture so mobile browsers allow playback.
  resume() {
    this._ensure();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  _tone({ freq = 440, type = "square", dur = 0.12, gain = 0.3, slideTo = null, delay = 0 }) {
    if (this.muted) return;
    this._ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise({ dur = 0.15, gain = 0.3, delay = 0 }) {
    if (this.muted) return;
    this._ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  // ---- Named cues used by the game ----
  peck() { this._tone({ freq: 520, type: "square", dur: 0.06, gain: 0.18 }); }
  hit() { this._noise({ dur: 0.12, gain: 0.28 }); this._tone({ freq: 180, type: "sawtooth", dur: 0.1, gain: 0.2, slideTo: 90 }); }
  block() { this._tone({ freq: 320, type: "square", dur: 0.05, gain: 0.12 }); }
  counter() { this._tone({ freq: 660, type: "square", dur: 0.09, gain: 0.25, slideTo: 990 }); }
  dodge() { this._tone({ freq: 760, type: "sine", dur: 0.07, gain: 0.12, slideTo: 980 }); }
  special() {
    this._tone({ freq: 440, type: "square", dur: 0.18, gain: 0.28, slideTo: 1320 });
    this._tone({ freq: 660, type: "square", dur: 0.22, gain: 0.2, slideTo: 1760, delay: 0.05 });
  }
  knockdown() { this._noise({ dur: 0.3, gain: 0.4 }); this._tone({ freq: 140, type: "sawtooth", dur: 0.3, gain: 0.3, slideTo: 60 }); }
  count() { this._tone({ freq: 880, type: "sine", dur: 0.1, gain: 0.18 }); }
  bell() {
    this._tone({ freq: 990, type: "sine", dur: 0.5, gain: 0.3 });
    this._tone({ freq: 1320, type: "sine", dur: 0.5, gain: 0.2, delay: 0.02 });
  }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone({ freq: f, type: "square", dur: 0.16, gain: 0.22, delay: i * 0.12 }));
  }
  lose() {
    [392, 330, 262].forEach((f, i) => this._tone({ freq: f, type: "sawtooth", dur: 0.25, gain: 0.22, delay: i * 0.16 }));
  }
}
