// db.mjs — pg Pool for the Track B API. Fail-closed: every route checks
// isDbConfigured() first and returns 503 {error:"auth_unavailable"} when the
// Supabase project is not provisioned yet. Nothing here ever throws at import.
//
// DATABASE_URL must be the Supavisor POOLED connection string (port 6543),
// role app_role (never postgres). SSL is always on; Supabase pooler hosts get
// the documented { rejectUnauthorized: false } setting.

import pg from 'pg';

const { Pool } = pg;

let pool = null;
let poolError = null;

export function isDbConfigured() {
  return !!process.env.DATABASE_URL;
}

function sslFor(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const port = u.port;
    // Supabase Supavisor pooler: documented pg setting (their cert chain is not
    // verifiable against public CAs through node-postgres defaults).
    if (host.endsWith('.supabase.co') || port === '6543') {
      return { rejectUnauthorized: false };
    }
    return true; // default verification for anything else
  } catch {
    return true;
  }
}

export function getPool() {
  if (!isDbConfigured()) return null;
  if (pool) return pool;
  if (poolError) return null;
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslFor(process.env.DATABASE_URL),
      max: 3, // Vercel serverless: small, warm-instance reuse
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: true,
    });
    pool.on('error', (e) => {
      // Idle-client errors must not crash the function.
      console.error('[db] pool error', e && e.message ? e.message : e);
    });
    return pool;
  } catch (e) {
    poolError = e;
    console.error('[db] pool creation failed', e && e.message ? e.message : e);
    return null;
  }
}

// Lightweight liveness probe for /api/health (the keep-alive target).
export async function pingDb(timeoutMs = 4000) {
  const p = getPool();
  if (!p) return false;
  const client = await p.connect().catch(() => null);
  if (!client) return false;
  try {
    await Promise.race([
      client.query('SELECT 1'),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    client.release();
  }
}
