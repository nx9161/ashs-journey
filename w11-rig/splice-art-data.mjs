// splice-art-data.mjs — W11 entry-granularity art-data splice.
// Replaces the entry spans for the given keys in a base art-data.mjs
// with the spans from a regenerated art-data.mjs (build-art output),
// leaving every other byte of the base untouched. This is the standing
// W17-W rule: art-data is resolved by entry-granularity splice, never
// a wholesale regeneration (a full build-art run on main renames 386
// tile entries and reverts title-keyart — pre-existing drift).
// Usage: node w11-rig/splice-art-data.mjs <base> <regen> <out> <key...>
import fs from 'node:fs';
const [basePath, regenPath, outPath, ...keys] = process.argv.slice(2);
function span(src, key) {
  const marker = `"${key}": `;
  const i = src.indexOf(marker);
  if (i < 0) throw new Error('key not found: ' + key);
  if (src.indexOf(marker, i + 1) >= 0) throw new Error('key duplicated: ' + key);
  let j = src.indexOf('{', i);
  let depth = 0, k = j;
  let inStr = false, esc = false;
  for (; k < src.length; k++) {
    const c = src[k];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { k++; break; } }
  }
  return [i, k];
}
const base = fs.readFileSync(basePath, 'utf8');
const regen = fs.readFileSync(regenPath, 'utf8');
let out = base;
for (const key of keys) {
  const [bs, be] = span(out, key);
  const [rs, re] = span(regen, key);
  out = out.slice(0, bs) + regen.slice(rs, re) + out.slice(be);
  console.log('spliced', key, '(' + (be - bs) + ' -> ' + (re - rs) + ' chars)');
}
fs.writeFileSync(outPath, out);
console.log('wrote', outPath, out.length, 'chars (base', base.length + ')');
