// design-depth-checks.mjs — the DESIGN DEPTH guard (War Room E2E Phase 2,
// Wave W13). Run: node tests/design-depth-checks.mjs (exit 1 on any failure).
//
// Why this exists: the roster's design descriptions lived only in the
// owner-facing prompt pack (~/workspace/your_files/CREATURE-PROMPTS.md),
// outside the repo — unverifiable, and free to drift (the W13 census found
// 3 flavour quotes already drifted). W13 lands a `design` field on the
// species records themselves (Director ruling: Option C — data + pack
// regeneration in T4) and this guard makes depth a structural, CI-held
// fact instead of a grading opinion:
//
//   design = { inspired, kind, note }
//     inspired — the inspiration noun (a real noun, never a body-plan
//                phrase like 'upright creature')
//     kind     — the DECLARED inspiration class, one of:
//                animal | animal-class ('class') | plant | construct |
//                cosmic | object. The sovereign/cosmic register (the
//                Naming Law's LEGENDARY/MYTHICAL registers) honestly
//                declares a non-animal class — no animal is ever forced
//                onto a record whose design has none.
//     note     — the design clause: a terse noun-phrase fragment in the
//                135 FULL Arden entries' house shape, 25–120 chars,
//                never the record's own flavour line.
//
// The guard enforces STRUCTURE and DECLARED PROVENANCE only. It never
// polices vocabulary: the W13 census measured 15 of the 135 gold clauses
// containing no colour/anatomy lexicon word at all (TRIMOLE: "three mole
// brothers in a row on one mound"), so a word-list guard would fail the
// gold standard itself. Clause-to-sprite fidelity is graded at merge by
// the Director's eye, the same split as every art wave.
//
// Ratchet (title-guard precedent): DEEP_MISSING pins how many design
// units still lack a `design` field. The count may only shrink, and only
// in the tranche commit that does the deepening — if the measured count
// is BELOW the pin, the pin is stale and this suite fails until the
// tranche lowers it; if it is ABOVE, a deep record regressed or a new
// shallow record appeared, and this suite fails. Schedule:
//   T0 (this wave)  pin 373 — guard + the 135 FULL backfilled verbatim
//   T1              Maris ETYM 117 deepen        -> pin 256
//   T2              stem-anchored THIN 169       -> pin 87
//   T3              no-stem THIN 87              -> pin 0
//   T4              pack regeneration; pin stays 0
//
// The partner fold: the pack carries ONE entry for VOLTIK covering both
// the 'partner' record and the wild record — one creature, one design.
// Design units therefore number 508, not 509: 'partner' folds into the
// wild VOLTIK record, and D6 pins the two records to move together
// (both carry the identical design object, or neither does).

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

const DEEP_MISSING = 373;
const KINDS = new Set(['animal', 'class', 'plant', 'construct', 'cosmic', 'object']);
const BODY_PLAN = /(creature|body plan)/i;

const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
const ALL = { ...SPECIES, ...SPECIES2, ...SPECIES_JOHTO, ...SPECIES_HOENN, ...SPECIES_SINNOH };
const records = Object.values(ALL);

// ---------------- D1: roster census ------------------------------------
ok('D1 merged roster is 509 records', records.length === 509, String(records.length));
const partner = ALL.partner;
const wild = records.find((r) => r.name === (partner && partner.name) && r.id !== 'partner' && !r.form);
ok('D1 partner fold target exists (wild VOLTIK record)', !!wild, partner ? partner.name : 'no partner record');
const units = records.filter((r) => r.id !== 'partner');
ok('D1 design units fold to 508 (partner shares VOLTIK\'s entry)', units.length === 508, String(units.length));

// ---------------- D2: the ratchet --------------------------------------
const lacking = units.filter((r) => !r.design);
ok(`D2 ratchet: design units lacking a design field = pin ${DEEP_MISSING} (T1 burns 117 -> 256, T2 burns 169 -> 87, T3 burns 87 -> 0)`,
  lacking.length === DEEP_MISSING,
  lacking.length > DEEP_MISSING
    ? `measured ${lacking.length} — grew by ${lacking.length - DEEP_MISSING} (regression or new shallow record)`
    : `measured ${lacking.length} — pin is stale; lower DEEP_MISSING in the tranche commit that deepened them`);

// ---------------- D3: structure of every landed design -----------------
const deep = records.filter((r) => r.design);
const badShape = [], badKind = [], badInspired = [], badNoteLen = [], badNoteFlavour = [], badNoteTemplate = [];
for (const r of deep) {
  const d = r.design;
  const keys = Object.keys(d).sort().join(',');
  if (keys !== 'inspired,kind,note' || [d.inspired, d.kind, d.note].some((v) => typeof v !== 'string' || !v.length)) badShape.push(r.id);
  if (!KINDS.has(d.kind)) badKind.push(r.id + ':' + d.kind);
  if (typeof d.inspired === 'string' && BODY_PLAN.test(d.inspired)) badInspired.push(r.id + ':' + d.inspired);
  if (typeof d.note === 'string' && (d.note.length < 25 || d.note.length > 120)) badNoteLen.push(r.id + ':' + d.note.length);
  if (d.note === r.flavor) badNoteFlavour.push(r.id);
  if (typeof d.note === 'string' && d.note.includes('design signature')) badNoteTemplate.push(r.id);
}
ok(`D3 every design has exactly {inspired, kind, note}, all non-empty strings (${deep.length} deep records)`, badShape.length === 0, badShape.slice(0, 5).join(', '));
ok('D3 every kind is a declared inspiration class (animal|class|plant|construct|cosmic|object)', badKind.length === 0, badKind.slice(0, 5).join(', '));
ok('D3 no inspired is a body-plan phrase', badInspired.length === 0, badInspired.slice(0, 5).join(', '));
ok('D3 every note is 25–120 chars (the gold clauses measure 29–80)', badNoteLen.length === 0, badNoteLen.slice(0, 5).join(', '));
ok('D3 no note repeats its record\'s flavour line', badNoteFlavour.length === 0, badNoteFlavour.slice(0, 5).join(', '));
ok('D3 no note carries template leakage (\'design signature\')', badNoteTemplate.length === 0, badNoteTemplate.slice(0, 5).join(', '));

// ---------------- D4: no duplicate clauses ------------------------------
const notes = deep.map((r) => r.design.note);
ok('D4 design notes are pairwise unique across the roster', new Set(notes).size === notes.length,
  `${notes.length - new Set(notes).size} duplicate(s)`);

// ---------------- D5: formes are base-relative or independent ----------
const badForme = [];
for (const r of deep.filter((r) => r.form)) {
  const base = records.find((b) => !b.form && b.dexNo === r.dexNo);
  if (r.design.note.startsWith('same design')) continue;
  if (base && base.design && base.design.note === r.design.note) badForme.push(r.id);
}
ok('D5 forme designs are base-relative deltas (\'same design, …\') or independent of the base clause', badForme.length === 0, badForme.slice(0, 5).join(', '));

// ---------------- D6: the partner fold moves together -------------------
const pHas = !!(partner && partner.design);
const wHas = !!(wild && wild.design);
ok('D6 partner and wild VOLTIK carry design together or not at all',
  pHas === wHas && (!pHas || JSON.stringify(partner.design) === JSON.stringify(wild.design)),
  `partner=${pHas} wild=${wHas}`);

console.log(`\ndesign-depth-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
