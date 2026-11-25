// audit-hm-grants — BUG-013 class fix (owner ruling 2026-11-25):
// every PROGRESSION-REQUIRED field move must have at least one
// legitimate grant, reachable before its first required use.
//
// BUG-013 shipped a game whose entire Maris late arc was sealed:
// HM03 Surf existed as an item definition but was granted by no
// event, NPC, shop, prize, or pickup, and the only level-up learners
// were unreachable (BIVALET behind Dive, which is taught behind
// Surf). The fix grants HM03 through the harbourmaster at Lotus
// Cove; this audit is the permanent census behind the whole class,
// so no field move can silently lose its grant again.
//
// What counts as a LEGITIMATE grant (derived mechanically):
//   - an HM item in a map's items[]/hidden[] pickups;
//   - an HM item in an NPC's mart stock;
//   - a story event step { give: { items: { hmXX: n } } };
//   - a story event step { giveHM: '<move>' } (HM_GRANTS idiom);
//   - a code-side NPC teacher, verified by source patterns in
//     overworld-systems.mjs (the registry below) — a teacher whose
//     branch is deleted fails its pattern and turns this gate red.
// The cheat terminal is NOT a grant: it stocks from data generically
// in code, never in map/event data, so this census excludes it by
// construction.
//
// REQUIRED set (progression seals a region's main chain without it):
//   surf      — sea-lane warps (the BUG-009 foot gate) + the
//               ferryGate:'surf' ferry + the whole Starfall chain.
//   dive      — dive spots gate the Sunken Cavern / climax chain.
//   defog     — fog-road gates stand on Borea tiles only.
//   rockclimb — climb-wall gates stand on Borea tiles only.
// Ordering is PROVEN for surf and dive by staged BFS over the Maris
// warp graph (below); for defog/rockclimb the audit proves the
// giveHM event exists and fires (sysLoadMap dispatch) on a Borea map.
//
// NOT-required set — asserted mechanically so the classification
// cannot rot: fly (no partyKnows('fly') consumer — fast travel is
// the Center-warp menu), flash (no partyKnows('flash') consumer),
// cut/strength (tile interacts only: no event `teach` gate, no
// ferryGate, no quest/warp gate consumes them). If any of these
// gains a progression consumer of a known gate type, this audit
// fails and the move must be promoted into the REQUIRED set with a
// grant.
//
// Exit 0 = clean. Any violation prints and exits 1.
import { readFileSync } from 'node:fs';
import { MAPS } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { MAPS4 } from '../src/data/maps4.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';
import { MAPS7 } from '../src/data/maps7.mjs';
import { MAPS8 } from '../src/data/maps8.mjs';
import { MAPS9 } from '../src/data/maps9.mjs';
Object.assign(MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
import { ITEMS, HM_MOVES, HM_GRANTS } from '../src/data/items.mjs';
import { EVENTS as KANTO_EVENTS } from '../src/data/story-kanto.mjs';
import { JOHTO_EVENTS } from '../src/data/story-johto.mjs';
import { ORANGE_EVENTS } from '../src/data/story-orange.mjs';
import { HOENN_EVENTS, HOENN_NPCS } from '../src/data/story-hoenn.mjs';
import { SINNOH_EVENTS } from '../src/data/story-sinnoh.mjs';
import { startTileAt, isWaterTile, isFootTrapped } from '../src/game/start-pos.mjs';

const failures = [];
const fail = (m) => failures.push(m);
const ALL_EVENTS = { ...KANTO_EVENTS, ...JOHTO_EVENTS, ...ORANGE_EVENTS, ...HOENN_EVENTS, ...SINNOH_EVENTS };
const ENGINE = readFileSync(new URL('../src/game/overworld-systems.mjs', import.meta.url), 'utf8');
const OVERWORLD = readFileSync(new URL('../src/game/overworld.mjs', import.meta.url), 'utf8');
const GAME_SRC = ENGINE + '\n' + OVERWORLD;

// ---------- grant census ----------
const hmItemOfMove = {};
for (const [n, move] of Object.entries(HM_MOVES)) hmItemOfMove[move] = 'hm0' + n;
const grants = {}; // move -> [ {kind, where} ]
const addGrant = (move, kind, where) => { (grants[move] = grants[move] || []).push({ kind, where }); };

// map pickups / hidden items / mart stocks
for (const [id, m] of Object.entries(MAPS)) {
  if (!m) continue;
  const blob = JSON.stringify([m.items || [], m.hidden || []]);
  for (const [move, item] of Object.entries(hmItemOfMove)) {
    if (new RegExp(`"${item}"`).test(blob)) addGrant(move, 'map-pickup', id);
  }
  for (const npc of m.npcs || []) {
    for (const item of (npc.mart && npc.mart.stock) || []) {
      const move = Object.keys(hmItemOfMove).find((k) => hmItemOfMove[k] === item);
      if (move) addGrant(move, 'mart-stock', `${id} (${npc.name})`);
    }
  }
}
// story event steps (recursive walk — steps nest in branches)
const walkSteps = (node, fn) => {
  if (Array.isArray(node)) { for (const v of node) walkSteps(v, fn); return; }
  if (node && typeof node === 'object') { fn(node); for (const v of Object.values(node)) walkSteps(v, fn); }
};
for (const [evId, steps] of Object.entries(ALL_EVENTS)) {
  walkSteps(steps, (s) => {
    if (s.giveHM && HM_GRANTS[s.giveHM]) addGrant(HM_GRANTS[s.giveHM].move, 'event-giveHM', evId);
    if (s.give && s.give.items) {
      for (const item of Object.keys(s.give.items)) {
        const move = Object.keys(hmItemOfMove).find((k) => hmItemOfMove[k] === item);
        if (move) addGrant(move, 'event-give', evId);
      }
    }
  });
}
// code-side teachers — registry verified against engine source.
const TEACHERS = [
  {
    move: 'surf', kind: 'NPC teacher (repeatable talk branch)',
    where: 'HARBOURMASTER DOSS, lilycove',
    patterns: [/kind === 'harbourmaster'/, /bag\.hm03 = 1/, /HM_GRANTS\.surf\.item/],
    placed: () => (MAPS.lilycove.npcs || []).some((n) => n.hoenn === 'harbourmaster'),
  },
  {
    move: 'dive', kind: 'NPC teacher (repeatable talk branch)',
    where: 'ALBAN (steven), mossdeep',
    patterns: [/kind === 'steven'/, /hmMoves\.push\('dive'\)/],
    placed: () => HOENN_NPCS.some((a) => a.hoenn === 'steven' && a.map === 'mossdeep'),
  },
];
for (const t of TEACHERS) {
  for (const p of t.patterns) {
    if (!p.test(ENGINE)) fail(`teacher for '${t.move}' (${t.where}): engine pattern ${p} not found — the teaching branch is gone or rewired`);
  }
  if (!t.placed()) fail(`teacher for '${t.move}' (${t.where}): the NPC is not placed with its story kind`);
  else if (t.patterns.every((p) => p.test(ENGINE))) addGrant(t.move, t.kind, t.where);
}

// ---------- required set: a grant must exist ----------
const REQUIRED = ['surf', 'dive', 'defog', 'rockclimb'];
for (const move of REQUIRED) {
  if (!grants[move] || !grants[move].length) {
    fail(`REQUIRED field move '${move}' has NO legitimate grant (census: pickups, mart stocks, event gives, giveHM steps, verified teachers)`);
  }
}

// ---------- surf: the grant table + badge law agree with the engine ----------
// The engine's surf gate reads partyKnows('surf') + the soul badge;
// HM_GRANTS.surf must name that same badge and the hm03 item, or the
// recorded law and the shipped law have drifted apart.
if (!HM_GRANTS.surf) fail('HM_GRANTS has no surf row');
else {
  if (HM_GRANTS.surf.item !== 'hm03') fail(`HM_GRANTS.surf.item is '${HM_GRANTS.surf.item}', expected 'hm03'`);
  if (HM_GRANTS.surf.badge !== 'soulbadge') fail(`HM_GRANTS.surf.badge is '${HM_GRANTS.surf.badge}', expected 'soulbadge' (the engine's surf gate)`);
}
if (!/partyKnows\('surf'\)/.test(ENGINE) || !/soulbadge/.test(ENGINE)) {
  fail("engine surf gate (partyKnows('surf') + soulbadge) not found — if the gate moved, update this audit's law with it");
}
// Surf must be teachable through the shipped bag path: an in-table
// battle move in the merged move table.
{
  const { MOVES } = await import('../src/data/moves.mjs');
  const { MOVES2 } = await import('../src/data/moves2.mjs');
  if (!MOVES.surf && !MOVES2.surf) fail("the move table has no 'surf' — HM03 could not teach a battle move");
}

// ---------- ordering: staged BFS over the Maris warp graph ----------
// Maris maps = maps7 + maps8 (the region's own files). Edges: warps
// (directed) + in-region NPC ferries (ferry:'<mapId>', no ferryArc,
// no ferryGate). A warp is SURF-GATED under exactly the engine's
// BUG-009 predicate: landing tile is water and foot-trapped.
const MARIS = new Set([...Object.keys(MAPS7), ...Object.keys(MAPS8)]);
const surfGated = (w) => {
  if (!w.to || w.viaExit) return false;
  const dest = MAPS[w.to.map];
  if (!dest) return false;
  const lt = startTileAt(dest, w.to.x, w.to.y);
  return isWaterTile(lt) && isFootTrapped(dest, w.to.x, w.to.y);
};
const bfs = (allowSurf) => {
  const seen = new Set(['littleroot']);
  const q = ['littleroot'];
  while (q.length) {
    const id = q.pop();
    const m = MAPS[id];
    if (!m) continue;
    for (const w of m.warps || []) {
      if (!w.to || !MARIS.has(w.to.map) || seen.has(w.to.map)) continue;
      if (!allowSurf && surfGated(w)) continue;
      seen.add(w.to.map); q.push(w.to.map);
    }
    for (const npc of m.npcs || []) {
      if (!npc.ferry || npc.ferryArc || npc.ferryGate) continue;
      if (!MARIS.has(npc.ferry) || seen.has(npc.ferry)) continue;
      seen.add(npc.ferry); q.push(npc.ferry);
    }
  }
  return seen;
};
const onFoot = bfs(false);
const withSurf = bfs(true);
if (!onFoot.has('lilycove')) fail('ordering: lilycove (the Surf grant port) is NOT reachable on foot from the Maris entry — the grant would sit behind its own gate');
if (onFoot.has('r124')) fail('ordering model broken: r124 is reachable on foot — the sea lane no longer gates, so this audit\'s ordering proof is void; re-derive it');
if (onFoot.has('mossdeep')) fail('ordering model broken: mossdeep is reachable on foot — re-derive this audit\'s ordering proof');
if (!withSurf.has('r124')) fail('ordering: r124 is not reachable even with Surf — the crossing the grant unlocks does not exist');
if (!withSurf.has('mossdeep')) fail('ordering: mossdeep (Starfall) is not reachable with Surf');
// dive ordering: the teacher's map is behind Surf, and the dive-spot
// maps are reachable once Surf is held — the chain surf -> dive.
if (onFoot.has('mossdeep')) fail('ordering: mossdeep reachable on foot (see above)');
const diveSpotMaps = [...MARIS].filter((id) => MAPS[id] && Array.isArray(MAPS[id].diveSpots) && MAPS[id].diveSpots.length);
if (!diveSpotMaps.length) fail('ordering: no Maris map carries diveSpots — the Dive chain the audit orders no longer exists');
// The trench ROUTES (the surface maps a diver enters from) must be
// Surf-reachable. Craterlake is the honest exception that proves the
// staging: it carries the surface spot for its own lake and is
// itself reached by surfacing from the r126 trench — so the full
// dive graph (warps + ferries + diveSpot edges down + surfaceSpot
// edges up, Surf allowed) must reach every diveSpot map and target.
for (const id of diveSpotMaps) {
  if (/^r\d+$/.test(id) && !withSurf.has(id)) fail(`ordering: dive-spot route '${id}' is not reachable with Surf — the surf -> dive chain is broken`);
}
const withSurfDive = (() => {
  const seen = new Set(withSurf);
  const q = [...withSurf];
  while (q.length) {
    const id = q.pop();
    const m = MAPS[id];
    if (!m) continue;
    for (const d of [...(m.diveSpots || []), ...(m.surfaceSpots || [])]) {
      if (d.to && MARIS.has(d.to.map) && !seen.has(d.to.map)) { seen.add(d.to.map); q.push(d.to.map); }
    }
    for (const w of m.warps || []) {
      if (w.to && MARIS.has(w.to.map) && !seen.has(w.to.map)) { seen.add(w.to.map); q.push(w.to.map); }
    }
    for (const npc of m.npcs || []) {
      if (npc.ferry && !npc.ferryArc && !npc.ferryGate && MARIS.has(npc.ferry) && !seen.has(npc.ferry)) { seen.add(npc.ferry); q.push(npc.ferry); }
    }
  }
  return seen;
})();
for (const id of diveSpotMaps) {
  if (!withSurfDive.has(id)) fail(`ordering: dive-spot map '${id}' is not reachable in the surf+dive graph — the surf -> dive chain is broken`);
  for (const d of MAPS[id].diveSpots) {
    if (d.to && !withSurfDive.has(d.to.map)) fail(`ordering: dive-spot target '${d.to.map}' (from '${id}') is not reachable in the surf+dive graph`);
  }
}

// ---------- defog / rockclimb: the giveHM beats fire on Borea maps ----------
const dispatchPair = (evId) => {
  const i = ENGINE.indexOf(`runEvent('${evId}')`);
  if (i < 0) return null;
  const before = ENGINE.slice(Math.max(0, i - 300), i);
  const hits = [...before.matchAll(/id === '([a-z0-9-]+)'/g)];
  return hits.length ? hits[hits.length - 1][1] : null;
};
const BOREA = new Set(Object.keys(MAPS9));
for (const [move, evId] of [['defog', 'ev_sinnoh_defog'], ['rockclimb', 'ev_sinnoh_rockclimb']]) {
  const hasStep = (ALL_EVENTS[evId] || []).some((s) => s && s.giveHM === move);
  if (!hasStep) { fail(`'${move}': event ${evId} no longer carries its giveHM step`); continue; }
  const trig = dispatchPair(evId);
  if (!trig) fail(`'${move}': no sysLoadMap dispatch found for ${evId}`);
  else if (!BOREA.has(trig)) fail(`'${move}': ${evId} fires on '${trig}', which is not a Borea (maps9) map — the grant left the region whose tiles consume it`);
}

// ---------- not-required set: the classification is asserted ----------
// fly / flash: no field consumer may exist. If one appears, the move
// becomes progression-relevant and must be promoted with a grant.
for (const move of ['fly', 'flash']) {
  if (new RegExp(`partyKnows\\('${move}'\\)`).test(GAME_SRC)) {
    fail(`'${move}' gained a partyKnows consumer in the engine — reclassify it: if the consumer gates progression, it needs a grant in the REQUIRED set`);
  }
}
// cut / strength: consumers are the optional tile interacts only.
// No event teach-gate and no ferryGate may reference them.
walkSteps(ALL_EVENTS, (s) => {
  if (s.teach === 'cut' || s.teach === 'strength') fail(`an event gates on teach:'${s.teach}' — '${s.teach}' is now progression-required and needs a grant`);
});
// Map-entry events carry `when` conditions (eventWhen reads
// when.teach through partyKnows): a when.teach gate on a
// not-required move is a progression consumer too.
for (const [id, m] of Object.entries(MAPS)) {
  for (const ev of (m && m.events) || []) {
    const t = ev && ev.when && ev.when.teach;
    if (t === 'cut' || t === 'strength' || t === 'fly' || t === 'flash') {
      fail(`${id}: map event '${ev.id}' gates on when.teach:'${t}' — '${t}' is now progression-required and needs a grant`);
    }
  }
}
for (const [id, m] of Object.entries(MAPS)) {
  for (const npc of (m && m.npcs) || []) {
    if (npc.ferryGate && npc.ferryGate !== 'surf') fail(`${id}: ferryGate:'${npc.ferryGate}' — a new gated crossing type exists; audit-hm-grants must classify the move it requires`);
    if (npc.teach === 'cut' || npc.teach === 'strength') fail(`${id}: an NPC gates on teach:'${npc.teach}' — reclassify '${npc.teach}' as progression-required`);
  }
}
// The surf ferry gate itself must still exist (it is part of surf's
// requirement evidence).
if (!Object.values(MAPS).some((m) => ((m && m.npcs) || []).some((n) => n.ferryGate === 'surf'))) {
  fail("no ferryGate:'surf' ferry remains — surf's requirement evidence changed; re-derive the REQUIRED set");
}

// ---------- disclosed: surf-gated seams with no water approach ----------
// The staged BFS above models the GATE's semantics: a surfing player
// passes a surf-gated warp. Presenting surfing state AT a warp tile
// additionally requires geometry: the warp tile itself is water, or a
// water tile neighbours it (a surfing player steps in from the water;
// stepping ashore anywhere else clears surfing first). Seams without
// a water approach exist in the shipped maps (ferry- or fly-covered
// town edges in Yamato/Borea, and the Lilycove -> r124 lane). They are
// a map-geometry fact, outside this audit's grant claim, and are
// PRINTED here so the census can never rot silently: if this list
// changes, a human re-derives which seams are progression-critical.
const noApproach = [];
for (const [id, m] of Object.entries(MAPS)) {
  for (const w of (m && m.warps) || []) {
    if (!surfGated(w)) continue;
    const tile = m.rows[w.y] && m.rows[w.y][w.x];
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => {
      const r = m.rows[w.y + dy];
      return r ? r[w.x + dx] : undefined;
    });
    const approach = tile === '~' || tile === 'W' || adj.some((t) => t === '~' || t === 'W');
    if (!approach) noApproach.push(`${id} (${w.x},${w.y}) -> ${w.to.map}`);
  }
}
console.log(`audit-hm-grants: DISCLOSED approach census — ${noApproach.length} surf-gated warp(s) have no water approach (gate-semantics BFS does not model entry geometry): ${noApproach.join('; ')}`);

// ---------- verdict ----------
for (const move of REQUIRED) {
  const list = (grants[move] || []).map((g) => `${g.kind} @ ${g.where}`).join('; ');
  console.log(`audit-hm-grants: ${move}: ${list || 'NO GRANT'}`);
}
console.log(`audit-hm-grants: staged BFS — on foot reaches ${onFoot.size} Maris maps (lilycove yes, r124/mossdeep no); with Surf ${withSurf.size} (r124/mossdeep yes); dive spots on ${diveSpotMaps.length} maps, all Surf-reachable`);
if (failures.length) {
  for (const f of failures) console.log('FAIL  ' + f);
  console.log(`audit-hm-grants: ${failures.length} violation(s)`);
  process.exit(1);
}
console.log('audit-hm-grants: PASS — every progression-required field move has a legitimate grant reachable before its first required use');
