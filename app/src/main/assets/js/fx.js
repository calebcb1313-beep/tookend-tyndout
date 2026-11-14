/* TOOKEND TYNDOUT: PRODUCE BRAWL — particle & screen effects
   Pooled particles, impact layers, floating text, shockwaves, screen shake. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  const PALETTES = {
    citrus: ['#ffe14d', '#fff7b0', '#ffb13c', '#f6d431'],
    sauce: ['#e23b38', '#ff7a5c', '#a41f26', '#ffb3a2'],
    shade: ['#b06de0', '#e6c4ff', '#7b3fa8', '#3a1c52'],
    spud: ['#c99553', '#8b6435', '#e3c190', '#5d4222'],
    banana: ['#ffe14d', '#fff8c9', '#c99b0c', '#f5d13c'],
    chili: ['#ff8a3d', '#ffd166', '#d92c1c', '#ffe9a8'],
    onion: ['#9fe0ff', '#e8faff', '#cfe3f2', '#7bb8d6'],
    blueberry: ['#7f92ff', '#c3ccff', '#4257b8', '#66f0ff'],
    royal: ['#ffd25a', '#fff0a8', '#c9242c', '#ffb3a2'],
    neutral: ['#ffffff', '#ffd9a0', '#ffe14d', '#ffb3a2']
  };
  TT.PALETTES = PALETTES;

  /* cached additive glow sprite */
  let glowCache = null;
  function glowSprite() {
    if (glowCache) return glowCache;
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.25, 'rgba(255,255,255,0.62)');
    rg.addColorStop(0.6, 'rgba(255,255,255,0.16)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 96, 96);
    glowCache = c;
    return c;
  }

  const FX = TT.FX = {
    particles: [], texts: [], rings: [], slashes: [], trails: [],
    shakeAmt: 0, shakeDecay: 0.88, flashCol: '#ffffff', flashAmt: 0,
    quality: 'high', maxParticles: 340, freeze: 0, slow: 1,

    configure(quality) {
      this.quality = quality;
      this.maxParticles = quality === 'low' ? 110 : quality === 'medium' ? 210 : 340;
    },

    reset() {
      this.particles.length = 0; this.texts.length = 0; this.rings.length = 0;
      this.slashes.length = 0; this.trails.length = 0;
      this.shakeAmt = 0; this.flashAmt = 0; this.freeze = 0; this.slow = 1;
    },

    add(p) {
      if (this.particles.length >= this.maxParticles) {
        // recycle the oldest cheap particle
        const i = this.particles.findIndex(q => q.life < 10);
        if (i >= 0) this.particles.splice(i, 1);
        else return;
      }
      this.particles.push(p);
    },

    spark(x, y, n, style, power) {
      const pal = PALETTES[style] || PALETTES.neutral;
      const count = Math.round(n * (this.quality === 'low' ? 0.55 : this.quality === 'medium' ? 0.8 : 1));
      for (let i = 0; i < count; i++) {
        const a = rand(0, TAU), sp = rand(1.4, 6) * (power || 1);
        this.add({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
          g: rand(0.1, 0.36), drag: 0.965, life: rand(16, 34), max: 34,
          r: rand(1.4, 4.4), col: pick(pal), kind: 'spark', rot: rand(0, TAU)
        });
      }
    },

    juice(x, y, n, style, dir) {
      const pal = PALETTES[style] || PALETTES.neutral;
      for (let i = 0; i < n; i++) {
        const a = rand(-1.5, 1.5) + (dir < 0 ? Math.PI : 0);
        const sp = rand(2, 6.5);
        this.add({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.4,
          g: rand(0.24, 0.44), drag: 0.99, life: rand(20, 40), max: 40,
          r: rand(2.2, 5.4), col: pick(pal), kind: 'drop'
        });
      }
    },

    dust(x, y, n, dir) {
      for (let i = 0; i < n; i++) {
        const a = rand(-0.6, 0.6) + (dir === 1 ? 0 : Math.PI);
        this.add({
          x: x + rand(-14, 14), y: y - rand(0, 8),
          vx: Math.cos(a) * rand(0.6, 3), vy: rand(-1.9, -0.3),
          g: 0.02, drag: 0.92, life: rand(18, 36), max: 36,
          r: rand(3, 9), col: pick(['#d8c8ae', '#bfae94', '#efe3cf']),
          kind: 'smoke', alpha: 0.55
        });
      }
    },

    ember(x, y, n, style) {
      const pal = PALETTES[style] || PALETTES.chili;
      for (let i = 0; i < n; i++) {
        this.add({
          x: x + rand(-16, 16), y: y + rand(-16, 6),
          vx: rand(-1, 1), vy: rand(-3.6, -0.8), g: -0.02, drag: 0.98,
          life: rand(20, 46), max: 46, r: rand(1, 3.2), col: pick(pal), kind: 'spark', glow: true
        });
      }
    },

    shard(x, y, n, style, power) {
      const pal = PALETTES[style] || PALETTES.neutral;
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), sp = rand(3, 9) * (power || 1);
        this.add({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.4,
          g: 0.42, drag: 0.985, life: rand(24, 48), max: 48,
          r: rand(3, 8), col: pick(pal), kind: 'shard', rot: rand(0, TAU),
          spin: rand(-0.3, 0.3)
        });
      }
    },

    ring(x, y, color, radius, width) {
      this.rings.push({ x, y, r: 6, max: radius, col: color, w: width || 5, life: 20, maxLife: 20 });
    },

    slash(x, y, angle, color, size) {
      this.slashes.push({ x, y, a: angle, col: color, size: size || 60, life: 9, maxLife: 9 });
    },

    text(x, y, str, color, size, kind) {
      this.texts.push({
        x, y, str, col: color || '#fff', size: size || 22, life: 46, maxLife: 46,
        vy: -1.1, kind: kind || 'dmg', scale: 0
      });
    },

    trail(x, y, r, col, life) {
      this.trails.push({ x, y, r, col, life: life || 12, maxLife: life || 12 });
    },

    shake(amount) { this.shakeAmt = Math.min(26, this.shakeAmt + amount); },
    flash(color, amount) {
      this.flashCol = color || '#ffffff';
      this.flashAmt = Math.max(this.flashAmt, amount == null ? 0.5 : amount);
    },

    update() {
      const P = this.particles;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
        p.x += p.vx; p.y += p.vy;
        p.life--;
        if (p.kind === 'shard') p.rot += p.spin;
        if (p.life <= 0) P.splice(i, 1);
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.y += t.vy; t.vy *= 0.97; t.life--; t.scale = Math.min(1, t.scale + 0.22);
        if (t.life <= 0) this.texts.splice(i, 1);
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.r += (r.max - r.r) * 0.24; r.life--;
        if (r.life <= 0) this.rings.splice(i, 1);
      }
      for (let i = this.slashes.length - 1; i >= 0; i--) {
        this.slashes[i].life--;
        if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
      }
      for (let i = this.trails.length - 1; i >= 0; i--) {
        const t = this.trails[i]; t.life -= 1;
        if (t.life <= 0) this.trails.splice(i, 1);
      }
      this.shakeAmt *= this.shakeDecay;
      if (this.shakeAmt < 0.15) this.shakeAmt = 0;
      this.flashAmt *= 0.86;
      if (this.flashAmt < 0.01) this.flashAmt = 0;
    },

    drawShake(ctx) {
      if (!this.shakeAmt) return;
      ctx.translate(rand(-this.shakeAmt, this.shakeAmt) * 0.6, rand(-this.shakeAmt, this.shakeAmt) * 0.45);
    },

    drawWorld(ctx) {
      const glow = glowSprite();
      // motion trails
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const t of this.trails) {
        ctx.globalAlpha = (t.life / t.maxLife) * 0.5;
        ctx.drawImage(glow, t.x - t.r * 2, t.y - t.r * 2, t.r * 4, t.r * 4);
      }
      ctx.restore();

      for (const p of this.particles) {
        const a = Math.min(1, p.life / (p.max * 0.5));
        ctx.save();
        ctx.globalAlpha = a * (p.alpha || 1);
        if (p.kind === 'spark' && p.glow) ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.col;
        if (p.kind === 'shard') {
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.moveTo(-p.r, -p.r * 0.6); ctx.lineTo(p.r * 0.8, -p.r); ctx.lineTo(p.r, p.r * 0.7); ctx.lineTo(-p.r * 0.7, p.r);
          ctx.closePath(); ctx.fill();
        } else if (p.kind === 'smoke') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + (1 - p.life / p.max) * 1.4), 0, TAU); ctx.fill();
        } else if (p.kind === 'drop') {
          ctx.translate(p.x, p.y);
          const ang = Math.atan2(p.vy, p.vx);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.5, p.r, 0, 0, TAU);
          ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }

      // shockwave rings
      for (const r of this.rings) {
        const t = 1 - r.life / r.maxLife;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.8;
        ctx.strokeStyle = r.col;
        ctx.lineWidth = r.w * (1 - t * 0.6);
        ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.62, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }

      // melee arcs
      for (const s of this.slashes) {
        const t = 1 - s.life / s.maxLife;
        ctx.save();
        ctx.translate(s.x, s.y); ctx.rotate(s.a);
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.strokeStyle = s.col;
        ctx.lineWidth = 9 * (1 - t * 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, s.size * (0.7 + t * 0.5), -0.9, 0.9);
        ctx.stroke();
        ctx.globalAlpha = (1 - t) * 0.35;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, s.size * (0.7 + t * 0.5), -0.7, 0.7); ctx.stroke();
        ctx.restore();
      }
    },

    drawText(ctx) {
      for (const t of this.texts) {
        const a = Math.min(1, t.life / 14);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(t.x, t.y);
        const sc = t.kind === 'dmg' ? 0.7 + t.scale * 0.4 : t.scale;
        ctx.scale(sc, sc);
        ctx.font = `900 ${t.size}px "Trebuchet MS", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(18,10,26,0.85)';
        ctx.strokeText(t.str, 0, 0);
        ctx.fillStyle = t.col;
        ctx.fillText(t.str, 0, 0);
        ctx.restore();
      }
    },

    drawFlash(ctx, w, h) {
      if (this.flashAmt > 0.01) {
        ctx.save();
        ctx.globalAlpha = this.flashAmt * 0.6;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = this.flashCol;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
  };

  const local = document.createElement('canvas');
})();
