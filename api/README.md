# api/ — Track B: accounts + cloud saves (LIVE code, unprovisioned DB)

**Status: built on branch `feat/track-b-api`. The Supabase project is NOT
provisioned — no credentials exist.** Every route fails closed with
`503 {error:"auth_unavailable"}` until `DATABASE_URL` is set. Nothing crashes,
nothing leaks.

Binding decisions: ADR-005 (accounts + cloud saves), ADR-007 (RLS option (a)),
ADR-008 (Phase 3 gates), ADR-010 (all 17 owner questions resolved —
username-only + synthetic emails, argon2id, 7d/1d sessions, recovery codes).

## Layout

```
api/auth/[...all].mjs   better-auth handler (all /api/auth/* sub-paths)
api/auth/signup.mjs     POST — custom registration wrapper (age gate, HIBP,
                        recovery codes; returns them EXACTLY ONCE)
api/auth/recover.mjs    POST — password reset via recovery codes (single-use,
                        revokes all sessions)
api/save.mjs            GET slot list / GET ?slot=N payload download / PUT upsert (version-counter CAS)
api/save/meta.mjs       GET per-slot summaries (no payloads)
api/account/data.mjs    GET {username, createdAt, lastLogin} (access/portability)
api/account/delete.mjs  POST — password-verified deletion, one transaction
api/health.mjs          GET — liveness probe (keep-alive target, no auth)
api/purge.mjs           POST — retention purges (CRON_SECRET bearer)
api/lib/                db, auth (better-auth config), ip, rate-limit, hibp,
                        validator, blocklists, anomaly, http helpers
api/lib/data/tables.json  committed data-table snapshot (validator pinning)
api/scripts/gen-tables.mjs  regenerates the snapshot from src/data
```

## Provisioning (owner-side, secure flow — never chat)

1. Create the Supabase project (free tier) and run
   `migrations/001_track_b.sql` as the migration role (SQL editor).
2. Create the Vercel project; set server-side env vars:
   - `DATABASE_URL` — Supavisor **pooled** URL (port **6543**), role `app_role`
     (never `postgres`, never the 5432 direct URL).
   - `BETTER_AUTH_SECRET` — 256-bit CSPRNG (generated, never chosen).
   - `BETTER_AUTH_URL` — the production URL, e.g. `https://<project>.vercel.app`.
   - `CRON_SECRET` — 256-bit CSPRNG for `/api/purge` (schedule a nightly POST).
3. Add the `GAME_URL` GitHub secret (production URL) to activate the
   keep-alive workflow (`.github/workflows/keepalive.yml`).
4. DevOps verify-live: sign-up → recovery codes shown once → sign-in →
   save PUT/GET round-trip → conflict 409 → delete-account SELECT audit.

Until then, all auth code paths stay dark and the game ships guest-only.

## Auth contract

- **Identity:** username 3–16 chars `[a-z0-9_]` (NFKC + lowercased),
  reserved-name + profanity blocklists (`api/lib/blocklists.mjs`),
  `immutableUsername: true`. Synthetic email `<username>@game.local` exists
  only inside better-auth; the `databaseHooks` guard rejects any other email
  shape at `/sign-up/email`.
- **Passwords:** argon2id (`@node-rs/argon2`, m=65536/t=3/p=4), min length 8
  (ADR-010 OQ-10; see the AppSec C8 tension note in the build report),
  HIBP k-anonymity screening (fail-open + anomaly log on outage).
- **Sessions:** 7-day expiry, 1-day rolling refresh (better-auth defaults,
  OQ-19); `ashsjourney` cookie prefix; HttpOnly + Secure + SameSite=Lax;
  rotation on every login; server-side revocation on logout; password
  change/reset kills all other sessions.
- **Rate limits:** better-auth DB-backed limiter (`rateLimit` table) with
  custom rules `/sign-in/username` 10/min, `/sign-up/email` 5/min; custom
  DB-backed limiter (`rate_limits` table) with per-IP + per-account buckets
  and exponential backoff (never lockout): saves 12/min/user, signup
  10/hr, recover 5/hr, delete 5/hr. Trusted IP = `x-vercel-forwarded-for`
  only (never `x-real-ip`, never raw `x-forwarded-for`).
- **Errors:** generic `invalid_request` everywhere (no enumeration); 429
  bodies never name the limiter; 422 save errors carry field codes, never
  payload values.

## Save contract

- 3 slots/user, ≤64 KB payload (413 pre-parse gate + DB CHECK), slots 1–3.
- Version-counter CAS: `PUT {slot, payload, expectedVersion}` →
  `200 {version, updatedAt}`; `expectedVersion` of `null`, `undefined`, or
  `0` = first-write atomic INSERT (guest→account claim, first-wins; loser
  gets 409 → conflict sheet). 0 is accepted because versions start at 1, so
  it unambiguously means "no version known" — the client sends 0 for
  unknown/first-write (F1). Negative versions → `invalid_request`.
  stale version → `409 {error:"version_conflict", serverVersion}`;
  invalid payload → `422` + ROLLBACK (previous-good row kept).
- RLS option (a): explicit `BEGIN` on one pooled client,
  `set_config('app.user_id', $bound, true)` before any DML;
  `FORCE ROW LEVEL SECURITY` + grants to `app_role` only.
- Validator: `api/lib/validator.mjs` (hand-rolled, whitelist keys,
  `__proto__` denial, strict types, species/move/item ids pinned to
  `api/lib/data/tables.json` with a startup `tablesVersion` assert —
  fail closed). Regenerate after data changes:
  `node api/scripts/gen-tables.mjs` (CI: `--check`).
- Validator parity (honest): exactly two validators exist — the client
  pre-check `src/save/schema.mjs` (48 lines: top-level key whitelist +
  schema version + basic shapes, `{ok, errors}` only, no anomaly model) and
  the authoritative server gate `api/lib/validator.mjs` (350 lines: deep
  type checks, species/move/item pins, `__proto__` denial, anomaly
  detection, `{ok, errors, anomalies, summary}`). They are NOT in full
  corpus parity by design: the client is a fast local pre-flight that must
  never reject a save the server would accept; the server is the normative
  gate (ADR-010 §9(8) bar). A third validator may never be added — enforced
  by the single-validator gate in CI.
- Seeded fuzz battery: `api/scripts/validator.fuzz.test.mjs` (mulberry32,
  fixed seed, N=2000 random/mutated payloads; every result must be exactly
  accept-with-possible-anomalies or the 422 shape — no throws, no other
  shapes). The honest aggregate api/ branch-coverage number
  (2026-10-15: 68.5%) is recorded in that file's header comment.
- Anomalous-but-valid saves are accepted and written to `anomaly_log`
  (90-day purge) with no client-visible distinction.

## Dependency advisories (48h SLA — standing rule)

`.github/workflows/advisory.yml` runs weekly (Monday 09:00 UTC, log-only):
`npm audit` + `npm outdated` against the pinned api deps (root
package.json; the game client ships zero dependencies). **Standing rule:**
any HIGH/CRITICAL advisory it surfaces must be triaged within 48 hours —
assess exploitability against our pinned surface, then patch (version bump
+ license re-check per AppSec C13 / Tech Law C7) or record a written risk
acceptance in the build record. The advisory job never blocks CI; the SLA
is enforced by the rule, not the workflow. Merge-time protection is
separate: `npm audit --audit-level=high` in `ci.yml` fails the build on
HIGH/CRITICAL, and no package.json in the repo may declare
preinstall/install/postinstall scripts (install-script ban, CI-enforced).

## Retention & deletion (Tech Law)

- `rate_limits`: 30-day rolling purge. `anomaly_log`: 90-day purge.
  Both via `POST /api/purge` (nightly scheduler, `CRON_SECRET`).
- Deletion (`POST /api/account/delete`, password re-entry): one transaction
  deletes saves, recovery codes, user-keyed rate limits, anonymizes anomaly
  rows, and deletes the `user` row (cascades session/account/verification).
  In-flow confirmation. Backup-window honesty: live systems erased
  immediately; Supabase's ~7d backup rotation expires residual copies.

## Age gate (Tech Law §4)

`POST /api/auth/signup` requires `ageConfirmed: true` (server-side).
The age is checked ephemerally and NEVER persisted. Under-16 account creation
is refused by registration copy/policy until OQ-5 is answered; under-13 is
guest-only, always.

## Security headers (AppSec C12)

`vercel.json`: CSP (`script-src 'self'` — the game ships one external
script), `frame-ancestors 'none'`, HSTS (includeSubDomains + preload),
`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` on `/api/*`.
Player-controlled strings are charset-whitelisted server-side (T12 gate);
the client must render save-derived strings via textContent only.
