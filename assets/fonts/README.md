# Fonts (self-hosted, UI v2.1; body face replaced in UI v2.4)

The game's typefaces live here as real files. `scripts/build.mjs` reads them
at build time and embeds them as data URIs in every target (public / guest /
personal) — identical bytes in all flavors, zero runtime fetches. Do NOT
re-introduce inline base64 blobs into build.mjs: files in the repo are the
auditable source of truth.

| File | Face | Source |
|---|---|---|
| `PtPixel.woff` | `PtPixel` 400 (BODY) | Pixelify Sans (Google Fonts, variable font instanced at wght 400), subsetted to the Galmuri ranges below, WOFF flavor |
| `PtPixel-Bold.woff` | `PtPixel` 700 (BODY bold) | Pixelify Sans instanced at wght 700, same subset |
| `Galmuri11.woff2` | `PtGalmuri` 400 (display) | Galmuri11 (npm `galmuri@2.40.3`, dist/Galmuri11.woff2), subsetted |
| `Galmuri11-Bold.woff2` | `PtGalmuri` 700 (display) | Galmuri11 Bold (npm `galmuri@2.40.3`, dist/Galmuri11-Bold.woff2), subsetted |
| `OFL-Galmuri.txt` | — | SIL Open Font License 1.1 text for Galmuri |
| `OFL-PixelifySans.txt` | — | SIL Open Font License 1.1 text for Pixelify Sans |

**UI v2.4 note (body face):** the body face is now **Pixelify Sans**
(CSS family `PtPixel`). Two predecessors failed the owner's live grade in
two different ways:

- **Galmuri14** (v2/v2.1) — loaded and applied correctly, but its hairline
  outline construction renders as a wispy, unrelated-looking face beside
  Galmuri11 Bold, so body text visibly read as a different typeface.
- **DotGothic16** (v2.3) — its shipped bytes were verified sound (full
  Latin cmap, loaded, applied) and it STILL failed: DotGothic's Latin is a
  half-width dot-matrix design whose strokes are isolated single dots; at
  the game's 13–16px body sizes Chromium antialiases them into thin gray
  wisps that read as handwriting. Full investigation:
  `docs/ui-v24-root-cause.md`.

Pixelify Sans was chosen by measurement, not by name: in a real-Chromium
trial its solid filled letterforms put down clearly more ink at body
sizes than either predecessor, it is proportional with true sentence case
(the all-small-caps alternative, Silkscreen, was rejected — too wide and
shouty for dialogue), and its cmap was verified 95/95 basic Latin on the
exact shipped bytes.

**The gate:** `scripts/font-gate.mjs` parses the cmap of the shipped
PtPixel WOFF files in pure Node; `scripts/build.mjs` runs it on every
build and FAILS the build if basic Latin (U+0020–U+007E) is not complete.
The PtPixel faces ship as WOFF (v1) rather than WOFF2 precisely so the
gate can parse them without a brotli/decoder dependency. Two coverage
notes: the subset omits U+00A6 (¦) and U+00AD (soft hyphen) — neither is
used anywhere in game text — and Pixelify's basic Latin is 95/95.

**Regenerate the PtPixel faces** (from the official Pixelify Sans
variable font, e.g. the Google Fonts GitHub repo's
`fonts/PixelifySans%5Bwght%5D.ttf`):

```
for W in 400 700; do
  python3 -m fontTools.varLib.instancer PixelifySans[wght].ttf wght=$W \
    -o /tmp/Pixelify-$W.ttf
  python3 -m fontTools.subset /tmp/Pixelify-$W.ttf --flavor=woff \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2019,U+201C-201D,U+2020-2022,U+2026,U+2030,U+2039-203A,U+20AC,U+2190-2199,U+2580-259F,U+25A0-25FF,U+2600-266F" \
    --output-file=PtPixel$([ $W = 700 ] && echo -Bold).woff
done
```

Licenses: Galmuri and Pixelify Sans are both SIL OFL 1.1 — see
`THIRD-PARTY-NOTICES.md` at the repo root. Both are original works
inspired by DS-era bitmap type; no Nintendo font files are used anywhere.

## Subset ranges (all faces)

The full Galmuri fonts carry ~20k glyphs (mostly Hangul) at ~500 KB each;
the game is English-only, so the shipped faces are subsets built with
fontTools over exactly the characters the UI can render:

```
U+0020-007E  U+00A0-00FF  U+2010-2019  U+201C-201D  U+2020-2022  U+2026
U+2030  U+2039-203A  U+20AC  U+2190-2199  U+2580-259F  U+25A0-25FF  U+2600-266F
```

Regenerate (from the npm package's full woff2 files):

```
python3 -m fontTools.subset Galmuri11.woff2 --flavor=woff2 \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2019,U+201C-201D,U+2020-2022,U+2026,U+2030,U+2039-203A,U+20AC,U+2190-2199,U+2580-259F,U+25A0-25FF,U+2600-266F" \
  --output-file=Galmuri11.woff2
```

## Coverage notes (verified against the game's string set, 2026-10-21)

- Every non-ASCII character used in `src/` is present in both Galmuri faces
  after the UI v2.1 glyph pass (▶ cursor, ▌ name-entry cursor, ★ quest
  marks, ← backspace key, × close marks). The Galmuri11 subset is a strict
  glyph superset of the old Galmuri14 subset (verified by cmap diff, UI v2.2).
- Galmuri has NO ✓/✕/⌫ glyphs in any weight — the UI no longer uses them
  (see the v2.1 glyph swaps in src/game/{ui,main,auth,sync,main-systems}.mjs).
- Galmuri11 Bold lacks ♀/♂ (both regular faces have them). "Nidoran♀" renders
  in regular weight everywhere except the summary panel's bold name line,
  where that single glyph falls back — accepted micro-deviation, UI v2.1.
