import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import crowd, rnd
np.random.seed(631)
R = None
# The Lady's Table: the Lady of the Woods' feast, where Pada asks her permission for the hunt. Falmi's theme
# (F major; it was the Lady's all along) as a feast that is a bit too merry: an oom-pah band, cups clinking,
# laughter that comes a little too often, and a second voice in the band that is slightly out of tune.
#   1-16  the feast: Falmi's tune on marimba and flute, oom-pah, a tambourine
#   17-32 merrier: brass and strings take it; the sour organ doubles them; laughter
#   33-44 a hush: everything stops. Pada's horn call, alone, polite (asking). And the Lady answers: her tune,
#         slow, grand and old, on a choir and low brass
#   45-52 the feast again, but one of her husbands, the Master of Deception, starts it in the wrong key,
#         giggles, and slips back into the right one
#   53-68 everyone: the tune at its fullest, stomping
bpm = 132; b = 60 / bpm; bar = 2 * b                              # 2/4, as in Falmi's own theme
INTRO = 2; BARS = 68
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
F5, G5, A5, Bb5, C6, D6, E5 = 77, 79, 81, 82, 84, 86, 76
F1 = [(C6, .5), (A5, .5), (F5, .5), (A5, .5), (C6, 1), (D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, .5), (A5, .5), (F5, 2)]
F2 = [(D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, 1), (C6, 1), (A5, .5), (F5, .5), (G5, .5), (E5, .5), (F5, 2)]
TUNE = F1 + F2                                                    # 8 bars
CF = [41, 41, 46, 41, 46, 48, 48, 41]                             # F F Bb F | Bb C C F
CH = {41: (65, 69, 72), 46: (65, 70, 74), 48: (64, 67, 72), 42: (66, 70, 73), 47: (66, 71, 75), 49: (65, 68, 73)}
PADA = [(65, 1), (60, .5), (65, .5), (72, 2)]                     # his horn call, in F

def oompah(t, roots, vol=1.0, sour=False):
    for k, r in enumerate(roots):
        at = t + k * bar
        S.add(at, pluckbass(r - 12, b * 0.6, vol=0.36 * vol)); S.add(at, brass(r - 12, b * 0.5, vol=0.12 * vol))
        S.add(at + b, pluckbass(r - 5, b * 0.6, vol=0.3 * vol)); S.add(at + b, brass(r - 5, b * 0.5, vol=0.1 * vol))
        for j in (0.5, 1.5):
            for m in CH[r]:
                S.add(at + j * b, organ(m, b * 0.4, vol=0.07 * vol), pan=0.3)
                if sour: S.add(at + j * b, organ(m + 0.3, b * 0.4, vol=0.03 * vol), pan=-0.4)   # a bit out of tune
        S.add(at, drum('tom', 0.22 * vol), pan=-0.2); S.add(at + b, drum('clap', 0.16 * vol), pan=0.15)
        for j in range(4): S.add(at + j * b / 2, drum('shaker', (0.09 if j % 2 else 0.05) * vol), pan=0.5)

def clink(t, vol=0.08):                                           # cups touching
    for j in range(np.random.randint(1, 3)):
        m = rnd(96, 103); S.add(t + j * 0.07, bell(m, 0.5, vol=vol * rnd(0.6, 1)), pan=rnd(-0.8, 0.8))

def laugh(t, vol=0.05, pan=None, n=5):                            # "ha-ha-ha-ha"
    pan = rnd(-0.7, 0.7) if pan is None else pan; f0 = rnd(180, 300)
    for i in range(n):
        d = 0.09; m = int(d * SR); tt = np.arange(m) / SR; f = f0 * (1 - 0.04 * i)
        x = np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.random.uniform(-0.5, 0.5, m)
        S.add(t + i * 0.13, lowpass(x, 1800) * np.sin(np.pi * tt / d) * vol * (1 - 0.1 * i), pan=pan)

def merry(t, bars, clinks=0.5, laughs=0.25):                      # the table's noise over a stretch
    for k in range(bars):
        if rnd() < clinks: clink(t + k * bar + rnd(0, bar))
        if rnd() < laughs: laugh(t + k * bar + rnd(0, bar), rnd(0.03, 0.055))

# the guests talking: through the feast, silent in the hush (it runs right up to the loop's end)
crowd(S, 0, B(33), 1.5, 0.045, pan=0.2)
crowd(S, B(45), END, 0.8, 0.045, pan=0.2)

# intro (once): a clink, a laugh, a drum pickup
clink(0.1, 0.1); laugh(0.4, 0.05, 0.3)
for j in range(4): S.add(bar + j * b / 2, drum('tomhi' if j % 2 else 'tom', 0.15 + 0.04 * j), pan=(-0.3, 0.3)[j % 2])

# 1-16: the feast
seq(S, TUNE + TUNE, b, B(1), lambda m, d: marimba(m, d * 0.85, vol=0.44), pan=-0.15)
seq(S, TUNE + TUNE, b, B(1), lambda m, d: flute(m + 12, d * 0.8, vol=0.14), pan=0.3)
oompah(B(1), CF + CF); merry(B(1), 16)

# 17-32: merrier; the sour second voice; laughter
seq(S, TUNE + TUNE, b, B(17), lambda m, d: brass(m - 12, d * 0.85, vol=0.34), pan=-0.1)
seq(S, TUNE + TUNE, b, B(17), lambda m, d: marimba(m, d * 0.85, vol=0.32), pan=0.35)
seq(S, TUNE + TUNE, b, B(17), lambda m, d: strings(m, d * 0.9, vol=0.16), pan=0.2)
seq(S, TUNE + TUNE, b, B(17), lambda m, d: organ(m - 11.7, d * 0.85, vol=0.06), pan=-0.5)
oompah(B(17), CF + CF, 1.1, sour=True); merry(B(17), 16, 0.7, 0.45)
laugh(B(24), 0.06, -0.5, 7); laugh(B(24) + 0.3, 0.05, 0.5, 6)

# 33-44: the hush. Pada asks; the Lady answers
seq(S, PADA, b, B(33), lambda m, d: brass(m, d * 0.95, vol=0.26), pan=-0.3)
S.add(B(33), strings(53, 4 * bar * 0.98, vol=0.03))
grand = [(m, d * 2) for m, d in F1]
seq(S, grand, b, B(37), lambda m, d: choir(m - 12, d * 0.98, vol=0.28))
seq(S, grand, b, B(37), lambda m, d: brass(m - 24, d * 0.95, vol=0.22), pan=-0.2)
seq(S, grand, b, B(37), lambda m, d: strings(m - 12, d * 0.97, vol=0.12), pan=0.2)
for k, r in enumerate((41, 41, 46, 41)):
    for m in CH[r]: S.add(B(37 + 2 * k), strings(m - 12, 2 * bar * 0.98, vol=0.05)); S.add(B(37 + 2 * k), choir(m - 12, 2 * bar * 0.98, vol=0.03))
    S.add(B(37 + 2 * k), pluckbass(r - 24 + 12, 2 * bar * 0.9, vol=0.3)); S.add(B(37 + 2 * k), timpani(r, 0.32))
S.add(B(37), cymbal(0.06, 3), pan=0.3)
clink(B(44) + b, 0.1)

# 45-52: the wrong key (a semitone too high), a giggle, and back into F
seq(S, [(m + 1, d) for m, d in F1], b, B(45), lambda m, d: marimba(m, d * 0.85, vol=0.42), pan=-0.15)
oompah(B(45), [r + 1 for r in CF[:4]])
for i in range(10): S.add(B(48) + b + i * 0.045, kalimba(96 - (i % 2) * 2 - i // 3, 0.3, vol=0.1), pan=0.6)   # tee-hee
seq(S, F2, b, B(49), lambda m, d: marimba(m, d * 0.85, vol=0.42), pan=-0.15)
seq(S, F2, b, B(49), lambda m, d: flute(m + 12, d * 0.8, vol=0.14), pan=0.3)
oompah(B(49), CF[4:]); merry(B(45), 8, 0.5, 0.3); laugh(B(49), 0.05, 0.6)

# 53-68: everyone, at its fullest, stomping
seq(S, TUNE + TUNE, b, B(53), lambda m, d: marimba(m, d * 0.85, vol=0.4), pan=-0.2)
seq(S, TUNE + TUNE, b, B(53), lambda m, d: brass(m - 12, d * 0.85, vol=0.24), pan=0.1)
seq(S, TUNE + TUNE, b, B(53), lambda m, d: flute(m + 12, d * 0.8, vol=0.14), pan=0.35)
seq(S, TUNE + TUNE, b, B(53), lambda m, d: organ(m - 11.7, d * 0.85, vol=0.05), pan=-0.5)
oompah(B(53), CF + CF, 1.15, sour=True); merry(B(53), 16, 0.7, 0.4)
for k in range(16): S.add(B(53 + k), drum('kick', 0.2)); S.add(B(53 + k) + b, drum('kick', 0.16))     # stomp, stomp
S.add(B(68) + b, cymbal(0.06, 1.5), pan=0.2)

L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.24, reverb=0.2)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Ladys_Table16.ogg', loop=loop, preview='Ladys_Table16_preview.ogg')
print('Ladys_Table16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
