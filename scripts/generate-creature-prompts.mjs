// generate-creature-prompts.mjs — regenerates the owner-facing creature
// prompt pack (~/workspace/your_files/CREATURE-PROMPTS.md) from the species
// records' `design` fields. Wave W13-T4 (Director ruling: Option C — design
// lives in game data; the pack is a generated view of it, so the two can
// never drift again).
//
//   node scripts/generate-creature-prompts.mjs            regenerate the pack
//   node scripts/generate-creature-prompts.mjs --check    exit 1 if the pack
//                                                         on disk differs from
//                                                         what the data generates
//   ... --out PATH                                        override the target
//
// The pack lives OUTSIDE the repo, so CI cannot gate on it; this script's
// --check mode is the drift check (run it after any design-data change).
// The CI-held structural fact remains tests/design-depth-checks.mjs.
//
// Determinism: the output is a pure function of the five species modules —
// no clock, no randomness, code-point sort only. Same data, same bytes.
//
// Entry shape (the 135 FULL Arden entries' shape, W13 plan §3):
//   ### NAME — Type / Type (KinDex #N[, forme record])
//   <boilerplate>NAME — a Type Kin inspired by the <slot>, <design clause>.
//   <boilerplate tail>
// where <slot> is design.inspired — except the LEGACY SEAM below.
//
// LEGACY SEAM (transcription fidelity, disclosed): 28 of the archived
// Wave G clauses name a BODY PLAN in the "inspired by the …" slot
// ("inspired by the upright creature, plump cream moon-sprite, …").
// When T0 backfilled those clauses into data it set design.inspired from
// the clause's own lead noun (its disclosed derivation), so the archived
// wording is only reproducible by re-emitting the body-plan noun for
// exactly those records. LEGACY_SEAM_IDS pins the 28 record ids; the
// slot noun itself is derived from the record's own `body` field via
// BODY_PLAN_NOUN. The W13-T4 proof run verifies all 135 archived bodies
// byte-identical, so a wrong entry in this table fails loudly there.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const { SPECIES } = await import(join(ROOT, 'src/data/species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src/data/species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src/data/species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src/data/species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src/data/species5.mjs'));
const ALL = { ...SPECIES, ...SPECIES2, ...SPECIES_JOHTO, ...SPECIES_HOENN, ...SPECIES_SINNOH };
const records = Object.values(ALL);

// The partner fold: one pack entry covers VOLTIK's partner + wild records.
const units = records.filter((r) => r.id !== 'partner');
// Pack order: KinDex order; a base species before its formes; formes of
// one base in name order (code-point, locale-independent).
units.sort((a, b) =>
  a.dexNo - b.dexNo ||
  (a.form ? 1 : 0) - (b.form ? 1 : 0) ||
  (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

const REGIONS = [
  { name: 'Arden', from: 1, to: 151 },
  { name: 'Yamato', from: 152, to: 251 },
  { name: 'Maris', from: 252, to: 386 },
  { name: 'Borea', from: 387, to: 493 },
];

const BODY_PLAN_NOUN = {
  biped: 'upright creature',
  blob: 'amorphous creature',
  quad: 'four-legged beast',
};
const LEGACY_SEAM_IDS = new Set([
  'clefairy', 'clefable', 'abra', 'kadabra', 'alakazam', 'machop',
  'machoke', 'machamp', 'tentacruel', 'graveler', 'golem', 'magneton',
  'grimer', 'muk', 'haunter', 'electrode', 'marowak', 'hitmonlee',
  'hitmonchan', 'weezing', 'rhydon', 'chansey', 'starmie', 'jynx',
  'tauros', 'ditto', 'kabutops', 'mew',
]);

const HEADER = `# Kian’s Journey — Creature Prompt Pack (the Kin roster)

**How to use this pack (3 lines):**
1. Paste ONE prompt per image generation — each prompt is fully self-contained, so every creature can be generated on its own.
2. Keep the same conversation and style settings for the whole set if you can, so all sprites come back in one consistent look (see the game’s Graphics & Visual Spec, sections 4–5).
3. Send the images back named by the heading — each returned image becomes that creature’s approved design reference.

This pack covers the full Kin roster: 509 species records in the game’s data (493 KinDex numbers, 15 of them distinct forme records). VOLTIK appears once — one entry covers both its partner record and its wild record, one creature with one design. Every design here is original to this game.

---

# The Kin roster`;

const BODY_PREFIX = 'Pixel art creature battle sprites for a 2D monster-taming RPG: front view and back view of the SAME individual, 64x64 pixel canvas each, ';
const BODY_SUFFIX = '16 colours maximum, at least three shading tones, unbroken dark outline, solid readable silhouette, plain flat background, no text, no UI.';

function fail(msg) {
  console.error('generate-creature-prompts: ' + msg);
  process.exit(1);
}

// ---- structural assertions: the generator refuses to emit a pack the
// data cannot support (mirrors the design-depth guard's census).
if (records.length !== 509) fail(`roster is ${records.length} records, expected 509`);
if (units.length !== 508) fail(`design units fold to ${units.length}, expected 508`);
for (const r of units) {
  if (!r.design) fail(`record ${r.id} has no design field (run design-depth-checks)`);
  const d = r.design;
  if (!d.inspired || !d.kind || !d.note) fail(`record ${r.id} has an incomplete design field`);
  if (LEGACY_SEAM_IDS.has(r.id) && !BODY_PLAN_NOUN[r.body]) {
    fail(`legacy-seam record ${r.id} has unmapped body plan '${r.body}'`);
  }
}
for (const id of LEGACY_SEAM_IDS) {
  if (!units.some((r) => r.id === id)) fail(`legacy-seam id ${id} not in the roster`);
}
{
  const seen = new Set();
  for (const r of units) {
    const region = REGIONS.find((g) => r.dexNo >= g.from && r.dexNo <= g.to);
    if (!region) fail(`record ${r.id} (dex ${r.dexNo}) falls outside every region range`);
    if (seen.has(r.id)) fail(`duplicate unit id ${r.id}`);
    seen.add(r.id);
  }
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const typeLine = (r) => r.types.map(cap).join(' / ');
// The pack's article agrees with the first type: "an Electric Kin",
// "an Ice / Psychic Kin", but "a Rock / Ice Kin".
const article = (r) => (/^[aeiou]/i.test(r.types[0]) ? 'an' : 'a');

function entryLines(r) {
  const slot = LEGACY_SEAM_IDS.has(r.id) ? BODY_PLAN_NOUN[r.body] : r.design.inspired;
  const heading = `### ${r.name} — ${typeLine(r)} (KinDex #${r.dexNo}${r.form ? ', forme record' : ''})`;
  // Forme entries keep the pack's forme sentence after the design clause
  // (the archived FULL forme shape), quoting the forme record's own
  // flavour line.
  const formeSentence = r.form ? ` This is a distinct forme of its base species — ${r.flavor}` : '';
  const body = `${BODY_PREFIX}${r.name} — ${article(r)} ${typeLine(r)} Kin inspired by the ${slot}, ${r.design.note}.${formeSentence} ${BODY_SUFFIX}`;
  return [heading, '', '```', body, '```'];
}

function dataNotes() {
  const kindCount = (k) => units.filter((r) => r.design.kind === k).length;
  const nonAnimal = units.filter((r) => ['plant', 'construct', 'cosmic', 'object'].includes(r.design.kind)).length;
  const formes = units.filter((r) => r.form).length;
  return [
    '## Data notes (where each prompt’s design basis came from)',
    '',
    `- Every one of the 509 species records in the game’s data carries a design description — a \`design\` field (inspiration, declared inspiration class, design clause) in \`src/data/species*.mjs\` — and this pack is regenerated from those records by \`scripts/generate-creature-prompts.mjs\`. Re-running the script reproduces this file exactly, so the pack cannot drift from the records. VOLTIK appears once: its partner and wild records share one entry and one design, so 509 records make 508 entries.`,
    `- Declared inspiration classes across the 508 entries: animal ${kindCount('animal')} · animal-class ${kindCount('class')} · plant ${kindCount('plant')} · construct ${kindCount('construct')} · cosmic ${kindCount('cosmic')} · object ${kindCount('object')}.`,
    `- Every clause in this pack is the record’s own design text: the Arden clauses include the archived Wave G design descriptions, held verbatim in the data since the W13 backfill, and the clauses written for Wave W13 were derived from each record’s own sprite, name, types, body plan and flavour line — nothing in any prompt goes beyond what its record shows.`,
    `- For ${nonAnimal} records the honest inspiration is a non-animal register (plant, construct, cosmic or object — the sovereign register the naming law reserves for legendary and mythical Kin), and the prompt names that class rather than forcing an animal onto a design that has none. The ${formes} forme records carry base-relative designs (“same design, …”), matching the art they share with their base species.`,
  ];
}

function generate() {
  const lines = [HEADER];
  for (const g of REGIONS) {
    lines.push('', `## Region — ${g.name}`);
    for (const r of units.filter((u) => u.dexNo >= g.from && u.dexNo <= g.to)) {
      lines.push('', ...entryLines(r));
    }
    lines.push('');
  }
  lines.push('---', '', ...dataNotes());
  return lines.join('\n') + '\n';
}

// ---- main ---------------------------------------------------------------
const args = process.argv.slice(2);
const check = args.includes('--check');
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : join(ROOT, '..', 'your_files', 'CREATURE-PROMPTS.md');

const text = generate();
const sha = createHash('sha256').update(text).digest('hex');
const bytes = Buffer.byteLength(text, 'utf8');

if (check) {
  let current = null;
  try { current = readFileSync(outPath, 'utf8'); } catch { /* missing file */ }
  if (current === text) {
    console.log(`pack is byte-identical to the data (${bytes} B, sha256 ${sha})`);
  } else {
    console.error(`pack DRIFTS from the data: on-disk ${current === null ? 'missing' : Buffer.byteLength(current, 'utf8') + ' B'} vs generated ${bytes} B (sha256 ${sha})`);
    process.exit(1);
  }
} else {
  writeFileSync(outPath, text);
  console.log(`wrote ${outPath} (${bytes} B, sha256 ${sha})`);
}
