// Print the registry baseline line for victoryroad, computed with
// the guard's own fingerprint (fnv over the def JSON).
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const a = MAPS2['victoryroad'], b = MAPS3['victoryroad'];
const status = JSON.stringify(a) === JSON.stringify(b) ? 'I' : 'D';
console.log(`  "victoryroad": ['${status}', 'maps2.mjs:${fnv(JSON.stringify(a))}', 'maps3.mjs:${fnv(JSON.stringify(b))}'],`);
