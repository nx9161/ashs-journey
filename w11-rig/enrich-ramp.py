#!/usr/bin/env python3
"""enrich-ramp.py — W11-T3 back palette enrichment (generalized ramp).

Generalization of T2's enrich-back.py beyond a single-hue fur ramp:
the back design's creature pixels are recoloured onto a ramp of the
FRONT palette's own hexes, keyed by each pixel's luminance plus a
soft top-light field (top of the view catches light the way the
front's lit features do) and a bottom shade. The creature mask is
never touched — every opaque pixel stays opaque, every transparent
pixel stays transparent — so mass, bbox and silhouette are the
shipped ones by construction.

The ramp is passed as a comma list of #hex in the order given; the
script sorts it by luminance and uses band midpoints as edges.

Deterministic: same input + flags -> same output bytes.
Usage: enrich-ramp.py <src.png> <dst.png> --ramp #hex,#hex,...
       [--lift-top 0.14] [--shade-bottom 0.05]
"""
import argparse
import numpy as np
from PIL import Image


def lum_of(rgb):
    return (0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1]
            + 0.0722 * rgb[:, 2]) / 255.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--ramp', required=True)
    ap.add_argument('--lift-top', type=float, default=0.14)
    ap.add_argument('--shade-bottom', type=float, default=0.05)
    o = ap.parse_args()

    hexes = [h.strip() for h in o.ramp.split(',') if h.strip()]
    ramp_rgb = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)]
                         for h in hexes], dtype=np.float64)
    ramp_lum = lum_of(ramp_rgb)
    order = np.argsort(ramp_lum)
    ramp_rgb, ramp_lum = ramp_rgb[order], ramp_lum[order]
    hexes = [hexes[i] for i in order]

    im = Image.open(o.src).convert('RGB')
    a = np.array(im).astype(np.float64)
    H, W = a.shape[:2]
    fg = ~((a[:, :, 0] > 242) & (a[:, :, 1] > 242) & (a[:, :, 2] > 242))
    ys, xs = np.where(fg)
    y0, y1 = ys.min(), ys.max()
    lum = (0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1]
           + 0.0722 * a[:, :, 2]) / 255.0
    t = (np.arange(H)[:, None] - y0) / max(1, (y1 - y0))
    t = np.clip(t, 0.0, 1.0)
    le = lum + o.lift_top * np.power(1 - t, 1.5) - o.shade_bottom * t * t
    edges = (ramp_lum[:-1] + ramp_lum[1:]) / 2
    band = np.digitize(le, edges)
    out = np.where(fg[..., None], ramp_rgb[band], 255.0)
    total = int(fg.sum())
    for i, h in enumerate(hexes):
        n = int((band[fg] == i).sum())
        print(f'  {h} (lum {ramp_lum[i]:.3f}): {n} '
              f'({100.0 * n / total:.1f}% of creature)')
    Image.fromarray(out.astype(np.uint8)).save(o.dst)
    print(f'{o.src}: creature {total} px -> {o.dst}')


if __name__ == '__main__':
    main()
