# The shrine and the Island chant.
#   Shrine: inside a shrine or temple (Juda's seat, Tamonante's temple...): quiet and sacred. Water dripping in
#     a stone basin, wind chimes, the wind outside, a slit drum now and then; one priest humming the Island tune
#     very slowly over a held drone, a few voices far back answering.
#   Island_Chant: the Island tune as a ceremony: a priest calls, the people answer, over slow slit drums and
#     clapping sticks; a shell horn begins it; the second time in harmony, the third with a flute above.
# Usage: python3 shrine16.py shrine chant   (or no names for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
from ambience import *

def slow(ph, k=2): return [(m, d * k) for m, d in ph]

def pad(S, t, b, roots, inst=strings, vol=0.035, beats=4):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * beats * b, inst(m, beats * b * 0.98, vol=vol))

def finish(S, name, t0, end, **kw):
    L, Rr = snes_master(S.L, S.R, **kw)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg')
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def chimes(S, t, vol=0.04):                       # small shell-and-copper wind chimes
    pan = rnd(-0.7, 0.7)
    for i in range(np.random.randint(3, 6)):
        S.add(t + i * rnd(0.12, 0.35), bell(int(np.random.choice([79, 83, 86, 91, 95])), 0.6, vol=vol * rnd(0.5, 1)), pan=pan)

# ------------------------------------------------------------------ Shrine
def shrine():
    np.random.seed(531)
    bpm = 60; b = 60 / bpm; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    bed_wind(Muffle(S, 400), 0, END, t0, 0.05, smooth=60)
    t = 0.5
    while t < END - 1: drip(S, t, rnd(0.02, 0.04)); t += rnd(2.5, 6)       # the stone basin
    for k in range(0, INTRO + BARS, 4):
        if rnd() < 0.7: chimes(S, k * bar + rnd(0, 3) * bar, 0.03)
    for k in (1, 9, 17, 25): S.add(B(k), drum('log', 0.14), pan=-0.4)        # the slit drum, once in a while
    for m in (43, 50): S.add(0, choir(m, END * 0.995, vol=0.035))           # the drone: a held fifth, G and D
    S.add(0, organ(31, END * 0.995, vol=0.02))
    # 1-8: the priest hums the call and the answer, very slowly
    seq(S, slow(CALL1 + ANS1), b, B(1), lambda m, d: chant(m - 12, d * 0.97, vol=0.08), pan=-0.1)
    # 9-16: the rest of the tune; a few voices far back answer each phrase, quieter
    seq(S, slow(CALL2 + ANS2), b, B(9), lambda m, d: chant(m - 12, d * 0.97, vol=0.08), pan=-0.1)
    seq(S, slow(ANS1), b, B(11), lambda m, d: choir(m - 12, d * 0.97, vol=0.03), pan=0.5)
    seq(S, slow(ANS2), b, B(15), lambda m, d: choir(m - 12, d * 0.97, vol=0.03), pan=0.5)
    pad(S, B(9), b, ROOTS, vol=0.02, beats=4)
    # 17-24: only bells, the tune's notes rung slowly, one at a time, letting each fade
    for i, (m, d) in enumerate(CALL1 + ANS1):
        S.add(B(17) + i * 2 * b, bell(m + 12, 1.8, vol=0.05), pan=(-0.3, 0.3)[i % 2])
    # 25-32: the priest again, the whole tune at its own pace now, with harp
    seq(S, slow(TUNE, 1), b, B(25), lambda m, d: chant(m - 12, d * 0.97, vol=0.07), pan=-0.1)
    seq(S, slow(TUNE, 1), b, B(25) + 0.04, lambda m, d: harp(m, max(d, 0.6), vol=0.09), pan=0.3)
    pad(S, B(25), b, ROOTS, vol=0.025)
    finish(S, 'Shrine', t0, END, echo=0.35, fb=0.4, reverb=0.5)

# ------------------------------------------------------------------ Island chant
def chant_track():
    np.random.seed(541)
    bpm = 76; b = 60 / bpm; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    hearth(S, 0, END, t0, 0.06, pan=0.4)                                     # torches
    def drums(t, bars, vol=1.0):                                             # slow slit drums and clapping sticks
        for k in range(bars):
            at = t + k * bar
            for j, kind, v in ((0, 'tom', 0.3), (1.5, 'log', 0.2), (3, 'tomhi', 0.22)): S.add(at + j * b, drum(kind, v * vol), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
            for j in (1, 2.5, 3.5): S.add(at + j * b, drum('clap', 0.07 * vol), pan=-0.5)
    # intro (once): a shell horn, twice; the drums answer
    for at, m in ((0, 55), (3, 62)): S.add(at * b, brass(m, 2.5 * b, vol=0.18), pan=-0.2)
    for at in (6, 6.75, 7.5): S.add(at * b, drum('tom', 0.3))
    def callres(t, harmony=False, flute_over=False):
        for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
            t2 = seq(S, call, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.1), pan=0.3)          # the priest
            seq(S, ans, b, t2, lambda m, d: chant(m - 12, d * 0.95, vol=0.12), pan=-0.3)             # everyone
            seq(S, ans, b, t2, lambda m, d: choir(m - 24, d * 0.95, vol=0.08))
            if harmony:
                h = [(UP7.get(m, UP[m]) if call is CALL2 else UP[m], d) for m, d in ans]
                seq(S, h, b, t2, lambda m, d: chant(m - 12, d * 0.95, vol=0.07), pan=-0.5)
            if flute_over:
                seq(S, call + ans, b, t, lambda m, d: flute(m + 12, d * 0.9, vol=0.15), pan=0.5)
            t = t2 + 8 * b
        return t
    callres(B(1)); drums(B(1), 8, 0.8)
    for k, r in enumerate(ROOTS): S.add(B(1 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.22))
    callres(B(9), harmony=True); drums(B(9), 8)
    pad(S, B(9), b, ROOTS, inst=choir, vol=0.03)
    for k, r in enumerate(ROOTS): S.add(B(9 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.25))
    callres(B(17), harmony=True, flute_over=True); drums(B(17), 8, 1.1)
    pad(S, B(17), b, ROOTS, inst=choir, vol=0.035)
    for k, r in enumerate(ROOTS): S.add(B(17 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.27))
    # 25-32: the people hum the tune together, low and slow, and the drums fall away to one stroke a bar
    seq(S, slow(CALL1 + ANS1), b, B(25), lambda m, d: choir(m - 12, d * 0.97, vol=0.07))
    seq(S, slow(CALL1 + ANS1), b, B(25), lambda m, d: chant(m - 24, d * 0.97, vol=0.05))
    for k in range(8): S.add(B(25 + k), drum('tom', 0.2 - k * 0.015))
    for k, r in enumerate((43, 43, 48, 48, 40, 40, 43, 43)): S.add(B(25 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.22))
    S.add(B(32) + 2 * b, brass(55, 2 * b, vol=0.12), pan=-0.2)                # the horn again: round we go
    finish(S, 'Island_Chant', t0, END, echo=0.3, fb=0.35, reverb=0.4)

ALL = dict(shrine=shrine, chant=chant_track)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
