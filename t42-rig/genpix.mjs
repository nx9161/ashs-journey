// Wave T42 rig: author the four Revelry .pix tiles from pattern
// rules (signal slab / beam panel / window frieze) and hand-authored
// prop rows (the screen totem), then assert every row is exactly 16
// chars. The rendered tiles are viewed via pix2png before landing —
// files are the deliverable. (WAVE-T42-REVELRY-PLAN.md §5.)
import { writeFileSync } from 'node:fs';

const D = '/home/hatch/workspace/ashs-journey-t42/assets/sprites/pix/tiles/';
const H = (x, y, a, b, m) => ((x * a + y * b) % m + m) % m;

function emit(name, header, rows, pal) {
  for (const r of rows) if (r.length !== 16) throw new Error(name + ' row len ' + r.length + ': ' + r);
  const body = ['# ' + header, 'PIX ' + name + ' 16 16', ...rows, 'PAL',
    ...Object.entries(pal).map(([c, [hex, label]]) => c + ' ' + hex + ' ' + label), ''].join('\n');
  writeFileSync(D + name + '.pix', body);
  console.log('wrote', name);
}

// --- beamfloor: SIGNAL SLAB — large smooth steel-blue slabs, joint
// lines on the top/left edges (tiling reads as a slab grid), pale
// rivets inset at the corners, sparse sheen speckle.
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      let c = 'b';
      if (y === 0 || x === 0) c = 'j';
      else if (H(x, y, 7, 13, 29) === 0) c = 's';
      if ((x === 2 || x === 13) && (y === 2 || y === 13)) c = 'r';
      r += c;
    }
    rows.push(r);
  }
  emit('tile-beamfloor',
    "Wave T42 (Revelry kit): beamfloor — Revelry City's registered street kind (the fleet's street kinds carry the -floor suffix; the desire-path tiers key on it). SIGNAL SLAB: large smooth steel-blue slabs — joints on the top/left edges so the tiling reads as a slab grid, pale rivets inset at the corners, a sparse sheen speckle. Structurally LARGE SMOOTH SLABS in a cool steel register — unlike Fernmere's slatefloor (small grey-green sett cobbles), Farsight's avenuefloor (warm gold slabs), Perennial's plateaufloor (cream marble with a gold vein) and Lilac's gridfloor (bronze lattice). An outdoor studio floor for the city every screen watches. (NO-SAME-KIT law; WAVE-T42-REVELRY-PLAN.md §5.)",
    rows, {
      b: ['#6d87a0', 'steel-slab base'],
      j: ['#47617a', 'slab joint'],
      s: ['#84a6c0', 'sheen speckle'],
      r: ['#a8c4da', 'corner rivet'],
    });
}

// --- beamroof: BEAM PANEL — horizontal steel-glass bands in the
// TOWN_STYLE roof palette with mullions and one pale diamond stud.
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      let c = 'm';
      if (y <= 1) c = 'l';
      else if (y >= 13) c = 'd';
      else if (x % 5 === 0) c = 'd';
      if ((x === 8 && (y === 5 || y === 9)) || (y === 7 && x >= 6 && x <= 10) || ((x === 7 || x === 9) && (y === 6 || y === 8))) c = 'w';
      r += c;
    }
    rows.push(r);
  }
  emit('tile-beamroof',
    "Wave T42 (Revelry kit): beamroof — the Revelry TV station's own roof. BEAM PANEL: horizontal steel-glass bands in the town's TOWN_STYLE roof palette (light top course, mid glass field with dark mullions, shadow course) with one pale diamond stud — a flat broadcast panel, worn only by the station's roof cells. No other roof in the fleet is horizontal glass banding (Canopy's glassroof is a dome register on houses). (NO-SAME-KIT law; WAVE-T42-REVELRY-PLAN.md §5.)",
    rows, {
      m: ['#5d8aa8', 'glass mid (TOWN_STYLE roof)'],
      l: ['#84aec9', 'glass light course'],
      d: ['#385a73', 'mullion / shadow course'],
      w: ['#dceef8', 'diamond stud'],
    });
}

// --- condoroof: WINDOW FRIEZE — a warm log-brown band carrying a
// row of small lit windows (the condo's hundred windows).
{
  const rows = [];
  for (let y = 0; y < 16; y++) {
    let r = '';
    for (let x = 0; x < 16; x++) {
      let c = 'g';
      if (y <= 1 || y >= 14) c = 'k';
      else if (H(x, y, 11, 5, 31) === 0) c = 't';
      const win = (x >= 1 && x <= 3) || (x >= 6 && x <= 8) || (x >= 11 && x <= 13);
      if (y >= 6 && y <= 10 && win) c = (y === 6 || y === 10) ? 'k' : 'w';
      r += c;
    }
    rows.push(r);
  }
  emit('tile-condoroof',
    "Wave T42 (Revelry kit): condoroof — the Revelry Condo's own roof. WINDOW FRIEZE: a warm log-brown band (the TOWN_STYLE log tone) carrying a row of small lit windows — the painting's hundred-window condo towers carried on the roofline, worn only by the condo's roof cells so the condo stops sharing the base house roof with the House. Structurally a frieze band, unlike every shingle/shake/thatch/slate roof in the fleet. (NO-SAME-KIT law; WAVE-T42-REVELRY-PLAN.md §5.)",
    rows, {
      g: ['#77644a', 'log-brown band (TOWN_STYLE log)'],
      k: ['#5d4c36', 'band course / window frame'],
      t: ['#8a7554', 'band speckle'],
      w: ['#f2e3b3', 'lit window pane'],
    });
}

// --- screentotem (PROP): a standing street screen — dark post and
// frame, pale cyan face with scanlines and the tower's ring glyph;
// the town grass is baked in (measured #19841e, fully opaque).
{
  const rows = [
    'gggggggggggggggg',
    'ggppppppppppppgg',
    'ggpccccccccccpgg',
    'ggpccccddccccpgg',
    'ggpcccdccdcccpgg',
    'ggpcccdccdcccpgg',
    'ggpccccddccccpgg',
    'ggpsssssssssspgg',
    'ggpccccccccccpgg',
    'ggppppppppppppgg',
    'gggggggppggggggg',
    'gggggggppggggggg',
    'gggggggppggggggg',
    'gggggggppggggggg',
    'ggggggppppgggggg',
    'gggggggggggggggg',
  ];
  emit('tile-prop-screentotem',
    "Wave T42 (Revelry kit): screentotem — a street screen totem: dark post and frame carrying a pale cyan screen with a scanline and the tower's ring glyph — every screen in Borea tuned to one tower, standing on the street. A pair flanks the front lawn beside the town sign and the TV sign. Fully opaque — the town grass is baked in (measured #19841e from the shipped render). (NO-SAME-KIT law; WAVE-T42-REVELRY-PLAN.md §5.)",
    rows, {
      g: ['#19841e', 'town grass (measured, baked in)'],
      p: ['#2a2f38', 'post / frame'],
      c: ['#bfe6f2', 'screen face'],
      s: ['#7fb8cc', 'scanline'],
      d: ['#385a73', 'ring glyph'],
    });
}
