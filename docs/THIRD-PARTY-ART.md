# Third-party art

## Gassasin 16x16 tileset ("Pokemon/Zelda style")

- Author: **Damian Gasinski aka Gassasin**
- Source: https://opengameart.org/content/16xx16-tileset-pokemonzelda-styled
- License: **CC-BY 3.0** (badge verified on the source page 2026-11-11;
  attribution notice on the page names the credit line below)
- Files in this repo: `assets/kit/gassasin-16x16.png`,
  `assets/kit/character/` (walk/idle frames)
- Required credit (must ship in the game's credits wherever this art
  is used): "Tileset and character by Damian Gasinski aka Gassasin
  (opengameart.org/content/16xx16-tileset-pokemonzelda-styled),
  used under CC-BY 3.0."
- Adopted by owner order 2026-11-11 as the world-art family for the
  town re-dress program (B2-G9 rollout). Everything else in the game
  remains original art drawn for this project.
- Modifications (CC-BY 3.0 change indication, added by War Room W5,
  2026-11-13): the work is used in modified form — tiles recoloured
  per town (roof/wall/door/path palette remapping in
  `src/engine/art.mjs`), derived tiles synthesised from the sheet
  (`kit-door-r`, `kit-door-open`, the Wave H `kit-path-*` family,
  sliced/synthesised in `assets/sprites/tools/build-kit-art.mjs`),
  and character instances recoloured (`src/engine/art.mjs`). The
  in-game Legal screen carries the same change indication.

## Wave H addition (2026-11-12): the kit's dirt-path family

- Same work, same author, same CC-BY 3.0 license and credit as above —
  no new third-party art enters the game in this wave.
- `assets/sprites/tools/build-kit-art.mjs` (Wave H section) now also
  slices the sheet's composed 3x3 dirt-on-grass blob (cells (6..8,
  8..10)) as the path edge/corner family `kit-path-{n,e,s,w,ne,nw,es,sw}`,
  with grass margins keyed transparent (the engine composites them
  over each town's own season-graded grass).
- The variants the blob lacks (1-wide runs, end caps, isolated cell:
  `kit-path-{ew,ns,esw,new,nsw,nes,nesw}`) are synthesized in the same
  tool from the blob's own boundary profiles, filled with the blob
  center's dirt — kit pixels only, arranged originally, under the same
  license (the Wave C derived-tile precedent: kit-door-r, kit-door-open).
- Mining manifest (Gassasin city set, Ninja Adventure, Superpowers,
  Kenney, 0x72, LPC — licenses, verdicts, technique notes):
  `~/workspace/muse-directive/WAVE-H2-EXEMPLAR.md`. No tiles from any
  other source are used in the Wave H exemplar build; the Gassasin
  "2D City tileset" was NOT adopted (its license could not be verified
  from the source page — see the manifest).
