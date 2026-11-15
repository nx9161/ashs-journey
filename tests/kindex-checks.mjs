// tests/kindex-checks.mjs — Wave W14: the KinDex upgrade guard.
// Run: node tests/kindex-checks.mjs (exit 1 on any failure).
//
// UNION of the two W14 tranche suites (merged at the W14-T2 merge;
// no check lost, none weakened — T1's sections were relabeled
// K1–K4 -> L1–L4 so both suites keep distinct check ids):
//
// L sections (W14-T1, list plates):
//   L1 list model — 502 rows (7 hub + 493 species + divider + Close);
//      hub labels [0..6] byte-pinned to today's strings (the
//      qa-changed-flows anchor: the chapter header stays items[0]);
//      species label strings recomputed from data + dex state and
//      matched per row — T1 changes NO label.
//   L2 plates + semantics — species rows carry .dexplate markup via the
//      menu's rowHtml; hub/divider/Close rows return the bare label span
//      (the plain renderer). Caught/seen semantics are FROZEN: a sprite
//      <img> is emitted only for a seen/caught species (the entry
//      panel's rule); an unseen row contains no <img>, no species name,
//      and no type string anywhere in its markup.
//   L3 filtered list — rowHtml plates apply identically under a filter
//      (status:'unseen': 491 species rows, zero sprites).
//   L4 geometry pins — string pins on SHELL_CSS in scripts/build.mjs:
//      the plate cell is exactly 64x64 (B2-G5 1x integer scale), the
//      .entrypanel max-height is unchanged, and the dexlist CSS block
//      carries no positioning (no dex element over the canvas — the
//      W8-F1 lesson). viewport-matrix stays 29/29 unmodified; this
//      suite carries the dex-specific pins instead of growing it.
//
// K sections (W14-T2, entry panel + paging):
//   K1 data census — the derivations' inputs, folded from the raw
//      modules: 509 records / 493 units, design on all 508 units
//      (partner folds to the wild VOLTIK record, design-depth D6),
//      286 units in encounter tables, 229 records with outbound evo.
//   K2 entry composition — every record composes through the game's
//      ONE composition path (dexEntryRender) without error; with an
//      all-caught dex the Design line is present for all 508 units
//      and byte-equal to the record's design feed; the Areas and
//      Evolves lines are byte-equal to an independent re-derivation
//      from the raw folded modules (present iff the data has them —
//      omitted entirely when none, never an empty claim).
//   K3 redaction — on a fresh dex every unit's entry is fully
//      redacted (??? title, empty sprite, redaction flavor, no
//      design/areas/evo lines); an unseen evolution stage is never
//      named — it renders ??? in a known neighbour's chain line.
//   K4 paging — the entry order is the full 493, strictly dexNo
//      ascending; EVERY unit opens on itself (the W14 census defect
//      capped paging at dexNo 151 — 342 entries landed on dexNo 1);
//      paging wraps at both ends; a filtered open pages the filtered
//      list's own order; a filtered-out species still opens on
//      itself via the full order.
//   K5 hub pins — the seven hub row labels byte-pinned on a fresh
//      state, list length 502 rows, species-row label samples pinned
//      redacted and known. (List plates/geometry are the L sections.)
//
// Headless pattern: audit-headless lineage — eval the built game JS and
// drive Game + UI directly.

import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ===== Part A: W14-T1 list sections (L1–L4) =====
{
// ---- folded roster (the design-depth fold: species.mjs + 2/3/4/5) ----
const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
const ALL = { ...SPECIES, ...SPECIES2, ...SPECIES_JOHTO, ...SPECIES_HOENN, ...SPECIES_SINNOH };
const UNITS = Object.keys(ALL).filter((id) => id !== 'partner' && !ALL[id].form);
ok('L1 roster folds to 493 dex units (partner + 15 formes excluded)', UNITS.length === 493, String(UNITS.length));

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
ok('L1 headless driver produced a dex snapshot', !!line);
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

// ---- L1: list model on a fresh dex ----
{
  const F = R.fresh;
  ok('L1 menu title is KinDex', F.title === 'KinDex', F.title);
  ok('L1 menuClass is dexlist and rowHtml is set', F.menuClass === 'dexlist' && F.hasRowHtml === true, F.menuClass);
  ok('L1 list carries 502 rows (7 hub + 493 species + divider + Close)', F.items.length === 502, String(F.items.length));
  ok('L1 hub rows [0..6] labels byte-identical to today', HUB_FRESH.every((l, i) => F.items[i] && F.items[i].label === l),
    JSON.stringify(F.items.slice(0, 7).map((i) => i.label)));
  ok('L1 divider + Close close the list', F.items.length === 502 && F.items[500].label === DIVIDER && F.items[501].label === 'Close',
    JSON.stringify(F.items.slice(-2).map((i) => i.label)));
  const sp = F.items.filter(isSpeciesItem);
  ok('L1 species rows are exactly the 493 units (no partner, no formes)',
    sp.length === 493 && !F.items.some((it) => it.value === 'partner') && new Set(sp.map((it) => it.value)).size === 493);
  ok('L1 every fresh species label is the pre-W14 string (No.N ??? [???])',
    sp.every((it) => it.label === expectedLabel(it.value, null, null)),
    (sp.find((it) => it.label !== expectedLabel(it.value, null, null)) || {}).label);
  const plain = (i) => F.html[i] === '<span>' + F.items[i].label + '</span>';
  ok('L1 hub/divider/Close rows render through the plain renderer (no plate markup)',
    [0, 1, 2, 3, 4, 5, 6, 500, 501].every((i) => F.items[i] && plain(i) && !F.html[i].includes('dexplate')));
}

// ---- L2: plates + frozen semantics on a seeded dex ----
{
  const S = R.seeded;
  const idxOf = (v) => S.items.findIndex((it) => it.value === v);
  const caught = idxOf('pikachu'), seen = idxOf('charmander'), unseen = idxOf('pidgey');
  ok('L2 seeded rows found (VOLTIK / EMBRY / DUNPLUME)', caught >= 0 && seen >= 0 && unseen >= 0);
  const hc = S.html[caught] || '', hs = S.html[seen] || '', hu = S.html[unseen] || '';
  ok('L2 caught row is a plate with sprite, bold name, types, CAUGHT chip',
    hc.includes('dexplate') && hc.includes('<img class="dexsprite"') && hc.includes('VOLTIK')
    && hc.includes('electric') && hc.includes('is-caught') && hc.includes('>CAUGHT<'), hc.slice(0, 160));
  ok('L2 seen-only row shows sprite + name + types with the SEEN chip',
    hs.includes('<img class="dexsprite"') && hs.includes('EMBRY') && hs.includes('fire')
    && hs.includes('is-seen') && hs.includes('>SEEN<') && !hs.includes('is-caught'), hs.slice(0, 160));
  ok('L2 unseen row: dimmed empty plate, NO sprite element, NO name, NO types',
    hu.includes('dexplate') && hu.includes('dexcell-empty') && !hu.includes('<img')
    && !hu.includes('DUNPLUME') && !hu.includes('normal') && !hu.includes('flying')
    && hu.includes('is-unseen'), hu.slice(0, 160));
  const spHtml = S.items.map((it, i) => (isSpeciesItem(it) ? S.html[i] : null)).filter((h) => h !== null);
  ok('L2 every species row carries a plate; exactly the 2 known rows carry a sprite',
    spHtml.length === 493 && spHtml.every((h) => h.includes('dexplate'))
    && spHtml.filter((h) => h.includes('<img')).length === 2,
    'imgs=' + spHtml.filter((h) => h.includes('<img')).length);
  ok('L2 seeded species labels unchanged (marks ride the label, as today)',
    S.items.filter(isSpeciesItem).every((it) => it.label === expectedLabel(it.value, { 25: true }, { 25: true, 4: true })));
  ok('L2 hub counters still derive from state (labels untouched by T1)',
    S.items[6].label === 'Caught 1 / 1025 (tracked)' && S.items[1].label === 'Regional — Arden: 1/151'
    && S.items[2].label === 'National — Grand horizon: 1/493 (0%)',
    JSON.stringify(S.items.slice(0, 7).map((i) => i.label)));
}

// ---- L3: filtered list (status: unseen) ----
{
  const U = R.filteredUnseen;
  const sp = U.items.map((it, i) => (isSpeciesItem(it) ? U.html[i] : null)).filter((h) => h !== null);
  ok('L3 filtered list keeps the dexlist plates (menuClass + rowHtml)',
    U.menuClass === 'dexlist' && U.hasRowHtml === true && U.items[0].label === HUB_FRESH[0]);
  ok('L3 unseen filter lists 491 species rows, all plated, zero sprites',
    sp.length === 491 && sp.every((h) => h.includes('dexplate') && !h.includes('<img')),
    'rows=' + sp.length);
}

// ---- L4: geometry pins on SHELL_CSS ----
{
  const css = fs.readFileSync(join(ROOT, 'scripts/build.mjs'), 'utf8');
  ok('L4 plate cell is exactly 64x64 (B2-G5 1x integer scale)', css.includes('.dexcell{width:64px;height:64px'));
  ok('L4 plate sprite renders at exactly 64x64 (no fractional scaling)', css.includes('.dexsprite{width:64px;height:64px'));
  const entry = css.match(/\.entrypanel\{[^}]*\}/);
  ok('L4 entry panel geometry unchanged (max-height 92%)', !!entry && entry[0].includes('max-height:92%'), entry && entry[0]);
  const menu = css.match(/\.menu\{[^}]*\}/);
  ok('L4 menu overlay geometry unchanged (max-height 92%)', !!menu && menu[0].includes('max-height:92%'));
  const start = css.indexOf('/* KinDex list plates (W14-T1)');
  const block = start >= 0 ? css.slice(start, css.indexOf('\n/*', start + 10)) : '';
  ok('L4 dexlist CSS block exists and positions nothing (no element over the canvas)',
    start >= 0 && block.length > 0 && !/position\s*:/.test(block) && !block.includes('#screenwrap'));
}
}

// ===== Part B: W14-T2 entry sections (K1–K5) =====
{
// ---------- K1: data census (raw modules, folded as merge.mjs folds) ----------
const S = await import(join(ROOT, 'src/data/species.mjs'));
const S2 = await import(join(ROOT, 'src/data/species2.mjs'));
const S3 = await import(join(ROOT, 'src/data/species3.mjs'));
const S4 = await import(join(ROOT, 'src/data/species4.mjs'));
const S5 = await import(join(ROOT, 'src/data/species5.mjs'));
const ALL = { ...S.SPECIES, ...S2.SPECIES2, ...S3.SPECIES_JOHTO, ...S4.SPECIES_HOENN, ...S5.SPECIES_SINNOH };
const records = Object.values(ALL);
const units = records.filter((r) => r.id !== 'partner' && !r.form);
ok('K1 509 species records', records.length === 509, records.length);
ok('K1 493 dex units (partner + 15 formes fold out)', units.length === 493, units.length);
const designUnits = records.filter((r) => r.id !== 'partner');
ok('K1 design feed on all 508 units', designUnits.every((r) => r.design && r.design.inspired && r.design.note), designUnits.filter((r) => !r.design).length);
ok('K1 partner design === wild VOLTIK design (D6 fold)', JSON.stringify(ALL.partner.design) === JSON.stringify(ALL.pikachu.design));

const MM = await import(join(ROOT, 'src/data/maps.mjs'));
const MAPS = MM.MAPS;
for (let i = 2; i <= 9; i++) { const m = await import(join(ROOT, 'src/data/maps' + i + '.mjs')); Object.assign(MAPS, m['MAPS' + i]); }
const areasOf = (id) => {
  const names = [];
  for (const mapId of Object.keys(MAPS)) {
    const m = MAPS[mapId];
    if (m.encounters && m.encounters.table.some((e) => e.species === id) && !names.includes(m.name)) names.push(m.name);
  }
  return names;
};
ok('K1 286 units in encounter tables', units.filter((u) => areasOf(u.id).length).length === 286,
  units.filter((u) => areasOf(u.id).length).length);
const outsOf = (rec) => (rec.evos && rec.evos.length ? rec.evos : (rec.evo ? [rec.evo] : []));
ok('K1 229 records with outbound evo data', records.filter((r) => outsOf(r).length).length === 229,
  records.filter((r) => outsOf(r).length).length);

// Independent expected lines (all-known state): the suite re-derives
// from the raw data; the game's render must match byte for byte.
const expectedAreasLine = (id) => {
  const a = areasOf(id);
  return a.length ? 'Areas: ' + a.slice(0, 3).join(' · ') + (a.length > 3 ? ' +' + (a.length - 3) + ' more' : '') : null;
};
const expectedEvoLine = (id) => {
  const parts = [];
  const preNos = new Set();
  for (const other of records) {
    if (other.id === id || preNos.has(other.dexNo)) continue;
    if (outsOf(other).some((e) => e.to === id)) { preNos.add(other.dexNo); parts.push('← ' + other.name); }
  }
  for (const e of outsOf(ALL[id])) {
    const t = ALL[e.to];
    if (!t) continue;
    parts.push('→ ' + t.name + (e.method === 'level' && e.level ? ' at Lv ' + e.level : ' by ' + e.method));
  }
  return parts.length ? 'Evolves: ' + parts.join(' · ') : null;
};

// ---------- bundle driver (headless Game, the audit-headless pattern) ----------
const { buildGameJs } = await import(join(ROOT, 'scripts/build.mjs'));
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.__SEED__ = 4242;
let src = '';
const origLog = console.log;
console.log = (...a) => { src += a.join(' ') + '\n'; };
const driver = String.raw`
;(function () {
  const game = new Game(null);
  game.ui.init(); game.input.bindKeyboard(); game.buildSprites(); game.applyLayout();
  const ui = game.ui, st = game.state;
  const out = {};
  const line = (body, cls) => { const m = body.match(new RegExp(cls + '">([^<]*)<')); return m ? m[1] : null; };
  const byDex = (n) => Object.keys(SPECIES).find((id) => id !== 'partner' && !SPECIES[id].form && SPECIES[id].dexNo === n);
  const unitIds = Object.keys(SPECIES).filter((id) => id !== 'partner' && !SPECIES[id].form);

  // K5: hub + list on a fresh state.
  game.openDex();
  out.hub = ui.menu.items.slice(0, 7).map((i) => i.label);
  out.itemCount = ui.menu.items.length;
  out.firstRows = ui.menu.items.slice(7, 10).map((i) => i.label);

  // K3: full redaction on a fresh dex.
  out.redactBad = [];
  for (const id of unitIds) {
    const r = game.dexEntryRender(id);
    if (!r.title.endsWith('??? ▶') || r.bodyHtml.includes('dexdesign') || r.bodyHtml.includes('dexareas')
      || r.bodyHtml.includes('dexevo') || !r.bodyHtml.includes('src=""')
      || !r.bodyHtml.includes('No data yet — this Kin has not been seen.')) out.redactBad.push(id);
  }
  // K3: chain-member redaction — only dex 17 known: both neighbours ???.
  st.dex.caught[17] = true; st.dex.seen[17] = true;
  out.evo17partial = line(game.dexEntryRender('pidgeotto').bodyHtml, 'dexevo');
  st.dex.seen[16] = true;
  out.evo17pre = line(game.dexEntryRender('pidgeotto').bodyHtml, 'dexevo');

  // All-caught state for composition + paging.
  for (const id of Object.keys(SPECIES)) { st.dex.caught[SPECIES[id].dexNo] = true; st.dex.seen[SPECIES[id].dexNo] = true; }
  game.openDex();
  out.voltikRow = (ui.menu.items.find((i) => i.value === 'pikachu') || {}).label;

  // K2: compose every record; digest the three W14 lines.
  out.threw = [];
  out.dig = {};
  for (const id of Object.keys(SPECIES)) {
    try {
      const r = game.dexEntryRender(id);
      out.dig[id] = { title: r.title, design: line(r.bodyHtml, 'dexdesign'), areas: line(r.bodyHtml, 'dexareas'), evo: line(r.bodyHtml, 'dexevo') };
    } catch (e) { out.threw.push(id + ': ' + e.message); }
  }

  // K4: paging.
  out.order = game.dexEntryOrder(null).map((id) => SPECIES[id].dexNo);
  out.selfBad = [];
  for (const id of unitIds) {
    game.openDexEntry(id);
    if (!ui.entryPanel.data.title.startsWith('◀ No.' + SPECIES[id].dexNo + ' ')) out.selfBad.push(id);
  }
  game.openDexEntry(byDex(493));
  out.open493 = ui.entryPanel.data.title;
  ui.entryPanel.cb('page', 1); out.wrapNext = ui.entryPanel.data.title;
  ui.entryPanel.cb('page', -1); out.wrapBack = ui.entryPanel.data.title;
  game.openDex({ type: 'electric' });
  const elist = ui.menu.items.map((i) => i.value).filter((v) => v && SPECIES[v]);
  out.electricList = elist.map((id) => SPECIES[id].dexNo);
  game.openDexEntry(elist[0], { type: 'electric' });
  const titleNo = () => Number(ui.entryPanel.data.title.match(/No\.(\d+)/)[1]);
  const seq = [titleNo()];
  for (let i = 1; i < elist.length; i++) { ui.entryPanel.cb('page', 1); seq.push(titleNo()); }
  out.electricSeq = seq;
  game.openDexEntry(byDex(493), { type: 'electric' });
  out.fallback493 = ui.entryPanel.data.title;
  game.openDexEntry('partner');
  out.openPartner = ui.entryPanel.data.title;
  const forme = Object.keys(SPECIES).find((id) => SPECIES[id].form);
  game.openDexEntry(forme);
  out.openForme = ui.entryPanel.data.title;
  out.formeBase = SPECIES[SPECIES[forme].baseSpecies].dexNo;
  console.log('KINDEX-RESULT ' + JSON.stringify(out));
})();`;
const gameJs = buildGameJs();
try { eval(gameJs + driver); } finally { console.log = origLog; }
const resultLine = src.split('\n').find((l) => l.startsWith('KINDEX-RESULT '));
ok('driver completed', !!resultLine);
const R = resultLine ? JSON.parse(resultLine.slice('KINDEX-RESULT '.length)) : {};

// ---------- K2 assertions ----------
ok('K2 all 509 records compose without error', (R.threw || ['x']).length === 0, (R.threw || []).slice(0, 3).join('; '));
const dig = R.dig || {};
let designBad = [], areasBad = [], evoBad = [];
for (const u of designUnits) {
  const d = dig[u.id] || {};
  if (d.design !== 'Design: ' + u.design.inspired + ' — ' + u.design.note) designBad.push(u.id);
}
for (const u of units) {
  const d = dig[u.id] || {};
  if (d.areas !== expectedAreasLine(u.id)) areasBad.push(u.id);
  if (d.evo !== expectedEvoLine(u.id)) evoBad.push(u.id);
}
ok('K2 design line byte-equal to the design feed for all 508 units', designBad.length === 0, designBad.slice(0, 5).join(','));
ok('K2 areas line byte-equal to re-derivation for all 493 units (omitted when none)', areasBad.length === 0, areasBad.slice(0, 5).join(','));
ok('K2 evo line byte-equal to re-derivation for all 493 units (omitted when no chain)', evoBad.length === 0, evoBad.slice(0, 5).join(','));
ok('K2 partner entry design line is the VOLTIK line (D6 fold)', !!dig.partner && dig.partner.design === dig.pikachu.design
  && dig.partner.title === dig.pikachu.title, dig.partner && dig.partner.title);

// ---------- K3 assertions ----------
ok('K3 fresh-dex entries fully redacted for all 493 units', (R.redactBad || ['x']).length === 0, (R.redactBad || []).slice(0, 5).join(','));
ok('K3 unseen chain members render ??? (both neighbours)', R.evo17partial === 'Evolves: ← ??? · → ??? at Lv 36', R.evo17partial);
ok('K3 seen pre-evolution names, unseen evolution stays ???', R.evo17pre === 'Evolves: ← DUNPLUME · → ??? at Lv 36', R.evo17pre);

// ---------- K4 assertions ----------
ok('K4 entry order is 493 long', (R.order || []).length === 493, (R.order || []).length);
ok('K4 entry order strictly dexNo-ascending 1..493', (R.order || []).every((n, i) => n === i + 1));
ok('K4 every unit opens on itself (493/493, incl. all >151)', (R.selfBad || ['x']).length === 0, (R.selfBad || []).slice(0, 5).join(','));
ok('K4 dexNo 493 opens on itself', R.open493 === '◀ No.493 PRIMARCH ▶', R.open493);
ok('K4 paging wraps 493 -> 1 -> 493', R.wrapNext === '◀ No.1 BUDDIN ▶' && R.wrapBack === '◀ No.493 PRIMARCH ▶', R.wrapNext + ' / ' + R.wrapBack);
ok('K4 filtered paging walks the filtered list order exactly', JSON.stringify(R.electricSeq) === JSON.stringify(R.electricList),
  JSON.stringify(R.electricSeq) + ' vs ' + JSON.stringify(R.electricList));
ok('K4 filtered-out species opens on itself via the full order', R.fallback493 === '◀ No.493 PRIMARCH ▶', R.fallback493);
ok('K4 partner opens the VOLTIK entry', R.openPartner === '◀ No.25 VOLTIK ▶', R.openPartner);
ok('K4 forme opens its base unit entry', typeof R.formeBase === 'number' && (R.openForme || '').startsWith('◀ No.' + R.formeBase + ' '), R.openForme);

// ---------- K5 assertions ----------
ok('K5 hub labels byte-pinned (fresh state)', JSON.stringify(R.hub) === JSON.stringify([
  'Journey — Ch.1 · The Crown League',
  'Regional — Arden: 0/151',
  'National — Grand horizon: 0/493 (0%)',
  'Areas — caught per area',
  'Search / Filter',
  "Prof. Hawthorn's rating",
  'Caught 0 / 1025 (tracked)',
]), JSON.stringify(R.hub));
ok('K5 list carries 502 rows (7 hub + 493 species + divider + Close)', R.itemCount === 502, R.itemCount);
ok('K5 species-row labels unchanged (redacted samples)', JSON.stringify(R.firstRows) === JSON.stringify(['No.16 ??? [???]', 'No.19 ??? [???]', 'No.10 ??? [???]']), JSON.stringify(R.firstRows));
ok('K5 species-row label known form unchanged', R.voltikRow === 'No.25 VOLTIK [CAUGHT]', R.voltikRow);
}

console.log(`\nkindex-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
