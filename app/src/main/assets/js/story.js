/* TOOKEND TYNDOUT: PRODUCE BRAWL — THE GREAT PRODUCE WAR
   Eight chapters, 24 hand-built encounters, dialogue, progression and an ending. */
(function () {
  'use strict';
  const TT = window.TT;
  const G = TT.Game;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const SAVE_KEY = 'tt_story_v1';

  const WORLDS = [
    {
      id: 'market', name: 'PRODUCE MARKET', chapter: 'CHAPTER 1', sub: 'NIGHT MARKET · AISLE 7',
      arena: 0, accent: '#ffb13c',
      intro: [
        { who: 'lemon', text: 'The market used to smell like fresh peel and cheap lantern oil. Now it smells like rot.' },
        { who: 'tomato', text: 'You are late, Lemon. The Rotten Core already owns this aisle.' },
        { who: 'lemon', text: 'Then I will start here, and take the aisle back one crate at a time.' }
      ],
      battles: [
        { id: 'tomato', name: 'ROTTEN TOMATO', diff: 'easy', taunt: 'Sauce stains, Lemon. Nothing personal.' },
        { id: 'chili', name: 'CHILI THE CORRUPTED', diff: 'normal', taunt: 'I burn hot enough to cook you twice.' },
        { id: 'eggplant', name: 'AISLE WARDEN', diff: 'hard', taunt: 'Nobody leaves aisle seven.' }
      ],
      outro: [
        { who: 'lemon', text: 'The lanterns flicker back on. One aisle free.' },
        { who: 'lemon', text: 'The Core is north. Through the fields.' }
      ]
    },
    {
      id: 'farm', name: 'THE OVERGROWN FARM', chapter: 'CHAPTER 2', sub: 'GREEN FIELDS · OUTER ROWS',
      arena: 0, accent: '#8fe06a',
      intro: [
        { who: 'spud', text: 'You dug yourself out of the market? Respect.' },
        { who: 'lemon', text: 'Help me or step aside, Spud.' },
        { who: 'spud', text: 'The Core took the fields. I have been holding this row alone for weeks.' }
      ],
      battles: [
        { id: 'spud', name: 'CORRUPTED SPUD', diff: 'normal', taunt: 'This field is mine, rind and all.' },
        { id: 'banana', name: 'WILTED BANANA', diff: 'normal', taunt: 'Slippery ground. Watch your footing.' },
        { id: 'onion', name: 'SCARECROW ONION', diff: 'hard', taunt: 'Cry for me, little lemon.' }
      ],
      outro: [
        { who: 'spud', text: 'Row is clear. The Pantry is below us.' },
        { who: 'lemon', text: 'Then we go down.' }
      ]
    },
    {
      id: 'pantry', name: 'THE UNDERGROUND PANTRY', chapter: 'CHAPTER 3', sub: 'COLD STORAGE · LEVEL TWO',
      arena: 2, accent: '#9fe0ff',
      intro: [
        { who: 'onion', text: 'Lights out down here. The shelves move when you are not looking.' },
        { who: 'lemon', text: 'Then we move faster.' }
      ],
      battles: [
        { id: 'onion', name: 'CANNED ONION', diff: 'normal', taunt: 'Peel me and you will only find more layers.' },
        { id: 'blueberry', name: 'FROZEN BLUEBERRY', diff: 'hard', taunt: 'Cold storage suits you.' },
        { id: 'spud', name: 'PANTRY BRUTE', diff: 'hard', taunt: 'Shelf two is a graveyard.' }
      ],
      outro: [
        { who: 'blueberry', text: 'The Core keeps its plans in the Rooftop District. Follow the neon.' }
      ]
    },
    {
      id: 'rooftop', name: 'THE ROOFTOP DISTRICT', chapter: 'CHAPTER 4', sub: 'SUNSET · ABOVE THE AISLE',
      arena: 1, accent: '#ff8a72',
      intro: [
        { who: 'banana', text: 'You climbed all the way up here? The wind alone should have peeled you.' },
        { who: 'lemon', text: 'I have had worse views.' }
      ],
      battles: [
        { id: 'banana', name: 'WINDSWEPT BANANA', diff: 'normal', taunt: 'Mind the railing. Mind me more.' },
        { id: 'lemon', name: 'CORRUPTED LEMON', diff: 'hard', taunt: 'You could have joined us.' },
        { id: 'chili', name: 'SUNSET CHILI', diff: 'expert', taunt: 'Golden hour. Last hour.' }
      ],
      outro: [
        { who: 'lemon', text: 'The Core vent runs into the Kitchen. It is burning.' }
      ]
    },
    {
      id: 'kitchen', name: 'THE BURNING KITCHEN', chapter: 'CHAPTER 5', sub: 'SERVICE LINE · AFTER HOURS',
      arena: 2, accent: '#ffd45c',
      intro: [
        { who: 'chili', text: 'The ovens never went out. The Core likes its food angry.' },
        { who: 'lemon', text: 'Good. So am I.' }
      ],
      battles: [
        { id: 'chili', name: 'CHEF BURNT PEPPER', diff: 'hard', taunt: 'Order up: lemon flambé.' },
        { id: 'tomato', name: 'FRIED TOMATO', diff: 'hard', taunt: 'Hot oil. Hotter tempers.' },
        { id: 'eggplant', name: 'THE SOUS WARDEN', diff: 'expert', taunt: 'Service is closed, citrus.' }
      ],
      outro: [
        { who: 'lemon', text: 'Past the freezer, then the factory. The Core is close.' }
      ]
    },
    {
      id: 'freezer', name: 'THE FROZEN FREEZER', chapter: 'CHAPTER 6', sub: 'COLD STORAGE · LEVEL NINE',
      arena: 2, accent: '#6fc7ff',
      intro: [
        { who: 'blueberry', text: 'It is cold enough in here to crack a rind. You will slow down.' },
        { who: 'lemon', text: 'Everything slows down before I hit it.' }
      ],
      battles: [
        { id: 'blueberry', name: 'FROSTBITE BERRY', diff: 'hard', taunt: 'Freeze first. Fight never.' },
        { id: 'onion', name: 'ICICLE ONION', diff: 'expert', taunt: 'One wrong step, one long fall.' },
        { id: 'banana', name: 'GLACIER PEEL', diff: 'expert', taunt: 'Nothing stays fresh forever.' }
      ],
      outro: [
        { who: 'onion', text: 'The Rotten Factory hums under the freezer. Go quiet.' }
      ]
    },
    {
      id: 'factory', name: 'THE ROTTEN FACTORY', chapter: 'CHAPTER 7', sub: 'PROCESSING LINE · FLOOR ZERO',
      arena: 1, accent: '#c99553',
      intro: [
        { who: 'spud', text: 'They grind produce into paste down here. The machines never stop.' },
        { who: 'lemon', text: 'Tonight they do.' }
      ],
      battles: [
        { id: 'spud', name: 'THE ROTTEN GENERAL', diff: 'hard', taunt: 'The machine eats fighters and makes sausage.' },
        { id: 'eggplant', name: 'CONVEYOR BEAST', diff: 'expert', taunt: 'Next on the line: you.' },
        { id: 'tomato', name: 'PASTE OVERSEER', diff: 'expert', taunt: 'Everything in this room is already dead.' }
      ],
      outro: [
        { who: 'lemon', text: 'The Core is through that door. Nobody comes back from there.' },
        { who: 'lemon', text: 'Let us find out.' }
      ]
    },
    {
      id: 'core', name: 'THE ROTTEN CORE', chapter: 'CHAPTER 8', sub: 'THE HEART OF THE KINGDOM',
      arena: 0, accent: '#ff5b4d',
      intro: [
        { who: 'king', text: 'You walked through my whole kingdom to die here?' },
        { who: 'lemon', text: 'No. I walked through your kingdom to end you.' },
        { who: 'king', text: 'Then kneel, rind and all.' }
      ],
      battles: [
        { id: 'chili', name: 'CORE SHARD: HEAT', diff: 'expert', taunt: 'This is not my kitchen anymore.' },
        { id: 'blueberry', name: 'CORE SHARD: COLD', diff: 'expert', taunt: 'Stay still. Forever.' },
        { id: 'king', name: 'KING TOMATO, THE ROTTEN CORE', diff: 'expert', boss: true, taunt: 'I made this kingdom. I can unmake you.' }
      ],
      outro: [
        { who: 'lemon', text: 'The Crown cracks. The Core goes quiet.' },
        { who: 'king', text: 'The aisle... is yours...' },
        { who: 'lemon', text: 'The kingdom is not mine. It is ours.' }
      ]
    }
  ];

  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { unlocked: 1, cleared: {} };
      const p = JSON.parse(raw);
      return { unlocked: p.unlocked || 1, cleared: p.cleared || {}, ending: !!p.ending };
    } catch (e) { return { unlocked: 1, cleared: {} }; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); } catch (e) {}
  }

  const Story = TT.Story = {
    active: false,
    worlds: WORLDS,
    progress: loadProgress(),
    world: 0,
    battle: 0,
    pendingWin: false,

    start() {
      this.progress = loadProgress();
      this.active = true;
      TT.UI.openStoryMap();
    },

    quit() {
      this.active = false;
      G.quitToTitle();
    },

    isUnlocked(i) {
      if (i === 0) return true;
      const prev = WORLDS[i - 1];
      return (this.progress.cleared[prev.id] || 0) >= prev.battles.length;
    },
    clearedCount(world) { return this.progress.cleared[world.id] || 0; },
    totalCleared() {
      return WORLDS.reduce((n, w) => n + (this.progress.cleared[w.id] || 0), 0);
    },
    totalBattles() { return WORLDS.reduce((n, w) => n + w.battles.length, 0); },

    openWorld(i) {
      if (!this.isUnlocked(i)) { TT.sfx('cancel'); return; }
      this.world = i;
      TT.UI.openStoryWorld(i);
    },

    battleUnlocked(worldIdx, battleIdx) {
      const w = WORLDS[worldIdx];
      return battleIdx <= (this.progress.cleared[w.id] || 0);
    },

    // Play the intro dialogue, then enter the world screen ready for battle one.
    enterWorld(i) {
      const w = WORLDS[i];
      this.world = i;
      this.playDialogue(w.intro, () => TT.UI.openStoryWorld(i));
    },

    playDialogue(lines, done) {
      TT.UI.showStoryTalk(lines, done);
    },

    beginBattle(worldIdx, battleIdx) {
      const w = WORLDS[worldIdx];
      const b = w.battles[battleIdx];
      if (!this.battleUnlocked(worldIdx, battleIdx)) { TT.sfx('cancel'); return; }
      this.world = worldIdx;
      this.battle = battleIdx;
      this.active = true;
      this.playDialogue([{ who: b.id, text: b.taunt }], () => {
        TT.UI.startStoryBattle(w, b);
      });
    },

    onMatchEnd(result) {
      const w = WORLDS[this.world];
      const b = w.battles[this.battle];
      if (!result || !result.p1win) {
        this.playDialogue([
          { who: b.id, text: 'Pathetic. Come back when you can actually fight.' },
          { who: 'lemon', text: 'Again.' }
        ], () => TT.UI.openStoryWorld(this.world));
        return;
      }
      const cleared = this.progress.cleared;
      cleared[w.id] = Math.max(cleared[w.id] || 0, this.battle + 1);
      const finishedWorld = cleared[w.id] >= w.battles.length;
      if (finishedWorld && this.world + 1 >= this.progress.unlocked) {
        this.progress.unlocked = Math.min(WORLDS.length, this.world + 2);
      }
      const finalWin = this.world === WORLDS.length - 1 && finishedWorld;
      if (finalWin) this.progress.ending = true;
      saveProgress(this.progress);
      TT.sfx('win');
      if (finalWin) {
        this.playDialogue(w.outro, () => TT.UI.showStoryEnding());
        return;
      }
      if (finishedWorld) {
        this.playDialogue(w.outro, () => TT.UI.openStoryMap());
        return;
      }
      this.playDialogue([
        { who: b.id, text: 'You got lucky, citrus.' },
        { who: 'lemon', text: 'Next one steps up.' }
      ], () => TT.UI.openStoryWorld(this.world));
    },

    resetProgress() {
      this.progress = { unlocked: 1, cleared: {} };
      saveProgress(this.progress);
    }
  };
})();
