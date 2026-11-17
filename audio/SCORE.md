# Kian's Journey — Original Score & Sound Design
**Seat 24 (Voice Designer, Black Bolt) · Phase 4 Wave 2 · 2026-10-15; W12 audio-identity refresh · 2026-11-15; VIRAL AUDIO PASS · 2026-11-17**

All music and SFX are **100% original compositions** written for this
project — no sampled audio, no audio files (the zero-audio-file rule is
CI-enforced), no melody borrowed from any official game or anime. Chiptune
*style* is the idiom; every *melody* is new work (GC posture, binding).

**Viral audio pass (2026-11-17, owner order):** every loop and SFX below
was recomposed for trending-feed energy — hook-first leads, build-and-drop
drum kits (four-on-the-floor drive, clap classes, offbeat hats), meme
effect *classes* (boom, scratch-stop, orchestra hit, alarm) synthesized
from scratch. No viral recording, sample, or melody was used or imitated;
the style is the brief, the notes are new. Two holdings by ruling/scope:
the evolution sting (`evolution-fanfare`) belongs to the Evolution
Ceremony build and is carried byte-identical; species cries are out of
scope and untouched. The pass also landed the owner's **mixing &
placement law** — see the dedicated section below.

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
| `title-theme` | Curtain Up | Title screen | 120 |
| `battle-wild-theme` | Ambush Anthem | Wild battles | 160 |
| `battle-trainer-theme` | Called Out | Trainer battles | 168 |
| `battle-leader-theme` | Standard of the House | Leader / boss battles (W12-T4) | 176 |
| `battle-legendary-theme` | Sovereign Weather | Legendary battles (W12-T4) | 126 |
| `contest-theme` | Center Stage | Contests (W12-T4) | 140 |
| `route1-theme` | Road Out, Loud | Arden routes | 138 |
| `pallet-theme` | Hometown Morning Groove | Dawnwick | 100 |
| `viridian-theme` | Crossroads Pop | Fernmere register — Arden cities | 124 |
| `center-theme` | Soft Reset | Center (soft) | 92 |
| `pewter-theme` | Stone & Swagger | Flintridge register — Arden cities | 110 |
| `gym-theme` | Full House | Gym interiors (shared service theme) | 150 |
| `mart-theme` | Checkout Groove | The shared Mart (W12-T4) | 104 |
| `amber-town-theme` | Salt Air Pop | Amber Isles towns | 108 |
| `amber-route-theme` | Trade Wind Sprint | Amber Isles sea lanes | 128 |
| `yamato-town-theme` | Temple Bell Dusk | Yamato towns | 96 |
| `yamato-route-theme` | Pilgrim Sprint | Yamato routes | 136 |
| `maris-town-theme` | Harbour Bounce | Maris towns | 120 |
| `maris-route-theme` | Open Water Sprint | Maris routes | 144 |
| `borea-town-theme` | Snowfall Slow Jam | Borea towns | 88 |
| `borea-route-theme` | Whiteout Run | Borea routes | 152 |
| `trial-town-theme` | Banner Day | Trial Grounds hub | 104 |
| `trial-route-theme` | Trial by Tempo | Trial Grounds island | 132 |

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

## Mixing & placement law (owner order, 2026-11-17 — binding)

*"No sounds should mix violently, placement should be perfect."* This is
a merge gate for any audio change, on the same footing as verify-audio.

**Mixing — priority order: ALERT > STING > MOMENT SFX > BGM**
(`SFX_DUCK` in `src/engine/audio.mjs` is the class table).
- ALERT cues (`lowhp`, `error-buzz`, `trainer-spot`, the encounter pair)
  duck BGM to 0.25; STING cues (fanfares/ceremonies: `victory`, `fanfare`,
  `badge`, `levelup`, `evolution-fanfare`, `catch-gotcha`, `catch-crit`,
  `dex-register`, `heal`, item fanfares) duck to 0.35 — for exactly the
  cue's audible length (notes + envelope tail), then the music eases back
  over 180 ms. Overlapping cues extend the duck; they never fight it.
- MOMENT cues (UI, hits, catch mechanics, warps) never duck and are
  balanced in the tables to sit inside the music, not on top of it.
- No two full-level cues sound simultaneously. Designed pairs that are
  *one* cue (encounter sting + its melody; catch click + gotcha;
  breakout + its tone; a hit + its tier tone) are balanced as a unit.
  Call sites must sequence independent stings, never stack them — the
  awardXp site was fixed under this law (the XP-banked cue yields to the
  levelup fanfare instead of firing on the same frame).
- BGM changes crossfade: each track plays through a per-track session
  gain — the outgoing loop fades out in 90 ms (its scheduled notes go
  silent with it; two loops never stack) and the incoming loop fades in
  over 300 ms. A master compressor (where the platform offers one) is
  the ceiling: threshold −14 dB, 12:1 — clipping is structurally
  impossible, and table levels are balanced to live under it.

**Placement — every cue fires at its event, and stops with it.**
- Battle hits sound on the damage frame (both engines call
  `hitFeedback` inside damage application, beside the impact FX).
- The victory/fanfare/badge stings fire in the same call that sets the
  victory state / pushes the badge id — not a frame earlier or later.
- The heal chime fires inside `healParty` / the medicine-use completion,
  as the HP lands.
- The low-HP alarm fires once per ally per crossing into red (≤25%),
  re-arms only above 25%, never at 0 HP. The classic engine always did
  this; the RT engine never fired it at all — the viral pass fixed RT
  (placement parity, same semantics).
- Choreographed timings are placement too: the encounter three-beat
  (rustle 0/0.9/1.8, melody at 2.8) and the catch-rattle shakes keep
  their exact beats — they are synced to their visual twins.
- Tails: SFX envelopes end inside their moment; BGM tails are cut by
  the session fade, never left ringing into the next scene.

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
53,655 B at the W12 landing; 53,156 B at the viral-pass landing).

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
