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
//
// Legendary Arenas wave (NO-SAME-KIT fix #10) extends this suite into
// the ARENA-IDENTITY guard: the §V section below holds the 53 non-gym
// special venues (WAVE-ARENAS-PLAN §1 census — 32 legendary face
// venues, 9 league interiors, 2 stadiums, 10 Frontier facility maps)
// to the same discipline. Arenas T0 generalizes the seam: gymArenaFor
// becomes arenaOverrideFor, consulting GYM_ARENA_ART first (untouched)
// then the new VENUE_ARENA_ART (ships EMPTY), Ground fallback last;
// the M-section needles were re-cut to the generalized wiring in the
// T0 commit, at the same strength, disclosed here. Venue ratchets:
//   VENUE_ARENA_COVERED      venues with a VENUE_ARENA_ART entry  0 -> 53
//                            (T2 measured path: -> 48 of 53, the 5
//                            Borea chamber maps out on proof — §V)
//   VENUE_TUPLES_DISTINCT    distinct arena signatures over the
//                            covered venues                       0 -> 53
// The freeze extends to the venues explicitly: each venue's
// MAP_GROUND value is pinned per map in §V, and a whole-table
// MAP_GROUND hash (all 432 assignments) is pinned there too — the §F
// whole-table hashes over GROUNDS / ARENA_ART / ARENA_AMBIENT already
// covered the rules and base treatments and stay as they are.

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

// ---------------- ratchet pins (T0; burned down per tranche) -----------
// T1 (Arden): COVERED 0->8, FLOOR_OWNED 0->8, GYMFLOOR_DOMINANT 36->28.
// T2 (Yamato): COVERED 8->16, FLOOR_OWNED 8->16, GYMFLOOR_DOMINANT 28->20.
// INTERIOR_TUPLES_DISTINCT stays 35 — the mauville/sunnyshore shared
// tuple is untouched; every Arden/Yamato tuple is unique by its floor.
// T3 (Maris): COVERED 16->24, FLOOR_OWNED 16->24, GYMFLOOR_DOMINANT
// 20->12. INTERIOR_TUPLES_DISTINCT 35->36, MEASURED at T3: Mauville
// taking dynamofloor breaks the mauville/sunnyshore shared tuple, so
// all 36 gyms now hold distinct interior tuples.
// T4 (Borea): COVERED 24->32, FLOOR_OWNED 24->32, GYMFLOOR_DOMINANT
// 12->4 (the four Amber gyms still stand on gymfloor until T5).
// INTERIOR_TUPLES_DISTINCT stays 36, MEASURED at T4: every Borea tuple
// was already distinct and each gym takes a unique floor kind.
// T5 (Amber, WAVE CLOSURE): COVERED 32->36, FLOOR_OWNED 32->36,
// GYMFLOOR_DOMINANT 4->0 — every badge gym owns its arena and its
// floor; the shared gymfloor serves no gym. INTERIOR_TUPLES_DISTINCT
// stays 36, MEASURED at T5: all 36 tuples pairwise distinct at close.
const GYM_ARENA_COVERED = 36;
const GYM_FLOOR_OWNED = 36;
const GYMFLOOR_DOMINANT = 0;
const INTERIOR_TUPLES_DISTINCT = 36;

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
  + ' GYM_ARENA_ART: (typeof GYM_ARENA_ART !== "undefined" ? GYM_ARENA_ART : undefined),'
  + ' VENUE_ARENA_ART: (typeof VENUE_ARENA_ART !== "undefined" ? VENUE_ARENA_ART : undefined),'
  + ' arenaOverrideFor: (typeof arenaOverrideFor !== "undefined" ? arenaOverrideFor : undefined) };', ctx);
const { MAPS, ARENA_ART, ARENA_AMBIENT, GYM_ARENA_ART, VENUE_ARENA_ART, arenaOverrideFor } = ctx.__X;
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
ok('M2 arenaOverrideFor(this.field) is consulted at exactly the drawArena + ptDisc read sites',
  count(battleSrc, 'arenaOverrideFor(this.field)') === 2,
  String(count(battleSrc, 'arenaOverrideFor(this.field)')));
ok('M3 drawArenaAmbient consults the entry\'s own amb ahead of ARENA_AMBIENT[gid]',
  count(battleSrc, '(ga && ga.amb) || ARENA_AMBIENT[gid]') === 1);
ok('M4 the resolver consults GYM_ARENA_ART then VENUE_ARENA_ART by field.mapId (map-id keying, gym first)',
  battleSrc.includes('return GYM_ARENA_ART[field.mapId] || VENUE_ARENA_ART[field.mapId] || null;'));
ok('M5 VENUE_ARENA_ART table is declared in battle.mjs and reachable in the bundle',
  battleSrc.includes('const VENUE_ARENA_ART = {') && !!VENUE_ARENA_ART && typeof VENUE_ARENA_ART === 'object');
ok('M6 resolver behaviour: a gym map resolves to its gym entry, a venue map to its venue entry (or null), null/empty fields to null',
  typeof arenaOverrideFor === 'function'
  && arenaOverrideFor({ mapId: 'gym' }) === GYM_ARENA_ART['gym']
  && arenaOverrideFor({ mapId: 'hall-of-origin' }) === (VENUE_ARENA_ART['hall-of-origin'] || null)
  && arenaOverrideFor(null) === null && arenaOverrideFor({}) === null);

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
// W-CHAR2 T1 re-pin (disclosed): the 28 gyms hosting GYM ATTENDANT
// posts (Yamato/Maris/Borea 8 each + the 4 Amber gyms) moved to their
// new values — the npcs component's DESIGN fields only (attendant
// art kind youngster/ranger -> attendant-<region>, names/palettes
// kept), proven per-post by char-design C5 (invariant hash unchanged
// on every post). Positions, warps, signs, items, events untouched.
const DATA_PINS = {
  'gym': 'a3ffbe5217078854', 'gym-azalea': 'e6baf7d42f5e3f02',
  'gym-blackthorn': '8edf083f3877611a', 'gym-canalave': '395587c6b5c4d279',
  'gym-celadon': '06812833d205cd72', 'gym-cerulean': '2e9ecd0148931275',
  'gym-cianwood': 'b51478f7d94b183a', 'gym-cinnabar': 'ed18a27b80bb0ca1',
  'gym-dewford': 'f836fbf25152f97f', 'gym-ecruteak': 'dd81823d2ece564c',
  'gym-eterna': '7a688eb5eca57527', 'gym-fortree': '2ecf6d26ffd4716e',
  'gym-fuchsia': 'b72b008b7adeeac8', 'gym-goldenrod': 'c3574be89b4b1a21',
  'gym-hearthome': '0a546e8c31088540', 'gym-lavaridge': 'cd200524a5251a0c',
  'gym-mahogany': '75dc05b36dcca946', 'gym-mauville': '0571cefcb84cd89b',
  'gym-mossdeep': '9a8de5e6c813c5c8', 'gym-olivine': '89e3c46cf5b64d65',
  'gym-oreburgh': 'd409a211377d003e', 'gym-pastoria': 'b603f57d4c6265a4',
  'gym-petalburg': '1f324dcfca7d537e', 'gym-rustboro': 'f22fc36a100bfd1d',
  'gym-saffron': '482cfe81a0c76152', 'gym-snowpoint': '6b2d7fd9e44729ea',
  'gym-sootopolis': '9c5f4963fa358881', 'gym-sunnyshore': '465093a4e0a6845f',
  'gym-veilstone': 'debcdc8177394759', 'gym-vermilion': '31bd6c63bd6fa004',
  'gym-violet': '12f7e012231e0e5f', 'gym-viridian': '3bc44acfb2ca1a66',
  'kumquat-gym': '7eb138c02bc9010b', 'mikan-gym': '55adcf88f20b12c1',
  'navel-gym': '497f294e919354a6', 'trovita-gym': 'd68980a4fe792d62',
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

// ---------------- V: venues (Legendary Arenas wave, fix #10) -----------
// The 53 special battle venues outside the gyms (WAVE-ARENAS-PLAN §1):
// 32 legendary/mythical face venues, 9 league interiors, 2 stadiums,
// 10 Frontier facility maps. Roamers are OUT (Director ruling: the
// map-keyed law — a roaming battle reads as the place it found you);
// two faces sharing one map (meteor-falls, spear-pillar) take ONE
// treatment per map. The pinned list IS the census — a new
// venue-shaped map fails here by name until a tranche charters it.
const VENUE_IDS = [
  'ancient-tomb', 'bell-tower-1', 'bell-tower-2', 'ceruleancave',
  'desert-ruins', 'fire-cave', 'flower-paradise', 'frontier-arena',
  'frontier-dome', 'frontier-factory', 'frontier-palace',
  'frontier-pike', 'frontier-pyramid', 'frontier-pyramid-a',
  'frontier-pyramid-b', 'frontier-pyramid-c', 'frontier-tower',
  'hall-of-origin', 'ice-cave', 'ilex-forest', 'island-cave',
  'lake-acuity-cave', 'lake-valor-cave', 'league', 'league-chamber-1',
  'league-chamber-2', 'league-chamber-3', 'league-chamber-4',
  'league-champion', 'league-evergrande', 'league-lobby',
  'lightning-cave', 'magma-hideout', 'meteor-falls', 'mt-mortar-2',
  'national-park', 'newisland', 'newmoon-island', 'powerplant',
  'pokemon-league', 'pummelo-stadium', 'r125', 'r127-underwater',
  'r209', 'seafoam', 'shamouti-deep', 'silver-stadium', 'sky-pillar',
  'snowpoint-temple-depths', 'spear-pillar', 'stark-interior',
  'turnback-cave', 'victoryroad',
];
// Ratchets (Arenas T0 measured; burn down per tranche, in-commit only):
// T1 +14 sovereigns/finales -> 14. T2 +6 league/stadiums -> 20 (11
// chartered; league-chamber-1..4 + league-champion came OUT on
// build-time proof — they host no battle in the shipped game: no
// trainer post, event, story post, handler or encounter table, and
// their signs defer their keepers to "the League's season"; they
// stay in the census above UNCOVERED). T3 +18 remaining legendary
// -> 38, T4 +10 frontier -> 48 of 53 — whether the census itself
// drops 53 -> 48 is the Director's call at the T2 merge, flagged in
// the T2 SPEC; the pins here record only what T2 measured.
const VENUE_ARENA_COVERED = 20;
const VENUE_TUPLES_DISTINCT = 20;

ok('V1 venue census is exactly the pinned 53 and every venue id is a merged map',
  VENUE_IDS.length === 53 && new Set(VENUE_IDS).size === 53
  && VENUE_IDS.every((id) => !!MAPS[id]),
  'missing from MAPS: ' + VENUE_IDS.filter((id) => !MAPS[id]).join(','));
ok('V2 venue census is disjoint from the gym census (no map is both a gym and a venue)',
  VENUE_IDS.every((id) => !GYM_IDS.includes(id)),
  VENUE_IDS.filter((id) => GYM_IDS.includes(id)).join(','));
const venueCovered = VENUE_IDS.filter((id) => VENUE_ARENA_ART && VENUE_ARENA_ART[id]);
ok(`V3 ratchet: VENUE_ARENA_COVERED = pin ${VENUE_ARENA_COVERED} (T1 +14, T2 +6 of 11 — 5 chambers out on proof, T3 +18, T4 +10)`,
  venueCovered.length === VENUE_ARENA_COVERED,
  venueCovered.length > VENUE_ARENA_COVERED
    ? `measured ${venueCovered.length} — coverage grew outside a pin move (unrecorded claim)`
    : `measured ${venueCovered.length} — pin is stale; move it in the tranche commit that covered them`);
const venueKeys = VENUE_ARENA_ART ? Object.keys(VENUE_ARENA_ART) : [];
ok('V4 VENUE_ARENA_ART keys are exactly the covered census venues (no stray keys)',
  venueKeys.every((id) => VENUE_IDS.includes(id)) && venueKeys.length === venueCovered.length,
  venueKeys.filter((id) => !VENUE_IDS.includes(id)).join(','));
ok('V5 key disjointness: VENUE_ARENA_ART keys ∩ GYM_ARENA_ART keys = ∅ (gym table wins by seam order, never by collision)',
  venueKeys.every((id) => !(GYM_ARENA_ART && GYM_ARENA_ART[id])),
  venueKeys.filter((id) => GYM_ARENA_ART && GYM_ARENA_ART[id]).join(','));
const venueBadShape = [];
for (const id of venueCovered) {
  const e = VENUE_ARENA_ART[id];
  const keysOk = Object.keys(e).every((k) => ENTRY_KEYS.has(k));
  const bandsOk = Array.isArray(e.sky) && e.sky.length === 6 && e.sky.every((v) => typeof v === 'string')
    && Array.isArray(e.ground) && e.ground.length === 6 && e.ground.every((v) => typeof v === 'string');
  const scalarsOk = ['dark', 'light', 'accent', 'motif', 'tex'].every((k) => typeof e[k] === 'string' && e[k].length > 0);
  const ambOk = !!e.amb && typeof e.amb.kind === 'string' && typeof e.amb.n === 'number' && typeof e.amb.speed === 'number';
  if (!(keysOk && bandsOk && scalarsOk && ambOk)) venueBadShape.push(id);
}
ok(`V6 every VENUE_ARENA_ART entry carries the full treatment shape (${venueCovered.length} covered)`,
  venueBadShape.length === 0, venueBadShape.join(','));
const venueSigs = venueCovered.map((id) => sigOf(VENUE_ARENA_ART[id], VENUE_ARENA_ART[id].amb));
ok(`V7 ratchet: VENUE_TUPLES_DISTINCT = pin ${VENUE_TUPLES_DISTINCT} (distinct signatures over covered venues == covered count)`,
  new Set(venueSigs).size === venueSigs.length && new Set(venueSigs).size === VENUE_TUPLES_DISTINCT,
  `measured ${new Set(venueSigs).size} distinct over ${venueSigs.length} covered`);
const venueCopied = venueCovered.filter((id) => baseSigs.has(sigOf(VENUE_ARENA_ART[id], VENUE_ARENA_ART[id].amb))
  || gymSigs.includes(sigOf(VENUE_ARENA_ART[id], VENUE_ARENA_ART[id].amb)));
ok('V8 no covered venue\'s signature merely copies a base Ground treatment or a gym treatment',
  venueCopied.length === 0, venueCopied.join(','));
// Freeze extended to the venues: every venue's MAP_GROUND value is
// pinned per map, and the whole assignment table (all 432) is hashed —
// this wave changes no MAP_GROUND entry anywhere.
const VENUE_GROUND_PINS = {
  'ancient-tomb': 'spirit', 'bell-tower-1': 'spirit',
  'bell-tower-2': 'spirit', 'ceruleancave': 'rubble',
  'desert-ruins': 'spirit', 'fire-cave': 'ember',
  'flower-paradise': 'bloom', 'frontier-arena': 'rubble',
  'frontier-dome': 'open', 'frontier-factory': 'volt',
  'frontier-palace': 'mind', 'frontier-pike': 'venom',
  'frontier-pyramid': 'spirit', 'frontier-pyramid-a': 'spirit',
  'frontier-pyramid-b': 'spirit', 'frontier-pyramid-c': 'spirit',
  'frontier-tower': 'rubble', 'hall-of-origin': 'spirit',
  'ice-cave': 'frost', 'ilex-forest': 'bloom', 'island-cave': 'frost',
  'lake-acuity-cave': 'frost', 'lake-valor-cave': 'tide',
  'league': 'open', 'league-chamber-1': 'open',
  'league-chamber-2': 'open', 'league-chamber-3': 'open',
  'league-chamber-4': 'open', 'league-champion': 'open',
  'league-evergrande': 'open', 'league-lobby': 'open',
  'lightning-cave': 'storm', 'magma-hideout': 'ember',
  'meteor-falls': 'rubble', 'mt-mortar-2': 'rubble',
  'national-park': 'bloom', 'newisland': 'tide',
  'newmoon-island': 'grave', 'powerplant': 'storm',
  'pokemon-league': 'open', 'pummelo-stadium': 'open', 'r125': 'tide',
  'r127-underwater': 'tide', 'r209': 'bloom', 'seafoam': 'frost',
  'shamouti-deep': 'tide', 'silver-stadium': 'open',
  'sky-pillar': 'storm', 'snowpoint-temple-depths': 'frost',
  'spear-pillar': 'spirit', 'stark-interior': 'ember',
  'turnback-cave': 'grave', 'victoryroad': 'rubble',
};
for (const id of VENUE_IDS) {
  ok(`V ${id} MAP_GROUND stays '${VENUE_GROUND_PINS[id]}' (freeze extended to venues)`,
    MAP_GROUND[id] === VENUE_GROUND_PINS[id], String(MAP_GROUND[id]));
}
ok('V9 the whole MAP_GROUND table (all 432 assignments) hashes unchanged',
  sha(JSON.stringify(MAP_GROUND)) === 'd61c7c5819a53e9e3cc92fe0212be002a69ae5cd3b9219e05baf23c1853ceeb1',
  sha(JSON.stringify(MAP_GROUND)));

console.log(`\ngym-identity-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
