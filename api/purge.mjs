// api/purge.mjs — retention purges (POST, Tech Law §2/C5).
//
// - rate_limits rows older than 30 days -> deleted.
// - anomaly_log rows older than 90 days -> deleted.
//
// Protected by CRON_SECRET (bearer). Fail closed: 503 when DATABASE_URL or
// CRON_SECRET is unset, 401 on a wrong/missing secret. Wire a scheduler (Vercel
// Cron, GitHub Actions, or pg_cron) to POST this endpoint nightly. The body is
// ignored.

import { createHash, timingSafeEqual } from 'node:crypto';
import { getPool, isDbConfigured } from './_lib/db.mjs';
import { authUnavailable } from './_lib/auth.mjs';
import { json, unavailable, methodNotAllowed } from './_lib/http.mjs';

function secretsEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

export default async function handler(req) {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  if (!isDbConfigured() || authUnavailable()) return unavailable();
  const secret = process.env.CRON_SECRET;
  if (!secret) return unavailable(); // fail closed: no secret configured
  const authz = req.headers.get('authorization') || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (!secretsEqual(token, secret)) {
    return json({ error: 'invalid_request' }, 401);
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    const rl = await client.query(
      `DELETE FROM rate_limits WHERE window_start < now() - interval '30 days'`,
    );
    const al = await client.query(
      `DELETE FROM anomaly_log WHERE created_at < now() - interval '90 days'`,
    );
    // better-auth's own rateLimit table: prune rows older than the longest
    // configured window (7 days is generous; its limiter self-prunes too).
    const ba = await client.query(
      `DELETE FROM "rateLimit" WHERE "lastRequest" < (extract(epoch from now()) * 1000)::bigint - 7 * 24 * 3600 * 1000`,
    );
    return json({
      ok: true,
      purged: { rate_limits: rl.rowCount, anomaly_log: al.rowCount, rateLimit: ba.rowCount },
    });
  } catch (e) {
    console.error('[purge] failed', e && e.message ? e.message : e);
    return json({ error: 'invalid_request' }, 500);
  } finally {
    client.release();
  }
}
