import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(331)
# The Island tune: the folk song everyone on the island knows, and the root of every town and village track.
# (The tune itself lives in island_tune.py.)
from island_tune import *
bpm = 108; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 8 * 4
S = Stereo((INTRO + BARS) * bar)

def drums(t, bars, vol=1.0, claps=False, shaker=True):
    for k in range(bars):
        at = t + k * bar
        for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')):            # 3-3-2
            S.add(at + j * b, drum(kind, 0.3 * vol), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
        if shaker:
            for j in range(8): S.add(at + j * b / 2, drum('shaker', (0.07 if j % 2 else 0.04) * vol), pan=0.45)
        if claps and k % 4 in (2, 3):                                        # everyone claps on the answers
            for j in (1, 3): S.add(at + j * b, drum('clap', 0.22 * vol), pan=-0.15)

def bass(t, vol=0.4, walk=False):
    for k, r in enumerate(ROOTS):
        at = t + k * bar
        S.add(at, pluckbass(r - 12 if r > 40 else r, 2 * b * 0.9, vol=vol))
        S.add(at + 2 * b, pluckbass((r - 12 if r > 40 else r) + (7 if not walk else 12), 2 * b * 0.9, vol=vol * 0.8))

def pad(t, inst=strings, vol=0.04):
    for k, r in enumerate(ROOTS):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

# intro (once): a shell horn calls the village, the log drum counts in
for at, m in ((0, 55), (1.5, 62), (3, 67)): S.add(at * b, brass(m, 1.4 * b, vol=0.16), pan=-0.2)
for j in (4, 5.5, 7): S.add(j * b, drum('log', 0.3), pan=-0.3)
t0 = INTRO * bar

# A: one voice calls (flute), the village answers (chant and marimba)
t = t0
for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
    t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.95, vol=0.38), pan=0.2)
    seq(S, ans, b, t, lambda m, d: marimba(m, d * 0.8, vol=0.35), pan=-0.2)
    t = seq(S, ans, b, t, lambda m, d: chant(m, d * 0.95, vol=0.07), pan=-0.1)
drums(t0, 8, 0.8)
bass(t0, 0.32)

# B: everyone together: marimba and flute, the kalimba in thirds above, claps on the answers
t1 = t0 + 8 * bar
seq(S, TUNE, b, t1, lambda m, d: marimba(m, d * 0.8, vol=0.4), pan=-0.2)
seq(S, TUNE, b, t1, lambda m, d: flute(m + 12, d * 0.95, vol=0.28), pan=0.25)
seq(S, HARM, b, t1, lambda m, d: kalimba(m, max(d, 0.4), vol=0.18), pan=0.5)
seq(S, ANS1, b, t1 + 2 * bar, lambda m, d: chant(m, d * 0.95, vol=0.06))
seq(S, ANS2, b, t1 + 6 * bar, lambda m, d: chant(m, d * 0.95, vol=0.06))
pad(t1, vol=0.035)
drums(t1, 8, 1.0, claps=True)
bass(t1, 0.4)

# C: the dance: the tune skipping on the kalimba (each note split in two), stamping feet, slap bass
t2 = t1 + 8 * bar
skip = []
for m, d in TUNE:
    skip += [(m + 12, d / 2), (m + 12 if d < 1 else m + 7, d / 2)] if d >= 1 else [(m + 12, d)]
seq(S, skip, b, t2, lambda m, d: kalimba(m, 0.35, vol=0.26), pan=0.3)
seq(S, TUNE, b, t2, lambda m, d: marimba(m - 12, d * 0.6, vol=0.22), pan=-0.35)
for k, r in enumerate(ROOTS):
    at = t2 + k * bar
    for j, iv in ((0, 0), (1, 12), (1.5, 7), (2, 0), (3, 12), (3.5, 10 if r == 41 else 7)):
        S.add(at + j * b, slapbass(r - 12 + iv if r > 40 else r + iv, b * 0.4, vol=0.3))
    for j in (0, 2): S.add(at + j * b, drum('kick', 0.32))                   # stamping
drums(t2, 8, 1.0, claps=True)
S.add(t2 + 7 * bar + 2 * b, cymbal(0.06, 1.5), pan=0.3)

# D: night: the tune slowly on one flute over a held drone, the way a mother would sing it
t3 = t2 + 8 * bar
half = [(m, d * 2) for m, d in CALL1 + ANS1]                                 # half speed: 8 bars
seq(S, half, b, t3, lambda m, d: flute(m + 12, d * 0.97, vol=0.32), pan=0.1)
seq(S, half, b, t3 + b, lambda m, d: bell(m + 24, 0.4, vol=0.03), pan=-0.5)  # its echo, like stars
for k, r in enumerate((43, 43, 48, 48, 40, 40, 38, 43)):
    for m in CH[r]: S.add(t3 + k * bar, strings(m, bar * 0.98, vol=0.035))
    S.add(t3 + k * bar, pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.25))
for k in range(6, 8):                                                         # the drums wake back up
    for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')):
        S.add(t3 + k * bar + j * b, drum(kind, 0.12 + 0.08 * (k - 6)), pan=(-0.3, 0.3, 0.1)[int(j) % 3])

end = t0 + BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.22, fb=0.3, reverb=0.2)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Island16.ogg', loop=loop, preview='Island16_preview.ogg')
print('Island16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
