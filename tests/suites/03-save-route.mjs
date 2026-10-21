// 03 — /api/save round-trip via the REAL route handler + real session.
// Oracle: phase2-rls-resolution §2 (normative sync protocol).
import { getPGlite } from '../pg-stub.mjs';
import { t, mockReq, readJson, cookieHeader, validPayload, canon } from '../harness.mjs';
import { ctx } from './02-auth-flows.mjs';

const SAVE_URL = 'http://localhost:3000/api/save';

function authed(cookie, opts = {}) {
  return mockReq({ url: SAVE_URL, headers: cookieHeader(cookie), ...opts });
}

export async function run() {
  const pg = getPGlite();
  const save = (await import('../../api/save.mjs')).default;
  const payload = await validPayload();
  const cookie = ctx.cookie; // signup session (still valid)

  // ---- list: empty ----
  let r = await readJson(await save(authed(cookie)));
  t('GET /api/save: 200 empty list', r.status === 200 && Array.isArray(r.json) && r.json.length === 0,
    'status=' + r.status);

  // ---- first write (guest->account claim path, expectedVersion null) ----
  r = await readJson(await save(authed(cookie, {
    method: 'PUT', body: { slot: 1, payload, schemaVersion: 1, expectedVersion: null },
  })));
  t('PUT first-write: 200 version 1', r.status === 200 && r.json.version === 1,
    'status=' + r.status + ' ' + JSON.stringify(r.json));

  // ---- GET ?slot=N payload download ----
  r = await readJson(await save(authed(cookie, { url: SAVE_URL + '?slot=1' })));
  t('GET ?slot=1: 200 payload round-trips', r.status === 200 && r.json.version === 1 &&
    canon(r.json.payload) === canon(payload),
    'status=' + r.status + ' version=' + (r.json && r.json.version));

  // ---- CAS update ----
  const p2 = await validPayload(); p2.player.playtimeSec = 7200;
  r = await readJson(await save(authed(cookie, {
    method: 'PUT', body: { slot: 1, payload: p2, schemaVersion: 1, expectedVersion: 1 },
  })));
  t('PUT CAS: 200 version 2', r.status === 200 && r.json.version === 2, 'status=' + r.status);

  // ---- stale version -> 409, never silent overwrite ----
  const p3 = await validPayload(); p3.player.playtimeSec = 9999;
  r = await readJson(await save(authed(cookie, {
    method: 'PUT', body: { slot: 1, payload: p3, schemaVersion: 1, expectedVersion: 1 },
  })));
  t('PUT stale: 409 version_conflict', r.status === 409 && r.json.error === 'version_conflict',
    'status=' + r.status);
  t('409 carries serverVersion', r.json && r.json.serverVersion === 2,
    JSON.stringify(r.json));
  // NOTE (defect D1): spec §2.2 says 409 carries {version, summary} (the meta
  // shape for the conflict sheet); the route returns {error, serverVersion}
  // with no summary. Recorded in the QA report.

  // ---- first-wins: second null-version write on existing slot -> 409 ----
  r = await readJson(await save(authed(cookie, {
    method: 'PUT', body: { slot: 1, payload: p3, schemaVersion: 1, expectedVersion: null },
  })));
  t('PUT null-version on existing slot: 409 (first-wins)', r.status === 409,
    'status=' + r.status);

  // ---- absent slot branches ----
  r = await readJson(await save(authed(cookie, { url: SAVE_URL + '?slot=2' })));
  t('GET ?slot=2 absent: 404', r.status === 404, 'status=' + r.status);
  r = await readJson(await save(authed(cookie, {
    method: 'PUT', body: { slot: 2, payload: p3, schemaVersion: 1, expectedVersion: 5 },
  })));
  t('PUT CAS on absent slot: 404', r.status === 404, 'status=' + r.status);

  // ---- 422: invalid payload keeps previous-good row ----
  const bad = await validPayload(); bad.party.push({ speciesId: 'missingno', level: 5 });
  r = await readJson(await save(authed(cookie, {
    method: 'PUT', body: { slot: 1, payload: bad, schemaVersion: 1, expectedVersion: 2 },
  })));
  t('PUT invalid payload: 422', r.status === 422, 'status=' + r.status + ' ' + JSON.stringify(r.json));
  const vfy = await pg.query(`SELECT set_config('app.user_id', $1, false)`, [ctx.userId]);
  const row = await pg.query(
    `SELECT version, payload->'player'->>'playtimeSec' AS pt FROM saves WHERE user_id=$1 AND slot=1`,
    [ctx.userId]);
  await pg.query(`RESET app.user_id`);
  void vfy;
  t('422: previous-good row untouched (version + payload)',
    row.rows[0].version === 2 && row.rows[0].pt === '7200',
    JSON.stringify(row.rows[0]));

  // ---- 413: oversize body rejected BEFORE parse ----
  const huge = 'x'.repeat(70000);
  r = await readJson(await save(authed(cookie, { method: 'PUT', body: huge })));
  t('PUT oversize body: 413 payload_too_large', r.status === 413 && r.json.error === 'payload_too_large',
    'status=' + r.status);

  // ---- 401 precedes resource codes (G14) ----
  r = await readJson(await save(mockReq({ url: SAVE_URL + '?slot=99' })));
  t('unauthenticated GET (bad slot): 401 not 422', r.status === 401, 'status=' + r.status);
  r = await readJson(await save(mockReq({ method: 'PUT', url: SAVE_URL, body: {} })));
  t('unauthenticated PUT: 401', r.status === 401, 'status=' + r.status);

  // ---- 403: wrong origin (assertSameOrigin defense-in-depth) ----
  r = await readJson(await save(mockReq({
    method: 'PUT', url: SAVE_URL, headers: { origin: 'https://evil.example', referer: '' },
    body: { slot: 1, payload, schemaVersion: 1, expectedVersion: 2 },
  })));
  t('PUT wrong origin: 403', r.status === 403, 'status=' + r.status);

  // ---- user isolation at the route level: second user cannot see slot ----
  const { getAuth } = await import('../../api/_lib/auth.mjs');
  const auth = getAuth();
  const signup = (await import('../../api/auth/signup.mjs')).default;
  const pw2 = 'T3st!' + 'b'.repeat(24);
  const s2 = await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username: 'ash_qb', password: pw2, ageConfirmed: true },
  }));
  const r2 = await readJson(s2);
  t('second user signup ok', r2.status === 200, 'status=' + r2.status);
  const { sessionCookieFrom } = await import('../harness.mjs');
  const cookieB = sessionCookieFrom(s2);
  const rb = await readJson(await save(authed(cookieB, { url: SAVE_URL + '?slot=1' })));
  t('user B cannot read user A slot: 404', rb.status === 404, 'status=' + rb.status);
  const lb = await readJson(await save(authed(cookieB)));
  t('user B slot list is empty', lb.status === 200 && lb.json.length === 0);
}
