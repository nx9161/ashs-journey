// state.mjs — GameState: the runtime state IS the save shape (architecture §2.3).
// schemaVersion 2 (Rejuvenation Phase 1, ADR-025): difficulty modes wired
// (story.difficulty in {'story','classic','challenge'}), settings.houseRules,
// meta.houseRulesTouched + meta.ngPlus. Frontier-ready hooks from day one:
// badges.symbols (7 locked), dex.befriended (third dex state), facilities
// registry, story.flags open map.

import { xpForLevel } from '../engine/formulas.mjs';

export const SCHEMA_VERSION = 2;

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
      // WS6/WS10 story state: quest-log stages + region progression
      // (ADR-019). quests: questId -> 'active' | 'complete' (arc ids included).
      quests: {},
      region: 'kanto',
      regionsDone: [],
      position: { map: 'pallet', x: 7, y: 7, dir: 'down' },
      // ADR-025 §4: the run's difficulty mode. 'classic' = the game exactly
      // as shipped; levers live in game/rules.mjs (threat-side only).
      difficulty: 'classic',
    },
    currentBox: 'box1',
    session: { learnQueue: [] }, // post-battle move-learning prompts (not persisted server-side)
    pikachu: { mood: 'happy', foundItemCooldown: 0 },
    settings: {
      textSpeed: 'normal', battleAnims: true, shake: true, reducedMotion: false,
      mute: false, musicVol: 0.8, sfxVol: 0.8, controlsFlip: false, keymap: null, hudScale: 1,
      vibration: true, autosave: true, showTouch: false, // P1/I5+I2: Wave-3 additions
      battleStyle: 'rt', // ADR-020: 'rt' real-time (default) | 'classic' turn-based
      // ADR-025 §4 House Rules: player-side modifier toggles, all default
      // OFF. Enabling any of them (ever) sets meta.houseRulesTouched and
      // costs the save its "Pure Run" ribbon — nothing else.
      houseRules: {
        steadyDamage: false, mercifulFoes: false, fastLearner: false,
        generousWorld: false, candyCoach: false, skipIntro: false,
      },
    },
    facilities: { registry: [], unlocked: [] },
    bag: { pokeball: 10, potion: 3 },
    meta: {
      createdAt: 0, updatedAt: 0, playtimeSec: 0, location: 'Pallet Town',
      houseRulesTouched: false, // ADR-025: true once any House Rule is enabled
      ngPlus: 0, // ADR-025 §6: Second Journey counter (Phase 6 consumes it)
    },
  };
}

// Battle-mon factory: {speciesId, nickname, level, xp, moves[{id,pp}], ivs, hp...}
let MON_SEQ = 0;
export function makeMon(speciesId, level, speciesTable, movesTable) {
  const sp = speciesTable[speciesId];
  const mon = {
    monId: 'm' + (++MON_SEQ).toString(36) + Date.now().toString(36).slice(-4),
    speciesId,
    nickname: null,
    level,
    xp: xpForLevel(sp.growth, level),
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    moves: [],
    keepsake: null, // ADR-025 §3 (Phase 3): held Keepsake itemId | null
    status: null,
    stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ot: 'ASH',
    friendship: 70,
  };
  const learned = [];
  // Canonical learnset shape: { level: [moveId...] }. species2.mjs delivers
  // [{ level, move }...] — accept both (normalized identically here).
  if (Array.isArray(sp.learnset)) {
    for (const e of [...sp.learnset].sort((a, b) => a.level - b.level)) {
      if (e.level <= level) learned.push(e.move);
    }
  } else {
    for (const lv of Object.keys(sp.learnset).map(Number).sort((a, b) => a - b)) {
      if (lv <= level) learned.push(...sp.learnset[lv]);
    }
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
