// migrate.mjs — runs migrations/001_track_b.sql against PGlite.
//
// Fidelity: the migration file runs VERBATIM (byte-identical), including the
// app_role creation, the REVOKE/GRANT layer, ENABLE/FORCE RLS, and both RLS
// policies. The ONLY PGlite-specific preamble (documented, not part of the
// migration) is:
//
//   CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
//
// These two PostgREST roles exist on Supabase but not in PGlite; the
// migration's `REVOKE ALL ... FROM PUBLIC, anon, authenticated` needs them
// to resolve. They are never granted anything here, matching production.
//
// After the migration, the session does `SET ROLE app_role` so every
// subsequent query — including the app's own route code via the pg stub —
// runs as the app role, exactly like production (DATABASE_URL role).
// This is what makes the RLS proofs faithful: PGlite's default user is a
// superuser (bypasses RLS even with FORCE); app_role is not.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getPGlite } from './pg-stub.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function runMigration() {
  const pg = getPGlite();
  // PGlite-only preamble: stub the PostgREST roles the migration revokes.
  await pg.query(`CREATE ROLE anon NOLOGIN`);
  await pg.query(`CREATE ROLE authenticated NOLOGIN`);

  const sql = await readFile(join(ROOT, 'migrations', '001_track_b.sql'), 'utf8');
  // exec() runs the multi-statement script (including the DO $$ block) over
  // the simple query protocol, exactly as psql would.
  await pg.exec(sql);
  const n = sql.split('\n').filter((l) => /;\s*$/.test(l.trim()) && !l.trim().startsWith('--')).length;

  // From here on, everything runs as app_role (production parity).
  await pg.query(`SET ROLE app_role`);
  const who = await pg.query(`SELECT current_user AS u`);
  if (who.rows[0].u !== 'app_role') throw new Error('SET ROLE app_role did not stick');
  return { statements: n };
}
