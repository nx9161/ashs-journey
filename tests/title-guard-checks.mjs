// title-guard-checks.mjs — the DRIVER RESYNC guard (War Room E2E Phase 2,
// Wave W1). Run: node tests/title-guard-checks.mjs (exit 1 on any failure).
//
// Why this exists: the 2026-11-12 KIN branding sweep renamed the game's
// display titles and the T-wave town rebuilds moved doors and NPC posts —
// and five suites (frontier, cheat-shop, campaign-smoke, battle-model,
// audit-headless) silently rotted, because the branding guard scans game
// text only and nothing cross-checked the TEST DRIVERS' expected literals
// against the game's canonical registries. Every one of those failures was
// test-side; the game was telling the truth the whole time (E2E audit,
// Cluster 3). This guard makes that rot class fail loudly at the guard
// instead of quietly inside five suites:
//
//   T1 registry sanity — every canonical menu title / shop label below
//      exists verbatim in the game source it is read from. (If the game
//      renames a title again, update CANONICAL here — loudly, on purpose.)
//   T2 retired-variant scan — no test driver may contain a retired variant
//      of a canonical title (the pre-sweep wording, derived mechanically
//      by substituting the old franchise noun for 'Kin'). ZERO tolerance
//      in the five W1-resynced suites and in every unlisted file.
//   T3 ratchet — a file on the RATCHET list carries known-INERT retired
//      literals whose count may only shrink; any growth — or any
//      occurrence in a new file — fails here. Burn an entry down by
//      resyncing that driver and deleting its line from RATCHET.
//      W2 TRIAGE (2026-11-13): the original 10-entry queue was inspected
//      occurrence by occurrence and ALL 10 proved to be live-code-path
//      literals (menu-title comparisons in battle/contest driver loops —
//      the intended branch was dead and a catch-all fallback was silently
//      driving those menus), so all 10 were resynced to the canonical
//      Kin titles and the ratchet burned to zero. Per-file dispositions
//      are recorded in .github/workflows/checks.yml. The mechanism stays
//      armed: a future known-inert occurrence may be ratcheted only with
//      a written disposition, and its count may still only shrink.
//   T4 captain coordinates — frontier-checks' A19/B01 stance literals must
//      equal the live TALE_NPCS posts in src/data/quests.mjs.
//   T5 Center anchors — battle-model's E02 fallback literal must equal
//      centerExit()'s fallback in src/game/overworld.mjs, and its E03/E06/
//      E07 door-front literals must equal the merged-map vias of the doors
//      its driver steps on (merged exactly as src/data/merge.mjs folds
//      MAPS..MAPS9 — later copies win).
//
// Out of scope by design: branding-checks.mjs (a guard, not a driver — its
// data IS the franchise-term blocklist) and this file (it derives the
// retired variants programmatically). Prose check-names in drivers that
// mention e.g. "Pokemon Center" are not matching literals and are not this
// rot class; they belong to the branding conversation, not the drivers'.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TESTS = join(ROOT, 'tests');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const count = (text, s) => text.split(s).length - 1;

// ---------------- T1: canonical registry, read from game source --------
const CANONICAL = [
  { title: 'Choose next Kin', src: 'src/game/battle.mjs' },       // forced faint switch (battle.mjs:804)
  { title: 'Choose a Kin', src: 'src/game/battle.mjs' },          // voluntary switch (battle.mjs:1855)
  { title: 'Will you change Kin?', src: 'src/game/battle.mjs' },  // SHIFT prompt (battle.mjs:1834)
  { title: 'Get Kin', src: 'src/game/overworld-systems.mjs' },    // Cheat Terminal top menu label
  { title: 'Enter which Kin?', src: 'src/game/overworld-systems.mjs' }, // contest entry menu (overworld-systems.mjs:1217)
];
const srcCache = {};
for (const c of CANONICAL) {
  srcCache[c.src] = srcCache[c.src] || read(c.src);
  ok(`T1 canonical title '${c.title}' exists verbatim in ${c.src}`,
    srcCache[c.src].includes("'" + c.title + "'"));
}
const VARIANTS = [...new Set(CANONICAL.flatMap((c) => [
  c.title.replaceAll('Kin', 'Pokemon'),
  c.title.replaceAll('Kin', 'Pokémon'),
]))];

// ---------------- T2/T3: retired-variant scan over the drivers ---------
const W1_SUITES = ['frontier-checks.mjs', 'cheat-shop-checks.mjs', 'campaign-smoke.mjs', 'battle-model-checks.mjs', 'audit-headless.mjs'];
// Known-inert occurrences in green suites outside the resync waves'
// scope. EMPTY since the W2 triage burned the original queue to zero
// (see the header): every queued occurrence proved to be a live-path
// literal and was resynced, not ratcheted. Add an entry only with a
// written disposition in .github/workflows/checks.yml; an entry's count
// may only shrink. Resync the driver, then delete its line here.
const RATCHET = {};
const EXCLUDE = new Set(['title-guard-checks.mjs', 'branding-checks.mjs']);
const driverFiles = [
  ...readdirSync(TESTS).filter((f) => f.endsWith('.mjs')).map((f) => [f, join(TESTS, f)]),
  ...readdirSync(join(TESTS, 'suites')).filter((f) => f.endsWith('.mjs')).map((f) => ['suites/' + f, join(TESTS, 'suites', f)]),
];
const unexpected = [];
for (const [name, file] of driverFiles) {
  if (EXCLUDE.has(name)) continue;
  const text = readFileSync(file, 'utf8');
  const n = VARIANTS.reduce((a, v) => a + count(text, v), 0);
  if (W1_SUITES.includes(name)) {
    ok(`T2 W1 suite ${name} carries zero retired title variants`, n === 0, n + ' occurrence(s)');
  } else if (Object.prototype.hasOwnProperty.call(RATCHET, name)) {
    ok(`T3 ratchet ${name} retired variants do not grow (baseline ${RATCHET[name]})`, n <= RATCHET[name], n + ' occurrence(s)');
  } else if (n > 0) {
    unexpected.push(name + ' (' + n + ')');
  }
}
ok('T2 no unlisted driver file carries a retired title variant', unexpected.length === 0, unexpected.join(', '));

// ---------------- T4: captain coordinates vs quests.mjs ----------------
const { TALE_NPCS } = await import(join(ROOT, 'src/data/quests.mjs'));
const frontierText = read('tests/frontier-checks.mjs');
function literalPairs(text, re) {
  return [...text.matchAll(re)].map((m) => [+m[1], +m[2]]);
}
for (const capName of ['CAPT FRONTIER', 'CAPT YAMATO']) {
  const live = TALE_NPCS.find((n) => n.name === capName);
  const a19 = literalPairs(frontierText, new RegExp((capName === 'CAPT FRONTIER' ? 'capt' : 'johto') + '\\.x === (\\d+) && ' + (capName === 'CAPT FRONTIER' ? 'capt' : 'johto') + '\\.y === (\\d+)', 'g'));
  const b01 = capName === 'CAPT FRONTIER'
    ? literalPairs(frontierText, /capt\.x === (\d+) && capt\.y === (\d+)/g)
    : literalPairs(frontierText, /CAPT YAMATO' && n\.x === (\d+) && n\.y === (\d+)/g);
  const all = capName === 'CAPT FRONTIER' ? b01 : [...a19, ...b01];
  ok(`T4 frontier-checks ${capName} stance literals all equal the live TALE_NPCS post (${live.x},${live.y})`,
    !!live && all.length > 0 && all.every(([x, y]) => x === live.x && y === live.y),
    'literals found: ' + JSON.stringify(all));
}

// ---------------- T5: Center anchors vs overworld + merged maps --------
const battleModelText = read('tests/battle-model-checks.mjs');
const owSrc = read('src/game/overworld.mjs');
const fb = owSrc.match(/centerExit\(\) \{[\s\S]*?return \{ map: 'pallet', x: (\d+), y: (\d+) \}/);
const e02 = battleModelText.match(/e1Exit\.x === (\d+) && r\.e1Exit\.y === (\d+)/);
ok('T5 battle-model E02 fallback literal equals centerExit() fallback in overworld.mjs',
  !!fb && !!e02 && +fb[1] === +e02[1] && +fb[2] === +e02[2],
  `game fallback=${fb ? fb[1] + ',' + fb[2] : 'NOT FOUND'} driver=${e02 ? e02[1] + ',' + e02[2] : 'NOT FOUND'}`);

// Fold the map packs exactly as src/data/merge.mjs does (later wins).
const packs = [];
for (const [file, key] of [['maps.mjs', 'MAPS'], ['maps2.mjs', 'MAPS2'], ['maps3.mjs', 'MAPS3'], ['maps4.mjs', 'MAPS4'], ['maps5.mjs', 'MAPS5'], ['maps6.mjs', 'MAPS6'], ['maps7.mjs', 'MAPS7'], ['maps8.mjs', 'MAPS8'], ['maps9.mjs', 'MAPS9']]) {
  const mod = await import(join(ROOT, 'src/data', file));
  if (mod[key]) packs.push(mod[key]);
}
const MERGED = Object.assign({}, ...packs);
function centerVia(mapId, x, y) {
  const w = ((MERGED[mapId] || {}).warps || []).find((w) => w.x === x && w.y === y && w.to && w.to.map === 'center');
  return w && w.via ? [w.via.x, w.via.y] : null;
}
function expectPair(text, re, label, want) {
  const m = text.match(re);
  ok(`T5 battle-model ${label} equals the merged-map door via (${want})`,
    !!m && +m[1] === want[0] && +m[2] === want[1],
    `driver=${m ? m[1] + ',' + m[2] : 'NOT FOUND'}`);
}
// Viridian: the door the E2 scenario steps on, and the fronts it expects.
const vStep = battleModelText.match(/loadMap\('viridian'\); stepOn\(ow, (\d+), (\d+)\)/);
const vVia = vStep ? centerVia('viridian', +vStep[1], +vStep[2]) : null;
ok('T5 battle-model E2 step tile is a Center door in merged viridian', !!vVia, vStep ? `stepped (${vStep[1]},${vStep[2]})` : 'step pattern NOT FOUND');
if (vVia) {
  expectPair(battleModelText, /e2Anchor\.x === (\d+) && r\.e2Anchor\.y === (\d+)/, 'E03 anchor', vVia);
  expectPair(battleModelText, /e2VoluntaryExit\.x === (\d+) && r\.e2VoluntaryExit\.y === (\d+)/, 'E04 voluntary exit', vVia);
  expectPair(battleModelText, /e2BlackoutExit\.x === (\d+) && r\.e2BlackoutExit\.y === (\d+)/, 'E05 blackout exit', vVia);
}
// The E3 town table: each stepped door must be a Center door, and E06/E07
// must expect its via (E07 reloads to the LAST table town visited).
const table = [...battleModelText.matchAll(/\['(fuchsia|cinnabar)', (\d+), (\d+)\]/g)]
  .map((m) => [m[1], +m[2], +m[3]]);
ok('T5 battle-model E3 town table found (fuchsia + cinnabar)', table.length === 2, JSON.stringify(table));
const vias = {};
for (const [town, dx, dy] of table) {
  vias[town] = centerVia(town, dx, dy);
  ok(`T5 battle-model E3 step (${town} ${dx},${dy}) is a Center door in merged ${town}`, !!vias[town]);
}
if (vias.fuchsia) {
  expectPair(battleModelText, /e3_fuchsia\.x === (\d+) && r\.e3_fuchsia\.y === (\d+)/, 'E06 fuchsia door-front', vias.fuchsia);
}
if (vias.cinnabar) {
  expectPair(battleModelText, /e3_cinnabar\.x === (\d+) && r\.e3_cinnabar\.y === (\d+)/, 'E06 cinnabar door-front', vias.cinnabar);
  expectPair(battleModelText, /e4ReloadExit\.x === (\d+) && r\.e4ReloadExit\.y === (\d+)/, 'E07 reload exit (last town = cinnabar)', vias.cinnabar);
}

console.log(`\ntitle-guard-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
