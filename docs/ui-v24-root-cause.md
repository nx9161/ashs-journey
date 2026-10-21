# UI v2.4 — Divergence Root Cause

*Why UI v2.1–v2.3 kept passing the harness and failing production, written
2026-10-21 as the mandatory first deliverable of the v2.4 round.*

## (a) The body font — the brief's hypothesis was wrong; the real cause is worse

The v2.4 brief suspected the shipped DotGothic16 WOFF2 was a kana-only
subset whose missing Latin forced per-glyph fallback to a thin generic
face. **That is not what the bytes say.** The exact shipped file
(`assets/fonts/DotGothic16.woff2`, since removed) was dumped and checked
three independent ways: its cmap contains **all 95 basic Latin
codepoints** with real, non-empty outlines (95/95 Latin-1 letters too);
the bytes are **sha256-identical** in the repo file and all three built
targets; and in real Chromium the face reports status `loaded`, computes
as the first stack entry on 30+ elements, and renders with DotGothic's
exact metrics (a strict half-width advance signature no fallback face
produces). A PIL rasterization of the shipped file is pixel-consistent
with the official Google Fonts release. Nothing fell back, anywhere.

The actual cause is the typeface's own design meeting the game's sizes.
DotGothic16's Latin is a **half-width dot-matrix** design: its strokes
are isolated single dots on a coarse grid. At port size (200%+) those
dots merge into charming pixel letters; at the game's real body sizes —
DOM text at 14–16px, canvas text further shrunk by viewport scaling —
Chromium's antialiasing dissolves each dot into a faint gray smear, and
the text reads as thin, scratchy handwriting, exactly as the owner
described ("thin/handwritten/script-like"). Speaker names survived
because Galmuri's letterforms have connected, chunkier strokes, and the
overworld prompts ("A: Talk", "A: PC") are canvas text drawn on the same
body stack, so they failed with it.

Why three rounds of gates missed it: every font gate asserted
**computed-style strings** (`fontFamily` on elements) and **width
identity** (render in face A ≠ render in a nonsense family). Both are
blind to glyph rendering — they answer "which face is selected," never
"what do the letters look like at 14px." The v2.3 handoff's own
screenshots visibly contained the defect; they were graded leniently
because the probes "proved" the font was right. The fix's selection was
therefore made by measurement: candidate faces were rendered in real
Chromium and compared by ink density and sentence-case fidelity;
Pixelify Sans (solid filled letterforms, proportional, true sentence
case) won and its shipped bytes are now cmap-gated at build time.

## (b) The bag — one shell, two builders, and the tabs never existed

There is one menu shell (`UI.showMenu` in `src/game/ui.mjs`) but **two
bag builders**: the pause-menu bag (`openBag` in `src/game/main.mjs`)
and the in-battle bag (`src/game/battle.mjs`). The pause bag was a single
flat list whose pockets were separated by `band: true` rows rendered as
`.menu-row.bandrow` — full-width separator bars styled with a
`linear-gradient` in the shell CSS — under a `.menu-title` header that
was itself a blue gradient. The v2.3 round restyled only the shared
window dressing: it added the `bagwin` class to both builders' menus and
made item rows framed plates, and it re-shaded the bandrow gradient
instead of removing the rows. **Pocket tabs were never built** — the
v2.3 screenshot in the QA workspace (`shots/v23-06-bag-pause.png`) shows
the gradient section bars plainly, while its handoff simultaneously
claimed "band-tab background suppressed" and reported tabs shipped. The
battle bag was a third variant again: a plain battlewin list with the
balls grouped first. v2.4 builds one component: the same menu shell,
pockets as data, a real tab strip rendered by the shell itself, one
builder path for pause and battle, and gradients deleted from every
battle/bag rule (asserted on the built CSS, not the source).

## The systemic lesson (why v2.4's gate is different)

v2.1–v2.3 verified **proxies** (strings, widths, presence) and graded
their own screenshots against their own claims. v2.4's contract:

1. **Assert on shipped bytes** — `scripts/font-gate.mjs` parses the cmap
   of the exact font bytes the build embeds; the build dies without
   full basic Latin. `scripts/verify-live.mjs` repeats the check on the
   bytes a URL actually serves.
2. **Assert rendered outcomes** — ink density (rendering physics a
   dot-matrix face cannot fake), computed `backgroundImage: none` on
   the actual command buttons, DOM presence of the tab strip and the
   30-cell PC grid, in a real browser under the production CSP.
3. **Harness grades are advisory.** The only grade that counts is a
   live playthrough of the deployed build, by the parent, then the
   owner. Platinum is the floor: every surface must grade MATCH or
   UPGRADE against it, and any single downgrade fails the round.
