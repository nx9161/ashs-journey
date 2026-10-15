// api/health.mjs — liveness probe (GET, no auth).
// {ok, authConfigured, version:"track-b", time}. This is the keep-alive target
// (.github/workflows/keepalive.yml): when auth is configured it performs a
// cheap SELECT 1 so the Supabase free tier sees activity.

import { isDbConfigured, pingDb } from './lib/db.mjs';
import { json, methodNotAllowed } from './lib/http.mjs';

export default async function handler(req) {
  if (req.method !== 'GET') return methodNotAllowed(['GET']);
  const authConfigured = isDbConfigured();
  let dbOk = false;
  if (authConfigured) dbOk = await pingDb();
  return json({
    ok: true,
    authConfigured,
    dbOk,
    version: 'track-b',
    time: new Date().toISOString(),
  });
}
