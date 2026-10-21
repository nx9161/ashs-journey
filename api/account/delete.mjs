// api/account/delete.mjs — account deletion (POST, Tech Law §3).
//
// 1. {password} -> verify via argon2id directly against the credential account
//    row (no session minted; rate-limited like login).
// 2. ONE transaction:
//    - DELETE FROM "user" (cascades session/account/verification via FK)
//    - DELETE FROM saves (all slots; belt-and-braces on top of the FK cascade)
//    - DELETE user-keyed rate_limits rows (login:ip rows expire via 30d purge)
//    - anonymize anomaly_log.user_id (sha256 hash, keeps aggregate stats)
// 3. 200 {deleted:true} in-flow confirmation (no email exists to notify).
//
// Backup-window honesty (Tech Law §3): deletion is immediate on live systems;
// residual encrypted backup copies expire with Supabase's ~7d backup rotation.

import { verify as argonVerify } from '@node-rs/argon2';
import { createHash } from 'node:crypto';

import { authUnavailable } from '../_lib/auth.mjs';
import { getPool, isDbConfigured } from '../_lib/db.mjs';
import { trustedClientIP } from '../_lib/ip.mjs';
import { checkLimits, tooManyResponse } from '../_lib/rate-limit.mjs';
import { checkNestingDepth } from '../_lib/validator.mjs';
import {
  json, invalidRequest, unavailable, unauthorized, readBody, parseJson,
  requireUserId, assertSameOrigin, methodNotAllowed,
} from '../_lib/http.mjs';

const MAX_BODY = 4096;

export async function handler(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  if (!isDbConfigured() || authUnavailable()) return unavailable();
  if (!assertSameOrigin(req)) return invalidRequest(403);

  const userId = await requireUserId(req);
  if (!userId) return unauthorized();

  const bodyRes = await readBody(req, MAX_BODY);
  if (bodyRes.response) return bodyRes.response;
  if (!checkNestingDepth(bodyRes.raw, 8)) return invalidRequest(400);
  const parsed = parseJson(bodyRes.raw);
  if (parsed.response) return parsed.response;
  const body = parsed.data;
  const password = body && body.password;
  if (typeof password !== 'string' || password.length === 0 || password.length > 256) return invalidRequest();

  // Rate-limited like login: per-IP + per-account, strict.
  const ip = trustedClientIP(req) || 'unknown';
  const rl = await checkLimits({
    keys: [`del:ip:${ip}`, `del:acct:${userId}`],
    max: 5,
    windowSec: 3600,
  });
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);

    // Identity verification = current-password re-entry (Tech Law §3(1)).
    const a = await client.query(
      `SELECT password FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [userId],
    );
    const stored = a.rows[0] && a.rows[0].password;
    let ok = false;
    if (typeof stored === 'string' && stored) {
      try { ok = await argonVerify(stored, password); } catch { ok = false; }
    }
    if (!ok) {
      await client.query('ROLLBACK');
      return invalidRequest(); // generic: no enumeration
    }

    // One transaction, everything account-held goes.
    const un = await client.query(`SELECT username FROM "user" WHERE id = $1`, [userId]);
    const username = un.rows[0] && un.rows[0].username;
    await client.query(`DELETE FROM saves WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM recovery_codes WHERE user_id = $1`, [userId]);
    // User-keyed rate-limit rows (both id- and username-keyed). Raw-IP rows
    // (login:ip:*) are not user-keyed and expire under the 30-day purge.
    await client.query(`DELETE FROM rate_limits WHERE key LIKE '%:acct:' || $1`, [userId]);
    if (typeof username === 'string' && username) {
      await client.query(`DELETE FROM rate_limits WHERE key LIKE '%:acct:' || $1`, [username]);
    }
    const anonId = 'deleted:' + createHash('sha256').update(userId, 'utf8').digest('hex').slice(0, 32);
    await client.query(`UPDATE anomaly_log SET user_id = $2 WHERE user_id = $1`, [userId, anonId]);
    // better-auth rows: user -> cascades session, account, verification (FK).
    await client.query(`DELETE FROM "user" WHERE id = $1`, [userId]);

    await client.query('COMMIT');
    return json({ deleted: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    console.error('[account/delete] failed', e && e.message ? e.message : e);
    return invalidRequest();
  } finally {
    client.release();
  }
}

// Web API method handlers (Vercel Node runtime invokes these with a Fetch
// Request; the handler itself enforces per-route methods via 405s).
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
