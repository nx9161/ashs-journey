// auth.mjs — Track B client: Trainer ID Terminal (login/register/guest) + account menu.
// ADR-005 (accounts + cloud saves) / ADR-010 (guest-first boot, username-only +
// synthetic emails server-side, recovery codes, 13+ age gate, 7d/1d sessions).
// Same-origin API calls ONLY (our own backend paths); the client never touches
// session tokens — the session cookie is HttpOnly and server-managed (AppSec C4).
// No secrets in this file.
// Compiled IN for the vercel target; compile-time STRIPPED for the guest target
// (see scripts/build.mjs — the auth block markers plus the boolean compile flag).
//
// ---- Output-encoding contract (AppSec C12) ----
// EVERY player-controlled string (usernames, recovery codes, any echoed input)
// is rendered via textContent / createElement ONLY — never innerHTML, never
// string-concatenated HTML. This file performs zero innerHTML assignments.
// The QA stored-XSS corpus covers the login/register/recovery/account surfaces.

const AUTH_ENABLED = /*__AUTH_ENABLED__*/;

// ---- stub surface: compiled into BOTH targets (the guest bundle keeps only this) ----
// Guest behavior is byte-identical to Track A: the terminal is absent, so the
// login path degrades straight to guest. Zero network, zero auth code.
const AUTH = {
  user: null,          // logged-in username, or null
  unavailable: false,  // backend reports auth_unavailable (503 / health flag)
  _bannerShown: false,
  init(game) {},                                    // guest build: no-op (no network)
  showLoginPanel(ui, game, cb) { cb('guest'); },    // guest build: straight to guest
  enhanceGuestBanner(ui) {},                        // guest build: no-op
  openAccountMenu(game) {},                         // guest build: no-op
  signOut(game) { return Promise.resolve({ ok: false, reason: 'guest-build' }); },
  isLoggedIn() { return false; },
  onSessionExpired(game) {},                        // guest build: no sessions exist
  onUnavailable() {},                               // guest build: nothing to announce
};

// __AUTH_BEGIN__
// ==================== full implementation (vercel target only) ====================

// DOM helpers (textContent-only per the C12 contract above).
function authEl(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}
function authText(elm, str) { elm.textContent = (str === null || str === undefined) ? '' : String(str); }

// Same-origin JSON API. The session cookie is HttpOnly — the client never reads
// or writes tokens (AppSec C4). Returns {status, body, offline}.
// NOTE: the '/api/' prefix is a string literal (not built dynamically) so the
// contamination scan can statically verify same-origin-only fetches.
function api(path, opts) {
  opts = opts || {};
  return fetch('/api/' + path, {
    method: opts.method || 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(async (res) => {
    let body = null;
    try { body = await res.json(); } catch (e) { /* empty / non-JSON */ }
    return { status: res.status, body };
  }).catch(() => ({ status: 0, body: null, offline: true }));
}

function fmtClock(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return (m < 10 ? '0' + m : '' + m) + ':' + (s < 10 ? '0' + s : '' + s);
}

// ---- validation (client-side; the server re-validates everything) ----
const USER_RE = /^[a-z0-9_]{3,16}$/;
function validUsername(v) { return USER_RE.test(v); }
function pwStrength(pw) {
  if (!pw || pw.length < 8) return { label: 'Too short — use 8+ characters.', cls: '' };
  let score = 0;
  if (pw.length >= 12) score += 2; else if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score >= 4) return { label: 'Strong', cls: 'strong' };
  if (score >= 2) return { label: 'Fair', cls: 'fair' };
  return { label: 'Weak', cls: '' };
}

// ---- generic (non-enumerating) copy — never distinguishes failure reasons ----
const COPY = {
  loginFail: 'Invalid username or password.',
  registerFail: "Couldn't create that account — try a different username.",
  recoverFail: "Couldn't reset with those details — check the code and try again.",
  recoverOk: 'Password reset — you can log in with your new password.',
  rateLimit: 'Too many attempts — try again in a bit.',
  offline: "You're offline — guest mode available, cloud sync paused.",
};

// Privacy notice + Terms — DRAFT text from Tech Law §6 contents.
// MARKED DRAFT-PENDING-GC-WORDING: GC + licensed counsel must review before launch.
const PRIVACY_DRAFT = [
  ['Status', 'DRAFT — pending GC + licensed-counsel review. This is not final legal text.'],
  ['1. Who runs this', 'This fan game is operated by its developer. Contact: [to be designated by the project owner before launch].'],
  ['2. What we store and why',
    'Your username — a public handle. Pick one that is not your real name.\n' +
    'Your password — stored only as a salted one-way hash. We never see or store the password itself.\n' +
    'Your cloud saves — party, boxes, dex progress, badges, story progress, settings, and the trainer/rival names you type. Used only to sync your game between devices.\n' +
    'Timestamps — when saves were updated and when you last logged in. Used to order saves and show sync state.\n' +
    'Security records — login-attempt records (including IP addresses), kept 30 days, used only to block abuse.\n' +
    'Session records — used to keep you logged in; deleted when you log out.\n' +
    'Our hosts\u2019 server logs (see below).'],
  ['3. Who else handles your data', 'Two subprocessors, no one else:\nSupabase — database hosting for accounts, saves, and security records; automated backups.\nVercel — website hosting and the server functions that run login and saves; function logs.\nWe sell no data. There is no analytics, tracking, or advertising — ever.'],
  ['4. How long we keep it',
    'Accounts and cloud saves: until you delete them. Security records: 30 days.\n' +
    'If you delete your account, it is erased from all live systems immediately; residual encrypted backup copies expire within the backup retention window (7 days or less) and are never restored except in a disaster-recovery event, after which the deletion is re-applied.'],
  ['5. Your rights', '\u201CMy data\u201D in the account menu shows your account record and lets you download your saves. \u201CDelete account\u201D erases your account and cloud saves.'],
  ['6. Age', 'Accounts are for players 13 and older. Under 13? Play as a guest — guest saves never leave your device.'],
  ['7. Fan work', 'This is an unofficial fan homage. The full legal notice is on the title screen and credits — please read it.'],
  ['8. Changes', 'If this notice changes, we will announce it in-game.'],
  ['TERMS OF PLAY — DRAFT',
    'This is a free, non-commercial fan project. No purchases, donations, or payments of any kind.\n' +
    'Usernames are public — pick a handle, not your real name.\n' +
    'Accounts unused for 24 months may be deleted after a 30-day warning shown at your next login.\n' +
    'Play fair: tampered save data is rejected, and suspicious saves may be logged for review.\n' +
    'Be kind: usernames that impersonate others or are offensive may be removed.'],
];

function copyText(t, done) {
  const fb = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { /* clipboard unavailable */ }
    if (done) done();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(done, fb);
  } else fb();
}

function downloadJson(filename, obj) {
  try {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  } catch (e) { /* download unavailable */ }
}

// ---- the Trainer ID Terminal (full) ----
function showLoginPanel(ui, game, cb) {
  if (ui.headless) { cb('guest'); return; }
  ui.loginOpen = true;
  const ov = authEl('div', 'loginover', ui.root);
  ui._loginOv = ov;
  const card = authEl('div', 'authcard', ov);
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'Trainer ID Terminal');
  const head = authEl('div', 'authhead', card);
  authText(head, 'TRAINER ID TERMINAL');
  const sub = authEl('div', 'authsub', card);
  authText(sub, 'Log in to sync your journey across devices.');

  const tabsEl = authEl('div', 'authtabs', card);
  tabsEl.setAttribute('role', 'tablist');
  tabsEl.setAttribute('aria-label', 'Account options');
  const panesEl = authEl('div', 'authpanes', card);

  const panes = {};   // name -> section element
  const tabBtns = {}; // name -> button
  const order = ['login', 'register', 'guest'];
  const labels = { login: 'LOG IN', register: 'REGISTER', guest: 'GUEST' };
  let current = 'guest'; // guest-first boot (ADR-010 OQ-7)

  function setTab(name) {
    current = name;
    order.forEach((n, i) => {
      const sel = n === name;
      tabBtns[n].setAttribute('aria-selected', sel ? 'true' : 'false');
      tabBtns[n].tabIndex = sel ? 0 : -1;
      tabBtns[n].classList.toggle('sel', sel);
      panes[n].classList.toggle('hidden', !sel);
      panes[n].setAttribute('aria-hidden', sel ? 'false' : 'true');
    });
    // Focus the primary control of the newly shown pane (keyboard flow).
    const f = panes[name].querySelector('input:not([disabled]),button.authgo');
    if (f) f.focus();
  }

  order.forEach((n) => {
    const b = authEl('button', 'authtab', tabsEl);
    b.setAttribute('role', 'tab');
    b.id = 'authtab-' + n;
    authText(b, labels[n]);
    b.addEventListener('click', () => setTab(n));
    b.addEventListener('keydown', (e) => {
      const i = order.indexOf(n);
      if (e.key === 'ArrowRight') { e.preventDefault(); const nx = order[(i + 1) % order.length]; setTab(nx); tabBtns[nx].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); const pv = order[(i + order.length - 1) % order.length]; setTab(pv); tabBtns[pv].focus(); }
    });
    tabBtns[n] = b;
    const p = authEl('section', 'authpane hidden', panesEl);
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', b.id);
    panes[n] = p;
  });

  function errBox(pane) {
    const e = authEl('div', 'autherr hidden', pane);
    e.setAttribute('role', 'alert');
    return {
      show(msg) { authText(e, msg); e.classList.remove('hidden'); },
      hide() { e.classList.add('hidden'); authText(e, ''); },
    };
  }
  function close() {
    ui.loginOpen = false;
    document.removeEventListener('keydown', onKey, true);
    if (rlTimer) clearInterval(rlTimer);
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    ui._loginOv = null;
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      // The recovery-codes screen must not be escapable: the codes are shown
      // exactly once, and closing early would strand the account.
      if (!panes.codes || panes.codes.classList.contains('hidden')) { e.preventDefault(); close(); }
    }
  }
  document.addEventListener('keydown', onKey, true);
  let rlTimer = null;

  // ---------- LOG IN pane ----------
  (function buildLogin() {
    const p = panes.login;
    const err = errBox(p);
    const fUser = authEl('form', '', p);
    fUser.setAttribute('aria-label', 'Log in');
    const lu = authEl('label', 'authfield', fUser);
    authText(lu, 'Username');
    const inU = authEl('input', 'authin', lu);
    inU.type = 'text'; inU.autocomplete = 'username'; inU.autocapitalize = 'off';
    inU.spellcheck = false; inU.maxLength = 16;
    inU.setAttribute('aria-label', 'Username');
    const lp = authEl('label', 'authfield', fUser);
    authText(lp, 'Password');
    const prow = authEl('div', 'authrow', lp);
    const inP = authEl('input', 'authin', prow);
    inP.type = 'password'; inP.autocomplete = 'current-password';
    inP.style.flex = '1';
    inP.setAttribute('aria-label', 'Password');
    const show = authEl('button', 'authshow', prow);
    show.type = 'button'; authText(show, 'Show');
    show.setAttribute('aria-pressed', 'false');
    show.setAttribute('aria-label', 'Show password');
    show.addEventListener('click', () => {
      const pw = inP.type === 'password';
      inP.type = pw ? 'text' : 'password';
      authText(show, pw ? 'Hide' : 'Show');
      show.setAttribute('aria-pressed', pw ? 'true' : 'false');
    });
    const go = authEl('button', 'authgo', fUser);
    go.type = 'submit'; authText(go, 'LOG IN');
    const fg = authEl('button', 'authlink', p);
    authText(fg, 'Forgot password?');
    fg.addEventListener('click', () => setTabExtra('recover'));

    const setLocked = (locked, secs) => {
      [inU, inP, go].forEach((c) => { c.disabled = locked; });
      if (locked) {
        authText(go, 'Try again in ' + fmtClock(secs));
        rlTimer = setInterval(() => {
          secs--;
          if (secs <= 0) { clearInterval(rlTimer); rlTimer = null; setLocked(false, 0); err.hide(); authText(go, 'LOG IN'); }
          else authText(go, 'Try again in ' + fmtClock(secs));
        }, 1000);
      } else authText(go, 'LOG IN');
    };

    fUser.addEventListener('submit', (e) => {
      e.preventDefault();
      err.hide();
      const u = inU.value.trim().toLowerCase(), pw = inP.value;
      if (!u || !pw) { err.show(COPY.loginFail); return; }
      go.disabled = true; authText(go, 'LOGGING IN…');
      api('auth/sign-in/username', { method: 'POST', body: { username: u, password: pw } }).then((r) => {
        go.disabled = false; authText(go, 'LOG IN');
        if (r.offline) { err.show(COPY.offline); setTab('guest'); return; }
        if (r.status === 503 && r.body && r.body.error === 'auth_unavailable') { AUTH.onUnavailable(); err.show('Online accounts aren\u2019t set up yet — you can still play as a guest.'); return; }
        if (r.status === 429) { err.show(COPY.rateLimit); setLocked(true, 120); return; }
        if (r.status !== 200) { err.show(COPY.loginFail); return; } // generic, always (anti-enumeration)
        const username = (r.body && r.body.user && r.body.user.username) || u;
        close();
        cb('login', { username });
      });
    });
  })();

  // ---------- REGISTER pane ----------
  (function buildRegister() {
    const p = panes.register;
    const err = errBox(p);
    const hy = authEl('div', 'authhint', p);
    authText(hy, 'Usernames are public — pick a handle, not your real name.');
    const f = authEl('form', '', p);
    f.setAttribute('aria-label', 'Create account');

    const lu = authEl('label', 'authfield', f);
    authText(lu, 'Username');
    const inU = authEl('input', 'authin', lu);
    inU.type = 'text'; inU.autocomplete = 'username'; inU.autocapitalize = 'off';
    inU.spellcheck = false; inU.maxLength = 16;
    inU.setAttribute('aria-label', 'Username');
    const uh = authEl('div', 'authhint', f);
    authText(uh, '3–16 characters: lowercase letters, numbers, _ only.');

    const lp = authEl('label', 'authfield', f);
    authText(lp, 'Password');
    const prow = authEl('div', 'authrow', lp);
    const inP = authEl('input', 'authin', prow);
    inP.type = 'password'; inP.autocomplete = 'new-password'; inP.style.flex = '1';
    inP.setAttribute('aria-label', 'Password');
    const show = authEl('button', 'authshow', prow);
    show.type = 'button'; authText(show, 'Show'); show.setAttribute('aria-pressed', 'false');
    show.setAttribute('aria-label', 'Show password');
    show.addEventListener('click', () => {
      const pw = inP.type === 'password';
      inP.type = pw ? 'text' : 'password';
      authText(show, pw ? 'Hide' : 'Show');
      show.setAttribute('aria-pressed', pw ? 'true' : 'false');
    });
    const meter = authEl('div', 'pwmeter', f);
    const mfill = authEl('span', '', authEl('span', 'bar', meter));
    mfill.className = 'fill';
    const mlabel = authEl('span', '', meter);

    const lc = authEl('label', 'authfield', f);
    authText(lc, 'Confirm password');
    const inC = authEl('input', 'authin', lc);
    inC.type = 'password'; inC.autocomplete = 'new-password';
    inC.setAttribute('aria-label', 'Confirm password');
    const ch = authEl('div', 'authhint', f);

    const age = authEl('label', 'authcheck', f);
    const ageBox = authEl('input', '', age);
    ageBox.type = 'checkbox';
    const ageTx = authEl('span', '', age);
    authText(ageTx, 'I confirm I am 13 years of age or older.');
    // NOTE: the checkbox state is never persisted anywhere. Only the required
    // `ageConfirmed: true` attestation travels with the signup call itself.

    const pr = authEl('button', 'authlink', f);
    pr.type = 'button';
    authText(pr, 'Read the privacy notice and terms (draft)');
    const agreed = { v: false };
    pr.addEventListener('click', () => openPrivacyModal(ov, () => {
      agreed.v = true;
      authText(pr, 'Privacy notice and terms — agreed');
      validate();
    }));

    const refuse = authEl('div', 'autherr hidden', f);
    authText(refuse, 'Accounts need you to be 13 or older — you can still play as a guest!');
    const refuseGo = authEl('button', 'authgo ghost hidden', f);
    refuseGo.type = 'button'; authText(refuseGo, 'PLAY AS GUEST');
    refuseGo.addEventListener('click', () => { close(); cb('guest'); });

    const go = authEl('button', 'authgo', f);
    go.type = 'submit'; authText(go, 'CREATE ACCOUNT');

    inU.addEventListener('input', () => {
      const v = inU.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16);
      if (v !== inU.value) inU.value = v;
      if (!v) { authText(uh, '3–16 characters: lowercase letters, numbers, _ only.'); uh.classList.remove('ok'); }
      else if (!validUsername(v)) { authText(uh, 'Keep going — 3–16 characters of a–z, 0–9, _.'); uh.classList.remove('ok'); }
      else { authText(uh, 'Looks good — this will be your public handle.'); uh.classList.add('ok'); }
      validate();
    });
    const pwUpdate = () => {
      const s = pwStrength(inP.value);
      authText(mlabel, s.label);
      meter.className = 'pwmeter' + (s.cls ? ' ' + s.cls : '');
      const match = inC.value && inP.value === inC.value;
      authText(ch, inC.value ? (match ? 'Passwords match.' : "Passwords don't match.") : '');
      ch.classList.toggle('ok', !!match);
      validate();
    };
    inP.addEventListener('input', pwUpdate);
    inC.addEventListener('input', pwUpdate);

    function validate() {
      const okU = validUsername(inU.value);
      const okP = inP.value.length >= 8;
      const okC = inC.value === inP.value && inC.value.length > 0;
      go.disabled = !(okU && okP && okC && agreed.v);
      return okU && okP && okC;
    }
    ageBox.addEventListener('change', validate);
    validate();

    f.addEventListener('submit', (e) => {
      e.preventDefault();
      err.hide();
      refuse.classList.add('hidden'); refuseGo.classList.add('hidden');
      if (!ageBox.checked) {
        // Refusal path: honest copy + a guest button. The answer is not stored.
        refuse.classList.remove('hidden'); refuseGo.classList.remove('hidden');
        return;
      }
      if (!validate() || !agreed.v) { err.show('Please complete every field above first.'); return; }
      go.disabled = true; authText(go, 'CREATING…');
      api('auth/signup', {
        method: 'POST',
        body: { username: inU.value, password: inP.value, ageConfirmed: true },
      }).then((r) => {
        go.disabled = false; authText(go, 'CREATE ACCOUNT'); validate();
        if (r.offline) { err.show(COPY.offline); return; }
        if (r.status === 503 && r.body && r.body.error === 'auth_unavailable') { AUTH.onUnavailable(); err.show('Online accounts aren\u2019t set up yet — you can still play as a guest.'); return; }
        if (r.status === 429) { err.show(COPY.rateLimit); return; }
        // Generic on every failure: never reveal taken vs invalid (anti-enumeration).
        if (r.status !== 200 || !r.body || !Array.isArray(r.body.recoveryCodes)) { err.show(COPY.registerFail); return; }
        showCodesPane(inU.value, r.body.recoveryCodes, cb, close);
      });
    });
  })();

  // ---------- GUEST pane (primary, first) ----------
  (function buildGuest() {
    const p = panes.guest;
    const note = authEl('div', 'authsub', p);
    authText(note, 'Play offline on this device. Progress stays here — log in anytime to sync.');
    const go = authEl('button', 'authgo', p);
    authText(go, '▶ PLAY AS GUEST');
    go.addEventListener('click', () => { game.audio.unlock(); close(); cb('guest'); });
    const sec = authEl('button', 'authgo sec', p);
    authText(sec, 'LOG IN / CREATE ACCOUNT');
    sec.addEventListener('click', () => setTab('login'));
  })();

  // ---------- extra panes (recovery, codes) — swapped in, tabs hidden ----------
  const extra = {};
  function setTabExtra(name) {
    order.forEach((n) => { panes[n].classList.add('hidden'); tabBtns[n].classList.remove('sel'); });
    Object.keys(extra).forEach((k) => extra[k].classList.toggle('hidden', k !== name));
    tabsEl.classList.toggle('hidden', true);
    const f = extra[name].querySelector('input:not([disabled])');
    if (f) f.focus();
  }
  function setTabBack(name) {
    Object.keys(extra).forEach((k) => extra[k].classList.add('hidden'));
    tabsEl.classList.remove('hidden');
    setTab(name || 'login');
  }
  function mkExtra(name) {
    const p = authEl('section', 'authpane hidden', panesEl);
    p.setAttribute('role', 'tabpanel');
    extra[name] = p;
    return p;
  }

  // Recovery: username + one recovery code + new password. Generic copy both ways.
  (function buildRecover() {
    const p = mkExtra('recover');
    const err = errBox(p);
    const t = authEl('div', 'authsub', p);
    authText(t, 'Enter your username, one recovery code, and a new password.');
    const f = authEl('form', '', p);
    const lu = authEl('label', 'authfield', f);
    authText(lu, 'Username');
    const inU = authEl('input', 'authin', lu);
    inU.type = 'text'; inU.autocomplete = 'username'; inU.autocapitalize = 'off'; inU.spellcheck = false;
    const lc = authEl('label', 'authfield', f);
    authText(lc, 'Recovery code');
    const inC = authEl('input', 'authin', lc);
    inC.type = 'text'; inC.autocomplete = 'off'; inC.autocapitalize = 'off'; inC.spellcheck = false;
    inC.setAttribute('aria-label', 'Recovery code');
    const chint = authEl('div', 'authhint', f);
    authText(chint, 'Use one of the 8 codes shown when you created the account.');
    const ln = authEl('label', 'authfield', f);
    authText(ln, 'New password');
    const inN = authEl('input', 'authin', ln);
    inN.type = 'password'; inN.autocomplete = 'new-password';
    const go = authEl('button', 'authgo', f);
    go.type = 'submit'; authText(go, 'RESET PASSWORD');
    const back = authEl('button', 'authlink', p);
    authText(back, '← Back to log in');
    back.addEventListener('click', () => setTabBack('login'));
    f.addEventListener('submit', (e) => {
      e.preventDefault(); err.hide();
      const u = inU.value.trim().toLowerCase(), code = inC.value.trim(), np = inN.value;
      if (!u || !code || np.length < 8) { err.show(COPY.recoverFail); return; }
      go.disabled = true; authText(go, 'RESETTING…');
      api('auth/recover', { method: 'POST', body: { username: u, code, newPassword: np } }).then((r) => {
        go.disabled = false; authText(go, 'RESET PASSWORD');
        if (r.offline) { err.show(COPY.offline); return; }
        if (r.status === 429) { err.show(COPY.rateLimit); return; }
        if (r.status !== 200 || !r.body || r.body.ok !== true) { err.show(COPY.recoverFail); return; }
        err.hide();
        const okm = authEl('div', 'authhint ok', p);
        authText(okm, COPY.recoverOk);
        setTimeout(() => setTabBack('login'), 1200);
      });
    });
  })();

  setTab('guest'); // guest-first boot (ADR-010 OQ-7)
  const firstInput = panes.guest.querySelector('button.authgo');
  if (firstInput) firstInput.focus();

  // ---------- recovery codes: shown EXACTLY ONCE after registration ----------
  function showCodesPane(username, codes, cb, close) {
    Object.keys(extra).forEach((k) => extra[k].classList.add('hidden'));
    order.forEach((n) => panes[n].classList.add('hidden'));
    tabsEl.classList.add('hidden');
    const p = mkExtra('codes');
    p.classList.remove('hidden');
    const t = authEl('div', 'authsub', p);
    authText(t, 'Account created — welcome, ' + username + '! Save these recovery codes:');
    const warn = authEl('div', 'authwarn', p);
    authText(warn, 'Save these now — they are the ONLY way to recover your account.');
    const grid = authEl('div', 'authcodes', p);
    grid.setAttribute('aria-label', 'Recovery codes');
    codes.slice(0, 8).forEach((c) => {
      const d = authEl('div', 'authcode', grid);
      authText(d, c); // textContent-only (C12) — codes are never re-fetchable
    });
    const cp = authEl('button', 'authgo sec', p);
    authText(cp, 'COPY ALL');
    const cpd = authEl('div', 'authhint', p);
    cp.addEventListener('click', () => {
      copyText(codes.slice(0, 8).join('\n'), () => authText(cpd, 'Copied — paste them somewhere safe.'));
    });
    const lab = authEl('label', 'authcheck', p);
    const box = authEl('input', '', lab);
    box.type = 'checkbox';
    const btx = authEl('span', '', lab);
    authText(btx, "I've saved my recovery codes");
    const go = authEl('button', 'authgo', p);
    authText(go, 'CONTINUE');
    go.disabled = true;
    box.addEventListener('change', () => { go.disabled = !box.checked; });
    go.addEventListener('click', () => { close(); cb('login', { username, fresh: true }); });
    box.focus();
    // NOTE: the codes are never requested from the server again — this screen is
    // the only place they exist. Losing them without saving = account unrecoverable.
  }
}

// Privacy notice + Terms modal. Must scroll to the bottom before the
// "I agree" checkbox enables. DRAFT-PENDING-GC-WORDING (see PRIVACY_DRAFT).
function openPrivacyModal(parentOv, onAgree) {
  const ov = authEl('div', 'loginover', parentOv);
  ov.style.zIndex = '60';
  const card = authEl('div', 'authcard', ov);
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'Privacy notice and terms');
  const head = authEl('div', 'authhead', card);
  authText(head, 'PRIVACY NOTICE & TERMS');
  const draft = authEl('div', 'authdraft', card);
  authText(draft, 'DRAFT — pending GC + licensed-counsel review. Not final legal text.');
  const sc = authEl('div', 'authscroll', card);
  sc.setAttribute('tabindex', '0');
  sc.setAttribute('aria-label', 'Privacy notice and terms text');
  PRIVACY_DRAFT.forEach(([hh, body]) => {
    const h4 = authEl('h4', '', sc);
    authText(h4, hh);
    const pb = authEl('div', '', sc);
    authText(pb, body);
  });
  const lab = authEl('label', 'authcheck', card);
  lab.style.padding = '10px 14px';
  const box = authEl('input', '', lab);
  box.type = 'checkbox'; box.disabled = true;
  const btx = authEl('span', '', lab);
  authText(btx, 'I have read and agree to the notice and terms above.');
  const row = authEl('div', 'authrow', card);
  row.style.padding = '0 14px 14px';
  const closeB = authEl('button', 'authgo ghost', row);
  closeB.style.flex = '1';
  authText(closeB, 'CLOSE');
  const atBottom = () => sc.scrollHeight - sc.scrollTop - sc.clientHeight < 24;
  sc.addEventListener('scroll', () => { if (atBottom()) box.disabled = false; });
  // Short content: already at the bottom.
  if (atBottom()) box.disabled = false;
  const done = (agreed) => { ov.remove(); if (agreed) onAgree(); };
  closeB.addEventListener('click', () => done(box.checked && !box.disabled));
  box.focus();
}

// ---- account menu (pause → player card), DOM panel (username via textContent) ----
function openAccountMenu(game) {
  const ui = game.ui;
  if (ui.headless || !AUTH.user) return;
  ui.loginOpen = true;
  const ov = authEl('div', 'loginover', ui.root);
  ui._loginOv = ov;
  const card = authEl('div', 'authcard', ov);
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', 'Account');
  const head = authEl('div', 'authhead', card);
  authText(head, 'ACCOUNT');
  const pane = authEl('div', 'authpane', card);
  const who = authEl('div', 'authsub', pane);
  authText(who, 'Signed in as: ' + AUTH.user);
  const close = () => {
    ui.loginOpen = false;
    document.removeEventListener('keydown', onKey, true);
    if (ov.parentNode) ov.parentNode.removeChild(ov);
    ui._loginOv = null;
  };
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  document.addEventListener('keydown', onKey, true);

  const mk = (label, fn, cls) => {
    const b = authEl('button', 'authgo ' + (cls || 'sec'), pane);
    authText(b, label);
    b.addEventListener('click', fn);
    return b;
  };
  mk('SYNC NOW', () => { SYNC.syncNow(game, true); });
  mk('CHANGE PASSWORD', () => accountChangePassword(game, ov, close));
  mk('MY DATA', () => accountMyData(game, ov, close));
  const out = mk('LOG OUT', () => {
    // Two-tap inline confirm (no window.confirm — styled + testable).
    if (pane.querySelector('.logout-confirm')) return;
    const w = authEl('div', 'authwarn logout-confirm', pane);
    authText(w, 'Log out? Your cloud saves stay on your account; this device keeps its local copy.');
    const row = authEl('div', 'authrow', pane);
    const yes = authEl('button', 'authgo', row); authText(yes, 'LOG OUT'); yes.style.flex = '1';
    const no = authEl('button', 'authgo ghost', row); authText(no, 'STAY'); no.style.flex = '1';
    yes.addEventListener('click', () => { AUTH.signOut(game).then(() => close()); });
    no.addEventListener('click', () => { w.remove(); row.remove(); out.focus(); });
  }, 'ghost');
  const del = mk('DELETE ACCOUNT', () => accountDelete(game, ov, close), 'ghost');
  del.style.borderColor = '#C0392B'; del.style.color = '#C0392B';
  const back = authEl('button', 'authgo ghost', pane);
  authText(back, 'BACK');
  back.addEventListener('click', close);
  back.focus();
}

function accountChangePassword(game, ov, closeAccount) {
  const ui = game.ui;
  const sub = authEl('div', 'loginover', ov);
  sub.style.zIndex = '60';
  const card = authEl('div', 'authcard', sub);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
  const head = authEl('div', 'authhead', card); authText(head, 'CHANGE PASSWORD');
  const pane = authEl('div', 'authpane', card);
  const note = authEl('div', 'authhint', pane);
  authText(note, 'Changing your password logs out other devices.');
  const err = authEl('div', 'autherr hidden', pane); err.setAttribute('role', 'alert');
  const f = authEl('form', '', pane);
  const lc = authEl('label', 'authfield', f); authText(lc, 'Current password');
  const inC = authEl('input', 'authin', lc); inC.type = 'password'; inC.autocomplete = 'current-password';
  const ln = authEl('label', 'authfield', f); authText(ln, 'New password (8+ characters)');
  const inN = authEl('input', 'authin', ln); inN.type = 'password'; inN.autocomplete = 'new-password';
  const lm = authEl('label', 'authfield', f); authText(lm, 'Confirm new password');
  const inM = authEl('input', 'authin', lm); inM.type = 'password'; inM.autocomplete = 'new-password';
  const go = authEl('button', 'authgo', f); go.type = 'submit'; authText(go, 'CHANGE PASSWORD');
  const back = authEl('button', 'authlink', pane); authText(back, '← Back');
  back.addEventListener('click', () => sub.remove());
  const showErr = (m) => { authText(err, m); err.classList.remove('hidden'); };
  f.addEventListener('submit', (e) => {
    e.preventDefault(); err.classList.add('hidden');
    if (!inC.value || inN.value.length < 8 || inN.value !== inM.value) { showErr('Check the fields — new passwords must match and be 8+ characters.'); return; }
    go.disabled = true; authText(go, 'CHANGING…');
    api('auth/change-password', { method: 'POST', body: { currentPassword: inC.value, newPassword: inN.value } }).then((r) => {
      go.disabled = false; authText(go, 'CHANGE PASSWORD');
      if (r.offline) { showErr(COPY.offline); return; }
      if (r.status === 401) { AUTH.onSessionExpired(game); sub.remove(); closeAccount(); return; }
      if (r.status === 429) { showErr(COPY.rateLimit); return; }
      if (r.status !== 200) { showErr('Couldn\u2019t change the password — check the current one and try again.'); return; }
      sub.remove();
      ui.toast('Password changed — other devices were logged out.');
    });
  });
  inC.focus();
}

function accountMyData(game, ov, closeAccount) {
  const ui = game.ui;
  const sub = authEl('div', 'loginover', ov);
  sub.style.zIndex = '60';
  const card = authEl('div', 'authcard', sub);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
  const head = authEl('div', 'authhead', card); authText(head, 'MY DATA');
  const pane = authEl('div', 'authpane', card);
  const loading = authEl('div', 'authhint', pane); authText(loading, 'Loading…');
  api('account/data', { method: 'GET' }).then((r) => {
    loading.remove();
    if (r.offline) { const e = authEl('div', 'autherr', pane); authText(e, COPY.offline); }
    else if (r.status === 401) { AUTH.onSessionExpired(game); sub.remove(); closeAccount(); return; }
    else if (r.status !== 200 || !r.body) { const e = authEl('div', 'autherr', pane); authText(e, 'Couldn\u2019t load account data right now.'); }
    else {
      const d = r.body;
      const rows = [
        ['Username', d.username],
        ['Member since', d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'],
        ['Last login', d.lastLogin ? new Date(d.lastLogin).toLocaleString() : '—'],
      ];
      rows.forEach(([k, v]) => {
        const row = authEl('div', 'authhint', pane);
        const b = authEl('b', '', row); authText(b, k + ': ');
        const s = authEl('span', '', row); authText(s, v); // textContent (C12)
      });
    }
    const dl = authEl('button', 'authgo sec', pane); authText(dl, 'DOWNLOAD MY SAVE (JSON)');
    dl.addEventListener('click', () => {
      const payload = SYNC.localPayload(game);
      downloadJson('ashs-journey-save.json', payload || {});
      ui.toast('Save downloaded.');
    });
    const back = authEl('button', 'authgo ghost', pane); authText(back, 'BACK');
    back.addEventListener('click', () => sub.remove());
    back.focus();
  });
}

function accountDelete(game, ov, closeAccount) {
  const ui = game.ui;
  const sub = authEl('div', 'loginover', ov);
  sub.style.zIndex = '60';
  const card = authEl('div', 'authcard', sub);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true');
  const head = authEl('div', 'authhead', card); authText(head, 'DELETE ACCOUNT');
  const pane = authEl('div', 'authpane', card);
  const warn = authEl('div', 'authwarn', pane);
  authText(warn, 'This permanently deletes your account and all cloud saves. This cannot be undone.');
  const err = authEl('div', 'autherr hidden', pane); err.setAttribute('role', 'alert');
  const showErr = (m) => { authText(err, m); err.classList.remove('hidden'); };
  const f = authEl('form', '', pane);
  const lp = authEl('label', 'authfield', f); authText(lp, 'Confirm with your password');
  const inP = authEl('input', 'authin', lp); inP.type = 'password'; inP.autocomplete = 'current-password';
  const go = authEl('button', 'authgo', f); go.type = 'submit'; authText(go, 'CONTINUE');
  f.addEventListener('submit', (e) => {
    e.preventDefault(); err.classList.add('hidden');
    if (!inP.value) { showErr('Enter your password to continue.'); return; }
    // Second gate: type DELETE (same pattern as save-erase).
    ui.showNameEntry('Type DELETE to confirm', '', 6, (typed) => {
      if (typed !== 'DELETE') { ui.toast('Deletion cancelled.'); return; }
      api('account/delete', { method: 'POST', body: { password: inP.value } }).then((r) => {
        if (r.offline) { showErr(COPY.offline); return; }
        if (r.status === 401) { AUTH.onSessionExpired(game); sub.remove(); closeAccount(); return; }
        if (r.status !== 200 || !r.body || r.body.deleted !== true) { showErr('Couldn\u2019t delete the account — check the password and try again.'); return; }
        AUTH.user = null;
        game.authUser = null;
        SYNC.clearSession();
        while (pane.firstChild) pane.removeChild(pane.firstChild); // C12: no innerHTML
        const done1 = authEl('div', 'authsub', pane);
        authText(done1, 'Your account and all cloud saves have been deleted.');
        const wipe = authEl('button', 'authgo sec', pane);
        authText(wipe, 'ALSO ERASE THIS DEVICE\u2019S LOCAL DATA');
        wipe.addEventListener('click', () => {
          SYNC.clearSession();
          try { localStorage.removeItem('pdr.sync.queue'); localStorage.removeItem('pdr.sync.meta'); localStorage.removeItem('pdr.sync.cache'); } catch (e) {}
          authText(done1, 'Your account and all cloud saves have been deleted. This device\u2019s local data is erased.');
          wipe.disabled = true;
        });
        const doneB = authEl('button', 'authgo ghost', pane);
        authText(doneB, 'DONE');
        doneB.addEventListener('click', () => { sub.remove(); closeAccount(); game.quitToTitle(); });
        doneB.focus();
      });
    });
  });
  const back = authEl('button', 'authlink', pane); authText(back, '← Back');
  back.addEventListener('click', () => sub.remove());
  inP.focus();
}

// ---- session + availability ----
function onSessionExpired(game) {
  AUTH.user = null;
  if (game) {
    game.authUser = null;
    // Non-blocking: play continues on the local copy; re-login merges via the
    // conflict flow. Never force-logout mid-battle — no modal is opened here.
    game.ui.toast('Session expired — log in again');
    SYNC.renderDot();
  }
}

function onUnavailable() {
  AUTH.unavailable = true;
  if (AUTH._bannerShown) return;
  AUTH._bannerShown = true;
  if (typeof document === 'undefined') return;
  const root = document.getElementById('ui');
  if (!root) return;
  const b = authEl('div', 'banner503', root);
  const t = authEl('span', '', b);
  // Honest copy: the backend isn't provisioned yet; guest mode is unaffected.
  authText(t, "Online saves aren't set up yet — your progress is safe on this device.");
  const x = authEl('button', '', b);
  authText(x, 'OK');
  x.setAttribute('aria-label', 'Dismiss');
  x.addEventListener('click', () => b.remove());
}

function init(game) {
  if (typeof document === 'undefined' || typeof fetch === 'undefined') return; // headless / no-net
  // No-auth health probe. Until Supabase is provisioned the API answers
  // 503 {error:"auth_unavailable"} (or health reports authConfigured:false).
  api('health', { method: 'GET' }).then((r) => {
    if (r.offline) return; // offline: silent; the sync dot covers it once logged in
    if ((r.status === 503 && r.body && r.body.error === 'auth_unavailable') ||
        (r.status === 200 && r.body && r.body.authConfigured === false)) {
      onUnavailable();
    }
  });
}

function enhanceGuestBanner(ui) {
  // Verce target: the guest banner's "LOG IN" becomes a real button opening the terminal.
  if (ui.headless || !ui._guestBannerEl) return;
  const b = authEl('button', 'authgo sec', ui._guestBannerEl);
  authText(b, 'LOG IN');
  b.style.minHeight = '28px'; b.style.padding = '2px 12px'; b.style.fontSize = '14px';
  b.addEventListener('click', (e) => {
    e.preventDefault();
    ui.game.openLogin('continue');
  });
}

function signOut(game) {
  const done = () => {
    AUTH.user = null;
    if (game) {
      game.authUser = null;
      SYNC.clearSession();
      game.ui.toast('Logged out.');
      game.ui.hideGuestBanner();
      game.quitToTitle(); // back to title; Continue resumes the guest save, if any
    }
    return { ok: true };
  };
  // POST-only sign-out (contract). Best-effort: local state clears regardless.
  return api('auth/sign-out', { method: 'POST' }).then(() => done(), () => done());
}

Object.assign(AUTH, {
  init,
  showLoginPanel,
  enhanceGuestBanner,
  openAccountMenu,
  signOut,
  onSessionExpired,
  onUnavailable,
  isLoggedIn() { return !!AUTH.user; },
});

// __AUTH_END__
