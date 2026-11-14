/* TOOKEND TYNDOUT: PRODUCE BRAWL — interface, input, screens */
(function () {
  'use strict';
  const TT = window.TT;
  const G = TT.Game;
  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const state = {
    screen: 'title', mode: 'cpu', difficulty: 'normal',
    picks: [{ id: 'lemon', skin: 0 }, { id: 'tomato', skin: 0 }],
    step: 0, arenaIndex: 0, returnTo: 'title',
    preview: { id: 'lemon', skin: 0 }, cursor: 0
  };

  /* ------------------------------------------------------------ */
  /* Settings                                                     */
  /* ------------------------------------------------------------ */
  const DEFAULTS = {
    music: 55, sfx: 80, muted: false, shake: true, quality: 'high',
    touch: 'auto', opacity: 80, size: 100
  };
  let settings = Object.assign({}, DEFAULTS);
  try {
    const raw = localStorage.getItem('tt_settings_v1');
    if (raw) settings = Object.assign(settings, JSON.parse(raw));
  } catch (e) {}
  function saveSettings() {
    try { localStorage.setItem('tt_settings_v1', JSON.stringify(settings)); } catch (e) {}
  }
  function applySettings() {
    TT.Audio.setMusic(settings.music / 100);
    TT.Audio.setSfx(settings.sfx / 100);
    TT.Audio.setMuted(settings.muted);
    G.shakeOn = !!settings.shake;
    G.setQuality(settings.quality);
    document.documentElement.style.setProperty('--touch-op', (settings.opacity / 100).toFixed(2));
    document.documentElement.style.setProperty('--touch-scale', (settings.size / 100).toFixed(2));
    const mt = $('#muteBtn');
    if (mt) mt.textContent = settings.muted ? '✕' : '♪';
    syncSettingsUI();
    updateTouchVisibility();
  }
  function syncSettingsUI() {
    const set = (id, v) => { const el = $(id); if (el) el.value = v; };
    set('#setMusic', settings.music); $('#setMusicVal').textContent = settings.music;
    set('#setSfx', settings.sfx); $('#setSfxVal').textContent = settings.sfx;
    set('#setOpacity', settings.opacity); $('#setOpacityVal').textContent = settings.opacity;
    set('#setSize', settings.size); $('#setSizeVal').textContent = settings.size;
    const mute = $('#setMute'); if (mute) mute.checked = !!settings.muted;
    const shake = $('#setShake'); if (shake) shake.checked = !!settings.shake;
    const touch = $('#setTouch'); if (touch) touch.value = settings.touch;
    $$('#setQuality button').forEach(b => b.classList.toggle('on', b.dataset.q === settings.quality));
  }

  /* ------------------------------------------------------------ */
  /* Input                                                        */
  /* ------------------------------------------------------------ */
  const ACTS = ['left', 'right', 'up', 'down', 'light', 'heavy', 'special', 'super', 'guard'];
  const KEYMAP = {
    KeyA: ['p1', 'left'], KeyD: ['p1', 'right'], KeyW: ['p1', 'up'], KeyS: ['p1', 'down'],
    KeyJ: ['p1', 'light'], KeyK: ['p1', 'heavy'], KeyL: ['p1', 'special'],
    KeyI: ['p1', 'super'], KeyU: ['p1', 'guard'],
    ArrowLeft: ['p2', 'left'], ArrowRight: ['p2', 'right'], ArrowUp: ['p2', 'up'], ArrowDown: ['p2', 'down'],
    Numpad1: ['p2', 'light'], Numpad2: ['p2', 'heavy'], Numpad3: ['p2', 'special'],
    Numpad0: ['p2', 'super'], Numpad5: ['p2', 'guard'],
    Comma: ['p2', 'light'], Period: ['p2', 'heavy'], Slash: ['p2', 'special'],
    Semicolon: ['p2', 'super'], Quote: ['p2', 'guard']
  };
  const SOLO_EXTRA = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'
  };
  const keys = new Set();
  const touch = { p1: {}, p2: {} };
  const buffer = { p1: {}, p2: {} };
  ACTS.forEach(a => { touch.p1[a] = false; touch.p2[a] = false; buffer.p1[a] = 0; buffer.p2[a] = 0; });
  function markBuffer(side, act) { if (buffer[side] && act in buffer[side]) buffer[side][act] = 4; }

  const Input = TT.Input = {
    frame: 0,
    prev: { p1: {}, p2: {} },
    tap: { p1: { left: -99, right: -99 }, p2: { left: -99, right: -99 } },
    read(side) {
      this.frame++;
      const cur = {};
      ACTS.forEach(a => { cur[a] = false; });
      keys.forEach(code => {
        const m = KEYMAP[code];
        if (m && m[0] === side) cur[m[1]] = true;
        if (side === 'p1' && state.screen === 'fight' && state.mode !== '2p' && SOLO_EXTRA[code]) {
          cur[SOLO_EXTRA[code]] = true;
        }
      });
      if (side === 'p1') ACTS.forEach(a => { if (touch.p1[a]) cur[a] = true; });
      const out = {};
      ACTS.forEach(a => {
        out[a] = (cur[a] && !this.prev[side][a]) || buffer[side][a] > 0;
        if (buffer[side][a] > 0) buffer[side][a]--;
      });
      this.prev[side] = cur;
      if (out.left) {
        if (this.frame - this.tap[side].left < 15) out.dashDir = -1;
        this.tap[side].left = this.frame;
      }
      if (out.right) {
        if (this.frame - this.tap[side].right < 15) out.dashDir = 1;
        this.tap[side].right = this.frame;
      }
      // human attacks are edge-triggered so holding a button does not spam
      return out;
    },
    reset() {
      this.prev = { p1: {}, p2: {} };
      ACTS.forEach(a => { touch.p1[a] = false; touch.p2[a] = false; });
      keys.clear();
    }
  };

  function unlockAudio() {
    TT.Audio.unlock();
    if (state.screen === 'title' && TT.Audio.ready && !TT.Audio._music) {
      TT.Audio._menuStarted = true;
      TT.Audio.startMusic(TT.ARENAS[0], false);
    }
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', e => { keys.delete(e.code); });
  window.addEventListener('blur', () => { keys.clear(); Input.reset(); });
  window.addEventListener('pointerdown', unlockAudio, true);

  function onKeyDown(e) {
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      back();
      return;
    }
    if (e.code === 'KeyM') { toggleMute(); e.preventDefault(); return; }
    if (state.screen === 'select') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { moveCursor(-1, 0); e.preventDefault(); return; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { moveCursor(1, 0); e.preventDefault(); return; }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { moveCursor(0, -1); e.preventDefault(); return; }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { moveCursor(0, 1); e.preventDefault(); return; }
      if (e.code === 'Enter' || e.code === 'Space') { pickChar(TT.PLAYABLE[state.cursor]); e.preventDefault(); return; }
    }
    if (KEYMAP[e.code] || SOLO_EXTRA[e.code]) {
      keys.add(e.code);
      const m = KEYMAP[e.code];
      if (m) markBuffer(m[0], m[1]);
      else if (SOLO_EXTRA[e.code]) markBuffer('p1', SOLO_EXTRA[e.code]);
      if (state.screen === 'fight') e.preventDefault();
    }
  }

  /* touch buttons */
  function bindTouch() {
    $$('#touch .tbtn').forEach(btn => {
      const act = btn.dataset.act;
      const on = (e) => {
        e.preventDefault();
        TT.Audio.unlock();
        touch.p1[act] = true;
        markBuffer('p1', act);
        btn.classList.add('on');
        if (btn.setPointerCapture && e.pointerId != null) { try { btn.setPointerCapture(e.pointerId); } catch (err) {} }
      };
      const off = (e) => {
        if (e) e.preventDefault();
        touch.p1[act] = false;
        btn.classList.remove('on');
      };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('lostpointercapture', off);
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('touchmove', e => {
      if (state.screen === 'fight') e.preventDefault();
    }, { passive: false });
  }

  function isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  }
  function updateTouchVisibility() {
    const on = state.screen === 'fight' && !G.paused && state.mode !== '2p' &&
      (settings.touch === 'on' || (settings.touch === 'auto' && isTouchDevice()));
    const el = $('#touch');
    if (el) el.classList.toggle('hidden', !on);
    const sup = $('.actions .super');
    if (sup) {
      const p1 = G.fighters[0];
      sup.classList.toggle('ready', !!(p1 && p1.meter >= TT.TUNE.METER_MAX));
    }
  }

  /* ------------------------------------------------------------ */
  /* Screens                                                      */
  /* ------------------------------------------------------------ */
  function showScreen(name) {
    const prevScreen = state.screen;
    state.screen = name;
    G.screen = name;
    document.body.dataset.screen = name;
    $$('.screen').forEach(el => el.classList.toggle('active', el.id === 'screen-' + name));
    updateTouchVisibility();
    if (name === 'fight') {
      Input.reset();
      TT.Audio.unlock();
    }
    if (name === 'title') {
      if (prevScreen !== 'title' || !TT.Audio._menuStarted) {
        TT.Audio._menuStarted = true;
        setTimeout(() => { if (state.screen === 'title') TT.Audio.startMusic(TT.ARENAS[0], false); }, 30);
      }
    } else if (name !== 'fight' && name !== 'results') {
      TT.Audio.stopMusic();
    }
    if (name === 'results') renderResults();
    if (name === 'settings') syncSettingsUI();
  }
  G.showScreen = showScreen;

  /* ------------------------------------------------------------ */
  /* Title                                                        */
  /* ------------------------------------------------------------ */
  function buildTitleChars() {
    const host = $('#titleChars');
    if (!host) return;
    host.innerHTML = '';
    ['lemon', 'tomato', 'blueberry', 'chili', 'eggplant'].forEach((id, i) => {
      const c = document.createElement('canvas');
      c.width = 140; c.height = 140;
      const g = c.getContext('2d');
      const char = TT.getChar(id);
      const f = {
        char, colors: TT.Art.palette(char, 0), scale: 1.15, facing: 1, x: 70, y: 132, groundY: 132,
        pose: { armFront: 0.8 + i * 0.1, armBack: -0.7, mouth: 'grin', brow: 0.4, sx: 1, sy: 1, lift: 0 },
        hurtFlash: 0, airborne: false
      };
      TT.Art.drawFighter(g, f, 10 + i * 30);
      host.appendChild(c);
    });
  }

  /* ------------------------------------------------------------ */
  /* Difficulty                                                   */
  /* ------------------------------------------------------------ */
  const DIFF_TEXT = {
    easy: 'Slower reactions, forgiving defence. Learn the roster.',
    normal: 'A real scrap. The CPU blocks, punishes and uses specials.',
    hard: 'Fast reactions, smart spacing, proper combos.',
    expert: 'Tournament brain. Blocks everything, punishes everything.'
  };
  function openDifficulty(mode) {
    state.mode = mode;
    const grid = $('#diffGrid');
    grid.innerHTML = '';
    ['easy', 'normal', 'hard', 'expert'].forEach(k => {
      const b = document.createElement('button');
      b.className = 'diffCard ' + k;
      b.innerHTML = '<b>' + TT.DIFFICULTY[k].name + '</b><span>' + DIFF_TEXT[k] + '</span>';
      b.onclick = () => {
        state.difficulty = k;
        TT.sfx('select');
        openSelect();
      };
      grid.appendChild(b);
    });
    TT.sfx('ui');
    showScreen('difficulty');
  }

  /* ------------------------------------------------------------ */
  /* Character select                                             */
  /* ------------------------------------------------------------ */
  function openSelect() {
    state.step = 0;
    if (state.mode === 'boss') state.picks[1] = { id: 'king', skin: 0 };
    else if (state.picks[1].id === 'king' || !TT.getChar(state.picks[1].id)) state.picks[1] = { id: 'tomato', skin: 0 };
    state.preview = { id: state.picks[0].id, skin: state.picks[0].skin };
    state.cursor = Math.max(0, TT.PLAYABLE.indexOf(state.picks[0].id));
    renderSelect();
    showScreen('select');
    requestAnimationFrame(() => {
      const esc = $('#screen-select');
      if (esc) esc.scrollTop = 0;
    });
  }

  function selectPrompt() {
    if (state.mode === '2p') {
      return state.step === 0 ? { eyebrow: 'PLAYER 1', title: 'CHOOSE YOUR FIGHTER', status: 'P1 CHOOSING', cls: '' }
        : { eyebrow: 'PLAYER 2', title: 'CHOOSE YOUR FIGHTER', status: 'P2 CHOOSING', cls: 'p2' };
    }
    if (state.mode === 'boss' && state.step >= 1) return { eyebrow: 'CHALLENGER', title: 'CHOOSE YOUR FIGHTER', status: 'KING TOMATO AWAITS', cls: 'p2' };
    if (state.step === 0) return { eyebrow: 'PLAYER 1', title: 'CHOOSE YOUR FIGHTER', status: 'P1 CHOOSING', cls: '' };
    return { eyebrow: 'OPPONENT', title: 'CHOOSE YOUR OPPONENT', status: 'CHOOSING CPU FIGHTER', cls: 'p2' };
  }

  function renderSelect() {
    const grid = $('#charGrid');
    grid.innerHTML = '';
    const p = selectPrompt();
    $('#selectEyebrow').textContent = p.eyebrow;
    $('#selectTitle').textContent = p.title;
    const status = $('#pickStatus');
    status.textContent = p.status;
    status.className = 'selTurn ' + p.cls;

    TT.PLAYABLE.forEach((id, i) => {
      const char = TT.getChar(id);
      const card = document.createElement('button');
      card.className = 'charCard';
      card.dataset.id = id;
      const c = document.createElement('canvas');
      c.width = 150; c.height = 150;
      const g = c.getContext('2d');
      g.drawImage(TT.Art.portrait(id, 0), 0, 0, 150, 150);
      card.appendChild(c);
      const nm = document.createElement('div'); nm.className = 'cname'; nm.textContent = char.name; card.appendChild(nm);
      const tt = document.createElement('div'); tt.className = 'ctitle'; tt.textContent = char.title; card.appendChild(tt);
      if (state.picks[0].id === id && state.step > 0) card.classList.add('p1sel');
      if (state.mode !== 'boss' && state.picks[1].id === id && state.step > 1) card.classList.add('p2sel');
      card.onpointerenter = () => { state.preview = { id, skin: 0 }; renderInfo(); };
      card.onclick = () => pickChar(id);
      card.onfocus = () => { state.preview = { id, skin: 0 }; renderInfo(); };
      grid.appendChild(card);
      if (i === state.cursor) card.classList.add('cursor');
    });
    renderInfo();
  }

  function renderInfo() {
    const id = state.preview.id;
    const char = TT.getChar(id);
    const skin = state.preview.skin || 0;
    $('#infoName').textContent = char.name;
    $('#infoTitle').textContent = char.title;
    $('#previewName').textContent = char.name;
    $('#infoBlurb').textContent = char.blurb;
    const bars = $('#statBars');
    bars.innerHTML = '';
    ['POWER', 'SPEED', 'JUMP', 'WEIGHT', 'REACH'].forEach(k => {
      const row = document.createElement('div');
      row.className = 'statRow';
      const label = document.createElement('span'); label.textContent = k; row.appendChild(label);
      const pips = document.createElement('div'); pips.className = 'pips';
      const v = char.stats[k] || 0;
      for (let i = 0; i < 10; i++) {
        const pip = document.createElement('i');
        pip.className = 'pip' + (i < v ? ' on' : '');
        pips.appendChild(pip);
      }
      row.appendChild(pips);
      bars.appendChild(row);
    });
    const mv = char.moves;
    $('#moveList').innerHTML =
      '<div><b>LIGHT</b><span>' + mv.light.name + '</span></div>' +
      '<div><b>HEAVY</b><span>' + mv.heavy.name + '</span></div>' +
      '<div><b>SPECIAL</b><span>' + mv.special.name + '</span></div>' +
      '<div><b>SUPER</b><span>' + mv.super.name + '</span></div>';
    const btn = $('#skinBtn');
    const skinName = (char.skins[skin] && char.skins[skin].name) || 'CLASSIC';
    btn.textContent = 'SKIN: ' + skinName;
    btn.style.display = char.skins.length > 1 ? '' : 'none';
  }

  function pickChar(id) {
    TT.Audio.unlock();
    TT.sfx('select');
    if (state.mode === 'boss' && state.step === 0) {
      state.picks[0] = { id, skin: state.preview.skin || 0 };
      state.picks[1] = { id: 'king', skin: 0 };
      state.step = 2;
      renderStage();
      showScreen('stage');
      return;
    }
    state.picks[state.step] = { id, skin: state.preview.id === id ? (state.preview.skin || 0) : 0 };
    state.step++;
    if (state.step >= 2) {
      if (state.mode === 'training') state.picks[1] = { id: state.picks[0].id, skin: Math.min(1, TT.getChar(id).skins.length - 1) };
      renderStage();
      showScreen('stage');
    } else {
      state.preview = { id, skin: 0 };
      renderSelect();
    }
  }

  function moveCursor(dx, dy) {
    const cols = 4;
    let i = state.cursor + dx + dy * cols;
    i = clamp(i, 0, TT.PLAYABLE.length - 1);
    state.cursor = i;
    state.preview = { id: TT.PLAYABLE[i], skin: 0 };
    renderSelect();
  }

  /* ------------------------------------------------------------ */
  /* Stage select                                                 */
  /* ------------------------------------------------------------ */
  function renderStage() {
    const grid = $('#stageGrid');
    grid.innerHTML = '';
    TT.ARENAS.forEach((arena, i) => {
      const card = document.createElement('button');
      card.className = 'stageCard' + (i === state.arenaIndex ? ' sel' : '');
      const c = TT.Arenas.thumbnail(arena);
      card.appendChild(c);
      const txt = document.createElement('div');
      txt.innerHTML = '<b>' + arena.name + '</b><span>' + arena.subtitle + '</span>';
      card.appendChild(txt);
      card.onclick = () => { state.arenaIndex = i; TT.sfx('ui'); renderStage(); };
      grid.appendChild(card);
    });
    const a = TT.getChar(state.picks[0].id).name;
    const b = TT.getChar(state.picks[1].id).name;
    $('#vsLine').textContent = a + '  vs  ' + b;
    $('#stageHint').textContent = state.mode === 'training' ? 'Training · no knockout · free practice' :
      state.mode === 'boss' ? 'Boss fight · King Tomato has three phases' :
        (state.mode === '2p' ? 'Local versus · best of three · 60 second rounds' : 'Best of three · ' + TT.DIFFICULTY[state.difficulty].name + ' CPU');
  }

  function startFight() {
    TT.Audio.unlock();
    TT.sfx('fight');
    G.startMatch({
      mode: state.mode,
      difficulty: state.difficulty,
      arena: TT.ARENAS[state.arenaIndex],
      p1: { id: state.picks[0].id, skin: state.picks[0].skin || 0 },
      p2: { id: state.picks[1].id, skin: state.picks[1].skin || 0 }
    });
  }

  /* ------------------------------------------------------------ */
  /* Results                                                      */
  /* ------------------------------------------------------------ */
  function renderResults() {
    const r = G.lastResult;
    if (!r) return;
    const winnerIdx = r.p1win ? 0 : 1;
    const wdata = r.chars[winnerIdx];
    const wchar = TT.getChar(wdata.id);
    $('#resultTitle').textContent = r.p1win ? 'PLAYER 1 WINS' : (state.mode === 'boss' ? 'KING TOMATO WINS' : 'PLAYER 2 WINS');
    $('#resultEyebrow').textContent = (r.mode === 'boss' ? 'BOSS FIGHT' : r.mode === '2p' ? 'LOCAL VERSUS' : 'MATCH') + ' · ' + r.arena.name;
    $('#winnerName').textContent = wchar.name;
    $('#winnerTitle').textContent = wchar.title;
    $('#winnerQuote').textContent = '"' + wchar.quote + '"';
    // portrait
    const pc = $('#resultPortrait');
    const g = pc.getContext('2d');
    g.clearRect(0, 0, pc.width, pc.height);
    g.drawImage(TT.Art.portrait(wchar.id, wdata.skin || 0), 0, 0, pc.width, pc.height);
    const s1 = r.stats.p1, s2 = r.stats.p2;
    const c1 = TT.getChar(r.chars[0].id).name, c2 = TT.getChar(r.chars[1].id).name;
    $('#resultStats').innerHTML =
      '<div class="row head"><span>STAT</span><b>' + c1 + '</b><b>' + c2 + '</b></div>' +
      '<div class="row"><span>Damage dealt</span><b>' + Math.round(s1.dmg) + '</b><b>' + Math.round(s2.dmg) + '</b></div>' +
      '<div class="row"><span>Best combo</span><b>' + s1.maxCombo + (s1.maxCombo === 1 ? ' hit' : ' hits') + '</b><b>' + s2.maxCombo + (s2.maxCombo === 1 ? ' hit' : ' hits') + '</b></div>' +
      '<div class="row"><span>Supers used</span><b>' + s1.supers + '</b><b>' + s2.supers + '</b></div>' +
      '<div class="row"><span>Attacks blocked</span><b>' + s1.blocks + '</b><b>' + s2.blocks + '</b></div>' +
      '<div class="row"><span>Rounds won</span><b>' + r.wins[0] + '</b><b>' + r.wins[1] + '</b></div>';
  }

  /* ------------------------------------------------------------ */
  /* Pause                                                        */
  /* ------------------------------------------------------------ */
  function togglePause() {
    if (state.screen === 'pause') { resumeGame(); return; }
    if (state.screen !== 'fight') return;
    const paused = G.togglePause();
    if (paused) {
      state.returnTo = 'pause';
      showScreen('pause');
    }
  }
  function resumeGame() {
    G.paused = false;
    TT.Audio.startMusic(G.arena, G.mode === 'boss');
    showScreen('fight');
    Input.reset();
  }

  function toggleMute() {
    settings.muted = !settings.muted;
    saveSettings();
    applySettings();
    TT.Audio.unlock();
    TT.sfx('ui');
  }

  /* ------------------------------------------------------------ */
  /* Preview animation                                            */
  /* ------------------------------------------------------------ */
  let previewT = 0;
  function previewLoop() {
    requestAnimationFrame(previewLoop);
    if (state.screen !== 'select') return;
    const cvs = $('#previewCanvas');
    if (!cvs) return;
    previewT++;
    const g = cvs.getContext('2d');
    const char = TT.getChar(state.preview.id);
    const skin = state.preview.skin || 0;
    const colors = TT.Art.palette(char, skin);
    g.clearRect(0, 0, cvs.width, cvs.height);
    // stage ring
    const bg = g.createRadialGradient(160, 150, 10, 160, 200, 190);
    bg.addColorStop(0, TT.Art.hexA(colors.accent, 0.4));
    bg.addColorStop(1, 'rgba(12,7,20,0)');
    g.fillStyle = bg; g.fillRect(0, 0, 320, 320);
    g.save();
    g.globalAlpha = 0.3;
    g.fillStyle = '#0a0610';
    g.beginPath(); g.ellipse(160, 286, 88, 16, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    const breathe = Math.sin(previewT * 0.05);
    const f = {
      char, colors, scale: 2.05 * char.scale, facing: 1, x: 160, y: 288, groundY: 288,
      pose: {
        sx: 1 - breathe * 0.01, sy: 1 + breathe * 0.018, lift: breathe * 2,
        armFront: 0.62 + breathe * 0.08, armBack: -0.6 - breathe * 0.04,
        mouth: 'smirk', brow: 0.35, look: { x: 0.2, y: 0 }, headTilt: Math.sin(previewT * 0.03) * 0.04,
        aura: 0.2 + breathe * 0.06, blink: previewT % 190 > 184
      },
      hurtFlash: 0, airborne: false
    };
    TT.Art.drawFighter(g, f, previewT);
  }

  /* ------------------------------------------------------------ */
  /* Wiring                                                       */
  /* ------------------------------------------------------------ */
  function fitCanvas() {
    const cv = $('#game');
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / 16, vh / 9);
    cv.style.width = Math.round(s * 16) + 'px';
    cv.style.height = Math.round(s * 9) + 'px';
  }

  function bindUI() {
    $$('[data-mode]').forEach(b => {
      b.onclick = () => {
        TT.Audio.unlock(); TT.sfx('select');
        const mode = b.dataset.mode;
        state.mode = mode;
        if (mode === 'cpu' || mode === 'boss') openDifficulty(mode);
        else { state.difficulty = 'normal'; openSelect(); }
      };
    });
    $('#toHow').onclick = () => { state.returnTo = 'title'; showScreen('how'); TT.sfx('ui'); };
    $('#toSettings').onclick = () => { state.returnTo = 'title'; showScreen('settings'); TT.sfx('ui'); };
    $('#howBack').onclick = () => { showScreen(state.returnTo === 'pause' ? 'pause' : 'title'); TT.sfx('cancel'); };
    $('#settingsBack').onclick = () => { showScreen(state.returnTo === 'pause' ? 'pause' : 'title'); TT.sfx('cancel'); };
    $('#btnPauseHow').onclick = () => { state.returnTo = 'pause'; showScreen('how'); };
    $('#btnPauseSettings').onclick = () => { state.returnTo = 'pause'; showScreen('settings'); };
    $('#btnResume').onclick = resumeGame;
    $('#btnRestart').onclick = () => { TT.sfx('select'); G.restartMatch(); };
    $('#btnQuit').onclick = () => {
      G.quitToTitle();
      TT.sfx('cancel');
      showScreen('title');
      buildTitleChars();
    };
    $('#btnRematch').onclick = () => {
      TT.sfx('select');
      G.restartMatch();
    };
    $('#btnChange').onclick = () => { TT.sfx('ui'); openSelect(); };
    $('#btnResultsMenu').onclick = () => { G.quitToTitle(); TT.sfx('cancel'); showScreen('title'); };
    $('#selBack').onclick = () => {
      if (state.step > 0) { state.step--; renderSelect(); TT.sfx('cancel'); }
      else { showScreen(state.mode === 'cpu' || state.mode === 'boss' ? 'difficulty' : 'title'); TT.sfx('cancel'); }
    };
    $('#stageBack').onclick = () => { openSelect(); TT.sfx('cancel'); };
    $('#toBattle').onclick = startFight;
    $('#randomPick').onclick = () => {
      const pool = TT.PLAYABLE.filter(id => id !== state.picks[0].id || state.step > 1);
      pickChar(pool[Math.floor(Math.random() * pool.length)]);
    };
    $('#skinBtn').onclick = () => {
      const char = TT.getChar(state.preview.id);
      if (char.skins.length < 2) return;
      state.preview.skin = ((state.preview.skin || 0) + 1) % char.skins.length;
      renderInfo();
      TT.sfx('ui');
    };
    $('#pauseBtn').onclick = togglePause;
    $('#muteBtn').onclick = toggleMute;

    // settings inputs
    const bindRange = (id, key, valId) => {
      const el = $(id);
      el.addEventListener('input', () => {
        settings[key] = +el.value;
        if (valId) $(valId).textContent = el.value;
        applySettings(); saveSettings();
      });
      el.addEventListener('change', () => TT.sfx('ui'));
    };
    bindRange('#setMusic', 'music', '#setMusicVal');
    bindRange('#setSfx', 'sfx', '#setSfxVal');
    bindRange('#setOpacity', 'opacity', '#setOpacityVal');
    bindRange('#setSize', 'size', '#setSizeVal');
    $('#setMute').onchange = e => { settings.muted = e.target.checked; applySettings(); saveSettings(); };
    $('#setShake').onchange = e => { settings.shake = e.target.checked; applySettings(); saveSettings(); };
    $('#setTouch').onchange = e => { settings.touch = e.target.value; applySettings(); saveSettings(); };
    $$('#setQuality button').forEach(b => {
      b.onclick = () => { settings.quality = b.dataset.q; applySettings(); saveSettings(); TT.sfx('ui'); };
    });
    $('#resetSettings').onclick = () => {
      settings = Object.assign({}, DEFAULTS);
      saveSettings(); applySettings(); TT.sfx('select');
    };

    $('#screen-settings').addEventListener('change', () => TT.sfx('ui'));
    window.addEventListener('resize', () => { fitCanvas(); G.resize(); });
    window.addEventListener('orientationchange', () => setTimeout(() => { fitCanvas(); G.resize(); }, 160));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.screen === 'fight' && !G.paused) togglePause();
    });
  }

  /* ------------------------------------------------------------ */
  /* Boot                                                         */
  /* ------------------------------------------------------------ */
  function boot() {
    // phones default to medium so the first match is smooth; desktops get high
    try {
      if (!localStorage.getItem('tt_settings_v1') && isTouchDevice()) settings.quality = 'medium';
    } catch (e) {}
    applySettings();
    G.init($('#game'));
    bindUI();
    bindTouch();
    buildTitleChars();
    fitCanvas();
    previewLoop();
    // idle loop keeps touch UI state (super ready) in sync
    setInterval(() => {
      if (state.screen === 'fight') updateTouchVisibility();
    }, 250);
    applySettings();
  }

  /* Android back button / Escape fallback: never drop straight out of a match. */
  function back() {
    switch (state.screen) {
      case 'fight': togglePause(); return true;
      case 'pause': resumeGame(); return true;
      case 'select': if (state.step > 0) { state.step--; renderSelect(); TT.sfx('cancel'); } else { showScreen(state.mode === 'cpu' || state.mode === 'boss' ? 'difficulty' : 'title'); } return true;
      case 'stage': openSelect(); return true;
      case 'settings': case 'how': showScreen(state.returnTo === 'pause' ? 'pause' : 'title'); return true;
      case 'difficulty': showScreen('title'); return true;
      case 'results': G.quitToTitle(); showScreen('title'); return true;
      default: return false;
    }
  }

  TT.UI = {
    state,
    get settings() { return settings; },
    applySettings, showScreen, openSelect, openDifficulty, startFight, togglePause, renderResults, back
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
