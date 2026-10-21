// overworld-systems.mjs — the campaign + parity systems layer (WS6/WS9):
// story event interpreter + quest log state, item balls + hidden items,
// field moves (Cut/Surf/Strength/Flash/Fly), fishing, poison walk damage,
// Safari Zone session, Game Corner slots + prizes, PC boxes, marts, NPC
// trades/gifts/revival/ferry, evolution execution, blackout handling.
// Attached to OverworldScene.prototype; overworld.mjs calls the sys* hooks.

import { MAPS, TRAINERS, WALKABLE } from '../data/maps.mjs';
import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS } from '../data/items.mjs';
import { TILE } from '../engine/render.mjs';
import { roll, intIn, pickWeighted } from '../engine/rng.mjs';
import { makeMon, dexRegister, displayName, evolutionCheck, boxCheck } from './state.mjs';
import { BattleScene } from './battle.mjs';
import { EVENTS, QUESTS, LEGENDARY_ARCS, CREDITS_LINES } from '../data/story-kanto.mjs';
import { CHAPTERS } from '../data/story.mjs';
import { statValue, hpValue } from '../engine/formulas.mjs';

const BOX_COUNT = 12;
const BOX_CAP = 20;
const FOSSIL_OF = { helixfossil: 'omanyte', domefossil: 'kabuto', oldamber: 'aerodactyl' };

function key(x, y) { return x + ',' + y; }
function rtOf(game) { return game.state.settings.battleStyle !== 'classic'; }

Object.assign(OverworldScene.prototype, {
  // ---------- map lifecycle ----------
  sysLoadMap(id) {
    const g = this.game;
    this.fxState = {
      cut: new Set(),           // cut trees (regrow on map re-entry, as the original)
      boulders: new Map(),      // 'x,y' -> {x,y} current boulder positions
      strengthOn: false,
      flashLit: false,
    };
    if (this.map) {
      for (let y = 0; y < this.map.rows.length; y++) {
        for (let x = 0; x < this.map.rows[y].length; x++) {
          if (this.map.rows[y][x] === 'B') this.fxState.boulders.set(key(x, y), { x, y });
        }
      }
      if (this.map.centerCity) g.state.story.flags['visited_' + id] = true;
    }
    if (g.state.story.flags['in_' + id] === undefined) g.state.story.flags['in_' + id] = true;
    g.state.story.flags['reached_' + id] = true; // quest chain producers (WS6)
  },

  boulderAt(x, y) {
    if (!this.fxState) return null;
    for (const b of this.fxState.boulders.values()) if (b.x === x && b.y === y) return b;
    return null;
  },

  sysWalkableExtra(x, y) {
    // Called from walkable(): tiles the base set rejects but systems allow.
    const t = this.tileAt(x, y);
    if (t === 'T' && this.fxState && this.fxState.cut.has(key(x, y))) return true;
    if ((t === '~' || t === 'W') && this.surfing) return true;
    return false;
  },

  moveMs() {
    if (this.surfing) return 170;
    if (this.riding) return 105;
    return 200;
  },

  // ---------- per-step systems ----------
  sysOnStep(x, y) {
    const g = this.game;
    const t = this.tileAt(x, y);
    // Landing on shore ends surfing.
    if (this.surfing && t !== '~' && t !== 'W') this.surfing = false;
    // Safari session step budget.
    const saf = g.state.session.safari;
    if (saf) {
      saf.steps--;
      if (saf.steps <= 0) { this.endSafari('Your safari time is up!'); return true; }
      if (saf.steps === 50) g.ui.toast('Safari: 50 steps left!');
    }
    // Poison walk damage: every 4 steps, 1 HP per poisoned mon (original).
    this.poisonSteps = (this.poisonSteps || 0) + 1;
    if (this.poisonSteps >= 4) {
      this.poisonSteps = 0;
      let anyAlive = false;
      for (const m of g.state.party) {
        if (m.hp > 0 && (m.status === 'poison' || m.status === 'badlyPoisoned')) m.hp = Math.max(1, m.hp - 1);
        if (m.hp > 0) anyAlive = true;
      }
      if (!anyAlive && g.state.party.length) { this.blackout(); return true; }
      const hurt = g.state.party.find((m) => (m.status === 'poison' || m.status === 'badlyPoisoned') && m.hp > 0);
      if (hurt) g.ui.toast(displayName(hurt, SPECIES) + ' is hurt by poison...');
    }
    // Water + cave encounters (grass handled by the base onStep).
    if (this.sysEncounterStep(x, y, t)) return true;
    // Story event tiles.
    if (this.map.events) {
      for (const ev of this.map.events) {
        if (ev.x === x && ev.y === y && this.eventWhen(ev.when)) {
          this.runEvent(ev.id);
          return true;
        }
      }
    }
    return false;
  },

  sysEncounterStep(x, y, t) {
    const g = this.game;
    const enc = this.map.encounters;
    if (!enc || g.state.story.flags.noEncounters) return false;
    const saf = g.state.session.safari;
    let table = null, rate = 0;
    if (saf && this.mapId === 'safari' && t === ',') { table = enc.table; rate = enc.rate; }
    else if (this.surfing && (t === '~' || t === 'W') && enc.water) { table = enc.water; rate = enc.waterRate || 0.08; }
    else if (enc.cave && (t === '.' || t === 'R')) { table = enc.table; rate = enc.rate; }
    if (!table) return false;
    if (!roll(rate, g.rng.encounter)) return false;
    const spId = pickWeighted(table.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = table.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    const foe = makeMon(spId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'seen', SPECIES[spId].dexNo);
    g.audio.stopMusic();
    g.audio.encounter();
    if (saf) {
      g.scenes.push(new BattleScene({
        kind: 'wild', foe, returnTo: this, safari: true,
        onSafariAction: () => { const s = g.state.session.safari; if (s) { s.steps -= 5; } },
      }));
    } else {
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, rt: rtOf(g) }));
    }
    return true;
  },

  // ---------- story events ----------
  eventWhen(when) {
    if (!when) return true;
    const g = this.game;
    const f = g.state.story.flags;
    if (when.flagNot && f[when.flagNot]) return false;
    if (when.flag && !f[when.flag]) return false;
    if (when.flagAny && !when.flagAny.some((k) => f[k])) return false;
    if (when.badgesAtLeast !== undefined && g.state.badges.kanto.length < when.badgesAtLeast) return false;
    if (when.badgesBelow !== undefined && g.state.badges.kanto.length >= when.badgesBelow) return false;
    if (when.bagHas && !(g.state.bag[when.bagHas] > 0)) return false;
    if (when.noBag && g.state.bag[when.noBag] > 0) return false;
    if (when.teach && !this.partyKnows(when.teach)) return false;
    return true;
  },

  partyKnows(moveId) {
    return this.game.state.party.some((m) => m.moves.some((mv) => mv.id === moveId));
  },
  partyHasType(type) {
    return this.game.state.party.some((m) => m.hp > 0 && SPECIES[m.speciesId].types.includes(type));
  },

  runEvent(id) {
    const steps = EVENTS[id];
    if (!steps) return;
    const g = this.game;
    // Completion flag convention (the placements gate on it):
    // ev_e4_1 -> ev_e4_1_done; bare ids -> ev_<id>_done.
    const doneFlag = id.startsWith('ev_') ? id + '_done' : 'ev_' + id + '_done';
    this.runSteps(steps, 0, () => { g.state.story.flags[doneFlag] = true; });
  },

  runSteps(steps, i, done) {
    const g = this.game;
    if (i >= steps.length) { if (done) done(); return; }
    const s = steps[i];
    const next = () => this.runSteps(steps, i + 1, done);
    if (s.say) { g.ui.say(s.say, next, s.who || ''); return; }
    if (s.toast) { g.ui.toast(s.toast); next(); return; }
    if (s.flag) { g.state.story.flags[s.flag] = true; next(); return; }
    if (s.quest) { g.state.story.quests[s.quest] = 'active'; next(); return; }
    if (s.questDone) { g.state.story.quests[s.questDone] = 'complete'; next(); return; }
    if (s.arc) { g.state.story.quests[s.arc] = s.stage; next(); return; }
    if (s.heal) { this.healParty(false); g.ui.toast('The party was healed!'); next(); return; }
    if (s.give) {
      for (const item of Object.keys(s.give.items || {})) {
        g.state.bag[item] = (g.state.bag[item] || 0) + s.give.items[item];
      }
      if (s.give.text) g.ui.toast(s.give.text);
      next(); return;
    }
    if (s.giveMon) { this.giftMon(s.giveMon.species, s.giveMon.level, next); return; }
    if (s.chapterCard !== undefined) {
      const ch = CHAPTERS[s.chapterCard];
      if (ch && g.ui.showChapterCard) g.ui.showChapterCard(ch);
      next(); return;
    }
    if (s.warp) {
      this.loadMap(s.warp.map);
      this.player.tx = s.warp.x; this.player.ty = s.warp.y;
      this.player.px = s.warp.x * TILE; this.player.py = s.warp.y * TILE;
      this.player.fx = s.warp.x; this.player.fy = s.warp.y;
      this.trail = [];
      g.state.story.position = { map: s.warp.map, x: s.warp.x, y: s.warp.y, dir: this.player.dir };
      this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
      g.audio.playMusic(this.map.music || 'route1-theme');
      next(); return;
    }
    if (s.battle) {
      const t = TRAINERS[s.battle];
      if (!t) { next(); return; }
      g.scenes.push(new BattleScene({
        kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
        onEnd: (won) => { if (won) next(); },
      }));
      return;
    }
    if (s.wildBattle) {
      const wb = s.wildBattle;
      const foe = makeMon(wb.species, wb.level, SPECIES, MOVES);
      dexRegister(g.state.dex, 'seen', SPECIES[wb.species].dexNo);
      g.scenes.push(new BattleScene({
        kind: 'wild', foe, returnTo: this, rt: rtOf(g),
        uncatchable: !!wb.uncatchable, legendary: !!wb.legendary,
        onEnd: (won) => { if (won) next(); },
      }));
      return;
    }
    if (s.ending) { this.runEnding(next); return; }
    next();
  },

  runEnding(done) {
    const g = this.game;
    // Hall of Fame registration: the winning team is recorded forever.
    const hof = g.state.story.hof || (g.state.story.hof = []);
    hof.push({
      team: g.state.party.map((m) => ({ speciesId: m.speciesId, level: m.level, nickname: m.nickname })),
      badges: g.state.badges.kanto.length,
    });
    g.state.story.flags.champion = true;
    g.ui.say(CREDITS_LINES.slice(), () => { if (done) done(); }, '');
  },

  giftMon(speciesId, level, next) {
    const g = this.game;
    const mon = makeMon(speciesId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'caught', SPECIES[speciesId].dexNo);
    if (g.state.party.length < 6) g.state.party.push(mon);
    else {
      const boxId = g.state.currentBox || 'box1';
      const box = g.state.boxes[boxId] || (g.state.boxes[boxId] = []);
      box.push(mon);
    }
    g.audio.playSfx('dex-register');
    g.ui.toast('Received ' + SPECIES[speciesId].name + '!');
    if (next) next();
  },

  // ---------- interaction systems ----------
  sysInteract(fx, fy) {
    const g = this.game;
    const t = this.tileAt(fx, fy);
    // Item balls.
    if (this.map.items) {
      for (const b of this.map.items) {
        if (b.x === fx && b.y === fy) {
          const flag = 'item_' + this.mapId + '_' + fx + '_' + fy;
          if (g.state.story.flags[flag]) { g.ui.say(['There is nothing here.']); return true; }
          // Mt. Moon fossil pair: taking one seals the other (original beat).
          if ((b.item === 'helixfossil' || b.item === 'domefossil') && g.state.story.flags.fossil_taken) {
            g.ui.say(['Only crumbled stone remains. You chose your fossil already.']);
            return true;
          }
          g.state.story.flags[flag] = true;
          if (b.item === 'helixfossil' || b.item === 'domefossil') g.state.story.flags.fossil_taken = true;
          g.state.bag[b.item] = (g.state.bag[b.item] || 0) + (b.n || 1);
          g.audio.playSfx('dex-register');
          g.ui.say(['Found ' + (ITEMS[b.item] ? ITEMS[b.item].name : b.item) + '!']);
          return true;
        }
      }
    }
    // Hidden items (face the exact tile).
    if (this.map.hidden) {
      for (const hb of this.map.hidden) {
        if (hb.x === fx && hb.y === fy) {
          const flag = 'hidden_' + this.mapId + '_' + fx + '_' + fy;
          if (!g.state.story.flags[flag]) {
            g.state.story.flags[flag] = true;
            g.state.bag[hb.item] = (g.state.bag[hb.item] || 0) + (hb.n || 1);
            g.audio.playSfx('dex-register');
            g.ui.say(['Found a hidden ' + (ITEMS[hb.item] ? ITEMS[hb.item].name : hb.item) + '!']);
            return true;
          }
        }
      }
    }
    // Cut tree.
    if (t === 'T') {
      if (this.fxState.cut.has(key(fx, fy))) return false;
      if (this.partyKnows('cut') && g.state.badges.kanto.includes('cascadebadge')) {
        this.fxState.cut.add(key(fx, fy));
        g.audio.playSfx('map-enter');
        g.ui.say(['The tree was cut down!']);
      } else if (this.partyKnows('cut')) {
        g.ui.say(['A cuttable tree. The Cascade Badge is needed to use CUT out here.']);
      } else {
        g.ui.say(['A small tree blocks the way. It looks cuttable.']);
      }
      return true;
    }
    // Boulder: activate Strength.
    if (this.boulderAt(fx, fy)) {
      if (this.partyKnows('strength') && g.state.badges.kanto.includes('rainbowbadge')) {
        this.fxState.strengthOn = true;
        g.ui.say(['Strength made it possible to move boulders!']);
      } else {
        g.ui.say(['A huge boulder. It would take real STRENGTH to budge it.']);
      }
      return true;
    }
    // Water: Surf or fish.
    if (t === '~' || t === 'W') {
      if (!this.surfing) {
        if (this.partyKnows('surf') && g.state.badges.kanto.includes('soulbadge')) {
          g.ui.showMenu('The water is a deep blue... Surf?', [
            { label: 'Surf', value: 'surf' }, { label: 'Fish', value: 'fish' }, { label: 'Not now', value: 'no' },
          ], (v) => {
            if (v === 'surf') this.startSurf(fx, fy);
            else if (v === 'fish') this.startFishing();
          });
          return true;
        }
        this.startFishing();
        return true;
      }
      return false;
    }
    // Itemfinder hint on an empty interact.
    if ((g.state.bag.itemfinder || 0) > 0 && this.map.hidden) {
      for (const hb of this.map.hidden) {
        const flag = 'hidden_' + this.mapId + '_' + hb.x + '_' + hb.y;
        if (!g.state.story.flags[flag] && Math.abs(hb.x - fx) + Math.abs(hb.y - fy) <= 2) {
          g.ui.toast('The Itemfinder is reacting...');
          break;
        }
      }
    }
    return false;
  },

  startSurf(fx, fy) {
    const p = this.player;
    this.surfing = true;
    p.fx = p.tx; p.fy = p.ty;
    p.tx = fx; p.ty = fy;
    p.moving = true; p.moveT = 0;
    this.game.audio.playSfx('map-enter');
  },

  startFishing() {
    const g = this.game;
    const rod = (g.state.bag.superrod > 0) ? 'super' : (g.state.bag.goodrod > 0) ? 'good' : (g.state.bag.oldrod > 0) ? 'old' : null;
    if (!rod) { g.ui.say(['The water glitters. If only you had a fishing rod...']); return; }
    const fish = this.map.encounters && this.map.encounters.fish && this.map.encounters.fish[rod];
    g.audio.playSfx('menu-move');
    if (!fish || !roll(0.55, g.rng.encounter)) { g.ui.say(['...Not even a nibble.']); return; }
    const spId = pickWeighted(fish.map((e) => [e.weight, e.species]), g.rng.encounter);
    const entry = fish.find((e) => e.species === spId);
    const level = intIn(entry.min, entry.max, g.rng.encounter);
    const foe = makeMon(spId, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'seen', SPECIES[spId].dexNo);
    g.ui.say(['Oh! A bite!'], () => {
      g.audio.stopMusic();
      g.audio.encounter();
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, rt: rtOf(g) }));
    });
  },

  sysSelect() {
    const g = this.game;
    if ((g.state.bag.bicycle || 0) > 0 && !this.map.indoor) {
      this.riding = !this.riding;
      g.ui.toast(this.riding ? 'Got on the bicycle!' : 'Got off the bicycle.');
      g.audio.playSfx('menu-move');
      return true;
    }
    return false;
  },

  // ---------- NPC systems ----------
  sysNpc(npc) {
    const g = this.game;
    const sayLines = (cb) => g.ui.say(npc.dialogue.map((l) => l.replace('{player}', g.state.player.name)), cb, npc.name);
    if (npc.event) {
      if (!g.state.story.flags['evdone_' + npc.event]) {
        g.state.story.flags['evdone_' + npc.event] = true;
        this.runEvent(npc.event);
      } else sayLines(null);
      return true;
    }
    if (npc.pc) { sayLines(() => this.openPc()); return true; }
    if (npc.mart) { sayLines(() => this.openMart(npc.mart.stock || [])); return true; }
    if (npc.slots) { sayLines(() => this.openSlots()); return true; }
    if (npc.prize) {
      sayLines(() => {
        const cost = npc.prize.coins;
        const coins = g.state.bag.coin || 0;
        g.ui.showMenu(SPECIES[npc.prize.species].name + ' — ' + cost + ' coins (you have ' + coins + ')', [
          { label: 'Exchange', value: 'yes', disabled: coins < cost },
          { label: 'Not now', value: 'no' },
        ], (v) => { if (v === 'yes') { g.state.bag.coin -= cost; this.giftMon(npc.prize.species, npc.prize.level || 15, null); } });
      });
      return true;
    }
    if (npc.trade) {
      sayLines(() => {
        const have = g.state.party.find((m) => m.speciesId === npc.trade.give);
        g.ui.showMenu('Trade your ' + SPECIES[npc.trade.give].name + ' for ' + SPECIES[npc.trade.get].name + '?', [
          { label: 'Trade', value: 'yes', disabled: !have },
          { label: 'Not now', value: 'no' },
        ], (v) => {
          if (v !== 'yes' || !have) return;
          const idx = g.state.party.indexOf(have);
          const mon = makeMon(npc.trade.get, have.level, SPECIES, MOVES);
          mon.nickname = npc.trade.nickname || null;
          mon.ot = npc.name;
          mon.tradedFrom = npc.trade.give;
          g.state.party.splice(idx, 1, mon);
          dexRegister(g.state.dex, 'caught', SPECIES[npc.trade.get].dexNo);
          g.audio.playSfx('dex-register');
          g.ui.say(['Trade complete! Take good care of ' + (mon.nickname || SPECIES[mon.speciesId].name) + '.'], null, npc.name);
        });
      });
      return true;
    }
    if (npc.giveMon) {
      const flag = 'gift_' + this.mapId + '_' + npc.name;
      if (g.state.story.flags[flag]) { sayLines(null); return true; }
      sayLines(() => {
        g.state.story.flags[flag] = true;
        this.giftMon(npc.giveMon.species, npc.giveMon.level, null);
      });
      return true;
    }
    if (npc.revive) {
      sayLines(() => {
        const fossils = Object.keys(FOSSIL_OF).filter((f) => (g.state.bag[f] || 0) > 0);
        if (!fossils.length) { g.ui.say(['Bring me a fossil or Old Amber and my machine will do the rest.'], null, npc.name); return; }
        const items = fossils.map((f) => ({ label: 'Revive ' + ITEMS[f].name + ' -> ' + SPECIES[FOSSIL_OF[f]].name, value: f }));
        items.push({ label: 'Not now', value: null });
        g.ui.showMenu('Fossil revival', items, (v) => {
          if (!v) return;
          g.state.bag[v]--;
          this.giftMon(FOSSIL_OF[v], 30, null);
        });
      });
      return true;
    }
    if (npc.ferry) {
      sayLines(() => {
        g.ui.showMenu('Sail to ' + npc.ferry + '?', [
          { label: 'Sail', value: 'yes' }, { label: 'Stay', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          const dest = MAPS[npc.ferry];
          const st = (dest && dest.start) || { x: 7, y: 7 };
          this.loadMap(npc.ferry);
          this.player.tx = st.x; this.player.ty = st.y;
          this.player.px = st.x * TILE; this.player.py = st.y * TILE;
          this.player.fx = st.x; this.player.fy = st.y;
          this.trail = [];
          g.state.story.position = { map: npc.ferry, x: st.x, y: st.y, dir: 'up' };
          this.banner = { text: this.map.name.toUpperCase(), t: 1.6 };
          g.audio.playMusic(this.map.music || 'route1-theme');
        });
      });
      return true;
    }
    if (npc.safariGate) {
      sayLines(() => {
        if (g.state.session.safari) { this.endSafari('You left the Safari Zone.'); return; }
        g.ui.showMenu('Safari Zone: $500 for 500 steps + 30 Safari Balls.', [
          { label: 'Enter ($500)', value: 'yes', disabled: g.state.player.money < 500 },
          { label: 'Not now', value: 'no' },
        ], (v) => {
          if (v !== 'yes') return;
          g.state.player.money -= 500;
          g.state.session.safari = { steps: 500 };
          g.state.bag.safariball = (g.state.bag.safariball || 0) + 30;
          const st = MAPS.safari.start || { x: 10, y: 17 };
          this.loadMap('safari');
          this.player.tx = st.x; this.player.ty = st.y;
          this.player.px = st.x * TILE; this.player.py = st.y * TILE;
          this.player.fx = st.x; this.player.fy = st.y;
          this.trail = [];
          g.state.story.position = { map: 'safari', x: st.x, y: st.y, dir: 'up' };
          this.banner = { text: 'SAFARI ZONE', t: 1.6 };
          g.ui.toast('Safari started: 500 steps, 30 balls!');
        });
      });
      return true;
    }
    if (npc.safariExit) {
      sayLines(() => this.endSafari('You left the Safari Zone.'));
      return true;
    }
    if (npc.nameRater) {
      sayLines(() => {
        const items = g.state.party.map((m, i) => ({ label: displayName(m, SPECIES) + ' (Lv' + m.level + ')', value: i }));
        items.push({ label: 'Not now', value: -1 });
        g.ui.showMenu('Whose name shall I rate?', items, (v) => {
          if (v === null || v === -1) return;
          const mon = g.state.party[v];
          g.ui.showNameEntry('Nickname for ' + SPECIES[mon.speciesId].name + '?', mon.nickname || SPECIES[mon.speciesId].name, 12, (name) => {
            mon.nickname = name && name.trim() ? name.trim().slice(0, 12) : null;
            g.ui.say([(mon.nickname || SPECIES[mon.speciesId].name) + '... A fine name!'], null, npc.name);
          });
        });
      });
      return true;
    }
    return false;
  },

  endSafari(msg) {
    const g = this.game;
    g.state.session.safari = null;
    g.state.bag.safariball = 0;
    g.ui.say([msg], () => {
      const st = MAPS.fuchsia.start || { x: 10, y: 10 };
      this.loadMap('fuchsia');
      this.player.tx = st.x; this.player.ty = st.y;
      this.player.px = st.x * TILE; this.player.py = st.y * TILE;
      this.player.fx = st.x; this.player.fy = st.y;
      this.trail = [];
      g.state.story.position = { map: 'fuchsia', x: st.x, y: st.y, dir: 'down' };
      this.banner = { text: 'FUCHSIA CITY', t: 1.6 };
      g.audio.playMusic(this.map.music || 'route1-theme');
    });
  },

  // ---------- PC boxes ----------
  // Platinum PC box (UI v2): a 'pcbox' wallpaper window whose stored
  // Pokemon render as sprite cells (Game#spriteDataUrl, the same helper
  // the party/bag rows use — accessed here via this.game). Navigation
  // rows (box-switch, party deposit/withdraw lists, link, log off / back)
  // are full-width `wide` rows under the cell grid. All values returned
  // to the callbacks, and the deposit/withdraw/box-switch semantics, are
  // exactly as before; the current box + capacity stay in the title.
  openPc() {
    const g = this.game;
    const boxes = g.state.boxes;
    for (let i = 1; i <= BOX_COUNT; i++) if (!Array.isArray(boxes['box' + i])) boxes['box' + i] = [];
    const cur = g.state.currentBox || 'box1';
    const spriteRowHtml = (getMon) => (it) => {
      const mon = getMon(it);
      if (!mon) return '<span>' + it.label + '</span>';
      const url = (typeof g.spriteDataUrl === 'function') ? g.spriteDataUrl(mon.speciesId) : '';
      return '<img class="picon" src="' + url + '" alt=""><span>' + it.label + '</span>';
    };
    const boxRowHtml = spriteRowHtml((it) => {
      if (typeof it.value === 'string' && it.value.indexOf('wd:') === 0) return boxes[cur][parseInt(it.value.slice(3), 10)];
      if (typeof it.value === 'number' && it.value >= 0) return boxes[cur][it.value];
      return null;
    });
    const partyRowHtml = spriteRowHtml((it) => {
      if (typeof it.value === 'number' && it.value >= 0) return g.state.party[it.value];
      return null;
    });
    const withdrawMon = (iv) => {
      if (g.state.party.length >= 6) { g.ui.say(['Your party is full!']); return; }
      const mon = boxes[cur].splice(iv, 1)[0];
      if (!mon) return;
      g.state.party.push(mon);
      g.ui.toast('Withdrew ' + displayName(mon, SPECIES) + '.');
    };
    const mainItems = boxes[cur].map((m, i) => ({
      label: displayName(m, SPECIES) + ' Lv' + m.level, value: 'wd:' + i,
    }));
    mainItems.push(
      { label: 'Deposit', value: 'dep', wide: true },
      { label: 'Withdraw', value: 'wd', wide: true },
      { label: 'Change box', value: 'chg', wide: true },
      { label: 'Link Transfer (Bill\'s system)', value: 'link', wide: true },
      { label: 'Log off', value: 'off', wide: true },
    );
    g.ui.showMenu('PC — someone\'s PC (current: ' + cur.replace('box', 'Box ') + ', ' + boxes[cur].length + '/' + BOX_CAP + ')', mainItems, (v) => {
      if (typeof v === 'string' && v.indexOf('wd:') === 0) {
        // Box-screen shortcut: choosing a stored Pokemon's cell withdraws
        // it, with the same party-full guard as the Withdraw list below.
        withdrawMon(parseInt(v.slice(3), 10));
        return;
      }
      if (v === 'dep') {
        const items = g.state.party.map((m, i) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: i, disabled: g.state.party.length <= 1 }));
        items.push({ label: 'Back', value: -1, wide: true });
        g.ui.showMenu('Deposit which?', items, (iv) => {
          if (iv === null || iv === -1) return;
          const mon = g.state.party[iv];
          const chk = boxCheck(mon);
          if (!chk.ok) { g.ui.say([chk.line]); return; }
          if (boxes[cur].length >= BOX_CAP) { g.ui.say(['That box is full!']); return; }
          g.state.party.splice(iv, 1);
          mon.status = null;
          boxes[cur].push(mon);
          g.ui.toast('Deposited ' + displayName(mon, SPECIES) + '.');
        }, { menuClass: 'pcbox', rowHtml: partyRowHtml });
      } else if (v === 'wd') {
        const items = boxes[cur].map((m, i) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: i }));
        items.push({ label: 'Back', value: -1, wide: true });
        g.ui.showMenu('Withdraw which?', items, (iv) => {
          if (iv === null || iv === -1) return;
          withdrawMon(iv);
        }, { menuClass: 'pcbox', rowHtml: boxRowHtml });
      } else if (v === 'chg') {
        const items = [];
        for (let i = 1; i <= BOX_COUNT; i++) items.push({ label: 'Box ' + i + ' (' + boxes['box' + i].length + '/' + BOX_CAP + ')', value: 'box' + i, wide: true });
        g.ui.showMenu('Change to which box?', items, (iv) => {
          if (iv) { g.state.currentBox = iv; g.ui.toast('Current box: ' + iv.replace('box', 'Box ') + '.'); }
        }, { menuClass: 'pcbox' });
      } else if (v === 'link') {
        // Bill's Link Transfer: trade-evolution species evolve here —
        // the honest single-player resolution (WS7 design call, ADR-019).
        const cand = g.state.party.filter((m) => {
          const sp = SPECIES[m.speciesId];
          return sp && sp.evo && sp.evo.method === 'trade';
        });
        if (!cand.length) { g.ui.say(['No Pokemon here is waiting on a trade evolution.']); return; }
        const items = cand.map((m) => ({ label: displayName(m, SPECIES) + ' -> ' + SPECIES[SPECIES[m.speciesId].evo.to].name, value: m.monId }));
        items.push({ label: 'Back', value: null, wide: true });
        const linkRowHtml = spriteRowHtml((it) => cand.find((m) => m.monId === it.value) || null);
        g.ui.showMenu('Link Transfer which?', items, (iv) => {
          const mon = cand.find((m) => m.monId === iv);
          if (mon) this.evolveMon(mon);
        }, { menuClass: 'pcbox', rowHtml: linkRowHtml });
      }
    }, { menuClass: 'pcbox', rowHtml: boxRowHtml });
  },

  // ---------- mart ----------
  openMart(stock) {
    const g = this.game;
    g.ui.showMenu('Mart — $' + g.state.player.money, [
      { label: 'Buy', value: 'buy' }, { label: 'Sell', value: 'sell' }, { label: 'Leave', value: 'leave' },
    ], (v) => {
      if (v === 'buy') {
        const items = stock.filter((id) => ITEMS[id] && ITEMS[id].price > 0).map((id) => ({
          label: ITEMS[id].name + ' — $' + ITEMS[id].price + ' (own ' + (g.state.bag[id] || 0) + ')', value: id,
          disabled: g.state.player.money < ITEMS[id].price,
        }));
        items.push({ label: 'Back', value: null });
        g.ui.showMenu('Buy what?', items, (iv) => {
          if (!iv) return;
          g.state.player.money -= ITEMS[iv].price;
          g.state.bag[iv] = (g.state.bag[iv] || 0) + 1;
          g.audio.playSfx('dex-register');
          g.ui.toast('Bought ' + ITEMS[iv].name + '.');
          this.openMart(stock);
        });
      } else if (v === 'sell') {
        const items = Object.keys(g.state.bag).filter((id) => ITEMS[id] && ITEMS[id].price > 0 && g.state.bag[id] > 0)
          .map((id) => ({ label: ITEMS[id].name + ' x' + g.state.bag[id] + ' — sell $' + Math.floor(ITEMS[id].price / 2), value: id }));
        items.push({ label: 'Back', value: null });
        g.ui.showMenu('Sell what?', items, (iv) => {
          if (!iv) return;
          g.state.bag[iv]--;
          g.state.player.money += Math.floor(ITEMS[iv].price / 2);
          g.ui.toast('Sold ' + ITEMS[iv].name + '.');
          this.openMart(stock);
        });
      }
    });
  },

  // ---------- Game Corner slots ----------
  openSlots() {
    const g = this.game;
    const coins = g.state.bag.coin || 0;
    g.ui.showMenu('Slots — ' + coins + ' coins (7-7-7 pays 300, three of a kind 50, any pair 8)', [
      { label: 'Spin (1 coin)', value: 'spin', disabled: coins < 1 },
      { label: 'Buy 50 coins ($1000)', value: 'buy', disabled: g.state.player.money < 1000 },
      { label: 'Leave', value: 'leave' },
    ], (v) => {
      if (v === 'buy') {
        g.state.player.money -= 1000;
        g.state.bag.coin = (g.state.bag.coin || 0) + 50;
        this.openSlots();
        return;
      }
      if (v !== 'spin') return;
      g.state.bag.coin--;
      const syms = ['7', 'BAR', '♣', '♦', '♥', '♠'];
      const reel = [0, 0, 0].map(() => syms[Math.floor(g.rng.misc() * syms.length)]);
      let win = 0;
      if (reel[0] === '7' && reel[1] === '7' && reel[2] === '7') win = 300;
      else if (reel[0] === reel[1] && reel[1] === reel[2]) win = 50;
      else if (reel[0] === reel[1] || reel[1] === reel[2] || reel[0] === reel[2]) win = 8;
      if (win > 0) g.state.bag.coin += win;
      g.audio.playSfx(win > 0 ? 'dex-register' : 'menu-move');
      g.ui.say(['[ ' + reel.join(' | ') + ' ]' + (win > 0 ? ' — WINNER! +' + win + ' coins!' : ' — no luck this spin.')], () => this.openSlots());
    });
  },

  // ---------- evolution ----------
  evolveMon(mon, stoneId) {
    const g = this.game;
    const chk = evolutionCheck(mon);
    if (!chk.ok) { g.ui.say([chk.line]); return false; }
    const sp = SPECIES[mon.speciesId];
    let evo = null;
    if (stoneId) {
      const evos = sp.evos || (sp.evo ? [sp.evo] : []);
      evo = evos.find((e) => e.method === 'stone' && e.stone === stoneId) || null;
    } else {
      evo = sp.evo || (sp.evos ? sp.evos[0] : null);
    }
    if (!evo) return false;
    const fromName = displayName(mon, SPECIES);
    const to = SPECIES[evo.to];
    const ivs = mon.ivs || {};
    const oldMax = mon.maxHp;
    mon.speciesId = evo.to;
    mon.maxHp = hpValue(to.base.hp, mon.level, ivs.hp);
    if (mon.hp > 0) mon.hp = Math.min(mon.maxHp, mon.hp + (mon.maxHp - oldMax));
    mon.stats = {
      atk: statValue(to.base.atk, mon.level, ivs.atk), def: statValue(to.base.def, mon.level, ivs.def),
      spa: statValue(to.base.spa, mon.level, ivs.spa), spd: statValue(to.base.spd, mon.level, ivs.spd),
      spe: statValue(to.base.spe, mon.level, ivs.spe),
    };
    dexRegister(g.state.dex, 'caught', to.dexNo);
    g.audio.playSfx('levelup');
    g.ui.say(['What? ' + fromName + ' is evolving!', fromName + ' evolved into ' + to.name + '!']);
    return true;
  },

  // ---------- blackout ----------
  blackout() {
    const g = this.game;
    g.state.player.money = Math.floor(g.state.player.money / 2);
    g.ui.say(['You scurried to a Pokemon Center, protecting your exhausted team...'], () => {
      this.loadMap('center');
      this.player.tx = 4; this.player.ty = 3;
      this.player.px = 4 * TILE; this.player.py = 3 * TILE;
      this.player.fx = 4; this.player.fy = 3;
      this.trail = [];
      this.healParty(false);
      g.state.story.position = { map: 'center', x: 4, y: 3, dir: 'down' };
      g.ui.toast('Your Pokemon were healed. (Lost half your money.)');
    });
  },

  // ---------- world dressing ----------
  sysRenderWorld(r) {
    const g = this.game;
    const T = TILE;
    // Cut trees become clearings.
    if (this.fxState) {
      for (const k of this.fxState.cut) {
        const [cx, cy] = k.split(',').map(Number);
        const spr = g.tileSprite('path');
        if (spr) r.blit(spr, cx * T, cy * T);
      }
      // Boulders at their runtime positions.
      for (const b of this.fxState.boulders.values()) {
        const spr = g.tileSprite('rock');
        if (spr) r.blit(spr, b.x * T, b.y * T);
      }
    }
    // Item balls: the classic red-and-white sphere on the ground.
    if (this.map.items) {
      for (const b of this.map.items) {
        const flag = 'item_' + this.mapId + '_' + b.x + '_' + b.y;
        if (g.state.story.flags[flag]) continue;
        if ((b.item === 'helixfossil' || b.item === 'domefossil') && g.state.story.flags.fossil_taken) continue;
        const c = r.ctx;
        c.save();
        c.fillStyle = '#e84040';
        c.beginPath(); c.arc(b.x * T + 8, b.y * T + 8, 5, Math.PI, 0); c.fill();
        c.fillStyle = '#f8f8f0';
        c.beginPath(); c.arc(b.x * T + 8, b.y * T + 8, 5, 0, Math.PI); c.fill();
        c.fillStyle = '#202028';
        c.fillRect(b.x * T + 3, b.y * T + 7, 10, 2);
        c.restore();
      }
    }
    // Dark caves: gloom with a glow around the player until FLASH is used.
    if (this.map.dark && !(this.fxState && this.fxState.flashLit)) {
      const c = r.ctx;
      c.save();
      c.fillStyle = 'rgba(6,6,18,0.86)';
      c.fillRect(0, 0, this.w * T, this.h * T);
      c.fillStyle = 'rgba(255,240,180,0.12)';
      c.beginPath(); c.arc(this.player.px + 8, this.player.py + 8, 34, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  },

  // ---------- objective (quest-driven HUD line) ----------
  sysObjective() {
    const g = this.game;
    const q = QUESTS.find((qq) => qq.flag && !g.state.story.flags[qq.flag]);
    if (q) return '▶ ' + q.text;
    const active = Object.keys(g.state.story.quests).find((k) => g.state.story.quests[k] === 'active');
    if (active && LEGENDARY_ARCS[active]) return '▶ Arc: ' + LEGENDARY_ARCS[active].title;
    return '▶ Explore Kanto';
  },
});
