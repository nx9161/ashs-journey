// audit-placement.mjs — Wave H permanent placement-relativity scorer
// + CLEAN-standard checks (owner exemplars, 2026-11-12).
//
// Per settlement (the 62 + pallet as reference town):
//   R1 door links (route-to-exit dressed fraction per door)
//   R2 objects across path lines   R3 unsigned junctions
//   R4 lamp coverage                R5 building separation
//   R6/R7 decor anchoring + walkway connectivity
//   CLEAN: PATH-FABRIC (network components, step-offs on/touching),
//          APRON (building ring clearance), ANCHOR-UNIT (any-anchor),
//          EDGE-MASS (trees in the edge band), JUNCTION-MARK coverage.
// --gates evaluates the Phase 2 acceptance gates per town:
//   strict >= 0.60, fabric >= 0.98 (from audit-desire-paths),
//   100% door step-offs on/touching the fabric, exactly ONE fabric
//   component, junction-mark coverage >= 90%, unanchored decor <= 5%,
//   APRON: no building under 60% ring clearance and no gap-0 pair,
//   FREESTANDING-CLEARANCE (owner rule, 2026-11-12): zero freestanding
//   objects straddled by fabric (fabric on both opposite sides), and
//   every freestanding object shoulder-adjacent (within 1 tile of a
//   fabric edge / building / junction site). Fences (borders) and
//   composed building units (postbox at its door, building signs,
//   stalls) are exempt by the rule's own terms.
// Usage: node scripts/audit-placement.mjs [--map id[,id...]]
//        [--overlay file.json] [--gates] [--json out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadMaps, makeTiers, townSetOf, analyzeMap } from './audit-desire-paths.mjs';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DECOR_KINDS = ['lamp', 'fence', 'flowerbed', 'sign', 'flower', 'railfence'];
// ('railfence': the T32 Ashfall Town kit prop — a fence is decor by
// construction; registered so the town's south planters anchor to
// its fence line, WAVE-T32-ASHFALL-PLAN.md §6 round 2.)
// FREESTANDING objects (owner rule): independent objects that must
// stand on the shoulder, never straddled by the fabric. Exempt:
// 'fence' (runs as borders), composed building units (postbox, stall,
// sign-lab/sign-center/sign-gym/sign-mart are building-attached).
// The STRADDLE count covers every freestanding kind incl. landscaping
// (td-*, flower, flowerbed). SHOULDER-ADJACENCY gates only the route
// furniture — the rule's own list (lamps, signs, pots, barrels,
// standalone props); td-*/flower landscaping is governed by
// ANCHOR-UNIT + EDGE-MASS (tree-band dress pieces are vegetation
// mass, not roadside furniture) and is reported, not gated.
const FREESTANDING = (k) => k === 'lamp' || k === 'signpost' || k.startsWith('td-') ||
  ['flower', 'flowerbed', 'barrel', 'crates', 'sandcrate', 'well', 'bench', 'statue', 'pottedtree', 'haycart'].includes(k);
const ROUTE_FURNITURE = (k) => ['lamp', 'signpost', 'barrel', 'crates', 'sandcrate', 'well', 'bench', 'statue', 'pottedtree', 'haycart'].includes(k);
// BUILD: a building's MASS. Beyond the roof/wall/door families, the kit
// authors structural building parts under their own kinds — gym roof
// bands (gym-rock, gym-volt) and the museum/lab display + column parts
// (fossildisplay, dresswindow, ancientpillar). Before W4 the classifier
// missed them, so one visual building fragmented into several
// "footprints" whose parts filled each other's apron rings (Flintridge:
// the Mart read as two footprints merged at gap 0, the museum/gym
// complex at 0.32 ring clearance). They are mass, not neighbours.
// The roof SIGN faces (sign-gym, sign-lab, sign-center, sign-mart) are
// deliberately NOT mass: a sign is a face hung on a building, and
// counting it as structure would credit a floating sign as a bridge —
// Craterlake's Center sign sits in its building's ring and would lift
// that ring 0.588 -> 0.625 without a single tile moving (W4 probe).
const BUILD = (k) => k.startsWith('roof') || k.startsWith('wall') || k.startsWith('door') || k.startsWith('th-') || k.startsWith('tr-') || k.startsWith('tl-') || k.startsWith('tw-') || ['house', 'gymwall', 'gymdoor', 'centerdoor', 'gym-rock', 'gym-volt', 'fossildisplay', 'dresswindow', 'ancientpillar', 'drakeroof', 'parapetroof', 'slabroof', 'cedarroof', 'thatchroof', 'sageroof', 'towerroof', 'mossroof', 'pineroof', 'coproof', 'safariroof', 'surfroof', 'shackroof', 'slateroof', 'glassroof', 'canvasroof', 'mansardroof', 'copperroof', 'bronzroof', 'shingleroof', 'sakuraroof', 'trellisroof', 'beaconroof', 'timberroof', 'steamroof', 'leafroof', 'lotusroof', 'starroof', 'craterroof', 'craterwall', 'raftroof', 'badgeroof', 'verdiroof', 'battenroof', 'shellroof', 'beamroof', 'condoroof', 'ironroof', 'bloomroof', 'heritageroof'].includes(k);// ('drakeroof'/'parapetroof': the W-DIFF kit-identity roof kinds —
// wall-class roofs that don't carry the roof-/th- prefixes; registered
// here so house footprints/aprons measure whole, W-DIFF-AUDIT Phase C.
// 'slabroof'/'cedarroof': the W-DIFF2 pair's roof kinds, same terms.)
// ('thatchroof': the T24 Eldergrove kit-identity roof kind — same
// wall-class registration, WAVE-T24-ELDERGROVE-PLAN.md kit register.)
// ('sageroof': the T25 Meadowbrook kit-identity roof kind — same
// wall-class registration, WAVE-T25-MEADOWBROOK-PLAN.md kit register.)
// ('towerroof': the W-DIFF3 Iris City kit-identity roof kind — same
// wall-class registration, W-DIFF-AUDIT Phase B.)
// ('mossroof'/'pineroof': the W-DIFF4 Cinder + Redwood kit-identity
// roof kinds — same wall-class registration, W-DIFF-AUDIT Phase B.)
// ('safariroof'/'surfroof': the W-DIFF5 Bramble + Tidewall kit-identity
// roof kinds — same wall-class registration, W-DIFF-AUDIT Phase B.)
// ('coproof': the T26 Copperton kit-identity roof kind — same
// wall-class registration, WAVE-T26-COPPERTON-PLAN.md kit register.)
// ('shackroof': the T27 Mistford kit-identity roof kind — same
// wall-class registration, WAVE-T27-MISTFORD-PLAN.md kit register.)
// ('slateroof'/'glassroof': the W-DIFF6 Fernmere + Canopy kit-identity
// roof kinds — same wall-class registration, W-DIFF-AUDIT Phase B.)
// ('canvasroof': the T28 Fairhaven kit-identity roof kind — same
// wall-class registration, WAVE-T28-FAIRHAVEN-PLAN.md kit register.)
// ('mansardroof'/'copperroof': the W-DIFF7 Tidehaven + Arcport
// kit-identity roof kinds — same wall-class registration,
// W-DIFF-AUDIT Phase B.)
// ('bronzroof': the T29 Lilac City kit-identity roof kind — same
// wall-class registration, WAVE-T29-LILAC-PLAN.md kit register.)
// ('shingleroof'/'sakuraroof': the W-DIFF8 Hushmoor + Blossom
// kit-identity roof kinds — same wall-class registration,
// W-DIFF-AUDIT Phase B.)
// ('trellisroof': the T30 Wildflower Town kit-identity roof kind —
// same wall-class registration, WAVE-T30-WILDFLOWER-PLAN.md kit
// register.)
// ('timberroof': the T32 Ashfall Town kit-identity roof kind — same
// wall-class registration, WAVE-T32-ASHFALL-PLAN.md kit register.)
// ('steamroof': the T33 Steamspring Town kit-identity roof kind —
// same wall-class registration, WAVE-T33-STEAMSPRING-PLAN.md kit
// register.)
// ('leafroof': the T34 Highbranch City kit-identity roof kind — same
// wall-class registration, WAVE-T34-HIGHBRANCH-PLAN.md kit register.)
// ('starroof': the T36 Starfall City kit-identity roof kind — same
// wall-class registration, WAVE-T36-STARFALL-PLAN.md kit register.)
// ('craterroof'/'craterwall': the T37 Craterlake City kit-identity
// kinds — same wall-class registration, WAVE-T37-CRATERLAKE-PLAN.md
// kit register.)
// ('raftroof': the T38 Driftlog Town kit-identity roof kind — same
// wall-class registration, WAVE-T38-DRIFTLOG-PLAN.md kit register.
// 'coraldoor' is deliberately NOT registered here: it replaces the
// shipped facade-panel cells, which are not BUILD mass either, so
// Driftlog's house footprints and aprons measure exactly as
// shipped.)
// STREET-MATERIAL REGISTRY (W4, 2026-11-13). The network tier counts
// the universal street materials (path, psand*, tg2-*). A town whose
// CLEAN build record authors a dressed material AS its street fabric
// registers that material here, per town: vermilion — the T6 build
// record seats Arcport's gym on the boardwalk dock street and keeps
// the captains' row on it; boardwalk is the harbour's street material
// (the desire-paths fabric tier already counts it via DRESSED_KINDS).
// Without the registration the audit was blind to the dock street:
// gym step-offs 5/7, connectivity 72/110 — while the walkable graph
// itself connects 177/177 (T6 CHECKLIST residual, closed by W4).
// NOT registered, deliberately (as written at W4): fortree /
// slateport / pacifidlog boardwalk was un-rebuilt legacy state
// whose connectivity belonged to their rebuild waves (they
// register, and mark their junctions, when they are brought to
// the CLEAN standard) — all three rebuild waves have since
// landed (slateport T28, fortree T34, pacifidlog T38, each
// registering its own authored material); sunnyshore's harbourstone
// is decorative inlay speckle, not a street, and is not registrable
// as one. tests/placement-gates-checks.mjs pins this registry's exact
// contents and every unregistered town's baseline gate tuple, so the
// registration can neither leak nor silently widen.
export const STREET_REGISTRY = { vermilion: ['boardwalk'], blackthorn: ['settfloor'], silvertown: ['marblefloor'], ecruteak: ['wornfloor'], saffron: ['avenuefloor'], violet: ['violetfloor'], azalea: ['brickfloor'], mahogany: ['gravelfloor'], rustboro: ['cutstonefloor'], fuchsia: ['marshfloor'], cianwood: ['driftfloor'], dewford: ['plankfloor'], viridian: ['slatefloor'], celadon: ['promfloor'] , slateport: ['quayfloor', 'boardwalk'], cerulean: ['pierfloor'], mauville: ['gridfloor'], lavender: ['shinglefloor'], cherrygrove: ['inlayfloor'], verdanturf: ['petalfloor', 'cavefloor'], olivine: ['harbourfloor', 'jettyfloor'], fallarbor: ['ashfloor'], lavaridge: ['steamfloor', 'terracefloor'], fortree: ['canopyfloor', 'boardwalk'], lilycove: ['cobblefloor', 'cavefloor'], mossdeep: ['starfloor', 'dockfloor'], sootopolis: ['craterfloor', 'cavefloor'], pacifidlog: ['raftfloor'], evergrande: ['plateaufloor', 'cavefloor'], twinleaf: ['cloverfloor'], sandgem: ['shellfloor'], jubilife: ['beamfloor'], oreburgh: ['clinkerfloor'], floaroma: ['honeyfloor'], eterna: ['heritagefloor'] };// W-DIFF pilot extension (2026-11-13, documented exception #6/#7 in the
// guard): blackthorn's settfloor and silvertown's marblefloor are the
// first two kit-level identity street materials (owner ruling: "Every
// town kit should be different" — muse-directive/W-DIFF-AUDIT.md Phase
// B/C). Each is registered to exactly its one town, like boardwalk.
// W-DIFF2 extension (documented exceptions #9/#10 in the guard):
// ecruteak's wornfloor (Cedar & Ashen Stone) and saffron's avenuefloor
// (Gold Spire & Avenue Slab) join on identical terms — one material,
// one town each.
// W-DIFF3 extension (TWELFTH documented exception in the guard):
// violet's violetfloor (Tower Stone & Maple) joins on identical
// terms — one material, one town.
// W-DIFF4 extension (FOURTEENTH + FIFTEENTH documented exceptions
// in the guard): azalea's brickfloor (Charcoal & Kiln Brick) and
// mahogany's gravelfloor (Pine & Lake Gravel) join on identical
// terms — one material, one town each.
// T26 extension (SIXTEENTH documented exception in the guard;
// renumbered at merge — the branch's #14 was taken on main by
// W-DIFF4's azalea #14 / mahogany #15):
// rustboro's cutstonefloor (Cut-Stone & Copper) joins on identical
// terms — one material, one town: Copperton's quarry-flag
// avenue stone, authored as its street fabric in the T26 build
// (WAVE-T26-COPPERTON-PLAN.md).
// W-DIFF5 extension (SEVENTEENTH + EIGHTEENTH documented exceptions
// in the guard): fuchsia's marshfloor (Thatch & Marsh) and
// cianwood's driftfloor (Driftwood & Surf Stone) join on identical
// terms — one material, one town each: Bramble's marsh boardwalk
// and Tidewall's bleached driftwood, each authored as its town's
// street fabric in the W-DIFF5 identity retrofit (the audit's
// closest remaining shared-kit pair, A.3 #9). Both towns keep
// sand path on their shores (Bramble's marsh landing, Tidewall's
// promenade) — the registration covers the boardwalk/driftwood
// sections only, exactly the table's 'boardwalk + sand' split.
// W-DIFF6 extension (TWENTIETH + TWENTY-FIRST documented exceptions
// in the guard): viridian's slatefloor (Slate Gable & Evergreen) and
// celadon's promfloor (Glass Dome & Promenade) join on identical
// terms — one material, one town each: Fernmere's dark slate setts
// and Canopy's sage-stone promenade slabs, each authored as its
// town's street fabric in the W-DIFF6 identity retrofit (the audit's
// closest remaining shared-kit pair, A.3 #10).
// T28 extension (TWENTY-SECOND documented exception in the guard):
// slateport registers TWO materials on the same one-town terms —
// 'quayfloor' (Canvas Market & Quay Stone), Fairhaven's new kit
// street authored in the T28 build, and 'boardwalk', the harbour
// pier's SHIPPED material. slateport was one of the three towns
// named above as deliberately unregistered — its boardwalk was
// un-rebuilt legacy state whose connectivity belonged to its
// rebuild wave; this is that wave, and it registers the pier
// exactly as W4 registered vermilion's (the harbour's street
// material), while the town streets themselves take the new kit
// kind rather than widening boardwalk's use. (Register:
// WAVE-T28-FAIRHAVEN-PLAN.md.)
// W-DIFF7 extension (TWENTY-THIRD documented exception in the
// guard): cerulean's pierfloor (Boardwalk & Mansard) joins on
// identical terms — one material, one town: Tidehaven's
// vertical sea-worn pier planks, authored as its town's street
// fabric in the W-DIFF7 identity retrofit (the two Arden
// harbour cities). The table names 'boardwalk' as Tidehaven's
// street, but boardwalk is vermilion's registered material —
// Tidehaven takes its own pier timber in the same register,
// and its shipped boardwalk dock/shore cells take pierfloor
// with the streets. Arcport needs NO new registration: its
// retrofit completes the W4 registration, swapping its
// remaining sand-path street cells to the boardwalk material
// it already owns.
// T29 extension (TWENTY-FIFTH documented exception in the guard):
// mauville registers ONE material on the same one-town terms —
// 'gridfloor' (Bronze Grid & Sunlamp), Lilac City's new kit street
// authored in the T29 build: the fine bronze sett grid the
// crossroads is paved with, exits included, on the town's own
// rebuild wave. (Register: WAVE-T29-LILAC-PLAN.md.)
// W-DIFF8 extension (TWENTY-SIXTH + TWENTY-SEVENTH documented
// exceptions in the guard): lavender's shinglefloor (Violet
// Shingle & Memorial Stone) and cherrygrove's inlayfloor (Sakura
// & Harbour Stone) join on identical terms — one material, one
// town each: Hushmoor's dark violet-grey gravel and Blossom's
// inlaid harbour-stone slabs, each authored as its town's street
// fabric in the W-DIFF8 identity retrofit (the two remaining
// small garden towns on the shared kit; pair re-measured
// 0.2003 on main 8066f86). The table names 'harbourstone' as
// Blossom's street, but harbourstone is Canalave's dressed
// stone, sunnyshore wears it as decorative inlay speckle, and
// this registry's own standing note holds it 'not registrable
// as one [a street]' — so Blossom takes a distinct variant in
// the same register, and its tide-table plaza keeps the shipped
// harbourstone block byte-kept.
// T30 extension (TWENTY-EIGHTH documented exception in the guard):
// verdanturf registers TWO materials on the same one-town terms —
// 'petalfloor' (Rose Trellis & Petal Lane), Wildflower Town's new
// kit street authored in the T30 build, and 'cavefloor', the
// Copperbore Tunnel mouth's SHIPPED floor. verdanturf shipped an
// outright gate FAIL whose root cause sat here: its tunnel exits
// stand on cavefloor, a kind no network tier counts, so the west
// door could never join the town's connectivity at all. The mouth's
// cave floor is the tunnel's own authored threshold, not mud — the
// wave registers it rather than paving the cave mouth in petal
// gravel (the slateport two-material precedent: kit street + the
// shipped threshold material). (Register:
// WAVE-T30-WILDFLOWER-PLAN.md §3.6.)
// T31 extension (TWENTY-NINTH documented exception in the
// guard): olivine registers TWO materials on the slateport
// terms — 'harbourfloor' (Gleam Lamp & Harbour Plank), Beacon
// City's bolted harbour decking, and 'jettyfloor', its tarred
// cross-batten sibling at the Route 40 landfall, both authored
// as the town's street fabric in the T31 build on the owner's
// daylight ruling (the shipped landfall stood on open water —
// exits and landings on surf cells, connectivity 72/110; the
// jetty is the crossing's landing, WAVE-T31-BEACON-PLAN §4.4).
// T32 extension (THIRTIETH documented exception in the guard):
// fallarbor registers 'ashfloor' (Weathered Timber & Swept Ash),
// Ashfall Town's new kit street authored in the T32 build.
// fallarbor shipped a PASS whose fabric WAS the defect — a single
// 220-cell component of which 209 cells were tg2 mud; the wave
// retires the mud and the town's network becomes its authored
// street graph. One material, one town, same terms as every
// registration above. (Register: WAVE-T32-ASHFALL-PLAN.md §5/§7.)
// T33 extension (THIRTY-FIRST documented exception in the
// guard): lavaridge registers TWO materials on the slateport
// terms — 'steamfloor' (Rustflag & Steam Terrace), Steamspring
// Town's rust flagstone street (the "spring street" of its
// town sign), and 'terracefloor', its pale mineral-crust
// sibling on the hot spring's terrace ring, both authored as
// the town's street fabric in the T33 build (the shipped town
// stood on a 180-cell tg2 mud sea whose network WAS the mud;
// WAVE-T33-STEAMSPRING-PLAN.md §3/§5).
// T34 extension (THIRTY-SECOND documented exception in the guard;
// #31 is T33 Steamspring's parallel claim, per the Director's
// allocation): fortree registers 'canopyfloor' + 'boardwalk'
// (Leafscale & Lashed Plank), Highbranch City's kit street
// authored in the T34 build, on the same terms as slateport's
// two-material line above. fortree shipped a FAIL on
// connectivity alone — its two Route 119 exits stand on the
// Long Walkway's boardwalk decks, the town's own authored high
// street, which no tier counted for this town (72/110, the 38
// failing pairs exactly the exits' pairs). The registry records
// the deck as the street it already is — no deck cell is
// re-paved (the T30 cavefloor ruling, one size larger) — and
// the wave retires the town's 205-cell tg2 mud sea behind its
// authored street graph. (Register: WAVE-T34-HIGHBRANCH-PLAN.md
// §5/§7.)
// T35 extension (THIRTY-THIRD documented exception in the
// guard): lilycove registers TWO materials on the verdanturf
// terms — 'cobblefloor' (Lavender Tile & Cobble Harbour),
// Lotus Cove City's round-cobble harbour stone street, and
// 'cavefloor', the shipped threshold material of its two
// harbour-cave mouths (magma-hideout / aqua-hideout warps in
// the north cliff brow), which joins the network by registry
// with a paved cave lane, both authored in the T35 build (the
// shipped town FAILED outright: its 190-cell tg2 web was the
// network and its Route 124 exits stood on open water;
// WAVE-T35-LOTUSCOVE-PLAN.md §3/§5).
// T36 extension (THIRTY-FOURTH documented exception in the guard;
// #33 is T35 Lotus Cove's parallel claim, per the Director's
// allocation): mossdeep registers 'starfloor' + 'dockfloor'
// (Starshingle & Dock Plank), Starfall City's kit street and pier
// materials, on the same terms as slateport's two-material line
// above. mossdeep shipped the fleet's worst raw FAIL — 30/132,
// every pair touching an exit failing by construction, because
// all six of the island town's exits stand on open water and its
// SE shore strip is severed by the east channel — and the wave
// retires the town's 152-cell tg2 mud sea behind its authored
// street graph and three dock-plank surf piers. (Register:
// WAVE-T36-STARFALL-PLAN.md §5/§7.)
// T37 extension (THIRTY-FIFTH documented exception in the
// guard): sootopolis registers TWO materials on the
// verdanturf/lilycove terms — 'craterfloor' (Crater Ashlar &
// Ventstone), Craterlake City's white crater sett street, and
// 'cavefloor', the shipped threshold material of the Worldroot
// Cave mouth in the north rim, whose throat joins the network
// by registry, both authored in the T37 build (the shipped
// town FAILED the apron gate alone: its Center's ring stood at
// 0.588 against the rim rock band, and its 124-cell network
// was the tg2 mud sea; WAVE-T37-CRATERLAKE-PLAN.md §2/§3).
// T38 extension (THIRTY-SIXTH documented exception in the guard;
// #35 is T37 Craterlake's parallel claim, per the Director's
// allocation): pacifidlog registers 'raftfloor' (Lashed Log &
// Coral Door), Driftlog Town's lashed-log street, on the same
// one-material one-town terms. pacifidlog shipped a connectivity
// FAIL by construction — conn 12/30, both r131 exits standing on
// open water — over a 252-cell boardwalk slab that sits in NO
// audit tier (the registry comment above named it un-rebuilt
// legacy awaiting exactly this wave); the wave retires the slab
// behind the town's own re-authored raft grass, builds the
// landfall nose + north avenue in raftfloor, and marks its
// junctions with verbatim copies of the town's CURRENT ROADS
// sign. (Register: WAVE-T38-DRIFTLOG-PLAN.md §5/§7.)
// T40 extension (THIRTY-EIGHTH documented exception in the
// guard; #37 is T39 Perennial's parallel claim, per the
// Director's allocation): twinleaf registers 'cloverfloor'
// (Clover Earth & Batten Timber), Clover Town's clover-flecked
// packed-earth lane, on the same one-material one-town terms.
// twinleaf shipped a mud-carried PASS — its entire 184-cell
// network was the tg2 sea (the front street, the through road
// and the patches between them); the wave retires the mud,
// rebuilds the street graph in cloverfloor, gives the (7,12)
// DIRS record its missing sign tile, and re-seats the orphaned
// MART CLERK from (3,5) to the Mart's west-front apron (19,4).
// (Register: WAVE-T40-CLOVER-PLAN.md §5/§7.)
// T41 extension (THIRTY-NINTH documented exception in the guard;
// #38 is the parallel T40 Clover claim on its branch, per the
// Director's allocation): sandgem registers 'shellfloor'
// (Shell Shingle & Raked Shingle-Sand), Shingle Town's raked
// shell-sand street, on the same one-material one-town terms.
// sandgem shipped a PASS carried by its own mud sea (173 tg2
// cells = 71% of its 242-cell network) with its Center stamp's
// east half missing — the K-door warp firing from bare mud;
// the wave restores the stamp, retires the mud behind
// shellfloor streets + the town's byte-kept beach, and seats
// its four invisible DIRS records. (Register:
// WAVE-T41-SHINGLE-PLAN.md §5/§7.)
// T42 extension (FORTIETH documented exception in the guard;
// #39 is T41 Shingle's parallel claim, per the Director's
// allocation): jubilife registers 'beamfloor' (Broadcast Steel
// & Signal Slab), Revelry City's steel signal slab, on the same
// one-material one-town terms. jubilife shipped a mud-carried
// PASS — 294 of its 600 cells were tg2 and its entire 303-cell
// network was the mud sea; the wave retires the mud, rebuilds
// the street graph in beamfloor, tiles its SEVEN invisible DIRS
// records, and re-seats the orphaned MART CLERK from (3,5) to
// the Mart's west-front apron (9,4). (Register:
// WAVE-T42-REVELRY-PLAN.md §5/§7.)
// T43 extension (FORTY-FIRST documented exception in the guard;
// #40 is the parallel T42 Revelry claim on its branch, per the
// Director's allocation): oreburgh registers 'clinkerfloor'
// (Soot Iron & Clinker Ash), Coalseam City's packed black-ash
// street, on the same one-material one-town terms. oreburgh
// shipped a PASS carried entirely by its own mud sea (238 tg2
// cells = the town's whole 248-cell network, strict 0.9985 and
// fabric 1 being the mud's own figures); the wave retires the
// mud behind clinkerfloor streets, breaks the Gym+Museum
// tr-roof share with the riveted ironroof, seats a coal cart at
// the mine sign's foot and the RAMOSAUR skull at the Museum's
// shoulder, and re-seats the orphaned MART CLERK (3,5) -> (9,4).
// (Register: WAVE-T43-COALSEAM-PLAN.md §5/§7.)
// T44 extension (FORTY-SECOND documented exception in the guard;
// #41 is the parallel T43 Coalseam claim on its branch, per the
// Director's allocation): floaroma registers 'honeyfloor'
// (Honeycomb & Bloom), Honeyfield Town's hexagonal honeycomb
// lane, on the same one-material one-town terms. floaroma
// shipped a mud-carried PASS — 194 of its 504 cells were tg2 and
// its conn 72/72 + strict 0.9994 were the mud sea's figures; the
// wave retires the mud, rebuilds the street graph in
// honeyfloor, answers the Backstory Audit's shopfront note with
// a shopsign at the Mart's east frontage, and re-seats the
// orphaned MART CLERK from (3,5) to the Mart's west-front apron
// (9,4). (Register: WAVE-T44-HONEYFIELD-PLAN.md §5/§7.)
// T45 extension (FORTY-THIRD documented exception in the guard;
// #42 is the parallel T44 Honeyfield claim on its branch, per
// the Director's allocation): eterna registers 'heritagefloor'
// (Historic Stone & Leaf-Shadow), Heritage City's worn
// flagstone street, on the same one-material one-town terms.
// eterna shipped a mud-carried PASS — 221 of its 540 cells were
// tg2 and its entire 232-cell network was the mud sea (one
// 148-cell junction mega-site); the wave retires the mud,
// rebuilds the street graph in heritagefloor, breaks the
// Gym + Combine building tr-roof share with the cut-stone
// heritageroof, realizes the tale's old statue in its garden,
// tiles its three invisible DIRS records, and re-seats the
// orphaned MART CLERK (3,5) -> (9,4). (Register:
// WAVE-T45-HERITAGE-PLAN.md §5/§7.)
export function tiersFor(id, tiers) {
  const extra = STREET_REGISTRY[id];
  if (!extra || !extra.length) return tiers;
  const isNetwork = (ch) => { const k = tiers.kind(ch); return tiers.isNetwork(ch) || extra.includes(k); };
  return { ...tiers, isNetwork };
}
const TREE = (k) => k.startsWith('tc-') || k === 'tree';

export async function scoreTown(id, MAPS, WALKABLE, tiers) {
  const { kind, isStrict, isNetwork } = tiers;
  const isNet = (ch) => isNetwork(ch);
  const m = MAPS[id], H = m.rows.length, W = m.rows[0].length;
  const cell = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? m.rows[y][x] : '#';
  const warpSet = new Set((m.warps || []).map(w => w.y * W + w.x));
  const walk = (x, y) => WALKABLE.has(cell(x, y)) || warpSet.has(y * W + x);
  const T = new Set();
  for (const w of m.warps || []) { const k = kind(cell(w.x, w.y)); if (w.via || k.startsWith('door')) T.add(w.y * W + w.x); }
  const exits = (m.warps || []).filter(w => w.x === 0 || w.y === 0 || w.x === W - 1 || w.y === H - 1).map(w => [w.x, w.y]);
  const bfsDist = (sources, passFn) => {
    const d = new Map(); const q = [];
    for (const [x, y] of sources) { const k = y * W + x; if (!d.has(k)) { d.set(k, 0); q.push([x, y]); } }
    while (q.length) { const [x, y] = q.shift(); const cd = d.get(y * W + x);
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (!d.has(k) && passFn(nx, ny)) { d.set(k, cd + 1); q.push([nx, ny]); } } }
    return d;
  };
  const astarPath = (src, goals) => {
    const key = (x, y) => y * W + x; const goalSet = new Set(goals.map(([x, y]) => key(x, y)));
    const pass = (x, y) => walk(x, y) && (goalSet.has(key(x, y)) || !T.has(key(x, y)));
    const came = new Map(), gs = new Map([[key(src[0], src[1]), 0]]); const pq = [[0, key(src[0], src[1])]];
    const h = (x, y) => Math.min(...goals.map(([gx, gy]) => Math.abs(x - gx) + Math.abs(y - gy)));
    while (pq.length) { let bi = 0; for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[bi][0]) bi = i; const [, cur] = pq.splice(bi, 1)[0];
      if (goalSet.has(cur) && cur !== key(src[0], src[1])) { const p = [cur]; let c = cur; while (came.has(c)) { c = came.get(c); p.push(c); } return p.reverse().map(k => [k % W, (k / W) | 0]); }
      const cx = cur % W, cy = (cur / W) | 0, cg = gs.get(cur);
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy; if (!pass(nx, ny)) continue; const nk = key(nx, ny), ng = cg + 1;
        if (ng < (gs.get(nk) ?? 1e9)) { gs.set(nk, ng); came.set(nk, cur); const f = ng + h(nx, ny); const ex = pq.findIndex(p => p[1] === nk); if (ex >= 0) pq[ex][0] = f; else pq.push([f, nk]); } } }
    return null;
  };

  const r = { id, name: m.name || id, doors: 0, weakLinks: 0, interrupts: 0, lamps: 0, unlitFrac: null,
    merged: 0, tight: 0, buildings: 0, apronLow: 0, apronMin: 1, decor: 0, unanchoredPath: 0, unanchoredAny: 0,
    netComponents: 0, netCompSizes: [], stepOn: 0, stepTouch: 0, stepTot: 0, junctions: 0, junctionsBare: 0,
    trees: 0, treesIsolated: 0, noWalkway: 0 };
  const examples = [];

  // PATH-FABRIC components (all network cells; sizes reported)
  const comp = new Map(); let nc = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!isNet(cell(x, y)) || comp.has(y * W + x)) continue;
    let sz = 0; const q = [[x, y]]; comp.set(y * W + x, nc);
    while (q.length) { const [cx, cy] = q.pop(); sz++; for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
      if (!comp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && isNet(cell(nx, ny))) { comp.set(k, nc); q.push([nx, ny]); } } }
    r.netCompSizes.push(sz); nc++;
  }
  r.netComponents = nc;

  // doors: step-offs, R1 weak links, R7 walkway connection
  // Step-off definition: warps with `via` use it; door-kind warps
  // without `via` (e.g. pallet's houses) step off one tile south.
  const doorWarps = [];
  for (const w of m.warps || []) {
    const k = kind(cell(w.x, w.y));
    if (w.via) doorWarps.push({ w, sx: w.via.x, sy: w.via.y });
    else if (k.startsWith('door')) doorWarps.push({ w, sx: w.x, sy: w.y + 1 });
  }
  for (const { w, sx, sy } of doorWarps) {
    r.doors++; r.stepTot++;
    if (isNet(cell(sx, sy))) { r.stepOn++; r.stepTouch++; }
    else { let touch = false; for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) if (isNet(cell(sx + dx, sy + dy))) touch = true; if (touch) r.stepTouch++; }
    if (exits.length) {
      const p = astarPath([sx, sy], exits);
      if (p) { let dS = 0; for (const [x, y] of p) if (isStrict(cell(x, y))) dS++; if (dS / p.length < 0.5) { r.weakLinks++; if (examples.length < 6) examples.push(`door->${w.to.map} step-off@${sx},${sy} route-to-exit strict ${(dS / p.length).toFixed(2)}`); } }
      const net = bfsDist([[sx, sy]], (x, y) => isStrict(cell(x, y)));
      const reached = exits.some(([ex2, ey2]) => net.has(ey2 * W + ex2) || DIRS.some(([dx, dy]) => net.has((ey2 + dy) * W + (ex2 + dx))));
      if (!reached) r.noWalkway++;
    }
  }

  // decor: R2 interrupts, R6 anchoring (path-only and any-anchor)
  const isDecor = (ch) => { const k = kind(ch); return k.startsWith('td-') || DECOR_KINDS.includes(k); };
  const netCells = [], buildCells = [], decorCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell(x, y);
    if (isNet(ch)) netCells.push([x, y]); if (BUILD(kind(ch))) buildCells.push([x, y]); if (isDecor(ch)) decorCells.push([x, y]); }
  const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by));
  for (const [x, y] of decorCells) {
    r.decor++;
    const nN = isNet(cell(x, y - 1)), nS = isNet(cell(x, y + 1)), nE = isNet(cell(x + 1, y)), nW = isNet(cell(x - 1, y));
    if ((nN && nS) || (nE && nW)) r.interrupts++;
    let dmin = 1e9; for (const [px, py] of netCells) { const d = cheb(x, y, px, py); if (d < dmin) dmin = d; }
    if (dmin > 3) r.unanchoredPath++;
    const near = (pts, rr) => pts.some(([px, py]) => cheb(x, y, px, py) <= rr);
    const anchored = near(buildCells, 2) || near(netCells, 2) || decorCells.some(([px, py]) => !(px === x && py === y) && cheb(x, y, px, py) <= 2);
    if (!anchored) { r.unanchoredAny++; if (examples.length < 10) examples.push(`${kind(cell(x, y))}@${x},${y} unanchored (no building/fabric/decor unit within 2)`); }
  }

  // FREESTANDING-CLEARANCE (owner rule, 2026-11-12): a freestanding
  // object is ON-FABRIC when the route straddles it — fabric on both
  // opposite sides (N+S or E+W); a 3-fabric-neighbour pocket is a
  // watch item, not a straddle. Shoulder-adjacency is checked after
  // the junction pass (below), against fabric/buildings/junctions.
  const freeCells = [];
  r.onFabric = 0; r.onFabricList = []; r.fabricPockets = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = kind(cell(x, y)); if (!FREESTANDING(k)) continue;
    const fN = isNet(cell(x, y - 1)), fS = isNet(cell(x, y + 1)), fE = isNet(cell(x + 1, y)), fW = isNet(cell(x - 1, y));
    const straddle = (fN && fS) || (fE && fW);
    const nFab = [fN, fS, fE, fW].filter(Boolean).length;
    freeCells.push({ x, y, k, fN, fS, fE, fW, nFab });
    if (straddle) { r.onFabric++; if (r.onFabricList.length < 8) r.onFabricList.push(`${k}@${x},${y}`); }
    else if (nFab === 3) r.fabricPockets++;
  }
  r.freestanding = freeCells.length;

  // CONNECTIVITY (owner priority, 2026-11-12: "Connectivity and clear
  // path"): all-pairs reachability on the FABRIC GRAPH ALONE — every
  // door step-off must reach every exit and every other door step-off
  // without ever leaving fabric cells. Stronger than the component
  // count: it is stated door-by-door, exit-by-exit.
  r.connPairs = 0; r.connOk = 0; r.connFails = [];
  {
    const nodes = []; const seenNode = new Set();
    for (const { sx, sy } of doorWarps) { const k = sy * W + sx; if (!seenNode.has(k)) { seenNode.add(k); nodes.push({ t: 'door', x: sx, y: sy }); } }
    for (const [ex, ey] of exits) { const k = ey * W + ex; if (!seenNode.has(k)) { seenNode.add(k); nodes.push({ t: 'exit', x: ex, y: ey }); } }
    const fabAt = (x, y) => x >= 0 && y >= 0 && x < W && y < H && isNet(cell(x, y));
    for (const a of nodes) {
      const reach = new Set();
      if (fabAt(a.x, a.y)) { const q = [[a.x, a.y]]; reach.add(a.y * W + a.x);
        while (q.length) { const [cx, cy] = q.pop(); for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx; if (!reach.has(k) && fabAt(nx, ny)) { reach.add(k); q.push([nx, ny]); } } } }
      for (const b of nodes) { if (b === a) continue; r.connPairs++; if (reach.has(b.y * W + b.x)) r.connOk++; else if (r.connFails.length < 4) r.connFails.push(`${a.t}@${a.x},${a.y} -/-> ${b.t}@${b.x},${b.y}`); }
    }
  }

  // R3 junctions + JUNCTION-MARK coverage. A junction is a SITE: a
  // connected cluster (8-conn) of fabric cells with >=3 fabric
  // neighbours. (Phase 1 counted cells; on 2-wide CLEAN fabrics every
  // lane cell has degree >=3, which measures lane width, not decision
  // points — the owner's own exemplar streets would fail. Sites keep
  // the gate's meaning: every decision point/plaza carries a mark.)
  const signPts = (m.signs || []).map(s => [s.x, s.y]);
  const jCells = netCells.filter(([x, y]) => DIRS.filter(([dx, dy]) => isNet(cell(x + dx, y + dy))).length >= 3);
  r.junctionCells = jCells.length;
  const jSeen = new Set(); const jKey = (x, y) => y * W + x;
  for (const [x, y] of jCells) {
    if (jSeen.has(jKey(x, y))) continue;
    const site = []; const q = [[x, y]]; jSeen.add(jKey(x, y));
    while (q.length) { const [cx, cy] = q.pop(); site.push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = cx + dx, ny = cy + dy;
        if (!jSeen.has(jKey(nx, ny)) && jCells.some(([jx, jy]) => jx === nx && jy === ny)) { jSeen.add(jKey(nx, ny)); q.push([nx, ny]); } } }
    r.junctions++;
    r.junctionSites = r.junctionSites || [];
    r.junctionSites.push(site);
    if (!signPts.some(([sx, sy]) => site.some(([jx, jy]) => cheb(jx, jy, sx, sy) <= 2))) r.junctionsBare++;
  }

  // FREESTANDING shoulder-adjacency: route furniture must stand at
  // the shoulder of what it serves — within 1 tile of a fabric edge,
  // or within the 2-tile unit radius of its building / junction /
  // NPC post. Straddled objects are counted in onFabric, not here.
  // Landscaping (td-*, flower, flowerbed) floaters are reported
  // separately (r.landscapingFloat); ANCHOR-UNIT gates them.
  r.shoulderOrphans = 0; r.shoulderList = []; r.landscapingFloat = 0;
  {
    const jCellsAll = (r.junctionSites || []).flat();
    const npcPts = (m.npcs || []).map(n => [n.x, n.y]);
    const unitPts = []; // composed-unit anchors: stalls, postboxes, building signs
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = kind(cell(x, y)); if (k === 'stall' || k === 'postbox' || k.startsWith('sign-')) unitPts.push([x, y]); }
    const serves = (f) => f.nFab >= 1 ||
      buildCells.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2) ||
      jCellsAll.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2) ||
      npcPts.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2) ||
      unitPts.some(([px, py]) => cheb(f.x, f.y, px, py) <= 2);
    for (const f of freeCells) {
      if ((f.fN && f.fS) || (f.fE && f.fW)) continue;
      if (ROUTE_FURNITURE(f.k)) { if (!serves(f)) { r.shoulderOrphans++; if (r.shoulderList.length < 8) r.shoulderList.push(`${f.k}@${f.x},${f.y}`); } }
      else if (!serves(f)) r.landscapingFloat++;
    }
  }

  // R4 lamps
  const lampPts = decorCells.filter(([x, y]) => kind(cell(x, y)) === 'lamp');
  r.lamps = lampPts.length;
  if (lampPts.length) {
    const d = bfsDist(lampPts, (x, y) => walk(x, y));
    let unlit = 0;
    for (const [x, y] of netCells) { const dd = d.get(y * W + x); if (dd === undefined || dd > 6) unlit++; }
    r.unlitFrac = netCells.length ? +(unlit / netCells.length).toFixed(3) : null;
  }

  // R5 buildings + APRON
  const bcomp = new Map(); let bnc = 0; const footprints = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!BUILD(kind(cell(x, y))) || bcomp.has(y * W + x)) continue;
    const cells = []; const q = [[x, y]]; bcomp.set(y * W + x, bnc);
    while (q.length) { const [cx, cy] = q.pop(); cells.push([cx, cy]);
      for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
        if (!bcomp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && BUILD(kind(cell(nx, ny)))) { bcomp.set(k, bnc); q.push([nx, ny]); } } }
    if (cells.length >= 3) footprints.push(cells); bnc++;
  }
  r.buildings = footprints.length;
  for (const fp of footprints) {
    const ring = new Set();
    for (const [x, y] of fp) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      // The town frame (cavewall — the cliff/rock face the settlement
      // is built against) is the boundary of the playable town, not a
      // crowding neighbour: it leaves the ring exactly like an
      // out-of-bounds cell (W4). Flintridge's museum/gym complex
      // stands at the cliff foot by design; counting the cliff face
      // against its clearance measured the frame, not the building.
      if (kind(cell(nx, ny)) === 'cavewall') continue;
      if (!bcomp.has(ny * W + nx)) ring.add(ny * W + nx); }
    let clear = 0; for (const k of ring) if (WALKABLE.has(cell(k % W, (k / W) | 0))) clear++;
    const frac = ring.size ? clear / ring.size : 1;
    if (frac < r.apronMin) r.apronMin = +frac.toFixed(3);
    if (frac < 0.6) r.apronLow++;
  }
  for (let i = 0; i < footprints.length; i++) for (let j = i + 1; j < footprints.length; j++) {
    let gmin = 1e9;
    for (const [ax, ay] of footprints[i]) for (const [bx, by] of footprints[j]) { const d = cheb(ax, ay, bx, by) - 1; if (d < gmin) gmin = d; }
    if (gmin === 0) r.merged++; else if (gmin === 1) r.tight++;
  }

  // EDGE-MASS
  const tcomp = new Map(); let tnc = 0; const tSizes = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!TREE(kind(cell(x, y))) || tcomp.has(y * W + x)) continue;
    let sz = 0; const q = [[x, y]]; tcomp.set(y * W + x, tnc);
    while (q.length) { const [cx, cy] = q.pop(); sz++; for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, k = ny * W + nx;
      if (!tcomp.has(k) && nx >= 0 && ny >= 0 && nx < W && ny < H && TREE(kind(cell(nx, ny)))) { tcomp.set(k, tnc); q.push([nx, ny]); } } }
    tSizes.set(tnc, sz); tnc++;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!TREE(kind(cell(x, y)))) continue; r.trees++;
    const inBand = x < 3 || y < 3 || x >= W - 3 || y >= H - 3;
    if (!inBand && (tSizes.get(tcomp.get(y * W + x)) || 0) < 4) r.treesIsolated++;
  }
  r.examples = examples;
  return r;
}

export function gateCheck(r, clarity) {
  const gates = [];
  const push = (name, ok, detail) => gates.push({ name, ok, detail });
  if (clarity) {
    push('strict>=0.60', clarity.meanStrict >= 0.60, `strict=${clarity.meanStrict}`);
    push('fabric>=0.98', clarity.meanFabric >= 0.98, `fabric=${clarity.meanFabric}`);
  }
  push('step-offs 100% on/touching', r.stepTot > 0 && r.stepTouch === r.stepTot, `${r.stepTouch}/${r.stepTot}`);
  push('CONNECTIVITY all-pairs on fabric', r.connPairs > 0 && r.connOk === r.connPairs, `${r.connOk}/${r.connPairs} pairs${r.connFails && r.connFails.length ? ' e.g. ' + r.connFails[0] : ''}`);
  push('exactly 1 fabric component', r.netComponents === 1, `components=${r.netComponents} sizes=${r.netCompSizes.join('+')}`);
  const jCov = r.junctions ? 1 - r.junctionsBare / r.junctions : 1;
  push('junction-mark>=90%', jCov >= 0.90, `covered ${r.junctions - r.junctionsBare}/${r.junctions}`);
  const uFrac = r.decor ? r.unanchoredAny / r.decor : 0;
  push('unanchored<=5%', uFrac <= 0.05, `${r.unanchoredAny}/${r.decor} decor unanchored`);
  push('APRON no <60% / no gap-0', r.apronLow === 0 && r.merged === 0, `apronLow=${r.apronLow} min=${r.apronMin} merged=${r.merged} tight=${r.tight}`);
  push('FREESTANDING-CLEARANCE on-fabric=0', (r.onFabric || 0) === 0, `onFabric=${r.onFabric || 0}${r.onFabricList && r.onFabricList.length ? ' e.g. ' + r.onFabricList[0] : ''} pockets=${r.fabricPockets || 0}`);
  push('shoulder-adjacency', (r.shoulderOrphans || 0) === 0, `orphans=${r.shoulderOrphans || 0}${r.shoulderList && r.shoulderList.length ? ' e.g. ' + r.shoulderList[0] : ''} of ${r.freestanding || 0} freestanding`);
  return { id: r.id, pass: gates.every(g => g.ok), gates };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const overlay = opt('--overlay') ? JSON.parse(readFileSync(opt('--overlay'), 'utf8')) : {};
  const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(overlay);
  const tiers = makeTiers(TILE_CHARS);
  const towns = townSetOf(MAPS);
  const ids = opt('--map') ? opt('--map').split(',') : [...towns, 'pallet'].filter(id => MAPS[id]);
  const out = [];
  for (const id of ids) {
    if (!MAPS[id]) continue;
    const r = await scoreTown(id, MAPS, WALKABLE, tiersFor(id, tiers));
    let gate = null;
    if (args.includes('--gates')) {
      const clarity = analyzeMap(id, MAPS[id], { WALKABLE, tiers, townSet: towns });
      gate = gateCheck(r, clarity);
      r.strict = clarity.meanStrict; r.fabric = clarity.meanFabric;
    }
    out.push({ ...r, gate });
    console.log(`${id}: doors=${r.doors} weak=${r.weakLinks} noWalk=${r.noWalkway} int=${r.interrupts} lamps=${r.lamps} unlit=${r.unlitFrac} comps=${r.netComponents}(${r.netCompSizes.join('+')}) step=${r.stepTouch}/${r.stepTot} conn=${r.connOk}/${r.connPairs} junc=${r.junctions - r.junctionsBare}/${r.junctions} unanchAny=${r.unanchoredAny}/${r.decor} onFab=${r.onFabric || 0} shoulderOrph=${r.shoulderOrphans || 0} apronLow=${r.apronLow} merged=${r.merged} tight=${r.tight} isoTrees=${r.treesIsolated}${gate ? ` | strict=${r.strict} fabric=${r.fabric} | GATES ${gate.pass ? 'PASS' : 'FAIL: ' + gate.gates.filter(g => !g.ok).map(g => g.name + ' (' + g.detail + ')').join('; ')}` : ''}`);
    if (r.examples && r.examples.length) for (const e of r.examples.slice(0, 3)) console.log(`    ${e}`);
  }
  if (opt('--json')) writeFileSync(opt('--json'), JSON.stringify(out, null, 1));
}
