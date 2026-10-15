// overworld.mjs — tile-map exploration: interpolated grid movement, tall-grass
// encounters (rustle -> ! -> transition, 900ms per ADR-004), follower partner,
// NPCs, signs, warps, pause menu (Bag/Party/Dex/Save/Options).

import { MAPS, WALKABLE, TRAINERS } from '../data/maps.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { TILE } from '../engine/render.mjs';
import { roll, intIn, pickWeighted } from '../engine/rng.mjs';
import { makeMon, dexRegister, displayName, dexCaughtCount } from './state.mjs';
import { MOVES } from '../data/moves.mjs';
import { SFX } from '../engine/audio.mjs';
import { BattleScene } from './battle.mjs';

const WALK_MS = 200; // ~200ms per walked tile (GD feel note)

export class OverworldScene {
  enter() {
    const g = this.game;
    this.mapId = g.state.story.position.map;
    this.loadMap(this.mapId);
    const p = g.state.story.position;
    this.player = { tx: p.x, ty: p.y, px: p.x * TILE, py: p.y * TILE, dir: p.dir || 'down', moving: false, moveT: 0, fx: p.x, fy: p.y };
    this.trail = []; // partner path history
    this.partner = { px: this.player.px, py: this.player.py, hop: 0 };
    this.enc = null; // encounter sequence state
    this.banner = { text: this.map.name.toUpperCase(), t: 0 };
    this.stepsSinceEncounter = 0;
    this.chainCount = 0;
    this.pausedMenu = false;
    g.ui.setBattleMode(false);
  }

  loadMap(id) {
    this.mapId = id;
    this.map = MAPS[id];
    this.w = this.map.rows[0].length;
    this.h = this.map.rows.length;
  }

  tileAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return ' ';
    return this.map.rows[y][x];
  }

  walkable(x, y) {
    const t = this.tileAt(x, y);
    if (!WALKABLE.has(t)) return false;
    // NPCs block
    for (const n of this.map.npcs) if (n.x === x && n.y === y) return false;
    return true;
  }

  warpAt(x, y) {
    for (const wp of this.map.warps) if (wp.x === x && wp.y === y) return wp;
    return null;
  }

  npcAt(x, y) {
    for (const n of this.map.npcs) if (n.x === x && n.y === y) return n;
    return null;
  }

  signAt(x, y) {
    for (const s of this.map.signs) if (s.x === x && s.y === y) return s;
    return null;
  }

  update(dt) {
    const g = this.game;
    if (g.ui.update(dt)) return; // modal UI consumes input
    if (this.enc) { this.updateEncounter(dt); return; }

    const input = g.input;
    // Pause menu
    if (input.wasPressed('start') || input.wasPressed('escape')) {
      this.openPauseMenu();
      return;
    }
    // Interact
    if (input.wasPressed('a')) {
      if (this.tryInteract()) return;
    }

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
        }
      }
    } else {
      p.moveT += dt * 1000;
      const k = Math.min(1, p.moveT / WALK_MS);
      p.px = (p.fx + (p.tx - p.fx) * k) * TILE;
      p.py = (p.fy + (p.ty - p.fy) * k) * TILE;
      if (k >= 1) {
        p.moving = false;
        p.px = p.tx * TILE; p.py = p.ty * TILE;
        this.trail.push({ x: p.tx, y: p.ty });
        if (this.trail.length > 24) this.trail.shift();
        this.onStep(p.tx, p.ty);
      }
    }
    // Partner follows 1 tile behind with hop
    const tp = this.trail.length >= 2 ? this.trail[this.trail.length - 2] : { x: p.tx, y: p.ty };
    const tpx = tp.x * TILE, tpy = tp.y * TILE;
    this.partner.px += (tpx - this.partner.px) * Math.min(1, dt * 10);
    this.partner.py += (tpy - this.partner.py) * Math.min(1, dt * 10);
    this.partner.hop += dt * 6;

    // Playtime + banner
    g.state.story.playtimeSec = (g.state.story.playtimeSec || 0);
    this.playAcc = (this.playAcc || 0) + dt;
    if (this.playAcc >= 1) { this.playAcc -= 1; g.state.player.playtimeSec++; }
    if (this.banner.t > 0) this.banner.t -= dt;
  }

  onStep(x, y) {
    const g = this.game;
    const wp = this.warpAt(x, y);
    if (wp) {
      const to = wp.to;
      this.loadMap(to.map);
      this.player.tx = to.x; this.player.ty = to.y;
      this.player.px = to.x * TILE; this.player.py = to.y * TILE;
      this.player.fx = to.x; this.player.fy = to.y;
      this.trail = [];
      this.partner.px = this.player.px; this.partner.py = this.player.py;
      g.state.story.position = { map: to.map, x: to.x, y: to.y, dir: this.player.dir };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.state.meta.location = this.map.name;
      g.autosave('area');
      return;
    }
    // Tall grass encounter check (anti-frustration: force after 20 silent steps)
    const t = this.tileAt(x, y);
    if (t === ',' && this.map.encounters && !g.state.story.flags.noEncounters) {
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
    g.audio.playSfx(SFX.encounter);
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
    g.audio.playSfx(SFX.encounter);
  }

  updateEncounter(dt) {
    const g = this.game;
    const e = this.enc;
    e.t += dt * 1000;
    // 3-beat: rustle 200ms -> ! 300ms -> transition 400ms (ADR-004, gameux §6)
    if (e.phase === 'rustle' && e.t >= 200) { e.phase = 'exclaim'; e.t = 0; }
    else if (e.phase === 'exclaim' && e.t >= 300) { e.phase = 'transition'; e.t = 0; g.renderer.flashA = 0.7; }
    else if (e.phase === 'transition' && e.t >= 400) {
      g.renderer.flashA = 0;
      const foe = e.foe;
      this.enc = null;
      dexRegister(g.state.dex, 'seen', SPECIES[foe.speciesId].dexNo);
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, tutorial: !!e.tutorial }));
    }
    if (g.renderer.flashA > 0 && e.phase !== 'transition') {
      g.renderer.flashA = Math.max(0, g.renderer.flashA - dt * 3);
    }
  }

  tryInteract() {
    const g = this.game;
    const p = this.player;
    const dx = p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0;
    const dy = p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0;
    const fx = p.tx + dx, fy = p.ty + dy;
    // Partner interaction (facing Pikachu's tile)
    const ptx = Math.round(this.partner.px / TILE), pty = Math.round(this.partner.py / TILE);
    if (fx === ptx && fy === pty) {
      const moods = { happy: 'is happy! It nuzzles your hand.', curious: 'tilts its head, curious.', sleepy: 'yawns... maybe it needs a rest soon.' };
      g.ui.toast('Pikachu ' + (moods[g.state.pikachu.mood] || moods.happy));
      return true;
    }
    const npc = this.npcAt(fx, fy);
    if (npc) {
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
    const t = TRAINERS[npc.trainer];
    g.ui.say(t.intro, () => {
      g.scenes.push(new BattleScene({ kind: 'trainer', trainer: t, returnTo: this }));
    }, npc.name);
  }

  healParty(announce) {
    const g = this.game;
    for (const m of g.state.party) {
      m.hp = m.maxHp; m.status = null;
      m.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      for (const mv of m.moves) mv.pp = mv.maxPp;
    }
    g.audio.playSfx(SFX.heal);
    if (announce) g.ui.toast('Your Pokemon were healed to full health!');
  }

  openPauseMenu() {
    const g = this.game;
    g.ui.showMenu('MENU', [
      { label: 'Bag', value: 'bag' },
      { label: 'Party', value: 'party' },
      { label: 'Dex', value: 'dex' },
      { label: 'Save', value: 'save' },
      { label: 'Options', value: 'options' },
      { label: 'Account — coming in Track B', value: 'account', disabled: true },
      { label: 'Close', value: 'close' },
    ], (value) => {
      if (value === 'bag') g.openBag();
      else if (value === 'party') g.openParty();
      else if (value === 'dex') g.openDex();
      else if (value === 'save') g.openSave();
      else if (value === 'options') g.openOptions();
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
    // Tiles (viewport-culled)
    const vr = r.viewRect();
    const x0 = Math.max(0, Math.floor(vr.x0 / T)), x1 = Math.min(this.w - 1, Math.ceil(vr.x1 / T));
    const y0 = Math.max(0, Math.floor(vr.y0 / T)), y1 = Math.min(this.h - 1, Math.ceil(vr.y1 / T));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ch = this.map.rows[y][x];
        const kind = g.tileKind(ch);
        r.blit(g.tileCache[kind], x * T, y * T);
      }
    }
    // Encounter rustle effect
    if (this.enc && this.enc.phase === 'rustle') {
      const jx = (this.game.rng.misc() - 0.5) * 3;
      r.blit(g.tileCache.grass, this.player.tx * T + jx, this.player.ty * T);
    }
    // NPCs
    for (const n of this.map.npcs) {
      r.blit(g.npcSprite(n), n.x * T, n.y * T - 4);
    }
    // Partner (hop) + player
    const hop = Math.abs(Math.sin(this.partner.hop)) * 3;
    r.blit(g.spriteCache.partner, Math.round(this.partner.px), Math.round(this.partner.py) - Math.round(hop));
    r.blit(g.playerSprite(this.player.dir, this.player.moving), Math.round(this.player.px), Math.round(this.player.py));
    // "!" exclamation
    if (this.enc && this.enc.phase === 'exclaim') {
      r.text('!', this.player.px + 4, this.player.py - 14, { size: 12, bold: true, color: '#e84040' });
    }
    r.end();
    // HUD overlays (canvas)
    if (this.banner.t > 0) {
      r.text(this.banner.text, 8, 8, { size: 10, bold: true, color: '#fff' });
    }
    const comp = this.areaCompletion();
    if (comp) {
      r.text(this.map.name + ' \u00b7 ' + comp.caught + '/' + comp.total + ' caught', 8, r.viewH - 12, { size: 7, color: '#ffe9a8' });
    }
    // Dex caught counter (honest wording)
    r.text('Dex ' + dexCaughtCount(g.state.dex) + '/' + DEX_TOTAL, r.viewW - 78, 8, { size: 7, color: '#fff' });
  }
}
