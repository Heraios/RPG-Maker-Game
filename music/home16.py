# Yoon's family house, on the river eyot just upstream of Zonfahare: Mada the herbalist, Pada, and the twins
# (who can see Yoon). Two versions:
#   Home_Grieving (Act 1): the family mourning. The mortar grinds slowly and stops; the music box plays Yoon's
#       theme with notes missing and breaks off; the twins whisper to the ghost no one else can see.
#   Home (later): the house warm again. The music box's gaps are filled by the house (a harp answers each
#       missing note); the twins giggle and play Yoon's notes back; Pada, home, plays his horn call softly
#       on a low flute; then Yoon's theme, whole and sweet.
# Both: the river flowing round the house (through the walls), the hearth, Mada's mortar and pestle as the
# rhythm, drying herbs rustling, and across the water, faintly, Zonfahare's telegraph tapping ZONFAHARE.
# Usage: python3 home16.py home grieving   (or no names for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A as YA, B as YB, C as YC, B_end as YB_END, ROOTS
from ambience import stream, hearth, telegraph, Muffle, rnd
R = None
CH = {50: (62, 65, 69), 53: (65, 69, 72), 45: (57, 60, 64), 48: (60, 64, 67), 46: (58, 62, 65), 43: (55, 58, 62), 40: (56, 59, 64)}
PADA = [(74, 1), (69, .5), (74, .5), (81, 2)]

def musicbox(m, d, vol=0.2):
    x = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
    n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))

def mortar(S, t, vol=0.08):                                         # tock (the pestle), then a grind
    n = int(0.08 * SR); tt = np.arange(n) / SR
    S.add(t, (np.sin(2 * np.pi * 180 * tt) + np.random.uniform(-0.4, 0.4, n)) * np.exp(-tt / 0.02) * vol, pan=-0.35)
    m = int(0.5 * SR); tt = np.arange(m) / SR; x = lowpass(np.random.uniform(-1, 1, m), 1500)
    S.add(t + 0.12, x * np.sin(np.pi * tt / 0.5) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * tt)) * vol * 0.8, pan=-0.35)

def rustle(S, t, vol=0.03):                                         # bunches of herbs drying overhead
    n = int(rnd(0.6, 1.2) * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
    k = np.random.uniform(0, 1, int(n / SR * 25) + 2); flick = np.interp(np.arange(n) / SR * 25, np.arange(len(k)), k) ** 3
    S.add(t, x * flick * np.sin(np.pi * np.arange(n) / n) * vol, pan=rnd(-0.6, 0.6))

def giggle(S, t, vol=0.07):                                         # a twin, giggling (two of them, close together)
    for w, pan in ((0, -0.5), (0.09, 0.5)):
        top = rnd(93, 97)
        for i in range(5): S.add(t + w + i * 0.07, kalimba(top - (i % 2) * 2 - i // 2, 0.2, vol=vol * (1 - 0.12 * i)), pan=pan)

def whisper(S, t, dur=1.0, vol=0.05):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(8) / 8, 'same')
    tt = np.arange(n) / SR
    S.add(t, x * np.sin(np.pi * tt / dur) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 5 * tt)) * vol, pan=rnd(-0.7, 0.7))

def house(S, END, b, bar, B, mortar_bars, river=0.05, fire=0.09):
    out = Muffle(S, 700, 0.9)
    stream(out, 0, END, 1.0, river, pan=0.4)                         # the river round the eyot, through the walls
    hearth(S, 0, END, 1.0, fire, pan=-0.15)
    for k in range(1, int(END / bar), 3): rustle(S, B(k) + rnd(0, 2 * bar))
    for at in mortar_bars: mortar(S, at)
    return out

def pad(S, t, bar, roots, vol=0.03, inst=strings):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

def finish(S, name, t0, end, gain=1.0):
    L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.26, reverb=0.2, cutoff=8000)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

# ------------------------------------------------------------------ Home (warm)
def home():
    np.random.seed(811)
    b = 60 / 76; bar = 4 * b; INTRO = 1; BARS = 20
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    beats = [B(k) + j * b for k in range(1, BARS + 1) for j in (0, 2)]
    out = house(S, END, b, bar, B, [t for t in beats if not (B(13) <= t < B(17))])
    telegraph(out, 0.3, 'ZONFAHARE', b / 4, 0.09, pan=0.7); telegraph(out, B(11), 'ZONFAHARE', b / 4, 0.07, pan=0.7)
    # 1-8: the music box, with gaps; the house fills each one (a harp, a moment later)
    mel = YA + YB + YC + YB_END
    t = B(1)
    for i, (m, d) in enumerate(mel):
        if i % 4 == 3: S.add(t + 0.1, harp(m, max(d * b, 0.8), vol=0.16), pan=-0.4)
        else: S.add(t, musicbox(m, d * b, 0.2), pan=0.25)
        t += d * b
    pad(S, B(1), bar, ROOTS, 0.03)
    for k, r in enumerate(ROOTS): S.add(B(1 + k), pluckbass(r - 12, bar * 0.9, vol=0.18))
    # 9-12: the twins: they see Yoon, giggle, and play Yoon's first notes back on a kalimba
    for k in (9, 11):
        seq(S, YA[:5], b, B(k), lambda m, d: musicbox(m, d, 0.16), pan=0.3)
        giggle(S, B(k) + 2.2 * b)
        seq(S, YA[:5], b, B(k + 1), lambda m, d: kalimba(m + 12, max(d, 0.3), vol=0.18), pan=-0.5)
    pad(S, B(9), bar, [50, 53, 50, 45], 0.03)
    # 13-16: Pada home: his horn call, softly, on a low flute; then Yoon's theme, whole and sweet
    seq(S, PADA, b, B(13), lambda m, d: flute(m - 12, d * 0.9, vol=0.2), pan=-0.3)
    seq(S, YA + YB[:6], b, B(14), lambda m, d: flute(m, d * 0.95, vol=0.26), pan=0.15)
    for j in range(24): S.add(B(14) + j * b / 2, harp((62, 65, 69, 74)[j % 4], b, vol=0.05), pan=(-0.4, 0.4)[j % 2])
    pad(S, B(13), bar, [50, 50, 53, 50], 0.04); pad(S, B(13), bar, [50, 50, 53, 50], 0.025, choir)
    for k, r in enumerate((50, 50, 53, 50)): S.add(B(13 + k), pluckbass(r - 12, bar * 0.9, vol=0.2))
    # 17-20: the house again; the music box's last phrase, gaps and all; a giggle
    t = B(17)
    for i, (m, d) in enumerate(YB_END):
        if i % 3 == 1: S.add(t + 0.1, harp(m, max(d * b, 0.8), vol=0.14), pan=-0.4)
        else: S.add(t, musicbox(m, d * b, 0.17), pan=0.25)
        t += d * b
    pad(S, B(17), bar, [50, 53, 50, 45], 0.025); giggle(S, B(19) + b, 0.05)
    finish(S, 'Home', t0, END, gain=0.6)

# ------------------------------------------------------------------ Home, grieving
def grieving():
    np.random.seed(821)
    b = 60 / 60; bar = 4 * b; INTRO = 1; BARS = 16
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    slow_mortar = [B(1), B(1) + 2.3 * b, B(2) + 0.4 * b, B(3), B(3) + 3 * b, B(5)]          # slowing... and stopping
    out = house(S, END, b, bar, B, slow_mortar, river=0.1, fire=0.14)
    telegraph(out, B(7), 'ZONFAHARE', b / 4, 0.06, pan=0.7)
    # 1-6: the music box, slower, more notes missing; it breaks off on the "wrong" G sharp
    t = B(1)
    for i, (m, d) in enumerate((YA + YB)[:10]):
        if i % 3 != 2: S.add(t, musicbox(m, d * b, 0.18), pan=0.25)
        t += d * b * 1.2
    pad(S, B(1), bar, [50, 46, 43, 45, 50, 46], 0.03)
    for k, r in enumerate((50, 46, 43, 45, 50, 46)): S.add(B(1 + k), pluckbass(r - 12, bar * 0.9, vol=0.16))
    # 7-12: only the house: the hearth, the river; the twins whisper to the ghost; one of them tries Yoon's notes
    for k in (7, 9, 11): whisper(S, B(k) + rnd(0, 2 * b), rnd(0.8, 1.4), 0.05)
    seq(S, [(74, 1), (77, 1), (81, 2)], b, B(10), lambda m, d: kalimba(m + 12, max(d, 0.5), vol=0.12), pan=-0.5)
    giggle(S, B(10) + 4.5 * b, 0.025)                                                          # hushed at once
    for m in (50, 57, 65): S.add(B(7), strings(m, 6 * bar * 0.98, vol=0.04))
    S.add(B(7), pluckbass(38, 6 * bar * 0.9, vol=0.14))
    # 13-16: the music box once more: D, F, A, G sharp... and nothing
    seq(S, [(74, 2), (77, 1), (81, 1), (80, 6), (R, 6)], b, B(13), lambda m, d: musicbox(m, d, 0.16), pan=0.25)
    pad(S, B(13), bar, [50, 40, 50, 50], 0.028)
    finish(S, 'Home_Grieving', t0, END, gain=0.84)

ALL = dict(home=home, grieving=grieving)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
