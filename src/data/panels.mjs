// panels.mjs — W10 cutscene panel indirection table.
// Story data names the MOMENT (a `{ panel: '<id>' }` step in an event's
// step list, interpreted by runSteps in overworld-systems.mjs); this
// table names the ART, so a panel can be re-cut without touching story
// files (the narrative DB's single-sourcing discipline).
// Panel art entries live in assets/sprites/pix/keyart/panel-<id>.pix and
// flow through build-art into ART as `panel-<id>` (title-keyart
// precedent). Canvas standard (Director ruling, W10): 128x80 authored,
// presented at 2x integer scale by ui.showPanel.
// A panel step is PRESENTATION ONLY: it writes no flags and no state —
// the parity guard (tests/cutscene-panel-checks.mjs) proves an event's
// end state is identical with and without its panel steps.
export const PANELS = {
  'shrine-chronofae': { art: 'panel-shrine-chronofae' },
  // W10-B T1 — sovereigns & finales (Class A catch reveals)
  'hall-primarch': { art: 'panel-hall-primarch' },
  'spire-chronarch': { art: 'panel-spire-chronarch' },
  'spire-cosmarch': { art: 'panel-spire-cosmarch' },
  'reversal-voidarch': { art: 'panel-reversal-voidarch' },
  'pillar-stratowyrm': { art: 'panel-pillar-stratowyrm' },
  'magma-terratitan': { art: 'panel-magma-terratitan' },
  'trench-abyssorca': { art: 'panel-trench-abyssorca' },
  'darkmoon-noctarch': { art: 'panel-darkmoon-noctarch' },
};
