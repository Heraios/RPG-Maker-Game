import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import bed_wind, trill, creak, raven, rnd
np.random.seed(691)
R = None
# The Hunt: tracking the Great Boar with Pada. Quiet and tense. Wind in the trees, birds, a heartbeat drum,
# Pada's careful footsteps. His warm D-major tune turned minor and hesitant on a low flute. His horn call is
# held back: it starts (D... A...) and stops. Something grunts far off; the birds go quiet; the heartbeat
# quickens; the strings shiver. At the end of the loop the call gets one note further (D A D) and still
# isn't blown. (When it finally is, that's Boss_Great_Boar.)
#   1-8 the forest, stalking   9-16 Pada's tune, minor; the call held back   17-20 a grunt; the birds stop
#   21-28 closer: shivering strings, his tune low on brass, a second grunt   29-32 the heartbeat, and the call, almost
bpm = 72; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 32
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
THEME = [(74, 1), (69, .5), (74, .5), (78, 1), (76, 1), (74, 1.5), (71, .5), (69, 2), (71, 1), (74, 1), (76, 1), (78, 1), (76, 3), (R, 1),
         (78, 1), (81, 1), (83, 1), (81, .5), (78, .5), (76, 1), (74, 1), (71, 2), (69, 1), (71, .5), (74, .5), (76, 1), (78, .5), (76, .5), (74, 3), (R, 1)]
MINOR = {78: 77, 71: 70, 83: 82}
HUNT = [(MINOR.get(m, m), d) for m, d in THEME]                   # Pada's tune, in D minor
ROOTS = [50, 43, 46, 45, 50, 45, 43, 50]                          # Dm Gm Bb A | Dm A Gm Dm
CH = {50: (62, 65, 69), 43: (55, 58, 62), 46: (58, 62, 65), 45: (57, 61, 64)}

def heartbeat(t, vol=0.2):
    S.add(t, drum('kick', vol)); S.add(t, timpani(26, vol * 0.4)); S.add(t + 0.3, drum('kick', vol * 0.55))

def steps(t, bars, vol=0.05):                                      # Pada, placing each foot carefully
    for k in range(bars * 2):
        n = int(0.06 * SR); tt = np.arange(n) / SR
        x = lowpass(np.random.uniform(-1, 1, n), 900) * np.exp(-tt / 0.015) * 3
        S.add(t + k * 2 * b + rnd(-0.05, 0.05), x * vol, pan=(-0.2, 0.2)[k % 2])

def snap(t, vol=0.14):                                             # a twig
    n = int(0.08 * SR); tt = np.arange(n) / SR
    x = np.random.uniform(-1, 1, n) * (np.exp(-tt / 0.004) + 0.5 * np.exp(-np.abs(tt - 0.03) / 0.003))
    S.add(t, x * vol, pan=rnd(-0.6, 0.6))

def grunt(t, vol=0.12, pan=0.6):                                   # the boar: two snorts and a low grunt
    for i, (d, f0) in enumerate(((0.12, 140), (0.12, 150), (0.45, 95))):
        n = int(d * SR); tt = np.arange(n) / SR; f = f0 * (1 - 0.25 * tt / d)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + np.random.uniform(-0.6, 0.6, n)
        S.add(t + (0, 0.2, 0.45)[i], lowpass(x, 700) * np.sin(np.pi * tt / d) * vol, pan=pan)

def shiver(t, beats, notes, v0, v1):                               # strings trembling in sixteenths
    steps_ = int(beats * 4)
    for i in range(steps_):
        for m in notes: S.add(t + i * b / 4, stab(m, b / 4 * 0.95, vol=v0 + (v1 - v0) * i / steps_), pan=(-0.3, 0.3)[i % 2])

# ---------------------------------------------------------------- the forest, all the way through
bed_wind(S, 0, END, 2.0, vol=0.055, smooth=40)
for m in (38, 45): S.add(0, strings(m, END + 2 * b, vol=0.06))
for k in range(1, 17, 2):
    if rnd() < 0.7: trill(S, B(k) + rnd(0, 2 * bar), rnd(0.03, 0.05))      # birds, until the grunt
for k in range(0, BARS, 6): creak(S, B(k + 1) + rnd(0, bar), 0.04)
raven(S, B(4) + b, 0.05, caws=2)
for k in range(BARS):                                              # the heartbeat: once a bar, then twice
    fast = 17 <= k + 1 <= 28
    heartbeat(B(k + 1), 0.24 + (0.06 if fast else 0))
    if fast: heartbeat(B(k + 1) + 2 * b, 0.24)
steps(B(1), 16, 0.08); steps(B(29), 4, 0.08)
snap(B(6) + 1.5 * b); snap(B(14) + 2.5 * b, 0.1)

# 9-16: Pada's tune, minor and hesitant, on a low flute; then the call: D... A... and nothing
seq(S, HUNT[:14], b, B(9), lambda m, d: flute(m - 12, d * 0.92, vol=0.17), pan=-0.15)
for k, r in enumerate(ROOTS[:4]):
    for m in CH[r]: S.add(B(9 + k), strings(m - 12, bar * 0.98, vol=0.03))
    S.add(B(9 + k), pluckbass(r - 12, bar * 0.9, vol=0.18))
seq(S, [(74, 2), (R, 2), (69, 2)], b, B(13), lambda m, d: brass(m - 12, d * 0.9, vol=0.12), pan=-0.4)
shiver(B(15), 8, (62, 63), 0.004, 0.015)

# 17-20: a grunt, far off. The birds have stopped
grunt(B(17) + b, 0.08, 0.7)
S.add(B(17), timpani(38, 0.15))

# 21-28: closer: shivering strings, his tune low on brass, a second grunt, nearer
shiver(B(21), 32, (62, 65), 0.012, 0.03)
seq(S, [(m, d * 2) for m, d in HUNT[14:]], b, B(21), lambda m, d: brass(m - 24, d * 0.9, vol=0.16), pan=-0.1)
seq(S, [(m, d * 2) for m, d in HUNT[14:]], b, B(21), lambda m, d: flute(m - 12, d * 0.9, vol=0.1), pan=0.3)
for k, r in enumerate(ROOTS[4:]):
    for m in CH[r]: S.add(B(21 + 2 * k), strings(m - 12, 2 * bar * 0.98, vol=0.035))
    S.add(B(21 + 2 * k), pluckbass(r - 12, 2 * bar * 0.9, vol=0.2)); S.add(B(21 + 2 * k), timpani(r - 12, 0.12))
grunt(B(25) + 2 * b, 0.14, -0.4)
snap(B(27) + b, 0.16)

# 29-32: the heartbeat; the call, almost: D, A, D... and the top note never comes
seq(S, [(74, 2), (R, 2), (69, 2), (R, 2), (74, 2), (R, 6)], b, B(29), lambda m, d: brass(m - 12, d * 0.9, vol=0.14), pan=-0.4)

L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.34, reverb=0.3)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Hunt16.ogg', loop=loop, preview='Hunt16_preview.ogg', gain=0.85)
print('Hunt16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
