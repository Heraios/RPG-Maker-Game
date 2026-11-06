# Run from the repository root:  python3 art/skylight.py "Smoking Isle/img/characters"
# Draws !$Skylight*.png: a slanted shaft of light falling onto a pool of light.
# One sprite sheet = 3 columns x 4 rows of identical-size frames (RPG Maker's "$" sheet).
# Columns differ slightly (the rays shimmer if the event has Stepping on); rows are copies.
import sys, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops
FW, FH = 576, 672            # one frame: 12 tiles wide, 14 tall
POOL_CX, POOL_CY = FW//2, FH - 192   # pool centre: 4 tiles above the bottom of the event tile
def frame(colour, strength, width, seed):
    a = Image.new('L', (FW, FH), 0); d = ImageDraw.Draw(a)
    slant = 70                                    # the top of the shaft leans right (sun from the upper right)
    top_l, top_r = POOL_CX - width//2 + slant, POOL_CX + width//2 + slant
    d.polygon([(top_l, 0), (top_r, 0), (POOL_CX + width//2 + 10, POOL_CY), (POOL_CX - width//2 - 10, POOL_CY)], fill=int(95*strength))
    # brighter rays inside the shaft
    rnd = random.Random(seed)
    for i in range(5):
        off = rnd.uniform(-0.38, 0.38) * width; w = rnd.uniform(8, 22)
        x0, x1 = POOL_CX + off + slant, POOL_CX + off
        d.polygon([(x0 - w, 0), (x0 + w, 0), (x1 + w*1.3, POOL_CY), (x1 - w*1.3, POOL_CY)], fill=int(rnd.uniform(120, 160)*strength))
    # the pool of light on the ground
    rx, ry = width*0.85, width*0.6
    d.ellipse([POOL_CX-rx, POOL_CY-ry, POOL_CX+rx, POOL_CY+ry], fill=int(150*strength))
    d.ellipse([POOL_CX-rx*0.6, POOL_CY-ry*0.6, POOL_CX+rx*0.6, POOL_CY+ry*0.6], fill=int(185*strength))
    a = a.filter(ImageFilter.GaussianBlur(22))
    # fade the top so the shaft has no hard edge when the camera sits above it
    fade = Image.linear_gradient('L').resize((FW, FH)); fade = fade.point(lambda v: min(255, int(v*3.2)))
    a = ImageChops.multiply(a, fade)
    img = Image.new('RGBA', (FW, FH), colour + (0,)); img.putalpha(a)
    # a few dust motes in the shaft
    dd = ImageDraw.Draw(img)
    for i in range(10):
        t = rnd.uniform(0.25, 0.95); y = int(t*POOL_CY)
        x = int(POOL_CX + slant*(1-t) + rnd.uniform(-0.35, 0.35)*width)
        dd.rectangle([x, y, x+2, y+2], fill=tuple(min(255, c+30) for c in colour) + (int(200*strength),))
    return img
def sheet(name, colour, strength, width):
    s = Image.new('RGBA', (FW*3, FH*4), (0,0,0,0))
    frames = [frame(colour, strength, width, seed) for seed in (1, 2, 3)]
    for r in range(4):
        for c in range(3): s.paste(frames[c], (c*FW, r*FH))
    s.save(sys.argv[1] + '/' + name)
sheet('!$Skylight.png',       (255, 238, 175), 1.0, 230)   # day: warm gold
sheet('!$Skylight_Dusk.png',  (255, 170, 100), 0.85, 210)  # dusk: orange, a little weaker
sheet('!$Skylight_Night.png', (150, 185, 255), 0.75, 180)  # night: a thin blue moonbeam
