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
