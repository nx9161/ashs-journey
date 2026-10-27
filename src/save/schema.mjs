// schema.mjs — save schema validation + migration (current: v2).
// Hand-rolled typed validator (LCR ruling §9.8). Whitelist, never blacklist.

import { SCHEMA_VERSION } from '../game/state.mjs';
import { KEEPSAKES } from '../data/items.mjs';

export const SAVE_KEY = 'pdr.save.guest';

// Whitelisted top-level keys. Unknown keys => reject (architecture §3.4).
const TOP_KEYS = ['v', 'player', 'party', 'boxes', 'dex', 'badges', 'story',
  'pikachu', 'settings', 'facilities', 'bag', 'meta', 'currentBox', 'session'];

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
  for (const m of (data.party || [])) {
    if (!isObj(m) || typeof m.speciesId !== 'string' || typeof m.level !== 'number') { errors.push('bad-mon'); break; }
    if (m.level < 1 || m.level > 100) { errors.push('bad-mon-level'); break; }
    if (!Array.isArray(m.moves) || m.moves.length > 4) { errors.push('bad-mon-moves'); break; }
    // ADR-025 §3 (Phase 3): mon.keepsake is a keepsake itemId or null.
    // Rulings patch (2026-10-27): the id must come from the closed
    // keepsake set — this KEEPSAKES table is the single source of
    // truth (tools/api-scripts/gen-tables.mjs emits the server
    // validator's set from it), so client and cloud can never drift.
    if (m.keepsake !== undefined && m.keepsake !== null
      && (typeof m.keepsake !== 'string' || !KEEPSAKES[m.keepsake])) { errors.push('bad-mon-keepsake'); break; }
  }
  if (!isObj(data.dex)) errors.push('bad-dex');
  if (isObj(data.dex) && data.dex.forms !== undefined) {
    if (!isObj(data.dex.forms)) errors.push('bad-dex-forms');
    else for (const k of Object.keys(data.dex.forms)) {
      if (data.dex.forms[k] !== true) { errors.push('bad-dex-form-value'); break; }
    }
  }
  if (!isObj(data.badges) || !Array.isArray(data.badges.kanto)) errors.push('bad-badges');
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
  }
  if (isObj(data.settings)) {
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
  return data;
}

export function migrate(data) {
  if (!isObj(data)) return null;
  if (data.v === 0) {
    data.v = 1;
    data.facilities = data.facilities || { registry: [], unlocked: [] };
    data.badges = data.badges || { kanto: [], orange: [], johto: [], symbols: [null, null, null, null, null, null, null] };
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
