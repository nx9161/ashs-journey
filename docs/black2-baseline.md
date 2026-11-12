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
