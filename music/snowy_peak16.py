import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from wind_tune import W1, W2, W3, W4, ROOTS, CH
from yoon import A as YA
from ambience import bed_wind, gust, rnd
np.random.seed(851)
R = None
# Snowy_Peak: above the snow line, where the party gathers snow in an urn (it will be Yoon's brain). The Lady
# of the Wind's place: strict, beautiful, always moving. Mostly ambience: a hard wind, gusts whistling over
# the rocks, snow crunching underfoot, ice creaking, an eagle far off. The Lady's own leitmotif (new; see
# wind_tune.py) sung by a "wind choir": wordless voices that swell and bend in pitch with the gusts, so her
# voice is the wind. One high flute. And near the end, Yoon's theme frozen: long, glassy bell notes over a D,
# the last ingredient (the body is nearly whole).
#   1-8 the wind   9-14 her voice: the gust falls, the gust rises   15-20 one high flute, her cold arc and sigh
#   21-26 the wind, ice   27-32 her voice again, with low strings, stricter   33-38 Yoon's theme, frozen   39-40 wind
bpm = 60; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 40
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def voice(m, dur, vol=0.1):
    """The wind choir: soft 'ooh' voices whose pitch drifts and bends like the wind, swelling and fading."""
    probe = choir(m, 0.01)
    if not isinstance(probe, np.ndarray): return choir(m, dur, vol=vol)     # (writing the BeepBox version)
    n = int(dur * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    for dt in (-0.004, 0.004):
        ph0 = rnd(0, 6.3)
        bend = 1 + 0.009 * np.sin(2 * np.pi * 0.31 * tt + ph0) + 0.005 * np.sin(2 * np.pi * 0.83 * tt + 2 * ph0)
        f = hz(m) * (1 + dt) * bend
        ph = 2 * np.pi * np.cumsum(f) / SR
        out += sum(a * np.sin(ph * k) for k, a in ((1, 1.0), (2, 0.35), (3, 0.2), (4, 0.06)))
    breath = lowpass(np.random.uniform(-1, 1, n), 2500) * 0.15
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * tt / rnd(3.5, 6) + rnd(0, 6.3))
    return (out / 2 + breath) * swell * adsr(n, a=min(0.6, dur / 3), d=0.2, s=0.9, r=min(0.9, dur / 3)) * vol

def crunch(t, steps=6, vol=0.05):                                  # boots in the snow
    for i in range(steps):
        n = int(0.18 * SR); tt = np.arange(n) / SR; x = np.random.uniform(-1, 1, n)
        grit = (np.random.uniform(0, 1, n) > 0.92).astype(float)
        x = lowpass(x * (0.3 + grit), 3500) * np.sin(np.pi * tt / 0.18)
        S.add(t + i * 0.62 + rnd(-0.04, 0.04), x * vol, pan=(-0.15, 0.15)[i % 2])

def ice(t, vol=0.06):                                              # ice settling: a low groan, then a crack
    n = int(1.2 * SR); tt = np.arange(n) / SR; f = 160 + 60 * tt
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.sin(2 * np.pi * 9 * tt) > 0.3) * np.sin(np.pi * tt / 1.2)
    S.add(t, lowpass(x, 800) * vol, pan=rnd(-0.6, 0.6))
    m = int(0.05 * SR); S.add(t + 1.25, np.random.uniform(-1, 1, m) * np.exp(-np.arange(m) / SR / 0.008) * vol * 1.5, pan=rnd(-0.6, 0.6))

def eagle(t, vol=0.04):                                            # a thin, far scream, falling
    n = int(0.9 * SR); tt = np.arange(n) / SR; f = 2300 - 700 * tt / 0.9
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.4 * np.sin(2 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * tt))
    S.add(t, x * np.sin(np.pi * tt / 0.9) * vol, pan=rnd(-0.8, 0.8))

def chords(t, roots, inst=strings, vol=0.025):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

# the peak, all the way through: a hard wind and a lower moan under it, gusts that whistle
bed_wind(S, 0, END, 1.0, vol=0.08, smooth=25, pan=-0.2)
bed_wind(S, 0, END, 1.0, vol=0.06, smooth=90, pan=0.3)
for k in range(1, BARS, 2): gust(S, B(k) + rnd(0, 2 * bar), rnd(4, 8), rnd(0.05, 0.08), smooth=18, whistle=rnd(700, 1400))
for k in (3, 12, 22, 29, 37): crunch(B(k) + rnd(0, bar), np.random.randint(5, 9))
for k in (6, 18, 24, 35): ice(B(k) + rnd(0, bar))
for k in (5, 23): eagle(B(k) + rnd(0, bar))
for m in (40, 47): S.add(0, strings(m, B(33) + 2 * b, vol=0.025))           # E and B, held, until Yoon's D

# 9-14: her voice: the gust falls, the gust rises
seq(S, W1 + W2, b, B(9), lambda m, d: voice(m, d * 1.05, 0.1), pan=0.1)
chords(B(9), ROOTS[:6], inst=lambda m, d, vol: voice(m - 12, d, vol), vol=0.025)

# 15-20: one high flute: her cold arc, and the sigh; the voices hold her chords under it
seq(S, W3 + W4, b, B(15), lambda m, d: flute(m + 12, d * 0.95, vol=0.12), pan=-0.3)
chords(B(15), ROOTS[6:], inst=lambda m, d, vol: voice(m - 12, d, vol), vol=0.03)

# 27-32: her voice again, stricter: low strings in unison with it
seq(S, W1 + W2, b, B(27), lambda m, d: voice(m, d * 1.05, 0.11), pan=-0.1)
seq(S, W1 + W2, b, B(27), lambda m, d: strings(m - 24, d * 0.97, vol=0.07), pan=0.2)
chords(B(27), ROOTS[:6], vol=0.025)
for k in range(6): S.add(B(27 + k), timpani(ROOTS[k], 0.08))

# 33-38: Yoon's theme, frozen: long, glassy bells over a D; the voices hold D minor
for m in (38, 45): S.add(B(33), strings(m, 6 * bar + 2 * b, vol=0.03))
for m in (62, 65, 69): S.add(B(33), voice(m, 6 * bar * 0.98, 0.02))
t = B(33) + b
for m, d in YA:
    S.add(t, bell(m + 12, 2.5, vol=0.06), pan=-0.2); S.add(t + 0.05, bell(m + 24, 2.0, vol=0.025), pan=0.4)
    t += 2 * d * b

L, Rr = snes_master(S.L, S.R, echo=0.38, fb=0.45, reverb=0.5, cutoff=8000)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Snowy_Peak16.ogg', loop=loop, preview='Snowy_Peak16_preview.ogg', gain=0.8)
print('Snowy_Peak16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
