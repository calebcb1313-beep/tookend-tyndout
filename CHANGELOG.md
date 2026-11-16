# Changelog

## 1.4.0 — versionCode 12

- **Branching campaign:** clearing The Underground Pantry asks whether to free the
  prisoners or seal it, and the answer returns as extra dialogue in chapter seven.
- **Two endings:** the King Tomato finale is a real choice — spare him for *The Aisle Is
  Free*, or take the crown for *The New Crown*, each with its own epilogue, saved
  decision and a TWO CROWNS trophy for reaching both.
- **Reduced Motion:** a settings toggle that disables screen shake and full-screen
  flashes at the effects layer, so gameplay and timing are untouched.
- **Adaptive resolution:** when the device cannot hold frame rate at the chosen quality,
  the internal render resolution steps down (floor 70%) instead of dropping frames.
  Measured on a software renderer: 40.9 → 51.5 fps at high quality.
- **Fixed:** progress objects created before 1.4.0 threw when a chapter was cleared
  (missing choices field), and counter-based trophies called an undefined function, so
  wave/roster/ending trophies could never unlock. Both found by tests, both fixed.

## 1.3.0 — versionCode 11

- **Trophies:** twelve achievements driven by real gameplay (first win, clean sweep,
  flawless match, ten-hit combo, super hit, boss clear, story chapter, campaign,
  panic waves 10/20, full roster, 500 hits), with unlock toasts and a Trophies screen.
- **Haptics:** vibration on hits, blocks, supers and KOs, capped so dense combos do not
  rumble continuously, with a settings toggle and the Android VIBRATE permission.
- **CPU personalities:** every fighter now has its own behaviour multipliers on top of
  the difficulty preset — Chili rushes, Eggplant turtles, Onion zones, Banana jumps in,
  Spud brawls, Blueberry darts, King Tomato pressures.
- **Save integrity:** saves are versioned, checksummed and mirrored to a backup slot.
  A corrupted or torn write recovers the last good campaign state instead of wiping it.
  Settings, story progress, panic records and trophies all use the same store.
- **Touch reliability:** cancelled pointers (calls, gesture interruption, app switch)
  clear held buttons so nothing stays stuck down.
- **AAB:** `bundleRelease` is now built, signed and published next to the APK.

## 1.2.0 — versionCode 10

- Eight-chapter story campaign, The Great Produce War: 24 fights across market, farm,
  pantry, rooftop, kitchen, freezer, factory and the Rotten Core, with dialogue,
  locked chapter progression, saved progress and a King Tomato finale.
- Holding the light button chains attacks instead of requiring repeated taps.
- Survival renderer caching: prebuilt glow sprites instead of per-frame gradients.

## 1.1.0 — versionCode 9

- Produce Panic wave survival: five enemy archetypes, elites, boss every fifth wave,
  XP, coins, sixteen upgrades with rerolls, five difficulties, saved best waves.
- Fixed projectile specials never ending, the CPU never attacking, and low damage.

## 1.0.0 — versionCode 3

- First signed Android release of the canvas fighting game: nine fighters, three
  arenas, four CPU difficulties, local two-player, boss fight and training.
