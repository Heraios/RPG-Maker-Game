# Run from the repository root (after art/lava_e.py):  python3 art/telegraph_reference.py
# Draws docs/reference/telegraph.png: every telegraph piece on the Lava-E sheet, where it is in the editor's tab E,
# and two assembled examples (a line turning a corner, and one that branches).
import os
from PIL import Image, ImageDraw, ImageFont

T = 'Smoking Isle/img/tilesets/'
E = Image.open(T + 'Lava-E.png').convert('RGBA')
EXTB = Image.open(T + 'Ext-B.png').convert('RGBA')
A2 = Image.open(T + 'Lava-A2.png').convert('RGBA')
GROUND = A2.crop((24, 144 + 24 + 24, 72, 144 + 72 + 24))         # Lava-A2 kind 24 (basalt), an inner tile
def e_tile(i): return E.crop(((i // 128) * 8 * 48 + (i % 8) * 48, ((i % 128) // 8) * 48, (i // 128) * 8 * 48 + (i % 8) * 48 + 48, ((i % 128) // 8) * 48 + 48))
def b_tile(i): return EXTB.crop(((i // 128) * 8 * 48 + (i % 8) * 48, ((i % 128) // 8) * 48, (i // 128) * 8 * 48 + (i % 8) * 48 + 48, ((i % 128) // 8) * 48 + 48))
def where(i): return 'E %d · tab E, row %d, col %d' % (i, i // 8 + 1 if i < 128 else (i - 128) // 8 + 17, i % 8 + 1)

FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
INK, MUTED, PAPER = (34, 32, 36), (104, 98, 96), (250, 247, 240)

def scene(cells, w, h, scale=1):
    """cells: {(x, y): [B or E pieces]}, drawn over basalt. ('B', 76) / ('E', 9)."""
    im = Image.new('RGBA', (w * 48, h * 48))
    for y in range(h):
        for x in range(w): im.alpha_composite(GROUND, (x * 48, y * 48))
    for (x, y), pieces in cells.items():
        for kind, i in pieces: im.alpha_composite(b_tile(i) if kind == 'B' else e_tile(i), (x * 48, y * 48))
    return im.resize((w * 48 * scale, h * 48 * scale), Image.NEAREST)
def pole(cells, x, y, top, foot=9):
    cells.setdefault((x, y), []).extend([('B', 76), ('E', foot)]); cells.setdefault((x, y - 1), []).append(('E', top))

# Example 1: a line starts, runs north, turns the corner, runs east, ends.
c1 = {}
pole(c1, 1, 7, 76)                                       # start: wire leaves north
for y in (5,): c1.setdefault((1, y), []).append(('E', 6))
pole(c1, 1, 4, 74, foot=92)                              # corner S+E, its foot passed by the wire from the south
for x in (2, 3): c1.setdefault((x, 3), []).append(('E', 5))
pole(c1, 4, 4, 1)                                        # straight east-west
for x in (5, 6): c1.setdefault((x, 3), []).append(('E', 5))
pole(c1, 7, 4, 79)                                       # end: wire comes from the west
# Example 2: a branch (T), and a slant.
c2 = {}
for x in (0,): c2.setdefault((x, 3), []).append(('E', 5))
pole(c2, 1, 4, 1)
for x in (2,): c2.setdefault((x, 3), []).append(('E', 5))
pole(c2, 3, 4, 83, foot=92)                              # T: S+E+W, a branch line going south (past its own foot)
for x in (4, 5): c2.setdefault((x, 3), []).append(('E', 5))
pole(c2, 6, 4, 88)                                       # W + NE: from straight to a slant
c2.setdefault((7, 2), []).append(('E', 8))
c2.setdefault((3, 5), []).append(('E', 6))
pole(c2, 3, 7, 76)                                       # the branch ends (its wire leaves north)

TURN_NAMES = ['N+E', 'N+W', 'S+E', 'S+W', 'end N', 'end S', 'end E', 'end W', 'T N+S+E', 'T N+S+W', 'T N+E+W', 'T S+E+W',
              'S+NE', 'S+NW', 'N+SE', 'N+SW', 'W+NE', 'W+SE', 'E+NW', 'E+SW']
groups = [('Straight through (the wire runs across the pole)', [(1, '-'), (2, '|'), (3, '\\'), (4, '/')], [(32, '-'), (33, '|'), (34, '\\'), (35, '/')]),
          ('Wire between poles', [(5, '-'), (6, '|'), (7, '\\'), (8, '/'), (22, 'sag down'), (23, 'sag low'), (24, 'sag up')],
           [(36, '-'), (37, '|'), (38, '\\'), (39, '/'), (40, 'sag down'), (41, 'sag low'), (42, 'sag up')]),
          ('Pole foot (on top of the rock, Ext-B 76). Wired: where a north-south wire passes the foot', [(9, 'foot'), (92, 'wired')], [(116, 'wired')]),
          ('Turns, ends, branches, slants', [(72 + k, n) for k, n in enumerate(TURN_NAMES)], [(96 + k, n) for k, n in enumerate(TURN_NAMES)])]

COLW = 112
rows = sum((len(g[1]) + 7) // 8 * 2 for g in groups)
H = 140 + 8 * 48 * 2 + 40 + len(groups) * 40 + rows * 92 + 40
im = Image.new('RGB', (8 * COLW + 60, H), PAPER); d = ImageDraw.Draw(im)
d.text((24, 16), 'Telegraph lines: which piece is which', font=FT, fill=INK)
d.text((24, 52), 'Lava Country tileset, tab E. A pole = the rock (Ext-B 76), the foot on it (E 9, or E 92 on a north-south line), and a pole top', font=F, fill=MUTED)
d.text((24, 68), "in the tile above it (drawn above the player). The wire runs at the crossarm's height: pole tops and wire tiles share a row.", font=F, fill=MUTED)
d.text((24, 84), 'Copper (bare, verdigris) and rubber (coated) sets are the same shapes; the rubber ones are 24 tiles later (turns) or listed below.', font=F, fill=MUTED)
y = 112
d.text((24, y), 'Example 1: start, north, corner, east, end', font=FB, fill=INK)
d.text((24 + 8 * 48 + 40, y), 'Example 2: a branch (T), and a slant', font=FB, fill=INK)
y += 24
im.paste(scene(c1, 8, 8).convert('RGB'), (24, y)); im.paste(scene(c2, 8, 8).convert('RGB'), (24 + 8 * 48 + 40, y))
y += 8 * 48 + 24
for title, copper, rubber in groups:
    d.text((24, y), title, font=FB, fill=INK); y += 24
    for label, items in (('copper', copper), ('rubber', rubber)):
        for k, (i, name) in enumerate(items):
            if k and k % 8 == 0: y += 92
            x = 24 + (k % 8) * COLW
            cell = Image.new('RGBA', (48, 48)); cell.alpha_composite(GROUND); cell.alpha_composite(e_tile(i))
            im.paste(cell.convert('RGB'), (x, y)); d.text((x, y + 50), name, font=FB if len(name) < 9 else F, fill=INK)
            d.text((x, y + 68), 'E %d (%s)' % (i, label), font=F, fill=MUTED)
        y += 92
    y += 6
os.makedirs('docs/reference', exist_ok=True)
im.crop((0, 0, im.width, y + 10)).save('docs/reference/telegraph.png'); print('docs/reference/telegraph.png', im.size)
