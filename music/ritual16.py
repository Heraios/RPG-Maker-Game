import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A as YA, B as YB, C as YC, B_end as YB_END, ROOTS
np.random.seed(601)
R = None
# The Ritual: building Yoon's body, the climax of Act 2. Every ingredient and every friend brings their own
# few notes, each one placed where it fits Yoon's chords, and they gather into Yoon's theme as Yoon gets a body.
#   1-8   the gathering: one at a time, over a low drone and a slow 3-3-2 on the slit drums:
#         Pada's horn call, Sib's counting notes, Dama's call (moved into D), Yoon's "wrong" G sharp
#         (the ghost, waiting), Falmi's sprouting notes (the living ingredients), Lasa's skipping tune,
#         the Island tune's first notes (the island itself).
#   9-16  all of them again, now two and three at once, the drums and the choir building
#   17-24 Yoon's theme, whole: flute, strings and choir, the friends' notes woven round it
#   25-28 a breath: the chord turns major, and a heartbeat: the first one.
bpm = 76; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 28
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
CH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 60, 64), 48: (60, 64, 67), 46: (58, 62, 65)}

PADA = [(74, 1), (69, .5), (74, .5), (81, 2)]                                   # the horn call
SIB = [(84, .5), (84, .5), (84, .5), (R, .5), (83, .5), (81, .5), (79, 1)]      # counting: C C C, then down
DAMA = [(74, 1), (69, 1), (74, 1.5), (76, .5)]                                  # her call, in D
GHOST = [(R, 2), (80, 1), (81, 1)]                                              # Yoon's G sharp, resolving
FALMI = [(77, .5), (81, .5), (84, .5), (89, 1.5), (R, 1)]                       # the sprout
LASA = [(79, .5), (76, .5), (72, .5), (74, 1), (76, .5), (79, 1)]               # her skip, in C
ISLE = [(77, 1), (79, .5), (81, .5), (84, 1), (84, 1)]                          # the Island call, in F

def pad(t, roots, inst=strings, vol=0.06):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

def bass(t, roots, vol=0.32, walk=False):
    for k, r in enumerate(roots):
        at = t + k * bar
        if walk: S.add(at, pluckbass(r - 12, 2 * b * 0.95, vol=vol)); S.add(at + 2 * b, pluckbass(r - 5, 2 * b * 0.95, vol=vol * 0.85))
        else: S.add(at, pluckbass(r - 12, bar * 0.95, vol=vol))

def slit(t, bars, vol=0.2):                                   # the slit drums: 3-3-2
    for k in range(bars):
        for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')): S.add(t + k * bar + j * b, drum(kind, vol), pan=(-0.3, 0.3, 0.1)[int(j) % 3])

def roll(t, beats, v0, v1):                                   # a timpani roll, swelling
    steps = int(beats * 6)
    for i in range(steps): S.add(t + i * b / 6, timpani(38, v0 + (v1 - v0) * i / steps))

pada = lambda v: (lambda m, d: brass(m - 12, d * 0.95, vol=v))
sib = lambda v: (lambda m, d: kalimba(m, max(d, 0.4), vol=v))
dama = lambda v: (lambda m, d: marimba(m, d * 0.9, vol=v))
ghost = lambda v: (lambda m, d: bell(m + 12, max(d, 0.8), vol=v))
falmi = lambda v: (lambda m, d: kalimba(m, max(d, 0.4), vol=v))
lasa = lambda v: (lambda m, d: harp(m, max(d, 0.5), vol=v))
isle = lambda v: (lambda m, d: choir(m, d * 0.98, vol=v))

# intro (once): a bell, the choir humming on D, Sib's three counting notes: Sib begins the reading
S.add(0.2, bell(86, 2.5, vol=0.1), pan=0.3)
for m in (50, 57): S.add(0.5 * b, choir(m, (INTRO * bar - 0.5 * b) * 0.98, vol=0.05))
for k in range(3): S.add((4 + k * 0.5) * b, kalimba(84, b * 0.5, vol=0.22), pan=0.35)

# the drone under 1-16: D and A, low strings and organ
for s in (1, 9):
    for m in (38, 45): S.add(B(s), strings(m, 8 * bar * 0.99, vol=0.05))
    S.add(B(s), organ(38, 8 * bar * 0.99, vol=0.03))

# ---------------------------------------------------------------- 1-8: the gathering, one at a time
seq(S, PADA, b, B(1), pada(0.28), pan=-0.3)
seq(S, SIB, b, B(2), sib(0.3), pan=0.35)
seq(S, DAMA, b, B(3), dama(0.36), pan=-0.2)
seq(S, GHOST, b, B(4), ghost(0.08), pan=0.5)
seq(S, FALMI, b, B(5), falmi(0.3), pan=0.2)
seq(S, LASA, b, B(6), lasa(0.28), pan=-0.35)
seq(S, ISLE, b, B(7), isle(0.12))
seq(S, GHOST, b, B(8), ghost(0.1), pan=0.5)
pad(B(1), ROOTS, inst=choir, vol=0.03)
slit(B(1), 8, 0.12)
roll(B(8) + 2 * b, 2, 0.02, 0.12)

# ---------------------------------------------------------------- 9-16: all of them, two and three at once
seq(S, PADA, b, B(9), pada(0.3), pan=-0.3); seq(S, ISLE, b, B(9), isle(0.13))
seq(S, SIB, b, B(10), sib(0.3), pan=0.35); seq(S, FALMI, b, B(10), lambda m, d: marimba(m - 12, d * 0.9, vol=0.26), pan=-0.25)
seq(S, DAMA, b, B(11), dama(0.36), pan=-0.2); seq(S, ISLE, b, B(11), lambda m, d: flute(m, d * 0.9, vol=0.22), pan=0.3)
seq(S, SIB, b, B(12), lambda m, d: flute(m - 12, d * 0.9, vol=0.26), pan=0.3); seq(S, GHOST, b, B(12), ghost(0.1), pan=0.5)
seq(S, FALMI, b, B(13), falmi(0.3), pan=0.2); seq(S, SIB, b, B(13), lambda m, d: flute(m - 12, d * 0.9, vol=0.24), pan=-0.3)
seq(S, LASA, b, B(14), lasa(0.3), pan=-0.35); seq(S, LASA, b, B(14) + b / 2, lambda m, d: bell(m + 12, 0.6, vol=0.05), pan=0.55)
seq(S, PADA, b, B(15), pada(0.3), pan=-0.3); seq(S, DAMA, b, B(15), dama(0.3), pan=0.2); seq(S, ISLE, b, B(15), isle(0.14))
seq(S, [(R, 1), (80, 1), (81, 2)], b, B(16), lambda m, d: choir(m - 12, d * 0.98, vol=0.18))
seq(S, [(R, 1), (80, 1), (81, 2)], b, B(16), ghost(0.12), pan=0.5)
pad(B(9), ROOTS, vol=0.05); pad(B(9), ROOTS, inst=choir, vol=0.035); bass(B(9), ROOTS, 0.3)
slit(B(9), 7, 0.2)
roll(B(16), 4, 0.06, 0.3); S.add(B(16) + 2 * b, cymbal(0.08, 3), pan=0.2)

# ---------------------------------------------------------------- 17-24: Yoon's theme, whole
mel = YA + YB + YC + YB_END
seq(S, mel, b, B(17), lambda m, d: flute(m, d * 0.97, vol=0.42), pan=0.1)
seq(S, mel, b, B(17), lambda m, d: strings(m - 12, d * 0.97, vol=0.14), pan=-0.15)
seq(S, mel, b, B(17), lambda m, d: choir(m - 12, d * 0.98, vol=0.1))
pad(B(17), ROOTS, vol=0.07); pad(B(17), ROOTS, inst=choir, vol=0.04); bass(B(17), ROOTS, 0.38, walk=True)
for k, r in enumerate(ROOTS):                                    # marimba arpeggios, as in Yoon's sweet section
    chord = [r + 12, r + 15 if r in (50, 45) else r + 16, r + 19]
    for j in range(8): S.add(B(17 + k) + j * b / 2, marimba(chord[j % 3] + 12, b * 0.4, vol=0.08), pan=(-0.5, 0.5)[j % 2])
slit(B(17), 8, 0.3)
for k in range(8): S.add(B(17 + k), timpani(38 if ROOTS[k] in (50, 45) else 41, 0.2))
S.add(B(17), cymbal(0.07, 2.5), pan=-0.2)
seq(S, PADA, b, B(17), pada(0.16), pan=-0.5)                     # the friends, woven round it
seq(S, SIB, b, B(18) + 2 * b, sib(0.14), pan=0.6)
seq(S, FALMI, b, B(21), falmi(0.14), pan=0.55)
seq(S, LASA, b, B(22), lambda m, d: bell(m + 12, 0.6, vol=0.05), pan=-0.55)
seq(S, DAMA, b, B(23), dama(0.16), pan=-0.5)

# ---------------------------------------------------------------- 25-28: a breath, made whole; the first heartbeat
for m in (62, 66, 69, 74): S.add(B(25), choir(m, 2 * bar * 0.98, vol=0.07)); S.add(B(25), strings(m - 12, 2 * bar * 0.98, vol=0.05))
S.add(B(25), pluckbass(38, 2 * bar * 0.9, vol=0.3)); S.add(B(25), bell(86, 2.5, vol=0.1), pan=0.3)
seq(S, [(74, 1), (78, .5), (81, .5), (86, 2)], b, B(25) + b, lambda m, d: kalimba(m, max(d, 0.6), vol=0.26), pan=-0.2)   # D F# A: major
for at in (B(26), B(26) + 0.42, B(27), B(27) + 0.42):              # lub-dub, lub-dub
    first = at in (B(26), B(27))
    S.add(at, drum('kick', 0.32 if first else 0.2)); S.add(at, timpani(38, 0.18 if first else 0.1))
for m in (38, 45): S.add(B(27), strings(m, 2 * bar * 0.98, vol=0.045))          # back to the drone, for the next time round
S.add(B(27), choir(62, 2 * bar * 0.98, vol=0.04))
for k in range(3): S.add(B(28) + (2 + k * 0.5) * b, kalimba(84, b * 0.5, vol=0.16), pan=0.35)

L, Rr = snes_master(S.L, S.R, echo=0.32, fb=0.36, reverb=0.4)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Ritual16.ogg', loop=loop, preview='Ritual16_preview.ogg')
print('Ritual16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
