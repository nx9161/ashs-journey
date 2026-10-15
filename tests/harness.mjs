// harness.mjs — shared test helpers: assert counter, mock Vercel-style
// Request objects, cookie handling.

export let pass = 0;
export let fail = 0;
const failures = [];

export function t(name, cond, extra) {
  if (cond) { pass++; }
  else {
    fail++;
    failures.push(name + (extra ? ' :: ' + extra : ''));
    console.log('  FAIL -', name, extra ? ':: ' + extra : '');
  }
}

export function report() {
  if (failures.length) {
    console.log('\nFailed asserts:');
    for (const f of failures) console.log('  -', f);
  }
  return { pass, fail };
}

// Minimal Vercel/Request-shaped object the route handlers need:
// .method, .url, .headers (Headers), .text().
export function mockReq({ method = 'GET', url = 'http://localhost:3000/api/save', headers = {}, body = undefined }) {
  const h = new Headers({ origin: 'http://localhost:3000', referer: 'http://localhost:3000/', ...headers });
  let raw = '';
  if (body !== undefined) raw = typeof body === 'string' ? body : JSON.stringify(body);
  if (!h.has('content-length')) h.set('content-length', String(Buffer.byteLength(raw)));
  return {
    method,
    url,
    headers: h,
    async text() { return raw; },
  };
}

// Extract the session cookie value from a handler Response's set-cookie.
export function sessionCookieFrom(res, name = 'ashsjourney.session_token') {
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of setCookies) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    if (k && k.trim() === name) return `${name}=${v}`;
  }
  return null;
}

export function cookieHeader(cookie) {
  return { cookie };
}

// Canonical JSON: JSONB round-trips normalize key order/whitespace, so
// deep-compare payloads via sorted-key stringify.
export function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}

export async function readJson(res) {
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text), headers: res.headers }; }
  catch { return { status: res.status, json: null, raw: text, headers: res.headers }; }
}

// A VALID save payload: the real default game state (same fixture the
// validator's own unit battery uses), with a named player.
export async function validPayload() {
  const { defaultState } = await import('../src/game/state.mjs');
  const s = defaultState();
  s.player.name = 'ASH';
  s.player.rivalName = 'GARY';
  return s;
}
