// drift-gate.mjs — contentHash anti-drift gate between bundles (Frontend condition).
// Track B: the two full bundles INTENTIONALLY differ — Bundle A (guest) is Bundle B
// (vercel) minus the compile-time-stripped auth sections. This gate proves:
//   1. stripAuthBlocks(public/game.js) === the guest bundle's inline JS
//      (no drift between targets outside the auth sections), and
//   2. each bundle's embedded contentHash comment matches its own content.
// ADR-012: the personal target INTENTIONALLY differs from guest by exactly one
// compile-time token — EDITION_MARKER ('' in guest, "NAMAN'S EDITION" in personal).
// The gate proves: personal/game.js === guest JS + marker swap, and the
// personal index.html contentHash is self-consistent.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { stripAuthBlocks, EDITION_MARKER_LITERAL } from './build.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const a = path.join(ROOT, 'dist', 'standalone.html');
const bJs = path.join(ROOT, 'public', 'game.js');
const pJs = path.join(ROOT, 'personal', 'game.js');
const pHtml = path.join(ROOT, 'personal', 'index.html');
for (const f of [a, bJs, pJs, pHtml]) {
  if (!fs.existsSync(f)) { console.error('FAIL drift gate: missing ' + path.relative(ROOT, f) + ' — run scripts/build.mjs first'); process.exit(1); }
}

const html = fs.readFileSync(a, 'utf8');
const vercelJs = fs.readFileSync(bJs, 'utf8');
const m = html.split('<script>\n');
if (m.length < 2) { console.error('FAIL drift gate: no inline script in dist/standalone.html'); process.exit(1); }
const guestJs = m[1].split('\n</script>')[0];

// 1. guest === vercel minus auth sections
const stripped = stripAuthBlocks(vercelJs);
if (sha(stripped) !== sha(guestJs)) {
  console.error('FAIL drift gate: guest bundle diverged from vercel bundle outside the auth sections');
  console.error('  strip(vercel) ' + sha(stripped).slice(0, 16) + ' != guest ' + sha(guestJs).slice(0, 16));
  process.exit(1);
}

// 2. each bundle's contentHash comment matches its own bytes
function checkHash(content, jsForHash, label) {
  const mm = content.match(/contentHash:([0-9a-f]{64})/);
  if (!mm) { console.error('FAIL drift gate: no contentHash marker in ' + label); process.exit(1); }
  if (mm[1] !== sha(jsForHash)) {
    console.error('FAIL drift gate: contentHash mismatch in ' + label);
    process.exit(1);
  }
}
checkHash(html, guestJs, 'dist/standalone.html');
{
  // public/index.html carries the vercel bundle's contentHash comment.
  const indexHtml = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
  const mm = indexHtml.match(/contentHash:([0-9a-f]{64})/);
  if (!mm) { console.error('FAIL drift gate: no contentHash marker in public/index.html'); process.exit(1); }
  if (mm[1] !== sha(vercelJs)) { console.error('FAIL drift gate: contentHash mismatch in public/index.html'); process.exit(1); }
}

console.log('DRIFT: guest === strip(vercel), both contentHashes self-consistent');
console.log('  guest  ' + sha(guestJs).slice(0, 16) + '... (auth stripped, zero network)');
console.log('  vercel ' + sha(vercelJs).slice(0, 16) + '... (full auth UI)');

// 3. ADR-012: personal === guest + the EDITION_MARKER swap (auth-strip equivalence).
//    This is the binding proof that the personal bundle carries zero auth code
//    beyond the guest path and exactly one intentional difference (the ribbon).
//    The swap targets the FULL declaration line — never the bare '' literal,
//    which occurs all over the bundle.
const personalJs = fs.readFileSync(pJs, 'utf8');
const noneDecl = 'const EDITION_MARKER = ' + EDITION_MARKER_LITERAL.none + ';';
const personalDecl = 'const EDITION_MARKER = ' + EDITION_MARKER_LITERAL.personal + ';';
if (!guestJs.includes(noneDecl)) {
  console.error('FAIL drift gate: EDITION_MARKER declaration missing in guest JS — build.mjs marker replacement broken');
  process.exit(1);
}
const expectPersonal = guestJs.split(noneDecl).join(personalDecl);
if (sha(personalJs) !== sha(expectPersonal)) {
  console.error('FAIL drift gate: personal bundle diverged from guest bundle outside the EDITION_MARKER token');
  console.error('  guest+marker ' + sha(expectPersonal).slice(0, 16) + ' != personal ' + sha(personalJs).slice(0, 16));
  process.exit(1);
}
// 3b. no auth UI implementation in the personal bundle: identifiers that exist
// only inside the compile-time-stripped __AUTH__ blocks (the full Trainer ID
// Terminal, recovery flows, account menu) must be absent. The AUTH *stub*
// surface (showLoginPanel routing straight to guest with zero UI) ships in the
// guest bundle too — signed Track-A behavior, not an affordance.
for (const id of ['showCodesPane', 'openPrivacyModal', 'PRIVACY_DRAFT', 'accountDelete', 'recoveryCodes', '__AUTH_BEGIN__']) {
  if (personalJs.includes(id)) {
    console.error('FAIL drift gate: personal bundle carries auth implementation (' + id + ' leaked past the strip)');
    process.exit(1);
  }
}
if (!personalJs.includes(EDITION_MARKER_LITERAL.personal)) {
  console.error('FAIL drift gate: personal bundle missing the EDITION_MARKER literal');
  process.exit(1);
}
checkHash(fs.readFileSync(pHtml, 'utf8'), personalJs, 'personal/index.html');

console.log('DRIFT: personal === guest + EDITION_MARKER, personal contentHash self-consistent');
console.log('  personal ' + sha(personalJs).slice(0, 16) + '... (auth stripped, marker, zero network)');
