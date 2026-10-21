# Third-Party Notices

## Track A (current build)

The client game ships zero third-party **code** — vanilla JavaScript and the
Canvas 2D / WebAudio browser APIs only. No npm dependencies in the bundle, no
CDN fetches, no libraries.

**Fonts (UI v2, self-hosted — no runtime fetches):**

- **Galmuri** (Galmuri11 + Galmuri11 Bold, Latin/symbol subsets) — Copyright
  © 2019–2025 Lee Minseo (quiple), https://github.com/quiple/galmuri —
  licensed under the **SIL Open Font License 1.1**. Galmuri is original work
  inspired by Nintendo DS-era bitmap font design; it has no Nintendo
  affiliation, and no Nintendo font files are used.
- **Pixelify Sans** (body face since UI v2.4 — variable font instanced at
  wght 400/700, Latin/symbol subset, shipped as `PtPixel`) — Copyright
  © 2021 The Pixelify Sans Project Authors,
  https://github.com/eifet/PixelifySans — licensed under the
  **SIL Open Font License 1.1**.

## Track B (server API — built, DB unprovisioned)

The server dependency set is pinned in the root `package.json`
(**better-auth 1.7.10** · **pg 8.23.1** · **@node-rs/argon2 2.2.2** — all MIT,
verified from the installed packages; kysely MIT as better-auth's Postgres
adapter machinery) with full license texts in
[`api/THIRD-PARTY-NOTICES.md`](api/THIRD-PARTY-NOTICES.md). 50 transitive
packages, all MIT/ISC/Apache-2.0 — no copyleft, no ambiguous licenses. Nothing is
vendored into the client: the game bundle stays zero-dependency.
