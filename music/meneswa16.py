import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(111)
R = None
B4, C5, Db5, Eb5, F5, Gb5, G5, Ab5 = 71, 72, 73, 75, 77, 78, 79, 80
# Meneswa: Thenmy opens with a noble fifth (C up to G). She opens with the tritone, C up to G-flat,
# the "devil's interval", then falls through his dark D-flat. A slow, cold waltz in three.
THEME = [(C5, 2), (Gb5, 1),
         (F5, 1.5), (Eb5, .5), (Db5, 1),
         (C5, 1), (Db5, 1), (Eb5, 1),
         (Db5, 3),
         (Ab5, 2), (G5, 1),
         (Gb5, 1.5), (F5, .5), (Eb5, 1),
         (Db5, 1), (C5, 1), (B4, 1),
         (C5, 3)]
ROOTS = [48, 49, 48, 49, 44, 42, 43, 48]                 # Cm Db Cm Db | Ab Gb G Cm
CH = {48: (60, 63, 67), 49: (61, 65, 68), 44: (56, 60, 63), 42: (54, 58, 61), 43: (55, 59, 62)}
bpm = 66; b = 60 / bpm; bar = 3 * b; INTRO = 2; BARS = 16
S = Stereo((INTRO + BARS) * bar)
# intro: a bell tolls twice over a low organ drone
for k in range(2): S.add(k * bar, bell(60, 2.5, vol=0.3), pan=-0.2); S.add(k * bar, bell(66, 2, vol=0.12), pan=0.3)
S.add(0, organ(36, INTRO * bar * 0.98, vol=0.3)); S.add(0, organ(42, INTRO * bar * 0.98, vol=0.15))
t0 = INTRO * bar
def waltz(t, vol_chord=0.11):
    for k, r in enumerate(ROOTS):
        at = t + k * bar
        S.add(at, pluckbass(r - 12, b * 0.95, vol=0.45)); S.add(at, timpani(36 if r in (48, 44) else 37, 0.3))
        for j in (1, 2):                                        # oom-pah-pah, sinister: organ chords on 2 and 3
            for m in CH[r]: S.add(at + j * b, organ(m, b * 0.5, vol=vol_chord), pan=(-0.3, 0.3)[j - 1])
# A: the theme on organ, low brass an octave down; choir held under it
seq(S, THEME, b, t0, lambda m, d: organ(m, d * 0.97, vol=0.32), pan=-0.1)
seq(S, THEME, b, t0, lambda m, d: brass(m - 12, d * 0.95, vol=0.2), pan=0.15)
for k, r in enumerate(ROOTS):
    for m in CH[r]: S.add(t0 + k * bar, choir(m + 12, bar * 0.98, vol=0.05))
waltz(t0)
# B: higher and colder: the choir sings the theme, strings shiver above, bells on the tritones, timpani swell
t1 = t0 + 8 * bar
seq(S, THEME, b, t1, lambda m, d: choir(m, d * 0.98, vol=0.3), pan=0)
seq(S, THEME, b, t1, lambda m, d: strings(m + 12, d * 0.98, vol=0.1), pan=0.3)
seq(S, [(m + 12 if m in (Gb5, B4, Ab5) else None, d) for m, d in THEME], b, t1, lambda m, d: bell(m, 1.2, vol=0.14), pan=-0.4)
waltz(t1, 0.13)
for k in range(8):
    for i in range(6): S.add(t1 + k * bar + (2 + i / 6) * b, timpani(36, 0.03 + 0.02 * i + 0.01 * k))
S.add(t1 + 7 * bar, cymbal(0.15, dur=2.5), pan=0.2)
end = t0 + BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.35, reverb=0.32)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Meneswa16.ogg', loop=loop, preview='Meneswa16_preview.ogg')
print('Meneswa intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
