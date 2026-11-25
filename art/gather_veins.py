# Run from the repository root:  python3 art/gather_veins.py
# Draws two character sheets of gathering spots that sit ON WALL TILES (cliff faces, tube walls): blocky clusters of
# mineral set into the rock, in the angular style of game ore blocks, on a transparent background so the wall shows.
#   img/characters/!Veins_Stone_<set>.png   stone for knapping
#   img/characters/!Veins_Ore_<set>.png     ore and other wall finds
# with one set per tileset (Exterior, Interior, Lava = Lava Country, Tubes = Lava Tubes): the rock around the ore is
# coloured from that tileset's main rock wall, so it looks set into it.
# Each sheet holds 8 spots (RPG Maker's 8-character sheet). Every spot has 4 rows (the event's direction):
#   down  = full          left = chipped (taken today)          right = worked out          up = full (spare)
# and 3 columns: the middle one is plain; the outer two carry a glint (turn Stepping on and it twinkles).
# SI_Gather turns the event to the right row by itself (any graphic whose name starts with "!Veins").
# Drawn on a 16 x 16 grid and scaled 3x to 48 x 48, so every pixel is a hard square: chunky ore blobs with a pale
# rim above and a shadow below, straight on the wall (no stone patch: the wall itself is the rock).
import random
from PIL import Image

N = 16
STONE = ['Obsidian', 'Chalcedony', 'Jasper', 'Basalt', 'Andesite', 'Olivine', 'Trachyte Cliff', 'Snowline Quartz']
ORE = ['Copper Vein', 'Lead Vein', 'Lodestone', 'Coal Seam', 'Sulfur Vent', 'Moonmilk', 'Ochre', 'White Clay']
SHADOW = (12, 10, 16, 170)

# (dark, base, light) per spot; a second palette is mixed in for a few (opal in trachyte, azurite in copper).
PAL = {
    'Obsidian':        [((18, 14, 30), (46, 36, 72), (150, 140, 220))],
    'Chalcedony':      [((84, 112, 140), (156, 192, 218), (236, 246, 252))],
    'Jasper':          [((104, 28, 22), (176, 56, 38), (232, 122, 84))],
    'Basalt':          [((34, 32, 38), (76, 72, 82), (128, 124, 136))],
    'Andesite':        [((112, 78, 80), (176, 132, 128), (244, 232, 226))],
    'Olivine':         [((54, 92, 18), (116, 176, 38), (204, 238, 112))],
    'Trachyte Cliff':  [((146, 126, 96), (204, 188, 152), (240, 230, 204)), ((190, 64, 26), (246, 136, 54), (255, 222, 140))],
    'Snowline Quartz': [((140, 156, 182), (218, 230, 246), (255, 255, 255))],
    'Copper Vein':     [((26, 104, 74), (56, 178, 126), (150, 240, 192)), ((34, 50, 150), (60, 96, 210), (150, 184, 252))],
    'Lead Vein':       [((84, 90, 104), (156, 164, 180), (238, 242, 250))],
    'Lodestone':       [((24, 18, 18), (66, 54, 52), (156, 146, 142))],
    'Coal Seam':       [((8, 8, 10), (32, 30, 36), (86, 86, 100))],
    'Sulfur Vent':     [((150, 120, 16), (230, 204, 46), (255, 246, 150))],
    'Moonmilk':        [((172, 168, 158), (230, 226, 216), (255, 255, 250))],
    'Ochre':           [((114, 40, 18), (178, 78, 34), (226, 132, 72))],
    'White Clay':      [((166, 160, 148), (220, 214, 202), (250, 246, 238))],
}
SEED = {name: i * 7 + 3 for i, name in enumerate(STONE + ORE)}

BLOBS = [   # chunky ore blobs, 4-6 pixels
    [(0, 0), (1, 0), (0, 1), (1, 1), (2, 1)],
    [(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)],
    [(0, 0), (1, 0), (2, 0), (1, 1), (2, 1)],
    [(0, 0), (1, 0), (0, 1), (1, 1)],
    [(0, 0), (1, 0), (1, 1), (2, 1), (1, 2), (2, 2)],
    [(1, 0), (2, 0), (0, 1), (1, 1), (2, 1)],
]
def clusters(name):
    """The spot's ore clusters: chunky blobs spread over the tile (fixed per spot)."""
    r = random.Random(SEED[name]); out = []
    cells = [(2, 2), (9, 1), (6, 6), (12, 6), (2, 10), (8, 11), (12, 12)]
    r.shuffle(cells)
    for k, (cx, cy) in enumerate(cells[:6]):
        blob = r.choice(BLOBS)
        px = {(cx + x, cy + y) for (x, y) in blob if 1 <= cx + x <= N - 2 and 1 <= cy + y <= N - 2}
        out.append((px, k % len(PAL[name])))
    return out

def put(im, x, y, c):
    if 0 <= x < N and 0 <= y < N: im.putpixel((x, y), c if len(c) == 4 else c + (255,))

# The rock around the ore takes its colours from the wall it sits on (set per tileset by main()).
RIM = {'light': (132, 126, 120), 'shadow': (40, 36, 40), 'socket': (160, 154, 148), 'socket_dark': (60, 56, 58)}
BRIGHT_RIM = {'Obsidian', 'Coal Seam', 'Lodestone'}      # dark ores: a brighter lip, so they show on dark walls
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def draw_cluster(im, px, pal, bright=False):
    dark, base, light = pal
    lip = mix(RIM['light'], (255, 255, 255), 0.45) + (255,) if bright else RIM['light'] + (235,)
    ring = {(x + dx, y + dy) for (x, y) in px for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - px
    for (x, y) in ring:                                 # the rock around the ore: pale above / left, shadow below / right
        below_right = any((x - dx, y - dy) in px for (dx, dy) in [(1, 0), (0, 1), (1, 1)])
        put(im, x, y, RIM['shadow'] + (235,) if below_right and not any((x + dx, y + dy) in px for (dx, dy) in [(1, 0), (0, 1)]) else lip)
    for (x, y) in px:
        lit = (x - 1, y) not in px or (x, y - 1) not in px
        dim = (x + 1, y) not in px or (x, y + 1) not in px
        put(im, x, y, light if lit and not dim else dark if dim and not lit else base)

def socket(im, x, y, w, h):                             # an empty hole where a cluster came out
    for i in range(w):
        for j in range(h): put(im, x + i, y + j, (14, 12, 18))
    for i in range(w): put(im, x + i, y + h, RIM['socket'])              # the hole's lower lip catches the light
    for j in range(h): put(im, x + w, y + j, RIM['socket'])
    for i in range(w): put(im, x + i, y - 1, RIM['socket_dark'])         # and its upper edge is in shadow

def frame(name, state, glint):
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    cl = clusters(name)
    if state == 'worked':
        for (px, _) in cl[:5]:
            x = min(p[0] for p in px); y = min(p[1] for p in px)
            socket(im, x, y, 3, 2)
        return im
    keep = cl if state == 'full' else cl[::2]
    for (px, pal) in keep: draw_cluster(im, px, PAL[name][pal], name in BRIGHT_RIM)
    if state == 'chipped':                              # pale fresh scars and a socket where chunks came out
        for (px, _) in cl[1::2][:2]:
            x = min(p[0] for p in px); y = min(p[1] for p in px)
            socket(im, x, y, 2, 1)
            put(im, x + 2, y, (214, 206, 198, 230))
    if glint:
        px = sorted(cl[0 if glint == 1 else 1][0]); x, y = px[0]
        put(im, x, y, (255, 255, 255, 255))
        for (dx, dy) in [(-1, 0), (0, -1)]: put(im, x + dx, y + dy, (255, 255, 240, 160))
    return im

def sheet(names, path):
    out = Image.new('RGBA', (N * 12, N * 8), (0, 0, 0, 0))
    for ci, name in enumerate(names):
        bx, by = (ci % 4) * 3 * N, (ci // 4) * 4 * N
        for row, state in enumerate(['full', 'chipped', 'worked', 'full']):      # down, left, right, up
            for c, g in enumerate([1, 0, 2]):
                out.paste(frame(name, state, g if state != 'worked' else 0), (bx + c * N, by + row * N))
    out.resize((N * 36, N * 24), Image.NEAREST).save(path)

# One set per tileset, each with the rim coloured from that tileset's main rock wall (A4 sheet, wall kind).
VARIANTS = {
    'Exterior':     ('Ext-A4', 120),
    'Interior':     ('Int-A4', 123),
    'Lava':         ('Lava-A4', 120),          # Lava Country
    'Tubes':        ('Lava-Int-A4', 123),      # Lava Tubes
}
def wall_tile(sheet_name, kind):
    ys = [0, 144, 240, 384, 480, 624]
    k = kind - 80; c, r = k % 8, k // 8
    im = Image.open('Smoking Isle/img/tilesets/%s.png' % sheet_name).convert('RGB')
    return im.crop((c * 96 + 24, ys[r] + 24, c * 96 + 72, ys[r] + 72))
def rim_from(tile):
    px = sorted((c for c in tile.get_flattened_data() if sum(c) > 90), key=lambda c: sum(c))   # skip the black outlines
    n = len(px); top = px[int(n * 0.85):]; low = px[:int(n * 0.12)]
    avg = lambda cs: tuple(sum(c[i] for c in cs) // len(cs) for i in range(3))
    light, shadow = avg(top), avg(low)
    return {'light': mix(light, (255, 255, 255), 0.4), 'shadow': tuple(int(v * 0.55) for v in shadow),
            'socket': mix(light, (255, 255, 255), 0.6), 'socket_dark': tuple(int(v * 0.45) for v in shadow)}

if __name__ == '__main__':
    for v, (sheet_name, kind) in VARIANTS.items():
        RIM.update(rim_from(wall_tile(sheet_name, kind)))
        sheet(STONE, 'Smoking Isle/img/characters/!Veins_Stone_%s.png' % v)
        sheet(ORE, 'Smoking Isle/img/characters/!Veins_Ore_%s.png' % v)
        print(v, RIM)
    print('!Veins_Stone_*:', ', '.join(STONE)); print('!Veins_Ore_*:', ', '.join(ORE))
