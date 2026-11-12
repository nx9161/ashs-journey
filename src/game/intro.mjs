// intro.mjs — professor intro, name entry, starter moment (VOLTIK refuses the ball).
// Original dialogue. P0/C3: name entry is an A-Z grid keyboard (44px keys,
// physical-keyboard support, 8-char max, validation shake). P1/C4: rival name
// entry reuses the grid. P1/C5: "Skip intro (veteran)" offered on replay
// (default OFF); hold START 1s during the intro offers a skip confirm.

import { INTRO_SCRIPT } from '../data/dialogue.mjs';
import { makeMon, dexRegister } from './state.mjs';
import { houseRule } from './rules.mjs';
import { SPECIES } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { SFX } from '../engine/audio.mjs';

export class IntroScene {
  enter() {
    this.step = 'ask-skip';
    this.lineIdx = 0;
    this.name = 'ASH';
    this.rival = 'GARY';
    this._startHeld = 0;
    this.game.ui.log.push({ ui: 'intro' });
    const g = this.game;
    // ADR-025 §4: the Skip Intro House Rule earns the same veteran offer
    // (offered, never silent — the toggle changes who qualifies, not the
    // shape of the choice).
    const canSkip = g.skipIntroVeteran || houseRule(g.state, 'skipIntro');
    if (canSkip && !g.ui.headless) {
      // P1/C5: offered, never silent — default OFF (watch the intro).
      this.step = 'offer-skip';
      g.ui.showMenu('A save already exists.', [
        { label: 'Watch the intro', value: 'watch' },
        { label: 'Skip intro (veteran)', value: 'skip' },
      ], (v) => {
        if (v === 'skip') { this.finishIntro(); return; }
        this.begin();
      });
      return;
    }
    if (canSkip) { this.finishIntro(); return; } // headless: keep harness timing
    this.begin();
  }

  begin() {
    const g = this.game;
    this.step = 'professor';
    this._startHeld = 0;
    const lines = INTRO_SCRIPT.lines.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => this.nameEntry(), INTRO_SCRIPT.professor);
  }

  nameEntry() {
    // P0/C3: full A-Z grid ships now (replaces the Wave-1 two-option menu).
    const g = this.game;
    this.step = 'name';
    g.ui.showNameEntry('Your name?', 'ASH', 8, (value) => {
      this.name = value;
      g.state.player.name = this.name;
      if (g.ui.headless) {
        // Harness path: the intro harness asserts starter dialogue immediately
        // after the name choice, so the rival keeps its default here.
        this.rivalEntryDone();
        return;
      }
      // P1/C4: rival name entry reuses the same grid.
      this.step = 'rival';
      g.ui.showNameEntry("Rival's name?", 'GARY', 8, (rv) => {
        this.rival = rv;
        g.state.player.rivalName = this.rival;
        this.rivalEntryDone();
      });
    });
  }

  rivalEntryDone() {
    this.step = 'starter';
    this.starterMoment();
  }

  starterMoment() {
    const g = this.game;
    const lines = INTRO_SCRIPT.starterMoment.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => {
      this.grantPartner();
      this.finishIntro();
    }, INTRO_SCRIPT.professor);
  }

  // The partner grant, idempotent: party member + dex seen/caught + story
  // flags. The watched flow reaches it via starterMoment(); finishIntro()
  // backstops it so EVERY skip path (veteran offer, hold-START confirm,
  // headless) converges on the same state. (UI v2.2 defect 4: skipping used
  // to call finishIntro() alone — empty party, first wild battle soft-locked
  // on a faded screen because no ally existed.)
  grantPartner() {
    const g = this.game;
    if (g.state.party.some((m) => m && m.speciesId === 'partner')) return;
    // Partner joins OUTSIDE the ball system (EP014 homage — hard rule).
    const pikachu = makeMon('partner', 5, SPECIES, MOVES);
    g.state.party.push(pikachu);
    const sp = SPECIES.partner;
    dexRegister(g.state.dex, 'seen', sp.dexNo);
    dexRegister(g.state.dex, 'caught', sp.dexNo);
    g.state.story.flags.metPartner = true;
    g.state.story.flags.refusedBall = true;
    g.audio.playSfx('dex-register');
    g.ui.toast(sp.name + ' joined your party!');
  }

  finishIntro() {
    const g = this.game;
    this.grantPartner(); // skip paths land here directly — converge state first
    // ADR-025 §6 (starter breadth): a Second Journey's intro offers the
    // reunion — each starter line a completed journey chose may join
    // NOW, at the start, instead of waiting for its gift event (the
    // gift events stay live regardless; declining loses nothing). A
    // first journey carries no lines and sees no offer: its intro is
    // byte-identical to before Phase 6. Headless keeps harness timing.
    const lines = (g.state.story.starterLines || [])
      .filter((id) => !g.state.story.flags['starter_reunion_' + id]);
    if (lines.length && !g.ui.headless) {
      for (const id of g.state.story.starterLines) g.state.story.flags['starter_reunion_' + id] = true;
      const items = lines.map((id) => ({ label: SPECIES[id].name + ' — an old friend is waiting', value: id }));
      items.push({ label: 'Not now', value: null });
      g.ui.showMenu('By the lab fence, a familiar face is waiting...', items, (v) => {
        if (v && SPECIES[v]) {
          const mon = makeMon(v, 5, SPECIES, MOVES);
          g.state.party.push(mon);
          dexRegister(g.state.dex, 'seen', SPECIES[v].dexNo);
          dexRegister(g.state.dex, 'caught', SPECIES[v].dexNo);
          g.audio.playSfx('dex-register');
          g.ui.toast(SPECIES[v].name + ' joined your party!');
        }
        this.completeIntro();
      });
      return;
    }
    this.completeIntro();
  }

  completeIntro() {
    const g = this.game;
    g.state.story.flags.introDone = true;
    g.state.story.chapter = 0; // D2: Act I opens on Chapter 1 (ADR-015 spine)
    g.state.story.position = { map: 'pallet', x: 7, y: 7, dir: 'down' };
    g.saveGame(true);
    g.startOverworld({ chapterCard: 0 });
  }

  update(dt) {
    // P1/C5: hold START 1s during the professor intro -> "Skip intro?" confirm.
    // Reduced motion: the confirm still applies (no animation to replace).
    const g = this.game;
    if (this.step !== 'professor' || !g.ui.dialogueOpen) { this._startHeld = 0; return; }
    if (g.input.isHeld('start')) {
      this._startHeld += dt;
      if (this._startHeld >= 1) {
        this._startHeld = 0;
        this.step = 'confirm-skip';
        // AUDIT FIX (S-21): remember the current line — 'Keep watching'
        // used to restart the professor's whole script from line one.
        this._resumeIdx = g.ui.dlg ? g.ui.dlg.idx : 0;
        g.ui.closeDialogue();
        g.ui.showMenu('Skip the intro?', [
          { label: 'Keep watching', value: 'no' },
          { label: 'Skip intro', value: 'yes' },
        ], (v) => {
          if (v === 'yes') { this.finishIntro(); return; }
          this.step = 'professor';
          const lines = INTRO_SCRIPT.lines.map((l) => l.replace('{player}', this.name)).slice(this._resumeIdx || 0);
          g.ui.say(lines.length ? lines : INTRO_SCRIPT.lines, () => this.nameEntry(), INTRO_SCRIPT.professor);
        });
      }
    } else {
      this._startHeld = 0;
    }
  }

  render(r) {
    // Professor's lab: a real interior in the same flat style — warm wall
    // (upper 2/3), darker floor (lower 1/3) with a baseboard line, simple
    // original lab props, and the professor himself, large and centered
    // above the dialogue zone. The speaker name lives on the DOM dialogue
    // name plate (ui.say receives INTRO_SCRIPT.professor) — no bare canvas
    // name text here. All art access is guarded like title.mjs so headless
    // node suites stay green when artCanvas/document are unavailable.
    // Transform discipline: draw inside begin()/end() like every other
    // scene, camera pinned to the origin (no world camera here).
    const pcx = r.camX, pcy = r.camY; r.camX = 0; r.camY = 0;
    r.begin();
    const g = this.game;
    const w = r.viewW, h = r.viewH;
    const cx = w / 2;
    const floorY = Math.round((h * 2) / 3);
    const floorH = h - floorY;

    // --- Interior shell ---
    g.ctx2dfill('#6a5741', 0, 0, w, floorY); // wall (warm lab tone)
    g.ctx2dfill('#5d4b37', 0, 0, w, 8); // soft ceiling shadow band
    g.ctx2dfill('#382c21', 0, floorY, w, floorH); // floor (darker)
    // Floor perspective lines (flat, receding boards).
    g.ctx2dfill('#463829', 0, floorY + Math.round(floorH * 0.38), w, 2);
    g.ctx2dfill('#2f251c', 0, floorY + Math.round(floorH * 0.72), w, 2);
    // Baseboard: light strip + dark seam where wall meets floor.
    g.ctx2dfill('#8a7458', 0, floorY - 4, w, 4);
    g.ctx2dfill('#241a12', 0, floorY, w, 2);

    // --- Prop 1: cabinet / shelf silhouette (left), muted bottles ---
    {
      const cabW = 44, cabH = 54, cabX = 8, cabY = floorY - cabH;
      g.ctx2dfill('#4c5a48', cabX, cabY, cabW, cabH);
      g.ctx2dfill('#333d31', cabX, cabY + cabH - 3, cabW, 3);
      g.ctx2dfill('#3c4838', cabX + 3, cabY + 17, cabW - 6, 2); // shelf lines
      g.ctx2dfill('#3c4838', cabX + 3, cabY + 33, cabW - 6, 2);
      g.ctx2dfill('#7a9a8a', cabX + 7, cabY + 8, 5, 8); // bottles (muted)
      g.ctx2dfill('#c8a86a', cabX + 16, cabY + 9, 4, 7);
      g.ctx2dfill('#8a7a9a', cabX + 27, cabY + 8, 5, 8);
      g.ctx2dfill('#a05a3c', cabX + 8, cabY + 24, 6, 8);
      g.ctx2dfill('#7a9a8a', cabX + 24, cabY + 25, 5, 7);
      g.ctx2dfill('#c8c8d0', cabX + 10, cabY + 40, 10, 9); // stacked books/papers
      g.ctx2dfill('#8a7458', cabX + 12, cabY + 42, 10, 2);
    }

    // --- Prop 2: potted plant (left of the professor) ---
    {
      const potW = 16, potX = 58, potY = floorY - 10;
      g.ctx2dcircle(potX + 3, potY - 5, 5, '#4a7a3a'); // leaves
      g.ctx2dcircle(potX + potW - 3, potY - 5, 5, '#4a7a3a');
      g.ctx2dcircle(potX + potW / 2, potY - 9, 5, '#3c6630');
      g.ctx2dfill('#8a4a32', potX, potY, potW, 10); // pot
      g.ctx2dfill('#a05a3c', potX - 2, potY, potW + 4, 3); // rim
    }

    // --- Prop 3: lab machine with a glass dome (right) ---
    {
      const mW = 48, mH = 46, mX = w - 56, mY = floorY - mH;
      g.ctx2dcircle(mX + mW / 2, mY + 15, 13, 'rgba(170,205,220,0.55)'); // dome
      g.ctx2dcircle(mX + mW / 2, mY + 16, 6, '#d8b84a'); // specimen glow inside
      g.ctx2dfill('#5d646e', mX, mY + 24, mW, mH - 24); // base unit
      g.ctx2dfill('#4a5058', mX + 4, mY + 28, mW - 8, 8); // control inset
      g.ctx2dcircle(mX + mW - 9, mY + 32, 2, '#7ac86a'); // status light
      g.ctx2dfill('#33383f', mX, mY + mH - 3, mW, 3); // feet shadow
    }

    // --- Professor: large portrait, centered above the dialogue zone ---
    const scale = (w >= 320 || h >= 250) ? 5 : 4; // 24x24 art -> 120 or 96 px
    const size = 24 * scale;
    const animT = (g && typeof g._animT === 'number') ? g._animT : 0;
    const bob = Math.round(Math.sin(animT / 600) * 1); // gentle +/-1px idle
    const px = Math.round(cx - size / 2);
    const py = floorY + 6 - size + bob;
    // Soft oval shadow / plate grounding the portrait on the floor line.
    try {
      const c = r.ctx;
      c.fillStyle = 'rgba(20,14,8,0.35)';
      c.beginPath();
      if (typeof c.ellipse === 'function') c.ellipse(cx, floorY + 8, size * 0.42, 6, 0, 0, Math.PI * 2);
      else c.arc(cx, floorY + 8, size * 0.3, 0, Math.PI * 2);
      c.fill();
    } catch (e) {
      g.ctx2dfill('rgba(20,14,8,0.35)', cx - size * 0.4, floorY + 5, size * 0.8, 5);
    }
    let spr = null;
    try {
      if (typeof document !== 'undefined' && typeof artCanvas === 'function') {
        spr = artCanvas(document, 'portrait-hawthorn', scale, false);
      }
    } catch (e) { spr = null; }
    if (spr) {
      r.blitS(spr, px, py, size, size);
    } else {
      // Fallback silhouette (original shapes) when portrait art is absent:
      // head + lab coat, same footprint as the portrait treatment.
      g.ctx2dcircle(cx, py + size * 0.32, size * 0.17, '#c8c4bc'); // hair
      g.ctx2dcircle(cx, py + size * 0.36, size * 0.14, '#f0c090'); // face
      g.ctx2dfill('#f0f0f0', cx - size * 0.21, py + size * 0.5, size * 0.42, size * 0.46); // coat
      g.ctx2dfill('#7a8a5a', cx - size * 0.05, py + size * 0.56, size * 0.1, size * 0.3); // shirt
    }
    r.end(); r.camX = pcx; r.camY = pcy;
  }
}
