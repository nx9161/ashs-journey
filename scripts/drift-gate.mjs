// drift-gate.mjs — contentHash anti-drift gate between bundles (Frontend condition).
// Track B: the two bundles INTENTIONALLY differ — Bundle A (guest) is Bundle B
// (vercel) minus the compile-time-stripped auth sections. This gate proves:
//   1. stripAuthBlocks(public/game.js) === the guest bundle's inline JS
//      (no drift between targets outside the auth sections), and
//   2. each bundle's embedded contentHash comment matches its own content.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { stripAuthBlocks } from './build.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const a = path.join(ROOT, 'dist', 'standalone.html');
const bJs = path.join(ROOT, 'public', 'game.js');
for (const f of [a, bJs]) {
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
