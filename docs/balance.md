# Slice Balance Bible — Track A (Pallet → Pewter)
**Owner:** Gameplay Designer (seat 17) · **Wave:** Phase 4 Wave 2 · **Branch:** `feat/balance-slice`
**Spec:** Phase 1 gameplay vision §5 (difficulty curve) + §6 (fun-verification).

All numbers below are from the shipped data tables (`src/data/`) and the
documented Gen 4/5 formulas (`src/engine/formulas.mjs`). Nothing is procedural —
wild/trainer levels are authored per route.

---

## 1. Level curve (authored)

| Segment | Player team | Wild | Trainers (route) | Boss | Intent |
|---|---|---|---|---|---|
| Route 1 | 5 → 8 | 2–5 | Cal 3–4, Lisa 3–4 | — | Teach: move, weaken, catch |
| Route 2 | 8 → 11/12 | 3–7 | Rick 5, Bea 7, Nia 7, Rob 8–9 | — | Teach: type counters, setup |
| Pewter Gym | 11–13 | — | — | Brock 12 / 14 | Strategy check, not stat check |

A player who fights ~70% of visible trainers and a normal share of wilds
arrives at **Lv 11–12** — verified by XP accounting (§4), not vibes.

## 2. Wild encounters

- **Cadence:** rate 0.12/step → mean ~8.3 steps (spec: 8–14 avg). Pity forces an
  encounter after 20 silent steps; chains capped at 2 (anti-frustration, spec §6.2).
  Chain counter decays on quiet steps (QA-003 fix) and the scripted tutorial
  doesn't seed the random chain.
- **Route 1:** Pidgey 2–4 (45), Rattata 2–4 (45), Spearow 3–5 (10).
- **Route 2:** Caterpie 3–6 (28), Weedle 3–6 (28), Pidgey 4–6 (22),
  Nidoran♂ 4–7 (10), **Mankey 4–7 (14)** — the Brock answer, findable.
- **Tutorial (first Route 1 grass step, flag-gated):** scripted Lv 3 Rattata.
  One Thunder Shock → yellow (9 dmg vs 15 HP); its Tackle does ~4 to a Lv 5
  Pikachu (20 HP). RUN disabled, foe endures at 1 HP, catch **guaranteed** once
  weakened. The <3-min gate is a certainty that teaches weaken → throw.

## 3. Trainer progression (all new in this pass — the slice had zero)

| Trainer | Team | Payout XP (1.5×) |
|---|---|---|
| Youngster Cal (R1) | Rattata 3, Pidgey 4 | ~73 |
| Lass Lisa (R1) | Pidgey 3, Rattata 4 | ~74 |
| Bug Catcher Rick (R2) | Caterpie 5, Weedle 5 | ~80 |
| Camper Bea (R2) | Nidoran♂ 7, Mankey 7 | ~173 |
| Jr. Trainer Nia (R2) | Pidgey 7, Rattata 7 | ~151 |
| Hiker Rob (R2) | Geodude 8, Geodude 9 | ~217 (Brock preview) |
| **Uniformed Duo Rue & Cole (R2, Yellow-authenticity update)** | Weedle 5 "Sting", Zubat 6 "Echo" | ~104 (optional ambush — wide sight cones, avoidable via grass detour) |

Trainer battles pay the **documented 1.5× XP** (`xpYield`, Gen 5-era). XP is
awarded in full to every conscious party member (party-wide catch-up, §5 pacing).

## 4. XP economy accounting (Route 1 → Pewter)

| Source | XP per mon |
|---|---|
| Route 1 trainers (2) | ~147 |
| Route 2 trainers (4) | ~556 |
| Wilds (~18 encounters) | ~556 |
| **Total** | **~1324** |
| *Uniformed Duo (optional)* | *+104 (weedle 5: 41, zubat 6: 63 — trainer 1.5×)* |

Pikachu banks 125 XP at Lv 5 → 1449 ≈ **Lv 11** (1331) + progress to 12.
A completionist fighting everything reaches 12–13. No dedicated grinding
between gyms — spec §5 pacing rule holds.

## 5. Brock matchup math (the fix)

**Before:** coach promised water/grass on Route 2 (neither existed); Mankey had
no Fighting move; Pikachu does literally 0 (Electric vs Rock/Ground). A Lv 12
Quick Attack did **2/hit** to Geodude (35 HP) — an 18-turn "fight".

**After — the strategy:** Mankey learns **Low Kick** (Fighting 50, Lv 1).
- Mankey 12 Low Kick vs Geodude 12: ~12–18/hit (2× + STAB), 2–3HKO on 35 HP.
- Geodude Rock Throw vs Mankey: **resisted** (Rock 0.5× vs Fighting), ~5–6/hit.
- Geodude Tackle vs Mankey 12: ~10/hit → 4HKO on 33 HP.
- Mankey 12 Low Kick vs Onix 14: ~8–12/hit, 4–5HKO on 38 HP; Onix Tackle ~9/hit.
- Brock opens Geodude with **Defense Curl** (`ai: 'opener-setup'`) — classic
  Brock, a free turn for the player, teaches setup play.

Headless strategy sim (Lv 12 team, Mankey leads, Low Kick, 3 potions):
**victory, Mankey at 18/35 HP, 2 potions left** — hard but fair, won with
strategy at intended levels. Without Mankey the fight is near-unwinnable by
design (two NPCs — Viridian Hiker, Pewter Coach — now teach the counter
honestly; the old false water/grass promise is gone, kept only as foreshadowing
"this side of the forest").

## 6. Catch rates vs ball economy

| Ball source | Qty |
|---|---|
| Start (AIDE: "ten to start") | 10 |
| Pewter Coach (one-time gift) | +3 |
| **Pre-Brock total** | **13** |

Typical spend: tutorial 1 + Pidgey/Rattata ~2 each + Mankey ~3 ≈ 8–9.
Catch math is documented Gen 5 (`catchA`, shake checks); starters keep
catchRate 45, commons 255/235/190.

## 7. Spec compliance (§6.2 feel checkpoints)

- Encounter cadence 8–14 avg / ≤20 silent / ≤2 chains: **yes** (rate 0.12 + pity + chain cap + QA-003 decay fix).
- First catch <3 min from boot: **yes** (scripted on first grass step).
- Wild battle ≤45s: unchanged systems.
- No grind walls: **yes** (§4 accounting).

## 8. Deliberately deferred to Wave 3

1. **Poké Mart / ball shop** — 13 balls cover the slice; a real economy (Mart,
   sellables, Amulet-Coin-equivalent) needs Game UI/UX shop screens.
2. **Difficulty modes** (Normal/Challenge/Easy per §5) — data hooks exist
   (`story.difficulty`), not wired.
3. **Route-trainer sight lines** — IMPLEMENTED in the Yellow-authenticity
   update (`feat/yellow-authenticity`): `sight: { dir, range }` cones on all 6
   route trainers (Brock stays talk-only); spot beat (500ms `!` + original
   two-note alert) → 150ms/tile walk-up → battle. Talk-to-battle still works
   as the fallback path.
4. **Viridian Forest / Mt. Moon** — out of slice scope; the "optional grind"
   the producer mentioned doesn't exist as maps yet.
5. **Full catch-rate audit vs ball tiers** — Great/Ultra Balls exist in data
   but aren't obtainable in the slice; economy tuning resumes when they are.
6. **Brock rematch team** (Platinum-style stronger team) — post-game loop item.
