// validator.fuzz.test.mjs — differential fuzz battery for api/_lib/validator.mjs.
// Run: node api/scripts/validator.fuzz.test.mjs   (exit 0 = all pass)
//
// Seeded PRNG (mulberry32, fixed seed 0xC0FFEE): N=2000 random/mutated
// payloads through validateSave. Every result must be EXACTLY one of:
//   - accept-with-possible-anomalies: { ok:true, anomalies:Array }
//   - 422 shape: { ok:false, errors:Array(non-empty) }
// No throws, no other shapes. Exit 1 on the first violation.
//
// Coverage (honest number, 2026-10-15): the full api test suite run as
//   env -u DATABASE_URL node --experimental-test-coverage --test api/scripts/*.test.mjs
// reports aggregate api/ branch coverage = 68.5% (line 66.7%, funcs 67.0%).
// Per-file branch %: validator.mjs 84.5, auth.mjs 82.6, http.mjs 65.5,
// ip.mjs 85.7, blocklists.mjs 100, db.mjs 63.6, rate-limit.mjs 30.0,
// save.mjs 50.0, save/meta.mjs 28.6, signup.mjs 10.0, recover.mjs 11.8,
// delete.mjs 14.3, data.mjs 33.3, [...all].mjs 66.7, anomaly.mjs 100,
// hibp.mjs 100, health.mjs 50.0.
// Route handlers are thinly covered because no live DB exists in CI
// (save.mjs itself is exercised only via save-contract mocks). The number
// is recorded, not chased — no artificial tests were added to inflate it.

import { validateSave } from '../../api/_lib/validator.mjs';
import { defaultState } from '../../src/game/state.mjs';

const N = 2000;
const SEED = 0xC0FFEE;

// mulberry32 — deterministic PRNG, fixed seed => reproducible corpus.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const rint = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

function randScalar() {
  return pick([
    null, true, false, 0, -1, 1.5, 999999999,
    '', 'x', 'ASH', 'A'.repeat(5000),
    [], {}, [null], { a: 1 },
    '__proto__', 'constructor', 'prototype',
    '\u0000', 'mewtwo999', 'not-a-move',
  ]);
}

function randDeep(depth) {
  if (depth <= 0) return randScalar();
  return pick([{ k: randDeep(depth - 1) }, [randDeep(depth - 1)], { nested: { v: randDeep(depth - 1) } }]);
}

// Structural mutations of a valid save. No cycles, bounded sizes.
function mutate(base) {
  const s = JSON.parse(JSON.stringify(base));
  const nMut = rint(1, 4);
  for (let i = 0; i < nMut; i++) {
   try {
    switch (rint(0, 15)) {
      case 0: delete s[pick(Object.keys(s))]; break;
      case 1: s[pick(Object.keys(s))] = randScalar(); break;
      case 2: s['fuzz_unknown_' + rint(0, 999)] = randScalar(); break;
      case 3: if (s.player) s.player[pick(['name', 'rivalName', 'playtimeSec'])] = randScalar(); break;
      case 4: if (s.party && s.party.length) s.party[rint(0, s.party.length - 1)] = randScalar(); break;
      case 5: if (Array.isArray(s.party)) s.party.push(randScalar()); break;
      case 6: if (s.dex && s.dex.caught) s.dex.caught[pick(['25', '9999', '__proto__', 'x'])] = randScalar(); break;
      case 7: if (s.badges && Array.isArray(s.badges.kanto)) s.badges.kanto.push(pick(['boulderbadge', 'fakegym', 123, null])); break;
      case 8: if (s.boxes) s.boxes[pick(Object.keys(s.boxes))] = randScalar(); break;
      case 9: if (s.meta) s.meta[pick(Object.keys(s.meta))] = randScalar(); break;
      case 10: if (s.player && s.player.party === undefined) s.player.party = randDeep(rint(1, 6)); break;
      case 11: s.meta = randDeep(rint(2, 8)); break;
      case 12: // own __proto__ key (not prototype pollution via assignment)
        return JSON.parse('{"__proto__":{"polluted":true},"player":' + JSON.stringify(s.player || {}) + '}');
      case 13: if (s.party && s.party[0] && typeof s.party[0] === 'object') s.party[0].level = pick([-5, 0, 101, 99999, 'high', null]); break;
      case 14: if (s.party && s.party[0] && typeof s.party[0] === 'object') s.party[0].moves = randScalar(); break;
      default: s[pick(Object.keys(s) || ['player'])] = randDeep(rint(1, 4));
    }
   } catch { /* a mutation combo clobbered a type it later assumed — skip that mutation */ }
  }
  return s;
}

function fuzzPayload(base) {
  const kind = rint(0, 9);
  if (kind < 7) return mutate(base);                    // 70% mutated valid saves
  if (kind === 7) return randScalar();                  // 10% bare primitives
  if (kind === 8) return randDeep(rint(1, 10));         // 10% random deep JSON
  return JSON.parse(JSON.stringify({ wrap: mutate(base) })); // 10% wrapped
}

let pass = 0, fail = 0;
const base = defaultState();
for (let i = 0; i < N; i++) {
  const payload = fuzzPayload(base);
  let v;
  try {
    v = validateSave(payload);
  } catch (e) {
    fail++;
    console.log(`  FAIL #${i} - threw:`, e && e.message ? e.message : e);
    break;
  }
  const okShape = v && typeof v === 'object' && typeof v.ok === 'boolean';
  const acceptShape = okShape && v.ok === true && Array.isArray(v.anomalies);
  const rejectShape = okShape && v.ok === false && Array.isArray(v.errors) && v.errors.length > 0;
  if (acceptShape || rejectShape) {
    pass++;
  } else {
    fail++;
    console.log(`  FAIL #${i} - bad shape:`, JSON.stringify(v).slice(0, 200));
    break;
  }
}

console.log(`\n${pass}/${N} fuzz payloads produced exactly accept|422 shapes, ${fail} violations`);
process.exit(fail ? 1 : 0);
