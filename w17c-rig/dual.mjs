import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
for (const id of ['route11','route12','route15','route16','route19']) {
  const a = MAPS2[id], b = MAPS3[id];
  if (!a || !b) { console.log(id, 'maps2=', !!a, 'maps3=', !!b); continue; }
  const rowsEq = JSON.stringify(a.rows) === JSON.stringify(b.rows);
  const rest = (m) => JSON.stringify({warps:m.warps,signs:m.signs,npcs:m.npcs,encounters:m.encounters,name:m.name,music:m.music});
  console.log(id, 'rowsEqual=', rowsEq, 'restEqual=', rest(a)===rest(b), 'sizes', a.rows[0].length+'x'+a.rows.length, b.rows[0].length+'x'+b.rows.length);
  if (!rowsEq) { a.rows.forEach((r,y)=>{ if (r!==b.rows[y]) console.log(' row',y,'\n  maps2:',r,'\n  maps3:',b.rows[y]); }); }
  if (rest(a)!==rest(b)) { console.log(' maps2 rest:', rest(a)); console.log(' maps3 rest:', rest(b)); }
}
