/* TOOKEND TYNDOUT: PRODUCE BRAWL — trophies
   Small, honest progression layer: every unlock is driven by a real gameplay
   event and stored through TT.Save so it survives reinstalls of the page. */
(function () {
  'use strict';
  const TT = window.TT;
  const KEY = 'tt_ach_v1';

  const DEFS = [
    { id: 'first_win', name: 'FIRST BLOOD', desc: 'Win your first match.', target: 1, stat: 'wins' },
    { id: 'sweep', name: 'CLEAN SWEEP', desc: 'Win a match two rounds to zero.', target: 1 },
    { id: 'flawless', name: 'UNTOUCHABLE', desc: 'Win a match without taking a single hit.', target: 1 },
    { id: 'combo10', name: 'TEN OF TEN', desc: 'Land a ten-hit combo.', target: 1 },
    { id: 'super_land', name: 'SUPER CONDUCTOR', desc: 'Land a super attack.', target: 1 },
    { id: 'boss_win', name: 'KING SLAYER', desc: 'Beat King Tomato in Boss Fight.', target: 1 },
    { id: 'chapter_clear', name: 'FIRST AISLE FREED', desc: 'Clear a story chapter.', target: 1 },
    { id: 'campaign', name: 'THE GREAT PRODUCE WAR', desc: 'Finish the story campaign.', target: 1 },
    { id: 'wave10', name: 'PANIC PRO', desc: 'Reach wave 10 in Produce Panic.', target: 10, stat: 'waveBest' },
    { id: 'wave20', name: 'AISLE LEGEND', desc: 'Reach wave 20 in Produce Panic.', target: 20, stat: 'waveBest' },
    { id: 'roster', name: 'FULL ROSTER', desc: 'Win a match with all nine fighters.', target: 9, stat: 'roster' },
    { id: 'century', name: 'GRUDGE COLLECTOR', desc: 'Land 500 hits across all modes.', target: 500, stat: 'hits' }
  ];

  const data = (function () {
    const d = TT.Save.read(KEY, null);
    return {
      unlocked: (d && d.unlocked) || {},
      counters: Object.assign({ wins: 0, hits: 0, waveBest: 0, roster: [] }, (d && d.counters) || {})
    };
  })();

  function persist() { TT.Save.write(KEY, data); }

  function valueOf(def) {
    if (def.stat === 'roster') return data.counters.roster.length;
    if (def.stat) return data.counters[def.stat] || 0;
    return data.unlocked[def.id] ? 1 : 0;
  }

  function checkStat(key) {
    DEFS.forEach(def => {
      if (def.stat === key && !data.unlocked[def.id] && valueOf(def) >= def.target) unlock(def.id);
    });
  }

  function toast(id) {
    const def = DEFS.find(d => d.id === id);
    if (!def || !document.body) return;
    let host = document.getElementById('achToasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'achToasts';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'achToast';
    el.innerHTML = '<b>TROPHY UNLOCKED</b><span>' + def.name + '</span><small>' + def.desc + '</small>';
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 420);
    }, 3200);
  }

  const Ach = TT.Ach = {
    defs: DEFS,
    get unlocked() { return data.unlocked; },
    get counters() { return data.counters; },

    isUnlocked(id) { return !!data.unlocked[id]; },
    count() { return DEFS.filter(d => data.unlocked[d.id]).length; },

    unlock(id) {
      if (data.unlocked[id]) return false;
      data.unlocked[id] = Date.now();
      persist();
      toast(id);
      TT.sfx('select');
      TT.Haptics.buzz([0, 15, 30, 15]);
      return true;
    },

    bump(key, amount) {
      data.counters[key] = (data.counters[key] || 0) + (amount == null ? 1 : amount);
      persist();
      checkStat(key);
    },

    best(key, value) {
      if (value <= (data.counters[key] || 0)) return;
      data.counters[key] = value;
      persist();
      checkStat(key);
    },

    addRoster(id) {
      if (!id || data.counters.roster.indexOf(id) !== -1) return;
      data.counters.roster.push(id);
      persist();
      checkStat('roster');
    },

    reset() {
      data.unlocked = {};
      data.counters = { wins: 0, hits: 0, waveBest: 0, roster: [] };
      persist();
    },

    /* Uses the save store's own recovery path to prove the backup slot works. */
    integrity(key) { return TT.Save.status(key || KEY); },

    renderScreen() {
      const list = document.getElementById('achList');
      if (!list) return;
      const summary = document.getElementById('achSummary');
      if (summary) summary.textContent = this.count() + ' of ' + DEFS.length + ' trophies earned.';
      list.innerHTML = '';
      DEFS.forEach(def => {
        const on = !!data.unlocked[def.id];
        const card = document.createElement('div');
        card.className = 'achCard' + (on ? ' on' : '');
        const cur = Math.min(def.target, valueOf(def));
        const pct = def.target > 1 ? Math.round((cur / def.target) * 100) : (on ? 100 : 0);
        card.innerHTML =
          '<div class="achIcon">' + (on ? '★' : '☆') + '</div>' +
          '<div class="achBody"><b>' + def.name + '</b><span>' + def.desc + '</span>' +
          (def.target > 1 ? '<div class="achBar"><i style="width:' + pct + '%"></i></div>' +
            '<small>' + cur + ' / ' + def.target + '</small>' : '') +
          '</div>';
        list.appendChild(card);
      });
    }
  };
})();
