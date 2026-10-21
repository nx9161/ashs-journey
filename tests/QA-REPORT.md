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

---

# Changed-Flow Sign-off — ADR-015 (story chapters) + ADR-016 (Yellow authenticity) + D3 laptop viewports
**Seat 10 · QA Manager (Black Panther) · focused sign-off, no full War Room · 2026-10-15 ~16:35 EDT**
**Tested commit:** `361d70b` (main, post-merge of `feat/yellow-authenticity` + `feat/story-chapters-laptop`) · **local tree:** `~/workspace/ashs-journey` (clean)
**Harness:** `tests/qa-changed-flows.mjs` — headless eval driver (same pattern as `verify-slice.mjs`), 67 asserts. Single command: `node tests/qa-changed-flows.mjs`. Exit 1 on any failure.
**Automated gates re-run on this tree (not re-run inside the harness):** `verify-slice.mjs` 134/134 PASS · `contamination-scan.mjs` clean · `budgets-check.mjs` PASS · `drift-gate.mjs` PASS (personal === guest + EDITION_MARKER) · `verify-audio.mjs` ALL PASS.

## Verdict: **GO-WITH-DEFECTS** (one P3 defect, fix below; does not block the push)

67/67 asserts pass. Every changed flow behaves per ADR-015/016: chapter cards, Journey menu honesty, dex header, all six Yellow flows, and the D3 laptop-viewport math (16:9 aspect-lock at 1280×800, 1440×900, 1920×1080, plus the no-matchMedia fallback and the 4:3 phone-landscape regression case). One cosmetic-a11y defect filed (QA-005). Nothing in the data-loss / security / crash / IP class.

## Pass rates

| Suite | Asserts | Pass | Notes |
|---|---|---|---|
| A. Chapter title cards | 8 | 8 | fresh run opens Ch.1 card; modal; 4s auto-dismiss; A/START dismiss; B does not |
| B. Journey menu (pause → Journey) | 13 | 13 | 30 rows; 5 playable enabled w/ (now); 8 locked + 14 bonus disabled; zero "coming soon"; detail cards; locked rows unopenable |
| C. Pokédex chapter header | 2 | 2 | shows current chapter; follows story.chapter advance |
| D. Yellow-authenticity flows | 19 | 19 | 5 moods + original lines; emote on talk; evolution/box refusal lines; rival 2-0/1-1/0-2 rule; 6 sight cones; Brock talk-only; verbatim two-beat intro; duo ambush |
| E. Laptop viewports (D3) | 7 | 7 | 16:9 lock at all three sizes; keyboard map; 2×2 command panel; no-stretch; phone-landscape 4:3 regression |
| Served-file / CSS / bundles | 18 | 18 | personal + public index.html served 200; CSS rules verified; personal bundle boots to overworld |

## Defects filed

- **QA-005 · Low (a11y) · Chapter-card hint blink ignores `prefers-reduced-motion`.** The ADR-015 criterion says the title card is "reduced-motion safe", and the code comment repeats it, but `.cc-hint` runs `animation:blink 1s infinite` (`personal/index.html` line 136) and the `@media (prefers-reduced-motion: reduce)` rule only covers `.loginover *,.authcard *,.banner503 *,.syncdot *`. The blink is a subtle 1s opacity pulse (not vestibular-triggering), but the stated criterion is violated. Pre-existing `.dlg-hint` shares the same blink and is also uncovered. **Fix (one line):** add `.chaptercard *,.dialogue *` to the reduced-motion selector list. **Owner:** Game UI/UX Designer. Re-verify: re-run `node tests/qa-changed-flows.mjs` (add a CSS assert) after the coordinator applies it. Does not block this push.

## What was verified, by flow

1. **Chapter title cards** — `a0–a7`: 13 chapters / 5 playable / 8 locked / 14 bonus in `src/data/story.mjs`; fresh new-game flow (boot → title → intro → name → overworld) opens the Chapter 1 card (`intro.mjs:98` → `startOverworld({ chapterCard: 0 })`); the card is modal (`ui.update` returns true, world input blocked); auto-dismisses at 4s of game time; A or START dismisses early; B does not. DOM tap path code-verified (pointerdown → `input.inject('a')` → the same tested dismiss branch). CSS: paper panel `#f8f8f0`, 3px ink border, gold kicker — Gen 4/5 idiom; all text ≥14px (14/22/15/14/14).
2. **Journey menu** — `b1–b13`: 30 rows exactly (act header + 13 chapters + bonus header + 14 bonus + close); playable rows 1–5 enabled with values `ch1..ch5`, current chapter marked `(now)` and follows `story.chapter`; locked chapters 6–13 and all 14 BONUS entries are disabled, valueless (unopenable), labeled `locked (future act)` — no "coming soon" text anywhere, no placeholder screens, no fake content; playable rows open detail cards (kicker, title, arc, anime coverage, special events) that close back to the menu; locked rows cannot be chosen.
3. **Pokédex header** — `c1–c2`: first dex row is a disabled `Journey — Ch.1 · The Indigo League` header; follows chapter advance (Ch.5 → Master Quest).
4. **Yellow flows** — `d1–d19`: `PARTNER_MOODS` exactly 5 moods with distinct original lines; talk/pet emotes read the mood (sad → pet → happy + original line, mood-pip tap wired); partner species carries `refusesEvolution`/`refusesBox`, guards return the original refusal lines verbatim (`state.mjs` is the enforcement point); `rivalPartnerEvolution` implements 2-0→vaporeon / 1-1→flareon / 0-2→jolteon (losing-record default Jolteon), Gary raises an Eevee; exactly 6 route trainers have sight cones (`r1_cal, r1_lisa, r2_bug, r2_camper, r2_jr, r2_hiker`), Brock has none (talk-only); Cal's sight-line challenge fires the 500ms `!` spot beat + `trainer-spot` jingle, walks up, locks input, and opens the battle with the verbatim two-beat intro `Trainer Cal wants to battle!` → `Cal sent out Rattata!`; RUE & COLE both spot with `sight` cones, either pulls both in (2-part challenge), the battle is `r2_duo` with the nicknamed 2-mon team (Sting the Weedle 5 → Echo the Zubat 6), original intro banter, no trademarked team name or motto quotes.
5. **Laptop viewports** — `e + served-file suite`: `applyLayout` desktop math produces exactly 1120×630 (16:9, zero stretch) at 1280×800, 1440×900, and 1920×1080, including the no-matchMedia fallback (width ≥1024 → desktop); keyboard map complete (Arrows/WASD, Z/Space=A, X=B, Enter=START, M=mute, F=fullscreen); battle command panel is a 2×2 FIGHT/BAG/PARTY/RUN grid whose element is a child of `#ui` root (not `.controls`), so `body.desktop .controls{display:none}` cannot hide it — verified in source and CSS; `.inbattle .hintcard{display:none}` + `setBattleMode` toggling `.inbattle` means the hint card never overlaps battle commands; dex-dot is absolutely positioned inside the relative dex HUD button (clears the strip, which sits top-right of the canvas); every DOM font-size in the served CSS is ≥14px (34×14, 12×15, 6×16, 1×18, 2×20, 1×22 — none below 14). `personal/index.html` + `game.js` served 200 over `python3 -m http.server`; personal bundle boots headless to the overworld with the edition marker and zero auth UI.
6. **Regression** — the signed slice still plays end-to-end: `verify-slice.mjs` 134/134 PASS re-run on this exact tree (Pallet → Brock, guest bundle); personal-edition boot smoke PASS.

## Caveats (stated plainly)

1. **Headless limits:** no real pixels were rendered and no real browser ran — aspect-lock, panel visibility, HUD clearance, and text sizes are verified from the executed layout math + the served CSS, not from screenshots. A live-browser spot check (the owner's standing on-device rule covers phones; laptops deserve one pass at 1280×800) would close this.
2. **Keyboard "works"** is evidenced through the shared `wasPressed` input path that the full 134-assert playthrough drives; the DOM `keydown`→action binding itself is code-verified, not key-pressed in a browser.
3. QA-005 is filed above with its one-line fix; the coordinator can apply it and re-run the harness — no re-sign-off needed from this seat for that change alone.

*— QA Manager, seat 10. The gate is green-with-defect: push authorized; clear QA-005 in the next pass.*

---

# UI v2.1 fix round — deployed-flavor gate (2026-10-21)

**Why this round existed:** UI v2's screenshot gate ran against the standalone
guest file under a CDP harness — no CSP header, a different surface from the
deployed public flavor. Parent live verification of v2 (dde4bee) found the
Platinum re-skin had landed in the canvas layer only; the DOM layer on the
deployed build was still v1 modern-web, and the Galmuri typeface was not in
effect at all.

**Root cause of the font defect (defect 1):** `vercel.json`'s CSP had no
`font-src`, so the data-URI `@font-face` sources fell back to
`default-src 'self'` (no `data:`) and were blocked in production — silently:
every layer fell back to system-ui. The headerless harness could not see it.
Secondary find: the v2-embedded subsets also lacked glyphs the UI uses
(menu cursor ▶-class, ▌, ♀, ✓/✕/⌫ — the last three exist in NO Galmuri face).

**The new gate:** `~/workspace/ashs-journey-qa/shoot4.mjs` serves the ACTUAL
public build output (`public/index.html` + `public/game.js`) with the real
CSP parsed live from `vercel.json`, a healthy `/api/health`, and asserts:
(a) font proof — `document.fonts.check` for PtGalmuri 400/700 + PtGothic,
`document.fonts.load` resolving, and a canvas pixel probe (PtGalmuri render
must differ from an unknown-family render); (b) frame geometry — dialogue,
guest banner (must not overlap), HUD strip, HUD chips, party, bag, dex,
pause menu, options, battle command panel, and move menu rects vs. the
canvas rect, desktop 1280×800 and phone 390×844.

**Before (dde4bee, same harness):** font check all-false, `fonts.load`
errored, canvas probe false; dialogue spanned 51–1229px vs frame 80–1200;
party panel 1229px wide over the full viewport; cmdpanel at y 650–788 vs
frame bottom 715 (commands rendered BELOW the frame); HUD strip at the
browser's top-right, outside the frame.

**After (this round):** font proof all-true on desktop + phone; every
geometry probe `inside: true` on both viewports (party = exactly the frame;
cmdpanel 88–1192 × 569–707 inside 80–1200 × 85–715); guest banner never
visible over gameplay (retired — the notice lives in the Trainer ID
Terminal guest pane). Screenshots: `~/workspace/ashs-journey-qa/shots/
v21-{desktop,phone}-*.png`, probes in `v21-{desktop,phone}-probes.json`.

**Structural fix:** all in-game DOM now lives in a `#frameui` layer whose
box is synced to the canvas rect (`UI._syncChipAnchor`, also called from
`Game.applyLayout`), making out-of-frame chrome geometrically impossible
rather than merely checked-for. Fonts are self-hosted files in
`assets/fonts/` (subsets regenerated from galmuri@2.40.3 with full UI
coverage), embedded from disk by `scripts/build.mjs`.

**Suites on the final tree:** verify-slice 133/133 · fidelity-checks 26/26 ·
campaign-smoke 24/24 · qa-changed-flows 19/19 (incl. new permanent CSP
font-src guard) · budgets all-pass · drift gate PASS.

**Known micro-deviation:** Galmuri11 Bold has no ♀ glyph; "Nidoran♀" in the
summary panel's bold name line falls back for that one character (regular
weight everywhere else). Documented in `assets/fonts/README.md`.
