import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(61)
R = None
C5, Db5, D5, E5, F5, G5, A5, B5, C6, D6 = 72, 73, 74, 76, 77, 79, 81, 83, 84, 86
# Thenmy: a noble climb in fourths and fifths, kindness in the stepwise answer, and one dark Seafarer
# note (D flat) that pulls the third bar down before it comes home. Earnest, not imperial.
THEME = [(C5, 1), (G5, 1.5), (F5, .5), (E5, 1),
         (D5, .5), (E5, .5), (F5, 1), (G5, 2),
         (A5, 1), (G5, .5), (F5, .5), (E5, 1), (Db5, 1),
         (C5, 3), (R, 1),
         (E5, 1), (G5, 1), (C6, 1.5), (B5, .5),
         (A5, 1), (G5, 1), (F5, 2),
         (E5, 1), (F5, .5), (G5, .5), (A5, 1), (D5, 1),
         (C5, 4)]
ROOTS = [48, 43, 41, 37, 48, 41, 45, 43]           # C G F Db | C F Am G  (the Db: his empire's shadow)
CH = {48: (60, 64, 67), 43: (55, 59, 62), 41: (53, 57, 60), 37: (49, 53, 56), 45: (57, 60, 64)}
bpm = 84; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 8 + 8 + 4
S = Stereo((INTRO + BARS) * bar)

# intro: a brass call rising in fifths over a timpani roll
for i in range(12): S.add(i * b / 6, timpani(36, 0.12 + i * 0.03))
for k, m in enumerate((55, 60, 67)):
    for iv in (0, -12): S.add((2 + k) * b, brass(m + iv, (1.6 if k < 2 else 2.8) * b, vol=0.22))
S.add(4 * b, cymbal(0.12), pan=0.3)
t0 = INTRO * bar

def chords(t, roots, vol=0.08, harp_vol=0.16):
    for k, r in enumerate(roots):
        at = t + k * bar
        for m in CH[r]: S.add(at, strings(m, bar * 0.98, vol=vol))
        S.add(at, pluckbass(r - 12 if r > 40 else r, 2 * b * 0.95, vol=0.4))
        S.add(at + 2 * b, pluckbass((r - 12 if r > 40 else r) + 7, 2 * b * 0.95, vol=0.32))
        arp = list(CH[r]) + [CH[r][0] + 12]
        for j in range(8): S.add(at + j * b / 2, harp(arp[j % 4] + 12, b / 2, vol=harp_vol), pan=(-0.5, 0.5)[j % 2])

# A: the theme on mellow brass, strings and harp; timpani on the downbeats
seq(S, THEME, b, t0, lambda m, d: brass(m, d * 0.95, vol=0.3), pan=-0.1)
chords(t0, ROOTS)
for k in range(8): S.add(t0 + k * bar, timpani(36 if ROOTS[k] != 37 else 37, 0.35))

# B: the march: flute and brass together, a Seafarer snare, the dark note louder
t1 = t0 + 8 * bar
seq(S, THEME, b, t1, lambda m, d: brass(m, d * 0.9, vol=0.28), pan=-0.2)
seq(S, THEME, b, t1, lambda m, d: flute(m + 12, d * 0.95, vol=0.3), pan=0.25)
chords(t1, ROOTS, vol=0.09, harp_vol=0.1)
for k in range(8):
    at = t1 + k * bar
    S.add(at, timpani(36, 0.4)); S.add(at, drum('kick', 0.3))
    for j, v in ((1, 0.28), (2.5, 0.16), (2.75, 0.18), (3, 0.28)):     # a drilled march pattern
        S.add(at + j * b, drum('snare', v), pan=0.15)

# C: his kindness: the first half quietly on harp and flute, almost a lullaby
t2 = t1 + 8 * bar
half = THEME[:13]                     # bars 1-3 and the dark note...
seq(S, half + [(C5, 4)], b, t2, lambda m, d: flute(m, d, vol=0.32), pan=0.1)
seq(S, half + [(C5, 4)], b, t2 + b / 2, lambda m, d: harp(m + 12, d * 0.5, vol=0.1), pan=-0.4)
for k, r in enumerate((48, 43, 41, 48)):
    for m in CH[r]: S.add(t2 + k * bar, strings(m, bar * 0.98, vol=0.06))
    S.add(t2 + k * bar, pluckbass(r - 12, bar * 0.95, vol=0.3))
for i in range(8): S.add(t2 + 3 * bar + i * b / 2, timpani(36, 0.08 + i * 0.04))   # a roll back into the march

end = t0 + BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.26, fb=0.3, reverb=0.25)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Thenmy16.ogg', loop=loop, preview='Thenmy16_preview.ogg')
print('Thenmy16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
