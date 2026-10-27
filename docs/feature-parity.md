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
| Real-time battle mode (Z-A change order) | Implemented | ADR-020 Model A; fidelity-checks RT functional test; classic engine kept as a switchable fallback |
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
| Difficulty modes + House Rules (Rejuvenation P1, ADR-025) | Implemented | Story/Classic/Challenge wired via rules.mjs (levels/IV/AI/RT cooldowns/XP/catch levers); six House Rule toggles in Options; Candy Coach spar + XP Candy in every Center; Pure Run ribbon on the Save summary; owner's hands-on gate stands. Proofs: tests/rejuv-phase1-checks.mjs 42/42 |

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
