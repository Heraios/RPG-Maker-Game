import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import lap, frogs, reeds, splash, rnd
import marsh_tune as marsh
np.random.seed(801)
R = None
# The Chase: hunting Parl down through the salt marsh, before his boss fight. His jig, fast and slippery,
# always half a step ahead: it ducks into another key, hides in the reeds as a few bars of the Marsh tune,
# pops up somewhere else; his whistle taunts you from far off. Behind it, the hunters: Dama's conch call on
# low brass, splashing feet, a rowing drum, getting closer. Same key and speed as Boss_Parl (A minor, 12/8,
# a dotted quarter = 112), so when he's cornered the fight can start without a seam.
#   1-4 the jig, running          5-8  it dodges: up a fourth, then off to the other side; Dama's call behind
#   9-16 hiding in the reeds: the Marsh tune, quiet; searching feet; his whistle, somewhere
#   17-20 he bolts: the jig on the marimba, the hunters on its heels (the jig in canon, a bar behind)
#   21-24 cornered: the chords climb, a drum roll, a held chord on E
e = 60 / 112 / 3; bar = 12 * e; half = 6 * e                       # 12/8, as in Boss_Parl
INTRO = 1; BARS = 24
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
A4, B4, C5, D5, Ds5, E5, G4, Gs4, Fs4, E4 = 69, 71, 72, 74, 75, 76, 67, 68, 66, 64
P1 = [(A4, 1), (C5, 1), (E5, 1), (Ds5, 1), (E5, 1), (C5, 1), (B4, 2), (G4, 1), (A4, 3),
      (E4, 1), (G4, 1), (A4, 1), (B4, 1), (C5, 1), (D5, 1), (E5, 2), (D5, 1), (B4, 3)]       # Parl's jig, in eighths
P2 = [(C5, 1), (B4, 1), (A4, 1), (Gs4, 1), (A4, 1), (B4, 1), (C5, 2), (E5, 1), (A4, 3),
      (Fs4, 1), (G4, 1), (A4, 1), (C5, 2), (B4, 1), (A4, 6)]                                    # (as in Boss_Parl)
C1 = [(45, 'm'), (43, 'M'), (45, 'm'), (40, 'm')]; C2 = [(40, 'M'), (45, 'm'), (50, 'M'), (45, 'm')]
DAMA = [(64, 3), (59, 3), (64, 4), (66, 2), (67, 6), (66, 3), (64, 3)]   # Dama's call (E B E F# G), in eighths

def triad(r, q): return (r + 12, r + 12 + (4 if q == 'M' else 3), r + 19)

def run(t, chords, vol=1.0):                                       # a light running groove, a chord a half bar
    for k, (r, q) in enumerate(chords):
        at = t + k * half; low = r - 12 if r > 40 else r
        for j, iv in ((0, 0), (3, 7), (4, 12)): S.add(at + j * e, pluckbass(low + iv, e * 1.4, vol=0.34 * vol))
        for j in (2, 5):
            for m in triad(r, q): S.add(at + j * e, harp(m + 12, e * 0.8, vol=0.035 * vol), pan=(-0.4, 0.4)[j == 5])
        S.add(at, drum('tom', 0.3 * vol), pan=-0.2); S.add(at + 3 * e, drum('log', 0.22 * vol), pan=0.3)
        for j in range(6): S.add(at + j * e, drum('shaker', (0.05 if j % 3 == 0 else 0.03) * vol), pan=0.5)

def slosh(t, vol=0.06, pan=0.0):                                  # a foot in shallow water
    n = int(0.12 * SR); tt = np.arange(n) / SR
    S.add(t, lowpass(np.random.uniform(-1, 1, n), 1800) * 3 * np.exp(-tt / 0.03) * vol, pan=pan)

def feet(t, bars, vol=0.06, pan=-0.4, every=3):                   # the hunters splashing after him
    for i in range(int(bars * 12 / every)): slosh(t + i * every * e + rnd(-0.02, 0.02), vol * rnd(0.7, 1), pan + rnd(-0.15, 0.15))

def whistle(t, vol=0.12, pan=0.8):                                # Parl: the start of his jig, cheeky
    seq(S, [(81, 1), (84, 1), (88, 2)], e, t, lambda m, d: flute(m + 12, d * 0.85, vol=vol), pan=pan)

jig = lambda v: (lambda m, d: flute(m + 12, d * 0.85, vol=v))
CH4 = C1 + C2

# the marsh, all the way through
lap(S, 0, END, 0.5, 0.04, pan=-0.3); frogs(S, 0, END, 0.5, 0.018, count=4)
for k in range(1, BARS, 3): reeds(S, B(k) + rnd(0, 2 * bar), rnd(1, 2), 0.035)
for k in (3, 11, 19): splash(S, B(k) + rnd(0, bar), 0.05)

# intro (once): a splash; his whistle, far off
splash(S, 0.05, 0.06); whistle(half, 0.13)

# 1-4: the jig, running
seq(S, P1 + P2, e, B(1), jig(0.32), pan=0.35)
run(B(1), CH4 + CH4); feet(B(1), 4)

# 5-8: it dodges: P1 a fourth higher (D minor) off to the left, then P2 back in A, far right; Dama behind
seq(S, [(m + 5, d) for m, d in P1], e, B(5), lambda m, d: kalimba(m + 12, max(d * 0.9, 0.3), vol=0.3), pan=-0.6)
seq(S, P2, e, B(7), jig(0.3), pan=0.7)
run(B(5), [(r + 5, q) for r, q in C1] + C2, 1.05)
seq(S, DAMA, e, B(5), lambda m, d: brass(m - 12, d * 0.9, vol=0.2), pan=-0.3)
seq(S, DAMA, e, B(7), lambda m, d: brass(m - 12, d * 0.9, vol=0.22), pan=-0.2)
feet(B(5), 4, 0.07)

# 9-16: hiding in the reeds: the Marsh tune on a low reed pipe; the hunters searching, slower; a taunt
seq(S, marsh.MARSH, 3 * e, B(9), lambda m, d: flute(m, d * 0.95, vol=0.16), pan=0.2)     # its 32 beats over 8 bars
for k in range(8):
    r = (45, 45, 40, 40, 45, 45, 40, 52)[k]
    S.add(B(9 + k), pluckbass(r - 12, bar * 0.9, vol=0.2)); S.add(B(9 + k), drum('tom', 0.12), pan=-0.2)
    for m in triad(r, 'm'): S.add(B(9 + k), strings(m, bar * 0.98, vol=0.025))
feet(B(9), 8, 0.05, pan=-0.6, every=6)
whistle(B(12) + half, 0.08, -0.8); whistle(B(15), 0.09, 0.85)

# 17-20: he bolts: the jig on the marimba, the hunters' flute a bar behind it
seq(S, P1 + P2, e, B(17), lambda m, d: marimba(m + 12, d * 0.9, vol=0.42), pan=0.3)
seq(S, (P1 + P2)[:-4], e, B(18), jig(0.2), pan=-0.4)
seq(S, DAMA, e, B(19), lambda m, d: brass(m - 12, d * 0.9, vol=0.24), pan=-0.3)
run(B(17), CH4 + CH4, 1.15); feet(B(17), 4, 0.08)

# 21-24: cornered: the chords climb, the drums roll, and a held E
for k, (r, q) in enumerate([(45, 'm'), (46, 'M'), (47, 'm'), (48, 'M'), (50, 'm'), (51, 'M')]):
    for m in triad(r, q): S.add(B(21) + k * half, stab(m + 12, half * 0.9, vol=0.06), pan=(-0.3, 0.3)[k % 2])
    S.add(B(21) + k * half, slapbass(r - 12, half * 0.8, vol=0.38)); S.add(B(21) + k * half, drum('kick', 0.3))
seq(S, [(81, 3), (84, 3), (88, 6)], e, B(21), jig(0.3), pan=0.4)
seq(S, [(81, 3), (84, 3), (88, 6)], e, B(22), jig(0.28), pan=0.4)
for i in range(18): S.add(B(22) + half + i * e / 1.5, drum('snare', 0.04 + i * 0.008), pan=0.15)
for m in (52, 56, 59, 64): S.add(B(24), strings(m, bar * 0.98, vol=0.06)); S.add(B(24), stab(m + 12, e, vol=0.08))
S.add(B(24), timpani(40, 0.35)); S.add(B(24), cymbal(0.06, 1.2), pan=0.2)
whistle(B(24) + half, 0.1, 0.8)

L, Rr = snes_master(S.L, S.R, echo=0.24, fb=0.28, reverb=0.22)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Chase16.ogg', loop=loop, preview='Chase16_preview.ogg')
print('Chase16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
