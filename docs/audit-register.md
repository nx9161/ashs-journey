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
