import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(41)
b = 60 / 140
S = Stereo(13)
# 1. the opening (as before): a tom roll, Yoon's D-F-A as a fanfare, then home to a bright D MAJOR
for i in range(4): S.add(i * b / 4, drum('tom' if i < 2 else 'tomhi', 0.3 + i * 0.08), pan=(-0.4, 0.4)[i % 2])
t = b
for k, m in enumerate((62, 65, 69)):
    for iv in (0, 12): S.add(t + k * b / 2, brass(m + iv, b * 0.45, vol=0.24))
    S.add(t + k * b / 2, marimba(m + 12, b * 0.4, vol=0.3), pan=0.4)
    S.add(t + k * b / 2, drum('log', 0.35), pan=-0.3)
t += 1.5 * b
for m, d in ((72, .5), (74, 2.5)):
    for iv in (0, -12): S.add(t, brass(m + iv, d * b * 0.95, vol=0.26))
    t += d * b
hit = t - 2.5 * b
for m in (62, 66, 69, 74): S.add(hit, strings(m, 2.6 * b, vol=0.1))
S.add(hit, timpani(38, 0.55)); S.add(hit, cymbal(0.18), pan=0.3); S.add(hit, drum('kick', 0.5))
for j, m in enumerate((74, 78, 81, 86, 90, 93)): S.add(hit + j * b / 6, marimba(m, b / 4, vol=0.22), pan=(-0.5, 0.5)[j % 2])
# 2. an island victory dance: two bars of marimba over log drums in 3-3-2, slap bass and claps
dance = [(74, .5), (76, .5), (78, .5), (81, .5), (83, .5), (81, .5), (78, .5), (76, .5),
         (74, .5), (78, .5), (81, .5), (86, .5), (83, .5), (81, 1.5)]
seq(S, dance, b, t, lambda m, d: marimba(m, d * 0.9, vol=0.42), pan=-0.2)
seq(S, dance, b, t, lambda m, d: kalimba(m + 12, d * 0.6, vol=0.12), pan=0.45)
for k, r in enumerate((50, 45)):
    at = t + k * 4 * b
    for i, iv in enumerate((0, 0, 12, 0, 7, 12, 7, 5)): S.add(at + i * b / 2, slapbass(r - 12 + iv, b / 2 * 0.85, vol=0.38))
    for i in range(8):
        if i in (0, 3, 6): S.add(at + i * b / 2, drum('tom' if i == 0 else 'log', 0.4 if i == 0 else 0.32), pan=(-0.3, 0.3)[i % 2])
        S.add(at + i * b / 2, drum('shaker', 0.1), pan=0.5)
    S.add(at + b, drum('clap', 0.28)); S.add(at + 3 * b, drum('clap', 0.28))
    for m in ((62, 66, 69), (57, 61, 64))[k]: S.add(at, strings(m, 4 * b * 0.98, vol=0.06))
t += 8 * b
# 3. the last flourish: brass climbs A-B-C#, and lands on one big D major chord
for k, m in enumerate((69, 71, 73)):
    for iv in (0, 12): S.add(t + k * b / 2, brass(m + iv, b * 0.45, vol=0.24))
    S.add(t + k * b / 2, drum('tomhi' if k < 2 else 'tom', 0.35), pan=(-0.3, 0.3, 0)[k])
t += 1.5 * b
for m in (62, 66, 69, 74):
    S.add(t, brass(m + 12, 4 * b, vol=0.15)); S.add(t, strings(m, 6.5 * b, vol=0.1)); S.add(t, choir(m + 12, 6.5 * b, vol=0.05))
S.add(t, timpani(38, 0.55)); S.add(t, cymbal(0.2, 3), pan=-0.2); S.add(t, drum('kick', 0.5))
for i in range(6): S.add(t - 0.75 * b + i * b / 8, timpani(38, 0.1 + i * 0.05))
for j, m in enumerate((98, 102, 105, 110)): S.add(t + b + j * b / 4, kalimba(m, b / 2, vol=0.12), pan=(0.5, -0.5)[j % 2])
S.add(t + 2 * b, bell(98, 1.5, vol=0.08), pan=0.3)
L, R = snes_master(S.L, S.R, echo=0.2, fb=0.3)
end = int((t + 4.5 * b + 1.6) * SR)
save_me(L[:end], R[:end], 'Victory_Isle.ogg')
print('Victory %.1fs' % (end / SR))
