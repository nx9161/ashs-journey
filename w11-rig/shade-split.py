#!/usr/bin/env python3
"""shade-split.py — W11-T3 BRAWLFROG back: split one palette tone's
shading range into the palette's own lighter sibling tone.

The back's body tone A #27425f spans the design's whole shading
range, but its lighter sibling H #484c59 (the front palette's own
light blue-grey, 3.4% of the front) averages away on the back —
leaving the back a value step short. This pass works in the
posterized domain (exact palette hexes): every pixel painted A
whose ORIGINAL design luminance sits in the top --frac of A's own
range is repainted H. Same family, same palette, no new colour —
the back gains the shading step the front already had.
Deterministic.
Usage: shade-split.py <posterized.png> <original.png> <dst.png>
       [--from #27425f] [--to #484c59] [--frac 0.35]
"""
import argparse
import numpy as np
from PIL import Image


def hx(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('post')
    ap.add_argument('orig')
    ap.add_argument('dst')
    ap.add_argument('--from', dest='frm', default='#27425f')
    ap.add_argument('--to', default='#484c59')
    ap.add_argument('--frac', type=float, default=0.35)
    o = ap.parse_args()

    post = np.array(Image.open(o.post).convert('RGB')).astype(np.int32)
    orig = np.array(Image.open(o.orig).convert('RGB')).astype(np.float64)
    frm, to = hx(o.frm), hx(o.to)
    is_from = np.all(post == frm, axis=2)
    lum = (0.2126 * orig[:, :, 0] + 0.7152 * orig[:, :, 1]
           + 0.0722 * orig[:, :, 2]) / 255.0
    vals = lum[is_from]
    thr = np.quantile(vals, 1 - o.frac)
    repaint = is_from & (lum >= thr)
    post[repaint] = to
    print(f'  {o.frm} px: {int(is_from.sum())}, repainted '
          f'{int(repaint.sum())} (lum >= {thr:.3f}) -> {o.to}')
    Image.fromarray(post.astype(np.uint8)).save(o.dst)
    print(f'{o.post} -> {o.dst}')


if __name__ == '__main__':
    main()
