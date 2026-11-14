// T64 shipped-gates probe: shamouti exactly as shipped, real audit code.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';
import { scoreTown, gateCheck, tiersFor, STREET_REGISTRY } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-placement.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const tiers = makeTiers(TILE_CHARS);
const clarity0 = analyzeMap('shamouti', MAPS['shamouti'], { WALKABLE, tiers, townSet: townSetOf(MAPS) });
const r = await scoreTown('shamouti', MAPS, WALKABLE, tiersFor('shamouti', tiers));
const gate = gateCheck(r, clarity0);
console.log('GATE:', JSON.stringify(gate));
console.log('examples:', JSON.stringify(r.examples));
console.log('connFails:', JSON.stringify(r.connFails));
console.log('junctionSites:', JSON.stringify(r.junctionSites), 'junctions:', r.junctions, 'bare:', r.junctionsBare);
console.log('GUARD TUPLE:', JSON.stringify([gate.pass ? 1 : 0, r.connOk, r.connPairs, r.stepTouch, r.stepTot, r.netComponents, r.junctions, r.junctionsBare, r.apronLow, +r.apronMin.toFixed(4), r.merged, r.onFabric || 0, r.shoulderOrphans || 0, r.unanchoredAny, +clarity0.meanStrict.toFixed(4), +clarity0.meanFabric.toFixed(4)]));
console.log('netCompSizes:', JSON.stringify(r.netCompSizes));
console.log('lamps:', r.lamps, 'unlit:', r.unlitFrac, 'onFabric:', JSON.stringify(r.onFabricList), 'shoulder:', JSON.stringify(r.shoulderList));
console.log('STREET_REGISTRY shamouti:', JSON.stringify(STREET_REGISTRY.shamouti));
console.log('buildings:', r.buildings.length, 'apronMin:', r.apronMin, 'apronLow:', r.apronLow);
