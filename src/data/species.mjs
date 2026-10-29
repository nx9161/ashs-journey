// species.mjs — slice roster data (Kanto opening: Pallet -> Pewter).
// Original data tables for this fan project. spriteSeed feeds SpriteForge v1;
// Art Director replaces sprites per docs/contracts.md §1.

export const SPECIES = {
  partner: {
    id: 'partner', name: 'Pikachu', dexNo: 25, types: ['electric'],
    base: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
    catchRate: 190, growth: 'mediumfast', baseXp: 82, body: 'quad', spriteSeed: 2501,
    eggGroups: ['ground', 'fairy'], hatchCounter: 10,
    learnset: { 1: ['thundershock', 'growl'], 5: ['quickattack'] },
    flavor: 'A spirited partner who refused the easy path. Never leaves your side.',
    // Yellow homage (hard rules): never boxed, never evolved. Guards in state.mjs.
    refusesEvolution: true,
    refusesBox: true,
  },
  pidgey: {
    id: 'pidgey', name: 'Pidgey', dexNo: 16, types: ['normal', 'flying'],
    base: { hp: 40, atk: 45, def: 40, spa: 35, spd: 35, spe: 56 },
    catchRate: 255, growth: 'mediumslow', baseXp: 50, body: 'bird', spriteSeed: 1601,
    eggGroups: ['flying'], hatchCounter: 15,
    learnset: { 1: ['tackle'], 3: ['gust'], 5: ['quickattack'] },
    flavor: 'Common on quiet routes. Gusts up dust when it takes off.',
  },
  rattata: {
    id: 'rattata', name: 'Rattata', dexNo: 19, types: ['normal'],
    base: { hp: 30, atk: 56, def: 35, spa: 25, spd: 35, spe: 72 },
    catchRate: 255, growth: 'mediumfast', baseXp: 51, body: 'quad', spriteSeed: 1901,
    eggGroups: ['ground'], hatchCounter: 15,
    learnset: { 1: ['tackle', 'tailwhip'], 4: ['quickattack'] },
    flavor: 'Quick teeth, quicker feet. Nibbles anything left unattended.',
  },
  caterpie: {
    id: 'caterpie', name: 'Caterpie', dexNo: 10, types: ['bug'],
    base: { hp: 45, atk: 30, def: 35, spa: 20, spd: 20, spe: 45 },
    catchRate: 255, growth: 'mediumfast', baseXp: 39, body: 'serpent', spriteSeed: 1001,
    eggGroups: ['bug'], hatchCounter: 15,
    learnset: { 1: ['tackle', 'stringshot'] },
    flavor: 'Gentle and green. Its antennae taste the air for friends.',
  },
  weedle: {
    id: 'weedle', name: 'Weedle', dexNo: 13, types: ['bug', 'poison'],
    base: { hp: 40, atk: 35, def: 30, spa: 20, spd: 20, spe: 50 },
    catchRate: 255, growth: 'mediumfast', baseXp: 39, body: 'serpent', spriteSeed: 1301,
    eggGroups: ['bug'], hatchCounter: 15,
    learnset: { 1: ['poisonsting', 'stringshot'] },
    flavor: 'Mind the stinger. It only uses it when startled.',
  },
  spearow: {
    id: 'spearow', name: 'Spearow', dexNo: 21, types: ['normal', 'flying'],
    base: { hp: 40, atk: 60, def: 30, spa: 31, spd: 31, spe: 70 },
    catchRate: 255, growth: 'mediumfast', baseXp: 52, body: 'bird', spriteSeed: 2101,
    eggGroups: ['flying'], hatchCounter: 15,
    learnset: { 1: ['peck', 'growl'] },
    flavor: 'Territorial and loud. Best admired from a respectful distance.',
  },
  zubat: {
    id: 'zubat', name: 'Zubat', dexNo: 41, types: ['poison', 'flying'],
    base: { hp: 40, atk: 45, def: 35, spa: 30, spd: 40, spe: 55 },
    catchRate: 255, growth: 'mediumfast', baseXp: 49, body: 'bird', spriteSeed: 4101,
    eggGroups: ['flying'], hatchCounter: 15,
    learnset: { 1: ['leechlife', 'supersonic'] },
    flavor: 'Navigates by sound. Startles easily in dark tunnels.',
  },
  geodude: {
    id: 'geodude', name: 'Geodude', dexNo: 74, types: ['rock', 'ground'],
    base: { hp: 40, atk: 80, def: 100, spa: 30, spd: 30, spe: 20 },
    catchRate: 255, growth: 'mediumslow', baseXp: 60, body: 'blob', spriteSeed: 7401,
    eggGroups: ['mineral'], hatchCounter: 15,
    learnset: { 1: ['tackle', 'defensecurl'], 6: ['rockthrow'] },
    flavor: 'Arms of living stone. Often mistaken for an ordinary boulder.',
  },
  onix: {
    id: 'onix', name: 'Onix', dexNo: 95, types: ['rock', 'ground'],
    base: { hp: 35, atk: 45, def: 160, spa: 30, spd: 45, spe: 70 },
    catchRate: 45, growth: 'mediumfast', baseXp: 77, body: 'serpent', spriteSeed: 9501,
    eggGroups: ['mineral'], hatchCounter: 25,
    learnset: { 1: ['tackle', 'harden'], 8: ['rockthrow'] },
    flavor: 'A chain of boulders given will. The gym leader\u2019s ace.',
    evo: { to: 'steelix', method: 'trade' },
  },
  bulbasaur: {
    id: 'bulbasaur', name: 'Bulbasaur', dexNo: 1, types: ['grass', 'poison'],
    base: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
    catchRate: 45, growth: 'mediumslow', baseXp: 64, body: 'quad', spriteSeed: 101,
    eggGroups: ['monster', 'plant'], hatchCounter: 20,
    learnset: { 1: ['tackle', 'growl'], 5: ['vinewhip'] },
    flavor: 'A seed on its back drinks the morning sun.',
  },
  charmander: {
    id: 'charmander', name: 'Charmander', dexNo: 4, types: ['fire'],
    base: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
    catchRate: 45, growth: 'mediumslow', baseXp: 62, body: 'biped', spriteSeed: 401,
    eggGroups: ['monster', 'dragon'], hatchCounter: 20,
    learnset: { 1: ['scratch', 'growl'], 5: ['ember'] },
    flavor: 'Its tail flame mirrors its spirit — bright and stubborn.',
  },
  squirtle: {
    id: 'squirtle', name: 'Squirtle', dexNo: 7, types: ['water'],
    base: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 },
    catchRate: 45, growth: 'mediumslow', baseXp: 63, body: 'biped', spriteSeed: 701,
    eggGroups: ['monster', 'water1'], hatchCounter: 20,
    learnset: { 1: ['tackle', 'tailwhip'], 5: ['watergun'] },
    flavor: 'Withdraws into its shell, then answers with a jet of water.',
  },
  nidoranm: {
    id: 'nidoranm', name: 'Nidoran\u2642', dexNo: 32, types: ['poison'],
    base: { hp: 46, atk: 57, def: 40, spa: 40, spd: 40, spe: 50 },
    catchRate: 235, growth: 'mediumslow', baseXp: 55, body: 'quad', spriteSeed: 3201,
    eggGroups: ['monster', 'ground'], hatchCounter: 20,
    learnset: { 1: ['scratch', 'growl'] },
    flavor: 'Ears always up. Hears a trainer\u2019s step long before seeing one.',
  },
  mankey: {
    id: 'mankey', name: 'Mankey', dexNo: 56, types: ['fighting'],
    base: { hp: 40, atk: 80, def: 35, spa: 35, spd: 45, spe: 70 },
    catchRate: 190, growth: 'mediumfast', baseXp: 61, body: 'biped', spriteSeed: 5601,
    eggGroups: ['ground'], hatchCounter: 20,
    learnset: { 1: ['scratch', 'leer', 'lowkick'] },
    flavor: 'Angers fast, forgives faster — usually after a good battle.',
  },
};

export const SPECIES_LIST = Object.keys(SPECIES);

// Dex tracking: 1025 species tracked honestly; playable = slice roster.
// Undiscovered species render as "???" (gameux OQ recommendation).
export const DEX_TOTAL = 1025;

// Evolution completion (fidelity audit, ADR-019): the slice roster shipped
// without evolution data; the chains complete here at canonical levels.
const BASE_EVOS = {
  bulbasaur: { to: 'ivysaur', method: 'level', level: 16 },
  charmander: { to: 'charmeleon', method: 'level', level: 16 },
  squirtle: { to: 'wartortle', method: 'level', level: 16 },
  pidgey: { to: 'pidgeotto', method: 'level', level: 18 },
  rattata: { to: 'raticate', method: 'level', level: 20 },
  caterpie: { to: 'metapod', method: 'level', level: 7 },
  weedle: { to: 'kakuna', method: 'level', level: 7 },
  spearow: { to: 'fearow', method: 'level', level: 20 },
  zubat: { to: 'golbat', method: 'level', level: 22 },
  geodude: { to: 'graveler', method: 'level', level: 25 },
  mankey: { to: 'primeape', method: 'level', level: 28 },
  nidoranm: { to: 'nidorino', method: 'level', level: 16 },
};
for (const [id, evo] of Object.entries(BASE_EVOS)) {
  if (SPECIES[id] && !SPECIES[id].evo && !SPECIES[id].evos) SPECIES[id].evo = evo;
}
