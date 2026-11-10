import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from marsh_tune import M1, M2, M3, M4, MARSH, ROOTS, LULL1, LULL2
from battle_kit import *
np.random.seed(1401)
R = None
# Battle_Salt_Marsh: a fight in the salt marsh. The area's own music turned into a grim march for full
# orchestra, no ambience: the Marsh tune (E minor, leaning on its uneasy B flat) in the same key as Salt_Marsh
# and at exactly twice its pulse (140 against 70), so the battle grows straight out of the place.
#   The jingle (once, one bar): a hit, and the brass climbing the tune's first notes onto the B flat.
#   1-8   the tune on horns and low brass over driving strings and war drums
#   9-16  the men's choir chants it, low; brass stabs on the tritone; high above, the Hags' lullaby in three
#         against the march's four (they are watching)
#   17-24 it sweeps: the strings carry the tune an octave up, the horns answer with its second half
#   25-28 E against B flat, hammered; a roll back to the top
bpm = 140; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 28
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
MINOR = {40: True, 36: False, 38: False, 34: False}
FIG = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)          # the strings' figure, in sixteenths
RISE = [(64, .25), (67, .25), (69, .25), (71, .25)]                  # E G A B: the tune's first steps, fast

def chords(t, roots, vol=1.0, choir_too=True):
    for k, r in enumerate(roots): power(S, t + k * bar, bar, r, MINOR[r], vol, choir_too)

# ---------------------------------------------------------------- the jingle (once)
hit(S, 0, 40, 1.1)
seq(S, RISE + [(70, 2)], b, b, lambda m, d: brass(m, d * 0.95, vol=0.34), pan=-0.1)       # ...onto the B flat
seq(S, RISE + [(70, 2)], b, b, lambda m, d: horn(m - 12, d * 0.95, vol=0.2), pan=0.2)
for m in (40, 46): S.add(2 * b, menchoir(m, 2 * b, vol=0.14))                          # E and B flat: the tritone
roll(S, b, 3, b, 0.05, 0.4)
for i in range(6): S.add((1 + i * 0.5) * b, drum('taiko', 0.3 + 0.07 * i))

# ---------------------------------------------------------------- 1-8: the tune, marching
hit(S, B(1), 40)
tune(S, B(1), b, MARSH, [(horn, 0, 0.34, -0.15, 0.95), (brass, -12, 0.2, 0.15, 0.9), (strings, 12, 0.07, 0.3, 0.95)])
ostinato(S, B(1), b, ROOTS, FIG, 0.06); low_end(S, B(1), b, ROOTS); march(S, B(1), b, 8); chords(B(1), ROOTS, 0.8)

# ---------------------------------------------------------------- 9-16: the chant; the tritone; the Hags' lullaby above
tune(S, B(9), b, MARSH, [(menchoir, -12, 0.42, 0.0, 0.9), (menchoir, 0, 0.2, 0.25, 0.9), (brass, -12, 0.2, -0.2, 0.85)])
ostinato(S, B(9), b, ROOTS, (0, None, 7, None, 12, None, 7, None), 0.07, octave=0); low_end(S, B(9), b, ROOTS, 0.36)
march(S, B(9), b, 8, 1.05)
for k in (10, 12, 14, 16):                                          # E with B flat, stabbed
    for m in (52, 58, 64, 70): S.add(B(k) + 3 * b, brass(m, b * 0.45, vol=0.15), pan=0.2); S.add(B(k) + 3.5 * b, stab(m + 12, b * 0.3, vol=0.07), pan=-0.2)
seq(S, LULL1 + LULL2, b, B(11), lambda m, d: flute(m + 24, d * 0.9, vol=0.16), pan=0.5)
seq(S, LULL1 + LULL2, b, B(11), lambda m, d: bell(m + 24, max(d * 0.4, 0.4), vol=0.05), pan=0.6)
S.add(B(9), cymbal(0.1, 1.5), pan=-0.3)

# ---------------------------------------------------------------- 17-24: the sweep
hit(S, B(17), 40, 0.9)
tune(S, B(17), b, MARSH, [(strings, 12, 0.24, 0.1, 0.97), (choir, 0, 0.12, -0.2, 0.97), (brass, 0, 0.16, -0.1, 0.92)])
tune(S, B(17), b, M3 + M4 + M1 + M2, [(horn, 0, 0.2, 0.35, 0.95)])
ostinato(S, B(17), b, ROOTS, FIG, 0.065); low_end(S, B(17), b, ROOTS, 0.36); march(S, B(17), b, 8, 1.1); chords(B(17), ROOTS, 1.0)
S.add(B(21), cymbal(0.11, 2), pan=0.3)
for k in (20, 24): roll(S, B(k) + 2 * b, 2, b, 0.03, 0.2, kind='tomhi', rate=4, pan=-0.3)

# ---------------------------------------------------------------- 25-28: E against B flat, hammered
for k, r in enumerate((40, 34, 40, 34)):
    hit(S, B(25 + k), r, 0.85, minor=(r == 40))
    power(S, B(25 + k), bar, r, r == 40, 1.0)
    seq(S, [(m + (0 if r == 40 else 6), d) for m, d in RISE], b, B(25 + k) + 2 * b, lambda m, d: brass(m, d * 0.9, vol=0.26), pan=(-0.2, 0.2)[k % 2])
    S.add(B(25 + k) + 3 * b, brass(71 if r == 40 else 70, b * 0.9, vol=0.24))
ostinato(S, B(25), b, [40, 34, 40, 34], FIG, 0.065); low_end(S, B(25), b, [40, 34, 40, 34], 0.36); march(S, B(25), b, 4, 1.1, fill=False)
for i in range(16): S.add(B(28) + i * b / 4, timpani(40, 0.08 + 0.025 * i))
roll(S, B(28) + 2 * b, 2, b, 0.06, 0.42)

L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.24, reverb=0.24)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Battle_Salt_Marsh16.ogg', loop=loop, preview='Battle_Salt_Marsh16_preview.ogg', drive=3.2)
print('Battle_Salt_Marsh16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
