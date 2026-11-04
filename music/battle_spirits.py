import sys; sys.path.insert(0, '.')
import numpy as np
from chip import *
from battle import save_loop, clap
np.random.seed(9)
R = None
D5, E5, F5, G5, Gs5, A5, C6, D6, E6 = 74, 76, 77, 79, 80, 81, 84, 86, 88

def spirits(name='Battle_Spirits'):
    bpm = 132; b = 60 / bpm; e = b / 2           # e = one eighth note
    bar = 7 * e                                    # 7/8, grouped 2 + 2 + 3
    INTRO_S = 2 * 4 * b                            # A's intro: two bars of 4/4
    BARS = 24
    T = Track(INTRO_S + BARS * bar + 2)
    # A's intro: a log-drum roll speeding up, and a rising whoop
    hits = np.cumsum(np.linspace(0.32, 0.06, 18)); hits = hits / hits[-1] * (INTRO_S - 0.05)
    for i, h in enumerate(hits): T.add(h, logdrum(50 + (i % 3) * 3, dur=0.2, vol=0.25 + i * 0.02))
    T.add(INTRO_S / 2, pulse(62, INTRO_S / 2 * 0.9, duty=0.25, vib=0.06, vol=0.25))
    t0 = INTRO_S

    roots = [50, 50, 46, 45] * 6                   # Dm Dm Bb A, over and over, a little hypnotic
    for k in range(BARS):
        r = roots[k]; at = t0 + k * bar
        for i, iv in enumerate((0, 7, 0, 12, 1, 7, 0)):          # 2+2+3, with a sly flat-second
            T.add(at + i * e, tri(r - 12 + iv, e * 0.8, vol=0.55))
        for i, (p, v) in {0: (57, 0.45), 2: (62, 0.32), 4: (60, 0.38)}.items():   # high, light log drums
            T.add(at + i * e, logdrum(p, dur=0.18, vol=v))
        for i in range(7): T.add(at + i * e, noise(0.03, decay=0.008, vol=0.07 if i not in (0, 2, 4) else 0.11))
        if k % 4 == 3:                                             # a fae giggle: a sparkling run up
            for j, m in enumerate((86, 88, 89, 92, 93, 96)):
                T.add(at + 4 * e + j * e / 2, pulse(m, e * 0.45, duty=0.125, decay=0.08, vol=0.12))

    giggle = lambda m, d: pulse(m, d * 0.85, duty=0.125, vib=0.025, vol=0.42)
    low = lambda m, d: pulse(m - 12, d * 0.85, duty=0.25, vol=0.4)
    h = .5
    p1 = [(A5, h), (A5, h), (C6, h), (A5, h), (Gs5, h), (A5, h), (E5, h),
          (F5, h), (E5, h), (D5, h), (E5, h), (F5, 3 * h),
          (A5, h), (A5, h), (D6, h), (C6, h), (A5, h), (Gs5, h), (A5, h),
          (E6, h), (D6, h), (C6, h), (A5, h), (Gs5, 3 * h)]
    p2 = [(D5, h), (F5, h), (A5, h), (Gs5, h), (A5, h), (R, h), (D6, h),
          (C6, h), (A5, h), (Gs5, h), (A5, h), (F5, 3 * h),
          (E5, h), (G5, h), (Gs5, h), (A5, h), (C6, h), (R, h), (Gs5, h),
          (A5, 2 * h), (R, 2 * h), (R, 3 * h)]
    t = t0
    for part, voice in ((p1, giggle), (p1, low), (p2, giggle), (p1, giggle), (p2, low), (p2, giggle)):
        t = seq(T, part, b, t, voice)
    save_loop(T.buf, t0, t0 + BARS * bar, name)

if __name__ == '__main__':
    spirits()
