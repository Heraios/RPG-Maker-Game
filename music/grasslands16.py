import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
from ambience import *
np.random.seed(371)
R = None
# The grasslands: the upland terraces, barley and vines, goats. Mostly ambience: a warm wind in the grass,
# crickets, skylarks, goat bells. The Island tune drifts in on the wind, as if from a village over the hill;
# two herders whistle its call and answer to each other across the valley (the Canary silbo); then the
# tune walks along with you for a while, unhurried, before it drifts off again.
bpm = 80; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 56
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def far(t, phrase, vol=0.12, pan=0.7):                   # from over the hill: quiet, soft, off to one side
    seq(S, phrase, b, t, lambda m, d: kalimba(m, max(d, 0.4), vol=vol), pan=pan)
    seq(S, phrase, b, t, lambda m, d: flute(m + 12, d * 0.9, vol=vol * 0.35), pan=pan)
    for k in range(int(sum(d for m, d in phrase) // 4)):
        for j, kind in LOG: S.add(t + k * bar + j * b, drum(kind, 0.05), pan=pan)

def whistle(t, phrase, vol=0.2, pan=-0.6):              # a herder's whistle: high, bright, sliding into notes
    for m, d in phrase:
        if m is not None:
            S.add(t, flute(m + 12, d * 0.9, vol=vol), pan=pan)
        t += d * b
    return t

def strum(t, roots, vol=0.06, beats=4):                  # a harp strummed lazily, like someone walking with a lute
    for k, r in enumerate(roots):
        at = t + k * beats * b
        for j, m in enumerate(CH[r] + (CH[r][0] + 12,)): S.add(at + j * 0.05, harp(m, beats * b * 0.9, vol=vol), pan=-0.3 + j * 0.15)
        if beats >= 4:
            for j, m in enumerate(CH[r]): S.add(at + 2 * b + j * 0.04, harp(m + 12, 2 * b * 0.9, vol=vol * 0.6), pan=0.3)

# ---------------------------------------------------------------- the land, all the way through
bed_wind(S, 0, END, INTRO * bar, vol=0.06, smooth=60, pan=-0.1)        # a soft, warm wind (low, rounded)
crickets(S, 0, END, INTRO * bar, vol=0.015)
for k in range(0, INTRO + BARS, 4): gust(S, k * bar + rnd(0, 3) * bar, rnd(6, 10) * b, 0.05, smooth=50)
for k in range(1, INTRO + BARS, 6):
    if rnd() < 0.8: lark(S, k * bar + rnd(0, 4) * bar, rnd(3, 6))
for k in (4, 13, 22, 31, 38, 46, 53): goatbells(S, B(k) + rnd(0, 2) * b, rnd(1.5, 3) * bar, 0.03)

# 1-8: open land; a few lazy harp chords
strum(B(1), [43, 48], vol=0.05, beats=8); strum(B(5), [40, 43], vol=0.045, beats=8)

# 9-16: on the wind, a village somewhere playing the tune, faint, in pieces
far(B(9), CALL1 + ANS1, 0.1, pan=0.7)
far(B(14), ANS1, 0.07, pan=0.75)
strum(B(13), [48, 43], vol=0.04, beats=8)

# 17-24: two herders whistle to each other across the valley: the call here, the answer from far away
t = whistle(B(17), CALL1, 0.11, pan=-0.6)
whistle(t, ANS1, 0.055, pan=0.75)
t = whistle(B(21), CALL2, 0.11, pan=-0.6)
whistle(t, ANS2, 0.055, pan=0.75)
for k, r in enumerate(ROOTS): S.add(B(17 + k), strings(CH[r][0] - 12, bar * 0.98, vol=0.035))

# 25-36: the tune walks with you: harp strums, a walking bass, a flute, soft hand drums
strum(B(25), ROOTS, 0.03)
seq(S, TUNE, b, B(25), lambda m, d: flute(m + 12, d * 0.93, vol=0.13), pan=0.2)
seq(S, HARM, b, B(25), lambda m, d: kalimba(m, max(d, 0.4), vol=0.08), pan=-0.4)
for k, r in enumerate(ROOTS + ROOTS[:4]):
    at = B(25 + k); low = r - 12 if r > 40 else r
    for j, iv in ((0, 0), (2, 7)): S.add(at + j * b, pluckbass(low + iv, 2 * b * 0.9, vol=0.15))
    for j, kind in LOG: S.add(at + j * b, drum(kind, 0.06), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    for j in range(8): S.add(at + j * b / 2, drum('shaker', 0.015 if j % 2 else 0.01), pan=0.45)
seq(S, ANS1 + ANS2, b, B(33), lambda m, d: marimba(m, d * 0.8, vol=0.1), pan=-0.2)   # 33-36: just the answers
strum(B(33), [40, 43, 41, 43], 0.035)

# 37-44: it drifts off; just the land; the flat-seventh answer once more, far away
far(B(39), ANS2, 0.07, pan=-0.75)
strum(B(41), [41, 43], vol=0.035, beats=8)

# 45-56: evening coming: the tune at half speed on a kalimba, over the crickets; then the wind alone
half = [(m, d * 2) for m, d in CALL1 + ANS1]
seq(S, half, b, B(45), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.18), pan=0.2)
for k, r in enumerate((43, 43, 48, 48, 40, 40, 38, 43)): S.add(B(45 + k), strings(CH[r][1], bar * 0.98, vol=0.03))
strum(B(53), [43], vol=0.035, beats=16)

L, Rr = snes_master(S.L, S.R, echo=0.28, fb=0.32, reverb=0.3)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Grasslands16.ogg', loop=loop, preview='Grasslands16_preview.ogg')
print('Grasslands16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
