/* TOOKEND TYNDOUT: PRODUCE BRAWL — PRODUCE PANIC
   Wave survival: escalating produce hordes, auto-fire, upgrade picks, boss waves. */
(function () {
  'use strict';
  const TT = window.TT;
  const G = TT.Game;
  const W = 960, H = 540;
  const TAU = Math.PI * 2;
  const INK = '#1a1018';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  /* ---------------------------------------------------------------- */
  /* Difficulties                                                      */
  /* ---------------------------------------------------------------- */
  const DIFFS = {
    easy: {
      key: 'easy', name: 'EASY', hp: 0.72, dmg: 0.65, rate: 0.72, speed: 0.92, elite: 7,
      desc: 'A gentle first shift. Fewer enemies and softer hits.'
    },
    normal: {
      key: 'normal', name: 'NORMAL', hp: 1, dmg: 1, rate: 1, speed: 1, elite: 5,
      desc: 'The intended panic. Every wave gets meaner.'
    },
    hard: {
      key: 'hard', name: 'HARD', hp: 1.35, dmg: 1.25, rate: 1.22, speed: 1.06, elite: 4,
      desc: 'Faster spawns, tougher rinds and early elites.'
    },
    insane: {
      key: 'insane', name: 'INSANE', hp: 1.8, dmg: 1.5, rate: 1.46, speed: 1.12, elite: 3,
      desc: 'Dense waves and brutes that will not flinch.'
    },
    nightmare: {
      key: 'nightmare', name: 'ROTTEN NIGHTMARE', hp: 2.4, dmg: 1.9, rate: 1.72, speed: 1.18, elite: 2,
      desc: 'The Rotten Core is awake. Survive as long as you can.'
    }
  };

  /* ---------------------------------------------------------------- */
  /* Enemy archetypes                                                  */
  /* ---------------------------------------------------------------- */
  const TYPES = {
    sprout: { name: 'SPROUT', hp: 18, speed: 2.0, w: 36, h: 46, dmg: 7, coins: 1, weight: 34,
      color: '#e34b3f', light: '#ff9077', dark: '#8d1f27', leaf: '#4fae43' },
    hopper: { name: 'HOPPER', hp: 26, speed: 1.5, jump: 9.6, w: 34, h: 40, dmg: 8, coins: 1, weight: 23,
      color: '#8ed24d', light: '#c8f58a', dark: '#4a7d1f', leaf: '#2f6b2a' },
    spitter: { name: 'SPITTER', hp: 24, speed: 1.2, w: 38, h: 44, dmg: 6, coins: 2, weight: 18, ranged: true,
      color: '#a463d8', light: '#dcb5ff', dark: '#5c2f80', leaf: '#7fd35b' },
    brute: { name: 'BRUTE', hp: 82, speed: 0.92, w: 60, h: 70, dmg: 15, coins: 3, weight: 13,
      color: '#c99553', light: '#f0cf94', dark: '#7a5426', leaf: '#8fbf5a' },
    flyer: { name: 'FLIER', hp: 15, speed: 2.6, w: 30, h: 32, dmg: 6, coins: 1, weight: 12, fly: true,
      color: '#7f92ff', light: '#c3ccff', dark: '#3d4fa8', leaf: '#9be0ff' }
  };

  /* ---------------------------------------------------------------- */
  /* Upgrades                                                          */
  /* ---------------------------------------------------------------- */
  const UPGRADES = [
    { id: 'sauce', name: 'HOT SAUCE', tag: 'DAMAGE', desc: '+20% projectile damage.', max: 20,
      apply: p => { p.dmgMul += 0.2; } },
    { id: 'dice', name: 'RAPID DICE', tag: 'FIRE RATE', desc: 'Shots fire 12% faster.', max: 8,
      apply: p => { p.rateMul *= 0.88; } },
    { id: 'skin', name: 'THICK SKIN', tag: 'HEALTH', desc: '+25 max HP, and heal 25 now.', max: 9,
      apply: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
    { id: 'boots', name: 'SNEAKERS', tag: 'SPEED', desc: '+10% movement speed.', max: 6,
      apply: p => { p.speedMul += 0.1; } },
    { id: 'split', name: 'SPLIT SHOT', tag: 'MULTISHOT', desc: '+1 projectile in every volley.', max: 4,
      apply: p => { p.projCount += 1; } },
    { id: 'pierce', name: 'PIERCING PITH', tag: 'PIERCE', desc: 'Shots pass through 1 more enemy.', max: 4,
      apply: p => { p.pierce += 1; } },
    { id: 'crit', name: 'CRIT JUICE', tag: 'CRITICAL', desc: '+10% chance to deal double damage.', max: 6,
      apply: p => { p.crit += 0.1; } },
    { id: 'magnet', name: 'MARKET MAGNET', tag: 'PICKUP', desc: '+45% experience pickup radius.', max: 5,
      apply: p => { p.magnetMul += 0.45; } },
    { id: 'regen', name: 'REGROWTH', tag: 'HEALING', desc: 'Regenerate 1 HP every 2 seconds.', max: 5,
      apply: p => { p.regen += 1; } },
    { id: 'plate', name: 'RIND PLATING', tag: 'ARMOR', desc: 'Take 1 less damage from every hit.', max: 4,
      apply: p => { p.armor += 1; } },
    { id: 'boom', name: 'AFTERBURN', tag: 'AREA', desc: 'Shots burst on impact for splash damage.', max: 3,
      apply: p => { p.explode += 1; } },
    { id: 'jets', name: 'JUMP JETS', tag: 'MOBILITY', desc: '+1 mid-air jump and a faster dash.', max: 2,
      apply: p => { p.maxJumps += 1; p.dashCdMax = Math.max(22, p.dashCdMax - 9); } },
    { id: 'vine', name: 'VAMPIRE VINE', tag: 'LIFESTEAL', desc: 'Heal 1 HP every 10 kills.', max: 4,
      apply: p => { p.lifesteal += 1; } },
    { id: 'clock', name: 'OVERCLOCK', tag: 'GLASS CANNON', desc: '+25% fire rate, but -12 max HP.', max: 4,
      apply: p => { p.rateMul *= 0.8; p.maxHp = Math.max(25, p.maxHp - 12); p.hp = Math.min(p.hp, p.maxHp); } },
    { id: 'bertha', name: 'BIG BERTHA', tag: 'HEAVY', desc: '+40% damage, 8% slower shots.', max: 3,
      apply: p => { p.dmgMul += 0.4; p.rateMul *= 1.08; } },
    { id: 'purse', name: 'COIN PURSE', tag: 'ECONOMY', desc: '+30% coins and cheaper rerolls.', max: 3,
      apply: p => { p.coinMul += 0.3; p.rerollOff += 2; } }
  ];

  const BEST_KEY = 'tt_survival_best_v1';
  function loadBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function saveBest(map) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(map)); } catch (e) {}
  }

  /* ---------------------------------------------------------------- */
  /* Module                                                            */
  /* ---------------------------------------------------------------- */
  const S = TT.Survival = {
    active: false, paused: false, wave: 1, waveT: 0, waveLen: 22 * 60,
    enemies: [], shots: [], hazards: [], gems: [], coins: [], texts: [],
    player: null, arena: TT.ARENAS[0], diff: DIFFS.normal, char: 'lemon', skin: 0,
    t: 0, camX: 0, spawnT: 0, bossSpawned: false, bossAlive: false,
    kills: 0, coinsEarned: 0, pendingPicks: 0, picks: [], rerolls: 0,
    ann: null, waveClearT: 0, quality: 'high', opts: null, best: loadBest(),
    notice: null, noticeT: 0,

    difficulties: DIFFS,
    types: TYPES,
    upgrades: UPGRADES,

    /* -------------------------------------------------------------- */
    start(opts) {
      opts = opts || {};
      this.opts = opts;
      this.arena = opts.arena || pick(TT.ARENAS);
      this.diff = DIFFS[opts.difficulty] || DIFFS.normal;
      this.char = opts.char || 'lemon';
      this.skin = opts.skin || 0;
      this.active = true;
      this.paused = false;
      this.t = 0; this.camX = 0;
      this.kills = 0; this.coinsEarned = 0; this.rerolls = 0;
      this.wave = 1; this.pendingPicks = 0; this.picks = [];
      this.enemies = []; this.shots = []; this.hazards = []; this.gems = []; this.coins = []; this.texts = [];
      this.bossSpawned = false; this.bossAlive = false; this.waveClearT = 0;
      this.waveWin = false;
      this.player = this.makePlayer();
      this._shotGlow = makeGlow(this.player.colors.light || '#ffe14d');
      this._gemGlow = makeGlow('#ffe9a8');
      this.quality = G.quality;
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      TT.FX.reset();
      this.beginWave(true);
      TT.Audio.startMusic(this.arena, false);
    },

    makePlayer() {
      const char = TT.getChar(this.char);
      const scale = 1.42 * char.scale;
      return {
        char, colors: TT.Art.palette(char, this.skin), scale,
        x: this.arena.width * 0.5, y: this.arena.floor, groundY: this.arena.floor,
        vx: 0, vy: 0, facing: 1, airborne: false, jumps: 0, maxJumps: 1,
        hurtW: char.hurtW * scale * 0.8, hurtH: 96 * scale * 0.92,
        hp: 100, maxHp: 100, baseDmg: 9, dmgMul: 1, rateMul: 1, fireEvery: 26, fireCd: 0,
        projCount: 1, pierce: 0, crit: 0.05, explode: 0, speedMul: 1, speed: 3.8,
        jump: 11.9, magnetMul: 1, armor: 0, regen: 0, regenT: 0, lifesteal: 0, killCount: 0,
        dashCd: 0, dashCdMax: 48, iframe: 0, hurtFlash: 0, animT: 0, blinkT: rand(80, 220),
        meter: 0, level: 1, xp: 0, xpNeed: 10, coinMul: 1, rerollOff: 0, coins: 0, stacks: {},
        pose: {
          sx: 1, sy: 1, lift: 0, armFront: 0.55, armBack: -0.5, legSwing: 0,
          mouth: 'smirk', brow: 0.35, look: { x: 0, y: 0 }, headTilt: 0, aura: 0.12, blink: false, guard: 0
        }
      };
    },

    beginWave(first) {
      const p = this.player;
      this.waveLen = (this.wave % 5 === 0 ? 30 : 22) * 60;
      this.waveT = this.waveLen;
      this.spawnT = first ? 46 : 32;
      this.bossSpawned = false;
      this.bossAlive = false;
      this.waveClearT = 0;
      this.waveWin = false;
      this._offered = false;
      this.ann = { title: this.wave % 5 === 0 ? 'ROTTEN WAVE' : 'WAVE ' + this.wave,
        sub: this.wave % 5 === 0 ? 'A boss is coming' : p.char.name + ' · ' + this.diff.name, t: 0, life: 96 };
      TT.sfx('round');
      TT.Audio.startMusic(this.arena, this.wave % 5 === 0);
    },

    finishWave() {
      if (this.waveWin) return;
      this.waveWin = true;
      this.waveClearT = 50;
      TT.sfx('ko');
      TT.FX.flash('#ffe9a8', 0.4);
      // clear the stragglers
      this.enemies.forEach(e => {
        TT.FX.spark(e.x, e.y - e.h * 0.5, 8, 'neutral', 0.8);
      });
      this.enemies.length = 0;
      this.shots.length = 0;
      this.hazards.length = 0;
      this.ann = { title: 'WAVE CLEAR', sub: '+' + (this.pendingPicks + 1) + ' UPGRADE', t: 0, life: 70 };
    },

    nextWave() {
      this.wave++;
      this.pendingPicks = 0;
      this.picks = [];
      this.beginWave(false);
    },

    /* -------------------------------------------------------------- */
    /* Upgrades                                                       */
    /* -------------------------------------------------------------- */
    rollPicks() {
      const p = this.player;
      const pool = UPGRADES.filter(u => (p.stacks[u.id] || 0) < u.max);
      const out = [];
      const used = {};
      let guard = 0;
      while (out.length < 3 && guard++ < 200 && pool.length) {
        const u = pick(pool);
        if (used[u.id]) continue;
        used[u.id] = 1;
        out.push(u);
      }
      if (!out.length) out.push(UPGRADES[0]);
      this.picks = out;
      return out;
    },

    offerUpgrades() {
      this.rollPicks();
      G.paused = true;
      this.paused = true;
      TT.UI.showUpgrades(this.picks, this.player.coins || this.coinsEarned, this.rerollCost(), this.pendingPicks);
    },

    rerollCost() {
      return Math.max(2, 6 + this.rerolls * 3 - this.player.rerollOff);
    },

    reroll() {
      const cost = this.rerollCost();
      if ((this.player.coins || 0) < cost) return null;
      this.player.coins -= cost;
      this.coinsEarned -= cost;
      this.rerolls++;
      this.rollPicks();
      return this.picks;
    },

    choose(id) {
      const u = UPGRADES.filter(x => x.id === id)[0];
      if (!u || !this.player) return;
      const p = this.player;
      p.stacks = p.stacks || {};
      p.stacks[id] = (p.stacks[id] || 0) + 1;
      u.apply(p);
      TT.sfx('select');
      this.pendingPicks--;
      if (this.pendingPicks > 0) {
        this.rollPicks();
        TT.UI.showUpgrades(this.picks, p.coins || 0, this.rerollCost(), this.pendingPicks);
        return;
      }
      G.paused = false;
      this.paused = false;
      TT.UI.showScreen('fight');
      this.nextWave();
    },

    /* -------------------------------------------------------------- */
    /* Spawning                                                       */
    /* -------------------------------------------------------------- */
    spawnEnemy(typeKey, opts) {
      opts = opts || {};
      if (this.enemies.length > 30) return null;
      const base = TYPES[typeKey] || TYPES.sprout;
      const wave = this.wave;
      const d = this.diff;
      const side = opts.side || (Math.random() < 0.5 ? -1 : 1);
      // spawn just outside the camera view so the horde arrives immediately
      const leftEdge = clamp(this.camX - 28, 26, this.arena.width - 26);
      const rightEdge = clamp(this.camX + W + 28, 26, this.arena.width - 26);
      const off = opts.x != null ? opts.x : (side < 0 ? leftEdge : rightEdge);
      const elite = !!opts.elite || (wave >= d.elite && Math.random() < Math.min(0.42, 0.045 * (wave - d.elite + 1)));
      const hpBase = base.hp * (1 + (wave - 1) * 0.22) * d.hp * (elite ? 2.1 : 1);
      const e = {
        type: typeKey, name: base.name, base,
        x: clamp(off, -60, this.arena.width + 60),
        y: opts.y != null ? opts.y : this.arena.floor,
        vx: 0, vy: 0, w: base.w * (elite ? 1.42 : 1), h: base.h * (elite ? 1.42 : 1),
        hp: hpBase, maxHp: hpBase,
        speed: base.speed * (0.85 + wave * 0.018) * d.speed * (elite ? 0.9 : 1),
        dmg: base.dmg * (1 + (wave - 1) * 0.09) * d.dmg * (elite ? 1.35 : 1),
        face: side < 0 ? 1 : -1, elite, fly: !!base.fly, onGround: true,
        cd: Math.round(rand(40, 120)), flash: 0, hitLag: 0, animT: rand(0, 100),
        boss: !!opts.boss, coins: base.coins * (elite ? 2 : 1), phase: 0, dead: false
      };
      if (opts.boss) {
        const hp = (200 + wave * 70) * d.hp;
        e.hp = e.maxHp = hp;
        e.w = 132; e.h = 142; e.speed = 1.15 * d.speed; e.dmg = 20 * d.dmg;
        e.coins = 24; e.name = 'CORRUPTED ' + (['WATERMELON', 'BROCOLLI', 'PUMPKIN'][wave % 3]); e.boss = true;
      }
      this.enemies.push(e);
      return e;
    },

    spawnDrip() {
      const wave = this.wave;
      const pool = [];
      const weights = { sprout: TYPES.sprout.weight, hopper: TYPES.hopper.weight, spitter: TYPES.spitter.weight, brute: TYPES.brute.weight, flyer: TYPES.flyer.weight };
      if (wave < 2) weights.spitter = 0;
      if (wave < 3) weights.brute = 0;
      if (wave < 4) weights.flyer = 0;
      let total = 0;
      Object.keys(weights).forEach(k => { if (weights[k] > 0) { pool.push({ k, w: weights[k] }); total += weights[k]; } });
      let r = Math.random() * total;
      let chosen = 'sprout';
      for (let i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) { chosen = pool[i].k; break; } }
      const near = Math.random() < 0.35 && this.player;
      const x = near ? clamp(this.player.x + (Math.random() < 0.5 ? -1 : 1) * rand(340, 460), 70, this.arena.width - 70) : null;
      this.spawnEnemy(chosen, x != null ? { x } : null);
    },

    /* -------------------------------------------------------------- */
    /* Player actions                                                 */
    /* -------------------------------------------------------------- */
    shoot(target) {
      const p = this.player;
      const n = Math.max(1, p.projCount);
      const baseA = Math.atan2((target.y - target.h * 0.5) - (p.y - p.hurtH * 0.55), target.x - (p.x + p.facing * 18));
      for (let i = 0; i < n; i++) {
        const spread = n === 1 ? 0 : (i - (n - 1) / 2) * 0.14;
        const a = baseA + spread + rand(-0.02, 0.02);
        const crit = Math.random() < p.crit;
        const speed = 12.5;
        this.shots.push({
          x: p.x + p.facing * 22, y: p.y - p.hurtH * 0.55,
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
          r: 8, life: 66, pierce: p.pierce,
          dmg: p.baseDmg * p.dmgMul * (crit ? 2 : 1), crit,
          color: p.colors.light, accent: p.colors.accent, explode: p.explode
        });
      }
      p.fireCd = Math.max(7, Math.round(p.fireEvery * p.rateMul));
      TT.sfx('light');
      TT.FX.spark(p.x + p.facing * 30, p.y - p.hurtH * 0.55, 4, p.char.id === 'king' ? 'royal' : p.char.id, 0.5);
    },

    nearestEnemy(maxDist) {
      let best = null, bd = maxDist || 900;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.x < this.camX - 10 || e.x > this.camX + W + 10) continue; // only shoot what the player can see
        const d = Math.abs(e.x - this.player.x) + Math.abs((e.y - e.h * 0.5) - (this.player.y - this.player.hurtH * 0.5)) * 0.4;
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    },

    hurtPlayer(dmg, dir, source) {
      const p = this.player;
      if (!p || p.iframe > 0 || !this.active) return;
      const amount = Math.max(1, dmg - p.armor);
      p.hp -= amount;
      p.iframe = 34;
      p.hurtFlash = 1;
      p.vx = (dir || -p.facing) * 4.4;
      if (!p.airborne) p.vy = -3.2;
      TT.FX.text(p.x, p.y - p.hurtH - 10, '-' + Math.round(amount), '#ff8a72', 22);
      TT.FX.spark(p.x, p.y - p.hurtH * 0.55, 12, 'sauce', 1);
      TT.FX.shake(6);
      TT.sfx('hurt');
      if (p.hp <= 0) { p.hp = 0; this.endRun(); }
    },

    nova() {
      const p = this.player;
      if (p.meter < 100) return;
      p.meter = 0;
      TT.FX.ring(p.x, p.y - p.hurtH * 0.5, p.colors.accent, 360, 14);
      TT.FX.flash(p.colors.light, 0.5);
      TT.FX.shake(12);
      TT.sfx('super' + (p.char.id.charAt(0).toUpperCase() + p.char.id.slice(1)));
      this.enemies.forEach(e => {
        if (Math.abs(e.x - p.x) < 330) this.damageEnemy(e, 60 + this.wave * 6, p.x);
      });
      this.hazards = this.hazards.filter(h => Math.abs(h.x - p.x) > 300);
    },

    damageEnemy(e, dmg, fromX) {
      if (!e || e.dead) return;
      e.hp -= dmg;
      e.flash = 1;
      e.hitLag = 3;
      const push = Math.sign(e.x - fromX || 1) * (e.boss ? 0.6 : 3.2);
      e.vx += push;
      if (e.hp <= 0) this.killEnemy(e);
    },

    killEnemy(e) {
      if (e.dead) return;
      e.dead = true;
      const p = this.player;
      this.kills++;
      p.killCount++;
      p.meter = Math.min(100, p.meter + (e.boss ? 40 : 3));
      TT.FX.spark(e.x, e.y - e.h * 0.5, e.boss ? 46 : 16, 'neutral', e.boss ? 2 : 1);
      TT.FX.ring(e.x, e.y - e.h * 0.5, e.base.light, e.boss ? 260 : 60, e.boss ? 12 : 4);
      TT.FX.shake(e.boss ? 16 : 3);
      TT.sfx(e.boss ? 'ko' : 'impact');
      const coins = Math.max(1, Math.round(e.coins * p.coinMul));
      this.coinsEarned += coins;
      p.coins = this.coinsEarned;
      if (p.lifesteal && p.killCount % 10 === 0) p.hp = Math.min(p.maxHp, p.hp + p.lifesteal);
      const gems = e.boss ? 16 : e.elite ? 4 : 1;
      for (let i = 0; i < gems; i++) {
        if (this.gems.length > 160) break;
        this.gems.push({
          x: e.x + rand(-18, 18), y: e.y - e.h * 0.5 + rand(-14, 14),
          vx: rand(-2.6, 2.6), vy: rand(-4.4, -1.4), val: e.boss ? 6 : e.elite ? 3 : 1, life: 720, t: 0
        });
      }
      if (e.boss) {
        this.bossAlive = false;
        TT.FX.flash('#ffd25a', 0.7);
        this.ann = { title: 'BOSS DOWN', sub: 'WAVE CLEAR', t: 0, life: 90 };
        this.finishWave();
      }
      if (this.enemies.length && this.enemies[this.enemies.length - 1] === e) {
        this.enemies.pop();
      } else {
        const i = this.enemies.indexOf(e);
        if (i >= 0) this.enemies.splice(i, 1);
      }
    },

    levelUp() {
      const p = this.player;
      p.level++;
      p.xp -= p.xpNeed;
      p.xpNeed = Math.round(10 + p.level * 7);
      this.pendingPicks++;
      TT.FX.ring(p.x, p.y - p.hurtH * 0.6, '#ffe9a8', 140, 6);
      TT.FX.text(p.x, p.y - p.hurtH - 30, 'LEVEL ' + p.level, '#ffe9a8', 24);
      TT.sfx('combo', { n: 5 });
    },

    endRun() {
      if (!this.active) return;
      this.active = false;
      this.player.hp = 0;
      TT.FX.flash('#ff5b4d', 0.6);
      TT.FX.shake(18);
      TT.sfx('ko');
      const best = this.best[this.diff.key] || 0;
      const newBest = this.wave > best;
      if (newBest) { this.best[this.diff.key] = this.wave; saveBest(this.best); }
      const summary = {
        char: this.char, skin: this.skin, difficulty: this.diff.key, diffName: this.diff.name,
        wave: this.wave, kills: this.kills, coins: this.coinsEarned, level: this.player.level,
        time: Math.round(this.t / 60), best: Math.max(best, this.wave), newBest: newBest,
        arena: this.arena.name, upgrades: this.player.stacks || {}
      };
      this.lastSummary = summary;
      G.running = false;
      TT.UI.showSurvivalEnd(summary);
    },

    /* -------------------------------------------------------------- */
    /* Update                                                        */
    /* -------------------------------------------------------------- */
    update() {
      if (!this.active) return;
      this.t++;
      const p = this.player;
      const arena = this.arena;
      const inp = TT.Input.read('p1');

      if (this.ann) { this.ann.t++; if (this.ann.t > this.ann.life) this.ann = null; }

      // player movement
      const accel = 0.95;
      if (inp.left) { p.vx -= accel; p.facing = -1; }
      if (inp.right) { p.vx += accel; p.facing = 1; }
      p.vx *= 0.84;
      const maxV = p.speed * p.speedMul * (p.airborne ? 1.05 : 1.25);
      p.vx = clamp(p.vx, -maxV, maxV);
      p.x = clamp(p.x + p.vx, 44, arena.width - 44);

      if ((inp.up || inp.dashDir) && p.jumps < p.maxJumps) {
        p.vy = -p.jump;
        p.jumps++;
        p.airborne = true;
        TT.FX.dust(p.x, arena.floor, 6, 0);
        TT.sfx('jump');
      }
      p.vy += 0.62;
      p.y += p.vy;
      if (p.y >= arena.floor) {
        if (p.airborne && p.vy > 6) { TT.FX.dust(p.x, arena.floor, 7, 0); TT.sfx('land'); }
        p.y = arena.floor; p.vy = 0; p.airborne = false; p.jumps = 0;
      } else { p.airborne = true; }

      if (inp.special && p.dashCd <= 0) {
        p.vx = p.facing * 11;
        p.iframe = Math.max(p.iframe, 14);
        p.dashCd = p.dashCdMax;
        TT.FX.ring(p.x, p.y - p.hurtH * 0.4, p.colors.accent, 70, 5);
        TT.sfx('dash');
      }
      if (inp.super) this.nova();

      p.animT += Math.abs(p.vx) * 0.5 + 0.6;
      p.pose.legSwing = p.animT;
      p.pose.armFront = 0.55 + Math.sin(p.animT * 0.6) * 0.1;
      p.pose.armBack = -0.5 - Math.sin(p.animT * 0.6) * 0.1;
      p.pose.sy = p.airborne ? 1.03 : 1 + Math.sin(p.animT * 0.35) * 0.012;
      p.pose.sx = p.airborne ? 0.97 : 1 - Math.sin(p.animT * 0.35) * 0.01;
      p.pose.lift = p.airborne ? 1 : Math.sin(this.t * 0.08) * 1.6;
      p.pose.blink = (this.t % 190) > 184;
      p.pose.aura = p.meter >= 100 ? 0.4 : 0.12;
      if (p.iframe > 0) p.iframe--;
      if (p.hurtFlash > 0) p.hurtFlash = Math.max(0, p.hurtFlash - 0.08);
      if (p.dashCd > 0) p.dashCd--;
      if (p.regen > 0) {
        p.regenT++;
        if (p.regenT >= 120) { p.regenT = 0; p.hp = Math.min(p.maxHp, p.hp + p.regen); }
      }

      // auto fire
      if (p.fireCd > 0) p.fireCd--;
      const target = this.nearestEnemy(560);
      if (target && p.fireCd <= 0) this.shoot(target);

      // spawn
      this.waveT--;
      const bossWave = this.wave % 5 === 0;
      if (bossWave && !this.bossSpawned && this.waveT < this.waveLen - 90) {
        this.bossSpawned = true;
        this.bossAlive = true;
        this.spawnEnemy('brute', { boss: true, side: 1, x: arena.width + 70 });
        TT.FX.flash('#ff8a72', 0.3);
        this.ann = { title: 'BOSS', sub: 'CORRUPTED PRODUCE', t: 0, life: 100 };
        TT.sfx('boss');
      }
      if (!bossWave || this.bossSpawned) {
        this.spawnT--;
        const cap = Math.min(24, 6 + this.wave * 1.4 | 0);
        if (this.spawnT <= 0 && this.enemies.length < cap) {
          this.spawnDrip();
          const base = Math.max(24, 66 - this.wave * 3);
          this.spawnT = Math.round(base / this.diff.rate + rand(-4, 6));
        }
      }

      // enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        this.updateEnemy(this.enemies[i]);
      }

      // shots
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const s = this.shots[i];
        s.x += s.vx; s.y += s.vy; s.life--;
        let dead = s.life <= 0 || s.x < -40 || s.x > arena.width + 40;
        if (!dead) {
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead) continue;
            const cy = e.y - e.h * 0.5;
            if (Math.abs(s.x - e.x) < e.w * 0.55 + s.r && Math.abs(s.y - cy) < e.h * 0.6 + s.r) {
              this.damageEnemy(e, s.dmg, s.x);
              TT.FX.spark(s.x, s.y, s.crit ? 14 : 8, s.color === '#fff' ? 'neutral' : 'citrus', s.crit ? 1.4 : 0.8);
              if (s.crit) TT.FX.text(e.x, cy - e.h * 0.4, 'CRIT', '#ffe9a8', 16);
              if (s.explode) {
                TT.FX.ring(s.x, s.y, s.accent, 60 + s.explode * 12, 5);
                this.enemies.forEach(o => {
                  if (o !== e && Math.abs(o.x - s.x) < 70 + s.explode * 14) this.damageEnemy(o, s.dmg * 0.45, s.x);
                });
              }
              if (s.pierce > 0) { s.pierce--; } else { dead = true; }
              break;
            }
          }
        }
        if (dead) this.shots.splice(i, 1);
      }

      // enemy hazards
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        h.x += h.vx; h.y += h.vy; h.vy += h.grav || 0; h.life--;
        this.hazards[i] = h;
        if (Math.abs(h.x - p.x) < p.hurtW * 0.5 + h.r && Math.abs(h.y - (p.y - p.hurtH * 0.55)) < p.hurtH * 0.45 + h.r) {
          this.hurtPlayer(h.dmg, Math.sign(h.vx) || 1, h);
          this.hazards.splice(i, 1);
          continue;
        }
        if (h.y > arena.floor || h.life <= 0 || h.x < -50 || h.x > arena.width + 50) {
          if (h.y > arena.floor - 4) TT.FX.spark(h.x, arena.floor - 6, 6, 'shade', 0.6);
          this.hazards.splice(i, 1);
        }
      }

      // gems
      const magnetR = 86 * p.magnetMul;
      for (let i = this.gems.length - 1; i >= 0; i--) {
        const g = this.gems[i];
        g.t++;
        g.life--;
        const dx = p.x - g.x, dy = (p.y - p.hurtH * 0.55) - g.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < magnetR) {
          g.vx += dx / d * 1.4; g.vy += dy / d * 1.4;
          g.vx *= 0.9; g.vy *= 0.9;
        } else {
          g.vy += 0.32; g.vx *= 0.97;
        }
        g.x += g.vx; g.y += g.vy;
        if (g.y > arena.floor - 6) { g.y = arena.floor - 6; g.vy *= -0.3; }
        if (d < 26 || g.life <= 0) {
          if (d < 26) {
            p.xp += g.val;
            TT.FX.spark(g.x, g.y, 3, 'citrus', 0.3);
            while (p.xp >= p.xpNeed) this.levelUp();
          }
          this.gems.splice(i, 1);
        }
      }

      // camera
      const targetCam = clamp(p.x - W / 2, 0, arena.width - W);
      this.camX += (targetCam - this.camX) * 0.12;

      // wave end
      if (this.waveWin && this.waveClearT > 0) this.waveClearT--;
      if (!this.waveWin && this.waveT <= 0) this.finishWave();
      if (this.waveWin && this.waveClearT <= 0 && !this._offered) {
        this._offered = true;
        this.pendingPicks += 1;
        this.offerUpgrades();
      }
    },

    updateEnemy(e) {
      if (e.dead) return;
      const p = this.player;
      e.animT++;
      if (e.flash > 0) e.flash = Math.max(0, e.flash - 0.1);
      if (e.hitLag > 0) { e.hitLag--; return; }
      const dx = p.x - e.x;
      const dist = Math.abs(dx);
      const dir = dx >= 0 ? 1 : -1;
      e.face = dir;
      const cy = e.y - e.h * 0.5;

      if (e.fly) {
        const wantY = clamp(p.y - p.hurtH * 0.8 - 24 + Math.sin(e.animT * 0.08) * 26, 120, this.arena.floor - 40);
        e.y += (wantY - e.y) * 0.05;
        e.x += dir * e.speed;
        if (e.cd > 0) e.cd--;
        else if (dist < 70) { e.cd = 90; e.vy = 0; }
      } else {
        if (e.boss) {
          this.updateBoss(e, dir, dist);
        } else if (e.type === 'hopper') {
          if (e.onGround) {
            e.vx *= 0.8;
            e.x += dir * e.speed * 0.55;
            if (e.cd > 0) e.cd--;
            else if (dist < 520) { e.vy = -e.base.jump; e.vx = dir * e.speed * 1.5; e.onGround = false; e.cd = Math.round(rand(45, 80)); TT.FX.dust(e.x, e.y, 4, 0); }
          }
          e.vy += 0.62; e.y += e.vy; e.x += e.vx;
          if (e.y >= this.arena.floor) { e.y = this.arena.floor; e.vy = 0; e.onGround = true; e.vx = 0; }
        } else if (e.type === 'spitter') {
          const want = dist < 210 ? -dir : dist > 340 ? dir : 0;
          e.x += want * e.speed;
          if (e.cd > 0) e.cd--;
          else if (dist < 520) this.spit(e, p);
        } else if (e.type === 'brute') {
          e.x += dir * e.speed * (dist > 80 ? 1 : 0.15);
        } else {
          e.x += dir * e.speed;
        }
      }

      // separation so the horde does not stack into one pixel
      for (let i = 0; i < this.enemies.length; i++) {
        const o = this.enemies[i];
        if (o === e || o.dead) continue;
        const d = e.x - o.x;
        if (Math.abs(d) < (e.w + o.w) * 0.34 && Math.abs(e.y - o.y) < 40) {
          e.x += Math.sign(d || 1) * 0.6;
        }
      }
      e.x = clamp(e.x, 20, this.arena.width - 20);
      e.vx *= 0.9;
      e.x += 0;
      if (e.y > this.arena.floor) e.y = this.arena.floor;

      // contact damage
      const overlappingY = (p.y - p.hurtH * 0.85) < e.y && p.y > e.y - e.h * 0.9;
      if (Math.abs(e.x - p.x) < e.w * 0.5 + p.hurtW * 0.5 && overlappingY) {
        if (e.cd <= 0) {
          this.hurtPlayer(e.dmg, Math.sign(p.x - e.x) || 1, e);
          e.cd = 48;
          if (!e.fly) e.vx = -Math.sign(p.x - e.x) * 1.6;
        }
      }
      if (e.cd > 0) e.cd--;
    },

    updateBoss(e, dir, dist) {
      const p = this.player;
      e.x += dir * e.speed * (dist > 120 ? 1 : 0.2);
      if (e.cd > 0) e.cd--;
      else {
        const roll = Math.random();
        if (roll < 0.34) {
          // slam jump
          e.vy = -11;
          e.vx = dir * 4.2;
          e.slam = true;
          e.cd = 100;
        } else if (roll < 0.72) {
          // fan of rotten pips
          const n = 5;
          for (let i = 0; i < n; i++) {
            const a = Math.PI * 0.75 + (i / (n - 1)) * Math.PI * 0.5;
            this.hazards.push({ x: e.x, y: e.y - e.h * 0.55, vx: Math.cos(a) * 4.6 * dir, vy: Math.sin(a) * 3.4, r: 12, dmg: e.dmg * 0.6, life: 140, color: e.base.color });
          }
          e.cd = 86;
          TT.sfx('special');
        } else {
          this.spawnEnemy('sprout', { x: e.x + rand(-60, 60) });
          this.spawnEnemy('sprout', { x: e.x + rand(-60, 60) });
          e.cd = 120;
        }
      }
      e.vy += 0.62;
      e.y += e.vy;
      if (e.y >= this.arena.floor) {
        if (e.slam) {
          e.slam = false;
          TT.FX.ring(e.x, this.arena.floor, '#ff8a72', 240, 10);
          TT.FX.shake(10);
          TT.sfx('impact');
          if (Math.abs(e.x - p.x) < 190) this.hurtPlayer(e.dmg * 0.8, Math.sign(p.x - e.x) || 1, e);
        }
        e.y = this.arena.floor;
        e.vy = 0;
      }
    },

    spit(e, p) {
      e.cd = Math.round(rand(90, 140));
      const a = Math.atan2((p.y - p.hurtH * 0.55) - (e.y - e.h * 0.55), p.x - e.x);
      this.hazards.push({
        x: e.x + Math.sign(p.x - e.x) * 20, y: e.y - e.h * 0.55,
        vx: Math.cos(a) * 4.4, vy: Math.sin(a) * 4.4, grav: 0.06, r: 9,
        dmg: e.dmg, life: 150, color: '#b06de0'
      });
      TT.sfx('special');
    },

    /* -------------------------------------------------------------- */
    /* Rendering                                                     */
    /* -------------------------------------------------------------- */
    render() {
      const ctx = this.ctx;
      if (!ctx || !this.active) return;
      const t = this.t;
      ctx.save();
      TT.FX.drawShake(ctx);
      TT.Arenas.draw(ctx, this.arena, this.camX, t, G.quality);

      ctx.save();
      ctx.translate(-this.camX, 0);
      this.drawGems(ctx, t);
      this.drawEnemies(ctx, t);
      this.drawPlayer(ctx, t);
      this.drawShots(ctx);
      TT.FX.drawWorld(ctx);
      ctx.restore();

      TT.FX.drawText(ctx);
      TT.FX.drawFlash(ctx, W, H);
      this.drawHUD(ctx, t);
      ctx.restore();
    },

    drawPlayer(ctx, t) {
      const p = this.player;
      if (!p) return;
      p.pose.mouth = p.hurtFlash > 0.4 ? 'pain' : 'smirk';
      p.pose.brow = p.hurtFlash > 0.4 ? 0.75 : 0.3;
      TT.Art.drawFighter(ctx, p, t);
    },

    drawShots(ctx) {
      for (let i = 0; i < this.shots.length; i++) {
        const s = this.shots[i];
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gw = s.r * 5.2;
        if (this._shotGlow) ctx.drawImage(this._shotGlow, s.x - gw / 2, s.y - gw / 2, gw, gw);
        ctx.fillStyle = '#fffbe6';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.55, 0, TAU); ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < this.hazards.length; i++) {
        const h = this.hazards[i];
        ctx.save();
        ctx.fillStyle = h.color || '#b06de0';
        ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.arc(h.x - h.r * 0.3, h.y - h.r * 0.35, h.r * 0.3, 0, TAU); ctx.fill();
        ctx.restore();
      }
    },

    drawGems(ctx, t) {
      for (let i = 0; i < this.gems.length; i++) {
        const g = this.gems[i];
        const bob = Math.sin(t * 0.08 + g.x * 0.01) * 3;
        ctx.save();
        ctx.translate(g.x, g.y + bob);
        ctx.rotate(t * 0.03);
        ctx.globalCompositeOperation = 'lighter';
        if (this._gemGlow) ctx.drawImage(this._gemGlow, -18, -18, 36, 36);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffe9a8'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -7); ctx.lineTo(6, 0); ctx.lineTo(0, 7); ctx.lineTo(-6, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    },

    drawEnemies(ctx, t) {
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead) continue;
        drawEnemy(ctx, e, t);
      }
    },

    drawHUD(ctx, t) {
      const p = this.player;
      if (!p) return;
      const pad = 18;
      ctx.save();
      ctx.textBaseline = 'middle';

      // portrait + health
      const pw = 56;
      ctx.save();
      ctx.beginPath();
      ctx.arc(pad + pw / 2, pad + pw / 2, pw / 2, 0, TAU);
      ctx.fillStyle = 'rgba(12,7,20,.8)'; ctx.fill();
      ctx.clip();
      const port = TT.Art.portrait(p.char.id, this.skin);
      ctx.drawImage(port, pad, pad, pw, pw);
      ctx.restore();
      ctx.beginPath(); ctx.arc(pad + pw / 2, pad + pw / 2, pw / 2, 0, TAU);
      ctx.lineWidth = 3; ctx.strokeStyle = p.meter >= 100 ? '#fff2b0' : 'rgba(255,212,92,.55)'; ctx.stroke();

      const bx = pad + pw + 12, by = pad + 10, bw = 246, bh = 18;
      ctx.fillStyle = 'rgba(10,6,16,.72)';
      roundRect(ctx, bx - 3, by - 3, bw + 6, bh + 24, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.1)';
      roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
      const hpFrac = clamp(p.hp / p.maxHp, 0, 1);
      ctx.fillStyle = hpFrac > 0.35 ? '#6dc94f' : '#e0503f';
      roundRect(ctx, bx, by, Math.max(0, bw * hpFrac), bh, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(20,12,26,.9)'; ctx.lineWidth = 2;
      roundRect(ctx, bx, by, bw, bh, 6); ctx.stroke();
      for (let i = 1; i < 4; i++) {
        ctx.fillStyle = 'rgba(12,7,20,.28)';
        ctx.fillRect(bx + (bw / 4) * i, by + 2, 2, bh - 4);
      }
      ctx.font = '900 11px "Trebuchet MS", sans-serif';
      ctx.fillStyle = 'rgba(255,244,216,.9)';
      ctx.fillText(Math.ceil(p.hp) + ' / ' + p.maxHp, bx + 6, by + bh / 2);

      // xp
      const xy = by + bh + 7;
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      roundRect(ctx, bx, xy, bw, 7, 4); ctx.fill();
      ctx.fillStyle = '#ffd45c';
      roundRect(ctx, bx, xy, Math.max(0, bw * clamp(p.xp / p.xpNeed, 0, 1)), 7, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,233,168,.85)';
      ctx.font = '900 10px "Trebuchet MS", sans-serif';
      ctx.fillText('LV ' + p.level, bx + bw + 12, xy + 3);

      // wave timer
      const cx = W / 2;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10,6,16,.66)';
      roundRect(ctx, cx - 92, pad - 4, 184, 40, 12); ctx.fill();
      ctx.fillStyle = '#fff4d8';
      ctx.font = '900 22px "Trebuchet MS", sans-serif';
      ctx.fillText(this.wave % 5 === 0 ? 'ROTTEN WAVE ' + this.wave : 'WAVE ' + this.wave, cx, pad + 15);
      const secs = Math.max(0, Math.ceil(this.waveT / 60));
      ctx.font = '900 11px "Trebuchet MS", sans-serif';
      ctx.fillStyle = secs <= 5 ? '#ff8a72' : 'rgba(255,233,168,.8)';
      ctx.fillText(secs + 's', cx, pad + 33);
      const wf = clamp(this.waveT / this.waveLen, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,.14)';
      roundRect(ctx, cx - 70, pad + 38, 140, 4, 2); ctx.fill();
      ctx.fillStyle = '#ffb13c';
      roundRect(ctx, cx - 70, pad + 38, 140 * wf, 4, 2); ctx.fill();

      // kills / coins
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(10,6,16,.66)';
      roundRect(ctx, W - pad - 150, pad - 4, 150, 52, 12); ctx.fill();
      ctx.fillStyle = '#fff4d8';
      ctx.font = '900 16px "Trebuchet MS", sans-serif';
      ctx.fillText(this.kills + ' KOs', W - pad - 12, pad + 13);
      ctx.font = '900 12px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffd45c';
      ctx.fillText((p.coins || 0) + ' coins', W - pad - 12, pad + 33);

      // boss bar
      const boss = this.enemies.filter(e => e.boss)[0];
      if (boss) {
        const bw2 = 420, bx2 = (W - bw2) / 2, by2 = pad + 50;
        ctx.fillStyle = 'rgba(10,6,16,.7)';
        roundRect(ctx, bx2 - 4, by2 - 4, bw2 + 8, 22, 8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        roundRect(ctx, bx2, by2, bw2, 14, 5); ctx.fill();
        const bg = ctx.createLinearGradient(bx2, by2, bx2, by2 + 14);
        bg.addColorStop(0, '#ff8a72'); bg.addColorStop(1, '#a41f26');
        ctx.fillStyle = bg;
        roundRect(ctx, bx2, by2, Math.max(0, bw2 * clamp(boss.hp / boss.maxHp, 0, 1)), 14, 5); ctx.fill();
        ctx.strokeStyle = 'rgba(255,212,92,.7)'; ctx.lineWidth = 2;
        roundRect(ctx, bx2, by2, bw2, 14, 5); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe9a8';
        ctx.font = '900 10px "Trebuchet MS", sans-serif';
        ctx.fillText(boss.name, W / 2, by2 + 30);
      }

      // meter + controls hint
      ctx.textAlign = 'left';
      const my = H - 34;
      ctx.fillStyle = 'rgba(10,6,16,.6)';
      roundRect(ctx, pad, my - 9, 210, 20, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      roundRect(ctx, pad + 5, my - 4, 200, 10, 5); ctx.fill();
      ctx.fillStyle = p.colors.accent || '#ffd45c';
      roundRect(ctx, pad + 5, my - 4, 200 * clamp(p.meter / 100, 0, 1), 10, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,244,216,.85)';
      ctx.font = '900 9px "Trebuchet MS", sans-serif';
      ctx.fillText(p.meter >= 100 ? 'NOVA READY' : 'NOVA ' + Math.round(p.meter) + '%', pad + 8, my - 14);

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,240,210,.5)';
      ctx.font = '900 10px "Trebuchet MS", sans-serif';
      ctx.fillText('MOVE A/D   JUMP W   FIRE AUTO   DASH L   NOVA I', W - pad, H - 22);
      ctx.restore();

      // wave announcement
      if (this.ann) {
        const a = this.ann;
        const k = a.t / a.life;
        const inK = Math.min(1, a.t / 12);
        const outK = k > 0.78 ? (1 - k) / 0.22 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, inK * outK);
        ctx.textAlign = 'center';
        ctx.translate(W / 2, 190);
        const sc = 0.86 + inK * 0.14 + (1 - outK) * 0.1;
        ctx.scale(sc, sc);
        ctx.font = '900 46px "Trebuchet MS", sans-serif';
        ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(12,7,20,.9)';
        ctx.strokeText(a.title, 0, 0);
        const grd = ctx.createLinearGradient(0, -34, 0, 18);
        grd.addColorStop(0, '#fff6c0'); grd.addColorStop(1, '#ffb13c');
        ctx.fillStyle = grd;
        ctx.fillText(a.title, 0, 0);
        if (a.sub) {
          ctx.font = '900 13px "Trebuchet MS", sans-serif';
          ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(12,7,20,.85)';
          ctx.strokeText(a.sub, 0, 34);
          ctx.fillStyle = '#ffe9a8';
          ctx.fillText(a.sub, 0, 34);
        }
        ctx.restore();
      }
    },

    summary() { return this.lastSummary; }
  };

  /* ---------------------------------------------------------------- */
  /* Enemy art                                                         */
  /* ---------------------------------------------------------------- */
  const glowCache = {};
  function makeGlow(color) {
    if (glowCache[color]) return glowCache[color];
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, '#ffffff');
    rg.addColorStop(0.3, color);
    rg.addColorStop(1, 'rgba(255,225,120,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    glowCache[color] = c;
    return c;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function eye(ctx, x, y, r, angry) {
    ctx.save();
    ctx.fillStyle = '#fffdf4';
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.12, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#170d12';
    ctx.beginPath(); ctx.arc(x + r * 0.15, y + r * 0.1, r * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.25, r * 0.18, 0, TAU); ctx.fill();
    if (angry) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - r * 1.1, y - r * 1.5); ctx.lineTo(x + r * 0.9, y - r * 0.85); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemy(ctx, e, t) {
    const b = e.base || { color: '#e34b3f', light: '#ff9077', dark: '#8d1f27', leaf: '#4fae43' };
    const w = e.w, h = e.h;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.face, 1);
    const bob = e.fly ? Math.sin(t * 0.12 + e.x * 0.02) * 3 : 0;
    ctx.translate(0, bob);
    const squash = e.hitLag > 0 ? 1.1 : 1;
    ctx.scale(1 / squash, squash);

    // shadow
    ctx.save();
    ctx.globalAlpha = e.fly ? 0.12 : 0.3;
    ctx.fillStyle = '#0a0710';
    const shadowY = e.fly ? Math.max(0, S.arena.floor - e.y) : 0;
    ctx.beginPath();
    ctx.ellipse(0, shadowY, w * 0.52, 7, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    const by = -h * 0.52;
    const rx = w * 0.5, ry = h * 0.46;

    // wings for fliers
    if (e.fly) {
      const flap = Math.sin(t * 0.35) * 0.5;
      ctx.save();
      ctx.fillStyle = 'rgba(200,225,255,.75)';
      ctx.strokeStyle = 'rgba(20,12,26,.45)'; ctx.lineWidth = 2;
      [-1, 1].forEach(s => {
        ctx.save(); ctx.translate(s * rx * 0.7, by - ry * 0.2); ctx.rotate(s * (0.6 + flap));
        ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.8, ry * 0.32, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
    }

    // body
    const g = ctx.createRadialGradient(-rx * 0.35, by - ry * 0.5, 2, 0, by, rx * 1.35);
    g.addColorStop(0, b.light || '#ff9077');
    g.addColorStop(0.55, b.color || '#e34b3f');
    g.addColorStop(1, b.dark || '#8d1f27');
    ctx.fillStyle = g;
    ctx.strokeStyle = INK; ctx.lineWidth = 4;

    if (e.type === 'spitter') {
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.98);
      ctx.bezierCurveTo(rx * 1.15, -h * 0.86, rx * 0.95, -h * 0.25, 0, 0);
      ctx.bezierCurveTo(-rx * 0.95, -h * 0.25, -rx * 1.15, -h * 0.86, 0, -h * 0.98);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // tube mouth
      ctx.fillStyle = b.dark;
      ctx.beginPath(); ctx.ellipse(rx * 0.25, by + ry * 0.2, 6, 8, 0.4, 0, TAU); ctx.fill();
    } else if (e.type === 'brute') {
      ctx.beginPath();
      ctx.ellipse(0, by, rx, ry * 1.05, 0, 0, TAU);
      ctx.fill(); ctx.stroke();
      // ridges
      ctx.save();
      ctx.strokeStyle = 'rgba(20,12,26,.35)'; ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(0, by, rx * (0.55 + i * 0.16), -0.5, 0.5);
        ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'hopper') {
      ctx.beginPath();
      ctx.ellipse(0, by, rx, ry, 0, 0, TAU);
      ctx.fill(); ctx.stroke();
      // feet
      ctx.fillStyle = b.dark;
      [-1, 1].forEach(s => {
        ctx.beginPath(); ctx.ellipse(s * rx * 0.45, -4, 10, 6, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
      });
    } else {
      ctx.beginPath();
      ctx.ellipse(0, by, rx, ry, 0, 0, TAU);
      ctx.fill(); ctx.stroke();
    }

    // leaf / crown
    if (e.boss) {
      ctx.save();
      ctx.fillStyle = '#efc04a'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath();
      const cy = by - ry - 4;
      ctx.moveTo(-rx * 0.7, cy);
      ctx.lineTo(-rx * 0.45, cy - 22);
      ctx.lineTo(-rx * 0.18, cy - 4);
      ctx.lineTo(0, cy - 28);
      ctx.lineTo(rx * 0.18, cy - 4);
      ctx.lineTo(rx * 0.45, cy - 22);
      ctx.lineTo(rx * 0.7, cy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = b.leaf || '#4fae43';
      ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(-rx * 0.18, by - ry * 0.98, rx * 0.28, ry * 0.12, -0.7, 0, TAU);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(rx * 0.16, by - ry * 1.02, rx * 0.26, ry * 0.11, 0.6, 0, TAU);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // face
    eye(ctx, -rx * 0.36, by - ry * 0.16, Math.max(4, rx * 0.17), true);
    eye(ctx, rx * 0.36, by - ry * 0.16, Math.max(4, rx * 0.17), true);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    if (e.type === 'spitter') ctx.arc(0, by + ry * 0.34, rx * 0.2, 0.15, Math.PI - 0.15);
    else if (e.boss) ctx.arc(0, by + ry * 0.12, rx * 0.25, 0.1, Math.PI - 0.1);
    else ctx.arc(0, by + ry * 0.22, rx * 0.24, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // arms
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round';
    const swing = Math.sin(t * 0.16 + e.x * 0.05) * 6;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s * rx * 0.7, by + ry * 0.25);
      ctx.lineTo(s * (rx * 0.95 + 6), by + ry * 0.62 + swing * s);
      ctx.stroke();
      ctx.strokeStyle = b.color; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(s * rx * 0.7, by + ry * 0.25);
      ctx.lineTo(s * (rx * 0.95 + 6), by + ry * 0.62 + swing * s);
      ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 7;
    });

    // legs
    if (!e.fly) {
      [-1, 1].forEach(s => {
        ctx.strokeStyle = INK; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(s * rx * 0.35, -ry * 0.08); ctx.lineTo(s * rx * 0.42, -3); ctx.stroke();
        ctx.strokeStyle = b.dark; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(s * rx * 0.35, -ry * 0.08); ctx.lineTo(s * rx * 0.42, -3); ctx.stroke();
      });
    }

    // elite marker + health
    if (e.elite && !e.boss) {
      ctx.save();
      ctx.fillStyle = '#ffd45c';
      ctx.beginPath();
      ctx.arc(0, by - ry - 14, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if ((e.elite || e.boss) && e.hp < e.maxHp) {
      const bw = w * 0.9;
      ctx.fillStyle = 'rgba(10,6,16,.6)';
      ctx.fillRect(-bw / 2, by - ry - 22, bw, 5);
      ctx.fillStyle = e.boss ? '#ff8a72' : '#ffe9a8';
      ctx.fillRect(-bw / 2, by - ry - 22, bw * Math.max(0, e.hp / e.maxHp), 5);
    }

    if (e.flash > 0) {
      ctx.save();
      ctx.globalAlpha = e.flash * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, by, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
})();
