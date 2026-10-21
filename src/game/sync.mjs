// sync.mjs — Track B cloud-save sync engine (architecture §3.3).
// Local-first: the game NEVER waits on network. Writes go to the local cache
// instantly; cloud PUTs happen in the background with a 60s idle throttle.
// Same-origin backend calls only. No silent last-write-wins: genuine divergence
// opens the conflict sheet (wireframes §9). Compiled IN for the vercel target;
// compile-time STRIPPED for the guest target (see scripts/build.mjs).
//
// ---- Output-encoding contract (AppSec C12) ----
// Player-controlled strings are rendered via textContent / createElement ONLY
// (helpers live in auth.mjs: authEl/authText). Zero innerHTML in this file.
//
// ---- Payload download (GET save?slot=N on the API) ----
// New-device pull (the hotel-phone test, US-N1) downloads the payload via
// GET save?slot=N -> {slot, version, payload, updatedAt}; 404 when the slot
// is empty. Pull paths still degrade honestly on failure (toast + keep
// local) — push, claimGuest, queue, conflict-sheet, and same-device re-login
// never block on network.

import { validateSave } from '../save/schema.mjs'; // stripped at build; global in the bundle

const SYNC = {
  activeSlot: 1,
  init(game) {},                                   // guest build: no-op
  tick(game) {},                                  // guest build: no-op
  afterLocalSave(game) {},                        // guest build: no-op
  onHidden(game) {},                              // guest build: no-op
  saveLocal(game) { return { ok: false, reason: 'guest-build' }; },
  syncNow(game, manual) { return Promise.resolve({ ok: false, reason: 'guest-build' }); },
  runLoginMerge(game, mode, done) { done({ load: 'fallback' }); },
  clearSession() {},
  getSlots() { return []; },
  localPayload(game) { return game ? game.state : null; },
  renderDot() {},
};

// __AUTH_BEGIN__
// ==================== full implementation (vercel target only) ====================
// Shared DOM/API helpers (authEl, authText, api, downloadJson, COPY) are defined
// in auth.mjs's __AUTH__ block — same concatenated script scope, call-time refs.

const Q_KEY = 'pdr.sync.queue';
const M_KEY = 'pdr.sync.meta';
const C_KEY = 'pdr.sync.cache';

function sstore() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) {}
  return null;
}
function sread(key, fb) {
  const s = sstore();
  if (!s) return fb;
  try {
    const raw = s.getItem(key);
    if (raw === null) return fb;
    return JSON.parse(raw);
  } catch (e) { return fb; }
}
function swrite(key, val) {
  const s = sstore();
  if (!s) return false;
  try { s.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}

function fmtPlay(sec) {
  sec = sec || 0;
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h + 'h ' + (m < 10 ? '0' + m : '' + m) + 'm';
}
function fmtWhen(ts) {
  if (!ts) return 'never';
  try { return new Date(ts).toLocaleString(); } catch (e) { return 'unknown'; }
}

const SYNC_IMPL = {
  _dot: null,
  _flushing: false,
  _lastFlush: 0,
  _lastFlushOk: false,
  _backoffUntil: 0,
  _pendingConflict: null,
  _cloudMeta: null,   // last GET /api/save/meta result (in-memory)
  _offline: false,

  _queue() { return sread(Q_KEY, []); },
  _saveQueue(q) { swrite(Q_KEY, q); },
  _meta() { const m = sread(M_KEY, null); return m || { lastSynced: {}, activeSlot: 1 }; },
  _saveMeta(m) { swrite(M_KEY, m); },
  _cache() { return sread(C_KEY, {}); },
  _saveCache(c) { swrite(C_KEY, c); },
  _lastSyncedVersion(slot) {
    const m = this._meta();
    return (m.lastSynced[slot] && m.lastSynced[slot].version != null) ? m.lastSynced[slot].version : 0;
  },

  init(game) {
    if (game.ui.headless || typeof document === 'undefined') return;
    this.activeSlot = (this._meta().activeSlot) || 1;
    const dot = game.ui.el('div', 'syncdot hidden', game.ui.root);
    dot.setAttribute('role', 'status');
    dot.setAttribute('aria-live', 'polite');
    const pip = game.ui.el('span', 'sdot', dot);
    const tx = game.ui.el('span', '', dot);
    this._dot = dot; this._dotTx = tx;
    this._game = game;
    const upd = () => { this._offline = !navigator.onLine; this.renderDot(); if (navigator.onLine) this.tick(game); };
    window.addEventListener('online', upd);
    window.addEventListener('offline', upd);
    this._offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    this.renderDot();
  },

  renderDot() {
    const d = this._dot;
    if (!d) return;
    if (!AUTH.user) { d.classList.add('hidden'); return; }
    d.classList.remove('hidden');
    const q = this._queue();
    let label = 'Synced', cls = 'syncdot';
    if (q.length && this._offline) { label = 'Offline — will sync'; cls = 'syncdot offline'; }
    else if (q.length) { label = 'Sync pending'; cls = 'syncdot pending'; }
    else if (!this._lastFlushOk) { label = 'Sync pending'; cls = 'syncdot pending'; }
    d.className = cls;
    authText(this._dotTx, label);
  },

  // Write the working copy to the local cloud-cache + coalesced queue entry.
  // Instant — the game never waits on network (architecture §3.3).
  saveLocal(game) {
    const slot = this.activeSlot;
    let bytes = 0;
    try { bytes = new Blob([JSON.stringify(game.state)]).size; }
    catch (e) { bytes = JSON.stringify(game.state).length; }
    if (bytes > 65536) return { ok: false, reason: 'over-budget', bytes };
    try {
      const snap = JSON.parse(JSON.stringify(game.state));
      snap.meta.updatedAt = Date.now();
      const cache = this._cache();
      cache[slot] = snap;
      this._saveCache(cache);
      // Coalesce: one queued entry per slot, always the latest full snapshot
      // (ADR-007 Decision 4(iv): conflict-sheet local side = latest queued payload).
      const q = this._queue().filter((e) => e.slot !== slot);
      q.push({ slot, payload: snap, expectedVersion: this._lastSyncedVersion(slot), queuedAt: Date.now() });
      this._saveQueue(q);
    } catch (e) { return { ok: false, reason: 'no-storage' }; }
    return { ok: true, bytes };
  },

  afterLocalSave(game) {
    this.renderDot();
    if (!AUTH.user) return;
    const now = Date.now();
    if (now - this._lastFlush >= 60000) this.flush(game); // 60s idle throttle
    // otherwise tick() flushes once 60s have elapsed since the last flush
  },

  onHidden(game) {
    // visibilitychange save point: best-effort flush (never blocks the game).
    if (AUTH.user && !this._offline) this.flush(game);
  },

  tick(game) {
    if (!AUTH.user || this._flushing) return;
    const now = Date.now();
    if (this._pendingConflict && !game.ui.inBattle && !game.ui.loginOpen && !game.ui.dialogueOpen && !game.ui.menuOpen) {
      const pc = this._pendingConflict; this._pendingConflict = null;
      this.showConflictSheet(game, pc.local, pc.cloud, pc.slot, pc.done);
      return;
    }
    if (now < this._backoffUntil) return;
    if (this._queue().length && now - this._lastFlush >= 60000 && !this._offline) this.flush(game);
  },

  syncNow(game, manual) {
    if (!AUTH.user) return Promise.resolve({ ok: false, reason: 'logged-out' });
    return this.flush(game).then((r) => {
      if (manual) {
        if (r.ok) game.ui.toast('Synced');
        else if (r.reason === 'offline') game.ui.toast('Offline — will sync when connected.');
        else if (r.reason) game.ui.toast('Sync pending — will retry.');
      }
      return r;
    });
  },

  flush(game) {
    if (this._flushing || !AUTH.user) return Promise.resolve({ ok: false, reason: 'busy' });
    const q = this._queue();
    if (!q.length) { this._lastFlushOk = true; this.renderDot(); return Promise.resolve({ ok: true, empty: true }); }
    this._flushing = true;
    this._lastFlush = Date.now();
    const entry = q[0];
    return api('save', { method: 'PUT', body: { slot: entry.slot, payload: entry.payload, expectedVersion: entry.expectedVersion } })
      .then((r) => {
        this._flushing = false;
        if (r.offline) { this._offline = true; this.renderDot(); return { ok: false, reason: 'offline' }; }
        this._offline = false;
        if (r.status === 200 && r.body) {
          q.shift(); this._saveQueue(q);
          const m = this._meta();
          m.lastSynced[entry.slot] = { version: r.body.version, updatedAt: r.body.updatedAt, syncedAt: Date.now() };
          this._saveMeta(m);
          this._lastFlushOk = true; this._backoffUntil = 0;
          this.renderDot();
          // Keep flushing the FIFO while entries remain (throttle re-arms per entry).
          if (q.length) { this._lastFlush = 0; return this.flush(game); }
          return { ok: true };
        }
        if (r.status === 409) {
          // Version conflict: stop the queue, open the conflict sheet (deferred
          // out of battle by tick()). Server truth: r.body.serverVersion (+
          // optional serverMeta if the backend includes it).
          this._lastFlushOk = false; this.renderDot();
          this.deferConflict(game, entry, r.body, () => this.flush(game));
          return { ok: false, reason: 'conflict' };
        }
        if (r.status === 422) {
          q.shift(); this._saveQueue(q); // drop the poison payload; keep previous-good local
          this.renderDot();
          game.ui.toast('Cloud save rejected — kept your local copy.');
          return { ok: false, reason: 'rejected' };
        }
        if (r.status === 413) {
          q.shift(); this._saveQueue(q);
          this.renderDot();
          game.ui.toast('Cloud save is too large — kept your local copy.');
          return { ok: false, reason: 'too-large' };
        }
        if (r.status === 429) {
          this._backoffUntil = Date.now() + 60000;
          this.renderDot();
          return { ok: false, reason: 'rate-limited' };
        }
        if (r.status === 401) { AUTH.onSessionExpired(game); return { ok: false, reason: 'expired' }; }
        if (r.status === 503 && r.body && r.body.error === 'auth_unavailable') {
          AUTH.onUnavailable();
          this.renderDot();
          return { ok: false, reason: 'unavailable' };
        }
        this.renderDot();
        return { ok: false, reason: 'error-' + r.status };
      }, () => {
        this._flushing = false;
        this._offline = true; this.renderDot();
        return { ok: false, reason: 'offline' };
      });
  },

  deferConflict(game, entry, serverBody, done) {
    // Local side = latest queued payload (full snapshot, ADR-007).
    const local = { payload: entry.payload, slot: entry.slot };
    const serverVersion = serverBody && serverBody.serverVersion;
    // Cloud meta: prefer the 409's serverMeta when present (freshest), else the
    // last meta pull. Either way the sheet never blocks on network.
    const cloudMeta = ((serverBody && serverBody.serverMeta) || null) ||
      (this._cloudMeta || []).find((m) => m.slot === entry.slot) || null;
    this.downloadPayload(entry.slot).then((dl) => {
      const cloud = { payload: dl.ok ? dl.payload : null, meta: cloudMeta, slot: entry.slot, serverVersion };
      this._pendingConflict = { local, cloud, slot: entry.slot, done: (winner) => {
        // Loser stays out of the queue; winner was already written or cached.
        const q = this._queue().filter((e) => e.slot !== entry.slot);
        this._saveQueue(q);
        this.renderDot();
        if (done) done(winner);
      } };
      this.tick(game); // show now unless mid-battle/modal
    });
  },

  // Payload download: GET /api/save?slot=N -> {slot, version, payload,
  // updatedAt}; 404 -> {ok:false, reason:'empty'}; 401/503 propagate honestly
  // (status carried for the caller).
  downloadPayload(slot) {
    return api('save?slot=' + encodeURIComponent(slot), { method: 'GET' }).then((r) => {
      if (r.offline) return { ok: false, reason: 'offline', status: r.status };
      if (r.status === 200 && r.body && r.body.payload) {
        return {
          ok: true, slot: r.body.slot, version: r.body.version,
          payload: r.body.payload, updatedAt: r.body.updatedAt,
        };
      }
      if (r.status === 404) return { ok: false, reason: 'empty', status: r.status };
      return { ok: false, reason: 'error-' + r.status, status: r.status };
    });
  },

  // ---- login merge (architecture §3.3: no silent last-write-wins, ever) ----
  runLoginMerge(game, mode, done) {
    const fallback = (why) => done({ load: 'fallback', why });
    api('save/meta', { method: 'GET' }).then((r) => {
      if (r.offline) { game.ui.toast('Could not reach cloud saves — playing on this device.'); fallback('offline'); return; }
      if (r.status === 401) { AUTH.onSessionExpired(game); fallback('expired'); return; }
      if (r.status === 503 && r.body && r.body.error === 'auth_unavailable') { AUTH.onUnavailable(); fallback('unavailable'); return; }
      if (r.status !== 200 || !Array.isArray(r.body)) { game.ui.toast('Could not reach cloud saves — playing on this device.'); fallback('error'); return; }
      this._cloudMeta = r.body;
      const slot = this.activeSlot;
      const centry = r.body.find((m) => m.slot === slot) || null;
      let guest = null;
      try {
        const s = sstore();
        const raw = s && s.getItem('pdr.save.guest');
        if (raw) { const data = JSON.parse(raw); guest = { ok: true, data }; }
      } catch (e) { guest = { ok: false }; }
      const cache = this._cache();
      const last = this._meta().lastSynced[slot];
      const localPayload = cache[slot] || null;
      const localAt = localPayload ? (localPayload.meta.updatedAt || 0) : 0;
      const dirty = this._queue().some((e) => e.slot === slot) ||
        (localPayload && localPayload.meta.updatedAt > ((last && last.syncedAt) || 0));

      if (mode === 'new') {
        if (centry) {
          this.offerNewVsCloud(game, centry, (pick) => {
            if (pick === 'cloud') this.loadCloudSlot(game, slot, centry, (st) => done(st ? { load: 'state', state: st } : { load: 'new' }));
            else done({ load: 'new' });
          });
        } else done({ load: 'new' });
        return;
      }

      // mode === 'continue'
      if (!centry && guest && guest.ok && !localPayload && !this._meta().claimed) {
        // (a) cloud empty + guest save on this device -> offer the carry.
        this.offerClaimGuest(game, guest.data, (carry) => {
          if (carry) this.claimGuest(game, guest.data, centry, (res) => done(res));
          else done({ load: 'new' });
        });
        return;
      }
      if (!centry && localPayload) {
        // Cloud empty, have a local cache (e.g. wiped server): push silently.
        this.pushPayload(game, slot, localPayload, 0, () => done({ load: 'state', state: localPayload }));
        return;
      }
      if (!centry) { done({ load: 'new' }); return; }
      if (!localPayload && !dirty) {
        this.loadCloudSlot(game, slot, centry, (st) => done(st ? { load: 'state', state: st } : { load: 'new' }));
        return;
      }
      const lastV = last ? last.version : null;
      const cloudChanged = lastV == null || centry.version !== lastV;
      if (cloudChanged && dirty) {
        // (b) genuine divergence -> conflict sheet.
        this.downloadPayload(slot).then((dl) => {
          const local = { payload: localPayload, slot };
          const cloud = { payload: dl.ok ? dl.payload : null, meta: centry, slot, serverVersion: centry.version };
          this.showConflictSheet(game, local, cloud, slot, (winner) => done({ load: 'state', state: winner }));
        });
        return;
      }
      // (c) newest wins silently.
      if (!localPayload || centry.updatedAt >= localAt) {
        this.loadCloudSlot(game, slot, centry, (st) => done(st ? { load: 'state', state: st } : { load: 'state', state: localPayload }));
      } else {
        this.pushPayload(game, slot, localPayload, centry.version, () => done({ load: 'state', state: localPayload }));
      }
    });
  },

  loadCloudSlot(game, slot, centry, done) {
    // Prefer the local cache when its version matches the server (no download
    // needed — covers same-device re-login without the payload endpoint).
    const cache = this._cache();
    const last = this._meta().lastSynced[slot];
    if (cache[slot] && last && last.version === centry.version) {
      if (this.validPayload(cache[slot])) { done(cache[slot]); return; }
    }
    this.downloadPayload(slot).then((dl) => {
      if (dl.ok && this.validPayload(dl.payload)) {
        const c = this._cache(); c[slot] = dl.payload; this._saveCache(c);
        const m = this._meta();
        m.lastSynced[slot] = { version: centry.version, updatedAt: centry.updatedAt, syncedAt: Date.now() };
        this._saveMeta(m);
        done(dl.payload);
        return;
      }
      // Download failed or the payload was invalid — the cloud copy exists
      // but we can't load it. Keep playing on this device.
      game.ui.toast('Could not download the cloud save — playing on this device for now.');
      done(null);
    });
  },

  validPayload(p) {
    try { return validateSave(p).ok; } catch (e) { return false; }
  },

  pushPayload(game, slot, payload, expectedVersion, done) {
    api('save', { method: 'PUT', body: { slot, payload, expectedVersion } }).then((r) => {
      if (r.offline) { this._offline = true; this.renderDot(); done({ queued: true }); return; }
      if (r.status === 200 && r.body) {
        const m = this._meta();
        m.lastSynced[slot] = { version: r.body.version, updatedAt: r.body.updatedAt, syncedAt: Date.now() };
        this._saveMeta(m);
        const q = this._queue().filter((e) => e.slot !== slot);
        this._saveQueue(q);
        this._lastFlushOk = true; this.renderDot();
        done({ ok: true });
        return;
      }
      if (r.status === 409) {
        const local = { payload, slot };
        this.downloadPayload(slot).then((dl) => {
          const centry = (this._cloudMeta || []).find((mm) => mm.slot === slot) || null;
          const cloud = { payload: dl.ok ? dl.payload : null, meta: centry, slot, serverVersion: r.body && r.body.serverVersion };
          this.showConflictSheet(game, local, cloud, slot, () => done({ ok: true }));
        });
        return;
      }
      if (r.status === 422) { game.ui.toast('Cloud save rejected — kept your local copy.'); done({ kept: true }); return; }
      if (r.status === 413) { game.ui.toast('Cloud save is too large — kept your local copy.'); done({ kept: true }); return; }
      if (r.status === 401) { AUTH.onSessionExpired(game); done({ expired: true }); return; }
      // Anything else: queue it; the background flush will retry.
      const q = this._queue().filter((e) => e.slot !== slot);
      q.push({ slot, payload, expectedVersion, queuedAt: Date.now() });
      this._saveQueue(q);
      this.renderDot();
      done({ queued: true });
    });
  },

  claimGuest(game, guestSave, centry, done) {
    // Guest -> registered migration (US-G2): write once to slot 1, idempotent
    // via expectedVersion 0 (CAS: fails if the slot is no longer empty).
    api('save', { method: 'PUT', body: { slot: 1, payload: guestSave, expectedVersion: 0 } }).then((r) => {
      if (r.offline) { game.ui.toast('Offline — your guest save is queued for upload.'); done({ load: 'state', state: guestSave }); return; }
      if (r.status === 200 && r.body) {
        const c = this._cache(); c[1] = guestSave; this._saveCache(c);
        const m = this._meta();
        m.lastSynced[1] = { version: r.body.version, updatedAt: r.body.updatedAt, syncedAt: Date.now() };
        m.claimed = true;
        this._saveMeta(m);
        this._lastFlushOk = true; this.renderDot();
        game.ui.toast('Guest save carried to your account.');
        done({ load: 'state', state: guestSave });
        return;
      }
      if (r.status === 409) {
        // Someone claimed the slot concurrently -> conflict sheet.
        const local = { payload: guestSave, slot: 1 };
        const cm = (this._cloudMeta || []).find((mm) => mm.slot === 1) || centry;
        this.downloadPayload(1).then((dl) => {
          const cloud = { payload: dl.ok ? dl.payload : null, meta: cm, slot: 1, serverVersion: r.body && r.body.serverVersion };
          this.showConflictSheet(game, local, cloud, 1, (winner) => done({ load: 'state', state: winner }));
        });
        return;
      }
      game.ui.toast('Could not carry the guest save — playing on this device.');
      done({ load: 'state', state: guestSave });
    });
  },

  // ---- login-time modals ----
  modalShell(ui, title) {
    const ov = authEl('div', 'loginover', ui.root);
    ov.style.zIndex = '55';
    const card = authEl('div', 'authcard', ov);
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
    const head = authEl('div', 'authhead', card); authText(head, title);
    const pane = authEl('div', 'authpane', card);
    const close = () => { if (ov.parentNode) ov.parentNode.removeChild(ov); };
    return { ov, pane, close };
  },

  offerClaimGuest(game, guestSave, cb) {
    const { pane, close } = this.modalShell(game.ui, 'CARRY YOUR SAVE?');
    const p = guestSave.player || {};
    const t = authEl('div', 'authsub', pane);
    authText(t, 'We found a guest save on this device (' +
      fmtPlay(p.playtimeSec || (guestSave.meta && guestSave.meta.playtimeSec) || 0) + ', ' +
      ((guestSave.badges && guestSave.badges.kanto && guestSave.badges.kanto.length) || 0) +
      ' badges). Carry it to your account\u2019s Slot 1?');
    const yes = authEl('button', 'authgo', pane); authText(yes, 'CARRY MY SAVE');
    const no = authEl('button', 'authgo ghost', pane); authText(no, 'START FRESH');
    yes.addEventListener('click', () => { close(); cb(true); });
    no.addEventListener('click', () => { close(); cb(false); });
    yes.focus();
  },

  offerNewVsCloud(game, centry, cb) {
    const { pane, close } = this.modalShell(game.ui, 'CLOUD SAVE FOUND');
    const t = authEl('div', 'authsub', pane);
    authText(t, 'This account already has a cloud save (' + fmtPlay(centry.playtimeSec) +
      ', ' + (centry.badgeCount || 0) + ' badges, saved ' + fmtWhen(centry.updatedAt) + ').');
    const c = authEl('button', 'authgo', pane); authText(c, 'CONTINUE MY JOURNEY');
    const n = authEl('button', 'authgo ghost', pane); authText(n, 'START BRAND-NEW');
    c.addEventListener('click', () => { close(); cb('cloud'); });
    n.addEventListener('click', () => { close(); cb('new'); });
    c.focus();
  },

  // ---- conflict sheet (wireframes §9): meta both sides, explicit choice ----
  showConflictSheet(game, local, cloud, slot, done) {
    const ui = game.ui;
    const { pane, close } = this.modalShell(ui, 'SYNC CONFLICT');
    const t = authEl('div', 'authsub', pane);
    authText(t, 'This save changed in two places. Pick which copy to keep — the other is offered as a download. Nothing is overwritten silently.');
    const cols = authEl('div', 'confcols', pane);
    const lp = (local && local.payload) || {};
    const lm = (lp.meta) || {};
    const cm = (cloud && cloud.meta) || {};
    const mkCol = (title, playSec, beat, badges, when, extra) => {
      const c = authEl('div', 'confcol', cols);
      const h4 = authEl('h4', '', c); authText(h4, title);
      const rows = [
        'Playtime: ' + fmtPlay(playSec),
        'Story beat: ' + (beat == null ? '—' : beat),
        'Badges: ' + (badges == null ? '—' : badges),
        'Saved: ' + fmtWhen(when),
      ];
      if (extra) rows.push(extra);
      rows.forEach((r) => { const d = authEl('div', '', c); authText(d, r); });
      return c;
    };
    const lcol = mkCol('THIS DEVICE',
      (lp.player && lp.player.playtimeSec) || lm.playtimeSec || 0,
      (lp.meta && lp.meta.location) || null, // human-readable story beat: where that save is
      ((lp.badges && lp.badges.kanto && lp.badges.kanto.length) || 0),
      lm.updatedAt || (lp.meta && lp.meta.updatedAt));
    const ccol = mkCol('CLOUD SAVE', cm.playtimeSec, cm.storyBeat, cm.badgeCount, cm.updatedAt,
      cloud.payload ? null : 'Full copy could not be downloaded');
    const pickL = authEl('button', 'authgo pick', lcol); authText(pickL, "KEEP THIS DEVICE'S");
    const pickC = authEl('button', 'authgo pick', ccol); authText(pickC, "KEEP CLOUD'S");
    if (!cloud.payload) { pickC.disabled = true; } // can't keep a cloud copy we couldn't download

    const finish = (winner, loser, loserLabel) => {
      while (pane.firstChild) pane.removeChild(pane.firstChild);
      const d = authEl('div', 'authsub', pane);
      authText(d, 'Kept ' + (winner === 'local' ? "this device's" : 'the cloud') + ' copy.');
      if (loser) {
        const dl = authEl('button', 'authgo sec', pane);
        authText(dl, 'DOWNLOAD ' + loserLabel + ' COPY (JSON)');
        dl.addEventListener('click', () => {
          downloadJson('ashs-journey-' + loserLabel.toLowerCase().replace(/\s+/g, '-') + '-backup.json', loser);
          ui.toast('Backup downloaded.');
        });
      }
      const okb = authEl('button', 'authgo ghost', pane); authText(okb, 'DONE');
      okb.addEventListener('click', () => { close(); done(winner === 'local' ? local.payload : cloud.payload); });
      okb.focus();
    };

    pickL.addEventListener('click', () => {
      // Keep local: push with the server's version as the CAS token.
      this.pushPayload(game, slot, local.payload, cloud.serverVersion != null ? cloud.serverVersion : 0, () => {
        finish('local', cloud.payload, 'CLOUD');
      });
    });
    pickC.addEventListener('click', () => {
      if (!cloud.payload) return;
      const c = this._cache(); c[slot] = cloud.payload; this._saveCache(c);
      const m = this._meta();
      m.lastSynced[slot] = { version: cloud.serverVersion, updatedAt: cm.updatedAt, syncedAt: Date.now() };
      this._saveMeta(m);
      finish('cloud', local.payload, 'DEVICE');
    });
    pickL.focus();
  },

  // ---- misc ----
  getSlots() {
    // For the in-game Save screen: per-slot state from cloud meta + local cache.
    const out = [];
    const cache = this._cache();
    const q = this._queue();
    for (let slot = 1; slot <= 3; slot++) {
      const cm = (this._cloudMeta || []).find((m) => m.slot === slot) || null;
      const cp = cache[slot] || null;
      const pending = q.some((e) => e.slot === slot);
      out.push({
        slot,
        active: slot === this.activeSlot,
        cloudMeta: cm,
        hasLocal: !!cp,
        pending,
        playtimeSec: cm ? cm.playtimeSec : (cp && cp.player ? cp.player.playtimeSec : 0),
        badgeCount: cm ? cm.badgeCount : (cp && cp.badges ? cp.badges.kanto.length : 0),
        updatedAt: cm ? cm.updatedAt : (cp && cp.meta ? cp.meta.updatedAt : 0),
      });
    }
    return out;
  },

  setActiveSlot(n) {
    this.activeSlot = n;
    const m = this._meta(); m.activeSlot = n; this._saveMeta(m);
  },

  localPayload(game) {
    const c = this._cache();
    return c[this.activeSlot] || (game ? game.state : null);
  },

  clearSession() {
    try {
      const s = sstore();
      if (s) { s.removeItem(Q_KEY); s.removeItem(M_KEY); s.removeItem(C_KEY); }
    } catch (e) {}
    this._cloudMeta = null;
    this._pendingConflict = null;
    this._lastFlushOk = false;
    this._backoffUntil = 0;
    this.activeSlot = 1;
    this.renderDot();
  },
};

Object.assign(SYNC, SYNC_IMPL);
SYNC.activeSlot = 1;

// __AUTH_END__
