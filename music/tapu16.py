# The four ritual sites (-tapu), one theme each. Sacred sites play the Island tune slow and chant-like; each has its
# own second leitmotif, and a telegraph station tapping its name in Morse.
#   Tiltapu (the living Rain Tree): mist dripping off the leaves, each drop of Sacred Dew a clear bell. The keeper sings
#       the Island tune slowly, and the tree answers each phrase with Falmi's sprouting notes, high, on bells and a soft
#       choir, in Falmi's own key (a step away: otherworldly). Then the tree sings Falmi's theme itself. Guayasen thinks a
#       Child of the Woods has visited; the music agrees.
#   Jarcotapu (the mummification site, near Namethare): dry wind, scraping tools, the village's lament chanted low;
#       Itahisa's tools keep a dry, jaunty rhythm (a funeral march slightly too cheerful). Juda's hymn plays faintly and
#       respectfully... and once, under it, the corrupted version creeps in on low organ. She holds the mummy of the
#       previous priest (Juda's first murder); the music knows.
#   Amentapu (the tern watch, facing the Birdmen's sea stack): sea wind, terns, surf far below. Sooty Bird's new
#       leitmotif on a tern-bone whistle, from out over the water; Sib's "little priest" chant answering on low voices
#       (Sib's order serves Sooty Bird); the egg race's drum, speeding up and stopping dead, and Tanausú's cocky whistle;
#       Hira taking notes (Kathrout's quill figure flickers by).
#   Banotapu (the dead grove and its one sapling): almost silent: wind in bare branches, dead wood creaking, footsteps;
#       the Island tune in fragments, very slow; and now and then Falmi's sprout on a single music-box bell, never more
#       than four notes: the sapling, the island's hope.
# Usage: python3 tapu16.py tiltapu jarcotapu amentapu banotapu   (or none for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, CH, LOG, chant
from ambience import bed_wind, gust, drip, telegraph, creak, surf, crowd, twinkle, rnd
from towns16 import track, finish, strum, bassline, half, CH as TCH, LAMENT, LAMENT2
from party16 import JW1, JW2, JC1, JC2
from sooty_tune import SOOTY, SOOTY2, CRY, LIFT, whistle
R = None
broad = lambda ph: [(m, d * 2) for m, d in ph]
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (82, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
F2 = [(86, .5), (84, .5), (82, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
GROW = [[(77, .5), (81, .5)], [(77, .5), (81, .5), (84, .5)], [(77, .5), (81, .5), (84, .5), (89, 1.5)]]
FCH = {41: (53, 57, 60), 46: (58, 62, 65), 48: (60, 64, 67)}

def box(m, d, vol=0.15):                                          # a music-box bell
    x = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
    n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))

# ================================================================== Tiltapu
def tiltapu():
    S, b, bar, t0, END, B = track(60, 32, 2001)
    bed_wind(S, 0, END, 1.0, vol=0.035, smooth=60, pan=-0.2)
    n = int(END * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
    S.add(0, x * np.clip(np.arange(n) / SR, 0, 1) * 0.02, pan=0.2)                          # mist on the leaves
    at = 0.3
    while at < END - 0.5:
        drip(S, at, rnd(0.03, 0.06))
        if rnd() < 0.25: S.add(at + 0.05, bell(rnd(93, 100), 1.2, vol=0.025), pan=rnd(-0.8, 0.8))     # Sacred Dew
        at += rnd(0.3, 1.6)
    telegraph(S, 0.3, 'TILTAPU', b / 4, 0.1, pan=-0.6)
    for m in (43, 50): S.add(0, strings(m, B(21), vol=0.025))
    tree = lambda v: (lambda m, d: bell(m + 12, max(d, 0.8), vol=v))
    # 1-16: the keeper sings the tune slowly; the tree answers each phrase with the sprout, higher each time
    for k, (phrase, roots) in enumerate(((CALL1, [43, 48]), (ANS1, [40, 43]), (CALL2, [43, 38]), (ANS2, [41, 43]))):
        at = B(1 + 4 * k)
        seq(S, broad(phrase), b, at, lambda m, d: choir(m - 12, d * 0.97, vol=0.13), pan=-0.2)
        seq(S, broad(phrase), b, at, lambda m, d: flute(m - 12, d * 0.95, vol=0.07), pan=-0.3)
        strum(S, at, 2 * bar, roots, 0.025)
        g = GROW[min(k, 2)]
        seq(S, broad(g), b, at + 3 * bar, tree(0.07), pan=0.5)
        seq(S, broad(g), b, at + 3 * bar, lambda m, d: choir(m, d * 0.97, vol=0.05), pan=0.4)
        for m in FCH[41]: S.add(at + 3 * bar, choir(m + 12, bar * 0.98, vol=0.025))
    # 17-24: the tree sings Falmi's theme itself, high and slow, on bells and a soft choir
    seq(S, broad(F1), b, B(17), tree(0.08), pan=0.4)
    seq(S, broad(F1), b, B(17), lambda m, d: choir(m, d * 0.97, vol=0.09), pan=0.3)
    for k, r in enumerate((41, 41, 46, 41)):
        for m in FCH[r]: S.add(B(17 + k), strings(m, bar * 0.98, vol=0.03))
    seq(S, broad(F2), b, B(21), lambda m, d: choir(m, d * 0.97, vol=0.08), pan=0.3)
    seq(S, broad(F2), b, B(21) + b, tree(0.05), pan=0.6)
    for k, r in enumerate((46, 48, 48, 41)):
        for m in FCH[r]: S.add(B(21 + k), strings(m, bar * 0.98, vol=0.03))
    # 25-32: the keeper again, the tune's call; the tree's last sprout, and the mist
    seq(S, broad(CALL1), b, B(25), lambda m, d: choir(m - 12, d * 0.97, vol=0.12), pan=-0.2)
    for m in (43, 50): S.add(B(25), strings(m, 8 * bar + 2 * b, vol=0.025))
    seq(S, broad(GROW[2]), b, B(29), tree(0.06), pan=0.5)
    seq(S, broad(ANS1), b, B(29), lambda m, d: choir(m - 12, d * 0.97, vol=0.1), pan=-0.2)
    seq(S, broad(ANS1), b, B(29) + b, lambda m, d: flute(m - 12, d * 0.95, vol=0.06), pan=-0.4)
    finish(S, 'Tiltapu', t0, END, gain=0.78, echo=0.36, fb=0.42, reverb=0.45)

# ================================================================== Jarcotapu
def scrape(S, t, vol=0.05):                                       # a scraper on bone or a resin pot: rasp
    n = int(0.25 * SR); tt = np.arange(n) / SR; x = np.random.uniform(-1, 1, n)
    x = x - np.convolve(x, np.ones(5) / 5, 'same')
    S.add(t, x * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 40 * tt))) * np.sin(np.pi * tt / 0.25) * vol, pan=0.4)

def jarcotapu():
    S, b, bar, t0, END, B = track(72, 32, 2011)
    bed_wind(S, 0, END, 1.0, vol=0.1, smooth=25, pan=-0.2)
    for k in range(0, int(END / 10)): gust(S, k * 10 + rnd(0, 8), rnd(4, 7), 0.08, smooth=18)
    for m in (43, 50): S.add(0, organ(m - 12, END + 2 * b, vol=0.02)); S.add(0, strings(m - 12, END + 2 * b, vol=0.02))
    telegraph(S, 0.3, 'JARCOTAPU', b / 4, 0.12, pan=-0.6)
    GM = {'gm': (55, 58, 62), 41: (53, 57, 60), 39: (51, 55, 58), 38: (50, 54, 57)}
    def march(t, roots, vol=1.0):                                  # Itahisa's tools: a dry, jaunty little march
        for k, r in enumerate(roots):
            at = t + k * bar; low = 43 if r == 'gm' else r
            for j, iv in enumerate((0, 7, 0, 7)): S.add(at + j * b, brass(low - 12 + iv, b * 0.3, vol=0.12 * vol), pan=-0.25)
            for j in (1, 3): scrape(S, at + j * b, 0.05 * vol)
            S.add(at + 0.5 * b, drum('log', 0.06 * vol), pan=0.3); S.add(at + 2.5 * b, drum('log', 0.06 * vol), pan=0.3)
    # 1-4: the wind, the scraping
    for k in range(4):
        for j in (1, 3): scrape(S, B(1 + k) + j * b, 0.05)
    # 5-12: the village's lament chanted low (the Island answer, in G minor), over the jaunty little march
    seq(S, broad(LAMENT + LAMENT2), b, B(5), lambda m, d: menchoir(m - 12, d * 0.97, vol=0.24), pan=0.1)
    LR = ['gm', 'gm', 39, 39, 'gm', 'gm', 41, 'gm']
    march(B(5), LR)
    for k, r in enumerate(LR):
        for m in GM[r]: S.add(B(5 + k), strings(m - 12, bar * 0.98, vol=0.025))
    # 13-20: Juda's hymn, faint and respectful, on a harp and a soft choir... and under it, the corrupted version
    seq(S, JW1 + JW2, b, B(13), lambda m, d: harp(m, max(d, 0.8), vol=0.16), pan=-0.1)
    seq(S, JW1 + JW2, b, B(13), lambda m, d: choir(m - 12, d * 0.97, vol=0.06), pan=0.2)
    for k, r in enumerate((43, 50, 48, 43, 43, 50, 50, 43)):
        for m in TCH[r]: S.add(B(13 + k), strings(m - 12, bar * 0.98, vol=0.025))
        S.add(B(13 + k), pluckbass(r - 12, bar * 0.9, vol=0.16))
    seq(S, JC1, b, B(17), lambda m, d: organ(m - 24, d * 0.95, vol=0.07), pan=0.0)          # (a clue)
    # 21-28: the march again, the lament on a low flute; a tomb bell; Itahisa's dry chuckle on the bassoon
    seq(S, broad(LAMENT + LAMENT2), b, B(21), lambda m, d: flute(m - 12, d * 0.95, vol=0.14), pan=-0.2)
    seq(S, broad(LAMENT + LAMENT2), b, B(21), lambda m, d: menchoir(m - 12, d * 0.97, vol=0.14), pan=0.2)
    march(B(21), LR)
    S.add(B(21), bell(67, 3, vol=0.06), pan=0.4)
    for j, m in enumerate((43, 40, 38)): S.add(B(28) + 2 * b + j * 0.3 * b, brass(m, b * 0.2, vol=0.12 - 0.02 * j), pan=-0.3)
    seq(S, broad(LAMENT), b, B(29), lambda m, d: menchoir(m - 12, d * 0.97, vol=0.16), pan=0.1)
    for k in range(4):
        for j in (1, 3): scrape(S, B(29 + k) + j * b, 0.05)
    for k in range(4):
        for j in (1, 3): scrape(S, B(1 + k) + j * b, 0.03)
    seq(S, broad(LAMENT2[:4]), b, B(1), lambda m, d: menchoir(m - 12, d * 0.97, vol=0.12), pan=0.1)
    finish(S, 'Jarcotapu', t0, END, gain=0.9, echo=0.28, fb=0.32, reverb=0.32)

# ================================================================== Amentapu
SIBG = [(86, .5), (86, .5), (86, .5), (R, .5), (85, .5), (83, .5), (81, 1), (83, .5), (85, .5), (86, .5), (R, .5), (88, .5), (86, .5), (83, 1)]
KSCRIB = (69, 72, 76, 72)                                          # Kathrout's quill (her theme's scribbling harp)

def tern(S, t, vol=0.035):                                        # a sooty tern: a shrill "kee-arr", in twos and threes
    pan = rnd(-0.9, 0.9)
    for i in range(np.random.randint(1, 4)):
        n = int(0.3 * SR); tt = np.arange(n) / SR; f = 3200 - 1400 * (tt / 0.3) ** 0.7
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.7 + 0.3 * np.sin(2 * np.pi * 45 * tt)) + np.random.uniform(-0.15, 0.15, n)
        S.add(t + i * rnd(0.3, 0.5), x * np.sin(np.pi * tt / 0.3) * vol, pan=pan)

def amentapu():
    S, b, bar, t0, END, B = track(84, 32, 2021)
    bed_wind(S, 0, END, 1.0, vol=0.11, smooth=20, pan=-0.2)
    for k in range(0, int(END / 8)): gust(S, k * 8 + rnd(0, 6), rnd(4, 7), 0.08, smooth=14)
    surf(S, 0, END, 1.0, 0.08, period=8.0, pan=0.3)
    for k in range(1, 33, 2):
        if rnd() < 0.8: tern(S, B(k) + rnd(0, 2 * bar))
    crowd(S, 0, END, 1.0, 0.01, pan=0.5)
    telegraph(S, 0.3, 'AMENTAPU', b / 4, 0.12, pan=-0.6)
    w = lambda v, s=1.0: (lambda m, d: whistle(m, d, vol=v, slide=s))
    # 1-4: wind, terns, the sea below
    for m in (43, 50): S.add(B(1), strings(m, 4 * bar, vol=0.025))
    # 5-8: Sooty Bird, from out over the water: the whistle, twice
    seq(S, SOOTY, b, B(5), w(0.14), pan=0.6); seq(S, SOOTY2, b, B(7), w(0.12), pan=0.7)
    strum(S, B(5), 2 * bar, [43, 40], 0.03)
    # 9-16: Sib's priestly chant on low voices, Sooty Bird's cry answering each phrase
    for k in range(2):
        at = B(9 + 4 * k)
        seq(S, broad(SIBG[:7]), b, at, lambda m, d: menchoir(m - 24, d * 0.97, vol=0.22), pan=-0.1)
        seq(S, broad(SIBG[:7]), b, at, lambda m, d: choir(m - 12, d * 0.97, vol=0.07), pan=0.1)
        seq(S, CRY + LIFT, b, at + 2 * bar + b, w(0.12), pan=0.6)
        strum(S, at, 2 * bar, [43, 38], 0.03); bassline(S, at, 2 * bar, [43, 38], 0.16)
        strum(S, at + 2 * bar, 2 * bar, [40, 43], 0.03); bassline(S, at + 2 * bar, 2 * bar, [40, 43], 0.16)
    # 17-20: the egg race: the drum, speeding up... and stopping dead; a cheer; Tanausú's cocky whistle
    gaps = np.geomspace(0.9, 0.12, 26); at = B(17)
    for i, g in enumerate(gaps):
        S.add(at, drum('log' if i % 2 else 'tom', 0.14 + 0.008 * i), pan=(-0.3, 0.3)[i % 2]); at += g * b
    n = int(1.6 * SR); x = np.random.uniform(-1, 1, n); x = np.convolve(x, np.ones(9) / 9, 'same') - np.convolve(x, np.ones(50) / 50, 'same')
    S.add(at + 0.3, x * np.sin(np.pi * np.arange(n) / n) ** 1.5 * 0.2, pan=0.2)
    seq(S, [(79, .25), (86, .25), (91, .5)], b, at + 1.6, lambda m, d: flute(m, d * 0.8, vol=0.16), pan=0.5)
    # 21-24: Hira takes notes (Kathrout's quill, scribbling); the tune's call on a kalimba
    for i in range(32): S.add(B(21) + i * b / 4, harp(KSCRIB[i % 4] + 12, b / 4, vol=0.04), pan=(-0.5, 0.5)[(i // 2) % 2])
    seq(S, CALL1 + CALL2, b, B(21), lambda m, d: kalimba(m + 12, max(d * 0.6, 0.4), vol=0.18), pan=-0.2)
    strum(S, B(21), bar, [43, 48, 43, 38], 0.03); bassline(S, B(21), bar, [43, 48, 43, 38], 0.16)
    # 25-32: Sooty Bird's motif in full: the whistle over strings, the people's answer chanted
    seq(S, SOOTY + SOOTY2, b, B(25), w(0.15), pan=0.4)
    seq(S, SOOTY + SOOTY2, b, B(25), lambda m, d: strings(m - 12, d * 0.95, vol=0.07), pan=-0.1)
    seq(S, ANS1, b, B(27), lambda m, d: chant(m - 12, d * 0.95, vol=0.07), pan=-0.3)
    seq(S, ANS2, b, B(31), lambda m, d: chant(m - 12, d * 0.95, vol=0.07), pan=-0.3)
    strum(S, B(25), bar, [43, 40, 48, 43, 43, 40, 41, 43], 0.03); bassline(S, B(25), bar, [43, 40, 48, 43, 43, 40, 41, 43], 0.18)
    for k in range(8):
        for j, kind in LOG: S.add(B(25 + k) + j * b, drum(kind, 0.08), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    finish(S, 'Amentapu', t0, END, gain=0.85, echo=0.3, fb=0.36, reverb=0.34)

# ================================================================== Banotapu
def banotapu():
    S, b, bar, t0, END, B = track(56, 32, 2031)
    bed_wind(S, 0, END, 1.0, vol=0.09, smooth=40, pan=-0.2)
    for k in range(0, int(END / 9)): gust(S, k * 9 + rnd(0, 7), rnd(4, 7), 0.08, smooth=30, whistle=rnd(500, 800))   # through bare branches
    for k in range(1, 33, 2): creak(S, B(k) + rnd(0, 2 * bar), 0.06)
    at = 2.0
    while at < END - 2:                                             # Tamaragua's footsteps, now and then
        for i in range(np.random.randint(3, 6)):
            n = int(0.06 * SR); x = lowpass(np.random.uniform(-1, 1, n), 900) * 3 * np.exp(-np.arange(n) / SR / 0.015)
            S.add(at + i * 0.6, x * 0.06, pan=0.3)
        at += rnd(15, 25)
    telegraph(S, 0.3, 'BANOTAPU', b / 4, 0.08, pan=-0.6)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022)); S.add(0, organ(m - 12, END + 2 * b, vol=0.012))
    # the Island tune in fragments, very slow, as if remembered
    for at_bar, phrase in ((3, CALL1[:4]), (11, ANS1[:4]), (19, CALL2[:4]), (27, ANS2[-3:])):
        seq(S, broad(phrase), b, B(at_bar), lambda m, d: kalimba(m, max(d * 0.5, 0.6), vol=0.16), pan=-0.2)
        seq(S, broad(phrase), b, B(at_bar), lambda m, d: choir(m - 12, d * 0.97, vol=0.05), pan=0.0)
    # and now and then, the sprout on a single music-box bell: the sapling
    for at_bar, g in ((7, GROW[0]), (15, GROW[1]), (23, GROW[2]), (31, GROW[0])):
        seq(S, broad(g), b, B(at_bar), lambda m, d: box(m, d * 0.8, 0.12), pan=0.4)
    finish(S, 'Banotapu', t0, END, gain=0.8, echo=0.36, fb=0.42, reverb=0.45)

ALL = dict(tiltapu=tiltapu, jarcotapu=jarcotapu, amentapu=amentapu, banotapu=banotapu)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
