import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A as YA, B as YB
from ambience import bed_wind, trill, drip, rnd
np.random.seed(831)
R = None
# Living Things: harvesting the dragon tree (the skeleton) and the living bellflower (the heart), with the
# Lady of the Woods' leave. Falmi's sprouting notes (F A C) and Yoon's theme (D F A) share F and A, so the
# sprout can really grow into Yoon's theme, a note at a time:
#   F A C F  ->  F A C A  ->  D F A C A  ->  D F A G A  ->  D F A G-sharp A (Yoon)
# The forest by day; the dragon tree creaking, deep and wooden, its red resin dripping; and the bellflower,
# a real bell, ringing softly like a heartbeat (it will be Yoon's heart: the Ritual's heartbeat starts here).
# The Lady is a low choir, giving her leave.
#   1-6 the forest; the tree; the bellflower's heartbeat starts   7-16 the sprout grows into Yoon's notes
#   17-24 Yoon's theme, with Falmi's tune under it (her gift)     25-28 the sprout again, the heartbeat fading
bpm = 72; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 28
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
STEPS = [([(77, .5), (81, .5), (84, .5), (89, 2.5)], (41, 'M')),               # F A C F: Falmi's sprout
         ([(77, .5), (81, .5), (84, .5), (81, 2.5)], (41, 'M')),               # F A C A: it curls back
         ([(74, 1), (77, .5), (81, .5), (84, .5), (81, 1.5)], (50, 'm7')),     # D F A C A: a new root
         ([(74, 1), (77, .5), (81, .5), (79, .5), (81, 1.5)], (50, 'm')),      # D F A G A
         ([(74, 1), (77, .5), (81, .5), (80, .5), (81, 1.5)], (45, 'M'))]      # D F A G# A: Yoon
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (82, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
CHORD = {'M': (0, 4, 7), 'm': (0, 3, 7), 'm7': (0, 3, 7, 10)}
YCH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 60, 64), 46: (58, 62, 65)}

def creak(t, vol=0.07):                                            # the dragon tree: a deep, slow wooden groan
    n = int(rnd(1.5, 2.5) * SR); tt = np.arange(n) / SR
    f = 45 + 15 * np.sin(np.pi * tt / (n / SR))
    clicks = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.95).astype(float)
    x = lowpass(np.convolve(clicks, np.exp(-np.arange(250) / 40), 'same'), 900)
    S.add(t, x / (np.abs(x).max() + 1e-9) * np.sin(np.pi * tt / (n / SR)) ** 2 * vol, pan=rnd(-0.4, 0.4))

def resin(t, vol=0.06):                                            # a slow, thick drop: a low, round plop
    n = int(0.3 * SR); tt = np.arange(n) / SR; f = 240 * (1 + 0.6 * np.exp(-tt / 0.03))
    S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.07) * vol, pan=-0.4)

def heartbeat(t, vol=0.06):                                        # the bellflower: a soft bell, lub-dub
    S.add(t, bell(81, 1.2, vol=vol), pan=0.2); S.add(t + 0.35, bell(76, 1.0, vol=vol * 0.6), pan=0.2)

# the forest by day, all the way through
bed_wind(S, 0, END, 1.0, vol=0.065, smooth=40)
for k in range(1, BARS, 2):
    if rnd() < 0.6: trill(S, B(k) + rnd(0, 2 * bar), rnd(0.04, 0.06))
t = 0.4
while t < END - 0.5: drip(S, t, rnd(0.03, 0.05)); t += rnd(0.4, 2.0)
for k in range(1, BARS, 4): creak(B(k) + rnd(0, 2 * bar))
for k in range(2, BARS, 3): resin(B(k) + rnd(0, bar), 0.05)
for k in range(5, 27): heartbeat(B(k), 0.03 + 0.03 * min(1, (k - 5) / 8) * min(1, (27 - k) / 3))
for m in (41, 48): S.add(B(1), choir(m + 12, 6 * bar * 0.98, vol=0.035)); S.add(B(1), strings(m, 6 * bar * 0.98, vol=0.03))   # the Lady, low
for m in (41, 48): S.add(B(25), choir(m + 12, 4 * bar + 2 * b, vol=0.035)); S.add(B(25), strings(m, 4 * bar + 2 * b, vol=0.03))

# intro (once): a creak, a drop of resin
creak(0.2, 0.08); resin(1.5)

# 1-8: the sprout, as in Falmi's theme, once
seq(S, STEPS[0][0], b, B(3), lambda m, d: kalimba(m, max(d, 0.5), vol=0.2), pan=0.2)

# 7-16: the growing, two bars a step, doubled by a bell; the chords move from F to D
for k, (notes, (r, q)) in enumerate(STEPS):
    at = B(7 + 2 * k)                                              # bars 7, 9, 11, 13, 15
    seq(S, notes, b, at, lambda m, d: kalimba(m, max(d, 0.5), vol=0.24), pan=0.2)
    seq(S, notes, b, at + 0.5 * b, lambda m, d: bell(m + 12, max(d * 0.5, 0.6), vol=0.035), pan=-0.5)
    for i in CHORD[q]: S.add(at, strings(r + 12 + i, 2 * bar * 0.98, vol=0.03)); S.add(at, choir(r + 12 + i, 2 * bar * 0.98, vol=0.02))
    S.add(at, pluckbass(r - 12, 2 * bar * 0.9, vol=0.18))

# 17-24: Yoon's theme on the flute, Falmi's tune under it on a marimba, a harp
seq(S, YA + YB, b, B(17), lambda m, d: flute(m, d * 0.95, vol=0.3), pan=0.15)
seq(S, F1 + F1, b, B(19), lambda m, d: marimba(m - 12, d * 0.8, vol=0.16), pan=-0.3)
for k, r in enumerate((50, 53, 50, 45, 50, 53, 50, 45)):
    for m in YCH[r]: S.add(B(17 + k), strings(m, bar * 0.98, vol=0.035))
    S.add(B(17 + k), pluckbass(r - 12, bar * 0.9, vol=0.2))
    for j in range(4): S.add(B(17 + k) + j * b, harp(YCH[r][(0, 1, 2, 1)[j]] + 12, b * 1.2, vol=0.05), pan=(-0.4, 0.4)[j % 2])

# 25-28: the sprout again, the forest, the heartbeat fading
seq(S, STEPS[0][0], b, B(25), lambda m, d: kalimba(m, max(d, 0.5), vol=0.18), pan=-0.2)
seq(S, STEPS[4][0], b, B(27), lambda m, d: bell(m + 12, max(d * 0.5, 0.6), vol=0.04), pan=0.4)

L, Rr = snes_master(S.L, S.R, echo=0.28, fb=0.34, reverb=0.3)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Living_Things16.ogg', loop=loop, preview='Living_Things16_preview.ogg', gain=0.85)
print('Living_Things16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
