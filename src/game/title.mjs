// title.mjs — boot disclaimer card (GC verbatim, §2a) + title screen.
// The legal card renders in the shell before any interactive element and is not
// skippable-in-one-tap on first boot (readable dwell >= 3 seconds).

export const DISCLAIMER_BOOT = [
  "ASH'S JOURNEY",
  'An unofficial fan homage. Not affiliated with, endorsed by, or connected to',
  'Nintendo, Creatures Inc., or GAME FREAK inc.',
  '',
  'Pok\u00e9mon, Pikachu, and all character names are trademarks of',
  'Nintendo / Creatures Inc. / GAME FREAK inc.',
  'This is a free, non-commercial fan project made with love by fans.',
  'No purchase is required or accepted. Please support the official releases.',
];

export const DISCLAIMER_CREDITS = [
  'LEGAL',
  '',
  'This game is an unofficial fan work and is not affiliated with, endorsed by,',
  'sponsored by, or connected to Nintendo Co., Ltd., Creatures Inc., or',
  'GAME FREAK inc. Pok\u00e9mon and all related names, characters, and indicia are',
  'trademarks of their respective owners.',
  '',
  'All code, artwork, music, sound effects, and dialogue in this game are',
  'original creations made for this fan project; no game assets were copied or',
  'extracted from any official release.',
  '',
  'This game is free, carries no advertising, accepts no payments, donations,',
  'or tips, and collects no personal data for commercial purposes.',
  '',
  'If you represent a rights holder and have concerns about this project,',
  'contact the developer directly and we will respond promptly.',
  '// OQ-grade: rights-holder contact resolves to an owner-designated address',
  '// before any public share. Not a dead link in a signed build.',
];

export const GAME_TITLE = "ASH'S JOURNEY";
export const GAME_SUBTITLE = 'An Unofficial Fan Homage';

export class BootScene {
  enter() {
    this.t = 0;
    this.phase = 'legal'; // legal -> title
    this.ready = false;  // interactive only after dwell
    this.menuIdx = 0;
    this.game.ui.log.push({ ui: 'boot' });
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.phase === 'legal') {
      if (this.t >= 3) this.ready = true;
      if (this.ready && (input.wasPressed('a') || input.wasPressed('start'))) {
        this.phase = 'title';
        this.t = 0;
        this.game.audio.unlock();
        this.game.audio.playMusic('title-theme'); // original score; unlock gate satisfied by the gesture
      }
      return;
    }
    // title menu
    const items = this.menuItems();
    if (input.wasPressed('up')) { this.menuIdx = (this.menuIdx + items.length - 1) % items.length; }
    if (input.wasPressed('down')) { this.menuIdx = (this.menuIdx + 1) % items.length; }
    if (input.wasPressed('a') || input.wasPressed('start')) {
      const it = items[this.menuIdx];
      this.game.audio.unlock();
      if (it.value === 'new') this.game.newGame();
      else if (it.value === 'continue') this.game.continueGame();
      else if (it.value === 'options') this.game.openOptions();
    }
  }
  menuItems() {
    const items = [{ label: 'New Game', value: 'new' }];
    if (this.game.store.exists()) items.push({ label: 'Continue', value: 'continue' });
    items.push({ label: 'Options', value: 'options' });
    return items;
  }
  render(r) {
    const g = this.game;
    if (this.phase === 'legal') {
      this.renderLegal(r);
      return;
    }
    // Title art: original — rising sun bands + silhouettes (no official key art).
    const w = r.viewW, h = r.viewH;
    const bands = ['#2a1a3a', '#5a2a4a', '#a04a3a', '#e08a4a', '#f8c86a'];
    for (let i = 0; i < bands.length; i++) {
      g.ctx2dfill(bands[i], 0, (h * i) / bands.length, w, h / bands.length + 1);
    }
    // Sun disc
    g.ctx2dcircle(w / 2, h * 0.42, 26, '#ffe9a8');
    // Ash + Pikachu silhouettes (original shapes)
    g.ctx2dcircle(w / 2 - 14, h * 0.62, 7, '#1a1a22');
    g.ctx2drect(w / 2 - 20, h * 0.62 + 5, 12, 14, '#1a1a22');
    g.ctx2dcircle(w / 2 + 16, h * 0.66, 5, '#1a1a22');
    r.text(GAME_TITLE, 8, 8, { size: 14, bold: true, color: '#fff' });
    r.text(GAME_SUBTITLE, 8, 26, { size: 8, color: '#ffe9a8' });
    const items = this.menuItems();
    const pulse = Math.floor(this.t * 2) % 2 === 0;
    items.forEach((it, i) => {
      const y = h - 64 + i * 14;
      r.text((i === this.menuIdx ? '\u25b8 ' : '  ') + it.label, w / 2 - 40, y,
        { size: 10, color: i === this.menuIdx && pulse ? '#ffe9a8' : '#fff' });
    });
    if (pulse) r.text('PRESS START / TAP A', w / 2 - 52, h - 14, { size: 8, color: '#fff' });
    r.text('Unofficial fan homage — not affiliated with Nintendo.', 4, h - 26, { size: 6, color: '#ddd' });
  }
  renderLegal(r) {
    const w = r.viewW, h = r.viewH;
    r.panel(6, 6, w - 12, h - 12, '#101018', '#e8c832');
    let y = 16;
    for (const line of DISCLAIMER_BOOT) {
      const size = y === 16 ? 12 : 7;
      const bold = y === 16;
      r.text(line, 14, y, { size, bold, color: y === 16 ? '#e8c832' : '#f0f0f0' });
      y += size + 5;
    }
    if (this.ready) {
      const pulse = Math.floor(this.t * 2) % 2 === 0;
      if (pulse) r.text('Press A / tap to continue', 14, h - 22, { size: 8, color: '#e8c832' });
    }
  }
}
