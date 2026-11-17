# GDD — TOOKEND TYNDOUT: PRODUCE BRAWL
### Progression, economy and loop design (game-mechanics-designer framework)

## 1. Core loop

**Atomic unit (second to second).** Read the opponent → hold space or guard → confirm a
light into heavy/special → bank meter → spend meter on a character super. Every input has
a visible, audible and haptic answer: hitstop, spray particles, damage number, controller
buzz. The loop is short enough that a mistake is recoverable within one round.

**Match loop (2–3 minutes).** Best of three, 60-second rounds, damage scaling so a combo
cannot run forever. Win or lose, the match pays out — losing still pays a consolation so a
bad session is never zero progress.

**Session loop (10–30 minutes).** Story chapters (3 fights each), a boss attempt, or a
Produce Panic run. Each session ends with Produce Cred and XP on screen.

**Meta loop (days).** Cred buys permanent, capped upgrades; XP raises the account level,
which gates the next rank of each upgrade. Story progress and trophies persist independently.

```
Fight → earn Cred + XP → level up (unlocks rank) → buy upgrade → fight better → higher difficulty pays more
```

## 2. Mechanics → Dynamics → Aesthetics (MDA)

| Mechanic | Dynamic | Aesthetic |
|---|---|---|
| Light chain + combo scaling | Players learn confirms instead of mashing | Competence, mastery |
| Guard with chip damage | Turtling is punished slowly, not instantly | Tension, risk |
| Super meter (passive + on hit/taken) | Meter becomes a comeback currency | Drama, release |
| Best-of-three rounds | A loss is a setback, not an ending | Persistence, flow |
| Produce Cred payouts (win and loss) | Continued play always advances the meta | Progress, ownership |
| Rank gates by account level | Upgrades arrive in a paced trickle | Anticipation |
| Fortune upgrade (+Cred%) | Players who invest earn the next upgrade faster | Snowball without runaway |
| Story choices (pantry, crown) | Decisions create two endings | Authorship |
| Adaptive resolution | Frame rate holds instead of stuttering | Comfort, trust |
| Haptics + hitstop | Hits feel physical | Impact, satisfaction |

## 3. Player psychology (Bartle)

- **Achievers (primary).** 15 trophies, 24 story fights, two endings, rank pips, account
  level, best-wave-per-difficulty. The progression screen is built for them.
- **Killers (secondary).** Local versus, boss phases, survival elites; the CPU now has
  per-fighter personalities so duels read differently.
- **Explorers (tertiary).** Eight distinct chapter locations, branching dialogue, hidden
  ending variant. No open world — deliberately out of scope.
- **Socializers (minimal).** Local two-player only. No accounts, chat or online play.

Flow-state design: difficulty presets move reaction time and aggression, not hidden damage
multipliers, so a loss reads as "I was too slow" rather than "the game cheated".

## 4. Economy

### Sources

| Source | Produce Cred | XP |
|---|---|---|
| Arena win | `40 + 10×tier + 12×rounds won` (tier: easy 1 … expert 4) | `60 + 10×tier + 8×rounds` |
| Arena loss | `12 + 4×rounds won` | 20 |
| Boss win bonus | +60 | +40 |
| Story fight, first clear | +50 | — (match payout already applies) |
| Produce Panic, per wave | `3` (+10 on boss waves) | 5 |
| Training | 0 (by design — no farming the dummy) | 0 |

Worked examples: normal 2-0 win = **84 Cred / 96 XP**; expert 2-0 = 104 / 116; losing 0-2
= 12 / 20.

### Sinks

Four permanent upgrades, five ranks each, geometric cost:

```
cost(rank) = round(base × 1.55 ^ rank)
```

| Upgrade | Base | Rank 0 | Rank 1 | Rank 2 | Rank 3 | Rank 4 | Total |
|---|---|---|---|---|---|---|---|
| Tough Rind (+8% max HP) | 120 | 120 | 186 | 288 | 447 | 693 | 1,734 |
| Heavy Hand (+5% damage) | 150 | 150 | 233 | 361 | 559 | 866 | 2,169 |
| Fast Flow (+10 starting meter) | 100 | 100 | 155 | 240 | 372 | 577 | 1,444 |
| Good Market (+6% Cred) | 110 | 110 | 171 | 265 | 410 | 635 | 1,591 |

Everything costs **≈6,900 Cred** to max. At ~84 Cred per normal win that is roughly 70–80
matches, or fewer at Expert with Good Market ranks — a long-tail goal, not a gate.

### Anti-exploit rules

- Training pays nothing.
- Story replays do not repeat the first-clear bonus.
- The CPU never receives meta upgrades (`applyTo` only touches `p1`).
- Rank purchase is atomic: cost is checked and deducted in one call, so a double tap cannot
  buy twice for one price.

## 5. Progression curve

Account level XP requirement:

```
xpNeed(level) = round(90 × level ^ 1.35)
```

| Level | XP to next | Cumulative | Typical play |
|---|---|---|---|
| 1 | 90 | 90 | 1 win |
| 2 | 229 | 319 | ~3 wins |
| 3 | 396 | 715 | ~7 wins |
| 5 | 790 | ~1,900 | ~20 wins |
| 10 | 2,015 | ~9,000 | ~90 wins |

Rank gates: ranks unlock at levels **1, 3, 5, 7, 9**, so a player always has one affordable
target and one visible future target. Level 40 is the hard cap (no further unlocks).

## 6. Balance notes (current tuning)

- `TUNE.DAMAGE = 3` multiplies every move; with combo scaling `1 − 0.085×combo` floored at
  0.42, a five-hit combo deals ~65% of nominal damage, which keeps round length near the
  60-second timer instead of ending in one touch.
- Meta damage is capped at +25% and HP at +40%: enough to feel the investment without
  trivialising Expert, whose CPU retains full reaction and block values.
- Starting meter (+50 max) shortens the wait for a first super but does not grant one.
- Fortune compounds with payouts, so it is priced highest per rank relative to its effect.

**Not measured:** win rates and time-to-kill on real hardware. Balance here is analytical,
from the formulas above and scripted checks; it has not been validated by playtest data,
and should be revisited after the first device testing round.

## 7. Juice inventory

Hitstop (4/8 frames by weight), camera punch, screen shake (suppressible by Reduced Motion),
impact particles with character-specific colours, damage numbers, combo counter, KO slow
motion, super flash, haptic patterns per hit type, and a trophy toast chime. Every effect is
tied to a mechanic so feedback never fires without a cause.

## 8. Deliberate exclusions

No pay-to-win, no ads, no energy timers, no daily-challenge FOMO loop, no online accounts.
The economy exists to pace upgrades, not to monetise them.
