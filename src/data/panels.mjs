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
  // W10-B T2 — Yamato + Maris (Class A catch reveals)
  'stormfield-voltigris': { art: 'panel-stormfield-voltigris' },
  'millstone-magmalion': { art: 'panel-millstone-magmalion' },
  'towerfoot-borepard': { art: 'panel-towerfoot-borepard' },
  'summit-irisavis': { art: 'panel-summit-irisavis' },
  'sealstones-petragolem': { art: 'panel-sealstones-petragolem' },
  'frostchamber-cryogolem': { art: 'panel-frostchamber-cryogolem' },
  'gleamtomb-siderogolem': { art: 'panel-gleamtomb-siderogolem' },
  'foldedair-rubiavis': { art: 'panel-foldedair-rubiavis' },
  'tideline-azuravis': { art: 'panel-tideline-azuravis' },
  // W10-B T3 — Borea lakes & the rest of the catches (Class A catch reveals)
  'insight-loracle': { art: 'panel-insight-loracle' },
  'gallant-volitar': { art: 'panel-gallant-volitar' },
  'candor-empathis': { art: 'panel-candor-empathis' },
  'crescent-lunacygn': { art: 'panel-crescent-lunacygn' },
  'crater-magmarch': { art: 'panel-crater-magmarch' },
  'temple-colossor': { art: 'panel-temple-colossor' },
  'paradise-grathog': { art: 'panel-paradise-grathog' },
  'keystone-centwisp': { art: 'panel-keystone-centwisp' },
  'inn-noctarch': { art: 'panel-inn-noctarch' },
  'meteor-astraeon': { art: 'panel-meteor-astraeon' },
  'crater-xenogene': { art: 'panel-crater-xenogene' },
  // W10-B T4 — battle reveals (Class B, attach like catches)
  'plant-fulminis': { art: 'panel-plant-fulminis' },
  'crownroad-pyrehawk': { art: 'panel-crownroad-pyrehawk' },
  'seafoam-glacierne': { art: 'panel-seafoam-glacierne' },
  'stillheart-omnigen': { art: 'panel-stillheart-omnigen' },
  'rain-primara': { art: 'panel-rain-primara' },
  'cagefire-pyrehawk': { art: 'panel-cagefire-pyrehawk' },
  'cagestorm-fulminis': { art: 'panel-cagestorm-fulminis' },
  'cageice-glacierne': { art: 'panel-cageice-glacierne' },
  'deep-abyssorn': { art: 'panel-deep-abyssorn' },
  'altar-abyssorn': { art: 'panel-altar-abyssorn' },
  // W10-B T5 — glimpses (Class C) + set-pieces (Class D)
  'underice-loracle': { art: 'panel-underice-loracle' },
  'surfaced-empathis': { art: 'panel-surfaced-empathis' },
  'gracidea-grathog': { art: 'panel-gracidea-grathog' },
  'storm-sanctum': { art: 'panel-storm-sanctum' },
  'parley-plaza': { art: 'panel-parley-plaza' },
  // W10-C T1 — embark crossings (Class H, surface attach: the arc
  // record's enRoutePanel field names the moment; the T0 ferry seam
  // plays it after the en-route card, before landFerry())
  'crossing-orange': { art: 'panel-crossing-orange' },
  'crossing-johto': { art: 'panel-crossing-johto' },
  'crossing-hoenn': { art: 'panel-crossing-hoenn' },
  'crossing-frontier': { art: 'panel-crossing-frontier' },
  'crossing-sinnoh': { art: 'panel-crossing-sinnoh' },
  // W10-C T2 — endings (Class F): the champion seal panel (a {panel}
  // step in ev_champion) + the six ARC COMPLETE card panels (named
  // from data fields — each playable arc record's cardPanel — and
  // resolved by arcCardPanel at the showArcCompleteCard seam).
  'champion-chamber': { art: 'panel-champion-chamber' },
  'card-kanto': { art: 'panel-card-kanto' },
  'card-orange': { art: 'panel-card-orange' },
  'card-johto': { art: 'panel-card-johto' },
  'card-hoenn': { art: 'panel-card-hoenn' },
  'card-frontier': { art: 'panel-card-frontier' },
  'card-sinnoh': { art: 'panel-card-sinnoh' },
  // W10-C T3 — finale + intro (Class F8 surface attach via the
  // FINALE_PANEL const; Class E2 via INTRO_SCRIPT.starterPanel)
  'finale-road': { art: 'panel-finale-road' },
  'intro-partner': { art: 'panel-intro-partner' },
};
