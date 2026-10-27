-- 003_admin_dashboard.sql — Command Deck support (War Room, ADR-023).
--
-- *** OWNER-APPLIED ONLY — DO NOT RUN VIA app_role, DO NOT AUTO-APPLY ***
-- The Command Deck dashboard (api/admin.mjs) works WITHOUT this migration:
-- it aggregates save statistics by rebinding the app.user_id GUC per player
-- inside one transaction (dossier Option A). Apply this file only when the
-- player count grows past a few hundred and that loop becomes the hot path.
--
-- HOW TO APPLY (owner, when ready):
--   1. Open the Supabase project → SQL Editor (runs as the database owner,
--      which is the only role allowed to change policies).
--   2. Paste this whole file and run it once.
--   3. No redeploy is needed; api/admin.mjs keeps using Option A until a
--      future code change adopts the Option B queries — applying this file
--      early is harmless: the extra policy only takes effect for transactions
--      that set the app.is_admin GUC, which nothing sets yet.
--
-- Part (a): SELECT-only admin read policy for saves.
--   Permissive policies OR together in Postgres, so the existing per-player
--   isolation policy is untouched for every non-admin transaction. The
--   recovery-code table deliberately gets NO equivalent policy — credential
--   hashes are never admin-readable, by design.
--
-- Part (b) (OPTIONAL, commented out): a dedicated append-only audit table,
--   stronger than anomaly_log (no UPDATE/DELETE grant to app_role). Only
--   needed if the dashboard ever gains write actions (which would require
--   a new War Room security review first).

-- (a) -----------------------------------------------------------------------
CREATE POLICY saves_admin_read ON saves
  FOR SELECT
  USING (current_setting('app.is_admin', true) = 'true');

-- (b) -----------------------------------------------------------------------
-- CREATE TABLE admin_audit_log (
--   id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   created_at timestamptz NOT NULL DEFAULT now(),
--   admin_user_id text NOT NULL,
--   action text NOT NULL,
--   target_user_id text,
--   detail jsonb
-- );
-- REVOKE ALL ON admin_audit_log FROM PUBLIC, anon, authenticated;
-- GRANT INSERT, SELECT ON admin_audit_log TO app_role;
