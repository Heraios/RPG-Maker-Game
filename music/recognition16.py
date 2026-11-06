import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A as YA, B as YB
from sib import S1, SIB
np.random.seed(651)
R = None
# Recognition (end of Act 1): Sib realises who the ghost is. Grief's unheard answer, reversed. In Grief, Sib
# plays the counting tune and Yoon answers so faintly no one hears. Here it starts the same way (the intro,
# once)... but then Yoon's answer comes back clearer, stuck on the "wrong" G sharp; and Sib plays Yoon's notes
# back and resolves them: Sib has recognised Yoon. Yoon finishes the phrase; then they play together.
#   1-2   Sib's counting tune, slow, on the flute
#   3-4   Yoon answers on the kalimba, heard this time, stopping on the G sharp
#   5-6   Sib plays Yoon's notes back, and resolves the G sharp to A
#   7-8   Yoon finishes the phrase
#   9-16  together: Yoon's theme and Sib's, twice, the strings and choir swelling
#   17-20 a breath, and the bell from the start
bpm = 66; b = 60 / bpm; bar = 4 * b
INTRO = 4; BARS = 20
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
CH = {50: (62, 65, 69), 53: (65, 69, 72), 48: (60, 64, 67), 45: (57, 61, 64), 40: (56, 59, 64), 'am': (57, 60, 64)}
slow = lambda ph: [(m, d * 2) for m, d in ph]
YOON_Q = [(74, 2), (77, 1), (81, 1), (80, 4)]                     # D F A ... G sharp (the question)
SIB_ECHO = [(74, 2), (77, 1), (81, 1), (80, 2), (81, 2)]          # ... and Sib answers it: A
YOON_END = [(84, 2), (81, 1), (79, 1), (77, 4)]                   # C A G F: Yoon's phrase, finished

def pad(t, roots, inst=strings, vol=0.05, beats=4):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * beats * b, inst(m, beats * b * 0.98, vol=vol))

def low(t, roots, vol=0.24, beats=4):
    for k, r in enumerate(roots):
        S.add(t + k * beats * b, pluckbass((57 if r == 'am' else r) - 12, beats * b * 0.9, vol=vol))

# intro (once): a bell; Sib's tune as in Grief; Yoon's answer, faint, unheard
S.add(0.3 * b, bell(86, 2.5, vol=0.1), pan=0.3)
seq(S, slow(S1), b, bar, lambda m, d: flute(m, d * 0.95, vol=0.28), pan=0.3)
seq(S, slow(YA[:4]), b, 3 * bar, lambda m, d: bell(m + 12, max(d, 0.8), vol=0.025), pan=-0.6)
pad(bar, [53, 48, 50, 50], beats=4, vol=0.035)

# 1-2: Sib again
seq(S, slow(S1), b, B(1), lambda m, d: flute(m, d * 0.95, vol=0.3), pan=0.3)
pad(B(1), [53, 48]); low(B(1), [53, 48])

# 3-4: Yoon answers: heard
seq(S, YOON_Q, b, B(3), lambda m, d: kalimba(m, max(d * 0.8, 0.8), vol=0.3), pan=-0.3)
seq(S, YOON_Q, b, B(3) + 0.5 * b, lambda m, d: bell(m + 12, max(d * 0.4, 0.8), vol=0.04), pan=-0.6)
pad(B(3), [50, 40]); low(B(3), [50, 40])

# 5-6: Sib plays it back, and resolves it
seq(S, SIB_ECHO, b, B(5), lambda m, d: flute(m, d * 0.95, vol=0.32), pan=0.3)
pad(B(5), [50]); pad(B(6), [40], beats=2); pad(B(6) + 2 * b, [45], beats=2)
low(B(5), [50]); low(B(6), [40, 45], beats=2)
S.add(B(6) + 2 * b, bell(93, 2, vol=0.06), pan=0.4)

# 7-8: Yoon finishes the phrase
seq(S, YOON_END, b, B(7), lambda m, d: kalimba(m, max(d * 0.8, 0.8), vol=0.3), pan=-0.3)
seq(S, YOON_END, b, B(7), lambda m, d: strings(m - 12, d * 0.97, vol=0.08), pan=-0.1)
pad(B(7), [53, 50]); low(B(7), [53, 50])

# 9-16: together. Yoon's theme on the marimba, Sib's on the flute; then swapped, fuller, with the choir
mel = YA + YB
seq(S, mel, b, B(9), lambda m, d: marimba(m, d * 0.85, vol=0.4), pan=-0.3)
seq(S, SIB, b, B(9), lambda m, d: flute(m, d * 0.95, vol=0.34), pan=0.3)
pad(B(9), [50, 53, 50, 'am'], vol=0.06); low(B(9), [50, 53, 50, 'am'], 0.28)
for k in range(4): S.add(B(9 + k), timpani(38 if k % 2 == 0 else 41, 0.12))
seq(S, SIB, b, B(13), lambda m, d: flute(m, d * 0.95, vol=0.36), pan=0.25)
seq(S, mel, b, B(13), lambda m, d: strings(m - 12, d * 0.97, vol=0.14), pan=-0.2)
seq(S, mel, b, B(13), lambda m, d: kalimba(m, max(d * 0.7, 0.4), vol=0.18), pan=-0.4)
pad(B(13), [50, 53, 50, 'am'], vol=0.07); pad(B(13), [50, 53, 50, 'am'], inst=choir, vol=0.05); low(B(13), [50, 53, 50, 'am'], 0.3)
for k in range(4):
    for j in range(8): S.add(B(13 + k) + j * b / 2, harp(CH[(50, 53, 50, 'am')[k]][(0, 1, 2, 1)[j % 4]] + 12, b, vol=0.07), pan=(-0.5, 0.5)[j % 2])
S.add(B(13), cymbal(0.05, 3), pan=0.2)

# 17-20: a breath; F major, warm; then the bell from the start
for m in (65, 69, 72, 77): S.add(B(17), strings(m - 12, 2 * bar * 0.98, vol=0.06)); S.add(B(17), choir(m - 12, 2 * bar * 0.98, vol=0.04))
S.add(B(17), pluckbass(41, 2 * bar * 0.9, vol=0.24))
seq(S, [(77, 1), (81, 1), (84, 2)], b, B(17) + b, lambda m, d: kalimba(m, max(d, 0.6), vol=0.2), pan=-0.3)
seq(S, [(84, 1), (84, 1), (84, 2)], b, B(18), lambda m, d: flute(m - 12, d * 0.9, vol=0.2), pan=0.3)
for m in (53, 60, 65): S.add(B(19), strings(m, 2 * bar * 0.98, vol=0.05)); S.add(B(19), choir(m + 12, 2 * bar * 0.98, vol=0.03))
S.add(B(19), pluckbass(41, 2 * bar * 0.9, vol=0.16))
S.add(B(20), bell(86, 2.5, vol=0.08), pan=0.3)

L, Rr = snes_master(S.L, S.R, echo=0.32, fb=0.38, reverb=0.36)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Recognition16.ogg', loop=loop, preview='Recognition16_preview.ogg')
print('Recognition16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
