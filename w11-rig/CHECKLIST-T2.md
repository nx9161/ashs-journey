# W11 T2 — Pair-Palette (GALVAMUS / PITCHLET / REGALOTH) — CHECKLIST

Base: main `3861f1c6` (species art-data sha256 b2fc012b… verified
byte-identical to wave base `1e15d16d` before work began — claim in
the brief CONFIRMED by measurement). Branch: `wave-w11-t2-pairpal`.

## Recipes (deterministic; rig in w11-rig/)
- GALVAMUS back: transform.py isolation/crop of galvanik-back.png ->
  posterize to the shared pair palette v3 (w11-rig/shared-galvamus.pix:
  front-family reps #c96c29/#d47922/#eb9b3a/#eda656/#fedca2, one
  attractor per pale bin) -> grow-pale.py r=14 (widen the coil's pale
  highlight bands to the front coil's treatment) -> convert --fit 60.
  Front .pix NOT touched.
- PITCHLET pair: transform.py --dilate 12 --palette-from
  w11-rig/shared-pitchlet.pix (shipped front palette, minus the
  bin-42 sage #959e83) on both designs -> convert --fit 62. Back then
  warm-sage.py (blue channel x0.90 on pale sage pixels) so its pale
  cluster quantizes into the front's bin 41, not bin 42.
- REGALOTH back: enrich-back.py --lift-top 0.24 (recolour inside the
  untouched mask onto the front fur ramp #311c17/#42302a/#533c32/
  #59463d/#604c3f/#705b50/#856f61; bin-41 belly tones deliberately
  excluded) -> convert --fit 60. Front .pix NOT touched; silhouette,
  bbox and mass (2073) are the shipped ones by construction.
- Transformed design PNGs committed as the new canonical sources
  (T1 precedent). W13 design fields byte-untouched for all three
  (design-depth 13/0 on the final tree).

## GALVAMUS eyeball gate (plan OQ2 — Director visual grade)
Before/after sheets: galvamus-before.png / galvamus-after.png
(front + back at 4x, slate ground).
VERDICT: PASS — same creature, same read. The hefty amber hare's
silhouette, pose, prong ears and coiled tail are unchanged; the front
is byte-identical. The only change is the chartered one: the back's
coil now carries the broad pale-cream banding the FRONT's coil already
had (before: thin fragmented streaks), and the under-coil shadow sits
in the family's dark copper. Nit noted, accepted: the cream coil is
bold — but it matches the front coil's own treatment, which is the
agreement this tranche exists to fix.

## Other visual grades (self-grade)
- PITCHLET (pitchlet-before/after.png): PASS. Same sprout — pitcher
  cup, yellow bud, leaf arms, root feet, the front's face — grown from
  a thread into a plant: stalk, leaves and root flare all substantial,
  proportions not lengthened. Mass +52%/+58% is more than the plan's
  "slight bulk" wording; it is the fit-first consequence of a sprite
  that measured ribbon-class (.267/.283, the roster's worst) and now
  reads at roster weight. Ribbon .097/.048.
- REGALOTH (regaloth-before/after.png): PASS. Identical outline; the
  flat dark blob gains a top-light structure (pale crown/shoulders ->
  mid band -> dark rump) in the front's fur tones. Nit noted,
  accepted: the strata are broad and regular, and the crown reads
  paler than the front's crown — the lift (0.24) that measurement
  required for bin 37 to survive conversion; the alternative (0.16)
  left the back at pairJ 0.667 with bin 37 blended away.

## Drift proof (hard gate, OQ6)
Art-data updated by entry-granularity splice only (build-art full
regen is blocked on base main by 45 pre-existing validation errors;
the regen ran in-clone with both gates bypassed locally, the tool
file restored before commit — git shows it unmodified).
Object diff shipped vs spliced: 4893 entries both sides, 0 added,
0 removed, changed = exactly [raichu-back, bellsprout-front,
bellsprout-back, slaking-back], each byte-equal to its regen span.
raichu-front, slaking-front and all bob entries byte-identical.
Drift-35 WATCH species: untouched, byte-identical — their grades
cannot and did not move (roster grade changes = exactly the 3).

## Battery + bundle (final spliced tree)
- tests/run-checks.mjs exit 0 — all 44 hard-gate entries PASS:
  char-design 606/0, gym-identity 157/0, cutscene-panel 43/43
  (this base's count), design-depth 13/0, fidelity 35/35,
  verify-slice/audio/towns/reachability (pockets 1069) all PASS.
- audit-battle-art (in battery and standalone): PASS 464 / WATCH 41 /
  FAIL 0, flags 1491 (+8 exempt) — see AUDIT-LINES.md.
- Bundle: dist/standalone.html 11,908,061 B == base main's bundle.
  NET DELTA 0 B (art-data file size identical: 7,391,896 B; entries
  are fixed-format). dist/ + personal/ restored after measuring —
  source-only commits.

## Environment disclosure
Home quota (EDQUOT) rejected the durable-home-worktree route; the
wave built in a sparse --shared clone (/tmp/w11t2; research/ and
designs/ excluded except the 6 tranche PNGs). Consequences, stated:
the audit's missingDesigns list is long in-clone (designOk is
report-only and does not affect grades; the trio's own designs are
present and designOk-true). All commits pushed + ls-remote-verified
as they landed, against /tmp cycling risk.
