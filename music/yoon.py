import sys; sys.path.insert(0, '.')
import numpy as np
from chip import *
np.random.seed(7)

D5, E5, F5, G5, Gs5, A5, C6, D6 = 74, 76, 77, 79, 80, 81, 84, 86
# Yoon's theme: climbs D-F-A, slips onto a "wrong" G#, settles on A. The second half ends unresolved.
A = [(D5, 1), (F5, .5), (A5, .5), (Gs5, .5), (A5, 1.5), (C6, 1), (A5, .5), (G5, .5), (F5, 2)]
B = [(D5, 1), (F5, .5), (A5, .5), (Gs5, .5), (A5, .5), (D6, 1), (C6, .5), (A5, .5), (G5, 1), (E5, 2)]
C = [(F5, 1), (G5, .5), (A5, .5), (C6, 1), (A5, 1), (G5, 1), (F5, .5), (E5, .5), (D5, 2)]
B_end = [(D5, 1), (F5, .5), (A5, .5), (Gs5, .5), (A5, .5), (D6, 1), (C6, .5), (A5, .5), (G5, 1), (D5, 2)]
ROOTS = [50, 53, 50, 45, 53, 48, 50, 45]          # D F D A | F C D A  (one per bar)

SCALE = [m + 12 * o for o in range(2, 8) for m in (2, 4, 5, 7, 9, 11, 12)]   # D dorian-ish
def third_below(m):
    below = [s for s in SCALE if s <= m]
    return below[-3] if below else m - 4

# ---------------- 1. Curious: the ghost wandering ----------------
def curious(path):
    bpm = 112; b = 60 / bpm; T = Track(34 * b)
    seq(T, A + B + C + B, b, 0, lambda m, d: pulse(m, d * 0.7, duty=0.25, vol=0.5))
    for bar, r in enumerate(ROOTS):
        for k, iv in enumerate((0, 12, 7, 12)):
            T.add((bar * 4 + k) * b, tri(r - 12 + iv, b * 0.8, vol=0.55))
    for i in range(32 * 2):
        if i % 2: T.add(i * b / 2, noise(0.05, decay=0.015, vol=0.12))
        if i % 8 == 0: T.add(i * b / 2, logdrum(52, vol=0.5))
        if i % 8 == 5: T.add(i * b / 2, logdrum(57, vol=0.35))
    save(T.buf, path)

# ---------------- 2. Eerie: the ghost alone ----------------
def eerie(path):
    bpm = 68; b = 60 / bpm; T = Track(22 * b)
    end = seq(T, A + B + [(D5, 4)], b, 0, lambda m, d: pulse(m, d, duty=0.125, vib=0.012, vol=0.45))
    for bar, r in enumerate([38, 38, 41, 45, 38]):            # a slow drone underneath
        T.add(bar * 4 * b, tri(r, 4 * b * 0.98, vol=0.6))
    for t in (2.5, 7, 11.5, 16.25):                           # drips in the lava tube
        T.add(t * b, pulse(93 + np.random.choice([0, 3, 5]), 0.18, duty=0.5, decay=0.05, vol=0.15))
    T.echo(0.33, fb=0.4)
    save(T.buf, path)

# ---------------- 3. Sweet: Yoon and Sib, the title ----------------
def sweet(path):
    bpm = 86; b = 60 / bpm; T = Track(34 * b)
    mel = A + B + C + B_end
    seq(T, mel, b, 0, lambda m, d: pulse(m, d, duty=0.5, decay=0.9, vol=0.42))
    seq(T, [(third_below(m), d) for m, d in mel], b, 0, lambda m, d: pulse(m, d, duty=0.25, decay=0.9, vol=0.2))
    for bar, r in enumerate(ROOTS):
        T.add(bar * 4 * b, tri(r - 12, 2 * b * 0.95, vol=0.55))
        T.add((bar * 4 + 2) * b, tri(r - 5, 2 * b * 0.95, vol=0.5))
        chord = [r + 12, r + 15 if r in (50, 45) else r + 16, r + 19]
        for k in range(8):                                     # soft arpeggio
            T.add((bar * 4 + k / 2) * b, pulse(chord[k % 3] + 12, b * 0.4, duty=0.125, decay=0.15, vol=0.09))
        for k, pitch in ((0, 50), (1.5, 57), (3, 55)):         # log drums: 3 + 3 + 2, an island rhythm
            T.add((bar * 4 + k) * b, logdrum(pitch, vol=0.35))
    save(T.buf, path)

if __name__ == '__main__':
    curious('yoon_1_curious.ogg'); eerie('yoon_2_eerie.ogg'); sweet('yoon_3_sweet.ogg')
