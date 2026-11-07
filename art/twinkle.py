# Run from the repository root:  python3 art/twinkle.py "Smoking Isle/img/characters"
# Draws !$Twinkle.png: a "look here" sparkle for things worth examining (the reflection on map 6).
# One character, laid out like Light.png's sparkles: facing down = big, left = medium, right = small,
# up = nothing. An event's movement route turns it through those to twinkle; its three frames alternate
# a + star and a slightly turned star when Stepping is on.
import sys, math
from PIL import Image, ImageDraw, ImageFilter
T = 48
SIZES = {0: 15, 1: 10, 2: 5, 3: 0}            # row -> star arm length (down, left, right, up)
CORE, GLOW = (255, 255, 240), (255, 236, 160)
def star(arm, turn):
    im = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    if arm == 0: return im
    cx, cy = T // 2, T // 2 - 2
    glow = Image.new('RGBA', (T, T), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    r = arm * 0.7; g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GLOW + (120,))
    glow = glow.filter(ImageFilter.GaussianBlur(arm / 4))
    im.alpha_composite(glow)
    d = ImageDraw.Draw(im)
    for k in range(4):                                     # four long arms
        a = math.radians(turn + 90 * k)
        tip = (cx + arm * math.cos(a), cy + arm * math.sin(a))
        side = math.radians(turn + 90 * k + 90); w = max(1.2, arm / 7)
        d.polygon([tip, (cx + w * math.cos(side), cy + w * math.sin(side)), (cx - w * math.cos(side), cy - w * math.sin(side))], fill=CORE + (255,))
    for k in range(4):                                     # four short diagonal glints
        a = math.radians(turn + 45 + 90 * k); s = arm * 0.35
        d.line([(cx, cy), (cx + s * math.cos(a), cy + s * math.sin(a))], fill=CORE + (200,), width=1)
    d.ellipse([cx - 1.5, cy - 1.5, cx + 1.5, cy + 1.5], fill=CORE + (255,))
    return im
sheet = Image.new('RGBA', (T * 3, T * 4), (0, 0, 0, 0))
for row, arm in SIZES.items():
    for f, turn in enumerate((0, 12, 0)):
        sheet.paste(star(arm, turn), (f * T, row * T))
sheet.save(sys.argv[1] + '/!$Twinkle.png')
