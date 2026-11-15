// W17-AD convert: conversion of the four Amber Sea lanes
// inside src/data/maps5.mjs (orange-sea-west/central/east/
// north). Two operations per lane, both proven against the
// durable before-snapshot (w17ad-rig/before.json):
//  (1) char-for-char kind swaps: shipped sand -> the lane's
//      own sand kind, 'R' rock -> the lane's own rock kind.
//      Everything else — water, coral, the islet dressing
//      register (palm/tropgrass/grass/tree/flower), warps,
//      encounter tables — is byte-preserved (Ruling #2).
//  (2) Ruling #1 islet variance: the four sand-islet
//      clusters (3x2, [sand,palm,sand]/[sand,sand,sand])
//      are repositioned as units per transforms.mjs —
//      clear-then-stamp, so per-lane cell-class counts are
//      identical by construction and asserted below; warp
//      cells are asserted untouched and never a destination.
// Only row strings change; the splice replaces row-string
// spans in place. Any failed assertion aborts before write.
import fs from 'node:fs';
import { TILE_CHARS } from '../src/engine/tiles.mjs';
import { CH, CLUSTERS, LANES } from './transforms.mjs';

const before = JSON.parse(fs.readFileSync(new URL('./before.json', import.meta.url), 'utf8'));
const path = new URL('../src/data/maps5.mjs', import.meta.url).pathname;
let src = fs.readFileSync(path, 'utf8');

function rowsSpan(text, id) {
  const start = text.indexOf(`"${id}": {`);
  if (start < 0) throw new Error('def not found: ' + id);
  const rs = text.indexOf('"rows": [', start);
  const re = text.indexOf(']', rs);
  return [rs, re];
}
const kindOf = (ch) => TILE_CHARS[ch] || ('?' + ch);
const counts = (rows) => { const c = {}; for (const r of rows) for (const ch of r) c[kindOf(ch)] = (c[kindOf(ch)] || 0) + 1; return c; };

const edits = [];
for (const [id, lane] of Object.entries(LANES)) {
  const snap = before['maps5:' + id];
  if (!snap) throw new Error('no snapshot for ' + id);
  const rows = snap.rows.map((r) => [...r]);
  const H = rows.length, W = rows[0].length;
  const warpSet = new Set((snap.warps || []).map((w) => w.x + ',' + w.y));
  // (0) template proof: every cluster matches [sand,palm,sand]/[sand,sand,sand].
  const clusterCells = new Set();
  for (const [cid, [cx, cy]] of Object.entries(CLUSTERS)) {
    const want = [['sand', 'palm', 'sand'], ['sand', 'sand', 'sand']];
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) {
      const k = kindOf(rows[cy + dy][cx + dx]);
      if (k !== want[dy][dx]) throw new Error(`${id} ${cid}: template mismatch at ${cx + dx},${cy + dy}: ${k} != ${want[dy][dx]}`);
      clusterCells.add((cx + dx) + ',' + (cy + dy));
    }
  }
  // (1) destination proof: water or cluster cells only, never warps, in bounds.
  const destCells = new Set();
  for (const [cid, mv] of Object.entries(lane.move)) {
    const [tx, ty] = mv.to;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) {
      const x = tx + dx, y = ty + dy, key = x + ',' + y;
      if (x < 0 || y < 0 || x >= W || y >= H) throw new Error(`${id} ${cid}: destination out of bounds ${key}`);
      if (warpSet.has(key)) throw new Error(`${id} ${cid}: destination is a warp cell ${key}`);
      if (destCells.has(key)) throw new Error(`${id} ${cid}: destinations overlap at ${key}`);
      destCells.add(key);
      const k = kindOf(rows[y][x]);
      if (k !== 'water' && !clusterCells.has(key)) throw new Error(`${id} ${cid}: destination ${key} is ${k}, not water/cluster`);
    }
  }
  // (2) clear-then-stamp the clusters.
  const out = rows.map((r) => r.slice());
  for (const key of clusterCells) { const [x, y] = key.split(',').map(Number); out[y][x] = '~'; }
  for (const [cid, mv] of Object.entries(lane.move)) {
    const [cx, cy] = CLUSTERS[cid]; const [tx, ty] = mv.to;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) {
      const sdy = mv.flip ? 1 - dy : dy;
      out[ty + dy][tx + dx] = rows[cy + sdy][cx + dx];
    }
  }
  // (3) kind conversion on the repositioned grid.
  const sandCh = CH(lane.sand), rockCh = CH(lane.rock);
  const newRows = out.map((r) => r.map((ch) => {
    const k = kindOf(ch);
    if (k === 'sand') return sandCh;
    if (k === 'rock') return rockCh;
    return ch;
  }).join(''));
  // (4) count parity: identical modulo sand->newsand, rock->newrock.
  const bc = counts(snap.rows), ac = counts(newRows);
  const expect = { ...bc };
  delete expect.sand; delete expect.rock;
  expect[kindOf(sandCh)] = bc.sand; expect[kindOf(rockCh)] = bc.rock;
  if (JSON.stringify(Object.entries(expect).sort()) !== JSON.stringify(Object.entries(ac).sort()))
    throw new Error(`${id}: count parity failed\n before=${JSON.stringify(bc)}\n after=${JSON.stringify(ac)}`);
  // (5) warp cells byte-identical.
  for (const w of snap.warps || []) if (newRows[w.y][w.x] !== snap.rows[w.y][w.x]) throw new Error(`${id}: warp cell moved at ${w.x},${w.y}`);
  // (6) splice prep: source rows in file must equal the snapshot.
  const [rs, re] = rowsSpan(src, id);
  const seg = src.slice(rs, re);
  const rowStrs = [...seg.slice(seg.indexOf('[')).matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  if (JSON.stringify(rowStrs) !== JSON.stringify(snap.rows)) throw new Error(id + ': source rows != snapshot rows');
  edits.push([rs, re, seg, newRows]);
  console.log(id, 'converted: sand', bc.sand, '->', kindOf(sandCh), '| rock', bc.rock, '->', kindOf(rockCh), '| water', ac.water, '| counts parity OK');
}
for (const [rs, re, seg, newRows] of edits.sort((a, b) => b[0] - a[0])) {
  let out = seg;
  const open = seg.indexOf('[');
  const matches = [...seg.slice(open).matchAll(/"([^"]*)"/g)];
  if (matches.length !== newRows.length) throw new Error('row-string count mismatch in splice');
  for (let i = matches.length - 1; i >= 0; i--) {
    const idx = open + matches[i].index;
    out = out.slice(0, idx) + '"' + newRows[i] + '"' + out.slice(idx + matches[i][0].length);
  }
  src = src.slice(0, rs) + out + src.slice(re);
}
fs.writeFileSync(path, src);
console.log('converted', edits.length, 'lanes in maps5.mjs');
