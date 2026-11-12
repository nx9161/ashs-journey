// budgets-check.mjs — binding budget gates (ADR-007). Exits 1 over budget.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const budgets = JSON.parse(fs.readFileSync(path.join(ROOT, 'budgets.json'), 'utf8'));
const hard = budgets.hardGates;

let failed = 0;
function gate(name, actual, max) {
  const ok = actual <= max;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + ': ' + actual + ' <= ' + max);
  if (!ok) failed++;
}

const dist = path.join(ROOT, 'dist', 'standalone.html');
const perJs = path.join(ROOT, 'personal', 'game.js');
const perHtml = path.join(ROOT, 'personal', 'index.html');

// Zero-network gate (PRD AC#1; Tech Law's COPPA cleanliness): the guest and
// personal bundles make ZERO network calls of any kind. build.mjs fails first;
// this is the CI-level enforcement (budgets.json guestBundleFetches:0).
function zeroNetGate(content, label) {
  const hits = [];
  const nFetch = (content.match(/fetch\s*\(/g) || []).length;
  if (nFetch) hits.push('fetch(:' + nFetch);
  const nApi = (content.match(/\/api\//g) || []).length;
  if (nApi) hits.push('/api/:' + nApi);
  const nBeacon = (content.match(/sendBeacon/g) || []).length;
  if (nBeacon) hits.push('sendBeacon:' + nBeacon);
  const nXhr = (content.match(/XMLHttpRequest|new WebSocket/g) || []).length;
  if (nXhr) hits.push('xhr/ws:' + nXhr);
  if (hits.length) { console.error('FAIL ' + label + ' zero-network gate: ' + hits.join(', ')); failed++; }
  else console.log('PASS ' + label + ' zero-network gate (fetch + /api/ + beacon + xhr/ws = 0)');
}

if (!fs.existsSync(dist)) { console.error('FAIL: dist/standalone.html missing — run scripts/build.mjs first'); process.exit(1); }

gate('guest bundle bytes (uncompressed)', fs.statSync(dist).size, hard.guestBundleMaxBytes);
zeroNetGate(fs.readFileSync(dist, 'utf8'), 'guest bundle');

// (The vercel-static byte gate was retired with its target, 2026-11-12 —
// budgets.json no longer carries vercelStaticMaxBytes.)

// ADR-012: the personal bundle gets the same budget + zero-network gates as the
// guest bundle (same 12MB ADR-007 per-bundle ceiling; no api/ functions ship).
if (!fs.existsSync(perJs) || !fs.existsSync(perHtml)) {
  console.error('FAIL: personal/game.js or personal/index.html missing — run scripts/build.mjs --target=personal first');
  failed++;
} else {
  gate('personal bundle bytes (uncompressed)', fs.statSync(perJs).size + fs.statSync(perHtml).size, hard.personalStaticMaxBytes);
  zeroNetGate(fs.readFileSync(perJs, 'utf8') + fs.readFileSync(perHtml, 'utf8'), 'personal bundle');
}

// Zero-dep client gate: only relative imports in src (no npm packages, no require).
function walkMjs(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMjs(p, out);
    else if (p.endsWith('.mjs')) out.push(p);
  }
  return out;
}
{
  const bad = [];
  for (const f of walkMjs(path.join(ROOT, 'src'))) {
    const t = fs.readFileSync(f, 'utf8');
    for (const line of t.split('\n')) {
      const s = line.trim();
      if (/^import\s/.test(s) && /from\s*['"](?!\.\.?\/)/.test(s)) bad.push(f + ': ' + s);
      if (/[^.\w]require\s*\(/.test(s)) bad.push(f + ': ' + s);
      if (/import\s*\(\s*['"](?!\.\.?\/)/.test(s)) bad.push(f + ': ' + s);
    }
  }
  if (bad.length) { console.error('FAIL zero-dep client gate:\n' + bad.join('\n')); failed++; }
  else console.log('PASS client zero-dep gate (relative imports only)');
}

if (failed) { console.error('BUDGETS: ' + failed + ' gate(s) failed'); process.exit(1); }
console.log('BUDGETS: all gates pass');
