// branding-checks.mjs — the KIN branding guard (companion to the Wave G
// name-registry suite; run the same way: node tests/branding-checks.mjs).
//
// The generic class noun for the creatures is KIN (owner branding call,
// 2026-11-12). The old franchise terms may survive ONLY in the exact
// allowlisted lines below — the verbatim legal/attribution text and the
// verbatim titles of real referenced works — plus internal identifiers
// and code comments, which this suite never scans (it reads string
// literals only, and skips literals whose whole content is an internal
// token). Any NEW display occurrence of Pokemon/Pokémon/Pokedex in a
// string literal fails here, so the branding cannot creep back.
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
// Legal: the GC-verbatim disclaimer/credits in title.mjs — the trademark
// is named there precisely to disclaim it; plus the CC-BY credit URL of
// the Gassasin tileset (a functional link to the source page).
// Reference: story.mjs renders the factual titles of the real anime
// works the chapters adapt ("episode/movie titles are factual
// references" — the file's own header); renaming them would falsify
// the reference.
const ALLOW = [
  // file, exact trimmed line content
  ['src/game/title.mjs', "'Pok\\u00e9mon, VOLTIK, and all character names are trademarks of',"],
  ['src/game/title.mjs', "'GAME FREAK inc. Pok\\u00e9mon and all related names, characters, and indicia are',"],
  ['src/game/title.mjs', "'Pok\\u00e9mon, VOLTIK, and all',"],
  ['src/game/title.mjs', "'(opengameart.org/content/16xx16-tileset-pokemonzelda-styled),',"],
  ['src/data/story.mjs', "movies: ['Pok\\u00e9mon 2000 — The Power of One'],"],
  ['src/data/story.mjs', "anime: 'Season 9: Trial Grounds (Ep 1–5, Special: Mastermind of Mirage Pok\\u00e9mon, Ep 6–47)',"],
  ['src/data/story.mjs', "arc: 'Locked — future act. Ends with \"Aim to Be a Pok\\u00e9mon Master\" — the end of Ash\\u2019s story.',"],
  ['src/data/story.mjs', "'Pok\\u00e9mon Origins',"],
  ['src/data/story.mjs', "'Pok\\u00e9mon Generations',"],
  ['src/data/story.mjs', "'Pok\\u00e9mon Concierge',"],
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

console.log(`\nbranding-checks: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
