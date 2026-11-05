import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from marsh_tune import LULL1, LULL2
from ambience import clacks
np.random.seed(561)
R = None
# Battle_Ancients: for the First Sailor remnants: Hags, Owls of Ill Omen, Stonemen. Queen Tou's minuet made
# a fight: a fast, dark waltz in E minor (her sharp fourth, A sharp, and her D sharp), glassy and old: harp,
# bells, organ, strings, a choir, timpani; bone chimes knocking. Then each remnant gets a turn: the Hags' wrong
# lullaby on low strings with an owl's hoot over it, and the Stonemen, the minuet at half speed, heavy as rock.
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]   # Tou
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
C1 = [(40, 'm'), (42, 'M'), (48, 'M'), (47, 'M')]; C2 = [(40, 'm'), (43, 'M'), (50, 'M'), (40, 'm')]
HAG = [(40, 'm'), (45, 'm'), (47, 'M'), (40, 'm'), (48, 'M'), (40, 'd'), (45, 'm'), (40, 'm')]
STONE = [(40, 'm'), (48, 'M'), (47, 'M'), (40, 'm')] * 2
OWL = [(71, 1), (67, 2)]                                     # "hoo... hoo"
bpm = 168; b = 60 / bpm; bar = 3 * b
INTRO = 2; BARS = 16 + 8 + 8
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def triad(r, q):
    return (r + 12, r + 12 + {'M': 4, 'm': 3, 'd': 3}[q], r + 12 + (6 if q == 'd' else 7))

def waltz(t, chords, vol=1.0, run=True):                     # bass on one, chords on two and three, harp running
    for k, (r, q) in enumerate(chords):
        at = t + k * bar; tri = triad(r, q); low = r - 12
        S.add(at, slapbass(low, b * 0.9, vol=0.38 * vol)); S.add(at, timpani(r if r < 45 else r - 12, 0.25 * vol))
        for j in (1, 2):
            for m in tri: S.add(at + j * b, stab(m + 12, b * 0.4, vol=0.045 * vol), pan=(-0.4, 0.4)[j - 1])
        if run:
            arp = (tri[0] + 12, tri[1] + 12, tri[2] + 12, tri[0] + 24, tri[2] + 12, tri[1] + 12)
            for j, m in enumerate(arp): S.add(at + j * b / 2, harp(m, b * 0.5, vol=0.06 * vol), pan=(-0.5, 0.5)[j % 2])
        S.add(at, drum('tom', 0.32 * vol), pan=-0.2)
        for j in (1, 2): S.add(at + j * b, drum('tomhi', 0.14 * vol), pan=0.3)
        for j in range(6): S.add(at + j * b / 2, drum('shaker', 0.05 * vol), pan=0.5)

# intro (once): a music box wound fast; one note of the minuet; then the whole court strikes
for i in range(14): S.add(i * 0.05, drum('shaker', 0.12), pan=0.3)
S.add(0.8, bell(88, 0.8, vol=0.2), pan=0.4); S.add(0.8, kalimba(88, 0.8, vol=0.2), pan=0.4)
for m in (40, 46, 51, 52): S.add(bar + b, organ(m, bar + b, vol=0.1))
S.add(bar + b, timpani(28, 0.55)); S.add(bar + b, cymbal(0.15, 2), pan=-0.2)
for i in range(4): S.add(bar + (1 + i * 0.5) * b, drum('tom', 0.2 + i * 0.06))

# A (1-16): the minuet as a fight: bells and harp on the tune, then up an octave with flute and a choir
seq(S, T1 + T2, b, B(1), lambda m, d: bell(m, max(d * 0.8, 0.3), vol=0.18), pan=-0.1)
seq(S, T1 + T2, b, B(1), lambda m, d: organ(m - 12, d * 0.9, vol=0.12), pan=0.2)
waltz(B(1), C1 + C2)
seq(S, T1 + T2, b, B(9), lambda m, d: flute(m + 12, d * 0.85, vol=0.3), pan=0.2)
seq(S, T1 + T2, b, B(9), lambda m, d: strings(m - 12, d * 0.9, vol=0.1), pan=-0.25)
waltz(B(9), C1 + C2, 1.1)
for k, (r, q) in enumerate(C1 + C2):
    for m in triad(r, q): S.add(B(9 + k), choir(m, bar * 0.98, vol=0.035))
for s in (1, 9): S.add(B(s), cymbal(0.1), pan=0.3)
for k in range(1, 17, 3): clacks(S, B(k) + 1.5 * b, 0.05)

# B (17-24): the Hags and the Owls: the wrong lullaby on low strings, fierce; an owl hoots over it
seq(S, LULL1 + LULL2, b, B(17), lambda m, d: strings(m - 12, d * 0.9, vol=0.14), pan=-0.2)
seq(S, LULL1 + LULL2, b, B(17), lambda m, d: brass(m - 12, d * 0.8, vol=0.1), pan=0.2)
for s in (18, 20, 22, 24): seq(S, OWL, b, B(s), lambda m, d: flute(m - 12, d * 0.9, vol=0.2), pan=0.6)
waltz(B(17), HAG, 1.0, run=False)
for k in range(17, 25, 2): clacks(S, B(k) + b, 0.06)

# C (25-32): the Stonemen: the minuet at half speed, low and heavy; timpani on every beat
seq(S, [(m, d * 2) for m, d in T1], b, B(25), lambda m, d: brass(m - 24, d * 0.9, vol=0.22), pan=-0.1)
seq(S, [(m, d * 2) for m, d in T1], b, B(25), lambda m, d: organ(m - 12, d * 0.95, vol=0.08), pan=0.2)
waltz(B(25), STONE, 1.05)
for k in range(8):
    for j in range(3): S.add(B(25 + k) + j * b, timpani(28 if j == 0 else 35, 0.2 + 0.1 * (j == 0)))
for i in range(6): S.add(B(32) + i * b / 2, drum('tom', 0.15 + i * 0.05))      # rolling back into the fight

L, Rr = snes_master(S.L, S.R, echo=0.24, fb=0.3, reverb=0.25)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Battle_Ancients16.ogg', loop=loop, preview='Battle_Ancients16_preview.ogg')
print('Battle_Ancients16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
