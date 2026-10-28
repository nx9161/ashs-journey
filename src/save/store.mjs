// store.mjs — guest localStorage save store (Track A).
// Versioned JSON, quota-exceeded guard, export-before-overwrite (PRD edge 9).

import { SAVE_KEY, validateSave, migrate, saveSizeBytes } from './schema.mjs';
import { defaultState } from '../game/state.mjs';

function storage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) { /* fall through */ }
  return null;
}

export class SaveStore {
  constructor() {
    this.lastError = null;
  }

  exists() {
    const s = storage();
    if (!s) return false;
    return s.getItem(SAVE_KEY) !== null;
  }

  load() {
    const s = storage();
    if (!s) return { ok: false, reason: 'no-storage' };
    const raw = s.getItem(SAVE_KEY);
    if (raw === null) return { ok: false, reason: 'empty' };
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, reason: 'corrupt-json' }; }
    data = migrate(data);
    const v = validateSave(data);
    if (!v.ok) return { ok: false, reason: 'invalid', errors: v.errors };
    return { ok: true, data };
  }

  save(state) {
    const s = storage();
    if (!s) { this.lastError = 'no-storage'; return { ok: false, reason: 'no-storage' }; }
    state.meta.updatedAt = Date.now();
    const bytes = saveSizeBytes(state);
    if (bytes > 65536) { this.lastError = 'over-budget'; return { ok: false, reason: 'over-budget', bytes }; }
    try {
      s.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      // Quota guard: never silently overwrite — surface + offer export.
      this.lastError = 'quota';
      return { ok: false, reason: 'quota', exportPayload: JSON.stringify(state) };
    }
    return { ok: true, bytes };
  }

  erase() {
    const s = storage();
    if (s) s.removeItem(SAVE_KEY);
  }

  exportFile(state) {
    return JSON.stringify(state);
  }
}

export function freshState(inherit) {
  const st = defaultState(inherit);
  st.meta.createdAt = Date.now();
  st.meta.updatedAt = Date.now();
  return st;
}
