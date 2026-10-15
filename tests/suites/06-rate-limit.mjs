// 06 — DB-backed rate limiter (AppSec C7): bucket increments, exponential
// backoff, generic 429. Uses a FRESH user (save:acct bucket starts clean).
import { randomBytes } from 'node:crypto';
import { getPGlite } from '../pg-stub.mjs';
import { t, mockReq, readJson, sessionCookieFrom, cookieHeader, validPayload } from '../harness.mjs';

export async function run() {
  const pg = getPGlite();
  const { checkLimits, tooManyResponse } = await import('../../api/lib/rate-limit.mjs');

  // --- unit: check-and-increment ---
  const key = 'qatest:' + randomBytes(4).toString('hex');
  for (let i = 1; i <= 3; i++) {
    const r = await checkLimits({ keys: [key], max: 3, windowSec: 60 });
    t(`bucket: call ${i}/3 allowed`, r.allowed === true);
  }
  const row = await pg.query(`SELECT count FROM rate_limits WHERE key=$1`, [key]);
  t('bucket: count incremented to 3', row.rows[0].count === 3, 'count=' + row.rows[0].count);
  const over = await checkLimits({ keys: [key], max: 3, windowSec: 60 });
  t('bucket: 4th call denied', over.allowed === false);
  t('bucket: retryAfterSec > 0', over.retryAfterSec > 0, 'retryAfterSec=' + over.retryAfterSec);
  const bo = await pg.query(`SELECT violations, backoff_until FROM rate_limits WHERE key=$1`, [key]);
  t('bucket: violations=1, backoff_until set',
    bo.rows[0].violations === 1 && bo.rows[0].backoff_until !== null);
  // Backoff: denied without counting while active.
  const during = await checkLimits({ keys: [key], max: 3, windowSec: 60 });
  t('bucket: denied during backoff window', during.allowed === false);

  // 429 body is generic (never names the limiter).
  const r429 = tooManyResponse(60);
  const b429 = await r429.json();
  t('429: status 429', r429.status === 429);
  t('429: generic body', b429.error === 'too_many_requests', JSON.stringify(b429));
  t('429: Retry-After header', r429.headers.get('retry-after') === '60');

  // --- route-level: 12 save PUTs then 429 (fresh user, clean bucket) ---
  const signup = (await import('../../api/auth/signup.mjs')).default;
  const save = (await import('../../api/save.mjs')).default;
  const uname = 'ash_qrl';
  const s = await signup(mockReq({
    method: 'POST', url: 'http://localhost:3000/api/auth/signup',
    body: { username: uname, password: 'R4te!' + randomBytes(12).toString('hex'), ageConfirmed: true },
  }));
  const sr = await readJson(s);
  t('rl-fixture: user created', sr.status === 200, 'status=' + sr.status);
  const cookie = sessionCookieFrom(s);
  const uid = (await pg.query(`SELECT id FROM "user" WHERE username=$1`, [uname])).rows[0].id;
  const payload = await validPayload();

  let lastStatus = null;
  await pg.query(`SELECT set_config('app.user_id', $1, false)`, [uid]);
  for (let i = 0; i < 13; i++) {
    const slot = (i % 3) + 1;
    const cur = await pg.query(`SELECT version FROM saves WHERE user_id=$1 AND slot=$2`, [uid, slot]);
    const body = cur.rows[0]
      ? { slot, payload, schemaVersion: 1, expectedVersion: cur.rows[0].version }
      : { slot, payload, schemaVersion: 1, expectedVersion: null };
    const rr = await readJson(await save(mockReq({
      method: 'PUT', url: 'http://localhost:3000/api/save',
      headers: cookieHeader(cookie), body,
    })));
    lastStatus = rr.status;
    if (i < 12) t(`save PUT ${i + 1}/12: allowed`, rr.status === 200, 'status=' + rr.status);
  }
  await pg.query(`RESET app.user_id`);
  t('save PUT 13: 429 too_many_requests', lastStatus === 429, 'status=' + lastStatus);
}
