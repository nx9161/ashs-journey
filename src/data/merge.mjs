// merge.mjs — folds the expansion data modules into the base tables.
// Load order (module-order.json) guarantees the sources exist first.
Object.assign(SPECIES, SPECIES2);
Object.assign(SPECIES, SPECIES_JOHTO);
Object.assign(SPECIES, SPECIES_HOENN);
Object.assign(MOVES, MOVES2);
Object.assign(MAPS, MAPS2, MAPS3, MAPS4, MAPS5, MAPS6, MAPS7, MAPS8);
Object.assign(TRAINERS, TRAINERS3, TRAINERS4, ORANGE_TRAINERS, JOHTO_TRAINERS, HOENN_TRAINERS);
Object.assign(EVENTS, ORANGE_EVENTS, JOHTO_EVENTS, HOENN_EVENTS);
// Stage J4a: Johto Town Tales fold into the ONE tales table (quests.mjs
// QUESTS) — the shipped tale machine (stage values, Quest Log section,
// validator quest list via gen-tables) serves them unchanged.
Object.assign(QUESTS, JOHTO_TALES);
// Stage H4a: Hoenn Town Tales fold into the same tales table.
Object.assign(QUESTS, HOENN_TALES);
Object.assign(LEGENDARY_ARCS, ORANGE_LEGENDARY_ARCS);
// Stage J5 fold: Johto's live legendary arcs (the beasts + Celebi).
// arc_celebi here deliberately supersedes the designed entry in
// story-kanto.mjs (its steps described an errand the shipped game
// never told); arc_hooh was activated in place in LEGENDARY_ARCS.
Object.assign(LEGENDARY_ARCS, JOHTO_LEGENDARY_ARCS);
// Stage H6 fold: Hoenn's ten live legendary arcs (the Regi tombs,
// the Eon pair, the weather trio + Rayquaza, Jirachi, Deoxys) —
// every one supersedes its story-kanto.mjs designed stub (dead lair
// ids, pre-band levels, and arc_rayquaza's arcs-prereq, replaced by
// the climax_resolved flag key per the H4b ruling).
Object.assign(LEGENDARY_ARCS, HOENN_LEGENDARY_ARCS);
// Story patch (fidelity audit): the movie invite's island landing was
// scripted out of bounds (8,14 on a 12-row map) — land on the shore (8,9).
for (const ev of Object.values(EVENTS)) {
  const steps = Array.isArray(ev) ? ev : (ev.steps || []);
  for (const s of steps) {
    if (s.warp && s.warp.map === 'newisland') { s.warp.x = 8; s.warp.y = 9; }
  }
}
