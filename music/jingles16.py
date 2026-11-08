# The short jingles (they play once, in audio/me):
#   Defeat_Isle: the party falls (battle lost, game over). Yoon's first notes, and the wrong one; then it sinks,
#     the village's lament falling to a low D minor and a bell, like a tide going out.
#   Rest_Isle: resting (Mada's house, a bothy, the hot spring). The Island tune's call as a lullaby on a kalimba,
#     a harp, a hum; it settles on a soft G, and a little bell for the morning.
#   Item_Isle: a key item (each of the body's ingredients). Yoon's first notes made bright (D major): a rising
#     arpeggio, a harp sweep and sparkles, a warm chord.
#   Save_Isle: saving at a Red Bowl idol. A slit drum, the Island tune's answer in a brief priestly hum, a bell.
#   Clue_Isle: a clue found (Evidence +1). Two sly plucks from the Mystery theme, a bright bell "ding", and a
#     little hop up at the end, like a question.
#   Memory_Isle: the memory updated (a new word from Lasa, something Remembered, a new quest). Lasa's bell glint,
#     and one note of Yoon's soft voice on A, the note they share (as in First_Words).
# Usage: python3 jingles16.py defeat rest item save clue memory   (or no names for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import CALL1, ANS1, CH as I_CH

def cut(S, end, name, gain=1.0):
    L, R = snes_master(S.L, S.R, echo=0.25, fb=0.32, reverb=0.25)
    n = int(end * SR); save_me(L[:n], R[:n], name + '.ogg', gain=gain)
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

def clue():
    np.random.seed(651)
    b = 60 / 96; S = Stereo(5)
    S.add(0, pluckbass(45, b * 0.45, vol=0.4)); S.add(b * 0.5, pluckbass(52, b * 0.45, vol=0.34))      # sly plucks
    seq(S, [(76, .25), (81, .25), (84, .5)], b, b, lambda m, d: marimba(m, d * 0.9, vol=0.36), pan=-0.1)
    S.add(2 * b, bell(93, 1.6, vol=0.2), pan=0.4); S.add(2 * b + 0.07, bell(100, 1.2, vol=0.1), pan=0.5)   # ding!
    for m in (57, 60, 64): S.add(2 * b, harp(m + 12, 2 * b, vol=0.07), pan=0.2)
    S.add(3.25 * b, kalimba(83, 0.6, vol=0.22), pan=0.3)                                               # ...?
    cut(S, 3.25 * b + 1.4, 'Clue_Isle', gain=0.78)

def yoon_voice(m, dur, vol=0.3):                                  # Yoon's soft "ooh", sliding in a little (as in First_Words)
    probe = choir(m, 0.01)
    if not isinstance(probe, np.ndarray): return choir(m, dur, vol=vol)
    n = int(dur * SR); tt = np.arange(n) / SR
    f = hz(m) * 2 ** ((-0.4 * np.exp(-tt / 0.1) + 0.1 * np.sin(2 * np.pi * 4.7 * tt)) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph) + lowpass(np.random.uniform(-1, 1, n), 1500) * 0.1
    return x * adsr(n, a=0.08, d=0.1, s=0.85, r=0.4) * vol

def memory():
    np.random.seed(661)
    S = Stereo(4)
    for j, m in enumerate((93, 97, 100, 105)): S.add(j * 0.12, bell(m, 0.9, vol=0.12), pan=(-0.5, 0.5)[j % 2])   # Lasa's glint
    S.add(0.5, yoon_voice(69, 1.3, 0.3), pan=-0.15)                                                      # Yoon: A
    S.add(0.55, kalimba(81, 1.2, vol=0.18), pan=0.3)
    for m in (57, 61, 64): S.add(0.5, harp(m + 12, 1.6, vol=0.05), pan=0.1)
    cut(S, 2.3, 'Memory_Isle', gain=0.55)

ALL = dict(defeat=defeat, rest=rest, item=item, save=save, clue=clue, memory=memory)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
