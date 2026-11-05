import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(351)
R = None
# The laurel forest: the Lady of the Woods in her lowland aspect (a woman with a pig's nature: temperamental,
# gregarious). Long and mostly ambience: drizzle and dripping leaves, birds, insects, the wind in the canopy,
# pigs snuffling. Falmi's theme grows out of it (she was grown here, for the Lady): sprouting, then shy
# fragments that break off when a twig snaps (something is watching), then the Lady's warm, generous version
# with everyone dancing, a sudden temper (her theme in the minor, a snort, a rumble), a laugh, and her
# husband the Master of Deception playing it in the wrong key before he giggles and puts it right.
F5, G5, A5, Bb5, B5, C6, D6, E5, F6 = 77, 79, 81, 82, 83, 84, 86, 76, 89
GROW = [[(F5, .5), (A5, .5)], [(F5, .5), (A5, .5), (C6, .5)], [(F5, .5), (A5, .5), (C6, .5), (F6, 1.5)]]
F1 = [(C6, .5), (A5, .5), (F5, .5), (A5, .5), (C6, 1), (D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, .5), (A5, .5), (F5, 2)]
F2 = [(D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, 1), (C6, 1), (A5, .5), (F5, .5), (G5, .5), (E5, .5), (F5, 2)]
THEME = F1 + F2                                         # Falmi's theme: 16 beats, 4 bars here
CH = {41: (53, 57, 60), 46: (58, 62, 65), 48: (60, 64, 67), 50: (62, 65, 69), 44: (56, 60, 63),
      49: (61, 65, 68), 47: (59, 63, 66)}
ROOTS = [41, 46, 48, 41]                                # F Bb C F, a bar each
bpm = 88; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 64
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
rnd = np.random.uniform

# ---------------------------------------------------------------- the forest
def bed(dur):                                           # drizzle on leaves: runs the whole way, fading in at the start
    n = int(dur * SR); x = rnd(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
    tt = np.arange(n) / SR
    S.add(0, x * np.clip(tt / (INTRO * bar), 0, 1) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 11)) * 0.035, pan=-0.2)
    S.add(0, x[::-1] * np.clip(tt / (INTRO * bar), 0, 1) * 0.03, pan=0.3)

def plip(t, vol=0.05):                                  # a drop off a laurel leaf
    n = int(0.06 * SR); tt = np.arange(n) / SR; f = rnd(1400, 3200) * (1 - 0.35 * tt / 0.06)
    S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.012) * vol, pan=rnd(-0.9, 0.9))

def chirp(t, f0, f1, dur, vol, pan):
    n = int(dur * SR); tt = np.arange(n) / SR; f = f0 + (f1 - f0) * tt / dur
    ph = 2 * np.pi * np.cumsum(f) / SR
    S.add(t, (np.sin(ph) + 0.2 * np.sin(2 * ph)) * np.sin(np.pi * tt / dur) * vol, pan=pan)

def trill(t, vol=0.05):                                 # a small bird, quick and bright
    pan = rnd(-0.8, 0.8); f = rnd(3000, 4200)
    for i in range(np.random.randint(6, 14)): chirp(t + i * 0.055, f, f * 1.25, 0.045, vol, pan)
    chirp(t + 0.85, f * 1.3, f * 0.8, 0.18, vol, pan)

def coo(t, vol=0.06):                                   # the laurel pigeon: hoo, hoo-hoooo
    pan = rnd(-0.7, 0.7)
    for at, d in ((0, 0.25), (0.45, 0.2), (0.7, 0.55)):
        n = int(d * SR); tt = np.arange(n) / SR; f = 330 * (1 - 0.08 * tt / d)
        S.add(t + at, lowpass(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d), 900) * vol, pan=pan)

def insects(t, dur, vol=0.02):                          # cicadas swelling and fading
    n = int(dur * SR); tt = np.arange(n) / SR; x = rnd(-1, 1, n)
    x = x - np.convolve(x, np.ones(3) / 3, 'same')
    S.add(t, x * (0.5 + 0.5 * np.sin(2 * np.pi * 42 * tt)) * np.sin(np.pi * tt / dur) ** 2 * vol, pan=rnd(-0.6, 0.6))

def wind(t, dur, vol=0.05):                             # the canopy moving
    n = int(dur * SR); x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(25) / 25, 'same') - np.convolve(x, np.ones(300) / 300, 'same')
    S.add(t, x * np.sin(np.pi * np.arange(n) / n) ** 2 * vol * 4, pan=rnd(-0.5, 0.5))

def snort(t, vol=0.12, pan=None):                       # the pigs (and the Lady): snuffle-snuffle-grunt
    pan = rnd(-0.6, 0.6) if pan is None else pan
    for i, d in enumerate((0.12, 0.1, 0.22)):
        n = int(d * SR); tt = np.arange(n) / SR
        x = lowpass(rnd(-1, 1, n), 500) * 6 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * tt)))
        if i == 2: x += np.sin(2 * np.pi * np.cumsum(95 * (1 - 0.2 * tt / d)) / SR) * 0.8
        S.add(t + i * 0.16, x * np.sin(np.pi * tt / d) * vol, pan=pan)

def twig(t, vol=0.25):                                  # crack. Something is watching
    pan = rnd(-0.9, 0.9)
    for i in range(3):
        n = int(0.015 * SR); S.add(t + i * 0.025, rnd(-1, 1, n) * np.exp(-np.arange(n) / SR / 0.003) * vol, pan=pan)

def giggle(t, vol=0.1):                                 # breathy, quick, gone
    for i in range(5):
        n = int(0.09 * SR); tt = np.arange(n) / SR; x = rnd(-1, 1, n); x = x - np.convolve(x, np.ones(8) / 8, 'same')
        S.add(t + i * 0.12, x * np.sin(np.pi * tt / 0.09) * vol * (1 - i * 0.12), pan=0.6 - i * 0.25)

# ---------------------------------------------------------------- the music
def chords(t, roots, inst=strings, vol=0.035, beats=4):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * beats * b, inst(m, beats * b * 0.98, vol=vol))

def harp_roll(t, r, vol=0.08):
    for j, m in enumerate(CH[r] + (CH[r][0] + 12,)): S.add(t + j * 0.08, harp(m + 12, 1.5 * b, vol=vol), pan=-0.3 + j * 0.2)

def grow(t, inst=kalimba, vol=0.3, pan=0.2):            # sprouting, a note longer each time
    for g in GROW:
        t = seq(S, g, b, t, lambda m, d: inst(m, max(d, 0.4), vol=vol), pan=pan) + b
    return t

def groove(t, bars, vol=1.0):                           # the Lady's dance: Falmi's bounce, slowed to a stroll
    for k in range(bars):
        r = ROOTS[k % 4]; at = t + k * bar
        for j, iv in ((0, 0), (1.5, 7), (2, 12), (3, 7)):
            S.add(at + j * b, slapbass(r - 12 + iv, b * 0.6, vol=0.32 * vol))
        for j in (0.5, 1.5, 2.5, 3.5):
            for m in CH[r]: S.add(at + j * b, marimba(m + 12, b * 0.3, vol=0.04 * vol), pan=0.35)
        for j, kind, v in ((0, 'tom', 0.3), (1.5, 'log', 0.22), (2, 'tom', 0.2), (3, 'log', 0.25), (3.5, 'clap', 0.12)):
            S.add(at + j * b, drum(kind, v * vol), pan=(-0.2, 0.3)[int(j * 2) % 2])
        for j in range(8): S.add(at + j * b / 2, drum('shaker', 0.05 * vol), pan=0.5)

# ---------------------------------------------------------------- the whole way through
bed(END)
t = 0.3
while t < END - 0.5:                                    # leaves dripping, unevenly
    plip(t, rnd(0.02, 0.06)); t += rnd(0.08, 0.9)
for k in range(0, INTRO + BARS, 2):
    if rnd() < 0.7: trill(k * bar + rnd(0, 2) * bar)
    if rnd() < 0.35: coo(k * bar + rnd(0, 2) * bar)
for k in range(0, INTRO + BARS, 6): wind(k * bar + rnd(0, 2) * bar, rnd(5, 9) * bar / 2)
for k in (4, 14, 30, 46, 58): insects(k * bar, 8 * bar)
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar                         # the start of bar n of the loop

# 1-8: the forest wakes; Falmi's sprouting motif, three times, further each time
for s in (1, 4): grow(B(s) + b, vol=0.26 + 0.04 * (s > 1))
chords(B(1), [41, 41], vol=0.025, beats=8); chords(B(5), [46, 41], vol=0.025, beats=8)
snort(B(7) + b, 0.08)

# 9-16: the theme on a wooden marimba, a phrase at a time with room around it; harp rolls
seq(S, F1, b, B(9), lambda m, d: marimba(m, d * 0.85, vol=0.3), pan=-0.15)
harp_roll(B(9), 41); harp_roll(B(10), 46)
seq(S, F2, b, B(13), lambda m, d: marimba(m, d * 0.85, vol=0.3), pan=0.15)
harp_roll(B(13), 46); harp_roll(B(14), 41)
for s in (9, 13): S.add(B(s), pluckbass(29, 2 * bar * 0.9, vol=0.22))

# 17-24: shy: the flute tries the theme and breaks off; a twig snaps; it tries again, softer
seq(S, F1[:5], b, B(17), lambda m, d: flute(m, d * 0.95, vol=0.26), pan=0.3)
twig(B(18) + 2.5 * b)
seq(S, F1[:9], b, B(20), lambda m, d: flute(m, d * 0.95, vol=0.18), pan=-0.3)
twig(B(21) + 3 * b, 0.18); snort(B(22) + b, 0.1)
chords(B(17), [41], vol=0.02, beats=32)

# 25-36: the Lady at her table: warm and generous; everyone dances
groove(B(25), 8, 0.7)
seq(S, THEME + THEME, b, B(25), lambda m, d: flute(m, d * 0.92, vol=0.27), pan=0.15)
seq(S, THEME + THEME, b, B(25), lambda m, d: marimba(m - 12, d * 0.8, vol=0.18), pan=-0.25)
chords(B(25), ROOTS + ROOTS, vol=0.03)
chords(B(29), ROOTS, inst=choir, vol=0.035)
snort(B(27) + 3 * b, 0.1); snort(B(31) + 3.5 * b, 0.12)
seq(S, THEME, b, B(33), lambda m, d: strings(m - 12, d * 0.97, vol=0.11), pan=-0.1)       # 33-36: it swells
seq(S, THEME, b, B(33), lambda m, d: flute(m, d * 0.95, vol=0.22), pan=0.25)
groove(B(33), 4, 0.45)
seq(S, THEME, b, B(33), lambda m, d: choir(m, d * 0.97, vol=0.07), pan=0.2)
chords(B(33), ROOTS, vol=0.045); chords(B(33), ROOTS, inst=choir, vol=0.04)
for k, r in enumerate(ROOTS): S.add(B(33 + k), pluckbass(r - 12, bar * 0.9, vol=0.32))

# 37-40: her temper: the theme in the minor, low; a big snort; the ground rumbles. Then it passes
MINOR = {81: 80, 86: 85, 76: 76}
dark = [(MINOR.get(m, m) - 12, d) for m, d in THEME]
seq(S, dark, b, B(37), lambda m, d: strings(m, d * 0.95, vol=0.14), pan=-0.2)
seq(S, dark, b, B(37), lambda m, d: organ(m - 12, d * 0.95, vol=0.06))
chords(B(37), [41, 49, 48, 41], vol=0.03)                 # Fm-ish: F, Db, C, F
for k, r in enumerate((29, 37, 36, 29)): S.add(B(37 + k), timpani(r + 12, 0.25))
snort(B(37), 0.3, pan=0.0)
for i in range(12): S.add(B(39) + i * b / 4, timpani(29 + 12, 0.04 + 0.015 * i))

# 41-44: she laughs; the sprouting again, brighter, with bells
snort(B(41), 0.12, pan=-0.2); snort(B(41) + 0.6, 0.1, pan=0.2)
grow(B(41) + b, inst=bell, vol=0.12, pan=-0.3)
grow(B(41) + 1.5 * b, vol=0.22, pan=0.4)
chords(B(41), [41, 46, 48, 41], vol=0.03)

# 45-56: deep forest: the drips themselves fall on the theme's notes, slowly; then the Master of
# Deception plays it in the wrong key (B, a tritone away) on bells, giggles, and puts it right
drops = [m for m, d in F1]
for i, m in enumerate(drops): S.add(B(45) + i * 1.5 * b + rnd(0, 0.1), kalimba(m + 12, 0.4, vol=0.12), pan=rnd(-0.8, 0.8))
chords(B(45), [41, 46], vol=0.022, beats=8)
seq(S, [(m + 6, d) for m, d in F1], b, B(50), lambda m, d: bell(m, max(d, 0.5), vol=0.12), pan=0.5)
chords(B(50), [47], vol=0.02, beats=8)                     # B major: wrong, and pretty
giggle(B(52) + b, 0.08)
seq(S, F1, b, B(53), lambda m, d: bell(m, max(d, 0.5), vol=0.11), pan=-0.4)
chords(B(53), [41, 46], vol=0.025, beats=8)
for s in (53, 55): S.add(B(s), pluckbass(29 if s == 53 else 34, 2 * bar * 0.9, vol=0.2))

# 57-64: quiet: just the forest, and the sprout once more, leading home
grow(B(58) + b, vol=0.2, pan=-0.2)
chords(B(57), [41], vol=0.02, beats=32)
snort(B(61), 0.07)

L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.38, reverb=0.35, cutoff=8500)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Laurel_Forest16.ogg', loop=loop, preview='Laurel_Forest16_preview.ogg')
print('Laurel_Forest16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
