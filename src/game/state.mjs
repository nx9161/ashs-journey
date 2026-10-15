// state.mjs — GameState: the runtime state IS the save shape (architecture §2.3).
// schemaVersion 1. Frontier-ready hooks from day one: badges.symbols (7 locked),
// dex.befriended (third dex state), facilities registry, story.flags open map.

import { xpForLevel } from '../engine/formulas.mjs';

export const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    v: SCHEMA_VERSION,
    player: { name: 'ASH', rivalName: 'GARY', trainerId: 0, playtimeSec: 0, money: 300 },
    party: [],
    boxes: {},
    dex: { caught: {}, seen: {}, befriended: {} }, // dexNo -> true
    badges: { kanto: [], orange: [], johto: [], symbols: [null, null, null, null, null, null, null] },
    story: {
      chapter: 0, beat: 0, flags: {},
      position: { map: 'pallet', x: 7, y: 7, dir: 'down' },
      difficulty: 'normal',
    },
    pikachu: { mood: 'happy', foundItemCooldown: 0 },
    settings: {
      textSpeed: 'normal', battleAnims: true, shake: true, reducedMotion: false,
      mute: false, musicVol: 0.8, sfxVol: 0.8, controlsFlip: false, keymap: null, hudScale: 1,
      vibration: true, autosave: true, showTouch: false, // P1/I5+I2: Wave-3 additions
    },
    facilities: { registry: [], unlocked: [] },
    bag: { pokeball: 10, potion: 3 },
    meta: { createdAt: 0, updatedAt: 0, playtimeSec: 0, location: 'Pallet Town' },
  };
}

// Battle-mon factory: {speciesId, nickname, level, xp, moves[{id,pp}], ivs, hp...}
export function makeMon(speciesId, level, speciesTable, movesTable) {
  const sp = speciesTable[speciesId];
  const mon = {
    speciesId,
    nickname: null,
    level,
    xp: xpForLevel(sp.growth, level),
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    status: null,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ot: 'ASH',
    friendship: 70,
  };
  const learned = [];
  for (const lv of Object.keys(sp.learnset).map(Number).sort((a, b) => a - b)) {
    if (lv <= level) learned.push(...sp.learnset[lv]);
  }
  for (const mid of learned.slice(-4)) {
    const mv = movesTable[mid];
    mon.moves.push({ id: mid, pp: mv.pp, maxPp: mv.pp });
  }
  mon.maxHp = hpValue(sp.base.hp, level);
  mon.hp = mon.maxHp;
  mon.stats = {
    atk: statValue(sp.base.atk, level),
    def: statValue(sp.base.def, level),
    spa: statValue(sp.base.spa, level),
    spd: statValue(sp.base.spd, level),
    spe: statValue(sp.base.spe, level),
  };
  return mon;
}

import { statValue, hpValue } from '../engine/formulas.mjs';

export function displayName(mon, speciesTable) {
  return mon.nickname || speciesTable[mon.speciesId].name;
}

// Dex helpers — honest tracked-vs-playable wording lives in the UI layer.
// Yellow hard rules for the partner (Ash's Pikachu): it refuses evolution and
// refuses the PC box. Guards for current + future systems (no evolution or
// deposit UI exists in the slice yet — these are the enforcement points they
// must call). Original refusal lines live in data/dialogue.mjs.
export function evolutionCheck(mon) {
  if (mon.speciesId === 'partner') {
    return { ok: false, line: 'PIKACHU turned away! It does not want to change — not ever.' };
  }
  return { ok: true };
}
export function boxCheck(mon) {
  if (mon.speciesId === 'partner') {
    return { ok: false, line: 'PIKACHU leapt right back out! It walks beside you, or not at all.' };
  }
  return { ok: true };
}
export function dexRegister(dex, kind, dexNo) {
  dex[kind][dexNo] = true;
  if (kind === 'caught' || kind === 'befriended') dex.seen[dexNo] = true;
}
export function dexCaughtCount(dex) { return Object.keys(dex.caught).length; }
