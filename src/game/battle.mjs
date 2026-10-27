// battle.mjs — turn-based battle state machine (architecture §2.2).
// States: intro | command | moves | bag | party | catchseq | resolve | faint |
//          xp | victory | defeat | run. Transitions are data-ish, no spaghetti.

import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { BALLS, ITEMS } from '../data/items.mjs';
import {
  effectiveness, calcDamage, stageMultiplier, accStageMultiplier, STAB_MULT,
  gen1Random, critChance, gen1Catch,
  xpYield, xpForLevel, statValue, hpValue,
} from '../engine/formulas.mjs';
import { roll, intIn } from '../engine/rng.mjs';
import { TILE, PT_FRAME, PT_FRAME2, PT_PAPER } from '../engine/render.mjs';
import { dexRegister, displayName, makeMon } from './state.mjs';
import { SFX } from '../engine/audio.mjs';
import { SLICE_CAPSTONE } from '../data/dialogue.mjs';
import { typePill } from './ui.mjs';

const HP_DRAIN_PER_SEC = 90; // ADR-004 feel budget

// UI v2 (Platinum standard): status chips for the databox — a solid DS-toned
// rect with the white bold 3-letter code as TEXT on it (never color alone).
// NOTE: burn keeps the legacy 'BUR' code — verify-slice's QA plate check
// asserts that exact text for a burned mon, so the DS 'BRN' abbreviation is
// the one deliberate deviation from Platinum spelling in this table.
const STATUS_CHIPS = {
  burn: ['BUR', '#c84028'],
  poison: ['PSN', '#9848a8'],
  badlyPoisoned: ['PSN', '#7038a0'],
  paralysis: ['PAR', '#b8860b'],
  sleep: ['SLP', '#68707e'],
  freeze: ['FRZ', '#2f88b8'],
};

// Fraction of the current level's XP bar filled (gameux §4.2).
function xpFracOf(mon, add) {
  const sp = SPECIES[mon.speciesId];
  const lo = xpForLevel(sp.growth, mon.level);
  const hi = xpForLevel(sp.growth, mon.level + 1);
  if (hi <= lo) return 1;
  return Math.max(0, Math.min(1, (mon.xp + (add || 0) - lo) / (hi - lo)));
}

// UI v2.3 (defect 4): deterministic 2D hash for arena texture work —
// the same (x, y) always yields the same value, so dither/speckle patterns
// are stable frame to frame (no shimmer) without any stored state.
function arenaHash(x, y) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export class BattleScene {
  constructor(opts) {
    this.kind = opts.kind; // 'wild' | 'trainer'
    this.foeMon = opts.foe;
    this.trainer = opts.trainer || null;
    this.safari = !!opts.safari; // Safari Zone: no ally actions, BALL/BAIT/ROCK/RUN
    this.onEnd = opts.onEnd || null; // story-event continuation callback
    this.uncatchable = !!opts.uncatchable; // scripted presences (the Tower ghost)
    this.onSafariAction = opts.onSafariAction || null; // overworld spends a step per action
    this.safariBait = false;
    this.safariRock = false;
    // ADR-020: real-time mode is the default battle flow; the tutorial and
    // Safari command battles stay on the classic engine, and the player can
    // choose Classic in Settings (opts.rt === false).
    this.rtMode = !opts.tutorial && !opts.safari && opts.rt !== false;
    this.rt = null;
    this.tutorial = !!opts.tutorial; // GD: scripted first-catch gate — certainty, not luck
    this.returnTo = opts.returnTo;
    this.arena = opts.arena || null; // UI v2.3: explicit backdrop variant (fishing = 'water'); else derived in arenaKind()
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
      if (t0.nickname) this.foeMon.nickname = t0.nickname; // e.g. the duo's named mons
    }
    this.ally = this.firstAble(g);
    this.foe = this.foeMon;
    this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    this.allyStages = this.ally.stages;
    if (this.allyStages.acc === undefined) { this.allyStages.acc = 0; this.allyStages.eva = 0; }
    // Fidelity pack (ADR-018): XP is split among participants — mons that
    // were active against THIS foe. Reset per foe in afterFaintFoe.
    this.participants = new Set([this.ally]);
    this.runAttempts = 0;
    this.turn = 1;
    this.actions = [];
    this.animQ = [];
    this.hpAnim = { ally: this.ally.hp, foe: this.foe.hp };
    this.xpAnim = 0;
    this.shakeT = 0;
    this.flashT = 0;
    this.fadeT = 0;      // P0/E11: reduced-motion substitute for shake/flash (100ms fade)
    this.atkFx = null;   // { side, t } — README attack transform: 1.2x for 3 frames then back
    this.impactFx = null; // { side, t } — README impact: white palette-swap 2 frames + shake
    this.faintFx = null;  // { side, spr, t } — README faint: sink 8px + fade to 0 over 20 frames
    this.xpBarAnim = null; // [{ mon, from, to }] — P0/E3 XP bar ease-out over 600ms
    this.xpFlashT = 0;    // level-up flash on the XP bar
    this._lastMoveIdx = 0; // P0/E9: cursor memory (last-used move pre-selected)
    this._lowHpPulseT = 0; // P1/E7: plate pulse on first red crossing (skipped under reduced motion)
    this._tutFightDone = false; // P0/C7: guided first-catch tutorial stage flags
    this._tutStage = null;
    this.catchFx = null; // P1/E10: success starburst after the catch click
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
    } else if (this.kind === 'trainer') {
      // GB-era flow idiom: challenge line, then the lead's send-out.
      this.say('Trainer ' + this.trainer.name + ' wants to battle!', () => {
        this.say(this.trainer.name + ' sent out ' + foeName + '!', () => this.toCommand());
      });
    } else {
      this.say('Wild ' + foeName + ' appeared!');
    }
  }

  safariFleeCheck() {
    // Safari flee model (ADR-019 simplification, documented): base 10%,
    // rock +15%, bait -8%, skittish species (catch rate <= 45) +5%.
    const g = this.game;
    const rate = SPECIES[this.foe.speciesId].catchRate;
    let p = 0.10 + (this.safariRock ? 0.15 : 0) - (this.safariBait ? 0.08 : 0) + (rate <= 45 ? 0.05 : 0);
    if (roll(Math.max(0.02, p), g.rng.battle)) {
      this.say('Wild ' + displayName(this.foe, SPECIES) + ' fled!', () => this.endBattle(true));
      return true;
    }
    return false;
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
    const st = g.state.settings;
    // Screen shake / flash decay — P0/E11: gated on the Screen-shake option +
    // reduced motion (assignment is gated at the source; decay is unconditional).
    if (this.shakeT > 0) { this.shakeT -= dt * 1000; g.renderer.shakeX = (Math.random() - 0.5) * 8; g.renderer.shakeY = (Math.random() - 0.5) * 8; }
    else { g.renderer.shakeX = 0; g.renderer.shakeY = 0; }
    if (this.flashT > 0) { this.flashT -= dt * 1000; g.renderer.flashA = Math.max(0, this.flashT / 60) * 0.8; }
    // P0/E11: reduced-motion substitute — a gentle 100ms fade instead of shake/flash.
    if (this.fadeT > 0) {
      this.fadeT -= dt * 1000;
      g.renderer.fadeA = Math.max(0, this.fadeT / 100) * 0.35;
      g.renderer.fadeColor = '#ffffff';
      if (this.fadeT <= 0) g.renderer.fadeA = 0;
    }
    // README runtime transforms.
    if (this.atkFx) { this.atkFx.t += dt * 1000; if (this.atkFx.t > 100) this.atkFx = null; } // 3 frames @30Hz
    if (this.impactFx) { this.impactFx.t += dt * 1000; if (this.impactFx.t > 66) this.impactFx = null; } // 2 frames
    if (this.faintFx) { this.faintFx.t += dt * 1000; if (this.faintFx.t > 660) this.faintFx = null; } // 20 frames
    if (this.catchFx) { this.catchFx.t += dt * 1000; if (this.catchFx.t > 500) this.catchFx = null; } // P1/E10 starburst
    if (this.xpFlashT > 0) this.xpFlashT -= dt * 1000;
    if (this._lowHpPulseT > 0) this._lowHpPulseT -= dt * 1000;

    // Animated HP drain (90 HP/s) — P0/E5: reduced motion snaps instantly.
    this.drainHp(dt);

    // UI v2.3: RT cooldown clocks tick even while a battle menu/dialogue
    // freezes the arena — the unified FIGHT window displays live cooldowns,
    // and a cooling move must be able to come back while the player is
    // deciding (previously the clocks only ran inside updateRt, which the
    // modal UI starves, so a move picked from the window could deadlock
    // on its own cooldown). updateRt ticks the same clocks when unfrozen;
    // the two paths are mutually exclusive per frame.
    if (this.rtMode && this.rt && this.state === 'rt' && typeof this.rtTickClocks === 'function' && this.rtFrozen()) this.rtTickClocks(dt * 1000);

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
      case 'rt': this.updateRt(dt); break;
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
    if (this.rtMode) {
      // ADR-020: real-time flow replaces the command menu. First call enters
      // the arena; a NEW foe (trainer sent out the next mon) resets it;
      // anything else (party-menu return) just resumes.
      if (!this.rt) this.rtInit();
      else if (this.foe !== this._rtLastFoe) this.rtResetFoe();
      else this.state = 'rt';
      return;
    }
    if (this.safari) {
      const balls = this.game.state.bag.safariball || 0;
      const items = [
        { label: 'SAFARI BALL x' + balls, value: 'safariball', disabled: balls <= 0 },
        { label: 'BAIT', value: 'bait' },
        { label: 'ROCK', value: 'rock' },
        { label: 'RUN', value: 'safarirun' },
      ];
      this.game.ui.showCommands(items, (value) => this.onCommand(value), { stickyCancel: true });
      return;
    }
    // P0/C7: guided first-catch tutorial — FIGHT highlighted first (others dimmed),
    // then BAG highlighted once the foe is weakened. Dimmed = de-emphasized, still usable.
    const tut = this.tutorial;
    const items = [
      { label: 'FIGHT', value: 'fight', dimmed: tut && this._tutStage === 'bag' },
      { label: 'BAG', value: 'bag', dimmed: tut && this._tutStage !== 'bag' },
      { label: 'PARTY', value: 'party', dimmed: tut },
      // GD: no running from the scripted tutorial — it's a lesson, not a gamble.
      { label: this.kind === 'wild' ? 'RUN' : 'RUN', value: 'run', disabled: this.kind !== 'wild' || tut },
    ];
    let focus = null;
    if (tut && !this._tutFightDone) focus = 'fight';
    else if (tut && this._tutStage === 'bag') focus = 'bag';
    this.game.ui.showCommands(items, (value) => this.onCommand(value), { focus, stickyCancel: true });
  }

  updateCommand() { /* menu modal drives via ui */ }

  onCommand(value) {
    const g = this.game;
    if (value === null) { this.toCommand(); return; } // cancelled -> back
    if (this.safari) {
      if (this.onSafariAction) this.onSafariAction();
      if (value === 'safarirun') { this.endBattle(true); return; }
      if (value === 'safariball') { this.beginCatch('safariball'); return; }
      if (value === 'bait' || value === 'rock') {
        if (value === 'bait') { this.safariBait = true; this.safariRock = false; }
        else { this.safariRock = true; this.safariBait = false; }
        const name = displayName(this.foe, SPECIES);
        this.say(value === 'bait' ? 'You threw bait! ' + name + ' is eating...' : 'You threw a rock! ' + name + ' is angry!', () => {
          if (this.safariFleeCheck()) return;
          this.toCommand();
        });
        return;
      }
    }
    if (value === 'fight') {
      // P0/E9: 2x2 move grid — name + type badge pill (icon+text) + PP + power/acc;
      // 0-PP rows grayed with a slash; cursor memory pre-selects the last-used move.
      const ally = this.ally;
      const items = ally.moves.map((m, i) => {
        const mv = MOVES[m.id];
        const disabledMove = ally.disableT > 0 && ally.disabledMove === i;
        return {
          label: mv.name + ' (' + mv.type + ') ' + m.pp + '/' + m.maxPp,
          value: i, disabled: m.pp <= 0 || disabledMove, zeroPp: m.pp <= 0, move: m,
        };
      });
      items.push({ label: 'Back', value: -1, wide: true });
      this.state = 'moves';
      const rowHtml = (it) => {
        if (it.value === -1) return '<span>' + it.label + '</span>';
        const mv = MOVES[it.move.id];
        return '<span class="mvcell"><span class="mvname">' + mv.name + '</span>'
          + typePill(mv.type)
          + '<span class="mvpp">' + it.move.pp + '/' + it.move.maxPp + ' PP</span>'
          + '<span class="mvpow">' + (mv.power || '—') + ' pw / ' + (mv.acc || '—') + ' ac</span></span>';
      };
      g.ui.showMenu('Choose a move', items, (v) => {
        if (v === null || v === -1) { this.toCommand(); return; }
        this._lastMoveIdx = v; // P0/E9 cursor memory
        this.playerAction = { type: 'move', idx: v };
        this.foeAction = this.chooseFoeAction();
        this.beginTurn();
      }, { battle: true, grid: true, initialIdx: Math.min(this._lastMoveIdx, items.length - 1), rowHtml, menuClass: 'battlewin' });
    } else if (value === 'bag') {
      this.state = 'bag';
      const items = [];
      for (const bid of Object.keys(BALLS)) {
        const n = g.state.bag[bid] || 0;
        items.push({ label: BALLS[bid].name + ' x' + n, value: bid, disabled: n <= 0 || this.kind !== 'wild', pocket: 'balls' });
      }
      // AUDIT FIX (S-14): the battle bag used to stock ONLY plain Potion —
      // every other medicine the player owned was unreachable in battle.
      // It now carries the full battle-usable medicine pocket (heals,
      // cures, revives, PP — data/items.mjs semantics, field-identical).
      const meds = this.battleMedicineIds();
      for (const mid of meds) {
        items.push({ label: ITEMS[mid].name + ' x' + g.state.bag[mid], value: mid, pocket: 'medicine' });
      }
      items.push({ label: 'Back', value: null });
      // P0/C7: in the guided tutorial, the Poke Ball row is highlighted once the foe is weakened.
      const focusBall = this.tutorial && this._tutStage === 'bag';
      g.ui.showMenu('Bag', items, (v) => {
        if (v === null) { this.toCommand(); return; }
        // Balls live in ITEMS too (pocket 'balls') — BALLS membership is
        // the dispatch test, medicine is everything else.
        if (!BALLS[v] && ITEMS[v]) { this.useBattleItem(v); return; }
        this.playerAction = { type: 'ball', ball: v };
        this.foeAction = null; // throwing a ball: foe still acts? DS: ball replaces your move; foe moves first if faster. Simplify: foe acts after throw fails only.
        this.beginCatch(v);
      }, { focusValue: focusBall ? 'pokeball' : null, menuClass: 'battlewin bagwin', bagTabs: meds.length ? ['balls', 'medicine'] : ['balls'] });
    } else if (value === 'party') {
      this.openPartyMenu(false);
    } else if (value === 'run') {
      if (this.kind === 'wild') {
        // Gen-1 escape formula (ADR-018): F = allySpe*128/foeSpe + 30*attempts;
        // escape iff F > 255 or a 0-255 roll lands under F. Failure costs the
        // turn — the foe acts.
        this.runAttempts++;
        const allySpe = Math.max(1, this.ally.stats.spe);
        const foeSpe = Math.max(1, this.foe.stats.spe);
        const F = Math.floor((allySpe * 128) / foeSpe) + 30 * this.runAttempts;
        if (F > 255 || Math.floor(g.rng.battle() * 256) < F) {
          g.audio.playSfx('battle-run');
          this.say('Got away safely!', () => this.endBattle(true));
        } else {
          this.say("Can't escape!", () => {
            this.playerAction = { type: 'ran' };
            this.foeAction = this.chooseFoeAction();
            this.state = 'resolve';
            const mkFoe = (action) => {
              const mon = this.foe;
              const stats = this.effStats(mon, this.foeStages);
              const move = action.type === 'move' ? MOVES[mon.moves[action.idx].id] : null;
              return { side: 'foe', action, mon, stats, priority: move ? (move.priority || 0) : 0, move };
            };
            this.actions = [mkFoe(this.foeAction)];
            this.nextAction();
          });
        }
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
    // AUDIT FIX (S-12, blocker): a forced faint switch has NO way out in
    // Platinum — offering Back (or honouring B/Esc) consumed the menu and
    // stranded the battle with no command state. No Back row in faint
    // mode, and a cancel simply re-opens the forced choice.
    if (!inFaint) items.push({ label: 'Back', value: -1 });
    g.ui.showMenu(inFaint ? 'Choose next Pokemon' : 'Party', items, (v) => {
      if (v === null || v === -1) { if (inFaint) this.openPartyMenu(true); else this.toCommand(); return; }
      const old = this.ally;
      this.ally = g.state.party[v];
      this.allyStages = this.ally.stages;
      if (this.allyStages.acc === undefined) { this.allyStages.acc = 0; this.allyStages.eva = 0; }
      this.participants.add(this.ally); // switched-in mons share this foe's XP
      this.hpAnim.ally = this.ally.hp;
      if (inFaint) {
        this.say('Go! ' + displayName(this.ally, SPECIES) + '!', () => this.toCommand());
      } else if (this.rtMode) {
        // ADR-020: live switching — no turn is spent; the incoming mon is
        // briefly vulnerable (no dodge i-frames) as the switch cost.
        this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
          if (this.rt) { this.rt.switchVulnT = 1000; this.rt.iframes = 0; this.state = 'rt'; }
          else this.toCommand();
        });
      } else {
        this.say('Come back! Go! ' + displayName(this.ally, SPECIES) + '!', () => {
          this.playerAction = { type: 'switch', from: old };
          this.foeAction = this.chooseFoeAction();
          this.beginTurn();
        });
      }
    });
  }

  // ---- AUDIT FIX (S-14): full battle medicine (shared with RT) ----
  // Battle-usable = medicine pocket minus level-ups (Rare Candy's
  // mid-battle evolution flow doesn't exist; honest exclusion, register).
  battleMedicineIds() {
    const g = this.game;
    return Object.keys(ITEMS).filter((id) => {
      const it = ITEMS[id];
      return it.pocket === 'medicine' && !it.levelUp && (g.state.bag[id] || 0) > 0;
    });
  }

  // Same applicability rules as the field bag (main-systems.mjs), with one
  // Platinum correction: a heal that also cures status works at full HP
  // when the target is statused.
  medicineDisabledFor(it, m) {
    if (it.revive) return m.hp > 0;
    if (it.cure) return m.hp <= 0 || (it.cure !== 'all' && m.status !== it.cure) || (it.cure === 'all' && !m.status);
    if (it.heal) return m.hp <= 0 || (m.hp >= m.maxHp && !(it.cureStatus && m.status));
    if (it.ppRestore || it.ppRestoreAll) return m.hp <= 0;
    return true;
  }

  // Applies the item's effect to mon m; moveIdx only for ppRestore.
  // Returns the result line. Caller owns the bag decrement + turn flow.
  applyMedicineTo(itemId, m, moveIdx) {
    const it = ITEMS[itemId];
    const name = displayName(m, SPECIES);
    if (it.revive) { m.hp = Math.floor(m.maxHp * it.revive); m.status = null; return name + ' was revived!'; }
    if (it.heal) {
      const before = m.hp;
      const hadStatus = m.status;
      m.hp = Math.min(m.maxHp, m.hp + it.heal);
      if (it.cureStatus) m.status = null;
      const gained = m.hp - before;
      if (gained > 0) return name + ' recovered ' + gained + ' HP!';
      if (it.cureStatus && hadStatus) return name + ' was cured of its status!';
      return name + ' recovered HP!';
    }
    if (it.cure) { m.status = null; m.confused = false; return name + ' was cured of its status!'; }
    if (it.ppRestore && moveIdx !== null && moveIdx !== undefined) {
      const mv = m.moves[moveIdx];
      mv.pp = Math.min(mv.maxPp, mv.pp + it.ppRestore);
      return MOVES[mv.id].name + "'s PP was restored!";
    }
    if (it.ppRestoreAll) { for (const mv of m.moves) mv.pp = Math.min(mv.maxPp, mv.pp + it.ppRestoreAll); return name + "'s PP was restored!"; }
    return it.name + ' used.';
  }

  useBattleItem(itemId) {
    const g = this.game;
    const it = ITEMS[itemId];
    const targets = g.state.party.map((m, i) => ({
      label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp + (m.status ? ' [' + m.status + ']' : ''),
      value: i, disabled: this.medicineDisabledFor(it, m),
    }));
    targets.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Use ' + it.name + ' on...', targets, (v) => {
      // AUDIT FIX (S-37b): Back returns to the battle Bag it came from,
      // not all the way to the command grid.
      if (v === null || v === -1) { this.onCommand('bag'); return; }
      const m = g.state.party[v];
      const finishUse = (line) => {
        g.state.bag[itemId]--;
        if (m === this.ally) this.hpAnim.ally = m.hp; // snap if active
        g.audio.playSfx('heal');
        this.say(line, () => {
          this.playerAction = { type: 'item' };
          this.foeAction = this.chooseFoeAction();
          this.beginTurn();
        });
      };
      if (it.ppRestore) {
        const mvItems = m.moves.map((mv, mi) => ({
          label: MOVES[mv.id].name + ' ' + mv.pp + '/' + mv.maxPp, value: mi, disabled: mv.pp >= mv.maxPp,
        }));
        mvItems.push({ label: 'Back', value: -1 });
        g.ui.showMenu('Restore which move?', mvItems, (mi) => {
          if (mi === null || mi === -1) { this.useBattleItem(itemId); return; }
          finishUse(this.applyMedicineTo(itemId, m, mi));
        }, { menuClass: 'battlewin' });
        return;
      }
      finishUse(this.applyMedicineTo(itemId, m, null));
    }, { menuClass: 'battlewin' });
  }

  chooseFoeAction() {
    const g = this.game;
    const usable = this.foe.moves.map((m, i) => i).filter((i) => this.foe.moves[i].pp > 0
      && !(this.foe.disableT > 0 && this.foe.disabledMove === i));
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
    // Gen-1 AI tempering (ADR-018): ordinary trainers pick near-randomly —
    // the original's AI rarely optimizes. Leaders (ai:'smart') and the
    // Elite Four prefer super-effective lines.
    const smart = this.trainer && (this.trainer.ai === 'smart' || this.trainer.ai === 'opener-setup');
    if (!smart) {
      return { type: 'move', idx: usable[Math.floor(g.rng.battle() * usable.length)] };
    }
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
    if (this.ally) this.ally.tookPhysicalThisTurn = 0;
    if (this.foe) this.foe.tookPhysicalThisTurn = 0;
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

    // Status gates — Generation-I semantics (ADR-018).
    if (atk.flinched) {
      atk.flinched = false;
      this.say(atkName + ' flinched and couldn\'t move!', () => this.nextAction());
      return;
    }
    if (atk.mustRecharge) {
      atk.mustRecharge = false;
      this.say(atkName + ' must recharge!', () => this.nextAction());
      return;
    }
    if (atk.status === 'paralysis' && roll(0.25, g.rng.battle)) {
      this.say(atkName + ' is paralyzed! It can\'t move!', () => this.nextAction());
      return;
    }
    if (atk.status === 'sleep') {
      // Gen 1: sleep lasts 1-7 turns, and the turn you wake up is lost.
      if (atk.sleepTurns === undefined || atk.sleepTurns === null) atk.sleepTurns = 1 + Math.floor(g.rng.battle() * 7);
      atk.sleepTurns--;
      if (atk.sleepTurns > 0) { this.say(atkName + ' is fast asleep.', () => this.nextAction()); return; }
      atk.status = null; atk.sleepTurns = null;
      this.say(atkName + ' woke up!', () => this.nextAction());
      return;
    }
    if (atk.status === 'freeze') {
      // Gen 1: no random thaw — only a Fire-type hit thaws (in damage code).
      this.say(atkName + ' is frozen solid!', () => this.nextAction());
      return;
    }
    if (atk.confused) {
      if (atk.confusedTurns === undefined || atk.confusedTurns === null) atk.confusedTurns = 2 + Math.floor(g.rng.battle() * 4);
      atk.confusedTurns--;
      if (atk.confusedTurns <= 0) {
        atk.confused = false; atk.confusedTurns = null;
        this.say(atkName + ' snapped out of confusion!', () => this.execMoveContinue(entry));
        return;
      }
      if (roll(0.5, g.rng.battle)) {
        // Gen 1: 50% self-hit at full typeless 40-power formula (no halving).
        const dmg = Math.max(1, calcDamage(atk.level, 40, entry.stats.atk, entry.stats.def, {}));
        atk.hp = Math.max(0, atk.hp - dmg);
        this.say(atkName + ' hurt itself in confusion!', () => this.checkFaint(entry.side, () => this.nextAction()));
        return;
      }
    }
    this.execMoveContinue(entry);
  }

  execMoveContinue(entry) {
    const g = this.game;
    const atk = entry.mon;
    let mv = entry.move;
    const foeSide = entry.side === 'ally' ? 'foe' : 'ally';
    const def = foeSide === 'ally' ? this.ally : this.foe;
    const defStages = foeSide === 'ally' ? this.allyStages : this.foeStages;
    const atkName = displayName(atk, SPECIES);
    const defName = displayName(def, SPECIES);

    // Lock-in moves (Wrap/Petal Dance family): the mon keeps using the move
    // until the lock expires; Petal Dance confuses the user afterwards.
    if (atk.lockMove && entry.action && entry.action.type === 'move') {
      entry.action.idx = atk.lockMove.idx;
      mv = MOVES[atk.moves[atk.lockMove.idx].id] || mv;
    }

    // Two-turn charge moves (Solar Beam / Dig / Fly family): first use
    // charges (no PP cost), the locked follow-up executes.
    if (mv.charge && !atk.chargedFor) {
      atk.chargedFor = mv.id;
      atk.lockMove = entry.action && entry.action.type === 'move' ? { idx: entry.action.idx, left: 1, after: null } : null;
      this.say(atkName + ' used ' + mv.name + '!', () => {
        this.say(atkName + ' is charging up!', () => this.nextAction());
      });
      return;
    }
    if (atk.chargedFor === mv.id) atk.chargedFor = null;

    // PP
    if (entry.action && !entry.action.struggle && entry.action.type === 'move') {
      const slot = atk.moves[entry.action.idx];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
      atk.lastMoveIdx = entry.action.idx;
    }

    // Bide: accumulate for 2 turns, then release double the damage taken.
    if (mv.effect && mv.effect.bide) {
      if (!atk.bideT) { atk.bideT = 2; atk.bideDmg = 0; this.say(atkName + ' used Bide!', () => this.nextAction()); return; }
      const bd = atk.bideDmg * 2; atk.bideT = 0; atk.bideDmg = 0;
      if (bd <= 0) { this.say(atkName + ' used Bide! But it failed!', () => this.nextAction()); return; }
      def.hp = Math.max(0, def.hp - bd);
      this.say(atkName + ' unleashed energy!', () => this.checkFaint(foeSide, () => this.nextAction()));
      return;
    }
    if (atk.bideT) atk.bideT--;

    // Metronome: become a random other move.
    if (mv.effect && mv.effect.metronome) {
      const pool = Object.keys(MOVES).filter((k) => !['metronome', 'mimic', 'transform', 'bide'].includes(k));
      const pick = pool[Math.floor(g.rng.battle() * pool.length)];
      entry.metronomeMove = MOVES[pick];
      this.say(atkName + ' used Metronome!', () => { entry.move = MOVES[pick]; this.execMoveContinue(entry); });
      return;
    }

    // Accuracy — Gen 1 (ADR-018): move acc x acc/eva stage multiplier;
    // even 100%-acc moves miss 1/256 of the time; neverMiss skips all rolls.
    // OHKO moves use their own Gen-1 rule: hit chance (userLv - targetLv
    // + 30) / 256 — they cannot touch a sufficiently higher-level target.
    const atkStages = entry.side === 'ally' ? this.allyStages : this.foeStages;
    if ((mv.effect && mv.effect.ohko) || mv.ohko) {
      const pOhko = Math.max(0, Math.min(255, atk.level - def.level + 30)) / 256;
      if (!roll(pOhko, g.rng.battle)) {
        this.say(atkName + ' used ' + mv.name + '!', () => {
          this.say('But it missed!', () => this.nextAction());
        });
        return;
      }
    } else if (!mv.neverMiss) {
      const stageDelta = (atkStages.acc || 0) - (defStages.eva || 0);
      let p = ((mv.acc || 100) / 100) * accStageMultiplier(Math.max(-6, Math.min(6, stageDelta)));
      if (p >= 1) p = 255 / 256;
      if (!roll(p, g.rng.battle)) {
        this.say(atkName + ' used ' + mv.name + '!', () => {
          this.say('But it missed!', () => this.nextAction());
        });
        return;
      }
    }

    this.say(atkName + ' used ' + mv.name + '!', () => {
      if (mv.cat === 'status') { this.applyStatusMove(entry, mv); return; }
      const efx = mv.effect || {};
      const atkTypes = atk.tempTypes || (atk.transformed ? atk.transformed.types : SPECIES[atk.speciesId].types);
      const defTypes = def.tempTypes || (def.transformed ? def.transformed.types : SPECIES[def.speciesId].types);
      const eff = effectiveness(mv.type, defTypes);
      const stab = atkTypes.includes(mv.type);
      if (eff === 0) {
        this.say('It doesn\'t affect ' + defName + '...', () => this.nextAction());
        return;
      }
      // Dream Eater only works on a sleeping target.
      if (efx.requiresSleep && def.status !== 'sleep') {
        this.say('But it failed! The target is not asleep!', () => this.nextAction());
        return;
      }
      // Counter: succeeds only if the user took physical damage this turn.
      if (efx.counter) {
        const taken = atk.tookPhysicalThisTurn || 0;
        if (taken <= 0) { this.say('But it failed!', () => this.nextAction()); return; }
        def.hp = Math.max(0, def.hp - taken * 2);
        this.say(defName + ' took ' + (taken * 2) + ' damage!', () => this.checkFaint(foeSide, () => this.nextAction()));
        return;
      }
      const baseSpe = (atk.transformed ? atk.transformed.baseSpe : SPECIES[atk.speciesId].base.spe);
      const crit = roll(critChance(baseSpe, { highCrit: !!mv.highcrit, focus: !!atk.focused }), g.rng.battle);
      // Gen 1 crits ignore ALL stat stages (raw stats both sides).
      const atkStat = mv.cat === 'physical'
        ? (crit ? atk.stats.atk : entry.stats.atk)
        : (crit ? atk.stats.spa : entry.stats.spa);
      const defStat = mv.cat === 'physical'
        ? (crit ? def.stats.def : Math.floor(def.stats.def * stageMultiplier(defStages.def)))
        : (crit ? def.stats.spd : Math.floor(def.stats.spd * stageMultiplier(defStages.spd)));
      const burn = atk.status === 'burn';
      if (entry.side === 'ally' && atk.speciesId === 'partner' && (crit || eff > 1)) {
        g.state.pikachu.mood = 'happy';
      }
      // Damage amount: fixed / level-scaled / OHKO / standard formula.
      let dmg;
      if (mv.ohko || efx.ohko) dmg = def.hp;
      else if (efx.fixed) dmg = efx.fixed;
      else if (efx.fixedLevel) dmg = atk.level;
      else if (efx.psywave) dmg = Math.max(1, Math.floor(atk.level * (0.5 + g.rng.battle())));
      else {
        const hits = efx.hits ? (efx.hits[0] + Math.floor(g.rng.battle() * (efx.hits[1] - efx.hits[0] + 1))) : 1;
        dmg = 0;
        for (let hi = 0; hi < hits; hi++) {
          dmg += calcDamage(atk.level, mv.power, atkStat, defStat,
            { stab, effectiveness: eff, crit, random: gen1Random(g.rng.battle), burn, physical: mv.cat === 'physical' });
        }
        if (hits > 1) this._hitCount = hits;
      }
      // Reflect / Light Screen halve the matching category while active.
      if (mv.cat === 'physical' && def.reflectT > 0) dmg = Math.max(1, Math.floor(dmg / 2));
      if (mv.cat === 'special' && def.lightT > 0) dmg = Math.max(1, Math.floor(dmg / 2));
      // Substitute absorbs the hit.
      let subBroke = false;
      if (def.subHp > 0) {
        def.subHp -= dmg;
        if (def.subHp <= 0) { def.subHp = 0; subBroke = true; }
        dmg = 0;
      }
      if (dmg > 0) {
        def.hp = Math.max(0, def.hp - dmg);
        if (mv.cat === 'physical') def.tookPhysicalThisTurn = (def.tookPhysicalThisTurn || 0) + dmg;
        if (def.bideT) def.bideDmg = (def.bideDmg || 0) + dmg;
        // Gen 1: a Fire-type hit thaws a frozen defender.
        if (def.status === 'freeze' && mv.type === 'fire') def.status = null;
      }
      // GD tutorial: the lesson mon endures at 1 HP — the gate teaches
      // catching, so the only exit is a (guaranteed, once weakened) catch.
      let hungOn = false;
      if (this.tutorial && foeSide === 'foe' && def.hp <= 0) {
        def.hp = 1;
        hungOn = !this._endureShown;
        this._endureShown = true;
      }
      if (hungOn) this._tutStage = 'bag'; // P0/C7: foe weakened -> BAG highlight next
      // P0/C7: the tutorial's first damaging move retires the FIGHT highlight.
      if (this.tutorial && entry.side === 'ally' && mv.cat !== 'status') this._tutFightDone = true;
      // README attack transform: the attacker's sprite scales 1.2x for 3 frames.
      // P1/E12: Battle animations OFF skips the lunge/impact anims entirely.
      const animsOn = g.state.settings.battleAnims !== false;
      if (animsOn) this.atkFx = { side: entry.side, t: 0 };
      // Impact theater — P0/E11: shake/flash gated on the Screen-shake option
      // and reduced motion; reduced motion gets a 100ms fade instead.
      const canShake = animsOn && !g.state.settings.reducedMotion && g.state.settings.shake;
      if (canShake) {
        if (eff > 1) { this.shakeT = 120; this.flashT = 60; }
        else if (eff < 1) { this.shakeT = 60; }
        if (crit) this.flashT = 90;
        // README impact: white palette-swap on the defender for 2 frames + shake.
        if (eff !== 1 || crit) this.impactFx = { side: foeSide, t: 0 };
        // P1/I5: haptic tick on super-effective (guarded; mobile only).
        if (eff > 1 && g.state.settings.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(30); } catch (e) { /* no haptics */ }
        }
      } else if (animsOn && g.state.settings.reducedMotion && (eff !== 1 || crit)) {
        this.fadeT = 100;
      }
      g.audio.hitFeedback(eff); // sound picks the effectiveness tier (visual twin: shake/flash)
      let extra = '';
      if (crit) extra = ' A critical hit!';
      if (eff > 1) extra += " It's super effective!";
      else if (eff < 1) extra += " It's not very effective...";
      const after = () => {
        // Secondary effects, then the damage line.
        let msg2 = hungOn
          ? defName + ' hung on with 1 HP! Now — open the BAG and throw a Poke Ball!'
          : (subBroke ? 'The substitute broke!' : defName + ' took ' + dmg + ' damage!');
        if (this._hitCount) { msg2 += ' Hit ' + this._hitCount + ' times!'; this._hitCount = 0; }
        if (mv.ohko || efx.ohko) msg2 = 'One-hit KO!';
        // Status infliction (single status or Tri Attack's random pick).
        let statusRoll = efx.status;
        if (efx.statusAny) statusRoll = efx.statusAny[Math.floor(g.rng.battle() * efx.statusAny.length)];
        if (statusRoll && def.hp > 0 && (!efx.chance || roll(efx.chance / 100, g.rng.battle))) {
          if (statusRoll === 'confusion') {
            if (!def.confused) { def.confused = true; def.confusedTurns = 2 + Math.floor(g.rng.battle() * 4); msg2 = defName + ' became confused!'; }
          } else if (!def.status) {
            def.status = statusRoll;
            if (statusRoll === 'sleep') def.sleepTurns = null;
            msg2 = defName + this.statusText(statusRoll);
          }
        }
        // Stage changes riding on a damaging move (Bubble Beam family).
        for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) {
          if (efx[k] && def.hp > 0 && (!efx.stageChance || roll(efx.stageChance / 100, g.rng.battle))) {
            if (!(def.mistT > 0 && efx[k] < 0)) {
              defStages[k] = Math.max(-6, Math.min(6, (defStages[k] || 0) + efx[k]));
            }
          }
        }
        if (efx.flinch && def.hp > 0 && roll(efx.flinch / 100, g.rng.battle)) def.flinched = true;
        if (efx.seed && def.hp > 0) def.seeded = true;
        if (efx.drain && dmg > 0) {
          atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(dmg * efx.drain));
        }
        if (efx.payday) g.state.player.money += atk.level * 2;
        if (mv.recharge) atk.mustRecharge = true;
        // Lock bookkeeping for Wrap / thrash-family moves.
        if (efx.multi || efx.multiTurn) {
          if (!atk.lockMove && entry.action && entry.action.type === 'move') {
            atk.lockMove = { idx: entry.action.idx, left: 1 + Math.floor(g.rng.battle() * 2), after: efx.multiTurn ? 'confuse' : null };
          }
        }
        if (atk.lockMove && entry.action && entry.action.type === 'move' && entry.action.idx === atk.lockMove.idx) {
          atk.lockMove.left--;
          if (atk.lockMove.left <= 0) {
            const afterLock = atk.lockMove.after;
            atk.lockMove = null;
            if (afterLock === 'confuse' && atk.hp > 0) { atk.confused = true; atk.confusedTurns = 2 + Math.floor(g.rng.battle() * 4); }
          }
        }
        const finishMove = () => {
          if (efx.selfFaint && atk.hp > 0) {
            atk.hp = 0;
            this.checkFaint(entry.side, () => this.nextAction());
            return;
          }
          if (efx.recoil && dmg > 0 && atk.hp > 0) {
            atk.hp = Math.max(0, atk.hp - Math.max(1, Math.floor(dmg * efx.recoil)));
            this.checkFaint(entry.side, () => this.nextAction());
            return;
          }
          this.nextAction();
        };
        this.say(msg2, () => {
          this.checkFaint(foeSide, finishMove);
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
    const atk = entry.mon;
    const selfSide = entry.side;
    const foeSide = selfSide === 'ally' ? 'foe' : 'ally';
    const foeMon = foeSide === 'ally' ? this.ally : this.foe;
    const target = ef.target === 'self' ? atk : foeMon;
    const stages = ef.target === 'self' ? (selfSide === 'ally' ? this.allyStages : this.foeStages) : (foeSide === 'ally' ? this.allyStages : this.foeStages);
    const tName = displayName(target, SPECIES);
    const aName = displayName(atk, SPECIES);
    const done = (msg) => this.say(msg, () => this.nextAction());
    // Teleport: flee a wild battle; fails against trainers.
    if (ef.flee) {
      if (this.kind === 'wild') { this.say(aName + ' teleported away!', () => this.endBattle(true)); return; }
      done('But it failed!'); return;
    }
    if (ef.haze) {
      for (const s of [this.allyStages, this.foeStages]) for (const k of Object.keys(s)) s[k] = 0;
      if (foeMon.status) foeMon.status = null;
      foeMon.confused = false;
      done('All stat changes were eliminated!');
      return;
    }
    if (ef.heal) {
      if (target.hp >= target.maxHp) { done('But it failed!'); return; }
      target.hp = Math.min(target.maxHp, target.hp + Math.floor(target.maxHp * ef.heal));
      done(tName + ' regained health!');
      return;
    }
    if (ef.rest) {
      target.hp = target.maxHp;
      target.status = 'sleep';
      target.sleepTurns = 3; // Gen 1 Rest: exactly 2 full turns asleep
      done(tName + ' slept and became healthy!');
      return;
    }
    if (ef.substitute) {
      const cost = Math.floor(target.maxHp / 4);
      if (target.subHp > 0 || target.hp <= cost) { done('But it failed!'); return; }
      target.hp -= cost;
      target.subHp = cost;
      done(tName + ' made a substitute!');
      return;
    }
    if (ef.screen) {
      if (ef.screen === 'physical') atk.reflectT = 5; else atk.lightT = 5;
      done(ef.screen === 'physical' ? 'A wall of light weakened physical attacks!' : 'A wall of light weakened special attacks!');
      return;
    }
    if (ef.mist) { atk.mistT = 5; done(aName + ' is shrouded in mist!'); return; }
    if (ef.focus) { atk.focused = true; done(aName + ' is getting pumped!'); return; }
    if (ef.seed) {
      if (foeMon.seeded) { done('But it failed!'); return; }
      foeMon.seeded = true;
      done('Seeds were planted on ' + tName + '!');
      return;
    }
    if (ef.disable) {
      if (foeMon.lastMoveIdx === undefined || foeMon.lastMoveIdx === null || foeMon.disableT > 0) { done('But it failed!'); return; }
      foeMon.disabledMove = foeMon.lastMoveIdx;
      foeMon.disableT = 1 + Math.floor(g.rng.battle() * 7);
      done(tName + "'s " + MOVES[foeMon.moves[foeMon.disabledMove].id].name + ' was disabled!');
      return;
    }
    if (ef.transform) {
      atk._preTransform = { speciesId: atk.speciesId, stats: { ...atk.stats }, moves: atk.moves };
      atk.transformed = { types: [...(foeMon.tempTypes || SPECIES[foeMon.speciesId].types)], baseSpe: SPECIES[foeMon.speciesId].base.spe };
      atk.speciesId = foeMon.speciesId;
      atk.stats = { ...foeMon.stats };
      atk.moves = foeMon.moves.map((m) => ({ id: m.id, pp: 5, maxPp: 5 }));
      done(aName + ' transformed into ' + tName + '!');
      return;
    }
    if (ef.conversion) {
      const first = atk.moves[0] && MOVES[atk.moves[0].id];
      atk.tempTypes = [first ? first.type : 'normal'];
      done(aName + ' became ' + atk.tempTypes[0] + ' type!');
      return;
    }
    if (ef.mimic) {
      const foeMoves = foeMon.moves.filter((m) => MOVES[m.id]);
      if (!foeMoves.length || !entry.action) { done('But it failed!'); return; }
      const pick = foeMoves[Math.floor(g.rng.battle() * foeMoves.length)];
      atk._mimicRestore = atk.moves[entry.action.idx];
      atk.moves[entry.action.idx] = { id: pick.id, pp: MOVES[pick.id].pp, maxPp: MOVES[pick.id].pp };
      done(aName + ' learned ' + MOVES[pick.id].name + '!');
      return;
    }
    let msg = '';
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) {
      if (ef[k]) {
        if (target.mistT > 0 && ef[k] < 0 && target !== atk) { msg = tName + ' is protected by mist!'; continue; }
        stages[k] = Math.max(-6, Math.min(6, (stages[k] || 0) + ef[k]));
        msg = tName + "'s " + k.toUpperCase() + (ef[k] > 0 ? ' rose!' : ' fell!');
      }
    }
    if (ef.status === 'confusion') {
      if (!target.confused) { target.confused = true; target.confusedTurns = 2 + Math.floor(g.rng.battle() * 4); msg = tName + ' became confused!'; }
      else msg = 'But it failed!';
    } else if (ef.status) {
      if (!target.status) {
        target.status = ef.status;
        if (ef.status === 'sleep') target.sleepTurns = null;
        msg = tName + this.statusText(ef.status);
      } else msg = 'But it failed!';
    }
    this.say(msg || 'Nothing happened.', () => this.nextAction());
  }

  checkFaint(side, cb) {
    const g = this.game;
    const mon = side === 'ally' ? this.ally : this.foe;
    if (mon.hp > 0) { cb(); return; }
    // Yellow homage: the partner takes its own faint personally.
    if (side === 'ally' && mon.speciesId === 'partner') g.state.pikachu.mood = 'sad';
    const name = displayName(mon, SPECIES);
    g.audio.playSfx('battle-faint');
    // README faint transform: the sprite sinks 8px + fades to 0 over 20 frames
    // while the message plays (visual-only; the flow is unchanged).
    const art = g.spriteCache[mon.speciesId] || g.spriteCache.partner;
    this.faintFx = { side, spr: side === 'ally' ? art.back : art.front, t: 0 };
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
        if (t.nickname) this.foe.nickname = t.nickname;
        this.foeStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
        this.participants = new Set([this.ally]); // XP pool resets per foe
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
    const total = xpYield(base, this.foe.level, this.kind === 'wild');
    // Fidelity pack (ADR-018): XP splits among the participants who faced
    // THIS foe and are still standing — never the whole party for free.
    const parts = [...this.participants].filter((m) => m.hp > 0);
    const share = parts.length ? Math.max(1, Math.floor(total / parts.length)) : 0;
    this.xpShares = new Map(parts.map((m) => [m, share]));
    this.xpBarAnim = parts.map((m) => ({
      mon: m, from: xpFracOf(m, 0), to: xpFracOf(m, share),
    }));
    this.xpCb = cb;
    this.state = 'xp';
    this.xpT = 0;
  }

  // Fraction of the current level's XP progress (for the XP bar).
  xpShownFrac(mon) {
    let frac = xpFracOf(mon, 0);
    if (this.state === 'xp' && this.xpBarAnim) {
      const rec = this.xpBarAnim.find((r) => r.mon === mon);
      if (rec) {
        const k = this.game.state.settings.reducedMotion
          ? 1
          : 1 - Math.pow(1 - Math.min(1, this.xpT / 600), 3); // ease-out cubic
        frac = rec.from + (rec.to - rec.from) * k;
      }
    }
    return frac;
  }

  updateXp(dt) {
    const g = this.game;
    // XP bar ease-out over 600ms (gameux §4.2), then level-ups
    this.xpT += dt * 1000;
    if (this.xpT < 600) return;
    if (!this.xpApplied) {
      this.xpApplied = true;
      const msgs = [];
      for (const [m, share] of (this.xpShares || new Map())) {
        if (m.hp <= 0 || share <= 0) continue;
        m.xp += share;
        let leveled = false;
        while (m.xp >= xpForLevel(SPECIES[m.speciesId].growth, m.level + 1) && m.level < 100) {
          m.level++;
          leveled = true;
          const sp = SPECIES[m.speciesId];
          const oldMax = m.maxHp;
          m.maxHp = hpValue(sp.base.hp, m.level, m.ivs ? m.ivs.hp : undefined);
          // WS7/WS9: level-up evolutions queue for the post-battle ceremony.
          if (sp.evo && sp.evo.method === 'level' && m.level >= sp.evo.level) {
            const q = g.state.session.evolveQueue || (g.state.session.evolveQueue = []);
            if (!q.some((e) => e.monId === m.monId)) q.push({ monId: m.monId });
          }
          m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldMax));
          m.stats = {
            atk: statValue(sp.base.atk, m.level, m.ivs ? m.ivs.atk : undefined), def: statValue(sp.base.def, m.level, m.ivs ? m.ivs.def : undefined),
            spa: statValue(sp.base.spa, m.level, m.ivs ? m.ivs.spa : undefined), spd: statValue(sp.base.spd, m.level, m.ivs ? m.ivs.spd : undefined),
            spe: statValue(sp.base.spe, m.level, m.ivs ? m.ivs.spe : undefined),
          };
          // Learn new moves: free slot learns instantly; a full set queues a
          // proper learn/forget prompt after the battle (WS9 — no silent
          // overwrite, HM moves are protected there).
          const newMoves = Array.isArray(sp.learnset)
            ? sp.learnset.filter((e) => e.level === m.level).map((e) => e.move)
            : (sp.learnset[m.level] || []);
          for (const mid of newMoves) {
            if (m.moves.some((x) => x.id === mid)) continue;
            if (m.moves.length < 4) m.moves.push({ id: mid, pp: MOVES[mid].pp, maxPp: MOVES[mid].pp });
            else (g.state.session.learnQueue = g.state.session.learnQueue || []).push({ monId: m.monId, moveId: mid });
          }
        }
        if (leveled) msgs.push(displayName(m, SPECIES) + ' grew to Lv ' + m.level + '!');
      }
      this.xpShares = null;
      g.audio.playSfx('dex-register');
      this.xpApplied = false;
      this.xpFlashT = 250; // P0/E3: level-up flash on the XP bar + fanfare below
      const cb = this.xpCb; this.xpCb = null;
      if (msgs.length) { g.audio.playSfx('levelup'); this.say(msgs.join(' '), () => { this.state = 'resolve'; if (cb) cb(); }); }
      else { this.state = 'resolve'; if (cb) cb(); }
    }
  }

  endTurnStatus() {
    // Burn/poison tick (1/16 max HP), badly-poisoned escalates (1/16 x turns),
    // Leech Seed drains 1/16 to the other side; then timers tick down.
    const tick = (mon, stages, side, done) => {
      if (mon.hp <= 0) { done(); return; }
      const other = side === 'ally' ? this.foe : this.ally;
      if (mon.status === 'burn' || mon.status === 'poison' || mon.status === 'badlyPoisoned') {
        let mult = 1;
        if (mon.status === 'badlyPoisoned') { mon.bpTurns = (mon.bpTurns || 0) + 1; mult = mon.bpTurns; }
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16) * mult);
        mon.hp = Math.max(0, mon.hp - dmg);
        this.say(displayName(mon, SPECIES) + ' is hurt by ' + mon.status + '!', () => {
          this.checkFaint(side, done);
        });
        return;
      }
      if (mon.seeded && other && other.hp > 0) {
        const dmg = Math.max(1, Math.floor(mon.maxHp / 16));
        mon.hp = Math.max(0, mon.hp - dmg);
        other.hp = Math.min(other.maxHp, other.hp + dmg);
        this.say(displayName(mon, SPECIES) + "'s health was sapped by Leech Seed!", () => {
          this.checkFaint(side, done);
        });
        return;
      }
      done();
    };
    for (const m of [this.ally, this.foe]) {
      if (!m) continue;
      if (m.reflectT > 0) m.reflectT--;
      if (m.lightT > 0) m.lightT--;
      if (m.mistT > 0) m.mistT--;
      if (m.disableT > 0) { m.disableT--; if (m.disableT <= 0) m.disabledMove = null; }
    }
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
    if (this.uncatchable) {
      // Scripted presence: balls are deflected — the story must resolve it.
      g.state.bag[ballId]--;
      this.say('The ball passed right through it! This presence cannot be caught.', () => {
        this.foeAction = this.chooseFoeAction();
        this.state = 'resolve';
        const mon = this.foe;
        const stats = this.effStats(mon, this.foeStages);
        const move = MOVES[mon.moves[this.foeAction.idx].id];
        this.actions = [{ side: 'foe', action: this.foeAction, mon, stats, priority: move.priority || 0, move }];
        this.nextAction();
      });
      return;
    }
    g.state.bag[ballId]--;
    const ball = BALLS[ballId];
    this.state = 'catchseq';
    this.catchState = { ball, phase: 'throw', t: 0, shakes: 0, need: 0, a: 0 };
    g.audio.playSfx('catch-throw');
    this.msg = 'You threw a ' + ball.name + '!'; // throw plays immediately, no modal
    this.msgOpen = false;
    const foe = this.foe;
    // Gen-1 two-roll catch (ADR-018): no critical captures, no approximations.
    // Safari throws adjust the effective rate: rock doubles it, bait halves it.
    let rate = SPECIES[foe.speciesId].catchRate;
    if (this.safari) rate = Math.max(3, Math.min(255, Math.round(rate * (this.safariRock ? 2 : this.safariBait ? 0.5 : 1))));
    const res = gen1Catch(foe.maxHp, foe.hp, rate, ballId, foe.status, g.rng.battle);
    this.catchState.willCatch = res.caught;
    this.catchState.need = res.caught ? 3 : res.shakes;
    if (this.tutorial && foe.hp <= foe.maxHp * 0.5) {
      // GD tutorial: weakened in the lesson battle = guaranteed catch.
      // The teaching is in the weaken step; the outcome is never luck.
      this.catchState.willCatch = true;
      this.catchState.need = 3;
    }
  }

  updateCatch(dt) {
    const g = this.game;
    const c = this.catchState;
    c.t += dt * 1000;
    // throw 26f (~430ms) -> absorb -> ball drop -> 3x800ms shakes -> click
    if (c.phase === 'throw' && c.t >= 430) {
      c.phase = 'shakes'; c.t = 0;
      // P1/E10: absorb flash (the mon is drawn into the ball) — white-swap 2 frames.
      const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
      if (foeArt.frontWhite && !g.state.settings.reducedMotion) this.impactFx = { side: 'foe', t: 0 };
    }
    else if (c.phase === 'shakes') {
      const want = c.need;
      const doneShakes = Math.floor(c.t / 800);
      if (c.shakes < doneShakes && c.shakes < want) {
        c.shakes++;
        g.audio.playSfx('catch-rattle'); // visual twin: ball wiggle
      }
      if (c.shakes >= want && c.t >= want * 800 + 200) {
        if (c.willCatch) this.catchSuccess();
        else this.catchBreak(c.shakes);
      }
    }
  }

  catchSuccess() {
    const g = this.game;
    g.audio.playSfx('catch-click'); // visual twin: starburst
    g.audio.playSfx('catch-gotcha');
    this.catchFx = { t: 0 }; // P1/E10: success starburst radiates from the ball
    const foe = this.foe;
    const name = displayName(foe, SPECIES);
    dexRegister(g.state.dex, 'caught', SPECIES[foe.speciesId].dexNo);
    let dest = 'party';
    if (g.state.party.length >= 6) {
      // Full party: the catch goes to the current PC box as a complete mon.
      const boxId = g.state.currentBox || 'box1';
      const box = g.state.boxes[boxId] || (g.state.boxes[boxId] = []);
      foe.hp = foe.maxHp;
      foe.status = null; foe.confused = false;
      box.push(foe);
      dest = 'the PC (' + boxId.replace('box', 'Box ') + ')';
    } else {
      foe.hp = foe.maxHp; // caught fresh
      g.state.party.push(foe);
    }
    g.audio.playSfx('dex-register'); // visual twin: dex toast + badge dot
    g.ui.dexDot = true; // P1/D4: badge dot on the HUD strip's Dex button
    if (g.ui._renderDexDot) g.ui._renderDexDot();
    this.say('Gotcha! ' + name + ' was caught! (' + dest + ')', () => {
      g.ui.toast(name + ' registered in the Dex!');
      this.endBattle(true);
    });
  }

  catchBreak(shakesDone) {
    const g = this.game;
    const name = displayName(this.foe, SPECIES);
    if (this.safari) {
      g.audio.catchBreakout();
      this.say('Oh no! ' + name + ' broke free!', () => {
        if (this.safariFleeCheck()) return;
        this.toCommand();
      });
      return;
    }
    g.audio.catchBreakout(); // visual twin: break-out burst
    // P0/E11: break-out flash gated like battle flashes; reduced motion -> fade.
    if (!g.state.settings.reducedMotion && g.state.settings.shake) g.renderer.flashA = 0.8;
    else if (g.state.settings.reducedMotion) { g.renderer.fadeA = 0.35; g.renderer.fadeColor = '#ffffff'; }
    this.say('Oh no! ' + name + ' broke free after ' + shakesDone + ' shake' + (shakesDone === 1 ? '' : 's') + '!', () => {
      g.renderer.flashA = 0;
      g.renderer.fadeA = 0;
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
    // Yellow homage: winning with the partner conscious leaves it buzzing.
    if (g.state.party.some((m) => m.speciesId === 'partner' && m.hp > 0)) {
      g.state.pikachu.mood = 'excited';
    }
    // No battle-message here: the capstone dialogue below ends the battle exactly once.
    this.msg = 'You defeated ' + t.title + ' ' + t.name + '! Got $' + t.reward + '.';
    this.msgOpen = false;
    if (t.badge) {
      if (!g.state.badges.kanto.includes(t.badge)) g.state.badges.kanto.push(t.badge);
      g.state.story.flags['badge_' + t.badge.replace(/badge$/, '')] = true; // quest chain (WS6)
      g.audio.playSfx('badge'); // badge fanfare (visual twin: badge-case shine animation)
      if (t.id === 'brock') {
        // The slice capstone lines are Brock's scene specifically.
        const lines = SLICE_CAPSTONE.map((l) => l.replace('{player}', g.state.player.name));
        g.ui.say(lines, () => this.endBattle(true), '');
      } else {
        g.ui.say(t.lose, () => this.endBattle(true), t.name);
      }
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
    g.state.pikachu.mood = 'sad'; // Yellow homage: the partner hates losing
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
    if (g.ui.hideCommands) g.ui.hideCommands(); // RT touch move pad retires with the battle
    g.audio.restoreAreaMusic(); // back to the overworld's track
    g.renderer.shakeX = 0; g.renderer.shakeY = 0; g.renderer.flashA = 0;
    // Reset battle temp state on party mons (incl. Transform restoration).
    for (const m of g.state.party) {
      if (m._preTransform) {
        m.speciesId = m._preTransform.speciesId;
        m.stats = m._preTransform.stats;
        m.moves = m._preTransform.moves;
        m._preTransform = null; m.transformed = null;
      }
      if (m._mimicRestore) m._mimicRestore = null;
      m.confused = false; m.confusedTurns = null; m.statusTurns = 0; m.sleepTurns = null;
      m.seeded = false; m.subHp = 0; m.reflectT = 0; m.lightT = 0; m.mistT = 0;
      m.lockMove = null; m.chargedFor = null; m.focused = false; m.tempTypes = null;
      m.flinched = false; m.bpTurns = 0; m.mustRecharge = false; m.bideT = 0; m.bideDmg = 0;
      m.disabledMove = null; m.disableT = 0; m.tookPhysicalThisTurn = 0;
      const st = m.stages; if (st) { st.atk = 0; st.def = 0; st.spa = 0; st.spd = 0; st.spe = 0; st.acc = 0; st.eva = 0; }
    }
    g.scenes.pop();
    g.autosave('battle');
    // Story-event continuation (WS6): scripted battles resume their script
    // only on victory — a loss leaves the event unconsumed for a retry.
    if (this.onEnd) { const f = this.onEnd; this.onEnd = null; f(won); }
  }

  drainHp(dt) {
    const g = this.game;
    // P0/E5: reduced motion -> HP drain snaps instantly (no 90 HP/s animation).
    if (g.state.settings.reducedMotion) {
      this.hpAnim.ally = this.ally.hp;
      this.hpAnim.foe = this.foe.hp;
    } else {
      const rate = HP_DRAIN_PER_SEC * dt;
      if (this.hpAnim.ally !== this.ally.hp) {
        const d = this.ally.hp - this.hpAnim.ally;
        this.hpAnim.ally += Math.sign(d) * Math.min(Math.abs(d), rate);
        if (Math.abs(this.ally.hp - this.hpAnim.ally) < 1) this.hpAnim.ally = this.ally.hp;
      }
      if (this.hpAnim.foe !== this.foe.hp) {
        const d = this.foe.hp - this.hpAnim.foe;
        this.hpAnim.foe += Math.sign(d) * Math.min(Math.abs(d), rate);
        if (Math.abs(this.foe.hp - this.hpAnim.foe) < 1) this.hpAnim.foe = this.foe.hp;
      }
    }
    // Low-HP warning jingle at first crossing into red (<25%), once per ally
    // (gameux §4.2). Visual twin: the HP plate's red pulse + '!' pip.
    if (this._lowHpAlly !== this.ally) { this._lowHpAlly = this.ally; this._lowHpWarned = false; }
    const ratio = this.ally.maxHp > 0 ? this.ally.hp / this.ally.maxHp : 1;
    if (ratio > 0.25) this._lowHpWarned = false;
    else if (!this._lowHpWarned && this.ally.hp > 0) {
      this._lowHpWarned = true;
      g.audio.playSfx('lowhp'); // P0-5: wired (was dead code before the Wave-2 audio merge)
      // P1/E7: pulse the ally plate twice on first red crossing (not under reduced motion).
      if (!g.state.settings.reducedMotion) this._lowHpPulseT = 400;
    }
  }

  // UI v2 (Platinum standard): stepped circular battle platform, rects only
  // (5 horizontal bands, widest at the middle — a pixel disc, no arc/ellipse
  // calls): light rim on top, pale fill, darker shade band at the bottom.
  ptDisc(r, cx, cy, rx, ry) {
    const c = r.ctx;
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const t = (i / (steps - 1)) * 2 - 1; // -1 (top) .. 1 (bottom)
      const half = Math.max(4, Math.round(rx * Math.sqrt(Math.max(0.12, 1 - t * t))));
      const y0 = Math.round(cy + t * ry - ry / steps);
      const hh = Math.ceil((2 * ry) / steps) + 1;
      c.fillStyle = i === 0 ? '#f2ecd8' : (i === steps - 1 ? '#b3a586' : '#ddd2ac');
      c.fillRect(Math.round(cx - half), y0, half * 2, hh);
    }
  }

  // UI v2.3 (defect 4): which arena backdrop this battle gets. Explicit
  // opts.arena wins (fishing passes 'water'); otherwise derive from the
  // overworld the battle returns to: surfing = water, gym interiors =
  // gym, cave/tunnel maps = cave, everything else = grass route.
  arenaKind() {
    if (this.arena) return this.arena;
    const ow = this.returnTo;
    if (ow && ow.surfing) return 'water';
    const id = (ow && ow.mapId) || '';
    const nm = (ow && ow.map && ow.map.name) || '';
    if (/gym/i.test(id) || /gym/i.test(nm)) return 'gym';
    if (/cave|tunnel|mtmoon|victory|diglett/i.test(id)) return 'cave';
    return 'grass';
  }

  // UI v2.3 (defect 4): the battlefield backdrop, rects only, drawn INSIDE
  // begin()/end(). v2 drew flat color bands; the Platinum standard is a
  // TEXTURED field, so every surface here is worked: ordered-dither sky
  // (checker mixes at band boundaries, DS-style), detailed horizon
  // (tree line / wave crests / rock teeth / gym trim), and a ground of
  // perspective rows — heights grow toward the viewer — with per-variant
  // speckle (grass tufts, foam dashes, rock chunks, floor seams). All
  // texture placement runs through arenaHash, so the field is identical
  // every frame. Variants: grass route, cave, water, gym (arenaKind()).
  // Platforms/plates are unchanged (ptDisc + plate()).
  drawArena(r, horizonFrac) {
    const g = this.game;
    const w = r.viewW, h = r.viewH;
    const horizon = Math.round(h * horizonFrac);
    const kind = this.arenaKind();
    const F = (col, x, y, fw, fh) => g.ctx2dfill(col, x, y, fw, fh);

    // ---- upper field: sky (grass/water) or wall (cave/gym) ----
    if (kind === 'cave') {
      const wall = ['#241d2e', '#2b2338', '#332a42', '#3b314c', '#433856', '#4b4060'];
      const wb = Math.ceil(horizon / wall.length) || 1;
      for (let i = 0; i < wall.length; i++) F(wall[i], 0, i * wb, w, wb + 1);
      // Rock speckle across the wall face.
      for (let i = 0; i < Math.floor(w / 3); i++) {
        const sx = Math.floor(arenaHash(i, 11) * w), sy = Math.floor(arenaHash(i, 23) * Math.max(1, horizon - 4));
        F(arenaHash(i, 37) > 0.5 ? '#1a1424' : '#5a4c74', sx, sy, 2, 2);
      }
      // Stalactites: stepped teeth hanging from the ceiling line.
      for (let x = 2, i = 0; x < w - 6; x += 13, i++) {
        const len = 4 + Math.floor(arenaHash(i, 5) * 9);
        F('#1a1424', x, 0, 5, Math.max(2, len - 3));
        F('#1a1424', x + 1, 0, 3, len);
        F('#120d1a', x + 2, 0, 1, len + 2);
      }
    } else if (kind === 'gym') {
      // Indoor wall: deep two-tone panels, vertical seams, a banner band.
      F('#5a3a52', 0, 0, w, Math.max(2, horizon - 14));
      F('#6b4660', 0, Math.max(0, horizon - 14), w, 12);
      for (let x = 0; x < w; x += 32) F('#452c40', x, 0, 2, Math.max(2, horizon - 2));
      for (let x = 16, i = 0; x < w - 10; x += 48, i++) {
        F(i % 2 ? '#c8a03a' : '#b03a48', x, 4, 12, 8); // hanging banners
        F('#2b3040', x, 12, 12, 1);
      }
      F('#2b3040', 0, horizon - 3, w, 3); // baseboard trim
    } else {
      const sky = kind === 'water'
        ? ['#4f97dd', '#61a6e6', '#73b4ee', '#85c1f4', '#97cdf8', '#aad8fa']
        : ['#5f9fe6', '#6fabec', '#7fb7f1', '#8fc3f5', '#9fcdf8', '#b0d7fa'];
      const sb = Math.ceil(horizon / sky.length) || 1;
      for (let i = 0; i < sky.length; i++) F(sky[i], 0, i * sb, w, sb + 1);
      // Ordered dither: the last two rows of each band checker-mix the
      // next band's color, denser on the final row (DS sky softening).
      for (let i = 0; i < sky.length - 1; i++) {
        const yBase = (i + 1) * sb;
        for (let dy = 2; dy >= 1; dy--) {
          const y = yBase - dy;
          if (y < 0 || y >= horizon) continue;
          for (let x = 0; x < w; x += 3) {
            if ((((x / 3) | 0) + y) % 2 === 0 && (dy === 1 || ((x / 3) | 0) % 2 === 0)) F(sky[i + 1], x, y, 3, 1);
          }
        }
      }
      // Pixel clouds: soft rect clusters at hashed anchor points.
      for (let i = 0; i < 5; i++) {
        const cx = Math.floor(arenaHash(i, 71) * (w - 40)) + 4;
        const cy = 3 + Math.floor(arenaHash(i, 83) * Math.max(4, horizon * 0.45));
        F('#eaf5ff', cx, cy, 16, 3); F('#eaf5ff', cx + 4, cy - 2, 9, 2); F('#dcefff', cx + 2, cy + 3, 12, 2);
      }
    }

    // ---- horizon detail ----
    if (kind === 'grass') {
      F('#5d8f66', 0, horizon - 8, w, 8);
      for (let x = 4, i = 0; x < w - 8; x += 18, i++) {
        const bh = 8 + Math.floor(arenaHash(i, 3) * 8);
        F('#3f6d4a', x, horizon - bh, 10, bh);
        F('#2f5739', x + 2, horizon - bh + 2, 2, 2);
        F('#527f5c', x + 6, horizon - bh + 3, 2, 2);
      }
      F('#4c7a56', 0, horizon - 3, w, 3);
      F('#33513c', 0, horizon, w, 2);
    } else if (kind === 'water') {
      // Distant wave crests breaking along the horizon.
      for (let x = 2, i = 0; x < w - 6; x += 11, i++) {
        if (arenaHash(i, 17) > 0.35) F('#eaf7ff', x, horizon - 2, 5, 1);
        if (arenaHash(i, 29) > 0.6) F('#cfeaff', x + 3, horizon - 4, 4, 1);
      }
      F('#2d68b0', 0, horizon, w, 2);
    } else if (kind === 'cave') {
      // Rock teeth silhouettes rising to meet the wall.
      for (let x = 0, i = 0; x < w - 4; x += 9, i++) {
        const th = 3 + Math.floor(arenaHash(i, 41) * 7);
        F('#1a1424', x, horizon - th, 6, th);
      }
      F('#120d1a', 0, horizon, w, 2);
    } else { // gym
      F('#2b3040', 0, horizon, w, 2);
    }

    // ---- ground: perspective rows with per-variant texture ----
    const pal = kind === 'cave'
      ? ['#57456a', '#514163', '#4b3d5c', '#453955', '#3f354e', '#392f47']
      : kind === 'water'
        ? ['#4d8fd8', '#4787ce', '#417fc4', '#3b77ba', '#356fb0', '#2f67a6']
        : kind === 'gym'
          ? ['#c2a172', '#b99a6c', '#b09366', '#a78c60', '#9e855a', '#957e54']
          : this.kind === 'trainer'
            ? ['#cfc2a4', '#c4b696', '#b9aa89', '#ae9e7d', '#a39271', '#988665']
            : ['#a5dc82', '#9bd578', '#91ce6f', '#87c766', '#7dc05d', '#73b954'];
    const dark = kind === 'cave' ? '#2a2138' : kind === 'water' ? '#27609e' : kind === 'gym' ? '#7d6742' : this.kind === 'trainer' ? '#7d6c4c' : '#4f9440';
    const light = kind === 'cave' ? '#6c587f' : kind === 'water' ? '#eaf7ff' : kind === 'gym' ? '#d9bf92' : this.kind === 'trainer' ? '#e6dcc2' : '#c8ef9f';
    let y = horizon + 2, rh = 2, row = 0;
    const groundH = Math.max(1, h - horizon - 2);
    while (y < h) {
      const t = Math.min(1, (y - horizon) / groundH);
      F(pal[Math.min(pal.length - 1, Math.floor(t * pal.length))], 0, y, w, rh + 1);
      const n = Math.floor(w / 9);
      for (let i = 0; i < n; i++) {
        const sx = Math.floor(arenaHash(i * 3 + row * 57, row * 131) * (w - 5));
        const sy = y + Math.floor(arenaHash(i, row * 7 + 1) * Math.max(1, rh - 1));
        const tone = arenaHash(i + row * 3, 999) > 0.45 ? dark : light;
        if (kind === 'grass' && this.kind !== 'trainer') F(tone, sx, sy, 1, Math.min(3, rh)); // grass tufts
        else if (kind === 'water') { if (tone === light) F(tone, sx, sy, 4, 1); } // foam dashes
        else if (kind === 'cave') F(tone, sx, sy, 3, 2); // rock chunks
        else if (kind === 'gym') { if (arenaHash(i, row * 13) > 0.72) F(dark, sx, y, 1, rh); } // floor seams splay per row
        else F(tone, sx, sy, 2, 1); // stone flecks (trainer field)
      }
      y += rh;
      rh = Math.min(15, Math.ceil(rh * 1.45));
      row++;
    }
  }

  render(r) {
    const g = this.game;
    if (this.rtMode && this.rt && (this.state === 'rt' || this.state === 'xp')) { this.renderRt(r); return; }
    const w = r.viewW, h = r.viewH;
    // Transform discipline (title/intro pattern): pin the camera to the
    // origin for the screen-space theater, restore it after end().
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    this.drawArena(r, 0.42);
    // Platforms: foe upper-right, ally lower-left (wireframes §5.1 — the Uix
    // ruling: gameux §4.2's "upper-left" was the spec's error; the build is correct).
    const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
    const allyArt = g.spriteCache[this.ally.speciesId] || g.spriteCache.partner;
    const bob = Math.sin(this.t * 0.004) * 2;
    const foePos = { x: w * 0.62, y: h * 0.12 + bob };
    const allyPos = { x: w * 0.14, y: h * 0.52 - bob };
    // Idle bob: the build-time derived bob frame alternates with the sine.
    let foeSpr = (bob > 0 && foeArt.frontBob) ? foeArt.frontBob : foeArt.front;
    let allySpr = allyArt.back;
    // README impact transform: white palette-swap on the defender for 2 frames.
    if (this.impactFx) {
      if (this.impactFx.side === 'foe' && foeArt.frontWhite) foeSpr = foeArt.frontWhite;
      if (this.impactFx.side === 'ally' && allyArt.backWhite) allySpr = allyArt.backWhite;
    }
    const drawBattler = (spr, pos, side) => {
      if (this.faintFx && this.faintFx.side === side) return; // faint anim draws it
      // README attack transform: 1.2x scale for 3 frames, then back.
      if (this.atkFx && this.atkFx.side === side) r.blitS(spr, pos.x - 5, pos.y - 5, 58, 58);
      else r.blitS(spr, pos.x, pos.y, 48, 48); // 32px ART -> 48px draw size
    };
    // Platinum battle platforms: stepped discs under each battler (the far
    // foe disc is smaller — perspective), drawn before the sprites.
    this.ptDisc(r, foePos.x + 24, foePos.y + 44, 34, 8);
    this.ptDisc(r, allyPos.x + 24, allyPos.y + 44, 38, 9);
    drawBattler(foeSpr, foePos, 'foe');
    drawBattler(allySpr, allyPos, 'ally');
    // README faint transform: sink 8px + fade to 0 alpha over 20 frames.
    if (this.faintFx) {
      const k = Math.min(1, this.faintFx.t / 660);
      const c = r.ctx;
      c.save();
      c.globalAlpha = 1 - k;
      const pos = this.faintFx.side === 'foe' ? foePos : allyPos;
      r.blitS(this.faintFx.spr, pos.x, pos.y + 8 * k, 48, 48);
      c.restore();
    }
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
    // P1/E10: success starburst — 8 gold rays radiating from the ball, fading.
    if (this.catchFx) {
      const k = this.catchFx.t / 500;
      const c = r.ctx;
      c.save();
      c.strokeStyle = 'rgba(232,200,50,' + (1 - k).toFixed(3) + ')';
      c.lineWidth = 2;
      const bx = w * 0.7, by = h * 0.3, r0 = 8 + k * 26;
      for (let s = 0; s < 8; s++) {
        const a = (s / 8) * Math.PI * 2;
        c.beginPath();
        c.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0);
        c.lineTo(bx + Math.cos(a) * (r0 + 8), by + Math.sin(a) * (r0 + 8));
        c.stroke();
      }
      c.restore();
    }
    r.end();
    r.camX = pcx; r.camY = pcy;
    // HP plates (Platinum databoxes, original art) — P1/A5: all plate text >= 14px.
    this.plate(r, 6, 6, this.foe, this.hpAnim.foe, false);
    this.plate(r, w - 146, h - 124, this.ally, this.hpAnim.ally, true);
    // Message box (Platinum frame via r.panel/ptFrame)
    if (this.msgOpen || this.msg) {
      r.panel(4, h - 52, w - 8, 48, PT_PAPER, PT_FRAME);
      // UI v2.3 (defect 1): measured word-wrap with the render font itself
      // (r.wrapText) — the old fixed 30-char slices cut words in half
      // ('y/our first catch') whenever a word straddled the boundary.
      const lines = r.wrapText(this.msg, 14, w - 20, { maxLines: 2 });
      if (lines[0]) r.text(lines[0], 10, h - 46, { size: 14, color: '#202028', shadow: false });
      if (lines[1]) r.text(lines[1], 10, h - 28, { size: 14, color: '#202028', shadow: false });
      // UI v2: red advance cue at the box's bottom-right while waiting for input.
      if (this.msgOpen) r.text('▼', w - 20, h - 24, { size: 14, bold: true, color: '#e03c31', shadow: false });
    }
    this.t += 16;
  }

  // UI v2 (Platinum standard): a true Platinum databox on r.ptPlate.
  // Canvas ops used here are fillRect / fillText / strokeRect ONLY (via
  // r.ptPlate, r.hpBar, r.xpBar, r.text and one direct fillRect for the
  // status chip / XP flash) — the QA recording-ctx plate test implements
  // just those. Every instance field is guarded: the QA minimal-this call
  // (only game.state.settings present) must yield zero slide/pulse offsets.
  plate(r, x, y, mon, hpShown, isAlly) {
    const settings = (this.game && this.game.state && this.game.state.settings) || {};
    const w = 140, h = isAlly ? 70 : 48;
    // Platinum plate entrance: foe slides in from the left, ally from the
    // right, ease-out over the battle's opening 450ms of theater time
    // (this.t, reset in enter()). A missing/non-finite timer (the QA
    // minimal-this call) means "entrance finished" — offset 0. Reduced
    // motion skips the slide entirely.
    let slide = 0;
    if (typeof this.t === 'number' && isFinite(this.t) && !settings.reducedMotion) {
      const p = Math.max(0, Math.min(1, this.t / 450));
      const e = 1 - (1 - p) * (1 - p);
      slide = (1 - e) * (w + 16);
    }
    let px = isAlly ? x + slide : x - slide;
    // P1/E7: low-HP pulse — the ally plate nudges twice on first red crossing
    // (never under reduced motion; the pulse timer is only set when motion is on).
    if (isAlly && this._lowHpPulseT > 0) px += Math.sin(this._lowHpPulseT * 0.05) * 2;
    r.ptPlate(px, y, w, h, isAlly);
    const ink = '#20242e';
    const name = displayName(mon, SPECIES).slice(0, 10);
    r.text(name, px + 6, y + 5, { size: 14, bold: true, color: ink, shadow: false });
    // Gender: mons/species carry no gender data anywhere in the game, so
    // the databox is gender-neutral — no symbol is drawn (UI v2 ruling).
    // 'Lv' + level, right-aligned inside the frame (a 10-char name at
    // px + 6 still clears the 'Lv100' block ending at px + w - 6).
    r.text('Lv' + mon.level, px + w - 6, y + 5, { size: 14, color: ink, shadow: false, align: 'right' });
    // HP row: gold 'HP' tag + the Platinum hpBar; the status chip slot is
    // reserved at the row's right end (the bar shortens when a chip shows).
    const fracRaw = hpShown / mon.maxHp;
    const frac = isFinite(fracRaw) ? Math.max(0, Math.min(1, fracRaw)) : 0;
    const chip = mon.status
      ? (STATUS_CHIPS[mon.status] || [String(mon.status).toUpperCase().slice(0, 3), '#5a6478'])
      : null;
    r.text('HP', px + 6, y + 23, { size: 14, bold: true, color: '#a87818', shadow: false });
    r.hpBar(px + 26, y + 27, chip ? w - 66 : w - 32, 7, frac);
    if (chip) {
      const c = r.ctx;
      c.fillStyle = chip[1];
      c.fillRect(px + w - 36, y + 22, 30, 16);
      r.text(chip[0], px + w - 33, y + 23, { size: 14, bold: true, color: '#ffffff', shadow: false });
    } else if (!isAlly && frac < 0.25 && mon.hp > 0) {
      // P0/E6: foe low-HP text cue in the empty chip slot (never color
      // alone; the hpBar's white stripe overlay is the always-on cue).
      // The ally plate carries its own '!' on the HP-numbers row below.
      r.text('!', px + w - 26, y + 23, { size: 14, bold: true, color: '#c02818', shadow: false });
    }
    if (isAlly) {
      // HP numbers row: low-HP '!' cue at the left, cur/max right-aligned.
      if (frac < 0.25 && mon.hp > 0) {
        r.text('!', px + 6, y + 40, { size: 14, bold: true, color: '#c02818', shadow: false });
      }
      r.text(Math.ceil(hpShown) + '/' + mon.maxHp, px + w - 6, y + 40, { size: 14, color: ink, shadow: false, align: 'right' });
      // EXP row: blue 'EXP' tag + the Platinum-blue xpBar (P0/E3: 600ms
      // ease-out via xpShownFrac; instant under reduced motion).
      r.text('EXP', px + 6, y + 54, { size: 14, bold: true, color: '#2f68b8', shadow: false });
      // xpShownFrac lives on the battle instance; the QA minimal-this plate
      // test calls plate() without it — fall back to the static fraction.
      const xfRaw = (typeof this.xpShownFrac === 'function') ? this.xpShownFrac(mon) : xpFracOf(mon, 0);
      const xf = isFinite(xfRaw) ? xfRaw : 0;
      r.xpBar(px + 34, y + 58, w - 40, 5, xf);
      if (this.xpFlashT > 0) {
        const c = r.ctx;
        c.fillStyle = 'rgba(255,255,255,' + (this.xpFlashT / 250 * 0.8).toFixed(3) + ')';
        c.fillRect(px + 34, y + 58, w - 40, 5);
      }
    }
  }
}
