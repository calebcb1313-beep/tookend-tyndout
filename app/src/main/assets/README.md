# TOOKEND TYNDOUT: PRODUCE BRAWL

A self-contained cartoon fighting game. Nine produce fighters, three arenas, four CPU difficulties,
local two-player, a boss fight and a training room — all rendered procedurally on a canvas, with a
synthesized soundtrack and no external assets.

## Play

Open `index.html` in a modern browser, or install the signed APK in this repository's releases.

Android build: the same assets are bundled in `app/src/main/assets` and loaded offline by a
full-screen landscape WebView.

## Controls

**Player 1** — A/D move, W jump, S crouch, J light, K heavy, L special, I super, U guard.
Double-tap A or D to dash. Escape pauses.

**Player 2** — Arrow keys move and jump, Numpad 1/2/3 attacks, 0 super, 5 guard
(or `,` `.` `/` `;` `'` without a numpad).

**Touch** — left directional pad, plus JUMP, LIGHT, HEAVY, SPECIAL, SUPER and GUARD buttons.
Multi-touch is supported, so you can jump and attack together. Button size and opacity are
adjustable in Settings.

## Modes

- **1 Player** — best of three against the CPU on Easy, Normal, Hard or Expert.
- **2 Players** — local versus on one device.
- **Boss Fight** — King Tomato, with three escalating phases.
- **Training** — an unkillable dummy, free supers and live damage numbers.

## Systems

- Light attacks chain into light/heavy/special; damage scales down through long combos.
- Guard blocks high and low but takes chip damage.
- Supers need a full meter and play character-specific cinematic attacks.
- Three rounds, 60 seconds each; when time runs out the healthier fighter takes the round.
- Settings (audio, quality, shake, touch controls) persist in local storage.

## Included

- Nine fighters: Lemon, Tomato, Eggplant, Spud, Banana, Chili, Onion, Blueberry and King Tomato.
- Three layered, animated arenas: Produce Market, Rooftop and The Kitchen.
- Alternate palettes ("skins") selectable on the character screen.
- Procedural character art with per-material skin textures, expressions and full animation poses.
- Pooled particle effects, impact freezes, camera shake and KO slow motion.
- WebAudio soundtrack with per-arena themes and per-character sound design.
- Service worker for offline play when hosted over HTTPS.

The APK is built by the GitHub Actions workflow at `.github/workflows/android-apk.yml`.

## Story campaign

The Great Produce War runs eight chapters of three fights each (24 encounters) through
Produce Market, The Overgrown Farm, The Underground Pantry, The Rooftop District, The
Burning Kitchen, The Frozen Freezer, The Rotten Factory and The Rotten Core. Each world
opens with dialogue, each battle is gated by the previous one, progress and the ending
are saved, and the final fight is King Tomato. Worlds replay freely once cleared.

## Produce Panic

Endless waves with auto-fire, five enemy archetypes plus elites, a boss every fifth
wave, XP gems, coins, sixteen stacked upgrades with coin rerolls and five difficulties.
Best wave per difficulty is saved.

## Trophies and haptics

Twelve trophies unlock from real events and appear as toasts plus a Trophies screen.
Vibration can be switched off in Settings (Android VIBRATE permission).

## Saves

Progress is versioned, checksummed and mirrored to a backup key. If the primary entry is
corrupted, the previous good state is loaded instead of resetting. Campaign, panic
records, trophies and settings all persist offline.

## Known limitations

- Rendering is a 2D canvas inside a WebView, not a 3D engine; there are no 3D models.
- The story is told on dedicated screens around fights, not as explorable platforming levels.
- No online multiplayer, no accounts, no cloud save.
- The AAB is signed and release-ready but has not been submitted to Google Play.
- Verified in a desktop browser and by inspecting the built APK/AAB; not yet installed on
  physical Android hardware from this environment.
