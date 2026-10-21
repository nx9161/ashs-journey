-- 002_auth_tables_no_rls.sql
-- Applied live 2026-10-21 via the Supabase connector (project ashs-journey,
-- ref vtunyfoflsapkqyhggqk) after production auth began returning 500s.
-- Recorded in the repo so repo and live DB match (fidelity mission WS3).
--
-- RATIONALE: The Supabase platform auto-enabled Row Level Security on ALL
-- public tables (its default posture for new tables), including the
-- better-auth and system tables that migration 001 deliberately left
-- WITHOUT RLS per design C6(iii) — those tables are protected by grants
-- (only app_role may touch them), not by policies. RLS enabled with zero
-- policies is deny-all, so every better-auth write failed — most visibly
-- the "rateLimit" INSERT on the sign-in path (production 500s).
--
-- This migration restores the 001 design exactly:
--   * better-auth tables ("user", session, account, verification,
--     "rateLimit") and system tables (rate_limits, anomaly_log):
--     RLS DISABLED — grants-only access control per C6(iii).
--   * saves + recovery_codes: UNTOUCHED — they keep RLS ENABLE + FORCE
--     with the app.user_id GUC scoping from 001 (the fail-closed proof in
--     001 still holds; app_role remains subject to those policies).
--
-- Idempotent: DISABLE on a table without RLS is a no-op.

ALTER TABLE "user" DISABLE ROW LEVEL SECURITY;
ALTER TABLE session DISABLE ROW LEVEL SECURITY;
ALTER TABLE account DISABLE ROW LEVEL SECURITY;
ALTER TABLE verification DISABLE ROW LEVEL SECURITY;
ALTER TABLE "rateLimit" DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_log DISABLE ROW LEVEL SECURITY;
