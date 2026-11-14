// Wave T52 rig: author the four Rimefall .pix tiles from
// pattern rules (packed-snow grooves / drift-cap roof) and
// hand-authored prop rows (the iron bollard, the stone
// lantern), then assert every row is exactly 16 chars.
// (WAVE-T52-RIMEFALL-PLAN.md §5.)
import { writeFileSync } from 'node:fs';

const D = '/home/hatch/workspace/ashs-journey-t52/assets/sprites/pix/tiles/';
const H = (x, y, a, b, m) => ((x * a + y * b) % m + m) % m;

function emit(name, header, rows, pal) {
  for (const r of rows) if (r.length !== 16) throw new Error(name + ' row len ' + r.length + ': ' + JSON.stringify(r));
  const body = ['# ' + header, 'PIX ' + name + ' 16 16', ...rows, 'PAL',
    ...Object.entries(pal).map(([c, [hex, label]]) => c + ' ' + hex + ' ' + label), ''].join('\n');
  writeFileSync(D + name + '.pix', body);
  console.log('wrote', name);
}

// --- rimefloor: PACKED-SNOW STREET — hard-packed blue-white
// snow with two dark sledge-runner grooves running the tile's
// length and sparse ice flecks.
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      let c;
      if (x === 4 || x === 5 || x === 11 || x === 12) c = (x % 2 === 0) ? 'g' : 'G'; // runner grooves (paired)
      else {
        c = (H(x, y, 3, 7, 5) === 0) ? 'b' : 'a';                       // packed snow tones
        if (H(x, y, 7, 13, 29) === 0) c = 'i';                          // ice fleck
        if (H(x, y, 11, 5, 31) === 0) c = 'w';                          // fresh-snow fleck
      }
      r += c;
    }
    rows.push(r);
  }
  emit('tile-rimefloor',
    "Wave T52 (Rimefall kit): rimefloor — Rimefall City's registered street kind (the fleet's street kinds carry the -floor suffix; the desire-path tiers key on it). PACKED-SNOW STREET: hard-packed snow in blue-white tones with two dark sledge-runner grooves running the tile's length and sparse ice flecks — the snow port's streets are snow itself, pressed flat by sledges and boots. A GROOVED PACKED FIELD: unlike Astral's moonfloor (lavender flags, violet grout, star flecks), Fenland's walkfloor (pegged olive planks), Repose's pebblefloor (rounded cobbles), Heritage's heritagefloor (worn teal flagstone) and the fleet's cave/route ice kinds (icefloor glossy cave ice, frostfloor route crust — neither a packed town street). (NO-SAME-KIT law; WAVE-T52-RIMEFALL-PLAN.md §5.)",
    rows, {
      a: ['#dde9f2', 'packed snow — blue-white'],
      b: ['#cfdfec', 'packed snow — pressed tone'],
      w: ['#f4fafc', 'fresh-snow fleck'],
      i: ['#a9c6dc', 'ice fleck'],
      g: ['#5d7690', 'sledge-runner groove — dark'],
      G: ['#7590ab', 'sledge-runner groove — worn edge'],
    });
}

// --- driftroof: DRIFT-CAP ROOF — dark slate shingles at the
// foot, a deep snowdrift cap with a scalloped drift edge and
// an icicle fringe at the eave line.
{
  const rows = [];
  const driftEdge = [10, 11, 11, 12, 12, 11, 11, 10, 10, 11, 12, 12, 11, 11, 10, 10]; // per-column drift depth
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      let c;
      if (y < driftEdge[x] - 2) c = (H(x, y, 5, 3, 7) === 0) ? 'W' : 'w';   // drift cap body
      else if (y < driftEdge[x]) c = 'e';                                   // scalloped drift edge (shaded lip)
      else if (y === driftEdge[x]) c = (x % 3 === 0) ? 'i' : 'e';           // icicle fringe at the eave
      else {
        const cy = (y - 11) % 4;
        if (cy === 3) c = 's';                                              // shingle course seam
        else if (cy === 0) c = 'l';                                         // lit shingle top edge
        else c = (H(x, y, 7, 13, 23) === 0) ? 'd' : 'a';                    // shingle body + grain
      }
      r += c;
    }
    rows.push(r);
  }
  emit('tile-driftroof',
    "Wave T52 (Rimefall kit): driftroof — worn only by the shipped Rimefall Gym stamp's tr roof cells, so the town's landmark wears the town's own register: a DRIFT-CAP ROOF, dark slate shingles at the foot under a deep snowdrift cap with a scalloped drift edge and an icicle fringe at the eave — the approved painting's gym hall carries the deepest snow load in town. A snow-LOADED roof: unlike Astral's duskroof (violet shingle courses, no snow load), Fenland's boardroof (vertical board courses), Honeyfield's bloomroof (petal scales), Heritage's heritageroof (plain teal slate). (NO-SAME-KIT law; WAVE-T52-RIMEFALL-PLAN.md §5.)",
    rows, {
      w: ['#eef6fa', 'snowdrift cap'],
      W: ['#e2eef6', 'snowdrift cap — shaded scoop'],
      e: ['#b9d2e4', 'drift edge / eave — blue shade'],
      i: ['#dceefb', 'icicle fringe'],
      a: ['#46586e', 'shingle body — dark slate'],
      l: ['#5d748e', 'shingle lit top edge'],
      d: ['#37485c', 'shingle grain shade'],
      s: ['#26313f', 'shingle course seam'],
    });
}

// --- ironbollard (prop): a squat dark-iron mooring bollard
// with a rope coil at its foot and a snow cap — town snow
// baked in at the MEASURED tg-snowpoint colour (#e9f2f6).
{
  const rows = [
    'gggggggggggggggg',
    'gggggggwwggggggg',
    'ggggggwwwwgggggg',
    'gggggiiiiiiigggg',
    'gggggiiiiiiigggg',
    'ggggggiiiiiggggg',
    'ggggggiiiiiggggg',
    'gggggIIIIIIggggg',
    'gggggIiiiiIggggg',
    'gggggIIIIIIggggg',
    'gggggIIIIIIggggg',
    'gggggrrrrrrggggg',
    'ggggrRRRRRRrgggg',
    'ggggrrrrrrrrgggg',
    'gggggggggggggggg',
    'gggggggggggggggg',
  ];
  emit('tile-prop-ironbollard',
    "Wave T52 (Rimefall kit): ironbollard — a squat dark-iron mooring bollard with a rope coil at its foot and a cap of snow: the approved painting's pier bollards, carried to the backend's pier (the shipped boardwalk block, rows 13-16 x12-15) as a pair on its shoulders at (11,13) and (16,13) beside CAPT NORTHSTAR's ferry post; no actor, no dialogue, no event invented. Distinct from Bridgeport's mooringpost (a tall timber post): this is iron, squat, rope-coiled. Fully opaque: the town snow is baked in at the MEASURED tg-snowpoint colour (#e9f2f6). (WAVE-T52-RIMEFALL-PLAN.md §5.)",
    rows, {
      g: ['#e9f2f6', 'town snow — measured tg-snowpoint'],
      w: ['#f7fcfd', 'snow cap — fresh white'],
      i: ['#8fa5ba', 'iron — lit face'],
      I: ['#54687e', 'iron — body'],
      r: ['#8a6f4d', 'rope coil — shaded'],
      R: ['#b08d5f', 'rope coil — lit'],
    });
}

// --- stonelantern (prop): a snow-capped stone lantern with
// a warm window slit — town snow baked in (measured).
{
  const rows = [
    'gggggggggggggggg',
    'ggggggwwwwgggggg',
    'gggggwwwwwwggggg',
    'ggggSSSSSSSSgggg',
    'ggggSSSSSSSSgggg',
    'gggggSSSSSSggggg',
    'gggggsSSSSsggggg',
    'gggggsSWWSsggggg',
    'gggggsSWWSsggggg',
    'gggggsSSSSsggggg',
    'gggggSSSSSSggggg',
    'ggggggSSSSgggggg',
    'ggggggSSSSgggggg',
    'gggggSSSSSSggggg',
    'ggggSSSSSSSSgggg',
    'gggggggggggggggg',
  ];
  emit('tile-prop-stonelantern',
    "Wave T52 (Rimefall kit): stonelantern — a snow-capped stone lantern with a warm window slit: the approved painting's temple-court dressing, carried to the backend's temple ground (the shipped temple stamp, rows 11-12 x3-6) as a pair flanking its approach at (2,13) and (6,13), either side of the garden plot's north dot; the temple's steps are swept by TEMPLE ACOLYTE REN (his own dialogue, byte-kept) — no actor, no dialogue, no event invented. Fully opaque: the town snow is baked in at the MEASURED tg-snowpoint colour (#e9f2f6). (WAVE-T52-RIMEFALL-PLAN.md §5.)",
    rows, {
      g: ['#e9f2f6', 'town snow — measured tg-snowpoint'],
      w: ['#f7fcfd', 'snow cap — fresh white'],
      S: ['#7e8ea0', 'lantern stone — grey'],
      s: ['#5d6d80', 'lantern stone — shaded edge'],
      W: ['#ffd98a', 'window slit — warm light'],
    });
}
