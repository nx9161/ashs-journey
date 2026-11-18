// audit-shared-interiors.mjs — shared Center/Mart origin-ticket guard
// (Region-1 fix wave, 2026-11-17). The shared 'center' and 'mart'
// interiors serve every town in every region; a town door warp's
// via{} is the ONLY record of which town the player came from, and
// the interiors' exits (viaExit) resolve through it. Three defects
// lived here:
//   1. The Mart's via ticket was runtime-only (the Center's was
//      persisted in the P1 fix, the Mart's never was): a save/reload
//      inside a Mart forgot the origin and the exit deposited the
//      player in Fernmere with Fernmere's clerk. Fixed by persisting
//      story.lastMart + the martExit() resolver (source pins below).
//   2. Fly's visited_<id> writer keyed on a `centerCity` map field no
//      map defines, so Fly's destination list was always empty. The
//      writer now derives the mark from the Center-door warp — which
//      makes the census below Fly's contract: the Center-door town
//      set IS the Fly destination set.
//   3. Nothing verified a via ticket names its own town or lands on a
//      standable tile — a wrong via is a wrong-town exit waiting for
//      a reload to expose it.
// Checks (all maps, all regions):
//   a. every warp into 'center'/'mart' carries a via{} whose map is
//      the SOURCE map and whose tile is in-bounds + standable there;
//   b. every warp OUT of 'center'/'mart' carries viaExit:true;
//   c. the Center-door town set equals the Mart-door town set
//      (the 64-town census at the wave's writing) and is non-empty;
//   d. source pins: overworld.mjs persists story.lastMart on Mart
//      entry and resolves exits through martExit(); schema.mjs
//      sanitizes story.lastMart; overworld-systems.mjs derives the
//      visited_ mark from the Center-door warp.
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
import { startTileAt, isStartStandable } from '../src/game/start-pos.mjs';

const failures = [];
const fail = (msg) => failures.push(msg);

const centerTowns = new Set();
const martTowns = new Set();
let tickets = 0;
for (const [id, mp] of Object.entries(MAPS)) {
  for (const w of (mp.warps || [])) {
    if (!w.to) continue;
    if (w.to.map === 'center' || w.to.map === 'mart') {
      (w.to.map === 'center' ? centerTowns : martTowns).add(id);
      tickets++;
      if (!w.via) { fail(`${id}: warp (${w.x},${w.y}) into '${w.to.map}' carries NO via ticket — the interior exit cannot resolve its origin town`); continue; }
      if (w.via.map !== id) fail(`${id}: warp (${w.x},${w.y}) into '${w.to.map}' has via.map '${w.via.map}' — the exit would deposit the player in the wrong town`);
      const t = startTileAt(mp, w.via.x, w.via.y);
      if (t === null || t === undefined) fail(`${id}: via tile (${w.via.x},${w.via.y}) is out of bounds on its own map`);
      else if (!isStartStandable(mp, w.via.x, w.via.y)) fail(`${id}: via tile (${w.via.x},${w.via.y}) is NOT standable — tile ${JSON.stringify(t)}`);
    }
  }
}
for (const interior of ['center', 'mart']) {
  const mp = MAPS[interior];
  if (!mp) { fail(`shared interior '${interior}' is missing from the map registry`); continue; }
  for (const w of (mp.warps || [])) {
    if (!w.viaExit) fail(`${interior}: exit warp (${w.x},${w.y}) lacks viaExit:true — it would follow its hard-coded 'to' instead of the origin ticket`);
  }
}
for (const id of centerTowns) if (!martTowns.has(id)) fail(`${id}: fields a Center door but no Mart door — the 64-town Center/Mart census diverged`);
for (const id of martTowns) if (!centerTowns.has(id)) fail(`${id}: fields a Mart door but no Center door — the 64-town Center/Mart census diverged`);
if (!centerTowns.size) fail('no Center-door towns found — the Fly destination census is empty');

const ow = readFileSync(new URL('../src/game/overworld.mjs', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../src/save/schema.mjs', import.meta.url), 'utf8');
const sys = readFileSync(new URL('../src/game/overworld-systems.mjs', import.meta.url), 'utf8');
if (!ow.includes('g.state.story.lastMart = { map: wp.via.map')) fail('overworld.mjs no longer persists story.lastMart on Mart entry — the reload-inside-a-Mart exit regresses to Fernmere');
if (!ow.includes('martExit()')) fail('overworld.mjs no longer defines the martExit() resolver');
if (!schema.includes('data.story.lastMart')) fail('schema.mjs no longer sanitizes story.lastMart');
if (!sys.includes("w.to.map === 'center'")) fail('overworld-systems.mjs no longer derives the visited_ mark from the Center-door warp — Fly regresses to a dead menu');

if (failures.length) {
  console.log('audit-shared-interiors: FAIL (' + failures.length + ')');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log(`audit-shared-interiors: ALL PASS — ${centerTowns.size} Center towns = ${martTowns.size} Mart towns, ${tickets} origin tickets verified, source pins intact`);
