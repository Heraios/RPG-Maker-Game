import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from marsh_tune import LULL1, LULL2
from ambience import *
np.random.seed(421)
R = None
# The Hag Roost: crane-nest huts in the deep salt marsh. The Marsh tune made a lullaby in 3/4, hummed and
# plucked: sweet, and wrong (it leans on B flat; the accompaniment lags). And faintly under it, out of step,
# a music box playing Queen Tou's minuet: something of the First Sailors down here, very old. Fewer frogs
# than out in the marsh (they keep away); cranes, creaking nests, bone-and-shell chimes, still water.
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]   # Tou (party16.py)
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
CH = {40: (52, 55, 59), 45: (57, 60, 64), 47: (59, 63, 66), 36: (48, 52, 55), 'dim': (52, 55, 58), 43: (55, 59, 62)}
L1 = [40, 45, 47, 40]                     # Em Am B Em
L2 = [36, 'dim', 45, 40]                  # C, E diminished (the B flat), Am, Em
bpm = 66; b = 60 / bpm; bar = 3 * b
INTRO = 2; BARS = 40
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def rock(t, roots, vol=1.0, lag=0.06):    # a cradle-rocking harp: low note, then the chord twice, a hair late
    for k, r in enumerate(roots):
        at = t + k * bar; ch = CH[r]; low = (40 if r == 'dim' else r) - 12
        S.add(at, harp(low + 12, bar * 0.9, vol=0.11 * vol), pan=-0.3)
        for j in (1, 2):
            for i, m in enumerate(ch): S.add(at + j * b + lag + i * 0.02, harp(m + 12, b * 0.8, vol=0.05 * vol), pan=0.35)

def hum(t, phrase, vol=0.07):              # the Hags humming it (a choir, low, and a thin reed over it)
    seq(S, phrase, b, t, lambda m, d: choir(m - 12, d * 0.97, vol=vol))
    seq(S, phrase, b, t, lambda m, d: flute(m, d * 0.95, vol=vol * 0.9), pan=-0.15)

def musicbox(t, phrase, vol=0.05, pan=0.6):  # Tou's minuet, faint and far: bell and kalimba
    seq(S, phrase, b, t, lambda m, d: bell(m + 12, max(d * 0.6, 0.4), vol=vol), pan=pan)
    seq(S, phrase, b, t, lambda m, d: kalimba(m + 12, max(d * 0.6, 0.4), vol=vol * 1.5), pan=pan)

# ---------------------------------------------------------------- the roost, all the way through
lap(S, 0, END, INTRO * bar, vol=0.025, pan=-0.3)
frogs(S, 0, END, INTRO * bar, vol=0.012, count=2, rate=0.3)
bed_wind(S, 0, END, INTRO * bar, vol=0.03, smooth=60, pan=0.2)
for k in range(0, INTRO + BARS, 3):
    if rnd() < 0.6: creak(S, k * bar + rnd(0, 2) * bar, 0.06)
for k in range(1, INTRO + BARS, 4):
    if rnd() < 0.7: clacks(S, k * bar + rnd(0, 3) * bar, 0.04)
for k, p in ((2, -0.8), (11, 0.85), (24, -0.7), (31, 0.9), (38, -0.85)): crane(S, B(k) + rnd(0, 2) * b, 0.05, calls=np.random.randint(1, 3), pan=p)
for k in range(3, INTRO + BARS, 5): bubble(S, k * bar + rnd(0, 3) * bar, 0.04)
mosquito(S, B(17)); mosquito(S, B(33))

# 1-4: the nests creak; the chimes knock; a low drone
for m in (40, 47): S.add(B(1), organ(m, 4 * bar * 0.99, vol=0.03))

# 5-12: the lullaby: hummed, the harp rocking the cradle, a hair late
hum(B(5), LULL1 + LULL2)
rock(B(5), L1 + L2)

# 13-20: under the drone, far off and out of step: Tou's minuet on a music box; the cradle keeps rocking
for m in (40, 47): S.add(B(13), organ(m, 8 * bar * 0.99, vol=0.03))
musicbox(B(13) + 0.5 * b, T1 + T2, 0.045)
rock(B(13), L1 + L1, 0.6, lag=0.1)

# 21-28: the lullaby again, and the music box at the same time, half a beat behind it
hum(B(21), LULL1 + LULL2, 0.08)
rock(B(21), L1 + L2, 0.9)
musicbox(B(21) + 0.5 * b, T1 + T2, 0.035, pan=-0.6)

# 29-36: only the humming, alone, slower; then nothing but the marsh
hum(B(29), [(m, d * 1.5) for m, d in LULL1][:4], 0.06)
for m in (52, 58): S.add(B(29), strings(m, 6 * bar * 0.98, vol=0.025))     # E and B flat

# 37-40: the music box, three notes, and stops
musicbox(B(38), T1[:3], 0.04)

L, Rr = snes_master(S.L, S.R, echo=0.38, fb=0.45, reverb=0.45, cutoff=7500)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Hag_Roost16.ogg', loop=loop, preview='Hag_Roost16_preview.ogg')
print('Hag_Roost16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
