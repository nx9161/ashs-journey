# W11 T3 — Back-Palette (CLIONARCH / VOLTHOUND / BRAWLFROG) — SPEC

Base: main `3861f1c6` (species art-data sha256 b2fc012b… re-verified
this pass — byte-identical across `1e15d16d..3861f1c6` per T2's
measurement, confirmed again by direct sha256 of the base file).
Branch: `wave-w11-t3-backpal`.
Plan: `~/workspace/muse-directive/WAVE-W11-SPRITE-UPGRADES-PLAN.md`
§§1/2/7. Tranche membership per Director brief: CLIONARCH, VOLTHOUND,
BRAWLFROG (plan §4 lists CLIONARCH in T2 / REGALOTH in T3; the
executed split — T2 took GALVAMUS/PITCHLET/REGALOTH — makes T3 the
three named here; techniques are the same back-palette class).
Director rulings carried in: shared-palette re-derivation (plan §2);
PNG-converter method (OQ3); drift-35 byte-identical HARD GATE (OQ6);
fit-first mass technique (OQ5).

## Baseline (audit on base, reproduced in this clone)
Fleet: PASS 461 / WATCH 44 / FAIL 0, uniqueness flags 1489 (+8 exempt).
Zero uniqueness flags name any of the three tranche species.

| species | id | grade | pairJ | F mass/col/steps/rib/thin/det | B mass/col/steps/rib/thin/det | flags |
|---|---|---|---|---|---|---|
| CLIONARCH | manaphy | WATCH | 0.500 | 818/11/6/.175/.035/1 | 663/10/3/.228/.038/1 | pairJ < 0.6 |
| VOLTHOUND | manectric | WATCH | 0.600 | 1807/16/8/.050/.012/0 | 1198/6/4/.067/.007/0 | colours ≤ 6 (B) |
| BRAWLFROG | toxicroak | WATCH | 0.571 | 671/12/6/.183/.016/0 | 658/6/3/.117/.008/0 | colours ≤ 6 (B), pairJ < 0.6 |

Bin diagnosis (audit math: 2-bit/channel bins, hex present at ≥1.5%
of mass). In all three pairs the back's bins are a STRICT SUBSET of
the front's — pairJ is lost entirely on front bins the back never
reaches, never on back-only bins:
- manaphy F {0,27,42,43,47,63} / B {0,27,47} — back under threshold on
  C #949584 bin42 (1.1%), F #87b1c3 bin43 (0.8%), K #e8f2f7 bin63 (0.5%).
- manectric F {0,16,20,21,40,41,57,60,61,62} / B {0,16,20,40,41,60} —
  back lacks the front's pale mane bins 61 (~14% of front) + 62, the
  mid-highlight K bin57 (5.6%) and the brown F bin21 (2.4%). The back
  design is flat vector yellow: the mane renders in one mid tone.
- toxicroak F {0,1,5,16,21,32,41} / B {0,1,5,21} — back lacks E #432434
  bin16 (plum speckle tone, 3.9% of front), F #962036 bin32 (throat
  red, 6.6%), G #8c8a7c bin41 (pale grey, 5.5%). The back DESIGN is
  rich (purple speckles, glove highlights) — conversion dropped them.

## Targets (plan §1.2, PASS with margin)
pairJ ≥ 0.70 aim (≥ 0.60 = brief floor, disclose if under aim) ·
flagged-view colours ≥ 9 (both flagged backs 6 → ≥ 9) · steps ≥ 4 on
views at 3 (manaphy back, toxicroak back) · BRAWLFROG bulk both views
671/658 → ≥ 750 aim (plan §2) · CLIONARCH detached 1/1 → 0/0 and wisp
3.5%/3.8% → ≤ 2% aim (plan §2; brief hard bar ≤ 35%) · ribbon ≤ 0.28 ·
≤ 16 colours · silhouette identity + palette family + W13
design-field anatomy held (design fields byte-untouched).

## Locked approach per species
- VOLTHOUND (manectric): BACK ONLY (front byte-identical, plan §2).
  enrich-ramp.py (T3 generalization of T2's enrich-back.py): the back
  design's creature pixels are recoloured onto the FRONT palette's
  yellow ramp (B #572a21 / E #7d5b23 / F #7f5e41 / G #a3902c /
  H #aa9645 / K #c9bd59 / A #d5c734 / L #e6e25c / C #f1ee82 /
  M #f5f37d — every front bin 16/20/21/40/41/57/60/61/62 represented),
  keyed by source luminance + a soft top-light field: the mane —
  which sits at the TOP of the back view — catches the pale bins
  61/62 the front's mane carries, the body holds A/G, the lower
  shading lands F/E. Mask untouched → silhouette, bbox, mass are the
  shipped ones by construction. Then convert --fit 60 (as shipped).
- BRAWLFROG (toxicroak): BOTH views. transform.py isolation + tight
  crop (fit recovery for bulk) + posterize to the pair's own shipped
  palette (shared-palette construction, T1 dashcoon precedent), so
  the back design's plum speckles and pale highlights quantize onto
  E/G/I/J/K instead of being median-cut away; convert --fit 62.
  Expected: back colours 6 → ≥ 9, back bins gain 16 (+41 if the
  glove highlights snap to G) → pairJ 0.714–0.857 (bin32 throat red
  stays front-only by anatomy — the sac does not wrap the back; the
  plan's ≥ 0.70 target is met without it), back steps 3 → ≥ 4 via
  the G/J luminance buckets, mass up via fit recovery.
- CLIONARCH (manaphy): BOTH views. transform.py isolation (the
  design's floating bubbles/sparkles are minor components and drop;
  the antenna orbs stay — they are the design's crown-antennae tips)
  + mask dilation (extremity consolidation: antenna stalks and
  fin-gown edges thickened so they survive downscale CONNECTED —
  detached 1/1 → 0/0 — and wisp falls) + posterize to the pair's
  shared shipped palette; convert --fit 60/62, --boost-thin in
  reserve. Expected: back bins gain 43 (+42/63 as the crown/pale
  shares allow) → pairJ ≥ 0.667, aim 0.833+; back steps 3 → 4 via
  the K bin63 luminance bucket at ≥ 2% of body.

## Art-data mechanism (standing, from T1/T2's measured record)
`build-art.mjs` cannot regenerate art-data on base main (45
pre-existing validation errors; a forced regen renames 386 tile
entries + reverts title-keyart). Art-data is updated by
ENTRY-GRANULARITY SPLICE (w11-rig/splice-art-data.mjs): build-art
runs in-clone with its validation gates bypassed locally (never
committed; tool restored before commit), only the tranche's species
entry spans are spliced into the shipped art-data. Proof: object-
level diff = exactly the changed entries, 0 added / 0 removed,
4893 entries — drift-35 hard gate holds by construction.
