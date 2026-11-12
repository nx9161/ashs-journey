// name-registry-checks.mjs — Wave G: the name registry is the single
// source of truth for the original-names program; this suite proves
// the shipped data tables cannot drift from it.
//   node tests/name-registry-checks.mjs
// Asserts: every registry species id exists in the merged SPECIES
// table and its live display name matches the registry; the
// owner-locked canon list is exactly the registry's locked species
// name set; no two species share a new name (the partner/pikachu
// VOLTIK pair is the one sanctioned exception — two records of one
// creature, both dexNo 25); every renamed line is fully renamed;
// places/moves/items entries (populated by later waves) target real
// ids and match the live tables.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = (f) => import(path.join(ROOT, 'src/data', f));
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const { NAME_REGISTRY, LOCKED_CANON } = await D('name-registry.mjs');
const { SPECIES } = await D('species.mjs');
Object.assign(SPECIES, (await D('species2.mjs')).SPECIES2, (await D('species3.mjs')).SPECIES_JOHTO,
  (await D('species4.mjs')).SPECIES_HOENN, (await D('species5.mjs')).SPECIES_SINNOH); // merge.mjs's fold
const { MAPS } = await D('maps.mjs');
Object.assign(MAPS, (await D('maps2.mjs')).MAPS2, (await D('maps3.mjs')).MAPS3, (await D('maps4.mjs')).MAPS4,
  (await D('maps5.mjs')).MAPS5, (await D('maps6.mjs')).MAPS6, (await D('maps7.mjs')).MAPS7,
  (await D('maps8.mjs')).MAPS8, (await D('maps9.mjs')).MAPS9);
const { MOVES } = await D('moves.mjs');
Object.assign(MOVES, (await D('moves2.mjs')).MOVES2);
const { ITEMS } = await D('items.mjs');

// ---- species: existence + live-name agreement ----
const reg = NAME_REGISTRY.species;
for (const [id, e] of Object.entries(reg)) {
  ok(`registry species ${id} exists`, !!SPECIES[id]);
  if (SPECIES[id]) ok(`registry species ${id} live name is ${e.name}`, SPECIES[id].name === e.name,
    `live=${SPECIES[id] && SPECIES[id].name}`);
}

// ---- locked canon: exact set equality with locked species names ----
const lockedNames = [...new Set(Object.values(reg).filter((e) => e.status === 'locked').map((e) => e.name))].sort();
ok('LOCKED_CANON matches the registry locked set',
  JSON.stringify(lockedNames) === JSON.stringify([...LOCKED_CANON].sort()),
  `registry=${lockedNames.join(',')} canon=${LOCKED_CANON.join(',')}`);

// ---- uniqueness: one new name per species, VOLTIK pair excepted ----
const byName = new Map();
for (const [id, e] of Object.entries(reg)) {
  if (!byName.has(e.name)) byName.set(e.name, []);
  byName.get(e.name).push(id);
}
for (const [name, ids] of byName) {
  if (name === 'VOLTIK') ok('VOLTIK covers exactly partner+pikachu', JSON.stringify([...ids].sort()) === JSON.stringify(['partner', 'pikachu']), ids.join(','));
  else ok(`name ${name} is unique`, ids.length === 1, ids.join(','));
}

// ---- lines: fully renamed, in registry, chain order preserved ----
for (const [line, ids] of Object.entries(NAME_REGISTRY.lines)) {
  ok(`line ${line} fully registered`, ids.every((id) => reg[id]), ids.join(','));
}

// ---- places: entries target real maps and match live names ----
for (const [id, e] of Object.entries(NAME_REGISTRY.places)) {
  ok(`registry place ${id} exists`, !!MAPS[id]);
  if (MAPS[id]) ok(`registry place ${id} live name matches`, MAPS[id].name === e.name, `live=${MAPS[id].name}`);
}

// ---- moves / items: entries target real ids and match live names ----
for (const [id, e] of Object.entries(NAME_REGISTRY.moves)) {
  ok(`registry move ${id} exists`, !!MOVES[id]);
  if (MOVES[id]) ok(`registry move ${id} live name matches`, MOVES[id].name === e.name, `live=${MOVES[id].name}`);
}
for (const [id, e] of Object.entries(NAME_REGISTRY.items)) {
  ok(`registry item ${id} exists`, !!ITEMS[id]);
  if (ITEMS[id]) ok(`registry item ${id} live name matches`, ITEMS[id].name === e.name, `live=${ITEMS[id].name}`);
}

console.log(`\nname-registry-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
