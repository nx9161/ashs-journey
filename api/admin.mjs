// api/admin.mjs — Command Deck: owner-only backend dashboard API (GET).
//
// Design: War Room dashboard dossier (AppSec Lead + Enterprise Architect,
// 2026-10-27) + ADR-023. ONE route file (10/12 Hobby functions). Read-only.
//
// Gate pipeline (order is binding, dossier §1.5):
//   405 non-GET → 503 unconfigured → 400 unknown action → 401 anonymous →
//   allowlist gate (unset: setup-only bootstrap for signed-in users, data
//   actions 403 admin_not_configured; set + non-owner: 403 forbidden) →
//   rate limit → dispatch.
//
// HARD RULE (dossier §2.8, grep-enforced at review): this file contains no
// star-selects and never queries the credential-bearing tables (the account
// table, the verification table, the recovery-code table) — not for data,
// not for counts, not for existence. Session rows are touched only as
// aggregates (MAX/COUNT over createdAt). User email is compared in-process
// for the allowlist and never serialised. Save payloads are selected only
// by the `player` action (summaries derived server-side, payload discarded)
// and the `save` action (deep-scrubbed, audit-logged before return).

import { auth, authUnavailable } from './_lib/auth.mjs';
import { isDbConfigured, getPool, pingDb } from './_lib/db.mjs';
import {
  json, invalidRequest, unavailable, unauthorized, methodNotAllowed,
} from './_lib/http.mjs';
import { checkLimits, tooManyResponse } from './_lib/rate-limit.mjs';
import { trustedClientIP } from './_lib/ip.mjs';
import { logAnomaly } from './_lib/anomaly.mjs';
import { tablesStatus } from './_lib/validator.mjs';

const ACTIONS = new Set(['overview', 'players', 'player', 'save', 'system', 'setup', 'health']);
const OVERVIEW_USER_GUARD = 500; // dossier B1: above this, aggregates need migration 003

// ---- no-store on EVERY response (dossier §4.1) ----
const NO_STORE = {
  'cache-control': 'no-store, no-cache, must-revalidate, private',
  pragma: 'no-cache',
  expires: '0',
};
function withNoStore(res) {
  for (const [k, v] of Object.entries(NO_STORE)) res.headers.set(k, v);
  return res;
}
function j(data, status = 200) {
  return json(data, status, NO_STORE);
}

// ---- allowlist (dossier §1.3): read per request, values never returned ----
function parseList(raw, lower) {
  if (typeof raw !== 'string') return [];
  return [...new Set(raw.split(',').map((s) => lower(s.trim())).filter(Boolean))].slice(0, 16);
}
function allowlists() {
  const usernames = parseList(process.env.ADMIN_USERNAMES, (s) => s.normalize('NFKC').toLowerCase());
  const emails = parseList(process.env.ADMIN_EMAILS, (s) => s.toLowerCase());
  return { usernames, emails, configured: usernames.length > 0 || emails.length > 0 };
}
function isOwner(user, lists) {
  return (
    (user.username && lists.usernames.includes(user.username.normalize('NFKC').toLowerCase())) ||
    (user.email && lists.emails.includes(user.email.toLowerCase()))
  );
}

// ---- session resolution (dossier §1.2): full user, not just the id ----
async function resolveSessionUser(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const u = session && session.user;
    if (!u || typeof u.id !== 'string' || !u.id || u.id.length > 128) return null;
    return {
      id: u.id,
      username: typeof u.username === 'string' ? u.username : null,
      email: typeof u.email === 'string' ? u.email : null,
    };
  } catch (e) {
    console.error('[admin] getSession failed', e && e.message ? e.message : e);
    return null;
  }
}

// ---- rate limiting (dossier §4.2): sequential buckets, fail closed ----
async function rateLimit(req, userId, strict) {
  const ip = trustedClientIP(req) || 'unknown';
  const acct = await checkLimits({
    keys: [`admin:acct:${userId}`], max: strict ? 30 : 120, windowSec: 60,
  });
  if (acct.unavailable || acct.error) return { response: withNoStore(unavailable()) };
  if (!acct.allowed) return { response: withNoStore(tooManyResponse(acct.retryAfterSec)) };
  const ipRl = await checkLimits({
    keys: [`admin:ip:${ip}`], max: strict ? 60 : 240, windowSec: 60,
  });
  if (ipRl.unavailable || ipRl.error) return { response: withNoStore(unavailable()) };
  if (!ipRl.allowed) return { response: withNoStore(tooManyResponse(ipRl.retryAfterSec)) };
  return {};
}

// ---- shared helpers ----
const iso = (v) => (v instanceof Date ? v.toISOString() : v);

// Same lenient summary derivation as api/save/meta.mjs.
function summarize(payload) {
  let playtimeSec = 0, storyBeat = 0, badgeCount = 0;
  try {
    const p = payload || {};
    if (p.player && Number.isInteger(p.player.playtimeSec)) playtimeSec = p.player.playtimeSec;
    if (p.story && Number.isInteger(p.story.beat)) storyBeat = p.story.beat;
    for (const region of ['kanto', 'orange', 'johto']) {
      if (p.badges && Array.isArray(p.badges[region])) badgeCount += p.badges[region].length;
    }
  } catch { /* payload was validated on write; be lenient on read */ }
  return { playtimeSec, storyBeat, badgeCount };
}

// Deep-scrub (dossier §2.4): drop credential-shaped keys at ANY depth before
// a payload is serialised. The write validator should make this a no-op; a
// hit is logged as an anomaly because it means a bad field reached storage.
const DENY_KEY = /password|passwd|token|secret|code_hash|codehash|recovery|hash|authorization|cookie/i;
function scrubPayload(value, state, depth) {
  if (depth > 32) return null;
  if (Array.isArray(value)) return value.map((v) => scrubPayload(v, state, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (DENY_KEY.test(k)) { state.dropped += 1; continue; }
      out[k] = scrubPayload(v, state, depth + 1);
    }
    return out;
  }
  return value;
}

function validUserId(raw) {
  return typeof raw === 'string' && raw.length >= 1 && raw.length <= 128 ? raw : null;
}

// ---- actions ----

async function actHealth() {
  return j({
    ok: true,
    authConfigured: isDbConfigured(),
    dbOk: await pingDb(),
    version: 'track-b',
    time: new Date().toISOString(),
  });
}

async function actSetup(state) {
  const lists = allowlists();
  let urlParseable = false;
  if (process.env.BETTER_AUTH_URL) {
    try { new URL(process.env.BETTER_AUTH_URL); urlParseable = true; } catch { urlParseable = false; }
  }
  return j({
    state,
    probes: {
      databaseUrl: { configured: isDbConfigured(), ok: await pingDb() },
      betterAuthSecret: { configured: !!process.env.BETTER_AUTH_SECRET },
      betterAuthUrl: { configured: !!process.env.BETTER_AUTH_URL, parseable: urlParseable },
      adminUsernames: { configured: lists.usernames.length > 0, entries: lists.usernames.length },
      adminEmails: { configured: lists.emails.length > 0, entries: lists.emails.length },
      cronSecret: { configured: !!process.env.CRON_SECRET },
    },
    manualChecks: [
      {
        id: 'github_game_url', checkable: false,
        instruction: 'Manual check — this dashboard runs on Vercel and cannot see GitHub repository secrets. In the GitHub repo, go to Settings → Secrets and variables → Actions and confirm a secret named GAME_URL exists and equals the production site URL with no trailing slash. The keep-alive workflow is inert until it exists.',
      },
      {
        id: 'vercel_git_link', checkable: false,
        instruction: 'Manual check — in the Vercel dashboard, open each project (ashs-journey-game and ashs-journey-personal) → Settings → Git, and confirm the nx9161/ashs-journey repository is connected. When it is, every push to main deploys automatically; until then, deployments are manual.',
      },
      {
        id: 'migration_003', checkable: false,
        instruction: 'Optional — migrations/003_admin_dashboard.sql ships in the repo but is NOT applied. The dashboard works without it (per-player save aggregates). Apply it only when the player count grows past a few hundred: run it as the database owner (Supabase SQL editor), never as app_role. Steps are in the file header.',
      },
    ],
  });
}

async function actOverview() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const u = await client.query(
      `SELECT count(*)::int AS total,
              (count(*) FILTER (WHERE "createdAt" >= now() - interval '7 days'))::int AS signups_7d,
              (count(*) FILTER (WHERE "createdAt" >= now() - interval '30 days'))::int AS signups_30d,
              max("createdAt") AS latest_signup_at
       FROM "user"`,
    );
    const totals = u.rows[0];
    const recent = await client.query(
      `SELECT id, username, "createdAt" FROM "user" ORDER BY "createdAt" DESC LIMIT 5`,
    );
    const recentSignups = recent.rows.map((r) => ({
      userId: r.id, username: r.username, createdAt: iso(r.createdAt),
    }));
    const users = {
      total: totals.total,
      signups7d: totals.signups_7d,
      signups30d: totals.signups_30d,
      latestSignupAt: iso(totals.latest_signup_at),
    };
    if (totals.total > OVERVIEW_USER_GUARD) {
      return j({ users, saves: null, recentSaves: [], recentSignups, savesNote: 'aggregate_unavailable' });
    }
    // Saves under FORCE RLS (dossier B1, Option A): enumerate ids from the
    // user table (no RLS), then rebind the app.user_id GUC per player inside
    // ONE transaction on ONE client and aggregate in JS. Never a bare
    // aggregate over the saves table — it would silently count zero rows.
    const ids = await client.query(`SELECT id, username FROM "user"`);
    const nameById = new Map(ids.rows.map((r) => [r.id, r.username]));
    let saveTotal = 0, totalBytes = 0;
    const allRows = [];
    await client.query('BEGIN');
    for (const { id } of ids.rows) {
      await client.query(`SELECT set_config('app.user_id', $1, true)`, [id]);
      const s = await client.query(
        `SELECT user_id, slot, version, schema_version,
                octet_length(payload::text)::int AS size_bytes, updated_at
         FROM saves WHERE user_id = $1 ORDER BY updated_at DESC`,
        [id],
      );
      for (const row of s.rows) {
        saveTotal += 1;
        totalBytes += row.size_bytes;
        allRows.push(row);
      }
    }
    await client.query('COMMIT');
    allRows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const recentSaves = allRows.slice(0, 10).map((r) => ({
      userId: r.user_id,
      username: nameById.get(r.user_id) || null,
      slot: r.slot,
      version: r.version,
      schemaVersion: r.schema_version,
      sizeBytes: r.size_bytes,
      updatedAt: iso(r.updated_at),
    }));
    return j({
      users,
      saves: { total: saveTotal, totalBytes, slotsPerPlayerMax: 3 },
      recentSaves,
      recentSignups,
    });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    throw e;
  } finally {
    client.release();
  }
}

async function actPlayers(url) {
  const qRaw = url.searchParams.get('q');
  const q = (qRaw == null ? '' : String(qRaw)).slice(0, 32);
  const limitRaw = url.searchParams.get('limit');
  const offsetRaw = url.searchParams.get('offset');
  const limit = limitRaw == null ? 25 : Number(limitRaw);
  const offset = offsetRaw == null ? 0 : Number(offsetRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return j({ error: 'invalid_request' }, 400);
  if (!Number.isInteger(offset) || offset < 0) return j({ error: 'invalid_request' }, 400);
  const pattern = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
  const pool = getPool();
  const total = await pool.query(
    `SELECT count(*)::int AS total FROM "user" WHERE ($1 = '' OR username ILIKE $2 ESCAPE '\\')`,
    [q, pattern],
  );
  const page = await pool.query(
    `SELECT u.id, u.username, u."createdAt",
            (SELECT max(s."createdAt") FROM session s WHERE s."userId" = u.id) AS last_login
     FROM "user" u
     WHERE ($1 = '' OR u.username ILIKE $2 ESCAPE '\\')
     ORDER BY u."createdAt" DESC
     LIMIT $3 OFFSET $4`,
    [q, pattern, limit, offset],
  );
  return j({
    rows: page.rows.map((r) => ({
      userId: r.id,
      username: r.username,
      createdAt: iso(r.createdAt),
      lastLogin: iso(r.last_login),
    })),
    total: total.rows[0].total,
    limit,
    offset,
  });
}

// Slot rows for one target player; caller owns the client/transaction.
async function targetSlots(client, targetId, withPayload) {
  await client.query(`SELECT set_config('app.user_id', $1, true)`, [targetId]);
  const cols = withPayload
    ? 'slot, version, schema_version, updated_at, client_updated_at, octet_length(payload::text)::int AS size_bytes, payload'
    : 'slot, version, schema_version, updated_at, client_updated_at, octet_length(payload::text)::int AS size_bytes';
  return client.query(
    `SELECT ${cols} FROM saves WHERE user_id = $1 ORDER BY slot`,
    [targetId],
  );
}

async function actPlayer(url, admin) {
  const targetId = validUserId(url.searchParams.get('userId'));
  if (!targetId) return j({ error: 'invalid_request' }, 400);
  const pool = getPool();
  const facts = await pool.query(
    `SELECT id, username, "createdAt", "updatedAt" FROM "user" WHERE id = $1`,
    [targetId],
  );
  if (facts.rows.length === 0) return j({ error: 'not_found' }, 404);
  const login = await pool.query(
    `SELECT max("createdAt") AS last_login FROM session WHERE "userId" = $1`,
    [targetId],
  );
  const client = await pool.connect();
  let slots;
  try {
    await client.query('BEGIN');
    const s = await targetSlots(client, targetId, true);
    await client.query('COMMIT');
    slots = s.rows.map((r) => ({
      slot: r.slot,
      version: r.version,
      schemaVersion: r.schema_version,
      sizeBytes: r.size_bytes,
      updatedAt: iso(r.updated_at),
      clientUpdatedAt: iso(r.client_updated_at),
      ...summarize(r.payload),
    }));
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    throw e;
  } finally {
    client.release();
  }
  await logAnomaly({ userId: admin.id, kind: 'admin_view', detail: { action: 'player', targetUserId: targetId } });
  const f = facts.rows[0];
  return j({
    userId: f.id,
    username: f.username,
    createdAt: iso(f.createdAt),
    updatedAt: iso(f.updatedAt),
    lastLogin: iso(login.rows[0].last_login),
    slots,
  });
}

async function actSave(url, admin) {
  const targetId = validUserId(url.searchParams.get('userId'));
  const slotRaw = url.searchParams.get('slot');
  const slot = slotRaw == null ? NaN : Number(slotRaw);
  if (!targetId || !Number.isInteger(slot) || slot < 1 || slot > 3) {
    return j({ error: 'invalid_request' }, 400);
  }
  const pool = getPool();
  const who = await pool.query(`SELECT username FROM "user" WHERE id = $1`, [targetId]);
  if (who.rows.length === 0) return j({ error: 'not_found' }, 404);
  const client = await pool.connect();
  let row;
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.user_id', $1, true)`, [targetId]);
    const s = await client.query(
      `SELECT slot, version, schema_version, updated_at, client_updated_at,
              octet_length(payload::text)::int AS size_bytes, payload
       FROM saves WHERE user_id = $1 AND slot = $2`,
      [targetId, slot],
    );
    await client.query('COMMIT');
    row = s.rows[0];
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* noop */ }
    throw e;
  } finally {
    client.release();
  }
  if (!row) return j({ error: 'not_found' }, 404);
  const state = { dropped: 0 };
  const payload = scrubPayload(row.payload, state, 0);
  if (state.dropped > 0) {
    await logAnomaly({
      userId: admin.id, kind: 'admin_payload_scrub_hit',
      detail: { targetUserId: targetId, slot, dropped: state.dropped },
    });
  }
  // Audit BEFORE the payload leaves the process (dossier §5).
  await logAnomaly({ userId: admin.id, kind: 'admin_view', detail: { action: 'save', targetUserId: targetId, slot } });
  return j({
    userId: targetId,
    username: who.rows[0].username,
    slot: row.slot,
    version: row.version,
    schemaVersion: row.schema_version,
    sizeBytes: row.size_bytes,
    updatedAt: iso(row.updated_at),
    clientUpdatedAt: iso(row.client_updated_at),
    summary: summarize(row.payload),
    payload,
  });
}

async function actSystem() {
  const pool = getPool();
  let dbOk = false, latencyMs = null;
  const client = await pool.connect().catch(() => null);
  if (client) {
    const t0 = performance.now();
    try {
      await Promise.race([
        client.query('SELECT 1'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
      ]);
      dbOk = true;
      latencyMs = Math.round(performance.now() - t0);
    } catch {
      dbOk = false;
      latencyMs = null;
    } finally {
      client.release();
    }
  }
  const t = tablesStatus();
  return j({
    apiVersion: 'track-b',
    node: process.version,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelRegion: process.env.VERCEL_REGION ?? null,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    tables: { ready: t.ready, version: t.version },
    db: { configured: isDbConfigured(), ok: dbOk, latencyMs },
    time: new Date().toISOString(),
  });
}

// ---- main handler: the §1.5 pipeline, in order ----
export async function handler(req) {
  if (req.method !== 'GET') return withNoStore(methodNotAllowed(['GET']));
  if (!isDbConfigured() || authUnavailable()) return withNoStore(unavailable());

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  if (!action || !ACTIONS.has(action)) return withNoStore(invalidRequest(400));

  const user = await resolveSessionUser(req);
  if (!user) return withNoStore(unauthorized());

  const lists = allowlists();
  if (!lists.configured) {
    // Bootstrap state: a signed-in user may read ONLY the setup probes.
    if (action !== 'setup') return j({ error: 'admin_not_configured' }, 403);
    const rl = await rateLimit(req, user.id, false);
    if (rl.response) return rl.response;
    await logAnomaly({ userId: user.id, kind: 'admin_view', detail: { action: 'setup', bootstrap: true } });
    return actSetup('bootstrap');
  }
  if (!isOwner(user, lists)) return j({ error: 'forbidden' }, 403);

  const rl = await rateLimit(req, user.id, action === 'save');
  if (rl.response) return rl.response;

  try {
    switch (action) {
      case 'health': return await actHealth();
      case 'setup': return await actSetup('ready');
      case 'overview': return await actOverview();
      case 'players': return await actPlayers(url);
      case 'player': return await actPlayer(url, user);
      case 'save': return await actSave(url, user);
      case 'system': return await actSystem();
      default: return withNoStore(invalidRequest(400));
    }
  } catch (e) {
    console.error('[admin] action failed', action, e && e.message ? e.message : e);
    return j({ error: 'invalid_request' }, 500);
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
