// api/account/data.mjs — data-subject access/portability view (GET, Tech Law §3).
// Returns the account record the operator holds: {username, createdAt, lastLogin}.
// The player can already download any save as JSON (export affordance); this
// covers the account-record side of Art. 15/20 at this scale.

import { isDbConfigured, getPool } from '../lib/db.mjs';
import { authUnavailable } from '../lib/auth.mjs';
import {
  json, unavailable, unauthorized, requireUserId, methodNotAllowed,
} from '../lib/http.mjs';

export default async function handler(req) {
  if (req.method !== 'GET') return methodNotAllowed(['GET']);
  if (!isDbConfigured() || authUnavailable()) return unavailable();

  const userId = await requireUserId(req);
  if (!userId) return unauthorized();

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
    const u = await client.query(
      `SELECT username, "createdAt" AS "createdAt" FROM "user" WHERE id = $1`,
      [userId],
    );
    const s = await client.query(
      `SELECT MAX("createdAt") AS "lastLogin" FROM session WHERE "userId" = $1`,
      [userId],
    );
    await client.query('COMMIT');
    if (u.rowCount === 0) return unauthorized();
    const row = u.rows[0];
    const lastLogin = s.rows[0] && s.rows[0].lastLogin;
    const iso = (v) => (v instanceof Date ? v.toISOString() : v);
    return json({
      username: row.username,
      createdAt: iso(row.createdAt),
      lastLogin: iso(lastLogin),
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    console.error('[account/data] failed', e && e.message ? e.message : e);
    return json({ error: 'invalid_request' }, 500);
  } finally {
    client.release();
  }
}
