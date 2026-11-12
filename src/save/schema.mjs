// schema.mjs — save schema validation + migration (current: v2).
// Hand-rolled typed validator (LCR ruling §9.8). Whitelist, never blacklist.

import { SCHEMA_VERSION, normalizeHofList, TRAVELERS_MEMORY_GATES, STARTER_LINES, grantPartnerMon } from '../game/state.mjs';
import { SPECIES } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { KEEPSAKES, BADGE_SETS, BALLS } from '../data/items.mjs';
import { CONTEST_RIBBONS } from '../data/contest.mjs';
import { FACILITY_IDS, RECORD_FIELDS, PIKE_EVENT_KINDS, PYRAMID_FLOOR_MAPS } from '../data/frontier.mjs';
import { ITEMS } from '../data/items.mjs';
import { ARCS, deriveArcDefaults, levelCapFor, xpCeilingFor } from '../data/arcs.mjs';

const ARC_IDS = new Set(ARCS.map((a) => a.id));

export const SAVE_KEY = 'pdr.save.guest';

// Whitelisted top-level keys. Unknown keys => reject (architecture §3.4).
const TOP_KEYS = ['v', 'player', 'party', 'boxes', 'dex', 'badges', 'story',
  'pikachu', 'settings', 'facilities', 'bag', 'meta', 'currentBox', 'session',
  // Stage J6: the arc-systems fields (johto-systems.mjs) — the server
  // validator's TOP_KEYS carries the same six, the matched pair.
  'daycare', 'daycareEgg', 'daycareEggAt', 'stepsTotal', 'gather', 'kurtOrder',
  // Stage H5: the contest field (contest.mjs) — the server validator's
  // TOP_KEYS carries the same key, the matched pair.
  'contest',
  // Arc 3.5 Stage F2: the Frontier run state (game/frontier.mjs) —
  // the server validator's TOP_KEYS carries the same key, the pair.
  'frontier'];

function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

export function validateSave(data) {
  const errors = [];
  if (!isObj(data)) return { ok: false, errors: ['not-an-object'] };
  for (const k of Object.keys(data)) {
    if (!TOP_KEYS.includes(k)) errors.push('unknown-key:' + k);
  }
  if (data.v !== SCHEMA_VERSION) errors.push('bad-schema-version');
  if (!isObj(data.player) || typeof data.player.name !== 'string') errors.push('bad-player');
  if (!Array.isArray(data.party) || data.party.length > 6) errors.push('bad-party');
  // ADR-027 Amendment 2 (Stage J0): the level cap + XP ceiling are
  // registry reads off the save's own story.arc (levelCapFor /
  // xpCeilingFor — the exact derivation gen-tables emits for the
  // server validator, so the pair cannot drift). Min stays 1; an
  // absent/invalid arc reads as Kanto here and is rejected on its
  // own code below.
  const levelCap = levelCapFor(data);
  const xpCeiling = xpCeilingFor(data);
  for (const m of (data.party || [])) {
    if (!isObj(m) || typeof m.speciesId !== 'string' || typeof m.level !== 'number') { errors.push('bad-mon'); break; }
    if (m.level < 1 || m.level > levelCap) { errors.push('bad-mon-level'); break; }
    if (m.xp !== undefined && (typeof m.xp !== 'number' || !Number.isFinite(m.xp) || m.xp < 0 || m.xp > xpCeiling)) { errors.push('bad-xp'); break; }
    if (!Array.isArray(m.moves) || m.moves.length > 4) { errors.push('bad-mon-moves'); break; }
    // ADR-025 §3 (Phase 3): mon.keepsake is a keepsake itemId or null.
    // Rulings patch (2026-10-27): the id must come from the closed
    // keepsake set — this KEEPSAKES table is the single source of
    // truth (tools/api-scripts/gen-tables.mjs emits the server
    // validator's set from it), so client and cloud can never drift.
    if (m.keepsake !== undefined && m.keepsake !== null
      && (typeof m.keepsake !== 'string' || !KEEPSAKES[m.keepsake])) { errors.push('bad-mon-keepsake'); break; }
    // Stage J6: egg fields — egg is a boolean, eggSteps a bounded
    // non-negative integer (the server validator enforces the same).
    if (m.egg !== undefined && typeof m.egg !== 'boolean') { errors.push('bad-mon-egg'); break; }
    if (m.eggSteps !== undefined && (!Number.isInteger(m.eggSteps) || m.eggSteps < 0 || m.eggSteps > 100000)) { errors.push('bad-mon-egg-steps'); break; }
  }
  // Stage J6: Day-Care guests — at most 2 mon records, validated with
  // the same level/XP/move/egg rules as the party (the server runs
  // its full checkMon over them).
  if (data.daycare !== undefined) {
    if (!Array.isArray(data.daycare) || data.daycare.length > 2) errors.push('bad-daycare');
    else for (const m of data.daycare) {
      if (!isObj(m) || typeof m.speciesId !== 'string' || typeof m.level !== 'number') { errors.push('bad-daycare-mon'); break; }
      if (m.level < 1 || m.level > levelCap) { errors.push('bad-daycare-mon-level'); break; }
      if (m.xp !== undefined && (typeof m.xp !== 'number' || !Number.isFinite(m.xp) || m.xp < 0 || m.xp > xpCeiling)) { errors.push('bad-daycare-xp'); break; }
      if (!Array.isArray(m.moves) || m.moves.length > 4) { errors.push('bad-daycare-mon-moves'); break; }
      if (m.egg !== undefined && typeof m.egg !== 'boolean') { errors.push('bad-daycare-mon-egg'); break; }
      if (m.eggSteps !== undefined && (!Number.isInteger(m.eggSteps) || m.eggSteps < 0 || m.eggSteps > 100000)) { errors.push('bad-daycare-mon-egg-steps'); break; }
    }
  }
  if (data.daycareEgg !== undefined && data.daycareEgg !== null) {
    const e = data.daycareEgg;
    if (!isObj(e) || typeof e.speciesId !== 'string'
      || !Number.isInteger(e.eggSteps) || e.eggSteps < 0 || e.eggSteps > 100000) errors.push('bad-daycare-egg');
  }
  if (data.daycareEggAt !== undefined && data.daycareEggAt !== null
    && (!Number.isInteger(data.daycareEggAt) || data.daycareEggAt < 0 || data.daycareEggAt > 100000000)) errors.push('bad-daycare-egg-at');
  if (data.stepsTotal !== undefined
    && (!Number.isInteger(data.stepsTotal) || data.stepsTotal < 0 || data.stepsTotal > 100000000)) errors.push('bad-steps-total');
  if (data.gather !== undefined) {
    if (!isObj(data.gather)) errors.push('bad-gather');
    else {
      const keys = Object.keys(data.gather);
      if (keys.length > 64) errors.push('bad-gather-size');
      else for (const k of keys) {
        const v = data.gather[k];
        if (!/^[a-z0-9-]+:-?\d+,-?\d+$/.test(k) || !Number.isInteger(v) || v < 0 || v > 100000000) { errors.push('bad-gather-entry'); break; }
      }
    }
  }
  if (data.kurtOrder !== undefined && data.kurtOrder !== null) {
    const o = data.kurtOrder;
    if (!isObj(o) || typeof o.ball !== 'string' || !BALLS[o.ball]
      || !Number.isInteger(o.readyAt) || o.readyAt < 0 || o.readyAt > 100000000) errors.push('bad-kurt-order');
  }
  // Stage H5: contest.ribbons, when present, must be a duplicate-free
  // subset of the closed hall set (CONTEST_RIBBONS — the same source
  // gen-tables emits for the server validator, so the pair cannot
  // drift). Absent = pre-H5 save (filled to { ribbons: [] } on load).
  // Ribbons are UNORDERED (any hall can be won first) — no prefix rule,
  // unlike badges.
  if (data.contest !== undefined) {
    const c = data.contest;
    if (!isObj(c) || !Array.isArray(c.ribbons) || c.ribbons.length > CONTEST_RIBBONS.length
      || c.ribbons.some((id) => !CONTEST_RIBBONS.includes(id))
      || new Set(c.ribbons).size !== c.ribbons.length) errors.push('bad-contest-ribbons');
  }
  // Arc 3.5 Stage F2: state.frontier, when present — records are
  // per-facility bounded counters (RECORD_FIELDS is the closed field
  // list), the Pyramid bag holds medicine item ids only, and a run
  // is ONE facility's bounded payload (mid-run saves round-trip:
  // rentals are full mon records, the Dome bracket and the Pike
  // pre-roll are closed shapes). Absent = pre-F2 save (filled on
  // load). The server validator enforces the same shapes.
  if (data.frontier !== undefined) {
    const fr = data.frontier;
    if (!isObj(fr)) errors.push('bad-frontier');
    else {
      if (fr.records !== undefined) {
        if (!isObj(fr.records) || Object.keys(fr.records).some((k) => !FACILITY_IDS.includes(k))) errors.push('bad-frontier-records');
        else for (const id of Object.keys(fr.records)) {
          const rec = fr.records[id];
          if (!isObj(rec) || Object.keys(rec).some((k) => !RECORD_FIELDS[id].includes(k))
            || Object.values(rec).some((v) => !Number.isInteger(v) || v < 0 || v > 1000000)) { errors.push('bad-frontier-records'); break; }
        }
      }
      if (fr.pyramidBag !== undefined) {
        if (!Array.isArray(fr.pyramidBag) || fr.pyramidBag.length > 99
          || fr.pyramidBag.some((id) => typeof id !== 'string' || !ITEMS[id] || ITEMS[id].pocket !== 'medicine')) errors.push('bad-frontier-bag');
      }
      if (fr.run !== undefined && fr.run !== null) {
        const r = fr.run;
        let badRun = !isObj(r) || !FACILITY_IDS.includes(r.facility)
          || !Number.isInteger(r.foeLevel) || r.foeLevel < 1 || r.foeLevel > 9999
          || !Array.isArray(r.enteredTeam) || r.enteredTeam.length > 3
          || r.enteredTeam.some((x) => typeof x !== 'string' || x.length > 40)
          || (r.streak !== undefined && (!Number.isInteger(r.streak) || r.streak < 0 || r.streak > 100000));
        if (!badRun && r.rentals !== undefined && r.rentals !== null) {
          if (!Array.isArray(r.rentals) || r.rentals.length > 3) badRun = true;
          else for (const m of r.rentals) {
            if (!isObj(m) || typeof m.speciesId !== 'string' || typeof m.level !== 'number'
              || m.level < 1 || m.level > levelCap || !Array.isArray(m.moves) || m.moves.length > 4) { badRun = true; break; }
          }
        }
        if (!badRun && r.bracket !== undefined && r.bracket !== null) {
          const b = r.bracket;
          if (!isObj(b) || !Array.isArray(b.entrants) || b.entrants.length > 16
            || b.entrants.some((e) => !isObj(e) || typeof e.name !== 'string' || e.name.length > 40
              || !Array.isArray(e.species) || e.species.length > 3 || e.species.some((s) => typeof s !== 'string')
              || !Number.isInteger(e.power) || e.power < 0 || e.power > 10000000)
            || !Number.isInteger(b.round) || b.round < 0 || b.round > 3
            || !Array.isArray(b.alive) || b.alive.length > 16 || b.alive.some((x) => !Number.isInteger(x) || x < 0 || x > 15)
            || !Array.isArray(b.results) || b.results.length > 15) badRun = true;
        }
        if (!badRun && r.events !== undefined && r.events !== null) {
          if (!Array.isArray(r.events) || r.events.length !== 7
            || r.events.some((row) => !Array.isArray(row) || row.length !== 3 || row.some((c) => !PIKE_EVENT_KINDS.includes(c)))) badRun = true;
        }
        if (!badRun && r.spots !== undefined && r.spots !== null) {
          if (!Array.isArray(r.spots) || r.spots.length > 6
            || r.spots.some((s) => !isObj(s) || !PYRAMID_FLOOR_MAPS.includes(s.map)
              || !Number.isInteger(s.x) || s.x < 0 || s.x > 40 || !Number.isInteger(s.y) || s.y < 0 || s.y > 40
              || !['item', 'trainer'].includes(s.kind)
              || (s.item !== undefined && (typeof s.item !== 'string' || !ITEMS[s.item])))) badRun = true;
        }
        if (badRun) errors.push('bad-frontier-run');
      }
    }
  }
  if (!isObj(data.dex)) errors.push('bad-dex');
  if (isObj(data.dex) && data.dex.forms !== undefined) {
    if (!isObj(data.dex.forms)) errors.push('bad-dex-forms');
    else for (const k of Object.keys(data.dex.forms)) {
      if (data.dex.forms[k] !== true) { errors.push('bad-dex-form-value'); break; }
    }
  }
  if (!isObj(data.badges) || !Array.isArray(data.badges.kanto)) errors.push('bad-badges');
  // Stage O2: badges.orange, when present, must be a PREFIX of the
  // Orange earn order (BADGE_SETS) — the same rule the server
  // validator enforces; absent = legacy save (filled to [] on load).
  if (isObj(data.badges) && data.badges.orange !== undefined) {
    const o = data.badges.orange;
    const seq = BADGE_SETS.orange;
    if (!Array.isArray(o) || o.length > seq.length || o.some((id, i) => id !== seq[i])) errors.push('bad-badges-orange');
  }
  // Stage J4a: badges.johto, when present, must be a PREFIX of the
  // Johto earn order (BADGE_SETS) — the same rule, the same source.
  if (isObj(data.badges) && data.badges.johto !== undefined) {
    const j = data.badges.johto;
    const seq = BADGE_SETS.johto;
    if (!Array.isArray(j) || !seq || j.length > seq.length || j.some((id, i) => id !== seq[i])) errors.push('bad-badges-johto');
  }
  // Stage H4a: badges.hoenn, when present, must be a PREFIX of the
  // Hoenn earn order (BADGE_SETS) — the same rule, the same source.
  if (isObj(data.badges) && data.badges.hoenn !== undefined) {
    const h = data.badges.hoenn;
    const seq = BADGE_SETS.hoenn;
    if (!Array.isArray(h) || !seq || h.length > seq.length || h.some((id, i) => id !== seq[i])) errors.push('bad-badges-hoenn');
  }
  // Arc 4 Stage S0: badges.sinnoh, when present, must be a PREFIX of
  // the Sinnoh earn order (BADGE_SETS) — the same rule, the same source.
  if (isObj(data.badges) && data.badges.sinnoh !== undefined) {
    const sn = data.badges.sinnoh;
    const seq = BADGE_SETS.sinnoh;
    if (!Array.isArray(sn) || !seq || sn.length > seq.length || sn.some((id, i) => id !== seq[i])) errors.push('bad-badges-sinnoh');
  }
  // Stage F0: badges.symbols, when present, must be an array of
  // exactly 7 slots (slot i = facility BADGE_SETS.symbols[i]), each
  // null | 'silver' | 'gold' — the server validator enforces the same
  // tiers as 'bad-symbols'. Symbols are UNORDERED (any facility first),
  // so there is NO prefix rule here, unlike the badge sets above.
  if (isObj(data.badges) && data.badges.symbols !== undefined) {
    const sym = data.badges.symbols;
    if (!Array.isArray(sym) || sym.length !== 7
      || sym.some((s) => !(s === null || s === 'silver' || s === 'gold'))) errors.push('bad-badges-symbols');
  }
  if (!isObj(data.story) || !isObj(data.story.position)) errors.push('bad-story');
  if (isObj(data.story) && data.story.quests !== undefined) {
    if (!isObj(data.story.quests)) errors.push('bad-story-quests');
    else for (const k of Object.keys(data.story.quests)) {
      // ADR-025 §7 (Phase 4 widening): quest values are 'active' |
      // stage number (integer 0..99) | 'complete'. The legendary arcs'
      // pre-existing 'discovered' string stage stays legal (their
      // machinery writes it; behavior is unchanged).
      const v = data.story.quests[k];
      const okV = v === 'active' || v === 'complete' || v === 'discovered'
        || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 99);
      if (!okV) { errors.push('bad-quest-stage'); break; }
    }
  }
  if (isObj(data.story) && data.story.bonds !== undefined) {
    // ADR-025 §7: story.bonds — npcId -> hidden integer in -10..+10.
    if (!isObj(data.story.bonds)) errors.push('bad-story-bonds');
    else for (const k of Object.keys(data.story.bonds)) {
      const v = data.story.bonds[k];
      if (typeof v !== 'number' || !Number.isInteger(v) || v < -10 || v > 10) { errors.push('bad-bond-value'); break; }
    }
  }
  // ADR-025 §6 (Phase 6): Hall of Fame lists — ONE canonical shape
  // ({ team: [{speciesId, level, nickname}], badges }); the legacy
  // { species, level } entry stays acceptable here and is normalized
  // on load (fillV2Defaults), never rejected.
  for (const key of ['hof', 'priorHof']) {
    const list = isObj(data.story) ? data.story[key] : undefined;
    if (list === undefined) continue;
    if (!Array.isArray(list) || list.length > 40) { errors.push('bad-story-' + key); continue; }
    for (const e of list) {
      const canon = isObj(e) && Array.isArray(e.team) && e.team.length >= 1 && e.team.length <= 6
        && e.team.every((m) => isObj(m) && typeof m.speciesId === 'string'
          && typeof m.level === 'number' && m.level >= 1 && m.level <= levelCap)
        && (e.badges === undefined || (typeof e.badges === 'number' && e.badges >= 0))
        && (e.master === undefined || typeof e.master === 'boolean');
      const legacy = isObj(e) && typeof e.species === 'string'
        && typeof e.level === 'number' && e.level >= 1 && e.level <= levelCap;
      if (!canon && !legacy) { errors.push('bad-story-' + key + '-entry'); break; }
    }
  }
  if (isObj(data.story)) {
    // ADR-027 (Stage F): the arc chain fields — closed vocabulary (the
    // ARCS registry ids), bounded counters. Absent = pre-foundation
    // save (fillV2Defaults derives them); present-but-wrong = reject.
    if (data.story.arc !== undefined && !ARC_IDS.has(data.story.arc)) errors.push('bad-story-arc');
    if (data.story.arc_directive !== undefined && data.story.arc_directive !== null
      && !ARC_IDS.has(data.story.arc_directive)) errors.push('bad-story-arc-directive');
    if (data.story.arcDexStart !== undefined
      && (!Number.isInteger(data.story.arcDexStart) || data.story.arcDexStart < 0 || data.story.arcDexStart > 1025)) errors.push('bad-story-arc-dex-start');
    if (data.story.arcStartPlaytime !== undefined
      && (typeof data.story.arcStartPlaytime !== 'number' || !Number.isFinite(data.story.arcStartPlaytime) || data.story.arcStartPlaytime < 0)) errors.push('bad-story-arc-start-playtime');
    // Phase 6 carried-knowledge lists: closed vocabularies.
    if (data.story.bondEcho !== undefined
      && (!Array.isArray(data.story.bondEcho) || data.story.bondEcho.length > 32
        || data.story.bondEcho.some((x) => typeof x !== 'string' || !/^[a-z0-9_]{1,40}$/.test(x)))) errors.push('bad-story-bond-echo');
    if (data.story.travelersMemory !== undefined
      && (!Array.isArray(data.story.travelersMemory)
        || data.story.travelersMemory.some((x) => !TRAVELERS_MEMORY_GATES.includes(x)))) errors.push('bad-story-travelers-memory');
    if (data.story.starterLines !== undefined
      && (!Array.isArray(data.story.starterLines)
        || data.story.starterLines.some((x) => !Object.prototype.hasOwnProperty.call(STARTER_LINES, x)))) errors.push('bad-story-starter-lines');
  }
  if (isObj(data.dex) && data.dex.runCaught !== undefined) {
    // Phase 6: the run's own catch record (Second Journey runs only).
    if (!isObj(data.dex.runCaught)) errors.push('bad-dex-run-caught');
    else for (const k of Object.keys(data.dex.runCaught)) {
      if (data.dex.runCaught[k] !== true) { errors.push('bad-dex-run-caught-value'); break; }
    }
  }
  if (data.currentBox !== undefined && typeof data.currentBox !== 'string') errors.push('bad-current-box');
  return { ok: errors.length === 0, errors };
}

// Migration chain. v0 never shipped publicly; stub kept for the chain.
// v1 -> v2 (ADR-025 Phase 1): difficulty modes renamed to the decided set
// ('easy'->'story', 'normal'->'classic', 'hard'->'challenge'; the shipped
// client only ever wrote 'normal'), settings.houseRules + the meta fields
// land with defaults. Defaults are also filled on any v2 load (§7: old
// saves open clean), so partial saves can never reach the game half-shaped.
const DIFFICULTY_V1_TO_V2 = { easy: 'story', normal: 'classic', hard: 'challenge' };
const HOUSE_RULE_KEYS = ['steadyDamage', 'mercifulFoes', 'fastLearner', 'generousWorld', 'candyCoach', 'skipIntro'];

export function fillV2Defaults(data) {
  // Stage O2: badges.orange defaults-fill — a legacy save with no
  // Orange set opens with badges.orange = [] and loses nothing (the
  // other sets pass through untouched when present and well-shaped).
  if (isObj(data.badges)) {
    // Wave E (s6 triage): the KANTO set fills only when ABSENT. The old
    // any-non-array repair silently rewrote a present-but-malformed
    // kanto (a string) to [] BEFORE validateSave ran, making its strict
    // 'bad-badges' reject dead code — a corrupted save loaded as valid.
    // Kanto is the v0-core set validateSave requires unconditionally;
    // every historical save carries it as an array, so a non-array
    // kanto is corruption and the validator's reject now reaches it.
    // The regional sets keep their stage-documented fill semantics
    // (absent or malformed -> []; content policed by the prefix
    // validators) — pinned by sinnoh-checks A07.
    if (!Array.isArray(data.badges.orange)) data.badges.orange = [];
    if (data.badges.kanto === undefined) data.badges.kanto = [];
    if (!Array.isArray(data.badges.johto)) data.badges.johto = [];
    if (!Array.isArray(data.badges.hoenn)) data.badges.hoenn = [];
    if (!Array.isArray(data.badges.sinnoh)) data.badges.sinnoh = [];
    // Stage F0: the symbols fill PRESERVES earned tiers and repairs
    // only the shape — a non-array becomes all-null, a wrong length
    // pads/truncates with nulls, an invalid entry becomes null. A
    // legitimately earned 'silver'/'gold' slot is NEVER rewritten
    // (validateSave stays strict for saves carrying their own tiers).
    {
      const rawSym = Array.isArray(data.badges.symbols) ? data.badges.symbols : [];
      data.badges.symbols = Array.from({ length: 7 }, (_, i) => (rawSym[i] === 'silver' || rawSym[i] === 'gold' ? rawSym[i] : null));
    }
  }
  // ADR-025 §3 (Phase 3): mon.keepsake joins the v2 shape — defaults-filled
  // on load (party + boxes), so v1 saves and pre-Phase-3 v2 saves open
  // clean with keepsake=null on every mon.
  // A keepsake value outside the closed set (non-string, or a string
  // that is not a keepsake id) coerces to null on load — the same
  // closed-shape rebuild the houseRules block below performs — so a
  // tampered or legacy value opens clean; validateSave stays strict.
  const fillMon = (m) => { if (isObj(m) && (typeof m.keepsake !== 'string' || !KEEPSAKES[m.keepsake])) m.keepsake = null; };
  if (Array.isArray(data.party)) for (const m of data.party) fillMon(m);
  if (isObj(data.boxes)) for (const arr of Object.values(data.boxes)) {
    if (Array.isArray(arr)) for (const m of arr) fillMon(m);
  }
  // Stage J6: arc-systems fields defaults-fill / rebuild into their
  // closed shapes (a legacy save opens with an empty Day-Care, a zero
  // step counter, no tree rests and no Kurt order; validateSave stays
  // strict for saves that carry malformed values of their own).
  if (!Array.isArray(data.daycare)) data.daycare = [];
  data.daycare = data.daycare.slice(0, 2);
  for (const m of data.daycare) fillMon(m);
  if (!isObj(data.daycareEgg) || typeof data.daycareEgg.speciesId !== 'string'
    || !Number.isInteger(data.daycareEgg.eggSteps)) data.daycareEgg = null;
  if (data.daycareEgg) data.daycareEgg = { speciesId: data.daycareEgg.speciesId, eggSteps: Math.max(0, Math.min(100000, data.daycareEgg.eggSteps)) };
  if (!Number.isInteger(data.daycareEggAt) || data.daycareEggAt < 0) data.daycareEggAt = null;
  if (!Number.isInteger(data.stepsTotal) || data.stepsTotal < 0) data.stepsTotal = 0;
  const gather = {};
  if (isObj(data.gather)) {
    for (const k of Object.keys(data.gather)) {
      const v = data.gather[k];
      if (/^[a-z0-9-]+:-?\d+,-?\d+$/.test(k) && Number.isInteger(v) && v >= 0) gather[k] = v;
    }
  }
  data.gather = gather;
  if (!isObj(data.kurtOrder) || typeof data.kurtOrder.ball !== 'string' || !BALLS[data.kurtOrder.ball]
    || !Number.isInteger(data.kurtOrder.readyAt) || data.kurtOrder.readyAt < 0) data.kurtOrder = null;
  if (data.kurtOrder) data.kurtOrder = { ball: data.kurtOrder.ball, readyAt: data.kurtOrder.readyAt };
  // Stage H5: contest defaults-fill — a pre-H5 save opens with an
  // empty ribbon case; a present value rebuilds into the closed shape
  // (known hall ids only, duplicates dropped), so validateSave stays
  // strict for saves that carry malformed values of their own.
  {
    const ribbons = [];
    if (isObj(data.contest) && Array.isArray(data.contest.ribbons)) {
      for (const id of data.contest.ribbons) {
        if (CONTEST_RIBBONS.includes(id) && !ribbons.includes(id)) ribbons.push(id);
      }
    }
    data.contest = { ribbons };
  }
  // Arc 3.5 Stage F2: Frontier defaults-fill — a pre-F2 save opens
  // with empty records, no run and an empty Pyramid bag; a present
  // value rebuilds into the closed shapes (known facilities/fields
  // only, counters clamped, a malformed run drops to null rather
  // than stranding the save), so validateSave stays strict for
  // saves that carry malformed values of their own.
  {
    const raw = isObj(data.frontier) ? data.frontier : {};
    const records = {};
    for (const id of FACILITY_IDS) {
      const src = isObj(raw.records) && isObj(raw.records[id]) ? raw.records[id] : {};
      records[id] = {};
      for (const f of RECORD_FIELDS[id]) {
        records[id][f] = Number.isInteger(src[f]) && src[f] >= 0 ? Math.min(1000000, src[f]) : 0;
      }
    }
    const pyramidBag = Array.isArray(raw.pyramidBag)
      ? raw.pyramidBag.filter((id) => typeof id === 'string' && ITEMS[id] && ITEMS[id].pocket === 'medicine').slice(0, 99) : [];
    let run = null;
    const r = raw.run;
    if (isObj(r) && FACILITY_IDS.includes(r.facility)
      && Number.isInteger(r.foeLevel) && r.foeLevel >= 1 && r.foeLevel <= 9999
      && Array.isArray(r.enteredTeam) && r.enteredTeam.every((x) => typeof x === 'string')) {
      const intOr = (v, d, max) => (Number.isInteger(v) && v >= 0 && v <= (max || 1000000) ? v : d);
      run = {
        facility: r.facility,
        foeLevel: r.foeLevel,
        enteredTeam: r.enteredTeam.slice(0, 3),
        streak: intOr(r.streak, 0, 100000),
        rentals: Array.isArray(r.rentals) ? r.rentals.slice(0, 3) : null,
        bracket: isObj(r.bracket) && Array.isArray(r.bracket.entrants) && Array.isArray(r.bracket.alive) && Array.isArray(r.bracket.results)
          ? { entrants: r.bracket.entrants.slice(0, 16), round: intOr(r.bracket.round, 0, 3), alive: r.bracket.alive.slice(0, 16), results: r.bracket.results.slice(0, 15) } : null,
        tournamentNo: intOr(r.tournamentNo, 0, 100000),
        events: Array.isArray(r.events) && r.events.length === 7 && r.events.every((row) => Array.isArray(row) && row.length === 3 && row.every((c) => PIKE_EVENT_KINDS.includes(c)))
          ? r.events.map((row) => [...row]) : null,
        rooms: intOr(r.rooms, 0, 100000),
        lastChamber: intOr(r.lastChamber, 0, 7),
        banked: r.banked === true,
        floor: Number.isInteger(r.floor) && r.floor >= 1 && r.floor <= 7 ? r.floor : 1,
        runNo: intOr(r.runNo, 0, 100000),
        spots: Array.isArray(r.spots) ? r.spots.filter((s) => isObj(s) && PYRAMID_FLOOR_MAPS.includes(s.map)
          && Number.isInteger(s.x) && Number.isInteger(s.y) && ['item', 'trainer'].includes(s.kind)).slice(0, 6) : [],
        spotsFloor: typeof r.spotsFloor === 'string' ? r.spotsFloor : null,
        lucyFaced: r.lucyFaced === true,
        brandonFaced: r.brandonFaced === true,
      };
      if (Array.isArray(run.rentals)) for (const m of run.rentals) fillMon(m);
    }
    data.frontier = { records, run, pyramidBag };
  }
  if (isObj(data.story)) {
    if (!['story', 'classic', 'challenge'].includes(data.story.difficulty)) {
      data.story.difficulty = DIFFICULTY_V1_TO_V2[data.story.difficulty] || 'classic';
    }
    // ADR-025 §7: story.bonds defaults-filled on load (v1 saves and
    // pre-Phase-4 v2 saves open clean); values are rebuilt into the
    // closed shape — integer scores clamped to the §2 range.
    if (!isObj(data.story.bonds)) data.story.bonds = {};
    const bonds = {};
    for (const k of Object.keys(data.story.bonds)) {
      const v = data.story.bonds[k];
      if (typeof v === 'number' && Number.isFinite(v)) bonds[k] = Math.max(-10, Math.min(10, Math.trunc(v)));
    }
    data.story.bonds = bonds;
    // P1 (2026-10-28): story.lastCenter — the persisted door-front
    // anchor of the last Center entered (the Center exit resolver
    // falls back to it after a reload inside a Center). Sanitized to
    // its closed shape on load; dropped when malformed (the exit
    // then falls back to Pallet until the next Center visit).
    if (data.story.lastCenter !== undefined) {
      const lc = data.story.lastCenter;
      if (isObj(lc) && typeof lc.map === 'string' && /^[a-z0-9-]{1,40}$/.test(lc.map) && Number.isFinite(lc.x) && Number.isFinite(lc.y)) {
        data.story.lastCenter = { map: lc.map, x: Math.trunc(lc.x), y: Math.trunc(lc.y) };
      } else delete data.story.lastCenter;
    }
    // ADR-025 §6 (Phase 6): HoF lists normalize to the ONE canonical
    // shape on load — legacy { species, level } entries (the shape the
    // server validator was written against) and the pushed
    // { team, badges } shape both land canonical; junk entries drop.
    // Stage J0: the normalizer clamps at THIS save's arc band cap
    // (levelCapFor on the save being loaded), so a Johto HoF team's
    // levels survive load instead of being rewritten to 100.
    data.story.hof = normalizeHofList(data.story.hof, levelCapFor(data));
    data.story.priorHof = normalizeHofList(data.story.priorHof, levelCapFor(data));
    // Carried-knowledge lists rebuild into their closed vocabularies.
    data.story.bondEcho = Array.isArray(data.story.bondEcho)
      ? [...new Set(data.story.bondEcho.filter((x) => typeof x === 'string' && /^[a-z0-9_]{1,40}$/.test(x)))].slice(0, 32) : [];
    data.story.travelersMemory = Array.isArray(data.story.travelersMemory)
      ? [...new Set(data.story.travelersMemory.filter((x) => TRAVELERS_MEMORY_GATES.includes(x)))] : [];
    data.story.starterLines = Array.isArray(data.story.starterLines)
      ? [...new Set(data.story.starterLines.filter((x) => Object.prototype.hasOwnProperty.call(STARTER_LINES, x)))] : [];
    // ADR-027 (Stage F): arc chain fields derive on load — a legacy
    // save (no arc fields at all) opens with its arc state inferred
    // from regionsDone / HoF / the champion flag, nothing else touched.
    const caughtCount = isObj(data.dex) && isObj(data.dex.caught) ? Object.keys(data.dex.caught).length : 0;
    const playtimeSec = isObj(data.player) && typeof data.player.playtimeSec === 'number' ? data.player.playtimeSec : 0;
    deriveArcDefaults(data.story, caughtCount, playtimeSec);
  }
  if (isObj(data.dex)) {
    // Phase 6: dex.runCaught is NEVER invented here — its presence is
    // the Second Journey discriminator (ownCaughtMap). A present but
    // malformed map rebuilds to its true-only entries.
    if (data.dex.runCaught !== undefined) {
      const rc = {};
      if (isObj(data.dex.runCaught)) {
        for (const k of Object.keys(data.dex.runCaught)) if (data.dex.runCaught[k] === true) rc[k] = true;
      }
      data.dex.runCaught = rc;
    }
  }
  if (isObj(data.settings)) {
    // ADR-026 (2026-10-28): battle model defaults-fill. A STORED
    // battleStyle is the player's own choice and is NEVER rewritten —
    // only a missing/invalid value lands on the current default
    // ('classic'). switchMode did not exist before ADR-026, so every
    // existing save lands on the ruled default 'set' the same way.
    if (!['rt', 'classic'].includes(data.settings.battleStyle)) data.settings.battleStyle = 'classic';
    if (!['set', 'shift'].includes(data.settings.switchMode)) data.settings.switchMode = 'set';
    if (!isObj(data.settings.houseRules)) data.settings.houseRules = {};
    // Rebuild with exactly the known keys (QA hygiene note): unknown keys
    // are dropped here so the client shape always matches the server
    // validator's closed set.
    const hr = {};
    for (const k of HOUSE_RULE_KEYS) hr[k] = data.settings.houseRules[k] === true;
    data.settings.houseRules = hr;
  }
  if (isObj(data.meta)) {
    if (typeof data.meta.houseRulesTouched !== 'boolean') data.meta.houseRulesTouched = false;
    if (!Number.isInteger(data.meta.ngPlus) || data.meta.ngPlus < 0) data.meta.ngPlus = 0;
  }
  // Partner guarantee (hotfix): UI v2.2 defect 4's stranded saves. The
  // pre-fix intro's skip paths could write introDone with an EMPTY
  // party — no partner, no ally at all — and nothing ever healed them:
  // the overworld professor had no handover and the first wild battle
  // soft-locked. The intro's own backstop covers new games; this is
  // the load-side twin, riding migrate() so every load door that
  // validates through here (the guest store, SYNC.validPayload) heals
  // the save itself. The test is deliberately narrow — intro done AND
  // a party holding no member at all: a party carrying ANY member is
  // a progressed save and is never touched (the grant is a repair,
  // not a handout), and grantPartnerMon's own guard keeps it
  // idempotent. Runs last: the mon fills above have already run, and
  // makeMon writes the current shape (keepsake included), so the
  // granted partner needs no second pass before validateSave.
  if (isObj(data.story) && isObj(data.story.flags) && data.story.flags.introDone === true
    && isObj(data.dex) && Array.isArray(data.party) && !data.party.some(Boolean)) {
    grantPartnerMon(data, SPECIES, MOVES);
  }
  return data;
}

export function migrate(data) {
  if (!isObj(data)) return null;
  if (data.v === 0) {
    data.v = 1;
    data.facilities = data.facilities || { registry: [], unlocked: [] };
    data.badges = data.badges || { kanto: [], orange: [], johto: [], hoenn: [], sinnoh: [], symbols: [null, null, null, null, null, null, null] };
  }
  if (data.v === 1) {
    data.v = 2;
    fillV2Defaults(data);
  } else if (data.v === 2) {
    fillV2Defaults(data);
  }
  return data;
}

export function saveSizeBytes(data) {
  try { return new Blob([JSON.stringify(data)]).size; }
  catch (e) { return JSON.stringify(data).length; }
}
