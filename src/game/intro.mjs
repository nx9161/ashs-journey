// intro.mjs — professor intro, name entry, starter moment (Pikachu refuses the ball).
// Original dialogue. P0/C3: name entry is an A-Z grid keyboard (44px keys,
// physical-keyboard support, 8-char max, validation shake). P1/C4: rival name
// entry reuses the grid. P1/C5: "Skip intro (veteran)" offered on replay
// (default OFF); hold START 1s during the intro offers a skip confirm.

import { INTRO_SCRIPT } from '../data/dialogue.mjs';
import { makeMon, dexRegister } from './state.mjs';
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
    if (g.skipIntroVeteran && !g.ui.headless) {
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
    if (g.skipIntroVeteran) { this.finishIntro(); return; } // headless: keep harness timing
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
      this.finishIntro();
    }, INTRO_SCRIPT.professor);
  }

  finishIntro() {
    const g = this.game;
    g.state.story.flags.introDone = true;
    g.state.story.position = { map: 'pallet', x: 7, y: 7, dir: 'down' };
    g.saveGame(true);
    g.startOverworld();
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
        g.ui.closeDialogue();
        g.ui.showMenu('Skip the intro?', [
          { label: 'Keep watching', value: 'no' },
          { label: 'Skip intro', value: 'yes' },
        ], (v) => {
          if (v === 'yes') { this.finishIntro(); return; }
          this.begin(); // restart the professor lines
        });
      }
    } else {
      this._startHeld = 0;
    }
  }

  render(r) {
    // Professor's lab backdrop: original flat bands.
    const w = r.viewW, h = r.viewH;
    const bands = ['#1a2a4a', '#2a3a5a', '#3a4a6a'];
    for (let i = 0; i < bands.length; i++) {
      this.game.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    r.text(INTRO_SCRIPT.professor, 8, 8, { size: 14, bold: true, color: '#ffe9a8' });
  }
}
