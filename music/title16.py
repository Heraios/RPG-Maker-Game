import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A, B, C, B_end, ROOTS, third_below
np.random.seed(301)
# Title: Yoon's theme, gentle and mysterious, the volcano smoking in the distance. A kalimba alone first
# (one child's curiosity), then the island joins in (flute, choir, log drums in 3-3-2), then the smoke again.
bpm = 76; b = 60 / bpm; bar = 4 * b
INTRO = 3; BARS = 8 + 8 + 4
S = Stereo((INTRO + BARS) * bar)
CH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 61, 64), 48: (60, 64, 67)}

def rumble(t, dur, vol=1.0):                 # the volcano: a low, slow-breathing roar
    n = int(dur * SR); x = lowpass(np.random.uniform(-1, 1, n), 90) * 14
    tt = np.arange(n) / SR
    S.add(t, x * np.sin(np.pi * tt / dur) ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * tt / 3.7)) * vol)

def wind(t, dur, vol=1.0, pan=0.0):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(40) / 40, 'same') - np.convolve(x, np.ones(400) / 400, 'same')
    tt = np.arange(n) / SR
    S.add(t, x * np.sin(np.pi * tt / dur) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 6.1) ** 2) * vol * 3, pan=pan)

def harp_bars(t, roots, vol=0.12):
    for k, r in enumerate(roots):
        arp = list(CH[r]) + [CH[r][0] + 12, CH[r][2], CH[r][1]]
        for j in range(6): S.add(t + k * bar + j * (2 * b / 3), harp(arp[j], b, vol=vol), pan=(-0.45, 0.45)[j % 2])

def pad(t, roots, inst=strings, vol=0.05):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

# intro (once): the volcano breathing, wind, one bell like a star coming out
rumble(0, INTRO * bar + 2 * b, 0.5)
wind(0.5 * b, INTRO * bar, 0.25, pan=-0.4)
for m in (38, 45, 50): S.add(2 * b, strings(m, (INTRO * bar - 2 * b) * 0.98, vol=0.06))
for at, m in ((4, 93), (7, 88), (9.5, 86)): S.add(at * b, bell(m, 0.4, vol=0.1), pan=0.5)
t0 = INTRO * bar

# A: the kalimba alone with the theme, harp under it, a far-off log drum from the third bar
t = seq(S, A + B + C + B_end, b, t0, lambda m, d: kalimba(m, max(d, 0.5), vol=0.42), pan=0.1)
harp_bars(t0, ROOTS, 0.1)
pad(t0, ROOTS, vol=0.04)
for k, r in enumerate(ROOTS): S.add(t0 + k * bar, pluckbass(r - 12, bar * 0.95, vol=0.3))
for k in range(2, 8):
    for j in (0, 1.5, 3): S.add(t0 + k * bar + j * b, drum('log', 0.12 if j else 0.18), pan=-0.5)

# B: the island joins: flute with the kalimba a third below, choir, marimba, the 3-3-2 log drums and shakers
t1 = t
mel = A + B + C + B_end
seq(S, mel, b, t1, lambda m, d: flute(m, d, vol=0.4), pan=0.15)
seq(S, [(third_below(m), d) for m, d in mel], b, t1, lambda m, d: kalimba(m, max(d, 0.5), vol=0.2), pan=-0.35)
pad(t1, ROOTS, inst=choir, vol=0.05)
pad(t1, ROOTS, vol=0.04)
harp_bars(t1, ROOTS, 0.07)
for k, r in enumerate(ROOTS):
    at = t1 + k * bar
    S.add(at, pluckbass(r - 12, 2 * b * 0.95, vol=0.38)); S.add(at + 2 * b, pluckbass(r - 5, 2 * b * 0.95, vol=0.3))
    for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')):
        S.add(at + j * b, drum(kind, 0.26), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    for j in range(8): S.add(at + j * b / 2, drum('shaker', 0.06 if j % 2 else 0.035), pan=0.45)
S.add(t1 + 7 * bar + 3 * b, cymbal(0.07, 2.5), pan=0.2)

# C: the smoke again: the volcano, the wind, the theme's first phrase on bells, then back to the kalimba
t2 = t1 + 8 * bar
rumble(t2, 4 * bar + 3 * b, 0.45)
wind(t2 + b, 4 * bar, 0.2, pan=0.4)
for m in (38, 45, 50, 53): S.add(t2, strings(m, 4 * bar * 0.98, vol=0.05))
seq(S, [(m, d * 2) for m, d in A], b, t2, lambda m, d: bell(m + 12, 0.6, vol=0.09), pan=-0.3)
seq(S, [(m, d * 2) for m, d in A], b, t2 + 1.5 * b, lambda m, d: bell(m + 12, 0.4, vol=0.04), pan=0.5)   # its echo
S.add(t2, pluckbass(38, 4 * bar * 0.9, vol=0.3))

end = t0 + BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.32, fb=0.38, reverb=0.3)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Title16.ogg', loop=loop, preview='Title16_preview.ogg')
print('Title16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
