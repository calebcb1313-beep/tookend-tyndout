/* TOOKEND TYNDOUT: PRODUCE BRAWL — persistence + haptics
   Versioned, checksummed, dual-slot saves so a torn write or a corrupted
   localStorage entry can never wipe campaign progress. */
(function () {
  'use strict';
  const TT = window.TT = window.TT || {};

  /* FNV-1a over the serialized payload: cheap integrity check, not security. */
  function checksum(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  const Save = TT.Save = {
    VERSION: 1,

    _raw(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },

    /* Returns the payload, or undefined when missing/corrupt. Accepts both the
       wrapped { v, t, d, c } format and legacy plain-JSON values. */
    _parse(raw) {
      if (!raw) return undefined;
      let obj;
      try { obj = JSON.parse(raw); } catch (e) { return undefined; }
      if (obj && typeof obj === 'object' && obj.v === this.VERSION && 'd' in obj) {
        if (obj.c && obj.c !== checksum(JSON.stringify(obj.d))) return undefined;
        return obj.d;
      }
      return obj;
    },

    /* primary slot -> backup slot -> default. */
    read(key, fallback) {
      const primary = this._parse(this._raw(key));
      if (primary !== undefined && primary !== null) return primary;
      const backup = this._parse(this._raw(key + '~bak'));
      if (backup !== undefined && backup !== null) return backup;
      return fallback;
    },

    write(key, data) {
      const wrapped = JSON.stringify({
        v: this.VERSION, t: Date.now(), d: data, c: checksum(JSON.stringify(data))
      });
      try {
        const current = this._raw(key);
        if (current && this._parse(current) !== undefined) {
          localStorage.setItem(key + '~bak', current);
        }
        localStorage.setItem(key, wrapped);
        return true;
      } catch (e) { return false; }
    },

    remove(key) {
      try { localStorage.removeItem(key); localStorage.removeItem(key + '~bak'); } catch (e) {}
    },

    /* Diagnostics for the settings screen / QA. */
    status(key) {
      const primary = this._parse(this._raw(key)) !== undefined;
      const backup = this._parse(this._raw(key + '~bak')) !== undefined;
      return { key: key, primary: primary, backup: backup };
    }
  };

  /* ------------------------------------------------------------ */
  /* Haptics — short, capped patterns; silently absent on devices  */
  /* without a vibrator or with the setting switched off.          */
  /* ------------------------------------------------------------ */
  const Haptics = TT.Haptics = {
    enabled: true,
    _last: 0,

    setEnabled(on) { this.enabled = !!on; if (!on) this.stop(); },

    stop() {
      try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {}
    },

    buzz(pattern) {
      if (!this.enabled) return;
      const now = Date.now();
      // never let a dense combo turn into a continuous rumble
      if (now - this._last < 45) return;
      this._last = now;
      try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
    },

    hit(kind) {
      switch (kind) {
        case 'block': this.buzz(6); break;
        case 'light': case 'special': this.buzz(9); break;
        case 'heavy': this.buzz(16); break;
        case 'super': this.buzz([0, 18, 20, 26]); break;
        case 'ko': this.buzz([0, 40, 40, 70]); break;
        default: this.buzz(8);
      }
    }
  };
})();
