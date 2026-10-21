// 05 — account deletion (Tech Law §3): one transaction, everything goes.
// Drives the REAL api/account/delete.mjs. Uses a FRESH user so the shared
// ctx user (needed by later suites) survives.
import { randomBytes } from 'node:crypto';
import { getPGlite } from '../pg-stub.mjs';
import { t, mockReq, readJson, sessionCookieFrom, cookieHeader, validPayload } from '../harness.mjs';

const DEL_URL = 'http://localhost:3000/api/account/delete';

export async function run() {
  const pg = getPGlite();
  const del = (await import('../../api/account/delete.mjs')).handler;
  const signup = (await import('../../api/auth/signup.mjs')).handler;
  const save = (await import('../../api/save.mjs')).handler;

  const username = 'ash_qdel';
  const password = 'D3l!' + randomBytes(12).toString('hex');
  const s = await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username, password, ageConfirmed: true },
  }));
  const sr = await readJson(s);
  t('delete-fixture: user created', sr.status === 200, 'status=' + sr.status);
  const cookie = sessionCookieFrom(s);
  const uid = (await pg.query(`SELECT id FROM "user" WHERE username=$1`, [username])).rows[0].id;

  // Give the user data in every table: saves, recovery codes (from signup),
  // acct-keyed rate-limit rows, an anomaly row.
  const payload = await validPayload();
  const put = await readJson(await save(mockReq({
    method: 'PUT', url: 'http://localhost:3000/api/save',
    headers: cookieHeader(cookie),
    body: { slot: 1, payload, schemaVersion: 1, expectedVersion: null },
  })));
  t('delete-fixture: save written', put.status === 200, 'status=' + put.status);
  await pg.query(`INSERT INTO rate_limits (key, count) VALUES ('save:acct:${uid}', 3) ON CONFLICT (key) DO UPDATE SET count = 3`);
  await pg.query(`INSERT INTO rate_limits (key, count) VALUES ('login:acct:${username}', 1) ON CONFLICT (key) DO UPDATE SET count = 1`);
  await pg.query(`INSERT INTO anomaly_log (user_id, kind, detail) VALUES ($1, 'save_anomaly', '{}')`, [uid]);
  await pg.query(
    `INSERT INTO session (id, token, "userId", "expiresAt") VALUES ('sess-del-1', 'tok-del-1', $1, now() + interval '1 day')`,
    [uid]);

  // ---- wrong password: generic, nothing deleted ----
  let r = await readJson(await del(mockReq({
    method: 'POST', url: DEL_URL, headers: cookieHeader(cookie),
    body: { password: 'WrongPassword1!' },
  })));
  t('delete: wrong password -> generic invalid_request', r.status === 422 && r.json.error === 'invalid_request',
    'status=' + r.status);
  const still = await pg.query(`SELECT count(*)::int AS c FROM "user" WHERE id=$1`, [uid]);
  t('delete: wrong password deletes nothing', still.rows[0].c === 1);

  // ---- correct password: cascade ----
  r = await readJson(await del(mockReq({
    method: 'POST', url: DEL_URL, headers: cookieHeader(cookie),
    body: { password },
  })));
  t('delete: 200 {deleted:true}', r.status === 200 && r.json && r.json.deleted === true,
    'status=' + r.status + ' ' + JSON.stringify(r.json));

  const counts = {};
  // Honest zero-row proof: set the var first so RLS cannot fake the zeros.
  await pg.query(`SELECT set_config('app.user_id', $1, false)`, [uid]);
  for (const [label, q] of [
    ['user', `SELECT count(*)::int AS c FROM "user" WHERE id='${uid}'`],
    ['session', `SELECT count(*)::int AS c FROM session WHERE "userId"='${uid}'`],
    ['account', `SELECT count(*)::int AS c FROM account WHERE "userId"='${uid}'`],
    ['saves', `SELECT count(*)::int AS c FROM saves WHERE user_id='${uid}'`],
    ['recovery_codes', `SELECT count(*)::int AS c FROM recovery_codes WHERE user_id='${uid}'`],
    ['rate_limits(acct)', `SELECT count(*)::int AS c FROM rate_limits WHERE key LIKE '%${uid}%' OR key LIKE '%${username}%'`],
    ['verification', `SELECT count(*)::int AS c FROM verification WHERE identifier LIKE '%${uid}%'`],
  ]) {
    counts[label] = (await pg.query(q)).rows[0].c;
  }
  for (const [label, c] of Object.entries(counts)) {
    t(`delete cascade: ${label} = 0 rows`, c === 0, 'got ' + c);
  }
  await pg.query(`RESET app.user_id`);
  const anon = await pg.query(`SELECT user_id FROM anomaly_log WHERE user_id LIKE 'deleted:%'`);
  t('delete: anomaly_log anonymized (deleted:<sha>)', anon.rows.length === 1 && /^deleted:[0-9a-f]{32}$/.test(anon.rows[0].user_id),
    JSON.stringify(anon.rows));
  const anonOld = await pg.query(`SELECT count(*)::int AS c FROM anomaly_log WHERE user_id=$1`, [uid]);
  t('delete: no raw user_id left in anomaly_log', anonOld.rows[0].c === 0);

  // Deleted user's cookie -> 401 everywhere now.
  r = await readJson(await save(mockReq({
    url: 'http://localhost:3000/api/save', headers: cookieHeader(cookie),
  })));
  t('delete: old cookie -> 401', r.status === 401, 'status=' + r.status);
}
