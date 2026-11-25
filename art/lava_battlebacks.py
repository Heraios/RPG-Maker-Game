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

# ---- dusk and night skies for the backdrops with sky (SI_Time swaps them in: "Sky Battlebacks") -------------------
# The land is kept; everything above the horizon (blue sky, clouds, the sun) is repainted in pixel bands. The screen
# tint for the time of day still goes over the battle as usual.
import random
def is_sky(r, g, b, y, h):
    hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return (0.45 < hh < 0.70 and s > 0.15 and v > 0.55) or (s < 0.12 and v > 0.85 and y < h * 0.5)
def sky_version(src, dst, period):
    im = Image.open(B + src + '.png').convert('RGBA'); px = im.load(); W, H = im.size; rnd = random.Random(7)
    horizon = []
    for x in range(W):                                  # the land starts where 8 pixels in a row aren't sky
        y = 0                                           # (so the old sun's thin outline doesn't stop it)
        while y < H and not all(not is_sky(*px[x, yy][:3], yy, H) for yy in range(y, min(H, y + 8))): y += 1
        horizon.append(y)
    top_h = max(horizon)
    if period == 'night': stops = [(10, 12, 34), (18, 24, 58), (32, 42, 86), (48, 58, 104)]
    else: stops = [(70, 46, 102), (150, 70, 96), (222, 112, 74), (246, 168, 86)]      # dusk: violet down to orange
    for x in range(W):
        for y in range(horizon[x]):
            t = y / max(1, top_h); band = min(len(stops) - 1, int(t * len(stops)))
            px[x, y] = stops[band] + (255,)
    if period == 'night':
        for _ in range(W * top_h // 260):                                    # stars
            x, y = rnd.randrange(W), rnd.randrange(max(1, top_h))
            if y < horizon[x] - 2:
                c = rnd.choice([(255, 255, 255), (220, 230, 255), (255, 240, 200)])
                px[x, y] = c + (255,)
                if rnd.random() < 0.15 and x + 1 < W: px[x + 1, y] = c + (255,)
        cx, cy, r = int(W * 0.8), int(top_h * 0.3), max(10, top_h // 6)      # the moon
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if 0 <= x < W and 0 <= y < horizon[x] and (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    shade = (232, 232, 214) if (x - cx + r // 3) ** 2 + (y - cy) ** 2 > (r * 0.55) ** 2 else (250, 250, 236)
                    px[x, y] = shade + (255,)
    else:
        cx, cy, r = int(W * 0.25), int(top_h * 0.85), max(12, top_h // 5)    # the low sun
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if 0 <= x < W and 0 <= y < horizon[x] and (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    px[x, y] = (255, 214, 120, 255)
        for (cx2, cy2, w2) in [(int(W * 0.55), int(top_h * 0.35), W // 6), (int(W * 0.85), int(top_h * 0.55), W // 8)]:   # long thin clouds
            for x in range(cx2 - w2, cx2 + w2):
                for dy in range(3):
                    y = cy2 + dy
                    if 0 <= x < W and y < horizon[x]: px[x, y] = ((120, 56, 82) if dy else (200, 110, 110)) + (255,)
    im.save(B + dst + '.png'); print(dst)
for src, name in (('battlebacks2/LavaSky', 'LavaSky'), ('battlebacks2/field', 'field')):
    sky_version(src, 'battlebacks2/%s_Dusk' % name, 'dusk')
    sky_version(src, 'battlebacks2/%s_Night' % name, 'night')
