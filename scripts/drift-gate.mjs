// drift-gate.mjs — contentHash anti-drift gate between bundles (Frontend condition).
// Bundle A (dist/standalone.html) and Bundle B (public/game.js) must embed the
// same game-JS contentHash. Fails on any drift.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function extractHash(file, label) {
  const t = fs.readFileSync(file, 'utf8');
  const m = t.match(/contentHash:([0-9a-f]{64})/);
  if (!m) { console.error('FAIL ' + label + ': no contentHash marker in ' + path.relative(ROOT, file)); process.exit(1); }
  return m[1];
}

const a = path.join(ROOT, 'dist', 'standalone.html');
const bJs = path.join(ROOT, 'public', 'game.js');
for (const f of [a, bJs]) {
  if (!fs.existsSync(f)) { console.error('FAIL drift gate: missing ' + path.relative(ROOT, f) + ' — run scripts/build.mjs first'); process.exit(1); }
}

const hashA = extractHash(a, 'bundle A');
const hashBjs = crypto.createHash('sha256').update(fs.readFileSync(bJs, 'utf8')).digest('hex');

if (hashA !== hashBjs) {
  console.error('FAIL drift gate: bundle A hash ' + hashA.slice(0, 16) + ' != bundle B game.js ' + hashBjs.slice(0, 16));
  process.exit(1);
}
console.log('DRIFT: bundles agree on contentHash ' + hashA.slice(0, 16) + '...');
