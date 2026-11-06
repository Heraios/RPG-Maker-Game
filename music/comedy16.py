import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(841)
R = None
# Comedy: for the funny beats (Hupa flirting with an oblivious Pada, Ure naming his leeches, and so on). A
# general-purpose cue, so it quotes nobody: a bouncy marimba tune, a bassoon-like brass going "bwomp", plucked
# strings, an island hand drum, a slide whistle at the ends of phrases, a "boing", and once round the loop a
# descending run that falls flat on its face: wah, wah, wahhh.
#   1-4 the tune on the marimba        5-8 the bassoon tries it; the flute giggles back
#   9-12 up a fourth, a run down... wah-wah-wahhh   13-16 everyone, and a slide whistle home
bpm = 126; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 16
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
C1 = [(72, .5), (76, .5), (79, .5), (R, .5), (77, .5), (76, .5), (74, .5), (R, .5), (72, .5), (R, .5), (67, .5), (R, .5), (69, 1), (R, 1)]
C2 = [(72, .5), (76, .5), (79, .5), (R, .5), (81, .5), (79, .5), (77, .5), (76, .5), (74, .5), (R, .5), (71, .5), (R, .5), (72, 1), (R, 1)]
RUN = [(84, .25), (83, .25), (81, .25), (79, .25), (77, .25), (76, .25), (74, .25), (72, .25), (R, 2)]
ROOTS = [48, 43, 48, 43]                                           # C G C G, a bar each
CH = {48: (60, 64, 67), 43: (55, 59, 62), 53: (65, 69, 72), 41: (53, 57, 60), 50: (62, 65, 69), 45: (57, 60, 64)}

def bounce(t, roots, vol=1.0):                                     # bassoon oom-pah, plucked chords, a hand drum
    for k, r in enumerate(roots):
        at = t + k * bar
        for j, iv in ((0, 0), (1, 7), (2, 0), (3, 7)):
            S.add(at + j * b, brass(r - 24 + iv, b * 0.35, vol=0.16 * vol)); S.add(at + j * b, pluckbass(r - 12 + iv, b * 0.4, vol=0.24 * vol))
        for j in (0.5, 1.5, 2.5, 3.5):
            for m in CH[r]: S.add(at + j * b, stab(m + 12, b * 0.2, vol=0.035 * vol), pan=0.3)
        S.add(at, drum('tom', 0.24 * vol), pan=-0.2); S.add(at + 2 * b, drum('tom', 0.2 * vol), pan=-0.2)
        S.add(at + b, drum('log', 0.2 * vol), pan=0.3); S.add(at + 3 * b, drum('clap', 0.16 * vol), pan=0.1)

def slide(t, m0, m1, dur, vol=0.14, pan=0.3):                      # a slide whistle
    n = int(dur * SR); tt = np.arange(n) / SR
    f = hz(m0) * (hz(m1) / hz(m0)) ** (tt / dur) * (1 + 0.01 * np.sin(2 * np.pi * 6 * tt))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.15 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    S.add(t, x * adsr(n, a=0.02, d=0.05, s=0.9, r=0.05) * vol, pan=pan)

def boing(t, vol=0.2):
    n = int(0.45 * SR); tt = np.arange(n) / SR; f = 110 * (1 + 0.5 * np.sin(2 * np.pi * 12 * tt) * np.exp(-tt / 0.15))
    S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.18) * vol, pan=-0.2)

def wah(t, m, dur, vol=0.22):                                      # a muted brass "wah", sagging at the end
    n = int(dur * SR); tt = np.arange(n) / SR
    f = hz(m) * (1 - 0.03 * np.clip((tt - dur * 0.6) / (dur * 0.4), 0, 1)) * (1 + (0.012 * np.sin(2 * np.pi * 6 * tt) if dur > 0.5 else 0))
    ph = 2 * np.pi * np.cumsum(f) / SR
    open_ = 0.3 + 0.7 * np.sin(np.pi * np.clip(tt / min(dur, 0.35), 0, 1))       # the mute opening: "wa-"
    x = sum(np.sin(ph * k) / k * (open_ ** (k / 3)) for k in range(1, 10))
    S.add(t, x * adsr(n, a=0.02, d=0.05, s=0.9, r=0.1) * vol, pan=0.1)

# intro (once): bwomp, bwomp, and a boing
S.add(0, brass(36, b * 0.4, vol=0.2)); S.add(b, brass(31, b * 0.4, vol=0.2)); boing(2 * b)

# 1-4: the tune on the marimba; a slide whistle up at the end
seq(S, C1 + C2, b, B(1), lambda m, d: marimba(m, d * 0.7, vol=0.42), pan=-0.1)
bounce(B(1), ROOTS); slide(B(4) + 2.5 * b, 72, 91, 0.5)

# 5-8: the bassoon tries it (low brass, a bit clumsy); the flute giggles back at the gaps
seq(S, C1 + C2, b, B(5), lambda m, d: brass(m - 24, d * 0.5, vol=0.3), pan=-0.2)
for k in (5, 6, 7, 8):
    seq(S, [(84, .25), (86, .25), (84, .25), (R, .25)], b, B(k) + 3 * b, lambda m, d: flute(m, d * 0.8, vol=0.14), pan=0.5)
bounce(B(5), ROOTS); boing(B(8) + 3 * b, 0.16)

# 9-12: the tune a fourth up, very pleased with itself... then a run down, and it falls flat: wah, wah, wahhh
seq(S, [(m + 5 if m else None, d) for m, d in C1], b, B(9), lambda m, d: marimba(m, d * 0.7, vol=0.42), pan=-0.1)
seq(S, [(m + 5 if m else None, d) for m, d in C1], b, B(9), lambda m, d: flute(m + 12, d * 0.6, vol=0.12), pan=0.4)
bounce(B(9), [53, 48])
seq(S, RUN, b, B(11), lambda m, d: marimba(m, d * 0.8, vol=0.38), pan=0.2)
seq(S, RUN, b, B(11), lambda m, d: pluckbass(m - 24, d * 0.8, vol=0.2))
for i, (m, d) in enumerate(((67, 0.6), (66, 0.6), (65, 1.9))): wah(B(11) + 2 * b + i * 0.75 * b, m - 12, d * b * 1.6)
S.add(B(12) + 3 * b, drum('tomhi', 0.18), pan=0.3)

# 13-16: everyone: marimba and flute, the bassoon underneath; a slide whistle home
seq(S, C1 + C2, b, B(13), lambda m, d: marimba(m, d * 0.7, vol=0.4), pan=-0.15)
seq(S, C1 + C2, b, B(13), lambda m, d: flute(m + 12, d * 0.6, vol=0.14), pan=0.35)
seq(S, C1 + C2, b, B(13), lambda m, d: brass(m - 24, d * 0.45, vol=0.18), pan=-0.3)
bounce(B(13), ROOTS, 1.1)
slide(B(16) + 2 * b, 91, 67, 0.4, pan=-0.3); slide(B(16) + 2.6 * b, 67, 84, 0.45, pan=0.3)

L, Rr = snes_master(S.L, S.R, echo=0.16, fb=0.2, reverb=0.14)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Comedy16.ogg', loop=loop, preview='Comedy16_preview.ogg')
print('Comedy16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
