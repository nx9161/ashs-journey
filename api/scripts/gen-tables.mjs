// gen-tables.mjs — emit api/lib/data/tables.json from the game's data modules.
// Run from the repo root: `node api/scripts/gen-tables.mjs` (writes the snapshot)
// or `node api/scripts/gen-tables.mjs --check` (CI: fail if the committed snapshot
// does not match the current src/data — the validator's pinning contract).
//
// tablesVersion = sha256 over the canonical serialization of the tables. The
// validator recomputes it at startup and fails closed on any skew, so the API
// can never validate saves against a stale or hand-edited table set.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, '..', 'lib', 'data', 'tables.json');

const { SPECIES } = await import(join(ROOT, 'src', 'data', 'species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src', 'data', 'species2.mjs'));
const { MOVES } = await import(join(ROOT, 'src', 'data', 'moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src', 'data', 'moves2.mjs'));
const { ITEMS, BALLS } = await import(join(ROOT, 'src', 'data', 'items.mjs'));
const { FORMS } = await import(join(ROOT, 'src', 'data', 'forms.mjs'));
const { QUESTS, LEGENDARY_ARCS } = await import(join(ROOT, 'src', 'data', 'story-kanto.mjs'));
const { SCHEMA_VERSION } = await import(join(ROOT, 'src', 'game', 'state.mjs'));

const ALL_SPECIES = { ...SPECIES, ...SPECIES2 };
const ALL_MOVES = { ...MOVES, ...MOVES2 };

// Canonical badge earn-order per region: the campaign's story order (ADR-019),
// NOT an alphabetical sort. The validator enforces "prefix of the earn order"
// (no badge #N without #1..N-1) against this list.
const KANTO_EARN_ORDER = ['boulderbadge', 'cascadebadge', 'thunderbadge', 'rainbowbadge', 'soulbadge', 'marshbadge', 'volcanobadge', 'earthbadge'];
const KNOWN_BADGES = KANTO_EARN_ORDER.filter((id) => ITEMS[id]);

const tables = {
  schemaVersion: SCHEMA_VERSION,
  species: Object.keys(ALL_SPECIES).sort(),
  moves: Object.keys(ALL_MOVES).sort(),
  items: Object.keys(ITEMS).sort(),
  balls: Object.keys(BALLS).sort(),
  forms: (Array.isArray(FORMS) ? FORMS.map((f) => f.id) : Object.keys(FORMS)).sort(),
  quests: [...QUESTS.map((q) => q.id), ...Object.keys(LEGENDARY_ARCS)].sort(),
  regions: ['kanto', 'orange', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea', 'liko'],
  // Ordered earn sequences.
  badgeSequences: {
    kanto: KNOWN_BADGES,
    orange: [],
    johto: [],
  },
  regionBadgeMax: { kanto: 8, orange: 4, johto: 8 },
};

const canonical = JSON.stringify(tables);
const tablesVersion = createHash('sha256').update(canonical, 'utf8').digest('hex');
const snapshot = { tablesVersion, ...tables };

if (process.argv.includes('--check')) {
  const committed = JSON.parse(readFileSync(OUT, 'utf8'));
  if (committed.tablesVersion !== tablesVersion) {
    console.error(
      `tables.json is STALE: committed ${committed.tablesVersion.slice(0, 12)}… != ` +
      `generated ${tablesVersion.slice(0, 12)}…. Run: node api/scripts/gen-tables.mjs`,
    );
    process.exit(1);
  }
  console.log(`tables.json OK (${tablesVersion.slice(0, 12)}…, ${tables.species.length} species, ${tables.moves.length} moves, ${tables.items.length} items)`);
} else {
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`wrote ${OUT} (${tablesVersion.slice(0, 12)}…)`);
}
