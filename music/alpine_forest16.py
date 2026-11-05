import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import *
np.random.seed(361)
R = None
# The alpine forest: the Lady of the Woods in her highland aspect, a great goat-centaur: polite but cold.
# The same Falmi theme as the laurel forest, but slow, high and frosty: Lydian (B natural for B flat, an airy,
# chilly brightness), over open fifths with no warm thirds. Wind in the pines, creaking trunks, a woodpecker,
# ravens, a stream; her hooves on stone and goat bells as she passes, stately and courteous. Then her husband
# the Shepherd of the Deer: a lone shepherd's pipe playing the theme freely, the songs priests teach him.
F5, G5, A5, B5, C6, D6, E5, F6 = 77, 79, 81, 83, 84, 86, 76, 89
GROW = [[(F5, .5), (A5, .5)], [(F5, .5), (A5, .5), (C6, .5)], [(F5, .5), (A5, .5), (C6, .5), (F6, 1.5)]]
F1 = [(C6, .5), (A5, .5), (F5, .5), (A5, .5), (C6, 1), (D6, .5), (C6, .5), (B5, .5), (A5, .5), (G5, .5), (A5, .5), (F5, 2)]
F2 = [(D6, .5), (C6, .5), (B5, .5), (A5, .5), (G5, 1), (C6, 1), (A5, .5), (F5, .5), (G5, .5), (E5, .5), (F5, 2)]
THEME = F1 + F2
SLOW = [(m, d * 2) for m, d in THEME]                    # half speed: 8 bars
ROOTS = [41, 41, 43, 41, 43, 48, 48, 41]                 # F F G F | G C C F  (a bar each, at half speed)
OPEN = lambda r: (r + 12, r + 19, r + 26)                # root, fifth, ninth: open and cold
bpm = 66; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 60
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def chords(t, roots, inst=strings, vol=0.035, beats=4):
    for k, r in enumerate(roots):
        for m in OPEN(r): S.add(t + k * beats * b, inst(m, beats * b * 0.98, vol=vol))

def drone(t, bars, vol=0.04):
    for m in (29, 36): S.add(t, organ(m + 12, bars * bar * 0.99, vol=vol))

def frost(t, vol=0.06):                                   # the sprouting motif, as frost: high, slow, glassy
    for g in GROW:
        t = seq(S, [(m + 12, d * 2) for m, d in g], b, t, lambda m, d: bell(m, max(d, 1.0), vol=vol), pan=0.4) + b
    return t

# ---------------------------------------------------------------- the mountain, all the way through
bed_wind(S, 0, END, INTRO * bar, vol=0.065, smooth=18, pan=-0.2)
bed_wind(S, 0, END, INTRO * bar, vol=0.03, smooth=45, pan=0.3)
stream(S, 0, END, INTRO * bar, vol=0.026, pan=-0.6)
for k in range(0, INTRO + BARS, 5): gust(S, k * bar + rnd(0, 3) * bar, rnd(4, 8) * b, 0.06, whistle=rnd(700, 1100))
for k in range(1, INTRO + BARS, 4):
    if rnd() < 0.7: creak(S, k * bar + rnd(0, 3) * bar)
for k in (5, 19, 33, 47, 57): woodpecker(S, B(k) + rnd(0, 2) * b)
for k in (11, 27, 43, 55): raven(S, B(k) + rnd(0, 2) * b, caws=np.random.randint(1, 4))
for k in range(4, INTRO + BARS, 7): trill(S, k * bar + rnd(0, 3) * bar, 0.03)

# 1-8: cold air: an open-fifth drone, the sprouting motif as frost
drone(B(1), 8, 0.035)
frost(B(2)); frost(B(6), 0.045)

# 9-16: the theme, very slow, on harp and glassy bells, over open chords
seq(S, SLOW, b, B(9), lambda m, d: harp(m, max(d, 1.0), vol=0.22), pan=-0.15)
seq(S, SLOW, b, B(9) + 0.03, lambda m, d: bell(m + 12, max(d * 0.5, 0.6), vol=0.03), pan=0.35)
chords(B(9), ROOTS, vol=0.03)
for k, r in enumerate(ROOTS): S.add(B(9 + k), pluckbass(r - 12, bar * 0.9, vol=0.22))

# 17-24: she passes: hooves on stone, her herd's bells; the theme on strings and choir, stately and courteous
hooves(S, B(17), 24, b, vol=0.1, pan=-0.5)
hooves(S, B(21), 20, b, vol=0.07, pan=0.4)
goatbells(S, B(18), 3 * bar, 0.03); goatbells(S, B(22), 2.5 * bar, 0.025)
seq(S, SLOW, b, B(17), lambda m, d: strings(m - 12, d * 0.97, vol=0.1), pan=-0.1)
seq(S, SLOW, b, B(17), lambda m, d: choir(m, d * 0.97, vol=0.05), pan=0.2)
chords(B(17), ROOTS, vol=0.035); chords(B(17), ROOTS, inst=choir, vol=0.025)
for k, r in enumerate(ROOTS):
    S.add(B(17 + k), timpani(r + 12 if r < 45 else r, 0.1))
    S.add(B(17 + k), pluckbass(r - 12, bar * 0.9, vol=0.25))

# 25-32: the Shepherd of the Deer: a lone pipe playing the theme freely, with turns and long held notes;
# a deer barks, the herd bells answer
pipe = []
for i, (m, d) in enumerate(SLOW):
    if d >= 2 and i % 3 == 0: pipe += [(m + 2, .25), (m, d - .25)]          # a little turn from above
    else: pipe.append((m, d))
seq(S, pipe, b, B(25), lambda m, d: flute(m, d * 0.97, vol=0.2), pan=0.3)
drone(B(25), 8, 0.04)
deer(S, B(27) + 2 * b); deer(S, B(30) + b, 0.06)
goatbells(S, B(28), 2 * bar, 0.02)

# 33-40: snow falling: almost nothing; bells high and far apart; the drone thins
for i, m in enumerate((89, 84, 81, 88, 86, 81, 77, 84, 79, 77)):
    S.add(B(33) + i * 3 * b + rnd(0, 0.3), bell(m + 12 if m < 84 else m, 0.6, vol=0.035), pan=rnd(-0.8, 0.8))
for m in (41, 48): S.add(B(33), strings(m + 12, 8 * bar * 0.98, vol=0.025))

# 41-52: her courtesy warms a little: the theme at its own pace, flute and harp, a measured step
seq(S, THEME + THEME, b, B(41), lambda m, d: flute(m, d * 0.93, vol=0.2), pan=0.15)
seq(S, THEME + THEME, b, B(41) + b / 2, lambda m, d: harp(m - 12, max(d, 0.6), vol=0.1), pan=-0.35)
half = [41, 41, 43, 41, 43, 48, 48, 41]                  # two chords a bar now
for k in range(16):
    r = half[k % 8]; at = B(41) + k * 2 * b
    for m in OPEN(r): S.add(at, strings(m, 2 * b * 0.98, vol=0.03))
    S.add(at, pluckbass(r - 12, 2 * b * 0.9, vol=0.25))
    S.add(at, drum('tom', 0.12), pan=-0.3); S.add(at + b, drum('tomhi', 0.07), pan=0.3)      # hooves, slowly
hooves(S, B(43), 12, 2 * b, vol=0.06, pan=0.5)
seq(S, SLOW[:12], b, B(49), lambda m, d: choir(m - 12, d * 0.97, vol=0.04))                 # 49-52: and it rests
chords(B(49), ROOTS[:4], vol=0.03)

# 53-60: alone again: wind, a raven, the frost motif, home
frost(B(54), 0.05)
drone(B(53), 8, 0.03)

L, Rr = snes_master(S.L, S.R, echo=0.36, fb=0.42, reverb=0.4, cutoff=9500)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Alpine_Forest16.ogg', loop=loop, preview='Alpine_Forest16_preview.ogg')
print('Alpine_Forest16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
