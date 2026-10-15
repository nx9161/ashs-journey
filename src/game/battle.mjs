// battle.mjs — turn-based battle state machine (architecture §2.2).
// States: intro | command | moves | bag | party | catchseq | resolve | faint |
//          xp | victory | defeat | run. Transitions are data-ish, no spaghetti.

import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { BALLS } from '../data/items.mjs';
import {
  effectiveness, calcDamage, stageMultiplier, CRIT_CHANCE, STAB_MULT,
  RANDOM_MIN, RANDOM_MAX, catchA, shakeChecks, isCriticalCapture,
  xpYield, xpForLevel, statValue, hpValue,
} from '../engine/formulas.mjs';
import { roll, intIn } from '../engine/rng.mjs';
import { TILE } from '../engine/render.mjs';
import { dexRegister, displayName, makeMon } from './state.mjs';
import { SFX } from '../engine/audio.mjs';
import { SLICE_CAPSTONE } from '../data/dialogue.mjs';

const HP_DRAIN_PER_SEC = 90; // ADR-004 feel budget

export class BattleScene {
  constructor(opts) {
    this.kind = opts.kind; // 'wild' | 'trainer'
    this.foeMon = opts.foe;
    this.trainer = opts.trainer || null;
    this.tutorial = !!opts.tutorial; // GD: scripted first-catch gate — certainty, not luck
    this.returnTo = opts.returnTo;
    this.trainerIdx = 0;
  }

  enter() {
    const g = this.game;
    g.ui.setBattleMode(true);
    this.state = 'intro';
    this.t = 0;
    this.msg = '';
    g.audio.playMusic(this.kind === 'trainer' ? 'battle-trainer-theme' : 'battle-wild-theme', { area: false });
    if (this.kind === 'trainer') {
      const t0 = this.trainer.team[0];
      this.foeMon = makeMon(t0.species, t0.level, SPECIES, MOVES);
    }
    this.ally = this.firstAble(g);
    this.foe = this.foeMon;
    this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.allyStages = this.ally.stages;
    this.turn = 1;
    this.actions = [];
    this.animQ = [];
    this.hpAnim = { ally: this.ally.hp, foe: this.foe.hp };
    this.xpAnim = 0;
    this.shakeT = 0;
    this.flashT = 0;
    this.catchState = null;
    this.fled = false;
    this.critCap = false;
    this.log = [];
    g.ui.log.push({ ui: 'battle', kind: this.kind, foe: this.foe.speciesId });
    const foeName = displayName(this.foe, SPECIES);
    g.audio.playCry(this.foe.speciesId);   // synthesized cry, never sampled
    g.audio.playCry(this.ally.speciesId);
    if (this.tutorial) {
      // Scripted first-catch gate: the tips teach the loop (weaken -> throw),
      // the engine guarantees the outcome (endure + weakened auto-catch).
      this.say('Wild ' + foeName + ' appeared!', () => {
        this.say("AIDE (via Pokegear): There's your first catch! One Thunder Shock to weaken it —", () => {
          this.say('— then open the BAG and throw a Poke Ball while its HP is yellow!', () => this.toCommand());
        });
      });
    } else {
      this.say(this.kind === 'wild' ? 'Wild ' + foeName + ' appeared!' : 'Trainer ' + this.trainer.name + ' wants to battle!');
    }
  }

  firstAble(g) {
    for (const m of g.state.party) if (m.hp > 0) return m;
    return g.state.party[0];
  }

  say(text, cb) {
    this.msg = text;
    this.msgCb = cb || null;
    this.msgOpen = true;
    this.game.ui.log.push({ ui: 'battle-msg', text });
  }

  update(dt) {
    const g = this.game;
    const input = g.input;
    // Screen shake / flash decay
    if (this.shakeT > 0) { this.shakeT -= dt * 1000; g.renderer.shakeX = (Math.random() - 0.5) * 8; g.renderer.shakeY = (Math.random() - 0.5) * 8; }
    else { g.renderer.shakeX = 0; g.renderer.shakeY = 0; }
    if (this.flashT > 0) { this.flashT -= dt * 1000; g.renderer.flashA = Math.max(0, this.flashT / 60) * 0.8; }

    // Animated HP drain (90 HP/s)
    this.drainHp(dt);

    if (g.ui.update(dt)) return;
    if (this.msgOpen) {
      if (input.wasPressed('a') || input.wasPressed('start')) {
        this.msgOpen = false;
        const cb = this.msgCb; this.msgCb = null;
        if (cb) cb();
        else this.afterMsg();
      }
      return;
    }
    switch (this.state) {
      case 'intro': break; // driven by msg cb
      case 'command': this.updateCommand(input); break;
      case 'resolve': this.updateResolve(dt); break;
      case 'catchseq': this.updateCatch(dt); break;
      case 'xp': this.updateXp(dt); break;
      case 'victory': case 'defeat': break;
    }
  }

  afterMsg() {
    const s = this.state;
    if (s === 'intro') this.toCommand();
    else if (s === 'resolve') this.nextAction();
    else if (s === 'victory') this.finishVictory();
    else if (s === 'defeat') this.finishDefeat();
    else if (s === 'faintfoe') this.afterFaintFoe();
  }

  toCommand() {
    this.state = 'command';
    const items = [
      { label: 'FIGHT', value: 'fight' },
      { label: 'BAG', value: 'bag' },
      { label: 'PARTY', value: 'party' },
      // GD: no running from the scripted tutorial — it's a lesson, not a gamble.
      { label: this.kind === 'wild' ? 'RUN' : 'RUN', value: 'run', disabled: this.kind !== 'wild' || this.tutorial },
    ];
    this.game.ui.showCommands(items, (value) => this.onCommand(value));
  }

  updateCommand() { /* menu modal drives via ui */ }

  onCommand(value) {
    const g = this.game;
    if (value === null) { this.toCommand(); return; } // cancelled -> back
    if (value === 'fight') {
      const ally = this.ally;
      const items = ally.moves.map((m, i) => {
        const mv = MOVES[m.id];
        return { label: mv.name + '  ' + m.pp + '/' + m.maxPp, value: i, disabled: m.pp <= 0 };
      });
      items.push({ label: 'Back', value: -1 });
      this.state = 'moves';
      g.ui.showMenu('Choose a move', items, (v) => {
        if (v === null || v === -1) { this.toCommand(); return; }
        this.playerAction = { type: 'move', idx: v };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      });
    } else if (value === 'bag') {
      this.state = 'bag';
      const items = [];
      for (const bid of Object.keys(BALLS)) {
        const n = g.state.bag[bid] || 0;
        items.push({ label: BALLS[bid].name + ' x' + n, value: bid, disabled: n <= 0 || this.kind !== 'wild' });
      }
      const potions = g.state.bag.potion || 0;
      items.push({ label: 'Potion x' + potions, value: 'potion', disabled: potions <= 0 });
      items.push({ label: 'Back', value: null });
      g.ui.showMenu('Bag', items, (v) => {
        if (v === null) { this.toCommand(); return; }
        if (v === 'potion') { this.usePotion(); return; }
        this.playerAction = { type: 'ball', ball: v };
        this.foeAction = null; // throwing a ball: foe still acts? DS: ball replaces your move; foe moves first if faster. Simplify: foe acts after throw fails only.
        this.beginCatch(v);
      });
    } else if (value === 'party') {
      this.openPartyMenu(false);
    } else if (value === 'run') {
      if (this.kind === 'wild') {
        g.audio.playSfx('battle-run');
      this.say('Got away safely!', () => this.endBattle(true));
      } else {
        this.say("Can't escape a trainer battle!", () => this.toCommand());
      }
    }
  }

  openPartyMenu(inFaint) {
    const g = this.game;
    const items = g.state.party.map((m, i) => {
      const sp = SPECIES[m.speciesId];
      const tag = m === this.ally ? ' (active)' : '';
      return { label: displayName(m, SPECIES) + ' Lv' + m.level + ' ' + m.hp + '/' + m.maxHp + tag, value: i, disabled: m.hp <= 0 || m === this.ally };
    });
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu(inFaint ? 'Choose next Pokemon' : 'Party', items, (v) => {
      if (v === null || v === -1) { if (!inFaint) this.toCommand(); return; }
      const old = this.ally;
      this.ally = g.state.party[v];
      this.allyStages = this.ally.stages;
      this.hpAnim.ally = this.ally.hp;
      if (inFaint) {
        this.say('Go! ' + displayName(this.ally, SPECIES) + '!', () => this.toCommand());
      } else {
        this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
          this.playerAction = { type: 'switch', from: old };
          this.foeAction = this.chooseFoeAction();
          this.beginTurn();
        });
      }
    });
  }

  usePotion() {
    const g = this.game;
    const items = g.state.party.map((m, i) => ({
      label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp, value: i, disabled: m.hp <= 0 || m.hp >= m.maxHp,
    }));
    items.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Use Potion on...', items, (v) => {
      if (v === null || v === -1) { this.toCommand(); return; }
      const m = g.state.party[v];
      g.state.bag.potion--;
      m.hp = Math.min(m.maxHp, m.hp + 20);
      this.hpAnim.ally = m.hp; // snap if active
      this.say(displayName(m, SPECIES) + ' recovered 20 HP!', () => {
        this.playerAction = { type: 'item' };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      });
    });
  }

  chooseFoeAction() {
    const g = this.game;
    const usable = this.foe.moves.map((m, i) => i).filter((i) => this.foe.moves[i].pp > 0);
    if (!usable.length) return { type: 'move', idx: 0, struggle: true };
    // GD balance: gym-leader opener — a leader with a self-buff setup move
    // opens with it (classic Brock Defense Curl): gives the player a free
    // turn, teaches setup play, and makes the fight about strategy.
    if (this.trainer && this.trainer.ai === 'opener-setup' && this.turn === 1) {
      const setup = usable.find((i) => {
        const mv = MOVES[this.foe.moves[i].id];
        return mv.cat === 'status' && mv.effect && mv.effect.target === 'self';
      });
      if (setup !== undefined) return { type: 'move', idx: setup };
    }
    // Gym-leader-ish AI: prefer super-effective moves, else random.
    const allyTypes = SPECIES[this.ally.speciesId].types;
    let best = usable[0], bestScore = -1;
    for (const i of usable) {
      const mv = MOVES[this.foe.moves[i].id];
      if (mv.cat === 'status') continue;
      const e = effectiveness(mv.type, allyTypes);
      const score = e * (0.5 + g.rng.battle());
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (g.rng.battle() < 0.25) best = usable[Math.floor(g.rng.battle() * usable.length)];
    return { type: 'move', idx: best };
  }

  effStats(mon, stages) {
    const sp = SPECIES[mon.speciesId];
    return {
      atk: Math.floor(mon.stats.atk * stageMultiplier(stages.atk)),
      def: Math.floor(mon.stats.def * stageMultiplier(stages.def)),
      spa: Math.floor(mon.stats.spa * stageMultiplier(stages.spa)),
      spd: Math.floor(mon.stats.spd * stageMultiplier(stages.spd)),
      spe: Math.floor(mon.stats.spe * stageMultiplier(stages.spe)),
    };
  }

  beginTurn() {
    this.state = 'resolve';
    const pa = this.playerAction, fa = this.foeAction;
    const mk = (side, action) => {
      const mon = side === 'ally' ? this.ally : this.foe;
      const stages = side === 'ally' ? this.allyStages : this.foeStages;
      const stats = this.effStats(mon, stages);
      let priority = 0, move = null;
      if (action && action.type === 'move') {
        move = action.struggle ? { name: 'Struggle', type: 'normal', cat: 'physical', power: 50, acc: 100 } : MOVES[mon.moves[action.idx].id];
        priority = move.priority || 0;
      }
      return { side, action, mon, stats, priority, move };
    };
    const order = [];
    if (pa && pa.type !== 'switch' && pa.type !== 'item' && pa.type !== 'ball') order.push(mk('ally', pa));
    if (fa) order.push(mk('foe', fa));
    if (pa && (pa.type === 'switch' || pa.type === 'item' || pa.type === 'ball')) {
      // non-attack actions happen first, then foe acts
      this.actions = fa ? [mk('foe', fa)] : [];
      if (pa.type === 'switch' || pa.type === 'item') { /* already applied */ }
      this.state = 'resolve';
      this.nextAction();
      return;
    }
    // sort by priority -> Speed (paralysis quarters Speed) -> random tiebreak
    const cmp = (x, y) => {
      if (x.priority !== y.priority) return y.priority - x.priority;
      const sx = x.mon.status === 'paralysis' ? Math.floor(x.stats.spe / 4) : x.stats.spe;
      const sy = y.mon.status === 'paralysis' ? Math.floor(y.stats.spe / 4) : y.stats.spe;
      if (sx !== sy) return sy - sx;
      return this.game.rng.battle() < 0.5 ? -1 : 1;
    };
    this.actions = order.slice().sort(cmp);
    this.nextAction();
  }

  nextAction() {
    if (this.state !== 'resolve') return;
    const next = this.actions.shift();
    if (!next) { this.endTurnStatus(); return; }
    if (next.mon.hp <= 0) { this.nextAction(); return; } // fainted mid-turn
    this.execMove(next);
  }

  execMove(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);

    // Paralysis / sleep / freeze / confusion gates
    if (atk.status === 'paralysis' && roll(0.25, g.rng.battle)) {
      this.say(atkName + ' is paralyzed! It can\'t move!', () => this.nextAction());
      return;
    }
    if (atk.status === 'sleep') {
      atk.statusTurns = (atk.statusTurns || 2) - 1;
      if (atk.statusTurns <= 0) { atk.status = null; this.say(atkName + ' woke up!', () => this.execMoveContinue(entry)); }
      else this.say(atkName + ' is fast asleep.', () => this.nextAction());
      return;
    }
    if (atk.status === 'freeze') {
      if (roll(0.2, g.rng.battle)) { atk.status = null; this.say(atkName + ' thawed out!', () => this.execMoveContinue(entry)); }
      else { this.say(atkName + ' is frozen solid!', () => this.nextAction()); }
      return;
    }
    if (atk.confused && roll(0.33, g.rng.battle)) {
      const dmg = Math.max(1, Math.floor(calcDamage(atk.level, 40, entry.stats.atk, entry.stats.def, {}) / 2));
      atk.hp = Math.max(0, atk.hp - dmg);
      this.say(atkName + ' hurt itself in confusion!', () => this.checkFaint(entry.side, () => this.nextAction()));
      return;
    }
    this.execMoveContinue(entry);
  }

  execMoveContinue(entry) {
    const g = this.game;
    const atk = entry.mon, mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);
    const defName = displayName(def, SPECIES);

    // PP
    if (entry.action && !entry.action.struggle && entry.action.type === 'move') {
      const slot = atk.moves[entry.action.idx];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }

    // Accuracy check
    const acc = mv.acc || 100;
    if (acc < 100 && !roll(acc / 100, g.rng.battle)) {
      this.say(atkName + ' used ' + mv.name + '!', () => {
        this.say('But it missed!', () => this.nextAction());
      });
      return;
    }

    this.say(atkName + ' used ' + mv.name + '!', () => {
      if (mv.cat === 'status') { this.applyStatusMove(entry, mv); return; }
      const atkStat = mv.cat === 'physical' ? entry.stats.atk : entry.stats.spa;
      const defStat = mv.cat === 'physical'
        ? Math.floor(def.stats.def * stageMultiplier(defStages.def))
        : Math.floor(def.stats.spd * stageMultiplier(defStages.spd));
      const eff = effectiveness(mv.type, SPECIES[def.speciesId].types);
      const stab = SPECIES[atk.speciesId].types.includes(mv.type);
      const crit = roll(CRIT_CHANCE, g.rng.battle);
      const rand = RANDOM_MIN + g.rng.battle() * (RANDOM_MAX - RANDOM_MIN);
      const burn = atk.status === 'burn';
      if (eff === 0) {
        this.say('It doesn\'t affect ' + defName + '...', () => this.nextAction());
        return;
      }
      const dmg = calcDamage(atk.level, mv.power, atkStat, defStat,
        { stab, effectiveness: eff, crit, random: rand, burn, physical: mv.cat === 'physical' });
      def.hp = Math.max(0, def.hp - dmg);
      // GD tutorial: the lesson mon endures at 1 HP — the gate teaches
      // catching, so the only exit is a (guaranteed, once weakened) catch.
      let hungOn = false;
      if (this.tutorial && foeSide === 'foe' && def.hp <= 0) {
        def.hp = 1;
        hungOn = !this._endureShown;
        this._endureShown = true;
      }
      // Impact theater: hit-stop feel via shake/flash
      if (eff > 1) { this.shakeT = 120; this.flashT = 60; }
      else if (eff < 1) { this.shakeT = 60; }
      if (crit) this.flashT = 90;
      g.audio.hitFeedback(eff); // sound picks the effectiveness tier (visual twin: shake/flash)
      let extra = '';
      if (crit) extra = ' A critical hit!';
      if (eff > 1) extra += " It's super effective!";
      else if (eff < 1) extra += " It's not very effective...";
      const after = () => {
        // Secondary effect, then the damage line (never double-say the effectiveness line).
        let msg2 = hungOn
          ? defName + ' hung on with 1 HP! Now — open the BAG and throw a Poke Ball!'
          : defName + ' took ' + dmg + ' damage!';
        if (mv.effect && mv.effect.status && (!mv.effect.chance || roll(mv.effect.chance / 100, g.rng.battle))) {
          if (!def.status) {
            def.status = mv.effect.status;
            if (mv.effect.status === 'confusion') def.confused = true;
            msg2 = defName + this.statusText(mv.effect.status);
          }
        }
        if (mv.effect && mv.effect.drain) {
          atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(dmg * mv.effect.drain));
        }
        this.say(msg2, () => {
          this.checkFaint(foeSide, () => this.nextAction());
        });
      };
      if (extra.trim()) this.say(extra.trim(), after);
      else after();
    });
  }

  statusText(s) {
    return { burn: ' was burned!', poison: ' was poisoned!', paralysis: ' was paralyzed!', sleep: ' fell asleep!', freeze: ' was frozen solid!', confusion: ' became confused!' }[s] || ' was afflicted!';
  }

  applyStatusMove(entry, mv) {
    const g = this.game;
    const ef = mv.effect || {};
    const target = ef.target === 'self' ? entry.mon : (entry.side === 'ally' ? this.foe : this.ally);
    const stages = ef.target === 'self' ? (entry.side === 'ally' ? this.allyStages : this.foeStages) : (entry.side === 'ally' ? this.foeStages : this.allyStages);
    const tName = displayName(target, SPECIES);
    let msg = '';
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
      if (ef[k]) {
        stages[k] = Math.max(-6, Math.min(6, stages[k] + ef[k]));
        msg = tName + (ef[k] > 0 ? "'s " + k.toUpperCase() + ' rose!' : "'s " + k.toUpperCase() + ' fell!');
      }
    }
    if (ef.status === 'confusion') {
      target.confused = true;
      msg = tName + ' became confused!';
    }
    this.say(msg || 'Nothing happened.', () => this.nextAction());
  }

  checkFaint(side, cb) {
    const g = this.game;
    const mon = side === 'ally' ? this.ally : this.foe;
    if (mon.hp > 0) { cb(); return; }
    const name = displayName(mon, SPECIES);
    g.audio.playSfx('battle-faint');
    this.say(name + ' fainted!', () => {
      if (side === 'foe') {
        this.state = 'faintfoe';
        this.afterFaintFoe();
      } else {
        const g = this.game;
        const anyLeft = g.state.party.some((m) => m.hp > 0);
        if (!anyLeft) {
          this.state = 'defeat';
          this.say('You have no Pokemon left!', () => this.afterMsg());
        } else {
          this.openPartyMenu(true);
        }
      }
    });
  }

  afterFaintFoe() {
    const g = this.game;
    if (this.kind === 'trainer') {
      this.trainerIdx++;
      if (this.trainerIdx < this.trainer.team.length) {
        const t = this.trainer.team[this.trainerIdx];
        this.foe = makeMon(t.species, t.level, SPECIES, MOVES);
        this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        this.hpAnim.foe = this.foe.hp;
        const foeName = displayName(this.foe, SPECIES);
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => {
          g.audio.playCry(t.species);
          this.state = 'resolve';
          this.awardXp(() => this.toCommand());
        });
        return;
      }
      this.awardXp(() => this.winTrainer());
    } else {
      this.awardXp(() => {
        this.state = 'victory';
        g.audio.playSfx('victory'); // wild-win sting (visual twin: the "defeated" message)
        this.say('Wild ' + displayName(this.foe, SPECIES) + ' was defeated!', () => this.afterMsg());
      });
    }
  }

  awardXp(cb) {
    const g = this.game;
    const base = SPECIES[this.foe.speciesId].baseXp;
    const gain = xpYield(base, this.foe.level, this.kind === 'wild');
    this.pendingXp = (this.pendingXp || 0) + gain;
    this.xpCb = cb;
    this.state = 'xp';
    this.xpT = 0;
  }

  updateXp(dt) {
    const g = this.game;
    // XP bar ease-out over 600ms (gameux §4.2), then level-ups
    this.xpT += dt * 1000;
    if (this.xpT < 600) return;
    if (!this.xpApplied) {
      this.xpApplied = true;
      const msgs = [];
      for (const m of g.state.party) {
        if (m.hp <= 0) continue;
        m.xp += this.pendingXp;
        let leveled = false;
        while (m.xp >= xpForLevel(SPECIES[m.speciesId].growth, m.level + 1) && m.level < 100) {
          m.level++;
          leveled = true;
          const sp = SPECIES[m.speciesId];
          m.maxHp = hpValue(sp.base.hp, m.level);
          m.hp = Math.min(m.maxHp, m.hp + Math.floor(m.maxHp * 0.2));
          m.stats = {
            atk: statValue(sp.base.atk, m.level), def: statValue(sp.base.def, m.level),
            spa: statValue(sp.base.spa, m.level), spd: statValue(sp.base.spd, m.level),
            spe: statValue(sp.base.spe, m.level),
          };
          // Learn new moves
          const newMoves = (sp.learnset[m.level] || []);
          for (const mid of newMoves) {
            if (m.moves.length < 4) m.moves.push({ id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp });
            else m.moves[3] = { id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp }; // slice: replace oldest-known slot
          }
        }
        if (leveled) msgs.push(displayName(m, SPECIES) + ' grew to Lv ' + m.level + '!');
      }
      g.audio.playSfx('dex-register');
      this.pendingXp = 0;
      this.xpApplied = false;
      const cb = this.xpCb; this.xpCb = null;
      if (msgs.length) { g.audio.playSfx('levelup'); this.say(msgs.join(' '), () => { this.state = 'resolve'; if (cb) cb(); }); }
      else { this.state = 'resolve'; if (cb) cb(); }
    }
  }

  endTurnStatus() {
    // Burn/poison tick (1/16 max HP), then next command or faint checks.
    const tick = (mon, stages, side, done) => {
      if (mon.hp <= 0) { done(); return; }
      if (mon.status === 'burn' || mon.status === 'poison' || mon.status === 'badlyPoisoned') {
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
        mon.hp = Math.max(0, mon.hp - dmg);
        this.say(displayName(mon, SPECIES) + ' is hurt by ' + mon.status + '!', () => {
          this.checkFaint(side, done);
        });
        return;
      }
      done();
    };
    tick(this.ally, this.allyStages, 'ally', () => {
      if (this.state === 'defeat' || !this.ally || this.ally.hp <= 0) { this.nextAfterStatus(); return; }
      tick(this.foe, this.foeStages, 'foe', () => this.nextAfterStatus());
    });
  }

  nextAfterStatus() {
    if (this.state === 'defeat') { this.afterMsg(); return; }
    if (this.state === 'faintfoe') { this.afterFaintFoe(); return; }
    this.turn++;
    this.toCommand();
  }

  // ---- Catch sequence: the theater (gameux §4.2) ----
  beginCatch(ballId) {
    const g = this.game;
    g.state.bag[ballId]--;
    const ball = BALLS[ballId];
    this.state = 'catchseq';
    this.catchState = { ball, phase: 'throw', t: 0, shakes: 0, need: 0, a: 0 };
    g.audio.playSfx('catch-throw');
    this.msg = 'You threw a ' + ball.name + '!'; // throw plays immediately, no modal
    this.msgOpen = false;
    const foe = this.foe;
    const a = catchA(foe.maxHp, foe.hp, SPECIES[foe.speciesId].catchRate, ball.bonus, foe.status);
    this.catchState.a = a;
    if (this.tutorial && foe.hp <= foe.maxHp * 0.5) {
      // GD tutorial: weakened in the lesson battle = guaranteed catch.
      // The teaching is in the weaken step; the outcome is never luck.
      this.critCap = false;
      this.catchState.need = 3;
    } else {
      this.critCap = isCriticalCapture(a) && roll(0.05, g.rng.battle);
      this.catchState.need = this.critCap ? 1 : shakeChecks(a, g.rng.battle);
    }
    if (this.critCap) { g.ui.toast('Critical capture!'); g.audio.playSfx('catch-crit'); }
  }

  updateCatch(dt) {
    const g = this.game;
    const c = this.catchState;
    c.t += dt * 1000;
    // throw 26f (~430ms) -> absorb -> ball drop -> 3x800ms shakes -> click
    if (c.phase === 'throw' && c.t >= 430) { c.phase = 'shakes'; c.t = 0; }
    else if (c.phase === 'shakes') {
      const want = c.need;
      const doneShakes = Math.floor(c.t / 800);
      if (c.shakes < doneShakes && c.shakes < want) {
        c.shakes++;
        g.audio.playSfx('catch-rattle'); // visual twin: ball wiggle
      }
      if (c.shakes >= want && c.t >= want * 800 + 200) {
        if (want >= 3 || (this.critCap && want >= 1)) this.catchSuccess();
        else this.catchBreak(c.shakes);
      }
    }
  }

  catchSuccess() {
    const g = this.game;
    g.audio.playSfx('catch-click'); // visual twin: starburst
    g.audio.playSfx('catch-gotcha');
    const foe = this.foe;
    const name = displayName(foe, SPECIES);
    dexRegister(g.state.dex, 'caught', SPECIES[foe.speciesId].dexNo);
    let dest = 'party';
    if (g.state.party.length >= 6) {
      const box = g.state.boxes.box1 || (g.state.boxes.box1 = []);
      box.push({ speciesId: foe.speciesId, level: foe.level, xp: foe.xp, nickname: null, moves: foe.moves.map((m) => m.id), ivs: foe.ivs });
      dest = 'Box 1';
    } else {
      foe.hp = foe.maxHp; // caught fresh
      g.state.party.push(foe);
    }
    g.audio.playSfx('dex-register'); // visual twin: dex toast + badge dot
    this.say('Gotcha! ' + name + ' was caught! (' + dest + ')', () => {
      g.ui.toast(name + ' registered in the Dex!');
      this.endBattle(true);
    });
  }

  catchBreak(shakesDone) {
    const g = this.game;
    const name = displayName(this.foe, SPECIES);
    g.audio.catchBreakout(); // visual twin: break-out burst
    g.renderer.flashA = 0.8;
    this.say('Oh no! ' + name + ' broke free after ' + shakesDone + ' shake' + (shakesDone === 1 ? '' : 's') + '!', () => {
      g.renderer.flashA = 0;
      // Break-out mood: it may attack immediately (foe gets a free move)
      this.playerAction = { type: 'ballthrown' };
      this.foeAction = this.chooseFoeAction();
      this.state = 'resolve';
      const mk = (side, action) => {
        const mon = side === 'ally' ? this.ally : this.foe;
        const stages = side === 'ally' ? this.allyStages : this.foeStages;
        const stats = this.effStats(mon, stages);
        let move = null, priority = 0;
        if (action.type === 'move') {
          move = MOVES[mon.moves[action.idx].id];
          priority = move.priority || 0;
        }
        return { side, action, mon, stats, priority, move };
      };
      this.actions = [mk('foe', this.foeAction)];
      this.nextAction();
    });
  }

  winTrainer() {
    const g = this.game;
    const t = this.trainer;
    this.state = 'victory';
    g.state.player.money += t.reward;
    g.state.story.flags['beat_' + t.id] = true;
    // No battle-message here: the capstone dialogue below ends the battle exactly once.
    this.msg = 'You defeated ' + t.title + ' ' + t.name + '! Got $' + t.reward + '.';
    this.msgOpen = false;
    if (t.badge) {
      g.state.badges.kanto.push(t.badge);
      g.audio.playSfx('badge'); // badge fanfare (visual twin: badge-case shine animation)
      const lines = SLICE_CAPSTONE.map((l) => l.replace('{player}', g.state.player.name));
      g.ui.say(lines, () => this.endBattle(true), '');
    } else {
      g.ui.say(t.lose, () => this.endBattle(true), t.name);
    }
  }

  finishVictory() {
    this.endBattle(true);
  }

  finishDefeat() {
    const g = this.game;
    // Defeat: fade -> Pokemon Center (overworld, healed, money halved) — architecture §2.2
    g.state.player.money = Math.floor(g.state.player.money / 2);
    this.endBattle(false);
    g.ui.say(['You hurried to the Pokemon Center...'], () => {
      const ow = this.returnTo;
      ow.loadMap('center');
      ow.player.tx = 4; ow.player.ty = 3; ow.player.px = 4 * TILE; ow.player.py = 3 * TILE;
      ow.player.fx = 4; ow.player.fy = 3;
      ow.trail = [];
      ow.healParty(false);
      g.state.story.position = { map: 'center', x: 4, y: 3, dir: 'down' };
      g.ui.toast('Your Pokemon were healed. (Lost half your money.)');
    });
  }

  endBattle(won) {
    const g = this.game;
    g.ui.setBattleMode(false);
    g.audio.restoreAreaMusic(); // back to the overworld's track
    g.renderer.shakeX = 0; g.renderer.shakeY = 0; g.renderer.flashA = 0;
    // Reset battle temp state on party mons
    for (const m of g.state.party) { m.confused = false; m.statusTurns = 0; }
    g.scenes.pop();
    g.autosave('battle');
  }

  drainHp(dt) {
    const g = this.game;
    const rate = HP_DRAIN_PER_SEC * dt;
    let dirty = false;
    if (this.hpAnim.ally !== this.ally.hp) {
      const d = this.ally.hp - this.hpAnim.ally;
      this.hpAnim.ally += Math.sign(d) * Math.min(Math.abs(d), rate);
      if (Math.abs(this.ally.hp - this.hpAnim.ally) < 1) this.hpAnim.ally = this.ally.hp;
      dirty = true;
    }
    if (this.hpAnim.foe !== this.foe.hp) {
      const d = this.foe.hp - this.hpAnim.foe;
      this.hpAnim.foe += Math.sign(d) * Math.min(Math.abs(d), rate);
      if (Math.abs(this.foe.hp - this.hpAnim.foe) < 1) this.hpAnim.foe = this.foe.hp;
      dirty = true;
    }
    // Low-HP warning jingle at first crossing into red (<25%), once per ally
    // (gameux §4.2). Visual twin: the HP plate's red pulse + ⚠ pip.
    if (this._lowHpAlly !== this.ally) { this._lowHpAlly = this.ally; this._lowHpWarned = false; }
    const ratio = this.ally.maxHp > 0 ? this.ally.hp / this.ally.maxHp : 1;
    if (ratio > 0.25) this._lowHpWarned = false;
    else if (!this._lowHpWarned && this.ally.hp > 0) {
      this._lowHpWarned = true;
      g.audio.playSfx('lowhp');
    }
    void dirty;
  }

  render(r) {
    const g = this.game;
    const w = r.viewW, h = r.viewH;
    // Battle background: banded vertical steps (max 5, gameux §6) per terrain.
    const bands = this.kind === 'trainer'
      ? ['#3a3a4a', '#4a4a5a', '#5a5a6a', '#6a6a7a', '#7a7a8a']
      : ['#2a6a3a', '#3a7a4a', '#4a8a5a', '#5a9a6a', '#6aaa7a'];
    for (let i = 0; i < 5; i++) {
      g.ctx2dfill(bands[i], 0, (h * i) / 5, w, h / 5 + 1);
    }
    r.begin();
    // Platforms: enemy upper-left, player lower-right (gameux §4.2)
    const foeSpr = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
    const allySpr = g.spriteCache[this.ally.speciesId] || g.spriteCache.partner;
    const bob = Math.sin(this.t * 0.004) * 2;
    r.blit(foeSpr, w * 0.62, h * 0.12 + bob);
    r.blit(allySpr, w * 0.14, h * 0.52 - bob);
    // Catch ball arc
    if (this.state === 'catchseq' && this.catchState.phase === 'throw') {
      const k = Math.min(1, this.catchState.t / 430);
      const bx = w * 0.2 + (w * 0.5) * k;
      const by = h * 0.6 - Math.sin(k * Math.PI) * h * 0.35;
      g.ctx2dcircle(bx, by, 5, '#e84040');
    }
    if (this.state === 'catchseq' && this.catchState.phase === 'shakes') {
      const wob = Math.sin(this.catchState.t * 0.05) * 3;
      g.ctx2dcircle(w * 0.7 + wob, h * 0.3, 6, '#e8e8f0');
      g.ctx2dcircle(w * 0.7 + wob, h * 0.3 - 2, 6, '#e84040');
    }
    r.end();
    // HP plates (Gen 5 idiom, original art)
    this.plate(r, 6, 6, this.foe, this.hpAnim.foe, false);
    this.plate(r, w - 110, h - 84, this.ally, this.hpAnim.ally, true);
    // Message box
    if (this.msgOpen || this.msg) {
      r.panel(4, h - 40, w - 8, 36, '#f8f8f0', '#202028');
      const txt = this.msg.length > 52 ? this.msg.slice(0, 52) : this.msg;
      r.text(txt, 10, h - 32, { size: 8, color: '#202028', shadow: false });
      if (this.msg.length > 52) r.text(this.msg.slice(52, 104), 10, h - 20, { size: 8, color: '#202028', shadow: false });
    }
    this.t += 16;
  }

  plate(r, x, y, mon, hpShown, isAlly) {
    const g = this.game;
    const sp = SPECIES[mon.speciesId];
    const w = 104, h = isAlly ? 30 : 22;
    r.panel(x, y, w, h, '#f0ead8', '#202028');
    r.text(displayName(mon, SPECIES), x + 4, y + 2, { size: 8, bold: true, color: '#202028', shadow: false });
    r.text('Lv' + mon.level, x + w - 26, y + 2, { size: 8, color: '#202028', shadow: false });
    r.hpBar(x + 4, y + 12, w - 8, 6, hpShown / mon.maxHp, g.state.settings.reducedMotion);
    if (isAlly) {
      r.text(Math.ceil(hpShown) + '/' + mon.maxHp, x + 4, y + 20, { size: 7, color: '#202028', shadow: false });
      if (mon.status) r.text(mon.status.toUpperCase().slice(0, 3), x + w - 24, y + 20, { size: 7, bold: true, color: '#a040a0', shadow: false });
    } else if (mon.status) {
      r.text(mon.status.toUpperCase().slice(0, 3), x + w - 24, y + 12, { size: 7, bold: true, color: '#a040a0', shadow: false });
    }
  }
}
