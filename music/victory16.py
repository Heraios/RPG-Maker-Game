import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(41)
b = 60 / 140
S = Stereo(7)
for i in range(4): S.add(i * b / 4, drum('tom' if i < 2 else 'tomhi', 0.3 + i * 0.08), pan=(-0.4, 0.4)[i % 2])
t = b
for k, m in enumerate((62, 65, 69)):                       # Yoon's D-F-A, now a fanfare
    for iv in (0, 12): S.add(t + k * b / 2, brass(m + iv, b * 0.45, vol=0.24))
    S.add(t + k * b / 2, marimba(m + 12, b * 0.4, vol=0.3), pan=0.4)
    S.add(t + k * b / 2, drum('log', 0.35), pan=-0.3)
t += 1.5 * b
for m, d in ((72, .5), (74, 2.5)):                         # ...C, then home to a bright D MAJOR
    for iv in (0, -12): S.add(t, brass(m + iv, d * b * 0.95, vol=0.26))
    t += d * b
for m in (62, 66, 69, 74): S.add(t - 2.5 * b, strings(m, 2.6 * b, vol=0.1))   # D, F#, A: the major third, at last
S.add(t - 2.5 * b, timpani(38, 0.55)); S.add(t - 2.5 * b, cymbal(0.18), pan=0.3); S.add(t - 2.5 * b, drum('kick', 0.5))
for j, m in enumerate((74, 78, 81, 86, 90, 93)):
    S.add(t - 2.5 * b + j * b / 6, marimba(m, b / 4, vol=0.22), pan=(-0.5, 0.5)[j % 2])
for j, m in enumerate((98, 102, 105)): S.add(t - 1.2 * b + j * b / 5, kalimba(m, b / 3, vol=0.12), pan=0.6)
L, R = snes_master(S.L, S.R, echo=0.2, fb=0.3)
end = int((t + 1.2) * SR)
save_me(L[:end], R[:end], 'Victory_Isle.ogg')
print('Victory %.1fs' % (end / SR))
