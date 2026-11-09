# Run from the repository root:  python3 art/lava_tiles.py
# Makes the lava tilesets by recolouring the originals (the licence allows editing for the game): browns
# become basalt (the brightest highlights a little rust, shadows blue-black).
#   Lava Country (tileset 9, outdoors): Exterior A2/A4/A5 -> Lava-A2/A4/A5; greens become a drier olive.
#   Lava Tubes (tileset 10, inside): Interior A2/A4/A5 -> Lava-Int-A2/A4/A5; greens stay lush (skylight
#   gardens are watered and sheltered) and lava's bright oranges and reds are kept.
import colorsys
from PIL import Image
T = 'Smoking Isle/img/tilesets/'
def basalt(r, g, b, a, dry_grass=True, inside=False):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if a == 0: return (r, g, b, a)
    if inside and (h < 0.11 or h > 0.97) and s > 0.70 and v > 0.80:   # inside: lava and glowing things stay
        return (r, g, b, a)
    if inside and 0.11 <= h < 0.17 and s > 0.45 and v > 0.45:   # inside: glowing moss and gold patches stay
        return (r, g, b, a)
    if 0.02 < h < 0.15 and s > 0.22:                       # browns and tans: lava rock
        v2 = (0.20 + v * 0.48) if inside else (0.07 + v * 0.40)   # inside is lighter: the cave shade darkens it
        if v > 0.85 and s < 0.65: h2, s2 = 0.05, 0.30        # the brightest highlights (rims, speckles): a little rust
        elif v > 0.40: h2, s2 = 0.08, 0.10                   # the body of the rock: a near-neutral basalt grey
        else: h2, s2 = 0.70, 0.12                            # shadows: a faint cool blue-black
        r2, g2, b2 = colorsys.hsv_to_rgb(h2, s2, v2)
        return (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    if dry_grass and 0.18 < h < 0.45 and s > 0.25:         # greens: dry grass of the kipuka
        r2, g2, b2 = colorsys.hsv_to_rgb(0.22 + (h - 0.30) * 0.4, s * 0.62, v * 0.80)
        return (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return (r, g, b, a)
def recolour(src, dst, dry_grass):
    im = Image.open(T + src + '.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            px[x, y] = basalt(*px[x, y], dry_grass=dry_grass, inside=not dry_grass)
    im.save(T + dst + '.png')
    print(dst, im.size)
for name in ('A2', 'A4', 'A5'):
    recolour('Ext-' + name, 'Lava-' + name, True)        # Lava Country (outdoors)
    recolour('Int-' + name, 'Lava-Int-' + name, False)   # Lava Tubes (inside)
