/* TOOKEND TYNDOUT: PRODUCE BRAWL — arena painters
   Each stage is built from cached parallax layers plus live ambient detail. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};
  const TAU = Math.PI * 2;
  const A = TT.Arenas = TT.Arenas || {};
  const W = 960, H = 540;
  const layers = {};

  function seeded(seed) {
    let s = seed;
    return function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  function makeLayer(w, h, painter) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    painter(g, w, h);
    return c;
  }

  function wood(g, x, y, w, h, base, dark) {
    const lg = g.createLinearGradient(x, y, x, y + h);
    lg.addColorStop(0, base); lg.addColorStop(1, dark);
    g.fillStyle = lg; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(60,34,18,0.28)'; g.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      g.beginPath(); g.moveTo(x, y + (h / 4) * i); g.lineTo(x + w, y + (h / 4) * i); g.stroke();
    }
    g.strokeStyle = 'rgba(255,230,190,0.13)';
    g.beginPath(); g.moveTo(x, y + 1.5); g.lineTo(x + w, y + 1.5); g.stroke();
  }

  function crate(g, x, y, s, rnd) {
    wood(g, x, y, s, s, '#a8763f', '#6f4520');
    g.strokeStyle = '#4d2d14'; g.lineWidth = 2.4;
    g.strokeRect(x + 1, y + 1, s - 2, s - 2);
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x + 2, y + 2); g.lineTo(x + s - 2, y + s - 2); g.stroke();
    g.beginPath(); g.moveTo(x + s - 2, y + 2); g.lineTo(x + 2, y + s - 2); g.stroke();
    g.fillStyle = 'rgba(255,220,160,0.16)';
    g.fillRect(x + 3, y + 3, s - 6, 3);
    // produce peeking out
    for (let i = 0; i < 3; i++) {
      const px = x + 8 + i * (s - 16) / 2;
      g.beginPath(); g.arc(px, y + 6, 5 + rnd() * 2, 0, TAU);
      g.fillStyle = ['#e23b38', '#f6d431', '#7b3fa8', '#4ea443'][(rnd() * 4) | 0];
      g.fill();
      g.strokeStyle = 'rgba(20,10,20,0.4)'; g.lineWidth = 1; g.stroke();
    }
  }

  function awning(g, x, y, w, h, c1, c2, sag) {
    g.save();
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? c1 : c2;
      g.beginPath();
      const x0 = x + (w / 6) * i;
      g.moveTo(x0, y);
      g.lineTo(x0 + w / 6, y);
      g.lineTo(x0 + w / 6, y + h - sag);
      g.quadraticCurveTo(x0 + w / 12, y + h + sag * 0.6, x0, y + h - sag);
      g.closePath();
      g.fill();
    }
    g.strokeStyle = 'rgba(40,18,30,0.45)'; g.lineWidth = 1.4;
    for (let i = 1; i < 6; i++) {
      g.beginPath(); g.moveTo(x + (w / 6) * i, y); g.lineTo(x + (w / 6) * i, y + h - sag); g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(x, y + h - sag - 4, w, 4);
    g.restore();
  }

  function lantern(g, x, y, r, warm) {
    const rg = g.createRadialGradient(x, y, 1, x, y, r * 5);
    rg.addColorStop(0, 'rgba(255,214,140,0.55)');
    rg.addColorStop(0.35, 'rgba(255,180,90,0.18)');
    rg.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = rg; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
    g.beginPath(); g.arc(x, y, r, 0, TAU);
    const lg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r);
    lg.addColorStop(0, '#fff5d0'); lg.addColorStop(0.6, warm || '#ffc86a'); lg.addColorStop(1, '#e08a2a');
    g.fillStyle = lg; g.fill();
    g.strokeStyle = '#5b3518'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r * 0.5, -2.6, -1.4); g.stroke();
  }

  function glowDot(g, x, y, r, col, alpha) {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = alpha == null ? 1 : alpha;
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
  }

  function bulbs(g, x0, y0, x1, y1, n, sag, phase) {
    g.strokeStyle = 'rgba(30,20,26,0.8)'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); g.stroke();
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag;
      const col = ['#ffd98a', '#ffe9b0', '#ffc46a'][i % 3];
      glowDot(g, cx, cy + 7, 20, 'rgba(255,200,110,0.4)', 1);
      g.beginPath(); g.arc(cx, cy + 6, 3.4, 0, TAU);
      g.fillStyle = col; g.fill();
      g.strokeStyle = 'rgba(90,50,20,0.5)'; g.lineWidth = 1; g.stroke();
    }
  }

  /* ================================================================ */
  /* PRODUCE MARKET                                                    */
  /* ================================================================ */
  function buildMarket(w, floor) {
    const far = makeLayer(w, H, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, floor);
      sky.addColorStop(0, '#0a0a1c');
      sky.addColorStop(0.45, '#1c1636');
      sky.addColorStop(0.78, '#3a2340');
      sky.addColorStop(1, '#5a3346');
      g.fillStyle = sky; g.fillRect(0, 0, w, floor + 80);
      const rnd = seeded(7);
      for (let i = 0; i < 130; i++) {
        const x = rnd() * w, y = rnd() * floor * 0.62, r = rnd() * 1.3 + 0.3;
        g.globalAlpha = 0.25 + rnd() * 0.6;
        g.fillStyle = '#fff6dc';
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
      // moon
      const mx = w * 0.78, my = 96;
      glowDot(g, mx, my, 120, 'rgba(255,245,210,0.18)', 1);
      g.beginPath(); g.arc(mx, my, 34, 0, TAU);
      const mg = g.createRadialGradient(mx - 10, my - 12, 4, mx, my, 34);
      mg.addColorStop(0, '#fffdf0'); mg.addColorStop(0.7, '#f0e4c4'); mg.addColorStop(1, '#c9b892');
      g.fillStyle = mg; g.fill();
      g.globalAlpha = 0.12; g.fillStyle = '#8c7a5a';
      [[-9, -6, 7], [8, 5, 5], [2, 14, 4], [-14, 9, 3]].forEach(([x, y, r]) => {
        g.beginPath(); g.arc(mx + x, my + y, r, 0, TAU); g.fill();
      });
      g.globalAlpha = 1;
      // distant buildings
      const far2 = seeded(21);
      for (let i = 0; i < 16; i++) {
        const bw = 50 + far2() * 80, bh = 90 + far2() * 170;
        const bx = i * 110 - 40 + far2() * 30;
        g.fillStyle = '#171226';
        g.fillRect(bx, floor - 120 - bh, bw, bh + 120);
        for (let wy = floor - 110 - bh + 12; wy < floor - 40; wy += 18) {
          for (let wx = bx + 8; wx < bx + bw - 10; wx += 16) {
            if (far2() > 0.55) {
              g.fillStyle = far2() > 0.5 ? 'rgba(255,196,110,0.55)' : 'rgba(255,226,160,0.32)';
              g.fillRect(wx, wy, 6, 8);
            }
          }
        }
        if (i % 3 === 0) {
          g.fillStyle = '#221a30';
          g.fillRect(bx + bw * 0.4, floor - 150 - bh, 3, 30);
          glowDot(g, bx + bw * 0.4 + 1, floor - 152 - bh, 10, 'rgba(255,120,90,0.5)', 1);
        }
      }
      // haze
      const hz = g.createLinearGradient(0, floor - 220, 0, floor);
      hz.addColorStop(0, 'rgba(120,60,110,0)');
      hz.addColorStop(1, 'rgba(180,90,110,0.24)');
      g.fillStyle = hz; g.fillRect(0, floor - 220, w, 220);
    });

    const mid = makeLayer(w, H, (g) => {
      const rnd = seeded(33);
      // stall row
      const stalls = Math.ceil(w / 300) + 1;
      for (let i = 0; i < stalls; i++) {
        const sx = i * 300 - 40;
        const sy = floor - 226;
        // back wall
        wood(g, sx + 20, sy + 26, 250, 190, '#3a2733', '#241722');
        // shelves + produce
        for (let s = 0; s < 2; s++) {
          const shY = sy + 70 + s * 54;
          g.fillStyle = '#5a3a2c'; g.fillRect(sx + 34, shY, 222, 7);
          g.fillStyle = 'rgba(255,210,150,0.18)'; g.fillRect(sx + 34, shY, 222, 2);
          for (let b = 0; b < 9; b++) {
            const bx = sx + 44 + b * 24;
            const col = ['#e23b38', '#f6d431', '#7b3fa8', '#4ea443', '#f08a2a'][(rnd() * 5) | 0];
            g.beginPath(); g.arc(bx, shY - 5, 6.5 + rnd() * 2.5, 0, TAU);
            g.fillStyle = col; g.fill();
            g.globalAlpha = 0.35; g.fillStyle = '#fff'; g.beginPath();
            g.arc(bx - 2, shY - 8, 2, 0, TAU); g.fill(); g.globalAlpha = 1;
          }
        }
        // posts
        g.fillStyle = '#6b4526'; g.fillRect(sx + 18, sy + 20, 10, 196);
        g.fillStyle = '#6b4526'; g.fillRect(sx + 268, sy + 20, 10, 196);
        g.fillStyle = 'rgba(255,220,170,0.15)'; g.fillRect(sx + 18, sy + 20, 3, 196);
        // awning
        awning(g, sx + 4, sy, 280, 46, '#c9443f', '#f3e2c8', 10);
        // sign
        g.save();
        g.translate(sx + 145, sy + 60);
        g.rotate(-0.02);
        g.fillStyle = '#2a1b23'; rr(g, -56, -14, 112, 28, 5); g.fill();
        g.strokeStyle = '#d9b26a'; g.lineWidth = 2; rr(g, -56, -14, 112, 28, 5); g.stroke();
        g.fillStyle = '#f5dfae'; g.font = '900 13px "Trebuchet MS", sans-serif'; g.textAlign = 'center';
        g.fillText(['FRESH!', 'AISLE 7', '2 FOR 1', 'RIPE', 'SALE'][i % 5], 0, 5);
        g.restore();
        // counter + crates
        wood(g, sx + 30, floor - 78, 230, 54, '#7d5330', '#4d3018');
        g.fillStyle = '#3d2616'; g.fillRect(sx + 26, floor - 84, 238, 10);
        crate(g, sx + 46, floor - 70, 44, rnd);
        crate(g, sx + 96, floor - 70, 44, rnd);
        crate(g, sx + 172, floor - 70, 40, rnd);
        // lantern
        g.strokeStyle = '#2a1a12'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(sx + 250, sy + 24); g.lineTo(sx + 250, sy + 54); g.stroke();
        lantern(g, sx + 250, sy + 66, 12);
        // plants
        for (let p = 0; p < 3; p++) {
          const px = sx + 44 + p * 90 + rnd() * 30;
          const py = floor - 78;
          g.fillStyle = '#8a4a30';
          g.beginPath(); g.moveTo(px - 12, py); g.lineTo(px + 12, py); g.lineTo(px + 8, py - 18); g.lineTo(px - 8, py - 18); g.closePath(); g.fill();
          g.fillStyle = '#3f7a3c';
          for (let l = 0; l < 4; l++) {
            g.beginPath();
            g.ellipse(px + Math.cos(l * 1.7) * 8, py - 22 - l * 3, 9, 5, l * 0.9, 0, TAU);
            g.fill();
          }
        }
      }
      // string lights across the street
      bulbs(g, 20, floor - 250, w - 20, floor - 262, 22, 34);
      // hanging pennants
      for (let i = 0; i < 14; i++) {
        const x = 30 + i * (w / 14);
        const y = floor - 292 + Math.sin(i * 0.7) * 8;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 22, y); g.lineTo(x + 11, y + 26); g.closePath();
        g.fillStyle = i % 2 ? '#d9a13a' : '#8f3f6a'; g.fill();
        g.strokeStyle = 'rgba(20,10,20,0.35)'; g.lineWidth = 1; g.stroke();
      }
    });

    const ground = makeLayer(w, 200, (g) => {
      const y0 = floor;
      const lg = g.createLinearGradient(0, 0, 0, 200);
      lg.addColorStop(0, '#5d4a52');
      lg.addColorStop(0.25, '#493a44');
      lg.addColorStop(1, '#2a2028');
      g.fillStyle = lg; g.fillRect(0, 0, w, 200);
      g.save(); g.translate(0, -y0);
      // tiles in perspective rows
      for (let row = 0; row < 6; row++) {
        const yy = y0 + row * row * 6 + row * 10;
        const hh = 8 + row * 3;
        g.strokeStyle = 'rgba(20,12,20,0.4)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke();
        g.strokeStyle = 'rgba(255,220,200,0.08)';
        g.beginPath(); g.moveTo(0, yy + 1.6); g.lineTo(w, yy + 1.6); g.stroke();
      }
      const rnd = seeded(91);
      for (let x = 0; x < w; x += 54) {
        g.strokeStyle = 'rgba(20,12,20,0.28)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x + 10, y0); g.lineTo(x - 24, 200 + y0); g.stroke();
      }
      // wet reflections
      for (let i = 0; i < 22; i++) {
        const x = rnd() * w, y = y0 + 14 + rnd() * 60;
        g.globalAlpha = 0.09 + rnd() * 0.1;
        g.fillStyle = ['#ffce8a', '#ff9a6a', '#d0a8ff'][(rnd() * 3) | 0];
        g.beginPath(); g.ellipse(x, y, 30 + rnd() * 60, 4 + rnd() * 5, 0, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
      // leaves + debris
      for (let i = 0; i < 40; i++) {
        const x = rnd() * w, y = y0 + rnd() * 70;
        g.globalAlpha = 0.4 + rnd() * 0.3;
        g.fillStyle = ['#6f8a3a', '#a8823a', '#7a5a30'][(rnd() * 3) | 0];
        g.beginPath(); g.ellipse(x, y, 3 + rnd() * 4, 1.6 + rnd() * 2, rnd() * TAU, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
      g.restore();
      // front edge highlight
      g.fillStyle = 'rgba(255,210,160,0.25)';
      g.fillRect(0, 0, w, 2);
    });

    return { far, mid, ground };
  }

  /* ================================================================ */
  /* ROOFTOP                                                           */
  /* ================================================================ */
  function buildRooftop(w, floor) {
    const far = makeLayer(w, H, (g) => {
      const sky = g.createLinearGradient(0, 0, 0, floor + 40);
      sky.addColorStop(0, '#2a1e46');
      sky.addColorStop(0.32, '#6b3a6e');
      sky.addColorStop(0.62, '#c85f6c');
      sky.addColorStop(0.82, '#f5925f');
      sky.addColorStop(1, '#ffc17a');
      g.fillStyle = sky; g.fillRect(0, 0, w, floor + 40);
      // sun
      const sx = w * 0.34, sy = floor - 150;
      glowDot(g, sx, sy, 210, 'rgba(255,196,120,0.34)', 1);
      glowDot(g, sx, sy, 120, 'rgba(255,236,190,0.4)', 1);
      const sg2 = g.createRadialGradient(sx, sy - 10, 6, sx, sy, 72);
      sg2.addColorStop(0, '#fffbe8'); sg2.addColorStop(0.6, '#ffe0a0'); sg2.addColorStop(1, '#ffb56a');
      g.fillStyle = sg2; g.beginPath(); g.arc(sx, sy, 62, 0, TAU); g.fill();
      // cloud bands
      const rnd = seeded(5);
      for (let i = 0; i < 12; i++) {
        const cy = 70 + rnd() * (floor - 200);
        const cx = rnd() * w;
        const cw = 110 + rnd() * 260, ch = 12 + rnd() * 26;
        g.globalAlpha = 0.1 + rnd() * 0.22;
        g.fillStyle = cy > floor * 0.55 ? '#ffcf9a' : '#9a6a9a';
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          g.ellipse(cx + k * cw * 0.24, cy + Math.sin(k) * 4, cw * (0.34 - k * 0.03), ch * (1 - k * 0.12), 0, 0, TAU);
          g.fill();
        }
      }
      g.globalAlpha = 1;
      // birds
      g.strokeStyle = 'rgba(40,20,40,0.6)'; g.lineWidth = 2;
      [[0.62, 120], [0.66, 96], [0.7, 132]].forEach(([x, y], i) => {
        const bx = w * x, by = y;
        g.beginPath(); g.moveTo(bx - 8, by); g.quadraticCurveTo(bx - 4, by - 5, bx, by);
        g.quadraticCurveTo(bx + 4, by - 5, bx + 8, by); g.stroke();
      });
      // far skyline
      const r2 = seeded(17);
      for (let layer = 0; layer < 2; layer++) {
        for (let i = 0; i < 22; i++) {
          const bw = 40 + r2() * 70, bh = (layer ? 90 : 150) + r2() * 130;
          const bx = i * (w / 20) - 40 + r2() * 30;
          const base = floor - 10 - (layer ? 0 : 30);
          g.fillStyle = layer ? 'rgba(84,52,92,0.85)' : 'rgba(58,38,70,0.9)';
          g.fillRect(bx, base - bh, bw, bh);
          if (layer === 0) {
            for (let wy = base - bh + 8; wy < base - 14; wy += 14) {
              for (let wx = bx + 6; wx < bx + bw - 8; wx += 12) {
                if (r2() > 0.7) {
                  g.fillStyle = 'rgba(255,214,150,0.75)';
                  g.fillRect(wx, wy, 4, 5);
                }
              }
            }
          }
        }
      }
      // warm haze at horizon
      const hz = g.createLinearGradient(0, floor - 180, 0, floor + 40);
      hz.addColorStop(0, 'rgba(255,150,90,0)');
      hz.addColorStop(1, 'rgba(255,150,90,0.28)');
      g.fillStyle = hz; g.fillRect(0, floor - 180, w, 220);
    });

    const mid = makeLayer(w, H, (g) => {
      const rnd = seeded(44);
      const baseY = floor;
      // rooftop mechanical structures
      for (let i = 0; i < 6; i++) {
        const bx = 60 + i * (w / 5.4);
        const bw = 130 + rnd() * 60, bh = 70 + rnd() * 46;
        // water tank / hvac
        g.fillStyle = '#3a3140';
        g.fillRect(bx, baseY - bh, bw, bh);
        g.fillStyle = 'rgba(255,220,180,0.14)';
        g.fillRect(bx, baseY - bh, bw, 5);
        g.fillStyle = 'rgba(20,14,26,0.4)';
        g.fillRect(bx, baseY - 8, bw, 8);
        // rivets + panels
        g.strokeStyle = 'rgba(20,14,26,0.5)'; g.lineWidth = 1.4;
        for (let p = 1; p < 4; p++) {
          g.beginPath(); g.moveTo(bx + (bw / 4) * p, baseY - bh + 6); g.lineTo(bx + (bw / 4) * p, baseY - 10); g.stroke();
        }
        if (i % 2 === 0) {
          // tank on legs
          g.fillStyle = '#4a3c4c';
          g.fillRect(bx + 26, baseY - bh - 56, 12, 56);
          g.fillRect(bx + bw - 42, baseY - bh - 56, 12, 56);
          g.beginPath(); g.ellipse(bx + bw / 2, baseY - bh - 62, 44, 30, 0, 0, TAU);
          g.fillStyle = '#584a5c'; g.fill();
          g.strokeStyle = 'rgba(255,220,180,0.2)'; g.lineWidth = 2;
          g.beginPath(); g.ellipse(bx + bw / 2, baseY - bh - 62, 44, 30, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
          g.beginPath(); g.ellipse(bx + bw / 2, baseY - bh - 92, 16, 6, 0, 0, TAU);
          g.fillStyle = '#3f3346'; g.fill();
        } else {
          // vent fans
          g.beginPath(); g.arc(bx + bw / 2, baseY - bh / 2, 22, 0, TAU);
          g.fillStyle = '#2c2434'; g.fill();
          g.strokeStyle = 'rgba(255,220,180,0.16)'; g.lineWidth = 2;
          for (let k = 0; k < 5; k++) {
            g.beginPath(); g.moveTo(bx + bw / 2, baseY - bh / 2);
            g.lineTo(bx + bw / 2 + Math.cos(k * 1.25) * 20, baseY - bh / 2 + Math.sin(k * 1.25) * 20);
            g.stroke();
          }
        }
      }
      // antennas
      for (let i = 0; i < 4; i++) {
        const x = 140 + i * (w / 4.1);
        g.strokeStyle = '#2c2432'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x, baseY - 60); g.lineTo(x, baseY - 190); g.stroke();
        g.strokeStyle = 'rgba(255,220,190,0.2)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x - 1, baseY - 60); g.lineTo(x - 1, baseY - 190); g.stroke();
        g.strokeStyle = '#2c2432'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x - 16, baseY - 150); g.lineTo(x + 16, baseY - 150); g.stroke();
        g.beginPath(); g.moveTo(x - 10, baseY - 172); g.lineTo(x + 10, baseY - 172); g.stroke();
      }
      // railing
      const ry = baseY - 74;
      g.strokeStyle = '#2a2230'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(0, ry); g.lineTo(w, ry); g.stroke();
      g.strokeStyle = 'rgba(255,200,160,0.45)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, ry - 2); g.lineTo(w, ry - 2); g.stroke();
      g.strokeStyle = '#332a3a'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(0, ry + 26); g.lineTo(w, ry + 26); g.stroke();
      g.strokeStyle = 'rgba(255,190,150,0.3)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, ry + 25); g.lineTo(w, ry + 25); g.stroke();
      for (let x = 12; x < w; x += 44) {
        g.strokeStyle = '#2a2230'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(x, ry); g.lineTo(x, baseY); g.stroke();
        g.strokeStyle = 'rgba(255,210,170,0.22)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x - 1, ry + 4); g.lineTo(x - 1, baseY - 2); g.stroke();
      }
      // rooftop plants
      for (let i = 0; i < 7; i++) {
        const px = 40 + rnd() * (w - 80), py = baseY - 2;
        g.fillStyle = '#7a4a34';
        g.beginPath(); g.moveTo(px - 15, py - 22); g.lineTo(px + 15, py - 22); g.lineTo(px + 11, py); g.lineTo(px - 11, py); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(20,10,20,0.35)'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#3f7a48';
        for (let l = 0; l < 6; l++) {
          g.beginPath();
          g.ellipse(px + Math.cos(l * 1.1) * 12, py - 30 - l * 2, 11, 5, l * 0.8, 0, TAU);
          g.fill();
        }
        g.fillStyle = 'rgba(255,190,120,0.35)';
        g.beginPath(); g.ellipse(px + 4, py - 40, 6, 3, -0.4, 0, TAU); g.fill();
      }
      // string lights
      bulbs(g, 10, floor - 250, w - 10, floor - 240, 18, 26);
    });

    const ground = makeLayer(w, 200, (g) => {
      const y0 = floor;
      const lg = g.createLinearGradient(0, 0, 0, 200);
      lg.addColorStop(0, '#6a5c66');
      lg.addColorStop(0.3, '#4f4652');
      lg.addColorStop(1, '#2b2430');
      g.fillStyle = lg; g.fillRect(0, 0, w, 200);
      g.save(); g.translate(0, -y0);
      const rnd = seeded(63);
      // concrete slabs
      for (let row = 0; row < 4; row++) {
        const yy = y0 + row * (14 + row * 10);
        g.strokeStyle = 'rgba(24,16,26,0.45)'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke();
        g.strokeStyle = 'rgba(255,220,190,0.1)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, yy + 2); g.lineTo(w, yy + 2); g.stroke();
      }
      for (let x = 0; x < w; x += 96) {
        g.strokeStyle = 'rgba(24,16,26,0.35)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(x, y0); g.lineTo(x - 30, 200 + y0); g.stroke();
      }
      // gravel + stains
      for (let i = 0; i < 260; i++) {
        const x = rnd() * w, y = y0 + 3 + rnd() * 70;
        g.globalAlpha = 0.06 + rnd() * 0.14;
        g.fillStyle = rnd() > 0.5 ? '#e0cbb8' : '#231a28';
        g.beginPath(); g.arc(x, y, 0.8 + rnd() * 2.2, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
      // sunset puddle reflections
      for (let i = 0; i < 9; i++) {
        const x = rnd() * w, y = y0 + 24 + rnd() * 54;
        const pg = g.createRadialGradient(x, y, 1, x, y, 40 + rnd() * 40);
        pg.addColorStop(0, 'rgba(255,170,110,0.34)');
        pg.addColorStop(1, 'rgba(255,170,110,0)');
        g.fillStyle = pg;
        g.beginPath(); g.ellipse(x, y, 44, 10, 0, 0, TAU); g.fill();
      }
      // tar seams
      g.strokeStyle = 'rgba(20,14,24,0.55)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, y0 + 34); g.bezierCurveTo(w * 0.3, y0 + 26, w * 0.6, y0 + 46, w, y0 + 32); g.stroke();
      g.restore();
      g.fillStyle = 'rgba(255,210,170,0.22)'; g.fillRect(0, 0, w, 2);
    });

    return { far, mid, ground };
  }

  /* ================================================================ */
  /* KITCHEN                                                           */
  /* ================================================================ */
  function buildKitchen(w, floor) {
    const far = makeLayer(w, H, (g) => {
      g.fillStyle = '#221724'; g.fillRect(0, 0, w, floor + 40);
      // tiled wall
      const tw = 48, th = 34;
      for (let y = 40; y < floor - 40; y += th) {
        for (let x = -10; x < w; x += tw) {
          const off = ((y / th) | 0) % 2 ? tw / 2 : 0;
          const shade = 0.9 + ((x * 7 + y * 13) % 10) / 60;
          g.fillStyle = `rgb(${Math.round(214 * shade)},${Math.round(196 * shade)},${Math.round(170 * shade)})`;
          g.fillRect(x + off, y, tw - 3, th - 3);
          g.fillStyle = 'rgba(255,255,255,0.14)';
          g.fillRect(x + off, y, tw - 3, 3);
          g.fillStyle = 'rgba(120,90,70,0.12)';
          g.fillRect(x + off, y + th - 6, tw - 3, 3);
        }
      }
      // grout
      g.strokeStyle = 'rgba(90,66,58,0.35)'; g.lineWidth = 1;
      for (let y = 40; y < floor; y += th) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      // upper cabinets
      for (let i = 0; i < 7; i++) {
        const cx = -20 + i * (w / 6);
        const cw = w / 6 - 16;
        wood(g, cx, 44, cw, 96, '#7b4f34', '#4e2f1e');
        g.strokeStyle = '#3a2114'; g.lineWidth = 2; g.strokeRect(cx, 44, cw, 96);
        g.strokeStyle = 'rgba(255,220,180,0.16)'; g.lineWidth = 1.5;
        g.strokeRect(cx + 5, 49, cw - 10, 86);
        g.fillStyle = '#c9a15a'; g.fillRect(cx + cw / 2 - 8, 82, 16, 4);
        g.fillStyle = '#e0c078'; g.fillRect(cx + cw / 2 - 7, 81, 14, 2);
      }
      // shelves + jars
      for (let i = 0; i < 5; i++) {
        const sx = 30 + i * (w / 5);
        const sy = 158;
        g.fillStyle = '#6b432a'; g.fillRect(sx, sy, w / 5 - 40, 7);
        g.fillStyle = 'rgba(255,220,170,0.2)'; g.fillRect(sx, sy, w / 5 - 40, 2);
        const rnd = seeded(11 + i);
        for (let j = 0; j < 4; j++) {
          const jx = sx + 10 + j * 26;
          const jh = 22 + rnd() * 16;
          g.fillStyle = ['#c94f3a', '#7d9a5a', '#c9a13a', '#6a7a9c'][(rnd() * 4) | 0];
          g.fillRect(jx, sy - jh, 17, jh);
          g.fillStyle = 'rgba(255,255,255,0.25)';
          g.fillRect(jx + 2, sy - jh + 2, 4, jh - 4);
          g.fillStyle = '#3a2a1e';
          g.fillRect(jx - 1, sy - jh - 5, 19, 6);
        }
      }
      // window to night city
      const wx = w * 0.42, wy = 78, ww = 210, wh = 130;
      g.fillStyle = '#1c2438'; g.fillRect(wx, wy, ww, wh);
      const ng = g.createLinearGradient(wx, wy, wx, wy + wh);
      ng.addColorStop(0, '#1a2b46'); ng.addColorStop(1, '#3b4a68');
      g.fillStyle = ng; g.fillRect(wx + 6, wy + 6, ww - 12, wh - 12);
      glowDot(g, wx + 52, wy + 60, 70, 'rgba(255,240,200,0.28)', 1);
      g.beginPath(); g.arc(wx + 52, wy + 58, 18, 0, TAU); g.fillStyle = '#fdf3d2'; g.fill();
      const rnd2 = seeded(88);
      for (let i = 0; i < 9; i++) {
        const bw2 = 12 + rnd2() * 20, bh2 = 30 + rnd2() * 50;
        const bx2 = wx + 10 + i * 22;
        g.fillStyle = 'rgba(20,28,44,0.9)'; g.fillRect(bx2, wy + wh - 10 - bh2, bw2, bh2);
        for (let k = 0; k < 3; k++) {
          if (rnd2() > 0.45) {
            g.fillStyle = 'rgba(255,210,140,0.8)';
            g.fillRect(bx2 + 3, wy + wh - 8 - bh2 + k * 10, 3, 4);
          }
        }
      }
      g.strokeStyle = '#5a3a24'; g.lineWidth = 8; g.strokeRect(wx, wy, ww, wh);
      g.strokeStyle = '#3a2114'; g.lineWidth = 2; g.strokeRect(wx + 4, wy + 4, ww - 8, wh - 8);
      g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
      g.beginPath(); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
      // ambient warm light pools
      glowDot(g, w * 0.22, 120, 220, 'rgba(255,190,110,0.16)', 1);
      glowDot(g, w * 0.7, 140, 240, 'rgba(255,170,90,0.12)', 1);
    });

    const mid = makeLayer(w, H, (g) => {
      // range hood with chimney + steel trim
      const hx = w * 0.5;
      g.fillStyle = '#3b3b46';
      g.fillRect(hx - 54, 0, 108, 62);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(hx - 50, 0, 10, 62);
      g.fillStyle = '#34343e';
      g.beginPath();
      g.moveTo(hx - 200, 62); g.lineTo(hx + 200, 62);
      g.lineTo(hx + 142, 146); g.lineTo(hx - 142, 146); g.closePath();
      g.fill();
      const hg = g.createLinearGradient(0, 62, 0, 146);
      hg.addColorStop(0, 'rgba(255,255,255,0.3)'); hg.addColorStop(0.55, 'rgba(255,255,255,0.06)'); hg.addColorStop(1, 'rgba(0,0,0,0.25)');
      g.fillStyle = hg; g.fill();
      g.strokeStyle = '#23232b'; g.lineWidth = 4; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(hx - 190, 68); g.lineTo(hx - 138, 138); g.stroke();
      g.fillStyle = '#6c7078';
      g.fillRect(hx - 146, 140, 292, 10);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(hx - 146, 142, 292, 2);
      // hood lamps
      [hx - 96, hx + 96].forEach(x => glowDot(g, x, 152, 46, 'rgba(255,205,120,0.34)', 1));
      g.fillStyle = '#c9b89a'; g.fillRect(hx - 146, 146, 292, 6);

      // counters / stove line
      for (let i = 0; i < 4; i++) {
        const cx = i * (w / 4) - 30;
        const cw = w / 4 + 10;
        // lower cabinets
        wood(g, cx, floor - 96, cw, 96, '#6b4028', '#3d2618');
        g.strokeStyle = '#2a1a10'; g.lineWidth = 2;
        for (let d = 0; d < 2; d++) {
          g.strokeRect(cx + 8 + d * (cw / 2 - 4), floor - 88, cw / 2 - 16, 78);
          g.fillStyle = '#c9a15a';
          g.fillRect(cx + 8 + d * (cw / 2 - 4) + cw / 4 - 24, floor - 56, 22, 4);
        }
        // countertop
        const cg = g.createLinearGradient(0, floor - 106, 0, floor - 86);
        cg.addColorStop(0, '#cfd6d8'); cg.addColorStop(0.5, '#9aa3a8'); cg.addColorStop(1, '#6a7276');
        g.fillStyle = cg; g.fillRect(cx, floor - 106, cw, 12);
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(cx, floor - 105, cw, 2);
      }
      // stove burners + flames base
      for (let s = 0; s < 2; s++) {
        const sx = w * 0.24 + s * 190;
        g.fillStyle = '#2b2b32';
        g.beginPath(); g.ellipse(sx, floor - 108, 44, 12, 0, 0, TAU); g.fill();
        g.strokeStyle = '#4a4a52'; g.lineWidth = 3; g.stroke();
        g.strokeStyle = '#141418'; g.lineWidth = 2;
        g.beginPath(); g.ellipse(sx, floor - 108, 26, 7, 0, 0, TAU); g.stroke();
      }
      // pots
      [[w * 0.16, 30], [w * 0.24 + 96, 24], [w * 0.64, 32]].forEach(([px, pr], i) => {
        // pot sitting on the burner
        g.fillStyle = '#4a4e58';
        g.fillRect(px - pr, floor - 148, pr * 2, 40);
        g.beginPath(); g.ellipse(px, floor - 148, pr, 8, 0, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(px, floor - 108, pr, 7, 0, 0, TAU); g.fill();
        const pg = g.createLinearGradient(px - pr, 0, px + pr, 0);
        pg.addColorStop(0, 'rgba(255,255,255,0.3)'); pg.addColorStop(0.5, 'rgba(255,255,255,0.05)'); pg.addColorStop(1, 'rgba(0,0,0,0.2)');
        g.fillStyle = pg; g.fillRect(px - pr, floor - 146, pr * 2, 36);
        g.strokeStyle = '#22242a'; g.lineWidth = 2;
        g.strokeRect(px - pr, floor - 146, pr * 2, 36);
        g.beginPath(); g.ellipse(px, floor - 146, pr * 0.8, 6, 0, 0, TAU);
        g.strokeStyle = '#6a6e78'; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#3a3e46'; g.fillRect(px - pr - 12, floor - 140, 12, 5);
        g.fillRect(px + pr, floor - 140, 12, 5);
        // cutting board / veggies
        if (i === 1) {
          g.fillStyle = '#c9a46a'; rr(g, px + 46, floor - 114, 66, 8, 3); g.fill();
          g.fillStyle = '#e23b38'; g.beginPath(); g.arc(px + 60, floor - 120, 8, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(20,10,20,0.4)'; g.lineWidth = 1.4; g.stroke();
          g.fillStyle = '#4ea443'; g.beginPath(); g.arc(px + 78, floor - 120, 7, 0, TAU); g.fill();
          g.stroke();
        }
      });
      // hanging utensils
      const rnd = seeded(31);
      g.strokeStyle = '#2e2a26'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(w * 0.62, 190); g.lineTo(w * 0.95, 190); g.stroke();
      for (let i = 0; i < 6; i++) {
        const ux = w * 0.64 + i * 42;
        g.strokeStyle = '#7a7f88'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ux, 190); g.lineTo(ux, 206 + (i % 3) * 6); g.stroke();
        g.fillStyle = '#8d939c';
        if (i % 3 === 0) { g.beginPath(); g.ellipse(ux, 218, 9, 12, 0, 0, TAU); g.fill(); }
        else if (i % 3 === 1) { g.beginPath(); g.moveTo(ux - 8, 206); g.lineTo(ux + 8, 206); g.lineTo(ux, 232); g.closePath(); g.fill(); }
        else { g.fillRect(ux - 2, 206, 4, 26); }
        g.strokeStyle = 'rgba(20,16,20,0.5)'; g.lineWidth = 1;
        g.stroke();
      }
      // pendant lamps
      for (let i = 0; i < 3; i++) {
        const lx = w * 0.18 + i * (w * 0.32);
        g.strokeStyle = '#2a2420'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx, 74); g.stroke();
        g.fillStyle = '#34343c';
        g.beginPath(); g.moveTo(lx - 26, 108); g.lineTo(lx + 26, 108); g.lineTo(lx + 12, 76); g.lineTo(lx - 12, 76); g.closePath(); g.fill();
        g.strokeStyle = '#1c1c22'; g.lineWidth = 2; g.stroke();
        lantern(g, lx, 112, 9, '#ffdf9a');
        glowDot(g, lx, 118, 90, 'rgba(255,196,110,0.18)', 1);
      }
    });

    const ground = makeLayer(w, 200, (g) => {
      const y0 = floor;
      const lg = g.createLinearGradient(0, 0, 0, 200);
      lg.addColorStop(0, '#59525c');
      lg.addColorStop(1, '#2c2630');
      g.fillStyle = lg; g.fillRect(0, 0, w, 200);
      g.save(); g.translate(0, -y0);
      // checker tiles in perspective
      const tile = 60;
      for (let row = 0; row < 5; row++) {
        const yy = y0 + row * 12 + row * row * 3;
        const hh = 12 + row * 5;
        for (let x = -60; x < w + 60; x += tile) {
          const odd = ((x / tile) + row) % 2 === 0;
          g.fillStyle = odd ? 'rgba(232,220,200,0.10)' : 'rgba(20,14,22,0.22)';
          g.beginPath();
          g.moveTo(x, yy); g.lineTo(x + tile, yy);
          g.lineTo(x + tile + 6, yy + hh); g.lineTo(x - 6, yy + hh);
          g.closePath(); g.fill();
        }
      }
      const rnd = seeded(71);
      for (let i = 0; i < 24; i++) {
        const x = rnd() * w, y = y0 + 18 + rnd() * 56;
        const ag = g.createRadialGradient(x, y, 1, x, y, 40 + rnd() * 50);
        ag.addColorStop(0, 'rgba(255,200,130,0.22)');
        ag.addColorStop(1, 'rgba(255,200,130,0)');
        g.fillStyle = ag;
        g.beginPath(); g.ellipse(x, y, 50, 10, 0, 0, TAU); g.fill();
      }
      // drain
      g.fillStyle = '#3a343c';
      rr(g, w * 0.5 - 60, y0 + 90, 120, 26, 6); g.fill();
      g.strokeStyle = 'rgba(20,14,22,0.6)'; g.lineWidth = 2; g.stroke();
      for (let i = 0; i < 6; i++) {
        g.fillStyle = '#22202a'; g.fillRect(w * 0.5 - 48 + i * 18, y0 + 94, 8, 18);
      }
      g.restore();
      g.fillStyle = 'rgba(255,220,180,0.2)'; g.fillRect(0, 0, w, 2);
    });

    return { far, mid, ground };
  }

  A.build = function (arena) {
    if (layers[arena.id]) return layers[arena.id];
    let built;
    if (arena.draw === 'rooftop') built = buildRooftop(arena.width, arena.floor);
    else if (arena.draw === 'kitchen') built = buildKitchen(arena.width, arena.floor);
    else built = buildMarket(arena.width, arena.floor);
    layers[arena.id] = built;
    return built;
  };

  /* ---------------------------------------------------------------- */
  /* Live drawing                                                     */
  /* ---------------------------------------------------------------- */
  A.draw = function (ctx, arena, cam, t, quality) {
    const L = A.build(arena);
    const floor = arena.floor;
    ctx.save();
    ctx.drawImage(L.far, -cam * 0.16, 0);
    ctx.drawImage(L.mid, -cam * 0.5, 0);

    // animated background details (parallax with mid layer)
    ctx.save();
    ctx.translate(-cam * 0.5, 0);
    if (arena.draw === 'market') {
      // lantern glow pulse
      for (let i = 0; i < 6; i++) {
        const x = 20 + i * 300;
        const pulse = 0.7 + Math.sin(t * 0.05 + i * 1.7) * 0.3;
        glowDot(ctx, x + 250, floor - 160, 34 * pulse, 'rgba(255,196,110,0.22)', 1);
      }
      if (quality !== 'low') {
        // dust motes
        for (let i = 0; i < 18; i++) {
          const x = ((i * 137 + t * 0.2) % arena.width + arena.width) % arena.width;
          const y = 180 + Math.sin(i * 2 + t * 0.01) * 60 + (i % 5) * 22;
          ctx.globalAlpha = 0.16 + (i % 3) * 0.06;
          ctx.fillStyle = '#ffe2ad';
          ctx.beginPath(); ctx.arc(x, y, 1.4 + (i % 3) * 0.5, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // falling leaf
      const lf = (t * 0.5) % (arena.width + 200) - 100;
      ctx.save();
      ctx.translate(lf, 200 + Math.sin(t * 0.02) * 30 + (t * 0.3) % 120);
      ctx.rotate(Math.sin(t * 0.03) * 0.8);
      ctx.fillStyle = 'rgba(180,150,70,0.75)';
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (arena.draw === 'rooftop') {
      // drifting clouds
      if (quality !== 'low') {
        for (let i = 0; i < 7; i++) {
          const cx = ((i * 320 + t * (0.16 + i * 0.03)) % (arena.width + 500)) - 200;
          const cy = 70 + (i % 4) * 48;
          ctx.globalAlpha = 0.15 + (i % 3) * 0.05;
          ctx.fillStyle = i % 2 ? '#ffd9a8' : '#c99ac0';
          for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.ellipse(cx + k * 34, cy + (k % 2) * 6, 60 - k * 7, 12 - k * 1.4, 0, 0, TAU);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
      // blinking antenna light
      const blink = (Math.sin(t * 0.06) > 0.4) ? 1 : 0.12;
      for (let i = 0; i < 4; i++) {
        const x = 140 + i * (arena.width / 4.1);
        ctx.globalAlpha = blink;
        glowDot(ctx, x, arena.floor - 194, 16, 'rgba(255,90,90,0.7)', 1);
        ctx.globalAlpha = 1;
      }
      if (quality !== 'low') {
        // wind particles
        for (let i = 0; i < 14; i++) {
          const x = ((i * 173 + t * 1.4) % arena.width);
          const y = 260 + (i % 6) * 26 + Math.sin(t * 0.03 + i) * 10;
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = '#ffe6c8';
          ctx.beginPath(); ctx.ellipse(x, y, 16, 1.4, 0.06, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // kitchen steam + flame flicker
      const steamSources = [arena.width * 0.16, arena.width * 0.24 + 96, arena.width * 0.64];
      if (quality !== 'low') {
        steamSources.forEach((sx, si) => {
          for (let i = 0; i < 4; i++) {
            const ph = ((t * 0.009 + i * 0.25 + si * 0.3) % 1);
            ctx.globalAlpha = (1 - ph) * 0.22;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(sx + Math.sin(ph * 6 + i) * 14, arena.floor - 150 - ph * 120, 10 + ph * 20, 8 + ph * 14, 0, 0, TAU);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;
      }
      for (let s = 0; s < 2; s++) {
        const sx = arena.width * 0.24 + s * 190;
        const flick = 0.72 + Math.sin(t * 0.35 + s * 2) * 0.18 + Math.sin(t * 0.9) * 0.1;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const fg = ctx.createRadialGradient(sx, arena.floor - 118, 2, sx, arena.floor - 118, 60 * flick);
        fg.addColorStop(0, 'rgba(255,220,150,0.55)');
        fg.addColorStop(0.45, 'rgba(255,140,60,0.28)');
        fg.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = fg;
        ctx.fillRect(sx - 70, arena.floor - 190, 140, 100);
        // flame tongues
        for (let i = 0; i < 5; i++) {
          const ph = (t * 0.12 + i * 0.4) % 1;
          const fx = sx - 24 + i * 12;
          const fh = 10 + Math.sin(t * 0.4 + i) * 4 + ph * 8;
          ctx.beginPath();
          ctx.ellipse(fx, arena.floor - 110 - fh * 0.5, 5 - i * 0.4, fh, 0, 0, TAU);
          ctx.fillStyle = `rgba(255,${170 + i * 12},80,${0.5 - ph * 0.25})`;
          ctx.fill();
        }
        ctx.restore();
      }
      // lamp flicker overlay
      const lamp = 0.9 + Math.sin(t * 0.02) * 0.05;
      ctx.globalAlpha = 0.05 * lamp;
      ctx.fillStyle = '#ffcf8a';
      ctx.fillRect(0, 0, arena.width, arena.floor);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // floor
    ctx.drawImage(L.ground, -cam, floor - 0);

    // ambient light wash + vignette in world space
    const wash = ctx.createLinearGradient(0, 0, 0, H);
    if (arena.draw === 'market') {
      wash.addColorStop(0, 'rgba(70,40,110,0.18)');
      wash.addColorStop(0.6, 'rgba(20,10,30,0)');
      wash.addColorStop(1, 'rgba(10,6,16,0.5)');
    } else if (arena.draw === 'rooftop') {
      wash.addColorStop(0, 'rgba(255,150,110,0.10)');
      wash.addColorStop(0.65, 'rgba(255,120,80,0)');
      wash.addColorStop(1, 'rgba(30,10,40,0.42)');
    } else {
      wash.addColorStop(0, 'rgba(255,180,110,0.10)');
      wash.addColorStop(0.7, 'rgba(30,16,20,0)');
      wash.addColorStop(1, 'rgba(14,8,14,0.5)');
    }
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  /* arena preview thumbnail for the stage select screen */
  A.thumbnail = function (arena) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 180;
    const g = c.getContext('2d');
    g.save();
    g.scale(0.333, 0.333);
    A.draw(g, arena, 200, 0, 'low');
    g.restore();
    g.fillStyle = 'rgba(10,6,18,0.18)';
    g.fillRect(0, 0, 320, 180);
    return c;
  };

  A.drawProjectileShadow = function () {};
})();
