#!/usr/bin/env python3
"""grow-family.py — W11-T3 CLIONARCH: grow palette families in the
posterized domain.

In the posterized design (exact palette hexes), the named families'
painted masks are dilated by R px, constrained to the creature
(pixels currently painted with a body colour — never background,
never the outline tone), and the grown ring is repainted with the
family hex (nearest-family-pixel colour = the hex itself, since the
domain is posterized). This is the speckle-boost construction
applied to palette families that sit a few sprite px under the
audit's presence thresholds: the design paints them, the conversion
starves them; growing their painted area by ~1 design px per sprite
px of deficit restores them.
Deterministic.
Usage: grow-family.py <posterized.png> <dst.png> --grow #hex:R,...
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage


def hx(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--grow', required=True)
    ap.add_argument('--bg', default='#ffffff')
    o = ap.parse_args()

    a = np.array(Image.open(o.src).convert('RGB')).astype(np.int32)
    bg = hx(o.bg)
    creature = ~np.all(a == bg, axis=2)
    for spec in o.grow.split(','):
        hexs, r = spec.rsplit(':', 1)
        col = hx(hexs)
        mask = np.all(a == col, axis=2)
        before = int(mask.sum())
        grown = ndimage.binary_dilation(mask, iterations=int(r))
        ring = grown & creature & ~mask
        a[ring] = col
        print(f'  {hexs}: {before} -> {before + int(ring.sum())} px '
              f'(+{int(ring.sum())} ring)')
    Image.fromarray(a.astype(np.uint8)).save(o.dst)
    print(f'{o.src} -> {o.dst}')


if __name__ == '__main__':
    main()
