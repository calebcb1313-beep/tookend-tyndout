/* TOOKEND TYNDOUT: PRODUCE BRAWL — character renderer
   Ink-outlined produce fighters with layered shading, skin textures, faces and costumes. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};
  const TAU = Math.PI * 2;
  const Art = TT.Art = TT.Art || {};
  const INK = '#1a1018';
  const cache = {};
  const gradCache = {};

  /* ---------------------------------------------------------------- */
  /* Body silhouettes (Path2D in local space, feet at 0,0, height ~ -96) */
  /* ---------------------------------------------------------------- */
  function lumpyPath(points) {
    const p = new Path2D();
    // points: [{x,y}] around the shape; smooth through midpoints
    const n = points.length;
    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    let m0 = mid(points[n - 1], points[0]);
    p.moveTo(m0.x, m0.y);
    for (let i = 0; i < n; i++) {
      const cur = points[i], next = points[(i + 1) % n], m = mid(cur, next);
      p.quadraticCurveTo(cur.x, cur.y, m.x, m.y);
    }
    p.closePath();
    return p;
  }

  const SHAPES = {
    lemon: () => {
      const p = new Path2D();
      p.moveTo(0, -96);
      p.bezierCurveTo(24, -92, 38, -74, 37, -52);
      p.bezierCurveTo(36, -28, 24, -12, 0, -11);
      p.bezierCurveTo(-24, -12, -36, -28, -37, -52);
      p.bezierCurveTo(-38, -74, -24, -92, 0, -96);
      p.closePath();
      return p;
    },
    tomato: () => {
      const p = new Path2D();
      p.moveTo(0, -86);
      p.bezierCurveTo(34, -86, 48, -66, 47, -46);
      p.bezierCurveTo(46, -20, 28, -8, 0, -8);
      p.bezierCurveTo(-28, -8, -46, -20, -47, -46);
      p.bezierCurveTo(-48, -66, -34, -86, 0, -86);
      p.closePath();
      return p;
    },
    eggplant: () => {
      const p = new Path2D();
      p.moveTo(0, -100);
      p.bezierCurveTo(13, -98, 22, -90, 25, -78);
      p.bezierCurveTo(32, -58, 34, -32, 22, -16);
      p.bezierCurveTo(14, -6, -14, -6, -22, -16);
      p.bezierCurveTo(-34, -32, -32, -58, -25, -78);
      p.bezierCurveTo(-22, -90, -13, -98, 0, -100);
      p.closePath();
      return p;
    },
    spud: () => lumpyPath([
      { x: -6, y: -90 }, { x: 20, y: -88 }, { x: 36, y: -76 }, { x: 44, y: -56 },
      { x: 40, y: -34 }, { x: 28, y: -14 }, { x: 6, y: -8 }, { x: -16, y: -12 },
      { x: -34, y: -30 }, { x: -42, y: -52 }, { x: -36, y: -74 }, { x: -20, y: -88 }
    ]),
    banana: () => {
      const p = new Path2D();
      p.moveTo(-16, -96);
      p.bezierCurveTo(10, -90, 26, -68, 30, -44);
      p.bezierCurveTo(33, -24, 28, -12, 18, -10);
      p.bezierCurveTo(6, -8, -2, -20, -8, -40);
      p.bezierCurveTo(-16, -64, -24, -82, -30, -92);
      p.bezierCurveTo(-26, -98, -22, -98, -16, -96);
      p.closePath();
      return p;
    },
    chili: () => {
      const p = new Path2D();
      p.moveTo(2, -98);
      p.bezierCurveTo(16, -94, 22, -80, 20, -64);
      p.bezierCurveTo(18, -44, 24, -26, 34, -14);
      p.bezierCurveTo(38, -8, 30, -4, 18, -10);
      p.bezierCurveTo(2, -18, -10, -36, -12, -58);
      p.bezierCurveTo(-14, -78, -10, -92, 2, -98);
      p.closePath();
      return p;
    },
    onion: () => {
      const p = new Path2D();
      p.moveTo(0, -92);
      p.bezierCurveTo(20, -92, 36, -78, 38, -58);
      p.bezierCurveTo(40, -30, 24, -10, 0, -10);
      p.bezierCurveTo(-24, -10, -40, -30, -38, -58);
      p.bezierCurveTo(-36, -78, -20, -92, 0, -92);
      p.closePath();
      return p;
    },
    blueberry: () => {
      const p = new Path2D();
      p.moveTo(0, -70);
      p.bezierCurveTo(20, -70, 28, -58, 28, -44);
      p.bezierCurveTo(28, -24, 18, -10, 0, -10);
      p.bezierCurveTo(-18, -10, -28, -24, -28, -44);
      p.bezierCurveTo(-28, -58, -20, -70, 0, -70);
      p.closePath();
      return p;
    },
    king: () => {
      const p = new Path2D();
      p.moveTo(0, -98);
      p.bezierCurveTo(42, -98, 58, -76, 56, -52);
      p.bezierCurveTo(54, -22, 32, -6, 0, -6);
      p.bezierCurveTo(-32, -6, -54, -22, -56, -52);
      p.bezierCurveTo(-58, -76, -42, -98, 0, -98);
      p.closePath();
      return p;
    }
  };

  const METRICS = {
    lemon: { cy: -54, rx: 37, ry: 43, faceY: -60, eyeX: 13, eyeY: -2, mouthY: 14, legY: -8, legX: 13, armX: 34, armY: -46, shadow: 40 },
    tomato: { cy: -48, rx: 47, ry: 40, faceY: -54, eyeX: 16, eyeY: -2, mouthY: 13, legY: -7, legX: 18, armX: 44, armY: -42, shadow: 52 },
    eggplant: { cy: -56, rx: 31, ry: 45, faceY: -62, eyeX: 11, eyeY: -1, mouthY: 14, legY: -6, legX: 12, armX: 28, armY: -46, shadow: 39 },
    spud: { cy: -50, rx: 43, ry: 41, faceY: -58, eyeX: 14, eyeY: -2, mouthY: 12, legY: -8, legX: 17, armX: 40, armY: -42, shadow: 56 },
    banana: { cy: -54, rx: 30, ry: 46, faceY: -62, eyeX: 11, eyeY: -1, mouthY: 15, legY: -8, legX: 11, armX: 26, armY: -46, shadow: 39 },
    chili: { cy: -54, rx: 25, ry: 46, faceY: -64, eyeX: 10, eyeY: -1, mouthY: 16, legY: -6, legX: 10, armX: 24, armY: -48, shadow: 36 },
    onion: { cy: -50, rx: 38, ry: 41, faceY: -56, eyeX: 13, eyeY: -2, mouthY: 12, legY: -10, legX: 15, armX: 34, armY: -42, shadow: 47 },
    blueberry: { cy: -40, rx: 28, ry: 30, faceY: -46, eyeX: 10, eyeY: -1, mouthY: 10, legY: -8, legX: 10, armX: 26, armY: -34, shadow: 33 },
    king: { cy: -54, rx: 56, ry: 47, faceY: -60, eyeX: 19, eyeY: -2, mouthY: 16, legY: -4, legX: 22, armX: 53, armY: -48, shadow: 66 }
  };

  /* ---------------------------------------------------------------- */
  /* Texture patterns (small, tiled, cached)                           */
  /* ---------------------------------------------------------------- */
  function makeTexture(kind, col) {
    const key = kind + col;
    if (cache[key]) return cache[key];
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    let seed = 1337;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.clearRect(0, 0, size, size);
    if (kind === 'pores') {
      for (let i = 0; i < 90; i++) {
        const x = rnd() * size, y = rnd() * size, r = 0.5 + rnd() * 1.2;
        g.fillStyle = col; g.globalAlpha = 0.25 + rnd() * 0.3;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    } else if (kind === 'speckle') {
      for (let i = 0; i < 70; i++) {
        const x = rnd() * size, y = rnd() * size, r = 0.6 + rnd() * 1.6;
        g.fillStyle = col; g.globalAlpha = 0.3 + rnd() * 0.4;
        g.beginPath(); g.ellipse(x, y, r, r * 0.7, rnd() * TAU, 0, TAU); g.fill();
      }
    } else if (kind === 'freckle') {
      for (let i = 0; i < 34; i++) {
        const x = rnd() * size, y = rnd() * size, r = 0.8 + rnd() * 1.5;
        g.fillStyle = col; g.globalAlpha = 0.35 + rnd() * 0.45;
        g.beginPath(); g.ellipse(x, y, r, r * 0.8, rnd() * TAU, 0, TAU); g.fill();
      }
    } else if (kind === 'powder') {
      for (let i = 0; i < 120; i++) {
        const x = rnd() * size, y = rnd() * size, r = 0.7 + rnd() * 1.4;
        g.fillStyle = rnd() > 0.5 ? col : '#ffffff';
        g.globalAlpha = 0.06 + rnd() * 0.1;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    } else if (kind === 'fibre') {
      for (let i = 0; i < 40; i++) {
        const x = rnd() * size, y = rnd() * size;
        g.strokeStyle = col; g.globalAlpha = 0.12 + rnd() * 0.18;
        g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 12, y + (rnd() - 0.5) * 6); g.stroke();
      }
    }
    const pat = g.canvas;
    cache[key] = pat;
    return pat;
  }

  const TEX = {
    lemon: { kind: 'pores', col: '#a8770a', alpha: 0.55, scale: 1 },
    tomato: { kind: 'pores', col: '#8a1418', alpha: 0.3, scale: 1.4 },
    eggplant: { kind: 'fibre', col: '#2c0f4a', alpha: 0.25, scale: 1 },
    spud: { kind: 'speckle', col: '#5a3a18', alpha: 0.75, scale: 0.8 },
    banana: { kind: 'freckle', col: '#8a6410', alpha: 0.5, scale: 1.2 },
    chili: { kind: 'fibre', col: '#7d0f08', alpha: 0.22, scale: 1 },
    onion: { kind: 'fibre', col: '#a9885c', alpha: 0.3, scale: 1.6 },
    blueberry: { kind: 'powder', col: '#a9b8f5', alpha: 0.55, scale: 1 },
    king: { kind: 'pores', col: '#6d0c14', alpha: 0.3, scale: 1.2 }
  };

  /* ---------------------------------------------------------------- */
  /* Public: colours with skin overrides                              */
  /* ---------------------------------------------------------------- */
  Art.palette = function (char, skinIndex) {
    const skin = char.skins && char.skins[skinIndex || 0];
    const ov = (skin && skin.colors) || {};
    const c = Object.assign({}, char.colors);
    Object.keys(ov).forEach(k => { c[k] = ov[k]; });
    return c;
  };

  function gradient(ctx, col, rx, ry, cy, boost) {
    const g = ctx.createLinearGradient(-rx * 0.7, cy - ry, rx * 0.9, cy + ry);
    g.addColorStop(0, col.light);
    g.addColorStop(0.42, col.base);
    g.addColorStop(1, col.dark);
    return g;
  }

  /* ---------------------------------------------------------------- */
  /* Drawing helpers                                                  */
  /* ---------------------------------------------------------------- */
  function inkPath(ctx, path, fill, lw, col) {
    ctx.fillStyle = fill;
    ctx.fill(path);
    if (lw) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = col || INK;
      ctx.lineJoin = 'round';
      ctx.stroke(path);
    }
  }

  function limb(ctx, x0, y0, angle, len, width, col, opts) {
    opts = opts || {};
    const x1 = x0 + Math.sin(angle) * len;
    const y1 = y0 + Math.cos(angle) * len;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = width + 6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    // hand / fist
    const hr = opts.hand == null ? width * 0.62 : opts.hand;
    ctx.beginPath(); ctx.arc(x1, y1, hr + 3, 0, TAU);
    ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(x1, y1, hr, 0, TAU);
    ctx.fillStyle = opts.handCol || col; ctx.fill();
    ctx.beginPath(); ctx.arc(x1 - hr * 0.3, y1 - hr * 0.35, hr * 0.34, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x1, y1, hr, 0, TAU); ctx.stroke();
    return { x: x1, y: y1 };
  }

  function foot(ctx, x, y, w, col) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * 0.55, 0, 0, TAU);
    ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 1, w - 2, w * 0.45, 0, 0, TAU);
    ctx.fillStyle = col; ctx.fill();
  }

  /* ---------------------------------------------------------------- */
  /* Faces                                                            */
  /* ---------------------------------------------------------------- */
  function drawFace(ctx, f, m, col, t) {
    const p = f.pose;
    const cx = 0, cy = m.faceY + (p.headY || 0);
    const eyeX = m.eyeX, eyeY = m.eyeY;
    const blink = p.blink ? 1 : 0;
    const open = Math.max(0.08, (p.eyeOpen == null ? 1 : p.eyeOpen) * (blink ? 0.08 : 1));
    const look = p.look || { x: 0, y: 0 };
    const angry = p.brow == null ? 0 : p.brow;      // -1 sad .. 1 angry
    const squint = p.squint || 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.headTilt || 0);

    // eye whites
    const ew = 10.5, eh = 12.5 * open;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.ellipse(s * eyeX, eyeY, ew, eh, 0, 0, TAU);
      ctx.fillStyle = '#fff8f0';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      // pupil
      const px = s * eyeX + look.x * 3.2;
      const py = eyeY + look.y * 2.6;
      ctx.beginPath();
      ctx.ellipse(px, py, 5.4, Math.max(2.4, 6.1 * open), 0, 0, TAU);
      ctx.fillStyle = col.eye;
      ctx.fill();
      // glint
      ctx.beginPath();
      ctx.arc(px - 1.6, py - 2.4, 1.7, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();
      // upper lid
      if (open < 0.95 || squint) {
        ctx.beginPath();
        ctx.moveTo(s * eyeX - ew, eyeY - eh * 0.4);
        ctx.quadraticCurveTo(s * eyeX, eyeY - eh - 2, s * eyeX + ew, eyeY - eh * 0.4);
        ctx.fillStyle = col.base;
        ctx.fill();
      }
    });

    // brows
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    const browY = eyeY - 15;
    [-1, 1].forEach(s => {
      const inner = s * (eyeX - 7);
      const outer = s * (eyeX + 8);
      const tilt = angry * 5.5 * s;
      ctx.beginPath();
      ctx.moveTo(outer, browY + tilt * 0.4 + 4);
      ctx.quadraticCurveTo(s * eyeX, browY - 3 + tilt, inner, browY + 1 + tilt);
      ctx.stroke();
    });

    // mouth
    const mouth = p.mouth || 'neutral';
    ctx.save();
    ctx.translate(0, m.mouthY + (p.mouthY || 0));
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = INK;
    ctx.fillStyle = '#4a1420';
    if (mouth === 'open' || mouth === 'shout') {
      const h = mouth === 'shout' ? 10 : 7;
      ctx.beginPath();
      ctx.ellipse(0, 0, mouth === 'shout' ? 8.5 : 6.5, h, 0, 0, TAU);
      ctx.fillStyle = '#3d0f1b'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, h * 0.45, 5, 2.6, 0, 0, TAU);
      ctx.fillStyle = '#e8687a'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(0, 0, mouth === 'shout' ? 8.5 : 6.5, h, 0, 0, TAU); ctx.stroke();
    } else if (mouth === 'grin') {
      ctx.beginPath();
      ctx.moveTo(-8, -1);
      ctx.quadraticCurveTo(0, 9, 8, -1);
      ctx.quadraticCurveTo(0, 3, -8, -1);
      ctx.fillStyle = '#fff8f0'; ctx.fill();
      ctx.stroke();
    } else if (mouth === 'pain' || mouth === 'sad') {
      ctx.beginPath();
      ctx.moveTo(-7, 3);
      ctx.quadraticCurveTo(0, -4, 7, 3);
      ctx.stroke();
    } else if (mouth === 'smirk') {
      ctx.beginPath();
      ctx.moveTo(-6, 1);
      ctx.quadraticCurveTo(2, 6, 8, -2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, 4.5, 6, 0);
      ctx.stroke();
    }
    ctx.restore();

    // blush / tear
    if (p.tear) {
      const ty = eyeY + 12 + ((t * 0.6) % 14);
      ctx.beginPath();
      ctx.ellipse(eyeX * 0.6, ty, 3.2, 5, 0, 0, TAU);
      ctx.fillStyle = '#a9e6ff'; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(20,40,80,0.5)'; ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------- */
  /* Costume / species extras                                         */
  /* ---------------------------------------------------------------- */
  function drawExtras(ctx, f, m, col, t, layer) {
    const id = f.char.id;
    const p = f.pose;
    ctx.save();
    if (layer === 'behind') {
      ctx.save();
      ctx.translate(0, m.cy);
      if (id === 'king') {
        // royal cape
        const sway = Math.sin(t * 0.06) * 4;
        ctx.beginPath();
        ctx.moveTo(-46, -48);
        ctx.bezierCurveTo(-72, -44 + sway, -78, 12, -62, 30);
        ctx.quadraticCurveTo(0, 40, 62, 30);
        ctx.bezierCurveTo(78, 12, 72, -44 + sway, 46, -48);
        ctx.closePath();
        ctx.fillStyle = '#8c1420';
        ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-50, -46);
        ctx.bezierCurveTo(-70, -30, -70, 6, -58, 22);
        ctx.strokeStyle = '#efc04a'; ctx.lineWidth = 5; ctx.stroke();
        // ermine trim
        ctx.beginPath();
        ctx.moveTo(-60, 24); ctx.quadraticCurveTo(0, 36, 60, 24);
        ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 7; ctx.stroke();
      }
      if (id === 'banana') {
        // tail tip
        ctx.beginPath();
        ctx.ellipse(24, -30, 9, 7, -0.5, 0, TAU);
        ctx.fillStyle = '#6a5220'; ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
    }
    if (layer === 'front') {
      if (id === 'lemon' || id === 'king') {
        // leaf sprig
        ctx.save();
        ctx.translate(0, -92);
        ctx.rotate(Math.sin(t * 0.04) * 0.06);
        [[-1, -0.5, 13, 6], [1, -0.9, 15, 7]].forEach(([s, a, rx, ry], i) => {
          ctx.save(); ctx.translate(s * 4, -1); ctx.rotate(a * 0.55 + s * 0.15);
          ctx.beginPath(); ctx.ellipse(s * rx * 0.55, -ry * 0.35, rx, ry, 0, 0, TAU);
          ctx.fillStyle = i ? col.stemLight || '#79cf57' : col.leaf || '#4aa843';
          ctx.fill(); ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-rx * 0.6, -ry * 0.2); ctx.lineTo(rx * 0.9, -ry * 0.6);
          ctx.strokeStyle = 'rgba(20,60,20,0.45)'; ctx.lineWidth = 1.4; ctx.stroke();
          ctx.restore();
        });
        ctx.restore();
      }
      if (id === 'tomato' || id === 'king') {
        // calyx
        ctx.save();
        ctx.translate(0, -84);
        ctx.rotate(Math.sin(t * 0.05) * 0.03);
        for (let i = 0; i < 5; i++) {
          ctx.save();
          ctx.rotate((i - 2) * 0.62);
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.quadraticCurveTo(-8, -10, 0, -19);
          ctx.quadraticCurveTo(8, -10, 0, 2);
          ctx.closePath();
          ctx.fillStyle = i % 2 ? col.leaf : col.stem;
          ctx.fill(); ctx.lineWidth = 3.2; ctx.strokeStyle = INK; ctx.stroke();
          ctx.restore();
        }
        // stem
        ctx.beginPath();
        ctx.moveTo(-4, -2); ctx.quadraticCurveTo(2, -14, 10, -18);
        ctx.lineTo(15, -13); ctx.quadraticCurveTo(6, -8, 3, 2);
        ctx.closePath();
        ctx.fillStyle = col.stem; ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke();
        ctx.restore();
      }
      if (id === 'king') {
        // crown
        ctx.save();
        ctx.translate(0, -96);
        ctx.rotate(Math.sin(t * 0.03) * 0.04);
        const gold = col.gold || '#efc04a';
        ctx.beginPath();
        ctx.moveTo(-30, 4);
        ctx.lineTo(-34, -20);
        ctx.lineTo(-16, -8);
        ctx.lineTo(-6, -28);
        ctx.lineTo(6, -8);
        ctx.lineTo(24, -22);
        ctx.lineTo(28, 4);
        ctx.closePath();
        const cg = ctx.createLinearGradient(-30, -28, 30, 8);
        cg.addColorStop(0, col.goldLight || '#fff0a8');
        cg.addColorStop(0.5, gold);
        cg.addColorStop(1, col.goldDark || '#a97a12');
        ctx.fillStyle = cg; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
        // jewels
        const gems = ['#e23b38', '#4fd0ff', '#7dff9a'];
        [-16, 0, 16].forEach((x, i) => {
          ctx.beginPath(); ctx.arc(x, -3, 4.5, 0, TAU);
          ctx.fillStyle = gems[i]; ctx.fill();
          ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.stroke();
          ctx.beginPath(); ctx.arc(x - 1.4, -4.6, 1.5, 0, TAU);
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
        });
        // band
        ctx.beginPath(); ctx.rect(-29, 3, 58, 7);
        ctx.fillStyle = col.goldDark || '#a97a12'; ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      }
      if (id === 'eggplant') {
        // stem crown
        ctx.save();
        ctx.translate(0, -94);
        ctx.beginPath();
        ctx.moveTo(-2, 10);
        ctx.lineTo(-16, 2);
        ctx.lineTo(-8, -6);
        ctx.lineTo(-14, -14);
        ctx.lineTo(0, -12);
        ctx.lineTo(10, -18);
        ctx.lineTo(12, -6);
        ctx.lineTo(20, 0);
        ctx.lineTo(8, 8);
        ctx.closePath();
        ctx.fillStyle = col.stem; ctx.fill();
        ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(2, -10); ctx.quadraticCurveTo(6, -24, 16, -28);
        ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = col.stemLight || '#79c968'; ctx.stroke();
        ctx.restore();
      }
      if (id === 'chili') {
        // stem
        ctx.save();
        ctx.translate(0, -94);
        ctx.rotate(0);
        ctx.beginPath();
        ctx.moveTo(-2, 6); ctx.quadraticCurveTo(-10, -6, -16, -14);
        ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 5; ctx.strokeStyle = col.stem; ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-8, -6, 10, 5, -0.7, 0, TAU);
        ctx.fillStyle = col.leaf; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
        ctx.restore();
        // heat wisps
        const heat = f.pose.charge || 0;
        if (heat > 0.05) {
          for (let i = 0; i < 3; i++) {
            const ph = (t * 0.08 + i * 0.7) % 1;
            ctx.beginPath();
            ctx.ellipse(-m.rx - 4 + Math.sin(t * 0.1 + i) * 4, -92 - ph * 26, 6 - ph * 4, 10 - ph * 6, 0, 0, TAU);
            ctx.fillStyle = `rgba(255,${140 + i * 30},60,${(1 - ph) * 0.5 * heat})`;
            ctx.fill();
          }
        }
      }
      if (id === 'onion') {
        // sprout
        ctx.save();
        ctx.translate(0, -86);
        ctx.rotate(Math.sin(t * 0.045) * 0.1);
        [[-1, 0.5], [1, -0.2]].forEach(([s, bend], i) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(s * 6, -14, s * 18, -20, s * 12, -30);
          ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
          ctx.lineWidth = 4.5; ctx.strokeStyle = i ? col.stemLight || '#8ad46a' : col.stem; ctx.stroke();
        });
        ctx.restore();
        // papery layers
        ctx.save();
        ctx.translate(0, m.cy);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = col.dark;
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, m.rx * (0.55 + i * 0.16), m.ry * (0.6 + i * 0.14), 0, -1.9, 1.5);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (id === 'blueberry') {
        // blossom crown
        ctx.save();
        ctx.translate(0, -66);
        ctx.scale(0.82, 0.82);
        ctx.fillStyle = '#2c3a8c';
        for (let i = 0; i < 5; i++) {
          ctx.save(); ctx.rotate(i * TAU / 5);
          ctx.beginPath(); ctx.ellipse(0, -6, 4, 7, 0, 0, TAU); ctx.fill();
          ctx.restore();
        }
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU);
        ctx.fillStyle = '#1b2352'; ctx.fill();
        ctx.restore();
      }
      if (id === 'spud') {
        // potato eyes + arms bulk
        ctx.save();
        ctx.translate(0, m.cy);
        [[-0.55, -0.35], [0.6, 0.1], [0.2, 0.55], [-0.3, 0.5]].forEach(([x, y]) => {
          ctx.beginPath();
          ctx.ellipse(x * m.rx, y * m.ry, 4.4, 2.8, 0.4, 0, TAU);
          ctx.fillStyle = 'rgba(74,46,20,0.55)'; ctx.fill();
          ctx.strokeStyle = 'rgba(50,30,12,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
        });
        ctx.restore();
      }
      if (id === 'banana') {
        // peel ridges
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#b08a12';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-8 + i * 6, -86);
          ctx.quadraticCurveTo(6 + i * 5, -50, 2 + i * 7, -18);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------- */
  /* Main fighter draw                                                */
  /* ---------------------------------------------------------------- */
  Art.drawFighter = function (ctx, f, t) {
    const char = f.char, m = METRICS[char.id];
    const col = f.colors;
    const p = f.pose;
    const s = f.scale;

    // ground shadow (drawn before the body in world space)
    const air = Math.max(0, f.groundY - f.y);
    const shadowScale = Math.max(0.35, 1 - air / 260);
    ctx.save();
    ctx.globalAlpha = 0.34 * shadowScale;
    ctx.fillStyle = '#0a0710';
    ctx.beginPath();
    ctx.ellipse(f.x, f.groundY + 2, m.shadow * s * 1.05 * shadowScale, 9 * s * shadowScale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);

    // super aura
    if (p.aura > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const auraR = m.rx * 2.4 * s;
      const ag = ctx.createRadialGradient(0, m.cy * s, 4, 0, m.cy * s, auraR);
      ag.addColorStop(0, `rgba(255,255,255,${0.35 * p.aura})`);
      ag.addColorStop(0.4, hexA(col.accent, 0.35 * p.aura));
      ag.addColorStop(1, hexA(col.accent, 0));
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.arc(0, m.cy * s, auraR, 0, TAU); ctx.fill();
      ctx.restore();
    }

    ctx.translate(0, p.lift || 0);
    ctx.rotate(p.rot || 0);
    ctx.scale(p.sx == null ? 1 : p.sx, p.sy == null ? 1 : p.sy);
    ctx.scale(s, s);

    const air2 = f.airborne;
    // legs
    const legSwing = p.legSwing || 0;
    const legCol = col.dark;
    const hipY = m.cy + m.ry * 0.72;
    if (!air2) {
      const swing = Math.sin(legSwing * 2) * 5;
      [[-1, 1], [1, -1]].forEach(([s, dir]) => {
        const fx = s * m.legX + swing * dir;
        const fy = 0;
        ctx.lineCap = 'round';
        ctx.strokeStyle = INK; ctx.lineWidth = 11;
        ctx.beginPath(); ctx.moveTo(s * m.legX, hipY); ctx.lineTo(fx, fy - 5); ctx.stroke();
        ctx.strokeStyle = legCol; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(s * m.legX, hipY); ctx.lineTo(fx, fy - 5); ctx.stroke();
        foot(ctx, fx, fy, 11, col.dark);
      });
    } else {
      foot(ctx, -m.legX * 0.85, -4, 10, col.dark);
      foot(ctx, m.legX * 0.85, 0, 10, col.dark);
    }

    // back arm
    ctx.save();
    limb(ctx, -m.armX * 0.88, m.armY, p.armBack == null ? -0.45 : p.armBack, 25, 13, col.dark, { hand: 8, handCol: col.base });

    drawExtras(ctx, f, m, col, t, 'behind');
    ctx.restore();

    // body
    const path = cache[char.id] || (cache[char.id] = SHAPES[char.id]());
    ctx.save();
    ctx.translate(0, 0);
    const bodyGrad = gradient(ctx, col, m.rx, m.ry, m.cy);
    inkPath(ctx, path, bodyGrad, 6, INK);

    // texture clipped to body
    const tex = TEX[char.id];
    if (tex) {
      ctx.save();
      ctx.clip(path);
      const pat = ctx.createPattern(makeTexture(tex.kind, tex.col), 'repeat');
      ctx.globalAlpha = tex.alpha;
      ctx.translate(-m.rx, m.cy - m.ry);
      ctx.scale(tex.scale, tex.scale);
      ctx.fillStyle = pat;
      ctx.fillRect(-m.rx * 2, -m.ry * 2, m.rx * 5, m.ry * 5);
      ctx.restore();
    }

    // ambient shadow (bottom)
    ctx.save();
    ctx.clip(path);
    const sh = ctx.createLinearGradient(0, m.cy + m.ry * 0.1, 0, m.cy + m.ry * 1.05);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(20,6,20,0.4)');
    ctx.fillStyle = sh;
    ctx.fillRect(-m.rx * 2, m.cy - m.ry, m.rx * 4, m.ry * 2.4);

    // specular highlight
    const hx = -m.rx * 0.38, hy = m.cy - m.ry * 0.55;
    const hg = ctx.createRadialGradient(hx, hy, 1, hx, hy, m.rx * 0.85);
    hg.addColorStop(0, hexA(col.rim || '#ffffff', 0.85));
    hg.addColorStop(0.35, hexA(col.rim || '#ffffff', 0.3));
    hg.addColorStop(1, hexA(col.rim || '#ffffff', 0));
    ctx.fillStyle = hg;
    ctx.fillRect(-m.rx * 2, m.cy - m.ry * 2, m.rx * 4, m.ry * 3);
    // gloss streak for shiny produce
    if (char.id !== 'spud' && char.id !== 'onion' && char.id !== 'blueberry') {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(-m.rx * 0.34, m.cy - m.ry * 0.5, m.rx * 0.2, m.ry * 0.28, -0.5, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // rim light
    ctx.save();
    ctx.clip(path);
    const rim = ctx.createLinearGradient(m.rx * 0.2, m.cy - m.ry, m.rx, m.cy + m.ry * 0.4);
    rim.addColorStop(0, hexA(col.rim || '#fff', 0.55));
    rim.addColorStop(0.55, hexA(col.rim || '#fff', 0));
    ctx.strokeStyle = rim;
    ctx.lineWidth = 7;
    ctx.stroke(path);
    ctx.restore();

    // hurt flash
    if (f.hurtFlash > 0) {
      ctx.save();
      ctx.globalAlpha = f.hurtFlash * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.fill(path);
      ctx.restore();
    }

    drawExtras(ctx, f, m, col, t, 'front');

    drawFace(ctx, f, m, col, t);
    ctx.restore();

    // front arm
    limb(ctx, m.armX * 0.88, m.armY, p.armFront == null ? 0.5 : p.armFront,
      p.armLen == null ? 26 : p.armLen, 13, col.base, { hand: 8.5, handCol: col.light });

    // guard shield
    if (p.guard > 0.05) {
      ctx.save();
      ctx.globalAlpha = p.guard * 0.85;
      const gx = m.rx * 0.85, gy = m.cy - 8;
      const g2 = ctx.createRadialGradient(gx, gy, 2, gx, gy, 30);
      g2.addColorStop(0, 'rgba(255,255,255,0.5)');
      g2.addColorStop(0.6, hexA('#8fd8ff', 0.5));
      g2.addColorStop(1, hexA('#8fd8ff', 0));
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.ellipse(gx, gy, 22, 30, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };

  function hexA(hex, a) {
    if (!hex) return `rgba(255,255,255,${a})`;
    if (hex[0] !== '#') return hex;
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  Art.hexA = hexA;

  /* ---------------------------------------------------------------- */
  /* Projectiles                                                      */
  /* ---------------------------------------------------------------- */
  Art.drawProjectile = function (ctx, p, t) {
    const style = p.style, col = p.colors || {};
    ctx.save();
    ctx.translate(p.x, p.y);
    const spin = p.spin || (t * 0.12);
    const r = p.size;
    const c1 = col.accent || '#ffe14d';
    const c2 = col.base || '#f6d431';
    const c3 = col.dark || '#c99b0c';

    // glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.6);
    g.addColorStop(0, hexA(c1, 0.55));
    g.addColorStop(0.5, hexA(c1, 0.18));
    g.addColorStop(1, hexA(c1, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-r * 3, -r * 3, r * 6, r * 6);
    ctx.restore();

    ctx.rotate(spin);
    if (style === 'citrus') {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
      const lg = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r);
      lg.addColorStop(0, '#fffbe0'); lg.addColorStop(0.5, c2); lg.addColorStop(1, c3);
      ctx.fillStyle = lg; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); ctx.clip();
      for (let i = 0; i < 6; i++) {
        ctx.rotate(TAU / 6);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.85, -r * 0.28); ctx.lineTo(r * 0.85, r * 0.28); ctx.closePath();
        ctx.fillStyle = hexA('#fff6b0', 0.55); ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = hexA('#ffffff', 0.8); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, -2.4, -0.9); ctx.stroke();
    } else if (style === 'sauce') {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 1.05, -r * 0.8, r, r * 0.7, 0, r);
      ctx.bezierCurveTo(-r, r * 0.7, -r * 1.05, -r * 0.8, 0, -r);
      ctx.fillStyle = c2;
      ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.28, r * 0.2, -0.5, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.85);
      ctx.quadraticCurveTo(0, -r * 1.3, r * 0.4, -r * 0.9);
      ctx.fillStyle = col.stem || '#3f9a3c'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    } else if (style === 'shade') {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
      const sg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
      sg.addColorStop(0, '#e6c4ff'); sg.addColorStop(0.5, c2); sg.addColorStop(1, '#2a0f40');
      ctx.fillStyle = sg; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = hexA('#e6c4ff', 0.6); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r * (1.2 + i * 0.24), t * 0.1 + i, t * 0.1 + i + 1.4);
        ctx.strokeStyle = hexA(c2, 0.5 - i * 0.12); ctx.lineWidth = 2.5; ctx.stroke();
      }
    } else if (style === 'spud') {
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, -r * 0.2);
      ctx.bezierCurveTo(-r, -r * 0.95, r * 0.7, -r, r, -r * 0.3);
      ctx.bezierCurveTo(r * 1.05, r * 0.6, 0, r, -r * 0.8, r * 0.6);
      ctx.bezierCurveTo(-r * 1.1, r * 0.3, -r * 1.1, -r * 0.4, -r * 0.9, -r * 0.2);
      const pg = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 1, 0, 0, r);
      pg.addColorStop(0, '#e3c190'); pg.addColorStop(0.6, '#a9773f'); pg.addColorStop(1, '#6d4923');
      ctx.fillStyle = pg; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(70,44,18,0.55)';
      [[-0.3, -0.2], [0.3, 0.25], [0.1, -0.45]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.ellipse(x * r, y * r, 2.6, 1.8, 0.4, 0, TAU); ctx.fill();
      });
    } else if (style === 'banana') {
      ctx.beginPath();
      ctx.moveTo(-r, r * 0.35);
      ctx.bezierCurveTo(-r * 0.6, -r * 0.9, r * 0.5, -r, r, -r * 0.3);
      ctx.bezierCurveTo(r * 0.6, -r * 0.4, -r * 0.2, -r * 0.2, -r * 0.4, r * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#ffe14d'; ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(-r * 0.85, r * 0.3, r * 0.18, 0, TAU);
      ctx.fillStyle = '#6a5220'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    } else if (style === 'chili') {
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r, r * 0.3, -r * 0.8, -r, 0, -r);
      ctx.bezierCurveTo(r * 0.8, -r, r, r * 0.3, 0, r);
      const fg = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      fg.addColorStop(0, '#fff2b0'); fg.addColorStop(0.35, '#ffb43c'); fg.addColorStop(0.7, '#ff6a1f'); fg.addColorStop(1, 'rgba(255,60,0,0.15)');
      ctx.fillStyle = fg; ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const a = t * 0.1 + i * 1.6;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.6, r * 0.2, r * 0.32, a, 0, TAU);
        ctx.fillStyle = 'rgba(255,200,90,0.5)'; ctx.fill();
      }
    } else if (style === 'onion') {
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.15);
      ctx.bezierCurveTo(r * 0.95, -r * 0.5, r * 0.85, r * 0.75, 0, r);
      ctx.bezierCurveTo(-r * 0.85, r * 0.75, -r * 0.95, -r * 0.5, 0, -r * 1.15);
      const wg = ctx.createRadialGradient(-r * 0.25, -r * 0.3, 1, 0, 0, r);
      wg.addColorStop(0, '#ffffff'); wg.addColorStop(0.5, '#9fe0ff'); wg.addColorStop(1, '#4a90c8');
      ctx.fillStyle = wg; ctx.fill();
      ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.1, r * 0.16, r * 0.3, -0.3, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    } else if (style === 'blueberry') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.4); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, r * 1.4); ctx.lineTo(-r * 0.6, 0);
      ctx.closePath();
      ctx.fillStyle = hexA(c1, 0.9); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (style === 'royal') {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
      const rg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
      rg.addColorStop(0, '#ff8a7a'); rg.addColorStop(0.55, '#d3262f'); rg.addColorStop(1, '#7d0f1c');
      ctx.fillStyle = rg; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      // golden ring
      ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU);
      ctx.strokeStyle = '#efc04a'; ctx.lineWidth = 3.5; ctx.stroke();
      // crown glint
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.35); ctx.lineTo(-r * 0.45, -r * 0.75);
      ctx.lineTo(-r * 0.2, -r * 0.55); ctx.lineTo(0, -r * 0.85);
      ctx.lineTo(r * 0.2, -r * 0.55); ctx.lineTo(r * 0.45, -r * 0.75);
      ctx.lineTo(r * 0.45, -r * 0.35); ctx.closePath();
      ctx.fillStyle = '#ffd25a'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------------------------------------------------------- */
  /* Portraits (cached offscreen canvases)                            */
  /* ---------------------------------------------------------------- */
  const portraitCache = {};
  Art.portrait = function (charId, skin) {
    const key = charId + ':' + (skin || 0);
    if (portraitCache[key]) return portraitCache[key];
    const char = TT.getChar(charId);
    const c = document.createElement('canvas');
    c.width = c.height = 192;
    const g = c.getContext('2d');
    const colors = Art.palette(char, skin || 0);
    // frame glow
    const bg = g.createRadialGradient(96, 90, 6, 96, 96, 96);
    bg.addColorStop(0, hexA(colors.accent, 0.5));
    bg.addColorStop(1, 'rgba(10,6,18,0.9)');
    g.fillStyle = bg; g.fillRect(0, 0, 192, 192);
    const f = {
      char, colors, scale: 1.45, facing: 1, x: 96, y: 196, groundY: 196,
      pose: { armFront: 0.9, armBack: -0.7, mouth: 'smirk', brow: 0.5, look: { x: 0.2, y: 0 }, headTilt: -0.04, sx: 1, sy: 1 },
      hurtFlash: 0, airborne: false
    };
    Art.drawFighter(g, f, 12);
    // vignette
    const vg = g.createRadialGradient(96, 96, 60, 96, 96, 120);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(6,3,12,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, 192, 192);
    portraitCache[key] = c;
    return c;
  };

  Art.METRICS = METRICS;
  Art.shapesReady = true;
})();
