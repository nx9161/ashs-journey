# W11 T1 — Mass & Bulk (SAPLINT / DASHFERRET / DASHCOON) — SPEC

Base: main `1e15d16d`. Branch: `wave-w11-t1-mass`.
Plan: `~/workspace/muse-directive/WAVE-W11-SPRITE-UPGRADES-PLAN.md` §§1/2/4/7.
Director rulings: fit-first mass technique (OQ5); PNG-converter method
(OQ3); drift-35 byte-identical HARD GATE (OQ6).

## Baseline (audit on base, reproduced)
Fleet: PASS 461 / WATCH 44 / FAIL 0, uniqueness flags 1489 (+8 exempt).

| species | id | grade | pairJ | F mass/col/steps/rib | B mass/col/steps/rib | flags |
|---|---|---|---|---|---|---|
| SAPLINT | ivysaur | WATCH | 0.889 | 483/16/9/.029 | 1373/16/8/.033 | mass < 600 (F) |
| DASHFERRET | furret | WATCH | 1.000 | 454/15/8/.071 | 441/14/8/.077 | mass < 600 (F+B) |
| DASHCOON | linoone | WATCH | 0.500 | 860/16/9/.143 | 570/16/7/.170 | mass < 600 (B), pairJ < 0.6 |

## Targets (plan §1.2, PASS with margin)
pairJ ≥ 0.70 · flagged-view mass ≥ 800 · flagged-view colours ≥ 9 ·
steps ≥ 4 on any view at 3 · wisp ≤ 10% · ribbon ≤ 0.28 · detached 0 ·
≤16 colours · silhouette identity + palette family + W13 design-field
anatomy held (design fields byte-untouched).

## Diagnosis (measured)
The mass defect is a FIT defect: each design source's non-bg bbox is
inflated by picture frames / backdrop panels / detached junk / wash,
so convert-monster's fit scale shrinks the creature (SAPLINT front
fill = 13.8% of its frame). Pair-Jaccard defect (DASHCOON): the two
views are median-cut independently and the back is rendered in a
darker register, so its dominant tan lands in a different 2-bit bin
than the front's.

## Locked recipes (transform.py -> convert-monster.mjs)
- saplint (ivysaur): plain isolation+crop; convert --fit 60. Back same.
- dashlong (furret front): --drop-top 0.2 --dilate 10 --sy 1.5
  --trim-edges --crop-filter --crop-keep-frac 0.25; convert --fit 62.
  (Dilation = honest bulk: the ferret is ribbon-thin; the backdrop
  panel's shadow slab + top border line are removed by trim/filter.)
- dashlong-back (furret back): --sy 1.9; convert --fit 60.
  (Top-down sprint strip: vertical stretch restores body depth.)
- dashcoon (linoone front): --palette-from <shipped linoone-front.pix>
  --pal-fg-thresh 243; convert --fit 60. (Posterize to the pair's own
  shipped palette = the shared-palette construction.)
- dashcoon-back (linoone back): --sx 1.3 --lift 1.32; convert --fit 60.
  (Standing rear figure widened for bulk; colour lift brings the
  darker back register into the front's palette bands.)

## Art-data mechanism (IMPORTANT, measured on base)
`build-art.mjs` CANNOT regenerate art-data on base main: it exits 1
with 45 pre-existing validation errors (40 cast battle-figure outline
errors from W-CHAR1, 4 tile-prop outline errors, tiles palette cap
3595 > 1180) — verified on the untouched primary tree. A forced full
regeneration additionally RENAMES 386 tile entries (shipped keys are
`tile-<name>`, the tool now emits `<name>`) and reverts title-keyart.
Per the standing W17-W rule, art-data is therefore updated by
ENTRY-GRANULARITY SPLICE (`w11-rig/splice-art-data.mjs`): build-art is
run in-clone with its two validation gates bypassed locally (never
committed), and only the 6 species entry spans are spliced into the
shipped art-data. Proof: object-level diff = exactly the 6 entries
changed, 0 added, 0 removed, 4893 entries both sides — the drift-35
hard gate holds by construction.

## Process note
The first build clone was lost when /tmp cycled (2026-11-15 ~21:15Z),
after all art was final but before the battery. Everything is
deterministic; the wave was rebuilt from this spec and the re-run
audit reproduced the final metrics exactly.
