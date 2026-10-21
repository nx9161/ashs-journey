# Track B TEST GATE — integration suite (QA-owned)

**Run:** `cd tests && npm test` (i.e. `node --import ./register.mjs run.mjs`).
**Result on 2026-10-15:** 114 passed, 0 failed (PGlite, real Postgres).

## What this is

`tests/` is a SEPARATE npm package from the repo root. The root `package.json`
(Vercel-deployed) must never gain these dependencies — `@electric-sql/pglite`
(Apache-2.0, license verified from the installed package) is a test-only
dependency. `node_modules/` is gitignored.

## How it works

PGlite 0.3.9 has no TCP server, so a real `pg.Pool` cannot connect to it.
Instead, `register.mjs` installs a Node module-customization hook
(`resolve-hooks.mjs`) that redirects the bare specifier `pg` — imported only by
`api/_lib/db.mjs` — to `pg-stub.mjs`, a PGlite-backed drop-in implementing the
subset of the pg API the Track B code uses (`new Pool()`, `pool.connect()`,
`client.query(text, params)`, `client.release()`, `pool.on()`).

Transaction fidelity: route code issues `BEGIN` / `set_config('app.user_id',
$1, true)` / DML / `COMMIT` as separate `client.query()` calls on one
checked-out client. The stub holds a real PGlite transaction open between
`BEGIN` and `COMMIT`/`ROLLBACK` (promise-held `pglite.transaction()`
callback), so the transaction-local `set_config` path is EXACTLY what the
routes issue in production. `rowCount` is mapped from PGlite's `affectedRows`
(pg contract: rows-returned for SELECT, affected for writes).

## Migration

`migrate.mjs` runs `migrations/001_track_b.sql` VERBATIM via `pg.exec()`.
The only PGlite-specific preamble (documented here, not in the migration):

- `CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;` — these
  PostgREST roles exist on Supabase but not in PGlite; the migration's
  `REVOKE ALL ... FROM PUBLIC, anon, authenticated` needs them to resolve.
  They are granted nothing, matching production.

After the migration, the session runs `SET ROLE app_role`, so every query —
including the app's own route code — runs as the app role (production
parity with `DATABASE_URL`). This matters: PGlite's default user is a
superuser and superusers bypass RLS even with `FORCE ROW LEVEL SECURITY`;
`app_role` is not a superuser, so the RLS policies are genuinely enforced
and the fail-closed / isolation proofs are faithful.

## Seeding (better-auth-shaped rows)

No better-auth internals are hand-faked. Users, sessions, and credential
rows are created by driving the REAL code paths:

- `POST /api/auth/signup` (real handler: age gate, HIBP, argon2id via the
  real better-auth `signUpEmail`, 8 recovery codes hashed at rest).
- `auth.api.signInUsername` (real better-auth endpoint) for login sessions.
- `auth.api.signOut` for logout revocation.

Suite 01 seeds two RLS-probe users with direct SQL (documented in the file).

## Suites

| File | Proves |
|---|---|
| `suites/01-migration-rls.mjs` | migration shape (9 tables, `user.id` text per C6(iv)), RLS enabled+forced, both policies, CHECKs; (a) fail-closed without `app.user_id`; (b) two-user isolation; (g) 64KB CHECK |
| `suites/02-auth-flows.mjs` | signup (200 + 8 codes + session cookie), C1 argon2id at rest, validation gates, duplicate/age-gate, login, wrong-password, logout revocation |
| `suites/03-save-route.mjs` | PUT→GET round-trip, version CAS, 409 stale + first-wins, 404 absent, 422 keeps previous-good, 413 pre-parse, 401-before-422 (G14), 403 origin, cross-user 404 |
| `suites/04-recover.mjs` | recovery-code verify → password reset → all sessions revoked (C5), old cookie 401, new-password login, single-use + generic errors |
| `suites/05-delete.mjs` | wrong-password no-op, cascade zero-rows (user/session/account/saves/recovery_codes/rate_limits), anomaly anonymized |
| `suites/06-rate-limit.mjs` | bucket increments, backoff persistence, generic 429, route-level 12/min → 429 |

## Known PGlite-vs-production deltas (all documented, none hidden)

1. PGlite default user is superuser → tests `SET ROLE app_role` (see above).
2. `anon`/`authenticated` roles stubbed (see above).
3. `set_config('app.user_id', NULL, ...)` sets empty-string in Postgres — the
   fail-closed test uses `RESET app.user_id` (the honest clear).
4. The production GRANT layer (revoke from anon/authenticated, grant to
   app_role) runs verbatim here, but Supabase-side verification remains
   PENDING-PROVISIONING (migration §5 checklist: `SET ROLE app_role` +
   zero-row SELECTs on the live project).
5. Supavisor transaction-pooling + prepared-statement behavior (C6/H4),
   the C9 timing test (n≥200), cold-start limiter, live HIBP fixture, and
   Set-Cookie header assertions are PENDING-PROVISIONING — see the QA
   report's runbook.
