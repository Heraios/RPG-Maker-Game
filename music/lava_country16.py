# The lava-tube country: the brown basalt land between the fields, Afarohare, Namethare and the Warrens; gullies,
# narrow box canyons and sky-holes (collapses with wild gardens round them, down into the tubes). Yoon and Sib's
# country: the sky-hole, their secret place, is one of these gullies.
#   Lava_Tube_Country: wind funnelling through the canyons, swifts screaming, rock doves, pebbles skittering,
#       cicadas, and the tubes "breathing" warm air up from below. Everything echoes off the canyon walls: Yoon's
#       notes and Sib's counting call back and forth with their own echoes, as two children would shout across
#       the gullies. Further in, the Children of the Caves' melody from a tube (as in Lava_Tubes); and once, soft
#       and half there, Yoon and Sib's theme.
#   Lava_Tube_Country_Night: cold air sighing out of the tubes, crickets, bats, a barn owl; the Children of the
#       Caves come out at night, so their song is nearer, with glints of light; Yoon's notes echo, faint.
# Usage: python3 lava_country16.py day night   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A as YA, B as YB
from sib import S1, S2, SIB
from ambience import bed_wind, gust, grasshoppers, crickets, owl, twinkle, rnd
R = None
FAE1 = [(81, 1.5), (82, .5), (78, 1), (75, 1), (74, 4)]           # the Children of the Caves (D double harmonic)
FAE2 = [(74, 1), (75, 1), (78, 1), (79, 1), (81, 2), (78, 2)]
CH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 60, 64), 48: (60, 64, 67)}

def track(bpm, bars, seed, intro=1):
    np.random.seed(seed)
    b = 60 / bpm; bar = 4 * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0):
    L, Rr = snes_master(S.L, S.R, echo=0.36, fb=0.42, reverb=0.4)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def echoed(S, t, b, phrase, voice, pan=-0.4, lag=1.5, decay=(0.45, 0.2)):
    """A phrase and its echoes off the canyon walls: later, quieter, from the other side."""
    seq(S, phrase, b, t, voice(1.0), pan=pan)
    for i, v in enumerate(decay): seq(S, phrase, b, t + (i + 1) * lag * b, voice(v), pan=-pan * (0.8 if i == 0 else 0.5))

def breath(S, t, dur, vol=0.06, warm=True):                        # a tube breathing: a hollow tone in moving air
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.random.uniform(-1, 1, n); x = np.convolve(x, np.ones(40) / 40, 'same') - np.convolve(x, np.ones(400) / 400, 'same')
    f = (110 if warm else 82) * (1 + 0.01 * np.sin(2 * np.pi * 0.2 * tt))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    S.add(t, (x * 4 + tone) * np.sin(np.pi * tt / dur) ** 2 * vol, pan=rnd(-0.5, 0.5))

def swifts(S, t, vol=0.03):                                         # swifts screaming past along the gully
    pan0 = rnd(-0.9, 0.9)
    for i in range(np.random.randint(3, 6)):
        n = int(0.22 * SR); tt = np.arange(n) / SR; f = rnd(4500, 6000) * (1 - 0.15 * tt / 0.22)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 70 * tt))
        S.add(t + i * rnd(0.1, 0.3), x * np.sin(np.pi * tt / 0.22) * vol, pan=pan0 * (1 - 0.3 * i))

def dove(S, t, vol=0.05):                                           # a rock dove: coo-roo-coo
    pan = rnd(-0.7, 0.7)
    for at, d, f0 in ((0, 0.3, 300), (0.35, 0.5, 340), (0.9, 0.35, 290)):
        n = int(d * SR); tt = np.arange(n) / SR; f = f0 * (1 - 0.06 * tt / d)
        S.add(t + at, lowpass(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d), 800) * vol, pan=pan)

def pebbles(S, t, vol=0.06):                                        # a few stones skittering down, and their echo
    pan = rnd(-0.8, 0.8)
    for i in range(np.random.randint(4, 9)):
        n = int(0.03 * SR); tt = np.arange(n) / SR
        x = (np.random.uniform(-1, 1, n) + np.sin(2 * np.pi * rnd(1500, 3000) * tt)) * np.exp(-tt / 0.006)
        at = t + i * rnd(0.06, 0.15)
        S.add(at, x * vol, pan=pan); S.add(at + 0.4, x * vol * 0.35, pan=-pan * 0.6)

def cicadas(S, t, dur, vol=0.018):
    n = int(dur * SR); tt = np.arange(n) / SR; x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(3) / 3, 'same')
    S.add(t, x * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * tt)) * np.sin(np.pi * tt / dur) ** 2 * vol, pan=rnd(-0.6, 0.6))

def bats(S, t, vol=0.02):
    pan = rnd(-0.8, 0.8)
    for i in range(np.random.randint(5, 10)):
        n = int(0.015 * SR); tt = np.arange(n) / SR
        S.add(t + i * rnd(0.04, 0.09), np.sin(2 * np.pi * rnd(7000, 9000) * tt) * np.exp(-tt / 0.004) * vol, pan=pan)

kal = lambda base: (lambda v: (lambda m, d: kalimba(m, max(d * 0.7, 0.5), vol=base * v)))
flu = lambda base: (lambda v: (lambda m, d: flute(m, d * 0.9, vol=base * v)))

# ------------------------------------------------------------------ by day
def day():
    S, b, bar, t0, END, B = track(72, 40, 1201)
    bed_wind(S, 0, END, 1.0, vol=0.1, smooth=25, pan=-0.2)
    for k in range(1, 41, 3): gust(S, B(k) + rnd(0, 2 * bar), rnd(4, 7), 0.08, smooth=18, whistle=rnd(500, 900))   # wind in the canyons
    grasshoppers(S, 0, END, vol=0.012, count=3)
    for k in (1, 9, 17, 25, 33): cicadas(S, B(k), 9 * bar, 0.03)
    for k in range(1, 41, 4):
        if rnd() < 0.7: swifts(S, B(k) + rnd(0, 3 * bar))
        if rnd() < 0.5: dove(S, B(k) + rnd(0, 3 * bar))
        if rnd() < 0.5: pebbles(S, B(k) + rnd(0, 3 * bar))
    for k in range(1, 41, 5): breath(S, B(k) + rnd(0, bar), 6 * bar, 0.11)
    for m in (38, 45): S.add(0, strings(m, END + 2 * b, vol=0.022))
    # 9-16: calls across the gullies: Yoon's notes, then Sib's counting, each with its echoes
    echoed(S, B(9), b, YA[:5], kal(0.2), pan=-0.5)
    echoed(S, B(11), b, S1, flu(0.15), pan=0.5)
    echoed(S, B(13), b, YB[:5], kal(0.18), pan=-0.5)
    echoed(S, B(15), b, S2, flu(0.14), pan=0.5)
    for k, r in enumerate((50, 53, 50, 53, 50, 48, 50, 53)): S.add(B(9 + k), harp(CH[r][0], bar, vol=0.06), pan=0.1)
    # 17-24: from a tube, far off, the Children of the Caves' song
    seq(S, FAE1 + FAE2, b, B(18), lambda m, d: flute(m, d * 0.95, vol=0.09), pan=0.75)
    seq(S, FAE1 + FAE2, b, B(18) + 0.75 * b, lambda m, d: kalimba(m, max(d, 0.5), vol=0.035), pan=-0.6)
    # 25-32: once, soft and half there: Yoon and Sib's theme together (their country)
    seq(S, YA + YB, b, B(25), lambda m, d: marimba(m, d * 0.8, vol=0.15), pan=-0.3)
    seq(S, SIB, b, B(25), lambda m, d: flute(m, d * 0.9, vol=0.1), pan=0.3)
    for k, r in enumerate((50, 53, 50, 45)):
        for m in CH[r]: S.add(B(25 + k), strings(m, bar * 0.98, vol=0.03))
        S.add(B(25 + k), pluckbass(r - 12, bar * 0.9, vol=0.16))
    seq(S, (YA + YB)[:5], b, B(29) + 2 * b, lambda m, d: kalimba(m + 12, 0.5, vol=0.06), pan=0.6)   # its echo, fading
    # 33-40: the canyon again; one call, and its echoes
    echoed(S, B(35), b, YA[:3], kal(0.2), pan=0.5)
    finish(S, 'Lava_Tube_Country', t0, END, gain=0.85)

# ------------------------------------------------------------------ by night
def night():
    S, b, bar, t0, END, B = track(60, 32, 1211)
    bed_wind(S, 0, END, 1.0, vol=0.08, smooth=40, pan=-0.2)
    crickets(S, 0, END, 1.0, 0.02)
    for k in range(1, 33, 4): breath(S, B(k) + rnd(0, bar), 5 * bar, 0.08, warm=False)   # cold air out of the tubes
    for k in range(1, 33, 3):
        if rnd() < 0.6: bats(S, B(k) + rnd(0, 2 * bar))
        if rnd() < 0.6: twinkle(S, B(k) + rnd(0, 2 * bar), 0.02)       # the Children's lights
    for k in (6, 20): owl(S, B(k) + rnd(0, bar), 0.05)
    pebbles(S, B(13), 0.05)
    for m in (38, 45): S.add(0, strings(m, END + 2 * b, vol=0.025))
    # 5-12: the Children of the Caves, nearer tonight
    seq(S, FAE1 + FAE2, b, B(5), lambda m, d: flute(m, d * 0.95, vol=0.1), pan=0.5)
    seq(S, FAE1 + FAE2, b, B(5) + 0.75 * b, lambda m, d: kalimba(m, max(d, 0.5), vol=0.06), pan=-0.4)
    for k, r in enumerate((38, 38, 39, 38, 38, 45, 39, 38)):
        S.add(B(5 + k), harp(r + 24, 2 * b, vol=0.05), pan=0.3)
    # 17-24: Yoon's notes, faint, echoing in the dark
    echoed(S, B(17), b, YA[:5], kal(0.16), pan=-0.5)
    echoed(S, B(21), b, YA[5:], kal(0.14), pan=0.5)
    finish(S, 'Lava_Tube_Country_Night', t0, END, gain=0.7)

ALL = dict(day=day, night=night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
