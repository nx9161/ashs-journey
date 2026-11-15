# W11 T2 — Pair-Palette (GALVAMUS / PITCHLET / REGALOTH) — SPEC

Base: main `3861f1c6` (species art-data sha256 b2fc012b… verified
byte-identical to wave base `1e15d16d`). Branch: `wave-w11-t2-pairpal`.
Plan: `~/workspace/muse-directive/WAVE-W11-SPRITE-UPGRADES-PLAN.md`
§§1/2/4/7. Tranche membership per Director brief: GALVAMUS, PITCHLET,
REGALOTH (plan §4 lists REGALOTH in T3; the brief's T2 list governs —
its technique is the same pair-palette class).
Director rulings: shared-palette re-derivation (plan §2 technique);
PNG-converter method (OQ3); drift-35 byte-identical HARD GATE (OQ6);
GALVAMUS eyeball gate (OQ2 — before/after identity check in CHECKLIST).

## Baseline (audit on base, reproduced in this clone)
Fleet: PASS 461 / WATCH 44 / FAIL 0, uniqueness flags 1489 (+8 exempt).

| species | id | grade | pairJ | F mass/col/steps/rib | B mass/col/steps/rib | flags |
|---|---|---|---|---|---|---|
| GALVAMUS | raichu | WATCH | 0.500 | 1729/16/5/.017 | 2210/16/3/.018 | pairJ < 0.6 |
| PITCHLET | bellsprout | WATCH | 0.500 | 629/13/6/.267 | 621/16/6/.283 | pairJ < 0.6 |
| REGALOTH | slaking | WATCH | 0.500 | 1793/16/7/.038 | 2073/6/3/.020 | colours ≤ 6 (B), pairJ < 0.6 |

Bin diagnosis (audit math: 2-bit/channel bins, hex present at ≥1.5% of mass):
- raichu F bins {0,52,56,57,62}, B bins {0,52,53,56} — back-only bin 53
  (#d97242) splits from the front family; back lacks the front's pale
  bins 57 (its pale coil highlights fragment over 3 hexes, each <1.5%)
  and 62 (cream belly — front-only by anatomy, stays front-only).
- bellsprout F bins {0,20,24,25,40,41,60}, B bins {0,20,25,41,61} —
  the pair's yellows sit in different bins (F #f0cf3f bin 60 vs
  B #eece40 bin 61); back lacks the front's cup tones 24/40.
- slaking F bins {0,16,20,21,37,41}, B bins {0,16,20} — the back is a
  near-flat dark mass (6 colours); front fur tones 21/37 never reach it.
  Back flags: 2 advisory palette-twins (regirock/groudon backs, juniors
  are the other side) — no shared-body flag names any tranche species.

## Targets (plan §1.2, PASS with margin)
pairJ ≥ 0.70 aim (≥ 0.60 = brief floor, disclose if under aim) ·
flagged-view colours ≥ 9 (REGALOTH back 6 → ≥ 9) · steps ≥ 4 on views
at 3 (raichu back, slaking back) · PITCHLET slight bulk both views
(mass 629/621 → ≥ 750 aim) with ribbon ≤ 0.28 aim, < 0.35 hard ·
wisp ≤ 10% · detached/specks 0 · ≤ 16 colours · silhouette identity +
palette family + W13 design-field anatomy held (design fields untouched).

## Locked approach per species
- GALVAMUS (raichu): palette re-derivation of the BACK ONLY against the
  front's shipped palette (the front already embodies the shared
  palette; it stays byte-identical — plan §2: "back re-converted
  against the front's amber/copper family", shape work none).
  transform.py --palette-from raichu-front.pix on galvanik-back.png,
  plus a luminance-keyed shadow snap so the back's darkest body tones
  land on the front's dark copper #b26529 (bin 36 / value bucket 6) at
  ≥ 2% of body — the 4th value step. Convert --fit matched to current
  back mass/silhouette. Expected bins B {0,52,56,57} → pairJ 0.80.
- PITCHLET (bellsprout): BOTH views — isolation + tight crop, mask
  dilation (honest stem/cup bulk; proportions do not lengthen), shared
  palette = front's shipped palette (posterize both views to it; the
  back's bin-61 yellow snaps to the front's bin-60 yellow), convert
  --fit 62–64. Expected pairJ ≥ 0.71, mass up, ribbon down.
- REGALOTH (slaking): BACK ONLY, palette enrichment, silhouette
  byte-held (mask untouched — colours only). enrich-back.py: within
  the creature mask, remap fur colours onto the front palette's fur
  ramp keyed by source luminance + a soft top-light gradient, so the
  flat mass gains the front's bin-21 (#705b50 family) and bin-37
  (#856f61 family) tones at ≥ 1.5% and ≥ 4 value steps; paw/sole pale
  pixels snap to the ramp top (#8e7c73, bin 37 — NOT the bin-41 belly
  tone, which stays front-only by anatomy). Front byte-identical.
  Expected bins B {0,16,20,21,37} → pairJ 0.83, colours ≥ 10, steps ≥ 5.

## Art-data mechanism (standing, from T1's measured record)
`build-art.mjs` cannot regenerate art-data on base main (45
pre-existing validation errors; a forced regen renames 386 tile
entries + reverts title-keyart). Art-data is updated by
ENTRY-GRANULARITY SPLICE (w11-rig/splice-art-data.mjs): build-art runs
in-clone with its validation gates bypassed locally (never committed),
only the tranche's species entry spans are spliced into the shipped
art-data. Proof: object-level diff = exactly the changed entries,
0 added / 0 removed, entry count unchanged — drift-35 hard gate holds
by construction.

## Environment note
Home quota (EDQUOT) killed the durable-home-worktree route; this wave
builds in a sparse --shared clone at /tmp/w11t2 (research/ and
assets/sprites/designs/ excluded except the 6 tranche PNGs). The
audit's missingDesigns list is therefore long in-clone — designOk does
not affect grades; the trio's own designs ARE present (designOk true).
Commits are pushed early and often against /tmp cycling risk.
