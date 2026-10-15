// api/save/meta.mjs — per-slot save summaries (GET).
//
// Summary only, no payloads (EA condition 8 / RLS §2.4):
// [{slot, version, updatedAt, schemaVersion, playtimeSec, storyBeat, badgeCount}]
// playtimeSec/storyBeat/badgeCount are parsed server-side from the payload.
// Same WHERE user_id = <server-derived> scoping as PUT (C10(v)).

import { isDbConfigured, getPool } from '../lib/db.mjs';
import { authUnavailable } from '../lib/auth.mjs';
import { trustedClientIP } from '../lib/ip.mjs';
import { checkLimits, tooManyResponse } from '../lib/rate-limit.mjs';
import {
  json, unavailable, unauthorized, requireUserId, methodNotAllowed,
} from '../lib/http.mjs';

export default async function handler(req) {
  if (req.method !== 'GET') return methodNotAllowed(['GET']);
  if (!isDbConfigured() || authUnavailable()) return unavailable();

  const userId = await requireUserId(req);
  if (!userId) return unauthorized();

  const ip = trustedClientIP(req) || 'unknown';
  const rl = await checkLimits({ keys: [`meta:acct:${userId}`, `meta:ip:${ip}`], max: 60, windowSec: 60 });
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
    const r = await client.query(
      `SELECT slot, version, updated_at, schema_version, payload
       FROM saves WHERE user_id = $1 ORDER BY slot`,
      [userId],
    );
    await client.query('COMMIT');
    return json(r.rows.map((row) => {
      let playtimeSec = 0, storyBeat = 0, badgeCount = 0;
      try {
        const p = row.payload || {};
        if (p.player && Number.isInteger(p.player.playtimeSec)) playtimeSec = p.player.playtimeSec;
        if (p.story && Number.isInteger(p.story.beat)) storyBeat = p.story.beat;
        for (const region of ['kanto', 'orange', 'johto']) {
          if (p.badges && Array.isArray(p.badges[region])) badgeCount += p.badges[region].length;
        }
      } catch { /* payload was validated on write; be lenient on read */ }
      return {
        slot: row.slot,
        version: row.version,
        updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
        schemaVersion: row.schema_version,
        playtimeSec,
        storyBeat,
        badgeCount,
      };
    }));
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    console.error('[save/meta] failed', e && e.message ? e.message : e);
    return json({ error: 'invalid_request' }, 500);
  } finally {
    client.release();
  }
}
