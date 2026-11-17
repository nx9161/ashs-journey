// branding-checks.mjs — the KIN branding guard (companion to the Wave G
// name-registry suite; run the same way: node tests/branding-checks.mjs).
//
// The generic class noun for the creatures is KIN (owner branding call,
// 2026-11-12). W-SCRUB (owner order, 2026-11-13) then removed EVERY
// remaining franchise name from display text — people, teams, places,
// species formes, media titles, the legal screen itself. What survives
// is only the exact allowlisted line below (a functional CC-BY citation
// URL), plus internal identifiers and code comments, which this suite
// never scans (it reads string literals only, and skips literals whose
// whole content is an internal token). Any NEW display occurrence of a
// blocklisted term in a string literal fails here, so the franchise
// cannot creep back.
//
// The sweep that established this state: branch branding-kin-sweep
// (212 display lines / 222 replacements; residual census zero).

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('pass  ' + name); }
  else { fail++; console.log('FAIL  ' + name + (extra ? ' — ' + extra : '')); }
}

// ---- the allowlist: exact (file, line-text) exemptions ----
// W-SCRUB (2026-11-13) removed the last two exemption classes of the
// 2026-11-12 sweep on the owner's direct order: the legal screen no
// longer names any franchise (it was reworded to a generic
// original-work notice), and story.mjs no longer references real media
// titles (its codex now names original in-world media). One allowlisted
// line remains: the CC-BY credit URL of the Gassasin tileset — a
// functional citation link to the source page, not franchise copy.
const ALLOW = [
  // file, exact trimmed line content
  ['src/game/title.mjs', "'(opengameart.org/content/16xx16-tileset-pokemonzelda-styled),',"],
];
const allowSet = new Set(ALLOW.map(([f, t]) => f + '|' + t));

// String literals whose whole content is an internal token (ids, map
// keys, mechanics tags, menu values) are identifiers, not display copy.
const INTERNAL_STRINGS = new Set(['pokemon', 'pokemon-league', 'gift-pokemon']);

// The franchise terms, in every form the census found them: plain,
// accented, and the escaped-unicode literal form used by title/story.
const TERM_RE = /pokemon|pokédex|pokedex|pok\\u00e9mon/i;

function cutComment(line) {
  // Drop a // comment tail: the first // encountered outside a string.
  let q = null;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (q) {
      if (c === '\\') { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '/' && line[i + 1] === '/') return line.slice(0, i);
  }
  return line;
}

function stringSegments(line) {
  const segs = [];
  let cur = '', q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      cur += c;
      if (c === '\\') { if (i + 1 < line.length) cur += line[++i]; continue; }
      if (c === q) { q = null; segs.push(cur); cur = ''; }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { q = c; cur = c; continue; }
  }
  return segs;
}

const files = execSync('grep -rlin -E "pokemon|pokedex|pok\\\\u00e9mon" src/ --include="*.mjs"',
  { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);

let violations = 0, scanned = 0;
for (const rel of files) {
  const raw = execSync(`grep -in -E "pokemon|pokedex|pok\\\\u00e9mon" "${rel}"`,
    { cwd: ROOT, encoding: 'utf8' });
  for (const entry of raw.split('\n')) {
    if (!entry.trim()) continue;
    const m = entry.match(/^(\d+):(.*)$/s);
    if (!m) continue;
    const text = cutComment(m[2]);
    const trimmed = m[2].trim();
    if (allowSet.has(rel + '|' + trimmed)) continue;
    for (const seg of stringSegments(text)) {
      const inner = seg.slice(1, -1);
      if (INTERNAL_STRINGS.has(inner)) continue;
      if (TERM_RE.test(inner)) {
        violations++;
        console.log(`  violation ${rel}:${m[1]} :: ${trimmed.slice(0, 130)}`);
      }
    }
    scanned++;
  }
}
ok('no display Pokemon/Pokémon/Pokedex outside the allowlist', violations === 0,
  violations + ' violation(s) over ' + scanned + ' scanned lines');

// The allowlist itself must stay honest: every entry must still exist
// verbatim (a legal line that moved or was edited must be re-reviewed,
// not silently un-guarded).
import { readFileSync } from 'node:fs';
for (const [f, t] of ALLOW) {
  const content = readFileSync(path.join(ROOT, f), 'utf8');
  ok(`allowlisted line intact in ${f}`, content.split('\n').some(l => l.trim() === t), t.slice(0, 60));
}

// ---- species flavour text: the retired CREATURE NAMES guard ----
// The sweep above covers the franchise TERMS (Pokemon/Pokedex). This
// section covers the retired creature NAMES themselves in the one
// prose field species records ship: flavour text (KinDex display copy,
// so display rules apply in full). The retired list is DERIVED from the
// name registry's species keys, so a species added to the roster guards
// its own retired name automatically. Internal identifiers are NOT
// scanned — record ids, evolution targets, baseSpecies and egg tokens
// keep the franchise slugs under the standing rule (ids are exempt;
// display text is not). This reads record flavour/description fields
// only: values, never keys.
// Added by the flavour sweep (wave-flavour-sweep, 2026-11-12), which
// found 12 shipped flavour lines still naming retired creatures.
import { NAME_REGISTRY } from '../src/data/name-registry.mjs';
import { SPECIES } from '../src/data/species.mjs';
import { SPECIES2 } from '../src/data/species2.mjs';
import { SPECIES_JOHTO } from '../src/data/species3.mjs';
import { SPECIES_HOENN } from '../src/data/species4.mjs';
import { SPECIES_SINNOH } from '../src/data/species5.mjs';

// Registry keys that are NOT retired creature names: 'partner' is this
// game's own partner-slot id, and the word is ordinary prose ('It
// steadies its partner's sparks').
const NON_CREATURE_KEYS = new Set(['partner']);
// Retired names that are also ordinary English words: prose use is not
// a creature reference (standing example, SUNBLOSS: 'under gloom it
// keeps its counsel'). Exempt as words, documented here so the
// exemption is a decision, not a hole.
const COMMON_WORD_EXEMPT = new Set(['gloom']);
// Prose spellings that differ from the registry slug.
const PROSE_FORMS = {
  nidoranf: ['Nidoran'], nidoranm: ['Nidoran'],
  farfetchd: ["Farfetch'd"],
  mrmime: ['Mr. Mime', 'Mr Mime'],
  mimejr: ['Mime Jr.', 'Mime Jr'],
  hooh: ['Ho-Oh'],
  porygonz: ['Porygon-Z'],
};
const retiredSurfaces = new Set();
for (const key of Object.keys(NAME_REGISTRY.species)) {
  if (NON_CREATURE_KEYS.has(key) || COMMON_WORD_EXEMPT.has(key)) continue;
  retiredSurfaces.add(key);
  retiredSurfaces.add(key.charAt(0).toUpperCase() + key.slice(1));
  for (const f of (PROSE_FORMS[key] || [])) retiredSurfaces.add(f);
}
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RETIRED_RE = new RegExp(
  '(?<![A-Za-zÀ-ÖØ-öø-ÿ])(' +
  [...retiredSurfaces].sort((a, b) => b.length - a.length).map(escRe).join('|') +
  ')(?![A-Za-zÀ-ÖØ-öø-ÿ])', 'gi');

let flavourViolations = 0, flavourScanned = 0;
for (const table of [SPECIES, SPECIES2, SPECIES_JOHTO, SPECIES_HOENN, SPECIES_SINNOH]) {
  for (const rec of Object.values(table)) {
    for (const field of ['flavor', 'description', 'desc']) {
      const text = rec[field];
      if (typeof text !== 'string') continue;
      flavourScanned++;
      for (const m of text.matchAll(RETIRED_RE)) {
        flavourViolations++;
        console.log(`  flavour violation ${rec.id} (${rec.name}) :: "${m[0]}" in "${text.slice(0, 110)}"`);
      }
    }
  }
}
ok('no retired creature names in species flavour text', flavourViolations === 0,
  flavourViolations + ' violation(s) over ' + flavourScanned + ' scanned flavour fields');

// ---- W-SCRUB: the franchise-name blocklist (display string literals) ----
// Every proper name the scrub removed (table:
// ~/workspace/muse-directive/W-SCRUB-RENAME-TABLE.md) is pinned here in
// its Title-case and ALL-CAPS display forms. Documented keeps are
// exempted per segment below: Drake's Den is a place (the drake's den),
// the Magma Stone / Magma-red / "Magma inside" are the rock not the org,
// one "Dawn" is the time of day and the Dawn Flute / Altar of the Dawn
// are in-world names built on that same time word, one "May" is the
// modal verb in a Frontier Brain's blessing, the ASH FIELDS / ASH
// COLLECTOR / ASHA strings are volcanic-ash places and professions,
// "Ash on the windows" / "Ash and empty shelf" are the noun ash, and
// "Silver" survives only as the Frontier symbol tier (the rendered
// SILVER word and Sutter's "Silver is a Brain respecting you") — the
// rival is Riven.
//
// W-SCRUB2 (2026-11-13) adds two terms the first scrub's segment scan
// missed: 'Platinum' (the dex-horizon / diploma display copy now reads
// "Grand") and 'Track B' (the internal account-system codename that
// leaked into the Trainer ID Terminal stub and two menu labels; player
// copy now says "a later update"). Scoping: this suite scans string
// literals under src/ only, so the tests/ Track B integration-gate
// infrastructure (tests/track-b, run-checks labels) is never scanned
// and keeps its codename. 'Platinum' exemptions (in blockExempt below)
// cover only the HM_GRANTS source-provenance strings in items.mjs, a
// data field no game code renders (only .item/.badge/.move are read).
// Internal identifiers (PLATINUM_DEX_HORIZON, platinum_diploma,
// checkPlatinumDiploma) are code, not literals, and stay untouched by
// design.
//
// W-SCRUB3 (2026-11-13) REMOVED the W-SCRUB2 edition exemption: the
// arcs table's governing-edition labels are display copy after all
// (main-systems renders them into the quest log), and franchise game
// titles are not edition labels. Every arc edition in
// src/data/arcs.mjs is now an original label derived from the arc's own
// region and story, pinned exactly by the W-SCRUB3 check at the bottom
// of this suite; the blocklist scan has NO edition exemption anymore,
// so an old title returning as a string literal fails both checks.
const BLOCK_TERMS = [
  'Ash', 'ASH', 'Pikachu', 'Gary', 'Oak', 'Brock', 'Misty', 'Surge', 'Erika',
  'Koga', 'Janine', 'Sabrina', 'Blaine', 'Giovanni', 'Lorelei', 'Bruno',
  'Agatha', 'Lance', 'Bill', 'Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck',
  'Jasmine', 'Pryce', 'Clair', 'Silver', 'Archer', 'Ariana', 'Petrel',
  'Proton', 'Kurt', 'Roxanne', 'Brawly', 'Wattson', 'Flannery', 'Norman',
  'Winona', 'Tate', 'Liza', 'Wallace', 'Juan', 'Steven', 'Brendan', 'May',
  'Wally', 'Maxie', 'Archie', 'Tabitha', 'Courtney', 'Matt', 'Shelly',
  'Stern', 'Roark', 'Gardenia', 'Maylene', 'Fantina', 'Byron', 'Candice',
  'Volkner', 'Dawn', 'Paul', 'Buck', 'Cissy', 'Danny', 'Rudy', 'Luana',
  'Drake', 'Elm', 'Birch', 'Rowan', 'Ivy', 'Cozmo', 'Scott', 'Spencer',
  'Noland', 'Greta', 'Tucker', 'Lucy', 'Anabel', 'Brandon', 'Cyrus', 'Mars',
  'Jupiter', 'Saturn', 'Tobias', 'Karen', 'Aaron', 'Bertha', 'Lucian',
  'Cynthia', 'Sidney', 'Phoebe', 'Glacia', 'Lucas', 'Charon', 'Looker',
  'Delia', 'Tracey', 'Jessie', 'James', 'Unova', 'Kalos', 'Alola', 'Hisuian',
  'Galarian', 'Alolan', 'Paldean', 'Apricorn', 'apricorn', 'Rocket',
  'Galactic', 'Magma', 'Celebi', 'Lucario', 'Darkrai', 'Giratina', 'Arceus',
  'Victini', 'Reshiram', 'Zekrom', 'Kyurem', 'Genesect', 'Diancie', 'Hoopa',
  'Volcanion', 'Cobalion', 'Terrakion', 'Virizion', 'Keldeo', 'Meloetta',
  'Xerneas', 'Yveltal', 'Zygarde', 'Carbink', 'Cosmog', 'Nebby', 'Necrozma',
  'Magearna', 'Marshadow', 'Zeraora', 'Zacian', 'Zamazenta', 'Eternatus',
  'Calyrex', 'Mimikyu', 'Greninja', 'Aegislash', 'Tornadus', 'Thundurus',
  'Landorus', 'Latios', 'Latias', 'Zoroark', 'Alcremie', 'Vivillon',
  'Sawsbuck', 'Pumpkaboo', 'Gourgeist', 'Nintendo', 'Creatures Inc',
  'GAME FREAK', 'Team Rocket', 'Team Magma', 'Team Aqua', 'Team Galactic',
  'GS Orb', 'Nurse Joy', 'Officer Jenny', 'Mr. Stone', 'fan homage',
  'fan project', 'fan work', 'fan game', 'fan-made', 'fan made', 'fangame',
  'fan-game', 'fan-created', 'fan creation', 'fan tribute', 'unofficial fan',
  'unofficial homage', 'Icirrus', 'Castelia', 'Geosenge',
  'Nebel', 'Liberty Pass', 'Azure Flute', 'Odd Keystone', 'Hallowed Tower',
  'Sun Flute', 'Altar of the Sunne', 'Prison Bottle', 'Diamond Domain',
  'Terminus Cave', 'P2 Laboratory', 'Moor of Icirrus',
  'Platinum', 'Track B',
];
const blockForms = new Set();
for (const t of BLOCK_TERMS) { blockForms.add(t); if (/^[A-Z][a-z]+$/.test(t)) blockForms.add(t.toUpperCase()); }
const escB = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BLOCK_RE = new RegExp(
  '\\b(' + [...blockForms].sort((a, b) => b.length - a.length).map(escB).join('|') + ')\\b', 'g');
function blockExempt(term, seg) {
  const T = term.toUpperCase();
  if (term === 'Ash' && (seg.includes('on the windows') || seg.includes('empty shelf'))) return true;
  if (T === 'ASH' && /(ASH WALKER|ASHA|ASH FIELDS|ASH COLLECTOR|ASH RESEARCHER|ASH SWEEPER)/.test(seg)) return true;
  if (T === 'MAY' && seg.includes('May yours speak well')) return true;
  if (T === 'DAWN' && ((seg.includes('tower') && seg.includes('foot')) ||
      seg.includes('Dawn Flute') || seg.includes('Altar of the Dawn'))) return true;
  if (T === 'DRAKE' && /DRAKE\\?'S DEN/i.test(seg)) return true;
  if (T === 'MAGMA' && (seg.includes('Magma Stone') || seg.includes('Magma inside') ||
      seg.includes('Magma-red'))) return true;
  if (T === 'SILVER' && (seg.trim() === 'SILVER' || seg.includes('Brain respecting'))) return true;
  // W-SCRUB2 non-display keeps for 'Platinum' (see the header note):
  // the two HM_GRANTS source-provenance strings, which no code renders.
  // (The W-SCRUB2 arcs-edition keep was removed by W-SCRUB3 — edition
  // labels are display copy, pinned to originals by the check below.)
  if (T === 'PLATINUM' && (seg === 'Repose Ruins (Platinum)' ||
      seg === 'Route 217 (Platinum)')) return true;
  return false;
}
const allSrc = execSync('find src -name "*.mjs" | sort', { cwd: ROOT, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);
let blockViolations = 0, blockScanned = 0;
for (const rel of allSrc) {
  const content = readFileSync(path.join(ROOT, rel), 'utf8');
  content.split('\n').forEach((line, li) => {
    const text = cutComment(line);
    for (const seg of stringSegments(text)) {
      const inner = seg.slice(1, -1);
      if (/^[a-z0-9_\-.\/:]+$/.test(inner)) continue; // internal token / slug / URL
      blockScanned++;
      for (const m of inner.matchAll(BLOCK_RE)) {
        if (blockExempt(m[1], inner)) continue;
        blockViolations++;
        console.log(`  blocklist violation ${rel}:${li + 1} :: "${m[1]}" in ${seg.slice(0, 110)}`);
      }
    }
  });
}
ok('no franchise names in display string literals (W-SCRUB blocklist)', blockViolations === 0,
  blockViolations + ' violation(s) over ' + blockScanned + ' scanned segments');

// ---- Original-framing sweep (owner ruling, 2026-11-17): the game is an
// original work, and fan-game framing is banned from shipped source text
// in every form — display copy, metadata, and code comments alike (the
// bundle ships comments verbatim, and a "fan project" header comment in
// species.mjs is what this section exists to catch). The scan is raw
// text, case-insensitive, over the shipped source trees plus the repo's
// two framing surfaces (README + package metadata). Internal research
// and design-history documents are not shipped text and stay out of
// scope; the blocklist above still governs all display literals.
const FAN_FRAMING_RE = /\bfan[-\s]?(?:game|made|project|work|homage|tribute|creation|created)\b|\bfangame\b|\bunofficial\s+(?:fan|homage)\b|\bhomage\b/i;
const framingFiles = [...new Set([
  ...allSrc,
  ...execSync('find audio -name "*.mjs" | sort', { cwd: ROOT, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean),
  'README.md', 'package.json',
])];
let fanFramingViolations = 0, fanFramingScanned = 0;
for (const rel of framingFiles) {
  const content = readFileSync(path.join(ROOT, rel), 'utf8');
  content.split('\n').forEach((line, li) => {
    fanFramingScanned++;
    if (FAN_FRAMING_RE.test(line)) {
      fanFramingViolations++;
      console.log(`  fan-framing violation ${rel}:${li + 1} :: ${line.trim().slice(0, 110)}`);
    }
  });
}
ok('no fan-game framing in shipped source text, README, or package metadata (2026-11-17 sweep)',
  fanFramingViolations === 0,
  fanFramingViolations + ' violation(s) over ' + fanFramingScanned + ' scanned lines');

// ---- W-SCRUB3: arc edition labels pinned to the approved originals ----
// The quest log renders each arc's `edition` verbatim (main-systems:
// "Arc 4 — Borea (<edition>)"), so edition labels are display copy.
// W-SCRUB3 replaced every franchise game title with an original label
// derived from the arc's own region and story theme. This pin is
// exact: an arc added, removed, or re-labelled fails here BY NAME
// until the new label is reviewed and entered in the approved set.
import { ARCS } from '../src/data/arcs.mjs';
const APPROVED_EDITIONS = {
  kanto: 'The First Light',
  orange: 'The Amber Crossing',
  johto: 'The Tower Bells',
  hoenn: 'The Warring Tides',
  frontier: 'The Seven Trials',
  sinnoh: 'The Sleeping North',
  unova: 'The Bright Bridges',
  kalos: 'The Discipline of Beauty',
  alola: 'Under Twin Lights',
  journeys: 'The Whole World',
  horizons: 'The Next Traveler',
};
const editionProblems = [];
if (ARCS.length !== Object.keys(APPROVED_EDITIONS).length) {
  editionProblems.push('arc count ' + ARCS.length +
    ' != approved edition count ' + Object.keys(APPROVED_EDITIONS).length);
}
for (const arc of ARCS) {
  if (!(arc.id in APPROVED_EDITIONS)) {
    editionProblems.push(arc.id + ": unapproved arc, edition '" + arc.edition + "'");
  } else if (arc.edition !== APPROVED_EDITIONS[arc.id]) {
    editionProblems.push(arc.id + ": edition '" + arc.edition +
      "' != approved '" + APPROVED_EDITIONS[arc.id] + "'");
  }
}
ok('arc edition labels are the approved W-SCRUB3 originals', editionProblems.length === 0,
  editionProblems.join('; '));

console.log(`\nbranding-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
