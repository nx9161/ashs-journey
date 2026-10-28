// main-systems.mjs — Game-level systems (WS6/WS9): bag item use incl.
// medicine/stones/Rare Candy, TM/HM teaching with HM overwrite protection,
// post-battle learn + evolution queues, the quest log, the region chain,
// and the diploma / Oak-rating payoffs. Extends the Game class prototype.

import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS } from '../data/items.mjs';
import { giveKeepsake } from './keepsakes.mjs';
import { displayName, dexCaughtCount, evolutionCheck, ownCaughtMap } from './state.mjs';
import { MAIN_QUESTS, LEGENDARY_ARCS } from '../data/story-kanto.mjs';
import { QUESTS, taleStageOf, taleStageText } from '../data/quests.mjs';
import { applyBondOnce, bondedCharacters, bondSceneLines, tierOf } from './bonds.mjs';
import { FORMS } from '../data/forms.mjs';
import { xpForLevel, statValue, hpValue } from '../engine/formulas.mjs';

const REGIONS = [
  { id: 'kanto', name: 'Kanto', note: 'The beginning. Eight badges, one League, a storm over New Island.' },
  { id: 'orange', name: 'Orange Islands', note: 'A southern sea league of trials. Complete Kanto first.' },
  { id: 'johto', name: 'Johto', note: 'Old towers, older legends. Complete the Orange voyage first.' },
  { id: 'hoenn', name: 'Hoenn', note: 'Sea and land at war with the sky. Complete Johto first.' },
  { id: 'sinnoh', name: 'Sinnoh', note: 'Myths written in stone and time. Complete Hoenn first.' },
  { id: 'unova', name: 'Unova', note: 'Truth against ideals. Complete Sinnoh first.' },
  { id: 'kalos', name: 'Kalos', note: 'Beauty, bonds, and a flare of war. Complete Unova first.' },
  { id: 'alola', name: 'Alola', note: 'An island challenge under twin lights. Complete Kalos first.' },
  { id: 'galar', name: 'Galar / Hisui', note: 'Stadiums roar; an older land remembers. Complete Alola first.' },
  { id: 'paldea', name: 'Paldea', note: 'A treasure hunt in three directions. Complete Galar first.' },
  { id: 'liko', name: 'A New Horizon', note: 'The next traveler\'s opening. Complete Paldea first.' },
];

Object.assign(Game.prototype, {
  // ---------- bag ----------
  // Bag target rows (Rare Candy / medicine / stones / TM teaching) carry
  // the target Pokemon's battle-art sprite, same treatment as the Party
  // menu in main.mjs: <img class="picon"> from the species data URL,
  // cached per species id via Game#spriteDataUrl (main.mjs) so toDataURL
  // runs once per species. Back/empty rows stay plain text. The bag's own
  // item rows get their icons in main.mjs openBag (uiIcon data URLs).
  partyTargetRowHtml(it) {
    if (!it || it.value === -1 || it.value === null || it.value === undefined) {
      return '<span>' + (it ? it.label : '') + '</span>';
    }
    const mon = this.state && this.state.party ? this.state.party[it.value] : null;
    if (!mon) return '<span>' + it.label + '</span>';
    const img = (typeof this.spriteDataUrl === 'function')
      ? '<img class="picon" src="' + this.spriteDataUrl(mon.speciesId) + '" alt="">' : '';
    return img + '<span>' + it.label + '</span>';
  },

  useBagItem(id) {
    const g = this;
    const it = ITEMS[id];
    if (!it) return;
    const ow = g.scenes.top;
    const finish = () => g.openBag();
    if (it.pocket === 'keepsakes') {
      // ADR-025 §3 (Phase 3): selecting a keepsake in the bag gives it
      // to a party member (non-consumable; one held slot per mon).
      const targets = g.state.party.map((m, i) => ({
        label: displayName(m, SPECIES) + (m.keepsake ? ' (holding ' + (ITEMS[m.keepsake] ? ITEMS[m.keepsake].name : m.keepsake) + ')' : ''), value: i,
        disabled: !!m.keepsake,
      }));
      targets.push({ label: 'Back', value: -1 });
      g.ui.showMenu('Give ' + it.name + ' to...', targets, (t) => {
        if (t === null || t === -1) { finish(); return; }
        if (giveKeepsake(g.state, g.state.party[t], id)) {
          g.audio.playSfx('ui-blip');
          g.ui.toast(displayName(g.state.party[t], SPECIES) + ' is now holding the ' + it.name + '.');
        }
        finish();
      }, { rowHtml: (it2) => g.partyTargetRowHtml(it2) });
      return;
    }
    if (it.pocket === 'tm' || it.pocket === 'hm') { this.teachFromBag(id, it); return; }
    if (it.levelUp) { // Rare Candy
      const targets = g.state.party.map((m, i) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: i, disabled: m.level >= 100 }));
      targets.push({ label: 'Back', value: -1 });
      g.ui.showMenu('Use Rare Candy on...', targets, (t) => {
        if (t === null || t === -1) { finish(); return; }
        const m = g.state.party[t];
        g.state.bag[id]--;
        m.level++;
        m.xp = xpForLevel(SPECIES[m.speciesId].growth, m.level);
        this.recalcMon(m, true);
        g.audio.playSfx('levelup');
        g.ui.say([displayName(m, SPECIES) + ' grew to Lv ' + m.level + '!'], () => { this.queueEvolution(m); finish(); });
      }, { rowHtml: (it) => g.partyTargetRowHtml(it) });
      return;
    }
    if (it.xpBoost) { // XP Candy (ADR-025 §4): fixed XP, Rare Candy shape
      const targets = g.state.party.map((m, i) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: i, disabled: m.level >= 100 }));
      targets.push({ label: 'Back', value: -1 });
      g.ui.showMenu('Use XP Candy on...', targets, (t) => {
        if (t === null || t === -1) { finish(); return; }
        const m = g.state.party[t];
        g.state.bag[id]--;
        const before = m.level;
        m.xp += it.xpBoost;
        while (m.level < 100 && m.xp >= xpForLevel(SPECIES[m.speciesId].growth, m.level + 1)) m.level++;
        if (m.level > before) {
          this.recalcMon(m, true);
          g.audio.playSfx('levelup');
          g.ui.say([displayName(m, SPECIES) + ' gained ' + it.xpBoost + ' XP and grew to Lv ' + m.level + '!'], () => { this.queueEvolution(m); finish(); });
        } else {
          g.audio.playSfx('heal');
          g.ui.say([displayName(m, SPECIES) + ' gained ' + it.xpBoost + ' XP!'], () => finish());
        }
      }, { rowHtml: (it) => g.partyTargetRowHtml(it) });
      return;
    }
    if (it.pocket === 'medicine') {
      const targets = g.state.party.map((m, i) => {
        let dis = false;
        if (it.revive) dis = m.hp > 0;
        else if (it.cure) dis = m.hp <= 0 || (it.cure !== 'all' && m.status !== it.cure) || (it.cure === 'all' && !m.status);
        else if (it.heal) dis = m.hp <= 0 || m.hp >= m.maxHp;
        else if (it.ppRestore || it.ppRestoreAll) dis = m.hp <= 0;
        return { label: displayName(m, SPECIES) + ' ' + m.hp + '/' + m.maxHp + (m.status ? ' [' + m.status + ']' : ''), value: i, disabled: dis };
      });
      targets.push({ label: 'Back', value: -1 });
      // AUDIT FIX (S-37): the Ether move picker's Back used to skip this
      // target picker entirely and land in the Bag. showTargets is now
      // re-enterable so Back steps back exactly one level.
      const showTargets = () => g.ui.showMenu('Use ' + it.name + ' on...', targets, (t) => {
        if (t === null || t === -1) { finish(); return; }
        const m = g.state.party[t];
        const apply = () => {
          g.state.bag[id]--;
          g.audio.playSfx('heal');
          g.ui.toast(displayName(m, SPECIES) + ' — ' + it.name + ' used.');
          finish();
        };
        if (it.revive) { m.hp = Math.floor(m.maxHp * it.revive); m.status = null; apply(); return; }
        if (it.heal) { m.hp = Math.min(m.maxHp, m.hp + it.heal); if (it.cureStatus) m.status = null; apply(); return; }
        if (it.cure) { m.status = null; m.confused = false; apply(); return; }
        if (it.ppRestore) {
          const mvItems = m.moves.map((mv, mi) => ({ label: MOVES[mv.id].name + ' ' + mv.pp + '/' + mv.maxPp, value: mi }));
          mvItems.push({ label: 'Back', value: -1 });
          g.ui.showMenu('Restore which move?', mvItems, (mi) => {
            if (mi === null || mi === -1) { showTargets(); return; }
            m.moves[mi].pp = Math.min(m.moves[mi].maxPp, m.moves[mi].pp + it.ppRestore);
            apply();
          });
          return;
        }
        if (it.ppRestoreAll) { for (const mv of m.moves) mv.pp = Math.min(mv.maxPp, mv.pp + it.ppRestoreAll); apply(); return; }
        finish();
      }, { rowHtml: (it) => g.partyTargetRowHtml(it) });
      showTargets();
      return;
    }
    if (['firestone', 'waterstone', 'thunderstone', 'leafstone', 'moonstone'].includes(id)) {
      const stoneTargets = g.state.party.filter((m) => {
        const sp = SPECIES[m.speciesId];
        const evos = sp.evos || (sp.evo ? [sp.evo] : []);
        return evos.some((e) => e.method === 'stone' && e.stone === id);
      });
      if (id === 'thunderstone') {
        const partner = g.state.party.find((m) => m.speciesId === 'partner');
        if (partner && !stoneTargets.length) { g.ui.say(['PIKACHU shook its head hard. It will never use that stone.']); return; }
      }
      if (!stoneTargets.length) { g.ui.say(['It won\'t have any effect on your party.']); return; }
      const items = stoneTargets.map((m) => ({ label: displayName(m, SPECIES) + ' Lv' + m.level, value: m.monId }));
      items.push({ label: 'Back', value: null });
      const stoneRowHtml = (row) => {
        if (!row || row.value === null || row.value === undefined) return '<span>' + (row ? row.label : '') + '</span>';
        const mon = stoneTargets.find((m) => m.monId === row.value);
        if (!mon || typeof g.spriteDataUrl !== 'function') return '<span>' + row.label + '</span>';
        return '<img class="picon" src="' + g.spriteDataUrl(mon.speciesId) + '" alt=""><span>' + row.label + '</span>';
      };
      g.ui.showMenu('Use ' + it.name + ' on...', items, (v) => {
        const mon = stoneTargets.find((m) => m.monId === v);
        if (!mon) { finish(); return; }
        g.state.bag[id]--;
        if (ow && ow.evolveMon) ow.evolveMon(mon, id);
        finish();
      }, { rowHtml: stoneRowHtml });
      return;
    }
    // Key items + balls: honest guidance lines.
    const hints = {
      bicycle: 'Press SELECT outdoors to ride. Twice the speed, zero dignity loss.',
      oldrod: 'Face water and press A to cast.',
      goodrod: 'Face water and press A to cast.',
      superrod: 'Face water and press A to cast.',
      townmap: null, // opens the map view below
      itemfinder: 'It reacts on its own near hidden items when you search a tile.',
      pokeflute: 'Its tune wakes sleeping Pokemon — even very large roadblocks.',
      coincase: 'Coins: ' + (g.state.bag.coin || 0) + '. Win more at the Game Corner slots.',
    };
    if (id === 'townmap') { this.openTownMap(); return; }
    if (id === 'escaperope') {
      // Warp to the last Center town. P1: resolve through centerExit()
      // (runtime ticket -> persisted lastCenter -> Pallet) — the
      // landing tile is now that Center's door-front, where before it
      // could be a stale load-time snapshot tile in the same town.
      const owNow = g.scenes.top;
      const ret = owNow && (typeof owNow.centerExit === 'function' ? owNow.centerExit() : owNow.centerReturn);
      if (ret && ret.map !== (g.state.story.position && g.state.story.position.map)) {
        g.state.bag[id]--;
        g.state.story.position = { map: ret.map, x: ret.x, y: ret.y, dir: 'down' };
        g.startOverworld();
        g.ui.toast('You warped out with the Escape Rope!');
      } else {
        g.ui.say(['No need for a rope here — fresh air is right there.']);
      }
      return;
    }
    if (it.pocket === 'balls') { g.ui.say(['Throw balls in battle — A in real-time mode, BAG in classic mode.']); return; }
    if (hints[id]) { g.ui.say([hints[id]]); return; }
    g.ui.say([it.desc || it.name + '.']);
  },

  recalcMon(m, keepHpRatio) {
    const sp = SPECIES[m.speciesId];
    const ivs = m.ivs || {};
    const oldMax = m.maxHp;
    m.maxHp = hpValue(sp.base.hp, m.level, ivs.hp);
    m.hp = keepHpRatio ? Math.min(m.maxHp, m.hp + (m.maxHp - oldMax)) : Math.min(m.hp, m.maxHp);
    m.stats = {
      atk: statValue(sp.base.atk, m.level, ivs.atk), def: statValue(sp.base.def, m.level, ivs.def),
      spa: statValue(sp.base.spa, m.level, ivs.spa), spd: statValue(sp.base.spd, m.level, ivs.spd),
      spe: statValue(sp.base.spe, m.level, ivs.spe),
    };
  },

  queueEvolution(mon) {
    const g = this;
    const sp = SPECIES[mon.speciesId];
    if (sp.evo && sp.evo.method === 'level' && mon.level >= sp.evo.level) {
      const q = g.state.session.evolveQueue || (g.state.session.evolveQueue = []);
      if (!q.some((e) => e.monId === mon.monId)) q.push({ monId: mon.monId });
    }
  },

  teachFromBag(itemId, it) {
    const g = this;
    const moveId = it.move;
    const mv = MOVES[moveId];
    const isHm = it.pocket === 'hm';
    const targets = g.state.party.map((m, i) => {
      const sp = SPECIES[m.speciesId];
      // TM eligibility from the species' tm list; HMs encode as 100+n there.
      // Species without a tm list (the original slice roster) predate the
      // data and are allowed, as before.
      const can = isHm
        ? (!sp.tm || sp.tm.includes(100 + parseInt(itemId.slice(2), 10)))
        : (!sp.tm || sp.tm.includes(parseInt(itemId.slice(2), 10)));
      const knows = m.moves.some((x) => x.id === moveId);
      return { label: displayName(m, SPECIES) + (knows ? ' (knows it)' : can ? '' : ' (cannot learn)'), value: i, disabled: knows || !can };
    });
    targets.push({ label: 'Back', value: -1 });
    g.ui.showMenu('Teach ' + mv.name + ' (' + itemId.toUpperCase() + ') to...', targets, (t) => {
      if (t === null || t === -1) { g.openBag(); return; }
      const m = g.state.party[t];
      this.teachMove(m, moveId, isHm, () => { if (!isHm) g.state.bag[itemId]--; g.openBag(); });
    }, { rowHtml: (it) => g.partyTargetRowHtml(it) });
  },

  teachMove(mon, moveId, isHm, done) {
    const g = this;
    const mv = MOVES[moveId];
    if (mon.moves.some((x) => x.id === moveId)) { g.ui.say([displayName(mon, SPECIES) + ' already knows ' + mv.name + '.']); if (done) done(); return; }
    const learn = (slotIdx) => {
      const entry = { id: moveId, pp: mv.pp, maxPp: mv.pp };
      if (slotIdx === -1) mon.moves.push(entry);
      else mon.moves[slotIdx] = entry;
      if (isHm) { mon.hmMoves = mon.hmMoves || []; if (!mon.hmMoves.includes(moveId)) mon.hmMoves.push(moveId); }
      g.audio.playSfx('dex-register');
      g.ui.say([displayName(mon, SPECIES) + ' learned ' + mv.name + '!'], () => { if (done) done(); });
    };
    if (mon.moves.length < 4) { learn(-1); return; }
    // Full set: the learn/forget prompt. HM-taught moves are protected —
    // they can never be the forgotten slot (the original's rule).
    const items = mon.moves.map((x, i) => {
      const prot = (mon.hmMoves || []).includes(x.id);
      return { label: MOVES[x.id].name + (prot ? ' (HM — cannot forget)' : ''), value: i, disabled: prot };
    });
    items.push({ label: 'Give up learning ' + mv.name, value: -2 });
    g.ui.showMenu(displayName(mon, SPECIES) + ' wants to learn ' + mv.name + '. Forget which move?', items, (v) => {
      if (v === -2 || v === null) { g.ui.say([displayName(mon, SPECIES) + ' did not learn ' + mv.name + '.']); if (done) done(); return; }
      learn(v);
    });
  },

  // ---------- post-battle queues ----------
  processQueues() {
    const g = this;
    if (g.ui.menu || g.ui.dialogue) return;
    const top = g.scenes.top;
    if (!top || typeof top.evolveMon !== 'function') return;
    const sq = g.state.session;
    if (sq.learnQueue && sq.learnQueue.length) {
      const entry = sq.learnQueue.shift();
      const mon = g.state.party.find((m) => m.monId === entry.monId);
      if (mon) { this.teachMove(mon, entry.moveId, false, null); return; }
    }
    if (sq.evolveQueue && sq.evolveQueue.length) {
      const entry = sq.evolveQueue.shift();
      const mon = g.state.party.find((m) => m.monId === entry.monId);
      if (mon) top.evolveMon(mon);
    }
  },

  // ---------- quest log / regions / payoffs ----------
  openQuestLog() {
    const g = this;
    const items = [];
    // Section 1 — Main Story (unchanged machinery: the MAIN_QUESTS chain).
    items.push({ label: '— MAIN STORY —', value: null, disabled: true, band: true });
    for (const q of MAIN_QUESTS) {
      const doneF = q.flag && g.state.story.flags[q.flag];
      const active = !doneF && MAIN_QUESTS.find((x) => !x.flag || !g.state.story.flags[x.flag]) === q;
      items.push({
        label: (doneF ? '★ ' : active ? '▶ ' : '· ') + q.text,
        value: 'q:' + q.id, disabled: !active && !doneF,
      });
    }
    // Section 2 — Legendary Arcs (unchanged: arcs list from story.quests,
    // exactly the ids the arc machinery wrote there).
    const arcs = Object.keys(g.state.story.quests || {});
    if (arcs.length) {
      items.push({ label: '— LEGENDARY ARCS —', value: null, disabled: true, band: true });
      for (const id of arcs) {
        const arc = LEGENDARY_ARCS[id];
        if (!arc) continue;
        items.push({ label: (g.state.story.quests[id] === 'complete' ? '★ ' : '▶ ') + arc.title, value: 'arc:' + id });
      }
    }
    // Section 3 — Town Tales (ADR-025 §5): every tale, with its current
    // stage text. Unaccepted tales point at their giver; accepted tales
    // state their reward up front (§5 shape law); completed tales carry
    // their revelation.
    items.push({ label: '— TOWN TALES —', value: null, disabled: true, band: true });
    for (const tale of Object.values(QUESTS)) {
      const s = taleStageOf(g.state, tale.id);
      const mark = s < 0 ? '· ' : s >= tale.stages.length ? '★ ' : '▶ ';
      items.push({ label: mark + tale.title + ' (' + tale.town + ')', value: 'tale:' + tale.id });
    }
    // Section 4 — People (ADR-025 §2): the bond review surface. The
    // score is hidden by design; the TIER is the visible face. Only
    // characters the player actually has a bond record with appear.
    const people = bondedCharacters(g.state);
    if (people.length) {
      items.push({ label: '— PEOPLE —', value: null, disabled: true, band: true });
      for (const c of people) {
        items.push({ label: '· ' + c.name + ' — ' + tierOf(g.state, c.id), value: 'bond:' + c.id });
      }
    }
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Quest Log', items, (v) => {
      if (!v || v === 'close') return;
      if (v.startsWith('bond:')) {
        const c = people.find((x) => 'bond:' + x.id === v);
        if (c) g.ui.say([c.name + ' — ' + tierOf(g.state, c.id), c.note], () => g.openQuestLog(), 'People');
        return;
      }
      if (v.startsWith('q:')) {
        const q = MAIN_QUESTS.find((x) => 'q:' + x.id === v);
        if (q) g.ui.say([q.text, q.hint], () => g.openQuestLog(), 'Quest');
      } else if (v.startsWith('arc:')) {
        const arc = LEGENDARY_ARCS[v.slice(4)];
        if (arc) {
          const lines = [arc.title + ' — ' + (arc.species ? SPECIES[arc.species] ? SPECIES[arc.species].name : arc.species : '')];
          lines.push('Hook: ' + arc.hook);
          for (const st of arc.steps || []) lines.push('· ' + (typeof st === 'string' ? st : st.text));
          if (arc.lair) lines.push('Lair: ' + arc.lair);
          g.ui.say(lines, () => g.openQuestLog(), 'Arc');
        }
      } else if (v.startsWith('tale:')) {
        const tale = QUESTS[v.slice(5)];
        if (tale) {
          const s = taleStageOf(g.state, tale.id);
          const lines = [tale.title + ' — ' + tale.town, 'Giver: ' + tale.giver];
          lines.push(taleStageText(g.state, tale));
          if (s >= 0) lines.push('Reward: ' + tale.rewardText);
          g.ui.say(lines, () => g.openQuestLog(), 'Tale');
        }
      }
    });
  },

  openRegions() {
    const g = this;
    const cur = g.state.story.region || 'kanto';
    const doneList = g.state.story.regionsDone || [];
    const items = REGIONS.map((r) => {
      const isDone = doneList.includes(r.id);
      const isCur = r.id === cur;
      return {
        label: (isDone ? '★ ' : isCur ? '▶ ' : '· ') + r.name + (isCur ? ' (you are here)' : isDone ? '' : ' — sealed'),
        value: r.id,
      };
    });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Journey — Regions', items, (v) => {
      if (!v || v === 'close') return;
      const r = REGIONS.find((x) => x.id === v);
      if (r) g.ui.say([r.name, r.note], () => g.openRegions(), 'Journey');
    });
  },

  openTownMap() {
    const g = this;
    // Elevation B1 (C201 remainder): the Town Map is now Platinum's
    // GRAPHICAL map — a canvas panel over a hand-authored Kanto layout.
    // The gating rule is unchanged from the text screen it replaces:
    // only places whose reached_* flag is set appear at all, and the
    // player's current map carries the "you are here" marker.
    const LAYOUT = [
      // [mapId, x (0=W..1=E), y (0=N..1=S), isTown]
      ['indigo', 0.06, 0.30, 1], ['victoryroad', 0.10, 0.37, 0], ['route22', 0.14, 0.44, 0],
      ['pewter', 0.16, 0.20, 1], ['route2', 0.19, 0.33, 0], ['viridian', 0.20, 0.50, 1],
      ['route1', 0.20, 0.58, 0], ['pallet', 0.20, 0.67, 1], ['cinnabar', 0.16, 0.90, 1],
      ['route3', 0.31, 0.19, 0], ['route4', 0.45, 0.17, 0], ['cerulean', 0.57, 0.15, 1],
      ['route5', 0.57, 0.28, 0], ['route9', 0.70, 0.17, 0], ['route10', 0.79, 0.27, 0],
      ['lavender', 0.81, 0.40, 1], ['route12', 0.81, 0.57, 0], ['route8', 0.69, 0.43, 0],
      ['saffron', 0.58, 0.42, 1], ['route7', 0.50, 0.44, 0], ['celadon', 0.41, 0.44, 1],
      ['route16', 0.29, 0.60, 0], ['route6', 0.57, 0.56, 0], ['vermilion', 0.57, 0.68, 1],
      ['route11', 0.70, 0.68, 0], ['route15', 0.71, 0.82, 0], ['fuchsia', 0.54, 0.86, 1],
      ['route19', 0.52, 0.95, 0], ['route20', 0.33, 0.95, 0],
    ];
    const LINKS = [
      ['pallet', 'route1'], ['route1', 'viridian'], ['viridian', 'route2'], ['route2', 'pewter'],
      ['pewter', 'route3'], ['route3', 'route4'], ['route4', 'cerulean'], ['cerulean', 'route9'],
      ['route9', 'route10'], ['route10', 'lavender'], ['lavender', 'route8'], ['route8', 'saffron'],
      ['saffron', 'route7'], ['route7', 'celadon'], ['cerulean', 'route5'], ['route5', 'saffron'],
      ['saffron', 'route6'], ['route6', 'vermilion'], ['vermilion', 'route11'], ['route11', 'route12'],
      ['lavender', 'route12'], ['route12', 'route15'], ['route15', 'fuchsia'], ['celadon', 'route16'],
      ['route16', 'fuchsia'], ['fuchsia', 'route19'], ['route19', 'route20'], ['route20', 'cinnabar'],
      ['viridian', 'route22'], ['route22', 'victoryroad'], ['victoryroad', 'indigo'],
    ];
    const flags = g.state.story.flags;
    const cur = g.state.story.position && g.state.story.position.map;
    const nodes = [];
    const indexOf = {};
    for (const [id, x, y, town] of LAYOUT) {
      if (!flags['reached_' + id] || !MAPS[id]) continue;
      indexOf[id] = nodes.length;
      nodes.push({ id, name: MAPS[id].name, x, y, town: !!town, current: id === cur });
    }
    if (!nodes.length) { g.ui.say(['Nowhere yet. Walk!']); return; }
    const links = [];
    for (const [a, b] of LINKS) {
      if (indexOf[a] !== undefined && indexOf[b] !== undefined) links.push([indexOf[a], indexOf[b]]);
    }
    g.ui.showMapPanel({ nodes, links }, () => {});
  },

  // Elevation B2 (S-48): Hall of Fame viewer — reads the REAL story.hof
  // shape recorded by runEnding ({team: [{speciesId, level, nickname}],
  // badges}), latest entry first, on the gold-trim ceremony plate.
  openHallOfFame() {
    const g = this;
    const hof = (g.state.story && g.state.story.hof) || [];
    const prior = (g.state.story && g.state.story.priorHof) || [];
    if (!hof.length && !prior.length) {
      g.ui.say(['No Hall of Fame entries yet — defeat the Champion to record your team.'], null, 'Hall of Fame');
      return;
    }
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const entryHtml = (entry, head) => {
      let h = '<div class="hofentry"><div class="hofhead2">' + head + '</div><div class="hofteam">';
      for (const m of entry.team || []) {
        const sp = SPECIES[m.speciesId];
        const name = m.nickname || (sp ? sp.name : m.speciesId);
        h += '<div class="hofmon"><img class="picon hofsprite" src="' + g.spriteDataUrl(m.speciesId) + '" alt="">'
          + '<span class="hofname">' + esc(name) + '</span>'
          + '<span class="hofsub">' + (m.nickname && sp ? esc(sp.name) + ' · ' : '') + 'Lv' + m.level + '</span></div>';
      }
      return h + '</div></div>';
    };
    let html = '<div class="hofplate"><div class="hoftitle">HALL OF FAME</div>';
    for (let e = hof.length - 1; e >= 0; e--) {
      html += entryHtml(hof[e], 'Entry ' + (e + 1) + ' — ' + (hof[e].badges || 0) + ' badges');
    }
    // ADR-025 §6: prior journeys' teams stay viewable from the new
    // run — under their own heading, never counted as this run's.
    if (prior.length) {
      html += '<div class="hofhead2">— PRIOR JOURNEYS —</div>';
      for (let e = prior.length - 1; e >= 0; e--) {
        html += entryHtml(prior[e], 'Earlier journey ' + (e + 1) + ' — ' + (prior[e].badges || 0) + ' badges');
      }
    }
    html += '</div>';
    g.ui.showSummary({ name: 'Hall of Fame', tabs: [{ id: 'hof', label: 'HALL OF FAME', bodyHtml: html }] }, null);
  },

  // Elevation B2 (S-48): Diploma viewer — the same plate Hawthorn
  // presents at dex completion (checkDiploma's exact lines), re-viewable
  // from the Journey menu once the Kanto dex is complete.
  openDiploma() {
    const g = this;
    // Form entries share their base species' dexNo — excluded so the
    // Kanto count stays exactly the 151 species (Cheat Shop, 2026-10-28).
    const kanto = Object.values(SPECIES).filter((s) => !s.form && s.dexNo >= 1 && s.dexNo <= 151);
    // ADR-025 §6: the diploma is an HONOR — it reads the run's OWN
    // catches (ownCaughtMap), never the carried archive alone.
    const own = ownCaughtMap(g.state.dex);
    const n = kanto.filter((s) => own[s.dexNo]).length;
    if (n < 151) {
      g.ui.say(['You\'ve caught ' + n + ' of 151 Kanto Pokemon.'], null, 'Prof. Hawthorn');
      return;
    }
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = '<div class="diploma"><div class="diplomatitle">DIPLOMA</div>'
      + '<div class="diplomabody">This certifies that ' + esc(g.state.player.name) + ' completed the Kanto Pokedex:</div>'
      + '<div class="diplomabody">all 151 species, caught in a single journey. Sealed by Prof. Hawthorn, with enormous pride.</div></div>';
    g.ui.showSummary({ name: 'Diploma', tabs: [{ id: 'diploma', label: 'DIPLOMA', bodyHtml: html }] }, null);
  },

  // ---------- field moves (WS9) ----------
  openFieldMove(mon) {
    const g = this;
    const known = (mon.moves || []).map((x) => x.id).filter((id) => ['cut', 'fly', 'surf', 'strength', 'flash'].includes(id));
    const badges = g.state.badges.kanto;
    const gate = { cut: 'cascadebadge', fly: 'thunderbadge', surf: 'soulbadge', strength: 'rainbowbadge', flash: 'boulderbadge' };
    const items = known.map((id) => ({
      label: MOVES[id].name + (badges.includes(gate[id]) ? '' : ' (needs ' + gate[id].replace('badge', ' Badge') + ')'),
      value: id, disabled: !badges.includes(gate[id]),
    }));
    items.push({ label: 'Back', value: null });
    g.ui.showMenu('Field moves — ' + displayName(mon, SPECIES), items, (v) => {
      if (!v) return;
      const ow = g.scenes.top;
      if (v === 'flash') {
        if (ow && ow.map && ow.map.dark && ow.fxState) {
          ow.fxState.flashLit = true;
          g.audio.playSfx('dex-register');
          g.ui.toast(displayName(mon, SPECIES) + ' lit up the dark!');
        } else g.ui.say(['Flash only helps inside a dark cave.']);
        return;
      }
      if (v === 'fly') {
        const cities = Object.keys(g.state.story.flags)
          .filter((k) => k.startsWith('visited_'))
          .map((k) => k.slice(8))
          .filter((id) => MAPS[id]);
        if (!cities.length) { g.ui.say(['No town visited yet — nowhere to fly to.']); return; }
        const dests = cities.map((id) => ({ label: MAPS[id].name, value: id }));
        dests.push({ label: 'Back', value: null });
        g.ui.showMenu('Fly to...', dests, (d) => {
          if (!d) return;
          const city = MAPS[d];
          const viaWarp = (city.warps || []).find((w) => w.via);
          const spot = viaWarp ? viaWarp.via : (city.start || { x: 8, y: 8 });
          g.state.story.position = { map: d, x: spot.x, y: spot.y, dir: 'down' };
          g.audio.playSfx('warp');
          g.startOverworld();
          g.ui.toast('Flew to ' + city.name + '!');
        });
        return;
      }
      // Cut / Surf / Strength are contextual: used by facing the obstacle.
      const hints = {
        cut: 'Face a small tree and press A to cut it down.',
        surf: 'Face the water\'s edge and press A to surf.',
        strength: 'Face a round boulder and press A, then push it by walking.',
      };
      g.ui.say([hints[v] || '']);
    });
  },

  // Oak's rating + the diploma moment (WS7 payoff).
  // ADR-025 §2: the rating's TEMPERATURE warms with the Hawthorn bond
  // (tier-variant framing lines in BOND_DIALOGUE) — the count, its
  // thresholds and the dex itself never vary: a dex entry is never
  // bond-gated. Asking for a rating is a one-shot bond source (+1,
  // first time only); the completed diploma is worth +2, once, inside
  // checkDiploma's own one-shot guard.
  oakRating() {
    const n = dexCaughtCount(this.state.dex);
    applyBondOnce(this.state, 'bondsrc_rating', 'hawthorn', 1);
    const tier = tierOf(this.state, 'hawthorn').toLowerCase();
    if (tier !== 'wary') {
      const framed = bondSceneLines(this.state, 'hawthorn', 'rating');
      if (framed && framed.length) return framed[0].replace('{n}', String(n));
    }
    if (n < 10) return 'Hmm. ' + n + ' caught. The journey is young — walk the grass, meet them all.';
    if (n < 50) return n + ' caught! You are learning what a Pokedex is for. Keep going!';
    if (n < 100) return n + ' caught! A genuine collector\'s eye. The rare ones hide well — patience.';
    if (n < 151) return n + ' caught! Nearly there. The last pages are always the hardest.';
    return 'ALL 151! Every Kanto species, in one journey. This is a historic Pokedex!';
  },

  checkDiploma() {
    const g = this;
    const kanto = Object.values(SPECIES).filter((s) => !s.form && s.dexNo >= 1 && s.dexNo <= 151);
    // ADR-025 §6: honors require the new run's OWN catches — a carried
    // archive can fill the dex's records but never this check.
    const own = ownCaughtMap(g.state.dex);
    const done = kanto.every((s) => own[s.dexNo]);
    if (done && !g.state.story.flags.diploma) {
      g.state.story.flags.diploma = true;
      applyBondOnce(g.state, 'bondsrc_diploma', 'hawthorn', 2); // ADR-025 §2: the diploma is a bond beat (+2, once — this guard is the one-shot)
      g.audio.playSfx('badge');
      g.ui.say([
        'DIPLOMA — This certifies that ' + g.state.player.name + ' completed the Kanto Pokedex:',
        'all 151 species, caught in a single journey. Sealed by Prof. Hawthorn, with enormous pride.',
      ], null, 'Prof. Hawthorn');
    }
  },
});
