# Sprite Pipeline — Art Director (seat 33)

## Overview
Hand-authored ASCII `.pix` sources → validated → packed into per-family PNG atlases + JSON + `art-data.mjs`.

## Pipeline Tools (`assets/sprites/tools/`)
- **pix.mjs**: Parser + validators (≤32 colors per sprite, 1px dark outline, no orphans, 1px margin)
- **png.mjs**: Minimal PNG encoder (node:zlib only, zero dependencies)
- **forge-base.mjs**: Seeded base-draft generator → `pix/drafts/` (never shipped)
- **build-art.mjs**: Validates all `.pix`, packs atlases (≤2048×2048, 1px cell padding), emits PNG + JSON + `art-data.mjs`
- **palette-audit.mjs**: Standalone re-verification + `audit-results.md`
- **load-test.mjs**: Replays game raster path against stub canvas

## Pix Format
```
# Comment (design notes)
PIX <id> <w> <h>
<row 0>
...
<row h-1>
PAL
<key> <#hex> <label>
...
MIRROR <other-id>  # optional: derive by horizontal flip
```

- Grid: `.` = transparent, A-Z = palette keys
- Outline rule: edge pixels (4-connectivity) must use `O` (darkest shade of sprite's own palette)
- Stepped diagonals are legal (4-connectivity, not 8)
- Humanoid families (ash/brock/npcs) may touch bottom edge (feet on ground line); top/sides must be clear

## Families
Counts are the shipped tree as of Wave 0 (2026-10-27): 135 `.pix` sources,
163 ART keys (135 sources + 28 build-derived `-front-bob` frames; zero
sourceless keys — the PC Terminal pair has real `.pix` sources now).
- **tiles**: 13 tiles, 16×16 (family palette budget: ≤72 colors across the tiles family — see contracts below)
- **ash**: 24 sprites, 16×16, 4 dirs × (2 idle + 4 walk)
- **partner**: 5 sprites (hop-1/2 16×16, partner-front/back 32×32, refuse 32×16)
- **brock**: 3 sprites (idle-1/2 16×16, battle 32×48)
- **npcs**: 16 sprites (8 kinds × 2 idle, 16×16: aide, coach, lass, nurse, pc, professor, rival, youngster)
- **species**: 41 sprites, 32×32 (29 fronts + 12 backs, covering 29 species ids)
- **portraits**: 15 sprites, 24×24
- **keyart**: 1 sprite (title keyart, 64×48)
- **battle**: 2 sprites, 32×32 (ash-battle-back, gary-battle)
- **ui**: 15 icons (16×16) + `ui/ui-palette.json` (24 tokens)

Families tiles/ash/partner/brock/npcs/species/ui are shelf-packed into
`dist/` atlases; portraits/keyart/battle ship in `art-data.mjs` only
(the game consumes `art-data.mjs`, never the atlases).

## Palette / size contracts (Wave 0, 2026-10-27)
Raised deliberately for the world-art redraw (census §3); the outline,
inner-margin, orphan and painted checks are unchanged.
- **Per-sprite palette cap: ≤32 colors** (was 12) — enforced in both
  `pix.mjs` (declared palette) and `build-art.mjs` (distinct painted hexes).
- **Per-family palette budget:** the **tiles** family's color union is
  capped at **≤72 distinct hexes** (history: 16-color tileset-wide cap
  → 48 at Wave 0 → 54 at Wave 5a → **72 at Premium+ W0, 2026-10-28,
  spec §5** — each raise deliberate and recorded, never silent creep;
  the union measured 54 at the W0 raise). Other families have no union
  cap beyond the per-sprite cap; a new union budget is added per
  family, deliberately, in `build-art.mjs`. `palette-audit.mjs`
  mirrors the cap.
- **Character size standard:** overworld characters are authored
  **16×32** on a 1-tile (16px) footprint, drawn bottom-anchored with
  upward overhang (`Renderer.blitCharacter`). Legacy 16×16 art draws
  pixel-identical under the same path.
- **Battler size standard:** battlers are authored **64×64** and drawn
  at **64 logical px on both sides** (foe/ally parity;
  `BATTLER_DRAW_SIZE` in `src/engine/render.mjs`, carried on each art
  entry's `size`). Legacy 32×32 art upscales ×2 nearest-neighbor
  through the same code path.
- **NPC palette swap:** NPC kind sprites key their primary colors by
  garment (skin/hair/shirt/pants palette keys); the rasterizer remaps
  those keys from each NPC instance's data palette (`npc.art` selects
  the kind; see `src/engine/art.mjs` `NPC_SWAP_KEYS`).

## Bundle budget projection (Wave 0, 2026-10-27)
Measured at Wave 0 (HEAD baseline, before the Wave 0 engine code):
`art-data.mjs` = **162,101 bytes** (162,117 after the PC `.pix`
regeneration — the nurse key-split adds 16 bytes of palette lines);
`public/game.js` = **1,362,991 bytes**; hard gate
(`budgets.json` guestBundleMaxBytes) = **12,582,912 bytes per bundle**.
Projection uses the real emitted format (per sprite: one header line
with palette + one quoted line per row + closing line), validated
against the current species segment (template 1,441 B vs measured
1,363 B average per 32×32 entry — the template is the conservative side).

| Redraw class | Count | Assumed size / colors | Bytes each | Segment bytes |
|---|---|---|---|---|
| Battlers (fronts + backs) | 304 | 64×64, ~16 colors | 4,926 | 1,497,504 |
| Derived `-front-bob` frames (automatic) | 152 | 64×64, palette repeated | 4,930 | 749,360 |
| Characters (player/NPC/follower frames) | ~120 | 16×32, ~10 colors | 990 | 118,800 |
| Tiles (terrains + transitions) | ~60 | 16×16, ~6 colors | 542 | 32,520 |
| Architecture pieces | ~40 | 16×16–32×16 mix | ~680 | 27,200 |
| Interior / prop pieces | ~65 | 16×16, ~6 colors | 542 | 35,230 |
| Arena treatments | 15 | 64×48, ~16 colors | 3,774 | 56,610 |
| Retained (portraits, keyart, ui icons — measured) | 31 | as-is | — | 24,881 |
| **Projected `art-data.mjs` total** | | | | **≈2,542,105** |

Projected `public/game.js` = 1,362,991 − 162,117 + 2,542,105 =
**≈3,742,979 bytes ≈ 29.7% of the 12,582,912 gate** (headroom
≈8,839,933 bytes). Projected guest standalone ≈3,768,009 bytes.
Sensitivity: +8 colors on every battler/bob entry adds ≈59,000 bytes;
architecture at full 32×32 adds ≈30,000 — the conclusion does not move.

**Per-wave byte budgets (art-data segment caps, ≈15% over projection):**
Wave 1 tiles 40,000 · Wave 2 architecture 35,000 · Wave 3 characters
140,000 · Wave 4 nature/cave contingency 20,000 · Wave 5 interiors/props
45,000 · Wave 6 battlers + bobs + arenas 2,650,000. Internal ceiling for
the whole redraw: `art-data.mjs` ≤ 3.0 MB and any bundle ≤ 4.2 MB
(one third of the hard gate). A wave that would breach its budget
stops and re-decides before drawing, it does not discover it after.

**Decision: inline `art-data.mjs` STAYS.** No runtime data-file
loading is needed — the full redraw lands at under a third of the hard
gate with the per-wave budgets above as the tripwire.

## Premium+ budget decisions (W0, 2026-10-28 — spec §5, supersede the ceiling above)

- **Internal art-data ceiling raised 3.0 MB → 5.5 MB**, enforced in
  `assets/sprites/tools/build-art.mjs` (`ART_DATA_CEILING_BYTES`) —
  the only enforcement site; `budgets.json`'s 12,582,912 B per-bundle
  hard gate is unchanged. Measured at the raise: art-data 2,671,763 B.
  Expected Premium+ end state ≈4.7 MB art-data, `game.js` ≈6.0 MB
  (≈48% of the hard gate); the old "any bundle ≤ 4.2 MB" tripwire is
  superseded by that projection and the hard gate governs bundles.
- **Battler idle path: HYBRID (adopted as the recorded plan).** 152
  authored back-bob frames + hand-authored accent frames for the
  ~40–60 most-seen species (shipped as layered delta frames — see
  `tools/pix.mjs` `parseDeltaPix` — not full sprites), and procedural
  idle classes (≥4 locomotion classes, AN-1) for the rest of the
  roster. Full-authored (456 extra frames, +2.0–2.3 MB) is the
  documented fallback if W2's frame-series QA proves the hybrid reads
  thin; no lazy-load pack is needed at either scope.
- **Per-wave art-data growth caps** are the spec §4 table (W1 ≤120 KB ·
  W2 ≤950 KB · W3 ≤220 KB · W4 ≤850 KB · W5 ≤140 KB · W6 ≤160 KB ·
  W7 ≤60 KB · W8 ≤250 KB).

## Runtime Transforms (for wiring seat)
Per contracts.md §1.5, the following are **runtime transforms**, not authored sprites:
- **Attack**: Scale sprite 1.2× for 3 frames, then back (impact frame)
- **Impact**: White flash (palette swap to white for 2 frames) + screen shake
- **Faint**: Sprite sinks 8px + fades to 0 alpha over 20 frames
- **Bob**: Idle bob is derived at build time (front shifted 2px vertically), marked `derived_from` in atlas JSON

## Wiring Handoff
The wiring shipped (src/engine/art.mjs): the game rasterizes `ART` from
`assets/sprites/art-data.mjs` (NOT the `dist/` atlases, which nothing
loads); `forgeSprite`/`forgeHumanoid`/`paintTile` remain only as
fallbacks for kinds without authored art.
1. Import `ART` from `assets/sprites/art-data.mjs`
2. Battlers are authored 64×64 (legacy 32×32) and drawn at 64 logical px
   on both sides with `imageSmoothingEnabled=false` (see size contracts)
3. See `load-test.mjs` for the exact raster path

## Provenance
All sprites 100% original, hand-authored. Manifest: `assets/manifest.yaml`.
AI-assisted (authoring agent), hand-finished with visual review + automated audits.
