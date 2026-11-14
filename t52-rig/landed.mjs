// Wave T51 rig: verify the LANDED data (fresh process, real
// audit code) reproduces the validator tuple exactly.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t51/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t51/scripts/audit-placement.mjs';
const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps();
const tiers = makeTiers(TILE_CHARS);
const m = MAPS.celestic;
const r = await scoreTown('celestic', MAPS, WALKABLE, tiersFor('celestic', tiers));
const clarity = analyzeMap('celestic', m, { WALKABLE, tiers, townSet: townSetOf(MAPS) });
const gate = gateCheck(r, clarity);
const tuple = [gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot, r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged, r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny, +clarity.meanStrict.toFixed(4), +clarity.meanFabric.toFixed(4)];
console.log('LANDED TUPLE:', JSON.stringify(tuple));
const EXPECT = [1, 56, 56, 6, 6, 1, 5, 0, 0, 0.857, 0, 0, 0, 0, 0.719, 1];
if (JSON.stringify(tuple) !== JSON.stringify(EXPECT)) throw new Error('landed tuple != validator tuple');
const clerk = m.npcs.find((n) => n.name === 'MART CLERK');
if (!(clerk.x === 9 && clerk.y === 4)) throw new Error('clerk not re-seated');
if (m.signs.length !== 7) throw new Error('signs != 7');
const tg2 = m.rows.join('').split('').filter((c) => TILE_CHARS[c] === 'tg2-celestic').length;
if (tg2 !== 0) throw new Error('tg2 remains: ' + tg2);
console.log('LANDED: tuple exact, clerk (9,4), signs 7, tg2 = 0 — ALL PASS');
