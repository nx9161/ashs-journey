# Yellow Authenticity — ASH'S JOURNEY

**Owner:** Gameplay Designer (seat 17) · **Branch:** `feat/yellow-authenticity`
**Directive:** "It should be like the original game itself" = Pokémon Yellow (the Pikachu one).

## Ground rules

- **Mechanics and feel reimplemented from documentation only** — never from ROMs, never Nintendo assets. 100% original code/art/audio, per the IP guardrails (ADR-004 boundary, ADR-008 GC conditions).
- **Yellow soul, DS body** — the Gen 4/5 HUD idiom stays (ADR-004). We adapt Yellow's *gameplay identity*, not its pixels.
- **v1 "Act I" scope unchanged** (ADR-006). The signed slice (Pallet → Pewter) is not broken; nothing here adds maps, regions, or species beyond one data-ready rival rule.
- Note: the owner-linked `Armienn/pokemon` repo is a collection search/browse site (BSD-3-Clause), **not** a Yellow remake — it was not used as a reference. LCR rules on its reuse separately.

## Already Yellow-authentic before this update

For the record — these shipped in the signed slice and were left untouched:
Pikachu follows in the overworld (hop, trail-following); the partner refuses the Poké Ball outright (intro, `refusedBall` flag); grass-rustle → `!` → transition encounter three-beat; "Gotcha! X was caught!" catch theater; low-HP warning jingle; animated HP drain (90 HP/s); "Wild X appeared!" / crit / effectiveness battle idioms.

---

## (A) ADAPTED — Yellow-era mechanics/feel, original implementation

### A1. Partner emote + mood system (the follower, deepened)
Yellow's signature is that Pikachu *reacts*. Talking to it (face it + A, or tap the mood pip) now reads its emotion from `PARTNER_MOODS` (`src/data/dialogue.mjs`): happy / curious / sleepy / excited / sad — all original lines. Mood is driven by play, not decoration:
- partner lands a critical hit or a super-effective hit → **happy** (`battle.mjs` `execMoveContinue`)
- partner faints, or the player blacks out → **sad** (`checkFaint`, `finishDefeat`)
- winning a trainer battle with the partner conscious → **excited** (`winTrainer`)
- petting → **happy** (`overworld.mjs` `petPartner`)

### A2. The partner's hard rules: refuses evolution, refuses the box
Yellow hard rules, implemented as data + guards rather than vibes:
- `SPECIES.partner` carries `refusesEvolution: true, refusesBox: true`
- `evolutionCheck(mon)` / `boxCheck(mon)` in `src/game/state.mjs` are the enforcement points, with original refusal lines ("It does not want to change — not ever."). No evolution or deposit UI exists in the slice yet — when those systems land, they must call these guards. 19-gate coverage in `verify-slice.mjs` (qa y2).

### A3. Rival-with-Eevee dynamic
Yellow: the rival raises an **Eevee**, not a Kanto starter, and it evolves by the early rivalry record.
- Gary's Pallet dialogue now names his Eevee partner (original lines, no anime quotes)
- `src/data/rivals.mjs`: `RIVALS.gary` (partner `'eevee'`, per-act team plans) + `rivalPartnerEvolution(wins, losses)` — the documented rule: 2–0 → Vaporeon, 1–1 → Flareon, 0–2 → Jolteon. Pure, tested (qa y1).
- Species data for Eevee and its evolutions lands with the act that first fields them (ADR-006 content tiers) — the rule is data-ready now, the content ships on schedule.

### A4. Sight-line trainer challenges (the deferred feel item)
The single most "original game" overworld feel: trainers *see* you. `balance.md` §8 deferred this ("a feel upgrade for later") — this update is that later.
- NPC `sight: { dir, range }` cones on all 6 route trainers (Brock stays talk-only — gym-leader convention)
- Sequence: spot check between steps → 500ms `!` beat (mark over the trainer + original two-note `trainer-spot` alert jingle) → 150ms/tile walk-up to an adjacent tile → battle. Player input locked throughout; 3.5s failsafe forces the battle.
- Sight is blocked by walls/rocks/NPCs (data-authored; Cal watches left because the Route 1 sign blocks his downward cone — fixed as `da0b5ca`).

### A5. The uniformed duo ambush (Yellow's anime-trio events)
Yellow added the anime trio's ambushes. Ours: **RUE & COLE**, an original uniformed duo flanking the Route 2 path — original characters, original banter, **no motto quotes, no trademarked team name** (GC C4).
- Either spotter pulling **both** challengers in via the duo walk-up (`duoPartner` data)
- Sequential 2-mon battle (Weedle "Sting" Lv 5 → Zubat "Echo" Lv 6) — Gen 1 had no double battles; back-to-back is the faithful shape
- Trainer team entries gain an optional `nickname`, honored on lead and send-out
- Optional but likely: wide sight cones across the path, avoidable via a grass detour; sits between Rick and Bea on the curve (+104 XP, +$200 — see `balance.md`)

### A6. GB-era battle flow idioms
Trainer battles now open with the documented two-beat intro: "Trainer X wants to battle!" → "X sent out Y!" before the command menu (`battle.mjs`). Wild encounters keep the single "Wild X appeared!" beat. (qa y3 asserts both beats.)

### A7. Menu / sound feel
New beats get original chiptune: the `trainer-spot` alert sting joins the existing original set (encounter, catch, fanfares). Menu structure and ordering stay DS-idiom — see (B).

---

## (B) DELIBERATELY NOT — with reasons

1. **Surfing Pikachu minigame** — needs the Surf HM and a beach area; neither exists in the slice or Act I content. A minigame engine for one beat is scope, not authenticity. Defer to the act that introduces Surf.
2. **Full happiness/friendship system** — no evolution UI exists in the slice; building the system to house one refusal would be scaffolding without a building. The refusal is data + guards (A2) so the future system enforces it on day one.
3. **Double battles** — Gen 1 engine scope; Yellow's trio fights were sequential single battles anyway, which is exactly what the duo ambush ships (A5).
4. **Link battles / trading** — no platform for it (single-player web game). Out of scope.
5. **Safari Zone mechanics** — the zone doesn't exist in the slice or Act I maps. Mechanics without the place are dead code.
6. **Daycare / breeding** — no Daycare in the slice; systems out of scope for Act I.
7. **GB Start-menu ordering** — the pause menu order is signed DS UX (Game UI/UX seat, Wave 3). Directive: Yellow soul, DS body — the DS idiom wins here.
8. **GB square-wave sound emulation** — the original WebAudio chiptune set is the signed art direction. We extend it with new original jingles (A7) instead of imitating hardware.
9. **Verbatim anime motto / lines** ("Prepare for trouble…") — forbidden by GC §3.3 (no quoted or closely-paraphrased anime lines). The duo's banter is original writing in the same comedic register.
10. **Full rival multi-battle arc** — Orange/Johto content (ADR-006 tiers). The evolution rule and team plans are data-ready (A3); the battles ship with their acts.
11. **Pikachu's Beach / post-game events** — beyond the Act I scope, no matter how charming.

---

## Verification

- `scripts/verify-slice.mjs`: 19 new `qa y*` asserts (rival rule, refusal guards, spot SFX, sight-line challenge end-to-end, duo ambush end-to-end, mood hooks) — all pass; full suite exit 0.
- `scripts/verify-audio.mjs`: 23 PASS (new `trainer-spot` table passes the contract schema).
- `scripts/contamination-scan.mjs`: clean. `scripts/drift-gate.mjs` + `scripts/budgets-check.mjs`: pass.
- Palace: recorded as ADR-016 in `memory/wings/projects/pikachu-ds-remake/halls/decisions.md` (renumbered from ADR-013 to resolve a collision with Tech Law's ADR-013).

---

## Addendum — Full-fidelity round (2026-10-21, ADR-018..022)

The owner's directive escalated from the Act I slice to the complete game:
"exactly like real," a proper storyline, all 151 catchable, every Yellow
feature, all types end to end, the Z-A presentation change order, and the
War Room Protocol. What changed, honestly:

**Now matches Yellow (mechanics):** the Gen-1 damage formula with the
integer 217–255/255 roll; Gen-1 crits (base Speed /512, high-crit ×4,
attacker level doubled in the formula, stat stages and burn ignored on a
crit); Gen-1 accuracy (stage multiplier in thirds, perfect moves still
miss 1/256); the two-roll Gen-1 catch (ball ranges, status −25/−12, HP
factor, Master Ball absolute); Gen-1 status behavior (sleep 1–7 turns,
freeze thaws only to Fire, confusion self-hit at full formula, badly-poison
escalation, Leech Seed); Gen-1 escape formula; OHKO level-difference
accuracy ((userLv − targetLv + 30)/256); XP split among participants;
poison walk damage; the complete Kanto campaign, all 151 obtainable in one
playthrough (audited), all 50 TMs + 5 HMs, Bill's PC (12 boxes), Safari
Zone, Game Corner, both Snorlax, fossil revival, NPC trades, Hall of Fame,
the diploma.

**Deliberate divergences (ADR-018):** D1 the type chart is the complete
modern 18-type chart (owner WS8 ruling — Yellow fidelity governs feel, not
chart bugs); D2 no single Special stat / no per-type physical-special split
(the unified spa/spd model stays; moves carry their own category); D3 Focus
Energy multiplies crit ×4 (the original's ÷4 bug not reproduced); D4 stats
use IV 31 rather than rolled DVs (harness determinism); D5 Safari flee uses
a documented simplified rate model; D6 trade evolutions resolve solo via
PC "Link Transfer"; D7 badge obedience/stat-boost side effects are not
separately simulated (badges gate HMs, as the player feels them).

**Presentation (ADR-020):** the Z-A change order re-benchmarked
presentation — real-time battles (Model A) with the classic engine kept as
a switchable fallback, dark dialogue/menu idiom, speaker portraits,
encounter popup behavior — all in 100% original code and art; GC conditions
C1–C8 in the palace review file. "Exactly like" lives in internal docs
only, never in shipped copy.

**Verification:** verify-slice 133/133 (both editions),
tests/fidelity-checks.mjs 26/26, tests/campaign-smoke.mjs 24/24 (the whole
Kanto spine played headlessly), changed-flow 18/18, budgets/drift/
contamination/audio all green. Full matrix: docs/feature-parity.md.
