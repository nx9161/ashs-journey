// main.mjs — Game root: owns loop, renderer, input, audio, UI, scenes, save.
// Scene flow: BOOT (legal card) -> TITLE -> INTRO -> OVERWORLD <-> BATTLE.
// Battle/overworld menus (Bag/Party/Dex/Save/Options) live here as UI states.

import { Loop } from '../engine/loop.mjs';
import { Renderer, TILE } from '../engine/render.mjs';
import { Input } from '../engine/input.mjs';
import { AudioEngine } from '../engine/audio.mjs';
import { makeRngStreams } from '../engine/rng.mjs';
import { buildTileCache, TILE_CHARS } from '../engine/tiles.mjs';
import { forgeSprite, forgeHumanoid } from '../engine/sprites.mjs';
import { SceneStack } from './scenes.mjs';
import { UI } from './ui.mjs';
import { BootScene, DISCLAIMER_CREDITS } from './title.mjs';
import { IntroScene } from './intro.mjs';
import { OverworldScene } from './overworld.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS, POCKETS, BALLS } from '../data/items.mjs';
import { displayName, dexCaughtCount, defaultState } from './state.mjs';
import { SaveStore, freshState } from '../save/store.mjs';
import { SFX } from '../engine/audio.mjs';

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
    this.rng = makeRngStreams((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.tileCache = buildTileCache(doc);
    this.spriteCache = {};
    this.npcCache = {};
    this.skipIntroVeteran = false;
    this._lastAutosave = 0;
    this.layoutMode = 'portrait';
  }

  tileKind(ch) { return TILE_CHARS[ch] || 'void'; }

  buildSprites() {
    for (const id of Object.keys(SPECIES)) {
      this.spriteCache[id] = forgeSprite(doc, SPECIES[id], 48);
    }
    this.playerSprites = {
      down: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
      up: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
      left: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
      right: forgeHumanoid(doc, { shirt: '#d84a3a', pants: '#3a5a9a', hair: '#1a1a1a' }),
    };
  }

  playerSprite(dir, moving) { return this.playerSprites[dir] || this.playerSprites.down; }

  npcSprite(npc) {
    if (!this.npcCache[npc.name]) {
      this.npcCache[npc.name] = forgeHumanoid(doc, npc);
    }
    return this.npcCache[npc.name];
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
    this.input.bindKeyboard();
    this.buildSprites();
    this.applyLayout();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('resize', () => this.applyLayout());
    }
    this.loop.onAutosave = () => this.saveGame(true);
    this.loop.bindVisibility(() => { /* sim halts via rAF freeze; autosave queued above */ });
    this.audio.setMuted(false);
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
    if (fine && w >= 700) {
      this.layoutMode = 'desktop';
      r.resize(384, 216, Math.min(1120, w * 0.9), Math.min(630, h * 0.62));
      document.body.classList.add('desktop');
    } else if (w > h) {
      this.layoutMode = 'landscape';
      r.resize(256, 192, w * 0.72, h);
      document.body.classList.remove('desktop');
    } else {
      this.layoutMode = 'portrait';
      r.resize(256, 256, w, h * 0.45);
      document.body.classList.remove('desktop');
    }
    document.body.classList.toggle('flip', !!this.state.settings.controlsFlip);
  }

  update(dt) {
    this.ui.update(dt);
    this.scenes.update(dt);
  }

  render(alpha) {
    this.scenes.render(this.renderer, alpha);
  }

  // ---- game flow ----
  newGame() {
    this.state = freshState();
    this.state.player.name = 'ASH';
    this.rng = makeRngStreams((Date.now() ^ (Math.random() * 1e9)) >>> 0);
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
    this.audio.setMuted(!!this.state.settings.mute);
    this.scenes.replace(new OverworldScene());
    this.ui.toast('Welcome back, ' + this.state.player.name + '!');
  }

  startOverworld() {
    this.scenes.replace(new OverworldScene());
  }

  saveGame(quiet) {
    const res = this.store.save(this.state);
    if (!quiet || !res.ok) {
      if (res.ok) this.ui.toast('Game saved. (' + Math.round(res.bytes / 1024) + ' KB)');
      else this.ui.toast('Save failed: ' + res.reason);
    }
    return res;
  }

  autosave(reason) {
    const now = Date.now();
    if (now - this._lastAutosave < 5000) return; // 5s throttle floor
    this._lastAutosave = now;
    this.saveGame(true);
  }

  // ---- menus (UI states, no scene reload) ----
  openBag() {
    const g = this;
    const items = [];
    for (const pocket of POCKETS) {
      const inPocket = Object.keys(ITEMS).filter((id) => ITEMS[id].pocket === pocket && (g.state.bag[id] || 0) > 0);
      for (const id of inPocket) {
        items.push({ label: ITEMS[id].name + ' x' + g.state.bag[id], value: id });
      }
    }
    if (!items.length) items.push({ label: '(empty)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Bag', items, (v) => {
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
          g.audio.playSfx(SFX.heal);
          g.ui.toast(displayName(m, SPECIES) + ' recovered 20 HP!');
        });
      }
    });
  }

  openParty() {
    const g = this;
    const items = g.state.party.map((m, i) => {
      const sp = SPECIES[m.speciesId];
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + '  ' + m.hp + '/' + m.maxHp, value: i };
    });
    for (let i = g.state.party.length; i < 6; i++) items.push({ label: '—', value: -1, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Party', items, (v) => {
      if (v === null || v === 'close' || v === -1) return;
      const m = g.state.party[v];
      const sp = SPECIES[m.speciesId];
      g.ui.showMenu(displayName(m, SPECIES), [
        { label: 'Summary', value: 'summary' },
        { label: 'Close', value: 'close' },
      ], (a) => {
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
    });
  }

  openDex() {
    const g = this;
    const caught = dexCaughtCount(g.state.dex);
    const items = Object.keys(SPECIES).filter((id) => id !== 'partner').map((id) => {
      const sp = SPECIES[id];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      const mark = c ? '[CAUGHT]' : (s ? '[SEEN]' : '[???]');
      return { label: 'No.' + sp.dexNo + ' ' + (c || s ? sp.name : '???') + ' ' + mark, value: id };
    });
    items.unshift({ label: 'Caught ' + caught + ' / ' + DEX_TOTAL + ' (tracked)', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Pokedex', items, (v) => {
      if (!v || v === 'close') return;
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(); return; }
      g.ui.say([
        'No.' + sp.dexNo + '  ' + sp.name + '  ' + sp.types.join('/'),
        sp.flavor,
        'Status: ' + (c ? 'CAUGHT' : 'SEEN'),
      ], () => g.openDex(), 'Dex');
    });
  }

  openSave() {
    const g = this;
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

  openOptions() {
    const g = this;
    const s = g.state.settings;
    const yn = (b) => b ? 'ON' : 'OFF';
    g.ui.showMenu('Options', [
      { label: 'Text speed: ' + s.textSpeed, value: 'text' },
      { label: 'Mute: ' + yn(s.mute), value: 'mute' },
      { label: 'Battle animations: ' + yn(s.battleAnims), value: 'banim' },
      { label: 'Screen shake: ' + yn(s.shake), value: 'shake' },
      { label: 'Reduced motion: ' + yn(s.reducedMotion), value: 'rmotion' },
      { label: 'Flip controls: ' + yn(s.controlsFlip), value: 'flip' },
      { label: 'Legal / credits', value: 'legal' },
      { label: 'Erase save', value: 'erase' },
      { label: 'Close', value: 'close' },
    ], (v) => {
      if (v === 'text') {
        const order = ['slow', 'normal', 'fast', 'instant'];
        s.textSpeed = order[(order.indexOf(s.textSpeed) + 1) % order.length];
      } else if (v === 'mute') { s.mute = !s.mute; g.audio.setMuted(s.mute); }
      else if (v === 'banim') s.battleAnims = !s.battleAnims;
      else if (v === 'shake') s.shake = !s.shake;
      else if (v === 'rmotion') s.reducedMotion = !s.reducedMotion;
      else if (v === 'flip') { s.controlsFlip = !s.controlsFlip; g.applyLayout(); }
      else if (v === 'legal') { g.ui.say(DISCLAIMER_CREDITS, null, ''); return; }
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
                g.store.erase();
                g.ui.toast('Save data erased.');
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
