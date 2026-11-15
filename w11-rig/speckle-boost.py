#!/usr/bin/env python3
"""speckle-boost.py — W11-T3 BRAWLFROG back speckle/highlight amplifier.

The back design's plum speckle markings and pale specular highlights
are painted at a scale the 64px conversion averages away: a cell
holding 20% speckle quantizes to body blue, so the shipped back lost
the front palette's plum bin entirely. This pass enlarges what the
design already paints — nothing is added that is not there:

  1. Speckle family = creature pixels leaning magenta (R > B and
     R > G + 12): the plum/purple spots. The mask is dilated
     (--speckle-dilate px, Voronoi colour fill, the transform.py
     construction) and the whole family is deepened toward the front
     palette's plum #432434 (--speckle-mix), so averaged cells cross
     to the plum bin instead of washing into blue.
  2. Pale family = creature pixels with luminance > --pale-lum and
     saturation < 0.35 (glove speculars, head-bump highlights):
     dilated lightly (--pale-dilate) and mixed toward the palette's
     near-white #e6e6e7 (--pale-mix).

Mask (creature extent) is only grown by the speckle/pale dilation
itself — the markings' own growth, not a silhouette change.
Deterministic: same input + flags -> same output bytes.
Usage: speckle-boost.py <src.png> <dst.png> [options]
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--speckle-dilate', type=int, default=9)
    ap.add_argument('--speckle-mix', type=float, default=0.35)
    ap.add_argument('--pale-dilate', type=int, default=4)
    ap.add_argument('--pale-lum', type=float, default=0.72)
    ap.add_argument('--pale-mix', type=float, default=0.5)
    o = ap.parse_args()

    a = np.array(Image.open(o.src).convert('RGB')).astype(np.float64)
    fg = ~((a[:, :, 0] > 242) & (a[:, :, 1] > 242) & (a[:, :, 2] > 242))
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    lum = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255.0
    mx = a.max(axis=2); mn = a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)

    # --- speckle family ---
    # Violet/plum speckles: R and B both well above G (the body blues
    # keep R below G; the head's pure-blue marks keep R below G too).
    spk = fg & (R > G + 12) & (B > G + 12) & (R > 70)
    print(f'  speckle px before: {int(spk.sum())}')
    if o.speckle_dilate and spk.any():
        grown = ndimage.binary_dilation(spk, iterations=o.speckle_dilate)
        new = grown & ~spk
        inds = ndimage.distance_transform_edt(
            ~spk, return_distances=False, return_indices=True)
        a[new] = a[inds[0][new], inds[1][new]]
        spk = grown
        print(f'  speckle px after dilate {o.speckle_dilate}: '
              f'{int(spk.sum())}')
    plum = np.array([0x43, 0x24, 0x34], dtype=np.float64)
    a[spk] = a[spk] * (1 - o.speckle_mix) + plum * o.speckle_mix

    # --- pale family ---
    # Interior only: erode the creature mask so the pale anti-alias
    # halo around the silhouette (near-white, lum > 0.95) never counts
    # as a highlight — only speculars painted inside the body do.
    interior = ndimage.binary_erosion(fg, iterations=15)
    pale = interior & (lum > o.pale_lum) & (sat < 0.35)
    print(f'  pale px before: {int(pale.sum())}')
    if o.pale_dilate and pale.any():
        grown = ndimage.binary_dilation(pale, iterations=o.pale_dilate)
        new = grown & ~pale & fg
        inds = ndimage.distance_transform_edt(
            ~pale, return_distances=False, return_indices=True)
        a[new] = a[inds[0][new], inds[1][new]]
        pale = grown & fg
        print(f'  pale px after dilate {o.pale_dilate}: {int(pale.sum())}')
    nearwhite = np.array([0xe6, 0xe6, 0xe7], dtype=np.float64)
    a[pale] = a[pale] * (1 - o.pale_mix) + nearwhite * o.pale_mix

    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(o.dst)
    print(f'{o.src} -> {o.dst}')


if __name__ == '__main__':
    main()
