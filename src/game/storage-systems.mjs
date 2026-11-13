// storage-systems.mjs — the creature-keeping services: PC boxes
// (openPc) + the Route 34 Day-Care (openDaycare), extracted verbatim
// from overworld-systems.mjs by War Room W7 (Cap Relief): the B2-R1
// frozen cap is relieved by extraction into registered sibling
// modules, never by raising the cap. Attached to
// OverworldScene.prototype, same as its source block.

import { SPECIES } from '../data/species.mjs';
import { boxCheck, displayName } from './state.mjs';
import {
  collectDaycareEgg, depositToDaycare, ensureJohtoSystems, giveStoryEgg,
  pairCompatible, tradeEvolutionsOf, withdrawFromDaycare,
} from './johto-systems.mjs';
import { OverworldScene } from './overworld.mjs';
import { BOX_CAP, BOX_COUNT, key } from './overworld-systems.mjs';

Object.assign(OverworldScene.prototype, {
  // ---------- PC boxes ----------
  // ---------- Stage J6: the Day-Care (Route 34) ----------
  // Both keepers (the maps6 keeper, johto-patched, and his wife,
  // appended in JOHTO_NPCS) run this one flow. All state moves ride
  // the pure johto-systems functions; this layer is menus + lines.
  openDaycare(npc) {
    const g = this.game;
    const st = g.state;
    const flags = st.story.flags;
    ensureJohtoSystems(st);
    const say = (lines, cb) => g.ui.say(lines.map((l) => l.replace('{player}', st.player.name)), cb, npc.name);
    const destLine = (res, what) => res.dest === 'box'
      ? what + ' was sent to ' + String(res.boxId).replace('box', 'Box ') + ' — no room in the party, but safe and warm there.'
      : what + ' is in your party. Walk with it.';
    const menu = () => {
      const items = [];
      if (st.daycareEgg) items.push({ label: 'Collect the Egg we found', value: 'egg' });
      items.push({ label: 'Leave a Kin with us', value: 'dep', disabled: st.daycare.length >= 2 });
      items.push({ label: 'Take a Kin back', value: 'wd', disabled: !st.daycare.length });
      items.push({ label: 'How are my Kin?', value: 'status' });
      items.push({ label: 'Leave', value: null });
      g.ui.showMenu('Day-Care — we raise them with patient hands.', items, (v) => {
        if (v === 'egg') {
          const res = collectDaycareEgg(st);
          if (!res.ok) { say(['There is no room anywhere — party full and every PC box full. Make room, and the Egg will still be here, warm in the straw.'], () => menu()); return; }
          g.audio.playSfx('dex-register');
          say(['Here it is, still warm. We do not know how it got here — your two guests are not telling.', destLine(res, 'The Egg')], () => menu());
          return;
        }
        if (v === 'dep') {
          const rows = st.party.map((m, i) => ({
            label: displayName(m, SPECIES) + ' Lv' + m.level + (m.egg ? ' (Egg)' : ''), value: i, disabled: !!m.egg,
          }));
          rows.push({ label: 'Back', value: -1 });
          g.ui.showMenu('Leave which Kin?', rows, (iv) => {
            if (iv === null || iv === -1) { menu(); return; }
            const mon = st.party[iv];
            const res = depositToDaycare(st, iv);
            if (res.ok) {
              say(['We will take good care of ' + displayName(mon, SPECIES) + '. Walk the routes, trainer — eggs and friendships both happen at walking pace.'], () => menu());
            } else if (res.reason === 'partner') say([res.line], () => menu());
            else if (res.reason === 'last-non-egg') say(['Not your last travelling partner, dear. An Egg cannot walk the roads alone — someone has to carry it, and battle for it. Leave us a Kin when another able one walks with you.'], () => menu());
            else if (res.reason === 'is-egg') say(['An Egg needs its trainer\'s own walking to hatch. Keep it in your party, dear.'], () => menu());
            else say(['We are full up just now — two guests is our honest limit.'], () => menu());
          });
          return;
        }
        if (v === 'wd') {
          const rows = st.daycare.map((m, i) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: i }));
          rows.push({ label: 'Back', value: -1 });
          g.ui.showMenu('Take back which Kin?', rows, (iv) => {
            if (iv === null || iv === -1) { menu(); return; }
            const mon = st.daycare[iv];
            const res = withdrawFromDaycare(st, iv);
            if (res.ok) say([displayName(mon, SPECIES) + ' is glad to see you. They always are, whatever they pretend.'], () => menu());
            else say(['Your party is full, dear. Make room first — ' + displayName(mon, SPECIES) + ' can wait a little longer.'], () => menu());
          });
          return;
        }
        if (v === 'status') {
          const lines = [];
          if (!st.daycare.length) lines.push('No guests just now. The garden is quiet, the naps are ahead of schedule.');
          else {
            for (const m of st.daycare) lines.push(displayName(m, SPECIES) + ' (Lv' + m.level + ') is resting well — fed, brushed, and sung to at noon.');
            if (st.daycare.length === 2) {
              if (st.daycareEgg) lines.push('And — we found an Egg with them! It is waiting for you, warm in the straw.');
              else if (pairCompatible(st.daycare[0], st.daycare[1])) {
                const left = st.daycareEggAt !== null ? Math.max(0, st.daycareEggAt - st.stepsTotal) : 0;
                lines.push('Those two get along famously. Walk about ' + left + ' more steps with them in our care, and check back — these things keep their own hours.');
              } else lines.push('Those two prefer their own corners, truth be told. No egg will come of this pairing — different kinds keep different company.');
            }
          }
          say(lines, () => menu());
          return;
        }
      });
    };
    // The story egg: the couple's one-time gift, offered on the first
    // visit, so every player meets the system. A full-everywhere
    // refusal sets NO flag — the offer stands on the next visit.
    if (!flags.daycare_story_egg) {
      say(['Welcome to our little house, trainer. Forty years we have raised other folks\' Kin here, one nap at a time.',
        'Before anything else — a gift. Travellers leave us all sorts here, and this was left with a note: "for a trainer who walks." It is a Kin Egg, and we would like you to walk with it.'], () => {
        const res = giveStoryEgg(st, () => g.rng.misc());
        if (!res.ok) {
          say(['Ah — no room anywhere, party and boxes both full. Make a little room, dear, and come back. The Egg will keep.']);
          return;
        }
        flags.daycare_story_egg = true;
        g.audio.playSfx('dex-register');
        say(['Received a Kin Egg!', destLine(res, 'The Egg'), 'Walk with it in your party. When it is ready, it will not ask permission — eggs never do.'], () => menu());
      });
      return true;
    }
    if (st.daycareEgg) {
      say(['You came at the right moment, {player} — we found an Egg with your two guests! We do not know how it got there. They are not telling.'], () => menu());
      return true;
    }
    say(['Eggs and friendships both happen at walking pace, trainer. What can this house do for you?'], () => menu());
    return true;
  },

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
      // Stage J6 widening: the candidate scan reads `evos` branch
      // entries too (tradeEvolutionsOf), so poliwhirl->politoed and
      // slowpoke->slowking — whose `evo` slots carry their primary
      // branches — are reachable; each trade branch is its own row,
      // and the evolution runs the CHOSEN branch (evolveMon's
      // forcedEvo), never the slot default.
      const cand = [];
      for (const m of g.state.party) {
        if (m.egg) continue; // J6: an Egg can't be sent out, traded, or evolved
        for (const evo of tradeEvolutionsOf(m.speciesId)) cand.push({ mon: m, evo });
      }
      // AUDIT FIX (S-10): the link flow used to close the PC first and
      // never come back — checking (or backing out) cost the whole PC
      // session. The panel now stays open underneath (menus and dialogue
      // route above it) and every exit path returns to it.
      if (!cand.length) { g.ui.say(['No Kin here is waiting on a trade evolution.'], () => render()); return; }
      const items = cand.map((c, i) => ({ label: displayName(c.mon, SPECIES) + ' -> ' + SPECIES[c.evo.to].name, value: i }));
      items.push({ label: 'Back', value: null, wide: true });
      const linkRowHtml = (it) => {
        const c = cand[it.value] || null;
        if (!c) return '<span>' + it.label + '</span>';
        return '<img class="picon" src="' + sprite(c.mon) + '" alt=""><span>' + it.label + '</span>';
      };
      g.ui.showMenu('Link Transfer which?', items, (iv) => {
        const c = cand[iv];
        if (c) this.evolveMon(c.mon, null, () => render(), c.evo);
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
      return 'Empty party slot.<br>Place a box Kin here to withdraw it.';
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
          if (g.state.party.length <= 1) { g.ui.say(['You need at least one Kin with you!']); return; }
          // Stage J6: the all-egg guard (the deposit-your-last-mon
          // precedent, sharpened) — a move whose RESULTING party
          // holds only Eggs (or nothing able) is refused.
          const simParty = g.state.party.filter((_, i2) => i2 !== held.idx);
          if (occ) simParty.splice(held.idx, 0, occ);
          if (!simParty.some((m) => m && !m.egg)) { g.ui.say(['An Egg can\'t travel alone! Keep at least one hatched Kin with you.']); return; }
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
            // Stage J6: the same all-egg guard on the swap direction.
            const simParty = g.state.party.slice(); simParty[idx] = held.mon;
            if (!simParty.some((m) => m && !m.egg)) { g.ui.say(['An Egg can\'t travel alone! Keep at least one hatched Kin with you.']); return; }
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
});
