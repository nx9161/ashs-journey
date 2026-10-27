// validator.mjs — hand-rolled, zero-dependency typed validator for save payloads.
// (Lead Code Reviewer §9.8 ruling: hand-rolled REQUIRED, Zod REJECTED.)
//
// Security properties:
// - Whitelist top-level keys; unknown keys => reject.
// - Explicit __proto__/constructor/prototype key rejection at every level
//   (prototype-pollution defense, Pen T7a). All internal accumulation uses
//   null-prototype objects; attacker objects are never merged or spread.
// - Strict type checks (typeof / Number.isInteger / Array.isArray). JSON has no
//   int/float distinction: "99", 99.5, {"0":…} are all rejected (Pen T7b).
// - Traversal depth capped (MAX_DEPTH); the route enforces the 64 KB body gate
//   (413) before JSON.parse, plus a pre-parse bracket-depth scan (Pen T7c).
// - Species/move/item ids must exist in the build's emitted tables
//   (api/lib/data/tables.json); tablesVersion is asserted at startup, fail closed.
// - State-transition checks: badge earn-order prefix per region, v1 symbol slots
//   must be null, dex totals re-derived server-side (never trusted).
// - 422 errors carry field-level codes only — never echoed payload values
//   (Pen G12).
//
// Returns { ok, errors:[codes], anomalies:[codes], summary:{...} }.
// anomalies = structurally valid but impossible (accepted-but-logged per C10).

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const MAX_DEPTH = 16;
const CURRENT_SCHEMA_VERSION = 2; // server accepts exactly the current version (v1 saves migrate client-side before sync)
const DEX_MAX = 1025; // dex honestly tracks all 1,025 (ADR-006)

// --- table loading + pinning (C10(i), EA V13) ---
let TABLES = null;
let tablesError = null;

function loadTables() {
  try {
    const raw = readFileSync(join(HERE, 'data', 'tables.json'), 'utf8');
    const snap = JSON.parse(raw);
    const { tablesVersion, ...tables } = snap;
    const recomputed = createHash('sha256').update(JSON.stringify(tables), 'utf8').digest('hex');
    if (recomputed !== tablesVersion) {
      throw new Error(`tablesVersion mismatch (committed ${String(tablesVersion).slice(0, 12)}… != recomputed ${recomputed.slice(0, 12)}…)`);
    }
    if (!Array.isArray(tables.species) || tables.species.length === 0) throw new Error('empty species table');
    if (tables.schemaVersion !== CURRENT_SCHEMA_VERSION) throw new Error('schemaVersion skew');
    TABLES = {
      version: tablesVersion,
      schemaVersion: tables.schemaVersion,
      species: new Set(tables.species),
      moves: new Set(tables.moves),
      items: new Set(tables.items),
      keepsakes: new Set(tables.keepsakes || []),
      forms: new Set(tables.forms || []),
      quests: new Set(tables.quests || []),
      regions: new Set(tables.regions || ['kanto']),
      badgeSequences: tables.badgeSequences,
      regionBadgeMax: tables.regionBadgeMax,
    };
  } catch (e) {
    tablesError = e;
    TABLES = null;
  }
}
loadTables();

export function tablesReady() {
  return TABLES !== null;
}
export function tablesStatus() {
  return { ready: TABLES !== null, error: tablesError ? String(tablesError.message || tablesError) : null, version: TABLES ? TABLES.version : null };
}
function needTables(errors) {
  if (!TABLES) errors.push('tables-unavailable');
  return !!TABLES;
}

// --- primitives ---
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function isPlainObj(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}
function hasDangerousKey(obj) {
  for (const k of Object.keys(obj)) if (DANGEROUS_KEYS.has(k)) return k;
  return null;
}
function isInt(x, min, max) {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}
// T12 stored-XSS gate: free-text fields are whitelisted to a safe charset.
const SAFE_TEXT = /^[A-Za-z0-9 _.'\-]*$/;
function isSafeText(x, min, max) {
  if (typeof x !== 'string') return false;
  const n = x.normalize('NFKC');
  if (n.length < min || n.length > max) return false;
  return SAFE_TEXT.test(n);
}
const NAME_CHARSET_NOTE = 'charset'; // error code suffix only; never echoes values

// --- section validators (each pushes codes, never values) ---
function checkMon(m, errors, depth) {
  if (depth > MAX_DEPTH) return errors.push('depth');
  if (!isPlainObj(m)) return errors.push('bad-mon');
  const dk = hasDangerousKey(m);
  if (dk) return errors.push('dangerous-key:' + dk);
  if (!TABLES.species.has(m.speciesId)) errors.push('bad-species');
  if (!(m.nickname === null || isSafeText(m.nickname, 1, 12))) errors.push('bad-nickname:' + NAME_CHARSET_NOTE);
  if (!isInt(m.level, 1, 100)) errors.push('bad-mon-level');
  if (typeof m.xp !== 'number' || !Number.isFinite(m.xp) || m.xp < 0 || m.xp > 2000000) errors.push('bad-xp');
  if (!Array.isArray(m.moves) || m.moves.length > 4) errors.push('bad-mon-moves');
  else for (const mv of m.moves) {
    if (!isPlainObj(mv) || !TABLES.moves.has(mv.id)) { errors.push('bad-move'); break; }
    if (!isInt(mv.pp, 0, 64) || !isInt(mv.maxPp, 1, 64) || mv.pp > mv.maxPp) { errors.push('bad-move-pp'); break; }
  }
  if (!isPlainObj(m.ivs)) errors.push('bad-ivs');
  else {
    for (const s of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
      if (!isInt(m.ivs[s], 0, 31)) { errors.push('bad-iv'); break; }
    }
  }
  // ADR-025 §3 (Phase 3): mon.keepsake — null, or an item id from the
  // build's table whose pocket is 'keepsakes' (ids are checked against
  // the emitted tables; keepsake-ness is enforced by the id list the
  // generator emits — every keepsake id exists in tables.items, and a
  // non-keepsake item id in this slot is rejected via the dedicated
  // keepsake id set below).
  if (!(m.keepsake === undefined || m.keepsake === null || (typeof m.keepsake === 'string' && TABLES.keepsakes.has(m.keepsake)))) errors.push('bad-keepsake');
  if (!(m.status === null || ['paralysis', 'burn', 'poison', 'sleep', 'freeze', 'confusion'].includes(m.status))) errors.push('bad-status');
  if (!(m.ot === undefined || m.ot === null || isSafeText(m.ot, 1, 12))) errors.push('bad-ot:' + NAME_CHARSET_NOTE);
  if (!(m.friendship === undefined || isInt(m.friendship, 0, 255))) errors.push('bad-friendship');
  if (m.hp !== undefined && (!isInt(m.hp, 0, 9999) || (isInt(m.maxHp, 1, 9999) && m.hp > m.maxHp))) errors.push('bad-hp');
}

function checkDex(dex, errors, summary) {
  if (!isPlainObj(dex)) return errors.push('bad-dex');
  const dk = hasDangerousKey(dex);
  if (dk) return errors.push('dangerous-key:' + dk);
  let caught = 0, seen = 0, befriended = 0;
  for (const kind of ['caught', 'seen', 'befriended']) {
    const set = dex[kind];
    if (!isPlainObj(set)) { errors.push('bad-dex-' + kind); continue; }
    const ddk = hasDangerousKey(set);
    if (ddk) { errors.push('dangerous-key:' + ddk); continue; }
    let n = 0;
    for (const k of Object.keys(set)) {
      const no = Number(k);
      if (!Number.isInteger(no) || no < 1 || no > DEX_MAX || String(no) !== k) { errors.push('bad-dexno'); break; }
      if (set[k] !== true) { errors.push('bad-dexval'); break; }
      n++;
    }
    if (kind === 'caught') caught = n; else if (kind === 'seen') seen = n; else befriended = n;
  }
  // WS10: form completion tracking — form ids from the build's forms table,
  // true-only values (same honesty rule as species entries).
  if (dex.forms !== undefined) {
    if (!isPlainObj(dex.forms)) errors.push('bad-dex-forms');
    else {
      const fdk = hasDangerousKey(dex.forms);
      if (fdk) errors.push('dangerous-key:' + fdk);
      else {
        const fkeys = Object.keys(dex.forms);
        if (fkeys.length > 400) errors.push('bad-dex-forms-size');
        for (const k of fkeys) {
          if (!TABLES.forms.has(k) || dex.forms[k] !== true) { errors.push('bad-form'); break; }
        }
      }
    }
  }
  // Totals re-derived server-side (never trust client totals).
  summary.dexCaught = caught; summary.dexSeen = seen; summary.dexBefriended = befriended;
}

function checkBadges(badges, errors, anomalies) {
  if (!isPlainObj(badges)) return errors.push('bad-badges');
  const dk = hasDangerousKey(badges);
  if (dk) return errors.push('dangerous-key:' + dk);
  const counts = { kanto: 0, orange: 0, johto: 0 };
  for (const region of ['kanto', 'orange', 'johto']) {
    const arr = badges[region];
    const max = TABLES.regionBadgeMax[region];
    if (!Array.isArray(arr) || arr.length > max) { errors.push('bad-badges-' + region); continue; }
    const seenIds = new Set();
    for (const id of arr) {
      if (typeof id !== 'string' || !/^[a-z0-9_]{1,40}$/.test(id) || seenIds.has(id)) { errors.push('bad-badge-id'); break; }
      seenIds.add(id);
    }
    // Transition rule: earned badges must be a PREFIX of the region's canonical
    // earn order — no badge #N without #1..N-1 (brief: "no badge #8 without #1-7").
    const seq = TABLES.badgeSequences[region] || [];
    for (let i = 0; i < arr.length; i++) {
      if (i >= seq.length || arr[i] !== seq[i]) { errors.push('bad-badge-order'); break; }
    }
    counts[region] = arr.length;
  }
  // v1: all 7 symbol slots locked — any non-null is a hard reject.
  const sym = badges.symbols;
  if (!Array.isArray(sym) || sym.length !== 7 || sym.some((s) => s !== null)) errors.push('bad-symbols');
  return counts;
}

function checkStory(story, errors) {
  if (!isPlainObj(story)) return errors.push('bad-story');
  const dk = hasDangerousKey(story);
  if (dk) return errors.push('dangerous-key:' + dk);
  if (!isInt(story.chapter, 0, 4)) errors.push('bad-chapter');
  if (!isInt(story.beat, 0, 99)) errors.push('bad-beat');
  if (!isPlainObj(story.flags)) errors.push('bad-flags');
  else {
    const fdk = hasDangerousKey(story.flags);
    if (fdk) errors.push('dangerous-key:' + fdk);
    const keys = Object.keys(story.flags);
    if (keys.length > 500) errors.push('bad-flags-size');
    for (const k of keys) {
      if (k.length > 64 || typeof story.flags[k] !== 'boolean') { errors.push('bad-flag'); break; }
    }
  }
  const p = story.position;
  if (!isPlainObj(p) || typeof p.map !== 'string' || p.map.length > 64 || !isInt(p.x, -9999, 9999) || !isInt(p.y, -9999, 9999) || !['up', 'down', 'left', 'right'].includes(p.dir)) {
    errors.push('bad-position');
  }
  // ADR-025 §4: difficulty modes renamed at schema v2 (client migrates
  // 'easy'/'normal'/'hard' -> 'story'/'classic'/'challenge' on load).
  if (!['story', 'classic', 'challenge'].includes(story.difficulty)) errors.push('bad-difficulty');
  // WS6/WS10: campaign state — quest/arc progress keyed by ids from the
  // build's quest table; values are the closed enum active|complete.
  if (story.quests !== undefined) {
    if (!isPlainObj(story.quests)) errors.push('bad-quests');
    else {
      const qdk = hasDangerousKey(story.quests);
      if (qdk) errors.push('dangerous-key:' + qdk);
      else {
        const qkeys = Object.keys(story.quests);
        if (qkeys.length > 200) errors.push('bad-quests-size');
        for (const k of qkeys) {
          if (!TABLES.quests.has(k) || !['active', 'complete'].includes(story.quests[k])) { errors.push('bad-quest'); break; }
        }
      }
    }
  }
  // Region chain (owner rule: regions unlock in story order).
  if (story.region !== undefined && (typeof story.region !== 'string' || !TABLES.regions.has(story.region))) errors.push('bad-region');
  if (story.regionsDone !== undefined) {
    if (!Array.isArray(story.regionsDone) || story.regionsDone.length > 11) errors.push('bad-regions-done');
    else {
      const seen = new Set();
      for (const r of story.regionsDone) {
        if (typeof r !== 'string' || !TABLES.regions.has(r) || seen.has(r)) { errors.push('bad-regions-done'); break; }
        seen.add(r);
      }
    }
  }
  // Hall of Fame snapshots (WS6 finale): small, species-named entries.
  if (story.hof !== undefined) {
    if (!Array.isArray(story.hof) || story.hof.length > 20) errors.push('bad-hof');
    else for (const h of story.hof) {
      if (!isPlainObj(h) || typeof h.species !== 'string' || h.species.length > 40 || !isInt(h.level, 1, 100)) { errors.push('bad-hof'); break; }
    }
  }
}

function checkSettings(s, errors) {
  if (!isPlainObj(s)) return errors.push('bad-settings');
  const dk = hasDangerousKey(s);
  if (dk) return errors.push('dangerous-key:' + dk);
  const BOOLS = ['battleAnims', 'shake', 'reducedMotion', 'mute', 'controlsFlip', 'vibration', 'autosave', 'showTouch'];
  for (const k of BOOLS) if (s[k] !== undefined && typeof s[k] !== 'boolean') errors.push('bad-setting:' + k);
  if (s.textSpeed !== undefined && !['slow', 'normal', 'fast', 'instant'].includes(s.textSpeed)) errors.push('bad-setting:textSpeed');
  if (s.battleStyle !== undefined && !['rt', 'classic'].includes(s.battleStyle)) errors.push('bad-setting:battleStyle');
  for (const k of ['musicVol', 'sfxVol']) if (s[k] !== undefined && (typeof s[k] !== 'number' || s[k] < 0 || s[k] > 1)) errors.push('bad-setting:' + k);
  if (s.keymap !== undefined && !(s.keymap === null || isPlainObj(s.keymap))) errors.push('bad-setting:keymap');
  if (s.hudScale !== undefined && (typeof s.hudScale !== 'number' || s.hudScale < 0.5 || s.hudScale > 2)) errors.push('bad-setting:hudScale');
  // ADR-025 §4: House Rules — a closed set of six boolean toggles.
  if (s.houseRules !== undefined) {
    const HOUSE_RULE_KEYS = ['steadyDamage', 'mercifulFoes', 'fastLearner', 'generousWorld', 'candyCoach', 'skipIntro'];
    if (!isPlainObj(s.houseRules)) errors.push('bad-setting:houseRules');
    else {
      const hdk = hasDangerousKey(s.houseRules);
      if (hdk) errors.push('dangerous-key:' + hdk);
      else for (const k of Object.keys(s.houseRules)) {
        if (!HOUSE_RULE_KEYS.includes(k) || typeof s.houseRules[k] !== 'boolean') { errors.push('bad-setting:houseRules'); break; }
      }
    }
  }
}

// --- anomaly heuristics: structurally valid but impossible => accepted-but-logged ---
function detectAnomalies(data, summary, anomalies) {
  const playtime = data.player.playtimeSec;
  const totalBadges = summary.badgeCount;
  if (playtime === 0 && (totalBadges > 0 || summary.dexCaught > 0 || (data.party.length > 0 && data.party.some((m) => m.level > 5)))) {
    anomalies.push('zero-playtime-with-progress');
  }
  if (summary.dexCaught > TABLES.species.size) anomalies.push('dex-exceeds-tables');
  if (totalBadges === 20 && data.story.chapter < 3) anomalies.push('all-badges-early-chapter');
  if (data.party.length > 0 && data.party.every((m) => m.level === 100) && playtime < 3600) {
    anomalies.push('maxed-party-low-playtime');
  }
}

const TOP_KEYS = new Set(['v', 'player', 'party', 'boxes', 'dex', 'badges', 'story', 'pikachu', 'settings', 'facilities', 'bag', 'meta', 'currentBox', 'session']);

export function validateSave(data) {
  const errors = [];
  const anomalies = [];
  const summary = Object.create(null);

  if (!needTables(errors)) return { ok: false, errors, anomalies, summary };
  if (!isPlainObj(data)) return { ok: false, errors: ['not-an-object'], anomalies, summary };
  const topDk = hasDangerousKey(data);
  if (topDk) return { ok: false, errors: ['dangerous-key:' + topDk], anomalies, summary };
  for (const k of Object.keys(data)) {
    if (!TOP_KEYS.has(k)) errors.push('unknown-key:' + k);
  }
  if (errors.length) return { ok: false, errors, anomalies, summary };

  if (data.v !== CURRENT_SCHEMA_VERSION) errors.push('bad-schema-version');

  // player
  const pl = data.player;
  if (!isPlainObj(pl) || hasDangerousKey(pl)) errors.push('bad-player');
  else {
    if (!isSafeText(pl.name, 1, 12)) errors.push('bad-player-name:' + NAME_CHARSET_NOTE);
    if (!(pl.rivalName === undefined || isSafeText(pl.rivalName, 1, 12))) errors.push('bad-rival-name:' + NAME_CHARSET_NOTE);
    if (!isInt(pl.trainerId, 0, 65535)) errors.push('bad-trainer-id');
    if (!isInt(pl.playtimeSec, 0, 100000000)) errors.push('bad-playtime');
    if (!isInt(pl.money, 0, 99999999)) errors.push('bad-money');
    summary.playtimeSec = pl.playtimeSec;
  }

  // party
  if (!Array.isArray(data.party) || data.party.length > 6) errors.push('bad-party');
  else for (const m of data.party) { checkMon(m, errors, 2); if (errors.length > 24) break; }

  // boxes
  const bx = data.boxes;
  if (!isPlainObj(bx) || hasDangerousKey(bx)) errors.push('bad-boxes');
  else {
    const keys = Object.keys(bx);
    if (keys.length > 12) errors.push('bad-boxes-size');
    for (const k of keys) {
      if (!/^box([1-9]|1[0-2])$/.test(k)) { errors.push('bad-box-key'); break; }
      const arr = bx[k];
      if (!Array.isArray(arr) || arr.length > 30) { errors.push('bad-box-size'); break; }
      for (const m of arr) {
        if (!isPlainObj(m) || hasDangerousKey(m)) { errors.push('bad-boxmon'); break; }
        if (!TABLES.species.has(m.speciesId)) { errors.push('bad-species'); break; }
        if (!isInt(m.level, 1, 100)) { errors.push('bad-mon-level'); break; }
        if (!(m.nickname === undefined || m.nickname === null || isSafeText(m.nickname, 1, 12))) { errors.push('bad-nickname:' + NAME_CHARSET_NOTE); break; }
        if (!(m.keepsake === undefined || m.keepsake === null || (typeof m.keepsake === 'string' && TABLES.keepsakes.has(m.keepsake)))) { errors.push('bad-keepsake'); break; }
        if (!Array.isArray(m.moves) || m.moves.length > 4 || m.moves.some((mv) => !isPlainObj(mv) || !TABLES.moves.has(mv.id))) { errors.push('bad-move'); break; }
      }
      if (errors.length > 24) break;
    }
  }

  checkDex(data.dex, errors, summary);

  let badgeCounts = null;
  if (TABLES) badgeCounts = checkBadges(data.badges, errors, anomalies);
  summary.badgeCount = badgeCounts ? badgeCounts.kanto + badgeCounts.orange + badgeCounts.johto : 0;

  checkStory(data.story, errors);

  // pikachu (partner state)
  const pk = data.pikachu;
  if (!isPlainObj(pk) || hasDangerousKey(pk)) errors.push('bad-pikachu');
  else {
    if (!['happy', 'neutral', 'sad', 'excited'].includes(pk.mood)) errors.push('bad-mood');
    if (!isInt(pk.foundItemCooldown, 0, 1000000)) errors.push('bad-cooldown');
  }

  checkSettings(data.settings, errors);

  // facilities (Frontier-ready hooks — v1 shape only)
  const fc = data.facilities;
  if (!isPlainObj(fc) || hasDangerousKey(fc)) errors.push('bad-facilities');
  else {
    if (!Array.isArray(fc.registry) || !Array.isArray(fc.unlocked) || fc.registry.length > 32 || fc.unlocked.length > 32) errors.push('bad-facilities-shape');
  }

  // bag
  const bag = data.bag;
  if (!isPlainObj(bag) || hasDangerousKey(bag)) errors.push('bad-bag');
  else {
    const keys = Object.keys(bag);
    if (keys.length > 160) errors.push('bad-bag-size');
    for (const k of keys) {
      if (!TABLES.items.has(k) || !isInt(bag[k], 0, 999)) { errors.push('bad-bag-item'); break; }
    }
  }

  // currentBox (WS9: Bill's PC — the box new catches land in)
  if (data.currentBox !== undefined && (typeof data.currentBox !== 'string' || !/^box([1-9]|1[0-2])$/.test(data.currentBox))) {
    errors.push('bad-current-box');
  }

  // session (transient queues — validated for shape, never trusted for state)
  if (data.session !== undefined) {
    if (!isPlainObj(data.session) || hasDangerousKey(data.session)) errors.push('bad-session');
    else {
      for (const qk of ['learnQueue', 'evolveQueue']) {
        const q = data.session[qk];
        if (q === undefined) continue;
        if (!Array.isArray(q) || q.length > 24) { errors.push('bad-session-queue'); break; }
        for (const e of q) {
          if (!isPlainObj(e) || typeof e.monId !== 'string' || e.monId.length > 40) { errors.push('bad-session-queue'); break; }
          if (qk === 'learnQueue' && (typeof e.moveId !== 'string' || !TABLES.moves.has(e.moveId))) { errors.push('bad-session-queue'); break; }
        }
        if (errors.length > 24) break;
      }
    }
  }

  // meta
  const mt = data.meta;
  if (!isPlainObj(mt) || hasDangerousKey(mt)) errors.push('bad-meta');
  else {
    if (!isInt(mt.playtimeSec, 0, 100000000)) errors.push('bad-meta-playtime');
    if (typeof mt.location !== 'string' || mt.location.normalize('NFKC').length > 64 || !SAFE_TEXT.test(mt.location.normalize('NFKC'))) {
      errors.push('bad-meta-location:' + NAME_CHARSET_NOTE);
    }
    // ADR-025: Pure Run ribbon flag + Second Journey counter (Phase 6).
    if (mt.houseRulesTouched !== undefined && typeof mt.houseRulesTouched !== 'boolean') errors.push('bad-meta-house-rules');
    if (mt.ngPlus !== undefined && !isInt(mt.ngPlus, 0, 999)) errors.push('bad-meta-ngplus');
  }

  if (!errors.length) {
    summary.storyBeat = data.story.beat;
    detectAnomalies(data, summary, anomalies);
  }
  return { ok: errors.length === 0, errors: errors.slice(0, 32), anomalies, summary };
}

// Pre-parse depth scan (iterative — no recursion): rejects deeply-nested bodies
// before JSON.parse ever sees them (Pen T7c depth-DoS).
export function checkNestingDepth(raw, maxDepth = 32) {
  let depth = 0, maxSeen = 0, inStr = false, esc = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '[' || c === '{') { depth++; if (depth > maxSeen) maxSeen = depth; if (maxSeen > maxDepth) return false; }
    else if (c === ']' || c === '}') depth--;
  }
  return true;
}
