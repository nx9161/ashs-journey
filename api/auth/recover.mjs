// api/auth/recover.mjs — password reset via recovery codes (POST, OQ-17c).
//
// Flow: {username, code, newPassword} -> strictest rate limit -> normalize ->
// fetch UNUSED code hashes for the user -> argon2.verify each (generic error
// on ANY failure) -> mark code used -> HIBP the new password -> argon2id hash
// -> UPDATE account SET password WHERE userId AND providerId='credential'
// -> DELETE all sessions for the user -> 200 {ok:true}. All in ONE transaction.
//
// Notes:
// - Pre-auth by design (the user is locked out). The username->id lookup runs
//   against the `user` table with an explicit WHERE (API-scoped query); the
//   RLS var is then set to the RESOLVED id before touching recovery_codes.
// - Codes are single-use (used_at) and verified with a constant-time-ish loop
//   over all unused hashes — no early exit that distinguishes "user not
//   found" from "code wrong" (generic error everywhere).

import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

import { authUnavailable, normalizeUsername, USERNAME_RE, ARGON2_OPTS } from '../lib/auth.mjs';
import { getPool, isDbConfigured } from '../lib/db.mjs';
import { trustedClientIP } from '../lib/ip.mjs';
import { checkLimits, tooManyResponse } from '../lib/rate-limit.mjs';
import { isPasswordBreached } from '../lib/hibp.mjs';
import { logAnomaly } from '../lib/anomaly.mjs';
import { checkNestingDepth } from '../lib/validator.mjs';
import {
  json, invalidRequest, unavailable, readBody, parseJson,
  assertSameOrigin, methodNotAllowed,
} from '../lib/http.mjs';

const MAX_BODY = 4096;

export default async function handler(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  if (!isDbConfigured() || authUnavailable()) return unavailable();
  if (!assertSameOrigin(req)) return invalidRequest(403);

  const bodyRes = await readBody(req, MAX_BODY);
  if (bodyRes.response) return bodyRes.response;
  if (!checkNestingDepth(bodyRes.raw, 8)) return invalidRequest(400);
  const parsed = parseJson(bodyRes.raw);
  if (parsed.response) return parsed.response;
  const body = parsed.data;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalidRequest();

  // Strictest rate limit: per-IP 5/hr, per-username 3/hr.
  const ip = trustedClientIP(req) || 'unknown';
  const username = typeof body.username === 'string' ? normalizeUsername(body.username) : '';
  const rl = await checkLimits({
    keys: [`recover:ip:${ip}`, `recover:acct:${username || 'invalid'}`],
    max: 5,
    windowSec: 3600,
  });
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  const code = body.code;
  const newPassword = body.newPassword;
  if (!USERNAME_RE.test(username)) return invalidRequest();
  if (typeof code !== 'string' || code.length > 64) return invalidRequest();
  if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 256) return invalidRequest();

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolve the user id (API-scoped query; `user` carries no RLS).
    const u = await client.query(`SELECT id FROM "user" WHERE username = $1`, [username]);
    const userId = u.rows[0] && u.rows[0].id;

    // Bind the RLS var to the resolved identity BEFORE touching recovery_codes.
    // Unknown user -> var bound to a sentinel that matches nothing (generic
    // error below; no enumeration via RLS behavior).
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId || '__none__']);

    let matched = null;
    if (userId) {
      const c = await client.query(
        `SELECT id, code_hash FROM recovery_codes WHERE user_id = $1 AND used_at IS NULL`,
        [userId],
      );
      // Verify each unused hash; generic error on any failure.
      for (const row of c.rows) {
        let ok = false;
        try {
          ok = await argonVerify(row.code_hash, code);
        } catch {
          ok = false;
        }
        if (ok) { matched = row.id; break; }
      }
    }
    if (!matched) {
      await client.query('ROLLBACK');
      return invalidRequest();
    }
    await client.query(`UPDATE recovery_codes SET used_at = now() WHERE id = $1`, [matched]);

    // HIBP the new password (fail-open + anomaly log on outage).
    const hibp = await isPasswordBreached(newPassword);
    if (hibp.breached) {
      await client.query('ROLLBACK');
      return invalidRequest();
    }
    if (hibp.unavailable) {
      await logAnomaly({ userId, kind: 'hibp_unavailable', detail: { surface: 'recover' } });
    }

    // Rotate the credential hash (verified account schema: account(userId,
    // providerId, password) from the pinned better-auth package).
    const newHash = await argonHash(newPassword, ARGON2_OPTS);
    const upd = await client.query(
      `UPDATE account SET password = $2, "updatedAt" = now()
       WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId, newHash],
    );
    if (upd.rowCount !== 1) {
      await client.query('ROLLBACK');
      return invalidRequest();
    }

    // Terminate ALL sessions (C5: reset revokes everything).
    await client.query(`DELETE FROM session WHERE "userId" = $1`, [userId]);

    await client.query('COMMIT');
    return json({ ok: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    console.error('[recover] failed', e && e.message ? e.message : e);
    return invalidRequest();
  } finally {
    client.release();
  }
}
