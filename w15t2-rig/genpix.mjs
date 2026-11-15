// W15-T2 genpix: author the six 16x48 landmark cap tiles.
// Newleaf Tower (Iris): wooden pagoda tiers, violet-slate roofs, the great
// pillar reading as a post colonnade through the wall bands, lit lanterns.
// Chime Tower (Lantern): cedar tiers in the town's own register, an open
// bell chamber with a brass bell in the centre tiles, red band accents.
// Deterministic speckle (h2 hash, same family as tiles.mjs).
import fs from 'node:fs';

const OUT = new URL('../assets/sprites/pix/tiles/', import.meta.url).pathname;
function h2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
const blank = () => Array.from({ length: 48 }, () => Array(16).fill('k'));
function set(t, x, y, ch) { if (x >= 0 && x < 16 && y >= 0 && y < 48) t[y][x] = ch; }
function rect(t, x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(t, x, y, ch); }
// slate/cedar shingle roof band: speckle rows, trim row at the bottom.
// gx = global x offset of this tile in the run.
function roofBand(t, y0, y1, gx, P) {
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < 16; x++) {
      let ch = P.base;
      const r = h2(gx + x, y);
      if (r < 0.16) ch = P.dark;
      else if (r > 0.86) ch = P.light;
      set(t, x, y, ch);
    }
  }
  for (let x = 0; x < 16; x++) { set(t, x, y1 - 1, P.dark); set(t, x, y1, P.trim); }
}
// wood plank wall band with vertical seams + beams top/bottom
function woodBand(t, y0, y1, gx, P) {
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < 16; x++) {
      let ch = P.wood;
      if (y === y0 || y === y1) ch = P.beam;
      else if ((gx + x) % 4 === 3) ch = P.beam;
      else if (h2(gx + x, y * 3) > 0.88) ch = P.woodLight;
      set(t, x, y, ch);
    }
  }
}
function lantern(t, cx, cy, P) { // 3x3 framed lit lantern at (cx, cy)
  rect(t, cx, cy, cx + 2, cy, 'k');
  set(t, cx, cy + 1, 'k'); set(t, cx + 1, cy + 1, P.lampCore); set(t, cx + 2, cy + 1, 'k');
  set(t, cx, cy + 2, P.lamp); set(t, cx + 1, cy + 2, P.lampCore); set(t, cx + 2, cy + 2, P.lamp);
}
function emit(name, t, pal, comment) {
  const rows = t.map((r) => r.join(''));
  const palTxt = Object.entries(pal).map(([c, [hex, label]]) => `${c} ${hex} ${label}`).join('\n');
  fs.writeFileSync(OUT + name + '.pix', `# ${comment}\nPIX ${name} 16 48\n${rows.join('\n')}\nPAL\n${palTxt}\n`);
  console.log('wrote', name, rows.length, 'rows');
}

/* ---------------- NEWLEAF ---------------- */
const NL = {
  base: 'a', dark: 'd', light: 'c', trim: 't',
  wood: 'w', woodLight: 'W', beam: 'b', lamp: 'g', lampCore: 'h',
};
const NL_PAL = {
  k: ['#2b2320', 'outline-deep'], d: ['#4d596a', 'slate-dark'], a: ['#5e6d82', 'violet-slate'],
  c: ['#718198', 'slate-light'], t: ['#748aaa', 'slate-trim'], w: ['#6b5138', 'weathered-wood'],
  W: ['#82664a', 'wood-light'], b: ['#463322', 'wood-beam'], g: ['#d1bc88', 'lantern-gold'],
  h: ['#f0dfa8', 'lantern-core'],
};
function newleaf(tileIdx) { // tileIdx 0=L,1..4=C,5=R across the 6-wide run
  const t = blank(); const gx = tileIdx * 16;
  // ridge/finial zone rows 0-3: slate cap slope; centre tiles carry the mast
  roofBand(t, 0, 3, gx, NL);
  if (tileIdx >= 1 && tileIdx <= 4) { rect(t, 7, 0, 8, 1, 'b'); set(t, 7, 0, 'g'); set(t, 8, 0, 'g'); }
  if (tileIdx === 0) { set(t, 0, 2, 't'); set(t, 0, 3, 't'); set(t, 1, 3, 't'); } // upturned west tip
  if (tileIdx === 5) { set(t, 15, 2, 't'); set(t, 15, 3, 't'); set(t, 14, 3, 't'); }
  roofBand(t, 4, 11, gx, NL);            // top roof (8)
  woodBand(t, 12, 19, gx, NL);          // wall band 1 (8)
  roofBand(t, 20, 27, gx, NL);          // middle roof (8)
  woodBand(t, 28, 35, gx, NL);          // wall band 2 (8)
  roofBand(t, 36, 47, gx, NL);          // bottom roof + eave (12)
  const bands = [[12, 19], [28, 35]];
  // X-braces in the wall bands' open bays (outer quarters on C tiles,
  // full width on the end tiles) — the tower's timber framing
  for (const [y0, y1] of bands) {
    for (let y = y0 + 1; y <= y1 - 1; y++) {
      const d = y - (y0 + 1); // 0..5
      for (const x of [d, 15 - d]) {
        if (tileIdx >= 1 && tileIdx <= 4 && x >= 4 && x <= 11) continue; // keep the pillar bay clear
        if (t[y][x] === 'w' || t[y][x] === 'W') set(t, x, y, 'b');
      }
    }
  }
  // the great pillar: a 6px trunk through both wall bands, centre tiles
  if (tileIdx >= 1 && tileIdx <= 4) {
    for (const [y0, y1] of bands) {
      for (let y = y0; y <= y1; y++) {
        set(t, 5, y, 'b'); set(t, 6, y, 'W'); set(t, 7, y, 'W'); set(t, 8, y, 'w'); set(t, 9, y, 'w'); set(t, 10, y, 'b');
      }
    }
  }
  // corner posts on the end tiles
  if (tileIdx === 0) for (const [y0, y1] of bands) for (let y = y0; y <= y1; y++) { set(t, 1, y, 'b'); set(t, 2, y, 'W'); set(t, 3, y, 'b'); }
  if (tileIdx === 5) for (const [y0, y1] of bands) for (let y = y0; y <= y1; y++) { set(t, 12, y, 'b'); set(t, 13, y, 'W'); set(t, 14, y, 'b'); }
  // pagoda taper: the upper tiers step inward on the end tiles
  // (shadow-tone inset columns fake the narrowing silhouette)
  if (tileIdx === 0) { for (let y = 0; y <= 3; y++) rect(t, 0, y, 3, y, 'd'); for (let y = 4; y <= 11; y++) rect(t, 0, y, 1, y, 'd'); }
  if (tileIdx === 5) { for (let y = 0; y <= 3; y++) rect(t, 12, y, 15, y, 'd'); for (let y = 4; y <= 11; y++) rect(t, 14, y, 15, y, 'd'); }
  // lanterns hung in the open bays
  if (tileIdx === 0) lantern(t, 11, 14, NL);
  if (tileIdx === 5) lantern(t, 2, 14, NL);
  if (tileIdx >= 1 && tileIdx <= 4) lantern(t, 12, 30, NL);
  return t;
}
emit('tile-newleafcap-l', newleaf(0), NL_PAL, 'Wave W15-T2: Newleaf Tower cap L — wooden pagoda tiers, violet slate, great-pillar post (Premium+ W6 TX-3 tall art, bottom-anchored on the existing roof cell).');
emit('tile-newleafcap-c', newleaf(2), NL_PAL, 'Wave W15-T2: Newleaf Tower cap C — centre module: great pillar trunk through the wall bands, lit lantern.');
emit('tile-newleafcap-r', newleaf(5), NL_PAL, 'Wave W15-T2: Newleaf Tower cap R — mirror register of the L cap.');

/* ---------------- CHIME ---------------- */
const CH = { base: 'a', dark: 'd', light: 'c', trim: 'd' };
const CH_PAL = {
  k: ['#241811', 'chamber-deep'], d: ['#38241a', 'cedar-shadow'], b: ['#54352a', 'cedar-deep'],
  a: ['#6e4530', 'cedar'], c: ['#8a5f3d', 'cedar-lit'], e: ['#97754e', 'cedar-weathered'],
  r: ['#b45246', 'lantern-band'], G: ['#b98a2e', 'bell-brass'], g: ['#d9b84a', 'brass-light'],
  s: ['#7a5a1e', 'brass-shadow'], w: ['#9b7659', 'landmark-wall'],
};
function cedarRoof(t, y0, y1, gx) {
  for (let y = y0; y <= y1; y++) for (let x = 0; x < 16; x++) {
    let ch = 'a'; const r = h2(gx + x, y + 40);
    if ((y - y0) % 4 === 3) ch = 'd'; else if (r < 0.16) ch = 'b'; else if (r > 0.86) ch = 'c';
    set(t, x, y, ch);
  }
  for (let x = 0; x < 16; x++) { set(t, x, y1 - 1, 'd'); set(t, x, y1, 'e'); }
}
function cedarWall(t, y0, y1, gx) {
  for (let y = y0; y <= y1; y++) for (let x = 0; x < 16; x++) {
    let ch = 'w'; if (y === y0 || y === y1) ch = 'b'; else if (h2(gx + x, y * 5) > 0.9) ch = 'e';
    set(t, x, y, ch);
  }
}
function bell(t, cx) { // bell centred at column cx, chamber rows 30..41
  rect(t, 0, 30, 15, 41, 'k');                       // dark chamber recess
  for (let x = 0; x < 16; x++) { set(t, x, 30, 'b'); set(t, x, 31, 'b'); } // beam
  rect(t, 0, 30, 1, 41, 'b'); rect(t, 14, 30, 15, 41, 'b');                // posts
  set(t, cx, 32, 's'); set(t, cx + 1, 32, 's');
  rect(t, cx - 1, 33, cx + 2, 33, 'G');
  rect(t, cx - 2, 34, cx + 3, 37, 'G');
  for (let y = 34; y <= 37; y++) { set(t, cx - 2, y, 'g'); set(t, cx + 3, y, 's'); }
  rect(t, cx - 3, 38, cx + 4, 38, 'G'); set(t, cx - 3, 38, 'g'); set(t, cx + 4, 38, 's');
  rect(t, cx - 3, 39, cx + 4, 39, 's');               // rim
  set(t, cx, 40, 'k'); set(t, cx + 1, 40, 'G');       // clapper
}
function chime(tileIdx) { // 0=L,1=C,2=C,3=R across the 4-wide run
  const t = blank(); const gx = tileIdx * 16;
  cedarRoof(t, 0, 3, gx);                                   // ridge zone
  if (tileIdx === 1 || tileIdx === 2) { rect(t, 7, 0, 8, 1, 'b'); set(t, 7, 0, 'g'); set(t, 8, 0, 'g'); } // finial lamp
  cedarRoof(t, 4, 13, gx);                                  // top roof
  cedarWall(t, 14, 19, gx);                                 // upper wall
  if (tileIdx === 0 || tileIdx === 3) { rect(t, 6, 15, 9, 18, 'k'); rect(t, 7, 16, 8, 17, 'g'); } // small lit window
  cedarRoof(t, 20, 29, gx);                                 // middle roof
  if (tileIdx === 1) bell(t, 7);                            // each C tile is a chamber with its own bell
  if (tileIdx === 2) bell(t, 7);
  if (tileIdx === 0 || tileIdx === 3) {                      // side wall in the bell band: red band + planks
    for (let y = 30; y <= 41; y++) for (let x = 0; x < 16; x++) {
      let ch = 'a'; if (y === 35) ch = 'r'; else if ((gx + x) % 4 === 3) ch = 'b'; else if (h2(gx + x, y * 7) > 0.88) ch = 'c';
      set(t, x, y, ch);
    }
    rect(t, 0, 30, 15, 31, 'b'); rect(t, 0, 40, 15, 41, 'b');
  }
  cedarRoof(t, 42, 47, gx);                                 // bottom eave
  return t;
}
emit('tile-chimecap-l', chime(0), CH_PAL, 'Wave W15-T2: Chime Tower cap L — cedar tiers in Lantern City register, red band, lit window (Premium+ W6 TX-3 tall art).');
emit('tile-chimecap-c', chime(1), CH_PAL, 'Wave W15-T2: Chime Tower cap C — open bell chamber, brass bell hung from the beam.');
emit('tile-chimecap-r', chime(3), CH_PAL, 'Wave W15-T2: Chime Tower cap R — mirror register of the L cap.');
