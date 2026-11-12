// story.mjs — Anime-chronology campaign spine (ADR-015).
// Maps the owner's complete anime+movies watch order onto the game's chapter
// structure. v1 "Act I: The Beginning" (ADR-006) = chapters 1-5 (Arden, Orange,
// Yamato). Everything beyond is scaffolded as honest locked markers — no fake
// content, no playable claims (scope-honesty rule). Non-canon movies/minis
// live on the BONUS shelf, never on the main spine.
// All text is original phrasing; episode/movie titles are factual references.

export const ACTS = [
  { n: 1, title: 'Act I: The Beginning', scope: 'playable', note: 'Arden → Orange Islands → Yamato (v1)' },
  { n: 2, title: 'Act II: New Horizons', scope: 'announced', note: 'Maris → Trial Grounds → Sinnoh (v2, announced ADR-006)' },
  { n: 3, title: 'Act III: Beyond', scope: 'planned', note: 'Unova → Kalos → Alola → Journeys → Horizons (planned, not built)' },
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
    n: 2, id: 'orange-islands', act: 1, region: 'Orange Islands', scope: 'playable',
    title: 'Adventures in the Orange Islands',
    arc: 'Four Orange badges across the southern seas.',
    anime: 'Season 2: Adventures in the Orange Islands (Ep 1–24, Special: Slowking\u2019s Day, Ep 25–36)',
    movies: ['Pok\u00e9mon 2000 — The Power of One'],
  },
  {
    n: 3, id: 'johto-journeys', act: 1, region: 'Yamato', scope: 'playable',
    title: 'The Yamato Journeys',
    arc: 'A new region, eight new gyms, an old rival.',
    anime: 'Season 3: The Yamato Journeys (Ep 1–38, Ep 39–41)',
    movies: ['Spell of the Unown'],
  },
  {
    n: 4, id: 'johto-league-champions', act: 1, region: 'Yamato', scope: 'playable',
    title: 'Yamato League Champions',
    arc: 'The road to the Lastlight Conference.',
    anime: 'Season 4: Yamato League Champions (Ep 1–21, Ep 22–48, Ep 49–52)',
    movies: ['OMNIGEN Returns', '4Ever — Celebi: Voice of the Forest'],
  },
  {
    n: 5, id: 'master-quest', act: 1, region: 'Yamato', scope: 'playable',
    title: 'Master Quest',
    arc: 'The Lastlight Conference — the road continues.',
    anime: 'Season 5: Master Quest (Ep 1–47, Ep 48–65)',
    movies: ['Heroes — Latios & Latias'],
  },
  // ---- locked: Act II (v2, announced in ADR-006) ----
  {
    n: 6, id: 'hoenn', act: 2, region: 'Maris', scope: 'locked',
    title: 'Rise Through Maris',
    arc: 'Locked — Act II (v2).',
    anime: 'Seasons 6–8: Advanced / Advanced Challenge / Advanced Battle',
    movies: ['Jirachi: Wish Maker', 'Destiny Deoxys', 'Lucario and the Mystery of PRIMARA'],
  },
  {
    n: 7, id: 'battle-frontier', act: 2, region: 'Arden (Frontier)', scope: 'locked',
    title: 'Trial Grounds',
    arc: 'Locked — Act II (v2). The Frontier-Brain seat is the announced finale.',
    anime: 'Season 9: Trial Grounds (Ep 1–5, Special: Mastermind of Mirage Pok\u00e9mon, Ep 6–47)',
    movies: ['Ranger and the Temple of the Sea'],
  },
  {
    n: 8, id: 'sinnoh', act: 2, region: 'Sinnoh', scope: 'locked',
    title: 'Diamond & Pearl',
    arc: 'Locked — Act II (v2).',
    anime: 'Seasons 10–13: Diamond and Pearl / Battle Dimension / Galactic Battles / Sinnoh League Victors',
    movies: ['The Rise of Darkrai', 'Giratina and the Sky Warrior', 'Arceus and the Jewel of Life', 'Zoroark: Master of Illusions'],
  },
  // ---- locked: Act III (planned) ----
  {
    n: 9, id: 'unova', act: 3, region: 'Unova', scope: 'locked',
    title: 'Black & White',
    arc: 'Locked — future act.',
    anime: 'Seasons 14–16: Black & White / Rival Destinies / Adventures in Unova',
    movies: ['Victini and Reshiram / Zekrom', 'Kyurem vs. the Sword of Justice', 'Genesect and the Legend Awakened'],
  },
  {
    n: 10, id: 'kalos', act: 3, region: 'Kalos', scope: 'locked',
    title: 'XY & XYZ',
    arc: 'Locked — future act.',
    anime: 'Seasons 17–19: XY / Kalos Quest / XYZ (incl. Mega Evolution specials)',
    movies: ['Diancie and the Cocoon of Destruction', 'Hoopa and the Clash of Ages', 'Volcanion and the Mechanical Marvel'],
  },
  {
    n: 11, id: 'alola', act: 3, region: 'Alola', scope: 'locked',
    title: 'Sun & Moon',
    arc: 'Locked — future act.',
    anime: 'Seasons 20–22: Sun & Moon / Ultra Adventures / Ultra Legends',
    movies: [],
  },
  {
    n: 12, id: 'journeys', act: 3, region: 'World', scope: 'locked',
    title: 'Journeys',
    arc: 'Locked — future act. Ends with "Aim to Be a Pok\u00e9mon Master" — the end of Ash\u2019s story.',
    anime: 'Seasons 23–25: Journeys / Master Journeys / Ultimate Journeys (incl. Arceus Chronicles)',
    movies: [],
  },
  {
    n: 13, id: 'horizons', act: 3, region: 'World', scope: 'locked',
    title: 'Horizons: A New Beginning',
    arc: 'Locked — future act. Liko\u2019s story begins where Ash\u2019s ends.',
    anime: 'Horizons S1 (Ep 1–45) / S2 The Search for Laqua / S3 Rising Hope / S4 Wonder Voyage',
    movies: [],
  },
];

// Non-canon movies and mini-series. Never on the main spine — the BONUS shelf.
export const BONUS_SHELF = [
  'I Choose You!',
  'The Power of Us',
  'Secrets of the Jungle',
  'Detective VOLTIK',
  'OMNIGEN Strikes Back: Evolution',
  'Pok\u00e9mon Origins',
  'Pok\u00e9mon Generations',
  'Twilight Wings',
  'Pok\u00e9toon',
  'Evolutions',
  'Hisuian Snow',
  'Paldean Winds',
  'Pok\u00e9mon Concierge',
  'Path to the Peak',
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
