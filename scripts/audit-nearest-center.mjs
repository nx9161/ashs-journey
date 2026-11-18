// audit-nearest-center.mjs — nearest-Center blackout regression guard
// (2026-11-17, owner rule: "on blackout the player goes to the NEAREST
// Center on the map from where he is right now").
//
// The defect class: both blackout paths anchored through the
// last-visited lineage (centerExit), so passing a town without
// entering its Center meant a blackout carried the player back past
// it to the last Center he HAD entered — the owner's Route 2 wipe
// respawned him in Dawnwick, past Fernmere. Blackouts now resolve
// through src/game/nearest-center.mjs (directed warp-graph BFS,
// crossings cost). This audit pins the resolver against the shipped
// data so the class cannot recur:
//   (1) the Center-town census is exactly 64 (a town qualifies iff it
//       fields a warp into 'center' carrying a `via` on itself);
//   (2) from EVERY map's resolved start, the resolver terminates at
//       an anchor that is a real Center door-front of a Center town,
//       on standable ground — or the map is one of the twelve known
//       warp-unreachable maps (event/ferry-linked; the runtime falls
//       back to the last-visited lineage there, by design);
//   (3) the owner's geography: Route 2 south -> Fernmere, Route 2
//       north -> Flintridge, Route 1 north -> Fernmere, Route 1
//       south -> Dawnwick (its own Center), the Preserve -> Bramble,
//       and a far last-visited Center never overrides a near faint.
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
import { nearestCenterAnchor, centerDoorsOf, isCenterTown } from '../src/game/nearest-center.mjs';
import { resolveStartPos, isStartStandable } from '../src/game/start-pos.mjs';

const failures = [];
const fail = (msg) => failures.push(msg);

// Maps with NO directed warp path to any Center town (reached via
// dive/ferry/facility event flows, not warps). The runtime fallback
// (last-visited, then home) covers them; a NEW entry here fails this
// audit, and one of these gaining a warp path must be struck from
// the list deliberately.
const KNOWN_UNREACHABLE = [
  'r124-underwater', 'r126-underwater', 'r127-underwater', 'r128-underwater',
  'seafloor-cavern', 'frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c',
  'iron-island', 'iron-island-mine', 'fullmoon-island', 'newmoon-island',
];

// (1) Census.
const towns = Object.keys(MAPS).filter((id) => MAPS[id].rows && isCenterTown(MAPS, id));
if (towns.length !== 64) fail(`center-town census ${towns.length}, expected 64`);

// (2) Every map resolves to a valid door-front, or is known-unreachable.
let resolved = 0;
const unreachable = [];
for (const [id, m] of Object.entries(MAPS)) {
  if (!m.rows || !m.rows.length) continue;
  const s = resolveStartPos(m, null);
  const a = nearestCenterAnchor(id, s.x, s.y, null);
  if (!a) { unreachable.push(id); continue; }
  resolved++;
  if (!isCenterTown(MAPS, a.town)) { fail(`${id}: anchor town ${a.town} is not a Center town`); continue; }
  const vias = centerDoorsOf(MAPS[a.town]).map((d) => d.via.x + ',' + d.via.y);
  if (a.map !== a.town || !vias.includes(a.x + ',' + a.y)) {
    fail(`${id}: anchor (${a.map} ${a.x},${a.y}) is not a Center door-front of ${a.town}`);
    continue;
  }
  if (!isStartStandable(MAPS[a.town], a.x, a.y)) fail(`${id}: anchor (${a.x},${a.y}) on ${a.town} not standable`);
}
const unreachSorted = [...unreachable].sort();
const knownSorted = [...KNOWN_UNREACHABLE].sort();
if (JSON.stringify(unreachSorted) !== JSON.stringify(knownSorted)) {
  fail(`unreachable set drift: got [${unreachSorted.join(', ')}], expected [${knownSorted.join(', ')}]`);
}

// (3) Owner geography pins.
const pin = (label, got, town) => {
  if (!got || got.town !== town) fail(`${label}: resolved ${got ? got.town : 'null'}, expected ${town}`);
};
pin('route2 south (the owner scenario)', nearestCenterAnchor('route2', 5, 9, null), 'viridian');
pin('route2 north', nearestCenterAnchor('route2', 7, 2, null), 'pewter');
pin('route1 north', nearestCenterAnchor('route1', 7, 3, null), 'viridian');
pin('route1 south', nearestCenterAnchor('route1', 7, 13, null), 'pallet');
pin('preserve', nearestCenterAnchor('safari', 8, 11, null), 'fuchsia');
pin('route15 with a Caldera lastCenter', nearestCenterAnchor('route15', 10, 5, { map: 'cinnabar', x: 3, y: 11 }), 'fuchsia');
pin('gym interior', nearestCenterAnchor('gym', 5, 5, null), 'pewter');
pin('crown road', nearestCenterAnchor('victoryroad', 9, 5, null), 'indigo');
// The E05 preservation: a last-Center town that IS among the nearest
// keeps its exact persisted door-front.
{
  const a = nearestCenterAnchor('route2', 7, 8, { map: 'viridian', x: 7, y: 8 });
  if (!a || a.map !== 'viridian' || a.x !== 7 || a.y !== 8) {
    fail(`lastCenter tie preservation: got ${JSON.stringify(a)}, expected viridian (7,8)`);
  }
}

console.log(`nearest-center audit: ${towns.length} center towns · ${resolved} maps resolved · ${unreachable.length} known-unreachable`);
console.log('nearest-center failures:', failures.length);
for (const f of failures) console.log('  FAIL', f);
process.exit(failures.length ? 1 : 0);
