import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from sib import S1, S2, S3, S4, SIB
from yoon import A as YA, B as YB, third_below
np.random.seed(81)
R = None
bpm = 92; b = 60 / bpm; INTRO = 8
CH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 60, 64), 48: (60, 64, 67), 46: (58, 62, 65)}
S = Stereo((INTRO + 28 + 32 + 4) * b)
def pad(t0, roots, vol=0.07, bass=True):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t0 + k * 4 * b, strings(m, 4 * b * 0.98, vol=vol))
        if bass:
            S.add(t0 + k * 4 * b, pluckbass(r - 12, 2 * b * 0.95, vol=0.36)); S.add(t0 + (k * 4 + 2) * b, pluckbass(r - 5, 2 * b * 0.95, vol=0.3))
def drums(t0, bars, vol=0.22):
    for bar in range(bars):
        for k, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')): S.add(t0 + (bar * 4 + k) * b, drum(kind, vol), pan=(-0.3, 0.3, 0.1)[int(k) % 3])

# intro: Yoon's first notes on marimba, Sib's counting on kalimba, a bell between them
for k, m in enumerate((74, 77, 81)): S.add(k * b * 0.5, marimba(m, b, vol=0.4), pan=-0.4)
for k in range(3): S.add((3 + k * 0.5) * b, kalimba(84, b * 0.5, vol=0.3), pan=0.4)
S.add(6 * b, bell(86, 1, vol=0.12))
for m in (50, 57, 65): S.add(0, strings(m, INTRO * b * 0.98, vol=0.07))
t = INTRO * b
y = lambda m, d: marimba(m, d * 0.85, vol=0.5)
s = lambda m, d: flute(m, d, vol=0.42)
# 1: Yoon calls, Sib answers; then both at once, Sib's climb under Yoon's tune; they land together
t1 = seq(S, YA, b, t, y, pan=-0.35); pad(t, [50, 53])
t2 = seq(S, S1 + S2, b, t1, s, pan=0.35); pad(t1, [53, 48])
t3 = seq(S, YB, b, t2, y, pan=-0.35); seq(S, [(m - 12 if m else None, d) for m, d in S3 + S4], b, t2, s, pan=0.35); pad(t2, [50, 45])
S.add(t3, marimba(74, 3 * b, vol=0.5), pan=-0.35); S.add(t3, flute(65, 3.5 * b, vol=0.4), pan=0.35); pad(t3, [50])
drums(t, 7)
t = t3 + 4 * b
# 2: the sweet section: Yoon's melody on flute, Sib's whole theme answering underneath on kalimba
mel = YA + YB
seq(S, mel, b, t, lambda m, d: flute(m, d, vol=0.42), pan=0.15)
seq(S, SIB, b, t, lambda m, d: kalimba(m - 12, d, vol=0.26), pan=-0.35)
pad(t, [50, 53, 50, 45], vol=0.08)
for bar in range(4):
    for k in range(8): S.add(t + (bar * 4 + k / 2) * b, marimba((62, 65, 69)[k % 3] + 12, b * 0.4, vol=0.08), pan=(-0.5, 0.5)[k % 2])
drums(t, 4, 0.28)
t += 16 * b
# 3: the same, swapped: Sib's tune on the flute on top, Yoon's on marimba underneath
seq(S, SIB, b, t, lambda m, d: flute(m, d, vol=0.42), pan=0.15)
seq(S, mel, b, t, lambda m, d: marimba(m - 12, d * 0.85, vol=0.32), pan=-0.35)
pad(t, [53, 48, 50, 45], vol=0.08)
drums(t, 4, 0.28)
t += 16 * b
# a breath, then home
for m in (62, 65, 69, 74): S.add(t, strings(m, 4 * b * 0.98, vol=0.08))
S.add(t, bell(86, 1.2, vol=0.12)); t += 4 * b
L, Rr = snes_master(S.L, S.R)
L, Rr, loop = finish_loop(L, Rr, INTRO * b, t)
save_stereo(L, Rr, 'Yoon_and_Sib16.ogg', loop=loop, preview='Yoon_and_Sib16_preview.ogg')
print('Yoon and Sib intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
