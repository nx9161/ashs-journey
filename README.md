# Ash's Journey

An unofficial fan-homage web game — a DS-era creature-catching adventure starring Ash
with Pikachu as his partner. **100% original code, artwork, music, and dialogue** —
created from scratch for this fan project.

> **ASH'S JOURNEY**
> *An unofficial fan homage. Not affiliated with, endorsed by, or connected to
> Nintendo, Creatures Inc., or GAME FREAK inc.*
>
> Pokémon, Pikachu, and all character names are trademarks of Nintendo / Creatures Inc. /
> GAME FREAK inc. This is a free, non-commercial fan project made with love by fans.
> No purchase is required or accepted. Please support the official releases.

- Free, non-commercial, personal use only. No ads, no payments, no donations, no tips.
- No analytics, no tracking, no network calls (guest build works fully offline).
- Repo is **private** by design (General Counsel ruling — this is Nintendo-IP fan work).

## Live Demo

**[https://nx9161.github.io/ashs-journey/](https://nx9161.github.io/ashs-journey/)** — the guest edition on GitHub Pages (canonical). The old Vercel deployment served a stale build; its build target was retired 2026-11-12.

## Layout

```
src/engine/    fixed-timestep loop, input, renderer, WebAudio chiptune, formulas, RNG
src/game/      scenes (title/intro/overworld/battle/menus), state, UI chrome
src/data/      species, moves, items, maps, dialogue (all original content)
src/save/      versioned save schema + localStorage guest store
api/           BLOCKED — Track B (auth/cloud saves). Provisioning awaits owner answers
               (OQ-4 follow-up, OQ-10, OQ-18). No auth code exists yet by design.
assets/        manifest.yaml — per-asset provenance (generator seeds, hand-finish author)
scripts/       build.mjs (zero-dep, Node stdlib only), budget/contamination/drift gates,
               verify-slice.mjs (headless playthrough harness)
docs/          contracts.md (asset contracts for Art Director / Voice Designer)
dist/          Bundle A — guest single-file build (offline), the canonical edition
personal/      Bundle B — personal edition (ADR-012): the guest build + edition marker
               (the former Vercel static-client target, public/, was retired 2026-11-12)
```

## Build (dev)

Requires Node only — **zero npm dependencies**.

```sh
node scripts/build.mjs            # emits dist/standalone.html + personal/
node scripts/verify-slice.mjs     # headless playthrough: boot → catch → badge → save
```

See `docs/contracts.md` for the sprite and audio formats the asset seats build against,
and `budgets.json` for the binding performance/size budgets (build fails over budget).

---

Built by **Naman Parmar** ([nx9161](https://github.com/nx9161)).
