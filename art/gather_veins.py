# Run from the repository root:  python3 art/gather_veins.py
# Draws two character sheets of gathering spots that sit ON WALL TILES (cliff faces, tube walls): blocky clusters of
# mineral set into the rock, in the angular style of game ore blocks, on a transparent background so the wall shows.
#   img/characters/!Veins_Stone.png   stone for knapping
#   img/characters/!Veins_Ore.png     ore and other wall finds
# Each sheet holds 8 spots (RPG Maker's 8-character sheet). Every spot has 4 rows (the event's direction):
#   down  = full          left = chipped (taken today)          right = worked out          up = full (spare)
# and 3 columns: the middle one is plain; the outer two carry a glint (turn Stepping on and it twinkles).
# SI_Gather turns the event to the right row by itself (any graphic whose name starts with "!Veins").
# Drawn on a 16 x 16 grid and scaled 3x to 48 x 48, so every pixel is a hard square. The ore sits in a patch of
# plain speckled stone, set into the wall, so dark ores (coal, lodestone) still show on dark cliffs.
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

def draw_cluster(im, px, pal):
    dark, base, light = pal
    ring = {(x + dx, y + dy) for (x, y) in px for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - px
    for (x, y) in ring:                                 # the stone around the ore: pale above / left, shadow below / right
        below_right = any((x - dx, y - dy) in px for (dx, dy) in [(1, 0), (0, 1), (1, 1)])
        put(im, x, y, (52, 48, 52) if below_right and not any((x + dx, y + dy) in px for (dx, dy) in [(1, 0), (0, 1)]) else (150, 144, 138))
    for (x, y) in px:
        lit = (x - 1, y) not in px or (x, y - 1) not in px
        dim = (x + 1, y) not in px or (x, y + 1) not in px
        put(im, x, y, light if lit and not dim else dark if dim and not lit else base)

def socket(im, x, y, w, h):                             # an empty hole where a cluster came out
    for i in range(w):
        for j in range(h): put(im, x + i, y + j, (14, 12, 18))
    for i in range(w): put(im, x + i, y + h, (160, 154, 148))            # the hole's lower lip catches the light
    for j in range(h): put(im, x + w, y + j, (150, 144, 138))
    for i in range(w): put(im, x + i, y - 1, (60, 56, 58))               # and its upper edge is in shadow

def stone_patch(im, name):
    """A patch of plain speckled stone, set into the wall: the ore sits in it (like an ore block)."""
    r = random.Random(SEED[name] + 1)
    inside = set()
    for y in range(1, N - 1):
        for x in range(1, N - 1):
            dx, dy = (x - 7.5) / 7.0, (y - 7.5) / 6.6
            if dx * dx + dy * dy <= 1.0 + r.uniform(-0.12, 0.1) and not (x in (1, N - 2) and y in (1, N - 2)):
                inside.add((x, y))
    for (x, y) in inside:
        g = r.choice([112, 118, 124, 124, 130, 138])
        put(im, x, y, (g, g - 4, g - 8))
    for (x, y) in inside:                                # dark edge: the patch is set into the cliff
        for (dx, dy) in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
            if (x + dx, y + dy) not in inside:
                put(im, x, y, (58, 54, 56) if (dx, dy) in [(1, 0), (0, 1)] else (150, 144, 138))
    return inside

def frame(name, state, glint):
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    cl = clusters(name)
    stone_patch(im, name)
    if state == 'worked':
        for (px, _) in cl[:5]:
            x = min(p[0] for p in px); y = min(p[1] for p in px)
            socket(im, x, y, 2, 2)
        return im
    keep = cl if state == 'full' else cl[::2]
    for (px, pal) in keep: draw_cluster(im, px, PAL[name][pal])
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

if __name__ == '__main__':
    sheet(STONE, 'Smoking Isle/img/characters/!Veins_Stone.png')
    sheet(ORE, 'Smoking Isle/img/characters/!Veins_Ore.png')
    print('!Veins_Stone:', ', '.join(STONE)); print('!Veins_Ore:', ', '.join(ORE))
