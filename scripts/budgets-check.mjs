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
const pubJs = path.join(ROOT, 'public', 'game.js');
const pubHtml = path.join(ROOT, 'public', 'index.html');

if (!fs.existsSync(dist)) { console.error('FAIL: dist/standalone.html missing — run scripts/build.mjs first'); process.exit(1); }

gate('guest bundle bytes (uncompressed)', fs.statSync(dist).size, hard.guestBundleMaxBytes);

if (fs.existsSync(pubJs) && fs.existsSync(pubHtml)) {
  gate('vercel static bytes (uncompressed)', fs.statSync(pubJs).size + fs.statSync(pubHtml).size, hard.vercelStaticMaxBytes);
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
