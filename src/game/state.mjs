// state.mjs — GameState: the runtime state IS the save shape (architecture §2.3).
// schemaVersion 2 (Rejuvenation Phase 1, ADR-025): difficulty modes wired
// (story.difficulty in {'story','classic','challenge'}), settings.houseRules,
// meta.houseRulesTouched + meta.ngPlus. Frontier-ready hooks from day one:
// badges.symbols (7 locked), dex.befriended (third dex state), facilities
// registry, story.flags open map.

import { xpForLevel } from '../engine/formulas.mjs';
import { KEEPSAKES } from '../data/items.mjs';
import { freshFrontierState } from '../data/frontier.mjs';
import { levelCapFor } from '../data/arcs.mjs';

export const SCHEMA_VERSION = 2;

// ---------- ADR-025 §6 (Phase 6): Second Journey helpers ----------
// The canonical Hall of Fame entry shape — ONE shape across runEnding
// (the writer), the client schema, the server validator, and the HoF
// viewer: { team: [{ speciesId, level, nickname }], badges }. Legacy
// entries shaped { species, level } (the shape the server validator
// was written against before the viewer shipped) normalize into it.
export function normalizeHofEntry(e, cap) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  // Stage J0: the clamp ceiling is the owning save's arc band cap,
  // passed by the save-flow callers (schema fillV2Defaults reads it
  // via levelCapFor on the save being loaded; Second Journey
  // inheritance reads it off the source save). A bare call with no
  // save context keeps the historical Arden ceiling of 100 — the
  // only callers of that form count entries, never levels.
  const ceil = typeof cap === 'number' && cap > 0 ? cap : 100;
  const lvl = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.min(ceil, Math.trunc(v))) : 1);
  if (Array.isArray(e.team)) {
    const team = [];
    for (const m of e.team) {
      if (!m || typeof m !== 'object') continue;
      const speciesId = typeof m.speciesId === 'string' ? m.speciesId : (typeof m.species === 'string' ? m.species : null);
      if (!speciesId) continue;
      team.push({ speciesId, level: lvl(m.level), nickname: typeof m.nickname === 'string' ? m.nickname : null });
    }
    if (!team.length) return null;
    const badges = typeof e.badges === 'number' && Number.isFinite(e.badges) ? Math.max(0, Math.trunc(e.badges)) : 0;
    // Arc 4 Stage S7: the Master entry (the finale's whole-road
    // record) carries master: true through the round-trip — the one
    // sanctioned extra field on the canonical shape.
    return e.master === true ? { team, badges, master: true } : { team, badges };
  }
  if (typeof e.species === 'string' && e.species) {
    return { team: [{ speciesId: e.species, level: lvl(e.level), nickname: null }], badges: 0 };
  }
  return null;
}
export function normalizeHofList(list, cap) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const e of list) { const n = normalizeHofEntry(e, cap); if (n) out.push(n); }
  return out;
}
// Completion detection (§6): a run has completed Arden when ITS OWN
// Hall of Fame holds an entry, or its regionsDone names Arden.
// Inherited priorHof entries NEVER satisfy this — they live apart.
export function isCompletedRun(save) {
  if (!save || typeof save !== 'object' || !save.story) return false;
  if (normalizeHofList(save.story.hof).length > 0) return true;
  return Array.isArray(save.story.regionsDone) && save.story.regionsDone.includes('kanto');
}
// The run's OWN catches. In a Second Journey run the dex itself is the
// carried ARCHIVE (records), so dexRegister also writes dex.runCaught
// and honors (diploma, HoF ribbon semantics) read THIS map. The map
// exists only on Second Journey runs — its presence is the
// discriminator; every other run's archive IS its own record, so the
// helper falls back to dex.caught there.
export function ownCaughtMap(dex) {
  if (dex && typeof dex.runCaught === 'object' && dex.runCaught !== null && !Array.isArray(dex.runCaught)) return dex.runCaught;
  return (dex && dex.caught) || {};
}
// The keepsake collection a save owns: bag pocket + held pieces.
export function keepsakeCollectionOf(save) {
  if (!save || typeof save !== 'object') return [];
  const out = [];
  for (const id of Object.keys(KEEPSAKES)) {
    const inBag = !!(save.bag && (save.bag[id] || 0) > 0);
    const held = [...(Array.isArray(save.party) ? save.party : []),
      ...Object.values(save.boxes || {}).flat()]
      .some((m) => m && m.keepsake === id);
    if (inBag || held) out.push(id);
  }
  return out;
}
// Bond echo (§6): the characters who were Close (>= +7) in the source.
export function bondEchoFromSave(save) {
  const bonds = (save && save.story && save.story.bonds) || {};
  return Object.keys(bonds).filter((id) => typeof bonds[id] === 'number' && bonds[id] >= 7);
}
// Traveler's Memory (§6): the one-time friction gates, derived from
// the SOURCE save's own shipped evidence — its story flags, its badge
// case, its bag. (The shipped game records these exact names:
// silph_done / fossil_taken are story flags set by the campaign;
// reached_saffron is written by sysLoadMap on entering Farsight.)
export const TRAVELERS_MEMORY_GATES = ['saffron-guard', 'coin-case', 'card-key', 'fossil-choice'];
export function travelersMemoryFromSave(save) {
  if (!save || typeof save !== 'object') return [];
  const flags = (save.story && save.story.flags) || {};
  const bag = save.bag || {};
  const badges = (save.badges && save.badges.kanto) || [];
  const out = [];
  if (flags.silph_done === true || flags.reached_saffron === true || badges.includes('marshbadge')) out.push('saffron-guard');
  if ((bag.coincase || 0) > 0 || (bag.coin || 0) > 0) out.push('coin-case');
  if (flags.silph_done === true || (bag.cardkey || 0) > 0) out.push('card-key');
  if (flags.fossil_taken === true) out.push('fossil-choice');
  return out;
}
export function hasTravelersMemory(state, gate) {
  return !!(state && state.story && Array.isArray(state.story.travelersMemory)
    && state.story.travelersMemory.includes(gate));
}
// REGION-1 FIX WAVE (Bug 4): the current row of a regional quest
// chain — the first incomplete row AFTER the last completed one, not
// the first incomplete row overall. A skipped step (its flag never
// set while later rows completed) must not pin the objective HUD or
// the Quest Log's active marker forever: when a later row's flag
// stands, the player is demonstrably beyond the skipped row. In-order
// play is unchanged — flags set in order make both readings agree.
// Shared by the HUD (overworld-systems sysObjective) and the Quest
// Log (main-systems) so the two surfaces can never disagree again.
export function currentQuestOf(chain, flags) {
  let lastDone = -1;
  chain.forEach((qq, i) => { if (qq.flag && flags[qq.flag]) lastDone = i; });
  for (let i = lastDone + 1; i < chain.length; i++) { if (chain[i].flag) return chain[i]; }
  return null;
}
// Starter breadth (§6): the Arden starter lines, by base species. A
// line counts as "chosen in the source run" when the shipped game
// recorded it joining that run: the gift-event flags
// (bulbasaur_joined / charmander_joined / squirtle_joined), a line
// member in the party/boxes, or a line member in the dex's caught
// records (dex numbers 1-9 are exactly these three lines).
export const STARTER_LINES = {
  bulbasaur: ['bulbasaur', 'ivysaur', 'venusaur'],
  charmander: ['charmander', 'charmeleon', 'charizard'],
  squirtle: ['squirtle', 'wartortle', 'blastoise'],
};
const STARTER_DEXNO = { bulbasaur: [1, 2, 3], charmander: [4, 5, 6], squirtle: [7, 8, 9] };
export function starterLinesFromSave(save) {
  if (!save || typeof save !== 'object') return [];
  const flags = (save.story && save.story.flags) || {};
  const mons = [...(Array.isArray(save.party) ? save.party : []),
    ...Object.values(save.boxes || {}).flat()];
  const caught = (save.dex && save.dex.caught) || {};
  const out = [];
  for (const base of Object.keys(STARTER_LINES)) {
    const line = STARTER_LINES[base];
    if (flags[base + '_joined'] === true
      || mons.some((m) => m && line.includes(m.speciesId))
      || STARTER_DEXNO[base].some((n) => caught[n] === true || caught[String(n)] === true)) out.push(base);
  }
  return out;
}

export function defaultState(inherit) {
  const st = {
    v: SCHEMA_VERSION,
    player: { name: 'KIAN', rivalName: 'VALE', trainerId: 0, playtimeSec: 0, money: 300 },
    party: [],
    boxes: {},
    dex: { caught: {}, seen: {}, befriended: {} }, // dexNo -> true
    badges: { kanto: [], orange: [], johto: [], hoenn: [], sinnoh: [], symbols: [null, null, null, null, null, null, null] },
    story: {
      chapter: 0, beat: 0, flags: {},
      // WS6/WS10 story state: quest-log stages + region progression
      // (ADR-019). quests: questId -> 'active' | stage number | 'complete'
      // (arc ids keep their string stages; Town Tales, ADR-025 §5, widen
      // the value set per §7).
      quests: {},
      // ADR-025 §2/§7: bond scores, npcId -> hidden integer -10..+10.
      // Phase 4 records the Town Tale sources (structural only); the
      // tiers, dialogue variants and consumers are Phase 5.
      bonds: {},
      // Wave ACT (Actor Lifecycle): placement/visibility overrides,
      // charId -> { map, x, y, face?, hidden?, template? } — where a
      // character CURRENTLY stands when the story has moved them off
      // their authored post (game/actors.mjs). Empty = everyone home.
      actors: {},
      // ADR-025 §6 (Phase 6): Second Journey fields, all defaults-filled
      // on load (schema v2 stays). hof holds THIS run's own entries
      // only; priorHof keeps earlier runs' teams viewable without ever
      // satisfying this run's completion. bondEcho / travelersMemory /
      // starterLines are the carried knowledge of a Second Journey run
      // (empty on a first run).
      hof: [],
      priorHof: [],
      bondEcho: [],
      travelersMemory: [],
      starterLines: [],
      region: 'kanto',
      regionsDone: [],
      // ADR-027 (Stage F foundation): the arc chain state. arc = the
      // current arc's registry id (src/data/arcs.mjs); arc_directive =
      // the pinned "go home" directive's target arc id (null = none);
      // arcDexStart / arcStartPlaytime snapshot the dex count and the
      // playtime clock when the current arc began (the ARC COMPLETE
      // card's per-arc gains read them). All defaults-filled on load
      // (schema.mjs deriveArcDefaults) so legacy saves open unchanged.
      arc: 'kanto',
      arc_directive: null,
      arcDexStart: 0,
      arcStartPlaytime: 0,
      position: { map: 'pallet', x: 9, y: 10, dir: 'down' },
      // ADR-025 §4: the run's difficulty mode. 'classic' = the game exactly
      // as shipped; levers live in game/rules.mjs (threat-side only).
      difficulty: 'classic',
    },
    currentBox: 'box1',
    // Stage J6 arc systems (src/game/johto-systems.mjs): Day-Care
    // guests (mon records, max 2), the waiting egg + its ready step,
    // the PERSISTED walked-step counter, apricorn-tree rest times,
    // and Kurt's one crafting order. All defaults-filled on load
    // (schema.mjs) so legacy saves open unchanged in shape.
    daycare: [],
    daycareEgg: null,
    daycareEggAt: null,
    stepsTotal: 0,
    gather: {},
    kurtOrder: null,
    // Stage H5: Contest-lite ribbons (game/contest.mjs) — the closed
    // hall-id set the player has won (src/data/contest.mjs
    // CONTEST_RIBBONS). Defaults-filled on load (schema.mjs) so
    // pre-H5 saves open unchanged in shape.
    contest: { ribbons: [] },
    // Arc 3.5 Stage F2: Trial Grounds run state (game/frontier.mjs)
    // — per-facility records, ONE active run across all facilities,
    // and the Pyramid run bag. The J6 treatment: defaultState here +
    // client schema (validate-if-present + fill) + server validator
    // + gen-tables (the facility id list is emitted from
    // BADGE_SETS.symbols). Mid-run saves must round-trip.
    frontier: freshFrontierState(),
    session: { learnQueue: [] }, // post-battle move-learning prompts (not persisted server-side)
    pikachu: { mood: 'happy', foundItemCooldown: 0 },
    settings: {
      textSpeed: 'normal', battleAnims: true, shake: true, reducedMotion: false,
      mute: false, musicVol: 0.8, sfxVol: 0.8, controlsFlip: false, keymap: null, hudScale: 1, controlsOpacity: 1,
      vibration: true, autosave: true, showTouch: false, // P1/I5+I2: Wave-3 additions
      battleStyle: 'classic', // ADR-026 (owner ruling 2026-10-28): 'classic' turn-based is THE main battle (default) | 'rt' real-time (optional legacy mode, ADR-020)
      switchMode: 'set', // ADR-026: 'set' (default — no switch prompt on a foe KO) | 'shift' (genre prompt before the next foe is sent out; classic engine only)
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
      createdAt: 0, updatedAt: 0, playtimeSec: 0, location: 'Dawnwick',
      houseRulesTouched: false, // ADR-025: true once any House Rule is enabled
      ngPlus: 0, // ADR-025 §6: Second Journey counter (Phase 6 consumes it)
    },
  };
  // ---- Second Journey inheritance (§6) ----
  // Fed ONLY a completed source save (isCompletedRun); anything else
  // is ignored whole, so a normal New Game can never inherit by
  // accident. The source object is READ, never written. Carries are
  // exactly the §6 list — knowledge and relief from repetition, never
  // power: no levels, party, boxes, money, badges, story progress, or
  // items beyond the keepsake collection cross over.
  if (inherit && isCompletedRun(inherit)) {
    const src = inherit;
    const trueOnly = (obj) => {
      const out = {};
      if (obj && typeof obj === 'object') for (const k of Object.keys(obj)) if (obj[k] === true) out[k] = true;
      return out;
    };
    // 1. Dex records: the archive carries; honors read runCaught.
    st.dex.caught = trueOnly(src.dex && src.dex.caught);
    st.dex.seen = trueOnly(src.dex && src.dex.seen);
    st.dex.befriended = trueOnly(src.dex && src.dex.befriended);
    if (src.dex && typeof src.dex.forms === 'object' && src.dex.forms !== null) st.dex.forms = trueOnly(src.dex.forms);
    st.dex.runCaught = {};
    // 2. Keepsake collection: the pieces, in the pocket, from the start.
    for (const id of keepsakeCollectionOf(src)) st.bag[id] = 1;
    // 3. Prior runs' HoF teams stay viewable (this run's hof stays empty).
    // Stage J0: clamped at the SOURCE save's band cap, not a fixed 100.
    st.story.priorHof = [...normalizeHofList(src.story && src.story.hof, levelCapFor(src)),
      ...normalizeHofList(src.story && src.story.priorHof, levelCapFor(src))];
    // 4. Traveler's Memory (door-keeping only). The coin case is the
    // one gate whose "pre-solved" state is a handover: it is in the
    // new run's bag from the start when the source had earned it.
    st.story.travelersMemory = travelersMemoryFromSave(src);
    if (st.story.travelersMemory.includes('coin-case')) st.bag.coincase = (st.bag.coincase || 0) + 1;
    // 5. Starter breadth + 6. Bond echo: presentation/dialogue only.
    st.story.starterLines = starterLinesFromSave(src);
    st.story.bondEcho = bondEchoFromSave(src);
    // 7. Meta: the counter climbs by one per Second Journey.
    const prev = src.meta && Number.isInteger(src.meta.ngPlus) && src.meta.ngPlus > 0 ? src.meta.ngPlus : 0;
    st.meta.ngPlus = prev + 1;
  }
  return st;
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
    ot: 'KIAN',
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
// Yellow hard rules for the partner (Ash's VOLTIK): it refuses evolution and
// refuses the PC box. Guards for current + future systems (no evolution or
// deposit UI exists in the slice yet — these are the enforcement points they
// must call). Original refusal lines live in data/dialogue.mjs.
export function evolutionCheck(mon) {
  if (mon.speciesId === 'partner') {
    return { ok: false, line: 'VOLTIK turned away! It does not want to change — not ever.' };
  }
  return { ok: true };
}
export function boxCheck(mon) {
  if (mon.speciesId === 'partner') {
    return { ok: false, line: 'VOLTIK leapt right back out! It walks beside you, or not at all.' };
  }
  return { ok: true };
}
// The partner guarantee: the state change behind intro.mjs's
// grantPartner ceremony, shared by every door that can deliver VOLTIK
// — the intro itself, the save-load repair (save/schema.mjs) and the
// Pallet lab handover (overworld-systems.mjs talkHawthorn). Party
// member + dex seen/caught + the metPartner/refusedBall flags, exactly
// as the intro has always written them. Idempotent by construction: a
// state already carrying the partner is returned untouched (false).
export function hasPartnerMon(state) {
  return !!(state && Array.isArray(state.party)
    && state.party.some((m) => m && m.speciesId === 'partner'));
}
export function grantPartnerMon(state, speciesTable, movesTable) {
  if (!state || !Array.isArray(state.party) || hasPartnerMon(state)) return false;
  state.party.push(makeMon('partner', 5, speciesTable, movesTable));
  const sp = speciesTable.partner;
  dexRegister(state.dex, 'seen', sp.dexNo);
  dexRegister(state.dex, 'caught', sp.dexNo);
  state.story.flags.metPartner = true;
  state.story.flags.refusedBall = true;
  return true;
}
export function dexRegister(dex, kind, dexNo) {
  dex[kind][dexNo] = true;
  if (kind === 'caught' || kind === 'befriended') dex.seen[dexNo] = true;
  // ADR-025 §6: on a Second Journey run (runCaught present), a catch in
  // THIS run also lands in the run's own record — the set honors read.
  if ((kind === 'caught' || kind === 'befriended')
    && typeof dex.runCaught === 'object' && dex.runCaught !== null && !Array.isArray(dex.runCaught)) {
    dex.runCaught[dexNo] = true;
  }
}
export function dexCaughtCount(dex) { return Object.keys(dex.caught).length; }
