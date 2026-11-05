import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
from ambience import *
np.random.seed(431)
R = None
# Mansehare, the shore town on the rocky wet-side coast: spearfishers (Dama's), pearl divers, boats; the
# tribute goes out from here, and Seafarers live here too (Iras and his Islander wife Gara, Kathrout, the
# dock-master). The Island tune as a rowing song; the pearl divers' slow version under the waves; then the
# Island tune with the Seafarer fanfare as a friendly counter-line (made major: neighbours, not invaders);
# a Seafarer horn on the docks sounds the real one, and the town answers with its own tune.
# Surf, gulls, a harbour crowd, creaking boats; the telegraph station (Rapu's) taps MANSEHARE.
bpm = 96; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 40
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
FANFARE = [(55, 1), (62, 1), (55, .5), (57, .5), (58, 2)]                  # the Seafarer fanfare (1-5-1-2-flat 3), in G
FRIEND = [(R, 8), (55, 1), (62, 1), (55, .5), (57, .5), (59, 2), (R, 3),    # the same made major, under the answers
          (R, 8), (53, 1), (60, 1), (53, .5), (55, .5), (57, 2), (R, 3)]    # (the second time in F, for the F bar)

def crowd(t, dur, vol=1.0, pan=0.0):                           # a harbour crowd (runs right up to the loop's end)
    n = int(dur * SR); x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(12) / 12, 'same') - np.convolve(x, np.ones(70) / 70, 'same')
    k = rnd(0, 1, int(dur * 5) + 2); syl = np.interp(np.arange(n) / SR * 5, np.arange(len(k)), k) ** 2
    S.add(t, x * (0.25 + syl) * np.clip(np.arange(n) / SR / 2, 0, 1) * vol * 3, pan=pan)

def row(t, roots, vol=1.0):                                     # the stroke: heave on 1 and 3, the oars dip
    for k, r in enumerate(roots):
        at = t + k * bar; low = r - 12 if r > 40 else r
        for j, iv in ((0, 0), (1.5, 7), (2, 0), (3.5, 7)):
            S.add(at + j * b, slapbass(low + iv, b * (1.2 if j in (0, 2) else 0.4), vol=0.32 * vol))
        for j in (0, 2):
            S.add(at + j * b, drum('tom', 0.3 * vol), pan=-0.25); S.add(at + j * b, drum('kick', 0.18 * vol))
        S.add(at + 1 * b, drum('log', 0.16 * vol), pan=0.3); S.add(at + 3 * b, drum('log', 0.16 * vol), pan=0.3)
        for j in range(8): S.add(at + j * b / 2, drum('shaker', (0.045 if j % 2 else 0.025) * vol), pan=0.45)

def pad(t, roots, inst=strings, vol=0.03, beats=4):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * beats * b, inst(m, beats * b * 0.98, vol=vol))

# ---------------------------------------------------------------- the harbour, all the way through
surf(S, 0, END, INTRO * bar, vol=0.075, period=6.4, pan=0.4)
crowd(0, END, 0.03, pan=-0.4); crowd(0, END, 0.025, pan=0.3)
for k in range(0, INTRO + BARS, 3):
    if rnd() < 0.75: gull(S, k * bar + rnd(0, 2.5) * bar, 0.05, calls=np.random.randint(1, 4))
for k in range(1, INTRO + BARS, 4):
    if rnd() < 0.7: creak(S, k * bar + rnd(0, 3) * bar, 0.05)  # boats and moorings
for k in (6, 21, 35): splash(S, B(k) + rnd(0, 2) * b, 0.04)

# intro (once): the station taps the town's name; gulls; a bosun's call to the oars
telegraph(S, 0.2, 'MANSEHARE', b / 4, 0.14)
gull(S, 0.5, 0.06, 2)
for at in (5, 6, 7): S.add(at * b, drum('log', 0.26), pan=-0.3)

# 1-8: the rowing song: one voice calls the Island tune, the crew answers, on the stroke
t = B(1)
for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
    t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.95, vol=0.32), pan=0.2)
    seq(S, ans, b, t, lambda m, d: marimba(m, d * 0.8, vol=0.3), pan=-0.2)
    t = seq(S, ans, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.08), pan=-0.1)
row(B(1), ROOTS)

# 9-16: the pearl divers: the tune's answers, slow, as if heard under the water; splashes and bubbles
slow = [(m, d * 2) for m, d in ANS1 + ANS2]
seq(S, slow, b, B(9), lambda m, d: bell(m + 12, max(d * 0.5, 0.8), vol=0.15), pan=-0.2)
seq(S, slow, b, B(9) + 0.75 * b, lambda m, d: kalimba(m + 12, max(d * 0.4, 0.5), vol=0.13), pan=0.4)
dive = [43, 43, 48, 43, 43, 38, 41, 43]
pad(B(9), dive, vol=0.05)
seq(S, slow, b, B(9), lambda m, d: strings(m - 12, d * 0.95, vol=0.06), pan=0.1)
for k, r in enumerate(dive): S.add(B(9 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.28))
for k in (9, 11, 13, 15):
    splash(S, B(k) + rnd(0, 1) * b, 0.05)
    for i in range(6): bubble(S, B(k) + (1.5 + i * 0.4) * b, 0.04)

# 17-24: the Island tune on marimba, and the Seafarer fanfare made friendly under its answers (soft brass)
seq(S, TUNE, b, B(17), lambda m, d: marimba(m, d * 0.8, vol=0.34), pan=-0.2)
seq(S, HARM, b, B(17), lambda m, d: kalimba(m, max(d, 0.4), vol=0.1), pan=0.55)
seq(S, FRIEND, b, B(17), lambda m, d: brass(m, d * 0.9, vol=0.13), pan=0.35)
row(B(17), ROOTS, 0.85); pad(B(17), ROOTS, vol=0.025)

# 25-32: the docks: a Seafarer horn sounds the real fanfare (proud, minor); the town answers with its tune.
# The station taps the town's name again
for k in range(2):
    seq(S, FANFARE, b, B(25 + 4 * k), lambda m, d: brass(m, d * 0.9, vol=0.16), pan=0.65)
    seq(S, ANS1 if k == 0 else ANS2, b, B(27 + 4 * k), lambda m, d: chant(m - 12, d * 0.95, vol=0.07), pan=-0.3)
    seq(S, ANS1 if k == 0 else ANS2, b, B(27 + 4 * k), lambda m, d: marimba(m, d * 0.8, vol=0.22), pan=-0.3)
for k, r in enumerate((43, 43, 43, 43, 43, 43, 41, 43)):
    S.add(B(25 + k), pluckbass(r - 12, bar * 0.9, vol=0.2))
    for m in CH[r]: S.add(B(25 + k), strings(m, bar * 0.98, vol=0.025))
S.add(B(25), timpani(31, 0.12)); S.add(B(29), timpani(31, 0.12))
telegraph(S, B(26) + b, 'MANSEHARE', b / 4, 0.1)

# 33-40: everyone: the rowing song, flute and marimba, the friendly fanfare under it, chant on the answers
seq(S, TUNE, b, B(33), lambda m, d: marimba(m, d * 0.8, vol=0.36), pan=-0.2)
seq(S, TUNE, b, B(33), lambda m, d: flute(m + 12, d * 0.95, vol=0.22), pan=0.25)
seq(S, FRIEND, b, B(33), lambda m, d: brass(m, d * 0.9, vol=0.12), pan=0.4)
seq(S, ANS1, b, B(35), lambda m, d: chant(m - 12, d * 0.95, vol=0.06))
seq(S, ANS2, b, B(39), lambda m, d: chant(m - 12, d * 0.95, vol=0.06))
row(B(33), ROOTS); pad(B(33), ROOTS, vol=0.03)

L, Rr = snes_master(S.L, S.R, echo=0.24, fb=0.3, reverb=0.22)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Mansehare16.ogg', loop=loop, preview='Mansehare16_preview.ogg')
print('Mansehare16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
