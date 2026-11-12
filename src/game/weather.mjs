// weather.mjs — the visual weather layer (Arc 3 ruling 4, Stage H4a).
// PRESENTATION ONLY: rain streaks, ash drift, sand haze and harsh-sun
// glare drawn on the Premium+ atmosphere layer of the overworld render
// (after the time-of-day tint, before HUD text). Weather NEVER touches
// battle mechanics (battle weather identity belongs to Grounds) and
// NEVER touches encounters — this module reads state, it writes none.
//
// The field is per-map DATA: maps7.mjs declares `weather` on every
// Hoenn outdoor map ('clear' | 'rain' | 'sun' | 'ash' | 'sand').
// Arden/Yamato/Orange maps declare no field and resolve 'clear' —
// untouched. Indoor and dark maps never render weather.
//
// CLIMAX-STATE OVERRIDE (H4a ships the mechanism; H4b's climax drives
// it): while story.flags.climax_drought stands, every Hoenn outdoor
// map renders harsh sun; while story.flags.climax_deluge stands,
// every Hoenn outdoor map renders heavy rain. The override wins over
// the map's own field and resolves ONLY on maps that declare a
// weather field (the Hoenn outdoors) — a Arden map under a set
// climax flag is byte-identical to today. If both flags stand
// (a corrupt or mid-transition state), drought wins: the land
// titan was woken first, and H4b never sets both at once.

export const CLIMAX_DROUGHT_FLAG = 'climax_drought';
export const CLIMAX_DELUGE_FLAG = 'climax_deluge';
export const WEATHER_KINDS = ['clear', 'rain', 'sun', 'ash', 'sand', 'fog'];

// Pure resolver: (state, mapDef) -> { kind, source, heavy }.
//   kind   one of WEATHER_KINDS (the field value, or the override's)
//   source 'climax' | 'map' | 'none' — where the kind came from
//   heavy  true only under a climax override (denser render)
export function weatherForMap(state, map) {
  if (!map || map.indoor || map.dark) return { kind: 'clear', source: 'none', heavy: false };
  const field = map.weather;
  if (!field || !WEATHER_KINDS.includes(field)) return { kind: 'clear', source: 'none', heavy: false };
  const flags = (state && state.story && state.story.flags) || {};
  if (flags[CLIMAX_DROUGHT_FLAG]) return { kind: 'sun', source: 'climax', heavy: true };
  if (flags[CLIMAX_DELUGE_FLAG]) return { kind: 'rain', source: 'climax', heavy: true };
  // Arc 4 Stage S4: Defog. A fog map reads clear while its per-map
  // defog flag stands (story.flags['defogged_' + map.id], written by
  // the Defog field use in overworld-systems and cleared when the
  // player leaves the map — the fog returns on re-entry, per canon).
  if (field === 'fog' && flags['defogged_' + map.id]) return { kind: 'clear', source: 'defog', heavy: false };
  return { kind: field, source: 'map', heavy: false };
}

// Deterministic per-drop hash (no RNG state consumed — the render
// must never perturb gameplay randomness).
function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// The renderer. Called from OverworldScene.render with the already-
// resolved weather state; draws inside the camera view rect only.
// Animation rides the game's presentation clock (game._animT) and
// freezes to a static frame under Reduced Motion.
export function drawWeatherOverlay(r, game, wstate) {
  if (!wstate || wstate.kind === 'clear') return;
  const c = r.ctx;
  if (!c) return;
  const T = 16;
  const x0 = r.camX - T, y0 = r.camY - T;
  const w = r.viewW + 2 * T, h = r.viewH + 2 * T;
  const still = !!(game.state && game.state.settings && game.state.settings.reducedMotion);
  const t = still ? 0 : (game._animT || 0);
  const kind = wstate.kind;
  if (kind === 'sun') {
    // Harsh-sun glare: one warm flat wash (heavier under drought).
    c.fillStyle = wstate.heavy ? 'rgba(255,196,64,0.20)' : 'rgba(255,214,110,0.13)';
    c.fillRect(x0, y0, w, h);
    return;
  }
  if (kind === 'sand') {
    c.fillStyle = wstate.heavy ? 'rgba(214,164,92,0.22)' : 'rgba(214,164,92,0.14)';
    c.fillRect(x0, y0, w, h);
    c.fillStyle = 'rgba(232,196,130,0.5)';
    const n = still ? 10 : 22;
    for (let i = 0; i < n; i++) {
      const sp = 0.06 + hash01(i * 3 + 1) * 0.10;
      const px = x0 + ((hash01(i * 7 + 2) * (w + 80) + t * sp) % (w + 80)) - 40;
      const py = y0 + hash01(i * 13 + 5) * h + Math.sin(t / 700 + i) * 2;
      c.fillRect(px, py, 10 + hash01(i) * 14, 1);
    }
    return;
  }
  if (kind === 'ash') {
    const n = still ? 14 : (wstate.heavy ? 44 : 30);
    for (let i = 0; i < n; i++) {
      const fall = 0.008 + hash01(i * 5 + 3) * 0.014;
      const py = y0 + ((hash01(i * 11 + 1) * (h + 40) + t * fall) % (h + 40)) - 20;
      const px = x0 + hash01(i * 17 + 4) * w + Math.sin(t / 900 + i * 1.7) * 6;
      const s = hash01(i * 19) > 0.6 ? 2 : 1;
      c.fillStyle = hash01(i * 23) > 0.5 ? 'rgba(196,188,178,0.75)' : 'rgba(140,132,124,0.65)';
      c.fillRect(px, py, s, s);
    }
    return;
  }
  if (kind === 'fog') {
    // Fog: a pale wash plus slow drifting banks (hash-placed rects,
    // the ash/sand idiom — no RNG state consumed).
    c.fillStyle = 'rgba(216,222,228,0.34)';
    c.fillRect(x0, y0, w, h);
    c.fillStyle = 'rgba(232,236,240,0.30)';
    const n = still ? 6 : 12;
    for (let i = 0; i < n; i++) {
      const sp = 0.010 + hash01(i * 3 + 2) * 0.012;
      const px = x0 + ((hash01(i * 7 + 1) * (w + 120) + t * sp) % (w + 120)) - 60;
      const py = y0 + hash01(i * 13 + 4) * h;
      c.fillRect(px, py, 52 + hash01(i) * 60, 7 + hash01(i * 5) * 8);
    }
    return;
  }
  if (kind === 'rain') {
    c.fillStyle = wstate.heavy ? 'rgba(70,100,160,0.16)' : 'rgba(70,100,160,0.10)';
    c.fillRect(x0, y0, w, h);
    const n = still ? 18 : (wstate.heavy ? 90 : 55);
    c.fillStyle = 'rgba(178,208,240,0.65)';
    for (let i = 0; i < n; i++) {
      const fall = 0.35 + hash01(i * 3 + 8) * 0.3;
      const py = y0 + ((hash01(i * 7 + 6) * (h + 60) + t * fall) % (h + 60)) - 30;
      const px = x0 + hash01(i * 13 + 9) * (w + 40) + (py - y0) * 0.18 - 20;
      c.fillRect(px, py, 1, 6);
    }
  }
}
