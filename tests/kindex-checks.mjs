// tests/kindex-checks.mjs — Wave W14: the KinDex upgrade guard.
// Run: node tests/kindex-checks.mjs (exit 1 on any failure).
//
// W14-T1 sections (this file grows with the wave — T2 adds the entry /
// redaction / paging / derivation sections):
//   K1 list model — 502 rows (7 hub + 493 species + divider + Close);
//      hub labels [0..6] byte-pinned to today's strings (the
//      qa-changed-flows anchor: the chapter header stays items[0]);
//      species label strings recomputed from data + dex state and
//      matched per row — T1 changes NO label.
//   K2 plates + semantics — species rows carry .dexplate markup via the
//      menu's rowHtml; hub/divider/Close rows return the bare label span
//      (the plain renderer). Caught/seen semantics are FROZEN: a sprite
//      <img> is emitted only for a seen/caught species (the entry
//      panel's rule); an unseen row contains no <img>, no species name,
//      and no type string anywhere in its markup.
//   K3 filtered list — rowHtml plates apply identically under a filter
//      (status:'unseen': 491 species rows, zero sprites).
//   K4 geometry pins — string pins on SHELL_CSS in scripts/build.mjs:
//      the plate cell is exactly 64x64 (B2-G5 1x integer scale), the
//      .entrypanel max-height is unchanged, and the dexlist CSS block
//      carries no positioning (no dex element over the canvas — the
//      W8-F1 lesson). viewport-matrix stays 29/29 unmodified; this
//      suite carries the dex-specific pins instead of growing it.
//
// Headless pattern: audit-headless lineage — eval the built game JS and
// drive Game + UI directly, reading ui.menu (items + the stored
// rowHtml) rather than a DOM.

import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ---- folded roster (the design-depth fold: species.mjs + 2/3/4/5) ----
const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
const ALL = { ...SPECIES, ...SPECIES2, ...SPECIES_JOHTO, ...SPECIES_HOENN, ...SPECIES_SINNOH };
const UNITS = Object.keys(ALL).filter((id) => id !== 'partner' && !ALL[id].form);
ok('K1 roster folds to 493 dex units (partner + 15 formes excluded)', UNITS.length === 493, String(UNITS.length));

// ---- drive the game headlessly ----
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 4242;
const gameJs = buildGameJs();
const driver = `
;(function () {
  const out = {};
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const ui = game.ui, st = game.state;
  const snap = () => ({
    title: ui.menu.title, menuClass: ui.menu.menuClass,
    hasRowHtml: typeof ui.menu.rowHtml === 'function',
    items: ui.menu.items.map((it) => ({ label: it.label, value: it.value, disabled: !!it.disabled })),
    html: ui.menu.items.map((it, i) => ui.menu.rowHtml(it, i)),
  });
  game.openDex();
  out.fresh = snap();
  // Seed: dexNo 25 caught (VOLTIK), dexNo 4 seen-only (EMBRY).
  st.dex.caught[25] = true; st.dex.seen[25] = true; st.dex.seen[4] = true;
  game.openDex();
  out.seeded = snap();
  game.openDex({ status: 'unseen' });
  out.filteredUnseen = snap();
  console.log('KINDEX-RESULT ' + JSON.stringify(out));
})();`;
const logs = [];
const origLog = console.log;
console.log = (...a) => { logs.push(a.join(' ')); };
try { eval(gameJs + driver); } finally { console.log = origLog; }
const line = logs.find((l) => l.startsWith('KINDEX-RESULT '));
ok('K1 headless driver produced a dex snapshot', !!line);
const R = line ? JSON.parse(line.slice('KINDEX-RESULT '.length)) : { fresh: { items: [], html: [] }, seeded: { items: [], html: [] }, filteredUnseen: { items: [], html: [] } };

const HUB_FRESH = [
  'Journey — Ch.1 · The Crown League',
  'Regional — Arden: 0/151',
  'National — Grand horizon: 0/493 (0%)',
  'Areas — caught per area',
  'Search / Filter',
  "Prof. Hawthorn's rating",
  'Caught 0 / 1025 (tracked)',
];
const DIVIDER = '— More Kin are known to exist. Their regions are future arcs. —';
const isSpeciesItem = (it) => typeof it.value === 'string' && UNITS.includes(it.value);
const expectedLabel = (id, caught, seen) => {
  const sp = ALL[id];
  const c = !!(caught && caught[sp.dexNo]), s = !!(seen && seen[sp.dexNo]);
  return 'No.' + sp.dexNo + ' ' + (c || s ? sp.name : '???') + ' ' + (c ? '[CAUGHT]' : s ? '[SEEN]' : '[???]');
};

// ---- K1: list model on a fresh dex ----
{
  const F = R.fresh;
  ok('K1 menu title is KinDex', F.title === 'KinDex', F.title);
  ok('K1 menuClass is dexlist and rowHtml is set', F.menuClass === 'dexlist' && F.hasRowHtml === true, F.menuClass);
  ok('K1 list carries 502 rows (7 hub + 493 species + divider + Close)', F.items.length === 502, String(F.items.length));
  ok('K1 hub rows [0..6] labels byte-identical to today', HUB_FRESH.every((l, i) => F.items[i] && F.items[i].label === l),
    JSON.stringify(F.items.slice(0, 7).map((i) => i.label)));
  ok('K1 divider + Close close the list', F.items.length === 502 && F.items[500].label === DIVIDER && F.items[501].label === 'Close',
    JSON.stringify(F.items.slice(-2).map((i) => i.label)));
  const sp = F.items.filter(isSpeciesItem);
  ok('K1 species rows are exactly the 493 units (no partner, no formes)',
    sp.length === 493 && !F.items.some((it) => it.value === 'partner') && new Set(sp.map((it) => it.value)).size === 493);
  ok('K1 every fresh species label is the pre-W14 string (No.N ??? [???])',
    sp.every((it) => it.label === expectedLabel(it.value, null, null)),
    (sp.find((it) => it.label !== expectedLabel(it.value, null, null)) || {}).label);
  const plain = (i) => F.html[i] === '<span>' + F.items[i].label + '</span>';
  ok('K1 hub/divider/Close rows render through the plain renderer (no plate markup)',
    [0, 1, 2, 3, 4, 5, 6, 500, 501].every((i) => F.items[i] && plain(i) && !F.html[i].includes('dexplate')));
}

// ---- K2: plates + frozen semantics on a seeded dex ----
{
  const S = R.seeded;
  const idxOf = (v) => S.items.findIndex((it) => it.value === v);
  const caught = idxOf('pikachu'), seen = idxOf('charmander'), unseen = idxOf('pidgey');
  ok('K2 seeded rows found (VOLTIK / EMBRY / DUNPLUME)', caught >= 0 && seen >= 0 && unseen >= 0);
  const hc = S.html[caught] || '', hs = S.html[seen] || '', hu = S.html[unseen] || '';
  ok('K2 caught row is a plate with sprite, bold name, types, CAUGHT chip',
    hc.includes('dexplate') && hc.includes('<img class="dexsprite"') && hc.includes('VOLTIK')
    && hc.includes('electric') && hc.includes('is-caught') && hc.includes('>CAUGHT<'), hc.slice(0, 160));
  ok('K2 seen-only row shows sprite + name + types with the SEEN chip',
    hs.includes('<img class="dexsprite"') && hs.includes('EMBRY') && hs.includes('fire')
    && hs.includes('is-seen') && hs.includes('>SEEN<') && !hs.includes('is-caught'), hs.slice(0, 160));
  ok('K2 unseen row: dimmed empty plate, NO sprite element, NO name, NO types',
    hu.includes('dexplate') && hu.includes('dexcell-empty') && !hu.includes('<img')
    && !hu.includes('DUNPLUME') && !hu.includes('normal') && !hu.includes('flying')
    && hu.includes('is-unseen'), hu.slice(0, 160));
  const spHtml = S.items.map((it, i) => (isSpeciesItem(it) ? S.html[i] : null)).filter((h) => h !== null);
  ok('K2 every species row carries a plate; exactly the 2 known rows carry a sprite',
    spHtml.length === 493 && spHtml.every((h) => h.includes('dexplate'))
    && spHtml.filter((h) => h.includes('<img')).length === 2,
    'imgs=' + spHtml.filter((h) => h.includes('<img')).length);
  ok('K2 seeded species labels unchanged (marks ride the label, as today)',
    S.items.filter(isSpeciesItem).every((it) => it.label === expectedLabel(it.value, { 25: true }, { 25: true, 4: true })));
  ok('K2 hub counters still derive from state (labels untouched by T1)',
    S.items[6].label === 'Caught 1 / 1025 (tracked)' && S.items[1].label === 'Regional — Arden: 1/151'
    && S.items[2].label === 'National — Grand horizon: 1/493 (0%)',
    JSON.stringify(S.items.slice(0, 7).map((i) => i.label)));
}

// ---- K3: filtered list (status: unseen) ----
{
  const U = R.filteredUnseen;
  const sp = U.items.map((it, i) => (isSpeciesItem(it) ? U.html[i] : null)).filter((h) => h !== null);
  ok('K3 filtered list keeps the dexlist plates (menuClass + rowHtml)',
    U.menuClass === 'dexlist' && U.hasRowHtml === true && U.items[0].label === HUB_FRESH[0]);
  ok('K3 unseen filter lists 491 species rows, all plated, zero sprites',
    sp.length === 491 && sp.every((h) => h.includes('dexplate') && !h.includes('<img')),
    'rows=' + sp.length);
}

// ---- K4: geometry pins on SHELL_CSS ----
{
  const css = fs.readFileSync(join(ROOT, 'scripts/build.mjs'), 'utf8');
  ok('K4 plate cell is exactly 64x64 (B2-G5 1x integer scale)', css.includes('.dexcell{width:64px;height:64px'));
  ok('K4 plate sprite renders at exactly 64x64 (no fractional scaling)', css.includes('.dexsprite{width:64px;height:64px'));
  const entry = css.match(/\.entrypanel\{[^}]*\}/);
  ok('K4 entry panel geometry unchanged (max-height 92%)', !!entry && entry[0].includes('max-height:92%'), entry && entry[0]);
  const menu = css.match(/\.menu\{[^}]*\}/);
  ok('K4 menu overlay geometry unchanged (max-height 92%)', !!menu && menu[0].includes('max-height:92%'));
  const start = css.indexOf('/* KinDex list plates (W14-T1)');
  const block = start >= 0 ? css.slice(start, css.indexOf('\n/*', start + 10)) : '';
  ok('K4 dexlist CSS block exists and positions nothing (no element over the canvas)',
    start >= 0 && block.length > 0 && !/position\s*:/.test(block) && !block.includes('#screenwrap'));
}

console.log(`\nkindex-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
