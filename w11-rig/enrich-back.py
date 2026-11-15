#!/usr/bin/env python3
"""enrich-back.py — W11-T2 REGALOTH back palette enrichment.

The shipped back design is a near-flat dark mass: its conversion
carries 6 colours / 3 palette bins / 3 value steps against the front's
16 / 6 / 7. The plan's fix is palette-only (silhouette entirely held):
recolour the design's creature pixels onto the FRONT palette's fur
ramp, keyed by each pixel's own luminance plus a soft top-light field
(top of the back catches light the way the front's head/shoulders do),
so the flat mass gains the front's bin-21 and bin-37 fur tones and a
full value ladder. The creature mask is never touched — every opaque
pixel stays opaque, every transparent pixel stays transparent — so
mass, bbox and silhouette are the shipped ones by construction.

The ramp deliberately EXCLUDES the front's bin-41 belly/face tones
(#98877d family): the belly faces away in a back view and stays
front-only by anatomy. The design's own pale paw/sole pixels (highest
source luminance) land on the ramp top (#856f61, bin 37).

Deterministic: same input + flags -> same output bytes.
Usage: enrich-back.py <src.png> <dst.png> [--lift-top 0.16]
       [--shade-bottom 0.05]
"""
import argparse
import numpy as np
from PIL import Image

# Front fur ramp (slaking-front.pix PAL), dark -> light, with the
# audit's luminance for each tone. Bins: 0,16,16,20,20,21,37.
RAMP = [
    ('#311c17', 0.113),
    ('#42302a', 0.196),
    ('#533c32', 0.243),
    ('#59463d', 0.277),
    ('#604c3f', 0.302),
    ('#705b50', 0.371),
    ('#856f61', 0.450),
]
RAMP_RGB = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)]
                     for h, _ in RAMP], dtype=np.float64)
RAMP_LUM = np.array([lum for _, lum in RAMP])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--lift-top', type=float, default=0.16)
    ap.add_argument('--shade-bottom', type=float, default=0.05)
    o = ap.parse_args()

    im = Image.open(o.src).convert('RGB')
    a = np.array(im).astype(np.float64)
    H, W = a.shape[:2]
    fg = ~((a[:, :, 0] > 242) & (a[:, :, 1] > 242) & (a[:, :, 2] > 242))
    ys, xs = np.where(fg)
    y0, y1 = ys.min(), ys.max()
    # source luminance (audit weights)
    lum = (0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1]
           + 0.0722 * a[:, :, 2]) / 255.0
    # soft top-light field over the creature's own bbox
    t = (np.arange(H)[:, None] - y0) / max(1, (y1 - y0))
    t = np.clip(t, 0.0, 1.0)
    le = lum + o.lift_top * np.power(1 - t, 1.5) - o.shade_bottom * t * t
    # snap each creature pixel to the ramp tone nearest in luminance
    edges = (RAMP_LUM[:-1] + RAMP_LUM[1:]) / 2
    band = np.digitize(le, edges)
    out = np.where(fg[..., None], RAMP_RGB[band], 255.0)
    counts = {RAMP[i][0]: int((band[fg] == i).sum())
              for i in range(len(RAMP))}
    total = int(fg.sum())
    for h, n in counts.items():
        print(f'  {h}: {n} ({100.0 * n / total:.1f}% of creature)')
    Image.fromarray(out.astype(np.uint8)).save(o.dst)
    print(f'{o.src}: creature {total} px -> {o.dst}')


if __name__ == '__main__':
    main()
