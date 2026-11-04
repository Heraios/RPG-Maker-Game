import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from sib import S1, S2, S3, S4, SIB
from yoon import A as YA, B as YB
np.random.seed(51)
R = None
bpm = 96; b = 60 / bpm
INTRO = 8
CH = {53: (65, 69, 72), 48: (60, 64, 67), 50: (62, 65, 69), 45: (57, 60, 64), 46: (58, 62, 65)}
ROOTS = [53, 48, 53, 50]                                       # F C F D
total = INTRO + 16 + 16 + 16 + 36
S = Stereo(total * b)

def third_below(m):
    scale = [x + 12 * o for o in range(3, 8) for x in (2, 4, 5, 7, 9, 11, 12)]
    below = [x for x in scale if x <= m]; return below[-3]

def harmony(t0, roots, beats_per=4, vol=0.07):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t0 + k * beats_per * b, strings(m, beats_per * b * 0.98, vol=vol))
        S.add(t0 + k * beats_per * b, pluckbass(r - 12, beats_per / 2 * b * 0.95, vol=0.38))
        S.add(t0 + (k * beats_per + beats_per / 2) * b, pluckbass(r - 5, beats_per / 2 * b * 0.95, vol=0.32))

# intro: a kalimba counts on the reciting tone, over a held F
for k in range(3): S.add(k * b, kalimba(84, b * 0.8, vol=0.3), pan=0.3)
S.add(4 * b, bell(84, 1, vol=0.12), pan=-0.4)
for m in (53, 60, 65): S.add(0, strings(m, INTRO * b * 0.98, vol=0.07))
t = INTRO * b

# A: Sib on the flute, quiet page-turning shakers
seq(S, SIB, b, t, lambda m, d: flute(m, d, vol=0.45), pan=0.1)
harmony(t, ROOTS)
for i in range(16): S.add(t + (i + 0.5) * b, drum('shaker', 0.07), pan=0.5)
t += 16 * b

# A2: the marimba takes the tune, the flute a third below; light log drums
seq(S, SIB, b, t, lambda m, d: marimba(m, d, vol=0.5), pan=-0.2)
seq(S, [(third_below(m) if m else None, d) for m, d in SIB], b, t, lambda m, d: flute(m, d, vol=0.25), pan=0.35)
harmony(t, ROOTS)
for bar in range(4):
    for k, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')):
        S.add(t + (bar * 4 + k) * b, drum(kind, 0.25), pan=(-0.3, 0.3, 0.1)[int(k) % 3])
t += 16 * b

# B: the little priest: the first half slowed to a chant, bells, over a drone; deep drums
seq(S, [(m, d * 2) for m, d in S1 + S2], b, t, lambda m, d: flute(m, d, vol=0.4), pan=0.1)
seq(S, [(m + 12 if m else None, d * 2) for m, d in S1 + S2], b, t + b / 2, lambda m, d: bell(m, d * 0.3, vol=0.07), pan=-0.5)
for m in (41, 48, 53): S.add(t, strings(m, 16 * b * 0.98, vol=0.09))
for bar in range(4):
    S.add(t + bar * 4 * b, timpani(41, 0.35)); S.add(t + (bar * 4 + 3) * b, drum('log', 0.2), pan=0.3)
t += 16 * b

# C: Yoon and Sib. Yoon calls (marimba), Sib answers (flute), then both at once, landing together
y = lambda m, d: marimba(m, d * 0.85, vol=0.5)
s = lambda m, d: flute(m, d, vol=0.42)
t2 = seq(S, YA, b, t, y, pan=-0.3)
t2 = seq(S, S1 + S2, b, t2, s, pan=0.3)
t3 = seq(S, YB, b, t2, y, pan=-0.3)
seq(S, [(m - 12 if m else None, d) for m, d in S3 + S4], b, t2, s, pan=0.3)
S.add(t3, marimba(74, 3 * b, vol=0.5), pan=-0.3); S.add(t3, flute(65, 3.5 * b, vol=0.4), pan=0.3)
for m in (50, 57, 62, 65): S.add(t3, strings(m, 4 * b * 0.98, vol=0.08))
harmony(t, [50, 53, 50, 45, 53, 48, 50, 45], vol=0.06)
for bar in range(8):
    for k, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')):
        S.add(t + (bar * 4 + k) * b, drum(kind, 0.22), pan=(-0.3, 0.3, 0.1)[int(k) % 3])
t = t3 + 4 * b

L, Rr = snes_master(S.L, S.R)
L, Rr, loop = finish_loop(L, Rr, INTRO * b, t)
save_stereo(L, Rr, 'Sib16.ogg', loop=loop, preview='Sib16_preview.ogg')
print('Sib16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
