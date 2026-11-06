# Run from the repository root:  python3 art/motes.py "Smoking Isle/img/characters"
# Draws !Motes.png: sunlit dust motes for the skylight. An 8-character sheet (4 x 2); each character
# has its speck at a different spot in the tile (so motes don't line up on the grid), and its three
# frames twinkle (dim, bright, middling) when the event has Stepping on. The four facing rows are copies.
import sys
from PIL import Image, ImageDraw
T = 48
OFFSETS = [(12, 10), (30, 22), (20, 34), (36, 8), (8, 28), (26, 14), (16, 40), (38, 32)]
FRAMES = [(200, 2), (255, 3), (230, 2)]          # (alpha, glow radius) per frame
CORE, GLOW = (255, 246, 205), (255, 226, 150)
sheet = Image.new('RGBA', (T * 3 * 4, T * 4 * 2), (0, 0, 0, 0))
for k, (ox, oy) in enumerate(OFFSETS):
    bx, by = (k % 4) * T * 3, (k // 4) * T * 4
    for f, (alpha, glow) in enumerate(FRAMES):
        cell = Image.new('RGBA', (T, T), (0, 0, 0, 0)); d = ImageDraw.Draw(cell)
        d.ellipse([ox - glow - 1, oy - glow - 1, ox + glow + 1, oy + glow + 1], fill=GLOW + (alpha // 3,))
        d.rectangle([ox - 2, oy - 1, ox + 2, oy + 1], fill=GLOW + (alpha * 2 // 3,))
        d.rectangle([ox - 1, oy - 2, ox + 1, oy + 2], fill=GLOW + (alpha * 2 // 3,))
        d.rectangle([ox - 1, oy - 1, ox + 1, oy + 1], fill=CORE + (alpha,))
        for r in range(4): sheet.paste(cell, (bx + f * T, by + r * T))
sheet.save(sys.argv[1] + '/!Motes.png')
