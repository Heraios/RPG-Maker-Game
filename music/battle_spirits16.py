import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(12)
R = None
D5, E5, F5, G5, Gs5, A5, C6, D6, E6 = 74, 76, 77, 79, 80, 81, 84, 86, 88
h = .5
P1 = [(A5, h), (A5, h), (C6, h), (A5, h), (Gs5, h), (A5, h), (E5, h),
      (F5, h), (E5, h), (D5, h), (E5, h), (F5, 3 * h),
      (A5, h), (A5, h), (D6, h), (C6, h), (A5, h), (Gs5, h), (A5, h),
      (E6, h), (D6, h), (C6, h), (A5, h), (Gs5, 3 * h)]
P2 = [(D5, h), (F5, h), (A5, h), (Gs5, h), (A5, h), (R, h), (D6, h),
      (C6, h), (A5, h), (Gs5, h), (A5, h), (F5, 3 * h),
      (E5, h), (G5, h), (Gs5, h), (A5, h), (C6, h), (R, h), (Gs5, h),
      (A5, 2 * h), (R, 2 * h), (R, 3 * h)]

def main(name='Battle_Spirits_16bit'):
    bpm = 132; b = 60 / bpm; e = b / 2; bar = 7 * e
    INTRO = 2 * 4 * b; BARS = 24
    S = Stereo(INTRO + BARS * bar)
    # intro: a rolling, speeding-up run of log drums and toms across the stereo field, and a string swell
    hits = np.cumsum(np.linspace(0.32, 0.06, 18)); hits = hits / hits[-1] * (INTRO - 0.05)
    for i, t in enumerate(hits):
        S.add(t, drum('log' if i % 2 else ('tom' if i % 3 else 'tomhi'), vol=0.3 + i * 0.025), pan=(-0.6, 0.6)[i % 2])
    for m in (62, 69, 74): S.add(INTRO / 2, strings(m, INTRO / 2, vol=0.18))
    S.add(INTRO - b, flute(81, b * 0.9, vol=0.25), pan=0.3)
    t0 = INTRO

    chords = {50: (62, 65, 69), 46: (58, 62, 65), 45: (57, 61, 64)}
    roots = [50, 50, 46, 45] * 6
    for k in range(BARS):
        r = roots[k]; at = t0 + k * bar
        for m in chords[r]: S.add(at, strings(m, bar * 0.98, vol=0.09))
        for i, iv in enumerate((0, 7, 0, 12, 1, 7, 0)):
            S.add(at + i * e, slapbass(r - 12 + iv, e * 0.85, vol=0.38))
        S.add(at, drum('log', 0.5), pan=-0.3); S.add(at + 2 * e, drum('tomhi', 0.4), pan=0.4); S.add(at + 4 * e, drum('log', 0.42), pan=0.1)
        for i in range(7): S.add(at + i * e, drum('shaker', 0.16 if i in (0, 2, 4) else 0.1), pan=0.5)
        if k % 4 == 3:                                             # fae laughter: a kalimba run up
            for j, m in enumerate((86, 88, 89, 92, 93, 96)):
                S.add(at + 4 * e + j * e / 2, kalimba(m, e, vol=0.18), pan=0.6)
        if k % 8 == 7: S.add(at + 4 * e, drum('clap', 0.3))

    lead = lambda m, d: marimba(m, d, vol=0.55)
    fl = lambda m, d: flute(m, d, vol=0.4)
    t = t0
    for part, voice, pan in ((P1, lead, -0.25), (P1, fl, 0.3), (P2, lead, -0.25), (P1, lead, -0.25), (P2, fl, 0.3), (P2, lead, -0.25)):
        start = t
        t = seq(S, part, b, t, voice, pan=pan)
        if voice is fl:                       # the marimba softly shadows the flute an octave down
            seq(S, [(m - 12 if m else None, d) for m, d in part], b, start, lambda m, d: marimba(m, d, vol=0.2), pan=-0.25)
    L, Rr = snes_master(S.L, S.R)
    L, Rr, loop = finish_loop(L, Rr, t0, t0 + BARS * bar)
    save_stereo(L, Rr, name + '.ogg', loop=loop, preview=name + '_preview.ogg')
    print(name, 'intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

if __name__ == '__main__':
    main()
