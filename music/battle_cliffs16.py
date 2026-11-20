# Battle_Sea_Cliffs: fights on the dry-side sea cliffs, grown out of Sea_Cliffs (G and E dorian at 84; this is at 168,
# the doubled pulse), for a 16-bit orchestra at war. Darker than the shore: it leans on E minor (the Lady of the Wind's
# E dorian) where the shore is bright G. Dizzy height and wind: the strings whip round like gusts, and the war drums
# boom low like waves breaking far below.
#   jingle: a hit, and the Lady's falling gust slashed out on the brass while a gust swells on the cymbals; a roll
#   1-8   Corajakeu's brave tune (the Island tune) on horns and strings, waves booming under it
#   9-14  the Lady of the Wind: her falling and rising gust on the men's choir and low brass; the strings whip round
#   15-22 the rope teams calling: the call high on horns and trumpets (above), answered low by voices (below)
#   23-28 her high cold arc and sigh, on strings and horns, the choir under it; the wind whips again
#   29-32 the tune's call hammered, climbing a step a bar (E G A B), a roll back to the top
# Usage: python3 battle_cliffs16.py
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
from battle_heights16 import bed, whip, finish
from wind_tune import W1, W2, W3, W4, ROOTS as WROOTS
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS as IROOTS
R = None
MIN = {40: True, 47: True}                                          # Em and Bm; D, G, A, C major

def battle():
    np.random.seed(2121)
    b = 60 / 168; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def gust_swell(t, beats=2, vol=0.1):                            # a gust: noise swelling into the next downbeat
        n = int(beats * b * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
        S.add(t, x * np.linspace(0, 1, n) ** 2.5 * vol, pan=-0.3)
    def waves(t, bars):                                             # far below: a low boom every other bar
        for k in range(0, bars, 2):
            S.add(t + k * bar, timpani(40, 0.2)); S.add(t + k * bar, drum('taiko', 0.22), pan=-0.2)
    # the jingle (two bars): a hit; the falling gust (E B A G F# E) slashed on brass; a gust swelling; a roll
    hit(S, 0, 40, 1.1)
    slash = [(76, .5), (83, .5), (81, .5), (79, .5), (78, .5), (76, 1.5)]
    tune(S, 0, b, slash, [(brass, 0, 0.34, -0.1, 0.9), (horn, -12, 0.24, 0.2, 0.92), (stab, 12, 0.12, 0.3, 0.8)])
    gust_swell(2 * b, 4, 0.12)
    roll(S, 6 * b, 2, b, 0.08, 0.42)
    # 1-8: Corajakeu's brave tune on horns and strings; waves booming far below
    hit(S, B(1), 43, 1.0, minor=False)
    bed(S, B(1), b, IROOTS, MIN)
    tune(S, B(1), b, TUNE, [(horn, 0, 0.36, -0.15, 0.97), (strings, 12, 0.24, 0.25, 0.97), (brass, -12, 0.16, 0.1, 0.95)])
    waves(B(1), 8)
    for k in (4, 8): gust_swell(B(k) + 2 * b)
    # 9-14: the Lady of the Wind on the men's choir and low brass; the strings whip round like wind
    hit(S, B(9), 40, 1.0)
    bed(S, B(9), b, WROOTS[0:6], MIN, vol=1.05)
    tune(S, B(9), b, W1 + W2, [(menchoir, -12, 0.38, 0.0, 0.97), (brass, -12, 0.26, -0.2, 0.95), (horn, 0, 0.16, 0.25, 0.97)])
    whip(S, B(9), b, 6, 52, 0.045)
    gust_swell(B(11) + 2 * b, 2, 0.12)
    # 15-22: the rope teams: the call high above (horns, a trumpet edge), answered low from below (voices, low strings)
    hit(S, B(15), 43, 0.95, minor=False)
    bed(S, B(15), b, IROOTS, MIN, vol=1.05)
    t = B(15)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        tune(S, t, b, call, [(horn, 12, 0.3, -0.45, 0.92), (brass, 12, 0.2, -0.35, 0.88), (strings, 24, 0.1, -0.3, 0.95)])
        t += 2 * bar
        tune(S, t, b, ans, [(menchoir, -12, 0.44, 0.35, 0.95), (strings, -12, 0.26, 0.4, 0.97), (horn, -12, 0.16, 0.2, 0.95)])
        t += 2 * bar
    waves(B(15), 8)
    S.add(B(19), cymbal(0.11, 2), pan=-0.3)
    # 23-28: her high cold arc (the C sharp) and her sigh; the wind whips again
    hit(S, B(23), 45, 0.95, minor=False)
    bed(S, B(23), b, WROOTS[6:12], MIN, vol=1.1)
    tune(S, B(23), b, W3 + W4, [(strings, 0, 0.34, 0.15, 0.97), (horn, -12, 0.3, -0.2, 0.97), (menchoir, -24, 0.24, 0.0, 0.97)])
    whip(S, B(23), b, 3, 52, 0.04)
    gust_swell(B(26) + 2 * b, 2, 0.12)
    # 29-32: the call's head hammered, a step a bar (E G A B); a roll back to the top
    head = [(67, .5), (69, .5), (71, .5), (74, 1.5), (R, 1)]
    for k, r in enumerate((40, 43, 45, 47)):
        hit(S, B(29 + k), r, 0.85, minor=MIN.get(r, False))
        tune(S, B(29 + k), b, [(m + (r - 43) if m else None, d) for m, d in head], [(brass, 12, 0.3, (-0.2, 0.2)[k % 2], 0.9), (horn, 0, 0.22, 0.0, 0.92), (strings, 24, 0.12, 0.3, 0.95)])
    bed(S, B(29), b, [40, 43, 45, 47], MIN, vol=1.1, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False))
    for i in range(16): S.add(B(32) + i * b / 4, timpani(40, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Sea_Cliffs', t0, END, drive=3.2)

if __name__ == '__main__':
    battle()
