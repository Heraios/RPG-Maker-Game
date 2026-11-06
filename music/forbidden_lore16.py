import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from party16 import JW1, JW2
np.random.seed(681)
R = None
# Forbidden Lore: Sib reading the ritual in Juda's books, by candlelight. Juda's hymn, hushed: a harp picking
# it out like someone reading under their breath, a candle ticking, pages turning, and Sib's three counting
# notes at the end of each line. The second time through, something is wrong in it: a note sags here and
# there (F instead of F sharp; A flat instead of A), and the chord at the end of each verse goes glassy and
# strange: G B D-sharp F, the same faint, wrong chord that hides at the end of Juda's own theme (the Navigator
# Lord). Then the candle gutters, and it starts again.
#   1-8 the hymn, hushed     9-16 the hymn, wrong     17-20 the wrong chord; the candle gutters
bpm = 60; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 20
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
HYMN = JW1 + JW2                                                  # 8 bars, G major
WRONG = [(77 if m == 78 and i < 4 else 80 if m == 81 else m, d) for i, (m, d) in enumerate(HYMN)]
ROOTS = [43, 50, 48, 43, 43, 50, 50, 43]                          # G D C G | G D D G
CH = {43: (55, 59, 62), 50: (62, 66, 69), 48: (60, 64, 67)}
LORD = (67, 71, 75, 77)                                           # G B D# F

def candle(t, dur, vol=0.05):                                      # a flame's tiny ticks and breaths
    n = int(dur * SR); x = np.zeros(n); idx = np.random.randint(0, n, int(dur * 2.5)); x[idx] = np.random.uniform(-1, 1, len(idx))
    x = np.convolve(x, np.exp(-np.arange(200) / 25), 'same')
    x += lowpass(np.random.uniform(-1, 1, n), 120) * 0.8 * (0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR / 2.7))
    S.add(t, x * vol, pan=-0.3)

def page(t, vol=0.05):                                             # a page turning: a soft swish
    n = int(0.45 * SR); tt = np.arange(n) / SR; x = np.random.uniform(-1, 1, n)
    x = x - np.convolve(x, np.ones(int(3 + 20 * 0.5)) / int(3 + 20 * 0.5), 'same')
    S.add(t, x * np.sin(np.pi * tt / 0.45) ** 3 * vol, pan=0.4)

def counting(t, vol=0.14):                                         # Sib, reading: C, C, C
    for k in range(3): S.add(t + k * 0.5 * b, kalimba(84, b * 0.5, vol=vol), pan=0.35)

def chords(t, inst=strings, vol=0.03, wrong_ends=False):
    for k, r in enumerate(ROOTS):
        notes = LORD if wrong_ends and k in (3, 7) else CH[r]
        for m in notes: S.add(t + k * bar, inst(m - 12 if inst is strings else m, bar * 0.98, vol=vol))
        S.add(t + k * bar, pluckbass(r - 12, bar * 0.9, vol=0.16))

candle(0, END, 0.05)
# intro (once): a page turns
page(0.5 * b)

# 1-8: the hymn, hushed, on a harp; a low flute breathing it with her
seq(S, HYMN, b, B(1), lambda m, d: harp(m, max(d, 0.8), vol=0.24), pan=-0.1)
seq(S, HYMN, b, B(1), lambda m, d: flute(m - 12, d * 0.95, vol=0.08), pan=0.2)
chords(B(1))
counting(B(4) + b); page(B(5) - 0.5 * b); counting(B(8) + b)

# 9-16: the same, but wrong: notes sag; the glassy chord at the end of each verse
page(B(9) - 0.5 * b)
seq(S, WRONG, b, B(9), lambda m, d: harp(m, max(d, 0.8), vol=0.22), pan=-0.1)
seq(S, WRONG, b, B(9) + 0.5 * b, lambda m, d: bell(m + 12, max(d * 0.4, 0.5), vol=0.03), pan=0.5)
seq(S, WRONG, b, B(9), lambda m, d: organ(m - 24, d * 0.95, vol=0.04))
chords(B(9), vol=0.032, wrong_ends=True)
for k in (12, 16):
    for m in LORD: S.add(B(k), bell(m + 12, 3, vol=0.025), pan=0.4)
counting(B(12) + 2 * b, 0.12); counting(B(16) + 2 * b, 0.1)

# 17-20: the wrong chord, held; the candle gutters; quiet, then a page
for m in LORD: S.add(B(17), strings(m - 12, 2 * bar * 0.98, vol=0.035)); S.add(B(17), choir(m, 2 * bar * 0.98, vol=0.02))
for m in LORD: S.add(B(17) + b, bell(m + 24, 3, vol=0.025), pan=-0.4)
n = int(1.5 * SR); x = lowpass(np.random.uniform(-1, 1, n), 900) * np.exp(-np.arange(n) / SR / 0.4) * 2   # the flame flaring
S.add(B(18) + 2 * b, x * 0.08, pan=-0.3)
for m in (55, 62): S.add(B(19), strings(m - 12, 2 * bar * 0.98, vol=0.045)); S.add(B(19), choir(m, 2 * bar * 0.98, vol=0.025))
S.add(B(19), pluckbass(31, 2 * bar * 0.9, vol=0.14))
seq(S, [(71, 1), (74, 1), (79, 2)], b, B(19), lambda m, d: harp(m, max(d, 0.8), vol=0.14), pan=-0.1)
page(B(20) + 2 * b)

L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.34, reverb=0.32)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Forbidden_Lore16.ogg', loop=loop, preview='Forbidden_Lore16_preview.ogg', gain=0.75)
print('Forbidden_Lore16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
