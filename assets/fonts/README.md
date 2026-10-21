# Fonts (self-hosted, UI v2.1; 400-face corrected in UI v2.2)

The game's typefaces live here as real files. `scripts/build.mjs` reads them
at build time and embeds them as data URIs in every target (public / guest /
personal) — identical bytes in all flavors, zero runtime fetches. Do NOT
re-introduce inline base64 blobs into build.mjs: files in the repo are the
auditable source of truth.

| File | Face | Source |
|---|---|---|
| `Galmuri11.woff2` | `PtGalmuri` 400 | Galmuri11 (npm `galmuri@2.40.3`, dist/Galmuri11.woff2), subsetted |
| `Galmuri11-Bold.woff2` | `PtGalmuri` 700 | Galmuri11 Bold (npm `galmuri@2.40.3`, dist/Galmuri11-Bold.woff2), subsetted |
| `DotGothic16.woff2` | `PtGothic` 400 (fallback) | DotGothic16 Latin subset (as shipped since UI v2) |
| `OFL-Galmuri.txt` | — | SIL Open Font License 1.1 text for Galmuri |

**UI v2.2 note:** the 400 face was Galmuri14 in v2/v2.1. It loaded and
applied correctly — but Galmuri14's hairline outline construction renders
as a wispy, unrelated-looking face beside Galmuri11 Bold, so body text
visibly read as a different typeface (owner-refuted on the live build).
The 400 face is now Galmuri11 Regular, the Bold's true sibling: one
bitmap family in two weights, the DP/Pt arrangement. A font gate that only
proves loading is not proof of likeness — see the computed-style +
width-identity assertions in the v2.2 QA gate (ashs-journey-qa/shoot4.mjs).

Licenses: Galmuri and DotGothic16 are both SIL OFL 1.1 — see
`THIRD-PARTY-NOTICES.md` at the repo root. Galmuri is original work inspired
by Nintendo DS-era bitmap type; no Nintendo font files are used anywhere.

## Subset ranges (Galmuri faces)

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
