# Run from the repository root:  python3 art/lava_tiles.py
# Makes the Lava Country tileset sheets by recolouring the Exterior ones (the licence allows editing for the
# game): browns become basalt (lit edges a little rust, so levees keep their rims), greens become a duller,
# drier grass. Writes img/tilesets/Lava-A2.png, Lava-A4.png, Lava-A5.png.
import colorsys
from PIL import Image
T = 'Smoking Isle/img/tilesets/'
def basalt(r, g, b, a):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if a == 0: return (r, g, b, a)
    if 0.02 < h < 0.15 and s > 0.22:                       # browns and tans: lava rock
        v2 = 0.07 + v * 0.40                                 # darker, but keep the light/dark steps
        if v > 0.85 and s < 0.65: h2, s2 = 0.05, 0.30        # the brightest highlights (rims, speckles): a little rust
        elif v > 0.40: h2, s2 = 0.08, 0.10                   # the body of the rock: a near-neutral basalt grey
        else: h2, s2 = 0.70, 0.12                            # shadows: a faint cool blue-black
        r2, g2, b2 = colorsys.hsv_to_rgb(h2, s2, v2)
        return (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    if 0.18 < h < 0.45 and s > 0.25:                       # greens: dry grass of the kipuka
        r2, g2, b2 = colorsys.hsv_to_rgb(0.22 + (h - 0.30) * 0.4, s * 0.62, v * 0.80)
        return (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return (r, g, b, a)
for name in ('A2', 'A4', 'A5'):
    im = Image.open(T + 'Ext-' + name + '.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            px[x, y] = basalt(*px[x, y])
    im.save(T + 'Lava-' + name + '.png')
    print('Lava-' + name, im.size)
