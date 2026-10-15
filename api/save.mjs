// api/save.mjs — cloud save slots (GET list, PUT upsert).
//
// Sync protocol (normative: drawers/phase2-rls-resolution.md §2):
// - GET  -> 200 [{slot, version, updatedAt}] scoped WHERE user_id = server id.
// - GET ?slot=N -> 200 {slot, version, payload, updatedAt} (payload download for
//   new-device login / pull; same scoping; 404 when the slot is empty).
//   Added Track B gap-fix: the client pull path requires payload download.
// - PUT {slot, payload, expectedVersion}:
//   - 413 when Content-Length (or actual bytes) > 65536 BEFORE JSON parse.
//   - Hand-rolled validator -> 422 + ROLLBACK (previous-good row retained by
//     construction). Structurally-valid-but-impossible -> accepted + anomaly_log.
//   - expectedVersion null/undefined/0 -> first-write INSERT (ON CONFLICT
//     DO NOTHING; 0 rows => a row appeared concurrently => 409, client
//     re-reads meta). 0 is an accepted first-write signal: save versions
//     start at 1, so 0 unambiguously means "no version known" (F1: the
//     sync client sends 0 for unknown/first-write). Negative versions are
//     rejected (invalid_request).
//     This is the guest->registered claim path: atomic first-wins at the DB
//     (RLS §2.9); the loser gets the conflict sheet, never an overwrite.
//   - expectedVersion set -> CAS UPDATE ... WHERE version = $expectedVersion.
//     0 rows -> re-read on the same client: missing => 404, present => 409
//     {error:"version_conflict", serverVersion}. Never a silent overwrite.
// - Every request: explicit BEGIN on ONE checked-out client; set_config
//   ('app.user_id', $bound, true) BEFORE any DML (RLS option (a), C6).
// - 401 precedes any resource code (G14). Rate limit: 12/min/user + 120/min/IP.

import { getPool, isDbConfigured } from './lib/db.mjs';
import { authUnavailable } from './lib/auth.mjs';
import { trustedClientIP } from './lib/ip.mjs';
import { checkLimits, tooManyResponse } from './lib/rate-limit.mjs';
import { logAnomaly } from './lib/anomaly.mjs';
import {
  validateSave, checkNestingDepth, tablesReady, tablesStatus,
} from './lib/validator.mjs';
import {
  json, invalidRequest, unavailable, unauthorized, readBody, parseJson,
  requireUserId, assertSameOrigin, methodNotAllowed,
} from './lib/http.mjs';

const MAX_SAVE_BYTES = 65536;

// 12/min/user on /api/save (brief); per-IP bucket is looser (120/min) — the
// per-account bucket is the binding one, the IP bucket catches distributed
// abuse. Exponential backoff on violation, never lockout (C7).
async function rateLimitSave(userId, ip) {
  const acct = await checkLimits({ keys: [`save:acct:${userId}`], max: 12, windowSec: 60 });
  if (!acct.allowed || acct.unavailable || acct.error) return acct;
  return checkLimits({ keys: [`save:ip:${ip}`], max: 120, windowSec: 60 });
}

async function withSaveTx(userId, fn) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // H1/C6: bound set_config on the same client, inside the transaction,
    // BEFORE any DML. Transaction-scoped: cannot leak across pooled tenants.
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [userId]);
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    throw e;
  } finally {
    client.release();
  }
}

async function handleGet(req) {
  const userId = await requireUserId(req);
  if (!userId) return unauthorized();
  const ip = trustedClientIP(req) || 'unknown';
  const rl = await rateLimitSave(userId, ip);
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  const rows = await (async () => {
    try {
      return await withSaveTx(userId, async (client) => {
        const r = await client.query(
          `SELECT slot, version, updated_at FROM saves WHERE user_id = $1 ORDER BY slot`,
          [userId],
        );
        return r.rows;
      });
    } catch (e) {
      console.error('[save] get failed', e && e.message ? e.message : e);
      return null;
    }
  })();
  if (!rows) return json({ error: 'invalid_request' }, 500);
  return json(rows.map((r) => ({
    slot: r.slot,
    version: r.version,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  })));
}

async function handleGetSlot(req, slot) {
  const userId = await requireUserId(req);
  if (!userId) return unauthorized(); // 401 before any resource code (G14)
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) return invalidRequest();
  const ip = trustedClientIP(req) || 'unknown';
  const rl = await rateLimitSave(userId, ip);
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  let row = null;
  try {
    row = await withSaveTx(userId, async (client) => {
      const r = await client.query(
        `SELECT slot, version, payload, updated_at FROM saves WHERE user_id = $1 AND slot = $2`,
        [userId, slot],
      );
      return r.rows[0] || null;
    });
  } catch (e) {
    console.error('[save] get slot failed', e && e.message ? e.message : e);
    return json({ error: 'invalid_request' }, 500);
  }
  if (!row) return json({ error: 'not_found' }, 404);
  return json({
    slot: row.slot,
    version: row.version,
    payload: row.payload,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  });
}

async function handlePut(req) {
  const userId = await requireUserId(req);
  if (!userId) return unauthorized(); // 401 before any resource code (G14)
  if (!tablesReady()) {
    console.error('[save] validator tables unavailable', tablesStatus());
    return unavailable(); // fail closed on table skew
  }

  const bodyRes = await readBody(req, MAX_SAVE_BYTES);
  if (bodyRes.response) return bodyRes.response;
  if (!checkNestingDepth(bodyRes.raw, 32)) {
    return json({ error: 'payload_too_large' }, 413);
  }
  const parsed = parseJson(bodyRes.raw);
  if (parsed.response) return parsed.response;
  const body = parsed.data;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return invalidRequest();

  // Mass-assignment guard (T7d): only these four keys; user_id comes ONLY from
  // the session lookup, never from the body.
  const keys = Object.keys(body);
  for (const k of keys) {
    if (!['slot', 'payload', 'schemaVersion', 'expectedVersion'].includes(k)) return invalidRequest();
  }
  const slot = body.slot;
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) return invalidRequest();
  const expectedVersion = body.expectedVersion;
  if (!(expectedVersion === null || expectedVersion === undefined) &&
      (!Number.isInteger(expectedVersion) || expectedVersion < 0)) {
    return invalidRequest();
  }
  // First-write signal: null/undefined/0. Versions start at 1, so 0
  // unambiguously means "no version known" — the client sends 0 for
  // unknown/first-write (sync.mjs _lastSyncedVersion, claimGuest,
  // login-merge). Both route into the atomic first-write INSERT below.

  const ip = trustedClientIP(req) || 'unknown';
  const rl = await rateLimitSave(userId, ip);
  if (rl.unavailable || rl.error) return unavailable();
  if (!rl.allowed) return tooManyResponse(rl.retryAfterSec);

  // Typed validation BEFORE any write. Invalid -> 422, row untouched.
  const v = validateSave(body.payload);
  if (!v.ok) {
    return json({ error: 'invalid_request', code: 'save_invalid' }, 422);
  }

  const payloadText = JSON.stringify(body.payload);
  const schemaVersion = 1;

  try {
    const result = await withSaveTx(userId, async (client) => {
      if (expectedVersion === null || expectedVersion === undefined || expectedVersion === 0) {
        // First-write path: atomic INSERT (guest->account claim, §2.9).
        const ins = await client.query(
          `INSERT INTO saves (user_id, slot, payload, schema_version, version, client_updated_at, updated_at)
           VALUES ($1, $2, $3::jsonb, $4, 1, now(), now())
           ON CONFLICT (user_id, slot) DO NOTHING
           RETURNING version, updated_at`,
          [userId, slot, payloadText, schemaVersion],
        );
        if (ins.rowCount === 1) {
          return { status: 'created', version: ins.rows[0].version, updatedAt: ins.rows[0].updated_at };
        }
        // A row appeared concurrently -> conflict; client re-reads meta.
        const cur = await client.query(
          `SELECT version, updated_at FROM saves WHERE user_id = $1 AND slot = $2`,
          [userId, slot],
        );
        return { status: 'conflict', serverVersion: cur.rows[0].version };
      }
      // CAS path: compare-and-swap on the version counter.
      const upd = await client.query(
        `UPDATE saves SET payload = $3::jsonb, schema_version = $4, version = version + 1,
                updated_at = now(), client_updated_at = now()
         WHERE user_id = $1 AND slot = $2 AND version = $5
         RETURNING version, updated_at`,
        [userId, slot, payloadText, schemaVersion, expectedVersion],
      );
      if (upd.rowCount === 1) {
        return { status: 'ok', version: upd.rows[0].version, updatedAt: upd.rows[0].updated_at };
      }
      const cur = await client.query(
        `SELECT version FROM saves WHERE user_id = $1 AND slot = $2`,
        [userId, slot],
      );
      if (cur.rowCount === 0) return { status: 'absent' };
      return { status: 'conflict', serverVersion: cur.rows[0].version };
    });

    if (result.status === 'absent') return json({ error: 'invalid_request' }, 404);
    if (result.status === 'conflict') {
      return json({ error: 'version_conflict', serverVersion: result.serverVersion }, 409);
    }
    // Accepted. Anomalous-but-structurally-valid -> logged, no client distinction.
    if (v.anomalies.length > 0) {
      await logAnomaly({
        userId,
        kind: 'save_anomaly',
        detail: { slot, anomalies: v.anomalies, version: result.version },
      });
    }
    return json({
      version: result.version,
      updatedAt: result.updatedAt instanceof Date ? result.updatedAt.toISOString() : result.updatedAt,
    });
  } catch (e) {
    console.error('[save] put failed', e && e.message ? e.message : e);
    return invalidRequest();
  }
}

export default async function handler(req) {
  if (!isDbConfigured() || authUnavailable()) return unavailable();
  if (req.method === 'GET') {
    const slotParam = new URL(req.url, 'http://localhost').searchParams.get('slot');
    if (slotParam !== null) return handleGetSlot(req, Number(slotParam));
    return handleGet(req);
  }
  if (req.method === 'PUT') {
    if (!assertSameOrigin(req)) return invalidRequest(403);
    return handlePut(req);
  }
  return methodNotAllowed(['GET', 'PUT']);
}
