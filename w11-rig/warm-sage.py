#!/usr/bin/env python3
"""warm-sage.py — W11-T2 PITCHLET back: pull the blue channel of pale
sage pixels (b in [115,170], g >= 140, g > r) by x0.90 so the back's
pale cluster quantizes into the front's bin 41 instead of splitting
across the b=128 bin boundary into bin 42. Hue family held (sage ->
marginally warmer sage); mask and all other pixels untouched.
Deterministic. Usage: warm-sage.py <src.png> <dst.png>"""
import sys
import numpy as np
from PIL import Image

a = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(np.int32)
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
sel = (b >= 115) & (b <= 170) & (g >= 140) & (g > r)
a[:, :, 2] = np.where(sel, np.round(b * 0.90), b)
print(f'warm-sage: {int(sel.sum())} px warmed')
Image.fromarray(a.astype(np.uint8)).save(sys.argv[2])
print(f'-> {sys.argv[2]}')
