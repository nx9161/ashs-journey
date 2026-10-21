// Two-segment auth routes (e.g. /api/auth/sign-in/username, /api/auth/sign-up/email).
// In this vanilla (non-framework) project the [...all] catch-all only matches a
// single segment, so two-segment Better Auth paths route through this file,
// which re-exports the same handler. One-segment paths stay on [...all].mjs.
export { handler, GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } from '../[...all].mjs';
