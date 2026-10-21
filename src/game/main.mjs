// main.mjs — Game root: owns loop, renderer, input, audio, UI, scenes, save.
// Scene flow: BOOT (legal card) -> TITLE -> INTRO -> OVERWORLD <-> BATTLE.
// Battle/overworld menus (Bag/Party/Dex/Save/Options) live here as UI states.

import { Loop } from '../engine/loop.mjs';
import { Renderer, TILE } from '../engine/render.mjs';
import { Input } from '../engine/input.mjs';
import { AudioEngine } from '../engine/audio.mjs';
import { makeRngStreams } from '../engine/rng.mjs';
import { TILE_CHARS } from '../engine/tiles.mjs';
import { speciesBattleArt, ashFrames, npcFrames, partnerHopFrames, buildArtTileCache, tileSprite } from '../engine/art.mjs';
import { SceneStack } from './scenes.mjs';
import { UI } from './ui.mjs';
import { BootScene, DISCLAIMER_CREDITS } from './title.mjs';
import { IntroScene } from './intro.mjs';
import { OverworldScene } from './overworld.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS, POCKETS, BALLS } from '../data/items.mjs';
import { MAPS } from '../data/maps.mjs';
import { CHAPTERS, BONUS_SHELF, chapterOf } from '../data/story.mjs';
import { displayName, dexCaughtCount, defaultState } from './state.mjs';
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
    this.tileCache = buildArtTileCache(doc); // hand-authored tileset (art.mjs); void -> solid fill
    this.spriteCache = {};
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
    this._partnerHop = partnerHopFrames(doc);
    this.npcCache = {};
  }

  // Overworld Ash: 4-dir walk cycle while moving, 2-frame idle blink at rest.
  playerSprite(p) {
    const frames = this.playerSprites[p.dir] || this.playerSprites.down;
    if (p.moving) {
      const fi = 2 + (Math.floor((p.moveT / 200) * 4) % 4); // 4 walk frames per tile
      return frames[fi];
    }
    return frames[Math.floor(this._animT / 500) % 2]; // idle-1 / idle-2 blink
  }

  npcFrame(npc) {
    if (!this.npcCache[npc.name]) this.npcCache[npc.name] = npcFrames(doc, npc);
    const f = this.npcCache[npc.name];
    return f[Math.floor(this._animT / 600) % 2]; // idle-1 / idle-2
  }

  partnerFrame() {
    if (!this._partnerHop) return this.spriteCache.partner.front;
    return this._partnerHop[Math.floor(this._animT / 280) % 2]; // hop-1 / hop-2
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
      r.resize(256, 256, w, h * 0.45);
      document.body.classList.remove('desktop');
    }
    // P1/K2: landscape gets the right-edge command rail (CSS re-rails the HUD strip).
    document.body.classList.toggle('landscape', this.layoutMode === 'landscape');
    document.body.classList.toggle('flip', !!this.state.settings.controlsFlip);
    // P1/K3 + I2: desktop hint card; show-touch toggle honored on hybrids.
    document.body.classList.toggle('showtouch', !!this.state.settings.showTouch);
    // Headless harness stubs document without documentElement — guard it.
    if (document.documentElement) document.documentElement.style.setProperty('--hudscale', this.state.settings.hudScale || 1);
    this.ui.showHintCard(this.layoutMode === 'desktop');
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
      if (res.load === 'state' && res.state) {
        this.state = res.state;
        this.audio.applySettings(this.state.settings);
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
    this.state = freshState();
    if (keepSettings) this.state.settings = keepSettings;
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
    this.scenes.replace(new OverworldScene());
    this.ui.toast('Welcome back, ' + this.state.player.name + '!');
  }

  startOverworld(opts) {
    this.scenes.replace(new OverworldScene());
    if (this.guestMode) this.ui.showGuestBanner(); // P0/B1: in-game guest banner
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
    // P1/G4: pocket tabs as group headers (44px rows, description in the label).
    for (const pocket of POCKETS) {
      const inPocket = Object.keys(ITEMS).filter((id) => ITEMS[id].pocket === pocket && (g.state.bag[id] || 0) > 0);
      if (!inPocket.length) continue;
      items.push({ label: '— ' + pocket + ' —', value: null, disabled: true });
      for (const id of inPocket) {
        const hint = id === 'potion' ? ' (heals 20 HP — uses your turn in battle)' : '';
        items.push({ label: ITEMS[id].name + ' x' + g.state.bag[id] + hint, value: id });
      }
    }
    if (!items.length) items.push({ label: '(empty)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Bag', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'potion') {
        const targets = g.state.party.map((m, i) => ({
          label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i,
          disabled: m.hp <= 0 || m.hp >= m.maxHp,
        }));
        targets.push({ label: 'Back', value: -1 });
        g.ui.showMenu('Use Potion on...', targets, (t) => {
          if (t === null || t === -1) { g.openBag(); return; }
          const m = g.state.party[t];
          g.state.bag.potion--;
          m.hp = Math.min(m.maxHp, m.hp + 20);
          g.audio.playSfx('heal');
          g.ui.toast(displayName(m, SPECIES) + ' recovered 20 HP!');
        });
      } else if (g.useBagItem) {
        g.useBagItem(v); // WS9: full item-use system (main-systems.mjs)
      }
    });
  }

  openParty() {
    const g = this;
    // P1/G1: rows carry an HP mini-bar + numbers, status chip, and the ⚡ partner badge.
    const rowHtml = (it) => {
      if (it.value === 'close' || it.value === -1) return '<span>' + it.label + '</span>';
      const m = g.state.party[it.value];
      const pct = Math.max(0, Math.round((m.hp / m.maxHp) * 100));
      const col = pct > 50 ? '#58c94f' : pct > 25 ? '#e8c832' : '#e84040';
      const badge = m.speciesId === 'partner' ? '<span class="pbadge">⚡</span>' : '';
      const st = m.status ? '<span class="pstat">' + m.status.toUpperCase().slice(0, 3) + '</span>' : '';
      return '<span><b>' + displayName(m, SPECIES) + '</b> Lv' + m.level + badge + '</span>'
        + '<span class="phpbar"><i style="width:' + pct + '%;background:' + col + '"></i></span>'
        + '<span>' + m.hp + '/' + m.maxHp + '</span>' + st;
    };
    const items = g.state.party.map((m, i) => {
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + '  ' + m.hp + '/' + m.maxHp, value: i };
    });
    for (let i = g.state.party.length; i < 6; i++) items.push({ label: '—', value: -1, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Party', items, (v) => {
      if (v === null || v === 'close' || v === -1) return;
      const m = g.state.party[v];
      const sp = SPECIES[m.speciesId];
      const fieldMoves = (m.moves || []).filter((x) => ['cut', 'fly', 'surf', 'strength', 'flash'].includes(x.id));
      const rows = [{ label: 'Summary', value: 'summary' }];
      if (fieldMoves.length) rows.push({ label: 'Field moves', value: 'field' });
      rows.push({ label: 'Close', value: 'close' });
      g.ui.showMenu(displayName(m, SPECIES), rows, (a) => {
        if (a === 'field' && g.openFieldMove) { g.openFieldMove(m); return; }
        if (a === 'summary') {
          const mv = m.moves.map((mm) => MOVES[mm.id].name + ' ' + mm.pp + '/' + mm.maxPp).join(', ');
          g.ui.say([
            displayName(m, SPECIES) + '  Lv' + m.level + '  HP ' + m.hp + '/' + m.maxHp,
            'ATK ' + m.stats.atk + '  DEF ' + m.stats.def + '  SPA ' + m.stats.spa + '  SPD ' + m.stats.spd + '  SPE ' + m.stats.spe,
            'Moves: ' + mv,
            'OT: ' + m.ot + '  No. ' + sp.dexNo,
            sp.flavor,
          ], null, 'Summary');
        }
      });
    }, { rowHtml });
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
    const items = Object.keys(SPECIES).filter((id) => id !== 'partner' && matchSpecies(id)).map((id) => {
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
    // D2: arc progression surfaced in the Dex — current chapter header row.
    const curCh = chapterOf((g.state.story.chapter || 0) + 1);
    items.unshift({ label: 'Journey — Ch.' + curCh.n + ' · ' + curCh.title, value: null, disabled: true });
    if (!items.length) items.push({ label: '(no matches)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Pokedex', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'rating') { g.ui.say([g.oakRating()], () => g.openDex(filter), 'Prof. Hawthorn'); return; }
      if (v === 'filter') { g.openDexFilter(filter); return; }
      if (v === 'areas') { g.openDexAreas(); return; }
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(filter); return; }
      g.ui.say([
        'No.' + sp.dexNo + '  ' + sp.name + '  ' + sp.types.join('/'),
        sp.flavor,
        'Status: ' + (c ? 'CAUGHT' : 'SEEN'),
      ], () => g.openDex(filter), 'Dex');
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
      const titems = [{ label: 'All types', value: null }].concat(types.map((t) => ({ label: t, value: t })));
      titems.push({ label: 'Back', value: 'back' });
      g.ui.showMenu('Filter: type', titems, (tp) => {
        if (tp === 'back' || tp === null) { g.openDex(filter); return; }
        const f3 = Object.assign({}, f2, { type: tp });
        g.ui.showNameEntry('Search the Dex (blank = all)', '', 8, (q) => {
          f3.q = q || null;
          g.openDex(f3);
        });
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
    items.push({ label: '— ACT I: THE BEGINNING (v1) —', value: null, disabled: true });
    for (const ch of CHAPTERS) {
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
    items.push({ label: '— BONUS SHELF (non-canon, not on the spine) —', value: null, disabled: true });
    for (const b of BONUS_SHELF) {
      items.push({ label: b, value: null, disabled: true });
    }
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Journey', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'quests') { g.openQuestLog(); return; }
      if (v === 'regions') { g.openRegions(); return; }
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
  openDexAreas() {
    const g = this;
    const items = Object.keys(MAPS).filter((id) => MAPS[id].encounters).map((id) => {
      const map = MAPS[id];
      const species = [...new Set(map.encounters.table.map((e) => e.species))];
      const n = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
      return { label: map.name + ' — ' + n + '/' + species.length + ' caught', value: id };
    });
    items.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('Dex — Areas', items, (v) => {
      if (!v || v === 'back') { g.openDex(); return; }
      const map = MAPS[v];
      const rows = map.encounters.table.map((e) => {
        const sp = SPECIES[e.species];
        const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
        return { label: (c || s ? sp.name : '???') + '  Lv' + e.min + '-' + e.max + (c ? ' [CAUGHT]' : s ? ' [SEEN]' : ''), value: null, disabled: true };
      });
      rows.push({ label: 'Back', value: 'back' });
      g.ui.showMenu(map.name, rows, () => g.openDexAreas());
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
    g.ui.showMenu('Save', [
      { label: g.state.meta.location + ' · ' + mins + 'm · ' + badges + ' badges · Dex ' + caught, value: null, disabled: true },
      { label: 'Last saved: ' + when, value: null, disabled: true },
      { label: 'Sync: guest-local (Track B: cloud)', value: null, disabled: true },
      { label: 'Save now', value: 'save' },
      { label: 'Close', value: 'close' },
    ], (v) => {
      if (v === 'save') g.saveGame(false);
    });
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
        label: (s.active ? '▸ ' : '') + 'Slot ' + s.slot + ' — ' + h + 'h ' + (m < 10 ? '0' + m : '' + m) +
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
    });
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
      { label: 'Screen shake: ' + yn(s.shake), value: 'shake' },
      { label: 'Vibration: ' + yn(s.vibration), value: 'vib' },
      { label: 'Autosave: ' + yn(s.autosave), value: 'asave' },
      { label: 'Reduced motion: ' + yn(s.reducedMotion), value: 'rmotion' },
      { label: 'Flip controls: ' + yn(s.controlsFlip), value: 'flip' },
      { label: 'Show touch controls: ' + yn(s.showTouch), value: 'showtouch' },
      { label: 'HUD scale: ' + Math.round(s.hudScale * 100) + '%', value: 'hudscale' },
      { label: 'Legal / credits', value: 'legal' },
    ];
    // Track B: account surface (wireframes §10). Labels are static — the
    // username itself is only ever rendered via textContent (AppSec C12).
    if (g.authUser) {
      rows.push({ label: 'Account', value: 'account' });
      rows.push({ label: 'Sync now', value: 'syncnow' });
    } else if (typeof AUTH_ENABLED !== 'undefined' && AUTH_ENABLED) {
      rows.push({ label: 'Log in to sync ★', value: 'login' });
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
      else if (v === 'shake') s.shake = !s.shake;
      else if (v === 'vib') s.vibration = !s.vibration;
      else if (v === 'asave') s.autosave = !s.autosave;
      else if (v === 'rmotion') { s.reducedMotion = !s.reducedMotion; g.audio.setReducedMotion(s.reducedMotion); }
      else if (v === 'flip') { s.controlsFlip = !s.controlsFlip; g.applyLayout(); }
      else if (v === 'showtouch') {
        s.showTouch = !s.showTouch;
        if (typeof document !== 'undefined') document.body.classList.toggle('showtouch', !!s.showTouch);
      }
      else if (v === 'hudscale') {
        // P1/I2: HUD scale row (the setting existed with no UI).
        s.hudScale = s.hudScale >= 1.5 ? 1 : Math.round((s.hudScale + 0.25) * 100) / 100;
        if (typeof document !== 'undefined') document.documentElement.style.setProperty('--hudscale', s.hudScale);
      }
      else if (v === 'legal') { g.ui.say(DISCLAIMER_CREDITS, null, ''); return; }
      else if (v === 'account') { AUTH.openAccountMenu(g); return; }
      else if (v === 'syncnow') { SYNC.syncNow(g, true); return; }
      else if (v === 'login') { g.openLogin('continue'); return; }
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
                  if (typed === 'DELETE') {
                    g.store.erase();
                    g.ui.toast('Save data erased.');
                  } else {
                    g.ui.toast('Erase cancelled.');
                  }
                });
              }
            });
          }
        });
        return;
      } else return;
      g.saveGame(true);
      g.openOptions();
    });
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
