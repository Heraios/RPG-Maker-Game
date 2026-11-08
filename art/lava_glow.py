# Run from the repository root:  python3 art/lava_glow.py "Smoking Isle/img/characters"
# Draws !$LavaGlow.png: the warm light thrown by a lava pool (map 6: the two pools flanking Grave E).
# One character; its three frames flicker (brightness and size) when the event has Stepping on; the
# four facing rows are copies. The glow's centre sits 144 px (3 tiles) above the bottom of the frame,
# so place the event 3 tiles below the middle of the pool (it hangs upward from its tile).
import sys
from PIL import Image, ImageDraw, ImageFilter
FW = FH = 336
CX, CY = FW // 2, FH - 144
COLOUR = (255, 120, 40)
def frame(strength, radius):
    a = Image.new('L', (FW, FH), 0); d = ImageDraw.Draw(a)
    for r, v in ((radius, 70), (radius * 0.66, 120), (radius * 0.36, 175)):
        d.ellipse([CX - r, CY - r * 0.85, CX + r, CY + r * 0.85], fill=int(v * strength))
    a = a.filter(ImageFilter.GaussianBlur(radius / 3.2))
    img = Image.new('RGBA', (FW, FH), COLOUR + (0,)); img.putalpha(a)
    return img
frames = [frame(0.85, 118), frame(1.0, 126), frame(0.92, 121)]
sheet = Image.new('RGBA', (FW * 3, FH * 4), (0, 0, 0, 0))
for row in range(4):
    for f in range(3): sheet.paste(frames[f], (f * FW, row * FH))
sheet.save(sys.argv[1] + '/!$LavaGlow.png')
