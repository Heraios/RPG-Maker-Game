# Yoon's family home, outdoors: the rocky eyot in the big river just north of Zonfahare, where the town, the
# forest, the grasslands and the marsh meet. The river rushing all round; Ladder the goat bleating on the roof;
# and faintly, the four places that meet here: the town's market and telegraph, forest birds, marsh frogs,
# the fields' wind. The Island tune with Yoon's theme folded into it (in E minor, so the two fit together).
#   Eyot_Grieving (Act 1, until Story 50): slow; the village's lament for Yoon on a low flute; Yoon's theme on
#       a kalimba, in pieces; the goat bleats once, forlorn. No drums.
#   Eyot (Act 2): the hub, warm and busy: the Island tune on harp and marimba, Yoon's theme answering on a
#       flute, a walking bass, island drums, goat bells; Pada's horn call once (he's home).
#   Eyot_Night: frogs, crickets, an owl, the river; the Island tune as a lullaby, Yoon's theme on far bells.
# Usage: python3 eyot16.py grieving day night   (or no names for all three)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, CH, LOG
from yoon import A as YA, B as YB
from ambience import stream, lap, crowd, telegraph, Muffle, trill, frogs, crickets, owl, grasshoppers, bed_wind, rnd
R = None
CH = dict(CH); CH.update({45: (57, 60, 64), 47: (59, 62, 66), 52: (52, 55, 59)})
up2 = lambda ph: [(m + 2 if m else None, d) for m, d in ph]
slow = lambda ph: [(m, d * 2) for m, d in ph]
YOON = up2(YA + YB)                                               # Yoon's opening, in E minor
LAMENT = [(79, 1), (78, 1), (76, 1), (78, 1), (79, 1.5), (78, .5), (76, 2)]   # the Island answer, in E minor
PADA = [(74, 1), (69, .5), (74, .5), (81, 2)]                     # Pada's horn call

def track(bpm, bars, seed, intro=1):
    np.random.seed(seed)
    b = 60 / bpm; bar = 4 * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0):
    L, Rr = snes_master(S.L, S.R, echo=0.28, fb=0.34, reverb=0.3)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def goat(S, t, vol=0.08, pan=0.5, sad=False):                     # Ladder, on the roof: "meh-eh-eh"
    n = int((0.9 if sad else 0.6) * SR); tt = np.arange(n) / SR
    f = (330 if sad else 400) * (1 + 0.04 * np.sign(np.sin(2 * np.pi * 9 * tt))) * (1 - (0.2 if sad else 0.1) * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 9))
    S.add(t, lowpass(x, 1800) * adsr(n, a=0.03, d=0.1, s=0.8, r=0.2) * vol, pan=pan)

def river(S, END, vol=1.0):                                       # the river on both sides, the four places faint
    stream(S, 0, END, 1.0, 0.045 * vol, pan=-0.6); stream(S, 0, END, 1.0, 0.04 * vol, pan=0.6)
    lap(S, 0, END, 1.0, 0.035 * vol, pan=0.0)
    far = Muffle(S, 450, 0.6)
    crowd(far, 0, END, 1.0, 0.03, pan=-0.7)                       # the town, across the water (south)
    return far

def strum(S, t, b, roots, vol=0.05, beats=4):
    for k, r in enumerate(roots):
        for j, m in enumerate(CH[r]): S.add(t + k * beats * b + j * 0.05, harp(m + 12, beats * b * 0.9, vol=vol), pan=-0.3 + j * 0.25)

def bass(S, t, bar, roots, vol=0.24, walk=False, b=None):
    for k, r in enumerate(roots):
        low = r - 12 if r > 40 else r
        if walk:
            for j, iv in enumerate((0, 7, 12, 7)): S.add(t + k * bar + j * b, pluckbass(low + iv, b * 0.8, vol=vol * (1 if j == 0 else 0.75)))
        else: S.add(t + k * bar, pluckbass(low, bar * 0.9, vol=vol))

# ------------------------------------------------------------------ Act 1: grieving
def grieving():
    S, b, bar, t0, END, B = track(66, 32, 911)
    far = river(S, END, 1.1)
    for k in (2, 13, 26): trill(S, B(k) + rnd(0, bar), 0.025)
    frogs(S, 0, END, 1.0, 0.008, count=2)
    for at in (0.3, B(17)): telegraph(far, at, 'ZONFAHARE', b / 4, 0.12, pan=-0.7)
    goat(S, B(11) + b, 0.07, sad=True)
    for m in (40, 47): S.add(0, strings(m, END + 2 * b, vol=0.025))
    # 1-8: Yoon's theme on a kalimba, in pieces, stopping on the wrong note
    seq(S, slow(YOON[:4]) + [(R, 8)] + slow(YOON[9:13]), b, B(1), lambda m, d: kalimba(m, max(d * 0.6, 0.6), vol=0.24), pan=0.15)
    strum(S, B(1), b, [52, 52, 48, 48, 52, 52, 47, 47], 0.03)
    # 9-16: the lament, on a low flute
    seq(S, slow(LAMENT) * 2, b, B(9), lambda m, d: flute(m - 12, d * 0.95, vol=0.12), pan=-0.2)
    strum(S, B(9), b, [43, 47, 52, 52, 43, 47, 52, 52], 0.03); bass(S, B(9), bar, [43, 47, 52, 52, 43, 47, 52, 52], 0.16)
    # 17-24: only the river; 25-32: the lament once more, with Yoon's notes far above it, unheard
    seq(S, slow(LAMENT), b, B(25), lambda m, d: flute(m - 12, d * 0.95, vol=0.11), pan=-0.2)
    seq(S, slow(YOON[:5]), b, B(29), lambda m, d: bell(m + 12, max(d * 0.4, 0.8), vol=0.025), pan=0.6)
    strum(S, B(25), b, [43, 47, 52, 52, 52, 48, 47, 52], 0.028)
    finish(S, 'Eyot_Grieving', t0, END, gain=0.64)

# ------------------------------------------------------------------ Act 2: the hub
def day():
    S, b, bar, t0, END, B = track(92, 40, 921)
    far = river(S, END)
    for k in range(1, 41, 3):
        if rnd() < 0.6: trill(S, B(k) + rnd(0, 2 * bar), 0.025)
    frogs(S, 0, END, 1.0, 0.006, count=2); grasshoppers(S, 0, END, vol=0.008, count=2)
    for at in (0.3, B(21)): telegraph(far, at, 'ZONFAHARE', b / 4, 0.12, pan=-0.7)
    for k in (4, 17, 33): goat(S, B(k) + rnd(0, bar), 0.08)
    # 1-8: the Island tune on a harp; Yoon's theme answering on a flute in its gaps
    seq(S, TUNE, b, B(1), lambda m, d: harp(m, max(d, 0.6), vol=0.24), pan=-0.15)
    strum(S, B(1), b, ROOTS, 0.035); bass(S, B(1), bar, ROOTS, 0.26, walk=True, b=b)
    for k in range(8):
        for j, kind in LOG: S.add(B(1 + k) + j * b, drum(kind, 0.14), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    # 9-16: Yoon's theme on the flute, the Island tune's chords under it, marimba off-beats
    seq(S, slow(YOON[:9]), b, B(9), lambda m, d: flute(m, d * 0.93, vol=0.26), pan=0.2)
    seq(S, slow(YOON[9:19]), b, B(13), lambda m, d: flute(m, d * 0.93, vol=0.24), pan=0.2)
    YR = [52, 52, 43, 43, 52, 52, 47, 47]
    strum(S, B(9), b, YR, 0.035); bass(S, B(9), bar, YR, 0.24, walk=True, b=b)
    for k, r in enumerate(YR):
        for j in (0.5, 1.5, 2.5, 3.5):
            for m in CH[r]: S.add(B(9 + k) + j * b, marimba(m + 12, b * 0.3, vol=0.025), pan=0.35)
    # 17-24: Pada's horn call; the tune on marimba, the flute weaving Yoon's notes through it
    seq(S, PADA, b, B(17), lambda m, d: brass(m - 12, d * 0.9, vol=0.2), pan=-0.4)
    seq(S, TUNE, b, B(17), lambda m, d: marimba(m, d * 0.8, vol=0.3), pan=-0.15)
    seq(S, [(R, 4)] + YOON[:9] + [(R, 4)] + YOON[:5], b, B(17), lambda m, d: flute(m + 12, d * 0.9, vol=0.12), pan=0.4)
    strum(S, B(17), b, ROOTS, 0.03); bass(S, B(17), bar, ROOTS, 0.26, walk=True, b=b)
    for k in range(8):
        for j, kind in LOG: S.add(B(17 + k) + j * b, drum(kind, 0.18), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
        for j in range(8): S.add(B(17 + k) + j * b / 2, drum('shaker', 0.03), pan=0.45)
    # 25-32: quieter: the river; the tune's answers on a kalimba, slow
    seq(S, slow(ANS1 + ANS2), b, B(25), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.18), pan=0.1)
    strum(S, B(25), b, [40, 43, 41, 43], 0.03, beats=8); bass(S, B(25), 2 * bar, [40, 43, 41, 43], 0.18)
    # 33-40: everyone: harp and flute together, both tunes
    seq(S, TUNE, b, B(33), lambda m, d: harp(m, max(d, 0.6), vol=0.22), pan=-0.2)
    seq(S, TUNE, b, B(33), lambda m, d: flute(m + 12, d * 0.92, vol=0.14), pan=0.3)
    seq(S, slow(YOON[:5]), b, B(37), lambda m, d: kalimba(m, max(d * 0.5, 0.5), vol=0.12), pan=0.5)
    strum(S, B(33), b, ROOTS, 0.035); bass(S, B(33), bar, ROOTS, 0.26, walk=True, b=b)
    for k in range(8):
        for j, kind in LOG: S.add(B(33 + k) + j * b, drum(kind, 0.18), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    finish(S, 'Eyot', t0, END, gain=0.8)

# ------------------------------------------------------------------ Act 2, at night
def night():
    S, b, bar, t0, END, B = track(66, 32, 931)
    far = river(S, END, 1.1)
    frogs(S, 0, END, 1.0, 0.03, count=6); crickets(S, 0, END, 1.0, 0.015)
    for k in (5, 19, 28): owl(S, B(k) + rnd(0, bar), 0.05)
    for at in (0.3, B(15)): telegraph(far, at, 'ZONFAHARE', b / 3, 0.1, pan=-0.7)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.025))
    # 1-8: the Island tune as a lullaby, half speed, on a harp
    seq(S, slow(CALL1 + ANS1), b, B(1), lambda m, d: harp(m, max(d * 0.6, 0.8), vol=0.2), pan=-0.1)
    strum(S, B(1), b, [43, 43, 48, 48, 40, 40, 43, 43], 0.025)
    # 9-16: Yoon's theme on far bells
    seq(S, slow(YOON[:9]), b, B(9), lambda m, d: bell(m + 12, max(d * 0.4, 0.8), vol=0.05), pan=0.5)
    strum(S, B(9), b, [52, 52, 43, 43, 52, 52, 47, 47], 0.022)
    # 17-22: the river and the frogs; 23-32: the second half of the tune, half speed, a kalimba
    seq(S, slow(CALL2 + ANS2), b, B(23), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.17), pan=0.15)
    strum(S, B(23), b, [43, 43, 38, 38, 41, 41, 43, 43], 0.025); bass(S, B(23), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.14)
    finish(S, 'Eyot_Night', t0, END, gain=0.8)

ALL = dict(grieving=grieving, day=day, night=night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
