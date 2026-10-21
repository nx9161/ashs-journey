// battle-rt.mjs — REAL-TIME battle mode (ADR-020): free arena movement,
// per-move cooldowns, lunges/projectiles, a dodge roll with i-frames, live
// switching and real-time ball throws. Damage/catch/status MATH is the same
// classic chassis as the turn-based mode (formulas.mjs) — only the flow is
// real-time. The classic mode remains available (settings: Battle Style)
// and still runs the tutorial + Safari command battles.
// Theatre rule: while a dialogue or menu is open, the arena freezes.

import { SPECIES } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import {
  effectiveness, calcDamage, stageMultiplier, accStageMultiplier,
  gen1Random, critChance, gen1Catch,
} from '../engine/formulas.mjs';
import { roll } from '../engine/rng.mjs';
import { PT_FRAME, PT_FRAME2, PT_PAPER } from '../engine/render.mjs';
import { displayName } from './state.mjs';
import { typePill } from './ui.mjs';
import { BattleScene } from './battle.mjs';

const ARENA = { x0: 26, y0: 56, x1: 454, y1: 258 }; // logical 480x320 space

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }

function cooldownMs(mv, userSpe, foeSpe) {
  // ADR-020 review formula: power/accuracy/speed-advantage scaled, clamped.
  if (mv.cat === 'status') return 1500;
  return clamp(800 + (mv.power || 30) * 9 + (100 - (mv.acc || 100)) * 6 - (userSpe - foeSpe) * 3, 650, 4200);
}

Object.assign(BattleScene.prototype, {
  // UI v2.3 (defect 2): ONE battle presentation for every battle type.
  // The v2.2 RT-only combined panel (move buttons with PP only, stacked
  // over BALL/TEAM/RUN gradient bars, drawn across the ally databox, no
  // FIGHT stage) is DELETED — no battle renders it. RT battles now present
  // exactly like classic ones: A (or a tap on the A pad) opens the Platinum
  // 2x2 command grid (FIGHT / BAG / PARTY / RUN) in the message zone, and
  // FIGHT opens the same framed move window as the classic battle (name +
  // type pill + PP + power/acc; a move on cooldown shows its remaining CD
  // and picking it floats the cooldown instead of firing). Opening any of
  // these menus freezes the arena (the
  // theatre rule), and the windows are the classic battlewin/cmdpanel
  // layouts, so neither databox is ever covered. Keyboard slot keys stay
  // as direct-fire shortcuts (ADR-021 parity) — input only, never a
  // separate rendered panel; touch plays the identical command flow
  // through the A/B pads and tappable grid.
  rtShowCommands() {
    const g = this.game;
    if (this.state !== 'rt' || !this.rt || this.rtFrozen()) return;
    const items = [
      { label: 'FIGHT', value: 'fight' },
      { label: 'BAG', value: 'bag' },
      { label: 'PARTY', value: 'party' },
      { label: 'RUN', value: 'run', disabled: this.kind !== 'wild' },
    ];
    g.ui.showCommands(items, (value) => {
      if (value === null) return; // B backs out to the live arena
      if (value === 'fight') this.rtShowMoves();
      else if (value === 'bag') this.rtBallMenu();
      else if (value === 'party') this.openPartyMenu(false);
      else if (value === 'run') this.rtTryRun();
    }, {});
  },

  rtShowMoves() {
    const g = this.game;
    const ally = this.ally;
    const rt = this.rt;
    const items = ally.moves.map((m, i) => {
      const mv = MOVES[m.id];
      const disabledMove = ally.disableT > 0 && ally.disabledMove === i;
      const cd = rt && rt.cds.ally[m.id] ? Math.ceil(rt.cds.ally[m.id] / 1000) : 0;
      return {
        label: mv.name + ' (' + mv.type + ') ' + m.pp + '/' + m.maxPp + (cd ? ' CD ' + cd + 's' : ''),
        value: i, disabled: m.pp <= 0 || disabledMove, zeroPp: m.pp <= 0, move: m, cd,
      };
    });
    items.push({ label: 'Back', value: -1, wide: true });
    // Same framed move window as the classic battle (battle.mjs
    // onCommand('fight')): name + type pill + PP (+ CD while cooling
    // down) + power/acc.
    const rowHtml = (it) => {
      if (it.value === -1) return '<span>' + it.label + '</span>';
      const mv = MOVES[it.move.id];
      return '<span class="mvcell"><span class="mvname">' + mv.name + '</span>'
        + typePill(mv.type)
        + '<span class="mvpp">' + it.move.pp + '/' + it.move.maxPp + ' PP' + (it.cd ? ' · CD ' + it.cd + 's' : '') + '</span>'
        + '<span class="mvpow">' + (mv.power || '—') + ' pw / ' + (mv.acc || '—') + ' ac</span></span>';
    };
    g.ui.showMenu('Choose a move', items, (v) => {
      if (v === null || v === -1) { this.rtShowCommands(); return; }
      this._lastMoveIdx = v; // cursor memory, same as classic
      // A cooling move is selectable on purpose: picking it floats the
      // cooldown and re-presents a FRESH window (live values — the
      // clocks tick while menus are open, UI v2.3), never a dead press
      // on a stale disabled row.
      if (!this.rtUseMove('ally', v)) { this.rtFloat('Cooling down!'); this.rtShowMoves(); }
    }, { battle: true, grid: true, initialIdx: Math.min(this._lastMoveIdx || 0, items.length - 1), rowHtml, menuClass: 'battlewin' });
  },

  rtInit() {
    const g = this.game;
    this._rtLastFoe = this.foe;
    this.rt = {
      ax: 118, ay: 208, fx: 362, fy: 104, // battler positions
      face: 'right', foeFace: 'left',
      cds: { ally: {}, foe: {} },          // moveId -> ms remaining
      projs: [],                            // {x,y,tx,ty,speed,mv,side,t}
      lunge: null,                          // {side,t,dur,fromX,fromY,toX,toY,mv}
      dodgeT: 0, dodgeCd: 0, iframes: 0,
      foeStrafeT: 0, foeDir: 1, foeHoldT: 0,
      ballFlight: null, catchSeq: null,
      tickT: 0, msgCd: 0,
      allySleepT: 0, foeSleepT: 0,
      switchVulnT: 0,
    };
    this.state = 'rt';
    // (The enter() intro lines already announced the send-out — no repeat.)
  },

  rtResetFoe() {
    // Between trainer mons: fresh positions + cooldowns; XP pool already
    // reset by afterFaintFoe.
    this._rtLastFoe = this.foe;
    this.rt.fx = 362; this.rt.fy = 104;
    this.rt.cds.foe = {};
    this.rt.projs = this.rt.projs.filter((p) => p.side === 'ally');
    this.rt.foeSleepT = 0;
    this.state = 'rt';
  },

  rtFrozen() {
    const g = this.game;
    return this.msgOpen || !!g.ui.menu || !!g.ui.dialogue;
  },

  // UI v2.3: the RT clock block (move cooldowns, dodge cooldown, float
  // message cooldown, sleep clocks). Split out of updateRt so
  // BattleScene.update can tick the clocks while a battle menu/dialogue
  // freezes the arena — the FIGHT window's cooldowns are live, and a
  // cooling move can come back while the player decides. Positional
  // timers (dodge roll, i-frames, switch vulnerability) and the
  // poison/burn pressure tick stay in updateRt: they belong to the
  // frozen arena, not the clock.
  rtTickClocks(dtms) {
    const rt = this.rt;
    if (!rt) return;
    for (const side of ['ally', 'foe']) {
      for (const k of Object.keys(rt.cds[side])) {
        rt.cds[side][k] -= dtms;
        if (rt.cds[side][k] <= 0) delete rt.cds[side][k];
      }
    }
    if (rt.dodgeCd > 0) rt.dodgeCd -= dtms;
    if (rt.msgCd > 0) rt.msgCd -= dtms;
    if (rt.allySleepT > 0) rt.allySleepT -= dtms;
    if (rt.foeSleepT > 0) rt.foeSleepT -= dtms;
  },

  updateRt(dt) {
    const g = this.game;
    const input = g.input;
    const rt = this.rt;
    if (!rt) { this.toCommand(); return; }
    if (this.rtFrozen()) return;
    const dtms = dt * 1000;
    // Clocks (cooldowns et al.) — rtTickClocks; BattleScene.update ticks
    // the same block on frozen frames, never both.
    this.rtTickClocks(dtms);
    if (rt.dodgeT > 0) rt.dodgeT -= dtms;
    if (rt.iframes > 0) rt.iframes -= dtms;
    if (rt.switchVulnT > 0) rt.switchVulnT -= dtms;
    // Poison/burn tick every 3s (turn-equivalent pressure).
    rt.tickT += dtms;
    if (rt.tickT >= 3000) {
      rt.tickT = 0;
      for (const mon of [this.ally, this.foe]) {
        if (mon && mon.hp > 0 && (mon.status === 'poison' || mon.status === 'burn' || mon.status === 'badlyPoisoned')) {
          mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(mon.maxHp / 16)));
        }
        if (mon && mon.hp > 0 && mon.seeded) {
          const other = mon === this.ally ? this.foe : this.ally;
          const d = Math.max(1, Math.floor(mon.maxHp / 16));
          mon.hp = Math.max(0, mon.hp - d);
          if (other && other.hp > 0) other.hp = Math.min(other.maxHp, other.hp + d);
        }
      }
      if (this.rtCheckFaints()) return;
    }
    // Catch sequence animation runs on its own clock.
    if (rt.catchSeq) { this.rtUpdateCatch(dtms); return; }
    if (rt.ballFlight) { this.rtUpdateBall(dtms); return; }

    // ---- Player movement (free, speed-scaled) ----
    const allySpe = this.effStats(this.ally, this.allyStages).spe;
    const allyAsleep = this.ally.status === 'sleep' && rt.allySleepT > 0;
    let mx = 0, my = 0;
    if (!allyAsleep && !rt.lunge) {
      if (input.isHeld('left')) mx -= 1;
      if (input.isHeld('right')) mx += 1;
      if (input.isHeld('up')) my -= 1;
      if (input.isHeld('down')) my += 1;
    }
    const parSlowed = this.ally.status === 'paralysis' ? 0.55 : 1;
    let spd = (52 + allySpe * 0.55) * parSlowed;
    if (rt.dodgeT > 0) spd *= 2.15;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      rt.ax = clamp(rt.ax + (mx / len) * spd * dt, ARENA.x0, ARENA.x1);
      rt.ay = clamp(rt.ay + (my / len) * spd * dt, ARENA.y0, ARENA.y1);
      rt.face = mx < 0 ? 'left' : mx > 0 ? 'right' : rt.face;
    }
    // Dodge roll: B while moving (or standing) — i-frames, 900ms cooldown.
    if (input.wasPressed('b') && rt.dodgeCd <= 0 && !allyAsleep) {
      rt.dodgeT = 230; rt.iframes = 260; rt.dodgeCd = 900;
      g.audio.playSfx('menu-move');
    }
    // Moves: slot keys fire directly (keyboard shortcut) — the rendered
    // command flow (A -> FIGHT -> move window) is identical for everyone.
    if (!allyAsleep && !rt.lunge) {
      for (let i = 0; i < 4; i++) {
        if (input.wasPressed('slot' + (i + 1))) { this.rtUseMove('ally', i); break; }
      }
    }
    // Commands on A (the unified Platinum grid — FIGHT/BAG/PARTY/RUN,
    // every battle type), party on START, run attempt on SELECT (wild).
    if (input.wasPressed('a') && !rt.ballFlight) this.rtShowCommands();
    if (input.wasPressed('start')) this.openPartyMenu(false);
    if (input.wasPressed('select') && this.kind === 'wild') this.rtTryRun();

    // ---- Foe AI ----
    this.rtFoeThink(dt, dtms);
    // ---- Lunges + projectiles ----
    this.rtUpdateLunge(dtms);
    this.rtUpdateProjs(dtms);
  },

  rtFoeThink(dt, dtms) {
    const g = this.game;
    const rt = this.rt;
    const foe = this.foe;
    if (!foe || foe.hp <= 0 || rt.lunge) return;
    if (foe.status === 'sleep' && rt.foeSleepT > 0) return;
    if (foe.status === 'freeze') return;
    const foeSpe = this.effStats(foe, this.foeStages).spe;
    const d = dist(rt.fx, rt.fy, rt.ax, rt.ay);
    // Preferred range: closest ready move decides (melee 40, ranged 130).
    let want = 120;
    const ready = foe.moves.map((m, i) => i).filter((i) => foe.moves[i].pp > 0 && !rt.cds.foe[foe.moves[i].id]
      && !(foe.disableT > 0 && foe.disabledMove === i));
    for (const i of ready) {
      const mv = MOVES[foe.moves[i].id];
      if (mv.cat === 'physical') { want = 40; break; }
    }
    rt.foeStrafeT -= dtms;
    if (rt.foeStrafeT <= 0) { rt.foeStrafeT = 700 + Math.random() * 900; rt.foeDir = Math.random() < 0.5 ? -1 : 1; }
    const spd = (46 + foeSpe * 0.5) * (foe.status === 'paralysis' ? 0.55 : 1);
    let vx = 0, vy = 0;
    if (d > want + 8) { vx = (rt.ax - rt.fx) / d; vy = (rt.ay - rt.fy) / d; }
    else if (d < want - 26) { vx = -(rt.ax - rt.fx) / d; vy = -(rt.ay - rt.fy) / d; }
    else { vx = (-(rt.ay - rt.fy) / (d || 1)) * rt.foeDir * 0.6; vy = ((rt.ax - rt.fx) / (d || 1)) * rt.foeDir * 0.6; }
    rt.fx = clamp(rt.fx + vx * spd * dt, ARENA.x0, ARENA.x1);
    rt.fy = clamp(rt.fy + vy * spd * dt, ARENA.y0, ARENA.y1);
    rt.foeFace = rt.ax < rt.fx ? 'left' : 'right';
    // Fire a ready move when in range (leaders pick better lines).
    if (ready.length && rt.foeHoldT <= 0) {
      let idx = ready[Math.floor(Math.random() * ready.length)];
      if (this.trainer && (this.trainer.ai === 'smart' || this.trainer.ai === 'opener-setup')) {
        const allyTypes = SPECIES[this.ally.speciesId].types;
        let bestScore = -1;
        for (const i of ready) {
          const mv = MOVES[foe.moves[i].id];
          if (mv.cat === 'status') continue;
          const s = effectiveness(mv.type, allyTypes) * (0.5 + Math.random());
          if (s > bestScore) { bestScore = s; idx = i; }
        }
      }
      const mv = MOVES[foe.moves[idx].id];
      const range = mv.cat === 'physical' ? 52 : 190;
      if (d <= range) { this.rtUseMove('foe', idx); rt.foeHoldT = 260 + Math.random() * 320; }
    }
    if (rt.foeHoldT > 0) rt.foeHoldT -= dtms;
  },

  rtUseMove(side, idx) {
    const g = this.game;
    const rt = this.rt;
    const atk = side === 'ally' ? this.ally : this.foe;
    const def = side === 'ally' ? this.foe : this.ally;
    const slot = atk.moves[idx];
    if (!slot || slot.pp <= 0) return false;
    const mv = MOVES[slot.id];
    if (!mv || rt.cds[side][slot.id]) return false;
    // Status gates at action time.
    if (atk.status === 'paralysis' && roll(0.25, g.rng.battle)) {
      if (side === 'ally') this.rtFloat(displayName(atk, SPECIES) + ' is paralyzed!');
      return;
    }
    if (atk.status === 'freeze') { if (side === 'ally') this.rtFloat(displayName(atk, SPECIES) + ' is frozen solid!'); return; }
    if (atk.confused && roll(0.5, g.rng.battle)) {
      const st = this.effStats(atk, side === 'ally' ? this.allyStages : this.foeStages);
      const dmg = Math.max(1, calcDamage(atk.level, 40, st.atk, st.def, {}));
      atk.hp = Math.max(0, atk.hp - dmg);
      this.rtFloat(displayName(atk, SPECIES) + ' hurt itself in confusion!');
      rt.cds[side][slot.id] = 900;
      this.rtCheckFaints();
      return;
    }
    slot.pp--;
    atk.lastMoveIdx = idx;
    const atkSpe = this.effStats(atk, side === 'ally' ? this.allyStages : this.foeStages).spe;
    const defSpe = this.effStats(def, side === 'ally' ? this.foeStages : this.allyStages).spe;
    rt.cds[side][slot.id] = cooldownMs(mv, atkSpe, defSpe);
    const ax = side === 'ally' ? rt.ax : rt.fx, ay = side === 'ally' ? rt.ay : rt.fy;
    const dx = side === 'ally' ? rt.fx : rt.ax, dy = side === 'ally' ? rt.fy : rt.ay;
    if (mv.cat === 'status') {
      if (dist(ax, ay, dx, dy) <= 200) this.rtApplyEffect(side, mv);
      else if (side === 'ally') this.rtFloat('Too far away!');
      return true;
    }
    if (mv.cat === 'physical') {
      rt.lunge = { side, t: 0, dur: 190, mv, idx, hitDone: false };
      return true;
    }
    rt.projs.push({ x: ax, y: ay, tx: dx, ty: dy, speed: 300, mv, side, t: 0 });
    g.audio.playSfx('menu-move');
    return true;
  },

  rtUpdateLunge(dtms) {
    const rt = this.rt;
    if (!rt.lunge) return;
    const L = rt.lunge;
    L.t += dtms;
    const atkPos = L.side === 'ally' ? { x: rt.ax, y: rt.ay } : { x: rt.fx, y: rt.fy };
    const defPos = L.side === 'ally' ? { x: rt.fx, y: rt.fy } : { x: rt.ax, y: rt.ay };
    const k = Math.min(1, L.t / L.dur);
    const reach = dist(atkPos.x, atkPos.y, defPos.x, defPos.y);
    if (!L.hitDone && reach <= 50) {
      L.hitDone = true;
      this.rtApplyDamage(L.side, L.mv);
    }
    if (k >= 1) rt.lunge = null;
    else {
      // Dash toward the defender.
      const step = (340 * dtms) / 1000;
      const d = reach || 1;
      const nx = atkPos.x + ((defPos.x - atkPos.x) / d) * step;
      const ny = atkPos.y + ((defPos.y - atkPos.y) / d) * step;
      if (L.side === 'ally') { rt.ax = clamp(nx, ARENA.x0, ARENA.x1); rt.ay = clamp(ny, ARENA.y0, ARENA.y1); }
      else { rt.fx = clamp(nx, ARENA.x0, ARENA.x1); rt.fy = clamp(ny, ARENA.y0, ARENA.y1); }
    }
  },

  rtUpdateProjs(dtms) {
    const rt = this.rt;
    for (let i = rt.projs.length - 1; i >= 0; i--) {
      const p = rt.projs[i];
      const defPos = p.side === 'ally' ? { x: rt.fx, y: rt.fy } : { x: rt.ax, y: rt.ay };
      const d = dist(p.x, p.y, defPos.x, defPos.y);
      const step = (p.speed * dtms) / 1000;
      if (d <= Math.max(20, step)) {
        rt.projs.splice(i, 1);
        this.rtApplyDamage(p.side, p.mv);
      } else {
        p.x += ((defPos.x - p.x) / d) * step;
        p.y += ((defPos.y - p.y) / d) * step;
        p.t += dtms;
        if (p.t > 1600) rt.projs.splice(i, 1); // fizzle
      }
    }
  },

  rtAccHit(atk, def, mv, atkStages, defStages) {
    if (mv.neverMiss) return true;
    const g = this.game;
    // Gen-1 OHKO rule (ADR-018): (userLv - targetLv + 30) / 256.
    if ((mv.effect && mv.effect.ohko) || mv.ohko) {
      return roll(Math.max(0, Math.min(255, atk.level - def.level + 30)) / 256, g.rng.battle);
    }
    let p = ((mv.acc || 100) / 100) * accStageMultiplier(clamp((atkStages.acc || 0) - (defStages.eva || 0), -6, 6));
    if (p >= 1) p = 255 / 256;
    return roll(p, g.rng.battle);
  },

  rtApplyDamage(side, mv) {
    const g = this.game;
    const rt = this.rt;
    const atk = side === 'ally' ? this.ally : this.foe;
    const def = side === 'ally' ? this.foe : this.ally;
    const atkStages = side === 'ally' ? this.allyStages : this.foeStages;
    const defStages = side === 'ally' ? this.foeStages : this.allyStages;
    if (!atk || !def || def.hp <= 0) return;
    // Dodge i-frames: a dodging ally takes nothing.
    if (side === 'foe' && rt.iframes > 0) { this.rtFloat('Dodged!'); return; }
    if (!this.rtAccHit(atk, def, mv, atkStages, defStages)) {
      this.rtFloat(displayName(atk, SPECIES) + "'s " + mv.name + ' missed!');
      return;
    }
    const efx = mv.effect || {};
    const atkTypes = atk.tempTypes || (atk.transformed ? atk.transformed.types : SPECIES[atk.speciesId].types);
    const defTypes = def.tempTypes || (def.transformed ? def.transformed.types : SPECIES[def.speciesId].types);
    const eff = effectiveness(mv.type, defTypes);
    if (eff === 0) { this.rtFloat('It doesn\'t affect ' + displayName(def, SPECIES) + '...'); return; }
    if (efx.requiresSleep && def.status !== 'sleep') { this.rtFloat('But it failed!'); return; }
    const stab = atkTypes.includes(mv.type);
    const aStats = this.effStats(atk, atkStages);
    const dStats = this.effStats(def, defStages);
    const baseSpe = atk.transformed ? atk.transformed.baseSpe : SPECIES[atk.speciesId].base.spe;
    const crit = roll(critChance(baseSpe, { highCrit: !!mv.highcrit, focus: !!atk.focused }), g.rng.battle);
    const atkStat = mv.cat === 'physical' ? (crit ? atk.stats.atk : aStats.atk) : (crit ? atk.stats.spa : aStats.spa);
    const defStat = mv.cat === 'physical' ? (crit ? def.stats.def : dStats.def) : (crit ? def.stats.spd : dStats.spd);
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
          { stab, effectiveness: eff, crit, random: gen1Random(g.rng.battle), burn: atk.status === 'burn', physical: mv.cat === 'physical' });
      }
    }
    if (mv.cat === 'physical' && def.reflectT > 0) dmg = Math.max(1, Math.floor(dmg / 2));
    if (mv.cat === 'special' && def.lightT > 0) dmg = Math.max(1, Math.floor(dmg / 2));
    if (def.subHp > 0) { def.subHp -= dmg; if (def.subHp <= 0) def.subHp = 0; dmg = 0; }
    if (dmg > 0) {
      def.hp = Math.max(0, def.hp - dmg);
      g.audio.hitFeedback(eff);
      if (crit) this.rtFloat('A critical hit!');
      else if (eff > 1) this.rtFloat("It's super effective!");
      else if (eff < 1) this.rtFloat("It's not very effective...");
      if (def.status === 'freeze' && mv.type === 'fire') def.status = null;
      if (efx.drain) atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(dmg * efx.drain));
      if (efx.recoil) atk.hp = Math.max(0, atk.hp - Math.max(1, Math.floor(dmg * efx.recoil)));
      let statusRoll = efx.status;
      if (efx.statusAny) statusRoll = efx.statusAny[Math.floor(g.rng.battle() * efx.statusAny.length)];
      if (statusRoll && def.hp > 0 && (!efx.chance || roll(efx.chance / 100, g.rng.battle))) {
        if (statusRoll === 'confusion') { def.confused = true; def.confusedTurns = 3; }
        else if (!def.status) {
          def.status = statusRoll;
          if (statusRoll === 'sleep') {
            const turns = 1 + Math.floor(g.rng.battle() * 7);
            if (def === this.foe) this.rt.foeSleepT = turns * 1100; else this.rt.allySleepT = turns * 1100;
          }
        }
      }
      for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) {
        if (efx[k] && def.hp > 0 && (!efx.stageChance || roll(efx.stageChance / 100, g.rng.battle))) {
          if (!(def.mistT > 0 && efx[k] < 0)) defStages[k] = clamp((defStages[k] || 0) + efx[k], -6, 6);
        }
      }
      if (efx.flinch && def.hp > 0 && roll(efx.flinch / 100, g.rng.battle)) {
        rt.cds[side === 'ally' ? 'foe' : 'ally'] = {};
        this.rtFloat(displayName(def, SPECIES) + ' flinched!');
      }
      if (efx.seed) def.seeded = true;
      if (mv.recharge) rt.cds[side][atk.moves[atk.lastMoveIdx] ? atk.moves[atk.lastMoveIdx].id : mv.id] = (rt.cds[side][mv.id] || 0) + 1200;
      if (efx.selfFaint) atk.hp = 0;
    }
    this.rtCheckFaints();
  },

  rtApplyEffect(side, mv) {
    const g = this.game;
    const atk = side === 'ally' ? this.ally : this.foe;
    const def = side === 'ally' ? this.foe : this.ally;
    const ef = mv.effect || {};
    const atkStages = side === 'ally' ? this.allyStages : this.foeStages;
    const defStages = side === 'ally' ? this.foeStages : this.allyStages;
    if (ef.heal) { atk.hp = Math.min(atk.maxHp, atk.hp + Math.floor(atk.maxHp * ef.heal)); return; }
    if (ef.rest) { atk.hp = atk.maxHp; atk.status = 'sleep'; if (side === 'ally') this.rt.allySleepT = 2200; else this.rt.foeSleepT = 2200; return; }
    if (ef.substitute) { const c = Math.floor(atk.maxHp / 4); if (atk.subHp <= 0 && atk.hp > c) { atk.hp -= c; atk.subHp = c; } return; }
    if (ef.screen) { if (ef.screen === 'physical') atk.reflectT = 5; else atk.lightT = 5; return; }
    if (ef.mist) { atk.mistT = 5; return; }
    if (ef.focus) { atk.focused = true; return; }
    if (ef.seed) { def.seeded = true; return; }
    if (ef.haze) { for (const s of [this.allyStages, this.foeStages]) for (const k of Object.keys(s)) s[k] = 0; return; }
    if (ef.flee) { if (this.kind === 'wild' && side === 'ally') this.endBattle(true); return; }
    let applied = false;
    for (const k of ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva']) {
      if (ef[k]) {
        const stages = ef.target === 'self' ? atkStages : defStages;
        if (!(ef.target !== 'self' && def.mistT > 0 && ef[k] < 0)) {
          stages[k] = clamp((stages[k] || 0) + ef[k], -6, 6);
          applied = true;
        }
      }
    }
    if (ef.status && !applied) {
      const target = ef.target === 'self' ? atk : def;
      if (ef.status === 'confusion') { target.confused = true; target.confusedTurns = 3; }
      else if (!target.status) {
        target.status = ef.status;
        if (ef.status === 'sleep') {
          const turns = 1 + Math.floor(g.rng.battle() * 7);
          if (target === this.foe) this.rt.foeSleepT = turns * 1100; else this.rt.allySleepT = turns * 1100;
        }
      }
    }
  },

  rtFloat(text) {
    // Lightweight announcement lane for RT (full dialogue would freeze play).
    const rt = this.rt;
    if (!rt || rt.msgCd > 0) return;
    rt.msgCd = 500;
    this.game.ui.log.push({ ui: 'battle-rt', text });
    this.rtFloatText = text;
    this.rtFloatT = 1400;
  },

  rtBallMenu() {
    const g = this.game;
    const items = [];
    for (const bid of ['pokeball', 'greatball', 'ultraball', 'masterball']) {
      const n = g.state.bag[bid] || 0;
      items.push({ label: (bid === 'pokeball' ? 'Poke Ball' : bid === 'greatball' ? 'Great Ball' : bid === 'ultraball' ? 'Ultra Ball' : 'Master Ball') + ' x' + n, value: bid, disabled: n <= 0 });
    }
    items.push({ label: 'Back', value: null });
    g.ui.showMenu('Throw which ball? (A)', items, (v) => {
      if (v) this.rtThrowBall(v);
      else this.rtShowCommands(); // Back/cancel -> command grid (classic parity)
    }, { menuClass: 'battlewin' });
  },

  rtThrowBall(ballId) {
    const g = this.game;
    if ((g.state.bag[ballId] || 0) <= 0) return;
    g.state.bag[ballId]--;
    const rt = this.rt;
    rt.ballFlight = { x: rt.ax, y: rt.ay, t: 0, dur: 330, ballId, fromX: rt.ax, fromY: rt.ay };
    g.audio.playSfx('catch-throw');
  },

  rtUpdateBall(dtms) {
    const rt = this.rt;
    const b = rt.ballFlight;
    b.t += dtms;
    const k = Math.min(1, b.t / b.dur);
    b.x = b.fromX + (rt.fx - b.fromX) * k;
    b.y = b.fromY + (rt.fy - b.fromY) * k - Math.sin(k * Math.PI) * 40;
    if (k >= 1) {
      rt.ballFlight = null;
      // A sprinting/dodging wild mon can evade the throw itself.
      const g = this.game;
      const foeMoving = Math.abs(this.rt.foeDir) > 0 && this.foe.status !== 'sleep' && this.foe.status !== 'freeze';
      if (foeMoving && roll(0.18, g.rng.battle)) {
        this.rtFloat('It dodged the ball!');
        return;
      }
      const foe = this.foe;
      const res = gen1Catch(foe.maxHp, foe.hp, SPECIES[foe.speciesId].catchRate, b.ballId, foe.status, g.rng.battle);
      rt.catchSeq = { t: 0, shakes: 0, need: res.caught ? 3 : res.shakes, willCatch: res.caught, ballId: b.ballId };
      g.audio.playSfx('catch-rattle');
    }
  },

  rtUpdateCatch(dtms) {
    const rt = this.rt;
    const c = rt.catchSeq;
    c.t += dtms;
    const doneShakes = Math.floor(c.t / 700);
    if (c.shakes < doneShakes && c.shakes < c.need) { c.shakes++; this.game.audio.playSfx('catch-rattle'); }
    if (c.t >= c.need * 700 + 260) {
      rt.catchSeq = null;
      if (c.willCatch) this.catchSuccess();
      else this.rtFloat('Oh no! ' + displayName(this.foe, SPECIES) + ' broke free!');
    }
  },

  rtTryRun() {
    const g = this.game;
    this.runAttempts++;
    const F = Math.floor((Math.max(1, this.ally.stats.spe) * 128) / Math.max(1, this.foe.stats.spe)) + 30 * this.runAttempts;
    if (F > 255 || Math.floor(g.rng.battle() * 256) < F) {
      this.say('Got away safely!', () => this.endBattle(true));
    } else {
      this.rtFloat("Can't escape!");
      this.rt.dodgeCd = Math.max(this.rt.dodgeCd, 600);
    }
  },

  rtCheckFaints() {
    const g = this.game;
    if (this.foe && this.foe.hp <= 0) {
      this.state = 'faintfoe';
      this.afterFaintFoe();
      return true;
    }
    if (this.ally && this.ally.hp <= 0) {
      const anyLeft = g.state.party.some((m) => m.hp > 0);
      if (!anyLeft) {
        this.state = 'defeat';
        this.say('You have no Pokemon left!', () => this.afterMsg());
      } else {
        this.openPartyMenu(true);
      }
      return true;
    }
    return false;
  },

  renderRt(r) {
    const g = this.game;
    const rt = this.rt;
    const w = r.viewW, h = r.viewH;
    const sx = w / 480, sy = h / 320;
    // Transform discipline (title/intro pattern): pin the camera to the
    // origin for the screen-space arena, restore it after end().
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    // UI v2 (Platinum standard): the shared battlefield (drawArena/ptDisc
    // live in battle.mjs). The horizon is compressed to a top strip —
    // the RT arena's free movement spans the rest of the field, so the
    // stepped platforms travel with their battlers instead of sitting
    // fixed like the classic theater's (documented RT divergence).
    const c = r.ctx;
    this.drawArena(r, 0.22);
    if (!(rt.catchSeq || rt.ballFlight)) {
      this.ptDisc(r, rt.fx * sx, rt.fy * sy + 20, 30, 8);
    }
    this.ptDisc(r, rt.ax * sx, rt.ay * sy + 20, 30, 8);
    const foeArt = g.spriteCache[this.foe.speciesId] || g.spriteCache.partner;
    const allyArt = g.spriteCache[this.ally.speciesId] || g.spriteCache.partner;
    const bobA = Math.sin(this.t * 0.006) * 1.5;
    if (!(rt.catchSeq || rt.ballFlight)) {
      r.blitS(foeArt.front, rt.fx * sx - 24, rt.fy * sy - 24 + bobA, 48, 48);
    }
    const allySpr = this.ally.status === 'sleep' ? allyArt.back : allyArt.back;
    r.blitS(allySpr, rt.ax * sx - 24, rt.ay * sy - 24 - bobA, 48, 48);
    // Projectiles.
    for (const p of rt.projs) {
      g.ctx2dcircle(p.x * sx, p.y * sy, 4, p.side === 'ally' ? '#ffe27a' : '#ff9a7a');
    }
    // Ball flight + catch shakes.
    if (rt.ballFlight) {
      g.ctx2dcircle(rt.ballFlight.x * sx, rt.ballFlight.y * sy, 5, '#e84040');
    }
    if (rt.catchSeq) {
      const wob = Math.sin(rt.catchSeq.t * 0.05) * 3;
      g.ctx2dcircle(rt.fx * sx + wob, rt.fy * sy, 6, '#e8e8f0');
      g.ctx2dcircle(rt.fx * sx + wob, rt.fy * sy - 2, 6, '#e84040');
    }
    r.end();
    r.camX = pcx; r.camY = pcy;
    this.plate(r, 6, 6, this.foe, this.hpAnim.foe, false);
    this.plate(r, w - 146, h - 124, this.ally, this.hpAnim.ally, true);
    // Cooldown chips for the ally's four moves (bottom strip). Chip width is
    // derived from the actual view: the old fixed 108px assumed a 480-wide
    // canvas, so at real 256/384-wide layouts chips 3-4 started offscreen.
    const chipW = Math.floor((w - 24) / 4); // 4 chips, 3 gaps of 4, 6px margins
    const labelMax = Math.max(4, Math.min(10, Math.floor((chipW - 8) / 7)));
    for (let i = 0; i < 4; i++) {
      const slot = this.ally.moves[i];
      const x = 6 + i * (chipW + 4);
      const y = h - 26;
      if (!slot) { r.panel(x, y, chipW, 20, 'rgba(43,48,64,0.55)', PT_FRAME); continue; }
      const mv = MOVES[slot.id];
      const cd = rt.cds.ally[slot.id] || 0;
      const ready = cd <= 0 && slot.pp > 0;
      // UI v2: chips are Platinum windows (r.panel -> ptFrame) in PT tones —
      // navy PT_FRAME interior, PT_PAPER text when ready, PT_FRAME2 when not.
      r.panel(x, y, chipW, 20, ready ? 'rgba(43,48,64,0.92)' : 'rgba(43,48,64,0.6)', PT_FRAME);
      const label = (i + 1) + ' ' + (mv ? mv.name : slot.id);
      // A spent slot also carries 'NO PP' at the chip's right end — shorten
      // the label so the two never collide on narrow chips.
      const maxChars = slot.pp <= 0 ? Math.max(3, Math.min(labelMax, Math.floor((chipW - 46) / 7))) : labelMax;
      r.text(label.slice(0, maxChars), x + 4, y + 2, { size: 14, color: ready ? PT_PAPER : PT_FRAME2, shadow: false });
      if (!ready && slot.pp > 0) {
        // Cooldown pip: a PT_FRAME2 sweep draining along the chip's base.
        const total = cooldownMs(mv, 50, 50);
        const frac = Math.max(0, Math.min(1, cd / total));
        c.fillStyle = PT_FRAME2;
        c.fillRect(x + 2, y + 16, (chipW - 4) * (1 - frac), 2);
      }
      if (slot.pp <= 0) r.text('NO PP', x + chipW - 40, y + 2, { size: 14, color: '#f84838', shadow: false });
    }
    if (this.rtFloatText && this.rtFloatT > 0) {
      this.rtFloatT -= 16;
      // Panel fits the view and the text slice fits the panel (~7px/char at
      // 14px): the old fixed 30-char slice could overrun the 220px panel.
      const floatW = Math.min(220, w - 16);
      const floatMax = Math.max(8, Math.floor((floatW - 12) / 7));
      r.panel(w / 2 - floatW / 2, 40, floatW, 22, 'rgba(43,48,64,0.88)', PT_FRAME);
      r.text(this.rtFloatText.slice(0, floatMax), w / 2 - floatW / 2 + 6, 44, { size: 14, color: PT_PAPER, shadow: false });
    }
    if (this.msgOpen || this.msg) {
      r.panel(4, h - 52, w - 8, 48, PT_PAPER, PT_FRAME);
      // UI v2.3 (defect 1): measured word-wrap (r.wrapText), as classic.
      const lines = r.wrapText(this.msg, 14, w - 20, { maxLines: 2 });
      if (lines[0]) r.text(lines[0], 10, h - 46, { size: 14, color: '#202028', shadow: false });
      if (lines[1]) r.text(lines[1], 10, h - 28, { size: 14, color: '#202028', shadow: false });
      // UI v2: red advance cue at the box's bottom-right while waiting for input.
      if (this.msgOpen) r.text('▼', w - 20, h - 24, { size: 14, bold: true, color: '#e03c31', shadow: false });
    }
    this.t += 16;
  },
});
