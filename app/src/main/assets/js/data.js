/* TOOKEND TYNDOUT: PRODUCE BRAWL — game data
   Roster, move sets, arenas, difficulty tuning. All timing in 60Hz frames. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};
  TT.VERSION = '1.0.0';
  TT.TITLE = 'TOOKEND TYNDOUT';
  TT.SUBTITLE = 'PRODUCE BRAWL';
  TT.TAGLINE = 'TINY FRUITS. BIG GRUDGES. ONE PRODUCE AISLE.';

  const baseLight = (o) => Object.assign({
    name: 'JAB', dmg: 5, startup: 4, active: 3, recovery: 9, reach: 64, high: 62,
    kb: 2.6, lift: 0, gain: 6, energy: '#ffe37a', hit: 'spark', sound: 'light'
  }, o || {});
  const baseHeavy = (o) => Object.assign({
    name: 'SMASH', dmg: 13, startup: 12, active: 5, recovery: 19, reach: 82, high: 70,
    kb: 8.5, lift: 2.2, gain: 12, energy: '#ffd166', hit: 'heavy', sound: 'heavy'
  }, o || {});
  const baseAir = (o) => Object.assign({
    name: 'AIR STRIKE', dmg: 9, startup: 5, active: 6, recovery: 8, reach: 70, high: 60,
    kb: 3.2, lift: -1, gain: 7, energy: '#ffe37a', hit: 'spark', sound: 'light'
  }, o || {});

  /* ------------------------------------------------------------------ */
  /* Roster                                                              */
  /* ------------------------------------------------------------------ */
  TT.CHARS = [
    {
      id: 'lemon', name: 'LEMON', title: 'THE ZESTY STRIKER', art: 'hero_lemon',
      hp: 960, walk: 3.55, dash: 9.2, jump: 12.9, weight: 0.9, scale: 1.0, hurtW: 66,
      stats: { POWER: 6, SPEED: 9, JUMP: 8, WEIGHT: 4, REACH: 6 },
      blurb: 'Small, sour and terminally caffeinated. Lemon hits first and asks nothing.',
      quote: 'Squeeze me? I squeeze back.',
      colors: {
        base: '#f6d431', light: '#ffe873', dark: '#c99b0c', rim: '#fff6b8',
        stem: '#3f8f3a', stemLight: '#7cc854', leaf: '#4ea443', eye: '#1a1214', accent: '#ffe14d'
      },
      moves: {
        light: baseLight({ name: 'ZEST JAB', dmg: 5, reach: 66 }),
        light2: baseLight({ name: 'QUICK PEEL', dmg: 6, startup: 3, active: 3, recovery: 10, reach: 62, gain: 7 }),
        heavy: baseHeavy({ name: 'SOUR HOOK', dmg: 13, reach: 86 }),
        air: baseAir({ name: 'CITRUS DROP' }),
        special: {
          name: 'ZEST SHOT', cd: 96, kind: 'projectile', style: 'citrus', dmg: 9, speed: 9.4,
          size: 17, gravity: 0, life: 78, gain: 8, sound: 'citrus', energy: '#ffe14d'
        },
        super: {
          name: 'CITRUS STORM', kind: 'storm', dmg: 7, count: 6, speed: 8.6, size: 20,
          style: 'citrus', energy: '#ffe14d', sound: 'superCitrus'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'GOLDEN', colors: { base: '#ffcf2e', light: '#fff4b0', dark: '#c08a00', rim: '#fffbe0', accent: '#ffe98a' } }
      ]
    },
    {
      id: 'tomato', name: 'TOMATO', title: 'THE HOTHEAD', art: 'char_tomato',
      hp: 1080, walk: 3.1, dash: 8.2, jump: 12.2, weight: 1.08, scale: 1.06, hurtW: 74,
      stats: { POWER: 8, SPEED: 6, JUMP: 6, WEIGHT: 7, REACH: 6 },
      blurb: 'A ripe temper with a leafy crown. Tomato solves every problem with sauce.',
      quote: 'You are about to become ketchup.',
      colors: {
        base: '#e23b38', light: '#ff6b5c', dark: '#a41f26', rim: '#ffb3a2',
        stem: '#3f9a3c', stemLight: '#79cf57', leaf: '#4aa843', eye: '#180f12', accent: '#ff5b4d'
      },
      moves: {
        light: baseLight({ name: 'PULP JAB', dmg: 6, reach: 68 }),
        light2: baseLight({ name: 'SEED UPPER', dmg: 7, startup: 4, active: 3, recovery: 11, reach: 64, lift: 1.2, gain: 8 }),
        heavy: baseHeavy({ name: 'SAUCE UPPER', dmg: 15, startup: 13, recovery: 21, reach: 84, lift: 4.4 }),
        air: baseAir({ name: 'PULP DROP', dmg: 10 }),
        special: {
          name: 'SAUCE BOMB', cd: 108, kind: 'projectile', style: 'sauce', dmg: 12, speed: 7.2,
          size: 22, gravity: 0.19, life: 100, gain: 9, sound: 'sauce', energy: '#ff5646'
        },
        super: {
          name: 'KETCHUP CATASTROPHE', kind: 'burst', dmg: 30, radius: 260,
          style: 'sauce', energy: '#ff4a3d', sound: 'superSauce'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'SPICY', colors: { base: '#c92b1f', light: '#ff7a3c', dark: '#7d1218', rim: '#ffc79a', accent: '#ff8a3c' } }
      ]
    },
    {
      id: 'eggplant', name: 'EGGPLANT', title: 'THE NIGHTSHADE', art: 'char_eggplant',
      hp: 1000, walk: 3.35, dash: 9.6, jump: 12.6, weight: 0.98, scale: 1.02, hurtW: 62,
      stats: { POWER: 7, SPEED: 7, JUMP: 8, WEIGHT: 5, REACH: 7 },
      blurb: 'Glossy, nocturnal and far too confident. Eggplant strikes from the shadows.',
      quote: 'The night is purple. So am I.',
      colors: {
        base: '#7b3fa8', light: '#bb7ae0', dark: '#432063', rim: '#e6c4ff',
        stem: '#3f8c46', stemLight: '#79c968', leaf: '#4b9c50', eye: '#150e1c', accent: '#b06de0'
      },
      moves: {
        light: baseLight({ name: 'SHADE JAB', dmg: 5, reach: 70 }),
        light2: baseLight({ name: 'GLOSS KICK', dmg: 6, startup: 4, active: 3, recovery: 10, reach: 72, gain: 7 }),
        heavy: baseHeavy({ name: 'NIGHT SPIN', dmg: 14, reach: 90, startup: 13 }),
        air: baseAir({ name: 'DUSK DIVE' }),
        special: {
          name: 'NIGHT SHADE', cd: 92, kind: 'projectile', style: 'shade', dmg: 10, speed: 11,
          size: 18, gravity: 0, life: 80, gain: 8, sound: 'shade', energy: '#b06de0'
        },
        super: {
          name: 'BLACKOUT', kind: 'dark', dmg: 9, count: 4, speed: 6.4, size: 26,
          style: 'shade', energy: '#9a4fd6', sound: 'superShade'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'SHADOW', colors: { base: '#4b2569', light: '#7b4aa0', dark: '#24102f', rim: '#c9a2ef', accent: '#7b4aa0' } }
      ]
    },
    {
      id: 'spud', name: 'SPUD', title: 'THE BRICK', art: 'char_spud',
      hp: 1240, walk: 2.55, dash: 7.4, jump: 11.2, weight: 1.32, scale: 1.12, hurtW: 82,
      stats: { POWER: 10, SPEED: 3, JUMP: 3, WEIGHT: 10, REACH: 6 },
      blurb: 'A dirt-grown wall of a vegetable. Spud has never once been knocked down.',
      quote: 'Mash me. I dare you.',
      colors: {
        base: '#a9773f', light: '#c99a5e', dark: '#6d4923', rim: '#e3c190',
        stem: '#7c8f3e', stemLight: '#a8b95c', leaf: '#8ba046', eye: '#1a1310', accent: '#c99553'
      },
      moves: {
        light: baseLight({ name: 'STUB JAB', dmg: 6, reach: 60, startup: 5 }),
        light2: baseLight({ name: 'GROUND POKE', dmg: 7, startup: 5, active: 3, recovery: 12, reach: 58, gain: 8 }),
        heavy: baseHeavy({ name: 'ROOT HAMMER', dmg: 17, startup: 16, recovery: 24, reach: 86, lift: 3.2 }),
        air: baseAir({ name: 'TATER DROP', dmg: 12 }),
        special: {
          name: 'TATER TOSS', cd: 112, kind: 'projectile', style: 'spud', dmg: 14, speed: 6.6,
          size: 24, gravity: 0.22, life: 100, gain: 10, sound: 'spud', energy: '#c99553'
        },
        super: {
          name: 'MASHED', kind: 'quake', dmg: 27, radius: 340, style: 'spud',
          energy: '#c99553', sound: 'superSpud'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'MUDDY', colors: { base: '#7d5a34', light: '#a4784a', dark: '#4a331b', rim: '#c4a375', accent: '#8c663c' } }
      ]
    },
    {
      id: 'banana', name: 'BANANA', title: 'THE LONG REACH', art: 'char_banana',
      hp: 920, walk: 3.6, dash: 9.4, jump: 13.2, weight: 0.82, scale: 1.02, hurtW: 58,
      stats: { POWER: 6, SPEED: 9, JUMP: 9, WEIGHT: 3, REACH: 10 },
      blurb: 'All curve, no brakes. Banana fights at a range that should be illegal.',
      quote: 'Slip away while you still can.',
      colors: {
        base: '#f5d13c', light: '#ffef8d', dark: '#b58c14', rim: '#fff8c9',
        stem: '#6c5a24', stemLight: '#9b8340', leaf: '#4d8f3d', eye: '#1a1510', accent: '#ffe14d'
      },
      moves: {
        light: baseLight({ name: 'LONG POKE', dmg: 5, reach: 92, startup: 5, recovery: 10 }),
        light2: baseLight({ name: 'PEEL WHIP', dmg: 6, reach: 96, startup: 5, active: 3, recovery: 12, gain: 7 }),
        heavy: baseHeavy({ name: 'BANANA BOOMERANG', dmg: 13, reach: 108, startup: 14 }),
        air: baseAir({ name: 'CURVE DIVE', reach: 82 }),
        special: {
          name: 'PEEL OUT', cd: 90, kind: 'projectile', style: 'banana', dmg: 8, speed: 8.2,
          size: 20, gravity: 0.34, life: 96, gain: 8, sound: 'banana', energy: '#ffe14d',
          slip: true
        },
        super: {
          name: 'SLIP STORM', kind: 'peels', dmg: 7, count: 5, style: 'banana',
          energy: '#ffe14d', sound: 'superBanana'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'GOLDEN', colors: { base: '#ffdf3d', light: '#fffbd1', dark: '#c79a08', rim: '#fffef0', accent: '#fff07a' } }
      ]
    },
    {
      id: 'chili', name: 'CHILI', title: 'THE BLAZE', art: 'boss_chili',
      hp: 940, walk: 3.7, dash: 10.2, jump: 12.4, weight: 0.84, scale: 1.02, hurtW: 60,
      stats: { POWER: 8, SPEED: 9, JUMP: 7, WEIGHT: 3, REACH: 5 },
      blurb: 'Pure capsicum aggression. Chili closes the gap and sets it on fire.',
      quote: 'Some like it hot. You will not.',
      colors: {
        base: '#d92c1c', light: '#ff7a34', dark: '#8c140c', rim: '#ffc08a',
        stem: '#3f8c38', stemLight: '#74c95a', leaf: '#4b9c3f', eye: '#1a0d0a', accent: '#ff8a3d'
      },
      moves: {
        light: baseLight({ name: 'SPICE JAB', dmg: 5, reach: 62 }),
        light2: baseLight({ name: 'EMBER KICK', dmg: 6, startup: 3, active: 3, recovery: 10, reach: 66, gain: 7 }),
        heavy: baseHeavy({ name: 'SCORCH UPPER', dmg: 14, startup: 11, recovery: 20, reach: 78, lift: 3.8 }),
        air: baseAir({ name: 'FLARE DIVE', dmg: 10 }),
        special: {
          name: 'FLAME BURST', cd: 88, kind: 'projectile', style: 'chili', dmg: 11, speed: 10,
          size: 19, gravity: 0, life: 70, gain: 8, sound: 'chili', energy: '#ff8a3d'
        },
        super: {
          name: 'INFERNO', kind: 'pillars', dmg: 9, count: 4, style: 'chili',
          energy: '#ff6a1f', sound: 'superChili'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'INFERNO', colors: { base: '#b8170d', light: '#ff9a2e', dark: '#5e0904', rim: '#ffd27a', accent: '#ffa23c' } }
      ]
    },
    {
      id: 'onion', name: 'ONION', title: 'THE WATERWORKS', art: 'char_onion',
      hp: 1020, walk: 3.0, dash: 8.0, jump: 12.0, weight: 1.0, scale: 1.04, hurtW: 70,
      stats: { POWER: 7, SPEED: 5, JUMP: 6, WEIGHT: 6, REACH: 8 },
      blurb: 'Sensitive, layered and absolutely sobbing. Onion wins fights through tears.',
      quote: 'I am not crying, YOU are crying.',
      colors: {
        base: '#f0d9b8', light: '#fff3df', dark: '#c9a97c', rim: '#fffaf0',
        stem: '#4d9a45', stemLight: '#8ad46a', leaf: '#5aa84e', eye: '#191310', accent: '#ffe6c0'
      },
      moves: {
        light: baseLight({ name: 'SNIFF JAB', dmg: 5, reach: 64 }),
        light2: baseLight({ name: 'LAYER SLAP', dmg: 6, startup: 4, active: 3, recovery: 11, reach: 66, gain: 7 }),
        heavy: baseHeavy({ name: 'SOB SWING', dmg: 13, reach: 84, startup: 13 }),
        air: baseAir({ name: 'TEAR DIVE' }),
        special: {
          name: 'TEAR DROP', cd: 104, kind: 'projectile', style: 'onion', dmg: 11, speed: 6.2,
          size: 24, gravity: 0.04, life: 104, gain: 9, sound: 'onion', energy: '#9fe0ff'
        },
        super: {
          name: 'SOB STORY', kind: 'wave', dmg: 10, count: 3, style: 'onion',
          energy: '#9fe0ff', sound: 'superOnion'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'CRYSTAL', colors: { base: '#cfe3f2', light: '#ffffff', dark: '#9ab6cc', rim: '#ffffff', accent: '#d6f0ff' } }
      ]
    },
    {
      id: 'blueberry', name: 'BLUEBERRY', title: 'THE POCKET ROCKET', art: 'char_blueberry',
      hp: 860, walk: 4.15, dash: 11.4, jump: 13.6, weight: 0.62, scale: 0.86, hurtW: 48,
      stats: { POWER: 4, SPEED: 10, JUMP: 10, WEIGHT: 1, REACH: 3 },
      blurb: 'The smallest thing in the aisle and the fastest thing in the world.',
      quote: 'Blink and you have already lost.',
      colors: {
        base: '#4257b8', light: '#8093e8', dark: '#26306e', rim: '#c3ccff',
        stem: '#3f6d3c', stemLight: '#6fa66a', leaf: '#4c8a46', eye: '#0f1020', accent: '#7f92ff'
      },
      moves: {
        light: baseLight({ name: 'PIP JAB', dmg: 4, reach: 52, startup: 3, recovery: 8 }),
        light2: baseLight({ name: 'BERRY BUMP', dmg: 5, startup: 2, active: 3, recovery: 9, reach: 54, gain: 7 }),
        heavy: baseHeavy({ name: 'POCKET ROCKET', dmg: 12, startup: 10, recovery: 18, reach: 70, kb: 10, lift: 2.6 }),
        air: baseAir({ name: 'BOLT DROP', dmg: 8 }),
        special: {
          name: 'BLUE BOLT', cd: 78, kind: 'projectile', style: 'blueberry', dmg: 8, speed: 13.5,
          size: 13, gravity: 0, life: 60, gain: 7, sound: 'blueberry', energy: '#7f92ff'
        },
        super: {
          name: 'BLUE SCREEN', kind: 'beam', dmg: 28, style: 'blueberry',
          energy: '#7f92ff', sound: 'superBlueberry'
        }
      },
      skins: [
        { name: 'CLASSIC', colors: {} },
        { name: 'NEON', colors: { base: '#2f4fe0', light: '#96f0ff', dark: '#1a2a8c', rim: '#d6fbff', accent: '#66f0ff' } }
      ]
    },
    {
      id: 'king', name: 'KING TOMATO', title: 'THE FINAL BOSS', art: 'boss_king_tomato',
      hp: 1500, walk: 2.8, dash: 8.6, jump: 11.8, weight: 1.5, scale: 1.42, hurtW: 100,
      stats: { POWER: 10, SPEED: 5, JUMP: 5, WEIGHT: 10, REACH: 8 },
      blurb: 'Sovereign of the produce aisle. He has never lost, and he intends to keep it that way.',
      quote: 'Kneel, or be pureed.',
      boss: true,
      colors: {
        base: '#c9242c', light: '#ff5b4e', dark: '#7d0f1c', rim: '#ffb3a2',
        stem: '#3f9a3c', stemLight: '#7fd35b', leaf: '#4aa843', eye: '#160a0d', accent: '#ffd25a',
        gold: '#efc04a', goldLight: '#fff0a8', goldDark: '#a97a12'
      },
      moves: {
        light: baseLight({ name: 'ROYAL JAB', dmg: 6, reach: 78, gain: 8 }),
        light2: baseLight({ name: 'SCEPTER SWAT', dmg: 8, reach: 84, gain: 9 }),
        heavy: baseHeavy({ name: 'CROWN CRASH', dmg: 17, reach: 100, startup: 15, recovery: 23, lift: 3.4 }),
        air: baseAir({ name: 'ROYAL DROP', dmg: 12 }),
        special: {
          name: 'ROYAL SAUCE', cd: 100, kind: 'projectile', style: 'royal', dmg: 14, speed: 8.0,
          size: 26, gravity: 0.1, life: 96, gain: 9, sound: 'royal', energy: '#ffd25a'
        },
        super: {
          name: 'THRONE CRUSH', kind: 'crown', dmg: 36, radius: 320, style: 'royal',
          energy: '#ffd25a', sound: 'superRoyal'
        }
      },
      skins: [{ name: 'ROYAL', colors: {} }]
    }
  ];

  TT.getChar = function (id) {
    return TT.CHARS.filter(function (c) { return c.id === id; })[0] || TT.CHARS[0];
  };
  TT.PLAYABLE = TT.CHARS.filter(function (c) { return !c.boss; }).map(function (c) { return c.id; });

  /* ------------------------------------------------------------------ */
  /* Arenas                                                              */
  /* ------------------------------------------------------------------ */
  TT.ARENAS = [
    {
      id: 'market', name: 'PRODUCE MARKET', subtitle: 'NIGHT MARKET · AISLE 7', draw: 'market',
      width: 1560, floor: 462, music: { tempo: 122, root: 45, mode: 'dorian', style: 'market' },
      blurb: 'Lantern light, striped awnings and a suspicious amount of cabbage.'
    },
    {
      id: 'rooftop', name: 'ROOFTOP', subtitle: 'SUNSET · ABOVE THE AISLE', draw: 'rooftop',
      width: 1620, floor: 458, music: { tempo: 116, root: 43, mode: 'minor', style: 'rooftop' },
      blurb: 'Golden hour, cold wind and a very unsafe railing.'
    },
    {
      id: 'kitchen', name: 'THE KITCHEN', subtitle: 'SERVICE LINE · AFTER HOURS', draw: 'kitchen',
      width: 1520, floor: 466, music: { tempo: 132, root: 41, mode: 'phrygian', style: 'kitchen' },
      blurb: 'Boiling pots, open flame and absolutely no supervision.'
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Difficulty                                                          */
  /* ------------------------------------------------------------------ */
  TT.DIFFICULTY = {
    easy: {
      key: 'easy', name: 'EASY', reaction: 26, aggression: 0.32, block: 0.14, combo: 0.15,
      jump: 0.10, special: 0.10, super: 0.25, retreat: 0.20, dash: 0.06, punish: 0.15
    },
    normal: {
      key: 'normal', name: 'NORMAL', reaction: 17, aggression: 0.52, block: 0.34, combo: 0.4,
      jump: 0.18, special: 0.24, super: 0.5, retreat: 0.32, dash: 0.22, punish: 0.4
    },
    hard: {
      key: 'hard', name: 'HARD', reaction: 11, aggression: 0.7, block: 0.58, combo: 0.68,
      jump: 0.24, special: 0.4, super: 0.75, retreat: 0.42, dash: 0.45, punish: 0.68
    },
    expert: {
      key: 'expert', name: 'EXPERT', reaction: 7, aggression: 0.86, block: 0.8, combo: 0.9,
      jump: 0.3, special: 0.55, super: 1, retreat: 0.5, dash: 0.68, punish: 0.9
    }
  };

  /* ------------------------------------------------------------------ */
  /* Gameplay tuning                                                     */
  /* ------------------------------------------------------------------ */
  TT.TUNE = {
    GRAVITY: 0.62,
    AIR_DRAG: 0.985,
    GROUND_FRICTION: 0.72,
    DASH_FRAMES: 15,
    DASH_COOLDOWN: 26,
    METER_MAX: 100,
    METER_PASSIVE: 0.05,
    METER_ON_HIT: 0.55,
    METER_ON_BLOCK: 0.22,
    ROUND_TIME: 60,
    ROUNDS_TO_WIN: 2,
    DAMAGE: 3,
    HITSTOP_LIGHT: 4,
    HITSTOP_HEAVY: 8,
    HITSTOP_SUPER: 12,
    COMBO_WINDOW: 62,
    MAX_COMBO_SCALE: 0.42
  };
})();
