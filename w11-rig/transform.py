#!/usr/bin/env python3
"""transform.py — W11 design-source transformer (deterministic).

Prepares a design PNG for convert-monster.mjs by fixing the FIT defect
the W11 audit measured: the shipped sprites render small because each
source's non-background bounding box is inflated by picture frames,
backdrop panels, detached junk and wash, so the converter's fit scale
shrinks the creature. Steps:

  1. Creature isolation: foreground = NOT near-white (the converter's
     own rule: any channel <= 242). Connected components are labelled;
     only the largest component plus any component >= --keep-frac of it
     are kept. Picture-frame components (bbox >= 95% of both frame dims
     AND fill <= 10%) are dropped explicitly. Minor components entirely
     inside the top --drop-top band (page strips) and minor components
     that are >90% pale wash (--drop-wash: shadows/backdrop tint) are
     dropped. Everything not kept is painted white.
  2. Optional mask dilation (--dilate R): grows the kept mask by R px,
     new pixels take the nearest kept pixel's colour (Voronoi fill) —
     honest bulk for ribbon-thin bodies.
  3. Tight crop to the kept bbox + --pad.
  4. Optional edge trim (--trim-edges): shaves pale-neutral uniform
     bands off the crop edges — a backdrop panel's soft shadow can
     survive inside the creature's component as a ~17px slab of
     (246,239,237) at the panel edge, and the converter would outline
     it into a spurious frame. A band shaves only while >= 25% of it
     is non-white AND >= 85% of that is pale-neutral (max-min <= 14,
     min >= 220); the creature's dark outline stops the shave cold.
  5. Optional crop filter (--crop-filter): a second component pass on
     the crop itself; elements connected to the creature only through
     a since-trimmed slab (the panel's top border line) are islands
     now and drop out (keep >= --crop-keep-frac of the largest).
  6. Optional anisotropic stretch (--sx/--sy, LANCZOS) — foreshortened
     sources (top-down sprint strips) recover their body depth.
  7. Optional shared-palette posterize (--palette-from <pix>): every
     creature pixel is snapped to the nearest colour of the given
     .pix palette (outline 'O' excluded), so a pair quantizes into
     the same bins. Pixels paler than --pal-fg-thresh on every
     channel keep their original colour.
  8. Optional colour lift (--lift F or --lift-rgb R G B): multiplies
     creature colours — a back view rendered in a darker register
     than its front is lifted into the front's palette bands.

Usage: transform.py <src.png> <dst.png> [options]
Deterministic: same input + flags -> same output bytes.
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage


def load_palette(pix_path):
    pal = {}
    in_pal = False
    for line in open(pix_path):
        line = line.strip()
        if line == 'PAL':
            in_pal = True
            continue
        if in_pal:
            if not line or line == 'PIX':
                break
            parts = line.split()
            if len(parts) >= 2 and parts[1].startswith('#'):
                pal[parts[0]] = tuple(
                    int(parts[1][i:i + 2], 16) for i in (1, 3, 5))
    cols = [c for ch, c in pal.items() if ch != 'O']
    return np.array(cols, dtype=np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--keep-frac', type=float, default=0.01)
    ap.add_argument('--pad', type=int, default=6)
    ap.add_argument('--drop-top', type=float, default=0.0)
    ap.add_argument('--drop-wash', type=int, default=225)
    ap.add_argument('--dilate', type=int, default=0)
    ap.add_argument('--trim-edges', action='store_true')
    ap.add_argument('--crop-filter', action='store_true')
    ap.add_argument('--crop-keep-frac', type=float, default=0.05)
    ap.add_argument('--sx', type=float, default=1.0)
    ap.add_argument('--sy', type=float, default=1.0)
    ap.add_argument('--palette-from', default=None)
    ap.add_argument('--pal-fg-thresh', type=int, default=250)
    ap.add_argument('--lift', type=float, default=1.0)
    ap.add_argument('--lift-rgb', type=float, nargs=3, default=None)
    o = ap.parse_args()

    im = Image.open(o.src).convert('RGB')
    a = np.array(im).astype(np.int32)
    H, W = a.shape[:2]
    # Foreground = NOT near-white (the converter's own rule: any channel
    # <= 242). Backdrop-panel shadow bands that survive inside the
    # creature's component are removed later by the edge trim, not here:
    # an edge flood fill leaks through the pale underside of soft art.
    fg = ~((a[:, :, 0] > 242) & (a[:, :, 1] > 242) & (a[:, :, 2] > 242))
    lab, n = ndimage.label(fg, structure=np.ones((3, 3), dtype=int))
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    boxes = ndimage.find_objects(lab)
    largest = sizes.max() if n else 0
    keep_labels = set()
    for i in range(n):
        s = sizes[i]
        ys, xs = boxes[i]
        bw, bh = xs.stop - xs.start, ys.stop - ys.start
        fill = s / (bw * bh) if bw and bh else 0
        if bw >= 0.95 * W and bh >= 0.95 * H and fill <= 0.10:
            print(f'  dropping frame component #{i + 1} ({int(s)} px)')
            continue
        minor = s < largest
        if minor and o.drop_top and ys.stop <= o.drop_top * H:
            print(f'  dropping top-band component #{i + 1} ({int(s)} px)')
            continue
        if minor and o.drop_wash:
            px = a[lab == i + 1]
            if len(px) and (px.min(axis=1) > o.drop_wash).mean() > 0.9:
                print(f'  dropping wash component #{i + 1} ({int(s)} px)')
                continue
        if s >= max(50, o.keep_frac * largest):
            keep_labels.add(i + 1)
    keep = np.isin(lab, list(keep_labels))
    a[~keep] = 255

    if o.dilate:
        grown = ndimage.binary_dilation(keep, iterations=o.dilate)
        new = grown & ~keep
        inds = ndimage.distance_transform_edt(
            ~keep, return_distances=False, return_indices=True)
        a[new] = a[inds[0][new], inds[1][new]]
        keep = grown
        print(f'  dilated mask by {o.dilate}px ({int(new.sum())} px added)')

    ys, xs = np.where(keep)
    y0, y1 = max(0, ys.min() - o.pad), min(H, ys.max() + 1 + o.pad)
    x0, x1 = max(0, xs.min() - o.pad), min(W, xs.max() + 1 + o.pad)
    crop = Image.fromarray(a.astype(np.uint8)).crop((x0, y0, x1, y1))
    print(f'{o.src}: kept {len(keep_labels)}/{n} components, '
          f'crop ({x0},{y0})-({x1},{y1}) = {x1 - x0}x{y1 - y0}')

    if o.trim_edges:
        # Shave pale-neutral uniform bands off the crop edges (see
        # docstring step 4).
        ca = np.array(crop).astype(np.int32)
        pale_neutral = (ca.max(axis=2) - ca.min(axis=2) <= 14) & \
            (ca.min(axis=2) >= 220)
        nonwhite = ca.min(axis=2) < 250
        B = 5
        for side in range(4):
            for _ in range(10):
                if side == 0:
                    pn, nw = pale_neutral[:, :B], nonwhite[:, :B]
                elif side == 1:
                    pn, nw = pale_neutral[:, -B:], nonwhite[:, -B:]
                elif side == 2:
                    pn, nw = pale_neutral[:B, :], nonwhite[:B, :]
                else:
                    pn, nw = pale_neutral[-B:, :], nonwhite[-B:, :]
                # shave only a band that actually holds slab material:
                # >=25% non-white, and >=85% of that is pale-neutral.
                if nw.size == 0 or nw.mean() < 0.25 or \
                        pn[nw].mean() < 0.85:
                    break
                if side == 0:
                    ca = ca[:, B:]; pale_neutral = pale_neutral[:, B:]
                    nonwhite = nonwhite[:, B:]
                elif side == 1:
                    ca = ca[:, :-B]; pale_neutral = pale_neutral[:, :-B]
                    nonwhite = nonwhite[:, :-B]
                elif side == 2:
                    ca = ca[B:, :]; pale_neutral = pale_neutral[B:, :]
                    nonwhite = nonwhite[B:, :]
                else:
                    ca = ca[:-B, :]; pale_neutral = pale_neutral[:-B, :]
                    nonwhite = nonwhite[:-B, :]
        crop = Image.fromarray(ca.astype(np.uint8))
        print(f'  edge-trimmed -> {crop.width}x{crop.height}')

    if o.crop_filter:
        # Second isolation pass on the crop, AFTER any edge trim:
        # elements connected to the creature only through a trimmed
        # slab (e.g. the backdrop panel's top border line) are islands
        # now and drop out.
        ca = np.array(crop).astype(np.int32)
        fg2 = ~((ca[:, :, 0] > 242) & (ca[:, :, 1] > 242) &
                (ca[:, :, 2] > 242))
        lab2, n2 = ndimage.label(fg2, structure=np.ones((3, 3), dtype=int))
        if n2 > 1:
            sizes2 = ndimage.sum(fg2, lab2, range(1, n2 + 1))
            keep2 = {int(i + 1) for i, s in enumerate(sizes2)
                     if s >= max(50, o.crop_keep_frac * sizes2.max())}
            ca[~np.isin(lab2, list(keep2))] = 255
            crop = Image.fromarray(ca.astype(np.uint8))
            print(f'  crop-filter kept {len(keep2)}/{n2} components '
                  f'(sizes: {sorted((int(s) for s in sizes2), reverse=True)[:5]})')

    if o.sx != 1.0 or o.sy != 1.0:
        nw, nh = round(crop.width * o.sx), round(crop.height * o.sy)
        crop = crop.resize((nw, nh), Image.LANCZOS)
        print(f'  stretched -> {nw}x{nh} (sx={o.sx} sy={o.sy})')

    if o.palette_from:
        pal = load_palette(o.palette_from)
        b = np.array(crop).astype(np.float32)
        # painted background is exactly 255; pixels paler than the
        # threshold on every channel keep their original colour.
        fg2 = b.min(axis=2) < o.pal_fg_thresh
        px = b[fg2]
        d = ((px[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
        b[fg2] = pal[d.argmin(axis=1)]
        crop = Image.fromarray(b.astype(np.uint8))
        print(f'  posterized to {len(pal)} colours from {o.palette_from}')

    if o.lift != 1.0 or o.lift_rgb:
        b = np.array(crop).astype(np.float32)
        fg3 = b.min(axis=2) < 250
        f = np.array(o.lift_rgb, dtype=np.float32) if o.lift_rgb \
            else np.array([o.lift] * 3, dtype=np.float32)
        b[fg3] = np.clip(b[fg3] * f, 0, 255)
        crop = Image.fromarray(b.astype(np.uint8))
        print(f'  lifted creature colours x{f.tolist()}')

    crop.save(o.dst)
    print(f'  -> {o.dst}')


if __name__ == '__main__':
    main()
