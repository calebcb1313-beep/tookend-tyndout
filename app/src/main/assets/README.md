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
