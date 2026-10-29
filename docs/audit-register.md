# Audit Register — Platinum Perfection Pass (2026-10-27)

Mission: **Platinum Perfection + Command Deck** (War Room Protocol). This register
is the permanent record of the screen × control audit and is a regression suite
(harness: `tests/audit-laptop.mjs` at laptop/Mac viewports 1280×720, 1440×900,
1512×982 against the production-CSP local build; `tests/audit-headless.mjs` for
logic-level cases).

## Grading law (owner, standing)

- Every surface grades **MATCH** or **UPGRADE** vs its Pokémon Platinum
  reference (`~/workspace/ashs-journey-qa/platinum-reference/`, comparison only —
  clean-room: nothing from the references ships). Any **DOWNGRADE** is a defect.
- Grades come from **playing the real build** (browser drives + rendered-pixel
  probes), never from computed-style strings alone (UI v2.1–v2.4 lesson,
  `docs/ui-v24-root-cause.md`).
- Every Back/B/Cancel returns to the exact prior screen **with state intact**
  (cursor position, scroll, tab, paging). Every list pages cleanly (arrows,
  Q/E / PgUp/PgDn, hold-to-scroll) with cursor memory. Every action is
  keyboard-reachable; no hover-only interactions. Desktop/laptop is the primary
  surface for this mission; phone must not regress.

## Reference pack

All 36 scenarios present and verified genuine Platinum captures (MANIFEST.md in
the pack folder). Two disclosed caveats: #14 start menu is from the LP's Diamond
side-note (Gen IV menu is pixel-identical across DP/Pt); #19 PC box shows Bebe's
PC Move-Pokémon view rather than the full 30-slot wallpaper grid. Everything
else graded at full confidence.

## Final state (mission close)

build OK (3 targets) · **audit-laptop public 40/40 · personal 5/5 ·
audit-headless 17/17** · verify-slice 133/133 · fidelity 35/35 ·
campaign-smoke 24/24 · qa-changed-flows 19/19 · budgets/drift/contamination
clean · verify-live (local, production CSP) 31/31. Baseline at mission open was
main @ e26ba5f with all suites green; the inventory found **91 screens/states,
307 controls** (full census: `~/workspace/ashs-journey-qa/audit-inventory.md`).

## Register (surface × verdict)

| Screen / surface | Platinum ref | Verdict | Evidence |
|---|---|---|---|
| Title + menu (keyboard, tap rows) | #1, #14 | MATCH | audit-laptop S-01: clicking a non-highlighted row activates THAT row; keyboard flow unchanged |
| Legal card → PRESS START → menu staging | #1 | MATCH | keyboard-only Continue at 3 viewports |
| Trainer ID Terminal (full auth) | — (original surface) | UPGRADE | S-38 typing shield verified in browser; S-49 key-leak fixed; auto-focus on primary action asserted at 3 viewports; ✕ close (S-26); age-gate (S-28); Show/Hide on every password field (S-29) |
| Stub Terminal (guest/personal) | — | UPGRADE | audit-laptop personal 5/5: tabs cycle by keyboard, PLAY AS GUEST starts the game (S-02) |
| Name entry (5 instances) | #3 | MATCH | cancel (Esc + on-screen CANCEL), empty-OK where promised, digits/./'/space added (S-03/04/20/32) |
| Intro (professor) skip/resume | #2 | MATCH | "Keep watching" resumes at the exact line (S-21) |
| Overworld — towns/routes/interiors | #4–#11, #12 | MATCH | unchanged from v2.4.1 live grade; layout fit at 3 viewports; resize + fullscreen clean |
| Pause menu + submenus (launcher) | #14 | MATCH | pause opens every submenu; Backs land with state (below) |
| Pokédex list / entry / areas / filter | #18 | MATCH* | paging (Q/E, PgUp/PgDn, hold-scroll) + cursor visibility + entry round-trip all pass in browser; *list is a text menu where Platinum is graphical — presentation carried from v2.4.1 grade |
| Bag (field) — pockets, item use, Backs | #17 | MATCH | medicine pocket via E; Potion picker; Back restores pocket + cursor (browser-verified) |
| Party + summary | #15, #16 | MATCH | 2-col grid navigation (S-23); Switch/reorder added (S-47) |
| Options | #14 | MATCH | cursor memory across toggles; Legal returns to Options (S-07) |
| PC boxes + Link Transfer | #19 (caveat) | MATCH | 30-slot grid + box paging (verify-live); Link Transfer keyboard-reachable and session-preserving (S-09/S-10) |
| Mart buy/sell | #13 | MATCH | Buy/Sell Back returns to the Mart top menu (S-11) |
| Town Map | #20 | BELOW MATCH (accepted) | real menu of visited places by name (was raw internal ids — C201); still not Platinum's graphical map — feature gap, see below |
| Dialogue | #11 | MATCH | tap on the box advances (S-15); B deliberately does not skip story dialogue (S-46) |
| Battle — classic (wild) full flow | #24–#28 | MATCH | browser: encounter → command grid → Bag (medicine) → picker → Back levels → RUN; S-13 sticky B; S-14 medicine; S-37 picker Back |
| Battle — classic (trainer/gym/legendary/doubles) | #29–#33 | MATCH | same single Platinum presentation (v2.4.1); balls blocked vs trainers (S-43 parity in RT; classic already guarded); campaign-smoke drives gyms/story |
| Battle — real-time (Model A) | #24–#28 | MATCH | headless 17/17: RT bag carries medicine + balls, trainer-ball guard + float message (S-14/S-43); RT clocks tick in menus (v2.4.1) |
| Battle — faint switch | #24 | MATCH | no Back row when forced; B re-opens the switch instead of stranding the battle (S-12, headless-verified) |
| Safari Zone | #27 | MATCH | unspent balls now announced on exit (C241) |
| Save / load / erase | #14 | MATCH | DELETE type-to-confirm is Esc-cancellable (S-32 class); invalid-save Continue toasts (S-31, accepted) |
| HUD strip / objective / mood pip | — | MATCH | inert while any modal layer is up (S-17) |
| Hint card | — | MATCH | any game key dismisses; text now lists the real bindings (S-16) |
| Campaign / gyms / story beats | #29–#36 | MATCH | campaign-smoke 24/24 + verify-slice 133/133 drive the full Kanto arc headlessly; no regressions from the fix waves |

## Defect log

Severity: B = blocker, M = major, m = minor. "Browser" = audit-laptop,
"Headless" = audit-headless, "Suites" = the pre-existing battery.

| ID | Sev | Surface | Defect | Fix | Verified by |
|----|-----|---------|--------|-----|-------------|
| S-01 | M | Title menu | Pointer: any canvas tap injected a global A, activating the *highlighted* row, not the tapped one | render() publishes row hit-geometry; `BootScene.handleTap` hit-tests rows (legal/pressStart stages keep tap-to-open) | Browser |
| S-02 | B | Stub Terminal | Guest/personal builds: terminal tabs + PLAY AS GUEST were pointer-only; game keys were swallowed — keyboard-only players could not start | single activation path (pointer + click + keyboard); ←/→/Q/E cycle tabs, A/Start activates guest | Browser (personal 5/5) |
| S-03/04 | M | Name entry | No cancel anywhere; empty-OK always shook with trainer-name copy — Dex search's "blank = all" unreachable, nickname clearing dead, DELETE confirms inescapable | `showNameEntry(..., {allowCancel, allowEmpty, emptyMsg})`; Esc + on-screen CANCEL → `cb(null)`; callers wired per instance | Suites + source |
| S-05 | M | Dex filter wizard | "All types" carried `value: null` (the cancel sentinel) — choosing it aborted the wizard, discarding the status step | `value: 'all'` → `type: null`, wizard continues | Suites |
| S-07 | m | Options | Re-opened at row 0 after every toggle; Legal row dropped to the overworld | `remember: 'options'`; Legal returns to Options | Browser |
| S-09 | M | PC Link Transfer | Pointer-only inside the PC panel | SELECT (Shift) in the PC panel triggers it; button label shows the binding | Suites + source |
| S-10 | M | PC Link Transfer | Closed the PC first and never returned — even the no-candidates message cost the session | panel stays open underneath; every exit re-renders the PC; `evolveMon` gained an onDone callback | Suites |
| S-11 | M | Mart | Buy/Sell Back dropped the whole Mart flow to the street | both return to the Mart top menu | Suites |
| S-12 | B | Battle (both) | Forced faint switch offered Back and honoured B/Esc, stranding the battle with no command state | no Back row when `inFaint`; cancel re-opens the switch menu | Headless (4 cases) |
| S-13 | m | Battle classic | B at the command grid was a cancel→re-show flicker loop | `stickyCancel` on the root grid; B is swallowed | Browser + Headless |
| S-14 | M | Battle bag | Classic stocked only plain Potion; RT had balls only — owned medicine was unusable in battle | shared medicine helpers on BattleScene; classic `useBattleItem` (Ether move sub-picker; turn consumed like Platinum); RT tabbed bag + instant apply. Rare Candy honestly excluded (no mid-battle evolution flow) | Browser + Headless (7 cases) |
| S-15 | m | Dialogue | Taps on the dialogue box were swallowed (pointer-events on, no listener) | pointerdown on the box advances, same as A | Source + suites |
| S-16 | m | Hint card | Dismiss was pointer-only; hint text listed wrong bindings | any of A/B/Start/Esc/Select dismisses (peek, not consume); text corrected to the real bindings incl. Q/E / PgUp/PgDn paging | Source |
| S-17 | M | HUD | HUD strip buttons + partner mood pip fired openers with modal layers up, replacing the single menu slot mid-dialogue | both handlers early-return while any modal layer is open | Source |
| S-20 | m | Name entry | Charset had no digits, `.`, `'`, or space | grid + typing extended; values still uppercased on OK (lowercase input still not offered — accepted) | Suites |
| S-21 | m | Intro | Skip-intro "Keep watching" restarted the script from line 1 | resumes from the captured dialogue index | Suites |
| S-22 | m | Battle moves | `@media (max-width:560px)` hid `.menugrid .menu-row.wide` — the move menu's Back row vanished for pointer users in small windows | `display:none` rule removed | CSS + suites |
| S-23 | m | Party | 2-col visual grid navigated as a flat list; ←/→ dead | `gridNav` routing (cols=2). ≤560px CSS collapses to 1 col — grid-nav semantics mismatch there, noted (laptop unaffected) | Browser (party flows) |
| S-26 | m | Full Terminal | No visible close (Esc only, undiscoverable) | ✕ button in the terminal header, same guard as Esc (recovery-codes pane still cannot be closed away) | Browser (rendered) |
| S-28 | m | Register | CREATE ACCOUNT lit up without the 13+ age box; refusal only surfaced on submit | submit gating includes the age checkbox | Source |
| S-29 | m | Auth panes | Show/Hide password toggle missing on Recovery, Change Password, Delete Account, register Confirm | shared `addPwToggle` (exact login pattern) wired to all four | Build + suites |
| S-32 | M | DELETE confirms | Type-to-confirm name entries (save erase, account delete) could not be backed out of | `allowCancel` + explanatory empty-message on both | Suites |
| S-33 | m | Dex | "???" rows re-opened the dex at row 0, losing your place | mitigated by `remember: 'dex'` (place restored); rows stay informational by design | Browser (entry round-trip) |
| S-37 | M | Item pickers | Back level-skips: field Ether "Restore which move?" Back exited the whole flow; battle target-picker Back dropped to the command grid | field picker re-enterable (`showTargets()`); battle picker Back returns to the battle Bag | Browser (S-37 case) |
| S-38 | B | Auth forms | The game's keydown `preventDefault`ed mapped keys (A/D/S/W/Z/X, Space) with no form-field shield — those letters were un-typeable in auth fields | keydown/keyup from INPUT/TEXTAREA/SELECT/contentEditable never reach the game | Browser (types `wasd zx` + space) |
| S-42 | m | Dex areas | Area list + detail exits dropped the active dex filter | filter threaded through `openDexAreas(filter)` and all returns | Suites |
| S-43 | M | Battle RT | Ball rows stayed enabled vs trainers; throws weren't guarded | rows disabled vs non-wild; guard floats "A trainer blocks your ball!" (classic parity) | Headless (3 cases) |
| S-47 | M | Party | No party reorder existed anywhere | Platinum's **Switch** row: pick a partner, positions swap, cursor memory preserved | Suites |
| S-49 | B | Title × Terminal | BootScene kept consuming A/Start/nav keys while the Trainer ID Terminal was open — Enter/arrows re-activated the hidden title menu (stacked terminals, cursor moved behind the panel). Only `ui.update` was gated on `loginOpen`; the scene stack was not | BootScene menu stage returns early while `ui.loginOpen` | Browser (stacking reproduced pre-fix, gone post-fix; Continue 3× green) |
| S-50 | B | All long lists | Q/E / PgUp / PgDn paging was dead in every non-bag menu: the menu key chain tested `wasPressed('pageup') && bagTabs` *before* the generic paging branches, and `wasPressed` consumes the edge even when the branch fails — the bag-tab test ate every paging edge (Dex, Party, TM lists…). Same anti-pattern ate battle left/right via the grid tests | guards now run before `wasPressed` throughout the chain (short-circuit order) | Browser (Dex page jump 0→30 rows) |
| C201 | M | Town Map | Was a one-line dialogue of raw internal map ids | real menu screen: visited places by display name, current map marked. Still not Platinum's graphical map — see accepted list | Browser (source + render) |
| C241 | m | Safari | Unspent Safari Balls were zeroed silently on exit | exit dialogue announces the park keeping N unused balls | Source |
| C300 | — | Battle RT | Suspected: A could open the command grid over the catch shakes | **Verified not a defect**: `updateRt` early-returns during the catch sequence before any input handling | Source |

Component-level fixes beneath several rows above (one wave): OS key-repeat
re-fires direction edges (hold-to-scroll); PageUp/PageDown bound (Mac fn+↑/↓);
menus scroll the cursor into view (`scrollIntoView({block:'nearest'})`);
cursor moves do a light 2-row DOM update instead of rebuilding ~1,000 rows;
`remember:` cursor/pocket memory wired for Bag, Party, Dex, Options.

## Accepted / below MATCH — with reasons

- **Town Map is a text menu, not Platinum's graphical map** (feature gap;
  improved from raw ids this pass). Graphical map = art-scope work for a later round.
- **No Hall of Fame / Diploma viewer** though `story.hof` is recorded (S-48, feature gap).
- **No key-remap UI**: `settings.keymap` + `Input.remap` exist but nothing reads/writes
  them (S-18, feature work). "Flip controls" affects touch clusters only (S-19).
- **Mart has no quantity picker** — buy/sell is per-unit with correct Backs (feature gap).
- **Dex entry has no next/prev-entry paging** (S-45 remainder); the list itself pages fully.
- **Pause menu is a launcher** (choosing a submenu consumes it; closing the submenu
  returns to the overworld) — this IS Platinum's Gen IV Start-menu behavior, not a
  menu-stack defect (S-08 closed as designed).
- **RT direct-fire keys 1–4 have no touch equivalent** (S-44): desktop-first mission;
  touch uses the identical command grid.
- **Name entry offers no lowercase** (values are uppercased) (S-20 remainder).
- **SYNC modals are button-only exits** (S-24) and **recovery codes are CONTINUE-only**
  (S-25) — decision-bearing / one-time surfaces, intentional.
- **Account sub-overlay Esc closes both layers** (S-36); **summary A is dead, START/B
  close** (S-40); **learn/forget B takes the give-up branch** with the TM correctly not
  consumed (S-39, copy nit only); **Esc does not skip story dialogue** (S-46);
  **invalid-save Continue is toast-only** (S-31); **PC box cursor clamps** (S-34) and
  **PC click = focus+confirm in one press** (S-35, pointer bonus); **any canvas tap = A**
  outside menus (S-30, established design); **dex filter wizard has no "apply now"**
  (S-41, per-step Back works post-S-05).

## UI Elevation Pass (2026-10-27, after Rejuvenation Phase 5)

Owner order: the Rejuvenation phases shipped systems inside the existing
interface ("the ui is still the same") — this pass owns the face. Census first
(live play, mirror transport, production CSP, HEAD `9679f14`): **36 surfaces —
29 MATCH · 7 below-MATCH · 0 DOWNGRADE** (full inventory + pixel evidence:
`~/workspace/ashs-journey-qa/elevation-inventory.md`; measured baselines:
battle message plate 0.203 of frame vs Platinum ref 22's 0.198; battle plates
389px wide, HP fill 0.779 of plate on both). Build waves B1–B7 + C1–C2,
independent QA re-grade from live play, then coordinator fixes (below).

### Gap dispositions (supersede the matching accepted-gap bullets above)

- **Town Map (was: text menu)** — now a graphical canvas panel: 29-node
  hand-authored Kanto layout (towns as roofed plates, routes as dots, 31
  links), flat token palette (sea `#5a9ae8`, land `#a9c08a`), gated by the
  same `reached_*` flags as the text version, gold current-location node +
  red cursor ring, `.mapnarr` DOM narration for the harness. Canvas ink
  fraction 0.093 where the text menu had 0 map pixels. **MATCH** (QA).
- **Hall of Fame viewer (S-48)** — Journey menu row; ceremony plate (summary
  panel geometry, flat `--gold` trim) reading the real `story.hof` shape
  `{team:[{speciesId, level, nickname}], badges}`, latest first, 44px
  sprites; empty state is a dialogue line. **MATCH** (QA, seeded 2 entries).
- **Diploma viewer (S-48 pair)** — Journey menu row; at 151 Kanto caught it
  shows the plate reusing `checkDiploma`'s exact lines, otherwise a
  "caught N of 151" progress dialogue. The one-time Hawthorn ceremony
  dialogue still fires in-world (seen live in the census). PC flow
  untouched, so verify-live's PC checks stand unmodified. **MATCH** (QA).
- **Key-remap UI (S-18)** — Options → Controls: 17 action rows, next-keydown
  capture, conflict = primary swap, Esc cancels, Reset defaults. Persists
  the complete effective map to `settings.keymap`; applied at boot /
  Continue / cloud login / New Game carry-over. **MATCH** after the QA fix
  below (was STILL-BELOW at QA).
- **Mart quantity picker** — shared stepper on Buy and Sell rows
  (◀ ▶ ±1, ▲ ▼ ±10, Q/E too; cap min(99, affordable) / owned; total shown;
  one transaction per confirm). Preserved exactly: `minBadges` hiding,
  keepsakes stay qty-1 single-press (owned rows disabled), S-11
  return-to-top. **MATCH** (QA headless math 7/7 + live Celadon buy).
- **Dex entry paging** — the entry is now a dedicated plate (summary
  geometry, head band with ◀ ▶ + `No.N`); Left/Right and Q/E page 1..151 in
  place, unseen neighbours redacted exactly as the list renders them, Back
  restores the list row. Paging **wraps** at both ends (QA observation —
  deliberate, Platinum's dex also wraps). audit-laptop's dex-entry checks
  were updated to this treatment (stricter than the old dialogue asserts).
  **MATCH** (QA).
- **Name entry lowercase (S-20 remainder)** — an `aA` grid key toggles case;
  typed case is preserved end-to-end (the blanket uppercase force is gone);
  physical keyboards type their own case. Both type-to-confirm DELETE
  compares are case-insensitive so the safety confirm still works typed
  lowercase (QA live-verified a lowercase "delete" erasing the save).
  **MATCH** (QA).
- **RT direct-fire touch equivalent (S-44 remainder)** — four flat chips
  ("N MoveName", `#2b3040` PT_FRAME interior, 44px targets) in the RT chips'
  bottom zone, shown under exactly the touch-controls visibility rule,
  mirroring cooldown/PP state, hidden under modal layers; taps call the
  keyboard path's own guards into `rtUseMove`. **MATCH** (implementer
  live-verified a tap firing + cooldown flipping; QA verified gating,
  pixels, and the guard chain — QA's own tap drive was defeated by sandbox
  encounter-RNG, recorded here rather than rounded up).
- **C1 menu open transition** — 90ms `steps(3)` plate settle on fresh opens
  only, off under Reduced Motion. **UPGRADE delivered** after the QA fix
  below (was dead code at QA).
- **C2 Quest Log section bands** — the four section headers render as flat
  bands (`#d7e1f2` menu-title token, 38px, display font, non-italic).
  **UPGRADE** (QA pixel-verified).

**Grade distribution after: 34 MATCH · 2 UPGRADE (C1, C2) · 0 below-MATCH ·
0 DOWNGRADE.** Every accepted gap from this register's list that the pass
targeted is closed; the intentional items (S-08, S-24, S-25, S-30, S-31,
S-34, S-46) stand as recorded.

### QA defect log (independent grader, all fixed + re-verified)

- **MAJOR — keymap reload resurrection (B3):** `applyKeymap` overlaid the
  stored map on the factory KEYMAP, so a binding the player moved off its
  old key resurrected after reload (old + new both live). Fix: a stored map
  replaces the factory map wholesale (it is persisted complete); null still
  means factory. Coordinator live probe after the fix: remap A KeyZ→KeyK,
  reload — KeyZ dead, KeyK opens the Bag. Closed.
- **MAJOR — C1 transition dead code:** `renderMenu` added `.menu-open`,
  then its own `className` assignment stripped it; the animation could
  never play. Fix: the className assignment lands before the class add.
  Coordinator probe: fresh pause open carries `menu menu-open`,
  `animation-name: menuopen`, 0.09s. Closed.
- **MINOR — Cinnabar island unfilled** on the Town Map (its `fillRect` sat
  inside a `//` comment). Fixed; island rect now measures land-green
  plurality, sea absent. Closed.
- **MINOR — name-entry CANCEL label overflowed** its wide key at 16px;
  wide keys now use the 14px size already used by the panel title/chips.
  Closed.

### Standing notes from this pass

- **Editions merged (owner order, 2026-10-27):** the personal edition
  (ashs-journey-personal) is retired, frozen at its Phase 5 deploy
  (`9679f14`), not deleted; the public edition (ashs-journey-game) is the
  sole edition going forward. From this pass on, only the public battery
  gates a verdict; personal-edition checks are informational only.
- **qa-changed-flows b2 is a known-stale expectation, deliberately left

- **qa-changed-flows b2 is a known-stale expectation, deliberately left
  failing:** it expects a 30-row Journey menu; the true count was already
  32 before this pass and is 34 now (+ Hall of Fame, + Diploma, by design).
  The failure set stays exactly {b2, d9} per the mission gate; correcting
  the expectation to 34 is a one-line owner/coordinator call, recorded here
  so it is never mistaken for a regression.
- audit-laptop's fixed-sleep drives cascade under sandbox load (observed
  load >10 with stray Chromium instances): run it serially on a quiet
  machine; a cascade that starts at "Dex opens from the pause menu" with
  everything downstream failing is the known signature, proven twice this
  pass by clean re-runs (public 41/41, personal 5/5).

## Rejuvenation Phase 6 — Second Journey (2026-10-27, after the UI Elevation Pass)

ADR-025 §6 shipped: New Game+ (implementer pass; independent QA pending).
New surface: the title's **Second Journey** row + the creation flow
(source picker → target picker → the standard intro), the intro's
starter-reunion offer, the HoF viewer's PRIOR JOURNEYS section, and the
★ ribbon marker on Continue / the Save summary for ngPlus > 0 runs.

- **Title-menu safety (the load-bearing decision):** the row is appended
  AFTER Options and exists only when a completed save is present. With
  no completed slot the menu items are byte-identical to pre-Phase-6
  (proven in tests/rejuv-phase6-checks.mjs B01/B02 + C01), so
  verify-live's and audit-laptop's counted presses (Down once → the
  Continue row) are untouched in every state they drive. One flagged
  expectation for the next production verify-live: on a device whose
  save has COMPLETED Kanto, the title legitimately shows a 4th row —
  any future gate that counts total title rows must expect 4 there,
  3 elsewhere (and 2 with no save at all). No existing gate counts
  title rows today; nothing was adapted silently.
- **Battery at ship:** rejuv phases 44/42/63/53/55 + phase6 **43/43** ·
  fidelity 35/35 · campaign 24/24 · headless 17/17 · verify-slice 48/48
  · qa-slice 134/134 · audit-laptop public **41/41** · validator test
  45/45 · validator fuzz 2000/2000 · save-contract 6/6 · Track B
  **114/114** · qa-changed-flows failure set exactly the standing
  baseline **{b2, d9}** · gen-tables --check clean (tables.json
  unchanged — the HoF reconciliation needed no table regeneration;
  the validator's HoF check is hand-rolled code, now canonical).
- **HoF shape reconciliation:** pre-Phase-6, runEnding pushed
  `{team, badges}` while the server validator demanded `{species,
  level}` — a real completed save would have failed cloud validation.
  One canonical shape now (validator species-checks team entries);
  the legacy shape is accepted by both validators and normalized on
  client load. Inherited teams live in `story.priorHof`, never in the
  new run's `story.hof`, so inherited entries cannot satisfy the new
  run's completion (or a further Second Journey unlock chain — they
  DO carry forward as viewable history).
- Track B invocation note (pre-existing, not a Phase 6 defect): the
  gate must run as its header documents — `node --import
  ./register.mjs run.mjs` from tests/; the bare `npm test` script in
  this checkout omits the register import, so pg.Pool is never stubbed
  and suite 02 dies with ECONNREFUSED ::1:5432. With the documented
  invocation: 114/114.

## Harness notes (so the next seat doesn't re-learn them)

- CDP `Fetch.fulfillRequest` MUST be sent on the session that paused the request
  (flatten mode); a browser-level send is silently dropped and the renderer wedges.
- This sandbox Chromium never runs native Enter-activation for CDP key events
  (proven on a minimal page) — DOM buttons are activated by coordinate clicks in
  the harness; keyboard claims for DOM overlays rest on focus + handler evidence.
  Game-canvas keys are unaffected (the game's own input layer).
- Menu-row `textContent` carries the `▶` cursor glyph — probes must strip it.
- Route 1 is SOUTH of this Pallet Town; the border warps sit one tile apart and
  a buffered Down-step can bounce the player back — the battle drive settles,
  re-checks the location chip, and retries the crossing.

## World Art Wave 0 — Foundations (2026-10-27)

Implementer pass for the world-art elevation (census:
`ashs-journey-qa/world-art-census.md` §3 style spec + §4 Wave 0).
Presentation/foundation work only — no game state or balance change.
Nothing deployed; the public battery below is the gate.

### 1. Regeneration hazard CLOSED
- `npc-pc-idle-1/2` now have real `.pix` sources
  (`assets/sprites/pix/npcs/npc-pc-idle-*.pix`), extracted verbatim
  (rows + palette) from the shipped `art-data.mjs`.
- Baseline before the change: **163 ART keys**. Clean-tree
  `node assets/sprites/tools/build-art.mjs` after: **163 keys, zero
  lost, zero added**. Both PC keys are **pixel-identical** to the
  shipped entries (raster hashes under the runtime's own raster rule:
  idle-1 `4ba87481…`, idle-2 `d23916a7…`, match before/after).
- One shipped defect preserved deliberately: idle-2's rows paint two
  pixels with key `G`, which the shipped palette never declared — the
  runtime falls back to `#ff00ff` for undeclared keys, so those pixels
  have always rendered magenta. The `.pix` declares `G #ff00ff` so
  regeneration is pixel-identical; recoloring it is a future art
  decision, not a Wave 0 accident. (Visible in captures as the PC
  frame-2 screen pixels, exactly as at HEAD.)
- Determinism: two consecutive build-art runs produce byte-identical
  `art-data.mjs` + `dist/` atlases. The npcs atlas now legitimately
  includes the PC pair (16 sprites).

### 2. Art contracts raised (deliberately)
- Per-sprite palette cap **12 → 32**, in both enforcement points:
  `pix.mjs:63` (declared palette) and `build-art.mjs:59` (painted
  hexes). Verified: a 20-color test sprite builds; a 33-color sprite
  fails (`palette cap violated: 33 > 32`).
- Tileset-wide 16-color cap **replaced** by a per-family budget
  (`build-art.mjs` `FAMILY_PALETTE_BUDGETS`): the **tiles family union
  ≤ 48**; failure message `tiles family palette cap: N > 48
  (per-family budget for the tiles family)` (verified at N=51).
  `palette-audit.mjs` mirrors both numbers. Outline, inner-margin,
  orphan and painted checks unchanged.
- `assets/sprites/README.md` contracts corrected (caps, full family
  list with true counts — portraits/keyart/battle included, species
  41, ui 15, npcs 16 — and the stale wiring handoff).

### 3. Size standard — engine
- Characters: `Renderer.blitCharacter` (`src/engine/render.mjs:144`)
  draws a character scaled to its 1-tile footprint, bottom-anchored,
  taller art overhanging upward. Overworld call sites:
  `overworld.mjs:575` (NPCs — legacy feet line tileY+12 preserved, i.e.
  the old −4 offset is now the anchor, not a draw offset),
  `:589` (partner, hop lifts the anchor), `:590` (player). For the
  current 16×16 art every draw lands at the same position at native
  size — pixel-identical (unit-verified: 16×16 at bottom 48 draws
  [32,32,16,16]; a 16×32 draws [32,16,16,32]).
- Battlers: `BATTLER_DRAW_SIZE = 64` (`render.mjs:13`), carried on
  every battle-art entry's `size` (`art.mjs` `speciesBattleArt`, hand
  and forge paths alike). Classic engine (`battle.mjs:1868`): one
  draw path, size derived from the side's art entry, anchored on the
  legacy frame's center-x + bottom edge so platforms/plates do not
  move; attack (1.2×, derived) and faint use the same size. RT engine
  (`battle-rt.mjs:810-816`): both sides centered on their arena
  position at their entry size. **This is the one intentional visual
  change in Wave 0: battlers render at 64px (legacy 32px art upscaled
  ×2) with foe/ally parity** — recording-ctx proof on the built
  bundle: classic foe [151,6,64,64] / ally [28,85,64,64]; RT foe and
  ally both 64×64; forge-fallback foe also 64×64.

### 4. Selection wiring
- **Explicit `art` field** on NPC instances: 202 source entries across
  `src/data/maps*.mjs` + `src/game/bonds.mjs` (PARLEY pair) and all 10
  `TALE_NPCS` in `src/data/quests.mjs` now carry `art: '<kind>'`.
  Merged population: **125 of 127 map NPCs carry the field**; the two
  exceptions are deliberate (below). `npcArtKind` (`art.mjs:103`)
  resolves: `pc` flag → `art` field → legacy name map (last resort,
  now also containing CHAMPION/SPARRING COACH) → youngster.
  The known misses are fixed in data: **CHAMPION carries
  `art: 'rival'`** (Gary's champion art), **SPARRING COACH carries
  `art: 'coach'`** in both center definitions.
- **CUBONE / MAROWAK SPIRIT carry NO art field, deliberately** (a
  comment at their `maps3.mjs` entries records this): they are
  Pokémon, not people, but no overworld species art exists to route
  them to — the species family is battle front/back pairs, cubone and
  marowak have neither, their NPC data carries only human palette
  fields (no species reference), and the battle fallback is a 48px
  forge canvas that cannot stand in a 16px NPC slot. They remain on
  the youngster placeholder until a wave authors overworld species
  sprites. Inventing a substitute in a foundations wave would have
  been a silent visual change.
- **Palette-swap rasterization** (`art.mjs` `NPC_SWAP_KEYS` +
  `npcSwapFor`, `artCanvas` swap parameter): each NPC kind's primary
  palette keys (skin/hair/shirt/pants) remap from the instance's data
  palette at raster time; authored secondary shades (cap, glasses,
  vest-dark, uniform accent) stay authored as kind identity; an
  instance with no palette data gets the authored colors unchanged.
  The nurse sprite's legs were split onto their own key `T` in its
  `.pix` sources (same hex the hair key `P` always had — default
  pixels unchanged) so hair and pants remap independently.
  `Game.npcFrame`'s cache key (`main.mjs:164`) now carries art kind +
  instance palette, not the name alone, so same-name NPCs with
  different palettes no longer share frames.
- Capture evidence (census driver re-run against this build, diffed
  against the census shots): every differing pixel in the canonical
  Pallet / Viridian / Center-interior captures is an NPC palette
  remap (e.g. Gary #d83a34→#3a5a9a shirt, #f0d060→#6a4a2a hair; nurse
  hair #f0a0b0→#e86a5a with legs unchanged at the data pants hex) or
  an idle-animation phase difference (blink / PC shimmer / partner
  hop — transitions between authored colors only). The gym-interior
  Brock capture is byte-identical (Brock's data palette equals his
  authored sprite). No tile, building, player-palette or UI pixel
  moved. A whole-capture color audit found no new color that is not
  an NPC data palette hex, an authored color, or the PC frame-2
  palette (plus ≤23px of DOM text antialiasing in the mart menu shot).

### 5. Bundle budget projection (decision)
Full table in `assets/sprites/README.md` ("Bundle budget
projection"). Headline: projected full-redraw `art-data.mjs`
≈ **2,542,105 bytes** (304 battlers at 64×64 + 152 derived bobs +
~120 characters at 16×32 + ~60 tiles + ~40 architecture + ~65 props
+ 15 arenas + retained portraits/keyart/ui), projected
`public/game.js` ≈ **3,742,979 bytes = 29.7%** of the 12,582,912
hard gate (headroom ≈8,839,933). Per-wave segment budgets: W1 40,000
· W2 35,000 · W3 140,000 · W4 20,000 · W5 45,000 · W6 2,650,000;
internal ceiling art-data ≤ 3.0 MB / any bundle ≤ 4.2 MB.
**Decision: inline art-data STAYS — no runtime data-file loading
needed.** Sensitivity (+8 colors on every battler/bob ≈ +59,000;
architecture at full 32×32 ≈ +30,000) does not move the conclusion.

### 6. Battery at this commit (public battery)
rejuv-phase1 **44/44** · phase2 **42/42** · phase3 **63/63** ·
phase4 **53/53** · phase5 **55/55** · phase6 **46/46** · fidelity
**35/35** · campaign-smoke **24/24** · audit-headless **17/17** ·
audit-laptop public **41/41** · verify-slice **48/48** · qa-slice
**134/134** · validator test **51/51** · validator fuzz **2000/2000**
· save-contract **6/6** · Track B **114/114** (documented invocation
`node --import ./register.mjs run.mjs` from tests/) · budgets-check
**all gates pass** · contamination **clean** · qa-changed-flows
**55/57, failures exactly the standing baseline {b2, d9}** ·
drift-gate: guest ≡ strip(vercel) PASS, and the full three-edition
check PASS as run during the battery.

### Standing notes from this pass
- **personal/ is byte-identical to HEAD in this commit** (retired
  edition). Two build paths touch it and were reverted after use:
  the explicit-target build (`--target=vercel --target=guest`) does
  not touch it, but verify-slice's harness execs a full
  `scripts/build.mjs` (all targets) — personal/ was restored from
  HEAD afterwards, and `dist/content-hash.txt`'s personal line was
  restored to the HEAD value (the frozen edition's record). With
  personal frozen, drift-gate's personal-divergence line fires by
  design (guest+marker built from current source ≠ the frozen
  bundle) — per the Phase 6 precedent, personal-edition checks are
  informational only; the public battery gates.
- **Verify-live expectation impact: none.** Nothing was deployed;
  production still serves the Phase 6 build. When Wave 0 is deployed,
  the only production-visible differences will be NPC palette colors
  and battlers at 64px parity — no counted title/menu rows, flows or
  strings changed, so no verify-live expectation needs adapting.

## World Art Wave 1 — The Ground Itself (terrain system) (2026-10-27)

Implementer pass for the world-art elevation (census:
`ashs-journey-qa/world-art-census.md` §3 terrain rows + §4 Wave 1).
Presentation only — no game state, balance, or map-data change; no map
layout was edited. Nothing deployed.

### 1. Tiles authored — 13 → 55 tile kinds (+42 new .pix sources, 8 redrawn)

All sources in `assets/sprites/pix/tiles/`, all original, cluster/blade
construction (no flat fills, no single-pixel speckle — the pipeline's
orphan rule passes by construction).

- **Redrawn (8):** `tile-grass` (textured base, 6 colors), `tile-path`
  (worn, 4 tones), `tile-flower` (grass-island cluster, transparent
  surround), `tile-water-1/2` (5 blues, layered waves), `tile-tree`,
  `tile-rock`, `tile-sign` (object pixels unchanged in kind; baked grass
  background replaced by transparency so the resolver lays them over
  the ground they stand on — this kills the grass-square-on-sand
  artifact, incl. gym rocks; the sign board also gained a dark outline
  so it reads against path and grass alike).
- **Untouched (5, Wave 2 architecture):** `tile-house`, `tile-door`,
  `tile-gymwall`, `tile-gymdoor`, `tile-centerdoor`.
- **New (42):** grass bases `tile-grass-2..6` (6 ground variants total);
  tall grass `tile-tallgrass-1..4`; path `tile-path-2..3` (3 variants
  total); `tile-flower-2`; water frame `tile-water-3` (animation 2 → 3
  frames); shore `tile-shore-n/e/s/w`; foam `tile-foam-1..3`; grass→path
  dirt edges `tile-edge-dirt-n/e/s/w` + corners `tile-edge-dirt-ne/nw/
  se/sw`; path→grass fringe `tile-edge-grass-n/e/s/w`; path→water wet
  edges `tile-edge-wet-n/e/s/w`; grass→tallgrass tuft fringe
  `tile-fringe-tall-n/e/s/w`; ground detail `tile-detail-pebbles`,
  `tile-detail-dirt`. Transition/overlay tiles: **27** (≥24 required).

### 2. Mechanism — how all 56 maps inherit with zero map edits

`src/engine/art.mjs`: `hashTile` (:192, deterministic position hash),
`isTallGrass` (:207 — a `,` cell is tufted tall grass or plain base
grass by one hash rule, 78/22), `buildArtTileCache` (:209 — variant
arrays, overlay sets, 3-frame water + foam), `resolveTileLayers`
(:270 — the neighbour-aware composer). `src/game/main.mjs:89`
`Game.tileLayers` delegates with the shared `_animT` clock (water and
foam frames stay in sync with `tileSprite`'s 600 ms step);
`src/game/overworld.mjs:557` draws the layer stack per cell. Rules:

- **Variants:** position-hash selection (salt per family) — the same
  position renders the same variant on every frame and reload
  (verified: Route 1 resolved 50× per cell, stacks identical).
- **Auto-tiling:** transitions are chosen from the four neighbour
  KINDS at draw time. Grass cells draw dirt edges/corners toward path;
  path cells draw grass fringe toward grassy neighbours (hash-gated to
  ~70% of cells so the spill reads as growth, not stitching) and wet
  edges toward water; water cells draw a shore overlay toward ANY
  non-water, non-void neighbour plus the animated foam frame on shore
  cells; base-grass cells draw tuft fringe toward tall-grass
  neighbours; object tiles (tree/rock/sign/flower) are drawn over a
  ground variant matching the ground they stand on (south neighbour's
  family, else neighbour majority).
- Legacy single-tile callers keep working: `tileSprite` now cycles
  water over 3 frames; `cache.grass` is a tufted tile (the encounter
  rustle overlay); boulders (`tileSprite('rock')`) draw their
  transparent-surround rock over the already-rendered ground.

### 3. Terrain pairs — enumerated from the merged 56-map data, all covered

Self-check (real resolver run over every cell of all 56 maps):
**4,447 / 4,447 terrain boundaries covered (100%)**; zero non-void
cells resolve to an empty stack. Pair counts (undirected adjacencies):
path↔tree 2,582 · grass↔path 632 · path↔rock 494 · path↔sign 220 ·
path↔water 183 · flower↔path 161 · grass↔tree 130 · tree↔water 31 ·
sign↔tree 10 · grass↔sign 2 · grass↔rock 2 · grass↔tallgrass
(variant-level, same map char — covered by the tuft fringe). Two
honest notes: **grass↔water never occurs** in the current map data
(0 adjacencies) — it is covered by construction, since the shore set
fires for any land neighbour (proven live by tree↔water and
path↔water); **575 boundaries involve architecture kinds**
(house/door/gymwall/gymdoor/centerdoor ↔ ground) and are Wave 2's
scope, excluded from the terrain denominator — the floor↔wall
boundary indoors is terrain-covered (the tree-tile wall ring now
stands on the floor's ground variant, not on baked grass), while wall
identity itself is Wave 5.

### 4. Palette + shading (measured from ART data)

- Tiles-family union: **33 colors vs the 48 budget** (Wave 0) — no
  budget raise needed. Total tiles union before: 16.
- Shading steps: grass base tiles 6 colors each (≥4 greens, cluster
  texture); tall-grass tiles 8–10 colors each on a 5-step tuft ramp
  (deep/shadow/dark/mid/light/highlight/pale across the set, incl. the
  canopy greens shared with the tree tile); water **5 blues**
  (#1d4a86, #2e63b0, #3a7bd5, #5a9ae8, #6fb0ee) + foam white — 4+
  steps as required; path set 5 tones (base/dark/worn/pale/edge).

### 5. Before/after measurements (stated method)

Method: logical raster — every map rendered tile-only in Node through
the REAL resolver + ART data (fake rasterizing canvas), unique colors
counted over the map's own pixels. Before = HEAD art + single-tile
rendering, same method. (The census's 327/603 figures are full
1440×900 screenshots incl. NPCs/HUD/scaling — a different method; the
§3 end-state yardsticks Pallet ≥900 / routes ≥1,200 are whole-mission
targets across all waves, not Wave 1's.)

- Scene color depth (tiles only): **Pallet 13 → 22 · Route 1 11 → 22 ·
  Route 20 12 → 27.**
- Tall-grass patch (union over all `,` cells of Route 1): **3 → 15
  unique colors** (census screenshot method measured 5 before). The
  Wave 1 yardstick of ≥25 is **NOT met under this stricter logical
  method** — flagged, not rounded: a pure-grass region can only carry
  the grass ramp (15 hexes incl. dirt-edge browns at patch borders).
  QA's capture-crop method counts neighbouring terrains and will land
  higher; the honest logical figure is 15.
- Water: 2 → **3 distinct animation frames** (t = 0/600/1200 ms);
  Route 20: 26 shore cells, all 26 carrying the animated foam layer.
- Transition coverage: **0 tiles → 100%** of terrain boundaries
  (self-check above; QA re-grades from live captures).

### 6. Budgets + regeneration

- ART keys **163 → 205, zero lost**; tiles family 13 → 55.
- `art-data.mjs` 162,117 → 184,030 B = **+21,913 B vs the 40,000 B
  Wave 1 budget**; `public/game.js` 1,373,875 → 1,404,586 B.
- build-art run twice = byte-identical `art-data.mjs` + atlases.

### 7. Battery at this commit (public battery)

rejuv-phase1 **44/44** · phase2 **42/42** · phase3 **63/63** · phase4
**53/53** · phase5 **55/55** · phase6 **46/46** · fidelity **35/35** ·
campaign-smoke **24/24** · audit-headless **17/17** · audit-laptop
public **41/41** · verify-slice **48/48** · qa-slice **134/134** ·
validator test **51/51** · validator fuzz **2000/2000** ·
save-contract **6/6** · Track B **114/114** · budgets-check **all
gates pass** · contamination **clean** · drift-gate guest ≡
strip(vercel) PASS · qa-changed-flows **55/57, failures exactly the
standing baseline {b2, d9}**.

### Standing notes from this pass

- **personal/ is byte-identical to HEAD in this commit** (retired
  edition): the battery's full builds touched it; it was restored from
  HEAD afterwards and `dist/content-hash.txt`'s personal line restored
  to the HEAD value, per the Wave 0 precedent.
- Verify-live expectation impact: none (nothing deployed). When Wave 1
  is deployed, the visible differences are the terrain system itself —
  no strings, flows, menus or counts changed.

## World Art Wave 2 — Buildings & Towns (architecture set) (2026-10-28)

Implementer pass for the world-art elevation (census:
`ashs-journey-qa/world-art-census.md` §3 buildings + decoration-density
+ map-presence rows, §4 Wave 2, §5 risk 9). Layout + art only — no
balance, story, or mechanics change. Nothing deployed.

### 1. Pieces authored — 47 new `.pix` tiles (tiles family 55 → 102)

All original, 16×16, in `assets/sprites/pix/tiles/`. Roofs ≥3 shading
steps (ridge highlight / mid / shadow-side + eave trim), walls ≥3 steps
+ trim, framed windows (lit + unlit), recessed doors with step.

- **Roofs (17):** terracotta `tile-roof-terra-l/m/r` +
  `tile-roof-terra-chimney`; slate `tile-roof-slate-l/m/r`; teal
  `tile-roof-teal-l/m/r`; Center red `tile-roof-center-l/m/r`;
  per-type signs on the roof fascia — `tile-sign-center` (white panel,
  original plus-in-circle glyph), `tile-sign-gym` (stone panel,
  original diamond glyph), `tile-sign-mart` (blue panel, original
  shopping-bag glyph), `tile-sign-lab` (metal panel, original flask
  glyph). No copied logos or text art.
- **Facades (26):** plaster house `tile-wall-house-lit`,
  `tile-wall-house-unlit`, `tile-door-house`, `tile-wall-house-plain`;
  wood house `tile-wall-wood-lit`, `tile-door-wood-facade`; brick
  `tile-wall-brick-lit`, `tile-door-brick`, `tile-wall-brick-plain`;
  Center `tile-wall-center`, `tile-door-center-l/r` (glass double
  door); Mart `tile-wall-mart` (striped awning + goods window),
  `tile-door-mart-l/r`; Gym `tile-wall-gym` (stone pillars, slit
  window), `tile-door-gym-l/r`; Lab `tile-wall-lab`,
  `tile-wall-lab-plain`, `tile-door-lab-l/r`, `tile-door-lab-facade`;
  generic wooden double doors `tile-door-wood-l/r` (dojo / mansion /
  safari gate / tower-class entrances); entrance `tile-step`.
- **Dressing + shadow (4):** `tile-fence`, `tile-lamp`,
  `tile-flowerbed` (transparent-surround objects, ground laid beneath
  by the resolver, Wave 1 pattern), `tile-shadow` (ground-shadow strip
  the resolver lays on every ground cell directly south of a building,
  anchoring every structure).
- The 5 legacy architecture tiles (`tile-house/door/gymwall/gymdoor/
  centerdoor`) keep their ART keys and remain in use in interiors
  (Wave 5 scope); towns no longer stamp them.
- Wiring: new map chars in `src/engine/tiles.mjs` `TILE_CHARS`;
  `TILE_ART` + `isArchKind` + shadow/object handling in
  `src/engine/art.mjs` `resolveTileLayers`; door halves + steps added
  to `WALKABLE` in `src/data/maps.mjs` (they are step-warp/threshold
  tiles exactly like legacy D/E/C).

### 2. Map-data pass — all 10 towns + Indigo Plateau (11 settlements)

Every building footprint rebuilt from the set: footprints 3×2 to 6×3
tiles, visual height 2–3 tiles, **exactly one roof and one door per
building** (door halves L/R compose a single double door; house doors
are single recessed facades). Distinct exteriors: Pokémon Center
(red roof + plus sign + white/red facade — unmistakable), Mart/Dept.
Store (Celadon Game Corner block: bag sign + awning), Gym (slate roof
+ diamond sign + stone pillars), Lab (Silph Co. + Cinnabar Lab: flask
sign + metal panels), and 3 house styles (plaster / wood / brick)
rotated per town with per-town roof colorways (terracotta, slate,
teal) so towns no longer share one template. Town dressing added with
fence / lamp / flowerbed pieces (see §4 for densities).

- **No town's bounds were extended.** Every footprint fits inside the
  existing rows; two footprints were shrunk/shifted to preserve the
  original 1-tile gaps between distinct buildings (Viridian Gym
  3-wide, Pewter east house shifted one tile east).
- Per-town summary — Pallet: 2 plaster houses (one with chimney),
  Mom stands at the left house's door. Viridian: 3-wide Gym (locked-
  door event tile untouched), Center, plaster house. Pewter: 3-row
  Gym with entrance steps (interior returns land beside the steps,
  as authored), 2 brick houses. Cerulean: wood house, 3-wide Gym
  (west expansion refused — the Bill event tile at (12,2) keeps its
  ground), Center. Vermilion: wood house, 3-wide Gym (Chairman's
  tile (13,2) kept clear), Center, south dock house completed to
  2 rows. Celadon: plaster house ×2 + NE house, Gym (its coordinate
  text sign kept at (6,3)), Center, Mart-fronted Dept./Game Corner
  block, south house (Elias's tile (5,10) is ground again — he stood
  on a house tile at HEAD). Saffron: Silph Co. as Lab (6-wide, flask
  sign), Dojo as a wood building, Gym, Center. Lavender: plaster
  house, Pokémon Tower as a stone signed building, Center. Fuchsia:
  wood house, Gym, Center, Safari gate as a wood building. Cinnabar:
  brick house (chimney), Gym, Center, Mansion (brick + wood doors),
  Lab (flask sign, facade door). Indigo: plaster house, League as a
  signed stone building, Center.

### 3. Warp safety (§5.9) — how warps bind, and the one flagged move

Warps are **coordinate-keyed** (`warps[] {x, y, to}` looked up by
player position in `overworld.mjs warpAt`); they are not tile-keyed,
and no warp's destination or arrival semantics changed anywhere.
Audit (data-driven, before/after snapshots of all 56 maps):
non-town rows + warps byte-identical; per-map warp-destination
multisets identical; signs / NPCs / events / hidden items / items /
starts identical in all 56 maps; BFS reachability from every warp
landing, via-return, start, and border opening reaches every warp
trigger **[CORRECTED by the fix pass below: seeding via-return
landings made this BFS circular for exactly the Center-door case
and the claim was wrong for Fuchsia + Cinnabar; the corrected
audit and its results are recorded there]**, and every NPC and
coordinate sign keeps a reachable adjacent
cell; injected actors (10 TALE_NPCS + Celadon parley pair) all stand
on plain floor (one lamp was moved off the parley tile at Celadon
(9,8) — phase5 A28 caught it, now 55/55).

- **FLAGGED — Center door triggers moved one tile south, in every
  Center town (18 effective warp entries — 9 Center towns × 2 door
  halves; corrected by the fix pass below: the original "32" counted
  every duplicated/shadowed definition in the source files —
  maps.mjs 2 + maps2 18 + maps3 12 — of which only the merged 18
  are live):**
  at HEAD the Center's step-warp sat on the building's NORTH row
  (every other building in the game warps from its south row, and
  every Center `via` return already lands one tile south of the
  south row). The trigger now sits on the facade row's glass doors
  (same x, y+1, same destination `center (4|5,4)`, same via return —
  the return tile is now exactly the door-front tile). This is the
  only warp-coordinate change in the wave; destinations, counts, and
  arrival semantics are provably identical (audit above +
  campaign-smoke 24/24 + fidelity warp-graph 35/35).
- Live-drive evidence: campaign-smoke (24/24) and audit-laptop
  (41/41) drive the shipped bundle through towns, Centers, and gyms;
  the data-driven warp-graph proof covers every enterable building in
  every town (in + out, all destinations).

### 4. Density + door/roof audits (measured)

- **Decoration density** (decor tiles F/S/fence/lamp/flowerbed vs
  interior ground tiles, per town): Pallet 1 per 6.9 · Viridian 5.2 ·
  Pewter 5.1 · Cerulean 7.1 · Vermilion 7.2 · Celadon 6.8 · Saffron
  6.1 · Lavender 7.8 · Fuchsia 7.9 · Cinnabar 7.5 · Indigo 5.7 ground
  tiles — every town inside the §3 target of ≥1 per ~8.
- **Door/roof audit** (4-connectivity building clusters in all 11
  settlements): every building has **exactly 1 door group**; every
  typed building (Center / Gym / Mart / Lab / Silph / Tower / League)
  has **exactly 1 sign tile**; houses have exactly 1 door facade.
- **Scene color depth** (QA re-specified method: tiles-only logical
  raster through the real resolver + ART): Pallet **22 → 33**
  (post-Wave-1 → now); Viridian 40 · Pewter 31 · Cerulean 40 ·
  Vermilion 35 · Celadon 41 · Saffron 39 · Lavender 36 · Fuchsia 41 ·
  Cinnabar 40 · Indigo 36 unique colors. Zero non-void cells resolve
  to an empty layer stack in any settlement.

### 5. Palette + bytes

- Tiles-family palette union: **48 / 48 — at the Wave 0 budget, no
  raise taken** (15 new hexes planned; two planned hexes were remapped
  onto existing union colors to fit: center-roof light → flower pink
  `#e86a8a`, fence rail → `#a8845c`).
- ART keys **205 → 252, zero lost**; build-art twice = byte-identical
  `art-data.mjs` + atlases.
- `art-data.mjs` 184,030 → 208,902 B = **+24,872 B vs the 35,000 B
  Wave 2 budget**; `public/game.js` 1,404,586 → 1,433,590 B.
  Map-data growth reported separately: maps files +306 B total
  (char-for-char row rewrites; the delta is the WALKABLE comment).

### 6. Battery at this commit (public battery)

rejuv-phase1 **44/44** · phase2 **42/42** · phase3 **63/63** · phase4
**53/53** · phase5 **55/55** · phase6 **46/46** · fidelity **35/35** ·
campaign-smoke **24/24** · audit-headless **17/17** · audit-laptop
public **41/41** · verify-slice **48/48** · qa-slice **134/134** ·
validator test **51/51** · validator fuzz **2000/2000** ·
save-contract **6/6** · Track B **114/114** · budgets-check **all
gates pass** · contamination **clean** · drift-gate guest ≡
strip(vercel) PASS · qa-changed-flows failures exactly the standing
baseline **{b2, d9}**.

### Standing notes from this pass

- **personal/ is byte-identical to HEAD in this commit** (retired
  edition): restored after the battery's full builds, and
  `dist/content-hash.txt`'s personal line restored to the HEAD value,
  per the Wave 0/1 precedent.
- **Pre-existing quirks found (NOT changed, identical at HEAD):**
  several coordinate signs do not sit on `S` tiles (Pallet lab,
  Celadon mart, Saffron gym, Routes 5/16, Mansion rocks) — sign
  interaction is coordinate-keyed and works regardless; Victory Road
  has a warp entry on a `#` tile at (17,5). Both predate this wave
  and are outside its scope.
- Verify-live expectation impact: none (nothing deployed). When
  Wave 2 is deployed, the visible differences are the towns
  themselves — no strings, flows, menus, or counts changed.

## World Art Wave 2 — Fix Pass (warp integrity) (2026-10-28)

Independent QA **FAILED** Wave 2 §5 (warp integrity; art passed):
live drives proved the Fuchsia and Cinnabar Pokémon Centers
**unreachable on foot**. This pass fixes that defect, corrects the
§3 record, and re-proves reachability with a non-circular audit.
Map-data only — no `src/game` / `src/engine` change. Nothing
deployed.

### The defect

Both towns place another building's roof 2 rows south of the
Center facade, leaving a 1-row door-front pocket at (7–8, 8).
Wave 2 dressing placed lamps (`o`, non-walkable) on both pocket
mouths, (6,8) and (9,8), sealing the pocket: the Center door
triggers (7,7)/(8,7) could only be reached from inside the pocket
itself. At a132397 that row was open ground. QA evidence:
`ashs-journey-qa/wave2-qa-shots/` (08b/09/10b drives — a player
spawned in the pocket can leave only by entering the Center; a
player outside cannot get in).

### Root cause — the circular BFS (standing lesson)

The Wave 2 §3 audit seeded its BFS from "every warp landing,
via-return, start, and border opening". A Center's `via` return
lands exactly on its door-front tile — the pocket. Seeding from
the via-return therefore assumed the very reachability the audit
was meant to prove, for exactly the case that was broken. **Never
seed a reachability proof from a return landing, or from the
trigger's own pocket: a return is evidence you once got in, not
proof you still can.**

### Remedy (dressing relocation only)

In Fuchsia and Cinnabar (both duplicated defs, `maps2.mjs` +
`maps3.mjs`; 8 row strings total, char-for-char, byte-flat):

- Row 8: lamps removed from the pocket mouths — (6,8) `o`→`.` and
  (9,8) `o`→`.` in both towns (Fuchsia row 8 `#.pFF.o..o.FFp...#`
  → `#.pFF......FFp...#`; Cinnabar `#.pFF.o..o.FF.p..#` →
  `#.pFF......FF.p..#`).
- Row 7: the same two lamps relocated to the Center facade's
  flanks — `.`→`o` at (5,7) and (10,7), row 7 `#.....AJKA.......#`
  → `#....oAJKAo......#` in both towns. This is the template's own
  precedent: Indigo already flanks its Center facade exactly this
  way. The tiles are plain street ground — no warp, landing, NPC,
  sign, event, or item stands on them, and neither tile is a
  door-front or a through-chokepoint (the facade itself already
  breaks row 7; BFS-verified below).
- The pocket now has **two independent mouths**: blocking either
  (6,8) or (9,8) alone in the BFS still leaves both pocket tiles
  and both door triggers reachable through the other mouth.
- Density unchanged (lamp count and interior ground count both
  invariant under the swap): Fuchsia **1 per 7.9**, Cinnabar
  **1 per 7.5** ground tiles — identical to the Wave 2 §4 figures,
  re-measured with the same formula (decor F/S/fence/lamp/
  flowerbed vs interior `.`/`,` ground); all 11 settlements
  re-measured and reproduce the Wave 2 §4 table exactly.

### Corrected audit (the non-circular method)

Per map, BFS over `WALKABLE` tiles with sources = **map starts +
cross-map warp landings only** (destinations of warps in other
maps), **excluding** `viaExit` warps (dynamic Center returns;
their static `to` is a fallback, not a landing) and **excluding**
any landing coordinate that is a `via{}` return coordinate for
that map. Warp triggers audited: **229 — reachable 226,
unreachable 3**, and the 3 are exactly the pre-existing
a132397 set, unchanged: `victoryroad@(17,5)` (warp on a `#`
tile) and the `newisland` pair (8,10)/(9,10) (event-arrival map,
no warp-in landing exists to seed from). The same audit run
against a132397 gives 229 / 226 / the identical 3, so the fix
restores the baseline exactly — **no new unreachable triggers**.
At the Wave 2 commit the same audit gave 222 reachable with the
4 Center triggers (Fuchsia (7,7)/(8,7), Cinnabar (7,7)/(8,7))
as the only extra failures. Building-door approaches (110 door
tiles, warp halves + decorative facades): every door has a
reachable approach except the 4 pre-existing New Island doors
(fronts are sign/border tiles, identical at a132397) and the 2
edge facades listed under Findings. A single-point scan
(each reachable trigger re-audited with each of its approach
tiles blocked in turn) found **no trigger with a single
load-bearing approach tile**.

### Center-exit landings at (7,9) — disposition per town

QA found Center exits land at (7,9) in every Center town
(pre-existing engine behavior — `loadMap` overwrites
`centerReturn` with `_lastCity`; engine code is out of scope for
this art mission). Verified per town (tile + escapability — a
player placed there can step to a reachable walkable tile):

- **Open ground, landing tile itself walkable + reachable (6):**
  Viridian `,` · Cerulean `.` · Vermilion `.` · Celadon `.` ·
  Lavender `.` · Indigo `.`.
- **Saffron (7,9) is the Center door tile `J` itself** — walkable,
  reachable; stepping off south/east exits normally.
- **Fuchsia (7,9) = `b` (roof-terra-m), Cinnabar (7,9) = `e`
  (roof-slate-m)** — non-walkable (was a non-walkable `H` stamp
  pre-wave, so not a Wave 2 regression), and **escapable both
  ways**: north into the now-open pocket (7,8) and south onto the
  Safari-gate / Mansion door warp (7,10). **Remedy considered and
  NOT taken:** shifting the south building 1 tile south so (7,9)
  becomes ground is not clean in either town — the shifted
  facade would sit on the last interior row, its doors' fronts
  would be the border row (`#` at (7,12); the route-exit warp at
  (8,12) in Fuchsia), the roof would take the doors' current
  row, and the doors would become unreachable from every side.
  Left as-is, explicitly, per the fix-pass terms.

### Findings (listed, not fixed — no clean dressing remedy)

- **Vermilion south-dock house door `w`@(5,11) and Celadon south
  house door `s`@(7,11)** are decorative facades (no warp, no
  interior) on the maps' last interior row: their south fronts
  are the border row, so no door-front tile exists. Wave 2
  introduced the explicit door tiles (at a132397 these houses
  were `H` stamps with open ground in front). Not fixable by
  dressing relocation, and shifting either house 1 tile north is
  not clean: in Vermilion the roof would cover the
  `ev_squirtle_squad` event tile at (5,9), and in both towns the
  roof would land exactly on the (7,9) Center-exit tile,
  degrading an open-ground landing to a roof landing. Recorded
  here so QA's door-approach re-audit has the disposition in
  writing; footprint moves are a future-wave call.

### Correction to §3 (record)

The Center warp move was **18 effective entries (9 towns × 2 door
halves)**, not 32 — see the amended FLAGGED bullet in §3 above.
The §3 BFS claim is likewise corrected there; this section's
audit supersedes it.

### Bytes + battery at this commit

- Map-data delta: 8 row strings char-for-char (byte-flat);
  `art-data.mjs` unchanged at 208,902 B (ART keys **252, zero
  lost**; build-art run twice = byte-identical, and identical to
  the Wave 2 commit). `public/game.js` **1,433,590 B — exactly
  the Wave 2 size** (the fix pass adds 0 bytes against the
  +24,872 B Wave 2 total).
- Battery (public): rejuv-phase1 **44/44** · phase2 **42/42** ·
  phase3 **63/63** · phase4 **53/53** · phase5 **55/55** · phase6
  **46/46** · fidelity **35/35** · campaign-smoke **24/24** ·
  audit-headless **17/17** · audit-laptop public **41/41** ·
  verify-slice **48/48** · qa-slice **134/134** · validator test
  **51/51** · validator fuzz **2000/2000** · save-contract **6/6**
  · Track B **114/114** · budgets-check **all gates pass** ·
  contamination **clean** · drift-gate guest ≡ strip(vercel) PASS
  + full three-edition PASS · qa-changed-flows **55/57, failures
  exactly the standing baseline {b2, d9}**.
- **personal/ is byte-identical to HEAD** in this commit (restored
  after the battery's full builds; `dist/content-hash.txt`
  personal line restored to the HEAD value), per precedent.
- Verify-live expectation impact: none (nothing deployed).

## World Art Wave 3a — Hero, Follower, Named Cast (2026-10-28)

Implementer pass for the world-art elevation (census:
`ashs-journey-qa/world-art-census.md` §3 character rows + §4 Wave 3,
first half). Presentation only — no game state, balance, dialogue, or
map layout changed; nothing deployed. Wave 3b (generic population +
portrait/trainer wiring) follows and is NOT in this commit. All art is
original `.pix` work drawn to §3 — redesigns, not recolors, nothing
traced or copied from any game.

### 1. Ash — full redraw at 16×32 (24 authored files)

All 24 frame files (`assets/sprites/pix/ash/`) redrawn at 16×32:
4 directions × (idle-1/2 + walk-1..4), frame counts and the
idle/walk cadence exactly as before (control parity: `playerSprite`'s
200ms walk cycle and 500ms idle blink untouched).

**Frame-scheme reconciliation (flagged per the wave brief):** the
census §3 line "30 files" counts the 24 frame ids PLUS the 6
right-facing frames as new authoring. On disk the count resolves to
**24 authored `.pix` files**: the 18 previously-authored frames
redrawn, and the 6 `ash-right-*` files converted from `MIRROR`
stubs into full authored grids. Total ash ART keys unchanged (24),
zero lost.

- **True right-facing frames:** the right set is drawn, not mirrored —
  cap logo patch (white patch + gold dot on the dome), the chest-strap
  buckle moved to the hip, and a backpack pocket flap that the left
  set does not have. Measured: `ash-right-walk-1` vs the horizontal
  flip of `ash-left-walk-1` differs in exactly 5 pixels, all in the
  strap/logo region — (11,3), (11,4) logo; (9,18), (10,19) hip
  buckle; (4,16) bag pocket.
- Shading standard: ≥3 shades per garment (jacket j/J/B, cap K/k +
  white panel W/w), 2 skin tones (S/s), hair highlight + shadow
  (h/H/d), real 2px eyes + brows + mouth at the bigger canvas,
  backpack with straps front and a shaded pack + flap on the back
  view.

### 2. Pikachu follower — redraw + visibility fix

- Redrawn at **16×20** (kept smaller than the 16×32 humanoid canvas —
  it is a Pikachu; `blitCharacter`'s aspect-preserving bottom anchor
  handles it with no draw-path change): hop-1/2 redrawn +
  **new idle-1/2** (blink / ear-twitch). Four yellow steps
  (y #ffdf6b / Y #f5c93c / D #dda01e / d #b57a14), dark shaded ear
  tips, a constructed zigzag tail (brown base → shaded yellow
  segments, visible beside the body), two-tone shaded cheeks.
- **Idle wiring:** `Game.partnerFrame(idle)` plays the idle pair at
  the player's 500ms rest cadence when the player is not moving; the
  280ms hop cycle while travelling is unchanged.
- **Visibility fix (presentation only)** — `src/game/overworld.mjs`
  render: the follower's DISPLAY position steps aside while its
  logical position (`this.partner.px/py`, the trail, the pet
  interaction check) is untouched. When the display tile equals the
  player's tile (spawn / warp landing, where the empty trail used to
  stack it invisibly under Ash) it draws one tile west — beside Ash.
  When it shares the player's column (vertical trail, where its body
  used to land on the tall Ash sprite's head) it draws 10px east.
  Self-check captures (`ashs-journey-qa/wave3a-selfcheck-shots/`):
  at Pallet spawn Pikachu stands west of Ash, fully visible; after
  southward steps it settles beside, never under.

### 3. Named cast — 20 individual sprites × 2 idle frames

New/redrawn kinds (all 16×32, all ≥10 colors — measured range
12–15 after the leg-geometry fix below): **gary** (spiky hair,
pendant), **garychamp** (Gary + crimson cape/gold trim — the League
CHAMPION), **mom** (bun, apron dress), **hawthorn** (gray beard,
glasses, lab coat), **brock** (redrawn in place, vest + undershirt),
**misty** (side ponytail, midriff top, shorts), **surge** (broad,
flat-top, sunglasses, dog tags, camo), **erika** (long hair, kimono
sleeves, gold obi), **koga** (topknot, magenta scarf over the mouth),
**sabrina** (long purple-shadowed hair, gold collar), **blaine**
(bald, gray moustache, glasses), **giovanni** (slick hair, suit, red
tie, stern brows), **lorelei** (long red hair, glasses, dress),
**bruno** (bare chest, diagonal strap, gold belt), **agatha**
(hunched, bun, cane), **lance** (red spikes, cape, gold trim),
**rue** (uniform, drawn-on moustache per his Bonds note), **cole**
(uniform, red hair), **nurse** (redrawn in place: pink hair rolls,
nurse cap, cross apron), **sparcoach** (buzz cut, tracksuit stripes,
whistle — split from the generic `coach` kind, which the Pewter
advice NPCs keep).

- **Repoints: 39 instances** across `maps.mjs` / `maps2.mjs` /
  `maps3.mjs` / `maps4.mjs` / `quests.mjs` (MOM tale NPC) /
  `bonds.mjs` (parley RUE/COLE) — every GARY (7, incl. S.S. Anne,
  Tower, Silph, League approach), CHAMPION (→ garychamp), all eight
  gym leaders incl. the duplicated gym maps in maps3/maps4, all four
  Elite Four in BOTH League layouts, Giovanni in both his rooms,
  RUE/COLE on Route 2 and at the Celadon parley, SPARRING COACH
  in both Center definitions. Static audit over the merged instance
  set: **212 NPC instances, every one resolves to authored idle
  frames; zero named instances left on a generic kind.**
- **Swap discipline:** every named kind is authored on the uniform
  S (skin) / H (hair) / J (shirt) / P (pants) palette keys and
  registered in `NPC_SWAP_KEYS` (`art.mjs`) — nurse and brock moved
  off their Wave 0 one-off keys (T/V) onto the same scheme. Authored
  palettes were checked against instance data palettes: Gary ×7,
  Mom, Misty, Surge, Erika, Koga, Giovanni, the Elite Four and
  Rue/Cole instances agree (authored = data, so the swap is an
  identity mapping for them). **Flagged data disagreements (not
  changed — data is content):** Blaine's maps4 instance carries a
  different shirt/hair than maps2/maps3, Lance's maps3 hair is
  orange vs maps2 red, Sabrina's maps4 shirt/hair differ slightly,
  Bruno's maps3 shirt differs; for those rooms the swap rasterizer
  honors the per-instance data, as designed in Wave 0.
- **Craft fix found during the pass:** 2-wide leg columns are all
  outline pixels by construction, so first-draft legs rendered as
  black sticks and pants colors never appeared. Legs were rebuilt as
  a shaded thigh block + 3-wide lower legs (Ash's front legs too);
  every named sprite then measures 12–15 distinct colors.

### 4. Hawthorn — sprite delivered, NOT placed (flag)

Hawthorn's dialogue does not happen at any map standing spot: he
speaks in the intro cutscene and through UI `say` panels (Dex rating,
diploma). Pallet's lab has no interior map, and the lab sign states
he is out on Route 1 — but no Hawthorn NPC or dialogue exists on
Route 1 either. Placing him would require new dialogue/interaction
content, so per the wave rule he was **not placed**. His sprite ships
as `npc-hawthorn-idle-1/2` with the kind fully wired (`NPC_SWAP_KEYS`
entry; any future instance with `art: 'hawthorn'` renders him). The
orphaned legacy `npc-professor-*` art is untouched (zero keys lost).

### 5. Ground shadows — shared renderer mechanism

`Renderer.blitCharacter` (render.mjs) now draws a soft ground shadow
for every character it blits — player, follower, and all NPCs —
via `Renderer.characterShadow`: a stepped pixel ellipse in two
alpha passes (outer `rgba(16,22,14,0.16)`, core `0.20`), rect-only
like `ptDisc` so the headless recording ctx renders it identically.
Not baked into any sprite. The follower passes its true ground line
separately so the shadow stays planted while it hops.

### 6. Bytes + battery at this commit

- `art-data.mjs` 208,902 → **265,746 B (+56,844)** — inside the
  3a share (~95,000 B) of the 140,000 B Wave 3 budget; **83,156 B
  remains for Wave 3b**. ART keys **252 → 290 (+38: 36 named-cast
  files + pikachu-idle-1/2), zero lost**; build-art run twice =
  byte-identical. `public/game.js` 1,433,590 → **1,494,883 B**
  (+61,293, art + the §2/§5 code).
- Battery (public): rejuv-phase1 **44/44** · phase2 **42/42** ·
  phase3 **63/63** · phase4 **53/53** · phase5 **55/55** · phase6
  **46/46** · fidelity **35/35** · campaign-smoke **24/24** ·
  audit-headless **17/17** · audit-laptop public **41/41** ·
  verify-slice **48/48** · qa-slice **134/134** · validator test
  **51/51** · validator fuzz **2000/2000** · save-contract **6/6**
  · Track B **114/114** · budgets-check **all gates pass** ·
  contamination **clean** · drift-gate guest ≡ strip(vercel) PASS ·
  qa-changed-flows **failures exactly the standing baseline
  {b2, d9}**.
- **personal/ is byte-identical to HEAD** in this commit (restored
  after the battery's full builds; `dist/content-hash.txt`
  personal line restored to the HEAD value), per precedent.
- Verify-live expectation impact: none (nothing deployed).

## World Art Wave 3b — Crowds + Presentation Wiring (2026-10-28)

Second half of census §4 Wave 3 (source of truth:
`ashs-journey-qa/world-art-census.md` §3 NPC row + §4 Wave 3).
Presentation only — no game state, balance, dialogue text, pacing,
or battle timing changed; nothing deployed. All art is original
`.pix` work drawn to §3, nothing traced or copied.

### Register corrections folded in from Wave 3a QA

- **(a) Pikachu yellow steps:** the 3a claim of "four yellow steps"
  overstates the follower frames. Measured on the shipped sources:
  hop-1/2 and idle-1/2 paint with **3 yellow steps** (y #ffdf6b /
  Y #f5c93c / D #dda01e); the 4th palette entry **d #b57a14 is
  declared but unused by those frames** (0 pixels). The palette
  entry stays (the battle front/back pair is a different family and
  Wave 6a owns the partner's battle redraw).
- **(b) Instance count:** the 3a section's "212 NPC instances" is a
  **pre-merge source count** (the four map modules + tale/parley
  lists before `Object.assign` shadowing). The **runtime-merged
  population is 139** (127 map instances after merge + 12 tale
  injections). All Wave 3b audits below use the merged figure.

### 1. Generic population — 27 generic kinds at 16×32

- **Redrawn in place at 16×32** (were 16×16): youngster, lass,
  rival, coach, aide, professor — the Wave 3a craft standard
  (≥3 shades per garment via authored light/dark secondaries, 2+
  skin tones across the set, hair highlight + shadow). Nurse was
  already redrawn at 16×32 in 3a and is untouched.
- **20 new kinds × 2 idle frames:** hiker, swimmer, sailor,
  scientist, fisher, elder, kid, camper, bugcatcher, biker,
  grunt, clerk, worker, officer, lady, gent, monk, ranger,
  acetrainer, twin — the full generic roster is **27 kinds**
  (7 pre-existing + 20 new), all × 2 idle frames at 16×32. Every kind is authored on the uniform swap
  scheme — S (skin) / H (hair) / J (shirt) / P (pants) as distinct
  palette keys, registered in `NPC_SWAP_KEYS` (`art.mjs`) — so the
  Wave 0 rasterizer renders the ~98 authored instance palettes
  across the crowd. (Lass/aide/professor moved off their legacy
  one-off swap keys — D/K, V, G/W/K — onto the same scheme.)
- **Repoints: 146 source instances** across maps.mjs / maps2 /
  maps3 / maps4 / quests.mjs, name-keyed so every duplicated map
  copy agrees: sailors crew the S.S. Anne (MARA, JULES, CAPTAIN)
  and the harbors (CAPT SALT, CAPT MARA, FERRYMAN, HARBORMASTER,
  SAILOR BRINE/GHOST); swimmers on Routes 19/20 + Cerulean gym's
  DIANA; hikers on Routes 2/3/9, Mt. Moon, Rock Tunnel, Seafoam;
  fishers at Vermilion harbor + Route 12; scientists in Mt. Moon,
  Silph, both labs, New Island; grunts for every Team Rocket
  body; clerks at every Mart/Game Corner counter; officers at
  gates; rangers/warden/keeper in the Safari; monks in the dojo,
  Tower, Saffron gym; elders for Fuji, Gramps, the Old Man, the
  Curator, veterans; WREN (Pokemon House nurse) now renders the
  nurse kind. 15 instances stay youngster (young male trainers,
  gamers, MARCO/RICK/CAL/ORIN/FAN/MARCUS, PYRO, the waiting
  trainer — and the two object-NPCs JOURNAL / WRECKED LOG, which
  are things, not people; see flags).
- **Runtime audit (merged population, 139):** every instance
  resolves to authored idle frames; **no map contains two
  identical figures** (same kind + same rendered palette
  signature); **25 distinct generic kinds actually appear** in
  the merged world (professor appears only via the legacy name
  fallback; rival likewise). Live self-check captures
  (headless Chromium, local build): Viridian street, S.S. Anne,
  Route 2 — crowds read as individuals; the Anne's crew wears
  sailor whites with per-instance skin/hair/palette variation.
  **[CORRECTED by the Wave 3b fix pass below: this audit was
  data-level (kind + data palette), not rendered. As shipped at
  c6ddd38 the rendered claim was FALSE — a bundle global-name
  collision silently dropped swap (and white) from the art
  cache key, so only the first instance of each kind per page
  session rendered its own palette. See "Wave 3b FIX PASS".]**
- **CUBONE / MAROWAK SPIRIT:** unchanged — still no overworld
  species art exists; they remain on the generic path per the
  census's documented why-not (species art is Wave 6 scope; a
  human sprite for them would be wrong, and no overworld species
  sprite was invented here).

### 2. Portraits into dialogue

The 15 authored 24×24 portraits existed with exactly one ever
shown (Hawthorn, intro). Wiring (presentation only):

- `src/engine/art.mjs`: `SPEAKER_PORTRAITS` +
  `speakerPortraitId()` / `speakerPortraitCanvas()` — speaker
  names normalized (uppercase, parentheticals dropped, punctuation
  folded), so 'GARY', 'CHAMPION', 'PROF. HAWTHORN', 'LT. SURGE',
  'GIOVANNI (phone)', 'THE BOSS (speaker)' (Giovanni) all resolve.
  **Map size: 20 speaker keys → all 15 portrait subjects
  reachable.** Unmapped speakers resolve null.
- `src/game/ui.mjs`: `buildDialogue()` creates a 48×48 face
  canvas (inline styles — shell CSS untouched, keeping the
  personal/public index parity gate) floated at the panel's left;
  `say()` calls `_showDlgFace(speaker)`, which paints the mapped
  portrait (2×, smoothing off) or hides the canvas. Speakers
  without portraits show **no portrait — no placeholder**.
  `closeDialogue()` hides it. Dialogue lines, typewriter pacing,
  callback flow, and the headless path are byte-for-byte
  behavior-identical (the face only paints when `!headless`).
- Live proof: talking to Gary in Pallet shows portrait-gary in
  the panel (canvas display:block, 1,072 painted pixels measured)
  with the dialogue text unchanged.

### 3. Trainer sprites into battle intros

The three authored battle-family sprites (ash-battle-back 32×32,
gary-battle 32×32, brock-battle 32×48) were drawn 0 times. Wiring
(presentation only):

- `src/engine/art.mjs`: `trainerBattleArt(doc, trainer)` (Brock
  by name/id, Gary by name or `gary*` id; else null) +
  `playerBattleBackArt(doc)`.
- `src/game/battle.mjs`: `enter()` resolves both canvases once
  (guarded, headless-safe); `render()` — while `state === 'intro'`
  (the challenge/send-out message chain) — stands Ash's battle
  back on the ally platform and the foe trainer's battle sprite
  on the foe platform, anchored center-x/bottom exactly like the
  battlers, drawn 64px tall with aspect preserved. Battlers take
  over untouched when the intro hands off. **Zero state, timing,
  or message changes.**
- **Engines:** the intro state and this render path are shared —
  `renderRt` only takes over at state 'rt'/'xp', so **RT battles
  get the same intro figures**; classic-only was not necessary.
- **Fallback rule:** a trainer without a battle-scale sprite
  (`trainerBattleArt` → null) keeps the foe battler on the
  platform during the intro — the pre-3b behavior, no blank or
  broken frame. Wild battles show Ash's back only. Wave 6b
  authors the full trainer set.
- Live proof: Brock and Gary (S.S. Anne) battle intros captured
  with both figures on their platforms; the Brock battle then
  reached its command panel and plays identically.

### 4. Bytes + battery at this commit

- `art-data.mjs` 265,746 → **312,508 B (+46,762)** — inside the
  remaining Wave 3 budget of 83,156 B (36,394 B unspent). ART
  keys **290 → 330 (+40: 20 new kinds × 2 frames), zero lost**;
  build-art run twice = byte-identical. `public/game.js`
  1,494,883 → **1,548,524 B** (+53,641: art + wiring code).
- Battery (public): rejuv-phase1 **44/44** · phase2 **42/42** ·
  phase3 **63/63** · phase4 **53/53** · phase5 **55/55** · phase6
  **46/46** · fidelity **35/35** · campaign-smoke **24/24** ·
  audit-headless **17/17** · audit-laptop public **41/41** ·
  qa-slice **134/134** · validator test **51/51** · validator
  fuzz **2000/2000** · save-contract **6/6** · Track B **114/114**
  · budgets-check **all gates pass** · contamination **clean** ·
  drift-gate guest ≡ strip(vercel) PASS · qa-changed-flows
  **55/57, failures exactly the standing baseline {b2, d9}**.
- **personal/ is byte-identical to HEAD** in this commit (restored
  after the battery's full builds; `dist/content-hash.txt`
  personal line restored to the HEAD value), per precedent.
- Verify-live expectation impact: none (nothing deployed).

### Flags / deviations

- MARA and JULES both wear the sailor kind on the S.S. Anne —
  deliberate (their dialogue: they dressed as crew). Their
  rendered palettes differ (skin #e8b888/#d8a878, hair
  #7a1a3a/#3a6ac0), so no two figures on that screen are
  identical; they read as a uniformed pair, which is the joke.
  **[CORRECTED by the Wave 3b fix pass below: the premise was
  false as rendered at c6ddd38 — MARA and JULES rendered
  byte-identical (both in MARA's palette, the first sailor
  rasterized in the session). Their DATA palettes differ as
  listed; after the fix pass their RENDERED palettes differ
  too, measured in-bundle (see "Wave 3b FIX PASS").]**
- JOURNAL / WRECKED LOG (object-NPCs in the Mansion / New Island)
  still render on the youngster kind — pre-existing, not a crowd
  member, and no object sprite system exists yet; flagged for
  whichever wave adds prop-NPC art.
- Brock's battle sprite is the skinny legacy 32×48 art, drawn
  faithfully at 64px tall; it reads thin next to the 64×64
  battler standard. Redrawing trainer art at battle scale is
  Wave 6b scope, not 3b.

### Wave 3b FIX PASS — art cache-key global collision (2026-10-28)

Independent QA FAILED 3b §1/§2 at c6ddd38 (verdict:
`ashs-journey-qa/wave3b-qa-verdict.md`). The defect, root cause,
and fix:

- **Defect (as rendered):** palette swaps rendered only for the
  FIRST instance of each NPC kind per page session; every later
  same-kind instance inherited that palette (S.S. Anne's three
  sailors byte-identical in MARA's palette; Viridian's two
  clerks identical; Route 2 NIA in BEA's palette). The same
  dropped parameter also disabled the battle white-flash: the
  white variant of every battler WAS its normal sprite.
- **Root cause:** the build concatenates all modules into one
  scope. `src/game/overworld-systems.mjs` defines a global
  `key(x, y)` (coordinate key, later in module order) which
  silently overrode `src/engine/art.mjs`'s global
  `key(id, scale, white, swap)` (the artCanvas cache key).
  artCanvas therefore cached on `id + ',' + scale` only —
  `swap` and `white` never reached the key, so the first
  rasterization of each sprite id won for the whole session.
  Pre-existing collision; Wave 3b's per-instance swaps were the
  first workload to expose it at crowd scale.
- **Fix (minimal, engine only — no art, no data):**
  `src/engine/art.mjs` — the cache-key helper renamed
  `key` → `artCacheKey` (definition + its single call site,
  artCanvas; 2 lines). overworld-systems' `key(x, y)` is the
  widely-referenced one (4 call sites) and is untouched.
  Built-bundle diff vs c6ddd38 is exactly those 2 lines
  (+16 B: `public/game.js` 1,548,524 → 1,548,540).
- **Collision sweep (same class):** every top-level
  function/const/let/var/class name across all 47 files in
  `scripts/module-order.json` (377 names post-fix): the ONLY
  remaining duplicate is `rows(list) { return list; }` in
  maps/maps2/maps3 — three byte-identical identity helpers,
  benign by construction, pre-existing, not art/render.
  Intersecting art/render top-level names (art, render, tiles,
  sprites, battle, battle-rt, overworld) against every other
  file: `key` was the sole collision; post-fix zero.
- **In-bundle proof** (built bundle eval'd headless with a
  pixel-recording canvas stub; pre-fix bundle reconstructed by
  reverting only the rename): OLD — green-swap vs red-swap
  sailor returned the SAME canvas object (hash 24648b76:234;
  red request carried green, no red pixels); white vs normal
  battler the same object (3729251a:391, not white); MARA-first
  npcFrames: MARA bb42895c:234 (correct), JULES the same object
  carrying MARA's hair #7a1a3a, his own #3a6ac0 absent.
  NEW — green 24648b76:234 / red 76e76b76:234, distinct objects,
  each carrying only its own swap color; identical-arg repeat
  still cache-hits the same object; white is a distinct
  all-#ffffff canvas (80805bce) with the same 391 inked pixels
  as normal; `speciesBattleArt` frontWhite now distinct +
  all-white; MARA-first hash bb42895c:234 pixel-identical to
  the pre-fix first instance (no regression), JULES distinct
  (f27879ca:234) with his own hair and none of MARA's;
  unswapped tile-grass (5300b204:256) and ash-down-idle-1
  (f6f63662:232) hashes identical pre/post fix.
- **`white` blast radius:** the only `white=true` caller in
  the game is `speciesBattleArt` (frontWhite/backWhite),
  consumed by battle.mjs's impactFx (impact frames swap the
  battler sprite to its white variant). Pre-fix
  frontWhite === front, so impact frames silently showed the
  normal sprite; post-fix the authored white flash actually
  flashes — the single intended visual change of this pass.
  No other caller passes white. Full battery (below, incl.
  verify-slice + fidelity + both battle engines' suites) is
  green with the flash restored.
- **Battery (public, all exit 0):** rejuv-phase1 **44/44** ·
  phase2 **42/42** · phase3 **63/63** · phase4 **53/53** ·
  phase5 **55/55** · phase6 **46/46** · fidelity **35/35** ·
  campaign-smoke **24/24** · audit-headless **17/17** ·
  audit-laptop public **41/41** · verify-slice **48/48** ·
  qa-slice **134/134** · validator test **51/51** · validator
  fuzz **2000/2000** · save-contract **6/6** · Track B
  **114/114** (documented invocation
  `node --import ./register.mjs run.mjs`) · budgets-check
  **all gates pass** · contamination **clean** · drift-gate
  guest ≡ strip(vercel), personal ≡ guest + marker PASS ·
  qa-changed-flows **55/57, failures exactly the standing
  baseline {b2, d9}**. Regen: build-art twice = byte-identical
  `art-data.mjs` (md5 d8b8b80b…), ART keys **330** (unchanged).
  Built vercel+guest only; **personal/ byte-identical to
  c6ddd38** (restored after the battery's full builds; the
  content-hash personal line restored to the c6ddd38 value).
  Nothing deployed.
- **Lesson:** data-level audits don't prove rendering — the
  3b crowd audit compared kind + data palette and could not
  see a cache that discarded the swap at raster time; and
  per-kind FIRST-instance spot checks (Gary, the nurse) pass
  even with this bug, because the first instance is the one
  the cache keeps. Crowd claims need rendered fingerprints
  of the SECOND same-kind instance on a screen.

## World Art Wave 4 — Nature & Dungeons (2026-10-28)

Source of truth: `ashs-journey-qa/world-art-census.md` §3 (trees /
vegetation + cave rows) + §4 Wave 4. Presentation only, except the
coordinator-approved spirit addendum (§6): no game state, balance,
dialogue, or pacing changed; nothing deployed. All art is original
`.pix` work drawn to §3, nothing traced or copied.

### 1. Trees & vegetation — 3 species × 2 sizes + bush

- **Pieces:** `tile-tree` redrawn in place (oak, large) + new
  `tile-tree-oak-small`, `tile-tree-pine`, `tile-tree-pine-small`,
  `tile-tree-elm`, `tile-tree-elm-small`, `tile-bush`,
  `tile-flower-3` (white/pink clusters — third flower variant).
  Every tree carries a layered canopy (highlight / mid / shadow
  clusters in 4–5 greens, seeded by the old tree's 3-tone canopy)
  and a cast shadow painted at its base over the composited ground.
- **No identical neighbours, by construction:** `resolveTileLayers`
  picks the tree stamp by `treeVariantIndex(x, y, n) = (x + 2y) mod n`
  over the 7-variant pool — orthogonal steps change the index by 1
  or 2, never 0 mod n (n ≥ 3), so two orthogonally adjacent trees
  can never resolve to the same stamp. Rendered-layer audit over
  the merged world: **2,242 tree cells, 2,161 orthogonal adjacent
  pairs checked, 0 identical pairs.**
- Tree tiles still wall non-dungeon interiors for now — Wave 5 owns
  interior walls; Wave 4 replaces them exactly where its dungeon
  sets apply (§3/§4 below), per the wave brief.

### 2. Rocks — baked-in ground killed

- `tile-rock` redrawn + new `tile-rock-2` / `tile-rock-3`: pure rock
  tones only (the old tile's moss-green `#6fb45c` pixels are gone —
  measured: no grass/moss hex in any rock or cave-boulder palette).
  The ground an object stands on is supplied by the Wave 1
  object-over-ground compositing, now extended (§3) so a rock in a
  cave stands on cave floor, never on a square of grass:
  **rock-on-grass artifact count 0** (rendered-layer check over all
  6 caves: every rock/boulder cell's ground layer is a cave floor).
- The Strength-boulder overlay (`sysRenderWorld`) now draws the
  position-hashed variant via `boulderCanvasFor` (cave set when the
  boulder's neighbourhood is cave tiles) — at a boulder's home
  position it is exactly the sprite the tile resolver drew, so the
  overlay stays idempotent, and the variant follows a pushed boulder.

### 3. Cave tileset + application to all cave/dungeon maps

- **Pieces:** `tile-cavewall-1/2/3` (strata bands, ≥3 rock tones
  each), `tile-stalactite` (pale cones over a dark strata face —
  the resolver picks it for exposed wall faces, south = floor, at
  a spread-hash rate), `tile-cavefloor-1/2/3` (dusty variants),
  `tile-caveboulder-1/2/3` (rounded / angular / stalagmite-cone).
- **New chars, collision classes carried by the char:** `G` cavewall
  (wall class, non-walkable), `L` cavefloor (floor class — added to
  `WALKABLE`), `N` caveboulder (non-walkable). Map-data char pass:
  `#`→`G`, `.`→`L`, `R`→`N` in every source copy of each cave map
  (maps2 + maps3), so duplicated definitions agree. `B` (movable
  Strength boulders), `D` doors, `~`/`W` water and `S` signs are
  untouched chars; cave water banks now take foam only — the sand
  shore scallop is suppressed on cave banks in the water resolver.
- **Per-map application (merged runtime):** moon1, moon2 (Mt. Moon),
  rocktunnel, seafoam, victoryroad, ceruleancave — walls, floors
  and rocks all swapped. **Diglett's Cave does not exist as a map**
  in this game's data (searched all map modules: no diglett cave
  id; Diglett appear only as encounters/species) — the brief's
  list of 6 resolves to the 5 cave systems above, Mt. Moon counting
  as its two floors; flagged here rather than invented.
- **Collision-class proof:** cell-by-cell comparison of every source
  module against HEAD — 20,972 cells compared, 4,276 changed,
  **0 walkability-class violations** (old char walkable ⇔ new char
  walkable, each under its own version's `WALKABLE`).
- **Rendered-layer audit (per cave):** every cave renders all 3
  strata wall variants + the stalactite face (7–9 stalactite cells
  per cave), all 3 dusty floor variants, and (where rocks exist)
  all 3 cave boulder variants; **zero outdoor layers** (no tree, no
  sand path, no grass) in any cave cell. The darkness overlay is
  untouched and is no longer the only cave signal.
- **Variant-hash note:** Wave 1's `hashTile` clusters in the low
  two-thirds over map-sized grids (measured: at every salt, an
  18×13 grid never reaches the top third), which starved 3-variant
  sets. Wave 4 sets pick via a new `hashTileSpread` (measured
  ~78/74/82 over the same grid); Wave 1 picks are unchanged.

### 4. Dungeon interior sets (wall/floor only; furniture is Wave 5)

- **Pokémon Tower** (tower1, tower2): `M` towerwall (coursed
  memorial stone) + `Q` towerfloor (worn stone slabs, 2 variants);
  `#`→`M`, `.`→`Q`.
- **Silph Co.** (silph1, silph2 — all source copies incl. maps4's
  silph2): `I` silphwall (brushed metal panels, teal accent stripe)
  + `%` silphfloor (pale corporate tile grid, 2 variants);
  `#`→`I`, `.`→`%`.
- **Power Plant** (powerplant): `@` plantwall (riveted industrial
  panels, hazard-striped base) + `&` plantfloor (dark concrete,
  2 variants); `#`→`@`, `.`→`&`.
- New floor chars `Q` / `%` / `&` joined `WALKABLE` (floor class
  preserved 1:1 from `.`); walls stay non-walkable. `R`/`S` props
  inside these maps keep their chars (props are Wave 5 scope).
  Rendered-layer audit: each of tower1/tower2/silph1/silph2/
  powerplant renders only its own wall/floor identity (+ the shared
  shadow strip / pebble detail overlays), both floor variants in
  every map.

### 5. Safari dressing check

- Pond edges: Wave 1 shore + foam already resolve on every Safari
  bank (water neighbours are path/grass); grass variety inherits
  the Wave 1 tall/base variant system. **Gap found:** the zone's
  path floor had zero dressing of its own. Added 6 flower tiles
  (`F`, walkable → walkable, class preserved) scattered on path
  cells in both safari source copies. No other Safari change.

### 6. Addendum — Cubone + Marowak spirit sprites (coordinator-approved)

- **Pieces:** `npc-cubonespirit-idle-1/2`, `npc-marowakspirit-idle-1/2`
  — 16×20 idle pairs, ghostly pale palettes (pale skull, washed
  tan / lavender bodies, wavy ghost hems, bone in hand; frame 2
  lowers the bone and catches one eye with light).
- **Wiring:** the two Pokémon Tower spirit instances in maps3
  tower2 now carry `art: 'cubonespirit'` / `art: 'marowakspirit'`.
  The kinds are deliberately NOT in `NPC_SWAP_KEYS`, so the
  authored ghost palettes render unswapped (instances' legacy
  skin/shirt data stays, unused for these kinds). The Wave 0
  why-not comment at those instances is amended in place to point
  at this resolution. Rendered proof: `npcFrames` for both
  instances returns exactly the authored canvases (16×20).

### 7. Palette disposition

- Tiles-family union: **48/48 before → 48/48 after — no budget
  raise taken.** Every Wave 4 tile hex reuses the existing union
  (vegetation greens, strata browns/greys, hazard yellow, teal
  accent, foam white were all already present). Palette-audit:
  "tiles family palette <= 48 colors" PASS at 48; all source
  sprites pass pixel checks. (The audit tool's 4 standing failures
  at HEAD — its `XXX` slop pattern matching water-tile pixel rows —
  are pre-existing and unchanged.)

### 8. Reachability + bytes + battery

- **Non-circular reachability audit** (Wave 2 fix method,
  `~/workspace/w2fix/audit.mjs`, sources = starts + cross-map
  landings only): warp triggers 226/229 reachable; **unreachable
  set exactly the pre-existing {victoryroad@(17,5), newisland
  pair}**; door approaches 104 any-adjacent (baseline-identical);
  single-point scan 0.
- **Bytes:** `art-data.mjs` 312,508 → **330,397 B (+17,889)** —
  inside the 20,000 B Wave 4 budget, no overrun. ART keys
  **330 → 362 (+32: 28 tiles + 4 spirit frames), zero lost**;
  build-art run twice = byte-identical. `public/game.js`
  1,548,540 → **1,575,864 B** (+27,324: art + resolver/map code).
- **Battery (public):** rejuv-phase1 **44/44** · phase2 **42/42** ·
  phase3 **63/63** · phase4 **53/53** · phase5 **55/55** · phase6
  **46/46** · fidelity **35/35** · campaign-smoke **24/24** ·
  audit-headless **17/17** · audit-laptop public **41/41** ·
  verify-slice **48/48** · qa-slice **134/134** · validator test
  **51/51** · validator fuzz **2000/2000** · save-contract **6/6**
  · Track B **114/114** · budgets-check **all gates pass** ·
  contamination **clean** · drift-gate guest ≡ strip(vercel) PASS ·
  qa-changed-flows **55/57, failures exactly the standing baseline
  {b2, d9}**. Built vercel+guest only; **personal/ byte-identical
  to HEAD** (restored after the battery; content-hash personal
  line restored to the HEAD value). Nothing deployed.
- Self-check composites (resolver-rendered, not live play):
  `ashs-journey-qa/wave4-selfcheck-shots/` (moon1, tower2, route1,
  silph1, powerplant).

### Flags / deviations

- **Diglett's Cave is not a map in this game** (see §3) — the
  brief's "all 6 cave/dungeon maps" was applied to every cave map
  that exists; nothing was invented to fill the slot.
- Interior tree-walls outside the dungeon sets (Center, gyms,
  houses) remain until Wave 5, exactly as the brief scoped.
- Cave floor speckle is denser than the outdoor path texture —
  deliberate (dusty, pebble-strewn), and all three variants share
  the same base so floors read as one material.

## World Art Wave 5a — Interior Tilesets, Furniture, Existing Interiors Dressed (2026-10-28)

Source of truth: `ashs-journey-qa/world-art-census.md` §3 (interiors
row) + §4 Wave 5. Scope honored: EXISTING interior maps only — no new
maps built, no NPC moved between maps (Wave 5b owns the new house +
Mart interiors; the Mart tileset ships here, its map does not).
Presentation + map-arrangement only, plus two small interaction
repairs the dressing required (§5). Nothing deployed.

### 1. Interior tilesets — 5 families, 17 tiles

- **Pieces:** per family a floor in **2 variants** + a wall with
  crown band, panel seams and baseboard trim: Center (`tile-centerfloor-1/2`,
  `tile-centerwall` — cream-rose floor, rose wall), Mart
  (`tile-martfloor-1/2`, `tile-martwall` — pale sage floor, teal wall;
  map arrives in 5b, exercised here by the Game Corner), house
  (`tile-housefloor-1/2` wood planks, `tile-housewall` warm plaster),
  gym (`tile-gymfloor-1/2` sport wood, `tile-gymwallin` stone with red
  accent), lab (`tile-labfloor-1/2` slate panels, `tile-labwall`).
  Two further walls ride the same system: S.S. Anne `tile-annewall`
  (ship wood, brass studs) and League `tile-leaguewall` (dark stone,
  gold crown, purple trim).
- **New chars, collision class carried by the char:** floors
  `! $ * + -` joined `WALKABLE` (each swapped 1:1 from the walkable
  `.` floor); walls `: ; < = > ? ^` are wall class. Wave 4's Tower /
  Silph / Power Plant sets (`M/Q`, `I/%`, `@/&`) are untouched and
  only gain furniture (§3).
- **Resolver:** interior floors pick their variant pair by the Wave 4
  spread hash and take the shared shadow strip under a wall; props
  composite over the floor they stand on via the Wave 1
  object-over-ground path, with the five interior floors added as
  ground families — a plant in a Center stands on Center floor,
  never on grass. `paintTile` fallbacks exist for every new kind.

### 2. Prop / furniture library — 27 kinds

`counter` (Center counter), `healmachine` (healing machine, red-cross
screen), `pcdesk` (PC desk — sits beside the PC Terminal NPC, whose
own art is the Wave 0 `npc-pc` pair), `bed`, `table`, `chair`,
`shelf` (bookshelf), `plant`, `martshelf` (Mart shelving), `goods`
(glass goods counter), `podium`, `statue`, `badgecase`, `labmachine`,
`labtank`, `labdesk`, `cabinbed` + `cabintable` + `porthole` (S.S.
Anne cabin set), `slotmachine` (Game Corner), `throne` (League),
`memorial` (Tower gravestone), `officedesk` (Silph), `sofa`, `stool`,
plus the two walkable dressings `rug` and `battlemat`. **25 solid +
2 walkable = 27 kinds** (library target ≥25). Solidity: every prop
char is non-walkable except `)` rug and `/` battle mat, which joined
`WALKABLE`. Prop chars are Greek letters (+ `(` stool) — the ASCII
letter/digit space was already exhausted by Waves 1–4; the legend
lives in `src/engine/tiles.mjs` at the `TILE_CHARS` Wave 5a block.

### 3. Per-interior dressing (20 interiors; every one ≥6 distinct props)

- **Center (shared, all towns):** rose walls + cream-rose floor;
  nurse behind the **counter** (`α` at (4,3)/(5,3)) with the
  **healing machine** at (5,1), PC desk beside the PC Terminal,
  plant, sofa, chair — 6 prop kinds + the terminal itself. The first
  heal reads instantly: counter in front, machine behind.
- **All 8 gyms:** stone walls + sport-wood floor; podium pair
  flanking each leader, battle mat on the center aisle, badge case,
  plant, entrance rugs — 6 kinds each (7 in Vermilion/Fuchsia).
  Type flavour within the shared system: Pewter/Viridian statues
  replace their rocks 1:1; Cerulean keeps its pools; Vermilion's
  rocks become generator machines; Celadon's flowers become rugs
  (walkable→walkable) + plants + a goods display; Saffron/Cinnabar
  keep their quiz signs (statues/machines replace rocks); Fuchsia
  adds a lab tank.
- **S.S. Anne:** ship-wood walls, porthole pair, four cabin alcoves
  (cabin beds / cabin table / plants replacing the flavor door
  stamps), hall table + chair — 6 kinds.
- **Game Corner:** Mart-family walls/floor; the four slot signs are
  now slot machines (same cells, same solidity, sign texts intact),
  goods display, lounge table + chair, plants, rug — 6 kinds.
- **Hideout:** lab walls/floor; machines, crate rows (goods), tanks,
  office desk, PC desk, chair — 6 kinds. The Silph Scope item tile
  and both event tiles are untouched.
- **Dojo:** gym set; podiums, statues, benches, big battle mat,
  shelf, plants — 6 kinds.
- **Silph 1/2 (Wave 4 floors kept):** machines replace the office
  rocks; the four Silph-1 storage rocks beside staff became floor
  (they sat on NPC-adjacent cells — opening them was the only legal
  dressing); office desks, PC desk, chairs, table, plants — 6 kinds.
- **Tower 1/2 (Wave 4 set kept):** memorial stones, offering table,
  prayer shelf, bench/chair, plants, runner rugs — 6 kinds; the
  gravestone signs keep their cells and texts.
- **Mansion:** house walls/floors; bookshelves on the diary alcoves,
  lab tanks across the center, machines, ruined bed, table, plant —
  6 kinds; both diary signs stay readable on their (now shelved /
  tanked) cells.
- **League:** league walls, gym floor; throne behind the Champion
  (diagonal cell — never on an NPC-adjacent cell), statues, chamber
  battle mats (row 4; the row-5 chamber event tiles are untouched),
  badge case, plants, rugs — 6 kinds. The interior `#` pillar trees
  are now league-wall stone.
- **Power Plant (Wave 4 set kept):** all twelve rocks are now
  generator machines; tank, office desk, PC desk, chair, rug —
  6 kinds.

### 4. Palette — ONE deliberate raise, +6 (48 → 54)

Tiles-family union **48/48 → 54/54**. Exactly six new hexes, counted
from the authored tiles: Center rose set — floor `#f2ddd5`, wall
`#e8b4c4`, mid `#c97e97`, baseboard `#9e5570`; Mart sage floor
`#cfd4c2`; League purple trim `#6a4a7a`. Every other Wave 5a hex
reuses the existing union (woods, stones, slates, teals, golds).
The raise is documented at the budget in
`assets/sprites/tools/build-art.mjs`; no headroom banked.

### 5. Interaction repairs the dressing required (flagged, minimal)

- **Over-counter talk:** the nurse's counter sits on her south cell
  (4,3) — the task's own nurse + counter adjacency requirement. Heal
  access is preserved exactly: `tryInteract` / `interactPrompt` now
  look one tile past a faced counter (`α`) to an NPC beyond it, the
  canonical Center mechanic. Drive-proven (§6). This is the single
  deliberate exception to the no-prop-on-NPC-adjacent rule, and it
  exists because the brief simultaneously bans the cell and demands
  the counter on it; every other NPC in the game keeps all four
  adjacent cells prop-free (asserted in the pass script).
- **Blackout respawn landing:** (4,3) became the counter, so the
  defeat respawn in `battle.mjs` / `overworld-systems.mjs` moves
  one tile south to (4,4) — the Center's own standard landing, used
  by all ten town warps. No test asserted the old cell.

### 6. Audits (Wave 2 non-circular method)

- **Reachability** (`~/workspace/w2fix/audit.mjs`): warp triggers
  **226/229 reachable; unreachable set exactly the pre-existing
  {victoryroad@(17,5), newisland pair}**; single-point scan **0**.
  Door approaches: the only delta vs HEAD is S.S. Anne's eight
  flavor door stamps converted to cabin furniture (110 → 102 door
  cells, all eight formerly approachable; the no-approach set is
  the identical pre-existing 6).
- **Adjacency audit** (NPC-blocked BFS over all 20 dressed
  interiors): every NPC, sign, item and event tile has a reachable
  interaction cell — **ALL PASS**. (First run caught two quiz signs
  whose last free neighbour my podium placements had taken in
  Saffron/Cinnabar; podiums moved one tile, re-audited clean.)
- **Dressing census:** ≥6 distinct prop kinds in **every** dressed
  interior (table in §3); **zero tree tiles** (`#`/`T`) inside any
  of the 20, and zero inside any indoor map that Wave 4 had already
  claimed.
- **Interaction drives** (headless, real bundle): heal over the
  counter from the (4,4) landing restores a hurt party **✓**; PC
  Terminal prompt + response **✓**; talking to Brock starts his
  battle **✓** — 8/8 drive checks.
- **Regen safety:** ART keys **362 → 406 (+44: 17 tileset + 27
  props), zero lost**; build-art run twice = byte-identical.
- **Copies:** every source copy of the 20 interiors carries
  row-identical dressing (Wave 4 discipline), except two
  pre-existing divergent loser copies (maps2 gym-viridian, 10 rows;
  maps2 league, 21 rows — different geometry at HEAD, never the
  merged runtime) which were dressed in place at the same
  coordinates instead of being overwritten with foreign geometry.

### 7. Bytes + battery

- **Bytes:** `art-data.mjs` 330,397 → **352,733 B (+22,336)**;
  `public/game.js` 1,575,864 → **1,606,131 B (+30,267)** — inside
  the 5a guide (~32,000), leaving **14,733 B** of the 45,000 B
  Wave 5 total for 5b. Built vercel+guest only; **personal/
  byte-identical to HEAD** (restored after the battery; content-hash
  personal line restored to the HEAD value). Nothing deployed.
- **Battery (public):** rejuv-phase1 **44/44** · phase2 **42/42** ·
  phase3 **63/63** · phase4 **53/53** · phase5 **55/55** · phase6
  **46/46** · fidelity **35/35** · campaign-smoke **24/24** ·
  audit-headless **17/17** · audit-laptop public **41/41** ·
  verify-slice **48/48** · qa-slice **134/134** · validator test
  **51/51** · validator fuzz **2000/2000** · save-contract **6/6**
  · Track B **114/114** · budgets-check **all gates pass** ·
  contamination **clean** · drift-gate guest ≡ strip(vercel) PASS ·
  qa-changed-flows **55/57, failures exactly the standing baseline
  {b2, d9}**.

### Flags / deviations

- The Mart interior MAP and enterable house interiors are **not**
  in this commit — they are Wave 5b content, per the brief's split.
  The Mart tileset + Mart prop kinds ship now and are exercised by
  the Game Corner dressing.
- The nurse-counter exception and the respawn-landing move (§5)
  are the only gameplay-adjacent touches; both are required by the
  brief's own Center spec and both are drive-proven.
- Prop chars are Greek letters (see §2) — a legend is mandatory
  reading before hand-editing interior rows; it is recorded in
  `tiles.mjs` at the char table.

## World Art Wave 5b — House Interiors + Real Mart Interior (2026-10-28)

Owner rulings executed: (a) every Wave 2 town house enterable,
(b) a real Mart interior replacing the outdoor-clerk arrangement.
Build vercel+guest only; **not deployed**.

### 1. House interiors — 13 of 15 enterable

One shared template family in `src/data/maps4.mjs` (10×7, house
tileset, Wave 5a prop library): four layout variants (bed NW / NE /
W / E) with per-house prop mixes of 7–8 distinct kinds (bed, shelf,
plant, table, chair, stool, rug, sofa; Gary's house swaps the stool
for the PC desk γ). Entry lands at (4,4); the paired exit doors
(4,5)/(5,5) land exactly on the town door's one front tile. Two
shelf signs carry the wave's only new writing (Ash's house, Gary's
house — dressing, no story).

Enterable (door → interior): Pallet (3,3) → house-pallet-ash,
Pallet (11,3) → house-pallet-gary, Viridian (11,3) → house-viridian,
Pewter (3,3) → house-pewter-w, Pewter (12,3) → house-pewter-e,
Cerulean (3,3) → house-cerulean, Vermilion (3,3) → house-vermilion,
Celadon (3,3) → house-celadon-w, Celadon (13,3) → house-celadon-e,
Lavender (3,3) → house-lavender, Fuchsia (3,3) → house-fuchsia,
Cinnabar (3,3) → house-cinnabar, Indigo (3,3) → house-indigo.
Saffron has no Wave 2 house (0 doors) — nothing to enter.

**Exclusions (flag standing):** Vermilion w@(5,11) and Celadon
s@(7,11) — decorative doors on the last interior row, fronts are
the `#` border; the Wave 2 fix-pass finding stands (no clean
footprint nudge). Both houses remain unenterable, as before.

**Enabler:** the single-tile house doors `s`/`w`/`y` were NOT in
WALKABLE (Wave 2 doors were decorative). A full-map scan proves
the three chars occur ONLY as these 15 house doors, so they were
added to WALKABLE as step-warp thresholds (`src/data/maps.mjs`);
the 2 excluded doors stay enclosed by roof/facade/border tiles.

### 2. Resident NPCs — one clear occupant moved; Mom re-staged in place

Association audit from data/dialogue: only ONE resident is clearly
a house's occupant — **AUNTIE MOSS** (Fuchsia): her dialogue names
the house ("My house? The warden borrows it half the year…"). She
now stands inside house-fuchsia at (6,2), same NPC, same lines;
removed from the Fuchsia town scene. Every other house's nearest
NPC is ambiguous (tale givers/witnesses, a trade NPC, the gym
COACH) — nobody else moved; those houses are dressed lived-in.

**MOM (tale-critical) did NOT move indoors** — six-plus test sites
drive her in Pallet, including the real-browser C02. She did need
a two-tile re-stage, (3,4) → (4,5) in `src/data/quests.mjs`: she
stood on her own front-door threshold — the one-tile fence gap
feeding Ash's house, fed only from (3,5) — so any stance in that
column seals the house in the real engine (NPC blocking; the
NPC-free audit cannot see this — the live drive caught it). She
stands beside the gap now, still in front of her house; same map,
same lines, every drive finds her by name. Phase 4 stays 53/53.

### 3. The Mart — one shared interior, 7 towns

`mart` (12×8, Mart tileset) in maps4.mjs, built on the Center
pattern: town doors carry a `via{}` return ticket, exits carry
`viaExit:true` resolving through a new `martReturn` (Center's
`centerReturn` untouched), and `loadMap` fields the ORIGIN town's
clerk behind the goods counter at (5,2) — the Wave 5a over-counter
interaction serves him. Clerk definitions (stock/dialogue source
of truth) stay in the town data; town scenes filter `mart` NPCs
out at load (the Sparring Coach copy pattern — shared MAPS never
mutated). Outdoor clerk arrangement removed in all 7 towns; the
old pitches are plain dressing again.

Towns + exterior placements (Wave 2 Mart facade: `aOc` roof with
bag sign, `P12` facade): Viridian SW (3,8)/(4,8) · Saffron NE
(14,2)/(15,2) · Lavender E (15,8)/(16,8) · Fuchsia SE
(14,10)/(15,10) · Cinnabar W (2,10)/(3,10) · Indigo W (3,8)/(4,8)
· Celadon W (3,10)/(4,10). Pallet/Pewter/Cerulean/Vermilion have
no clerk in the data → no Mart (per the brief's wording).

**Viridian SHOPKEEPER (Phase 4 tale target):** his TALE_NPCS entry
now reads map `mart`, (5,2) — he is fielded in the Mart scene only
for a Viridian entry (any other town fields its own clerk on that
tile). Mom's "south end of town, green apron" line stays accurate
(the Viridian Mart is at the SW/south end). Live drive: tale
accepted at Mom → walked in → delivery over the counter advanced
tale_pallet to stage 1 → exit landed on (3,9). Phase 4 53/53.

**Celadon disposition (traced):** the east block (rows 5–7) is the
Game Corner's exterior — its `12` doors have always warped to
`gamecorner`. There is no Dept. Store interior, clerk, or menu
anywhere in code; the city sign's "Dept. Store" text is flavor,
and Celadon's only shop was the outdoor Atelier clerk. The block
is UNTOUCHED (Game Corner intact); Celadon gets its Mart on the
west side instead. **Placement correction, flagged:** the first
stamp put the Celadon Mart in the SE pocket (rows 9–10, x13–15) —
the non-circular audit + engine both show that pocket is reachable
only through the Mart itself (`S`/`P`/fence seal it), i.e.
unenterable. It was moved west (roof row 9 x2–4, facade row 10
x2–4, fronts (3,11)/(4,11) on the open west street; ELIAS at (5,10)
stands beside it, unmoved) and re-proved. The Atelier clerk serves
indoors with identical stock, Second-Wind Ribbon included.

### 4. Warp audit (Wave 2 non-circular method, rerun)

- 70 maps; warp triggers 284, reachable 281, unreachable exactly
  {victoryroad@(17,5), newisland@(8,10), newisland@(9,10)} — the
  standing set, NOTHING new.
- Door approaches: 144 doors, south-front reachable 84,
  any-adjacent 138, no-approach 6 = the 2 excluded problem doors
  + the 4 pre-existing New Island decorative doors. No new
  no-approach doors.
- Single-point-approach scan: 279 triggers checked, 0 single-point.
- Every new interior un-trappable: house exits reachable from the
  (4,4) landing, Mart exits from (5,5)/(6,5); all exit landings
  verified on door-front tiles by live stepping drives (13/13
  houses, 7/7 Marts — enter, exit, land on the front tile).
- MAP_GROUND gained the 14 new ids (all 'open'; the phase-2 exact-
  coverage law holds). Shared interiors no longer clobber
  `_lastCity` (Fly/Center origin), same guard as `center`.

### 5. verify-live — NO CHANGE (checked, none exists to break)

`scripts/verify-live.mjs` contains no mart/shopping drive at all
(grep-verified: no mart/buy/shop strings; `verify-slice.mjs` none
either). The only mart drives are the rejuv suites, which call
`openMart(stock)` directly and are untouched. Nothing to update;
nothing was weakened or deleted.

### 6. Test-drive updates (flagged, equal strength)

The SHOPKEEPER's move indoors required three drive updates, same
pattern the brief authorizes for verify-live: (1) phase4 A14's
walkable-floor whitelist gains `'$'` (Mart floor — the collision
checks against base NPCs/warps/signs are unchanged); (2) phase4
GAME1 + GAME2 and (3) phase5 GAME7 SHOPKEEPER legs now
`gotoMap('mart', 5, 5)` instead of Viridian — same talkTo, same
assertions. All three suites pass at full count (63/53/55).

### 7. Bytes + battery

- **Bytes:** `art-data.mjs` **352,733 B — byte-identical to HEAD**
  (zero new ART keys; the whole wave's art was 5a's). The 14,733 B
  of art headroom is untouched. `public/game.js` 1,606,131 →
  **1,620,291 B (+14,160)** — map data (14 new maps + town warps/
  facades), the loadMap/onStep Mart wiring, grounds/quests data;
  map data is not art data. Palette unchanged (54, no raise).
  Built vercel+guest only; **personal/ byte-identical to HEAD**
  (restored after the battery; content-hash personal line restored
  to the HEAD value). Nothing deployed.
- **Battery (public):** rejuv-phase1 **44/44** · phase2 **42/42** ·
  phase3 **63/63** · phase4 **53/53** · phase5 **55/55** · phase6
  **46/46** · fidelity **35/35** · campaign-smoke **24/24** ·
  audit-headless **17/17** · audit-laptop public **41/41** ·
  verify-slice **48/48** · qa-slice **134/134** · validator test
  **51/51** · validator fuzz **2000/2000** · save-contract **6/6**
  · Track B **114/114** · budgets-check **all gates pass** ·
  contamination **clean** · drift-gate PASS · verify-audio
  **ALL PASS** · qa-changed-flows **55/57, failures exactly the
  standing baseline {b2, d9}**.
- **Live drives (headless bundle, real warp stepping + real
  counter interaction):** Pallet tale accept → walk to Ash's
  door-front → house in/out (exit lands (3,4)); Viridian Mart walk-
  in → SHOPKEEPER alone behind the counter → delivery advances the
  tale → exit lands (3,9); Saffron Mart buy (Poke Ball, −$200,
  through the quantity stepper, stock list identical to data);
  Celadon Mart (clerk + ribbon stock indoors, exit lands (3,11));
  Fuchsia house (AUNTIE MOSS inside, dialogue served, exit lands
  (3,4)); loops: 13/13 houses and 7/7 Marts enter/exit clean, no
  outdoor clerk remains in any town scene.

### Flags / deviations

- MOM's two-tile re-stage (§2) and the Celadon Mart's west
  placement (§3) are the wave's two judgment calls; both are
  drive-proven and flagged above. MOM does not move indoors;
  Ash's house is dressed lived-in.
- The two problem doors stay excluded (§1); the flag stands.
- Three rejuv drive updates (§6) — flagged, equal strength,
  no check deleted or weakened.
- SHOPKEEPER fields only for a Viridian Mart entry; a scripted
  entry with no return ticket falls back to Viridian (the Center's
  Pallet-fallback pattern).

## World Art Wave 6a — Battle Presentation: The Always-On-Screen Set (2026-10-28)

Source of truth: census §3 (battle rows) + §4 Wave 6a. Scope honored:
battle sprites only — no trainer battle sprites (6b), no arenas (6c),
no engine or balance change. Every sprite below is an original
drawing in the `.pix` pipeline, seeded by the species' identity and
its first-build sprite; authored **64×64** and drawn at
`BATTLER_DRAW_SIZE` 64 on both sides (Wave 0 parity).

### 1. What was drawn — 58 sprites, 29 ids

- **Partner (Pikachu)** front + back redrawn at 64×64: five yellow
  steps (`#ffe98a / #ffdf6b / #f5c93c / #dda01e / #b57a14`, the
  follower's craft standard), shaded ear tips, red cheeks with shade,
  zigzag tail; the back carries the two brown back-stripes, a head
  stripe, cheek-edge wrap and a cream belly peek. 13 colors each.
- **The 13 existing species pairs** redrawn front + back at 64×64:
  caterpie, charmeleon, eevee, geodude, ivysaur, mankey, nidoranm,
  onix, pidgey, rattata, spearow, wartortle, weedle.
- **The 15 front-only species** — fronts redrawn at 64×64 AND backs
  authored new at 64×64 (the front-only trap is closed for them):
  articuno, beedrill, blastoise, butterfree, charizard, flareon,
  jolteon, kakuna, metapod, mew, mewtwo, moltres, vaporeon,
  venusaur, zapdos.
- Every sprite: full-body anatomy, **12–17 painted colors** (min 12,
  median 13 across the 58), ≥3 shades per main surface (five-step
  primary ramps in most palettes), highlight, species personality
  (Charizard's membrane wings + tail flame, Blastoise's cannons,
  Venusaur's open flower, Articuno's crest + ribbon tail, Zapdos's
  jagged crest/wings, Moltres's flame crest/tail, Mewtwo's neck
  connector + curling tail, Mew's long tail + bulb tip, Beedrill's
  lance stingers, Geodude's flexed fists, Onix's crested head
  boulder). Backs are real rear drawings (shell-back dome for the
  turtles, folded feather layers for the birds, segment backs for
  the serpents, ridged cocoon backs, rock-crack backs for
  Geodude/Onix) — never a flipped front.
- Pair completeness: every one of the 29 ids ships front AND back in
  this commit; no front is left back-less. The derived
  `-front-bob` frames regenerate from the new fronts — verified
  row-for-row (each bob = its front shifted 2px down, 28/28
  consistent; partner has no bob, as before — the partner family
  never derived one).

### 2. Species-render audit (the QA yardstick)

Method: for every id in the merged species data (152 = 151 +
partner), hand art ⇔ `ART[id-front]` and `ART[id-back]` both exist;
cross-checked at runtime through `speciesBattleArt` with a stub
document (hand ⇔ no `forgeFallback`).

- **Before:** 14 hand-art ids (partner + caterpie, charmeleon,
  eevee, geodude, ivysaur, mankey, nidoranm, onix, pidgey, rattata,
  spearow, wartortle, weedle) · **138 forge-fallback**.
- **After:** **29 hand-art ids** (the 14 above + the 15 former
  front-only species) · **123 forge-fallback**. Runtime drive
  agrees exactly (hand 29 / forge 123; partner front+back canvases
  64×64 at draw size 64; a 6a foe — zapdos — resolves authored
  front + bob at 64).
- Census §1's "29 fronts + 12 backs / 14 pairs" resolves on disk to
  28 species fronts + partner front, 13 species backs + partner
  back = 14 complete ids including partner; this section's counts
  are the audited disk/runtime numbers.

### 3. Regen safety + bytes

- `build-art.mjs` run twice: **byte-identical** (art-data + all
  atlases). ART keys **406 → 421, zero lost** (the 15 gains are
  exactly the 15 new backs). Only the partner + species atlases
  changed.
- **Bytes:** `art-data.mjs` 352,733 → **669,836 B (+317,103)**;
  `public/game.js` 1,620,291 → **1,937,394 B (+317,103)** — the
  delta is the art segment exactly. Against the Wave 6 budget
  (2,650,000 B for battlers + bobs + arenas), 6a consumes
  **317,103 B**, leaving 2,332,897 B for 6b/6c. The brief's
  ≈220 KB guide assumed ≈45 sprites and no bob growth; the real
  scope is 58 sprites (the 14 complete ids include partner, so
  14×2 + 15×2 = 58) plus 28 derived bobs re-emitted at 64×64 —
  flagged as a guide undercount, not a budget breach (11.9% of the
  Wave 6 budget for the always-on-screen set).
- Per-sprite palette cap 32 respected everywhere (max painted 17);
  no tiles-family interaction (tiles union untouched at 54).
  Built vercel+guest only; **personal/ byte-identical to HEAD**
  (restored after the battery; content-hash personal line restored
  to the HEAD value). Nothing deployed.

### 4. Battery (public)

rejuv-phase1 **44/44** · phase2 **42/42** · phase3 **63/63** ·
phase4 **53/53** · phase5 **55/55** · phase6 **46/46** · fidelity
**35/35** · campaign-smoke **24/24** · audit-headless **17/17** ·
audit-laptop public **41/41** · verify-slice **48/48** · qa-slice
**134/134** · validator test **51/51** · validator fuzz
**2000/2000** · save-contract **6/6** · Track B **114/114** ·
budgets-check **all gates pass** · contamination **clean** ·
drift-gate PASS · verify-audio **ALL PASS** · qa-changed-flows
**55/57, failures exactly the standing baseline {b2, d9}**.

### Flags / deviations

- **load-test expectation update (equal strength):** the tool's
  stale Wave-2 surface table expected battlers at 32×32; the four
  entries this wave redrew (partner-front/back, onix-front,
  geodude-front) now expect **64×64**, the Wave 0 standard. The
  tool still fails exactly its 4 pre-existing HEAD failures (ash /
  pikachu-hop / professor 16×16-era expectations, Waves 3 scope —
  untouched here). All 421 sprites rasterize through the game path.
- **palette-audit standalone tool:** 515/520 with the same 5
  failures as HEAD verbatim (its stale 48 tiles cap vs the
  deliberate 54 in build-art, + 3 water-tile blacklist false
  positives from Wave 1). Not 6a-caused; `audit-results.md` left at
  HEAD rather than committing the tool's rewrite.
- The brief's sprite arithmetic (≈45) and census pair counts are
  superseded by the audited numbers in §2 — 58 sprites, 29 ids,
  forge 138 → 123 exactly as targeted.

## World Art Wave 6b — Battle Presentation: What Players Actually Meet + Trainer Sprites (2026-10-28)

Source of truth: census §3 (battle rows) + §4 Wave 6b. Scope honored:
battle species by encounter priority + battle-scale trainer
presentation — no arenas (6c), no balance change. Every sprite below
is an original drawing in the `.pix` pipeline, seeded by the species'
identity (Part 1) or the character's Wave 3 overworld design (Part 2).

### 1. Part 1 — species (63 new pairs; derivation from data, reproducible)

Derivation rule (run against the merged data tables — SPECIES /
TRAINERS incl. TRAINERS2/3/4 / MAPS — in module order):
- **(a) Boss teams first:** every species on a gym-leader, Elite Four,
  Champion, rival, or story-boss team not already authored. Boss set =
  trainers brock, misty, surge, erika, koga, sabrina, blaine,
  giovanni, lorelei, bruno, agatha, lance, gary_champion,
  gary_cerulean, gary_stanne, gary_tower, gary_silph, gary_r22_final,
  rocket_admin, duo2_vermilion, duo3_celadon, duo4_saffron,
  duo5_island, r2_duo. Result = **48 species**: staryu, starmie,
  voltorb, pikachu, raichu, victreebel, tangela, vileplume, koffing,
  muk, weezing, kadabra, mrmime, venomoth, alakazam, growlithe,
  ponyta, rapidash, arcanine, rhyhorn, dugtrio, nidoqueen, nidoking,
  rhydon, dewgong, cloyster, slowbro, jynx, lapras, hitmonchan,
  hitmonlee, machamp, gengar, golbat, haunter, arbok, gyarados,
  dragonair, aerodactyl, dragonite, pidgeotto, raticate, pidgeot,
  exeggutor, ekans, lickitung, zubat, meowth. (Note: `pikachu` is its
  own species id — Surge's team + Power Plant wilds — distinct from
  the `partner` entry; it was forge until this wave.)
- **(c) Town Tale / event battles:** the tale spar species and the
  Coach's spar partner (overworld-systems taleSpar calls + sparSpecies
  + tale_kid's team) not already covered: **machop** (Coach spar +
  Saffron Dojo tale), **oddish** (tale_kid). (geodude/meowth were
  already covered by 6a/(a).) = **2 species**.
- **(b) Wild encounter tables**, weighted: Tier A = Routes 1–10 +
  moon1/moon2 tables, species scored by summed table weight; then
  Tier B = all remaining maps by summed weight. Tier A ranking:
  bellsprout 75, sandshrew 60, paras 35, magnemite 25, abra 21,
  nidoranf 15, vulpix 12, nidorina 10 (tie with nidorino 10 broken by
  lower dexNo, 30 < 33), jigglypuff 8, clefairy 5. Took Tier A ranks
  1–8 (bellsprout, sandshrew, paras, magnemite, abra, nidoranf,
  vulpix, nidorina), then Tier B top 2 among the remainder: gastly
  175, graveler 50. = **10 species**.
- Derived total = 48 + 2 + 10 = **60 exactly as briefed**. Three
  further species were authored in the same pass because the queue
  continued into them and the art was already in hand: jigglypuff
  (Tier A #9), clefairy (Tier A #10), venonat (Tier B #3, weight 44).
  **Wave total = 63 new species, 126 sprites**, all front+back pairs
  in this commit, all 64×64, **12–17 painted colors each (min 12,
  mean 13.6)**, ≥3 shades per main surface (five-step primary ramps),
  backs as genuine rear drawings (Sandshrew's armor-brick back,
  Growlithe/Arcanine dorsal stripes, Nidorina/Nidoqueen/Nidoking
  spine-spike rows, Raichu's cream back stripes, Starmie's rear star,
  Cloyster's shell-back dome, Tangela's vine back, Muk's sheen mass…).

### 2. Part 2 — trainer battle presentation (16 figures + Ash)

- **16 battle-scale trainer sprites authored fresh at 48×64**
  (≥12 colors each, 13–18 actual), drawn at 64 tall by the existing
  Wave 3b intro path, palettes and designs faithful to each
  character's Wave 3 overworld sprite (same hex families): Brock
  (open vest, squint eyes), Misty (side ponytail), Lt. Surge (broad,
  dog tags), Erika (long hair, sash, skirt), Koga (magenta scarf),
  Sabrina (long hair, chest gem), Blaine (bald + mustache), Giovanni
  (suit + red tie), Lorelei (long red hair), Bruno (open top + belt),
  Agatha (bun + cane), Lance (cape), Gary (pendant), Gary-Champion
  (cape + medallion), Rue, Cole (uniform, epaulettes, chest patch).
- **Legacy art replaced in place under the same keys** — `brock-battle`
  (was 32×48 thin) and `gary-battle` (was 32×32) redrawn at 48×64; no
  key retired (both keys have exactly one consumer each,
  trainerBattleArt, plus the load-test size table, updated below).
  14 new keys: misty/surge/erika/koga/sabrina/blaine/giovanni/
  lorelei/bruno/agatha/lance/garychamp/rue/cole `-battle`.
- **Resolution** (`trainerBattleArt`, shared by both engines' intro
  path): by trainer id first (23 battle identities), name second,
  Gary family fallback by id-prefix/title. Gary's five rival battles
  → gary-battle; gary_champion (or title Champion) → garychamp-battle.
  The uniformed duo resolves per its two data identities: r2_duo
  ('Rue & Cole') → Rue; duo2–duo5 ('Mara & Jules', the same pair
  under cover names) → Cole — both sprites reachable in real battles.
  Runtime drive: **23/23 identities resolve at 48×64; zero generic
  trainers leak** (all other TRAINERS entries still return null and
  keep the graceful battler fallback).
- **Ash's battle back redrawn** at 48×64 under `ash-battle-back`:
  cap from behind, hair, jacket, green backpack + straps, right arm
  raised mid-throw with the ball in hand. Drive: 48×64.

### 3. Species-render audit (the QA yardstick)

Same method as 6a (hand ⇔ ART front+back both exist; cross-checked
at runtime through `speciesBattleArt` with a stub document):
- **Before:** 29 hand-art ids · **123 forge-fallback**.
- **After:** **92 hand-art ids · 60 forge-fallback** (the 60 remaining
  are 6c's roster). Runtime drive agrees exactly; every hand front/
  back canvas is 64×64 and every non-partner hand id resolves its
  derived `-front-bob` at 64×64. Pair completeness: 92/92 ids ship
  front AND back (pix fronts 91 + partner, zero fronts missing a
  back).

### 4. Regen safety + bytes

- `build-art.mjs` run twice: **byte-identical** (art-data + all
  atlases). ART keys **421 → 624, zero lost** (gains = 126 species
  sprites + 63 derived bobs + 14 trainer keys; Brock/Gary/Ash redrawn
  in place). Per-sprite palette cap 32 respected (max painted 18).
- **Bytes:** `art-data.mjs` 669,836 → **1,651,317 B (+981,481)**;
  `public/game.js` 1,937,394 → **2,920,753 B (+983,359** = the art
  segment +1,878 of trainerBattleArt resolution code). Against the
  Wave 6 budget (2,650,000 B): 6a consumed 317,103, 6b consumes
  981,481 art bytes — **1,351,416 B remain for 6c** (60 species pairs
  + 60 bobs + 15 arena treatments; at 6b's measured ~5.2 KB per
  battler/bob unit the roster alone projects ≈940 KB, so 6c fits
  with arena headroom — flagged for the 6c brief, not a breach).
- Built vercel+guest only; **personal/ byte-identical to HEAD**
  (restored after the battery; content-hash personal line restored
  to the HEAD value). Nothing deployed.

### 5. Battery (public)

rejuv-phase1 **44/44** · phase2 **42/42** · phase3 **63/63** ·
phase4 **53/53** · phase5 **55/55** · phase6 **46/46** · fidelity
**35/35** · campaign-smoke **24/24** · audit-headless **17/17** ·
audit-laptop public **41/41** · verify-slice **48/48** · qa-slice
**134/134** · validator test **51/51** · validator fuzz
**2000/2000** · save-contract **6/6** · budgets-check **all gates
pass** · contamination **clean** · drift-gate PASS · verify-audio
**ALL PASS** · qa-changed-flows **55/57, failures exactly the
standing baseline {b2, d9}**.

### Flags / deviations

- **Three species beyond the derived 60** (jigglypuff, clefairy,
  venonat — the next three in the same reproducible queue, §1):
  forge lands at **60**, not ≈63. The derived 60 are covered in
  full, boss-team coverage is 48/48; reported plainly per the brief.
- **Track B not run to a verdict in this environment:** `tests/`
  npm test crashes with ECONNREFUSED ::1:5432 (the pg-stub hook does
  not intercept here) — **identically at HEAD (c8dceba)** in a clean
  worktree, so it is a pre-existing environment failure, not a 6b
  regression. 6b touches no api/ or tests/ code.
- **load-test (equal-strength update):** `brock-battle` expectation
  updated 32×48 → **48×64** (the Wave 6b battle-scale standard). The
  tool still fails exactly its 4 pre-existing HEAD failures (ash /
  pikachu-hop / professor 16×16-era expectations); 620/624 sprites
  rasterize through the game path.
- **palette-audit standalone tool:** 894/900 with **the same 5
  failing checks as HEAD verbatim** (stale 48 tiles cap vs the
  deliberate 54, + water-tile blacklist false positives from Wave 1;
  totals grew with the sprite count). One transient 6th failure
  during the wave (a palette char whose rows spelled a blacklisted
  token) was fixed at the source; `audit-results.md` left at HEAD
  rather than committing the tool's rewrite.
- **Duo resolution split** (Rue via r2_duo, Cole via duo2–duo5) is a
  presentation choice forced by the data's two names for one pair;
  documented in the art.mjs comment and §2 above so QA grades
  against the stated map.

## World Art Wave 6c — Battle Presentation: Full Roster + Arenas (2026-10-28)

Source of truth: census §3 (battle rows) + §4 Wave 6c. Scope honored:
the remaining forge-fallback roster + per-Ground arena art — no
field-logic, balance, or state change. This wave closes Wave 6 and
the census's battle rows.

### 1. Part 1 — the remaining roster (60 species, 120 sprites)

- **Enumeration from the render audit, not memory:** hand art ⇔
  `ART[id-front]` + `ART[id-back]` both exist in the merged species
  data (152 = 151 + partner). At wave start: **92 hand / 60 forge**.
  The 60: bulbasaur, charmander, squirtle, fearow, sandslash,
  nidorino, clefable, ninetales, wigglytuff, gloom, parasect,
  diglett, persian, psyduck, golduck, primeape, poliwag, poliwhirl,
  poliwrath, machoke, weepinbell, tentacool, tentacruel, golem,
  slowpoke, magneton, farfetchd, doduo, dodrio, seel, grimer,
  shellder, drowzee, hypno, krabby, kingler, electrode, exeggcute,
  cubone, marowak, chansey, kangaskhan, horsea, seadra, goldeen,
  seaking, scyther, electabuzz, magmar, pinsir, tauros, magikarp,
  ditto, porygon, omanyte, omastar, kabuto, kabutops, snorlax,
  dratini.
- **All 60 authored front + back at 64×64** in the `.pix` pipeline:
  full-body anatomy per species (Bulbasaur's bulb + spots,
  Charmander's flame tail, Squirtle's shell, Cubone/Marowak skull
  masks, Magneton's three magnet spheres, Tentacruel's tentacles,
  Dratini's serpent coils, Snorlax's belly), five-step primary
  ramps (≥3 shades per main surface + highlight), **12–17 painted
  colors each (min 12, mean 13.2 across the 120)**. Backs are
  genuine rear drawings — shell domes (Squirtle/Omanyte/Kabuto),
  dorsal panels/stripes/spots, back-of-head masses, no faces —
  never flipped fronts. Pair completeness: 60/60 ship both sides;
  the 60 derived `-front-bob` frames regenerate from the new fronts.

### 2. Species-render audit — THE audit of the mission

Same method as 6a/6b, cross-checked at runtime by driving
`speciesBattleArt` (stub document) over **all 152 ids + the partner
path**:

- **Before:** 92 hand-art ids · **60 forge-fallback**.
- **After:** **152/152 hand-art ids · 0 forge-fallback.** Runtime
  drive agrees exactly: every id resolves authored front + back
  (front ≠ back canvas) + `-front-bob` (partner: front/back 64×64,
  draw size 64; partner never had a bob, as before).
- **Forge reachability for species art = 0.** `forgeSprite`'s only
  remaining consumer is the `speciesBattleArt` fallback branch in
  `src/engine/art.mjs`, which no species id in the data can reach
  any more (proven by the drive above). The separate
  `forgeHumanoid` painter still legitimately serves the NPC
  fallback in `npcFrames` (non-species, unchanged from Wave 0/3).

### 3. Part 2 — arenas (15/15 Grounds)

- Battles backdrop onto the shared `drawArena` (battle.mjs;
  battle-rt.mjs calls the same prototype method, so **both engines
  render the treatment** — classic horizon 0.42 and RT horizon
  0.22 alike). Wave 6c adds `ARENA_ART`: one entry per Ground in
  `src/data/grounds.mjs` (open, bloom, storm, mire, grave, ember,
  frost, tide, rubble, mind, venom, volt, marsh, pyre, spirit),
  each a palette set (6 sky/wall bands + 6 ground bands + dark /
  light / accent) + a horizon motif + a ground texture, composed
  at draw time from rects/strips through `arenaHash` — **texture
  composition, zero raster assets**. The arena follows
  `battle.field` exactly as resolved at battle start; no
  field-logic changes.
- **Motifs:** trees (open), flowers (bloom), storm clouds +
  lightning (storm), reeds (mire/marsh), tombstones (grave/
  spirit), flame tongues (ember/pyre), snow drifts + ice spikes
  (frost), wave crests + reef (tide), rock teeth (rubble),
  floating rune crystals (mind), mushroom silhouettes (venom),
  storm + pylons (volt). Aliases sharing rules still carry
  distinct treatments (volt ≠ storm, marsh ≠ bloom, pyre ≠ ember,
  spirit ≠ mire/grave palettes). **Textures:** tuft, petal, spark,
  chunk, fleck, foam, bubble ground speckle per Ground.
- **Drive proof:** `drawArena` driven for all 15 fields at both
  horizons through the built bundle — **15/15 distinct fill
  signatures in classic AND in RT**, 14–15 distinct colors per
  arena. Tide (foam blues) vs Pyre (charcoal + flame orange) vs
  Grave (dusk purple + tombstones) are unmistakable.
- **Tint call (documented):** the Phase 2 flat tint wash drops
  from 0.13 to **0.05** when a per-Ground treatment is on screen
  (the art now carries the field identity); legacy no-field calls
  keep 0.13. The GROUND chip, banner text, and all field
  information the player had are unchanged. One preserved legacy
  case: Open-Ground *trainer* battles keep their sandy tournament
  floor palette (the sky/horizon treatment still applies).

### 4. Regen safety + bytes

- `build-art.mjs` run twice: **byte-identical** (art-data + all
  atlases). ART keys **624 → 804, zero lost** (gains = 120 species
  sprites + 60 derived bobs). Per-sprite palette cap 32 respected.
- **Bytes:** `art-data.mjs` 1,651,317 → **2,527,237 B
  (+875,920)**; `public/game.js` 2,920,753 → **3,807,029 B
  (+886,276** = the art segment + 10,356 of arena code).
  **Arena cost: 10,356 B total for all 15 Grounds ≈ 690 B per
  Ground all-in** (table + motif/texture painters), far under the
  ~25 KB/Ground guide.
- **Against the Wave 0 projection (art-data 2,542,105 /
  game.js 3,742,979):** art-data lands **UNDER by 14,868 B**;
  game.js lands over by 64,050 B — the overage is code (this
  wave's arena painters + earlier waves' presentation code), not
  art. **Against the hard ceilings:** art-data 2,527,237 <
  3,000,000 internal art ceiling (472,763 spare); game.js
  3,807,029 ≪ 12,582,912 budgets gate. **Wave 6 budget
  (2,650,000 B): total consumed 2,186,738** (6a 317,103 + 6b
  983,359 + 6c 886,276, game.js basis) — 463,262 spare. 6c used
  886,276 of its 1,351,416 remaining — no flag needed, it fit.
- Built vercel+guest only; **personal/ byte-identical to HEAD**
  (battery full-builds restored; content-hash personal line
  restored to the HEAD value). Nothing deployed.

### 5. Battery (public)

rejuv-phase1 **44/44** · phase2 **42/42** · phase3 **63/63** ·
phase4 **53/53** · phase5 **55/55** · phase6 **46/46** · fidelity
**35/35** · campaign-smoke **24/24** · audit-headless **17/17** ·
audit-laptop public **41/41** · verify-slice / qa-slice
**134/134** · validator test **51/51** · validator fuzz
**2000/2000** · save-contract **6/6** · Track B **114/114** via
its DOCUMENTED invocation (`node --import ./register.mjs run.mjs`
in `tests/`; the bare `npm test` script omission is pre-existing
and was not treated as a failure) · budgets-check **all gates
pass** · contamination **clean** · drift-gate PASS · verify-audio
**ALL PASS** · qa-changed-flows **55/57, failures exactly the
standing baseline {b2, d9}**.

### Flags / deviations

- **audit-laptop first run read 40/40, clean re-run 41/41** —
  the known fixed-sleep cascade signature under sandbox load
  (register standing note); the re-run is the verdict.
- The Wave 0 game.js projection is exceeded by 64,050 B on code
  growth while art itself lands under projection — reported
  plainly; both hard ceilings hold with wide margins.

## World Art Wave 6 — Summary (6a + 6b + 6c, mission close)

- **Species:** 14 hand-art ids at Wave 6 open → 29 (6a) → 92 (6b)
  → **152/152 (6c)**. Forge-fallback species: 138 → 123 → 60 →
  **0**. Every species entry (151 + partner) resolves authored
  64×64 front + back (+ derived bob) through `speciesBattleArt`;
  pair completeness 152/152; the forge painter has zero runtime
  reachability for species art.
- **Trainers:** 16 battle-scale figures + Ash's back (6b), all
  reachable in real battle intros in both engines.
- **Arenas:** the striped void is gone — **15/15 Grounds** carry
  distinct palette + motif + texture treatments in classic and
  RT battles (6c), following `battle.field` with no field-logic
  change.
- **Final numbers:** ART keys 406 → **804** (zero lost across the
  whole wave; build-art byte-identical on re-run at every step).
  `art-data.mjs` 352,733 → **2,527,237 B** vs the Wave 0
  projection 2,542,105 (under by 14,868). `public/game.js`
  1,620,291 → **3,807,029 B** vs projection 3,742,979 (over by
  64,050, code growth; budgets gate 12,582,912 and the 3.0 MB
  art-data ceiling both hold). Wave 6 budget 2,650,000 B:
  consumed 2,186,738, spare 463,262.
- **Battery at close:** identical green state at every sub-wave —
  full public battery green, qa-changed-flows failures exactly
  the standing baseline {b2, d9}, personal/ byte-identical
  throughout, nothing deployed by the implementer.

## Battle Model Mission — ADR-026 (2026-10-28, mission close)

Owner rulings (2026-10-28): (A) classic turn-based is THE main
battle — ADR-020's RT-as-default gate resolved negatively after the
owner playtested RT and rejected its feel (foe beelines, attacks not
firing on press, foe movement reading as beams of light). RT is
retained as a selectable OPTIONAL legacy mode, untouched. (B) Owner
complaint: "when I defeat a Pokemon it keeps giving me option to
choose another Pokemon" → Shift/Set option added, DEFAULT = SET.

- **WP1 default flip:** settings.battleStyle default 'rt'→'classic'
  (state.mjs, schema fill, Options row unchanged in spirit). Stored
  values are NEVER rewritten: a save with 'rt' stored keeps 'rt'
  (code-verified through schema fill + the whole-payload sync merge;
  New Game / Second Journey carry the settings object wholesale, so
  a carried style is the player's own stored preference). Options
  gains exactly one row (Switch style) — row-count-sensitive suites
  (audit-laptop, phase1) verified green.
- **WP2 Shift/Set:** settings.switchMode 'set'|'shift' (state
  default, schema fill for all pre-existing saves → 'set', server
  validator `bad-setting:switchMode`, Options toggle with toast).
  Investigation (pre-change, both engines): NEITHER engine prompted
  on a foe KO — classic afterFaintFoe sent the next foe immediately,
  RT routed through the same path; the only switch menu was the
  genre-mandatory forced menu on an ALLY faint (S-12 cancel-reopen
  untouched). The owner's recurring interruption was that forced
  menu in RT, where his mons faint fast (~9s idle-KO). Shift flow
  (classic only; gated off for RT/wild/tutorial/friendly/last-foe/
  no-legal-target): faint → KO'd foe's XP (genre order) → prompt
  exactly once → Yes opens a voluntary no-turn party menu (Back
  re-presents the prompt menu; the prompt line fires exactly once
  per KO; switched-in mon is the sole participant for the incoming
  foe) → send-out + cry → command. Set XP totals byte-identical.
- **P0 (OWNER-REPORTED, 2026-10-28):** "the Pokemon doesn't die
  even if I keep pushing it… my damage is 20 and his health is 30
  and if I attack twice it gets stuck at the 10 HP." Hunt with
  instrumented sweeps in both engines: the standard damage paths,
  hpAnim, seeded drain, Counter/Bide/recoil, Substitute, and the
  keepsake rulings-patch (Tortoise Charm / Iron Acorn — CLEARED with
  traces; the fault does NOT touch the keepsake patch or the
  battle-freeze fix) were all proven clean. Three real defects in
  the reported family, each reproduced pre-fix and pinned by
  regressions (battle-model-checks Part C):
  1. Seismic Toss + Night Shade dealt ~5/hit instead of level
     damage in BOTH engines — both moves declare `fixedLevel` at
     move top level (like ohko/charge, which are read top-level)
     but the engines read only `efx.fixedLevel`. A Lv20 Seismic
     Toss took a 30-HP foe to 25, not 10, and crawled from there
     while the foe won by attrition. Fix: `efx.fixedLevel ||
     mv.fixedLevel` in both engines.
  2. Tutorial endure went silent: the lesson foe clamps at 1 HP by
     design, but the catch hint showed only on the FIRST endured
     KO — later lethal hits clamped silently, reading as an
     immortal foe that could win by attrition. The hint now
     repeats on every endured KO; the endure is unchanged.
  3. RT physical lunge whiffs were silent: PP + cooldown spent out
     of range, no damage, no message. The whiff geometry is
     unchanged; it now floats "Too far away!" (the feedback the
     status-move range check already gave).
  Plus hardening: BattleScene.updateResolve() was called by
  update()'s state switch but never defined — a no-op now exists
  (resolution is message-driven; no driven flow reaches the call).
- **P1 (OWNER-REPORTED, 2026-10-28):** "when I got defeated after
  leaving Pallet Town, I was sent to the health center, and when I
  got OUT I was right where I was defeated." Root cause:
  loadMap('center') overwrote centerReturn with _lastCity — the
  player's tile snapshotted when the previous map loaded. The
  warp-in door-front anchor (each town door's `via`, verified
  walkable in all 9 Center towns) was clobbered by its own loadMap,
  and both blackout paths load 'center' directly (no warp), so the
  exit anchored to the faint site (reproduced headlessly: exit
  landed route1 (7,7)). Fix: loadMap never touches centerReturn;
  the via also persists as story.lastCenter (save-fill sanitized,
  server-validated); one centerExit() resolver (runtime ticket →
  persisted anchor → Pallet fallback) serves the exit warp, both
  blackout paths, and the Escape Rope (whose landing tile thereby
  becomes the door-front — same town). Reload-inside-a-Center
  covered by the persisted anchor. Regressions: battle-model
  Part E. Note: Pallet and Pewter have no Center building in the
  authored world (unchanged world data, observed not altered).
- **WP3 classic presentation (FLOW/PACING/STRUCTURE only):** census
  at ~/workspace/ashs-journey-qa/battle-classic-census.md (observed
  sequences: wild 14 beats, trainer Set 14, trainer Shift 16, catch
  7, run 3, defeat 7; per-stage verdicts; feedback spec table;
  research disposition; art-thin notes for the follow-up art
  mission). Elevations: hitstop 70ms + faint beat 450ms implemented
  as message DISMISSAL HOLDS (a press during a hold is remembered,
  never eaten; the say() chain stays synchronous — the first cut's
  deferred-chain design was caught by rejuv-phase3 stalling
  callback-driven flows and redesigned, commit d544974); trauma
  screenshake (0.28/0.35/0.55 + 0.25 crit, KO ~×1.35 attack-only);
  universal impact flash; HP-drain 600ms cap; send-out cry with the
  send-out line; SELECT Ground readout (exact live factors + twist
  + stat stages; grid stays 4 commands). No damage/AI/catch/XP
  numbers changed; RNG order/count in resolution unchanged.
- **WP4 parity + battery:** headless parity harness 9/9
  (~/workspace/ashs-journey-qa/battle-parity-log.txt): defaults,
  Bloom banner + Recover +50% twist in classic, Tortoise Charm in
  classic, Story −2 (Oddish 13→11), Fast Learner ×1.5 XP, real spar
  win + candy in classic, Cerulean tale battle, Brock gym battle.
  New suite tests/battle-model-checks.mjs 45/45 (defaults/saves/
  validator, Set/Shift flows + XP semantics, RT regressions, P0
  Part C, WP3 Part D, P1 Part E, Shift edge gates Part F). Full
  battery green: rejuv 1–6 (44/42/63/53/55/46), fidelity 35,
  campaign-smoke 24, audit-headless 17, audit-laptop public 40,
  verify-slice 48 + qa-slice 134, validator 51 + fuzz 2000/2000 +
  save-contract 6, Track B integration 114; qa-changed-flows fails
  EXACTLY {b2, d9} (standing baseline). verify-live: zero
  expectation changes (it never selects a style; its seeded save
  stores 'rt', preserved by design). personal/ byte-identical.
  Nothing deployed.

## Cinnabar Trap — owner-reported bug (2026-10-28, mission close)

Owner report: reached Cinnabar Island "at the beginning of the game"
and could not get back. Investigation + proof drives at
~/workspace/ashs-journey-qa/cinnabar-trap.md (drivers
cinnabar-proof-driver.mjs / cinnabar-regression-driver.mjs, shots in
cinnabar-proof-shots/).

- **Root cause 1 (early access):** the Pallet Town FERRYMAN
  (maps3.mjs, (10,8), `ferry: 'cinnabar'`) — his dialogue claims the
  crossing is "for trainers who've earned the sea legs — and the
  badges", but the `npc.ferry` handler in overworld-systems.mjs
  checked NOTHING: talk → "Sail to cinnabar?" → island, in the first
  minutes of a fresh game. Live-proven: fresh save (badges [],
  no Surf/Fly) sailed Pallet → Cinnabar in 3 steps + 2 talks.
- **Root cause 2 (stranding):** Cinnabar had NO return leg — CAPT
  SALT carried no `ferry:` (dialogue only, live-proven). Fly is
  Thunder-Badge + visited-gated; and the land route home dead-ends:
  full-graph reachability (engine WALKABLE set + warp graph) from
  Fuchsia reaches 31 south-east maps but never Pallet/Viridian —
  Route 11 has no east exit (its only warp returns to Vermilion;
  the Vermilion↔Route 12 link the Town Map draws does not exist in
  the warp data) and Celadon's Route 8 gate sits in a sealed pocket
  (sibling S1, below). Healing on Cinnabar even anchors the blackout
  respawn there. Stranded — as reported.
- **Fix:** the ferry handler now enforces `ferryGate: 'surf'` —
  the game's own Surf rule (Soul Badge + a party member that knows
  Surf, the same pair sysInteract checks at the water's edge).
  FERRYMAN's def carries the flag; refusal plays as dialogue ("Come
  back with the Soul Badge in your case and a partner who knows
  Surf — then we sail."), no menu. SAILOR BRINE (→ S.S. Anne)
  untouched. CAPT SALT gains `ferry: 'pallet'` with NO gate —
  **NO-SOFT-LOCK LAW (new standing regression): every reachable map
  must have a reachable exit using only the tools the player provably
  has there; anyone standing on Cinnabar, including a legacy save
  with no Surf, can always sail home.**
- **Regressions (live drives, 9/9):** R1 fresh save refused (no
  menu, refusal names the rule, still in Pallet); R2 Surf-equipped
  save sails Pallet → Cinnabar AND returns via CAPT SALT; R3 a
  stranded no-badge save seeded on Cinnabar escapes via CAPT SALT
  → Pallet (7,7) — the owner's own rescue path.
- **Battery:** build OK; qa-changed-flows fails EXACTLY {b2, d9}
  (standing baseline); campaign-smoke 24/24; fidelity 35/35;
  battle-model 45/45; rejuv 1–6 (44/42/63/53/55/46); Track B
  integration 114/114; verify-slice 134/134; audit-headless 17/17;
  audit-laptop (public) 39/39 standalone (base A/B 40/40; an earlier
  15/29 run was the documented parallel-contention flake, disproven
  on re-run); budgets PASS; contamination clean; audio ALL PASS.
  Drift gate FAILS identically on the pristine base commit — the
  retired personal edition is deliberately stale there; personal/
  byte-identical in this change, as in the ADR-026 mission.
- **Sibling S1 (reported, NOT fixed here):** Celadon City is
  fragmented — entering from Route 7, the live engine reaches only
  32 tiles (gym + east-house doors, way back); the Center, Mart,
  Game Corner, Route 8 gate (17,9) and Route 16 gate (0,4) are
  unreachable (NPC at (11,8), bare `n` plinth at (12,9), Game Corner
  door-fronts opening into the sealed pocket). Live-proven by
  cinnabar-celadon-probe.mjs. Pre-existing dressing-era progression
  break; not a one-way trap (Route 7 exit works) and not on the
  Cinnabar route — queued for its own mission.
- **Sibling audit (clean):** S.S. Anne exit warps → Vermilion ✓;
  New Island exit warps → Vermilion, arrival story-gated ✓; Seafoam
  exits → Route 20, entry already behind the same sea gate ✓.
  Nothing deployed (parent ships).

## Celadon Fragmentation — S1 fixed + Saffron same-class (2026-10-28, mission close)

Owner-visible progression break found via the Cinnabar investigation
(sibling S1), fixed on base `dd83d3a`. Full investigation, fragment
maps, and proofs at ~/workspace/ashs-journey-qa/celadon-fix.md
(probe `celadon-diag-probe.mjs`, sweep `celadon-sweep.mjs`, walking
driver `celadon-regression-driver.mjs`, shots in `celadon-fix-shots/`).

- **Root cause 1 (the seam):** Celadon's east↔west street junction
  tile (5,4) — where the column-5 gym path meets the row-4 street —
  is a decorative lamp `o` (solid). One dressing tile split the city
  in two: entering from Route 7 the live engine reaches only 32 tiles
  (gym + east-house doors, way back); the Center, Mart, Game Corner,
  house-w, and both other gates are unreachable. From Route 16 the
  mirror image (80 tiles; gym/east-house/Route 7 unreachable). Every
  QA suite seeds positions per-map, so no suite ever walked in and
  tried to cross — the same blind spot as the Cinnabar trap.
- **Root cause 2 (residual seal, live-only):** the Route 8 gate
  (17,9) has exactly one approach tile, (16,9), and the tale NPC
  GARDENER (quests.mjs TALE_NPCS, appended by loadMap) stands
  permanently on it. Map-data models cannot see him — the
  coordinator's static BFS counted the gate as reachable from the
  west; the live engine proved it sealed (and that entering FROM
  Route 8 lands the player on the NPC's own tile).
- **Fix (3 one-token changes):** Celadon (5,4) `o`→`.` in
  maps2.mjs (the junction is floor again; five lamps remain);
  GARDENER (16,9)→(15,9) in quests.mjs (same row, beside the gate;
  his talk-driven tale is found by name everywhere — no coordinate
  references exist); Saffron (11,4) `o`→`.` in maps3.mjs (below).
  Untouched: gym sign (6,3), fences (2,4)/(4,4), HOSTESS (11,8),
  fence (12,9).
- **All-cities sweep (same defect shape):** pallet, viridian,
  pewter, cerulean, vermilion, lavender, fuchsia, cinnabar all PASS
  (one fragment, every warp from every entry, engine-faithful NPC
  model). **Saffron FAILED with the identical class:** the Silph Co.
  plaza is a 17-tile pocket sealed from the 101-tile city by two
  street lamps on row 4, (6,4) and (11,4) — Silph's doors were
  enterable only by suites seeding inside. Fixed here with the same
  minimal shape (east lamp (11,4) opened; one suffices, sweep-proven).
  Live-engine confirmed both cities before and after.
- **Verification:** post-fix live-engine BFS — Celadon every entry
  114 tiles / all 13 warps; Saffron every entry 119 tiles / all 13
  warps (parley-window variant also PASS). Walking regressions
  25/25 (boot on Route 7, NO seeding inside Celadon: Center, Mart,
  Game Corner, Gym doors in+out; Route 8 exit + walk back in; Route
  16 exit; bonus Saffron set from Route 9 incl. Silph doors in+out).
  Full battery: build OK; qa-changed-flows fails EXACTLY {b2, d9}
  (standing baseline); campaign-smoke 24/24; fidelity 35/35;
  battle-model 45/45; rejuv 1–6 (44/42/63/53/55/46); Track B
  114/114 (documented --import invocation; plain `npm test` omits
  the flag in this checkout — pre-existing harness quirk, unrelated);
  verify-slice 134/134; audit-headless 17/17; audit-laptop 41/41
  standalone; budgets PASS; contamination clean; audio ALL PASS;
  drift gate PASS on the full build. personal/ byte-identical.
- **Queued (different class, NOT fixed):** the missing Route 11 ↔
  Route 12 warp link the Town Map draws (missing connection, not a
  sealed region — the west ↔ south-east land route stays broken at
  the graph level; parent's call). Nothing deployed (parent ships).

## Cheat Terminal — owner-ordered feature + override + canon expansion (2026-10-28)

- **Feature (owner order: "everything free, including all kinds of
  Pokémon including legendary"):** a free CHEAT TERMINAL NPC
  (`cheat: true`, in-world name "CHEAT TERMINAL") in Pallet at (6,4),
  beside the lab PC TERMINAL at (5,4), and in the shared Pokémon
  Center interior at (6,2), beside its PC at (7,2) — one edit covers
  every Center (maps3.mjs). Dispatch rides the existing NPC chain in
  overworld-systems.mjs (`if (npc.cheat)` beside `npc.pc`/`npc.mart`).
  `openCheatShop()`: top menu [Get Items · Get Pokémon · Leave] — no
  Sell, no money anywhere (the shop never reads or writes
  player.money; proven by test B05). Item sections by pocket: Balls /
  Medicine / Items / TMs / HMs / Key Items / Badges / Keepsakes /
  Collectibles. Rows read `Name — $0 (own N)`. Quantity rides the
  shared pickQty stepper — EXTRACTED from openMart into a prototype
  method (openMart keeps a same-named local alias; behaviour
  byte-identical, mart suites green). Claims clamp to the server
  validator's 999 bag cap (grant = min(qty, 999 − owned); at 999 the
  shop toasts instead of overflowing). Keepsakes claim through
  grantKeepsakeFromSource with the row disabled once owned, so the
  dupe→$2,000 conversion is unreachable from the shop.
- **Get Pokémon:** dex-idiom picker (No. + name, owned ✓), forms
  grouped under their base species, level stepper 1–100 opening at
  50, destination Party (row disabled at 6) or PC Box. Generation is
  the gift path verbatim (makeMon: all-31 IVs, last-4 learnset moves;
  dexRegister 'caught'). PC delivery is CAP-SAFE — deliberately NOT
  giftMon (its blind push into currentBox can overflow the ≤30/box
  validator rule): first box with space wins, the toast names it, and
  an all-boxes-full refusal mutates ZERO state (test B19 snapshots the
  whole state JSON).
- **OWNER OVERRIDE — badges, key items, fossils stocked:** badge
  claims write the exact leader-award representation (the
  `boulderbadge`…`earthbadge` id pushed into state.badges.kanto +
  the `badge_<name>` story flag; battle.mjs remains the only other
  push site, no parallel representation). DEVIATION, forced by the
  server validator: badges must be a PREFIX of the canonical earn
  order, so claiming badge #N also grants any missing earlier badges
  in earn order — a literal single-badge push would have made
  non-prefix claims unsavable. Already-owned badge rows are
  disabled/no-op. Key items stock as ordinary pocket:'key' items.
  Fossils grant the ITEM only — the shop never sets fossil_taken
  (Mt. Moon's choice event owns the flag; Cinnabar's revive reads the
  bag, so a shopped fossil revives identically and the choice event
  stays live; test B11).
- **Canon expansion (anime/book canon, absent from game data; all
  writing/art ORIGINAL to this project):**
  - Five FORMS in the partner pattern (own speciesId, SHARED dexNo,
    `form: true` + baseSpecies, FORMS index entries): Crystal Onix
    (Rock/Ice — our documented take: the crystal body sheds Onix's
    Fire weakness while Water still strikes the Rock half; Defense
    traded for Special shine), Pink Butterfree, Surfing Pikachu
    (knows Surf), Flying Pikachu (knows Fly, Electric/Flying), Giant
    Dragonite (oversized stats). Form entries are excluded from the
    dex lists and diploma counts exactly like `partner`, so the
    species count for honors and the 151 Kanto diploma threshold do
    NOT move (tests A13/B23/B24). Art: palette variants of this
    game's own original base sprites (surfboard/balloons hand-drawn
    additions), authored in the .pix pipeline.
  - Five FULL SPECIES, National dex only: Togepi (175), Marill
    (183), Snubbull (209), Donphan (232), Ho-Oh (250). Types, base
    stats, catch rate, growth and base XP verified against PokeAPI
    at build time (facts source only — no sprite files used);
    learnsets restricted to this game's move table; dex flavor
    written for this project; NO evolution entries (deliberate —
    claims arrive as themselves). Original .pix front+back art
    authored for this project; the art pipeline accepts all 20 new
    sprites (834 total).
  - Four ITEMS with no game system to hook, honestly labeled
    COLLECTIBLES in name, shop section and description, no fake
    effects: GS Ball, Pinkan Berry, Mini-Misty Lure, Rainbow Wing.
- **Validator symmetry:** tables regenerated via
  tools/api-scripts/gen-tables.mjs (never hand-edited): species
  152→162, items 126→130, keepsakes 12→12, forms 197→202.
  tests/cheat-shop-checks.mjs (44 checks) proves both terminals
  reachable from a fresh save through the real NPC path, $0 claims
  with money untouched, the 999 clamp, keepsake claim-once, species
  claims (party/PC/party-full/box-full-zero-mutation), Mewtwo, every
  expansion entry claimable, the diploma threshold, and
  validateSave passing on a MAXIMAL-stock save (every badge + every
  item @999 + every keepsake + every species) built through the real
  claim paths. Bundle rebuilt for the public (vercel) target only;
  personal/ untouched. NOT deployed (parent ships).

## World Fixes Q1 — the missing Route 11 ↔ Route 12 warp link (2026-10-28, mission close)

Queued by the Cinnabar Trap and Celadon Fragmentation missions:
the Town Map draws a Vermilion ↔ Route 12 link, but the warp data
never had it — Route 11's east edge was walled (its only warp
returns to Vermilion) and Route 12 had no west exit.
**Precision correction (independent QA, 2026-10-28):** the
south-east cluster was NOT fully stranded at base — Route 12
remained reachable via Lavender's south warps and via
Route 15/Fuchsia. The true defect was the dead-end spur at
Route 11's east edge, Route 12's sealed west edge, and the
Town Map's false link; all three are fixed by this entry.

- **Fix (data only, mirrors the existing Vermilion ↔ Route 11
  edge-warp idiom — warp on the border tile, landing one tile
  inside):** maps2.mjs `route11` (18×11): row y=5 last tile (17,5)
  `#` → `.`, warp (17,5) → route12 (1,5). maps3.mjs `route12`
  (16×14): row y=5 first tile (0,5) `#` → `.`, warp (0,5) →
  route11 (16,5). Both landings — (16,5) on route11, (1,5) on
  route12 — were already `.`. y=5 is the junction latitude, just
  north of Route 12's Snorlax bridge (ev_snorlax_east at (8,7)).
- **Shadowed copy (noted, deliberately untouched):** maps2.mjs
  also defines a `route12`, but merge.mjs assembles
  `Object.assign(MAPS, MAPS2, MAPS3, MAPS4)` — later wins, so the
  maps3 def is the effective one and the only one edited.
- **Proof (data-level reachability):** BFS over the merged map
  data (engine WALKABLE set + static NPC blocking + warp graph,
  interiors as connectors) from Fuchsia AND from Cinnabar each
  reach 68 maps / 7,290 tiles, including Pallet, Viridian,
  Vermilion, route11 and route12; both new warp tiles and both
  landing tiles are walkable. (Pre-fix graph model reached only
  the 31-map south-east cluster from Fuchsia.) fidelity's
  "every map reachable from Pallet" check also passes.
- **Battery (run once on the combined Q1+D1 tree, HEAD
  `8cd434b`):** build OK (vercel + guest); qa-changed-flows fails
  EXACTLY {b2, d9} (standing baseline); campaign-smoke 24/24;
  fidelity 35/35; battle-model 45/45; cheat-shop 44/44; rejuv
  1–6 (44/42/63/53/55/46); Track B integration 114/114;
  verify-slice 134/134; audit-headless 17/17; audit-laptop
  (public) 41/41 standalone; budgets PASS; contamination clean;
  audio ALL PASS; drift PASS. Bundles rebuilt (vercel + guest
  targets only); personal/ untouched. NOT deployed (parent
  ships).

## World Fixes D1 — fleeing completed legendary/event arcs (2026-10-28, mission close)

Filed by Cheat Shop QA as D1; pre-existing at `8855b5e`.

- **Root cause:** battle.mjs's endBattle contract is
  `onEnd(won, fled)` — every escape path (RUN / Teleport / Safari
  run / foe fled) ends the battle won=true AND fled=true, and
  consumers must check `fled` (ADR-025 QA D1 comment at the
  contract site; correct precedents: the coach spar and taleSpar
  consumers, both `won && !fled`). But runSteps' `s.wildBattle`
  branch in overworld-systems.mjs was
  `onEnd: (won) => { if (won) next(); }` — it ignored the fled
  half of the contract, so fleeing a scripted wild battle
  advanced the event chain straight into its completion steps
  (arc complete / story flags / questDone) without a fight.
- **Fix (one site, the root):**
  `onEnd: (won, fled) => { if (won && !fled) next(); }`, plus a
  comment citing the contract. Semantics: flee or lose stalls
  the chain before its completion steps, so runEvent's
  `ev_<id>_done` never writes (it fires only when a chain runs
  off the end) — the event re-fires on re-entry and can be
  fought properly, and the arc stage stays wherever the
  pre-battle steps left it ('active'). Catch/KO still end
  won=true, fled=false and advance exactly as before.
- **Affected events — every `wildBattle` step in
  story-kanto.mjs (the complete list; all share the defect
  shape; all fixed by the single root fix):** ev_mewtwo
  (arc_mewtwo, Mewtwo Lv70), ev_zapdos (arc_zapdos, Lv50),
  ev_moltres (arc_moltres, Lv50), ev_articuno (arc_articuno,
  Lv50), ev_movie_climax (arc_mew, Mew Lv50), ev_snorlax_east
  (Snorlax Lv30), ev_snorlax_west (Snorlax Lv30), ev_tower_ghost
  (Marowak Lv30, uncatchable).
- **Sibling verdict — `s.battle` (trainer) branch: SAFE BY
  CONSTRUCTION, deliberately unchanged.** Trainer battles
  cannot be fled in either engine. Classic: the RUN row is
  disabled when `kind !== 'wild'`, and onCommand('run') vs a
  trainer only says "Can't escape a trainer battle!" and
  returns to the command menu (no fled, no endBattle); Teleport
  (the flee effect) succeeds only when `kind === 'wild'`, vs a
  trainer it reports "But it failed!". RT: the RUN row is
  disabled when `kind !== 'wild'`, the SELECT run shortcut is
  gated `kind === 'wild'`, and rtApplyEffect's flee is gated
  `kind === 'wild' && side === 'ally'` — rtTryRun is reachable
  only through those wild-gated paths. Safari run / foe-fled
  are wild/Safari-only. The branch's other consumer,
  recordBattleBond, already returns early on `fled`
  defensively.
- **Battery:** same full battery as the Q1 entry above (run on
  the combined tree) — all suites at standing numbers,
  qa-changed-flows failing exactly {b2, d9}. Bundles rebuilt
  (vercel + guest targets only); personal/ untouched. NOT
  deployed (parent ships).

## Premium+ Art Wave W0 — Foundations+ (2026-10-28, mission close)

Pipeline + rig + designs only — **zero player-facing change**: no shipped
map, sprite, or battle behaviour differs from base `8e10c72`. Built by the
W0 implementer; NOT committed by the implementer (coordinator commits
after independent QA). Spec: `~/workspace/ashs-journey-qa/premium-art-spec.md`
§4 W0 row, §5 budget, §7 risks.

- **1 · Layered delta-frame format (`.deltapix`).** Sources carry header
  `PIXD <id> <base-id> <w> <h>`, per-pixel overrides `<x> <y> <char>`
  ('.' erases), and a `PAL` section with ONLY keys the base lacks.
  `pix.mjs` gains `parseDeltaPix` / `materializeDeltaRows` /
  `mergedDeltaPal`; `build-art.mjs` materializes deltas AFTER derived
  bobs (so a delta may target a derived frame) and emits compact ART
  entries `{base, w, h, pal:{new keys only}, deltas:[[x,y,char],…]}`
  (plus `ART_META.delta_frames` and conditional `delta_of` in the atlas
  JSON); `src/engine/art.mjs` gains exported `materializeArt(id)` —
  full entries return identity, zero behaviour change. Proof frame:
  `pidgey-front-blink.deltapix` (base `pidgey-front`; its only 3 white
  eye-glint pixels → dark eye tone): **120 B vs the base's 4,875 B
  (2.5%)**. Clean rebuild: **834 baseline ART keys → 836, 0 lost, 0
  existing blocks changed** (per-key sha256 block hashes), byte-stable
  across rebuilds; the 2 additions are `pidgey-front-blink` and
  `tile-grassground` (item 5). Not wired to any presentation.
- **2 · FX registry (`src/engine/fx.mjs`, GENERATED — regenerate, don't
  hand-edit).** Generator + audits live in the QA rig (below). **144
  move rows** (`MOVE_FX`), measured census **59 physical / 34 special /
  51 status** across 15 types — the spec §1 estimate of ≈61 physical is
  corrected on the record. **62 definitions** in the spec taxonomy:
  15 type kits, 8 contact archetypes, 12 status visuals, 20 signature
  effects, 7 condition overlays; definitions are parameter stubs
  (colors/shape/travel/impact/duration/truncate ≈65%/particle caps)
  for W1 to author. `fxPlanForMove(move)` layers signature > status
  visual/condition > contact archetype > type kit; Splash resolves to
  `kit.normal` (documented — it has no type effect to kit). Coverage
  audit proves 144/144 moves resolve and **62/62 definitions are
  reachable** through some plan layer (8 have no primary move but are
  plan-reachable: kit.bug/fighting/ground/rock, cond.burn/freeze/
  sleep/seeded). No battle code consumes the registry yet — zero
  behaviour change.
- **3 · Animation QA rig (`~/workspace/ashs-journey-qa/premium-rig/`).**
  `frame-sampler.mjs` (CDP Fetch-mirror of the local build under
  production CSP; state-machine guest boot; in-page canvas sampling at
  120 ms steps), `audit-fx-coverage.mjs`, `audit-art-census.mjs`,
  `audit-palette-use.mjs`, `audit-grassground.mjs`,
  `gen-fx-registry.mjs`. **Smoke run on the W0 build: PASS, 0 JS
  errors.** Overworld Route 1 idle (full frame): 20 frames, **9
  distinct poses**, meanAbsDiff 0.203, mean changed fraction 0.17%.
  Wild battle foe battler region: 20 frames, **10 distinct poses**,
  meanAbsDiff 19.98, mean changed fraction 10.8% — the AN-1 baseline:
  the foe's sine + derived front-bob are measurably alive today.
  (Region note: battle.mjs draws the foe at [230, 10+bob, 64, 64] in
  the 384×216 layout; the Wave 0 register's [151, 6] was the 256×192
  layout.)
- **4 · Budget decisions executed.** Art-data ceiling **3.0 MB →
  5.5 MB**, now enforced as a build constant
  (`ART_DATA_CEILING_BYTES` in `build-art.mjs` — before W0 the 3.0 MB
  figure existed only in docs; no script enforced it). Tiles palette
  cap **54 → 72** at every site: `build-art.mjs`
  `FAMILY_PALETTE_BUDGETS.tiles`, `assets/sprites/tools/palette-audit.mjs`
  (which was stale at 48 through the whole 54 era — the "existing
  palette audit" had silently diverged from the build), and
  `assets/sprites/README.md`, which also records the **hybrid
  battler-idle plan** (152 authored back-bobs + priority accents as
  delta frames + procedural classes for the rest; full-authored
  +2.0–2.3 MB documented as fallback; no lazy-load pack) and notes
  the old "any bundle ≤ 4.2 MB" tripwire is superseded by the §5
  projection (game.js ≈6.0 MB at mission end; the 12 MB hard gate
  governs) — a recorded decision, not a silent weakening. Palette
  audit re-run under the new cap: **tiles PASS, union = 54 hexes**
  (the actual current max). The audit's only remaining failures are
  3 PRE-EXISTING slop-blacklist hits in `tile-water-1/2/3.pix`
  (proven present at HEAD; W0 does not touch water art).
  Census under the new ceiling: art-data **2,672,490 B** (baseline
  2,671,763; +727 B for the two new entries).
- **5 · `grassground` tile kind (TX-1 prerequisite).** New char `_`
  wired end-to-end: `TILE_CHARS` + `paintTile` fallback
  (`src/engine/tiles.mjs`), `WALKABLE` (`src/data/maps.mjs`),
  `TILE_ART` + grass-family membership + a dedicated
  `resolveTileLayers` case (own tile + building shadow strip + path
  dirt-edges, NEVER tall — `isTallGrass` covers kind `grass` only)
  in `src/engine/art.mjs`, and hand-authored art
  `pix/tiles/tile-grassground.pix` reusing ONLY existing grass hexes
  (tiles union stays 54). **Placement decision: NO cell placed in any
  shipped map** (proof over placement). `audit-grassground.mjs` PASS:
  wiring present, resolver returns the 5-layer stack on a stub doc,
  **0 `_` cells across MAPS/MAPS2/MAPS3/MAPS4**, and encounter-inert
  by code path — every encounter source tests exact chars (overworld
  grass `','`, safari `','`, surf `'~'||'W'`, cave `'.'||'R'`); no
  path tests `'_'`.
- **6 · Engine designs (docs only)** in
  `~/workspace/ashs-journey-qa/premium-designs/`: `y-sort-draw.md`
  (LD-3, W5 — sort pass in `OverworldScene.render`),
  `time-of-day-tint.md` (LD-2/P-3, W5 — phase from the existing clock,
  flat overlay + lit-window layer swaps), `npc-wander-phase.md`
  (AN-4, W4 — per-instance phase via the `hashTile` family into
  `Game.npcFrame`, opt-in `wander` data, hash-stepped directions,
  never `g.rng.*`/`Math.random`), `warp-fade.md` (TX-6/PL-1, W7 —
  single `performWarp` choke point, ~110 ms + ~110 ms black fade,
  reducedMotion collapses to instant). Each carries hook points,
  data changes, settings gates, and its determinism argument.
- **Spec assumptions W0 proved wrong, on the record:** (a) §1 move
  split ≈61 physical — measured 59/34/51. (b) §1 ART census 804 keys
  was taken at `aa13a96`; base `8e10c72` carries 834 (battle-model
  mission growth). (c) `palette-audit.mjs` enforced 48 while the
  build enforced 54. (d) The 3.0 MB ceiling was documentation-only
  before W0. (e) The sprites README's "any bundle ≤ 4.2 MB" line is
  incompatible with §5's own ≈6.0 MB end-state projection.
- **Battery (this tree, serial):** build OK (vercel + guest, and full
  3-target) · qa-changed-flows fails EXACTLY {b2, d9} ·
  campaign-smoke 24/24 · fidelity-checks 35/35 · battle-model-checks
  45/45 · cheat-shop-checks 44/44 · rejuv-phase1–6 44/42/63/53/55/46 ·
  Track B 114/114 · verify-slice 134/134 · audit-headless 17/17 ·
  budgets-check PASS · contamination-scan clean · verify-audio ALL
  PASS · drift-gate PASS (guest ≡ strip(vercel)) · **audit-laptop
  (public): zero failures in four full clean runs (40/40 ×2, 39/39
  ×2)** — the counted total varies because the suite conditionally
  skips (never fails) a terminal auto-focus check when its waitFor
  takes the retry branch; three further runs hit the known
  fixed-sleep cascade starting at "Dex opens from the pause menu"
  on the IDENTICAL tree that also produced the clean runs, i.e. the
  standing environmental signature, not a W0 regression (nothing in
  W0 touches those flows). Recommend the coordinator's QA re-run
  audit-laptop once on a quiet machine for the full-count line.
  **game.js (public, vercel target) = 4,021,068 B** vs the
  12,582,912 B gate. personal/ untouched (restored byte-identical
  after the full-build suites; `git status --porcelain personal/`
  empty; content-hash carries guest+vercel lines only).

## Premium+ Art Wave W1 — Battle Impact (2026-10-28, mission close)

Built on W0 HEAD `8ed572e`; NOT committed by the implementer
(coordinator commits after independent QA). Spec:
`~/workspace/ashs-journey-qa/premium-art-spec.md` §3.2 (FX-1/2/4/5/6)
+ §4 W1 row (growth cap ≤120 KB). Public edition only; $0, no
installs; all art original (hand-authored `.pix` or code-defined
procedural rects/pooled particles — no shadowBlur, no gradients, no
per-frame allocations in hot paths).

- **Step 0 — inventory (shipped vs added).** The battle-model mission
  had already shipped in `src/game/battle.mjs`: hitstop **70 ms**
  (`_nextMsgHold` on the damage line), trauma shake (0.35 ordinary /
  0.55 super-effective / 0.28 resisted, +0.25 crit, KO ≈0.47 via
  +0.12 — offset = 12px × trauma², decay 2.2/s), universal impact
  flash (every damaging hit white-swaps; flashT 60 SE / 90 crit),
  600 ms HP-drain cap, 450 ms faint beat, SELECT Ground readout.
  Those values are the shipped feedback table and were **consumed,
  not rebuilt — no shipped timing value was changed** (they sit
  inside the spec's research ranges; where they differ, e.g. a flat
  70 ms hitstop vs the audit's 40/80/130 tiers, the shipped table
  won per the re-base rule). What did NOT exist: any move-effect
  system (0 presentations for 144 moves), knockback (0px), tiered
  white-swap (fixed 66 ms), immune/miss visuals, condition visuals
  on battlers, send-out/recall animation, per-ball art (two flat
  circles ×5 types), entry variants (one overworld flash), catch
  settle/break-out. W1 added exactly that visual layer.
- **FX-1 — effect system.** `src/engine/fx.mjs`: all 62 definitions
  authored for real (status/contact/condition rows left the W0
  white/grey stubs: distinct ≥3-colour palettes + named silhouettes
  each; signatures carry `scale: 2` with 800 ms/48 particles vs kit
  360 ms/24). ONE shared player in the classic engine
  (`fxStartMove`/`fxTick`/`fxSpawn` in battle.mjs): pooled particles
  (fixed pool of 60 preallocated objects, rects only), travel +
  impact-burst per plan layer (signature > status > contact > kit,
  via `fxPlanForMove` — the only routing). Damaging, status, immune
  and miss paths all route through it. Every sequence carries its
  def's marked `truncateMs` (≈65%): a consecutive repeat of the same
  move by the same side plays the truncated cut (live-proven: a
  repeated Tackle resolved at 195 ms vs 300 ms full). Durations
  ≤600 ms standard, ≤900 ms signatures. New rig audit
  `premium-rig/audit-fx-presentation.mjs`: **144/144 moves
  presentable, no move resolves to "no effect"**, all wiring +
  caps + balls verified from data/source — PASS (W0's registry
  audit also still PASS 144/144, 62/62).
- **FX-2 — impact visuals on the shipped timings.** Knockback
  4/8/12 px (ordinary / SE-or-crit / KO) with 40 ms out + ease-out
  return by 200 ms; contact recoil 2 px; white-swap tiered 66 ms
  ordinary / 110 ms SE-crit (`impactFx.dur`, default unchanged);
  flinch = the knockback displacement itself; immune hits get a
  dull grey puff + 2 px nudge (no flash, no trauma); misses get a
  defender sidestep; multi-hit moves burst once per hit
  (`_fxHits`). 100% gated by `fxAnimsOn()` = battleAnims on AND
  reducedMotion off (shake setting still gates shake only, as
  shipped): with anims off or reduced-motion on, no sequence, no
  particles, no displacement, no entry motion — battles play
  exactly as at base (battery suites drive both modes green).
- **FX-4 — condition overlays.** All 7 (burn embers, poison
  bubbles, paralysis sparks, sleep Zzz, freeze ice shell, confusion
  stars, seeded vines) render persistently on the battler while the
  condition holds (status / `confused` / `seeded`), rects only,
  phase-driven by the theater clock (deterministic, no RNG). In RT
  too — the shared `drawConditionOverlay` rides both RT battlers.
- **FX-5 — send-out / recall / catch + balls.** Send-out on EVERY
  entry (battle start both sides, trainer next-mon incl. the Shift
  send-out, player switch-in): ball arc ≤250 ms → release burst →
  materialize scale-in ≤200 ms (total ≤500 ms; cries were already
  synced to the send-out lines by WP3 and are unchanged). Recall
  (switch-out + catch absorb) shrinks/beams the battler ≤250 ms,
  replacing the bare white swap; the absorbed foe leaves the field
  into the ball. **6 ball sprites** authored as `.pix`
  (`pix/ui/ball-{poke,great,ultra,master,safari,gs}ball.pix`, 16×16,
  own palettes; `ballBattleArt` in art.mjs) used at throw / settle /
  shakes / send-out / RT flight, with a same-palette procedural
  rect fallback for headless draws. The two-flat-circles placeholder
  is at **0 call sites in both engines** (grep + audit). Catch: ball
  drops and settles (≤2 bounces, 260 ms) BEFORE the shakes;
  break-out bursts the ball open in its own colours. Faint (660 ms
  sink+fade) retained unregressed.
- **FX-6 — battle entry.** 4 transition variants resolved from
  battle context at enter(): wild (terrain-tinted shutter — grass /
  water / cave / indoor via `arenaKind()`), trainer (blinds), boss
  (leader/E4/Champion/rival: white accent flash — the bare flash
  survives ONLY here — + gold/black chevron bands + VS divider
  beat), scripted-legendary (violet wash + contracting rings).
  Arena reveal is sequenced backdrop (wipe) → entrances (FX-5) →
  plates (the shipped 450 ms slide) — no hard cut. Exit mirrors
  entry as a ≤300 ms closing wipe over the victory/defeat beat.
  Wipes: wild 500 ms / trainer 600 ms / legendary 800 ms / boss
  900 ms (inside the 1,400/2,200 ms trigger→control budgets, whose
  remaining span is the pre-existing player-paced intro text).
  Reduced-motion collapses all variants to a 200 ms fade.
- **RT disposition.** Shared-path only, per the standing owner
  decision: RT projectiles now draw their move's type-kit travel
  element (the projectile already carried its move object), RT
  catch/flight balls use the ball sprites, and condition overlays
  ride RT battlers. No separate RT investment: no RT effect player,
  no RT send-out/entry system (RT's arena entry is its own).
- **Frame evidence** (`premium-rig/frame-sampler-w1.mjs`, live
  Chromium drives of the local build): **PASS, 0 JS errors** —
  animated entry in 4/4 cases (battle start: variant `wild` +
  foe/ally entry FX observed; switch: entry + recall both observed;
  trainer next-mon: `trainerIdx` 1 + foe entry after the KO; catch:
  phase order throw → settle → shakes recorded live); signature vs
  kit vs contact measurably different (Flamethrower seq 800 ms/48
  particles vs Ember 360 ms/24 vs Tackle 300 ms/18, pooled live
  counts 22–26, knockback dist observed); burn overlay persists
  across turns (foe region 20/20 distinct poses at turn N and N+1,
  status still `burn` after the turn). W0 sampler smoke re-run:
  PASS (foe region 9 distinct poses, meanAbsDiff 20.46).
- **Battery (this tree, serial):** build OK (vercel + guest) ·
  qa-changed-flows fails EXACTLY {b2, d9} · campaign-smoke 24/24 ·
  fidelity 35/35 · battle-model 45/45 · cheat-shop 44/44 · rejuv
  1–6 (44/42/63/53/55/46) · Track B 114/114 (documented invocation
  `node --import ./register.mjs run.mjs`; the bare `npm test`
  script omits the register flag in this checkout — pre-existing) ·
  verify-slice 134/134 · audit-headless 17/17 · audit-laptop
  (public) zero failures on the clean re-run (40/40 — the suite's
  total is 40 or 41 depending on its conditional auto-focus check;
  independent W1 QA also ran 40/40 clean, first attempt; earlier
  runs on either side hit the known fixed-sleep cascade from "Dex
  opens from the pause menu", the standing environmental
  signature) · budgets PASS ·
  contamination clean · audio ALL PASS · drift PASS (personal
  restored byte-identical afterwards). FX audits PASS (above).
  **Sizes:** art-data 2,672,490 → **2,675,692 B (+3,202 B** of the
  ≤120 KB W1 cap — the 6 ball sprites; everything else is code) ·
  ART keys 836 → **842, clean rebuild loses 0 keys** (byte-identical
  md5 across rebuilds) · `public/game.js` **4,052,809 B** vs the
  12,582,912 B gate. personal/ untouched (`git status` clean).
- **Spec assumptions W1 proved wrong / notes:** (a) BALLS holds 5
  ball types, not 6 — the 6th sprite is the GS Ball (an existing
  item ball), so ≥6 per-ball sprites exist without inventing a new
  ball type. (b) The shipped hitstop is a flat 70 ms, not the
  audit's 40/80/130 tiers — consumed as shipped per the re-base
  rule; the tiering W1 added lives in the visuals (knockback /
  white-swap durations), not in rewritten timings. (c) RT
  projectiles already carried their move object, so kit travel
  elements WERE a genuinely shared path and landed; RT send-out
  was not shared and was left alone. (d) `fx.mjs` definitions are
  now hand-authored — the W0 generator must not be re-run over
  FX_DEFS (header updated; MOVE_FX/MOVE_ARCH rows remain
  generator-owned). No verify-live expectation was changed.

## Premium+ Art Wave W2 — Battle Life, Arenas & Trainers (2026-10-28, mission close)

Built on W1 HEAD `5211544` (verified, tree clean at start); NOT
committed by the implementer (coordinator commits after independent
QA). Spec: `~/workspace/ashs-journey-qa/premium-art-spec.md` §3.1
AN-1, §3.3 AR-1..5, §3.3b TR-1..4, §4 W2 row (art-data growth cap
≤950 KB) + `premium-battle-audit.md` §2.1/2.4/2.6. Public edition
only; $0, no installs; all art original (hand-authored `.pix` /
`.deltapix` or code-defined procedural rects — no shadowBlur, no
gradients, no per-frame allocations, hash/phase determinism). W1's
shipped timings (hitstop/shake/drain) untouched.

- **AN-1 — battler idle life.** (a) **Back-bob parity 162/162**: a
  bob is a pure 2px shift of the base pose, so `build-art.mjs` now
  derives every back's bob as a SHIFT-delta art-data entry
  (`{ base, shiftY: 2 }`, ~60 B) instead of a full frame (~4.5 KB) —
  all 162 backs (161 species + partner) cost ~10 KB, and the partner
  front (the one front the species-family derivation never covered)
  gains its bob the same way: front-bob 162/162, back-bob 162/162
  (was 0). `materializeArt` resolves `shiftY`; atlases pack the
  materialized frames as usual. (b) **4 idle classes in DATA**:
  `src/data/idle-classes.mjs` — a literal 162-row assignment
  (grounded 83 / hover 31 / serpentine 20 / inert 28) from body plan
  + types with a hand override list (floaters, flightless birds,
  sleepers/objects), plus `IDLE_CLASS_PARAMS`: measurably different
  amplitude/rate per class (hover 3.4px @1050ms + flap swaps @525ms;
  serpentine 3.2px lateral @1800ms; grounded 1.6px @2400ms; inert
  1.0px @3200ms + accent window). The class mechanism is procedural
  motion in `battle.mjs idleMotion()` over the authored frames,
  per-species phase-hashed (no two battlers sync). (c) **Accent
  frames: 60 most-seen species × front+back = 120 `.deltapix`**
  (blink 56 authored across the set's fronts, flame/wing flicker 15,
  accent twinkle for the rest — recolor-only deltas, so silhouette-
  preserving by construction; 4,951 delta pixels total pre-trim,
  120 files shipped). (d) **Contact shadows** (`contactShadow`):
  a dark pool on the disc, distinct from the disc, narrowing/fading
  as the battler's idle offset rises and widening as it settles.
  **Rig proof** (`premium-rig/frame-sampler-w2.mjs`, live Chromium):
  in 2.4s idle captures (20 frames), distinct poses — rattata
  (grounded) 16–19, zubat (hover) 19–20, gyarados (serpentine
  swimmer) 20, snorlax (inert) 16, charizard ALLY BACK (hover) 20 —
  every case ≥4 with wide margin.
- **AR — arenas.** (a) AR-1: **≥5 layers per Ground** — the far
  silhouette band (own palette step: deepest sky tone darkened,
  hashed ridge rhythm per Ground) and the foreground overlay
  (bottom-edge fringe in the field's dark/accent) join sky / horizon
  motif / ground plane for all 15, extending the code-defined
  ARENA_ART pattern (no rasterised arenas). (b) AR-2: **ambient
  layer on 15/15** (`ARENA_AMBIENT` + `drawArenaAmbient`): embers
  rise on pyre/ember, petals on bloom/marsh, rain on storm, snow on
  frost, bubbles on venom, sparks blink on volt/rubble/mind, motes
  on open/mire/grave/tide/spirit — phase-varied by arenaHash,
  static-scatter when the motion gate is off. Rig: ground-strip
  series on pyre/bloom/volt show 19–20 distinct frames with
  ~10% max changed fraction. (c) AR-3: rig one-shot arena hashes
  **pairwise distinct 15/15**; no two Grounds share both palette
  family and motif class (the shared motif classes — storm/volt,
  mire/marsh, ember/pyre, grave/spirit — are separated by palette
  family AND by ambient kind AND by disc tint). (d) AR-4: the
  rocks/tombs/runes speckle is confined to a 12px band above the
  horizon; rig sky-purity check (plate/battler-free sky window,
  distance-based) finds **0 non-sky pixels** on grave/rubble/mind/
  spirit. (e) AR-5: `ptDisc` is Ground-tinted (light top, ground
  steps, dark base, accent rim line from the field palette) on all
  15 — the single beige disc is gone; contact shadows sit on top.
- **TR — trainer presentation.** (a) TR-1: **104/104** — 14 authored
  trainer-class figures (48×64 `.pix`: youngster, lass, bugcatcher,
  camper, hiker, swimmer, gent, beauty, psychic, acetrainer,
  fisher, biker, grunt, engineer) resolve by class through the new
  pure `trainerArtKind()` (named id/name → title keywords → id/name
  keywords → youngster default); the named 16 keep their sprites.
  Proof: `premium-rig/audit-trainer-coverage.mjs` enumerates all
  four trainer tables (8+48+39+9 = 104) — **PASS, 104/104 present a
  figure** (44 entries resolve to named figures across the tables,
  60 to class figures; all 14 classes used), each with throw +
  defeat pose deltas present in ART. (b) TR-2: figures **slide in
  380ms ease-out** with the plate slide (foe from the right, Ash
  from the left) and **throw**: while a side's intro send-out ball
  is in flight its figure swaps to its throw-pose delta (31 throw
  deltas — named 16 + Ash's back + 14 classes) and the FX-5
  ball arc originates from the figure's hand position. Rig: Cal's
  intro shows figure+throw resolved, foe entry running, 14 distinct
  poses across the slide window. (c) TR-3: **ceremony tier** — boss
  entry variant (8 leaders + 4 Elite Four + Champion + rival =
  ≥15 identities) opens on a VS beat: letterbox bands, gold
  divider, both figures large, name/title card, held ~1.15s across
  the intro. Rig probe on a live scene: `_vsActive` true under the
  boss variant, false under the route variant — measurably
  different entries. (d) TR-4: on victory the foe trainer returns
  in its **defeat pose** (30 defeat deltas: sweat + closed-glint
  treatment) with a 3px slump, drawn instead of the foe battler
  for the lose dialogue.
- **Settings gates.** Every new motion (idle classes, ambient,
  slide, throw swap, VS beat) runs through the W1 `fxAnimsOn()`
  gate: battleAnims off or reducedMotion on ⇒ static base poses,
  static ambient scatter, figures at rest, no VS beat — battles
  play exactly as at base. RT keeps its shipped idle (shared-path
  only, per the W1 precedent); its discs pick up the Ground tint
  through the shared `ptDisc`.
- **Frame evidence:** `frame-sampler-w2.mjs` **PASS** (all six
  cases, 0 JS errors — idle poses, arena identity 15/15, sky
  purity 0 bad, ambient ×3, trainer slide+throw, boss VS probe);
  W1 rig re-run on this tree: **PASS** (all six W1 cases — no FX
  regression); FX audits PASS (144/144, 62/62); clean art rebuild
  byte-identical md5 (1200 ART keys, loses 0).
- **Battery (this tree, serial):** build OK · qa-changed-flows
  fails EXACTLY {b2, d9} · campaign 24/24 · fidelity 35/35 ·
  battle-model 45/45 · cheat-shop 44/44 · rejuv 1–6
  (44/42/63/53/55/46) · Track B 114/114 (documented invocation) ·
  verify-slice 134/134 (one W2-caused failure found and fixed
  during the run: the VS title line briefly used 14px-floor-
  violating 11px text — now 14px) · audit-headless 17/17 ·
  budgets PASS · contamination clean · audio ALL PASS · drift
  PASS · **audit-laptop: the Dex-first fixed-sleep cascade on all
  three runs on this machine (17/31, 16/30, 16/31) — and the
  CONTROL run at untouched base `5211544` in a clean worktree
  fails identically (16/40, same first failure), i.e. the standing
  environmental signature documented at W0/W1, NOT a W2
  regression; recommend the coordinator's QA re-run once on a
  quiet machine for the zero-failure line.** personal/ restored
  byte-identical afterwards (`git status` clean there).
- **Sizes:** art-data 2,675,692 → **2,825,867 B (+150,175 B** of
  the ≤950 KB W2 cap — 120 accent deltas + 14 class figures + 61
  pose deltas + shift-bob entries; everything else is code) · ART
  keys 842 → **1200** · `public/game.js` **4,227,786 B** vs the
  12,582,912 B gate.
- **Independent QA verdict (coordinator addendum):** items 1–9
  PASS — AN-1 pose counts (14–20 distinct per battler, ally back
  included), arena layers/ambient on all 15, **AR-3 blind test
  15/15 from arena art alone**, sky purity 0 bad pixels, discs
  Ground-tinted with no floaters, trainer coverage 104/104 with
  organic figure drives, VS beat ≥800ms boss-only, defeat beat
  live, settings gates total, battery green — and **audit-laptop
  standalone on a quiet run: 41/41 PASS, zero failures**, closing
  the implementer's open item above (the cascade is the standing
  load-dependent signature, not a W2 regression). QA's only FAIL
  was this entry's own three numbers, corrected in place
  (1200 keys, game.js 4,227,786 B, 31 throw deltas).
- **Spec assumptions W2 proved wrong / notes:** (a) The spec's
  battler census (152 pairs, §1/§3.1) is stale: the roster at W1
  HEAD is **162 battler pairs** (161 species-dir pairs + partner;
  front-bobs were already 161, not 151). W2 covered all 162 and
  the class table has 162 rows, not 152. (b) The trainer census
  (104) is exact, but 8 definitions carry NO title (maps3/4 route
  trainers) — resolution needed the id/name-keyword tier, not
  title alone. (c) BALLS-style surprise, trainer edition: the duo
  battles and Gary's six battles make "named" resolutions 44 of
  the 104 table entries (leaders repeat across tables), so class
  figures carry 60 entries, not ~81 — the ≈81 figure counted
  unique battles at the old HEAD. (d) The AR-4 sky-purity check
  cannot be an exact-hex test: the renderer's non-integer backing
  scale blends band edges by a few units per channel, so the rig
  check is distance-based (speckle sits >60 channel-distance from
  every sky tone; blends sit <10). No verify-live expectation was
  changed.

## Premium+ Art Wave W3 — World Life: Motion (2026-10-28, implementer entry — pending independent QA)

**Scope:** spec §3.1 AN-2/AN-3/AN-5/AN-6 + §4 W3 row (art growth cap
≤220 KB over the W2 close of 2,825,867 B). Public edition only; no
commits (coordinator commits after independent QA); **zero map-data
edits** (`git diff` on `src/data/maps*.mjs` is empty — tiles/art/engine
only, per the wave's hard gate).

- **AN-5 · Environment motion (55 units).** The world no longer runs
  on one global 600ms clock. A hash/phase animation clock
  (`animFrame` in `src/engine/art.mjs`) drives **≥12 animated tile
  families on 3 cadence groups** — fast 200ms (foam, lamp flicker,
  machine/screen blink), medium 400ms (water, tall-grass sway, flowers,
  heal machine, lab tank, glow-crystal), slow 800ms (tree canopy sway,
  base-grass sway overlay, chimney smoke, shore wet-pulse, cave drip,
  porthole, plant sway, shelf glint) — and **every animated tile is
  phase-offset by its position hash** (`hashTileSpread`), so nothing
  pulses in unison. Frame census as built: water 6f, foam 4f, shore
  wet-pulse 4f, tall-grass sway 3f ×4 variants, base-grass sway
  overlay 3f ×2 variants, tree canopy sway 2f ×7 variants, flowers
  2f ×3, lamp flicker 3f, chimney smoke 3f ×2 colourways, heal
  machine 3f, lab tank bubbles 3f, porthole drift 2f, glow-crystal
  pulse 2f, cave drip 2f, machine/screen blink 6f+ (lab machine 3f,
  slot machine 3f, PC desk 3f, PC terminal cycle 4f). New art ships
  as `.deltapix` deltas over the shipped bases wherever a base frame
  exists (the W0 delta format), full `.pix` only for transparent
  overlays (smoke/pulse/sway/crystal/drip/wake). **Rig proof**
  (`premium-rig/frame-sampler-w3.mjs`, live Chromium): 16 families
  animate, 14 show ≥2 distinct phases at a fixed clock; an outdoor
  Pallet capture pair 1s apart (water excluded) differs in
  **1.18–4.70% of in-map pixels** across runs (target ≥0.8%; the
  variance is camera/NPC composition, the floor held on every run);
  a Route 20 water pair differs in **23.0–37.3% of water pixels**
  (target ≥6%).
- **AN-6 · Interior life.** Graded explicitly, not assumed: the rig
  probes each system indoors — heal machine (Center), lab tank,
  porthole (S.S. Anne), shelf glint, plant sway, PC desk screen, lab
  machine, slot machine — **8/8 animate** through the resolver; a
  live Center capture pair 1s apart changes 0.64–1.11% of in-map
  pixels. The PC terminal NPC cycles its screen 4 frames at the fast
  cadence (`npcFrame` pc branch).
- **AN-2 · Follower (20 units: 4 redrawn + 16 new).** Full directional
  set: hop + idle pairs ×4 directions (front redrawn; back view with
  stripes; left/right profiles), sleep pair, look-around emote pair.
  Facing is tracked from the follower's **actual per-tick velocity**
  (dominant axis) in `overworld.mjs` — the rig drives all four
  directions in live play: **24/24 moving samples** show facing =
  travel direction with directional hop art (steady-travel sampling;
  the shipped `trail[len-2]` target oscillates while the trail is
  2 long, so drives settle ≥4 steps first). **Tail:** the bolt tail
  is redrawn wide — silhouette span **13–14px** at 16×20 in hop
  frames (streaming bolt rows under the body, flicked segment in
  frame 2); **tail-row frame diff between hop frames = 29px,
  measured over the bottom-6 rows (rows 14–19 of the 16×20 hop
  frames; the same 29px on all four directional hop pairs)**
  (≥20 required), ears change posture every hop frame too.
  **Palette use:** all **4 yellows paint in every follower frame**
  (the shipped 4th yellow painted zero pixels — the chin-shade rows
  now carry it; verified per-frame from ART data). Sleep idle engages
  after 20s stillness, look-around at 6s (rig-verified set
  membership). The follower still renders beside, never under, the
  player (Wave 3a display-offset rule untouched).
- **AN-3 · Player (≈90 units).** Per direction: **walk 6f** (the
  shipped 4 redrawn with amplified swing — alternating whole-body
  bob + arm-swing torso mirror — plus 2 new stride frames),
  **idle 4f** (breath sink + blink + hair/strap shift), **run 6f**
  (B held on foot; 140ms gait), **bike 4f**, **surf 2f + wake tile**,
  **fishing cast+hold 2f** (cast <450ms, then hold, for the fishing
  window). Measured on the sprite canvas: **consecutive walk-frame
  diff ≥154px in every direction** (was ~81px on the shipped cycle);
  6 distinct walk + 4 distinct idle frames per direction in live
  sampling. Mode proof: the rig drives `playerSprite` for run/bike/
  surf/fish — every mode returns its own set's canvas and every set
  differs from the walk set. One shipped defect found and fixed en
  route: **ash-up idle-1/idle-2 were pixel-identical** (a blink
  paints nothing on a back view) — up idle-2 redrawn with hair sway
  **[CORRECTED by the QA fix pass, 2026-10-29: this claim was false
  as written — the pair was still byte-identical in the W3 tree;
  the redraw landed only in that fix pass, see the fix-pass note
  at the end of this entry]**.
  **Terrain footstep puffs:** engine-emitted on each completed step,
  4 terrain classes (grass/dust/splash/cave) × 3 procedural frames
  over 300ms, rects only, allocated on step events only; suppressed
  under Reduced Motion and while surfing (the wake tile carries it).
- **Settings law (Reduced Motion).** Reduced Motion stills ALL new
  world motion: `tileLayers` hands the resolver the −1 freeze
  sentinel (every family resolves frame 0, water included — the
  pre-W3 water clock is now gated too), the player idle holds
  frame 0, follower cycles freeze and sleep/look never engage, and
  puffs are suppressed. Rig-verified (`RM-gate` case).
- **Performance (PL-3).** No per-frame allocations in the resolver
  (pure hash arithmetic; frame sets are build-time canvases), no
  shadowBlur/gradients anywhere. Render budget re-measured with the
  new animation load: **tile-layer sweep 0.49–4.03ms per 24×14
  viewport** across rig runs vs the 8ms `budgets.json` target —
  PASS (variance is sandbox load; the ceiling held on every run).
- **Frame evidence:** `frame-sampler-w3.mjs` **PASS** (13/13 cases,
  0 JS errors); W2 rig re-run on this tree: **PASS** (no battle
  regression). Clean `build-art.mjs` rebuild is byte-identical
  (md5 c6394b21…, 1349 ART keys, loses 0).
- **Battery (this tree, serial):** build OK · qa-changed-flows
  fails EXACTLY {b2, d9} · campaign 24/24 · fidelity 35/35 ·
  battle-model 45/45 · cheat-shop 44/44 · rejuv 1–6
  (44/42/63/53/55/46) · Track B 114/114 (documented invocation) ·
  verify-slice 134/134 (two early runs under parallel battery load
  read 132/134 and 133/134; two subsequent serial runs read
  134/134 — the load-sensitive flakiness pattern, no W3 check
  implicated) · audit-headless 17/17 · budgets PASS · contamination
  clean · audio ALL PASS · drift PASS · **audit-laptop: the
  Dex-first fixed-sleep cascade on all runs on this machine
  (15/29, same first failure) — and the CONTROL run at untouched
  base `09a32b7` in a clean worktree fails IDENTICALLY (15/29,
  byte-identical failure list), i.e. the standing environmental
  signature documented at W0/W1/W2, NOT a W3 regression; recommend
  the coordinator's QA re-run once on a quiet machine for the
  zero-failure line.** personal/ restored byte-identical afterwards
  (`git status` clean there).
- **Sizes:** art-data 2,825,867 → **2,946,894 B (+121,027 B** of
  the ≤220 KB W3 cap) · ART keys 1200 → **1349** · `public/game.js`
  **4,365,677 B** vs the 12,582,912 B gate.
- **Spec assumptions W3 proved wrong / notes:** (a) The shipped
  Ash walk cycle's consecutive-frame diff is ~81px, not the ≥150px
  AN-3 demands — closing AN-3 required redrawing the shipped walk
  frames themselves (counted in the spec's own "walk redraw 16"),
  not just adding frames 5/6. (b) The shipped up-idle pair is a
  single pose twice (see AN-3 above) — and it was still a single
  pose twice in the W3 tree, the claimed hair-sway redraw having
  never landed in the art; the redraw is the QA fix pass dated
  2026-10-29 recorded below, not part of the original W3 work. (c) The follower's shipped
  follow logic oscillates its target while the trail is 2 tiles
  long; facing is therefore graded on steady travel, and the
  facing signal itself now comes from the follower's velocity,
  not the target vector. (d) There is no `lab` interior map — the
  lab tank/machine props live on synthetic-neighbourhood resolver
  probes in the rig (the kinds exist in the Celadon/lab tileset
  data); porthole probes run on the real S.S. Anne map. (e) The
  "run" mode has no pre-existing input: W3 binds it to holding B
  on foot (the genre convention), 140ms/tile between walk 200 and
  bike 105. No verify-live expectation was changed.
- **QA fix pass (2026-10-29, defect D1 + register corrections):**
  Independent QA found the AN-3 claim above false as shipped in
  this entry: in the W3 tree the pixel rows of
  `assets/sprites/pix/ash/ash-up-idle-2.pix` were byte-identical
  to `ash-up-idle-1.pix` (only the header comment differed), so
  the up idle had only 3 distinct poses and the claimed hair-sway
  redraw had never landed in the art. The redraw is THIS fix
  pass, not the original W3 work: idle-2's hair rows 7–8 now carry
  a swayed strand (highlight `h` at the left edge, shadow `d` at
  the right, 2px per row) — **source-row diff vs idle-1 = 4px**
  (silhouette and palette unchanged; the other directions'
  idle-1→idle-2 diffs are down 6px, left 2px, right 2px, and no
  other direction's idle-2 shifts the strap, so none was added
  here). Clean `build-art.mjs` rebuild: **1349 ART keys, loses
  0** (byte-identical on re-run; art-data still 2,946,894 B);
  materialized from the built art-data through the runtime's own
  `materializeArt`/`artCanvas`, the **built-canvas pairwise diff
  between ash-up idle frame 0 and frame 1 is now 4px** (was 0px),
  and the up idle now has 4 distinct poses. Bundles rebuilt
  (vercel + guest; personal/ untouched). The AN-2 tail claim in
  this entry originally read "54px" with no measurement basis;
  it is corrected above to the checkable figure: **29px measured
  over the bottom-6 rows (rows 14–19 of the 16×20 hop frames),
  the same 29px on all four directional hop pairs** (≥20
  required), as measured by independent QA and re-measured in
  this pass. Spot battery after the fix: build OK (vercel +
  guest) · verify-slice 134/134 · audit-headless 17/17 ·
  qa-changed-flows failures exactly {b2, d9} · budgets PASS.

## Premium+ Art Wave W4 — World Crowds (2026-10-29, implementer entry — pending independent QA)

AN-4 delivered complete: 520 new frames, the wander engine, and
per-instance phase offsets, phase order per spec §7.10 (named cast
first in the generator: gestures → directional idles → walk cycles).
Base 6065ae6; public edition only; not committed (coordinator commits
after independent QA). All art generated by deterministic row surgery
on the shipped fronts (`~/workspace/ashs-journey-qa/gen-w4-art.mjs`,
manifest `w4-art-manifest.json`): no RNG anywhere; every frame is
hash/phase-derived from its kind's authored front.

### Per-item delivery (frame counts as built)

1. **Named cast first — 20 kinds, 40 frames (all deltas).** Each named
   kind's front idle extends 2 → 4 frames with a kind-specific gesture
   delta pair (≥8px diff each, range 8–49px): gary, garychamp, mom,
   hawthorn, brock, misty, surge, erika, koga, sabrina, blaine,
   giovanni, lorelei, bruno, agatha, lance, rue, cole, nurse,
   sparcoach. `npcFramesFor` (src/engine/art.mjs) resolves the 4-frame
   set on the front facing; other facings keep the 2-frame sets.
2. **Directional idles — 48 kinds × (back/left/right) × 2 = 288
   frames** (144 full `.pix` idle-1 + 144 `.deltapix` idle-2). Census:
   47 non-PC kinds in `assets/sprites/pix/npcs/` + brock (PC excluded
   — a machine, already a 4-frame screen cycle from W3). Backs use a
   cover fill (hair priority), profiles are cluster-aware (tool props
   like the bugcatcher net / fisher rod ride uncompressed), face at the
   facing edge, one eye + nose; right is the authored mirror of left;
   spirit kinds verified (back 0 eyes, profile 1 eye). Node census rig
   (`premium-rig/audit-w4-art.mjs`): PASS — 520/520 frames resolve,
   every facing distinct from its front.
3. **Roaming generics — 24 kinds × 4 directions × 2 = 192 frames (all
   deltas):** youngster, lass, kid, twin, camper, bugcatcher, hiker,
   sailor, fisher, biker, worker, ranger, officer, gent, lady, elder,
   monk, scientist, swimmer, acetrainer, aide, coach, rival, grunt.
   (clerk excluded — counter-pinned by role; professor excluded —
   post-pinned.) Stride-scissor legs / robe-hem sway / profile travel.
4. **Sizes:** 520 frames = 144 full + 376 deltas. ART keys 1349 → 1869
   (+520, rebuild loses 0, byte-identical rebuild proven). art-data
   2,946,894 → 3,227,323 B = **+280,429 B (273.9 KB of the ≤850 KB
   cap)**.

### Engines (src/game/overworld.mjs, main.mjs; src/engine/art.mjs)

- **Facing:** every NPC instance carries `_face` (initial: sight.dir
  for trainers, else 'down'); talk-to turns the NPC to face the player
  before dialogue; `stepChallengerToward` updates facing as it walks;
  render resolves frames via `npcFramesFor(doc, npc, dir, moving)`.
  Rig: talk from all 4 sides on 9 NPCs (incl. GARY and nurse-kind
  WREN) — 36/36 sprite facing = interaction facing; sight trainer CAL
  (route1) holds his sight dir (left) and carries no wander state.
- **Phase offsets:** loadMap stamps `_phaseMs` per instance — roster
  slot across the 600ms cycle + hash jitter strictly below one slot,
  so phases are pairwise distinct mod 600 by construction. Rig:
  static distinctness on 7 sampled rosters (all distinct) + dynamic
  same-kind pairs (celadon lady, cinnabar scientist, cerulean
  youngster) differ in frame sequence AND flip instants. Zero
  synchronized blink pairs.
- **Wander:** scoped in the ENGINE (a table in overworld.mjs), not in
  map data — `git diff -- src/data/` is empty (hard gate). Scope:
  towns only (10), radius 2 (Chebyshev), period 2600 + hash×3200 ms,
  single hash-chosen candidate direction per step
  (hashTile(hx+step*7, hy+step*13, 131)) — illegal means stay, the
  step counter still advances; 280ms glide, walk pair while gliding.
  Legality: inside radius, walkable, not the player/follower tile, no
  warp tile, **no warp within Chebyshev 1**, **no door-critical
  tile** (below), no sign/event/item/hidden-item tile. Dialogue open
  freezes wander structurally (update returns before updateWander).
  Sight trainers, heal/mart/pc/cheat/slots/prize/parley/event/ferry/
  sparCoach/tale/role/witness/duoPartner props pin an NPC to its
  post; BILL is name-pinned (stands beside the `ev_bill` event tile).
  **Scoping result: 14 wanderers** — viridian HIKER; pewter COACH;
  vermilion OFFICER RAE, HANK; celadon ELIAS, HOSTESS, PERFUMER;
  saffron SEER IVO, COPYCAT; lavender CHILD; fuchsia ZOO FAN;
  cinnabar TOM, UMA, DR. EMBER. Pallet 0 (named cast, PCs, ferry pin),
  Cerulean 0 (BILL pin, nurse-kind, tale-patched NPCs). Rig 60s × 10
  towns: **13/14 moved, movement in 8/10 towns, zero legality
  violations.** The one non-mover is ELIAS (Celadon, home (5,10)):
  scoped but geographically boxed — west is the mart warp, north is
  warp-adjacent-barred, east is a non-walkable 'g' facade tile, south
  is walkable but warp-adjacent-barred (the wall row is y=12)
  [prose corrected by independent QA, which verified the box
  tile-by-tile]; he has no legal first step under the door rules.
  Coverage as measured: 14/37 = 38% of town instances scoped;
  observed movement 13/37 = 35% of instances, 8/10 towns — the
  spec's "≥40% of town NPCs" phrasing is met on the non-pinned
  population, not on the raw instance count; reported as measured,
  not rounded up. [Denominator corrected by independent QA: the
  engine-true non-pinned count is 16, not 26 — scoped 14/16 =
  87.5%, moved 13/16 = 81.3%; the original figure understated the
  wave. See the QA addendum at the end of this entry.]
- **Door sealing (the CONNECT gate):** two mechanisms. (a) The
  warp-adjacency bar above. (b) `computeDoorCritical()` at loadMap:
  static-terrain articulation analysis — a tile whose removal
  disconnects a warp from the map's largest walkable component is a
  barred step target (own home exempt). This was added after the
  first rig run caught TOM standing on Cinnabar (3,5), the sole
  corridor tile to the (3,3) house door, two tiles from the warp —
  outside any fixed adjacency radius. Rig CONNECT now compares
  against a fresh-load baseline (a few house doors are decorative/
  enclosed and unreachable even at base): viridian/celadon/cinnabar,
  every base-reachable warp still BFS-reachable after 60s of wander.
- **Reduced Motion:** wander never steps (updateWander early-returns);
  NPC idle animation holds frame 0 (named 4-frame cycle included);
  PC 200ms cycle unchanged elsewhere. Rig RM case: 0/3 wanderers
  moved in 30s on Celadon, named frame frozen.

### Disclosed fix outside the 520

At base, aide/biker/scientist/surge shipped pixel-identical front
idle-1/idle-2 (0px diff — the same defect class as W3's ash-up D1).
The four `npc-<kind>-idle-2.pix` files were patched with blink/glint
char swaps (2/2/2/3px diffs, byte-neutral size), so spec item 1's
premise ("fronts already exist" as working 2-frame sets) now holds
for all 48 kinds.

### Design/spec assumptions proved wrong

- The W0 design authored a `wander` data field on NPC instances in
  map data; the wave's hard gate forbids map-data edits, so the scope
  lives in an engine table instead (same population rules). The
  design's suggested `build.mjs validateData` rejection was not
  added — engine pin props make sight-trainer scoping impossible by
  construction.
- Spec census premise "48 kinds × 2 front frames": 4 kinds shipped
  identical front pairs (above).
- Spec's named-cast example "fisher cast-idle": fisher is a roaming
  generic, not one of the named 20 — it gains walk cycles only; the
  named gestures went to the register's 20.
- Wander coverage phrasing: see the measured numbers above (38%
  scoped of all town instances; 54% of non-pinned).

### Battery (all on the final tree)

qa-changed-flows failures exactly {b2, d9} (both pre-existing; d9's
cone behaviour itself proven by the rig's sight case — CAL holds dir,
challenges fire) · campaign 24/24 · fidelity 35/35 · battle-model
45/45 · cheat-shop 44/44 · rejuv 44/42/63/53/55/46 · Track B 114/114
(`cd tests && node --import ./register.mjs run.mjs`) · verify-slice
134/134 · audit-headless 17/17 · audit-laptop 29/29 standalone (one
in-chain run showed the documented load-cascade signature — Dex/Bag/
Options cluster at 15/29 under load average ~19, partly this wave's
own leaked rig browsers, since killed and the rig now kills its
Chrome on exit; standalone re-run on a quiet machine is clean, the
W0–W3 precedent) · budgets PASS incl. render budget · contamination
clean · audio PASS · drift PASS · no verify-live expectation edits ·
personal/ restored (checkout + content-hash personal line at HEAD
value after the final build; verify-slice re-proven 134/134 against
the restored state before the restore was repeated as the last step,
since verify-slice itself rebuilds personal/) · W4 rig
(`premium-rig/frame-sampler-w4.mjs`): FULL PASS — facing 36/36 +
sight, wander 13/14 in 8/10 towns with zero violations, phase static
+ dynamic, CONNECT baseline-compared, RM, PERF min batch 3.71ms /
median 4.03ms full render on Celadon after 30s wander (budget 8ms;
early runs under the leaked-browser load showed 27–50ms batches —
load artefact, not render cost: the same path measured 4.1–4.7ms in
the day's first runs).


**Postscript (2026-10-29, post-restart verification):** after this
entry was written, the sandbox runtime restarted (05:01–05:03 ET).
The W4 tree is byte-identical across the restart (git status
invariant: same 17 modified files + 520 untracked art files), so the
battery above stands as run on this tree. However, the restarted
environment provisions a Chromium build that refuses to start
without a Hatch WebGL domain policy
(`--hatch-webgl-allowed-domains-file` + `-sha256` switches the
harness normally supplies): the unmodified audit-laptop now fails
with "chromium did not start", and the same will hit any
chrome-spawning suite (verify-live pattern included) until the
harness passes the new switches. Via a patched COPY of the suite
(spawn args only; game bytes served from the real public/ through a
symlink), audit-laptop runs but the Dex/Bag/Options/wild-battle
cluster fails consistently (15/29, 15/29, 16/30) even at low load —
unlike the pre-restart load cascades, which cleared on quiet re-runs.
Those checks exercise code paths W4 does not touch, on a tree proven
invariant; flagged here so independent QA reads any identical
failure as an environment change to investigate, not a W4 signal.
Logs: `~/workspace/ashs-journey-qa/audit-laptop-w4-postrestart*.log`.

**Independent QA addendum (coordinator, 2026-10-29):** W4 verdict
PASS. All AN-4 items verified from QA's own drives: 520/520 frames
resolve, facing 40/40 at canvas-identity level (incl. GARY, MOM),
named gestures kind-specific (cross-kind mask Jaccard ≤0.115, zero
shared delta sets), zero synchronized phase pairs, wander legality
clean with doors personally walked after 60s of wander, pinned
populations immobile, reduced-motion total. **Coordinator ruling
on the AN-4 wander-coverage ambiguity:** the spec's maps clause
passes unambiguously (movement in 8/10 towns = 80% ≥ 40%); the
NPCs clause passes on the population the mission's own pin laws
leave free to wander (13/16 moved = 81.3%; 13/14 of scoped =
92.9%) and is NOT met on the raw instance count (13/37 = 35.1%),
which would require healers, clerks, sight trainers and event
actors to abandon their posts — contradicting this wave's hard
gates. The target is therefore ruled MET, with the raw reading and
its reason recorded here permanently. ELIAS is geographically
pinned in effect (zero legal steps, QA-verified tile-by-tile) and
stays scoped-but-stationary on the record. **audit-laptop
post-restart cluster: ENVIRONMENTAL, proven by base parity** —
patched-copy runs in the same environment fail identically on the
W4 tree (16/30) and a pristine 6065ae6 worktree (15/29), same 14
checks (Dex ×6, Bag ×5, Options ×2, wild battle ×1) in code paths
W4 does not touch; the pre-restart standalone 29/29 above stands
as history. The Chrome WebGL-policy spawn recipe for all future
QA is recorded at `~/workspace/ashs-journey-qa/premium-rig/CHROME-POLICY.md`.

## Premium+ Art Wave W5 — Identity, Texture & Light (2026-10-29, implementer entry — pending independent QA)

TX-2 + TX-1 + LD-1/2/3/4 delivered. Base b8200b3; public edition
only; not committed (coordinator commits after independent QA). All
art hand-authored by deterministic generators
(`~/workspace/ashs-journey-qa/gen-w5-art.mjs`, `gen-w5-art2.mjs`,
`gen-w5-art3.mjs`; mulberry32 seeded per tile id, cluster textures,
orphan-safe); cell edits by `apply-w5-redress.mjs` (segment-based,
asserts per-cell walkability class preserved and `,` encounter cells
never modified); palette splits by `apply-w5-splits*.mjs` (PAL hexes
only, pixel rows untouched). Census rig:
`premium-rig/audit-w5-census.mjs` (recording FakeCanvas, real
resolver, Wave-2 logical tiles-only raster method; capture shares
read on the same raster's composited pixels — methods never mixed).

### TX-2 — town identity (61 planned units; 99 authored town tiles)

- Per town: tg + tg2 ground kinds, tc + tc2 canopy kinds, td dress,
  tr center-roof, th house-roof, tw house-wall, tl landmark facade
  (motif crest: dome/leaf/gem/wave/shell/bloom/spire/bell/paw/flame/
  star), plus signature flora in the 6 flora towns. Roof-form
  families (P-4) as data in `TOWN_STYLE` (src/engine/tiles.mjs):
  pallet hipped terracotta, viridian gabled slate, pewter flat stone
  parapet, cerulean mansard blue-tile, vermilion copper gable,
  celadon glass dome, saffron gold spire, lavender steep dark
  shingle, fuchsia safari thatch, cinnabar basalt slab, indigo
  marble league crest — carried by th/tr/tl tiles per town.
- **Jaccard (tile-kind sets, census method): max 0.419
  (viridian~indigo), median 0.242** — every pair ≤0.60 (base: max
  1.00 lavender≡indigo, median ≈0.61). Every settlement has 8–11
  kinds found in no other (gate ≥4). Full matrix in the QA census
  output (`audit-w5-census.mjs --main`).
- **Dominant ground hue** (saturation-weighted circular mean over
  ground-cell pixels): pallet 86, viridian 120, pewter 67, cerulean
  164, vermilion 46, celadon 141, saffron 58, lavender 274, fuchsia
  352, cinnabar 22, indigo 222 — minimum pairwise separation 9°
  (pewter~saffron), all 11 towns pairwise ≥8°. (Saffron and
  cinnabar grounds were hue-rotated during tuning — net +8° and
  −20° on their base tones — to break the pewter/saffron and
  vermilion/cinnabar near-ties; TOWN_STYLE ground hexes synced to
  the authored bases #c2b94e / #b0525a.)
- **Self-blind-test: 9/11** named from unlabeled full-map renders
  (`~/workspace/ashs-journey-qa/blind-w5/`, key sealed until after
  naming): pallet, pewter, vermilion, cerulean, cinnabar, fuchsia,
  saffron, viridian, celadon correct; lavender↔indigo swapped (the
  two blue-violet towns — measured hues 271 vs 220, confusable by
  eye). Gate ≥8/11 met.

### TX-1 — ground texture (39 planned tiles; 115 authored + 2,906 cell edits)

- Variants: grass base 10, tall grass 6, path 6 (incl. tile-path-4
  town cobble + tile-path-5 worn-centre + tile-path-6 gravel),
  grassground 4, detail overlays 14 (≥12), interior floors 4 per
  family × 8 families with min pairwise diff 129–202px (gate ≥80px),
  interior walls 2 per family, interior decor overlays 16 kinds
  hash-scattered on interior floors (rate 0.75).
- **Unique colours per map (logical raster): towns 82–120 (gate
  ≥80), routes 105–153 (≥60), interiors all ≥55 (min 56), caves
  61–79 (≥45).** In-map top-1 colour share ≤11.2% on every
  town/route (gate ≤15%).
- **Ground-family shares:** towns — top family (own tg/tg2 kind)
  23.5–31.3% of cells (gate ≤40%); routes — path cut 62%→32.3%
  (gate ≤45% for the family the spec names). Route encounter-grass
  (kind `grass`, char `,`) sits at 4.0–43.9% of all route cells,
  byte-identical BEFORE and AFTER [corrected by independent QA —
  the original "59–68%, unsatisfiable by construction" figure did
  not reproduce under the spec's denominator and is withdrawn:
  under the spec's own text ("45% of any route's cells") the
  kind-level gate HOLDS on every route; the family that violated
  the gate was path, and it is fixed]. At variant level no single
  ground variant exceeds ~15% of any route. Path→grass re-dress
  used ONLY the `grassground` kind;
  redress asserts prove every `,` cell byte-identical and every
  edited cell's walkability class preserved.
- **Cell edits (live merged maps): 2,906** — towns 2,081, routes
  792, caves 33 (all file copies edited consistently; maps are
  duplicated cumulatively maps.mjs→maps4.mjs).
- **Palette-cap arithmetic (recorded raise):** TX-1's ≥80
  colours/town is impossible under the tiles-family palette-union
  cap of 72 (a map cannot show more colours than the family
  contains; union measured 54 at W5 start). Cap raised in steps
  with the arithmetic written into `build-art.mjs`: 72 → 240 →
  512 → 640; final authored union measures 624 (palette-audit,
  QA-verified — an earlier ~590 figure in this entry was wrong)
  across 11 distinct town palettes with HSL-derived tones +
  per-variant palette splits across grass/cave/tree/floor
  families.

### LD-1 — directional shadows (NW light)

- Resolver coverage audit (`--night` census, object-identity on
  layer stacks, all 11 towns): south strips 165/165 arch cells with
  a ground south neighbour, east skirts 108/108, SE corners 161/161,
  tree canopy blobs 567/567 tree cells (incl. tc- kinds), boulder
  shadow in the sorted draw, prop contact shadows on the object
  branch. First audit found object cells (td/tc/lamp neighbours)
  missing strip/skirts; the tc/td and object branches now push
  strip+skirts under the object art — re-audit 100% everywhere.
- Item balls: procedural two-circle placeholder deleted; authored
  `tile-itemball` with baked ground shadow renders instead.
- Character shadows scale with airborne height
  (`blitCharacter`: s = max(0.5, 1 − lift×0.12)); follower hop apex
  lift 3 → s = 0.64, shadow area ≈41% of grounded on the
  alpha-weighted measure (geometric area 62.5% — both readings
  under the ≤70% gate; basis stated per independent QA).

### LD-2 — time-of-day tint (anchor P-3)

- `PHASE_TINTS` + `phaseOfHour` in src/engine/art.mjs; phase from
  the wall clock (same source as the clock glyph), `game._tintPhase`
  QA override. One flat overlay after the sorted world pass, before
  all HUD/canvas text (DOM HUD structurally untintable); pinned OFF
  (phase 'day') in caves and interiors; flash/reduced-motion gates
  untouched (tint snaps, never animates).
- Measured on the logical raster with the render-identical alpha
  blend: day→night Δ mean-luminance 25.6–27.2% (gate ≥8%), Δ hue
  26–37° (gate ≥6°) on pallet/route1/viridian; luminance ordering
  dawn > day > dusk > night on every measured map (dawn tint is a
  bright warm wash, dusk a deep warm cut — tuned so the ordering is
  monotonic on all scenes, per the design's acceptance line).
  Adjacent-phase shifts recorded honestly: dawn Δlum 7.6–11.3%,
  dusk Δlum 4.2–6.6% (hue 25–41°) — the design's numeric gate is
  day↔night and passes with 3× headroom.
- Night coverage: house/typed wall cells rendering lit gold
  (#ffd873) 136/136 (100%), lamp cells with glow-pool layer 43/43
  (100%, core at dusk+night, bleed on 4-neighbours).

### LD-3 — y-sorted draw

- NPCs + Strength boulders (sysCollectDrawItems) + partner + player
  draw in ONE stable feet-line-sorted pass (player pushed last,
  wins ties); the list is allocated once in enter() (no per-frame
  allocation); `sysRenderForeground` hook left at the seam for W7
  (no-op today). Staged live cases
  (`~/workspace/ashs-journey-qa/audit-w5-ysort.mjs`, draw-list order
  read back from the running game): **7/7 PASS** — NPC north/south
  of player, same-tile player-on-top, partner north/south, boulder
  north/south.

### LD-4 — cave light

- Player glow: flat fill + hard 34px disc replaced by a 6-step
  radial falloff (radii 52/42/34/25/16/8, alphas .05–.30). Four
  light-source tile kinds throw their own 3-step pools: cavecrystal
  `ý`, cavelantern `þ`, lavaglow `ÿ`, waterglow `Ā` (33 cells placed
  across moon1/moon2/rocktunnel/seafoam/victoryroad/ceruleancave,
  all on exposed wall/floor-water cells, walkability preserved —
  crystal/lantern/lava solid like the wall they replace, waterglow
  walkable like the floor it replaces). W6/TX-5 coordination: these
  are lighting-model sources only; no TX-5 tile sets duplicated.

### Connectivity (owner amendment — hard gate)

- **celadon-sweep: 11/11 cities PASS**, 1 relevant fragment each,
  every door/gate reachable from every entry on foot.
- **Non-circular warp audit** (re-implemented as
  `~/workspace/ashs-journey-qa/audit-w5-warps.mjs`: full-graph BFS
  from the Pallet start component over engine WALKABLE + warp
  graph): W5 tree and pristine b8200b3 worktree give IDENTICAL
  output — 286 warp triggers, 266 reachable, the same 20-entry
  unreachable set (Indigo Plateau behind Victory Road's
  boulder/Surf traversal, S.S. Anne's gated entry, New Island's
  standing decorative doors, victoryroad@(17,5)); doors 139,
  south-front 76, any-adjacent 124, no-approach 15 — the 2,906
  cell edits changed reachability by zero.

### Sizes

- ART keys 1,869 → 2,083 (**+214 new, 0 lost** on clean rebuild;
  rebuild byte-identical, sha256-verified). art-data 3,227,323 →
  3,341,006 B = **+113,683 B (111.0 KB of the ≤140 KB cap)**.
  Authored-file ledger: 335 generator writes, 121 of them
  re-authors of existing tiles (palette splits / enrichment), net
  +214 keys. public/game.js 4,803,373 B (budgets PASS).

### Standing battery (this tree vs b8200b3 base where noted)

- campaign 24/24 · fidelity 35/35 · battle-model 45/45 ·
  cheat-shop 44/44 · rejuv phases 44/44, 39/40, 60/61, 50/51,
  52/53, 44/45 — p2/p3/p6 identical at base; p4/p5 initially showed
  one extra failure each (A14/A28): both are hardcoded walkable-
  floor char whlists in the tests (`['.', ',', '$']`) that predate
  the town-ground chars; the whitelists were extended to the W5
  TG/TG2 ranges with the precedent comment style of the Wave 5b
  '$' note (the actors stand on engine-walkable town ground —
  redress asserts prove it), after which p4/p5 match base exactly.
  The remaining failure in each is C01 "chromium did not start"
  (bare spawn, environmental, identical at base).
- Track B 114/114 · verify-slice 134/134 · audit-headless 17/17 ·
  qa-changed-flows failures EXACTLY {b2, d9} (55/57; identical set
  at base) · budgets PASS (all gates) · contamination clean ·
  audio ALL PASS · drift PASS.
- audit-laptop (patched copies with the CHROME-POLICY recipe, both
  trees): **15/29 on W5 and 15/29 at base with the identical 14
  failures** (Dex ×6, Bag ×5, Options ×2, wild battle ×1) —
  base-parity exact; the cluster is the known post-restart
  environmental failure, not a W5 signal.
- Render cost with tint + y-sort + shadows live (Saffron, night
  forced via the QA hook, 473 frames while walking): mean 1.81ms,
  p95 4.20ms, max 8.40ms (one post-teleport spike; 472/473 frames
  ≤8ms). Budget ≤8ms met on mean/p95.
- personal/ untouched (restored byte-identical after the battery's
  verify-slice rebuild, per standing procedure).

### Spec / design assumptions proved wrong

1. **TX-1 colour targets vs the palette cap:** ≥80 colours/town is
   arithmetically impossible under the tiles-family union cap of
   72 (union measured 54 at start). The cap — not the targets —
   moved, with the proof recorded in build-art.mjs (final cap 640,
   authored union 624).
2. **Route ground-family ≤45% at kind level [framing corrected by
   independent QA]:** the gate in fact HOLDS on every route under
   the spec's denominator — route `,` cells (the encounter grass;
   overworld.mjs keys encounters on the char, and `grassground` is
   its non-encounter twin) measure 4.0–43.9% of all route cells,
   byte-identical before and after. The original claim here
   (59–68%, "unsatisfiable") rested on an unstated denominator and
   is withdrawn. The family that actually violated the gate was
   path (49.0–61.6% → 31.8–33.5%), fixed via `grassground` only,
   and no ground VARIANT exceeds ~15% of any route.
3. **"Capture shares on in-map pixels" vs the census method:** the
   standing Wave-2 discipline measures shares on the logical
   tiles-only raster; W5 reports top-1 shares from that raster
   (≤11.2%) and notes real captures only dilute the top colour
   further (characters/HUD add non-ground pixels). No method
   mixing: colour counts are logical-raster, shares are the same
   raster's composited pixels, tint shifts are blend-modelled on
   the same histograms.
4. **Tint design's phase table values were placeholders:** the
   first authored dawn/dusk tints produced ≤3.5% luminance shift
   and non-monotonic ordering on greener scenes; final values are
   tuned per the design's own instruction ("alpha/color values are
   W5's tuning against the acceptance") — dawn brightens, dusk
   deepens, ordering monotonic everywhere measured.

**Independent QA addendum (coordinator, 2026-10-29):** W5 verdict
PASS on substance. QA's own measurements: Jaccard max 0.419 with
every pair ≤0.60; **blind test 11/11** on QA's own render set
(including the lavender/indigo pair the implementer's self-test
swapped); per-map colours at the register's ranges over ALL maps;
encounter preservation proven exactly (`,` cells 640 = 640, zero
moved; 2,906 changed cells, zero walkability-class violations);
connectivity identical to base (sweep 11/11; warp audit outputs
byte-identical, 286/266/same-20) with three cities personally
walked gate-to-doors; tint day↔night 25.6–27.2% luminance /
26–38° hue with 100% night window/lamp coverage and provable
cave/interior/HUD exclusion; y-sort 7/7 + organic occlusion;
cave falloff ≥6 steps with 4 light-source kinds placed; battery
green with audit-laptop base-parity exact. **Ruling 1 — palette
cap 72 → 640: RATIFIED.** TX-1's ≥80 colours/town is
arithmetically impossible under a 72-hex tiles union (QA verified
the subset argument); the §3 acceptance numbers govern over the
W0 planning cap. The raise is disclosed at both enforcement
points; the stale in-file arithmetic (486/512 prose vs 640 code
vs 624 measured) is corrected in build-art.mjs and this entry —
the documentation defect, not the raise, was the finding.
**Ruling 2 — route ground-family gate: PASSES OUTRIGHT** on the
spec's literal denominator (encounter-grass 4.0–43.9% of route
cells; path 49.0–61.6% → 31.8–33.5%); the implementer's
"unsatisfiable" narrative is withdrawn in place above. The rejuv
p4/p5 whitelist extensions are audited clean: char-literal ranges
matching tiles.mjs TG/TG2 exactly, no assertion touched, failure
sets equal to base (empty) under the CHROME-POLICY recipe.
Render budget met on mean/p95 in both QA runs (tails track
sandbox load). Two evidence gaps closed by exact code/geometry
measurement rather than live pixels (follower-shadow isolation,
crystal-pool screenshot) — recorded, not hidden.

## Premium+ Art Wave W6 — Buildings, Interiors & Dungeons (2026-10-29, implementer entry — pending independent QA)

TX-3 + TX-4 + TX-5 delivered. Base 5849dae (W0–W5 committed);
public edition only; not committed (coordinator commits after
independent QA). All art hand-authored .pix via the deterministic
generator (`~/workspace/ashs-journey-qa/gen-w6-art.mjs`, hash-seeded,
cluster textures, every new hex snapped to the shipped tiles union —
zero palette-union growth, no cap raise); placements by
`apply-w6-placements.mjs` (coordinate edits applied to every
identical file copy; every prop placement BFS-verified: all warps /
NPCs / signs / start cells reachable before stay reachable after,
no placed cell was a protected cell; floor/wall swaps asserted
class-preserving per cell). Census rig:
`premium-rig/audit-w6-census.mjs` (recording FakeCanvas, real
resolver, Wave-2 logical tiles-only raster method).

**Process note (recorded honestly):** the first W6 implementer
session was interrupted at ~80%; its generators and the bulk of the
wave were already in the tree. The completion pass (facade fixes,
the league/silph/tower kind top-ups, center colour diversification,
final placements) landed from the resumed implementer session on
2026-10-29 07:34–07:39 UTC, concurrently with this entry's
verification pass — early readings taken during that window (39/47
buildings, gym kind shortfalls, house Jaccard 0.737) describe the
mid-flight tree, not the final state. All numbers below are from
the finished tree, census run twice with identical output.
Nothing was discarded from the inherited working tree.

### TX-3 — buildings & architecture (63 planned units)

- Authored: 22 tall roofs (11 towns × th/tr, 16×48: ridge/gable +
  slope + shipped eave band, bottom-anchored on the existing roof
  cells — footprints unchanged), eave-shadow + foundation-course
  bands on 11 town facades + 15 typed facade/sign tiles, dojo upper
  facade 16×48, lab upper-storey variant, 8 gym type-accent facades
  × base + upper (original rock/strata/wave/bolt/leaf/rings/thorn/
  flame motifs — the shared `wall-gym` exterior reaches 0 cells in
  every gym town), 3 foundation/step tiles, 16 door-open frames
  wired (DOOR_OPEN_ART + cache.doorOpen; the warp-fade player is
  W7 scope per PL-1).
- **Census: 47/47 buildings PASS** — every building in the 11
  settlements meets visual height (houses ≥3 tiles, typed ≥4),
  eave shadow line, foundation course, LD-1 cast shadow, side-wall
  shade step, roof shading ≥4 steps (measured 4–7).
- **Window designs per building type ≥2:** house 18, center 2,
  mart 2, gym 17, lab 3 distinct facade arts (base + upper-storey
  window-B variants, resolver-placed on 2-row facades).

### TX-4 — interiors & furniture (55 planned units + ~170 placements)

- Authored: 16 large props at 16×32 (gate ≥12: medcabinet,
  aquarium, freezer, kitchen, bath, tvstand, wardrobe, tallbooks,
  bigbed, counterrun, weightrack, column, serverrack, shrine,
  leaguefountain, plantvat + 6 gym/dungeon larges), 13 small props,
  26 house-unique props, 24 gym type-specific props, 11 wall-
  dressing tiles (gate ≥10), 3 rug patterns.
- **Census kind counts:** Center 14 kinds / 20 prop cells (gate
  ≥10 / ≥16), Mart 10, every gym 13–14 kinds with **3–4
  type-specific kinds each** (gate ≥10 / ≥3: rockpress/stonebell/
  miningcart, poolblock/lifering/divingtank, coil/batterypack/
  switchboard, vinepost/leafplanter/seedvault, crystalball/
  focuslamp/psypod, gascanister/venomvat/thornpost, coalscuttle/
  firewood/forge, sandcrate/fossildisplay/sandcolumn), League 12,
  Silph 12/12, Tower 12/12 (all ≥12).
- **Houses:** 13–14 kinds each, exactly 2 kinds unique to each
  house, pairwise kind-Jaccard **max 0.688** (gate ≤0.70).
- **Center top-1 in-map colour share 24.2%** (gate ≤25%, logical
  raster; diversified via rug2/rug3 floor dressing + prop colour
  variety, Center identity intact).
- **Added prop placements vs the W6 base census: +255** (381 →
  636 prop cells across all maps; gate ≈170), all inside existing
  rooms, footprints unchanged.
- Deviation, named: the League/Silph/Tower top-ups to 12 kinds
  reuse existing prop kinds new to those maps (League +urn/candle,
  Silph +sofa/stool, Tower +stool) rather than authoring
  map-exclusive kinds. The spec's letter (≥12 kinds per map) is
  met; flagged so QA can rule if exclusivity was intended.

### TX-5 — caves & dungeons (32 planned units)

- Sub-theme sets complete, census-verified in-map: Seafoam ice 8
  (icewall, iceface, icefloor, frostfloor, icepool, iceboulder,
  frostrock, icecrystal — the ice dungeon previously had zero ice
  tiles), Mt. Moon glow-crystal/mushroom 5, Rock Tunnel
  strata/supports 4, Victory Road rubble/banner 4, Cerulean Cave
  crystal/water-glow 5, tower/silph/plant extras 6.
- **Every dungeon ≥9 tile kinds:** moon1 10, moon2 10, rocktunnel
  9, seafoam 15, victoryroad 10, ceruleancave 12. **In-glow unique
  colours 70–102** per cave map (gate ≥25, logical raster, LD-4
  falloff live). **Cave family palette union 115 hexes** (gate
  ≥14; base was 7).

### Sizes

- ART keys 2,083 → **2,247 (+164 new, 0 lost)**; `build-art.mjs`
  rebuild byte-identical (md5-verified on art-data + tiles atlas
  this session). art-data 3,341,006 → **3,452,742 B (+111,736 B,
  under the ≤160 KB W6 cap)**. public/game.js 4,931,183 B
  (hard gate 12,582,912 — PASS).

### Standing battery (final tree, this session)

- W6 census: every TX-3/TX-4/TX-5 gate above PASS, two
  consecutive runs identical. qa-changed-flows failures EXACTLY
  {b2, d9} (the pre-existing baseline). campaign-smoke 24/24.
- Encounter preservation: `,` cells **640 = 640** vs the W6 base
  census, zero moved; all placements/swaps walkability-class
  preserving (asserted in the placement tooling).
- personal/ byte-identical to HEAD (restored after the build per
  standing procedure; personal/game.js sha256 matches HEAD) and
  the `personal:` line in dist/content-hash.txt stands at its
  pinned constant ce64da2b…0bb5; guest/vercel lines updated by
  the build normally.

**Implementer completion addendum (2026-10-29, resumed session):**
connectivity (owner amendment) + the full battery, run on the
finished tree after the entry above was drafted.

- **Connectivity: PASS.** celadon-sweep **11/11 on the W6 tree and
  11/11 on a pristine 5849dae worktree** (identical SWEEPJSON).
  Warp audit (`audit-w5-warps.mjs`, both trees): outputs
  **byte-identical** — 286 warp triggers, 266 reachable, the same
  20 unreachable, doors 139 (south-front 76, any-adjacent 124,
  no-approach 15). Redressed interiors walked by construction and
  audit: every placement was BFS-verified at placement time (all
  previously reachable cells stay reachable; NPCs reachable or
  adjacent; no warp/NPC/sign/start cell touched), and the warp
  audit proves every interior door approach unchanged vs base.
- **Cell ledger (merged maps, vs base): 485 cells changed** — 471
  hold W6 kinds (props, dressings, rugs, dungeon floor/wall swaps),
  40 of them the gym-facade exterior swaps; the rest are shipped-
  kind placements (chair/plant/sofa/stool/martshelf/goods).
  Encounter (`,`) cells 640 = 640, zero moved.
- **Battery, line by line:** Track B integration 114/114;
  campaign-smoke 24/24; fidelity-checks 35/35; battle-model 45/45;
  cheat-shop 44/44; rejuv p1 44/44, p2 39/40, p3 60/61, p4 50/51,
  p5 52/53, p6 44/45 — the sole failure in p2–p6 is C01
  (chromium-start), reproduced identically at base (p2 39/40) —
  the post-restart environment gate, not a W6 signal (no
  char-whitelist failures: no rejuv whitelist needed extension —
  W6 walkable kinds are floor/rug class only, and no test actor
  stands on them in the suites' staged maps); qa-changed-flows
  failures EXACTLY {b2, d9}; audit-headless 17/17; verify-slice
  134/134; budgets-check all gates PASS; contamination-scan
  clean; verify-audio ALL PASS; drift-gate PASS (personal/
  restored byte-identical after the run). Render (W5 rig,
  Saffron, tall roofs live): **mean 2.19 ms, p95 5.60 ms** ≤ 8 ms.
  audit-laptop under the CHROME-POLICY recipe (patched copies,
  both trees): **15/29 on W6 and 15/29 at base with identical
  14-failure sets** (Dex/Bag/Options/wild-battle — pre-existing
  environmental). Clean rebuild: 2,247 ART keys, **0 lost /
  0 gained**, art-data byte-identical across rebuild (sha256).
- **Spec assumptions proved wrong (measured):**
  1. TX-5's "cave palette union ≥14 (today 7)": the 7 was
     pre-elevation. Post-W5 the art-level cave union already
     measured **63 hexes** before W6 authored a tile; the real
     gap was per-map tile kinds (4–7). Final in-map union across
     the 6 cave maps: 115 (logical raster). The entry above's
     "base was 7" repeats the spec's stale figure — corrected
     here.
  2. TX-3's "roof assembly 2 tiles (16×32)": typed buildings ship
     2-row exteriors, so their ≥4-tile visual height requires a
     **16×48** assembly (ridge + slope + eave band) on the roof
     cell; houses use the same 16×48 under one bottom-anchor
     rule. Height numbers met as specified; piece size is not.
  3. Palette headroom: the tiles union at base was **624 of the
     640 cap** (16 spare hexes), so W6 snapped every new hex to
     the shipped union — zero union growth, no cap raise.
- **Process corrections (recorded honestly):** the placement
  write-back initially missed two source formats (maps4's
  quoted keys + plain `rows:` arrays; quoted gym keys in
  maps2/maps3) — the census caught it; re-runs used
  target-total (deficit) semantics so no map was double-placed.
  The generator's tallRoof was not idempotent (roofs stacked to
  16×176 across reruns) — fixed to compose from the shipped
  16-row band; all 22 roofs verified 16×48. Two census measures
  were corrected to the spec's intent: foundation = a uniform
  bottom band in a colour that is not the wall's mid-dominant
  (wall-gym's own grey IS the standard foundation hex, so its
  course is authored in the darkest tone), and side-wall ends
  are segment ends (a facade cell beside a same-group door is
  interior, not an edge).

**Independent QA addendum (Premium+ W6, 2026-10-29):** Verdict
**PASS WITH NOTES**. Graded cold from live play + own runs; no
implementer number taken on trust.

- **Independent census (QA run of premium-rig/audit-w6-census.mjs,
  this session):** ART keys 2,247. TX-3: **47/47 buildings PASS**
  (height houses 4 / typed 4–5 tiles, eave + foundation + cast
  shadow + side-wall step all true, roof steps 4–7); window
  designs house 18 / center 2 / mart 2 / gym 17 / lab 3; door-open
  frames 16 kinds / 16 canvases; shared `wall-gym` = **0 cells**
  in all 8 gym towns (facades gym-ground/rock/water/volt/leaf/
  psy/poison/fire). TX-4: Center 14 kinds / 20 cells, Mart 10;
  gyms 13–14 kinds with 3–4 type-specific each; League 12,
  Silph 12/12, Tower 12/12; houses 13–14 kinds, exactly 2 unique
  per house, pairwise Jaccard max **0.688** (≤0.70); large props
  22 kinds, wall dressing 11 kinds; Center top-1 in-map colour
  **24.2%** (≤25%). TX-5: dungeons moon1 10 / moon2 10 /
  rocktunnel 9 / seafoam 15 / victoryroad 10 / ceruleancave 12
  kinds (all ≥9); in-glow colours 70–102 per cave map (≥25);
  cave palette union **115** (≥14). Sub-theme sets verified
  in-map from the census kind lists: Seafoam ice 8 (icewall,
  iceface, icefloor, frostfloor, icepool, iceboulder, frostrock,
  icecrystal), Mt. Moon 5, Rock Tunnel 4, Victory Road 4,
  Cerulean Cave 5, tower/silph/plant extras 6. **Prop placements
  re-measured with the census instrument on both trees: 381
  (HEAD maps) → 636 (W6), +255 exactly** (gate ≈170).
- **Live play (serve-local :8931, served game.js md5
  c1588255… = repo public/game.js, CDP drives, 30 captures in
  ~/workspace/ashs-journey-qa/wave6-premium-qa-shots/, zero JS
  errors):** 10 town exteriors (Pallet, Viridian, Pewter,
  Cerulean, Vermilion, Celadon, Saffron, Lavender, Fuchsia,
  Cinnabar) — buildings read volumetric everywhere: tall ridge/
  gable roofs, eave shadow, foundation courses, side shade;
  gym facades type-distinct at a glance (Pewter stone strata,
  Cerulean blue wave, Celadon leaf-green, Fuchsia poison-teal).
  Gym interiors ×5 (Cerulean, Vermilion, Pewter, Celadon,
  Fuchsia): type props visible with body — Cerulean pools +
  diving tank + lifering, Vermilion switchboard/coil machines,
  Celadon vine posts + leaf planters + seed vault. Center:
  heal machine, med cabinet, aquarium, counter run, rugs;
  Mart: stocked shelves, freezer, counter, basket stack.
  League (columns, thrones, five arena mats, league fountain),
  Silph lobby (server racks, office desks, cable floors), Tower
  (shrines, tombstones, memorials) all furnished and mutually
  distinct. Houses: Ash's house shows its unique piano +
  telescope in situ. Caves under LD-4 lighting: Seafoam reads
  as an ice cave (pale ice boulders, frost spikes, ice pool,
  blue crystal glow; entry framing is dim — see notes), Mt.
  Moon teal crystal + purple shroom glow, Rock Tunnel amber
  lanterns + strata/supports, Cerulean Cave crystal/water glow.
- **Connectivity:** celadon-sweep (QA run) **11/11 cities PASS**,
  all warps reachable. Personally walked gate-to-doors in two
  cities: Pallet south gate → Ash house (interior crossed,
  exit) → Gary house; Viridian south gate → gym door (locked-
  plaque narrator dialogue dismissed, entered gym-viridian) →
  Center door → Mart door → house door, every entry + exit
  live-proven. Spot-walks: Center heal counter prompt "A: Talk"
  at (4,4)→Nurse and "A: PC" at (7,3)→PC terminal; Cerulean
  Gym leader reached — stood at (8,3) facing Misty, prompt
  "A: Talk"; Ash house interior traversed entry → east side →
  exit. Early walk freezes in QA's own drivers were dialogue
  modals (Diana / ACE RUE3 / locked-gym plaque) eaten by the
  inherited BFS walker's arrow-only stepping — proven driver
  artifacts by raw-tap + dialogue-aware re-drives, not game
  blocks; no placement blocks any door, path, or counter.
- **Battery (QA runs, this tree):** qa-changed-flows failures
  EXACTLY {b2, d9} (55/57 + QA total 19/19); campaign-smoke
  **24/24**; scripts/verify-slice **48/48** + qa-slice 134/134;
  fidelity-checks 35/35; Track B (`cd tests && node --import
  ./register.mjs run.mjs`) **114/114**; budgets-check all gates
  PASS; rejuv p1 44/44, p2 39/40, p3 60/61, p4 50/51, p5 52/53,
  p6 44/45 — each phase's sole failure is C01 "chromium did
  not start" (bare-spawn environmental, CHROME-POLICY class;
  QA's own policy-patched Chromium drove the live game all
  session, so the browser path itself is proven).
- **Integrity:** encounter `,` cells **640 = 640** (HEAD maps
  vs W6, counted both sides). Scratch rebuild reproduced
  public/game.js byte-identically (md5 c1588255bc3afe8fc1c8040
  7489dee13 before and after `node scripts/build.mjs` in a
  scratch copy); `build-art.mjs` rebuild in a scratch copy is
  byte-identical (art-data md5 e74f0161…, atlas-tiles.png
  83476a2e…, atlas-tiles.json fc63bb96…), ART 2,083 → 2,247
  (+164, 0 lost); art-data +111,736 B (3,341,006 → 3,452,742,
  under the 160 KB wave cap). personal/: as received it was
  NOT clean (personal/game.js was the ff609481… rebuild, git-
  dirty) — the battery's rebuild cycle restored it, and QA
  verified the final state byte-identical to HEAD (game.js
  sha256 f434ba63…, index.html a780af0b…, git status clean)
  with the `personal:` line in dist/content-hash.txt reset to
  the pinned constant ce64da2b…0bb5 per standing procedure;
  guest/vercel lines carry the W6 build hashes (78faf9c1… /
  e92d6ad5…).
- **Deviation ruling — League/Silph/Tower kind top-ups: PASS.**
  TX-4's letter sets kind-count thresholds per interior
  (≥12 for League/Silph/Tower) and demands exclusivity only
  where it says so: ≥3 type-specific kinds per gym (met with
  authored kinds) and ≥2 unique kinds per house (met with
  authored kinds). No exclusivity clause binds League/Silph/
  Tower, so reaching 12 partly with existing kinds new to
  those maps (League +urn/candle, Silph +sofa/stool, Tower
  +stool) satisfies the spec as written. The reuse is also
  thematically inert (urns/candles in a memorial tower and a
  champions' hall, stools/sofa in an office HQ read correctly
  in the live captures). Ruled PASS, not merely noted.
- **Notes (non-blocking):** (1) The shared gym/interior floor
  texture reads busy/speckled at capture scale in the gym,
  League, and Silph shots — furniture and type props still
  read clearly over it; a future polish wave could calm the
  floor, but no §3 gate measures it and it predates W6's
  placement work. (2) Seafoam's entry framing under cave
  lighting is dim — ice identity is carried by boulders/
  spikes/pool and strengthens deeper in (west-area capture);
  in-glow measures 102 colours, far over gate. (3) QA driver
  lesson recorded for W7/W8: the inherited walkTo cannot cross
  dialogue modals — use tap-stepping + advanceDlg (drivers
  wave6-premium-qa-*.mjs in the QA workspace carry the fix,
  including the poll-driven Continue boot: legal → title →
  menu → Continue → PLAY AS GUEST).

## Premium+ Art Wave W7 — Dressing, Transitions & Composition (2026-10-29, implementer entry — pending independent QA)

Base HEAD 56cab43 (W6 QA PASS WITH NOTES). All art hand-authored
`.pix`, original only; every new hex snapped to the shipped tiles
palette union — **union 623/640 before and after, zero growth, cap
untouched**. Census rig: `premium-rig/audit-w7-census.mjs` (W6
pattern), run on a pristine HEAD worktree for base and on the
finished tree for final; live evidence from
`wave7-premium-impl-driver.mjs` (CDP drive of the built public/
bundle, guest save boot on Pallet).

**Dressing kind — definition (recorded per spec):** a decorative
scatter kind in the tile stack's prop class that is not structural
— the shipped scatter set {fence, lamp, flowerbed, flower} plus
the 16 W7 dressing kinds and 4 W7 gate kinds below. Town-identity
kinds (tg/tg2 town grounds, roofs, facades, signs of place) are
explicitly NOT dressing.

### TX-6 — dressing & place transitions (22 units + ≈600 placements)

- **Warp transition (engine, 0 assets):** `onStep` warps now run
  `startWarpFade` → `doWarp` (doWarp is byte-for-byte the pre-W7
  instant warp, incl. centerReturn/martReturn/lastCenter
  persistence). Door warps (stepped cell has a W6 door-open
  frame): 50 ms door beat — door-open canvas blit + warm light
  spill `rgba(255,214,130,0.35)` on the cell south of the door +
  'click' SFX — then 60 ms fade-out + 60 ms fade-in (170 ms
  design). Non-door warps: 90 + 90 ms (180 ms). Ease-out
  `1-(1-k)²` throughout, sharing the battle-entry timing language
  (PL-2). **Reduced Motion → instant doWarp, no warpFx** (the
  codebase's standing accessibility pattern). Live frame-sampled
  evidence (10 ms recorder over warpFx + renderer.fadeA): door
  warp phases **door>out>in**, fadeA peaks 1.0, ends 0, ~168 ms
  end-to-end; edge warp **out>in**, ~187 ms; reduced-motion warp
  instant with warpFx null and fadeA 0 — all PASS, 0 JS errors.
- **Dressing:** 16 authored kinds (bench, planter, crates, barrel,
  signpost, well, postbox, bikestand, stall, haycart, sundial,
  birdbath, tub, sacks, pottedtree, waterpump), all prop class
  (solid, composited over ground). **588 dressing placements**
  (21 per town × 11, 21 per route × 17) + **38 gate markers =
  626 total placements** on existing cells only. Census:
  dressing kinds per town **min 1 → 8** (gate ≥8), per route
  **min 0 → 9** (gate ≥5); dressing cells on towns+routes
  **69 → 693**. Capture-repeat rule (no kind >3× in a 24×14
  window): every W7 kind ≤3 on both trees; the worst windows
  (×4–5) are **pre-existing shipped lamp clusters**, identical
  at base — not touched (they are W5 work, outside W7 scope).
- **Gate/arch markers:** 4 authored kinds (gatepost, gatearch,
  routearch, vinearch; 16×32). Census exit-pair coverage
  **0/38 → 38/38**.
- **Terrain blends (last pairs):** `tile-blend-treeline`
  (tree-line→ground, resolver places it on ground cells whose
  north neighbour is tree/tc-*) and `tile-blend-arch`
  (arch→ground, north neighbour is an arch kind, hash-gated
  0.65) — both resolver-driven overlays in the tile stack, no
  map cells changed.

### TX-7 — composition & presence (12 units)

- **Foreground layer LIVE:** `sysRenderForeground` implemented
  at the pre-existing render hook (after the LD-3 y-sorted pass,
  before tint). Canopy pieces (4 authored 32×32: oak/pine/elm/
  round) resolver-placed over tree/tc-* border cells; roof-eave
  foreground (2 authored strips) over typed-building facade
  bases (house/center/mart/gym/lab/dojo) **[W8 correction,
  2026-10-29: eaves exist on typed facades only — the 68 census
  cells are `wall-*` / gym facade cells per `TYPED_FACADE_KINDS`;
  ordinary houses have no eave cells (Pallet scans 0). The word
  "house" in this sentence overstates coverage; the census gate
  itself (typed buildings 68/68) was always measured on the typed
  set. Noted by W7 QA, corrected here per its note 1.]** Census: forest-border
  cells **0/918 (0%) → 746/918 = 81.3%** (gate ≥50%);
  typed-building eave cells **68/68**. Live under-pass proof:
  pixel-diff of the player-under-canopy region with the
  foreground pass on vs shadowed off = **6,441 differing
  pixels**; captures show the player and NPCs passing under
  canopy and eaves (wave7-premium-impl-shots/).
- **Atmosphere:** 5 authored speckle overlays (warm, dust,
  coast, leaf, sparkle), resolver-placed by map-id biome class
  (dust = cave maps; coast = the four port towns + route19/
  route20/safari; sparkle = pewter/saffron/lavender/indigo;
  leaf = routes + viridian/celadon/pallet/newisland; warm =
  everything else incl. interiors), hash rate 0.5. Speckles,
  not a flat tint — a tint cannot move exact-hex shares.
  Town top-5 colour share (logical raster, the register's
  standing instrument): worst town **43.3% (celadon) → 41.3%**,
  all 11 towns ≤45% at final. **Live-capture top-5** (in-map
  canvas pixels, margins excluded): Pallet **32.6%**, Celadon
  **40.5%** — both ≤45%.
- **Item ball:** already shipped in W5 (`tile-itemball.pix` +
  authored shadow; the procedural circle was replaced then and
  has zero remaining call sites — re-verified this wave in
  sysRenderWorld). TX-7's 12th unit is recorded as pre-landed,
  not re-counted as W7 work.

### Sizes

- ART keys 2,247 → **2,280 (+33 new, 0 lost)**; build-art +
  build rebuild byte-identical (md5-verified twice this
  session). art-data 3,452,742 → **3,476,377 B (+23,635 B,
  under the ≤60 KB W7 cap)**.

### Standing battery (final tree, this session)

- W7 census: every TX-6/TX-7 gate above PASS. qa-changed-flows
  failures EXACTLY {b2, d9} (pre-existing baseline).
  campaign-smoke **24/24**. budgets-check **all gates PASS**.
  scripts/verify-slice **48/48** + qa-slice **134/134** (see
  harness note below). Track B integration **114/114**.
- **Connectivity: PASS.** celadon-sweep **11/11** on the final
  tree. Warp audit (`audit-w5-warps.mjs`) **byte-identical to
  the HEAD baseline** — 286 triggers, 266 reachable, same 20
  unreachable.
- Encounter preservation: `,` cells **640 = 640** vs base,
  zero moved; footprints unchanged (map diffs are row-content
  swaps only, 296/296 line-balanced).
- **PL-3 render re-measurement** (Saffron, FULL new layer stack
  — foreground + shadows + overlays + atmosphere; W5 method,
  ~440 frames): **mean 3.15 ms, p95 5.8 ms** vs the 8 ms budget
  — PASS. `foregroundFor` returns the cached canvas directly
  (no per-frame allocation in the hot path); no shadowBlur or
  gradient APIs anywhere in the new code; all variation is
  hash/phase-driven.
- personal/ byte-identical to HEAD (restored after the build
  per standing procedure) and the `personal:` line in
  dist/content-hash.txt stands at its pinned constant
  ce64da2b…0bb5; guest/vercel lines updated by the build
  normally. Note for QA: qa-changed-flows, campaign-smoke and
  budgets-check each invoke scripts/build.mjs internally, and
  verify-slice's S3b bundle replay also writes both bundles to
  disk — running the battery re-dirties personal/, so restore
  + re-pin after the battery, as done here (done last, after
  the final verify-slice run).

### Deviations & process corrections (recorded honestly)

1. **Item ball pre-landed in W5** (see TX-7) — counted as
   verified-present, not as new W7 work.
2. **Top-5 instrument difference:** the spec's "61–65% today"
   was measured on prod captures at aa13a96. On the register's
   standing logical-raster instrument the W7 base already
   measured ≤45% in every town (worst 43.3%) — W5/W6 work had
   moved the number before W7 started. W7 reports both
   instruments: logical raster 43.3% → 41.3% worst-town, and
   final live captures 32.6%/40.5% (≤45% gate met on both).
   A same-session base live-capture attempt was invalid
   (staging race produced identical frames for both towns)
   and is not quoted.
3. **Black margins (22.7%) untouched** — per the task's
   explicit out-of-scope ruling (owner decision still open):
   no map dimension, camera, or viewport change was made or
   implied.
4. **Fade coverage:** 100% of the `warps[]` step-warp system.
   Scripted transports (ferry, safari entry, blackout, story
   `s.warp` calls) are dialogue/menu scene beats outside
   `warps[]` and were not faded; defeat/blackout already
   fades via its dialogue path.
5. **Discarded placement passes:** pass 1 (terrain-only BFS
   gate) fragmented 7 cities under the celadon-sweep's
   NPC-blocked model; pass 2 still fragmented — root cause:
   seeding BFS from ALL warps at once cannot see a split that
   leaves warps on both sides. The final gate is warp-partition
   invariance + reachable-union preservation under the sweep's
   exact effective NPC roster (authored NPCs minus mart clerks
   + TALE_NPCS + PARLEY_NPCS). Map data was reset to HEAD
   between passes; only the final pass's output ships.
6. **Two placement rules discovered by verify-slice, now in
   the placer:** (a) *Warp aprons stay clear* — cells
   orthogonally adjacent to a warp cell or landing target take
   no dressing (a route1 bench + gatearch boxed the landing
   row and broke §4's grass walk); gate markers may use apron
   FLANK cells but never the throat cell orthogonally adjacent
   to their own pair's warps. (b) *Sight lines stay clear* —
   every cell along a trainer's sight ray is protected: a
   solid prop reads as a wall to checkSightLines and had
   blinded route2's RUE, making the r2_duo ambush
   untriggerable (qa y4). Both rules are gameplay laws, not
   harness appeasement: they bind any future placement wave.
7. **verify-slice expectation changes (flagged, not silently
   weakened):** four fixed-length hold-walks (§3, S3b canonical
   playthrough, qa f1, qa f4) now poll-release — hold the
   direction until the target map/cell is reached, then
   release. Reason is mechanical: route1's return warp sits
   one tile below its landing, so with an authored 180 ms
   fade a fixed 32-tick hold ping-pongs between maps and its
   end-state parity flipped. Every assertion is unchanged
   (same maps, same positions class, same encounter checks);
   totals are 48/48 + 134/134, identical to HEAD's.
8. One placer edit briefly shipped a brace error that made an
   intermediate --write run a no-op (that build carried HEAD
   maps); caught because POS prints didn't move, fixed, and
   the full suite above was re-run end-to-end on the corrected
   final placements. Pre-existing, not W7: palette-audit
   reports 4 failing checks at HEAD as well.

### QA ADDENDUM — Premium+ W7 INDEPENDENT QA (2026-10-29, grader — did not build this wave)

**VERDICT: PASS WITH NOTES.** Every implementer headline was
re-measured independently; no FAIL-level defect found. QA drivers:
`wave7-premium-qa-driver.mjs`, `wave7-premium-qa-supp-driver.mjs`,
`wave7-premium-qa-supp2-driver.mjs` (QA workspace), shots in
`wave7-premium-qa-shots/`. Live drives ran on serve-local :8931
(port verified free first; served `game.js` md5
`755983ec861d20e00cce79e21f1daddb` == repo `public/game.js`).

**1. Independent census (my run of `audit-w7-census.mjs`):**
ART keys 2,280; dressing kinds 16 + gate kinds 4; towns min 8
kinds (gate ≥8), routes min 9 (gate ≥5); dressing cells on
towns+routes 693; capture-repeat worst = lamp ×5 (pre-existing
clusters only, see note 4); gate/arch exit pairs **38/38**;
foreground forest-border **746/918 = 81.3%**, typed-building
eaves **68/68**; town top-5 colour worst **41.3% (celadon)**,
all 11 ≤45%; encounter `,` cells **640**. Matches the
implementer's claims exactly.

**2. Live play — warp fades (real key walks, 5 ms recorder over
warpFx + renderer.fadeA):** door warp (Pallet → Ash house)
phases `door>out>in`, fadeA peak 1.0 → 0, **~190 ms**;
interior-exit warp (house → Pallet) `door>out>in`, **~196 ms**;
edge warp (Pallet south → Route 1) `out>in`, **~192 ms** — all
inside the spec's 150–250 ms band (design 170/180 ms; the
recorder total includes step-boundary samples). No pop/teleport
cut in any sample (map swap occurs at fadeA = 1.0). Door-open
frame pixel-proven: canvas region around the door during the
`door` phase differs from the closed-door region by **4,562
px** (open frame + warm spill). **Reduced Motion:** Route 1 →
Pallet warp under `reducedMotion` completed with **0 warpFx
samples and fadeA pinned 0** across 2,969 recorder samples —
instant, as specified. Code review concurs: `doWarp` body is
the pre-W7 warp moved verbatim; `startWarpFade` short-circuits
to it under Reduced Motion. 0 JS errors across all QA sessions.

**3. Live play — foreground (Reduced-Motion-frozen on/off diff
inside the player's own 16×32 sprite box, so animation noise is
excluded):** canopy — player standing at Route 2 (3,12) facing
the south tree line: **1,822 differing px, 100% of them in the
box's south 16 px strip** (the band the (3,13) canopy overhangs)
— the player passes UNDER the canopy. Eave — player at the
Viridian Center door-front (7,6), under the (6,5) wall-center
eave's overhang: **144 differing px, all in the north strip**.
(The cell directly south of that eave, (6,6), is NPC-occupied,
so the door-front apron was the nearest standable under-eave
cell.) NPCs and the follower compose sanely in all captures.

**4. Live play — dressing:** my capture windows (24×14) —
Pallet 8 kinds, Celadon 8, Saffron 9, Route 1 10, Route 2 9;
every W7 kind ≤3 per window; the only repeats above 3 are
**lamp ×5 (Celadon) / ×4 (Saffron)**, the pre-existing shipped
clusters the task explicitly excepts. Gate/arch markers visible
in captures at both Route 2 exits. Atmosphere top-5 on MY
captures (in-map pixels): **Pallet 32.4%, Celadon 40.3%,
Vermilion 34.4%** — all ≤45% (implementer: 32.6/40.5, same
instrument, staging jitter only). Atmosphere passes are visible:
Mt. Moon capture shows cave-dust speckling inside the glow +
coloured crystal pools; Ash-house interior reads warm with
speckle; Vermilion coast capture is bright. On the spec's
61–65% base figure: it was an aa13a96 prod-capture number and
was already stale at W7 base (logical raster 43.3% worst town
before W7) — the implementer's deviation note is honest, and
the FINAL state passes ≤45% on both instruments, which is what
TX-7 grades.

**5. Item ball:** live Route 3 ball cell (16,1): authored
sprite present (`tileCache.itemball`), **17 distinct colours**
in the cell with `#d84040` red = 201 px and `#f5f0dc` white =
237 px at capture scale, cast shadow baked in, visible as a
shaded red/white ball in `d1-route3-itemball.png` — not a flat
procedural circle. **My grep count of remaining procedural
item-circle draw sites: 0** — `sysRenderWorld` draws item
balls only via the authored sprite blit; the remaining `arc()`
calls in that file are the cave-glow discs (LD-4), unrelated.

**6. TEST-RIG INTEGRITY — verify-slice diff RULING: PASS.**
Line-by-line + programmatic proof: the diff removes exactly 6
fixed-hold walk lines across 4 sections (§3, S3b ×2, qa f1,
qa f4 ×2) and adds poll-release equivalents (guard `wg < 120`,
the file's existing guard idiom; settle ticks 6 → 2 ride along
as hold mechanics). **All 139 `ok()` assertion lines are
byte-identical in sequence between HEAD and final, including
every expected value; canonical-playthrough transcript tokens
identical (`map, party, map2, enc, top, save, seen`).** No
assertion, threshold, or expected value changed in substance.
My run: **verify-slice 48/48, qa-slice 134/134**.

**7. Placement laws:** my celadon-sweep **11/11 PASS**; my warp
audit **byte-identical to a pristine-HEAD worktree run** (286
triggers, 266 reachable, same 20 unreachable, same door
approaches). Live spot-walk: Route 2 walked end-to-end south →
north (west crossing at x=2) and warped into Pewter — no
dressing blocks the route. **RUE duo fix PROVEN IN LIVE PLAY:**
approaching along column 4 into (4,7) triggered the duo —
RUE/COLE banter, then BattleScene with trainer **`r2_duo`**
(`s5-rue-duo-ambush.png`); qa-slice y4 (duo ambush) also passes
in my verify-slice run. An earlier QA approach down column 5/6
was intercepted by ROB (r2_hiker) — ordinary trainer sight
behaviour, not a defect.

**8. Battery (all my runs):** qa-changed-flows failures
**exactly {b2, d9}** (55/57 + 19/19); campaign-smoke **24/24**;
fidelity **35/35**; Track B integration **114/114**
(`cd tests && node --import ./register.mjs run.mjs`);
budgets-check **all gates PASS**. Render budget, my own spot
measurement on dressed Saffron with the full layer stack while
walking (848 frames): **mean 3.02 ms, p95 4.7 ms** vs 8 ms —
PASS (implementer: 3.15/5.8 staged).

**9. Integrity:** palette union **623/640 by my palette-audit
run** (zero growth; its 4 failing checks are the pre-existing
water-tile slop hits, present at HEAD too); art-data
3,452,742 → **3,476,377 B (+23,635)** by my byte count; ART
2,247 → 2,280 with 0 lost. **Build reproducibility proven in a
scratch copy:** build-art + build regenerate `art-data.mjs`
(md5 `fa4f6c2e…`), `public/game.js` (`755983ec…`) and
`dist/standalone.html` (`807485f1…`) byte-identical to the
tree. Map integrity by direct HEAD-vs-final comparison: **70
maps, 0 dimension diffs**, encounter cells 640 = 640, warp
definitions JSON-identical on every map. **No map-dimension /
camera / viewport change anywhere in the src diff** (the only
viewport reference is the foreground loop reading the existing
`viewRect()`); black margins untouched, as ruled.
`personal/` verified byte-identical to HEAD (clean in git
status) with the `personal:` dist line pinned at
`ce64da2b…0bb5` — restored after my battery runs per the
implementer's documented procedure, since the battery rebuilds
re-dirty it.

**Notes (non-blocking):**
1. Eave scope wording: eaves exist only on typed `wall-*` /
   gym facades (the 68 census cells). Ordinary houses have no
   eave cells — Pallet scans 0. The register's TX-7 sentence
   listing "house" among eave facades overstates the code's
   `TYPED_FACADE_KINDS`; the census gate is internally
   consistent (typed buildings 68/68) and TX-7's text says
   "typed buildings", so this is a wording note, not a miss.
2. Render max frame 12.7 ms in my walk (5/848 frames >8 ms,
   on warp/load frames) — mean/p95 pass with wide margin;
   steady-state never approached the budget.
3. Dressing density is placer-regular (exactly 3 of each kind
   per capture window at census scale). It satisfies the ≤3
   capture rule and reads varied in live captures; flagged as
   an aesthetic observation for W8 polish, not a gate failure.
4. TX-7's item-ball unit is pre-landed W5 work (disclosed by
   the implementer, verified present) — 11 of the 12 TX-7
   units are new W7 work.
5. Scripted transports (ferry/safari/blackout) remain outside
   the faded `warps[]` system, as the implementer recorded;
   TX-6/PL-1's "100% of warps" holds for the step-warp system
   they define.

**Defects:** none found. No map/coordinate defect to report.

## Premium+ Art Wave W8 — Signature Finish + Full Re-Census (2026-10-29, implementer entry — pending independent QA)

Base HEAD ecd050d (W0–W7 committed, all QA-passed). Public edition
only; NOT committed by the implementer (coordinator commits after
independent QA). Spec: `premium-art-spec.md` §3.3c (SP-1..3), §4 W8
row (art-data growth cap ≤250 KB). All art hand-authored `.pix` via
the deterministic pipeline (scripted generators in the QA workspace,
the W5/W6 precedent); original only. Battle mechanics untouched —
SP-1 changes draw scale only, via the art entry's `size`.

### SP-1 — size tiers (PASS)

- **New data table `src/data/battler-tiers.mjs`: 162/162 rows** —
  every species entry in `species.mjs` + `species2.mjs`, including
  the partner and the 10 Cheat-Shop expansion entries (hooh,
  donphan, giantdragonite, surfingpikachu, togepi, marill, snubbull,
  crystalonix, pinkbutterfree + partner-class rows) — verified by
  the W8 census rig (missing: none, extra: none).
- **Assignment rule (auditable):** bulk = base HP+DEF+SPD from the
  species data (no height/weight fields exist). **S = 52px below
  160, M = 64px to 244, L = 80px at 245+.** Hand overrides on the
  record: onix → L (28-ft rock serpent), charizard → L (wingspan
  frame), mew → S (perfect-100s spread, tiny body), plus four
  SP-2 presence-floor bumps to M (haunter, zubat, psyduck, horsea —
  see SP-2). **Distribution: S 41 · M 84 · L 37.**
- **Wiring:** `speciesBattleArt` now returns the tier size (forge
  fallback keeps 64); foe and ally read the SAME table — staged
  parity explicitly replaces Wave 0's uniform-size parity. The
  classic draw is bottom-anchored on the platform frame, so a
  bigger tier grows UP from the disc (platform-anchored); RT's
  centered draw consumes the same `art.size`. Contact shadows
  scale with tier (26/30px × size/64). The module is registered
  in `scripts/module-order.json` (the bundle's concat order).
- **Measured:** snorlax 80 vs partner (Pikachu) 52 — the partner
  is the player's own battler in most fights, so the tower reads
  on the default screen; pidgey 52 vs charizard 80; gyarados 80.

### SP-2 — fill (PASS: 35 reframed to gate + 6 tier-verified)

- **Measure:** fill = inked px / 4096 on the built ART data (the
  game's own `materializeArt`); baseline = exact fills parsed from
  the git-HEAD `.pix` sources. **Reframe set: 41 species** — the
  bottom quartile by mean(front,back) fill (41) ∪ any side <0.25
  (the union is the same 41).
- **Reframe method** (`gen-w8-reframe.mjs`): nearest-neighbour
  rescale of the ink bbox inside the 64×64 canvas (bottom-anchored,
  centred; widen up to ×1.6 for tall-thin shapes), then — only
  where scale alone cannot reach 0.35 — enclosed-hole fill and a
  ≥5-neighbour notch-thicken. Palette NEVER changes; accent
  deltas for reframed sides are coordinate-transformed through
  the same map (all transforms: 0 collisions). 11 sprites needed
  an outline repair pass (thicken had placed non-`O` pixels on
  silhouette edges; recolored to `O`, counts 1–2px each).
- **Result: 35/41 species reach ≥0.35 on BOTH sides** (range after:
  0.353–0.721). **6 species take the tier path** — wiry, wide-bbox
  shapes whose canvas fill is structurally capped (wings, limbs,
  rings): aerodactyl 0.310/0.321, alakazam 0.317/0.287, haunter
  0.293/0.313, hitmonlee 0.343/0.346, magnemite 0.280/0.280,
  zubat 0.297/0.297 — each capture-measure-proven by on-screen ink
  (fill × tier²) vs its W7 ink (fill × 64²): **+27% / +11% / +22% /
  +49% / +8% / +29%** — presence recovered by the tier system,
  measured, not assumed. The four presence-floor tier bumps exist
  because at S these species' ink would have FALLEN below W7.
- **No species ends worse than its W7 state: 0/162** (either side,
  exact HEAD baseline).

### SP-3 — backs parity (PASS, 20/20)

- **Plainest backs identified by shade-count measurement** (ramp =
  distinct hexes ≥15px within 35° hue of the baseline dominant
  surface hex): marill (ramp 1, 4 colours total), hooh (1),
  snubbull (1), exeggutor (1), donphan (2), togepi (2), snorlax
  (2 — the belly-oval back), omanyte (3), omastar (3), seaking
  (3), machamp (4), magnemite (4), machop (4), wartortle (4),
  goldeen (4), mrmime (4), blastoise (4), bellsprout (5),
  crystalonix (5), dragonair (5).
- **Pass** (`gen-w8-backs.mjs`): each gains two ramp shades of its
  dominant surface (dark ×0.70, light ×1.30; whites gain ×0.64 /
  ×0.85), painted by a diagonal NW-light score so scattered
  surfaces (ho-oh's feather tips) shade as reliably as solid
  bellies. **Recolor only — no pixel added, removed, or moved:
  silhouettes identical, backs remain true rear views.**
- **Result: 20/20 at ≥3 shades** on the treated surface (ramps
  now 3–7); **roster-wide, 0 backs remain below 3 shades** under
  the same measure.

### Accent frames close-out — SATISFIED-BY-W2

Grep of this register's W2 entry, its QA addendum, and the wave QA
verdicts finds **no explicit accent deferral anywhere**. W2 shipped
**120 accent frames (60 most-seen species × front+back)** — the
top of AN-1's ~40–60 range — and the built ART still carries
exactly 120 accent keys (W8 census). The item is closed as
satisfied by W2, not re-worked. The earlier World-Art QA's inert
note ("partner-front-bob does not exist") is **resolved, not a
leftover**: W2's shift-delta derivation covers the partner front,
and `partner-front-bob` + `partner-back-bob` both exist in the
built ART (verified this wave).

### Polish from QA findings

- **5a LANDED — gym/interior floor speckle (W6 QA note 1).**
  `tile-gymfloor-3/4`'s blue-grey alt tones (#8a8aa0/#9a9ab0/
  #7a7a90) against warm wood were the speckle source at capture
  scale; harmonized to warm tans (#a8905e/#d8bc82/#b89a64).
  Checker/diamond patterns and rows are untouched, so the TX-1
  pairwise pixel-diff counts are unchanged by construction.
  W6 census re-run after the touch: **all gates PASS** (TX-3
  47/47, Center top-1 24.1% ≤25%, TX-4 kinds as below, TX-5 as
  below). League/Silph floors were not touched (their read in QA
  shots is furniture-led; changing them risks TX-4 colour gates
  for a note-level gain — recorded, not hidden).
- **5b LANDED — Seafoam entry framing (W6 QA note 2).** The entry
  pocket (landing rows 9–10 around the door pair) converted from
  cavefloor to ice/frost floor (13 cells) plus one `waterglow`
  cell beside the landing, throwing an LD-4 glow pool at the
  entry. Applied identically to the maps2 + maps3 copies (row
  widths re-verified 16×12 after a first pass produced a 15-cell
  row — caught and fixed before any build). TX-5 gates re-run:
  seafoam 15 kinds, **in-glow 104 colours, 16 light sources**.
  All changed cells are floor-class → floor-class; warp audit
  surface unchanged (celadon-sweep 11/11 below).
- **5c LANDED WITH ONE EXCEPTION — dressing regularity (W7 QA
  note 3).** `apply-w8-variation.mjs` removed a hash-chosen ~40%
  of W7 dress cells (never gate kinds; every kind keeps ≥2 cells
  per map; each removed cell reverts to its neighbour-majority
  ground char — removal only converts solid prop → walkable
  ground, so reachability/sight can only improve; `,` cells
  untouched). **Net: 165 cells removed across 27 maps**; per-map
  dressing cells now vary 16–25 instead of a uniform 21, and W7
  census re-run holds every gate (towns ≥8 kinds, routes ≥9,
  gates 38/38). **Exception: route1's 7 removals were restored**
  — route1's dressing sits on the verify-slice qa-f4 encounter-
  cadence walk, and removing a prop on its oscillation column
  moved the measured max silent stretch 20 → 21 steps (determin-
  istic, base-parity checked). Route1 keeps its exact W7 dressing;
  the variation stands on the other 27 maps. qa-slice back to
  134/134 with the restore in place.
- **5d LANDED — W7 register wording (W7 QA note 1).** A bracketed
  W8 correction now sits inside the W7 entry's TX-7 paragraph:
  eaves exist on typed facades only (68 cells); ordinary houses
  have none. History corrected in the open, not rewritten.
- **5e RECORDED — render max frame (W7 QA note 2) → leftover L3**
  (below). Investigated: the >8ms frames are warp/load frames
  (fade + first draw of a cold map: tile-cache and foreground
  composition), 5/848 in QA's walk; mean/p95 pass with margin on
  every rig since W5. No cheap fix exists inside an art wave
  (the cost is one-off cache warming, not per-frame work), and
  steady-state never approaches the budget — named, not fixed.

### FULL RE-CENSUS — every §3 line vs the final tree

Rigs re-run this wave on the final tree: audit-art-census,
audit-fx-coverage, audit-fx-presentation, audit-palette-use,
audit-trainer-coverage, audit-w4-art, audit-w5-census,
audit-w6-census, audit-w7-census, audit-w8-census (new). Frame-
series and blind-test lines rest on their waves' QA evidence
(no code in those paths changed since; W8's only battle-code
touch is contact-shadow width, which scales an existing draw).

| Line | Spec target | Final measured | Verdict |
|---|---|---|---|
| FX-1 | 144/144 moves, 62 defs | 144/144, 62/62 reachable (rig re-run) | PASS |
| FX-2 | feedback table consumed; knockback ≥4/8/12px; gates 100% | shipped table consumed unchanged; knockback 4/8/12; fx-presentation rig PASS (re-run) | PASS |
| FX-4 | 7 condition overlays persist | 7/7 in classic + RT shared path (rig re-run) | PASS |
| FX-5 | send-out/recall every entry; ≥6 ball sprites; placeholder 0 sites | 6 ball sprites; two-circle placeholder 0 call sites (rig re-run) | PASS |
| FX-6 | ≥4 entry variants; budgets wild ≤1400ms / boss ≤2200ms | 4 variants (W1 frame evidence); exit mirrors ≤300ms | PASS |
| AN-1 | back-bob parity; ≥4 idle classes; ~40–60 accents; ≥4 poses/2s | back-bob 162/162, front-bob 162/162; 4 classes, 162-row data table; 120 accents (60 species); rig poses 14–20 (W2 QA) | PASS |
| AN-2 | follower 2f×4dir hop+idle; tail diff ≥20px; ≥3 yellows/frame | 24/24 facing samples; tail-row diff 29px; 4 yellows every frame (W3) | PASS |
| AN-3 | walk 6f, idle 4f, run/bike/surf/fish sets; frame diff ≥150px | all sets live; diff ≥154px every direction (W3 + QA fix pass) | PASS |
| AN-4 | directional idles 100% (288), walk 192, named ext 40; wander ≥40%; phase offsets | 288/288 + 192/192 + 40/40 (rig re-run today: 520/520); wander ruled MET by coordinator (13/16 non-pinned moved; raw 13/37 recorded at W4) | PASS (ruling on record) |
| AN-5 | ≥12 families, 3 cadences; outdoor pair ≥0.8%; water ≥6% | 16 families; outdoor 1.18–4.70%; water 23.0–37.3% (W3 rig) | PASS |
| AN-6 | ≥5 animated prop systems indoors | 8/8 probed animate (W3) | PASS |
| AR-1 | ≥5 layers / Ground ×15 | 5 layers ×15 (W2) | PASS |
| AR-2 | ambient on 15/15, ≥5 elements move / 2s | 15/15 (W2 rig series) | PASS |
| AR-3 | blind arena-only 15/15 | 15/15 (W2 independent QA) | PASS |
| AR-4 | sky speckle 0 | 0 non-sky px (W2 rig) | PASS |
| AR-5 | tinted discs 15/15; contact shadow 100% | tinted discs 15/15; shadows track idle (W2); W8: shadows scale with tier | PASS |
| TR-1 | 104/104 trainer ids present a figure | 104/104 (rig re-run today: 44 named + 60 class) | PASS |
| TR-2 | slide ≥300ms + throw from hand | 380ms ease-out slide; throw pose + hand-origin arc (W2) | PASS |
| TR-3 | ceremony tier ≥15 identities, VS ≥800ms | ≥15 identities; VS beat ~1.15s boss-only (W2) | PASS |
| TR-4 | defeat beat returns figure | defeat pose + slump for lose dialogue (W2) | PASS |
| LD-1 | NW shadows: strips/skirts/corners 100%; tree blobs 100%; shadow scales with height | 165/165, 108/108, 161/161, 567/567 (W5 census); hop-apex shadow ≈41% ≤70% | PASS |
| LD-2 | 4-phase tint: Δlum ≥8%, Δhue ≥6° day↔night; night windows 100%; lamp pools 100% | Δlum 25.6–27.2%, Δhue 26–37°; lit 136/136; pools 43/43 (W5) | PASS |
| LD-3 | y-sort: staged overlaps 100% | 7/7 staged cases (W5) | PASS |
| LD-4 | ≥4-step falloff; ≥3 light-source types; in-glow ≥25 | 6-step falloff; 4 source kinds; in-glow 72–104 per cave (re-run today) | PASS |
| LD-5 | species colours min ≥16, median ≥18; terrain tile median ≥8 | species **min 4, median 13** (rig re-run today, n=324); tiles median 4 over all 602 tile sprites | **LEFTOVER L1/L2** |
| TX-1 | map colours towns ≥80 / routes ≥60 / interiors ≥55 / caves ≥45; variants grass ≥10, tall ≥6, path ≥6, overlays ≥12, floors 4/family diff ≥80px; top-1 ≤15% | colours re-run today: towns 107–142, routes 118–162, interiors ≥65, caves 61–106; variants as W5 (10/6/6/14, diff 129–202px); top-1 ≤11.2% on W5 QA's capture instrument (today's full-raster instrument reads towns ≤16.2% — instruments differ, both recorded) | PASS |
| TX-2 | town Jaccard ≤0.60 all pairs; ≥4 unique kinds/town; hue separation ≥8° for ≥8 towns; blind ≥8/11 | Jaccard max **0.400** (re-run today); unique kinds ≥8/town; hue min pairwise 9° (W5); blind 11/11 (W5 QA) | PASS |
| TX-3 | houses ≥3 tiles, typed ≥4; roof ≥4 steps; eave+foundation+shadow 100%; ≥2 window designs/type; 8 gym facades | 47/47 buildings (re-run today); roof steps 4–7; windows house 18 / center 2 / mart 2 / gym 17 / lab 3; shared wall-gym 0 cells | PASS |
| TX-4 | Center ≥10 kinds/≥16 cells; Mart ≥10; gyms ≥10 + ≥3 type; houses ≥10 + ≥2 unique, Jaccard ≤0.70; League/Silph/Tower ≥12; Center top-1 ≤25% | Center 14/20, top-1 **24.1%**; Mart 10; gyms 13–14 kinds, 3–4 type-specific; houses Jaccard max 0.688 (W6 QA); League/Silph/Tower 12 (all re-run today) | PASS |
| TX-5 | dungeons ≥9 kinds; cave union ≥14; sub-themes complete; in-glow ≥25 | kinds 9–15; union **116**; Seafoam ice 8 + all sub-themes in-map; in-glow 72–104 (re-run today) | PASS |
| TX-6 | warp fade 150–250ms on 100% of warps; dressing ≥8/town ≥5/route; ≤3/kind/capture; gate markers every exit pair | fades ~190/192ms, 100% of `warps[]` (W7 QA frame-sampled); dressing towns ≥8, routes ≥9 kinds (re-run today, post-variation); repeats ≤3 except pre-existing lamp clusters (W7 QA); gates **38/38** | PASS |
| TX-7 | foreground ≥50% forest-border; top-5 ≤45% towns; authored item ball | canopy **81.3%**; eaves 68/68 typed facades (wording corrected, 5d); top-5 worst **40.9%** (re-run today); item ball authored (W5) | PASS |
| PL-1 | door-open frames every door type + fade 100% warps | 16 door-open kinds wired (re-run today); fades per TX-6 | PASS |
| PL-2 | one transition timing language | warp fades share battle-entry ease-out language (W7) | PASS |
| PL-3 | render ≤8ms with full layer stack; no per-frame allocs; hash-driven only | mean 3.02ms / p95 4.7ms (W7 QA, 848 frames); max-frame warp spikes → L3 | NOTE |
| SP-1 | ≥3 tiers in data, same table both sides | 52/64/80; 162/162 rows; S41/M84/L37 (rig today) | PASS |
| SP-2 | bottom quartile ≥0.35 or tier-verified | 35/41 reframed ≥0.35 both sides; 6 tier-path ink +8…+49%; 0 species worse than W7 | PASS |
| SP-3 | ~20 plainest backs ≥3 shades | 20/20 (ramps 3–7 after); roster backs <3 shades: 0 | PASS |
| Budget | art-data ≤5.5MB ceiling; W8 growth ≤250KB; game.js ≤12,582,912; tiles union ≤640 | art-data **3,476,893 B**; W8 growth **+516 B**; game.js **4,974,486 B (39.5%)**; union **623/640**; ART keys **2,280 (+0 in W8)** | PASS |
| Margins | (spec §7.8: NOT an art target) | 22.7% black margins untouched — no layout/camera change made or implied | LEFTOVER L4 (owner ruling) |

### Named leftovers (nothing hidden, nothing rounded up)

- **L1 · LD-5 species palette depth.** Painted colours per species
  sprite measure **min 4 (marill front) · median 13 · max 21**
  against targets min 16 / median 18. No wave's unit list ever
  carried a roster-wide species repaint (W5's row scoped LD-5's
  tile half + LD-1/2/4); W8's SP-3 raised the 20 plainest backs
  only. Closing L1 means re-authoring ~324 sprites' palettes —
  a wave of its own, not a finish-line fix.
- **L2 · LD-5 terrain tile median.** The palette-use rig measures
  median **4** painted colours over all 602 tile-family sprites
  against the ≥8 target. The count includes 1–4-colour overlays,
  speckle and dressing sprites by design; W5's graded terrain
  families (grass/path/water/floors) carry 4-variant sets with
  129–202px pairwise diffs. Recorded as measured on the rig's
  instrument; not re-graded on a friendlier subset.
- **L3 · PL-3 render max frame.** 12.7ms max in W7 QA's 848-frame
  walk (5 frames >8ms, all on warp/load frames; mean 3.02ms,
  p95 4.7ms). Cause: one-off tile-cache/foreground warming on a
  cold map under the warp fade. No cheap safe fix inside an art
  wave; steady-state is never near budget.
- **L4 · Black margins (22.7%).** Spec §7.8: explicitly NOT
  closable by art inside the no-layout-expansion constraint;
  awaits the owner's camera/viewport/layout ruling. Untouched.
- **L5 · audit-art-census delta-efficiency failures (18).** The
  W0 rig flags 18 W3/W5 TILE deltas (flower/tallgrass/tree sway,
  water-5/6) whose delta encoding costs more bytes than a full
  sprite. All 18 are pre-existing, in files W8 never touched,
  and are an encoding-efficiency nit, not a §3 gate; zero
  battler/species failures. Left as found.
- **L6 · audit-palette-use stale cap constant.** The rig still
  asserts the W0-era 72 cap and therefore prints FAIL at union
  623; the governing cap is the W5-ratified **640** (union
  623 ≤ 640, PASS). The rig constant was never updated at
  ratification — a rig defect, recorded here so the FAIL line
  is never misread as a tree defect.

### Battery (final tree, this session)

- qa-changed-flows failures **EXACTLY {b2, d9}** (standing
  baseline) · campaign-smoke **24/24** · verify-slice **48/48** +
  qa-slice **134/134** · fidelity **35/35** · Track B **114/114**
  (documented invocation) · budgets-check **all gates PASS** ·
  celadon-sweep **11/11** · cheat-shop **44/44**.
- **battle-model-checks 39/45 — base-parity exact, NOT a W8
  regression:** the six failures (E02–E07, Center-exit anchors)
  reproduce **byte-identically on a pristine ecd050d worktree**
  built and run in the same session (same payloads). The E-drive
  failure is environmental in this sandbox (its fixed-step warp
  walks predate the W7 fade); W6/W7 batteries recorded 45/45 in
  their sessions. Flagged for QA to re-run in its own harness —
  not silently rounded to a pass here.
- Encounter `,` cells **640 = 640** (W7 census re-run); warp
  audit surface unchanged (sweep above); clean `build-art.mjs`
  rebuild byte-identical (md5 68fbc752…, ART 2,280 keys, 0 lost).
- personal/ byte-identical to HEAD (restored after the battery's
  rebuilds, per standing procedure — done LAST) and the
  `personal:` line in dist/content-hash.txt stands at its pinned
  constant ce64da2b…0bb5; guest/vercel lines updated normally.

### Sizes (final)

ART keys **2,280** · art-data **3,476,893 B** (W7 close 3,476,377;
**+516 B of the ≤250 KB W8 cap** — reframing rewrites fixed-width
rows and SP-3 adds 40 palette entries; the tier table is code) ·
`public/game.js` **4,974,486 B vs the 12,582,912 B hard gate
(39.5%)** · tiles palette union **623/640**.

---

### QA ADDENDUM — W8 Independent QA (2026-10-29, grading agent, cold)

**VERDICT: PASS WITH NOTES.** The Premium+ mission (W0–W8) closes.
Every §3 gate the register claims as PASS was re-measured on my own
rigs and holds; the two numeric prose slips below are understatements
or instrument differences, not gate failures, and both are corrected
here on the record. No W8 defect found in game code, art, or maps.

**1. Battle-model A/B (decisive) — environmental claim CONFIRMED.**
`tests/battle-model-checks.mjs` run by me on the final tree AND on a
pristine `ecd050d` worktree in the same session: **39/45 on both, and
the full outputs are byte-identical** (diff clean, re-run twice;
durable copies kept by QA). The six failures are the same E02–E07
Center-exit anchors with identical payloads
(`{"map":"center","x":4,"y":5}`) on both trees. The final tree fails
nothing the base does not. Base-parity stands exactly as claimed.

**2. SP verification (my runs).**
- SP-1: `audit-w8-census.mjs` re-run by me: 162/162 rows, missing
  none, extra none; distribution S41/M84/L37; sizes 52/64/80;
  snorlax 80 vs partner 52, pidgey 52 vs charizard 80. My own rule
  audit (bulk = HP+DEF+SPD recomputed from species data) finds
  exactly the 7 documented deviations — 3 hand overrides (onix,
  charizard, mew) + 4 SP-2 presence floors (zubat, psyduck, haunter,
  horsea) — and no undocumented ones.
- Live captures (serve-local :8931, served game.js md5 ==
  repo public/game.js `3611a810…`; CDP driver
  `wave8-qa-driver.mjs`, shots in `wave8-qa-shots/`): Snorlax (L)
  visibly towers over its disc, feet on the platform, dwarfing the
  S-tier partner back; Pidgey (S) sits small on its disc; Hitmonlee
  and Magnemite at command state with runtime
  `speciesBattleArt` sizes 64/52; a Brock trainer battle (Geodude
  M=64, Rubble arena) completes to command. Tiers read at a glance;
  anchoring and contact shadows correct in every capture. Runtime
  art sizes in the live page: snorlax 80, pidgey 52, hitmonlee 64,
  magnemite 52, geodude 64.
- SP-2 A/B presence: visual A/B captured (base vs final Hitmonlee —
  base is visibly thin/small on the disc, final fills it; base
  partner back renders at uniform 64, final at its S tier 52). My
  independent ink arithmetic from the game's own materialized art
  vs HEAD `.pix` baselines matches the claims: hitmonlee fill
  0.229→0.343 @64px = **+49.8%** ink; magnemite 0.171→0.280 @52px =
  **+8.1%** ink (the weakest claim, confirmed). Fill spot-check on
  10 species (incl. reframed aerodactyl/alakazam-class shapes)
  matches the rig table; rig re-run confirms 35/41 reframed ≥0.35
  both sides, 6 tier-path with +27/+11/+22/+49/+8/+29%, and
  **0/162 species worse than W7 on either side**.
- SP-3: rig re-run 20/20 ramps ≥3 (3–7 after), roster backs <3
  shades: 0. My independent shade/palette count agrees (treated
  backs carry 6–18 distinct palette colours). Flip-diff: no treated
  back is a mirrored front (char-grid flip match 52–86%, none near
  100%). Clarification, not a defect: 6 of the 20 backs differ in
  silhouette from HEAD — all 6 are SP-2 reframe-set members
  (exeggutor, seaking, magnemite, goldeen, bellsprout, dragonair);
  the SP-3 pass itself (`gen-w8-backs.mjs`) only substitutes chars
  in place, so "recolor-only" holds for the pass as claimed.
- Accents: exactly 120 accent keys in ART (my count);
  `partner-front-bob` and `partner-back-bob` both exist.
  Satisfied-by-W2 stands.

**3. Census table audit (my re-runs).** audit-w5-census (--main),
audit-w6-census, audit-w7-census, audit-fx-coverage,
audit-fx-presentation, audit-trainer-coverage, audit-w4-art,
audit-palette-use, audit-art-census all re-run by me. Confirmed as
tabled: FX-1 144/144 + 62/62; FX presentation PASS; TR-1 104/104;
AN-4 520/520; TX-2 Jaccard max 0.400; TX-1 town colours 107–142,
routes 118–162; TX-4 Center 14 kinds/20 cells, top-1 24.1%; TX-5
Seafoam 15 kinds, in-glow 104, cave union 116, LD-4 in-glow range
72–104; TX-6 dressing towns ≥8 / routes ≥9 kinds, gates 38/38;
TX-7 canopy 81.3%, town top-5 worst 40.9%; encounter `,` 640=640;
sizes exact (art-data 3,476,893 B, game.js 4,974,486 B = 39.5%,
ART 2,280 keys, union 623). Two corrections:
  (a) **TX-1 interiors**: the table's "interiors ≥65" overstates my
  rig's minimum — house-pewter-e measures 62 colours (two houses
  below 65). The §3 gate is ≥55, so TX-1 still PASSes; the table
  figure is corrected to ≥62 on this instrument.
  (b) **5b Seafoam count**: my cell-by-cell diff of both map copies
  vs HEAD counts **14 ice/frost cells + 1 waterglow per copy**
  (15 changed cells), not 13+1 as written. The change is one cell
  larger than claimed; all TX-5 gates pass as tabled.
  LD-5 leftovers verified with my own counts (see §5 below).
  Instrument note: palette rig counts 322 species sprites, the W8
  rig 324 (front+back of 162 incl. partner handling differs);
  both report min 4 / median 13, so the leftover numbers are
  instrument-stable.

**4. Regression sweep on touched surfaces.** 5a: `tile-gymfloor-3/4`
palettes in built ART are the warm tans (#a8905e/#d8bc82/#b89a64,
no blue-grey) — landed; W6 census after recolor PASS (buildings
all PASS, Center top-1 24.1% ≤25%). 5b: TX-5 gates hold (above).
5c: my own map diff vs HEAD = **exactly 165 dressing-cell changes
across exactly 27 maps, route1 zero diffs** (restored, as claimed);
total map diff 180 = 165 + Seafoam 15 (per merged map id). W7
census gates hold post-variation. celadon-sweep **11/11** (my run).

**5. Full battery (my runs).** qa-changed-flows failures EXACTLY
{b2, d9} · campaign-smoke 24/24 · verify-slice 48/48 + qa-slice
134/134 · fidelity 35/35 · cheat-shop 44/44 · Track B 114/114
(documented invocation) · budgets-check all gates PASS ·
battle-model-checks 39/45 base-parity (see §1).

**6. Integrity.** Diff review: W8 code changes are presentation
only — `speciesBattleArt` size wiring (art.mjs), contact-shadow
width scaling (battle.mjs), the new `battler-tiers.mjs` table +
module-order registration, and map-cell edits. No stats, AI,
damage, or mechanics code touched. Build reproducibility: scratch
rebuild regenerates art-data md5 `68fbc752…` and game.js md5
`3611a810…`, byte-identical to the tree. personal/: battery
rebuilds regenerate it from source (observed at 09:24 and 09:54
UTC during this QA session, incl. after my own restore), so its
byte-identical state is a post-battery restore state, not a
steady state; QA re-restored personal/ to HEAD and the
`personal:` pin to `ce64da2b…0bb5` as the final tree action, per
standing procedure — the implementer's claimed end state is the
correct procedure and is what the tree is left in.

**7. Leftovers L1–L6 — each verified.**
- L1 LD-5 species palette depth: CONFIRMED (min 4 marill front,
  median 13, max 21 — palette rig + W8 rig agree).
- L2 LD-5 tile median: CONFIRMED (median 4 over 602 tile sprites,
  palette rig, my run).
- L3 PL-3 warp-frame max 12.7ms: CONFIRMED AS RECORDED — rests on
  W7 QA's 848-frame walk; not independently re-measured by me
  (no frame rig re-run in this QA); nothing in W8 touches the
  render loop beyond shadow width, and no contradicting evidence.
- L4 black margins §7.8: CONFIRMED untouched (no layout/camera
  change in the diff).
- L5 art-census delta failures: CONFIRMED exactly 18 in my
  audit-art-census run, all tile deltas, zero species/battler
  failures, pre-existing.
- L6 palette rig stale 72 cap: CONFIRMED — rig prints FAIL at
  union 623 vs the stale 72 constant; governing cap is 640,
  623 ≤ 640 PASS. Rig defect as recorded.

**Notes (non-gating).** (i) TX-1 interiors figure and the Seafoam
cell count corrected above. (ii) The guest-boot flow in this
sandbox's headless Chromium is flaky (~50% per attempt; a failed
boot leaves `BattleScene` construction reading `ally.stages` of an
unloaded party) — a harness artifact also present on the base
tree, not a W8 issue; all captures above are from clean boots with
zero JS errors. (iii) 5e/PL-3 and L1/L2 remain genuine open work
for a future wave, exactly as the implementer recorded.

Mission grade: **PASS WITH NOTES** — W8's claims survive cold
verification; the Premium+ art mission is complete with L1–L6
honestly on the books.

## Arc Chain Stage F — Foundation (2026-10-29)

Implementer pass for the arc chain (ADR-027 + Amendments 1–2; roadmap
`~/workspace/ashs-journey-qa/arc-roadmap-platinum.md` §2/§7). The
foundation only: registry, transition machine, ferry-network rule,
dex/HUD horizon presentation, Journey grouping, and the level-band
cap conversion. NO new region content (Valencia + the Vermilion ferry
NPCs land in Stage O1), nothing deployed, **personal/ byte-identical**
(shas verified against HEAD at commit time).

### 1. The ARCS registry — `src/data/arcs.mjs` (new, single arc source)

Rows: `kanto` (Arc 1, Yellow, ch [1], horizon 151, band 1–100 idx 1,
badgeSet kanto/8, status shipped, origin — embarkPort null) ·
`orange` (Arc 1.5, anime-original, ch [2], horizon 151, band SHARES
Kanto {1,100,1}, orange/4, status **next**, embark vermilion →
arrival valencia) · `johto` (Arc 2, ch [3,4,5], 251, {101,200,2},
johto/8, embark pallet → newbark) · `hoenn` (Arc 3, ch [6], 386,
{201,300,3}, hoenn/8, vermilion → littleroot) · `frontier` (Arc 3.5,
ch [7], 386, band **null = open level**, symbols/7, regionKey kanto)
· `sinnoh` (Arc 4, Platinum, ch [8], 493, {301,400,4}, sinnoh/8,
vermilion → sandgem) · five sealed future rows `unova`/`kalos`/
`alola`/`journeys`/`horizons` (ch 9–13, horizon 1025, bands continue
the pattern as data). Each row carries `completionKey`,
`completionFlag` (the registry completion-test hook — Kanto's is the
shipped `champion`; later arcs' flags are named now so their stages
register data, not machinery), `hookGiver`, `summaryLines`,
`hookLines`, `enRouteLines` (all player-facing copy original; the
Kanto→Orange hook is the GS Ball errand in the roadmap §2.3 voice,
spoken by Prof. Hawthorn — this game's professor; later hooks are
honest single-purpose lines, the sealed rows future-tense with no
playable claims). Helpers: `arcById`, `arcForChapter`, `nextArcOf`,
`currentArcOf`, `levelCapFor` (band max; open level = **Infinity** —
the documented convention, so `<`/`>=`/`Math.min` consumers behave
unchanged), `dexHorizonFor`, `arcDexSpan` (previous distinct horizon,
so Orange shares 1–151 and the Frontier shares Hoenn's 252–386),
`badgeCountFor`, `arcCompletionMet`, `arcStateOf` (complete/current/
locked-next/sealed from regionsDone + story.arc + directive; a
registry-`sealed` arc can never read locked-next), `deriveArcDefaults`.

### 2. Save state — `story.arc` / `arc_directive` / snapshots

`defaultState` gains `story.arc: 'kanto'`, `story.arc_directive:
null`, `story.arcDexStart: 0`, `story.arcStartPlaytime: 0` (schema
version stays 2; no existing field changes shape). The fill path
(`schema.mjs` → `deriveArcDefaults`, run on every load) derives
legacy state: mid-Kanto → arc kanto, no directive; **Kanto-complete
→ arc 'kanto' with the directive pending on 'orange'** — completion
is read from regionsDone OR a HoF entry OR the shipped `champion`
flag (the shipped game never wrote regionsDone; HoF/flag are its
real completion evidence). Design decision, flagged: the derived
`story.arc` stays `'kanto'` until the homecoming walks it forward —
the directive field carries the pending target, so
`currentArcOf`/caps/horizons keep reading the arc the player is
actually finishing. Snapshots default truthfully for Arc 1 (0/0 —
the journey began there) and to current totals for later arcs; a
spent directive (hook flag set) is never re-derived. Client schema
validates the four fields (closed arc vocabulary, bounded counters);
the server validator does the same from the `arcs` table gen-tables
now emits from the registry (tables.json regenerated via the tool,
`--check` clean) — a migrated legacy completed save passes BOTH
validators (suite A27).

### 3. The transition machine — `src/game/arcs.mjs` (new)

Registry-driven, names no region. `checkArcCompletion(g, done)`:
when the current arc's predicate holds and `arc_card_<id>` is unset,
it commits first (flag + regionsDone += completionKey + directive =
next arc), then shows the **ARC COMPLETE card** — title, badges
n/total for the arc's badgeSet, the registry league-result lines,
dex gained this arc (caught − arcDexStart) + running national
n/horizon, the HoF team (latest entry; portraits live in the HoF
viewer — the card is a dialogue card in the game's ending idiom, the
surface CREDITS_LINES play on, so every headless drive that drains
the credits drains this), playtime this arc, and the forward line.
Call sites: `runEnding` (the shipped HoF path — the event chain
resumes after the card) and `sysLoadMap` (legacy completers get
their card on first entry). **Homecoming** (`tryHomecoming`, hooked
in `sysLoadMap` for `house-pallet-ash` — the real Mom's-house map
id): Mom's welcome → the summary in fiction (Hawthorn's dex rating,
relayed) → the next arc's registry hook scene; completion clears
the directive, sets `story.arc`/`story.region`, stamps both
snapshots, sets `hook_<id>` + `embark_<id>`. **Sealed next arc:**
the ritual completes (hook delivered, directive cleared) but the
arc does NOT advance and NO embark flag is set. Amendment 1 holds
throughout: the machine touches flags + story.arc only — party,
levels, items, money, dex, honors are never read for writing.
**Quest Log:** while the directive is set, a pinned first entry
'★ Go home — return to Pallet Town' (value `arcdirective`) shows
the directive text; it completes no other way.

### 4. Ferry network generalization

The handler (`overworld-systems.mjs` `sysNpc` ferry branch) gained
the network rule beside the untouched plain path: an NPC with
`ferryArc: '<arcId>'` offers travel iff `arcFerryAllowed` — the
embark is armed (`embark_<id>`) OR the arc was reached before
(`reachedarc_<id>`, stamped by any completed crossing, or the
arrival map's `reached_<map>` flag). Riding plays the registry
en-route card ('— days at sea —') before landing via the dest map's
start. The three shipped NPCs carry no `ferryArc` and keep the exact
prior behaviour (the landing steps were factored into one closure
shared by both branches — behaviour-identical). Headless proof with
the existing maps (suite B10–B12): a Pallet→Vermilion test port
stays gated pre-embark, sails post-embark, and the return leg sails
with the embark flag DELETED (reached is enough — no-soft-lock).

### 5. Dex / HUD presentation (data layer untouched, DEX_TOTAL 1025)

HUD pill (`overworld.mjs` syncHud): `Dex n/` + `dexHorizonFor(state)`
(151 in Arcs 1/1.5). Dex screen (`main.mjs` openDex): two header
lines under the chapter row (which stays items[0] — the
qa-changed-flows anchor) — **Regional** (current arc's span,
caught/total) and **National — Platinum horizon: n/493 (pct%)** —
plus the sealed divider before Close: '— More Pokémon are known to
exist. Their regions are future arcs. —' (species past 493 keep
rendering as ??? rows below it, exactly as undiscovered ones do).
`oakRating` bands re-keyed to the 493 horizon (bond framing path
untouched; the Kanto completion is honoured inside its band).
Diploma: `checkDiploma` (151) is UNCHANGED and stays the Arc 1
honor; new `checkPlatinumDiploma` awards the Platinum Diploma at
493 of the run's OWN catches (ownCaughtMap, the Phase-6 rule),
checked beside checkDiploma in `Game.update`; `openDiploma` shows
the Platinum plate once earned, the Kanto plate otherwise. Nothing
is un-awarded on any save.

### 6. Journey grouping

`main.mjs` openJourney: chapters render under registry ARC headers
(Arc 1 · Arc 1.5 · Arc 2 · Arc 3 · Arc 3.5 · Arc 4 · one FUTURE ARCS
header for ch 9–13), each header carrying its `arcStateOf` word;
chapter rows + detail view are byte-identical to before.
`main-systems.mjs` openRegions: the same grouping over the REGIONS
chain (band headers from the same registry + state helper — one
logic, two surfaces); region rows unchanged. The Journey row count
moves 34 → 40 by the six added headers, so qa-changed-flows' stale
b2 expectation (30) still fails exactly as baselined — the failure
set stays {b2, d9}.

### 7. Bridge card → directive pattern

`story-kanto.mjs` CREDITS_LINES: the static 'TO BE CONTINUED — the
Orange Islands await.' line is REMOVED (a comment records the
retirement); `runEnding` now hands off to the machine (§3), so only
one ending plays.

### 8. Level-cap reads converted to `levelCapFor(state)` (Amendment 2)

With Arcs 1/1.5 live every read still yields 100 — Kanto behaviour
is identical by construction and proven by the battery.

| Read | Site |
|---|---|
| Rare Candy target disable | `src/game/main-systems.mjs` (levelUp branch) |
| XP Candy target disable | `src/game/main-systems.mjs` (xpBoost branch) |
| XP Candy level-up loop clamp | `src/game/main-systems.mjs` (xpBoost branch) |
| Battle XP level-up clamp | `src/game/battle.mjs` updateXp |
| Cheat Terminal level stepper cap (×3 keys) | `src/game/overworld-systems.mjs` openCheatShop onKey |
| Challenge-leader +2 cap | `src/game/rules.mjs` trainerLevelFor |

**Deliberately NOT converted in this stage (honest leftover):** the
save-validation level bounds — client `schema.mjs` mon/HoF 1..100
and server `validator.mjs` `isInt(m.level, 1, 100)` (+ the HoF
normalizer clamp in `state.mjs`). They are a matched client/server
pair whose rejection of level 101 is pinned by the validator suite
(A25-era test 'reject level 101'), and no arc with a band above 100
is playable in this build; when the Johto stage ships content, the
bound becomes a registry read on BOTH sides in the same change
(gen-tables already carries the registry to the server).

### 9. Battery at this commit

New suite `tests/arc-foundation-checks.mjs` **47/47** (registry
integrity incl. chapters 1–13 exactly-once + monotonic horizons;
cap/horizon helpers; the arcStateOf matrix; legacy fixtures —
mid-Kanto, HoF-complete, regionsDone-complete, post-homecoming —
deriving with zero data loss; both validators; the full directive
lifecycle, both homecomings, ferry gating, HUD/dex/Journey surfaces,
the Rare Candy registry read, and runEnding's handoff, all driven
headlessly through the real bundle). Public battery: build clean ·
campaign-smoke **24/24** · qa-changed-flows failures **exactly the
standing baseline {b2, d9}** · Track B **114/114** (documented
invocation) · save-contract **6/6** · validator **51/51** + fuzz
**2000/2000** · cheat-shop **44/44** · fidelity **35/35** ·
audit-headless **17/17** · budgets all gates pass · drift-gate
guest ≡ strip(vercel) PASS (personal divergence by design, frozen
edition). battle-model **39/45** and rejuv phases 2–6 (each short
only its C01 real-browser check — 'chromium did not start' /
sandbox-browser flake) were **proven base-parity by stash A/B at
HEAD**: identical counts and failure sets with these changes
removed; rejuv phase1 44/44 clean. audit-laptop not run (needs the
live-browser harness; its dex/Journey surfaces are covered
headlessly by the new suite + qa-changed-flows).

### 10. Leftovers, named

- Stage O1 wires the actual ports: Valencia map + the Vermilion ↔
  Valencia `ferryArc: 'orange'` NPCs (the handler + rule ship here;
  no shipped NPC carries `ferryArc` yet, deliberately — a port with
  no destination map would be a fake crossing).
- The GS Ball ITEM is granted by the Orange stage, not here (the
  homecoming delivers the errand only, per the stage brief).
- Save-validation level bounds stay 1..100 until the Johto stage
  (§8) — the one registry read that is staged, not shipped.
- `story.region` for the Frontier arc reads 'kanto' (its regionKey)
  — the Regions chain has no Frontier row; the Journey grouping
  carries the arc.
- Orange's completion flag is named `orange_champion` in the
  registry; the Orange stage's league code must set exactly that
  flag (or amend the row) when it ships.

## Arc Chain Stage O1 — Orange Islands: Maps, World Art, Data (2026-10-29)

Implementer entry — pending independent QA. Base: Stage F @ 84372a8.
Scope per the arc-chain mission: the Orange archipelago as data + art +
travel only. Story/quests (O2) and the Pokémon 2000 / Lugia arc (O3)
are NOT in this stage; gym interiors are layouts without leaders or
battles, and `orange_champion` is still set by nobody.

### 1. Map census — 30 new maps in `src/data/maps5.mjs`

Registered in `src/data/merge.mjs` (`Object.assign(MAPS, MAPS2,
MAPS3, MAPS4, MAPS5)`) and `scripts/module-order.json` after maps4.
Merged map total: 70 → 100. No id collisions with the Kanto set.

| Class | Maps (id — size) |
|---|---|
| Island exteriors (11) | valencia 28×18 · mikan 26×16 · navel 26×18 · moro 26×16 · trovita 26×16 · kumquat 28×16 · pummelo 30×18 · shamouti 28×18 · fire-isle 24×14 · ice-isle 24×14 · lightning-isle 24×14 |
| Sea lanes (4) | orange-sea-west / -central / -east / -north, all 30×16 |
| Interiors (15) | ivy-lab 18×12 · mikan-gym / navel-gym / trovita-gym / kumquat-gym 16×10 · pummelo-stadium 24×14 · shamouti-shrine 16×12 · shamouti-deep 16×12 · fire-cave / ice-cave / lightning-cave 14×10 · house-valencia / house-mikan / house-kumquat / house-shamouti 10×7 |

Every exterior and sea map is ≥24×14 (viewport-filling from the first
tile, roadmap §5). Interiors follow the shipped size idiom (gyms
16×10, houses 10×7). Landmarks per P-6: Ivy's lab (Valencia), the
Navel peak with its switchback path and summit sign, Pummelo Stadium
(12-wide grand facade on the exterior + a 24×14 arena interior),
the Shamouti shrine + plaza + Slowking's rock, Moro's ruins.

Shared interiors reused, never re-authored: every island Pokémon
Center door warps to the shared `center` and every Mart door to the
shared `mart`, both with the shipped `via{}` return tickets; each
Mart island carries its own `mart:` clerk def (stock + dialogue) in
its town data, fielded inside the shared Mart exactly as in Kanto.
Houses follow the shipped per-town idiom (the `viaExit` mechanism is
mart/center-only in the engine, so no shared house interior was
invented): four house interiors reuse shipped house-template rows
with per-island returns and residents.

Layout (hub-wise): Valencia SW → sea-west → Mikan N / sea-central →
Navel centre, Moro S, sea-east → Trovita S, Kumquat N, Pummelo far E;
sea-north → Shamouti far N, ringed by Fire (W), Lightning (E) and
Ice (N) isles. Surf stitching is edge-warp pairs on both maps of
every adjacency, with geographically coherent landings (entering
from the south lands on the north inset, etc. — a mirrored-landing
bug in the first generator pass was caught by the sweep's entry
labels and fixed before commit).

### 2. Travel — the no-soft-lock law, proven

- **Vermilion dock**: MAPS5 patches MAPS4's repaired Vermilion with
  ONE added NPC, CAPT ORANGE at (13,10): `ferry: 'valencia',
  ferryArc: 'orange'`, sailor art, dialogue naming the Orange
  crossing and Hawthorn's booking rule. Stage F's handler gates him:
  pre-embark the gate line answers; post-homecoming the crossing
  runs; returns are unconditional (reached-before rule).
- **Valencia dock**: the mirror ferryman (`ferry: 'vermilion',
  ferryArc: 'orange'`) plus plain hoppers.
- **Island-hopper graph** (plain `ferry:` legs, an NPC at BOTH docks
  of every leg, unconditional both ways): valencia↔mikan,
  valencia↔navel, mikan↔navel, navel↔moro, moro↔trovita,
  trovita↔kumquat, trovita↔pummelo, kumquat↔pummelo,
  pummelo↔shamouti, shamouti↔fire-isle, shamouti↔ice-isle,
  shamouti↔lightning-isle. The graph is connected (machine-checked).
- **Sea lanes** are surfable (`~` tiles + water tables); every shore
  transition is two-way by construction (edge-warp pairs).

**Connectivity gate** — `~/workspace/ashs-journey-qa/orange-connectivity/orange-sweep.mjs`
(celadon-sweep methodology extended: Surf assumed, mart clerks
filtered as the engine filters them, interiors as connectors to
fixpoint): **all 30 maps PASS** — every entry reaches every warp on
its map; ferry graph connected with every Orange leg two-way; every
new map reachable from Valencia in the map-level warp+ferry graph.
Full per-entry table in `orange-connectivity/sweep-results.txt`.
**Live drive** — `orange-connectivity/orange-live-drive.mjs` through
the real built bundle: **9/9** — all 30 maps `loadMap()` in the
engine; pre-embark crossing refused in Vermilion; embark-armed
crossing sails via the en-route card and lands on Valencia's start
with `reachedarc_orange` stamped; return sails with the embark flag
cleared; a plain Valencia→Mikan hopper leg sails and lands at
Mikan's dock start.

### 3. World art — 12 new tile kinds (O1 block, tiles.mjs)

Chars continue the W6/W7 allocation at U+1E00+152..163, same class
system: props `palm` (curved trunk, six-frond crown, cast shadow —
P-2), `coral`, `shrinegate`, `feststand`, `gspedestal` (the GS Ball
pedestal visual in ivy-lab), `stadiumcrest`; floors `sand`,
`tropgrass`, `shrinefloor`, `stadiumfloor`; walls `shrinewall`,
`stadiumwall`. All twelve are real authored `.pix` in
`assets/sprites/pix/tiles/` (generator + sources kept in
`orange-connectivity/gen_o1_art.py`), wired in `art.mjs`
(TILE_ART / PROP_KINDS / floor-variant families) and the WALKABLE
set in `maps.mjs` (the four floor chars). Tiles-family palette
union: 623 → 638 of the 640 budget (new hexes held to 15 by reusing
shipped tones — no budget raise needed). `build-art.mjs` clean:
2,296 sprites.

**Richness** — `orange-connectivity/orange-richness.mjs` (Premium+
W5 logical-raster method, real resolver + ART): **all 30 maps PASS
the floors.** Island towns 132–178 unique colours (floor 80);
sea lanes 75–98 and interiors 57–76 (floor 55); no ground family
above 40% of any town's cells (worst: fire/ice/lightning-isle water
at 39.3%). Full table in `orange-connectivity/richness-results.txt`.
Ambient life: 2 flavour NPCs per island (sailors, swimmers, elders,
keepers on the shrine isles) plus ferrymen, mart clerks, gym
attendants, the stadium usher, the shrine keeper, a lab aide and
house residents — all original dialogue, flavour only; signs on
every dock, gym, the lab, the peak, the ruins and the shrines.

### 4. Wild data

Per the shipped idiom (`encounters.table` grass / `.water` surf):
island grass = coastal Kanto species (Pidgey/Rattata/Oddish/Meowth/
Spearow/Pidgeotto, Lv 25–38); shores + sea lanes = water species
(Tentacool/Magikarp/Poliwag/Goldeen/Krabby/Horsea/Staryu/Shellder,
Lv 25–45; Tentacruel rare on the lanes); Navel slopes = Geodude/
Onix/Graveler/Rhyhorn Lv 28–40; shrine isles sparse themed tables
(Vulpix/Growlithe · Seel/Shellder · Pikachu/Magnemite/Voltorb).
No new species in any wild table; Lugia appears in none.

### 5. Lugia (#249) — the Ho-Oh precedent, followed exactly

One full species entry in `species2.mjs` beside Ho-Oh: Psychic/
Flying, base 106/90/130/90/154/110, catchRate 3, growth 'slow',
baseXp 306 — facts verified against PokeAPI at build time
(2026-10-29, build-time only; no sprites or expression taken).
Learnset restricted to the game's move table (Gust/Whirlwind at 1,
Mist 20, Recover 29, Swift 43, Psychic 55, Hydro Pump 71, Sky
Attack 90 — a curve mirroring Ho-Oh's shape); original flavour line;
no evolution entry. Hand-drawn original 64×64 front+back `.pix`
(`lugia-front`/`lugia-back`, + derived/shift bobs from the pipeline)
— PokeAPI sprites were never fetched. Companions on the precedent:
`idle-classes.mjs` (hover) and `battler-tiers.mjs` (L) rows;
`gen-tables` regenerated (server species list 162 → 163).

Roster invariants: Kanto 151 diploma set unchanged (dexNo 249 is
outside 1–151); roster 162 → 163. Test expectations updated ONLY
where the Ho-Oh precedent set them: `cheat-shop-checks.mjs` (A02
count, A10 canon table + Lugia row, B20/B21 — Lugia IS claimable at
the Cheat Terminal, verified, because the picker is data-driven,
identical to Ho-Oh) and `fidelity-checks.mjs` (roster count line).
Lugia has NO wild/story placement in O1 — the catchable encounter
is O3's deep-shrine legendary arc, per the coordinator ruling.

### 6. Battery at this commit

Build clean (vercel + guest; personal target NOT built — see §7) ·
campaign-smoke **24/24** · qa-changed-flows failures **exactly
{b2, d9}** (the standing baseline) · cheat-shop **44/44** ·
fidelity **35/35** · arc-foundation **47/47** · audit-headless
**17/17** · orange-sweep **30/30 + ferry graph** · orange-richness
**30/30** · orange-live-drive **9/9**. Bundle: `public/game.js`
5,129,070 bytes (gate 12,582,912 — 40.8%); guest standalone
5,154,216 bytes.

### 7. Leftovers, named

- `personal/` byte-identical (game.js sha256 f434ba63… verified
  before and after): the personal bundle was not rebuilt, and the
  `personal:` line in `dist/content-hash.txt` is the preserved
  prior line, per the Stage F convention.
- Gym interiors carry flavour signs + an attendant each, but no
  leaders, trainers or battles — Stage O2. The Mikan sign's
  parenthetical says so in-fiction; the other gym signs name the
  badge challenges only.
- `shamouti-deep` is authored and reachable (through the shrine's
  back passage) but its Lugia encounter, the bird events and
  Slowking's counsel are Stage O3; its altar sign is written to
  read honestly in the meantime.
- The GS Ball is a pedestal visual + sign text in ivy-lab; the
  item grant and Ivy's scene are Stage O2 (the item id already
  exists from the Cheat Shop stage).
- One generator wart, disclosed: maps were produced by a
  deterministic generator (`orange-connectivity/gen_maps5.py`) —
  an early pass mis-indexed W6 tile chars by 8 (hyphenated kind
  names skipped by its parser); caught by the sweep's kind census,
  fixed, and both gates re-run green on the corrected file.
- Sea-lane ground-family share is ~90% water by design (they are
  open sea); the ≤40% ground rule is a town rule and is reported
  for towns only in the richness driver.

---

## Stage O2 — Orange Story: quest chain, GS Ball, Lapras, the Orange Crew, Pummelo League (2026-10-29)

Owner mission: the Orange arc gets its story spine on top of Stage
O1's 30 maps — Prof. Ivy's GS Ball errand, a 3-stage quest chain,
Lapras's gift and pod reunion, the four Orange Crew gyms with
original challenge scenes, Drake's 6v6 at Pummelo, and the full
badge plumbing (state, schema, server validator, tables, Cheat
Terminal). Build + self-test + local commits only; NOT pushed,
NOT deployed. `personal/` byte-identical (game.js sha256
f434ba63… verified before and after; fresh build = vercel +
guest targets only, personal line in dist/content-hash.txt
preserved, Stage F convention).

### 1. Story data (new src/data/story-orange.mjs)

- **ORANGE_QUESTS** in the MAIN_QUESTS idiom (id / title / flag /
  stage array / done-line): `q_orange_gsball` (flag
  `orange_gsball`) → `q_orange_crew` (flag `orange_crew_done`,
  `badgeCount: true` so the Quest Log stage text tracks n/4) →
  `q_orange_league` (flag `orange_champion`, the registry's
  completion flag). The chain file carries an explicit append
  seam: Stage O3 appends its 2000 / Lugia stages here — the
  climax is NOT written in this stage.
- **ORANGE_EVENTS**: `ev_orange_ivy` (intro + GS Ball grant),
  `ev_orange_lapras` (gift, flag step AFTER the gift step so the
  flag can never set on a refused delivery), `ev_orange_lapras_pod`
  (flag-only reunion; no removal step exists in the data — Lapras
  is never taken away, by construction).
- **ORANGE_TRAINERS**: cissy (Seadra 38 / Starmie 40), danny
  (Nidoqueen 41 / Machoke 42 / Scyther 44), rudy (Electabuzz 44 /
  Exeggutor 45 / Starmie 47), luana_a (Alakazam 48 / Hypno 46),
  luana_b (Marowak 50 / Gengar 48), drake (Ditto 52 / Onix 53 /
  Gengar 54 / Venusaur 55 / Electabuzz 56 / Dragonite 58; no
  badgeId — the trophy path awards his prize).
- All dialogue and copy is original writing; the anime is the
  canon reference (ADR-015) but no line is borrowed.

### 2. Engine wiring (no parallel systems)

- **GS Ball grant**: a new generic steps-runner case `{gsBall}`
  in overworld-systems: if `bag.gsball > 0` (Cheat Terminal
  stock) Ivy's scene plays its variant line and grants nothing —
  the errand can never soft-fail or duplicate; otherwise exactly
  one `gsball` is granted. Ivy's intro fires from a `sysLoadMap`
  entry hook on first `ivy-lab` entry (guarded against firing
  during the Arc-F homecoming card window).
- **Lapras gift**: a new `{giftCapSafe}` steps case reusing the
  Cheat Shop stage's `cheatDeliverMon` seam: party if room, else
  the first PC box with space, with a toast naming the box; a
  total refusal stalls the event chain so the flag stays unset
  and the scene retries on a later entry. Scene triggers: first
  Valencia entry with ≥1 Orange badge (injured-Lapras heal beat,
  Lv 30); pod reunion on first `pummelo` / `orange-sea-north`
  entry with 4 badges and Lapras joined — dialogue-only, Lapras
  visits the pod and chooses to return; nothing is removed.
- **Leader scenes**: `sysNpc` dispatches `npc.orange` to one
  `runOrangeNpc` before the generic paths. Cissy: three generous,
  retryable, no-fail aim prompts (menu flavour) → battle. Danny:
  arrival at the summit gym IS the climb (his own line says so) →
  battle → post-win sled-ceremony in dialogue. Rudy: a drill menu
  tied to the player's actual party types (reads SPECIES types,
  falls back warm-generic) → battle; his Starmie gets its dancing
  line. Each leader keeps a warm post-badge line; beaten leaders
  never re-battle.
- **Luana — deliberate, disclosed deviation**: her anime format
  is a double battle; the battle engine is singles-only. Honest
  adaptation shipped: a **two-stage match** — stage A
  (`luana_a`, Alakazam pair) → on victory NO heal, party state
  (HP/PP/status) carries straight into stage B (`luana_b`,
  Marowak pair); the Jade Star Badge awards only on clearing
  both. Her dialogue names the format plainly up front ("my
  double battle — two pairs, back to back, no rest between
  them"). Recorded here as a deviation from anime format, not
  passed off as one.
- **Badge award generalized**: `winTrainer` reads the trainer
  def's `badgeSet` (default `'kanto'`) and writes
  `badges.<set>` + `badge_<root>` + the beat flag; at 4 Orange
  badges it also sets `orange_crew_done`. Kanto behaviour is
  unchanged (default set). One canonical order table,
  **BADGE_SETS**, lives in `src/data/items.mjs` and is read by
  the leader award, the Cheat Terminal claim, and the tables
  generator — no second copy anywhere.
- **Pummelo League**: a stadium official NPC gates the room's
  business — refusal dialogue names the count held/needed
  ("You hold N of the 4 Orange Crew badges…"). Drake's own
  pre-battle gate repeats the check; at 4 badges his challenge
  menu opens the 6v6. Victory path (`finishOrangeLeague`):
  sets `orange_champion`, adds `'orange'` to
  `story.regionsDone`, grants the **Winner's Trophy**
  (`winnerstrophy`, new collectible ITEMS row) once, records
  the HoF entry in the shipped `story.hof` shape (team snapshot
  + `badges: <orange count>`), then calls
  `checkArcCompletion(g)` — the Stage F transition machine
  fires the ARC COMPLETE card and pins the Johto directive
  itself. No hand-rolled ending exists.
- **Quest Log**: a "— ORANGE ISLANDS —" section in the Kanto
  section's idiom, shown when the Orange arc is current or
  reached (arc id, `hook_orange`, any Orange badge, the GS Ball
  flag, or regionsDone), with per-quest detail cards; the crew
  row tracks n/4 live. There is no dedicated badge-case screen
  in the codebase (verified by search), so Orange badges
  surface as key-pocket ITEMS rows in the Bag, exactly like
  Kanto's — no screen was invented.
- **Objective line**: when the current arc is orange,
  `sysObjective` leads with the chain (fetch the GS Ball → the
  Crew at n/4 → the League) ahead of the generic lines.
- **Grounds**: `ivy-lab: open`, `mikan-gym: tide`,
  `navel-gym: frost`, `trovita-gym: rubble`,
  `kumquat-gym: mind`, `pummelo-stadium: open` — picks from the
  existing 15 only; no new Grounds.

### 3. Badge ids, validator, tables

- **Badge id convention (flagged decision)**: the mission text
  listed the set as `['coraleye','searuby','spikeshell',
  'jadestar']`, but Kanto's idiom is the `-badge` suffix
  (`boulderbadge`, …) and `badges.kanto` holds full item ids.
  Orange follows the idiom: `coraleyebadge`, `searubybadge`,
  `spikeshellbadge`, `jadestarbadge` — each also a key-pocket
  ITEMS row (the badge case IS the Bag's key pocket here), with
  `badge_coraleye` etc. flags set on award, mirroring Kanto.
  `badges.orange` validates with the same PREFIX-ORDER rule as
  Kanto, client (`bad-badges-orange`) and server
  (`bad-badge-order`) — a completed Orange save (4 badges +
  trophy + GS Ball + `orange_champion` + HoF entry) round-trips
  clean on both validators (suite B20).
- **Save fill**: legacy saves gain `badges.orange = []` through
  the existing `fillV2Defaults` path with zero loss (proven in
  A10: kanto badge + name intact).
- **Tables**: `tools/api-scripts/gen-tables.mjs` now derives
  both badge sequences from BADGE_SETS and includes the three
  Orange quest ids; `api/_lib/data/tables.json` regenerated,
  `--check` in sync (tablesVersion 9490647279a2…). The server
  validator reads `badgeSequences` generically — no validator
  code changed.
- **Cheat Terminal**: badge stock is data-driven off BADGE_SETS
  (Orange appeared without a stock edit); `cheatClaimBadge` was
  rewritten set-aware — a claim prefix-completes ONLY its own
  set, sets the crew flag at 4, and never touches another set
  (B18/B19 prove Kanto stays untouched by Orange claims).
- **Named content-count ripple (cheat-shop A02)**: items count
  130 → 135 (4 Orange badge items + Winner's Trophy). This is a
  pure content-count ripple of the Ho-Oh precedent class; the
  baseline in tests/cheat-shop-checks.mjs was updated with the
  ripple named in its assertion text, and it is named here.
  No other baseline moved: qa-changed-flows failures remain
  EXACTLY {b2, d9}.

### 4. Verification (all headless, real bundles)

- tests/orange-story-checks.mjs (NEW): **38/38** — Part A data /
  validator units (quest idiom, BADGE_SETS ↔ ITEMS, GS Ball
  identity with the collectible, team sheets, Luana two-def
  shape, Drake 6v6, cap-safe gift data, schema prefix rules,
  server round-trip incl. rejection of a non-prefix set, tables
  sync, Grounds, placements, walk-to-leader BFS for all six
  rooms). Part B drives the real campaign bundle: Ivy grant
  once + cheat-owned variant (bag stays 5), Lapras party gift +
  Box 1 delivery with the naming toast + once-only + pod
  reunion (Lapras never removed), all four badges through the
  real NPC → challenge → battle path, Luana stage-B capture
  proving party damage carried with no heal, Drake refusal at
  3 badges from BOTH the official and Drake naming "3 of the
  4", Drake victory asserting `orange_champion` + trophy +
  HoF + `arc_card_orange` + regionsDone ∋ orange + directive
  'johto' + the card's own lines seen (the machine fired, not a
  lookalike), Quest Log 2/4 tracking, cheat claims per set.
- Battery: campaign-smoke **24/24**, arc-foundation-checks
  **47/47**, cheat-shop-checks **44/44**, fidelity-checks
  **35/35**, validator tests **51/51**, qa-changed-flows
  failures exactly **{b2, d9}**, Orange connectivity sweep
  **30/30** (leader placements block no interior — A17's
  walk-to-leader BFS covers every gym + the stadium).

### 5. Leftovers, named

- Stage O3 appends the 2000 / Lugia stages to ORANGE_QUESTS and
  owns Shamouti, the birds, Slowking and the GS Ball's payoff —
  none of it is written here; Ivy's scene only promises the
  ball "matters later", in-fiction.
- Luana's true double battle waits on a doubles-capable battle
  engine, if one is ever built; the two-stage adaptation is the
  shipped format until then (deviation disclosed in §2).
- The stadium official is a gate + flavour NPC only; no League
  undercard / Elite-style gauntlet exists at Pummelo — Drake is
  the League, as in the anime.

## Stage O3 — Pokemon 2000: the Shamouti Climax + the Lugia Legendary Arc (2026-10-29)

Owner mission: the 2000 chain on O1's Shamouti geography and O2's
quest chain — a storm trigger at 2 Orange badges, three titan quell
battles, the Lugia climax, and a full Lugia legendary arc with the
real catch at Shamouti Deep. Build + self-test + local commits
only; NOT pushed, NOT deployed. `personal/` byte-identical
(game.js sha256 f434ba63… verified before and after; fresh build =
vercel + guest targets only, personal line in
dist/content-hash.txt preserved, Stage F convention).

### 1. Trigger design

- **Gate**: first arrival on `shamouti` with **≥2 Orange badges**
  (the Sea Ruby held — badges.orange is prefix-ordered, so length
  ≥2 ⟺ Sea Ruby) and no `orange_2000_active` flag fires
  `ev_orange_2000_storm` from the sysLoadMap Orange block (the O2
  entry-scene idiom). At 0–1 badges Shamouti is O1's peaceful
  festival island, untouched; the shrine caves hold dormant,
  visit-able shrines (their altar event tiles are flag-gated on
  `orange_2000_active`, so pre-storm they are inert flavour).
- **The antagonist is an original character**: **Vance Halloway**, a
  wealthy sky-collector who cages wonders for a frozen menagerie —
  the Still Sky Collection. He is not a renamed film character; no
  line in this stage is borrowed from any film or episode (all
  writing original, anime as canon reference per ADR-015).
- **Slowking** counsels from its rock: a new SLOWKING NPC at
  shamouti (6,12), on the grass beside the west-shore rock tiles
  (4–5,12) the plaza sign names ("Mind the Slowking rock"), with
  base / storm / post-storm dialogue states; it also speaks in the
  trigger and climax scenes (its shrine duty).
- **Never a gym blocker**: nothing in the chain gates badges 3/4,
  Drake, or `finishOrangeLeague`; the machine's `orange_champion`
  flow is byte-identical. Proven both directions (suite B21–B24).

### 2. Quest + arc shape

- `q_orange_storm` APPENDED to ORANGE_QUESTS at the O2 seam (after
  the League stage, deliberately: completion order in the log is
  display only; the stage is playable from 2 badges). It carries
  `titanCount: true` — the badgeCount idiom carried to flags: the
  Quest Log row and detail card count `orange_2000_<bird>` flags
  as "n/3 titans calmed", and the HUD objective leads with the
  storm while it is live. Completion flag:
  `orange_2000_storm_stilled`. All chain flags are region-scoped
  story flags (`orange_2000_*`) — **no schema change**; legacy
  saves at any Orange progress point fill and continue with zero
  loss (suite A10/A11, B25).
- **The Lugia legendary arc**: `arc_lugia_shamouti` —
  "The Guardian of the Sea" — defined in ORANGE_LEGENDARY_ARCS
  (story-orange.mjs), merged into LEGENDARY_ARCS by merge.mjs and
  into the validator's quest table by gen-tables (tables
  regenerated, a91f441a3f04…). It renders in the Quest Log's
  LEGENDARY ARCS section exactly like Kanto's arcs, with six
  requirement steps spelled out (Sea Ruby + storm → calm each
  titan → the proving → return to the deep altar). It is a
  DIFFERENT arc from the designed Johto `arc_lugia` stub, whose
  prereqs and lair are untouched. The arc opens (`discovered`) at
  climax completion and completes at the deep catch event.

### 3. Event-battle mechanics (uncatchability + flee behaviour)

- **Pattern used**: the shipped event-uncatchable idiom — event
  `wildBattle` steps with `uncatchable: true`, exactly the Tower
  Marowak ghost / First Movie pattern. In classic battles the ball
  is deflected with "The ball passed right through it! This
  presence cannot be caught." (the foe then acts; the ball is
  spent — the ghost's own terms); in RT battles the ball is
  refused unspent. The tests assert the refusal from the battle
  message log + foe-not-caught + battle-continues (B06, B14).
- **Quells**: Moltres / Zapdos / Articuno, Lv 50, at the
  fire/lightning/ice shrine-cave altar tiles (6,2)+(7,2), gated
  `flag: orange_2000_active` + `flagNot: orange_2000_<bird>`. Any
  order. Winning sets only that bird's flag and clears its storm
  cell in dialogue. These are NOT the Kanto arc birds: no
  `arc_zapdos/arc_moltres/arc_articuno` flag or quest entry is
  read or written anywhere in the stage (data-proven A07,
  play-proven B07); dex registration is the wildBattle step's
  standard 'seen' only.
- **Flee**: the runSteps wildBattle guard (ADR-025 QA D1) advances
  a chain only on (won && !fled), so a flee completes nothing —
  the calm flag stays unset and `ev_<id>_done` stays unwritten.
  For the cave altars the re-fire path is stepping back onto the
  altar tile (proven B08→B09→B10); for the entry-gated scenes
  (climax, catch) it is re-entering the map. Losing blacks out to
  the nearest Center per shipped rules and likewise re-fires.
- **The proving form — DECISION**: a straight win, the shipped
  event idiom (no survive-N-turns variant was built). The climax
  fires on Shamouti Shrine entry at 3/3 titans calmed
  (sysLoadMap gate), plays the collector's final grab at the
  shrine, then warps to **shamouti-deep** — the sealed altar under
  deep water-light is where the sea answers — for the battle:
  **Lugia Lv 55, uncatchable** ("the guardian tests the one who
  calmed the titans"; movie canon: the guardian is not yours to
  take). Winning stills the storm, collapses Halloway's folly
  (he retreats, humbled, in original lines), sets
  `orange_2000_storm_stilled`, completes the storm quest, opens
  the Lugia arc, and warps the player back to Shamouti plaza.
- **The catch**: entering `shamouti-deep` after the storm is
  stilled fires `ev_orange_2000_lugia` — Lugia waits in still
  water at the altar. Standard legendary pattern: Lv 55,
  `legendary: true`, CATCHABLE. Flee-safe per the Kanto arc
  idiom: the same (won && !fled) guard means a flee or a loss
  leaves Lugia waiting and the event re-fires on the next
  descent; a clean win (catch or KO, the Mewtwo idiom) completes
  the arc. Catching registers the dex normally — Lugia #249,
  national (proven B18: owned + dex.caught[249] + arc complete).

### 4. NPC state variants

- A generic `dialogueStates` mechanism: an NPC may carry
  `[{flag?, flagNot?, dialogue}]`; the first matching entry
  supplies the talk's lines. Resolution lives in ONE helper
  (`npcDialogueLines` in overworld-systems) used by BOTH talk
  paths — sysNpc's sayLines (ferry/mart flows) and the
  plain-dialogue fallback in overworld.mjs — a split the test
  suite caught and this stage fixed (elder/Slowking are
  plain-dialogue NPCs; the ferryman rides sysNpc). NPCs without
  the field are byte-identical.
- Variants shipped (storm + post-storm, post-storm first):
  SLOWKING (rock counsel / sun-patch calm), FEST ELDER MIRA
  (festival in disarray / "Sixty festivals" restored), CAPT
  MARINA-PUMM the dock ferryman (foul-weather runs / glass sea —
  the ferry menu still opens after her lines), SHRINE KEEPER ANO
  (candles won't stay lit / the song is tonight).

### 5. Order-independence proofs (hard gates)

- (a) **League first**: Drake → machine card + Johto directive →
  homecoming (hook delivered, directive cleared, sealed Johto
  does not advance story.arc) → return to Shamouti → storm
  trigger, 3 quells, climax, and the deep catch ALL complete
  (B21–B23, incl. dex 249). Regions stay visitable forever, so
  the arc stays completable after the League + homecoming.
- (b) **Storm first**: the whole climax completes at 2 badges,
  then Rudy's gym plays and awards normally (B24).
- (c) **Fire-once**: trigger, climax, and catch scenes are each
  flag-gated; re-entries are quiet (B03, B19).
- (d) **No Kanto arc contamination**: A07 (data) + B07 (play).
- (e) **Legacy saves**: flags-only state, no schema change;
  pre-O3 mid-Orange saves migrate + validate with zero loss;
  the completed-chain bundle save round-trips both validators
  (A10, A11, B25).

### 6. Verification (all headless, real bundles)

- tests/orange-climax-checks.mjs (NEW): **42/42** — Part A data /
  validator / placement units (quest shape, battle law, arc
  entry, tables sync, legacy fill, completed-save validation,
  Slowking placement, cave tiles, Shamouti-cluster BFS). Part B
  drives the real bundle: trigger gating (1 badge quiet / 2
  storm), Slowking storm counsel, Moltres ball-refusal + win,
  Zapdos flee → re-fire → win, climax gate at 2/3, the proving
  (deep geography + ball refusal + win), post-storm variants on
  all key NPCs, the deep catch (dex 249), Quest Log n/3 +
  LEGENDARY ARCS listing, and both order-independence paths.
- Battery: campaign-smoke **24/24**, arc-foundation **47/47**,
  orange-story **38/38** (A01 updated in place for the appended
  4th quest stage — the count did not move), cheat-shop **44/44**,
  fidelity **35/35**, validator **51/51** + fuzz 2000/2000,
  qa-changed-flows failures exactly **{b2, d9}**, Orange sweep
  **30/30** (the 30 Orange maps' census unchanged; the Shamouti
  cluster's walkability is BFS-proven in A16 — Slowking's rock
  position blocks nothing, every cave entry reaches both altar
  tiles, shrine → deep → altar all connected).

### 7. Leftovers, named

- Slowking's overworld sprite: the NPC carries art kind
  `slowking`, for which no authored overworld frames exist, so
  the engine's documented forge fallback renders a stand-in in
  its authored pink/cream palette (the same fallback class as
  un-arted species battle sprites). A dedicated overworld
  Slowking sprite is a world-art wave item, not this stage's.
- The storm is carried in dialogue, flags, and the HUD objective;
  there is no global weather/ambience tile state (no such system
  exists in the engine) — storm cells "clear" in scene text per
  titan, as the register records.
- Halloway's sky-barge is scene dressing (dialogue), not a map
  object; he has no post-game rematch or menagerie content.
- The O2 register's GS Ball payoff note stands: Ivy's scene still
  only promises the ball "matters later" — its Johto payoff is
  the sealed arc's business, not O3's.

## Stage J0 — Deferred Plumbing: Arc-Banded Save Validators (2026-10-29)

Arc 2 (Johto) mission, Stage J0: the Foundation's deferred validator
change. ADR-027 Amendment 2 made levels banded per arc (cap = 100 ×
bandIndex), but both save validators still hard-coded 1..100 and a
flat 2,000,000 XP ceiling. The bounds are now registry reads on both
sides of the client/server pair. Build + self-test + local commits
only; NOT pushed, NOT deployed. `personal/` byte-identical
(game.js sha256 f434ba63… and index.html a780af0b…, verified before
and after; fresh build = vercel + guest targets only, personal line
in dist/content-hash.txt preserved, Stage F convention).

### 1. The matched-pair derivation (how the cap reaches the server)

- **One derivation, defined once.** `xpCeilingForCap(cap)` in
  `src/engine/formulas.mjs` = **2 × xpForLevel('slow', cap + 1)**.
  'slow' is the slowest growth curve among the game's species (the
  shipped census: fast 8 · mediumfast 88 · mediumslow 46 · slow 21
  = 163 species; erratic and fluctuating have NO species). cap + 1
  because a mon AT the cap earned its last level against that
  threshold and its final XP share (or an XP Candy) can carry it
  past xpForLevel('slow', cap); the ×2 slack covers post-cap
  accumulation (the battle XP loop keeps adding shares to a capped
  mon without levelling it). `xpCeilingFor(state)` in
  `src/data/arcs.mjs` pairs it with the existing `levelCapFor(state)`.
  Emitted/computed values: **Kanto/Orange cap 100, ceiling
  2,575,752 · Johto cap 200, ceiling 20,301,502** · Hoenn 300 /
  68,177,252 · Frontier open (Infinity both) · later sealed arcs per
  the same formula. The old flat 2,000,000 broke inside Johto's band
  on legitimate totals alone (mediumfast Lv200 = 8,000,000;
  mediumslow = 9,019,860; slow = 10,000,000).
- **Server reach = the generated tables, never a hand edit.**
  `tools/api-scripts/gen-tables.mjs` now emits `arcBandMax` and
  `arcXpCeiling` maps (arc id → number, **null = the open-level
  band**, JSON's stand-in for Infinity) by evaluating the registry's
  own `levelCapFor` / `xpCeilingFor` on a minimal `{story:{arc}}`
  state per ARCS row — the emitted numbers ARE the client's
  derivation. tables.json regenerated by running the generator
  (tablesVersion a91f441a… → **60fc23ec…**); `--check` clean.
- **Server fallback semantics** (`arcCapsFor` in the validator): an
  absent story.arc is a pre-foundation save = a Kanto save by
  definition (the client's deriveArcDefaults agrees); an arc id
  outside the emitted map falls back to the Kanto caps and is
  rejected separately as `bad-arc`. Min level stays **1** everywhere
  — bands cap, they do not floor (a carried Lv5 mon is legal in a
  Johto save; pinned by test).
- **Honest Kanto note:** the single derivation moves the Kanto XP
  ceiling 2,000,000 → 2,575,752. No legitimate Kanto mon is stricter
  anywhere (slow-curve Lv100 total is 1,250,000; the highest legit
  pre-J0 total at cap was bounded by the cap+1 thresholds, all below
  the new ceiling), and every pre-existing validator case passes
  unchanged (51/51 of the old battery inside the new 78).

### 2. What changed

| File | Change |
|---|---|
| `src/engine/formulas.mjs` | `xpCeilingForCap` + `XP_CEILING_SLACK` (the derivation, §1) |
| `src/data/arcs.mjs` | `xpCeilingFor(state)` beside `levelCapFor` |
| `tools/api-scripts/gen-tables.mjs` | emits `arcBandMax` + `arcXpCeiling` per arc row |
| `api/_lib/data/tables.json` | regenerated (60fc23ec…), never hand-edited |
| `api/_lib/validator.mjs` | `arcCapsFor(story)` helper; checkMon level + `bad-xp` are band reads; box-mons level is a band read; HoF team + legacy levels are band reads (inside checkStory, off its own story); the `maxed-party-low-playtime` anomaly is cap-relative (party entirely at the SAVE-ARC's cap; never fires on the open-level arc, whose cap no level equals); the stale Stage F "bounds stay 1..100" comment corrected |
| `src/save/schema.mjs` | party-mon level bound = `levelCapFor(data)`; **new `bad-xp` parity check** (the client previously had NO xp bound — it now enforces the same ceiling the server does); HoF canonical + legacy entry bounds = the same cap |
| `src/game/state.mjs` | `normalizeHofEntry/List` take the owning save's cap (see audit row — a silent-clamp hazard); save-flow callers pass it: schema fillV2Defaults passes `levelCapFor(data)`, Second Journey inheritance passes the SOURCE save's cap; bare entry-counting calls keep the historical 100 |
| `scripts/build.mjs` | trainer-level build gate: 1..100 → 1..(widest finite registry band = 900) |
| `tools/api-scripts/validator.test.mjs` | +27 J0 pins (§4) |

### 3. Touchpoint audit (every level cap/bound assumption found)

| Touchpoint | Verdict |
|---|---|
| Server validator: checkMon (~L111), box mons (~L459), HoF entries (~L333/336), `bad-xp` flat 2,000,000, anti-cheat heuristic (~L407) | **FIXED** — all band reads / cap-relative (§2) |
| Client schema: party level (L29), HoF canon/legacy (L88/91) | **FIXED** — `levelCapFor(data)`; xp parity check added |
| `state.mjs` `normalizeHofEntry` clamp `Math.min(100, …)` | **FIXED** — would have silently rewritten a Johto HoF team's levels to 100 on every client load. Probe: a Johto save's HoF Lv180 survives migrate intact and validates; a Kanto save's still clamps at 100 |
| Rare Candy (`main-systems.mjs:81`) | already registry-driven — targets disabled at `m.level >= levelCapFor(g.state)` |
| XP Candy (`main-systems.mjs:96,104`) | already registry-driven — same disabled rule + level-up loop bounded by `levelCapFor` |
| Battle XP loop (`battle.mjs:1758`) | already registry-driven — `while (… && m.level < levelCapFor(g.state))` |
| Challenge-mode bump (`rules.mjs:62`) | already registry-driven — `Math.min(levelCapFor(state), level + 2)` |
| Cheat Terminal level stepper (`overworld-systems.mjs:2125`) | already registry-driven — reads `levelCapFor(g.state)` per keypress on the live state, so it caps at **200 when story.arc='johto'**, 100 in Kanto, verified against `levelCapFor` unit A08 (arc-foundation) |
| `makeMon` (`state.mjs`) / `giftMon` / `cheatDeliverMon` / `giftCapSafe` | no cap assumed — the authored level passes through; xp = `xpForLevel(growth, level)` holds for 101–200 on every curve a shipped species uses |
| Evolution level gates (`battle.mjs:1765`, `main-systems.mjs` queueEvolution) | no cap assumed — threshold reads `m.level >= sp.evo.level`; J1's band-local evo levels will work unchanged |
| `xpFracOf` (`battle.mjs:102`) | no cap assumed — level+1 threshold with an `hi <= lo` guard |
| Build trainer gate (`scripts/build.mjs`, outside the brief's src/api/tools sweep — found by the whole-repo grep) | **FIXED** — was 1..100; would have failed the build the day a Johto trainer (Lv101–200) landed. Now the widest finite registry band |
| Build encounter ranges (same file) | already band-safe — `min >= 1` only, no upper bound |
| Client schema box mons | **audited gap, deliberately NOT widened**: the client validator never level-checked box mons (defaults-fill only); the server validates boxes strictly. Pre-existing asymmetry, recorded here rather than silently changed in a plumbing stage |
| Validator fuzz (`validator.fuzz.test.mjs`) | no change needed — it mutates levels (101 etc.) against a default Kanto-arc base, where 101 stays invalid, and its contract is accept/422 shape only: **2000/2000** |
| False positives cleared | `formulas.mjs` stat/hp `/100` is the stat-formula denominator, not a cap; `Math.min(100, statusChancePct)` in both battle engines is a percent; story-kanto's "Wake Terapagos, level 85" is authored Kanto-band content |

### 4. Tests pinning the new behaviour (validator.test 51 → 78)

Server: (a) Lv150 party/box/HoF in a Johto save validates clean;
Lv200 at the cap validates; Lv5 in Johto validates (no band floor).
(b) Lv150 in a Kanto save → `bad-mon-level` (party + box; HoF →
`bad-hof`); Lv101 in an Orange save → `bad-mon-level` (shared band).
(c) Lv250 in Johto → `bad-mon-level`; Lv201 is the exact boundary.
(d) Lv200 at slowest-curve XP (10,000,000) and at mediumslow XP in
Johto → no `bad-xp`; exactly-at-ceiling passes, ceiling+1 →
`bad-xp`. (e) Kanto unchanged: all 51 pre-existing cases pass, plus
the Kanto ceiling boundary pair. Anomaly: Johto party at 200 +
<1h flags `maxed-party-low-playtime`; Johto party at 100 does NOT;
Kanto party at 100 still does. Client pair (same file, client's own
validateSave): Johto Lv150 accept / Kanto Lv150 reject / Johto Lv250
reject / Johto Lv200 at slow XP accept / ceiling+1 → `bad-xp` /
HoF Lv180 Johto accept, Kanto reject.

### 5. Battery at this commit

validator test **78/78** · validator fuzz **2000/2000** ·
save-contract **6/6** · arc-foundation **47/47** · cheat-shop
**44/44** · campaign-smoke **24/24** · qa-changed-flows failures
exactly the standing baseline **{b2, d9}** (its QA section 19/19) ·
gen-tables --check **clean** · fresh build (vercel + guest) OK —
guest 2dc90536…, vercel 9110d659…, personal line preserved
(ce64da2b…) and personal/ files byte-identical. Extra safety on the
touched normalizer: rejuv-phase1 **44/44** · rejuv-phase3 **60/61** ·
rejuv-phase6 **44/45** — the two failures are the C01 real-browser
cases in phase3 and phase6 ("chromium did not start"), each
reproduced identically at base 445a195 in a clean worktree
(phase3 60/61 and phase6 44/45 at base too): pre-existing
sandbox-Chromium flakiness, not a J0 regression. [Count corrected
after the implementer's first report misstated phase3 as 63/63 —
the suite's current total is 61; the error was in the reporting,
not the run.]

### 6. Leftovers, named

- **Client box-mon validation gap** (§3): the client schema does not
  level-check box mons; the server does. Closing it client-side is a
  small future parity item, not J0 scope creep.
- **The XP ceiling is a validation bound, not a gameplay clamp**: a
  capped mon keeps accumulating XP in battle without bound, so a
  theoretically infinite grind at cap could outgrow any finite
  ceiling. The ×2-slack derivation gives ~2× the slowest cap+1
  threshold of headroom (Kanto's effective headroom grew vs the old
  flat bound); the same was true of the old 2,000,000.
- **erratic / fluctuating growth formulas are Gen-canonical 1–100
  shapes** (erratic goes negative past ~Lv110, fluctuating explodes
  past 100). No shipped species uses either curve, so nothing
  legitimate reaches them — but J1's species ETL must not assign
  either curve to a Johto species without extending the formulas
  first. Flagged forward, not fixed here.

## Arc 2 Stage J1 — Species data: +100 → National dex 251 (2026-10-29)

Implementer pass on main @ 37a3e42 (J0 landed). Data only — no maps,
story, or sprites (J2 owns the 94 new species' art). Nothing pushed,
nothing deployed.

### 1. What landed

- **ETL (reproducible, not hand-typed):**
  `~/workspace/ashs-journey-qa/arc2-etl/etl-johto.mjs` reads the
  pre-staged PokeAPI cache (`arc2-etl/raw/`: pokemon/species 152–251,
  68 evolution chains) + the game's own modules (move table, TM table,
  shipped species) and EMITS `src/data/species3.mjs`
  (`export const SPECIES_JOHTO`, 94 entries). Per-species audit trail
  (learnset source, dropped moves, top-ups, TM analogue, evolution
  mapping) in `arc2-etl/etl-notes.json`. Registered in
  `scripts/module-order.json` after species2.mjs; folded in
  `src/data/merge.mjs` (`Object.assign(SPECIES, SPECIES_JOHTO)`);
  `tools/api-scripts/gen-tables.mjs` folds it the same way and the
  validator tables were regenerated ONLY through it (tablesVersion
  60fc23ec… → **44eb8c22…**, 257 species / 136 items).
- **Accounting:** species entries **163 → 257** = 151 Kanto + partner
  + 5 forms + 100 National (dex 152–251). The 6 shipped guests
  (togepi 175, marill 183, snubbull 209, donphan 232, hooh 250,
  lugia 249) were NOT duplicated — they stay in species2.mjs; the 94
  new entries are dex 152–251 minus those six. **Diploma math
  untouched:** the Kanto diploma still counts exactly 151 non-form
  species at dexNo 1–151 (cheat-shop A13/B23/B24 prove it), and the
  National-493 dex keying stands; the 251 horizon comes from the
  Foundation registry row, as designed.
- **Field mapping** follows the shipped schema exactly: PokeAPI
  stats/types (current typings — Togepi-line fairy consistent with
  the shipped guest), capture_rate, base_experience, spriteSeed
  dexNo*100+1, body derived from PokeAPI `shape` (quadruped→quad,
  upright/humanoid→biped, wings/bug-wings→bird, fish→fish,
  squiggle→serpent, armor/ball/blob/legs/tentacles→blob/quad per
  judgment) with recorded overrides where the shape misleads
  (kingdra→fish, pupitar→blob, porygon2→blob, wooper→quad,
  cyndaquil→quad). Every entry carries an ORIGINAL one-line flavor
  (hand-authored in the ETL's FLAVOR table, shipped voice).
- **J6 pre-wiring:** every new entry emits `eggGroups` (the species'
  PokeAPI egg-group names), `hatchCounter`, and `baby: true` where
  PokeAPI marks is_baby (pichu, cleffa, igglybuff, tyrogue, smoochum,
  elekid, magby — 7 of the 94; togepi is the 8th baby and already
  ships in species2).
- **TM lists:** copied from the closest shipped analogue by type
  overlap then BST distance (per-species analogue recorded in the
  ETL notes; umbreon — pure Dark, no shipped type overlap — takes
  its pre-evolution eevee's list). All ids resolve in the game's
  TM/HM tables (fidelity-verified).

### 2. Growth-curve assertion (the J0 leftover flag, discharged)

The ETL maps growth_rate {medium-slow→mediumslow, medium-fast AND
PokeAPI's current alias 'medium'→mediumfast, fast→fast, slow→slow}
and THROWS if a species' raw curve is 'erratic' or 'fluctuating' or
maps outside the supported set {fast, mediumfast, mediumslow, slow}.
**Result: assertion held over all 94** — raw distribution
medium 38 · medium-slow 24 · slow 17 · fast 15; zero erratic, zero
fluctuating assigned.

### 3. Learnsets (ruling 2 + ruling 5)

- Source: PokeAPI `moves`, version_group **crystal preferred**,
  move_learn_method level-up only, names normalized to game ids
  (hyphens stripped; 'double-team' aliased to the game's 'doubletam').
  **91 of 94 species took a surviving crystal set directly.** No
  species needed a gold-silver fallback for a surviving set: the
  remaining 3 (unown, delibird, smeargle) had their ENTIRE canonical
  level-up sets (crystal and gold-silver alike) outside the game's
  move table (hidden-power / present / sketch are not game moves)
  and were filled entirely by top-ups.
- **Dropped (ruling 5, no new moves): 235 (species, move) pairs,
  66 distinct canonical moves** with no game counterpart — the full
  list is in etl-notes.json (ancient-power, crunch, flame-wheel,
  giga-drain, megahorn, sketch, present, hidden-power, …).
- **Levels:** canonical level-1 moves stay at key **1**; every
  canonical level ≥2 shifts **+100** (band-local). Evolution levels
  shift the same way (§4).
- **Top-ups (<4 distinct moves after filtering): 27 moves across
  13 species**, placed at level 1, ordered type-staples first, then
  type-matching canon TM/HM moves, then Normal staples:
  pichu +thunderbolt · cleffa +swift, metronome · igglybuff +tackle
  · togetic +pound · politoed +bubblebeam · sunkern +razorleaf ·
  murkrow +bite · celebi +psybeam · wobbuffet +confusion, psybeam,
  psychic (canon counter survives alone) · unown +confusion,
  psybeam, psychic, teleport · delibird +aurorabeam, icebeam,
  blizzard, icepunch · smeargle +tackle, quickattack, swift,
  takedown · tyrogue +lowkick, karatechop, submission.

### 4. Evolution mappings — every decision on the record

Engine vocabulary only: level / stone / trade, branching via `evos`.

- **Band-local level evos (canon +100), chain-derived by the ETL:**
  chikorita→bayleef 116, bayleef→meganium 132, cyndaquil→quilava
  114, quilava→typhlosion 136, totodile→croconaw 118,
  croconaw→feraligatr 130, sentret→furret 115, hoothoot→noctowl
  120, ledyba→ledian 118, spinarak→ariados 122, chinchou→lanturn
  127, natu→xatu 125, mareep→flaaffy 115, flaaffy→ampharos 130,
  hoppip→skiploom 118, skiploom→jumpluff 127, wooper→quagsire 120,
  pineco→forretress 131, teddiursa→ursaring 130, slugma→magcargo
  138, swinub→piloswine 133, remoraid→octillery 125,
  houndour→houndoom 124, phanpy→donphan 125, smoochum→jynx 130,
  elekid→electabuzz 130, magby→magmar 130, larvitar→pupitar 130,
  pupitar→tyranitar 155.
- **Happiness → coordinator-set levels:** golbat→crobat **Lv40** and
  chansey→blissey **Lv40** (Kanto species — canonical frame, they
  work inside Kanto's band too; single `evo` added in species2);
  pichu→pikachu, cleffa→clefairy, igglybuff→jigglypuff **Lv110**
  (Johto-frame babies, band-local).
- **Guests (canonical frame, ruling 2)** — entries added in
  species2.mjs: togepi→togetic **Lv25** (the coordinator's fallback:
  no bond/friendship method exists in the engine), marill→azumarill
  **Lv18**, snubbull→granbull **Lv23**. Donphan/Ho-Oh/Lugia: none
  (correct canon). The guests' own shipped learnsets are untouched.
- **NEW ITEM `sunstone`** in items.mjs: pocket 'items', price/shop
  treatment mirroring moonstone (price 0 — a found stone, not mart
  stock), Sun-Stone presentation matching the other stones; the
  stone-use list in main-systems.mjs accepts it. Mappings:
  sunkern→sunflora (sunstone, in species3); **gloom→bellossom**
  (sunstone branch) and **eevee→espeon** (sunstone) /
  **eevee→umbreon** (moonstone) added to the parents' `evos`
  arrays — the engine-true day/night adaptation, recorded here.
- **Trade evos (bare, Kanto precedent — kadabra/machoke/graveler/
  haunter trade without held items):** onix→steelix (species.mjs),
  scyther→scizor, seadra→kingdra, porygon→porygon2 (species2).
- **Branching parents keep a dual representation, deliberately:**
  gloom, poliwhirl and slowpoke keep their original single `evo`
  (the engine's level path and Link Transfer read `sp.evo`) AND
  gain a full `evos` array (the stone path and branch consumers
  read `evos || [evo]`): gloom evos [leafstone→vileplume,
  sunstone→bellossom]; poliwhirl evos [waterstone→poliwrath,
  trade→politoed]; slowpoke evos [Lv37→slowbro, trade→slowking].
  Kanto parents touched — golbat, chansey, eevee, gloom, poliwhirl,
  slowpoke, onix, scyther, seadra, porygon — NOTHING else in their
  entries changed.
- **Tyrogue:** canon stat-comparison branching (atk/def at Lv20) is
  inexpressible in the engine vocabulary → single level evo to
  **hitmontop at Lv120** (canon 20 +100). Hitmonlee/Hitmonchan
  remain Kanto-obtainable; recorded as an adaptation, not a claim
  of canon.
- **Post-251 evolutions are out of scope and emit NO evo:**
  aipom→ambipom, yanma→yanmega, wooper→clodsire, murkrow→honchkrow,
  misdreavus→mismagius, girafarig→farigiraf, dunsparce→dudunsparce,
  gligar→gliscor, qwilfish→overqwil, sneasel→weavile/sneasler,
  ursaring→ursaluna, piloswine→mamoswine, corsola→cursola,
  porygon2→porygon-z, stantler→wyrdeer, togetic→togekiss (all
  recorded per-species in etl-notes.json).

### 5. Support tables + count supersessions

- `battler-tiers.mjs` +94 rows by the file's own rule (bulk =
  HP+DEF+SPD; S <160, L ≥245, else M — no hand overrides needed);
  `idle-classes.mjs` +94 rows by its rule (bird→hover,
  fish/serpent→serpentine, blob→inert, else grounded) with floater
  overrides misdreavus/unown/togetic/celebi/jumpluff→hover. Both
  tables now carry exactly **257** rows.
- **fidelity-checks:** roster assertion **163 → 257** (the count of
  record, updated the way the Cheat Shop expansion did, with the
  supersession in the assertion text); the suite now folds
  SPECIES_JOHTO into its roster. Everything else passes as-is.
- **cheat-shop-checks:** folds SPECIES_JOHTO; **A02** counts move
  species **163 → 257** and items **135 → 136** (the Sun Stone),
  recorded in the assertion text; **A11** superseded — the O1-era
  "guests have no evolutions" rule is replaced by the J1 guest-evo
  assertions (togepi/marill/snubbull carry theirs; donphan/hooh/
  lugia still none). The Cheat Terminal itself is data-driven and
  now stocks **257 claimable species** with no code change; B22/B25
  prove the maximal 257-species stock through the real claim paths
  and the server validator.

### 6. Battery at this commit

fidelity **35/35** · validator test **78/78** · save-contract
**6/6** · cheat-shop **44/44** · arc-foundation **47/47** ·
campaign-smoke **24/24** · qa-changed-flows failures exactly the
standing baseline **{b2, d9}** (QA section 19/19) · gen-tables
--check **clean** · fresh build (vercel + guest) OK — guest
b2500a0f…, vercel acc38711…, **personal/ byte-identical** (game.js
f434ba63… as at HEAD) and the content-hash personal line preserved
(ce64da2b…). Nothing pushed, nothing deployed.

### 7. Leftovers, named

- **Babies are not wild-obtainable:** pichu, cleffa, igglybuff,
  togepi, magby, elekid, smoochum, tyrogue exist as data (dex,
  claims, J6 eggs) only — no wild tables place them; J3 must not
  add them as wild encounters, J6's breeding/claims are their
  route in.
- **Species art is J2:** the 94 new species currently resolve
  through the forge-fallback sprite path (no authored pairs yet);
  the J2 census target is 257/257.
- **Trade branches in `evos` vs Link Transfer:** Bill's Link
  Transfer candidate scan reads only the single `sp.evo` with
  method 'trade' — poliwhirl→politoed and slowpoke→slowking (whose
  `evo` slots carry their primary branches) are data-complete but
  not yet Link-Transfer-reachable. A small engine widening
  (scan `evos` too) belongs to a systems pass (J6-adjacent), not
  this data stage; recorded, not silently worked around.
- **Sun Stone acquisition:** price 0 like the Moon Stone — it is
  found/awarded, never mart stock; placing its pickup is J3/J4
  scope. Until then it is Cheat-Terminal-claimable like every item.
- Day/night encounter variants remain OUT of this mission
  (ruling 6) — the eevee sun/moonstone adaptation is an evolution
  mapping only, not an encounter system.

## Arc 2 Stage J2a — Species art, dex 152–201 (2026-10-29)

### 1. What landed

- **48 species authored** (dex 152–201; the in-range guests togepi 175 and
  marill 183 already had art): chikorita, bayleef, meganium, cyndaquil,
  quilava, typhlosion, totodile, croconaw, feraligatr, sentret, furret,
  hoothoot, noctowl, ledyba, ledian, spinarak, ariados, crobat, chinchou,
  lanturn, pichu, cleffa, igglybuff, togetic, natu, xatu, mareep, flaaffy,
  ampharos, bellossom, azumarill, sudowoodo, politoed, hoppip, skiploom,
  jumpluff, aipom, sunkern, sunflora, yanma, wooper, quagsire, espeon,
  umbreon, murkrow, slowking, misdreavus, unown.
- **96 full frames** (`<id>-front` + `<id>-back` .pix, 64×64, original
  pixel work in the Platinum language — NW-light shading, shared outline
  colour, true rear views: no eyes, back-specific markings/flames/stripes/
  shells). Backs are NOT mirrors: front/back row data differs for all 48.
- **96 bob frames** reach the shipped set via the pipeline itself:
  front-bobs by build-art's marked derivation, back-bobs by the W2
  shift-delta mechanism — no hand files, exactly as shipped species.
- **18 accent deltas** for the 9 starter-line species (chikorita…
  feraligatr): front-accent = blink (recolor-only), back-accent =
  ear/flame twitch recolor, as .deltapix over the new bases.
- Authoring workflow: generator script
  `~/workspace/ashs-journey-qa/gen-j2a-art.mjs` composes per-species
  authored silhouettes/palettes/markings into .pix sources; the repo's
  own build-art validation is the gate (palette cap, outline, margins,
  orphans — three orphan/palette fights during authoring were fixed in
  the art, never in the validator).

### 2. Pipeline change (on the record)

- The species atlas outgrew one 2048×2048 page: 977 species-family
  sprites (420 full + 137 deltas + 210 front-bobs + 210 back-bobs) vs a
  961-cell padded capacity. `build-art.mjs` packing is now multi-page:
  overflow continues onto `atlas-species-2.png/.json`; every page still
  honours contracts §1.1 (≤2048×2048, 1px cell padding), page 1 keeps
  the legacy name, and single-page families are byte-identical to the
  pre-split packer (verified: all non-species atlases unchanged). A
  single sprite larger than a page still fails loudly. The game runtime
  consumes art-data.mjs, not the dist atlases; no engine change.

### 3. Census (gate)

- Script: `~/workspace/ashs-journey-qa/arc2-etl/census-j2a.mjs`.
- Every species entry dex 1–201 (207 registry entries incl. partner +
  forms sharing dex numbers) has front+back keys in art-data.mjs:
  **missing 0, blanks 0**. The 48 new species: front-bob + back-bob
  present for all (**missing 0**); starter accents present (**missing
  0**); partner front/back keys present. Zero forge fallbacks in range.
- Per-sprite stats for the 96 new frames: painted pixels **437–1,307**
  (min = unown front, a hollow glyph by design), palette sizes **5–11**
  colours (cap 32). Full per-species table is the census script output.
- **Contact sheet:** `~/workspace/ashs-journey-qa/arc2-etl/census-j2a-contact.png`
  (1536×1236, 48 labelled fronts at 3×).

### 4. Battery at this commit

- build-art clean and **deterministic** (two runs → byte-identical
  art-data.mjs + species atlases). 2,506 sprites total, 210 derived
  bobs, 621 delta frames.
- fidelity-checks **35/35** · campaign-smoke **24/24** ·
  qa-changed-flows failures exactly **{b2, d9}**.
- Fresh build (vercel + guest targets) OK — public/game.js
  **5,966,719 bytes** (gate 12,582,912). **personal/ byte-identical**
  (untouched by this stage; built targets were vercel+guest only).

### 5. Leftovers, named

- **Unown:** ONE canonical glyph form authored (the "A" eye-glyph);
  the full alphabet of forms is out of scope for this stage.
- **Hardest silhouettes at 64×64** (flagged for the owner's eye on the
  contact sheet): yanma (wings read as pale blobs at small size),
  mareep (wool/head separation is subtle), spinarak (face markings
  dense). All pass silhouette naming in the sheet, but they are the
  first candidates if a polish pass is ordered.
- **J2b (dex 202–251)** will add ~100 more full frames: species atlas
  page 2 already has room (16 sprites used), page 3 will appear
  automatically when needed — no further packer work expected.
- Accent deltas for non-starter Johto species are NOT in this stage's
  brief (shipped Kanto coverage is likewise partial); fronts/backs/
  bobs are complete for the range.

## Arc 2 Stage J2b — Species art, dex 202–251 (2026-10-29)

### 1. What landed

- **46 species authored** (dex 202–251; the in-range guests snubbull 209,
  donphan 232, lugia 249 and hooh 250 already had art): wobbuffet,
  girafarig, pineco, forretress, dunsparce, gligar, steelix, granbull,
  qwilfish, scizor, shuckle, heracross, sneasel, teddiursa, ursaring,
  slugma, magcargo, swinub, piloswine, corsola, remoraid, octillery,
  delibird, mantine, skarmory, houndour, houndoom, kingdra, phanpy,
  porygon2, stantler, smeargle, tyrogue, hitmontop, smoochum, elekid,
  magby, miltank, blissey, raikou, entei, suicune, larvitar, pupitar,
  tyranitar, celebi.
- **92 full frames** (`<id>-front` + `<id>-back` .pix, 64×64, original
  pixel work in the Platinum language — NW-light shading, shared outline
  colour, true rear views: no eyes, back-specific markings). Backs are
  NOT mirrors: front/back row data differs for all 46 (census-checked).
- **92 bob frames** reach the shipped set via the pipeline itself:
  front-bobs by build-art's marked derivation, back-bobs by the W2
  shift-delta mechanism — no hand files, exactly as shipped species.
- **8 accent deltas** for the four marquee legendaries in range
  (raikou, entei, suicune, celebi): front-accent = blink (recolor-only),
  back-accent = mane/crest twitch recolor, as .deltapix over the new
  bases — the J2a starter-accent mechanism, unchanged.
- Authoring workflow: generator script
  `~/workspace/ashs-journey-qa/gen-j2b-art.mjs`. Provenance, on the
  record: the per-species defs were drafted alongside J2a inside
  gen-j2a-art.mjs but never emitted (its ORDER list stopped at dex
  201); J2b reviewed, fixed and shipped them as its own generator.
  Fixes made in the art, never in the validator: delibird + skarmory
  palettes gained the beak key their shared bird plan paints;
  heracross's horn-fork tips and skarmory's wing-feather tips were
  single orphan pixels (tips clustered / feather reach shortened);
  polish tweaks to slugma (stalk/eye separation), steelix (tail
  segment tucked in as a coil base), octillery (wider, bumped head)
  and hitmontop (enlarged top body — it was the set's smallest frame).
- The beast trio are deliberately NOT recolors of one another:
  raikou = masked saber-fang face + purple storm-mane saddle, entei =
  low-slung bulk + grey faceplate/crest, suicune = lean frame +
  diamond crest + twin ribbon tails; celebi = onion-head silhouette,
  oversized eyes, translucent wings.

### 2. Census (gate) — FULL roster

- Script: `~/workspace/ashs-journey-qa/arc2-etl/census-j2b.mjs`
  (extends census-j2a to the whole merged roster).
- **257/257 registry entries** (dex 1–251 + partner + 5 forms) have
  front+back keys in art-data.mjs: **missing 0, blanks 0** — zero
  forge fallbacks anywhere in the roster.
- **94/94 Johto species have front-bob + back-bob** (missing 0);
  marquee accents present (missing 0); partner front/back present.
- Per-sprite stats for the 92 new frames: painted pixels **564–1,329**
  (min = pupitar/hitmontop class shells by design), palette sizes
  **4–11** colours (cap 32). Full per-species table is the census
  script output.
- **Contact sheet:** `~/workspace/ashs-journey-qa/arc2-etl/census-j2b-contact.png`
  (1536×1236, 46 labelled fronts at 3×), visually inspected by the
  implementer: all 46 silhouettes nameable at sheet scale.
- Atlas: the species family now holds 1,169 sprites and still packs
  onto **2 pages** (page 2 grew; the page 3 J2a anticipated was not
  needed — the multi-page packer handles it if a later stage grows).

### 3. Battery at this commit

- build-art clean and **deterministic** (two runs → byte-identical
  art-data.mjs + species atlases). 2,698 sprites total, 256 derived
  bobs, 629 delta frames.
- fidelity-checks **35/35** · campaign-smoke **24/24** ·
  qa-changed-flows failures exactly **{b2, d9}**.
- Fresh build (vercel + guest targets) OK — public/game.js
  **6,633,533 bytes** (gate 12,582,912; J2a left it at 5,966,719).
  **personal/ byte-identical** (sha256 f434ba63…, untouched by this
  stage; built targets were vercel+guest only).

### 4. Leftovers, named

- **Hardest silhouettes at 64×64** (flagged for the owner's eye on the
  contact sheet): octillery (head/tentacle mass still flirts with a
  flame read), porygon2 (smooth curves on a pixel grid — the head/body
  join is thin), steelix (segment chain reads light against dark
  grounds), hitmontop (smallest authored frame). All pass silhouette
  naming on the sheet; first candidates if a polish pass is ordered.
- Accent deltas for non-marquee Johto species remain out of scope
  (shipped Kanto coverage is likewise partial); fronts/backs/bobs are
  complete for the range.
- **Stage J2 total (J2a + J2b): 257/257 authored pairs, 94/94 Johto
  bob sets — the J2 art gate is closed.**

## Arc 2 Stage J3a — Johto maps, WEST half (2026-10-29)

### 1. What landed

- **NEW `src/data/maps6.mjs`** (export `MAPS6`; registered in
  `scripts/module-order.json` after `maps5.mjs`; folded in
  `merge.mjs`): **44 maps** — 6 towns, 12 routes/dungeons,
  26 interiors. Generated deterministically by
  `~/workspace/ashs-journey-qa/johto-j3a/gen_maps6.py` in the
  maps5.mjs idiom (edit the generator, not the file).
  - Towns: `newbark` 28×18, `cherrygrove` 28×18, `violet` 30×18,
    `azalea` 28×18, `goldenrod` 34×20, `ecruteak` 30×18 — all
    ≥24×14 viewport-filling (P-1).
  - Routes/dungeons: `r29` 26×16, `r30` 24×18, `r31` 26×16,
    `r32` 24×20, `union-cave` 26×16, `r33` 24×16, `ilex-forest`
    28×18, `r34` 24×18, `r35` 24×16, `national-park` 28×18,
    `r36` 28×16, `r37` 24×18.
  - Interiors (26): `elm-lab`, `kurt-house`, `daycare` (Route 34
    shell — J6 wires the system), `dance-theater`, houses ×6
    (`house-newbark/cherrygrove/violet/azalea/goldenrod/ecruteak`),
    gyms ×4 layouts-only (`gym-violet/azalea/goldenrod/ecruteak` —
    pads + leader stands; leaders/battles are J4), `sprout-tower-1/2`,
    `slowpoke-well`, `radio-tower-1/2/3`,
    `goldenrod-underground-1/2`, `burned-tower-1/2` (the three
    beasts sleep in the basement as statue dressing — J4/J5 arm
    the event), `bell-tower-1/2` (summit: twin `jbell` props +
    Ho-Oh perch mat — dressing).
  - Shared `center`/`mart` interiors serve all six towns via
    `via{}` tickets exactly as Orange — no per-town centers/marts.
  - The **Celebi shrine stands in Ilex Forest** as a `jshrine`
    prop landmark on a cleared clearing at (14,3) with a faced
    sign at (15,5); J5 dresses the event.
  - Route 32 is split by a rock barrier: **Union Cave is the
    through-passage** (north mouth (17,6)/(18,6) ↔ cave doors
    (2,0)/(3,0); south mouth (5,12)/(6,12) ↔ cave doors
    (22,15)/(23,15)), the canon arrangement.
- **Identity system extended** (Premium+ W5 machinery): the six
  settlements own the eight signature kinds (tg/tg2/tc/td/tr/tl/
  th/tw) via `JOHTO_TOWN_ORDER`/`JOHTO_TOWN_CHARS` in
  `src/engine/tiles.mjs`. The Latin-1 char blocks are exhausted
  by the eleven Kanto towns, so Johto chars continue the Latin
  Extended Additional block (town i owns U+1E00+173+i·8…+180+i·8);
  the art resolver's prefix branches ride the shipped W5 paths
  unchanged. WALKABLE in `src/data/maps.mjs` gains the Johto
  tg/tg2 chars + the two J3 floor chars by the O1 spread
  precedent. Roof-form families (P-4): newbark lakeside-lab
  modern, cherrygrove coastal flower gable, violet tower-town
  stone, azalea forest-edge timber, goldenrod urban brick slab,
  ecruteak traditional timber.
- **Nine Johto tile kinds** (`J3_KIND_DEFS`, U+1E00+164…172):
  props `maple`, `jshrine`, `jwell`, `apricorn`, `jbell`; floors
  `cityfloor`, `woodfloor`; walls `towerwood`, `citybrick` —
  wired through tiles.mjs/art.mjs exactly as the O1 set.
- **57 new tile .pix sources** (48 town-identity + 9 kinds) under
  `assets/sprites/pix/tiles/`, authored by
  `~/workspace/ashs-journey-qa/johto-j3a/gen_j3_art.py`;
  `art-data.mjs` regenerated via `build-art.mjs` only (two runs
  byte-identical). **Palette budget:** the tiles family union
  rose 640 → 732 painted hexes, so `FAMILY_PALETTE_BUDGETS.tiles`
  is raised 640 → 760 in `build-art.mjs` (the W5 ratified-raise
  precedent; per-sprite cap 32 untouched, max painted 18).

### 2. Connectivity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/johto-j3a/johto-sweep.mjs`
  (celadon/orange-sweep discipline: engine WALKABLE + Surf
  assumed, loadMap-faithful NPC model incl. the TALE_NPCS
  appends and the outdoor mart-clerk filter, interiors as
  connectors to fixpoint). **All 45 maps in scope PASS** (44 new
  + `pallet`): every entry reaches every warp; **zero bad warp
  landings**; map graph from `newbark` reaches all 44; the full
  chain pallet →(ferry)→ newbark → … → ecruteak incl.
  `bell-tower-2`, `burned-tower-2`, `union-cave`, `daycare`
  verified at graph level. The shipped `celadon-sweep.mjs`
  re-run on `pallet` also passes (1 relevant fragment — the new
  captain seals nothing).

### 3. Richness + identity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/johto-j3a/johto-richness.mjs`
  (W5 logical-raster method, real resolver + ART). **All 44 maps
  pass their floors.** Towns: newbark 168, cherrygrove 167,
  violet 171, azalea 149, goldenrod 148, ecruteak 156 colours
  (floor 80). Routes 128–186 (floor 60; national-park 128 is the
  minimum). Interiors 55–83 (floor 55; bell-tower-1 55 is the
  minimum). Caves: union-cave 80, slowpoke-well 83,
  burned-tower-2 63 (floor 45).
- Town ground rule under BOTH precedents: top counted family
  (orange-richness function) ≤20.6% and top single ground KIND
  ≤20.9% of town cells (gate ≤40%). Routes' dominant family is
  grass-family at 50.8–65.6% of cells (the 40% rule is a town
  rule; route path sits at ~13–19% — reported, not gated).
- **Tile-kind Jaccard, settlements (pairwise, target ≤0.60):**
  max **0.532** (violet~ecruteak); min 0.347 (newbark~azalea).
  Full table: newbark~cherrygrove .488, newbark~violet .396,
  newbark~goldenrod .370, newbark~ecruteak .367,
  cherrygrove~violet .467, cherrygrove~azalea .444,
  cherrygrove~goldenrod .476, cherrygrove~ecruteak .435,
  violet~azalea .479, violet~goldenrod .447, azalea~goldenrod
  .457, azalea~ecruteak .511, goldenrod~ecruteak .447.

### 4. Encounters

- 272 table entries across 24 encounter-bearing maps, audited
  programmatically: every species exists in the merged roster;
  **no babies** (pichu/cleffa/igglybuff/togepi/magby/elekid/
  smoochum/tyrogue), **no starters, no legendaries**; levels
  span **101–145**, inside band 101–200, rising west→east
  (r29/newbark 101–111 → violet area 108–121 → azalea/ilex
  116–131 → goldenrod area 124–140 → ecruteak area 132–145).
  Water tables on every map with water (WTR_A→WTR_D curve);
  cave/forest/tower tables follow the maps5 idiom.

### 5. The embark (gate) — PASS 6/6

- **Finding:** the Foundation machine's embark leg works from
  Pallet as registered (`embarkPort: 'pallet'`,
  `arrivalMap: 'newbark'`) — but Pallet had NO Johto dock NPC.
  **Fix:** `CAPT JOHTO` (ferry `newbark`, ferryArc `johto`) is
  appended to Pallet's roster at loadMap through the shipped
  append idiom — a `TALE_NPCS` entry in `src/data/quests.mjs`
  carrying no tale/role (the ferry handler owns him; Pallet's
  maps3.mjs def is untouched). He stands at **(11,8)**, one tile
  east of the Cinnabar FERRYMAN, on open tg2 ground; the
  celadon-sweep discipline proves he seals nothing. The return
  captain `CAPT WESTWIND` stands on the New Bark dock (13,15)
  start plaza at (12,15).
- Drive: `~/workspace/ashs-journey-qa/johto-j3a/johto-embark.mjs`
  on the real bundle — E01 captain on the live roster; E02
  pre-embark the crossing gates (gate line, no menu); E03–E04
  post-Homecoming-#2 state (hook_johto set, directive spent,
  embark_johto armed) sails Pallet → newbark, en-route card,
  lands on newbark.start (13,15), stamps reachedarc_johto;
  E05–E06 the return leg sails with embark_johto DELETED
  (unconditional return). **Note:** the registry row is still
  `status: 'sealed'` at J3a, so a live homecoming does not yet
  arm embark_johto — the J4 story stage flips the row to
  'shipped' (mission ruling 1); the drive arms the flag
  directly, the same isolation arc-foundation B09 uses.

### 6. J3b stitch points (exact)

- **r36 east edge → r38 (toward Olivine):** road tiles
  **(27,8) and (27,9)** — path running to the east edge, NO
  warps. J3b: add warps there to r38's west landings, and
  reciprocal warps on r38 landing at (26,8)/(26,9).
- **r37 east edge → r42 (toward Mahogany):** the east arm tiles
  **(23,8) and (23,9)** — path running to the east edge, NO
  warps. J3b: add warps there to r42's west landings, and
  reciprocal warps on r42 landing at (22,8)/(22,9).
- r36's west end is closed with trees (the National Park spur
  is its west entry); r37's spine is x=11,12 (south = r36
  (20,0)/(21,0) warps, north = ecruteak (14,16)/(15,16)
  landings).

### 7. Battery at this commit

- fidelity **35/35** · campaign-smoke **24/24** ·
  qa-changed-flows failures exactly **{b2, d9}** (55/57).
- Adjacent suites: arc-foundation **47/47**, orange-story
  **38/38**, orange-climax **42/42**, cheat-shop **44/44**;
  rejuv-phase4 50/51 (sole failure C01 chromium-start — the
  pre-existing harness failure documented at base).
- build-art clean + deterministic; fresh build (vercel + guest)
  OK — `public/game.js` **6,803,536 bytes**.
  **personal/ byte-identical** (sha256 f434ba63…, untouched;
  vercel+guest targets only).

### 8. Leftovers, named

- **Registry flip is J4's** (ruling 1): johto row stays
  'sealed' here; the embark is proven but not yet reachable in
  a live playthrough until J4 ships the flip + story.
- **Goldenrod department store** is exterior dressing: its
  annex door reuses `house-goldenrod`. A bespoke multi-floor
  department-store interior is NOT authored (out of the J3a
  interior list); candidate for a later polish stage.
- **Day/night encounter variants** remain deferred (mission
  ruling 6) — e.g. Murkrow/Hoothoot are in day tables here.
- Gym interiors are layouts only by design (J4 arms leaders);
  the Day-Care interior is a shell (J6); the Ilex shrine,
  Burned Tower statues and Bell Tower perch are dressing
  (J5 arms the events).
- Route grass-family share (50.8–65.6%) is reported under the
  town-rule note in §3 — if a route-family gate is ever
  adopted, routes need a path/ground re-dress pass.

## Arc 2 Stage J3b — Johto maps, EAST half + full-region gate (2026-10-29)

### 1. What landed

- **`src/data/maps6.mjs` regenerated by the SAME generator of record**
  (`~/workspace/ashs-journey-qa/johto-j3a/gen_maps6.py`, extended in
  place — no hand-edits to the generated file; two consecutive runs
  byte-identical): **38 new east maps, region total 82** (11 towns,
  33 routes/dungeons/waters, 38 interiors).
  - Towns: `olivine` 34×20 (port city: dock rows south, Glitter
    Lighthouse as the P-6 tower landmark on the north street),
    `cianwood` 28×18 (island town, sand shore), `mahogany` 28×18,
    `blackthorn` 30×18 (Dragon's Den mouth in the NE cliff behind
    the gym quarter), `silvertown` 30×18 (marble Conference town).
  - Routes/waters: `r38` (farm road), `r39` (shore road), `r40` +
    `r41` (surf seas; Whirl islets stand in r41), `r42`, `r43`,
    `lake-of-rage` (shore + centre islet + the old fisherman — the
    Red Gyarados beat itself is J4), `r44`, `r45` + `r46` (the south
    loop), `route-silver` (Silver Pass), `mt-silver` (exterior
    slopes).
  - Dungeons: `whirl-islands-1/2` (the Deep Chamber holds the Lugia
    shrine + inscription sign + KEEPER OF THE DEEP — **visited
    dressing/lore ONLY per coordinator ruling 4: no second catch,
    no event wiring; the inscription says so in-fiction**),
    `mt-mortar-1/2` (two mouths on r42, one connected cave),
    `ice-path-1/2`, `dragons-den` (elder's shrine dressing — J4 runs
    the test), `dark-cave` (two mouths, r45 + r46, one connected
    cave), `mt-silver-cave` (Red's summit chamber: worn-stone dais +
    inscription — J4 places Red).
  - Interiors (12): gyms ×4 (`gym-olivine/cianwood/mahogany/
    blackthorn`, layouts only as west), `lighthouse-1/2`,
    `silver-stadium` (bracket halls in silph-floor + the main pitch
    under the Conference crest — J4 runs the Conference here),
    houses ×5 for the new towns. Centers/Marts ride the shared
    `via{}` tickets exactly as west. No bespoke Olivine port
    interior: the port is the dock itself (captain + boatman on the
    pier, the newbark/valencia dock idiom).
- **Stitches (J3a register §6, exact):** r36 (27,8)/(27,9) → r38
  west landings (1,8)/(1,9), reciprocal r38 (0,8)/(0,9) → r36
  (26,8)/(26,9); r37 (23,8)/(23,9) → r42 (1,8)/(1,9), reciprocal
  r42 (0,8)/(0,9) → r37 (22,8)/(22,9). Both directions walkable
  (sweep-proven). **Ring closure stitch:** r29's north edge
  (18,0)/(19,0) opened → r46 south landings — canon's high road,
  closing blackthorn → r45 → dark-cave → r46 → r29 → cherrygrove.
- **Identity extended:** `JOHTO_TOWN_ORDER`/`JOHTO_TOWN_CHARS`
  (tiles.mjs) gain the five east settlements at idx 221..260 on the
  same U+1E00 block; `WALKABLE` (maps.mjs) extends the tg/tg2
  spread to all 11 towns. **40 new tile .pix** via the extended
  `gen_j3_art.py` (same eight-kind programme; olivine port-blue +
  lighthouse amber, cianwood island sand/stone, mahogany lakeside
  timber, blackthorn slate + dragon magenta, silvertown league
  marble + gold). **Palette budget:** tiles family union measured
  732 → **783**, so `FAMILY_PALETTE_BUDGETS.tiles` is raised
  760 → **800** in `build-art.mjs` (cap set just above the measured
  union, no headroom banked; `palette-audit.mjs` mirror updated),
  the J3a ratified-raise procedure. build-art clean + deterministic.
- **Ferry (the one data touch outside maps6's own maps):** the
  ferry machinery is per-captain, not a hub menu — so Vermilion
  "listing Olivine" means a captain. `maps6.mjs`'s generated footer
  appends **CAPT EASTBOUND** (`ferry: 'olivine', ferryArc: 'johto'`)
  to Vermilion's roster via the maps5 dock-override idiom
  (`MAPS6.vermilion = {...MAPS5.vermilion, npcs: [...prev, him]}`),
  standing at (11,10) between SAILOR BRINE and CAPT ORANGE on open
  dock street (sweep proves he seals nothing). Olivine's mirror is
  **CAPT EASTWIND** (`ferry: 'vermilion', ferryArc: 'johto'`) on the
  pier. Cianwood runs a plain two-way island-hopper boat to Olivine
  (BOATMAN REEF / BOATWOMAN SULA, Orange idiom, no arc gate).

### 2. Connectivity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/johto-j3a/johto-sweep.mjs`
  (extended in place: east chain + ring assertions). **All 84 maps
  in scope PASS** (82 Johto + `vermilion` + `pallet`): every entry
  reaches every warp, **zero bad warp landings**, map graph from
  `newbark` reaches all 82; the end-to-end chain pallet →(ferry)→
  newbark → … → olivine →(sea)→ cianwood, ecruteak → mahogany →
  lake-of-rage, mahogany → ice-path → blackthorn → route-silver →
  silvertown → mt-silver-cave verified at graph level; **RING
  blackthorn→r45→dark-cave→r46→r29→cherrygrove closed: true.**

### 3. Richness + identity (gate) — PASS

- Script: `johto-richness.mjs` (extended: 11 towns, east caves in
  the cave floor set, vermilion override excluded). **All 82 maps
  pass their floors.** East towns: olivine 181, cianwood 159,
  mahogany 164, blackthorn 148, silvertown 156 colours (floor 80);
  town ground-family shares ≤22.6% (gate ≤40%). East land routes
  149–188 (floor 60); seas r40 69 / r41 85 (water maps, floor 60);
  lake-of-rage 149. East interiors 59–90 (floor 55; gyms are the
  minimum at 59); east caves 62–90 (floor 45; mt-silver-cave 62 is
  the minimum).
- **Tile-kind Jaccard, ALL 11 settlements pairwise: max 0.568**
  (azalea~mahogany), min 0.326 (cianwood~silvertown) — target
  ≤0.60 **PASS** across all 55 pairs.

### 4. Encounters

- Audit: `~/workspace/ashs-journey-qa/johto-j3b/johto-enc-audit.mjs`
  — **PASS: 313 entries across 26 east encounter maps** (585
  encounter entries region-wide with J3a's 272). Every species exists in the
  merged roster; **no babies, no starters, no legendaries**;
  levels span **138–198**, inside band 101–200, on the authored
  curve: r38 138–152 → cianwood/whirl 148–162 → mahogany/lake
  155–170 → ice-path/dragons-den 165–178 → blackthorn/r45
  168–183 → route-silver 180–190 → mt-silver 185–198. Water/fish
  tables on every sea/lake/pond map (shared regional water curve
  per the J3a WTR idiom; pond tables added to ice-path, dark-cave,
  whirl-islands and mt-mortar where J3a's cave ponds had none).
  Larvitar/Pupitar haunt Mt. Silver at low weight (canon); Dratini/
  Dragonair hold the Dragon's Den (canon); a plain wild Gyarados
  schools rarely in the Lake of Rage — the Red one is J4's beat.

### 5. Ferry drive (gate) — PASS 7/7

- Drive: `~/workspace/ashs-journey-qa/johto-j3b/johto-ferry.mjs`
  on the real bundle — F01 Olivine's roster carries CAPT EASTWIND;
  F02 pre-arrival he gates (gate line, no menu); F03 post-arrival
  (`reachedarc_johto` set, embark flag ABSENT) he sails Olivine →
  Vermilion; F04 Vermilion lists CAPT EASTBOUND for Olivine; F05
  the return sails Vermilion → Olivine unconditionally, landing on
  olivine.start; F06/F07 the Cianwood island-hopper runs both ways.
  J3a embark drive re-run: **6/6**.

### 6. Battery at this commit

- fidelity **35/35** · campaign-smoke **24/24** ·
  qa-changed-flows failures exactly **{b2, d9}** (55/57) ·
  arc-foundation **47/47**.
- Adjacent suites: orange-story **38/38**, orange-climax **42/42**,
  cheat-shop **44/44**.
- build-art clean + deterministic; fresh build (vercel + guest)
  OK — `public/game.js` **6,953,602 bytes**.
  **personal/ byte-identical** (sha256 f434ba63…, untouched;
  vercel+guest targets only).

### 7. Leftovers, named (J4's list)

- Gym interiors east are layouts only (leaders/battles are J4), as
  are the Silver Stadium bracket, the Dragon's Den elder test,
  Red on the Mt. Silver dais (unlocks at `johto_complete`, ruling
  7), the Lake of Rage Red Gyarados + Lance/Rocket beats, and the
  Olivine↔Cianwood medicine errand (the Cianwood pharmacy dressing
  stands in `house-cianwood`).
- The registry flip is still J4's (ruling 1): johto stays 'sealed'
  here; both ferry drives arm/reach their states directly, the
  J3a isolation precedent.
- The Whirl Islands Deep Chamber is deliberately inert dressing —
  if a later stage wants a Lugia *event* there it must reckon with
  ruling 4 (one Lugia, already caught at Shamouti) first.

## Arc 2 Stage J4a — Johto story, WEST: New Bark → Ecruteak (2026-10-29)

Base: main @ 0228663 (J3b). Deliverables: the registry flip, NEW
`src/data/story-johto.mjs` (quests / trainers / events / tales / NPC
tables, module-order after story-orange, folded in merge.mjs), the
Johto badge plumbing end-to-end, engine wiring (loadMap appends,
sysLoadMap gates, runJohtoNpc, the battleAny step, Quest Log + HUD
sections), and NEW `tests/johto-story-checks.mjs`. All dialogue is
original writing in the game's voice.

### 1. Registry flip + badge plumbing

- `src/data/arcs.mjs`: the johto row `status: 'sealed'` → `'shipped'`
  — the ONLY change in the row (band / hook / embark / completionFlag
  were already correct and are consumed, not rewritten). The
  Foundation machine now takes its shipped branch for Johto:
  Homecoming #2 advances `story.arc` and arms `embark_johto`.
- Badge ids in canonical earn order — zephyr, hive, plain, fog,
  storm, mineral, glacier, rising (`zephyrbadge` … `risingbadge`):
  ITEMS rows (key pocket) + `BADGE_SETS.johto` in items.mjs, all
  eight NOW so the set, the Cheat Terminal stock and the validator
  sequence are complete before J4b stages the east gyms. Leaders
  carry `badgeSet: 'johto'`; winTrainer's shipped award path writes
  `badges.johto` + `badge_<root>` unchanged.
- Client schema gained the prefix rule for johto (`bad-badges-johto`,
  the orange rule's twin); gen-tables now emits
  `badgeSequences.johto` FROM BADGE_SETS (it was a hardcoded `[]`)
  and the quest table gains the JOHTO_QUESTS ids + JOHTO_TALES ids.
  Tables regenerated ONLY via gen-tables (items 136 → **144**).

### 2. Staging decisions

- **Arrival:** the opening scene is the `ev_johto_arrival` map-entry
  event on first `elm-lab` entry (the ivy-lab precedent): Elm
  registers the journey, tells the stolen-starter incident (a
  Totodile taken before dawn; red hair seen at the dock), and asks
  the player to keep an eye out and REPORT back — no Mr. Pokémon
  fetch chain (out per the brief). Flags: `johto_arrival`,
  `elm_registered`.
- **Silver (r30):** first `r30` entry AFTER the arrival scene fires
  `ev_johto_silver_r30`. The clash is a NEW event step,
  `{ battleAny }`: a scripted trainer battle fought FRIENDLY (a loss
  costs nothing, never blacks out — finishDefeat's friendly branch),
  the chain advances on a win OR a loss, and the branch flag records
  the honest outcome (`silver_r30_won` XOR `silver_r30_lost`); fleeing
  stalls the chain so the scene re-fires, per the fled-guard law. His
  team: Zubat 104 + the stolen Croconaw 106 (the Totodile line, a
  touch grown). Win or lose he flees and the starter STAYS his.
  Reporting back to Elm sets `silver_reported` — Elm names him
  SILVER from a dropped practice registration. Silver is a recurring
  battler, NOT the arc rival (Gary is; J4b owns their beats).
- **Sprout Tower:** two monk trainers (talk-to, tower floors 1–2,
  Bellsprout 106–109) + Elder Li's scene at the top (reward: 2 Super
  Potions; sets `sprout_tower_done`). Falkner's challenge GATES on
  the blessing ("Sprout Tower first") — recorded as this stage's one
  gym gate; the other three west leaders are ungated.
- **Slowpoke Well + Kurt + GS Ball:** first well entry fires Kurt's
  plea (`kurt_well_plea` — he confronted the tail-cutters, hurt his
  back, and hands the well to the player). Three Rocket battles
  inside (118–124) ride the generic battle path via runJohtoNpc;
  the third win sets `johto_well_cleared`. The GS Ball delivery is
  Kurt's kurt-house scene AFTER the clear: the ball leaves the bag
  through the bag's own count (decremented, key deleted at zero) and
  the whereabouts are recorded in the boolean flag vocabulary —
  `gsball_delivered`, `kurt_has_ball`, `gsball_at_kurt_house` (the
  ball is in Kurt's study until J5 moves it; the validator's flag
  law is booleans-only, so no string flag exists). Kurt: even he
  can't open it — it HUMS when the wind comes through Ilex Forest,
  toward the shrine. That seeds J5's Celebi arc; Kurt keeps the ball
  to study. (If a player somehow reaches Kurt without the ball, he
  asks for it and nothing is set — no soft-fail.)
- **Burned Tower:** staged on first `burned-tower-2` (basement)
  entry — the statues' home floor, not the town. A glimpse scene
  only: three empty plinths, Suicune watches and is gone. NO battle,
  NO catch. Sets `beasts_awakened` + `beast_seen_suicune` +
  `johto_burned_tower` — the ARMING flags for J5's three beast arcs
  (J5 owns their quest entries and encounters). Morty's post-badge
  talk names what woke (Raikou / Entei / Suicune); pre-awakening he
  sends the challenger to look into the tower first, and his
  challenge menu rides the awakened talk — so the Fog Badge is
  effectively gated on the awakening, matching the quest-chain
  order (burned → fog). Recorded as a staging decision in §9.
- **Goldenrod:** Whitney stands alone this stage — the Radio Tower
  is QUIET (its takeover is J4b, post-hideout). No radio content
  was staged.
- **Whitney's Miltank:** the engine's move table has NO Rollout, so
  the famous rolling threat is staged honestly with Miltank's real
  band learnset (makeMon resolution, as every leader) — no move was
  invented. Its menace is carried by level (138, the west's steepest
  ace jump) + the Tortoise Charm KO-save on the ace.

### 3. Gym assignments (leaders ride the shared leader runner)

| Gym | Leader | Team (levels) | Ace keepsake | Ground |
|---|---|---|---|---|
| Violet | Falkner | Pidgeotto 108, Noctowl 111, Pidgeot 114 | Sparrow Feather | Storm |
| Azalea | Bugsy | Ariados 120, Heracross 123, Scizor 126 | Iron Acorn | Bloom |
| Goldenrod | Whitney | Clefairy 131, Snubbull 134, Miltank 138 | Tortoise Charm | Open |
| Ecruteak | Morty | Gastly 140, Haunter 143, Misdreavus 145, Gengar 148 | Spectre Bell | Grave |

Grounds are all from the existing 15 (NO new Grounds): Falkner's sky
gym rides the Storm; Bugsy's forest gym the Bloom; Whitney's the
Open (the Plain Badge, plain all the way down); Morty's the Grave.
Landmark interiors: Sprout Tower Bloom, Slowpoke Well Tide, Burned
Tower Grave, Elm's lab + Kurt's house Open. Leader-ace keepsakes
follow the Classic pattern (authored on the team entry;
rules.foeKeepsakeFor serves them to leader aces at Classic).

### 4. Town Tales (west) — one system, folded in

Six tales (newbark / cherrygrove / violet / azalea / goldenrod /
ecruteak) exported as JOHTO_TALES from story-johto.mjs and folded
into the ONE shipped QUESTS table by merge.mjs — stage values, the
Quest Log TOWN TALES section and the validator quest list serve
them unchanged. Their dialogue rides IN the defs (offerLines /
stageLines / finishLines) and one generic Johto branch of
runTaleNpc plays them (giver accepts → stage actor advances →
giver finishes; rewards are items, stated up front per the shape
law; every tale ends in a lore revelation). Givers + stage actors
are existing maps6 townsfolk stamped by JOHTO_NPC_PATCHES.

### 5. NPC placement law

Every story actor is placed via the loadMap-append idiom (the CAPT
JOHTO precedent): JOHTO_NPCS appended + JOHTO_NPC_PATCHES stamped in
overworld loadMap; the generated maps6.mjs and its generator were
NOT touched. Placement is proven in the suite (A16/A17: walkable
non-warp tiles + walk-to-actor BFS from every entry).

### 6. Supersessions recorded

- cheat-shop A02: items **136 → 144** (the 8 Johto badge rows);
  species stays **257** (A02's Johto-mon assertion untouched).
- arc-foundation B09 + orange-climax B22 asserted the SEALED-branch
  homecoming for Johto (no advance, no embark). The flip supersedes
  them: both now assert the shipped branch (arc advances to johto,
  embark armed), same assertion count, notes in place.
- J3a's flag-armed isolation drive of the embark is replaced as the
  proof of record by johto-story B01–B03 (the true path, below).

### 7. Suite + battery at this commit

- NEW `tests/johto-story-checks.mjs` **41/41** — Part A units
  (registry, chains, plumbing, grounds, tales, placement) + Part B
  the TRUE PATH on one continuous save: post-Orange state →
  Homecoming #2 → Pallet dock CAPT JOHTO → embark → New Bark
  arrival → Silver (win branch) → report → New Bark tale → Sprout
  gauntlet → Zephyr → well plea → 3 Rockets → GS Ball delivery →
  Hive → Plain → Burned Tower awakening → Fog → Quest Log, with the
  final save validating server- and client-side; branch drives for
  the Falkner gate, the Silver LOSS branch (still standing on r30),
  and the Cheat Terminal's Johto prefix claim.
- Battery: fidelity **35/35** · validator **78/78** · save-contract
  **6/6** · cheat-shop **44/44** · arc-foundation **47/47** ·
  orange-story **38/38** · orange-climax **42/42** ·
  campaign-smoke **24/24** · qa-changed-flows failures exactly
  **{b2, d9}**.
- Fresh build (vercel + guest) OK — `public/game.js` **7,006,316
  bytes**. **personal/ byte-identical** (sha256 f434ba63…, a780af0b…;
  untouched — vercel+guest targets only). NOT pushed, NOT deployed.

### 8. Flag map (every J4a story flag + its consumer)

- `johto_arrival`, `elm_registered` — set by ev_johto_arrival.
  Consumed by: q_johto_arrival, the r30 Silver gate, Elm's dialogue.
- `silver_r30_won` / `silver_r30_lost` — the battleAny branch record
  (exactly one is set). Consumed by: the suite's honesty check;
  J4b's Silver beats should read them for continuity.
- `silver_r30_done` (+ auto `ev_johto_silver_r30_done`,
  `beat_silver_r30` on a win) — consumed by Elm's report scene gate.
- `silver_reported` — set by Elm's report scene. Consumed by:
  q_johto_thief.
- `sprout_tower_done` — Elder Li. Consumed by: q_johto_sprout,
  Falkner's gate.
- `kurt_well_plea` — ev_johto_well. Consumed by: the well Rockets'
  battle gate, Kurt's dialogue.
- `beat_rocket_well_1/2/3` — winTrainer auto-flags. Consumed by:
  runJohtoNpc's clear count.
- `johto_well_cleared` — the third Rocket's fall. Consumed by:
  q_johto_well, Kurt's delivery gate.
- `gsball_delivered`, `kurt_has_ball`, `gsball_at_kurt_house` —
  Kurt's delivery scene; the ball's whereabouts (Kurt's study) for
  J5. Consumed by: q_johto_gsball; J5's Celebi arc reads all three.
- `beasts_awakened`, `beast_seen_suicune`, `johto_burned_tower` —
  the Burned Tower event. Consumed by: q_johto_burned, Morty's
  naming dialogue; J5's beast arcs ARM on `beasts_awakened`.
- `badge_zephyr/hive/plain/fog` + `beat_<leader>` — winTrainer
  auto-flags. Consumed by: the badge quest rows; J4b's east gates.

### 9. Leftovers for J4b / J5 (named)

- J4b: east quests appended at the JOHTO_QUESTS seam (storm /
  mineral / glacier / rising + the Conference), Jasmine/Chuck +
  the medicine errand, Pryce + Lake of Rage + Lance + the hideout,
  Clair + the Dragon's Den test, the Radio Tower takeover (post-
  hideout), Gary's Johto beats + the Silver Conference (Gary
  victory centrepiece, Harrison conclusion) → `johto_complete`,
  Mt. Silver / Red at completion, and the four east Town Tales.
- J5: the three beast arcs arm on `beasts_awakened` (quest entries
  + lairs are J5's); Celebi reads the GS Ball flags (the ball is at
  Kurt's house; the Ilex shrine scene owns its return/opening);
  Ho-Oh at Bell Tower per ruling 3 (~Lv 170–185, superseding the
  designed Lv 70).
- Morty's challenge is gated on the Burned Tower awakening (his
  pre-awakening talk sends the challenger to the tower; the menu
  rides the awakened talk) — a deliberate chain-order gate (burned
  → fog in JOHTO_QUESTS). If QA wants the battle offerable
  pre-tower, it is a one-branch change in runJohtoNpc.

## Arc 2 Stage J4b — Johto story, EAST + Silver Conference + completion (2026-10-29)

Base: main @ a0cabb7 (J4a). Deliverables: the east chain appended at
the J4a seams in `src/data/story-johto.mjs` (12 quest rows, 19 trainer
defs, 10 events, 4 tales, 11 NPCs, 12 patches), the Secret Potion key
item, east Ground assignments, the sysLoadMap J4b gates + the
runJohtoNpc east handlers + the loadMap `johto` patch stamp, tables
regenerated via gen-tables ONLY (items 144 → **145**), and
`tests/johto-story-checks.mjs` extended 41 → **90 checks**. All
dialogue is original writing in the game's voice. maps6.mjs and its
generator are untouched; `personal/` is byte-identical.

### 1. Staging decisions

- **The medicine errand (Olivine ⇄ Cianwood):** Jasmine stands in the
  Glitter Lighthouse lamp room (a second instance in her gym runs the
  battle). The ask sets `jasmine_asked`; the Cianwood pharmacy
  (PHARMACIST WREN, patched in `house-cianwood`) hands over the
  **Secret Potion** (new key-pocket ITEMS row `secretpotion`)
  unconditionally — so the Cianwood-first order works: a player who
  sails r40 first can take the potion and the Storm Badge before ever
  meeting Jasmine (suite E29). The delivery (lighthouse talk with the
  potion in the bag) removes it and sets `amphy_healed`; Jasmine's
  BATTLE is gated on `amphy_healed` and nothing else (LEADERS gate —
  E03/E07). Amphy has no overworld body — there is no overworld
  species art (the Wave-0 Cubone precedent); Amphy is present through
  the lamp-room scene itself.
- **Silver, second clash (Ilex Forest):** two stagings of one beat,
  `ev_johto_silver_ilex_won` / `_lost`; sysLoadMap picks by J4a's
  `silver_r30_won` flag, so his opening lines genuinely branch on the
  Route 30 outcome (E01/E34). Gate: `silver_reported` + `badge_fog`
  (it is an east beat — it cannot fire during the west traverse).
  Shared battleAny: his Croconaw grown (134), Golbat, Sneasel.
- **Red Gyarados:** a map-entry event wildBattle (Gyarados Lv 162,
  CATCHABLE, no uncatchable flag). The runSteps fled guard is the
  whole law: fleeing sets nothing and the event re-fires on the next
  entry (E08); a catch (proven by Master Ball in E09) or a KO
  resolves it once, and `red_gyarados_done` gates it forever (E10).
  Lance's aftermath plays inside the same event (he names the radio
  signal and points at Mahogany's souvenir shop; `lance_met`).
- **The Rocket Hideout has NO interior map** — J3b authored none for
  Mahogany and maps6 stays untouched by this stage's brief, so the
  hideout is staged as a scripted DESCENT event (`ev_johto_hideout`)
  run from Lance in Mahogany: trapdoor dialogue → grunt → grunt →
  the Electrode power core (a wildBattle, Lv 166, uncatchable — a
  machine's heart staged as a battle) → Executive Vey → the signal
  dies. Lance fights beside the player in the dialogue between
  beats, not as a mechanic. Must-win `{ battle }` steps mean a loss
  stalls the chain with no flag — re-talking to Lance re-runs the
  descent; it can never half-clear (E11). A bespoke hideout interior
  map is a future map-stage candidate (see leftovers).
- **Pryce** is gated on `johto_hideout_cleared` (canon order — the
  occupation ends first; E35).
- **The Radio Tower takeover** stages AFTER the hideout, in canon
  order, as flag-staged floor events: tower-1 entry (post-hideout)
  fires the takeover + floor-1 grunt; tower-2 without the rescue
  plays the locked-door scene (once) pointing at the Underground;
  the real Director, held in `goldenrod-underground-2`, is freed in
  an event battle and gives the **Card Key** — the shipped `cardkey`
  ITEMS row (one representation, Silph → Radio Tower). The tower's
  lock reads the RESCUE flag, not the bag (a veteran player already
  carries Silph's card; the Director's own key is the rescue). With
  the rescue, tower-2 runs its gauntlet; tower-3 runs the fake
  Director (`rocket_director_fake`) and sets `radio_tower_cleared` —
  Rocket leaves Johto (E13–E17). Before the hideout the tower is
  QUIET (E36). NO Clear Bell is awarded here — J5's Kimono sisters
  own it, per the designed arc steps.
- **Clair + the Dragon's Den:** Clair's trainer def carries NO badge
  on purpose. Her gym win sets `clair_beaten` only — the suite's
  badge-count proof shows **7 after the gym** (E18). The Den Elder
  (patched in `dragons-den`) runs the test: three questions (every
  answer is heard, per the choice law; the elder's verdict names
  what the answers showed), then the shrine battle (Keeper Sora,
  Dragonair 174 / Kingdra 177). Winning writes the badge by the
  EXACT leader-award representation — `risingbadge` pushed to
  `badges.johto` + the `badge_rising` flag, badge sfx — **8 after
  the den** (E19).
- **The route-silver badge gate** is a sysLoadMap gate in the
  engine's event idiom: entering `route-silver` with fewer than 8
  Johto badges fires `ev_johto_silver_gate` (a League official's
  word + a warp back to Blackthorn's east edge at (28,8)). The badge
  count is the gate (never the event's done flag), so it cannot be
  bypassed by having seen it; the player is turned back with
  directions, never stuck (E30). Past the gate, Silver's third clash
  fires on the same road (battleAny; Crobat / Sneasel / Magneton /
  Feraligatr 178–184) and the rivalry closes in words either way:
  he concedes the race, names what he is going back to Azalea to
  learn, and steps out of the road (E20).
- **The Silver Conference** (silver-stadium): the patched CONFERENCE
  OFFICIAL registers the player (8 badges) and runs the two
  qualifiers (Brenna 180–184, Cato 183–186). **Gary is a REAL
  must-win trainer battle** (standard league idiom): his team is
  built from his Kanto identity, grown — Pidgeot 186, Alakazam 188,
  Arcanine 189, Gengar 190, Umbreon 191, Blastoise 193 ace
  (Tide Pearl). Losing leaves `beat_gary_johto` unset; he is
  re-challengeable after healing — proven by a loss-then-win drive
  (E31). No soft-lock.
- **HARRISON — the mechanism, and why (RECORDED):** the brief's
  preference (a), a scripted climax, is **inexpressible in this
  engine**: the only endure hook is the classic battle's tutorial
  lesson-mon (battle.mjs, gated on the tutorial flag, wild foes
  only); trainer battles expose no scripted-outcome / forced-result
  step; and runSteps has no conditional branch for post-battle text.
  So branch **(b)** ships, exactly as the brief specifies: a REAL
  full-strength battle (Sneasel 192, Xatu 193, Hypno 194, Steelix
  195, Miltank 196, Houndoom 198 — the canon core plus Xatu as the
  in-roster sixth) fought FRIENDLY through the stadium handler,
  whose completion predicate is **FACED**: win or lose, the branch
  flag records the honest outcome, branch-true text plays
  (canon-honours on a loss — the quarter-final loss stands, judges'
  card and all, staged with dignity and Gary applauding in the
  tunnel; upset-acknowledged text on a win), and `johto_complete`
  is set either way. Both branches are suite-proven (E24 win on the
  true path, E32 loss on a branch drive — friendly, so a loss never
  blackouts out of the stadium).
- **Completion rides the Foundation machine, untouched:** the
  Harrison handler sets ONLY `johto_complete` (the registry's
  completionFlag) and calls `checkArcCompletion(g)` — the machine
  writes `regionsDone 'johto'`, plays the ARC COMPLETE card, and
  pins the Hoenn directive itself (E25: card flag, regionsDone,
  `arc_directive 'hoenn'`, arc still `johto`). The drive then
  ferries/walks home and **Homecoming #3** fires in Mom's house:
  Hawthorn's Hoenn hook delivered from the registry, directive
  cleared, and because Hoenn's row is `sealed`, the ritual completes
  with arc unadvanced and NO embark flag — zero dangling state
  (E26). Nothing in this stage hand-writes regionsDone.
- **Red (post-completion):** one NPC on the `mt-silver-cave` dais.
  Before `johto_complete` he offers only "..." and no battle (E33).
  After it, talking starts the battle: the canon team at the band
  ceiling — Espeon 195, Snorlax 196, Venusaur 197, Charizard 198,
  Blastoise 198, Pikachu 200. Beating him sets `red_defeated`,
  which completes the post-game quest row `q_johto_red` — an
  honours line in the log, a gate on nothing. Rematchable: post-win
  talks offer the battle again (E27).

### 2. Gym table — all 8 Johto gyms (completed)

| Gym | Leader | Team (levels) | Ace keepsake | Ground |
|---|---|---|---|---|
| Violet | Falkner | Pidgeotto 108, Noctowl 111, Pidgeot 114 | Sparrow Feather | Storm |
| Azalea | Bugsy | Ariados 120, Heracross 123, Scizor 126 | Iron Acorn | Bloom |
| Goldenrod | Whitney | Clefairy 131, Snubbull 134, Miltank 138 | Tortoise Charm | Open |
| Ecruteak | Morty | Gastly 140, Haunter 143, Misdreavus 145, Gengar 148 | Spectre Bell | Grave |
| Cianwood | Chuck | Primeape 148, Poliwrath 151, Machamp 154 | Second-Wind Ribbon | Rubble |
| Olivine | Jasmine | Magnemite 154, Magneton 157, Steelix 160 | Fossil Spur | Tide |
| Mahogany | Pryce | Seel 162, Dewgong 165, Piloswine 168 | Tortoise Charm | Frost |
| Blackthorn | Clair | Dragonair 172, Dragonair 174, Gyarados 175, Kingdra 178 | Tide Pearl | Ember (gym) |

The Rising Badge is awarded in the Dragon's Den (Grave Ground), not
the gym — see §1. Grounds are all from the existing 15 (NO new
Grounds): east landmarks — lighthouse + Lake of Rage Tide, Radio
Tower Storm, Dragon's Den Grave, Silver Stadium Open (the
league-floor precedent), Mt. Silver summit cave Frost.

### 3. Flag map (every J4b story flag + its consumer)

- `jasmine_asked` — the lighthouse ask scene. Consumed by:
  Jasmine's lighthouse repeat lines. (The pharmacist does NOT read
  it — the potion is served either order, by design.)
- `secret_potion_got` — the pharmacist's grant. Consumed by: the
  pharmacist's repeat lines.
- `amphy_healed` — the lighthouse delivery. Consumed by:
  q_johto_potion, Jasmine's gym gate, the lighthouse + pharmacist
  post lines.
- `badge_storm` / `badge_mineral` / `badge_glacier` + `beat_chuck` /
  `beat_jasmine` / `beat_pryce` — winTrainer auto-flags (Clair:
  `beat_clair` only, no badge flag — the den writes `badge_rising`).
- `silver_ilex_won` / `silver_ilex_lost` (exactly one) +
  `silver_ilex_done` (+ auto `ev_johto_silver_ilex_*_done`) — the
  Ilex battleAny branch record; consumed by the suite's honesty
  check (the J4a pattern).
- `red_gyarados_done` — the lake event, post-battle only. Consumed
  by: q_johto_redgyarados, the lake re-fire gate, Lance's lines.
- `lance_met` — the lake aftermath. Record flag (Lance's Mahogany
  gate reads `red_gyarados_done`).
- `johto_hideout_cleared` — the hideout event's final step.
  Consumed by: q_johto_hideout, Pryce's gate, the Radio Tower
  takeover gate, Lance's post lines.
- `beat_rocket_hideout_1/2`, `beat_rocket_hideout_exec` —
  winTrainer auto-flags inside the descent.
- `radio_takeover_active`, `radio_f1_cleared` — the takeover event.
  Consumed by: the tower-2 / underground staging gates.
- `radio_locked_seen` — the locked-door scene's once-gate.
- `radio_director_rescued` — the Director event (which also grants
  the `cardkey` item). Consumed by: the tower-2 gauntlet gate —
  THIS flag is the tower's key (see §1).
- `radio_f2_cleared` — the floor-2 event. Consumed by: the tower-3
  gate. `radio_tower_cleared` — the top-floor event. Consumed by:
  q_johto_radio; the tower is quiet afterwards.
- `beat_rocket_radio_1/2`, `beat_rocket_underground`,
  `beat_rocket_director_fake` — winTrainer auto-flags.
- `clair_beaten` — Clair's handler on a gym win. Consumed by:
  Clair's post-gym lines, the Den Elder's gate.
- `den_test_done` — the elder's questions completed (set before the
  shrine battle). Record flag for the test's dialogue half.
- `badge_rising` — written by the den award with the
  `badges.johto` push (the exact leader representation).
- `conference_registered` — the Official's registration. Consumed
  by: q_johto_conference, the bracket flow (Official / Gary /
  Harrison handlers).
- `beat_conference_q1` / `beat_conference_q2` / `beat_gary_johto` —
  winTrainer auto-flags. Consumed by: the bracket flow;
  `beat_gary_johto` also completes q_johto_gary and unlocks
  Harrison.
- `harrison_faced` + `harrison_won` XOR `harrison_lost` — the
  Harrison handler's FACED record. Consumed by: the Official's post
  lines; the completion proof.
- `johto_complete` — the Harrison handler. Consumed by: the
  Foundation machine (`arcCompletionMet` → card / regionsDone /
  directive), Red's gate, the Conference post lines. THIS stage
  never writes `regionsDone` itself.
- `silver_route_won` / `silver_route_lost` (exactly one) +
  `silver_route_done` — the Route Silver battleAny record.
- `red_defeated` — Red's handler on a win. Consumed by:
  q_johto_red (the honours row). Red stays rematchable.

### 4. Suite + battery at this commit

- `tests/johto-story-checks.mjs` **90/90** — J4a's 41 (assertions
  A02/A11/A15/A18 extended to the full chain: 22 quests, 10 tales,
  items 145, 24 patches) + A19–A29 east units + the EAST TRUE PATH
  on one continuous save (E01–E28: Ilex clash → errand both halves
  → Storm → delivery → Mineral → Gyarados flee→re-fire→catch →
  hideout → Glacier → Radio Tower in staging order → Clair 7 →
  Den 8 → Silver's third clash → an east tale → Conference →
  Gary → Harrison → machine → Homecoming #3 → Red → Quest Log,
  the save validating server- and client-side at full prefix) +
  branch drives E29–E36 (Cianwood-first order, the badge gate,
  Gary lose→re-challenge, Harrison loss, Red's gate, the Ilex
  lost-branch staging, Pryce's gate, the quiet tower) + B23/B24
  validator prefix proofs.
- Supersession recorded: cheat-shop A02 items **144 → 145** (the
  Secret Potion row), updated in place.
- Battery: fidelity **35/35** · validator **78/78** · save-contract
  **6/6** · cheat-shop **44/44** · arc-foundation **47/47** ·
  orange-story **38/38** · orange-climax **42/42** ·
  campaign-smoke **24/24** · qa-changed-flows failures exactly
  **{b2, d9}**.
- Fresh build (vercel + guest) OK — `public/game.js` **7,076,169
  bytes**. **personal/ byte-identical** (sha256 f434ba63…,
  a780af0b…; untouched — vercel+guest targets only). NOT pushed,
  NOT deployed.

### 5. Leftovers, named

- **J5 reads, unchanged:** `beasts_awakened` (beast arcs arm),
  `gsball_delivered` / `kurt_has_ball` / `gsball_at_kurt_house`
  (Celebi — the ball never moved in J4b), Ho-Oh at the Bell Tower.
  The Clear Bell was deliberately NOT awarded in the Radio Tower
  beat — it is the Kimono sisters' to give in J5's designed steps.
- **J7:** the arc-chain drive extension (one continuous save
  Kanto→Orange→Johto→Homecoming #3 + systems) is J7's stage; this
  stage proves the Johto leg + completion + homecoming on the
  johto-story save.
- **Prefix-law note (standing J4a plumbing, surfaced honestly):**
  badges are a validator PREFIX of the canonical earn order
  (storm before mineral). The brief's either-order case — Cianwood
  first (Storm → Mineral) — works and is proven (E29). A player who
  ferries back from Cianwood WITHOUT fighting Chuck and then beats
  Jasmine first would push `mineralbadge` ahead of `stormbadge` in
  `badges.johto`, the same out-of-order exposure the west's ungated
  leaders already carry under J4a's plumbing; closing it (order-
  enforcing gates or order-normalizing awards) is a coordinator
  call, not a J4b change.
- **No hideout interior map exists** (see §1): if a later map stage
  authors one under Mahogany's shop, the descent event's battles
  can be re-homed into it without flag changes — every flag the
  gauntlet sets is location-independent.

## Arc 2 Stage J5 — Johto legendary arcs + badge-order gate + Rocket Hideout map (2026-10-29)

Stage J5 ships the five legendary arcs J4a/J4b only armed, closes
the badge-order invalid-save class J4b surfaced, and authors the
Rocket Hideout interior J4b staged without. Suite:
`tests/johto-story-checks.mjs` grows Part A units A30–A36 and the
headless Part F drives (F01–F11) — **110/110**.

### 1. The five arcs (JOHTO_LEGENDARY_ARCS + arc_hooh activated)

`JOHTO_LEGENDARY_ARCS` (story-johto.mjs) folds into `LEGENDARY_ARCS`
in merge.mjs exactly the way Orange's arcs fold — one arcs table,
one Quest Log (the log enumerates `state.story.quests` × the merged
table; F09 proves the join by reading the log's data and opening it
on the bundle). Arc stages are written by `{arc}` steps / handlers;
the Burned Tower event now also writes the three beast arcs
`discovered` at the awakening.

SHARED LAW: every face rides the new runSteps step kind
`{ wildBattleCatch }` — the chain advances ONLY on a catch. A flee
OR a KO stalls it with nothing set (no arc-complete step, no
event-done flag), so every legendary encounter re-fires until the
species is CAUGHT. A one-of-one can never dex-lock a player. Arc
completion = the catch, everywhere.

- **arc_raikou — Lv 178, National Park storm field.** Prereq
  `beasts_awakened`. Chase: Stormwatcher Iben (r35, the storm-split
  pine) → Ranger Solveig (r36, the scorch-signed meadow stones);
  face fires on National Park entry once both signs are filed.
- **arc_entei — Lv 180, Mt. Mortar deep chamber (mt-mortar-2).**
  Chase: the Ashkeeper Monk (Burned Tower floor 1, warm pawprints
  in the ash) → Karate Trainee Bo (Mt. Mortar floor 1, the
  mountain's heartbeat); face on mt-mortar-2 entry.
- **arc_suicune — Lv 184, the Bell Tower's foot (bell-tower-1).**
  Chase: Bell Warden Yuki (Ecruteak) → Fisherwoman Noor (Cianwood's
  north shore). Face ADDITIONALLY requires `arc_raikou_done` +
  `arc_entei_done` — it comes to the tower when the others are
  quieted (Crystal's staging). F06 proves the no-face state with
  signs complete but kin unquieted.
- The "signs" are witness NPCs placed via the JOHTO_NPCS append
  idiom (handlers in runJohtoNpc): generated sign objects are inert
  text and cannot set flags, so a tracked chase needs actors. Each
  witness is order-enforced (the second points you back to the
  first), dormant before `beasts_awakened`, and files post-catch
  lines after.
- **arc_celebi — Lv 170, Ilex Forest shrine (14,3).** Steps: (1)
  after `beasts_awakened`, Kurt (kurt-house) returns the GS Ball —
  the whereabouts chain moves exactly: `bag.gsball` +1,
  `kurt_has_ball`/`gsball_at_kurt_house` cleared (set false),
  `gsball_back_with_player` set, the historical `gsball_delivered`
  stands, quest `arc_celebi` discovered; (2) the shrine is a
  faced-tile interact (sysInteract, JSHRINE at (14,3)) → the ball
  opens → the time-ripple scene (`celebi_shrine_opened`); (3) the
  catch. After the catch the empty GS Ball stays in the bag as a
  memento — its ITEMS desc already told that truth, unchanged.
  Before the return, the shrine gives only flavour (F08 proves it
  inert). NOTE: this live entry supersedes the designed arc_celebi
  in story-kanto.mjs via Object.assign order (its Farfetch'd-errand
  steps never matched the shipped GS Ball story) — recorded here.
- **arc_hooh — ACTIVATED in place** (story-kanto.mjs
  LEGENDARY_ARCS): `designedOnly` removed; the designed four steps
  stand with flags — tower history from Elder Gensai (appended
  Ecruteak NPC, sets `hooh_history`) → the Clear Bell from the
  Kimono sisters (Kimono Sister Moeko, dance-theater; scene prereq
  = all three beast arcs complete; grants the new key item
  **`clearbell`**, pocket 'key', sets `hooh_bell_received`) → the
  climb (`hooh_summit`, set by the face event) → the face at the
  Bell Tower summit (bell-tower-2 entry, Lv 182, catch-only).
  SUPERSESSIONS (coordinator ruling 3): the designed "level 70"
  predates the arc bands and is superseded by **Lv 182** (Johto
  band 101–200); the designed lair id `'tintower'` never existed
  as a map and is corrected to **`'bell-tower'`** (the shipped
  bell-tower-1/-2 maps). Also the episode-1 echo: a one-time
  glimpse on r29 (`ev_johto_hooh_glimpse`, sysLoadMap-gated on the
  Johto arc active + before `hooh_history`) — dialogue-only, sets
  `hooh_glimpsed` + arc discovered; flavour, never a requirement
  (F01 proves it fires exactly once). Ruling 4 honoured by
  omission: Lugia stays one-of-one at Shamouti; the Whirl Islands
  gain no second encounter.
- **Quest-table plumbing:** gen-tables now folds
  JOHTO_LEGENDARY_ARCS keys into tables.json quests (raikou/entei/
  suicune were new ids); items count 145 → **146** (clearbell) —
  cheat-shop A02 and johto-story A15 updated in place with the
  supersession recorded in their check text.

### 2. Badge-order gate (J4b addendum — the invalid-save class, closed)

The server validator rejects non-prefix badge sets
(`bad-badge-order`), but Johto's geography let a player earn Fog
before Plain, Mineral before Storm, or Glacier before Mineral — a
legitimate save the server would refuse. Fixed at the source in
runJohtoNpc (`badgeOrderRefusal`, data-driven from
`BADGE_SETS.johto` — no per-leader code): each Johto leader's
BATTLE requires the earlier Johto badges; leader index i refuses
politely while `badges.johto.length < i`, naming the first missing
badge and where its leader waits (Falkner, index 0, always open;
Clair's battle gates at 7 inside her bespoke handler; the den award
path beyond it is unchanged). Only battles gate: Jasmine's
lighthouse ask and potion delivery stay ungated, and each leader's
own story gate (Sprout Tower / Amphy / hideout) keeps its inner
place — the order gate composes ahead of it. Jasmine at 4 badges
refuses toward Cianwood's gym (Storm precedes Mineral), matching
the honest geography. Suite: F10a (Morty refuses at 2 naming
Whitney/Goldenrod, accepts at 3 and the Fog Badge is earned), F10b
(Jasmine refuses before Chuck, accepts after Storm + Amphy), F10c
(Falkner open at 0; Clair refuses at 6 naming Pryce/Mahogany,
offers at 7). The full playthrough still earns 1→8 in order (the
B/E true paths + B23/B24 prefix pins, unchanged and green). The
J4b leftover note about this exposure is thereby RESOLVED.

### 3. Rocket Hideout map (J4b addendum — the descent, re-homed)

`rocket-hideout` is authored in the generator of record
(~/workspace/ashs-journey-qa/johto-j3a/gen_maps6.py): one interior,
26×16, cage rows (birdcage props over strata floors, north-west and
north-east) + the power-core chamber (serverrack/coil/batterypack/
switchboard/pipecluster around a grate dais, cablefloor approach)
from the shipped underground/cave/strata families; signs carry the
base's own notices; no wild table (occupied, not a habitat).
maps6.mjs regenerates deterministically (83 maps; the diff is the
header + this one map). The stair doors on the south wall warp back
to Mahogany (18,8). Ground: Storm (the transmitter hum).
Re-homing: the map's own geography is the ONLY maps6 change — the
stair entry is the NPC/event idiom: Lance's Mahogany scene now
descends for real (`enterJohtoHideout`), and Shopkeeper Pell
(appended in Mahogany, `hideout_stairs`, `hideoutWarp` field) keeps
the stairs usable before (refused — "storage"), during, and after
the clear. `ev_johto_hideout` itself is byte-unchanged and now
fires from the sysLoadMap gate ON the hideout map — the gauntlet
battles + Electrode core play where the player stands, and
`johto_hideout_cleared` + every downstream consumer (Pryce's gate,
Radio Tower staging) behave byte-identically (F11 proves the
stairs entry + on-map clear; E11 proves Lance's route still lands
the same clear; E35/E36 + the B east path re-prove the consumers).
No beat stayed in event form for structural reasons — the event WAS
the staging; only its room was missing. The sweep models the stair
warp as a graph edge (ferry pattern) and passes all 85 maps in
scope; richness passes the hideout at 83 colours (interior floor
55).

### 4. Battery (all green, this stage)

- johto-story **110/110** (was 90/90 at J4b; +A30–A36, +F01–F11)
  · fidelity **35/35** · validator **78/78** · save-contract
  **6/6** · cheat-shop **44/44** · arc-foundation **47/47** ·
  orange-story **38/38** · orange-climax **42/42** ·
  campaign-smoke **24/24** · qa-changed-flows failures exactly
  **{b2, d9}** · Johto sweep PASS (85 maps incl. rocket-hideout) ·
  Johto richness PASS (83 maps).
- Fresh build (vercel + guest) OK — `public/game.js`
  **7,118,446 bytes**. **personal/ byte-identical** (sha256
  f434ba63…, a780af0b…; untouched — vercel+guest targets only).
  NOT pushed, NOT deployed.

### 5. Leftovers, named

- **Lugia (ruling 4):** Whirl Islands dressing/lore only; the one
  Lugia remains the Shamouti catch of Stage O3. If a future stage
  wants a Whirl Islands beat, it is scenery, never a second catch.
- **Beast witnesses are single-visit actors:** the six witnesses
  keep their post-catch lines forever (no roaming beasts); a
  roaming-encounter system was not briefed and is not implied.
- **Glimpse window:** the r29 glimpse gates on the Johto arc being
  active and `hooh_history` unheard; a player who hears the history
  before ever re-entering r29 (impossible on the walking chain —
  Ecruteak is reached through r29's successors — but possible via
  ferry/fast-travel seams) simply misses a flavour scene. No flag
  depends on it.
- **Cheat Terminal interplay (honest note):** a species claimed
  from the Cheat Terminal registers `dex.caught`, which satisfies
  a wildBattleCatch chain's catch check on a later KO — the
  terminal is owner-sanctioned stock, so this is consistent with
  its existing badge-prefix behaviour, not a new hole.
- **J6/J7 unchanged:** Day-Care/breeding (J6) and the arc-chain
  drive + Hoenn hook (J7) read the flags this stage sets
  (`arc_*_done`, `hooh_glimpsed`, `gsball_back_with_player`) as
  ordinary history.

## Arc 2 Stage J6 — Arc systems: eggs/breeding + apricorn balls + Link Transfer widening (2026-10-29)

Stage J6 wires the three systems the earlier stages only staged:
breeding at the Route 34 Day-Care (the J3a building/interior get
their couple and a full egg economy), apricorn trees + Kurt's ball
crafting (J3a's `apricorn` tile kind and J4a's Kurt NPC become a
working supply chain for seven new balls, live in BOTH battle
engines), and the J1 Link Transfer leftover (the candidate scan now
sees `evos` trade branches). Suite: NEW
`tests/johto-systems-checks.mjs` — Part A pure units A01–A39 +
headless bundle drives B01–B22 — **62/62**.

### 1. Part A — egg-group data completion (facts only)

`~/workspace/ashs-journey-qa/arc2-etl/etl-kanto-eggs.mjs` extends
J1's PokeAPI facts route: live `pokemon-species` fetches for dex
1–151 + the six species2 guests (175/183/209/232/249/250), cached
under `arc2-etl/raw-eggs/`, inserted ADDITIVELY as one line per
entry (`eggGroups`, `hatchCounter`, `baby: true` only where
PokeAPI `is_baby`) — 158 insertions, 0 deletions, no other entry
changes (species.mjs 14 + species2.mjs 144). Every non-form
species dex 1–251 + partner now carries egg data (A01). Facts
spot-proven (A02/A03): bulbasaur monster/plant 20, mew no-eggs
120, articuno no-eggs 80, togepi baby + no-eggs 10. The legendary
exclusion is DATA, not a list: every legendary/mythical in
1–251 carries `no-eggs` from the source.

### 2. State design — six new persisted fields, each a matched pair

Hard law honoured (J4a): `story.flags` stays booleans-only; all
J6 numeric state is real state. Every field below exists in
`defaultState` (state.mjs), the client schema
(src/save/schema.mjs fill + validate), AND the server validator
(api/_lib/validator.mjs) — the pairs were extended together,
with save-contract cases (tools/api-scripts/save-contract.test.mjs
grows 6 → 10: a full J6 payload validates; 3 daycare guests /
negative stepsTotal / negative eggSteps are 422).

- `state.daycare` — array of mon records, max 2. Server runs the
  FULL `checkMon` on each guest; client mirrors shape + cap.
- `state.daycareEgg` — null | `{ speciesId, eggSteps }`, the one
  egg waiting at the Day-Care.
- `state.daycareEggAt` — null | step total at which the waiting
  egg materializes (the production schedule).
- `state.stepsTotal` — the PERSISTED walked-step counter. The
  shipped game counted steps only per session (Safari/poison),
  so J6 adds this; `sysOnStep` increments it every real step.
  It is the single clock for egg production, egg countdowns,
  apricorn rest, and Kurt crafting.
- `state.gather` — `{}` treeId → stepsTotal at which that
  apricorn tree is pickable again. Bounded: ≤64 rows, treeId
  grammar `map:x,y`, values 0..1e9 (both validators).
- `state.kurtOrder` — null | `{ ball, readyAt }`; `ball` must be
  a real BALLS id (the server validator's table set now carries
  `balls`, gen-tables regenerated: 160 items).
- Mon records gain optional `egg` (boolean) + `eggSteps`
  (int 0..100000), validated identically in party, boxes, and
  daycare entries on both sides.

### 3. Breeding / eggs (src/game/johto-systems.mjs, pure; menus in overworld-systems.mjs)

- The couple: the r34 keeper is stamped `johto: 'daycare'` via
  JOHTO_NPC_PATCHES (johto-story A18 count 24 → 25, recorded
  there); his wife `DAY-CARE WOMAN` is appended via JOHTO_NPCS
  at daycare (4,7). Both faces run the same `openDaycare` menu
  (leave / take back / collect egg / status / leave).
- Compatibility is GROUP-ONLY: the pair shares an egg group, or
  one is Ditto (group `ditto`) with a breedable partner.
  SIMPLIFICATION RECORDED: the engine has no gender, so canon's
  gender pairing is dropped — group membership is the whole
  rule. `no-eggs` species, babies (`baby: true`), and forms
  never breed; legendaries/mythicals fall out of the data
  (all carry `no-eggs`), never a hard-coded list.
- Offspring: the base stage (evo-graph walk-back over evo +
  evos) of the non-Ditto parent if one parent is Ditto, else
  the FIRST-deposited parent. RECORDED simplification (canon
  uses the female parent; there is no gender to read).
- Production: a compatible deposited pair arms
  `daycareEggAt = stepsTotal + 200`; the step that reaches it
  materializes the one waiting egg. Withdrawing either guest
  disarms; collecting re-arms. The couple's dialogue reports
  readiness honestly (pair state, egg waiting, steps to go).
- The egg is a mon record `{ species, egg: true, eggSteps }`
  with eggSteps = offspring `hatchCounter` × **25** steps
  (CALIBRATION: typical species 500 steps, baby pool 250 — a
  walk across a route or two, not a marathon). Delivery is the
  cap-safe gift idiom: party if room, else first PC box with
  room; all-full refusal mutates NOTHING (proven byte-equal,
  A19) and the egg stays waiting.
- Hatching: party eggs count down on the same persisted step
  hook; at zero the hatch scene fires on the step (dialogue
  idiom, the step is claimed), egg fields are cleared, dex
  registers 'caught', and **level = the current arc's band
  floor** via `currentArcOf` (Johto 101, Kanto/Orange 1 —
  proven both, A17/A18 + B09).
- Guards: eggs cannot be a battle lead or be sent out
  (`firstAble` skips them, the classic party menu disables the
  row, both proven in-bundle B14/B15); an egg cannot be
  deposited at the Day-Care, Link-Transferred, stone/level
  evolved, taught a TM/HM, given a keepsake, or targeted by
  Rare Candy / XP Candy / medicine (bag + party-menu target
  rows disabled, B22); the player can never be left with an
  all-egg party — Day-Care deposit AND both PC place/swap
  directions simulate the resulting party and refuse the last
  non-egg mon (the engine's "can't deposit your last mon"
  precedent, extended). The partner refuses Day-Care deposit
  via the existing `boxCheck` precedent.
- Story egg: the couple's one-time gift (flag
  `daycare_story_egg`, boolean) on the first visit — an egg
  from the baby pool (pichu, cleffa, igglybuff, togepi, magby,
  elekid, smoochum, tyrogue; shipped RNG picks). All-full
  refusal sets no flag, so the gift re-offers next visit.

### 4. Apricorn balls (Part C)

- 7 apricorn items (pocket 'items') + 7 balls join BALLS and
  ITEMS (pocket 'balls'), canon mapping red→Level, blue→Lure,
  yellow→Moon, green→Friend, pink→Love, white→Fast,
  black→Heavy. NO prices: balls are Kurt-only (never mart
  stock — the mart filter reads price), apricorns are gathered,
  never sold. The Cheat Terminal stocks everything from data:
  its A02 count and johto-story A15 move 146 → **160** items
  (supersessions recorded in both suites).
- Trees: all 20 `apricorn` tiles across maps6 (azalea 10,
  kurt-house 2, r33 6, r37 2 — both halves of Johto) form
  APRICORN_TREES {map, x, y, item}; colours cycle the canon
  seven over the sorted table (every colour ≥2 trees, A25).
  Facing a tree picks its apricorn; the tree then rests
  **200 steps** (persisted in `state.gather`); facing a resting
  tree reports the real steps remaining.
- Kurt (kurt-house, the J4a NPC): talking to him preempts the
  story chain ONLY for J6 business — a pending order collects
  on talk when ready (progress reported honestly before that),
  a carried apricorn opens the craft menu (one order at a
  time, the apricorn is taken), and the menu's "Just talk"
  option re-enters the handler once with a session marker so
  the GS Ball story chain runs byte-identically. Crafting
  takes **250 steps** (mission number). A28/B11–B13 prove the
  lifecycle incl. no double-order.
- Catch mechanics: ONE shared helper (src/game/ball-rules.mjs,
  `ballBonusFor`/`ballCatchRate`) is called by BOTH engines —
  the fixedLevel lesson applied prospectively: classic
  `beginCatch` and RT `rtUpdateBall` scale the species catch
  rate BEFORE `gen1Catch`, so both engines share the exact
  calc. Rules: **level** — lead/foe ratio ≥4 → 8, >2 → 4,
  >1 → 2, else 1. **lure** — ×3 iff the battle began by
  fishing: `startFishing` is the single rod→battle start path
  for both engines (one BattleScene class), so the `fished`
  marker is set in exactly one place and lands on the one
  constructor both engines share. **moon** — ×4 iff the foe's
  species evolves by Moon Stone (evo/evos stone fields).
  **love** — ×8 iff foe species == lead species; RECORDED:
  canon's opposite-gender clause is dropped (no gender
  system). **fast** — ×4 iff foe base Speed ≥ 100; RECORDED
  proxy for canon's flee-rate table (the game keeps no flee
  rates; base Speed is its own published bulk/speed data).
  **friend** — flat ×1 by design; its effect is post-catch:
  the shared `catchSuccess` sets the caught mon's `friendship`
  to 200 (mons DO carry the field, default 70; B18 proves it
  in the real engine). **heavy** — by the foe's battler tier
  (battler-tiers.mjs: S → 1, M → 1.5, L → 2.5, XL → 4);
  RECORDED adaptation of canon's weight table to the game's
  own bulk measure — no XL-tier species exists in dex 1–251,
  so ×4 is currently unreachable through play (the mapping
  carries it for future dexes). The RT bag menu now iterates
  the BALLS table (was a hard-coded 4-ball list), so apricorn
  balls are throwable in RT too (B21). Every ball's desc text
  states its real condition — no fake flavour (A29). All six
  rate rules are proven INSIDE gen1Catch (A37) and in the real
  engines: classic for moon + friend (B16–B18), RT spot-proofs
  for level + heavy against plain-ball controls (B19/B20).

### 5. Link Transfer widening (Part D)

The candidate scan in openPc (overworld-systems) now reads
`tradeEvolutionsOf` (johto-systems): the species' primary
`evo` plus EVERY `evos` branch with method 'trade' — each
branch is its own menu row, and `evolveMon` gained a 4th
parameter (`forcedEvo`) so the CHOSEN branch is the one that
evolves. All ten lines proven candidates (A38): Kanto —
kadabra→alakazam, machoke→machamp, graveler→golem,
haunter→gengar; Johto — onix→steelix, scyther→scizor,
seadra→kingdra, porygon→porygon2, and the two branch lines
this stage exists for: **poliwhirl→politoed** and
**slowpoke→slowking** (poliwhirl's primary water-stone
poliwrath path is untouched, A39).

### 6. Verification (all 2026-10-29, this tree)

- **johto-systems 62/62** (new) · johto-story **110/110** ·
  fidelity **35/35** · validator **78/78** · save-contract
  **10 passed** · cheat-shop **44/44** · arc-foundation
  **47/47** · orange **38/38 + 42/42** · campaign-smoke
  **24/24** · qa-changed-flows failures exactly the standing
  baseline **{b2, d9}** · battle-model 39/45 with failures
  E02–E07 verified IDENTICAL at base commit 01a8994 (standing
  Center-exit baseline, not a J6 regression).
- Fresh build (vercel + guest) OK — `public/game.js`
  **7,169,311 bytes**. **personal/ byte-identical** (sha256
  f434ba63…, dbf2112b…, a9242398…, a780af0b…; untouched —
  vercel+guest targets only). NOT pushed, NOT deployed.

### 7. Leftovers, named

- **No in-game step display reads stepsTotal:** the counter is
  infrastructure (couple/Kurt/tree dialogue compute remainders
  from it); no HUD or summary surface shows the raw total.
- **Ditto × Ditto pairs produce** under the group rule (Ditto
  is breedable and shares its group with itself); canon
  forbids it. Harmless (offspring = Ditto), left as a
  consequence of the recorded group-only simplification.
- **Egg movesets are the Lv1 set:** a hatched mon keeps the
  moves makeMon dealt at level 1 (the hatch raises level/stats
  only, like a gift mon). A future polish could re-deal the
  learnset at the band floor.
- **Heavy Ball ×4 (XL tier) is unreachable** in dex 1–251 (no
  XL-tier species); the tier mapping carries it for Hoenn.
- **J7 unchanged:** the arc-chain drive + Hoenn hook read J6's
  fields as ordinary save data; nothing in J6 gates J7.

## Arc 2 Stage J6.5 — Center-exit regression fix: the W7 warp fade vs the P1 ticket (2026-10-29)

### 1. The failure

At the J6 gate, `tests/battle-model-checks.mjs` stood at **39/45**,
failing **E02–E07** — the whole P1 Center-exit family (ADR-026
battle mission, commit 31effbf): leaving a Pokémon Center —
voluntarily, after a blackout, or after a reload inside a Center —
landed on a fallback position (still on map `center`, or the town
at (4,5)) instead of the persisted door-front ticket (Viridian
(7,6), Fuchsia/Cinnabar (7,8), Pallet (7,9) for the owner
scenario). The E08 save-fill/validator pins passed throughout:
`story.lastCenter` persisted correctly — the runtime path was
not honouring it in time. The failure set was byte-identical at
base 445a195, i.e. NOT a Johto-stage regression.

### 2. Bisect trail (git worktrees, suite run at each point)

- **85c249a** (ADR-026 WP5, the battle mission's close): **45/45**.
- **8e10c72** (last pre-Premium+ commit): **45/45**.
- **8ed572e** (Premium+ W0): 45/45 · **09a32b7** (W2): 45/45 ·
  **5849dae** (W5): 45/45 · **56cab43** (W6): 45/45.
- **ecd050d** (Premium+ W7): **39/45** — E02–E07 fail, failure
  payloads byte-identical to HEAD's.
- **32e54f0** (Premium+ W8 complete): 39/45 · **445a195** (Orange
  complete): 39/45 · **b80a515** (J6, HEAD before this fix):
  39/45.

**Guilty commit: ecd050d — Premium+ W7 "Dressing & Composition"
(TX-6).** It is in Premium+, not the arc chain: the Foundation's
sysLoadMap gates and Orange's shared-center reuse are both
exonerated (47/47 + 38/38 + 42/42 were green before and after,
and the arc chain postdates the break).

### 3. Mechanism

Pre-W7, `onStep` executed a stepped warp **synchronously**: it
set `centerReturn` from the door's `via`, persisted
`story.lastCenter`, and called `loadMap` in the same tick — the
P1 design ("loadMap never touches the ticket; the warp via owns
it; one `centerExit()` resolver serves the exit warp, both
blackout paths, and the Escape Rope").

TX-6 split that body in two: `onStep` now only resolves `to` and
calls `startWarpFade(to, wp)`, which **queues** `warpFx`; the
actual warp — ticket capture included — moved into `doWarp()`,
executed by `updateWarpFx` at the fade midpoint (~110ms later,
only when the scene ticks). Two consequences:

1. **The ticket did not exist at step time.** During the fade
   window `centerReturn` was unset/stale and `story.lastCenter`
   not yet persisted, so any consumer reading the landing
   synchronously after the step (the P1 driver; in principle a
   save/blackout interleave in the window) resolved the exit
   through the Pallet/fallback path and observed the pre-warp
   map/tile — the E02–E07 payloads exactly (`center` (4,5),
   town (4,5)).
2. **A queued warp survived direct loads.** `loadMap` never
   cleared `warpFx`, so a warp queued just before a direct
   `loadMap` (the blackout paths load `center` directly) fired
   late, into whatever map the direct load had installed.

Proof the resolver itself never broke: at unmodified HEAD, the
Part E scenario run under **Reduced Motion** (W7's own
instant-warp path — `startWarpFade` calls `doWarp` immediately)
produces every expected landing synchronously: Pallet (7,9),
Viridian anchor persisted (7,6) + voluntary and blackout exits
(7,6), Fuchsia/Cinnabar (7,8), reload-in-Center exit Cinnabar
(7,8). `centerExit()`, the via values, and the persisted anchor
were correct at every commit; only the timing moved.

### 4. The fix (HEAD, minimal — TX-6 itself untouched)

`src/game/overworld.mjs`, three changes:

1. **`startWarpFade` captures the via ticket synchronously at
   step time** (Center: `centerReturn` + persisted
   `story.lastCenter`; Mart: `martReturn`), before the fade is
   queued — restoring the P1 invariant that the anchor exists
   from the moment the door is stepped on. `doWarp` keeps an
   idempotent re-assert, so the Reduced-Motion path is
   byte-identical in effect.
2. **`loadMap` supersedes a queued warp**: a pending `warpFx`
   is cancelled (and the renderer fade reset) when a direct
   load lands — except the fade's own firing load (`fx.firing`,
   set around `doWarp` in `updateWarpFx`), whose fade-in phase
   still owns the transition. A stale warp can no longer fire
   into the wrong map.
3. Nothing else: the fade timings, door beat, and 100%-of-warps
   coverage are exactly as W7 shipped them; no arc, Orange, or
   Johto code was touched.

`tests/battle-model-checks.mjs`, one change: the Part E driver's
`stepOn` now **settles the warp transition** (`updateWarpFx`
polled until `warpFx` clears, bounded) before the landing is
read — the same hold-to-poll conversion W7 itself applied to
verify-slice (139/139, "assertion-identical"). Every E
assertion is unchanged, character for character.

### 5. Why it escaped three missions — stated plainly

This regression survived the Premium+, Foundation/Orange, and
Johto missions because **battle-model-checks was not in any of
their gate lists**. Premium+ W7's own register recorded
"battle-model 39/45 proven base-parity environmental by
byte-identical A/B" — true (the break predates that A/B's base)
but the suite was never run against its last green point,
85c249a, where it was 45/45. Each later mission inherited the
39/45 as a "standing baseline" (J6's register repeats the
phrase) instead of a regression to bisect. The J7 gate now
includes battle-model-checks; a inherited failure count is a
bisect trigger, not a baseline.

### 6. Verification (all 2026-10-29, this tree)

- **battle-model-checks 45/45** (E02–E07 green again).
- Full battery: fidelity **35/35** · validator **78/78** ·
  save-contract **10/10** · cheat-shop **44/44** ·
  arc-foundation **47/47** · orange-story **38/38** ·
  orange-climax **42/42** · johto-story **110/110** ·
  johto-systems **62/62** · campaign-smoke **24/24** ·
  qa-changed-flows failures exactly the standing **{b2, d9}**.
  Orange's shared-center via{} exits, Johto's shared centers,
  the arc machine's loadMap gates, and the Escape Rope path
  (centerExit consumers) are all covered by those suites and
  stay green.
- Fresh build (vercel + guest) OK — `public/game.js`
  **7,142,527 bytes**. **personal/ byte-identical** (md5
  verified against the pre-work snapshot; untouched —
  vercel+guest targets only). NOT pushed, NOT deployed.

## Arc 2 Stage J7a — CAMPAIGN GATE: the continuous chain drive through Johto + the complete battery (2026-10-29)

### 1. What this stage is

Proof only — no game code changed. The Foundation mission's closing
proof (the independent chain drive,
`~/workspace/ashs-journey-qa/arc-chain-qa/chain-drive.mjs`, 48/48
through Orange) is extended through Arc 2 on **one continuous save**,
and the **complete battery** is run without exception. Base:
`main @ 6f4d26d` (J6.5). NOT pushed, NOT deployed.

### 2. The chain drive: 88/88 on one save

48 existing checks (C01–C40 + D01–D08) + 40 new Johto checks
(J01–J40), all green, exit 0. The save runs: Kanto complete → card →
directive → Homecoming #1 → Orange (4 Crew badges → Drake → Lugia
arc → completion) → Homecoming #2 → Pallet dock embark (CAPT JOHTO)
→ New Bark arrival (Elm) → the full Johto spine in order: Sprout
Tower → Falkner (1) → Slowpoke Well + Kurt + GS Ball delivered →
Bugsy (2) → Whitney (3) → Burned Tower awakening → Morty (4) →
Silver in Ilex → medicine errand → Chuck (5) → delivery → Jasmine
(6) → Red Gyarados (caught) → Rocket Hideout (cleared on the
`rocket-hideout` map) → Pryce (7) → Radio Tower takeover (locked
floor → Director rescue → Card Key → fake Director) → Clair (badge
count still 7 after the gym) → Dragon's Den test → Rising (8) →
route-silver gate → Silver Conference (registration, both
qualifiers) → **Gary victory** → Harrison faced (honest branch:
lost, honours stand) → `johto_complete` → ARC COMPLETE card →
Hoenn directive → Homecoming #3 (hook delivered, Arc 3 sealed, no
dangling state). Still on the same save, the systems + arcs proofs:
the Day-Care gift egg received (Smoochum) and **hatched at Lv101**
on the real step hook; a Red Apricorn picked at the Azalea tree →
Kurt order → 250 steps → Level Ball collected and **used in a real
catch attempt** (thrown through the battle bag menu, bag count
drops); the **Raikou arc completed** (signs proven order-locked —
the second witness files nothing before the first — then the Lv178
face caught at National Park); the **Celebi arc completed** (Kurt
returns the GS Ball, whereabouts chain exact; the Lv170 shrine
catch; the empty GS Ball stays in the bag).

**End-state assertions (J40 + D08, on the final snapshot):**
`regionsDone = [kanto, orange, johto]` exactly; `badges.johto` =
the 8 badges in earn order; dex caught includes Raikou (243) and
Celebi (251); the final save validates through **both** the server
validator (`api/_lib/validator.mjs`) and the client schema
(D08, whose snapshot now sits at the true end of the drive).

### 3. Two drive changes, both named

1. **C28 superseded (J4a registry flip).** At `6f4d26d` the
   unmodified drive stood at **47/48**: C28 — written at Foundation,
   when Johto was sealed — asserted Homecoming #2 leaves
   `arc = orange` with no embark. Since J4a shipped the arc, the
   same homecoming advances `arc = johto` and arms `embark_johto`
   (johto-story **B01** proves the identical flow on the true
   path). C28 now asserts the shipped behaviour, keeping its
   subject (hook delivered in dialogue: GS Ball / Kurt / Azalea;
   directive cleared). This is the stage suites' own supersession
   practice (cf. johto-story A15/A18), recorded here, not a
   weakening: every other C/D check is byte-untouched.
2. **J05 driver idiom.** The Sprout monks are trainer NPCs; the
   chain's legacy `talk()` only narrates when `sysNpc` declines,
   so the monks never battled. The extension drives them with
   johto-story's own `talk()` idiom (the `startTrainerBattle`
   fallback). No assertion changed; the gauntlet, the Elder, and
   `sprout_tower_done` are all proven on the real trainer path.

### 4. The complete battery (this tree, 2026-10-29)

| Suite | Result | Note |
|---|---|---|
| chain-drive (J7a) | **88/88** | §2 above |
| arc-foundation-checks | 47/47 | |
| battle-model-checks | **45/45** | the J6.5 gate holds |
| campaign-smoke | **24/24** | |
| cheat-shop-checks | 44/44 | |
| fidelity-checks | 35/35 | |
| johto-story-checks | 110/110 | |
| johto-systems-checks | 62/62 | |
| orange-story-checks | 38/38 | |
| orange-climax-checks | 42/42 | |
| qa-changed-flows | 55/57 | failures exactly the standing **{b2, d9}** |
| verify-slice | 48/48 | |
| qa-slice | 132/134 | failures {s6, l8} — §5.1 |
| rejuv-phase1-checks | 44/44 | |
| rejuv-phase2-checks | 38/40 | failures {A09, C01} — §5.2 |
| rejuv-phase3-checks | 60/61 | = named baseline (C01 chromium-start, environmental) |
| rejuv-phase4-checks | 50/51 | C01 chromium-start; identical at 445a195 |
| rejuv-phase5-checks | 52/53 | C01 chromium-start; identical at 445a195 |
| rejuv-phase6-checks | 44/45 | = named baseline (C01 chromium-start, environmental) |
| audit-headless | 17/17 | |
| audit-laptop | 0 checks run | chromium did not start — §5.3 |
| validator.test | 78/78 | |
| validator.fuzz.test | 2000/2000 | |
| save-contract.test | 10/10 | |
| config.test / failclosed.test / http-ip.test | 39/39 · 20/20 · 13/13 | beyond the named list; run anyway |
| gen-tables --check | clean | tables.json OK (257 species, 144 moves, 160 items) |
| Track B (`run.mjs`) | 114/114 | |

### 5. Discrepancies — investigated to named causes

**5.1 qa-slice {s6, l8} — standing, predates Johto.** A/B in a
worktree at base `445a195` (the Foundation close): qa-slice is
**132/134 there too, with the identical two failures,
name-for-name** (`s6 fuzz: badges.kanto not array — ok=true`;
`l8 dex tracks 1025, Kanto roster complete`). The W8 register
recorded 134/134, so the pair broke during the Foundation/Orange
arc-chain work and was inherited by every Johto stage (qa-slice
was in no Johto gate list — the same inheritance pattern J6.5 §5
named for battle-model). Not a Johto regression; flagged here as
an open standing item for a future bisect, not silently absorbed.

**5.2 rejuv-phase2 A09 — standing, same inheritance.** A09 asserts
every merged Kanto map is assigned in MAP_GROUND; its premise is
that MAP_GROUND holds Kanto maps only. It fails at `445a195` too
(assigned 76 then, 101 now — Orange, then Johto ground assignments
landed in the same table; johto-story A10/A28 prove the Johto
assignments deliberate, drawn from the existing 15 grounds). The
failure set {A09, C01} is identical at both bases; only the
assigned count grew, by design.

**5.3 The chromium cluster — environmental, base-identical.**
rejuv phases 2–6 each lose exactly their C01 to
`chromium did not start`, and audit-laptop dies at the same line
before any check executes — at `445a195` identically
(name-for-name, verified by worktree A/B for phases 2/4/5 and
audit-laptop). Phase 3 (60/61) and phase 6 (44/45) match their
proven baselines exactly. No Johto signal in this cluster; the
sandbox cannot start chromium, at either base.

**5.4 verify-slice rebuilds personal/ — restored, and flagged.**
`scripts/verify-slice.mjs` (line 327) runs `scripts/build.mjs`
with no `--target`, i.e. it rebuilds **all** targets including
personal. Its run in this battery therefore rewrote `personal/`
from current source (game.js sha256 `7df821fc…`). Every stage
since Foundation built vercel+guest only, so the committed
personal bundle is the Foundation-era build of that target —
a from-source personal build at HEAD no longer reproduces it.
`personal/` was restored byte-identical from HEAD immediately
after the battery (game.js sha256 **f434ba63…** re-verified; the
tree is clean). No game code is at fault; whether the personal
edition gets a deliberate rebuild is an owner call, recorded
here rather than taken.

### 6. Build + close state

- Fresh build (vercel, then guest): `public/game.js`
  **7,171,109 bytes**, sha256 `fb35470d…` — **byte-stable across
  two consecutive builds**, and identical to the bundle committed
  at `6f4d26d`. Guest standalone: 7,167,673 bytes, zero-network
  gate PASS.
- `personal/` byte-identical (sha256 f434ba63…, §5.4).
- Changes in this stage: the chain drive (QA workspace, not a git
  tree — as at Foundation) + this register section. No game-code
  changes. NOT pushed, NOT deployed.

**Arc 2 Johto is campaign-proven: one save, Kanto → Orange →
Johto → home, every badge in order, Gary beaten, both J5/J6
systems arcs closed on the same file, and the full battery at its
named counts.**

## Arc 2 Stage J7b — INDEPENDENT QA: the verdict on Arc 2 Johto (2026-10-29)

**VERDICT: SHIP-WITH-NOTES.** No blockers found. Every mission claim was
re-driven independently by an agent that implemented nothing in this
project: fresh QA drivers (QA workspace `j7b-qa/`), my own battery re-runs,
and my own re-run of the J7a chain drive. `personal/` byte-identical at
start and end (game.js sha256 `f434ba63…`); the tree was clean throughout;
nothing pushed or deployed.

### 1. The first Johto hour, by real inputs (`j7b-drive.mjs` A00–A11, 12/12)

From a post-Orange-complete state (B01's fixture shape, in-band Lv140
team): Homecoming #2 fires in dialogue (GS Ball / Kurt / Azalea named),
arc advances, embark arms → CAPT JOHTO sails Pallet → New Bark → Elm
arrival scene (stolen Totodile) → Cherrygrove loads clean → Route 30
Silver clash (honest win flag) → report names SILVER → Sprout Tower
(both monks on the real trainer path, Elder's blessing) → Falkner beaten
through the real leader runner → Zephyr Badge first in `badges.johto`.
Quest-log guidance checked at three points against the log's own JOHTO
section (`j7b-drive2.mjs` AS1–AS4): after Homecoming #2 the active row is
"▶ Meet Professor Elm in New Bark Town" (hint: "the first building past
the dock"); after arrival, "▶ Watch for the red-haired thief — and report
back to Elm" (hint: heading north toward Cherrygrove); after the report,
"▶ Climb Sprout Tower and earn the Elder's blessing" (hint names Falkner
expecting tower climbers). At no point in the hour is the player without
a named next step.

### 2. The band law (`j7b-validator.mjs` 7/7 + drive2 B01–B02)

My own constructed saves, both validators: a `story.arc='johto'` save
carrying a Lv150 mon and a Lv200 mon at slowest-curve max XP is ACCEPTED
by the server validator and the client schema, and survives a JSON
round-trip; the SAME mons in a `story.arc='kanto'` save are rejected
`bad-mon-level` by both; a Lv250 mon in the Johto save is rejected
`bad-mon-level` by both. Live play: the Cheat Terminal's level stepper
caps at **Level 100** in a Kanto-context session and **Level 200** in a
Johto-context session (menu label read after 30 pagedown presses each).

### 3. Center exits (drive2 C01–C03)

Voluntary exit + blackout exit driven in one town per region, landings
read against each door's own `via`: Viridian (Kanto) → (viridian, 7, 6);
Valencia (Orange) → (valencia, 12, 4); Violet (Johto) → (violet, 4, 4).
All six exits land on the correct door-fronts with `story.lastCenter`
persisted to match; none lands on the (4,5) fallback. The J6.5 fix holds
in all three regions, Orange and Johto included.

### 4. Systems in live play (drive2 D01–D06)

Day-Care gift egg received through the keeper path (Togepi), hatched
through the real step hook (`sysOnStep`) at **Lv101** with dex
registered. Red Apricorn picked at the Azalea tree (tree rests +200
steps) → Kurt order (Level Ball, readyAt = steps + 250, apricorn
consumed) → collected after 250 steps → thrown in a real wild battle
through the bag menu: lead Lv160 vs foe Lv30, the ball was **consumed**
(bag 1 → 0) and the catch resolved ("Gotcha! Pidgey was caught!"). The
rule evaluated is the Level Ball's: `ballBonusFor('levelball', lead 160 /
foe 30) = ×8` (the ≥4× tier), read from the same `ball-rules` module both
battle engines import; the systems battery's rule-rate cases (re-run,
§7) pin the rates in both engines.

### 5. Legendary arcs by play (drive2 E01–E06)

Suicune, the gated one: Raikou caught for real (signs in order → National
Park face → catch, dex 243). With Entei still uncaught, Suicune's signs
filed (Ecruteak + Cianwood) and the Bell Tower foot visited — **no face,
arc not complete**. Entei then caught for real (Burned Tower / Mt. Mortar
signs → deep-chamber face → catch, dex 244). Suicune's face now fires at
the Bell Tower foot (Lv184); the catch completes the arc (dex 245).
Celebi: Kurt returns the GS Ball (whereabouts chain exact), shrine
encounter at Ilex (Lv170) — **fleeing completes nothing** (done flag
unset, quest not complete) — the shrine **re-fires** on the next
interact and the catch completes the arc (dex 251, empty GS Ball stays
in the bag).

### 6. Blind town-identity test (`shots/towns-blind/`, contact sheet
`shots/town-contact-sheet.png`, key `town-key.json`)

All 11 settlements captured label-masked (location chip / objective /
dex chip / hint overlays hidden in-frame; every capture locchip-verified
before masking) from a town-centre spawn, graded on in-frame landmarks
and palettes. **Identification: 11/11**, with honest confidence spread —
strong: Goldenrod (paved plaza grid, vending machines), Cianwood (sand +
southern shoreline), Blackthorn (grey boulder rock), Azalea (apricorn
trees), Silvertown (pale league marble), Ecruteak (autumn palette);
medium: New Bark (flower meadows + lab roofline), Olivine (tidal-shallows
checkerboard + sailors), Violet (grey stone + pond).
**Confusable pair (note): Cherrygrove vs Mahogany** — both read as a
small green town with a south-west pond in the centre frame; they are the
one pair I could swap. **Framing note:** at a town-centre spawn the
signature landmarks the J3 gate named — Olivine's lighthouse, Ecruteak's
towers, Blackthorn's den cliff, Silvertown's stadium — are outside the
frame; identity there rests on the ground palette, which is distinct in
every case. (Operator caveat: I ran the capture, so town order was not
unknown to me; the grades above are the in-frame evidence, and the
Cherrygrove/Mahogany call is recorded as low-confidence, not dressed up.)

### 7. Independent battery re-runs (my runs, this tree)

| Suite | My result | Stage report |
|---|---|---|
| battle-model-checks | **45/45** | 45/45 |
| johto-story-checks | **110/110** | 110/110 |
| johto-systems-checks | **62/62** | 62/62 |
| campaign-smoke | **24/24** | 24/24 |
| qa-changed-flows | failures exactly **{b2, d9}** | {b2, d9} |
| arc-chain chain-drive (J7a drive, re-run by me) | **88/88** | 88/88 |

Logs in `j7b-qa/logs/`. Counts match the stage reports exactly.

### Findings

- **Blockers: none.**
- **Note 1 — Cherrygrove/Mahogany blind similarity** (§6): the one pair
  a player could not tell apart from a centre-frame view alone; both are
  small green towns with a pond to the south-west. Distinctiveness
  elsewhere is palette-strong.
- **Note 2 — signature landmarks sit off-centre** (§6): lighthouse,
  towers, den cliff and stadium are not visible from the town-centre
  spawn frame. A player arriving at the town edge sees them on the walk
  in; the centre frame alone leans on palette. Polish-grade, recorded
  because the J3 gate graded on landmarks.
- **Note 3 — quest log section order:** the Kanto MAIN STORY section
  always renders above the JOHTO section, so the active Johto row is
  found by scrolling past the Kanto list. The guidance itself is correct
  at every point checked (§1); this is findability, not absence.
- **Harness note (not a game finding):** the CDP browser boot for §6 was
  flaky across three driver iterations — CDP key timing on the title
  menu (a Down press landing before the menu opens selects New Game)
  and, in my second pass, a pixel-probe threshold that never fired and
  a row-click fraction that hit New Game (0.536) instead of Continue
  (0.630 of the 384×216 view, from `title.mjs` row geometry). The game
  itself is proven working by the headless drives (§1–§5) and by the
  eventual locchip-verified capture of all 11 towns; the flakiness is
  in my QA harness, and the working sequence is recorded in
  `j7b-qa/town-shots2.mjs` for the next QA stage.

**Arc 2 Johto stands as shipped: the first hour guides, the band law
holds on both validators and in the live terminal, Center exits land
right in all three regions, the systems fire in real play, the gated
legendary refuses before its gate and completes after it, and fleeing a
shrine costs nothing. SHIP-WITH-NOTES, the notes being §6's pair and
framing and §7's log order — none of them a player's blocker.**

## Arc 3 Stage H1 — Species data: +135 → National dex 386 (2026-10-29)

Implementer pass on main @ eaac542 (Foundation + Orange + Johto shipped).
Data only — no maps, story, or sprites (H2 owns the 138 new species' art;
until then the new entries render through the shipped forge fallback from
spriteSeed, exactly as Johto's did between J1 and J2). Nothing pushed,
nothing deployed. `personal/` byte-identical (the build regenerates the
personal bundle from source; it was restored from HEAD after the build,
per the frozen-retired-edition precedent — `git status` shows no
personal/ paths in this stage's diff).

### 1. What landed

- **ETL (reproducible, not hand-typed):**
  `~/workspace/ashs-journey-qa/arc3-etl/fetch-hoenn.mjs` stages the
  PokeAPI facts cache (`arc3-etl/raw/`: pokemon/species 252–386, 75
  evolution chains, pokemon 10001–10003 for the Deoxys formes — facts
  only, no sprites or art ever fetched); `etl-hoenn.mjs` mirrors the
  Johto machinery and EMITS `src/data/species4.mjs`
  (`export const SPECIES_HOENN`, **138 entries**). Per-species audit
  trail (learnset source, dropped moves, top-ups/fills, TM analogue,
  evolution mapping, growth raw→assigned) in `arc3-etl/etl-notes.json`.
  Registered in `scripts/module-order.json` after species3.mjs; folded
  in `src/data/merge.mjs` (`Object.assign(SPECIES, SPECIES_HOENN)`);
  `tools/api-scripts/gen-tables.mjs` folds it the same way and the
  validator tables were regenerated ONLY through it (tablesVersion
  44eb8c22… → **0525370a…**, 395 species / 144 moves / 160 items).
- **Accounting:** species entries **257 → 395** = 386 National dex +
  partner + 5 shipped forms + **3 Deoxys form entries** (§5). No Hoenn
  species duplicated a shipped entry (the Johto guests problem does not
  recur in this band). **Diploma accounting untouched:** the Kanto-151
  diploma still counts exactly the dexNo 1–151 non-form species and the
  National-493 keying stands (cheat-shop A13/B-diploma proofs green);
  `DEX_TOTAL` stays **1025**; the **386 horizon** is read from the
  Foundation registry's Hoenn row, as designed — no registry edit in
  this stage (the `sealed` → `shipped` flip is H4's, ruling 1).
- **Field mapping** follows the shipped schema exactly: PokeAPI
  stats/types (current typings), capture_rate, base_experience,
  spriteSeed dexNo*100+1, body from PokeAPI `shape` with recorded
  overrides (shedinja/ninjask/masquerain→bird, metagross/tropius/
  walrein line→quad, the three Regis + deoxys→biped, milotic/huntail/
  gorebyss→serpent, baltoy/claydol line/castform/glalie→blob, … — full
  list in the ETL's BODY_OVERRIDE). Every entry carries `eggGroups` +
  `hatchCounter` (+ `baby: true` for azurill/wynaut) for the shipped
  breeding system, and an ORIGINAL one-line flavor (hand-authored in
  the ETL's FLAVOR table).
- **TM lists:** copied from the closest shipped analogue (now incl.
  the Johto roster) by type overlap then BST distance; analogue per
  species recorded in the ETL notes; all ids resolve (fidelity-verified).
- **Support tables:** `battler-tiers.mjs` + `idle-classes.mjs` gain
  **138 rows each (395 total in both)** by the shipped rules — tiers by
  bulk (HP+DEF+SPD: S <160, M 160–244, L ≥245); idle by body plan
  (bird→hover, fish/serpent→serpentine, blob→inert, else grounded) with
  hand overrides for floaters/levitators (castform, lunatone, solrock,
  chimecho, shedinja, beldum, metang, claydol, shuppet, duskull,
  jirachi, latias, latios, the four Deoxys entries, tropius, salamence,
  flygon → hover; regice → inert). Row generation script:
  `arc3-etl/gen-tiers-idle.mjs`.

### 2. Growth curves (J0 law, discharged with substitutions)

The ETL asserts no entry is ever ASSIGNED 'erratic' or 'fluctuating'.
Hoenn is the first band where canon actually uses them — PokeAPI's
current names are 'slow-then-very-fast' (erratic) and
'fast-then-very-slow' (fluctuating) — so, the Johto throw-rule being
unusable here, they are mapped to the **nearest supported curve by
canon level-100 total** and every substitution is recorded in the ETL
notes: **erratic (600,000) → 'fast' (800,000)** for 16 species
(nincada/ninjask/shedinja, volbeat, swablu/altaria, zangoose,
lileep/cradily, anorith/armaldo, feebas/milotic, clamperl/huntail/
gorebyss) and **fluctuating (1,640,000) → 'slow' (1,250,000)** for 12
(shroomish/breloom, makuhita/hariyama, illumise, gulpin/swalot,
wailmer/wailord, seviper, corphish/crawdaunt). All other raw curves
map directly (medium-slow 32 · 'medium'→mediumfast 29 · slow 31 ·
fast 15, before substitutions). The literal curve names
'erratic'/'fluctuating' appear in NO entry.

### 3. Learnsets (ruling 3)

- Source: PokeAPI `moves`, version_group **emerald preferred**,
  ruby-sapphire fallback, level-up only, restricted to the game's
  existing move table (moves.mjs + moves2.mjs — no new moves).
  **134 of 135 species took a surviving emerald set**; the one
  fallback is deoxys (normal) — PokeAPI carries no emerald level-up
  set for the normal forme, so its ruby-sapphire set ships.
- **Levels:** canonical level-1 moves stay at key **1**; every
  canonical level ≥2 shifts **+200** (band-local, Amendment 2). Every
  entry's learnset keys are 1 or inside 202–300 (machine-checked).
- **Dropped: 716 (species, move) pairs, 158 distinct canonical moves**
  with no game counterpart (full list in etl-notes.json — aerial-ace,
  ancient-power, crunch, dragon-claw, …).
- **Fills (<4 distinct surviving moves): 48 moves across 27 entries**
  (25 species + the Deoxys attack/defense formes), placed at level 1,
  type-staples first, then type-matching canon TM/HM moves, then
  Normal staples: wurmple +leechlife · silcoon/cascoon +leechlife,
  pinmissile, twineedle · lombre +watergun · ludicolo +watergun,
  bubblebeam · shiftry +absorb · slakoth/slaking/delcatty +tackle ·
  mawile +tackle, slash, quickattack · illumise +leechlife, pinmissile
  · feebas +watergun, bubblebeam · castform +quickattack · shuppet/
  banette +lick, confuseray · wynaut +confusion, psybeam · clamperl
  +bubblebeam, surf · huntail +watergun · beldum +tackle, slash,
  quickattack (canon: takedown alone) · regirock +rockslide · regice
  +aurorabeam · registeel +tackle · latias/latios/rayquaza
  +dragonrage · deoxysattack/deoxysdefense +confusion, psybeam,
  psychic, teleport (the shared in-table Psychic pool of ruling 2).

### 4. Evolutions — mappings and the hard cases (ruling 3, resolved)

Engine vocabulary only: level / stone / trade, branching via `evos`
with the primary branch duplicated in the singular `evo` slot (the
shipped poliwhirl/slowpoke dual representation).

- **Band-local level evos (canon +200), chain-derived:** all Hoenn
  lines (starters 216/236, poochyena 218, zigzagoon 220, lotad 214,
  seedot 214, taillow 222, wingull 225, ralts 220, kirlia 230,
  surskit 222, shroomish 223, slakoth 218, vigoroth 236, whismur 220,
  loudred 240, makuhita 224, aron 232, lairon 242, meditite 237,
  electrike 226, gulpin 226, carvanha 230, wailmer 240, numel 233,
  spoink 232, trapinch 235, vibrava 245, cacnea 232, swablu 235,
  barboach 230, corphish 230, baltoy 236, lileep 240, anorith 240,
  shuppet 237, duskull 237, wynaut 215, snorunt 242, spheal 232,
  sealeo 244, bagon 230, shelgon 250, beldum 220, metang 245,
  silcoon/cascoon 210).
- **Stones (chain-derived use-item):** lombre→ludicolo waterstone,
  nuzleaf→shiftry leafstone, skitty→delcatty moonstone.
- **Happiness → level 210:** azurill→marill (band analogue of the
  Johto babies' 110 = band floor +9).
- **Feebas → Milotic = level 220** (ruling 3: no beauty stat exists;
  both entries' flavor lines note it honestly — "beauty, in this
  region, is patience").
- **Wurmple branch:** the engine cannot pick a branch per individual
  at level-up — the level trigger reads only the singular `evo` slot
  (battle.mjs / main-systems.mjs), `evolveMon` has no branch pick, and
  the mon record carries no individual seed (spriteSeed is
  per-species, so a "spriteSeed-parity pick" would be a constant, not
  a per-individual pick). Lightest supported route, on the tyrogue
  precedent: singular `evo` = **silcoon at 207** (canon 7 +200); both
  branches are recorded in `evos[]` for the record. **H3 owns the
  cascoon line's obtainability** (wild placement of cascoon/dustox —
  the silcoon line evolves in-data: silcoon→beautifly 210,
  cascoon→dustox 210).
- **Clamperl → Huntail/Gorebyss:** `items.mjs` was checked — **no
  deepseatooth / deepseascale exists** in the shipped item list, so
  the held-item trade cannot be expressed. Fallback per ruling 3 =
  item-use evolutions on shipped stones, dual representation:
  `evo` huntail via **waterstone** (the shipped water item-use; the
  tooth is a water fang), `evos` adds gorebyss via **moonstone** (the
  shipped stone of the pink/grace lines — skitty/jigglypuff
  precedent). Recorded as an adaptation, not a claim of canon.
- **Nincada → Ninjask = level 220; Shedinja spawn-on-evolve NOT
  shipped.** `evolveMon` is shared by battle level-ups, stone use and
  Link Transfer with no party-slot/ball bookkeeping, and a spawned
  mon would need save-contract coverage this data stage should not
  improvise. Per ruling 3's either/or, **Shedinja's DATA entry ships
  here and H3 MUST place it as a rare wild encounter on a fitting map**
  (its flavor line carries the same note in-game). Never neither.
- **Post-386 evolutions emit NO evo** (out of scope, recorded in the
  ETL notes): linoone→obstagoon, kirlia→gallade, nosepass→probopass,
  roselia→roserade, dusclops→dusknoir, snorunt→froslass.

### 5. Deoxys formes + Castform (ruling 2)

- **Deoxys (Normal)** is species dex 386 in the main loop. **Attack /
  Defense / Speed** ship as partner-pattern FORM entries in
  species4.mjs — `deoxysattack` / `deoxysdefense` / `deoxysspeed`:
  own speciesId, **shared dexNo 386**, `form: true` +
  `baseSpecies: 'deoxys'`, canon per-forme stats from their own
  PokeAPI pokemon records (10001/10002/10003; all BST 600, redistributed
  per forme), band-local learnsets from their own Gen-3 sets (attack/
  defense filtered below 4 and filled from the shared Psychic pool,
  §3), spriteSeeds 38602/38603/38604 on the shipped form-seed pattern.
  They are excluded from diploma counts by the same form mechanism as
  the 5 shipped forms (fidelity's dex-uniqueness assertion skips form
  entries by design).
- **Reconciliation with forms.mjs:** the FORMS catalogue already
  carried `deoxys-attack` / `deoxys-defense` / `deoxys-speed` rows
  (speciesId 386) and the Hoenn mega/primal rows (mega-sceptile …
  primal-kyogre) — catalogue data only, like the other non-playable
  form rows. **No FORMS rows were added or duplicated** (forms count
  stays 202; cheat-shop A02 pins it). The new species entries are the
  playable counterparts, on the crystalonix precedent (catalogue row
  + form species entry sharing the dex number). The H6 meteorite
  forme-switch consumes these entries; nothing in H1 wires the switch.
- **Castform ships as ONE entry, no weather formes** (ruling 2); its
  flavor line notes the gimmick honestly. The pre-existing
  castform-sunny/rainy/snowy FORMS catalogue rows stay catalogue-only.

### 6. Band machinery re-verified at cap 300 (no engine fix needed)

- **Validator pair:** 11 new pins in `tools/api-scripts/validator.test.mjs`
  (§10, H1): a Lv300 mon validates in a hoenn-arc save (party + box,
  server + client); **Lv300 in a johto-arc save fails bad-mon-level**;
  Lv301 in a Hoenn save fails (cap boundary); a max-XP Lv300 mon on the
  slowest curve ('slow' at 300) does **not** trip bad-xp; a mon at
  exactly the Hoenn XP ceiling validates and one XP over fails bad-xp
  — both sides of the pair. All pass (89 total, §7). No validator code
  changed: gen-tables already emitted the hoenn band row
  (`arcBandMax.hoenn = 300`) from the registry.
- **Cheat Terminal stepper:** CONFIRMED registry-driven, no fix
  required — the level stepper's onKey caps at `levelCapFor(g.state)`
  (src/game/overworld-systems.mjs, the ADR-027 Amendment 2 read), so
  under `story.arc = 'hoenn'` it caps at **300** by the same read
  arc-foundation A08 pins (levelCapFor: fresh 100, johto 200,
  hoenn 300).

### 7. Gate (this tree)

| Suite | Result |
|---|---|
| fidelity-checks | **35/35** (roster assertion 257 → **395**, supersession recorded in the assertion text) |
| validator.test | **89 passed, 0 failed** (78 + 11 new H1 pins) |
| validator.fuzz | **2000/2000** clean shapes |
| save-contract.test | **10 passed, 0 failed** |
| cheat-shop-checks | **44/44** (A02 species count 257 → **395**, supersession recorded in the assertion text; items 160 / keepsakes 12 / forms 202 unchanged) |
| arc-foundation-checks | **47/47** |
| battle-model-checks | **45/45** (hard gate holds) |
| campaign-smoke | **24/24** |
| johto-story-checks | **110/110** |
| johto-systems-checks | **62/62** |
| qa-changed-flows | failures exactly **{b2, d9}** |
| qa-slice (verify-slice) | failures exactly **{s6, l8}** — named inheritance, not grown |
| rejuv-phase2-checks | failures exactly **{A09, C01}** — named inheritance, not grown |
| budgets-check | all gates pass — vercel static **7,352,905 B ≤ 12,582,912** |

**Bundle:** public/game.js rebuilt at **7,261,345 B** (J7 close:
7,171,109 B; +90,236 B for 138 species + support rows). No other
count assertions moved; Track B was not re-run (no api/auth/save-shape
change beyond the regenerated tables the validator suite pins).

### 8. Leftovers handed forward (named, not hidden)

- **H2:** authored art for all 138 entries (forge fallback until then).
- **H3:** shedinja rare-wild placement (§4) and cascoon/dustox wild
  obtainability (§4) are H3 obligations created by this stage's
  rulings; both are recorded in `arc3-etl/etl-notes.json` as well.
- **H6:** the Deoxys meteorite forme-switch consumes §5's entries.

## Arc 3 Stage H0 — Region-pack decision: STAY MONOLITH through Platinum (2026-10-29, ratified by coordinator)

- **Decision (binding on H2):** the monolith stands through the Platinum
  horizon. Hoenn art authors into `assets/sprites/art-data.mjs` exactly as
  Johto's did. Per-region art packs become a MANDATORY stage at Arc 5
  (Unova) — not an option — with two early re-open triggers below.
  Full evidence: `~/workspace/ashs-journey-qa/arc3-pack-decision.md`;
  measurement scratch in `~/workspace/ashs-journey-qa/arc3-h0/`.
- **Measured actuals (tree-verified, checksums reconcile):** current
  vercel static 7,262,669 B vs gate 12,582,912 B (one number applied to
  the guest/vercel/personal static measurements in budgets.json).
  Johto's true all-in cost 1,839,713 B (+94 species, +83 maps, story,
  systems, tiles). Real unit costs: species all-in 15,153 B (art 14,483
  incl. a full front-bob copy + data 603 + support rows 67 — the
  roadmap's pair-only estimate undercounted ~1.5x and is superseded by
  these actuals); map 3,167 B (Johto rate); story ~90,115 B/arc.
- **Projections:** Hoenn close ~9,872,965 B static (headroom 2,709,947 B,
  21.5%); Sinnoh close (incl. Frontier 3.5) ~12,086,695 B (margin
  496,217 B, 3.9%; worst-stack 237,819 B, 1.9%) — every target passes.
- **Why packs cannot help now:** there is NO PWA/service worker in this
  project — offline exists only as the zero-network guest standalone,
  which must inline all art regardless; on the vercel target packs
  would only move bytes outside budgets-check's game.js+index.html
  measurement, which is accounting evasion, not engineering. Monolith
  first-load wire cost stays honest: ~1.06 MB gzip today, ~1.43 MB at
  Hoenn close, ~1.75 MB at Sinnoh close (measured gzip ratio 14.16%).
- **Re-open triggers (either fires -> the pack stage runs BEFORE the
  next art stage):** (1) Hoenn-close static > 10,100,000 B;
  (2) Arc-4 re-measurement projecting the Sinnoh-close margin
  < 250,000 B.
- **Deferral note (post-Platinum honesty):** the 532 species beyond
  Platinum alone measure ~8,061,448 B at the real unit cost; Unova's
  species alone would breach the gate by ~1,867,666 B before any map
  byte. At Arc 5 the choice is packs or an ADR-007 amendment — recorded
  now so the deferral is a plan, not a surprise.
- **Incidental:** the in-tree `personal/game.js` is a stale pre-Johto
  build (frozen retired edition; its budget reading is meaningless
  until the parent rebuilds that target). Untouched by this mission,
  consistent with the J7 leftover of the same name.

## Arc 3 Stage H2a — Species art, FIRST half (dex 252–319) (2026-10-29)

### 1. What landed

- **68 species authored** (dex 252–319, treecko → sharpedo): treecko,
  grovyle, sceptile, torchic, combusken, blaziken, mudkip, marshtomp,
  swampert, poochyena, mightyena, zigzagoon, linoone, wurmple, silcoon,
  beautifly, cascoon, dustox, lotad, lombre, ludicolo, seedot, nuzleaf,
  shiftry, taillow, swellow, wingull, pelipper, ralts, kirlia,
  gardevoir, surskit, masquerain, shroomish, breloom, slakoth,
  vigoroth, slaking, nincada, ninjask, shedinja, whismur, loudred,
  exploud, makuhita, hariyama, azurill, nosepass, skitty, delcatty,
  sableye, mawile, aron, lairon, aggron, meditite, medicham,
  electrike, manectric, plusle, minun, volbeat, illumise, roselia,
  gulpin, swalot, carvanha, sharpedo.
- **136 full frames** (`<id>-front` + `<id>-back` .pix, 64×64, original
  pixel work in the Platinum language — NW-light shading, true rear
  views: no eyes, back-specific markings: sceptile's seed spheres,
  swampert's fan tail, mawile's great jaw dominating the rear,
  shedinja's hollow crack, exploud's rear pipes). Backs are NOT
  mirrors: front/back row data differs for all 68 (census-checked).
- **136 bob frames** reach the shipped set via the pipeline itself:
  front-bobs by build-art's marked derivation, back-bobs by the W2
  shift-delta mechanism — no hand files, exactly as Johto species.
- **18 accent deltas** for the 9 Hoenn starter-line species (treecko…
  swampert): front-accent = blink (recolor-only), back-accent =
  crest/fin twitch recolor, as .deltapix over the new bases — the J2a
  starter-accent mechanism, unchanged.
- Authoring workflow: generator script
  `~/workspace/ashs-journey-qa/arc3-etl/gen-h2a-art.mjs` composes
  per-species authored silhouettes/palettes/markings into .pix
  sources; the repo's own build-art validation is the gate (palette
  cap, outline, margins, orphans). 14 orphan pixels across 7 species
  (thin cheek-spike / ear / forked-tail tips) were fixed in the art,
  never in the validator; three visual fixes after contact-sheet
  review: silcoon's eye was painted under its own silk patch
  (reordered), blaziken's torso now carries its red body colour
  (cream is the chest/head hair only), surskit scaled up a step.

### 2. Pipeline change (on the record)

- **Art-data ceiling raised 5,500,000 → 7,100,000 B** in
  `assets/sprites/tools/build-art.mjs` (the only enforcement site).
  Forced by measured arithmetic under the ratified H0 monolith
  decision: H2a alone takes art-data to 5,904,995 B, already past the
  old cap, with zero validator errors. The new cap is sized to the
  H0 Hoenn-close projection (4,914,208 + 138 × 14,483 = 6,912,862 B,
  plus ~70 KB of H3 tile art) with no further headroom banked;
  `budgets.json`'s 12,582,912 B hard gate is unchanged and still
  governs the shipped bundles (all budgets pass, §4). Arc 4
  re-measures before Sinnoh art per the H0 re-open triggers.

### 3. Census (gate)

- Script: `~/workspace/ashs-journey-qa/arc3-etl/census-h2a.mjs`
  (on the census-j2a pattern).
- Every registry entry dex 1–319 (**325 entries** incl. partner +
  forms) has front+back keys in art-data.mjs: **missing 0, blanks
  0**. The 68 new species: front-bob + back-bob present for all
  (**missing 0**); starter accents present (**missing 0**); front ≠
  back for all 68. **Zero forge fallbacks for dex 252–319.**
- Per-sprite stats for the 136 new frames: painted pixels
  **616–1,391** (median 1,059; Johto J2a floor was 437), palette
  sizes **5–11** colours (median 8; cap 32) — at or above the Johto
  art's observed palette-depth range (J2a 5–11, J2b 4–11).
- **Contact sheets:** `~/workspace/ashs-journey-qa/arc3-etl/census-h2a-contact.png`
  (fronts, 1536×1854, 68 labelled at 3×) +
  `census-h2a-contact-backs.png` (backs, same format), visually
  inspected by the implementer: silhouettes nameable at sheet scale
  with the §5 exceptions flagged.

### 4. Battery at this commit

- build-art clean and **deterministic** (two runs → byte-identical
  art-data.mjs + species atlases). 3,085 sprites total, 324 derived
  bobs, 647 delta frames.
- fidelity-checks **35/35** · campaign-smoke **24/24** ·
  battle-model-checks **45/45** · qa-changed-flows failures exactly
  **{b2, d9}** · qa-slice failures exactly **{s6, l8}** ·
  rejuv-phase2 failures exactly **{A09, C01}** (named inheritances,
  not grown) · budgets-check **all gates pass** (vercel static
  **8,343,692 B ≤ 12,582,912**).
- Fresh build (vercel + guest targets): public/game.js
  **8,252,132 B** (H1 close: 7,261,345; **Δ +990,787 B = 14,570 B
  per species** vs the H0 measured art unit of 14,483 B/species —
  +0.6%, on projection; art-data 4,914,208 → 5,904,995 B, the same
  delta). H0 re-open trigger (1) is Hoenn-CLOSE static >
  10,100,000 B; H2a alone does not approach it and the Hoenn-close
  projection (~9.87 MB) is unchanged. **personal/ byte-identical**
  (sha256 f434ba63…, restored from HEAD after verify-slice's
  rebuild; built targets were vercel+guest only).

### 5. Leftovers, named

- **Hardest silhouettes at 64×64** (flagged for the owner's eye on
  the contact sheet): mawile (the rear jaw worn behind the head
  reads as a dark mass on the front view), lairon (armour plates
  flatten the side profile toward a table read; aron shares the
  family risk to a lesser degree), nincada (pale wing shells read
  fluffy against the cream body), wurmple (back spikes read as
  candles at sheet scale). All pass silhouette naming on the sheet;
  first candidates if a polish pass is ordered.
- **Silcoon/cascoon** are near-plain cocoons by canon design; the
  silk-strand + peeking-eye treatment is the honest read at this
  size.
- Accent deltas for non-starter Hoenn species are NOT in this
  stage's brief (Johto coverage is likewise starter/marquee-only);
  fronts/backs/bobs are complete for the range.
- **H2b (dex 320–386 + 3 Deoxys formes)** remains: ~70 more entries
  at this stage's measured unit cost ≈ +1.02 MB art, landing
  art-data ≈ 6.93 MB — inside the §2 ceiling as sized.

## Arc 3 Stage H2b — Species art, SECOND half (dex 320–386 + Deoxys formes) (2026-10-29)

### 1. What landed

- **70 entries authored** (dex 320–386, wailmer → deoxys-normal, plus
  the 3 Deoxys form entries `deoxysattack` / `deoxysdefense` /
  `deoxysspeed`, shared dexNo 386): wailmer, wailord, numel, camerupt,
  torkoal, spoink, grumpig, spinda, trapinch, vibrava, flygon, cacnea,
  cacturne, swablu, altaria, zangoose, seviper, lunatone, solrock,
  barboach, whiscash, corphish, crawdaunt, baltoy, claydol, lileep,
  cradily, anorith, armaldo, feebas, milotic, castform, kecleon,
  shuppet, banette, duskull, dusclops, tropius, chimecho, absol,
  wynaut, snorunt, glalie, spheal, sealeo, walrein, clamperl, huntail,
  gorebyss, relicanth, luvdisc, bagon, shelgon, salamence, beldum,
  metang, metagross, regirock, regice, registeel, latias, latios,
  kyogre, groudon, rayquaza, jirachi, deoxys + the 3 formes.
- **140 full frames** (`<id>-front` + `<id>-back` .pix, 64×64, original
  pixel work in the Platinum language — NW-light shading, true rear
  views: no eyes, back-specific markings: kyogre's red circuit lines,
  rayquaza's ring bands, walrein's mane back, duskull's skull cross,
  banette's rear zipper, metagross's back plates). Backs are NOT
  mirrors: front/back row data differs for all 70 (census-checked).
  Castform is the single base form only (coordinator ruling 2).
- **140 bob frames** reach the shipped set via the pipeline itself:
  front-bobs by build-art's marked derivation, back-bobs by the W2
  shift-delta mechanism — no hand files, exactly as H2a/Johto species.
- **26 accent deltas** for the 13 marquee legendary/mythical entries
  in range (regirock, regice, registeel, latias, latios, kyogre,
  groudon, rayquaza, jirachi, deoxys + 3 formes): front-accent = blink
  (recolor-only; the Regis blink their dot-matrix eyes via the same
  mechanism on their eye colour), back-accent = crest/fin twitch
  recolor, as .deltapix over the new bases. Pattern call, recorded:
  J2b gave accents to ITS marquee legendaries (raikou/entei/suicune/
  celebi); hooh/lugia ship without because they predate that pattern
  (shipped earlier as guests). H2b follows the later J2b marquee
  pattern rather than the hooh/lugia exception.
- **Deoxys formes — one design language, four readable silhouettes**
  (shared rust-red/violet/teal-core palette): Normal = rounded head,
  tentacles hanging; Attack = tri-spike crown + raised jagged arms
  (strengthened after first contact-sheet review, where Attack read
  too close to Normal); Defense = flat-topped head, bulky violet
  shoulder/arm mass (widest body of the four); Speed = slimmest body,
  swept-back head fin, streamer arms. All four distinguishable at
  sheet scale on the final sheet.
- **Weather trio are the arc's faces and were drawn silhouette-first:**
  kyogre (wide whale front, red circuit lines, white jaw), groudon
  (bulkiest biped frame in the half, grey plate bands, white horn/
  claw set, tail slab), rayquaza (coiled serpent, yellow ring bands,
  red fins, yellow horn pair over a toothed jaw).
- Authoring workflow: generator script
  `~/workspace/ashs-journey-qa/arc3-etl/gen-h2b-art.mjs` (mirrors
  gen-h2a) composes per-species authored silhouettes/palettes/
  markings into .pix sources; the repo's own build-art validation is
  the gate (palette cap, outline, margins, orphans). 15 orphan pixels
  across 6 species (skinny spike/leg/horn raster tips on solrock,
  rayquaza, lunatone, deoxysattack, deoxysspeed) were fixed in the
  art, never in the validator; two palette omissions (bird-beak `R`
  on latias/swablu) fixed in the palettes.

### 2. Pipeline / ceiling (on the record)

- **No ceiling change.** build-art's internal art-data ceiling stays
  7,100,000 B (H2a §2). H2b lands art-data at **6,926,787 B**
  (H2a close 5,904,995 + 1,021,792), headroom 173,213 B — inside the
  cap as sized to the H0 Hoenn-close projection (6,912,862 B + ~70 KB
  H3 tile art). The remaining headroom is H3's tile-art room, NOT
  spare species room; if H3 tile art measures over it, H3 reports
  before any raise, per the H2a rule.

### 3. Census (gate)

- Script: `~/workspace/ashs-journey-qa/arc3-etl/census-h2b.mjs`
  (on the census-h2a pattern). **CENSUS H2B: PASS.**
- Half census: every one of the 70 entries has authored front+back:
  **bob missing 0, marquee accents missing 0, front ≠ back for all
  70. Zero forge fallbacks for dex 320–386 + formes.**
- **Full-roster census: all 395 entries** (386 dex + partner + 5
  forms + 3 Deoxys formes) have front+back keys in art-data.mjs:
  **missing 0, blanks 0.** With H2b, Hoenn species art is complete —
  no forge fallback remains anywhere in the dex 1–386 range.
- Per-sprite stats for the 140 new frames: painted pixels
  **642–1,562** (median 1,046; H2a: 616–1,391, median 1,059), palette
  sizes **5–11** colours (median 7; cap 32). The floor sits inside
  the H2a envelope (lunatone's crescent was enlarged a step to lift
  it off 442); the ceiling is groudon (1,562) and regirock (1,519) —
  the arc's two bulkiest bodies, in line with shipped precedent
  (dragonite 1,536, hooh 1,529), recorded here rather than trimmed
  into a lie about their size.
- **Contact sheets:** `~/workspace/ashs-journey-qa/arc3-etl/census-h2b-contact.png`
  (fronts, 1536×1854, 70 labelled at 3×) +
  `census-h2b-contact-backs.png` (backs, same format), visually
  inspected by the implementer: silhouettes nameable at sheet scale
  with the §5 exceptions flagged; the Deoxys formes row was
  re-inspected after the Attack-forme strengthening.

### 4. Battery at this commit

- build-art clean and **deterministic** (two runs → byte-identical
  art-data.mjs). 3,391 sprites total, 394 derived bobs, 673 delta
  frames.
- fidelity-checks **35/35** · campaign-smoke **24/24** ·
  battle-model-checks **45/45** · qa-changed-flows failures exactly
  **{b2, d9}** · qa-slice failures exactly **{s6, l8}** ·
  rejuv-phase2 failures exactly **{A09, C01}** (named inheritances,
  not grown) · budgets-check **all gates pass** (vercel static
  **9,365,478 B ≤ 12,582,912**).
- Fresh build (vercel + guest targets): public/game.js
  **9,273,918 B** (H2a close: 8,252,132; **Δ +1,021,786 B = 14,597 B
  per entry** vs the H0 measured art unit of 14,483 B/species —
  +0.8%, on projection; art-data 5,904,995 → 6,926,787 B, the same
  delta within rounding of frame/palette bytes). H0 re-open trigger
  (1) is Hoenn-CLOSE static > 10,100,000 B: current vercel static
  9,365,478 B with maps/story/systems (H3–H6) still to come against
  the ~9.87 MB Hoenn-close projection — no trigger fired, margin
  noted for H3's measurement. **personal/ byte-identical**
  (sha256 f434ba63…, restored from HEAD after verify-slice's
  rebuild; built targets were vercel+guest only).

### 5. Leftovers, named

- **Hardest silhouettes at 64×64** (flagged for the owner's eye on
  the contact sheet): absol (front reads side-on and slight — the
  white ruff and dark face compress at sheet scale), numel (the
  green hump crater reads as a disc from the front; canon-true but
  bold), clamperl (front shell/pearl stack reads near-abstract —
  the back, a closed shell with a pink heart, is the stronger
  frame), castform (snowman-adjacent, as the base form is).
  All pass silhouette naming on the sheet; first candidates if a
  polish pass is ordered.
- **Beldum/metang** are the plainest frames in the half (single-eye
  steel orbs by canon design); panel-line + claw treatment is the
  honest read at this size.
- Accent deltas for non-marquee Hoenn species are NOT in this
  stage's brief (H2a/Johto coverage is likewise marquee-only);
  fronts/backs/bobs are complete for the range.
- **Hoenn species art (H2) is now COMPLETE across both halves:**
  138/138 entries authored, zero forge fallbacks roster-wide.

## Arc 3 Stage H3a — Hoenn maps, WEST/CENTRAL: Littleroot → Fortree (2026-10-29)

Base: main @ aa45784 (H2b). Deliverable: NEW `src/data/maps7.mjs`
(export `MAPS7`; registered in `scripts/module-order.json` after
`maps6.mjs`; folded in `merge.mjs` exactly as maps6 was), generated
deterministically by `~/workspace/ashs-journey-qa/hoenn-h3a/gen_maps7.py`
(two runs byte-identical; edit the generator, not the file).

### 1. What landed — 59 maps

- **Settlements (11):** `littleroot` 28×18, `oldale` 28×18,
  `petalburg` 30×18, `rustboro` 30×18, `dewford` 28×18, `slateport`
  30×20, `mauville` 30×18, `verdanturf` 28×18, `fallarbor` 28×18,
  `lavaridge` 28×18, `fortree` 30×18 — all ≥24×14 viewport-filling
  (P-1). Shared `center`/`mart` interiors serve the towns via `via{}`
  tickets exactly as Johto. **Verdanturf fields no mart** (center +
  contest hall only) — the nearest marts are Rustboro through the
  tunnel and Mauville via Route 117; recorded as a deliberate
  canon-flavoured gap, not an oversight.
- **Routes (19):** `r101`–`r119` as applicable to this half —
  101, 102, 103, 104, 105–109 (the Dewford/Slateport surf roads),
  110, 111 (the desert is a dressed north-east zone of the same map:
  `desertsand` floor + sandcolumn landmark + ruin scatter), 112, 113
  (ash road), 114, 115, 116, 117, 118, 119. Routes 120+ belong to
  H3b's east half and are NOT authored here.
- **Dungeons (7):** `petalburg-woods` (Route 104 through-passage,
  the Union Cave idiom), `rusturf-tunnel` (Route 116 ↔ Verdanturf
  through-passage), `granite-cave` (Dewford cliff mouth), `fiery-path`
  (Route 112 through-passage), `mt-chimney` (summit exterior),
  `jagged-pass`, `meteor-falls` (two-mouthed: Route 114 south door,
  Route 115 north door, one connected cave).
- **Interiors (22):** `birch-lab` (Littleroot), houses ×12
  (`house-littleroot` + `house-littleroot-rival`, and one per other
  settlement — the Rustboro house is the Devon Residence dressing,
  Slateport's is the Oceanic Museum, Mauville's the Game Corner,
  Fallarbor's the Cozmo Residence, Fortree's a treehouse), gyms ×6
  layouts-only in the shipped gym idiom (`gym-rustboro/dewford/
  mauville/lavaridge/petalburg/fortree` — leaders/battles are H4),
  contest halls ×3 (`contest-verdanturf/fallarbor/slateport`):
  dressed, **NPC-free** hall floors with a reception counter
  (`α` pair flanked by `contestarch` props), a battlemat stage, and a
  `contestHall: '<town>'` data field naming each hall — H5 wires the
  contest engine inside them. Lilycove's hall is H3b's.

### 2. Identity + tile art

- **Hoenn identity system extended** (the W5/J3 machinery, third
  region): `HOENN_TOWN_ORDER`/`HOENN_TOWN_STYLE`/`HOENN_TOWN_CHARS`
  in `src/engine/tiles.mjs` — the eleven settlements own the eight
  signature kinds (tg/tg2/tc/td/tr/tl/th/tw) at U+1E00 idx
  268+i·8…275+i·8 (Johto towns end at 260); `WALKABLE` in
  `src/data/maps.mjs` gains the Hoenn tg/tg2 chars + the H3 floor
  chars by the same spread precedent; `src/engine/art.mjs` wires
  `HOENN_TOWN_ORDER` into TILE_ART / FACADE_GROUPS / floor-variant /
  prop / ground-family paths exactly as Johto.
- **Seven Hoenn kinds** (`H3_KIND_DEFS`, U+1E00+261…267): floors
  `ashground` (113/Fallarbor ash country), `desertsand` (111 desert),
  `boardwalk` (Fortree canopy walks, Slateport pier, fords); wall
  `volcrock` (Chimney/Fiery Path strata); props `ashshrub`,
  `meteorstone`, `contestarch`.
- **95 new tile .pix sources** (88 town-identity + 7 kinds) under
  `assets/sprites/pix/tiles/`, authored by
  `~/workspace/ashs-journey-qa/hoenn-h3a/gen_h3_art.py`;
  `art-data.mjs` regenerated via `build-art.mjs` only (two runs
  byte-identical). **Spend: 48,798 B** (6,926,787 → 6,975,585 B;
  ≈4.4 KB/settlement, on the Johto rate) against the stage's
  ~173 KB room — **the 7,100,000 ceiling is NOT raised**; headroom
  remaining for H3b: **124,415 B**.
- **Palette budget:** the tiles family union rose 783 → **920**
  painted hexes (eleven new town anchors + shades by design), so
  `FAMILY_PALETTE_BUDGETS.tiles` is raised 800 → **940** in
  `build-art.mjs` (cap just above the measured union, no headroom
  banked; `palette-audit.mjs` mirror updated) — the J3a/J3b
  ratified-raise procedure. H3b's five east settlements will
  re-measure (their town chars continue at idx 356+).

### 3. Connectivity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/hoenn-h3a/hoenn-sweep.mjs`
  (celadon discipline: real BFS walking on the engine WALKABLE set +
  Surf assumed, loadMap-faithful NPC model incl. the outdoor
  mart-clerk filter, interiors as connectors to fixpoint; NO
  position seeding). **All 59 maps PASS**: every entry reaches every
  warp, **zero bad warp landings**, and the map graph from
  `littleroot` reaches all 59 (walking chain littleroot → … →
  fortree incl. all three through-passages, the Meteor Falls
  two-mouth ring, and the full sea chain r104 → dewford → slateport).
- **No-soft-lock judgments, recorded:** (a) the sea legs run on the
  surf roads AND on plain boatmen — BOATMAN HALE (r104 shore →
  dewford) and BOATMAN SULA (dewford → slateport) — so every
  water-reachable shore fields a boat return as map content; a
  full-strength carry (Amendment 1) means Surf is provably in hand
  regardless. (b) No map in this half is gated behind a badge/tool
  the player cannot provably hold at first reach. (c) Dive spots:
  none — the dive set is east water (H3b owns it), per the brief.

### 4. Richness + identity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/hoenn-h3a/hoenn-richness.mjs`
  (W5 logical-raster method, real resolver + ART). **All 59 maps
  pass their floors.** Towns 144–176 colours (floor 80; mauville
  144 is the minimum); town ground-family shares ≤27.8% and top
  single ground KIND ≤27.8% (gate ≤40%). Land routes 122–188
  (floor 60); seas 61–68 (water maps, floor 60); interiors 59–70
  (floor 55); caves 50–85 (floor 45; fiery-path 50 is the minimum).
- **Tile-kind Jaccard, settlements (pairwise, target ≤0.60): all 55
  pairs PASS** — max **0.548** (rustboro~mauville), min 0.255
  (rustboro~verdanturf). Every settlement carries its 8 signature
  kinds plus a landmark: Littleroot (Birch's lab), Oldale (flower
  clock), Petalburg (the twin ponds), Rustboro (Devon HQ),
  Dewford (Granite Cave mouth + beach), Slateport (market + harbor
  pier), Mauville (Game Corner), Verdanturf (contest garden),
  Fallarbor (ash fields), Lavaridge (the hot spring, waterglow
  pool), Fortree (the canopy boardwalks).

### 5. Encounters + weather + ferry

- Audit: `~/workspace/ashs-journey-qa/hoenn-h3a/hoenn-enc-audit.mjs`
  — **PASS: 359 entries across 37 encounter-bearing maps**; every
  species exists in the merged roster; no legendaries; levels span
  **201–255**, inside band 201–300 on the ruling-6 curve
  (r101 201–205 → Petalburg Woods 206–212 → the tunnel/granite
  country 210–218 → Mauville 216–223 → the chimney/jagged country
  222–238 → ash road 230–240 → Meteor Falls 235–245 → r119
  243–253 → Fortree 245–255). Kanto/Johto species appear only where
  canon puts them (zubat/geodude/abra/machop in the caves,
  tentacool/magikarp in Hoenn water, sandshrew + skarmory on the
  ash/desert roads, oddish on 117/119).
- **H1 obligations, discharged:** Petalburg Woods carries
  **shedinja as a rare wild encounter (weight 2, Lv209–212)** and
  **silcoon (w12) + cascoon (w12)** wild-obtainable (Emerald
  precedent), so both Wurmple branches complete without evolution.
  Bonus canon placement: **feebas rides the r119 water table as a
  rare entry (w3, Lv244–250)** — its canon Route 119 fishing spot,
  on this half's map, so H1's beauty-evolution line is completable
  from wild water here.
- **Weather field per outdoor map** (ruling 4, data only — H4
  builds the renderer): 33 outdoor maps — clear ×24, **ash ×3**
  (r113, fallarbor, mt-chimney), **sun ×4** (r111, r112,
  jagged-pass, lavaridge), **rain ×2** (r119, fortree). No outdoor
  map lacks the field; interiors carry none.
- **Slateport ferry port:** CAPT MERIDIAN stands on the harbor pier
  boardwalk at (20,16) — `ferry: 'vermilion', ferryArc: 'hoenn'` —
  wired exactly as maps6's Olivine port (CAPT EASTWIND); the network
  join on first reach is the Foundation machinery's job, return legs
  unconditional by construction. The Vermilion-side embark captain
  is H4's (story stage), as is the `hoenn` registry flip.

### 6. Battery at this commit

- fidelity **35/35** · campaign-smoke **24/24** · battle-model
  **45/45** · qa-changed-flows failures exactly **{b2, d9}** (55/57)
  · qa-slice failures exactly **{s6, l8}** (132/134) ·
  rejuv-phase2 failures exactly **{A09, C01}** (38/40; C01 is the
  pre-existing chromium-start harness failure) · budgets: all gates
  pass. palette-audit: the tiles-palette line passes at 920 ≤ 940;
  the audit's 4 summary failures are identical at base aa45784
  (pre-existing, not introduced here).
- build-art clean + deterministic; fresh build (vercel + guest) OK —
  `public/game.js` **9,467,580 bytes** (+193,662 vs H2b's 9,273,918
  = maps7 data 140,158 + tile art 48,798 + engine wiring ≈4,706).
  maps7.mjs itself is 140,158 B for 59 maps (2,374 B/map — a denser
  single-line-entry emitter than maps6's expanded JSON; the stage
  lands inside the brief's +130–160 KB map-data guidance).
  **personal/ byte-identical** (sha256 f434ba63…, restored from HEAD
  after budgets-check regenerated it during the battery — zero
  personal/ paths in this diff; vercel+guest targets only).

### 7. Leftovers, named (H3b/H4/H5's list)

- Gym interiors are layouts only (leaders/battles/story are H4);
  the contest halls are inert dressed floors until H5 wires the
  engine (the `contestHall` field + counter + stage are the seam).
- Weather is declared, not rendered (H4); the drought/deluge climax
  states are H4's. Dive: no spots in this half by design (H3b).
- H3b heads-up: art-data headroom is **124,415 B** (east tile art
  must fit it or re-derive the ceiling on the record); east town
  chars continue at U+1E00 idx 356+; the tiles palette union will
  grow again (~+60 projected) — re-measure before raising.
- The r119 land table's masquerain/surskit line and the Weather
  Institute dressing are scenery only until H4's story pass; no
  institute interior is authored in this half.

---

## H3b — Hoenn maps, east/water + underwater set (Arc 3, Stage H3b)

Authored on top of H3a (base `9a3ba1f`). Tooling:
`~/workspace/ashs-journey-qa/hoenn-h3b/` (`gen_h3b.py` — extends the
H3a base round-tripped from git, applies the base patches, appends
the east set, deterministic; `gen_h3b_art.py` for the tile art;
`hoenn-sweep.mjs` / `hoenn-richness.mjs` / `hoenn-enc-audit.mjs`
extended from the H3a tools). All craft law from H3a/H0 applies.

### What landed — 40 new maps, Hoenn total 99 (roadmap band 85–100)

- **Settlements (5):** lilycove 30×20, mossdeep 28×18, sootopolis
  28×18, pacifidlog 28×18, evergrande 30×18.
- **Land routes (3):** r120 24×22 (rain, Ancient Tomb bluff),
  r121 30×16 (rain; Safari fence scenery north, Mt. Pyre pier
  south-east), r123 26×16 (Berry Master's garden; west door to
  r118's new SE avenue, east door to r122's south shore).
- **Water routes (12):** r122 28×16 (Mt. Pyre island approach),
  r124–r134 28×16 each. r125 dresses Shoal Cave's bay; r126 carries
  the Sootopolis crater ring; r131 carries Pacifidlog's west edge +
  the Sky Pillar islet; r132–r134 dress the canon currents as a new
  `current` floor kind (dressing only — no push mechanic; each
  current lane keeps a calm, fully walkable return lane, proven by
  the sweep).
- **Underwater (4):** r124-underwater, r126-underwater,
  r127-underwater, r128-underwater, all 26×16, `underwater: true`,
  dressed kelp/rock/sand trenches with their own encounter tables.
- **Dungeons (12):** mt-pyre 24×18 (ONE map, two dressed zones —
  misty interior halls south, open summit north with the twin
  shrines and both orb pedestals), magma-hideout 24×14 (entered
  from Mt. Chimney's caldera door, H3a patch), aqua-hideout 24×14
  (Lilycove harbour), seafloor-cavern 24×14, cave-of-origin 22×14,
  shoal-cave 24×14 (ice + low-tide sand), sky-pillar 20×18 (tower
  floors as dressed bands, sky-garden summit), victory-road 26×16
  (a through-passage INSIDE evergrande: south town ↔ league
  plateau, four cliff mouths), desert-ruins 18×14, island-cave
  18×14, ancient-tomb 18×14, scorched-slab 16×12.
- **Gyms (2, layouts only):** gym-mossdeep (psychic star-mat),
  gym-sootopolis (ice-floe mat) — shipped gym idiom.
- **Contest hall (1):** contest-lilycove, `contestHall: 'lilycove'`
  — the 4th hall, same idiom/field as H3a's three (H5's seam).
- **League (1):** league-evergrande — Elite Four doors west,
  Champion door north, honour hall; the Silver Stadium idiom.
  Conference staging itself is H4's.
- **Base patches on H3a maps (5):** fortree (east road rows 8–9 →
  r120), r111 (Desert Ruins mouth (19,2)/(20,2) + sign), r105
  (Island Cave islet mouth rows 4–5), r118 (SE avenue x22–23 →
  r123), mt-chimney (caldera lip warp tiles (13,4)/(14,4) → the
  magma-hideout doors; the caldera ring itself unchanged).

**Judgment calls recorded:** Mt. Pyre ships as ONE map with two
zones (like New Mauville's two halves in H3a) rather than a pair —
the interior/summit seam is a dressed stair band, no warp needed.
The east towns gain NO new house interiors: their landmark
buildings (Lilycove Department Store + museum, Mossdeep Space
Center tower, Steven's house, Pacifidlog's raft houses, Ever
Grande's plateau houses) are closed dressed landmarks in the
H3a town idiom, which is what keeps the Hoenn total at an honest
99 inside the roadmap band. H4 may open interiors as story needs.

### Identity + tile art

- East town chars: U+1E00 idx **356–395** (HOENN_TOWN_ORDER extended
  lilycove/mossdeep/sootopolis/pacifidlog/evergrande; ground tones
  lavender / glacier teal / crater white / driftwood tan / league
  slate-blue). **8 new H3B tile kinds** at idx 396–403: `seasand`
  (floor), `kelpbed` (floor), `current` (floor), `uwrock` (wall),
  `kelp` (prop), `uwcoral` (prop), `sealstone` (prop),
  `ancientpillar` (prop) — wired exactly as H3's kinds were
  (tiles.mjs defs, art.mjs loops/variants/families, maps.mjs
  WALKABLE floors + east town tg/tg2 extension).
- **Tile spend: 24,625 B** — art-data 6,975,585 → **7,000,210 B**;
  headroom left under the 7,100,000 ceiling: **99,790 B** (ceiling
  not raised). 48 new .pix (40 town + 8 kinds). Build deterministic
  (identical md5 across rebuilds).
- **Palette (J3b procedure, measured):** tiles family union
  920 → **996** hexes after the east art, so `FAMILY_PALETTE_BUDGETS
  .tiles` was raised 940 → **1010** in build-art.mjs and mirrored
  in palette-audit.mjs. Palette audit: tiles-family line PASS
  (996 ≤ 1010); the audit's 4 summary failures are the pre-existing
  base ones (todo-marker slop in tile-water-1/2/3.pix), unchanged,
  not chased. New union headroom: 14 hexes — H4+ tile art must
  re-measure before assuming room.
- **Jaccard (16 settlements, 120 pairs): max 0.585
  (slateport~lilycove)** ≤ 0.60 ✓. New-settlement worst pairs:
  lilycove~slateport 0.585, sootopolis~petalburg 0.581,
  mossdeep~petalburg 0.522, evergrande~sootopolis 0.511,
  pacifidlog~lilycove 0.341. Every settlement keeps ≥4 signature
  kinds + a landmark (dept-store + lighthouse lilycove; space
  rocket mossdeep; crater + Cave of Origin sootopolis; raft
  platform pacifidlog; falls + league plateau evergrande).

### The dive pairing (ruling 5, data half) — format for H4

Declared in `src/data/maps7.mjs` three consistent ways:
1. **Exported table `DIVE_PAIRS`** — the machine-readable list.
   Each entry: `{surface: {map, x, y}, underwater: {map, x, y}}`
   naming the exact paired TILES.
2. **Per-map fields** mirroring it: surface maps carry
   `diveSpots: [{x, y, to: {map, x, y}}]`; underwater maps carry
   `surfaceSpots: [{x, y, to: {map, x, y}}]` (and `underwater:
   true`). Dive tiles render as `W` (dark water) on the surface,
   `Ā` (waterglow) below.
3. Every paired tile's LANDING (the tile the traveller steps onto
   after the transition) is one step south of the receiving spot
   and is plain walkable floor/water — the sweep proves tiles +
   landings on both sides of every pair.

The 10 tile pairs: r124 (13,7)/(14,7) ↔ r124-underwater (7,6)/
(8,6); r126 ↔ r126-underwater same shape; r127 ↔ r127-underwater;
r128 ↔ r128-underwater; **sootopolis (13,12)/(14,12) in its crater
lake ↔ r126-underwater (20,6)/(21,6)** — Sootopolis has NO surface
gate: entry is the r126 dive pair then trenches, exit is the same
pair in reverse, unconditional once entered (no-soft-lock law).
Seafloor Cavern is NOT a dive pair: it is a walking warp inside
r128-underwater (tiles (22,5)/(23,5) → cavern south doors), exits
back to the trench. H4 gates the sysInteract DIVE action on the
`diveSpots`/`surfaceSpots` declarations; nothing else is needed.

### Connectivity — walking sweep PASS (99/99)

- Every Hoenn map (H3a's 59 re-proven + 40 new) is one walkable
  component; every warp/dive landing walkable; the map graph from
  littleroot reaches **99/99** maps. Dive pairs: **10 declared,
  all two-way consistent, tiles + landings proven**.
- Chains: Fortree→r120→r121→Lilycove→r124→Mossdeep; Mossdeep→
  r125/r126; south sea loop r126→r127→r128→r134→Ever Grande;
  Pacifidlog loop r126→r129→r130→r131→r132→r133→r134; Victory
  Road loops inside Ever Grande. Pacifidlog and Sky Pillar both
  have walking returns; no east map is a trap.

### Richness census (hoenn-richness, per-tile pixel colours)

- Towns (floor 144): lilycove 182, mossdeep 165, sootopolis 175,
  pacifidlog 144, evergrande 185; top ground shares ≤31.5%
  (town caps: family ≤40% / kind ≤55%). H3a towns unchanged.
- New land routes (floor 60): r120 183, r121 162, r123 168.
  New seas (floor 61): 62–85 (min r128/r129 62). **Underwater
  (floor 50): 51–57.**
- New caves/dungeons (floor 50): 58–148 (min ancient-tomb 58;
  mt-pyre 148). New interiors (floor 55): gyms 62/62, contest 70,
  league 80. **Richness: PASS — all 99 maps.**

### Encounters + weather (rulings 4/6)

- Encounter audit: **747 entries** (H3a 359 → +388), **70 maps**
  with tables, global span **201–295** — every entry a real
  species in the 201–300 band, no legendaries anywhere.
  East curve: r120 250–258 → Lilycove/Mossdeep waters 258–274 →
  Sootopolis 270–281 → underwater slices 264–288 (clamperl,
  chinchou, lanturn, corsola, seadra, relicanth w3) → Ever
  Grande / Victory Road 285–295. Land tables carry their places
  (r120 absol/shuppet; mt-pyre chimecho rare at the summit;
  sky-pillar claydol/altaria high band).
- **Regi tombs ship EMPTY** (`encounters: null`): dressing +
  sealed chamber only — a sealstone row with ONE floor gap, a
  shrine and ancient pillars behind it. H6 places the puzzle +
  tenants; the gap is not a soft-lock (walking in/out is free).
- Weather on all 20 new outdoor maps: **rain r120, r121** (canon
  feel); **sun** pacifidlog, evergrande, r128, r132, r133, r134;
  **clear** the other 12. **Underwater maps carry NO weather
  field** (recorded choice — `underwater: true` is the marker);
  interiors none, as H3a.

### Battery + build (base gates, unchanged expectations)

- qa-changed-flows failures exactly **{b2, d9}**; battle-model
  **45/45**; campaign-smoke **24/24**; fidelity **35/35**;
  qa-slice exactly **{s6, l8}**; rejuv-phase2 exactly **{A09,
  C01}** (environmental chromium, as at base); budgets **all
  gates pass**; `personal/` byte-identical (sha256 f434ba63…,
  restored from HEAD after the battery regenerated it).
- **public/game.js: 9,601,813 B** (+134,233 vs H3a's 9,467,580 =
  maps7 +106,988, art-data +24,625, engine wiring ~+2,620).
  **Static total (game.js + index.html): 9,693,373 B** vs the
  **10,100,000 B re-open trigger: 406,627 B of margin.**
  Hoenn-close running estimate: H4/H5/H6 add story/systems data
  (Johto's story file is 90,163 B as the scale guide) — projecting
  ≈9.85–9.89 MB at Hoenn close, in line with H0's ~9.87 MB
  projection and under the trigger. The 12 MiB hard budget is
  untouched (guest bundle 9,626,843 B).

### Leftovers / what H4 must know

- Dive ENGINE is yours: gate sysInteract on `diveSpots` /
  `surfaceSpots` / `DIVE_PAIRS` above. Sootopolis access is
  dive-only by design (fly point may be added by story, never a
  surface gate). Seafloor Cavern is reached by walking warp from
  r128-underwater, not by dive.
- `current` tiles on r132–r134 are DRESSING (a floor kind), not a
  push mechanic — if H4 wants canon current-push, it builds on the
  kind; every lane already has a calm walkable return.
- The two hideouts are dressed shells with encounter tables and
  working doors (magma via Mt. Chimney's caldera, aqua via the
  Lilycove harbour); team story, locks and the submarine are H4's.
- Gyms are layouts only; the Lilycove contest hall is inert until
  H5 (`contestHall: 'lilycove'` is the seam); league-evergrande is
  dressed staging — the Conference itself is H4's story work.
- Regi tombs: empty + sealed-with-one-gap by design (H6). The
  r121 Safari fence is scenery (no safari map in this stage).
  Weather climax states (drought/deluge) remain H4's; east maps
  declare fair-weather fields only.
- Palette union headroom is 14 hexes and art-data headroom is
  99,790 B — any H4+ art re-measures first (J3b procedure).

## Arc 3 Stage H4a — Hoenn story, FIRST HALF + weather renderer + registry flip (2026-10-29)

Base a265457 (all H1–H3 content shipped). ONE commit. `personal/`
byte-identical (restored from HEAD after builds; zero personal/
paths in the diff). Never pushed, never deployed.

### Registry flip + embark (rulings 1, scope 1–2)

- `src/data/arcs.mjs`: the Hoenn row's `status: 'sealed'` →
  `'shipped'` — the ONLY change in the row (band 201–300, horizon
  386, embark vermilion→littleroot, Hawthorn hookLines all already
  correct, consumed not rewritten).
- Embark captain: **CAPT HOENN**, Vermilion dock (16,10) — east of
  CAPT ORANGE (13,10), clear of SAILOR BRINE (10,10) — appended via
  the quests.mjs TALE_NPCS loadMap idiom exactly as CAPT JOHTO was
  wired at Pallet in J3a; carries `ferry: 'littleroot',
  ferryArc: 'hoenn'`, no tale/role. The Foundation machine does the
  rest untouched: Homecoming #3 (Johto's close) delivers Hawthorn's
  hook, sets `story.arc = 'hoenn'` + `embark_hoenn`, and the shipped
  ferryArc handler sails Vermilion → Littleroot and stamps
  `reachedarc_hoenn`. The return port shipped in H3 (CAPT MERIDIAN,
  Slateport) was already correct and is test-pinned.
- Superseded expectations (count/behaviour supersessions, the J6
  pattern — NOT regressions): johto-story A15 + cheat-shop A02 +
  johto-systems A24 item counts 160 → 168 (+8 Hoenn badge ITEMS);
  validator bag cap 160 → 168 (the cap tracks the ITEMS table, as
  at J6); johto-story E26 rewritten from the sealed-era expectation
  ("Arc 3 stays SEALED, no embark flag") to the shipped behaviour
  (arc advances, `embark_hoenn` armed) — E26's own drive now proves
  the H4a embark arm end-to-end from the Johto side.

### Beats inventory (src/data/story-hoenn.mjs, NEW; module-order after story-johto)

- **Arrival spine:** `ev_hoenn_rescue` (Littleroot entry, gated on
  `story.arc === 'hoenn'`): Birch cornered by a wild Poochyena —
  an uncatchable band-floor face (Lv 203) the carried veteran team
  drives off (the starter-era beat adapted to a carried-team
  reality; flee stalls, re-fires). Sets `birch_rescued`.
  `ev_hoenn_arrival` (first birch-lab entry): registration, the
  Wally/May pointers. Sets `hoenn_arrival` + `birch_registered`.
  PROF. BIRCH stands in the lab as a `hoenn: 'birch'` actor with
  post-Meteor / post-Chimney dialogue states.
- **May (co-spine):** met in Littleroot (`may_met`); contest beats
  are story state, not a second system (H5 builds the engine):
  Slateport (gate: Knuckle Badge) — she competes, loses by half a
  point, `may_slateport_done`, NO ribbon; Verdanturf (gate: Dynamo)
  — ribbon #1: `may_verdanturf_done` + `may_ribbon_verdanturf`;
  Fallarbor (gate: Heat) — ribbon #2: `may_fallarbor_done` +
  `may_ribbon_fallarbor`. Lilycove is H4b/H5's.
- **Wally:** Petalburg, first talk plays the whole beat (borrowed
  Zigzagoon, the pond-grass Ralts catch narrated, no battle — per
  anime): `wally_helped` + `wally_ralts`. NORMAN stands in his gym
  and defers honestly (`norman_met`, no badge in H4a — H4b's).
- **Magma/Aqua seeds (original writing throughout):** Meteor Falls
  first contact (entry, Stone Badge held): both teams glimpsed,
  Cozmo + the meteorite, one grunt scuffle via `battleAny`
  (`meteor_magma_won`/`meteor_magma_lost` branch flags), the
  meteorite stolen in the confusion: `meteor_falls_done` +
  `teams_glimpsed` + `cozmo_met`. Mt. Chimney clash (entry, Dynamo
  held): Admin Brask (Magma) at the crater machine via `battleAny`
  (`chimney_magma_won`/`chimney_magma_lost`), Admin Selka (Aqua)
  breaks it up, the meteorite's use teased (crater-feeding), never
  explained: `chimney_clash_done` + `meteorite_teased`. Both admins
  also stand as Chimney NPCs with pre/post dialogue. Weather
  Institute is SEEDED only: a Weather Watcher in Fortree + Birch's
  post-Chimney lines point at Route 119 — the full beat is H4b's.
- **Town Tales ×4** (shipped shape law, `hoennTale: true` riding the
  same data-driven runTaleNpc branch as Johto's): Littleroot
  (Bramble/Harlow), Petalburg (Orin/Lio), Rustboro (Pell/Moss),
  Slateport (Vesk/Ana) — patches stamp real maps7 townsfolk.
- **Quests:** HOENN_QUESTS, 12 first-half rows (flag order in the
  suite, A03). The HUD objective gains a Hoenn branch on the same
  find; gen-tables now emits the Hoenn quests/tales + badge
  sequence (regen only, never hand-edited).

### Badge / level table (band 201–300, ruling 6 curve)

| Gym | Leader | Team (levels) | Ace | Badge → flag |
|---|---|---|---|---|
| Rustboro | Roxanne | Geodude 209, Aron 212, Nosepass 215+fossilspur | 215 | stonebadge → badge_stone |
| Dewford | Brawly | Machop 219, Meditite 222, Makuhita 225+secondwindribbon | 225 | knucklebadge → badge_knuckle |
| Mauville | Wattson | Voltorb 229, Magneton 231, Electrike 233, Manectric 235+thunderheadpin | 235 | dynamobadge → badge_dynamo |
| Lavaridge | Flannery | Numel 239, Slugma 241, Camerupt 243, Torkoal 245+embereed | 245 | heatbadge → badge_heat |

Awards ride the shipped idiom untouched: trainer defs carry
`badgeSet: 'hoenn'` + `badge`; winTrainer writes `badges.hoenn` +
`badge_<root>`. New plumbing H4a minted (the story stage owns it):
8 Hoenn badge ITEMS rows (east four included, so the earn order is
complete from day one), `BADGE_SETS.hoenn`, `badges.hoenn: []` in
defaultState, the schema prefix pair (`bad-badges-hoenn`) + fill,
the validator pair (hoenn in checkBadges + badgeCounts), and the
gen-tables Hoenn rows. Leader battles sit behind the badge-order
gate (BADGE_SETS.hoenn-driven, the J5 Johto precedent). Gym rosters:
2 talk-to trainers per gym (205–241, rising by gym) filling H3's
empty floors via the generic trainer path. Gym Grounds from the
existing 15: Rustboro rubble, Dewford rubble (the Chuck precedent),
Mauville volt, Lavaridge pyre; Meteor Falls rubble, Mt. Chimney
ember.

### Weather mechanism (ruling 4's renderer; NEW src/game/weather.mjs)

- **Resolver** `weatherForMap(state, map)` → `{kind, source, heavy}`
  — pure, reads ONLY the current map's `weather` field (maps7:
  clear 36 / sun 10 / rain 4 / ash 3; interiors + underwater declare
  none). No field / indoor / dark → `{clear, none}`: Kanto/Johto/
  Orange maps are byte-identical in behaviour.
- **Renderer** `drawWeatherOverlay(r, game, wstate)` called from
  OverworldScene.render immediately AFTER the Premium+ time-of-day
  tint and BEFORE all HUD/text draws: rain = blue wash + hashed
  diagonal streaks; ash = grey drift motes; sand = haze wash +
  horizontal streaks; sun = warm glare wash. Particles are
  hash-placed (zero RNG consumption — gameplay randomness can never
  be perturbed by a render), animated off `game._animT`, frozen
  static under Reduced Motion. Presentation only: no battle or
  encounter code reads weather (battle weather stays Grounds').
- **Climax override hook (H4b consumes):** flags
  **`climax_drought`** / **`climax_deluge`** (story.flags booleans).
  While either stands, Hoenn OUTDOOR maps (maps declaring a field)
  override: drought → sun heavy, deluge → rain heavy; the override
  wins over the map field; interiors/underwater/non-Hoenn maps are
  unaffected even with a flag set; both set → drought wins
  (documented precedence; H4b never sets both). Proven by the
  suite's test toggle (A19–A20 pure, B21–B22 in the live bundle).

### Design smells — what the Foundation machine had to LEARN

**One real smell, honestly named: the badge plumbing was NOT
registry-complete for an unshipped arc.** The Foundation story
(registry row + machine) rode clean — homecoming, directive,
embark gating, ferry network, arcStateOf all consumed Hoenn with
zero machine changes (B01–B04 are the machine's own flows). But a
new arc's BADGE SET existed nowhere until this stage minted it in
five places at once (ITEMS, BADGE_SETS, defaultState, schema pair,
validator pair + gen-tables) — for Johto those five landed inside
J4a invisibly because the set and its first leaders shipped
together. Recorded law for Arc 4: a story stage's first commit is
the badge-set quintet, before any leader is authored. No other
smells: the loadMap append idiom, the tale branch (generalised by
one `||` to `hoennTale`), the leader runner, battleAny and the
ferry handler all rode clean.

### Battery + build

- **NEW tests/hoenn-story-checks.mjs: 48/48** (24 pure + 24 bundle
  true-path: Homecoming #3 → embark → rescue → arrival → Wally →
  Norman deferral → roster battle → badges 1–4 in order → Meteor →
  Slateport/Verdanturf/Fallarbor May beats → Chimney → weather
  reads incl. the climax toggle).
- qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign-smoke **24/24**; fidelity **35/35**;
  johto-story **110/110**; johto-systems **62/62**;
  arc-foundation **47/47**; cheat-shop **44/44**; orange-story
  38/38; orange-climax 42/42; Track B **114/114**; qa-slice
  exactly **{s6, l8}**; rejuv-phase2 exactly **{A09, C01}** (A09's
  assigned count moved 101 → 107 with the six new Ground rows —
  the same single named failure as at base, not a new one);
  budgets **all gates pass**; `personal/` byte-identical.
- **public/game.js: 9,666,694 B** (+64,881 vs HEAD's committed
  9,601,813 = story-hoenn data + weather module + engine wiring).

### What H4b inherits (exact names + staging)

- **Flags set by H4a it may rely on:** birch_rescued, hoenn_arrival,
  birch_registered, may_met, may_slateport_done,
  may_verdanturf_done, may_ribbon_verdanturf, may_fallarbor_done,
  may_ribbon_fallarbor, wally_helped, wally_ralts, norman_met,
  meteor_falls_done, teams_glimpsed, cozmo_met, meteor_magma_won /
  meteor_magma_lost, chimney_clash_done, meteorite_teased,
  chimney_magma_won / chimney_magma_lost, badge_stone / _knuckle /
  _dynamo / _heat.
- **Climax mechanism:** set `climax_drought` / `climax_deluge`
  (weather.mjs exports CLIMAX_DROUGHT_FLAG / CLIMAX_DELUGE_FLAG);
  the Rayquaza resolution CLEARS both — the renderer follows with
  no further work. Never set both at once.
- **Seams in story-hoenn.mjs** (marked): HOENN_QUESTS east rows,
  HOENN_TRAINERS, HOENN_EVENTS, HOENN_TALES, HOENN_NPCS/PATCHES all
  append at their `H4b` markers; runHoennNpc extends at its seam;
  sysLoadMap's H4a trigger block is the pattern for Institute /
  Pyre / hideout / Seafloor entry scenes.
- **Staging notes:** Weather Institute full beat — seeded via the
  Fortree Weather Watcher + Birch's post-Chimney lines (Route 119);
  the Institute interior does not exist as a map (H3 shipped no
  institute map — stage on r119/fortree or add the interior as
  story dressing, maps7 stays untouched per idiom). Mt. Pyre,
  magma-hideout, aqua-hideout, seafloor-cavern maps are dressed
  shells (H3) waiting for locks/story; gym-petalburg already has
  NORMAN standing at (7,2) with `norman_met` gating his intro —
  his battle (Balance, ≈255) replaces the deferral branch. Juan
  (not Wallace) is badge 8 per ruling 6; BADGE_SETS.hoenn +
  badge ITEMS for 5–8 already exist — H4b authors leaders only.
  May's Lilycove beat reads may_ribbon_verdanturf /
  may_ribbon_fallarbor as her carried score. The Dive engine +
  contest engine are H4b/H5 scope respectively — untouched here.

## Arc 3 Stage H4b — Hoenn story, SECOND HALF: gyms 5–8, Dive engine, the climax, Conference, completion (2026-10-29)

Base b05dc46 (H4a). ONE commit. `personal/` byte-identical
(restored from HEAD after builds; zero personal/ paths in the
diff). Never pushed, never deployed.

### Beats inventory (all appended at H4a's marked seams)

- **Gyms 5–8** (leaders into H3's layout-only gyms, 2 talk-to
  rosters each, badge-order gate + shared leader runner untouched):
  Norman/Petalburg, Winona/Fortree, Tate & Liza/Mossdeep,
  Juan/Sootopolis. Norman's H4a deferral branch now falls through
  to the leader runner at 4 badges (`norman_met` intro preserved).
  Juan carries an extra fiction gate: he refuses while the climax
  stands (`climax_resolved` required — the last gym conducts in a
  finished world).
- **Weather Institute** (r119 entry, Balance Badge held): Aqua
  takeover under Admin Shelly, `battleAny`, the staff's Castform
  gifted via `giveMon` (Lv 258) — **`castform_received` flags
  Castform's obtainable source** (dex 351, one entry, no formes,
  ruling 2). Flags: `institute_done` (+ `institute_aqua_won/lost`).
- **Villain convergence:** Mt. Pyre (entry, Mind Badge held;
  Admin Courtney `battleAny`; the orbs are taken in the smoke
  either way — `orbs_taken`, `red_orb_taken`, `blue_orb_taken`),
  Magma Hideout (caldera door; Tabitha then Maxie, both
  `battleAny`; `magma_hideout_done`, `maxie_faced`), Aqua Hideout
  (Lilycove harbour; Matt then Archie; `aqua_hideout_done`,
  `archie_faced`, `submarine_stolen` — the submarine escapes
  despite the battles, by design: the fiction needs it below).
  Admin names are canon's (Courtney/Tabitha, Matt/Shelly); the
  H4a-seeded Brask/Selka remain the Chimney/Falls admins.
- **Steven Stone beat** (Mossdeep, Mind Badge held): teaches Dive
  (see Dive design). `dive_taught`.
- **May's closing beats** (H4a pattern, story dressing only):
  Lilycove contest (gate Feather) → `may_ribbon_lilycove`
  (ribbon #3); the harbourside Grand Festival departure →
  `may_festival_done`, `may_grand_festival_done`,
  `may_ribbon_grandfestival` (ribbon #4 — the Festival's own
  commendation, staged as dressing; H5 owns the contest engine
  and the player's own ribbons).
- **Wally payoff** (Victory Road, Rain Badge held): must-win
  battle via the leader runner idiom, `wally_final_done` on a
  win only — a loss retries, nothing soft-locks.
- **Lucario special** — see placement section below.
- **Ever Grande Conference** — see the Tyson section below.

### Badge / level table 5–8 (band 201–300, ruling 6)

| Gym | Leader | Team (levels) | Ace | Badge → flag |
|---|---|---|---|---|
| Petalburg | Norman | Vigoroth 249, Linoone 251, Spinda 252, Slaking 255+tortoisecharm | 255 | balancebadge → badge_balance |
| Fortree | Winona | Swellow 259, Pelipper 261, Skarmory 263, Altaria 265+sparrowfeather | 265 | featherbadge → badge_feather |
| Mossdeep | Tate → Liza | Tate: Xatu 270, Solrock 274 (no badge) · Liza: Claydol 272, Lunatone 275+ironacorn | 275 | mindbadge → badge_mind |
| Sootopolis | Juan | Luvdisc 279, Whiscash 281, Crawdaunt 283, Kingdra 285+tidepearl | 285 | rainbadge → badge_rain |

**Tate & Liza adaptation (recorded honestly):** the engine has
NO 2v2 battle anywhere (battle scenes are 1v1 end to end), so
the twins ship as a **back-to-back pair in one gym visit** —
Tate opens (no badge on his def), Liza closes and carries the
Mind Badge through the shipped award idiom. Losing to Liza
leaves `beat_tate` standing and the pair re-runs in order.
Nothing presents two foes on the field at once. Gym rosters
246–280 rising by gym; villain chain 252–278; Wally 286–292
(Gardevoir 292); Conference prelims 288–293, Morrison 293–296,
Tyson 294–298 (Metagross 298, the band's working ceiling).
Gym Grounds (existing 15 only): Petalburg open, Fortree storm,
Mossdeep mind, Sootopolis tide; landmarks Mt. Pyre grave,
Seafloor tide, Cave of Origin spirit, Sky Pillar storm.

### Dive engine design (ruling 5, scoped)

- **Gate:** standing ON or facing a defined dive spot with
  (a) the Mind Badge in `badges.hoenn` and (b) a party member
  that knows Dive. Refusals are dialogue **naming the missing
  piece** (badge first, then the move — the ferry-gate idiom).
- **Idiom:** one branch in `sysInteract` ahead of the Surf/fish
  water branch, mirroring Surf's menu-then-warp shape; the warp
  itself rides the shipped `doWarp` (banner, music, autosave,
  position). Pairing is consumed from BOTH declarations: the
  current map's `diveSpots`/`surfaceSpots` supply the landing,
  and maps7's exported `DIVE_PAIRS` is cross-checked — a spot
  no pair claims is not a dive spot.
- **The way up is unconditional:** `surfaceSpots` on an
  underwater map warp back with no badge check, no move check —
  the no-soft-lock law. The suite's audit drives **all 10
  DIVE_PAIRS down AND up** through the real `sysInteract`.
- **Dive the move:** `dive` is NOT in the game's move table and
  this mission adds no moves, so Dive has no battle slot and no
  battle effect — recorded plainly. Its knowledge follows Surf's
  representation with that one difference: where `teachMove`
  records HM-taught field knowledge on the mon's `hmMoves`
  list, Steven's teaching writes `'dive'` into the chosen
  partner's `hmMoves` (no battle slot occupied, nothing for the
  battle model to read — battle-model stays 45/45 untouched).
  `partyKnowsDive()` accepts an `hmMoves` entry or, defensively,
  an in-table `dive` move slot if a future arc adds one.
- **Sootopolis** is reached only via its r126-underwater pair
  (proven in the audit); **Seafloor Cavern** is entered from
  r128-underwater's walking warp (maps7 warp, asserted) and its
  entry scene is gated on `submarine_stolen`.

### Climax phase design (Emerald staging, original writing)

Three entry scenes move the weather flags, and ONLY these
(a new generic `clearFlag` step in `runSteps` carries the
transitions as data; its one other property: it writes `false`,
never deletes, keeping the validator's flag vocabulary stable):

1. **Seafloor Cavern** (entry, `submarine_stolen`): Maxie
   `battleAny` at the deep chamber; Groudon wakes →
   `climax_drought` SET, deluge untouched. Renderer: heavy sun
   region-wide (asserted over a rain map).
2. **Sootopolis standoff** (entry, `seafloor_done`): Kyogre
   answers → `climax_drought` **cleared**, `climax_deluge` set
   (`standoff_seen`, `kyogre_answered`). The phases NEVER
   overlap, so the renderer's drought-wins precedence remains
   a corruption guard, never a staged state. The Cave of
   Origin keeper (a `hoenn: 'origin_keeper'` actor) then points
   UP — `origin_guidance`.
3. **Sky Pillar** (entry, `standoff_seen`): Rayquaza wakes and
   descends → **BOTH flags cleared**, `rayquaza_descended`,
   **`climax_resolved`** set. The renderer falls back to
   per-map fields (asserted: r113 reads ash/source map again).

**The flag H6 keys off is `climax_resolved`.** Groudon, Kyogre
and Rayquaza are story appearances ONLY here — no event
battles, gifts, or trainer fields one (asserted in A33), none
is caught or consumed (dex 382/383/384 asserted uncaught at
each phase); their catch arcs open post-climax in H6.

### Lucario placement (ruling 9 + mission scope 6)

**Source:** `docs/chronology-mapping.md`, Act II table,
Chapter 6 "Rise Through Hoenn" (Hoenn) lists among its special
story events: "Movies: Jirachi: Wish Maker · Destiny Deoxys ·
**Lucario and the Mystery of Mew**". The map therefore places
the movie **inside Hoenn's span** (not Arc 3.5's — Chapter 7's
row names a different movie), so H4b stages it in-arc: a
self-contained aura-legend beat in Petalburg Woods (an
`AURA KEEPER` actor at the great tree; time-flowers opening
for the player's team; the Tree of Beginning abstracted to a
root-chamber legend in our fiction, no lifted script). Flags:
`lucario_event_done`, `lucario_aura_seen`. **Honest limit:**
Lucario is a Sinnoh-dex species (Arc 4's horizon, dex 448 —
outside this game's species tables), so no Lucario battle or
catch is staged or faked; the event is the legend/recognition
beat itself, and the register records that deviation openly.

### Tyson branch design (the Harrison precedent, mirrored)

A scripted forced result is inexpressible in this engine (the
J4b finding, unchanged), so the final is a **real full-strength
friendly battle whose completion predicate is FACED**:
`flags.tyson_faced` + `tyson_won`/`tyson_lost` record the
honest branch. On a **loss**, the canon-honours text plays the
narrow loss to Tyson as the standing result (Meowth endures by
a whisker; the hall rises anyway). On a **win**, the branch
acknowledges the upset on the floor (the Harrison solution —
"the card may argue with the papers; I was on the floor").
Either way Scott then delivers the Battle Frontier invitation
**at the Conference** (`scott_invitation`), `hoenn_complete`
is set, and completion proceeds. The suite's deterministic
drive takes the WIN branch (harness team Lv 299); the loss
branch is the same code path with its own lines, and the
FATED predicate — not the branch — is what the gate asserts.

### Machine-riding proof (nothing hand-rolled)

From `hoenn_complete` alone, with zero ending code in H4b:
`checkArcCompletion` fires the ARC COMPLETE card
(`arc_card_hoenn`), writes `regionsDone += 'hoenn'` through
the machine's own write path, and pins `arc_directive =
'frontier'` (asserted B50). The journey home + Homecoming at
Mom's house then ride `tryHomecoming`: the Frontier row's
hook is delivered in person by **Scott** (registry `hookGiver:
scott`, the row's written hookLines — consumed, not rewritten),
`hook_frontier` is set and the directive clears (B51).
**Frontier state, honestly:** the registry row's status is
`sealed`, so the machine's sealed-homecoming law holds —
story.arc does NOT advance and NO `embark_frontier` is armed;
`arcStateOf(frontier)` reads `sealed` (the drawn road ahead),
Hoenn reads `complete`, and there is **no dangling directive
or fake embark**. (The mission text's "'next'/locked-next"
phrasing describes the narrative position; the registry +
machine law govern the stored state, exactly as the sealed
Johto-era rows behaved. Flipping the row to 'next' would arm
an embark to a `frontierhub` map that does not exist — a
dangling state, refused.) H5/H6/H7 inherit: Frontier content
is Arc 3.5's build, not this stage's.

### Design smells

- **One small engine addition:** `runSteps` gained a
  `clearFlag` step — the event vocabulary could set flags but
  never clear them, and phased story state (weather, and any
  future two-phase arc) needs clearing as data, not as engine
  special cases. Generic, one branch, no consumer but the
  climax scenes.
- **The badge plumbing smell did NOT recur** (H4a's quintet
  carried badges 5–8 with zero new plumbing — leaders only,
  as predicted). The loadMap append idiom, the leader runner,
  `battleAny`, `giveMon`, and the Foundation machine all rode
  clean. No other smells.

### Battery + build

- **tests/hoenn-story-checks.mjs: 88/88** (37 pure — grown
  from H4a's 24 with east leaders/twins/Juan, villains, Wally,
  Conference cast, Institute/Pyre/hideout/climax event shapes,
  DIVE_PAIRS cross-view audit, east Grounds, the Lucario
  chronology source, the Frontier registry law — + 51 bundle:
  the H4a true path extended through Norman → Institute →
  Winona → both dive refusals → Steven → **all 10 dive pairs
  down and up** → Pyre → both hideouts → Seafloor (drought
  asserted on the renderer) → standoff (deluge asserted) →
  keeper → Sky Pillar (both flags cleared, renderer back to
  map fields) → Juan (badge set complete, canonical order) →
  Lucario → Wally → Conference (register, both prelims,
  Morrison, Tyson FACED) → Scott's invitation → machine card
  → directive → Homecoming (Scott hook, sealed law, no
  dangling state)).
- qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD — the stage touches story + one sysInteract branch +
  one runSteps branch, no battle code); campaign-smoke
  **24/24**; fidelity **35/35**; johto-story **110/110**;
  johto-systems **62/62**; arc-foundation **47/47**; cheat-shop
  **44/44**; orange-story 38/38; orange-climax 42/42; Track B
  **114/114** (run via `node --import ./register.mjs run.mjs`
  per run.mjs's own header — the bare `npm test` script lacks
  the register import and fails identically at base, a
  pre-existing quirk, not a regression); qa-slice exactly
  **{s6, l8}**; rejuv-phase2 exactly **{A09, C01}** (A09's
  assigned count moved 107 → 115 with the eight new Ground
  rows — verified against a stashed base run at b05dc46:
  assigned=107, the same single named failure, not a new one);
  budgets **all gates pass**; `personal/` byte-identical.
- **public/game.js: 9,735,190 B (+68,496 vs H4a)** (vs H4a's 9,666,694 B).

## Arc 3 Stage H5 — Contest-lite: appeal/jam data, the appeal-round engine, ribbons persisted (2026-10-29)

Scope: coordinator ruling 7, exactly as locked — 4 halls, one ribbon
per hall, no rank ladder, no dress-up/accessories, no combo/category
engine beyond appeal+jam, no new art. May's contest career stays
story dressing (H4's `may_ribbon_*` flags); the player's contests
never read or write those flags (suite B09 proves it).

### Appeal/Jam data — the recorded choice: a PARALLEL table

- `src/data/contest.mjs` (new; module-order right after moves2):
  `MOVE_APPEAL`, a parallel table keyed by move id, built at load
  from MOVES + MOVES2. **moves.mjs / moves2.mjs are byte-untouched**
  — the mission allowed additive fields OR the parallel table; the
  table won because (a) it keeps every battle-data file stable for
  the H6/H7 stages that read them, (b) the derivation lives in ONE
  place (`deriveAppealJam`) instead of 144 hand-edits, and (c) the
  engine's single read path `appealJamFor(id)` cannot miss: an
  unknown id resolves to floor values {appeal 1, jam 0} rather than
  throwing. Suite A01 proves coverage over all 144 moves.
- **The derivation** (by category / power / effect class):
  damaging — appeal = 1 + floor(power/25), +1 multi-hit, +1
  high-crit, +1 charge/recharge, +1 drain, +1 fixed-level/OHKO;
  jam 1 if it can also inflict a status (effect.status + chance).
  Status — appeal 4 baseline, 5 for a self stage-raise (the
  showcase buff), 3 for a foe stage-drop; jam 2 for a foe status
  inflict, 1 for a stage-drop or a seeded snare. Derived values
  clamp to appeal 1..6 / jam 0..3.
- **Hand-tuned notables: 36** (suite A03 pins the count + the
  landmarks): the finales (Hyper Beam 8/0, Solar Beam and Sky
  Attack 7/0), the spectacle sixes (Fire Blast / Thunder /
  Blizzard / Earthquake 6/1, Hydro Pump / Psychic / Petal Dance /
  Swords Dance 6/0), the OHKO set pieces (Guillotine / Horn Drill
  / Fissure 6/2), Explosion 7/2 and Self-Destruct 6/2, the famous
  snoozes (Spore / Lovely Kiss / Sleep Powder jam 3, Sing 5/2,
  Hypnosis 4/2), and Splash at 1/0 — it flops, the crowd is kind.
- NPC fields: 12 original entrants (3 per hall, `CONTEST_NPCS`),
  dressed Hoenn-era species, each with a 4-round script of real
  moves. Every scripted move scores appeal 4–5 and jam ≤ 1 (0 in
  Verdanturf), which makes the tuning honest by construction: a
  headliner act (Hyper Beam ×4, min 32) always beats the field's
  max (28), and a flop act (Splash ×4, max 12) always loses to the
  field's min (16). Suite A07 pins those bounds.

### The engine — on the shipped battle presentation

- `src/game/contest.mjs` (new; module-order right after
  battle.mjs): a pure deterministic core (`createContest`,
  `performRound`, `resolvePerformance`, `standingsOf`,
  `placementOf`, `awardContestRibbon`) + `ContestScene`.
- Flow: 4 entrants (player + the hall's 3 NPCs) × 4 rounds.
  Performance order ROTATES (round r opens with entrant r−1).
  Each performance scores appeal (table) + a presentation
  variance of 0..2 drawn from the caller's rng stream (seeded in
  tests, `g.rng.misc` live). **Jam semantics (the shipped
  reading):** a jam move cuts the CURRENT ROUND LEADER — the
  highest round score among entrants who have ALREADY performed
  this round, never the performer — by min(jam, their round
  gain). Behind is where jam lives; played from the front (or
  first in the round) it fizzles. After each round the scene
  announces the standings. Standings sort: total desc, then
  final-round gain desc, then entrant order — no coin flips.
  1st place → the hall's ribbon; replays allowed, never
  duplicated (`awardContestRibbon` is idempotent).
- **The scene rides the battle presentation by inheritance:**
  `ContestScene extends BattleScene` and overrides only
  `enter` / `update` / `exit` + the contest flow — `render()`
  (arena, stepped platforms, battler plates, idle life) is
  BattleScene's own, untouched. `this.foe` tracks the current
  performer, `this.ally` is the entered mon; move picks ride a
  'Choose a move' menu over the mon's REAL moveset (labels carry
  the appeal/jam), narration rides `ui.say` — the same harness
  seams the battle/overworld drivers already speak. No damage,
  no HP change, no fainting: B13 asserts the entered mon's HP is
  untouched after a full contest.
- **Smell watch — what the battle presentation had to LEARN:
  nothing.** BattleScene itself is unmodified (the 45/45 hard
  gate is the point, and it holds). The one integration fact
  worth recording: `render()` reads a fixed field set
  unconditionally (fxPool at FX_POOL_MAX 60, entryFx, fxKb,
  fxRecoil, entryT, _exitStartT, hpAnim, msg/msgOpen, t) — a
  subclass must initialize ALL of it in its own enter(), since
  BattleScene.enter() (which normally does) is the battle flow
  and never runs. ContestScene.enter() initializes exactly that
  set; the header comment in contest.mjs lists it for H6/H7.
- Entry seam: `sysInteract` in overworld-systems gains ONE
  branch — on a map with a `contestHall` field, facing the
  reception counter tile ('α', the counter furniture all four
  halls are dressed with, the Center-counter char) calls
  `startContest()`: a reception greeting (an already-held
  ribbon is named honestly), a party pick ('Enter which
  Pokemon?', eggs and fainted mons excluded, with a spoken
  refusal when nobody is able), then the ContestScene is
  pushed. Suite B07 proves open floor in a hall opens nothing.

### Ribbon persistence — the quintet, as executed

Shape (mirroring the J6 top-level arc-systems precedent):
**`state.contest = { ribbons: [...] }`** — a top-level key
holding a duplicate-free, UNORDERED subset of the four hall ids
(ribbons can be won in any order, so no prefix rule, unlike
badges). The five places state lives, all landed:

1. **defaultState** (state.mjs): `contest: { ribbons: [] }`.
2. **Client schema** (save/schema.mjs): TOP_KEYS += 'contest';
   validate-if-present block — object with a ribbons array,
   length ≤ 4, every id in CONTEST_RIBBONS, no duplicates, else
   `bad-contest-ribbons`.
3. **Save-fill** (schema.mjs fillV2Defaults via migrate): a
   pre-H5 save (no contest key) opens with `{ ribbons: [] }`; a
   present value rebuilds into the closed shape (known ids
   only, duplicates dropped) — validateSave stays strict.
4. **gen-tables** (tools/api-scripts/gen-tables.mjs): imports
   CONTEST_RIBBONS from src/data/contest.mjs and emits
   `ribbons` into tables.json — regenerated ONLY via the tool
   (`--check` green; the snapshot was never hand-edited).
5. **Server validator** (api/_lib/validator.mjs): TOP_KEYS +=
   'contest'; TABLES.ribbons as a Set; validate-if-present —
   `bad-contest` (non-object), `bad-contest-ribbons` (non-array
   / oversize), `bad-ribbon` (unknown id / duplicate). Absent
   key accepted (pre-H5 cloud saves stay valid).

Suite A09–A15 pins each of the five, including the round-trip:
a ribboned save validates on BOTH validators, and B10 drives
the live bundle state's JSON round-trip through migrate +
validateSave.

### Suite

- **tests/hoenn-contest-checks.mjs: 28/28** (15 pure + 13
  bundle). Pure: coverage/derivation/notables, NPC field
  bounds, the quintet. Bundle: the engine driven
  deterministically (scoring math reconciled event-by-event
  against the table; the jam A/B on one seed — sing vs splash
  control — where the NPC field scores EXACTLY the jammed
  total less, and every jammed entrant's total reconciles;
  the leader-so-far unit and the nobody-ahead fizzle), then
  the true path: counter → party pick → ContestScene → 4
  'Choose a move' menus → Verdanturf ribbon persisted → save
  round-trip → encore win with NO duplicate → Slateport
  ribbon (unordered set) → Splash loss, no ribbon, no damage.

### Battery + build

- qa-changed-flows exactly **{b2, d9}**; battle-model
  **45/45** (HARD — BattleScene unmodified, the gate this
  stage is built around); campaign-smoke **24/24**; fidelity
  **35/35**; hoenn-story **88/88**; johto-story **110/110**;
  johto-systems **62/62**; arc-foundation **47/47**; Track B
  **114/114**; validator **89** + fuzz **2000/2000** +
  save-contract **10/10** with the new state; qa-slice exactly
  **{s6, l8}**; rejuv-phase2 exactly **{A09, C01}**; budgets
  **all gates pass**; `personal/` byte-identical (restored
  from HEAD after builds; zero personal/ paths in the diff).
- **public/game.js: 9,757,130 B (+21,940 vs H4b)**; public
  static total **9,919,752 B** vs the 10,100,000 B trigger —
  **margin 180,248 B** (was 202,188 at H4b close; this stage's
  data+engine spend is proportionate, ~22 KB for the table,
  the engine, the scene and the validator pair).

### For H6/H7

- Contests are live at all four halls from any save that can
  reach them (no story gating was added — the halls' own sign
  text promised exactly this). H7's chain drive can win its
  one required contest ribbon at Verdanturf with any
  headliner moveset (Hyper Beam ×4 is a by-construction 1st;
  suite B02/B08 prove the line end-to-end).
- `state.contest.ribbons` is the ONLY new state; a ribboned
  save round-trips both validators (A13/B10). Nothing in H5
  touches story flags, badges, or May's dressing.

## Arc 3 Stage H6 — Hoenn legendary arcs ×10: the Regi tombs, the Eon pair, the weather trio catches, Jirachi, Deoxys + the meteorite forme switch (2026-10-29)

Stage H6 ships the ten Hoenn legendary arcs on the shipped
legendary-arc pattern (J5 precedent throughout): quest-log entries
with stated requirements in the ONE LEGENDARY_ARCS table, an
in-fiction gate per arc, and a `{ wildBattleCatch }` face — flee AND
KO stall the event with nothing set and nothing consumed, so every
encounter re-fires until the catch; arc completion = the catch, and
the dex registers it. `HOENN_LEGENDARY_ARCS` (story-hoenn.mjs) folds
into LEGENDARY_ARCS via merge.mjs, superseding all ten
story-kanto.mjs designed stubs (dead lair ids `deserttomb` /
`islandcave` / `ancienttomb` / `caveoforigin` / `skypillar` /
`hoennsearoutes` / `southernisland` / `forina` / `birthisland`,
pre-band levels 40/70). No new save state anywhere in this stage:
every gate reads story flags the campaign already writes, plus the
persisted `stepsTotal` counter (J6) for the Latias rotation.
tables.json needed NO regen (the stubs had pre-registered all ten
arc ids in the validator's quest vocabulary; gen-tables --check
stays green untouched).

### Per-arc staging table

| Arc | Gate | Location (trigger) | Lv |
|---|---|---|---|
| Regirock | inscription + the standing beat | desert-ruins inner chamber (sealstone interact / chamber step) | 285 |
| Regice | inscription + the greeting order (west boulder, then east) | island-cave inner chamber (boulder + sealstone interacts / chamber step) | 285 |
| Registeel | inscription + iron-to-iron (Steel-type partner in party) | ancient-tomb inner chamber (sealstone interact / chamber step) | 285 |
| Latias | `climax_resolved` + be on her current landing | ROAMS: r110 → r118 → r123 → r127 → r134 (sysLoadMap) | 290 |
| Latios | `climax_resolved` + step onto the island shore | r125, the Shoal Cave island (x12–18, y4–8) — the Eon stop (sysOnStep) | 290 |
| Groudon | `climax_resolved` | magma-hideout, the deep chamber / magma pool (sysLoadMap entry) | 298 |
| Kyogre | `climax_resolved` (+ Dive by construction) | r127-underwater, the deep trench (sysLoadMap entry) | 298 |
| Rayquaza | `climax_resolved` | sky-pillar summit (sysLoadMap entry; `ev_hoenn_rayquaza_face`, NOT the H4b appearance event) | 300 |
| Jirachi | Space Center news → witness the star fall → the wish beat | mossdeep (ORBIT) → meteor-falls entry → meteorstone (13,11) | 292 |
| Deoxys | Space Center rumour → the crater meteorite | meteor-falls meteorstone (21,4); the same stone is the forme switch | 295 |

### The Regi puzzles (one per tomb, all original)

Each tomb carries its inscription on the stone by the door (the
H3b sign tile at (9,11), intercepted in sysInteract): original
riddle text in a braille-FLAVOURED presentation — raised-dot
writing the narration translates in our own words; our text, our
puzzles, no canonical inscription is reproduced. The seal itself
is enforced in sysOnStep: the sealstone row (y=5) has its single
floor gap at x=8 (H3b's seam), and stepping north of the row
(y ≤ 4) unsolved meets the seal — narration + a step back south
(the Route Silver gate idiom: turned back, never stuck). Solved,
the same step meets the Regi.

- **Desert Ruins — the standing beat.** "THE STONE REMEMBERS WHO
  WAITS… LET THE DESERT COUNT SIX SLOW BREATHS. THE IMPATIENT
  KNOCK FOREVER." Read, then face the sealstone and choose to
  stand and wait (the shipped choice idiom carries the beat; the
  narration counts the six breaths) → `regi_rock_open`, the
  sealstones part, the face fires.
- **Island Cave — the greeting order.** "GREET THE WEST STONE
  FIRST, WHERE THE DOOR'S WIND FALLS. GREET THE EAST STONE
  SECOND… REVERSE THE GREETING, AND THE COLD FORGETS YOU."
  Interact the outer chamber's two boulders in order — west
  (2,12), then east (14,11). East-first is politely forgotten
  (no progress kept); west-then-east sets `regi_ice_open`.
- **Ancient Tomb — iron answers iron.** "LET A PARTNER OF LIVING
  STEEL STAND WITH YOU, AND PRESS YOUR HAND TO THE SEAL."
  Interact the sealstone with a living Steel-type in the party
  (the shipped `partyHasType('steel')` field check) →
  `regi_steel_open`. Without one, the seal names the missing
  company and refuses.
- **SIMPLIFICATION (recorded per the brief):** the tombs are
  SELF-CONTAINED. There is no Sealed Chamber map in the shipped
  Hoenn, so no cross-tomb prerequisite chain exists — each
  tomb's inscription is its only key, and the designed stubs'
  "Read the braille in the Sealed Chamber" first step is
  superseded by reading the tomb's own door stone.

### The Eon pair — the roaming call + the site call

- **No roaming engine exists to ride.** The Johto beasts are
  fixed lairs despite their trail-sign fiction; nothing in the
  engine moves an encounter between maps. Per the brief's
  fallback, Latias rides the lightest honest equivalent: five
  staged landing maps whose turn is derived deterministically
  from the PERSISTED walked-step counter — landing =
  `landings[floor(stepsTotal / 50) % 5]`, cycling r110 → r118
  → r123 → r127 (surface sea) → r134. Entering her current
  landing (sysLoadMap, post-`climax_resolved` only) fires the
  face; walking Hoenn turns her to the next landing, so a flee
  genuinely loses her until the rotation comes round. No new
  save fields; the rotation is a pure function of state that
  already validates. The quest-log step names all five landings.
- **Latios' site call: the Shoal Cave island, r125.** The east
  seas' water routes are unbroken surf (r129–r134 hold only
  one-tile sandbars), but r125 carries a real island landmass —
  the Shoal Cave island (sand + cavefloor shore, x12–18 / y4–8)
  — a lone island in the east seas with its own landing. The
  fiction names it the Eon stop; the face fires on stepping
  onto the shore apron, post-`climax_resolved`. **No Southern
  Island map was built**: staging on an existing map did not
  fail, so the permission was not used; Hoenn stays at 99 maps.

### The weather trio, catchable at last

All three key off the single post-climax flag `climax_resolved`
(H4b's key flag, set only inside `ev_hoenn_rayquaza`) — NONE is
reachable before it, and the suite asserts the absence on the
same maps pre-flag. The H4b climax wrote NO catch state (titans
were appearances only), so H6 opens every catch fresh:

- **Groudon** withdrew to the earth's heat: the magma pool at
  the back of the Magma Hideout's deep chamber (entry trigger).
- **Kyogre** sleeps in the deep it nearly drowned the world
  with: the r127 underwater trench — Dive-gated by construction
  (the map is only reachable through the shipped Dive pair).
- **Rayquaza** is met on the return ascent: the Sky Pillar
  summit, in a NEW face event (`ev_hoenn_rayquaza_face`) — the
  H4b climax visit was an appearance and its event is untouched.
  Traversal is the shipped walking idiom; no crack-floor gimmick
  exists or was added (H3b/H4b's recorded simplification stands).

### Jirachi — the star chain (original writing)

Mossdeep Space Center is the quest's information source, exactly
as briefed: its facade researcher — SPACE RESEARCHER ORBIT, the
shipped maps7 townsfolk — carries the briefing (a name-keyed
sysNpc branch, the GARY precedent; NO interior exists and none
is faked, and NO new actor was appended — hoenn-story's A22
census of HOENN_NPCS stands undisturbed at 45). One conversation
sets `arc_jirachi_news` + `arc_deoxys_rumor` and marks both arcs
discovered. Then: enter Meteor Falls → the star fall is
witnessed (`ev_hoenn_jirachi_witness`, dialogue-only, sets
`jirachi_star_fell`) → follow the fallen light to the meteorstone
by the lower falls (13,11) → the wish beat → the face, Lv 292.

### Deoxys + the meteorite forme switch — RULING 2: THE REAL MECHANIC SHIPS

The catch stages at Meteor Falls' crater (the Space Center apron
carries the rumour instead — ORBIT, above): the crater meteorite
at (21,4) in the north chamber fires the face once the rumour is
in hand, Lv 295, Normal forme. After the catch, the SAME
meteorite is the forme switch: interact with a Deoxys in the
party → a menu of the four formes (current forme disabled) →
`switchDeoxysForme` performs a speciesId swap among
deoxys / deoxysattack / deoxysdefense / deoxysspeed in the
evolution idiom — level, XP, nickname, keepsake (the engine's
held-item slot), IVs, status and the move set are the
individual's own and are NOT touched; maxHp/stats recompute from
the new forme's base stats with HP carried by evolveMon's
max-delta rule. The first switch sets `deoxys_forme_touched`
(the arc's post-catch quest step).

**The invariant check the brief demanded, by name:** the swap
was audited against every invariant that could have forced the
fallback, and none breaks — (i) all four speciesIds sit in
tables.species with the shared dexNo 386, so dex/diploma
accounting is forme-blind; (ii) save move legality is
TABLE-scoped in both validators (a mon's moves must exist in
the move table — they are NEVER checked against the species'
learnset), so the individual's kept moves validate under every
forme even though H1 authored the formes' learnsets as
different slices of the one Psychic pool; (iii) the mon record's
shape is species-agnostic (makeMon fields only). The suite
proves the consequence, not just the argument: the switched
Deoxys round-trips BOTH validators in EVERY forme (B12), and
the full cycle preserves level/XP/nickname/keepsake/moves
losslessly (B11). The Cheat-Terminal fallback was therefore
NOT taken.

### Suite

- **tests/hoenn-legendary-checks.mjs: 24/24** (12 pure + 11
  bundle + the node-side forme-validation check). Pure: the
  live register (ids, steps, lairs, climax keying, the
  superseded arcs-prereq), all ten face shapes on the
  catch-only chain at their levels, the H3b tomb seam read back
  from maps7, the staging tiles, the forme data, the tables
  plumbing, band-ceiling validation. Bundle: EVERY arc driven
  locked-before-its-gate → gate solved → flee → re-fire →
  catch → arc complete + dex registered; the three puzzles
  solved in-fiction (incl. the wrong-order and no-Steel
  refusals); Latias met on r110, lost on the turn to r118,
  caught on r123; the Deoxys cycle through all four formes.

### Battery + build

- qa-changed-flows exactly **{b2, d9}**; battle-model
  **45/45** (HARD); campaign-smoke **24/24**; fidelity
  **35/35**; hoenn-story **88/88**; hoenn-contest **28/28**;
  johto-story **110/110**; johto-systems **62/62**;
  arc-foundation **47/47**; Track B **114/114**; validator
  **89** + fuzz **2000/2000** + save-contract **10/10**;
  qa-slice exactly **{s6, l8}**; rejuv-phase2 exactly
  **{A09, C01}** (verified as the same named inheritances);
  cheat-shop 44/44 also green; budgets **all gates pass**;
  `personal/` byte-identical (restored from HEAD after builds;
  zero personal/ paths in the diff).
- **public/game.js: 9,800,329 B (+43,199 vs H5)**; public
  static total **9,962,951 B** vs the 10,100,000 B trigger —
  **margin 137,049 B** (was 180,248 at H5 close; the spend is
  the ten arcs' data + the tomb/meteorite/roam engine surface
  + the suite-driven bundle growth, data-scale as projected —
  no stop required).

### For H7

- All ten arcs are completable on a post-climax save
  independently and in any order; the chain drive needs only
  ONE legendary completion — Regirock is the cheapest honest
  line (read the door stone at desert-ruins (9,11), face the
  sealstone row and choose the wait, masterball). Jirachi's
  chain is the longest (ORBIT → falls entry → stone (13,11)).
- Latias' landing is a pure function of `stepsTotal`
  (`floor(stepsTotal/50) % 5` over [r110, r118, r123, r127,
  r134]) — the chain drive can set or walk the counter to aim
  her; she is the one arc whose face cannot be forced by
  position alone.
- The Deoxys in the chain save will sit in a PC box if the
  party is full when caught (catch delivery is the shipped
  one); the meteorite switch reads the PARTY only — move it
  into the party before interacting with the stone at (21,4).
- Nothing in H6 fires before its gate on a campaign save:
  every sysLoadMap/sysOnStep/sysInteract branch is keyed on
  H6/H4b flags a true-path save only holds in order, and the
  full hoenn-story true path re-ran green against them.

## Arc 3 Stage H7a — CAMPAIGN GATE: the continuous chain drive through Hoenn + the complete battery (2026-10-29)

### 1. What this stage is

Proof only — no game code changed. The independent chain drive
(`~/workspace/ashs-journey-qa/arc-chain-qa/chain-drive.mjs`, 88/88
through Johto at J7a) is extended through Arc 3 on **one continuous
save**, and the **complete battery** is run without exception. Base:
`main @ 01918eb` (H6). NOT pushed, NOT deployed.

### 2. The chain drive: 123/123 on one save

88 existing checks (C01–C40 + J01–J40 + D01–D08) + 35 new Hoenn
checks (H01–H35), all green, exit 0. The save runs: Kanto complete
→ Orange complete → Johto complete → Homecoming #3 (Hoenn hook;
arc advances, embark armed — §3.1) → Vermilion embark (CAPT HOENN)
→ Littleroot (Birch rescue, lab arrival, May met, Wally's first
beat, Norman's deferral) → the spine in order: Roxanne (1) →
Meteor Falls → Brawly (2) → Wattson (3) → **the Verdanturf contest
ribbon won on this save** (the drive's own Snorlax, Hyper Beam ×4
through the real counter → ContestScene → 4 move menus → 1st place
→ `contest.ribbons == ['verdanturf']`) → Mt. Chimney → Flannery (4)
→ Norman (5, the deferral paid off) → Weather Institute (Castform
gift, dex 351) → Winona (6) → the twins (7) → Steven teaches Dive →
**a Dive round-trip on the real r124 pair, the ascent proven
unconditional** (Mind Badge and Dive knowledge stripped before
surfacing, restored after; the return fired regardless) → Mt. Pyre
orbs → Magma Hideout → Aqua Hideout → Seafloor Cavern (**drought
read while set**: flag true, deluge unset, renderer heavy sun over
a rain map, source climax) → the Sootopolis standoff (**deluge read
while set**: drought cleared to false, deluge true, renderer heavy
rain over an ash map; neither titan caught) → Sky Pillar (**both
states cleared**, `climax_resolved`, renderer back to per-map
fields) → Juan (8) → Victory Road (Wally's payoff) → the Ever
Grande Conference (registration, both preliminaries, Morrison) →
**Tyson faced** (this drive's honest branch: WON — the upset
branch; completion rides the FACED predicate either way, the
anime-true narrow loss stands as the other branch) → Scott's
invitation at the conference → `hoenn_complete` → the Foundation
machine fires (ARC COMPLETE card, `regionsDone` gains hoenn,
Frontier directive pinned) → **the Regirock arc completed** (seal
turn-back unsolved → door stone (9,11) read → the standing beat
chosen at the sealstone → flee completes nothing → the seal
re-fires → catch; quest complete, dex registers Regirock) → **the
Deoxys forme switch exercised once** (ORBIT's rumour → the crater
meteorite (21,4) → Lv295 catch, dex 386 → the same meteorite
switches the party Deoxys to Attack forme preserving
level/XP/nickname/keepsake/moves, `deoxys_forme_touched` set, and
the save still validates with the switched forme) → ferry home
(CAPT MERIDIAN, Slateport → Vermilion) → Homecoming (Scott's
Frontier hook delivered, directive cleared, `story.arc` STILL
hoenn, NO `embark_frontier` — the sealed law H4b designed, asserted
as an absence).

**End-state assertions (H35 + D08, on the final snapshot):**
`regionsDone = [kanto, orange, johto, hoenn]` exactly;
`badges.hoenn` = the 8 badges in canonical earn order (the full
order asserted at H25 and again at H35); the Verdanturf ribbon
held; dex caught includes Regirock and Deoxys (386, the Hoenn
horizon; the drive's honest caught count is 13 — it never claimed
a dex it didn't walk); Hoenn reads `complete` on the registry;
the final save validates through **both** the server validator
and the client schema (D08, whose snapshot now sits at the true
end of the drive — the Hoenn leg re-stamps `__CHAINSAVE__` after
H35, so D08 proves the Hoenn-complete file, not the Johto one).

### 3. Two superseded checks, both named (the J7a C28 practice)

At `01918eb` the unmodified J7a drive stood at **86/88**: exactly
J29 and J31 failed, each with the H4a registry flip's signature.
Both were A/B-verified against a stashed `eaac542` worktree: the
original drive (original J29/J31 text restored, Hoenn section
absent) passes **88/88 there**. Neither is a regression; both are
the flip working as designed, and the stage suites prove the same
flows (hoenn-story B02, johto-systems' band-floor hatch).

1. **J29 — Homecoming #3 advances.** Written at J7a, when Hoenn
   was sealed, it asserted the homecoming leaves `arc = johto`
   with no embark. Since H4a shipped the arc, the same homecoming
   advances `arc = hoenn` and arms `embark_hoenn` (the failure
   extra read exactly `{hook: true, arc: 'hoenn'}`). J29 now
   asserts the shipped behaviour, keeping its subject (hook
   delivered, directive cleared).
2. **J31 — the gift egg hatches at Lv201, not Lv101.**
   `hatchMon` hatches at the CURRENT arc's band floor (a registry
   read: `band.min` of `currentArcOf(state)`). The systems proofs
   run after Homecoming #3, which now advances the arc — so the
   floor the registry hands the hatch is Hoenn's 201, not Johto's
   101 (the failure extra read exactly `smoochum lv201`). J31 now
   asserts 201 and names the mechanism. The egg, the step hook,
   the dex registration are unchanged and still proven.

One drive-idiom fix, also named: H10's first run failed with
`menus=0` because the contest entrant (Snorlax, party slot 5) had
been left fainted by the H09 gym battles — a fainted entrant's
party-menu row is disabled, so the counter pick never landed.
`heal(g)` before the contest (the drive's own convention before
every major beat) fixed it; no game code was at fault, and the
re-run is 123/123.

### 4. The complete battery (this tree, 2026-10-29)

| Suite | Result | Note |
|---|---|---|
| chain-drive (H7a) | **123/123** | §2 above (88 + 35) |
| qa-changed-flows | failures exactly **{b2, d9}** | standing set, name-for-name |
| battle-model-checks | **45/45** | HARD GATE holds |
| campaign-smoke | **24/24** | |
| fidelity-checks | **35/35** | |
| hoenn-story-checks | **88/88** | |
| hoenn-contest-checks | **28/28** | |
| hoenn-legendary-checks | **24/24** | |
| johto-story-checks | **110/110** | |
| johto-systems-checks | **62/62** | |
| arc-foundation-checks | **47/47** | |
| cheat-shop-checks | 44/44 | |
| Track B (`run.mjs`) | **114/114** | |
| validator.test | **89/89** | |
| validator.fuzz.test | **2000/2000** | |
| save-contract.test | **10/10** | |
| qa-slice (verify-slice) | 132/134 | failures exactly **{s6, l8}** — §5.1 |
| verify-slice (own checks) | 48/48 | |
| rejuv-phase1-checks | 44/44 | |
| rejuv-phase2-checks | 38/40 | failures exactly **{A09, C01}** — §5.2 |
| rejuv-phase3-checks | 60/61 | C01 chromium-start, environmental |
| rejuv-phase4-checks | 50/51 | C01 chromium-start, environmental |
| rejuv-phase5-checks | 52/53 | C01 chromium-start, environmental |
| rejuv-phase6-checks | 44/45 | C01 chromium-start, environmental |
| orange-story / orange-climax | 38/38 · 42/42 | beyond the named list; run anyway |
| audit-headless | 17/17 | |
| config / failclosed / http-ip | 39/39 · 20/20 · 13/13 | beyond the named list; run anyway |
| gen-tables --check | clean | tables.json OK (395 species, 144 moves, 168 items) |
| budgets-check | all gates pass | §6 |

### 5. Discrepancies — investigated to named causes

**5.1 qa-slice {s6, l8} — standing, unchanged.** The identical
pair recorded at J7a §5.1 (A/B-proven there to predate Johto at
`445a195`); the failure texts are byte-identical this run. Not a
Hoenn regression; the open standing item stands.

**5.2 rejuv-phase2 A09 — standing; the assigned count did NOT
move this mission.** A09 reads `assigned=115` at HEAD, and the
A/B run in the stashed `eaac542` worktree reads `assigned=101`
with the identical failure set {A09, C01} at the identical 38/40.
The +14 delta is the Hoenn MAP_GROUND assignments landed by
H3/H4 (gyms + landmarks, deliberate and proven by hoenn-story
A10/A35) — the same growth-by-design J7a §5.2 and H4b recorded
(107 → 115 during H4); it has not moved since H4b. C01 across
phases 2–6 is the standing chromium cluster (the sandbox cannot
start chromium; base-identical, per J7a §5.3).

**5.3 The committed guest bundle is stale (pre-H5) — flagged,
not silently rebuilt.** `verify-slice` rebuilds all targets; its
fresh guest build differs from the committed
`dist/standalone.html` (198,516 B larger; first divergence at the
H5 module-order change — the committed bundle has no
`contest.mjs` segment). The vercel build, by contrast, reproduced
the committed `public/game.js` **byte-identically** (§6), so this
is staleness, not nondeterminism: the tree's guest bundle was
last built before H5, the same class of finding J7a §5.4 recorded
for `personal/`. `dist/` and `personal/` were both restored from
HEAD after the battery; whether the guest/personal editions get
a deliberate rebuild is an owner call, recorded here rather than
taken. (`personal/game.js` sha256 **f434ba63…**, re-verified
after restore — byte-identical, zero personal/ paths in this
stage's diff.)

### 6. Hoenn-close accounting vs H0 (the pack decision's closing audit)

Fresh build this stage (vercel, then guest), from unmodified
`01918eb` source:

- **`public/game.js`: 9,800,329 B** — byte-identical to the H6
  close (sha256 `4daaf7f4…`; `git status` clean on `public/`
  after the rebuild: the build is deterministic and this stage
  changed no game code).
- **Vercel static total** (the stage-register basis since H1:
  every file Vercel serves from `public/` — game.js 9,800,329 +
  index.html 91,560 + admin.html 52,951 + admin.js 18,111):
  **9,962,951 B — identical to the H6 close**, the number of
  record for Hoenn close.
- **Vs the 10,100,000 B re-open trigger: NOT crossed.** Margin
  **137,049 B**. The pack stage does not re-open.
- **Vs the H0 projection:** H0 measured on its own narrower basis
  (game.js + index.html only), under which this same build reads
  **9,891,889 B** — **+18,924 B (+0.19%) over the central
  projection 9,872,965**, comfortably inside the projected band
  **9,823,613–9,982,310**. On the stage-register basis the
  9,962,951 total also sits inside that band (19,359 B under its
  top). Either basis: Hoenn closes inside the H0 band, under the
  trigger, on the monolith H0 chose. The Arc-5 pack mandate and
  the Sinnoh-close thin margin recorded by H0 are untouched by
  anything in Arc 3.

### 7. Close state

- Changes in this stage: the chain drive (QA workspace, not a
  git tree — as at Foundation and J7a) + this register section.
  No game-code changes; no defect was exposed by the drive (the
  one drive failure encountered was the harness's own fainted
  entrant, §3). NOT pushed, NOT deployed.
- `personal/` byte-identical (sha256 f434ba63…).

**Arc 3 Hoenn is campaign-proven: one save, Kanto → Orange →
Johto → Hoenn → home, every badge in order, the climax's two
weather states witnessed and cleared, a ribbon, a Dive round-trip,
two legendary arcs (Regirock; Deoxys + its forme switch) closed
on the same file, and the full battery at its named counts. The
Foundation machine needed to learn nothing new: the Hoenn
completion, card, directive, ferry and sealed-Frontier homecoming
all rode the shipped machinery.**

## Arc 3 Stage H7b — INDEPENDENT QA: the verdict on Arc 3 Hoenn (2026-10-29)

**VERDICT: SHIP-WITH-NOTES.** No blockers found. Every mission claim was
re-driven independently by an agent that implemented nothing in this
mission: fresh QA drivers (QA workspace `arc3-h7b-qa/`), my own battery
re-runs, my own fresh re-run of the H7a chain drive, and real Chromium
captures via the local harness (production CSP). `personal/`
byte-identical at start and end (game.js sha256 `f434ba63…`);
`public/game.js` sha256 `4daaf7f4…` (the H7a close); the tree was clean
throughout except this section; nothing pushed or deployed.

### 1. The first Hoenn hour, by real inputs (`h7b-drive.mjs` A01–A09, 9/9)

From a Johto-complete state built in the chain drive's idiom:
Homecoming fires (arc → hoenn, directive cleared, embark armed, dialogue
names Hoenn/Birch) → Vermilion CAPT HOENN sails → Littleroot landing →
Birch rescue completes (Poochyena not faked into the dex) → lab arrival
→ May met → **Route 101 walked on foot** tile-by-tile over real onStep
calls (13 steps, exits into Oldale, no stall) → Petalburg: Wally beat
completes, Norman defers honestly (no Balance Badge) → Rustboro:
Roxanne beaten through the real leader path, Stone Badge first in
badges.hoenn. The arrival reads as a new region (palettes, weather,
NPC life). No dead sign, unwalkable surprise, or wrong-name text found.

### 2. Blind town identity (`arc3-h7b-qa/shots/towns-blind/`, key `town-key.json`)

All 16 settlements captured label-masked (locchip/objective/dex/hint
hidden; every capture locchip-verified before masking) from a
town-centre spawn, tags shuffled. **Identification: 16/16**, no confused
pair — strong: Fortree (walkways + rain), Pacifidlog (raft houses),
Sootopolis (white marble + lake), Fallarbor (ash ground), Mossdeep
(water channels), Lavaridge (volcanic soil + spring), Verdanturf
(flower meadows), Ever Grande (league marble), Dewford (beach +
shallows), Slateport (market stalls + dock); medium: Rustboro,
Mauville, Lilycove, Petalburg; weakest frame Oldale (plainest town,
identified correctly). Caveats: Notes 2–3 below.

### 3. Connectivity re-sweep, independent (`h7b-sweep.mjs`)

My own probe over the merged map data (engine WALKABLE + Surf water,
celadon discipline), all **99 Hoenn maps**: **0 bad warp landings,
every warp tile reachable from its map's entries**. DIVE_PAIRS: 10 spot
entries over 5 surface maps, cross-checked two-way in data and in live
play (§5). **Sootopolis has no outdoor warp-in at all** — warp-ins only
from cave-of-origin and its own gym — so it is reachable only via the
r126 dive pair, as designed. 7 maps carry small unreachable decorative
strips (Note 4).

### 4. Band law (`h7b-validator.mjs` 6/6 + drive D/E)

My own constructed saves, both validators: a hoenn-arc save carrying
Lv201 + Lv250 + Lv300 (slow-curve max XP) is ACCEPTED by server and
client and round-trips re-validating; the SAME party in a johto-arc
save is REJECTED `bad-mon-level` by both; Lv301 in a hoenn save is
rejected at the cap boundary. Live play: a Lv300 lead fought the Lv285
Regice battle with its level read as 300 in-battle, no clamp error;
the Cheat Terminal stepper under story.arc='hoenn' caps at exactly
**Level 300** after 30 pagedowns in the live UI.

### 5. Systems spots, my picks — not the suites' paths (drive B/C/D/F/G)

(a) **Fallarbor contest** (suites drove Verdanturf + Slateport):
ContestScene from the counter, exactly 4 rounds playable — **WON**,
Fallarbor Ribbon persisted. (b) **Dive r126/Sootopolis pair** (suites
featured r124): descent refused without Mind Badge + Dive, fires with
both, ascent UNCONDITIONAL with badge and Dive stripped. (c) **Regice
arc** (H7a drove Regirock + Deoxys): boulders decline pre-reading,
EAST-first forgotten, WEST→EAST opens; flee completes nothing; the
seal re-fires; catch completes the arc + dex. (d) **Climax weather**
on Sootopolis in Chromium (`shots/weather/`): renderer states distinct
in data (heavy sun/climax vs heavy rain/climax vs per-map field) and in
pixels (drought↔deluge 67.8% strong-differing frame pixels; each
climax state vs clear 12–16% strong). (e) **Center exits**: voluntary
+ blackout exits in Rustboro, Mossdeep and Sootopolis all land on each
town's own door-front via (4,4), never the (4,5) fallback — the J6.5
regression class does not recur in Hoenn.

### 6. Independent battery re-runs (my runs, this tree)

| Suite | My result | Stage report |
|---|---|---|
| battle-model-checks | **45/45** | 45/45 |
| hoenn-story-checks | **88/88** | 88/88 |
| qa-changed-flows | failures exactly **{b2, d9}** | {b2, d9} |
| arc-chain chain-drive (re-run fresh by me) | **123/123** (Hoenn tail H01–H35 green) | 123/123 |

Nothing beyond the named inheritance sets ({s6, l8}, {A09, C01})
appeared anywhere in my runs. Logs in `arc3-h7b-qa/logs/`.

### Findings

- **Blockers: none.**
- **Note 1 — quest-log section order (inherited from J7b Note 3):**
  the Kanto MAIN STORY section renders above the HOENN section, so the
  first-hour Hoenn next step is found by scrolling past the Kanto list
  (A06's first 12 rows are all Kanto). Guidance is correct everywhere
  checked; findability only, now spanning three regions of backlog.
- **Note 2 — t08 (Littleroot) blind frame leaked its name:** the
  centre-spawn save landed on the Birch-rescue trigger, so the frame
  contains the narrator line "Around the bend of the Littleroot
  road…". Identification there was textual, not palette evidence; a
  real player gets that scene by design. Recorded so the 16/16 is not
  over-read; the other 15 frames carried no name text.
- **Note 3 — operator caveat (as J7b recorded):** I ran the captures,
  so tag order was not unknown to me; grades are the in-frame evidence,
  and every capture was locchip-verified before masking.
- **Note 4 — decorative unreachable strips:** 7 maps (rustboro 4
  tiles, verdanturf 2, fortree 13, r108 2, mt-chimney 2, mossdeep 2,
  sootopolis 1) hold small walkable-class strips no entry reaches —
  north-edge rows behind buildings/treelines, and two lone water tiles
  among r108's rocks. No warp, NPC, item, sign or encounter stands on
  any of them. Polish-grade scenery.
- **Note 5 — drought reads subtlest in stills:** drought (a warm
  heavy-sun wash) is the least distinct of the three climax states in
  a single frame; deluge's rain is unmistakable and the pixel diff
  proves all three differ materially. Presentation polish, not a state
  bug — the renderer returns the correct state in every phase.
- **Harness note (not a game finding):** the CDP boot was flaky across
  the capture run (terminal timeouts on ~5 of 19 boots, all recovered
  on retry; Slateport needed a dedicated re-run), with **zero JS
  errors** across all 19 successful boots — the same QA-harness class
  J7b recorded, not a game defect.

**Arc 3 Hoenn stands as shipped: the first hour guides and lands as a
new region, the band law holds on both validators and in live play at
the cap, the contest/Dive/legendary systems fire on paths the suites
never drove, Center exits land right, Sootopolis is dive-only, and all
16 towns are tellable apart from a single frame. SHIP-WITH-NOTES, the
notes being §6's log order, two test-method caveats, a handful of
decorative unreachable tiles, and the drought signature — none of them
a player's blocker.**

## Arc 3.5 Stage F0 — Battle Frontier: Symbol quintet + Frontier arming (2026-10-29)

Base 8225dd1 (Hoenn complete, QA SHIP-WITH-NOTES). ONE commit.
`personal/` byte-identical (restored from HEAD after builds; zero
personal/ paths in the diff). Never pushed, never deployed (owner
order: deploy once, when the arc chain is completely done).

### The Symbol quintet — five places at once (Hoenn's law, mission §1)

The Frontier's badge set is slot-shaped, and the quintet landed in
one commit, before any facility exists:

1. **ITEMS** (src/data/items.mjs): 7 Symbol rows, key pocket, Emerald
   names, original flavour text — abilitysymbol (Tower),
   knowledgesymbol (Factory), gutssymbol (Arena), tacticssymbol
   (Dome), lucksymbol (Pike), spiritsymbol (Palace), bravesymbol
   (Pyramid). The rows are the case/display record of an earned
   Symbol; the earned STATE is badges.symbols, never the bag.
2. **BADGE_SETS.symbols** = ['tower', 'factory', 'arena', 'dome',
   'pike', 'palace', 'pyramid'] — the SLOT ORDER: facility ids, not
   item ids, not an earn order. Slot i of badges.symbols belongs to
   facility symbols[i]. Nothing prefix-reads this list.
3. **defaultState** (src/game/state.mjs): badges.symbols already
   seeded [null x7] since the foundation — verified, NOT duplicated.
4. **Client schema** (src/save/schema.mjs): validate-if-present —
   exactly 7 entries, each null | 'silver' | 'gold', else
   `bad-badges-symbols` (the bad-badges-<set> idiom). The save-FILL
   preserves earned tiers and repairs only shape: non-array ->
   all-null, wrong length pads/truncates with nulls, invalid entries
   -> null. A legitimately earned tier is never rewritten on load.
5. **Server validator** (api/_lib/validator.mjs): the v1 hard-reject
   ("all 7 symbol slots locked") is REPLACED with tier validity:
   absent ok; if present, an array of exactly 7 with each entry
   null | 'silver' | 'gold', else `bad-symbols`. NO prefix check —
   checkBadges runs only kanto/orange/johto/hoenn through
   badgeSequences; symbols are unordered slots (suite proof: slot 6
   'gold' with slot 0 null validates on BOTH validators; a bad tier
   fails on both). The bag cap tracks the ITEMS table as at J6/H4a:
   168 -> 175.
   **Summary-count call (decided here, on the record):** the summary
   badgeCount INCLUDES the non-null symbol slots
   (kanto + orange + johto + hoenn + symbols). It is the total
   honors count, and the registry's own badgeCountFor counts symbols
   exactly this way for the Frontier's arc card — leaving them out
   would report a Frontier-complete save as holding fewer badges
   than a Hoenn-complete one. Pinned by frontier-checks A11.
6. **gen-tables** (tools/api-scripts/gen-tables.mjs): tables.json
   regenerated ONLY via the tool (`--check` green, 175 items). The
   generator deliberately emits NO badgeSequence and NO
   regionBadgeMax row for symbols — there is no prefix to check —
   and the slot list could not pass its ITEMS filter anyway
   (facility ids are not item ids). A comment in the generator
   records the exclusion so a future stage does not "fix" it.

### Cheat Terminal check — the leak was real, and is closed

openCheatShop builds badge stock from BADGE_SETS. Two leaks found on
inspection: (a) `Object.values(BADGE_SETS).flat()` would have carried
the facility ids into the badge-stock id list; (b) the REAL leak —
the Symbol ITEMS rows are key-pocket, so they would have been
claimable through the Key Items section (and cheatClaimBadge's set
search would have resolved a facility id into the symbols set and
written into the slot array). Both are now excluded explicitly at
the read site with comments: BADGE_IDS skips the 'symbols' entry,
stockOf filters the 7 symbol item ids out of EVERY section, and
cheatClaimBadge's set search skips 'symbols'. Symbols are
earned-only. The cheat-shop suite stays **44/44** with its total
unchanged; its one legitimate ripple is the tables count inside
A02, superseded by name below — nothing else in the suite moved
(the maximal-stock saves, which now hold all 175 items, validate
server-side under the raised bag cap).

### Arming (mission §2)

- **Registry:** the frontier row's status 'sealed' -> 'shipped' in
  src/data/arcs.mjs. Nothing else in the row changed (band null,
  horizon 386, pallet -> frontierhub, Scott hookLines all already
  correct, consumed not rewritten).
- **Save-fill catch-up** in deriveArcDefaults (called from
  fillV2Defaults on every load), GENERIC — it names no region: for
  each arc A in registry order with status 'shipped' or 'next', if
  hook_<A> and homecoming_<A> are set, story.arc is still the
  previous arc's id, and the previous arc's completion is met
  (regionsDone or its completionFlag, via arcCompletionMet), it sets
  story.arc = A.id and embark_<A> = true — exactly what the
  homecoming would have done had the arc been shipped when it
  fired. This repairs Hoenn-complete saves that consumed the SEALED
  Frontier homecoming in an earlier build (hook + homecoming set,
  arc stayed hoenn, no embark). It cannot fire while a homecoming
  is still pending (no homecoming flag), nor once story.arc has
  advanced, and it is idempotent; the registry-order loop does not
  break, so stacked sealed homecomings would repair in one load.
  It sets exactly the two things the brief names — arc + embark;
  story.region is left as stored (the live homecoming sets it in
  its own path). Four fixtures pin it in frontier-checks A13–A17
  (consumed-sealed by regionsDone AND by completionFlag, mid-Hoenn
  untouched, already-advanced untouched, pending untouched).
- **CAPT FRONTIER** appended to Pallet's roster via the TALE_NPCS
  append idiom in src/data/quests.mjs, copied from CAPT JOHTO /
  CAPT HOENN: ferry 'frontierhub', ferryArc 'frontier', sailor art,
  original dialogue (the short island crossing + Scott's
  invitation). Placement evidence: (12,8), one tile east of CAPT
  JOHTO, was tried FIRST and REJECTED — celadon-sweep showed it
  seals the (13,8)/(14,8) pocket (its only exit) into a second
  fragment. The captain stands at **(11,9)**, one tile south of
  CAPT JOHTO in the open south field: before, Pallet swept 1
  component / 85 reached / all warps PASS; after, 1 component /
  84 reached (the captain's own tile) / all warps PASS from every
  entry. frontier-checks A20–A21 pin the tile + the one-fragment
  graph in-suite.

### Supersessions, by name (the C28 pattern — subjects kept)

- **hoenn-story A37**: SUBJECT was the Frontier registry row
  consumed-not-rewritten — the sealed-era expectation (status
  sealed, arcStateOf 'sealed') now observes the shipped row:
  status 'shipped', arcStateOf 'locked-next' with the directive
  pinned. Hook/hookLines assertions unchanged.
- **hoenn-story B51**: SUBJECT was the Frontier homecoming riding
  the machine (hook delivered in dialogue, directive cleared) —
  it now takes the machine's SHIPPED branch: story.arc advances
  to 'frontier' and embark_frontier IS armed. The hook-delivered
  and directive-cleared assertions are unchanged.
- **Item-count supersessions (the H4a class — the quintet adds 7
  ITEMS rows, 168 -> 175):** hoenn-story A16, cheat-shop A02,
  johto-story A15, johto-systems A24. In each, only the count
  moved; every other assertion in those checks stands as written,
  and each suite's TOTAL is unchanged (88/88, 44/44, 110/110,
  62/62).
- **arc-foundation needed NO supersession** (47/47 as written —
  no assertion in it subjects the Frontier's sealed state).
- validator.test's 'reject non-null symbol slot (v1 lock)' needed
  no edit: its mutation ('x') is an invalid tier, so its subject —
  a bad-symbols rejection — still holds under tier validity.

### Battery + build (this tree, 2026-10-29)

- **NEW tests/frontier-checks.mjs: 27/27** (21 pure + 6 bundle:
  quintet 1:1, both validator pairs, fill preserve/repair, the
  four derivation fixtures, captain placement + one-fragment
  graph; bundle: captain on Pallet's live roster, the ferry gate
  line with embark_frontier deleted and NO warp — the crossing
  itself is NOT proven here, frontierhub does not exist until
  F1 and its proof belongs to F1 — and the live Cheat Terminal
  carrying no symbol in badge or key stock, with direct
  cheatClaimBadge('tower'/'abilitysymbol') refusals).
- qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); validator **89** + fuzz **2000/2000** + save-contract
  **10/10**; arc-foundation **47/47**; hoenn-story **88/88**;
  cheat-shop **44/44**; johto-story **110/110**; johto-systems
  **62/62**; campaign-smoke **24/24**; fidelity **35/35**;
  hoenn-contest **28/28**; hoenn-legendary **24/24**; orange-story
  **38/38**; orange-climax **42/42**; gen-tables --check green;
  Pallet celadon-sweep PASS (1 fragment, all warps).
- **public/game.js: 9,808,323 B** (+7,994 vs the H7b close of
  9,800,329 B), byte-stable: two consecutive
  `node scripts/build.mjs` runs produce the identical sha256
  (578905a577dd…). Public static total 9,970,945 B vs the
  10,100,000 B trigger — margin 129,055 B. `personal/`
  byte-identical; dist/ restored (the guest bundle stays as
  flagged at H7a).

### What F1 inherits

- The crossing proof: CAPT FRONTIER's allowed path (embark armed
  -> Sail menu -> en-route card -> landing on frontierhub) can
  only be driven once frontierhub exists (F1's maps). The gate
  half is proven now; the sail half is F1's first bundle check.
- The Symbol award path (Silver sets a slot, Gold upgrades it,
  the 7th Gold writes frontier_complete) is F2/F3's build — F0
  ships only the state, its validators, and its arming.
- A Hoenn-complete save that already heard Scott's invitation
  now loads as a Frontier save (arc + embark derived); a save
  mid-homecoming (directive pinned, not yet home) still walks
  the ritual live, through the shipped branch.

### F0.1 addendum (2026-10-29, coordinator catch)

- The derivation's catch-up mirrored only half of the homecoming
  advance: `tryHomecoming`'s `finish()` sets `story.arc`,
  `story.region = next.regionKey`, and `embark_<id>` together,
  but the F0 catch-up set arc + embark only — leaving a repaired
  save at arc 'frontier' with region still 'hoenn', while
  `openRegions()` reads `story.region` as the current region.
  F0.1 pins the derivation to the machine's own advance in full:
  the catch-up branch now also sets
  `story.region = a.regionKey` (the arc being advanced into).
  Nothing else changes.
- The pin is asserted in tests/frontier-checks.mjs: the
  consumed-sealed fixtures (A13 regionsDone form, A14
  completionFlag form) assert `story.region === 'kanto'`
  (frontier's regionKey) after derivation, A13 idempotently;
  the mid-Hoenn (A15) and already-advanced (A16) fixtures assert
  region untouched.
- Battery (this tree): frontier-checks **27/27**;
  arc-foundation **47/47**; hoenn-story **88/88**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**.
  **public/game.js: 9,808,355 B**, byte-stable (build x2, same
  sha256 986daf919393…). `personal/` byte-identical.

### F0.2 addendum (2026-10-29, coordinator ruling)

- One divergence from `tryHomecoming`'s `finish()` remained after
  F0.1 (reported by F0.1, ruled a fix by the coordinator):
  `finish()` also stamps the arc-start snapshots —
  `story.arcDexStart` = the dex caught count at advance and
  `story.arcStartPlaytime` = the playtime at advance — but the
  catch-up set neither, so a repaired save kept its previous
  arc's stamps and its ARC COMPLETE card (arcCompleteSummary
  reads both) would overstate "Pokedex gained this arc" and
  "Playtime this arc". F0.2 completes the mirror: the catch-up
  branch in `deriveArcDefaults` now also sets
  `story.arcDexStart` and `story.arcStartPlaytime` from the
  `caughtCount` / `playtimeSec` it already receives (truncated,
  non-negative, matching the function's tail normalization).
  The derivation now mirrors `finish()` in full — arc, region,
  embark, both snapshots. Nothing else changes.
- The pin is asserted in tests/frontier-checks.mjs: the
  consumed-sealed fixtures now carry observable totals (260
  caught / 54321s played against the carried Hoenn-era stamps
  151 / 40000); A13 (regionsDone form) and A14 (completionFlag
  form) assert `arcDexStart === 260` and
  `arcStartPlaytime === 54321` after derivation, A13
  idempotently on a second fill; the mid-Hoenn (A15) and
  already-advanced (A16) fixtures assert their stamps
  untouched (151 / 40000).
- Battery (this tree): frontier-checks **27/27**;
  arc-foundation **47/47**; hoenn-story **88/88**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**.
  **public/game.js: 9,808,494 B**, byte-stable (build x2, same
  sha256 3fa1145b560d…); public static total 9,971,116 B vs
  the 10,100,000 B trigger (margin 128,884 B). `personal/`
  byte-identical; dist/ restored.

### F1 — Hub + facility maps (2026-10-29)

- **NEW `src/data/maps8.mjs`** (generated by
  `~/workspace/ashs-journey-qa/frontier-f1/gen_maps8.py`,
  deterministic — edit the generator, never the output), folded
  into MAPS by `merge.mjs` and loaded after maps7 in
  `scripts/module-order.json`. **11 maps:**
  `frontierhub` 40×24 (outdoor, weather clear, NO wild
  encounters); `frontier-tower` 20×15; `frontier-factory` 20×14;
  `frontier-arena` 18×13; `frontier-dome` 24×17 (the largest
  interior); `frontier-pike` 16×83 (one map, see below);
  `frontier-palace` 20×14; `frontier-pyramid` 18×12 (entrance
  hall); `frontier-pyramid-a/-b/-c` 22×16 each (dark mazes).
- **Hub.** South-shore dock pier (boardwalk) — the map `start`
  (18,21) is ON the pier, the ferry landing (newbark precedent).
  CAPT BREAKWATER stands on the pier (`ferry: 'pallet'`,
  `ferryArc: 'frontier'`, original dialogue); SCOTT stands by
  the plaza–dock path (greeting + flavour only; story beats are
  F3). Center door → shared `center` (4,4) WITH via, Mart door →
  shared `mart` (5,5) WITH via (decision #9 — lastCenter lineage
  works on the island). SEVEN facility buildings, each a distinct
  roof-form family + facade (terra+gym-sign Tower, slate+lab
  Factory, teal Arena, terra+gym-sign 8-wide Dome, slate+brick
  Pike, terra+house Palace, tower-stone Pyramid, slate+mart-sign
  Mart); facility doors follow the gym idiom (interior exits name
  the hub front tile directly). Plaza avenues, lamps, flowerbeds,
  fences, an east garden (league fountain, benches, sundial).
- **Interiors.** Each facility interior carries exactly ONE
  receptionist behind a counter row near the entrance, marked
  `frontier: '<facilityId>'` (slot order tower/factory/arena/
  dome/pike/palace/pyramid), greeting dialogue naming the
  facility and its Brain (Anabel/Noland/Greta/Tucker/Lucy/
  Spencer/Brandon — original writing; rules text is F2/F3).
  Every Brain dais (podium λ) is EMPTY — no Brain NPCs. Tower =
  league hall + red carpet; Factory = lab/plant set + fenced
  rental pens (gate gaps, never sealed); Arena = dojo with a
  battlemat centre; Dome = arena bowl (step ring, statues,
  fountains); Palace = garden-palace (sofa/piano/harp/fireplace).
  Music mirrors shipped interiors: hub `pallet-theme`, the seven
  interiors `gym-theme`, the dark floors `pewter-theme`.
- **Pike one-way geometry (F2-consumable).** ONE map: entrance
  hall (rows 73–82, start (7,81), hall exits → hub) + seven
  chambers (9 rows each) + the dais chamber (rows 0–9, Lucy's
  ground, EMPTY). Each chamber's THREE north-wall doors (x=3/7/11)
  ALL warp to the NEXT chamber's entry row at the same spread x —
  the door CHOICE is geometric; F2's engine assigns the events.
  No warp leads back; the only exit is the dais chamber's north
  doors → the entrance hall. Sweep proof: from EACH of the 3
  entry landings of EACH chamber, all 3 doors are reachable —
  all 3^7 = 2187 door-choice paths land-valid — and the dais →
  hall exit fires.
- **Pyramid.** Entrance hall: reception + empty keeper's dais +
  exit → hub; its inner north doors warp to floor A's entry.
  Floors A/B/C are DISTINCT dark mazes (`dark: true` + `indoor:
  true`, the shipped cave-light field; stone set M/Q at the
  entrance, cave set G/L on the floors), each with an entry
  landing, a lit exit doorway (door tile flanked by cavelanterns)
  warping to the NEXT floor's entry in the fixed cycle
  a→b→c→a (F2 counts transitions for the floor number), and 3
  static item balls in the shipped items[] idiom. Sweep proof:
  every floor's entry reaches its exit, no sealed walkable
  pockets.
- **Sweep** (`frontier-f1/frontier-sweep.mjs`, celadon/hoenn
  discipline): all 11 maps PASS — every paired map is ONE
  walkable fragment from every entry/warp landing reaching every
  warp (shared center/mart as connectors to fixpoint); every
  warp landing walkable incl. center (4,4) / mart (5,5); the
  pallet-rooted map graph reaches 11/11 new maps.
- **Richness** (`frontier-f1/frontier-richness.mjs`, Premium+ W5
  logical-raster idiom): frontierhub **215** unique colours
  (floor 80); interiors: tower 71, factory 101, arena 70, dome
  74, pike 71, palace 74, pyramid 65, floors A/B/C 59/61/63
  (floor 55). Tile-kind Jaccard across all 11 maps: **max 0.500**
  (tower~dome; target ≤ 0.60). Two re-dresses on measurement:
  the Dome's O1 stadium floor/wall measured colour-poor (35) —
  it now rides league wall + gym floor with its identity in its
  unique props; Pyramid C's props were swapped (rubble/
  sandcolumn) to break a 0.636 pair with A.
- **Bundle (tests/frontier-checks.mjs, grown 27 → 66):** Part A2
  pins the map idioms purely (A22–A29). Part C proves **THE
  CROSSING** on the live bundle: post-arm fixture — Pallet, talk
  CAPT FRONTIER, sail menu, en-route card, land on the hub dock
  start (18,21) with `reachedarc_frontier` set; the return leg
  with `embark_frontier` DELETED still sails to Pallet
  (unconditional return, NO-SOFT-LOCK). **Walking drives, no
  position seeding:** dock → each of the 7 facility doors +
  Center/Mart doors → inside → exit warp → hub; the full Pike
  run on foot (hall → left door of all 7 chambers → dais →
  dais exit → hall → hub); the Pyramid floor cycle on foot
  (a→b→c→a landings exact).
- **F2 inheritances:** the `frontier: '<facilityId>'` receptionist
  markers are the facility entry seam; the Pike door CHOICE is
  geometric only (events are F2's); the Pyramid floor cycle is
  geometry only (floor counting + traversal control are F2's);
  Brain daises are empty by design (Brains are F3); no state
  changes this stage (validator + save-contract untouched, no
  ripple).
- Battery (this tree): frontier-checks **66/66**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign-smoke **24/24**; arc-foundation **47/47**;
  validator **89** + fuzz **2000/2000** + save-contract **10/10**;
  gen-tables --check green (untouched). **public/game.js:
  9,837,803 B**, byte-stable (build ×2, same sha256 ce8b6130…);
  public static total 10,000,425 B vs the 10,100,000 B trigger
  (margin 99,575 B). `personal/` byte-identical; dist/ restored.

## Arc 3.5 Stage F2a — Battle Frontier: BattleScene facility seams + run state + Tower/Factory (2026-10-29)

- **Scope (mission F2, commit 1 of 3):** the `opts.facility`
  BattleScene seam (decision #3), the `state.frontier` run state
  with the full J6 persistence treatment, `src/data/frontier.mjs` +
  `src/game/frontier.mjs` (new), the receptionist dispatch, and the
  Tower + Factory drivers end-to-end. Arena/Dome/Palace drivers
  ride this commit's seams (the judge + autoAlly are proven at the
  seam level here); their facility drives land in F2b, Pike/Pyramid
  in F2c.
- **The facility seam (battle.mjs, all opt-in; nothing moves for
  ordinary battles — battle-model 45/45):** `facility = { id,
  maxTurns?, judge?, autoAlly?, partyOverride?, pyramidBag? }` and
  call sites pass `rt: false` (classic engine only — the RT
  exclusion, tutorial/Safari precedent). Setting facility folds
  into the friendly branch: defeat costs no money and warps
  nowhere. `winTrainer` under facility pays NO prize (generated
  trainers also carry `reward: 0` — flag + data, two locks), writes
  NO `beat_<id>` flag (run-battle ids are unique per battle; the
  writes would burn the 500-flag budget on noise), and the badge
  block never fires (facility trainers carry no `badge` field).
  `awardXpFor` returns at the gate under facility — no XP, Open
  Level stays honest. The command-phase BAG is refused with an
  original line ("The Frontier supplies the contest — your bag
  stays closed."), EXCEPT `pyramidBag` mode, whose menu lists ONLY
  `state.frontier.pyramidBag` and whose uses consume from the run
  bag (through the shipped `useBattleItem`/`applyMedicineTo`).
  Balls at facility WILDS are refused in `beginCatch` before any
  decrement ("Frontier grounds. Nothing here can be taken home.").
  RUN is disabled under facility.
- **partyOverride read-routing (the audit the brief asked for):**
  ROUTED through `allyTeam(g)` — `firstAble` (lead), `openPartyMenu`
  (rows + switch target), `useBattleItem` (targets + consumption
  source), the faint `anyLeft` continuation check, and the
  end-of-battle temp-state reset — which under an override resets
  ONLY the actual battlers (override team ∪ participants ∪ ally),
  never the whole party: that precision is what makes the Factory's
  byte-identical-party proof true. DELIBERATELY LEFT on
  `state.party` — `catchSuccess`'s party/box push (unreachable:
  balls are refused under facility), `_shiftApplies` /
  `_openShiftParty` (unreachable: Shift never applies to friendly
  battles, and facility folds into friendly), and the winTrainer
  partner-mood read (cosmetic, real-party by definition).
- **Judge + autoAlly seams:** per-side counters exist ONLY under
  facility (`facilityStats`): distinct moves + attempted stamped at
  the accuracy gate in `execMoveContinue`, landed stamped where
  damage applies / in `applyStatusMove`; Body is read LIVE via
  `facilityTeamStats` (foe fractions exact via `foeMaxTrail`, the
  per-foe maxHp recorded as each foe enters, immune to tuneFoeMon's
  IV rescale). At the command-phase gate (`toCommand`), when
  `turn > maxTurns` unresolved, `resolveJudge` speaks the card and
  ends through the normal win/defeat paths. The foe's move-choice
  code was EXTRACTED verbatim into module-level `aiActionFor`
  (foe behaviour unchanged); Palace `autoAlly` runs the ally
  through the same helper at the same gate.
- **Run state (the J6 treatment, all four legs):** `state.frontier
  = { records, run, pyramidBag }` in defaultState (fresh builders
  in data/frontier.mjs `RECORD_FIELDS`/`freshRecords`); client
  schema validates-if-present (`bad-frontier*` codes) and
  `fillV2Defaults` rebuilds the closed shapes (a malformed run
  drops to `null`, records survive); the server validator mirrors
  it (rentals through the FULL `checkMon`, bracket/events/spots
  bounded shapes); gen-tables emits `frontierFacilities` (from
  `BADGE_SETS.symbols` — the slot order is the single source) and
  `frontierPikeEvents` (from data/frontier) and tables.json was
  regenerated BY THE TOOL ONLY. Save-contract GREW 10 → 12 pins
  (F2 mid-run payload → 200; unknown facility → 422) — recorded
  here per the brief. Records per facility: set facilities
  `{bestStreak, totalWins}`; dome `{tournaments, tournamentWins,
  bestFinish}` (bestFinish = deepest round index, 0=R16 … 4=champion);
  pike `{bestRun, totalRooms}`; pyramid `{bestFloor, runs}`. ONE
  active run across all facilities: starting B with a run open in A
  closes A's run at the desk, honestly, before it happens; the
  active facility's desk offers Resume / Retire.
- **Controller (game/frontier.mjs) + data (data/frontier.mjs):**
  facility defs keyed by the slot order (Brains Anabel/Noland/
  Greta/Tucker/Lucy/Spencer/Brandon), authored species pools
  (roster-only, no legendaries/mythicals, no form entries — the
  closed `LEGENDARY_IDS` list is suite-checked against every pool;
  Brain teams are authored and exempt, Brandon's Regis being the
  brief's own mandate), original name pools, Brain teams (species +
  ace keepsake ONLY — the shipped trainer-def format has no moves
  field, so authored moves are not expressible and none are
  claimed), Emerald milestone numbers. Entry dispatch: NPCs with
  `frontier: '<id>'` route in the sysNpc chain beside
  `npc.cheat`/`npc.ferry` to `startFrontier`. Entry = the contest
  party-pick idiom (exactly 3 able non-egg mons; <3 able → honest
  refusal), `foeLevel` = the entered top, the entered team healed
  at booking and fighting via partyOverride — `state.party` is
  never swapped. The shared award helper strikes the slot, plays
  the badge fanfare, and sets `story.flags.frontier_complete` when
  the seventh slot turns gold (the machine fires the card from the
  flag alone; the helper never calls it).
- **Tower:** sets of 7, heal between battles, set boundary offers
  Continue / Rest (run persists) / Retire. Anabel at battle 35
  (slot null → Silver) and 70 (slot silver → Gold), authored teams;
  a Brain win awards and the streak CONTINUES.
- **Factory:** foeLevel = the top level among the player's ABLE
  party (no team is entered — recorded adaptation of the entry
  rule). Draft 6 rentals at foeLevel, pick 3; rentals live ONLY in
  run state + partyOverride. After each win, the swap offer (one of
  theirs for one of yours, or decline); the received rental is a
  FRESH Factory stamp of the species faced — the Factory re-issues
  rentals between rounds (recorded adaptation). Noland at 21/42.
  The run records a JSON snapshot of the real party at draft
  (`run.realPartyNote`); the suite proves the party byte-identical
  after draft + battle + swap.
- **Tests (tests/frontier-checks.mjs 66 → 91):** Part A3 pure
  (A30–A35): defs ↔ slot order 1:1, pools legendary-free,
  defaultState shape, client schema accept/reject, save-fill
  round-trips (mid-run with rentals + bracket), server validator
  parity. (The controller's pure helpers are unit-checked in the
  bundle driver — the game layer does not import standalone; the
  suite says so.) Part D bundle (D0A–D15): judge formula cases
  (caps; tie → loss), generation (foeLevel teams, reward 0, no
  badge field, unique ids), Dome teamPower; the seam laws driven
  directly (bag refusal, no prize/flag/XP, friendly defeat, ball
  refusal unspent); judge fired once at the cap + judged win/loss
  paths + KO-before-cap never judges; Tower honest set of 7 +
  retire; Anabel Silver at 35 and Gold at 70 (streak seeded per
  the B09 precedent, milestone battles launched by the shipped
  path; other slots asserted untouched); Factory draft/swap/
  byte-identity; Noland Silver at 21 (seed 7216 — drafted rentals
  fight at exact parity and the two driven battles are honestly
  losable on ~1 in 4 sampled seeds; the fixed seed is
  deterministic). Test-kit note: drive teams carry NO Hyper Beam —
  its recharge turn is a free foe hit and HB kits provably wipe at
  Lv100 (found by drive telemetry, recorded here).
- Battery (this tree): frontier-checks **91/91**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign-smoke **24/24**; arc-foundation **47/47**;
  validator **89** + fuzz **2000/2000** + save-contract **12/12**
  (grown, see above); cheat-shop **44/44**. **public/game.js:
  9,899,650 B**, byte-stable (build ×2, same sha256 6c705e10…);
  public static total 10,062,272 B vs the 10,100,000 B trigger
  (margin 37,728 B — F2b/F2c must stay lean). `personal/`
  byte-identical; dist/ restored.

## Arc 3.5 Stage F2b — Battle Frontier: Arena judge + Dome bracket + Palace autoAlly drivers (2026-10-29)

- **Scope (mission F2, commit 2 of 3):** the remaining set/bracket
  facility DRIVERS on the F2a seams — Arena (maxTurns + judge in
  real sets), Dome (the 16-entrant tournament), Palace (autoAlly
  sets) — plus their bundle drives. No new engine surface: the
  judge, counters and autoAlly all shipped in F2a and are exercised
  end-to-end here.
- **Arena (driver wiring in `launchSetBattle`):** every Arena
  battle carries `facility { maxTurns: 3, judge: judgeArena }` and
  generated Arena trainers field ONE mon (recorded in F2a's data
  header: the 3-turn judgement is a single-battler law; Brain
  battles field the authored 3). **Judge formula (data-authored,
  recorded):** Mind = distinct moves used (cap 4) · Skill = attacks
  landed (cap 6) · Body = round(3 × team's remaining HP fraction);
  higher total wins; **a tie resolves as challenger loss** — the
  Frontier demands a winner (recorded adaptation). The judge speaks
  the card (totals stamped onto the stats objects by judgeArena)
  and the battle ends through the normal win/defeat paths.
- **Dome:** one tournament = 16 entrants (the player at seed 0 +
  15 generated name/team specs), serialized in `run.bracket`
  `{ entrants, round, alive, results }`. Player matches are real
  battles (R16/QF/SF/F, heal between); **non-player matches are
  simulated by team power** — the sum of the entrants' level-scaled
  stat totals from real `makeMon` builds — **with an rng upset
  roll** (the underdog takes ~22% of pairings; equal power is a
  coin flip), and every result is narrated by name between rounds
  and recorded in the bracket. Tucker is the FINAL opponent of
  tournament 5 (Silver) / 10 (Gold) when the player reaches that
  final; other finals are generated aces; losing before a milestone
  final earns no symbol (canon). Tournament count persists in
  records across runs. **Controller fix found by the drives:** the
  next match now LAUNCHES from the narration callback ("the desk
  calls your name") — the first cut left advancement to a desk
  Resume talk, which stranded the bracket mid-tournament for any
  player who believed the narration line.
- **Palace:** sets of 7 with `facility { autoAlly: true }` — the
  ally's move each turn is chosen by `aiActionFor`, the SAME helper
  the foe uses (extracted in F2a, not forked). **Recorded
  adaptation:** the forced send-out after a faint stays
  PLAYER-chosen (it is not a move choice) — the bundle drive proves
  a full battle completes with zero command input while the faint
  prompt still opens for the player. Spencer at 21/42.
- **Tests (tests/frontier-checks.mjs 91 → 99, Part D grows
  D16–D23):** Arena — a fixture-stalled battle reaching the judge
  and winning the card (Mind 2 vs 1 on two distinct status moves),
  the honest set of 7, a CONSTRUCTED judged loss (Splash vs Body
  Slam: Body decides against the challenger, run closes, nothing
  recorded), Greta Silver at 14. Dome — one full honest tournament
  (all 11 non-player results in the bracket record), Tucker final
  at tournament 5 → Silver. Palace — the zero-input battle + faint
  prompt, Spencer Silver at 21. **Driver lessons recorded for the
  suite's future authors:** driveBattle drives ONE scene per call
  with a scene-bounded drain and samples hooks before draining (a
  scene-blind drain swallows whole autoAlly battles — it produced
  three separate ghost failures before it was understood); entry
  flows single-step via `enterRun` for the same reason; a battle
  fixture that rewrites a mon's moves must restore them (the stall
  fixture left the set's lead unarmed for battle 2).
- Battery (this tree): frontier-checks **99/99**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign-smoke **24/24**; arc-foundation **47/47**;
  validator **89** + fuzz **2000/2000** + save-contract **12/12**;
  cheat-shop **44/44**. **public/game.js: 9,899,849 B**,
  byte-stable (build ×2, same sha256 00b1b832…); public static
  total 10,062,471 B vs the 10,100,000 B trigger (margin
  37,529 B). `personal/` byte-identical; dist/ restored.

## Arc 3.5 Stage F2c — Battle Frontier: Pike chambers + Pyramid climb (2026-10-29)

- Scope: the last two facility drivers on the F2a seams — the Pike's
  pre-rolled chamber events with Lucy on the dais, and the Pyramid's
  run-gated floors, seeded spots, step encounters, Pyramid Bag, floor
  law and Brandon on floor 7. Stage F2 is complete with this commit
  (F2a 2f8de4b · F2b 4484ca5 · F2c this commit).
- **The warp-landing hook (new seam, recorded):** neither shipped
  seam can see a Pike chamber entry — loadMap appends run before
  the player's landing tile exists, and onStep never fires for a
  warp landing. `OverworldScene.doWarp` is the ONE funnel every
  warp passes (direct call, warpFx fade midpoint, reduced-motion),
  so it now captures the origin map at entry and, after the landing
  completes (position set, autosave done), calls
  `sysWarpLanding(to, from)` → `frontierOnWarpLanding`. All Pike /
  Pyramid warp law lives behind that one call; nothing else in the
  warp path moved.
- **Pike pre-roll + hint honesty:** at run start the whole run is
  rolled ONCE from the authored weighted table (battle-trainer 22,
  battle-wild 22, heal-full 8, heal-half 10, cure-status 8,
  inflict-status 10, quiet 10, hint 10 — of 100) into
  `run.events[7][3]`, persisted in the run. A chamber fires exactly
  when a warp lands on one of its three entry tiles (door from the
  landing x ∈ {3,7,11}, chamber from the entry-row y) AND it is the
  next uncleared chamber (`chamber === run.lastChamber + 1`, so
  revisits and backtracking never re-fire). Battles ride
  partyOverride (trainer: 2-mon generated team; wild: uncatchable
  facility wild); a battle loss closes the run by facility law.
  Rooms count on event resolution; the dais landing BANKS them
  (records.pike.totalRooms/bestRun), and leaving the building with
  an unbanked run banks + closes it. HINT events read the pre-roll:
  the attendant names the category of ONE of the NEXT chamber's
  doors, verbatim from the table — the information is true by
  construction (the suite asserts fired categories against the
  booked table, never against a re-roll).
- **Lucy (loadMap append):** `frontierBrainNpcs(state, mapId)` —
  called from loadMap's append phase — fields Lucy on the Pike map
  at the dais tile (7,3) exactly when `lucyDue` (banked + this run's
  rooms ≥ 14 Silver / ≥ 140 Gold, not yet faced this run). Her
  condition is already true when the dais loadMap runs (rooms are
  counted by chamber events, before the dais warp), so the plain
  append idiom suffices for her.
- **Pyramid spot/guard design:** floors are RUN-GATED at the warp
  landing: entering any floor map without an active pyramid run
  returns the player to the entrance hall (8,10) with the keeper's
  law spoken ("no booking, no floors"). Hall→floor seeds floor 1;
  floor→floor transitions count `run.floor`, re-seed spots, and
  offer the between-floors Pyramid Bag prompt (usable medicines
  only; application rides `BattleScene.prototype.applyMedicineTo`
  so field semantics are the battle semantics, PP-restore via a
  move pick; level-up items never offered — they are not medicines
  here). The floor-7 exit completes the climb (bestFloor 7, run
  closed, bag surrendered, hall landing + keeper's line). Per floor,
  3 spots are rng-picked from 6 authored candidates per floor map
  (fixed kinds: A = trainer/item/trainer/item/item/trainer across
  its candidates, etc.); item spots roll the weighted loot table
  (superpotion 30, hyperpotion 25, fullheal 15, revive 12,
  maxpotion 10, fullrestore 5, maxrevive 3) into the Pyramid Bag;
  trainer spots start a partyOverride + pyramidBag battle. Steps on
  floor maps check spots first, then the authored wild rate (0.10
  on 'L' tiles, encounter stream, pool wilds at foeLevel,
  uncatchable); a battle loss ends the climb (hall + keeper line).
  **Item-ball redirect (recorded):** during an active climb, the
  F1 floor item balls grant into the Pyramid Bag instead of the
  player's bag (the mountain's supplies stay the mountain's); with
  no climb open they grant as F1 shipped. Rare Candy sits in the
  run bag unusable in battle (battle + field menus exclude
  level-up items) — surrendered with the bag at climb end.
- **Brandon + the floor-count ordering (recorded):** Brandon
  appends on floor A when `brandonDue` (floor 7 of climb 3 Silver /
  climb 10 Gold, not faced). The loadMap append alone MISSES the
  qualifying landing: doWarp loads the map BEFORE the landing hook
  counts the floor, so at append time the run still reads floor 6.
  The landing hook therefore ALSO appends Brandon to the
  already-loaded map when a transition makes him due (minimal
  loadMap stamps replicated: _pk/_phaseMs/_face). A save reloaded
  on floor 7 catches him through the loadMap append — both doors,
  one Brain. **==== F3 HOOK ====** (in `launchBrainBattle`,
  game/frontier.mjs): Brandon's possession staging attaches at the
  marked block in the shared audience launcher — the plain
  milestone battle ships here; F3 hangs its staging on that seam.
- **Part C supersession (recorded):** F1's C40–C43 walk the Pyramid
  floor cycle with no run booked — impossible under the new gate.
  The walk now seeds an active TEAMLESS pyramid run fixture first
  (B09 precedent; `frontierOnStep` fields no battles for a teamless
  run, and floor counting does not disturb the position asserts),
  so the geometry proof stands verbatim and the gate itself is
  proven separately in D24.
- Tests (frontier-checks 99 → **113**): D24 the run gate (bounce +
  keeper line), D25 the climb (booking, floor-1 spots, item spot →
  bag, trainer spot battle with the run bag used + consumed inside
  it, floor counting 1→2→3, floor-7 completion), D26 Brandon
  appended on floor 7 of climb 3 → Silver with other slots null,
  D27 a full Pike run asserted chamber-by-chamber against its own
  booked pre-roll (battles by kind; heal/cure/poison by measured
  effect), D28 dais banking + building-exit close, D29 Lucy Silver
  at banked 7 + 7, D30 the seventh GOLD (six slots seeded gold,
  Brandon's gold Regi team on climb 10) setting
  `story.flags.frontier_complete`, D31 cross-facility honesty
  (Tower desk warns + confirms before closing an open Pike run).
- Battery (this tree): frontier-checks **113/113**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign-smoke **24/24**; arc-foundation **47/47**;
  validator **89** + fuzz **2000/2000** + save-contract **12/12**;
  cheat-shop **44/44**. **public/game.js: 9,916,152 B**,
  byte-stable (build ×2, same sha256 8002a41f…); public static
  total 10,078,774 B vs the 10,100,000 B trigger (margin
  21,226 B). `personal/` byte-identical; dist/ restored.

## Arc 3.5 Stage F3 — Battle Frontier: story spine + Brandon two-stage (2026-10-29)

- Scope: the Frontier's story layer on the shipped F2 drivers —
  Scott deepened, desk rules audited, Brain voices, the Brandon
  possession two-stage at the F2c F3 hook, the quest-log Frontier
  section — plus one coordinator-ruled F2 fidelity fix. Two
  commits: F3a `561144d` (the Arena fix, separable) and F3b (this
  commit, everything else).
- **Arena fidelity fix (F3a, SUPERSESSION of an F2 adaptation,
  coordinator-ruled):** generated Arena foe teams field THREE
  mons, not one (`launchSetBattle` passes teamSize 3 for every set
  facility; Brains already fielded 3). Reason: the F2 judge's Body
  category reads whole-team HP fractions exactly as Emerald does;
  a 1-mon foe conceded Body almost every time — its only mon
  absorbs all damage while the player's bench stays untouched —
  so the variant's core mechanic was skewed. The F2 data note
  recording the 1-mon adaptation is replaced in place with this
  supersession. The re-proof SURFACED A LATENT JUDGE BUG, fixed in
  the same commit: `facilityTeamStats` read `this.foeIndex`, a
  field that never exists (the field is `trainerIdx`), so the
  active foe — and every fainted foe — always counted at FULL HP
  and the foe's Body score never moved; with 1-mon foes the two
  errors cancelled often enough to stay invisible. Drives:
  D16/D17/D19 re-proven unchanged against 3-mon foes, D18's judged
  loss rebuilt (all entered allies Splash-fixtured so a lead faint
  cannot hand the bout to a real kit), and new D18B — a Body case
  that flips under the old shape: a 3-mon foe worn to 30% on its
  active mon with a full bench reads hpFrac ≈ 0.767 → Body 2,
  where the old 1-mon reading of the same battle scores 1; the
  card goes to the challenger 7–6.
- **Scott, deepened:** his hub lines are keyed on the SYMBOL STATE
  in `frontierScottLines` (game/frontier.mjs), dispatched from
  sysNpc for the frontierhub Scott (the name-keyed SPACE
  RESEARCHER ORBIT precedent; the Hoenn Scott is a different actor
  and never reaches the branch). `dialogueStates`' flag/flagNot
  keys operate on story.flags and cannot express symbol COUNTS,
  so — per the brief — the smallest honest route is this
  talk-branch in the Frontier controller, no new engine mechanism.
  Four states, original writing: (a) no symbols — the F1 welcome
  verbatim (seven facilities, seven Brains); (b) some symbols,
  not all — names the earned count with its silver/gold split and
  pushes the Gold standard; (c) all seven earned — silver was the
  introduction, gold is the argument, and Brandon is named the
  last word on the island; (d) `frontier_complete` — his salute.
  D34 talks all four states in the bundle and asserts the
  state-correct lines.
- **Desk rules audit (per facility):** Factory (rentals + the
  winner's swap) and Arena (three-turn judging, tie goes against
  the challenger) already covered their rules and adaptations in
  F2's shipped intros — left untouched. Completed where thin:
  Tower (the streak suspends — "the streak waits where you left
  it"), Dome (off-screen matches decided and called by name),
  Pike (no free healing inside — only what the doors offer),
  Palace (rewritten around the adaptation a player feels: "your
  Pokémon choose their own moves — you are the heart, not the
  hand"), Pyramid (the Bag empties when the climb ends). All in
  the desk's first-talk line, F2's shipped interaction shape.
- **Brain voices:** Anabel (calm precision) and Brandon's intro
  already read distinct — Anabel sharpened one notch (the planned
  move she reads for), the rest left. Deepened: Greta (a judge's
  verdict register), Tucker (the showman counting the house),
  Lucy (quiet menace, a promise the poison keeps), Spencer
  (serene, the river decides its course), Brandon's lose
  (monumental weight). Same 1–2 line length class throughout.
- **Brandon two-stage (the centrepiece):** the first due-Silver
  audience (slot null, the qualifying climb,
  `brandon_possessed_faced` unset) fires the POSSESSED battle
  from `startBrainAudience` instead of the plain milestone:
  pre-scene (the sealed stone of the King of Pokélantis stirs in
  Brandon's chamber; the spirit takes the player's voice and
  stance; Brandon accepts its challenge, naming the +10 margin
  aloud), then the player's REAL entered team under facility
  `autoAlly` — the Palace mechanism, the spirit choosing every
  move — against the silver Regi trio at foeLevel + 10. FACED
  discipline in the battle's onEnd: a LOSS (canon) breaks the
  possession in the post-scene (Brandon + the keeper drive the
  spirit back into the stone), sets `brandon_possessed_faced`,
  awards NO symbol, tends the team inside the scene, and leaves
  the run OPEN with Brandon standing — the milestone is NOT
  consumed (`run.brandonFaced` stays unset), so the plain
  player-controlled Silver battle is re-challengeable
  immediately. An upset WIN sets `brandon_possessed_faced` AND
  `brandon_possession_broken` and awards SILVER through the
  shared `awardSymbol` helper (Brandon names it: the bond broke
  the spirit mid-battle). Once faced, Brandon's audiences use
  `brainRematchIntro` ("This time I battle YOU.") — the silver
  re-challenge and the Gold finale alike; Gold is never
  possessed. The full record (mechanism, margin, both branches,
  why autoAlly is honest) is written at Brandon's def in
  data/frontier.mjs, Harrison format. Both flags live in
  `story.flags`, the open map — no state-shape change (validator
  89 + save-contract 12/12 unmoved).
- **Quest log — Frontier section:** `openQuestLog` gains Section
  1.9 after the Johto section, in its idiom (band header + one
  row per facility from `FACILITY_IDS`), rendered once the
  Frontier is reached (`hook_frontier || reachedarc_frontier ||
  arc === 'frontier' || any symbol`). Rows read `badges.symbols`
  directly — facility + Brain name, state word — / SILVER /
  GOLD — and are INFORMATIONAL (no quest flags), said so in the
  code comment; picking a row speaks the facility, its Brain and
  title, and the symbol state, then reopens the log.
- Tests (frontier-checks 113 → **120**): D18B (above), D32a the
  possessed launch (autoAlly, zero command input — no command or
  move menu ever opens — Regis at 110), D32b the canon loss
  (fixture: three Explosion-only Abra — the spirit immolates the
  team against the Regis' walls; a merely passive team does NOT
  lose this battle, the Regis carry Explosion and suicide
  against bulk), D32c the plain re-challenge with the rematch
  voice awarding silver, D33 the upset as a TRUE-PATH drive
  (entered Machamp/Dragonite/Mewtwo with Seismic Toss +
  Earthquake/Fire coverage; the game's own uniform-random
  autoAlly wins at +10 with zero command input — in development
  this construction won on 24/24 sampled seeds; no margin or AI
  change), D34 Scott's four states, D35 the quest-log section
  (fixture symbols [gold, silver, null…] render the right state
  words; unrendered when unreached).
- Battery (this tree): frontier-checks **120/120**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign-smoke **24/24**; arc-foundation **47/47**;
  hoenn-story **88/88**; johto-story **110/110**; cheat-shop
  **44/44**; validator **89** + fuzz **2000/2000** +
  save-contract **12/12**. **public/game.js: 9,928,850 B**,
  byte-stable (build ×2, same sha256 74bec4d9…); public static
  total **10,091,472 B** vs the 10,100,000 B Hoenn-close
  measurement trigger — NOT crossed (margin 8,528 B); the
  binding 12.58 MB gate holds with ~2.49 MB to spare.
  `personal/` byte-identical; dist/ restored.

## Arc 3.5 Stage F4 — Battle Frontier: completion + homecoming (2026-10-29)

- Scope: the Frontier's closing layer on the shipped machine —
  Scott's closing beat on Pallet entry, the capstone drive (Brandon
  Gold → ARC COMPLETE → ferry home → Scott → the SEALED Sinnoh
  homecoming), and the budget restatement. The machine in
  `src/game/arcs.mjs` is NOT modified; one stage commit on
  e7770d1.
- **Scott's closing beat (design + seam):** `tryScottClosing(g,
  mapId)` in `src/game/frontier.mjs`, called from ONE line on the
  `sysLoadMap` seam beside `tryHomecoming` (yielding to the ARC
  COMPLETE card on the load that fires it, the homecoming's own
  precedence). It fires only on Pallet Town (`HOME_TOWN_MAP_ID`)
  with `story.flags.frontier_complete` set and
  `scott_closing_done` unset; the done flag is set at scene START
  (fire-once even if interrupted — the machine's convention). Four
  original lines, speaker 'SCOTT': he followed the whole campaign
  door by door; the Frontier salutes its conqueror; then he turns
  the player's eyes to Professor Hawthorn's lab — Gary, fresh home
  from somewhere called Sinnoh, an Electivire shadowing him and
  stories enough to fill the room — and home first, then the lab
  talk. The beat POINTS at the homecoming and does not duplicate
  the registry's sinnoh hookLines: the machine delivers the hook
  itself at Mom's house, untouched, on a separate map load, so the
  beat cannot block it. With `frontier_complete` unset it never
  fires — the chain drive's earlier Pallet visits stay clean.
- **Capstone drive (tests/frontier-checks 120 → 136, new Part E):**
  B09-style counter seeding is the established isolation precedent
  (said so in the suite comments): the save is seeded at six gold
  symbols + Pyramid 'silver' + `brandon_possessed_faced`, the
  pyramid run counter at 9 (this entry books climb 10, Gold due),
  arc 'frontier', the four earlier regions done, and the crossing
  flags a real save carries — every seed named inline. From there
  TRUE-PATH: E01 the Brandon Gold win turns the last slot gold and
  the shared award helper sets `frontier_complete` (E02: the flag
  alone arms the machine — no regionsDone entry, no card flag, no
  directive yet); E03 the next map load fires `checkArcCompletion`
  and the ARC COMPLETE card plays with the asserted summary —
  title 'ARC 3.5 — BATTLE FRONTIER · COMPLETE', badgeLine
  'Badges: 7/7', the registry's frontier summaryLines verbatim,
  the forwardLine naming Sinnoh and Gary; E04 regionsDone gains
  'frontier' exactly once, the directive pins on 'sinnoh', and
  Scott does NOT fire on the hub (Pallet-only); E05 the card does
  not fire twice on later loads; E06 the hub ferry return sails
  with `embark_frontier` DELETED (unconditional —
  `reachedarc_frontier` carries the leg) and lands on Pallet;
  E07 Scott's scene fires on that entry (`scott_closing_done` set;
  the salute, the lab/Gary/Sinnoh/Electivire pointer and 'Home
  first' all in the spoken lines); E08 leave + re-enter Pallet —
  no re-fire (exactly one closing scene in the UI log); E09 the
  SEALED Sinnoh homecoming completes at Mom's house with Gary's
  hook lines (incl. the Electivire line) delivered BY THE MACHINE
  — `hook_sinnoh` + `homecoming_sinnoh` set, directive cleared;
  E10 the sealed law holds — story.arc STAYS 'frontier',
  `embark_sinnoh` NOT set, regionsDone unchanged; E11/E12 the
  Journey headers read ARC 3.5 · BATTLE FRONTIER — COMPLETE and
  ARC 4 · SINNOH — SEALED (arcStateOf agrees) and the Regions
  surface's Sinnoh row reads sealed; E13/E14 the negatives and
  the seam unit (no fire without `frontier_complete`, no fire
  off-Pallet with or without the flag, speaker 'SCOTT', never
  twice).
- **Budget restatement (H0 method, arc3-pack-decision.md §4/§6;
  register only, no new thresholds):** the Frontier's ACTUAL
  delta over the Hoenn close is **131,098 B** (this build's
  public static total 10,094,049 B − the Hoenn close 9,962,951 B;
  the delta is identical on the H0 game+index basis —
  10,022,987 − 9,891,889 — since game.js is the only mover),
  against the doc's projected Frontier increment of 102,255 B
  (+28,843 over projection). The doc's projected Sinnoh-close
  static total, adjusted by swapping the projected Frontier
  increment for the actual delta: 12,086,695 − 102,255 +
  131,098 = **12,115,538 B** projected Sinnoh close. Margin vs
  the gate (the doc's exact gate bytes, 12,582,912 B):
  **467,374 B** (3.71% of the gate). Distance to the 250,000 B
  re-open trigger: **217,374 B** of margin still stands above
  it — the trigger is not fired. Cross-check, re-anchoring the
  same method on the ACTUAL Hoenn close (H0 basis 9,891,889 +
  the actual Frontier delta 131,098 + the doc's Sinnoh central
  arc total 2,111,475): 12,134,462 B, margin 448,450 B,
  198,450 B above the trigger — same conclusion. Trigger (i)
  watch: this build's public static total 10,094,049 B vs
  10,100,000 B — NOT crossed (margin 5,951 B).
- **F5 inheritances (by name):** (i) the chain drive's Hoenn-era
  assertion of Homecoming #4's sealed behaviour must be
  superseded when F5 extends the drive — the subject is kept,
  per the C28/J4a precedent (a shipped-branch flip supersedes
  the sealed-branch assertion, it does not delete it); (ii)
  F5's independent QA re-drives everything from live play —
  nothing in this entry's headless evidence substitutes for it.
- Battery (this tree): frontier-checks **136/136**;
  qa-changed-flows exactly **{b2, d9}**; battle-model **45/45**
  (HARD); campaign **24/24**; arc-foundation **47/47**;
  hoenn-story **88/88**; johto-story **110/110**; cheat-shop
  **44/44**; validator **89** + fuzz **2000/2000** +
  save-contract **12/12**. **public/game.js: 9,931,427 B**,
  byte-stable (build ×2, same sha256 77c3411a…); public static
  total **10,094,049 B**. `personal/` byte-identical; dist/
  restored.

## Arc 3.5 Stage F5-fix — SERVER VALIDATOR regionsDone GAP (2026-10-29)

- **The bug (named honestly):** every real Frontier-complete save
  was rejected by the cloud-save server validator with
  `bad-regions-done`, while the client schema accepted it. Caught
  by the F5a INDEPENDENT chain drive (D08) on one continuous played
  save — not by any stage battery. Root cause is a Foundation-era
  latent gap: the arc machine (`src/game/arcs.mjs`) writes the
  registry `completionKey` into `story.regionsDone`, and the
  Frontier is the first arc whose completionKey is not a region
  name (its `regionKey` is 'kanto', its completionKey is
  'frontier'); but the completionKey SET was never a generated
  table. The server validator checked regionsDone membership
  against `TABLES.regions`, emitted by `gen-tables` from a
  hardcoded region-key list with no 'frontier' in it. The stage
  batteries missed it because their synthetic fixtures never
  carried a played `regionsDone` containing 'frontier' — only a
  save actually played through the whole chain could see it.
- **Consumer inventory (TABLES.regions, at base d754b28):** exactly
  TWO readers, both in `checkStory` in `api/_lib/validator.mjs`:
  (1) the `story.region` validity check — `story.region` must be
  in `TABLES.regions`, else `bad-region`; (2) the
  `story.regionsDone` membership check — every entry must be in
  `TABLES.regions` (plus the duplicate and length->11 checks),
  else `bad-regions-done`. No other consumer exists anywhere in
  `api/` (grep-verified): badge sequences, arc ids, band caps and
  every other table are separate emitted sets and never read
  `regions`.
- **The fix (registry-derived, the J0 gen-tables precedent — the
  ARCS registry is the single source):** `gen-tables` now emits a
  NEW set, `regionsDoneKeys: ARCS.map((a) => a.completionKey)` —
  today [kanto, orange, johto, hoenn, frontier, sinnoh, unova,
  kalos, alola, journeys, horizons] — and `tables.json` was
  regenerated ONLY via the tool (`--check` green after; new
  tablesVersion 008f46510d26…). The validator loads it as
  `TABLES.regionsDoneKeys`, and ONLY the regionsDone membership
  check reads it now. ALL other checks read exactly what they read
  at base — in particular `story.region` validation still reads
  `TABLES.regions` and did NOT gain 'frontier': a save claiming
  `story.region` 'frontier' is still rejected `bad-region`
  (pinned both ways: 'frontier' rejected, 'kanto' — the Frontier
  arc's regionKey — accepted). Side effect, intended and correct:
  'galar' / 'paldea' / 'liko' sat in the old regions list but are
  no completionKey of any registry arc, so they are no longer
  accepted in regionsDone (pinned for 'galar').
- **Pins (validator suite 89 → 97, +8; save-contract unchanged at
  12 — the contract shape did not move):** (i) a played-shape
  Frontier-complete save — regionsDone [kanto, orange, johto,
  hoenn, frontier], badges.symbols all 'gold', story.arc
  'frontier', story.region 'kanto', `frontier_complete` set —
  validates server-side with ZERO errors (the D08 case); (ii) a
  bogus regionsDone entry still rejected `bad-regions-done`
  ('frontier2', and 'galar'); (iii) regionsDone containing any
  other registry completionKey accepted (each of the 11 singly,
  and the full 11-key list at the length cap); (iv) the client
  schema result for the same Frontier-complete save is unchanged
  (accepted, zero errors); plus the registry-vocabulary pin (the
  ARCS completionKeys equal the expected 11, incl. 'frontier',
  excl. galar/paldea/liko) and the two story.region pins above.
- **Closing proof — the F5a chain drive re-run:** the unmodified
  drive (`~/workspace/ashs-journey-qa/arc-chain-qa/chain-drive.mjs`)
  now reports, in its own output line: `CHAIN DRIVE TOTAL:
  147/147 passed`, with D08 green — `{"server":[],"client":[]}`
  (was 146/147, D08 failing on `bad-regions-done` only). The
  drive's `chain-results.json` updated itself in place and is left
  as it landed (147/147); its notes constant still carries F5a's
  KNOWN FAILURE wording because the drive was run unmodified —
  its results, not its notes, are the current evidence.
- **PRE-EXISTING leftover (named, NOT fixed here): the
  meta.location charset tension.** ~22 shipped map names contain
  em-dashes (F5a's count; e.g. 'Bell Tower — Summit'); `meta.location`
  is written by `doWarp` from the current map's name
  (`src/game/overworld.mjs`: `g.state.meta.location =
  this.map.name`), and the server validator's SAFE_TEXT charset
  rejects the em-dash (`bad-meta-location:charset`). So a save
  written immediately after warping into such a map carries a
  charset-failing location string. It pre-dates this arc, is
  transient (the next warp overwrites it), and is out of this
  fix's scope — recorded for a future ruling. Evidence pointer:
  F5a's report (the chain drive's SNAPSHOT FAITHFULNESS note,
  where a Pyramid floor name — 'Battle Pyramid — AF' — surfaced
  exactly this code before the drive's real-warp snapshot step).
- Battery (this tree): validator **97** (89 + 8 new pins) + fuzz
  **2000/2000** + save-contract **12/12**; frontier-checks
  **136/136**; qa-changed-flows exactly **{b2, d9}**; battle-model
  **45/45** (HARD); arc-foundation **47/47**; cheat-shop **44/44**.
  **public/game.js: 9,931,427 B**, byte-stable (build ×2, same
  sha256 77c3411a… — UNMOVED: tables.json is server-side data and
  is not bundled); public static total **10,094,049 B**.
  `personal/` byte-identical; dist/ restored.

## Arc 3.5 Stage F5 — Battle Frontier: chain extension + independent QA + MISSION CLOSE (2026-10-29)

- **Chain drive (F5a)** — extended on the ONE continuous save to
  **147 checks**: 123 prior − 1 superseded (H34, Homecoming #4's
  sealed-behaviour assertion; subject kept — Scott's hook delivered,
  directive cleared; new behaviour asserted: arc advances to
  'frontier', embark_frontier armed — the C28/J4a precedent) + its
  replacement + 24 new Frontier checks (F01–F24), all passing.
  Silvers driven true-path on the chain save (Tower 35, Factory 21
  with 20/20 swaps, Arena 14 with the judge genuinely reached,
  Dome tournament 5 vs Tucker, Pike 14 rooms over 2 runs with
  every driven door's event matching its pre-roll, Palace 21 at
  zero command input, Pyramid possession canon-loss then plain
  re-challenge); Golds from NAMED seeded counters (B09 isolation,
  every seed listed in the F5a report) with the milestone battles
  driven truly. End state: regionsDone exactly [kanto, orange,
  johto, hoenn, frontier]; badges.symbols 7× 'gold'; the final
  save validates on BOTH validators (after the F5-fix below).
- **Chain-caught bug (fixed at F5-fix, entry above)** — the
  drive's D08 failed 'bad-regions-done' on the played save: the
  completionKey set had never been a generated table. Fixed
  registry-derived (`regionsDoneKeys`); chain re-run unmodified
  reports **147/147**, D08 green on both validators.
- **Independent QA (F5b)** — an agent that built nothing graded
  the fixed tree (a1b1e7d) with its own drivers
  (~/workspace/ashs-journey-qa/arc35-frontier-qa/, 75/75):
  **verdict SHIP-WITH-NOTES, no blockers.** First-hour PASS
  (incl. the consumed-sealed derivation save), all seven
  signature rules PASS on independent spot-proofs (Tower
  suspend/save/reload/resume byte-identical; Factory swap +
  party byte-identity; Arena Body-decides case recomputed live;
  Pike two doors of one chamber differing per the booked
  pre-roll after save/reload; Palace zero-input with player
  send-out on faint; Pyramid bounce/bag/floor-count), Brandon
  PASS (possession at +10 auto-piloted → canon loss → voiced
  re-challenge → Silver; Gold never possessed), completion E2E
  PASS with the QA-drive-produced save validating zero-errors
  on both validators (the F5-fix case independently
  reproduced), economics PASS (a facility loss costs $0 and
  warps nowhere). QA's two first-cut failures were its own
  fixture bugs, fixed and re-run green, documented in its
  report for transparency.
- **QA NOTE F-1 (= the F5-fix leftover, independently
  reproduced):** the meta.location em-dash charset tension —
  a save snapshotted while meta.location holds an em-dash map
  name (e.g. 'Battle Pyramid — AF') is rejected server-side
  with exactly ['bad-meta-location:charset']; client accepts.
  Pre-dates this arc, transient (next warp overwrites), named
  for a future ruling. QA explicitly did NOT re-verify:
  Brandon's upset-win branch and the other Brains' milestone
  battles (suite evidence stands: frontier-checks D33 drove
  the upset true-path, 24/24 sampled seeds in development) and
  any live-browser rendering grade (headless-bundle live play,
  as briefed).
- **Foundation-riding proof** — the Frontier consumed its
  registry row (badgeSet 'symbols', badgeTotal 7,
  completionFlag 'frontier_complete', band null/Open Level,
  embarkPort 'pallet', arrivalMap 'frontierhub') with ZERO
  changes to src/game/arcs.mjs (the machine is byte-untouched
  this mission): arming was a status flip + a generic save-fill
  catch-up; completion fires from the flag alone; the Sinnoh
  homecoming rode the sealed branch. What the machine had to
  LEARN (design smells, recorded): (1) the completionKey set
  was not a generated table (F5-fix — Arc 4 inherits the
  registry-derived set; its 'sinnoh' key is already in it);
  (2) warp landings are visible only at the doWarp funnel
  (F2c's sysWarpLanding seam); (3) the badge-set quintet
  generalises to slots, but the Cheat Terminal's badge read
  sites needed an explicit earned-only exclusion (F0).
- **Battery at close** — frontier-checks **136/136** ·
  validator **97/97** + fuzz **2000/2000** + save-contract
  **12/12** · qa-changed-flows exactly **{b2, d9}** ·
  battle-model **45/45** (HARD) · campaign-smoke **24/24** ·
  arc-foundation **47/47** · hoenn-story **88/88** ·
  johto-story **110/110** · johto-systems **62/62** ·
  cheat-shop **44/44** · chain drive **147/147** ·
  independent QA **75/75**. Named inheritances unmoved:
  qa-slice {s6, l8}, rejuv {A09, C01} cluster, audit-laptop
  unrunnable in this sandbox.
- **Bundle at close** — public/game.js **9,931,427 B**;
  public static total **10,094,049 B** (Hoenn close 9,962,951
  + Frontier actual 131,098). H0 monolith restated at F4:
  projected Sinnoh close 12,115,538 B vs the 12,582,912 B
  gate (margin 467,374 B; 217,374 B above the 250,000 B
  re-open trigger — not fired). `personal/` byte-identical
  across the whole mission (8225dd1 → close); roster
  unchanged at 395 entries (no new species, as designed).

## Arc 4 Stage S0 — Sinnoh badge quintet + arming + F-1 fix (2026-10-29)

Base 8cf87e3 (Frontier complete, QA SHIP-WITH-NOTES). ONE commit.
`personal/` byte-identical (aggregate sha256 of personal/ files
7c94537f582325… — identical before and after this stage; restored
from HEAD after builds; zero personal/ paths in the diff). Never
pushed, never deployed (owner order: deploy once, when the arc
chain is completely done).

### The badge quintet — all places at once (Hoenn law, mission §1)

Platinum order: coalbadge, forestbadge, relicbadge, cobblebadge,
fenbadge, minebadge, iciclebadge, beaconbadge (Roark / Gardenia /
Fantina / Maylene / Crasher Wake / Byron / Candice / Volkner).

1. **ITEMS** (src/data/items.mjs): 8 Sinnoh badge rows, key pocket,
   Platinum names, original flavour text — minted complete now so
   the set is whole before S5 stages their gyms (the H4a precedent).
2. **BADGE_SETS.sinnoh** in items.mjs, the Platinum earn order.
3. **defaultState** (src/game/state.mjs): badges.sinnoh seeded [].
4. **Client schema** (src/save/schema.mjs): validate-if-present —
   badges.sinnoh must be a PREFIX of BADGE_SETS.sinnoh, else
   `bad-badges-sinnoh`; the fill is the Hoenn idiom (a present array
   passes through untouched, so earned badges are preserved on old
   saves; absent/non-array fills to []). The migrate() fallback
   badges object carries sinnoh: [] too.
5. **Server validator** (api/_lib/validator.mjs): checkBadges runs
   sinnoh through the same badgeSequences prefix law (skip/swap ->
   `bad-badge-order`, duplicate -> `bad-badge-id`, overlong ->
   `bad-badges-sinnoh`); the summary badgeCount INCLUDES sinnoh
   (the F0 total-honors read). The bag cap tracks the ITEMS table
   again: 175 -> 183.
6. **gen-tables** (tools/api-scripts/gen-tables.mjs): taught the
   sinnoh earn order exactly as hoenn's (SINNOH_EARN_ORDER from
   BADGE_SETS, badgeSequences.sinnoh, regionBadgeMax.sinnoh 8);
   tables.json regenerated ONLY via the tool (`--check` green,
   183 items).
7. **Data-driven consumers verified, no special-casing added:**
   the leader award path (battle.mjs winTrainer writes
   badges.<badgeSet> + the badge_<root> flag generically); the
   Cheat Terminal (BADGE_IDS stock is BADGE_SETS-driven excluding
   'symbols' only — sinnoh stock appears, key-pocket leak excluded
   by the same BADGE_IDS read, cheatClaimBadge resolves the set
   generically and prefix-completes — proven live in sinnoh-checks
   B06–B08); the summary/Journal display path (arcCompleteSummary
   reads badgeCountFor through the registry badgeSet — B09 proves
   'Badges: 8/8' for Sinnoh with no new code).

### Arming (mission §2)

- **Registry:** the sinnoh row's status 'sealed' -> 'shipped' in
  src/data/arcs.mjs. Nothing else in the row changed (band
  301–400, horizon 493, vermilion -> sandgem, Gary hookLines all
  already correct, consumed not rewritten).
- **Save-fill catch-up:** the generic F0 catch-up in
  deriveArcDefaults (it names no region) ALREADY covers Sinnoh —
  verified, NOT extended: a Frontier-close-shaped save
  (hook_sinnoh + homecoming_sinnoh consumed while sealed,
  story.arc 'frontier', Frontier completion met by regionsDone
  AND by completionFlag forms) derives story.arc = 'sinnoh',
  story.region = 'sinnoh', embark_sinnoh, and both arc-start
  snapshots on load, idempotently (sinnoh-checks A14–A19, the F0
  A13–A17 fixture idiom).
- **CAPT SINNOH** appended to Vermilion's roster via the TALE_NPCS
  append idiom in src/data/quests.mjs, copied from CAPT HOENN:
  ferry 'sandgem', ferryArc 'sinnoh', sailor art, original
  dialogue. Placement evidence: he stands at **(14,10)** on the
  dock row, one tile east of CAPT ORANGE (13,10), two west of
  CAPT HOENN (16,10). (15,10) — the only free tile adjacent to
  CAPT HOENN — was REJECTED as his stance: it is the shared
  talking tile for the dock captains, and a stance there seals
  (14,10) (whose only walkable neighbours are captain/HANK
  tiles) into its own fragment. Before: Vermilion swept
  [main 119, one pre-existing isolated tile (5,11)]; after:
  [main 118, (5,11)] — the main fragment loses only the
  captain's own tile, no new fragment, every warp in the main
  fragment or beside it (sinnoh-checks A20–A22 pure, B03–B05
  walked on foot in the bundle: Route 6 landing -> (15,10) ->
  west along the dock -> the gym door warp fires).

### F-1 fix (mission §3, coordinator ruling — server aligned, scoped)

- meta.location is a snapshot of the game's own map display name
  (overworld.mjs writes this.map.name); the server validator's
  SAFE_TEXT lacks U+2014, so it rejected `bad-meta-location:
  charset` for real players standing in em-dash maps while the
  client accepted the same saves — those players could not
  cloud-save. Fix: the meta.location check alone now uses a
  dedicated charset, SAFE_LOCATION_TEXT = the SAFE_TEXT set +
  U+2014 (—) + U+2013 (–). NOTHING else widens: nickname /
  player-name / rival-name / OT checks keep SAFE_TEXT (pinned).
  No map renamed; the snapshot is not normalized.
- **Affected-name count (exact, scanned from the shipped
  maps*.mjs name fields via the merged map table): 38 shipped
  map entries carry an em-dash display name, 36 of them unique**
  ('Pewter City — House' and 'Celadon City — House' are each
  carried by two house maps). U+2014 is the ONLY character in
  any shipped map display name outside the SAFE_TEXT set
  (sinnoh-checks A27 pins the census). The mission doc's ~15
  estimate counted only single-quoted name fields; the
  JSON-style maps (maps6–8) carry the rest.
- Pins: validator.test.mjs 97 -> **106** (em-dash + en-dash
  locations accept; `<` / `"` / emoji locations still reject;
  em-dash nickname and player name still reject; a played-shape
  save whose meta.location is 'Vermilion City — House'
  validates server-side with ZERO errors, client unchanged) +
  sinnoh-checks A23–A26 (incl. a Lv312 Sinnoh-arc played shape).

### Supersessions, by name (the C28 pattern — subjects kept)

- **frontier-checks E09–E12**: SUBJECT was the Sinnoh homecoming
  riding the machine + the Journey/Regions surfaces — the
  sealed-era expectations now observe the SHIPPED row: E09's
  hook-delivered and directive-cleared assertions unchanged;
  E10 now asserts arc advances to sinnoh, region sinnoh,
  embark_sinnoh armed (regionsDone still unchanged by the
  homecoming); E11 reads ARC 4 SINNOH CURRENT; E12 reads the
  Sinnoh row current ('you are here'). Suite total unchanged
  (136/136).
- **frontier-checks B03**: Cheat Terminal badge-stock row count
  29 -> 37 (36 real badge rows + Back — the 8 Sinnoh badges are
  stock by the same BADGE_SETS read; the no-symbol subject is
  unchanged).
- **Item-count supersessions (the H4a/F0 class — the quintet
  adds 8 ITEMS rows, 175 -> 183):** frontier-checks A12,
  cheat-shop A02, hoenn-story A16, johto-story A15,
  johto-systems A24. In each, only the count moved; every other
  assertion stands as written, and each suite's TOTAL is
  unchanged (136, 44, 88, 110, 62).

### Battery + build (this tree, 2026-10-29)

- **NEW tests/sinnoh-checks.mjs: 37/37** (27 pure + 10 bundle:
  quintet 1:1, both validator pairs, fill preserve, the five
  derivation fixtures, captain placement + graph, the F-1
  charset pins + census; bundle: captain on Vermilion's live
  roster, the ferry gate line with embark_sinnoh deleted and
  NO warp — the crossing itself is NOT proven here, sandgem
  does not exist until S3 and its proof belongs to S3 — the
  on-foot dock walk + gym warp, the live Cheat Terminal, the
  registry summary read).
- validator **106** + fuzz **2000/2000** + save-contract
  **12/12**; qa-changed-flows exactly **{b2, d9}** (QA TOTAL
  19/19); battle-model **45/45** (HARD); campaign-smoke
  **24/24**; arc-foundation **47/47**; frontier-checks
  **136/136**; cheat-shop **44/44**; hoenn-story **88/88**;
  johto-story **110/110**; johto-systems **62/62**;
  gen-tables --check green.
- **public/game.js: 9,935,642 B** (+4,215 vs the Frontier close
  of 9,931,427 B), byte-stable: two consecutive
  `node scripts/build.mjs` runs produce the identical sha256
  (7a1a3e0ee7a8…). Public static total **10,098,264 B** vs the
  12,582,912 B gate — margin 2,484,648 B. The F4-restated
  projection-to-close (12,115,538 B, margin 467,374 B) stands:
  S0's actual delta is +4,215 B and the 250,000 B re-open
  trigger is not approached. `personal/` byte-identical;
  dist/ restored.

### What S1 inherits

- The crossing proof: CAPT SINNOH's allowed path (embark armed
  -> Sail menu -> en-route card -> landing on sandgem) can only
  be driven once sandgem exists (S3's maps). The gate half is
  proven now; the sail half is S3's first bundle check.
- The badge award path is state-only this stage: no Sinnoh
  leader exists until S5, but the quintet's validators, stock
  and registry reads are all live, so S5's leaders award into
  a finished system without touching it.
- A Frontier-complete save that already heard Gary's hook now
  loads as a Sinnoh save (arc + region + embark + snapshots
  derived); a save mid-homecoming (directive pinned, not yet
  home) still walks the ritual live, through the shipped branch
  (frontier-checks E09–E12 prove that branch end-to-end).

## Arc 4 Stage S1 — Species data: +107 → National dex 493 (2026-10-29)

Implementer pass on main @ fbfc33a (S0 committed). Data only — no maps,
story, or sprites (S2 owns the 114 new entries' art; until then they
render through the shipped forge fallback from spriteSeed, exactly as
Johto's did between J1 and J2). Nothing pushed, nothing deployed.
`personal/` byte-identical (restored from HEAD after the battery's
builds, per the frozen-retired-edition precedent).

### 1. What landed

- **ETL (reproducible, not hand-typed):**
  `~/workspace/ashs-journey-qa/arc4-etl/fetch-sinnoh.mjs` stages the
  PokeAPI facts cache (`arc4-etl/raw/`: pokemon/species 387–493, 71
  evolution chains, and the 7 forme pokemon 10006–10012 discovered
  from the species varieties of rotom/giratina/shaymin — facts only,
  no sprites or art ever fetched, and no sprite URL appears anywhere
  in the pipeline); `etl-sinnoh.mjs` mirrors the Hoenn machinery and
  EMITS `src/data/species5.mjs` (`export const SPECIES_SINNOH`,
  **114 entries**). Per-species audit trail in
  `arc4-etl/etl-notes.json`. Registered in
  `scripts/module-order.json` after species4.mjs; folded in
  `src/data/merge.mjs` (`Object.assign(SPECIES, SPECIES_SINNOH)`);
  `tools/api-scripts/gen-tables.mjs` folds it the same way and the
  validator tables were regenerated ONLY through it (tablesVersion
  0525370a… → **b041ad21…**, **509 species** / 144 moves / 183 items;
  `--check` green).
- **Accounting (as gen-tables produces it):** species entries
  **395 → 509** = 493 National dex + partner + 5 shipped forms +
  3 Deoxys formes + **7 S1 formes** (§4). Non-form entries total 494
  (493 + the shipped partner, who shares dexNo 25 with pikachu by
  pre-S1 design — the only non-form dex share in the roster).
  **Expected 509 = actual 509; no delta.** Diploma accounting
  untouched (Kanto-151 counts non-form dexNo 1–151 exactly as before;
  cheat-shop/fidelity proofs green). `DEX_TOTAL` stands.
- **Field mapping** follows the shipped schema exactly: PokeAPI
  stats/types (current typings), capture_rate, base_experience,
  spriteSeed dexNo*100+1 (formes dexNo*100+2… on the shipped
  form-seed pattern), body from PokeAPI `shape` with two recorded
  overrides (giratina + giratina-origin → serpent; skorupi/drapion →
  quad). Every entry carries `eggGroups` + `hatchCounter`
  (+ `baby: true` for the 8 babies: budew, chingling, bonsly,
  mimejr, happiny, munchlax, riolu, mantyke) and an ORIGINAL
  one-line flavor (hand-authored in the ETL's FLAVOR table; no
  PokeAPI flavour text exists in the pipeline or was copied).
- **Breeding frame completed:** the 5 shipped species2 formes
  (crystalonix, pinkbutterfree, surfingpikachu, flyingpikachu,
  giantdragonite) were the only merged-roster entries with NO
  eggGroups; they now carry their base species' groups +
  hatchCounter (mineral/25, bug/15, ground+fairy/10 ×2,
  water1+dragon/40). Every one of the 509 entries now reads
  eggGroups (sinnoh-checks S1-04).
- **TM lists:** copied from the closest shipped analogue (now incl.
  the Hoenn roster) by type overlap then BST distance; analogue per
  species recorded in the ETL notes. Two entries ship `tm: []` —
  kricketot (analogue wurmple) and burmy (analogue shedinja) — the
  shipped cocoon precedent (14 shipped entries carry `tm: []`,
  metapod/kakuna/wurmple among them), recorded here by name.
- **Support tables:** `battler-tiers.mjs` + `idle-classes.mjs` gain
  **114 rows each (509 total in both)** by the shipped rules — tiers
  by bulk (HP+DEF+SPD: S <160, M 160–244, L ≥245); idle by body plan
  with hand overrides for floaters (the rotom set, giratina pair,
  bronzong, magnezone, mismagius, froslass, drifloon line, the lake
  trio, cresselia, darkrai, shaymin-sky, spiritomb, carnivine,
  chingling → hover). Row generation script:
  `arc4-etl/gen-tiers-idle.mjs`.

### 2. Growth curves (J0 law, discharged with substitutions)

The ETL asserts no entry is ever ASSIGNED 'erratic' or 'fluctuating';
canon cases map to the nearest supported curve by level-100 total
(Hoenn precedent), recorded per species in the ETL notes:
**erratic (600,000) → 'fast' (800,000)** for 6 species
(cranidos/rampardos, shieldon/bastiodon, finneon/lumineon) and
**fluctuating (1,640,000) → 'slow' (1,250,000)** for 2
(drifloon/drifblim). All other raw curves map directly
(base-species raw counts: medium-slow 28 · 'medium'→mediumfast 35 ·
slow 28 · fast 8 — 99 direct + 8 substituted = 107). The literal curve names appear in NO entry.

### 3. Learnsets (mission decision 4)

- Source: PokeAPI `moves`, version_group **platinum preferred**
  (Platinum governs), diamond-pearl / heartgold-soulsilver fallback,
  level-up only, restricted to the game's existing move table.
  **All 114 entries took a surviving platinum set** — no fallback
  was needed.
- **Levels:** canonical level-1 moves stay at key **1**; every
  canonical level ≥2 shifts **+300** (band-local, Amendment 2).
  Every entry's learnset keys are 1 or inside 301–400
  (machine-checked, sinnoh-checks S1-05).
- **Dropped: 859 (species, move) pairs, 221 distinct canonical
  moves** with no game counterpart (full list in etl-notes.json).
- **Top-ups (<4 distinct surviving moves): 60 moves across 32
  entries**, placed at level 1, type-staples first, then
  type-matching canon TM/HM moves, then Normal staples (the Johto
  rule, unchanged): kricketot +leechlife, pinmissile · shinx/luxio/
  luxray +thundershock · roserade +absorb, razorleaf · shieldon/
  bastiodon +rockthrow, rockslide · burmy/combee +leechlife,
  pinmissile, twineedle · shellos/gastrodon +watergun · mismagius
  +lick, nightshade · honchkrow +bite, nightshade · chingling
  +psybeam · happiny +tackle, quickattack, swift · spiritomb +lick
  · riolu/lucario +lowkick · croagunk/toxicroak +acid, smog, sludge
  · finneon/lumineon +bubblebeam · togekiss +pound, swift,
  metronome · mesprit +psybeam · dialga +tackle, quickattack,
  dragonrage · palkia +watergun, bubblebeam, surf · heatran +ember,
  flamethrower · giratina + giratina-origin +lick, nightshade,
  confuseray · shaymin +absorb, megadrain · shaymin-sky +absorb ·
  arceus +tackle. After top-ups every entry knows ≥4 distinct moves
  (S1-06).

### 4. Formes (mission decision 4)

- **Rotom (479)** is the base entry in the main loop; **heat / wash /
  frost / fan / mow** ship as partner-pattern FORM entries
  (`rotomheat` electric/fire, `rotomwash` electric/water,
  `rotomfrost` electric/ice, `rotomfan` electric/flying, `rotommow`
  electric/grass) from their own PokeAPI pokemon records
  (10008–10012), spriteSeeds 47902–47906. **Giratina (487)** is the
  base (altered) entry; `giratinaorigin` (10007, seed 48702) shares
  dexNo 487. **Shaymin (492)** is the base (land) entry;
  `shayminsky` (10006, grass/flying, seed 49202) shares dexNo 492.
  All 7 carry `form: true` + `baseSpecies` and are excluded from
  dex/diploma counts by the same form mechanism as the shipped
  forms (S1-10/S1-11: 15 form entries roster-wide).
- **Reconciliation with forms.mjs:** the FORMS catalogue already
  carried all 7 rows (giratina-origin, shaymin-sky, rotom-heat/
  wash/frost/fan/mow) — catalogue data only. **No FORMS rows were
  added or duplicated** (forms count stays 202; cheat-shop A02 pins
  it). The new species entries are the playable counterparts (the
  Deoxys precedent). The S4 forme-switch consumes these entries;
  nothing in S1 wires the switch.
- **Not shipped as entries:** wormadam/burmy cloaks, shellos/
  gastrodon east–west, cherrim sunshine, unown letters — single
  base entries, recorded as a call (the formes catalogue describes
  them; no dex math turns on them).

### 5. Evolutions — mappings and judgment calls (each recorded)

Engine vocabulary only: level / stone / trade, branching via `evos`
with the primary branch duplicated in the singular `evo` slot.

- **Band-local level evos (canon +300), chain-derived:** all Sinnoh
  lines (starters 314/318→332/336, starly 314, staravia 334,
  bidoof 315, kricketot 310, shinx 315, luxio 330, cranidos 330,
  shieldon 330, cherubi 325, buizel 326, buneary-class below,
  shellos 330, drifloon 328, glameow 338, stunky 334, bronzor 333,
  croagunk 337, finneon 331, snover 340, gible 324, gabite 348,
  hippopotas 334, skorupi 340).
- **THE CONDITION CLASS → level 310** (band floor 301 + 9, the
  Hoenn happiness analogue azurill 210): Gen-4's condition
  evolutions are inexpressible in the engine, so happiness,
  known-move, held-item level-up, location, and party-species
  conditions all resolve to 310, per species: **budew→roselia,
  chingling→chimecho, buneary→lopunny, riolu→lucario,
  munchlax→snorlax** (happiness); **bonsly→sudowoodo,
  mimejr→mrmime** (mimic); **happiny→chansey** (oval stone held);
  **mantyke→mantine** (remoraid in party). The same class amends
  cross-gen parents in their shipped files: **lickitung→lickilicky,
  tangela→tangrowth, yanma→yanmega, piloswine→mamoswine** (known
  move), **aipom→ambipom** (double-hit), **sneasel→weavile,
  gligar→gliscor** (razor items), **magneton→magnezone,
  nosepass→probopass** (Mt. Coronet), **eevee→glaceon** (Ice Rock).
  Flavor lines on the baby entries name the 310 honestly.
- **Shipped-stone fallbacks** (items.mjs carries only fire/water/
  thunder/leaf/moon/sun — the Hoenn clamperl fallback precedent):
  shiny-stone → **sunstone** (roselia→roserade, togetic→togekiss),
  dusk-stone → **moonstone** (murkrow→honchkrow,
  misdreavus→mismagius), dawn-stone → **sunstone**
  (kirlia→gallade and snorunt→froslass branches, added as `evos`
  dual representations beside the shipped level evos; their canon
  gender conditions are inexpressible and dropped, recorded here).
- **Held-item trades → bare Link Transfer trades** (Kanto/Johto
  precedent): electabuzz→electivire, magmar→magmortar,
  rhydon→rhyperior, porygon2→porygonz, dusclops→dusknoir (the last
  three parents amended in species3/species4; dusclops/roselia/
  nosepass/kirlia/snorunt amendments land in the GENERATED
  species4.mjs as hand amendments — the arc3 ETL is frozen history;
  regenerating it would need the same amendments re-applied).
- **eevee→leafeon = leafstone** branch in `evos[]` (later-gen canon
  made it a Leaf Stone evolution; the Gen-4 moss rock is a location,
  inexpressible); eevee keeps NO singular `evo` (shipped shape).
- **burmy branch:** singular `evo` = **wormadam at 320** (canon 20
  +300), both branches in `evos[]` — the wurmple precedent (the mon
  record carries no gender the level trigger can read). Mothim-line
  obtainability is S3 placement, as cascoon's was H3's.
- **combee→vespiquen = plain level 321**: canon is female-only;
  the engine has no gender gate. Recorded, not hidden.
- **Phione:** ships as a normal dex entry (489) with NO evo (true
  to canon) and its canon egg groups (water1/fairy). Judgment call:
  it is obtainable ONLY through breeding Manaphy in the shipped egg
  system (mission decision 9 gives Manaphy as an egg-gift event in
  S6); no wild placement is implied by this data stage.
- **Manaphy:** ships with its canon egg groups (water1/fairy) —
  deliberately NOT 'no-eggs': canonically it breeds (with Ditto)
  and the egg hatches Phione, and the shipped breeding system reads
  eggGroups, so the canon semantics ride the data unchanged. No
  special case anywhere.
- **Spiritomb:** plain dex entry with canon data. Its canon
  Odd-Keystone summoning (108 spirits) is inexpressible as data;
  judgment call: obtainability is a placement call for S3/S6 (a
  keystone-site encounter), recorded here so the data stage does
  not silently improvise one. Its flavor line names the keystone.
- **Happiny (incense semantics):** the evolution side resolves via
  the condition class (310, above). The breeding side (Chansey
  holding Luck Incense) is not modelled by the shipped breeding
  system for ANY line — Johto/Hoenn babies shipped the same way —
  so no incense item is invented in this stage.
- **Post-493 evolutions emit NO evo** (out of scope, recorded in
  the ETL notes): eevee→sylveon, sneasel→sneasler, mrmime→mrrime
  targets are post-493 and never referenced.

### 6. Consumers verified (no hardcoded dex ceiling found)

- **Cheat Terminal species picker** reads the gen-tables species
  list (509) — cheat-shop A02/A03-class proofs green at 509.
- **Dex / diploma** read dexNo + form flags from data (S1-02/11).
- **Validator pair:** no new pins needed — gen-tables already emits
  the sinnoh band row from the registry (validator 106 + fuzz
  2000/2000 + save-contract 12/12 green unchanged).
- **Frontier A31 reviewed, NOT superseded:** that suite's SP_ALL is
  deliberately the ≤386 fold and the facility pools are authored
  data; its "merged 395 roster" text remains accurate to what it
  checks, so it stands unedited (136/136).

### 7. Supersessions (by name; totals unchanged)

- **cheat-shop A02:** species count 395 → **509** (assertion text
  superseded in place, items 183 / keepsakes 12 / forms 202
  unchanged).
- **fidelity roster assertion:** 395 → **509** (text superseded in
  place; fidelity also folds SPECIES_SINNOH into ALL_SPECIES, which
  is what lets its evo-target resolution see the §5 parents).

### 8. Gate (this tree)

| Suite | Result |
|---|---|
| sinnoh-checks | **57/57** (37 S0 + 20 new S1) |
| validator.test | **106 passed, 0 failed** |
| validator.fuzz | **2000/2000** |
| save-contract | **12/12** |
| battle-model-checks | **45/45** (hard gate holds) |
| campaign-smoke | **24/24** |
| arc-foundation-checks | **47/47** |
| frontier-checks | **136/136** |
| cheat-shop-checks | **44/44** (A02 supersession above) |
| fidelity-checks | **35/35** (roster supersession above) |
| hoenn-story / contest / legendary | **88/88 · 28/28 · 24/24** |
| johto-story / johto-systems | **110/110 · 62/62** |
| orange-story / orange-climax | **38/38 · 42/42** |
| audit-headless | **17/17** |
| verify-slice | **48/48** |
| qa-slice | **132/134** — failures exactly the named inheritances {s6, l8}, untouched |
| qa-changed-flows | failures exactly **{b2, d9}** |
| rejuv-phase6 | 44/45 — C01 chromium-did-not-start, the named sandbox inheritance, untouched |
| budgets-check | **all gates pass** · contamination **clean** · drift guest ≡ strip(vercel) PASS |

### 9. Budget

- `public/game.js`: 9,935,642 → **10,012,566 B** (+76,924).
- `public/` static total: 10,098,264 → **10,175,188 B** (+76,924).
- Reference: the F4 projection-to-close was **12,115,538 B** vs the
  12,582,912 B gate. At this stage's close the actual total sits
  **2,407,724 B under the gate** — nowhere near the 250,000 B
  stop-tripwire; S1's own delta (+76,924 B for 114 entries incl.
  tiers/idle rows) is the data stage's full cost, and the remaining
  projection headroom is unchanged in kind.
- Fresh build byte-identical to the committed `public/game.js`
  (verified post-commit per the standing drift lesson).
- `personal/` byte-identical to HEAD.

## Arc 4 Stage S2a — Species art, first half (dex 387–439) (2026-10-29)

### 1. What landed

- **53 species authored** (dex 387–439, turtwig → mimejr): turtwig,
  grotle, torterra, chimchar, monferno, infernape, piplup, prinplup,
  empoleon, starly, staravia, staraptor, bidoof, bibarel, kricketot,
  kricketune, shinx, luxio, luxray, budew, roserade, cranidos,
  rampardos, shieldon, bastiodon, burmy, wormadam, mothim, combee,
  vespiquen, pachirisu, buizel, floatzel, cherubi, cherrim, shellos,
  gastrodon, ambipom, drifloon, drifblim, buneary, lopunny, mismagius,
  honchkrow, glameow, purugly, chingling, stunky, skuntank, bronzor,
  bronzong, bonsly, mimejr.
- **106 full frames** (`<id>-front` + `<id>-back` .pix, 64×64, original
  pixel work in the Platinum language — NW-light shading, TRUE REAR
  views: no eyes, back-specific markings: torterra's tree from behind,
  empoleon's gold collar band, bronzor's rear X relief, the slugs'
  dorsal bands, mismagius's plain back under the hat brim). Backs are
  NOT mirrors: front/back row data differs for all 53 (census-checked).
- **106 bob frames** reach the shipped set via the pipeline itself:
  front-bobs by build-art's marked derivation, back-bobs by the W2
  shift-delta mechanism — no hand files, exactly as Johto/Hoenn species.
- **18 accent deltas** for the 9 Sinnoh starter-line species
  (turtwig…empoleon): front-accent = blink (recolor-only), back-accent
  = crest/fin twitch recolor, as .deltapix over the new bases — the
  J2a/H2a starter-accent mechanism, unchanged.
- **Shellos/gastrodon:** ONE authored set each (rose-pink sea slug in
  our colours) — east/west variants are not separate data entries and
  none were created. **Burmy/wormadam/mothim:** one set each for the
  singular data entries.
- Authoring workflow: generator script
  `~/workspace/ashs-journey-qa/arc4-etl/gen-s2a-art.mjs` composes
  per-species authored silhouettes/palettes/markings from the species'
  concept only (clean-room: no sprite was fetched, traced, or derived
  from); the repo's own build-art validation is the gate (palette cap,
  outline, margins, orphans — zero errors). Three visual fixes after
  contact-sheet review: shieldon's shield became a grey face plate
  inset in a yellow head (it read as a detached grey blob), cherrim
  was redrawn as its closed-bud blossom form (the first pass read as
  a pink quadruped), burmy/wormadam cloaks widened a step.

### 2. Pipeline change (on the record)

- **Art-data ceiling raised 7,100,000 → 8,800,000 B** in
  `assets/sprites/tools/build-art.mjs` (the only enforcement site),
  by the H2a measured law: S2a takes art-data to 7,731,350 B of
  payload (file 7,773,711 B) — already past the old cap with zero
  validator errors. The new cap is sized to the Sinnoh-close
  projection (S2b's 61 remaining entries at this stage's measured
  unit ≈ +890,000 → ~8.66 MB incl. S3 tile-art room), no further
  headroom banked; `budgets.json`'s 12,582,912 B hard gate is
  unchanged and still governs (all budgets pass, §4).

### 3. Census (gate)

- Script: `~/workspace/ashs-journey-qa/arc4-etl/census-s2a.mjs`
  (on the census-h2a pattern). **CENSUS S2A: PASS.**
- Every registry entry dex 1–439 (**448 entries** incl. partner +
  forms) has front+back keys in art-data.mjs: **missing 0, blanks 0**.
  The 53 new species: front-bob + back-bob present for all (**missing
  0**); starter accents present (**missing 0**); front ≠ back for
  all 53. **Zero forge fallbacks for dex 387–439.**
- Per-sprite stats for the 106 new frames: painted pixels
  **482–1,476** (median 1,012; H2a floor was 616 — the low end here is
  the small bell/bud species, chingling 482 / burmy 571, by canon
  design), palette sizes **5–12** colours (median 8; cap 32) —
  inside the H2a envelope (5–11) within one colour.
- **Contact sheets:** `~/workspace/ashs-journey-qa/arc4-etl/census-s2a-contact.png`
  (fronts, 1536×1658, 53 labelled at 3×) +
  `census-s2a-contact-backs.png` (backs, same format), visually
  inspected by the implementer: silhouettes nameable at sheet scale
  with the §5 exceptions flagged.
- tests/sinnoh-checks.mjs gains the S2a census section (S2a-01…
  S2a-08): **57 → 65/65**, all prior checks green.

### 4. Battery at this commit

- build-art clean and **deterministic** (two runs → byte-identical
  art-data.mjs, md5 dcc55a18…). 3,764 sprites total, 447 derived
  bobs, 691 delta frames.
- sinnoh-checks **65/65** · fidelity **35/35** · campaign-smoke
  **24/24** · battle-model **45/45 HARD** · qa-changed-flows failures
  exactly **{b2, d9}** · validator **106** + fuzz **2000/2000** +
  save-contract **12/12** · budgets-check **all gates pass** ·
  hoenn-story 88/88 · johto-story 110/110 · frontier 136/136 ·
  arc-foundation 47/47 · cheat-shop 44/44.
- Fresh build (vercel + guest targets) byte-identical to the
  committed public/game.js (sha256 86aed041…, verified across two
  builds). **personal/ byte-identical** (sha256 f434ba63…, untouched).

### 5. Budget (measured)

- public/game.js **10,786,109 B** (S1 close: 10,012,566; **Δ
  +773,543 B = 14,595 B per species** vs the H0/H2a measured art unit
  of 14,483–14,570 B/species — on projection); public static total
  **10,948,731 B** (S1 close 10,175,188; same delta).
- **S2b projection:** 61 remaining entries (dex 440–493 = 54 species
  + 7 formes) × 14,595 ≈ **+890,295 B** → static ≈ 11,839,026 B at
  S2b close. Implied FULL-mission projection-to-close ≈ **12,128,314
  B** (the F4 reference 12,115,538 + this stage's +5,944 over-unit
  drift + S2b at the measured unit) — gate margin ≈ **454,598 B**,
  comfortably outside the coordinator's 250,000 B stop trigger.

### 6. Leftovers, named

- **Weakest silhouettes at 64×64** (flagged for the owner's eye on
  the contact sheet): burmy + wormadam (the leaf cloak + stem reads
  as a hanging green pendant; the face is nearly lost inside the
  cloak — widened once, still the weakest pair), starly (dark wings
  read as detached ovals flanking the pale body; staravia shares the
  family risk to a lesser degree), mothim (the pale wing ovals dwarf
  the striped body), stunky (cream tail plume and face stripe
  under-read at sheet scale — it reads as a generic purple
  quadruped), shieldon (improved in the fix pass; the shield face
  still dominates its small frame). All pass silhouette naming on
  the sheet; first candidates if a polish pass is ordered.
- **Chingling** is the smallest frame of the half (482 painted px) —
  a lone bell by canon design; the ribbon + mouth band carry it.
- Accent deltas for non-starter Sinnoh species are NOT in this
  stage's brief (Johto/Hoenn coverage is likewise starter-only);
  fronts/backs/bobs are complete for the range.
- **S2b (dex 440–493 + 7 formes)** remains: 61 more entries at this
  stage's measured unit cost ≈ +890 KB art, landing art-data
  ≈ 8.66 MB — inside the §2 ceiling as sized.

## Arc 4 Stage S2b — Species art, second half (dex 440–493 + formes) (2026-10-29)

### 1. What landed

- **61 entries authored** (dex 440–493, happiny → arceus, PLUS the 7
  forme entries rotomheat / rotomwash / rotomfrost / rotomfan /
  rotommow / giratinaorigin / shayminsky): happiny, chatot,
  spiritomb, gible, gabite, garchomp, munchlax, riolu, lucario,
  hippopotas, hippowdon, skorupi, drapion, croagunk, toxicroak,
  carnivine, finneon, lumineon, mantyke, snover, abomasnow, weavile,
  magnezone, lickilicky, rhyperior, tangrowth, electivire, magmortar,
  togekiss, yanmega, leafeon, glaceon, gliscor, mamoswine, porygonz,
  gallade, probopass, dusknoir, froslass, rotom, uxie, mesprit,
  azelf, dialga, palkia, heatran, regigigas, giratina, cresselia,
  phione, manaphy, darkrai, shaymin, arceus + the 7 formes.
- **122 full frames** (`<id>-front` + `<id>-back` .pix, 64×64,
  original pixel work in the Platinum language — NW-light shading,
  TRUE REAR views: no eyes, back-specific markings: spiritomb's
  rear swirl-X, hippowdon's dorsal geyser holes, mantyke's back
  smile-marking, dusknoir's back rift, dialga's back fin plates,
  heatran's back crack, arceus's wheel from behind with its centre
  gem). Backs are NOT mirrors: front/back row data differs for all
  61 (census-checked).
- **122 bob frames** reach the shipped set via the pipeline itself:
  front-bobs by build-art's marked derivation, back-bobs by the W2
  shift-delta mechanism — no hand files, exactly as S2a species.
- **18 accent deltas** for the 9 marquee legendary entries in this
  half (dialga, palkia, giratina, giratinaorigin, cresselia,
  darkrai, shaymin, shayminsky, arceus): front-accent = blink
  (recolor-only), back-accent = crest/fin twitch recolor, as
  .deltapix over the new bases — the J2b/H2b marquee mechanism,
  unchanged. **Arceus is the capstone of the whole game and its set
  got the most care in this stage:** the gold wheel is drawn as a
  true ring around the mid-body (four spokes, centre gem on the
  back view), gold hooves, flowing mane, green/red eye detail —
  the largest authored frame of the half after the wheel's own
  geometry (front 1,484 painted px).
- **Forme distinctness (the stage's named risk, discharged):**
  giratina-origin is a separate drawing from giratina-altered —
  front row data differs in **1,425 of 4,096 cells**: origin is a
  legless serpentine coil with six wing spikes and a crown, altered
  is the hexapod with six stilt legs, gold neck rings and red wing
  blades. Shaymin-sky likewise differs from shaymin-land in **1,170
  cells** (long-legged canine with green wing-ears and a red petal
  scarf vs the land forme's grass hedgehog mound with flowers).
  The 5 rotom formes share the plasma core (head + aura arms —
  that IS their concept) over five clearly distinct appliance
  bodies (oven / washer / fridge / fan / mower): every pairwise
  front differs in **≥438 cells** (min heat↔wash), and each shell
  reads at sheet scale, fronts AND backs.
- **Spiritomb:** one set, as briefed — the swirl visage is painted
  on the wisp mass above an honest grey keystone (cracked base,
  inset panel); the back carries the swirl as an X-rune with gem
  dots, no face.
- Authoring workflow: generator script
  `~/workspace/ashs-journey-qa/arc4-etl/gen-s2b-art.mjs` mirrors
  gen-s2a exactly, composing per-species authored silhouettes/
  palettes/markings from the species' concept only (clean-room:
  no sprite was fetched, traced, or derived from); the repo's own
  build-art validation is the gate (palette cap, outline, margins,
  orphans — zero errors after fixes in the art, never the
  validator: gabite's fin tips and giratina-origin's tail tip
  orphan pixels were thickened in the drawings). Six visual fixes
  after contact-sheet review: chatot's note-head enlarged,
  skorupi's tail given a solid segmented spine, tangrowth's arms
  re-shaded light so they separate from the vine mass, porygonz
  gained its body band + patch, giratina-origin's wing spikes
  enlarged, dialga's neck thickened and crest raised.

### 2. Pipeline / ceiling (on the record)

- **No ceiling change.** The art-data ceiling stays **8,800,000 B**
  (raised in S2a, sized to the Sinnoh-close projection). S2b lands
  art-data at **8,663,315 B** (file bytes; payload within) —
  headroom 136,685 B, which is S3's tile-art room on the S2a
  sizing, NOT spare species room. `budgets.json`'s 12,582,912 B
  hard gate is unchanged and still governs (all budgets pass, §4).

### 3. Census (gate)

- Script: `~/workspace/ashs-journey-qa/arc4-etl/census-s2b.mjs`
  (on the census-s2a pattern). **CENSUS S2B: PASS.**
- **Roster-wide: every registry entry (509 entries incl. partner +
  all formes) has front+back keys in art-data.mjs: missing 0,
  blanks 0 — the roster-wide forge-fallback count is 0.** With
  S2b, Sinnoh species art is complete and NO forge fallback
  remains anywhere in the dex 1–493 range.
- The 61 new entries: front-bob + back-bob present for all
  (**missing 0**); marquee accents present (**missing 0**);
  front ≠ back for all 61; forme-distinctness diffs as §1.
- Per-sprite stats for the 122 new frames: painted pixels
  **630–1,633** (median 1,090; S2a: 482–1,476, median 1,012 — this
  half runs bigger: legendaries + appliance bodies), palette sizes
  **5–12** colours (median 8; cap 32) — the S2a envelope held
  exactly.
- **Contact sheets:** `~/workspace/ashs-journey-qa/arc4-etl/census-s2b-contact.png`
  (fronts, 1536×1454, 61 labelled at 3×) +
  `census-s2b-contact-backs.png` (backs, same format), visually
  inspected by the implementer: silhouettes nameable at sheet
  scale with the §5 exceptions flagged.
- tests/sinnoh-checks.mjs gains the S2b census section (S2b-01…
  S2b-09, incl. the roster-wide S2b-09): **65 → 74/74**, all prior
  checks green.

### 4. Battery at this commit

- build-art clean and **deterministic** (two runs → byte-identical
  art-data.mjs, md5 68fd45a9…). 4,026 sprites total, 508 derived
  bobs, 709 delta frames.
- sinnoh-checks **74/74** · fidelity **35/35** · campaign-smoke
  **24/24** · battle-model **45/45 HARD** · qa-changed-flows failures
  exactly **{b2, d9}** (55/57) · qa-slice failures exactly the named
  inheritances **{s6, l8}** (132/134) · verify-slice **48/48** ·
  validator **106** + fuzz **2000/2000** + save-contract **12/12** ·
  budgets-check **all gates pass** · contamination **clean** ·
  hoenn-story 88/88 · johto-story 110/110 · frontier 136/136 ·
  arc-foundation 47/47 · cheat-shop 44/44.
- Fresh build (vercel + guest targets) byte-identical to the
  committed public/game.js (sha256 d0d56203…, verified across two
  builds). **personal/ byte-identical** (sha256 f434ba63…,
  restored from HEAD after verify-slice's full rebuild).

### 5. Budget (measured)

- public/game.js **11,675,671 B** (S2a close: 10,786,109; **Δ
  +889,562 B = 14,583 B per entry** vs S2a's measured unit of
  14,595 B/species — on projection, −0.1%); public static total
  **11,838,293 B** (S2a close 10,948,731; same delta).
- **Restated full-mission projection-to-close ≈ 12,127,581 B**
  (S2a's implied 12,128,314 with S2b's actual −733 B under-unit
  drift applied) — gate margin ≈ **455,331 B**, comfortably
  outside the coordinator's 250,000 B stop trigger. No stop.

### 6. Leftovers, named

- **Weakest silhouettes at 64×64** (flagged for the owner's eye on
  the contact sheet): porygonz (the detached tilted head + plain
  body reads near-abstract — canon-true disjointedness, but the
  plainest frame of the half), yanmega (the four glass wings
  cluster over the head and the whole reads helicopter-adjacent
  before it reads dragonfly), giratinaorigin (deliberately spare
  next to altered's bulk — the coil + spikes name it, but it is
  the lightest legendary frame), skorupi (small; its solid tail
  spine helped, it still reads slighter than drapion beside it),
  tangrowth (improved in the fix pass; the vine mass is still the
  plainest mid-half body). All pass silhouette naming on the
  sheet; first candidates if a polish pass is ordered.
- **Riolu's back** carries an odd dark-ring patch (collar + tail
  geometry from behind) — honest rear, flagged here rather than
  smoothed over.
- Accent deltas for non-marquee Sinnoh species are NOT in this
  stage's brief (S2a/Johto/Hoenn coverage is likewise
  marquee-only); fronts/backs/bobs are complete for the range.
- **Sinnoh species art (S2) is now COMPLETE across both halves:**
  114/114 entries authored (387–493 + formes), zero forge
  fallbacks roster-wide (509/509).

---

## Arc 4 Stage S3a — Sinnoh maps, west/central (2026-10-29)

Base: main @ 71f98ff (S2b). Deliverable: NEW `src/data/maps9.mjs`
(export `MAPS9`; registered in `scripts/module-order.json` after
`maps8.mjs`; folded in `merge.mjs` exactly as maps8 was), generated
deterministically by `~/workspace/ashs-journey-qa/arc4-etl/gen_maps9.py`
(two runs byte-identical; edit the generator, not the file). Rigs in
the same folder: `sinnoh-sweep.mjs`, `sinnoh-richness.mjs`,
`sinnoh-enc-audit.mjs`, `gen_s3a_art.py`.

### ⚠ BUDGET — PROJECTION INSIDE THE 250K STOP TRIGGER (coordinator ruling required before S3b)

Measured at this commit: `public/game.js` **11,863,277 B** (byte
length; S2b close 11,675,671, **Δ +187,606**), public static total
**12,025,899 B** (S2b close 11,838,293, same delta; index/admin
unchanged). Restated full-mission projection-to-close, built from
MEASURED per-stage analogues in this repo's own history (not the
S2b model, whose remaining-stages allowance of 289,288 B for all of
S3–S9 is now demonstrably too small — S3a alone consumed 187,606 B
of it): S3b maps ≈ +140,000 (H3b measured +134,233 / J3b +150,066),
S5a+S5b story ≈ +135,000 (H4a +64,881 / H4b +68,496), S4 systems
≈ +40,000 (J6 +50,865 / H5 +21,940), S6 legendary ≈ +50,000 (H6
+43,199 ×13 arcs), S7 finale ≈ +25,000, S8/S9 ≈ +3,000 → remaining
≈ **+393,000**, projection-to-close ≈ **12,418,899 B** vs gate
12,582,912 B → **margin ≈ 164,013 B, INSIDE the coordinator's
250,000 B stop trigger.** Per the budget law this is surfaced, not
solved: no art was shrunk, no ceiling raised by this stage beyond
the recorded palette-cap procedure (§2), and **S3b should not start
until the coordinator rules** (options are theirs: trim S3b scope,
re-derive the gate, or accept the margin). This stage is committed
complete because its own gates are all green and the trigger is a
projection-to-close ruling, not a defect in the landed work.

### 1. What landed — 62 maps

- **Settlements (10):** `twinleaf` 28×18, `sandgem` 28×18,
  `jubilife` 30×20, `oreburgh` 30×18, `floaroma` 28×18, `eterna`
  30×18, `hearthome` 30×20, `solaceon` 28×18, `veilstone` 30×18,
  `canalave` 30×18 — all ≥24×14 viewport-filling (P-1). Shared
  `center`/`mart` interiors serve every settlement via `via{}`
  tickets exactly as Johto/Hoenn (Twinleaf fields both, per the
  brief's per-settlement law). Gyms ×5 (`gym-oreburgh/eterna/
  hearthome/veilstone/canalave`, layouts only — leaders/battles
  are S5), plus `rowan-lab` (Sandgem), `jubilife-tv` +
  `house-jubilife-condo` (Jubilife flavour), `galactic-eterna`,
  `galactic-hq` (dressed places; their story is S5's),
  `contest-hearthome` (dressed, NPC-free hall floor, reception
  counter + stage + `contestHall: 'hearthome'` — S4 wires the
  Super Contest reskin), `canalave-library`, houses ×14.
- **Routes (14):** `r201`–`r212` as the geography requires (201,
  202, 203, 204, 205, 206, 207, 208, 209, 210, 211 west, 212
  north), `r215` (the Solaceon→Veilstone road), `r218` (the
  Jubilife→Canalave causeway — a boardwalk footpath over open
  water, so the Canalave leg is walkable on foot, not surf-only).
  **Route 212 is the NORTH segment only:** its south end is fenced
  and signed ("the maps, for now, stop"); Pastoria is S3b and is
  never faked.
- **Dungeons/places (13):** `lake-verity` + `lake-verity-cave`,
  `oreburgh-mine`, `ravaged-path` (the Route 204↔Floaroma
  through-passage, Union Cave idiom), `valley-windworks` (interior;
  its building stands on r205), `eterna-forest` (through-passage),
  `old-chateau` (interior — Rotom's room exists as a place: the
  small north-east chamber with the old television + its sign; the
  forme system lands S4), `wayward-cave` (dark; Gible's nest),
  `mt-coronet-south` (doors west r207 / south r208 / north
  central), `mt-coronet-central` (two-storey cavern: lower hall +
  upper gallery joined by a one-way stair pair, west door r211),
  `solaceon-ruins`, `lost-tower` (on r209), `amity-square`
  (Hearthome's north-gate park).
- **Coronet extension seam (for S3b):** the central cavern's upper
  gallery north wall (row 0, cols 13–14) is where the north stair
  to the summit floors will be cut — no other tile, warp, or
  landing in either Coronet map needs to move. The unfinished
  stair is signed in-fiction at the gallery's north edge.

### 2. Identity + tile art

- **Sinnoh identity system extended** (the W5/J3/H3 machinery,
  fourth region): `SINNOH_TOWN_ORDER`/`SINNOH_TOWN_STYLE`/
  `SINNOH_TOWN_CHARS` in `src/engine/tiles.mjs` — all fourteen
  settlements reserved at U+1E00 idx 412+i·8…419+i·8 (Hoenn towns
  end at 395, H3b kinds at 403, S3 kinds at 404..411); the ten
  S3a towns own the eight signature kinds (tg/tg2/tc/td/tr/tl/th/
  tw); the four east towns (pastoria/celestic/snowpoint/sunnyshore,
  idx 492..523) are reserved exactly as Hoenn reserved its east
  towns at H3a — S3b authors their tiles. `WALKABLE` in
  `src/data/maps.mjs` gains the ten towns' tg/tg2 chars + the S3
  floor chars by the same spread precedent; `src/engine/art.mjs`
  wires `SINNOH_TOWN_ORDER` into TILE_ART / FACADE_GROUPS /
  floor-variant / prop / ground-family paths exactly as Hoenn.
- **Eight Sinnoh kinds** (`S3_KIND_DEFS`, U+1E00+404…411): floors
  `flowerfield` (Floaroma meadows), `harbourstone` (Canalave
  harbour), `coronetfloor` (Coronet scree); wall `coronetrock`
  (banded strata); props `honeytree`, `windmill` (Valley
  Windworks), `ironarch` (Canalave drawbridge), `contestdome`
  (Hearthome grandeur). Town idioms ride the identity palettes:
  Oreburgh industrial (mine building + carts + museum), Eterna
  historic (stone quarter + statue keeper), Hearthome contest
  grandeur (dome props + flower plaza + Amity gate), Canalave
  harbour (canal + drawbridge + pier), Veilstone meteor field +
  department store.
- **88 new tile .pix sources** (80 town-identity + 8 kinds) under
  `assets/sprites/pix/tiles/`, authored by
  `~/workspace/ashs-journey-qa/arc4-etl/gen_s3a_art.py`;
  `art-data.mjs` regenerated via `build-art.mjs` only (two runs
  byte-identical). **Spend: 45,210 B** (8,663,315 → 8,708,525 B)
  against the stage's 136,685 B headroom under the **8,800,000 B
  ceiling — NOT raised**; headroom remaining for S3b: **91,475 B**
  (≈40 east-town tiles + kinds at this stage's measured
  ≈514 B/tile ≈ 21–26 KB — S3b's tile plan fits the residue).
- **Palette budget:** the tiles family union rose 996 →
  **1106** painted hexes (ten new town anchors + shades by
  design), so `FAMILY_PALETTE_BUDGETS.tiles` is raised 1010 →
  **1120** in `build-art.mjs` (cap just above the measured union,
  no headroom banked; `palette-audit.mjs` mirror updated; the
  audit's tiles line PASSes at 1106 ≤ 1120 — its 4 summary
  failures are the pre-existing slop-blacklist hits in shipped
  tile-water files, identical at base 71f98ff) — the
  J3a/J3b/H3a/H3b ratified-raise procedure.

### 3. Connectivity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/arc4-etl/sinnoh-sweep.mjs`
  (celadon discipline: real BFS walking on the engine WALKABLE set
  + Surf assumed, loadMap-faithful NPC model incl. the outdoor
  mart-clerk filter, interiors as connectors to fixpoint; NO
  position seeding). **All 62 maps PASS**: every entry reaches
  every warp, **zero bad warp landings**, and the map graph from
  `sandgem` reaches all 62 (Twinleaf + Lake Verity west; Jubilife
  + the r218 causeway to Canalave; Oreburgh + mine; the Ravaged
  Path through-passage to Floaroma; r205 + Eterna Forest to
  Eterna; the 206/207/208 foothill web into both Coronet caverns;
  the Hearthome → r209/Lost Tower → Solaceon → r210 → r215 →
  Veilstone north loop; Amity Square; r212-north as a signed
  dead-end segment).
- **Canalave ferry port:** CAPT WESTWIND stands on the harbour
  pier boardwalk at (13,13) — `ferry: 'vermilion', ferryArc:
  'sinnoh'` — wired exactly as maps6's Olivine port and maps7's
  Slateport port; the return is unconditional once reached. The
  Sandgem↔Canalave leg is proven on foot by the sweep (r202 →
  Jubilife → r218 causeway).

### 4. Richness + identity (gate) — PASS

- Script: `~/workspace/ashs-journey-qa/arc4-etl/sinnoh-richness.mjs`
  (W5 logical-raster method, real resolver + ART). **All 62 maps
  pass their floors.** Towns 137–159 colours (floor 80; floaroma
  137 is the minimum); town ground-family shares ≤25.7% and top
  single ground KIND ≤25.7% (gate ≤40%). Land routes 148–189
  (floor 60); r218 causeway 104 (water map, floor 60); interiors
  55–70 (floor 55; canalave-library 55 is the minimum); caves
  47–81 (floor 45; mt-coronet-central 47 is the minimum — the
  two-storey slate cavern is deliberately spare).
- **Tile-kind Jaccard, settlements (pairwise, target ≤0.60): all
  45 pairs PASS** — max **0.533** (oreburgh~veilstone), min 0.255
  (twinleaf~canalave). Every settlement carries its 8 signature
  kinds plus a landmark: Twinleaf (the two starter houses),
  Sandgem (Rowan's lab + beach), Jubilife (TV tower + condos),
  Oreburgh (the mine + museum), Floaroma (honey-tree meadows),
  Eterna (the tall building + statue quarter), Hearthome (Contest
  Hall dome + Amity Square), Solaceon (the ruins + day care),
  Veilstone (meteor field + department store + HQ), Canalave
  (canal + drawbridge + library + pier).

### 5. Encounters + weather + placements

- Audit: `~/workspace/ashs-journey-qa/arc4-etl/sinnoh-enc-audit.mjs`
  — **PASS: 289 entries across 36 encounter-bearing maps**, 72
  distinct species; every species exists in the merged roster; no
  legendaries; no starter lines; levels span **301–343**, inside
  band 301–400 on the progression curve (Twinleaf country
  301–308 → Oreburgh 310–318 → Eterna Forest 319–326 → Coronet
  central 326–338 → r215/Veilstone 334–343, Canalave water
  332–340).
- **S1 deferrals, discharged:** **Mothim is wild-obtainable** —
  Eterna Forest (w6, Lv320–326) and Route 205 (w4, Lv317–322),
  the honey-tree country (honeytree props stand on both maps and
  Floaroma's meadows; the Floaroma sign names the placement).
  **Spiritomb is NOT placed wild anywhere** — its summoning
  remains an S6 arc decision, confirmed here per the brief.
  Bonus canon placements: Drifloon rides r205 (the windworks'
  own ground — the interior carries no table, as interior floors
  never trigger the encounter branches), Gible + Gabite in
  Wayward Cave, Cranidos + Shieldon rare in Oreburgh Mine,
  Feebas-class honesty: no equivalent was forced.
- **Weather field per outdoor map** (data only): 25 outdoor maps
  — clear ×21, **sun ×2** (oreburgh, r207), **rain ×2** (r218,
  eterna-forest). Interiors carry none.

### 6. Battery at this commit

- **sinnoh-checks 74 → 89/89** (15 new S3a checks: accounting,
  viewport law, center/mart-via per settlement, story places,
  warp integrity, sandgem graph reachability, in-suite encounter
  audit, deferral placements, ferry port, Coronet spine, Rotom
  room, r212 honesty, tile identity, authored-art resolution,
  weather law). **Supersession by name:** A27's F-1 census moves
  38 entries / 36 unique → **41 entries / 39 unique** (maps9 adds
  Route 212 — North, Mt. Coronet — South, Mt. Coronet — Central —
  all covered by the same F-1 em-dash charset; totals otherwise
  unchanged).
- fidelity **35/35** · campaign-smoke **24/24** · battle-model
  **45/45** · arc-foundation **47/47** · frontier **136/136** ·
  hoenn-story **88/88** · qa-changed-flows failures exactly
  **{b2, d9}** (55/57) · qa-slice failures exactly **{s6, l8}**
  (132/134) · rejuv-phase2 failures exactly **{A09, C01}** (38/40)
  · validator **106** + fuzz **2000/2000** + save-contract
  **12/12** · budgets: all gates pass (vercel static 12,025,899 ≤
  12,582,912).
- build-art clean + deterministic; gen_maps9 deterministic;
  fresh build byte-identical to committed public/game.js
  (sha256 38f8b032…). **personal/ byte-identical** (sha256
  f434ba63…, restored from HEAD after the build — zero personal/
  paths in this diff; vercel+guest targets only, dist/ restored).

### 7. Leftovers, named (S3b/S4/S5's list)

- Gym interiors are layouts only (leaders/battles/story are S5);
  the Contest Hall is an inert dressed floor until S4 wires the
  Super Contest reskin (the `contestHall` field + counter + stage
  are the seam); the Galactic buildings are dressed places until
  S5's story pass; Rotom's room is a place until S4's forme
  system; Wayward Cave is `dark: true` with no HM gating in this
  stage (Defog/Rock Climb are S4 — no shipped-region map was
  retro-gated).
- The Coronet central stair pair is one-way by design (west stair
  climbs, east stair descends — the Pike-door idiom); the gallery
  north wall seam is S3b's cut point (see §1).
- S3b heads-up: art-data headroom is **91,475 B**; east town chars
  continue at U+1E00 idx 492+; the tiles palette union will grow
  again (~+55 projected for four towns) — re-measure before
  raising. **And the §0 projection flag stands: S3b does not
  start without the coordinator's budget ruling.**

## Arc 4 Stage S3b — Sinnoh maps, east/north + Distortion World (2026-10-29)

Base: main @ 5a8838b (S3a). Deliverable: `src/data/maps9.mjs` grows
62 → **139 maps** (export `MAPS9` unchanged; no new module), still
generated deterministically by the SAME generator, extended in
place (`~/workspace/ashs-journey-qa/arc4-etl/gen_maps9.py`, two runs
byte-identical; edit the generator, not the file). Rigs in the same
folder, rescoped to all of MAPS9: `sinnoh-sweep.mjs`,
`sinnoh-richness.mjs`, `sinnoh-enc-audit.mjs`; art generator
`gen_s3a_art.py` extended in place (S3a tiles byte-unchanged).

### 0. The coordinator BUDGET RULING — post-S3a (binding on this stage, recorded verbatim in substance)

S3a closed with its projection inside the 250K stop trigger; the
coordinator ruled before S3b started, and this stage was executed
under that ruling: **(1)** the hard gate **12,582,912 B never
moves**; **(2)** S3b's stage allowance is **+200,000 B public
static total max** (the H3b/J3b analogues, re-based on S3a's
measured +187,606); **(3)** inside it, the art-data internal
ceiling (8,800,000 B) may be raised ONLY via the recorded
ratified-raise procedure and ONLY by measured tile need — the
S3a-close headroom was **91,475 B**; **(4)** every later stage's
own close restates the projection; if any restated margin falls
below **150,000 B**, the NEXT stage plans to a byte allowance set
by the coordinator before it starts (austerity tripwire).
**Actuals vs the ruling:** public static total 12,025,899 →
**12,224,915 B, Δ +199,016 — inside the +200,000 allowance by
984 B** (`public/game.js` 11,863,277 → 12,062,293, same delta;
index/admin unchanged). Art-data 8,708,525 → **8,729,120 B
(+20,595)** — the 8.8 MB ceiling was **NOT raised** (70,880 B of
headroom remains). The tiles palette cap WAS raised by the
ratified procedure, 1120 → **1180**, on measured need: the union
measures **1171 hexes** after the four east settlements' 32
identity tiles + 8 S3B kinds (recorded at the cap in
`assets/sprites/tools/build-art.mjs`, mirrored in
`palette-audit.mjs`). **Restated projection-to-close:** S4 ≈
+40,000, S5a+S5b ≈ +135,000, S6 ≈ +50,000, S7 ≈ +25,000, S8/S9 ≈
+3,000 (the S3a analogues unchanged — no S3b evidence revises
them) → remaining ≈ +253,000 → projection ≈ **12,477,915 B**,
margin ≈ **104,997 B — BELOW the ruling's 150,000 B austerity
tripwire. The tripwire therefore fires for S4: S4 plans to a
coordinator-set byte allowance before it starts.** This stage is
committed complete: its own allowance held and every gate is
green; the tripwire is a forward planning constraint, exactly as
the ruling designs it.

### 1. What landed — 77 new maps (139 total in maps9)

- **Settlements (4) + the League:** `pastoria` 30×18 (Great Marsh
  gatehouse on its north fence), `celestic` 28×16 (shrine town),
  `snowpoint` 30×18 (snow country; temple + harbour + the
  Battle-Zone ferry captain on the pier), `sunnyshore` 30×18
  (solar-panel roads, lighthouse, the League causeway east) —
  all ≥24×14 viewport-filling, all fielding Center + Mart via
  the shared `via{}` idiom. `pokemon-league` 28×16
  (settlement-class exterior on its waterfall plateau) +
  `league-lobby` + `league-chamber-1..4` + `league-champion`:
  the full Elite Four approach as dressed places (battles S5).
- **Battle Zone (the byte call, recorded):** the allowance HELD,
  so `fight-area` / `survival-area` / `resort-area` ship at
  **settlement-lite standard — real places** (24×14, their own
  Center + Mart via `via{}`, a house each, the Resort's villa) —
  NOT fenced-and-signed. The fence fallback the brief allowed was
  not needed.
- **Routes (20):** `r212-south` (the fence S3a signed is OPEN),
  `r210-north` (**fog segment**, §4), `r213`, `r214` (the
  Veilstone→Valor shore road — opens Veilstone's second south
  lane), `spring-path`, `r216`, `r217` (snow climb country),
  `r219`–`r224` (the Sandgem sea lane + the Pal Park approach +
  the Sunyshore/League coast + the Seabreak run), `r225`–`r230`
  (the Battle Zone island loop: snow pass, ash desert, coast
  water).
- **Dungeons/places (23):** `lake-valor` (restored lake) +
  `lake-valor-cave`, `lake-acuity` (frozen) + `lake-acuity-cave`,
  `sendoff-spring` + `turnback-cave` (**the Griseous Orb chamber
  exists as a place**, signed; S4 wires the switch),
  `great-marsh-gate` + `great-marsh-west/east/north` (the Safari
  PLACE set — playable maps with bog tables; the Safari-format
  reskin lands S4), `mt-coronet-north` (**through the S3a seam**:
  the central gallery's north wall, row 0 cols 13–14, warps
  here; the "UNFINISHED" sign is reworded "THE NORTH STAIR"),
  `spear-pillar`, `hall-of-origin` (the place exists above the
  Pillar; S7 unlocks reaching it), `snowpoint-temple` +
  `snowpoint-temple-depths`, `iron-island` + `iron-island-mine`,
  `stark-mountain` + `stark-interior`, `victory-road`,
  `fuego-ironworks` (its building now stands on r205),
  `fullmoon-island`, `newmoon-island`, `flower-paradise` (exists
  as a place off `seabreak-path`; S6 gates its event).
- **Interiors (21):** houses ×8 (incl. the Resort villa), gyms
  ×3 (`gym-pastoria/snowpoint/sunnyshore`, layouts only),
  `celestic-shrine`, `sunnyshore-lighthouse`, + the League chain
  and temple depths above.
- **S3a maps patched at seams only:** r212 fence → r212-south;
  veilstone second south lane → r214; sandgem beach lane → r219;
  r210 west lane → r210-north; r205 gains the Fuego building;
  mt-coronet-central's seam warps (above); canalave's pier gains
  two plain-ferry sailors (Brine → Iron Island, Luna → Fullmoon);
  snowpoint ⇄ fight-area ferry captains. No other S3a map
  content changed.

### 2. The Distortion World — this stage's best map work, honestly bounded

Six maps, all `indoor: true, distortion: true` (the field is the
S5 tint/weather hook): `distortion-entrance` (the Threshold,
reached ONLY through Turnback Cave's Griseous-chamber portal —
the Spear Pillar entry is S5's story), `distortion-depths`,
`distortion-isles` (floating islets on a void field, bridged by
narrow causeways), `distortion-falls`, `distortion-abyss`,
`distortion-platform` (Giratina's platform; the return portal
stands on it). Traversal is proven in-suite (S3b-10): entrance →
depths → isles → falls → abyss → platform by the warp graph, and
every DW map carries a warp out — no soft locks. **What the
engine can and cannot do, stated plainly:** there is no gravity
or z-axis in this engine, so the World's inverted geography is
expressed the honest way — tilted platform layouts, floating
islets over void, and **waterfalls walked as a floor family**
(`distortfalls` is a WALKABLE floor kind, like surf-water is a
floor family in the overworld idiom): you walk the falls because
in this world the falls are ground. Nothing fakes an engine
feature that does not exist; the bespoke presentation (tint,
drift, Giratina) is S5's, driven through the `distortion` field
+ weather hooks these maps already carry.

### 3. Tiles & art spend

40 new `.pix` tiles via the S3a programme: the four east towns ×
8 identity kinds at U+1E00 **idx 492–523** (the block S3a
reserved; anchors: pastoria marsh green `#6a994e`, celestic
shrine violet `#957fef`, snowpoint snow white `#caf0f8`,
sunnyshore solar gold `#ffd166`) + 8 S3B kind tiles at idx
524–531 (`marshbog`/`distortfloor`/`distortfalls` floors,
`climbwall`/`distortrock` walls, `marshreed`/`solarpanel`/
`originstone` props), wired through `tiles.mjs` (`S3B_KIND_DEFS`)
+ `art.mjs` exactly as S3a wired S3. Sprite audit: 6348/6352
(the 4 failures are the inherited water-tile TODO markers, also
failing at S3a close: 6308/6312 — not this stage's tiles).

### 4. Systems geography authored (systems land S4)

- **Fog:** `r210-north` carries `weather: 'fog'` — the field
  `src/game/weather.mjs` reads (`mapDef.weather`), the
  `diveSpots` precedent from Hoenn. The only fog map in Sinnoh.
- **Rock Climb gates:** `climbwall` tiles (TILE_CHARS kind
  `climbwall`, wall-class) stand on **r217**'s north bench, in
  **victory-road**'s east ledge, and on **mt-coronet-north**'s
  west shelf — each beside an ungated through-road, exactly the
  Cut/Surf gate idiom: the maps carry the gates today, S4 wires
  the move, nothing is hard-gated before the move exists.
- **Ferries:** plain ferry NPCs (the shipped intra-region
  idiom): Snowpoint ⇄ Fight Area (CAPT NORTHSTAR), Canalave →
  Iron Island / Fullmoon Island, Fullmoon ⇄ Newmoon (the moon
  boatman). No story gates on any of them (return-ticket law).

### 5. Encounters (rig: `sinnoh-enc-audit.mjs`, PASS)

S3b tables: **484 entries**, span **336–400** — Pastoria country
opens in the 340s, the League approach climbs 385–398, Stark
Mountain + the Battle Zone sit at the 388–400 cap. Marsh tables
carry the Safari canon (Carnivine, Skorupi, Croagunk, Wooper,
Yanma, Tropius in the deep bogs). Across all of maps9: **773
entries / 128 species, span 301–400** — no legendaries, no
starter lines, no Rotom, no Spiritomb, no lake trio placed wild.

### 6. Proof

- **Walking sweep** (`sinnoh-sweep.mjs`, all 139 maps): **PASS —
  zero bad landings**; the warp+ferry graph from `sandgem`
  reaches **139/139** (Coronet seam, Battle Zone ferry, Turnback
  portal included).
- **Jaccard:** settlement tile-kind sets, **all 14 settlements,
  91/91 pairs ≤ 0.60, max 0.533** (oreburgh~veilstone, unchanged
  from S3a).
- **Richness:** PASS all 139 maps (new towns: pastoria 146,
  celestic 142, snowpoint 166, sunnyshore 166 distinct colours;
  snow reads as snow, the Distortion World rooms pass the cave
  floor on their expanded distort palettes).
- **sinnoh-checks 89 → 105/105.** Supersessions BY NAME: A27 F-1
  census 41/39 → **59/57** (eighteen new em-dash names, same F-1
  charset); S3a-01 rescoped to the S3a set (the 139 total is
  pinned at S3b-01); S3a-07 rescoped to the S3a tables (289; the
  S3b tables are S3b-07: 484); S3a-12 updated — the r212 fence is
  open (warps reach hearthome + r212-south). New S3b-01…16:
  accounting, viewport law, via{} service law incl. the lite
  areas, story places, warp integrity, 139/139 reachability, the
  encounter audit, the Coronet seam, fog + climbwall geography,
  Distortion World traversal + `distortion` fields, the Great
  Marsh chain, the ferry web, east-town tile identity (idx 492+,
  authored art, no forge fallbacks), the weather law, the League
  chamber chain, the Battle Zone loop.

### 7. Battery

sinnoh-checks **105/105** · qa-changed-flows failures exactly
**{b2, d9}** · qa-slice exactly **{s6, l8}** (132/134) +
verify-slice 48/48 · rejuv-phase2 exactly **{A09, C01}** (38/40)
· battle-model **45/45** · campaign **24/24** · arc-foundation
**47/47** · frontier **136/136** · hoenn-story **88/88** ·
fidelity **35/35** · validator **106** + fuzz **2000/2000** +
save-contract **12/12** · budgets-check **all gates pass**
(vercel static 12,153,853 ≤ 12,582,912 on the budgets accounting,
which excludes admin). Fresh build byte-identical post-commit;
`personal/` byte-identical (sha f434ba63… / a780af0b…).

### 8. Open items handed on

- **S4 plans to a coordinator-set byte allowance** (the §0
  tripwire: restated margin ≈ 104,997 B < 150,000 B).
- S4 wires: the Safari reskin on the Great Marsh set, the
  Griseous Orb switch in Turnback Cave, Rock Climb on the
  authored `climbwall` gates, Defog/fog reading on r210-north.
- S5: the League battles in the shipped chambers, the Galactic
  finale + the Spear Pillar Distortion entry, DW presentation
  via the `distortion` field. S6: Flower Paradise's event gate.
  S7: reaching the Hall of Origin.
- The Slowking-class forge-fallback watch carries on: every S3b
  tile is authored (S3b-13 pins it), nothing new rides the forge.

## Arc 4 Stage S4 — Sinnoh systems: Defog/Rock Climb, Great Marsh, Super Contests, forme-switch (2026-10-29)

Base: main @ a942943 (S3b). Deliverable: the four Sinnoh systems
wired onto shipped engines — two new HMs in the shipped HM idiom,
the Great Marsh as a data-only Safari reskin, Super Contests as a
data-only contest-lite reskin with the Platinum rank ladder, and
the Giratina/Shaymin/Rotom forme-switch riding the Deoxys mechanic
exactly. One new module (`src/game/sinnoh-systems.mjs`, registered
in `scripts/module-order.json` after johto-systems); everything
else is edits to shipped files. No new persisted state was minted
(state-quintet accounting in §5).

### 0. Budget vs the coordinator allowance

S4 planned to the coordinator-set allowance of **+55,000 B public
static total max** (the S3b §0 tripwire fired; the allowance is
recorded in the mission doc). **Actuals: public static total
12,224,915 → 12,251,036 B, Δ +26,121 — inside the allowance by
28,879 B** (`public/game.js` 12,062,293 → 12,088,414 B, the same
delta; index/admin carry no S4 growth beyond the build's content
hash). The stage also lands under the S3b projection's original
S4 estimate (+40,000). **Restated projection-to-close:** S5a+S5b
≈ +135,000, S6 ≈ +50,000, S7 ≈ +25,000, S8/S9 ≈ +3,000 (unchanged
analogues) → remaining ≈ +213,000 → projection ≈ **12,464,036 B**,
margin ≈ **118,876 B** vs the 12,582,912 B gate — still below the
150,000 B austerity tripwire, so **S5 likewise plans to a
coordinator-set byte allowance before it starts.**

### 1. HM06 Defog + HM07 Rock Climb (the shipped HM idiom)

`HM_MOVES` continues the shipped sequence (6: defog, 7: rockclimb
— the in-game numbering continues the shipped 1–5; Platinum's
HM05/HM08 numbering is noted in the data comments). ITEMS gains
the two hm-pocket rows through the same generation loop as
HM01–05, plus the Gracidea (§4). Moves are real battle moves in
moves2 (defog: flying/status, eva −1, PP 15; rockclimb: normal
90/85, PP 20, confusion 20%). Field use lives in
overworld-systems beside Dive's: `defogInteract` (any faced
position on a fog map) and `climbInteract` on S3b's authored
`climbwall` tiles (landing = the tile beyond the wall in the
facing direction, walkable-checked; up/down are the same gate read
from either side — the r217 x16 pairing is the suite-proven one,
beside the authored sign at (17,6)). Badge gates are **generic
badge-set reads** (`badgeHeld` scans every badge set; nothing
names Sinnoh): Defog after the Fen Badge, Rock Climb after the
Icicle Badge, per Platinum. Knowledge reads are the shipped
representation — a battle move slot OR the `hmMoves` field-craft
list (`partyKnowsFieldMove`). Grant hooks ship as data for S5:
`HM_GRANTS` (defog → hm06/Fen/Solaceon Ruins, rockclimb →
hm07/Icicle/Route 217, both Platinum) plus a `giveHM` runSteps
event step in the Dive-grant idiom — idempotent, proven in-suite.
**Teachability adaptation (recorded):** no species `tm` list
carries 106/107 (the S1 tables predate the moves), so the shipped
teach path's eligibility gains a type rule for exactly these two:
hm06 learnable by Flying types, hm07 by grounded body types
(normal/ground/rock/fighting/fire/grass/poison/steel/ice/dark/
electric/bug). **Fog persistence call (recorded):** the cleared
state persists as the per-map story flag `defogged_<mapId>` (the
established map-flag idiom); the flag is dropped when the player
leaves the map, so the fog gathers again on re-entry — the canon
behaviour. The weather layer reads the flag: r210-north resolves
`fog`, or clear with source `defog` while the flag stands; a new
`fog` weather kind + overlay renderer joins weather.mjs. **No
retro-gating:** S4-11 pins that outside maps9 no shipped map
declares fog and no shipped row contains a climbwall tile.

### 2. Great Marsh = Safari Zone reskin (data only)

The shipped Kanto Safari engine is generalized by session data,
not by region words: a safari session now carries its own map
set, hub, exit, fee/steps/balls and "rock" word, all planted by
the gate NPC's data (Kanto's warden plants none of it and walks
the legacy defaults path byte-for-byte — S4-05 pins both sides).
maps9 data only: the three marsh maps carry `safariZone:
'great-marsh'`, the gatehouse carries `safariHub`, and MARSH
WARDEN IO plants fee 500 / 500 steps / 30 balls / entry
great-marsh-west / the 3-map set / Pastoria exit / rock-word
**MUD** (battle.mjs reads the label from the session; the thrown
state variable is untouched). Encounters roll on `marshbog`
tiles against the marsh maps' own tables. Two engine laws ride
along, both generic: a warp landing in a zoned map **with a live
session** keeps the session (intra-zone travel); a landing in a
zoned map with **no session** bounces to the hub with the warden
line (the Marsh is entered at its gate only) — hub-less Kanto
sessions keep their legacy landing untouched. Suite-proven end
to end (S4B-06…10): pay → session → bog encounter → MUD-labelled
Safari battle → resolve → steps-out exit at Pastoria with balls
reclaimed → no-session bounce.

### 3. Super Contests = contest-lite reskin (data only)

Hearthome's hall runs on the H5 engine unchanged; Sinnoh is data
in contest.mjs: `CONTEST_RANKS.hearthome` is the Platinum truth —
**one hall, four ranks** (Normal → Great → Ultra → Master), each
rank `requires` the previous rank's ribbon, implemented as rank
keys on the shipped engine (the recorded ranks call). The
counter flow gains a rank-picker menu (locked ranks show their
missing ribbon); each rank fields its own 3-entrant NPC field in
CONTEST_NPCS. Ribbons persist through the **shipped H5 quintet
unchanged** — `CONTEST_RIBBONS` grows by data to the 4 Hoenn
halls + the 4 rank keys, and gen-tables carries all 8 into
tables.json (validator closed set regenerated via the tool only).
Suite-proven (S4B-11): rank gating, a full Normal Rank round on
the battle presentation, and the Hearthome Ribbon (Normal Rank)
persisted in `state.contest.ribbons`.

### 4. Forme-switch — Giratina / Shaymin / Rotom (the Deoxys idiom, exactly)

`switchForme` in sinnoh-systems.mjs is the H6 meteorite swap
re-read: speciesId exchange inside a family, stats/maxHp
recomputed from the target's base, HP carried by the max-delta
rule, nickname/level/moves/IVs preserved verbatim; cross-family
and same-forme swaps refuse. Three object seams, all authored by
S3b: the **Griseous Orb** is the Turnback Cave chamber sign
(interact → altered ⇄ origin menu); **Rotom's appliances** are
the Old Chateau television-room sign (5 appliances ⇄ 5 formes +
leave-form back to base); the **Gracidea** is a key-pocket ITEMS
row — bag use on Shaymin swaps land ⇄ sky and is never consumed.
**Gracidea reversion simplification (recorded):** sky persists
until the Gracidea is used again or Shaymin faints (a fainted sky
Shaymin settles back to land on the next overworld step); canon's
night/freeze reversion is not modelled. **Move delta vs canon
(recorded):** no appliance move is auto-taught or forgotten —
moves ride untouched because every forme in a family shares one
learnset pool (the Deoxys precedent in species5 data); the
validator checks move ids, never per-forme learnsets. The Deoxys
`switchDeoxysForme` path itself is untouched. **Both validators
round-trip all 10 family formes** (7 non-base) in played-shape
saves with zero errors (S4-10).

### 5. Persisted-state accounting (the quintet law)

**No new persisted state was minted; no schema, defaultState, or
save-contract change was needed.** Fog → `story.flags` (existing
idiom). The Marsh → the transient `session.safari` object (the
Kanto precedent; the validator checks session queues only).
Ribbons → the existing `contest` quintet (data growth + the
gen-tables regeneration only). Formes → the mon's `speciesId`
(the Deoxys precedent). The one validator touch is the bag-size
cap 183 → **186**, tracking the three new ITEMS rows (the
established count-supersession pattern).

### 6. Suite

sinnoh-checks **105 → 132/132**: new S4-01…12 (Part A: HM data +
grants, fog resolver, generic gate reads, Marsh data config,
rank ladder data, the pure swaps, the reversion predicate, both
validators over all formes, the no-retro-gate scan, the ribbon
quintet) and S4B-01…15 (Part B true paths: HM06 teach menu +
teach, fog refuse/clear/restore, Rock Climb refuse/teach/up/
down, the full Marsh session, the Super Contest rank gate +
round + ribbon, all three forme switches on their true seams,
the giveHM idempotence pin). Count supersessions BY NAME:
sinnoh A11/A12, cheat-shop A02, frontier A12, hoenn-story A16,
johto-story A15, johto-systems A24 → items **186**; hoenn-contest
A01 moves 144 → **146**, A06 superseded (the ribbon set is halls
+ rank keys), A12 wording.

### 7. Battery

sinnoh-checks **132/132** · qa-changed-flows failures exactly
**{b2, d9}** (verified identical at base a942943) ·
battle-model **45/45** HARD · campaign **24/24** ·
arc-foundation **47/47** · frontier **136/136** · hoenn-story
**88/88** · hoenn-contest **28/28** · cheat-shop **44/44** ·
johto-story **110/110** · johto-systems **62/62** · validator
**106** + fuzz + save-contract (api-scripts, all pass). Fresh
build byte-identical post-commit; `personal/` byte-identical
(sha f434ba63… / a780af0b…).

### 8. Open items handed on

- **S5 plans to a coordinator-set byte allowance** (the §0
  tripwire: restated margin ≈ 118,876 B < 150,000 B).
- S5 calls the shipped hooks: `HM_GRANTS` + the `giveHM` step
  place HM06 (Solaceon Ruins) and HM07 (Route 217) in story;
  Dawn's Super Contest beats dress the Hearthome hall whose
  system now stands; the League/Galactic story rides maps whose
  field systems are all live.
- Rotom's appliance move (canon: the forme's signature move
  swaps with the forme) stays unmodelled under the recorded §4
  delta unless a later stage rules otherwise.

## Arc 4 Stage S5a — Sinnoh story, first half (2026-10-29)

Base: main @ 59547e5 (S4). Deliverable: the Sinnoh story's first
half in the H4a anatomy — one new data module
(`src/data/story-sinnoh.mjs`, module-order after story-hoenn) plus
the wiring this half needs (merge folds, loadMap append/patches,
sysLoadMap entry gates, `runSinnohNpc`/`startSinnohBattle`, the
tale machine's `sinnohTale` branch, a Quest Log SINNOH section, the
HUD objective branch). Platinum governs; the anime is the primary
canon (ADR-015); all writing is original — no borrowed dialogue.
The Darkrai/Canalave beat sits in S5b by the coordinator's
resequencing note; this half ends at Veilstone / Lake Valor's door.

### 0. Budget vs the coordinator allowance

S5a planned to the coordinator-set allowance of **+70,000 B public
static total max**. **Actuals: public static total 12,251,036 →
12,318,493 B, Δ +67,457 — inside the allowance by 2,543 B**
(`public/game.js` 12,088,414 → 12,155,871 B, the same delta).
**Restated projection-to-close:** S5b +70,000 (its allowance) +
S6 +45,000 + S7 +45,000 + S8/S9 ≈ +3,000 → remaining ≈ +163,000 →
projection ≈ **12,481,493 B**, margin ≈ **101,419 B** vs the
12,582,912 B gate — still below the 150,000 B austerity tripwire,
so **S5b likewise plans to its coordinator-set allowance (+70,000)
before it starts.**

### 1. The arrival + the rivals

The true path starts from a Frontier-complete save whose
sealed-Sinnoh homecoming was already consumed (S0 proved the
derivation): Vermilion → CAPT SINNOH → embark (the registry's
enRouteLines, consumed not rewritten) → Sandgem, where
`ev_sinnoh_arrival` lands the player — no send-off committee, no
starter ceremony, NO team reset: the player is Ash, champion-tier,
travelling at full strength (Amendment 1). `ev_sinnoh_lab` (Rowan's
lab, entry-gated on the arrival) registers a veteran, then Paul
walks in: his first battle is the event's `battleAny` step
(win/lose branch flags `paul1_won`/`paul1_lost`, `paul1_done` on
either). BARRY opens in Jubilife (`barry_met`) — frantic,
fine-obsessed, original writing. Dawn opens in Twinleaf
(`dawn_met`) as the contest co-spine.

### 2. Quest chain + the four leaders

`SINNOH_QUESTS` — 14 rows in the MAIN_QUESTS idiom, rendered as the
Quest Log's SINNOH section (`sq:` rows) and leading the HUD
objective while the arc is current: arrival `sinnoh_arrival` → lab
`rowan_registered` → Paul 1 `paul1_done` → Verity `verity_glimpse`
→ Roark `badge_coal` → Windworks `windworks_cleared` → Gardenia
`badge_forest` → Galactic Eterna `galactic_eterna_done` → Fantina
`badge_relic` → Dawn's contest `dawn_hearthome_done` → Chimchar
`chimchar_beat_done` → Defog `defog_received` → Maylene
`badge_cobble` → Paul's audit `paul_veilstone_done`. The leaders
ride the GENERIC award path (trainer defs carry
`badgeSet:'sinnoh'` + `badge`; winTrainer writes badges.sinnoh +
`badge_<root>`), and the overworld refusal in `runSinnohNpc` reads
badges.sinnoh — the Johto/Hoenn prefix law, suite-proven by a live
badge-skip attempt on Gardenia. Two talk-to roster trainers per
gym, rising beneath their leader.

| Leader | Gym | Ace | Ace level | Badge flag |
|---|---|---|---|---|
| Roark | Oreburgh | Cranidos (coalseamcharm) | 312 | badge_coal |
| Gardenia | Eterna | Roserade (meadowcord) | 322 | badge_forest |
| Fantina | Hearthome | Mismagius (spectrebell) | 332 | badge_relic |
| Maylene | Veilstone | Lucario (thunderheadpin) | 345 | badge_cobble |

### 3. Team Galactic, first half

Lake Verity's opening beat is a GLIMPSE (`ev_sinnoh_verity`: the
lake guardian's shadow crosses the reflection; no battle, no gift,
no catch — S6 owns the trio). Jubilife carries flavour pressure
(Barry's race + the broadcast-intern tale's measured skyline).
Valley Windworks (`ev_sinnoh_windworks`, Coal-gated entry): Mars
holds the keeper hostage — a must-win `battle` step (Purugly ace
318) → `windworks_cleared`. The Eterna building
(`ev_sinnoh_galactic`, Forest-gated entry): Jupiter, must-win
(Skuntank ace 330) → `galactic_eterna_done`, and the page she
leaves behind names the lakes. **PACING CALL (recorded): the full
Veilstone HQ raid is S5b's.** S5a's Saturn is presence only —
`saturn_met`, a locked door and a colder greeting once Eterna has
fallen; he has NO trainer def this half (suite-pinned). The anime
spreads the HQ across the arc; the raid lands with the lakes half.

### 4. The Paul spine

| Beat | Where | Form | Team levels |
|---|---|---|---|
| Introduction | Rowan's lab (event) | battleAny | 308 / 310 / **312** (Elekid, starshard) |
| Cold assessment | Eterna | dialogue (`paul_eterna_seen`) | — |
| The Chimchar beat | Hearthome (Relic-gated) | gift event | — |
| Home-turf audit | Veilstone (Cobble-gated) | friendly battle | 342 / 344 / 346 / **348** (Torterra, starshard) |

The Chimchar beat: Paul discards a Chimchar his ledger calls
finished; the player chooses. Taking it in rides the shipped
cap-safe delivery (`cheatDeliverMon`, party else PC box, stall if
no room anywhere) — a Lv 320 Chimchar, in band, dex-registered
(`chimchar_taken`); leaving it is an honest branch
(`chimchar_left`). Both close `chimchar_beat_done`. REGGIE, the
Veilstone breeder (an original analogue), carries the
eleven-word-letter beat (`reggie_met`).

### 5. Dawn + contests

Dawn's first Super Contest beat at Hearthome rides S4's shipped
system in the mayContest idiom: an NPC beat in the hall
(Relic-gated, dialogue story state — `dawn_hearthome_done` +
`dawn_ribbon_hearthome`), while the player's OWN ranked Super
Contest entry at the counter stands open beside it, ungated by the
beat (the rank ladder's own gates rule it; suite-pinned).

### 6. Extras accounting (H4a proportions, split with S5b)

- **Grounds (8, existing 15 only):** gym signatures — Oreburgh
  rubble, Eterna bloom, Hearthome grave, Veilstone mind; landmarks
  — Valley Windworks storm, Galactic Eterna volt, Lake Verity
  tide, Solaceon Ruins grave.
- **Town Tales (9 — one per first-half settlement):** Twinleaf,
  Sandgem, Jubilife, Oreburgh, Floaroma, Eterna, Hearthome,
  Solaceon, Veilstone — the data-driven JOHTO/HOENN_TALES idiom
  (`sinnohTale: true`; giver/stage roles stamped onto maps9
  townsfolk via SINNOH_NPC_PATCHES).
- **Keepsakes (6 of the arc's 8–12; S5b authors the rest):**
  dawnribbon (xpBoost), starshard (underdogDamage), coalseamcharm
  (lowHpDamage rock), meadowcord (healBoost), ruinbell (typeWard
  psychic), ribbonclasp (statusChance confusion) — EXISTING
  resolved kinds only, no new engine kind (the battle-model gate
  is untouched); each is paid by exactly one Sinnoh tale, and two
  double as gym-ace signatures (Roark's, Gardenia's).
- **TMs: NONE — mirroring H4a exactly.** H4a added no Gen-3 TM
  rows (TM_MOVES is still the Gen-1 50), so S5a adds no Gen-4 TM
  rows either; suite A17 pins the count and names the mirror so
  S5b inherits the answer.
- **Items total 186 → 192** (the six keepsake ITEMS rows);
  supersessions BY NAME: validator bag cap 186 → 192; sinnoh
  A11/A12, cheat-shop A02 (keepsakes 12 → 18), frontier A12,
  hoenn-story A16, johto-story A15, johto-systems A24 →
  items 192; rejuv-phase3 A01 (the closed 12-piece set gains the
  six, ids/shapes of the 12 untouched), rejuv-phase4 A18 (18
  pieces, the six new sources read from SINNOH_TALES).
  tables.json regenerated via gen-tables only (the quest
  vocabulary now carries the 14 chain ids + 9 tale ids).

### 7. The Defog grant

`ev_sinnoh_defog` (Solaceon Ruins entry, Relic-gated — Platinum's
order) places S4's data hook where the pacing reaches it: a
`{ giveHM: 'defog' }` step (idempotent) + `defog_received`. The
Fen Badge still licenses field use (S4's generic gate); the ruins
keep the knowledge itself. Rock Climb's grant stays S5b's
(Route 217, per HM_GRANTS).

### 8. Suite

New `tests/sinnoh-story-checks.mjs` **46/46** (S5b extends this
file): Part A (19) — the chain, the leader/Paul/Galactic audits,
the six events' shapes + gates, the placement BFS over all 23
authored actors, the tale-patch audit, keepsakes/Grounds/TM
mirrors, tables sync, wiring. Part B (27) — the bundle TRUE PATH:
embark → arrival → lab + Paul 1 → Dawn + the Twinleaf tale
end-to-end → Verity glimpse → the Gardenia badge-skip refusal →
Roark (+ a roster battle) → Barry → Windworks → Gardenia →
Eterna Galactic → Paul's assessment → Fantina → Dawn's contest
beat + the player's rank-menu gate → the Chimchar gift → Defog →
Maylene → Saturn's door → Reggie → Paul's Veilstone audit →
badges [coal, forest, relic, cobble] in order, all 14 chain flags
standing, the Quest Log's SINNOH section starred.

### 9. Battery

sinnoh-story **46/46** · sinnoh-checks **132/132** ·
qa-changed-flows failures exactly **{b2, d9}** · battle-model
**45/45** HARD · campaign **24/24** · arc-foundation **47/47** ·
frontier **136/136** · hoenn-story **88/88** · hoenn-contest
**28/28** · cheat-shop **44/44** · johto-story **110/110** ·
johto-systems **62/62** · fidelity **35/35** · validator **106**
+ fuzz **2000/2000** + save-contract **12/12** (api-scripts).
rejuv-phase3 60/61 and rejuv-phase4 50/51 — the single failure in
each is C01, the real-browser chromium harness, which cannot
launch a browser in this environment (both suites' data sections
are fully green, incl. the superseded keepsake pins). Fresh build
byte-identical post-commit; `personal/` byte-identical
(sha f434ba63… / a780af0b…).

### 10. Open items handed on

- **S5b** (allowance +70,000, same gate discipline): gyms 5–8
  (Wake → Byron → Candice → Volkner), Lake Valor + the lakes
  chain, the Veilstone HQ raid (Saturn's door opens), Coronet →
  Spear Pillar, Dawn's remaining contest beats, Paul's remaining
  beats, the Rock Climb grant (Route 217), the arc's remaining
  keepsakes (2–6), tales for the second-half settlements — all
  appended to this stage's chain/file/suite, never rewritten.
- The single owner-ordered deploy happens once the whole Sinnoh
  arc chain closes (through Sinnoh); nothing here was pushed or
  deployed.

## Arc 4 Stage S5b — Sinnoh story, second half: climax, Conference, completion (2026-10-29)

Base: main @ 06c9b43 (S5a). Deliverable: the Sinnoh story's second
half, appended to S5a's chain/file/suite the way H4b appended to
H4a's — `SINNOH_QUESTS` 14 → 30 rows, eleven new entry events, the
four remaining leaders on the generic award path, the Galactic
second half, the Spear Pillar climax and Distortion World
resolution, Dawn's Grand Festival, the Lake Acuity midpoint, and
the Lily of the Valley Conference closing in the machine. Platinum
governs; the anime is the primary canon (ADR-015); all writing is
original. No push, no deploy (the single owner-ordered deploy waits
for the whole arc chain). `personal/` byte-identical.

### 0. Budget vs the coordinator allowance

S5b planned to the coordinator-set allowance of **+70,000 B public
static total max**. **Actuals: public static total 12,318,493 →
12,388,347 B, Δ +69,854 — inside the allowance by 146 B**
(`public/game.js` 12,155,871 → 12,225,725 B, the same delta). The
first full build measured +71,607 (over by 1,607); the overage was
closed by tightening this stage's own prose and comments only —
no scope, system, or art was cut, and no other stage's text was
touched. **Restated projection-to-close:** S6 +45,000 (its cap) +
S7 +45,000 + S8/S9 ≈ +3,000 → remaining ≈ +93,000 → projection ≈
**12,481,347 B**, margin ≈ **101,565 B** vs the 12,582,912 B gate
— below the 150,000 B austerity tripwire, so S6 likewise plans to
its coordinator-set allowance (+45,000) before it starts. Actual
headroom remaining: **194,565 B**.

### 1. Gyms 5–8 (the prefix law completes)

The four leaders ride the GENERIC award path (`badgeSet:'sinnoh'`
+ `badge`; winTrainer writes badges.sinnoh + `badge_<root>`), the
overworld refusal in `runSinnohNpc` reads badges.sinnoh, and two
talk-to roster trainers per gym rise beneath each leader. The
suite drives all four in order off the S5a fixture and reads
badges.sinnoh back as the full Platinum eight, in order.

| Leader | Gym | Ace | Ace level | Badge flag |
|---|---|---|---|---|
| Crasher Wake | Pastoria | Floatzel (fencharm) | 355 | badge_fen |
| Byron | Canalave | Bastiodon (ironacorn) | 363 | badge_mine |
| Candice | Snowpoint | Abomasnow (frostpetal) | 374 | badge_icicle |
| Volkner | Sunyshore | Electivire (beaconcoil) | 386 | badge_beacon |

Gym Grounds (the existing 15 Grounds only): Pastoria **tide**,
Canalave **rubble**, Snowpoint **frost**, Sunyshore **volt**;
landmarks: galactic-hq volt, lake-valor tide, lake-acuity frost,
spear-pillar **spirit**, and all six Distortion World floors
**grave**.

### 2. Team Galactic, second half + the lakes chain

The lakes are GLIMPSES and pressure, never catches (S6 owns every
trio catch arc): Lake Valor's aftermath (Fen-gated entry —
the explosion, Azelf taken: `valor_glimpse` + `azelf_glimpsed`),
Uxie turning beneath Acuity's ice under Galactic pressure
(Icicle-gated: `uxie_glimpse`), Mesprit slipping the net at Verity
(all-badges revisit: `mesprit_glimpse`). The Veilstone HQ raid is
the S5a door opening: Fen-gated entry event, Saturn must-win
(Toxicroak ace 358) → `galactic_hq_done`; Saturn's NPC branch turns
honest post-raid. The Coronet climb (all-badges entry beat in the
north galleries, `coronet_climb_done`) walks the S3a/S3b segment
chain to the summit.

### 3. The climax — flag mechanics

`ev_sinnoh_spear_pillar` (gated on the climb): Cyrus summons
Dialga AND Palkia chained in the red chain (Platinum) and is
FACED — `battleAny cyrus_spear` (Weavile ace 388; `cyrus_spear_won`
/ `cyrus_spear_lost`) — because the sky overrules the result: the
chain reaches its note, Giratina tears the sky, Cyrus is taken,
the titans go free, and the event's warp step puts the player in
distortion-entrance. The six-map Distortion World chain (S3b's
warp-proven set) is walked to the platform, where
`ev_sinnoh_distortion_climax` plays Cyrus's end: a second FACED
battle (`battleAny cyrus_final`, Weavile ace 392), Cyrus walking
into the deep of his own accord, Giratina settling, the tear
stilling.

**The climax flag is `sinnoh_climax_resolved`** — this arc's
`climax_resolved`-equivalent in the H4b idiom (a per-arc name,
because Hoenn's literal `climax_resolved` already stands on any
save that played Hoenn; the mechanism is H4b's exactly: one flag,
set in exactly one event's step block, at the resolution and
never earlier — suite A27 pins that no other Sinnoh event sets
it). In the SAME step block stand the freed titans' S6 unlock
flags — `dialga_unlocked`, `palkia_unlocked`, `giratina_unlocked`
— beside `cyrus_end_done` + `distortion_cleared`: S6 builds the
catch arcs keyed on `sinnoh_climax_resolved`; the unlocks are
wired now, the arcs are not staged here.

### 4. Paul — the curve completes

| Beat | Shape | Team | Flags |
|---|---|---|---|
| Lab (S5a) | battleAny | ace Elekid 312 | paul1_done (+ won/lost) |
| Veilstone (S5a) | friendly FACED | 342–348, Torterra ace | paul_veilstone_done |
| **Lake Acuity (S5b)** | **friendly FACED, full 6v6** | **378–384, Electivire ace 384** | **paul_acuity_done + paul_acuity_won / paul_acuity_lost** |
| **Conference QF (S5b)** | **must-win-with-rechallenge** | **392–398, Electivire ace 398** | **paul_conference_done + paul_conference_won** |

Acuity is the anime's turning point staged on the Brandon
pattern: a REAL full battle, win or lose, the story continues and
**no progression gate reads the result**; the loss path carries
the devastation honestly in original writing (the autopsy speech
— Chimchar knew first). The Conference settlement is the shipped
league idiom (the registrar's bracket: one preliminary, Tamsin,
then Paul): a loss is a defeat and a rechallenge, the flag stays
unset, and the rivalry resolves with the player's win, as canon
has it — the engine never hard-locks. The true path wins it
(suite retry loop = the rechallenge idiom, exercised as designed).

### 5. The Tobias ruling — implementation, line by line

The coordinator's binding ruling, and where each clause lives:

- *"A REAL battle on the Brandon pattern"* — both acts are real
  `BattleScene` trainer battles staged by the `tobias` branch of
  `runSinnohNpc`; no scripted outcome exists anywhere in the stage.
- *"Repeatable until the honour stands"* — Act 1 can be re-fought
  without limit: its gate is simply `!tobias_darkrai_felled`, and
  nothing else in the handler advances while it stands unset.
- *"Darkrai authored beatable in-band (~390)"* — `tobias_darkrai`
  is Darkrai ALONE at **390** (suite A23). One honest engine note:
  Darkrai's band-local learnset (the S1 ETL) leaves it Quick
  Attack as its only damaging move, so a lone healthy band-floor
  attacker could out-attrition it over ~50 turns — measured in
  development. The ruling's semantics are unaffected (a win is a
  win), but the suite's wipe proof therefore fields a Growl-only
  Starly that can deal no damage at all, so the wipe is the foe's
  own work, honestly measured (recorded at `weakTeam()`).
- *"The flag `tobias_darkrai_felled` sets when it falls"* — Act 1
  rides `startSinnohBattle('tobias_darkrai', onWin)` (the league
  rechallenge idiom — not friendly, not faced); only its win
  callback sets `tobias_darkrai_felled` (suite A32 pins the wiring
  in source).
- *"A full team wipe before that is a rematch, NOT a conclusion"*
  — a loss sets nothing: suite B55 proves a full wipe leaves
  `tobias_darkrai_felled`, `tobias_faced`, `sinnoh_complete` and
  `arc_card_sinnoh` all unset and regionsDone untouched, with
  Tobias still offering Act 1.
- *"Once Darkrai falls, Latios concludes the match win-or-lose —
  both branch texts real"* — Act 2 (`tobias_latios`, Latios ALONE
  at 392) is fought FRIENDLY on the FACED predicate
  (Harrison/Brandon): either outcome sets `tobias_faced` +
  `tobias_won`/`tobias_lost` and plays its own full branch text —
  the win an acknowledged upset, the canon loss carrying the
  honour ("the only victory anyone took from the conference's
  darkest trainer" — the registry's summaryLines stay true on
  every completing save). Suite B56 proves the felling stands
  with the conference NOT yet concluded; B57 concludes via the
  canon LOSS path.
- *"Only then does the conference conclude and `sinnoh_complete`
  fire"* — `sinnoh_complete` is set exactly once in
  overworld-systems (suite A32 counts the occurrences), inside
  Act 2's onEnd, and immediately rides `checkArcCompletion(g)`:
  the machine fires — ARC COMPLETE card with the registry's
  summaryLines, `regionsDone += sinnoh` by the machine's own
  write (the handler writes no regionsDone), the directive pinned
  on Unova (sealed). Suite B58/B59 prove the card fires exactly
  once and never re-fires. **No hand-rolled ending, no homecoming
  content** — S7 owns the finale variant; this stage's true path
  ends at card + directive standing.

### 6. Movie beats + the co-spine's end (chronology map, ch. 8)

- **Darkrai (The Rise of Darkrai)** at Canalave, per the
  resequencing note: the sailor's plea (Mine Badge held, NPC
  chain) → Fullmoon Island entry event (Cresselia's glimpse;
  the **Lunar Wing** granted as a key item — items 192 → 197 with
  the keepsakes below) → the boy wakes: `darkrai_beat_done` +
  `darkrai_unlocked` (S6's flavour flag; Darkrai's catch arc is
  S6's and is not staged here).
- **Gracidea (Giratina and the Sky Warrior)** at Floaroma
  (Cobble-gated entry event): the field in impossible bloom, a
  Shaymin glimpse → `gracidea_beat_done` + `shaymin_glimpsed` +
  `shaymin_unlocked` (S6 owns the catch).
- **Zoroark (Master of Illusions)** as a special: one scene on
  Celestic's shrine street (all-badges entry event) — an illusion
  with a homesick heart, and the suite pins its honesty (A30):
  zorua/zoroark exist in no shipped species table, and the scene
  stages no battle, catch, or gift. Small, and true about what
  it is.
- **Dawn's co-spine concludes** at the Grand Festival on Lake
  Valor (the anime's placement; a dialogue beat riding S4's Super
  Contest ranks — her final is judged at the hall's highest rank;
  the player's own contest ladder stays open and ungated): she
  reaches the final and falls by a checked-twice margin —
  runner-up honours, the arc resolved in original writing
  (`dawn_grand_festival_done` + `dawn_festival_ribbon`).
- **Rock Climb** is granted on Route 217 via S4's `giveHM` hook
  (`ev_sinnoh_rockclimb`, Icicle-gated entry — Platinum's lost HM
  in the snow), proven in-suite beside the Defog precedent (B41).

### 7. Extras — final accounting

Town Tales 9 → **13** (Pastoria, Celestic, Snowpoint, Sunyshore —
the same data-driven machine, giver/stage pairs audited among the
maps9 townsfolk). Keepsakes: +4 new pieces on EXISTING resolved
kinds only (fencharm, shrinebell, frostpetal, beaconcoil — each
paid by exactly one new tale; three double as gym-ace signatures),
**the Sinnoh arc total lands at 10** (S5a's 6 + these 4), inside
the mission's 10–12. Items 192 → **197** (+4 keepsakes + the
Lunar Wing); supersessions BY NAME: validator bag cap 192 → 197;
sinnoh A11/A12/A18, sinnoh-story A01 (chain 14 → 30) / A12 (actors
23 → 41) / A14 / A15 / B25 (scoped to the first half; the full
read is B60), cheat-shop A02 (keepsakes 18 → 22), frontier A12,
hoenn-story A16, johto-story A15, johto-systems A24,
rejuv-phase3 A01 (the set 18 → 22), rejuv-phase4 A18 (22 pieces,
the four new sources read from SINNOH_TALES). tables.json
regenerated via gen-tables only (the quest vocabulary now
carries all 30 chain ids + 13 tale ids). TMs: NONE — the H4a
mirror stands (A17).

### 8. Suite

`tests/sinnoh-story-checks.mjs` **95/95** (S5a's 46, superseded by
name above, + A2's 13 new pure units + Part B's 35 new rows): the
second-half leaders/rosters audit, the completed Paul curve, the
Tobias data shape, the eleven events' shapes + gates, the climax
flag's single-source pin, the glimpse law, the Zoroark honesty
pin, and the TRUE PATH continued on the S5a fixture's own save:
Pastoria tale → Wake → Valor → the HQ raid → Byron → the Darkrai
chain (plea → Fullmoon → waking) → the Gracidea beat → Snowpoint
tale → Candice → Acuity glimpse → **Paul FACED** → Rock Climb →
Sunyshore tale → Volkner (eight badges in order) → the Grand
Festival → Mesprit → the Zoroark special → Celestic tale → the
Coronet climb → **Spear Pillar FACED + the warp** → the
Distortion World traversal → **the platform climax + all unlock
flags** → registration → preliminary → **Paul settled** → the
three Tobias proofs (wipe-rematch / felling-then-Latios-loss /
the machine firing exactly once) → all 30 chain flags standing,
the Quest Log's SINNOH section starred to the last row.

### 9. Battery

sinnoh-story **95/95** · sinnoh-checks **132/132** ·
qa-changed-flows failures exactly **{b2, d9}** · battle-model
**45/45** HARD · campaign **24/24** · arc-foundation **47/47** ·
frontier **136/136** · hoenn-story **88/88** · hoenn-contest
**28/28** · cheat-shop **44/44** · johto-story **110/110** ·
johto-systems **62/62** · fidelity **35/35** · validator **106**
+ fuzz **2000/2000** + save-contract **12/12** (api-scripts).
rejuv-phase3 60/61 and rejuv-phase4 50/51 — the single failure in
each is C01, the real-browser chromium harness, unrunnable in
this sandbox (both suites' data sections fully green, incl. the
superseded keepsake pins). Fresh build byte-identical
post-commit (d3cb4852…); `personal/` byte-identical
(sha f434ba63… / a780af0b…).

### 10. Open items handed on

- S6 owns the thirteen legendary arcs: the lake trio (their
  glimpses stand), Dialga/Palkia/Giratina keyed on
  `sinnoh_climax_resolved` with the unlock flags already wired,
  Darkrai via `darkrai_unlocked` + the carried Lunar Wing,
  Shaymin via `shaymin_unlocked` + the Gracidea beat.
- S7 owns the finale variant (registry-driven homecoming, full
  credits, Master HoF, the Arceus capstone) — nothing of it is
  staged here; the true path ends at the ARC COMPLETE card with
  the Unova directive pinned and standing.
- The single owner-ordered deploy happens once the whole Sinnoh
  arc chain closes (through Sinnoh); nothing here was pushed or
  deployed.

## Arc 4 Stage S6 — Sinnoh legendary arcs ×13 + Tobias rider (2026-10-29)

The thirteen Sinnoh legendary arcs, live on the shipped
quest/legendary machinery (decision 9 + the coordinator allowance
of 2026-10-29, binding: +45,000 B static max), plus the Tobias
rider closing S5b's honesty note. Base 9794398; nothing pushed or
deployed; `personal/` byte-identical.

### 1. The rider (done first, per the allowance)

S5b's honesty note stood: Tobias's Darkrai, built from its
band-local learnset alone, carried Quick Attack as its only
damaging move. Two facts had to be faced in order:

- **The def format's authored-set slot existed in NO shipped
  code.** The coordinator's premise ("the def format supports
  authored moves — Frontier Brains precedent") was checked against
  the tree and is not true of it: `BattleScene` built every foe
  via `makeMon` (learnset last-4) at all three construction sites,
  and no `moves` field was read anywhere for trainer teams
  (BRAIN_TEAMS carry species + keepsake only). S6 therefore added
  the smallest generic engine support: `authoredMoves(mon, entry)`
  in `src/game/battle.mjs`, applied at the three foe-construction
  sites — a team entry carrying `moves: [ids]` gets exactly that
  set, in order, at full PP; entries without the field keep the
  shipped learnset behaviour byte-for-byte. battle-model **45/45**
  (the hard gate) is unmoved, as designed.
- **The sets themselves** (each move verified in the species'
  legal in-table pool — band learnset ∪ TM list): Darkrai 390 =
  **Hypnosis + Dream Eater** (learnset; the nightmare engine) +
  **Fire Blast (TM38) + Hyper Beam (TM15)**, its TM list's
  strongest honest special damage. Latios 392 = **Psychic**
  (learnset STAB) + **Ice Beam (TM13) + Thunderbolt (TM24)** +
  **Recover** (learnset). Darkrai's learnset alone tops out at
  Quick Attack/Dream Eater for damage (Dream Eater needs sleep —
  hence Hypnosis authored alongside it); the TM list is where its
  honest power lives, and the rider says so rather than pretending
  the learnset sufficed. Pinned in sinnoh-story **A23** (extended
  in place: both aces authored, pool-legal, ≥2 damaging) and in
  the new suite's A07 + **B15** (the sets read off the LIVE
  BattleScene foes). The three Tobias proofs stay green inside
  sinnoh-story's 95/95 (B55 wipe = rematch offered, B56/B57 the
  felling + Latios conclusion, B58 the machine firing once) —
  B56's strong team fells the authored Darkrai exactly as before.

### 2. The thirteen arcs

All thirteen ride the shipped machinery: a Quest Log legendary
entry per arc with spelled-out requirement steps (≥2 steps,
exactly one catch step naming its own species, every other step
flag-keyed — pinned A02), discovery on the openQuestLog
living-section law (an arc whose prereq flag stands joins the Log
as 'discovered'), and every one-of-one face on the
`{ wildBattleCatch }` chain — the arc advances ONLY on a catch;
flee AND KO stall the chain with nothing written, so every face
re-fires and nothing can ever dex-lock. The live register
(`SINNOH_LEGENDARY_ARCS`, folded by merge.mjs over the
story-kanto designed stubs) supersedes the stubs' dead lair ids,
pre-band levels, and arcs-prereqs wholesale.

| Arc | Lair | Gate (as the quest-log step spells it) | Level |
| --- | --- | --- | --- |
| Uxie | lake-acuity-cave | `sinnoh_climax_resolved` | 370 |
| Azelf | lake-valor-cave | `sinnoh_climax_resolved` | 370 |
| Mesprit | sinnoh-routes (roams) | climax, then the Verity Cavern meeting sets her roaming | 370 |
| Dialga | spear-pillar | `sinnoh_climax_resolved` only (+ S5b's `dialga_unlocked`) | 388 |
| Palkia | spear-pillar | climax + Dialga caught first (the pillar's order) | 388 |
| Giratina | turnback-cave | climax (+ S5b's `giratina_unlocked`) | 392 |
| Heatran | stark-interior | meet Buck (Survival Area) → return the Magma Stone with him → revisit | 375 |
| Regigigas | snowpoint-temple-depths | Regirock + Regice + Registeel IN THE PARTY, read live | 380 |
| Cresselia | sinnoh-routes (roams) | `lunar_wing_received`, climax, then the Fullmoon meeting sets her roaming | 372 |
| Darkrai | newmoon-island | `darkrai_unlocked` + `sinnoh_complete` → the Canalave inn sleep event | 378 |
| Manaphy | rowan-lab (the Egg) | `sinnoh_complete` → Rowan's gift Egg → hatch at 301; Phione breeds from it | 301 (hatch) |
| Shaymin | flower-paradise | `sinnoh_complete` → Oak's Letter from Rowan → the Seabreak Path | 374 |
| Spiritomb | r209 (the Hallowed Tower) | the Odd Keystone (a Route 209 traveller's gift) + facing the tower | 365 |

Per-arc wiring notes:

- **Lake trio.** Uxie/Azelf are post-climax cave faces in the
  caverns S3b placed. **Mesprit roams** — the Latias precedent
  exactly: the Verity Cavern meeting sets `mesprit_roaming` (no
  battle — she declines, courteously), and her landing is a pure
  function of the persisted step counter over
  `['r201','r205','r210','r215','r222']`.
- **Dialga/Palkia** key ONLY on `sinnoh_climax_resolved` (the
  *_unlocked flags S5b's climax set are read as the wake proof,
  nothing else — no Cyrus rematch, no item). Platinum truth,
  written that way: after the climax both dragons can be faced at
  Spear Pillar; the pillar keeps its appointments in order, so
  Palkia's face stands behind Dialga's catch (a quest-log step
  says so). The S5b spear event owns the climax visit itself, so
  the faces begin on the NEXT entry — no double-fire.
- **Giratina — DESIGN CALL 1: the primary lair is TURNBACK
  CAVE.** The Griseous Orb's chamber already lives there (S4),
  Platinum's post-game tenant is Turnback's, and the Distortion
  World return is NOT wired as a second trigger: one one-of-one
  gets one door (a second trigger for the same catch adds a
  failure surface, not a feature — the platform keeps the
  climax's memory and the forme switch, which S4 already proved
  there and at Turnback both). The face fires on Turnback entry
  while `giratina_unlocked` stands.
- **Heatran.** Buck is a new Survival Area NPC (kind 'buck'):
  flavour-only pre-climax; post-climax the meeting sets
  `buck_met` + discovers the arc. The first stark-interior entry
  with Buck met plays the accompaniment (the displaced Magma
  Stone found and returned together — dialogue only, NO battle,
  NO stone item invented: `magma_stone_returned` is a flag); the
  REVISIT fires the face, per the canon structure.
- **Regigigas.** The gate is read LIVE from the party by the
  entry handler (the designed stub's three-arc prereq is
  superseded — owning is not the gate, BRINGING is, and the
  quest-log step says exactly that, naming all three and the
  words "in your party"). With fewer than three standing, the
  statue declines with the keeper's carved note (which reports
  the count standing) — nothing consumed, nothing set, the arc
  discovered; the refusal re-fires every entry. With all three,
  the face fires.
- **Cresselia — DESIGN CALL 2: she ROAMS.** The shipped idiom
  generalised data-side, as the allowance anticipated: ONE pure
  landing function (`roamLanding(stepsTotal, landings)` in
  story-sinnoh.mjs) serves both roamers over disjoint landing
  sets (Cresselia: `['r218','r219','r221','r223','r230']` — her
  crescent trail of night roads), each set by its own island
  meeting. A direct Fullmoon catch was rejected: the S5b beat
  already established her as the provider who comes and goes,
  and two roamers on one mechanism is more honest fiction than
  one roamer and one exception. Zero new save state either way.
- **Darkrai.** No distribution item invented (pinned A08: no
  member-card row exists). The gate inputs are S5b's own flags:
  the boy woken (`darkrai_unlocked`) + the Conference finished
  (`sinnoh_complete`). Entering the Canalave harbour house then
  plays the inn event: the keeper's key, the sleep, the dream —
  `darkrai_inn_done` is set BEFORE the mid-chain warp (so the
  island's own gate can't double-fire during the warp's load),
  the chain warps the dreamer to Newmoon Island and the face
  fires inside the same event. A fled/KO'd night leaves the
  player standing on Newmoon, where the standalone face
  (`ev_sinnoh_darkrai`) re-fires on entry; the island's boatman
  (S3a's REED) ferries back to Fullmoon, so no state soft-locks.
- **Manaphy + Phione — and an S1 correction, recorded plainly.**
  The gift Egg is a Ranger-flavoured delivery held in trust at
  Rowan's lab (the placement call: Sandgem is where Sinnoh's
  trusts are kept, and Rowan is the region's registrar; the
  egg is refused with NOTHING set when the player has no room —
  the cap-safe delivery idiom). Rowan's second post-Conference
  talk grants Oak's Letter (below), so the lab visit pays both
  S6 gifts in a fixed order. The Egg rides the shipped egg
  system end-to-end (250 steps, hatching Manaphy at the band
  floor 301 through the real step hook), and the arc completes
  on the hatch's dex registration via a map-load sweep (an egg
  has no face to complete it). **Phione did NOT breed from
  Manaphy on shipped data, the S1 register's claim
  notwithstanding**: measured at S6, `offspringOf` walks evo
  predecessors for the base stage, Manaphy has none, and a
  driven deposit→egg→hatch produced a second Manaphy — Phione
  (dex 489) was unobtainable, a dex-lock the S1 entry's
  "already supports" wording had papered over. The correction
  is data, minimal and generic: species entries may declare
  `eggSpecies` (Manaphy declares 'phione'), and `offspringOf`
  honours a declared egg species before the base-stage walk —
  no species named in code. The S6 suite proves the whole line
  end-to-end (B11), including the daycare egg's speciesId being
  'phione' before it hatches.
- **Shaymin.** Oak's Letter is granted by Rowan in person
  post-completion (the placement call: Oak left it in trust
  with the one colleague who would out-wait the Conference —
  no distribution item, a letter with a named keeper). The
  letter is a real key item (`oaksletter`); the Seabreak Path
  S3b built leads to the face, and the S4 Gracidea switch is
  pinned working on the CAUGHT Shaymin (B12: land → sky →
  land, flower never consumed).
- **Spiritomb** (the deferred placement, decided here): the
  Odd Keystone is a real key item (`oddkeystone`), granted by a
  new Route 209 traveller NPC (kind 'keystone_traveller' —
  the canon-flavoured route: a traveller on the Lost Tower
  road carries the stone and wants it off his hands). The
  Hallowed Tower is the faced rock at r209 (14,6), west of the
  Lost Tower — placed via the shipped object-append idiom
  (a sysInteract handler claiming exactly that tile on that
  map; the generated maps9 rows are unedited). Facing it
  without the keystone is a description; with it, the
  summoning face. The arc's designed stub was added to
  story-kanto (the validator-vocabulary pre-registration, the
  other twelve stubs' precedent) and superseded live in the
  fold, like every Sinnoh arc before it.

### 3. State accounting

**Zero new persisted state.** The arcs add: flags only (the
arcs' own `arc_*_done`, the gate flags named in the table, the
two meeting/roaming flags — all inside `story.flags`, the
standing open vocabulary), quest states inside `story.quests`
(the standing vocabulary — `arc_spiritomb` pre-registered via
its designed stub, so the validator's quest table grew by the
one id through gen-tables), and two key items in `bag`
(`oddkeystone`, `oaksletter` — the ITEMS table 197 → 199; the
server validator's bag-size cap tracks it 197 → 199, the
standing supersession chain extended). Roaming adds NOTHING —
positions derive from `state.stepsTotal`, already persisted.
No schema field, no migration; client + server validators
accept the new saves (A10/A11 + the validator battery below),
and pre-S6 saves open unchanged (every S6 read is a flag that
may simply be absent).

### 4. Supersessions (by name)

- items 197 → **199** wherever the count is pinned
  (sinnoh-checks A11/A12, sinnoh-story A18, cheat-shop A02,
  frontier A12, hoenn-story A16, johto-story A15,
  johto-systems A24) — each renamed in place with the S6
  supersession wording; the server validator's bag cap
  197 → 199 with its comment chain extended.
- sinnoh-story A12: SINNOH_NPCS count 41 → **43** (Buck at the
  Survival Area + Traveller Maren on Route 209), renamed.
- sinnoh-story A23: extended in place with the rider pin (the
  count stays 95/95 — the pin rides the existing Tobias row).
- fidelity-checks: legendary-arc register count 56 → **57**
  (the arc_spiritomb designed stub), renamed.
- tables.json regenerated via gen-tables only (items 199;
  quests +arc_spiritomb).

### 5. Suite

NEW `tests/sinnoh-legendary-checks.mjs` **27/27**: Part A —
the live register (13 arcs, dex set, shipped lairs), the
quest-log step law, the twelve catch-face shapes + levels, the
inn event's warp/flag order, Manaphy's egg-only shape, the
shared roaming function's purity + disjoint landings, the
rider's data pools, the two key items (+ no member card), the
Regigigas step's spelled-out gate, the Phione egg data, and
validator plumbing. Part B — every arc driven: Uxie locked →
flee → KO → catch; Azelf flee → catch; Mesprit's meeting, the
r201 landing at stepsTotal 0, the empty r205 and the held r210
at stepsTotal 100; Dialga-then-Palkia at the pillar (Palkia
never jumps the order); Giratina locked without its wake flag;
Heatran's full Buck/stone/revisit structure; Regigigas refused
at 0 and at 2 Regis, woken at 3; Cresselia's meeting + r218
landing; Darkrai's shut inn, the dream warp, the island
re-fires through flee AND KO; Manaphy's Egg → hatch at 301 →
arc sweep → Phione bred and hatched at 301; Shaymin's letter
gate + the Gracidea pin; Spiritomb's scenery → gift →
summoning; the Quest Log rendering a Sinnoh arc's steps; and
the rider read off the live foes.

### 6. Battery

sinnoh-legendary **27/27** (new) · sinnoh-story **95/95**
(incl. rider A23; Tobias B55–B58 green) · sinnoh-checks
**132/132** · qa-changed-flows failures exactly **{b2, d9}** ·
battle-model **45/45** HARD · campaign **24/24** ·
arc-foundation **47/47** · frontier **136/136** · hoenn-story
**88/88** · hoenn-legendary green · hoenn-contest **28/28** ·
cheat-shop **44/44** · johto-story **110/110** ·
johto-systems **62/62** · fidelity **35/35** · orange-story
**38/38** · orange-climax **42/42** · validator **106** +
fuzz **2000/2000** + save-contract **12/12** (api-scripts) ·
qa-slice failures exactly **{s6, l8}** (the recorded baseline) ·
budgets **pass** · drift-gate **pass** on the fresh full build ·
contamination **clean**. rejuv-phase2 A09 + the rejuv C01
chromium-harness failures are pre-existing at base 9794398
(verified against a pristine HEAD worktree — not S6's).
Fresh build byte-identical post-commit (4fa39b1f…);
`personal/` byte-identical (sha f434ba63…).

### 7. Budget

Static (public/) 12,388,347 → **12,432,909 = +44,562 B**
against the coordinator's +45,000 B allowance (margin 438 B;
the prose was trimmed to land inside it after a first build
projected +48,689). Headroom to the 12,582,912 gate:
**150,003 B**. Restated projection-to-close: S7 finale
allowance +45,000 B and S8/S9 ~3,000 B project a close at
≈ 12,480,909 B — ≈ 102,000 B under the gate, with the S7
allowance the binding constraint, exactly as the coordinator
framed it.

### 8. Open items handed on

- S7 owns the finale variant (full credits, Master HoF, the
  Arceus capstone) on its +45,000 B allowance; the thirteen
  arcs' completion flags (`arc_*_done` ×13) stand ready as its
  inputs, as does `sinnoh_complete`.
- The single owner-ordered deploy happens once the whole
  Sinnoh arc chain closes (through S9); nothing here was
  pushed or deployed.

## Arc 4 Stage S7 — THE FINALE: homecoming variant, credits, Master HoF, Arceus capstone (2026-10-29)

The finale of the whole chain, built exactly to mission decision
10 — **registry-driven or it doesn't ship** (coordinator allowance
for S7, binding: +45,000 B static max). Base 982cfb1; nothing
pushed or deployed; `personal/` byte-identical (sha256 spot-check
of the tree unchanged at close).

### 1. The generic trigger (the stage's whole law)

`tryHomecoming` (src/game/arcs.mjs) now branches on a **pure
registry read**: a homecoming is the finale iff the directive's
arc — the completed arc's successor — is a **sealed future row**
(`next.status` is neither `'shipped'` nor `'next'`, and
`next.future` stands). Everything else takes the standard ritual
**byte-for-byte** (the standard branch's code is untouched; the
finale branch is entered before it and returns).

**Grep evidence (pinned in sinnoh-story A33):** `src/game/arcs.mjs`
contains **zero** occurrences of `sinnoh`, `arceus` or `azure`
(case-insensitive) — the machine names no region, no capstone
species and no granted item. The finale's specifics are all data
in `src/data/arcs.mjs`: `FINALE_GRANT_ITEM_ID` (`azureflute`),
`FINALE_UNLOCK_FLAG` (`arceus_unlocked`), `ARC_FINALE_ECHOES`,
`FINALE_CREDITS_OPEN` / `FINALE_CREDITS_CLOSE`, `FINALE_END_CARD`.
The machine writes the unlock only as
`story.flags[FINALE_UNLOCK_FLAG] = true`, inside the finale commit.

**Machine proofs (pure drives, A36/A37):** a fabricated
sealed-future homecoming plays the finale (echoes ×6 in
regionsDone order, flute ×1, unlock set, Master entry written,
sealed finish law kept); a fabricated **shipped**-successor
homecoming (the Frontier close shape) stays standard — hook lines
delivered, arc advances, embark arms, snapshots stamp, and **zero**
finale side-effects. The bundle repeats both proofs live (C04–C08
finale; **C21 control** on a second, Frontier-complete fixture),
and the frontier suite's own E09/E10 Sinnoh homecoming drive stays
green unmodified inside frontier **136/136**.

### 2. The finale homecoming (content = data)

At Mom's house: Mom's welcome (the standard two lines + her
Hawthorn-in-the-kitchen beat), then **one bond echo per completed
arc** — the machine iterates `story.regionsDone` and reads
`ARC_FINALE_ECHOES[arcId]`; it does not enumerate arcs. Echo
accounting: exactly **6 lines authored**, keyed `kanto / orange /
johto / hoenn / frontier / sinnoh`, each a single short beat
(league + what it cost/taught). Then Oak's rating beat **in
person** (Prof. Hawthorn, speaker `PROF. HAWTHORN`) at the
completed arc's registry horizon (the fixture reads **492 of
493**), and the entrusting: the **Azure Flute** granted once
(ITEMS row `azureflute`, key pocket; the full item quintet —
ITEMS row + gen-tables regen via the tool only + the server
validator's bag cap raised 199 → 200 in its tracking lineage +
client/server validation pinned A39/A12; items are now **200**,
superseded by name in sinnoh-checks A11/A12, sinnoh-story A18,
sinnoh-legendary A08, cheat-shop A02, frontier A12, hoenn-story
A16, johto-story A15, johto-systems A24).

**Unlock pinning (C01/C02, pre-finale):** the S5b/S6 fixture save
carries `sinnoh_complete` and the pinned directive, and has **no
flute, no `arceus_unlocked`, no finale flag, no Master entry, and
no `arc_arceus` in its Quest Log state**; entering the Hall of
Origin in that state fires nothing. The unlock exists only after
the finale homecoming commits it.

### 3. Full credits + the end card

`finaleCreditsLines(state)` (pure, A35) builds the sequence from
the registry: the shipped frame (`FINALE_CREDITS_OPEN`), **one
listing line per completed arc** in regionsDone order —
`Arc N · Region — <the arc's own summaryLines[0]>`, zero titles
typed twice — the road-so-far line (journeys complete · National
count/horizon from the registry · playtime), the shipped closing
lines, and the end card as the final lines. It plays on the same
dialogue surface as `CREDITS_LINES` (the game's credits idiom; the
ARC COMPLETE card's own surface). In the true path the finale's
**last presented scene is the credits scene itself**, and its tail
deep-equals the end card (C08).

**End card text, as shipped** (`FINALE_END_CARD`, data):

> — THE END —
> **Six journeys. Five leagues and a frontier. One road, walked whole.**
> Thank you for walking it. When the next road opens — and roads
> always open — it will find you exactly where this one left you:
> ready, rested, and already lacing your shoes.

The middle line is the coordinator-approved line, verbatim, as its
own line. **Screenshot:** the capture driver + a validated
finale-ready save stand ready in
`~/workspace/ashs-journey-qa/arc4-s7-shots/` (`gen-save.mjs`,
`end-card-shot.mjs`, arc-chain-qa CDP idiom), but the capture
itself is **environment-blocked at this close**: this sandbox's
Chromium refuses startup without the Hatch WebGL domain-policy
file (`/tmp/webgl-domains.txt`, wiped with /tmp; its contract is
provisioned, not documented) — the same pre-existing blocker as
the rejuv **C01** chromium-harness failures and audit-laptop.
S9 should run the driver first once the policy file is restored;
until then the end card is pinned textually by C08 (the presented
scene's tail) and A34/A35 (data + builder).

### 4. Master Hall of Fame

Completing the finale commits a HoF entry in the shipped shape
plus the one sanctioned extra field: `{ team: <the walking
party>, badges: <the completed arc's badge count>, master: true }`
(commit-before-present, fire-once, never duplicated). The shape
change got the full contract treatment: the client normalizer
(`normalizeHofEntry`) **preserves** `master: true` (and drops a
non-true value), the client schema accepts an optional boolean
`master`, the server validator accepts the same and rejects a
non-boolean (all pinned A39, both sides). The HoF viewer surfaces
it as **MASTER ENTRY — THE WHOLE ROAD** alongside the per-arc
entries (C09: the fixture's viewer renders 7 entry plates — 6
per-arc + the Master). C20 proves the flag also survives the NG+
normalizer into `priorHof`.

### 5. The Arceus capstone

The fourteenth legendary arc, `arc_arceus` — **The Hall of
Origin** — lives in `SINNOH_LEGENDARY_ARCS` (S6's A01 superseded
by name to fourteen, dex list +493; its story-kanto designed stub
pre-registers the id in the validator's quest vocabulary, the
arc_spiritomb precedent; fidelity's designed-register count
superseded 57 → 58). Its quest-log steps spell the requirements:
(1) the finale's unlock flag, (2) **carry the Azure Flute to
Spear Pillar** and let it build the stairs (`arceus_stairs_open`),
(3) climb to the Hall of Origin and face **Arceus at band cap
400**. Discovery rides the S6 living-section law keyed **only**
on `arceus_unlocked` (C10: absent before the finale, listed
after). At Spear Pillar the flute ceremony (say-only
`ev_sinnoh_arceus_stairs`) outranks the pillar's catch faces on
the load it opens; the face itself (`ev_sinnoh_arceus`) rides
`{ wildBattleCatch }` — **flee re-fires (C13), and the KO stall
is the same chain law** S6 pinned per-face. The catch (C14)
completes the dex at **493/493**, and the shipped Platinum
Diploma presentation reads earned on the loop's own check —
`platinum_diploma` stands after the catch and the viewer
presents the PLATINUM plate (C15/C16; proven, not rebuilt).

### 6. Post-game integrity (C17–C20)

After finale + capstone: re-entering home is quiet — the Pallet
directive is complete and **never re-pins**, the finale never
re-fires (Master count 1, flute 1). The Journey menu shows **six
arc headers COMPLETE** with the future rows as the one **SEALED**
silhouette band. The ferry network is whole (CAPT SINNOH sails
Vermilion → Sandgem on the shipped crossing). A **Second
Journey starts** from the full-chain save through the shipped
NG+ path: `ngPlus` 1, own HoF empty, `priorHof` carrying all
seven entries with the Master's flag intact.

### 7. Battery

sinnoh-story **123/123** (95 + A33–A39 + C01–C21; the finale true
path AND the Frontier control both in-suite) · sinnoh-legendary
**27/27** · sinnoh-checks **132/132** · qa-changed-flows failures
exactly **{b2, d9}** · battle-model **45/45** HARD · campaign
**24/24** · arc-foundation **47/47** (UNMODIFIED — the machine
change kept every foundation pin) · frontier **136/136** ·
hoenn-story **88/88** · hoenn-legendary green · hoenn-contest
**28/28** · cheat-shop **44/44** · johto-story **110/110** ·
johto-systems **62/62** · fidelity **35/35** · orange-story
**38/38** · orange-climax **42/42** · validator **106** + fuzz
**2000/2000** + save-contract **12/12** (+ config 39, failclosed
20, http-ip 13) · qa-slice failures exactly **{s6, l8}** ·
rejuv failures exactly the recorded **{A09, C01}** cluster ·
budgets **pass** · drift-gate **pass** on the fresh full build ·
contamination **clean**. Supersessions, all by name: items
199 → 200 (eight suites, listed in §2), sinnoh-legendary A01
(thirteen → fourteen arcs), fidelity legendary-register count
57 → 58, server bag cap 199 → 200. `personal/` byte-identical;
fresh build byte-identical post-commit.

### 8. Budget

Static (public/) 12,432,909 → **12,449,677 = +16,768 B** against
the coordinator's +45,000 B S7 allowance (inside by 28,232 B —
the finale is code + prose, no art, as the allowance model
assumed). Headroom to the 12,582,912 gate: **133,235 B**.
**Final restated projection-to-close:** only S8 (campaign gate)
and S9 (independent QA) remain, at their ~3,000 B planning
figure → projected close ≈ **12,452,677 B**, ≈ **130,235 B**
under the gate, with a healthy safety residue surviving S7 as
ordered.

### 9. Open items handed on

- S8 owns the one-save chain drive through Sinnoh + finale; the
  finale's inputs all stand ready (regionsDone, the Master HoF
  contract, `arceus_unlocked`, the capstone arc).
- S9: run `arc4-s7-shots/end-card-shot.mjs` for the visual
  end-card re-verification once the Chromium WebGL policy file
  is provisioned in the sandbox (see §3).
- The single owner-ordered deploy happens once the whole Sinnoh
  arc chain closes (through S9); nothing here was pushed or
  deployed.

## Arc 4 Stage S8 — CAMPAIGN GATE: the full chain through Sinnoh + finale on one save (2026-10-29)

Base for this stage: `main` @ `b45001b` (S7 committed). Implementer session (War Room). **The continuous-save chain drive — the H7a/F5a harness at `~/workspace/ashs-journey-qa/arc-chain-qa/chain-drive.mjs`, standing at 147/147 at the Frontier close — is EXTENDED, not replaced: from the Frontier-complete point the SAME save now walks the whole of Sinnoh and the finale, closing at 211/211.** Exactly ONE by-name supersession (F22, below); every other prior check (C01–C40, J01–J40, H01–H35, F01–F24, D01–D08) stands UNMODIFIED and passes. **The gate caught one genuine full-chain bug** — the server validator's flags-size bound rejecting every real Sinnoh-complete save — fixed minimally as S8-fix (its own entry follows this one; A/B-proven below). **No other game-code change: the fresh build is byte-identical to the S7 close (public/game.js 12,287,055 B, sha256 `b1f77766…`; public static total 12,449,677 B, delta +0).** No push, no deploy (owner order: the single deploy waits for the whole chain through S9). `personal/` byte-identical (game.js sha256 `f434ba63…`, index.html `a780af0b…`, admin.js `a9242398…`, admin.html `dbf2112b…` — all four restored from HEAD after the slice/full-build passes and re-verified).

### 1. The supersession (one, named — the C28/J4a precedent)

**F22 (Sinnoh homecoming)** was written at F5a when Sinnoh was a SEALED arc: it asserted the machine delivers Gary's hook and sets `hook_sinnoh` + `homecoming_sinnoh` while `story.arc` STAYS `frontier` and NO `embark_sinnoh` is armed. S0 flipped Sinnoh to shipped, so the machine now takes its shipped branch. The check's SUBJECT is kept verbatim (the hook IS delivered by the machine in dialogue, the directive IS cleared, regionsDone is unchanged) and the assertion now reads the shipped behaviour: `story.arc` ADVANCES to `sinnoh`, region `sinnoh`, `embark_sinnoh` IS armed. **A/B at base `b45001b`: the UNMODIFIED 147-check drive run against the base tree read 146/147 with F22 the ONLY failure, its extra reading exactly `arc=sinnoh`** — the same signature as C28 (Orange flip) and J4a (Johto flip) before it. Arithmetic: 147 prior − 1 superseded + 1 replacement + 61 new Sinnoh checks (S01–S61) + 3 new D checks (D09–D11) = **211 total**.

### 2. The Sinnoh segment, enumerated (S01–S61, all on the one save)

Sealed derivation + embark: S01 homecoming read-back (arc/region sinnoh, embark armed, `arcDexStart` == the walked caught count, 13); S02 CAPT SINNOH sails Vermilion → Sandgem, arrival scene completes. **S5a spine:** S03 Rowan's lab + Paul 1; S04 Dawn met + Verity glimpse; S05 Gardenia badge-skip refusal (prefix law, no battle); S06 Roark (a shipped-roster miner battles first); S07 Barry; S08 Windworks/Mars; S09 Gardenia; S10 Jupiter raid + Paul's Eterna assessment; S11 Fantina; S12 Dawn's Hearthome contest beat + the player's rank gate standing open; S13 THE CHIMCHAR BEAT (Chimchar Lv 320 in band); S14 Defog/HM06 once; S15 Maylene — the prefix of four; S16 Saturn's HQ door + Reggie + Paul's Veilstone audit; S17 the first 14 SINNOH chain flags all stand. **S5b spine:** S18 Pastoria Tale + Wake; S19 Valor glimpse; S20 the HQ raid (Saturn must-win — the S5a door opened); S21 Byron; S22 the Darkrai plea → Fullmoon Lunar Wing → the boy wakes; S23 Gracidea; S24 Snowpoint Tale + Candice; S25 Acuity glimpse + THE PAUL MIDPOINT resolved FACED (win-or-lose, no gate); S26 Rock Climb/HM07; S27 Sunyshore Tale + Volkner — badges.sinnoh the full Platinum eight IN ORDER; S28 Grand Festival + Mesprit glimpse + Zoroark special + Celestic Tale; S29 Coronet climb; S30 Spear Pillar — Cyrus FACED, the sky tears, warp into the Distortion World; S31 the six-map traversal + THE CLIMAX (Cyrus ended, `sinnoh_climax_resolved`, Dialga/Palkia/Giratina unlocks); S32 Conference registration + preliminary; S33 THE PAUL SETTLEMENT (won at full strength, 2 attempts via the shipped rechallenge loop — the engine never hard-locked); S34 TOBIAS PROOF (i) a full wipe (the sinnoh-story Growl-only-Starly fixture) concludes NOTHING; S35 Darkrai FALLS (1 attempt); S36 Latios concludes WIN-OR-LOSE on the canon-loss path with the honour intact — the machine fired on `sinnoh_complete` EXACTLY once (regionsDone gained `sinnoh` exactly once, directive `unova` pinned) and never re-fires; S37 all 30 SINNOH chain flags stand + the Quest Log SINNOH rows starred. **S6 spot-arcs sampled on the same save** (exhaustive per-arc proofs live in sinnoh-legendary): S39 Uxie (flee re-fires, then caught); S40 Dialga THEN Palkia, both caught, order enforced; S41 Spiritomb (no-stone scenery, the traveller's Odd Keystone gift, flee re-fires at the tower, caught); S42 Manaphy (Rowan's Egg + Oak's Letter, hatched at exactly 250 walked steps via the shipped step hook, Lv 301). **Finale (S7):** S43 pre-finale pinning (NO flute, NO unlock, NO Master HoF, Hall of Origin SILENT — the capstone is finale-gated, not map-gated); S44 the NAMED DEX FIXTURE (the sinnoh-story C03 idiom — dex filled to 492/493 with only the capstone outstanding; the drive's own walked catches numbered 19 before the fill; the fill touches dex data only); S45 the finale homecoming (sealed law: arc stays `sinnoh`, NO embark armed, directive COMPLETE); S46 bond echoes ×6, one per completed arc, in regionsDone order; S47 Oak's "492 of 493" + the Azure Flute entrusted (exactly one, key pocket); S48 Master HoF — the shelf grows 2 → 3, exactly one `master` entry, the genuine per-arc entries untouched; S49 full credits closing on the end card, the approved line verbatim ("Six journeys. Five leagues and a frontier. One road, walked whole."); S50 the capstone appears in the Quest Log; S51 the flute ceremony at Spear Pillar (say-only, both titans already caught, the pillar quiet); S52 Arceus faces at the band cap Lv 400 — FLEE RE-FIRES, completes nothing; S53 the catch — dex **493/493**; S54 the Platinum Diploma reads earned; S55 home stays quiet (no re-fire, flute still one, Master still one); S56 the Journey menu — six arcs COMPLETE + the SEALED silhouette band. **Post-game integrity tail:** S57 CAPT WESTWIND sails Canalave → Vermilion after the finale; S58 CAPT SINNOH still sails Vermilion → Sandgem; S59 a Center exit in Sinnoh (Jubilife's own door-front (4,4) via the real door warp + `centerExit()` — never the Pallet fallback); S60 the end state (regionsDone exactly `[kanto, orange, johto, hoenn, frontier, sinnoh]`, the Platinum eight in order, Frontier symbols still all gold, dex 493/493); S61 NG+ starts from the full-chain save (`ngPlus` 1, own HoF empty, the prior shelf carrying all 3 entries with the Master flag intact).

**Named drive-side adaptations** (driver only, no game code): every Sinnoh gym drives the shipped 4-attempt rechallenge loop (heal + re-talk per attempt), the league idiom, so an honest loss never hard-locks the chain — Paul's settlement took 2 attempts, recorded in its extra; the Tobias wipe fields the suites' own no-damage fixture; both validator snapshots are stamped through the REAL `doWarp` funnel (the F5a faithfulness idiom) so `meta.location` carries a real map name, not a teleport artifact.

### 3. The F5-lesson check (D09/D10/D11 + D08 re-pointed)

- **D09 (Sinnoh-complete):** the chain's own S38 snapshot — taken standing in **Route 212 — North** through the real warp funnel — validates with **ZERO errors on BOTH validators**: `{location: "Route 212 — North", server: [], client: []}`. The F-1 em-dash surface, now carrying Sinnoh's own names.
- **D10 (finale-complete):** the S60 snapshot — **Route 212 — South** (em dash), Master HoF entry standing, Azure Flute in the bag, dex 493/493 — **ZERO errors on BOTH validators**: `{location: "Route 212 — South", server: [], client: []}`.
- **D11 (sealed derivation):** the chain's own Frontier end state, re-shaped pure-side to the sealed-consumed form (hook + homecoming set, arc `frontier`, no embark), derives arc `sinnoh` + region `sinnoh` + `embark_sinnoh` through `SCH.migrate` — the UNCHANGED generic F0 catch-up — regionsDone untouched, idempotent.
- **D08** now snapshots the FINAL finale end state (the H7a re-pointing precedent; `__CHAINSAVE__` re-stamped after S60) and re-proves it against BOTH validators: `{server: [], client: []}`.

### 4. The complete battery (every suite; counts as run at this stage)

| Suite | Result | Notes |
|---|---|---|
| **chain drive (this stage)** | **211/211** | 147 prior (F22 superseded, §1) + S01–S61 + D09–D11 |
| sinnoh-checks | 132/132 | |
| sinnoh-story | 123/123 | |
| sinnoh-legendary | 27/27 | |
| frontier-checks | 136/136 | |
| hoenn-story | 88/88 | |
| hoenn-contest | 28/28 | |
| hoenn-legendary | 24/24 | |
| johto-story | 110/110 | |
| johto-systems | 62/62 | |
| arc-foundation | 47/47 | |
| cheat-shop | 44/44 | |
| fidelity | 35/35 | |
| orange-story | 38/38 | |
| orange-climax | 42/42 | |
| campaign-smoke | **24/24** | hard requirement met |
| **battle-model** | **45/45** | hard requirement met |
| qa-changed-flows | failures exactly **{b2, d9}** | hard requirement met; the standing pre-seal failures (Journey-menu row count; sight cones), unchanged |
| qa-slice (verify-slice) | 132/134 | failures exactly **{s6, l8}** — the named inheritance |
| audit-headless | 17/17 | |
| audit-laptop | unrunnable | chromium did not start in this sandbox — the named inheritance |
| rejuv phase 1 | 44/44 | |
| rejuv phase 2 | 38/40 | failures {A09, C01} — named inheritances (C01 = chromium launch) |
| rejuv phase 3 | 60/61 | failure {C01} chromium |
| rejuv phase 4 | 50/51 | failure {C01} chromium |
| rejuv phase 5 | 52/53 | failure {C01} chromium |
| rejuv phase 6 | 44/45 | failure {C01} chromium |
| Track B integration (`tests/run.mjs`) | 114/114 | via the documented register hook (PGlite) |
| api-scripts validator | **109/109** | 106 at S7 + 3 S8-fix pins (§S8-fix) |
| api-scripts validator fuzz | 2000/2000 | |
| api-scripts save-contract | 12/12 | |
| api-scripts config | 39/39 | |
| api-scripts failclosed | 20/20 | |
| api-scripts http-ip | 13/13 | |
| api-scripts gen-tables --check | OK | tables `b7d7fc71…`, 509 species / 146 moves / 200 items |
| budgets-check | all gates pass | script's vercel-static accounting 12,378,615 ≤ 12,582,912 |
| drift-gate | PASS on the fresh build | on the COMMITTED tree it fails identically at base `b45001b` (same hashes — the committed `dist/standalone.html` is stale vs committed `public/game.js` from the S5b–S7 per-target public builds; A/B-proven in a pristine base worktree, so standing bookkeeping, NOT an S8 regression) |
| contamination-scan | clean | |
| verify-audio | ALL PASS | |

**Exceptions beyond the named inheritances: NONE.** The one genuine bug the gate caught (bad-flags-size) is fixed and pinned — see the S8-fix entry.

### 5. Final numbers (the mission's closing figures)

- **Roster census (the S2b rig): PASS — 509/509 authored front+back pairs, missing [], blanks [], 0 fallbacks.**
- **Sinnoh walking sweep: PASS — graph from Sandgem reaches 139/139 maps** (the S3 figure, re-proven).
- **Bundle: fresh full build run twice — byte-identical** (public/game.js sha256 `b1f77766…` both runs). **public/game.js 12,287,055 B; public static total 12,449,677 B (game.js + index.html 91,560 + admin.html 52,951 + admin.js 18,111) — delta vs the S7 close: +0 B** (S8 changed no game code; the one fix is server-side validator + its pins). Gate 12,582,912 B, headroom 133,235 B. The S9 reserve is intact.
- `personal/` byte-identical to base (hashes in the head of this entry); the commit carries ONLY `api/_lib/validator.mjs`, `tools/api-scripts/validator.test.mjs`, and this register.

### 6. Verdict

**CAMPAIGN GATE: SHIP.** One save, walked continuously from a fresh Kanto start through Orange, Johto, Hoenn, the Battle Frontier, the full Sinnoh campaign, and the finale, now reads **211/211** — with the F5 lesson re-proven on Sinnoh's own ground: played-shape Sinnoh-complete and finale-complete saves validate with zero errors on BOTH validators, em-dash map names and all. The gate did the job a gate exists for: it caught the one bug no stage battery could see (a Foundation-era server bound the finished campaign outgrew), and that bug is fixed, pinned, and recorded as its own entry below. The arc chain through Sinnoh is COMPLETE and proven; what remains is S9 (the Player's Guide revision) and then the owner's single deploy.

## Arc 4 Stage S8-fix — the server flags-size bound outgrown by the shipped campaign (2026-10-29)

**The bug (caught ONLY by the S8 chain drive, the F5-fix class):** `api/_lib/validator.mjs` capped `story.flags` at 500 keys (`bad-flags-size`) — a Track-B-era sanity bound. `story.flags` is the standing open vocabulary, and a real played save accumulates flags across every arc. Measured on the chain drive's own snapshots: **433 flags at Frontier-complete (under the bound — D08 passed at F5), 619 at Sinnoh-complete, 650 at finale-complete.** Every real full-chain save from Sinnoh onward was therefore REJECTED server-side while the client schema accepted it — the player could not cloud-save. No stage battery could see it: their played-shape fixtures carry few flags by construction (the same blind spot as F5-fix's `regionsDone` vocabulary and S0's F-1 charset).

**A/B:** the S8-extended chain drive against the base validator read 208/211 with D08, D09, D10 failing ONLY as `{server: ["bad-flags-size"], client: []}` — the same snapshots, the same client result; the server bound is the sole discriminator. After the fix: 211/211, D08/D09/D10 all `{server: [], client: []}`.

**The fix (one line + its lineage comment, `api/_lib/validator.mjs`):** the bound stands and is raised 500 → **1000**, with the measured counts recorded in the comment in the bag-cap lineage style (the cap tracks the shipped campaign's real need; its purpose — a sanity size — is unchanged, and the route's 64 KB payload gate still bounds the bytes: the finale-complete save serializes to ~44 KB at 650 flags). Nothing else widens: flag keys still ≤64 chars, values still boolean-only, dangerous keys still rejected.

**Pins (+3, validator 106 → 109):** (i) a played-shape full-chain save carrying 650 story flags (the measured finale count) validates server-side with ZERO errors; (ii) the client schema result for the same save is unchanged (accepted); (iii) the bound still stands — 1001 flags reject `bad-flags-size`. Fuzz 2000/2000, save-contract 12/12, Track B 114/114 all re-run green over the change.

**Guilty stage, named:** no S-stage introduced the bound — it predates the arcs (Track B). What outgrew it is the shipped campaign itself, accreting stage by stage (S5a/S5b's story flags carried a Frontier-complete save's 433 past 500 during Sinnoh); S8 is the first gate whose continuous save could measure it. Recorded as its own entry per the campaign-gate rule — not buried in the S8 battery table.
