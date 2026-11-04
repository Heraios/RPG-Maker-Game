import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from sib import S1, S2, SIB
np.random.seed(71)
R = None
A5, B5, C6, D6, E6, F6 = 81, 83, 84, 86, 88, 89
bpm = 96; b = 60 / bpm; INTRO = 8
CH = {53: (65, 69, 72), 48: (60, 64, 67), 50: (62, 65, 69), 43: (55, 59, 62)}
def third_below(m):
    scale = [x + 12 * o for o in range(3, 8) for x in (0, 2, 4, 5, 7, 9, 11)]
    below = [x for x in scale if x <= m]; return below[-3]
# B: Sib's counting notes climb, a step higher each time, catching breath between, then reach the top
CLIMB = [(C6, .5), (C6, .5), (C6, .5), (R, .5), (D6, .5), (D6, .5), (D6, .5), (R, .5),
         (E6, .5), (E6, .5), (E6, .5), (R, .5), (F6, 1), (E6, .5), (D6, .5),
         (C6, 1), (R, .5), (A5, .5), (B5, .5), (C6, .5), (D6, .5), (E6, .5), (F6, 4)]
total = INTRO + 16 * 4
S = Stereo(total * b)

def harmony(t0, roots, vol=0.07):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t0 + k * 4 * b, strings(m, 4 * b * 0.98, vol=vol))
        S.add(t0 + k * 4 * b, pluckbass(r - 12, 2 * b * 0.95, vol=0.36))
        S.add(t0 + (k * 4 + 2) * b, pluckbass(r - 5, 2 * b * 0.95, vol=0.3))

for k in range(3): S.add(k * b, kalimba(84, b * 0.8, vol=0.3), pan=0.3)
S.add(4 * b, bell(84, 1, vol=0.12), pan=-0.4)
for m in (53, 60, 65): S.add(0, strings(m, INTRO * b * 0.98, vol=0.07))
t = INTRO * b
# A: Sib on the flute; page-turning shakers
seq(S, SIB, b, t, lambda m, d: flute(m, d, vol=0.45), pan=0.1); harmony(t, [53, 48, 53, 50])
for i in range(16): S.add(t + (i + 0.5) * b, drum('shaker', 0.07), pan=0.5)
t += 16 * b
# A2: marimba with the flute a third below; light island drums
seq(S, SIB, b, t, lambda m, d: marimba(m, d, vol=0.5), pan=-0.2)
seq(S, [(third_below(m) if m else None, d) for m, d in SIB], b, t, lambda m, d: flute(m, d, vol=0.25), pan=0.35)
harmony(t, [53, 48, 53, 50])
for bar in range(4):
    for k, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')): S.add(t + (bar * 4 + k) * b, drum(kind, 0.24), pan=(-0.3, 0.3, 0.1)[int(k) % 3])
t += 16 * b
# B: the stubborn climb, kalimba and flute together, the strings rising with it
seq(S, CLIMB, b, t, lambda m, d: flute(m, d, vol=0.4), pan=0.15)
seq(S, CLIMB, b, t, lambda m, d: kalimba(m - 12, d, vol=0.22), pan=-0.35)
harmony(t, [53, 43, 50, 48], vol=0.08)
for i in range(8): S.add(t + (12 + i / 2) * b, drum('tomhi' if i % 2 else 'log', 0.1 + i * 0.03), pan=(-0.4, 0.4)[i % 2])
t += 16 * b
# C: the little priest: a slow chant, bells, a drone, soft timpani
seq(S, [(m, d * 2) for m, d in S1 + S2], b, t, lambda m, d: flute(m, d, vol=0.4), pan=0.1)
seq(S, [(m + 12 if m else None, d * 2) for m, d in S1 + S2], b, t + b / 2, lambda m, d: bell(m, d * 0.3, vol=0.07), pan=-0.5)
for m in (41, 48, 53): S.add(t, strings(m, 16 * b * 0.98, vol=0.09))
for bar in range(4): S.add(t + bar * 4 * b, timpani(41, 0.33)); S.add(t + (bar * 4 + 3) * b, drum('log', 0.2), pan=0.3)
t += 16 * b
L, Rr = snes_master(S.L, S.R)
L, Rr, loop = finish_loop(L, Rr, INTRO * b, t)
save_stereo(L, Rr, 'Sib_alone16.ogg', loop=loop, preview='Sib_alone16_preview.ogg')
print('Sib alone intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
