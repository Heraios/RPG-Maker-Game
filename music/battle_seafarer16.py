import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(101)
R = None
G4, Ab4, Bb4, C5, Db5, Eb5, F5, G5, Ab5, Bb5, C6 = 67, 68, 70, 72, 73, 75, 77, 79, 80, 82, 84
bpm = 156; b = 60 / bpm; bar = 4 * b; INTRO, BARS = 2, 16
# the Seafarer fanfare made fast and fierce, with Thenmy's dark D-flat in it (C phrygian)
RIFF = [(C5, .5), (G4, .5), (C5, .5), (Db5, .5), (Eb5, 1), (C5, 1),
        (G5, 1.5), (F5, .5), (Eb5, .5), (Db5, .5), (C5, 1),
        (Bb4, .5), (C5, .5), (Db5, .5), (Eb5, .5), (F5, .5), (Eb5, .5), (Db5, 1),
        (C5, 2), (G4, 2)]
UP = [((m + 5) if m else None, d) for m, d in RIFF]          # the same, a fourth higher
RUNS = [(C6, .25), (Bb5, .25), (Ab5, .25), (G5, .25), (F5, .25), (Eb5, .25), (Db5, .25), (C5, .25)] * 2 + \
       [(Eb5, .5), (F5, .5), (G5, .5), (Ab5, .5), (G5, 1), (F5, .5), (Eb5, .5)] + \
       [(Db5, .25), (Eb5, .25), (F5, .25), (G5, .25), (Ab5, .25), (Bb5, .25), (C6, .25), (Db5 + 12, .25)] * 2 + \
       [(C6, 2), (G5, 2)]
S = Stereo((INTRO + BARS) * bar)
for i in range(16): S.add(i * b / 4, drum('snare', 0.06 + i * 0.018), pan=0.15)   # a drilled snare roll
for t, iv_set in ((0, (0, 7)), (1, (0, 1)), (1.5, (0, 7, 12))):                   # brass clusters, then the hit
    for iv in iv_set: S.add((4 + t * 2) * b, brass(60 + iv, b * 0.9 if t < 1.5 else 2 * b, vol=0.2))
S.add(7 * b, timpani(36, 0.5)); S.add(7 * b, cymbal(0.15), pan=-0.2)
t0 = INTRO * bar
roots = [48, 44, 46, 48, 53, 49, 51, 43, 48, 44, 46, 48, 49, 48, 46, 43]   # C Ab Bb C | F Db Eb G ...
for k, r in enumerate(roots):
    at = t0 + k * bar
    for i, iv in enumerate((0, 0, 12, 0, 1, 0, 10, 0)): S.add(at + i * b / 2, slapbass(r - 12 + iv, b / 2 * 0.85, vol=0.42))
    for j in (0.5, 1.5, 2.5, 3.5):                                          # off-beat string stabs
        for iv in (12, 15, 19): S.add(at + j * b, stab(r + iv, b * 0.35, vol=0.07), pan=(-0.4, 0.4)[int(j) % 2])
    S.add(at, drum('kick', 0.5)); S.add(at + 2 * b, drum('kick', 0.4))
    S.add(at, timpani(36 if r not in (49, 51, 53) else 41, 0.3))
    for j in range(16):                                                     # drilled sixteenth-note snare
        v = 0.3 if j in (4, 12) else (0.12 if j % 2 == 0 else 0.06)
        S.add(at + j * b / 4, drum('snare', v), pan=0.15)
    if k in (0, 8): S.add(at, cymbal(0.12), pan=0.3)
t = seq(S, RIFF + UP, b, t0, lambda m, d: brass(m, d * 0.85, vol=0.32), pan=-0.1)       # bars 1-8
seq(S, RIFF + UP, b, t0, lambda m, d: stab(m - 12, d * 0.6, vol=0.12), pan=0.3)
t = seq(S, RUNS, b, t, lambda m, d: flute(m, d * 0.9, vol=0.34), pan=0.2)                 # bars 9-12: flute runs
seq(S, RUNS[:16], b, t - 16 * b + 0, lambda m, d: marimba(m - 12, d, vol=0.15), pan=-0.4)
seq(S, RIFF, b, t, lambda m, d: brass(m, d * 0.85, vol=0.34), pan=-0.1)                  # bars 13-16: the riff, all in
seq(S, RIFF, b, t, lambda m, d: flute(m + 12, d * 0.9, vol=0.26), pan=0.25)
end = t0 + BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.19, fb=0.25, reverb=0.15)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Battle_Seafarers16.ogg', loop=loop, preview='Battle_Seafarers16_preview.ogg')
print('Battle Seafarers intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
