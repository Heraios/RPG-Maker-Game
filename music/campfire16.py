import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import crickets, hearth, rnd
from island_tune import ANS1, ANS2
np.random.seed(621)
R = None
# Campfire: the party's evening scenes, and resting at bothies. Warm, quiet, a little funny. A crackling fire
# and crickets all through; a lilting tune in 6/8 on a kalimba, a harp being idly picked, a hand drum.
#   1-8   the tune, on the kalimba
#   9-17  a flute takes it... squeaks a sour note, stops (a low chuckle from someone), and tries again
#   18-25 later: someone starts humming the Island tune's answers, slow, and the others join in
#   26-29 ...and someone has fallen asleep. A snore. An owl. The kalimba nods off mid-tune. A log pops.
#   30-37 everyone's awake again: the tune with the flute and marimba together, clapping along
e = 60 / 56 / 3; bar = 6 * e                                      # 6/8: two lilting beats to a bar
INTRO = 1; BARS = 37
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
CH = {43: (55, 59, 62), 48: (60, 64, 67), 40: (52, 55, 59), 38: (50, 54, 57), 41: (53, 57, 60), 'dm': (50, 53, 57)}
C1 = [(74, 2), (71, 1), (72, 2), (74, 1), (76, 3), (74, 3), (71, 2), (67, 1), (69, 2), (71, 1), (72, 3), (69, 3)]
C2 = [(74, 2), (71, 1), (72, 2), (74, 1), (79, 3), (78, 2), (76, 1), (74, 2), (72, 1), (71, 2), (69, 1), (67, 6)]
OOPS = [(74, 2), (71, 1), (72, 2), (74, 1), (80, 1), (R, 5),                                  # a sour G sharp...
        (79, 3), (78, 2), (76, 1), (74, 2), (72, 1), (71, 2), (69, 1), (67, 6)]              # ...and again, right
TUNE = C1 + C2
ROOTS = [43, 48, 43, 38, 43, 40, 38, 43]                         # G C G D | G Em D G
OOPS_ROOTS = [43, 40, 40, 38, 43]
HUM = [(m, d * 3) for m, d in ANS1 + ANS2]                       # the Island answers: one note to a beat
HUM_ROOTS = [43, 48, 40, 43, 41, 'dm', 48, 43]

def strum(t, roots, vol=0.07):                                   # a harp, picked idly: up and back down
    for k, r in enumerate(roots):
        tri = CH[r]
        for j in range(6): S.add(t + k * bar + j * e, harp(tri[(0, 1, 2, 1, 2, 1)[j]] + 12, 2 * e, vol=vol), pan=(-0.4, 0.4)[j % 2])

def bass(t, roots, vol=0.3):
    for k, r in enumerate(roots):
        r = 50 if r == 'dm' else r
        S.add(t + k * bar, pluckbass(r - 12, 2.5 * e, vol=vol)); S.add(t + k * bar + 3 * e, pluckbass(r - 5, 2.5 * e, vol=vol * 0.8))

def hand(t, bars, vol=0.14, clap=False):                          # a hand drum on the knee
    for k in range(bars):
        at = t + k * bar
        S.add(at, drum('tom', vol), pan=-0.2); S.add(at + 3 * e, drum('log', vol * 0.7), pan=0.25)
        for j in (2, 5): S.add(at + j * e, drum('shaker', vol * 0.35), pan=0.45)
        if clap: S.add(at + 3 * e, drum('clap', vol * 0.9), pan=0.1)

def chuckle(t, vol=0.16):                                         # "heh-heh", low
    for j, m in enumerate((43, 40, 38)): S.add(t + j * 0.9 * e, brass(m, e * 0.5, vol=vol * (1 - 0.2 * j)), pan=-0.3)

def snore(t, vol=0.06):                                           # a rattling breath in... and a little whistle out
    n = int(1.6 * SR); tt = np.arange(n) / SR
    x = lowpass(np.random.uniform(-1, 1, n), 400) * 6
    rattle = 0.4 + 0.6 * (np.sin(2 * np.pi * 28 * tt) > 0)
    S.add(t, x * rattle * np.sin(np.pi * tt / 1.6) ** 2 * vol, pan=-0.4)
    m = int(1.0 * SR); tt = np.arange(m) / SR; f = 1100 - 250 * tt
    S.add(t + 1.9, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 1.0) ** 2 * vol * 0.25, pan=-0.4)

def owl(t, vol=0.06):                                             # hoo... hoo-hoo
    for j, (at, d) in enumerate(((0, 0.5), (0.8, 0.25), (1.1, 0.45))):
        n = int(d * SR); tt = np.arange(n) / SR; f = 400 * (1 - 0.06 * tt / d)
        S.add(t + at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * vol, pan=0.7)

def pop(t, vol=0.2):                                               # a log pops in the fire
    n = int(0.05 * SR); x = np.random.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR / 0.006)
    S.add(t, x * vol, pan=-0.15); S.add(t + 0.11, x * vol * 0.4, pan=-0.1)

# the fire and the crickets, all the way through
hearth(S, 0, END, 1.5, 0.13, pan=-0.15)
crickets(S, 0, END, 2.0, 0.008)
for k in range(2, BARS, 5): pop(B(k) + rnd(0, bar), 0.1)

# intro (once): a strum, settling down
strum(0, [43], 0.06)

# 1-8: the tune on the kalimba
seq(S, TUNE, e, B(1), lambda m, d: kalimba(m, max(d, 0.4), vol=0.36), pan=-0.1)
strum(B(1), ROOTS); bass(B(1), ROOTS); hand(B(1), 8)

# 9-17: the flute; the sour note; a chuckle; again
seq(S, OOPS, e, B(9), lambda m, d: flute(m, d * 0.9, vol=0.36), pan=0.15)
seq(S, [(None if m == 80 else m, d) for m, d in OOPS], e, B(9), lambda m, d: kalimba(m - 12, max(d, 0.4), vol=0.16), pan=-0.3)
strum(B(9), [43]); bass(B(9), [43]); hand(B(9), 1)
S.add(B(10), harp(52, bar, vol=0.05), pan=0.2)                   # (everything stops)
chuckle(B(10) + 2 * e)
strum(B(11), [40, 38, 43] + ROOTS[:4]); bass(B(11), [40, 38, 43] + ROOTS[:4]); hand(B(11), 7)
seq(S, C1, e, B(14), lambda m, d: flute(m, d * 0.9, vol=0.34), pan=0.15)       # and, confident now
seq(S, C1, e, B(14), lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.12), pan=-0.5)

# 18-25: the Island tune's answers, hummed slowly, then the others joining
seq(S, HUM, e, B(18), lambda m, d: choir(m - 12, d * 0.97, vol=0.12), pan=-0.1)
seq(S, HUM[7:], e, B(22), lambda m, d: flute(m - 12, d * 0.9, vol=0.16), pan=0.3)
strum(B(18), HUM_ROOTS, 0.05); bass(B(18), HUM_ROOTS, 0.24); hand(B(18), 8, 0.08)

# 26-29: asleep. A snore, an owl, the kalimba nodding off, a log pops
for k in range(4): S.add(B(26 + k), harp(CH[(43, 40, 48, 43)[k]][0] + 12, bar, vol=0.06), pan=0.2)
S.add(B(26), pluckbass(31, bar * 2, vol=0.18)); S.add(B(28), pluckbass(36, bar * 2, vol=0.16))
snore(B(26) + 1 * e, 0.07); snore(B(27) + 3 * e, 0.07); snore(B(29) - 1 * e, 0.06)
owl(B(27) + 0.5 * bar, 0.05)
t = B(28)
for m, d in C1[:5]:                                               # the tune, slowing down... and stopping
    S.add(t, kalimba(m, max(d * e, 0.4), vol=0.22), pan=-0.1); t += d * e * 1.35
pop(B(29) + 4 * e, 0.3)

# 30-37: awake again: flute and marimba together, clapping along
seq(S, TUNE, e, B(30), lambda m, d: flute(m, d * 0.9, vol=0.32), pan=0.2)
seq(S, TUNE, e, B(30), lambda m, d: marimba(m - 12, d * 0.8, vol=0.32), pan=-0.2)
strum(B(30), ROOTS, 0.065); bass(B(30), ROOTS); hand(B(30), 8, 0.16, clap=True)
chuckle(B(37) + 3 * e, 0.1)

L, Rr = snes_master(S.L, S.R, echo=0.24, fb=0.28, reverb=0.2)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Campfire16.ogg', loop=loop, preview='Campfire16_preview.ogg', gain=0.85)
print('Campfire16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
