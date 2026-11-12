# Run from the repository root (needs the game's Playwright, like the tests):
#   NODE_PATH=$(npm root -g) python3 art/hole_view.py --map 6 --crop 19,8,34,22 --name SkyHole --keep 8,35 \
#       [--setup "JS run before the shot"] [--suffix _Mended] [--tone=-85,-80,-40,30]
# Makes img/parallaxes/NAME_Day/_Dusk/_Night[SUFFIX].png: a view down a hole into the map below. It renders map MAP
# in-game (keeping only the events listed in --keep), once per time of day, crops tiles x0..x1-1, y0..y1-1 at full
# size, tints it like the map below looks in-game (--tone: red, green, blue, grey, as in Tint Screen), and darkens
# the edges. Show it with <Hole View: NAME_{period}, x, y, depth> in the upper map's note (SI_Screen).
import argparse, json, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ap = argparse.ArgumentParser()
ap.add_argument('--map', type=int, required=True); ap.add_argument('--crop', required=True)
ap.add_argument('--name', required=True); ap.add_argument('--keep', default='')
ap.add_argument('--setup', default=''); ap.add_argument('--suffix', default='')
ap.add_argument('--tone', default='0,0,0,0')
a = ap.parse_args()
X0, Y0, X1, Y1 = map(int, a.crop.split(',')); TONE = list(map(int, a.tone.split(',')))
keep = {int(i) for i in a.keep.split(',') if i}
m = json.load(open('Smoking Isle/data/Map%03d.json' % a.map))
m['events'] = [e if (e and e['id'] in keep) else None for e in m['events']]; m['autoplayBgm'] = False
tmp = tempfile.mkdtemp(); below = os.path.join(tmp, 'map.json'); json.dump(m, open(below, 'w'))

def tone(im):
    r, g, b, grey = TONE
    def t(c):
        avg = sum(c) / 3; c = [v + (avg - v) * grey / 255 for v in c]
        return tuple(max(0, min(255, int(v + d))) for v, d in zip(c, (r, g, b)))
    im.putdata([t(c) for c in im.get_flattened_data()]); return im

for period in ('day', 'dusk', 'night'):
    raw = os.path.join(tmp, period + '.png')
    subprocess.run(['node', 'art/render_map_view.js', str(a.map), raw, period, a.setup], check=True,
                   env=dict(os.environ, MAP_JSON=below))
    im = tone(Image.open(raw).convert('RGB').crop((X0 * 48, Y0 * 48, X1 * 48, Y1 * 48)))
    w, h = im.size                                     # the dark around the light: darker towards the edges
    v = Image.new('L', (w, h), 0); ImageDraw.Draw(v).ellipse([w * 0.12, h * 0.1, w * 0.88, h * 0.95], fill=255)
    v = v.filter(ImageFilter.GaussianBlur(70)).point(lambda x: int(70 + x * 185 / 255))
    im = ImageChops.multiply(im, Image.merge('RGB', [v] * 3))
    name = '%s_%s%s' % (a.name, period.capitalize(), a.suffix)
    im.save('Smoking Isle/img/parallaxes/' + name + '.png'); print(name, im.size)
