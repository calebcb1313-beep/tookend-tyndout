# Google Play release package — TOOKEND TYNDOUT: PRODUCE BRAWL

Status: **release candidate built, NOT submitted and NOT published.** Everything below is
either verified in this repository or explicitly marked as remaining.

## Identity

| Field | Value |
|---|---|
| Package name | `com.tookendtyndout.rootbound` |
| Version name / code | 1.4.0 / 12 |
| Category | Games → Action (single player, offline) |
| Price | Free, no ads, no in-app purchases |
| Content rating | Everyone / PEGI 3 — cartoon slapstick combat, no blood, no language |
| Target SDK | 35 (Android 15), min SDK per `app/build.gradle` |
| Permissions | `android.permission.VIBRATE` only. No INTERNET permission. |
| Artifacts | `Tookend-Tyndout-Produce-Brawl-1.4.0.aab` (upload), `…1.4.0.apk` (sideload/testing) |

## Store text

**Title (≤30 chars):** TOOKEND TYNDOUT: Produce Brawl

**Short description (≤80 chars):**
Nine furious fruits. Story campaign, endless panic waves, local versus.

**Full description:**

> TINY FRUITS. BIG GRUDGES. ONE PRODUCE AISLE.
>
> The Rotten Core has taken the Produce Kingdom. Fight through eight chapters of the
> Great Produce War, free every aisle, and decide what happens to the king who started it.
>
> • STORY CAMPAIGN — 24 authored fights across the market, farm, pantry, rooftop,
>   kitchen, freezer and factory, with dialogue, branching decisions and two endings.
> • PRODUCE PANIC — endless waves, five enemy types plus elites, a boss every fifth wave,
>   sixteen stackable upgrades, coin rerolls and five difficulties.
> • NINE FIGHTERS — Lemon, Tomato, Eggplant, Spud, Banana, Chili, Onion, Blueberry and
>   King Tomato, each with their own moves, supers and CPU personality.
> • LOCAL VERSUS — two players on one device, best of three.
> • BOSS FIGHT — a three-phase King Tomato with escalating royal rage.
> • TRAINING — an unkillable dummy, free supers, live damage numbers.
> • TWELVE TROPHIES, haptics, adjustable audio, three graphics tiers and adaptive
>   resolution that keeps slow phones smooth.
>
> No ads. No accounts. No internet needed. Plays fully offline.

## Data safety answers (as implemented)

- No data collected, no data shared, no analytics SDK, no advertising ID.
- No account creation and no network calls: the APK has no INTERNET permission.
- Progress, trophies and settings are stored locally on the device only.
- Data deletion: uninstalling the app removes all local data.

## Assets

| Asset | Requirement | State |
|---|---|---|
| App icon | 512×512 PNG | `app/src/main/assets/icon-512.png` (plus legacy/adaptive mipmaps) |
| Feature graphic | 1024×500 | **Remaining** — not produced |
| Phone screenshots | 2–8, 16:9 or 9:16, ≥320 px | `artifacts/story-map.png`, `story-world.png`, `story-choice.png`, `trophies.png`, `settings-1.3.png`, `panic-fight.png`, `panic-upgrade.png` |
| Tablet screenshots | optional | **Remaining** |
| Promo video | optional | Not produced |

Screenshots above are real captures of this build; they are browser-resolution and should
be re-captured at 1080p landscape on device hardware before upload.

## Submission checklist

| Item | State |
|---|---|
| Signed release APK | Done — `apksigner verify` passes |
| Signed AAB | Done — `jarsigner -verify` passes |
| Version code incremented | Done — 12 |
| Package id stable across releases | Done — unchanged since 1.0.0 |
| Permissions minimal | Done — VIBRATE only |
| Offline gameplay | Done — no network permission |
| Privacy policy | Not required under current answers (no data collected), but Play Console still asks for a data safety form |
| Content rating questionnaire | Answers prepared above; form not submitted |
| Store listing text | Prepared above |
| Feature graphic | **Remaining** |
| Play Console developer account | **Remaining** (requires account + one-time fee) |
| Play App Signing / upload key | **Remaining** — the AAB is signed with the project's release keystore; Play Console would either register that key or issue a Play signing key |
| Internal testing track upload | **Remaining** — needs the account |
| Physical-device test pass | **Remaining** — this environment has no Android hardware |

Nothing in this file claims the app has been submitted, reviewed or published. It has not.
