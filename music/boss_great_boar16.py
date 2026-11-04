import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(131)
R = None
A4, B4, D5, E5, F5, Fs5, G5, Gs5, A5, B5, C6, D6 = 69, 71, 74, 76, 77, 78, 79, 80, 81, 83, 84, 86
bpm = 150; b = 60 / bpm; bar = 4 * b; bar7 = 3.5 * b
# Battle_Wild's riff (Yoon's climb and wrong note) ...
RIFF1 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (R, .5),
         (C6, .5), (R, .5), (A5, .5), (R, .5), (G5, .5), (F5, .5), (E5, .5), (R, .5)]
RIFF2 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (D6, .5),
         (C6, 1), (A5, .5), (G5, .5), (A5, 2)]
# ... squeezed into seven (2+2+3), for the charge
RIFF7 = [(D5, .5), (F5, .5), (A5, .5), (Gs5, .5), (A5, .5), (C6, .5), (A5, .5),
         (G5, .5), (F5, .5), (E5, .5), (F5, .5), (D5, 1.5)]
# Pada's horn call and his melody (D major)
CALL = [(D5, 1), (A4, .5), (D5, .5), (A5, 2)]
PADA = [(D5, 1), (A4, .5), (D5, .5), (Fs5, 1), (E5, 1), (D5, 1.5), (B4, .5), (A4, 2),
        (B4, 1), (D5, 1), (E5, 1), (Fs5, 1), (E5, 3), (R, 1),
        (Fs5, 1), (A5, 1), (B5, 1), (A5, .5), (Fs5, .5), (E5, 1), (D5, 1), (B4, 2),
        (A4, 1), (B4, .5), (D5, .5), (E5, 1), (Fs5, .5), (E5, .5), (D5, 4)]
CHm = {50: (62, 65, 69), 48: (60, 64, 67), 46: (58, 62, 65), 45: (57, 61, 64)}
CHM = {50: (62, 66, 69), 43: (55, 59, 62), 47: (59, 62, 66), 45: (57, 61, 64)}

INTRO = 4; A_BARS, B_BARS, C_BARS, D_BARS = 8, 8, 8, 4
total = INTRO * bar + A_BARS * bar + B_BARS * bar7 + C_BARS * bar + D_BARS * bar
S = Stereo(total)

def roar(t, vol=0.3):
    for m in (26, 27, 33): S.add(t, brass(m + 12, 1.4 * b, vol=vol * 0.6))
    n = int(1.2 * SR); x = np.random.uniform(-1, 1, n); x = np.convolve(x, np.ones(30) / 30, 'same')
    S.add(t, x * np.exp(-np.arange(n) / SR / 0.4) * vol * 3)
def groove(t, roots, chords, kick=True, vol=1.0):
    riff = [0, 0, 12, 0, 10, 12, 7, 5]
    for k, r in enumerate(roots):
        at = t + k * bar
        for i, iv in enumerate(riff): S.add(at + i * b / 2, slapbass(r - 12 + iv, b / 2 * 0.85, vol=0.42 * vol))
        for m in chords[r]: S.add(at, choir(m, bar * 0.98, vol=0.05 * vol))
        for j in (0.5, 1.5, 2.5, 3.5):
            for m in chords[r]: S.add(at + j * b, stab(m + 12, b * 0.3, vol=0.05 * vol), pan=(-0.4, 0.4)[int(j) % 2])
        for i in range(8):
            if i in (0, 3, 6): S.add(at + i * b / 2, drum('tom' if i == 0 else 'log', 0.5 if i == 0 else 0.4), pan=(-0.3, 0.3)[i % 2])
            S.add(at + i * b / 2, drum('shaker', 0.1), pan=0.5)
        if kick: S.add(at, drum('kick', 0.5)); S.add(at + 2 * b, drum('kick', 0.4))
        S.add(at + b, drum('clap', 0.3)); S.add(at + 3 * b, drum('clap', 0.3))
        S.add(at, timpani(38 if r == 50 else 33, 0.35))

# INTRO: the boar's footsteps, heavier and faster; Pada's horn call rings out; the boar roars back
steps = np.cumsum(np.linspace(0.75, 0.25, 9)); steps = steps / steps[-1] * (2 * bar)
for i, t in enumerate(steps): S.add(t - steps[0], timpani(31, 0.3 + i * 0.05)); S.add(t - steps[0], drum('kick', 0.3 + i * 0.03))
for m in (38, 45): S.add(0, strings(m, 2 * bar, vol=0.08))
seq(S, CALL, b, 2 * bar, lambda m, d: brass(m - 12, d * 0.95, vol=0.38), pan=-0.2)
seq(S, CALL, b, 2 * bar, lambda m, d: brass(m, d * 0.95, vol=0.16), pan=0.3)
roar(3 * bar + 0.5 * b); S.add(3 * bar + 0.5 * b, cymbal(0.15, 2), pan=0.2)
t = INTRO * bar; loop_start = t

# A: the wild riff, huge; Pada's call answering in the gaps, high on the brass
groove(t, [50, 50, 48, 48, 46, 46, 45, 45], CHm)
tt = t
for part in (RIFF1, RIFF2, RIFF1, RIFF2):
    st = tt
    tt = seq(S, part, b, st, lambda m, d: brass(m, d * 0.75, vol=0.36), pan=-0.15)
    seq(S, part, b, st, lambda m, d: marimba(m, d * 0.7, vol=0.26), pan=0.35)
for k in (1, 3, 5, 7):
    seq(S, CALL, b, t + k * bar, lambda m, d: brass(m + 12, d * 0.6, vol=0.14), pan=0.5)
S.add(t, cymbal(0.13), pan=-0.3)
t += A_BARS * bar

# B: the charge, in seven: relentless toms and string stabs; the boar roars every other bar
for k in range(B_BARS):
    at = t + k * bar7; r = (50, 50, 46, 45)[k % 4]
    for i, iv in enumerate((0, 0, 12, 0, 1, 7, 0)): S.add(at + i * b / 2, slapbass(r - 12 + iv, b / 2 * 0.85, vol=0.44))
    for i in range(7):
        S.add(at + i * b / 2, drum('tom' if i in (0, 2, 4) else 'tomhi', 0.42 if i in (0, 2, 4) else 0.22), pan=(-0.4, 0.4)[i % 2])
        S.add(at + i * b / 2, stab(r + 12 + (0, 3, 7)[i % 3], b * 0.3, vol=0.06), pan=(0.4, -0.4)[i % 2])
    S.add(at, drum('kick', 0.5)); S.add(at, timpani(38 if r == 50 else 34, 0.4))
    for m in CHm[r]: S.add(at, choir(m, bar7 * 0.98, vol=0.06))
    if k % 2 == 1: roar(at + 2 * b, 0.22)
tt = t
for part in (RIFF7, RIFF7, RIFF7, RIFF7):
    st = tt; tt = seq(S, part, b, st, lambda m, d: brass(m, d * 0.8, vol=0.36), pan=-0.1)
    seq(S, part, b, st, lambda m, d: flute(m + 12, d * 0.8, vol=0.22), pan=0.3)
t += B_BARS * bar7

# C: Pada rises. The key turns to D MAJOR and his melody comes in on horn and strings at battle speed
S.add(t, cymbal(0.16, 2.5), pan=0.2)
groove(t, [50, 43, 47, 45, 50, 45, 43, 50], CHM)
seq(S, PADA, b, t, lambda m, d: brass(m - 12, d * 0.95, vol=0.34), pan=-0.15)
seq(S, PADA, b, t, lambda m, d: strings(m, d * 0.98, vol=0.24), pan=0.2)
seq(S, PADA, b, t + b / 2, lambda m, d: kalimba(m + 12, d * 0.5, vol=0.08), pan=0.55)   # the children, around him
t += C_BARS * bar

# D: everything at once: Yoon's riff against Pada's call, a timpani roll back into the fight
groove(t, [50, 50, 45, 45], CHm)
seq(S, RIFF1 + RIFF2, b, t, lambda m, d: brass(m, d * 0.75, vol=0.34), pan=-0.2)
for k in range(4): seq(S, CALL, b, t + k * bar, lambda m, d: brass(m - 12, d * 0.95, vol=0.2), pan=0.35)
for i in range(16): S.add(t + 3 * bar + i * b / 4, timpani(38, 0.08 + i * 0.03))
roar(t + 2 * bar, 0.25)
t += D_BARS * bar

L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.25, reverb=0.18)
L, Rr, loop = finish_loop(L, Rr, loop_start, t)
save_stereo(L, Rr, 'Boss_Great_Boar16.ogg', loop=loop, preview='Boss_Great_Boar16_preview.ogg')
print('Great Boar intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
