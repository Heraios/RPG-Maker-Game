import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(311)
R = None
C5, Db5, D5, E5, F5, G5, A5, B5, C6 = 72, 73, 74, 76, 77, 79, 81, 83, 84
THEME = [(C5, 1), (G5, 1.5), (F5, .5), (E5, 1),       # Thenmy's theme (as in thenmy16.py)
         (D5, .5), (E5, .5), (F5, 1), (G5, 2),
         (A5, 1), (G5, .5), (F5, .5), (E5, 1), (Db5, 1),
         (C5, 3), (R, 1),
         (E5, 1), (G5, 1), (C6, 1.5), (B5, .5),
         (A5, 1), (G5, 1), (F5, 2),
         (E5, 1), (F5, .5), (G5, .5), (A5, 1), (D5, 1),
         (C5, 4)]
T_ROOTS = [48, 43, 41, 37, 48, 41, 45, 43]
T_CH = {48: (60, 64, 67), 43: (55, 59, 62), 41: (53, 57, 60), 37: (49, 53, 56), 45: (57, 60, 64)}
# Prologue: Thenmy telling the story. A storyteller's lyre (harp) by a fire, soft enough to read over.
# His own theme opens and closes it; in the middle, the myth: Star Mother's stars (bells) and the
# Destroyer's shadow (a D flat chord, low timpani) before the lyre comes home.
bpm = 66; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 8 + 8 + 8
S = Stereo((INTRO + BARS) * bar)
CH = dict(T_CH); CH.update({40: (52, 56, 59), 45: (57, 60, 64)})
MYTH = [(88, 2), (86, 1), (84, 1), (79, 4),          # Star Mother's stars falling ...
        (81, 2), (84, 1), (83, 1), (81, 4),
        (77, 2), (79, 1), (81, 1), (80, 2), (77, 2),  # ... one stolen (the D flat)
        (76, 8)]
M_ROOTS = [45, 48, 41, 45, 41, 37, 40, 45]           # Am C F Am | F Db E Am

def fire(t, dur, vol=1.0):                           # crackle: tiny random clicks
    n = int(dur * SR); x = np.zeros(n)
    idx = np.random.randint(0, n, int(dur * 9)); x[idx] = np.random.uniform(-1, 1, len(idx))
    x = np.convolve(x, np.exp(-np.arange(300) / 40), 'same')
    x += lowpass(np.random.uniform(-1, 1, n), 300) * 0.6          # the soft roar under it
    S.add(t, x * np.clip(np.arange(n) / SR / 1.5, 0, 1) * vol, pan=-0.2)   # runs right up to the loop's end

def lyre(t, roots, vol=0.14, pattern=(0, 1, 2, 3, 2, 1, 0, 3)):
    for k, r in enumerate(roots):
        arp = list(CH[r]) + [CH[r][0] + 12]
        for j, p in enumerate(pattern):
            S.add(t + k * bar + j * b / 2, harp(arp[p] + 12, b * 0.9, vol=vol * (1.2 if j == 0 else 1)),
                  pan=(-0.35, 0.35)[j % 2])
        S.add(t + k * bar, harp(r if r < 45 else r - 12, bar, vol=vol * 1.6))

def pad(t, roots, inst=strings, vol=0.04):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

# intro (once): the fire, and the lyre tuning up on his fifth (C, G)
fire(0, (INTRO + BARS) * bar, 0.18)
for k, m in enumerate((48, 55, 60, 67)): S.add(k * 0.75 * b, harp(m, 3 * b, vol=0.16), pan=(-0.3, 0.3)[k % 2])
S.add(4 * b, harp(72, 4 * b, vol=0.1)); S.add(5.5 * b, harp(79, 3 * b, vol=0.08), pan=0.3)
t0 = INTRO * bar

# A: "Long ago..." His theme, softly, on flute over the lyre
seq(S, THEME, b, t0, lambda m, d: flute(m, d * 0.97, vol=0.3), pan=0.15)
lyre(t0, T_ROOTS)
pad(t0, T_ROOTS, vol=0.03)

# B: the myth: bells for the stars, a choir, low strings; the D flat chord with a timpani rumble under it
t1 = t0 + 8 * bar
seq(S, MYTH, b, t1, lambda m, d: bell(m, max(d, 1.2), vol=0.13), pan=-0.2)
seq(S, MYTH, b, t1 + 0.75 * b, lambda m, d: bell(m + 12, 0.5, vol=0.03), pan=0.5)          # their twinkle
seq(S, MYTH, b, t1, lambda m, d: flute(m - 12, d * 0.97, vol=0.14), pan=0.2)
lyre(t1, M_ROOTS, vol=0.09, pattern=(0, 2, 1, 3, 0, 2, 1, 3))
pad(t1, M_ROOTS, inst=choir, vol=0.04)
for k, r in enumerate(M_ROOTS): S.add(t1 + k * bar, strings(r - 12, bar * 0.98, vol=0.07))
for i in range(16): S.add(t1 + 5 * bar + i * b / 4, timpani(37, 0.03 + i * 0.012))           # the Destroyer
S.add(t1 + 6 * bar, timpani(37, 0.3))

# C: "...and that is why..." the theme again on the lyre itself, strings carrying it home
t2 = t1 + 8 * bar
seq(S, THEME, b, t2, lambda m, d: harp(m, max(d, 0.8), vol=0.2), pan=-0.1)
seq(S, THEME, b, t2, lambda m, d: strings(m - 12, d * 0.97, vol=0.06), pan=0.2)
lyre(t2, T_ROOTS, vol=0.08, pattern=(0, 2, 3, 2, 1, 2, 3, 2))
pad(t2, T_ROOTS, vol=0.035)
for k in (0, 4): S.add(t2 + k * bar, timpani(36, 0.12))

end = t0 + BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.35, reverb=0.32)
L, Rr, loop = finish_loop(L, Rr, t0, end)
save_stereo(L, Rr, 'Prologue16.ogg', loop=loop, preview='Prologue16_preview.ogg')
print('Prologue16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
