# Asset Contracts — Ash's Journey

**Audience:** Art Director (seat 33) + Voice Designer (seat 24), Phase 4 Wave 2.
**Status:** binding. Implement exactly against these contracts; deviations need a
Game Producer–signed note and, where marked, GC/LCR re-sign.

All assets are **100% original** — no ripped sprites, no ROM palettes, no sampled
audio, no copied scripts. Lead Code Reviewer attests provenance per
`assets/manifest.yaml`; General Counsel signs IP clearance.

---

## 1. Sprite contract (Art Director)

### 1.1 Sprite-sheet format

- **Delivery:** one PNG atlas per family + one JSON manifest per atlas.
- **Atlas constraints:** max **2048×2048** PNG; decoded residency ≤ 20 MB total
  (ADR-007). Battle sprites **≤ 160×160 px** each (ADR-007).
- **Grid:** all sprites authored on a **16×16 logical grid** (overworld/NPC) or
  **32×32 / 48×48** (battlers, multiples of 16). No sub-pixel sprite placement at
  rest — positions snap to whole logical pixels; sub-pixel motion allowed only
  during interpolation.
- **Manifest JSON shape** (one entry per sprite; consumed by
  `scripts/build.mjs` → `public/atlas-*.json`):

```json
{
  "atlas": "species-kanto-1.png",
  "tile": 16,
  "sprites": {
    "pidgey":      { "x": 0,  "y": 0,  "w": 16, "h": 16, "frames": ["idle", "idle2"], "palette": 8, "seed": null },
    "pidgey-back": { "x": 16, "y": 0,  "w": 16, "h": 16, "frames": ["idle"],          "palette": 8, "seed": null }
  }
}
```

- `frames`: overworld NPC = 2 idle + 4 walk (named per direction:
  `walk-down-1..4`, etc.); battlers = 2-frame bob (`idle`, `bob`) +
  named attack/impact frames (`attack`, `impact`, `faint`).
- Every sprite ships a **1px transparent margin**; no orphan pixels.

### 1.2 Palette caps (binding, from gameux §6 taste standard)

| Surface | Cap |
|---|---|
| Per sprite | **≤ 12 colors + transparency** |
| Overworld screen | ≤ 64 on-screen colors |
| Battle screen (UI + battlers) | ≤ 48 on-screen colors |
| Tileset | ≤ 16 colors |
| Global UI palette | **24 colors** (design tokens; type pills carry icon + text, never color alone) |

**Rules:** 1px dark outline on character/species sprites (outline = darkest shade of
the sprite's own palette, never pure black on light sprites); no anti-aliasing,
no feathered edges; no gradients in sprites — shading = 2–3 flat tones + optional
2px dither; battle backgrounds may use banded vertical steps (max 5 bands), never
smooth gradients; day/night/season tints are **palette shifts authored per
tileset**, never multiply overlays; HP bars are functional colors only
(green >50% / yellow 25–50% / red <25%, plus stripe overlay + ⚠ pip under 25% —
accessibility, colorblind-safe).

### 1.3 Slop blacklist (instant rework, no debate)

Photorealistic textures · lens flares / glow filters · inconsistent outline widths
on one screen · emoji or system icons in UI (draw pixel icons or don't ship) ·
more than one drop-shadow style (UI shadow = 2px offset, 25% black, the only one) ·
placeholder gray boxes / "coming soon" screens in a signed build · text < 14 logical
px in a shipped screen · any screen that looks like a different game (style drift).

### 1.4 Provenance (per asset, into `assets/manifest.yaml`)

generator name + version, seed (if procedural), hand-finish author + date,
`ai_assisted: true/false`. CI re-runs the build and diffs output — a
non-reproducible asset fails the build. No AI-generated pixels ship without the
hand-finish pass and Art Director sign-off.

### 1.5 Wave 2 sprite order (priority)

1. Ash overworld (4-dir walk, 4 frames) + Pikachu follower (hop, 2-frame bob)
2. Brock + Geodude/Onix battle sprites (slice capstone quality bar)
3. Route 1/Pallet/Viridian/Pewter tileset (16-color, day palette)
4. Slice species battlers (front + back, ≤160px)

---

## 2. Audio contract (Voice Designer)

### 2.1 Note-table format (zero audio files, ever)

Music and SFX ship as **note tables** — JSON arrays consumed by the WebAudio
chiptune engine (`src/engine/audio.mjs`). Original compositions only.

```json
{
  "id": "route1-theme",
  "title": "Road Out of Pallet (original)",
  "bpm": 132,
  "tracks": [
    { "wave": "pulse", "duty": 0.5, "vol": 0.5,
      "notes": [[0.0, "C4", 0.25], [0.25, "E4", 0.25], [0.5, "G4", 0.5]] },
    { "wave": "triangle", "vol": 0.6,
      "notes": [[0.0, "C2", 1.0]] },
    { "wave": "noise", "vol": 0.3,
      "notes": [[0.0, null, 0.125], [0.5, null, 0.125]] }
  ]
}
```

- `wave`: `pulse` (with `duty` 0.125/0.25/0.5), `triangle`, `noise`.
- Notes: `[beatOffset, pitchOrNull, beats]`; pitch = scientific notation
  (`A4` = 440 Hz); `null` pitch on noise = unpitched hit.
- **Channel budget:** 4–6 channels (2 pulse, 1 triangle/wave, 1 noise).
- **SFX:** single-track tables with `vol` envelope `[attack, decay]`; every action
  gets a sound (menu blip, cursor tick, ball throw, shake rattle, catch click,
  dex jingle, badge fanfare, low-HP warning, heal chime) + persisted mute (M key /
  options). Music unlocks on first user gesture (autoplay policy).
- Melody rule: chiptune *style* is fine; *melody must be original* — flag anything
  a reviewer could mistake for an official track (GC gate).

### 2.2 Wave 2 audio order (priority)

1. Title theme (original) + encounter jingle + battle loop (original)
2. Catch theater set: throw / rattle ×3 / click / "Gotcha!" jingle / dex-register chime
3. UI set: blip, tick, fanfare (badge), heal, low-HP warning
4. Route/town themes (original): Pallet, Route 1, Viridian, Pewter, Gym

### 2.3 Voice

No voice acting in scope (per dossier Voice Designer brief). Species "cries" are
**synthesized**, never sampled — sampled cries from games/anime are copyrighted
audio. Consent boundary stands: no cloned voices, no TTS of copyrighted scripts.

---

## 3. Acceptance

Art Director and Voice Designer sign this contract (counter-signature in the Wave 2
plan) before producing assets. CI enforces: palette audit, margin/orphan audit,
atlas size caps, note-table schema validation, and the zero-audio-file rule
(any `*.wav|*.mp3|*.ogg` in `assets/` fails the build).
