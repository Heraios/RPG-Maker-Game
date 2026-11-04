import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A, B, C, B_end, ROOTS, third_below
from yoon_full import BRIDGE
np.random.seed(21)
BPM = 100; b = 60 / BPM; INTRO, SEC = 16, 32
S = Stereo((INTRO + SEC * 3 + 16) * b)
CH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 60, 64), 48: (60, 64, 67), 46: (58, 62, 65)}

def pad(t0, roots, bars_each=1, vol=0.07):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t0 + k * 4 * b * bars_each, strings(m, 4 * b * bars_each * 0.98, vol=vol))

def curious(t0, extra=False):
    seq(S, A + B + C + B, b, t0, lambda m, d: marimba(m, d * 0.8, vol=0.55), pan=-0.2)
    if extra:
        seq(S, A + B + C + B, b, t0 + b / 2, lambda m, d: kalimba(m + 12, d * 0.6, vol=0.15), pan=0.55)
    pad(t0, ROOTS, vol=0.05)
    for bar, r in enumerate(ROOTS):
        for k, iv in enumerate((0, 12, 7, 12)):
            S.add(t0 + (bar * 4 + k) * b, pluckbass(r - 12 + iv, b * 0.8, vol=0.4))
    for i in range(SEC * 2):
        at = t0 + i * b / 2
        S.add(at, drum('shaker', 0.12 if i % 2 else 0.07), pan=0.45)
        if i % 8 == 0: S.add(at, drum('log', 0.45), pan=-0.3)
        if i % 8 == 5: S.add(at, drum('tomhi', 0.3), pan=0.3)
        if extra and i % 8 == 3: S.add(at, drum('log', 0.25), pan=0.4)

def sweet(t0):
    mel = A + B + C + B_end
    seq(S, mel, b, t0, lambda m, d: flute(m, d, vol=0.45), pan=0.15)
    seq(S, [(third_below(m), d) for m, d in mel], b, t0, lambda m, d: kalimba(m, d, vol=0.22), pan=-0.35)
    pad(t0, ROOTS, vol=0.08)
    for bar, r in enumerate(ROOTS):
        S.add(t0 + bar * 4 * b, pluckbass(r - 12, 2 * b * 0.95, vol=0.42))
        S.add(t0 + (bar * 4 + 2) * b, pluckbass(r - 5, 2 * b * 0.95, vol=0.38))
        chord = [r + 12, r + 15 if r in (50, 45) else r + 16, r + 19]
        for k in range(8):
            S.add(t0 + (bar * 4 + k / 2) * b, marimba(chord[k % 3] + 12, b * 0.4, vol=0.1), pan=(-0.5, 0.5)[k % 2])
        for k, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')):
            S.add(t0 + (bar * 4 + k) * b, drum(kind, 0.32), pan=(-0.3, 0.3, 0.1)[int(k) % 3])

def bridge(t0):
    seq(S, BRIDGE, b, t0, lambda m, d: flute(m, d, vol=0.45), pan=0.1)
    seq(S, BRIDGE, b, t0 + b, lambda m, d: bell(m + 12, d * 0.4, vol=0.08), pan=-0.5)
    for bar, r in enumerate((50, 48, 46, 45)):
        S.add(t0 + bar * 4 * b, pluckbass(r - 12, 4 * b * 0.97, vol=0.45))
        for m in CH[r]: S.add(t0 + bar * 4 * b, strings(m, 4 * b * 0.98, vol=0.1))
        S.add(t0 + bar * 4 * b, drum('tom', 0.4))
    for k in range(8):
        S.add(t0 + (12 + k / 2) * b, drum('log' if k % 2 else 'tomhi', 0.18 + k * 0.035), pan=(-0.4, 0.4)[k % 2])

# intro: the theme slow on the flute, over a string drone, with bell drips (plays once)
seq(S, [(m, d * 2) for m, d in A], b, 0, lambda m, d: flute(m, d, vol=0.42), pan=0.1)
for m in (50, 57, 62): S.add(0, strings(m, INTRO * b * 0.98, vol=0.08))
for t in (3, 7.5, 12): S.add(t * b, bell(93, 0.3, vol=0.12), pan=0.5)
t = INTRO * b
curious(t); t += SEC * b
sweet(t); t += SEC * b
bridge(t); t += 16 * b
curious(t, extra=True); t += SEC * b
L, R = snes_master(S.L, S.R)
L, R, loop = finish_loop(L, R, INTRO * b, t)
save_stereo(L, R, 'Yoon16.ogg', loop=loop, preview='Yoon16_preview.ogg')
print('Yoon16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
