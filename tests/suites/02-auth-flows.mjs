// 02 — signup / login / logout through the REAL route handlers and the
// REAL better-auth instance (PGlite-backed via the pg stub).
import { randomBytes } from 'node:crypto';
import { getPGlite } from '../pg-stub.mjs';
import { t, mockReq, readJson, sessionCookieFrom, cookieHeader } from '../harness.mjs';

export const ctx = {}; // shared: user/pass/cookie/recoveryCodes for later suites

function pw() { return 'T3st!' + randomBytes(12).toString('hex'); }

export async function run() {
  const pg = getPGlite();
  const signup = (await import('../../api/auth/signup.mjs')).handler;
  const { getAuth } = await import('../../api/_lib/auth.mjs');
  const auth = getAuth();
  t('auth instance built (not fail-closed)', !!auth);

  const username = 'ash_qa';
  const password = pw();
  ctx.username = username; ctx.password = password;

  // ---- signup: real handler ----
  const res = await signup(mockReq({
    method: 'POST',
    url: 'http://localhost:3000/api/auth/signup',
    body: { username, password, ageConfirmed: true },
  }));
  const r = await readJson(res);
  t('signup: 200', r.status === 200, 'status=' + r.status + ' ' + JSON.stringify(r.json));
  t('signup: 8 recovery codes returned exactly once',
    r.json && Array.isArray(r.json.recoveryCodes) && r.json.recoveryCodes.length === 8,
    JSON.stringify(r.json && r.json.recoveryCodes && r.json.recoveryCodes.length));
  ctx.codes = r.json.recoveryCodes;
  const cookie = sessionCookieFrom(res);
  t('signup: session cookie set (logged in on signup)', !!cookie, String(res.headers.get('set-cookie')).slice(0, 80));
  ctx.cookie = cookie;

  // C1 end-to-end: the stored credential hash identifies argon2id.
  const acct = await pg.query(
    `SELECT password FROM account WHERE "userId" = (SELECT id FROM "user" WHERE username=$1) AND "providerId"='credential'`,
    [username]);
  t('C1: stored hash is argon2id (via real signup)',
    acct.rows[0] && acct.rows[0].password.startsWith('$argon2id$'),
    String(acct.rows[0] && acct.rows[0].password).slice(0, 20));
  ctx.userId = (await pg.query(`SELECT id FROM "user" WHERE username=$1`, [username])).rows[0].id;

  // HIBP branch taken (fail-open design): either a live check or outage log.
  const hibpLog = await pg.query(
    `SELECT count(*)::int AS c FROM anomaly_log WHERE kind='hibp_unavailable'`);
  ctx.hibpFailOpen = hibpLog.rows[0].c > 0;
  console.log('  info: HIBP ' + (ctx.hibpFailOpen ? 'unavailable -> fail-open + anomaly log (designed)' : 'reachable -> live check ran'));

  // Recovery codes at rest are hashes, never plaintext.
  // (RLS: the var must be set to read one's own rows — same as the API does.)
  await pg.query(`SELECT set_config('app.user_id', $1, false)`, [ctx.userId]);
  const rc = await pg.query(`SELECT code_hash FROM recovery_codes WHERE user_id=$1`, [ctx.userId]);
  await pg.query(`RESET app.user_id`);
  t('recovery codes: 8 hashes stored', rc.rows.length === 8, 'got ' + rc.rows.length);
  t('recovery codes: hashes, not plaintext',
    rc.rows.every((row) => row.code_hash.startsWith('$argon2id$') && !ctx.codes.includes(row.code_hash)));

  // ---- signup validation gates ----
  const bad1 = await readJson(await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username: 'ab', password: pw(), ageConfirmed: true },
  })));
  t('signup: 2-char username -> generic invalid_request', bad1.status === 422 && bad1.json.error === 'invalid_request');
  const bad2 = await readJson(await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username: 'ash_qa2', password: 'short', ageConfirmed: true },
  })));
  t('signup: short password -> invalid_request', bad2.status === 422 && bad2.json.error === 'invalid_request');
  const bad3 = await readJson(await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username: 'ash_qa3', password: pw(), ageConfirmed: false },
  })));
  t('signup: age gate refusal -> 422 age_gate', bad3.status === 422 && bad3.json.error === 'age_gate');
  const dup = await readJson(await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username, password: pw(), ageConfirmed: true },
  })));
  t('signup: duplicate username -> generic (no enumeration)', dup.status === 422 && dup.json.error === 'invalid_request');

  // ---- login: real better-auth signInUsername ----
  const loginRes = await auth.api.signInUsername({
    body: { username, password },
    headers: new Headers({ origin: 'http://localhost:3000' }),
    asResponse: true,
  });
  t('login: 200 via /sign-in/username', loginRes.ok, 'status=' + loginRes.status);
  const loginCookie = sessionCookieFrom(loginRes);
  t('login: fresh session cookie minted', !!loginCookie && loginCookie !== cookie,
    'same-as-signup=' + (loginCookie === cookie));
  ctx.loginCookie = loginCookie;

  // Wrong password -> rejected (asResponse:true returns 401 Response; without
  // it, better-auth throws — accept either).
  let wrongRejected = false;
  try {
    const bad = await auth.api.signInUsername({
      body: { username, password: 'WrongPass123!' },
      headers: new Headers({ origin: 'http://localhost:3000' }),
      asResponse: true,
    });
    wrongRejected = !bad.ok;
  } catch (e) { wrongRejected = true; }
  t('login: wrong password rejected', wrongRejected);

  // ---- logout: real signOut revokes server-side ----
  const signOutRes = await auth.api.signOut({
    headers: new Headers({ ...cookieHeader(loginCookie), origin: 'http://localhost:3000' }),
    asResponse: true,
  });
  t('logout: signOut ok', signOutRes.ok, 'status=' + signOutRes.status);
  const sessAfter = await pg.query(`SELECT count(*)::int AS c FROM session WHERE "userId"=$1`, [ctx.userId]);
  // signup minted one session, login minted a second; logout kills the login one.
  t('logout: session row deleted server-side', sessAfter.rows[0].c === 1, 'sessions=' + sessAfter.rows[0].c);
  const { requireUserId } = await import('../../api/_lib/http.mjs');
  const dead = await requireUserId(mockReq({ headers: cookieHeader(loginCookie) }));
  t('logout: revoked cookie -> no session (401 path)', dead === null);
}
