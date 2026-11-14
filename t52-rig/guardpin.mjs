// Wave T51 rig: re-pin the placement-gates guard for the
// Astral build — the FORTY-NINTH documented exception (the
// FORTY-EIGHTH is the parallel WAVE T50 Fenland claim on its
// branch, per the Director's allocation; the two land in
// order at merge). Registry assertion strings (both forms)
// and celestic's pin only; the exception block is appended
// ahead of the FORTY-SEVENTH (T49) block in the guard's tail
// comment, per the fleet pattern.
import fs from 'node:fs';

const FILE = '/home/hatch/workspace/ashs-journey-t51/tests/placement-gates-checks.mjs';
let src = fs.readFileSync(FILE, 'utf8');
const once = (from, to, label) => {
  const i = src.indexOf(from);
  if (i < 0) throw new Error('not found: ' + label);
  if (src.indexOf(from, i + 1) >= 0) throw new Error('not unique: ' + label);
  src = src.slice(0, i) + to + src.slice(i + from.length);
};

// 1. the registry assertions gain celestic (label + escaped JSON)
once("canalave: [ringfloor, boardwalk, harbourstone, trussfloor] }'",
  "canalave: [ringfloor, boardwalk, harbourstone, trussfloor], celestic: [moonfloor] }'",
  'registry label');
once('\\"canalave\\":[\\"ringfloor\\",\\"boardwalk\\",\\"harbourstone\\",\\"trussfloor\\"]}',
  '\\"canalave\\":[\\"ringfloor\\",\\"boardwalk\\",\\"harbourstone\\",\\"trussfloor\\"],\\"celestic\\":[\\"moonfloor\\"]}',
  'registry json');

// 2. celestic's pin migrates PASS -> PASS to the landed tuple
once('"celestic": [1, 56, 56, 6, 6, 1, 3, 0, 0, 0.882, 0, 0, 0, 0, 1, 1],',
  '"celestic": [1, 56, 56, 6, 6, 1, 5, 0, 0, 0.857, 0, 0, 0, 0, 0.719, 1],',
  'celestic pin');

// 3. the FORTY-NINTH exception block, ahead of the T49 header
const BLOCK = `//     celestic's pin, and NO other town's pin moves.
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
`;
const ANCHOR = '//     FORTY-SEVENTH DOCUMENTED EXCEPTION (WAVE T49; the';
const ai = src.indexOf(ANCHOR);
if (ai < 0) throw new Error('exception anchor not found');
src = src.slice(0, ai) + BLOCK + src.slice(ai);

fs.writeFileSync(FILE, src);
console.log('guard re-pinned: registry +celestic, celestic pin -> landed tuple, FORTY-NINTH exception block appended');
