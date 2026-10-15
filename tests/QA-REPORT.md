# Slice QA Report — Phase 4 Wave 2 (M2 Gate)
**Seat 10 · QA Manager (Black Panther) · Sloane presiding · 2026-10-15**
**Tested commit:** `ee9cfe9` (main) · **Branch:** `feat/qa-slice-tests` (this report + harness)
**Harness:** `scripts/verify-slice.mjs` — producer's 48-assert driver EXTENDED (not forked) with the named challenge-doc suites. Single command: `node scripts/verify-slice.mjs`. Exit 1 on any failure.
**Full run log:** `tests/qa-run.log` (this report's evidence).

## Verdict: **GO-WITH-DEFECTS** (conditions below)

151/157 asserts pass (96.2%). The producer's 48/48 release driver is fully green. All 6 failures are filed defects, severity ≤ High, none in the data-loss / security / crash class. The two gameplay defects (QA-003, QA-004) already have fixes on the parallel workstream (unmerged at test time); QA-001/002 need an Art Director / Game UI/UX ruling in Wave 2. **M2 closes when:** the four defects are cleared or formally waived by their owning seats, and this harness re-runs green on the integrated tree.

## Pass rates

| Suite | Asserts | Pass | Notes |
|---|---|---|---|
| Producer slice driver (boot→badge→save→continue) | 48 | 48 | green |
| S3a bundle checksums (guest vs full) | 4 | 4 | sha256 match, content-hash comment, shell-first guest |
| S3b cross-bundle playthrough parity | 3 | 3 | byte-identical canonical transcripts, both bundles |
| S4 guest `fetch(` audit (= 0) | 2 | 2 | bundles + src; no XHR/WebSocket/dynamic-import |
| S5 tap targets ≥44px | 1 | 1 | padbtn 44, A/B 72, sysbtn/menu-row/dialogue ≥44 |
| S1 slop blacklist | 6 | 5 | **QA-001** fails (microtext) |
| S2 color-blind sims + type UI | 4 | 3 | **QA-002** fails (no type badge); stripe/pip/text mitigations pass |
| S6 malformed-save fuzz (19-case corpus) | 20 | 20 | all rejected without throw; no proto-pollution |
| S7 conflict sim vs normative sync spec | 6 | 6 | 200/409/422 per ADR-007 D2/D4 + ADR-008(ii); Track-B conformance model |
| S8 thermal soak (simulated, headless) | 4 | 4 | logic mean 0.002–0.003ms (budget 4ms), p99 0.006ms, max <3.2ms |
| S9 rotation fuzz across battle FSM | 16 | 16 | intro/command/moves/resolve/bag/catchseq × portrait/landscape/desktop; state + refs intact |
| L1 damage formula | 7 | 7 | exact Gen 4/5 formula, STAB, crit 2×, burn, random bounds |
| L2 phys/spec split | 4 | 4 | move cats, Gen-4 split, stat routing (structural), scaling |
| L3 type chart | 4 | 4 | 12 documented matchups, crit 1/16, random range, stage ladder |
| L4 catch math (Gen 5) | 6 | 6 | a=85 case, sleep 2.5×, burn 1.5×, a≥255 guarantee, ball bonuses |
| L5 XP curves / yield / turn order | 5 | 4 | **QA-004** fails (trainer 1.5×) |
| L6 gym progression | 4 | 4 | Brock team/badget/reward/dialogue; ace within GD band |
| L7 save/load round-trip | 2 | 2 | state preserved, ≤64KB budget |
| L8 dex honesty + frontier hooks | 2 | 2 | tracks 1025, 14 playable, 7 symbol slots, befriended state |
| F1–F3, F5–F6 feel checkpoints | 5 | 5 | 3-beat 900ms, theater 3.0s, battle 1.7s, step 200ms, first-catch 54.2s |
| F4 encounter cadence | 5 | 2 | **QA-003** ×3 fail |
| **Total** | **157** | **151** | **96.2%** |

## Defects filed

- **QA-001 · Medium · Slop blacklist: text < 14 logical px** (contracts §1.3, gameux §6). 20 violations: 17 canvas `r.text` call sites (sizes 6–12: HP plates, dex counter, banners, title fine print) + DOM text at 10–12px (sysbtn, menu-title, toast, dlg-hint). Owner: Art Director + Game UI/UX — bump sizes or amend the contract with an on-device readability rationale.
- **QA-002 · Medium · Move buttons lack type badge (icon+text)** (gameux §4.2, accessibility §7). Label builds as `name + PP` only (`battle.mjs` onCommand). New players pick blind; violates "never color alone". Owner: Game UI/UX + Lead Frontend.
- **QA-003 · High (gameplay) · Encounter chain counter never decays.** `chainCount >= 2 → p = 0` with no reset on quiet steps, so after ANY double-chain, wild encounters stop for the rest of the map visit. Measured: 2 encounters in 900 grass steps. The core catch loop dies. Owner: Gameplay Designer. **Status:** fix observed committed on the parallel workstream (commit `14da827`, unmerged) — re-verify post-merge; regression test `qa f4b` locks it.
- **QA-004 · Low · Trainer XP 1.5× modifier missing** (GD §3.4, documented Gen 5). `xpYield` has a dead ternary `(isWild ? 1 : 1)` — trainer battles should award 1.5×. Owner: Gameplay Designer. **Status:** fix observed on the parallel workstream (`feat/audio-chiptune`, unmerged) — re-verify post-merge.

## Named challenge-doc cases — disposition

- Slop-blacklist assertions: PASS except QA-001 (microtext). No gradients/glow calls, no emoji, no placeholder screens, one shadow style, account row is a disabled stub.
- Color-blind sims on HP/type UI: CVD luminance matrices run as evidence (all three states pairwise-distinct under protanopia/deuteranopia/tritanopia); binding mitigations PASS (stripe overlay ≤25%, no stripes above, status pip as text). Type pills: QA-002.
- Both-bundle checksum playthrough: PASS — guest and full bundles play the slice byte-identically.
- Guest `fetch(` audit: PASS (= 0 across bundles + src; api/ excluded by design — Track B server code).
- Tap-target audit: PASS — all interactive targets ≥44px.
- Malformed-save fuzz: PASS — 19/19 malformed payloads rejected without throwing; `__proto__` causes no pollution.
- Conflict simulator vs normative sync spec: PASS — 200/409/422 behavior per ADR-007/008; labeled as the Track-B conformance model (sync API not built in Track A).
- Thermal soak: PASS (simulated, headless) — logic cost ~1000× under budget; render cost covered by DPR auto-tier + viewport culling (design inspection).
- Rotation fuzz: PASS — 16/16 across battle FSM states and all three layouts.

## Fun evidence

- Feel checkpoints measured: 900ms / 3.0s / 1.7s / 200ms / 54.2s — all inside GD §6.2 budgets.
- Friction log: `tests/friction-log.md` (8 entries).
- **"One more gym" Wave-2 self-reading: 65% — PASS-leaning, NOT the formal gate** (n=1, simulated; formal gate needs 5+ real players on device per the plan). QA-003 is the largest deduction; fixed, this reads like a 75–80% build.

## Caveats (stated plainly)

1. **Tested commit is `ee9cfe9`.** Parallel Wave-2 branches (`feat/audio-chiptune`, `feat/balance-slice`, `feat/art-sprites`) carry unmerged work, including fixes for QA-003 and QA-004. This report does not cover them; the harness must re-run green on the integrated tree before the M2 gate closes.
2. **Shared-VM branch hazard (process note for Sloane):** mid-task, the checkout was switched from `feat/qa-slice-tests` to another seat's branch by a parallel agent, and game code changed underneath a running QA pass (I caught it via a failing-then-passing defect test). Recommendation: one git worktree per seat, or a checkout lock, for parallel War Room work.
3. **Headless limits:** no real visuals, audio, touch feel, or GPU render cost measured. Device playtests still required for the formal fun gate and the CPE perf checklist.
4. **S7 conflict sim** tests the normative spec as a conformance model, not shipped Track-B code (which doesn't exist yet).

## M2 sign-off conditions

1. QA-003 + QA-004: merge the workstream fixes, re-run harness → green (regression tests `qa f4b`, `qa l5` lock them).
2. QA-001 + QA-002: owning-seat ruling (fix or contract amendment) in Wave 2.
3. Formal "one more gym" gate with real players before any production share.
4. Re-run `node scripts/verify-slice.mjs` on the integrated tree; 100% green required to close.

*— QA Manager, seat 10. The gate is red until the defects are cleared; the evidence for clearing them is this harness, not a promise.*
