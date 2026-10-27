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
import { sparLevelFor } from './rules.mjs';
import { BattleScene } from './battle.mjs';
import { EVENTS, QUESTS, LEGENDARY_ARCS, CREDITS_LINES } from '../data/story-kanto.mjs';
import { CHAPTERS } from '../data/story.mjs';
import { statValue, hpValue } from '../engine/formulas.mjs';

const BOX_COUNT = 12;
const BOX_CAP = 30; // UI v2.4: Platinum's 30 — matches the save validator's limit (was 20)
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
    // UI v2.2 defect 4 guard: same no-living-ally rule as the grass branch.
    if (!g.state.party.some((m) => m && m.hp > 0)) return false;
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
      g.scenes.push(new BattleScene({ kind: 'wild', foe, returnTo: this, rt: rtOf(g), arena: 'water' }));
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
  // ADR-025 §4 (Candy Coach): a repeatable, no-stakes 1v1 spar in every
  // Pokemon Center (the NPC only exists while the House Rule is on — see
  // loadMap's gate in overworld.mjs). The Coach's partner fights at (your
  // highest level - 2); a win awards one XP Candy. A loss costs nothing
  // (BattleScene friendly flag) and the spar can be re-run immediately.
  startSpar(npc) {
    const g = this.game;
    const sayLines = (cb) => g.ui.say(npc.dialogue.map((l) => l.replace('{player}', g.state.player.name)), cb, npc.name);
    const level = sparLevelFor(g.state);
    if (!level) { sayLines(null); return; }
    sayLines(() => {
      g.ui.showMenu('Spar with the Coach? (Partner: Lv ' + level + ' ' + SPECIES[npc.sparSpecies].name + ')', [
        { label: 'Spar', value: 'yes' },
        { label: 'Not now', value: 'no' },
      ], (v) => {
        if (v !== 'yes') return;
        const foe = makeMon(npc.sparSpecies, level, SPECIES, MOVES);
        g.scenes.push(new BattleScene({
          kind: 'wild', foe, returnTo: this, friendly: true, uncatchable: true,
          rt: g.state.settings.battleStyle !== 'classic',
          onEnd: (won, fled) => {
            // QA D1: fleeing (RUN / Teleport) ends the battle with
            // won=true + fled=true — the candy only changes hands on a
            // real win, or the spar becomes an unbounded candy farm.
            if (fled) {
              g.ui.say(['Running off mid-drill? The candy only changes hands on a win. Come back when you mean it.'], null, npc.name);
            } else if (won) {
              g.state.bag.xpcandy = (g.state.bag.xpcandy || 0) + 1;
              g.ui.say(['Clean work — that is a win in my book.', 'Here: one XP Candy. Winners earn one every time. Come back whenever you want more reps.'], null, npc.name);
            } else {
              g.ui.say(['Good reps. The nurse will patch your team up — then come back and we go again.'], null, npc.name);
            }
          },
        }));
      });
    });
  },

  sysNpc(npc) {
    const g = this.game;
    const sayLines = (cb) => g.ui.say(npc.dialogue.map((l) => l.replace('{player}', g.state.player.name)), cb, npc.name);
    if (npc.sparCoach) { this.startSpar(npc); return true; }
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
            if (name === null) return; // cancelled — keep the current name (S-03)
            mon.nickname = name && name.trim() ? name.trim().slice(0, 12) : null; // blank OK clears it (S-04)
            g.ui.say([(mon.nickname || SPECIES[mon.speciesId].name) + '... A fine name!'], null, npc.name);
          }, { allowCancel: true, allowEmpty: true });
        });
      });
      return true;
    }
    return false;
  },

  endSafari(msg) {
    const g = this.game;
    g.state.session.safari = null;
    // AUDIT FIX (C241): unspent Safari Balls used to vanish silently —
    // the exit text now says what happened to them.
    const left = g.state.bag.safariball || 0;
    g.state.bag.safariball = 0;
    g.ui.say(left > 0 ? [msg, '(The park keeps the ' + left + ' unused Safari Balls.)'] : [msg], () => {
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
  // UI v2.4 (defect 4): a real box SCREEN (ui.showPcPanel) instead of the
  // list-modal flow — wallpaper field, a 30-slot grid that renders even
  // when empty, the party strip alongside, a framed info window, and box
  // switching as framed nav (Q/E or the ◀ ▶ buttons). Pick-up/place
  // semantics: A lifts a mon — it stays in its array, dimmed, until
  // placed, so B / log-off with full hands can never lose a mon — and A
  // again places it: empty target = deposit / withdraw / move, occupied
  // target = swap. Boxes stay DENSE arrays under the grid (placing on an
  // empty cell inserts at that index): the save format stores lists, and
  // the validator rejects sparse/null slots. Deposit keeps the house
  // rules: boxCheck (the partner never boxes) + at least one Pokemon
  // stays with you; depositing clears status, as before.
  // Link Transfer (Bill's system) keeps its menu, from the side button.
  openPc() {
    const g = this.game;
    const boxes = g.state.boxes;
    for (let i = 1; i <= BOX_COUNT; i++) if (!Array.isArray(boxes['box' + i])) boxes['box' + i] = [];
    const COLS = 6;
    const st = {
      box: Math.max(1, Math.min(BOX_COUNT, parseInt(String(g.state.currentBox || 'box1').slice(3), 10) || 1)),
      zone: 'grid', idx: 0,
      held: null, // { mon, from: 'grid'|'party', idx, box }
    };
    const boxArr = () => boxes['box' + st.box];
    const sprite = (mon) => (typeof g.spriteDataUrl === 'function') ? g.spriteDataUrl(mon.speciesId) : '';

    const openLink = () => {
      // Bill's Link Transfer: trade-evolution species evolve here —
      // the honest single-player resolution (WS7 design call, ADR-019).
      const cand = g.state.party.filter((m) => {
        const sp = SPECIES[m.speciesId];
        return sp && sp.evo && sp.evo.method === 'trade';
      });
      // AUDIT FIX (S-10): the link flow used to close the PC first and
      // never come back — checking (or backing out) cost the whole PC
      // session. The panel now stays open underneath (menus and dialogue
      // route above it) and every exit path returns to it.
      if (!cand.length) { g.ui.say(['No Pokemon here is waiting on a trade evolution.'], () => render()); return; }
      const items = cand.map((m) => ({ label: displayName(m, SPECIES) + ' -> ' + SPECIES[SPECIES[m.speciesId].evo.to].name, value: m.monId }));
      items.push({ label: 'Back', value: null, wide: true });
      const linkRowHtml = (it) => {
        const mon = cand.find((m) => m.monId === it.value) || null;
        if (!mon) return '<span>' + it.label + '</span>';
        return '<img class="picon" src="' + sprite(mon) + '" alt=""><span>' + it.label + '</span>';
      };
      g.ui.showMenu('Link Transfer which?', items, (iv) => {
        const mon = cand.find((m) => m.monId === iv);
        if (mon) this.evolveMon(mon, null, () => render());
        else render();
      }, { menuClass: 'pcbox', rowHtml: linkRowHtml });
    };

    const infoFor = () => {
      if (st.held) return 'Holding <b>' + displayName(st.held.mon, SPECIES) + ' Lv' + st.held.mon.level + '</b>.<br>Choose where to place it — a box slot or a party slot. B puts it back.';
      if (st.zone === 'grid') {
        const mon = boxArr()[st.idx];
        if (mon) return '<b>' + displayName(mon, SPECIES) + ' Lv' + mon.level + '</b><br>HP ' + mon.hp + '/' + mon.maxHp + (mon.status ? ' · ' + String(mon.status).toUpperCase() : '') + '<br>A: pick up.';
        return 'Empty box slot.<br>Pick up a party member, then place it here to deposit.';
      }
      const mon = g.state.party[st.idx];
      if (mon) return '<b>' + displayName(mon, SPECIES) + ' Lv' + mon.level + '</b><br>HP ' + mon.hp + '/' + mon.maxHp + '<br>A: pick up.';
      return 'Empty party slot.<br>Place a box Pokemon here to withdraw it.';
    };

    const render = () => {
      const arr = boxArr();
      let cells = '';
      for (let i = 0; i < BOX_CAP; i++) {
        const mon = arr[i];
        const cls = 'pccell' + (mon ? '' : ' empty')
          + (st.zone === 'grid' && st.idx === i ? ' cursor' : '')
          + (st.held && st.held.from === 'grid' && st.held.box === st.box && st.held.idx === i ? ' heldsrc' : '');
        cells += '<button class="' + cls + '" data-pcact="cell" data-idx="' + i + '">'
          + (mon ? '<img src="' + sprite(mon) + '" alt=""><span class="pclv">Lv' + mon.level + '</span>' : '')
          + '</button>';
      }
      let party = '';
      for (let i = 0; i < 6; i++) {
        const mon = g.state.party[i];
        const cls = 'pcpslot' + (mon ? '' : ' empty')
          + (st.zone === 'party' && st.idx === i ? ' cursor' : '')
          + (st.held && st.held.from === 'party' && st.held.idx === i ? ' heldsrc' : '');
        party += '<button class="' + cls + '" data-pcact="party" data-idx="' + i + '">'
          + (mon ? '<img src="' + sprite(mon) + '" alt=""><span>' + displayName(mon, SPECIES) + ' Lv' + mon.level + '</span>' : '<span>—</span>')
          + '</button>';
      }
      const bodyHtml = '<div class="pcmain"><div class="pcgrid">' + cells + '</div>'
        + '<div class="pcside"><div class="pcpartyhd">PARTY</div><div class="pcparty">' + party + '</div>'
        + '<div class="pcinfo">' + infoFor() + '</div>'
        + '<button class="pclink" data-pcact="link">Link Transfer (Bill\'s system) — Shift</button>'
        + '<button class="pclink" data-pcact="off">Log off</button></div></div>';
      const data = {
        title: 'SOMEONE\'S PC — BOX ' + st.box + ' (' + arr.length + '/' + BOX_CAP + ')'
          + (st.held ? ' · HOLDING ' + displayName(st.held.mon, SPECIES) : ''),
        bodyHtml,
      };
      if (g.ui.pcOpen) g.ui.updatePcPanel(data); else g.ui.showPcPanel(data, cb);
    };

    const place = (zone, idx) => {
      const held = st.held;
      if (!held) {
        const mon = zone === 'grid' ? boxArr()[idx] : g.state.party[idx];
        if (!mon) return;
        st.held = { mon, from: zone, idx, box: st.box };
        g.audio.playSfx('ui-blip');
        render();
        return;
      }
      // Placing back on the origin slot just puts it down again.
      if (held.from === zone && held.idx === idx && (zone === 'party' || held.box === st.box)) {
        st.held = null; render(); return;
      }
      if (zone === 'grid') {
        const arr = boxArr();
        const occ = arr[idx];
        if (held.from === 'party') {
          if (g.state.party.length <= 1) { g.ui.say(['You need at least one Pokemon with you!']); return; }
          const chk = boxCheck(held.mon);
          if (!chk.ok) { g.ui.say([chk.line]); return; }
          g.state.party.splice(held.idx, 1);
          if (occ) { arr[idx] = held.mon; g.state.party.splice(held.idx, 0, occ); }
          else arr.splice(Math.min(idx, arr.length), 0, held.mon);
          held.mon.status = null;
          g.ui.toast('Deposited ' + displayName(held.mon, SPECIES) + '.');
        } else {
          const src = boxes['box' + held.box];
          if (occ) { src[held.idx] = occ; arr[idx] = held.mon; }
          else { src.splice(held.idx, 1); arr.splice(Math.min(idx, arr.length), 0, held.mon); }
        }
      } else {
        const occ = g.state.party[idx];
        if (held.from === 'grid') {
          const src = boxes['box' + held.box];
          if (occ) {
            const chk = boxCheck(occ);
            if (!chk.ok) { g.ui.say([chk.line]); return; }
            src[held.idx] = occ; g.state.party[idx] = held.mon;
          } else {
            src.splice(held.idx, 1); g.state.party.push(held.mon);
          }
          g.ui.toast('Withdrew ' + displayName(held.mon, SPECIES) + '.');
        } else if (occ) {
          g.state.party[held.idx] = occ; g.state.party[idx] = held.mon;
        }
      }
      st.held = null;
      st.zone = zone; st.idx = idx;
      g.audio.playSfx('ui-blip');
      render();
    };

    const move = (dir) => {
      if (st.zone === 'grid') {
        if (dir === 'left') st.idx = Math.max(0, st.idx - 1);
        else if (dir === 'right') st.idx = Math.min(BOX_CAP - 1, st.idx + 1);
        else if (dir === 'up') { if (st.idx >= COLS) st.idx -= COLS; }
        else if (dir === 'down') {
          if (st.idx + COLS < BOX_CAP) st.idx += COLS;
          else { st.zone = 'party'; st.idx = Math.min(5, st.idx % COLS); }
        }
      } else {
        if (dir === 'left') st.idx = Math.max(0, st.idx - 1);
        else if (dir === 'right') st.idx = Math.min(5, st.idx + 1);
        else if (dir === 'up') { st.zone = 'grid'; st.idx = (BOX_CAP - COLS) + Math.min(COLS - 1, st.idx); }
      }
      g.audio.playSfx('ui-tick');
      render();
    };

    const cb = (action, arg) => {
      if (action === 'move') move(arg);
      else if (action === 'box') {
        st.box = ((st.box - 1 + arg + BOX_COUNT) % BOX_COUNT) + 1;
        g.state.currentBox = 'box' + st.box;
        g.audio.playSfx('ui-tick');
        render();
      } else if (action === 'confirm') place(st.zone, st.idx);
      else if (action === 'cancel') {
        if (st.held) { st.held = null; render(); }
        else g.ui.closePcPanel();
      } else if (action === 'link') {
        openLink(); // AUDIT FIX (S-09): Shift key — the keyboard path to Link Transfer
      } else if (action === 'click') {
        if (arg.act === 'cell') { st.zone = 'grid'; st.idx = arg.idx; place('grid', arg.idx); }
        else if (arg.act === 'party') { st.zone = 'party'; st.idx = arg.idx; place('party', arg.idx); }
        else if (arg.act === 'link') { openLink(); }
        else if (arg.act === 'off') { g.ui.closePcPanel(); }
      }
    };

    render();
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
          // AUDIT FIX (S-11): Back returns to the Mart top menu, not out
          // of the whole Mart flow onto the street.
          if (!iv) { this.openMart(stock); return; }
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
          if (!iv) { this.openMart(stock); return; }
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
  evolveMon(mon, stoneId, onDone) {
    const g = this.game;
    const chk = evolutionCheck(mon);
    if (!chk.ok) { g.ui.say([chk.line], onDone || undefined); return false; }
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
    g.ui.say(['What? ' + fromName + ' is evolving!', fromName + ' evolved into ' + to.name + '!'], onDone || undefined);
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
