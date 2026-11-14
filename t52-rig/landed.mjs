// Wave T52 rig: verify the LANDED data (fresh process, real
// audit code) reproduces the validator tuple exactly.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t52/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t52/scripts/audit-placement.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(true);
const tiers = makeTiers(TILE_CHARS);
const towns = townSetOf(MAPS);
const m = MAPS['snowpoint'];
const EXPECTED = [1, 90, 90, 8, 8, 1, 5, 0, 0, 0.813, 0, 0, 0, 0, 0.773, 0.9959];
const r = await scoreTown('snowpoint', MAPS, WALKABLE, tiersFor('snowpoint', tiers));
const clarity = analyzeMap('snowpoint', m, { WALKABLE, tiers, townSet: towns });
const gate = gateCheck(r, clarity);
const tuple = [gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot,
  r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged,
  r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny,
  +clarity.meanStrict.toFixed(4), +clarity.meanFabric.toFixed(4)];
console.log('landed tuple:  ', JSON.stringify(tuple));
console.log('expected tuple:', JSON.stringify(EXPECTED));
const signs = m.signs.length;
const tg2 = m.rows.join('').split('').filter((c) => TILE_CHARS[c] === 'tg2-snowpoint').length;
const clerk = m.npcs.find((n) => n.name === 'MART CLERK');
console.log('signs:', signs, '| tg2 cells:', tg2, '| clerk at', clerk.x + ',' + clerk.y);
const match = JSON.stringify(tuple) === JSON.stringify(EXPECTED) && signs === 8 && tg2 === 0 && clerk.x === 9 && clerk.y === 4;
console.log(match ? 'LANDED == VALIDATED' : 'MISMATCH');
process.exit(match ? 0 : 1);
