# Third-Party Notices

## Track A (current build)

**None.** The client game ships zero third-party code — vanilla JavaScript and the
Canvas 2D / WebAudio browser APIs only. No npm dependencies, no CDN fetches, no fonts,
no libraries.

## Track B (server API — built, DB unprovisioned)

The server dependency set is pinned in the root `package.json`
(**better-auth 1.7.10** · **pg 8.23.1** · **@node-rs/argon2 2.2.2** — all MIT,
verified from the installed packages; kysely MIT as better-auth's Postgres
adapter machinery) with full license texts in
[`api/THIRD-PARTY-NOTICES.md`](api/THIRD-PARTY-NOTICES.md). 38 transitive
packages, all MIT/ISC — no copyleft, no ambiguous licenses. Nothing is
vendored into the client: the game bundle stays zero-dependency.
