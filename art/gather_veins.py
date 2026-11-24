# Run from the repository root:  python3 art/gather_veins.py
# Draws two character sheets of gathering spots that sit ON WALL TILES (cliff faces, tube walls): a seam of mineral
# set into the rock, on a transparent background so the wall shows through.
#   img/characters/!Veins_Stone.png   stone for knapping
#   img/characters/!Veins_Ore.png     ore and other wall finds
# Each sheet holds 8 spots (RPG Maker's 8-character sheet). Every spot has 4 rows (the event's direction):
#   down  = full          left = chipped (taken today)          right = worked out          up = full (spare)
# and 3 columns: the middle one is plain; the outer two carry a glint (turn Stepping on and it twinkles).
# SI_Gather turns the event to the right row by itself (any graphic whose name starts with "!Veins").
# Pixel art drawn at 24 x 24 and doubled to 48 x 48.
import random
from PIL import Image, ImageDraw

S = 24
CRACK = (10, 8, 14)
STONE = ['Obsidian', 'Chalcedony', 'Jasper', 'Basalt', 'Andesite', 'Olivine', 'Trachyte Cliff', 'Snowline Quartz']
ORE = ['Copper Vein', 'Lead Vein', 'Lodestone', 'Coal Seam', 'Sulfur Vent', 'Moonmilk', 'Ochre', 'White Clay']

def rgba(c, a=255): return tuple(c[:3]) + (a,)
def shade(c, k, a=255): return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (a,)

# A seam: a band across the tile, following a wavy centre line, with a dark crack on each side.
def band(y0, y1, amp, phase):
    import math
    return [(x, y0 + (y1 - y0) * x / (S - 1) + amp * math.sin(x / 3.0 + phase)) for x in range(S)]
def seam(d, line, width, col, hi=None, keep=1.0, rnd=None):
    for x, y in line:
        if rnd and rnd.random() > keep: continue
        top, bot = int(round(y - width / 2)), int(round(y + width / 2))
        d.line([(x, top - 1), (x, top - 1)], fill=rgba(CRACK, 210))          # crack above
        d.line([(x, top), (x, bot)], fill=rgba(col))
        if hi: d.point((x, top), fill=rgba(hi))
        d.point((x, bot + 1), fill=rgba(CRACK, 160))                         # shadow below
def nodule(d, x, y, r, col, hi=None):
    d.ellipse([x - r - 1, y - r - 1, x + r + 1, y + r + 1], fill=rgba(CRACK, 220))
    d.ellipse([x - r, y - r, x + r, y + r], fill=rgba(col))
    if hi: d.point((x - r // 2, y - r // 2), fill=rgba(hi)); d.point((x - r // 2 + 1, y - r // 2), fill=rgba(hi, 180))
def crystal(d, x, y, h, col, hi=(255, 255, 255)):
    d.polygon([(x - 2, y), (x + 2, y), (x, y - h)], fill=rgba(CRACK, 230))
    d.polygon([(x - 1, y - 1), (x + 1, y - 1), (x, y - h + 1)], fill=rgba(col))
    d.line([(x, y - h + 2), (x, y - 2)], fill=rgba(hi))
def joints(d, col):                      # basalt: a block outlined by column joints, loosened
    for (x0, y0, x1, y1) in [(3, 6, 11, 14), (12, 5, 20, 13), (6, 14, 15, 21)]:
        d.rectangle([x0, y0, x1, y1], outline=rgba(CRACK, 230))
        d.line([(x0 + 1, y0 + 1), (x1 - 1, y0 + 1)], fill=shade(col, 1.4))
def splash(d, pts, r, col, hi):           # soft wall coatings (moonmilk, ochre, clay, sulfur): blotches
    for (x, y, k) in pts:
        d.ellipse([x - r - k, y - r, x + r + k, y + r], fill=rgba(col, 235))
        d.point((x - 1, y - 1), fill=rgba(hi))

# Each spot: a function drawing its full look, given (d, rnd, amount) where amount 1.0 = full, 0.5 = chipped.
def obsidian(d, r, a):
    for (y0, y1, ph) in [(7, 11, 0), (14, 17, 2)][: 2 if a == 1 else 1]:
        seam(d, band(y0, y1, 1.2, ph), 3, (28, 24, 42), (200, 214, 250), a, r)
    for (x, y) in [(6, 9), (16, 16)][: 2 if a == 1 else 1]: d.point((x, y), fill=(240, 246, 255, 255))
def chalcedony(d, r, a):
    for (x, y, k) in [(6, 8, 2), (15, 7, 2), (10, 15, 3), (18, 17, 2)][: 4 if a == 1 else 2]: nodule(d, x, y, k, (150, 186, 214), (236, 246, 252))
def jasper(d, r, a):
    cols = [((186, 56, 40), (232, 120, 84)), ((206, 120, 52), (240, 176, 110)), ((150, 46, 36), None)]
    for i, (y0, y1, ph) in enumerate([(5, 8, 0), (10, 13, 1), (15, 18, 2)]):
        if a < 1 and i == 1: continue
        seam(d, band(y0, y1, 1.0, ph), 2, cols[i][0], cols[i][1], a, r)
def basalt(d, r, a):
    joints(d, (90, 86, 92))
    if a == 1: d.line([(4, 22), (20, 22)], fill=rgba(CRACK, 120))
def andesite(d, r, a):
    seam(d, band(8, 14, 1.5, 0.5), 7, (150, 144, 138), (196, 192, 186), 1.0 if a == 1 else 0.6, r)
    for (x, y) in [(4, 10), (9, 9), (13, 12), (18, 11), (7, 13), (16, 14)][: 6 if a == 1 else 3]: d.point((x, y), fill=(236, 232, 224, 255))
def olivine(d, r, a):
    for (x, y, k) in [(5, 8, 2), (11, 6, 1), (16, 9, 2), (8, 15, 2), (14, 16, 1), (19, 15, 2)][: 6 if a == 1 else 3]: nodule(d, x, y, k, (120, 184, 40), (214, 244, 130))
def trachyte(d, r, a):
    seam(d, band(9, 12, 0.8, 1), 5, (206, 190, 156), (232, 220, 192), 1.0, r)
    if a == 1: nodule(d, 12, 10, 2, (236, 110, 50), (255, 214, 120))
    nodule(d, 6, 11, 1, (230, 130, 70), (255, 220, 140))
def quartz(d, r, a):
    for (x, y, h) in [(7, 18, 9), (10, 19, 12), (13, 18, 8), (16, 19, 10)][: 4 if a == 1 else 2]: crystal(d, x, y, h, (220, 232, 246))
def copper(d, r, a):
    seam(d, band(7, 12, 1.4, 0), 3, (36, 170, 120), (130, 232, 182), a, r)
    if a == 1: seam(d, band(14, 18, 1.2, 2), 2, (40, 150, 110), None, 1.0, r)
    for (x, y) in [(8, 10), (17, 15)][: 2 if a == 1 else 1]: nodule(d, x, y, 1, (46, 96, 210), (140, 180, 250))
def lead(d, r, a):
    seam(d, band(9, 13, 1, 1), 2, (120, 128, 140), None, 1.0, r)
    for (x, y) in [(5, 10), (11, 11), (17, 12), (8, 16)][: 4 if a == 1 else 2]:
        d.rectangle([x - 2, y - 2, x + 1, y + 1], fill=rgba(CRACK, 220)); d.rectangle([x - 1, y - 1, x, y], fill=(200, 208, 222, 255)); d.point((x - 1, y - 1), fill=(250, 252, 255, 255))
def lodestone(d, r, a):
    nodule(d, 12, 12, 5 if a == 1 else 3, (52, 42, 40), (110, 96, 92))
    for (x, y, dx, dy) in [(6, 8, -2, -2), (18, 8, 2, -2), (5, 15, -2, 1), (19, 15, 2, 1), (12, 5, 0, -2)][: 5 if a == 1 else 2]:
        d.line([(x, y), (x + dx, y + dy)], fill=(176, 166, 160, 255))       # iron filings standing on end
def coal(d, r, a):
    for (y0, y1, ph) in [(6, 9, 0), (13, 16, 1.5)][: 2 if a == 1 else 1]:
        seam(d, band(y0, y1, 0.6, ph), 3, (18, 16, 22), (96, 96, 116), a, r)
def sulfur(d, r, a):
    splash(d, [(6, 10, 1), (13, 8, 2), (17, 14, 1), (9, 16, 1)][: 4 if a == 1 else 2], 2, (232, 210, 56), (255, 246, 160))
    d.line([(4, 13), (11, 12), (19, 18)], fill=rgba(CRACK, 220))
def moonmilk(d, r, a):
    splash(d, [(7, 8, 2), (14, 7, 1), (11, 13, 3), (17, 16, 1), (6, 17, 1)][: 5 if a == 1 else 2], 2, (236, 232, 220), (255, 255, 250))
def ochre(d, r, a):
    seam(d, band(8, 15, 1.6, 0.3), 6 if a == 1 else 3, (170, 66, 34), (214, 110, 60), 1.0, r)
def white_clay(d, r, a):
    seam(d, band(9, 14, 1.2, 1.1), 6 if a == 1 else 3, (222, 216, 204), (246, 242, 232), 1.0, r)

DRAW = {'Obsidian': obsidian, 'Chalcedony': chalcedony, 'Jasper': jasper, 'Basalt': basalt, 'Andesite': andesite,
        'Olivine': olivine, 'Trachyte Cliff': trachyte, 'Snowline Quartz': quartz, 'Copper Vein': copper, 'Lead Vein': lead,
        'Lodestone': lodestone, 'Coal Seam': coal, 'Sulfur Vent': sulfur, 'Moonmilk': moonmilk, 'Ochre': ochre, 'White Clay': white_clay}
GLINT = [(7, 8), (16, 14)]

def frame(name, state, glint):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); r = random.Random(7)
    if state == 'worked':                                  # worked out: empty sockets and pick scars in the rock
        for (x, y, w, h) in [(4, 7, 4, 3), (12, 9, 5, 4), (7, 15, 4, 3), (16, 16, 3, 3)]:
            d.ellipse([x - 1, y - 1, x + w + 1, y + h + 1], fill=(150, 144, 140, 110))
            d.ellipse([x, y, x + w, y + h], fill=rgba(CRACK, 235))
        return im
    DRAW[name](d, r, 1.0 if state == 'full' else 0.5)
    if state == 'chipped':                                 # fresh pale scars where pieces came out
        for (x, y) in [(13, 4), (4, 15), (18, 19)]:
            d.polygon([(x, y), (x + 3, y), (x + 1, y + 2)], fill=(206, 198, 190, 230))
            d.line([(x, y + 3), (x + 2, y + 3)], fill=rgba(CRACK, 200))
    if glint:
        gx, gy = GLINT[glint - 1]
        for (dx, dy) in [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]:
            d.point((gx + dx, gy + dy), fill=(255, 255, 240, 255 if (dx, dy) == (0, 0) else 170))
    return im

def sheet(names, path):
    out = Image.new('RGBA', (S * 12, S * 8), (0, 0, 0, 0))
    for ci, name in enumerate(names):
        bx, by = (ci % 4) * 3 * S, (ci // 4) * 4 * S
        for row, state in enumerate(['full', 'chipped', 'worked', 'full']):      # down, left, right, up
            for c, g in enumerate([1, 0, 2]):
                out.paste(frame(name, state, g if state != 'worked' else 0), (bx + c * S, by + row * S))
    out.resize((S * 24, S * 16), Image.NEAREST).save(path)

if __name__ == '__main__':
    sheet(STONE, 'Smoking Isle/img/characters/!Veins_Stone.png')
    sheet(ORE, 'Smoking Isle/img/characters/!Veins_Ore.png')
    print('!Veins_Stone:', ', '.join(STONE)); print('!Veins_Ore:', ', '.join(ORE))
