/* TOOKEND TYNDOUT: PRODUCE BRAWL — meta progression
   The session-to-session loop: fights pay Produce Cred and XP, XP raises the
   account level, and Cred buys permanent (capped, non-pay-to-win) upgrades.
   Formulas are documented in docs/GDD.md. */
(function () {
  'use strict';
  const TT = window.TT;
  const KEY = 'tt_meta_v1';

  const UPGRADES = [
    { id: 'vitality', name: 'TOUGH RIND', desc: '+8% max health per rank', base: 120, max: 5 },
    { id: 'power', name: 'HEAVY HAND', desc: '+5% damage per rank', base: 150, max: 5 },
    { id: 'meter', name: 'FAST FLOW', desc: 'Start each round with +10 meter', base: 100, max: 5 },
    { id: 'fortune', name: 'GOOD MARKET', desc: '+6% Produce Cred earned', base: 110, max: 5 }
  ];

  const DEFAULT = { level: 1, xp: 0, cred: 0, ranks: {}, bought: 0 };

  function load() {
    const d = TT.Save.read(KEY, null);
    if (!d || typeof d !== 'object') return Object.assign({}, DEFAULT, { ranks: {} });
    return {
      level: d.level || 1,
      xp: d.xp || 0,
      cred: d.cred || 0,
      ranks: d.ranks && typeof d.ranks === 'object' ? d.ranks : {},
      bought: d.bought || 0
    };
  }

  const data = load();
  const persist = () => TT.Save.write(KEY, data);

  /* Curve: XP to go from level L to L+1. Level 1->2 = 90, 5->6 = 793, 10->11 = 2037. */
  const xpNeed = level => Math.round(90 * Math.pow(level, 1.35));
  /* Geometrically growing sink so late ranks stay meaningful. */
  const costOf = (base, rank) => Math.round(base * Math.pow(1.55, rank));
  /* Each rank is gated by the account level: ranks unlock at 1, 3, 5, 7, 9. */
  const levelGate = rank => 1 + rank * 2;

  function rankOf(id) { return data.ranks[id] || 0; }

  const Meta = TT.Meta = {
    UPGRADES,
    xpNeed,
    costOf,
    levelGate,
    get data() { return data; },
    get level() { return data.level; },
    get cred() { return data.cred; },
    get xp() { return data.xp; },

    rankOf,
    cost(id) {
      const up = UPGRADES.find(u => u.id === id);
      return up ? costOf(up.base, rankOf(id)) : 0;
    },
    isMax(id) {
      const up = UPGRADES.find(u => u.id === id);
      return !!up && rankOf(id) >= up.max;
    },
    canBuy(id) {
      const up = UPGRADES.find(u => u.id === id);
      if (!up) return { ok: false, reason: 'Unknown upgrade' };
      if (rankOf(id) >= up.max) return { ok: false, reason: 'Maxed' };
      if (data.level < levelGate(rankOf(id))) return { ok: false, reason: 'Needs level ' + levelGate(rankOf(id)) };
      if (data.cred < this.cost(id)) return { ok: false, reason: 'Not enough cred' };
      return { ok: true };
    },

    buy(id) {
      const check = this.canBuy(id);
      if (!check.ok) return check;
      data.cred -= this.cost(id);
      data.ranks[id] = rankOf(id) + 1;
      data.bought++;
      persist();
      TT.sfx('select');
      if (TT.Ach) {
        TT.Ach.unlock('first_upgrade');
        TT.Ach.best('upgradesBought', data.bought);
      }
      return { ok: true, rank: data.ranks[id] };
    },

    hpMul() { return 1 + 0.08 * rankOf('vitality'); },
    dmgMul() { return 1 + 0.05 * rankOf('power'); },
    startMeter() { return 10 * rankOf('meter'); },
    credMul() { return 1 + 0.06 * rankOf('fortune'); },

    addCred(n) {
      const gain = Math.max(0, Math.round(n * this.credMul()));
      data.cred += gain;
      persist();
      return gain;
    },

    addXp(n) {
      const gain = Math.max(0, Math.round(n));
      data.xp += gain;
      let levels = 0;
      while (data.xp >= xpNeed(data.level) && data.level < 40) {
        data.xp -= xpNeed(data.level);
        data.level++;
        levels++;
      }
      persist();
      if (levels && TT.Ach) TT.Ach.best('level', data.level);
      return { xp: gain, levels: levels };
    },

    /* Payout for a finished arena match. Training pays nothing by design. */
    grant(res) {
      if (!res || res.mode === 'training' || res.survival) return { cred: 0, xp: 0, levels: 0 };
      const tier = { easy: 1, normal: 2, hard: 3, expert: 4 }[res.difficulty] || 2;
      const rounds = Math.max(0, res.rounds || 0);
      let cred = res.win ? 40 + 10 * tier + 12 * rounds : 12 + 4 * rounds;
      let xp = res.win ? 60 + 10 * tier + 8 * rounds : 20;
      if (res.boss && res.win) { cred += 60; xp += 40; }
      const credGain = this.addCred(cred);
      const xpGain = this.addXp(xp);
      return { cred: credGain, xp: xpGain.xp, levels: xpGain.levels, tier: tier };
    },

    /* Applied to the player fighter only. CPU opponents never get these. */
    applyTo(f) {
      if (!f || f.side !== 'p1') return f;
      const mult = this.hpMul();
      if (mult !== 1) {
        f.maxHp = Math.round(f.maxHp * mult);
        f.hp = f.maxHp;
      }
      f.metaMeter = this.startMeter();
      f.meter = Math.max(f.meter, f.metaMeter);
      return f;
    },

    reset() {
      data.level = 1; data.xp = 0; data.cred = 0; data.ranks = {}; data.bought = 0;
      persist();
    }
  };
})();
