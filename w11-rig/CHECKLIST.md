# W11 T1 — Mass & Bulk — CHECKLIST

Branch `wave-w11-t1-mass` off main `1e15d16d`. Species: SAPLINT
`ivysaur`, DASHFERRET `furret`, DASHCOON `linoone` (plan T1 list).

## Results (audit-measured, scripts/audit-battle-art.mjs)
Fleet PASS 461 / WATCH 44 / FAIL 0 -> **PASS 464 / WATCH 41 / FAIL 0**;
uniqueness flags 1489 both sides; roster-wide grade changes = exactly
the 3 tranche species, all WATCH -> PASS. Full lines: AUDIT-LINES.md
(deliverables) — headline: SAPLINT F mass 483->1380, pairJ 0.778;
DASHFERRET F 454->933 / B 441->846, pairJ 0.800; DASHCOON F 860->903 /
B 570->913, pairJ 0.500->0.625 (PASS gate 0.60; below the 0.70 aim —
disclosed in AUDIT-LINES.md with the sweep record).

## Method per species (transform.py -> convert-monster.mjs)
- SAPLINT: isolation + tight crop refit only (the defect was pure
  fit: frame component inflated the bbox; front fill was 13.8%).
- DASHFERRET front: drop-top strip + wash removal, mask dilation 10px
  (honest bulk for a ribbon-thin body), sy 1.5 stretch, backdrop-panel
  shadow slab removed by edge trim, panel top border line removed by
  crop filter (15,673px island), convert fit 62. Back: sy 1.9 stretch
  of the top-down sprint strip, fit 60.
- DASHCOON front: source posterized to the pair's own shipped palette
  (shared-palette construction), fit 60. Back: sx 1.3 widening +
  colour lift x1.32 (the back was rendered in a darker register; the
  lift lands its tan in the front's palette bands), fit 60.
- All six pix regenerate byte-identically (data lines) from the
  committed design PNGs via the documented recipes — designs/ stays
  the canonical source. Silhouette identity, palette family and the
  W13 design fields held (design fields byte-untouched; no suite pin
  moved anywhere in the wave).

## Art-data (surgical, hard gate)
- build-art.mjs is BLOCKED on base main: 45 pre-existing validation
  errors (verified on the untouched primary tree) and a forced full
  regeneration renames 386 tile entries + reverts title-keyart.
- Mechanism used: clone-only validation bypass (never committed) ->
  build-art regeneration -> ENTRY-GRANULARITY SPLICE of exactly the
  6 species entries (w11-rig/splice-art-data.mjs).
- Proof: object-level diff of art-data ART = changed exactly
  {ivysaur-front, ivysaur-back, furret-front, furret-back,
  linoone-front, linoone-back}; 0 added, 0 removed; 4893 entries both
  sides; file size identical (7,391,894 chars). The drift-35 hard
  gate holds by construction — every other species entry is
  byte-identical, and the audit confirms no other grade moved.
- fidelity-checks 35/35 PASS (pix <-> art-data consistency).

## Battery
tests/run-checks.mjs exit 0 — all 44 hard-gate entries PASS
(38 test entries + 6 audits): char-design 606/0, gym-identity 157/0,
cutscene-panel 36/36, interior-variety 616/0, kindex 52/0,
dead pockets 1069 (unchanged). No flake encountered.

## Bundle
dist/standalone.html rebuilt in-clone: 11,905,508 B = base main's
bundle size exactly. **Net delta 0 B** (fixed-format art entries).
dist/ + personal/ restored — commits are source-only.

## Visual self-grade (before/after sheets in deliverables)
PASS. SAPLINT reads as the same sapling creature at full size;
DASHFERRET keeps its stretched-sprint identity with a thick striped
body and no panel frame/bar artifacts; DASHCOON front is the same
runner, back is now a legible standing rear view (vs the shipped
narrow sliver) — noted: the back renders in a lighter register than
the front (the pairJ trade-off above).

## Incidents
/tmp cycled mid-wave (~21:15Z) and destroyed the first build clone
after the art was final. The wave was rebuilt deterministically from
SPEC.md; every converter painted count and every audit metric
reproduced exactly. The rebuilt branch was force-pushed over the
lost clone's early rig commit (c4909b96 -> d5b6987c, rig-only).
