// gym-identity-checks.mjs — the GYM IDENTITY guard (War Room E2E Phase 2,
// NO-SAME-KIT fix-sequence #6). Run: node tests/gym-identity-checks.mjs
// (exit 1 on any failure).
//
// Why this exists: the NO-SAME-KIT audit (§3) graded Battle PARTIAL —
// the 36 badge gyms resolved their battle arenas through MAP_GROUND to
// just 14 of the 15 procedural ARENA_ART treatments, so per-gym arena
// identity measured 0/36 (rubble alone served 7 gyms), and inside, all
// 36 gyms stood on the same dominant floor kind, `gymfloor`. W-BG
// completed the Ground assignments, W-CHAR1 gave the leaders distinct
// designs, W16-B dressed 4 gym pairs — none of that gave a gym its own
// arena or its own floor. This wave does, region by region, and this
// guard makes identity a structural, CI-held fact:
//
//   T0 (this commit) — the mechanism + this guard, ZERO art:
//     GYM_ARENA_ART (src/game/battle.mjs) ships empty; gymArenaFor()
//     is consulted ahead of ARENA_ART[field.id] at the drawArena and
//     ptDisc read sites, and a gym entry's own `amb` is consulted
//     ahead of ARENA_AMBIENT[gid] in drawArenaAmbient. With the table
//     empty every expression reduces to the pre-wave read, so T0 is
//     behaviour-identical BY CONSTRUCTION — and the base-treatment
//     hashes below pin that the pre-wave render cannot drift either.
//   T1–T5 — one region per tranche (Arden 8, Yamato 8, Maris 8,
//     Borea 8, Amber 4): each gym gets its own arena entry (art layered
//     over its existing Ground — rules/name/banner frozen, §F) and its
//     own dominant floor kind + signature dressing inside the W16
//     invariant frame (§D pins the data that may never move).
//
// Director rulings held by this guard: arena keyed by gym MAP ID (not
// leader); the two Open gyms (gym-goldenrod, gym-petalburg) take
// art-only identity over Open rules; stadiums are NOT gyms (fix #10);
// layout skeletons stay — identity is dressing-level this wave.
//
// Ratchets (design-depth precedent): a pin may only move in the tranche
// commit that changes the measured fact. Measured ABOVE the pin = a
// regression or an unrecorded claim; measured BELOW = the pin is stale
// and the tranche that did the work must lower/raise it in-commit.
//   GYM_ARENA_COVERED        gyms with a GYM_ARENA_ART entry   0 -> 36
//   GYM_FLOOR_OWNED          gyms whose dominant floor kind is
//                            not `gymfloor`                    0 -> 36
//   GYMFLOOR_DOMINANT        gyms still standing on gymfloor  36 -> 0
//   INTERIOR_TUPLES_DISTINCT distinct (floor, skeleton,
//                            dressing) tuples over all 36      35 -> 36
//     (35 at T0: gym-mauville and gym-sunnyshore — both Volt gyms in
//     the shared 16x12 skeleton block — hold the one identical tuple;
//     the count reaches 36 the tranche Mauville takes its own floor,
//     T3 on the plan's schedule.)
//
// Distinctness is exact-tuple only (the W13/W14 method): signatures
// and tuples are compared as data, never judged as vocabulary. Whether
// two identities are far enough APART to read as different gyms is
// graded at merge by the Director's eye, the same split as every wave.

import { buildGameJs } from '../scripts/build.mjs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import { MAP_GROUND, GROUNDS } from '../src/data/grounds.mjs';
import { BADGE_SETS } from '../src/data/items.mjs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sha16 = (s) => sha(s).slice(0, 16);
const sha12 = (s) => sha(s).slice(0, 12);

// ---------------- ratchet pins (T0) ------------------------------------
const GYM_ARENA_COVERED = 0;
const GYM_FLOOR_OWNED = 0;
const GYMFLOOR_DOMINANT = 36;
const INTERIOR_TUPLES_DISTINCT = 35;

// ---------------- the gym census (plan §1 enumeration) -----------------
// Exactly the badge gyms: map ids matching /(^|-)gym(-|$)/ over the
// merged MAPS table, cross-proven against BADGE_SETS (8+4+8+8+8 = 36).
// The Saffron dojo is not a badge gym; the two Amber stadiums belong
// to fix #10. The pinned list IS the census — a new gym-shaped map
// fails here by name until the wave charters it.
const GYM_IDS = [
  'gym', 'gym-azalea', 'gym-blackthorn', 'gym-canalave', 'gym-celadon',
  'gym-cerulean', 'gym-cianwood', 'gym-cinnabar', 'gym-dewford',
  'gym-ecruteak', 'gym-eterna', 'gym-fortree', 'gym-fuchsia',
  'gym-goldenrod', 'gym-hearthome', 'gym-lavaridge', 'gym-mahogany',
  'gym-mauville', 'gym-mossdeep', 'gym-olivine', 'gym-oreburgh',
  'gym-pastoria', 'gym-petalburg', 'gym-rustboro', 'gym-saffron',
  'gym-snowpoint', 'gym-sootopolis', 'gym-sunnyshore', 'gym-veilstone',
  'gym-vermilion', 'gym-violet', 'gym-viridian', 'kumquat-gym',
  'mikan-gym', 'navel-gym', 'trovita-gym',
];

// ---------------- loader (W16 method: the game's own bundle fold) -----
const js = buildGameJs({ auth: true });
const ctx = vm.createContext({ console, Math, JSON, Object, Array, Set, Map });
vm.runInContext(js + '\n;this.__X = { MAPS, WALKABLE: [...WALKABLE], ARENA_ART, ARENA_AMBIENT,'
  + ' GYM_ARENA_ART: (typeof GYM_ARENA_ART !== "undefined" ? GYM_ARENA_ART : undefined) };', ctx);
const { MAPS, ARENA_ART, ARENA_AMBIENT, GYM_ARENA_ART } = ctx.__X;
const WALK = new Set(ctx.__X.WALKABLE);
const battleSrc = readFileSync(join(ROOT, 'src/game/battle.mjs'), 'utf8');

// ---------------- I: census ---------------------------------------------
const census = Object.keys(MAPS).filter((id) => /(^|-)gym(-|$)/.test(id)).sort();
ok('I1 gym census is exactly the pinned 36 badge gyms',
  JSON.stringify(census) === JSON.stringify(GYM_IDS),
  'measured ' + census.length + ': ' + census.filter((id) => !GYM_IDS.includes(id)).join(','));
const badgeTotal = ['kanto', 'orange', 'johto', 'hoenn', 'sinnoh']
  .reduce((n, k) => n + BADGE_SETS[k].length, 0);
ok('I2 BADGE_SETS cross-proof: 36 badge items (symbols excluded)', badgeTotal === 36, String(badgeTotal));
ok('I3 named exclusions stay out: dojo, pummelo-stadium, silver-stadium',
  !census.includes('dojo') && !census.includes('pummelo-stadium') && !census.includes('silver-stadium'));

// ---------------- M: mechanism wiring -----------------------------------
// The mechanism is behaviour only if the read sites consult it; pin the
// wiring in source so a refactor cannot silently unwire the table while
// the data checks below keep passing on an unread table.
const count = (hay, needle) => hay.split(needle).length - 1;
ok('M1 GYM_ARENA_ART table is declared in battle.mjs and reachable in the bundle',
  battleSrc.includes('const GYM_ARENA_ART = {') && !!GYM_ARENA_ART && typeof GYM_ARENA_ART === 'object');
ok('M2 gymArenaFor(this.field) is consulted at exactly the drawArena + ptDisc read sites',
  count(battleSrc, 'gymArenaFor(this.field)') === 2,
  String(count(battleSrc, 'gymArenaFor(this.field)')));
ok('M3 drawArenaAmbient consults the gym entry\'s own amb ahead of ARENA_AMBIENT[gid]',
  count(battleSrc, '(ga && ga.amb) || ARENA_AMBIENT[gid]') === 1);
ok('M4 the resolver reads the table by field.mapId (map-id keying, Director ruling)',
  battleSrc.includes('return GYM_ARENA_ART[field.mapId] || null;'));

// ---------------- per-gym interior facts --------------------------------
const kindOf = (ch) => TILE_CHARS[ch] || ('?' + ch);
function interiorOf(m) {
  const floorCount = {}, dress = {};
  let skel = '';
  for (const row of m.rows) {
    let sk = '';
    for (const ch of row) {
      const k = kindOf(ch);
      if (WALK.has(ch)) { sk += '.'; floorCount[k] = (floorCount[k] || 0) + 1; }
      else { sk += '#'; dress[k] = (dress[k] || 0) + 1; }
    }
    skel += sk + '\n';
  }
  const dom = Object.entries(floorCount).sort((a, b) => b[1] - a[1])[0][0];
  const dressStr = Object.entries(dress).sort().map(([k, v]) => k + ':' + v).join(',');
  return { dom, tuple: dom + '|' + sha12(skel) + '|' + dressStr };
}
const interiors = {};
for (const id of GYM_IDS) interiors[id] = interiorOf(MAPS[id]);

// ---------------- R: coverage ratchets ----------------------------------
const covered = GYM_IDS.filter((id) => GYM_ARENA_ART && GYM_ARENA_ART[id]);
ok(`R1 ratchet: GYM_ARENA_COVERED = pin ${GYM_ARENA_COVERED} (T1 +8 Arden, T2 +8 Yamato, T3 +8 Maris, T4 +8 Borea, T5 +4 Amber -> 36)`,
  covered.length === GYM_ARENA_COVERED,
  covered.length > GYM_ARENA_COVERED
    ? `measured ${covered.length} — coverage grew outside a pin move (unrecorded claim)`
    : `measured ${covered.length} — pin is stale; move it in the tranche commit that covered them`);
const stray = GYM_ARENA_ART ? Object.keys(GYM_ARENA_ART).filter((id) => !GYM_IDS.includes(id)) : [];
ok('R2 every GYM_ARENA_ART key is a census gym (no stray or stadium entries)', stray.length === 0, stray.join(','));
const owned = GYM_IDS.filter((id) => interiors[id].dom !== 'gymfloor');
ok(`R3 ratchet: GYM_FLOOR_OWNED = pin ${GYM_FLOOR_OWNED} (gyms whose dominant floor kind is their own)`,
  owned.length === GYM_FLOOR_OWNED,
  `measured ${owned.length}: ${owned.join(',')}`);
const stillShared = GYM_IDS.filter((id) => interiors[id].dom === 'gymfloor');
ok(`R4 ratchet: GYMFLOOR_DOMINANT = pin ${GYMFLOOR_DOMINANT} (burn-down complement of R3)`,
  stillShared.length === GYMFLOOR_DOMINANT,
  `measured ${stillShared.length}`);

// ---------------- F: rules freeze ---------------------------------------
// Identity can never smuggle a rules change: each gym's MAP_GROUND
// value is pinned, and the GROUNDS objects + the 15 base treatments
// are hashed whole. A non-gym battle must render and resolve exactly
// as it did before the wave — these hashes are that fact.
const GROUND_PINS = {
  'gym': 'rubble', 'gym-azalea': 'bloom', 'gym-blackthorn': 'ember',
  'gym-canalave': 'rubble', 'gym-celadon': 'marsh', 'gym-cerulean': 'tide',
  'gym-cianwood': 'rubble', 'gym-cinnabar': 'pyre', 'gym-dewford': 'rubble',
  'gym-ecruteak': 'grave', 'gym-eterna': 'bloom', 'gym-fortree': 'storm',
  'gym-fuchsia': 'venom', 'gym-goldenrod': 'open', 'gym-hearthome': 'grave',
  'gym-lavaridge': 'pyre', 'gym-mahogany': 'frost', 'gym-mauville': 'volt',
  'gym-mossdeep': 'mind', 'gym-olivine': 'tide', 'gym-oreburgh': 'rubble',
  'gym-pastoria': 'tide', 'gym-petalburg': 'open', 'gym-rustboro': 'rubble',
  'gym-saffron': 'mind', 'gym-snowpoint': 'frost', 'gym-sootopolis': 'tide',
  'gym-sunnyshore': 'volt', 'gym-veilstone': 'mind', 'gym-vermilion': 'volt',
  'gym-violet': 'storm', 'gym-viridian': 'spirit', 'kumquat-gym': 'mind',
  'mikan-gym': 'tide', 'navel-gym': 'frost', 'trovita-gym': 'rubble',
};
for (const id of GYM_IDS) {
  ok(`F ${id} MAP_GROUND stays '${GROUND_PINS[id]}' (rules freeze)`,
    MAP_GROUND[id] === GROUND_PINS[id], String(MAP_GROUND[id]));
}
ok('F GROUNDS objects (rules/name/banner/tint, all 15) hash unchanged',
  sha(JSON.stringify(GROUNDS)) === '05d790fde14b152dc425f9f5e982435f6763ad3123eb0a52aaaf81faccde992e',
  sha(JSON.stringify(GROUNDS)));
ok('F the 15 base ARENA_ART treatments hash unchanged (non-gym battles render identically)',
  sha(JSON.stringify(ARENA_ART)) === '6e0817860d8e3e9fd3b12fac1dbdc28d064ab7657d39035015dc7a110febd9e7',
  sha(JSON.stringify(ARENA_ART)));
ok('F the 15 base ARENA_AMBIENT treatments hash unchanged',
  sha(JSON.stringify(ARENA_AMBIENT)) === 'ae852aeafe339c66736424d809573caa9e0d857eedc9c6b079e12b4a46458bb2',
  sha(JSON.stringify(ARENA_AMBIENT)));

// ---------------- D: per-gym data invariants (W16 method) ---------------
// Everything a dressing tranche may NOT move: warps, start, npcs,
// signs, items, hidden, events, encounters — sha-pinned per gym at
// T0 on main f35a51c7. A dressing change that needs one of these
// re-pins here in its own commit, disclosed per gym.
const DATA_PINS = {
  'gym': 'a3ffbe5217078854', 'gym-azalea': '9926ccbdfd69ad85',
  'gym-blackthorn': '3d3863f0916eb3ff', 'gym-canalave': 'ac8714fd27d51663',
  'gym-celadon': '06812833d205cd72', 'gym-cerulean': '2e9ecd0148931275',
  'gym-cianwood': 'f41186b1fbe99039', 'gym-cinnabar': 'ed18a27b80bb0ca1',
  'gym-dewford': '2f59e62cfa054987', 'gym-ecruteak': 'a80e1ea87fdd3e79',
  'gym-eterna': '524cdf7ce5989a65', 'gym-fortree': '4388cba2e39ec5a1',
  'gym-fuchsia': 'b72b008b7adeeac8', 'gym-goldenrod': '01cf37aa2d9cfd86',
  'gym-hearthome': '235257917429676e', 'gym-lavaridge': '709e704e412ec503',
  'gym-mahogany': '5d326656d20aab43', 'gym-mauville': 'dc0c527c2343becc',
  'gym-mossdeep': '5e074d76ac6bb172', 'gym-olivine': '45eb2efd0ba9fd3b',
  'gym-oreburgh': '43eaade16334c69a', 'gym-pastoria': '2e152943721f235e',
  'gym-petalburg': '4e4439e7dd99f879', 'gym-rustboro': 'afbfb4034814cfbe',
  'gym-saffron': '482cfe81a0c76152', 'gym-snowpoint': '8f431598419d15b4',
  'gym-sootopolis': '9003f4a99962caa2', 'gym-sunnyshore': 'd73097a3b385bfdf',
  'gym-veilstone': '51bce8a057103f7e', 'gym-vermilion': '31bd6c63bd6fa004',
  'gym-violet': '5e894dbd5c4ee4d3', 'gym-viridian': '3bc44acfb2ca1a66',
  'kumquat-gym': 'ef705fa981d4ff23', 'mikan-gym': '47d211de1a606ab2',
  'navel-gym': '24906ec4dbcbe789', 'trovita-gym': '8600c7b837f3656e',
};
for (const id of GYM_IDS) {
  const m = MAPS[id];
  const canon = JSON.stringify([m.warps || null, m.start || null, m.npcs || null,
    m.signs || null, m.items || null, m.hidden || null, m.events || null, m.encounters || null]);
  ok(`D ${id} invariant data (warps/start/npcs/signs/items/hidden/events/encounters) matches T0 pin`,
    sha16(canon) === DATA_PINS[id], sha16(canon));
}

// ---------------- S: distinctness (exact tuples, bites as tranches land)
const sigOf = (t, amb) => JSON.stringify([t.sky, t.ground, t.dark, t.light, t.accent,
  t.motif, t.tex, !!t.haze, !!t.pylon, amb ? [amb.kind, amb.n, amb.speed] : null]);
const ENTRY_KEYS = new Set(['sky', 'ground', 'dark', 'light', 'accent', 'motif', 'tex', 'haze', 'pylon', 'amb']);
const badShape = [];
for (const id of covered) {
  const e = GYM_ARENA_ART[id];
  const keysOk = Object.keys(e).every((k) => ENTRY_KEYS.has(k));
  const bandsOk = Array.isArray(e.sky) && e.sky.length === 6 && e.sky.every((v) => typeof v === 'string')
    && Array.isArray(e.ground) && e.ground.length === 6 && e.ground.every((v) => typeof v === 'string');
  const scalarsOk = ['dark', 'light', 'accent', 'motif', 'tex'].every((k) => typeof e[k] === 'string' && e[k].length > 0);
  const ambOk = !!e.amb && typeof e.amb.kind === 'string' && typeof e.amb.n === 'number' && typeof e.amb.speed === 'number';
  if (!(keysOk && bandsOk && scalarsOk && ambOk)) badShape.push(id);
}
ok(`S1 every GYM_ARENA_ART entry carries the full treatment shape (${covered.length} covered)`,
  badShape.length === 0, badShape.join(','));
const gymSigs = covered.map((id) => sigOf(GYM_ARENA_ART[id], GYM_ARENA_ART[id].amb));
ok('S2 covered gyms\' arena signatures are pairwise distinct (exact tuples)',
  new Set(gymSigs).size === gymSigs.length,
  `${gymSigs.length - new Set(gymSigs).size} duplicate(s)`);
const baseSigs = new Set(Object.keys(ARENA_ART).map((g) => sigOf(ARENA_ART[g], ARENA_AMBIENT[g])));
const copied = covered.filter((id) => baseSigs.has(sigOf(GYM_ARENA_ART[id], GYM_ARENA_ART[id].amb)));
ok('S3 no covered gym\'s signature merely copies a base Ground treatment',
  copied.length === 0, copied.join(','));
const ownedTuples = owned.map((id) => interiors[id].tuple);
ok('S4 owned gyms\' interior tuples (floor, skeleton, dressing) are pairwise distinct',
  new Set(ownedTuples).size === ownedTuples.length,
  `${ownedTuples.length - new Set(ownedTuples).size} duplicate(s) among ${owned.length} owned`);
const allTuples = GYM_IDS.map((id) => interiors[id].tuple);
ok(`S5 ratchet: INTERIOR_TUPLES_DISTINCT = pin ${INTERIOR_TUPLES_DISTINCT} over all 36 (35 at T0 — the mauville/sunnyshore shared tuple; 36 when Mauville takes its own floor)`,
  new Set(allTuples).size === INTERIOR_TUPLES_DISTINCT,
  `measured ${new Set(allTuples).size}`);

console.log(`\ngym-identity-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
