import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
np.random.seed(131)
R = None
# Boss: the Great Boar. Battle_Wild's riff (Yoon's climb and wrong note) at full weight, Pada's horn call and
# his tune, and a charge in 7/8. Reworked as a boss theme proper: fast (168), war drums on every beat, driving
# strings, low brass and a men's choir under everything, and no let-up anywhere in the loop.
#   The jingle (once, three bars): a hit and the boar's roar; Pada's horn call over a rising drum roll; the boar
#   roars back, and it begins.
#   A  (8 bars)  the riff on brass and horns; Pada's call answering high
#   A2 (8 bars)  the riff an octave up on strings and flute; the men's choir chanting on every beat
#   B  (8 bars of 7/8)  the charge: 2+2+3, relentless; the boar roars every other bar
#   C  (8 bars)  Pada rises: D major, his tune on horns, brass and strings, the drums still at full tilt
#   D  (4 bars)  up a step into E minor: the riff against the horn call, a roll, a roar, and round again
A4, B4, D5, E5, F5, Fs5, G5, Gs5, A5, B5, C6, D6 = 69, 71, 74, 76, 77, 78, 79, 80, 81, 83, 84, 86
bpm = 168; b = 60 / bpm; bar = 4 * b; bar7 = 3.5 * b
RIFF1 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (R, .5),
         (C6, .5), (R, .5), (A5, .5), (R, .5), (G5, .5), (F5, .5), (E5, .5), (R, .5)]
RIFF2 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (D6, .5),
         (C6, 1), (A5, .5), (G5, .5), (A5, 2)]
RIFF7 = [(D5, .5), (F5, .5), (A5, .5), (Gs5, .5), (A5, .5), (C6, .5), (A5, .5),
         (G5, .5), (F5, .5), (E5, .5), (F5, .5), (D5, 1.5)]                   # the riff squeezed into seven
CALL = [(D5, 1), (A4, .5), (D5, .5), (A5, 2)]                                # Pada's horn call
PADA = [(D5, 1), (A4, .5), (D5, .5), (Fs5, 1), (E5, 1), (D5, 1.5), (B4, .5), (A4, 2),
        (B4, 1), (D5, 1), (E5, 1), (Fs5, 1), (E5, 3), (R, 1),
        (Fs5, 1), (A5, 1), (B5, 1), (A5, .5), (Fs5, .5), (E5, 1), (D5, 1), (B4, 2),
        (A4, 1), (B4, .5), (D5, .5), (E5, 1), (Fs5, .5), (E5, .5), (D5, 4)]   # ... and his tune
FIG = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)
INTRO = 3
total = INTRO * bar + 28 * bar + 8 * bar7
S = Stereo(total)

def roar(t, vol=0.3):                                              # the boar
    for m in (38, 39, 45): S.add(t, brass(m + 12, 1.4 * b * 1.2, vol=vol * 0.6))
    n = int(1.3 * SR); x = np.random.uniform(-1, 1, n); x = np.convolve(x, np.ones(30) / 30, 'same')
    tt = np.arange(n) / SR
    S.add(t, x * np.exp(-tt / 0.45) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 24 * tt))) * vol * 3.5)

def bed(t, roots, minor, vol=1.0, chant=False):                    # everything under the tune, a root per bar
    ostinato(S, t, b, roots, FIG, 0.06 * vol); low_end(S, t, b, roots, 0.36 * vol); drive(S, t, b, len(roots), vol)
    for k in range(0, len(roots), 2): power(S, t + k * bar, 2 * bar, roots[k] - 12, minor[roots[k]], vol)
    if chant:
        for k, r in enumerate(roots):
            for j in range(4): S.add(t + (k * 4 + j) * b, menchoir(r - 12, b * 0.6, vol=0.2 * vol, attack=0.03))
            for j in range(4): S.add(t + (k * 4 + j) * b, menchoir(r - 5, b * 0.6, vol=0.13 * vol, attack=0.03), pan=0.3)

# ---------------------------------------------------------------- the jingle (once)
hit(S, 0, 38, 1.2); roar(0, 0.34)
tune(S, bar, b, CALL, [(horn, -12, 0.4, -0.2, 0.95), (brass, 0, 0.22, 0.2, 0.9)])
for i in range(8): S.add(bar + i * 0.5 * b, drum('taiko', 0.3 + 0.05 * i))
roll(S, bar, 4, b, 0.04, 0.3)
roar(2 * bar, 0.3); S.add(2 * bar, cymbal(0.12, 2), pan=-0.2)
for m in (50, 51, 57): S.add(2 * bar, menchoir(m, bar * 0.98, vol=0.16)); S.add(2 * bar, stab(m + 12, bar * 0.4, vol=0.06))
for i in range(16): S.add(2 * bar + i * b / 4, timpani(38, 0.1 + 0.03 * i))
roll(S, 2 * bar + 2 * b, 2, b, 0.1, 0.45)
t = INTRO * bar; loop_start = t
Am = {50: True, 48: False, 46: False, 45: False}

# ---------------------------------------------------------------- A: the riff, at full weight
hit(S, t, 38, 1.0)
bed(t, [50, 50, 48, 48, 46, 46, 45, 45], Am)
tune(S, t, b, RIFF1 + RIFF2 + RIFF1 + RIFF2, [(brass, 0, 0.34, -0.15, 0.8), (horn, -12, 0.28, 0.2, 0.85)])
for k in (1, 3, 5, 7): tune(S, t + k * bar, b, CALL, [(brass, 12, 0.14, 0.45, 0.6)])
t += 8 * bar

# ---------------------------------------------------------------- A2: an octave up; the choir chants
S.add(t, cymbal(0.13, 2), pan=0.3)
bed(t, [50, 50, 48, 48, 46, 46, 45, 45], Am, 1.05, chant=True)
tune(S, t, b, RIFF1 + RIFF2 + RIFF1 + RIFF2, [(strings, 12, 0.2, 0.2, 0.85), (flute, 12, 0.2, 0.35, 0.8), (brass, 0, 0.22, -0.2, 0.8)])
for k in range(8): tune(S, t + k * bar, b, CALL, [(horn, -12, 0.2, -0.35, 0.9)])
t += 8 * bar

# ---------------------------------------------------------------- B: the charge, in seven (2 + 2 + 3)
for k in range(8):
    at = t + k * bar7; r = (50, 50, 46, 45)[k % 4]
    for i, iv in enumerate((0, 0, 12, 0, 1, 7, 0)): S.add(at + i * b / 2, slapbass(r - 12 + iv, b / 2 * 0.85, vol=0.36))
    for i in range(7):
        strong = i in (0, 2, 4)
        S.add(at + i * b / 2, drum('taiko' if strong else 'taikohi', 0.5 if strong else 0.28), pan=(-0.2, 0.3)[i % 2])
        S.add(at + (i + 0.5) * b / 2, drum('snare', 0.08), pan=0.15)
    S.add(at + 2 * b, drum('snare', 0.4), pan=0.15); S.add(at + 3 * b, drum('snare', 0.3), pan=0.15)
    for i in range(14): S.add(at + i * b / 4, stab(r + 12 + (0, 12, 7, 12, 0, 12, 7)[i % 7], b / 4 * 0.9, vol=0.06 * (1 if i % 2 == 0 else 0.6)), pan=(-0.35, 0.35)[i % 2])
    power(S, at, bar7, r - 12, Am[r], 1.0)
    if k % 2 == 1: roar(at + 2 * b, 0.24)
tt = t
for part in (RIFF7,) * 4:
    tune(S, tt, b, part, [(brass, 0, 0.34, -0.1, 0.85), (strings, 12, 0.18, 0.3, 0.9), (horn, -12, 0.24, 0.15, 0.9)])
    tt += 2 * bar7
S.add(t, cymbal(0.13, 2), pan=-0.3)
t += 8 * bar7

# ---------------------------------------------------------------- C: Pada rises: D major, and no slower
hit(S, t, 38, 1.0, minor=False)
CM = {50: False, 43: False, 47: True, 45: False}
bed(t, [50, 43, 47, 45, 50, 45, 43, 50], CM, 1.1)
tune(S, t, b, PADA, [(horn, 0, 0.36, -0.15, 0.97), (brass, -12, 0.26, 0.1, 0.95), (strings, 12, 0.2, 0.3, 0.97), (choir, 0, 0.1, 0.0, 0.97)])
for k in (2, 4, 6): S.add(t + k * bar, cymbal(0.1, 1.5), pan=(0.3, -0.3)[k // 2 % 2])
for k in (3, 7): roll(S, t + k * bar + 2 * b, 2, b, 0.04, 0.22, kind='tomhi', rate=4, pan=-0.3)
t += 8 * bar

# ---------------------------------------------------------------- D: up a step: the riff against the call; round again
hit(S, t, 40, 1.05)
bed(t, [52, 52, 47, 47], {52: True, 47: False}, 1.15, chant=True)
tune(S, t, b, RIFF1 + RIFF2, [(brass, 2, 0.34, -0.2, 0.8), (strings, 14, 0.2, 0.3, 0.85), (flute, 14, 0.16, 0.4, 0.8)])
for k in range(4): tune(S, t + k * bar, b, CALL, [(horn, -10, 0.28, 0.3, 0.95)])
roar(t + 2 * bar, 0.26)
for i in range(16): S.add(t + 3 * bar + i * b / 4, timpani(40, 0.08 + i * 0.03))
t += 4 * bar

L, Rr = snes_master(S.L, S.R, echo=0.18, fb=0.22, reverb=0.2)
L, Rr, loop = finish_loop(L, Rr, loop_start, t)
save_stereo(L, Rr, 'Boss_Great_Boar16.ogg', loop=loop, preview='Boss_Great_Boar16_preview.ogg', drive=3.2)
print('Great Boar intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
