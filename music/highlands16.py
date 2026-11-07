# The highlands: two villages, and the alpine forest at night.
#   Idekeu (highland pines): loggers and pitch-burners. Wind in the pines, axes, a tree creaking and falling,
#       the pitch fires, Tuu coughing ("lungs are just a suggestion"); the Island tune as a rough work song,
#       called and answered on the axe strokes; Ayoze whistling it from up a tree; the station taps IDEKEU.
#   Idekeu_Night: the pitch fires the loudest thing; loggers humming the tune slowly round them; an owl.
#   Chafakeu (alpine meadows, summer pastures): sheep bells, wind, a stream, an eagle; the Island tune
#       whistled across the valley and answered by another whistle far off (the Canary silbo); a shepherd's
#       drone. Yeh, starved for company, taps CHAFAKEU and then a long rambling message to anyone at all. And
#       once, very faint, a pipe playing the Lady's tune: the Shepherd of the Deer, whom Bentor saw (nobody
#       believes him).
#   Chafakeu_Night: cold wind, sleepy sheep bells, stars, an owl; a shepherd's pipe lullaby; Yeh, still tapping.
#   Alpine_Forest_Night: the Lady's highland forest after dark: wind in the pines, owls, a stream, frost
#       glinting; Falmi's theme slow and frosty (Lydian, as by day), the Shepherd's pipe far off.
# Usage: python3 highlands16.py idekeu idekeu_night chafakeu chafakeu_night alpine_night   (or none for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, CH, LOG, chant
from ambience import (bed_wind, gust, raven, woodpecker, hearth, telegraph, goatbells, goatbell, stream, owl,
                      crickets, twinkle, deer, creak, crowd, rnd)
R = None
half = lambda ph: [(m, d * 2) for m, d in ph]

def track(bpm, bars, seed, intro=1):
    np.random.seed(seed)
    b = 60 / bpm; bar = 4 * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0, **kw):
    m = dict(echo=0.3, fb=0.36, reverb=0.32); m.update(kw)
    L, Rr = snes_master(S.L, S.R, **m)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def strum(S, t, b, roots, vol=0.04, beats=4, ch=CH):
    for k, r in enumerate(roots):
        for j, m in enumerate(ch[r]): S.add(t + k * beats * b + j * 0.05, harp(m + 12, beats * b * 0.9, vol=vol), pan=-0.3 + j * 0.25)

def lowbass(S, t, bar, roots, vol=0.2, bars_each=1):
    for k, r in enumerate(roots): S.add(t + k * bars_each * bar, pluckbass(r - 12 if r > 40 else r, bars_each * bar * 0.9, vol=vol))

# ---------------------------------------------------------------- Idekeu's sounds
def axe(S, t, vol=0.12, pan=None):                                 # thock
    pan = rnd(-0.7, 0.7) if pan is None else pan
    n = int(0.12 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 150 * tt) * np.exp(-tt / 0.03) + np.random.uniform(-1, 1, n) * np.exp(-tt / 0.008) * 0.8
    S.add(t, lowpass(x, 2500) * vol, pan=pan)

def chopping(S, t, dur, vol=0.1, pan=None):                        # someone at work: uneven strokes
    pan = rnd(-0.8, 0.8) if pan is None else pan; at = t
    while at < t + dur: axe(S, at, vol * rnd(0.7, 1), pan); at += rnd(0.9, 1.6)

def fall(S, t, vol=0.25):                                          # a long creak, a rush, and the ground shakes
    n = int(2.5 * SR); tt = np.arange(n) / SR; f = 60 + 40 * tt / 2.5
    clicks = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.9).astype(float)
    x = lowpass(np.convolve(clicks, np.exp(-np.arange(300) / 50), 'same'), 1200); x = x / (np.abs(x).max() + 1e-9)
    S.add(t, x * np.clip(tt / 2.5, 0, 1) * vol * 0.4, pan=0.3)
    m = int(1.2 * SR); y = np.random.uniform(-1, 1, m); y = np.convolve(y, np.ones(10) / 10, 'same')
    S.add(t + 2.3, y * np.sin(np.pi * np.arange(m) / m) ** 2 * vol * 1.2, pan=0.2)
    S.add(t + 3.4, drum('kick', vol * 1.6)); S.add(t + 3.4, timpani(28, vol)); S.add(t + 3.42, cymbal(vol * 0.2, 1.0), pan=0.2)

def cough(S, t, vol=0.08):                                         # Tuu: hack, hack-hack
    for i, d in enumerate((0.0, 0.35, 0.55)):
        n = int(0.16 * SR); tt = np.arange(n) / SR
        x = lowpass(np.random.uniform(-1, 1, n), 1600) * 3 * np.exp(-tt / 0.05)
        S.add(t + d, x * vol, pan=-0.4)

def cheer(S, t, vol=0.06):
    n = int(1.6 * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(10) / 10, 'same') - np.convolve(x, np.ones(60) / 60, 'same')
    S.add(t, x * np.sin(np.pi * np.arange(n) / n) ** 2 * vol * 4, pan=0.1)

def pines(S, END, vol=1.0):
    bed_wind(S, 0, END, 1.0, vol=0.06 * vol, smooth=18, pan=-0.2)
    for k in range(0, int(END / 10)): gust(S, k * 10 + rnd(0, 8), rnd(4, 7), 0.045 * vol, whistle=rnd(700, 1100))

def idekeu():
    S, b, bar, t0, END, B = track(84, 40, 941)
    pines(S, END, 1.6); hearth(S, 0, END, 1.0, 0.13, pan=0.5)                  # a pitch fire
    for k in (6, 22, 37): raven(S, B(k) + rnd(0, bar), 0.06, caws=2)
    woodpecker(S, B(14), 0.1)
    for k in (1, 31): chopping(S, B(k), 8 * bar, 0.17)
    chopping(S, B(1) + 0.5, 8 * bar, 0.12)
    for k in (5, 27, 36): cough(S, B(k) + rnd(0, bar))
    for at in (0.3, B(29)): telegraph(S, at, 'IDEKEU', b / 4, 0.15, pan=-0.6)
    # 9-16: the work song: a leader calls, the crew answers, on the axe strokes (one and three)
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: brass(m - 12, d * 0.9, vol=0.14), pan=-0.3)
        t = seq(S, ans, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.1), pan=0.2)
    for k in range(8):
        for j in (0, 2): axe(S, B(9 + k) + j * b, 0.14, (-0.4, 0.4)[j // 2]); S.add(B(9 + k) + j * b, drum('tom', 0.11))
        S.add(B(9 + k), slapbass((ROOTS[k] - 12 if ROOTS[k] > 40 else ROOTS[k]), 1.5 * b, vol=0.22))
        S.add(B(9 + k) + 2 * b, slapbass((ROOTS[k] - 5 if ROOTS[k] > 40 else ROOTS[k] + 7), 1.5 * b, vol=0.24))
    # 17-20: a tree comes down; a cheer
    fall(S, B(17) + b); cheer(S, B(18) + 3 * b)
    # 21-28: the song again, rougher: log drums; Tuu coughs in a gap
    t = B(21)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.11), pan=-0.3)
        t = seq(S, ans, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.12), pan=0.3)
    seq(S, TUNE, b, B(21), lambda m, d: marimba(m, d * 0.7, vol=0.16), pan=0.1)
    for k in range(8):
        for j in (0, 2): axe(S, B(21 + k) + j * b, 0.13)
        for j, kind in LOG: S.add(B(21 + k) + j * b, drum(kind, 0.13), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
        S.add(B(21 + k), slapbass((ROOTS[k] - 12 if ROOTS[k] > 40 else ROOTS[k]), 1.5 * b, vol=0.22))
    cough(S, B(24) + 3 * b, 0.1)
    # 29-32: Ayoze up a tree, whistling the call; 33-40: just work, the answer hummed slow
    seq(S, CALL1 + CALL2, b, B(29), lambda m, d: flute(m + 24, d * 0.85, vol=0.1), pan=0.7)
    seq(S, half(ANS1), b, B(35), lambda m, d: choir(m - 12, d * 0.97, vol=0.07), pan=-0.2)
    strum(S, B(33), b, [43, 48, 43, 43], 0.03, beats=8)
    finish(S, 'Idekeu', t0, END, gain=1.0)

def idekeu_night():
    S, b, bar, t0, END, B = track(66, 32, 951)
    pines(S, END, 0.8); hearth(S, 0, END, 1.0, 0.16, pan=0.3)                 # the pitch fires, glowing
    crickets(S, 0, END, 1.0, 0.006)
    for k in (4, 18, 27): owl(S, B(k) + rnd(0, bar), 0.05)
    for k in (9, 24): cough(S, B(k) + rnd(0, bar), 0.06)
    for at in (0.3, B(21)): telegraph(S, at, 'IDEKEU', b / 3, 0.11, pan=-0.6)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.02))
    # 3-18: the loggers round the fire, humming the tune slowly, a harp
    seq(S, half(TUNE), b, B(3), lambda m, d: choir(m - 12, d * 0.97, vol=0.09), pan=-0.1)
    seq(S, half(TUNE), b, B(3), lambda m, d: harp(m, max(d * 0.5, 0.6), vol=0.12), pan=0.3)
    strum(S, B(3), b, [43, 43, 48, 48, 40, 40, 43, 43, 43, 43, 38, 38, 41, 41, 43, 43], 0.025)
    lowbass(S, B(3), bar, [43, 43, 48, 48, 40, 40, 43, 43, 43, 43, 38, 38, 41, 41, 43, 43], 0.14)
    # 23-30: someone whistles the answer, low, and the fire answers
    seq(S, half(ANS1 + ANS2), b, B(23), lambda m, d: flute(m, d * 0.9, vol=0.1), pan=0.4)
    finish(S, 'Idekeu_Night', t0, END, gain=0.57)

# ---------------------------------------------------------------- Chafakeu's sounds
def baa(S, t, vol=0.06, pan=None):                                # a sheep
    pan = rnd(-0.9, 0.9) if pan is None else pan
    n = int(0.55 * SR); tt = np.arange(n) / SR
    f = rnd(480, 560) * (1 + 0.05 * np.sign(np.sin(2 * np.pi * 11 * tt))) * (1 - 0.12 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    S.add(t, lowpass(sum(np.sin(ph * k) / k for k in range(1, 8)), 2200) * adsr(n, a=0.03, d=0.1, s=0.8, r=0.2) * vol, pan=pan)

def eagle(S, t, vol=0.035):
    n = int(0.9 * SR); tt = np.arange(n) / SR; f = 2300 - 700 * tt / 0.9
    ph = 2 * np.pi * np.cumsum(f) / SR
    S.add(t, (np.sin(ph) + 0.4 * np.sin(2 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * tt)) * np.sin(np.pi * tt / 0.9) * vol, pan=rnd(-0.8, 0.8))

def silbo(S, t, b, phrase, vol=0.12, pan=-0.6):                    # a whistle across the valley: high, sliding into each note
    for m, d in phrase:
        if m is not None:
            n = int(d * b * 0.9 * SR); tt = np.arange(n) / SR
            f = hz(m + 24) * 2 ** ((-0.6 * np.exp(-tt / 0.05)) / 12)
            x = np.sin(2 * np.pi * np.cumsum(f) / SR) + np.random.uniform(-0.05, 0.05, n)
            S.add(t, x * adsr(n, a=0.03, d=0.05, s=0.9, r=0.05) * vol, pan=pan)
        t += d * b
    return t

def ramble(S, t, unit, vol=0.12, letters=40):                      # Yeh: CHAFAKEU, and then on, and on...
    t = telegraph(S, t, 'CHAFAKEU', unit, vol, pan=-0.6)
    word = ''.join(np.random.choice(list('ETAOINSHRDLUCMWYFGPB')) for _ in range(letters))
    return telegraph(S, t + 4 * unit, ' '.join(word[i:i + 5] for i in range(0, len(word), 5)), unit, vol * 0.9, pan=-0.6)

def meadow(S, END, vol=1.0):
    bed_wind(S, 0, END, 1.0, vol=0.05 * vol, smooth=40, pan=-0.2)
    stream(S, 0, END, 1.0, 0.018 * vol, pan=0.6)

FALMI = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (83, .5), (81, .5), (79, .5), (81, .5), (77, 2)]   # Lydian, as by day

def chafakeu():
    S, b, bar, t0, END, B = track(76, 40, 961)
    meadow(S, END, 1.7)
    for k in range(1, 41, 4): goatbells(S, B(k) + rnd(0, 2 * bar), rnd(1.5, 3) * bar, 0.05)
    for k in range(2, 41, 5): baa(S, B(k) + rnd(0, 2 * bar), rnd(0.04, 0.07))
    for k in (7, 26): eagle(S, B(k) + rnd(0, bar))
    telegraph(S, 0.3, 'CHAFAKEU', b / 4, 0.14, pan=-0.6)
    # 1-8: the meadow; a shepherd's drone, open fifths
    for m in (43, 50): S.add(B(1), organ(m, 8 * bar * 0.98, vol=0.025))
    # 9-16: the silbo: the call whistled here, the answer from across the valley
    t = silbo(S, B(9), b, CALL1, 0.11, -0.6); silbo(S, t, b, ANS1, 0.05, 0.8)
    t = silbo(S, B(13), b, CALL2, 0.11, -0.6); silbo(S, t, b, ANS2, 0.05, 0.8)
    for k, r in enumerate(ROOTS): S.add(B(9 + k), strings(CH[r][0] - 12, bar * 0.98, vol=0.03))
    # 17-24: the tune walking with the flock: a shepherd's pipe over the drone, a harp, bells
    seq(S, TUNE, b, B(17), lambda m, d: flute(m + 12, d * 0.92, vol=0.12), pan=0.2)
    for m in (43, 50): S.add(B(17), organ(m, 8 * bar * 0.98, vol=0.03))
    strum(S, B(17), b, ROOTS, 0.03); lowbass(S, B(17), bar, ROOTS, 0.16)
    for k in range(8):
        for j in (0, 2): S.add(B(17 + k) + j * b, drum('log', 0.08), pan=-0.3)
    # 25-28: Yeh at the telegraph, rambling
    ramble(S, B(25), b / 4, 0.13)
    # 29-32: very faint and far: a pipe playing the Lady's tune (the Shepherd of the Deer); a deer barks
    seq(S, FALMI, b, B(29), lambda m, d: flute(m - 12, d * 0.95, vol=0.05), pan=0.85)
    deer(S, B(31) + b, 0.05)
    # 33-40: the meadow; the answer, slow, on a kalimba
    seq(S, half(ANS1), b, B(35), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.12), pan=-0.2)
    for m in (43, 50): S.add(B(33), organ(m, 8 * bar * 0.98, vol=0.02))
    finish(S, 'Chafakeu', t0, END, gain=0.92)

def chafakeu_night():
    S, b, bar, t0, END, B = track(60, 32, 971)
    meadow(S, END, 1.8); crickets(S, 0, END, 1.0, 0.012)
    for k in range(1, 33, 6): goatbell(S, B(k) + rnd(0, 3 * bar), 0.02)
    for k in range(1, 33):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.012)
    for k in (6, 21): owl(S, B(k) + rnd(0, bar), 0.045)
    baa(S, B(15), 0.035)
    ramble(S, 0.3, b / 4, 0.1, letters=25); ramble(S, B(19), b / 4, 0.08, letters=30)     # Yeh, still at it
    for m in (43, 50): S.add(0, organ(m, END + 2 * b, vol=0.018))
    # 5-20: a shepherd's pipe lullaby: the tune at half speed
    seq(S, half(CALL1 + ANS1 + CALL2 + ANS2)[:15], b, B(5), lambda m, d: flute(m + 12, d * 0.92, vol=0.08), pan=0.2)
    strum(S, B(5), b, [43, 43, 48, 48, 40, 40, 43, 43, 43, 43, 38, 38, 41, 41, 43, 43], 0.022)
    finish(S, 'Chafakeu_Night', t0, END, gain=0.59)

# ---------------------------------------------------------------- the alpine forest at night
GROW = [[(77, .5), (81, .5)], [(77, .5), (81, .5), (84, .5)], [(77, .5), (81, .5), (84, .5), (89, 1.5)]]
FALMI2 = [(86, .5), (84, .5), (83, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
AROOTS = [41, 41, 43, 41, 43, 48, 48, 41]
OPEN = lambda r: (r + 12, r + 19, r + 26)

def alpine_night():
    S, b, bar, t0, END, B = track(60, 40, 981)
    pines(S, END, 1.4); stream(S, 0, END, 1.0, 0.03, pan=-0.5)
    for k in range(1, 41, 5):
        if rnd() < 0.8: owl(S, B(k) + rnd(0, 3 * bar), rnd(0.04, 0.06))
    for k in range(1, 41):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.014)                    # frost glinting
    for k in range(3, 41, 6): creak(S, B(k) + rnd(0, 2 * bar), 0.05)
    deer(S, B(22) + b, 0.04)
    for m in (41, 48): S.add(0, organ(m, END + 2 * b, vol=0.02))
    # 1-8: the sprout as frost: high, slow, glassy
    t = B(2)
    for g in GROW: t = seq(S, [(m + 12, d * 2) for m, d in g], b, t, lambda m, d: bell(m, max(d, 1.0), vol=0.05), pan=0.4) + b
    # 9-16: Falmi's theme, slow and frosty, on a kalimba over open fifths
    seq(S, half(FALMI + FALMI2), b, B(9), lambda m, d: kalimba(m, max(d * 0.5, 0.6), vol=0.11), pan=-0.1)
    for k, r in enumerate(AROOTS):
        for m in OPEN(r): S.add(B(9 + k), strings(m, bar * 0.98, vol=0.022))
    # 17-24: the night; 25-32: the Shepherd's pipe, far off, playing it freely
    seq(S, half(FALMI), b, B(25), lambda m, d: flute(m, d * 0.95, vol=0.08), pan=0.7)
    for k, r in enumerate(AROOTS[:4]):
        for m in OPEN(r): S.add(B(25 + 2 * k), choir(m, 2 * bar * 0.98, vol=0.015))
    # 33-40: frost again, and the wind
    t = B(34)
    for g in GROW: t = seq(S, [(m + 12, d * 2) for m, d in g], b, t, lambda m, d: bell(m, max(d, 1.0), vol=0.04), pan=-0.4) + b
    finish(S, 'Alpine_Forest_Night', t0, END, gain=0.65, echo=0.34, fb=0.42, reverb=0.42)

ALL = dict(idekeu=idekeu, idekeu_night=idekeu_night, chafakeu=chafakeu, chafakeu_night=chafakeu_night, alpine_night=alpine_night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
