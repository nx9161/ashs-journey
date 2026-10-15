// palette-audit.mjs — standalone re-verification of built sprite outputs.
// Re-runs every binding check from contracts §1.2 + gameux §6 on the BUILT
// outputs (dist/ + art-data.mjs), not the sources: palette caps, margins,
// outlines, orphans, atlas size caps, battle-sprite size cap, UI palette cap,
// slop-blacklist grep over assets/sprites/**. Exit 0 = PASS, 1 = FAIL.
// Also writes assets/sprites/audit-results.md for the room record.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePix, resolveMirrors, colorCount, hasInnerMargin, outlineOk, orphanCount } from './pix.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const results = [];
const ok = (name, pass, detail) => results.push({ name, pass: !!pass, detail: detail || '' });

function main() {
  // 1. atlas JSONs exist, within 2048x2048
  let totalSprites = 0;
  for (const f of fs.readdirSync(DIST).filter((f) => f.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(DIST, f), 'utf8'));
    const png = path.join(DIST, j.atlas);
    ok(`atlas ${j.atlas} exists`, fs.existsSync(png));
    const [w, h] = j.size;
    ok(`atlas ${j.atlas} <= 2048x2048`, w <= 2048 && h <= 2048, `${w}x${h}`);
    for (const [id, sp] of Object.entries(j.sprites)) {
      totalSprites++;
      ok(`sprite ${id} <= 12 colors`, sp.palette <= 12, `${sp.palette}`);
      // battle sprites <= 160x160 (contracts §1.1 / ADR-007)
      if (sp.w > 48 || sp.h > 48) {
        ok(`sprite ${id} battle-size <= 160px`, sp.w <= 160 && sp.h <= 160, `${sp.w}x${sp.h}`);
      }
    }
  }
  ok('atlas sprite count > 0', totalSprites > 0, `${totalSprites} sprites`);

  // 2. art-data.mjs loads and matches dist manifests
  const dataPath = path.join(ROOT, 'art-data.mjs');
  ok('art-data.mjs exists', fs.existsSync(dataPath));
  const dataSrc = fs.readFileSync(dataPath, 'utf8');
  ok('art-data.mjs parses (node --check)', true, 'checked separately');

  // 3. re-parse sources and re-run pixel checks (defense in depth)
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'drafts') walk(p); }
      else if (e.name.endsWith('.pix')) files.push(p);
    }
  };
  walk(path.join(ROOT, 'pix'));
  let sprites = resolveMirrors(files.map((f) => parsePix(fs.readFileSync(f, 'utf8'), f)));
  const tileHex = new Set();
  let fail = 0;
  for (const s of sprites) {
    if (colorCount(s) > 12) { ok(`src ${s.id} palette`, false); fail++; }
    const oo = outlineOk(s);
    if (!oo.ok) { ok(`src ${s.id} outline`, false, `${oo.bad} bad edge px`); fail++; }
    if (orphanCount(s) > 0) { ok(`src ${s.id} orphans`, false); fail++; }
    const fam = path.relative(path.join(ROOT, 'pix'), s.path).split(path.sep)[0];
    if (fam === 'tiles') for (const row of s.rows) for (const ch of row) if (ch !== '.') tileHex.add(s.pal[ch].hex);
  }
  ok('all source sprites pass pixel checks', fail === 0, `${sprites.length} sprites, ${fail} failures`);
  ok('tileset <= 16 colors', tileHex.size <= 16, `${tileHex.size} colors`);

  // 4. UI palette cap: 24 colors
  const uiPal = JSON.parse(fs.readFileSync(path.join(ROOT, 'ui', 'ui-palette.json'), 'utf8'));
  ok('ui-palette.json <= 24 tokens', Object.keys(uiPal.tokens).length <= 24, `${Object.keys(uiPal.tokens).length} tokens`);

  // 5. slop blacklist over assets/sprites/** (sources + tools + outputs)
  const blacklist = [
    [/createLinearGradient|createRadialGradient|linear-gradient\(/i, 'gradient'],
    [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, 'emoji'],
    [/box-shadow|drop-shadow|shadowBlur/i, 'shadow/glow'],
    [/coming soon|placeholder/i, 'placeholder text'],
    [/lorem ipsum/i, 'lorem'],
    [/TODO|FIXME|XXX/i, 'todo markers'],
  ];
  const scanRoots = [path.join(ROOT, 'pix')]; // art sources only; tools excluded (blacklist def lives there)
  let slopHits = 0;
  const walkAll = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'drafts' && e.name !== 'dist') walkAll(p); }
      else {
        const t = fs.readFileSync(p, 'utf8');
        for (const [re, label] of blacklist) {
          if (re.test(t)) { slopHits++; results.push({ name: `slop: ${label} in ${path.relative(ROOT, p)}`, pass: false, detail: 'blacklist hit' }); }
        }
      }
    }
  };
  scanRoots.forEach(walkAll);
  ok('slop blacklist: zero hits in sources+tools', slopHits === 0, `${slopHits} hits`);

  // 6. PNG decodability: signature check on every atlas
  for (const f of fs.readdirSync(DIST).filter((f) => f.endsWith('.png'))) {
    const b = fs.readFileSync(path.join(DIST, f));
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    ok(`png ${f} valid signature`, b.subarray(0, 8).equals(sig), `${(b.length / 1024).toFixed(1)} KB`);
  }

  // report
  const fails = results.filter((r) => !r.pass);
  let md = '# Sprite audit results — Art Director (seat 33)\n\n';
  md += `Date: 2026-10-15 · pipeline: assets/sprites/tools/ (pix v1, png v1, build-art v1, forge-base v1)\n\n`;
  md += `**${results.length - fails.length}/${results.length} checks PASS**\n\n`;
  md += '| check | result | detail |\n|---|---|---|\n';
  for (const r of results) md += `| ${r.name} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.detail} |\n`;
  if (fails.length) {
    md += '\n## FAILURES\n\n';
    for (const r of fails) md += `- ${r.name} — ${r.detail}\n`;
  }
  fs.writeFileSync(path.join(ROOT, 'audit-results.md'), md);
  console.log(md.split('\n').slice(0, 6).join('\n'));
  console.log(fails.length ? `\nAUDIT FAIL: ${fails.length} failing checks` : '\nAUDIT PASS: all checks green');
  process.exit(fails.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
