# Command Deck — owner backend dashboard

The Command Deck is the owner's read-only operations console for the public
game. It lives at **`/admin`** on the game site (source: `src/admin/`, built to
`public/admin.html` + `public/admin.js`; API: `api/admin.mjs`, ONE route file
— 10 of the 12 Hobby function slots).

## What it shows

- **Overview** — player totals, signups (7/30 days), cloud-save totals and
  storage bytes, recent signups and saves.
- **Players** — searchable, paginated account list (username, signup date,
  last sign-in). Read-only.
- **Player detail + Save inspector** — per-slot metadata and the full save
  payload (deep-scrubbed of any credential-shaped keys; every payload view is
  written to the server anomaly log).
- **System** — API version, runtime, deployment metadata, database latency,
  game-data table status.
- **Setup** — live configuration probes (booleans/counts only — secret values
  are never rendered) plus the manual checklist only the owner can complete:
  the allowlist bootstrap, the GitHub `GAME_URL` secret, the Vercel git link,
  and optional migration 003.

## How access works (fail-closed)

- Requests resolve the normal game session. With **no allowlist configured**
  (`ADMIN_USERNAMES` / `ADMIN_EMAILS` unset), a signed-in user can see only
  the Setup/bootstrap page; every data action returns
  `403 admin_not_configured`. Anonymous requests get `401`.
- With an allowlist set, only listed accounts get data; everyone else gets
  `403 forbidden`. Use `ADMIN_USERNAMES` with the **exact username of the game
  account you play on** — account emails in this game are synthetic
  (`<username>@game.local`), and reserved names (`admin`, `owner`, `naman`, …)
  can never be registered, so they can never match.
- All responses are `Cache-Control: no-store`; there are no CORS headers (the
  deck is same-origin only); per-account and per-IP rate limits apply; the
  strictest limit guards payload views.

## Personal edition

The personal build ships the same page, but that project is static-only and
the API is same-origin by design, so its deck explains the situation and links
to the live deck on the public site, with the owner checklist available
offline.

## Migration 003 (optional, owner-applied)

`migrations/003_admin_dashboard.sql` adds a SELECT-only admin policy for
global save aggregates. The dashboard works without it (per-player aggregate
loop, guarded at 500 players). Apply it in the Supabase SQL editor when the
player count grows — see the file header. Never run it as `app_role`.
