// Wave T64 rig: the fabric-ceiling proof for the dossier
// (BLOCKED-FABRIC-GATE.md). Three measurements with the REAL
// audit code (analyzeMap):
//  (a) the candidate as built;
//  (b) SUPERSET: the candidate + EVERY remaining lawful ground
//      cell threaded (all sand/tropgrass/beach/psand shore and
//      ground -> stepfloor). Nothing sacred is touched: plots,
//      buildings, water, decor, signs, posts all stay. If (b)
//      still fails 0.98, no lawful grid can pass.
//  (c) PLOT-ONLY ceiling: the candidate scored with a tiers
//      wrapper that (hypothetically, measurement only) counts
//      the encounter-grass kind as fabric — isolates exactly
//      how much of the deficit the byte-preserved plots cause.
import { loadMaps, makeTiers, townSetOf, analyzeMap } from '/home/hatch/workspace/ashs-journey-t64/scripts/audit-desire-paths.mjs';
import { CANDIDATE, COPY_SEATS } from './rows.mjs';

const { MAPS, WALKABLE, TILE_CHARS } = await loadMaps(false);
const src = MAPS['shamouti'];
const CH = {}; for (const [ch, k] of Object.entries(TILE_CHARS)) CH[k] = ch;
const DIRS_TEXT = src.signs.find((s) => s.x === 8 && s.y === 7).text;
const npcs = src.npcs.map((n) => (n.name === 'MART CLERK' ? { ...n, x: 19, y: 4 } : n));
const signs = [...src.signs, ...COPY_SEATS.map(([x, y]) => ({ x, y, text: DIRS_TEXT }))];
const tiers = makeTiers(TILE_CHARS);
const townSet = townSetOf(MAPS);
const score = (rows, t) => analyzeMap('shamouti', { ...src, rows, npcs, signs }, { WALKABLE, tiers: t, townSet }).meanFabric;

console.log('(a) candidate as built:        ', score(CANDIDATE, tiers).toFixed(4));

const GROUND = new Set(['sand', 'tropgrass', 'beach-n', 'beach-s', 'beach-e', 'beach-w', 'beach-ne', 'beach-nw', 'beach-se', 'beach-sw', 'beach-ns', 'beach-ew', 'psand-n', 'psand-s', 'psand-e', 'psand-w', 'psand-ns', 'psand-ew']);
const sup = CANDIDATE.map((r) => [...r].map((ch) => (GROUND.has(TILE_CHARS[ch]) ? CH['stepfloor'] : ch)).join(''));
console.log('(b) superset (all lawful ground threaded):', score(sup, tiers).toFixed(4));

const tiersPlot = { ...tiers, isFabric: (ch) => tiers.isFabric(ch) || TILE_CHARS[ch] === 'grass' };
console.log('(c) candidate + plots counted fabric (hypothetical):', score(CANDIDATE, tiersPlot).toFixed(4));
console.log('(b+c) superset + plots counted:', score(sup, tiersPlot).toFixed(4));
