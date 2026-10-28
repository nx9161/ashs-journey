# Feature Parity Matrix — Yellow (mainline) vs ASH'S JOURNEY

QA-owned checklist per WS9. A feature is **Verified** only with named
automated proof; **Implemented** means the code path exists and is data-
audited but awaits hands-on play; **Designed** means ADR-locked, not built;
**Excluded** is a deliberate ADR divergence. The owner's hands-on
fun-verification is the final gate for every row.

Suites: `scripts/verify-slice.mjs` (133), `tests/fidelity-checks.mjs` (26),
`tests/campaign-smoke.mjs` (24), `tests/qa-changed-flows.mjs` (18 groups).

## World / interaction
| Feature | Status | Proof / note |
|---|---|---|
| Tile overworld, grid movement | Verified | verify-slice playthrough |
| NPCs + signs | Verified | campaign-smoke talks/gifts; data audit |
| Hidden items | Implemented | sysInteract hidden-item flags; audited placement |
| Item balls | Implemented | sysInteract + fossil exclusivity rule |
| Poison damage while walking | Implemented | sysOnStep (1 HP / 4 steps, blackout at wipe) |
| Bicycle + Bike Voucher + Cycling Road speed | Implemented | SELECT toggles bike (2x steps); voucher item in data |
| Town Map | Implemented | Bag key item → visited-places view |

## Encounters
| Feature | Status | Proof / note |
|---|---|---|
| Grass rates per area | Verified | verify-slice cadence QA (mean gap in band) |
| Cave encounters (floor flag) | Implemented | maps data + sysOnStep cave branch |
| Surf encounters (water table) | Implemented | sysOnStep water branch |
| Fishing — Old/Good/Super Rods | Implemented | rod-tier tables per map; best rod auto-used |
| Safari Zone (500 steps, Safari Balls, bait/rock, flee) | Implemented | battle safari mode + session budget; flee is a documented simplification (ADR-018 D6) |

## Battle
| Feature | Status | Proof / note |
|---|---|---|
| Full move system (statuses, stages, multi-hit, charge, Bide, Counter, Metronome, Substitute, screens, Leech Seed, Transform, Disable, Haze, Mist, Focus Energy, Conversion, Mimic) | Implemented | engine supports all effect flags present in data; spot-verified in suites |
| Status conditions PSN/BRN/PAR/SLP/FRZ + confusion | Verified | verify-slice + fidelity formula checks; Gen-1 quirks: freeze needs a Fire hit, sleep 1–7 turns |
| Stat stages incl. accuracy/evasion | Verified | formulas + engine |
| Gen-1 crit rules (base Speed /512, high-crit ×4, level doubled, stages ignored) | Verified | fidelity-checks formula asserts |
| OHKO level-difference accuracy | Verified | campaign-smoke (Giovanni regression) |
| Ball inventory (Poké/Great/Ultra/Master/Safari) | Verified | gen1Catch asserts incl. Master auto-catch |
| Catch formula (two-roll, status −25/−12, HP factor) | Verified | fidelity-checks |
| Classic turn-based battle (THE main battle, ADR-026) | Implemented | Owner ruling 2026-10-28: classic is the default (settings.battleStyle 'classic'); presentation elevated WP3 (hitstop/trauma holds, faint beat, drain cap, Ground readout — census in ~/workspace/ashs-journey-qa/battle-classic-census.md); proofs: tests/battle-model-checks.mjs 45/45 |
| Real-time battle mode (Z-A change order) | Implemented | ADR-020 Model A; ADR-026 (2026-10-28): retained as a selectable OPTIONAL legacy mode — no longer the default, feel untouched; fidelity-checks RT functional test + battle-model-checks B07/B08 |
| Shift/Set switch option (ADR-026) | Implemented | settings.switchMode 'set' (default) / 'shift'; classic engine only; Set = no prompt on a foe KO (owner complaint, 2026-10-28), Shift = genre prompt exactly once per trainer KO with genre XP/participant semantics; proofs: battle-model-checks B03–B06 + Part F edge gates |
| XP split among participants | Implemented | engine participants set |

## Pokémon management
| Feature | Status | Proof / note |
|---|---|---|
| Party of 6 | Verified | verify-slice |
| Bill's PC — 12 boxes × 20 | Implemented | openPc (deposit/withdraw/switch); partner refusal enforced |
| Nicknaming + Name Rater | Implemented | Name Rater NPC; signup/intro naming pre-existing |
| Evolution: level / stone / trade-substitute | Verified | campaign data closure; trade evolutions resolve via PC "Link Transfer" (ADR-019) |
| Move learning prompts (full set → choose) | Implemented | learn queue + forget-protection for HM moves |
| TM 01–50 + HM 01–05 teaching | Implemented | full TM table; per-species eligibility from data |
| HM overwrite protection | Implemented | HM-taught moves unselectable in forget menu |

## Field moves
| Feature | Status | Proof / note |
|---|---|---|
| Cut (trees) | Implemented | badge-gated interaction |
| Fly (visited towns) | Implemented | party-menu field move |
| Surf | Implemented | badge-gated water entry + encounters |
| Strength (boulders) | Implemented | pushable boulders, session-persistent |
| Flash (dark caves) | Implemented | Rock Tunnel darkness + light radius |

## Story systems
| Feature | Status | Proof / note |
|---|---|---|
| 8 gyms + badge effects | Verified | campaign-smoke ladder; badge effects = the HM field gates (Cut/Flash/Surf/Strength/Fly) — the original's obedience/stat-boost side effects are not separately simulated (recorded divergence, ADR-018 D7) |
| Silph Co. / Card Key / Silph Scope arc | Verified | campaign-smoke (hideout boss → tower ghost → silph boss) |
| Rocket Hideout + Game Corner (slots, prizes, coin case) | Implemented | slots paytable + prize corner (Porygon 6,500) |
| Poké Flute + both Snorlax | Verified | campaign-smoke (west); east placed + audited |
| Fossil revival (Cinnabar Lab) | Implemented | Helix/Dome exclusivity + Old Amber → Aerodactyl |
| In-game NPC trades | Implemented | trade NPCs across Kanto (audit-counted) |
| Elite Four + Champion + Hall of Fame | Verified | campaign-smoke incl. HoF snapshot |
| Oak's Pokédex rating | Implemented | professor rating lines by caught count |
| Game Freak diploma at 151 | Implemented | checkDiploma on the 151st catch |
| Difficulty modes + House Rules (Rejuvenation P1, ADR-025) | Implemented | Story/Classic/Challenge wired via rules.mjs (levels/IV/AI/RT cooldowns/XP/catch levers); six House Rule toggles in Options; Candy Coach spar + XP Candy in every Center; Pure Run ribbon on the Save summary; owner's hands-on gate stands. Proofs: tests/rejuv-phase1-checks.mjs 44/44 |
| Grounds — field effects (Rejuvenation P2, ADR-025) | Implemented | 15 Grounds in src/data/grounds.mjs, all 56 Kanto maps assigned (unmapped → Open); x1.2/x0.8 type factors inside the shared calcDamage path (both engines, symmetric); per-Ground twists in both engines (heal/cooldown/accuracy/crit/Speed/status-chance/dodge/projectile/lunge/movement); Story halves to x1.1/x0.9 and disables twists (R2, folded into battle.field at resolve); classic banner + RT banner/chip/backdrop tint; 8 gym exterior teaching signs; no save-shape change. Proofs: tests/rejuv-phase2-checks.mjs 42/42 (incl. real-browser RT/classic damage parity) |
| Keepsakes — held items (Rejuvenation P3, ADR-025) | Implemented | 12 original conditional-only pieces (data shape cannot express a flat boost) in src/data/items.mjs KEEPSAKES + src/game/keepsakes.mjs shared helper; mon.keepsake slot (v2 shape, defaults-filled; cloud validator accepts + migrates legacy); damage factors applied once after the Ground factor in the shared calcDamage path, both engines; triggers (Tortoise KO-save, Second-Wind Speed) at both engines' faint/switch checks via the one helper, flags on the transient mon._ks wrapper, never persisted, never re-arming; foe lever (Story none / Classic leader aces / Challenge all leader teams, authored per-piece on all 13 leader teams; wild never); sources: Route 2 + Mt. Moon hidden, Safari + Power Plant placements, Celadon atelier sells the Second-Wind Ribbon behind a 7-badge stock gate, Champion's Ribbon as the Hall of Fame gift, six Town-Tale pieces first shipped on marked STUB hidden placements, re-sourced to their tales by Phase 4; 12 authored 16×16 icons; party Give/Take + bag give + PC preserve + summary effect line. Proofs: tests/rejuv-phase3-checks.mjs 59/59 (incl. real-browser parity) |
| Town Tales (Rejuvenation P4, ADR-025) | Implemented | 10 original town quests in src/data/quests.mjs riding the existing story.quests machinery ('active' → stage numbers → 'complete'; validator widened on both sides, 'discovered' kept legal for arc saves): Pallet care package, Viridian retired ace (return-or-keep choice), Pewter museum quiz + off-duty spar, Cerulean stolen bike bell (3 witnesses, talk-or-battle), Vermilion Fan Club notes (harbormaster fallback after the Anne departs — nothing missable), Lavender graves + elder, Celadon roof garden (3 badge-paced visits, never permanently missable), Saffron two-gym message (Dojo spar XP or Sabrina's keepsake IOU, redeemable post-badge, never stranding the badge), Fuchsia warden's lost fishing lure, Cinnabar burned lab notes (canon-safe Mew foreshadow); every tale ends in a lore revelation, states its reward in the Quest Log's new third section, and records its bond delta structurally in story.bonds (Phase 5 reads; no consumers yet). The six Phase 3 stub sources are gone; all 12 keepsakes audited obtainable. Proofs: tests/rejuv-phase4-checks.mjs 53/53 (headless end-to-end for all 10 tales + post-League missability suite + real-browser smoke) |
| Bonds (Rejuvenation P5, ADR-025) | Implemented | The Phase 4 bond substrate is LIVE (src/game/bonds.mjs): hidden score −10..+10 in story.bonds, tier DERIVED never stored (Cold ≤ −4 / Wary −3..+1 / Warm +2..+6 / Close ≥ +7; spec fixes Close, Warm at +2 matches Phase 4's shipped fiction); single-change swing ≤ 2 enforced structurally in applyBond; every source one-shot authored (no grind). New CHOICE POINT primitive ({ choice } runSteps step riding ui.showMenu) at 7 story beats (bridge, St. Anne, tower, Silph, Route 22, champion, New Island) + the tale choices Phase 4 shipped; heart pip (♥▲/♥▼) on the next dialogue nameplate after any change, choices never pre-labelled. Tier-variant dialogue (src/data/dialogue.mjs BOND_DIALOGUE) for 10 characters: Gary's battle intro/lose text by tier (cloned def, text only), Close-only mutual-respect lines gained by the champion scene, 7 gym leaders' post-tale rematch banter (Warm+ backstory / Cold guarded), Mom's send-offs, Hawthorn's dex-rating framing (+ diploma +2 / first rating +1 sources). Rival ledger: each Gary battle's FIRST outcome is recorded once and feeds BOTH the bond (+1/−1) and the ADR-016 Eevee rule — one record, two readers; duo battles feed Rue & Cole together. The Celadon PARLEY (Phase 3's deferred first Second-Wind Ribbon source) is built: post-Anne Rue & Cole in Celadon — Wary− the ambush stays an ambush (duo3 battle), Warm+ (pair's lower tier) opens a parley choice: talk them down for reduced XP (XP Candy), +1 bond each, and the Ribbon; the atelier clerk second source is untouched, so the keepsake's existence is never bond-gated. Gym leaders at Warm+ (tale complete) present a one-shot gift (2 XP Candies) + banter; rematch availability is never bond-gated. Review surface: Quest Log PEOPLE section — tier labels + character notes, the raw score is never displayed. R3 (owner ruling) is structural: battle.mjs / battle-rt.mjs / formulas.mjs contain zero bond references, and Gary's def at bond −10 vs +10 is byte-identical except intro/lose text; a −10-everyone save completes a tale and a gym identically. No save-shape change (story.bonds landed in Phase 4); legacy saves load. Proofs: tests/rejuv-phase5-checks.mjs 55/55 (pure units + headless end-to-end + real-browser smoke); campaign-smoke harness gained menu resolution for the new choice steps (assertions untouched) |
| Second Journey — New Game+ (Rejuvenation P6, ADR-025) | Implemented | Unlocks on the title screen when ANY save slot holds a completed Kanto (own story.hof entry or 'kanto' in regionsDone): a "Second Journey" row appended AFTER Options, so with no completed slot the title menu is byte-identical to before and every counted-press flow is untouched; a ★ marks Continue/the save summary for ngPlus > 0 runs. Creation (src/game/second-journey.mjs + defaultState(inherit)) reads the chosen source slot (guest slot or cloud-cache slots 1–3, picked when several qualify; target slot picked for cloud, the guest build's one shipped slot otherwise) and NEVER writes it — sources are parsed + migrated in memory only. Carries, exactly: (1) dex records as an ARCHIVE (Oak's rating reads it) while honors read the run's OWN catches via dex.runCaught (present only on Second Journey runs — its presence is the discriminator; the diploma and HoF honors cannot trigger from carried records, and the partner's intro grant is the new run's first own catch); (2) the keepsake collection (bag + held pieces) in the pocket from the start — and every world source (tales, hidden items, item balls, the Celadon shop, the HoF gift, the parley) now grants through ONE central path (grantKeepsakeFromSource): an already-owned piece converts to +$2,000 cash with a dialogue line, never a duplicate; (3) Traveler's Memory, derived from the source's own shipped flags/bag/badges (silph_done / reached_saffron / marshbadge → Saffron gate, surfaced as a one-time wave-through line since the shipped game posts no guard; coincase/coin → the Coin Case handed over in the new run's bag; silph_done/cardkey → Card Key route recorded, no door in the shipped game checks it; fossil_taken → fossil choice re-pickable, the one mechanically sealed gate, whose seal now lifts for remembering travelers) — door-keeping only, no beat/battle/badge skipped; (4) starter breadth: lines a completed run chose (gift flags / party-box members / dex records over dex 1–9) are offered as an intro reunion — join at Lv 5 as the new run's own catch, or decline and meet them at their gift events as usual; (5) the bond echo: characters Close (≥ +7) in the source unlock Warm dialogue one tier earlier at Wary and say "You seem familiar. Have we met?" once, on first meeting (presentation only — R3 grep proofs intact, Gary's def identical with/without the echo); (6) meta.ngPlus = source + 1, and prior runs' HoF teams stay viewable in the HoF viewer under a PRIOR JOURNEYS heading. Never carries: levels, party, boxes, money, badges, story progress, items beyond the keepsake collection (+ the Coin Case handover the spec itself names). HoF shape reconciled to ONE canonical shape {team:[{speciesId, level, nickname}], badges} across runEnding, the client schema (normalize-on-load), the server validator (species-table-checked), and the viewer; legacy {species, level} entries are accepted by both validators and normalize on load; inherited teams live in story.priorHof so they can never satisfy the new run's own completion. Schema stays v2 (defaults-fill both sides; tables.json unchanged, gen-tables --check clean). Difficulty is picked exactly as a normal New Game picks it; House Rules are settings and persist untouched. Proofs: tests/rejuv-phase6-checks.mjs 43/43 (pure units + headless end-to-end + real-browser smoke) |

## Yellow exclusives
| Feature | Status | Proof / note |
|---|---|---|
| Pikachu following + mood | Verified | pre-existing (ADR-016) + Thunder Stone refusal (this round) |
| All 3 starters earnable in-world | Verified | campaign data closure (bulbasaur/charmander/squirtle events) |
| RUE & COLE duo encounters | Verified | pre-existing + campaign placements |
| Surfing Pikachu beach minigame | Excluded | ADR-019: no Yellow-parity beach board in scope this round; not silently dropped — recorded here |

## Deliberate exclusions (ADR-018/019)
| Item | Reason |
|---|---|
| Game Boy Printer | Hardware peripheral; no web analogue |
| Physical link cable | Substituted: in-game trades + PC Link Transfer |
| Glitch exploits (MissingNo etc.) | Not reproduced; no save-corruption jokes |
| Spinoff-game systems | Owner ruling: mainline canon only |
| Gen-1 chart bugs (Ghost/Psychic 0×, etc.) | WS8 ruling: modern complete chart is the foundation |
