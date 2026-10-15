# api/ — BLOCKED (Track B)

**Status: nothing is provisioned, no credentials exist, no auth-track code is built.**

Per ADR-008 (Phase 3 sign-off, Sloane gavel): OQ-4 (auth provider + username-vs-email
follow-up), OQ-10 (username/password rules + age gate), and OQ-18 (password hasher)
are **provisioning blockers**. Until the owner answers via Mission Control:

- provision NOTHING (no Supabase project, no Vercel env vars, no keys)
- invent NO credentials
- build NO auth-track code

When the blockers clear, this directory will hold:

```
api/auth/[...all].mjs   better-auth handler (serverless, Node runtime)
api/save.mjs            GET slot list/meta, PUT upsert (version-counter CAS)
api/save/meta.mjs       per-slot timestamps/versions only
```

Design of record: `drawers/phase2-architecture.md` §3–§4 (save schema v1 ≤ 64 KB,
version-counter sync, hand-rolled validator), `drawers/phase2-rls-resolution.md`
(normative sync spec + RLS option (a)), AppSec C1–C13, GC C1–C12, Tech Law C1–C8,
LCR merge-gate conditions — all in the War Room palace.

All auth code paths in the client remain feature-flagged OFF (compile-time strip in
`scripts/build.mjs`) until Track B lands.
