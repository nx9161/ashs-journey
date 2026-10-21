// api/auth/[...all].mjs — better-auth request handler (Vercel serverless, Node).
// All /api/auth/* sub-paths route here; better-auth dispatches internally.
// Fail-closed: 503 {error:"auth_unavailable"} when the DB is not provisioned.

import { auth, authUnavailable } from '../_lib/auth.mjs';

export async function handler(req) {
  if (authUnavailable()) {
    return new Response(JSON.stringify({ error: 'auth_unavailable' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
  try {
    return await auth.handler(req);
  } catch (e) {
    console.error('[auth] handler error', e && e.message ? e.message : e);
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

// Web API method handlers (Vercel Node runtime invokes these with a Fetch
// Request; the handler itself enforces per-route methods via 405s).
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
