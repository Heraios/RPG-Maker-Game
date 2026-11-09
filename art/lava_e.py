# Run from the repository root:  python3 art/lava_e.py
# Draws Smoking Isle/img/tilesets/Lava-E.png: the Lava Country tileset's E sheet (it replaces Exterior's spare
# indoor sheet there). Pixel art drawn at 24x24 and doubled to 48x48, in the basalt palette of Lava-A2/A4.
# Tile index -> what it is (the E sheet's tile ids are 768 + index; LAYOUT also sets each tile's passability):
#   1-4   telegraph pole tops (crossarm, clay insulators, clan cloth): wire running  -  |  \  /   (drawn above)
#   5-8   telegraph wire runs:  -  |  \  /                                                     (drawn above)
#   9     telegraph pole base on a basalt cairn, with the Lightning Clan's mark                (blocks)
#   10    a cairn   11 a lava-tree mould   12-13 rubble (clinker)   14 a boulder              (block)
#   15    lichen speckles                                                                       (walkable)
#   16-19 cracks, still warm:  -  |  \  /   (walkable: the ghost-only crossing is a region you paint)
#   20 21 / 28 29   a tumulus (2x2: top-left, top-right / bottom-left, bottom-right)           (blocks)
from PIL import Image, ImageDraw

S = 24                                   # drawn size; doubled on save
OUT = (0, 0, 0, 255)
ROCK, ROCK_D, ROCK_L, RUST = (112, 106, 100, 255), (58, 55, 60, 255), (158, 150, 140, 255), (150, 104, 82, 255)   # lighter than the ground, so pieces stand out
WOOD, WOOD_D, WOOD_L = (164, 100, 34, 255), (80, 48, 0, 255), (236, 193, 118, 255)
COPPER, COPPER_D = (214, 132, 66, 255), (120, 66, 30, 255)
CLAY, CLOTH, MARK = (232, 214, 186, 255), (178, 52, 44, 255), (238, 206, 84, 255)
LICHEN, GLOW, GLOW_D = (156, 168, 120, 255), (236, 120, 40, 255), (150, 60, 24, 255)

def tile():
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)
def px(d, x, y, c):
    if 0 <= x < S and 0 <= y < S: d.point((x, y), fill=c)
def line(d, pts, c, w=1): d.line(pts, fill=c, width=w)

def stone(d, x0, y0, x1, y1):           # a rounded stone with outline, highlight and shade
    d.ellipse([x0, y0, x1, y1], fill=OUT)
    d.ellipse([x0 + 1, y0 + 1, x1 - 1, y1 - 1], fill=ROCK)
    d.line([x0 + 2, y1 - 2, x1 - 2, y1 - 2], fill=ROCK_D)
    d.point((x0 + 2, y0 + 2), fill=ROCK_L); d.point((x0 + 3, y0 + 2), fill=ROCK_L)

# wires: one line equation per direction, so runs join up from tile to tile (and pass the crossarm at y=9)
def wire(d, kind):
    if kind == '-':
        line(d, [(0, 9), (S - 1, 9)], COPPER); line(d, [(0, 10), (S - 1, 10)], COPPER_D)
    elif kind == '|':
        line(d, [(12, 0), (12, S - 1)], COPPER); line(d, [(13, 0), (13, S - 1)], COPPER_D)
    elif kind == '\\':                    # y = x - 3
        for x in range(S):
            px(d, x, x - 3, COPPER); px(d, x, x - 2, COPPER_D)
    elif kind == '/':                     # y = 21 - x
        for x in range(S):
            px(d, x, 21 - x, COPPER); px(d, x, 22 - x, COPPER_D)

def pole_top(kind):
    im, d = tile()
    d.rectangle([10, 6, 14, S - 1], fill=OUT); d.rectangle([11, 7, 13, S - 1], fill=WOOD)   # the shaft
    d.line([13, 7, 13, S - 1], fill=WOOD_D); d.point((11, 8), fill=WOOD_L)
    d.rectangle([4, 7, 20, 10], fill=OUT); d.rectangle([5, 8, 19, 9], fill=WOOD)          # the crossarm
    d.line([5, 9, 19, 9], fill=WOOD_D)
    for x in (5, 18):                                                                      # clay insulators
        d.rectangle([x - 1, 5, x + 1, 7], fill=OUT); d.point((x, 6), fill=CLAY)
    d.rectangle([16, 10, 18, 16], fill=OUT); d.rectangle([17, 11, 17, 15], fill=CLOTH)    # the clan's cloth
    wire(d, kind)
    return im

def wire_tile(kind):
    im, d = tile(); wire(d, kind); return im

def pole_base():
    im, d = tile()
    d.ellipse([3, 19, 21, 23], fill=(0, 0, 0, 90))                                          # shadow
    d.rectangle([10, 0, 14, 16], fill=OUT); d.rectangle([11, 0, 13, 16], fill=WOOD); d.line([13, 0, 13, 16], fill=WOOD_D)
    for (x, y) in ((11, 3), (12, 4), (11, 5), (12, 6)): d.point((x, y), fill=MARK)          # Lightning Clan mark
    stone(d, 3, 14, 11, 21); stone(d, 12, 14, 21, 21); stone(d, 7, 10, 16, 17)             # the cairn
    return im

def cairn():
    im, d = tile()
    d.ellipse([4, 19, 20, 23], fill=(0, 0, 0, 90))
    stone(d, 4, 14, 12, 21); stone(d, 12, 14, 20, 21); stone(d, 7, 8, 16, 15); stone(d, 9, 3, 14, 9)
    return im

def mould():                              # a lava-tree mould: a hollow where a tree burned away
    im, d = tile()
    d.ellipse([2, 5, 21, 21], fill=OUT); d.ellipse([3, 6, 20, 20], fill=ROCK)
    d.arc([3, 6, 20, 20], 200, 330, fill=RUST); d.arc([3, 6, 20, 20], 20, 150, fill=ROCK_D)
    d.ellipse([7, 10, 16, 17], fill=OUT); d.ellipse([8, 11, 15, 16], fill=(16, 14, 18, 255))
    for (x, y) in ((5, 9), (18, 12), (6, 17)): d.point((x, y), fill=ROCK_L)
    return im

def rubble(seed):                         # 'a'a clinker: sharp broken rock, too rough to walk over
    import random
    r = random.Random(seed); im, d = tile()
    for _ in range(16):
        x, y = r.randint(-2, 19), r.randint(0, 19); w, h = r.randint(4, 8), r.randint(3, 6)
        pts = [(x, y + h), (x + 1, y + 1), (x + w // 2, y), (x + w, y + 2), (x + w - 1, y + h)]
        d.polygon(pts, fill=OUT)
        d.polygon([(a + (1 if a < x + w // 2 else -1), b + (1 if b < y + h else -1)) for a, b in pts], fill=r.choice([ROCK, ROCK, ROCK_L]))
        d.point((x + w // 2, y + 1), fill=RUST); d.point((x + w // 2 - 1, y + 2), fill=ROCK_L)
    return im

def boulder():
    im, d = tile()
    d.ellipse([3, 17, 21, 23], fill=(0, 0, 0, 90))
    d.ellipse([3, 6, 21, 21], fill=OUT); d.ellipse([4, 7, 20, 20], fill=ROCK)
    d.chord([4, 7, 20, 20], 20, 160, fill=ROCK_D); d.ellipse([7, 9, 11, 12], fill=ROCK_L); d.point((15, 9), fill=RUST)
    return im

def lichen():
    import random
    r = random.Random(7); im, d = tile()
    for _ in range(14):
        x, y = r.randint(1, 22), r.randint(1, 22); d.point((x, y), fill=LICHEN)
        if r.random() < 0.4: d.point((x + 1, y), fill=LICHEN)
    return im

def crack(kind):                          # a still-warm crack: dark, with a faint glow in it
    im, d = tile()
    if kind == '-': pts = [(0, 12), (5, 11), (9, 13), (14, 11), (19, 13), (23, 12)]
    elif kind == '|': pts = [(12, 0), (11, 5), (13, 9), (11, 14), (13, 19), (12, 23)]
    elif kind == '\\': pts = [(0, 0), (5, 6), (8, 7), (13, 13), (17, 15), (23, 23)]
    else: pts = [(0, 23), (6, 18), (8, 15), (13, 11), (16, 7), (23, 0)]
    d.line(pts, fill=OUT, width=3); d.line(pts, fill=GLOW_D, width=1)
    for (x, y) in pts[1:-1:2]: d.point((x, y), fill=GLOW)
    return im

def tumulus():                            # a 2x2 dome where the crust pushed up; returns four tiles
    big = Image.new('RGBA', (S * 2, S * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(big)
    d.ellipse([3, 34, 45, 47], fill=(0, 0, 0, 90))
    d.ellipse([2, 6, 45, 44], fill=OUT); d.ellipse([3, 7, 44, 43], fill=ROCK)
    d.chord([3, 7, 44, 43], 10, 170, fill=ROCK_D)
    d.ellipse([9, 11, 22, 20], fill=ROCK_L)
    d.line([(14, 16), (20, 21), (26, 19), (31, 25), (36, 23)], fill=OUT, width=2)          # the split top
    d.point((22, 20), fill=RUST); d.point((30, 24), fill=RUST)
    return [big.crop((0, 0, S, S)), big.crop((S, 0, S * 2, S)), big.crop((0, S, S, S * 2)), big.crop((S, S, S * 2, S * 2))]

UP, BLOCK, WALK = 0x10, 0x0F, 0x00      # passability flags: drawn above / blocks / walkable
tum = tumulus()
LAYOUT = {
    1: (pole_top('-'), UP), 2: (pole_top('|'), UP), 3: (pole_top('\\'), UP), 4: (pole_top('/'), UP),
    5: (wire_tile('-'), UP), 6: (wire_tile('|'), UP), 7: (wire_tile('\\'), UP), 8: (wire_tile('/'), UP),
    9: (pole_base(), BLOCK), 10: (cairn(), BLOCK), 11: (mould(), BLOCK), 12: (rubble(1), BLOCK), 13: (rubble(2), BLOCK),
    14: (boulder(), BLOCK), 15: (lichen(), WALK),
    16: (crack('-'), WALK), 17: (crack('|'), WALK), 18: (crack('\\'), WALK), 19: (crack('/'), WALK),
    20: (tum[0], BLOCK), 21: (tum[1], BLOCK), 28: (tum[2], BLOCK), 29: (tum[3], BLOCK),
}

if __name__ == '__main__':
    sheet = Image.new('RGBA', (16 * S, 16 * S), (0, 0, 0, 0))
    for i, (im, _) in LAYOUT.items():
        col = (i // 128) * 8 + i % 8; row = (i % 128) // 8
        sheet.paste(im, (col * S, row * S))
    sheet.resize((16 * 48, 16 * 48), Image.NEAREST).save('Smoking Isle/img/tilesets/Lava-E.png')
    print('Lava-E.png:', len(LAYOUT), 'tiles')
