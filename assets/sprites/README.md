# Sprite Pipeline — Art Director (seat 33)

## Overview
Hand-authored ASCII `.pix` sources → validated → packed into per-family PNG atlases + JSON + `art-data.mjs`.

## Pipeline Tools (`assets/sprites/tools/`)
- **pix.mjs**: Parser + validators (≤12 colors, 1px dark outline, no orphans, 1px margin)
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
- **tiles**: 13 tiles, 16×16, ≤16 colors total
- **ash**: 24 sprites, 16×16, 4 dirs × (2 idle + 4 walk)
- **pikachu**: 5 sprites (hop-1/2 16×16, partner-front/back 32×32, refuse 32×16)
- **brock**: 3 sprites (idle-1/2 16×16, battle 32×48)
- **npcs**: 14 sprites (7 NPCs × 2 idle, 16×16)
- **species**: 21 sprites (9 species × front/back 32×32 + pikachu partner)
- **ui**: 3 icons (16×16) + `ui/ui-palette.json` (24 tokens)

## Runtime Transforms (for wiring seat)
Per contracts.md §1.5, the following are **runtime transforms**, not authored sprites:
- **Attack**: Scale sprite 1.2× for 3 frames, then back (impact frame)
- **Impact**: White flash (palette swap to white for 2 frames) + screen shake
- **Faint**: Sprite sinks 8px + fades to 0 alpha over 20 frames
- **Bob**: Idle bob is derived at build time (front shifted 2px vertically), marked `derived_from` in atlas JSON

## Wiring Handoff
The game currently uses `forgeSprite`/`forgeHumanoid`/`paintTile` (procedural). To wire my art:
1. Import `ART` from `assets/sprites/dist/art-data.mjs`
2. Replace `forgeSprite(doc, SPECIES[id], 48)` with blitting `ART[id].rows` via palette
3. Battlers are 32×32; scale to 48×48 in canvas with `imageSmoothingEnabled=false` if needed
4. See `load-test.mjs` for the exact raster path

## Provenance
All sprites 100% original, hand-authored. Manifest: `assets/manifest.yaml`.
AI-assisted (authoring agent), hand-finished with visual review + automated audits.
