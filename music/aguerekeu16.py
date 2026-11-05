import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
from island_tune import ROOTS as I_ROOTS, CH as I_CH
import marsh_tune as marsh
from ambience import *
np.random.seed(401)
R = None
# Aguerekeu, the village on stilts in the salt marsh at the river mouth: reed boats, eels, salt pans, leeches;
# living warily alongside the Hags. The Island tune as a poling song (a push on every stroke), the Marsh tune
# drifting through it, then the two together. Frogs, water slapping under the floors, reeds; a crane calls far
# off and nobody reacts. The telegraph station (Ana's) taps AGUEREKEU; and once, very faintly, a second hand
# on the line taps something else (Ana's "voice on the wire at night": Parl, listening in).
bpm = 96; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 40
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
CH = dict(I_CH); CH.update(marsh.CH)
M4F = [(65, 1), (62, 1), (60, 1), (62, 1), (62, 4)]          # the marsh's last phrase, bent to fit the F bar
COUNTER = marsh.M1 + marsh.M2 + marsh.M3 + M4F                 # the Marsh tune as a line under the Island tune

def crowd(t, dur, vol=1.0, pan=0.0):                           # a few voices (runs right up to the loop's end)
    n = int(dur * SR); x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(12) / 12, 'same') - np.convolve(x, np.ones(70) / 70, 'same')
    k = rnd(0, 1, int(dur * 5) + 2); syl = np.interp(np.arange(n) / SR * 5, np.arange(len(k)), k) ** 2
    S.add(t, x * (0.25 + syl) * np.clip(np.arange(n) / SR / 2, 0, 1) * vol * 3, pan=pan)

def row(t, roots, vol=1.0):                                     # the stroke: a push on 1 and 3, the pole drips
    for k, r in enumerate(roots):
        at = t + k * bar; low = r - 12 if r > 40 else r
        for j, iv in ((0, 0), (1.5, 7), (2, 0), (3.5, 7)):
            S.add(at + j * b, slapbass(low + iv, b * (1.2 if j in (0, 2) else 0.4), vol=0.32 * vol))
        for j in (0, 2):
            S.add(at + j * b, drum('tom', 0.3 * vol), pan=-0.25); S.add(at + j * b, drum('kick', 0.18 * vol))
        S.add(at + 1 * b, drum('log', 0.16 * vol), pan=0.3); S.add(at + 3 * b, drum('log', 0.16 * vol), pan=0.3)
        for j in range(8): S.add(at + j * b / 2, drum('shaker', (0.045 if j % 2 else 0.025) * vol), pan=0.45)

def pad(t, roots, inst=strings, vol=0.03):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

# ---------------------------------------------------------------- the village, all the way through
lap(S, 0, END, INTRO * bar, vol=0.04, pan=-0.3)                  # water slapping under the floors
frogs(S, 0, END, INTRO * bar, vol=0.016, count=4)
crowd(0, END, 0.018, pan=0.3)
for k in range(0, INTRO + BARS, 3):
    if rnd() < 0.6: reeds(S, k * bar + rnd(0, 2) * bar, rnd(2, 4) * b, 0.03)
for k in range(1, INTRO + BARS, 4):
    if rnd() < 0.7: creak(S, k * bar + rnd(0, 3) * bar, 0.05)       # the stilts and walkways
for k in (7, 19, 33): splash(S, B(k) + rnd(0, 2) * b, 0.04)       # an eel trap pulled up
mosquito(S, B(12)); mosquito(S, B(37))

# intro (once): the station taps the village's name; a pole knocks on a hull, the stroke begins
telegraph(S, 0.2, 'AGUEREKEU', b / 4, 0.14)
for at in (5, 6, 7): S.add(at * b, drum('log', 0.24), pan=-0.3)

# 1-8: the rowing song: one voice calls the Island tune, the crew answers, on the stroke
t = B(1)
for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
    t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.95, vol=0.32), pan=0.2)
    seq(S, ans, b, t, lambda m, d: marimba(m, d * 0.8, vol=0.3), pan=-0.2)
    t = seq(S, ans, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.08), pan=-0.1)
row(B(1), I_ROOTS)

# 9-16: down the river comes the Marsh tune, on a reed pipe; the stroke slows to a drift
seq(S, marsh.MARSH, b, B(9), lambda m, d: flute(m, d * 0.96, vol=0.26), pan=-0.15)
pad(B(9), marsh.ROOTS, vol=0.03)
for k, r in enumerate(marsh.ROOTS):
    S.add(B(9 + k), pluckbass(r - 12, 2 * b * 0.9, vol=0.24)); S.add(B(9 + k) + 2 * b, pluckbass(r - 5, 2 * b * 0.9, vol=0.18))
    S.add(B(9 + k), drum('tom', 0.14), pan=-0.25); S.add(B(9 + k) + 2 * b, drum('log', 0.1), pan=0.3)

# 17-24: river and sea together: the Island tune on marimba, the Marsh tune under it on the pipe
seq(S, TUNE, b, B(17), lambda m, d: marimba(m, d * 0.8, vol=0.34), pan=-0.2)
seq(S, COUNTER, b, B(17), lambda m, d: flute(m, d * 0.95, vol=0.18), pan=0.3)
seq(S, HARM, b, B(17), lambda m, d: kalimba(m, max(d, 0.4), vol=0.1), pan=0.55)
row(B(17), I_ROOTS, 0.85); pad(B(17), I_ROOTS, vol=0.025)

# 25-32: a crane calls from the deep marsh (a Hag?); nobody reacts; the village just keeps singing.
# The station taps the name again, and later, very faintly, another hand on the line taps something else
crane(S, B(25) + b, 0.06, calls=3, pan=0.9)
for k in range(2):
    seq(S, ANS1 if k == 0 else ANS2, b, B(25 + 4 * k), lambda m, d: chant(m - 12, d * 0.95, vol=0.06), pan=-0.3)
    seq(S, ANS1 if k == 0 else ANS2, b, B(25 + 4 * k), lambda m, d: marimba(m, d * 0.8, vol=0.2), pan=-0.3)
    seq(S, marsh.M1 if k == 0 else marsh.M2, b, B(27 + 4 * k), lambda m, d: flute(m, d * 0.95, vol=0.16), pan=0.3)
telegraph(S, B(27), 'AGUEREKEU', b / 4, 0.1)
telegraph(S, B(31) + b, 'IRAS', b / 3, 0.035, pan=0.7)
for k, r in enumerate((43, 43, 43, 43, 43, 43, 41, 43)):
    S.add(B(25 + k), pluckbass(r - 12, bar * 0.9, vol=0.2))
    for m in CH[r]: S.add(B(25 + k), strings(m, bar * 0.98, vol=0.025))
S.add(B(25), timpani(31, 0.12)); S.add(B(29), timpani(31, 0.12))

# 33-40: everyone: the rowing song with the river under it, flute and marimba, chant on the answers
seq(S, TUNE, b, B(33), lambda m, d: marimba(m, d * 0.8, vol=0.36), pan=-0.2)
seq(S, TUNE, b, B(33), lambda m, d: flute(m + 12, d * 0.95, vol=0.22), pan=0.25)
seq(S, COUNTER, b, B(33), lambda m, d: flute(m, d * 0.95, vol=0.14), pan=-0.45)
seq(S, ANS1, b, B(35), lambda m, d: chant(m - 12, d * 0.95, vol=0.06))
seq(S, ANS2, b, B(39), lambda m, d: chant(m - 12, d * 0.95, vol=0.06))
row(B(33), I_ROOTS); pad(B(33), I_ROOTS, vol=0.03)

L, Rr = snes_master(S.L, S.R, echo=0.24, fb=0.3, reverb=0.22)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Aguerekeu16.ogg', loop=loop, preview='Aguerekeu16_preview.ogg')
print('Aguerekeu16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
