// drift-gate.mjs — contentHash anti-drift gate between bundles (Frontend condition).
// The shipped editions INTENTIONALLY differ from the full source build and
// from each other, in exactly two compile-time ways:
//   * guest (canonical, dist/standalone.html) is the full source build minus
//     the compile-time-stripped auth sections;
//   * personal (ADR-012) is guest plus exactly one token — EDITION_MARKER
//     ('' in guest, "NAMAN'S EDITION" in personal).
// This gate proves, on every run:
//   1. the committed guest artifact is byte-identical to a FRESH guest build
//      of the same source (no stale or hand-edited artifact can ship);
//   2. guest === stripAuthBlocks(full source build), where the full build is
//      assembled in memory (buildGameJs({ auth: true })) — the strip oracle
//      that replaced the retired vercel bundle (public/game.js) when the
//      vercel target was retired (2026-11-12, infra/retire-vercel). The proof
//      is unchanged in substance and strictly stronger in freshness: the
//      oracle is rebuilt from src on every gate run instead of read from a
//      committed artifact;
//   3. the full build genuinely carries the auth client, so the strip in (2)
//      is what removes it (the oracle is not vacuous);
//   4. each shipped bundle's embedded contentHash comment matches its own
//      content;
//   5. personal/game.js === guest JS + the EDITION_MARKER swap, and the
//      personal bundle carries no auth implementation (ADR-012 §3b list).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildGameJs, stripAuthBlocks, EDITION_MARKER_LITERAL } from './build.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const a = path.join(ROOT, 'dist', 'standalone.html');
const pJs = path.join(ROOT, 'personal', 'game.js');
const pHtml = path.join(ROOT, 'personal', 'index.html');
for (const f of [a, pJs, pHtml]) {
  if (!fs.existsSync(f)) { console.error('FAIL drift gate: missing ' + path.relative(ROOT, f) + ' — run scripts/build.mjs first'); process.exit(1); }
}

const html = fs.readFileSync(a, 'utf8');
const m = html.split('<script>\n');
if (m.length < 2) { console.error('FAIL drift gate: no inline script in dist/standalone.html'); process.exit(1); }
const guestJs = m[1].split('\n</script>')[0];

// 1. committed guest artifact === fresh guest build of the same source
const guestFresh = buildGameJs({ edition: 'guest' });
if (sha(guestJs) !== sha(guestFresh)) {
  console.error('FAIL drift gate: committed guest bundle diverged from a fresh guest build (stale or hand-edited artifact)');
  console.error('  artifact ' + sha(guestJs).slice(0, 16) + ' != fresh build ' + sha(guestFresh).slice(0, 16));
  process.exit(1);
}

// 2. guest === full source build minus auth sections (strip oracle)
const fullJs = buildGameJs({ auth: true });
const stripped = stripAuthBlocks(fullJs);
if (sha(stripped) !== sha(guestJs)) {
  console.error('FAIL drift gate: guest bundle diverged from the full source build outside the auth sections');
  console.error('  strip(full) ' + sha(stripped).slice(0, 16) + ' != guest ' + sha(guestJs).slice(0, 16));
  process.exit(1);
}

// 3. the oracle is not vacuous: the full build carries the auth client
if (!(fullJs.indexOf("'/api/'") >= 0 && fullJs.indexOf('auth/sign-in/username') >= 0)) {
  console.error('FAIL drift gate: full source build no longer carries the auth client — strip proof would be vacuous');
  process.exit(1);
}

// 4. each shipped bundle's contentHash comment matches its own bytes
function checkHash(content, jsForHash, label) {
  const mm = content.match(/contentHash:([0-9a-f]{64})/);
  if (!mm) { console.error('FAIL drift gate: no contentHash marker in ' + label); process.exit(1); }
  if (mm[1] !== sha(jsForHash)) {
    console.error('FAIL drift gate: contentHash mismatch in ' + label);
    process.exit(1);
  }
}
checkHash(html, guestJs, 'dist/standalone.html');

console.log('DRIFT: guest === fresh guest build === strip(full source build), guest contentHash self-consistent');
console.log('  guest ' + sha(guestJs).slice(0, 16) + '... (auth stripped, zero network)');
console.log('  full  ' + sha(fullJs).slice(0, 16) + '... (in-memory oracle only, never shipped)');

// 5. ADR-012: personal === guest + the EDITION_MARKER swap (auth-strip equivalence).
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
// 5b. no auth UI implementation in the personal bundle: identifiers that exist
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
