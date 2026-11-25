# Run from the repository root (after art/gather_veins.py):  python3 art/veins_reference.py [vein_rules.json]
# Draws docs/reference/veins.png: which vein is which, for the editor and the manual. The rules (what each gives, who,
# with what, how often) come from a JSON dump of SI_Gather's table and rules; without one, the built-in copy is used.
import json, os, sys, importlib.util
from PIL import Image, ImageDraw, ImageFont

spec = importlib.util.spec_from_file_location('gv', 'art/gather_veins.py'); gv = importlib.util.module_from_spec(spec); spec.loader.exec_module(gv)
RULES = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else json.load(open('art/vein_rules.json'))
FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
INK, MUTED, LINE, PAPER = (34, 32, 36), (104, 98, 96), (214, 208, 198), (250, 247, 240)

TOOL = {'kit': 'Knapping Kit (carried)', 'pick': 'a Pick (equipped)', 'stick': 'Digging Stick (carried)', None: 'by hand'}
WHO = {'adult': 'adults', None: 'anyone'}
def rule_text(r):
    if r['always']: return 'never runs out'
    if r['hauls']:
        end = 'then worked out (sockets)'
        return '%d hauls, one a day,\n%s' % (r['hauls'], end)
    return 'back in %d day%s' % (r['regrow'], '' if r['regrow'] == 1 else 's')

def cells(sheet, slot, wall):
    s = Image.open('Smoking Isle/img/characters/%s' % sheet).convert('RGBA')
    bx, by = (slot % 4) * 144, (slot // 4) * 192
    out = []
    for row in range(3):
        c = wall.copy(); c.alpha_composite(s.crop((bx + 48, by + row * 48, bx + 96, by + row * 48 + 48))); out.append(c)
    return out

W = 1180
rows = [('Stone', i, n) for i, n in enumerate(gv.STONE)] + [('Ore', i, n) for i, n in enumerate(gv.ORE)]
H = 250 + 64 * len(rows) + 60
im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
d.text((24, 18), 'Veins on walls: which is which', font=FT, fill=INK)
d.text((24, 54), 'Gathering spots that sit ON a wall tile (a cliff face, a cave wall). Event: the vein graphic, Priority "Same as characters",', font=F, fill=MUTED)
d.text((24, 74), 'Trigger "Action Button", Note <Gather: Name>, one command: Call Common Event "Gather". The spot shows its own state.', font=F, fill=MUTED)

# the four sets, one per tileset
d.text((24, 108), 'One set per tileset (same slots in each):', font=FB, fill=INK)
x = 24
for v, label in [('Exterior', 'Exterior'), ('Interior', 'Interior'), ('Lava', 'Lava Country'), ('Tubes', 'Lava Tubes')]:
    wall = gv.wall_tile(*gv.VARIANTS[v]).convert('RGBA')
    c = cells('!Veins_Ore_%s.png' % v, 0, wall)[0]
    im.paste(c, (x, 134)); d.text((x + 56, 136), label, font=FB, fill=INK)
    d.text((x + 56, 156), '!Veins_Stone_%s' % v, font=FS, fill=MUTED); d.text((x + 56, 171), '!Veins_Ore_%s' % v, font=FS, fill=MUTED)
    x += 285
d.text((24, 196), 'Each spot has three looks (the event turns itself):   Full  ·  Chipped (taken today)  ·  Worked out.'
                  '   Turn on Stepping and it twinkles.', font=F, fill=MUTED)

# the table
y0 = 228
cols = [(24, 'Sheet, slot'), (346, 'Note tag'), (566, 'Gives'), (776, 'Who, with what'), (966, 'Comes back')]
for cx, t in cols: d.text((cx, y0), t, font=FB, fill=INK)
for k, t in enumerate(['Full', 'Chipped', 'Worked out']): d.text((150 + k * 62, y0 + 3), t, font=FS, fill=INK)
d.line([(24, y0 + 22), (W - 24, y0 + 22)], fill=INK, width=1)
wall = gv.wall_tile(*gv.VARIANTS['Lava']).convert('RGBA')
y = y0 + 32
for sheet, slot, name in rows:
    r = RULES[name]
    if slot == 0 and sheet == 'Ore':
        d.line([(24, y - 6), (W - 24, y - 6)], fill=INK, width=1)
    d.text((24, y + 6), '%s %d' % (sheet, slot + 1), font=FB, fill=INK)
    d.text((24, y + 26), ('top' if slot < 4 else 'bottom') + ' row, %s' % ['1st', '2nd', '3rd', '4th'][slot % 4], font=FS, fill=MUTED)
    for k, c in enumerate(cells('!Veins_%s_Lava.png' % sheet, slot, wall)): im.paste(c, (150 + k * 62, y + 2))
    d.text((346, y + 6), name, font=FB, fill=INK); d.text((346, y + 26), '<Gather: %s>' % name, font=FS, fill=MUTED)
    gives = r['gives'] + (' (%d%%)' % r['chance'] if r.get('chance') else '')
    d.text((566, y + 6), gives, font=F, fill=INK); d.text((566, y + 26), r['kind'] + ': "' + r['verb'] + '"', font=FS, fill=MUTED)
    d.text((776, y + 6), WHO.get(r.get('who'), r.get('who')), font=F, fill=INK); d.text((776, y + 26), TOOL.get(r.get('tool'), r.get('tool')), font=FS, fill=MUTED)
    d.multiline_text((966, y + 6), rule_text(r), font=FS, fill=INK, spacing=5)
    d.line([(24, y + 58), (W - 24, y + 58)], fill=LINE)
    y += 64
d.text((24, y + 10), 'Drawn by art/gather_veins.py (the sheets) and art/veins_reference.py (this page). Rules from SI_Gather.js.', font=FS, fill=MUTED)
os.makedirs('docs/reference', exist_ok=True)
im.save('docs/reference/veins.png'); print('docs/reference/veins.png', im.size)
