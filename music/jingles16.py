# The short jingles (they play once, in audio/me):
#   Defeat_Isle: the party falls (battle lost, game over). Yoon's first notes, and the wrong one; then it sinks,
#     the village's lament falling to a low D minor and a bell, like a tide going out.
#   Rest_Isle: resting (Mada's house, a bothy, the hot spring). The Island tune's call as a lullaby on a kalimba,
#     a harp, a hum; it settles on a soft G, and a little bell for the morning.
#   Item_Isle: a key item (each of the body's ingredients). Yoon's first notes made bright (D major): a rising
#     arpeggio, a harp sweep and sparkles, a warm chord.
#   Save_Isle: saving at a Red Bowl idol. A slit drum, the Island tune's answer in a brief priestly hum, a bell.
# Usage: python3 jingles16.py defeat rest item save   (or no names for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import CALL1, ANS1, CH as I_CH

def cut(S, end, name):
    L, R = snes_master(S.L, S.R, echo=0.25, fb=0.32, reverb=0.25)
    n = int(end * SR); save_me(L[:n], R[:n], name + '.ogg')
    print('%s %.1fs' % (name, end))

def defeat():
    np.random.seed(601)
    b = 60 / 66; S = Stereo(9)
    seq(S, [(74, .5), (77, .5), (81, .5), (80, 1.5)], b, 0, lambda m, d: kalimba(m, max(d, 0.6), vol=0.35), pan=-0.1)
    for m in (50, 56): S.add(0, strings(m, 3 * b, vol=0.07))                    # the tritone under it
    t = 3 * b
    seq(S, [(77, 1), (76, 1), (74, 1), (73, .5), (74, 2.5)], b, t, lambda m, d: flute(m - 12, d * 0.97, vol=0.3), pan=0.1)
    seq(S, [(77, 1), (76, 1), (74, 1), (73, .5), (74, 2.5)], b, t, lambda m, d: choir(m - 24, d * 0.97, vol=0.06))
    for k, (r, d) in enumerate(((46, 1), (45, 1.5), (38, 3.5))):
        at = t + (0, 1, 2.5)[k] * b
        for m in {46: (58, 62, 65), 45: (57, 61, 64), 38: (50, 53, 57)}[r]: S.add(at, strings(m, d * b * 0.98, vol=0.06))
        S.add(at, pluckbass(r - 12 if r > 40 else r, d * b * 0.95, vol=0.3))
    S.add(t + 2.5 * b, timpani(26, 0.3)); S.add(t + 2.5 * b, bell(74, 3.0, vol=0.08), pan=0.3)
    cut(S, t + 6 * b + 1.0, 'Defeat_Isle')

def rest():
    np.random.seed(611)
    b = 60 / 72; S = Stereo(8)
    lull = [(67, 1), (69, .5), (71, .5), (74, 1.5), (71, .5), (69, 1), (67, 3)]          # the call, softened to a lullaby
    seq(S, lull, b, 0, lambda m, d: kalimba(m + 12, max(d, 0.6), vol=0.3), pan=0.1)
    seq(S, lull, b, 0, lambda m, d: choir(m - 12, d * 0.97, vol=0.05))
    for k, (r, d) in enumerate(((43, 2), (48, 2), (43, 3.5))):
        at = (0, 2, 4)[k] * b
        for j, m in enumerate(I_CH[r]): S.add(at + j * 0.06, harp(m, d * b, vol=0.07), pan=-0.3 + j * 0.25)
        S.add(at, pluckbass(r - 12 if r > 40 else r, d * b * 0.95, vol=0.2))
    S.add(6.5 * b, bell(91, 1.8, vol=0.07), pan=0.4)                                 # morning
    cut(S, 7.5 * b + 0.8, 'Rest_Isle')

def item():
    np.random.seed(621)
    b = 60 / 120; S = Stereo(6)
    seq(S, [(74, .5), (78, .5), (81, .5), (86, 1.5)], b, 0, lambda m, d: marimba(m, max(d, 0.5), vol=0.4), pan=-0.15)
    seq(S, [(74, .5), (78, .5), (81, .5), (86, 1.5)], b, 0, lambda m, d: flute(m + 12, d * 0.9, vol=0.2), pan=0.25)
    for j, m in enumerate((62, 66, 69, 74, 78, 81, 86, 90)): S.add(1.5 * b + j * 0.035, harp(m, 1.5, vol=0.08), pan=-0.5 + j * 0.13)
    for m in (62, 66, 69, 74): S.add(1.5 * b, strings(m, 2.5 * b, vol=0.06)); S.add(1.5 * b, choir(m + 12, 2.5 * b, vol=0.035))
    S.add(1.5 * b, pluckbass(38, 2 * b, vol=0.3)); S.add(1.5 * b, timpani(38, 0.25))
    for j, m in enumerate((98, 102, 105)): S.add(2.2 * b + j * b / 4, bell(m - 12, 0.6, vol=0.05), pan=(0.5, -0.5)[j % 2])
    cut(S, 4 * b + 0.8, 'Item_Isle')

def save():
    np.random.seed(631)
    b = 60 / 84; S = Stereo(5)
    S.add(0, drum('log', 0.35), pan=-0.3); S.add(0.5 * b, drum('log', 0.25), pan=0.3)
    seq(S, ANS1[-3:], b, b, lambda m, d: choir(m - 12, d * 0.97, vol=0.08))          # "...B A G": the answer's close
    seq(S, ANS1[-3:], b, b, lambda m, d: kalimba(m + 12, max(d, 0.5), vol=0.2), pan=0.2)
    for m in (55, 62): S.add(b, strings(m, 3.5 * b, vol=0.05))
    S.add(3 * b, bell(91, 1.5, vol=0.08), pan=0.3)
    cut(S, 4 * b + 0.8, 'Save_Isle')

ALL = dict(defeat=defeat, rest=rest, item=item, save=save)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
