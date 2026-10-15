-- 001_track_b.sql — Track B (auth + cloud saves) schema.
--
-- better-auth tables ("user", "session", "account", "verification", "rateLimit")
-- were generated from the PINNED better-auth 1.7.10 package's own schema
-- (getSchema() with the shipped options + the postgres type mapping in
-- better-auth/dist/db/get-migration.mjs: string->text, boolean->boolean,
-- number->integer, date->timestamptz). Table/column names verified from source,
-- not guessed. The username plugin contributes "user"."username" (nullable,
-- UNIQUE). rateLimit.storage="database" contributes the "rateLimit" table.
--
-- Track B tables: saves, recovery_codes, rate_limits, anomaly_log.
--
-- RUN AS: a privileged migration role (Supabase SQL editor / service_role) —
-- NEVER as app_role. The app connects as app_role over the Supavisor pooled
-- URL (port 6543) only.

-- ---------------------------------------------------------------- 0. roles --
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role NOINHERIT LOGIN;
  END IF;
END $$;
-- The app_role password/secret is provisioned via the secure flow (never here).

-- ------------------------------------------------- 1. better-auth tables --
CREATE TABLE IF NOT EXISTS "user" (
  id            text        PRIMARY KEY,
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  "emailVerified" boolean   NOT NULL,
  image         text,
  username      text        UNIQUE,              -- username plugin (nullable)
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "updatedAt"   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session (
  id          text        PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token       text        NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId"    text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id                      text        PRIMARY KEY,
  "accountId"             text        NOT NULL,
  "providerId"            text        NOT NULL,
  "userId"                text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope                   text,
  password                text,                    -- argon2id hash (credential provider)
  "createdAt"             timestamptz NOT NULL DEFAULT now(),
  "updatedAt"             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification (
  id           text        PRIMARY KEY,
  identifier   text        NOT NULL,
  value        text        NOT NULL,
  "expiresAt"  timestamptz NOT NULL,
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  "updatedAt"  timestamptz NOT NULL DEFAULT now()
);

-- better-auth DB-backed rate limiter (rateLimit.storage = "database").
CREATE TABLE IF NOT EXISTS "rateLimit" (
  id            text   PRIMARY KEY,
  key           text   NOT NULL UNIQUE,
  count         bigint NOT NULL,
  "lastRequest" bigint NOT NULL
);

-- Track B lookups against better-auth tables (not part of better-auth's own
-- migration; marked as ours).
CREATE INDEX IF NOT EXISTS session_userId_idx ON session ("userId");
CREATE INDEX IF NOT EXISTS account_userId_idx ON account ("userId");
CREATE INDEX IF NOT EXISTS "user_username_idx" ON "user" (username);

-- ------------------------------------------------------- 2. Track B tables --
CREATE TABLE IF NOT EXISTS saves (
  user_id           text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  slot              smallint    NOT NULL CHECK (slot BETWEEN 1 AND 3),
  payload           jsonb       NOT NULL CHECK (octet_length(payload::text) <= 65536),
  schema_version    smallint    NOT NULL,
  version           integer     NOT NULL DEFAULT 1 CHECK (version >= 1),
  client_updated_at timestamptz,                       -- informational only
  updated_at        timestamptz NOT NULL DEFAULT now(), -- server clock: ordering authority
  PRIMARY KEY (user_id, slot)
);
CREATE INDEX IF NOT EXISTS saves_user_updated ON saves (user_id, updated_at DESC);

-- Recovery codes (OQ-17c): argon2id hashes, single-use. Never the plaintext.
CREATE TABLE IF NOT EXISTS recovery_codes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    text        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  code_hash  text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at    timestamptz
);
CREATE INDEX IF NOT EXISTS recovery_codes_user_idx ON recovery_codes (user_id);

-- DB-backed rate limiter for the custom API surfaces (AppSec C7).
-- 30-day rolling retention (Tech Law §2); purged by /api/purge.
CREATE TABLE IF NOT EXISTS rate_limits (
  key           text        PRIMARY KEY,
  count         integer     NOT NULL DEFAULT 0,
  window_start  timestamptz NOT NULL DEFAULT now(),
  violations    integer     NOT NULL DEFAULT 0,
  backoff_until timestamptz
);

-- Anomalous-save review log (AppSec C10). PII-bearing while user-linked;
-- 90-day retention (Tech Law §2); purged by /api/purge; anonymized on delete.
CREATE TABLE IF NOT EXISTS anomaly_log (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id    text,                 -- nullable: HIBP-outage logs have no user
  kind       text        NOT NULL,
  detail     jsonb
);
CREATE INDEX IF NOT EXISTS anomaly_log_created_idx ON anomaly_log (created_at);

-- ------------------------------------------------- 3. RLS (option (a)) --
-- Fail-closed layering: the API sets app.user_id (transaction-scoped, bound
-- parameter) on every request; RLS contains the "forgot the WHERE" bug class.
-- current_setting(..., true) returns NULL when unset -> user_id = NULL is never
-- true -> the policy denies every row. (RLS doc §1, AppSec C6.)

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves FORCE ROW LEVEL SECURITY;
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_codes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saves_isolation ON saves;
CREATE POLICY saves_isolation ON saves
  FOR ALL
  USING  (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS recovery_codes_isolation ON recovery_codes;
CREATE POLICY recovery_codes_isolation ON recovery_codes
  FOR ALL
  USING  (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- ------------------------------------------------- 4. grants --
-- PostgREST roles get nothing (not in the request path; locked down anyway).
-- Only app_role touches these tables, and RLS still applies to it (C6).

REVOKE ALL ON "user", session, account, verification, "rateLimit",
  saves, recovery_codes, rate_limits, anomaly_log
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON "user", session, account, verification, "rateLimit",
     saves, recovery_codes, rate_limits, anomaly_log
  TO app_role;

-- Identity sequences (recovery_codes, anomaly_log).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_role;

-- ------------------------------------------------- 5. verify --
-- After running, confirm as the migration role:
--   SELECT tablename FROM pg_tables WHERE schemaname='public';
--   -- RLS fail-closed proof: without app.user_id set, saves/recovery_codes
--   -- must return ZERO rows even though app_role holds grants:
--   SET ROLE app_role;
--   SELECT count(*) FROM saves;            -- expect 0 (policy denies all)
--   SELECT count(*) FROM recovery_codes;   -- expect 0 (policy denies all)
--   -- better-auth tables carry no RLS by design (C6(iii): grants only), so:
--   SELECT count(*) FROM "user";           -- expect the real count (grants allow)
--   RESET ROLE;
-- Note: better-auth's own tables intentionally carry NO RLS policy (better-auth
-- queries them via Kysely without setting app.user_id); their containment is
-- the grant restriction above (C6(iii)).
