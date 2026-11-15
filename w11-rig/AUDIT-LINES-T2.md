# W11 T2 — battle-art audit lines (scripts/audit-battle-art.mjs)

Fleet: PASS 461 / WATCH 44 / FAIL 0 -> PASS 464 / WATCH 41 / FAIL 0.
Grade changes across the whole 505-record roster: exactly the 3
tranche species, all WATCH -> PASS (object-level audit diff, verified
at each species step and on the final spliced tree).
Uniqueness flags 1489 (+8 exempt) -> 1491 (+8 exempt): +2 net, all
advisory palette-twins on REGALOTH's enriched back (detail below);
zero shared-body flags name any tranche species (plan §5 hard gate).

## GALVAMUS `raichu` (dex 26) — was WATCH 'pair Jaccard < 0.6'
pairJ 0.500 -> 1.000 (back bins {0,52,53,56} -> {0,52,56,57,62} ==
front bins exactly; front .pix byte-identical)
B mass 2210 -> 2210, colours 16 -> 12, steps 3 -> 4, ribbon .018, thin .002, detached 0, specks 0
F unchanged: mass 1729, colours 16, steps 5, pairJ partner of the pair.

## PITCHLET `bellsprout` (dex 69) — was WATCH 'pair Jaccard < 0.6'
pairJ 0.500 -> 0.714 (back bins {0,20,25,41,61} -> {0,25,41,46,60},
a strict subset of the front's {0,24,25,40,41,46,60}; the pair's
yellows now share bin 60)
F mass 629 -> 957, colours 13 -> 16, steps 6, ribbon .267 -> .097, thin .016 -> .006
B mass 621 -> 983, colours 16 -> 10, steps 6 -> 5, ribbon .283 -> .048, thin .019 -> .005

## REGALOTH `slaking` (dex 289) — was WATCH 'colors <= 6' + 'pair Jaccard < 0.6'
pairJ 0.500 -> 0.833 (back bins {0,16,20} -> {0,16,20,21,37}; the
only front bin absent from the back is 41, the belly/face tone —
front-only by anatomy)
B mass 2073 -> 2073 (mask untouched by construction), colours 6 -> 15,
steps 3 -> 5, ribbon .020, thin 0, detached 0, specks 0
F unchanged: mass 1793, colours 16, steps 7.

## Flag disclosure (advisory; no action chartered in this wave)
REGALOTH's back, palette-poor no longer, now palette-twins with other
big rounded backs — the same advisory class the base roster already
carries 1,489 of:
- kabuto x slaking [back] palette-twin sil 0.735 pal 0.500, junior slaking (NEW)
- cyndaquil x slaking [back] palette-twin sil 0.735 pal 0.500, junior slaking (NEW)
- slaking x grumpig [back] palette-twin sil 0.735 pal 0.571, junior grumpig (NEW)
- slaking x regirock [back] palette-twin sil 0.757 pal 0.500 -> 0.833 (pre-existing, palette J rose)
- slaking x groudon [back] palette-twin pal 0.500 (pre-existing, CLEARED)
Net +2. No shared-body flag (sil >= 0.85) names any tranche species,
before or after.
