/* TOOKEND TYNDOUT: PRODUCE BRAWL — engine
   Fighter states, physics, combat, supers, AI, camera and HUD. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};
  const T = TT.TUNE;
  const W = 960, H = 540;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let canvas, ctx;

  const G = TT.Game = {
    running: false, paused: false, screen: 'title', mode: 'cpu', difficulty: 'normal',
    arena: TT.ARENAS[0], fighters: [], projectiles: [], peels: [], queue: [],
    cam: { x: 0, zoom: 1, punch: 0 },
    phase: 'idle', phaseT: 0, round: 1, wins: [0, 0], timer: 0,
    time: 0, hitstop: 0, slowmo: 1, darken: 0, quality: 'high', shakeOn: true,
    ann: null, dark: 0, stats: null, bossPhase: 1, lastTime: 0, acc: 0,
    pausedFrom: 'fight', koTimer: 0, endTimer: 0, winner: -1,

    init(cv) {
      canvas = cv; ctx = canvas.getContext('2d', { alpha: false });
      this.resize();
      requestAnimationFrame(this.loop.bind(this));
    },

    resize() {
      if (!canvas || !ctx) return;
      const cap = this.quality === 'low' ? 1 : this.quality === 'medium' ? 1.35 : 1.7;
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.dpr = dpr;
      ctx.imageSmoothingEnabled = true;
    },

    setQuality(q) {
      this.quality = q;
      TT.FX.configure(q);
      this.resize();
    },

    /* ------------------------------------------------------------ */
    /* Match setup                                                  */
    /* ------------------------------------------------------------ */
    startMatch(opts) {
      opts = opts || {};
      this.mode = opts.mode || this.mode;
      this.difficulty = opts.difficulty || this.difficulty;
      this.arena = opts.arena || this.arena;
      this.arenaIndex = TT.ARENAS.indexOf(this.arena);
      this.p1 = opts.p1 || this.p1 || { id: 'lemon', skin: 0 };
      this.p2 = opts.p2 || this.p2 || { id: 'tomato', skin: 0 };
      if (this.mode === 'boss') this.p2 = { id: 'king', skin: 0 };
      this.round = 1; this.wins = [0, 0]; this.winner = -1;
      this._carryMeter = [0, 0];
      this.stats = {
        p1: { dmg: 0, maxCombo: 0, supers: 0, blocks: 0 },
        p2: { dmg: 0, maxCombo: 0, supers: 0, blocks: 0 }
      };
      this.bossPhase = 1;
      this.running = true; this.paused = false;
      TT.FX.reset();
      this.startRound(true);
      TT.Audio.startMusic(this.arena, this.mode === 'boss');
      this.showScreen('fight');
    },

    makeFighter(side, data, x, facing) {
      const char = TT.getChar(data.id);
      const sc = 1.55 * char.scale;
      return {
        side, char, skin: data.skin || 0,
        colors: TT.Art.palette(char, data.skin || 0),
        scale: sc, hurtW: char.hurtW * sc * 0.86, hurtH: 96 * sc * 0.95,
        x, y: this.arena.floor, groundY: this.arena.floor, vx: 0, vy: 0, facing,
        hp: char.hp, maxHp: char.hp, meter: 0, state: 'idle', stateT: 0,
        animT: Math.random() * 100, attack: null, hitDone: false,
        hitstun: 0, blockstun: 0, invuln: 0, hurtFlash: 0,
        blocking: false, guardHold: 0, crouching: false, airborne: false,
        combo: 0, comboT: 0, comboShown: 0, specialCd: 0, dashCd: 0,
        blinkT: rnd(40, 200), blink: 0, stunT: 0, landT: 0,
        pose: {}, ai: null, attackCd: 0, queued: [], hitTakenThisAttack: false,
        lastLight: 0, drop: 0, jumpCount: 0, walkFx: 0, superT: 0
      };
    },

    startRound(first) {
      const p1 = this.makeFighter('p1', this.p1, this.arena.width * 0.34, 1);
      const p2 = this.makeFighter('p2', this.p2, this.arena.width * 0.66, -1);
      p1.meter = this._carryMeter[0] || 0; p2.meter = this._carryMeter[1] || 0;
      if (this.mode === 'training') { p2.hp = p2.maxHp = 4000; }
      this.fighters = [p1, p2];
      this.projectiles = []; this.peels = []; this.queue = [];
      this.cam.x = clamp((p1.x + p2.x) / 2 - W / 2, 0, this.arena.width - W);
      this.cam.zoom = 1; this.cam.punch = 0;
      this.timer = T.ROUND_TIME * 60;
      this.phase = 'intro'; this.phaseT = 0; this.hitstop = 0;
      this.slowmo = 1; this.darken = 0; this.dark = 0;
      this.winner = -1;
      TT.FX.reset();
      const sub = this.round >= 3 ? 'FINAL ROUND' : (p1.char.name + '  vs  ' + p2.char.name);
      this.announce('ROUND ' + this.round, this.mode === 'boss' && first ? 'KING TOMATO ENTERS' : sub);
      TT.sfx('round');
      p1.state = 'intro'; p2.state = 'intro';
      p1.opponent = p2; p2.opponent = p1;
      if (this.mode !== '2p' && this.mode !== 'training') {
        p2.ai = this.makeAI('p2');
      }
      if (this.mode === 'training') {
        p2.ai = this.makeAI('p2');
        p2.ai.dummy = true;
      }
    },

    announce(title, sub, color) {
      this.ann = { title, sub: sub || '', t: 0, life: 92, color: color || '#ffd45c' };
    },

    /* ------------------------------------------------------------ */
    /* AI                                                           */
    /* ------------------------------------------------------------ */
    makeAI(side) {
      const diff = T_difficulty(this.mode === 'boss' ? bossDifficulty(this.difficulty) : this.difficulty);
      return {
        reaction: diff.reaction, aggression: diff.aggression, block: diff.block,
        combo: diff.combo, jump: diff.jump, special: diff.special, superRate: diff.super,
        retreat: diff.retreat, dash: diff.dash, punish: diff.punish,
        think: 0, intent: null, hold: 0, dummy: false, moveDir: 0,
        attackCd: 0, lastBlock: 0, aggressionMod: 1
      };
    },

    /* ------------------------------------------------------------ */
    /* Main loop                                                    */
    /* ------------------------------------------------------------ */
    loop(ts) {
      requestAnimationFrame(this.loop.bind(this));
      const now = ts || 0;
      if (!this.lastTime) this.lastTime = now;
      let dt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      dt = Math.min(dt, 0.05);
      this.time += dt;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= 1 / 60 && steps < 3) {
        this.acc -= 1 / 60;
        this.step();
        steps++;
      }
      if (steps === 3) this.acc = 0;
      this.render();
    },

    step() {
      TT.FX.update();
      if (!this.running || this.paused) {
        if (this.screen === 'fight' && !this.paused) { /* still animate title? */ }
        return;
      }
      if (this.ann) {
        this.ann.t++;
        if (this.ann.t > this.ann.life) this.ann = null;
      }
      if (this.hitstop > 0) { this.hitstop--; return; }
      if (this.phase === 'intro') {
        this.phaseT++;
        this.updateCamera();
        if (this.phaseT === 42) { TT.sfx('fight'); this.announce('FIGHT!', '', '#ff6a5a'); }
        if (this.phaseT > 78) { this.phase = 'fight'; this.phaseT = 0; this.fighters.forEach(f => { f.state = 'idle'; f.stateT = 0; }); }
        this.animateFighters(true);
        return;
      }
      if (this.phase === 'ko' || this.phase === 'roundEnd') {
        this.phaseT++;
        this.slowmo = Math.min(1, this.slowmo + 0.004);
        this.updateCamera();
        this.animateFighters();
        this.updateProjectiles();
        this.updatePeels();
        this.runQueue();
        if (this.phase === 'ko' && this.phaseT > 120) {
          this.finishRound();
        } else if (this.phase === 'roundEnd' && this.phaseT > 150) {
          this.nextRound();
        }
        return;
      }
      if (this.phase === 'done') { this.animateFighters(); this.updateCamera(); return; }

      // fight
      this.phaseT++;
      this.timer--;
      if (this.timer <= 0) { this.timer = 0; this.timeUp(); return; }

      const [a, b] = this.fighters;
      const in1 = this.mode === 'training' ? TT.Input.read('p1') : TT.Input.read('p1');
      const in2 = this.mode === '2p' ? TT.Input.read('p2') : this.aiInput(b, a);
      this.controlFighter(a, in1, b);
      this.controlFighter(b, in2, a);
      a.meter = Math.min(T.METER_MAX, a.meter + T.METER_PASSIVE);
      b.meter = Math.min(T.METER_MAX, b.meter + T.METER_PASSIVE);
      if (this.mode === 'training') {
        // practice dummy: huge health pool, never dies; player recovers health and meter
        if (b.state === 'ko') { b.state = 'idle'; b.stateT = 0; b.hitstun = 0; b.hp = b.maxHp; }
        a.hp = Math.min(a.maxHp, a.hp + 0.25);
        a.meter = Math.min(T.METER_MAX, a.meter + 0.35);
      }
      this.animateFighters();
      this.updateProjectiles();
      this.updatePeels();
      this.runQueue();
      this.resolveBodyCollision();
      this.updateCamera();
      this.updateBossPhase();
      this.updateFall();
      if (a.combo > 0) { a.comboT--; if (a.comboT <= 0) { a.combo = 0; } }
      if (b.combo > 0) { b.comboT--; if (b.comboT <= 0) { b.combo = 0; } }
    },

    updateBossPhase() {
      if (this.mode !== 'boss') return;
      const boss = this.fighters[1];
      if (!boss) return;
      const frac = boss.hp / boss.maxHp;
      let phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (phase !== this.bossPhase) {
        this.bossPhase = phase;
        boss.ai.aggressionMod = 1 + (phase - 1) * 0.22;
        this.announce(phase === 2 ? 'ROYAL SAUCE SOVEREIGNTY' : 'ROYAL RAGE', 'THE KING IS NOT AMUSED', '#ff8a5a');
        TT.sfx('royal');
        TT.FX.flash('#ff6a4a', 0.3);
        TT.FX.shake(10);
      }
    },

    /* ------------------------------------------------------------ */
    /* Input → fighter control                                      */
    /* ------------------------------------------------------------ */
    controlFighter(f, input, opp) {
      if (!f || !opp) return;
      f.animT++;
      if (f.state === 'ko' || f.state === 'win') return;
      if (f.hitstun > 0) { f.hitstun--; this.physics(f); return; }
      if (f.blockstun > 0) { f.blockstun--; this.physics(f); return; }
      if (f.state === 'knockdown') {
        f.stateT++;
        this.physics(f);
        if (f.stateT > 40 && !f.airborne) { f.state = 'getup'; f.stateT = 0; }
        return;
      }
      if (f.state === 'getup') {
        f.stateT++;
        this.physics(f);
        if (f.stateT > 18) { f.state = 'idle'; f.stateT = 0; }
        return;
      }
      if (f.state === 'hurt' && f.hitstun <= 0) { f.state = f.airborne ? 'fall' : 'idle'; }
      if (f.attack) { this.advanceAttack(f, opp); this.physics(f); return; }

      f.specialCd = Math.max(0, f.specialCd - 1);
      f.dashCd = Math.max(0, f.dashCd - 1);
      f.invuln = Math.max(0, f.invuln - 1);
      f.hurtFlash = Math.max(0, f.hurtFlash - 0.08);
      f.landT = Math.max(0, f.landT - 1);
      f.blinkT--;
      if (f.blinkT < 0) { f.blink = 4; f.blinkT = rnd(120, 320); }
      if (f.blink > 0) f.blink--;

      // face opponent
      if (f.state !== 'dash') f.facing = opp.x >= f.x ? 1 : -1;

      const back = (f.facing === 1 && input.left) || (f.facing === -1 && input.right);
      f.crouching = !!input.down && !f.airborne;
      f.blocking = !f.airborne && (input.guard || back) && !input.light && !input.heavy && !input.special && !input.super;

      if (!f.airborne) {
        if (input.super && f.meter >= T.METER_MAX) { this.startSuper(f, opp); return; }
        if (input.special && !f.crouching && f.specialCd <= 0) { this.startSpecial(f, opp); return; }
        if (input.light) { this.startLight(f); return; }
        if (input.heavy) { this.startHeavy(f); return; }
        if (input.up && f.jumpCount === 0) {
          f.vy = -f.char.jump; f.airborne = true; f.jumpCount = 1;
          f.state = 'jump'; f.stateT = 0; f.vx *= 0.7;
          TT.sfx('jump', { pitch: 1 + (f.char.id === 'blueberry' ? 0.35 : 0) });
          TT.FX.dust(f.x, f.y, 6, 0);
          return;
        }
      } else {
        if (input.super && f.meter >= T.METER_MAX) { this.startSuper(f, opp); return; }
        if (input.special && f.specialCd <= 0) { this.startSpecial(f, opp); return; }
        if (input.light || input.heavy) {
          const mv = f.char.moves.air;
          f.attack = { move: mv, kind: 'air', frame: 0, hit: false, name: mv.name };
          f.state = 'attack'; f.stateT = 0;
          TT.sfx('whoosh');
          return;
        }
      }

      // dash
      if (!f.airborne && input.dashDir && f.dashCd <= 0) {
        f.state = 'dash'; f.stateT = 0; f.dashDir = input.dashDir;
        f.vx = input.dashDir * f.char.dash; f.dashCd = T.DASH_COOLDOWN;
        f.facing = input.dashDir;
        TT.sfx('dash');
        TT.FX.dust(f.x, f.y, 8, -input.dashDir);
        return;
      }

      // movement
      if (!f.airborne) {
        if (f.crouching) { f.vx *= 0.3; f.state = 'crouch'; }
        else {
          const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
          if (dir !== 0) {
            f.vx = dir * f.char.walk * (f.blocking ? 0.72 : 1);
            f.state = 'walk';
            f.walkFx++;
            if (f.walkFx % 16 === 0 && this.quality !== 'low') TT.FX.dust(f.x, f.y, 1, -dir);
          } else if (f.blocking) {
            f.vx *= 0.55;
            f.state = 'block';
          } else {
            f.vx *= T.GROUND_FRICTION;
            if (Math.abs(f.vx) < 0.12) f.vx = 0;
            f.state = 'idle';
          }
        }
      } else {
        const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (dir !== 0) f.vx = clamp(f.vx + dir * 0.3, -f.char.walk * 1.25, f.char.walk * 1.25);
        f.state = f.vy < 0 ? 'jump' : 'fall';
      }
      this.physics(f);
    },

    physics(f) {
      if (f.airborne) {
        f.vy += T.GRAVITY;
        f.vx *= T.AIR_DRAG;
        f.y += f.vy;
        if (f.y >= f.groundY) {
          f.y = f.groundY; f.vy = 0; f.airborne = false; f.jumpCount = 0;
          f.state = 'land'; f.stateT = 0; f.landT = 6;
          TT.sfx('land');
          if (this.quality !== 'low') TT.FX.dust(f.x, f.y, 7, 0);
        }
      }
      f.x += f.vx;
      if (f.state === 'dash') {
        f.stateT++;
        if (f.stateT > T.DASH_FRAMES) { f.state = 'idle'; f.stateT = 0; f.vx *= 0.3; }
        else if (this.quality !== 'low' && f.stateT % 2 === 0) {
          TT.FX.trail(f.x, f.y - f.hurtH * 0.5, 22, TT.Art.hexA(f.colors.accent, 0.5), 9);
        }
      }
      if (!f.airborne && f.state !== 'dash') f.vx *= 0.86;
      f.x = clamp(f.x, 40, this.arena.width - 40);
    },

    resolveBodyCollision() {
      const [a, b] = this.fighters;
      const minD = (a.hurtW + b.hurtW) * 0.62;
      const dx = b.x - a.x;
      if (Math.abs(dx) < minD) {
        const push = (minD - Math.abs(dx)) * 0.5 * (dx < 0 ? -1 : 1);
        a.x -= push; b.x += push;
        a.x = clamp(a.x, 40, this.arena.width - 40);
        b.x = clamp(b.x, 40, this.arena.width - 40);
      }
    },

    /* ------------------------------------------------------------ */
    /* Attacks                                                      */
    /* ------------------------------------------------------------ */
    startLight(f) {
      const useSecond = f.combo > 0 && f.lastLight > 0 && f.animT - f.lastLight < 34;
      const mv = useSecond ? (f.char.moves.light2 || f.char.moves.light) : f.char.moves.light;
      f.lastLight = f.animT;
      f.attack = { move: mv, kind: 'light', frame: 0, hit: false, name: mv.name };
      f.state = 'attack'; f.stateT = 0; f.vx = f.facing * 1.1;
      TT.sfx('whoosh');
    },
    startHeavy(f) {
      const mv = f.char.moves.heavy;
      f.attack = { move: mv, kind: 'heavy', frame: 0, hit: false, name: mv.name };
      f.state = 'attack'; f.stateT = 0; f.vx = f.facing * 0.8;
      TT.sfx('whoosh');
    },
    startSpecial(f, opp) {
      const sp = f.char.moves.special;
      // projectiles define their own payload; give them a readable cast animation
      const move = Object.assign({
        startup: 11, active: 1, recovery: 21, reach: 0, high: 0, kb: 0, lift: 0,
        gain: 8, dmg: 8, size: 18, speed: 8, gravity: 0, life: 80
      }, sp);
      f.attack = { move: move, kind: 'special', frame: 0, hit: false, spawned: false, name: sp.name };
      f.state = 'attack'; f.stateT = 0; f.specialCd = sp.cd;
      f.vx = 0;
    },
    startSuper(f, opp) {
      const sp = f.char.moves.super;
      f.meter = 0;
      f.attack = { move: sp, kind: 'super', frame: 0, hit: false, spawned: false, name: sp.name, superKind: sp.kind };
      f.state = 'super'; f.stateT = 0; f.superT = 0;
      f.vx = 0; f.invuln = 40;
      this.stats[f.side].supers++;
      this.hitstop = 26;
      this.slowmo = 0.3;
      TT.sfx('super');
      TT.FX.flash(f.colors.accent, 0.55);
      TT.FX.ring(f.x, f.y - f.hurtH * 0.5, f.colors.accent, 260, 10);
      TT.FX.shake(10);
      this.announce(sp.name, f.char.name + ' SUPER', f.colors.light);
      this.cam.punch = 0.06;
      TT.Audio.sfx(sp.sound);
    },

    advanceAttack(f, opp) {
      const a = f.attack, mv = a.move;
      a.frame++;
      f.stateT++;
      if (a.kind === 'super') {
        this.updateSuper(f, opp, a);
        this.physics(f);
        return;
      }
      if (a.kind === 'special' && !a.spawned && a.frame >= 10) {
        a.spawned = true;
        this.spawnProjectile(f, mv);
        TT.sfx(mv.sound || 'projectile');
        TT.FX.spark(f.x + f.facing * 40, f.y - f.hurtH * 0.55, 8, f.char.id === 'king' ? 'royal' : f.char.id, 0.7);
      }
      if (a.kind !== 'air' && a.kind !== 'special' && a.frame >= mv.startup && a.frame < mv.startup + mv.active && !a.hit) {
        const hb = this.hitbox(f, mv);
        if (this.overlap(hb, this.hurtbox(opp)) && opp.state !== 'ko') {
          a.hit = true;
          this.landHit(f, opp, mv, a.kind);
        }
      }
      const total = (mv.startup || 0) + (mv.active || 0) + (mv.recovery || 20);
      if (a.frame >= total) {
        f.attack = null;
        f.state = f.airborne ? 'fall' : 'idle';
        f.stateT = 0;
      }
      this.physics(f);
    },

    hitbox(f, mv) {
      const reach = mv.reach * f.scale * 0.9;
      const high = mv.high * f.scale;
      const yy = f.y - high * 0.92;
      return {
        x: f.facing > 0 ? f.x + f.hurtW * 0.15 : f.x - f.hurtW * 0.15 - reach,
        y: yy - 22, w: reach, h: 62
      };
    },
    hurtbox(f) {
      return { x: f.x - f.hurtW / 2, y: f.y - f.hurtH, w: f.hurtW, h: f.hurtH };
    },
    overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },

    landHit(attacker, defender, mv, kind) {
      if (defender.invuln > 0 || defender.state === 'ko') return;
      const facing = (defender.x - attacker.x) * attacker.facing > 0;
      const canBlock = defender.blocking && facing && !defender.airborne;
      const scaleDown = Math.max(T.MAX_COMBO_SCALE, 1 - attacker.combo * 0.085);
      const power = attacker.char.stats.POWER / 7;

      if (canBlock) {
        const chip = mv.dmg * 0.14 * T.DAMAGE;
        defender.hp = Math.max(0, defender.hp - chip);
        defender.blockstun = kind === 'heavy' ? 18 : 11;
        defender.vx = attacker.facing * 1.6;
        defender.meter = Math.min(T.METER_MAX, defender.meter + mv.gain * 0.4);
        attacker.meter = Math.min(T.METER_MAX, attacker.meter + mv.gain * 0.5);
        this.stats[defender.side].blocks++;
        TT.sfx('blocked');
        TT.FX.spark(defender.x - attacker.facing * defender.hurtW * 0.3, defender.y - defender.hurtH * 0.65, 8, 'onion', 0.8);
        TT.FX.text(defender.x, defender.y - defender.hurtH - 14, 'BLOCK', '#9fe0ff', 16, 'info');
        TT.FX.shake(2);
        this.hitstop = 4;
        if (defender.hp <= 0) this.ko(defender, attacker);
        return;
      }

      const dmg = Math.max(1, mv.dmg * scaleDown * power * T.DAMAGE);
      defender.hp = Math.max(0, defender.hp - dmg);
      attacker.combo++;
      attacker.comboT = T.COMBO_WINDOW;
      attacker.comboShown = attacker.combo;
      this.stats[attacker.side].dmg += dmg;
      this.stats[attacker.side].maxCombo = Math.max(this.stats[attacker.side].maxCombo, attacker.combo);
      if (attacker.combo === 2) TT.sfx('combo', { n: 2 });
      if (attacker.combo === 3) TT.sfx('combo', { n: 3 });
      if (attacker.combo >= 5) TT.sfx('combo', { n: 5 });

      const heavy = kind === 'heavy' || kind === 'super' || (kind === 'special' && mv.dmg > 11);
      defender.hitstun = heavy ? 24 : 15;
      defender.state = 'hurt';
      defender.stateT = 0;
      defender.blocking = false;
      defender.hurtFlash = 1;
      defender.attack = null;
      defender.vx = attacker.facing * mv.kb * (1.05 - defender.char.weight * 0.22);
      if (mv.lift > 0) { defender.vy = -mv.lift * 1.6; defender.airborne = true; defender.jumpCount = 1; }
      if (kind === 'super') {
        defender.vx = attacker.facing * 9; defender.vy = -5.5; defender.airborne = true;
        defender.hitstun = 34;
      }
      attacker.meter = Math.min(T.METER_MAX, attacker.meter + mv.gain * T.METER_ON_HIT);
      defender.meter = Math.min(T.METER_MAX, defender.meter + mv.gain * 0.35);
      const cx = (attacker.x + defender.x) / 2;
      const cy = defender.y - defender.hurtH * (0.45 + Math.random() * 0.25);
      const style = attacker.char.id;
      TT.FX.spark(cx, cy, heavy ? 26 : 13, style, heavy ? 1.5 : 1);
      TT.FX.juice(cx, cy, heavy ? 10 : 5, style, attacker.facing);
      TT.FX.ring(cx, cy, attacker.colors.light, heavy ? 90 : 46, heavy ? 7 : 4);
      TT.FX.slash(cx, cy, attacker.facing > 0 ? 0 : Math.PI, attacker.colors.light, heavy ? 70 : 44);
      TT.FX.text(defender.x, defender.y - defender.hurtH - 18, Math.round(dmg), '#fff8d0', heavy ? 30 : 22);
      TT.FX.flash(attacker.colors.light, heavy ? 0.3 : 0.12);
      TT.FX.shake(heavy ? 8 : 3.4);
      this.hitstop = heavy ? T.HITSTOP_HEAVY : T.HITSTOP_LIGHT;
      TT.sfx(heavy ? 'hurtBig' : 'hurt');
      TT.sfx(heavy ? 'impact' : 'light');
      this.cam.punch = Math.max(this.cam.punch, heavy ? 0.035 : 0.015);
      if (this.mode === 'training' && defender.side === 'p2') defender.hp = Math.max(1, defender.hp);
      if (defender.hp <= 0) this.ko(defender, attacker);
    },

    ko(defender, attacker) {
      if (this.phase === 'ko' || this.phase === 'done') return;
      defender.state = 'ko'; defender.stateT = 0;
      defender.attack = null; defender.blocking = false;
      defender.vx = attacker.facing * 8; defender.vy = -7; defender.airborne = true;
      defender.hitstun = 999;
      this.phase = 'ko'; this.phaseT = 0; this.slowmo = 0.28;
      this.hitstop = 18;
      this.cam.punch = 0.09;
      TT.FX.flash('#fff3d0', 0.6);
      TT.FX.shake(16);
      TT.FX.ring(defender.x, defender.y - defender.hurtH * 0.5, '#ffd25a', 220, 12);
      TT.sfx('ko');
      this.announce('K.O.', '', '#ff5b4d');
      this.winner = attacker.side;
    },

    timeUp() {
      const [a, b] = this.fighters;
      this.phase = 'roundEnd'; this.phaseT = 0;
      if (a.hp === b.hp) {
        this.announce('TIME UP', 'DRAW ROUND', '#ffe08a');
        this.winner = -1;
      } else {
        const w = a.hp > b.hp ? a : b;
        this.winner = w.side;
        this.announce('TIME UP', (w.side === 'p1' ? 'PLAYER 1' : 'PLAYER 2') + ' WINS THE ROUND', '#ffe08a');
        this.wins[w.side === 'p1' ? 0 : 1]++;
      }
      this.fighters.forEach(f => { f.state = 'idle'; f.attack = null; });
      TT.sfx('round');
    },

    finishRound() {
      const w = this.winner;
      if (w !== -1) {
        this.wins[w === 'p1' ? 0 : 1]++;
        const winF = this.fighters[w === 'p1' ? 0 : 1];
        winF.state = 'win'; winF.stateT = 0;
        const loseF = this.fighters[w === 'p1' ? 1 : 0];
        if (loseF.state !== 'ko') { loseF.state = 'idle'; }
      }
      this.phase = 'roundEnd'; this.phaseT = 0;
      this.announce((w === -1 ? 'DRAW' : (w === 'p1' ? 'PLAYER 1 WINS' : 'PLAYER 2 WINS')), '', '#ffd45c');
      TT.sfx('win');
    },

    nextRound() {
      if (this.wins[0] >= T.ROUNDS_TO_WIN || this.wins[1] >= T.ROUNDS_TO_WIN) {
        this.endMatch();
        return;
      }
      this.round++;
      this._carryMeter = [
        Math.min(40, this.fighters[0].meter * 0.5),
        Math.min(40, this.fighters[1].meter * 0.5)
      ];
      this.startRound(false);
    },

    endMatch() {
      this.phase = 'done';
      this.running = false;
      const p1win = this.wins[0] > this.wins[1];
      this.lastResult = {
        p1win, wins: this.wins.slice(),
        stats: JSON.parse(JSON.stringify(this.stats)),
        chars: [this.p1, this.p2],
        arena: this.arena,
        mode: this.mode
      };
      TT.Audio.stopMusic();
      TT.Audio.sfx(p1win ? 'win' : 'lose');
      this.showScreen('results');
    },

    /* ------------------------------------------------------------ */
    /* Projectiles                                                  */
    /* ------------------------------------------------------------ */
    spawnProjectile(f, mv, override) {
      const o = override || {};
      const dir = o.dir || f.facing;
      const p = {
        x: f.x + dir * f.hurtW * 0.55,
        y: f.y - f.hurtH * 0.62 + (o.dy || 0),
        vx: dir * (o.speed || mv.speed || 7),
        vy: o.vy || 0,
        g: o.gravity == null ? (mv.gravity || 0) : o.gravity,
        size: o.size || mv.size || 18,
        dmg: o.dmg || mv.dmg || 8,
        life: o.life || mv.life || 80,
        style: o.style || mv.style || f.char.id,
        colors: f.colors,
        owner: f.side,
        facing: dir,
        spin: 0,
        kind: o.kind || 'normal',
        slip: mv.slip || false,
        hp: 1
      };
      this.projectiles.push(p);
      return p;
    },

    updateProjectiles() {
      const [a, b] = this.fighters;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        if (p.delay > 0) { p.delay--; continue; }
        p.vy += p.g;
        p.x += p.vx; p.y += p.vy;
        p.life--;
        p.spin += 0.12 + Math.abs(p.vx) * 0.02;
        if (this.quality !== 'low' && p.life % 2 === 0) {
          TT.FX.trail(p.x, p.y, p.size * 0.8, TT.Art.hexA(p.colors.light, 0.35), 8);
        }
        const target = p.owner === 'p1' ? b : a;
        const hb = { x: p.x - p.size * 0.7, y: p.y - p.size * 0.7, w: p.size * 1.4, h: p.size * 1.4 };
        if (target && target.state !== 'ko' && this.overlap(hb, this.hurtbox(target))) {
          this.projectileHit(p, target);
          this.projectiles.splice(i, 1);
          continue;
        }
        const onGround = p.y >= this.arena.floor - p.size * 0.4;
        if (p.g > 0 && onGround) {
          this.projectileLand(p);
          this.projectiles.splice(i, 1);
          continue;
        }
        if (p.life <= 0 || p.x < -60 || p.x > this.arena.width + 60) {
          this.projectiles.splice(i, 1);
        }
      }
      // projectile vs projectile
      for (let i = 0; i < this.projectiles.length; i++) {
        for (let j = i + 1; j < this.projectiles.length; j++) {
          const p = this.projectiles[i], q = this.projectiles[j];
          if (p.owner === q.owner) continue;
          if (Math.hypot(p.x - q.x, p.y - q.y) < p.size + q.size) {
            TT.FX.spark((p.x + q.x) / 2, (p.y + q.y) / 2, 16, p.style, 1.1);
            TT.FX.ring((p.x + q.x) / 2, (p.y + q.y) / 2, '#ffffff', 60, 4);
            TT.sfx('blocked');
            this.projectiles.splice(j, 1); this.projectiles.splice(i, 1);
            i--; break;
          }
        }
      }
    },

    projectileHit(p, target) {
      const owner = this.fighters[p.owner === 'p1' ? 0 : 1];
      const facing = (target.x - p.x) * Math.sign(p.vx || 1) > -6;
      const canBlock = target.blocking && facing;
      const style = p.style;
      TT.FX.spark(p.x, p.y, 18, style, 1.2);
      TT.FX.juice(p.x, p.y, 9, style, p.vx > 0 ? 1 : -1);
      TT.FX.ring(p.x, p.y, p.colors.light, 70, 5);
      if (canBlock) {
        target.hp = Math.max(0, target.hp - p.dmg * 0.12 * T.DAMAGE);
        target.blockstun = 12;
        target.vx = Math.sign(p.vx) * 1.4;
        target.meter = Math.min(T.METER_MAX, target.meter + 4);
        this.stats[target.side].blocks++;
        TT.sfx('blocked');
        TT.FX.text(target.x, target.y - target.hurtH - 10, 'BLOCK', '#9fe0ff', 15, 'info');
        this.hitstop = 3;
        if (target.hp <= 0) this.ko(target, owner);
        return;
      }
      const scaleDown = Math.max(T.MAX_COMBO_SCALE, 1 - owner.combo * 0.08);
      const dmg = p.dmg * scaleDown * (owner.char.stats.POWER / 7) * T.DAMAGE;
      target.hp = Math.max(0, target.hp - dmg);
      owner.combo++;
      owner.comboT = T.COMBO_WINDOW;
      this.stats[owner.side].dmg += dmg;
      this.stats[owner.side].maxCombo = Math.max(this.stats[owner.side].maxCombo, owner.combo);
      target.hitstun = 18;
      target.state = 'hurt'; target.stateT = 0; target.attack = null;
      target.hurtFlash = 1;
      target.vx = Math.sign(p.vx || 1) * 4.6 * (1.05 - target.char.weight * 0.2);
      owner.meter = Math.min(T.METER_MAX, owner.meter + 5);
      target.meter = Math.min(T.METER_MAX, target.meter + 3);
      TT.FX.text(target.x, target.y - target.hurtH - 14, Math.round(dmg), '#fff8d0', 22);
      TT.FX.shake(5); TT.FX.flash(p.colors.light, 0.16);
      this.hitstop = 5;
      TT.sfx('hurt');
      this.cam.punch = Math.max(this.cam.punch, 0.02);
      if (this.mode === 'training' && target.side === 'p2') target.hp = Math.max(1, target.hp);
      if (target.hp <= 0) this.ko(target, owner);
    },

    projectileLand(p) {
      const style = p.style;
      TT.FX.spark(p.x, this.arena.floor - 6, 18, style, 1.2);
      TT.FX.ring(p.x, this.arena.floor - 4, p.colors.light, 80, 6);
      TT.FX.dust(p.x, this.arena.floor, 6, 0);
      TT.sfx('impact');
      TT.FX.shake(3);
      const target = this.fighters[p.owner === 'p1' ? 1 : 0];
      if (target && Math.abs(target.x - p.x) < 62 && target.state !== 'ko') {
        const owner = this.fighters[p.owner === 'p1' ? 0 : 1];
        const dmg = p.dmg * 0.8 * T.DAMAGE;
        target.hp = Math.max(0, target.hp - dmg);
        target.hitstun = 16; target.state = 'hurt'; target.stateT = 0; target.hurtFlash = 1;
        target.vx = Math.sign(p.x - target.x) * 3;
        TT.FX.text(target.x, target.y - target.hurtH - 12, Math.round(dmg), '#fff8d0', 20);
        if (target.hp <= 0) this.ko(target, owner);
      }
      if (p.slip) this.peels.push({ x: p.x, life: 360, side: p.owner });
    },

    updatePeels() {
      for (let i = this.peels.length - 1; i >= 0; i--) {
        const peel = this.peels[i];
        peel.life--;
        if (peel.life <= 0) { this.peels.splice(i, 1); continue; }
        const [a, b] = this.fighters;
        const target = peel.side === 'p1' ? b : a;
        if (target && !target.airborne && Math.abs(target.x - peel.x) < 30 && target.state !== 'ko' && target.state !== 'knockdown' && target.invuln <= 0) {
          target.state = 'knockdown'; target.stateT = 0;
          target.hitstun = 30; target.attack = null;
          target.vx = (target.facing) * 4;
          target.hp = Math.max(0, target.hp - 5);
          TT.FX.spark(peel.x, this.arena.floor - 10, 10, 'banana', 0.9);
          TT.sfx('banana');
          TT.FX.text(target.x, target.y - target.hurtH, 'SLIP!', '#ffe14d', 20, 'info');
          this.peels.splice(i, 1);
        }
      }
    },

    /* ------------------------------------------------------------ */
    /* Supers                                                       */
    /* ------------------------------------------------------------ */
    updateSuper(f, opp, a) {
      f.superT++;
      const sp = a.move;
      if (f.superT === 34) {
        const style = f.char.id;
        if (sp.kind === 'storm') {
          for (let i = 0; i < sp.count; i++) {
            this.queue.push({ t: i * 5, fn: () => this.spawnProjectile(f, sp, { dy: -60 + i * 24, speed: sp.speed, size: sp.size, damage: sp.dmg, style: 'citrus', dir: f.facing }) });
          }
          TT.FX.flash('#fff6b0', 0.4);
        } else if (sp.kind === 'burst') {
          const cx = f.x + f.facing * 90;
          TT.FX.ring(cx, f.y - 40, '#ff5b4d', sp.radius, 16);
          TT.FX.shake(14);
          TT.FX.flash('#ff6a4a', 0.45);
          for (let i = 0; i < 5; i++) this.queue.push({ t: i * 4, fn: () => { TT.FX.ring(f.x + f.facing * rnd(20, sp.radius), this.arena.floor - rnd(4, 120), '#ffb3a2', 120, 9); TT.FX.juice(f.x + f.facing * rnd(0, 120), f.y - rnd(20, 120), 14, 'sauce', f.facing); } });
          if (Math.abs(opp.x - cx) < sp.radius && opp.state !== 'ko') this.landHit(f, opp, { dmg: sp.dmg, kb: 12, lift: 4, gain: 8 }, 'super');
          else TT.FX.shake(6);
        } else if (sp.kind === 'dark') {
          this.dark = 1;
          for (let i = 0; i < sp.count; i++) {
            const ang = (i / sp.count) * TAU;
            this.queue.push({ t: i * 7, fn: () => this.spawnProjectile(f, sp, { dy: Math.sin(ang) * 70, vy: Math.sin(ang) * 1.4, speed: 7, size: sp.size, style: 'shade' }) });
          }
        } else if (sp.kind === 'quake') {
          TT.FX.shake(18); TT.FX.flash('#ffd9a0', 0.35);
          for (let i = 0; i < 3; i++) {
            this.queue.push({ t: i * 6, fn: () => {
              TT.FX.ring(f.x, this.arena.floor - 6, '#c99553', 320, 12);
              TT.FX.dust(f.x, this.arena.floor, 22, 0);
            } });
          }
          if (Math.abs(opp.x - f.x) < sp.radius && !opp.airborne && opp.state !== 'ko') this.landHit(f, opp, { dmg: sp.dmg, kb: 10, lift: 6.5, gain: 9 }, 'super');
        } else if (sp.kind === 'peels') {
          for (let i = 0; i < sp.count; i++) {
            this.queue.push({ t: i * 7, fn: () => {
              const px = clamp(opp.x + rnd(-160, 160), 60, this.arena.width - 60);
              this.peels.push({ x: px, life: 520, side: f.side });
              this.spawnProjectile(f, { speed: 7, size: 16, dmg: 4, life: 40, style: 'banana', gravity: 0 }, { dy: rnd(-60, 20) });
              TT.FX.spark(px, this.arena.floor - 10, 6, 'banana', 0.8);
            } });
          }
        } else if (sp.kind === 'pillars') {
          for (let i = 0; i < sp.count; i++) {
            const px = opp.x + (i - 1) * 90;
            this.queue.push({ t: i * 9, fn: () => {
              const x = clamp(px, 60, this.arena.width - 60);
              TT.FX.ring(x, this.arena.floor - 10, '#ff8a3d', 120, 14);
              TT.FX.ember(x, this.arena.floor - 40, 26, 'chili');
              TT.FX.shake(6);
              TT.sfx('chili');
              if (Math.abs(opp.x - x) < 70 && opp.state !== 'ko') {
                if (opp.blocking) { opp.hp = Math.max(0, opp.hp - 3); TT.FX.text(opp.x, opp.y - opp.hurtH, 'BLOCK', '#9fe0ff', 15, 'info'); }
                else this.landHit(f, opp, { dmg: sp.dmg, kb: 7, lift: 5, gain: 7 }, 'super');
              }
            } });
          }
        } else if (sp.kind === 'wave') {
          for (let i = 0; i < 3; i++) {
            this.queue.push({ t: i * 12, fn: () => {
              const p = this.spawnProjectile(f, sp, { speed: 5.4, size: 46, dmg: 6, life: 120, gravity: 0, style: 'onion' });
              p.y = this.arena.floor - 54;
            } });
          }
          TT.FX.flash('#bdeaff', 0.3);
        } else if (sp.kind === 'beam') {
          TT.FX.flash('#c3ccff', 0.5);
          TT.FX.shake(9);
          const dir = f.facing;
          const bx = f.x + dir * 30, by = f.y - f.hurtH * 0.55;
          this.queue.push({ t: 0, fn: () => {
            for (let i = 0; i < 16; i++) {
              TT.FX.trail(bx + dir * i * 30, by + rnd(-14, 14), 18, '#7f92ff', 22);
              TT.FX.spark(bx + dir * i * 30, by + rnd(-20, 20), 2, 'blueberry', 1.4);
            }
            TT.FX.ring(bx, by, '#c3ccff', 180, 10);
            if (opp.state !== 'ko') {
              const inFront = (opp.x - f.x) * dir > 0;
              const aligned = Math.abs(opp.y - f.y) < 140;
              if (inFront && aligned && opp.x * dir < (f.x + dir * 620) * dir) {
                if (opp.blocking) {
                  opp.hp = Math.max(0, opp.hp - sp.dmg * 0.14);
                  opp.blockstun = 20; this.stats[opp.side].blocks++;
                  TT.FX.text(opp.x, opp.y - opp.hurtH, 'BLOCK', '#9fe0ff', 16, 'info');
                } else this.landHit(f, opp, { dmg: sp.dmg, kb: 11, lift: 3, gain: 10 }, 'super');
              }
            }
          } });
        } else if (sp.kind === 'crown') {
          TT.FX.flash('#ffd25a', 0.5);
          TT.FX.shake(16);
          TT.FX.ring(f.x, f.y - 60, '#efc04a', 300, 14);
          for (let i = 0; i < 4; i++) {
            const px = opp.x + rnd(-110, 110);
            this.queue.push({ t: i * 5, fn: () => {
              TT.FX.ring(px, this.arena.floor - 20, '#ffd25a', 140, 12);
              TT.FX.spark(px, this.arena.floor - 40, 20, 'royal', 1.6);
              TT.FX.shake(8);
            } });
          }
          this.queue.push({ t: 10, fn: () => {
            if (Math.abs(opp.x - f.x) < sp.radius && opp.state !== 'ko') this.landHit(f, opp, { dmg: sp.dmg, kb: 13, lift: 6, gain: 10 }, 'super');
            TT.FX.flash('#fff0a8', 0.5);
            for (let i = 0; i < 30; i++) TT.FX.shard(opp.x + rnd(-80, 80), this.arena.floor - rnd(0, 100), 1, 'royal', 1.4);
          } });
        }
        TT.sfx(sp.sound);
      }
      this.dark = Math.max(0, this.dark - (f.superT > 50 ? 0.012 : 0));
      if (f.superT >= 96) {
        f.attack = null;
        f.state = 'idle'; f.stateT = 0;
        this.dark = 0;
      }
      this.physics(f);
    },

    runQueue() {
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const q = this.queue[i];
        q.t--;
        if (q.t <= 0) { this.queue.splice(i, 1); q.fn(); }
      }
    },

    /* ------------------------------------------------------------ */
    /* Animation poses                                              */
    /* ------------------------------------------------------------ */
    animateFighters(noInput) {
      for (const f of this.fighters) {
        if (f.ai && this.phase === 'fight') f.animT++;
        if (f.hurtFlash > 0) f.hurtFlash = Math.max(0, f.hurtFlash - 0.06);
        f.pose = this.pose(f);
      }
    },

    pose(f) {
      const t = f.animT;
      const st = f.stateT;
      const p = {
        sx: 1, sy: 1, rot: 0, lift: 0, armFront: 0.55, armBack: -0.55, armLen: 20,
        headTilt: 0, brow: 0.12, mouth: 'neutral', eyeOpen: 1, look: { x: 0, y: 0 },
        guard: 0, legSwing: 0, aura: 0, charge: 0, tear: false, blink: f.blink > 0,
        squint: 0, headY: 0
      };
      const opp = f.opponent;
      if (opp) {
        p.look.x = clamp((opp.x - f.x) / 200, -1, 1);
        p.look.y = clamp((opp.y - f.y) / 200, -1, 1);
      }
      const breathe = Math.sin(t * 0.06) * 0.5 + 0.5;

      if (f.state === 'ko') {
        p.rot = -1.42; p.lift = -f.hurtH * 0.42; p.sy = 0.9; p.sx = 1.08;
        p.armFront = 2.6; p.armBack = -2.5; p.mouth = 'pain'; p.eyeOpen = 0.12;
        p.brow = -1; p.squint = 1;
        return p;
      }
      if (f.state === 'win') {
        const b = Math.sin(st * 0.12) * 0.5 + 0.5;
        p.armFront = 2.9 + b * 0.15; p.armBack = -2.7;
        p.mouth = 'grin'; p.brow = 0.6; p.sy = 1 + b * 0.03;
        p.rot = Math.sin(st * 0.1) * 0.04;
        p.aura = 0.35; p.lift = -Math.max(0, Math.sin(st * 0.16)) * 5;
        p.legSwing = Math.sin(st * 0.16);
        return p;
      }
      if (f.state === 'hurt' || f.state === 'knockdown') {
        const k = f.state === 'knockdown' ? 1 : Math.min(1, st / 6 + 0.3);
        p.rot = -0.26 * k; p.sx = 0.95; p.sy = 1.05;
        p.armFront = 2.4; p.armBack = -2.2;
        p.mouth = 'pain'; p.brow = -0.85; p.eyeOpen = 0.55; p.squint = 1;
        p.headTilt = 0.2;
        if (f.state === 'knockdown') {
          p.rot = -1.2; p.lift = -f.hurtH * 0.3;
        }
        return p;
      }
      if (f.state === 'getup') {
        const k = clamp(st / 18, 0, 1);
        p.rot = -1.2 * (1 - k); p.lift = -f.hurtH * 0.3 * (1 - k);
        p.sy = 0.9 + k * 0.1; p.mouth = 'sad'; p.brow = -0.4;
        return p;
      }
      if (f.state === 'block') {
        p.guard = 1; p.armFront = 1.15; p.armBack = 1.05; p.armLen = 17;
        p.sy = 0.97; p.sx = 0.98; p.brow = 0.5; p.mouth = 'neutral';
        p.legSwing = 0;
        return p;
      }
      if (f.state === 'crouch') {
        p.sy = 0.78; p.sx = 1.1; p.lift = 5; p.armFront = 0.9; p.armBack = -0.2;
        p.brow = 0.35; p.headTilt = 0.04;
        return p;
      }
      if (f.state === 'dash') {
        p.rot = 0.2; p.sx = 1.12; p.sy = 0.92; p.legSwing = 1;
        p.armFront = -0.9; p.armBack = 1.5; p.brow = 0.8;
        p.mouth = 'shout';
        return p;
      }
      if (f.airborne) {
        if (f.state === 'jump') {
          p.sy = 1.1 - Math.min(0.08, st * 0.002); p.sx = 0.94;
          p.armFront = 2.75; p.armBack = -2.5; p.legSwing = 0.5;
          p.mouth = 'open'; p.brow = 0.3;
        } else {
          p.sy = 1.04; p.sx = 0.98;
          p.armFront = 1.7; p.armBack = -1.6; p.legSwing = -0.4;
          p.mouth = 'open'; p.brow = 0.1;
        }
        if (f.attack) this.attackPose(f, p, st);
        return p;
      }
      if (f.attack) { this.attackPose(f, p, st); return p; }
      if (f.state === 'land') {
        const k = clamp(st / 8, 0, 1);
        p.sy = 0.82 + k * 0.18; p.sx = 1.16 - k * 0.16; p.lift = (1 - k) * 4;
        p.armFront = 1.1; p.armBack = -1.0; p.brow = 0.2; p.mouth = 'open';
        return p;
      }
      if (f.state === 'intro') {
        const k = Math.min(1, st / 24);
        p.sy = 1 + Math.sin(st * 0.2) * 0.04; p.armFront = 1.9; p.armBack = -1.7;
        p.mouth = 'grin'; p.brow = 0.6; p.aura = 0.25 * k;
        return p;
      }
      if (f.state === 'walk') {
        const s = Math.sin(t * 0.22);
        p.legSwing = s; p.armFront = 0.55 + s * 0.35; p.armBack = -0.55 - s * 0.35;
        p.lift = Math.abs(Math.sin(t * 0.22)) * 2;
        p.brow = 0.1;
        return p;
      }
      // idle
      p.sy = 1 + Math.sin(t * 0.055) * 0.018;
      p.sx = 1 - Math.sin(t * 0.055) * 0.012;
      p.lift = Math.sin(t * 0.055) * 1.6;
      p.armFront = 0.55 + Math.sin(t * 0.05) * 0.09;
      p.armBack = -0.55 - Math.sin(t * 0.05) * 0.07;
      p.headTilt = Math.sin(t * 0.031) * 0.03;
      p.brow = f.char.id === 'tomato' || f.char.id === 'chili' ? 0.35 : 0.12;
      p.mouth = f.char.id === 'onion' ? 'sad' : 'neutral';
      p.tear = f.char.id === 'onion' && Math.sin(t * 0.01) > 0.6;
      if (f.char.id === 'spud') { p.sy *= 0.99; p.sx *= 1.02; }
      p.charge = f.char.id === 'chili' ? 0.5 : 0;
      if (f.meter >= T.METER_MAX) p.aura = 0.25 + Math.sin(t * 0.1) * 0.1;
      return p;
    },

    attackPose(f, p, st) {
      const a = f.attack;
      if (!a) return;
      const mv = a.move;
      const startup = mv.startup, active = mv.active;
      const total = startup + active + mv.recovery;
      let phase = 'wind';
      if (a.frame >= startup) phase = 'hit';
      if (a.frame >= startup + active) phase = 'rec';
      const power = a.kind === 'heavy' ? 1 : a.kind === 'special' ? 0.7 : a.kind === 'super' ? 1.4 : 0.5;
      if (a.kind === 'super') {
        p.aura = 1; p.sx = 1 + Math.sin(st * 0.3) * 0.05; p.sy = 1 + Math.cos(st * 0.3) * 0.04;
        p.armFront = 2.3; p.armBack = -2.2; p.mouth = 'shout'; p.brow = 1;
        p.rot = -0.05; p.charge = 1;
        return;
      }
      if (phase === 'wind') {
        const k = a.frame / Math.max(1, startup);
        p.rot = -0.1 * power * k;
        p.armFront = -0.7 - k * 0.5;
        p.armBack = -0.9;
        p.sx = 0.97; p.sy = 1.02;
        p.brow = 0.9; p.mouth = 'shout';
        p.legSwing = -0.4 * power;
        if (a.kind === 'special') { p.aura = 0.3; p.charge = 1; }
      } else if (phase === 'hit') {
        const k = (a.frame - startup) / Math.max(1, active);
        p.rot = 0.16 * power;
        p.armFront = 1.75 + k * 0.3;
        p.armBack = -1.5;
        p.armLen = a.kind === 'heavy' ? 25 : 22;
        p.sx = 1.03 + 0.05 * power; p.sy = 0.96;
        p.brow = 1; p.mouth = 'shout';
        p.legSwing = 0.6 * power;
        p.lift = -2 * power;
        if (a.kind === 'special') { p.aura = 0.45; p.charge = 1; }
      } else {
        const k = clamp((a.frame - startup - active) / Math.max(1, mv.recovery), 0, 1);
        p.rot = 0.16 * power * (1 - k);
        p.armFront = lerp(2.0, 0.55, k);
        p.armBack = lerp(-1.5, -0.55, k);
        p.sx = lerp(1.06, 1, k); p.sy = lerp(0.96, 1, k);
        p.brow = lerp(0.9, 0.2, k); p.mouth = k > 0.6 ? 'neutral' : 'shout';
      }
    },

    /* ------------------------------------------------------------ */
    /* Camera                                                       */
    /* ------------------------------------------------------------ */
    updateCamera() {
      const [a, b] = this.fighters;
      if (!a || !b) return;
      const mid = (a.x + b.x) / 2;
      const dist = Math.abs(a.x - b.x);
      const targetX = clamp(mid - W / 2, 0, this.arena.width - W);
      this.cam.x = lerp(this.cam.x, targetX, 0.09);
      const targetZoom = 1 + clamp((520 - dist) / 520, 0, 1) * 0.05;
      this.cam.zoom = lerp(this.cam.zoom, targetZoom, 0.05);
      this.cam.punch *= 0.86;
      if (this.cam.punch < 0.001) this.cam.punch = 0;
    },

    updateFall() {
      for (const f of this.fighters) {
        if (!f.airborne && f.state === 'hurt' && f.hitstun <= 0) f.state = 'idle';
      }
    },

    /* ------------------------------------------------------------ */
    /* AI decision making                                           */
    /* ------------------------------------------------------------ */
    aiInput(f, opp) {
      const out = { left: false, right: false, up: false, down: false, light: false, heavy: false, special: false, super: false, guard: false, dashDir: 0 };
      if (!f || !f.ai || !opp) return out;
      const ai = f.ai;
      if (ai.dummy) return out;
      const dx = opp.x - f.x;
      const dist = Math.abs(dx);
      const dir = dx > 0 ? 1 : -1;
      const hpFrac = f.hp / f.maxHp, oppHp = opp.hp / opp.maxHp;
      const phaseAgg = ai.aggressionMod || 1;

      if (ai.think <= 0) {
        ai.think = Math.max(3, Math.round(ai.reaction * rnd(0.7, 1.3)));
        const r = Math.random();
        let intent = 'approach';
        const oppAttacking = !!opp.attack && opp.attack.frame <= (opp.attack.move.startup + opp.attack.move.active);
        const oppRecovering = !!opp.attack && opp.attack.frame > (opp.attack.move.startup + opp.attack.move.active);

        if (oppAttacking && dist < 190 && r < ai.block * (0.7 + ai.block * 0.5)) {
          intent = 'block';
        } else if (oppRecovering && dist < 160 && r < ai.punish) {
          intent = 'punish';
        } else if (dist < 150) {
          if (r < ai.aggression * phaseAgg) intent = 'attack';
          else if (r < ai.aggression + 0.22) intent = 'block';
          else if (r < ai.aggression + 0.34) intent = 'retreat';
          else intent = 'approach';
        } else if (dist < 330) {
          if (r < ai.special * phaseAgg) intent = 'special';
          else if (r < ai.special + ai.jump * 0.6) intent = 'jumpin';
          else if (r < 0.85) intent = 'approach';
          else intent = 'retreat';
        } else {
          if (r < ai.special * 0.8 && f.specialCd <= 0) intent = 'special';
          else if (r < ai.dash) intent = 'dashin';
          else intent = 'approach';
        }
        // defensive retreat when low
        if (hpFrac < 0.3 && Math.random() < ai.retreat && dist < 220) intent = Math.random() < 0.5 ? 'retreat' : 'block';
        if (oppHp < 0.2 && dist < 220 && Math.random() < ai.aggression) intent = 'attack';
        ai.intent = intent;
        ai.hold = Math.round(rnd(6, 20));
      }
      ai.think--;
      ai.hold--;

      if (ai.attackCd > 0) ai.attackCd--;
      const intent = ai.intent;
      const towardsOpp = dir;
      switch (intent) {
        case 'approach':
          if (dir > 0) out.right = true; else out.left = true;
          if (dist < 110) out.down = Math.random() < 0.2;
          break;
        case 'retreat':
          if (dir > 0) out.left = true; else out.right = true;
          if (f.x < 120 || f.x > this.arena.width - 120) { out.left = false; out.right = false; if (dir > 0) out.right = true; else out.left = true; }
          out.guard = Math.random() < 0.3;
          break;
        case 'block':
          out.guard = true;
          if (dir > 0) out.left = true; else out.right = true;
          break;
        case 'punish':
          if (dist > 130) { if (dir > 0) out.right = true; else out.left = true; }
          else if (ai.attackCd <= 0) {
            if (Math.random() < 0.5) out.heavy = true; else out.light = true;
            ai.attackCd = Math.round(rnd(8, 18));
          }
          break;
        case 'attack': {
          if (dist > 120) { if (dir > 0) out.right = true; else out.left = true; }
          else if (ai.attackCd <= 0) {
            const roll = Math.random();
            if (roll < 0.55) out.light = true;
            else if (roll < 0.82) out.heavy = true;
            else if (f.specialCd <= 0 && Math.random() < ai.special + 0.2) out.special = true;
            else out.light = true;
            ai.attackCd = Math.round(rnd(9, 26));
          } else if (dir > 0) out.right = true; else out.left = true;
          break;
        }
        case 'special':
          if (f.specialCd <= 0) out.special = true;
          else if (dir > 0) out.right = true; else out.left = true;
          break;
        case 'jumpin':
          if (!f.airborne) out.up = true;
          else {
            if (dir > 0) out.right = true; else out.left = true;
            if (dist < 160 && Math.random() < 0.3) out.heavy = true;
          }
          break;
        case 'dashin':
          out.dashDir = towardsOpp;
          if (dist < 130) out.light = true;
          break;
      }
      // supers (gated so the CPU does not fire one every frame)
      if (f.meter >= T.METER_MAX && dist < 340 && ai.attackCd <= 0 && Math.random() < ai.superRate * 0.05 * (1 + (1 - oppHp))) {
        out.super = true;
        ai.attackCd = 40;
      }
      // never spam guard forever
      if (intent === 'block' && ai.hold <= -6) { ai.intent = 'attack'; }
      // avoid walking into the opponent's face while idle
      if (dist < 70 && intent === 'approach') { out.left = false; out.right = false; out.light = Math.random() < 0.5; }
      return out;
    },

    /* ------------------------------------------------------------ */
    /* Rendering                                                    */
    /* ------------------------------------------------------------ */
    render() {
      if (!ctx) return;
      ctx.save();
      const shake = this.shakeOn ? 1 : 0;
      if (shake) TT.FX.drawShake(ctx);
      const arena = this.arena;
      TT.Arenas.draw(ctx, arena, this.cam.x, this.time * 60, this.quality);

      ctx.save();
      const zoom = this.cam.zoom + this.cam.punch;
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
      ctx.translate(-this.cam.x, 0);

      // shadows for projectiles
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      for (const p of this.projectiles) {
        ctx.beginPath();
        ctx.ellipse(p.x, arena.floor + 2, p.size * 0.8, p.size * 0.3, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // peels
      for (const peel of this.peels) {
        ctx.save();
        ctx.translate(peel.x, arena.floor - 4);
        ctx.rotate(Math.sin(peel.x) * 0.4);
        ctx.fillStyle = '#ffe14d';
        ctx.beginPath();
        ctx.moveTo(-22, 0);
        ctx.bezierCurveTo(-12, -14, 12, -14, 22, 0);
        ctx.bezierCurveTo(12, -4, -12, -4, -22, 0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(-19, -1, 4, 0, TAU);
        ctx.fillStyle = '#6a5220'; ctx.fill();
        ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }

      // fighters (back to front by y)
      const order = this.fighters.slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
      for (const f of order) {
        if (f.attack && f.state === 'super') {
          // super chant trail
          ctx.save();
          ctx.globalAlpha = 0.25;
          for (let i = 1; i < 4; i++) {
            ctx.save();
            ctx.translate(-f.facing * i * 6, 0);
            TT.Art.drawFighter(ctx, Object.assign({}, f, { pose: Object.assign({}, f.pose, { aura: 0 }) }), this.time * 60);
            ctx.restore();
          }
          ctx.restore();
        }
        TT.Art.drawFighter(ctx, f, this.time * 60);
        // super charge column
        if (f.state === 'super') {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const grd = ctx.createLinearGradient(f.x, arena.floor - 260, f.x, arena.floor);
          grd.addColorStop(0, TT.Art.hexA(f.colors.accent, 0));
          grd.addColorStop(0.7, TT.Art.hexA(f.colors.accent, 0.28));
          grd.addColorStop(1, TT.Art.hexA(f.colors.accent, 0.5));
          ctx.fillStyle = grd;
          ctx.fillRect(f.x - 42, arena.floor - 260, 84, 260);
          ctx.restore();
        }
      }
      // projectiles
      for (const p of this.projectiles) TT.Art.drawProjectile(ctx, p, this.time * 60);

      TT.FX.drawWorld(ctx);
      ctx.restore();

      // screen space overlays
      if (this.dark > 0.01) {
        ctx.save();
        ctx.globalAlpha = this.dark * 0.82;
        ctx.fillStyle = '#0a0416';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      ctx.restore(); // end screen shake so the HUD stays rock steady
      TT.FX.drawText(ctx);
      TT.FX.drawFlash(ctx, W, H);
      this.drawHUD();
    },

    drawHUD() {
      if (this.screen !== 'fight' && this.screen !== 'results') return;
      const [a, b] = this.fighters;
      if (!a || !b) return;
      const t = this.time * 60;

      this.drawPlayerHUD(a, 'left', t);
      this.drawPlayerHUD(b, 'right', t);

      // timer
      const secs = Math.ceil(this.timer / 60);
      ctx.save();
      ctx.translate(W / 2, 52);
      ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU);
      const tg = ctx.createLinearGradient(0, -32, 0, 32);
      tg.addColorStop(0, 'rgba(46,28,54,0.95)'); tg.addColorStop(1, 'rgba(18,10,26,0.95)');
      ctx.fillStyle = tg; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = secs <= 10 ? '#ff5b4d' : '#e6c87a'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU);
      ctx.strokeStyle = 'rgba(255,220,160,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = secs <= 10 ? '#ff7a6a' : '#fff2cf';
      ctx.font = '900 30px "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(secs), 0, 1);
      ctx.font = '800 9px "Trebuchet MS", sans-serif';
      ctx.fillStyle = 'rgba(255,230,180,0.6)';
      ctx.fillText('TIMER', 0, 23);
      ctx.restore();

      // round pips (center under timer)
      for (let i = 0; i < T.ROUNDS_TO_WIN; i++) {
        const filledL = i < this.wins[0];
        ctx.beginPath(); ctx.arc(W / 2 - 16 - i * 14, 94, 4.6, 0, TAU);
        ctx.fillStyle = filledL ? '#ffd45c' : 'rgba(255,255,255,0.18)'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        const filledR = i < this.wins[1];
        ctx.beginPath(); ctx.arc(W / 2 + 16 + i * 14, 94, 4.6, 0, TAU);
        ctx.fillStyle = filledR ? '#ffd45c' : 'rgba(255,255,255,0.18)'; ctx.fill();
        ctx.stroke();
      }

      // boss bar
      const boss = this.fighters.find(f => f.char.boss);
      if (boss) {
        const bw = 520, bx = W / 2 - bw / 2, by = 122;
        ctx.save();
        ctx.fillStyle = 'rgba(12,6,18,0.8)';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, 16, 8) : ctx.rect(bx, by, bw, 16); ctx.fill();
        const frac = boss.hp / boss.maxHp;
        const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        bg.addColorStop(0, '#8c1420'); bg.addColorStop(0.5, '#ff4a4a'); bg.addColorStop(1, '#ffa04a');
        ctx.fillStyle = bg;
        const w = bw * Math.max(0, frac);
        ctx.fillRect(bx, by, w, 16);
        ctx.strokeStyle = '#ecc76a'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, 16);
        ctx.font = '900 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe9b0';
        ctx.fillText('KING TOMATO  ·  PHASE ' + this.bossPhase + ' / 3', W / 2, by - 5);
        ctx.restore();
      }

      // combo counters
      this.drawCombo(a, 'left');
      this.drawCombo(b, 'right');

      // announcement
      if (this.ann) {
        const k = this.ann.t / this.ann.life;
        const inT = Math.min(1, this.ann.t / 10);
        const outT = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
        ctx.save();
        ctx.translate(W / 2, H * 0.36);
        const sc = (0.7 + inT * 0.3) * (1 + Math.max(0, 0.12 - k) * 0.9);
        ctx.scale(sc, sc);
        ctx.globalAlpha = clamp(outT, 0, 1);
        ctx.font = '900 62px "Trebuchet MS", Impact, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 13; ctx.strokeStyle = 'rgba(14,6,20,0.96)';
        ctx.strokeText(this.ann.title, 0, 0);
        const ag = ctx.createLinearGradient(0, -40, 0, 20);
        ag.addColorStop(0, '#fffdf0'); ag.addColorStop(0.5, this.ann.color); ag.addColorStop(1, '#ffc46a');
        ctx.fillStyle = ag;
        ctx.fillText(this.ann.title, 0, 0);
        if (this.ann.sub) {
          ctx.font = '900 16px "Trebuchet MS", sans-serif';
          ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(18,8,26,0.9)';
          ctx.strokeText(this.ann.sub, 0, 30);
          ctx.fillStyle = '#ffe9b8';
          ctx.fillText(this.ann.sub, 0, 30);
        }
        ctx.restore();
      }

      // low health vignette
      const low = Math.min(a.hp / a.maxHp, b.hp / b.maxHp);
      if (low < 0.25) {
        const pulse = 0.25 + Math.sin(t * 0.08) * 0.12;
        ctx.save();
        const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
        vg.addColorStop(0, 'rgba(255,40,40,0)');
        vg.addColorStop(1, `rgba(255,40,40,${0.22 + pulse * 0.2})`);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },

    drawPlayerHUD(f, sideKey, t) {
      const left = sideKey === 'left';
      const barW = 352, barH = 18;
      const x0 = left ? 96 : W - 96 - barW;
      const y0 = 30;
      const portraitR = 34;
      const px = left ? 48 : W - 48;

      // portrait
      ctx.save();
      ctx.beginPath(); ctx.arc(px, y0 + 20, portraitR, 0, TAU);
      const pg = ctx.createLinearGradient(px - 30, y0 - 20, px + 30, y0 + 50);
      pg.addColorStop(0, f.colors.light); pg.addColorStop(1, f.colors.dark);
      ctx.fillStyle = pg; ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(px, y0 + 20, portraitR - 3, 0, TAU); ctx.clip();
      const port = TT.Art.portrait(f.char.id, f.skin);
      ctx.drawImage(port, px - 40, y0 - 24, 80, 80);
      ctx.restore();
      ctx.lineWidth = 3;
      ctx.strokeStyle = f.meter >= T.METER_MAX ? '#fff2b0' : '#1a1018';
      ctx.stroke();
      ctx.beginPath(); ctx.arc(px, y0 + 20, portraitR + 2, 0, TAU);
      ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();

      // name
      ctx.save();
      ctx.font = '900 15px "Trebuchet MS", sans-serif';
      ctx.textAlign = left ? 'left' : 'right';
      ctx.fillStyle = '#fff3d0';
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6;
      ctx.fillText(f.char.name, left ? 96 : W - 96, y0 - 6);
      const nmW = ctx.measureText(f.char.name).width;
      ctx.font = '800 9px "Trebuchet MS", sans-serif';
      ctx.fillStyle = 'rgba(255,235,190,0.6)';
      ctx.fillText(f.char.title, left ? 96 + nmW + 9 : W - 96 - nmW - 9, y0 - 6);
      ctx.restore();

      // bar frame
      ctx.save();
      ctx.fillStyle = 'rgba(12,7,20,0.82)';
      this.rrect(x0 - 3, y0 + 1, barW + 6, barH + 6, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,160,0.28)'; ctx.lineWidth = 1.5;
      this.rrect(x0 - 3, y0 + 1, barW + 6, barH + 6, 7); ctx.stroke();

      // damage ghost
      const frac = clamp(f.hp / f.maxHp, 0, 1);
      ctx.save();
      ctx.translate(left ? x0 : x0 + barW, 0);
      ctx.scale(left ? 1 : -1, 1);
      ctx.fillStyle = 'rgba(255,90,80,0.55)';
      const ghost = clamp((f._ghostHp == null ? frac : f._ghostHp), 0, 1);
      ctx.fillRect(0, y0 + 4, barW * ghost, barH);
      const hg = ctx.createLinearGradient(0, y0, 0, y0 + barH);
      if (frac < 0.25) { hg.addColorStop(0, '#ffb36b'); hg.addColorStop(1, '#d92c1c'); }
      else if (frac < 0.5) { hg.addColorStop(0, '#ffe08a'); hg.addColorStop(1, '#e8873a'); }
      else { hg.addColorStop(0, '#eaffc8'); hg.addColorStop(0.45, '#8fe06a'); hg.addColorStop(1, '#3f9c52'); }
      ctx.fillStyle = hg;
      ctx.fillRect(0, y0 + 4, barW * frac, barH);
      // bar gloss
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, y0 + 4, barW * frac, 5);
      // danger stripes
      if (frac < 0.25) {
        ctx.globalAlpha = 0.35 + Math.sin(t * 0.12) * 0.2;
        ctx.fillStyle = '#fff';
        for (let i = 0; i < barW * frac; i += 14) ctx.fillRect(i, y0 + 4, 5, barH);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      f._ghostHp = ghost + (frac - ghost) * 0.06;

      // segments
      ctx.strokeStyle = 'rgba(10,6,16,0.55)'; ctx.lineWidth = 2;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + (barW / 5) * i, y0 + 4);
        ctx.lineTo(x0 + (barW / 5) * i, y0 + 4 + barH);
        ctx.stroke();
      }

      // super meter
      const my = y0 + barH + 10;
      const mFrac = f.meter / T.METER_MAX;
      ctx.fillStyle = 'rgba(12,7,20,0.8)';
      this.rrect(x0, my, barW * 0.72, 9, 4); ctx.fill();
      ctx.save();
      ctx.translate(left ? x0 : x0 + barW * 0.72, 0);
      ctx.scale(left ? 1 : -1, 1);
      const mg = ctx.createLinearGradient(0, my, barW * 0.72, my);
      mg.addColorStop(0, '#3fb0ff'); mg.addColorStop(0.55, '#b06de0'); mg.addColorStop(1, '#ffd25a');
      ctx.fillStyle = mg;
      ctx.fillRect(0, my, barW * 0.72 * mFrac, 9);
      if (mFrac >= 1) {
        ctx.globalAlpha = 0.4 + Math.sin(t * 0.15) * 0.3;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, my, barW * 0.72, 9);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      ctx.strokeStyle = mFrac >= 1 ? '#fff2b0' : 'rgba(200,220,255,0.25)';
      ctx.lineWidth = 1.4;
      this.rrect(x0, my, barW * 0.72, 9, 4); ctx.stroke();
      ctx.font = '900 9px "Trebuchet MS", sans-serif';
      ctx.textAlign = left ? 'left' : 'right';
      ctx.fillStyle = mFrac >= 1 ? '#fff6c0' : 'rgba(210,225,255,0.65)';
      ctx.fillText(mFrac >= 1 ? 'SUPER READY!' : 'SUPER METER', left ? x0 + barW * 0.72 + 8 : x0 - 8, my + 8);
      ctx.restore();
    },

    drawCombo(f, sideKey) {
      if (!f.combo || f.combo < 2) return;
      const left = sideKey === 'left';
      const k = clamp(f.comboT / 40, 0, 1);
      const scale = 1 + Math.max(0, f.comboT - T.COMBO_WINDOW + 8) / 60;
      ctx.save();
      ctx.translate(left ? 122 : W - 122, 168);
      ctx.scale(scale, scale);
      ctx.globalAlpha = Math.min(1, k * 3);
      ctx.textAlign = 'center';
      ctx.font = '900 40px "Trebuchet MS", sans-serif';
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(18,8,26,0.9)';
      const txt = f.combo + '';
      ctx.strokeText(txt, 0, 0);
      const cg = ctx.createLinearGradient(0, -30, 0, 10);
      cg.addColorStop(0, '#fff8dc'); cg.addColorStop(1, f.colors.accent);
      ctx.fillStyle = cg;
      ctx.fillText(txt, 0, 0);
      ctx.font = '900 14px "Trebuchet MS", sans-serif';
      const label = f.combo >= 8 ? 'AMAZING!' : f.combo >= 6 ? 'BIG COMBO!' : f.combo >= 4 ? 'NICE COMBO!' : 'HIT COMBO';
      ctx.lineWidth = 5;
      ctx.strokeText(label, 0, 18);
      ctx.fillStyle = '#ffe6a0';
      ctx.fillText(label, 0, 18);
      ctx.restore();
    },

    rrect(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else {
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
    },

    /* toggled by ui.js */
    togglePause() {
      if (this.screen !== 'fight') return;
      this.paused = !this.paused;
      if (this.paused) { TT.Audio.stopMusic(); TT.sfx('ui'); }
      else { TT.Audio.startMusic(this.arena, this.mode === 'boss'); }
      return this.paused;
    },

    quitToTitle() {
      this.running = false; this.paused = false; this.phase = 'idle';
      this.projectiles = []; this.peels = []; this.queue = [];
      this.fighters = []; this.ann = null;
      TT.FX.reset();
      TT.Audio.stopMusic();
    },

    restartMatch() {
      this.wins = [0, 0]; this.round = 1; this._carryMeter = [0, 0];
      this.stats = { p1: { dmg: 0, maxCombo: 0, supers: 0, blocks: 0 }, p2: { dmg: 0, maxCombo: 0, supers: 0, blocks: 0 } };
      this.running = true; this.paused = false;
      this.bossPhase = 1;
      this.startRound(true);
      TT.Audio.startMusic(this.arena, this.mode === 'boss');
      this.showScreen('fight');
    },

    showScreen: function () { /* replaced by ui.js */ }
  };

  /* difficulty lookup with boss scaling */
  function T_difficulty(key) {
    return TT.DIFFICULTY[key] || TT.DIFFICULTY.normal;
  }
  function bossDifficulty(key) {
    if (key === 'easy') return 'normal';
    if (key === 'normal') return 'hard';
    return 'expert';
  }
})();
