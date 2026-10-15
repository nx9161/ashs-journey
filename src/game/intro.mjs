// intro.mjs — professor intro, name entry, starter moment (Pikachu refuses the ball).
// Original dialogue. Skippable on replay via "Skip intro (veteran)" (gameux §5).

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
    this.game.ui.log.push({ ui: 'intro' });
    this.begin();
  }

  begin() {
    const g = this.game;
    if (g.skipIntroVeteran) {
      this.finishIntro();
      return;
    }
    this.step = 'professor';
    const lines = INTRO_SCRIPT.lines.map((l) => l.replace('{player}', this.name));
    g.ui.say(lines, () => this.nameEntry(), INTRO_SCRIPT.professor);
  }

  nameEntry() {
    // Slice build: name entry keeps the canon default; full A-Z grid ships Wave 2.
    const g = this.game;
    g.ui.showMenu('Your name?', [
      { label: 'ASH (default)', value: 'ASH' },
      { label: 'Keep: ' + (g.state.player.name || 'ASH'), value: g.state.player.name || 'ASH' },
    ], (value) => {
      if (value) this.name = value;
      g.state.player.name = this.name;
      this.starterMoment();
    });
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

  update(dt) { /* UI modal drives */ }
  render(r) {
    // Professor's lab backdrop: original flat bands.
    const w = r.viewW, h = r.viewH;
    const bands = ['#1a2a4a', '#2a3a5a', '#3a4a6a'];
    for (let i = 0; i < bands.length; i++) {
      this.game.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    r.text(INTRO_SCRIPT.professor, 8, 8, { size: 10, bold: true, color: '#ffe9a8' });
  }
}
