import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import creak
np.random.seed(661)
R = None
# Sneaking: the ritual is forbidden, and Juda mustn't know. Tiptoeing: a plucked bass on every beat, a
# staccato marimba tune, short harp ticks. And comic pauses: everything freezes, a floorboard creaks, and far
# off an organ plays the first three notes of Juda's hymn (warm, in G major: he is nearby)... a beat of
# silence... then a little "phew" on the flute, and on they go.
#   1-4   the tune on the marimba            5-6  freeze! Juda's notes; phew
#   7-10  the tune low, on a bassoon-ish brass (someone heavier tiptoeing)
#   11-12 oops: a clatter, silence, "shh!"   13-20 down the corridor: the bass creeping up, the tune climbing
#   21-24 the tune, flute and marimba        25-27 the last freeze: more of Juda's hymn... a door closes. Phew.
bpm = 108; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 27
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
M1 = [(76, .5), (R, .5), (79, .5), (R, .5), (78, .5), (R, .5), (75, .5), (R, .5), (76, .25), (78, .25), (79, .5), (R, .5), (83, .5), (R, 2)]
M2 = [(84, .5), (R, .5), (83, .5), (R, .5), (81, .5), (R, .5), (79, .5), (R, .5), (78, .5), (79, .5), (78, .5), (75, .5), (76, 1), (R, 1)]
TUNE = M1 + M2                                                    # 4 bars
ROOTS = [40, 40, 45, 47]                                          # Em Em Am B
CH = {40: (52, 55, 59), 45: (57, 60, 64), 47: (59, 63, 66), 41: (53, 56, 60), 42: (54, 57, 61), 43: (55, 59, 62),
      44: (56, 59, 63), 46: (58, 61, 65)}
JUDA3 = [(71, 1), (74, 1), (79, 1)]                               # B D G: the start of his hymn
JUDA6 = [(71, 1), (74, 1), (79, 2), (78, 1), (76, 1), (74, 2)]

def tiptoe(t, roots, vol=0.3, ticks=True):                         # plucked bass on every beat, harp ticks between
    for k, r in enumerate(roots):
        for j in range(4):
            S.add(t + k * bar + j * b, pluckbass(r - 12 + (0, 7, 0, 7)[j], b * 0.3, vol=vol * (1 if j % 2 == 0 else 0.75)))
            if ticks: S.add(t + k * bar + (j + 0.5) * b, harp(CH[r][j % 3] + 12, b * 0.2, vol=0.04)[:int(b * 0.3 * SR)], pan=(-0.5, 0.5)[j % 2])

def freeze_juda(t, notes, vol=0.07):                               # far off, warm, on an organ
    seq(S, notes, b, t, lambda m, d: organ(m - 12, d * 0.95, vol=vol), pan=0.6)
    for m in (55, 59, 62): S.add(t, organ(m - 12, sum(d for _, d in notes) * b * 0.95, vol=vol * 0.3), pan=0.6)

def phew(t, vol=0.2):                                              # a little sigh of relief, sliding down
    for i, m in enumerate((86, 84, 83, 81, 79, 76)): S.add(t + i * 0.06, flute(m, 0.09 if i < 5 else 0.5, vol=vol), pan=-0.2)

def shh(t, vol=0.05):
    n = int(0.6 * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(4) / 4, 'same')
    S.add(t, x * np.sin(np.pi * np.arange(n) / n) * vol, pan=0.3)

def clatter(t, vol=0.25):
    S.add(t, drum('tomhi', vol), pan=0.4); S.add(t + 0.08, drum('log', vol * 0.8), pan=0.5)
    S.add(t + 0.17, drum('tom', vol * 0.6), pan=0.3); S.add(t + 0.05, cymbal(vol * 0.3, 0.6), pan=0.5)

# intro (once): two tiptoes and a "shh"
S.add(0, pluckbass(28, b * 0.3, vol=0.3)); S.add(b, pluckbass(35, b * 0.3, vol=0.24)); shh(2 * b, 0.04)

# 1-4: the tune
seq(S, TUNE, b, B(1), lambda m, d: marimba(m, d * 0.6, vol=0.42), pan=-0.1)
tiptoe(B(1), ROOTS)

# 5-6: freeze! A creak; Juda's three notes, far off; silence; phew
creak(S, B(5) + 0.5 * b, 0.07)
freeze_juda(B(5) + b, JUDA3)
phew(B(6) + b); S.add(B(6) + 2.5 * b, kalimba(91, 0.2, vol=0.06), pan=0.5); S.add(B(6) + 2.7 * b, kalimba(88, 0.2, vol=0.05), pan=0.5)
S.add(B(6) + 3 * b, pluckbass(28, b * 0.3, vol=0.25))

# 7-10: someone heavier tiptoeing: the tune low on brass, plucked strings with it
seq(S, TUNE, b, B(7), lambda m, d: brass(m - 24, d * 0.5, vol=0.26), pan=-0.2)
seq(S, TUNE, b, B(7), lambda m, d: stab(m - 12, d * 0.5, vol=0.12), pan=0.3)
tiptoe(B(7), ROOTS, 0.32)

# 11-12: oops. A clatter, silence, "shh!"; then just the bass, cautiously
clatter(B(11)); shh(B(11) + 2 * b, 0.07)
tiptoe(B(12), [40], 0.22, ticks=False)

# 13-20: down the corridor: the bass creeping up a half step each bar; the tune's start, climbing
for k in range(8):
    r = 40 + k
    for j in range(4): S.add(B(13 + k) + j * b, pluckbass(r - 12, b * 0.3, vol=0.3 if j % 2 == 0 else 0.22))
    seq(S, [(m + k if m else None, d) for m, d in M1[:8]], b, B(13 + k), lambda m, d: kalimba(m, 0.3, vol=0.2), pan=(-0.3, 0.3)[k % 2])
    for m in CH[r]: S.add(B(13 + k), strings(m, bar * 0.98, vol=0.02 + 0.004 * k))
for i in range(64): S.add(B(17) + i * b / 4, stab(64 + (i % 2) * 7, b / 4 * 0.9, vol=0.008 + 0.0004 * i), pan=(-0.4, 0.4)[i % 2])
creak(S, B(16) + 2 * b, 0.05)

# 21-24: the tune, flute and marimba together, a shaker
seq(S, TUNE, b, B(21), lambda m, d: marimba(m, d * 0.6, vol=0.38), pan=-0.2)
seq(S, TUNE, b, B(21), lambda m, d: flute(m + 12, d * 0.5, vol=0.16), pan=0.3)
tiptoe(B(21), ROOTS)
for i in range(16): S.add(B(21) + (i + 0.5) * b, drum('shaker', 0.05), pan=0.5)

# 25-27: the last freeze: more of Juda's hymn, nearer... a door closes. Phew.
creak(S, B(25), 0.08)
freeze_juda(B(25) + b, JUDA6, 0.09)
S.add(B(27), drum('kick', 0.35)); S.add(B(27), lowpass(np.random.uniform(-1, 1, int(0.15 * SR)), 600) * 0.3)   # the door
phew(B(27) + 1.5 * b, 0.2)

L, Rr = snes_master(S.L, S.R, echo=0.22, fb=0.25, reverb=0.22)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Sneaking16.ogg', loop=loop, preview='Sneaking16_preview.ogg')
print('Sneaking16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
