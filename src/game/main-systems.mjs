// main-systems.mjs — Game-level systems (WS6/WS9): bag item use incl.
// medicine/stones/Rare Candy, TM/HM teaching with HM overwrite protection,
// post-battle learn + evolution queues, the quest log, the region chain,
// and the diploma / Oak-rating payoffs. Extends the Game class prototype.

import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MOVES } from '../data/moves.mjs';
import { ITEMS } from '../data/items.mjs';
import { displayName, dexCaughtCount, evolutionCheck } from './state.mjs';
import { QUESTS, LEGENDARY_ARCS } from '../data/story-kanto.mjs';
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
      // Warp to the last Center town (the overworld tracks centerReturn).
      const owNow = g.scenes.top;
      const ret = owNow && owNow.centerReturn;
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
    items.push({ label: '— MAIN QUEST —', value: null, disabled: true });
    for (const q of QUESTS) {
      const doneF = q.flag && g.state.story.flags[q.flag];
      const active = !doneF && QUESTS.find((x) => !x.flag || !g.state.story.flags[x.flag]) === q;
      items.push({
        label: (doneF ? '★ ' : active ? '▶ ' : '· ') + q.text,
        value: 'q:' + q.id, disabled: !active && !doneF,
      });
    }
    const arcs = Object.keys(g.state.story.quests || {});
    if (arcs.length) {
      items.push({ label: '— SIDE ARCS —', value: null, disabled: true });
      for (const id of arcs) {
        const arc = LEGENDARY_ARCS[id];
        if (!arc) continue;
        items.push({ label: (g.state.story.quests[id] === 'complete' ? '★ ' : '▶ ') + arc.title, value: 'arc:' + id });
      }
    }
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Quest Log', items, (v) => {
      if (!v || v === 'close') return;
      if (v.startsWith('q:')) {
        const q = QUESTS.find((x) => 'q:' + x.id === v);
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
    // AUDIT FIX (C201): the Town Map was one dialogue line of RAW internal
    // map ids. It is now a real screen: visited places by display name,
    // current location marked, in a proper Platinum window.
    const visited = Object.keys(g.state.story.flags).filter((k) => k.startsWith('reached_')).map((k) => k.slice(8));
    const cur = g.state.story.position && g.state.story.position.map;
    const items = visited.map((id) => ({
      label: (MAPS[id] ? MAPS[id].name : id) + (id === cur ? '  — you are here' : ''),
      value: null, disabled: true,
    }));
    if (!items.length) items.push({ label: 'Nowhere yet. Walk!', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Town Map — Kanto', items, () => {});
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
  oakRating() {
    const n = dexCaughtCount(this.state.dex);
    if (n < 10) return 'Hmm. ' + n + ' caught. The journey is young — walk the grass, meet them all.';
    if (n < 50) return n + ' caught! You are learning what a Pokedex is for. Keep going!';
    if (n < 100) return n + ' caught! A genuine collector\'s eye. The rare ones hide well — patience.';
    if (n < 151) return n + ' caught! Nearly there. The last pages are always the hardest.';
    return 'ALL 151! Every Kanto species, in one journey. This is a historic Pokedex!';
  },

  checkDiploma() {
    const g = this;
    const kanto = Object.values(SPECIES).filter((s) => s.dexNo >= 1 && s.dexNo <= 151);
    const done = kanto.every((s) => g.state.dex.caught[s.dexNo]);
    if (done && !g.state.story.flags.diploma) {
      g.state.story.flags.diploma = true;
      g.audio.playSfx('badge');
      g.ui.say([
        'DIPLOMA — This certifies that ' + g.state.player.name + ' completed the Kanto Pokedex:',
        'all 151 species, caught in a single journey. Sealed by Prof. Hawthorn, with enormous pride.',
      ], null, 'Prof. Hawthorn');
    }
  },
});
