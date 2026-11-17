# The three remaining villages, each with its day theme, an inside version and a night version. Villages are sounds
# first, with fragments of the Island tune; every one has a telegraph station tapping its name in Morse.
#   Tabonakeu (the stone quarry at the edge of the volcanic desert): dry desert wind, chisels, Guize knapping flint; the
#       Island tune played on stone clacks. And silence where the Stonemen stand: once round the loop everything stops
#       (the chisels too), leaving the wind, a low held chord and Tou's minuet's first notes, slow and heavy (the
#       Stonemen are hers). Fayna, the stern keeper, logs every sighting.
#   Corajakeu (the orchil gatherers on the dry-side sea cliffs): a great wind, waves booming far below, seabirds, the
#       climbing ropes creaking; a brave little tune plucked high over it all; the climbers calling to each other on the
#       ropes. Koro keeps the telegraph in a station hanging half over the cliff, and he's terrified of heights: his
#       Morse stutters.
#   Tacandakeu (the hot springs and the battery works, home of the Lightning Clan: Sib's family): bubbling springs,
#       steam vents, the electric hum and its sparks; the Island tune ticking like a machine over a clockwork marimba;
#       and Sib's counting tune (their grandmother runs the bath house here; their cousins keep the telegraph, and
#       can't keep their hands off each other's key).
# Usage: python3 villages16.py tabonakeu tabonakeu_inside tabonakeu_night corajakeu ... tacandakeu_night (none for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
import synth16
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, CH, HARM, LOG
from ambience import (bed_wind, gust, crickets, owl, twinkle, hearth, crowd, telegraph, Muffle, surf, gull, creak,
                      bubble, lap, rnd)
from towns16 import track, finish, strum, bassline, half, CH as TCH
R = None

# ================================================================== Tabonakeu
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]     # Tou's minuet

def clack(m, dur, vol=1.0):
    """A stone clack: a short knock of stone on stone, pitched (the quarry's own instrument)."""
    if not isinstance(synth16.marimba(60, 0.05), np.ndarray): return synth16.marimba(m, dur, vol=vol)   # (BeepBox)
    n = int(max(dur, 0.25) * SR); tt = np.arange(n) / SR; f = hz(m)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.06) + 0.5 * np.sin(2 * np.pi * f * 2.9 * tt) * np.exp(-tt / 0.02)
    x += lowpass(np.random.uniform(-1, 1, n), 3000) * np.exp(-tt / 0.004) * 0.8
    return x * vol

def chisel(S, t, vol=0.05, pan=None):                              # tink... tink: a chisel on basalt
    pan = rnd(-0.8, 0.8) if pan is None else pan
    n = int(0.12 * SR); tt = np.arange(n) / SR; f = rnd(2200, 3200)
    S.add(t, (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03) + np.random.uniform(-1, 1, n) * np.exp(-tt / 0.003)) * vol, pan=pan)

def knap(S, t, vol=0.04):                                          # Guize knapping flint: a few crisp flakes
    for i in range(np.random.randint(2, 5)):
        n = int(0.03 * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(3) / 3, 'same')
        S.add(t + i * rnd(0.15, 0.4), x * np.exp(-np.arange(n) / SR / 0.004) * vol, pan=0.5)

def quarry(S, END, vol=1.0, quiet=()):                             # dry wind, chisels and knapping (not in the quiet stretches)
    bed_wind(S, 0, END, 1.0, vol=0.11 * vol, smooth=20, pan=-0.2)
    for k in range(0, int(END / 9)): gust(S, k * 9 + rnd(0, 7), rnd(4, 7), 0.09 * vol, smooth=14)
    at = 0.4
    while at < END - 1:
        if not any(a <= at < b_ for a, b_ in quiet):
            chisel(S, at, rnd(0.06, 0.1) * vol)
            if rnd() < 0.2: knap(S, at + 0.3, 0.07 * vol)
        at += rnd(0.4, 1.6)

def stonemen(S, t, bars, bar, b, vol=1.0):                         # silence where they stand: a low chord, Tou's minuet, slow
    for m in (40, 47, 52): S.add(t, organ(m, bars * bar * 0.98, vol=0.04 * vol)); S.add(t, strings(m, bars * bar * 0.98, vol=0.03 * vol))
    seq(S, half(T1[:5]), b, t + bar, lambda m, d: brass(m - 24, d * 0.95, vol=0.14 * vol), pan=0.0)

def tabonakeu():
    S, b, bar, t0, END, B = track(80, 32, 1901)
    still = (B(17), B(21))
    quarry(S, END, quiet=[still]); crowd(S, 0, END, 1.0, 0.012, pan=0.4)
    telegraph(S, 0.2, 'TABONAKEU', b / 4, 0.14, pan=-0.6)
    # 1-8: the quarry; the tune's call knocked out on stone
    seq(S, CALL1, b, B(3), lambda m, d: clack(m, d, 0.26), pan=-0.2)
    seq(S, CALL2, b, B(7), lambda m, d: clack(m, d, 0.24), pan=-0.2)
    strum(S, B(1), 2 * bar, [43, 48, 43, 43], 0.03)
    # 9-16: the whole tune on the stones; a hand drum; a harp
    seq(S, TUNE, b, B(9), lambda m, d: clack(m, d, 0.3), pan=-0.15)
    seq(S, HARM, b, B(9), lambda m, d: clack(m - 12, d, 0.14), pan=0.35)
    strum(S, B(9), bar, ROOTS, 0.035); bassline(S, B(9), bar, ROOTS, 0.2)
    for k in range(8):
        for j, kind in LOG: S.add(B(9 + k) + j * b, drum(kind, 0.12), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    # 17-20: the Stonemen. Everything stops; the wind; Fayna logs it
    stonemen(S, B(17), 4, bar, b)
    telegraph(S, B(19) + 2 * b, 'STONEMEN', b / 4, 0.12, pan=-0.6)
    # 21-28: cautiously, the tune again: a flute, the stones answering
    t = B(21)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.9, vol=0.2), pan=0.25)
        t = seq(S, ans, b, t, lambda m, d: clack(m, d, 0.28), pan=-0.2)
    strum(S, B(21), bar, ROOTS, 0.03); bassline(S, B(21), bar, ROOTS, 0.18)
    # 29-32: the quarry
    seq(S, ANS2, b, B(30), lambda m, d: clack(m, d, 0.2), pan=-0.3)
    finish(S, 'Tabonakeu', t0, END, gain=1.0)

def tabonakeu_inside():
    """A stonecutter's house: the chisels and the dry wind through the walls, the hearth; the tune on stone clacks and a
    kalimba by the fire. Once, the chisels outside fall silent (Stonemen passing), and so does the house."""
    S, b, bar, t0, END, B = track(76, 24, 1911)
    out = Muffle(S, 500); still = (B(13), B(15))
    quarry(out, END, 1.6, quiet=[still]); hearth(S, 0, END, 1.0, 0.12)
    telegraph(out, 0.3, 'TABONAKEU', b / 4, 0.2, pan=-0.6)
    seq(S, TUNE, b, B(1), lambda m, d: clack(m, d, 0.26), pan=-0.1)
    seq(S, TUNE, b, B(1) + b / 2, lambda m, d: kalimba(m + 12, max(d * 0.4, 0.4), vol=0.08), pan=0.4)
    strum(S, B(1), bar, ROOTS, 0.04); bassline(S, B(1), bar, ROOTS)
    seq(S, CALL1 + ANS1, b, B(9), lambda m, d: kalimba(m + 12, max(d * 0.7, 0.4), vol=0.22), pan=0.1)
    strum(S, B(9), bar, ROOTS[:4], 0.04); bassline(S, B(9), bar, ROOTS[:4], 0.2)
    stonemen(S, B(13), 2, bar, b, 0.7)
    seq(S, half(ANS1 + ANS2), b, B(17), lambda m, d: clack(m, d * 0.5, 0.22), pan=0.1)
    strum(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.035); bassline(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.16)
    finish(S, 'Tabonakeu_Inside', t0, END, gain=1.0, echo=0.18, fb=0.22, reverb=0.16, cutoff=8000)

def tabonakeu_night():
    """The quarry after dark: a cold desert wind, a few crickets, stars; the chisels still. Fayna, on watch, logs a
    sighting in the night; the Stonemen's low chord; the tune as a lullaby on stone and harp."""
    S, b, bar, t0, END, B = track(60, 32, 1921)
    bed_wind(S, 0, END, 1.0, vol=0.09, smooth=30, pan=-0.2); crickets(S, 0, END, 1.0, 0.016)
    for k in range(0, int(END / 10)): gust(S, k * 10 + rnd(0, 8), rnd(4, 7), 0.07, smooth=20)
    for k in range(1, 33):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.014)
    owl(S, B(11), 0.045)
    telegraph(S, 0.3, 'TABONAKEU', b / 4, 0.1, pan=-0.6); telegraph(S, B(19) + b, 'STONEMEN', b / 4, 0.1, pan=-0.6)
    for m in (43, 50): S.add(0, strings(m, B(17), vol=0.025))
    seq(S, half(CALL1 + ANS1), b, B(1), lambda m, d: clack(m, d * 0.5, 0.2), pan=-0.1)
    seq(S, half(CALL1 + ANS1), b, B(1) + b / 2, lambda m, d: harp(m + 12, max(d * 0.4, 0.6), vol=0.08), pan=0.3)
    strum(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.025); bassline(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.14)
    stonemen(S, B(17), 8, bar, b, 0.9)
    seq(S, half(ANS2), b, B(25), lambda m, d: clack(m, d * 0.5, 0.18), pan=0.2)
    for m in (43, 50): S.add(B(25), strings(m, 8 * bar + 2 * b, vol=0.025))
    finish(S, 'Tabonakeu_Night', t0, END, gain=0.8, echo=0.3, fb=0.36, reverb=0.34)

# ================================================================== Corajakeu
def boom(S, t, vol=0.2):                                           # a wave breaking far below: a deep boom
    n = int(2.0 * SR); tt = np.arange(n) / SR; x = lowpass(np.random.uniform(-1, 1, n), 150) * 10
    S.add(t, x * np.exp(-tt / 0.6) * np.clip(tt / 0.05, 0, 1) * vol, pan=rnd(-0.3, 0.3))

def ropes(S, t, vol=0.05):                                         # a climbing rope taking the weight: a long creak
    n = int(rnd(0.6, 1.2) * SR); tt = np.arange(n) / SR; f = rnd(180, 260) * (1 + 0.1 * tt)
    x = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.85).astype(float)
    x = lowpass(np.convolve(x, np.exp(-np.arange(80) / 12), 'same'), 2500)
    S.add(t, x / (np.abs(x).max() + 1e-9) * np.sin(np.pi * tt / (n / SR)) * vol, pan=rnd(-0.8, 0.8))

def shearwater(S, t, vol=0.04):                                    # a shearwater at night: a moaning, crying call
    pan = rnd(-0.8, 0.8)
    for i, (d, f0, f1) in enumerate(((0.5, 500, 380), (0.7, 420, 600))):
        n = int(d * SR); tt = np.arange(n) / SR; f = f0 + (f1 - f0) * tt / d
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * tt)) + np.random.uniform(-0.2, 0.2, n)
        S.add(t + i * 0.6, lowpass(x, 2000) * np.sin(np.pi * tt / d) * vol, pan=pan)

def cliffs(S, END, vol=1.0):
    bed_wind(S, 0, END, 1.0, vol=0.13 * vol, smooth=16, pan=-0.2)
    for k in range(0, int(END / 8)): gust(S, k * 8 + rnd(0, 6), rnd(4, 7), 0.11 * vol, smooth=12, whistle=rnd(600, 1000))
    surf(S, 0, END, 1.0, 0.09 * vol, period=9.0, pan=0.3)
    at = 1.0
    while at < END - 2: boom(S, at, rnd(0.22, 0.32) * vol); at += rnd(5, 9)

def koro(S, t, unit, vol=0.14):                                    # Koro, hanging over the cliff: a nervous stutter, then the name
    t = telegraph(S, t, 'CO', unit, vol, pan=-0.6)
    t = telegraph(S, t + 2 * unit, 'CORA', unit * 0.8, vol, pan=-0.6)
    return telegraph(S, t + 3 * unit, 'CORAJAKEU', unit, vol, pan=-0.6)

def corajakeu():
    S, b, bar, t0, END, B = track(88, 32, 1931)
    cliffs(S, END)
    for k in range(1, 33, 3):
        if rnd() < 0.8: gull(S, B(k) + rnd(0, 2 * bar), 0.05, calls=np.random.randint(1, 4))
        if rnd() < 0.7: ropes(S, B(k) + rnd(0, 2 * bar))
    koro(S, 0.2, b / 4); koro(S, B(17), b / 4, 0.11)
    # 1-8: the cliffs; the tune's call plucked high, a fragment
    seq(S, CALL1, b, B(3), lambda m, d: kalimba(m + 24, max(d * 0.6, 0.3), vol=0.2), pan=0.3)
    strum(S, B(1), 2 * bar, [43, 48, 43, 43], 0.03)
    # 9-16: the brave little tune, plucked high (harp and kalimba) over the booming
    seq(S, TUNE, b, B(9), lambda m, d: harp(m + 24, max(d * 0.6, 0.4), vol=0.24), pan=-0.15)
    seq(S, TUNE, b, B(9), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.3), vol=0.16), pan=0.35)
    strum(S, B(9), bar, ROOTS, 0.03); bassline(S, B(9), bar, ROOTS, 0.2)
    for k in range(8): S.add(B(9 + k), drum('tom', 0.12), pan=-0.2); S.add(B(9 + k) + 2 * b, drum('tom', 0.1), pan=0.2)
    # 17-24: the climbers call to each other on the ropes: a horn above, a flute answering from below
    t = B(17)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: horn(m, d * 0.9, vol=0.16), pan=-0.6)
        t = seq(S, ans, b, t, lambda m, d: flute(m + 12, d * 0.9, vol=0.18), pan=0.6)
    strum(S, B(17), bar, ROOTS, 0.03); bassline(S, B(17), bar, ROOTS, 0.18)
    # 25-32: the tune again, braver: plucked high, strings under it
    seq(S, TUNE, b, B(25), lambda m, d: harp(m + 24, max(d * 0.6, 0.4), vol=0.24), pan=-0.15)
    seq(S, TUNE, b, B(25), lambda m, d: strings(m, d * 0.95, vol=0.08), pan=0.25)
    strum(S, B(25), bar, ROOTS, 0.03); bassline(S, B(25), bar, ROOTS, 0.2)
    for k in range(8): S.add(B(25 + k), drum('tom', 0.12), pan=-0.2); S.add(B(25 + k) + 2 * b, drum('tom', 0.1), pan=0.2)
    finish(S, 'Corajakeu', t0, END, gain=0.75)

def corajakeu_inside():
    """Tahi the dye-maker's hut: the wind howling round the walls, the waves booming up through the floor, a pot of
    orchil dye bubbling, the hearth; the brave little tune plucked small by the fire."""
    S, b, bar, t0, END, B = track(80, 24, 1941)
    out = Muffle(S, 450)
    cliffs(out, END, 1.6); hearth(S, 0, END, 1.0, 0.1)
    at = 0.5
    while at < END - 0.5: bubble(S, at, rnd(0.02, 0.04)); at += rnd(0.3, 1.2)            # the dye pot
    koro(out, 0.3, b / 4, 0.2)
    seq(S, TUNE, b, B(1), lambda m, d: harp(m + 12, max(d * 0.6, 0.4), vol=0.24), pan=-0.1)
    strum(S, B(1), bar, ROOTS, 0.035); bassline(S, B(1), bar, ROOTS)
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: kalimba(m + 12, max(d * 0.6, 0.4), vol=0.22), pan=0.2)
        t = seq(S, ans, b, t, lambda m, d: flute(m, d * 0.9, vol=0.16), pan=-0.2)
    strum(S, B(9), bar, ROOTS, 0.035); bassline(S, B(9), bar, ROOTS, 0.2)
    seq(S, half(ANS1 + ANS2), b, B(17), lambda m, d: harp(m + 12, max(d * 0.5, 0.6), vol=0.2), pan=0.1)
    strum(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.03); bassline(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.16)
    finish(S, 'Corajakeu_Inside', t0, END, gain=0.85, echo=0.18, fb=0.22, reverb=0.16, cutoff=8000)

def corajakeu_night():
    """The cliffs after dark: the wind and the booming waves, the shearwaters crying (they come in at night), stars;
    Koro, still terrified, on the night key; the brave tune, small, as a lullaby."""
    S, b, bar, t0, END, B = track(66, 32, 1951)
    cliffs(S, END, 1.1); crickets(S, 0, END, 1.0, 0.008)
    for k in range(1, 33, 3):
        if rnd() < 0.8: shearwater(S, B(k) + rnd(0, 2 * bar), rnd(0.035, 0.05))
    for k in range(1, 33):
        if rnd() < 0.4: twinkle(S, B(k) + rnd(0, bar), 0.012)
    koro(S, 0.3, b / 4, 0.1)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022))
    seq(S, half(CALL1 + ANS1), b, B(3), lambda m, d: harp(m + 24, max(d * 0.4, 0.6), vol=0.18), pan=-0.1)
    strum(S, B(3), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.025); bassline(S, B(3), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.14)
    seq(S, half(CALL2 + ANS2), b, B(19), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.16), pan=0.2)
    strum(S, B(19), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.025); bassline(S, B(19), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.14)
    finish(S, 'Corajakeu_Night', t0, END, gain=0.8, echo=0.3, fb=0.36, reverb=0.34)

# ================================================================== Tacandakeu
SIB = [(86, .5), (86, .5), (86, .5), (R, .5), (85, .5), (83, .5), (81, 1), (83, .5), (85, .5), (86, .5), (R, .5), (88, .5), (86, .5), (83, 1),
       (79, .5), (81, .5), (83, .5), (85, .5), (86, 1), (R, .5), (86, .5), (88, .5), (90, .5), (91, 3)]   # Sib's tune, in G (4 bars)
SR_ = [43, 38, 43, 40]                                            # under it: G D G Em

def springs(S, END, vol=1.0):                                     # hot springs bubbling, steam hissing out of vents
    lap(S, 0, END, 1.0, 0.06 * vol, pan=-0.3)
    at = 0.3
    while at < END - 0.5: bubble(S, at, rnd(0.04, 0.08) * vol); at += rnd(0.06, 0.35)
    at = 1.0
    while at < END - 3:
        n = int(rnd(1.5, 3) * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(4) / 4, 'same')
        S.add(at, x * np.sin(np.pi * np.arange(n) / n) ** 0.5 * 0.09 * vol, pan=rnd(-0.7, 0.7)); at += rnd(4, 8)

def works(S, start, end, vol=0.025):                              # the battery works: the hum, and sparks crackling
    n = int((end - start) * SR); tt = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 100 * tt)) * 0.3 + np.sin(2 * np.pi * 200 * tt) * 0.5
    sp = np.zeros(n); idx = np.random.randint(0, n, int((end - start) * 4)); sp[idx] = np.random.uniform(-1, 1, len(idx))
    sp = np.convolve(sp, np.exp(-np.arange(150) / 10), 'same')
    S.add(start, (lowpass(x, 1200) + sp) * np.clip(tt, 0, 1) * vol, pan=0.4)

def clockwork(S, t, b, bar, roots, vol=1.0):                      # the tune's machine: a marimba ticking in sixteenths
    for k, r in enumerate(roots):
        tri = TCH[r]
        for j in range(16): S.add(t + k * bar + j * b / 4, marimba((tri + (tri[0] + 12,))[(0, 2, 1, 3)[j % 4]] + 12, b / 4, vol=0.06 * vol), pan=(-0.45, 0.45)[j % 2])
        S.add(t + k * bar, pluckbass((r - 12 if r > 40 else r), b * 0.9, vol=0.28 * vol)); S.add(t + k * bar + 2 * b, pluckbass((r - 5 if r > 40 else r + 7), b * 0.9, vol=0.22 * vol))
        for j in range(4): S.add(t + k * bar + j * b, drum('log' if j % 2 else 'tomhi', 0.08 * vol), pan=0.5)

def cousins(S, t, unit, vol=0.14):                                # Ibaute and Chaxiraxi: both on the key at once, squabbling
    t1 = telegraph(S, t, 'TACANDAKEU', unit, vol, pan=-0.6)
    telegraph(S, t + 3 * unit, 'SIB', unit * 0.8, vol * 0.7, pan=-0.3)
    return t1

def tacandakeu():
    S, b, bar, t0, END, B = track(96, 32, 1961)
    springs(S, END); works(S, 0, END, 0.05); crowd(S, 0, END, 1.0, 0.03, pan=0.4)
    cousins(S, 0.2, b / 4); cousins(S, B(21), b / 4, 0.11)
    # 1-8: the springs and the works; the machine starts up, ticking
    clockwork(S, B(5), b, bar, ROOTS[:4], 0.8)
    seq(S, CALL1, b, B(5), lambda m, d: bell(m + 12, max(d * 0.4, 0.4), vol=0.08), pan=0.3)
    # 9-16: the tune ticking like a machine: on bells and marimba over the clockwork
    seq(S, TUNE, b, B(9), lambda m, d: bell(m + 12, max(d * 0.5, 0.4), vol=0.12), pan=0.25)
    seq(S, TUNE, b, B(9), lambda m, d: marimba(m, d * 0.6, vol=0.26), pan=-0.2)
    clockwork(S, B(9), b, bar, ROOTS)
    # 17-24: Sib's counting tune (the family's own): a flute over the clockwork, sparks
    seq(S, SIB + SIB, b, B(17), lambda m, d: flute(m - 12, d * 0.9, vol=0.26), pan=0.15)
    seq(S, SIB + SIB, b, B(17) + b / 2, lambda m, d: kalimba(m, max(d * 0.4, 0.3), vol=0.08), pan=-0.4)
    clockwork(S, B(17), b, bar, SR_ + SR_, 0.9)
    # 25-32: everyone: the tune on marimba and bells, the clockwork, a little brass
    seq(S, TUNE, b, B(25), lambda m, d: marimba(m, d * 0.6, vol=0.28), pan=-0.2)
    seq(S, TUNE, b, B(25), lambda m, d: bell(m + 12, max(d * 0.5, 0.4), vol=0.1), pan=0.3)
    seq(S, ANS1, b, B(27), lambda m, d: brass(m - 12, d * 0.8, vol=0.12), pan=0.0); seq(S, ANS2, b, B(31), lambda m, d: brass(m - 12, d * 0.8, vol=0.12), pan=0.0)
    clockwork(S, B(25), b, bar, ROOTS, 1.05)
    finish(S, 'Tacandakeu', t0, END, gain=0.85)

def tacandakeu_inside():
    """Grandmother Tegueste's bath house: the hot spring lapping and bubbling right here, steam, the battery works humming
    through the walls; the tune slow on a kalimba, and Sib's counting tune, fondly, on a flute (she's proud of Sib)."""
    S, b, bar, t0, END, B = track(80, 24, 1971)
    out = Muffle(S, 500)
    springs(S, END, 1.3); works(out, 0, END, 0.05)
    cousins(out, 0.3, b / 4, 0.2)
    seq(S, TUNE, b, B(1), lambda m, d: kalimba(m + 12, max(d * 0.7, 0.4), vol=0.22), pan=-0.1)
    strum(S, B(1), bar, ROOTS, 0.04); bassline(S, B(1), bar, ROOTS)
    seq(S, SIB + SIB, b, B(9), lambda m, d: flute(m - 12, d * 0.9, vol=0.2), pan=0.2)
    strum(S, B(9), bar, SR_ + SR_, 0.04); bassline(S, B(9), bar, SR_ + SR_, 0.2)
    seq(S, half(ANS1 + ANS2), b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.2), pan=0.1)
    strum(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.035); bassline(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.16)
    finish(S, 'Tacandakeu_Inside', t0, END, gain=0.85, echo=0.2, fb=0.26, reverb=0.22, cutoff=8000)

def tacandakeu_night():
    """The springs after dark: steam and bubbling, the works humming (it never stops), sparks glinting, crickets; the
    cousins, still at the key; the tune as a lullaby on a harp, Sib's counting notes on a bell."""
    S, b, bar, t0, END, B = track(66, 32, 1981)
    springs(S, END, 1.1); works(S, 0, END, 0.03); crickets(S, 0, END, 1.0, 0.014)
    for k in range(1, 33):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.014)
    owl(S, B(13), 0.04)
    cousins(S, 0.3, b / 4, 0.1)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022))
    seq(S, half(CALL1 + ANS1), b, B(1), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.18), pan=-0.1)
    strum(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.025); bassline(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.14)
    seq(S, half(CALL2 + ANS2), b, B(9), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.16), pan=0.2)
    strum(S, B(9), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.025); bassline(S, B(9), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.14)
    seq(S, half(SIB), b, B(17), lambda m, d: bell(m, max(d * 0.4, 0.6), vol=0.08), pan=0.4)
    seq(S, half(SIB), b, B(17) + b / 2, lambda m, d: kalimba(m - 12, max(d * 0.4, 0.5), vol=0.08), pan=-0.3)
    strum(S, B(17), bar, [43, 43, 38, 38, 43, 43, 40, 40], 0.025); bassline(S, B(17), bar, [43, 43, 38, 38, 43, 43, 40, 40], 0.14)
    seq(S, half(ANS1 + ANS2), b, B(25), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.16), pan=-0.1)
    strum(S, B(25), bar, [43, 43, 40, 43, 41, 41, 43, 43], 0.025)
    finish(S, 'Tacandakeu_Night', t0, END, gain=0.8, echo=0.3, fb=0.36, reverb=0.34)

ALL = dict(tabonakeu=tabonakeu, tabonakeu_inside=tabonakeu_inside, tabonakeu_night=tabonakeu_night,
           corajakeu=corajakeu, corajakeu_inside=corajakeu_inside, corajakeu_night=corajakeu_night,
           tacandakeu=tacandakeu, tacandakeu_inside=tacandakeu_inside, tacandakeu_night=tacandakeu_night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
