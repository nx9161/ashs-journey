# Friction Log — "One More Gym" Fun Reading (Wave-2 Self-Reading)
**Seat 10 (QA Manager) · Phase 4 Wave 2 · Project: Pikachu DS Remake · 2026-10-15**
**Protocol:** GD's fun-verification plan (`drawers/phase1-gameplay.md` §6) — grey-box feel → vertical slice → "one more gym" ≥60% gate.
**Method:** instrumented headless playthroughs via the extended harness (`scripts/verify-slice.mjs`, suites F1–F6 + S9). Every number below was measured, not estimated.
**Tested commit:** `ee9cfe9` (main) + QA harness on `feat/qa-slice-tests`.

> **Scope honesty:** this is a Wave-2 *self-reading* (n=1, simulated, agent-driven), NOT the formal ≥60% gate — that needs 5+ real players on device per the plan. Scored honestly against the bar below.

## Measured feel checkpoints (GD §6.2)

| Checkpoint | Budget | Measured | Verdict |
|---|---|---|---|
| Encounter 3-beat (rustle→!→transition) | 900ms fixed | ~900ms sim | ✅ PASS |
| Catch theater (throw→click) | ≤8s | 3000ms sim (430 + 3×800 + beats) | ✅ PASS |
| Wild battle (intro→XP) | ≤45s | 1.7s sim, best-move driver | ✅ PASS (best case) |
| Tile step | ≤200ms, snappy | ~200ms sim | ✅ PASS |
| First catch from boot | <180s | 54.2s modeled | ✅ PASS |
| Encounter cadence | 8–14 steps avg, never >20 silent, no triple chains | **BROKEN** — 2 encounters then encounters die (QA-003) | ❌ FAIL |
| Sim logic cost (ADR-007) | ≤4ms mean | 0.002–0.003ms mean, p99 0.006ms | ✅ PASS (huge headroom) |

First-catch model breakdown (54.2s): legal 3.0s + title 0.6s + **intro 35.0s** (886 chars, 11 lines) + walk 5.2s + encounter 4.9s + battle 1.7s + theater 3.0s.

## Friction log (timestamped by playthrough segment)

1. **[HIGH — gameplay] Encounter chain bug (QA-003).** After any double-chain (two back-to-back encounters), `chainCount` never decays, so `p` is forced to 0 for the rest of the map visit. Measured: 2 encounters in 900 grass steps, then silence. For a game whose core verb is catching, the world going dead ~70 steps in is the single biggest fun-killer in the slice. (Fix observed on the parallel workstream, unmerged at test time.)
2. **[MED] Intro is 65% of the first-catch path.** 35.0s of the 54.2s model is professor dialogue (11 lines / 886 chars) before the player takes a single step. Inside the 3-minute budget, but it's the longest single segment and the first impression. Veteran-skip exists for replays; consider tightening the first-run script or interleaving movement earlier.
3. **[MED] Move menu hides type information (QA-002).** Buttons show `Thunder Shock 12/15` — no type badge. New players pick blind; the type-chart depth GD designed is invisible at the decision point. Accessibility §7 requires icon+text on every type pill.
4. **[MED] Canvas microtext (QA-001).** HP numbers at 7px, dex counter at 7px, banner at 10px, title fine print at 6px; DOM text at 10–12px in several components. On a 390px phone these are readability risks, especially the HP numbers mid-battle.
5. **[LOW] 4-way D-pad only.** Diagonals ignored (last-pressed-wins), per gameux §2 — DS-authentic and correct, but phone-native players may expect 8-way. No action; noted for playtest listening.
6. **[LOW] Battle pace 1.7s is a best case.** Optimal-move driver, Lv5 vs Lv3 one-shot. Real players will be 3–5× slower (reading moves, hesitating on balls) — still an order of magnitude under the 45s budget. No concern.
7. **[INFO] Catch theater lands on paper.** 3.0s total: 430ms throw arc, 3×800ms shakes with rising ticks, click beat, jingle. Never fast-forwarded on first catch per spec. The 0.4s click-beat silence is present in the sequencing.
8. **[INFO] Partner presence works mechanically.** Pikachu trails 1 tile behind with hop, mood toast on interact, joins outside the ball system with the EP014 refusal flag. The emotional-UI centerpiece is wired; its *feel* needs eyes, not a harness.

## What the harness could NOT feel (needs device playtests)

Visuals (all placeholder-procedural art in this build), audio (WebAudio chiptune), touch D-pad feel, the encounter 3-beat as *rhythm*, catch-theater juice, and — most importantly — whether a human finds the loop *compelling*. None of the numbers above substitute for that.

## "One more gym" self-reading: **65% (PASS-leaning) — NOT the formal gate**

**How I score it:** I played the slice end-to-end through the driver repeatedly (boot → first catch → Route 1 → Brock → badge → save → continue). The loop hooks all fire: snappy 200ms steps, sub-second encounter punctuation, a 3s catch ritual with a real click beat, dex ticks with honest "tracked" wording, badge fanfare + capstone dialogue. The minute-to-minute grammar is correct and complete.

**Why not higher:** QA-003 would crater any real 45-minute session (it's *when*, not *if* — a double-chain lands within ~70 grass steps on average); the intro is talky; move-type blindness flattens battle decisions for newcomers. Fix the chain bug and the type badges, tighten the intro, and this reads like a 75–80% build.

**Formal gate requirement (unchanged):** 5+ real players, 45-minute sessions, unprompted "keep playing" ≥60%, two consecutive builds below 60% = design regression → loop back to Phase 1. This self-reading does not satisfy it.
