# Battle_Volcanic_Desert: fights in the volcanic desert, grown out of Volcanic_Desert (A, the Lady of the Sun's
# "Phrygian dominant" bite, at 56; this is at 112, the doubled pulse), for a 16-bit orchestra at war. Proud, harsh and
# hot: the strings shimmer in a figure with her B flat in it, chains clank on the off-beats like percussion.
#   jingle: a hit, her rise (A E A) slashed out on the brass, a chain dragged, a roll
#   1-8   the Lady of the Sun on horns and low brass: she rises, and is dragged back
#   9-14  Tou's minuet (E minor) on strings and choir: the buried queen answering from under the sand
#   15-16 the chains: everyone stops but the drums and the chain; a roll
#   17-24 the Lady again, higher: strings and the men's choir, a flute on her glare, the chains on the off-beats
#   25-28 her glare and her fall stacked in octaves, Tou's minuet against it
#   29-32 her rise hammered a step a bar (A Bb C# D); a roll back to the top
# Usage: python3 battle_desert16.py
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
from battle_heights16 import bed, finish, PLAIN
from desert16 import SUN, SUN1, SUN2, SUN3, SUN4, T1, T2, chain
R = None
ROOTS = [45, 46, 45, 45, 45, 43, 38, 45]                            # A Bb | A A | A Gm | Dm A
MIN = {43: True, 38: True}                                          # Gm, Dm; A and Bb major
TMIN = {40: True, 45: True}                                         # Tou's ground: Em, Am, B major
HEAT = (0, 1, 4, 7, 12, 7, 4, 1, 0, 1, 4, 7, 13, 12, 7, 4)          # the shimmer: her B flat glinting over A
nofill = lambda S, t, b, n, v: march(S, t, b, n, v, fill=False)

def battle():
    np.random.seed(2221)
    b = 60 / 112; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def sunbed(t, roots, vol=1.0):
        for k, r in enumerate(roots):
            bed(S, t + k * bar, b, [r], MIN, fig=HEAT if r == 45 else PLAIN, vol=vol, drums=nofill)
    def chains(t, bars, vol=0.05):                                  # the chains on the off-beats, like percussion
        for k in range(bars):
            for j in (1.5, 3.5): chain(S, t + k * bar + j * b, vol, links=2)
    # the jingle (two bars): a hit; her rise slashed on the brass; a chain dragged; a roll
    hit(S, 0, 45, 1.1, minor=False)
    tune(S, 0, b, [(57, .5), (64, .5), (69, 1.5), (70, .5), (73, 1)], [(brass, 12, 0.34, -0.1, 0.9), (horn, 0, 0.22, 0.2, 0.92), (stab, 24, 0.1, 0.3, 0.8)])
    chain(S, 4 * b, 0.09, links=6)
    roll(S, 6 * b, 2, b, 0.08, 0.42)
    # 1-8: the Lady of the Sun on horns and low brass
    hit(S, B(1), 45, 1.0, minor=False)
    sunbed(B(1), ROOTS)
    tune(S, B(1), b, SUN, [(horn, 12, 0.36, -0.15, 0.97), (brass, 0, 0.22, 0.1, 0.95), (strings, 24, 0.16, 0.25, 0.97)])
    for k in (2, 4, 6, 8): chain(S, B(k) + 3 * b, 0.07)
    # 9-14: Tou's minuet on strings and choir: the buried queen answers
    hit(S, B(9), 40, 0.95)
    bed(S, B(9), b, [40, 40, 47, 40, 45, 40], TMIN, vol=1.0)
    tune(S, B(9), b, T1 + T2, [(strings, 0, 0.3, 0.2, 0.97), (choir, -12, 0.18, -0.1, 0.97), (marimba, -12, 0.2, -0.3, 0.6)])
    S.add(B(12), cymbal(0.1, 2), pan=0.3)
    # 15-16: the chains: everything stops but the drums and the chain dragging; a roll
    for k in range(2):
        for j in (0, 1.5, 2, 3.5): S.add(B(15 + k) + j * b, drum('taiko', 0.4), pan=-0.1)
        chain(S, B(15 + k), 0.09, links=5); chain(S, B(15 + k) + 2 * b, 0.07, links=3)
    S.add(B(15), timpani(45, 0.3)); S.add(B(16), timpani(46, 0.3))
    roll(S, B(16) + 2 * b, 2, b, 0.06, 0.42)
    # 17-24: the Lady again, higher: strings and the men's choir, a flute on her glare, the chains on the off-beats
    hit(S, B(17), 45, 1.0, minor=False)
    sunbed(B(17), ROOTS, 1.08)
    tune(S, B(17), b, SUN, [(strings, 24, 0.32, 0.15, 0.97), (menchoir, 0, 0.28, -0.1, 0.97), (horn, 12, 0.22, -0.25, 0.95)])
    tune(S, B(21), b, SUN3, [(flute, 12, 0.16, 0.4, 0.9)])
    chains(B(17), 8, 0.035)
    # 25-28: her glare and fall stacked in octaves; Tou's minuet against it, low
    hit(S, B(25), 45, 1.0, minor=False)
    sunbed(B(25), ROOTS[4:], 1.1)
    tune(S, B(25), b, SUN3 + SUN4, [(brass, 12, 0.3, -0.15, 0.92), (horn, 0, 0.24, 0.1, 0.95), (strings, 24, 0.24, 0.25, 0.97)])
    tune(S, B(25), b, T1, [(strings, 0, 0.12, -0.4, 0.95)])
    # 29-32: her rise hammered a step a bar (A Bb C# D); a roll back to the top
    head = [(57, .5), (64, .5), (69, 1.5), (R, 1.5)]
    for k, r in enumerate((45, 46, 49, 50)):
        hit(S, B(29 + k), r, 0.85, minor=False)
        tune(S, B(29 + k), b, [(m + (r - 45) if m else None, d) for m, d in head], [(brass, 12, 0.3, (-0.2, 0.2)[k % 2], 0.9), (horn, 0, 0.22, 0.0, 0.92), (strings, 24, 0.12, 0.3, 0.95)])
        chain(S, B(29 + k) + 3 * b, 0.06, links=3)
    bed(S, B(29), b, [45, 46, 49, 50], {}, vol=1.1, drums=nofill)
    for i in range(16): S.add(B(32) + i * b / 4, timpani(45, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Volcanic_Desert', t0, END, drive=3.6)

if __name__ == '__main__':
    battle()
