// anomaly.mjs — server-side anomaly log (AppSec C10(iv), Tech Law §2).
//
// Structurally-valid-but-impossible saves are ACCEPTED but logged here for
// review, with NO client-visible distinction (the response is identical to a
// clean accept). Rows are PII-bearing (they reference the account) and are
// purged after 90 days by /api/purge; account deletion anonymizes them.

import { getPool } from './db.mjs';

export async function logAnomaly({ userId, kind, detail }) {
  const pool = getPool();
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO anomaly_log (user_id, kind, detail) VALUES ($1, $2, $3)`,
      [userId || null, kind, detail ? JSON.stringify(detail).slice(0, 4000) : null],
    );
  } catch (e) {
    // The anomaly log must never break the request path.
    console.error('[anomaly] write failed', e && e.message ? e.message : e);
  }
}
