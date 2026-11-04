import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(31)
R = None
D5, E5, F5, G5, Gs5, A5, C6, D6 = 74, 76, 77, 79, 80, 81, 84, 86
bpm = 150; b = 60 / bpm; bar = 4 * b; INTRO, BARS = 2, 24
S = Stereo((INTRO + BARS) * bar)
# intro: brass stabs climbing into the fight, then a held note
for k, m in enumerate([50, 50, 50, 53, 55, 56]):
    for iv in (0, 7, 12): S.add(k * b * 1.33, brass(m + iv, b * 0.45, vol=0.22))
    S.add(k * b * 1.33, drum('tom', 0.45))
for iv in (0, 7): S.add(6 * b, brass(57 + iv + 12, 2 * b * 0.95, vol=0.25))
S.add(6 * b, drum('snare', 0.3))
t0 = INTRO * bar
CH = {50: (62, 65, 69), 48: (60, 64, 67), 46: (58, 62, 65), 45: (57, 61, 64)}
roots = [50, 50, 48, 48, 46, 46, 45, 45]
bass_riff = [0, 0, 12, 0, 10, 12, 7, 5]
for k in range(BARS):
    r = roots[k % 8]; at = t0 + k * bar
    for i, iv in enumerate(bass_riff): S.add(at + i * b / 2, slapbass(r - 12 + iv, b / 2 * 0.85, vol=0.42))
    if k % 2 == 0:
        for m in CH[r]: S.add(at, strings(m, 2 * bar * 0.97, vol=0.06))
    for i in range(8):
        if i in (0, 3, 6): S.add(at + i * b / 2, drum('tom' if i == 0 else 'log', 0.5 if i == 0 else 0.38), pan=(-0.3, 0.3)[i % 2])
        S.add(at + i * b / 2, drum('shaker', 0.13 if i % 2 else 0.08), pan=0.5)
    S.add(at, drum('kick', 0.45)); S.add(at + b, drum('clap', 0.3), pan=-0.1); S.add(at + 3 * b, drum('clap', 0.3), pan=0.1)
riff1 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (R, .5),
         (C6, .5), (R, .5), (A5, .5), (R, .5), (G5, .5), (F5, .5), (E5, .5), (R, .5)]
riff2 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (D6, .5),
         (C6, 1), (A5, .5), (G5, .5), (A5, 2)]
chant = [(A5, 1), (A5, .5), (C6, .5), (D6, 1), (C6, .5), (A5, .5), (G5, 1), (G5, .5), (A5, .5), (F5, 1), (E5, 1),
         (F5, 1), (F5, .5), (A5, .5), (C6, 1), (A5, .5), (G5, .5), (Gs5, 2), (A5, 2)]
lead = lambda m, d: brass(m, d * 0.7, vol=0.36)
mar = lambda m, d: marimba(m, d * 0.7, vol=0.3)
fl = lambda m, d: flute(m + 12, d * 0.95, vol=0.36)
t = t0
for part, kind in ((riff1, 'r'), (riff2, 'r'), (riff1, 'r'), (riff2, 'r'), (chant, 'c'), (chant, 'c'),
                   (riff1, 'r'), (riff2, 'r'), (riff1, 'r'), ([(D6, 2), (R, 6)], 'r')):
    start = t
    if kind == 'r':
        t = seq(S, part, b, start, lead, pan=-0.15); seq(S, part, b, start, mar, pan=0.35)
    else:
        t = seq(S, part, b, start, fl, pan=0.2); seq(S, part, b, start, lambda m, d: marimba(m, d * 0.5, vol=0.18), pan=-0.4)
L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.28, reverb=0.14)
L, Rr, loop = finish_loop(L, Rr, t0, (INTRO + BARS) * bar)
save_stereo(L, Rr, 'Battle_Wild16.ogg', loop=loop, preview='Battle_Wild16_preview.ogg')
print('Battle_Wild16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
