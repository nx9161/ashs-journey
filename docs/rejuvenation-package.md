# The Rejuvenation Package — Design Spec (ADR-025)

**Status:** DESIGN ONLY — no code in this pass. Owner directive 2026-10-27:
after a breakdown of the fan game *Pokémon Rejuvenation*, "thats exactly
what we need in our game." Six systems adopted as **original clean-room
implementations**. Systems and ideas are study material; Rejuvenation's
names, field charts, items, text, and content are **not** used — every
name, number, and line below is ours.

**Sequencing constraint:** a battle-freeze fix is in flight in
`src/game/battle.mjs` + `battle-rt.mjs`. Every battle-touching phase
below is designed against the code as it stands (including the ADR-020
theatre rule: the arena freezes while dialogue/menus are open) and is
built only after that fix lands.

**Standing law carried in:** hard but FAIR (scale threats, never the
player; telegraphs ≥0.45s; no unavoidable damage); anime is primary
canon (ADR-015/019); one DS-era visual identity; keyboard + touch
parity (ADR-021); Gen-1 math in `src/engine/formulas.mjs` shared by
both battle engines (ADR-018/020).

---

## 1. Field Effects → **Grounds**

Every battlefield has a **Ground**: a small set of public rules keyed to
where the battle happens, in force for the whole fight, announced up
front. Gym leaders fight on their home Ground and build for it — and
because the rules are symmetric, the player can exploit the same Ground
right back (the Rejuvenation water-gym lesson: a field that empowers
the type that beats the leader is a feature, not a bug).

### Mechanics (decided)
- **Determination:** `map/area id → groundId` table in a new data file
  (`src/data/grounds.mjs`, planned). Wild battles use the area's
  Ground; trainer/gym battles use the building/arena's Ground. Default
  = **Open Ground** (no rules) — most early routes, so the system
  teaches by contrast.
- **Shape of a Ground:** exactly three rules, no more:
  1. one type at **×1.2** damage,
  2. one type at **×0.8** damage,
  3. one **twist** (a mechanical rule, below).
  Caps are hard: never stronger than ×1.2 / ×0.8, never creates an
  immunity, never removes one.
- **No chip damage.** No Ground deals per-turn or per-step damage in
  v1 — that is unavoidable damage and the owner's fairness rule
  excludes it categorically.
- **Announcement (telegraphing):** classic battles show a one-line
  banner before the first command ("The arena is a **Rubble Ground** —
  Rock and Ground moves hit harder here."); RT battles show the same
  line plus a persistent Ground chip next to the cooldown chips, and
  the arena backdrop tint shifts (backdrops are already per-area,
  v2.3). Gym exteriors carry an NPC or signpost that teaches the
  gym's Ground before the player walks in.
- **Both engines, one implementation:** the damage multipliers apply
  inside the shared damage path in `src/engine/formulas.mjs`
  (`calcDamage`, which both engines already use), driven by a
  `battle.field` object set at battle start in `battle.mjs`. Twists
  that are RT-shaped (cooldown / projectile / movement) hook the
  ADR-020 formulas in `battle-rt.mjs` (`cooldownMs`, projectile
  speed, arena movement); their classic equivalents (accuracy /
  priority-of-resolution) are defined per twist below so the Ground
  means the same thing in both models.
- **Save shape:** none. Ground is derived from location at battle
  start — zero validator impact.

### Kanto Grounds (decided set)
| Ground | Where | ×1.2 | ×0.8 | Twist |
|---|---|---|---|---|
| Open Ground | most routes/towns | — | — | — |
| Bloom Ground | Viridian Forest, grassy routes | Grass | Fire | Healing moves restore +50% (both engines) |
| Storm Ground | Power Plant, rainy coast | Electric | Ground | Electric moves: RT cooldown ×0.85; classic: +5 accuracy |
| Mire Ground | Safari Zone, marsh routes | Ground | Electric | RT: movement −15% for mons not Water/Grass/Ground-typed; classic: Speed stat −10% for the same set |
| Grave Ground | Pokémon Tower | Ghost | Psychic | Status moves: RT cooldown ×1.25; classic: status accuracy −10 |
| Ember Ground | Cinnabar, volcanic areas | Fire | Water | Burn infliction chance +10% where a move can burn |
| Frost Ground | Seafoam Islands | Ice | Fire | RT: dodge i-frames +40ms; classic: evasion +1 stage-equivalent (acc ×0.95 against) — dodge only, no damage |
| Tide Ground | Surf routes, St. Anne | Water | Electric | Special moves: RT projectile speed +15%; classic: special crit threshold +1 stage-equivalent (Speed/256 added) |
| Rubble Ground | Pewter Gym, Mt. Moon, Rock Tunnel | Rock | Grass | Physical moves: RT lunge speed +15%; classic: physical accuracy +5 |
| Mind Ground | Saffron Gym | Psychic | Ghost | See gym table |
| Venom Ground | Fuchsia Gym | Poison | Psychic | See gym table |
| Volt Ground | Vermilion Gym | Electric | Ground | = Storm rules, renamed locally (same rules object) |
| Marsh Ground | Celadon Gym | Grass | Fire | = Bloom rules |
| Pyre Ground | Cinnabar Gym | Fire | Water | = Ember rules |
| Spirit Ground | Viridian Gym (Giovanni) | Ground | Electric | = Mire rules; the finale reuses the marsh's menace deliberately |

Gym mapping (decided): Brock → Rubble, Misty → Tide, Surge → Volt,
Erika → Marsh, Koga → Venom (twist: poison infliction +10% like Ember's
burn rule), Sabrina → Mind (twist: status cooldown/accuracy mirrored
from Grave), Blaine → Pyre, Giovanni → Spirit. Each leader's team is
authored to lean on the ×1.2 and to carry one member that punishes the
obvious counter — but the counter-type the Ground *doesn't* suppress
always exists (every type has ≥2 counters; the ×0.8 touches only one).

### Balance guardrails / abuse cases
- Symmetric modifiers only — the player standing on the same Ground
  gets the same numbers. No "boss-only field" flag exists in the data
  shape, so one can never be added silently.
- ×1.2 on the leader's STAB is worth roughly +1 level of threat; gym
  level budgets in `docs/balance.md` absorb it without re-tuning
  levels (verified by sim at build time, same method as balance §5).
- No Ground stacking: one Ground per battle, indoors overrides
  outdoors, scripted events may pin a Ground explicitly (legendary
  lairs — see §5 tie-in).
- Player degenerate line ("only fight leaders on counter-Grounds")
  doesn't exist: gym Grounds are fixed to the gym. The player's lever
  is team choice, which is the intended strategy.

### Content needs
- `grounds.mjs` data (≈14 entries), map→Ground assignments for Kanto's
  60 maps (most inherit Open/Bloom by area tag), banner + chip copy,
  8 gym signpost/NPC teaching lines, backdrop tint variants (art:
  palette shifts of existing backdrops, no new scenes).

---

## 2. Bond System → **Bonds**

Key characters keep a **bond score** with Ash (hidden integer −10..+10,
four visible tiers: **Cold / Wary / Warm / Close**). Dialogue choices,
quest help, and battle outcomes move it; it changes what people say,
what they give, and how scenes play — **never what the canon story
does**. Anime is the spine (ADR-015/019): bonds shade the journey,
they do not branch it. There is deliberately **no bad ending and no
route split**.

### Mechanics (decided)
- **State:** `story.bonds = { npcId: score }` + tier derived, never
  stored. Save-shape change → validator update + schema bump (§7).
- **Sources:** authored dialogue **choice points** (new; ride the
  existing `ui.showMenu` so keyboard/touch parity is free), Town Tale
  completions (§5, +2 with the quest's named NPC), legendary-arc
  beats (+1 with involved characters), battle outcomes vs that
  character (beat the rival: +1 respect even in rivalry; lose: −1,
  floors at −10), gifts given (authored only, no generic gift spam).
- **Feedback:** after any change, a small heart pip on the dialogue
  nameplate (▲ warms / ▼ cools) — the `PARTNER_MOODS` idiom (ADR-016)
  extended to people. Choices are **not** pre-labelled good/bad;
  the pip teaches after the fact.
- **Effects (all within canon):**
  - **Dialogue variants:** line sets in `src/data/dialogue.mjs` keyed
    by tier for the ~10 bond characters; Warm+ unlocks personal
    backstory lines; Cold unlocks guarded/short variants of the same
    beats. The plot lines are identical; the temperature differs.
  - **The rival:** Gary's pre-battle and post-battle lines vary by
    tier, and his Eevee evolution rule (ADR-016, driven by the
    win/loss ledger) stays the mechanical expression of the rivalry —
    bonds read the same ledger, no second system. At Close, his
    Indigo League scene gains the mutual-respect variant (anime-true).
  - **Rue & Cole:** bond decides texture of their escalation arc
    (ADR-019): Wary− → ambushes stay ambushes; Warm+ → later
    appearances open with a parley choice (fight, or talk them down
    for reduced XP but +bond and a keepsake — §3). Both paths reach
    the same Giovanni payoff.
  - **Gym leaders:** each leader is the named NPC of their town's
    Town Tale; completing it at Warm+ earns their keepsake gift (§3)
    and unlocks rematch banter. Rematch *availability* is never
    bond-gated (canon + fairness).
  - **Companions/professor/mother:** Mom and Oak carry bond too —
    cheap, high-charm: Oak's dex-rating lines and Mom's send-offs
    warm up visibly across the run.
- **Numbers:** a full Kanto run offers ≈ +14 attainable points per
  major character; Close (≥+7) is reachable but not default; no
  character can be hard-locked below Wary by a single choice (single
  choice swing ≤2).

### Guardrails / abuse cases
- Bonds **never gate** main-story progression, badges, dex entries,
  or keepsake *existence* — every bond-gated keepsake has a second
  source (late-game shop or quest) so nothing is permanently
  missable (the dex-completion promise of ADR-019 stays absolute).
- No grindable source: every bond source is one-shot authored content.
  There is no talk-to-NPC-100-times path by construction.
- Bond effects on battles: **none.** No stat, AI, or team changes
  from bond (decided; flagged to the owner as vetoable, §8 R3) —
  fairness and canon both say the fights stay honest.

### Content needs
- Choice-point authoring at ≈20 existing story beats; tier-variant
  lines for 10 characters × ~4 scenes; nameplate pip (UI: reuse the
  mood-pip renderer); `dialogue.mjs` variant schema.

---

## 3. Crest-Style Items → **Keepsakes**

One held-item slot per Pokémon, filled by **Keepsakes**: mementos with
a story source (a feather, a shell, a ribbon) whose effect is
**conditional** — they rescue weak, underleveled, or out-of-position
Pokémon instead of handing out flat power. Base stats, learnsets, and
species data are untouched (canon per ADR-018/019).

### Mechanics (decided)
- **State:** `mon.keepsake = itemId | null` (new field on the
  `makeMon` shape in `state.mjs`); bag gains a `keepsakes` pocket
  (non-consumable, non-sellable, stack 1 each — a keepsake is a
  unique object). Give/Take rows in the party menu; PC boxes preserve
  the slot. Save-shape change → §7.
- **Effect shape (the design law):** every keepsake is (a) conditional
  (a window, a trigger, or a matchup), (b) once-per-battle where it
  is strong, and (c) readable in one line on the summary screen.
  Flat always-on % stat boosts are banned by the shape itself.
- **Both engines:** damage-shaped effects live in the shared
  `formulas.mjs` path; trigger-shaped effects (on-KO-save, on-switch)
  hook the faint/switch checks that already exist in `battle.mjs`
  and are mirrored in `battle-rt.mjs`'s `rtCheckFaints` — one helper
  module (`src/game/keepsakes.mjs`, planned) so the engines can't
  drift.
- **Opposition:** on Classic, gym leaders' aces hold keepsakes from
  the Indigo League onward; on Challenge (§4) every leader's team
  holds them. Wild Pokémon never hold keepsakes.

### The Kanto set (decided — 12)
| Keepsake | Effect (one line) | Source |
|---|---|---|
| Sparrow Feather | Holder deals ×1.25 damage while ≥3 levels below the foe | Route 2 hidden item |
| Tortoise Charm | Once per battle, when an attack would KO the holder from above half HP, holder survives at 1 HP | Viridian Town Tale |
| Second-Wind Ribbon | Once per battle, at ≤25% HP the holder's Speed rises 1 stage | Rue & Cole parley (or Celadon shop, late) |
| Ember Seed | Holder's Fire moves gain +10% burn chance; holder can't be frozen | Cinnabar Town Tale |
| Tide Pearl | Holder takes ×0.8 from Electric moves | Vermilion Town Tale |
| Gloom Fang | Holder's Poison moves: RT cooldown ×0.85 / classic +10% poison chance | Safari Zone exploration |
| Iron Acorn | Holder takes ×0.85 from the first hit it takes each battle | Pewter Town Tale |
| Spectre Bell | Holder's Ghost moves ×1.2 vs Psychic-types (matchup window only) | Lavender Town Tale |
| Gardenia Sash | Healing moves on the holder restore +50% | Celadon Town Tale |
| Thunderhead Pin | Holder's Electric moves ×1.15 when at ≤50% HP | Power Plant exploration |
| Fossil Spur | Holder's Rock moves ×1.15 vs faster foes | Mt. Moon hidden item |
| Champion's Ribbon | Holder gains ×1.2 XP (the one economy keepsake; no battle effect) | Indigo League — Hall of Fame gift |

Numbers sit deliberately at the Ground caps (×1.2/×0.8 family) so
Fields + Keepsakes stack to at most ≈×1.44 in a narrow window —
checked in the balance sim at build.

### Guardrails / abuse cases
- One slot, no stacking, effects never multiply each other (the
  damage path applies keepsake modifier once, after Ground).
- "Survives at 1 HP" is once-per-battle and only from >50% HP —
  it cannot chain with healing loops (healing above half re-arms it
  at most once more per battle by the once-per-battle flag, which
  does **not** reset on heal; flag is per-battle, period).
- Keepsakes are never random drops: every source is authored and
  finite (12 in Kanto), so the collection is completable and the
  Command Deck / dex-style tracking stays honest.
- The partner (Pikachu) may hold a keepsake — it is not evolution
  and not boxing; the ADR-016 refusal guards don't apply (decided).

### Content needs
- `items.mjs` extension (keepsakes table), party-menu Give/Take UI,
  summary-screen line, 12 item icons (16×16 original pixel marks,
  existing icon idiom), source placements (hidden items, quest
  rewards, two exploration spots, one shop, one HoF gift).

---

## 4. Difficulty System → Modes + **House Rules**

Two layers: a **mode** picked for the run, and **House Rules** —
player-side modifier toggles living in Options. House Rules are the
"password system" concept re-implemented as switches: no codes to
type, nothing to look up on a wiki, discoverable in the menu where
players already change battle style. (Decided over literal passwords:
the concept the owner wants is *player-customized rules*, and a toggle
is that concept with better UX. Rationale recorded in ADR-025.)

### Modes (decided — wire the existing `story.difficulty` hook)
`story.difficulty ∈ { 'story', 'classic', 'challenge' }` — the field
already exists in `state.mjs` (unwired, per `docs/balance.md` §8);
default **'classic'** = the game exactly as shipped and sim-verified.

| Lever | Story | Classic | Challenge |
|---|---|---|---|
| Trainer/gym levels | −2 (floor 1) | as authored | leaders use rematch-grade teams at +2 |
| Foe IVs in stat calc | 16 | 31 | 31 |
| Leader AI | standard | as authored | 'smart' selection |
| Foe keepsakes | none | aces only, late | all leader teams |
| Ground twists (§1) | off; type mods halved (×1.1/×0.9) | full | full |
| RT foe cooldowns | ×1.1 | ×1.0 | ×0.9 |
| Player XP | ×1.25 | ×1.0 | ×1.0 |
| Catch | ball bonus ×1.1 | ×1.0 | ×1.0 |

Fairness audit against the owner's rule: every Challenge lever scales
the **threat** (levels, AI, cooldown speed, held items) — nothing
nerfs the player; Story's levers weaken threats, never buff the
player's stats directly (XP/catch are economy, not combat power);
telegraphs and the no-unavoidable-damage rule are untouched in all
three modes. Difficulties genuinely differ in RT threat speed
(×1.1 / ×1.0 / ×0.9 cooldowns), per the owner's standing requirement
that difficulties differ in threat speed, not just numbers.

**Mode changes:** lowering is allowed any time from Options; raising
locks once the first badge is earned (a run's honors stay honest).
The mode is written on the save and shown wherever the save is
summarized.

### House Rules (decided set — all default OFF, all in `settings`)
Stored as `settings.houseRules = { steadyDamage, mercifulFoes,
fastLearner, generousWorld, candyCoach, skipIntro }` → §7.
- **Steady Damage** — the Gen-1 damage roll (217–255)/255 is fixed at
  255/255 for **both** sides. Removes variance, not difficulty.
- **Merciful Foes** — foe IVs treated as 16 regardless of mode
  (composes with Story; redundant there, harmless).
- **Fast Learner** — XP ×1.5 from all sources.
- **Generous World** — prize money ×1.5.
- **Candy Coach** — a Sparring Coach appears in every Pokémon Center:
  a repeatable 1v1 spar against a mon at (your highest level − 2);
  each win awards one **XP Candy** (new consumable: +800 XP to one
  Pokémon, from the Bag like a Rare Candy with fixed XP instead of a
  level). Anti-grind shape: the spar *is* the grind, priced in time
  and potions, and 800 XP is ~⅔ of a mid-game level — support, not a
  skip.
- **Skip Intro** — new runs may skip the professor intro sequence
  (auto-offered on NG+ runs, §6).

### Guardrails / abuse cases
- House Rules are visible on the save summary and (later) the Command
  Deck System panel — a "Pure Run" ribbon is shown on saves that have
  never enabled a House Rule (state: `meta.houseRulesTouched`).
  Bragging rights are the only thing modifiers cost.
- Modifiers never touch: catch *species availability*, dex
  completion rules, bond sources, or keepsake sources. Completion
  stays completion.
- Candy Coach + Fast Learner + Champion's Ribbon stack to ≈×1.8 XP —
  accepted deliberately: XP accelerates *access* to intended levels;
  gym level budgets assume the top of the curve (balance §4), and
  Challenge mode exists for players who want the ceiling pushed.

### Integration points
- Options menu rows in `src/game/main.mjs` (beside the existing
  Battle style row, ~L828/856): a "Difficulty" row (mode, with the
  lock rule) and a "House Rules" submenu (six toggles, same
  cursor-memory menu machinery the audit hardened).
- Consumers: `formulas.mjs` (roll fix, IV treatment), trainer team
  builders (level/AI/keepsake assignment), `battle-rt.mjs`
  `cooldownMs` multiplier, XP/money award paths in `battle.mjs`,
  Center NPC table (Candy Coach), intro skip flag in `intro.mjs`.

---

## 5. Town Side Quests → **Town Tales**

The quest log today carries the main story and the legendary arcs
(ADR-019 pattern: hook → prerequisites → climax, tracked in
`story.quests`, surfaced via Journey → Quest Log in `main.mjs`).
**Town Tales** extend that exact machinery to every Kanto town:
short, authored, lore-first errands that make towns lived-in and put
the exploration rewards (keepsakes, TMs, bond) on the map.

### Framework (decided)
- **Data:** a planned `src/data/quests.mjs`: `QUESTS = { id:
  { town, giver, title, stages: [...], reward, bondNpc } }`, reusing
  the LEGENDARY_ARCS stage pattern from `story-kanto.mjs`.
- **State:** `story.quests[id]` grows stage values (`'active'` →
  stage numbers → `'complete'`) — a quest is a stage machine, not a
  boolean. Validator note in §7.
- **Quest Log UI:** `openQuestLog()` gains three sections — **Main
  Story / Legendary Arcs / Town Tales** — with stage text per quest.
  No new screen; the log the player already has just gets richer.
- **Shape law:** ≤3 stages, ≤1 required battle (never a boss), always
  completable when offered (no level gates hidden inside), reward
  stated up front in the log once accepted (no wiki-needed design).
- **Lore payoff law:** every Tale ends with a *revelation*, not just
  a reward — a fact about the town's past, a character's history, or
  a hook into a legendary arc (Tales deliberately seed arc rumors:
  Lavender's Tale names the tower's unrest before the Marowak beat).

### The Kanto set (decided — 10, one per town)
| Town | Tale | Ask (stages) | Reward |
|---|---|---|---|
| Pallet | "Mom's Care Package" | Deliver Mom's package to the Viridian shopkeeper; return with a receipt | Bond: Mom +2; 3 Potions |
| Viridian | "The Retired Ace" | A former gym trainer's keepsake was lost in the Forest — find it, choose: return it or keep it (bond choice; returning is Warm) | Tortoise Charm (either way — he insists you keep it if returned) |
| Pewter | "Brock's Day Off" | Cover the museum desk quiz (3 questions from exhibit text), then spar Brock's Geodude off-duty | Iron Acorn; Bond: Brock +2 |
| Cerulean | "The Stolen Bike Bell" | Track the bell through 3 NPC witnesses to the Cerulean cape; talk or battle the culprit kid | TM (Water Gun upgrade path→ BubbleBeam TM11); Bond: Misty +1 |
| Vermilion | "Fan Club Founder" | The Pokémon Fan Club founder lost his notes at the port; retrieve them from the S.S. Anne dock (pre-departure) | Tide Pearl; Bond: Surge +1 (he respects the founder) |
| Lavender | "Names on the Wall" | Help the volunteer record the tower's unnamed graves; meet the elder who remembers the Marowak | Spectre Bell; seeds the Marowak beat; Bond: Mr. Fuji +2 |
| Celadon | "Roof Garden" | Water the Game Corner roof garden's plants across 3 visits (badge-paced), chase off a wild Meowth | Gardenia Sash; Bond: Erika +2 |
| Saffron | "Two Gyms, One City" | Carry a message between the Fighting Dojo and Sabrina's gym; witness their old rivalry | Choice: Dojo spar (XP) or Sabrina's keepsake IOU (redeemed post-badge); Bond: Sabrina +1 |
| Fuchsia | "The Warden's Teeth" (original spin: the warden lost his *fishing lure*, not dentures — no copied gag) | Search the Safari Zone entrance marsh; return the lure | Safari pass discount (Ball bundle gift ×10); Bond: Koga +1 via his daughter's thanks |
| Cinnabar | "Lab Notes" | Recover burned research notes from the Mansion's library (2 rooms), deliver to the lab tech | Ember Seed; Bond: Blaine +1; Mansion lore drop (Mew foreshadow — canon-safe, no new facts about Mewtwo beyond anime) |

### Guardrails / abuse cases
- Tales are one-shot and finite; rewards are authored, never
  repeatable (no money/XP farms — the Candy Coach is the game's one
  sanctioned grind, §4).
- No Tale is missable permanently: givers persist post-League
  (Saffron's and Anne-gated beats have post-game fallback givers —
  the dock quest moves to the harbormaster after the Anne departs).
- Tales never gate main progression; two Tales (Lavender, Cinnabar)
  *foreshadow* required beats but teach nothing mandatory.

### Content needs
- 10 quest scripts (~30 stage dialogues), 6 NPC additions, witness
  chain flags, the Mansion library rooms flagged interactive
  (maps exist), Quest Log section work in `openQuestLog`.

---

## 6. New Game+ → **Second Journey**

When any save slot holds a **completed Kanto** (Hall of Fame entry in
`story.hof` — already recorded by `overworld-systems.mjs` — or
`story.regionsDone` containing 'kanto'), the title screen gains
**Second Journey**: start a fresh run that *remembers* the last one.
Rejuvenation's lesson, adapted: NG+ reads your prior saves instead of
being a manual toggle, and what carries is **knowledge and relief
from repetition** — never power. (Anime precedent is on our side:
Ash starts each region fresh with Pikachu and what he *knows* —
ADR-010 OQ-13's team-reset rule is the same philosophy.)

### What carries (decided)
- **Dex records:** caught/seen data carries as *records* — the dex
  stays filled and Oak's rating reflects the archive, but Second
  Journey completion (Second Journey HoF ribbon) requires the new
  run's own catches for its League team. Completion semantics are
  the owner's call — see §8 R1 (recommended: as written here).
- **Keepsake collection:** every keepsake ever earned is in the new
  run's keepsake pocket from the start (items, not the mons that
  held them). Sources in the world remain and grant duplicates →
  the second copy converts to a stated sell value (keepsakes stay
  non-sellable when *held*; duplicate-source copies arrive as their
  cash value, +₽2,000, with a line of dialogue).
- **House Rules:** all unlocked from run start (they're Options, so
  they already persist per-settings — stated for completeness).
- **Puzzle memory ("Traveler's Memory"):** one-time *friction* gates
  the player has solved before are pre-solved when reached: the
  Saffron guard accepts the drink on sight, the Game Corner coin
  case is handed over, the Card Key route is un-gated once Silph is
  entered, fossil choice may be re-picked freely. Story beats,
  battles, and badges are **never** skipped — only door-keeping.
- **Starter breadth:** the starter choice includes any starter line
  previously chosen in a completed run (all three are earnable
  in-world anyway, ADR-019 — this just moves the reunion earlier).
- **Bond echo:** bond characters start at 0, but Warm-tier dialogue
  unlocks one tier earlier for characters who were Close in the
  prior run (the game says it plainly once: "You seem familiar.
  Have we met?" — a wink, kept out of canon's way).
- **Meta:** `meta.ngPlus` counter on the new save; each completed
  Second Journey adds a ribbon to the title menu's save summary;
  the prior run's HoF teams are viewable from the Journey menu as a
  text list (a deliberate partial cure for the accepted S-48 gap:
  still no graphical Hall of Fame viewer, but the teams are no
  longer write-only data).

### What never carries (decided)
Levels, party, boxes, money, badges, story progress. A Second
Journey team is built in the new run. This is the anti-trivialization
guardrail and it is absolute.

### Integration points
- Completion detection: `story.hof.length > 0 || regionsDone`
  (existing fields, no schema change for detection).
- Title menu row in `title.mjs` beside Continue; run creation in
  `state.mjs` (`defaultState()` gains an `inherit` parameter fed
  from the chosen completed save); cross-slot reading rides the
  existing save-slot machinery (3 slots) and, for guests, the
  localStorage slots.
- Server validator: `meta.ngPlus` + inherited dex/keepsakes are
  legal shapes (§7); anti-tamper posture unchanged (inherited fields
  are validated against the *source* slot server-side at first sync —
  noted as build-phase AppSec review item, not solved here).

---

## 7. Save-shape & validator impact (all systems, decided)

Schema bumps to **v2** (`SCHEMA_VERSION` in `state.mjs`), one
migration, defaults-filled on load (old saves open clean):
- `story.bonds` (object, default `{}`)
- `story.quests` values widen: `'active' | number | 'complete'`
- `mon.keepsake` (string | null, default null)
- `settings.houseRules` (six booleans, default false) +
  `meta.houseRulesTouched` (bool) + `meta.ngPlus` (int, default 0)
Per ADR-022 precedent, the server validator + generated tables are
regenerated in the same build phase that lands each field — never
after. Command Deck System panel may surface mode/House Rules in a
later pass (out of scope here).

## 8. Phased build plan (decided order)

| Phase | System | Why here |
|---|---|---|
| 1 | **Difficulty modes + House Rules** (§4) | Self-contained: the `story.difficulty` hook and Options rows already exist; zero new content; immediately improves the owner's own playtest and every later phase's balance testing. |
| 2 | **Grounds** (§1) | Engine-level and content-light (one data table + hooks in the shared damage path); must precede Keepsakes so keepsake numbers are tuned against fields, not retro-fitted. Waits for the battle-freeze fix. |
| 3 | **Keepsakes** (§3) | Greenfield item slot + 12 authored items; sources stub in via existing hidden items/shops so it ships before the quest content that will also feed it. |
| 4 | **Town Tales** (§5) | The content-heavy lift (10 quests); delivers 5 keepsake sources properly, seeds legendary arcs, and creates the bond sources Phase 5 needs. |
| 5 | **Bonds** (§2) | Needs the dialogue-choice primitive + Tales in place; pure writing/variant work once hooks exist; zero battle risk. |
| 6 | **Second Journey** (§6) | Smallest code, but depends on stable keepsake/quest/dex semantics from Phases 3–5 and on completed-save data being final. Last because it reads everything else. |

Each phase ships with: balance sim deltas where numbers moved
(`docs/balance.md` method), suite additions (fidelity-checks for
formula-shaped rules; campaign-smoke for content), and a
feature-parity.md status row update. No phase is "done" on code
alone — the owner's hands-on gate stands (ADR-019).

## 9. Owner rulings — ALL RULED 2026-10-27

Everything else in this spec is **decided** (marked inline). The
three items that belonged to the owner were put to him the same
day; he adopted **all three recommendations as written**:

- **R1 — Second Journey dex semantics.** Recommended: dex *records*
  carry (archive stays filled), Second Journey honors require the
  new run's own team/catches for its HoF ribbon. Alternative: full
  reset with a records-only "Archive Dex" view. Pick one; the build
  differs in exactly one function.
- **R2 — Story-mode purity.** Recommended: Story mode halves Ground
  type modifiers and disables twists (as specced). If the owner wants
  Story players to see the full field system, say so and Story keeps
  full Grounds with only its level/IV levers.
- **R3 — Bond veto check.** Decided: bonds never change battle
  stats/AI/teams. Flagged because it is a *feel* call: if the owner
  ever wants a Close-bond leader to visibly hold back (or a Cold
  rival to fight dirtier), that is a canon-and-fairness change only
  he can authorize.
