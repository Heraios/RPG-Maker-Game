import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import telegraph
np.random.seed(611)
R = None
# Mystery: everyday clue-hunting: questioning people, Dama's pearl case, Uira's telegraph logs. Lighter than
# Dread: curious, tiptoeing, a little sly. A plucked walking bass and a ticking clock; a marimba tune that
# sneaks about and ends each time on a question (a little hop up). In the middle, the strings turn thoughtful,
# a "clue" bell rings, the telegraph taps WHO in Morse... and low in the bass, quietly, plays the opening of
# Juda's hymn, unchanged, but in a minor key: the same tune, in a different light. Only a careful listener
# will notice.
bpm = 96; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 32
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

P1 = [(76, .5), (R, .5), (81, .5), (R, .5), (84, .5), (83, .5), (81, .5), (80, .5), (81, 1), (R, 1), (76, .5), (77, .5), (79, 1)]
P2 = [(77, .5), (R, .5), (74, .5), (R, .5), (77, .5), (76, .5), (74, .5), (72, .5), (71, 1), (R, .5), (72, .5), (74, .5), (76, .5), (R, 1)]
P3 = [(76, .5), (R, .5), (81, .5), (R, .5), (84, .5), (86, .5), (88, .5), (84, .5), (86, 1), (84, .5), (83, .5), (81, 1), (R, 1)]
P4 = [(77, .5), (76, .5), (74, .5), (72, .5), (71, .5), (72, .5), (74, .5), (75, .5), (76, 2), (R, 1), (83, .5), (R, .5)]   # ...?
TUNE = P1 + P2 + P3 + P4                                         # 8 bars
ROOTS = [45, 45, 50, 43, 45, 41, 50, 40]                         # Am Am | Dm G | Am F | Dm E
CH = {45: (57, 60, 64), 50: (62, 65, 69), 43: (55, 59, 62), 41: (53, 57, 60), 40: (56, 59, 64),
      52: (59, 64, 67), 47: (59, 62, 66), 48: (60, 64, 67)}
JUDA = [(71, 1), (74, 1), (79, 2), (78, 1), (76, 1), (74, 2), (72, 1), (71, 1), (69, 1), (71, 1), (67, 4)]   # his hymn's opening
JROOTS = [52, 47, 45, 48]                                        # Em Bm Am C: his tune, made minor around it

def walk(t, roots, vol=0.34):                                    # pizzicato walking bass: root, fifth, octave, fifth
    for k, r in enumerate(roots):
        for j, iv in enumerate((0, 7, 12, 7)): S.add(t + k * bar + j * b, pluckbass(r - 12 + iv, b * 0.45, vol=vol * (1 if j == 0 else 0.8)))

def clock(t, bars, vol=0.1):                                     # tick, tock
    for i in range(bars * 4): S.add(t + i * b, drum('log' if i % 2 == 0 else 'tomhi', vol if i % 2 == 0 else vol * 0.6), pan=(-0.5, 0.5)[i % 2])

def offbeats(t, roots, vol=0.05, inst=harp):                      # soft chords on the "and"s
    for k, r in enumerate(roots):
        for j in (0.5, 2.5):
            for m in CH[r]: S.add(t + k * bar + j * b, inst(m + 12, b * 0.4, vol=vol), pan=0.25)

def clue(t, vol=0.12):                                           # ding!
    S.add(t, bell(93, 1.2, vol=vol), pan=0.5); S.add(t + 0.08, bell(100, 0.8, vol=vol * 0.5), pan=0.6)

# intro (once): two plucks, a held breath, a bell: "hmm"
S.add(0, pluckbass(45, b * 0.45, vol=0.36)); S.add(b, pluckbass(52, b * 0.45, vol=0.3))
S.add(2 * b, bell(88, 1.5, vol=0.08), pan=0.4)

# 1-8: the tune on marimba, sneaking; the walking bass; the clock
seq(S, TUNE, b, B(1), lambda m, d: marimba(m, d * 0.7, vol=0.46), pan=-0.15)
walk(B(1), ROOTS); clock(B(1), 8); offbeats(B(1), ROOTS)
S.add(B(8) + 3 * b, drum('shaker', 0.12), pan=0.5)

# 9-16: the flute takes it, the kalimba sneaking after it a step behind; a shaker joins the clock
seq(S, TUNE, b, B(9), lambda m, d: flute(m, d * 0.75, vol=0.38), pan=0.15)
seq(S, TUNE, b, B(9) + b / 2, lambda m, d: kalimba(m + 12, max(d * 0.4, 0.3), vol=0.1), pan=-0.5)
walk(B(9), ROOTS); clock(B(9), 8); offbeats(B(9), ROOTS, 0.045)
for i in range(32): S.add(B(9) + (i + 0.5) * b, drum('shaker', 0.06), pan=0.45)
clue(B(12) + 3 * b, 0.08)

# 17-24: thinking. Strings, a clue bell, the telegraph tapping WHO... and, low and quiet, Juda's hymn in the minor
seq(S, JUDA, b, B(17), lambda m, d: organ(m - 24, d * 0.95, vol=0.1), pan=-0.1)
seq(S, JUDA, b, B(17), lambda m, d: pluckbass(m - 24, d * 0.6, vol=0.22))
for k, r in enumerate(JROOTS + JROOTS):
    for m in CH[r]: S.add(B(17 + k), strings(m, bar * 0.98, vol=0.05))
seq(S, [(R, 2), (79, 1), (83, 1), (R, 4), (R, 2), (81, 1), (84, 1), (R, 4)], b, B(17), lambda m, d: kalimba(m + 12, 0.5, vol=0.14), pan=0.4)
seq(S, P1 + P3, b, B(21), lambda m, d: marimba(m, d * 0.6, vol=0.26), pan=0.2)          # the tune, coming back to it
for k, r in enumerate(JROOTS): S.add(B(21 + k), pluckbass(r - 12, b * 0.45, vol=0.3)); S.add(B(21 + k) + 2 * b, pluckbass(r - 5, b * 0.45, vol=0.24))
clock(B(17), 8, 0.07)
clue(B(19), 0.12); clue(B(23) + 2 * b, 0.1)
telegraph(S, B(18) + 2 * b, 'WHO', b / 4, 0.14, pan=0.6)
telegraph(S, B(22) + 2 * b, 'WHO', b / 4, 0.12, pan=0.6)

# 25-32: back on the trail: the tune on marimba and flute together, a soft brass "aha" on the last question
seq(S, TUNE, b, B(25), lambda m, d: marimba(m, d * 0.7, vol=0.42), pan=-0.2)
seq(S, TUNE, b, B(25), lambda m, d: flute(m + 12, d * 0.6, vol=0.16), pan=0.3)
walk(B(25), ROOTS); clock(B(25), 8); offbeats(B(25), ROOTS, 0.05, marimba)
for i in range(32): S.add(B(25) + (i + 0.5) * b, drum('shaker', 0.06), pan=0.45)
S.add(B(32) + 2 * b, brass(64, b * 0.4, vol=0.14), pan=-0.2); S.add(B(32) + 2 * b, brass(68, b * 0.4, vol=0.12), pan=0.2)

L, Rr = snes_master(S.L, S.R, echo=0.26, fb=0.3, reverb=0.25)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Mystery16.ogg', loop=loop, preview='Mystery16_preview.ogg')
print('Mystery16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
