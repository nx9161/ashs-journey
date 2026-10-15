// api/auth/[...all].mjs — better-auth request handler (Vercel serverless, Node).
// All /api/auth/* sub-paths route here; better-auth dispatches internally.
// Fail-closed: 503 {error:"auth_unavailable"} when the DB is not provisioned.

import { auth, authUnavailable } from '../lib/auth.mjs';

export default async function handler(req) {
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
