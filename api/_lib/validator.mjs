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
// - State-transition checks: badge earn-order prefix per region, Frontier
//   symbol slots tier-checked (null | 'silver' | 'gold', unordered — Stage
//   F0), dex totals re-derived server-side (never trusted).
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
      ribbons: new Set(tables.ribbons || []),
      balls: new Set(tables.balls || []),
      forms: new Set(tables.forms || []),
      quests: new Set(tables.quests || []),
      regions: new Set(tables.regions || ['kanto']),
      // Arc 3.5 Stage F5-fix: the story.regionsDone vocabulary —
      // emitted by gen-tables from src/data/arcs.mjs as the
      // completionKey of every ARCS row (registry-derived, the J0
      // precedent). Distinct from `regions` above: regionsDone
      // carries completionKeys, and the Frontier arc's completionKey
      // is 'frontier' while its regionKey is 'kanto', so the regions
      // list can never contain it. Only the regionsDone membership
      // check in checkStory reads this set; the story.region check
      // keeps reading `regions`, unchanged.
      regionsDoneKeys: new Set(tables.regionsDoneKeys || []),
      arcs: new Set(tables.arcs || []),
      // Arc 3.5 Stage F2: the Frontier facility id list (emitted by
      // gen-tables from BADGE_SETS.symbols — slot order, the single
      // source) and the closed Pike event-category list (emitted
      // from src/data/frontier.mjs). The state.frontier shape check
      // below is data-driven from exactly these two sets.
      frontierFacilities: new Set(tables.frontierFacilities || []),
      frontierPikeEvents: new Set(tables.frontierPikeEvents || []),
      // Stage J0: per-arc band data emitted by gen-tables from
      // src/data/arcs.mjs — arc id -> band max / paired XP ceiling.
      // A null value is the open-level band (no cap). Absent maps
      // (a pre-J0 tables snapshot cannot occur — the version hash
      // pins the snapshot — but fail safe anyway) read as Kanto.
      arcBandMax: tables.arcBandMax || {},
      arcXpCeiling: tables.arcXpCeiling || {},
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
// Arc 4 Stage S0 (F-1 fix, coordinator ruling): meta.location is NOT
// free text — it is a snapshot of the game's OWN map display name
// (overworld.mjs writes this.map.name into it), and shipped map names
// legitimately carry U+2014 EM DASH (e.g. 'Pewter City — House':
// 38 shipped map entries / 36 unique names, scanned from the
// maps*.mjs name fields). The client accepts those saves; this
// validator rejected them 'bad-meta-location:charset', so a real
// player standing in such a map could not cloud-save. The location
// check therefore uses this DEDICATED charset — the SAFE_TEXT set
// plus U+2014 and U+2013 (en dash, the same typographic family) —
// and NOTHING else widens: nickname / player-name / rival-name / OT
// checks keep SAFE_TEXT exactly as before.
const SAFE_LOCATION_TEXT = /^[A-Za-z0-9 _.'\-—–]*$/;
function isSafeText(x, min, max) {
  if (typeof x !== 'string') return false;
  const n = x.normalize('NFKC');
  if (n.length < min || n.length > max) return false;
  return SAFE_TEXT.test(n);
}
const NAME_CHARSET_NOTE = 'charset'; // error code suffix only; never echoes values

// --- Stage J0: arc-band derivation (ADR-027 Amendment 2) ---
// A save's mon level cap + XP ceiling come from the save's OWN
// story.arc, read through the emitted band tables (gen-tables
// evaluates the client registry's levelCapFor / xpCeilingFor per
// arc row — the matched pair, one derivation both sides). An absent
// story.arc is a pre-foundation save, which is a Kanto save by
// definition (the client's deriveArcDefaults agrees); an arc id
// outside the emitted map falls back to the same Kanto caps and is
// rejected separately as bad-arc by checkStory. A null emitted value
// is the open-level band: no cap (Infinity, the levelCapFor
// convention). Min level stays 1 for every arc.
const DEFAULT_ARC_ID = 'kanto';
function arcCapsFor(story) {
  const arcId = isPlainObj(story) && typeof story.arc === 'string'
    && Object.prototype.hasOwnProperty.call(TABLES.arcBandMax, story.arc)
    ? story.arc : DEFAULT_ARC_ID;
  const cap = TABLES.arcBandMax[arcId];
  const xpCeiling = TABLES.arcXpCeiling[arcId];
  return {
    arcId,
    levelCap: typeof cap === 'number' ? cap : Infinity,
    xpCeiling: typeof xpCeiling === 'number' ? xpCeiling : Infinity,
  };
}

// --- section validators (each pushes codes, never values) ---
function checkMon(m, errors, depth, caps) {
  if (depth > MAX_DEPTH) return errors.push('depth');
  if (!isPlainObj(m)) return errors.push('bad-mon');
  const dk = hasDangerousKey(m);
  if (dk) return errors.push('dangerous-key:' + dk);
  if (!TABLES.species.has(m.speciesId)) errors.push('bad-species');
  if (!(m.nickname === null || isSafeText(m.nickname, 1, 12))) errors.push('bad-nickname:' + NAME_CHARSET_NOTE);
  if (!isInt(m.level, 1, caps.levelCap)) errors.push('bad-mon-level');
  if (typeof m.xp !== 'number' || !Number.isFinite(m.xp) || m.xp < 0 || m.xp > caps.xpCeiling) errors.push('bad-xp');
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
  // Stage J6: egg fields (mon.egg boolean; mon.eggSteps bounded int).
  if (!(m.egg === undefined || typeof m.egg === 'boolean')) errors.push('bad-egg');
  if (!(m.eggSteps === undefined || isInt(m.eggSteps, 0, 100000))) errors.push('bad-egg-steps');
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
  // ADR-025 §6 (Phase 6): the run's OWN catch record — present only on
  // Second Journey runs, where dex.caught is the carried archive and
  // honors read this map instead. Same honesty rules as the archive.
  if (dex.runCaught !== undefined) {
    if (!isPlainObj(dex.runCaught)) errors.push('bad-dex-run-caught');
    else {
      const rdk = hasDangerousKey(dex.runCaught);
      if (rdk) errors.push('dangerous-key:' + rdk);
      else {
        let n = 0;
        for (const k of Object.keys(dex.runCaught)) {
          const no = Number(k);
          if (!Number.isInteger(no) || no < 1 || no > DEX_MAX || String(no) !== k) { errors.push('bad-dexno'); break; }
          if (dex.runCaught[k] !== true) { errors.push('bad-dexval'); break; }
          n++;
        }
        summary.dexRunCaught = n;
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
  const counts = { kanto: 0, orange: 0, johto: 0, hoenn: 0, sinnoh: 0, symbols: 0 };
  for (const region of ['kanto', 'orange', 'johto', 'hoenn', 'sinnoh']) {
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
  // Stage F0 (supersedes the v1 lock, which hard-rejected any non-null
  // slot): Frontier symbol slots are tier-validity checked — absent is
  // ok (a pre-F0 cloud save carries the all-null/default shape only
  // after the client fill; absence itself is not an offence); if
  // present it must be an array of exactly 7, each null | 'silver' |
  // 'gold', else 'bad-symbols'. NO prefix/order rule: symbols slots
  // are unordered facility slots (BADGE_SETS.symbols is slot order,
  // not an earn sequence), so checkBadges deliberately does NOT run
  // symbols through badgeSequences — slot 6 'gold' with slot 0 null
  // is a legal save. The count is the non-null slot count, the same
  // read badgeCountFor (src/data/arcs.mjs) makes for the registry.
  const sym = badges.symbols;
  if (sym !== undefined) {
    if (!Array.isArray(sym) || sym.length !== 7 || sym.some((s) => !(s === null || s === 'silver' || s === 'gold'))) errors.push('bad-symbols');
    else counts.symbols = sym.filter((s) => s !== null).length;
  }
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
  // P1 (2026-10-28): story.lastCenter — the persisted Center
  // door-front anchor; optional, shape-checked when present
  // (mirrors position, minus dir).
  if (story.lastCenter !== undefined) {
    const lc = story.lastCenter;
    if (!isPlainObj(lc) || typeof lc.map !== 'string' || lc.map.length > 64 || !isInt(lc.x, -9999, 9999) || !isInt(lc.y, -9999, 9999)) {
      errors.push('bad-lastCenter');
    }
  }
  // ADR-025 §4: difficulty modes renamed at schema v2 (client migrates
  // 'easy'/'normal'/'hard' -> 'story'/'classic'/'challenge' on load).
  if (!['story', 'classic', 'challenge'].includes(story.difficulty)) errors.push('bad-difficulty');
  // WS6/WS10: campaign state — quest/arc progress keyed by ids from the
  // build's quest table. ADR-025 §7 (Phase 4 widening): values are
  // 'active' | stage number (integer 0..99) | 'complete'; the legendary
  // arcs' pre-existing 'discovered' string stage stays legal (their
  // machinery writes it; behavior is unchanged). Anything else —
  // fractional/negative/huge numbers, other strings, objects — rejects.
  if (story.quests !== undefined) {
    if (!isPlainObj(story.quests)) errors.push('bad-quests');
    else {
      const qdk = hasDangerousKey(story.quests);
      if (qdk) errors.push('dangerous-key:' + qdk);
      else {
        const qkeys = Object.keys(story.quests);
        if (qkeys.length > 200) errors.push('bad-quests-size');
        for (const k of qkeys) {
          const v = story.quests[k];
          const okV = v === 'active' || v === 'complete' || v === 'discovered' || isInt(v, 0, 99);
          if (!TABLES.quests.has(k) || !okV) { errors.push('bad-quest'); break; }
        }
      }
    }
  }
  // ADR-025 §2/§7: bond scores — npcId -> hidden integer -10..+10.
  // Keys are short lowercase ids (the authored bond cast, incl. the
  // Town Tale sources Phase 4 records); values are strict integers.
  if (story.bonds !== undefined) {
    if (!isPlainObj(story.bonds)) errors.push('bad-bonds');
    else {
      const bdk = hasDangerousKey(story.bonds);
      if (bdk) errors.push('dangerous-key:' + bdk);
      else {
        const bkeys = Object.keys(story.bonds);
        if (bkeys.length > 64) errors.push('bad-bonds-size');
        for (const k of bkeys) {
          if (!/^[a-z0-9_]{1,40}$/.test(k) || !isInt(story.bonds[k], -10, 10)) { errors.push('bad-bond'); break; }
        }
      }
    }
  }
  // Region chain (owner rule: regions unlock in story order).
  // F5-fix consumer inventory for TABLES.regions: this story.region
  // validity check is its ONLY remaining reader after the fix (the
  // regionsDone check below was its other reader at base). It keeps
  // reading `regions` exactly as at base — 'frontier' is a
  // completionKey, not a regionKey (the Frontier arc's regionKey is
  // 'kanto'), so a save claiming story.region 'frontier' stays
  // rejected here, exactly as before.
  if (story.region !== undefined && (typeof story.region !== 'string' || !TABLES.regions.has(story.region))) errors.push('bad-region');
  if (story.regionsDone !== undefined) {
    if (!Array.isArray(story.regionsDone) || story.regionsDone.length > 11) errors.push('bad-regions-done');
    else {
      const seen = new Set();
      for (const r of story.regionsDone) {
        if (typeof r !== 'string' || !TABLES.regionsDoneKeys.has(r) || seen.has(r)) { errors.push('bad-regions-done'); break; }
        seen.add(r);
      }
    }
  }
  // Hall of Fame snapshots — ADR-025 §6 (Phase 6) shape reconciliation.
  // ONE canonical shape, the one runEnding pushes and the HoF viewer
  // reads: { team: [{ speciesId, level, nickname }], badges }. The
  // legacy single-mon shape { species, level } — this validator's
  // original expectation, which the client never actually pushed —
  // stays ACCEPTED so any save carrying it loads clean; the client
  // normalizes it to canonical on load. A canonical entry's members
  // may individually carry the legacy species key (hybrid shape) —
  // the client normalizer maps it the same way, so both sides agree.
  // story.priorHof (a Second Journey run's inherited teams) carries
  // the same shapes.
  // Stage J0: HoF snapshot levels are bounded by the save-arc's band
  // cap, exactly like party/box mons (a Johto champion's team stands
  // at Johto levels in its own save).
  const hofCaps = arcCapsFor(story);
  const checkHofList = (list) => {
    if (!Array.isArray(list) || list.length > 40) return false;
    for (const h of list) {
      if (!isPlainObj(h) || hasDangerousKey(h)) return false;
      if (Array.isArray(h.team)) {
        if (h.team.length < 1 || h.team.length > 6) return false;
        if (!(h.badges === undefined || isInt(h.badges, 0, 20))) return false;
        // Arc 4 Stage S7: the Master HoF entry's one sanctioned
        // extra field — an optional boolean master flag.
        if (!(h.master === undefined || typeof h.master === 'boolean')) return false;
        for (const m of h.team) {
          if (!isPlainObj(m)) return false;
          // Hybrid members: a canonical team member may carry the
          // legacy { species } key instead of speciesId — the client's
          // normalizeHofEntry accepts it and maps species -> speciesId,
          // so the server validates the same effective id (speciesId
          // wins when it is a string, exactly as the client resolves).
          const sid = typeof m.speciesId === 'string' ? m.speciesId : m.species;
          if (!TABLES.species.has(sid) || !isInt(m.level, 1, hofCaps.levelCap)) return false;
          if (!(m.nickname === undefined || m.nickname === null || isSafeText(m.nickname, 1, 12))) return false;
        }
      } else if (!(typeof h.species === 'string' && h.species.length >= 1 && h.species.length <= 40 && isInt(h.level, 1, hofCaps.levelCap))) {
        return false;
      }
    }
    return true;
  };
  if (story.hof !== undefined && !checkHofList(story.hof)) errors.push('bad-hof');
  if (story.priorHof !== undefined && !checkHofList(story.priorHof)) errors.push('bad-prior-hof');
  // Phase 6 carried knowledge: closed vocabularies, bounded lists.
  if (story.bondEcho !== undefined) {
    if (!Array.isArray(story.bondEcho) || story.bondEcho.length > 32
      || story.bondEcho.some((x) => typeof x !== 'string' || !/^[a-z0-9_]{1,40}$/.test(x))) errors.push('bad-bond-echo');
  }
  if (story.travelersMemory !== undefined) {
    const GATES = ['saffron-guard', 'coin-case', 'card-key', 'fossil-choice'];
    if (!Array.isArray(story.travelersMemory) || story.travelersMemory.length > 4
      || story.travelersMemory.some((x) => !GATES.includes(x))) errors.push('bad-travelers-memory');
  }
  if (story.starterLines !== undefined) {
    if (!Array.isArray(story.starterLines) || story.starterLines.length > 3
      || story.starterLines.some((x) => !['bulbasaur', 'charmander', 'squirtle'].includes(x))) errors.push('bad-starter-lines');
  }
  // ADR-027 (Stage F): the arc chain fields — story.arc and the pinned
  // directive's target are closed-vocabulary registry ids (emitted by
  // gen-tables from src/data/arcs.mjs, so client and cloud cannot
  // drift); the arc-start snapshots are bounded counters. Absent =
  // pre-foundation save (the client derives them on load). Stage J0:
  // the mon level bounds are now band reads off this same field —
  // arcCapsFor above selects the cap from the emitted per-arc band
  // max (Kanto/Orange 100, Johto 200, later arcs per the registry);
  // min stays 1.
  if (story.arc !== undefined && !(TABLES.arcs && TABLES.arcs.has(story.arc))) errors.push('bad-arc');
  if (story.arc_directive !== undefined && story.arc_directive !== null
    && !(TABLES.arcs && TABLES.arcs.has(story.arc_directive))) errors.push('bad-arc-directive');
  if (story.arcDexStart !== undefined && !isInt(story.arcDexStart, 0, 1025)) errors.push('bad-arc-dex-start');
  if (story.arcStartPlaytime !== undefined && !isInt(story.arcStartPlaytime, 0, 100000000)) errors.push('bad-arc-start-playtime');
}

function checkSettings(s, errors) {
  if (!isPlainObj(s)) return errors.push('bad-settings');
  const dk = hasDangerousKey(s);
  if (dk) return errors.push('dangerous-key:' + dk);
  const BOOLS = ['battleAnims', 'shake', 'reducedMotion', 'mute', 'controlsFlip', 'vibration', 'autosave', 'showTouch'];
  for (const k of BOOLS) if (s[k] !== undefined && typeof s[k] !== 'boolean') errors.push('bad-setting:' + k);
  if (s.textSpeed !== undefined && !['slow', 'normal', 'fast', 'instant'].includes(s.textSpeed)) errors.push('bad-setting:textSpeed');
  if (s.battleStyle !== undefined && !['rt', 'classic'].includes(s.battleStyle)) errors.push('bad-setting:battleStyle');
  if (s.switchMode !== undefined && !['set', 'shift'].includes(s.switchMode)) errors.push('bad-setting:switchMode');
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
  // Stage J0: cap-relative — a party entirely at the SAVE-ARC's band
  // cap (100 in Kanto, 200 in Johto), not a hard-coded 100. An
  // open-level arc's cap is Infinity, which no mon level equals, so
  // the heuristic simply never fires there.
  const caps = arcCapsFor(data.story);
  if (data.party.length > 0 && data.party.every((m) => m.level === caps.levelCap) && playtime < 3600) {
    anomalies.push('maxed-party-low-playtime');
  }
}

const TOP_KEYS = new Set(['v', 'player', 'party', 'boxes', 'dex', 'badges', 'story', 'pikachu', 'settings', 'facilities', 'bag', 'meta', 'currentBox', 'session',
  // Stage J6: the arc-systems fields — the client schema's TOP_KEYS
  // carries the same six (the matched pair).
  'daycare', 'daycareEgg', 'daycareEggAt', 'stepsTotal', 'gather', 'kurtOrder',
  // Stage H5: the contest field — the client schema's TOP_KEYS
  // carries the same key (the matched pair).
  'contest',
  // Arc 3.5 Stage F2: the Frontier run state — the client schema's
  // TOP_KEYS carries the same key (the matched pair).
  'frontier']);

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

  // Stage J0: one band derivation for every mon in this save,
  // selected by the save's own story.arc.
  const caps = arcCapsFor(data.story);

  // party
  if (!Array.isArray(data.party) || data.party.length > 6) errors.push('bad-party');
  else for (const m of data.party) { checkMon(m, errors, 2, caps); if (errors.length > 24) break; }

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
        if (!isInt(m.level, 1, caps.levelCap)) { errors.push('bad-mon-level'); break; }
        if (!(m.nickname === undefined || m.nickname === null || isSafeText(m.nickname, 1, 12))) { errors.push('bad-nickname:' + NAME_CHARSET_NOTE); break; }
        if (!(m.keepsake === undefined || m.keepsake === null || (typeof m.keepsake === 'string' && TABLES.keepsakes.has(m.keepsake)))) { errors.push('bad-keepsake'); break; }
        if (!(m.egg === undefined || typeof m.egg === 'boolean')) { errors.push('bad-egg'); break; }
        if (!(m.eggSteps === undefined || isInt(m.eggSteps, 0, 100000))) { errors.push('bad-egg-steps'); break; }
        if (!Array.isArray(m.moves) || m.moves.length > 4 || m.moves.some((mv) => !isPlainObj(mv) || !TABLES.moves.has(mv.id))) { errors.push('bad-move'); break; }
      }
      if (errors.length > 24) break;
    }
  }

  // Stage J6 arc systems: Day-Care guests run the FULL mon checker
  // (species/moves/IVs/keepsake/egg — deposited mons are real mons);
  // the waiting egg, the step counter, the tree-rest map and Kurt's
  // order are closed bounded shapes.
  if (data.daycare !== undefined) {
    if (!Array.isArray(data.daycare) || data.daycare.length > 2) errors.push('bad-daycare');
    else for (const m of data.daycare) { checkMon(m, errors, 2, caps); if (errors.length > 24) break; }
  }
  if (data.daycareEgg !== undefined && data.daycareEgg !== null) {
    const e = data.daycareEgg;
    if (!isPlainObj(e) || hasDangerousKey(e) || !TABLES.species.has(e.speciesId) || !isInt(e.eggSteps, 0, 100000)) errors.push('bad-daycare-egg');
  }
  if (data.daycareEggAt !== undefined && data.daycareEggAt !== null && !isInt(data.daycareEggAt, 0, 100000000)) errors.push('bad-daycare-egg-at');
  if (data.stepsTotal !== undefined && !isInt(data.stepsTotal, 0, 100000000)) errors.push('bad-steps-total');
  if (data.gather !== undefined) {
    if (!isPlainObj(data.gather) || hasDangerousKey(data.gather)) errors.push('bad-gather');
    else {
      const gkeys = Object.keys(data.gather);
      if (gkeys.length > 64) errors.push('bad-gather-size');
      else for (const k of gkeys) {
        if (!/^[a-z0-9-]+:-?\d+,-?\d+$/.test(k) || !isInt(data.gather[k], 0, 100000000)) { errors.push('bad-gather-entry'); break; }
      }
    }
  }
  if (data.kurtOrder !== undefined && data.kurtOrder !== null) {
    const o = data.kurtOrder;
    if (!isPlainObj(o) || hasDangerousKey(o) || typeof o.ball !== 'string' || !TABLES.balls.has(o.ball) || !isInt(o.readyAt, 0, 100000000)) errors.push('bad-kurt-order');
  }
  // Stage H5: contest.ribbons — a duplicate-free subset of the closed
  // hall set (TABLES.ribbons, emitted by gen-tables from
  // src/data/contest.mjs). Optional: a pre-H5 save carries no contest
  // key and stays valid (the client fills the default on load).
  // Ribbons are unordered — no prefix rule, unlike badges.
  if (data.contest !== undefined) {
    const c = data.contest;
    if (!isPlainObj(c) || hasDangerousKey(c)) errors.push('bad-contest');
    else if (!Array.isArray(c.ribbons) || c.ribbons.length > TABLES.ribbons.size) errors.push('bad-contest-ribbons');
    else {
      const seenR = new Set();
      for (const id of c.ribbons) {
        if (typeof id !== 'string' || !TABLES.ribbons.has(id) || seenR.has(id)) { errors.push('bad-ribbon'); break; }
        seenR.add(id);
      }
    }
  }

  // Arc 3.5 Stage F2: state.frontier — per-facility records (bounded
  // counters over the closed per-facility field lists), the Pyramid
  // run bag (item ids from the build's table), and ONE active run
  // whose payload is shape-checked per component: rentals run the
  // FULL mon checker, the Dome bracket and the Pike pre-roll are
  // closed bounded shapes. Optional: a pre-F2 save carries no
  // frontier key and stays valid (the client fills it on load).
  if (data.frontier !== undefined) {
    const fr = data.frontier;
    if (!isPlainObj(fr) || hasDangerousKey(fr)) errors.push('bad-frontier');
    else {
      const REC_FIELDS = {
        tower: ['bestStreak', 'totalWins'], factory: ['bestStreak', 'totalWins'],
        arena: ['bestStreak', 'totalWins'], dome: ['tournaments', 'tournamentWins', 'bestFinish'],
        pike: ['bestRun', 'totalRooms'], palace: ['bestStreak', 'totalWins'],
        pyramid: ['bestFloor', 'runs'],
      };
      if (fr.records !== undefined) {
        if (!isPlainObj(fr.records) || hasDangerousKey(fr.records)) errors.push('bad-frontier-records');
        else for (const id of Object.keys(fr.records)) {
          const rec = fr.records[id];
          if (!TABLES.frontierFacilities.has(id) || !isPlainObj(rec) || hasDangerousKey(rec)
            || Object.keys(rec).some((k) => !(REC_FIELDS[id] || []).includes(k))
            || Object.values(rec).some((v) => !isInt(v, 0, 1000000))) { errors.push('bad-frontier-records'); break; }
        }
      }
      if (fr.pyramidBag !== undefined) {
        if (!Array.isArray(fr.pyramidBag) || fr.pyramidBag.length > 99
          || fr.pyramidBag.some((id) => typeof id !== 'string' || !TABLES.items.has(id))) errors.push('bad-frontier-bag');
      }
      if (fr.run !== undefined && fr.run !== null) {
        const r = fr.run;
        let badRun = !isPlainObj(r) || hasDangerousKey(r) || !TABLES.frontierFacilities.has(r.facility)
          || !isInt(r.foeLevel, 1, 9999)
          || !Array.isArray(r.enteredTeam) || r.enteredTeam.length > 3
          || r.enteredTeam.some((x) => typeof x !== 'string' || x.length > 40)
          || (r.streak !== undefined && !isInt(r.streak, 0, 100000));
        if (!badRun && r.rentals !== undefined && r.rentals !== null) {
          if (!Array.isArray(r.rentals) || r.rentals.length > 3) badRun = true;
          else { const before = errors.length; for (const m of r.rentals) checkMon(m, errors, 2, caps); if (errors.length > before) { errors.length = before; badRun = true; } }
        }
        if (!badRun && r.bracket !== undefined && r.bracket !== null) {
          const b = r.bracket;
          if (!isPlainObj(b) || hasDangerousKey(b) || !Array.isArray(b.entrants) || b.entrants.length > 16
            || b.entrants.some((e) => !isPlainObj(e) || typeof e.name !== 'string' || e.name.length > 40
              || !Array.isArray(e.species) || e.species.length > 3 || e.species.some((s) => typeof s !== 'string' || !TABLES.species.has(s))
              || !isInt(e.power, 0, 10000000))
            || !isInt(b.round, 0, 3)
            || !Array.isArray(b.alive) || b.alive.length > 16 || b.alive.some((x) => !isInt(x, 0, 15))
            || !Array.isArray(b.results) || b.results.length > 15) badRun = true;
        }
        if (!badRun && r.events !== undefined && r.events !== null) {
          if (!Array.isArray(r.events) || r.events.length !== 7
            || r.events.some((row) => !Array.isArray(row) || row.length !== 3 || row.some((c) => !TABLES.frontierPikeEvents.has(c)))) badRun = true;
        }
        if (!badRun && r.spots !== undefined && r.spots !== null) {
          const FLOORS = ['frontier-pyramid-a', 'frontier-pyramid-b', 'frontier-pyramid-c'];
          if (!Array.isArray(r.spots) || r.spots.length > 6
            || r.spots.some((s) => !isPlainObj(s) || !FLOORS.includes(s.map)
              || !isInt(s.x, 0, 40) || !isInt(s.y, 0, 40) || !['item', 'trainer'].includes(s.kind)
              || (s.item !== undefined && (typeof s.item !== 'string' || !TABLES.items.has(s.item))))) badRun = true;
        }
        if (badRun) errors.push('bad-frontier-run');
      }
    }
  }

  checkDex(data.dex, errors, summary);

  let badgeCounts = null;
  if (TABLES) badgeCounts = checkBadges(data.badges, errors, anomalies);
  // Stage F0 summary-count call (recorded in the register): the
  // summary badgeCount INCLUDES the non-null symbol slots — it is the
  // total honors count, and badgeCountFor counts symbols the same way
  // for the Frontier's own arc card; leaving them out would make a
  // Frontier-complete save report fewer badges than a Hoenn one.
  summary.badgeCount = badgeCounts ? badgeCounts.kanto + badgeCounts.orange + badgeCounts.johto + badgeCounts.hoenn + badgeCounts.sinnoh + badgeCounts.symbols : 0;

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
    if (keys.length > 200) errors.push('bad-bag-size'); // cap tracks the ITEMS table size (200 since S7's Azure Flute key item; was 199 at S6, 197 at S5b, 192 at S5a, 186 at S4, 183 at S0, 175 at F0, 168 at H4a, 160 at J6)
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
    if (typeof mt.location !== 'string' || mt.location.normalize('NFKC').length > 64 || !SAFE_LOCATION_TEXT.test(mt.location.normalize('NFKC'))) {
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
