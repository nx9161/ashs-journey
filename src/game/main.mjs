// main.mjs — Game root: owns loop, renderer, input, audio, UI, scenes, save.
// Scene flow: BOOT (legal card) -> TITLE -> INTRO -> OVERWORLD <-> BATTLE.
// Battle/overworld menus (Bag/Party/Dex/Save/Options) live here as UI states.
import { Loop } from '../engine/loop.mjs';
import { Renderer, TILE } from '../engine/render.mjs';
import { Input, KEYMAP, ACTIONS } from '../engine/input.mjs';
import { AudioEngine } from '../engine/audio.mjs';
import { makeRngStreams } from '../engine/rng.mjs';
import { TILE_CHARS } from '../engine/tiles.mjs';
import { speciesBattleArt, ashFrames, ashModeFrames, npcFrames, npcFramesFor, partnerHopFrames, partnerIdleFrames, partnerSleepFrames, partnerLookFrames, buildArtTileCache, tileSprite, resolveTileLayers, boulderCanvasFor, uiIcon, doorOpenCanvas, foregroundFor } from '../engine/art.mjs';
import { SceneStack } from './scenes.mjs';
import { UI, typePill } from './ui.mjs';
import { BootScene, DISCLAIMER_CREDITS } from './title.mjs';
import { IntroScene } from './intro.mjs';
import { OverworldScene } from './overworld.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS, POCKETS, BALLS, KEEPSAKES } from '../data/items.mjs';
import { giveKeepsake, takeKeepsake } from './keepsakes.mjs';
import { seasonalSwapFor, seasonalSwapForKit } from './seasons.mjs';
import { MAPS } from '../data/maps.mjs';
import { CHAPTERS, BONUS_SHELF, chapterOf } from '../data/story.mjs';
import { ARCS, arcStateOf, currentArcOf, arcDexSpan, PLATINUM_DEX_HORIZON } from '../data/arcs.mjs';
import { displayName, dexCaughtCount, defaultState } from './state.mjs';
import {
  DIFFICULTY_MODES, DIFFICULTY_LABELS, DIFFICULTY_RANK, HOUSE_RULE_DEFS,
  difficultyOf, activeHouseRules,
} from './rules.mjs';
import { SaveStore, freshState } from '../save/store.mjs';
import { SFX } from '../engine/audio.mjs';

function nextSeed() {
  if (typeof globalThis !== 'undefined' && globalThis.__SEED__) return globalThis.__SEED__ >>> 0;
  return (Date.now() ^ (Math.random() * 1e9)) >>> 0;
}

const doc = (typeof document !== 'undefined') ? document : {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        width: 0, height: 0, style: {},
        getContext: () => new Proxy({}, {
          get: (t, p) => {
            if (p === 'canvas') return {};
            if (p === 'measureText') return () => ({ width: 10 });
            if (p === 'getImageData') return () => ({ data: [] });
            return () => {};
          },
          set: () => true,
        }),
      };
    }
    return { style: {}, appendChild() {}, addEventListener() {} };
  },
  getElementById: () => null,
  addEventListener() {},
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas || doc.createElement('canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new Input();
    this.audio = new AudioEngine();
    this.ui = new UI(this);
    this.scenes = new SceneStack(this);
    this.loop = new Loop(this);
    this.store = new SaveStore();
    this.state = freshState();
    this.rng = makeRngStreams(nextSeed());
    this.tileCache = buildArtTileCache(doc, seasonalSwapFor, seasonalSwapForKit); // hand-authored tileset (art.mjs), season-graded vegetation; void -> solid fill
    this.spriteCache = {};
    this._spriteUrlCache = {}; // species id -> battle-art data URL (toDataURL once per species)
    this._iconUrlCache = {};   // item id -> uiIcon data URL (toDataURL once per item)
    this.npcCache = {};
    this.skipIntroVeteran = false;
    this._lastAutosave = 0;
    this.layoutMode = 'portrait';
    this._animT = 0;      // ms clock for sprite-frame animation (idle blink, NPCs, water)
    this.guestMode = false; // set by the Trainer ID Terminal guest path
    this.authUser = null;   // Track B: logged-in username (null = guest / logged out)
  }

  tileKind(ch) { return TILE_CHARS[ch] || 'void'; }

  tileSprite(kind) { return tileSprite(this.tileCache, kind, this._animT); }

  // Wave 1 terrain system: the composed layer stack for one map cell
  // (variants + neighbour-aware transitions). kindAt(x, y) -> kind | null.
  // Premium+ W3: Reduced Motion stills ALL world animation — the clock
  // handed to the resolver becomes the -1 freeze sentinel (every
  // animated family resolves to frame 0, water included).
  tileLayers(kind, x, y, kindAt, phase, mapId) {
    const still = this.state && this.state.settings && this.state.settings.reducedMotion;
    // Premium+ W5 (LD-2): phase threads through to the resolver for the
    // night window/lamp swaps; callers that pass no phase get day (the
    // reference) — caves/interiors are pinned to day by the scene.
    return resolveTileLayers(this.tileCache, kind, x, y, kindAt, still ? -1 : this._animT, phase || 'day', mapId || null);
  }

  // Wave 4: the Strength-boulder overlay sprite for a position (agrees
  // with the tile resolver's variant at that position; cave context
  // selects the cave boulder set).
  boulderSprite(x, y, cave) { return boulderCanvasFor(this.tileCache, x, y, !!cave); }

  // Premium+ W7 (TX-6/PL-1): the authored door-open frame for a door
  // kind (W6 registry), used by the warp-fade engine's door beat.
  doorOpenSprite(kind) { return doorOpenCanvas(doc, kind); }

  // Premium+ W7 (TX-7): the foreground rule (canopy overhangs + roof
  // eaves), shared verbatim with the W7 census.
  foregroundFor(kind, x, y, kindAt, mapId) { return foregroundFor(this.tileCache, kind, x, y, kindAt, mapId); }

  buildSprites() {
    // Wave 3: real ART data replaces the forge placeholders (README wiring handoff).
    for (const id of Object.keys(SPECIES)) {
      this.spriteCache[id] = speciesBattleArt(doc, id, SPECIES[id]);
    }
    this.playerSprites = {
      down: ashFrames(doc, 'down'),
      up: ashFrames(doc, 'up'),
      left: ashFrames(doc, 'left'),
      right: ashFrames(doc, 'right'),
    };
    // Premium+ W3 (AN-3): mode-specific sets (run/bike/surf/fish).
    this.modeSprites = {};
    for (const mode of ['run', 'bike', 'surf', 'fish']) {
      this.modeSprites[mode] = {
        down: ashModeFrames(doc, 'down', mode), up: ashModeFrames(doc, 'up', mode),
        left: ashModeFrames(doc, 'left', mode), right: ashModeFrames(doc, 'right', mode),
      };
    }
    // Premium+ W3 (AN-2): directional follower sets + behaviour pairs.
    this._partnerHop = {}; this._partnerIdle = {};
    for (const dir of ['down', 'up', 'left', 'right']) {
      this._partnerHop[dir] = partnerHopFrames(doc, dir);
      this._partnerIdle[dir] = partnerIdleFrames(doc, dir);
    }
    this._partnerSleep = partnerSleepFrames(doc);
    this._partnerLook = partnerLookFrames(doc);
    this.npcCache = {};
  }

  // Battle-art data URL for a species (party/bag menu <img class="picon">).
  // Cached per species id on the game object so toDataURL runs once.
  // Headless stub canvases have no toDataURL — returns '' there (guarded).
  spriteDataUrl(speciesId) {
    if (!this._spriteUrlCache) this._spriteUrlCache = {};
    if (speciesId in this._spriteUrlCache) return this._spriteUrlCache[speciesId];
    let url = '';
    try {
      const entry = this.spriteCache && this.spriteCache[speciesId];
      const cv = entry && (entry.front || entry);
      if (cv && typeof cv.toDataURL === 'function') url = cv.toDataURL();
    } catch (e) { url = ''; }
    this._spriteUrlCache[speciesId] = url;
    return url;
  }

  // Icon name for a bag item, or null when no authored icon art exists:
  // balls -> pokeball, potion-class medicine -> potion, badges -> badge.
  itemIconName(itemId) {
    const it = ITEMS[itemId];
    // ADR-025 §3 (Phase 3): keepsakes carry their own authored 16x16
    // icons (assets/sprites/pix/ui/icon-keepsake-<id>.pix).
    if (it && it.pocket === 'keepsakes') return 'keepsake-' + itemId;
    if (itemId === 'potion' || itemId === 'superpotion' || itemId === 'hyperpotion' ||
        itemId === 'maxpotion' || itemId === 'fullrestore') return 'potion';
    if ((it && it.pocket === 'balls') || itemId === 'pokeball') return 'pokeball';
    if (itemId && String(itemId).endsWith('badge')) return 'badge';
    return null;
  }

  // Item-icon data URL for bag rows (uiIcon canvases from art.mjs).
  // Cached per item id on the game object so toDataURL runs once.
  itemIconDataUrl(itemId) {
    if (!this._iconUrlCache) this._iconUrlCache = {};
    if (itemId in this._iconUrlCache) return this._iconUrlCache[itemId];
    let url = '';
    try {
      const iconName = this.itemIconName(itemId);
      if (iconName) {
        const cv = uiIcon(doc, iconName);
        if (cv && typeof cv.toDataURL === 'function') url = cv.toDataURL();
      }
    } catch (e) { url = ''; }
    this._iconUrlCache[itemId] = url;
    return url;
  }

  // Overworld Ash (Premium+ W3, AN-3): mode-specific art for 100% of
  // traversal modes — surf / bike / fishing render their own sets, run
  // (hold B on foot) its own 6-frame cycle; the walk cycle is 6 frames
  // and the idle 4 (breath + hair/strap secondary motion). The scene
  // stamps p.mode / p.cycleK (tile-step progress 0..1) / p.fishPhase.
  playerSprite(p) {
    const still = this.state && this.state.settings && this.state.settings.reducedMotion;
    const mode = p.mode || 'walk';
    if (mode === 'surf' || mode === 'bike' || mode === 'run' || mode === 'fish') {
      const set = this.modeSprites[mode] && (this.modeSprites[mode][p.dir] || this.modeSprites[mode].down);
      if (set && set.length && set[0]) {
        if (mode === 'fish') return set[p.fishPhase === 'hold' ? 1 : 0] || set[0];
        if (mode === 'surf') return set[still ? 0 : Math.floor(this._animT / 400) % set.length] || set[0];
        const steps = set.length;
        const fi = Math.min(steps - 1, Math.floor((p.cycleK || 0) * steps)) % steps;
        return set[fi] || set[0];
      }
    }
    const frames = this.playerSprites[p.dir] || this.playerSprites.down;
    if (p.moving) {
      const fi = 4 + (Math.min(5, Math.floor((p.cycleK != null ? p.cycleK : (p.moveT / 200)) * 6)) % 6);
      return frames[fi] || frames[4];
    }
    return frames[still ? 0 : Math.floor(this._animT / 500) % 4]; // idle 4f breath cycle
  }

  npcFrame(npc, opts) {
    // Wave 0: the cache key carries the art kind + the instance palette,
    // not the name alone — two NPCs sharing a name (or one name in two
    // towns) can carry different palettes/art and must not share frames
    // now that the palette-swap rasterizer honors the instance data.
    // Premium+ W4 (AN-4): the key also carries facing + locomotion —
    // the sprite now FACEs its interaction/sight/wander direction
    // (directional idles, walk pairs for roaming kinds, the named
    // cast's 4-frame front gesture cycle) — and the idle clock is
    // shifted by the NPC's per-instance phase offset (_phaseMs,
    // stamped by the scene at loadMap: pairwise-distinct mod 600ms
    // across the map roster, so no two NPCs on a screen ever flip
    // idle frames at the same instant; hash fallback for unstamped
    // instances). Reduced Motion holds frame 0 of every NPC cycle
    // (the W3 gate, extended to the new sets).
    const dir = (opts && opts.dir) || (npc && npc._face) || 'down';
    const moving = !!(opts && opts.moving);
    const cacheKey = [npc.art || '', npc.pc ? 'pc' : '', npc.name || '',
      npc.skin || '', npc.shirt || '', npc.pants || '', npc.hair || '',
      dir, moving ? 'w' : 'i'].join('|');
    if (!this.npcCache[cacheKey]) this.npcCache[cacheKey] = npcFramesFor(doc, npc, dir, moving);
    const f = this.npcCache[cacheKey];
    // Premium+ W3 (AN-6): the PC terminal cycles its screen at the fast
    // cadence (200ms x 4 frames); people keep the 600ms idle pair.
    if (npc.pc && f.length > 2) {
      const still = this.state && this.state.settings && this.state.settings.reducedMotion;
      return f[still ? 0 : Math.floor(this._animT / 200) % f.length];
    }
    const still = this.state && this.state.settings && this.state.settings.reducedMotion;
    if (still) return f[0];
    if (moving) return f[Math.floor(this._animT / 200) % f.length]; // walk pair at step cadence
    let off = (npc && npc._phaseMs) || 0;
    if (!off && npc && !npc.pc) { // unstamped instance: stable hash phase
      let h = 0; const s = (npc.name || '') + '|' + (npc.art || '') + '|' + npc.x + ',' + npc.y;
      for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619); }
      off = (h >>> 0) % 600;
    }
    return f[Math.floor((this._animT + off) / 600) % f.length];
  }

  partnerFrame(idle, opts) {
    // Premium+ W3 (AN-2): the follower is directional — its facing is
    // the travel direction (opts.dir, tracked by the scene from the
    // trail vector). At rest it plays the directional idle pair; after
    // 6s still it looks around (emote pair); after 20s still it sleeps.
    // Reduced Motion freezes every follower cycle on frame 0 (and the
    // sleep/look behaviours never engage — the base idle holds).
    const still = this.state && this.state.settings && this.state.settings.reducedMotion;
    const dir = (opts && opts.dir) || 'down';
    const stillMs = (opts && opts.stillMs) || 0;
    const t = still ? 0 : this._animT;
    if (idle) {
      if (!still && stillMs >= 20000 && this._partnerSleep) {
        return this._partnerSleep[Math.floor(t / 800) % 2]; // sleep idle (breath pair)
      }
      if (!still && stillMs >= 6000 && this._partnerLook && dir === 'down') {
        return this._partnerLook[Math.floor(t / 2000) % 2]; // look-around emote pair
      }
      const set = this._partnerIdle[dir] || this._partnerIdle.down;
      if (set) return set[Math.floor(t / 500) % 2];
    }
    const hop = this._partnerHop[dir] || this._partnerHop.down;
    if (!hop) return this.spriteCache.partner.front;
    return hop[Math.floor(t / 280) % 2]; // hop-1 / hop-2 (280ms, unchanged cadence)
  }

  // Canvas 2D helpers used by scenes.
  ctx2dfill(color, x, y, w, h) {
    const c = this.renderer.ctx;
    c.fillStyle = color; c.fillRect(x, y, w, h);
  }
  ctx2drect(x, y, w, h, color) { this.ctx2dfill(color, x, y, w, h); }
  ctx2dcircle(x, y, rad, color) {
    const c = this.renderer.ctx;
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
  }

  boot() {
    this.ui.init();
    // UI v2.1 (defect 1): kick off the Platinum faces NOW so the first
    // dialogue/menu paints in Galmuri, not in the fallback stack. The faces
    // are same-document data URIs (self-hosted in assets/fonts/, embedded by
    // scripts/build.mjs) and the production CSP allows them via
    // `font-src 'self' data:` — if either ever regresses, the deployed-
    // flavor QA gate (ashs-journey-qa/shoot4.mjs) fails loudly on
    // document.fonts.check instead of silently shipping a fallback again.
    try {
      if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
        document.fonts.load('16px "PtGalmuri"', 'ASH');
        document.fonts.load('700 16px "PtGalmuri"', 'ASH');
        document.fonts.load('16px "PtPixel"', 'ASH');
        document.fonts.load('700 16px "PtPixel"', 'ASH');
      }
    } catch (e) { /* headless / stub DOM */ }
    // Track B: auth health probe (503 banner) + sync dot. Guest target: no-ops.
    AUTH.init(this);
    SYNC.init(this);
    this.input.bindKeyboard();
    this.buildSprites();
    this.applyLayout();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => this.applyLayout());
    }
    // P1/A6: tap the canvas to advance (title + tap-to-advance dialogue).
    if (this.canvas && this.canvas.addEventListener) {
      this.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.unlock();
        // AUDIT FIX (S-01): scenes with real tap targets (the title menu)
        // get first claim on the tap, in logical view coordinates.
        const top = this.scenes && this.scenes.top;
        if (top && top.handleTap && this.canvas.getBoundingClientRect) {
          const rect = this.canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const vx = (e.clientX - rect.left) / rect.width * this.renderer.viewW;
            const vy = (e.clientY - rect.top) / rect.height * this.renderer.viewH;
            if (top.handleTap(vx, vy)) return;
          }
        }
        this.input.inject('a');
      });
    }
    // P1/I4: honor prefers-reduced-motion on first boot.
    try {
      if (typeof window !== 'undefined' && window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
          !this.store.exists()) {
        this.state.settings.reducedMotion = true;
      }
    } catch (e) { /* headless / no matchMedia */ }
    this.loop.onAutosave = () => {
      // P1/H2: visibilitychange autosaves — never mid-battle-turn.
      const top = this.scenes.top;
      const midResolve = !!(top && top.state === 'resolve' && top.foe);
      if (!midResolve) this.saveGame(true);
      SYNC.onHidden(this); // Track B: best-effort cloud flush on tab hide
    };
    this.loop.bindVisibility(() => { /* sim halts via rAF freeze; autosave queued above */ });
    this.audio.applySettings(this.state.settings);
    this.applyKeymap();
    // Gameplay Designer co-design note (C7): the tutorial catch gate must be
    // robust to a Spearow-class foe — the script is deterministic (balance-seat
    // gate), never luck. Recorded here so the gate lives with the flow.
    this.scenes.push(new BootScene());
    this.loop.start();
  }

  applyLayout() {
    const r = this.renderer;
    if (typeof window === 'undefined') {
      r.resize(256, 192, 256, 192);
      this.layoutMode = 'desktop';
      return;
    }
    const w = window.innerWidth, h = window.innerHeight;
    const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    // D3: desktop = fine pointer at >=700px, OR a laptop-class width regardless of
    // what the browser reports (some browsers/headless never match
    // '(pointer: fine)' — without the width fallback they fell into the phone
    // landscape path and rendered stretched with touch controls on a laptop).
    // Coarse-pointer wide tablets still land here and get controls back via the
    // (pointer:coarse) CSS override.
    if (w >= 700 && (fine || w >= 1024)) {
      this.layoutMode = 'desktop';
      // D3: aspect-locked 16:9 canvas. The old h*0.62 cap stretched the buffer
      // on 1280x800-class viewports (1120x496 CSS over a 384x216 backing store).
      // Height now reserves room for the hint card instead of a fixed fraction.
      const cssW0 = Math.min(1120, w * 0.9);
      let cw = cssW0, ch = cssW0 * 9 / 16;
      const maxH = Math.min(630, Math.max(240, h - 140));
      if (ch > maxH) { ch = maxH; cw = ch * 16 / 9; }
      r.resize(384, 216, Math.round(cw), Math.round(ch));
      document.body.classList.add('desktop');
    } else if (w > h) {
      this.layoutMode = 'landscape';
      // D3: aspect-locked 4:3 (was w*0.72 x h — stretched on every landscape phone).
      const lw = Math.min(w * 0.72, h * 4 / 3);
      r.resize(256, 192, Math.round(lw), Math.round(lw * 3 / 4));
      document.body.classList.remove('desktop');
    } else {
      this.layoutMode = 'portrait';
      // Portrait: canvas takes 58% of the height (was 45% — left a dead
      // void below and shrank the game's subject). Logical stays 256x256.
      r.resize(256, 256, w, h * 0.58);
      document.body.classList.remove('desktop');
    }
    // P1/K2: landscape gets the right-edge command rail (CSS re-rails the HUD strip).
    document.body.classList.toggle('landscape', this.layoutMode === 'landscape');
    document.body.classList.toggle('flip', !!this.state.settings.controlsFlip);
    // Elevation C1: the reduced-motion body gate for the menu transition.
    document.body.classList.toggle('reduced-motion', !!this.state.settings.reducedMotion);
    // P1/K3 + I2: desktop hint card; show-touch toggle honored on hybrids.
    document.body.classList.toggle('showtouch', !!this.state.settings.showTouch);
    // Headless harness stubs document without documentElement — guard it.
    if (document.documentElement) document.documentElement.style.setProperty('--hudscale', this.state.settings.hudScale || 1);
    this.ui.showHintCard(this.layoutMode === 'desktop');
    // UI v2.1: the frame layer tracks the canvas box on every layout pass
    // (boot, resize, orientation, fullscreen) — not just the UI tick throttle.
    if (this.ui._syncChipAnchor) this.ui._syncChipAnchor();
  }

  update(dt) {
    this._animT += dt * 1000;
    // Global M-key mute toggle (options spec §4.8: "Mute (M key too)"). Persists.
    if (this.input.wasPressed('mute')) this.toggleMute();
    // P1/I3: F = fullscreen toggle on #stage (KEYMAP defines it; now consumed).
    if (this.input.wasPressed('fullscreen') && typeof document !== 'undefined') {
      const stage = document.getElementById('stage');
      if (stage) {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (stage.requestFullscreen) stage.requestFullscreen();
      }
    }
    this.ui.update(dt);
    SYNC.tick(this); // Track B: idle flush (60s) + deferred conflict sheet. Guest: no-op.
    this.scenes.update(dt);
    if (this.processQueues) this.processQueues(); // WS6/WS9: learn + evolution prompts
    if (this.checkDiploma) this.checkDiploma(); // WS7: the 151 payoff
    if (this.checkPlatinumDiploma) this.checkPlatinumDiploma(); // ADR-027 D5: the 493 payoff
  }

  toggleMute() {
    const s = this.state.settings;
    s.mute = !s.mute;
    this.audio.setMuted(s.mute);
    this.ui.toast(s.mute ? 'Muted.' : 'Sound on.');
    this.saveGame(true);
  }

  render(alpha) {
    this.scenes.render(this.renderer, alpha);
  }

  // ---- game flow ----
  // P0/B1: title menu routes through the Trainer ID Terminal.
  // Track B (vercel): full LOG IN / REGISTER / GUEST panel (auth.mjs).
  // Guest target: the stub keeps Track-A behavior (guest only, zero network).
  openLogin(mode) {
    this._loginMode = mode;
    this.ui.showLogin((choice, data) => {
      if (choice === 'login') {
        this.guestMode = false;
        this.authUser = (data && data.username) || null;
        AUTH.user = this.authUser;
        this.ui.hideGuestBanner();
        this.onLoggedIn(mode);
        return;
      }
      // 'guest' — also the only path in the guest target and the headless harness
      this.guestMode = true;
      this.authUser = null;
      AUTH.user = null;
      if (this._loginMode === 'continue') this.continueGame();
      else if (this._loginMode === 'second') this.secondJourney();
      else this.newGame();
    });
  }

  // Track B: post-login — pull cloud meta, merge (claim/conflict/newest-wins),
  // then load the resolved save or start fresh.
  onLoggedIn(mode) {
    const name = this.authUser || 'trainer';
    this.ui.toast('Welcome back, ' + name + '!'); // toast = textContent (C12-safe)
    SYNC.runLoginMerge(this, mode, (res) => {
      if (!res) return;
      // ADR-025 §6: a Second Journey login merges like Continue (the
      // merge refreshes the local slot caches), then hands off to the
      // creation flow, which re-reads its sources from those caches.
      // The merge's own load outcome is deliberately not followed.
      if (mode === 'second') { this.secondJourney(); return; }
      if (res.load === 'state' && res.state) {
        this.state = res.state;
        this.audio.applySettings(this.state.settings);
        this.applyKeymap();
        this.applyLayout();
        this.scenes.replace(new OverworldScene());
        this.ui.toast('Save loaded.');
      } else if (res.load === 'new') {
        this.newGame();
      } else {
        // fallback (offline / unavailable / expired): play on this device.
        if (mode === 'continue') this.continueGame();
        else this.newGame();
      }
    });
  }

  quitToTitle(saveIt) {
    if (saveIt !== false) this.saveGame(true);
    this.ui.hideGuestBanner();
    this.scenes.replace(new BootScene());
  }

  newGame() {
    // Settings are player preferences, not save data: options chosen on the
    // title screen (text speed, battle style, mute...) survive a new game.
    const keepSettings = this.state && this.state.settings;
    // ADR-025 §4: the difficulty mode is likewise picked in Options — a
    // mode chosen on the title screen carries into the new run.
    const keepDifficulty = this.state && this.state.story ? difficultyOf(this.state) : 'classic';
    this.state = freshState();
    if (keepSettings) this.state.settings = keepSettings;
    this.applyKeymap();
    this.state.story.difficulty = keepDifficulty;
    // A run that STARTS with a House Rule on has enabled one: no Pure Run.
    if (activeHouseRules(this.state).length) this.state.meta.houseRulesTouched = true;
    this.state.player.name = 'ASH';
    this.rng = makeRngStreams(nextSeed());
    this.skipIntroVeteran = this.store.exists();
    this.scenes.replace(new IntroScene());
  }

  continueGame() {
    const res = this.store.load();
    if (!res.ok) {
      this.ui.toast('Save data invalid (' + res.reason + '). Starting fresh is safest.');
      return;
    }
    this.state = res.data;
    this.audio.applySettings(this.state.settings);
    this.applyKeymap();
    this.applyLayout();
    this.scenes.replace(new OverworldScene());
    this.ui.toast('Welcome back, ' + this.state.player.name + '!');
  }

  startOverworld(opts) {
    this.scenes.replace(new OverworldScene());
    if (this.guestMode) this.ui.showGuestBanner(); // UI v2.1: no-op (banner retired; notice lives in the terminal guest pane)
    // D2: fresh runs open on the Chapter 1 title card (anime spine, ADR-015).
    if (opts && typeof opts.chapterCard === 'number') {
      this.ui.showChapterCard(CHAPTERS[opts.chapterCard]);
    }
  }

  saveGame(quiet) {
    // Track B: logged-in saves go to the local cloud-cache + background queue
    // (SYNC) — the game never waits on network. Guest path is byte-identical.
    if (AUTH.user) {
      const res = SYNC.saveLocal(this);
      if (!quiet || !res.ok) {
        if (res.ok) { this.ui.toast('Game saved. (' + Math.round(res.bytes / 1024) + ' KB)'); this.audio.playSfx('save-confirm'); }
        else this.ui.toast('Save failed: ' + res.reason);
      }
      SYNC.afterLocalSave(this);
      return res;
    }
    const res = this.store.save(this.state);
    if (!quiet || !res.ok) {
      if (res.ok) { this.ui.toast('Game saved. (' + Math.round(res.bytes / 1024) + ' KB)'); this.audio.playSfx('save-confirm'); }
      else this.ui.toast('Save failed: ' + res.reason);
    }
    return res;
  }

  autosave(reason) {
    if (this.state.settings.autosave === false) return; // P1/I5: autosave toggle
    const now = Date.now();
    if (now - this._lastAutosave < 5000) return; // 5s throttle floor
    this._lastAutosave = now;
    this.saveGame(true);
  }

  // ---- menus (UI states, no scene reload) ----
  openBag() {
    const g = this;
    const items = [];
    // UI v2.4 (one bag): pockets are TABS now (UI.renderMenu renders the
    // .bagtab strip from opts.bagTabs; rows carry their pocket). The v2.3
    // full-width gradient band separators are gone — one component serves
    // the pause menu here and the battle bag in battle.mjs.
    const pocketsPresent = [];
    for (const pocket of POCKETS) {
      const inPocket = Object.keys(ITEMS).filter((id) => ITEMS[id].pocket === pocket && (g.state.bag[id] || 0) > 0);
      if (!inPocket.length) continue;
      pocketsPresent.push(pocket);
      for (const id of inPocket) {
        const hint = id === 'potion' ? ' (heals 20 HP — uses your turn in battle)' : '';
        items.push({ label: ITEMS[id].name + ' x' + g.state.bag[id] + hint, value: id, pocket });
      }
    }
    if (!items.length) items.push({ label: '(empty)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    // Bag rows carry the item's authored icon (uiIcon -> data URL, cached
    // per item id) where art exists; headers/Close stay plain text.
    const bagRowHtml = (it) => {
      if (!it.value || it.value === 'close') return '<span>' + it.label + '</span>';
      const url = g.itemIconDataUrl(it.value);
      // Emit the icon whenever authored icon art exists for the item —
      // in the browser url is its data URL; headless stub canvases have
      // no toDataURL (url ''), but the row still carries the <img>.
      let hasIcon = !!url;
      if (!hasIcon) {
        try {
          const iconName = g.itemIconName(it.value);
          hasIcon = !!(iconName && uiIcon(doc, iconName));
        } catch (e) { hasIcon = false; }
      }
      const img = hasIcon ? '<img class="picon" src="' + url + '" alt="">' : '';
      return img + '<span>' + it.label + '</span>';
    };
    g.ui.showMenu('Bag', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'potion') {
        const targets = g.state.party.map((m, i) => ({
          label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i,
          disabled: m.hp <= 0 || m.hp >= m.maxHp,
        }));
        targets.push({ label: 'Back', value: -1 });
        const targetRowHtml = (it) => {
          if (it.value === -1 || it.value === null) return '<span>' + it.label + '</span>';
          const m = g.state.party[it.value];
          if (!m) return '<span>' + it.label + '</span>';
          return '<img class="picon" src="' + g.spriteDataUrl(m.speciesId) + '" alt=""><span>' + it.label + '</span>';
        };
        g.ui.showMenu('Use Potion on...', targets, (t) => {
          if (t === null || t === -1) { g.openBag(); return; }
          const m = g.state.party[t];
          g.state.bag.potion--;
          m.hp = Math.min(m.maxHp, m.hp + 20);
          g.audio.playSfx('heal');
          g.ui.toast(displayName(m, SPECIES) + ' recovered 20 HP!');
        }, { rowHtml: targetRowHtml });
      } else if (g.useBagItem) {
        g.useBagItem(v); // WS9: full item-use system (main-systems.mjs)
      }
    }, { rowHtml: bagRowHtml, menuClass: 'bagwin', bagTabs: pocketsPresent, remember: 'bag' });
  }

  openParty() {
    const g = this;
    // P1/G1: rows carry the species battle-art sprite, an HP mini-bar +
    // numbers, status chip, and a PARTNER text chip for the partner.
    const rowHtml = (it) => {
      // UI v2.1 (defect 3): every party plate leads with its Poke Ball slot
      // marker, Platinum-style — filled rows and empty slots alike.
      const ball = '<img class="pball" src="' + g.itemIconDataUrl('pokeball') + '" alt="">';
      if (it.value === -1) return ball + '<span class="emptyslot">Empty slot</span>';
      if (it.value === 'close') return '<span>' + it.label + '</span>';
      const m = g.state.party[it.value];
      if (!m) return '<span>' + it.label + '</span>';
      const pct = Math.max(0, Math.round((m.hp / m.maxHp) * 100));
      const col = pct > 50 ? '#58c94f' : pct > 25 ? '#e8c832' : '#e84040';
      const badge = m.speciesId === 'partner' ? '<span class="pbadge">PARTNER</span>' : '';
      const st = m.status ? '<span class="pstat">' + m.status.toUpperCase().slice(0, 3) + '</span>' : '';
      // ADR-025 §3: party rows show whether a mon holds a keepsake.
      const ksChip = m.keepsake && ITEMS[m.keepsake] ? '<span class="pstat">' + ITEMS[m.keepsake].name + '</span>' : '';
      return ball + '<img class="picon" src="' + g.spriteDataUrl(m.speciesId) + '" alt="">'
        + '<span><b>' + displayName(m, SPECIES) + '</b> Lv' + m.level + badge + '</span>'
        + '<span class="phpbar"><i style="width:' + pct + '%;background:' + col + '"></i></span>'
        + '<span>' + m.hp + '/' + m.maxHp + '</span>' + st + ksChip;
    };
    const items = g.state.party.map((m, i) => {
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + '  ' + m.hp + '/' + m.maxHp, value: i };
    });
    for (let i = g.state.party.length; i < 6; i++) items.push({ label: 'Empty', value: -1, disabled: true });
    items.push({ label: 'Close', value: 'close', closeRow: true });
    // Platinum tabbed summary (UI v2): INFO / STATUS / MOVES, composed only
    // from real mon/species/move data. The mon object carries `xp` (total
    // XP for its level, set by makeMon and level-ups); there is no stored
    // next-level figure on the mon, so INFO shows that total and never a
    // derived or invented next-level number.
    const sumRow = (k, val) => '<div class="sumrow"><span>' + k + '</span><b>' + val + '</b></div>';
    const summaryData = (m) => {
      const sp = SPECIES[m.speciesId];
      const xpVal = (typeof m.xp === 'number') ? m.xp : ((typeof m.exp === 'number') ? m.exp : null);
      let info = '<div class="sumhead"><img class="sumsprite" src="' + g.spriteDataUrl(m.speciesId) + '" alt="">'
        + '<div><div class="sumname">' + displayName(m, SPECIES) + '</div>'
        + '<div class="sumsub">No. ' + sp.dexNo + ' · ' + sp.types.join(' / ') + '</div></div></div>';
      if (m.ot !== undefined && m.ot !== null && m.ot !== '') info += sumRow('OT', m.ot);
      info += sumRow('Level', m.level);
      info += sumRow('HP', m.hp + '/' + m.maxHp);
      // ADR-025 §3 (Phase 3): the summary shows the held Keepsake and
      // its one-line effect text (ITEMS carries the same text).
      info += sumRow('Keepsake', m.keepsake && ITEMS[m.keepsake] ? ITEMS[m.keepsake].name : 'None');
      if (m.keepsake && ITEMS[m.keepsake]) info += '<div class="sumflavor">' + ITEMS[m.keepsake].desc + '</div>';
      if (xpVal !== null) info += sumRow('EXP', xpVal);
      if (sp.flavor) info += '<div class="sumflavor">' + sp.flavor + '</div>';
      let statusBody = '';
      statusBody += sumRow('ATK', m.stats.atk);
      statusBody += sumRow('DEF', m.stats.def);
      statusBody += sumRow('SPA', m.stats.spa);
      statusBody += sumRow('SPD', m.stats.spd);
      statusBody += sumRow('SPE', m.stats.spe);
      statusBody += sumRow('Status', m.status ? m.status : 'None');
      let movesBody = '';
      for (const mm of (m.moves || [])) {
        const mv = MOVES[mm.id];
        if (!mv) {
          movesBody += '<div class="sum-move"><span class="sum-mvname">' + mm.id + '</span>'
            + '<span class="sum-mvmeta">PP ' + mm.pp + '/' + mm.maxPp + '</span></div>';
          continue;
        }
        movesBody += '<div class="sum-move"><span class="sum-mvname">' + mv.name + '</span>'
          + typePill(mv.type)
          + '<span class="sum-mvmeta">Pow ' + (mv.power ? mv.power : '—')
          + ' · Acc ' + ((mv.acc !== undefined && mv.acc !== null) ? mv.acc : '—')
          + ' · PP ' + mm.pp + '/' + mm.maxPp + ' · ' + mv.cat + '</span></div>';
      }
      if (!movesBody) movesBody = '<div class="sumflavor">No moves known.</div>';
      return {
        name: displayName(m, SPECIES),
        tabs: [
          { id: 'info', label: 'INFO', bodyHtml: info },
          { id: 'status', label: 'STATUS', bodyHtml: statusBody },
          { id: 'moves', label: 'MOVES', bodyHtml: movesBody },
        ],
      };
    };
    // Per-Pokemon action submenu: a standard Platinum window (no menuClass).
    // Closing the summary panel reopens this submenu, so B backs out one
    // level like Platinum instead of dropping back to the overworld.
    const openMonMenu = (monIndex) => {
      const m = g.state.party[monIndex];
      if (!m) return;
      const fieldMoves = (m.moves || []).filter((x) => ['cut', 'fly', 'surf', 'strength', 'flash'].includes(x.id));
      const rows = [{ label: 'Summary', value: 'summary' }];
      // AUDIT FIX (S-47): Platinum's party submenu has SWITCH — party
      // order (lead, switch-ins, XP share order) could not be changed
      // anywhere in the game. Switch picks a partner and swaps places.
      if (g.state.party.length > 1) rows.push({ label: 'Switch', value: 'switch' });
      // ADR-025 §3 (Phase 3): Keepsake Give/Take rows. The partner
      // Pikachu may hold one (the ADR-016 guards do NOT apply here).
      const heldDef = m.keepsake && ITEMS[m.keepsake] ? ITEMS[m.keepsake] : null;
      const bagKs = Object.keys(KEEPSAKES).filter((id) => (g.state.bag[id] || 0) > 0);
      if (heldDef) rows.push({ label: 'Take ' + heldDef.name, value: 'ks-take' });
      if (!heldDef && bagKs.length && !m.egg) rows.push({ label: 'Give keepsake', value: 'ks-give' }); // J6: an Egg holds nothing
      if (fieldMoves.length) rows.push({ label: 'Field moves', value: 'field' });
      rows.push({ label: 'Close', value: 'close' });
      g.ui.showMenu(displayName(m, SPECIES), rows, (a) => {
        if (a === 'ks-take') {
          if (takeKeepsake(g.state, m)) {
            g.audio.playSfx('ui-blip');
            g.ui.toast('Took the ' + heldDef.name + ' from ' + displayName(m, SPECIES) + '.');
          }
          g.openParty();
          return;
        }
        if (a === 'ks-give') {
          const ksRows = bagKs.map((id) => ({ label: ITEMS[id].name, value: id }));
          ksRows.push({ label: 'Back', value: -1 });
          const ksRowHtml = (it) => it.value === -1
            ? '<span>' + it.label + '</span>'
            : '<img class="picon" src="' + g.itemIconDataUrl(it.value) + '" alt=""><span><b>' + it.label + '</b></span><span>' + ITEMS[it.value].desc + '</span>';
          g.ui.showMenu('Give which keepsake?', ksRows, (id) => {
            if (id === null || id === -1) { openMonMenu(monIndex); return; }
            if (giveKeepsake(g.state, m, id)) {
              g.audio.playSfx('ui-blip');
              g.ui.toast(displayName(m, SPECIES) + ' is now holding the ' + ITEMS[id].name + '.');
            }
            g.openParty();
          }, { rowHtml: ksRowHtml });
          return;
        }
        if (a === 'field' && g.openFieldMove) { g.openFieldMove(m); return; }
        if (a === 'switch') {
          const others = g.state.party
            .map((mm, i) => ({ label: displayName(mm, SPECIES) + ' Lv' + mm.level, value: i }))
            .filter((r) => r.value !== monIndex);
          others.push({ label: 'Back', value: -1 });
          g.ui.showMenu('Switch ' + displayName(m, SPECIES) + ' with...', others, (t) => {
            if (t === null || t === -1) { openMonMenu(monIndex); return; }
            const tmp = g.state.party[monIndex];
            g.state.party[monIndex] = g.state.party[t];
            g.state.party[t] = tmp;
            g.audio.playSfx('ui-blip');
            g.openParty();
          });
          return;
        }
        if (a === 'summary') {
          g.ui.showSummary(summaryData(m), () => openMonMenu(monIndex));
        }
      });
    };
    g.ui.showMenu('Party', items, (v) => {
      if (v === null || v === 'close' || v === -1) return;
      openMonMenu(v);
    }, { rowHtml, menuClass: 'plate-full', remember: 'party', gridNav: true });
  }

  openDex(filter) {
    const g = this;
    filter = filter || {};
    const caught = dexCaughtCount(g.state.dex);
    const matchSpecies = (id) => {
      const sp = SPECIES[id];
      const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
      if (filter.status === 'caught' && !c) return false;
      if (filter.status === 'seen' && !(s && !c)) return false;
      if (filter.status === 'unseen' && (s || c)) return false;
      if (filter.type && !sp.types.includes(filter.type)) return false;
      if (filter.q && sp.name.toLowerCase().indexOf(filter.q.toLowerCase()) < 0) return false;
      return true;
    };
    const items = Object.keys(SPECIES).filter((id) => id !== 'partner' && !SPECIES[id].form && matchSpecies(id)).map((id) => {
      const sp = SPECIES[id];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      const mark = c ? '[CAUGHT]' : (s ? '[SEEN]' : '[???]');
      return { label: 'No.' + sp.dexNo + ' ' + (c || s ? sp.name : '???') + ' ' + mark, value: id };
    });
    const fdesc = (filter.q ? ' q=' + filter.q : '') + (filter.type ? ' ' + filter.type : '') + (filter.status ? ' ' + filter.status : '');
    items.unshift({ label: 'Caught ' + caught + ' / ' + DEX_TOTAL + ' (tracked)', value: null, disabled: true });
    items.unshift({ label: "Prof. Hawthorn's rating", value: 'rating' });
    items.unshift({ label: 'Search / Filter' + (fdesc ? ':' + fdesc : ''), value: 'filter' });
    items.unshift({ label: 'Areas — caught per area', value: 'areas' });
    // ADR-027 D5 (Stage F): the dex header's Regional + National lines,
    // both registry-driven. Regional = the current arc's own species
    // span; National = the Platinum horizon (493) with its percentage.
    // The chapter header stays items[0] (the qa-changed-flows anchor).
    const arcNow = currentArcOf(g.state);
    const span = arcDexSpan(arcNow);
    const caughtNos = Object.keys(g.state.dex.caught).map(Number);
    const regCaught = caughtNos.filter((n) => n >= span.lo && n <= span.hi).length;
    const natCaught = caughtNos.filter((n) => n >= 1 && n <= PLATINUM_DEX_HORIZON).length;
    const natPct = Math.floor((100 * natCaught) / PLATINUM_DEX_HORIZON);
    items.unshift({ label: 'National — Platinum horizon: ' + natCaught + '/' + PLATINUM_DEX_HORIZON + ' (' + natPct + '%)', value: null, disabled: true });
    items.unshift({ label: 'Regional — ' + arcNow.region + ': ' + regCaught + '/' + (span.hi - span.lo + 1), value: null, disabled: true });
    // D2: arc progression surfaced in the Dex — current chapter header row.
    const curCh = chapterOf((g.state.story.chapter || 0) + 1);
    items.unshift({ label: 'Journey — Ch.' + curCh.n + ' · ' + curCh.title, value: null, disabled: true });
    if (!items.length) items.push({ label: '(no matches)', value: null, disabled: true });
    // ADR-027 D5: the sealed divider — species beyond the Platinum
    // horizon (the rest of the 1025 frame) sit below it exactly as
    // undiscovered species render today: ??? rows under this line.
    items.push({ label: '— More Pokémon are known to exist. Their regions are future arcs. —', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Pokedex', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'rating') { g.ui.say([g.oakRating()], () => g.openDex(filter), 'Prof. Hawthorn'); return; }
      if (v === 'filter') { g.openDexFilter(filter); return; }
      if (v === 'areas') { g.openDexAreas(filter); return; }
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(filter); return; }
      g.openDexEntry(v, filter);
    }, { remember: 'dex' });
  }

  // Elevation B5: the dex entry as its own plate, pageable in place —
  // Left/Right (and Q/E, the PC box-switch convention) walk the whole
  // Kanto dex in dex order without returning to the list. Unseen
  // neighbours render redacted, exactly as the list shows them (???).
  openDexEntry(speciesId, filter) {
    const g = this;
    const order = Object.keys(SPECIES)
      .filter((id) => id !== 'partner' && !SPECIES[id].form && SPECIES[id].dexNo >= 1 && SPECIES[id].dexNo <= 151)
      .sort((a, b) => SPECIES[a].dexNo - SPECIES[b].dexNo);
    let idx = order.indexOf(speciesId);
    if (idx < 0) idx = 0;
    const render = () => {
      const id = order[idx];
      const sp = SPECIES[id];
      const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
      const known = c || s;
      const title = '◀ No.' + sp.dexNo + ' ' + (known ? sp.name : '???') + ' ▶';
      const body = '<div class="sumhead"><img class="sumsprite" src="' + (known ? g.spriteDataUrl(id) : '') + '" alt="">'
        + '<div><div class="sumname">' + (known ? sp.name : '???') + '</div>'
        + '<div class="sumsub">' + (known ? sp.types.join(' / ') : '???') + '</div>'
        + '<div class="sumsub">Status: ' + (c ? 'CAUGHT' : s ? 'SEEN' : 'UNSEEN') + '</div></div></div>'
        + '<div class="sumflavor">' + (known ? sp.flavor : 'No data yet — this Pokemon has not been seen.') + '</div>'
        + '<div class="sumsub">◀ ▶ : previous / next entry</div>';
      return { title, bodyHtml: body };
    };
    g.ui.showEntryPanel(render(), (act, d) => {
      if (act === 'page') {
        idx = (idx + d + order.length) % order.length;
        g.ui.updateEntryPanel(render());
      } else if (act === 'close') {
        g.openDex(filter);
      }
    });
  }

  // P1/G3: dex filter submenu — status, type, and name search (reuses the A-Z grid).
  openDexFilter(filter) {
    const g = this;
    const types = [...new Set(Object.keys(SPECIES).flatMap((id) => SPECIES[id].types))].sort();
    g.ui.showMenu('Filter: status', [
      { label: 'All', value: 'all' },
      { label: 'Caught', value: 'caught' },
      { label: 'Seen', value: 'seen' },
      { label: 'Unseen', value: 'unseen' },
      { label: 'Back', value: 'back' },
    ], (st) => {
      if (st === 'back' || st === null) { g.openDex(filter); return; }
      const f2 = Object.assign({}, filter, { status: st === 'all' ? null : st });
      // AUDIT FIX (S-05): 'All types' carried value:null — the cancel
      // sentinel — so choosing it aborted the wizard and threw away the
      // status step. It now has its own value and continues to search.
      const titems = [{ label: 'All types', value: 'all' }].concat(types.map((t) => ({ label: t, value: t })));
      titems.push({ label: 'Back', value: 'back' });
      g.ui.showMenu('Filter: type', titems, (tp) => {
        if (tp === 'back' || tp === null) { g.openDex(filter); return; }
        const f3 = Object.assign({}, f2, { type: tp === 'all' ? null : tp });
        g.ui.showNameEntry('Search the Dex (blank = all)', '', 8, (q) => {
          if (q === null) { g.openDex(f2); return; } // cancelled: keep the pre-search filter (S-03)
          f3.q = q || null; // '' (blank OK) clears the search, as promised (S-04)
          g.openDex(f3);
        }, { allowCancel: true, allowEmpty: true });
      });
    });
  }

  // D2: Journey menu — the anime-chronology spine (ADR-015). Playable chapters
  // open a detail card; locked chapters and the BONUS shelf are honest
  // disabled rows (no fake content, no "coming soon" placeholders).
  openJourney() {
    const g = this;
    const cur = g.state.story.chapter || 0; // 0-based chapter index
    const items = [];
    items.push({ label: 'Quest Log — the road so far', value: 'quests' });
    items.push({ label: 'Regions — the journey chain', value: 'regions' });
    items.push({ label: 'Hall of Fame', value: 'hof' });
    items.push({ label: 'Diploma', value: 'diploma' });
    // ADR-027 (Stage F): chapters render grouped under ARC headers
    // from the registry, each header carrying the arc's state
    // (Complete / Current / Next / Sealed, from arcStateOf). Chapter
    // rows keep their existing labels + detail view untouched.
    const stateWord = { complete: 'COMPLETE', current: 'CURRENT', 'locked-next': 'NEXT', sealed: 'SEALED' };
    let futureHeaderDone = false;
    for (const arc of ARCS) {
      if (arc.future) {
        if (!futureHeaderDone) {
          items.push({ label: '— FUTURE ARCS — SEALED —', value: null, disabled: true, band: true });
          futureHeaderDone = true;
        }
      } else {
        items.push({
          label: '— ' + arc.label.toUpperCase() + ' · ' + arc.region.toUpperCase() + ' — ' + (stateWord[arcStateOf(g.state, arc.id)] || 'SEALED') + ' —',
          value: null, disabled: true, band: true,
        });
      }
      for (const chN of arc.chapters) {
        const ch = CHAPTERS.find((c) => c.n === chN);
        if (!ch) continue;
        if (ch.scope === 'playable') {
          const isCur = (ch.n - 1) === cur;
          items.push({
            label: (isCur ? '\u25b8 ' : '  ') + 'Ch.' + ch.n + ' — ' + ch.title + (isCur ? ' (now)' : ''),
            value: 'ch' + ch.n,
          });
        } else {
          items.push({
            label: 'Ch.' + ch.n + ' — ' + ch.title + ' · locked (future act)',
            value: null, disabled: true,
          });
        }
      }
    }
    items.push({ label: '— BONUS SHELF (non-canon, not on the spine) —', value: null, disabled: true });
    for (const b of BONUS_SHELF) {
      items.push({ label: b, value: null, disabled: true });
    }
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Journey', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'quests') { g.openQuestLog(); return; }
      if (v === 'regions') { g.openRegions(); return; }
      if (v === 'hof') { g.openHallOfFame(); return; }
      if (v === 'diploma') { g.openDiploma(); return; }
      const ch = CHAPTERS.find((c) => 'ch' + c.n === v);
      if (ch) {
        g.ui.say([
          'CHAPTER ' + ch.n + ' — ACT ' + ch.act,
          ch.title,
          ch.arc,
          'Anime: ' + ch.anime,
          ch.movies.length ? 'Special events: ' + ch.movies.join(' · ') : '',
        ], () => g.openJourney(), 'Journey');
      }
    });
  }

  // P1/G3: Areas tab — per-area "caught n/m" checklists (B2W2 Habitat pattern).
  // AUDIT FIX (S-42): the active dex filter rides along and is restored on
  // return — the Areas detour used to silently drop it.
  openDexAreas(filter) {
    const g = this;
    const items = Object.keys(MAPS).filter((id) => MAPS[id].encounters).map((id) => {
      const map = MAPS[id];
      const species = [...new Set(map.encounters.table.map((e) => e.species))];
      const n = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
      return { label: map.name + ' — ' + n + '/' + species.length + ' caught', value: id };
    });
    items.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('Dex — Areas', items, (v) => {
      if (!v || v === 'back') { g.openDex(filter); return; }
      const map = MAPS[v];
      const rows = map.encounters.table.map((e) => {
        const sp = SPECIES[e.species];
        const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
        return { label: (c || s ? sp.name : '???') + '  Lv' + e.min + '-' + e.max + (c ? ' [CAUGHT]' : s ? ' [SEEN]' : ''), value: null, disabled: true };
      });
      rows.push({ label: 'Back', value: 'back' });
      g.ui.showMenu(map.name, rows, () => g.openDexAreas(filter));
    });
  }

  openSave() {
    const g = this;
    // Track B: logged-in players get the cloud slot list (3 slots + sync state).
    if (AUTH.user) { g.openSaveCloud(); return; }
    const caught = dexCaughtCount(g.state.dex);
    const badges = g.state.badges.kanto.length;
    const mins = Math.floor((g.state.player.playtimeSec || 0) / 60);
    const when = g.state.meta.updatedAt ? new Date(g.state.meta.updatedAt).toLocaleString() : 'never';
    // ADR-025 §4: the save summary carries the mode + House Rules state —
    // "Pure Run" while no rule has ever been enabled on this save.
    const activeRules = activeHouseRules(g.state);
    const modeLine = 'Mode: ' + DIFFICULTY_LABELS[difficultyOf(g.state)] + ' · '
      + (!g.state.meta.houseRulesTouched ? 'Pure Run'
        : activeRules.length ? 'Rules: ' + activeRules.join(', ')
        : 'House Rules touched');
    g.ui.showMenu('Save', [
      { label: g.state.meta.location + ' · ' + mins + 'm · ' + badges + ' badges · Dex ' + caught, value: null, disabled: true },
      { label: modeLine, value: null, disabled: true },
      // ADR-025 §6: a Second Journey run's summary carries its ribbon.
      ...((g.state.meta.ngPlus || 0) > 0
        ? [{ label: '★ Second Journey — Journey ' + (g.state.meta.ngPlus + 1), value: null, disabled: true }] : []),
      { label: 'Last saved: ' + when, value: null, disabled: true },
      { label: 'Sync: guest-local (Track B: cloud)', value: null, disabled: true },
      { label: 'Save now', value: 'save' },
      { label: 'Close', value: 'close' },
    ], (v) => {
      if (v === 'save') g.saveGame(false);
    }, { menuClass: 'syswin' });
  }

  // Track B: cloud slot picker (labels are formatted numbers/dates only —
  // no player strings, so the menu's innerHTML path is safe here).
  openSaveCloud() {
    const g = this;
    const slots = SYNC.getSlots();
    const items = [{ label: 'Cloud saves — pick a slot', value: null, disabled: true }];
    for (const s of slots) {
      const h = Math.floor((s.playtimeSec || 0) / 3600);
      const m = Math.floor(((s.playtimeSec || 0) % 3600) / 60);
      const st = s.pending ? 'Sync pending' : (s.cloudMeta || s.hasLocal) ? 'Synced' : 'Empty';
      items.push({
        label: (s.active ? '▶ ' : '') + 'Slot ' + s.slot + ' — ' + h + 'h ' + (m < 10 ? '0' + m : '' + m) +
          'm · ' + s.badgeCount + ' badges · ' + st,
        value: 'slot:' + s.slot,
      });
    }
    items.push({ label: 'Save now', value: 'save' });
    items.push({ label: 'Sync now', value: 'sync' });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Save', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'save') g.saveGame(false);
      else if (v === 'sync') SYNC.syncNow(g, true);
      else if (v.indexOf('slot:') === 0) {
        SYNC.setActiveSlot(parseInt(v.slice(5), 10));
        g.ui.toast('Slot ' + v.slice(5) + ' selected.');
        g.openSave();
      }
    }, { menuClass: 'syswin' });
  }

  openOptions() {
    const g = this;
    const s = g.state.settings;
    const yn = (b) => b ? 'ON' : 'OFF';
    const rows = [
      { label: 'Text speed: ' + s.textSpeed, value: 'text' },
      { label: 'Mute: ' + yn(s.mute), value: 'mute' },
      { label: 'Music volume: ' + Math.round(s.musicVol * 100) + '%', value: 'music' },
      { label: 'SFX volume: ' + Math.round(s.sfxVol * 100) + '%', value: 'sfx' },
      { label: 'Battle animations: ' + yn(s.battleAnims), value: 'banim' },
      { label: 'Battle style: ' + (s.battleStyle === 'classic' ? 'CLASSIC (turns)' : 'REAL-TIME'), value: 'bstyle' },
      { label: 'Switch style: ' + (s.switchMode === 'shift' ? 'SHIFT' : 'SET'), value: 'swmode' },
      { label: 'Difficulty: ' + DIFFICULTY_LABELS[difficultyOf(g.state)], value: 'diff' },
      { label: 'House Rules', value: 'hrules' },
      { label: 'Screen shake: ' + yn(s.shake), value: 'shake' },
      { label: 'Vibration: ' + yn(s.vibration), value: 'vib' },
      { label: 'Autosave: ' + yn(s.autosave), value: 'asave' },
      { label: 'Reduced motion: ' + yn(s.reducedMotion), value: 'rmotion' },
      { label: 'Flip controls: ' + yn(s.controlsFlip), value: 'flip' },
      { label: 'Controls — remap keys', value: 'controls' },
      { label: 'Show touch controls: ' + yn(s.showTouch), value: 'showtouch' },
      { label: 'HUD scale: ' + Math.round(s.hudScale * 100) + '%', value: 'hudscale' },
      { label: 'Legal / credits', value: 'legal' },
    ];
    // Track B: account surface (wireframes §10). Labels are static — the
    // username itself is only ever rendered via textContent (AppSec C12).
    if (g.authUser) {
      rows.push({ label: 'Account', value: 'account' });
      rows.push({ label: 'Sync now', value: 'syncnow' });
    }
    rows.push(
      { label: 'Erase save', value: 'erase' },
      { label: 'Close', value: 'close' },
    );
    g.ui.showMenu('Options', rows, (v) => {
      if (v === 'text') {
        const order = ['slow', 'normal', 'fast', 'instant'];
        s.textSpeed = order[(order.indexOf(s.textSpeed) + 1) % order.length];
      } else if (v === 'mute') { s.mute = !s.mute; g.audio.setMuted(s.mute); }
      else if (v === 'music') { s.musicVol = s.musicVol >= 0.99 ? 0 : Math.round((s.musicVol + 0.1) * 10) / 10; g.audio.setMusicVolume(s.musicVol); }
      else if (v === 'sfx') { s.sfxVol = s.sfxVol >= 0.99 ? 0 : Math.round((s.sfxVol + 0.1) * 10) / 10; g.audio.setSfxVolume(s.sfxVol); }
      else if (v === 'banim') s.battleAnims = !s.battleAnims;
      else if (v === 'bstyle') { s.battleStyle = s.battleStyle === 'classic' ? 'rt' : 'classic'; g.ui.toast('Battle style: ' + (s.battleStyle === 'classic' ? 'Classic turns' : 'Real-time')); }
      else if (v === 'swmode') { s.switchMode = s.switchMode === 'shift' ? 'set' : 'shift'; g.ui.toast('Switch style: ' + (s.switchMode === 'shift' ? 'Shift' : 'Set')); }
      else if (v === 'diff') { g.openDifficultyMenu(); return; }
      else if (v === 'hrules') { g.openHouseRulesMenu(); return; }
      else if (v === 'shake') s.shake = !s.shake;
      else if (v === 'vib') s.vibration = !s.vibration;
      else if (v === 'asave') s.autosave = !s.autosave;
      else if (v === 'rmotion') { s.reducedMotion = !s.reducedMotion; g.audio.setReducedMotion(s.reducedMotion); if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('reduced-motion', !!s.reducedMotion); }
      else if (v === 'flip') { s.controlsFlip = !s.controlsFlip; g.applyLayout(); }
      else if (v === 'controls') { g.openControlsMenu(); return; }
      else if (v === 'showtouch') {
        s.showTouch = !s.showTouch;
        if (typeof document !== 'undefined') document.body.classList.toggle('showtouch', !!s.showTouch);
      }
      else if (v === 'hudscale') {
        // P1/I2: HUD scale row (the setting existed with no UI).
        s.hudScale = s.hudScale >= 1.5 ? 1 : Math.round((s.hudScale + 0.25) * 100) / 100;
        if (typeof document !== 'undefined') document.documentElement.style.setProperty('--hudscale', s.hudScale);
      }
      else if (v === 'legal') { g.ui.say(DISCLAIMER_CREDITS, () => g.openOptions(), ''); return; }
      else if (v === 'account') { AUTH.openAccountMenu(g); return; }
      else if (v === 'syncnow') { SYNC.syncNow(g, true); return; }
      else if (v === 'erase') {
        g.ui.showMenu('Erase ALL save data?', [
          { label: 'Yes, erase everything', value: 'yes' },
          { label: 'No, keep it', value: 'no' },
        ], (a) => {
          if (a === 'yes') {
            g.ui.showMenu('Really sure? This cannot be undone.', [
              { label: 'Yes, erase', value: 'yes2' },
              { label: 'No', value: 'no' },
            ], (b) => {
              if (b === 'yes2') {
                // P1/H4: third gate — type-to-confirm DELETE (deletion is irreversible).
                g.ui.showNameEntry('Type DELETE to confirm', '', 6, (typed) => {
                  if (String(typed).toUpperCase() === 'DELETE') {
                    g.store.erase();
                    g.ui.toast('Save data erased.');
                  } else {
                    g.ui.toast('Erase cancelled.');
                  }
                }, { allowCancel: true, emptyMsg: 'Type DELETE to confirm — or CANCEL to back out.' });
              }
            }, { menuClass: 'syswin' });
          }
        }, { menuClass: 'syswin' });
        return;
      } else return;
      g.saveGame(true);
      g.openOptions();
    }, { menuClass: 'syswin', remember: 'options' });
  }

  // ADR-025 §4: the run's difficulty mode. Lowering is free any time;
  // RAISING locks once the first badge is earned (a run's honors stay
  // honest) — locked raises render as disabled rows (the menu buzzes).
  openDifficultyMenu() {
    const g = this;
    const cur = difficultyOf(g.state);
    const locked = ((g.state.badges && g.state.badges.kanto) || []).length >= 1;
    const rows = DIFFICULTY_MODES.map((m) => ({
      label: DIFFICULTY_LABELS[m] + (m === cur ? '  (current)' : ''),
      value: m,
      disabled: locked && DIFFICULTY_RANK[m] > DIFFICULTY_RANK[cur],
    }));
    if (locked) rows.push({ label: 'Badge earned: difficulty can only be lowered now.', value: null, disabled: true });
    rows.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('Difficulty', rows, (v) => {
      if (!v || v === 'back') { g.openOptions(); return; }
      if (v !== cur) {
        g.state.story.difficulty = v;
        g.saveGame(true);
        g.ui.toast('Difficulty: ' + DIFFICULTY_LABELS[v]);
      }
      g.openOptions();
    }, { menuClass: 'syswin', remember: 'options-difficulty' });
  }

  // ADR-025 §4: House Rules — the six player-side modifier toggles.
  // Turning one ON (ever) sets meta.houseRulesTouched: the save's
  // "Pure Run" ribbon is the only thing modifiers ever cost.
  openHouseRulesMenu() {
    const g = this;
    if (!g.state.settings.houseRules || typeof g.state.settings.houseRules !== 'object') {
      g.state.settings.houseRules = {
        steadyDamage: false, mercifulFoes: false, fastLearner: false,
        generousWorld: false, candyCoach: false, skipIntro: false,
      };
    }
    const hr = g.state.settings.houseRules;
    const rows = HOUSE_RULE_DEFS.map((d) => ({
      label: d.label + ': ' + (hr[d.key] ? 'ON' : 'OFF'),
      value: d.key,
    }));
    rows.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('House Rules', rows, (v) => {
      if (!v || v === 'back') { g.openOptions(); return; }
      hr[v] = !hr[v];
      if (hr[v]) g.state.meta.houseRulesTouched = true;
      g.saveGame(true);
      g.openHouseRulesMenu();
    }, { menuClass: 'syswin', remember: 'options-houserules' });
  }

  // Elevation B3 (S-18): apply the persisted keymap (settings.keymap).
  // The persisted map is the COMPLETE effective remap (captureRemapKey
  // saves the full object), so when one exists it replaces the factory
  // KEYMAP wholesale — overlaying it would resurrect bindings the player
  // deliberately moved off their old keys (QA Major 1, 2026-10-27).
  // A null map (fresh player / after Reset defaults) means factory.
  // Called wherever a state's settings land (boot, Continue, cloud
  // login, New Game's carried settings).
  applyKeymap() {
    const saved = this.state && this.state.settings ? this.state.settings.keymap : null;
    if (saved && typeof saved === 'object') {
      const remap = {};
      for (const code of Object.keys(saved)) {
        if (typeof code === 'string' && ACTIONS.includes(saved[code])) remap[code] = saved[code];
      }
      this.input.remap = remap;
    } else {
      this.input.remap = Object.assign({}, KEYMAP);
    }
  }

  // Elevation B3 (S-18): Options -> Controls. Each row shows the codes
  // bound to one action; choosing a row captures the next physical
  // keydown's e.code as that action's primary binding. A code already
  // bound elsewhere SWAPS (the other action takes this action's old
  // primary code). Persists to settings.keymap and applies live.
  openControlsMenu() {
    const g = this;
    const NAMES = {
      up: 'Up', down: 'Down', left: 'Left', right: 'Right',
      a: 'A — confirm', b: 'B — back', start: 'Start — menu', select: 'Select',
      pageup: 'Page up', pagedown: 'Page down',
      slot1: 'RT move 1', slot2: 'RT move 2', slot3: 'RT move 3', slot4: 'RT move 4',
      fullscreen: 'Fullscreen', mute: 'Mute', escape: 'Escape — back',
    };
    const codesFor = (action) => Object.keys(g.input.remap).filter((c) => g.input.remap[c] === action);
    const rows = Object.keys(NAMES).map((action) => ({
      label: NAMES[action] + ': ' + (codesFor(action).join(' / ') || '—'),
      value: action,
    }));
    rows.push({ label: 'Reset defaults', value: 'reset' });
    rows.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('Controls', rows, (v) => {
      if (!v || v === 'back') { g.openOptions(); return; }
      if (v === 'reset') {
        g.input.remap = Object.assign({}, KEYMAP);
        g.state.settings.keymap = null;
        g.saveGame(true);
        g.ui.toast('Controls reset to defaults.');
        g.openControlsMenu();
        return;
      }
      g.captureRemapKey(v, NAMES[v]);
    }, { menuClass: 'syswin', remember: 'options-controls' });
  }

  captureRemapKey(action, name) {
    const g = this;
    g.ui.toast('Press a key for ' + name + ' — Esc cancels');
    if (typeof document === 'undefined' || !document.addEventListener) { g.openControlsMenu(); return; }
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.removeEventListener('keydown', onKey, true);
      if (e.code === 'Escape') { g.openControlsMenu(); return; }
      const remap = Object.assign({}, g.input.remap);
      const primary = Object.keys(KEYMAP).find((c) => KEYMAP[c] === action && remap[c] === action)
        || Object.keys(remap).find((c) => remap[c] === action);
      const other = remap[e.code];
      if (other !== action) {
        if (primary && primary !== e.code) {
          if (other) remap[primary] = other; // conflict: swap primaries
          else delete remap[primary];
        }
        remap[e.code] = action;
      }
      g.input.remap = remap;
      g.state.settings.keymap = Object.assign({}, remap);
      g.saveGame(true);
      g.ui.toast(name + ' is now ' + e.code + '.');
      g.openControlsMenu();
    };
    document.addEventListener('keydown', onKey, true);
  }
}

// Bootstrap (browser). Headless harness imports Game directly.
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');
    const game = new Game(canvas);
    window.__game = game; // __DEBUG__ (stripped from prod bundle by build.mjs)
    game.boot();
  });
}
