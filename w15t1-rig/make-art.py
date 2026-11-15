#!/usr/bin/env python3
# W15-T1 art generator: 8 pix pieces for Hushmoor Tower + Vantage HQ.
# Twin-spire composition: each centre (c) piece is a complete spire slice,
# l/r are shoulder pieces (r = mirror of l). Bands align across pieces.
import os, sys
OUT = os.path.expanduser('~/workspace/ashs-journey-w15t1/assets/sprites/pix/tiles')
PRE = os.path.expanduser('~/workspace/your_files/w15t1-arden-landmarks')

def canvas(w, h, fill):
    return [[fill] * w for _ in range(h)]

def rect(cv, x, y, w, h, ch):
    for j in range(y, y + h):
        for i in range(x, x + w):
            if 0 <= j < len(cv) and 0 <= i < len(cv[0]):
                cv[j][i] = ch

def speckle(cv, ch, mod, off=0, region=None):
    for j, row in enumerate(cv):
        for i in range(len(row)):
            if region and not region(i, j):
                continue
            if (i * 7 + j * 13 + off) % mod == 0 and row[i] not in ('o', 'l', 'f'):
                row[i] = ch

def mirror(cv):
    return [list(reversed(r)) for r in cv]

def rows_of(cv):
    return [''.join(r) for r in cv]

# ---------------- HUSHMOOR (palette shared) ----------------
HUSH_PAL = [
    ('z', '#373f4b', 'spire-deep'), ('d', '#485363', 'shingle-shade'),
    ('g', '#5e6d82', 'shingle'), ('m', '#7b8593', 'shingle-light'),
    ('a', '#a2adbd', 'ridge-accent'), ('k', '#31445e', 'trim'),
    ('w', '#9aa3b1', 'ashlar-light'), ('v', '#7d8593', 'ashlar'),
    ('u', '#5f6773', 'ashlar-shade'), ('o', '#241f1c', 'opening'),
    ('l', '#e8b34b', 'lantern'), ('f', '#f5d67a', 'lantern-core'),
]

def hush_ashlar(cv, y0, window):
    # rows y0..47 ashlar field with block joints
    rect(cv, 0, y0, 16, 48 - y0, 'v')
    for j in range(y0, 48):
        for i in range(16):
            if (i * 5 + j * 3) % 7 == 0:
                cv[j][i] = 'w'
            if j in (y0 + 3, y0 + 7, y0 + 11) and i % 5 != 0:
                cv[j][i] = 'u'
    rect(cv, 0, 46, 16, 2, 'u')
    if window:
        rect(cv, 6, y0 + 2, 4, 1, 'k')            # lintel
        rect(cv, 7, y0 + 3, 2, 8, 'o')            # slit window
        rect(cv, 7, y0 + 6, 2, 2, 'l')            # lit pane
        rect(cv, 6, y0 + 11, 4, 1, 'k')           # sill

def hush_cap_c():
    cv = canvas(16, 48, 'd')
    speckle(cv, 'z', 4)
    # spire pyramid rows 2..15, centre cols 7-8
    for r in range(2, 16):
        hw = 1 + round((r - 2) * 7 / 13)
        x0, x1 = 8 - hw, 7 + hw
        for i in range(x0, x1 + 1):
            cv[r][i] = 'g'
            if (i * 3 + r) % 6 == 0:
                cv[r][i] = 'd'
        cv[r][x0] = 'm'
        cv[r][x1] = 'z'
    cv[0][7] = cv[0][8] = 'l'                      # lantern finial
    cv[1][7] = cv[1][8] = 'k'
    rect(cv, 0, 16, 16, 1, 'k')                    # eave
    rect(cv, 0, 17, 16, 1, 'u')
    # belfry rows 18..29: piers + arch opening + hanging lantern
    rect(cv, 0, 18, 16, 12, 'v')
    speckle(cv, 'w', 3, region=lambda i, j: i <= 2 or i >= 13)
    rect(cv, 4, 20, 8, 9, 'o')
    rect(cv, 5, 19, 6, 1, 'o')                     # arch shoulder
    cv[18][6] = cv[18][9] = 'o'
    rect(cv, 7, 20, 2, 2, 'k')                     # chain
    rect(cv, 6, 22, 4, 1, 'k')                     # lantern cap
    cv[23][6] = 'l'; cv[23][7] = 'f'; cv[23][8] = 'f'; cv[23][9] = 'l'
    cv[24][6] = 'l'; cv[24][7] = 'f'; cv[24][8] = 'f'; cv[24][9] = 'l'
    rect(cv, 6, 25, 4, 1, 'k')                     # lantern base
    rect(cv, 4, 29, 8, 1, 'k')                     # sill
    rect(cv, 0, 30, 16, 1, 'k')                    # trim band
    for i in range(0, 16, 4):
        cv[30][i] = 'm'
    rect(cv, 0, 31, 16, 1, 'k')
    hush_ashlar(cv, 32, window=True)
    return cv

def hush_cap_l():
    cv = canvas(16, 48, 'z')
    speckle(cv, 'd', 4)
    # shoulder plane rows 0..15: mass grows from top-right tip to full width
    for r in range(0, 16):
        edge = max(0, 13 - r)
        for i in range(edge, 16):
            cv[r][i] = 'g'
            if (i + r) % 4 == 0:
                cv[r][i] = 'd'
        if edge < 16:
            cv[r][edge] = 'a'
    rect(cv, 0, 14, 16, 2, 'g')
    for i in range(16):
        if i % 4 == 0:
            cv[15][i] = 'd'
    rect(cv, 0, 16, 16, 1, 'k')
    rect(cv, 0, 17, 16, 1, 'u')
    # belfry pier with slit window rows 18..29
    rect(cv, 0, 18, 16, 12, 'v')
    speckle(cv, 'w', 3)
    rect(cv, 7, 20, 2, 8, 'o')
    cv[24][7] = 'l'; cv[24][8] = 'l'
    rect(cv, 6, 19, 4, 1, 'k')
    rect(cv, 6, 28, 4, 1, 'k')
    rect(cv, 0, 30, 16, 1, 'k')
    for i in range(0, 16, 4):
        cv[30][i] = 'm'
    rect(cv, 0, 31, 16, 1, 'k')
    hush_ashlar(cv, 32, window=False)
    return cv

def hush_shaft():
    cv = canvas(16, 16, 'v')
    speckle(cv, 'w', 3)
    rect(cv, 0, 0, 16, 1, 'w')
    for j in (5, 10):
        for i in range(16):
            if i % 5 != 0:
                cv[j][i] = 'u'
    rect(cv, 6, 3, 4, 1, 'k')
    rect(cv, 7, 4, 2, 8, 'o')
    rect(cv, 7, 7, 2, 2, 'l')
    rect(cv, 6, 12, 4, 1, 'k')
    rect(cv, 0, 15, 16, 1, 'u')
    return cv

# ---------------- VANTAGE (palette shared) ----------------
VANT_PAL = [
    ('a', '#d6c48c', 'slab-face'), ('b', '#bfa96e', 'slab-shade'),
    ('c', '#eee0ae', 'slab-lit'), ('d', '#8a6d2f', 'bronze-shadow'),
    ('e', '#d9a92e', 'gold'), ('f', '#f2c14e', 'gold-bright'),
    ('g', '#6e5626', 'gold-deep'), ('s', '#7f95ad', 'glass'),
    ('n', '#3c4a5a', 'glass-dark'),
]

def vant_body(cv, y0, y1, win_cols):
    rect(cv, 0, y0, 16, y1 - y0 + 1, 'a')
    speckle(cv, 'b', 6, region=lambda i, j: y0 <= j <= y1)
    for (wx, ww) in win_cols:
        rect(cv, wx, y0 + 1, ww, y1 - y0 - 1, 's')
        rect(cv, wx, y0 + 1, 1, y1 - y0 - 1, 'n')
        rect(cv, wx + ww - 1, y0 + 1, 1, y1 - y0 - 1, 'n')
        mid = (y0 + y1) // 2
        rect(cv, wx, mid, ww, 1, 'n')

def vant_cap_c():
    cv = canvas(16, 48, 'a')
    speckle(cv, 'b', 6)
    # gold spire rows 2..9 centred cols 7-8
    for r in range(2, 10):
        hw = 1 + round((r - 2) * 4 / 7)
        x0, x1 = 8 - hw, 7 + hw
        for i in range(x0, x1 + 1):
            cv[r][i] = 'e'
        cv[r][x0] = 'f'
        cv[r][x1] = 'g'
    rect(cv, 2, 9, 12, 1, 'e')                     # spire skirt
    cv[0][7] = cv[0][8] = 'f'                      # finial
    cv[1][7] = cv[1][8] = 'e'
    rect(cv, 0, 10, 16, 1, 'e')                    # gold eave
    for i in range(0, 16, 4):
        cv[10][i] = 'f'
    rect(cv, 0, 11, 16, 1, 'd')
    # body rows 12..29: central window column + lit side panels
    rect(cv, 1, 13, 2, 15, 'c')
    rect(cv, 13, 13, 2, 15, 'c')
    vant_body(cv, 12, 29, [(6, 4)])
    rect(cv, 1, 13, 2, 15, 'c')
    rect(cv, 13, 13, 2, 15, 'c')
    rect(cv, 0, 29, 16, 1, 'b')
    rect(cv, 0, 30, 16, 1, 'e')                    # gold belt
    rect(cv, 0, 31, 16, 1, 'g')
    # lower body rows 32..47: one wide window
    vant_body(cv, 32, 47, [(5, 6)])
    rect(cv, 0, 34, 16, 1, 'b')
    rect(cv, 0, 45, 16, 1, 'b')
    rect(cv, 0, 46, 16, 1, 'b')
    rect(cv, 0, 47, 16, 1, 'd')
    return cv

def vant_cap_l():
    cv = canvas(16, 48, 'a')
    speckle(cv, 'b', 6)
    # gold shoulder diagonal rows 2..9 descending from inner (right) edge
    for r in range(2, 10):
        start = 15 - (r - 2)
        for i in range(start, 16):
            cv[r][i] = 'e'
        cv[r][start] = 'f'
        if start + 2 < 16:
            cv[r][start + 2] = 'g'
    rect(cv, 0, 10, 16, 1, 'e')
    for i in range(0, 16, 4):
        cv[10][i] = 'f'
    rect(cv, 0, 11, 16, 1, 'd')
    rect(cv, 1, 13, 2, 15, 'c')
    vant_body(cv, 12, 29, [(10, 4)])
    rect(cv, 1, 13, 2, 15, 'c')
    rect(cv, 0, 29, 16, 1, 'b')
    rect(cv, 0, 30, 16, 1, 'e')
    rect(cv, 0, 31, 16, 1, 'g')
    vant_body(cv, 32, 47, [(8, 5)])
    rect(cv, 0, 34, 16, 1, 'b')
    rect(cv, 0, 45, 16, 1, 'b')
    rect(cv, 0, 46, 16, 1, 'b')
    rect(cv, 0, 47, 16, 1, 'd')
    return cv

def vant_shaft():
    cv = canvas(16, 16, 'a')
    speckle(cv, 'b', 6)
    rect(cv, 0, 0, 16, 1, 'c')
    for (wx,) in [(2,), (10,)]:
        rect(cv, wx, 2, 4, 1, 'e')
        rect(cv, wx, 3, 4, 8, 's')
        rect(cv, wx, 3, 1, 8, 'n')
        rect(cv, wx + 3, 3, 1, 8, 'n')
        rect(cv, wx, 6, 4, 1, 'n')
        rect(cv, wx, 11, 4, 1, 'e')
    rect(cv, 0, 15, 16, 1, 'd')
    return cv

PIECES = [
    ('tile-hushtowercap-l', hush_cap_l(), HUSH_PAL, 'Wave W15-T1: Hushmoor Tower cap L — steep shingle shoulder of the memorial tower, Hushmoor kit register. 16x48 tall art, bottom-anchored on the tower top-row cell (Premium+ W6 TX-3).'),
    ('tile-hushtowercap-c', hush_cap_c(), HUSH_PAL, 'Wave W15-T1: Hushmoor Tower cap C — spire + belfry with lit hanging lantern over ashlar, Hushmoor kit register. 16x48 tall art, bottom-anchored (TX-3).'),
    ('tile-hushtowercap-r', mirror(hush_cap_l()), HUSH_PAL, 'Wave W15-T1: Hushmoor Tower cap R — mirror shoulder of the memorial tower cap. 16x48 tall art, bottom-anchored (TX-3).'),
    ('tile-hushtowershaft', hush_shaft(), HUSH_PAL, 'Wave W15-T1: Hushmoor Tower shaft — ashlar wall with a lit slit window, replacing borrowed gym wall on the tower shaft row.'),
    ('tile-vantcap-l', vant_cap_l(), VANT_PAL, 'Wave W15-T1: Vantage Co. HQ cap L — gold shoulder + slab tower body, Farsight Gold Spire kit register. 16x48 tall art, bottom-anchored (TX-3).'),
    ('tile-vantcap-c', vant_cap_c(), VANT_PAL, 'Wave W15-T1: Vantage Co. HQ cap C — gold spire over slab tower body with glass column. 16x48 tall art, bottom-anchored (TX-3).'),
    ('tile-vantcap-r', mirror(vant_cap_l()), VANT_PAL, 'Wave W15-T1: Vantage Co. HQ cap R — mirror shoulder of the HQ cap. 16x48 tall art, bottom-anchored (TX-3).'),
    ('tile-vantshaft', vant_shaft(), VANT_PAL, 'Wave W15-T1: Vantage Co. HQ shaft — slab facade with gold-capped glass windows, replacing borrowed lab wall on the HQ wall row.'),
]

def write_pix(name, cv, pal, comment):
    rows = rows_of(cv)
    assert all(len(r) == len(cv[0]) for r in rows), name
    used = set(''.join(rows))
    pal_used = [(c, hx, nm) for (c, hx, nm) in pal if c in used]
    assert len(pal_used) <= 16, (name, len(pal_used))
    txt = f"# {comment}\nPIX {name} {len(cv[0])} {len(cv)}\n" + '\n'.join(rows) + '\nPAL\n'
    txt += '\n'.join(f"{c} {hx} {nm}" for (c, hx, nm) in pal_used) + '\n'
    with open(os.path.join(OUT, name + '.pix'), 'w') as fh:
        fh.write(txt)
    return pal_used

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    lut = {}
    for name, cv, pal, comment in PIECES:
        pu = write_pix(name, cv, pal, comment)
        lut[name] = {c: hx for (c, hx, nm) in pu}
        print('wrote', name, len(cv[0]), 'x', len(cv), 'colors', len(pu))
    # previews: pieces + assembled strips
    from PIL import Image
    def render(name, cv, palmap, scale=4):
        im = Image.new('RGB', (len(cv[0]) * scale, len(cv) * scale))
        px = im.load()
        for j, row in enumerate(cv):
            for i, ch in enumerate(row):
                hx = palmap[ch]
                rgb = tuple(int(hx[k:k + 2], 16) for k in (1, 3, 5))
                for dj in range(scale):
                    for di in range(scale):
                        px[i * scale + di, j * scale + dj] = rgb
        im.save(os.path.join(PRE, 'art-' + name + '.png'))
    byname = {n: cv for (n, cv, p, c) in PIECES}
    for name, cv, pal, comment in PIECES:
        render(name, cv, lut[name])
    def strip(names, out):
        cvs = [byname[n] for n in names]
        h = len(cvs[0])
        merged = [[c for cv in cvs for c in cv[j]] for j in range(h)]
        palmap = {}
        for n in names:
            palmap.update(lut[n])
        render(out, merged, palmap)
    strip(['tile-hushtowercap-l', 'tile-hushtowercap-c', 'tile-hushtowercap-c', 'tile-hushtowercap-r'], 'hush-strip')
    strip(['tile-vantcap-l', 'tile-vantcap-c', 'tile-vantcap-c', 'tile-vantcap-c', 'tile-vantcap-c', 'tile-vantcap-r'], 'vant-strip')
    print('previews done')
