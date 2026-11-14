// dex-menus.mjs — the KinDex + Journey menu surface of the Game
// class (openDex, openDexEntry, openDexFilter, openJourney,
// openDexAreas), extracted verbatim from main.mjs by War Room W7
// (Cap Relief): the B2-R1 frozen cap is relieved by extraction into
// registered sibling modules, never by raising the cap. Attached to
// Game.prototype on the main-systems pattern; callers reach these
// through the Game instance, exactly as before.

import { SPECIES, DEX_TOTAL } from '../data/species.mjs';
import { MAPS } from '../data/maps.mjs';
import { CHAPTERS, BONUS_SHELF, chapterOf } from '../data/story.mjs';
import { ARCS, arcStateOf, currentArcOf, arcDexSpan, PLATINUM_DEX_HORIZON } from '../data/arcs.mjs';
import { dexCaughtCount } from './state.mjs';
import { Game } from './main.mjs';

Object.assign(Game.prototype, {
  openDex(filter) {
    const g = this;
    filter = filter || {};
    const caught = dexCaughtCount(g.state.dex);
    const matchSpecies = (id) => {
      const sp = SPECIES[id];
      const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
      if (filter.status === 'caught' && !c) return false;
      if (filter.status === 'seen' && !(s && !c)) return false;
      if (filter.status === 'unseen' && (s || c)) return false;
      if (filter.type && !sp.types.includes(filter.type)) return false;
      if (filter.q && sp.name.toLowerCase().indexOf(filter.q.toLowerCase()) < 0) return false;
      return true;
    };
    const items = Object.keys(SPECIES).filter((id) => id !== 'partner' && !SPECIES[id].form && matchSpecies(id)).map((id) => {
      const sp = SPECIES[id];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      const mark = c ? '[CAUGHT]' : (s ? '[SEEN]' : '[???]');
      return { label: 'No.' + sp.dexNo + ' ' + (c || s ? sp.name : '???') + ' ' + mark, value: id };
    });
    const fdesc = (filter.q ? ' q=' + filter.q : '') + (filter.type ? ' ' + filter.type : '') + (filter.status ? ' ' + filter.status : '');
    items.unshift({ label: 'Caught ' + caught + ' / ' + DEX_TOTAL + ' (tracked)', value: null, disabled: true });
    items.unshift({ label: "Prof. Hawthorn's rating", value: 'rating' });
    items.unshift({ label: 'Search / Filter' + (fdesc ? ':' + fdesc : ''), value: 'filter' });
    items.unshift({ label: 'Areas — caught per area', value: 'areas' });
    // ADR-027 D5 (Stage F): the dex header's Regional + National lines,
    // both registry-driven. Regional = the current arc's own species
    // span; National = the Platinum horizon (493) with its percentage.
    // The chapter header stays items[0] (the qa-changed-flows anchor).
    const arcNow = currentArcOf(g.state);
    const span = arcDexSpan(arcNow);
    const caughtNos = Object.keys(g.state.dex.caught).map(Number);
    const regCaught = caughtNos.filter((n) => n >= span.lo && n <= span.hi).length;
    const natCaught = caughtNos.filter((n) => n >= 1 && n <= PLATINUM_DEX_HORIZON).length;
    const natPct = Math.floor((100 * natCaught) / PLATINUM_DEX_HORIZON);
    items.unshift({ label: 'National — Grand horizon: ' + natCaught + '/' + PLATINUM_DEX_HORIZON + ' (' + natPct + '%)', value: null, disabled: true });
    items.unshift({ label: 'Regional — ' + arcNow.region + ': ' + regCaught + '/' + (span.hi - span.lo + 1), value: null, disabled: true });
    // D2: arc progression surfaced in the Dex — current chapter header row.
    const curCh = chapterOf((g.state.story.chapter || 0) + 1);
    items.unshift({ label: 'Journey — Ch.' + curCh.n + ' · ' + curCh.title, value: null, disabled: true });
    if (!items.length) items.push({ label: '(no matches)', value: null, disabled: true });
    // ADR-027 D5: the sealed divider — species beyond the Platinum
    // horizon (the rest of the 1025 frame) sit below it exactly as
    // undiscovered species render today: ??? rows under this line.
    items.push({ label: '— More Kin are known to exist. Their regions are future arcs. —', value: null, disabled: true });
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('KinDex', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'rating') { g.ui.say([g.oakRating()], () => g.openDex(filter), 'Prof. Hawthorn'); return; }
      if (v === 'filter') { g.openDexFilter(filter); return; }
      if (v === 'areas') { g.openDexAreas(filter); return; }
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(filter); return; }
      g.openDexEntry(v, filter);
    }, { remember: 'dex' });
  },

  // Elevation B5: the dex entry as its own plate, pageable in place —
  // Left/Right (and Q/E, the PC box-switch convention) walk the whole
  // Arden dex in dex order without returning to the list. Unseen
  // neighbours render redacted, exactly as the list shows them (???).
  openDexEntry(speciesId, filter) {
    const g = this;
    const order = Object.keys(SPECIES)
      .filter((id) => id !== 'partner' && !SPECIES[id].form && SPECIES[id].dexNo >= 1 && SPECIES[id].dexNo <= 151)
      .sort((a, b) => SPECIES[a].dexNo - SPECIES[b].dexNo);
    let idx = order.indexOf(speciesId);
    if (idx < 0) idx = 0;
    const render = () => {
      const id = order[idx];
      const sp = SPECIES[id];
      const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
      const known = c || s;
      const title = '◀ No.' + sp.dexNo + ' ' + (known ? sp.name : '???') + ' ▶';
      const body = '<div class="sumhead"><img class="sumsprite" src="' + (known ? g.spriteDataUrl(id) : '') + '" alt="">'
        + '<div><div class="sumname">' + (known ? sp.name : '???') + '</div>'
        + '<div class="sumsub">' + (known ? sp.types.join(' / ') : '???') + '</div>'
        + '<div class="sumsub">Status: ' + (c ? 'CAUGHT' : s ? 'SEEN' : 'UNSEEN') + '</div></div></div>'
        + '<div class="sumflavor">' + (known ? sp.flavor : 'No data yet — this Kin has not been seen.') + '</div>'
        + '<div class="sumsub">◀ ▶ : previous / next entry</div>';
      return { title, bodyHtml: body };
    };
    g.ui.showEntryPanel(render(), (act, d) => {
      if (act === 'page') {
        idx = (idx + d + order.length) % order.length;
        g.ui.updateEntryPanel(render());
      } else if (act === 'close') {
        g.openDex(filter);
      }
    });
  },

  // P1/G3: dex filter submenu — status, type, and name search (reuses the A-Z grid).
  openDexFilter(filter) {
    const g = this;
    const types = [...new Set(Object.keys(SPECIES).flatMap((id) => SPECIES[id].types))].sort();
    g.ui.showMenu('Filter: status', [
      { label: 'All', value: 'all' },
      { label: 'Caught', value: 'caught' },
      { label: 'Seen', value: 'seen' },
      { label: 'Unseen', value: 'unseen' },
      { label: 'Back', value: 'back' },
    ], (st) => {
      if (st === 'back' || st === null) { g.openDex(filter); return; }
      const f2 = Object.assign({}, filter, { status: st === 'all' ? null : st });
      // AUDIT FIX (S-05): 'All types' carried value:null — the cancel
      // sentinel — so choosing it aborted the wizard and threw away the
      // status step. It now has its own value and continues to search.
      const titems = [{ label: 'All types', value: 'all' }].concat(types.map((t) => ({ label: t, value: t })));
      titems.push({ label: 'Back', value: 'back' });
      g.ui.showMenu('Filter: type', titems, (tp) => {
        if (tp === 'back' || tp === null) { g.openDex(filter); return; }
        const f3 = Object.assign({}, f2, { type: tp === 'all' ? null : tp });
        g.ui.showNameEntry('Search the Dex (blank = all)', '', 8, (q) => {
          if (q === null) { g.openDex(f2); return; } // cancelled: keep the pre-search filter (S-03)
          f3.q = q || null; // '' (blank OK) clears the search, as promised (S-04)
          g.openDex(f3);
        }, { allowCancel: true, allowEmpty: true });
      });
    });
  },

  // D2: Journey menu — the anime-chronology spine (ADR-015). Playable chapters
  // open a detail card; locked chapters and the BONUS shelf are honest
  // disabled rows (no fake content, no "coming soon" placeholders).
  openJourney() {
    const g = this;
    const cur = g.state.story.chapter || 0; // 0-based chapter index
    const items = [];
    items.push({ label: 'Quest Log — the road so far', value: 'quests' });
    items.push({ label: 'Regions — the journey chain', value: 'regions' });
    items.push({ label: 'Hall of Fame', value: 'hof' });
    items.push({ label: 'Diploma', value: 'diploma' });
    // ADR-027 (Stage F): chapters render grouped under ARC headers
    // from the registry, each header carrying the arc's state
    // (Complete / Current / Next / Sealed, from arcStateOf). Chapter
    // rows keep their existing labels + detail view untouched.
    const stateWord = { complete: 'COMPLETE', current: 'CURRENT', 'locked-next': 'NEXT', sealed: 'SEALED' };
    let futureHeaderDone = false;
    for (const arc of ARCS) {
      if (arc.future) {
        if (!futureHeaderDone) {
          items.push({ label: '— FUTURE ARCS — SEALED —', value: null, disabled: true, band: true });
          futureHeaderDone = true;
        }
      } else {
        items.push({
          label: '— ' + arc.label.toUpperCase() + ' · ' + arc.region.toUpperCase() + ' — ' + (stateWord[arcStateOf(g.state, arc.id)] || 'SEALED') + ' —',
          value: null, disabled: true, band: true,
        });
      }
      for (const chN of arc.chapters) {
        const ch = CHAPTERS.find((c) => c.n === chN);
        if (!ch) continue;
        if (ch.scope === 'playable') {
          const isCur = (ch.n - 1) === cur;
          items.push({
            label: (isCur ? '\u25b8 ' : '  ') + 'Ch.' + ch.n + ' — ' + ch.title + (isCur ? ' (now)' : ''),
            value: 'ch' + ch.n,
          });
        } else {
          items.push({
            label: 'Ch.' + ch.n + ' — ' + ch.title + ' · locked (future act)',
            value: null, disabled: true,
          });
        }
      }
    }
    items.push({ label: '— BONUS SHELF (non-canon, not on the spine) —', value: null, disabled: true });
    for (const b of BONUS_SHELF) {
      items.push({ label: b, value: null, disabled: true });
    }
    items.push({ label: 'Close', value: 'close' });
    g.ui.showMenu('Journey', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'quests') { g.openQuestLog(); return; }
      if (v === 'regions') { g.openRegions(); return; }
      if (v === 'hof') { g.openHallOfFame(); return; }
      if (v === 'diploma') { g.openDiploma(); return; }
      const ch = CHAPTERS.find((c) => 'ch' + c.n === v);
      if (ch) {
        g.ui.say([
          'CHAPTER ' + ch.n + ' — ACT ' + ch.act,
          ch.title,
          ch.arc,
          'Anime: ' + ch.anime,
          ch.movies.length ? 'Special events: ' + ch.movies.join(' · ') : '',
        ], () => g.openJourney(), 'Journey');
      }
    });
  },

  // P1/G3: Areas tab — per-area "caught n/m" checklists (B2W2 Habitat pattern).
  // AUDIT FIX (S-42): the active dex filter rides along and is restored on
  // return — the Areas detour used to silently drop it.
  openDexAreas(filter) {
    const g = this;
    const items = Object.keys(MAPS).filter((id) => MAPS[id].encounters).map((id) => {
      const map = MAPS[id];
      const species = [...new Set(map.encounters.table.map((e) => e.species))];
      const n = species.filter((s) => g.state.dex.caught[SPECIES[s].dexNo]).length;
      return { label: map.name + ' — ' + n + '/' + species.length + ' caught', value: id };
    });
    items.push({ label: 'Back', value: 'back' });
    g.ui.showMenu('Dex — Areas', items, (v) => {
      if (!v || v === 'back') { g.openDex(filter); return; }
      const map = MAPS[v];
      const rows = map.encounters.table.map((e) => {
        const sp = SPECIES[e.species];
        const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
        return { label: (c || s ? sp.name : '???') + '  Lv' + e.min + '-' + e.max + (c ? ' [CAUGHT]' : s ? ' [SEEN]' : ''), value: null, disabled: true };
      });
      rows.push({ label: 'Back', value: 'back' });
      g.ui.showMenu(map.name, rows, () => g.openDexAreas(filter));
    });
  },
});
