# Black 2 Baseline — Structural Lessons Imposed on Ash's Journey

Owner order 2026-11-11: "Impose the knowledge you gained from REA Black on my game."
Source evidence: `~/workspace/black2-baseline/RE-STRUCTURAL-MAP.md` — structural analysis of the
owner's own Pokémon Black Version 2 file (header `POKEMON B2` / `IREO`, header CRC verified).
Clean-room binding: facts, mechanics, and structure only. No Nintendo code, sprites, music,
text, or data tables were extracted or used. Nothing from that file enters this repo.

## What the DS-era baseline actually is (evidence, offsets in the RE map)

| Fact | Black 2 (measured) | Ash's Journey (measured 2026-11-11) |
|---|---|---|
| Core binary | ARM9 core 472,740 B at 0x4000 | engine/ = 228 KB across 10 modules |
| Loadable system modules | **344 ARM9 overlays** (IDs 0–343) over the thin core | 24 game modules in src/game/, but one monolith: `overworld-systems.mjs` = 5,254 lines |
| Content storage | **308 NARC archives**, index-addressed (a/0, a/1, a/2 = 100 each, a/3 = 8); largest 31.5 MB / 1,065 members | 30+ data files in src/data/ (2.2 MB), split ad hoc (maps.mjs…maps9.mjs, species.mjs…species5.mjs), no registry |
| Sound | One dedicated **89,373,024 B SDAT bank** (~30% of used ROM) + soundstatus.narc, served by the ARM7 co-processor | audio/ = 28 KB total; engine/audio.mjs = 291 lines |
| Connectivity | Separate shipped binaries: `dl_rom/` Download Play child ROMs, `dwc/utility.bin` Wi-Fi utility | sync.mjs + auth.mjs (614 + ~200 lines) — already separate; now a rule, not an accident |
| Graphics storage | ≈184 MB identified graphics: 10,452 NCGR tile graphics, 5,072 palettes, 3,643 cell banks + 3,643 animation banks, 840 3D models + 1,725 textures (RE-GRAPHICS-CENSUS.md) | assets/sprites/art-data.mjs: 4,186 entries, 10 distinct canvases only (measured below, B2-G) |
| Files total | 662 (344 overlays + 318 named) | — |

## The imposed rules (binding on new work from 2026-11-11)

**B2-R1 — Thin core, loadable systems (the overlay rule).** The engine stays thin.
Every gameplay system ships as its own module in src/game/ and is registered in the
pack manifest. The three legacy monoliths are FROZEN at their 2026-11-11 line counts
(overworld-systems.mjs 5,254 · ui.mjs 1,838 · main.mjs 1,318): they may shrink or be
split, never grow. `scripts/pack-manifest.mjs` enforces this — growth fails the gate.
New systems found inside a monolith = gate failure, same as a budget breach.

**B2-R2 — Content is packs, packs are registered (the NARC rule).** All content lives
in src/data/ pack files; every pack is listed in the generated registry
(`docs/pack-manifest.md`: pack, bytes, lines, role) with a member-scale figure where
countable. A data file that is not in the manifest does not ship. Splitting a pack
(maps10.mjs, species6.mjs…) is normal and expected — index-addressed growth, like
a/0…a/3, instead of swelling one file.

**B2-R3 — Sound is a subsystem with its own budget (the SDAT rule).** Audio is not a
side effect of game code. Music/SFX content goes through the audio/ pack and
engine/audio.mjs only, is verified by scripts/verify-audio.mjs, and is reported as its
own line in the manifest. Inline sound data inside game/data modules is prohibited.
Standing gap, stated honestly: Black 2 spends ~30% of its ROM on sound; we spend 28 KB.
Closing that gap is content work (original compositions only), tracked as a gap — the
architecture rule is what this document imposes today.

**B2-R4 — Connectivity ships separately (the dl_rom/dwc rule).** Network, account,
and sync code live only in src/game/sync.mjs, src/game/auth.mjs and api/. No game
system module may grow its own networking. Guest/personal bundles keep shipping with
zero net code (existing build gate) — the DS lesson is the same shape: the connected
payloads were separate binaries, not woven through the core.

**B2-R5 — Options are a contract (the settings rule).** Black 2's own settings list
could not be extracted under the clean-room boundary (that would require extracting
game text), so the floor is our own measured surface: the 18-row Options menu in
main.mjs `openOptions()` — Text speed, Mute, Music volume, SFX volume, Battle
animations, Battle style, Switch style, Difficulty, House Rules, Screen shake,
Vibration, Autosave, Reduced motion, Flip controls, Controls remap, Show touch
controls, HUD scale, Legal/credits. No row may be removed or renamed silently;
changes need a note in this file. This is the Settings-8 bar made explicit.

**B2-R6 — Base spec first, enhancements layered (the DSi rule).** Black 2 is a DS
game with DSi enhancements layered on a base that still runs (unit code 2). Our
equivalent: the game must stay fully playable at the budgets.json floor (low-end
Android, DPR tier 1, 30 fps adaptive); visual/audio enhancements layer on top and
must degrade, never gate. An enhancement that breaks the floor fails review.

## Graphics rules — the census imposed (B2-G, added 2026-11-11)

Evidence: `~/workspace/black2-baseline/RE-GRAPHICS-CENSUS.md` — member-level scan of all
308 NARC archives (69,850 members; LZ-unwrapped; dimensions counted only when header
arithmetic validated). Our side measured the same day from the generated registry
`assets/sprites/art-data.mjs` (4,186 entries), with derived entries materialized through
their base chains exactly as the engine renders them.

**B2-G1 — One battle canvas (the 256×128 rule).** Black 2 puts 3,607 of its 4,480
validated graphics on a single battle canvas, 256×128 px. Our equivalent already exists
and is now law: the standard battle canvas is **64×64**. Measured today: 509 species
stems, 1,018 base fronts/backs — every one 64×64, zero stems missing a view — plus
1,244 derived companions (-bob / -accent), also all 64×64; 2,262 battle entries, zero
exceptions. Trainer battle art is a separate, separately uniform class (92 entries at
48×64) and does not mix into the species canvas. Any battle entry off 64×64 fails
`scripts/art-gate.mjs`.

**B2-G2 — 16-color discipline (the 4bpp rule).** Black 2: 97% of validated 2D art is
4bpp (4,336 vs 144 files); its palettes are 16 colors × 2,572 files or 256 × 2,376,
almost nothing between. Our measured state: 4,070 of 4,186 entries (97.2%) materialize
to ≤16 used colors (histogram peak: 13); **116 entries exceed 16 (max 21, mostly Ash
overworld animation frames at 17–18 colors)**. Rule: NEW art ships at ≤16 used colors.
The 116 legacy exceedances are a frozen ceiling in `scripts/art-gate.caps.json` —
shrink-only; raising the count fails `scripts/art-gate.mjs`.

**B2-G3 — Animation ships as a pair (the NCER==NANR rule).** Black 2's pairing is
exact: 3,643 cell banks (layout) and 3,643 animation banks, one of each per animated
sprite, no loose frames. Our registry has the same shape: an animated entry is a base
raster plus a registered derivation in the same generated file — 510 shift/bob entries
and 709 delta entries (ART_META records both lists: shift_bob 510, delta_frames 709),
and measured today **1,219 of 1,219 derived entries resolve to a base present in the
registry (0 orphans)**; the engine's materializeArt() resolves every frame through
its base. Rule: no orphan frames and no animation defined outside the registry — a
derived entry whose base is missing hard-fails the art gate's materializer.

**B2-G4 — Screen layers snap to the base grid (the NSCR rule).** Black 2's screen
layers standardize on 256×256 (×538), 256×192 (×133), and 512×512 scrolling (×127) —
all built on its 8px tile. Ours: the tile is 16px (`TILE = 16`, src/engine/render.mjs);
1,002 of 1,057 tile entries are exactly 16×16 and the rest are exact multiples
(16×32, 16×48, 32×32); the logical viewports (src/game/main.mjs) are 256×192 and
256×256 — the DS layer sizes themselves — plus the 384×216 wide mode, all multiples
of the tile. Rule: new tiles, layers, and viewports snap to the 16px grid and the
256-family logical sizes; off-grid art (today only the 24×24 portrait class and two
one-off pieces exist outside the tile multiples) does not spread to new classes.

## What this does NOT do
- Does not import any Black 2 system by name into the design on structural evidence
  alone: seasons, medals, Join Avenue, Pokéstar Studios, and the World Tournament
  remain INFERRED in the RE map (all 308 archives are numerically named), so they
  are not imposed as content. If they are ever adopted, they arrive as original
  systems under B2-R1/R2, on a playtest-evidence basis.
- Does not change gameplay, saves, or the live build. This change is architecture
  law + a registry + a freeze gate, on a branch, for owner merge.

## Verification
`node scripts/pack-manifest.mjs` regenerates docs/pack-manifest.md and exits
non-zero if any frozen monolith grew past its cap in scripts/pack-manifest.caps.json.
`node scripts/art-gate.mjs` exits non-zero if any battle-sprite entry is off the
64×64 canvas (B2-G1) or the >16-color entry count rises above the frozen ceiling
of 116 in scripts/art-gate.caps.json (B2-G2); both failure modes were exercised
with synthetic violations on 2026-11-11 and the restored tree passes.

## Addendum 2026-11-11 — first system adopted under this law: SEASONS
Owner order ("change game code and make it more like Pokemon Black — the
game I gave you on iCloud"): the season system is now real, not just a
clock-glyph color bar. In the RE, seasons were graded INFERRED (the
archives are numerically named); adoption is the owner's explicit call,
recorded here so the evidence trail stays honest. Implementation is
original (src/game/seasons.mjs, its own module per B2-R1): monthly
season rotation on a 4-month cycle, derived from the calendar and never
stored, presentation-only per the weather.mjs doctrine — outdoor season
light tint, glyph bar and rollover toast driven from the one resolver.
Mechanical season effects (encounters, areas) remain a future ruling.

## Addendum 2026-11-11 (evening) — the style pass: B2-G5..G7
Owner scope, in his words: characters, world, and Pokémon; theme
"micro pixel, same as Pokémon Black" — executed, as everything in this
program, with original art under Black 2's measured discipline
(clean-room: structure and numbers, never their pixels; his claimed
Game Freak license was reviewed and is NOT verified — four uploaded
drafts, each self-described as a proposal/draft or edited between
uploads; the standing requirement is independent confirmation from
Game Freak through official channels).

- **B2-G5 (presentation):** the game presents at an integer multiple
  of its logical resolution, so every game pixel is exactly k×k device
  pixels — the DS-native micro-pixel read. Implemented in
  Renderer.resize (integer backing snap, ≤8% size deviation, legacy
  path untouched headless).
- **B2-G6 (world detail):** every placed tile/object earns its place
  (owner rule, same evening): roads walkable end-to-end, no object on
  a route tile, placement intentional — mechanically guarded by
  scripts/audit-reachability.mjs over all maps. Town fabric (owner
  rule, later the same evening): entries and exits land on paved
  ground and read as one continuous road across the border; a paved
  walkway connects every door to the town's through-road; buildings
  never merge — every house stands separated by ground, never sharing
  a wall or roofline with its neighbour. Entry/exit audit 2026-11-11:
  1,844 warps, zero landings inside walls/objects (167 water landings
  are surf arrivals, by design); first fabric fix landed the same
  night (Celadon west house: grass step-off paved into a walkway). Detail redraws follow
  the owner's standing art standard: ≥3 tones per object, one light
  direction, modelled ground with clean material edges.
- **B2-G7 (characters & Pokémon):** detail-redraw queue ordered by
  screen time (player + partner first, then town casts, leaders,
  battlers by usage), each wave QA-graded on live screenshots before
  the next begins. Palette discipline stays B2-G2 (≤16 colors).
- **B2-G8 (uniformity & occlusion, owner wording 2026-11-11):** pixel
  art holds the same standard in every space — towns, stores, gyms,
  houses, caves, routes — no exceptions by map type. No pixels block
  one another: draw order is y-sorted with the foreground layer
  reserved for true overhead elements (canopies, rooflines), never
  for ground objects; presentation stays at the B2-G5 integer
  multiple everywhere (DS uniformity). The measurable half is already
  gated (audit-reachability + audit-towns cover all 431 maps,
  interiors included); the visual half grades per map on screenshots
  in the style-pass waves.
- **B2-G9 (the calm-density model, owner reference photos 2026-11-11):**
  the owner pinned the target look with screenshots of a GBA-era town
  (Littleroot-style, via a web emulator): calm single-hue speckled
  grass with large unbroken areas; small-footprint buildings standing
  alone in clear ground, never touching; interiors with furniture
  hugged to the walls, open floor in the middle, one rug as the
  feature; small characters against a quiet world. Principles adopted
  (density, spacing, ground calm, interior openness) — layouts and
  assets are NOT copied; the art stays original. This is the same
  direction as the owner's 2026-10-29 readability ruling (halve the
  clutter) with a picture now pinned to it: the world wave SUBTRACTS
  before it adds. Working targets: decorative objects per screen at
  most half the current density; >=2 ground tiles between any two
  buildings; interior walking floor >=60% open.
  Rollout requirements (owner-forwarded critique, accepted 2026-11-11):
  (1) ANTI-REPETITION — the kit's single cabin/tree cannot stamp 62
  towns identically: per-town variants are mandatory (roof and trim
  palettes keyed to each town's existing style identity, fence/sign
  mixes vary), and the game's original tile vocabulary stays in
  service, re-paletted into the kit family, as the variety reservoir.
  (2) BIOME COVERAGE — kit first where it has the tiles; biomes it
  lacks (snow, desert, volcanic, cave) are carried by original tiles
  drawn in the kit's palette/outline family, never by stretching the
  cabin set where it does not belong. (3) The re-dress is a SKIN:
  layouts, warps, progression geometry and placement intent are the
  game's existing hand-designed layer and do not change (guarded by
  the reachability and town audits).
  Phase 1 LANDED on branch art/gassasin-kit (2026-11-11, not merged):
  the slicing pipeline (assets/sprites/tools/build-kit-art.mjs ->
  kit-art-data.mjs, 36 entries, all <=16 colors, art-gate kit census)
  and Pallet Town rendering in the kit inside the real engine —
  ground/path/canopy/flora/sign + positional cabin composites —
  with the kit character as the player and as Gary (instance-palette
  swap). Skin only: audits green, slice 131/134 (same 3 pre-existing
  failures), all build gates green. Seasons grade the kit vegetation
  with the same formula as our art; on the kit's deep green the
  Autumn grade runs a deeper red than our amber — owner call pending
  on whether kit grades dampen in Phase 2. NOT yet: every other town,
  interiors (the sheet's interior set is Phase 2 material), service
  buildings (Center/Mart/Gym have no kit equivalents — proposed:
  keep the original service silhouettes/signage, re-paletted into
  the kit family per rollout rule 2), per-town roof/trim variants
  (rollout rule 1), and the run/bike/surf/fish player sets (no kit
  frames exist; Ash's sets still serve those modes).
  Phase 1 MERGED to main 2026-11-11 (d83a228) and is live on Pages.
  Wave A LANDED on branch art/kit-wave-a (2026-11-11, not merged):
  (a) SEASONAL DAMPENING — the kit grade is now its own path
  (seasons.mjs seasonalHexKit/seasonalSwapForKit, fed to the kit
  canvases only): the shared Autumn formula's red-dominant output
  on kit palettes is pulled into our amber family band (green
  floored at r/2.15, blue at 0.26r; measured #a11c00 -> #a14b2a);
  our own art's grade is untouched, and a pixel diff of Pallet
  before/after shows ONLY vegetation colors moved. (b) KANTO
  ROLLOUT — all nine remaining Kanto towns wear the kit with
  per-town variants keyed to TOWN_STYLE (viridian slate, pewter
  stone, cerulean blue-tile, vermilion copper, celadon glass-green,
  saffron gold, lavender dark shingle, fuchsia thatch, cinnabar
  basalt; vegetation tinted 18% toward each town's ground anchor).
  Houses are positional cabin composites as in Pallet (2-wide
  entrances pair the kit door with its pipeline mirror, kit-door-r,
  as French doors); service buildings keep their silhouettes and
  signage, re-graded into the kit family (cache.kitSvc: warm ochre
  mix, trim wood -> kit log-dark, frame greys -> kit frame). The
  generic 'path' kind stays native sand everywhere — it is the
  inter-town road fabric (Pallet's approved streets are 'path'
  cells) and the kit's dark dirt would sever that continuity.
  (c) ROUTE 1 wears kit tall grass / canopy / flora for corridor
  coherence; its road stays native sand. Isolated kit-grass cells
  (grassground clearings, prop underlays) pick the textured grass
  variants only — kit-grass-1 is a solid fill and reads as a hole
  when isolated. Skin only throughout: audits green, slice 131/134
  (same 3 pre-existing failures), all build gates green, and every
  town + Route 1 visually graded through the shipped resolver
  against the approved Pallet references. NOT yet: Johto/Hoenn/
  Orange/Sevii towns and biomes (Wave B/C), interiors, night-lit
  service windows in kit towns (kit branch supersedes litMap
  there), and the warp-fade door-open frames (still authored art
  in kit towns, as in Phase 1).
