# Run from the repository root:  python3 art/memory_body.py "Smoking Isle/img/pictures"
# Draws Memory_Body.png, a PLACEHOLDER for Memory's "The Body" page (SI_Journal.js): nine 240x360 frames
# side by side. Frame 0 is the child's silhouette; frames 1-8 are drawn over it, one per ingredient, in the
# order of "body" in data/Journal.json: bone, framework, flesh, blood, heart, brain, silver, pearl.
import sys
from PIL import Image, ImageDraw, ImageFilter
W, H = 240, 360
def blank(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))
def silhouette(d, fill, outline=None, width=2):
    d.ellipse([88, 22, 152, 92], fill=fill, outline=outline, width=width)              # head
    d.rounded_rectangle([82, 98, 158, 210], 18, fill=fill, outline=outline, width=width)  # body
    d.rounded_rectangle([56, 104, 80, 200], 10, fill=fill, outline=outline, width=width)  # arms
    d.rounded_rectangle([160, 104, 184, 200], 10, fill=fill, outline=outline, width=width)
    d.rounded_rectangle([88, 212, 116, 330], 10, fill=fill, outline=outline, width=width)  # legs
    d.rounded_rectangle([124, 212, 152, 330], 10, fill=fill, outline=outline, width=width)
frames = []
f = blank(); silhouette(ImageDraw.Draw(f), (120, 140, 170, 40), (160, 180, 210, 160)); frames.append(f)
f = blank(); d = ImageDraw.Draw(f)                                                         # bone: in the left arm
d.line([68, 130, 68, 170], fill=(240, 236, 220, 255), width=5)
for y in (128, 172): d.ellipse([62, y - 5, 74, y + 5], fill=(240, 236, 220, 255))
frames.append(f)
f = blank(); d = ImageDraw.Draw(f); wood = (170, 70, 50, 230)                               # framework: the skeleton
for seg in ([120, 92, 120, 210], [92, 112, 148, 112], [68, 112, 68, 196], [172, 112, 172, 196],
            [100, 210, 140, 210], [102, 210, 102, 326], [138, 210, 138, 326]):
    d.line(seg, fill=wood, width=5)
for y in (130, 150, 170): d.line([100, y, 140, y], fill=wood, width=3)
frames.append(f)
f = blank(); silhouette(ImageDraw.Draw(f), (214, 170, 140, 150)); frames.append(f)          # flesh
f = blank(); d = ImageDraw.Draw(f); red = (200, 30, 40, 220)                                 # blood: veins
for seg in ([120, 150, 96, 120, 70, 140], [120, 150, 146, 120, 172, 140], [120, 150, 108, 230, 102, 300],
            [120, 150, 132, 230, 138, 300], [120, 150, 120, 96]):
    d.line(seg, fill=red, width=2)
frames.append(f)
f = blank(); d = ImageDraw.Draw(f)                                                           # heart: a bellflower
d.polygon([(112, 140), (128, 140), (132, 162), (108, 162)], fill=(120, 110, 230, 255))
d.ellipse([116, 132, 124, 140], fill=(90, 170, 90, 255))
frames.append(f)
f = blank(); g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(g).ellipse([98, 32, 142, 72], fill=(230, 245, 255, 230))
frames.append(g.filter(ImageFilter.GaussianBlur(3)))                                         # brain: snow
f = blank(); ImageDraw.Draw(f).ellipse([158, 184, 186, 198], outline=(225, 230, 240, 255), width=4); frames.append(f)  # silver
f = blank(); ImageDraw.Draw(f).ellipse([167, 182, 177, 192], fill=(255, 250, 245, 255), outline=(200, 190, 220, 255)); frames.append(f)  # pearl
sheet = Image.new('RGBA', (W * 9, H), (0, 0, 0, 0))
for i, fr in enumerate(frames): sheet.paste(fr, (i * W, 0))
sheet.save(sys.argv[1] + '/Memory_Body.png')
