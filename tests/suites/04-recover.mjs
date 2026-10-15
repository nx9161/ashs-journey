// 04 — password reset via recovery codes (OQ-17c, C5).
// Drives the REAL api/auth/recover.mjs against better-auth-shaped seeded rows
// (the user + codes were created by the real signup handler in suite 02).
import { randomBytes } from 'node:crypto';
import { getPGlite } from '../pg-stub.mjs';
import { t, mockReq, readJson, sessionCookieFrom, cookieHeader } from '../harness.mjs';
import { ctx } from './02-auth-flows.mjs';

const RECOVER_URL = 'http://localhost:3000/api/auth/recover';

export async function run() {
  const pg = getPGlite();
  const recover = (await import('../../api/auth/recover.mjs')).default;
  const save = (await import('../../api/save.mjs')).default;
  const { getAuth } = await import('../../api/lib/auth.mjs');
  const auth = getAuth();

  const newPw = 'N3w!' + randomBytes(12).toString('hex');
  const code = ctx.codes[0];

  // Sanity: the session from suite 02/03 still works before recovery.
  let r = await readJson(await save(mockReq({
    url: 'http://localhost:3000/api/save', headers: cookieHeader(ctx.cookie),
  })));
  t('pre-recover: old session valid', r.status === 200, 'status=' + r.status);

  // ---- recover with a valid code ----
  r = await readJson(await recover(mockReq({
    method: 'POST', url: RECOVER_URL,
    body: { username: ctx.username, code, newPassword: newPw },
  })));
  t('recover: 200 {ok:true}', r.status === 200 && r.json && r.json.ok === true,
    'status=' + r.status + ' ' + JSON.stringify(r.json));

  // Code is single-use: used_at set. (var set: RLS would hide the rows.)
  await pg.query(`SELECT set_config('app.user_id', $1, false)`, [ctx.userId]);
  const used = await pg.query(
    `SELECT count(*)::int AS c FROM recovery_codes WHERE user_id=$1 AND used_at IS NOT NULL`,
    [ctx.userId]);
  await pg.query(`RESET app.user_id`);
  t('recover: code marked used', used.rows[0].c === 1, 'used=' + used.rows[0].c);

  // C5: ALL sessions revoked by the reset.
  const sess = await pg.query(`SELECT count(*)::int AS c FROM session WHERE "userId"=$1`, [ctx.userId]);
  t('C5: all sessions revoked on password reset', sess.rows[0].c === 0, 'sessions=' + sess.rows[0].c);

  // Old cookie -> 401 on the save route.
  r = await readJson(await save(mockReq({
    url: 'http://localhost:3000/api/save', headers: cookieHeader(ctx.cookie),
  })));
  t('post-recover: old cookie -> 401', r.status === 401, 'status=' + r.status);

  // New password works via the real sign-in path.
  const loginRes = await auth.api.signInUsername({
    body: { username: ctx.username, password: newPw },
    headers: new Headers({ origin: 'http://localhost:3000' }),
    asResponse: true,
  });
  t('login with NEW password: 200', loginRes.ok, 'status=' + loginRes.status);
  const newCookie = sessionCookieFrom(loginRes);
  t('login with new password mints fresh session', !!newCookie);
  ctx.cookie = newCookie; // hand the fresh session to later suites

  // Old password is dead (asResponse:true -> 401 Response; accept throw too).
  let oldRejected = false;
  try {
    const oldLogin = await auth.api.signInUsername({
      body: { username: ctx.username, password: ctx.password },
      headers: new Headers({ origin: 'http://localhost:3000' }),
      asResponse: true,
    });
    oldRejected = !oldLogin.ok;
  } catch (e) { oldRejected = true; }
  t('login with OLD password rejected', oldRejected);

  // ---- code reuse -> generic error ----
  r = await readJson(await recover(mockReq({
    method: 'POST', url: RECOVER_URL,
    body: { username: ctx.username, code, newPassword: 'Another1!' + randomBytes(6).toString('hex') },
  })));
  t('recover: code reuse -> generic invalid_request', r.status === 422 && r.json.error === 'invalid_request',
    'status=' + r.status);

  // ---- wrong code -> same generic copy (no oracle) ----
  r = await readJson(await recover(mockReq({
    method: 'POST', url: RECOVER_URL,
    body: { username: ctx.username, code: 'ZZZZ-ZZZZ-ZZZZ', newPassword: 'Another2!' + randomBytes(6).toString('hex') },
  })));
  t('recover: wrong code -> generic invalid_request', r.status === 422 && r.json.error === 'invalid_request',
    'status=' + r.status);

  // ---- unknown user -> same generic copy (no enumeration) ----
  r = await readJson(await recover(mockReq({
    method: 'POST', url: RECOVER_URL,
    body: { username: 'no_such_user', code: 'ZZZZ-ZZZZ-ZZZZ', newPassword: 'Another3!' + randomBytes(6).toString('hex') },
  })));
  t('recover: unknown user -> generic invalid_request', r.status === 422 && r.json.error === 'invalid_request',
    'status=' + r.status);

  // Rate-limit bucket for recover exists and incremented.
  const rl = await pg.query(`SELECT count, count(*)::int AS c FROM rate_limits WHERE key LIKE 'recover:%' GROUP BY count`);
  t('recover: rate-limit buckets recorded', rl.rows.length > 0, JSON.stringify(rl.rows));
}
