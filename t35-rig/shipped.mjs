// T35 shipped-gates probe: lilycove exactly as shipped, real audit code.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t35/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor } from '/home/hatch/workspace/ashs-journey-t35/scripts/audit-placement.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const tiers = makeTiers(TILE_CHARS);
const clarity0 = analyzeMap('lilycove', MAPS.lilycove, { WALKABLE, tiers, townSet: townSetOf(MAPS) });
const r = await scoreTown('lilycove', MAPS, WALKABLE, tiersFor('lilycove', tiers));
const gate = gateCheck(r, clarity0);
console.log('GATE:', JSON.stringify(gate));
console.log('examples:', JSON.stringify(r.examples));
console.log('junctionSites:', JSON.stringify(r.junctionSites), 'junctions:', r.junctions, 'bare:', r.junctionsBare);
console.log('GUARD TUPLE:', JSON.stringify([gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot, r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged, r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny, +clarity0.meanStrict.toFixed(4), +clarity0.meanFabric.toFixed(4)]));
console.log('lamps:', r.lamps, 'unlit:', r.unlitFrac);
console.log('buildings:', JSON.stringify(r.buildings));
