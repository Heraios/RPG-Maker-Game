# Run from the repository root:  NODE_PATH=$(npm root -g) python3 art/sky_hole_view.py
# Makes img/parallaxes/SkyHole_{Day,Dusk,Night}[_Mended].png: the view down map 1's sky-hole into map 6's garden.
# It renders map 6 in-game with only the Broken Ladder (event 8) and the Skylight (event 35), for each time of day
# and with the ladder broken (Act 1) or mended (Act 2); crops the garden (tiles x 19-33, y 8-21; centred on the ladder) at full size;
# tints it like map 6's Cave Shade (-85, -80, -40, grey 30); and darkens the edges, the cave around the light.
# Re-run it whenever map 6's garden changes. Map 1 shows it with <Parallax Anchor: x, y, depth> (SI_Screen).
import json, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageChops

X0, Y0, X1, Y1 = 19, 8, 34, 22
m = json.load(open('Smoking Isle/data/Map006.json'))
m['events'] = [e if (e and e['id'] in (8, 35)) else None for e in m['events']]; m['autoplayBgm'] = False
tmp = tempfile.mkdtemp(); garden = os.path.join(tmp, 'map6.json'); json.dump(m, open(garden, 'w'))

def tone(im):
    def t(c):
        g = sum(c) / 3; c = [v + (g - v) * 30 / 255 for v in c]
        return tuple(max(0, min(255, int(v + d))) for v, d in zip(c, (-85, -80, -40)))
    im.putdata([t(c) for c in im.get_flattened_data()]); return im

for period in ('day', 'dusk', 'night'):
    for ladder in ('broken', 'mended'):
        raw = os.path.join(tmp, period + ladder + '.png')
        subprocess.run(['node', 'art/render_map6_garden.js', '6', raw, period, ladder], check=True,
                       env=dict(os.environ, MAP6_GARDEN=garden))
        im = tone(Image.open(raw).convert('RGB').crop((X0 * 48, Y0 * 48, X1 * 48, Y1 * 48)))
        w, h = im.size                                     # the cave around the light: darker towards the edges
        v = Image.new('L', (w, h), 0); ImageDraw.Draw(v).ellipse([w * 0.12, h * 0.1, w * 0.88, h * 0.95], fill=255)
        v = v.filter(ImageFilter.GaussianBlur(70)).point(lambda a: int(70 + a * 185 / 255))
        im = ImageChops.multiply(im, Image.merge('RGB', [v] * 3))
        name = 'SkyHole_' + period.capitalize() + ('_Mended' if ladder == 'mended' else '')
        im.save('Smoking Isle/img/parallaxes/' + name + '.png'); print(name, im.size)
