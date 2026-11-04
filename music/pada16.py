import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(121)
R = None
A4, B4, D5, E5, Fs5, A5, B5 = 69, 71, 74, 76, 78, 81, 83
# Pada: the hunter's horn call (open fifths), then a plain, warm folk tune in D major, Yoon's home note
# made warm. Phrases trail off quietly: a shy man.
CALL = [(D5, 1), (A4, .5), (D5, .5), (A5, 2)]
THEME = [(D5, 1), (A4, .5), (D5, .5), (Fs5, 1), (E5, 1),
         (D5, 1.5), (B4, .5), (A4, 2),
         (B4, 1), (D5, 1), (E5, 1), (Fs5, 1),
         (E5, 3), (R, 1),
         (Fs5, 1), (A5, 1), (B5, 1), (A5, .5), (Fs5, .5),
         (E5, 1), (D5, 1), (B4, 2),
         (A4, 1), (B4, .5), (D5, .5), (E5, 1), (Fs5, .5), (E5, .5),
         (D5, 3), (R, 1)]
ROOTS = [50, 43, 47, 45, 50, 45, 43, 50]        # D G Bm A | D A G D
CH = {50: (62, 66, 69), 43: (55, 59, 62), 47: (59, 62, 66), 45: (57, 61, 64)}
bpm = 76; b = 60 / bpm; bar = 4 * b; INTRO = 2
S = Stereo((INTRO + 8 * 3) * bar)

def harmony(t, vol=0.07, kalimba_vol=0.0, walk=True):
    for k, r in enumerate(ROOTS):
        at = t + k * bar
        for m in CH[r]: S.add(at, strings(m, bar * 0.98, vol=vol))
        if walk:                                         # a patient walking bass: root, fifth, root, approach
            nxt = ROOTS[(k + 1) % 8]
            for j, m in enumerate((r - 12, r - 5, r - 12, nxt - 13 if nxt > r else nxt - 11)):
                S.add(at + j * b, pluckbass(m, b * 0.9, vol=0.36))
        if kalimba_vol:
            arp = list(CH[r]) + [CH[r][0] + 12]
            for j in range(8): S.add(at + j * b / 2, kalimba(arp[(0, 1, 2, 3, 2, 1, 2, 3)[j]] + 12, b / 2, vol=kalimba_vol), pan=(-0.5, 0.5)[j % 2])

def footsteps(t, bars, vol=0.16):
    for k in range(bars):
        for j in range(4): S.add(t + k * bar + j * b, drum('log' if j % 2 else 'tom', vol), pan=(-0.25, 0.25)[j % 2])

# intro: the horn call, answered by its own echo across the forest; wind in the strings
seq(S, CALL, b, 0, lambda m, d: brass(m - 12, d * 0.95, vol=0.3), pan=-0.3)
seq(S, CALL, b, 4 * b, lambda m, d: brass(m - 12, d * 0.95, vol=0.12), pan=0.5)
for m in (50, 57): S.add(0, strings(m, INTRO * bar * 0.98, vol=0.06))
t0 = INTRO * bar
# A: the theme low and plain, on cello-like strings with the horn; the walk; quiet footsteps
seq(S, THEME, b, t0, lambda m, d: strings(m - 12, d * 0.98, vol=0.28), pan=-0.1)
seq(S, THEME, b, t0, lambda m, d: brass(m - 12, d * 0.9, vol=0.12), pan=0.2)
harmony(t0, vol=0.05); footsteps(t0, 8)
# B: home. The flute takes the tune; a kalimba ripples around it (the children); island drums, gently
t1 = t0 + 8 * bar
seq(S, THEME, b, t1, lambda m, d: flute(m, d, vol=0.4), pan=0.15)
seq(S, THEME, b, t1, lambda m, d: strings(m - 24, d * 0.98, vol=0.12), pan=-0.2)
harmony(t1, vol=0.06, kalimba_vol=0.11)
for k in range(8):
    for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')): S.add(t1 + k * bar + j * b, drum(kind, 0.2), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
# C: the protector. Horn and strings together, full and strong, timpani; then the last phrase alone,
# quietly, on kalimba, as if he's embarrassed by the fuss
t2 = t1 + 8 * bar
seq(S, THEME[:16], b, t2, lambda m, d: brass(m - 12, d * 0.95, vol=0.32), pan=-0.15)
seq(S, THEME[:16], b, t2, lambda m, d: strings(m, d * 0.98, vol=0.2), pan=0.2)
for k in range(4): S.add(t2 + k * bar, timpani(38 if ROOTS[k] == 50 else 43, 0.3))
harmony(t2, vol=0.09)
seq(S, THEME[16:], b, t2 + 4 * bar, lambda m, d: kalimba(m, d, vol=0.35), pan=0.1)
footsteps(t2 + 4 * bar, 4, vol=0.1)
end = t0 + 24 * bar
L, Rr = snes_master(S.L, S.R, echo=0.28, fb=0.3, reverb=0.22)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Pada16.ogg', loop=loop, preview='Pada16_preview.ogg')
print('Pada intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
