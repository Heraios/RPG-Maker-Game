import sys; sys.path.insert(0, '.')
import numpy as np
from chip import *
from yoon import A as YA, B as YB, third_below, ROOTS
np.random.seed(3)

F5, G5, A5, B5, C6, D6, E6, F6 = 77, 79, 81, 83, 84, 86, 88, 89
R = None
# Sib: a reciting tone (C, three times: counting), small careful steps, breaths, then a stubborn climb.
S1 = [(C6, .5), (C6, .5), (C6, .5), (R, .5), (B5, .5), (A5, .5), (G5, 1)]
S2 = [(A5, .5), (B5, .5), (C6, .5), (R, .5), (D6, .5), (C6, .5), (A5, 1)]
S3 = [(F5, .5), (G5, .5), (A5, .5), (B5, .5), (C6, 1), (R, .5), (C6, .5)]
S4 = [(D6, .5), (E6, .5), (F6, 3)]
SIB = S1 + S2 + S3 + S4
SIB_ROOTS = [53, 48, 53, 50]            # F | C | F | D  (one per bar)

def soft(m, d): return pulse(m, d, duty=0.5, decay=0.7, vol=0.42)

# ---------------- 1. Sib ----------------
def sib(path):
    bpm = 96; b = 60 / bpm; T = Track(34 * b)
    seq(T, SIB + SIB, b, 0, soft)
    for bar, r in enumerate(SIB_ROOTS * 2):
        T.add(bar * 4 * b, tri(r - 12, 2 * b * 0.9, vol=0.5))
        T.add((bar * 4 + 2) * b, tri(r - 5, 2 * b * 0.9, vol=0.45))
        for k in range(4):                               # quiet page-turning ticks
            T.add((bar * 4 + k + 0.5) * b, noise(0.03, decay=0.008, vol=0.06))
    save(T.buf, path)

# ---------------- 2. The little priest (shrine) ----------------
def priest(path):
    bpm = 70; b = 60 / bpm; T = Track(22 * b)
    seq(T, SIB + [(F5, 2), (R, 2)], b, 0, lambda m, d: pulse(m, d, duty=0.25, vib=0.006, decay=1.5, vol=0.4))
    T.add(0, tri(41, 20 * b, vol=0.55))                 # one long F drone, like a held chant
    T.add(0, tri(48, 20 * b, vol=0.25))
    for bar in range(5):
        T.add(bar * 4 * b, logdrum(45, dur=0.6, vol=0.45))
        T.add((bar * 4 + 3) * b, logdrum(52, dur=0.4, vol=0.25))
    T.echo(0.42, fb=0.35)
    save(T.buf, path)

# ---------------- 3. Yoon and Sib ----------------
def duet(path):
    bpm = 92; b = 60 / bpm; T = Track(42 * b)
    yoon = lambda m, d: pulse(m, d * 0.85, duty=0.25, vol=0.42)
    t = seq(T, YA, b, 0, yoon)                          # Yoon calls...
    t = seq(T, S1 + S2, b, t, soft)                    # ...Sib answers
    t2 = seq(T, YB, b, t, yoon)                        # then both at once: Yoon's melody,
    seq(T, S3 + S4, b, t, lambda m, d: soft(m - 12, d))    # and Sib's climb underneath it
    end = [(74, 4)]                                    # both land on D, together
    seq(T, end, b, t2, yoon); seq(T, [(77, 4)], b, t2, lambda m, d: soft(m - 12, d))
    roots = ROOTS[:2] + SIB_ROOTS[:2] + ROOTS[2:4] + [50]
    for bar, r in enumerate(roots):
        T.add(bar * 4 * b, tri(r - 12, 4 * b * 0.95, vol=0.5))
        if bar < 6:
            for k, pitch in ((0, 50), (1.5, 57), (3, 55)):
                T.add((bar * 4 + k) * b, logdrum(pitch, vol=0.28))
    save(T.buf, path)

sib('sib_1_sib.ogg'); priest('sib_2_little_priest.ogg'); duet('sib_3_yoon_and_sib.ogg')
