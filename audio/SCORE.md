# Kian's Journey — Original Score & Sound Design
**Seat 24 (Voice Designer, Black Bolt) · Phase 4 Wave 2 · 2026-10-15; W12 audio-identity refresh · 2026-11-15**

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

## Track list — music (23 loops)

The W12 charter: every region owns a town+route pair; Arden keeps its four
authored loops as its identity; the shared services (gym system, Center,
Mart) and the ceremonies (leader / legendary / contest) each own one theme;
the title and wild-battle themes stay global by design.

| Track | Title | Use | BPM |
|---|---|---|---|
| `title-theme` | First Light | Title screen | 112 |
| `battle-wild-theme` | Tall Grass Gambit | Wild battles | 152 |
| `battle-trainer-theme` | Challenger's Measure | Trainer battles | 164 |
| `battle-leader-theme` | The Leader's Standard | Leader / boss battles (W12-T4) | 172 |
| `battle-legendary-theme` | Presence of the Sovereign | Legendary battles (W12-T4) | 120 |
| `contest-theme` | Appeal in Bloom | Contests (W12-T4) | 138 |
| `route1-theme` | Road Out of Dawnwick | Arden routes | 132 |
| `pallet-theme` | Hometown Morning | Dawnwick (waltz) | 96 |
| `viridian-theme` | Crossroads City | Fernmere register — Arden cities | 120 |
| `center-theme` | Healing Light | Center (soft) | 88 |
| `pewter-theme` | Stone & Slate | Flintridge register — Arden cities | 104 |
| `gym-theme` | House of Badges | Gym interiors (shared service theme) | 144 |
| `mart-theme` | Open All Hours | The shared Mart (W12-T4) | 100 |
| `amber-town-theme` | Salt & Citrus | Amber Isles towns | 104 |
| `amber-route-theme` | Trade Wind Run | Amber Isles sea lanes | 122 |
| `yamato-town-theme` | Temple Bell Morning | Yamato towns | 92 |
| `yamato-route-theme` | Pilgrim Road | Yamato routes | 132 |
| `maris-town-theme` | Harbour Lights | Maris towns | 118 |
| `maris-route-theme` | Open Water Road | Maris routes | 140 |
| `borea-town-theme` | First Snow Hush | Borea towns | 84 |
| `borea-route-theme` | Long White Road | Borea routes | 148 |
| `trial-town-theme` | Bronze & Banner | Trial Grounds hub | 100 |
| `trial-route-theme` | The Seven Trials | Trial Grounds island | 128 |

Each loop is ≤ 4 tracks (2 pulse + 1 triangle + 1 noise max); the audit in
`scripts/verify-audio.mjs` asserts no instant ever exceeds 6 simultaneous
voices, that every merged map's `music` field resolves to a composed track,
and that every map plays inside its region's charter (W12, §[8]).

## Track list — SFX (48)

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
`levelup`, `evolution-fanfare` (evolution — W12-T4; the evolution moment
no longer reuses `levelup`), `badge`, `heal`, `save-confirm`,
`item-fanfare`, `partner-happy` (VOLTIK interaction), `map-enter`
(area banner).
**Legacy aliases** (`blip`, `tick`, `back`, `fanfare`, `heal`, `error`,
`throw_`, `rattle`, `click`, `dex`, `encounter`) keep every Wave-1 call site
working.
**W6 completions:** `menu-move` (menu cursor), `item-get` (item pickup)
and `warp` (warp tiles) were dead call sites — now tabled and played;
`fanfare` is wired into the trainer-victory path (gated on no badge
being awarded, so badge wins keep their own beat).

## Species cries (509/509 — authored 14 + deterministic derivation, W12-T1)

Fourteen authored tables (the Wave-1 slice species; contract §2.3):
`cry-pikachu` (VOLTIK's double chirp), `cry-pidgey`, `cry-rattata`,
`cry-caterpie`, `cry-weedle`, `cry-spearow`, `cry-zubat`, `cry-geodude`,
`cry-onix`, `cry-bulbasaur`, `cry-charmander`, `cry-squirtle`,
`cry-nidoranm`, `cry-mankey`. Every other species' cry is **derived**:
`deriveCry(record)` builds the table deterministically from the species'
own record (unique `spriteSeed` stream; primary type → timbre family,
BST band + body plan → register, secondary type → contour, evolution
stage → growth), so a line audibly grows as it evolves. Resolution order
in `playCry`: authored table → alias (`partner` → VOLTIK's authored cry —
the partner is VOLTIK, one creature one voice) → derived (formes share
their base species) → the legacy two-note fallback, retained only as an
unknown-id safety net. verify-audio [10] proves 509/509 resolve, with
pairwise-distinct cries over the 493 independent identities. Played on
battle send-out (foe + ally) and via `audio.playCry(speciesId)`.

## Visual twins (gameux §7 — mute never removes information)

| Audio cue | Visual twin |
|---|---|
| `lowhp` | HP plate red pulse + ⚠ pip + stripe overlay |
| `encounter-sting` | grass rustle anim, then the `!` mark over Kian |
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
| `partner-happy` | VOLTIK hop + mood pip |
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

## Verification

`scripts/verify-audio.mjs` — **ALL PASS**, run inside the fleet via
`tests/run-checks.mjs`. Sections: [1] syntax (`node --check`) · [2] note-
table schema (contract §2.1) · [3] channel budget (≤ 6 simultaneous
voices, loop lengths sane) · [4] map music cross-refs · [5] engine
scheduling exercise through a fake AudioContext (headless no-op safety,
pitch math, bus volumes, mute, loop scheduling, area restore,
`applySettings`) · [6] SFX call-site cross-check (every played key
resolves) · [7] audible proof + suspended-context resume · [8] region
charter over the merged 432-map table · [8c] ceremony assignments
(leader / legendary / contest / mart / evolution, call-site pinned +
headlessly scheduled) · [9] loop distinctness (lead-melody interval
fingerprints, pairwise over all loops) · [10] cry coverage + distinctness
(509/509) · [11] audio byte budget (note-tables + engine ≤ 55,000 B;
53,655 B at the W12 landing).

## The W12 charter (landed 2026-11-15) — and what remains

W12 closed the audio-identity program: T1 gave all 509 species their own
cry (authored 14 + derivation) and fixed the partner's voice; T2/T3 gave
every region its own town+route pair (Arden keeps its authored four; the
legacy pool serves no other region); T4 gave the ceremonies their themes
(leader, legendary, contest, the shared Mart) and evolution its sting.
Guards [8]/[8c]/[9]/[10]/[11] hold the charter mechanically — a map,
battle, contest, or species that falls back to a shared sound fails CI
by id.

Post-W12 backlog (named, not scheduled): per-region gym-interior variants
(the shared `gym-theme` stands until then, by charter — Ruling 2);
PC/storage jingles; surf/bike/movement motifs; Frontier facility
stingers. **Struck:** day/night variants — seasons and day/night
presentation were removed by owner order (SZ wave), so the score keeps
one fixed treatment per place, like the art.
