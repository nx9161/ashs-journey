// Wave W17-AB rig: additions-only splice of the 13 new tile
// entries into art-data.mjs, anchored after the last prior
// Borea-program tile entry present in file order on this
// base (parallel branches anchored at different points; the
// Director merge unions at entry granularity). Species
// entries stay byte-identical — build-art.mjs is NOT run
// (W-DIFF2 lesson: it does not reproduce).
import fs from 'node:fs';
import { parsePix } from '../assets/sprites/tools/pix.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const NAMES = ['tile-leaguesand', 'tile-leaguerock',
  'tile-headturf', 'tile-headfloor', 'tile-headpine', 'tile-prop-headpost',
  'tile-foamfloor', 'tile-foampine', 'tile-foamrock',
  'tile-scorchturf', 'tile-zonefloor', 'tile-zonepine', 'tile-prop-zonepost'];
const PRIOR = ['tile-candorturf', 'tile-candorfloor', 'tile-candorelm', 'tile-prop-milepost',
  'tile-gateturf', 'tile-spirefloor', 'tile-gateoak', 'tile-prop-citypost',
  'tile-coalturf', 'tile-coalfloor', 'tile-coalpine', 'tile-prop-cartpost',
  'tile-bluffturf', 'tile-blufffloor', 'tile-bluffpine', 'tile-prop-screepost',
  'tile-oldroadfloor', 'tile-ruinwall',
  'tile-galeturf', 'tile-galefloor', 'tile-galepine', 'tile-prop-hivebox',
  'tile-deepturf', 'tile-deepfloor', 'tile-manoroak', 'tile-prop-silklog',
  'tile-pillarturf', 'tile-pillarwayfloor', 'tile-pillarpine', 'tile-prop-straypost',
  'tile-climbturf', 'tile-switchfloor', 'tile-climbpine', 'tile-prop-relicpost',
  'tile-restturf', 'tile-restfloor', 'tile-restpine', 'tile-prop-reststone',
  'tile-stepsfloor', 'tile-stepsrock', 'tile-spinefloor', 'tile-spinerock',
  'tile-zenithfloor', 'tile-zenithrock', 'tile-lotusturf', 'tile-lotusfloor',
  'tile-lotuspine', 'tile-prop-lotuspost',
  'tile-towerturf', 'tile-bellfloor', 'tile-bellpine', 'tile-prop-pilgrimpost',
  'tile-ranchturf', 'tile-ranchfloor', 'tile-ranchpine', 'tile-prop-paddockpost',
  'tile-fogturf', 'tile-fogfloor', 'tile-fogpine', 'tile-prop-waybell',
  'tile-poolturf', 'tile-poolfloor', 'tile-poolwillow', 'tile-prop-reedpost',
  'tile-bogturf', 'tile-bogfloor', 'tile-bogpine', 'tile-prop-lilypost',
  'tile-saltturf', 'tile-saltfloor', 'tile-saltpine', 'tile-prop-rackpost',
  'tile-gallantturf', 'tile-gallantfloor', 'tile-gallantelm', 'tile-prop-lightpost',
  'tile-keepfloor', 'tile-keepwall',
  'tile-vergeturf', 'tile-vergefloor', 'tile-vergepine', 'tile-prop-meteorpost',
  'tile-bloomturf', 'tile-vernalfloor', 'tile-bloomelm', 'tile-prop-petalpost',
  'tile-fareturf', 'tile-farefloor', 'tile-farepine', 'tile-prop-poolpost',
  'tile-puddleturf', 'tile-puddlefloor', 'tile-puddlepine', 'tile-prop-shardpost',
  'tile-packturf', 'tile-bridgefloor', 'tile-bridgepine', 'tile-prop-driftpost',
  'tile-whiteturf', 'tile-whitefloor', 'tile-whitepine', 'tile-prop-gearpost',
  'tile-calmturf', 'tile-calmfloor', 'tile-calmpine', 'tile-prop-wardenpost',
  'tile-glintfloor', 'tile-glintwall'];

function entry(name) {
  const pix = parsePix(fs.readFileSync(ROOT + 'assets/sprites/pix/tiles/' + name + '.pix', 'utf8'), name);
  const pal = Object.entries(pix.pal).map(([c, p]) => JSON.stringify(c) + ':' + JSON.stringify(p.hex)).join(',');
  const rows = pix.rows.map((r) => '    ' + JSON.stringify(r)).join(',\n');
  return '  ' + JSON.stringify(name) + ': { w: ' + pix.w + ', h: ' + pix.h + ', pal: {' + pal + '}, rows: [\n' + rows + '\n  ] },';
}

const path = ROOT + 'assets/sprites/art-data.mjs';
const src = fs.readFileSync(path, 'utf8');
for (const n of NAMES) if (src.includes(JSON.stringify(n) + ':')) throw new Error(n + ' already present');
// Anchor: the prior-program entry that occurs LAST in file order on this base.
let ANCHOR = null, anchorPos = -1;
for (const n of PRIOR) { const p = src.indexOf(JSON.stringify(n) + ':'); if (p > anchorPos) { anchorPos = p; ANCHOR = JSON.stringify(n); } }
if (!ANCHOR) throw new Error('no prior-program anchor entry found');
const ai = src.indexOf(ANCHOR);
const close = src.indexOf('\n  ] },', ai);
if (close < 0) throw new Error('anchor close not found');
const insertAt = close + '\n  ] },'.length;
const block = NAMES.map(entry).join('\n');
const out = src.slice(0, insertAt) + '\n' + block + src.slice(insertAt);
if (out.replace('\n' + block, '') !== src) throw new Error('splice is not additions-only');
fs.writeFileSync(path, out);
console.log('spliced', NAMES.length, 'entries after', ANCHOR, '; bytes', src.length, '->', out.length);
