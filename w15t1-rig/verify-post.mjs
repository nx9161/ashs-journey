// W15-T1 post-swap verification + registry fingerprint computation.
import { MAPS2 } from '../src/data/maps2.mjs';
import { MAPS3 } from '../src/data/maps3.mjs';

const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };

for (const id of ['lavender', 'saffron']) {
  const a = MAPS2[id], b = MAPS3[id];
  console.log(id, 'rows identical maps2==maps3:', JSON.stringify(a.rows) === JSON.stringify(b.rows));
  console.log(id, 'warps identical:', JSON.stringify(a.warps) === JSON.stringify(b.warps),
    '| npcs identical:', JSON.stringify(a.npcs || a.people || null) === JSON.stringify(b.npcs || b.people || null));
  console.log(id, 'maps2 fnv:', fnv(JSON.stringify(a)), '| maps3 fnv:', fnv(JSON.stringify(b)));
}
