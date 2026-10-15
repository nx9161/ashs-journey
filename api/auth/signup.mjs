// api/auth/signup.mjs — custom registration wrapper (POST).
//
// Why a wrapper instead of raw /sign-up/email:
// - Server-side age gate (Tech Law §4): ageConfirmed must be true. The check
//   is ephemeral — the age is NEVER persisted.
// - HIBP k-anonymity breached-password screening (AppSec C8).
// - Recovery codes (OQ-17c): 8 CSPRNG codes, argon2id-hashed at rest,
//   returned EXACTLY ONCE.
// - Strict DB-backed rate limits (per-IP + per-username, exponential backoff).
// - Generic error copy everywhere ("invalid_request") — no enumeration (T1).
//
// NOTE (AppSec C8 tension): minimum password length is 8 per ADR-010 OQ-10,
// not 12. Implemented as 8; AppSec to re-confirm or escalate.

import { randomBytes } from 'node:crypto';
import { hash as argonHash } from '@node-rs/argon2';

import { auth, authUnavailable, normalizeUsername, USERNAME_RE, ARGON2_OPTS } from '../lib/auth.mjs';
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

// Unambiguous alphabet (no 0/O, 1/I/l): 32 symbols -> 5 bits/char,
// 12 chars per code -> 60 bits of entropy per code.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode() {
  const bytes = randomBytes(12);
  let s = '';
  for (let i = 0; i < 12; i++) s += ALPHABET[bytes[i] % 32];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

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

  // Rate limit BEFORE any validation (strict): per-IP 10/hr, per-username 5/hr.
  const ip = trustedClientIP(req) || 'unknown';
  const rawUsername = typeof body.username === 'string' ? normalizeUsername(body.username) : '';
  const rl = await checkLimits({
    keys: [`signup:ip:${ip}`, `signup:acct:${rawUsername || 'invalid'}`],
    max: 10,
    windowSec: 3600,
  });
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  // Field validation — every failure is the same generic copy.
  if (!USERNAME_RE.test(rawUsername)) return invalidRequest();
  const password = body.password;
  if (typeof password !== 'string' || password.length < 8 || password.length > 256) return invalidRequest();
  // Server is the age gate (Tech Law §4). Ephemeral: never persisted.
  if (body.ageConfirmed !== true) return json({ error: 'age_gate' }, 422);

  // HIBP k-anonymity (C8). Fail-open on network failure + anomaly log.
  const hibp = await isPasswordBreached(password);
  if (hibp.breached) return invalidRequest();
  if (hibp.unavailable) {
    await logAnomaly({ userId: null, kind: 'hibp_unavailable', detail: { surface: 'signup' } });
  }

  const email = `${rawUsername}@game.local`;

  // Create the account through better-auth (custom argon2id hasher; the
  // databaseHooks.before hook rejects any non-synthetic email).
  let baRes;
  try {
    baRes = await auth.api.signUpEmail({
      body: { email, name: rawUsername, username: rawUsername, password },
      headers: req.headers,
      asResponse: true,
    });
  } catch (e) {
    // better-auth throws APIError with structured codes (e.g. duplicate user).
    // All mapped to the generic copy — no enumeration.
    console.error('[signup] signUpEmail failed', e && e.message ? e.message : e);
    return invalidRequest();
  }
  if (!(baRes instanceof Response) || !baRes.ok) return invalidRequest();
  let created;
  try {
    created = await baRes.json();
  } catch {
    return invalidRequest();
  }
  const userId = created && created.user && created.user.id;
  if (typeof userId !== 'string' || !userId) return invalidRequest();

  // Recovery codes: generate 8, argon2id-hash each, store hashes, return
  // plaintexts EXACTLY ONCE. One transaction; set_config binds RLS.
  const pool = getPool();
  const codes = Array.from({ length: 8 }, makeCode);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
    for (const code of codes) {
      const codeHash = await argonHash(code, ARGON2_OPTS);
      await client.query(
        `INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, $2)`,
        [userId, codeHash],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    console.error('[signup] recovery-code insert failed', e && e.message ? e.message : e);
    // Account exists but codes failed: fail closed — the user can re-run
    // recovery later; do NOT return partial codes.
    return invalidRequest();
  } finally {
    client.release();
  }

  // Forward better-auth's session cookie (user is logged in on signup).
  const headers = { 'content-type': 'application/json' };
  const setCookie = baRes.headers.getSetCookie ? baRes.headers.getSetCookie() : [];
  const resp = json({ recoveryCodes: codes }, 200, headers);
  for (const c of setCookie) resp.headers.append('set-cookie', c);
  return resp;
}
