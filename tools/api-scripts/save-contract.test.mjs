// save-contract.test.mjs — F1 contract battery for api/save.mjs.
// Run: node api/scripts/save-contract.test.mjs   (exit 0 = all pass)
//
// Mock level: pg.Pool.prototype.connect is stubbed (no DB), auth.api.getSession
// is stubbed to a fixed user. Asserts the first-write/CAS routing:
//   1. expectedVersion 0 -> first-write INSERT path -> 200
//   2. expectedVersion 0 with an existing row -> 409 version_conflict
//   3. stale expectedVersion (CAS miss, row present) -> 409 version_conflict
//   4. expectedVersion -1 -> invalid_request (negative versions rejected)

process.env.DATABASE_URL = 'postgres://app_role:fake@localhost:6543/postgres';
process.env.BETTER_AUTH_URL = 'https://ashs-journey-game.vercel.app';
process.env.BETTER_AUTH_SECRET = 'test-secret-not-used-for-crypto-assertions';

import pg from 'pg';
import { defaultState } from '../../src/game/state.mjs';

const seen = [];
let scenario = 'insert-ok';

pg.Pool.prototype.connect = async function () {
  return {
    query: async (text, params) => {
      seen.push(text.split('\n')[0].trim());
      if (/BEGIN|COMMIT|ROLLBACK|set_config/.test(text)) return { rows: [], rowCount: 0 };
      if (text.includes('rate_limits')) {
        if (text.includes('SELECT count')) {
          return { rows: [{ count: 0, window_start: new Date(), violations: 0, backoff_until: null }] };
        }
        return { rows: [], rowCount: 1 };
      }
      if (text.includes('INSERT INTO saves')) {
        if (scenario === 'insert-ok') {
          return { rows: [{ version: 1, updated_at: new Date('2026-10-15T00:00:00.000Z') }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 }; // ON CONFLICT DO NOTHING -> concurrent row
      }
      if (text.includes('SELECT version, updated_at FROM saves')) {
        return { rows: [{ version: 4, updated_at: new Date('2026-10-15T00:01:00.000Z') }], rowCount: 1 };
      }
      if (text.includes('UPDATE saves SET')) {
        return { rows: [], rowCount: 0 }; // CAS miss -> stale
      }
      if (text.includes('SELECT version FROM saves')) {
        return { rows: [{ version: 4 }], rowCount: 1 };
      }
      if (text.includes('anomaly_log')) return { rows: [], rowCount: 1 };
      throw new Error('unmocked query: ' + text);
    },
    release: () => {},
  };
};

const { auth } = await import('../../api/_lib/auth.mjs');
auth.api.getSession = async () => ({ user: { id: 'test-user-1' } });
const handler = (await import('../../api/save.mjs')).handler;

function putRequest(body) {
  return new Request('http://localhost/api/save', {
    method: 'PUT',
    headers: {
      origin: 'https://ashs-journey-game.vercel.app',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function goodPayload() {
  const s = defaultState();
  s.player.name = 'ASH';
  s.player.rivalName = 'GARY';
  return s;
}

let pass = 0, fail = 0;
function t(name, cond) {
  if (cond) pass++; else { fail++; console.log('  FAIL -', name); }
}

// 1. expectedVersion 0 -> first-write INSERT path -> 200 {version:1}
scenario = 'insert-ok';
seen.length = 0;
let res = await handler(putRequest({ slot: 1, payload: goodPayload(), expectedVersion: 0 }));
let body = await res.json();
t('0 -> first-write: 200 + version 1 + INSERT attempted',
  res.status === 200 && body.version === 1 && seen.some((s) => s.includes('INSERT INTO saves')));

// 2. expectedVersion 0, row already exists -> 409 version_conflict
scenario = 'insert-conflict';
seen.length = 0;
res = await handler(putRequest({ slot: 1, payload: goodPayload(), expectedVersion: 0 }));
body = await res.json();
t('0 with existing row -> 409 version_conflict + serverVersion',
  res.status === 409 && body.error === 'version_conflict' && body.serverVersion === 4);

// 3. stale expectedVersion -> 409 version_conflict
scenario = 'cas-stale';
seen.length = 0;
res = await handler(putRequest({ slot: 1, payload: goodPayload(), expectedVersion: 1 }));
body = await res.json();
t('stale expectedVersion -> 409 version_conflict + serverVersion',
  res.status === 409 && body.error === 'version_conflict' && body.serverVersion === 4);

// 4. negative expectedVersion -> invalid_request (422)
res = await handler(putRequest({ slot: 1, payload: goodPayload(), expectedVersion: -1 }));
body = await res.json();
t('negative expectedVersion -> invalid_request',
  res.status === 422 && body.error === 'invalid_request');

// 5. ADR-025 §3 (Phase 3): a keepsake-bearing payload round-trips the
// contract (200); a non-keepsake id in the slot is a 422 validation error.
scenario = 'insert-ok';
seen.length = 0;
const ksPayload = goodPayload();
ksPayload.player.playtimeSec = 3600; // a progressed save (keeps the anomaly branch out of this contract check)
ksPayload.party.push({
  speciesId: 'partner', nickname: null, level: 12, xp: 1000,
  moves: [{ id: 'thundershock', pp: 30, maxPp: 30 }],
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  status: null, ot: 'ASH', friendship: 70, hp: 40, maxHp: 40, keepsake: 'sparrowfeather',
});
ksPayload.bag.tidepearl = 1;
res = await handler(putRequest({ slot: 1, payload: ksPayload, expectedVersion: 0 }));
body = await res.json();
t('keepsake payload -> 200 + version 1',
  res.status === 200 && body.version === 1);
const badKsPayload = goodPayload();
badKsPayload.player.playtimeSec = 3600;
badKsPayload.party.push(JSON.parse(JSON.stringify(ksPayload.party[0])));
badKsPayload.party[0].keepsake = 'potion';
res = await handler(putRequest({ slot: 1, payload: badKsPayload, expectedVersion: 0 }));
body = await res.json();
t('non-keepsake id in keepsake slot -> 422',
  res.status === 422);

// 6. Stage J6: an arc-systems payload round-trips the contract —
// a Day-Care pair, a party Egg (egg/eggSteps mon fields), gather
// rows, a Kurt order and the persisted step counter all validate.
scenario = 'insert-ok';
seen.length = 0;
const { SPECIES: SC_SPECIES } = await import('../../src/data/species.mjs');
const { SPECIES2: SC_SPECIES2 } = await import('../../src/data/species2.mjs');
const { SPECIES_JOHTO: SC_JOHTO } = await import('../../src/data/species3.mjs');
const { MOVES: SC_MOVES } = await import('../../src/data/moves.mjs');
const { MOVES2: SC_MOVES2 } = await import('../../src/data/moves2.mjs');
const SC_ALL_SPECIES = Object.assign({}, SC_SPECIES, SC_SPECIES2, SC_JOHTO);
const SC_ALL_MOVES = Object.assign({}, SC_MOVES, SC_MOVES2);
const { makeMon: scMakeMon } = await import('../../src/game/state.mjs');
const j6Payload = goodPayload();
j6Payload.player.playtimeSec = 3600;
j6Payload.story.arc = 'johto'; j6Payload.story.region = 'johto';
const j6Egg = scMakeMon('togepi', 1, SC_ALL_SPECIES, SC_ALL_MOVES);
j6Egg.egg = true; j6Egg.eggSteps = 250;
j6Payload.party.push(scMakeMon('charizard', 150, SC_ALL_SPECIES, SC_ALL_MOVES), j6Egg);
j6Payload.daycare.push(scMakeMon('ditto', 120, SC_ALL_SPECIES, SC_ALL_MOVES), scMakeMon('eevee', 121, SC_ALL_SPECIES, SC_ALL_MOVES));
j6Payload.daycareEgg = { speciesId: 'pichu', eggSteps: 250 };
j6Payload.daycareEggAt = null;
j6Payload.stepsTotal = 4321;
j6Payload.gather = { 'azalea:19,1': 4521, 'r37:20,12': 4000 };
j6Payload.kurtOrder = { ball: 'levelball', readyAt: 4571 };
res = await handler(putRequest({ slot: 1, payload: j6Payload, expectedVersion: 0 }));
body = await res.json();
t('J6 arc-systems payload (daycare + party egg + gather + kurt order) -> 200',
  res.status === 200 && body.version === 1);

// 7. Stage J6 negatives: a third Day-Care guest and a negative step
// counter are each a 422 validation error.
const j6Bad1 = JSON.parse(JSON.stringify(j6Payload));
j6Bad1.daycare.push(scMakeMon('pidgey', 110, SC_ALL_SPECIES, SC_ALL_MOVES));
res = await handler(putRequest({ slot: 1, payload: j6Bad1, expectedVersion: 0 }));
body = await res.json();
t('three Day-Care guests -> 422', res.status === 422);
const j6Bad2 = JSON.parse(JSON.stringify(j6Payload));
j6Bad2.stepsTotal = -5;
res = await handler(putRequest({ slot: 1, payload: j6Bad2, expectedVersion: 0 }));
body = await res.json();
t('negative stepsTotal -> 422', res.status === 422);
const j6Bad3 = JSON.parse(JSON.stringify(j6Payload));
j6Bad3.party[1].eggSteps = -1;
res = await handler(putRequest({ slot: 1, payload: j6Bad3, expectedVersion: 0 }));
body = await res.json();
t('negative eggSteps -> 422', res.status === 422);

// 8. Arc 3.5 Stage F2 pins (grown by F2, recorded in the register):
// a mid-run Frontier payload (Factory rentals through the FULL mon
// checker + a Dome bracket + the Pyramid bag) round-trips at 200; a
// run naming an unknown facility is a 422.
const { freshRecords: scFreshRecords } = await import('../../src/data/frontier.mjs');
const f2Payload = goodPayload();
f2Payload.frontier = {
  records: scFreshRecords(),
  pyramidBag: ['potion', 'revive'],
  run: {
    facility: 'factory', foeLevel: 100, enteredTeam: [], streak: 20,
    rentals: [scMakeMon('snorlax', 100, SC_ALL_SPECIES, SC_ALL_MOVES)],
    bracket: { entrants: [{ name: 'YOU', species: ['snorlax', 'lapras', 'gengar'], power: 4321 }], round: 1, alive: [0, 3], results: [{ round: 0, a: 1, c: 2, winner: 1 }] },
    tournamentNo: 0, events: null, rooms: 0, lastChamber: 0, banked: false,
    floor: 1, runNo: 0, spots: [], spotsFloor: null, lucyFaced: false, brandonFaced: false,
  },
};
f2Payload.frontier.records.factory.bestStreak = 20;
res = await handler(putRequest({ slot: 1, payload: f2Payload, expectedVersion: 0 }));
body = await res.json();
t('F2 mid-run Frontier payload (rentals + bracket + pyramid bag) -> 200',
  res.status === 200 && body.version === 1);
const f2Bad = JSON.parse(JSON.stringify(f2Payload));
f2Bad.frontier.run.facility = 'nowhere';
res = await handler(putRequest({ slot: 1, payload: f2Bad, expectedVersion: 0 }));
body = await res.json();
t('F2 run with an unknown facility id -> 422', res.status === 422);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
