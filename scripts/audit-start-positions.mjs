// audit-start-positions.mjs — start-position regression guard
// (2026-11-17, the Preserve softlock): every map's resolved start —
// authored, or resolved through the shipped resolver — must be
// in-bounds and standable, and every flow that places the player by
// a start (Preserve/Marsh gates, zone-hub bounce, safari exit, Fly)
// must land on authored, valid ground.
//
// The bug this guards: `safari` defined no start, and the warden's
// gate fell back to a hardcoded {x:10,y:17} — 3 rows below the 20x14
// map. The player spawned in the void: invisible, immovable, the
// session counter frozen, Continue restoring the trap. All start
// resolution now routes through src/game/start-pos.mjs
// (resolveStartPos), which validates every candidate; this audit
// pins the data + the routing so the class cannot recur.
import { readFileSync, readdirSync } from 'node:fs';
import { MAPS, WALKABLE } from '../src/data/maps.mjs';
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
import { MAPS4 } from '../src/data/maps4.mjs';
import { MAPS5 } from '../src/data/maps5.mjs';
import { MAPS6 } from '../src/data/maps6.mjs';
import { MAPS7 } from '../src/data/maps7.mjs';
import { MAPS8 } from '../src/data/maps8.mjs';
import { MAPS9 } from '../src/data/maps9.mjs';
Object.assign(MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8, MAPS9);
import { W6_WALKABLE_CHARS } from '../src/engine/tiles.mjs';
import { resolveStartPos, startTileAt } from '../src/game/start-pos.mjs';

const WALK = new Set([...WALKABLE, ...W6_WALKABLE_CHARS]);
const standable = (m, x, y) => {
  const t = startTileAt(m, x, y);
  return t !== ' ' && (WALK.has(t) || t === '~'); // '~': authored surf-arrival starts
};
const failures = [];
const fail = (msg) => failures.push(msg);

let mapsChecked = 0, authoredChecked = 0;
for (const [id, m] of Object.entries(MAPS)) {
  if (!m.rows || !m.rows.length) continue;
  mapsChecked++;
  // (1) An authored start must itself be in-bounds and standable.
  if (m.start) {
    authoredChecked++;
    if (!standable(m, m.start.x, m.start.y)) {
      fail(`${id}: authored start (${m.start.x},${m.start.y}) not standable (tile ${JSON.stringify(startTileAt(m, m.start.x, m.start.y))})`);
    }
  }
  // (2) The shipped resolver must return in-bounds, standable ground
  // for EVERY map — the load-time rescue and every start flow rely on it.
  const r = resolveStartPos(m, null);
  if (!standable(m, r.x, r.y)) fail(`${id}: resolveStartPos -> (${r.x},${r.y}) not standable`);
  // (3) Via landings (Fly's preferred branch) must be valid on their map.
  for (const w of m.warps || []) {
    if (!w.via) continue;
    const tm = MAPS[w.via.map];
    if (!tm) { fail(`${id}: via targets missing map ${w.via.map}`); continue; }
    if (!standable(tm, w.via.x, w.via.y)) fail(`${id}: via landing (${w.via.x},${w.via.y}) on ${w.via.map} not standable`);
  }
}

// (4) Gate entries: every safariGate NPC's entry map must exist and
// carry an authored, valid start (the gate places the player there).
let gatesChecked = 0;
for (const [id, m] of Object.entries(MAPS)) {
  for (const n of m.npcs || []) {
    if (!n.safariGate) continue;
    gatesChecked++;
    const entryId = n.safariMap || 'safari';
    const em = MAPS[entryId];
    if (!em) { fail(`${id} npc ${n.name}: safari entry map ${entryId} missing`); continue; }
    if (!em.start) fail(`${id} npc ${n.name}: safari entry map ${entryId} has NO authored start`);
    else if (!standable(em, em.start.x, em.start.y)) fail(`${id} npc ${n.name}: safari entry ${entryId} start (${em.start.x},${em.start.y}) not standable`);
    // A planted session exit must land on valid ground too.
    if (n.safariExit && typeof n.safariExit === 'object') {
      const xm = MAPS[n.safariExit.map];
      if (!xm) fail(`${id} npc ${n.name}: safari exit map ${n.safariExit.map} missing`);
      else if (!standable(xm, n.safariExit.x, n.safariExit.y)) fail(`${id} npc ${n.name}: safari exit (${n.safariExit.x},${n.safariExit.y}) on ${n.safariExit.map} not standable`);
    }
  }
}

// (5) Zone hubs (the bounce-back target) must carry authored, valid
// starts. The default safari-exit town (fuchsia) deliberately carries
// NO authored start — one would move its pinned placement-gate tuple
// (the desire-path audit counts start as a POI) — so its exit safety
// rests on the resolver: what endSafari computes for it must be a
// valid tile (this is the path whose old {10,10} fallback was a
// non-standable decor tile).
let hubsChecked = 0;
for (const [id, m] of Object.entries(MAPS)) {
  if (!m.safariHub) continue;
  hubsChecked++;
  if (!m.start) fail(`${id}: safari hub has NO authored start`);
  else if (!standable(m, m.start.x, m.start.y)) fail(`${id}: safari hub start (${m.start.x},${m.start.y}) not standable`);
}
{
  const f = MAPS.fuchsia;
  if (!f) fail('fuchsia: default safari-exit town missing');
  else {
    const r = resolveStartPos(f, null);
    if (!standable(f, r.x, r.y)) fail(`fuchsia: resolved exit landing (${r.x},${r.y}) not standable`);
  }
}

// (6) Routing tripwire: no src/game module may resolve a start with
// an inline `.start ||` fallback or the stale {10,17} literal again —
// all resolution goes through resolveStartPos.
const gameDir = new URL('../src/game/', import.meta.url);
for (const f of readdirSync(gameDir)) {
  if (!f.endsWith('.mjs')) continue;
  const src = readFileSync(new URL(f, gameDir), 'utf8');
  // Code only: comment lines (the fix's own explanatory comments cite
  // the stale literal) are not resolution paths.
  const code = src.split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  if (/\b(?:MAPS\[[^\]]+\]|hub|city)\.start\s*\|\|/.test(code)) fail(`src/game/${f}: inline .start || fallback remains`);
  if (/\{\s*x:\s*10\s*,\s*y:\s*17\s*\}/.test(code)) fail(`src/game/${f}: stale {x:10,y:17} fallback literal remains`);
}

console.log('maps checked:', mapsChecked);
console.log('authored starts validated:', authoredChecked);
console.log('safari gates validated:', gatesChecked);
console.log('safari hubs validated:', hubsChecked);
console.log('start-position failures:', failures.length);
failures.forEach((s) => console.log('  FAIL', s));
if (failures.length) process.exit(1);
console.log('START-POSITIONS AUDIT PASS');
