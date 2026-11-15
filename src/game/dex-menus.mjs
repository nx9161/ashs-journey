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
    // W14-T1: plate-full list rows. Species rows render through rowHtml
    // as plates — the sprite on its own framed 64x64 plate at exact 1x,
    // bold name, type line, state chip (the .dexlist CSS in build.mjs).
    // Hub/divider/Close rows keep the plain renderer (the bag rowHtml
    // precedent: non-plate items return the bare label span). Item label
    // strings are unchanged — headless consumers read labels, not HTML.
    // Caught/seen semantics are FROZEN: a sprite is emitted only for a
    // seen/caught species (the entry panel's own rule); an unseen row
    // carries NO <img> at all, only the dimmed empty plate — no unseen
    // species' sprite, name, or types can leak through the list.
    const dexRowHtml = (it) => {
      const sp = it.value && it.value !== 'partner' ? SPECIES[it.value] : null;
      if (!sp || sp.form) return '<span>' + it.label + '</span>';
      const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
      const known = c || s;
      const cell = known
        ? '<span class="dexcell"><img class="dexsprite" src="' + g.spriteDataUrl(it.value) + '" alt=""></span>'
        : '<span class="dexcell dexcell-empty">???</span>';
      const chip = c ? '<span class="dexstate is-caught">CAUGHT</span>'
        : s ? '<span class="dexstate is-seen">SEEN</span>'
        : '<span class="dexstate is-unseen">———</span>';
      return '<span class="dexplate">' + cell
        + '<span class="dexmain"><span class="dexl1"><span class="dexno">No.' + sp.dexNo + '</span>'
        + '<b class="dexname">' + (known ? sp.name : '???') + '</b></span>'
        + '<span class="dexl2">' + (known ? sp.types.join(' / ') : '???') + '</span></span>'
        + chip + '</span>';
    };
    g.ui.showMenu('KinDex', items, (v) => {
      if (!v || v === 'close') return;
      if (v === 'rating') { g.ui.say([g.oakRating()], () => g.openDex(filter), 'Prof. Hawthorn'); return; }
      if (v === 'filter') { g.openDexFilter(filter); return; }
      if (v === 'areas') { g.openDexAreas(filter); return; }
      const sp = SPECIES[v];
      const c = g.state.dex.caught[sp.dexNo], s = g.state.dex.seen[sp.dexNo];
      if (!c && !s) { g.openDex(filter); return; }
      g.openDexEntry(v, filter);
    }, { remember: 'dex', rowHtml: dexRowHtml, menuClass: 'dexlist' });
  },

  // Elevation B5 + W14-T2: the dex entry helpers and panel.
  // W14-T2: the order the entry panel pages through. Opened from a
  // filtered list, it is that list's own species order (the exact
  // subsequence openDex builds, same predicate); otherwise the full
  // 493 in dexNo order. The W14 census defect this replaces: the old
  // order hard-capped dexNo at 151, so every Yamato/Maris/Borea entry
  // (342 of 493) opened on the dexNo-1 entry instead of its own.
  dexEntryOrder(filter) {
    const g = this;
    filter = filter || {};
    const active = !!(filter.status || filter.type || filter.q);
    if (!active) {
      return Object.keys(SPECIES)
        .filter((id) => id !== 'partner' && !SPECIES[id].form)
        .sort((a, b) => SPECIES[a].dexNo - SPECIES[b].dexNo);
    }
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
    return Object.keys(SPECIES).filter((id) => id !== 'partner' && !SPECIES[id].form && matchSpecies(id));
  },

  // The dex unit an id belongs to: formes resolve to their base
  // species, the partner to the wild VOLTIK record (the design-depth
  // D6 fold — one creature, one entry). Units resolve to themselves.
  dexUnitOf(id) {
    const sp = SPECIES[id];
    if (!sp) return null;
    if (id !== 'partner' && !sp.form) return id;
    if (sp.form && sp.baseSpecies && SPECIES[sp.baseSpecies]) return sp.baseSpecies;
    return Object.keys(SPECIES).find((k) => k !== 'partner' && !SPECIES[k].form && SPECIES[k].dexNo === sp.dexNo) || null;
  },

  // W14-T2: habitat derivation — the area names whose encounter tables
  // hold this species (the same tables openDexAreas reads), deduped by
  // display name in table order. Empty when the species is in no
  // encounter table (starters, gifts, legendaries, event Kin): the
  // entry then carries no Areas line at all — absence makes no claim.
  dexAreasOf(id) {
    const names = [];
    for (const mapId of Object.keys(MAPS)) {
      const m = MAPS[mapId];
      if (m.encounters && m.encounters.table.some((e) => e.species === id) && !names.includes(m.name)) names.push(m.name);
    }
    return names;
  },

  // W14-T2: the evolution line, derived from the records at render
  // time — pre-evolution by inverting the evo graph, outbound from the
  // record's own evo/evos. Chain members the player has not seen are
  // redacted to ??? under the same rule as the list rows; levels print
  // as recorded (each arc's levels are band-local by design). Returns
  // null when the record has no chain links — no line, no claim.
  dexEvoText(id) {
    const g = this;
    const sp = SPECIES[id];
    const nameOf = (rec) => (g.state.dex.caught[rec.dexNo] || g.state.dex.seen[rec.dexNo]) ? rec.name : '???';
    const outsOf = (rec) => (rec.evos && rec.evos.length ? rec.evos : (rec.evo ? [rec.evo] : []));
    const parts = [];
    const preNos = new Set();
    for (const other of Object.values(SPECIES)) {
      if (other.id === id || preNos.has(other.dexNo)) continue;
      if (outsOf(other).some((e) => e.to === id)) { preNos.add(other.dexNo); parts.push('← ' + nameOf(other)); }
    }
    for (const e of outsOf(sp)) {
      const t = SPECIES[e.to];
      if (!t) continue;
      parts.push('→ ' + nameOf(t) + (e.method === 'level' && e.level ? ' at Lv ' + e.level : ' by ' + e.method));
    }
    return parts.length ? parts.join(' · ') : null;
  },

  // W14-T2: the ONE composition path for a dex entry — openDexEntry
  // renders through it and the kindex guard composes through it, so
  // what the guard proves is byte-identical to what the panel shows.
  // Known (seen/caught) entries gain the three lines the records have
  // always held: Design (the W13 design feed), Areas and Evolves
  // (each omitted entirely when the record has none). Unseen entries
  // keep the full redaction — no name, flavor, design or sprite leaks.
  dexEntryRender(id) {
    const g = this;
    const sp = SPECIES[id];
    const c = !!g.state.dex.caught[sp.dexNo], s = !!g.state.dex.seen[sp.dexNo];
    const known = c || s;
    const title = '◀ No.' + sp.dexNo + ' ' + (known ? sp.name : '???') + ' ▶';
    let body = '<div class="sumhead"><img class="sumsprite" src="' + (known ? g.spriteDataUrl(id) : '') + '" alt="">'
      + '<div><div class="sumname">' + (known ? sp.name : '???') + '</div>'
      + '<div class="sumsub">' + (known ? sp.types.join(' / ') : '???') + '</div>'
      + '<div class="sumsub">Status: ' + (c ? 'CAUGHT' : s ? 'SEEN' : 'UNSEEN') + '</div></div></div>'
      + '<div class="sumflavor">' + (known ? sp.flavor : 'No data yet — this Kin has not been seen.') + '</div>';
    if (known) {
      if (sp.design) body += '<div class="sumsub dexdesign">Design: ' + sp.design.inspired + ' — ' + sp.design.note + '</div>';
      const areas = g.dexAreasOf(id);
      if (areas.length) body += '<div class="sumsub dexareas">Areas: ' + areas.slice(0, 3).join(' · ') + (areas.length > 3 ? ' +' + (areas.length - 3) + ' more' : '') + '</div>';
      const evo = g.dexEvoText(id);
      if (evo) body += '<div class="sumsub dexevo">Evolves: ' + evo + '</div>';
    }
    body += '<div class="sumsub">◀ ▶ : previous / next entry</div>';
    return { title, bodyHtml: body };
  },

  // Elevation B5: the dex entry as its own plate, pageable in place —
  // Left/Right (and Q/E, the PC box-switch convention) walk the
  // originating list's order (W14-T2: the full 493 in dexNo order, or
  // the filtered list's own order) without returning to the list.
  // Unseen neighbours render redacted, exactly as the list shows
  // them (???).
  openDexEntry(speciesId, filter) {
    const g = this;
    let order = g.dexEntryOrder(filter);
    let idx = order.indexOf(speciesId);
    if (idx < 0) {
      // Not a unit of the originating list (a forme, the partner, or a
      // filtered-out species): resolve to its dex unit and, if the
      // unit is outside this filter too, page the full dex instead —
      // the requested entry still opens on itself, never on dexNo 1.
      const unit = g.dexUnitOf(speciesId);
      idx = unit ? order.indexOf(unit) : -1;
      if (idx < 0) {
        order = g.dexEntryOrder(null);
        idx = unit ? order.indexOf(unit) : -1;
      }
      if (idx < 0) idx = 0;
    }
    const render = () => g.dexEntryRender(order[idx]);
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
