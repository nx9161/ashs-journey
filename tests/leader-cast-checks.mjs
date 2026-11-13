// leader-cast-checks.mjs — the LEADERS & COMMANDERS guard (War Room
// Wave W-CHAR1). Run: node tests/leader-cast-checks.mjs (exit 1 on any
// failure).
//
// Why this exists: the NO-SAME-KIT audit (§2, 2026-11-13) measured the
// game's sharpest clone violation — 18 gym leaders shared 5 sprites
// and 5 villain commanders shared 1, with their authored palettes not
// even rendered. Root cause, proven in src/engine/art.mjs: the kinds
// gym1-gym5 / rocket / blackbelt / picnicker / kimono had NO
// KIT_CAST_SPEC entry and NO NPC_SWAP_KEYS entry and no authored art,
// so kitCastVariant() returned null and every post on those kinds fell
// through to the forgeHumanoid placeholder — one flat silhouette for
// every boss in three regions. W-CHAR1 gave each posted leader and
// commander a per-character kind (lead-<gym town> / cmd-<site>, keyed
// to the post, never to a display name) and class specs for the rest.
//
// This guard is the probe that would have caught the bug, kept:
//   L1 palette/class closure — EVERY posted NPC in the census must
//      resolve through the kit-cast variant system (or be the PC
//      terminal / a kit-cast exception kind). A null variant means the
//      post renders via the forge placeholder: fail, by post.
//   L2 the W-CHAR1 cast — each of the 23 re-pointed posts carries its
//      per-character kind, and all 23 rendered designs are pairwise
//      distinct (kind + the resolver's own variant key).
//   L3 the wider boss set — the previously named posted bosses (Kanto
//      named kinds in gym/league maps, the remaining Yamato/Maris
//      leaders on generic kinds, Steven's story post, the two
//      conditional Frontier Brain posts) also render pairwise-distinct
//      designs, and none collides with the L2 cast.
//   L4 battle side — every cast trainer ID resolves to a NAMED
//      per-character battle figure (never a trainer-class figure),
//      the figure and both pose deltas materialize, and all cast
//      figures are pairwise distinct rasters (>= 100 differing pixels;
//      measured minimum at build: 183, between the two Galactic
//      commanders whose overworld palettes are identical by data).
//
// Census = merged MAPS (maps.mjs folded with maps2-9, merge.mjs order)
// + JOHTO/HOENN/SINNOH_NPCS + TALE_NPCS + PARLEY_NPCS + the two
// Frontier Brain posts (extracted from frontierBrainNpcs' literals in
// src/game/frontier.mjs, which cannot be imported standalone — if the
// literal shape changes, extraction finds != 2 posts and L1 fails
// loudly, on purpose). _cloneIx is stamped exactly as loadMap stamps
// it (overworld.mjs: cloneKey = art|skin/shirt/pants/hair per map).

import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = (p) => import(join(ROOT, p));

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
const { JOHTO_TRAINERS } = await imp('src/data/story-johto.mjs');
const { HOENN_TRAINERS } = await imp('src/data/story-hoenn.mjs');
const { SINNOH_TRAINERS } = await imp('src/data/story-sinnoh.mjs');
const { ORANGE_TRAINERS } = await imp('src/data/story-orange.mjs');
const art = await imp('src/engine/art.mjs');
const { npcArtKind, kitCastVariant, trainerArtKind, materializeArt, KIT_CAST_EXCEPTIONS, NPC_NAMED_KINDS } = art;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) pass++;
  else { fail++; failures.push(label); }
}

// ---------- census, assembled per map in loadMap order ----------
const byMap = new Map();
const put = (map, npc) => {
  if (!byMap.has(map)) byMap.set(map, []);
  byMap.get(map).push({ map, ...npc });
};
for (const [id, m] of Object.entries(MAPS)) for (const n of (m.npcs || [])) put(id, n);
for (const arr of [JOHTO_NPCS, HOENN_NPCS, SINNOH_NPCS, TALE_NPCS, PARLEY_NPCS])
  for (const n of arr) if (n.map) put(n.map, n);
// Frontier Brain posts (conditional; literals extracted from source).
const frontierSrc = fs.readFileSync(join(ROOT, 'src/game/frontier.mjs'), 'utf8');
const brainRe = /name: '([A-Z]+)', x: [^,]+, y: [^,]+, art: '([a-z]+)', dir: 'down', frontierBrain: '(pike|pyramid)',\s+skin: '(#[0-9a-f]+)', shirt: '(#[0-9a-f]+)', pants: '(#[0-9a-f]+)', hair: '(#[0-9a-f]+)'/g;
const brainPosts = [];
for (const m of frontierSrc.matchAll(brainRe)) {
  brainPosts.push({ map: m[3] === 'pike' ? 'frontier-pike' : 'frontier-pyramid-a', name: m[1], art: m[2], skin: m[4], shirt: m[5], pants: m[6], hair: m[7], _brain: m[3] });
}
for (const b of brainPosts) put(b.map, b);

// stamp _cloneIx per map exactly as loadMap does
const posts = [];
for (const [map, list] of byMap) {
  const seen = new Map();
  for (const n of list) {
    const key = (n.art || '') + '|' + [n.skin, n.shirt, n.pants, n.hair].join('/');
    n._cloneIx = seen.get(key) || 0;
    seen.set(key, n._cloneIx + 1);
    posts.push(n);
  }
}
const slugOf = (n) => n.johto || n.hoenn || n.sinnoh || null;
const designKey = (n) => {
  const kind = npcArtKind(n);
  const v = kitCastVariant(n, kind);
  return v ? kind + '|' + v.key : null;
};

// ---------- L1: palette / class closure ----------
// Resolution mirrors npcFramesFor's real order: kit-cast variant, the
// dedicated Gary path (his shipped kit frames via npcSwapFor — he has
// no KIT_CAST_SPEC entry by design), or an authored frame pair. A post
// with none of the three renders as the forge placeholder: the bug.
const { npcSwapFor } = art;
function resolves(n, kind) {
  if (kind === 'pc' || KIT_CAST_EXCEPTIONS.has(kind)) return true;
  if (kitCastVariant(n, kind)) return true;
  if (kind === 'gary' && npcSwapFor(n, kind)) return true;
  const prefix = kind === 'brock' ? 'brock' : 'npc-' + kind;
  return !!(materializeArt(prefix + '-idle-1') && materializeArt(prefix + '-idle-2'));
}
let l1Checked = 0, l1Forge = 0;
for (const n of posts) {
  const kind = npcArtKind(n);
  l1Checked++;
  if (!resolves(n, kind)) {
    l1Forge++;
    ok(false, `L1 forge-placeholder post: ${n.name || '(unnamed)'} @ ${n.map} kind=${kind}`);
  }
}
ok(l1Forge === 0, `L1: ${l1Forge} posts render via the forge placeholder`);
ok(brainPosts.length === 2, `L1: expected 2 Frontier Brain posts extracted, got ${brainPosts.length}`);

// ---------- L2: the W-CHAR1 cast ----------
const CAST23 = [
  ['johto', 'falkner', 'gym-violet', 'lead-violet'],
  ['johto', 'bugsy', 'gym-azalea', 'lead-azalea'],
  ['johto', 'whitney', 'gym-goldenrod', 'lead-goldenrod'],
  ['johto', 'morty', 'gym-ecruteak', 'lead-ecruteak'],
  ['hoenn', 'roxanne', 'gym-rustboro', 'lead-rustboro'],
  ['hoenn', 'brawly', 'gym-dewford', 'lead-dewford'],
  ['hoenn', 'flannery', 'gym-lavaridge', 'lead-lavaridge'],
  ['hoenn', 'winona', 'gym-fortree', 'lead-fortree'],
  ['hoenn', 'norman', 'gym-petalburg', 'lead-petalburg'],
  ['hoenn', 'juan', 'gym-sootopolis', 'lead-sootopolis'],
  ['hoenn', 'magma_admin_npc', 'mt-chimney', 'cmd-chimney-a'],
  ['hoenn', 'aqua_admin_npc', 'mt-chimney', 'cmd-chimney-b'],
  ['sinnoh', 'roark', 'gym-oreburgh', 'lead-oreburgh'],
  ['sinnoh', 'gardenia', 'gym-eterna', 'lead-eterna'],
  ['sinnoh', 'fantina', 'gym-hearthome', 'lead-hearthome'],
  ['sinnoh', 'maylene', 'gym-veilstone', 'lead-veilstone'],
  ['sinnoh', 'wake', 'gym-pastoria', 'lead-pastoria'],
  ['sinnoh', 'byron', 'gym-canalave', 'lead-canalave'],
  ['sinnoh', 'candice', 'gym-snowpoint', 'lead-snowpoint'],
  ['sinnoh', 'volkner', 'gym-sunnyshore', 'lead-sunnyshore'],
  ['sinnoh', 'mars', 'valley-windworks', 'cmd-windworks'],
  ['sinnoh', 'jupiter', 'galactic-eterna', 'cmd-eterna'],
  ['sinnoh', 'saturn', 'galactic-hq', 'cmd-hq'],
];
const castDesigns = new Map();
for (const [field, slug, map, kind] of CAST23) {
  const post = posts.find((n) => n.map === map && n[field] === slug);
  ok(!!post, `L2 post exists: ${slug} @ ${map}`);
  if (!post) continue;
  ok(npcArtKind(post) === kind, `L2 ${slug} @ ${map} carries kind ${kind} (got ${npcArtKind(post)})`);
  const dk = designKey(post);
  ok(!!dk, `L2 ${slug} @ ${map} resolves a kit-cast variant`);
  if (dk) {
    ok(!castDesigns.has(dk), `L2 design distinct: ${slug} @ ${map} vs ${castDesigns.get(dk)}`);
    castDesigns.set(dk, `${slug} @ ${map}`);
  }
}
ok(castDesigns.size === 23, `L2: 23 distinct cast designs (got ${castDesigns.size})`);

// ---------- L3: the wider posted boss set ----------
const bossDesigns = new Map(castDesigns);
const bossSeen = new Set();
const addBoss = (n, label) => {
  if (bossSeen.has(n)) return;
  bossSeen.add(n);
  const dk = designKey(n);
  ok(!!dk, `L3 ${label} resolves a kit-cast variant`);
  if (!dk) return;
  ok(!bossDesigns.has(dk), `L3 design distinct: ${label} vs ${bossDesigns.get(dk)}`);
  bossDesigns.set(dk, label);
};
// Kanto named kinds standing in gym / league maps
for (const n of posts) {
  if (!/^(gym-|league$)/.test(n.map)) continue;
  const kind = npcArtKind(n);
  if (NPC_NAMED_KINDS.has(kind) && !CAST23.some(([, , m, k]) => m === n.map && k === kind))
    addBoss(n, `${n.name} @ ${n.map} (${kind})`);
}
// Remaining leaders on generic kinds + Steven's story post, by slug
const EXTRA = [
  ['johto', 'chuck', 'gym-cianwood'], ['johto', 'jasmine', 'gym-olivine'],
  ['johto', 'pryce', 'gym-mahogany'], ['johto', 'clair', 'gym-blackthorn'],
  ['hoenn', 'wattson', 'gym-mauville'], ['hoenn', 'tate_liza', 'gym-mossdeep'],
  ['hoenn', 'liza_flavor', 'gym-mossdeep'], ['hoenn', 'steven', 'mossdeep'],
];
for (const [field, slug, map] of EXTRA) {
  const post = posts.find((n) => n.map === map && n[field] === slug);
  ok(!!post, `L3 post exists: ${slug} @ ${map}`);
  if (post) addBoss(post, `${slug} @ ${map} (${npcArtKind(post)})`);
}
for (const b of brainPosts) addBoss(b, `frontier brain ${b._brain} @ ${b.map} (${b.art})`);

// ---------- L4: battle side ----------
const TRAINERS = { ...JOHTO_TRAINERS, ...HOENN_TRAINERS, ...SINNOH_TRAINERS, ...ORANGE_TRAINERS };
const BATTLE_IDS = [
  'falkner', 'bugsy', 'whitney', 'morty', 'chuck', 'jasmine', 'pryce', 'clair',
  'roxanne', 'brawly', 'wattson', 'norman', 'flannery', 'winona', 'tate', 'liza', 'juan',
  'roark', 'gardenia', 'fantina', 'maylene', 'wake', 'byron', 'candice', 'volkner',
  'mars_windworks', 'jupiter_eterna', 'saturn_hq',
  'magma_admin_chimney', 'aqua_admin_chimney', 'magma_admin_pyre', 'magma_admin_hideout',
  'aqua_admin_institute', 'aqua_admin_hideout', 'maxie', 'archie', 'cyrus_spear', 'cyrus_final',
  'drake',
  'frontier-brain-pike-silver', 'frontier-brain-pike-gold',
  'frontier-brain-pyramid-silver', 'frontier-brain-pyramid-gold',
  // regression: the pre-existing named cast keeps its figures
  'brock', 'misty', 'surge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni',
  'lorelei', 'bruno', 'agatha', 'lance', 'gary_champion',
];
const figRaster = new Map();
for (const id of BATTLE_IDS) {
  const t = TRAINERS[id];
  const probe = t ? { id, name: t.name, title: t.title } : { id, name: '', title: '' };
  const res = trainerArtKind(probe);
  ok(!!(res && res.named), `L4 ${id} resolves to a named figure (got ${JSON.stringify(res)})`);
  if (!res || !res.named) continue;
  const base = materializeArt(res.named + '-battle');
  ok(!!base, `L4 ${id}: figure ${res.named}-battle materializes`);
  ok(!!materializeArt(res.named + '-battle-throw'), `L4 ${id}: throw pose materializes`);
  ok(!!materializeArt(res.named + '-battle-defeat'), `L4 ${id}: defeat pose materializes`);
  if (base && !figRaster.has(res.named)) figRaster.set(res.named, base);
}
let minDiff = Infinity, minPair = null;
const figs = [...figRaster.entries()];
for (let i = 0; i < figs.length; i++) for (let j = i + 1; j < figs.length; j++) {
  const [ia, a] = figs[i], [ib, b] = figs[j];
  let d = 0;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    const ca = a.rows[y][x] === '.' ? '.' : a.pal[a.rows[y][x]];
    const cb = b.rows[y][x] === '.' ? '.' : b.pal[b.rows[y][x]];
    if (ca !== cb) d++;
  }
  if (d < minDiff) { minDiff = d; minPair = [ia, ib]; }
}
ok(minDiff >= 100, `L4: min pairwise figure diff ${minDiff} px (${(minPair || []).join(' vs ')}) >= 100`);

console.log(`leader-cast census: ${l1Checked} posts · L2 cast designs ${castDesigns.size}/23 · L3 boss designs ${bossDesigns.size} · L4 figures ${figRaster.size}, min diff ${minDiff}px`);
for (const f of failures.slice(0, 20)) console.log('FAIL', f);
console.log(`leader-cast-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
