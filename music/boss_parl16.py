import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(411)
R = None
# Boss: Parl, the pearl thief. His jig (A minor, with its cheeky D sharp) made a fight, crossed with
# Battle_Seafarers (the Seafarer fanfare riff, fast, in A phrygian with its B flat): the thief and the
# soldier he used to be. All in a driving 12/8, a chase. The intro is built like the Great Boar's:
# running footsteps, faster and faster; his whistle (the start of his theme) and the brass answering;
# then the fanfare struck all at once.
A4, B4, C5, D5, Ds5, E5, G4, Gs4, Fs4, E4 = 69, 71, 72, 74, 75, 76, 67, 68, 66, 64
P1 = [(A4, 1), (C5, 1), (E5, 1), (Ds5, 1), (E5, 1), (C5, 1), (B4, 2), (G4, 1), (A4, 3),
      (E4, 1), (G4, 1), (A4, 1), (B4, 1), (C5, 1), (D5, 1), (E5, 2), (D5, 1), (B4, 3)]
P2 = [(C5, 1), (B4, 1), (A4, 1), (Gs4, 1), (A4, 1), (B4, 1), (C5, 2), (E5, 1), (A4, 3),
      (Fs4, 1), (G4, 1), (A4, 1), (C5, 2), (B4, 1), (A4, 6)]            # Parl's theme, in eighths
C1 = [(45, 'm'), (43, 'M'), (45, 'm'), (40, 'm')]; C2 = [(40, 'M'), (45, 'm'), (50, 'M'), (45, 'm')]
# the Seafarer riff (Battle_Seafarers), in A phrygian, its quarter notes turned to pairs of eighths
_q = [(72, .5), (67, .5), (72, .5), (73, .5), (75, 1), (72, 1), (79, 1.5), (77, .5), (75, .5), (73, .5), (72, 1),
      (70, .5), (72, .5), (73, .5), (75, .5), (77, .5), (75, .5), (73, 1), (72, 2), (67, 2)]
RIFF = [(m - 3, int(d * 2)) for m, d in _q] + [(R, 4)]                 # 36 eighths: 3 bars of 12/8
UP = [(m + 5 if m else None, d) for m, d in RIFF]
HOME = [(A4, 6), (E4, 6), (A4, 6), (B4, 6), (C5, 12), (R, 12)]           # his homesick fanfare, slow
e = 60 / 112 / 3; bar = 12 * e; half = 6 * e                             # 12/8, a dotted quarter = 112
INTRO = 4; BARS = 8 + 6 + 4 + 4
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def triad(r, q): return (r + 12, r + 12 + (4 if q == 'M' else 3), r + 19)

def groove(t, chords, vol=1.0, drill=True):                             # a chord per half bar (six eighths)
    for k, (r, q) in enumerate(chords):
        at = t + k * half; low = r - 12 if r > 40 else r
        for j, iv, d in ((0, 0, 1.5), (3, 7, 1), (4, 12, 0.8), (5, 7, 0.8)):
            S.add(at + j * e, slapbass(low + iv, d * e, vol=0.4 * vol))
        for j in (2, 5):
            for m in triad(r, q): S.add(at + j * e, stab(m + 12, e * 0.8, vol=0.05 * vol), pan=(-0.4, 0.4)[j == 5])
        S.add(at, drum('kick', 0.45 * vol)); S.add(at + 3 * e, drum('snare', 0.3 * vol), pan=0.15)
        if drill:
            for j in range(6): S.add(at + j * e, drum('snare', (0.07 if j % 3 == 0 else 0.035) * vol), pan=0.2)
        for j in range(6): S.add(at + j * e, drum('shaker', 0.06 * vol), pan=0.5)
        if k % 2 == 0: S.add(at, timpani(r if r < 45 else r - 12, 0.25 * vol))

def pads(t, chords, vol=0.04):
    for k, (r, q) in enumerate(chords):
        for m in triad(r, q): S.add(t + k * half, strings(m, half * 0.98, vol=vol))

# INTRO: running feet, faster and faster; his whistle, the brass answers; the fanfare struck all at once
steps = np.cumsum(np.linspace(0.7, 0.2, 12)); steps = steps / steps[-1] * (2 * bar)
for i, t in enumerate(steps):
    S.add(t - steps[0], drum('kick', 0.25 + i * 0.02)); S.add(t - steps[0] + 0.06, drum('snare', 0.08 + i * 0.012), pan=0.2)
for m in (45, 52): S.add(0, strings(m, 2 * bar, vol=0.07))
for j, m in enumerate((A4 + 12, C5 + 12, E5 + 12)): S.add(2 * bar + j * e, flute(m, e * 0.9, vol=0.36), pan=0.4)   # his whistle
S.add(2 * bar + 4 * e, drum('clap', 0.3)); S.add(2 * bar + 5 * e, drum('clap', 0.25))
for j, m in enumerate((A4 - 12, C5 - 12, E5 - 12)): S.add(2 * bar + (6 + j) * e, brass(m, e * 0.9, vol=0.3), pan=-0.3)  # the brass, answering
for i in range(6): S.add(3 * bar + i * e, drum('snare', 0.1 + i * 0.05), pan=0.15)
for iv in (0, 7, 12, 13): S.add(3 * bar + 6 * e, brass(57 + iv, 4 * e, vol=0.16))       # the fanfare's chord, all at once
S.add(3 * bar + 6 * e, timpani(33, 0.5)); S.add(3 * bar + 6 * e, cymbal(0.16, 2), pan=0.2)

# A (1-8): his jig, as a fight: flute, then marimba with brass stabs
seq(S, P1 + P2, e, B(1), lambda m, d: flute(m + 12, d * 0.85, vol=0.38), pan=0.15)
seq(S, P1 + P2, e, B(1), lambda m, d: marimba(m, d * 0.7, vol=0.2), pan=-0.3)
seq(S, P1 + P2, e, B(5), lambda m, d: marimba(m + 12, d * 0.8, vol=0.4), pan=-0.15)
seq(S, P1 + P2, e, B(5), lambda m, d: brass(m, d * 0.6, vol=0.14), pan=0.3)
groove(B(1), (C1 + C2) * 2); pads(B(1), (C1 + C2) * 2, 0.03)
S.add(B(1), cymbal(0.1), pan=0.3); S.add(B(5), cymbal(0.1), pan=-0.3)

# B (9-14): the Seafarer riff, his old drill; his whistle darts in at the end of each phrase
seq(S, RIFF + UP, e, B(9), lambda m, d: brass(m, d * 0.85, vol=0.32), pan=-0.1)
seq(S, RIFF + UP, e, B(9), lambda m, d: stab(m - 12, d * 0.6, vol=0.12), pan=0.3)
rc = [(45, 'm'), (45, 'm'), (41, 'M'), (43, 'M'), (45, 'm'), (45, 'M')]
uc = [(50, 'm'), (50, 'm'), (46, 'M'), (48, 'M'), (50, 'm'), (45, 'M')]
groove(B(9), rc + uc, 1.05)
for s in (11, 14): seq(S, [(A4 + 24, 1), (C5 + 24, 1), (E5 + 24, 1), (Ds5 + 24, 1), (E5 + 24, 2)], e, B(s) + 6 * e,
                       lambda m, d: flute(m - 12, d * 0.8, vol=0.26), pan=0.45)
S.add(B(9), cymbal(0.12), pan=0.3)

# C (15-18): a breath: his homesick fanfare, slow; the drums drop to a heartbeat, then roll back in
seq(S, HOME, e, B(15), lambda m, d: flute(m, d * 0.95, vol=0.3), pan=0.1)
seq(S, HOME, e, B(15), lambda m, d: strings(m - 12, d * 0.95, vol=0.07), pan=-0.2)
for k, (r, q) in enumerate([(45, 'm'), (40, 'm'), (48, 'M'), (40, 'M')]):
    for m in triad(r, q): S.add(B(15 + k), strings(m, bar * 0.98, vol=0.04))
    S.add(B(15 + k), pluckbass(r - 12, bar * 0.9, vol=0.3)); S.add(B(15 + k), drum('kick', 0.3))
    S.add(B(15 + k) + 6 * e, drum('kick', 0.2))
for i in range(12): S.add(B(18) + i * e, drum('snare', 0.05 + i * 0.025), pan=0.15)

# D (19-22): both at once: his jig high on the flute, the riff low on the brass
seq(S, P1 + P2, e, B(19), lambda m, d: flute(m + 12, d * 0.85, vol=0.36), pan=0.25)
seq(S, RIFF[:-1] + [(64, 2), (69, 2)], e, B(19), lambda m, d: brass(m - 12, d * 0.85, vol=0.26), pan=-0.25)
groove(B(19), C1 + C2, 1.1); pads(B(19), C1 + C2, 0.035)
S.add(B(19), cymbal(0.12), pan=0.2)

L, Rr = snes_master(S.L, S.R, echo=0.18, fb=0.22, reverb=0.14)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Boss_Parl16.ogg', loop=loop, preview='Boss_Parl16_preview.ogg')
print('Boss_Parl16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
