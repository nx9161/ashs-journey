# redress.py — W11 T4 GALEDUCK re-dress editor.
# Removes the POSTDUCK-era carrier gear (cap + badge, mail satchel +
# strap, envelope) from the design sources and paints the storm-duck
# dress from plan §3.2: storm-feather crest, wind-torn scarf, and the
# leek the flavour text promises, carried like a weather-vane stalk.
# Deterministic, numpy + PIL only. Usage:
#   python3 redress.py front <in.png> <out.png>
#   python3 redress.py back  <in.png> <out.png>
#   python3 redress.py posterize <in.png> <out.png> <palette.pix>
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

# ---- shared storm palette (both views, plan §3.2) ----
SCARF      = (70, 88, 110)    # slate indigo
SCARF_DARK = (47, 61, 82)
SCARF_LITE = (122, 141, 168)
CREST_DARK = (20, 62, 71)
CREST_MID  = (29, 90, 94)
CREST_LITE = (42, 127, 124)
LEEK_STALK = (233, 242, 210)
LEEK_SHADE = (196, 221, 156)
LEEK_A     = (93, 168, 58)
LEEK_B     = (111, 184, 69)
LEEK_C     = (76, 148, 44)
LEEK_VEIN  = (58, 116, 34)
SCRIBBLE   = (36, 124, 118)
FACE_TEAL  = (53, 179, 175)


def load(path):
    im = Image.open(path).convert('RGB')
    return im, np.asarray(im).astype(np.int32)


def bg_color(a):
    corners = np.array([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]])
    return tuple(int(v) for v in np.median(corners, axis=0))


def creature_mask(a):
    cand = (a[:, :, 0] > 243) & (a[:, :, 1] > 243) & (a[:, :, 2] > 243)
    lab, _ = ndimage.label(cand)
    border = set(np.unique(np.concatenate(
        [lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    return ~bg, bg


def brown_mask(a):
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = a.max(axis=2); mn = a.min(axis=2)
    return ((R - B > 28) & (R - G > 8) & (G >= B) &
            (mx > 35) & (mx < 208) & (mx - mn > 30))


def brown_gear(a):
    """Satchel + strap core: big warm-brown components in the body zone."""
    bm = ndimage.binary_dilation(brown_mask(a), iterations=3)
    lab, n = ndimage.label(bm)
    keep = np.zeros(bm.shape, bool)
    for i in range(1, n + 1):
        comp = lab == i
        if comp.sum() > 2500 and comp[350:, :].sum() > 2000:
            keep |= comp
    return keep & brown_mask(a)


def dilate(mask, it):
    return ndimage.binary_dilation(mask, iterations=it)


def diffusion_inpaint(img, fill, domain, iters=300):
    """Smooth-gradient fill: Jacobi diffusion inside `domain`; pixels
    outside `fill` are fixed boundary values. Neighbours outside the
    domain contribute the pixel's own value (Neumann edge)."""
    x = img.astype(np.float32).copy()
    init = x[~fill & domain]
    x[fill] = np.median(init, axis=0) if len(init) else 128
    dom = domain.astype(np.float32)
    for _ in range(iters):
        s = np.zeros_like(x); c = np.zeros_like(dom)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xs = np.roll(x, (dy, dx), (0, 1))
            ds = np.roll(dom, (dy, dx), (0, 1))
            s += xs * ds[:, :, None]
            c += ds
        avg = s / np.maximum(c, 1)[:, :, None]
        avg[c == 0] = x[c == 0]
        x[fill] = avg[fill]
    return np.clip(x, 0, 255).astype(np.int32)


def outline_pts(crea, y0, y1, side='both', xmax=None):
    er = ndimage.binary_erosion(crea)
    bnd = crea & ~er
    pts = []
    for y in range(y0, y1):
        xs = np.where(bnd[y])[0]
        if not len(xs):
            continue
        cand = [xs.min()] if side in ('both', 'left') else []
        cand += [xs.max()] if side in ('both', 'right') else []
        for x in cand:
            if xmax is None or x <= xmax:
                pts.append((x, y))
    return np.array(pts, float)


def fit_ellipse(pts, cy_grid):
    """Centre-x = median row centre of the points; grid-search cy;
    linear least squares for (1/rx^2, 1/ry^2). Returns (cx, cy, rx, ry,
    residual)."""
    rows = {}
    for x, y in pts:
        rows.setdefault(y, []).append(x)
    cx = float(np.median([(min(v) + max(v)) / 2 for v in rows.values()]))
    best = None
    for cy in cy_grid:
        A = np.column_stack([(pts[:, 0] - cx) ** 2, (pts[:, 1] - cy) ** 2])
        sol, res, *_ = np.linalg.lstsq(A, np.ones(len(pts)), rcond=None)
        if sol[0] <= 0 or sol[1] <= 0:
            continue
        r = float(res[0]) if len(res) else 1e18
        if best is None or r < best[4]:
            best = (cx, cy, 1 / np.sqrt(sol[0]), 1 / np.sqrt(sol[1]), r)
    return best


def ellipse_top(crea, ell):
    cx, cy, rx, ry, _ = ell
    H, W = crea.shape
    xs = np.arange(W)
    f = 1 - ((xs - cx) / rx) ** 2
    top = np.where(f >= 0, cy - ry * np.sqrt(np.maximum(f, 0)), np.inf)
    return top, (cx, cy - ry)


def dome_from_profile(crea, y0, y1, ry_factor=1.25):
    """Dome from the silhouette's half-width profile over [y0,y1]:
    centre = median row centre, rx = max half-width, cy = its row,
    ry = ry_factor * rx (eggy dome). Returns (top, apex)."""
    H, W = crea.shape
    rows = []
    for y in range(y0, y1):
        xs = np.where(crea[y])[0]
        if len(xs):
            rows.append((y, (xs.min() + xs.max()) / 2,
                         (xs.max() - xs.min()) / 2))
    cx = float(np.median([r[1] for r in rows]))
    cy = float(max(rows, key=lambda r: r[2])[0])
    rx = float(max(r[2] for r in rows))
    ry = ry_factor * rx
    xs = np.arange(W)
    f = 1 - ((xs - cx) / rx) ** 2
    top = np.where(f >= 0, cy - ry * np.sqrt(np.maximum(f, 0)), np.inf)
    return top, (cx, cy - ry)


def edge_fit_outside(crea, gear, side, top_rows, bot_rows, y_lo, y_hi,
                     tol=6):
    """Classify gear pixels as outside-the-body using a quadratic fit
    of the trusted silhouette edge (rows above the gear zone + the
    bottom arc rows), evaluated across the gear rows."""
    pts = []
    for y in list(top_rows) + list(bot_rows):
        xs = np.where(crea[y])[0]
        if len(xs):
            pts.append((y, xs.min() if side == 'left' else xs.max()))
    ys = np.array([p[0] for p in pts], float)
    xs = np.array([p[1] for p in pts], float)
    cf = np.polyfit(ys, xs, 2)
    outside = np.zeros(gear.shape, bool)
    gy, gx = np.where(gear)
    for y, x in zip(gy, gx):
        if y_lo <= y <= y_hi:
            edge = np.polyval(cf, y)
            if (side == 'left' and x < edge - tol) or \
               (side == 'right' and x > edge + tol):
                outside[y, x] = True
    return outside


def _top_from_LR(crea, grid, L, R):
    H, W = crea.shape
    ok = np.where(L <= R)[0]
    apex_i = ok[0] if len(ok) else len(grid) - 1
    apex = ((L[apex_i] + R[apex_i]) / 2, grid[apex_i])
    top = np.full(W, np.inf)
    for gi, y in enumerate(grid):
        if L[gi] > R[gi]:
            continue
        cols = np.arange(int(np.ceil(L[gi])), int(np.floor(R[gi])) + 1)
        cols = cols[(cols >= 0) & (cols < W)]
        upd = cols[top[cols] == np.inf]
        top[upd] = y
    return top, apex


def dome_fit(crea, y0, y1):
    """Two-sided quadratic outline extrapolation (front head)."""
    ys, xl, xr = [], [], []
    for y in range(y0, y1):
        xs = np.where(crea[y])[0]
        if len(xs):
            ys.append(y); xl.append(xs.min()); xr.append(xs.max())
    ys = np.array(ys, float)
    cl = np.polyfit(ys, np.array(xl, float), 2)
    cr = np.polyfit(ys, np.array(xr, float), 2)
    grid = np.arange(30, y0 + 1)
    return _top_from_LR(crea, grid, np.polyval(cl, grid),
                        np.polyval(cr, grid))


def dome_fit_mirror(crea, y0, y1, band_y):
    """Left-outline quadratic, mirrored about the band-row centre."""
    ys, xl = [], []
    for y in range(y0, y1):
        xs = np.where(crea[y])[0]
        if len(xs):
            ys.append(y); xl.append(xs.min())
    ys = np.array(ys, float)
    cl = np.polyfit(ys, np.array(xl, float), 2)
    brow = np.where(crea[band_y])[0]
    cx = (brow.min() + brow.max()) / 2
    grid = np.arange(30, y0 + 1)
    L = np.polyval(cl, grid)
    return _top_from_LR(crea, grid, L, 2 * cx - L)


def decap(img, crea, top, band_y, bgc):
    # complete the dome: columns the fitted curve never reaches but
    # that carry creature above the band are cap overhang — clear
    # everything above the band there.
    top = top.copy()
    yy = np.mgrid[0:img.shape[0], 0:img.shape[1]][0]
    has_above = (crea & (yy <= band_y + 40)).any(axis=0)
    top[np.isinf(top) & has_above] = band_y
    """Above dome -> bg; dome..band_y -> median face-teal fill with a
    soft top-light gradient. Nothing below band_y is touched (the
    cap's brow shadow shares its colour family with the eyes)."""
    H, W = img.shape[:2]
    out = img.copy()
    samples = []
    spans = []
    for x in range(W):
        t = top[x]
        if not np.isfinite(t):
            continue
        for y in range(band_y, min(band_y + 90, H)):
            px = img[y, x]
            if px[1] > 150 and px[2] > 140 and px[0] < 110:
                samples.append(px); break
        spans.append(x)
    face = (np.median(np.array(samples), axis=0) if samples
            else np.array(FACE_TEAL))
    print('  decap face colour:', face, 'from', len(samples), 'columns')
    for x in spans:
        t = int(np.ceil(top[x]))
        col = crea[:, x]
        ys = np.where(col & (np.arange(H) < t))[0]
        out[ys, x] = bgc
        for y in range(t, band_y):
            if col[y]:
                f = 1.05 - 0.06 * (y - t) / max(1, band_y - t)
                out[y, x] = np.clip(face * f, 0, 255)
    return out


def overlay_draw(size, fn):
    ov = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    fn(d)
    alpha = ov.split()[3].filter(ImageFilter.GaussianBlur(1.3))
    ov.putalpha(alpha)
    return ov


def feather(d, root, tip, w, color, lite=None):
    root = np.array(root, float); tip = np.array(tip, float)
    ax = tip - root
    ax = ax / (np.linalg.norm(ax) + 1e-9)
    px = np.array([-ax[1], ax[0]])
    mid = root + (tip - root) * 0.55
    pts = [tuple(root + px * w / 2), tuple(mid + px * w * 0.36),
           tuple(tip), tuple(mid - px * w * 0.36),
           tuple(root - px * w / 2)]
    d.polygon(pts, fill=color + (255,))
    if lite:
        pts2 = [tuple(root + px * w * 0.16), tuple(mid + px * w * 0.09),
                tuple(tip - (tip - root) * 0.06), tuple(mid - px * w * 0.04)]
        d.polygon(pts2, fill=lite + (255,))


def draw_crest(d, top, apex_x, offsets):
    for dx, tx, ty, w in offsets:
        x = int(apex_x + dx)
        if not np.isfinite(top[x]):
            continue
        root = (x, top[x] + 8)
        feather(d, root, (x + tx, top[x] + ty), w, CREST_DARK, CREST_MID)


def finish(out, crea_pre, zones, bgc):
    """Clip the composited dress to the pre-dress silhouette (dilated)
    plus the chartered extra zones (crest / tails / leek airspace)."""
    allowed = dilate(crea_pre, 4)
    for (x0, y0, x1, y1) in zones:
        allowed[max(y0, 0):y1, max(x0, 0):x1] = True
    arr = np.asarray(out).copy()
    arr[~allowed] = list(bgc) + [255]
    return Image.fromarray(arr)


def fit_circle(pts):
    x, y = pts[:, 0], pts[:, 1]
    A = np.column_stack([2 * x, 2 * y, np.ones_like(x)])
    b = x ** 2 + y ** 2
    sol, *_ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy, c = sol
    return cx, cy, np.sqrt(c + cx ** 2 + cy ** 2)


def remove_gear(img, crea, gear_core, bgc, circle=None):
    """Dilate the gear mask past its soft edges, diffusion-fill the
    part inside the body, background-fill the part outside the body
    circle (fitted on trusted outline points)."""
    crea1, _ = creature_mask(img)
    gear_fill = dilate(gear_core, 12) & crea1
    if circle is not None:
        cx, cy, r = circle
        yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]]
        dist2 = (xx - cx) ** 2 + (yy - cy) ** 2
        outside = gear_fill & (dist2 > (r + 4) ** 2)
    else:
        dist2 = None
        outside = np.zeros(gear_fill.shape, bool)
    fill = gear_fill & ~outside
    img2 = diffusion_inpaint(img, fill, crea1)
    img2[outside] = bgc
    print('  gear: filled', int(fill.sum()), '-> bg', int(outside.sum()))
    # brown sweep: the re-dressed duck carries NO brown anywhere, so
    # any surviving brown-family pixel is gear fringe (soft edges /
    # drop shadow the core mask missed). Fill inside the body circle,
    # background outside it.
    crea2, _ = creature_mask(img2)
    rem = brown_mask(img2) & crea2
    if rem.sum():
        remf = dilate(rem, 3) & crea2
        if dist2 is not None:
            out2 = remf & (dist2 > (r + 4) ** 2)
        else:
            out2 = np.zeros(remf.shape, bool)
        img2 = diffusion_inpaint(img2, remf & ~out2, crea2, iters=150)
        img2[out2] = bgc
        print('  brown sweep:', int(rem.sum()), 'core px,',
              int(out2.sum()), '-> bg')
    return img2


def body_circle(crea, pts):
    c = fit_circle(pts)
    print(f'  body circle: c=({c[0]:.0f},{c[1]:.0f}) r={c[2]:.0f}')
    return c


# ================= FRONT =================
def do_front(src, dst):
    im, a = load(src)
    H, W = a.shape[:2]
    bgc = bg_color(a)
    crea, _ = creature_mask(a)
    top, apex = dome_fit(crea, 280, 390)
    if not (300 < apex[0] < 600 and 60 < apex[1] < 260):
        print('  front dome fit suspect, mirror fallback')
        top, apex = dome_fit_mirror(crea, 280, 390, 250)
    print(f'front dome apex: ({apex[0]:.0f},{apex[1]:.0f})')
    img = decap(a, crea, top, 250, bgc)

    R, G, B = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    crea1, _ = creature_mask(img)
    roi = np.zeros(crea1.shape, bool); roi[350:580, 290:580] = True
    cream = roi & (R > 215) & (G > 175) & (B < 178) & (R - B > 55)
    lab, n = ndimage.label(cream)
    env = np.zeros(cream.shape, bool)
    for i in range(1, n + 1):
        comp = lab == i
        if comp.sum() > 300:
            env |= comp
    roi2 = np.zeros(crea1.shape, bool); roi2[340:590, 280:590] = True
    env |= (dilate(env, 7) & roi2 & (R - B > 22) & (img.max(axis=2) > 115))
    gear = brown_gear(img)
    print('front envelope px:', int(env.sum()),
          'brown gear px:', int(gear.sum()))
    bpts = [tuple(p) for p in outline_pts(crea, 425, 490, side='left')]
    bpts += [tuple(p) for p in outline_pts(crea, 570, 700, side='right')]
    for x in range(370, 506):
        ys = np.where(crea[:, x])[0]
        if len(ys):
            bpts.append((x, ys.max()))
    img = remove_gear(img, crea, env | gear, bgc,
                      body_circle(crea, np.array(bpts, float)))
    # cleanup sweep: warm slivers left in the chest (envelope fringe)
    R, G, B = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    crea2, _ = creature_mask(img)
    roi3 = np.zeros(crea2.shape, bool); roi3[390:565, 330:560] = True
    sliver = roi3 & crea2 & (R - B > 40) & (R > 180) & (G > 140) & (B < 195)
    if sliver.sum():
        print('front sliver cleanup px:', int(sliver.sum()))
        img = diffusion_inpaint(img, dilate(sliver, 3) & crea2, crea2,
                                iters=120)
    crea_pre, _ = creature_mask(img)

    out = Image.fromarray(img.astype(np.uint8)).convert('RGBA')

    def crest(d):
        draw_crest(d, top, apex[0] - 10,
                   [(-92, -84, -40, 46), (-44, -50, -64, 46),
                    (4, -14, -70, 44), (52, 18, -58, 40)])
    out = Image.alpha_composite(out, overlay_draw((W, H), crest))

    def scarf(d):
        band = [(258, 492), (360, 516), (462, 524), (566, 510), (650, 486)]
        d.line(band, fill=SCARF + (255,), width=38, joint='curve')
        d.line([(258, 503), (360, 527), (462, 535), (566, 521), (650, 497)],
               fill=SCARF_DARK + (255,), width=12, joint='curve')
        d.line([(258, 483), (360, 507), (462, 515), (566, 501), (650, 477)],
               fill=SCARF_LITE + (255,), width=5, joint='curve')
        d.ellipse([240, 470, 296, 518], fill=SCARF_DARK + (255,))
        d.polygon([(252, 494), (196, 518), (158, 584), (186, 590),
                   (178, 614), (232, 554), (256, 530)],
                  fill=SCARF + (255,))
        d.polygon([(248, 514), (208, 546), (196, 590), (228, 546),
                   (250, 538)], fill=SCARF_DARK + (255,))
    out = Image.alpha_composite(out, overlay_draw((W, H), scarf))

    def leek(d):
        d.polygon([(364, 548), (400, 542), (340, 254), (315, 258)],
                  fill=LEEK_STALK + (255,))
        d.polygon([(384, 545), (400, 542), (340, 254), (328, 256)],
                  fill=LEEK_SHADE + (255,))
        d.polygon([(327, 254), (298, 240), (258, 192), (272, 246),
                   (304, 264)], fill=LEEK_A + (255,))
        d.polygon([(328, 252), (320, 210), (330, 160), (346, 214),
                   (342, 252)], fill=LEEK_B + (255,))
        d.polygon([(332, 254), (356, 220), (392, 192), (376, 242),
                   (346, 264)], fill=LEEK_C + (255,))
        d.line([(327, 250), (294, 216)], fill=LEEK_VEIN + (255,), width=4)
        d.line([(329, 248), (332, 192)], fill=LEEK_VEIN + (255,), width=4)
        d.line([(331, 250), (358, 216)], fill=LEEK_VEIN + (255,), width=4)
    out = Image.alpha_composite(out, overlay_draw((W, H), leek))

    zones = [(190, 50, 630, 290), (130, 460, 300, 640), (245, 145, 415, 560)]
    out = finish(out, crea_pre, zones, bgc)
    out.convert('RGB').save(dst)
    print('wrote', dst)


# ================= BACK =================
def do_back(src, dst):
    im, a = load(src)
    H, W = a.shape[:2]
    bgc = bg_color(a)
    crea, _ = creature_mask(a)
    top, apex = dome_from_profile(crea, 285, 430)
    print(f'back dome apex: ({apex[0]:.0f},{apex[1]:.0f})')
    img = decap(a, crea, top, 285, bgc)

    gear = brown_gear(img)
    print('back brown gear px:', int(gear.sum()))
    bpts = [tuple(p) for p in outline_pts(crea, 590, 690, side='left')]
    bpts += [tuple(p) for p in outline_pts(crea, 430, 470, side='right')]
    for x in range(360, 501):
        ys = np.where(crea[:, x])[0]
        if len(ys):
            bpts.append((x, ys.max()))
    img = remove_gear(img, crea, gear, bgc,
                      body_circle(crea, np.array(bpts, float)))
    crea_pre, _ = creature_mask(img)

    out = Image.fromarray(img.astype(np.uint8)).convert('RGBA')

    def scribbles(d):
        d.arc([335, 475, 440, 560], start=300, end=80,
              fill=SCRIBBLE + (255,), width=4)
        d.arc([425, 525, 520, 600], start=290, end=70,
              fill=SCRIBBLE + (255,), width=4)
    out = Image.alpha_composite(out, overlay_draw((W, H), scribbles))

    def crest(d):
        draw_crest(d, top, apex[0] - 5,
                   [(-78, -72, -36, 44), (-24, -28, -64, 44),
                    (30, 24, -52, 38)])
    out = Image.alpha_composite(out, overlay_draw((W, H), crest))

    def scarf(d):
        band = [(286, 330), (372, 352), (470, 360), (564, 346), (620, 324)]
        d.line(band, fill=SCARF + (255,), width=34, joint='curve')
        d.line([(286, 341), (372, 363), (470, 371), (564, 357), (620, 335)],
               fill=SCARF_DARK + (255,), width=11, joint='curve')
        d.line([(286, 322), (372, 344), (470, 352), (564, 338), (620, 316)],
               fill=SCARF_LITE + (255,), width=5, joint='curve')
        d.polygon([(282, 336), (220, 368), (148, 438), (176, 442),
                   (172, 470), (262, 390), (288, 364)],
                  fill=SCARF + (255,))
        d.polygon([(280, 356), (240, 386), (230, 424), (258, 388),
                   (284, 378)], fill=SCARF_DARK + (255,))
    out = Image.alpha_composite(out, overlay_draw((W, H), scarf))

    def leek_back(d):
        d.polygon([(247, 444), (266, 442), (259, 548), (239, 542)],
                  fill=LEEK_STALK + (255,))
        d.polygon([(258, 443), (266, 442), (259, 548), (250, 546)],
                  fill=LEEK_SHADE + (255,))
        d.polygon([(256, 446), (234, 388), (206, 370), (226, 440)],
                  fill=LEEK_A + (255,))
        d.polygon([(262, 450), (258, 394), (236, 368), (242, 442)],
                  fill=LEEK_C + (255,))
    out = Image.alpha_composite(out, overlay_draw((W, H), leek_back))

    zones = [(230, 40, 650, 300), (125, 310, 300, 485), (190, 355, 285, 560)]
    out = finish(out, crea_pre, zones, bgc)
    out.convert('RGB').save(dst)
    print('wrote', dst)


# ================= POSTERIZE =================
def do_posterize(src, dst, pixpath):
    pal = []
    for line in open(pixpath):
        line = line.strip()
        if len(line) > 2 and line[1] == ' ' and line[2] == '#':
            pal.append(tuple(int(line[3:][i:i + 2], 16) for i in (0, 2, 4)))
    pal = np.array([p for p in pal if p != (42, 24, 0)], float)
    print('posterize palette:', len(pal), 'colours')
    im, a = load(src)
    crea, _ = creature_mask(a)
    flat = a[crea].astype(float)
    d = ((flat[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
    a[crea] = pal[d.argmin(axis=1)].astype(np.int32)
    Image.fromarray(a.astype(np.uint8)).save(dst)
    print('wrote', dst)


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'front':
        do_front(sys.argv[2], sys.argv[3])
    elif mode == 'back':
        do_back(sys.argv[2], sys.argv[3])
    elif mode == 'posterize':
        do_posterize(sys.argv[2], sys.argv[3], sys.argv[4])
