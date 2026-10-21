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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
