// tests/placement-gates-checks.mjs — Wave W4 (War Room E2E Phase 2):
// the strict placement-gates guard. Standalone suite in the repo's
// checks style:
//   node tests/placement-gates-checks.mjs
//
// WHY THIS EXISTS: two towns reported "done" — Arcport and Flintridge —
// failed the STRICT per-town placement gates (audit Cluster 1). The W4
// root-cause pass found the failures were mostly AUDIT-INSTRUMENT
// defects, not town defects:
//   * the network tier did not count boardwalk, so Arcport's authored
//     dock street was invisible to it (connectivity 72/110, gym
//     step-offs 5/7 — while the walkable graph connects 177/177);
//   * the BUILD classifier missed the kit's structural kinds (gym-rock,
//     gym-volt, fossildisplay, dresswindow, ancientpillar), so single
//     buildings fragmented into fake footprints (Flintridge's Mart read
//     as a merged pair; its museum/gym complex at 0.32 ring clearance);
//   * the apron ring counted the town frame (cavewall cliff face) as a
//     crowding neighbour, measuring the frame instead of the building.
// The remainder was town-side: six unmarked junctions in Flintridge,
// five in Arcport (counted once the dock street is visible), and two
// Arcport lamps straddling fabric seams. W4 fixed both sides, and the
// audit-side fixes are deliberately SCOPED (a per-town street-material
// registry with exactly one entry; classifier corrections that move no
// other town). This suite is the ratchet that keeps them scoped.
//
// WHAT THIS GATE HOLDS:
//  1. THE REGISTRY IS EXACTLY { vermilion: ['boardwalk'] } — any new
//     entry is a reviewed act, never a silent widening.
//  2. BOTH W4 TOWNS PASS the strict gates on the production scoring
//     path (scoreTown + tiersFor + gateCheck, as the CLI runs them).
//  3. NEGATIVE: vermilion scored with RAW tiers still fails, with the
//     pre-W4 connectivity/step-off numbers (72/110, 5/7) — the
//     registration is load-bearing and the old blindness reproducible.
//     (Its raw component count pins at 1, not the pre-W4 2: the town-
//     side lamp re-seat retired the isolated shore cell that used to
//     form the second component.)
//  4. NO OTHER TOWN MOVES: every town's full gate tuple equals its
//     pinned value below (pre-W4 baselines for the untouched towns;
//     post-W4 values for vermilion + pewter). Any future change to
//     the audit's tiers/classifiers or to a town's data that moves a
//     tuple fails HERE, by town — update the pin in the same commit
//     as a reviewed change (the W3 burn-down rule).
//     ONE DOCUMENTED EXCEPTION: rustboro's pin is its POST-W4 tuple.
//     Rustboro carries four fossildisplay cells (its fossil exhibits);
//     the BUILD correction counts them as the mass they are, refining
//     its apronMin 0.875 -> 0.833. Its gate STATUS and apronLow are
//     unchanged (PASS before and after) — a measurement refinement of
//     one sub-metric, disclosed here and in the W4 repair note.
//     Tuple: [pass, connOk, connPairs, stepTouch, stepTot, components,
//     SECOND DOCUMENTED EXCEPTION (T19 merge): cianwood's pin is its
//     POST-T19 tuple. The Tidewall rebuild (gym terrace + worn steps,
//     jetty footing repaired) moved the town FAIL -> PASS: conn
//     42/72 -> 72/72, junctionSites 2 -> 6, apronMin 0.824 -> 0.688,
//     strict 0.9591 -> 0.7965, fabric 0.9926 -> 0.9993 — the rebuilt
//     town's measured values, re-pinned at the T19 director merge.
//     THIRD DOCUMENTED EXCEPTION (T20): mahogany's pin is its POST-T20
//     tuple. The Redwood rebuild replaced the shipped tg2 mud field
//     (194 of 504 cells) with the calm-grass + path-fabric town of the
//     approved design: junctions 3 -> 5 (all marked), apronMin
//     0.857 -> 0.786 (nine freestanding buildings where four stood on
//     the north strip; still above the 0.6 gate), strict 0.9727 ->
//     0.9332, fabric 1 -> 1. Gate STATUS unchanged (PASS before and
//     after); conn/step-offs identical (156/156, 7/7) on honest
//     materials — the shipped pass was measured on mud counted as
//     fabric. Re-pinned with the T20 build.
//     FOURTH DOCUMENTED EXCEPTION (T21): blackthorn's pin is its
//     POST-T21 tuple. The Cragmoor rebuild replaced the shipped tg2
//     mud checkerboard (208 of 540 cells) with the calm-grass +
//     path-fabric town of the approved design: junctions 5 -> 7 (all
//     marked), apronMin 0.824 -> 0.813 (six freestanding buildings
//     where four stood on the north strip; still above the 0.6
//     gate), strict 0.9534 -> 0.7712, fabric 0.9867 -> 0.988. Gate
//     STATUS unchanged (PASS before and after); conn/step-offs
//     identical (156/156, 7/7) on honest materials — the shipped
//     pass was measured on mud counted as fabric. Re-pinned with
//     the T21 build.
//     FIFTH DOCUMENTED EXCEPTION (T22): silvertown's pin is its
//     POST-T22 tuple. The Lastlight rebuild replaced the shipped tg2
//     mud slab (161 of 540 cells) with the calm-grass + path-fabric
//     town of the approved design: gate STATUS FAIL -> PASS (fabric
//     0.9747 -> 0.9886 on honest materials — the mud counted as
//     fabric and still fell short), junctions 6 -> 13 (all marked;
//     the directions text now stands on visible S tiles at real
//     junctions), apronMin 0.929 -> 0.706 (eight freestanding
//     buildings + the forge where four stood on the north strip;
//     still above the 0.6 gate), unanchoredAny 1 -> 0 (the td post
//     at (13,13) anchored by the forge stamp), strict 0.9125 ->
//     0.6299 (the street grid gives desire lines real corners to
//     cut; still above the 0.60 gate). Conn/step-offs identical
//     (90/90, 6/6). Re-pinned with the T22 build.
//     SIXTH DOCUMENTED EXCEPTION (T23): littleroot's pin is its
//     POST-T23 tuple. The Rootlet rebuild replaced the shipped
//     tg2/tg checkerboard (Ἅ mud across the town interior) with
//     the calm-grass + sand-fabric town of the approved design:
//     gate STATUS stays PASS, now on honest materials (fabric
//     0.987 -> 0.9848 — the shipped number leaned on tg2 counting
//     as network; the new fabric is streets alone), junctions
//     6 -> 15 (all marked; four direction texts shipped invisible
//     on plain grass, now on visible S tiles at real junctions,
//     T22-style verbatim repeats), apronMin 0.929 -> 0.714 (three
//     added facade houses where the design shows them; still
//     above the 0.6 gate), strict 0.8968 -> 0.674 (desire lines
//     get real corners; still above the 0.60 gate). Conn/step-offs
//     identical (90/90, 8/8), unanchoredAny identical (1, the
//     shipped frame decor at (24,17)). Re-pinned with the T23 build.
//     SEVENTH DOCUMENTED EXCEPTION (W-DIFF pilot): blackthorn's pin is
//     its POST-W-DIFF tuple. The distinctiveness pilot gave Cragmoor
//     the Basalt Sett & Drake-Gable kit (owner ruling 2026-11-13:
//     "Every town kit should be different"): sand path -> settfloor
//     (registered street material, STREET_REGISTRY), house roofs ->
//     drakeroof, tg2 scree at the Den apron + smithy yard. Junction
//     sites 7 -> 6 (the sett network merges one cluster; all 6 still
//     marked, junctionsBare 0), strict 0.7712 -> 0.7915 (more of the
//     town stands on strict-tier material). Gate STATUS unchanged
//     (PASS); conn/step-offs/apronMin/fabric identical (156/156,
//     7/7, 0.813, 0.988). Re-pinned with the W-DIFF pilot.
//     EIGHTH DOCUMENTED EXCEPTION (W-DIFF pilot): silvertown's pin
//     is its POST-W-DIFF tuple. Lastlight got the Marble Slab &
//     Parapet kit: sand path -> marblefloor (registered), house
//     roofs -> parapetroof, tg2 aprons chained around Center/Mart/
//     Stadium, two parterre flowerbed grids. Junction sites 13 -> 15
//     (all marked), strict 0.6299 -> 0.6654, fabric 0.9886 -> 0.9896.
//     Gate STATUS unchanged (PASS); conn/step-offs/apronMin identical
//     (90/90, 6/6, 0.706). Re-pinned with the W-DIFF pilot.
//     NINTH DOCUMENTED EXCEPTION (W-DIFF2): ecruteak's pin is its
//     POST-W-DIFF2 tuple. Lantern City got the Cedar & Ashen Stone
//     kit (owner ruling 2026-11-13, W-DIFF-AUDIT Phase B): sand
//     path -> wornfloor (registered street material), house roofs
//     -> cedarroof, charred tg2 patches at the Ashen (west) tower
//     yard, the 9 street lamps -> lanternpost props. Only the
//     strict mean moved: 0.7915 -> 0.7992 (desire paths cross the
//     charred strict-tier yard at the tower). Gate STATUS unchanged
//     (PASS); conn/step-offs/junctions/apronMin/fabric identical
//     (156/156, 11/11, 6 sites all marked, 0.625, 0.9937).
//     Re-pinned with W-DIFF2.
//     TENTH DOCUMENTED EXCEPTION (W-DIFF2): saffron's pin is its
//     POST-W-DIFF2 tuple. Farsight City got the Gold Spire & Avenue
//     Slab kit: sand path -> avenuefloor (registered), house + HQ
//     roof rows -> slabroof (gold trim), two planted flowerbed
//     grids, five avenue lamps added on tg shoulders. Strict
//     0.7649 -> 0.8655 (desire paths ride the avenue grid), apronMin
//     0.875 -> 0.857 (still well above the 0.6 gate). Gate STATUS
//     unchanged (PASS);
//     conn/step-offs/junctions/fabric identical (156/156, 10/10,
//     2 sites all marked, 1.0). Both saffron copies (maps2/maps3)
//     edited identically; the map-id registry baseline line was
//     updated in the same commit per its burn-down rule.
//     Re-pinned with W-DIFF2.
//     ELEVENTH DOCUMENTED EXCEPTION (T24): oldale's pin is its POST-T24
//     tuple. The Eldergrove rebuild replaced the shipped tg2 field
//     (198 of 504 cells ἕ mud — the worst Maris share yet) with the
//     calm dry-meadow + sand-fabric crossroads of the approved
//     design, the Flower Clock bed + prop at the shipped clock
//     garden, three thatch-roof facade houses, and the orphaned
//     MART CLERK re-seated at his Mart's front apron: gate STATUS
//     flips FAIL -> PASS on honest materials (fabric 0.9665 ->
//     0.9821 — the shipped number leaned on tg2 counting as network;
//     the new fabric is streets alone), junctions 4 -> 11 (all
//     marked; both shipped direction texts stood invisible on plain
//     grass, re-seated onto S tiles at real junctions; six more
//     verbatim direction texts at the new junctions, T23 pattern),
//     strict 0.9301 -> 0.6991 (desire lines get real corners; still
//     above the 0.60 gate). Conn/step-offs identical (110/110, 5/5),
//     apronMin identical (0.857), unanchoredAny identical (1 — the
//     instance moves: the shipped border-frame decor cell is
//     anchored once the frame reads as meadow, and the clock-
//     garden's shoulder decor beside the new clockbed kind counts
//     instead; 1/45, well under the 5% gate). Re-pinned with the
//     T24 build.
//     TWELFTH DOCUMENTED EXCEPTION (T25): petalburg's pin is its
//     POST-T25 tuple. The Meadowbrook rebuild replaced the shipped
//     tg2 field (197 of 540 cells Ἕ mud — 36.5%) with the calm
//     meadow + street fabric of the approved design: sageroof stone
//     courses, the gym's scales crown, the east pond's heron prop,
//     reedbank pond edges, two sage facade houses, and the orphaned
//     MART CLERK re-seated at his Mart's front apron (9,4). Gate
//     STATUS holds PASS — the shipped pass leaned on tg2 counting
//     as network; the new fabric is streets alone (0.9944 -> 0.9896,
//     now honest), conn/step-offs identical (110/110, 7/7),
//     junctions 6 -> 10 with 1 bare (all four shipped direction
//     texts stood invisible on plain ground/mud; re-seated onto S
//     tiles at real junctions, four more verbatim copies at the new
//     junctions, T23/T24 pattern), strict 0.9611 -> 0.6643 (desire
//     lines get real corners; above the 0.60 gate), apronMin
//     0.857 -> 0.643 (sage facades stand at the town frame; above
//     the 0.60 floor), unanchoredAny identical (1 — the shipped
//     border-frame decor at (24,17), as shipped). Re-pinned with
//     the T25 build.
//
//     THIRTEENTH DOCUMENTED EXCEPTION (W-DIFF3): the registry grows by
//     one scoped entry — violet: [violetfloor] — on the same terms
//     as exceptions seven through ten: Iris City's CLEAN identity
//     build record (W-DIFF-AUDIT Phase B, Tower Stone & Maple)
//     authors violetfloor (idx 592; re-indexed from 588 at merge
//     time — Wave T25 took 588-591) AS the town's street fabric
//     (140 path cells swapped 1:1), and its absence from the
//     network tier would blind the instrument exactly as in W4.
//     Violet's pin re-pins on ONE field only: apronMin 0.65 -> 0.60
//     — the Newleaf Tower's apron ring now carries the two new
//     shoulder maples at (11,2),(19,2) that complete the table's
//     maple ring; two further pairs were tested in-build and
//     reverted on gate evidence (the W-DIFF apron-trim pattern):
//     a door-row pair at (11,3),(19,3) took the tower apron to
//     0.55, under the 60% gate, and a frame-row pair at
//     (10,1),(20,1) sealed the lawn cells at (11,1),(19,1)
//     (reachability dead pockets 1132 -> 1134, restored to 1132
//     by the revert). Pass, conn (156/156), step-offs (9/9),
//     junctions, strict (0.9083) and fabric (0.9967) are
//     identical; the same build swapped 20 house-roof cells to
//     the towerroof kind (idx 593, BUILD classifier), which does
//     not move the tuple. Re-pinned with the W-DIFF3 build.
//
//     FOURTEENTH DOCUMENTED EXCEPTION (W-DIFF4): the registry
//     grows by one scoped entry — azalea: [brickfloor] — on the
//     same terms as exceptions seven through thirteen: Cinder
//     Town's CLEAN identity build record (W-DIFF-AUDIT Phase B,
//     Charcoal & Kiln Brick) authors brickfloor (idx 594) AS the
//     town's street fabric (148 path cells swapped 1:1), and its
//     absence from the network tier would blind the instrument
//     exactly as in W4. Azalea's pin re-pins on ONE field only:
//     fabric 0.9977 -> 0.9923 — the identity table's ground
//     treatment ('tg + ash accents at kilns') dresses five
//     tg-azalea cells at the twin kilns' mouths ((4,11),(5,11),
//     (1,12),(3,12),(4,12)) with the existing H3a ashground
//     kind; tg counts in the fabric tier and ashground does not,
//     so the fabric share falls by exactly those five cells
//     (CHARCOAL KID's footing at (5,12) byte-kept). Pass, conn
//     (132/132), step-offs (8/8), junctions, apronMin (0.688)
//     and strict (0.7723) are identical; the same build swapped
//     17 house-roof cells to the mossroof kind (idx 595, BUILD
//     classifier; Center/Mart/Gym stamps byte-kept), which does
//     not move the tuple. Re-pinned with the W-DIFF4 build.
//
//     FIFTEENTH DOCUMENTED EXCEPTION (W-DIFF4): the registry
//     grows by one scoped entry — mahogany: [gravelfloor] — on
//     identical terms: Redwood Town's CLEAN identity build
//     record (W-DIFF-AUDIT Phase B, Pine & Lake Gravel) authors
//     gravelfloor (idx 596) AS the town's street fabric (171
//     path cells swapped 1:1). Mahogany's pin does NOT move:
//     pass, conn (156/156), step-offs (7/7), junctions (5/5),
//     apronMin (0.786), strict (0.9332) and fabric (1) are all
//     identical — the exception records the registry growth
//     only. The same build swapped 18 house-roof cells to the
//     pineroof kind (idx 597, BUILD classifier; Center/Mart/Gym
//     stamps byte-kept; the souvenir-shop facade at Pell's post
//     (20,6) unmoved — its roof row wears the town kit like
//     every house roof), and the table's ground treatment
//     ('tg + meadow/pond') is T20's shipped pond + meadow at
//     encounter parity, byte-kept. Re-pinned with the W-DIFF4
//     build (registry scope only).
//     SIXTEENTH DOCUMENTED EXCEPTION (T26): the registry grows by
//     (renumbered at merge — the branch's #14 was taken on main by
//     W-DIFF4's azalea #14 / mahogany #15)
//     one scoped entry — rustboro: [cutstonefloor] — on the same
//     terms as the exceptions above, and rustboro's pin is its
//     POST-T26 tuple. The Copperton rebuild replaced the shipped
//     tg2 field (249 of 540 cells ἥ mud — 46.1%, the worst share
//     of any town) with the calm ground + cut-stone fabric of the
//     approved design: coproof copper-seamed roofs (idx 598),
//     cutstonefloor avenue stone (idx 599; the -floor suffix the
//     desire-path tiers key on), the travstone prop (idx 600) on
//     its court between the shipped fossil displays, gardenfloor
//     HQ-forecourt beds (idx 601), two facade houses, and the
//     orphaned MART CLERK re-seated at his Mart's front apron
//     (9,4). Gate STATUS holds PASS — the shipped pass leaned on
//     the mud sea counting as one 266-cell fabric component; the
//     new fabric is streets alone (0.9877 -> 0.9828, now honest),
//     conn/step-offs identical (156/156, 7/7), junctions identical
//     (5 sites, now 5/5 marked — both shipped DIRS records stood
//     invisible on plain ground; re-seated onto S tiles at real
//     junctions, four more verbatim copies at the new junctions,
//     T23-T25 pattern, and the HQ sign stepped one cell south off
//     the street line), strict 0.9566 -> 0.7274 (desire lines get
//     real corners; above the 0.60 gate), apronMin 0.833 -> 0.714
//     (the facade houses stand in the open meadow; above the 0.60
//     floor), unanchoredAny identical (0). (Indices 598-601 per
//     the Director's index ruling: W-DIFF4 holds 594-597.)
//     Re-pinned with the T26 build.
//     SEVENTEENTH DOCUMENTED EXCEPTION (W-DIFF5): the registry
//     grows by one scoped entry — fuchsia: [marshfloor] — on
//     the same terms as exceptions seven through sixteen:
//     Bramble City's CLEAN identity build record (W-DIFF-AUDIT
//     Phase B, Thatch & Marsh) authors marshfloor (idx 602)
//     AS the town's street fabric (87 path cells swapped; the
//     marsh-landing shore — row 12 x6-10 + the row-13 exits —
//     stays sand path, the table's boardwalk + sand split),
//     and its absence from the network tier would blind the
//     instrument exactly as in W4. Fuchsia's pin re-pins on
//     ONE field only: strict 0.8625 -> 0.8842 — the build's
//     two marshreed props seal the tg cells at the east
//     pool's NW lip ((11,12),(12,11)), and the desire lines
//     that used to cut the marsh edge now ride the boardwalk
//     instead, raising the strict-tier share (gate PASS;
//     pass, conn (182/182), step-offs (9/9), junctions (3/3),
//     apronMin (0.643) and fabric (0.9952) are identical).
//     The same build swapped 13 house + Preserve gatehouse
//     roof cells to the safariroof kind (idx 603, BUILD
//     classifier; Center/Mart/Gym stamps byte-kept) and
//     dressed three tg cells at the east pool with the
//     existing marshbog kind. Two in-build trims on gate
//     evidence (the W-DIFF3/W-DIFF4 pattern): a five-cell
//     bog draft was cut to the east three — the west pair
//     at (5,12),(11,12) sits on the desire lines to the
//     Preserve gate + south exit and took fabric 0.9952 ->
//     0.977, under the 0.98 gate — and the reeds' first
//     seats at (17,11),(18,11) sealed the marsh strip's
//     only corridor (dead pockets 1132 -> 1139), so they
//     moved to the pool lip, restoring 1132. Both fuchsia
//     copies (maps2/maps3) edited identically; the map-id
//     registry baseline line was updated in the same commit
//     per its burn-down rule. Re-pinned with the W-DIFF5
//     build.
//     EIGHTEENTH DOCUMENTED EXCEPTION (W-DIFF5): the registry
//     grows by one scoped entry — cianwood: [driftfloor] —
//     on identical terms: Tidewall City's CLEAN identity
//     build record (W-DIFF-AUDIT Phase B, Driftwood & Surf
//     Stone) authors driftfloor (idx 604) AS the town's
//     street fabric (93 path cells swapped — the inland
//     streets + the pier approach; the shore promenade rows
//     13-14 stays sand path, the table's pier + sand split).
//     Cianwood's pin does NOT move: pass, conn (72/72),
//     step-offs (7/7), junctions (6/6), apronMin (0.688),
//     strict (0.7965) and fabric (0.9993) are all identical
//     — the exception records the registry growth only. The
//     same build swapped 10 house-roof cells to the
//     surfroof kind (idx 605, BUILD classifier; the gym's
//     tr- roof + terrace, the Center/Mart stamps and NOOR's
//     pinned post cell (24,5) byte-kept), and the table's
//     herb gardens are T19's shipped pharmacy flowerbeds,
//     byte-kept. Re-pinned with the W-DIFF5 build (registry
//     scope only).
//     NINETEENTH DOCUMENTED EXCEPTION (T27): the registry grows by
//     one scoped entry — dewford: [plankfloor] — on the same terms
//     as the exceptions above, and dewford's pin is its POST-T27
//     tuple. The Mistford rebuild replaced the shipped tg2 field
//     (182 of 504 cells Ἥ mud — 36.1%) with the calm ground +
//     boardwalk fabric of the approved design: shackroof surf-teal
//     shakes (idx 608), plankfloor boardwalk streets (idx 609; the
//     -floor suffix the desire-path tiers key on), the barbells
//     prop (idx 610) outside Enzo's gym, the chalkboard prop
//     (idx 611) beside TRENDWATCHER IO — chalk marks, no text: the
//     backstory audit's proposed board line was never backend
//     data — and the barrels prop (idx 612) beside the Mart, two
//     facade cottages, and the orphaned MART CLERK re-seated at
//     his Mart's front apron (9,4). Gate STATUS flips FAIL -> PASS
//     — the shipped town failed outright (fabric 0.9625, conn
//     72/110 leaning on the mud, one starved apron at 0.588); the
//     new fabric is streets alone (conn 110/110, junctions 8/8
//     marked — all five shipped DIRS records stood invisible on
//     plain ground or surf shallows; they gained S tiles at their
//     posts and four verbatim copies mark the new junctions,
//     T23-T26 pattern; the west DIRS post re-seated one cell SE
//     to (2,10) so its tile does not seal the west-edge meadow
//     into a dead pocket — reachability holds the fleet baseline
//     1132), strict 0.9625 -> 0.6945 (desire lines get real
//     corners; above the 0.60 gate), apronMin 0.588 -> 0.625
//     (one cliff-foot flower cell lifts the Center's ring over
//     the line), unanchoredAny identical (0), and the wet-sand
//     beach kind (67 cells of brown striping) retired to the
//     shipped pale psand — one cell kept under the beach lamp so
//     the lamp is not straddled. (Kind indices 608-612: first
//     registered 602-606, re-indexed above W-DIFF5's 602-607
//     block under the Director's ruling, 79 map cells remapped
//     losslessly.) Re-pinned with the T27 build.
//     TWENTIETH DOCUMENTED EXCEPTION (W-DIFF6): the registry
//     grows by one scoped entry — viridian: [slatefloor] — on
//     identical terms: Fernmere City's CLEAN identity build
//     record (W-DIFF-AUDIT Phase B, Slate Gable & Evergreen)
//     authors slatefloor (idx 613) AS the town's street fabric
//     (90 path cells swapped — every street, avenue and exit
//     landing). Viridian's pin does NOT move: pass, conn
//     (240/240), step-offs (7/7), junctions (3 sites, 0 bare),
//     apronMin (0.643), strict (0.933) and fabric (1) are all
//     identical — the exception records the registry growth
//     only. The same build swapped 13 house-roof cells to
//     the slateroof kind (idx 614, BUILD classifier; the
//     four houses — Marlow's included; the gym's roof-slate
//     band, the Center's roof-center, the Mart's tr- stamp,
//     Marlow's tortoise cell (17,6) and the heavy fence
//     family byte-kept). Viridian is a drifted triple
//     definition (map-id registry status D): ONLY the live
//     maps3 copy was swapped, its registry fingerprint
//     updated in the same commit per the burn-down rule;
//     the maps/maps2 copies stay frozen. Re-pinned with
//     the W-DIFF6 build (registry scope only).
//     TWENTY-FIRST DOCUMENTED EXCEPTION (W-DIFF6): the
//     registry grows by one scoped entry — celadon:
//     [promfloor] — on identical terms: Canopy City's CLEAN
//     identity build record (W-DIFF-AUDIT Phase B, Glass
//     Dome & Promenade) authors promfloor (idx 615) AS the
//     town's street fabric (103 path cells swapped — the
//     avenues are the promenade). Celadon's pin does NOT
//     move: pass, conn (156/156), step-offs (10/10),
//     junctions (3 sites, 0 bare), apronMin (0.611), strict
//     (0.9725) and fabric (1) are all identical — the
//     exception records the registry growth only. The same
//     build swapped 12 house-roof cells to the glassroof
//     kind (idx 616, BUILD classifier; the Mart's, Center's
//     and Dept Store's tr- roofs, the Game Corner + Dept
//     Store tl- frontages, the gym-leaf band and T8's
//     flowerbed promenade dressing byte-kept). Re-pinned
//     with the W-DIFF6 build (registry scope only).
//     TWENTY-SECOND DOCUMENTED EXCEPTION (T28): the registry grows by
//     one scoped entry — slateport: [quayfloor, boardwalk] — on
//     the same terms as the exceptions above (boardwalk on the
//     vermilion terms: slateport was one of the three towns the
//     registry comment names as deliberately unregistered, its
//     pier fabric-invisible until its rebuild wave; this is that
//     wave), and slateport's pin is its POST-T28 tuple. The
//     Fairhaven rebuild replaced the shipped tg2 field (282 of
//     600 cells ἵ mud — 47.0%, the worst share yet) with the calm
//     ground + quay-stone fabric of the approved design:
//     canvasroof stitched-canvas roofs (idx 617), quayfloor
//     running-bond streets (idx 618; the -floor suffix the
//     desire-path tiers key on), the marketstall prop (idx 619,
//     eight stalls in two rows on the shipped market ground),
//     the tideboard prop (idx 620, wave/sun/moon glyphs, no
//     text) at the quay, the shiphull prop (idx 621, Merrick's
//     hull on its stocks — redrawn once after the first draft
//     read as a gantry frame), two facade cottages, and the
//     orphaned MART CLERK re-seated at his Mart's front apron
//     (9,4). Gate STATUS flips FAIL -> PASS — the shipped town
//     failed outright (conn 56/90: the unregistered pier cut
//     the r109 exits off from every door; fabric 0.9972 leaning
//     on the mud); the new fabric is streets + the registered
//     pier alone (conn 90/90, junctions 10/10 marked — all six
//     shipped DIRS records stood invisible on the mud; they
//     gained S tiles at their posts and six verbatim copies
//     mark the new junctions, T23-T27 pattern; the yard lane
//     drops east of the shipped (23,10) lamp so the lamp is
//     never straddled, and the pier's (18,16) boardwalk lip is
//     byte-kept), strict 0.9972 -> 0.6244 (desire lines get
//     real corners; above the 0.60 gate), apronMin 0.875 ->
//     0.857, unanchoredAny identical (0), reachability holds
//     the fleet baseline 1132. (Kind indices 617-621: first
//     planned 613-617, re-assigned above W-DIFF6's 613-616
//     block under the Director's index ruling of 2026-11-13 —
//     before any registration existed, so no cells were
//     remapped.) Re-pinned with the T28 build.
//     TWENTY-THIRD DOCUMENTED EXCEPTION (W-DIFF7): the registry grows by
//     one scoped entry — cerulean: [pierfloor] — on the same terms as the
//     exceptions above: Tidehaven City's CLEAN identity retrofit
//     (Boardwalk & Mansard, W-DIFF-AUDIT Phase B) authors pierfloor
//     (idx 622) AS the town's street fabric — vertical sea-worn pier
//     planks swapped onto all 90 sand-path street cells. The identity
//     table names 'boardwalk' as Tidehaven's street, but boardwalk is
//     vermilion's registered material (W4): the W-DIFF5 precedent (the
//     table's shared 'boardwalk' became Bramble's marshfloor and
//     Tidewall's driftfloor) gives Tidehaven its own pier timber in the
//     same register. The town's 11 shipped boardwalk cells (dock edge,
//     south shore, exit aprons) STAY boardwalk — the table's own
//     street/shore split, and a gate-driven trim: converting them
//     created a second, bare junction where the shore strip meets the
//     exit spine (junctions 1 -> 2, bare 0 -> 1, gate FAIL); with the
//     split cerulean's pin is FULLY IDENTICAL to its pre-wave tuple
//     (conn 132/132, strict 0.7314, fabric 0.9839). The retrofit also
//     swapped the town's 21 th- roof cells to mansardroof (idx 623,
//     BUILD classifier; a true mansard in the KIT_VARIANTS cerulean
//     tones — houses and the Mart's roof row alike, the shipped Mart
//     wearing th- rather than a stamp roof; the Center's roof-center
//     stamp, the gym pool hall, every door/sign byte-kept).
//     TWENTY-FOURTH DOCUMENTED EXCEPTION (W-DIFF7): vermilion's
//     NEGATIVE raw-tier pins re-pin (section 3 below) — and nothing
//     else of vermilion's moves. Arcport's retrofit completes the W4
//     registration: its last 45 sand-path street cells swap to the
//     boardwalk material it already owns, and its 12 th- roof cells
//     swap to copperroof (idx 624, BUILD classifier; a standing-seam
//     copper gable in the KIT_VARIANTS vermilion tones — 'coproof' is
//     Copperton's T26 kind, so Arcport's takes the distinct name).
//     On the production path (tiersFor, boardwalk registered)
//     vermilion's pin is FULLY IDENTICAL to its pre-wave tuple (conn
//     110/110, strict 0.8378, fabric 0.9961) and its registry entry is
//     unchanged; only the raw-tier negatives move, because raw tiers
//     cannot see boardwalk and the town no longer has a single path
//     cell for them to score (72/110 -> 0/110, step-offs 5/7 -> 1/7,
//     components 1 -> 4; the gate still FAILS on raw tiers — the
//     blindness the negative exists to prove, now total). Vermilion's
//     rows live only in maps2 (its maps4/maps5/maps6 registry copies
//     are spread-overrides of the maps2 original), so the map-id
//     registry re-pins all four vermilion fingerprints in the same
//     commit per the burn-down rule; the copies' own npcs/events
//     layers do not move.
//     TWENTY-FIFTH DOCUMENTED EXCEPTION (T29): the registry grows by
//     one scoped entry — mauville: [gridfloor] — on the same
//     terms as the exceptions above, and mauville's pin is its
//     POST-T29 tuple. The Lilac City rebuild replaced the
//     shipped tg2 field (289 of 540 cells mud — 53.5%, the
//     worst share yet) with the calm ground + bronze sett
//     fabric of the approved design: bronzroof staggered
//     olive-bronze shingles (idx 625) on the Gym + Game Corner
//     stamps and two facade cottages, gridfloor fine bronze
//     sett lattice with a teal-glass accent sett (idx 626),
//     the sunlamp prop (idx 627, x4: the Corner pair + the
//     great crossing north and south), the lilacbush prop
//     (idx 628, x3), and the orphaned MART CLERK re-seated at
//     his Mart's front apron (3,5) -> (9,4). Gate STATUS stays
//     PASS — but the shipped pass leaned on the mud sea as the
//     fabric (308 cells = 289 tg2 + the plots' 19 path cells);
//     the new fabric is streets + the plots' own path cells
//     alone, the scattered path cells threaded to the streets
//     through plain-ground cells only (no encounter cell
//     touched: commas 13, dots 19 byte-kept). Conn 210/210,
//     step-offs 7/7, junctions 9 sites -> 11 sites, 0 bare
//     (the four shipped DIRS records stood invisible on flat
//     green; they gained S tiles at their posts and five
//     verbatim copies mark the new junctions, T23-T28 pattern;
//     the front street stops west of the (26,4) lamp and the
//     north-east yard skips (26,7) so neither the lamp nor the
//     (26,8) planter is ever straddled), strict 0.9382 ->
//     0.7977 (desire lines get real corners; above the 0.60
//     gate), fabric 0.9931 -> 0.9919, apronMin 0.929 -> 0.857,
//     unanchoredAny identical (0), reachability holds the
//     fleet baseline 1132. (Kind indices 625-628: first
//     registered at 622-625, re-indexed in-branch under the
//     Director's index ruling of 2026-11-13 after W-DIFF7
//     registered pierfloor 622, mansardroof 623, copperroof
//     624 — the chars are computed from the block base and no
//     map cells had landed, so the remap is registration-only
//     and lossless by construction.) Re-pinned with the T29
//     build.
//     TWENTY-EIGHTH DOCUMENTED EXCEPTION (T30): the registry grows by
//     one scoped entry — verdanturf: [petalfloor, cavefloor] — on
//     the slateport two-material terms, and verdanturf's pin flips
//     from the shipped FAIL to its POST-T30 PASS. Wildflower shipped
//     the fleet's only outright placement FAIL whose root cause sat
//     in the registry itself: its Copperbore Tunnel exits stand on
//     cavefloor, a kind no network tier counts, so the west door
//     could never join the town's connectivity (conn 56/90) no
//     matter how the town was dressed; the wave registers the
//     tunnel mouth's shipped threshold material rather than paving
//     the cave mouth in petal gravel (WAVE-T30-WILDFLOWER-PLAN.md
//     §3.6). The rebuild also replaced the tg2 field (178 of 504
//     cells mud — 35.3%) with calm ground + petal-lane fabric:
//     trellisroof cream diamond lattice over rose (idx 633) on the
//     Contest Hall + House stamps and two facade cottages,
//     petalfloor petal-flecked garden lane (idx 634), the trellis
//     prop (idx 635, a pair at the hall's front walk), the
//     rosebush prop (idx 636, x3), and the orphaned MART CLERK
//     re-seated at his Mart's west-front apron (3,5) -> (22,4).
//     Gate STATUS flips FAIL -> PASS: conn 56/90 -> 90/90,
//     step-offs 6/6, junctions 1 site (the mud sea) -> 4 sites,
//     0 bare (both shipped DIRS records stood invisible — on flat
//     ground and on mud; they gained S tiles at their posts and
//     two verbatim copies mark the validator-named junctions at
//     (12,5) and in the garden at (9,13)), strict 0.9444 ->
//     0.8056 (desire lines get real corners; above the 0.60
//     gate), fabric 0.9553 -> 0.9829, apronMin identical
//     (0.875), unanchoredAny 0 -> 1 (the plot's east frame stray
//     flower@25,12 loses its cheb-2 decor anchor when the frame's
//     west cells become the desire-line grass; 1/50 = 2%, inside
//     the gate's 5% tolerance, pinned here honestly). The
//     desire-path rounds are recorded in the plan's §6: a petal
//     through-lane at garden row 12, FENN's north step (8,13) in
//     the lane, and grass pinches on the row-11 desire line, the
//     plot frame and the east column (tg is fabric tier; street
//     on those lines straddled the (6,10)/(19,10) planters both
//     ways). No encounter cell touched: commas 22, dots 5
//     byte-kept, PIOTR still standing on his comma. (Kind
//     indices 633-636: first registered at 629-632, re-indexed
//     in-branch under the Director's index ruling of 2026-11-13
//     after W-DIFF8 registered shinglefloor 629, shingleroof
//     630, inlayfloor 631, sakuraroof 632 — no map cells had
//     landed, so the remap is registration-only and lossless by
//     construction.) Re-pinned with the T30 build.
//     THIRTIETH DOCUMENTED EXCEPTION (T32): the registry grows by
//     one scoped entry — fallarbor: [ashfloor] — on the same
//     one-town terms, and fallarbor's pin migrates from its
//     shipped PASS to its POST-T32 PASS. Ashfall shipped the
//     Lilac pattern: a gate PASS whose fabric WAS the defect —
//     its single 220-cell network component held 209 cells of
//     tg2 mud (41.5% of the town), so the mud sea was the street
//     graph. The T32 build retires the mud (tg2 209 -> 0) and the
//     town's network becomes its authored streets: ashfloor
//     swept-ash lane (idx 661) on the front street, the south
//     road, the contest + south avenues, the east arm and the
//     field lane; timberroof weathered-timber planks (idx 660)
//     on the Contest Hall + Ando's House stamps and two facade
//     cottages; the railfence prop (idx 662) at the ash fields +
//     the south lawn (also registered in the audit's DECOR_KINDS
//     so the south planters anchor to the fence line); the
//     painting's telescope placed from the engine's existing W6
//     prop at (24,10); all three shipped DIRS records stood
//     invisible on flat ground — they gained S tiles at their
//     posts, and two verbatim copies mark the validator-named
//     junctions at (18,5) and (21,10); the orphaned MART CLERK
//     re-seated at his Mart's west-front apron (3,5) -> (9,4).
//     Gate STATUS stays PASS with the pin's meaning changed:
//     conn 90/90, step-offs 6/6, components 1 (117 cells of
//     authored street + plot frame, was 220 of mud), junctions
//     5 sites (the mud blob) -> 3 sites, 0 bare, strict 0.9463
//     -> 0.7047 (desire lines get real corners; above the 0.60
//     gate), fabric 0.984 -> 0.9872, apronMin identical (0.875),
//     unanchoredAny 0 (22 decor). The validator rounds are
//     recorded in the plan's §9: the street kind is named
//     *floor because the desire-path tiers key on that suffix
//     (an 'ashlane' first draft scored strict 0.0983 — the
//     registry alone does not feed analyzeMap), the plot's
//     south dot frame threads via (19,14)+(24,14), and the two
//     south planters anchor to the new fence line. No encounter
//     cell touched: commas 8, dots 11 byte-kept, BRIN still
//     standing on his dot. (Kind indices 660-662: main's ceiling
//     was 636; 637-659 left clear for the parallel T31 Beacon
//     claim at 645-656.) Re-pinned with the T32 build.
//     THIRTY-SECOND DOCUMENTED EXCEPTION (T34): the registry
//     grows by one scoped entry — fortree: [canopyfloor,
//     boardwalk] — on the slateport two-material terms, and
//     fortree's pin flips FAIL -> PASS: the town's one hard gate
//     failure. Highbranch shipped with its Long Walkway decks
//     registered to NO network tier, stranding the Route 119
//     south exits (conn 72/110 — the 38 missing pairs are
//     exactly the r119-exit pairs), under a 205-cell tg2 mud
//     sea (38.0% of the town, the 27th tg2 town). The T34 build
//     registers boardwalk (the walkway IS the high street — the
//     T30 cavefloor ruling: register the shipped material, do
//     not pave over it) and retires the mud (tg2 205 -> 0):
//     canopyfloor sun-bleached lashed planks (idx 685) on the
//     front street, east road, exits, spine band and thread —
//     the spine band (14,8),(15,8),(14,9),(15,9) and a jog
//     around the street birdbath rejoin the severed spine;
//     leafroof overlapping leaf scales (idx 684) on the Gym +
//     House stamps and two facade cottages at the deck rims;
//     the camoleon prop (idx 686) naps on the east deck per the
//     town's own Long Walkway sign; a bunting pair (idx 687)
//     dresses the Gym approach; the invisible DIRS post (17,15)
//     gains its S tile on its mud cell and two verbatim copies
//     mark the validator-named junctions at (27,7) and (2,10)
//     — the west copy's seat chosen by validator rounds (the
//     meadow-corner seats scored fabric 0.9764-0.9795: a sign
//     POI at the frame's corner pairs across the encounter
//     commas; the west-shoulder seat's pairs run the deck and
//     the south row); the orphaned MART CLERK re-seated at his
//     Mart's west-front apron (3,5) -> (9,4). Gate STATUS
//     flips: pass 0 -> 1, conn 72/110 -> 110/110, junctions
//     2 -> 4 sites, 0 bare, strict 0.9756 -> 0.6701 (desire
//     lines get real corners on the authored graph; above the
//     0.60 gate), fabric 0.9805 -> 0.9801, apronMin identical
//     (0.824), unanchoredAny 0 -> 1 disclosed: flower@11,7
//     stands Chebyshev 3 from the nearest fabric cell — the
//     tg2 blanket swap retired its mud anchor (tg counted,
//     tg does not); inside the audit's 5% tolerance (1/23),
//     the T30 flower@25,12 disclosure pattern. No encounter
//     cell touched: the meadow's commas 8 + dots 10 stand
//     byte-kept inside the town's own W-BG 'bloom' ground;
//     stamps, warps, posts, sign texts byte-kept. (Kind
//     indices 684-687 per the Director's allocation: main's
//     ceiling was 662 (T32), 672-675 held by the parallel T33
//     Steamspring claim, 663-671 and 676-683 left empty; the
//     THIRTY-FIRST exception is T33's, recorded on its own
//     branch and merged ahead of this one.) Re-pinned with the
//     T34 build.
//     THIRTY-FOURTH DOCUMENTED EXCEPTION (T36): the registry
//     grows by one scoped entry — mossdeep: [starfloor,
//     dockfloor] — on the slateport/olivine two-material terms,
//     and mossdeep's pin flips FAIL -> PASS: FOUR of its gates.
//     Starfall shipped the fleet's worst raw FAIL: conn 30/132
//     with components 2 — all six of the island town's exits
//     stand on open water (no tier counts water, so every exit
//     pair failed by construction; the 30 passing pairs were
//     exactly the six step-offs among themselves, carried by a
//     152-cell tg2 mud sea, 30.2% of the town, the 28th tg2
//     town), and its SE shore strip was severed by the east
//     channel. The T36 build retires the mud (tg2 152 -> 0) and
//     lands the crossings as piers, not paving: dockfloor
//     horizontal harbour boards (idx 710 — the kind is named
//     for the -floor suffix the desire tiers key on, the T31
//     jettyfloor lesson) on the r124 west jetty, the r125 north
//     pier, the r126 south pier and ONE east bridge at (20,6),
//     (21,6); starfloor star-sand lanes (idx 709) carry the
//     front street, the main street, the shore lane down the
//     strip and the plot threading; starroof star-flecked cyan
//     shingles (idx 708) dress the Space Center facade, Alban's
//     house and ONE facade cottage on the SW lawn (the x5-7
//     seat failed apron 0.5 against the border row; the x2-4
//     seat holds 0.643) while the Gym keeps its banded
//     tr-mossdeep slab — two roof families answer the design's
//     recorded roof-similar soft spot; the chartboard prop
//     (idx 711) stands east of the Space Center at (25,4), the
//     board its own sign names; the two invisible DIRS posts
//     (17,9) + (23,9) gain S tiles and seven verbatim copies
//     mark the validator-named junctions; the orphaned MART
//     CLERK re-seated at his Mart's west-front apron
//     (3,5) -> (9,4). Design catches the rig proved before
//     landing: the shore road jogs around the telescope at
//     (9,9); the plot's dot clusters join at (9,12), not the
//     encounter comma at (10,13). Gate STATUS flips: pass
//     0 -> 1, conn 30/132 -> 132/132, components 2 -> 1,
//     junction sites 3 -> 14 (0 bare), strict 0.9289 -> 0.7436
//     (desire lines get real corners on the authored graph),
//     fabric 0.9289 -> 0.9944, apronMin 0.667 -> 0.643 (the
//     cottage's disclosed ring). No encounter cell touched:
//     commas 22 + dots 13 byte-kept, SOL still standing on his
//     comma; stamps, warps, posts, sign texts byte-kept (the
//     Space Center's four tr cells take starroof — geometry
//     identical, kind only). (Kind indices 708-711 per the
//     Director's allocation: main's ceiling was 687 (T34);
//     688-707 left empty, including 696-699 for the parallel
//     T35 Lotus Cove claim; the THIRTY-THIRD exception is
//     T35's, recorded on its own branch.) Re-pinned with the
//     T36 build.
//     THIRTY-SIXTH DOCUMENTED EXCEPTION (WAVE T38; the
//     THIRTY-FIFTH is WAVE T37 Craterlake's, recorded on its
//     own branch): the registry grows by one scoped entry —
//     pacifidlog: [raftfloor] (the rebuild-wave registration
//     the registry's own W4 comment promised this town) — and
//     pacifidlog's pin migrates FAIL -> PASS: the Driftlog
//     rebuild on its own kit from birth ('Lashed Log & Coral
//     Door', idx 732-736: lashed-log raftfloor streets, raft-
//     timber shingle raftroof, the coraldoor face, WREN's
//     anchor fence posts, the west-edge pontoon props) per
//     WAVE-T38-DRIFTLOG-PLAN.md. Driftlog shipped with its
//     whole 252-cell island as ONE shared boardwalk slab — a
//     kind in NO audit tier — so its connectivity lived on a
//     19-cell sand spine and both r131 exits stood on open
//     water: conn 12/30 by construction, fabric 0.9367. The
//     build retires the slab behind the town's own re-
//     authored raft grass (tg-pacifidlog, its art re-authored
//     from its .pix — the entry serves no other map), lands
//     the exits as a lashed-log landfall nose (the T31 jetty
//     ruling), runs ONE avenue from the landings to the spine
//     and ONE plaza lane on row 11 south of it (the shipped
//     south-lawn desire legs scored strict 0.00 over bare
//     ground; the lane's gaps at (7,11) and (12,11) are
//     load-bearing — paving either straddles the byte-kept
//     barrel / flower on the fabric), moves the orphaned MART
//     CLERK (3,5) -> (21,7) at his Mart's west-front apron,
//     and marks its four junction sites with verbatim copies
//     of the town's CURRENT ROADS sign (no DIRS record exists
//     in this town; the copies carry the directions text the
//     town itself ships). Disclosed residues: fabric 0.9807
//     carries two shipped flower cells standing on desire
//     corridors — (20,7) on the Mart's west corridor, (12,10)
//     on the x12 column — byte-kept dressing the A* steps
//     over, inside the same terms as T37's disclosures;
//     CORALIE stands on the plaza lane at her byte-kept post
//     (10,11) (her standing cell takes raftfloor, the bridge
//     her access segment needed). No encounter cell touched:
//     commas 14 + the sea's water table byte-kept; stamps,
//     warps, posts and both shipped sign texts byte-kept.
//     Gate STATUS flips: pass 0 -> 1, conn 12/30 -> 30/30,
//     junctions 0 -> 4 (0 bare), strict 0.9367 -> 0.6569 (the
//     shipped figure was the boardwalk's DRESSED-tier
//     accident; the landed figure is carried by the authored
//     street graph), fabric 0.9367 -> 0.9807, apronMin 0.75
//     unchanged. NO other town's pin moves.
//     Tuple: [pass, connOk, connPairs, stepTouch, stepTot, components,
//     junctionSites, junctionsBare, apronLow, apronMin, merged,
//     onFabric, shoulderOrphans, unanchoredAny, strict, fabric].
//     THIRTY-EIGHTH DOCUMENTED EXCEPTION (WAVE T40; the
//     THIRTY-SEVENTH is WAVE T39 Perennial's, recorded on its
//     own branch): the registry grows by one scoped entry —
//     twinleaf: [cloverfloor] (the rebuild-wave registration
//     the registry's own terms promise each town) — and
//     twinleaf's pin migrates PASS -> PASS: the Clover Town
//     rebuild on its own kit from birth ('Clover Earth &
//     Batten Timber', idx 756-759: clover-flecked packed-earth
//     cloverfloor streets, board-and-batten battenroof, the
//     two-leaf sapling pair, cloverbed mounds) per
//     WAVE-T40-CLOVER-PLAN.md. Clover shipped a mud-carried
//     PASS: its entire 184-cell network was the tg2 sea — the
//     front street (row 4), the through road (rows 8-9) and
//     the patches between them — so strict 0.9833 / fabric
//     0.994 were the mud's figures, not the town's. The build
//     retires the mud (tg2 184 -> 0), rebuilds the street
//     graph in cloverfloor (front street, through road, main
//     lane, west arm, south lane, DIRS spur, plot lane +
//     pinches threading the encounter plot's dot clusters —
//     the T30 threading lesson), gives the invisible (7,12)
//     DIRS record its sign tile, moves the orphaned MART
//     CLERK (3,5) -> (19,4) at his Mart's west-front apron,
//     marks the (13,4) junction with a verbatim DIRS copy at
//     (15,5), and dresses the two shipped houses plus two
//     facade cottages in battenroof (facade doors carry no
//     warps, so step-offs stay 6/6 and conn stays 90/90 —
//     the audit's nodes are the town's ten warp cells).
//     No encounter cell touched: commas 8 + dots 11
//     byte-kept, TAM still standing on his plot-frame dot;
//     stamps, warps, posts and all three shipped sign texts
//     byte-kept (the start cell (13,15) takes cloverfloor —
//     the T29 exit-cell precedent; its coordinate and the
//     warp records are untouched). Gate STATUS holds: pass
//     1 -> 1, conn 90/90, junctions 3 (0 bare), apronMin
//     0.824 unchanged, strict 0.9833 -> 0.7674 (the landed
//     figure is carried by the authored street graph, not
//     the mud), fabric 0.994 -> 0.9964. NO other town's pin
//     moves.
//     THIRTY-EIGHTH (cont.): the tuple fields are
//     [pass, connOk, connPairs, stepTouch, stepTot, components,
//     junctionSites, junctionsBare, apronLow, apronMin, merged,
//     onFabric, shoulderOrphans, unanchoredAny, strict, fabric].
//     FORTIETH DOCUMENTED EXCEPTION (WAVE T42; the
//     THIRTY-NINTH is WAVE T41 Shingle's, recorded on its own
//     branch): the registry grows by one scoped entry —
//     jubilife: [beamfloor] (the rebuild-wave registration
//     the registry's own terms promise each town) — and
//     jubilife's pin migrates PASS -> PASS: the Revelry City
//     rebuild on its own kit from birth ('Broadcast Steel &
//     Signal Slab', idx 780-783: steel signal-slab beamfloor
//     streets, the TV station's glass beamroof, the Condo's
//     lit-window condoroof, the screentotem pair) per
//     WAVE-T42-REVELRY-PLAN.md. Revelry shipped a mud-carried
//     PASS: 294 of its 600 cells were tg2 and its entire
//     303-cell network was the mud sea — so strict 0.9336 /
//     fabric 0.9978 were the mud's figures, not the city's.
//     The build retires the mud (tg2 294 -> 0), rebuilds the
//     street graph in beamfloor (front street, north avenue,
//     the two-row east-west avenue, south avenue, row 13
//     laterals, the VESK lane, the x23 house lane, the south
//     frontage street, and plot threading — the encounter
//     plot's dot clusters threaded via the west plot lane,
//     (7,14) and (5,17), the T30 threading lesson), gives
//     SEVEN invisible DIRS records their sign tiles, marks
//     the three validator-named bare junctions with verbatim
//     DIRS copies at (12,5), (6,12) and (2,13) (shoulders
//     only — the round-2 lesson: the first (7,13) seat sat
//     ON the row-13 lateral and punched it), moves the
//     orphaned MART CLERK (3,5) -> (9,4) at his Mart's
//     west-front apron, and differentiates the two shared-
//     roof stamps (station tr -> beamroof; condo th ->
//     condoroof; the House keeps th/tw). No encounter cell
//     touched: commas 6 + dots 9 byte-kept, UNA still
//     standing on her plot dot; stamps, warps, posts and
//     all nine shipped sign texts byte-kept (VESK's tale-
//     completion cell (15,4) takes beamfloor — it sits in
//     the front-street row; the actor record is untouched).
//     Gate STATUS holds: pass 1 -> 1, conn 210/210,
//     step-offs 7/7, components 303-cell mud sea -> one
//     167-cell street graph, junctions 11 sites (the mud
//     blob's) -> 6 sites, 0 bare, apronMin 0.813 -> 0.786
//     (the condo's apron now faces the row-13 lateral
//     instead of open mud; still clear of the 0.60 floor),
//     strict 0.9336 -> 0.6796 (the landed figure is carried
//     by the authored street graph, not the mud), fabric
//     0.9978 -> 0.9925. NO other town's pin moves.
//     TWENTY-SIXTH DOCUMENTED EXCEPTION (W-DIFF8): the registry
//     grows by one scoped entry — lavender: [shinglefloor] — on
//     the same terms as the exceptions above, and lavender's pin
//     is FULLY IDENTICAL to its pre-wave tuple (registry growth
//     only). The Hushmoor identity retrofit (W-DIFF-AUDIT Phase
//     B: 'Violet Shingle & Memorial Stone') swapped TILE
//     MATERIALS ONLY: 56 path cells -> shinglefloor dark
//     violet-grey gravel (idx 629) and 22 th-lavender cells ->
//     shingleroof steep dark shingle (idx 630: the north
//     houses, the mid houses, the Mart's roof row, the tower
//     block's th- roofline — tl-/tr- edges keep their shipped
//     faces, the W-DIFF6/7 precedent). The memorialwall row,
//     the tower geography (doors + wall-gym faces + warps to
//     tower1), the shipped flora-lavender patches (the table's
//     ground treatment, already standing) and every warp /
//     post / sign / encounter cell are byte-kept, snapshot-
//     verified across all 432 maps. Lavender is an identical
//     dual definition (map-id registry status I): both copies
//     (maps2/maps3) were swapped identically and stay
//     identical, their shared registry fingerprint re-pinned
//     in the same commit. Gates stay PASS on the registered
//     tiers with the tuple unmoved: conn 132/132, step-offs
//     7/7, junctions 2/2, strict 0.7211, fabric 0.9873.
//     TWENTY-SEVENTH DOCUMENTED EXCEPTION (W-DIFF8): the
//     registry grows by one scoped entry — cherrygrove:
//     [inlayfloor] — on the same terms, and cherrygrove's pin
//     is FULLY IDENTICAL to its pre-wave tuple (registry growth
//     only). The Blossom identity retrofit (W-DIFF-AUDIT Phase
//     B: 'Sakura & Harbour Stone') swapped TILE MATERIALS
//     ONLY: 125 path cells -> inlayfloor (idx 631) and 8
//     th-cherrygrove cells -> sakuraroof cherry-pink gables
//     (idx 632: the Guide house + the south-west house). The
//     identity table names 'harbourstone' as Blossom's street,
//     but harbourstone is Canalave's dressed stone, sunnyshore
//     wears it as decorative inlay speckle, and the registry's
//     standing note holds it 'not registrable as one [a
//     street]' — so per the W-DIFF6 amendment rule Blossom
//     takes a distinct variant in the same register: harbour
//     stone cut as large inlay slabs with a pale cherry-petal
//     inlay motif. The tide-table plaza's shipped harbourstone
//     block (21-23, 14-16), every sakura, the Center's
//     roof-center stamp, the Mart's roof-slate row, the
//     roof-terra house and every warp / post / sign /
//     encounter cell are byte-kept, snapshot-verified. The
//     full west/east gate rows take inlayfloor with the
//     streets: the T14 west-gate fix is geometry (positions,
//     never materials), and inlayfloor is the town's
//     registered street fabric, so both gates stay street.
//     Gates stay PASS on the registered tiers with the tuple
//     unmoved: conn 72/72, step-offs 5/5, junctions 5/5,
//     strict 0.7126, fabric 0.9902. Pair similarity
//     (lavender <-> cherrygrove, audit census): 0.2003 ->
//     0.3597, fleet rank #363 -> #666 of 2,016; control pair
//     blackthorn <-> silvertown 0.3109 unmoved.
//     TWENTY-NINTH DOCUMENTED EXCEPTION (WAVE T31): the
//     registry grows by one scoped entry — olivine:
//     [harbourfloor, jettyfloor] (the slateport two-material
//     precedent) — and olivine's pin migrates FAIL -> PASS:
//     the Beacon City rebuild on the owner's daylight ruling
//     (WAVE-T31-BEACON-PLAN.md). The shipped town FAILED on
//     connectivity alone (72/110): the Route 40 crossing's
//     exits AND landings stood on open water (surf cells,
//     walk=false, in no tier), so the west door connected to
//     nothing on foot. The T31 build lays the town's own kit
//     ('Gleam Lamp & Harbour Plank', idx 645-648: beaconroof
//     standing-seam roofs, harbourfloor bolted decking,
//     jettyfloor tarred battens, the lampglass lamp) as its
//     street fabric — front street, spine, shore road, the
//     r39 head — and builds the landfall a six-cell jetty at
//     the bay's east shore plus its shore link: the crossing
//     lands on the jetty, connectivity 110/110. The 180-cell
//     tg2 mud web (26.5%) is retired to calm tg; the five
//     invisible DIRS sign posts gain their tiles (words
//     byte-identical) + four verbatim copies at the
//     validator-named junctions; the orphaned MART CLERK
//     re-seats (3,5) -> (9,4) west of his Mart's west via;
//     the fleet anchors as four shipped boat props on harbour
//     water; the storm-night tale, both captains, ADA and
//     JOSS, all warps, stamps and encounters byte-kept (the
//     tale is retold through dialogue + signs, per the
//     ruling — the town itself is built in daylight).
//     Tuple migration: [0, 72, 110, 7, 7, 1, 9, 0, 0, 0.929,
//     0, 0, 0, 0, 0.9134, 0.9864] -> [1, 110, 110, 7, 7, 1,
//     11, 0, 0, 0.857, 0, 0, 0, 0, 0.6186, 0.9819]: conn
//     72/110 -> 110/110, junctions 9 -> 11 all covered,
//     strict 0.9134 -> 0.6186 (the tg2 desire web was strict
//     tier by definition; the deck streets carry the same
//     lines at the honest CLEAN measure — every CLEAN town
//     reads 0.62-0.93), fabric 0.9864 -> 0.9819, apron min
//     0.929 -> 0.857 (the lighthouse ring re-measured with
//     its lamp crown; no building below 60%, none merged).
//     NO other town's pin moves.
//     THIRTY-FIRST DOCUMENTED EXCEPTION (WAVE T33; the
//     THIRTIETH is reserved to WAVE T32 Ashfall at its merge,
//     ahead of this one): the registry grows by one scoped
//     entry — lavaridge: [steamfloor, terracefloor] (the
//     slateport / olivine two-material precedent) — and
//     lavaridge's pin migrates FAIL -> PASS: the Steamspring
//     rebuild on its own kit from birth ('Rustflag & Steam
//     Terrace', idx 672-675: rust barrel-tile steamroof,
//     rust-flag steamfloor streets, pale mineral terracefloor
//     ring, the steamvent prop) per WAVE-T33-STEAMSPRING-PLAN.md.
//     The shipped town was a mud-leaning fabric-only FAIL:
//     its one 190-cell 'component' WAS the tg2 web (35.7% of
//     the town), which the audit counts as fabric — the build
//     retires tg2 to zero and lays the kit's streets (front
//     street, pass spine, spring street, west avenue, south
//     street, the spring's terrace ring with its row-16
//     return). The three invisible DIRS sign posts gain their
//     tiles (words byte-identical) + three verbatim copies at
//     the validator-named junctions (11,5), (7,9), (18,16);
//     the orphaned MART CLERK re-seats (3,5) -> (9,4) west of
//     his Mart's west via; a third steamvent stands on the
//     spring's own west terrace (19,11), breaking the
//     desire-line's dive across the pool's north-west water —
//     SOAKER VEDA's pairs swim 2 water cells, not 4 (her
//     spring, its waterglow rectangle, the rock rim and the
//     encounter plot byte-kept). The house stamp + two facade
//     cottages wear the town's barrel-tile roof; the gym
//     keeps its shipped tr roof (the T31 precedent); spring
//     sign, town sign, warps, stamps and encounters
//     byte-preserved. Tuple migration: [0, 72, 72, 7, 7, 1,
//     1, 0, 0, 0.929, 0, 0, 0, 0, 0.9715, 0.9715] -> [1, 72,
//     72, 7, 7, 1, 8, 0, 0, 0.929, 0, 0, 0, 0, 0.6726,
//     0.9879]: shipped FAIL was fabric alone; junctions
//     1 -> 8 sites, all covered; strict 0.9715 -> 0.6726
//     (the tg2 web was strict tier by definition; the
//     flagstone streets carry the same lines at the honest
//     CLEAN measure — every CLEAN town reads 0.62-0.93);
//     fabric 0.9715 -> 0.9879; apron min 0.929 unmoved.
//     NO other town's pin moves.
//     THIRTY-THIRD DOCUMENTED EXCEPTION (WAVE T35; the
//     THIRTY-SECOND is WAVE T34 Highbranch's, landing at its
//     merge): the registry grows by one scoped entry —
//     lilycove: [cobblefloor, cavefloor] (the verdanturf
//     two-material terms: the kit street + the shipped cave-
//     mouth threshold material) — and lilycove's pin migrates
//     FAIL -> PASS: the Lotus Cove rebuild on its own kit
//     from birth ('Lavender Tile & Cobble Harbour', idx
//     696-699: scalloped lavender barrel-tile lotusroof,
//     round-cobble cobblefloor streets, the chainbar brow
//     props, the gullpost at the pier head) per
//     WAVE-T35-LOTUSCOVE-PLAN.md. The shipped town FAILED
//     outright: conn 42/72 (its Route 124 exit warps stood
//     on open water, no network tier — the T31 Beacon jetty
//     ruling swaps the two exit cells to cobblefloor, warps
//     untouched) and fabric 0.9687, its one 210-cell
//     'component' being the 190-cell tg2 mud web itself.
//     The build retires tg2 to zero and lays the kit's
//     streets (front street with a one-cell jog south around
//     its own shipped fence at (7,4), the two-row shore
//     road, harbour avenue + pier walk, contest + caves +
//     east arms, the paved cave lane to the brow mouths,
//     both encounter-plot frame threads, the dockside lane
//     shouldering the shipped barrels/crates/lamp). The
//     four invisible DIRS sign posts gain their tiles
//     (words byte-identical) + five verbatim copies at the
//     validator-named junctions (25,3), (12,5), (14,5),
//     (22,11), (18,12); the orphaned MART CLERK re-seats
//     (3,5) -> (9,4) west of his Mart's west via. The
//     Contest Hall + Department Store stamps wear the
//     town's barrel tile on their shared tr kind (the
//     department store stays a facade — no warp invented);
//     two facade cottages wear it too; the chained
//     notice-board dressing the town's own harbour-caves
//     sign describes stands on the NORTH brow where the
//     backend keeps the mouths (the painting's south cliff
//     is compass-ruled out — warps pinned). All warps,
//     landings, posts, sign texts, both encounter plots
//     and the pier byte-preserved. Tuple migration: [0,
//     42, 72, 5, 5, 1, 8, 0, 0, 0.706, 0, 0, 0, 0, 0.9249,
//     0.9687] -> [1, 72, 72, 5, 5, 1, 9, 0, 0, 0.647, 0, 0,
//     0, 0, 0.724, 0.9898]: conn 42/72 -> 72/72, junctions
//     8 -> 9 sites all covered, strict 0.9249 -> 0.724 (the
//     tg2 web was strict tier by definition; the cobble
//     streets carry the same lines at the honest CLEAN
//     measure — every CLEAN town reads 0.62-0.93), fabric
//     0.9687 -> 0.9898, apron min 0.706 -> 0.647 (the two
//     facade cottages re-measured on their lawns; no
//     building below 60%, none merged). NO other town's
//     pin moves.
//     THIRTY-FIFTH DOCUMENTED EXCEPTION (WAVE T37; the
//     THIRTY-FOURTH is WAVE T36 Starfall's, landing at its
//     merge): the registry grows by one scoped entry —
//     sootopolis: [craterfloor, cavefloor] (the verdanturf
//     two-material terms: the kit street + the shipped
//     cave-mouth threshold material) — and sootopolis's pin
//     migrates FAIL -> PASS: the Craterlake rebuild on its
//     own kit from birth ('Crater Ashlar & Ventstone', idx
//     720-724: coursed crater-white ashlar craterroof,
//     craterwall cottage walls, white crater sett
//     craterfloor streets, the painteasel on the lake's
//     east shore, ventstones at the rim ledge's ends) per
//     WAVE-T37-CRATERLAKE-PLAN.md. The shipped town FAILED
//     the apron gate alone: [0, 30, 30, 6, 6, 1, 3, 0, 1,
//     0.588, 0, 0, 0, 0, 0.9831, 0.9834] -> [1, 30, 30, 6,
//     6, 1, 7, 0, 0, 0.857, 0, 0, 0, 0, 0.7635, 0.981]:
//     conn 30/30 unmoved, junctions 3 -> 7 sites all
//     covered (the two shipped invisible DIRS posts gain
//     tiles; three verbatim copies at validator-named bare
//     junctions), strict 0.9831 -> 0.7635 (the tg2 web was
//     strict tier by definition; the crater sett carries
//     the same lines at the honest CLEAN measure — every
//     CLEAN town reads 0.62-0.93), fabric 0.9831 -> 0.981
//     (the mud web's blanket measure against the ring
//     streets + lawn desire lines, inside the same band),
//     apron min 0.588 -> 0.857 (the rim ledge: the row-1
//     rock band behind the stamps becomes crater floor —
//     the Center's ring 10/17 -> 16/17 on real walkable
//     cells, the W4 sign-face classifier ruling untouched;
//     the min is the east facade cottage's ring). The
//     orphaned MART CLERK re-seats (3,5) -> (9,4); tg2
//     cells 116 -> 0. NO other town's pin moves.
//     THIRTY-SEVENTH DOCUMENTED EXCEPTION (WAVE T39; the
//     THIRTY-SIXTH is WAVE T38 Driftlog's, landing at its
//     merge): the registry grows by one scoped entry —
//     evergrande: [plateaufloor, cavefloor] (the verdanturf
//     two-material terms: the kit street + the shipped
//     Crown Road mouth threshold material) — and
//     evergrande's pin migrates FAIL -> PASS: the Perennial
//     City rebuild on its own kit from birth ('League
//     Marble & Banner Gold', idx 744-748: parade-marble
//     plateaufloor streets, the badge-frieze badgeroof on
//     the League hall alone, verdigris standing-seam
//     verdiroof on the two facade houses, pennants on the
//     plateau flag fields, the falls at the rim's east
//     foot) per WAVE-T39-PERENNIAL-PLAN.md. The shipped
//     town FAILED on connectivity, components and fabric:
//     [0, 12, 42, 5, 5, 2, 4, 0, 0, 0.938, 0, 0, 0, 0,
//     0.9773, 0.9778] -> [1, 42, 42, 5, 5, 1, 10, 0, 0,
//     0.938, 0, 0, 0, 0, 0.7554, 0.9928]: conn 12/42 ->
//     42/42 (the r134 exits stood on water — a kind in no
//     network tier; they take the street kind, and the
//     cavefloor registry entry joins the severed plateau),
//     components 2 -> 1, junctions 4 -> 10 sites all
//     covered (the three shipped invisible DIRS posts gain
//     tiles; two verbatim copies at validator-named bare
//     junctions), strict 0.9773 -> 0.7554 (the tg2 web was
//     strict tier by definition; the parade marble carries
//     the same lines at the honest CLEAN measure — every
//     CLEAN town reads 0.62-0.93), fabric 0.9778 -> 0.9928,
//     apron min 0.938 unmoved. The orphaned MART CLERK
//     re-seats (3,5) -> (9,12); tg2 cells 181 -> 0. NO
//     other town's pin moves.
//     THIRTY-NINTH DOCUMENTED EXCEPTION (WAVE T41; the
//     THIRTY-EIGHTH is WAVE T40 Clover's, landing at its
//     merge): the registry grows by one scoped entry —
//     sandgem: [shellfloor] — and sandgem's pin migrates
//     on metrics while staying PASS: the Shingle Town
//     rebuild on its own kit from birth ('Shell Shingle
//     & Raked Shingle-Sand', idx 768-771: raked shell-sand
//     shellfloor streets, scalloped pale shellroof on the
//     Lab/Mart share broken + the Shingle House eaves,
//     the TIDESLUG prop one cell west of ANA's post, the
//     bleached tidelog on the west beach) per
//     WAVE-T41-SHINGLE-PLAN.md. The shipped town PASSED
//     only as a mud-and-beach artefact: [1, 156, 156, 7,
//     7, 1, 1, 0, 0, 0.833, 0, 0, 0, 0, 1, 1] -> [1, 156,
//     156, 7, 7, 1, 9, 0, 0, 0.824, 0, 0, 0, 0, 0.6668,
//     0.9888]: conn 156/156 unmoved, junctions 1 -> 9
//     sites all covered (the four shipped invisible DIRS
//     posts gain tiles; seven verbatim copies at
//     validator-named bare junctions), strict 1 -> 0.6668
//     (the tg2 web was strict tier by definition; the
//     shell-sand streets carry the same lines at the
//     honest CLEAN measure — every CLEAN town reads
//     0.62-0.93), fabric 1 -> 0.9888, apron min 0.833 ->
//     0.824 (the Center's ring: the north-throat copy
//     post takes a ring cell, beside the shipped td ding
//     and the stamp's own sign tile). The Center's
//     missing east half is restored to the stamp's own
//     chars (the K door fired from a mud cell); the
//     orphaned MART CLERK re-seats (3,5) -> (17,4); tg2
//     cells 173 -> 0. NO other town's pin moves.
//     FORTY-FIRST DOCUMENTED EXCEPTION (WAVE T43; the
//     FORTIETH is WAVE T42 Revelry's, landing at its
//     merge): the registry grows by one scoped entry —
//     oreburgh: [clinkerfloor] — and oreburgh's pin
//     migrates on metrics while staying PASS: the
//     Coalseam City rebuild on its own kit from birth
//     ('Soot Iron & Clinker Ash', idx 792-795: packed
//     black-ash clinkerfloor streets, riveted ironroof
//     breaking the Gym+Museum tr-roof share, the coal
//     cart at the mine sign's foot, the RAMOSAUR skull
//     at the Museum's east shoulder) per
//     WAVE-T43-COALSEAM-PLAN.md. The shipped town
//     PASSED only as a mud artefact — its whole
//     248-cell network was the tg2 sea: [1, 182, 182,
//     8, 8, 1, 1, 0, 0, 0.714, 0, 0, 0, 0, 0.9985, 1]
//     -> [1, 182, 182, 8, 8, 1, 3, 0, 0, 0.714, 0, 0,
//     0, 0, 0.7912, 0.9994]: conn 182/182 unmoved,
//     components 1 (the ash graph threads the SW
//     encounter plot's comma-isolated dot spurs on
//     lanes, never on encounter cells), junctions 1
//     -> 3 sites all covered (both shipped signs
//     already stood on S tiles; two verbatim copies of
//     the town sign at validator-named bare junctions),
//     strict 0.9985 -> 0.7912 (the tg2 web was strict
//     tier by definition; the clinker streets carry
//     the same lines at the honest CLEAN measure —
//     every CLEAN town reads 0.62-0.93), fabric 1 ->
//     0.9994, apron min 0.714 unmoved. The orphaned
//     MART CLERK re-seats (3,5) -> (9,4); tg2 cells
//     238 -> 0. NO other town's pin moves.
//     FORTY-THIRD DOCUMENTED EXCEPTION (WAVE T45; the
//     FORTY-SECOND is WAVE T44 Honeyfield's, landing at
//     its merge ahead of this wave): the registry grows
//     by one scoped entry — eterna: [heritagefloor] —
//     and eterna's pin migrates on metrics while staying
//     PASS: the Heritage City rebuild on its own kit from
//     birth ('Historic Stone & Leaf-Shadow', idx
//     816-819: worn flagstone heritagefloor streets, the
//     cut-stone heritageroof breaking the Gym + Combine
//     building tr-roof share, the tale's old statue
//     realized in its garden, flower urns at the gates)
//     per WAVE-T45-HERITAGE-PLAN.md. The shipped town
//     PASSED only as a mud artefact — its whole 232-cell
//     network was the tg2 sea (221 tg2 cells, one
//     148-cell junction mega-site): [1, 182, 182, 8, 8,
//     1, 7, 0, 0, 0.813, 0, 0, 0, 0, 0.9593, 0.9921] ->
//     [1, 182, 182, 8, 8, 1, 2, 0, 0, 0.813, 0, 0, 0, 0,
//     0.7361, 0.992]: conn 182/182 unmoved, components 1
//     (the flagstone graph threads the statue garden's
//     path ring on lanes at its corners, never on
//     encounter cells), junctions 7 -> 2 real sites all
//     covered (the three shipped DIRS records gain sign
//     tiles; one verbatim copy of the town sign at the
//     validator-named bare crossing), strict 0.9593 ->
//     0.7361 (the tg2 web was strict tier by definition;
//     the flagstone streets carry the same lines at the
//     honest CLEAN measure — every CLEAN town reads
//     0.62-0.93), fabric 0.9921 -> 0.992, apron min
//     0.813 unmoved. The orphaned MART CLERK re-seats
//     (3,5) -> (9,4); tg2 cells 221 -> 0. NO other
//     town's pin moves.

//     FORTY-SECOND DOCUMENTED EXCEPTION (WAVE T44; the
//     FORTY-FIRST is WAVE T43 Coalseam's, recorded on its own
//     branch): the registry grows by one scoped entry —
//     floaroma: [honeyfloor] (the rebuild-wave registration
//     the registry's own terms promise each town) — and
//     floaroma's pin migrates PASS -> PASS: the Honeyfield
//     Town rebuild on its own kit from birth ('Honeycomb &
//     Bloom', idx 804-807: hexagonal-comb honeyfloor streets,
//     magenta petal-scale bloomroof, the beehive prop, the
//     shopsign prop) per WAVE-T44-HONEYFIELD-PLAN.md.
//     Honeyfield shipped a mud-carried PASS: 194 of its 504
//     cells were tg2 and its strict 0.9994 / fabric 0.9994
//     were the mud sea's figures, not the town's. The build
//     retires the mud (tg2 194 -> 0), rebuilds the street
//     graph in honeyfloor (two-row front street and through
//     road, the x12-13 avenue, east column, south street,
//     west verge + link, cottage spur, and the SW
//     flowerfield block threaded on its own two shipped
//     tg2 desire columns x8/x11 — no encounter cell
//     touched: flowerfield 41 + flower 4 byte-kept, FENN
//     still standing in his meadow), marks the
//     validator-named bare junctions with verbatim
//     town-sign copies at (26,3), (15,10), (25,10),
//     (15,17) and (21,15) — the (15,17) copy stands on the
//     border row beside the Ruined Path exits, the seat
//     whose pairs all start on the south street — moves
//     the orphaned MART CLERK (3,5) -> (9,4) at his Mart's
//     west-front apron, answers the Mart's missing
//     shopfront (the town pack's one soft grade) with the
//     shopsign prop at (13,3) on the Mart's east frontage
//     — the stamp is fleet-shared, so no warp, interior
//     or stamp cell is touched — dresses the apiary with
//     six beehive props at the honey trees and the
//     meadow's desire-line gates, builds the painting's
//     two facade cottages, and differentiates the
//     shared-roof House stamp (th -> bloomroof). Gate
//     STATUS holds: pass 1 -> 1, conn 72/72, step-offs
//     5/5, components one 161-cell street graph, junctions
//     1 site (the mud blob's) -> 3 sites, 0 bare, apronMin
//     0.941 -> 0.857, strict 0.9994 -> 0.7784, fabric
//     0.9994 -> 0.9811 (the landed figures are carried by
//     the authored street graph, not the mud; flowerfield
//     is not a fabric tier, so the meadow crossings price
//     in honestly). NO other town's pin moves.

//     FORTY-FOURTH DOCUMENTED EXCEPTION (WAVE T46; the
//     FORTY-THIRD is WAVE T45 Heritage's, recorded on its
//     own branch): the registry grows by one scoped entry —
//     hearthome: [giltfloor] (the rebuild-wave registration
//     the registry's own terms promise each town) — and
//     hearthome's pin migrates PASS -> PASS: the Inglenook
//     City rebuild on its own kit from birth ('Violet Slate
//     & Gilt', idx 828-831: warm gilt sett streets, the gold
//     domeroof, the poffintin prop, the berrybasket prop)
//     per WAVE-T46-INGLENOOK-PLAN.md. Inglenook shipped a
//     mud-carried PASS: 234 of its 600 cells were tg2 and
//     its conn 272/272 / strict 0.991 were the mud sea's
//     figures, not the town's. The build retires the mud
//     (tg2 234 -> 0), rebuilds the street graph in
//     giltfloor (front street, north + south avenues, the
//     square-gate arm, the west road + link, the house lane
//     with its mid-town bridge, the ROSA spur, the east
//     avenue, the south forecourt, and the SW encounter
//     plot's dots threaded on gilt frame bridges — no
//     encounter cell touched: commas 7 + dots 8 and the
//     flowerfield block 21 byte-kept, PIOTR still standing
//     on his de-mudded post), breaks the Gym + Contest Hall
//     tr-roof share with the gold domeroof on the Contest
//     Hall (the town sign's own 'Contests under the gold
//     dome'), seats the tale's poffin tins at the Poffin
//     House landing's shoulder and MASA's post, sets berry
//     baskets at the Mart's and the Contest Hall's
//     frontages, builds the painting's two facade
//     cottages, tiles the one invisible DIRS at (7,18) and
//     marks the validator-named bare junctions with
//     verbatim DIRS copies at (12,5), (2,12), (7,12) and
//     (26,5), and moves the orphaned MART CLERK (3,5) ->
//     (9,4) at his Mart's west-front apron. Gate STATUS
//     holds: pass 1 -> 1, conn 272/272, step-offs 9/9,
//     components one 145-cell street graph, junctions
//     3 sites -> 5 sites, 0 bare, apronMin 0.786 unmoved,
//     unanchored decor 1 -> 0, strict 0.991 -> 0.6723,
//     fabric 0.9973 -> 0.9952 (the landed figures are
//     FORTY-FIFTH DOCUMENTED EXCEPTION (WAVE T47; the
//     FORTY-FOURTH is WAVE T46 Inglenook's, recorded on
//     its own branch): the registry grows by one scoped
//     entry — solaceon: [pebblefloor] (the rebuild-wave
//     registration the registry's own terms promise each
//     town) — and solaceon's pin migrates PASS -> PASS:
//     the Repose Town rebuild on its own kit from birth
//     ('Olive Shingle & River Pebble', idx 840-843:
//     river-pebble cobble streets, the olive wood shingle
//     roof, the standingstone prop, the eggbasket prop)
//     per WAVE-T47-REPOSE-PLAN.md. Repose shipped a
//     mud-carried PASS: 198 of its 504 cells were tg2 and
//     its conn 110/110 / strict 0.9226 were the mud sea's
//     figures (its whole 207-cell network was the mud
//     plus the day-care yard's path frame). The build
//     retires the mud (tg2 198 -> 0), rebuilds the street
//     graph in pebblefloor (front street, north + south
//     avenues, the UNA spur, the WREN lane threaded down
//     the open x7 column — the x3 column is cottage-bound
//     and the x6 foot rock-bound, both measured — the
//     ruins approach + OSSA road, the east lane, the east
//     meadow lane, the south cross-street, the NE meadow
//     lane, the ruins-face path, and the day-care yard's
//     own dots threaded on pebble frame lanes — no
//     encounter cell touched: commas 7 + dots 9
//     byte-kept, OSSA and WREN still standing on their
//     de-mudded posts), breaks the House + Daycare
//     th-roof share with the olive oliveroof on the
//     Daycare (the painting's olive roofs on the town's
//     namesake building), flanks the Route 210 landing
//     with standing stones, seats egg baskets at the
//     yard's NW corner and the Daycare's east frontage,
//     builds the painting's two facade cottages, tiles
//     its SEVEN invisible DIRS records and marks the one
//     validator-named bare junction with a verbatim DIRS
//     copy at (7,5), and moves the orphaned MART CLERK
//     (3,5) -> (9,4) at his Mart's west-front apron. Gate
//     STATUS holds: pass 1 -> 1, conn 110/110, step-offs
//     7/7, components one 130-cell street graph,
//     junctions 11 sites (the mud blob's) -> 5 sites, 0
//     bare, apronMin 0.938 -> 0.786 (the two facade
//     cottages' rings honestly price the shipped rocks
//     standing in them — the fleet's standing cottage
//     figure, shared with jubilife and hearthome),
//     unanchored decor 0 -> 0, strict 0.9226 -> 0.7077,
//     fabric 0.9948 -> 0.9972 (the landed figures are
//     carried by the authored street graph, not the mud).
//     NO other town's pin moves.
//     sunnyshore's pin, and NO other town's pin moves.
//     The Brightshore City rebuild on its own kit from
//     birth ('Solar Panel & Amber Glint', idx 912-915:
//     golden panel-grid streets, the solar-blue-seamed
//     amber panelroof, the glintpost prop, the
//     coilcradle prop) per WAVE-T53-BRIGHTSHORE-PLAN.md.
//     Brightshore shipped a mud-carried PASS: 178 of its
//     540 cells were tg2 and its conn 132/132 / strict
//     0.9967 were the mud sea's figures (its whole
//     183-cell network was the mud plus the lighthouse
//     garden's path dots). The build retires the mud
//     (tg2 178 -> 0), rebuilds the street graph in
//     panelfloor (the front street, the north road to
//     the shipped r223 exits, the central avenue, the
//     main street, the shore connector + shore road,
//     the west lighthouse lane, the lighthouse step-off
//     and the plot's dot threading), breaks the Gym +
//     Lighthouse tr-roof share with the panelroof on
//     the Gym (the Lighthouse keeps tr-sunnyshore at
//     its backend SW seat — both the approved painting
//     and the backend record support the lighthouse
//     here: a named map, a warp, a sign, a keeper and
//     the town's tale; the warp decides its ground, the
//     painting's NE point is not followed), seats the
//     glintpost pair flanking the avenue at the front
//     street and the tale's coilcradle at the
//     Lighthouse's east shoulder, builds the painting's
//     one facade cottage on the E-mid lawn, tiles its
//     two invisible DIRS and marks the validator-named
//     bare junctions with verbatim DIRS copies at
//     (12,6) and (2,7), and moves the orphaned MART
//     CLERK (3,5) -> (9,4) at his Mart's west-front
//     apron. Gate STATUS holds: pass 1 -> 1, conn
//     132/132, step-offs 8/8, components one 88-cell
//     street graph, junctions 3 sites -> 2 sites, 0
//     bare, apronMin 0.875 -> 0.857 (the facade
//     cottage's ring honestly prices the shipped lamp
//     (21,7) and the lighthouse sign's corner standing
//     in it — the fleet's standing cottage figure,
//     shared with jubilife and hearthome), unanchored
//     decor 0 -> 0, strict 0.9967 -> 0.78, fabric
//     0.9967 -> 0.9979 (the landed figures are carried
//     by the authored street graph, not the mud). NO
//     other town's pin moves.
//     FIFTY-FIRST DOCUMENTED EXCEPTION (WAVE T53; the
//     FIFTIETH is WAVE T52 Rimefall's, recorded below;
//     the branch carried its own FIFTIETH claim — the
//     Director renumbered it at merge per standing
//     practice):
//     STREET_REGISTRY gains an entry — sunnyshore:
//     [panelfloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on
//     its fabric as the fleet's streets are) — and
//     celestic's pin, and NO other town's pin moves.
//     The Astral Town rebuild on its own kit from birth
//     ('Moonstone & Dusk Timber', idx 888-891: pale
//     moonstone-flag streets with violet grout and star
//     flecks, the deep-violet duskroof, the muralpanel
//     prop, the ringstone prop) per
//     WAVE-T51-ASTRAL-PLAN.md. Astral shipped a
//     mud-carried PASS: 159 of its 504 cells were tg2 and
//     its conn 56/56 / strict 1.0 were the mud sea's
//     figures (its whole 159-cell network was the mud).
//     The build retires the mud (tg2 159 -> 0), rebuilds
//     the street graph in moonfloor (the front street,
//     the south road, the east arm to the shipped
//     r210-north exits, the Mart avenue, the plaza avenue
//     and the BLYTHE lane), gives the Shrine the
//     dusk-violet duskroof (the House keeps th-celestic;
//     no roof-share defect existed), seats the mural
//     panels at the OLD SHRINE sign's west shoulder and
//     beside mural-copyist BLYTHE's post (her own
//     dialogue; the Backstory Sync Audit's Astral row),
//     flanks the shrine plaza's north gate with the
//     ring-stone pair (the OLD SHRINE sign's 'ring of
//     stones'), builds the painting's two facade
//     cottages, tiles its one invisible DIRS and marks
//     the validator-named bare junctions with verbatim
//     DIRS copies at (12,6), (6,6), (21,7) and (24,7),
//     and moves the orphaned MART CLERK (3,5) -> (9,4)
//     at his Mart's west-front apron. Gate STATUS holds:
//     pass 1 -> 1, conn 56/56, step-offs 6/6, components
//     one 62-cell street graph, junctions 3 sites -> 5
//     sites, 0 bare, apronMin 0.882 -> 0.857 (the SE
//     facade cottage's ring honestly prices the shipped
//     originstone standing in it — the fleet's standing
//     cottage figure, shared with jubilife and
//     hearthome), unanchored decor 0 -> 0, strict
//     1 -> 0.719, fabric 1 -> 1 (the landed figures are
//     carried by the authored street graph, not the
//     mud). NO other town's pin moves.
//     FORTY-NINTH DOCUMENTED EXCEPTION (WAVE T51; the
//     FORTY-EIGHTH is the parallel WAVE T50 Fenland
//     claim on its branch, per the Director's allocation
//     — the two land in order at merge; the FORTY-SEVENTH
//     is WAVE T49 Bridgeport's, recorded below):
//     STREET_REGISTRY gains an entry — celestic:
//     [moonfloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     FORTY-SEVENTH DOCUMENTED EXCEPTION (WAVE T49; the
//     FORTY-SIXTH is WAVE T48 Shardfall's, recorded on its
//     branch and landed ahead of this one at merge):
//     STREET_REGISTRY gains an entry — canalave:
//     [ringfloor, boardwalk, harbourstone, trussfloor] (the
//     rebuild-wave registers: the town's own kit street
//     plus its shipped walkable paving the raw tiers cannot
//     see — boardwalk, the canal span and the ferry-pier
//     deck, on the W4 Arcport instrument precedent, and
//     harbourstone, the library terrace; trussfloor is the
//     kit's iron truss deck on the span) — and canalave's
//     pin migrates FAIL -> PASS: [0, 36, 90, 8, 8, 3, 3,
//     0, 1, 0.417, 0, 0, 0, 0, 1, 1] -> [1, 90, 90, 8, 8,
//     1, 7, 0, 0, 0.667, 0, 0, 0, 0, 0.6783, 1].
//     Bridgeport City shipped FAILING the gates outright:
//     173 of its 540 cells were tg2-canalave mud (the 35th
//     tg2 town), its conn was 36/90 over THREE network
//     components (the west mud field, the east pier field,
//     and the library's own 4-cell frontage strip severed
//     by its unregistered harbourstone terrace), and the
//     pier-head inn's apron stood at 0.417 with the canal
//     in its ring. The wave retires the mud, rebuilds the
//     street graph in ringfloor (the front street, the
//     library lane and frontage, the west shore lane, the
//     pier link, the bridge avenue, the east field), joins
//     the banks over the span — its four boardwalk cells
//     take the kit's trussfloor, the town sign's 'one iron
//     bridge' made deck — breaks the Gym + Library
//     tr-roof share with the riveted rivetroof carrying a
//     badge roundel on the Gym (the Backstory-Sync-Audit's
//     unmarked-gym flag, marked by roof emblem; no sign
//     text invented), repairs the inn's apron to 0.667
//     with a grass bank on its water flank (a deck there
//     formed a phantom 2-cell fabric component, measured
//     in validation; the canal itself is never paved) and
//     its barrel and lifering re-seated inside the ring,
//     identifies the harbour inn with ONE new sign at
//     (24,2) on the NOCTARCH arc's own record
//     (ev_sinnoh_darkrai_inn: 'the harbour inn at
//     Bridgeport', the quest objective's 'the house by the
//     pier' — house-canalave, kept by HOSTESS ANA, where
//     the inn event is staged), tiles its three invisible
//     DIRS records, marks the two validator-named bare
//     junctions with verbatim DIRS copies at (3,5) and
//     (19,5), builds two facade cottages, seats the
//     mooring posts and the ferry bell, and moves the
//     orphaned MART CLERK (3,5) -> (9,4) at his Mart's
//     west-front apron. Gate STATUS flips: pass 0 -> 1,
//     conn 36/90 -> 90/90, components 3 -> 1, junctions
//     3 -> 7 sites, 0 bare, apronMin 0.417 -> 0.667 (the
//     inn's own ring, honestly pricing the canal at its
//     west flank and its new sign), strict 1 -> 0.6783
//     (the shipped 1 was the mud sea's figure), fabric
//     1 -> 1. NO other town's pin moves.

//     FORTY-SIXTH DOCUMENTED EXCEPTION (WAVE T48; the
//     FORTY-FIFTH is WAVE T47 Repose's, recorded on its
//     own branch): the registry grows by one scoped
//     entry — veilstone: [shardfloor] (the rebuild-wave
//     registration the registry's own terms promise each
//     town) — and veilstone's pin migrates PASS -> PASS:
//     the Shardfall City rebuild on its own kit from
//     birth ('Shard Slate & Star Crate', idx 852-855:
//     cracked shard-flag streets, the checker shardroof,
//     the starcrate prop, the meteorcore prop) per
//     WAVE-T48-SHARDFALL-PLAN.md. Shardfall shipped a
//     mud-carried PASS: 206 of its 540 cells were tg2
//     and its conn 132/132 / strict 0.94 were the mud
//     sea's figures, not the town's. The build retires
//     the mud (tg2 206 -> 0), rebuilds the street graph
//     in shardfloor (the front street with its U-bend
//     around the (8,4) trophycase, both south avenues,
//     the SOL row, the HQ approach, the VEE spur, two
//     cottage lanes and the yard plot's dots threaded
//     on shard — no encounter cell touched: commas 2 +
//     dots 5 byte-kept), breaks the Gym + Dept Store +
//     HQ three-way tr-roof share with the checker
//     shardroof on the Gym (the tale's checkered puzzle
//     floor spilling onto its roof), seats the tale's
//     fallen stone east in SOL's crater garden with one
//     shard transferred north, sets star-marked crates
//     at the HQ landing and BRIN's shoulder, builds the
//     painting's two facade cottages, tiles the five
//     invisible DIRS (the one sharing STELLAN's post
//     cell stands beside him at (20,9)) and marks the
//     validator-named bare junctions
//     with verbatim DIRS copies at (12,5) and (23,13),
//     and moves the orphaned MART CLERK (3,5) -> (9,4)
//     at his Mart's west-front apron. Gate STATUS holds:
//     pass 1 -> 1, conn 132/132, step-offs 8/8,
//     components 1 (a 113-cell street graph), junctions
//     9 mud-blob sites -> 8 real sites, 0 bare, apronMin
//     0.765 unmoved (the Center's byte-kept ring), strict
//     0.94 -> 0.6733, fabric 0.9965 -> 0.9965 (the landed
//     figures are carried by the authored street graph,
//     not the mud). NO other town's pin moves.

//     FORTY-EIGHTH DOCUMENTED EXCEPTION (WAVE T50; the
//     FORTY-SEVENTH is WAVE T49 Bridgeport's, recorded
//     on its own branch — the two land in order at
//     merge): the registry grows by one scoped entry —
//     pastoria: [walkfloor] (the rebuild-wave
//     registration the registry's own terms promise
//     each town) — and pastoria's pin migrates
//     PASS -> PASS: the Fenland City rebuild on its own
//     kit from birth ('Marsh Boardwalk & Bog Eyes', idx
//     876-879: pegged weathered-olive plank streets,
//     the vertical-board boardroof, the bogeyes prop,
//     the lilypad prop) per WAVE-T50-FENLAND-PLAN.md.
//     Fenland shipped a mud-carried PASS: 280 of its
//     504 cells were tg2 — 55.6%, the fleet's worst
//     share — and its conn 182/182 / strict 0.9582 were
//     the mud sea's figures, not the town's. The build
//     retires the mud (tg2 280 -> 0), rebuilds the
//     street graph in walkfloor (the front street, the
//     north avenue, the centre avenue, the west lane,
//     the marsh road, the east lane and the r213 exit
//     cells, the Mire connector, the Solenne spur, the
//     south fans and the pool deck along the south
//     pool's west shore), breaks the Gym + Gatehouse
//     tr-roof share with the vertical-board boardroof
//     on the Gym (the Gatehouse keeps tr), builds the
//     painting's two facade cottages, tiles the five
//     invisible DIRS, marks the validator-named bare
//     junctions with verbatim DIRS copies at (16,11)
//     and (24,7), realizes the recorded MUDGILL beat
//     as bogeyes + lilypad dressing in the south pool
//     (marshbog 23 -> 21 walkable seats; the water
//     encounter table is byte-kept and the dormant
//     land table untouched), and moves the orphaned
//     MART CLERK (3,5) -> (9,4) at his Mart's
//     west-front apron. Gate STATUS holds: pass 1 -> 1,
//     conn 182/182, step-offs 8/8, components 1 (a
//     133-cell street graph), junctions 8 mud sites ->
//     4 real sites, 0 bare, apronMin 0.824 unmoved
//     (the Center's byte-kept ring), unanchored decor
//     0 -> 0, strict 0.9582 -> 0.6288, fabric
//     0.9945 -> 0.994 (the landed figures are carried
//     by the authored street graph, not the mud).
//     NO other town's pin moves.

//     The Rimefall City rebuild on its own kit from birth
//     ('Packed Snow & Drift Cap', idx 900-903: grooved
//     packed-snow streets, the snow-loaded driftroof,
//     the ironbollard prop, the stonelantern prop) per
//     WAVE-T52-RIMEFALL-PLAN.md. Rimefall shipped a
//     mud-carried PASS: 180 of its 504 cells were tg2 and
//     its conn 90/90 / strict 0.998 were the mud sea's
//     figures (its whole 183-cell network was the mud).
//     The build retires the mud (tg2 180 -> 0), rebuilds
//     the street graph in rimefloor (the front street,
//     the lake road on the shipped exits' own latitude,
//     the temple avenue and its precinct wrap — the
//     row-10 connector, the east lane and the garden
//     plot's north row, the only network route to the
//     temple door's ringed 'path' step-off — the Mart
//     avenue, the harbour avenue, the SOLVI lane
//     extended to the south shore, the garden west/south
//     lane and the west shore lane), gives the Gym the
//     drift-cap driftroof (breaking the Gym + Temple
//     tr-snowpoint roof share; the Temple keeps tr),
//     seats the iron bollards on the pier block's
//     shoulders and the stone lanterns at the temple
//     garden's entry, builds the painting's two facade
//     cottages, tiles its three invisible DIRS and marks
//     the validator-named bare junctions with verbatim
//     DIRS copies at (6,5), (12,5) and (7,16), and moves
//     the orphaned MART CLERK (3,5) -> (9,4) at his
//     Mart's west-front apron. Gate STATUS holds:
//     pass 1 -> 1, conn 90/90, step-offs 8/8, components
//     one authored street graph, junctions 3 mud sites
//     -> 5 real sites, 0 bare, apronMin 0.824 -> 0.813
//     (the facade cottages' honest rings — the fleet's
//     standing cottage figure), unanchored decor 0 -> 0,
//     strict 0.998 -> 0.773, fabric 0.9983 -> 0.9959
//     (the landed figures are carried by the authored
//     street graph, not the mud). NO other town's pin
//     moves.
//     FIFTIETH DOCUMENTED EXCEPTION (WAVE T52; the
//     FORTY-NINTH is the parallel WAVE T51 Astral claim
//     on its branch, per the Director's allocation —
//     the two land in order at merge; the FORTY-EIGHTH
//     is WAVE T50 Fenland's, recorded above):
//     STREET_REGISTRY gains an entry — snowpoint:
//     [rimefloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     snowpoint's pin, and NO other town's pin moves.
//     FIFTY-SECOND DOCUMENTED EXCEPTION (WAVE T54; the
//     FIFTY-FIRST is the parallel WAVE T53 Brightshore
//     claim on its branch, per the Director's allocation —
//     the two land in order at merge; the FIFTIETH is
//     WAVE T52 Rimefall's, recorded above):
//     STREET_REGISTRY gains an entry — fight-area:
//     [basaltfloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     fight-area's pin migrates [1, 72, 72, 5, 5, 1, 1,
//     0, 0, 0.941, 0, 0, 0, 0, 1, 1] -> [1, 72, 72, 5, 5,
//     1, 4, 0, 0, 0.929, 0, 0, 0, 0, 0.8295, 1]: the
//     shipped PASS was mud-carried (its single fabric
//     component was exactly its 134 tg2 cells and its
//     one junction 'site' the whole mud blob); the wave
//     retires the mud, rebuilds the graph in basaltfloor
//     (junctions 1 blob -> 4 real sites, all marked;
//     strict 1 -> 0.8295, fabric 1 — the landed figures
//     are carried by the authored street graph, not the
//     mud). NO other town's pin moves.
//     FIFTY-THIRD DOCUMENTED EXCEPTION (WAVE T55; the
//     FIFTY-SECOND is the parallel WAVE T54 Clashfield
//     claim on its branch, per the Director's allocation
//     — the two land in order at merge, so the registry
//     order at merge is …sunnyshore, fight-area,
//     survival-area; the FIFTY-FIRST is WAVE T53
//     Brightshore's, recorded above):
//     STREET_REGISTRY gains an entry — survival-area:
//     [hardpanfloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     survival-area's pin, and NO other town's pin moves.
//     The Wildreach rebuild on its own kit from birth
//     ('Hardpan & Adobe', idx 936-939: hard-packed
//     sand-and-gravel streets, the sun-baked adobe-slab
//     roof, the cookpot prop, the chartstand prop) per
//     WAVE-T55-WILDREACH-PLAN.md. Wildreach shipped a
//     mud-carried PASS: 137 of its 384 cells were tg2
//     and its single fabric component was exactly the
//     mud sea (its conn 72/72 / strict 1.0 were the
//     mud's figures), and the whole town was built from
//     Fenland's -pastoria kind family. The build retires
//     the mud (tg2 137 -> 0), rebuilds the street graph
//     in hardpanfloor (the front street, the hard road
//     west to the shipped r225 exits, the Palmside road
//     south to the r226 exits, the cook's lane, Wren's
//     spur and the shore lane), gives the House the
//     adobe-slab adoberoof (no roof-share defect
//     existed; the Center and Mart stamps keep their
//     shipped roofs), seats the cookpot at TRAIL COOK
//     BORIN's west shoulder (his own dialogue is the
//     outpost kitchen; the Backstory Sync Audit's
//     Wildreach row) and the chartstand at CARTOGRAPHER
//     WREN's north-west shoulder (her re-charting,
//     dressed at her post), builds the painting's two
//     facade cottages, marks the validator-named bare
//     junctions with verbatim town-sign copies at
//     (12,5), (3,7) and (5,13) (the town has no DIRS
//     records — copies carry the town sign's text, the
//     T38/T44/T54 precedent), and moves the orphaned
//     MART CLERK (3,5) -> (9,4) at his Mart's west-front
//     apron. Gate STATUS holds: pass 1 -> 1, conn 72/72,
//     step-offs 5/5, components one 99-cell street
//     graph, junctions 1 mud site -> 3 sites, 0 bare,
//     apronMin 0.941 -> 0.929 (the facade cottages'
//     honest rings — the fleet's standing cottage
//     figure), unanchored decor 0 -> 0, strict 1 ->
//     0.7473, fabric 1 -> 1 (the landed figures are
//     carried by the authored street graph, not the
//     mud). NO other town's pin moves.
//     FIFTY-FOURTH DOCUMENTED EXCEPTION (WAVE T56; the
//     FIFTY-THIRD is the parallel WAVE T55 Wildreach
//     claim on its branch, per the Director's allocation —
//     the two land in order at merge; the FIFTY-SECOND is
//     WAVE T54's, recorded above):
//     STREET_REGISTRY gains an entry — resort-area:
//     [coralfloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     resort-area's pin migrates [1, 182, 182, 6, 6, 1,
//     5, 0, 0, 0.941, 0, 0, 0, 0, 0.944, 0.9846] ->
//     [1, 182, 182, 6, 6, 1, 8, 0, 0, 0.857, 0, 0, 0, 0,
//     0.8323, 0.9829]: the shipped PASS was mud-carried
//     (its single fabric component was exactly its 191
//     tg2 cells — 45.9% of the town, built ENTIRELY from
//     Brightshore's sunnyshore kind family; its largest
//     junction 'site' was the whole mud blob); the wave
//     retires the mud, rebuilds the graph in coralfloor
//     (junctions 1 blob + 4 singletons -> 8 real sites,
//     all marked; strict 0.944 -> 0.8323, fabric 0.9846
//     -> 0.9829, apron 0.941 -> 0.857 — the cottage rings
//     and the thinned graph price the apron; the landed
//     figures are carried by the authored street graph,
//     not the mud). NO other town's pin moves.
//     FIFTY-FIFTH DOCUMENTED EXCEPTION (WAVE T57; the
//     FIFTY-FOURTH is the parallel WAVE T56 Palmside
//     claim on its branch, per the Director's allocation
//     — the two land in order at merge, so the registry
//     order at merge is …survival-area, resort-area,
//     valencia; the FIFTY-THIRD is WAVE T55 Wildreach's,
//     recorded above):
//     STREET_REGISTRY gains an entry — valencia:
//     [dunefloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     valencia's pin migrates FAIL -> PASS (below), and
//     NO other town's pin moves. The Marisol build on
//     its own kit from birth ('Dune Ripple & Kelp
//     Glass', idx 960-963: wind-rippled coral sand
//     streets, the kelp-glass panel roof, the orange
//     crate prop, the shore coral prop) per
//     WAVE-T57-MARISOL-PLAN.md. Marisol shipped an
//     outright FAIL — the Amber Isles set was authored
//     without gate discipline: its two surf exits stood
//     on open water (conn 42/72), its desire routes
//     shortcut the SW encounter plot (fabric 0.9654),
//     and its whole north row of stamps backed onto
//     the sea (apronLow 2, min 0.429). The build
//     rebuilds the shipped street blob in dunefloor,
//     stands the exits on a dunefloor jetty head at the
//     east edge, gives the Lab the kelp-glass kelproof
//     (breaking the shipped Lab/Mart roof-slate share;
//     the BUILD classifier gains 'kelproof' on the
//     same kit-roof terms), completes the north shore's
//     sand beach rim behind the stamps, tiles the two
//     invisible signs, threads the clerk's column and
//     the grove runs on the validator's printed desire
//     lines, re-seats both waist flowers in the grove,
//     and re-seats the orphaned MART CLERK (3,5) ->
//     (17,4). valencia's pin migrates [0, 42, 72, 7, 7,
//     1, 2, 0, 2, 0.429, 0, 0, 0, 0, 0.9654, 0.9654] ->
//     [1, 72, 72, 7, 7, 1, 2, 0, 0, 0.929, 0, 0, 0, 0,
//     0.9808, 0.9808]: pass 0 -> 1, conn 42/72 ->
//     72/72, components 1 -> 1 (209 authored cells),
//     junctions 2 -> 2 (the jetty site marked by a
//     verbatim DIRS copy at (24,7)), apronLow 2 -> 0,
//     apronMin 0.429 -> 0.929 (the House's ring carries
//     the orange crate on its shore), strict/fabric
//     0.9654 -> 0.9808. NO other town's pin moves.
//     FIFTY-SIXTH DOCUMENTED EXCEPTION (WAVE T58; the
//     FIFTY-FIFTH is the parallel WAVE T57 Marisol claim
//     on its branch, per the Director's allocation — the
//     two land in order at merge; the FIFTY-FOURTH is
//     WAVE T56's, recorded above):
//     STREET_REGISTRY gains an entry — mikan:
//     [grovefloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and mikan's
//     pin migrates [0, 42, 72, 7, 7, 1, 4, 0, 3, 0.429,
//     0, 0, 0, 0, 0.9717, 0.9717] -> [1, 72, 72, 7, 7, 1,
//     2, 0, 0, 0.875, 0, 0, 0, 0, 0.9809, 0.9809]: the
//     shipped town FAILED outright — its surf exits
//     stood ON WATER (conn 42/72), its four stamps
//     backed onto the sea (apronLow 3, min 0.429), and
//     FIVE of its seven sign records stood on non-sign
//     tiles, invisible. The wave rebuilds the street
//     graph in grovefloor, lands the exits on a
//     grovefloor jetty head rooted at the west shore,
//     rims the north shore in the island's own sand,
//     breaks the Gym out of the shared roof-slate family
//     with the coral-tile coralroof, seats the grove's
//     citrus trees + pick baskets + the gym's coral
//     banners, tiles all five invisible DIRS records,
//     threads the validator-printed grove lanes, and
//     re-seats the orphaned MART CLERK (3,5) -> (15,4).
//     NO other town's pin moves.
//     FIFTY-EIGHTH DOCUMENTED EXCEPTION (WAVE T60; the
//     FIFTY-SEVENTH is the parallel WAVE T59 Pomelo claim
//     on its branch, per the Director's allocation — the
//     two land in order at merge; the FIFTY-SIXTH is
//     WAVE T58's, recorded above):
//     STREET_REGISTRY gains an entry — moro: [ruinfloor]
//     (the rebuild-wave registration the registry's own
//     terms promise each town: the town's authored street,
//     judged by the gates on its fabric as the fleet's
//     streets are) — and moro's pin migrates [0, 12, 30,
//     4, 4, 1, 1, 0, 1, 0.529, 0, 0, 0, 0, 0.9402,
//     0.9402] -> [1, 30, 30, 4, 4, 1, 3, 0, 0, 0.625, 0,
//     0, 0, 0, 0.9856, 0.9856]: the shipped town FAILED
//     outright — its north surf exits stood ON WATER
//     (conn 12/30), its Center backed onto open sea
//     (apronLow 1, min 0.529), and TWO of its three sign
//     records stood on non-sign tiles, invisible. The
//     wave rebuilds the street graph in ruinfloor, lands
//     the exits on a ruinfloor jetty head, rims the north
//     shore in the island's own sand behind the stamps,
//     breaks the Mart out of the generic roof-slate
//     family with the bone-drift boneroof, seats the surf
//     stone + the wreck ribs, tiles both invisible signs
//     plus one verbatim DIRS copy at the jetty junction,
//     threads the validator-printed shore lanes, re-seats
//     the bench + lamp the lanes straddled, and re-seats
//     the orphaned MART CLERK (3,5) -> (17,4). The town
//     has ZERO unique interiors — exteriors only, no
//     story invented (no tale is recorded for Bergamot).
//     NO other town's pin moves.

//     FIFTY-SEVENTH DOCUMENTED EXCEPTION (WAVE T59; the
//     FIFTY-SIXTH is the parallel WAVE T58 Tangelo
//     claim on its branch, per the Director's allocation
//     — the two land in order at merge, so the registry
//     order at merge is …valencia, mikan, navel; the
//     FIFTY-FIFTH is WAVE T57 Marisol's, recorded
//     above):
//     STREET_REGISTRY gains an entry — navel:
//     [screefloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     navel's pin migrates FAIL -> PASS (below), and
//     NO other town's pin moves. The Pomelo build on
//     its own kit from birth ('Granite Scree & Peak
//     Slate', idx 984-987: crushed-granite scree
//     streets, the peak-slate gym roof, the climbers'
//     cairn prop, the slope pine prop) per
//     WAVE-T59-POMELO-PLAN.md. Pomelo shipped an
//     outright FAIL — the Amber Isles set was authored
//     without gate discipline: BOTH surf-exit pairs
//     stood on open water (conn 30/90), its desire
//     routes shortcut the shore and slope dressing
//     (fabric 0.9418), its north-row stamps backed
//     onto the sea (apronLow 1, Center 0.588), and six
//     of its eight sign records stood invisible on
//     non-sign tiles. The build rebuilds the shipped
//     street blob in screefloor, stands BOTH exit pairs
//     on screefloor jetty heads, gives the Gym the
//     peak-slate peakroof (breaking the shipped
//     Gym/Mart roof-slate share; the BUILD classifier
//     gains 'peakroof' on the same kit-roof terms),
//     completes the north shore's sand beach rim behind
//     the Gym and the Center (the north surf landings
//     (2,1),(3,1) stay water, as shipped), tiles five
//     of the six invisible signs (the (16,5) DIRS keeps
//     the street kind — the validator proved its cell
//     is the summit path's only bridge, rock on every
//     other side; a sign tile there severs the fabric),
//     threads the lanes the validator's route prints
//     named (the west shore two columns wide, the rim
//     row, the Mart-west column, the clerk's shore, the
//     plot's west lane), re-seats five dressing pieces
//     the same prints named (both shore flowers to the
//     rim pair (5,1),(6,1); the signpost (11,13) ->
//     (18,11) and the lamp (11,12) -> (18,12) to the
//     Mart's east slope foot; the bench (4,10) ->
//     (19,15) and the crates (4,11) -> (19,14) to the
//     east shore — the re-seats keep off the east
//     patch's walkable bridge cells, holding the
//     fleet's dead-pocket count at exactly 1070),
//     seats the climbers' cairn and the slope
//     pines, marks the south jetty junction with one
//     verbatim DIRS copy at (3,14), and re-seats the
//     orphaned MART CLERK (3,5) -> (17,13), the Mart's
//     east-front apron ((14,13) is IDA's shipped post).
//     navel's pin migrates [0, 30, 90, 6, 6, 1, 5, 0,
//     1, 0.588, 0, 0, 0, 0, 0.9418, 0.9418] -> [1, 90,
//     90, 6, 6, 1, 5, 0, 0, 0.813, 0, 0, 0, 0, 0.9801,
//     0.9801]: pass 0 -> 1, conn 30/90 -> 90/90,
//     components 1 -> 1 (186 authored cells), junctions
//     5 -> 5 all covered (one verbatim DIRS copy),
//     apronLow 1 -> 0, apronMin 0.588 -> 0.813 (the
//     Mart's ring now carries the re-seated lamp and
//     signpost on its east front), strict/fabric
//     0.9418 -> 0.9801 — the fleet's tightest pass:
//     the entire remaining deficit is the west
//     encounter plot's grass standing on
//     genuinely-shortest desire lines, the plot itself
//     byte-preserved. NO other town's pin moves.
//     FIFTY-NINTH DOCUMENTED EXCEPTION (WAVE T61; the
//     FIFTY-EIGHTH is the parallel WAVE T60 Bergamot
//     claim on its branch, per the Director's allocation
//     — the two land in order at merge, so the registry
//     order at merge is …valencia, mikan, navel, moro,
//     trovita; the FIFTY-SEVENTH is WAVE T59 Pomelo's,
//     recorded above):
//     STREET_REGISTRY gains an entry — trovita:
//     [reeffloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the
//     town's authored street, judged by the gates on its
//     fabric as the fleet's streets are) — and
//     trovita's pin migrates to its post-T61 measured
//     tuple (below), and NO other town's pin moves.
//     UNLIKE the sibling rebuild waves, THIS PIN STAYS
//     pass 0 — DISCLOSED, NOT HIDDEN: every strict gate
//     passes on the landed build (conn 56/56, exactly 1
//     fabric component, apron PASS min 0.813, junctions
//     2/2 covered / bare 0, step-offs 6/6, onFabric 0,
//     orphans 0) EXCEPT fabric, which measures 0.9767
//     against the 0.98 gate — and that shortfall is a
//     STRUCTURAL FACT of the shipped town, not a build
//     defect. The cause, measured on the real audit
//     code (plan §9): the byte-preserved WEST encounter
//     plot shadows CAPT DUNE-BERGAMOT's post at (5,13),
//     which stands directly south of the plot, so every
//     northern POI's shortest line to the dock crosses
//     its grass — 13 desire pairs are Manhattan-optimal
//     through the plot (exactly 4 grass cells each),
//     and 3 of those pairs (sign@3,7 <-> CAPT, and both
//     gym-door <-> CAPT pairs) have NO all-fabric
//     optimal route at all: the captain's access cell
//     (5,12) is simply 2 steps closer via the plot than
//     any fabric goal. Insensitivity is PROVEN, not
//     asserted: 72 legitimate micro-variants (clerk
//     seats (15,4)/(17,4)/(18,4), spike seats, gull
//     seat, (3,8) as spike/sand, rim-lane subsets) all
//     score EXACTLY 0.9767 or worse; clerk (15,4) is
//     the best seat measured. The honest alternatives
//     were all considered and REFUSED — paving the
//     plot breaks byte-preservation fleet law, moving
//     the captain's post rewrites a shipped record to
//     satisfy a metric, and blocking a street cell
//     severs the fabric it claims to protect. The
//     Director approved this exception (#59, 2026-11-14)
//     and the audit's fabric gate stays VISIBLY FAILED
//     for trovita in this pin. The Reefside build on
//     its own kit from birth ('Reef Shell & Spike
//     Stone', idx 1008-1011: pink shell-sand reeffloor
//     streets, the scalloped shell-shingle scalloproof
//     gym crown, the reef-spike and gull-rock props) per
//     WAVE-T61-REEFSIDE-PLAN.md. Reefside shipped an
//     outright FAIL — its two surf exits stood ON WATER
//     at the north edge (conn 30/56, every failing pair
//     touching an exit), its whole street graph was the
//     GENERIC path kind, all three north stamps backed
//     onto the sea (apronLow 3, Gym 0.563), and two of
//     its four sign records stood invisible on non-sign
//     tiles. The build rebuilds the street graph 1:1 in
//     reeffloor, lands the exits on a reeffloor jetty
//     head, rims the north shore in the island's own
//     sand behind the stamps (the (2,1),(3,1) surf
//     LANDINGS stay water), gives the Gym the
//     scalloproof (breaking the shipped Gym/Mart
//     roof-slate share; the BUILD classifier gains
//     'scalloproof' on the same kit-roof terms), tiles
//     both invisible DIRS records (the (3,8) shore cell
//     converts to reeffloor as the (3,7) DIRS line's own
//     lane cell, holding its psand neighbour on the
//     network), seats the reef spikes at both shores
//     and the gull rock at the ferry dock, and re-seats
//     the orphaned MART CLERK (3,5) -> (15,4). Both
//     encounter plots stay byte-for-byte; the sea stays
//     unpaved. trovita's pin migrates [0, 30, 56, 6, 6,
//     1, 3, 0, 3, 0.563, 0, 0, 0, 0, 0.9466, 0.9466] ->
//     [0, 56, 56, 6, 6, 1, 2, 0, 0, 0.813, 0, 0, 0, 0,
//     0.9767, 0.9767]: pass 0 -> 0 (DISCLOSED structural
//     exception — fabric only), conn 30/56 -> 56/56,
//     junctions 3 -> 2 all covered, apronLow 3 -> 0,
//     apronMin 0.563 -> 0.813, strict/fabric 0.9466 ->
//     0.9767. NO other town's pin moves.
//     SIXTIETH DOCUMENTED EXCEPTION (WAVE T62; the
//     parallel WAVE T61 Reefside claim held #59, per the
//     Director's allocation — the two landed in order at
//     merge and this one was renumbered #60, so the
//     registry order is …navel, moro, trovita, kumquat;
//     the FIFTY-EIGHTH is WAVE T60's, recorded above):
//     STREET_REGISTRY gains an entry — kumquat:
//     [mosaicfloor] (the rebuild-wave registration the
//     registry's own terms promise each town: the town's
//     authored street, judged by the gates on its fabric
//     as the fleet's streets are) — and kumquat's pin
//     migrates [0, 42, 72, 7, 7, 1, 6, 0, 3, 0.5, 0, 0, 0,
//     0, 0.9742, 0.9742] -> [1, 72, 72, 7, 7, 1, 4, 0, 0,
//     0.813, 0, 0, 0, 0, 0.9839, 0.9839]: the shipped town
//     FAILED outright — its surf exits stood ON WATER
//     (conn 42/72), its desire routes shortcut the shore
//     dressing (fabric 0.9742), its north-row stamps backed
//     onto the sea (apronLow 3, min 0.5), and THREE of its
//     five sign records stood on non-sign tiles, invisible.
//     The wave rebuilds the street graph in mosaicfloor,
//     stands the exits on a mosaicfloor jetty head, rims
//     the north shore in the island's own sand, breaks the
//     Gym out of the shared roof-slate family with the
//     aqua-glaze aquaroof, seats the jade star + the resort
//     sunshade, tiles two of the three invisible DIRS
//     records — the (3,12) DIRS keeps the street kind: the
//     validator's variant sweep proved its cell is the SW
//     thread's only bridge (a sign tile is a terminal,
//     never transited; tiling it forced the exit lines
//     down the encounter plot's grass column, fabric
//     0.9778; on the street kind the same grid passes at
//     0.9839 — the T59 (16,5) precedent) — threads the
//     validator-printed shore lanes, and re-seats the
//     orphaned MART CLERK (3,5) -> (15,4). Both encounter
//     plots stay byte-for-byte, and the Mart's built sign
//     reads MART (the painting's "Martt" is a reference
//     defect, closed by the Backstory Sync Audit's build
//     note). NO other town's pin moves.

import { loadMaps, makeTiers, townSetOf, analyzeMap } from '../scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor, STREET_REGISTRY } from '../scripts/audit-placement.mjs';

let pass = 0; const failures = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ok ${name}`); }
  else { failures.push(name); console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
}

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps();
const tiers = makeTiers(TILE_CHARS);
const towns = townSetOf(MAPS);
const ids = [...towns].filter((id) => MAPS[id]);

async function gateTuple(id, t) {
  const r = await scoreTown(id, MAPS, WALKABLE, t);
  const clarity = analyzeMap(id, MAPS[id], { WALKABLE, tiers, townSet: towns });
  const gate = gateCheck(r, clarity);
  return { r, gate, tuple: [gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot,
    r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged,
    r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny,
    +clarity.meanStrict.toFixed(4), +clarity.meanFabric.toFixed(4)] };
}

// 1. registry scope lock
ok('street registry is exactly { vermilion: [boardwalk], blackthorn: [settfloor], silvertown: [marblefloor], ecruteak: [wornfloor], saffron: [avenuefloor], violet: [violetfloor], azalea: [brickfloor], mahogany: [gravelfloor], rustboro: [cutstonefloor], fuchsia: [marshfloor], cianwood: [driftfloor], dewford: [plankfloor], viridian: [slatefloor], celadon: [promfloor], slateport: [quayfloor, boardwalk], cerulean: [pierfloor], mauville: [gridfloor], lavender: [shinglefloor], cherrygrove: [inlayfloor], verdanturf: [petalfloor, cavefloor], olivine: [harbourfloor, jettyfloor], fallarbor: [ashfloor], lavaridge: [steamfloor, terracefloor], fortree: [canopyfloor, boardwalk], lilycove: [cobblefloor, cavefloor], mossdeep: [starfloor, dockfloor], sootopolis: [craterfloor, cavefloor], pacifidlog: [raftfloor], evergrande: [plateaufloor, cavefloor], twinleaf: [cloverfloor], sandgem: [shellfloor], jubilife: [beamfloor], oreburgh: [clinkerfloor], floaroma: [honeyfloor], eterna: [heritagefloor], hearthome: [giltfloor], solaceon: [pebblefloor], veilstone: [shardfloor], canalave: [ringfloor, boardwalk, harbourstone, trussfloor], pastoria: [walkfloor], celestic: [moonfloor], snowpoint: [rimefloor], sunnyshore: [panelfloor], fight-area: [basaltfloor], survival-area: [hardpanfloor], resort-area: [coralfloor], valencia: [dunefloor], mikan: [grovefloor], navel: [screefloor], moro: [ruinfloor], trovita: [reeffloor], kumquat: [mosaicfloor] }',
  JSON.stringify(STREET_REGISTRY) === '{"vermilion":["boardwalk"],"blackthorn":["settfloor"],"silvertown":["marblefloor"],"ecruteak":["wornfloor"],"saffron":["avenuefloor"],"violet":["violetfloor"],"azalea":["brickfloor"],"mahogany":["gravelfloor"],"rustboro":["cutstonefloor"],"fuchsia":["marshfloor"],"cianwood":["driftfloor"],"dewford":["plankfloor"],"viridian":["slatefloor"],"celadon":["promfloor"],"slateport":["quayfloor","boardwalk"],"cerulean":["pierfloor"],"mauville":["gridfloor"],"lavender":["shinglefloor"],"cherrygrove":["inlayfloor"],"verdanturf":["petalfloor","cavefloor"],"olivine":["harbourfloor","jettyfloor"],"fallarbor":["ashfloor"],"lavaridge":["steamfloor","terracefloor"],"fortree":["canopyfloor","boardwalk"],"lilycove":["cobblefloor","cavefloor"],"mossdeep":["starfloor","dockfloor"],"sootopolis":["craterfloor","cavefloor"],\"pacifidlog\":[\"raftfloor\"],\"evergrande\":[\"plateaufloor\",\"cavefloor\"],\"twinleaf\":[\"cloverfloor\"],\"sandgem\":[\"shellfloor\"],\"jubilife\":[\"beamfloor\"],\"oreburgh\":[\"clinkerfloor\"],\"floaroma\":[\"honeyfloor\"],\"eterna\":[\"heritagefloor\"],\"hearthome\":[\"giltfloor\"],\"solaceon\":[\"pebblefloor\"],\"veilstone\":[\"shardfloor\"],\"canalave\":[\"ringfloor\",\"boardwalk\",\"harbourstone\",\"trussfloor\"],\"pastoria\":[\"walkfloor\"],\"celestic\":[\"moonfloor\"],\"snowpoint\":[\"rimefloor\"],\"sunnyshore\":[\"panelfloor\"],\"fight-area\":[\"basaltfloor\"],\"survival-area\":[\"hardpanfloor\"],\"resort-area\":[\"coralfloor\"],\"valencia\":[\"dunefloor\"],\"mikan\":[\"grovefloor\"],\"navel\":[\"screefloor\"],\"moro\":[\"ruinfloor\"],\"trovita\":[\"reeffloor\"],\"kumquat\":[\"mosaicfloor\"]}',
  JSON.stringify(STREET_REGISTRY));

// 2. census: the 64 towns of townSetOf (pallet included)
ok('gate census covers 64 towns', ids.length === 64, `${ids.length} ids`);

// 3. negative: raw tiers reproduce the vermilion blindness
// (W-DIFF7 re-pin, documented exception #24 below: the
// retrofit swapped Arcport's last 45 sand-path cells to its
// registered boardwalk, so raw tiers — which cannot see
// boardwalk at all — now score the town at 0/110 with 1/7
// step-offs over 4 components; the negative still proves the
// same blindness, harder. The W4-era values 72/110, 5/7, 1
// were the pre-retrofit measurements.)
{
  const { r, gate } = await gateTuple('vermilion', tiers);
  ok('negative: vermilion on raw tiers still FAILS the gates', gate.pass === false);
  ok('negative: raw-tiers connectivity is the post-W-DIFF7 0/110', r.connOk === 0 && r.connPairs === 110, `${r.connOk}/${r.connPairs}`);
  ok('negative: raw-tiers step-offs are the post-W-DIFF7 1/7', r.stepTouch === 1 && r.stepTot === 7, `${r.stepTouch}/${r.stepTot}`);
  ok('negative: raw-tiers components pin at 4 (post-W-DIFF7: no path cells remain for raw tiers to join)', r.netComponents === 4, `${r.netComponents}`);
}

// 4. per-town pins on the production path (targets use post-W4 pins)
const PIN = {
  "azalea": [1, 132, 132, 8, 8, 1, 8, 0, 0, 0.688, 0, 0, 0, 0, 0.7723, 0.9923],
  "blackthorn": [1, 156, 156, 7, 7, 1, 6, 0, 0, 0.813, 0, 0, 0, 0, 0.7915, 0.988],
  "canalave": [1, 90, 90, 8, 8, 1, 7, 0, 0, 0.667, 0, 0, 0, 0, 0.6783, 1],
  "celadon": [1, 156, 156, 10, 10, 1, 3, 0, 0, 0.611, 0, 0, 0, 0, 0.9725, 1],
  "celestic": [1, 56, 56, 6, 6, 1, 5, 0, 0, 0.857, 0, 0, 0, 0, 0.719, 1],
  "cerulean": [1, 132, 132, 7, 7, 1, 1, 0, 0, 0.625, 0, 0, 0, 0, 0.7314, 0.9839],
  "cherrygrove": [1, 72, 72, 5, 5, 1, 5, 0, 0, 0.688, 0, 0, 0, 0, 0.7126, 0.9902],
  "cianwood": [1, 72, 72, 7, 7, 1, 6, 0, 0, 0.688, 0, 0, 0, 0, 0.7965, 0.9993],
  "cinnabar": [1, 90, 90, 9, 9, 1, 3, 0, 0, 0.769, 0, 0, 0, 0, 0.8694, 1],
  "dewford": [1, 110, 110, 7, 7, 1, 8, 0, 0, 0.625, 0, 0, 0, 0, 0.6945, 0.9864],
  "ecruteak": [1, 156, 156, 11, 11, 1, 6, 0, 0, 0.625, 0, 0, 0, 0, 0.7992, 0.9937],
  "eterna": [1, 182, 182, 8, 8, 1, 2, 0, 0, 0.813, 0, 0, 0, 0, 0.7361, 0.992],
  "evergrande": [1, 42, 42, 5, 5, 1, 10, 0, 0, 0.938, 0, 0, 0, 0, 0.7554, 0.9928],
  "fallarbor": [1, 90, 90, 6, 6, 1, 3, 0, 0, 0.875, 0, 0, 0, 0, 0.7047, 0.9872],
  "fight-area": [1, 72, 72, 5, 5, 1, 4, 0, 0, 0.929, 0, 0, 0, 0, 0.8295, 1],
  "floaroma": [1, 72, 72, 5, 5, 1, 3, 0, 0, 0.857, 0, 0, 0, 0, 0.7784, 0.9811],
  "fortree": [1, 110, 110, 7, 7, 1, 4, 0, 0, 0.824, 0, 0, 0, 1, 0.6701, 0.9801],
  "frontierhub": [1, 210, 210, 15, 15, 1, 3, 0, 0, 0.85, 0, 0, 0, 0, 0.9829, 0.9829],
  "fuchsia": [1, 182, 182, 9, 9, 1, 3, 0, 0, 0.643, 0, 0, 0, 0, 0.8842, 0.9952],
  "goldenrod": [1, 182, 182, 10, 10, 1, 12, 0, 0, 0.65, 0, 0, 0, 0, 0.8671, 0.9828],
  "hearthome": [1, 272, 272, 9, 9, 1, 5, 0, 0, 0.786, 0, 0, 0, 0, 0.6723, 0.9952],
  "indigo": [1, 156, 156, 11, 11, 1, 1, 0, 0, 0.625, 0, 0, 0, 0, 0.9164, 0.988],
  "jubilife": [1, 210, 210, 7, 7, 1, 6, 0, 0, 0.786, 0, 0, 0, 0, 0.6796, 0.9925],
  "kumquat": [1, 72, 72, 7, 7, 1, 4, 0, 0, 0.813, 0, 0, 0, 0, 0.9839, 0.9839],
  "lavaridge": [1, 72, 72, 7, 7, 1, 8, 0, 0, 0.929, 0, 0, 0, 0, 0.6726, 0.9879],
  "lavender": [1, 132, 132, 7, 7, 1, 2, 0, 0, 0.643, 0, 0, 0, 0, 0.7211, 0.9873],
  "lilycove": [1, 72, 72, 5, 5, 1, 9, 0, 0, 0.647, 0, 0, 0, 0, 0.724, 0.9898],
  "littleroot": [1, 90, 90, 8, 8, 1, 15, 0, 0, 0.714, 0, 0, 0, 1, 0.674, 0.9848],
  "mahogany": [1, 156, 156, 7, 7, 1, 5, 0, 0, 0.786, 0, 0, 0, 0, 0.9332, 1],
  "mauville": [1, 210, 210, 7, 7, 1, 11, 0, 0, 0.857, 0, 0, 0, 0, 0.7977, 0.9919],
  "mikan": [1, 72, 72, 7, 7, 1, 2, 0, 0, 0.875, 0, 0, 0, 0, 0.9809, 0.9809],
  "moro": [1, 30, 30, 4, 4, 1, 3, 0, 0, 0.625, 0, 0, 0, 0, 0.9856, 0.9856],
  "mossdeep": [1, 132, 132, 6, 6, 1, 14, 0, 0, 0.643, 0, 0, 0, 0, 0.7436, 0.9944],
  "navel": [1, 90, 90, 6, 6, 1, 5, 0, 0, 0.813, 0, 0, 0, 0, 0.9801, 0.9801],
  "newbark": [1, 72, 72, 7, 7, 1, 5, 0, 0, 0.857, 0, 0, 0, 0, 0.7385, 0.9913],
  "oldale": [1, 110, 110, 5, 5, 1, 11, 0, 0, 0.857, 0, 0, 0, 1, 0.6991, 0.9821],
  "olivine": [1, 110, 110, 7, 7, 1, 11, 0, 0, 0.857, 0, 0, 0, 0, 0.6186, 0.9819],
  "oreburgh": [1, 182, 182, 8, 8, 1, 3, 0, 0, 0.714, 0, 0, 0, 0, 0.7912, 0.9994],
  "pacifidlog": [1, 30, 30, 4, 4, 1, 4, 0, 0, 0.75, 0, 0, 0, 0, 0.6569, 0.9807],
  "pallet": [1, 90, 90, 6, 6, 1, 5, 0, 0, 0.643, 0, 0, 0, 0, 0.9463, 0.9945],
  "pastoria": [1, 182, 182, 8, 8, 1, 4, 0, 0, 0.824, 0, 0, 0, 0, 0.6288, 0.994],
  "petalburg": [1, 110, 110, 7, 7, 1, 10, 1, 0, 0.643, 0, 0, 0, 1, 0.6643, 0.9896],
  "pewter": [1, 110, 110, 8, 8, 1, 6, 0, 0, 0.824, 0, 0, 0, 0, 0.8602, 1],
  "pummelo": [0, 30, 56, 6, 6, 1, 3, 0, 1, 0.529, 0, 0, 0, 0, 0.9639, 0.9639],
  "resort-area": [1, 182, 182, 6, 6, 1, 8, 0, 0, 0.857, 0, 0, 0, 0, 0.8323, 0.9829],
  "rustboro": [1, 156, 156, 7, 7, 1, 5, 0, 0, 0.714, 0, 0, 0, 0, 0.7274, 0.9828],
  "saffron": [1, 156, 156, 10, 10, 1, 2, 0, 0, 0.857, 0, 0, 0, 0, 0.8655, 1],
  "sandgem": [1, 156, 156, 7, 7, 1, 9, 0, 0, 0.824, 0, 0, 0, 0, 0.6668, 0.9888],
  "shamouti": [0, 30, 182, 6, 6, 1, 4, 0, 1, 0.588, 0, 0, 0, 0, 0.912, 0.912],
  "silvertown": [1, 90, 90, 6, 6, 1, 15, 0, 0, 0.706, 0, 0, 0, 0, 0.6654, 0.9896],
  "slateport": [1, 90, 90, 6, 6, 1, 10, 0, 0, 0.857, 0, 0, 0, 0, 0.6244, 0.9974],
  "snowpoint": [1, 90, 90, 8, 8, 1, 5, 0, 0, 0.813, 0, 0, 0, 0, 0.773, 0.9959],
  "solaceon": [1, 110, 110, 7, 7, 1, 5, 0, 0, 0.786, 0, 0, 0, 0, 0.7077, 0.9972],
  "sootopolis": [1, 30, 30, 6, 6, 1, 7, 0, 0, 0.857, 0, 0, 0, 0, 0.7635, 0.981],
  "sunnyshore": [1, 132, 132, 8, 8, 1, 2, 0, 0, 0.857, 0, 0, 0, 0, 0.78, 0.9979],
  "survival-area": [1, 72, 72, 5, 5, 1, 3, 0, 0, 0.929, 0, 0, 0, 0, 0.7473, 1],
  "trovita": [0, 56, 56, 6, 6, 1, 2, 0, 0, 0.813, 0, 0, 0, 0, 0.9767, 0.9767],
  "twinleaf": [1, 90, 90, 6, 6, 1, 3, 0, 0, 0.824, 0, 0, 0, 0, 0.7674, 0.9964],
  "valencia": [1, 72, 72, 7, 7, 1, 2, 0, 0, 0.929, 0, 0, 0, 0, 0.9808, 0.9808],
  "veilstone": [1, 132, 132, 8, 8, 1, 8, 0, 0, 0.765, 0, 0, 0, 0, 0.6733, 0.9965],
  "verdanturf": [1, 90, 90, 6, 6, 1, 4, 0, 0, 0.875, 0, 0, 0, 1, 0.8056, 0.9829],
  "vermilion": [1, 110, 110, 7, 7, 1, 7, 0, 0, 0.8, 0, 0, 0, 0, 0.8378, 0.9961],
  "violet": [1, 156, 156, 9, 9, 1, 4, 0, 0, 0.6, 0, 0, 0, 0, 0.9083, 0.9967],
  "viridian": [1, 240, 240, 7, 7, 1, 3, 0, 0, 0.643, 0, 0, 0, 0, 0.933, 1],};
for (const id of ids) {
  const { tuple } = await gateTuple(id, tiersFor(id, tiers));
  ok(`pin: ${id} gate tuple unchanged`, JSON.stringify(tuple) === JSON.stringify(PIN[id]),
    `got ${JSON.stringify(tuple)} want ${JSON.stringify(PIN[id])}`);
}

console.log(`\nplacement-gates-checks: ${pass} pass, ${failures.length} fail`);
process.exit(failures.length ? 1 : 0);
