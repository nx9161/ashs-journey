// pg-stub.mjs — PGlite-backed drop-in for the `pg` module, used ONLY by the
// Track B integration suite (tests/). PGlite 0.3.9 has no TCP server, so a
// real pg.Pool cannot connect to it; this stub exposes the subset of the
// pg API the Track B code uses:
//
//   import pg from 'pg'; const { Pool } = pg;
//   new Pool({ connectionString, ... })          -> PGlitePool (config ignored)
//   pool.connect() -> client { query(text, params), release() }
//   pool.on('error', fn) -> this (no-op)
//   pool.query(text, params) -> one-shot convenience
//
// Transaction semantics: route code issues BEGIN / set_config / DML... /
// COMMIT as separate client.query() calls on one checked-out client. PGlite
// is single-connection, so this stub holds a real PGlite transaction open
// between BEGIN and COMMIT/ROLLBACK via the promise-held callback pattern.
// Queries outside a transaction run autocommit on the shared instance.
//
// Fidelity notes vs production (Supavisor pooled, port 6543):
//  - The transaction-local set_config('app.user_id', $1, true) path is
//    EXACTLY what the routes issue; RLS policies are real Postgres policies.
//  - PGlite has no roles: CREATE ROLE / GRANT / REVOKE lines of the
//    migration are skipped by tests/migrate.mjs (documented there). FORCE
//    ROW LEVEL SECURITY applies policies to the table owner too, so the
//    fail-closed proof (zero rows without the var set) remains valid — it is
//    the STRONGEST form of the check (owner included).

import { PGlite } from '@electric-sql/pglite';

const pglite = new PGlite({ dataDir: 'memory://' });
await pglite.waitReady;

export function getPGlite() {
  return pglite;
}

class PGliteClient {
  constructor() {
    this._tx = null;      // active PGlite tx handle (between BEGIN..COMMIT)
    this._hold = null;    // { res, rej } holding the tx open
    this._txp = null;     // the pglite.transaction() promise
    this._released = false;
  }

  async query(text, params) {
    if (this._released) throw new Error('client released');
    const cmd = String(text).trim().toUpperCase();
    if (cmd === 'BEGIN') return this._begin();
    if (cmd === 'COMMIT') return this._finish(true);
    if (cmd === 'ROLLBACK') return this._finish(false);
    const target = this._tx || pglite;
    const res = await target.query(text, params);
    // pg contract: rowCount = rows returned for SELECT, affected rows for
    // INSERT/UPDATE/DELETE. PGlite's affectedRows is 0 for SELECTs, so fall
    // back to rows.length whenever affectedRows is 0.
    // (Route code branches on rowCount: CAS rowcount 0 -> 404/409, etc.)
    const rowCount = (typeof res.affectedRows === 'number' && res.affectedRows > 0)
      ? res.affectedRows
      : (res.rows ? res.rows.length : 0);
    return { rows: res.rows, rowCount, command: res.command };
  }

  async _begin() {
    if (this._tx) throw new Error('nested BEGIN not supported by stub');
    let readyResolve;
    const ready = new Promise((r) => { readyResolve = r; });
    this._txp = pglite.transaction(async (tx) => {
      this._txRef = tx;
      readyResolve();
      // Hold the transaction open until _finish resolves/rejects this.
      await new Promise((res, rej) => { this._hold = { res, rej }; });
    });
    // Rollback path rejects _txp; swallow here (surfaced via _finish).
    this._txp.catch(() => {});
    await ready;
    this._tx = this._txRef;
    return { rows: [], rowCount: 0, command: 'BEGIN' };
  }

  async _finish(commit) {
    if (!this._tx) return { rows: [], rowCount: 0, command: commit ? 'COMMIT' : 'ROLLBACK' };
    const hold = this._hold;
    this._tx = null;
    this._txRef = null;
    this._hold = null;
    if (commit) hold.res();
    else hold.rej(new Error('stub rollback'));
    try { await this._txp; } catch { /* rollback path: expected */ }
    return { rows: [], rowCount: 0, command: commit ? 'COMMIT' : 'ROLLBACK' };
  }

  release() {
    this._released = true;
  }
}

class PGlitePool {
  constructor(_config) { /* config ignored: single in-memory PGlite */ }
  async connect() { return new PGliteClient(); }
  on() { return this; } // pool.on('error', ...) no-op
  async query(text, params) {
    const c = await this.connect();
    try { return await c.query(text, params); }
    finally { c.release(); }
  }
  async end() { /* nothing to close */ }
}

export const Pool = PGlitePool;
export default { Pool: PGlitePool };
