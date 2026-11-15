// char-design-checks.mjs — the NAMED & SERVICE CHARACTER guard
// (War Room Wave W-CHAR2, NO-SAME-KIT fix sequence #7). Run:
//   node tests/char-design-checks.mjs                  (exit 1 on failure)
//   node tests/char-design-checks.mjs --write-snapshot (T0 only: regenerate
//                                                       the invariant baseline)
//
// Why this exists: the NO-SAME-KIT audit (§2) measured 742 posted NPCs
// served by a clone-heavy cast — one clerk design on 50 posts, 354 of
// 594 named posts sharing an exact design with a different person.
// W-CHAR1 fixed the 23 posted bosses; W-CHAR2 gives every named person
// a distinct design (per-character cast-* kinds, T2–T4) and splits the
// service classes into per-region uniform kinds with personal palettes
// (T1). This guard is the ratchet that makes the burn-down permanent,
// in the W13 / gym-identity form: green at every merge, pins move only
// in-commit alongside the work that moves the measurement.
//
//   C1 closure — every scoped post resolves through kit-cast (no forge
//      fall-through), re-proving leader-cast L1 over the wider scope.
//   C2 named uniqueness (ratchet) — NAMED_DUP_GROUPS / NAMED_DUP_POSTS
//      must equal the pins exactly (50/354 at T0 → 0/0 at T4). Groups
//      whose posts are all the same person (same display name) are
//      correct-by-design and excluded, per the plan's census.
//   C3 service ceiling (ratchet) — SERVICE_DUP_POSTS pin (116 at T0 →
//      0 at T1), SERVICE_MAX_DESIGN_POSTS pin (50 at T0 → ≤3 at T1),
//      and no service design repeated within one map (measured 0 at
//      T0; armed at its final form from the start).
//   C4 cast registry — every cast-* kind and every per-region service
//      kind (clerk-/attendant-/host-<region>) carried by a scoped post
//      is registered in BOTH NPC_SWAP_KEYS and KIT_CAST_SPEC in
//      src/engine/art.mjs, and the set in use equals the pinned
//      registry (empty at T0; tranches add their kinds in-commit).
//   C5 invariants — every scoped post is pinned against the T0
//      snapshot (tests/char-design-snapshot.json): map, position, dir,
//      name, dialogue, event/quest/tale linkage, story-slug fields and
//      trainer linkage hash-identical; the ONLY fields that may ever
//      differ are the design fields (art + skin/shirt/pants/hair),
//      and only on posts listed in SPEC_DESIGN_EXCEPTIONS below (each
//      entry lands in-commit with its tranche, disclosed in its
//      checklist). The actor-lifecycle default tables
//      (ACTOR_DEFAULTS + ACTOR_FLAG_DEFAULTS) are hash-pinned too.
//   R  registers (Director rulings, 2026-11-15) — ferry captains
//      (CAPT …) classify NAMED; gym attendants classify SERVICE.
//
// Census assembly is byte-for-byte the leader-cast assembly (merged
// MAPS via maps.mjs + maps2–9 in merge order, + JOHTO/HOENN/SINNOH_NPCS
// + TALE_NPCS + PARLEY_NPCS + the 2 Frontier Brain posts extracted
// from frontier.mjs literals), _cloneIx stamped exactly as loadMap
// stamps it, design resolved by the engine's own path — so this suite
// and leader-cast can never drift on what a "post" is. Classification
// is the W-CHAR2 plan's: function first (kind nurse/clerk or a
// counter-role word in the name → service), then a personal name after
// stripping trainer-class prefixes → named, else generic (W3 scope).

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(join(ROOT, p));
const sha = (s) => createHash('sha256').update(s).digest('hex');

// ---------- ratchet pins (T0: measured on main 49463353) ----------
const PIN = {
  NAMED_POSTS: 594,
  NAMED_DESIGNS: 271,
  SERVICE_POSTS: 131,
  SERVICE_DESIGNS: 69,
  SCOPE_POSTS: 725,
  NAMED_DUP_GROUPS: 50,
  NAMED_DUP_POSTS: 354,
  SERVICE_DUP_POSTS: 99,
  SERVICE_MAX_DESIGN_POSTS: 3,
  SERVICE_TOWN_REPEAT_PAIRS: 0,
};
// C4: cast-*/service-region kinds in use, pinned. T1: the 14 service
// kinds (clerk/attendant/host × region; Trial Grounds is the game's
// sixth region block — T0's region list predated the service census
// isolating its 8 clerk posts, so CAST_KIND_RE below carries 'trial'
// from T1, disclosed in the T1 checklist).
const PINNED_CAST_KINDS = ['attendant-amber', 'attendant-borea', 'attendant-maris', 'attendant-yamato', 'clerk-amber', 'clerk-arden', 'clerk-borea', 'clerk-maris', 'clerk-trial', 'clerk-yamato', 'host-arden', 'host-borea', 'host-maris', 'host-yamato'];
// C5: post keys (map#ordinal) whose DESIGN fields may differ from the
// T0 snapshot. T0: none — any design-field change fails. Tranches add
// their spec-listed posts here in-commit, disclosed in the checklist.
const SPEC_DESIGN_EXCEPTIONS = [
  'azalea#3',
  'blackthorn#2',
  'canalave#0',
  'celadon#1',
  'celadon#3',
  'celestic#0',
  'cerulean#0',
  'cherrygrove#3',
  'cianwood#0',
  'cinnabar#4',
  'dewford#3',
  'ecruteak#3',
  'eterna#0',
  'evergrande#0',
  'fallarbor#3',
  'fight-area#0',
  'fight-area#2',
  'floaroma#0',
  'fortree#3',
  'frontier-arena#0',
  'frontier-dome#0',
  'frontier-factory#0',
  'frontier-palace#0',
  'frontier-pike#0',
  'frontier-pyramid#0',
  'frontier-tower#0',
  'frontierhub#0',
  'fuchsia#2',
  'galactic-eterna#0',
  'galactic-hq#0',
  'gamecorner#0',
  'gamecorner#1',
  'gamecorner#2',
  'goldenrod#4',
  'gym-azalea#0',
  'gym-blackthorn#0',
  'gym-canalave#0',
  'gym-cianwood#0',
  'gym-dewford#0',
  'gym-ecruteak#0',
  'gym-eterna#0',
  'gym-fortree#0',
  'gym-goldenrod#0',
  'gym-hearthome#0',
  'gym-lavaridge#0',
  'gym-mahogany#0',
  'gym-mauville#0',
  'gym-mossdeep#0',
  'gym-olivine#0',
  'gym-oreburgh#0',
  'gym-pastoria#0',
  'gym-petalburg#0',
  'gym-rustboro#0',
  'gym-snowpoint#0',
  'gym-sootopolis#0',
  'gym-sunnyshore#0',
  'gym-veilstone#0',
  'gym-violet#0',
  'hearthome#0',
  'house-canalave#0',
  'house-cianwood#0',
  'house-ecruteak#0',
  'house-fight#0',
  'house-hearthome#0',
  'house-lavaridge#0',
  'house-pastoria#0',
  'house-rustboro#0',
  'house-sandgem#0',
  'house-snowpoint#0',
  'house-veilstone#0',
  'indigo#0',
  'indigo#1',
  'jubilife#0',
  'kumquat#4',
  'kumquat-gym#1',
  'lake-valor#0',
  'lavaridge#3',
  'lavender#2',
  'league-evergrande#2',
  'league-lobby#0',
  'league-lobby#1',
  'lilycove#3',
  'littleroot#0',
  'mahogany#2',
  'mahogany#4',
  'mauville#3',
  'mikan#4',
  'mikan-gym#1',
  'moro#0',
  'mossdeep#3',
  'navel#0',
  'navel-gym#1',
  'newbark#0',
  'oldale#3',
  'olivine#4',
  'oreburgh#0',
  'pacifidlog#0',
  'pallet#0',
  'pastoria#0',
  'petalburg#3',
  'pewter#0',
  'pummelo#5',
  'radio-tower-1#0',
  'resort-area#0',
  'resort-area#1',
  'rustboro#3',
  'saffron#2',
  'sandgem#0',
  'shamouti#0',
  'silph1#2',
  'silvertown#2',
  'slateport#4',
  'snowpoint#1',
  'solaceon#0',
  'sootopolis#3',
  'sunnyshore#0',
  'survival-area#0',
  'trovita#5',
  'trovita-gym#1',
  'twinleaf#0',
  'valencia#5',
  'valley-windworks#0',
  'veilstone#0',
  'veilstone#1',
  'verdanturf#0',
  'vermilion#0',
  'violet#3',
  'viridian#1',
];

// ---------- census, assembled per map in loadMap order ----------
const { MAPS } = await imp('src/data/maps.mjs');
for (let i = 2; i <= 9; i++) {
  const m = await imp(`src/data/maps${i}.mjs`);
  Object.assign(MAPS, m[`MAPS${i}`]);
}
const { JOHTO_NPCS } = await imp('src/data/story-johto.mjs');
const { HOENN_NPCS } = await imp('src/data/story-hoenn.mjs');
const { SINNOH_NPCS } = await imp('src/data/story-sinnoh.mjs');
const { TALE_NPCS } = await imp('src/data/quests.mjs');
const { PARLEY_NPCS } = await imp('src/game/bonds.mjs');
const art = await imp('src/engine/art.mjs');
const { npcArtKind, kitCastVariant, npcSwapFor, KIT_CAST_EXCEPTIONS } = art;
const { ACTOR_DEFAULTS, ACTOR_FLAG_DEFAULTS } = await imp('src/game/actors.mjs');

const byMap = new Map();
const put = (map, npc) => {
  if (!byMap.has(map)) byMap.set(map, []);
  byMap.get(map).push({ map, ...npc });
};
for (const [id, m] of Object.entries(MAPS)) for (const n of (m.npcs || [])) put(id, n);
for (const arr of [JOHTO_NPCS, HOENN_NPCS, SINNOH_NPCS, TALE_NPCS, PARLEY_NPCS])
  for (const n of arr) if (n.map) put(n.map, n);
// Frontier Brain posts (conditional; literals extracted from source —
// if the literal shape changes, extraction finds != 2 and C1 fails
// loudly, on purpose; same contract as leader-cast L1).
const frontierSrc = fs.readFileSync(join(ROOT, 'src/game/frontier.mjs'), 'utf8');
const brainRe = /name: '([A-Z]+)', x: [^,]+, y: [^,]+, art: '([a-z]+)', dir: 'down', frontierBrain: '(pike|pyramid)',\s+skin: '(#[0-9a-f]+)', shirt: '(#[0-9a-f]+)', pants: '(#[0-9a-f]+)', hair: '(#[0-9a-f]+)'/g;
const brainPosts = [];
for (const m of frontierSrc.matchAll(brainRe)) {
  brainPosts.push({ map: m[3] === 'pike' ? 'frontier-pike' : 'frontier-pyramid-a', name: m[1], art: m[2], skin: m[4], shirt: m[5], pants: m[6], hair: m[7] });
}
for (const b of brainPosts) put(b.map, b);

// stamp _cloneIx per map exactly as loadMap does; key = map#ordinal
const posts = [];
for (const [map, list] of byMap) {
  const seen = new Map();
  list.forEach((n, ix) => {
    const key = (n.art || '') + '|' + [n.skin, n.shirt, n.pants, n.hair].join('/');
    n._cloneIx = seen.get(key) || 0;
    seen.set(key, n._cloneIx + 1);
    n._key = `${map}#${ix}`;
    posts.push(n);
  });
}

const designKey = (n) => {
  const kind = npcArtKind(n);
  if (kind === 'pc' || KIT_CAST_EXCEPTIONS.has(kind)) return 'EXEMPT:' + kind;
  const v = kitCastVariant(n, kind);
  if (v) return kind + '|' + v.key;
  const sw = npcSwapFor(n, kind);
  if (sw) return kind + '|AUTH|' + JSON.stringify(sw);
  return kind + '|FORGE';
};

// ---- classification (W-CHAR2 plan §1, verbatim) ----
const SERVICE_NAME_RE = /CLERK|NURSE|REGISTRAR|RECEPTIONIST|CASHIER|VENDOR|ATTENDANT|CONCIERGE|HOSTESS|TICKET|AGENT|PHARMACIST/;
const CLASS_PREFIXES = ['ACE TRAINER', 'BUG CATCHER', 'KIMONO GIRL', 'BLACK BELT', 'YOUNGSTER', 'LASS', 'HIKER', 'SAILOR', 'LADY', 'GENT', 'GENTLEMAN', 'WORKER', 'SCIENTIST', 'FISHER', 'FISHERMAN', 'CAMPER', 'BIKER', 'RANGER', 'TWIN', 'KID', 'ELDER', 'MONK', 'SWIMMER', 'PICNICKER', 'OFFICER', 'GRUNT', 'COACH', 'AIDE', 'TRAINER', 'FAN', 'BOY', 'GIRL', 'MAN', 'WOMAN', 'MR.', 'MRS.', 'MISS', 'DR.', 'PROF.', 'PROFESSOR', 'CAPTAIN', 'CHIEF', 'GUARD', 'WAITER', 'WAITRESS', 'CHEF', 'ARTIST', 'DANCER', 'MUSICIAN', 'STUDENT', 'TEACHER', 'FARMER', 'RANCHER', 'BREEDER', 'COLLECTOR', 'MANIAC', 'ADEPT', 'TAMER', 'MASTER', 'SAGE', 'MEDIUM', 'PSYCHIC', 'HEX', 'BEAUTY', 'SWIMMER', 'TUBER', 'RUIN', 'DRAGON', 'BIRD', 'POKE', 'CHANNELER', 'ENGINEER', 'PAINTER', 'GUITARIST', 'JUGGLER', 'FIREBREATHER', 'BURGLAR', 'GAMBLER', 'FISHER'];
function classify(n) {
  const kind = npcArtKind(n);
  if (kind === 'pc' || KIT_CAST_EXCEPTIONS.has(kind)) return 'exempt';
  const name = (n.name || '').toUpperCase().trim();
  // T1: the per-region service kinds are the 'clerk' kind's successors
  // — posts T0 classified by kind==='clerk' whose names carry no
  // counter-role word (GYM GUIDE, LEAGUE GUIDE, DEPT MANAGER VEE,
  // SHOPKEEPER PELL) stay SERVICE on their region kinds, so the T0
  // classification (and every named pin) is preserved exactly.
  if (kind === 'nurse' || kind === 'clerk' || /^(clerk|attendant|host)-/.test(kind) || SERVICE_NAME_RE.test(name)) return 'service';
  if (!name) return 'generic';
  let rest = name;
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const p of CLASS_PREFIXES) {
      if (rest === p) return 'generic';
      if (rest.startsWith(p + ' ')) { rest = rest.slice(p.length + 1); stripped = true; }
    }
  }
  return 'named';
}

for (const n of posts) {
  n._kind = npcArtKind(n);
  n._design = designKey(n);
  n._class = classify(n);
}
const named = posts.filter((p) => p._class === 'named');
const service = posts.filter((p) => p._class === 'service');
const scope = posts.filter((p) => p._class === 'named' || p._class === 'service');

function dupGroups(list, samePersonOk) {
  const g = new Map();
  for (const p of list) {
    if (!g.has(p._design)) g.set(p._design, []);
    g.get(p._design).push(p);
  }
  const groups = [];
  for (const [design, ps] of g) {
    if (ps.length < 2) continue;
    const names = new Set(ps.map((p) => (p.name || '').toUpperCase()));
    if (samePersonOk && names.size < 2) continue;
    groups.push({ design, posts: ps.length });
  }
  return groups;
}

// ---------- invariant snapshot (C5) ----------
const DESIGN_FIELDS = ['art', 'skin', 'shirt', 'pants', 'hair'];
function stable(v, seen = new Set()) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'function') return '"[fn]"';
  if (typeof v !== 'object') return JSON.stringify(v);
  if (seen.has(v)) return '"[circular]"';
  seen.add(v);
  let out;
  if (Array.isArray(v)) out = '[' + v.map((x) => stable(x, seen)).join(',') + ']';
  else out = '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k], seen)).join(',') + '}';
  seen.delete(v);
  return out;
}
function postHashes(n) {
  const inv = {};
  for (const k of Object.keys(n)) {
    if (k === 'map' || k === '_cloneIx' || k.startsWith('_')) continue;
    if (DESIGN_FIELDS.includes(k)) continue;
    inv[k] = n[k];
  }
  const design = {};
  for (const f of DESIGN_FIELDS) design[f] = n[f] === undefined ? null : n[f];
  return { inv: sha(stable(inv)), design: sha(stable(design)) };
}
const actorHash = sha(stable({ ACTOR_DEFAULTS, ACTOR_FLAG_DEFAULTS }));
const SNAP_PATH = join(ROOT, 'tests', 'char-design-snapshot.json');

if (process.argv.includes('--write-snapshot')) {
  const snap = { wave: 'W-CHAR2 T0', base: '49463353', actorHash, posts: {} };
  for (const n of scope) snap.posts[n._key] = { name: n.name || '', ...postHashes(n) };
  fs.writeFileSync(SNAP_PATH, JSON.stringify(snap, null, 1) + '\n');
  console.log(`char-design snapshot written: ${scope.length} scoped posts, actorHash ${actorHash.slice(0, 12)}…`);
  process.exit(0);
}

// ---------- checks ----------
let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) pass++;
  else { fail++; failures.push(label); }
}

// census pins
ok(posts.length === 742, `census: 742 total posts (got ${posts.length})`);
ok(named.length === PIN.NAMED_POSTS, `census pin: named posts ${PIN.NAMED_POSTS} (got ${named.length})`);
ok(new Set(named.map((p) => p._design)).size === PIN.NAMED_DESIGNS, `census pin: named designs ${PIN.NAMED_DESIGNS} (got ${new Set(named.map((p) => p._design)).size})`);
ok(service.length === PIN.SERVICE_POSTS, `census pin: service posts ${PIN.SERVICE_POSTS} (got ${service.length})`);
ok(new Set(service.map((p) => p._design)).size === PIN.SERVICE_DESIGNS, `census pin: service designs ${PIN.SERVICE_DESIGNS} (got ${new Set(service.map((p) => p._design)).size})`);
ok(scope.length === PIN.SCOPE_POSTS, `census pin: scope posts ${PIN.SCOPE_POSTS} (got ${scope.length})`);
ok(brainPosts.length === 2, `census: expected 2 Frontier Brain posts extracted, got ${brainPosts.length}`);

// C1 closure
let forge = 0;
for (const n of scope) {
  if (n._design.endsWith('|FORGE')) {
    forge++;
    ok(false, `C1 forge-placeholder post: ${n.name || '(unnamed)'} @ ${n.map} kind=${n._kind}`);
  }
}
ok(forge === 0, `C1: ${forge} scoped posts render via the forge placeholder`);

// C2 named uniqueness (ratchet)
const nGroups = dupGroups(named, true);
const nDupPosts = nGroups.reduce((a, g) => a + g.posts, 0);
ok(nGroups.length === PIN.NAMED_DUP_GROUPS, `C2 ratchet: NAMED_DUP_GROUPS ${PIN.NAMED_DUP_GROUPS} (measured ${nGroups.length})`);
ok(nDupPosts === PIN.NAMED_DUP_POSTS, `C2 ratchet: NAMED_DUP_POSTS ${PIN.NAMED_DUP_POSTS} (measured ${nDupPosts})`);

// C3 service ceiling (ratchet)
const sGroups = dupGroups(service, false);
const sDupPosts = sGroups.reduce((a, g) => a + g.posts, 0);
const sMax = sGroups.reduce((a, g) => Math.max(a, g.posts), 0);
ok(sDupPosts === PIN.SERVICE_DUP_POSTS, `C3 ratchet: SERVICE_DUP_POSTS ${PIN.SERVICE_DUP_POSTS} (measured ${sDupPosts})`);
ok(sMax === PIN.SERVICE_MAX_DESIGN_POSTS, `C3 ratchet: SERVICE_MAX_DESIGN_POSTS ${PIN.SERVICE_MAX_DESIGN_POSTS} (measured ${sMax})`);
const svcTown = new Map();
for (const p of service) {
  const k = p._design + ' @ ' + p.map;
  svcTown.set(k, (svcTown.get(k) || 0) + 1);
}
const townRepeats = [...svcTown.values()].filter((v) => v >= 2).length;
ok(townRepeats === PIN.SERVICE_TOWN_REPEAT_PAIRS, `C3: service designs repeated within one map ${PIN.SERVICE_TOWN_REPEAT_PAIRS} (measured ${townRepeats})`);

// C4 cast registry — registration is verified against the art.mjs
// source tables (NPC_SWAP_KEYS / KIT_CAST_SPEC are module-const, not
// exported; both are single literal blocks).
const artSrc = fs.readFileSync(join(ROOT, 'src/engine/art.mjs'), 'utf8');
function tableBlock(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) return '';
  let depth = 0, j = src.indexOf('{', i);
  const start = j;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(start, j + 1);
  }
  return '';
}
const swapBlock = tableBlock(artSrc, 'const NPC_SWAP_KEYS =');
const specBlock = tableBlock(artSrc, 'const KIT_CAST_SPEC =');
ok(!!swapBlock && !!specBlock, 'C4: NPC_SWAP_KEYS and KIT_CAST_SPEC blocks found in art.mjs');
const inTable = (block, kind) => new RegExp(`['"]?${kind.replace(/[-]/g, '\\-')}['"]?\\s*:`).test(block);
const CAST_KIND_RE = /^cast-|^(clerk|attendant|host)-(arden|yamato|maris|borea|amber|trial)$/;
const usedCastKinds = [...new Set(scope.map((p) => p._kind).filter((k) => CAST_KIND_RE.test(k)))].sort();
for (const k of usedCastKinds) {
  ok(inTable(swapBlock, k), `C4 ${k}: registered in NPC_SWAP_KEYS`);
  ok(inTable(specBlock, k), `C4 ${k}: carries a KIT_CAST_SPEC entry`);
}
ok(JSON.stringify(usedCastKinds) === JSON.stringify([...PINNED_CAST_KINDS].sort()), `C4 registry pin: [${PINNED_CAST_KINDS.join(', ')}] (in use: [${usedCastKinds.join(', ')}])`);

// C5 invariants vs the T0 snapshot
const snap = JSON.parse(fs.readFileSync(SNAP_PATH, 'utf8'));
ok(snap.actorHash === actorHash, 'C5: actor-lifecycle default tables hash-identical to T0');
const snapKeys = Object.keys(snap.posts);
ok(snapKeys.length === PIN.SCOPE_POSTS, `C5: snapshot holds ${PIN.SCOPE_POSTS} scoped posts (got ${snapKeys.length})`);
const exceptions = new Set(SPEC_DESIGN_EXCEPTIONS);
let invBad = 0, designBad = 0, missing = 0;
const seenKeys = new Set();
for (const n of scope) {
  seenKeys.add(n._key);
  const s = snap.posts[n._key];
  if (!s) { missing++; ok(false, `C5 post missing from snapshot: ${n._key} (${n.name || ''})`); continue; }
  const h = postHashes(n);
  if (h.inv !== s.inv) { invBad++; if (invBad <= 10) ok(false, `C5 invariant drift: ${n._key} (${n.name || ''}) — non-design field changed`); }
  if (h.design !== s.design && !exceptions.has(n._key)) { designBad++; if (designBad <= 10) ok(false, `C5 design change off-spec: ${n._key} (${n.name || ''}) — art/palette changed on a post no tranche spec lists`); }
}
ok(invBad === 0, `C5: ${invBad} scoped posts drifted in invariant fields`);
ok(designBad === 0, `C5: ${designBad} scoped posts changed design fields off-spec`);
ok(missing === 0 && snapKeys.every((k) => seenKeys.has(k)), 'C5: snapshot key set == live scoped-post key set (no post added, removed, or re-keyed)');

// R registers (Director rulings)
const capts = scope.filter((p) => /^CAPT\s/.test((p.name || '').toUpperCase()));
ok(capts.length > 0 && capts.every((p) => p._class === 'named'), `R1: all ${capts.length} ferry captains classify NAMED`);
const attendants = scope.filter((p) => /ATTENDANT/.test((p.name || '').toUpperCase()));
ok(attendants.length > 0 && attendants.every((p) => p._class === 'service'), `R2: all ${attendants.length} gym attendants classify SERVICE`);

console.log(`char-design census: ${posts.length} posts · named ${named.length}/${new Set(named.map((p) => p._design)).size} designs · service ${service.length}/${new Set(service.map((p) => p._design)).size} designs · dup named ${nDupPosts} posts in ${nGroups.length} groups · dup service ${sDupPosts} posts, max design ${sMax}`);
for (const f of failures.slice(0, 20)) console.log('FAIL', f);
console.log(`char-design-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
