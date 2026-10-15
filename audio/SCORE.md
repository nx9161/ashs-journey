# Ash's Journey — Original Score & Sound Design
**Seat 24 (Voice Designer, Black Bolt) · Phase 4 Wave 2 · 2026-10-15**

All music and SFX are **100% original compositions** written for this
project — no sampled audio, no audio files (the zero-audio-file rule is
CI-enforced), no melody borrowed from any official game or anime. Chiptune
*style* is the idiom; every *melody* is new work (GC posture, binding).

Tables live in `audio/note-tables.mjs` (contract §2.1 format). The player is
`src/engine/audio.mjs` — WebAudio, 4–6 channel budget enforced in code
(`VOICE_BUDGET = 6`, simultaneous-voice sweep, not a look-ahead counter),
duty-cycle pulse timbres via PeriodicWave, `[attack, decay]` envelopes on
SFX. Music starts only after the first user gesture (autoplay policy);
everything is a safe no-op when AudioContext is unavailable.

## Track list — music (9 loops)

| Track | Title | Use | BPM |
|---|---|---|---|
| `title-theme` | First Light | Title screen | 112 |
| `battle-wild-theme` | Tall Grass Gambit | Wild battles | 152 |
| `battle-trainer-theme` | Challenger's Measure | Trainer battles | 164 |
| `route1-theme` | Road Out of Pallet | Route 1, Route 2 | 132 |
| `pallet-theme` | Hometown Morning | Pallet Town (waltz) | 96 |
| `viridian-theme` | Crossroads City | Viridian City | 120 |
| `center-theme` | Healing Light | Pokémon Center (soft) | 88 |
| `pewter-theme` | Stone & Slate | Pewter City (march) | 104 |
| `gym-theme` | House of Badges | Pewter Gym | 144 |

Each loop is ≤ 4 tracks (2 pulse + 1 triangle + 1 noise max); the audit in
`scripts/verify-audio.mjs` asserts no instant ever exceeds 6 simultaneous
voices and that every `maps.mjs` `music` field resolves to a composed track.

## Track list — SFX (43)

**UI set:** `ui-blip` (confirm), `ui-tick` (cursor), `ui-back` (cancel),
`dialogue-blip` (line advance), `error-buzz`.
**Encounter:** `encounter-sting` (grass rustle ×3) + `encounter-sting-melody`
(the `!` beat) — the gameux §6 three-beat rule, rustle 200ms → `!` 300ms →
transition 400ms. `transition-whoosh` on the wipe.
**Battle:** `battle-hit` + `battle-hit-tone`, `battle-super` +
`battle-super-boom`, `battle-noteff`, `battle-faint`, `battle-run`,
`lowhp` (first crossing into red, once per ally).
**Catch theater:** `catch-throw`, `catch-rattle` (one per shake),
`catch-click`, `catch-breakout` (+tone), `catch-crit` (critical capture),
`catch-gotcha`, `dex-register`.
**Progression:** `victory` (wild win), `fanfare` (trainer win),
`levelup`, `badge`, `heal`, `save-confirm`, `item-fanfare`,
`partner-happy` (Pikachu interaction), `map-enter` (area banner).
**Legacy aliases** (`blip`, `tick`, `back`, `fanfare`, `heal`, `error`,
`throw_`, `rattle`, `click`, `dex`, `encounter`) keep every Wave-1 call site
working.

## Species cries (14, synthesized — contract §2.3)

`cry-pikachu` (double chirp), `cry-pidgey`, `cry-rattata`, `cry-caterpie`,
`cry-weedle`, `cry-spearow`, `cry-zubat`, `cry-geodude`, `cry-onix`,
`cry-bulbasaur`, `cry-charmander`, `cry-squirtle`, `cry-nidoranm`,
`cry-mankey`. Played on battle send-out (foe + ally) and via
`audio.playCry(speciesId)` (unknown species → generic fallback motif).

## Visual twins (gameux §7 — mute never removes information)

| Audio cue | Visual twin |
|---|---|
| `lowhp` | HP plate red pulse + ⚠ pip + stripe overlay |
| `encounter-sting` | grass rustle anim, then the `!` mark over Ash |
| `transition-whoosh` / `-fade` | encounter wipe / 150ms fade |
| `catch-rattle` | ball wiggle ×3 |
| `catch-click` | starburst |
| `catch-gotcha` / `dex-register` | "Gotcha!" message + dex toast + Dex badge dot |
| `battle-super` | 4px/120ms screen shake + 60ms flash |
| `badge` / `fanfare` | badge-case shine / victory message |
| `save-confirm` | "Game saved." toast |
| `heal` | HP bars refill |
| `map-enter` | location banner slide-in |
| `dialogue-blip` | ▾ indicator |
| `partner-happy` | Pikachu hop + mood pip |
| `ui-*` | cursor movement / menu open / menu close |

## Options wiring (gameux §4.8)

- **Mute:** Options row + global **M key** (was bound but unhandled — now a
  persisted toggle with a "Muted."/"Sound on." toast twin).
- **Music volume / SFX volume:** persisted 0–100% steppers in Options that
  apply live to the music/sfx buses; `applySettings()` restores all three on
  boot and on Continue.
- **Reduced motion:** propagated to the engine — `transition()` swaps the
  encounter whoosh for a soft fade blip; shake/flash/ball-bounce/wipe are
  already visual-side. Audio itself never becomes the sole carrier of info.

## Verification (2026-10-15)

`scripts/verify-audio.mjs` — **ALL PASS** (24 checks):
1. `node --check` on both modules.
2. Contract schema on all 66 tables (waves, duties, vols, pitch notation,
   `[attack, decay]` envelopes, non-empty note lists).
3. Channel-budget audit: max simultaneous voices ≤ 6 on every music track;
   loop lengths sane; every map `music` field resolves.
4. Engine exercise through a fake AudioContext: headless no-op safety,
   pitch math (A4=440), SFX event timing/frequency/envelope, live bus
   volumes, mute suppression, full-loop music scheduling + loop timer,
   no-restart-churn on same-id replay, battle music excluded from the area
   restore target, `restoreAreaMusic()`, reduced-motion transition swap,
   cry fallback, voice-budget cap, `applySettings`.
5. Repo gates: `scripts/build.mjs` OK (bundle builds with the new module in
   `module-order.json`), `scripts/contamination-scan.mjs` clean
   (zero-audio-file rule holds), `verify-slice` 48/48 gameplay passes.

Known non-audio findings (other seats' files, flagged not fixed):
- QA Manager's new `verify-slice` QA extension (uncommitted, their file):
  s9 "battle 2 resolves" fails because their battle-2 driver loop never
  presses A on the battle message box (their battle-1 loop has the
  `else pA(g9, 1)` line; battle-2 lacks it). Verified the game itself
  resolves correctly when the message is advanced — driver bug, their seat.
- QA-001/002 (text sizes, move-button type badges) and QA-003/f4
  (encounter chain counters) flag other seats' in-flight work.

## Next audio wave owns

Later gyms/sagas per the §2.2 order: Orange Islands + Johto area themes,
Gym Leader battle theme, Elite/League themes, evolution fanfare, day/night
variants (palette-shift rule applies to audio too: same tables, different
`duty`/tempo treatments), PC/storage jingles, surf/bike/movement motifs,
Frontier facility stingers (v2), plus cries for every new species entering
the slice. The engine already supports all of it — new tables + one-line
`playMusic`/`playCry` call sites, no engine changes needed.
