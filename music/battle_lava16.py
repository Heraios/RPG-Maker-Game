# Battle themes for the lava-tube lands, grown out of each area's own music (same key, a doubled pulse), for a
# 16-bit orchestra at war, each opening with its jingle.
#   Battle_Lava_Tubes (the tubes: Lava_Tubes is in D at 60, this is at 120): dark and heavy. The Children of the
#       Caves' melody from Lava_Tubes (D double harmonic: beautiful and wrong) as a march on horns and low brass;
#       the cave's heartbeat on the war drums; the strings' figure pressing E flat down on D. Then Yoon's theme
#       (the ghost woke here) sweeping on strings in D minor; the cave melody again, high, over the men's choir
#       chanting, with Yoon's first four notes stabbed between its phrases (as in Dread); E flat against D.
#   Battle_Lava_Tube_Country (the gullies above: 72 there, 144 here): brighter and bolder, daylight on basalt.
#       Yoon's theme as the main tune on horns and strings; Sib's counting tune on bright brass and flute; then
#       both at once, as in Yoon_and_Sib (this is their country), and swapped; brass calls echo off the canyon
#       walls; at the end, the cave melody rises from the tubes below.
# Usage: python3 battle_lava16.py tubes country   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
from yoon import A as YA, B as YB, C as YC, B_end as YB_END
R = None
FAE1 = [(81, 1.5), (82, .5), (78, 1), (75, 1), (74, 4)]           # the Children of the Caves (as in Lava_Tubes)
FAE2 = [(74, 1), (75, 1), (78, 1), (79, 1), (81, 2), (78, 2)]
FAE3 = [(86, 1.5), (85, .5), (82, 1), (81, 1), (78, 2), (R, 2)]
FAE4 = [(75, 1), (74, 7)]
FAE = FAE1 + FAE2 + FAE3 + FAE4                                    # 8 bars
C6, B5, A5, G5, F5, D6, E6, F6 = 84, 83, 81, 79, 77, 86, 88, 89
SIB = [(C6, .5), (C6, .5), (C6, .5), (R, .5), (B5, .5), (A5, .5), (G5, 1), (A5, .5), (B5, .5), (C6, .5), (R, .5), (D6, .5), (C6, .5), (A5, 1),
       (F5, .5), (G5, .5), (A5, .5), (B5, .5), (C6, 1), (R, .5), (C6, .5), (D6, .5), (E6, .5), (F6, 3)]   # Sib's tune: 4 bars
YOON = YA + YB + YC + YB_END                                       # Yoon's theme: 8 bars
PLAIN = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)
DARK = (0, 12, 7, 12, 1, 12, 7, 12, 0, 12, 7, 12, 1, 7, 12, 13)    # the same, with E flat pressing on D

def finish(S, name, t0, end, drive=2.8):
    L, Rr = snes_master(S.L, S.R, echo=0.22, fb=0.26, reverb=0.26)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', drive=drive)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def bed(S, t, b, roots, minor, fig, vol=1.0, drums=march, chords=0.6):
    bar = 4 * b
    for k, r in enumerate(roots):
        ostinato(S, t + k * bar, b, [r], fig if r == 50 else PLAIN, 0.06 * vol)
        power(S, t + k * bar, bar, r - 12, minor[r], vol * chords)
    low_end(S, t, b, roots, 0.28 * vol); drums(S, t, b, len(roots), vol)

# ------------------------------------------------------------------ the tubes
def tubes():
    np.random.seed(1501)
    b = 60 / 120; bar = 4 * b; INTRO = 1; BARS = 28
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    MIN = {50: False, 51: False, 45: False, 53: False, 43: True}         # D (with its F sharp), E flat, A, F, G minor
    def heartbeat(t, bars, vol=0.4):                                     # the cave's heart: lub-dub, every bar
        for k in range(bars):
            S.add(t + k * bar, drum('taiko', vol)); S.add(t + k * bar + 0.5 * b, drum('taiko', vol * 0.6)); S.add(t + k * bar, timpani(50, vol * 0.25))
    # the jingle (once): a hit; the cave melody's first steps climbing on the brass; a roll
    hit(S, 0, 38, 1.1, minor=False)
    climb = [(74, .25), (75, .25), (78, .25), (79, .25), (81, 2)]
    seq(S, climb, b, b, lambda m, d: brass(m, d * 0.95, vol=0.34), pan=-0.1)
    seq(S, climb, b, b, lambda m, d: horn(m - 12, d * 0.95, vol=0.22), pan=0.2)
    for m in (38, 39): S.add(2 * b, menchoir(m + 12, 2 * b, vol=0.14))                      # D and E flat
    roll(S, b, 3, b, 0.05, 0.4)
    for i in range(6): S.add((1 + i * 0.5) * b, drum('taiko', 0.3 + 0.07 * i))
    # 1-8: the cave melody as a march
    RA = [50, 50, 51, 50, 50, 45, 51, 50]
    hit(S, B(1), 38, 1.0, minor=False)
    bed(S, B(1), b, RA, MIN, DARK); heartbeat(B(1), 8, 0.3)
    tune(S, B(1), b, FAE, [(horn, 0, 0.36, -0.15, 0.97), (brass, -12, 0.24, 0.15, 0.95), (strings, 12, 0.1, 0.3, 0.97)])
    # 9-16: Yoon's theme, sweeping, in D minor: strings, then brass and choir with them
    RY = [50, 53, 50, 45, 50, 53, 50, 45]; MY = {50: True, 53: False, 45: True}
    hit(S, B(9), 38, 0.9)
    bed(S, B(9), b, RY, MY, PLAIN, 1.05)
    tune(S, B(9), b, YA + YB, [(strings, 12, 0.34, 0.1, 0.97), (horn, 0, 0.3, -0.2, 0.95), (brass, -12, 0.2, 0.15, 0.92)])
    tune(S, B(13), b, YA + YB, [(strings, 12, 0.3, 0.1, 0.97), (brass, 0, 0.28, -0.1, 0.92), (choir, 0, 0.16, 0.2, 0.97)])
    S.add(B(13), cymbal(0.1, 1.5), pan=0.3)
    # 17-24: the cave melody, high, over the men's choir chanting; Yoon's four notes stabbed between its phrases
    hit(S, B(17), 38, 0.95, minor=False)
    bed(S, B(17), b, RA, MIN, DARK, 1.1); heartbeat(B(17), 8, 0.34)
    tune(S, B(17), b, FAE, [(strings, 12, 0.3, 0.15, 0.97), (flute, 12, 0.2, 0.35, 0.92), (brass, 0, 0.2, -0.15, 0.92)])
    for k in range(8):
        for j in range(4): S.add(B(17 + k) + j * b, menchoir(RA[k], b * 0.6, vol=0.14, attack=0.03))
    for k in (19, 23):                                                  # D F A ... G sharp
        seq(S, [(74, .5), (77, .5), (81, .5), (80, 1.5)], b, B(k) + b, lambda m, d: brass(m - 12, d * 0.85, vol=0.26), pan=0.3)
    S.add(B(21), cymbal(0.1, 1.5), pan=-0.3)
    # 25-28: E flat against D, hammered; a roll back to the top
    RD = [50, 51, 50, 51]
    for k, r in enumerate(RD):
        hit(S, B(25 + k), r - 12, 0.85, minor=False)
        seq(S, [(m + (r - 50), d) for m, d in climb[:4]], b, B(25 + k) + 2 * b, lambda m, d: brass(m, d * 0.9, vol=0.26), pan=(-0.2, 0.2)[k % 2])
        S.add(B(25 + k) + 3 * b, brass(81 if r == 50 else 82, b * 0.9, vol=0.24))
    bed(S, B(25), b, RD, MIN, DARK, 1.1, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False)); heartbeat(B(25), 4, 0.34)
    for i in range(16): S.add(B(28) + i * b / 4, timpani(38, 0.08 + 0.025 * i))
    roll(S, B(28) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Lava_Tubes', t0, END)

# ------------------------------------------------------------------ the gullies above
def country():
    np.random.seed(1511)
    b = 60 / 144; bar = 4 * b; INTRO = 1; BARS = 28
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    MIN = {50: True, 53: False, 45: True, 48: False, 51: False}
    def echo_call(t, notes, vol=0.3, pan=-0.4):                         # a brass call, and its echoes off the canyon walls
        seq(S, notes, b, t, lambda m, d: brass(m, d * 0.9, vol=vol), pan=pan)
        seq(S, notes, b, t + 1.5 * b, lambda m, d: horn(m, d * 0.9, vol=vol * 0.5), pan=-pan)
        seq(S, notes, b, t + 3 * b, lambda m, d: horn(m, d * 0.9, vol=vol * 0.22), pan=pan * 0.5)
    # the jingle (once): a hit; Yoon's climb (D F A) called out, and echoing; a roll
    hit(S, 0, 38, 1.1)
    echo_call(b, [(74, .25), (77, .25), (81, .5)], 0.36)
    roll(S, b, 3, b, 0.05, 0.4)
    for i in range(6): S.add((1 + i * 0.5) * b, drum('taiko', 0.3 + 0.07 * i))
    # 1-8: Yoon's theme, bold, on horns and strings
    RY = [50, 53, 50, 45, 53, 48, 50, 45]
    hit(S, B(1), 38)
    bed(S, B(1), b, RY, MIN, PLAIN)
    tune(S, B(1), b, YOON, [(horn, 0, 0.36, -0.15, 0.97), (strings, 12, 0.22, 0.25, 0.97), (brass, -12, 0.2, 0.1, 0.95)])
    S.add(B(5), cymbal(0.1, 1.5), pan=0.3)
    # 9-16: Sib's counting tune, bright: brass and flute, then an octave of strings on top; calls echo between
    RS = [53, 48, 53, 50, 53, 48, 53, 50]
    hit(S, B(9), 41, 0.9, minor=False)
    bed(S, B(9), b, RS, MIN, PLAIN, 1.05)
    tune(S, B(9), b, SIB, [(brass, -12, 0.3, -0.1, 0.9), (flute, 0, 0.26, 0.3, 0.9)])
    tune(S, B(13), b, SIB, [(brass, -12, 0.3, -0.1, 0.9), (flute, 0, 0.24, 0.3, 0.9), (strings, 0, 0.26, 0.15, 0.95)])
    echo_call(B(12) + 2 * b, [(84, .5), (84, .5), (84, .5)], 0.16, 0.5)
    S.add(B(13), cymbal(0.1, 1.5), pan=-0.3)
    # 17-24: both at once, as in Yoon_and_Sib: Yoon on strings and Sib on horns; then swapped, with the choir
    RB = [50, 53, 50, 45, 53, 48, 50, 45]
    hit(S, B(17), 38)
    bed(S, B(17), b, RB, MIN, PLAIN, 1.1)
    tune(S, B(17), b, YA + YB, [(strings, 12, 0.32, 0.15, 0.97), (brass, 0, 0.22, 0.0, 0.92)])
    tune(S, B(17), b, SIB, [(horn, -12, 0.3, -0.3, 0.92)])
    tune(S, B(21), b, SIB, [(strings, 0, 0.3, 0.15, 0.95), (flute, 0, 0.22, 0.35, 0.9), (brass, -12, 0.22, 0.0, 0.9)])
    tune(S, B(21), b, YA + YB, [(horn, 0, 0.32, -0.3, 0.97), (choir, 0, 0.16, 0.0, 0.97)])
    S.add(B(21), cymbal(0.11, 2), pan=0.3)
    roll(S, B(24) + 2 * b, 2, b, 0.04, 0.24, kind='tomhi', rate=4, pan=-0.3)
    # 25-28: from the tubes below, the cave melody rises on low brass and choir; calls echo; a roll
    RD = [50, 50, 51, 45]
    hit(S, B(25), 38, 0.95)
    bed(S, B(25), b, RD, {50: True, 51: False, 45: False}, DARK, 1.1, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False))
    tune(S, B(25), b, FAE1 + FAE2, [(brass, -12, 0.32, -0.1, 0.95), (menchoir, -12, 0.3, 0.1, 0.95), (strings, 12, 0.14, 0.3, 0.97)])
    echo_call(B(26) + 2 * b, [(74, .25), (77, .25), (81, .5)], 0.2, 0.5)
    for i in range(16): S.add(B(28) + i * b / 4, timpani(45, 0.08 + 0.025 * i))
    roll(S, B(28) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Lava_Tube_Country', t0, END)

ALL = dict(tubes=tubes, country=country)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
