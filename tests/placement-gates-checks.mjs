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
//     Tuple: [pass, connOk, connPairs, stepTouch, stepTot, components,
//     junctionSites, junctionsBare, apronLow, apronMin, merged,
//     onFabric, shoulderOrphans, unanchoredAny, strict, fabric].

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
ok('street registry is exactly { vermilion: [boardwalk], blackthorn: [settfloor], silvertown: [marblefloor], ecruteak: [wornfloor], saffron: [avenuefloor], violet: [violetfloor], azalea: [brickfloor], mahogany: [gravelfloor], rustboro: [cutstonefloor], fuchsia: [marshfloor], cianwood: [driftfloor], dewford: [plankfloor], viridian: [slatefloor], celadon: [promfloor], slateport: [quayfloor, boardwalk], cerulean: [pierfloor], mauville: [gridfloor] }',
  JSON.stringify(STREET_REGISTRY) === '{"vermilion":["boardwalk"],"blackthorn":["settfloor"],"silvertown":["marblefloor"],"ecruteak":["wornfloor"],"saffron":["avenuefloor"],"violet":["violetfloor"],"azalea":["brickfloor"],"mahogany":["gravelfloor"],"rustboro":["cutstonefloor"],"fuchsia":["marshfloor"],"cianwood":["driftfloor"],"dewford":["plankfloor"],"viridian":["slatefloor"],"celadon":["promfloor"],"slateport":["quayfloor","boardwalk"],"cerulean":["pierfloor"],"mauville":["gridfloor"]}',
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
  "canalave": [0, 36, 90, 8, 8, 3, 3, 0, 1, 0.417, 0, 0, 0, 0, 1, 1],
  "celadon": [1, 156, 156, 10, 10, 1, 3, 0, 0, 0.611, 0, 0, 0, 0, 0.9725, 1],
  "celestic": [1, 56, 56, 6, 6, 1, 3, 0, 0, 0.882, 0, 0, 0, 0, 1, 1],
  "cerulean": [1, 132, 132, 7, 7, 1, 1, 0, 0, 0.625, 0, 0, 0, 0, 0.7314, 0.9839],
  "cherrygrove": [1, 72, 72, 5, 5, 1, 5, 0, 0, 0.688, 0, 0, 0, 0, 0.7126, 0.9902],
  "cianwood": [1, 72, 72, 7, 7, 1, 6, 0, 0, 0.688, 0, 0, 0, 0, 0.7965, 0.9993],
  "cinnabar": [1, 90, 90, 9, 9, 1, 3, 0, 0, 0.769, 0, 0, 0, 0, 0.8694, 1],
  "dewford": [1, 110, 110, 7, 7, 1, 8, 0, 0, 0.625, 0, 0, 0, 0, 0.6945, 0.9864],
  "ecruteak": [1, 156, 156, 11, 11, 1, 6, 0, 0, 0.625, 0, 0, 0, 0, 0.7992, 0.9937],
  "eterna": [1, 182, 182, 8, 8, 1, 7, 0, 0, 0.813, 0, 0, 0, 0, 0.9593, 0.9921],
  "evergrande": [0, 12, 42, 5, 5, 2, 4, 0, 0, 0.938, 0, 0, 0, 0, 0.9773, 0.9778],
  "fallarbor": [1, 90, 90, 6, 6, 1, 5, 0, 0, 0.875, 0, 0, 0, 0, 0.9463, 0.984],
  "fight-area": [1, 72, 72, 5, 5, 1, 1, 0, 0, 0.941, 0, 0, 0, 0, 1, 1],
  "floaroma": [1, 72, 72, 5, 5, 1, 1, 0, 0, 0.941, 0, 0, 0, 0, 0.9994, 0.9994],
  "fortree": [0, 72, 110, 7, 7, 1, 2, 0, 0, 0.824, 0, 0, 0, 0, 0.9756, 0.9805],
  "frontierhub": [1, 210, 210, 15, 15, 1, 3, 0, 0, 0.85, 0, 0, 0, 0, 0.9829, 0.9829],
  "fuchsia": [1, 182, 182, 9, 9, 1, 3, 0, 0, 0.643, 0, 0, 0, 0, 0.8842, 0.9952],
  "goldenrod": [1, 182, 182, 10, 10, 1, 12, 0, 0, 0.65, 0, 0, 0, 0, 0.8671, 0.9828],
  "hearthome": [1, 272, 272, 9, 9, 1, 3, 0, 0, 0.786, 0, 0, 0, 1, 0.991, 0.9973],
  "indigo": [1, 156, 156, 11, 11, 1, 1, 0, 0, 0.625, 0, 0, 0, 0, 0.9164, 0.988],
  "jubilife": [1, 210, 210, 7, 7, 1, 11, 0, 0, 0.813, 0, 0, 0, 0, 0.9336, 0.9978],
  "kumquat": [0, 42, 72, 7, 7, 1, 6, 0, 3, 0.5, 0, 0, 0, 0, 0.9742, 0.9742],
  "lavaridge": [0, 72, 72, 7, 7, 1, 1, 0, 0, 0.929, 0, 0, 0, 0, 0.9715, 0.9715],
  "lavender": [1, 132, 132, 7, 7, 1, 2, 0, 0, 0.643, 0, 0, 0, 0, 0.7211, 0.9873],
  "lilycove": [0, 42, 72, 5, 5, 1, 8, 0, 0, 0.706, 0, 0, 0, 0, 0.9249, 0.9687],
  "littleroot": [1, 90, 90, 8, 8, 1, 15, 0, 0, 0.714, 0, 0, 0, 1, 0.674, 0.9848],
  "mahogany": [1, 156, 156, 7, 7, 1, 5, 0, 0, 0.786, 0, 0, 0, 0, 0.9332, 1],
  "mauville": [1, 210, 210, 7, 7, 1, 11, 0, 0, 0.857, 0, 0, 0, 0, 0.7977, 0.9919],
  "mikan": [0, 42, 72, 7, 7, 1, 4, 0, 3, 0.429, 0, 0, 0, 0, 0.9717, 0.9717],
  "moro": [0, 12, 30, 4, 4, 1, 1, 0, 1, 0.529, 0, 0, 0, 0, 0.9402, 0.9402],
  "mossdeep": [0, 30, 132, 6, 6, 2, 3, 0, 0, 0.667, 0, 0, 0, 0, 0.9289, 0.9289],
  "navel": [0, 30, 90, 6, 6, 1, 5, 0, 1, 0.588, 0, 0, 0, 0, 0.9418, 0.9418],
  "newbark": [1, 72, 72, 7, 7, 1, 5, 0, 0, 0.857, 0, 0, 0, 0, 0.7385, 0.9913],
  "oldale": [1, 110, 110, 5, 5, 1, 11, 0, 0, 0.857, 0, 0, 0, 1, 0.6991, 0.9821],
  "olivine": [0, 72, 110, 7, 7, 1, 9, 0, 0, 0.929, 0, 0, 0, 0, 0.9134, 0.9864],
  "oreburgh": [1, 182, 182, 8, 8, 1, 1, 0, 0, 0.714, 0, 0, 0, 0, 0.9985, 1],
  "pacifidlog": [0, 12, 30, 4, 4, 1, 0, 0, 0, 0.75, 0, 0, 0, 0, 0.9367, 0.9367],
  "pallet": [1, 90, 90, 6, 6, 1, 5, 0, 0, 0.643, 0, 0, 0, 0, 0.9463, 0.9945],
  "pastoria": [1, 182, 182, 8, 8, 1, 8, 0, 0, 0.824, 0, 0, 0, 0, 0.9582, 0.9945],
  "petalburg": [1, 110, 110, 7, 7, 1, 10, 1, 0, 0.643, 0, 0, 0, 1, 0.6643, 0.9896],
  "pewter": [1, 110, 110, 8, 8, 1, 6, 0, 0, 0.824, 0, 0, 0, 0, 0.8602, 1],
  "pummelo": [0, 30, 56, 6, 6, 1, 3, 0, 1, 0.529, 0, 0, 0, 0, 0.9639, 0.9639],
  "resort-area": [1, 182, 182, 6, 6, 1, 5, 0, 0, 0.941, 0, 0, 0, 0, 0.944, 0.9846],
  "rustboro": [1, 156, 156, 7, 7, 1, 5, 0, 0, 0.714, 0, 0, 0, 0, 0.7274, 0.9828],
  "saffron": [1, 156, 156, 10, 10, 1, 2, 0, 0, 0.857, 0, 0, 0, 0, 0.8655, 1],
  "sandgem": [1, 156, 156, 7, 7, 1, 1, 0, 0, 0.833, 0, 0, 0, 0, 1, 1],
  "shamouti": [0, 30, 182, 6, 6, 1, 4, 0, 1, 0.588, 0, 0, 0, 0, 0.912, 0.912],
  "silvertown": [1, 90, 90, 6, 6, 1, 15, 0, 0, 0.706, 0, 0, 0, 0, 0.6654, 0.9896],
  "slateport": [1, 90, 90, 6, 6, 1, 10, 0, 0, 0.857, 0, 0, 0, 0, 0.6244, 0.9974],
  "snowpoint": [1, 90, 90, 8, 8, 1, 3, 0, 0, 0.824, 0, 0, 0, 0, 0.998, 0.9983],
  "solaceon": [1, 110, 110, 7, 7, 1, 11, 0, 0, 0.938, 0, 0, 0, 0, 0.9226, 0.9948],
  "sootopolis": [0, 30, 30, 6, 6, 1, 3, 0, 1, 0.588, 0, 0, 0, 0, 0.9831, 0.9834],
  "sunnyshore": [1, 132, 132, 8, 8, 1, 3, 0, 0, 0.875, 0, 0, 0, 0, 0.9967, 0.9967],
  "survival-area": [1, 72, 72, 5, 5, 1, 1, 0, 0, 0.941, 0, 0, 0, 0, 1, 1],
  "trovita": [0, 30, 56, 6, 6, 1, 3, 0, 3, 0.563, 0, 0, 0, 0, 0.9466, 0.9466],
  "twinleaf": [1, 90, 90, 6, 6, 1, 3, 0, 0, 0.824, 0, 0, 0, 0, 0.9833, 0.994],
  "valencia": [0, 42, 72, 7, 7, 1, 2, 0, 2, 0.429, 0, 0, 0, 0, 0.9654, 0.9654],
  "veilstone": [1, 132, 132, 8, 8, 1, 9, 0, 0, 0.765, 0, 0, 0, 0, 0.94, 0.9965],
  "verdanturf": [0, 56, 90, 6, 6, 1, 1, 0, 0, 0.875, 0, 0, 0, 0, 0.9444, 0.9553],
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
