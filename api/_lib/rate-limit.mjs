// rate-limit.mjs — DB-backed rate limiter (AppSec C7, Pen T3/T4).
//
// - Backed by the `rate_limits` table (shared across Vercel serverless
//   instances; the in-memory default would be a no-op on serverless).
// - Per-IP AND per-account buckets. Keys: `${scope}:${kind}:${id}` where kind
//   is `ip` or `acct` and scope names the surface (save, signup, recover, del).
// - Exponential backoff on violation (not lockout): each consecutive trip
//   doubles the backoff window, capped at BACKOFF_MAX_SEC. Backoff state is
//   per-bucket and decays after a clean window.
// - 429 bodies are generic ("Too many requests…") — never name which limiter
//   tripped (Pen G13).
// - Purge: rows older than 30 days are deleted by /api/purge (Tech Law §2).

import { getPool } from './db.mjs';

const BACKOFF_MAX_SEC = 15 * 60; // 15 min cap: backoff, never lockout

// Check-and-increment one bucket. Returns { allowed, retryAfterSec }.
export async function checkBucket(client, { key, max, windowSec }) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSec * 1000);
  await client.query(
    `INSERT INTO rate_limits (key, count, window_start, violations, backoff_until)
     VALUES ($1, 0, now(), 0, NULL)
     ON CONFLICT (key) DO NOTHING`,
    [key],
  );
  const { rows } = await client.query(
    `SELECT count, window_start, violations, backoff_until FROM rate_limits
     WHERE key = $1 FOR UPDATE`,
    [key],
  );
  const row = rows[0];

  // Active backoff -> deny without counting.
  if (row.backoff_until && new Date(row.backoff_until) > now) {
    const retryAfterSec = Math.max(1, Math.ceil((new Date(row.backoff_until) - now) / 1000));
    return { allowed: false, retryAfterSec };
  }
  // Stale window -> reset count (keep violations for backoff growth only if recent).
  const ws = new Date(row.window_start);
  let count = row.count;
  let violations = row.violations;
  if (ws < windowStart) {
    count = 0;
    // Decay violations after a full clean backoff period.
    if (!row.backoff_until || new Date(row.backoff_until) < windowStart) violations = 0;
    await client.query(`UPDATE rate_limits SET count = 0, window_start = now() WHERE key = $1`, [key]);
  }
  if (count + 1 > max) {
    violations += 1;
    const backoffSec = Math.min(BACKOFF_MAX_SEC, 60 * Math.pow(2, violations - 1));
    const backoffUntil = new Date(now.getTime() + backoffSec * 1000);
    await client.query(
      `UPDATE rate_limits SET violations = $2, backoff_until = $3 WHERE key = $1`,
      [key, violations, backoffUntil.toISOString()],
    );
    return { allowed: false, retryAfterSec: backoffSec };
  }
  await client.query(`UPDATE rate_limits SET count = count + 1 WHERE key = $1`, [key]);
  return { allowed: true, retryAfterSec: 0 };
}

// Convenience: run all buckets for a surface inside one transaction.
// limits: [{ key, max, windowSec }]. First trip wins.
export async function checkLimits({ keys, max, windowSec }) {
  const pool = getPool();
  if (!pool) return { allowed: false, retryAfterSec: 60, unavailable: true };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const key of keys) {
      const r = await checkBucket(client, { key, max, windowSec });
      if (!r.allowed) {
        // COMMIT, not ROLLBACK: the violation/backoff bookkeeping written by
        // checkBucket MUST persist, or exponential backoff can never escalate
        // (QA gate proved violations stayed 0 / backoff_until NULL forever).
        // The denied key itself was never count-incremented, so committing
        // does not count the denied request — only the backoff state.
        await client.query('COMMIT');
        return r;
      }
    }
    await client.query('COMMIT');
    return { allowed: true, retryAfterSec: 0 };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    console.error('[ratelimit] error', e && e.message ? e.message : e);
    // Fail closed on limiter errors for auth surfaces.
    return { allowed: false, retryAfterSec: 60, error: true };
  } finally {
    client.release();
  }
}

export function tooManyResponse(retryAfterSec) {
  return new Response(JSON.stringify({ error: 'too_many_requests' }), {
    status: 429,
    headers: {
      'content-type': 'application/json',
      'retry-after': String(retryAfterSec || 60),
    },
  });
}
