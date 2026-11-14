// Print the registry baseline lines for the tranche-4 dual ids,
// computed with the guard's own fingerprint (fnv over the def JSON).
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
for (const id of ['route20','route22','rocktunnel']) {
  const a = MAPS2[id], b = MAPS3[id];
  const fa = fnv(JSON.stringify(a)), fb = fnv(JSON.stringify(b));
  const status = JSON.stringify(a) === JSON.stringify(b) ? 'I' : 'D';
  console.log(`  "${id}": ['${status}', 'maps2.mjs:${fa}', 'maps3.mjs:${fb}'],`);
}
