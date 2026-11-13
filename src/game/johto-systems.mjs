// johto-systems.mjs — Stage J6 arc systems: breeding/eggs at the
// Route 34 Day-Care, apricorn trees, and Kurt's ball crafting. PURE
// logic over the save-shaped state (the overworld layer wires menus
// and dialogue onto these functions; the suites prove them here).
//
// Persisted state (Stage J6 fields — every one has a matched pair in
// src/save/schema.mjs (client) and api/_lib/validator.mjs (server),
// and save-contract cases in tools/api-scripts/save-contract.test.mjs):
//   state.daycare      [] of mon records (max 2) — deposited guests.
//   state.daycareEgg   null | { speciesId, eggSteps } — an egg ready
//                      and waiting at the Day-Care (one at a time).
//   state.daycareEggAt null | step total at which the waiting egg
//                      becomes ready (set when a compatible pair is
//                      deposited; the egg materializes on that step).
//   state.stepsTotal   integer, the PERSISTED walked-step counter
//                      (the shipped game counted steps only per
//                      session — Safari/poison — so J6 adds this).
//   state.gather       {} treeId -> stepsTotal at which the tree is
//                      pickable again (apricorn tree rest).
//   state.kurtOrder    null | { ball, readyAt } — Kurt's one order.
// Mon-record additions (same matched pair): mon.egg (boolean) and
// mon.eggSteps (integer steps remaining) on party/box/daycare mons.
//
// Calibrations (recorded, Stage J6 register):
//   EGG_STEP_UNIT = 25 steps per PokeAPI hatchCounter unit — a
//     typical hatchCounter-20 egg hatches in 500 steps, a baby-pool
//     egg (counter 10) in 250: a walk, not a marathon.
//   EGG_PRODUCTION_STEPS = 200 walked steps with a compatible pair
//     deposited before their egg is ready.
//   APRICORN_REGROW_STEPS = 200 steps of rest per picked tree.
//   KURT_CRAFT_STEPS = 250 steps per crafted ball (the mission's
//     number; readiness is computed from stepsTotal, honestly).

import { SPECIES } from '../data/species.mjs';
import { SPECIES2 } from '../data/species2.mjs';
import { SPECIES_JOHTO } from '../data/species3.mjs';
import { MOVES } from '../data/moves.mjs';
import { MOVES2 } from '../data/moves2.mjs';
import { ITEMS } from '../data/items.mjs';
import { makeMon, dexRegister, boxCheck } from './state.mjs';
import { currentArcOf } from '../data/arcs.mjs';

// Full tables (the bundle's merge.mjs folds these into the base
// tables at runtime; building the unions here keeps this module
// correct when imported standalone, e.g. by the suites).
const SPECIES_ALL = Object.assign({}, SPECIES, SPECIES2, SPECIES_JOHTO);
const MOVES_ALL = Object.assign({}, MOVES, MOVES2);

export const EGG_STEP_UNIT = 25;
export const EGG_PRODUCTION_STEPS = 200;
export const APRICORN_REGROW_STEPS = 200;
export const KURT_CRAFT_STEPS = 250;
export const DAYCARE_CAP = 2;
export const STORY_EGG_POOL = ['pichu', 'cleffa', 'igglybuff', 'togepi', 'magby', 'elekid', 'smoochum', 'tyrogue'];
export const APRICORN_IDS = ['redpodnut', 'bluepodnut', 'yellowpodnut', 'greenpodnut', 'pinkpodnut', 'whitepodnut', 'blackpodnut'];
export const APRICORN_TO_BALL = {
  redapricorn: 'levelball', blueapricorn: 'lureball', yellowapricorn: 'moonball',
  greenapricorn: 'friendball', pinkapricorn: 'loveball', whiteapricorn: 'fastball',
  blackapricorn: 'heavyball',
};

// ---------- APRICORN_TREES ----------
// Every `apricorn` prop tile across maps6 (the J3a tile kind), scanned
// from the shipped map rows (register, Stage J6): Cinder's grove, the
// Route 33 + Route 37 roadside trees, and Kurt's own two house trees.
// Colours cycle red/blue/yellow/green/pink/white/black over the sorted
// table so every colour grows in both halves of Yamato.
const APRICORN_TILE_SPOTS = [
  ['azalea', 19, 1], ['azalea', 20, 1], ['azalea', 25, 3], ['azalea', 2, 4], ['azalea', 4, 6],
  ['azalea', 20, 7], ['azalea', 2, 10], ['azalea', 17, 10], ['azalea', 13, 15], ['azalea', 22, 16],
  ['kurt-house', 9, 1], ['kurt-house', 11, 2],
  ['r33', 15, 2], ['r33', 19, 2], ['r33', 22, 2], ['r33', 13, 6], ['r33', 3, 13], ['r33', 22, 14],
  ['r37', 18, 5], ['r37', 20, 12],
];
export const APRICORN_TREES = APRICORN_TILE_SPOTS.map(([map, x, y], i) => ({
  id: map + ':' + x + ',' + y, map, x, y, item: APRICORN_IDS[i % APRICORN_IDS.length],
}));
export function apricornTreeAt(map, x, y) {
  return APRICORN_TREES.find((t) => t.map === map && t.x === x && t.y === y) || null;
}

// ---------- state shape ----------
export function ensureJohtoSystems(state) {
  if (!Array.isArray(state.daycare)) state.daycare = [];
  if (state.daycareEgg !== null && !(state.daycareEgg && typeof state.daycareEgg === 'object')) state.daycareEgg = null;
  if (state.daycareEggAt !== null && !(Number.isInteger(state.daycareEggAt) && state.daycareEggAt >= 0)) state.daycareEggAt = null;
  if (!Number.isInteger(state.stepsTotal) || state.stepsTotal < 0) state.stepsTotal = 0;
  if (!state.gather || typeof state.gather !== 'object' || Array.isArray(state.gather)) state.gather = {};
  if (state.kurtOrder !== null && !(state.kurtOrder && typeof state.kurtOrder === 'object')) state.kurtOrder = null;
  return state;
}

// ---------- breeding rules ----------
// The engine has NO gender system: compatibility is egg-GROUP only
// (recorded simplification). A species never produces when it is a
// baby, carries the no-eggs group (which is also where every
// legendary/mythical in dex 1-251 sits in the PokeAPI facts — data-
// proven at J6), is a form, or has no egg data at all.
export function speciesBreedable(speciesId) {
  const sp = SPECIES_ALL[speciesId];
  if (!sp || sp.form || sp.baby) return false;
  const groups = sp.eggGroups;
  if (!Array.isArray(groups) || !groups.length) return false;
  if (groups.includes('no-eggs')) return false;
  return true;
}
export function isDittoMon(mon) {
  const sp = mon && SPECIES_ALL[mon.speciesId];
  return !!(sp && Array.isArray(sp.eggGroups) && sp.eggGroups.includes('ditto'));
}
export function pairCompatible(a, b) {
  if (!a || !b || a.egg || b.egg) return false;
  if (!speciesBreedable(a.speciesId) || !speciesBreedable(b.speciesId)) {
    // MIMIBLOB exception: a MIMIBLOB pairs with any breedable partner.
    if (isDittoMon(a) && speciesBreedable(b.speciesId)) return true;
    if (isDittoMon(b) && speciesBreedable(a.speciesId)) return true;
    return false;
  }
  if (isDittoMon(a) || isDittoMon(b)) return true;
  const ga = SPECIES_ALL[a.speciesId].eggGroups, gb = SPECIES_ALL[b.speciesId].eggGroups;
  return ga.some((g) => gb.includes(g));
}
// The base stage of a species' line, walking the evo graph backwards
// (branch-aware: any predecessor counts; the first found by dex order
// is taken — lines in this data are linear up to the base).
export function baseStageOf(speciesId) {
  let cur = speciesId, guard = 0;
  while (guard++ < 12) {
    let prev = null;
    for (const sp of Object.values(SPECIES_ALL)) {
      if (sp.form) continue;
      const evos = sp.evos || (sp.evo ? [sp.evo] : []);
      if (evos.some((e) => e && e.to === cur)) { if (!prev || sp.dexNo < SPECIES_ALL[prev].dexNo) prev = sp.id; }
    }
    if (!prev) return cur;
    cur = prev;
  }
  return cur;
}
// Offspring rule (recorded simplification): the non-MIMIBLOB parent when
// one parent is MIMIBLOB, else the FIRST-deposited parent; the offspring
// is that parent's line's base stage. Arc 4 Stage S6 widening (data,
// not a species name in code): a species entry may declare its own
// egg species (`eggSpecies`) when its eggs hatch a DIFFERENT species
// than its base stage — the CLIONARCH -> CLIONEA canon, which the
// base-stage walk cannot express (CLIONEA is CLIONARCH's offspring, not
// its ancestor; the S1 assumption that egg-group data alone sufficed
// was measured wrong at S6 — a CLIONARCH egg hatched CLIONARCH). The
// declared field is the smallest data-driven correction.
export function offspringOf(daycare) {
  if (!Array.isArray(daycare) || daycare.length < 2) return null;
  const [a, b] = daycare;
  const parent = isDittoMon(a) && !isDittoMon(b) ? b : (isDittoMon(b) && !isDittoMon(a) ? a : a);
  const declared = SPECIES_ALL[parent.speciesId] && SPECIES_ALL[parent.speciesId].eggSpecies;
  if (declared && SPECIES_ALL[declared]) return declared;
  return baseStageOf(parent.speciesId);
}
export function eggStepsFor(speciesId) {
  const sp = SPECIES_ALL[speciesId];
  const counter = sp && Number.isInteger(sp.hatchCounter) ? sp.hatchCounter : 20;
  return counter * EGG_STEP_UNIT;
}
export function makeEggMon(speciesId) {
  const mon = makeMon(speciesId, 1, SPECIES_ALL, MOVES_ALL);
  mon.egg = true;
  mon.eggSteps = eggStepsFor(speciesId);
  return mon;
}

// ---------- delivery (the cap-safe gift idiom) ----------
// Party if it has room, else the first PC box with room; all-full
// refusal mutates NOTHING (space is verified before any write).
export function deliverMonCapSafe(state, mon) {
  if (state.party.length < 6) { state.party.push(mon); return { ok: true, dest: 'party' }; }
  for (let i = 1; i <= 12; i++) {
    const id = 'box' + i;
    const arr = state.boxes[id];
    if (!arr || arr.length < 30) {
      (state.boxes[id] || (state.boxes[id] = [])).push(mon);
      return { ok: true, dest: 'box', boxId: id };
    }
  }
  return { ok: false, reason: 'all-full' };
}
export function deliverEggCapSafe(state, speciesId) {
  // Build nothing until room is proven (an egg mon is cheap, but the
  // refusal contract is byte-identical state, dex included).
  const hasRoom = state.party.length < 6
    || Array.from({ length: 12 }, (_, i) => state.boxes['box' + (i + 1)]).some((a) => !a || a.length < 30);
  if (!hasRoom) return { ok: false, reason: 'all-full' };
  const mon = makeEggMon(speciesId);
  const res = deliverMonCapSafe(state, mon);
  return { ...res, mon };
}

// ---------- Day-Care deposit / withdraw ----------
// The all-egg guard (the engine's "can't deposit your last mon"
// precedent, sharpened): a move that would leave the party holding
// ONLY eggs (or nothing) is refused — a party of eggs can neither
// battle nor hatch its way out.
export function partyHasNonEgg(state) {
  return state.party.some((m) => m && !m.egg);
}
export function depositToDaycare(state, partyIdx) {
  ensureJohtoSystems(state);
  const mon = state.party[partyIdx];
  if (!mon) return { ok: false, reason: 'no-mon' };
  if (state.daycare.length >= DAYCARE_CAP) return { ok: false, reason: 'daycare-full' };
  if (mon.egg) return { ok: false, reason: 'is-egg' };
  const chk = boxCheck(mon);
  if (!chk.ok) return { ok: false, reason: 'partner', line: chk.line };
  const remaining = state.party.filter((_, i) => i !== partyIdx);
  if (!remaining.some((m) => m && !m.egg)) return { ok: false, reason: 'last-non-egg' };
  state.party.splice(partyIdx, 1);
  mon.status = null;
  state.daycare.push(mon);
  rescheduleEgg(state);
  return { ok: true, mon };
}
export function withdrawFromDaycare(state, daycareIdx) {
  ensureJohtoSystems(state);
  const mon = state.daycare[daycareIdx];
  if (!mon) return { ok: false, reason: 'no-mon' };
  if (state.party.length >= 6) return { ok: false, reason: 'party-full' };
  state.daycare.splice(daycareIdx, 1);
  state.party.push(mon);
  rescheduleEgg(state);
  return { ok: true, mon };
}
// (Re)arm the production schedule after any deposit/withdraw: a
// compatible pair with no egg waiting and none scheduled starts the
// 200-step clock; anything else clears a pending schedule (a waiting
// egg, once ready, is never taken away).
export function rescheduleEgg(state) {
  ensureJohtoSystems(state);
  if (state.daycareEgg) { state.daycareEggAt = null; return; }
  if (state.daycare.length === 2 && pairCompatible(state.daycare[0], state.daycare[1])) {
    if (state.daycareEggAt === null) state.daycareEggAt = state.stepsTotal + EGG_PRODUCTION_STEPS;
  } else state.daycareEggAt = null;
}
// Collect the waiting egg (cap-safe; a refusal leaves it waiting).
export function collectDaycareEgg(state) {
  ensureJohtoSystems(state);
  if (!state.daycareEgg) return { ok: false, reason: 'no-egg' };
  const res = deliverEggCapSafe(state, state.daycareEgg.speciesId);
  if (!res.ok) return res;
  state.daycareEgg = null;
  rescheduleEgg(state); // the pair may produce again
  return res;
}
// The story egg (one-time; the caller's flag owns the once-ness):
// a random baby species from the fixed pool, cap-safe delivered.
export function giveStoryEgg(state, rng) {
  const pick = STORY_EGG_POOL[Math.floor((rng ? rng() : Math.random()) * STORY_EGG_POOL.length) % STORY_EGG_POOL.length];
  return { ...deliverEggCapSafe(state, pick), speciesId: pick };
}

// ---------- per-step tick ----------
// Called once per walked step by the overworld (sysOnStep). Returns
// the events that fired so the caller can stage their scenes:
//   { hatched: [mon...], eggReady: bool }
export function johtoStepTick(state) {
  ensureJohtoSystems(state);
  state.stepsTotal++;
  const out = { hatched: [], eggReady: false };
  // Egg production materializes on its scheduled step.
  if (state.daycareEggAt !== null && !state.daycareEgg && state.stepsTotal >= state.daycareEggAt) {
    const sp = state.daycare.length === 2 ? offspringOf(state.daycare) : null;
    if (sp) {
      state.daycareEgg = { speciesId: sp, eggSteps: eggStepsFor(sp) };
      state.daycareEggAt = null;
      out.eggReady = true;
    } else state.daycareEggAt = null;
  }
  // Party eggs count down; at zero the egg hatches at the CURRENT
  // arc's band floor (registry read: band.min; open-level arcs fall
  // back to 1).
  for (const mon of state.party) {
    if (!mon || !mon.egg) continue;
    mon.eggSteps = Math.max(0, (mon.eggSteps || 0) - 1);
    if (mon.eggSteps > 0) continue;
    hatchMon(state, mon);
    out.hatched.push(mon);
  }
  return out;
}
export function hatchMon(state, mon) {
  const arc = currentArcOf(state);
  const floor = arc && arc.band ? arc.band.min : 1;
  const fresh = makeMon(mon.speciesId, floor, SPECIES_ALL, MOVES_ALL);
  mon.level = fresh.level; mon.xp = fresh.xp; mon.moves = fresh.moves;
  mon.maxHp = fresh.maxHp; mon.hp = fresh.maxHp; mon.stats = fresh.stats;
  mon.status = null;
  delete mon.egg; delete mon.eggSteps;
  dexRegister(state.dex, 'caught', SPECIES_ALL[mon.speciesId].dexNo);
  return mon;
}

// ---------- Link Transfer widening (Part D) ----------
// The candidate scan reads the single `evo` AND every `evos` branch
// entry with method 'trade' — poliwhirl->politoed and slowpoke->
// slowking keep their primary branches in `evo`, so a scan of `evo`
// alone could never see their trade branches.
export function tradeEvolutionsOf(speciesId) {
  const sp = SPECIES_ALL[speciesId];
  if (!sp) return [];
  const all = [...(sp.evo ? [sp.evo] : []), ...(Array.isArray(sp.evos) ? sp.evos : [])];
  const out = [];
  for (const e of all) {
    if (e && e.method === 'trade' && !out.some((o) => o.to === e.to)) out.push(e);
  }
  return out;
}

// ---------- apricorn trees ----------
export function treeReadyAt(state, tree) {
  ensureJohtoSystems(state);
  const v = state.gather[tree.id];
  return Number.isInteger(v) ? v : 0;
}
export function pickApricorn(state, tree) {
  ensureJohtoSystems(state);
  const readyAt = treeReadyAt(state, tree);
  if (state.stepsTotal < readyAt) return { ok: false, reason: 'resting', remaining: readyAt - state.stepsTotal };
  state.bag[tree.item] = (state.bag[tree.item] || 0) + 1;
  state.gather[tree.id] = state.stepsTotal + APRICORN_REGROW_STEPS;
  return { ok: true, item: tree.item };
}

// ---------- Kurt's crafting ----------
export function kurtOrderStatus(state) {
  ensureJohtoSystems(state);
  const o = state.kurtOrder;
  if (!o) return { busy: false, ready: false, remaining: 0 };
  const remaining = Math.max(0, o.readyAt - state.stepsTotal);
  return { busy: true, ready: remaining <= 0, remaining, ball: o.ball };
}
export function kurtPlaceOrder(state, apricornId) {
  ensureJohtoSystems(state);
  const ball = APRICORN_TO_BALL[apricornId];
  if (!ball || !ITEMS[apricornId]) return { ok: false, reason: 'not-podnut' };
  if (state.kurtOrder) return { ok: false, reason: 'busy' };
  if ((state.bag[apricornId] || 0) <= 0) return { ok: false, reason: 'none-owned' };
  state.bag[apricornId]--;
  if (state.bag[apricornId] <= 0) delete state.bag[apricornId];
  state.kurtOrder = { ball, readyAt: state.stepsTotal + KURT_CRAFT_STEPS };
  return { ok: true, ball, readyAt: state.kurtOrder.readyAt };
}
export function kurtCollect(state) {
  ensureJohtoSystems(state);
  const st = kurtOrderStatus(state);
  if (!st.busy) return { ok: false, reason: 'no-order' };
  if (!st.ready) return { ok: false, reason: 'not-ready', remaining: st.remaining };
  const ball = state.kurtOrder.ball;
  state.bag[ball] = (state.bag[ball] || 0) + 1;
  state.kurtOrder = null;
  return { ok: true, ball };
}
