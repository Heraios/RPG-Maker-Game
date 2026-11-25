# Run from the repository root:  python3 art/lava_battlebacks.py
# Battle backgrounds for the lava country, recoloured from the pixel-art battlebacks (the licence allows edits):
# every warm colour (the stock volcano's reds and oranges, the desert's sand) becomes basalt by its brightness,
# the brightest highlights a faint rust; sky and greens stay.
#   battlebacks1/LavaCountry      the ground                     (from volcano)
#   battlebacks2/LavaRidges       lava walls and spires           (from volcano)
#   battlebacks2/LavaSky          open sky over black ridges      (from Desert)
#   battlebacks2/LavaTubeMouth    a dark rock wall, a tube mouth  (from cave)
import colorsys
from PIL import Image
B = 'Smoking Isle/img/'
def basalt(r, g, b, a, far=False):
    if a == 0: return (r, g, b, a)
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if (h < 0.19 or h > 0.93) and s > 0.18:                  # reds, oranges, sand: lava rock
        v2 = (0.03 + (v ** 3) * 0.30) if far else (0.03 + (v ** 1.8) * 0.52)   # far hills: near-black silhouettes
        if v > 0.97 and s < 0.5 and not far: h2, s2 = 0.05, 0.30                  # only the brightest specks: a little rust
        elif v > 0.45: h2, s2 = 0.08, 0.09                             # the body: near-neutral basalt grey
        else: h2, s2 = 0.68, 0.14                                      # shadows: cool blue-black
        r2, g2, b2 = colorsys.hsv_to_rgb(h2, s2, v2)
        return (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return (r, g, b, a)
def recolour(src, dst, far=False):
    im = Image.open(B + src + '.png').convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width): px[x, y] = basalt(*px[x, y], far=far)
    im.save(B + dst + '.png'); print(dst, im.size)
recolour('battlebacks1/volcano', 'battlebacks1/LavaCountry')
recolour('battlebacks2/volcano', 'battlebacks2/LavaRidges')
recolour('battlebacks2/Desert', 'battlebacks2/LavaSky', far=True)
recolour('battlebacks2/cave', 'battlebacks2/LavaTubeMouth')
