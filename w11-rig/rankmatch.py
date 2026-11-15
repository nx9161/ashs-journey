#!/usr/bin/env python3
"""rankmatch.py — W11 T4 shared-palette construction by rank matching.

Recolours a back design's creature pixels onto the FRONT sprite's
palette hexes so that each hex's SHARE of the back matches its share
of the front (the audit's pair-Jaccard counts a bin when a hex holds
>=1.5% of the view's mass — matching shares puts the back's bins
inside the front's by construction). Pixels are ranked by luminance
plus a soft top-light field, so the pale shares land on the view's
lit top and the deep shares on its shade, the way the front's own
lighting distributes them. The creature mask is never touched —
silhouette, bbox and mass are the shipped ones by construction.

Optional family split (--leek-letters): pixels classified as the
accent family (pale stalk / saturated greens) are rank-matched onto
the named front letters only, and those letters are removed from the
main ramp — an accent must not be luminance-matched into body tones.

Deterministic: same inputs -> same output bytes.
Usage: rankmatch.py <src.png> <front.pix> <dst.png>
       [--exclude J,K] [--leek-letters G,N,L,M] [--lift-top 0.10]
"""
import argparse
import numpy as np
from PIL import Image


def parse_pix_pal(path):
    pal, counts, mass = {}, {}, 0
    rows_mode = False
    for line in open(path):
        line = line.rstrip('\n')
        if line.startswith('PIX'):
            rows_mode = True
            continue
        if line == 'PAL':
            rows_mode = False
            continue
        if rows_mode and line and set(line) <= set('.ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
            for ch in line:
                if ch != '.':
                    counts[ch] = counts.get(ch, 0) + 1
                    if ch != 'O':
                        mass += 1
        elif not rows_mode and len(line) > 2 and line[1] == ' ' \
                and line[2] == '#':
            pal[line[0]] = tuple(int(line[3:][i:i + 2], 16)
                                 for i in (0, 2, 4))
    return pal, counts, mass


def lum(rgb):
    return (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1]
            + 0.0722 * rgb[..., 2]) / 255.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('frontpix')
    ap.add_argument('dst')
    ap.add_argument('--exclude', default='')
    ap.add_argument('--leek-letters', default='')
    ap.add_argument('--lift-top', type=float, default=0.10)
    o = ap.parse_args()

    pal, counts, mass = parse_pix_pal(o.frontpix)
    exclude = set(filter(None, o.exclude.split(',')))
    leek_letters = set(filter(None, o.leek_letters.split(',')))

    def ramp(letters):
        items = [(ch, pal[ch], counts.get(ch, 0)) for ch in letters
                 if ch in pal and counts.get(ch, 0) > 0]
        items.sort(key=lambda it: lum(np.array(it[1], float)))
        tot = sum(c for _, _, c in items)
        return [(ch, rgb, c / tot) for ch, rgb, c in items]

    all_letters = [ch for ch in pal if ch != 'O' and ch not in exclude]
    main_ramp = ramp([ch for ch in all_letters if ch not in leek_letters])
    leek_ramp = ramp(sorted(leek_letters)) if leek_letters else []

    im = Image.open(o.src).convert('RGB')
    a = np.array(im).astype(np.float64)
    H, W = a.shape[:2]
    fg = ~((a[:, :, 0] > 242) & (a[:, :, 1] > 242) & (a[:, :, 2] > 242))
    ys, xs = np.where(fg)
    y0, y1 = ys.min(), ys.max()
    t = np.clip((np.arange(H)[:, None] - y0) / max(1, (y1 - y0)), 0, 1)
    le = lum(a) + o.lift_top * np.power(1 - t, 1.5)

    out = np.where(fg[..., None], a, 255.0)

    def paint(mask, rmp, label):
        idx = np.where(mask)
        if len(idx[0]) == 0 or not rmp:
            return
        keys = le[idx]
        order = np.argsort(keys, kind='stable')
        n = len(order)
        edges = np.cumsum([s for _, _, s in rmp]) * n
        assign = np.searchsorted(edges, np.arange(n) + 0.5, side='left')
        assign = np.minimum(assign, len(rmp) - 1)
        cols = np.array([rgb for _, rgb, _ in rmp], float)
        painted = cols[assign]
        out[idx[0][order], idx[1][order]] = painted
        shares = np.bincount(assign, minlength=len(rmp)) / n
        print(f'{label}: ' + ' '.join(
            f'{ch}={s:.2f}(tgt {t_:.2f})'
            for (ch, _, t_), s in zip(rmp, shares)))

    if leek_ramp:
        R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
        leek = fg & (((R > 180) & (G > 200))
                     | ((G - R > 35) & (R < 170) & (B < 160)))
        paint(leek, leek_ramp, 'leek family')
        paint(fg & ~leek, main_ramp, 'main ramp')
    else:
        paint(fg, main_ramp, 'main ramp')
    Image.fromarray(out.astype(np.uint8)).save(o.dst)
    print('wrote', o.dst)


if __name__ == '__main__':
    main()
