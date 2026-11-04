import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(91)
R = None
G4, Bb4, C5, D5, Eb5, F5, G5, A5, Bb5, C6 = 67, 70, 72, 74, 75, 77, 79, 81, 82, 84
# The Seafarer fanfare: 1-5-1-2-flat 3, a horn call (C dorian: proud, Mediterranean)
FANFARE = [(C5, 1), (G4, .5), (C5, .5), (D5, .5), (Eb5, .5), (F5, 1),
           (G5, 2), (F5, .5), (Eb5, .5), (D5, 1),
           (Eb5, 1), (D5, .5), (C5, .5), (Bb4, 1), (D5, 1),
           (C5, 3), (R, 1)]
ANSWER = [(G5, 1), (A5, .5), (Bb5, .5), (C6, 1), (Bb5, 1),
          (A5, 1), (G5, .5), (F5, .5), (G5, 2),
          (F5, 1), (Eb5, .5), (D5, .5), (Eb5, 1), (F5, 1),
          (D5, 2), (G4, 2)]
CH = {48: (60, 63, 67), 51: (63, 67, 70), 53: (65, 69, 72), 46: (58, 62, 65), 43: (55, 58, 62)}
R1 = [48, 51, 53, 48]; R2 = [51, 53, 46, 43]
if __name__ == '__main__':
    bpm = 104; b = 60 / bpm; bar = 4 * b; INTRO = 2
    S = Stereo((INTRO + 20) * bar)
    for i in range(10): S.add(i * b / 5, drum('snare', 0.08 + i * 0.025), pan=0.15)     # a snare roll
    for iv in (0, 7, 12): S.add(2 * b, brass(48 + iv + 12, 1.5 * b, vol=0.22))
    for iv in (0, 7, 12): S.add(4 * b, brass(55 + iv + 12, 3.5 * b, vol=0.22))
    S.add(4 * b, timpani(43, 0.4)); S.add(4 * b, cymbal(0.12), pan=-0.3)
    t0 = INTRO * bar
    def chords(t, roots, vol=0.07, lyre=0.15):
        for k, r in enumerate(roots):
            at = t + k * bar
            for m in CH[r]: S.add(at, strings(m, bar * 0.98, vol=vol))
            S.add(at, pluckbass(r - 12, b * 0.9, vol=0.38)); S.add(at + 2 * b, pluckbass(r - 5, b * 0.9, vol=0.3))
            arp = list(CH[r]) + [CH[r][1] + 12]
            for j in range(8): S.add(at + j * b / 2, harp(arp[(0, 2, 1, 3)[j % 4]] + 12, b / 2, vol=lyre), pan=(-0.5, 0.5)[j % 2])
    def march(t, bars, vol=0.2):
        for k in range(bars):
            at = t + k * bar
            S.add(at, timpani(36, 0.3)); S.add(at + 2 * b, drum('kick', 0.25))
            for j, v in ((1, vol), (3, vol), (3.5, vol * 0.6)): S.add(at + j * b, drum('snare', v), pan=0.15)
    # 1: the fanfare on brass and the answer, over lyre and strings, a proud march
    t = seq(S, FANFARE + ANSWER, b, t0, lambda m, d: brass(m, d * 0.92, vol=0.3), pan=-0.1)
    chords(t0, R1 + R2); march(t0, 8)
    # 2: the city at peace: the same on the flute, the brass resting; lighter drums
    t1 = t
    seq(S, FANFARE + ANSWER, b, t1, lambda m, d: flute(m + 12, d, vol=0.38), pan=0.2)
    seq(S, FANFARE + ANSWER, b, t1 + b, lambda m, d: harp(m, d * 0.4, vol=0.1), pan=-0.4)
    chords(t1, R1 + R2, vol=0.06, lyre=0.12)
    for k in range(8): S.add(t1 + k * bar, drum('tom', 0.2), pan=-0.2); S.add(t1 + (k * 4 + 2) * b, drum('shaker', 0.1), pan=0.4)
    # 3: everyone: the fanfare once more, brass and flute together, timpani rolls
    t2 = t1 + 8 * bar
    seq(S, FANFARE, b, t2, lambda m, d: brass(m, d * 0.92, vol=0.3), pan=-0.1)
    seq(S, FANFARE, b, t2, lambda m, d: flute(m + 12, d, vol=0.3), pan=0.25)
    chords(t2, R1, vol=0.09); march(t2, 4, 0.24)
    S.add(t2, cymbal(0.1), pan=0.3)
    end = t2 + 4 * bar
    L, Rr = snes_master(S.L, S.R, echo=0.25, fb=0.3, reverb=0.22)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, 'Seafarers16.ogg', loop=loop, preview='Seafarers16_preview.ogg')
    print('Seafarers intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
