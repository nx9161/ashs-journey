// http.mjs — shared route helpers: JSON responses, size-guarded body reads,
// session resolution, same-origin defense-in-depth (AppSec C4).

import { auth, authUnavailable } from './auth.mjs';
import { isDbConfigured } from './db.mjs';

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extraHeaders },
  });
}

// Generic failure copy — no enumeration, no internals (T1, G12, G13).
export function invalidRequest(status = 422) {
  return json({ error: 'invalid_request' }, status);
}
export function unavailable() {
  return json({ error: 'auth_unavailable' }, 503);
}
export function unauthorized() {
  return json({ error: 'invalid_request' }, 401);
}

// Read the raw body with a byte cap BEFORE parsing (Pen T7c / C10(ii)).
// Returns { raw } or { response } on 413 / malformed.
export async function readBody(req, maxBytes) {
  const len = req.headers.get('content-length');
  if (len !== null) {
    const n = Number(len);
    if (!Number.isFinite(n) || n < 0) return { response: invalidRequest(400) };
    if (n > maxBytes) return { response: json({ error: 'payload_too_large' }, 413) };
  }
  let raw;
  try {
    raw = await req.text();
  } catch {
    return { response: invalidRequest(400) };
  }
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    return { response: json({ error: 'payload_too_large' }, 413) };
  }
  return { raw };
}

export function parseJson(raw) {
  try {
    const data = JSON.parse(raw);
    return { data };
  } catch {
    return { response: invalidRequest(400) };
  }
}

// Resolve the better-auth session from the request cookies.
// Returns { userId } or null. 401 precedes any resource-specific code (G14).
export async function requireUserId(req) {
  if (!isDbConfigured() || authUnavailable()) return null;
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const id = session && session.user && session.user.id;
    if (typeof id !== 'string' || id.length === 0 || id.length > 128) return null;
    return id;
  } catch (e) {
    console.error('[auth] getSession failed', e && e.message ? e.message : e);
    return null;
  }
}

// Defense-in-depth CSRF check for state-changing /api/* (AppSec C4, Pen T13).
// SameSite=Lax on the session cookie is the primary control; this is the second.
export function assertSameOrigin(req) {
  const allowed = (process.env.BETTER_AUTH_URL || '').replace(/\/$/, '');
  if (!allowed) return false;
  let allowedOrigin;
  try {
    allowedOrigin = new URL(allowed).origin;
  } catch {
    return false;
  }
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).origin === allowedOrigin;
    } catch {
      return false;
    }
  }
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === allowedOrigin;
    } catch {
      return false;
    }
  }
  return false; // fail closed: no Origin/Referer on a mutation
}

export function methodNotAllowed(allowed) {
  return new Response(JSON.stringify({ error: 'invalid_request' }), {
    status: 405,
    headers: { 'content-type': 'application/json', allow: allowed.join(', ') },
  });
}
