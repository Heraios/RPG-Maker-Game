# Inside versions of the settlement themes: the same place heard from indoors. Its outdoor sounds come
# muffled through the walls, a fire crackles in the hearth, and its tune is played small and homely.
# Usage: python3 inside16.py zonfahare mansehare aguerekeu   (or no names for all of them)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
import marsh_tune as marsh
from ambience import *
R = None

def track(name, bpm, bars, seed):
    np.random.seed(seed)
    b = 60 / bpm; bar = 4 * b; intro = 1
    S = Stereo((intro + bars) * bar)
    return S, b, bar, intro * bar, (intro + bars) * bar

def strum(S, t, b, roots, vol=0.06, beats=4, chords=CH):
    for k, r in enumerate(roots):
        for j, m in enumerate(chords[r]): S.add(t + k * beats * b + j * 0.04, harp(m, beats * b * 0.9, vol=vol), pan=-0.3 + j * 0.2)

def bassline(S, t, b, roots, vol=0.22, beats=4):
    for k, r in enumerate(roots): S.add(t + k * beats * b, pluckbass((r - 12 if r > 40 else r), beats * b * 0.85, vol=vol))

def finish(S, name, t0, end):
    L, Rr = snes_master(S.L, S.R, echo=0.18, fb=0.22, reverb=0.16, cutoff=8000)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg')
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

# ------------------------------------------------------------------ Zonfahare, indoors
def zonfahare():
    """A house in the main town: the market through the walls, the telegraph faintly, the hearth. The Island tune
    on a kalimba by the fire; a flute takes the calls; then slow, like someone humming while they work."""
    S, b, bar, t0, END = track('Zonfahare_Inside', 84, 24, 501)
    B = lambda n: t0 + (n - 1) * bar
    out = Muffle(S, 450)
    crowd(out, 0, END, 1.0, 0.05, pan=0.5); hearth(S, 0, END, 1.0, 0.1)
    for at in (0.3, B(9), B(19)): telegraph(out, at, 'ZONFAHARE', b / 4, 0.2, pan=0.6)
    seq(S, TUNE, b, B(1), lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.26), pan=-0.1)
    strum(S, B(1), b, ROOTS, 0.05); bassline(S, B(1), b, ROOTS)
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.93, vol=0.2), pan=0.3)
        t = seq(S, ans, b, t, lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.22), pan=-0.2)
    strum(S, B(9), b, ROOTS, 0.045); bassline(S, B(9), b, ROOTS, 0.2)
    for k in range(8): S.add(B(9 + k), drum('log', 0.06), pan=-0.4)
    seq(S, [(m, d * 2) for m, d in CALL1 + ANS1], b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.2), pan=0.1)
    strum(S, B(17), b, [43, 48, 40, 43], 0.04, beats=8); bassline(S, B(17), b, [43, 48, 40, 43], 0.18, beats=8)
    finish(S, 'Zonfahare_Inside', t0, END)

# ------------------------------------------------------------------ Mansehare, indoors
def mansehare():
    """A house in the shore town: the surf and gulls through the walls, the timbers creaking, the hearth. The Island
    tune on a harp; the friendly fanfare on a soft flute under its answers; the divers' bells."""
    S, b, bar, t0, END = track('Mansehare_Inside', 84, 24, 511)
    B = lambda n: t0 + (n - 1) * bar
    out = Muffle(S, 500)
    surf(out, 0, END, 1.0, 0.09, period=6.4, pan=0.5); hearth(S, 0, END, 1.0, 0.1)
    for k in range(1, 26, 4):
        if rnd() < 0.7: gull(out, k * bar + rnd(0, 3) * bar, 0.07, calls=2)
    for k in range(0, 26, 3):
        if rnd() < 0.7: creak(S, k * bar + rnd(0, 2) * bar, 0.04)
    for at in (0.3, B(13)): telegraph(out, at, 'MANSEHARE', b / 4, 0.2, pan=0.6)
    FRIEND = [(R, 8), (67, 1), (74, 1), (67, .5), (69, .5), (71, 2), (R, 3),
              (R, 8), (65, 1), (72, 1), (65, .5), (67, .5), (69, 2), (R, 3)]
    seq(S, TUNE, b, B(1), lambda m, d: harp(m + 12, max(d, 0.6), vol=0.24), pan=-0.1)
    seq(S, FRIEND, b, B(1), lambda m, d: flute(m, d * 0.9, vol=0.13), pan=0.35)
    strum(S, B(1), b, ROOTS, 0.04); bassline(S, B(1), b, ROOTS)
    slow = [(m, d * 2) for m, d in ANS1 + ANS2]
    seq(S, slow, b, B(9), lambda m, d: bell(m + 12, max(d * 0.5, 0.8), vol=0.1), pan=-0.2)
    strum(S, B(9), b, [43, 43, 48, 43, 43, 38, 41, 43], 0.04); bassline(S, B(9), b, [43, 43, 48, 43, 43, 38, 41, 43], 0.2)
    seq(S, TUNE, b, B(17), lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.2), pan=0.2)
    seq(S, TUNE, b, B(17), lambda m, d: harp(m, max(d, 0.6), vol=0.1), pan=-0.3)
    strum(S, B(17), b, ROOTS, 0.035); bassline(S, B(17), b, ROOTS, 0.2)
    finish(S, 'Mansehare_Inside', t0, END)

# ------------------------------------------------------------------ Aguerekeu, indoors
def aguerekeu():
    """A stilt house in the marsh: water slapping right under the floor, frogs through the reed walls, the hearth.
    The Island tune on a kalimba, the Marsh tune on a low reed pipe winding under it."""
    S, b, bar, t0, END = track('Aguerekeu_Inside', 80, 24, 521)
    B = lambda n: t0 + (n - 1) * bar
    out = Muffle(S, 600)
    frogs(out, 0, END, 1.0, 0.03, count=4); lap(S, 0, END, 1.0, 0.035, pan=0.2); hearth(S, 0, END, 1.0, 0.1)
    for k in range(0, 26, 3):
        if rnd() < 0.7: creak(S, k * bar + rnd(0, 2) * bar, 0.04)
    crane(out, B(14), 0.08, calls=2, pan=0.8)
    for at in (0.3, B(19)): telegraph(out, at, 'AGUEREKEU', b / 4, 0.2, pan=0.6)
    COUNTER = marsh.M1 + marsh.M2 + marsh.M3 + [(65, 1), (62, 1), (60, 1), (62, 1), (62, 4)]
    seq(S, TUNE, b, B(1), lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.24), pan=-0.1)
    strum(S, B(1), b, ROOTS, 0.045); bassline(S, B(1), b, ROOTS)
    seq(S, COUNTER, b, B(9), lambda m, d: flute(m, d * 0.95, vol=0.18), pan=0.3)
    seq(S, TUNE, b, B(9), lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.18), pan=-0.2)
    strum(S, B(9), b, ROOTS, 0.04); bassline(S, B(9), b, ROOTS, 0.2)
    seq(S, marsh.MARSH, b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.6, 0.4), vol=0.18), pan=0.1)
    strum(S, B(17), b, marsh.ROOTS, 0.04, chords=marsh.CH); bassline(S, B(17), b, marsh.ROOTS, 0.18)
    finish(S, 'Aguerekeu_Inside', t0, END)

ALL = dict(zonfahare=zonfahare, mansehare=mansehare, aguerekeu=aguerekeu)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
