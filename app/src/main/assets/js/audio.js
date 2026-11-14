/* TOOKEND TYNDOUT: PRODUCE BRAWL — audio engine
   Fully synthesized (oscillators + noise) so the APK needs no external audio files. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const A = TT.Audio = {
    ctx: null, master: null, musicBus: null, sfxBus: null, comp: null,
    ready: false, musicVol: 0.55, sfxVol: 0.8, muted: false,
    _music: null, _musicTimer: null, _style: null,

    init() {
      if (this.ctx) return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        this.ctx = new AC();
        this.comp = this.ctx.createDynamicsCompressor();
        this.comp.threshold.value = -14; this.comp.knee.value = 18; this.comp.ratio.value = 5;
        this.master = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        this.musicBus.connect(this.comp); this.sfxBus.connect(this.comp);
        this.comp.connect(this.master); this.master.connect(this.ctx.destination);
        this.applyVolumes();
        this.ready = true;
        this._noiseBuf = this._makeNoise(1.2);
      } catch (e) { console.warn('audio unavailable', e); }
      return this.ctx;
    },

    unlock() {
      const ctx = this.init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },

    applyVolumes() {
      if (!this.ctx) return;
      const m = this.muted ? 0 : 1;
      this.master.gain.value = 0.9 * m;
      this.musicBus.gain.value = this.musicVol * 0.5;
      this.sfxBus.gain.value = this.sfxVol * 0.9;
    },
    setMusic(v) { this.musicVol = clamp(v, 0, 1); this.applyVolumes(); },
    setSfx(v) { this.sfxVol = clamp(v, 0, 1); this.applyVolumes(); },
    setMuted(v) { this.muted = !!v; this.applyVolumes(); },

    _makeNoise(sec) {
      const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    },

    /* ---------- primitive voices ---------- */
    tone(o) {
      if (!this.ready || this.muted) return;
      const ctx = this.ctx, t = ctx.currentTime + (o.delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      osc.type = o.type || 'square';
      osc.frequency.setValueAtTime(o.freq, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.dur || 0.16));
      f.type = o.filter || 'lowpass';
      f.frequency.setValueAtTime(o.cut || 2400, t);
      if (o.cutTo) f.frequency.exponentialRampToValueAtTime(Math.max(80, o.cutTo), t + (o.dur || 0.16));
      f.Q.value = o.q || 1;
      const v = (o.vol == null ? 0.2 : o.vol);
      const atk = o.attack == null ? 0.006 : o.attack;
      const dur = o.dur || 0.16;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(f); f.connect(g); g.connect(this.sfxBus);
      osc.start(t); osc.stop(t + dur + 0.03);
    },

    noise(o) {
      if (!this.ready || this.muted) return;
      const ctx = this.ctx, t = ctx.currentTime + (o.delay || 0);
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      src.playbackRate.value = o.rate || 1;
      const f = ctx.createBiquadFilter();
      f.type = o.filter || 'bandpass';
      f.frequency.setValueAtTime(o.freq || 1200, t);
      if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(80, o.to), t + (o.dur || 0.2));
      f.Q.value = o.q == null ? 1.2 : o.q;
      const g = ctx.createGain();
      const dur = o.dur || 0.2, v = o.vol == null ? 0.18 : o.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + (o.attack || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxBus);
      src.start(t); src.stop(t + dur + 0.02);
    },

    /* ---------- sound design ---------- */
    sfx(name, opt) {
      if (!this.ready || this.muted) return;
      opt = opt || {};
      const p = opt.pitch || 1;
      switch (name) {
        case 'ui':
          this.tone({ freq: 640 * p, to: 880 * p, dur: 0.07, type: 'square', vol: 0.09, cut: 3200 });
          break;
        case 'select':
          this.tone({ freq: 520 * p, to: 780 * p, dur: 0.09, type: 'triangle', vol: 0.14, cut: 3000 });
          this.tone({ freq: 1040 * p, dur: 0.12, type: 'sine', vol: 0.08, delay: 0.05 });
          break;
        case 'cancel':
          this.tone({ freq: 380 * p, to: 210 * p, dur: 0.12, type: 'square', vol: 0.1 });
          break;
        case 'jump':
          this.tone({ freq: 260 * p, to: 620 * p, dur: 0.14, type: 'triangle', vol: 0.12, cut: 2600 });
          break;
        case 'land':
          this.noise({ freq: 260, to: 90, dur: 0.16, vol: 0.16, filter: 'lowpass' });
          break;
        case 'dash':
          this.noise({ freq: 900, to: 2400, dur: 0.16, vol: 0.12, filter: 'bandpass', q: 2 });
          break;
        case 'light':
          this.noise({ freq: 1500 * p, to: 500, dur: 0.1, vol: 0.12, q: 0.8 });
          this.tone({ freq: 320 * p, to: 160, dur: 0.08, type: 'square', vol: 0.06 });
          break;
        case 'heavy':
          this.noise({ freq: 700 * p, to: 120, dur: 0.24, vol: 0.24, filter: 'lowpass' });
          this.tone({ freq: 150 * p, to: 60, dur: 0.2, type: 'sawtooth', vol: 0.16, cut: 900 });
          break;
        case 'block':
          this.tone({ freq: 1200 * p, to: 700, dur: 0.1, type: 'square', vol: 0.1, cut: 4000 });
          this.noise({ freq: 2600, to: 1400, dur: 0.08, vol: 0.1, filter: 'highpass' });
          break;
        case 'whoosh':
          this.noise({ freq: 400, to: 1600, dur: 0.18, vol: 0.08, filter: 'bandpass', q: 1.6 });
          break;
        case 'projectile':
          this.tone({ freq: 720 * p, to: 300 * p, dur: 0.18, type: 'sawtooth', vol: 0.1, cut: 2200 });
          this.noise({ freq: 1800, to: 600, dur: 0.16, vol: 0.07 });
          break;
        case 'impact':
          this.noise({ freq: 1200, to: 200, dur: 0.22, vol: 0.22 });
          this.tone({ freq: 220, to: 70, dur: 0.18, type: 'square', vol: 0.12, cut: 1200 });
          break;
        case 'blocked':
          this.noise({ freq: 3200, to: 1200, dur: 0.12, vol: 0.14, filter: 'highpass' });
          break;
        case 'ko':
          this.tone({ freq: 300, to: 60, dur: 0.8, type: 'sawtooth', vol: 0.2, cut: 1400 });
          this.noise({ freq: 500, to: 80, dur: 0.7, vol: 0.24, filter: 'lowpass' });
          break;
        case 'super':
          this.tone({ freq: 180, to: 900, dur: 0.45, type: 'sawtooth', vol: 0.16, cut: 900, cutTo: 5000 });
          this.noise({ freq: 400, to: 4000, dur: 0.5, vol: 0.14, filter: 'bandpass', q: 1.4 });
          this.tone({ freq: 90, to: 40, dur: 0.5, type: 'sine', vol: 0.2 });
          break;
        case 'superHit':
          this.noise({ freq: 900, to: 90, dur: 0.5, vol: 0.3, filter: 'lowpass' });
          this.tone({ freq: 120, to: 40, dur: 0.45, type: 'square', vol: 0.16, cut: 800 });
          break;
        case 'meter':
          this.tone({ freq: 880, to: 1320, dur: 0.14, type: 'sine', vol: 0.1 });
          break;
        case 'win':
          [0, 0.11, 0.22, 0.36].forEach((d, i) => {
            this.tone({ freq: [523, 659, 784, 1046][i], dur: 0.3, type: 'triangle', vol: 0.16, delay: d, cut: 4000 });
          });
          break;
        case 'lose':
          [0, 0.15, 0.32].forEach((d, i) => {
            this.tone({ freq: [392, 311, 233][i], dur: 0.4, type: 'triangle', vol: 0.14, delay: d, cut: 2000 });
          });
          break;
        case 'round':
          this.tone({ freq: 440, dur: 0.16, type: 'square', vol: 0.12, cut: 3000 });
          this.tone({ freq: 660, dur: 0.22, type: 'square', vol: 0.1, delay: 0.14, cut: 3000 });
          break;
        case 'fight':
          this.tone({ freq: 330, to: 660, dur: 0.35, type: 'sawtooth', vol: 0.16, cut: 3000 });
          this.noise({ freq: 800, to: 3000, dur: 0.3, vol: 0.12 });
          break;
        case 'combo':
          this.tone({ freq: 700 + (opt.n || 1) * 90, dur: 0.08, type: 'square', vol: 0.08, cut: 4000 });
          break;
        /* character flavoured projectile sounds */
        case 'citrus': this.tone({ freq: 900 * p, to: 1700 * p, dur: 0.16, type: 'square', vol: 0.1, cut: 5000 }); this.noise({ freq: 2600, to: 900, dur: 0.14, vol: 0.06 }); break;
        case 'sauce': this.noise({ freq: 500, to: 150, dur: 0.28, vol: 0.2, filter: 'lowpass' }); this.tone({ freq: 190, to: 90, dur: 0.22, type: 'sine', vol: 0.14 }); break;
        case 'shade': this.tone({ freq: 260, to: 820, dur: 0.28, type: 'sine', vol: 0.12 }); this.tone({ freq: 130, to: 60, dur: 0.3, type: 'triangle', vol: 0.1, delay: 0.03 }); break;
        case 'spud': this.tone({ freq: 120, to: 55, dur: 0.24, type: 'square', vol: 0.16, cut: 700 }); this.noise({ freq: 340, to: 120, dur: 0.24, vol: 0.14 }); break;
        case 'banana': this.tone({ freq: 620, to: 1120, dur: 0.16, type: 'triangle', vol: 0.12 }); this.tone({ freq: 940, to: 620, dur: 0.16, type: 'sine', vol: 0.08, delay: 0.05 }); break;
        case 'chili': this.noise({ freq: 1600, to: 400, dur: 0.3, vol: 0.16, filter: 'bandpass', q: 0.9 }); this.tone({ freq: 300, to: 120, dur: 0.2, type: 'sawtooth', vol: 0.08 }); break;
        case 'onion': this.tone({ freq: 1300, to: 460, dur: 0.22, type: 'sine', vol: 0.14 }); break;
        case 'blueberry': this.tone({ freq: 1400, to: 2600, dur: 0.1, type: 'square', vol: 0.08, cut: 6000 }); break;
        case 'royal': this.tone({ freq: 220, to: 420, dur: 0.26, type: 'sawtooth', vol: 0.14, cut: 2200 }); this.tone({ freq: 520, dur: 0.2, type: 'triangle', vol: 0.1, delay: 0.04 }); break;
        case 'hurt': this.tone({ freq: 300 * p, to: 140, dur: 0.16, type: 'sawtooth', vol: 0.12, cut: 1400 }); break;
        case 'hurtBig': this.tone({ freq: 220 * p, to: 70, dur: 0.32, type: 'sawtooth', vol: 0.16, cut: 1000 }); this.noise({ freq: 700, to: 120, dur: 0.3, vol: 0.16 }); break;
        case 'counter': this.tone({ freq: 1600, to: 900, dur: 0.2, type: 'square', vol: 0.13, cut: 6000 }); break;
        default: this.tone({ freq: 440, dur: 0.1, vol: 0.08 });
      }
    },

    /* ---------- music ---------- */
    startMusic(arena, boss) {
      if (!this.ready) return;
      this.stopMusic();
      const cfg = (arena && arena.music) || { tempo: 120, root: 45, mode: 'dorian', style: 'market' };
      const scales = {
        dorian: [0, 2, 3, 5, 7, 9, 10],
        minor: [0, 2, 3, 5, 7, 8, 10],
        phrygian: [0, 1, 3, 5, 7, 8, 10]
      };
      const rootMidi = cfg.root;
      const scale = scales[cfg.mode] || scales.dorian;
      const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
      const step = 60 / (boss ? cfg.tempo + 10 : cfg.tempo) / 2; // eighth notes
      const progs = {
        market: [0, 5, 3, 4], rooftop: [0, 3, 5, 4], kitchen: [0, 1, 5, 0]
      };
      const prog = progs[cfg.style] || progs.market;
      const M = this._music = { step: 0, next: this.ctx.currentTime + 0.1, playing: true, boss: !!boss };
      const totalVol = 0.5;
      const playStep = (i, when) => {
        const bar = Math.floor(i / 8) % prog.length;
        const chordRoot = rootMidi + prog[bar];
        const beat = i % 8;
        const ctx = this.ctx;
        const voice = (freq, type, dur, vol, filt, slideTo) => {
          const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
          o.type = type; o.frequency.setValueAtTime(freq, when);
          if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
          f.type = 'lowpass'; f.frequency.value = filt; f.Q.value = 0.8;
          g.gain.setValueAtTime(0.0001, when);
          g.gain.linearRampToValueAtTime(vol, when + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
          o.connect(f); f.connect(g); g.connect(this.musicBus);
          o.start(when); o.stop(when + dur + 0.02);
        };
        const bassNotes = [0, 0, 0, 0, 7, 0, 5, 0];
        if (beat % 2 === 0) {
          voice(mtof(chordRoot - 12 + bassNotes[beat]), 'triangle', step * 1.8, 0.26 * totalVol, 700);
        }
        // chord stab on the backbeat
        if (beat === 2 || beat === 6) {
          [0, 2, 4].forEach((d, k) => {
            voice(mtof(chordRoot + scale[d] + 12), 'square', step * 1.1, 0.045 * totalVol, 1800);
          });
        }
        // arp/melody
        const arp = [0, 2, 4, 2, 5, 4, 2, 0];
        if (beat % 1 === 0 && (i % 4 !== 3)) {
          const deg = arp[(i + bar) % arp.length];
          const oct = (i % 16 < 8) ? 24 : 12;
          voice(mtof(chordRoot + scale[deg % scale.length] + oct), cfg.style === 'kitchen' ? 'square' : 'triangle', step * 0.95, 0.07 * totalVol, 3500);
        }
        // drums
        if (beat === 0 || beat === 4) {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(150, when);
          o.frequency.exponentialRampToValueAtTime(48, when + 0.16);
          g.gain.setValueAtTime(0.28 * totalVol, when);
          g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
          o.connect(g); g.connect(this.musicBus); o.start(when); o.stop(when + 0.22);
        }
        if (beat === 2 || beat === 6) {
          const src = ctx.createBufferSource(); src.buffer = this._noiseBuf;
          const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.1 * totalVol, when);
          g.gain.exponentialRampToValueAtTime(0.0001, when + 0.13);
          src.connect(f); f.connect(g); g.connect(this.musicBus);
          src.start(when); src.stop(when + 0.15);
        }
        if (beat % 2 === 1) {
          const src = ctx.createBufferSource(); src.buffer = this._noiseBuf;
          const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.045 * totalVol, when);
          g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
          src.connect(f); f.connect(g); g.connect(this.musicBus);
          src.start(when); src.stop(when + 0.06);
        }
      };
      const schedule = () => {
        if (!M.playing) return;
        const ctx = this.ctx;
        while (M.next < ctx.currentTime + 0.4) {
          playStep(M.step, M.next);
          M.step++;
          M.next += step;
        }
      };
      schedule();
      this._musicTimer = setInterval(schedule, 120);
    },

    stopMusic() {
      if (this._music) this._music.playing = false;
      this._music = null;
      if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
    }
  };

  /* Cross-file convenience wrappers (game.js calls TT.sfx etc.) */
  TT.sfx = function (n, o) { A.sfx(n, o); };
})();
