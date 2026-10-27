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
import { grantKeepsake, ownsKeepsake } from './keepsakes.mjs';
import { TILE } from '../engine/render.mjs';
import { roll, intIn, pickWeighted } from '../engine/rng.mjs';
import { makeMon, dexRegister, displayName, evolutionCheck, boxCheck } from './state.mjs';
import { sparLevelFor } from './rules.mjs';
import { BattleScene } from './battle.mjs';
import { EVENTS, MAIN_QUESTS, LEGENDARY_ARCS, CREDITS_LINES } from '../data/story-kanto.mjs';
import { taleSpotAt, taleStageOf, taleStatus, acceptTale, advanceTale, completeTale, IOU_PRIORITY } from '../data/quests.mjs';
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
    // ADR-025 §3 (Phase 3): the Hall of Fame gift — the Champion's
    // Ribbon is presented at League registration, once (a keepsake is
    // a unique object; repeat registrations never duplicate it).
    const lines = CREDITS_LINES.slice();
    if (grantKeepsake(g.state, 'championsribbon')) {
      lines.push('The League registrar presents you with the CHAMPION\'S RIBBON!');
      lines.push('Give it to a Pokemon from the party menu — its holder gains x1.2 XP.');
    }
    g.ui.say(lines, () => { if (done) done(); }, '');
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
    // ADR-025 §5 (Town Tales): faced-tile tale searches (the lost
    // keepsake, the dock notes, the graves, the lure, the burned notes).
    // The handler declines whenever its tale is not at the needing
    // stage, so base handlers (signs, fishing, hidden items) keep
    // their exact behavior the rest of the time.
    const taleSpot = taleSpotAt(this.mapId, fx, fy);
    if (taleSpot && this.taleSpotInteract(taleSpot)) return true;
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
    // ADR-025 §5 (Town Tales): tale actors run their stage machine.
    // The handler returns false when the tale is not at a stage this
    // actor serves, and the NPC's normal flow (dialogue, trainer
    // battle, gifts) proceeds untouched — Sabrina's gym battle and the
    // Cerulean witnesses' small talk included.
    if (npc.tale) { if (this.runTaleNpc(npc)) return true; }
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

  // ---------- Town Tales (ADR-025 §5) ----------
  // The stage machine + payouts are pure (data/quests.mjs); everything
  // below is presentation: dialogue, menus, and the tales' one battle
  // each at most. Battles are friendly spars / wild chases with no
  // stakes (the Cerulean kid is the exception — a real trainer battle
  // with a talk-it-out alternative, per the spec's "talk OR battle").
  // Losing any tale battle leaves the stage untouched: talk again and
  // retry. No tale ever gates main progression.
  taleSay(lines, who, cb) {
    const g = this.game;
    g.ui.say(lines.map((l) => l.replace('{player}', g.state.player.name)), cb, who || '');
  },

  // A no-stakes tale battle: friendly + uncatchable wild spar.
  taleSpar(species, level, onWin, onLose) {
    const g = this.game;
    const foe = makeMon(species, level, SPECIES, MOVES);
    dexRegister(g.state.dex, 'seen', SPECIES[species].dexNo);
    g.scenes.push(new BattleScene({
      kind: 'wild', foe, returnTo: this, friendly: true, uncatchable: true, rt: rtOf(g),
      onEnd: (won, fled) => { if (won && !fled) onWin(); else if (onLose) onLose(); },
    }));
  },

  runTaleNpc(npc) {
    const g = this.game;
    const st = g.state;
    const id = npc.tale;
    const stage = taleStageOf(st, id);
    const done = taleStatus(st, id) === 'complete';
    const say = (lines, cb) => this.taleSay(lines, npc.name, cb);
    const finishWith = (lines, opts) => say(lines, () => completeTale(st, id, opts));

    // ---- Pallet: Mom's Care Package ----
    if (id === 'tale_pallet') {
      if (npc.name === 'MOM') {
        if (stage < 0) { say(['Oh! Before you run off again — a favor, love.', 'I have a package for the Viridian shopkeeper: maps, tea, and a letter too long for any Pidgey. Carry it north for me?', 'The Quest Log has it now. Reward? Three Potions and a mother\'s undying smugness.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['The shopkeeper is in Viridian City, love — south end of town, green apron, strong opinions.']); return true; }
        if (stage === 1) { finishWith(['A receipt! With her handwriting and everything.', 'You know, I drew the first street maps of this town as a girl — chalk on a barn door, because paper cost money.', 'She still sells copies in that shop. Half the trainers in Kanto are navigating by my handwriting, and not one of them knows it.', 'Three Potions, as promised. Come home sometimes, {player}.']); return true; }
        say(['My maps, her shop, your road. That is how a town stays stitched together, love.']); return true;
      }
      if (npc.name === 'SHOPKEEPER') {
        if (stage === 0) { say(['A package from Pallet? Let me see — maps, tea, and a letter the size of a phone book.', 'That is her handwriting on the maps, you know. Still the best-drawn charts on my shelf.', 'Here — a stamped receipt. Take it back to her, and tell her the tea shelf misses her.'], () => advanceTale(st, id)); return true; }
        if (stage === 1) { say(['Receipt is yours already, trainer. Pallet is straight south — mind the grass.']); return true; }
        return false;
      }
    }

    // ---- Viridian: The Retired Ace ----
    if (id === 'tale_viridian') {
      if (stage < 0) { say(['You walk like a trainer. Good. An old man can use one.', 'Sixty years ago I lost a keepsake in the Viridian Forest — a tortoise charm, carved by my late wife. The grass on Route 2 keeps it still, I think.', 'Find it, and choose honestly: bring it back to me, or keep it. Either way it ends with a trainer. That is all a charm wants.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) { say(['Route 2, the deep grass. Face a likely patch and search it, the way we did before itemfinders.']); return true; }
      if (stage === 1) {
        say(['You have her look about you. Show me your hands, trainer.'], () => {
          g.ui.showMenu('The Tortoise Charm. What do you do?', [
            { label: 'Return it to Ace Marlow', value: 'return' },
            { label: 'Keep it', value: 'keep' },
          ], (v) => {
            if (v === 'return') {
              st.story.flags.tale_viridian_returned = true;
              finishWith(['...You found it. You actually— ha. HA! Look at that carving. Sixty years, and the grass kept it gentle.', 'No — do not argue. It goes with you. A charm that is found twice has chosen twice.', 'I was the first trainer ever to challenge the Viridian Gym, before there was a League to write it down. My tortoise outlived three gyms and every rival I had.', 'Let it outlive a few of yours, too. That is a Warm feeling, trainer. Warm.'], { bondDelta: 2 });
            } else {
              finishWith(['Keeping it, then. Ha! Sixty years in the grass and it picks a bold one.', 'I was the first trainer ever to challenge the Viridian Gym, you know. My tortoise outlived three gyms and every rival I had.', 'A charm chooses its trainer, in the end. It seems it has. Walk tall, keeper.'], { bondDelta: 0 });
            }
          });
        });
        return true;
      }
      say([st.story.flags.tale_viridian_returned ? 'The charm rides with you, and my thanks with it. Warm travels, trainer.' : 'Bold heart, soft hands. The charm chose well enough.']); return true;
    }

    // ---- Pewter: Brock's Day Off ----
    if (id === 'tale_pewter') {
      if (npc.name === 'CURATOR') {
        if (stage < 0) { say(['Psst — trainer. Brock has not had a day off since the museum roof leaked, and that was two winters ago.', 'Cover my desk quiz for the visitors — three questions, all from the exhibits — then spar his Geodude so he can call it exercise and clock out.', 'The Iron Acorn is yours if you pull it off. It has been our paperweight for a decade; it deserves adventure.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { this.taleQuizPewter(npc); return true; }
        if (stage === 1) { say(['Quiz covered! Brock is in the square, pretending not to be off duty. His Geodude is already judging you.']); return true; }
        say(['The museum hums along, and Brock actually smiled at a fossil today. Miracles, catalogued.']); return true;
      }
      if (npc.name === 'BROCK') {
        if (stage === 1) {
          say(['Day off. Allegedly. The Curator says you are my exercise plan.', 'One Geodude, no badges on the line, no crowd. Just rock and honest work.'], () => {
            g.ui.showMenu('Spar with Brock\'s Geodude (Lv 12)?', [
              { label: 'Spar', value: 'yes' }, { label: 'Not yet', value: 'no' },
            ], (v) => {
              if (v !== 'yes') return;
              this.taleSpar('geodude', 12, () => {
                finishWith(['Solid. You read a Rock type like a book you have already finished.', 'Here — the Iron Acorn. The museum\'s oldest paperweight, and harder than my whole team\'s heads.', 'Secret, trainer to trainer: this city\'s gym was built out of the museum\'s own stone. The museum came first. Leaders here have been part-time curators ever since — I pay the fossil lab out of gym winnings, and I would do it on my day off, too.']);
              }, () => say(['Geodude takes the round. He is smug about it in three languages of rock.', 'Shake it off — a day off has room for a rematch.']));
            });
          });
          return true;
        }
        return false; // Brock's own lines (off-duty color) otherwise
      }
    }

    // ---- Cerulean: The Stolen Bike Bell ----
    if (id === 'tale_cerulean') {
      if (npc.name === 'TESS') {
        if (stage < 0) { say(['My bike bell is GONE. Brass, loud, and older than the gym — somebody lifted it right off my handlebars.', 'Three people saw something: Wren by the grass, Orin east, and the Fan near the gym. Ask them. Please.', 'The bell is Cerulean history. And my TM11 is yours if it comes home — BubbleBeam, the real one.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) {
          const n = [1, 2, 3].filter((w) => st.story.flags['tale_cerulean_w' + w]).length;
          say(['Witnesses heard from: ' + n + ' of 3. Wren, Orin, the Fan — Cerulean is small; somebody saw that bell.']); return true;
        }
        if (stage === 1) { say(['The cape, north end of town. Whoever has my bell is done running.']); return true; }
        say(['It rings again! Half of Cerulean heard it and pretended not to be emotional.']); return true;
      }
      if (npc.role === 'witness') {
        const flag = 'tale_cerulean_w' + npc.witness;
        if (stage === 0 && !st.story.flags[flag]) {
          const clues = {
            1: ['The bell? I heard it — ding ding, getting quieter northward. A kid, red cap, running like the bridge owed him money.'],
            2: ['Saw him clear as day: small, quick, hugging something brass to his chest. Headed for the cape, where the rich trainers sun themselves.'],
            3: ['He nearly ran me down! Kept looking back like the bell might ring on its own and give him away. The cape, trainer. End of the road.'],
          };
          say(clues[npc.witness] || clues[1], () => {
            st.story.flags[flag] = true;
            if ([1, 2, 3].every((w) => st.story.flags['tale_cerulean_w' + w])) {
              advanceTale(st, id);
              this.taleSay(['Three stories, one direction: the cape, at the north end of Cerulean. The culprit is cornered — go and be kind, or be quick.'], 'TESS');
            }
          });
          return true;
        }
        return false; // their ordinary small talk otherwise
      }
      if (npc.name === 'PIP') {
        if (stage === 1) {
          say(['H-hey. Cape\'s taken. I am... meditating. Loudly. In brass.', '...Fine. It is me. I took the bell. But before you— just hear me out, or don\'t. Battle me for it, if you want it clean.'], () => {
            g.ui.showMenu('The bell, back to Tess. How?', [
              { label: 'Talk it out', value: 'talk' },
              { label: 'Battle for it', value: 'battle' },
            ], (v) => {
              const earn = () => finishWith(['...My little brother\'s bike has no bell. Cars do not hear him. I just wanted him LOUD, you know?', 'Take it. Take it back to Tess. Tell her — tell her the cape kid is sorry, and her bell is the loudest good thing in Cerulean.', 'It rang first on the first bike ever ridden over Nugget Bridge, she told the whole street once. Gym was a bike shop then. I stole a piece of history to fix a Tuesday.', 'Misty will hear the whole story by supper. Everybody tells Misty everything. That is somehow worse than losing.']);
              if (v === 'talk') { earn(); return; }
              if (v === 'battle') {
                const t = TRAINERS.tale_kid;
                if (!t) { earn(); return; }
                g.ui.say(t.intro, () => {
                  g.scenes.push(new BattleScene({
                    kind: 'trainer', trainer: t, returnTo: this, rt: rtOf(g),
                    onEnd: (won) => { if (won) earn(); else say(['...You are just going to let me keep it? No. NO. That look is worse than losing. Come back when you can take it properly.']); },
                  }));
                }, npc.name);
              }
            });
          });
          return true;
        }
        if (done) { say(['Bell\'s home. Brother got a whistle. It is not the same, and he will not stop saying so.']); return true; }
        return false;
      }
    }

    // ---- Vermilion: Fan Club Founder ----
    if (id === 'tale_vermilion') {
      if (npc.name === 'CHAIRMAN') {
        if (stage < 0) { say(['You have the look of a listener, and I am a man with a LOSS to describe at length.', 'Our founder\'s notebooks — fifty years of tides, teams, and terrible puns — were left at the S.S. Anne dock. The Anne has them, or the harbor does.', 'Bring them home and the Tide Pearl is yours. The founder kept it for "a trainer who fetches paper in a storm of small talk."'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say([st.story.flags.stanne_done ? 'The Anne has sailed — but nothing leaves this harbor unrecorded. Ask the Harbormaster, east end of the dock.' : 'The dock, trainer! South edge of town, where the gulls hold their own fan club.']); return true; }
        if (stage === 1) { finishWith(['THE NOTEBOOKS. Intact! Slightly gull-kissed, but intact!', 'Listen to this, from the first page: "Vermilion had no harbor when I charted these tides. Three sailors and a dream. The Fan Club is just those sailors, arguing forever."', 'Even Lt. Surge learned this bay from these pages. He respects the founder like weather — you do not argue, you dress for it.', 'The Tide Pearl, as promised. It has heard fifty years of harbor stories and tells none of them.']); return true; }
        say(['The notebooks rest in the clubhouse, and the club endures. My Rapidash, meanwhile — did I tell you about its coat?']); return true;
      }
      if (npc.name === 'HARBORMASTER') {
        if (stage === 0 && st.story.flags.stanne_done) { say(['Lost property? Aye — when the Anne cast off, a oilskin bundle came off her dock cart. Notebooks. Tide tables. Puns.', 'Harbor keeps what the sea gives back. Take them to the Chairman, and tell him the harbor charges one (1) thank-you.'], () => advanceTale(st, id)); return true; }
        return false;
      }
    }

    // ---- Lavender: Names on the Wall ----
    if (id === 'tale_lavender') {
      if (npc.name === 'VOLUNTEER') {
        if (stage < 0) { say(['Oh — a trainer with gentle hands, I hope. The tower\'s west stones are losing their names.', 'Take my ledger into Pokemon Tower and record the unnamed graves before the carving goes smooth. Then find Elder Bram — he remembers what the stones cannot.', 'Mr. Fuji keeps a Spectre Bell for whoever tends the tower\'s forgotten. It should be carried by someone kind.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['The west gravestones, in the tower. Read them aloud as you write — the tower likes to hear its names.']); return true; }
        if (stage === 1) { say(['The ledger is filling in beautifully. Elder Bram waits in the east of town — ask him about the Marowak.']); return true; }
        say(['Every name on that wall is a door somebody can knock on again. Thank you.']); return true;
      }
      if (npc.name === 'ELDER BRAM') {
        if (stage === 1) {
          finishWith(['So. The ledger-keeper comes to hear about the Marowak.', 'She was no legend, child. She was a mother, in a tower full of thieves, and she put herself between them and her baby with her whole heart. The little one got away. She did not.', 'The channelers say a mother\'s love does not leave a place just because her body did. If the tower is restless on your climb — well. You did not hear a strategy from me. There is none in this. Only a story.', 'Take the Spectre Bell. Mr. Fuji will want to know the names are written down — that man has carried this town\'s grief longer than I have carried mine.']);
          return true;
        }
        return false;
      }
    }

    // ---- Celadon: Roof Garden ----
    if (id === 'tale_celadon') {
      const badges = st.badges.kanto.length;
      if (stage < 0) { say(['You are looking at Celadon\'s best-kept height: the Game Corner roof garden, Erika\'s own.', 'It wants three waterings this season — and the garden keeps gym hours, in its way: the second visit wants a trainer with 4 badges, the third, 6. Plants respect a journey.', 'Finish the season and the Gardenia Sash is yours. Erika sewed it herself, so water like you mean it.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) { say(['Watering one — there you go. Slow circles, no splashing the marigolds; they hold grudges.', 'One bed drinks for the whole roof when a journey is young. Come back at 4 badges for the second round.'], () => advanceTale(st, id)); return true; }
      if (stage === 1) {
        if (badges >= 4) { say(['Four badges! The vines noticed before I did. Watering two — mind the hanging bed, it drinks like a Snorlax.', 'One more round, at 6 badges, and the season is yours.'], () => advanceTale(st, id)); return true; }
        say(['The garden is still sipping its first watering, trainer. Second round opens at 4 badges — you hold ' + badges + '. The plants are patient. Be like the plants.']); return true;
      }
      if (stage === 2) {
        if (badges < 6) { say(['Last watering waits for a 6-badge trainer — you hold ' + badges + '. The roof is not going anywhere, and neither is the view.']); return true; }
        say(['Six badges — the whole roof stands up straighter. Final watering, and then—', '—MEOWTH! That is the third time this week, you little toll collector! Chase it off, trainer!'], () => {
          this.taleSpar('meowth', 18, () => {
            finishWith(['Gone! Over the parapet like it pays rent elsewhere. The garden is safe, the season is COMPLETE, and somewhere a Meowth is telling this story very differently.', 'The Gardenia Sash — Erika\'s own stitching. Wear it knowing this: this garden grows over Celadon\'s first gym, a wooden hall where the Game Corner now glitters.', 'Erika\'s grandmother planted the first bed so the city\'s green would always stand taller than its neon. You have kept it standing, trainer.']);
          }, () => say(['It slipped past you — all tail and opinions. The plants are unharmed; come back and chase it properly.']));
        });
        return true;
      }
      say(['The roof blooms on, season after season. Erika asks after you — gardeners notice who waters.']); return true;
    }

    // ---- Saffron: Two Gyms, One City ----
    if (id === 'tale_saffron') {
      if (npc.name === 'MASTER KO') {
        if (stage < 0) { say(['You stand in the Fighting Dojo, and we have a problem older than you.', 'Once a year this hall sends one message across the street, and once a year SHE sends one back. This year the messenger is... you. Take our word to Sabrina.', 'No fighting required, unless pride gets involved. Pride always gets involved.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) { say(['Sabrina, in her gym across the street. Deliver it standing straight — she respects posture and punctuality, in that order.']); return true; }
        if (stage === 1) { say(['You carry our word still. Deliver it; then choose your thanks with open eyes.']); return true; }
        if (stage === 2 && !st.story.flags.tale_saffron_iou) {
          say(['So the Dojo\'s thanks it is. One spar, my best student\'s partner, honest rules. XP is the prize and pride is the tax.'], () => {
            g.ui.showMenu('Spar at the Dojo?', [
              { label: 'Spar', value: 'yes' }, { label: 'Not yet', value: 'no' },
            ], (v) => {
              if (v !== 'yes') return;
              const lvl = Math.max(12, sparLevelFor(st));
              this.taleSpar('machop', lvl, () => {
                finishWith(['Enough! The hall remembers that one.', 'Tell Sabrina her school\'s strength is still only half the story — and hear the rest from her, since a message deserves an answer.', 'One school, this was. Her father and I split it over what strength is FOR. You have carried messages between us longer in a day than we managed in twenty years.']);
              }, () => say(['The student takes it. The Dojo does not mock a loss — it schedules the rematch. Come again.']));
            });
          });
          return true;
        }
        if (stage === 2) { say(['Your thanks waits across the street, written in Sabrina\'s hand. Collect it after her badge — her rules, and for once, I agree with them.']); return true; }
        say(['The hall is quieter this year. Messages do that.']); return true;
      }
      if (npc.name === 'SABRINA') {
        if (stage === 0) {
          say(['A message from across the street. I knew its words before you climbed my stairs — that is not why I let you carry it.', 'It says: "The hall stands." Every year, the same two words. Every year, I answer: "So does the Gym." That is the whole war, trainer. Two buildings, refusing to fall down first.'], () => {
            advanceTale(st, id);
            this.taleSay(['Now choose your thanks, messenger — in my hall, choices are also messages.'], 'SABRINA');
          });
          return true;
        }
        if (stage === 1) {
          say(['The rivalry is witnessed. Choose, messenger.'], () => {
            g.ui.showMenu('Your thanks?', [
              { label: 'The Dojo spar (XP)', value: 'spar' },
              { label: 'Sabrina\'s keepsake IOU (after her badge)', value: 'iou' },
              { label: 'Not now', value: 'no' },
            ], (v) => {
              if (v === 'spar') { say(['The Dojo, then. Master Ko is already clearing the floor — I foresaw the sawdust.']); advanceTale(st, id); }
              else if (v === 'iou') {
                st.story.flags.tale_saffron_iou = true;
                say(['An IOU, then, in my own hand: one keepsake from my keeping, redeemed when you hold my Marsh Badge.', 'Win it honestly, messenger. I will be watching the battle three turns before it happens.']);
                advanceTale(st, id);
              }
            });
          });
          return true;
        }
        if (stage === 2 && st.story.flags.tale_saffron_iou) {
          if (!st.badges.kanto.includes('marshbadge')) return false; // the gym battle itself is the way through
          const pick = IOU_PRIORITY.find((k) => !ownsKeepsake(st, k));
          if (pick) {
            finishWith(['The badge suits you. And an IOU in my hand is a door opening.', 'Your keepsake, messenger — chosen by the only rule that matters: the one you did not already carry. May it arrive exactly when it is needed. It usually does, with me.', 'Her father and Master Ko built one school, then split it over what strength is FOR. You have now carried their whole argument in an afternoon. Thank you for not dropping it.'], { keepsake: pick });
          } else {
            finishWith(['Every keepsake in Kanto already rides with you — there is nothing left in my keeping you lack. The IOU pays in candy, then: three XP Candies, and my genuine surprise.', 'Her father and Master Ko built one school, then split it over what strength is FOR. You have now carried their whole argument in an afternoon.'], { items: { xpcandy: 3 } });
          }
          return true;
        }
        return false; // Sabrina's gym flow (battle / post-badge lines) otherwise
      }
    }

    // ---- Fuchsia: The Warden's Teeth ----
    if (id === 'tale_fuchsia') {
      if (npc.name === 'SAFARI WARDEN') {
        if (stage < 0) { say(['Mind the marsh on your way in, trainer — it took something of mine.', 'Not my teeth, before you grin. My FISHING LURE. Carved it the year I arrived; the entrance marsh swallowed it this morning, right inside the gate.', 'Fetch it home and there are ten Safari Balls in it for you. A lure that old deserves a story with a trainer in it.'], () => acceptTale(st, id)); return true; }
        if (stage === 0) {
          // The marsh is INSIDE the Safari Zone, and this same NPC is
          // the gate: decline so his safariGate flow opens the park
          // (his own dialogue line there points at the entrance marsh).
          return false;
        }
        if (stage === 1) {
          say(['That shine — that is IT. That is the lure!', 'Feel the weight of it. Carved the year the marsh fed all of Fuchsia, before fences, gates, or tickets. Koga\'s grandfather taught me to fish with this very piece of wood.'], () => {
            this.taleSay(['Uncle Warden! You found it — Father will want to hear the marsh gave it back. Thank you, trainer. From both of us.'], 'JANINE', () => {
              completeTale(st, id);
              this.taleSay(['Ten Safari Balls, as promised — and Janine\'s thanks, which in this family is legal tender. Go on, then. The marsh is behaving today.'], 'SAFARI WARDEN');
            });
          });
          return true;
        }
        // Complete: decline — the Warden is the Safari gate, and his
        // gate (and his own lost-teeth business) must own his talks
        // again. The lure hangs by his door either way.
        return false;
      }
      if (npc.name === 'JANINE') {
        if (done) { say(['Father heard the whole lure story by supper — Koga hears everything in Fuchsia eventually. Thank you again, trainer.']); return true; }
        return false;
      }
    }

    // ---- Cinnabar: Lab Notes ----
    if (id === 'tale_cinnabar') {
      if (stage < 0) { say(['Careful — ash still falls in the mansion library, twenty years on.', 'Our team\'s burned research notes are in there: two halves, west shelves and east shelves. The fire took the middle pages and left the edges legible. Typical.', 'Bring both halves back and the Ember Seed is yours — and Blaine will hear whose hands carried his science home.'], () => acceptTale(st, id)); return true; }
      if (stage === 0) {
        const w = !!st.story.flags.tale_cinnabar_west, e = !!st.story.flags.tale_cinnabar_east;
        say(['Halves recovered: ' + (w ? 'west ' : '') + (e ? 'east ' : '') + (!w && !e ? 'none yet' : '') + '. The mansion library, both shelf-runs. Mind the journals — everybody reads them, nobody shelves them.']); return true;
      }
      if (stage === 1) {
        finishWith(['Both halves. Both! Let me lay them together... yes. Yes, the burn line matches. Twenty years, and the argument still reads clean.', 'This page, though. A jungle expedition, before the fire — they followed a mirage no instrument could record, and came home with one curled eyelash in a specimen jar.', 'Blaine was on that team. He has never once called it a failure. What slept in that jungle, the page refuses to say — and I have stopped asking paper to gossip.', 'The Ember Seed, earned. And Blaine will hear your name from me before the week turns.']);
        return true;
      }
      say(['The notes are re-shelved, the argument restored, the ash — mostly — forgiven.']); return true;
    }

    return false;
  },

  // The Pewter museum desk quiz: 3 questions, all from the exhibit
  // lines read aloud first. A wrong answer corrects and re-asks the
  // same question — the desk is never failed, only finished.
  taleQuizPewter(npc) {
    const g = this.game;
    const st = g.state;
    const QS = [
      { q: 'Exhibit one: "Old Amber holds something ancient inside." What does amber hold?', opts: ['Ancient DNA', 'A tiny lighthouse', 'Fossilized soup'], a: 0, fix: 'The card says it plainly: amber holds ancient DNA. Again —' },
      { q: 'Exhibit two: "Two fossils sleep in Mt. Moon." Which one is the SPIRAL shell?', opts: ['Dome Fossil', 'Helix Fossil', 'Old Amber'], a: 1, fix: 'Helix — think of a snail shell, a spiral staircase. Again —' },
      { q: 'Exhibit three: "Pewter stone remembers." The museum was built from what?', opts: ['Imported marble', 'The mountain itself', 'Recycled badges'], a: 1, fix: 'The mountain itself — this whole city is one polite quarry. Again —' },
    ];
    const ask = (i) => {
      if (i >= QS.length) {
        this.taleSay(['Three for three! The desk is covered, the visitors are dazzled, and Brock owes us both a day off.', 'He is in the square with his Geodude. Go and collect your spar.'], npc.name, () => advanceTale(st, 'tale_pewter'));
        return;
      }
      const item = QS[i];
      g.ui.showMenu(item.q, item.opts.map((o, oi) => ({ label: o, value: oi })), (v) => {
        if (v === item.a) { g.audio.playSfx('dex-register'); ask(i + 1); }
        else this.taleSay([item.fix], npc.name, () => ask(i));
      });
    };
    this.taleSay(['The desk, then! The exhibit cards, read slow — every answer is on them, as a fair quiz should be.', 'Card one: amber, and the ancient DNA inside it. Card two: the spiral Helix and the domed Dome. Card three: a museum built from the mountain itself. Ready?'], npc.name, () => ask(0));
  },

  // Faced-tile tale searches (sysInteract hook). Returns true only
  // when the spot did tale business; false lets signs/fishing speak.
  taleSpotInteract(spot) {
    const g = this.game;
    const st = g.state;
    const id = spot.tale;
    const stage = taleStageOf(st, id);
    if (stage !== 0) return false;
    const say = (lines, cb) => this.taleSay(lines, '', cb);
    if (spot.kind === 'keepsake') { // Viridian Forest, Route 2 grass
      say(['Something glints under the grass — a carved wooden tortoise, worn smooth as river stone.', 'THE TORTOISE CHARM. Sixty years of weather, and the carving still smiles.', 'Take it back to Ace Marlow in Viridian — or keep it. The choice is the tale.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'notes') { // Vermilion dock, pre-departure
      if (st.story.flags.stanne_done) { say(['The dock is bare — the Anne has sailed, and whatever she left behind went through the harbor office. The Harbormaster keeps lost property.']); return true; }
      say(['Under a dock crate, oilskin-wrapped against the spray: notebooks! Tide tables, team notes, and puns of a truly maritime vintage.', 'THE FOUNDER\'S NOTES. The Chairman in Vermilion will want these yesterday.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'graves') { // Pokemon Tower, west stones
      say(['You read the west stones aloud, one by one, and write what the carving still holds.', 'Three have no names at all — only dates, and the careful marks of whoever visits. The ledger takes them as "beloved, unnamed," which is better than forgotten.', 'Elder Bram, in Lavender Town, remembers the rest. Go gently.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'lure') { // Safari Zone entrance marsh
      say(['The marsh reeds lean over something shining — you wade two steps and close your hand on carved, water-dark wood.', 'THE WARDEN\'S LURE. Older than the fence around it, and heavier than it looks: a lot of mornings live in this wood.', 'Return it to the Safari Warden in Fuchsia City.'], () => advanceTale(st, id));
      return true;
    }
    if (spot.kind === 'notesWest' || spot.kind === 'notesEast') { // Mansion library
      const flag = spot.kind === 'notesWest' ? 'tale_cinnabar_west' : 'tale_cinnabar_east';
      if (st.story.flags[flag]) { say(['Ash and empty shelf. This half is already recovered.']); return true; }
      st.story.flags[flag] = true;
      const both = st.story.flags.tale_cinnabar_west && st.story.flags.tale_cinnabar_east;
      say([spot.kind === 'notesWest'
        ? 'Behind the west shelves: a tin box the fire only kissed. Inside — half of the lab\'s burned notes, edges crisped, argument intact.'
        : 'Under the east shelves, where the journals fell like leaves: the other half of the burned notes, smelling of smoke and stubbornness.',
      both ? 'BOTH HALVES. The lab tech in Cinnabar is about to have a very good day.' : 'One half recovered. The other shelf-run still waits.'], () => { if (both) advanceTale(st, id); });
      return true;
    }
    return false;
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
        // ADR-025 §3 (Phase 3): stock rows carrying minBadges stay hidden
        // until the player has earned that many badges (the codebase's
        // badgesAtLeast gating idiom — this is how the Celadon shop's
        // Second-Wind Ribbon is "late"). Keepsakes are unique objects:
        // once owned (bag or held) the row is disabled.
        const items = stock.filter((id) => ITEMS[id] && ITEMS[id].price > 0
          && (!ITEMS[id].minBadges || g.state.badges.kanto.length >= ITEMS[id].minBadges)).map((id) => ({
          label: ITEMS[id].name + ' — $' + ITEMS[id].price + ' (own ' + (g.state.bag[id] || 0) + ')', value: id,
          disabled: g.state.player.money < ITEMS[id].price
            || (ITEMS[id].pocket === 'keepsakes' && ownsKeepsake(g.state, id)),
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
        // ADR-025 §3: keepsakes are non-sellable (pocket excluded).
        const items = Object.keys(g.state.bag).filter((id) => ITEMS[id] && ITEMS[id].pocket !== 'keepsakes' && ITEMS[id].price > 0 && g.state.bag[id] > 0)
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
    const q = MAIN_QUESTS.find((qq) => qq.flag && !g.state.story.flags[qq.flag]);
    if (q) return '▶ ' + q.text;
    const active = Object.keys(g.state.story.quests).find((k) => g.state.story.quests[k] === 'active');
    if (active && LEGENDARY_ARCS[active]) return '▶ Arc: ' + LEGENDARY_ARCS[active].title;
    return '▶ Explore Kanto';
  },
});
