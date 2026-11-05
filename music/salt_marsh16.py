import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from marsh_tune import *
from ambience import *
np.random.seed(391)
# The salt marsh where the big river meets the sea: wet, slow, uneasy. Mostly ambience: frogs, water
# lapping at the reeds, mosquitoes, a heron, splashes; and far off, cranes calling (or are they Hags?).
# The Marsh tune on a low reed pipe over a wavering drone; its flattened fifth never quite settles.
bpm = 70; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 48
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def drone(t, bars, root=40, vol=0.05):            # a reed drone that wavers (two organ pipes, slightly apart)
    for m, v in ((root, vol), (root + 7, vol * 0.6)):
        S.add(t, organ(m, bars * bar * 0.99, vol=v), pan=-0.2)
        S.add(t + 0.05, organ(m + 12, bars * bar * 0.98, vol=v * 0.25), pan=0.3)

def pipe(t, phrase, vol=0.26, pan=0.15, low=-12):  # the reed pipe: a low, breathy flute
    return seq(S, phrase, b, t, lambda m, d: flute(m + low + 12, d * 0.96, vol=vol), pan=pan)

def pad(t, roots, inst=strings, vol=0.03):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

# ---------------------------------------------------------------- the marsh, all the way through
frogs(S, 0, END, INTRO * bar, vol=0.022, count=6)
lap(S, 0, END, INTRO * bar, vol=0.035, pan=-0.3)
bed_wind(S, 0, END, INTRO * bar, vol=0.025, smooth=50, pan=0.2)
for k in range(0, INTRO + BARS, 3):
    if rnd() < 0.7: reeds(S, k * bar + rnd(0, 2) * bar, rnd(2, 4) * b)
for k in range(1, INTRO + BARS, 5):
    if rnd() < 0.6: mosquito(S, k * bar + rnd(0, 3) * bar)
for k in (6, 21, 37, 46): heron(S, B(k) + rnd(0, 2) * b)
for k in (11, 29, 41): splash(S, B(k) + rnd(0, 3) * b, 0.05)
for k in range(2, INTRO + BARS, 4):
    if rnd() < 0.5: bubble(S, k * bar + rnd(0, 3) * bar)
for k, p in ((17, 0.85), (19, -0.85), (34, 0.9)): crane(S, B(k) + rnd(0, 2) * b, 0.05, calls=np.random.randint(2, 4), pan=p)

# 1-8: just the drone, rising out of the frogs
drone(B(1), 8, vol=0.035)

# 9-16: the Marsh tune on the reed pipe
pipe(B(9), MARSH, 0.15)
drone(B(9), 8, vol=0.04)
for k, r in enumerate(ROOTS): S.add(B(9 + k), pluckbass(r - 12, bar * 0.9, vol=0.18))

# 17-24: the cranes call; a harp plays the tune's shape in slow, bare notes; a bell rings wrong
for i, (m, d) in enumerate(M1 + M2):
    if i % 2 == 0: S.add(B(17) + sum(dd for _, dd in (M1 + M2)[:i]) * 2 * b, harp(m + 12, 2 * b, vol=0.09), pan=-0.4)
S.add(B(21), bell(82, 1.5, vol=0.05), pan=0.6)           # the B flat, high and alone
drone(B(17), 8, root=40, vol=0.03)

# 25-32: someone from Aguerekeu passing in a reed boat: the tune on marimba with a slow log-drum stroke
seq(S, MARSH, b, B(25), lambda m, d: marimba(m, d * 0.8, vol=0.19), pan=-0.2)
seq(S, M1 + M2, b, B(29), lambda m, d: flute(m + 12, d * 0.95, vol=0.1), pan=0.4)
pad(B(25), ROOTS)
for k, r in enumerate(ROOTS):
    S.add(B(25 + k), pluckbass(r - 12, 2 * b * 0.9, vol=0.16)); S.add(B(25 + k) + 2 * b, pluckbass(r - 5, 2 * b * 0.9, vol=0.12))
    S.add(B(25 + k), drum('log', 0.12), pan=-0.4); S.add(B(25 + k) + 2.5 * b, drum('tom', 0.07), pan=0.3)   # the pole

# 33-40: deeper in: the tune in pieces, on a kalimba that seems to drift off pitch (it hangs on B flat)
seq(S, [(64, 2), (67, 2), (70, 4), (None, 4), (69, 2), (70, 2), (64, 8), (None, 8)], b, B(33),
    lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.16), pan=0.5)
drone(B(33), 8, root=40, vol=0.035)
for m in (52, 58): S.add(B(35), strings(m, 4 * bar * 0.98, vol=0.03))      # E and B flat: a tritone, held

# 41-48: the reed pipe once more, and the frogs take it home
pipe(B(41), M3 + M4, 0.13)
drone(B(41), 8, vol=0.035)
for k, r in enumerate((38, 40, 38, 40)): S.add(B(41 + k), pluckbass(r - 12, bar * 0.9, vol=0.15))

L, Rr = snes_master(S.L, S.R, echo=0.33, fb=0.4, reverb=0.35, cutoff=8000)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Salt_Marsh16.ogg', loop=loop, preview='Salt_Marsh16_preview.ogg')
print('Salt_Marsh16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
