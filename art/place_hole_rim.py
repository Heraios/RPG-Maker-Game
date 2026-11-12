# Run from the repository root:  python3 art/place_hole_rim.py MAP_ID
# Paints the Lava-E rim (layer 3, the first upper layer) on every see-through tile (Lava-A5's first tile, 1536) of
# a map, from the hole's shape: edges, corners and inner corners. Run it again after reshaping the hole.
# Close RPG Maker first (it would overwrite the map).
import json, re, sys
E = 768
EDGE = {('u', 'l'): 44, ('u', 'r'): 46, ('d', 'l'): 60, ('d', 'r'): 62, 'u': 45, 'd': 61, 'l': 52, 'r': 54}
INNER = {('u', 'l'): 47, ('u', 'r'): 55, ('d', 'l'): 63, ('d', 'r'): 71}
RIM = set(EDGE.values()) | set(INNER.values())
path = 'Smoking Isle/data/Map%03d.json' % int(sys.argv[1])
raw = open(path).read(); m = json.loads(raw); W, H, d = m['width'], m['height'], m['data']
at = lambda x, y, z: (z * H + y) * W + x
hole = lambda x, y: 0 <= x < W and 0 <= y < H and d[at(x, y, 0)] == 1536
for i in range(W * H):                                # clear old rim pieces
    if d[2 * W * H + i] - E in RIM: d[2 * W * H + i] = 0
n = 0
for y in range(H):
    for x in range(W):
        if not hole(x, y): continue
        open_ = {k: not hole(x + dx, y + dy) for k, (dx, dy) in {'u': (0, -1), 'd': (0, 1), 'l': (-1, 0), 'r': (1, 0)}.items()}
        t = None
        for v in ('u', 'd'):
            for h in ('l', 'r'):
                if t is None and open_[v] and open_[h]: t = EDGE[(v, h)]
        for k in ('u', 'd', 'l', 'r'):
            if t is None and open_[k]: t = EDGE[k]
        if t is None:
            for (v, dy) in (('u', -1), ('d', 1)):
                for (h, dx) in (('l', -1), ('r', 1)):
                    if t is None and not hole(x + dx, y + dy): t = INNER[(v, h)]
        if t is not None: d[at(x, y, 2)] = E + t; n += 1
data = '"data":[' + ','.join(map(str, d)) + ']'
raw = re.sub(r'"data":\[[^\]]*\]', lambda _: data, raw, count=1)
open(path, 'w').write(raw); json.loads(raw)
print('rim pieces:', n)
