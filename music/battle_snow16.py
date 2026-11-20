# Battle themes for the snow line, each grown out of its area's music (same key, the doubled pulse), for a 16-bit
# orchestra at war, each opening with its jingle.
#   Battle_Snowy_Peak (Snowy_Peak is E dorian at 60, this is at 120): a blizzard. The Lady of the Wind's theme in its own
#       key on the men's choir and horns, the strings whipping round in sixteenths almost all the way through, glass
#       bells like ice; a break where the ice cracks and Yoon's theme rings frozen on the bells; her theme again, higher.
#       Jingle: an ice crack, her falling gust slashed on the brass, a gust swelling.
#   Battle_Crater_Lake (Crater_Lake is G at 66, this is at 132): the Red Bowl's own ground, holy and stern. The bowl's
#       knock as the war drum's heartbeat; the save's closing (B A G) grown into a battle hymn on the choir; its
#       reflection (E F# G) answering on brass; the Island tune upside down on strings and bells; the answer and its
#       reflection sung against each other. Jingle: the knock, the three notes on the brass, the bowl ringing.
# Usage: python3 battle_snow16.py peak lake   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
from battle_heights16 import bed, whip, finish, PLAIN
from wind_tune import W1, W2, W3, W4, ROOTS as WROOTS
from snow_line16 import BOWL, REFLECT, SAVE, mirror, bowl
from island_tune import CALL1, ANS1
from yoon import A as YA
R = None
nofill = lambda S, t, b, n, v: march(S, t, b, n, v, fill=False)
broad = lambda ph: [(m, d * 2) for m, d in ph]

def crack(S, t, vol=0.15):                                         # ice cracking: a sharp split and a low groan
    n = int(0.08 * SR); S.add(t, np.random.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR / 0.01) * vol * 2, pan=-0.2)
    m = int(1.0 * SR); tt = np.arange(m) / SR
    x = np.sin(2 * np.pi * np.cumsum(150 + 50 * tt) / SR) * (np.sin(2 * np.pi * 11 * tt) > 0.3) * np.exp(-tt / 0.4)
    S.add(t + 0.05, lowpass(x, 800) * vol, pan=0.2)

def gust_swell(S, t, dur, vol=0.1):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
    S.add(t, x * np.linspace(0, 1, n) ** 2.5 * vol, pan=-0.3)

# ------------------------------------------------------------------ the snowy peak
MIN = {40: True, 47: True}                                          # Em, Bm; D, G, A major (E dorian)

def peak():
    np.random.seed(2401)
    b = 60 / 120; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def ice_bells(t, bars, vol=0.05):                               # glass bells glinting on the off-beats
        for k in range(bars):
            for j in (0.5, 2.5): S.add(t + k * bar + j * b, bell((88, 83, 86, 81)[(k * 2 + int(j)) % 4], 0.6, vol=vol), pan=(-0.5, 0.5)[int(j) % 2])
    # the jingle (two bars): an ice crack and a hit; her falling gust slashed on the brass; a gust swelling; a roll
    crack(S, 0); hit(S, 0, 40, 1.1)
    tune(S, 0, b, [(76, .5), (83, .5), (81, .5), (79, .5), (78, .5), (76, .5), (74, 1)], [(brass, 0, 0.34, -0.1, 0.9), (horn, -12, 0.22, 0.2, 0.92), (bell, 12, 0.08, 0.4, 1.0)])
    gust_swell(S, 3 * b, 3 * b, 0.12)
    roll(S, 6 * b, 2, b, 0.08, 0.42)
    # 1-12: her whole theme on the men's choir and horns; the strings whip round like a blizzard
    hit(S, B(1), 40, 1.0)
    bed(S, B(1), b, WROOTS, MIN)
    tune(S, B(1), b, W1 + W2 + W3 + W4, [(menchoir, -12, 0.36, 0.0, 0.97), (horn, 0, 0.3, -0.2, 0.97), (strings, 12, 0.16, 0.25, 0.97)])
    whip(S, B(1), b, 12, 52, 0.045)
    ice_bells(B(1), 12)
    for k in (4, 10): gust_swell(S, B(k) + 2 * b, 2 * b, 0.11)
    # 13-16: the ice cracks; drums and timpani; Yoon's theme rings out frozen on the bells
    for k in range(4):
        crack(S, B(13 + k), 0.12)
        for j in (0, 1.5, 2, 3): S.add(B(13 + k) + j * b, drum('taiko', 0.38 if j % 2 == 0 else 0.25), pan=-0.1)
        S.add(B(13 + k), timpani(40, 0.26))
    t = B(13)
    for m, d in YA:
        S.add(t, bell(m + 12, 1.5, vol=0.12), pan=-0.2); S.add(t + 0.04, bell(m + 24, 1.2, vol=0.05), pan=0.4)
        S.add(t, strings(m, d * b * 0.95, vol=0.08), pan=0.2)
        t += d * b
    for m in (38, 45, 50): S.add(B(13), menchoir(m, 4 * bar, vol=0.06))
    roll(S, B(16) + 2 * b, 2, b, 0.06, 0.4)
    # 17-28: her theme again, higher and fiercer: strings and flute on top, brass under, the blizzard never stops
    hit(S, B(17), 40, 1.0)
    bed(S, B(17), b, WROOTS, MIN, vol=1.1)
    tune(S, B(17), b, W1 + W2 + W3 + W4, [(strings, 12, 0.34, 0.15, 0.97), (flute, 12, 0.12, 0.4, 0.9), (brass, -12, 0.22, -0.15, 0.95), (menchoir, -12, 0.2, 0.0, 0.97)])
    whip(S, B(17), b, 12, 52, 0.05)
    ice_bells(B(17), 12, 0.04)
    S.add(B(23), cymbal(0.12, 2), pan=-0.3)
    # 29-32: her falling gust's head hammered, climbing a step a bar (E F# G A); a roll back to the top
    head = [(76, .5), (83, .5), (81, .5), (79, 1.5), (R, 1)]
    for k, r in enumerate((40, 42, 43, 45)):
        hit(S, B(29 + k), r, 0.85, minor=MIN.get(r, r == 42))
        tune(S, B(29 + k), b, [(m + (r - 40) if m else None, d) for m, d in head], [(brass, 0, 0.3, (-0.2, 0.2)[k % 2], 0.9), (horn, -12, 0.22, 0.0, 0.92), (strings, 12, 0.14, 0.3, 0.95)])
    bed(S, B(29), b, [40, 42, 43, 45], {40: True, 42: True}, vol=1.1, drums=nofill)
    whip(S, B(29), b, 4, 52, 0.05)
    for i in range(16): S.add(B(32) + i * b / 4, timpani(40, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Snowy_Peak', t0, END, drive=3.2)

# ------------------------------------------------------------------ the crater lake
LROOTS = [43, 38, 40, 43, 48, 43, 38, 43]                            # G D Em G | C G D G (under the answer, broad)
RROOTS = [40, 38, 43, 38, 40, 45, 38, 43]                            # Em D G D | Em Am D G (under the reflection)
LMIN = {40: True, 45: True}

def lake():
    np.random.seed(2411)
    b = 60 / 132; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def heart(t, bars, vol=1.0):                                    # the bowl's knock on every beat, the war drum on one
        for k in range(bars):
            for j in range(4): S.add(t + k * bar + j * b, drum('log', (0.32 if j == 0 else 0.2) * vol), pan=-0.2)
    # the jingle (two bars): the knock, the hit; the save's three notes on the brass; the bowl ringing; a roll
    S.add(0, drum('log', 0.5)); hit(S, 0, 43, 1.1, minor=False)
    tune(S, 0, b, [(71, 1), (69, 1), (67, 2)], [(brass, 0, 0.36, -0.1, 0.92), (choir, -12, 0.2, 0.2, 0.97), (bell, 12, 0.08, 0.4, 1.0)])
    bowl(S, 2 * b, 43, 0.08, 4)
    roll(S, 6 * b, 2, b, 0.08, 0.42)
    # 1-8: the save's closing grown into a battle hymn: the choir and horns, broad; the knock as a heartbeat
    hit(S, B(1), 43, 1.0, minor=False)
    bed(S, B(1), b, LROOTS, LMIN)
    tune(S, B(1), b, broad(BOWL) + broad(BOWL), [(choir, 0, 0.34, -0.1, 0.97), (horn, 0, 0.28, -0.25, 0.97), (menchoir, -12, 0.22, 0.1, 0.97), (strings, 12, 0.14, 0.3, 0.97)])
    heart(B(1), 8)
    # 9-16: its reflection, rising, on the brass; the strings and bells carry the Island tune upside down over it
    hit(S, B(9), 40, 1.0)
    bed(S, B(9), b, RROOTS, LMIN, vol=1.05)
    tune(S, B(9), b, broad(REFLECT) + broad(REFLECT), [(brass, 0, 0.3, -0.15, 0.95), (horn, -12, 0.22, 0.1, 0.95)])
    tune(S, B(9), b, mirror(CALL1 + ANS1) + mirror(CALL1 + ANS1), [(strings, 12, 0.18, 0.3, 0.9), (bell, 12, 0.05, 0.45, 1.0)])
    bowl(S, B(9), 43, 0.06, 4); bowl(S, B(13), 40, 0.06, 4)
    # 17-24: the answer and its reflection sung against each other: the choir high, the men's choir low
    hit(S, B(17), 43, 1.0, minor=False)
    bed(S, B(17), b, LROOTS, LMIN, vol=1.1)
    tune(S, B(17), b, broad(BOWL) + broad(BOWL), [(choir, 12, 0.3, -0.35, 0.97), (strings, 12, 0.22, -0.25, 0.97), (horn, 0, 0.18, -0.1, 0.95)])
    tune(S, B(17), b, broad(REFLECT) + broad(REFLECT), [(menchoir, -12, 0.36, 0.35, 0.97), (brass, -12, 0.2, 0.25, 0.95)])
    heart(B(17), 8, 1.1)
    S.add(B(21), cymbal(0.11, 2), pan=-0.3)
    # 25-28: the reflected tune hammered on everyone, the bowl struck on every bar
    hit(S, B(25), 40, 1.0)
    bed(S, B(25), b, RROOTS[4:], LMIN, vol=1.1)
    tune(S, B(25), b, mirror(CALL1 + ANS1), [(brass, 12, 0.28, -0.15, 0.92), (strings, 12, 0.24, 0.2, 0.97), (choir, 0, 0.14, 0.0, 0.97), (bell, 24, 0.04, 0.4, 1.0)])
    for k in range(4): bowl(S, B(25 + k), (40, 45, 38, 43)[k], 0.05, 2.5)
    # 29-32: the three notes, B A G, struck a bar each, then a roll back to the top
    for k, (m, r) in enumerate(((71, 40), (69, 45), (67, 43), (66, 38))):
        hit(S, B(29 + k), r, 0.85, minor=LMIN.get(r, False))
        tune(S, B(29 + k), b, [(m, 2), (m, 1), (R, 1)], [(brass, 12, 0.28, (-0.2, 0.2)[k % 2], 0.9), (choir, 0, 0.2, 0.0, 0.95), (bell, 12, 0.06, 0.4, 1.0)])
    bed(S, B(29), b, [40, 45, 43, 38], LMIN, vol=1.1, drums=nofill)
    for i in range(16): S.add(B(32) + i * b / 4, timpani(43, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Crater_Lake', t0, END, drive=2.5)

ALL = dict(peak=peak, lake=lake)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
