#!/usr/bin/env python3
"""grow-pale.py — widen the palest shading bands inside a posterized
design (W11-T2). The back view's highlight bands (coil rings) are
thinner than the front's treatment of the same feature; at sprite
scale they blend away. This grows each listed pale colour's mask
within the creature mask by R px (nearest-colour fill from the pale
class itself), palest class first so cores keep their colour.
Deterministic. Usage: grow-pale.py <src.png> <dst.png> <radius>
<hex,hex,...>  (hexes palest-first)"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst, radius = sys.argv[1], sys.argv[2], int(sys.argv[3])
pales = [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in sys.argv[4].split(',')]
a = np.array(Image.open(src).convert('RGB')).astype(np.int32)
fg = ~((a[:, :, 0] > 242) & (a[:, :, 1] > 242) & (a[:, :, 2] > 242))
out = a.copy()
claimed = np.zeros(fg.shape, dtype=bool)
for pale in pales:
    mask = fg & (a[:, :, 0] == pale[0]) & (a[:, :, 1] == pale[1]) & (a[:, :, 2] == pale[2])
    if not mask.any():
        print(f'  grow-pale: {pale} absent, skipped')
        continue
    grown = ndimage.binary_dilation(mask, iterations=radius) & fg & ~claimed
    new = grown & ~mask
    out[new] = pale
    claimed |= grown
    print(f'  grow-pale: {pale} +{int(new.sum())} px (r={radius})')
Image.fromarray(out.astype(np.uint8)).save(dst)
print(f'-> {dst}')
