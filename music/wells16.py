import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import drip, lap, rnd
np.random.seed(671)
R = None
# The Wells: freeing one of the Lady's daughters from a First Sailor well. Water, stone and long echoes:
# drops falling a long way, water lapping far below, stone grinding, a low hum in the old work. Two tunes
# tangled together: Tou's minuet (the First Sailors built the well) on a music box, and Falmi's theme (the
# Lady's tune, so the daughter's) bent into Tou's key and her 3/4 time, on a low flute: the daughter's voice.
#   1-8   the well                         9-16  Tou's minuet, from far below
#   17-20 the daughter's tune, alone       21-28 both at once, tangled, the strings growing
#   29-32 Falmi's own sprouting notes, in F, once: a glimpse of the forest (hope)
#   33-36 the well again
bpm = 72; b = 60 / bpm; bar = 3 * b
BARS = 36
S = Stereo(BARS * bar)
END = BARS * bar
B = lambda n: (n - 1) * bar
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]   # Tou, E minor
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
FE = [(83, 1), (79, .5), (76, .5), (79, 1), (83, 2), (84, 1), (83, .5), (81, .5), (79, 1), (78, 1), (79, 1), (76, 2)]   # Falmi's, in E minor, 3/4
FE2 = [(84, 1), (83, .5), (81, .5), (79, 1), (78, 2), (83, 1), (81, .5), (79, .5), (78, 1), (75, 1), (76, 3)]
TCH = [(40, 'm'), (42, 'M'), (48, 'M'), (47, 'M'), (40, 'm'), (43, 'M'), (50, 'M'), (40, 'm')]
FCH = [(40, 'm'), (48, 'M'), (47, 'M'), (40, 'm'), (45, 'm'), (47, 'M'), (47, 'M'), (40, 'm')]

def triad(r, q): return (r + 12, r + 12 + (4 if q == 'M' else 3), r + 19)

def swell(n, a, r):
    t = np.arange(n) / SR
    return np.clip(t / a, 0, 1) * np.clip((n / SR - t) / r, 0, 1)

def hum(t, dur, vol=0.05):                                         # the old work's low hum, wavering
    n = int(dur * SR); tt = np.arange(n) / SR; f = 55 * (1 + 0.004 * np.sin(2 * np.pi * 0.3 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    S.add(t, (np.sin(ph) + 0.3 * np.sin(3 * ph) + 0.15 * np.sin(5.04 * ph)) * swell(n, 3, 3) * vol)

def grind(t, vol=0.06):                                            # stone shifting against stone
    n = int(rnd(1.2, 2.2) * SR); x = lowpass(np.random.uniform(-1, 1, n), 250) * 8
    k = np.random.uniform(0, 1, int(n / SR * 30) + 2); judder = np.interp(np.arange(n) / SR * 30, np.arange(len(k)), k)
    S.add(t, x * judder * swell(n, 0.3, 0.5) * vol, pan=rnd(-0.5, 0.5))

def air(t, dur, vol=1.0):                                          # the shaft's hollow breath
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(60) / 60, 'same') - np.convolve(x, np.ones(600) / 600, 'same')
    S.add(t, x * swell(n, 4, 4) * vol * 4, pan=rnd(-0.6, 0.6))

def deep_drip(t, vol=0.06):                                        # a drop falling a long way: plink, and a hollow echo
    drip(S, t, vol); drip(S, t + rnd(0.35, 0.6), vol * 0.35)

def musicbox(m, d, vol=0.2):
    x = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
    n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))

def waltz(t, chords, vol=0.04, inst=harp):                         # one, two, three: bass, then a chord twice
    for k, (r, q) in enumerate(chords):
        at = t + k * bar
        S.add(at, inst(r, b, vol=vol * 4), pan=-0.2)
        for j in (1, 2):
            for m in triad(r, q): S.add(at + j * b, inst(m, b * 0.5, vol=vol), pan=(-0.4, 0.4)[j - 1])

# ---------------------------------------------------------------- the well, all the way through
lap(S, 0, END, 1.0, 0.06, pan=-0.2)
for s in range(0, BARS, 6): hum(B(s + 1), 7 * bar, 0.14)
for m in (40, 47): S.add(0, strings(m, END + 2 * b, vol=0.06)); S.add(0, organ(m - 12, END + 2 * b, vol=0.03))
for k in range(0, BARS, 4): air(B(k + 1) + rnd(0, bar), 7 * bar, 0.07)
t = 0.3
while t < END - 0.5: deep_drip(t, rnd(0.05, 0.09)); t += rnd(0.8, 3.0)
for k in (6, 19, 34): grind(B(k) + rnd(0, bar), 0.12)

# 9-16: Tou's minuet, far below
seq(S, T1 + T2, b, B(9), lambda m, d: musicbox(m, d, 0.11), pan=0.4)
waltz(B(9), TCH, 0.025)

# 17-20: the daughter's tune, alone, on a low flute, a soft choir sighing under it
seq(S, FE, b, B(17), lambda m, d: flute(m - 12, d * 0.95, vol=0.26), pan=-0.2)
for k, (r, q) in enumerate(FCH[:4]):
    for m in triad(r, q): S.add(B(17 + k), choir(m, bar * 0.98, vol=0.025))

# 21-28: both at once, tangled; the strings growing
seq(S, T1 + T2, b, B(21), lambda m, d: musicbox(m, d, 0.15), pan=0.4)
seq(S, FE + FE2, b, B(21), lambda m, d: flute(m - 12, d * 0.95, vol=0.26), pan=-0.3)
waltz(B(21), TCH, 0.03)
for k, (r, q) in enumerate(TCH):
    for m in triad(r, q): S.add(B(21 + k), strings(m, bar * 0.98, vol=0.025 + 0.004 * k))
seq(S, FE2, b, B(25), lambda m, d: strings(m - 24, d * 0.97, vol=0.08), pan=0.1)

# 29-32: a glimpse of the forest: Falmi's sprout, in F, once, high and clear; then the well closes in again
for i, g in enumerate(((77, 81), (77, 81, 84), (77, 81, 84, 89))):
    for j, m in enumerate(g): S.add(B(29 + i) + j * b / 2, kalimba(m, b * (1.5 if j == len(g) - 1 else 0.5), vol=0.2), pan=0.2)
for m in (53, 60, 65): S.add(B(29), strings(m, 3 * bar * 0.98, vol=0.04))
S.add(B(32), musicbox(75, 2 * b, 0.1), pan=0.4)

L, Rr = snes_master(S.L, S.R, echo=0.45, fb=0.5, reverb=0.6, cutoff=7000)
L, Rr, loop = finish_loop(L, Rr, 0, END)
save_stereo(L, Rr, 'Wells16.ogg', loop=loop, preview='Wells16_preview.ogg', gain=0.75)
print('Wells16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
