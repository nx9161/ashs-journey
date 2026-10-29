// overworld.mjs — tile-map exploration: interpolated grid movement, tall-grass
// encounters (rustle -> ! -> transition, 900ms per ADR-004), follower partner,
// NPCs, signs, warps, pause menu (Bag/Party/Dex/Save/Options).

import { MAPS, WALKABLE, TRAINERS } from '../data/maps.mjs';
import { npcArtKind, NPC_ROAMING_KINDS, hashTile } from '../engine/art.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { TILE } from '../engine/render.mjs';
import { roll, intIn, pickWeighted } from '../engine/rng.mjs';
import { makeMon, dexRegister, displayName, dexCaughtCount } from './state.mjs';
import { DIFFICULTY_LABELS, difficultyOf, houseRule } from './rules.mjs';
import { PARTNER_MOODS } from '../data/dialogue.mjs';
import { TALE_NPCS, TALE_NPC_PATCHES } from '../data/quests.mjs';
import { PARLEY_NPCS, parleyVisible, bondTrainerVariant, recordBattleBond } from './bonds.mjs';
import { MOVES } from '../data/moves.mjs';
import { SFX } from '../engine/audio.mjs';
import { BattleScene } from './battle.mjs';
import { BootScene } from './title.mjs';

const WALK_MS = 200; // ~200ms per walked tile (GD feel note)

// ---- Premium+ W4 (AN-4): wander scoping (engine behaviour, NOT map data) ----
// The W0 design authored wander as a per-instance data field; this wave's
// hard gate forbids map-data edits, so the scope lives here as an engine
// table instead (the one deliberate deviation from the design, recorded
// in the W4 register entry). An NPC wanders iff ALL of these hold:
//   * its map is one of the ten settlements (routes/interiors/gyms are
//     out — the spec's acceptance is a TOWN crowd);
//   * its art kind is one of the 24 roaming generics (art.mjs table);
//   * it carries NO functional prop: sight trainers, healers, mart
//     clerks, PC/cheat terminals, spar coaches, tale actors (the
//     loadMap tale patches stamp tale/role/witness BEFORE this runs),
//     parley actors, event/ferry/slot/prize NPCs all stay at their
//     posts. Talk-based services (gifts, giveMon, trades, fossil
//     revival) are NOT pinned: every interaction resolves at the NPC's
//     current tile through npcTileOf, so they work from any tile in
//     the radius — wander can never strand them.
//   * it is not BILL of Cerulean: his instance is dialogue-only, but
//     his post beside the ev_bill event tile is a story placement.
// Radius is 2 (Chebyshev) around the authored home tile; step legality
// (updateWander) additionally bars warp tiles AND warp-adjacent tiles
// (a wanderer can never seal a door), signs, event/item/hidden tiles,
// other NPCs' current tiles, and the player's/follower's tiles.
const WANDER_TOWN_MAPS = new Set([
  'pallet', 'viridian', 'pewter', 'cerulean', 'vermilion',
  'celadon', 'saffron', 'lavender', 'fuchsia', 'cinnabar',
]);
const WANDER_PIN_PROPS = [
  'trainer', 'sight', 'heal', 'mart', 'pc', 'cheat', 'slots', 'prize',
  'parley', 'event', 'ferry', 'sparCoach', 'tale', 'role', 'witness',
  'duoPartner',
];
const WANDER_NAME_PINS = new Set(['BILL']);
const WANDER_DIRS = [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];

export class OverworldScene {
  enter() {
    const g = this.game;
    this.mapId = g.state.story.position.map;
    this.loadMap(this.mapId);
    const p = g.state.story.position;
    this.player = { tx: p.x, ty: p.y, px: p.x * TILE, py: p.y * TILE, dir: p.dir || 'down', moving: false, moveT: 0, fx: p.x, fy: p.y };
    this.trail = []; // partner path history
    this.partner = { px: this.player.px, py: this.player.py, hop: 0 };
    // Premium+ W3 state: follower facing/stillness (AN-2), footstep
    // puffs (AN-3), fishing presentation window, run hold.
    this.partnerDir = this.player.dir || 'down';
    this.stillMs = 0;
    this.puffs = [];
    this.fishing = null;
    this.running = false;
    this.enc = null; // encounter sequence state
    this.challenge = null; // Yellow-style trainer spot challenge (sight -> ! -> walk-up)
    this.banner = { text: this.map.name.toUpperCase(), t: 0 };
    this.stepsSinceEncounter = 0;
    this.chainCount = 0;
    this.pausedMenu = false;
    // P1/C6: movement tutorial shows once until the player takes a first step (or 30s).
    this.moveTut = g.state.story.flags.moveTutDone ? null : { t: 0 };
    // HUD chip change-detection state (the DOM chips live in the UI seat;
    // syncHud pushes values only when they change). undefined = never sent.
    this._hudLoc = undefined; this._hudObj = undefined; this._hudDex = undefined;
    this._hudBannerObj = null;
    // P1/D7: partner mood pip — tap = pet (same as facing + A on Pikachu).
    g.ui.onMoodTap = () => this.petPartner();
    g.ui.showMoodPip(true);
    g.ui.setBattleMode(false);
    g.audio.playMusic(this.map.music || 'route1-theme'); // per-map original score (maps.mjs `music`)
  }

  loadMap(id) {
    this.mapId = id;
    this.map = MAPS[id];
    // ADR-025 §4 (Candy Coach): the Sparring Coach stands in every Pokemon
    // Center only while the House Rule is on. The shared MAPS definition is
    // never mutated — the scene works on a shallow copy when a coach is
    // placed in the map's data.
    // ADR-025 §5 (Town Tales): the same copy gains the tale actors for
    // this map — new NPCs appended, existing townsfolk patched by name
    // with their tale role (data/quests.mjs TALE_NPCS / TALE_NPC_PATCHES).
    if (this.map && Array.isArray(this.map.npcs)) {
      let npcs = this.map.npcs;
      let changed = false;
      if (npcs.some((n) => n.sparCoach)) {
        const on = houseRule(this.game.state, 'candyCoach');
        npcs = npcs.filter((n) => on || !n.sparCoach);
        changed = true;
      }
      // World Art Wave 5b (Mart interior): mart clerks no longer stand
      // outdoors — a town scene filters its clerk out (the definition
      // stays in the town data as the stock/dialogue source of truth),
      // and the shared 'mart' scene fields the ORIGIN town's clerk
      // behind the goods counter at (5,2) instead, verbatim. The
      // origin is the via{} return ticket set by the door warp; with
      // no ticket (scripted entry) it falls back to Viridian, the
      // first Mart town — the Center's Pallet fallback pattern.
      if (id === 'mart') {
        const origin = (this.martReturn && this.martReturn.map) || 'viridian';
        this._martOrigin = origin;
        const src = MAPS[origin];
        const clerk = src && Array.isArray(src.npcs) ? src.npcs.find((n) => n.mart) : null;
        npcs = clerk ? [{ ...clerk, x: 5, y: 2 }] : [];
        changed = true;
      } else if (npcs.some((n) => n.mart)) {
        npcs = npcs.filter((n) => !n.mart);
        changed = true;
      }
      const patches = TALE_NPC_PATCHES.filter((p) => p.map === id);
      if (patches.length) {
        npcs = npcs.map((n) => {
          const p = patches.find((pp) => pp.name === n.name);
          return p ? { ...n, tale: p.tale, role: p.role, witness: p.witness } : n;
        });
        changed = true;
      }
      // Wave 5b: the SHOPKEEPER tale actor belongs to the 'mart' map
      // (quests.mjs) but is fielded only for a Viridian entry — in any
      // other town's Mart he would collide with that town's clerk.
      const taleNpcs = TALE_NPCS.filter((n) => n.map === id && (id !== 'mart' || n.name !== 'SHOPKEEPER' || this._martOrigin === 'viridian'));
      if (taleNpcs.length) {
        npcs = [...npcs, ...taleNpcs.map((n) => { const c = { ...n }; delete c.map; return c; })];
        changed = true;
      }
      // ADR-025 §2 (Bonds): the Celadon parley pair stand in Celadon
      // only while their scene is unresolved (post-St. Anne window).
      if (id === 'celadon' && parleyVisible(this.game.state)) {
        npcs = [...npcs, ...PARLEY_NPCS.map((n) => { const c = { ...n }; delete c.map; return c; })];
        changed = true;
      }
      if (changed) this.map = { ...this.map, npcs };
    }
    // Premium+ W4 (AN-4): EVERY load now works on per-NPC copies so the
    // runtime presentation state below never touches the shared MAPS
    // definitions (the loadMap copy discipline, extended from "when it
    // mutates" to always). Stamped per instance:
    //   _pk       stable identity (map id + roster index);
    //   _phaseMs  idle phase offset — roster slots spaced across the
    //             600ms idle period with a hash jitter under one slot,
    //             so offsets are pairwise distinct mod 600 across the
    //             whole roster: no two NPCs on a screen share an idle
    //             phase or flip at the same instant;
    //   _face     current facing — sight direction for trainers, the
    //             last wander-step / interaction direction otherwise;
    //   _wander   scoped wanderers only (see the scoping table above):
    //             current tile, hash-timed step period + counter. All
    //             state resets on every load (deterministic re-entry).
    if (this.map && Array.isArray(this.map.npcs)) {
      const roster = this.map.npcs.length;
      const stamped = this.map.npcs.map((n, i) => {
        const c = { ...n };
        c._pk = id + ':' + i;
        const slot = 600 / Math.max(1, roster);
        c._phaseMs = Math.floor(i * slot + hashTile(i, roster, 77) * slot * 0.6);
        c._face = (n.sight && n.sight.dir) || 'down';
        if (this.wanderRadiusFor(c, id) > 0) {
          const h1 = hashTile(n.x * 3 + i, n.y * 5 + i, 91);
          const h2 = hashTile(n.x * 7 + i, n.y * 11 + i, 97);
          c._wander = {
            hx: n.x, hy: n.y, x: n.x, y: n.y, fx: n.x, fy: n.y,
            radius: 2, period: 2600 + Math.floor(h1 * 3200),
            wt: Math.floor(h2 * 2600), step: 0, glide: 0,
          };
        }
        return c;
      });
      this.map = { ...this.map, npcs: stamped };
    }
    this.w = this.map.rows[0].length;
    this.h = this.map.rows.length;
    if (this.sysLoadMap) this.sysLoadMap(id);
    // Premium+ W4: door-critical tiles for the wander legality check
    // (see computeDoorCritical) — recomputed per load, towns only.
    this._doorCritical = WANDER_TOWN_MAPS.has(id) ? this.computeDoorCritical() : null;
    // P1 fix (owner report 2026-10-28): loadMap used to OVERWRITE
    // centerReturn with _lastCity here — a snapshot of the player's
    // tile taken when the PREVIOUS map loaded. That one line defeated
    // the warp's door-front anchor (onStep sets centerReturn from the
    // door's via BEFORE loadMap runs, below) and, on the blackout
    // paths (which load 'center' directly — no warp ever runs),
    // anchored the exit to the last load-time snapshot: the route
    // where the player fainted. Hence "I got out of the Center right
    // where I was defeated." centerReturn is now written ONLY by the
    // warp-in via and the blackout anchor (centerExit()); loadMap
    // never touches it. (The Mart never had this bug — Wave 5b gave
    // it its own ticket and no clobber.)
    // Shared interiors (center/mart) and house interiors are not
    // cities — loading one must not clobber the Fly/center origin.
    if (id !== 'center' && id !== 'mart' && !id.startsWith('house-')) this._lastCity = { map: id, x: this.player ? this.player.tx : 7, y: this.player ? this.player.ty : 9 };
  }

  // P1: the ONE resolver for "where does leaving the Center put me" —
  // the runtime ticket first, then the persisted last-Center anchor
  // (story.lastCenter survives a save/reload inside a Center, where
  // the runtime ticket is gone), then the genre fallback: Pallet,
  // home (Pallet has no Center of its own in this world).
  centerExit() {
    if (this.centerReturn && this.centerReturn.map) return this.centerReturn;
    const lc = this.game && this.game.state && this.game.state.story && this.game.state.story.lastCenter;
    if (lc && typeof lc.map === 'string' && Number.isFinite(lc.x) && Number.isFinite(lc.y)) return { map: lc.map, x: lc.x, y: lc.y };
    return { map: 'pallet', x: 7, y: 9 };
  }

  tileAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return ' ';
    return this.map.rows[y][x];
  }

  // Premium+ W4: an NPC's CURRENT tile — its wander tile while it
  // roams, its authored home tile otherwise. Every occupancy, sight,
  // interaction and render consumer resolves through these two helpers
  // so the picture, the collision and the talk target never disagree.
  npcX(n) { return n._wander ? n._wander.x : n.x; }
  npcY(n) { return n._wander ? n._wander.y : n.y; }

  // Premium+ W4: the door-critical set — static-terrain articulation
  // tiles whose removal would disconnect a warp from the map's largest
  // walkable component. A wanderer may never STEP onto one (its own
  // home tile exempt — homes are data): this is what "wander never
  // seals a door" means mechanically, and it subsumes sole-approach
  // corridors that a fixed warp-adjacency radius cannot see (e.g.
  // Cinnabar's (3,5), the only corridor tile to the (3,3) house door,
  // two tiles from the warp). Terrain only: NPC occupancy and boulders
  // are not part of the graph. Cost is trivial at town map sizes.
  computeDoorCritical() {
    const key = (x, y) => x + ',' + y;
    const stat = (x, y) => {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
      const t = this.tileAt(x, y);
      return WALKABLE.has(t) || (this.sysWalkableExtra && this.sysWalkableExtra(x, y));
    };
    const component = (banned) => {
      const seen = new Set(); let best = new Set();
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const k = key(x, y);
        if (!stat(x, y) || k === banned || seen.has(k)) continue;
        const comp = new Set([k]); const q = [[x, y]]; seen.add(k);
        while (q.length) {
          const [cx, cy] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy, nk = key(nx, ny);
            if (nk === banned || seen.has(nk) || !stat(nx, ny)) continue;
            seen.add(nk); comp.add(nk); q.push([nx, ny]);
          }
        }
        if (comp.size > best.size) best = comp;
      }
      return best;
    };
    const warpKeys = (this.map.warps || []).map((w) => key(w.x, w.y));
    if (!warpKeys.length) return new Set();
    const base = component(null);
    const protectedWarps = warpKeys.filter((k) => base.has(k));
    const crit = new Set();
    if (!protectedWarps.length) return crit;
    for (const k of base) {
      if (warpKeys.includes(k)) continue;
      const [x, y] = k.split(',').map(Number);
      const without = component(k);
      if (protectedWarps.some((wk) => !without.has(wk))) crit.add(key(x, y));
    }
    return crit;
  }

  // Premium+ W4: wander scope for one loaded instance (see the table
  // at WANDER_TOWN_MAPS). Returns the radius, or 0 for pinned.
  wanderRadiusFor(n, mapId) {
    if (!WANDER_TOWN_MAPS.has(mapId)) return 0;
    if (WANDER_NAME_PINS.has(n.name)) return 0;
    for (const p of WANDER_PIN_PROPS) if (n[p]) return 0;
    if (!NPC_ROAMING_KINDS.has(npcArtKind(n))) return 0;
    return 2;
  }

  walkable(x, y) {
    const t = this.tileAt(x, y);
    if (this.boulderAt && this.boulderAt(x, y)) return false;
    const base = WALKABLE.has(t) || (this.sysWalkableExtra && this.sysWalkableExtra(x, y));
    if (!base) return false;
    // NPCs block (at their CURRENT tiles — wander positions included)
    for (const n of this.map.npcs) if (this.npcX(n) === x && this.npcY(n) === y) return false;
    return true;
  }

  warpAt(x, y) {
    for (const wp of this.map.warps) if (wp.x === x && wp.y === y) return wp;
    return null;
  }

  npcAt(x, y) {
    for (const n of this.map.npcs) if (this.npcX(n) === x && this.npcY(n) === y) return n;
    return null;
  }

  // Premium+ W4 (AN-4): the wander step (W0 design, engine-scoped).
  // Called from update() BELOW the modal early-return, so open dialogue
  // or menus freeze every wanderer structurally. Fully hash-driven:
  // the candidate direction is a hash of (home tile, roster identity,
  // step counter) — no RNG stream is consumed, no Math.random — and an
  // illegal candidate means "stay" (the counter still advances, so an
  // NPC never freeze-locks onto one bad direction). A legal step sets
  // the logical tile at once and glides the render over 280ms in the
  // walk pair, facing the step direction. Reduced Motion: no stepping
  // at all (teleport-freeze per the design — wanderers hold home).
  updateWander(dt) {
    const g = this.game;
    if (!this.map || !Array.isArray(this.map.npcs)) return;
    const still = g.state && g.state.settings && g.state.settings.reducedMotion;
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    for (const n of this.map.npcs) {
      const w = n._wander;
      if (!w) continue;
      if (w.glide > 0) w.glide = Math.max(0, w.glide - dt * 1000);
      if (still) continue;
      w.wt += dt * 1000;
      if (w.wt < w.period) continue;
      w.wt = 0;
      w.step++;
      const di = Math.floor(hashTile(w.hx + w.step * 7, w.hy + w.step * 13, 131) * 4) % 4;
      const [dx, dy, dname] = WANDER_DIRS[di];
      const tx = w.x + dx, ty = w.y + dy;
      if (Math.max(Math.abs(tx - w.hx), Math.abs(ty - w.hy)) > w.radius) continue;
      if (tx === this.player.tx && ty === this.player.ty) continue;
      if (tx === ptx && ty === pty) continue;
      if (!this.walkable(tx, ty)) continue;
      // never stand on — or directly in front of — a warp (door sealing),
      // and never on a sign / event / item / hidden-item cell
      let barred = false;
      for (const wp of this.map.warps || []) {
        if (Math.max(Math.abs(tx - wp.x), Math.abs(ty - wp.y)) <= 1) { barred = true; break; }
      }
      if (barred) continue;
      // never seal a door: door-critical articulation tiles are barred
      // as step targets (the wanderer's own home tile is exempt)
      if (this._doorCritical && this._doorCritical.has(tx + ',' + ty) && !(tx === w.hx && ty === w.hy)) continue;
      if (this.signAt(tx, ty)) continue;
      if (this.map.events && this.map.events.some((e) => e.x === tx && e.y === ty)) continue;
      if (this.map.items && this.map.items.some((e) => e.x === tx && e.y === ty)) continue;
      if (this.map.hidden && this.map.hidden.some((e) => e.x === tx && e.y === ty)) continue;
      w.fx = w.x; w.fy = w.y;
      w.x = tx; w.y = ty;
      w.glide = 280;
      n._face = dname;
    }
  }

  signAt(x, y) {
    for (const s of this.map.signs) if (s.x === x && s.y === y) return s;
    return null;
  }

  update(dt) {
    const g = this.game;
    if (g.ui.update(dt)) return; // modal UI consumes input
    if (this.enc) { this.updateEncounter(dt); return; }
    if (this.challenge) { this.updateChallenge(dt); return; } // input locked: a trainer is walking up
    if (this.checkSightLines()) return; // spotted this tick — challenge takes over
    this.updateWander(dt); // Premium+ W4: ambient town wander (frozen while any modal above consumed the tick)

    const input = g.input;
    // Pause menu
    if (input.wasPressed('start') || input.wasPressed('escape')) {
      this.openPauseMenu();
      return;
    }
    // P1/D4: SELECT = registered item first (bicycle), then HUD quick-strip.
    if (input.wasPressed('select')) {
      if (!(this.sysSelect && this.sysSelect())) g.ui.setHudVisible(!g.ui.hudVisible);
      return;
    }
    // Interact
    if (input.wasPressed('a')) {
      if (this.tryInteract()) return;
    }

    // Premium+ W3: per-tick presentation state. Run = B held on foot
    // (not surfing / riding); stillness accumulates while the player
    // stands (drives the follower's look-around at 6s, sleep at 20s);
    // the fishing window ticks down; puffs age out at 300ms.
    this.running = !!(input.isHeld && input.isHeld('b') && !this.surfing && !this.riding);
    if (this.fishing) { this.fishing.t += dt * 1000; if (this.fishing.t > 2600) this.fishing = null; }
    if (this.puffs.length) {
      for (const pf of this.puffs) pf.t += dt * 1000;
      this.puffs = this.puffs.filter((pf) => pf.t < 300);
    }
    const p0 = this.player;
    p0.mode = this.surfing ? 'surf' : this.riding ? 'bike'
      : this.fishing ? 'fish' : (p0.moving && this.running) ? 'run' : 'walk';
    p0.fishPhase = this.fishing && this.fishing.t >= 450 ? 'hold' : 'cast';
    if (p0.moving) this.stillMs = 0; else this.stillMs += dt * 1000;

    // Movement
    const p = this.player;
    if (!p.moving) {
      const d = input.dir();
      if (d) {
        p.dir = d;
        const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0;
        const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
        if (this.walkable(p.tx + dx, p.ty + dy)) {
          p.moving = true; p.moveT = 0;
          p.fx = p.tx; p.fy = p.ty;
          p.tx += dx; p.ty += dy;
        } else if (this.fxState && this.fxState.strengthOn && this.boulderAt && this.boulderAt(p.tx + dx, p.ty + dy)) {
          // Strength push: shove the boulder one tile if the far side is free.
          const bx = p.tx + dx * 2, by = p.ty + dy * 2;
          const bt = this.tileAt(bx, by);
          if ((WALKABLE.has(bt) || bt === 'R') && !this.boulderAt(bx, by) && !this.npcAt(bx, by)) {
            const b = this.boulderAt(p.tx + dx, p.ty + dy);
            b.x = bx; b.y = by;
            p.moving = true; p.moveT = 0;
            p.fx = p.tx; p.fy = p.ty;
            p.tx += dx; p.ty += dy;
            g.audio.playSfx('menu-move');
          }
        }
      }
    } else {
      p.moveT += dt * 1000;
      const k = Math.min(1, p.moveT / (this.moveMs ? this.moveMs() : WALK_MS));
      p.cycleK = k; // W3: locomotion cycle position for playerSprite
      p.px = (p.fx + (p.tx - p.fx) * k) * TILE;
      p.py = (p.fy + (p.ty - p.fy) * k) * TILE;
      if (k >= 1) {
        p.moving = false;
        p.px = p.tx * TILE; p.py = p.ty * TILE;
        this.trail.push({ x: p.tx, y: p.ty });
        if (this.trail.length > 24) this.trail.shift();
        this.spawnPuff(p.tx, p.ty);
        this.onStep(p.tx, p.ty);
      }
    }
    // Partner follows 1 tile behind with hop. W3 (AN-2): the follower's
    // facing is its TRAVEL direction — derived from the vector toward
    // its trail target whenever it is actually moving.
    const tp = this.trail.length >= 2 ? this.trail[this.trail.length - 2] : { x: p.tx, y: p.ty };
    const tpx = tp.x * TILE, tpy = tp.y * TILE;
    const pdx = tpx - this.partner.px, pdy = tpy - this.partner.py;
    const oldPx = this.partner.px, oldPy = this.partner.py;
    this.partner.px += pdx * Math.min(1, dt * 10);
    this.partner.py += pdy * Math.min(1, dt * 10);
    // Facing follows the follower's ACTUAL velocity this tick (the
    // dominant axis of its own displacement), so a turn registers the
    // moment the follower itself turns — no target-vector lag.
    const mvx = this.partner.px - oldPx, mvy = this.partner.py - oldPy;
    if (Math.abs(mvx) + Math.abs(mvy) > 0.3) {
      this.partnerDir = Math.abs(mvx) >= Math.abs(mvy)
        ? (mvx > 0 ? 'right' : 'left') : (mvy > 0 ? 'down' : 'up');
      this.partnerMoving = true;
    } else this.partnerMoving = false;
    this.partner.hop += dt * 6;

    // Playtime + banner
    g.state.story.playtimeSec = (g.state.story.playtimeSec || 0);
    this.playAcc = (this.playAcc || 0) + dt;
    if (this.playAcc >= 1) { this.playAcc -= 1; g.state.player.playtimeSec++; }
    if (this.banner.t > 0) this.banner.t -= dt;
    // P1/C6: movement tutorial dismisses on first step or after 30s.
    if (this.moveTut) {
      this.moveTut.t += dt;
      if (this.moveTut.t > 30 || this.trail.length > 0) {
        this.moveTut = null;
        g.state.story.flags.moveTutDone = true;
      }
    }
  }

  // Premium+ W3 (AN-3): terrain footstep puffs — engine-emitted on each
  // completed step, 4 terrain classes (grass / dust / splash / cave),
  // 3 procedural frames over 300ms (rects only, no shadowBlur/gradient,
  // allocated on step events only — never per frame). Reduced Motion
  // suppresses them entirely.
  spawnPuff(x, y) {
    const g = this.game;
    if (g.state.settings.reducedMotion) return;
    if (this.surfing) return; // the wake tile carries surf steps instead
    const kind = g.tileKind(this.tileAt(x, y));
    const cls = (kind === 'grass' || kind === 'grassground') ? 'grass'
      : (kind === 'water') ? 'splash'
      : (kind === 'cavefloor' || kind === 'towerfloor') ? 'cave' : 'dust';
    this.puffs.push({ x: x * TILE, y: y * TILE, cls, t: 0 });
  }

  onStep(x, y) {
    const g = this.game;
    const wp = this.warpAt(x, y);
    if (wp) {
      let to = wp.to;
      // Wave 5b: viaExit resolves per shared interior — the Mart's
      // exit ticket is its own (martReturn), the Center's is unchanged.
      if (wp.viaExit) to = this.mapId === 'mart'
        ? (this.martReturn || { map: 'viridian', x: 3, y: 9 })
        : this.centerExit();
      if (to.map === 'center' && wp.via) {
        this.centerReturn = wp.via;
        // P1: persist the anchor — a save/reload inside the Center
        // must still exit to THIS town's door-front.
        g.state.story.lastCenter = { map: wp.via.map, x: wp.via.x, y: wp.via.y };
      }
      if (to.map === 'mart' && wp.via) this.martReturn = wp.via;
      this.loadMap(to.map);
      this.player.tx = to.x; this.player.ty = to.y;
      this.player.px = to.x * TILE; this.player.py = to.y * TILE;
      this.player.fx = to.x; this.player.fy = to.y;
      this.trail = [];
      this.partner.px = this.player.px; this.partner.py = this.player.py;
      g.state.story.position = { map: to.map, x: to.x, y: to.y, dir: this.player.dir };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.state.meta.location = this.map.name;
      g.audio.playMusic(this.map.music || 'route1-theme'); // no-op when the track is already playing
      g.audio.playSfx('map-enter'); // visual twin: the location banner slide-in
      g.autosave('area');
      return;
    }
    // Systems layer: events, safari steps, poison, water/cave encounters.
    if (this.sysOnStep && this.sysOnStep(x, y)) return;
    // Tall grass encounter check (anti-frustration: force after 20 silent steps)
    // UI v2.2 defect 4 guard: no living ally -> no encounter, ever (a battle
    // with no active mon soft-locks; the intro grant makes this unreachable
    // in a converged state, this keeps legacy/edge states safe).
    const t = this.tileAt(x, y);
    if (t === ',' && this.map.encounters && !g.state.story.flags.noEncounters
      && g.state.party.some((m) => m && m.hp > 0)) {
      // GD balance: the FIRST grass step on Route 1 is a scripted tutorial
      // encounter (Lv 3 Rattata), not a random roll — the <3min first-catch
      // gate is a certainty that teaches, never a gamble.
      if (this.mapId === 'route1' && !g.state.story.flags.tutorialDone) {
        this.startTutorialEncounter();
        return;
      }
      this.stepsSinceEncounter++;
      let p = this.map.encounters.rate;
      if (this.stepsSinceEncounter > 20) p = 1;
      if (this.chainCount >= 2) p = 0; // no triple chains
      if (roll(p, g.rng.encounter)) {
        this.startEncounter();
      } else {
        // GD balance (QA-003): the anti-chain counter measures CONSECUTIVE
        // random encounters — a quiet grass step breaks the chain, otherwise
        // encounters stay dead for the rest of the map visit.
        this.chainCount = 0;
      }
    } else {
      this.stepsSinceEncounter = 0;
    }
  }

  // ---- Yellow-style trainer vision (sight -> "!" -> walk-up -> battle) ----
  // An unbeaten trainer NPC with a `sight` cone spots the player standing in
  // its line, plays the alert, and walks over. Checked between steps only.
  // Duo NPCs (duoPartner) walk up together for a shared ambush.
  checkSightLines() {
    const p = this.player;
    if (p.moving) return false;
    const g = this.game;
    for (const n of this.map.npcs) {
      if (!n.trainer || !n.sight) continue;
      if (g.state.story.flags['beat_' + n.trainer]) continue;
      const dir = n.sight.dir || 'down';
      const range = n.sight.range || 3;
      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      for (let i = 1; i <= range; i++) {
        const tx = this.npcX(n) + dx * i, ty = this.npcY(n) + dy * i;
        if (tx === p.tx && ty === p.ty) { this.startChallenge(n); return true; }
        if (!this.walkable(tx, ty)) break; // sight blocked (wall, rock, another NPC)
      }
    }
    return false;
  }

  startChallenge(spotter) {
    const g = this.game;
    const parts = [{ npc: spotter, cx: this.npcX(spotter), cy: this.npcY(spotter) }];
    if (spotter.duoPartner) {
      const mate = this.map.npcs.find((n) => n.name === spotter.duoPartner);
      if (mate && !g.state.story.flags['beat_' + mate.trainer]) {
        parts.push({ npc: mate, cx: this.npcX(mate), cy: this.npcY(mate) });
      }
    }
    this.challenge = { parts, phase: 'spot', t: 0, stepT: 0 };
    g.audio.playSfx('trainer-spot'); // original two-note alert (visual twin: the ! mark)
    g.ui.log.push({ ui: 'trainer-spot', npcs: parts.map((q) => q.npc.name) });
  }

  updateChallenge(dt) {
    const g = this.game;
    const ch = this.challenge;
    ch.t += dt * 1000;
    const pl = this.player;
    if (ch.phase === 'spot') {
      if (ch.t >= 500) { ch.phase = 'walk'; ch.t = 0; ch.stepT = 0; }
      return;
    }
    // Walk phase: each challenger steps toward a tile adjacent to the player
    // (150ms/tile). The battle transition covers the snap-back to home tiles.
    const arrived = (q) => Math.abs(q.cx - pl.tx) + Math.abs(q.cy - pl.ty) <= 1;
    if (ch.parts.every(arrived) || ch.t > 3500) {
      const npc = ch.parts[0].npc;
      this.challenge = null;
      this.startTrainerBattle(npc);
      return;
    }
    ch.stepT += dt * 1000;
    if (ch.stepT >= 150) {
      ch.stepT = 0;
      for (const q of ch.parts) this.stepChallengerToward(q);
    }
  }

  stepChallengerToward(q) {
    const pl = this.player;
    if (Math.abs(q.cx - pl.tx) + Math.abs(q.cy - pl.ty) <= 1) return;
    const dx = pl.tx - q.cx, dy = pl.ty - q.cy;
    const opts = Math.abs(dx) >= Math.abs(dy)
      ? [[q.cx + Math.sign(dx), q.cy], [q.cx, q.cy + Math.sign(dy)]]
      : [[q.cx, q.cy + Math.sign(dy)], [q.cx + Math.sign(dx), q.cy]];
    for (const [nx, ny] of opts) {
      if (nx === pl.tx && ny === pl.ty) continue; // never step onto the player
      if (this.walkable(nx, ny)) {
        // Premium+ W4: the challenger FACEs its walk-up step (and draws
        // the walk pair in render) instead of gliding front-facing.
        if (q.npc) q.npc._face = nx !== q.cx ? (nx > q.cx ? 'right' : 'left') : (ny > q.cy ? 'down' : 'up');
        q.cx = nx; q.cy = ny; return;
      }
    }
  }

  startTutorialEncounter() {
    const g = this.game;
    g.state.story.flags.tutorialDone = true;
    this.stepsSinceEncounter = 0;
    this.chainCount = 0; // scripted tutorial isn't part of the random chain (QA-003)
    // Lv 3 Rattata: one Thunder Shock drops it to yellow (teaches weakening),
    // its Tackle does ~4 to a Lv 5 Pikachu (cannot threaten), and the battle
    // engine guarantees the catch once weakened + never lets it faint.
    this.enc = {
      phase: 'rustle', t: 0, tutorial: true,
      foe: makeMon('rattata', 3, SPECIES, MOVES),
    };
    g.audio.stopMusic();
    g.audio.encounter();
  }

  startEncounter() {
    const g = this.game;
    const table = this.map.encounters.table;
    const spId = pickWeighted(table.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = table.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    this.enc = {
      phase: 'rustle', t: 0,
      foe: makeMon(spId, level, SPECIES, MOVES),
    };
    this.stepsSinceEncounter = 0;
    this.chainCount++;
    g.audio.stopMusic();       // area music yields to the battle
    g.audio.encounter();       // rustle + "!" melody (visual twin: rustle anim, then the ! mark)
  }

  updateEncounter(dt) {
    const g = this.game;
    const e = this.enc;
    e.t += dt * 1000;
    // 3-beat: rustle 200ms -> ! 300ms -> transition 400ms (ADR-004, gameux §6)
    if (e.phase === 'rustle' && e.t >= 200) { e.phase = 'exclaim'; e.t = 0; }
    else if (e.phase === 'exclaim' && e.t >= 300) {
      e.phase = 'transition'; e.t = 0;
      // P0/E11: encounter flash gated like battle flashes; reduced motion -> fade.
      if (!g.state.settings.reducedMotion && g.state.settings.shake) g.renderer.flashA = 0.7;
      else if (g.state.settings.reducedMotion) { g.renderer.fadeA = 0.35; g.renderer.fadeColor = '#ffffff'; }
      g.audio.transition(); // whoosh on the wipe; soft blip under reduced motion
    }
    else if (e.phase === 'transition' && e.t >= 400) {
      g.renderer.flashA = 0;
      g.renderer.fadeA = 0;
      const foe = e.foe;
      this.enc = null;
      dexRegister(g.state.dex, 'seen', SPECIES[foe.speciesId].dexNo);
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, tutorial: !!e.tutorial, rt: g.state.settings.battleStyle !== 'classic' }));
    }
    if (g.renderer.flashA > 0 && e.phase !== 'transition') {
      g.renderer.flashA = Math.max(0, g.renderer.flashA - dt * 3);
    }
  }

  petPartner() {
    // P1/D7: mood-pip tap and the faced-tile interaction share one path.
    // Yellow homage: the partner emotes when talked to; petting cheers it up.
    const g = this.game;
    g.state.pikachu.mood = 'happy'; // a petting cheers it up (D7: mood reacts to beats)
    g.ui.toast('Pikachu ' + (PARTNER_MOODS[g.state.pikachu.mood] || PARTNER_MOODS.happy));
    g.audio.playSfx('partner-happy'); // visual twin: Pikachu hop + mood pip
    g.ui.updateMoodPip();
    return true;
  }

  tryInteract() {
    const g = this.game;
    const p = this.player;
    const dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0;
    const dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    const fx = p.tx + dx, fy = p.ty + dy;
    // Partner interaction (facing Pikachu's tile)
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    if (fx === ptx && fy === pty) return this.petPartner();
    // Systems interactions (item balls, hidden items, field moves, fishing)
    if (this.sysInteract && this.sysInteract(fx, fy)) return true;
    // Wave 5a: the Center counter (tile char '\u03b1') is furniture the
    // nurse stands BEHIND — talking over it is the canonical Center
    // interaction. If the faced tile is a counter and an NPC stands
    // directly beyond it, interact with that NPC. Counters with no one
    // beyond them stay inert scenery.
    const facedNpc = this.npcAt(fx, fy);
    const npc = facedNpc || ((this.tileAt(fx, fy) === '\u03b1') ? this.npcAt(fx + dx, fy + dy) : null);
    if (npc) {
      // Premium+ W4 (AN-4): the talked-to NPC turns to face the player —
      // sprite facing = interaction facing, from every approach side.
      const fdx = p.tx - this.npcX(npc), fdy = p.ty - this.npcY(npc);
      npc._face = Math.abs(fdx) >= Math.abs(fdy)
        ? (fdx > 0 ? 'right' : 'left') : (fdy > 0 ? 'down' : 'up');
      if (this.sysNpc && this.sysNpc(npc)) return true;
      if (npc.trainer) { this.startTrainerBattle(npc); return true; }
      const lines = npc.dialogue.map((l) => l.replace('{player}', g.state.player.name));
      // GD balance: data-driven one-time item gifts (ball economy top-ups).
      const after = () => {
        if (npc.give && !g.state.story.flags[npc.give.flag]) {
          g.state.story.flags[npc.give.flag] = true;
          for (const item of Object.keys(npc.give.items)) {
            g.state.bag[item] = (g.state.bag[item] || 0) + npc.give.items[item];
          }
          g.ui.toast('Received ' + npc.give.text + '!');
        }
      };
      if (npc.heal) {
        g.ui.say(lines, () => {
          this.healParty(false);
          g.ui.say(npc.afterHeal || ['All better!'], after, npc.name);
        }, npc.name);
      } else {
        g.ui.say(lines, after, npc.name);
      }
      return true;
    }
    const sign = this.signAt(fx, fy);
    if (sign) { g.ui.say([sign.text]); return true; }
    // Also check the tile the player stands on for signs (adjacent readability)
    return false;
  }

  startTrainerBattle(npc) {
    const g = this.game;
    if (g.state.story.flags['beat_' + npc.trainer]) {
      g.ui.say(npc.dialogue.slice(1), null, npc.name);
      return;
    }
    // ADR-025 §2: Gary's intro/lose TEXT varies by bond tier (a cloned
    // def — team/AI/stats are the authored def's own, R3); the battle's
    // first outcome feeds the rival/duo ledger as a bond SOURCE. The
    // recording lives here, in the layer that constructs the battle —
    // the battle code itself never reads a bond value.
    const t = bondTrainerVariant(g.state, TRAINERS[npc.trainer]);
    g.ui.say(t.intro, () => {
      g.scenes.push(new BattleScene({
        kind: 'trainer', trainer: t, returnTo: this, rt: g.state.settings.battleStyle !== 'classic',
        onEnd: (won, fled) => { recordBattleBond(g.state, t.id, won, fled); },
      }));
    }, npc.name);
  }

  healParty(announce) {
    const g = this.game;
    for (const m of g.state.party) {
      m.hp = m.maxHp; m.status = null;
      m.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      for (const mv of m.moves) mv.pp = mv.maxPp;
    }
    g.audio.playSfx('heal');
    if (announce) g.ui.toast('Your Pokemon were healed to full health!');
  }

  openPauseMenu() {
    const g = this.game;
    // P1/J2: player card header + Quit to title (confirm; autosaves first).
    const badges = g.state.badges.kanto.length;
    const mins = Math.floor((g.state.player.playtimeSec || 0) / 60);
    // Track B: account row — logged in shows the account menu; guest target
    // keeps the honest disabled row (Track A). Guests get NO row here: the
    // old 'Log in to sync ★' upsell was removed (login lives on the title
    // Terminal); a null row is filtered out of the menu list below.
    const authEnabled = (typeof AUTH_ENABLED !== 'undefined' && AUTH_ENABLED);
    const accountRow = !authEnabled
      ? { label: 'Account — coming in Track B', value: 'account', disabled: true }
      : g.authUser
        ? { label: 'Account', value: 'account' }
        : null;
    g.ui.showMenu('MENU', [
      { label: g.state.player.name + ' · ' + DIFFICULTY_LABELS[difficultyOf(g.state)] + ' · ' + badges + ' badges · ' + mins + 'm', value: null, disabled: true },
      { label: this.map.name, value: null, disabled: true },
      { label: 'Bag', value: 'bag' },
      { label: 'Party', value: 'party' },
      { label: 'Dex', value: 'dex' },
      { label: 'Journey', value: 'journey' },
      { label: 'Save', value: 'save' },
      { label: 'Options', value: 'options' },
      ...(accountRow ? [accountRow] : []),
      { label: 'Quit to title', value: 'quit' },
      { label: 'Close', value: 'close' },
    ], (value) => {
      if (value === 'bag') g.openBag();
      else if (value === 'party') g.openParty();
      else if (value === 'dex') g.openDex();
      else if (value === 'journey') g.openJourney();
      else if (value === 'save') g.openSave();
      else if (value === 'options') g.openOptions();
      else if (value === 'account' && authEnabled && g.authUser) AUTH.openAccountMenu(g);
      else if (value === 'quit') {
        g.ui.showMenu('Quit to title? (autosaves first)', [
          { label: 'Quit', value: 'yes' },
          { label: 'Keep playing', value: 'no' },
        ], (v) => {
          if (v === 'yes') {
            g.saveGame(true);
            g.scenes.replace(new BootScene());
          }
        });
      }
    });
  }

  areaCompletion() {
    const g = this.game;
    if (!this.map.encounters) return null;
    const species = [...new Set(this.map.encounters.table.map((e) => e.species))];
    const caught = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
    return { caught, total: species.length };
  }

  render(r) {
    const g = this.game;
    const T = TILE;
    // Camera centers on player
    r.centerOn(this.player.px + T / 2, this.player.py + T / 2, this.w * T, this.h * T);
    r.begin();
    // Tiles: hand-authored ART; Wave 1 composes each cell from variant +
    // transition layers resolved against its neighbours (art.mjs
    // resolveTileLayers) — presentation only, map data untouched.
    // void stays a solid fill.
    const vr = r.viewRect();
    const x0 = Math.max(0, Math.floor(vr.x0 / T)), x1 = Math.min(this.w - 1, Math.ceil(vr.x1 / T));
    const y0 = Math.max(0, Math.floor(vr.y0 / T)), y1 = Math.min(this.h - 1, Math.ceil(vr.y1 / T));
    const kindAt = (tx, ty) => (ty < 0 || ty >= this.map.rows.length || tx < 0 || tx >= this.map.rows[ty].length)
      ? null : g.tileKind(this.map.rows[ty][tx]);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.map.rows[y][x];
        const layers = g.tileLayers(g.tileKind(ch), x, y, kindAt);
        if (layers.length) { for (const spr of layers) r.blit(spr, x * T, y * T); }
        else g.ctx2dfill('#101018', x * T, y * T, T, T); // void
      }
    }
    // Encounter rustle effect
    if (this.enc && this.enc.phase === 'rustle') {
      const jx = (this.game.rng.misc() - 0.5) * 3;
      const gspr = g.tileSprite('grass');
      if (gspr) r.blit(gspr, this.player.tx * T + jx, this.player.ty * T);
    }
    // Premium+ W3: footstep puffs (3 expanding rect frames per class).
    if (this.puffs.length) {
      const c = r.ctx;
      const PUFF_COL = { grass: '111,180,92', dust: '203,178,122', splash: '191,232,240', cave: '154,143,168' };
      for (const pf of this.puffs) {
        const f = Math.min(2, Math.floor(pf.t / 100));
        const s = 4 + f * 4, a = (0.5 - f * 0.18).toFixed(2);
        c.fillStyle = 'rgba(' + PUFF_COL[pf.cls] + ',' + a + ')';
        c.fillRect(pf.x + 8 - s / 2, pf.y + 13, s, 2);
        c.fillRect(pf.x + 2, pf.y + 14 - f, 3, 2);
        c.fillRect(pf.x + 11, pf.y + 14 - f, 3, 2);
      }
    }
    // Premium+ W3: surf wake under the player while surfing (2f tile).
    if (this.surfing && g.tileCache && g.tileCache.wakeFrames && g.tileCache.wakeFrames.length) {
      const still = g.state.settings.reducedMotion;
      const wf = g.tileCache.wakeFrames[still ? 0 : Math.floor(g._animT / 400) % g.tileCache.wakeFrames.length];
      if (wf) r.blit(wf, Math.round(this.player.px), Math.round(this.player.py));
    }
    // Systems world dressing: item balls, boulders, cut stumps, cave darkness.
    if (this.sysRenderWorld) this.sysRenderWorld(r);
    // NPCs (2-frame idle) — challengers render at their walk-up position.
    // Wave 0 draw standard: bottom-anchored to the 1-tile footprint via
    // blitCharacter (taller 16x32 art overhangs upward). The legacy feet
    // line is preserved exactly: a 16x16 sprite's bottom sat at
    // tileY - 4 + 16 (the old hardcoded -4 offset), so existing art
    // renders pixel-identical.
    for (const n of this.map.npcs) {
      let nx = n.x * T, footY = n.y * T - 4 + T;
      const cq = this.challenge && this.challenge.parts.find((q) => q.npc === n);
      if (cq) { nx = cq.cx * T; footY = cq.cy * T - 4 + T; }
      else if (n._wander) {
        // Premium+ W4: wanderers draw at their current tile, gliding
        // between tiles over the step's 280ms in their walk pair.
        const w = n._wander;
        let rx = w.x, ry = w.y;
        if (w.glide > 0) {
          const k = 1 - w.glide / 280;
          rx = w.fx + (w.x - w.fx) * k;
          ry = w.fy + (w.y - w.fy) * k;
        }
        nx = rx * T; footY = ry * T - 4 + T;
      }
      const moving = !!cq || !!(n._wander && n._wander.glide > 0);
      r.blitCharacter(g.npcFrame(n, { dir: n._face || 'down', moving }), nx, footY);
    }
    // Yellow-style spot "!" over each challenger during the alert beat.
    if (this.challenge && this.challenge.phase === 'spot') {
      for (const q of this.challenge.parts) {
        r.text('!', q.cx * T + 4, q.cy * T - 16, { size: 14, bold: true, color: '#e84040' });
      }
    }
    // Partner (hop) + player (walk cycle / idle blink)
    // Wave 0 draw standard: bottom-anchored (blitCharacter) — for the
    // current 16x16 art the bottoms are py + T (partner: minus the hop
    // lift), so these draws are pixel-identical to the old unscaled
    // blits; 16x32 art will overhang upward from the same feet line.
    // Wave 3a follower visibility (PRESENTATION ONLY — the partner's
    // logical position, the trail and every interaction check keep
    // using this.partner.px/py untouched): the follower used to spawn
    // stacked exactly under the player (empty trail -> partner tile =
    // player tile) and, trailing in the same column, its body landed
    // on the tall Ash sprite's head. The DISPLAY position therefore
    // steps aside: a full tile west when stacked on the player's tile
    // (spawn / warp landing), and ~10px east whenever it shares the
    // player's column, so it is always visible BESIDE Ash, never
    // under or on him.
    const hop = Math.abs(Math.sin(this.partner.hop)) * 3;
    let fpx = Math.round(this.partner.px);
    const fpy = Math.round(this.partner.py);
    if (fpx === Math.round(this.player.px) && fpy === Math.round(this.player.py)) fpx -= T;
    else if (fpx === Math.round(this.player.px)) fpx += 10;
    r.blitCharacter(g.partnerFrame(!this.player.moving && !this.partnerMoving, {
      dir: this.partnerDir || this.player.dir,
      stillMs: this.player.moving ? 0 : (this.stillMs || 0),
    }), fpx, fpy + T - Math.round(hop), fpy + T);
    r.blitCharacter(g.playerSprite(this.player), Math.round(this.player.px), Math.round(this.player.py) + T);
    // "!" exclamation
    if (this.enc && this.enc.phase === 'exclaim') {
      r.text('!', this.player.px + 4, this.player.py - 14, { size: 14, bold: true, color: '#e84040' });
    }
    // P1/C6: movement tutorial — the coach line moved to a one-shot DOM toast
    // (syncHud). On the map only a subtle spawn ring remains: it fades out
    // over the first 1.2s after spawn and never pulses again (the old endless
    // pulse read as a target reticle). The partner '▼' fades with it.
    if (this.moveTut) {
      const fade = Math.max(0, 1 - this.moveTut.t / 1.2);
      if (fade > 0) {
        const gold = 'rgba(255,233,168,' + fade.toFixed(3) + ')';
        const c = r.ctx;
        c.strokeStyle = gold; c.lineWidth = 2;
        c.beginPath(); c.arc(this.player.px + 8, this.player.py + 8, 12, 0, Math.PI * 2); c.stroke();
        r.text('▼', Math.round(this.partner.px) + 4, Math.round(this.partner.py) - 28, { size: 14, bold: true, color: gold, shadow: false });
      }
    }
    // P1/D5: contextual interaction prompt bubble.
    const prompt = this.interactPrompt();
    if (prompt) {
      const bx = Math.round(this.player.px) - 24, by = Math.round(this.player.py) - 30;
      r.panel(bx, by, 76, 20, '#f8f8f0', '#202028');
      // Centered in the bubble: with align:'center', x is the center point.
      // UI v2.4.1: the prompt is prose the player reads — bold body face
      // at 16 (was 400/14, same thin-stem defect class as the dialogue).
      r.text(prompt, bx + 38, by + 2, { size: 16, bold: true, color: '#202028', shadow: false, align: 'center' });
    }
    // P1/D8: clock glyph — day/night pixel icon + season bar (no text, ambient).
    this.renderClockGlyph(r);
    r.end();
    // HUD lives in DOM chips now (UI seat): the area banner, the permanent
    // objective line, the area-completion line and the Dex counter are no
    // longer draped over the map as canvas text. Values are pushed on change.
    this.syncHud();
  }

  // Push location / objective / dex values to the UI seat's DOM chips, only
  // when a value actually changed. Every call is guarded so builds (and
  // headless suites) without the new UI methods never crash. The strings are
  // byte-identical to the old canvas draws — only the presentation moved.
  // The area banner and the movement tutorial become one-shot toasts.
  syncHud() {
    const g = this.game;
    const ui = g && g.ui;
    if (!ui) return;
    if (ui.setLocationChip) {
      const loc = this.map.name;
      if (loc !== this._hudLoc) { this._hudLoc = loc; ui.setLocationChip(loc); }
    }
    if (ui.setObjectiveChip) {
      const obj = this.objectiveText();
      if (obj !== this._hudObj) { this._hudObj = obj; ui.setObjectiveChip(obj); }
    }
    if (ui.setDexChip) {
      const dex = 'Dex ' + dexCaughtCount(g.state.dex) + '/' + DEX_TOTAL;
      if (dex !== this._hudDex) { this._hudDex = dex; ui.setDexChip(dex); }
    }
    if (ui.hudToast) {
      // Banner trigger: the banner object is REPLACED on every trigger —
      // in onStep's warp path and in overworld-systems (surf/fly/safari) —
      // so a fresh object with t > 0 is exactly one toast, never per frame.
      if (this.banner && this.banner.t > 0 && this.banner !== this._hudBannerObj) {
        this._hudBannerObj = this.banner;
        ui.hudToast(this.banner.text, 2600);
      }
      // Movement tutorial toast: once, when the tutorial starts.
      if (this.moveTut && !this.moveTut._toastSent) {
        this.moveTut._toastSent = true;
        ui.hudToast('Walk with the D-pad — Pikachu follows you!', 3600);
      }
    }
  }

  // P1/D5: what would A do on the faced tile? (bubble text, or null)
  interactPrompt() {
    const p = this.player;
    const dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0;
    const dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    const fx = p.tx + dx, fy = p.ty + dy;
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    if (fx === ptx && fy === pty) return 'A: Pet';
    const facedNpc = this.npcAt(fx, fy)
      || ((this.tileAt(fx, fy) === '\u03b1') ? this.npcAt(fx + dx, fy + dy) : null);
    if (facedNpc) return facedNpc.pc ? 'A: PC' : 'A: Talk'; // UI v2.3: the storage terminal names itself
    if (this.signAt(fx, fy)) return 'A: Read';
    return null;
  }

  // P1/D6: current story objective — quest-driven (WS6), slice spine as fallback.
  objectiveText() {
    if (this.sysObjective) { const t = this.sysObjective(); if (t) return t; }
    const f = this.game.state.story.flags;
    if (!f.beat_brock) return '▶ Earn the Boulder Badge';
    return '▶ Explore Kanto';
  }

  // P1/D8: day/night pixel icon + season color bar, top-right of canvas.
  renderClockGlyph(r) {
    const g = this.game;
    let hour = 12;
    try { hour = new Date().getHours(); } catch (e) { /* headless */ }
    const day = hour >= 6 && hour < 18;
    const x = r.viewW - 20, y = 22;
    const c = r.ctx;
    if (day) {
      c.fillStyle = '#f8d030';
      c.fillRect(x + 3, y, 6, 12); c.fillRect(x, y + 3, 12, 6);
      c.fillStyle = '#fff2b0';
      c.fillRect(x + 4, y + 4, 4, 4);
    } else {
      c.fillStyle = '#bfe8f0';
      c.fillRect(x + 3, y + 1, 6, 10); c.fillRect(x + 5, y, 8, 12);
      c.fillStyle = '#101018';
      c.fillRect(x + 6, y + 2, 5, 8);
    }
    // season bar: spr green / sum gold / aut orange / win blue
    let m = 0;
    try { m = new Date().getMonth(); } catch (e) { /* headless */ }
    const seasonCol = m < 2 || m === 11 ? '#5a9ae8' : m < 5 ? '#58c94f' : m < 8 ? '#e8c832' : '#e08a4a';
    c.fillStyle = seasonCol;
    c.fillRect(x, y + 14, 12, 3);
  }
}
