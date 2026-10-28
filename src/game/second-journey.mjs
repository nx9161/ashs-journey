// ---------- ADR-025 §6 (Phase 6): Second Journey creation ----------
// The New Game+ flow. A "Second Journey" begins from a COMPLETED save
// (state.mjs isCompletedRun: its own Hall of Fame entry, or Kanto in
// regionsDone) and inherits exactly what §6 allows — dex records, the
// keepsake collection, Traveler's Memory, starter breadth, the bond
// echo, prior HoF teams, and meta.ngPlus + 1 — all applied inside
// defaultState(inherit). The SOURCE SLOT IS NEVER MODIFIED: sources
// are read as raw stored bytes, deep-cloned, and migrated in memory;
// nothing in this module ever writes a source slot.
import { isCompletedRun } from './state.mjs';
import { freshState } from '../save/store.mjs';
import { migrate, SAVE_KEY } from '../save/schema.mjs';

export const SYNC_CACHE_KEY = 'pdr.sync.cache';

// Read every locally-held save (the guest slot + the cloud session
// cache's three slots), each migrated in memory. Returns
// [{ key, label, state }] — `state` is a fresh object the caller may
// hand to defaultState(inherit); the stored bytes are untouched.
export function readLocalSaves() {
  const out = [];
  const push = (key, label, raw) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const st = migrate(parsed && parsed.state ? parsed.state : parsed);
      if (st && typeof st === 'object') out.push({ key, label, state: st });
    } catch (e) { /* a corrupt slot simply does not offer a journey */ }
  };
  try {
    push('guest', 'This device', localStorage.getItem(SAVE_KEY));
    const cache = JSON.parse(localStorage.getItem(SYNC_CACHE_KEY) || 'null');
    if (cache && cache.slots) {
      for (const n of [1, 2, 3]) {
        const s = cache.slots[n];
        if (s && s.state) push('slot' + n, 'Save slot ' + n, JSON.stringify(s.state));
      }
    }
  } catch (e) { /* storage unavailable — no sources, no row */ }
  return out;
}

// The completed saves a Second Journey may begin from.
export function completedSources() {
  return readLocalSaves().filter((s) => isCompletedRun(s.state));
}

// Any completed save at all? (The title's unlock condition.)
export function hasCompletedSave() {
  return completedSources().length > 0;
}

if (typeof Game !== 'undefined') Object.assign(Game.prototype, {
  // The creation flow, entered from the title's Second Journey row
  // after the Trainer ID Terminal (guests pass straight through).
  // Pick the source (when several qualify), then the target slot,
  // then begin — the same intro a normal New Game plays, on a state
  // built by defaultState(inherit). Difficulty is chosen exactly the
  // way newGame() does (the current run's difficulty carries into the
  // intro's difficulty step); House Rules are settings and persist.
  secondJourney() {
    const g = this;
    const sources = completedSources();
    if (!sources.length) { g.startTitle(); return; }
    const pickSource = (src) => {
      const targets = [];
      for (const n of [1, 2, 3]) {
        if (src.key !== 'slot' + n) targets.push({ label: 'Save slot ' + n, value: n });
      }
      // The guest build has exactly one shipped slot; its target is
      // that slot. Creation itself never writes the source — the new
      // run's first save (at the intro's end) is what lands there.
      if (src.key === 'guest' || typeof SYNC === 'undefined' || typeof SYNC.setActiveSlot !== 'function') {
        begin(src, null);
        return;
      }
      if (targets.length === 1) { begin(src, targets[0].value); return; }
      g.ui.showMenu('Begin the Second Journey in...', [...targets, { label: 'Back', value: null }], (v) => {
        if (v === null || v === undefined) { g.startTitle(); return; }
        begin(src, v);
      });
    };
    const begin = (src, targetSlot) => {
      if (typeof targetSlot === 'number' && typeof SYNC !== 'undefined' && typeof SYNC.setActiveSlot === 'function') {
        try { SYNC.setActiveSlot(targetSlot); } catch (e) { /* cache-only concern */ }
      }
      g.beginSecondJourney(src.state);
    };
    if (sources.length === 1) { pickSource(sources[0]); return; }
    const items = sources.map((s, i) => ({
      label: s.label + ' — Journey ' + (((s.state.meta && s.state.meta.ngPlus) || 0) + 1) + ' complete', value: i,
    }));
    items.push({ label: 'Back', value: null });
    g.ui.showMenu('Begin again from which completed journey?', items, (v) => {
      if (v === null || v === undefined) { g.startTitle(); return; }
      pickSource(sources[v]);
    });
  },

  // Mirrors newGame() line for line, on an inherited state: settings
  // kept (House Rules are settings and persist), difficulty from the
  // current run exactly as newGame() takes it, veteran skip-intro.
  beginSecondJourney(sourceState) {
    const g = this;
    const keepSettings = g.state && g.state.settings;
    const keepDifficulty = (typeof difficultyOf === 'function' && g.state) ? difficultyOf(g.state) : 'classic';
    g.state = freshState(sourceState);
    if (keepSettings) g.state.settings = keepSettings;
    if (typeof g.applyKeymap === 'function') g.applyKeymap();
    g.state.story.difficulty = keepDifficulty;
    if (typeof activeHouseRules === 'function' && activeHouseRules(g.state).length) {
      g.state.meta.houseRulesTouched = true;
    }
    g.state.player.name = 'ASH';
    g.state.player.rivalName = 'GARY';
    if (typeof makeRngStreams === 'function' && typeof nextSeed === 'function') g.rng = makeRngStreams(nextSeed());
    g.skipIntroVeteran = true; // a returning champion may skip the intro
    g.scenes.replace(new IntroScene());
    g.ui.toast('A Second Journey begins.');
  },
});
