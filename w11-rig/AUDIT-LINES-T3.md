# W11 T3 — battle-art audit lines (scripts/audit-battle-art.mjs)

Fleet: PASS 461 / WATCH 44 / FAIL 0 -> PASS 464 / WATCH 41 / FAIL 0.
Grade changes across the whole 505-record roster: exactly the 3
tranche species, all WATCH -> PASS (object-level audit diff, verified
at each species step and on the final spliced tree).
Uniqueness flags 1489 (+8 exempt) -> 1490 (+8 exempt): +1 net, one
advisory palette-twin on VOLTHOUND's enriched back (detail below);
zero shared-body flags name any tranche species (plan §5 hard gate).

## VOLTHOUND `manectric` (dex 310) — was WATCH 'colors <= 6' (back)
pairJ 0.600 -> 1.000 (back bins {0,16,20,40,41,60} -> {0,16,20,21,40,
41,57,60,61,62} == front bins exactly; front .pix byte-identical)
B mass 1198 -> 1198 (mask untouched by construction), colours 6 -> 12,
steps 4 -> 8, ribbon .067, thin .007, detached 0, specks 0
F unchanged: mass 1807, colours 16, steps 8.

## BRAWLFROG `toxicroak` (dex 454) — was WATCH 'colors <= 6' + 'pair Jaccard < 0.6'
pairJ 0.571 -> 0.625 (back bins {0,1,5,21} -> {0,1,5,16,21}; the two
front bins left unmatched are bin32 throat red — the sac does not
wrap the back, front-only by anatomy — and bin41/bin63, whose back
shares land at colour level but under the 1.5% bin threshold)
F mass 671 -> 722, colours 12, steps 6, ribbon .183 -> .194
B mass 658 -> 770, colours 6 -> 9, steps 3 -> 4, ribbon .117 -> .032,
thin .009, detached 0, specks 0 (E #432434 plum speckle tone: 0 -> 56
px; H #484c59 shade step: -> 13 px = 2.6% of body, the 4th bucket)

## CLIONARCH `manaphy` (dex 490) — was WATCH 'pair Jaccard < 0.6'
pairJ 0.500 -> 1.000 (back bins {0,27,47} -> {0,27,42,47,63} == front
bins exactly)
F mass 818 -> 896, colours 11 -> 12, steps 6 -> 5, ribbon .175 ->
.167, thin .035 -> .025, detached 1 -> 0, specks 0
B mass 663 -> 736, colours 10 -> 10, steps 3 -> 5, ribbon .228 ->
.217, thin .038 -> .030, detached 1 -> 0, specks 0
(The antenna-tip orbs, detached at sprite scale in both shipped
views, are CONNECTED in both redrawn views — consolidation, not
removal: the orbs render at the stalk tips, pale K at 15 px.)

## Flag disclosure (advisory; no action chartered in this wave)
- manectric x heatran [back] palette-twin sil 0.722 pal 0.500,
  junior heatran (NEW — VOLTHOUND's enriched back now shares palette
  family with other big yellow-brown backs; silhouette 0.722 is well
  under the 0.85 shared-body line).
Net +1. No shared-body flag (sil >= 0.85) names any tranche species,
before or after.
