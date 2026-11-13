// story.mjs — Chronicle campaign spine (ADR-015).
// Maps the in-world Journey Chronicle serial and its films onto the game's
// chapter structure. v1 "Act I: The Beginning" (ADR-006) = chapters 1-5
// (Arden, Amber, Yamato). Everything beyond is scaffolded as honest locked
// markers — no fake content, no playable claims (scope-honesty rule).
// Side films/minis live on the BONUS shelf, never on the main spine.
// All titles are original in-world media (W-SCRUB, 2026-11-13).

export const ACTS = [
  { n: 1, title: 'Act I: The Beginning', scope: 'playable', note: 'Arden → Amber Isles → Yamato (v1)' },
  { n: 2, title: 'Act II: New Horizons', scope: 'announced', note: 'Maris → Trial Grounds → Borea (v2, announced ADR-006)' },
  { n: 3, title: 'Act III: Beyond', scope: 'planned', note: 'Vespera → Aurelia → Solana → the far roads (planned, not built)' },
];

export const CHAPTERS = [
  {
    n: 1, id: 'indigo-league', act: 1, region: 'Arden', scope: 'playable',
    title: 'The Crown League',
    arc: 'Dawnwick to the Crownspire — eight gyms, one dream.',
    anime: 'Season 1: Crown League (Ep 1–69, incl. Ep 70–82 tail)',
    movies: ['The First Movie — OMNIGEN Strikes Back'],
  },
  {
    n: 2, id: 'orange-islands', act: 1, region: 'Amber Isles', scope: 'playable',
    title: 'Adventures in the Amber Isles',
    arc: 'Four Amber badges across the southern seas.',
    anime: 'Season 2: Adventures in the Amber Isles (Ep 1–24, Special: ORAPOTAM\u2019s Day, Ep 25–36)',
    movies: ['ABYSSORN — The Power of One'],
  },
  {
    n: 3, id: 'johto-journeys', act: 1, region: 'Yamato', scope: 'playable',
    title: 'The Yamato Journeys',
    arc: 'A new region, eight new gyms, an old rival.',
    anime: 'Season 3: The Yamato Journeys (Ep 1–38, Ep 39–41)',
    movies: ['Spell of the GLYPHEYE'],
  },
  {
    n: 4, id: 'johto-league-champions', act: 1, region: 'Yamato', scope: 'playable',
    title: 'Yamato League Champions',
    arc: 'The road to the Lastlight Conference.',
    anime: 'Season 4: Yamato League Champions (Ep 1–21, Ep 22–48, Ep 49–52)',
    movies: ['OMNIGEN Returns', '4Ever — CHRONOFAE: Voice of the Forest'],
  },
  {
    n: 5, id: 'master-quest', act: 1, region: 'Yamato', scope: 'playable',
    title: 'Master Quest',
    arc: 'The Lastlight Conference — the road continues.',
    anime: 'Season 5: Master Quest (Ep 1–47, Ep 48–65)',
    movies: ['Heroes — AZURAVIS & RUBIAVIS'],
  },
  // ---- locked: Act II (v2, announced in ADR-006) ----
  {
    n: 6, id: 'hoenn', act: 2, region: 'Maris', scope: 'locked',
    title: 'Rise Through Maris',
    arc: 'Locked — Act II (v2).',
    anime: 'Seasons 6–8: Rise Through Maris / The Storm Challenge / The Battle Season',
    movies: ['ASTRAEON: Wish Maker', 'Destiny XENOGENE', 'AURAJACK and the Mystery of PRIMARA'],
  },
  {
    n: 7, id: 'battle-frontier', act: 2, region: 'Arden (Frontier)', scope: 'locked',
    title: 'Trial Grounds',
    arc: 'Locked — Act II (v2). The Frontier-Brain seat is the announced finale.',
    anime: 'Season 9: Trial Grounds (Ep 1–5, Special: Mastermind of Mirage Kin, Ep 6–47)',
    movies: ['CLIONARCH and the Temple of the Sea'],
  },
  {
    n: 8, id: 'sinnoh', act: 2, region: 'Borea', scope: 'locked',
    title: 'The Borea Chronicle',
    arc: 'Locked — Act II (v2).',
    anime: 'Seasons 10–13: The Borea Chronicle / Battle Dimension / Combine Battles / Borea League Victors',
    movies: ['The Rise of NOCTARCH', 'VOIDARCH and the Sky Warrior', 'PRIMARCH and the Jewel of Life', 'WRAITHFOX: Master of Illusions'],
  },
  // ---- locked: Act III (planned) ----
  {
    n: 9, id: 'unova', act: 3, region: 'Unova', scope: 'locked',
    title: 'The Vespera Road',
    arc: 'Locked — future act.',
    anime: 'Seasons 14–16: Vespera / Rival Destinies / Adventures in Vespera',
    movies: ['The Twin Dragons of Vespera', 'The Sword of the Vale', 'The Legend Awakened'],
  },
  {
    n: 10, id: 'kalos', act: 3, region: 'Kalos', scope: 'locked',
    title: 'The Aurelia Standard',
    arc: 'Locked — future act.',
    anime: 'Seasons 17–19: Aurelia / The Aurelia Quest / Aurelia Rising (incl. Mega Evolution specials)',
    movies: ['The Jewel and the Cocoon', 'The Clash of Ages', 'The Mechanical Marvel'],
  },
  {
    n: 11, id: 'alola', act: 3, region: 'Alola', scope: 'locked',
    title: 'Twin Lights',
    arc: 'Locked — future act.',
    anime: 'Seasons 20–22: Twin Lights / Island Adventures / Island Legends',
    movies: [],
  },
  {
    n: 12, id: 'journeys', act: 3, region: 'World', scope: 'locked',
    title: 'Journeys',
    arc: 'Locked — future act. Ends with "Aim to Be a Kin Master" — the end of Kian\u2019s story.',
    anime: 'Seasons 23–25: Journeys / Master Journeys / Ultimate Journeys (incl. the PRIMARCH Chronicles)',
    movies: [],
  },
  {
    n: 13, id: 'horizons', act: 3, region: 'World', scope: 'locked',
    title: 'A New Beginning',
    arc: 'Locked — future act. A new tamer\u2019s story begins where Kian\u2019s ends.',
    anime: 'A New Beginning S1 (Ep 1–45) / S2 The Search for the Far Shore / S3 Rising Hope / S4 Wonder Voyage',
    movies: [],
  },
];

// Non-canon movies and mini-series. Never on the main spine — the BONUS shelf.
export const BONUS_SHELF = [
  'The First Bond',
  'The Power of the Coast',
  'The Jungle's Secret',
  'Detective VOLTIK',
  'OMNIGEN Strikes Back: Evolution',
  'Origins',
  'Generations',
  'Dusk Wings',
  'KinToons',
  'Evolutions',
  'Olden Snow',
  'Sunland Winds',
  'The Kin Concierge',
  'Road to the Summit',
];

export function chapterOf(n) {
  return CHAPTERS.find((c) => c.n === n) || CHAPTERS[0];
}

export function playableChapters() {
  return CHAPTERS.filter((c) => c.scope === 'playable');
}

export function lockedChapters() {
  return CHAPTERS.filter((c) => c.scope === 'locked');
}
