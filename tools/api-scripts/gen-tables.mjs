// gen-tables.mjs — emit api/_lib/data/tables.json from the game's data modules.
// Run from the repo root: `node tools/api-scripts/gen-tables.mjs` (writes the
// snapshot) or `node tools/api-scripts/gen-tables.mjs --check` (CI: fail if
// the committed snapshot does not match the current src/data — the
// validator's pinning contract).
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
// Repaired 2026-10-27 (Rejuvenation Phase 1): this pointed at
// tools/lib/data since the api/lib -> api/_lib move, so regeneration had
// been silently impossible; the validator reads api/_lib/data/tables.json.
const OUT = join(ROOT, 'api', '_lib', 'data', 'tables.json');

const { SPECIES } = await import(join(ROOT, 'src', 'data', 'species.mjs'));
const { SPECIES2 } = await import(join(ROOT, 'src', 'data', 'species2.mjs'));
const { SPECIES_JOHTO } = await import(join(ROOT, 'src', 'data', 'species3.mjs'));
const { SPECIES_HOENN } = await import(join(ROOT, 'src', 'data', 'species4.mjs'));
const { SPECIES_SINNOH } = await import(join(ROOT, 'src', 'data', 'species5.mjs'));
const { MOVES } = await import(join(ROOT, 'src', 'data', 'moves.mjs'));
const { MOVES2 } = await import(join(ROOT, 'src', 'data', 'moves2.mjs'));
const { ITEMS, BALLS, KEEPSAKES, BADGE_SETS } = await import(join(ROOT, 'src', 'data', 'items.mjs'));
const { CONTEST_RIBBONS } = await import(join(ROOT, 'src', 'data', 'contest.mjs'));
const { PIKE_EVENT_KINDS } = await import(join(ROOT, 'src', 'data', 'frontier.mjs'));
const { ORANGE_QUESTS, ORANGE_LEGENDARY_ARCS } = await import(join(ROOT, 'src', 'data', 'story-orange.mjs'));
const { JOHTO_QUESTS, JOHTO_TALES, JOHTO_LEGENDARY_ARCS } = await import(join(ROOT, 'src', 'data', 'story-johto.mjs'));
const { HOENN_QUESTS, HOENN_TALES } = await import(join(ROOT, 'src', 'data', 'story-hoenn.mjs'));
const { FORMS } = await import(join(ROOT, 'src', 'data', 'forms.mjs'));
const { MAIN_QUESTS, LEGENDARY_ARCS } = await import(join(ROOT, 'src', 'data', 'story-kanto.mjs'));
const { QUESTS: TOWN_TALES } = await import(join(ROOT, 'src', 'data', 'quests.mjs'));
const { ARCS, levelCapFor, xpCeilingFor } = await import(join(ROOT, 'src', 'data', 'arcs.mjs'));
const { SCHEMA_VERSION } = await import(join(ROOT, 'src', 'game', 'state.mjs'));

const ALL_SPECIES = { ...SPECIES, ...SPECIES2, ...SPECIES_JOHTO, ...SPECIES_HOENN, ...SPECIES_SINNOH };
const ALL_MOVES = { ...MOVES, ...MOVES2 };

// Canonical badge earn-order per region: the campaign's story order (ADR-019),
// NOT an alphabetical sort. The validator enforces "prefix of the earn order"
// (no badge #N without #1..N-1) against this list.
// Stage O2: earn orders are read from the game's own BADGE_SETS table
// (src/data/items.mjs) — the single source the leader award path and
// the Cheat Terminal also read, so the validator can never drift.
const KANTO_EARN_ORDER = BADGE_SETS.kanto;
const KNOWN_BADGES = KANTO_EARN_ORDER.filter((id) => ITEMS[id]);
const ORANGE_EARN_ORDER = (BADGE_SETS.orange || []).filter((id) => ITEMS[id]);
const JOHTO_EARN_ORDER = (BADGE_SETS.johto || []).filter((id) => ITEMS[id]);
const HOENN_EARN_ORDER = (BADGE_SETS.hoenn || []).filter((id) => ITEMS[id]);
const SINNOH_EARN_ORDER = (BADGE_SETS.sinnoh || []).filter((id) => ITEMS[id]);

const tables = {
  schemaVersion: SCHEMA_VERSION,
  species: Object.keys(ALL_SPECIES).sort(),
  moves: Object.keys(ALL_MOVES).sort(),
  items: Object.keys(ITEMS).sort(),
  // ADR-025 §3 (Phase 3): the closed keepsake id set — the validator
  // accepts mon.keepsake only from this list (never a generic item id).
  keepsakes: Object.keys(KEEPSAKES).sort(),
  // Stage H5: the closed contest-ribbon id set (the four hall ids) —
  // the validator accepts state.contest.ribbons only from this list.
  ribbons: [...CONTEST_RIBBONS],
  // Arc 3.5 Stage F2: the Frontier facility id list, emitted from
  // BADGE_SETS.symbols (the slot order — the single source; the
  // server validator's state.frontier shape check is data-driven
  // from this array), and the closed Pike event-category list
  // (src/data/frontier.mjs PIKE_EVENT_KINDS).
  frontierFacilities: [...BADGE_SETS.symbols],
  frontierPikeEvents: [...PIKE_EVENT_KINDS],
  balls: Object.keys(BALLS).sort(),
  forms: (Array.isArray(FORMS) ? FORMS.map((f) => f.id) : Object.keys(FORMS)).sort(),
  quests: [...MAIN_QUESTS.map((q) => q.id), ...ORANGE_QUESTS.map((q) => q.id), ...JOHTO_QUESTS.map((q) => q.id), ...HOENN_QUESTS.map((q) => q.id), ...Object.keys(LEGENDARY_ARCS), ...Object.keys(ORANGE_LEGENDARY_ARCS || {}), ...Object.keys(JOHTO_LEGENDARY_ARCS || {}), ...Object.keys(TOWN_TALES), ...Object.keys(JOHTO_TALES), ...Object.keys(HOENN_TALES)].sort(),
  regions: ['kanto', 'orange', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea', 'liko'],
  // ADR-027 (Stage F): the closed arc-id vocabulary — the validator
  // accepts story.arc / story.arc_directive only from the registry.
  arcs: ARCS.map((a) => a.id),
  // Arc 3.5 Stage F5-fix: the closed story.regionsDone vocabulary —
  // the completionKey of EVERY ARCS row, emitted from the registry
  // (the J0 gen-tables precedent: the registry is the single source).
  // This set is NOT the regions list above: regionsDone carries
  // completionKeys, and an arc's completionKey is not always a region
  // name — the Frontier arc's regionKey is 'kanto' but its
  // completionKey is 'frontier', so the hardcoded regions list (which
  // has no 'frontier', and carries non-arc names like 'galar') could
  // never accept a real Frontier-complete save. The validator's
  // regionsDone membership check reads THIS set; its story.region
  // check keeps reading `regions` above, unchanged.
  regionsDoneKeys: ARCS.map((a) => a.completionKey),
  // ADR-027 Amendment 2 (Stage J0): per-arc level bands for the save
  // validator — the band max (the mon level cap for a save whose
  // story.arc is that arc) and the paired XP ceiling, both evaluated
  // through the registry's own levelCapFor / xpCeilingFor on a
  // minimal { story: { arc } } state per row, so the emitted numbers
  // ARE the client's derivation and cannot drift from it. An
  // open-level band (the Frontier) emits null for both — the
  // validator reads null as "no cap" (its Infinity equivalent in
  // JSON). Min level stays 1 everywhere and is not emitted.
  arcBandMax: Object.fromEntries(ARCS.map((a) => {
    const cap = levelCapFor({ story: { arc: a.id } });
    return [a.id, Number.isFinite(cap) ? cap : null];
  })),
  arcXpCeiling: Object.fromEntries(ARCS.map((a) => {
    const ceiling = xpCeilingFor({ story: { arc: a.id } });
    return [a.id, Number.isFinite(ceiling) ? ceiling : null];
  })),
  // Ordered earn sequences.
  // Stage F0: BADGE_SETS.symbols is deliberately NOT emitted here and
  // gets no regionBadgeMax row — symbols are unordered facility SLOTS
  // (null | 'silver' | 'gold'), not an earn sequence, so there is no
  // prefix for the validator to check; it tier-checks the slots
  // directly in checkBadges. (The symbols facility list also cannot
  // pass the ITEMS filter above: its entries are facility ids, not
  // the '<name>symbol' item ids.)
  badgeSequences: {
    kanto: KNOWN_BADGES,
    orange: ORANGE_EARN_ORDER,
    johto: JOHTO_EARN_ORDER,
    hoenn: HOENN_EARN_ORDER,
    sinnoh: SINNOH_EARN_ORDER,
  },
  regionBadgeMax: { kanto: 8, orange: 4, johto: 8, hoenn: 8, sinnoh: 8 },
};

const canonical = JSON.stringify(tables);
const tablesVersion = createHash('sha256').update(canonical, 'utf8').digest('hex');
const snapshot = { tablesVersion, ...tables };

if (process.argv.includes('--check')) {
  const committed = JSON.parse(readFileSync(OUT, 'utf8'));
  if (committed.tablesVersion !== tablesVersion) {
    console.error(
      `tables.json is STALE: committed ${committed.tablesVersion.slice(0, 12)}… != ` +
      `generated ${tablesVersion.slice(0, 12)}…. Run: node tools/api-scripts/gen-tables.mjs`,
    );
    process.exit(1);
  }
  console.log(`tables.json OK (${tablesVersion.slice(0, 12)}…, ${tables.species.length} species, ${tables.moves.length} moves, ${tables.items.length} items)`);
} else {
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`wrote ${OUT} (${tablesVersion.slice(0, 12)}…)`);
}
