import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
np.random.seed(131)
R = None
# Boss: the Great Boar. Built on a melody, not a riff: Pada's tune in D minor (as in Hunt, which plays just
# before this fight and holds his horn call back), sweeping on horns and strings over war drums. Here the horn
# call is finally blown in full. Yoon's notes (D F A, the wrong G sharp, A: Battle_Wild's riff) run underneath
# as the strings' figure. The boar has a motif of its own: low, stomping, with a flat second (E flat) for menace.
#   The jingle (once, three bars): a hit and the roar; the horn call, complete at last, over a drum roll.
#   A  (8 bars)  Pada's tune, minor, on horns and low brass; the strings driving on Yoon's notes
#   B  (8 bars)  the boar: its stomping motif on low brass and the men's choir, high strings held tense, roars
#   A2 (8 bars)  the tune an octave up on full strings and choir; the horn call answering every other bar
#   C  (8 bars)  Pada rises: his tune in D major, as he really plays it, brass and horns, at full tilt
#   D  (4 bars)  the boar's motif against the horn call, a step higher; a roll, a roar, round again
bpm = 160; b = 60 / bpm; bar = 4 * b
CALL = [(74, 1), (69, .5), (74, .5), (81, 2)]                                # Pada's horn call
PADA = [(74, 1), (69, .5), (74, .5), (78, 1), (76, 1), (74, 1.5), (71, .5), (69, 2), (71, 1), (74, 1), (76, 1), (78, 1), (76, 3), (R, 1),
        (78, 1), (81, 1), (83, 1), (81, .5), (78, .5), (76, 1), (74, 1), (71, 2), (69, 1), (71, .5), (74, .5), (76, 1), (78, .5), (76, .5), (74, 3), (R, 1)]
MIN = {78: 77, 71: 70, 83: 82}
HUNT = [(MIN.get(m, m), d) for m, d in PADA]                                 # ... in D minor
BOAR = [(50, 1), (50, .5), (53, .5), (50, 1), (51, 1), (50, 1), (50, .5), (53, .5), (56, 1), (55, 1),
        (50, 1), (50, .5), (53, .5), (50, 1), (51, 1), (58, 1.5), (57, .5), (53, 1), (51, 1)]       # 4 bars
RM = [50, 43, 46, 45, 50, 45, 43, 50]                                        # Dm Gm Bb A | Dm A Gm Dm
RJ = [50, 43, 47, 45, 50, 45, 43, 50]                                        # D G Bm A | D A G D
MINOR = {50: True, 43: True, 46: False, 45: False, 51: False, 52: True}
YOON = (0, 3, 7, 6, 7, 3, 0, 7, 0, 3, 7, 6, 7, 12, 7, 3)                     # D F A G# A...: Yoon's notes, as a figure
PLAIN = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)
INTRO = 3; BARS = 36
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def roar(t, vol=0.3):                                              # the boar
    for m in (38, 39, 45): S.add(t, brass(m + 12, 1.6 * b, vol=vol * 0.6))
    n = int(1.3 * SR); x = np.random.uniform(-1, 1, n); x = np.convolve(x, np.ones(30) / 30, 'same')
    tt = np.arange(n) / SR
    S.add(t, x * np.exp(-tt / 0.45) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 24 * tt))) * vol * 3.5)

def bed(t, roots, minor=MINOR, vol=1.0, yoon=True):                # everything under the tune, a root per bar
    for k, r in enumerate(roots):
        ostinato(S, t + k * bar, b, [r], YOON if (yoon and minor[r] and r == 50) else PLAIN, 0.06 * vol)
        power(S, t + k * bar, bar, r - 12, minor[r], vol * 0.6)
    low_end(S, t, b, roots, 0.28 * vol); drive(S, t, b, len(roots), vol)

# ---------------------------------------------------------------- the jingle (once)
hit(S, 0, 38, 1.2); roar(0, 0.34)
tune(S, bar, b, CALL, [(horn, -12, 0.42, -0.2, 0.97), (brass, 0, 0.26, 0.2, 0.95), (horn, 0, 0.2, 0.0, 0.97)])   # the call, complete
for i in range(8): S.add(bar + i * 0.5 * b, drum('taiko', 0.3 + 0.05 * i))
roll(S, bar, 4, b, 0.04, 0.3)
for m in (57, 61, 64, 69): S.add(2 * bar, strings(m, bar * 0.98, vol=0.09)); S.add(2 * bar, menchoir(m - 12, bar * 0.98, vol=0.1))   # A: the dominant, held
tune(S, 2 * bar, b, [(81, 4)], [(horn, 0, 0.3, 0.0, 0.97), (brass, -12, 0.2, -0.2, 0.97)])
for i in range(16): S.add(2 * bar + i * b / 4, timpani(45, 0.1 + 0.025 * i))
roll(S, 2 * bar + 2 * b, 2, b, 0.1, 0.45); roar(2 * bar + 2 * b, 0.2)

# ---------------------------------------------------------------- A: Pada's tune, minor
hit(S, B(1), 38)
bed(B(1), RM)
tune(S, B(1), b, HUNT, [(horn, 0, 0.36, -0.15, 0.97), (brass, -12, 0.24, 0.15, 0.95), (strings, 12, 0.1, 0.3, 0.97)])
S.add(B(5), cymbal(0.1, 1.5), pan=0.3)

# ---------------------------------------------------------------- B: the boar
hit(S, B(9), 38, 1.0); roar(B(9), 0.26)
for k in range(2):
    tune(S, B(9 + 4 * k), b, BOAR, [(brass, 12, 0.3, -0.1, 0.85), (brass, 0, 0.26, 0.15, 0.85), (menchoir, 0, 0.26, 0.1, 0.85)])
RB = [50, 50, 50, 51, 50, 50, 50, 51]                              # D, and E flat pressing down on it
for k, r in enumerate(RB):
    ostinato(S, B(9 + k), b, [r], PLAIN, 0.06); S.add(B(9 + k), slapbass(r - 12, bar * 0.5, vol=0.26))
low_end(S, B(9), b, RB, 0.28, pattern=(0, 0, 0, 12, 0, 0, 1, 0)); drive(S, B(9), b, 8, 1.05)
for m in (81, 86): S.add(B(9), strings(m, 8 * bar * 0.99, vol=0.06))            # high strings, held tense
for m in (82, 87): S.add(B(12), strings(m, bar * 0.98, vol=0.05)); S.add(B(16), strings(m, bar * 0.98, vol=0.06))
roar(B(13), 0.24); roar(B(16) + 2 * b, 0.22)

# ---------------------------------------------------------------- A2: the tune, an octave up; the horn call answers
hit(S, B(17), 38)
bed(B(17), RM, vol=1.05)
tune(S, B(17), b, HUNT, [(strings, 12, 0.34, 0.15, 0.97), (choir, 0, 0.18, -0.2, 0.97), (brass, 0, 0.28, -0.1, 0.92), (horn, 0, 0.2, 0.2, 0.97)])
for k in (18, 20, 22): tune(S, B(k), b, CALL, [(horn, -12, 0.26, 0.35, 0.95)])
for k in range(8):                                                 # the choir chanting the roots, under it
    for j in range(4): S.add(B(17 + k) + j * b, menchoir(RM[k], b * 0.6, vol=0.13, attack=0.03))
S.add(B(21), cymbal(0.11, 2), pan=-0.3)
roll(S, B(24) + 2 * b, 2, b, 0.04, 0.24, kind='tomhi', rate=4, pan=-0.3)

# ---------------------------------------------------------------- C: Pada rises: D major, at full tilt
hit(S, B(25), 38, 1.05, minor=False)
bed(B(25), RJ, {50: False, 43: False, 47: True, 45: False}, 1.1, yoon=False)
tune(S, B(25), b, PADA, [(brass, 0, 0.3, -0.1, 0.95), (horn, 0, 0.3, 0.15, 0.97), (strings, 12, 0.22, 0.3, 0.97), (choir, 0, 0.1, 0.0, 0.97)])
for k in (27, 29, 31): S.add(B(k), cymbal(0.1, 1.5), pan=(0.3, -0.3)[k % 4 // 2])

# ---------------------------------------------------------------- D: the boar against the call, a step higher
hit(S, B(33), 39, 1.05); roar(B(33), 0.26)
tune(S, B(33), b, BOAR, [(brass, 1, 0.34, -0.15, 0.85), (menchoir, 1, 0.3, 0.1, 0.85)])
for k in range(4): tune(S, B(33 + k), b, CALL, [(horn, -11, 0.28, 0.3, 0.95), (strings, 13, 0.14, 0.4, 0.95)])
RD = [51, 51, 51, 45]
for k, r in enumerate(RD): ostinato(S, B(33 + k), b, [r], PLAIN, 0.065); power(S, B(33 + k), bar, r - 12, MINOR[r], 0.6)
low_end(S, B(33), b, RD, 0.28); drive(S, B(33), b, 4, 1.15)
for i in range(16): S.add(B(36) + i * b / 4, timpani(45, 0.08 + i * 0.03))
roar(B(36), 0.24)

L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.24, reverb=0.22)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Boss_Great_Boar16.ogg', loop=loop, preview='Boss_Great_Boar16_preview.ogg', drive=4.3)
print('Great Boar intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
