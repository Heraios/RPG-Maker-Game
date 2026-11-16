# The three towns still without music, each with its day theme, an inside version and a night version. Every
# settlement's telegraph taps its name in Morse; Afarohare's keeper (Nauzet) plays a board game by wire with Celhare's
# (Tiare), so each taps a move to the other, and the reply comes back faintly on the line.
#   Afarohare (the grain town: barley terraces, vineyards, goats, gofio mills): slow and sunny, a harvest dance. The
#       Island tune as a tajaraste (the Canary Islands' 6/8 dance) with a timple strummed, castanets (chácaras) and a
#       hand drum; wind in the barley, goat bells, Dacil's quern grinding, the threshing flails; the harvest answered by
#       the women's voices; and Yeray's wine: a flute that has had a little too much of it.
#   Namethare (the copper mine, the battery works, the island's graveyard in the tubes): low and dignified. The Island
#       tune as the miners' work song, called and answered by a men's choir on the pick strokes; Tinguaro's anvil; the
#       battery hum; then Echedey's chant for the tombs (the tune's answer in the minor); and, once, a few notes of the
#       Children of the Caves' song (Ruyman leaves toys for them).
#   Celhare (the silver-lead mine, electroplating, the jeweller): the richest, showiest version. The Island tune on
#       brass and bells, harp runs, silver chimes; the electroplating crackle; Aday's tinkering motif (his family lives
#       here: half Seafarer) in clockwork marimba with his name tapped on bells; the Seafarer fanfare made friendly under
#       the tune's answers.
# Usage: python3 towns16.py afarohare afarohare_inside afarohare_night namethare ... celhare_night   (or none for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, CH, HARM, LOG, chant
from ambience import (bed_wind, gust, goatbells, goatbell, grasshoppers, crickets, owl, twinkle, hearth, crowd,
                      telegraph, Muffle, drip, creak, rnd)
R = None
CH = dict(CH); CH.update({45: (57, 60, 64), 47: (59, 62, 66), 50: (62, 66, 69), 46: (58, 62, 65), 'gm': (55, 58, 62)})

def track(bpm, bars, seed, intro=1, beats=4):
    np.random.seed(seed)
    b = 60 / bpm; bar = beats * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0, **kw):
    m = dict(echo=0.22, fb=0.27, reverb=0.22); m.update(kw)
    L, Rr = snes_master(S.L, S.R, **m)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def strum(S, t, span, roots, vol=0.05):
    for k, r in enumerate(roots):
        for j, m in enumerate(CH[r]): S.add(t + k * span + j * 0.04, harp(m + 12, span * 0.9, vol=vol), pan=-0.3 + j * 0.25)

def bassline(S, t, span, roots, vol=0.22):
    for k, r in enumerate(roots): S.add(t + k * span, pluckbass((r - 12 if r > 40 else r), span * 0.85, vol=vol))

half = lambda ph: [(m, d * 2) for m, d in ph]

# ================================================================== Afarohare
def swing(notes):
    """4/4 quarter-beat notes into 12/8 eighths, lilting: a beat is three eighths, its off-beat falls on the third."""
    out = []; pos = 0.0
    f = lambda p: int(p) * 3 + {0.0: 0, 0.5: 2}[round(p - int(p), 2)]
    for m, d in notes:
        out.append((m, f(pos + d) - f(pos))); pos += d
    return out

def castanets(S, t, vol=0.05, pan=0.4):                            # chácaras: a quick double click
    for i, v in ((0, 1.0), (0.035, 0.7)):
        n = int(0.025 * SR); tt = np.arange(n) / SR
        x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(3) / 3, 'same')
        S.add(t + i, (x + np.sin(2 * np.pi * 2800 * tt) * 0.6) * np.exp(-tt / 0.006) * vol * v, pan=pan)

def timple(S, t, e, r, vol=0.05):                                  # the timple: a little guitar, strummed on the beats
    tri = CH[r]
    for j, (at, down) in enumerate(((0, 1), (2, 0), (3, 1), (5, 0), (6, 1), (8, 0), (9, 1), (11, 0))):
        for i, m in enumerate(tri if down else tri[::-1]): S.add(t + at * e + i * 0.012, harp(m + 12, e * 1.4, vol=vol * (1 if at % 3 == 0 else 0.6)), pan=0.3)

def tajaraste(S, t, e, roots, vol=1.0, chac=True):
    bar = 12 * e
    for k, r in enumerate(roots):
        at = t + k * bar
        timple(S, at, e, r, 0.045 * vol)
        for j in (0, 6): S.add(at + j * e, pluckbass((r - 12 if r > 40 else r), 2.5 * e, vol=0.28 * vol))
        for j in (3, 9): S.add(at + j * e, pluckbass((r - 5 if r > 40 else r + 7), 2 * e, vol=0.2 * vol))
        for j, kind, v in ((0, 'tom', 0.24), (3, 'log', 0.16), (6, 'tom', 0.2), (9, 'log', 0.16)): S.add(at + j * e, drum(kind, v * vol), pan=-0.25)
        if chac:
            for j in (0, 2, 3, 5, 6, 8, 9, 11): castanets(S, at + j * e, (0.06 if j % 3 == 0 else 0.035) * vol)

def quern(S, t, dur, vol=0.07):                                    # Dacil's hand mill: stone grinding round, every bar
    n = int(dur * SR); tt = np.arange(n) / SR; x = lowpass(np.random.uniform(-1, 1, n), 700) * 5
    S.add(t, x * (0.35 + 0.65 * np.sin(np.pi * tt / dur) ** 2) * vol, pan=-0.4)

def flails(S, t, bars, bar, vol=0.08):                             # threshing: thud... thud
    for k in range(bars):
        for j in (0, 0.5):
            n = int(0.1 * SR); x = lowpass(np.random.uniform(-1, 1, n), 500) * 4 * np.exp(-np.arange(n) / SR / 0.025)
            S.add(t + k * bar + j * bar, x * vol, pan=0.45)

def barley(S, END, vol=1.0):
    bed_wind(S, 0, END, 1.0, vol=0.05 * vol, smooth=45, pan=-0.1)
    n = int(END * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
    k = np.random.uniform(0, 1, int(END * 0.5) + 2); sway = np.interp(np.arange(n) / SR * 0.5, np.arange(len(k)), k)
    S.add(0, x * (0.2 + sway) * 0.025 * vol, pan=0.3)                     # the barley heads hissing in the wind

def board(S, t, unit, mine, theirs, vol=0.14, pan=-0.6):            # the board game by wire: a move, and the far reply
    t = telegraph(S, t, mine, unit, vol, pan=pan)
    telegraph(S, t + 8 * unit, theirs, unit, vol * 0.3, pan=-pan)

def afarohare():
    e = 60 / 76 / 3; bar = 12 * e
    np.random.seed(1801); BARS = 32
    S = Stereo((1 + BARS) * bar); END = (1 + BARS) * bar; t0 = bar; B = lambda n: t0 + (n - 1) * bar
    barley(S, END); grasshoppers(S, 0, END, vol=0.01, count=3); crowd(S, 0, END, 1.0, 0.025, pan=0.4)
    for k in range(1, 33, 4): goatbells(S, B(k) + rnd(0, 2 * bar), rnd(1.5, 3) * bar, 0.035)
    for k in range(1, 33, 2): quern(S, B(k) + rnd(0, bar * 0.3), bar * 0.9, 0.05)
    telegraph(S, 0.2, 'AFAROHARE', e / 1.5, 0.14, pan=-0.6)
    board(S, B(14), e / 1.5, 'YOUR MOVE', 'WAIT')
    # intro (once): castanets, and the timple's first strum
    for j in (6, 8, 9, 11): castanets(S, j * e, 0.06)
    timple(S, 0, e, 43, 0.04)
    # 1-8: the tune as a tajaraste, on a flute over the timple, castanets and hand drum
    seq(S, swing(TUNE), e, B(1), lambda m, d: flute(m + 12, d * 0.9, vol=0.32), pan=0.15)
    seq(S, swing(HARM), e, B(1), lambda m, d: kalimba(m, max(d * 0.6, 0.4), vol=0.1), pan=-0.4)
    tajaraste(S, B(1), e, ROOTS)
    # 9-16: the harvest answered: the call on the flute, the women's voices and a marimba answering
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, swing(call), e, t, lambda m, d: flute(m + 12, d * 0.9, vol=0.3), pan=0.2)
        seq(S, swing(ans), e, t, lambda m, d: choir(m, d * 0.95, vol=0.12), pan=-0.2)
        t = seq(S, swing(ans), e, t, lambda m, d: marimba(m, d * 0.8, vol=0.26), pan=-0.2)
    tajaraste(S, B(9), e, ROOTS); S.add(B(9) + 3 * e, drum('clap', 0.14))
    # 17-24: the mill and the flails keep time; the answers slow on a kalimba; Yeray's wine (a flute, a little sour)
    flails(S, B(17), 8, bar)
    seq(S, half(swing(ANS1 + ANS2)), e, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.3), pan=0.1)
    seq(S, half(swing(ANS1 + ANS2)), e, B(17), lambda m, d: choir(m - 12, d * 0.95, vol=0.08), pan=-0.2)
    tajaraste(S, B(17), e, [43, 48, 40, 43, 41, 38, 41, 43], 0.9, chac=False)
    seq(S, swing(CALL1), e, B(21) + 6 * e, lambda m, d: flute(m + 12.35, d * 1.1, vol=0.13), pan=0.6)        # ...hic
    # 25-32: everyone: the dance at its fullest, claps on the off-beats
    seq(S, swing(TUNE), e, B(25), lambda m, d: flute(m + 12, d * 0.9, vol=0.28), pan=0.2)
    seq(S, swing(TUNE), e, B(25), lambda m, d: marimba(m, d * 0.8, vol=0.3), pan=-0.2)
    seq(S, swing(ANS1), e, B(27), lambda m, d: choir(m, d * 0.95, vol=0.1))
    seq(S, swing(ANS2), e, B(31), lambda m, d: choir(m, d * 0.95, vol=0.1))
    tajaraste(S, B(25), e, ROOTS, 1.1)
    for k in range(8):
        for j in (3, 9): S.add(B(25 + k) + j * e, drum('clap', 0.12), pan=-0.1)
    finish(S, 'Afarohare', t0, END, gain=0.85)

def afarohare_inside():
    """Atteya's farmhouse inn: Dacil's quern grinding in the next room (the rhythm), the hearth, the wind in the barley
    and the goats through the walls. The dance tune small: a timple and a kalimba by the fire, a hummed answer."""
    e = 60 / 72 / 3; bar = 12 * e
    np.random.seed(1811); BARS = 24
    S = Stereo((1 + BARS) * bar); END = (1 + BARS) * bar; t0 = bar; B = lambda n: t0 + (n - 1) * bar
    out = Muffle(S, 500)
    barley(out, END, 1.5); hearth(S, 0, END, 1.0, 0.12)
    for k in range(1, 25, 4): goatbells(out, B(k) + rnd(0, 2 * bar), rnd(1.5, 3) * bar, 0.05)
    for k in range(1, 25): quern(S, B(k), bar * 0.9, 0.045)
    telegraph(out, 0.3, 'AFAROHARE', e / 1.5, 0.2, pan=-0.6); board(out, B(13), e / 1.5, 'YOUR MOVE', 'WAIT', 0.18)
    # 1-8: the tune on a kalimba, the timple strummed softly
    seq(S, swing(TUNE), e, B(1), lambda m, d: kalimba(m + 12, max(d * 0.7, 0.4), vol=0.24), pan=-0.1)
    for k, r in enumerate(ROOTS): timple(S, B(1 + k), e, r, 0.03); S.add(B(1 + k), pluckbass((r - 12 if r > 40 else r), bar * 0.8, vol=0.18))
    # 9-16: a low flute on the calls, the answers hummed
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, swing(call), e, t, lambda m, d: flute(m, d * 0.93, vol=0.18), pan=0.3)
        t = seq(S, swing(ans), e, t, lambda m, d: choir(m - 12, d * 0.95, vol=0.12), pan=-0.2)
    for k, r in enumerate(ROOTS): timple(S, B(9 + k), e, r, 0.028); S.add(B(9 + k), pluckbass((r - 12 if r > 40 else r), bar * 0.8, vol=0.16))
    # 17-24: slow: the answers on the kalimba, half speed
    seq(S, half(swing(ANS1 + ANS2)), e, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.2), pan=0.1)
    strum(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.035); bassline(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.16)
    finish(S, 'Afarohare_Inside', t0, END, gain=0.85, echo=0.18, fb=0.22, reverb=0.16, cutoff=8000)

def afarohare_night():
    """The grain town after dark: crickets, a warm wind in the barley, a sleepy goat bell, an owl; far off, a late harvest
    party (castanets and the dance, muffled); Nauzet, bored, still playing his board game by wire; the tune as a lullaby."""
    S, b, bar, t0, END, B = track(66, 32, 1821)
    barley(S, END, 1.7); crickets(S, 0, END, 1.0, 0.03)
    for k in (5, 21): owl(S, B(k) + rnd(0, bar), 0.05)
    for k in (9, 26): goatbell(S, B(k) + rnd(0, bar), 0.025)
    telegraph(S, 0.3, 'AFAROHARE', b / 3, 0.11, pan=-0.6); board(S, B(11), b / 3, 'YOUR MOVE', 'WAIT', 0.1); board(S, B(27), b / 3, 'CHECK', 'NO', 0.1)
    far = Muffle(S, 450, 0.7)
    e = b / 3 * 1.2
    seq(far, swing(TUNE), e, B(17), lambda m, d: flute(m + 12, d * 0.9, vol=0.2), pan=0.6)            # the party, far off
    for k in range(8):
        for j in (0, 3, 6, 9): castanets(far, B(17) + k * 12 * e + j * e, 0.08, pan=0.6)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022))
    seq(S, half(CALL1 + ANS1), b, B(1), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.2), pan=0.15)
    strum(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.03); bassline(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.16)
    seq(S, half(CALL2 + ANS2), b, B(9), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.18), pan=-0.2)
    strum(S, B(9), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.028); bassline(S, B(9), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.14)
    seq(S, half(ANS1 + ANS2), b, B(25), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.16), pan=0.2)
    strum(S, B(25), bar, [43, 43, 40, 43, 41, 41, 43, 43], 0.025)
    finish(S, 'Afarohare_Night', t0, END, gain=0.75, echo=0.3, fb=0.36, reverb=0.34)

# ================================================================== Namethare
LAMENT = [(70, 1), (69, 1), (67, 1), (69, 1), (70, 1.5), (69, .5), (67, 2)]       # the tune's answer, in G minor
LAMENT2 = [(67, 1), (65, 1), (62, 1), (65, 1), (67, 1.5), (69, .5), (67, 2)]
FAE1 = [(81, 1.5), (82, .5), (78, 1), (75, 1), (74, 4)]                            # the Children of the Caves

def pick(S, t, vol=0.06, pan=None):                                # a pick on rock in a tunnel: a ring, and its echo
    pan = rnd(-0.8, 0.8) if pan is None else pan
    n = int(0.25 * SR); tt = np.arange(n) / SR; f = rnd(1800, 2600)
    x = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.3 * tt)) * np.exp(-tt / 0.04) + np.random.uniform(-1, 1, n) * np.exp(-tt / 0.004)
    S.add(t, x * vol, pan=pan); S.add(t + 0.3, x * vol * 0.3, pan=-pan * 0.5)

def anvil(S, t, vol=0.08):                                         # Tinguaro at his anvil: a hard, ringing strike
    n = int(1.0 * SR); tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / dcy) for f, a, dcy in ((1260, 1, 0.5), (2730, 0.6, 0.25), (4100, 0.3, 0.12), (520, 0.4, 0.3)))
    S.add(t, (x + np.random.uniform(-1, 1, n) * np.exp(-tt / 0.003)) * vol, pan=0.5)

def hum(S, start, end, vol=0.02):                                  # the battery works: a steady electric hum, crackling
    n = int((end - start) * SR); tt = np.arange(n) / SR
    x = np.sign(np.sin(2 * np.pi * 100 * tt)) * 0.3 + np.sin(2 * np.pi * 200 * tt) * 0.5
    sp = np.zeros(n); idx = np.random.randint(0, n, int((end - start) * 3)); sp[idx] = np.random.uniform(-1, 1, len(idx))
    x = lowpass(x, 1200) + np.convolve(sp, np.exp(-np.arange(200) / 20), 'same') * 0.6
    S.add(start, x * np.clip(tt, 0, 1) * vol, pan=-0.3)

def carts(S, t, vol=0.05):                                         # an ore cart rumbling past
    n = int(rnd(2, 3.5) * SR); x = lowpass(np.random.uniform(-1, 1, n), 200) * 8
    tt = np.arange(n) / SR; clack = (np.sin(2 * np.pi * 3 * tt) > 0.95) * 0.5
    S.add(t, (x + clack) * np.sin(np.pi * tt / (n / SR)) ** 2 * vol, pan=rnd(-0.7, 0.7))

def namethare():
    S, b, bar, t0, END, B = track(76, 32, 1831)
    bed_wind(S, 0, END, 1.0, vol=0.04, smooth=30, pan=-0.2); hum(S, 0, END, 0.025); crowd(S, 0, END, 1.0, 0.02, pan=0.4)
    for k in range(1, 33, 5): carts(S, B(k) + rnd(0, 2 * bar))
    telegraph(S, 0.2, 'NAMETHARE', b / 5, 0.14, pan=-0.6); telegraph(S, B(19), 'NAMETHARE', b / 5, 0.1, pan=-0.6)    # Moko, in a hurry
    # 1-8: the miners' work song: a leader calls (low brass), the crew answers (men's choir), on the pick strokes
    t = B(1)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: brass(m - 12, d * 0.9, vol=0.24), pan=-0.3)
        t = seq(S, ans, b, t, lambda m, d: menchoir(m - 12, d * 0.95, vol=0.3), pan=0.2)
    for k, r in enumerate(ROOTS):
        S.add(B(1 + k), pluckbass((r - 12 if r > 40 else r), 2 * b * 0.9, vol=0.26)); S.add(B(1 + k) + 2 * b, pluckbass((r - 5 if r > 40 else r + 7), 2 * b * 0.9, vol=0.2))
        for j in (0, 2): pick(S, B(1 + k) + j * b, 0.07); S.add(B(1 + k) + j * b, drum('tom', 0.16), pan=-0.2)
        for m in CH[r]: S.add(B(1 + k), strings(m - 12, bar * 0.98, vol=0.03))
    # 9-16: the tune on horns, low and dignified; an organ; Tinguaro's anvil on the off-beats
    seq(S, TUNE, b, B(9), lambda m, d: horn(m - 12, d * 0.95, vol=0.3), pan=-0.1)
    seq(S, HARM, b, B(9), lambda m, d: organ(m - 12, d * 0.95, vol=0.06), pan=0.25)
    for k, r in enumerate(ROOTS):
        S.add(B(9 + k), pluckbass((r - 12 if r > 40 else r), bar * 0.9, vol=0.24))
        for m in CH[r]: S.add(B(9 + k), strings(m - 12, bar * 0.98, vol=0.035))
        S.add(B(9 + k), drum('tom', 0.16), pan=-0.2)
    for k in (10, 12, 14, 16): anvil(S, B(k) + 1.5 * b); anvil(S, B(k) + 3.5 * b, 0.06)
    # 17-24: Echedey's chant for the tombs: the answer in the minor, men's choir and organ; a tomb bell
    seq(S, half(LAMENT + LAMENT2), b, B(17), lambda m, d: menchoir(m - 12, d * 0.97, vol=0.28), pan=0.0)
    seq(S, half(LAMENT + LAMENT2), b, B(17), lambda m, d: organ(m - 24, d * 0.97, vol=0.05), pan=-0.2)
    for k, r in enumerate(('gm', 'gm', 41, 41, 'gm', 'gm', 41, 'gm')):
        for m in CH[r]: S.add(B(17 + k), strings(m - 12, bar * 0.98, vol=0.03))
        S.add(B(17 + k), pluckbass(43 - 12 if r == 'gm' else 41 - 12, bar * 0.9, vol=0.2))
    for k in (17, 21): S.add(B(k), bell(67, 3, vol=0.08), pan=0.3)
    seq(S, FAE1, b, B(23) + 2 * b, lambda m, d: kalimba(m + 12, max(d * 0.5, 0.4), vol=0.06), pan=0.8)    # (Ruyman's toys)
    # 25-32: the work song again, everyone; the anvil and the picks together
    seq(S, TUNE, b, B(25), lambda m, d: horn(m - 12, d * 0.95, vol=0.26), pan=-0.15)
    seq(S, ANS1, b, B(27), lambda m, d: menchoir(m - 12, d * 0.95, vol=0.28), pan=0.2)
    seq(S, ANS2, b, B(31), lambda m, d: menchoir(m - 12, d * 0.95, vol=0.28), pan=0.2)
    for k, r in enumerate(ROOTS):
        S.add(B(25 + k), pluckbass((r - 12 if r > 40 else r), 2 * b * 0.9, vol=0.26)); S.add(B(25 + k) + 2 * b, pluckbass((r - 5 if r > 40 else r + 7), 2 * b * 0.9, vol=0.2))
        for j in (0, 2): pick(S, B(25 + k) + j * b, 0.07); S.add(B(25 + k) + j * b, drum('tom', 0.18), pan=-0.2)
        for m in CH[r]: S.add(B(25 + k), strings(m - 12, bar * 0.98, vol=0.035))
        if k % 2: anvil(S, B(25 + k) + 3 * b, 0.06)
    finish(S, 'Namethare', t0, END, gain=1.0, echo=0.3, fb=0.34, reverb=0.32)

def namethare_inside():
    """A miner's house: the picks and the carts far off through the walls, the battery hum through the floor, the
    hearth; the tune hummed low on a kalimba and a men's voice; the tomb bell, muffled."""
    S, b, bar, t0, END, B = track(72, 24, 1841)
    out = Muffle(S, 450)
    hum(out, 0, END, 0.05); hearth(S, 0, END, 1.0, 0.12); bed_wind(out, 0, END, 1.0, vol=0.06, smooth=30)
    at = 0.4
    while at < END - 1: pick(out, at, rnd(0.08, 0.12)); at += rnd(1.0, 2.5)
    for k in (5, 17): carts(out, B(k), 0.08)
    telegraph(out, 0.3, 'NAMETHARE', b / 5, 0.2, pan=-0.6)
    seq(S, TUNE, b, B(1), lambda m, d: kalimba(m, max(d * 0.7, 0.4), vol=0.24), pan=-0.1)
    strum(S, B(1), bar, ROOTS, 0.04); bassline(S, B(1), bar, ROOTS)
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: flute(m - 12, d * 0.93, vol=0.16), pan=0.3)
        t = seq(S, ans, b, t, lambda m, d: menchoir(m - 12, d * 0.95, vol=0.18), pan=-0.2)
    strum(S, B(9), bar, ROOTS, 0.035); bassline(S, B(9), bar, ROOTS, 0.2)
    S.add(B(17), bell(67, 3, vol=0.06), pan=0.4)
    seq(S, half(LAMENT + LAMENT2), b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.18), pan=0.1)
    for k, r in enumerate(('gm', 'gm', 41, 41, 'gm', 'gm', 41, 'gm')):
        for m in CH[r]: S.add(B(17 + k), strings(m - 12, bar * 0.98, vol=0.025))
        S.add(B(17 + k), pluckbass(43 - 12 if r == 'gm' else 41 - 12, bar * 0.9, vol=0.16))
    finish(S, 'Namethare_Inside', t0, END, gain=0.95, echo=0.18, fb=0.22, reverb=0.16, cutoff=8000)

def namethare_night():
    """The mine town after dark: the night shift (a few picks, far down), the battery hum louder in the quiet, lamps at
    the tombs (glints), a few crickets, an owl; Echedey's chant for the dead, quietly; the tune as a lullaby."""
    S, b, bar, t0, END, B = track(60, 32, 1851)
    bed_wind(S, 0, END, 1.0, vol=0.05, smooth=40, pan=-0.2); hum(S, 0, END, 0.035); crickets(S, 0, END, 1.0, 0.008)
    at = 0.6
    while at < END - 1: pick(S, at, rnd(0.03, 0.05)); at += rnd(2.0, 5.0)
    for k in range(1, 33, 2):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.012)
    for k in (8, 25): owl(S, B(k) + rnd(0, bar), 0.04)
    telegraph(S, 0.3, 'NAMETHARE', b / 4, 0.1, pan=-0.6)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022))
    seq(S, half(LAMENT + LAMENT2), b, B(3), lambda m, d: menchoir(m - 12, d * 0.97, vol=0.16), pan=0.0)
    for k, r in enumerate(('gm', 'gm', 41, 41, 'gm', 'gm', 41, 'gm')):
        for m in CH[r]: S.add(B(3 + k), strings(m - 12, bar * 0.98, vol=0.022))
    S.add(B(3), bell(67, 3, vol=0.06), pan=0.3)
    seq(S, half(CALL1 + ANS1), b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.18), pan=0.15)
    strum(S, B(17), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.025); bassline(S, B(17), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.14)
    finish(S, 'Namethare_Night', t0, END, gain=0.85, echo=0.32, fb=0.38, reverb=0.36)

# ================================================================== Celhare
AD1 = [(79, .5), (83, .5), (86, 1), (84, .5), (83, .5), (81, 1), (77, 1), (79, 2),
       (83, .5), (84, .5), (86, .5), (88, .5), (89, 1), (88, .5), (86, .5), (84, 2), (86, 2)]     # Aday's motif (4 bars)
CA = [43, 41, 41, 48]
FRIEND = [(R, 8), (55, 1), (62, 1), (55, .5), (57, .5), (59, 2), (R, 3),
          (R, 8), (53, 1), (60, 1), (53, .5), (55, .5), (57, 2), (R, 3)]    # the Seafarer fanfare made friendly (as in Mansehare)

def chimes(S, t, vol=0.05, n=6, up=True):                          # silver chimes: a quick, glittering run
    notes = [91, 93, 95, 98, 100, 103, 105, 107][:n]
    for i, m in enumerate(notes if up else notes[::-1]): S.add(t + i * 0.05, bell(m, 0.6, vol=vol * (1 - 0.06 * i)), pan=-0.6 + i * 0.2)

def plating(S, start, end, vol=0.02):                              # electroplating: a fizzing crackle over a hum
    n = int((end - start) * SR); tt = np.arange(n) / SR
    x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(3) / 3, 'same')
    k = np.random.uniform(0, 1, int((end - start) * 6) + 2); fizz = np.interp(tt * 6, np.arange(len(k)), k) ** 3
    S.add(start, (x * fizz + np.sin(2 * np.pi * 100 * tt) * 0.15) * np.clip(tt, 0, 1) * vol, pan=0.5)

def taps(S, t, bars, bar, vol=0.04):                               # Mahina at work: tiny hammer taps on silver
    for k in range(bars):
        for j in range(np.random.randint(3, 7)):
            at = t + k * bar + rnd(0, bar)
            n = int(0.05 * SR); tt = np.arange(n) / SR; f = rnd(3500, 5200)
            S.add(at, np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.01) * vol, pan=-0.5)

def morse_bells(S, t, b, word='ADAY', vol=0.1):                    # Aday's name, tapped out on a bell
    from ambience import MORSE
    for ch in word:
        for sym in MORSE[ch]:
            d = 0.25 * b if sym == '.' else 0.6 * b
            S.add(t, bell(96, d, vol=vol)[:int(d * SR)], pan=0.5); t += d + 0.2 * b
        t += 0.4 * b
    return t

def celhare():
    S, b, bar, t0, END, B = track(108, 32, 1861)
    crowd(S, 0, END, 1.0, 0.035, pan=-0.4); crowd(S, 0, END, 1.0, 0.03, pan=0.4); plating(S, 0, END, 0.025)
    taps(S, B(1), 32, bar)
    telegraph(S, 0.2, 'CELHARE', b / 4, 0.14, pan=-0.6)
    board(S, B(20), b / 4, 'YOUR MOVE', 'HMM', 0.12)
    # 1-8: the tune on brass and bells, harp runs, island drums with a Seafarer snare
    chimes(S, B(1) - 0.3, 0.06)
    seq(S, TUNE, b, B(1), lambda m, d: brass(m, d * 0.85, vol=0.28), pan=-0.15)
    seq(S, TUNE, b, B(1), lambda m, d: bell(m + 12, max(d * 0.5, 0.4), vol=0.06), pan=0.4)
    for k, r in enumerate(ROOTS):
        at = B(1 + k); arp = list(CH[r]) + [CH[r][0] + 12]
        for j in range(8): S.add(at + j * b / 2, harp(arp[(j if j < 4 else 7 - j)] + 12, b * 0.5, vol=0.07), pan=(-0.5, 0.5)[j % 2])
        for j, iv in ((0, 0), (1.5, 7), (2.5, 12), (3, 7)): S.add(at + j * b, pluckbass((r - 12 if r > 40 else r) + iv, b * 0.8, vol=0.3))
        for j, kind in LOG: S.add(at + j * b, drum(kind, 0.2), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
        for j in (1, 3): S.add(at + j * b, drum('snare', 0.12), pan=0.2)
    S.add(B(5), cymbal(0.07, 1.2), pan=0.3)
    # 9-16: Aday's tinkering motif, in clockwork marimba; his name tapped on a bell
    seq(S, AD1 + AD1, b, B(9), lambda m, d: marimba(m, d * 0.85, vol=0.36), pan=-0.15)
    seq(S, AD1 + AD1, b, B(9), lambda m, d: flute(m, d * 0.8, vol=0.12), pan=0.3)
    for k in range(8):
        r = CA[k % 4]; tri = CH[r]
        for j in range(16): S.add(B(9 + k) + j * b / 4, marimba((tri + (tri[0] + 12,))[(0, 2, 1, 3)[j % 4]] + 12, b / 4, vol=0.06), pan=(-0.45, 0.45)[j % 2])
        S.add(B(9 + k), pluckbass(r - 12, b * 0.9, vol=0.3)); S.add(B(9 + k) + 2 * b, pluckbass(r - 5, b * 0.9, vol=0.26))
        S.add(B(9 + k), drum('kick', 0.2)); S.add(B(9 + k) + b, drum('snare', 0.14), pan=0.15); S.add(B(9 + k) + 3 * b, drum('snare', 0.14), pan=0.15)
    morse_bells(S, B(12), b); morse_bells(S, B(16), b, vol=0.08)
    # 17-24: the tune on marimba, the Seafarer fanfare made friendly under its answers; strings
    seq(S, TUNE, b, B(17), lambda m, d: marimba(m, d * 0.8, vol=0.32), pan=-0.2)
    seq(S, FRIEND, b, B(17), lambda m, d: horn(m, d * 0.9, vol=0.16), pan=0.35)
    strum(S, B(17), bar, ROOTS, 0.035)
    for k, r in enumerate(ROOTS):
        for m in CH[r]: S.add(B(17 + k), strings(m, bar * 0.98, vol=0.035))
        S.add(B(17 + k), pluckbass((r - 12 if r > 40 else r), 2 * b * 0.9, vol=0.26)); S.add(B(17 + k) + 2 * b, pluckbass((r - 5 if r > 40 else r + 7), 2 * b * 0.9, vol=0.2))
        for j, kind in LOG: S.add(B(17 + k) + j * b, drum(kind, 0.16), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    chimes(S, B(21) - 0.3, 0.05, up=False)
    # 25-32: everyone, at its showiest: brass, strings, choir on the answers, chimes cascading
    chimes(S, B(25) - 0.3, 0.07)
    seq(S, TUNE, b, B(25), lambda m, d: brass(m, d * 0.85, vol=0.28), pan=-0.15)
    seq(S, TUNE, b, B(25), lambda m, d: strings(m + 12, d * 0.95, vol=0.12), pan=0.25)
    seq(S, HARM, b, B(25), lambda m, d: bell(m + 12, max(d * 0.5, 0.4), vol=0.05), pan=0.5)
    seq(S, ANS1, b, B(27), lambda m, d: chant(m, d * 0.95, vol=0.06)); seq(S, ANS2, b, B(31), lambda m, d: chant(m, d * 0.95, vol=0.06))
    for k, r in enumerate(ROOTS):
        at = B(25 + k); arp = list(CH[r]) + [CH[r][0] + 12]
        for j in range(8): S.add(at + j * b / 2, harp(arp[(j if j < 4 else 7 - j)] + 12, b * 0.5, vol=0.07), pan=(-0.5, 0.5)[j % 2])
        for j, iv in ((0, 0), (1.5, 7), (2.5, 12), (3, 7)): S.add(at + j * b, pluckbass((r - 12 if r > 40 else r) + iv, b * 0.8, vol=0.3))
        for j, kind in LOG: S.add(at + j * b, drum(kind, 0.22), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
        for j in (1, 3): S.add(at + j * b, drum('snare', 0.12), pan=0.2)
    S.add(B(29), cymbal(0.08, 1.5), pan=-0.3); chimes(S, B(32) + 2 * b, 0.06, up=False)
    finish(S, 'Celhare', t0, END, gain=0.85)

def celhare_inside():
    """Mahina and Beneharo's workshop: tiny hammer taps on silver (the rhythm), the plating bath fizzing next door, a
    clock ticking, the market muffled through the walls; the tune on bells like a music box, a harp; Aday's motif, small."""
    S, b, bar, t0, END, B = track(84, 24, 1871)
    out = Muffle(S, 500)
    crowd(out, 0, END, 1.0, 0.06, pan=0.5); plating(S, 0, END, 0.03); hearth(S, 0, END, 1.0, 0.07)
    taps(S, B(1), 24, bar, 0.05)
    for i in range(int(END / b)): S.add(i * b, drum('log', 0.025 if i % 2 else 0.04), pan=0.6)       # a clock
    telegraph(out, 0.3, 'CELHARE', b / 4, 0.2, pan=-0.6)
    def box(m, d, vol=0.18):
        x = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
        n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))
    seq(S, TUNE, b, B(1), lambda m, d: box(m, d), pan=-0.1)
    strum(S, B(1), bar, ROOTS, 0.045); bassline(S, B(1), bar, ROOTS)
    seq(S, AD1 + AD1, b, B(9), lambda m, d: marimba(m - 12, d * 0.8, vol=0.22), pan=0.2)
    strum(S, B(9), bar, CA + CA, 0.04); bassline(S, B(9), bar, CA + CA, 0.2)
    morse_bells(S, B(12), b, vol=0.06)
    seq(S, half(ANS1 + ANS2), b, B(17), lambda m, d: box(m, d * 0.6, 0.16), pan=0.1)
    strum(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.035); bassline(S, B(17), bar, [43, 48, 40, 43, 41, 38, 41, 43], 0.18)
    finish(S, 'Celhare_Inside', t0, END, gain=0.75, echo=0.18, fb=0.22, reverb=0.16, cutoff=8000)

def celhare_night():
    """The silver town after dark, lamplit and rich: silver wind chimes in the breeze, the plating works humming,
    crickets, an owl; Tiare and Nauzet's game still going; the tune on a harp, slow; Aday's motif on bells, slower."""
    S, b, bar, t0, END, B = track(66, 32, 1881)
    bed_wind(S, 0, END, 1.0, vol=0.08, smooth=40); crickets(S, 0, END, 1.0, 0.026); plating(S, 0, END, 0.03)
    for k in range(1, 33):
        if rnd() < 0.7: chimes(S, B(k) + rnd(0, bar), rnd(0.03, 0.05), n=np.random.randint(3, 6), up=rnd() < 0.5)
    for k in (7, 24): owl(S, B(k) + rnd(0, bar), 0.045)
    telegraph(S, 0.3, 'CELHARE', b / 3, 0.1, pan=-0.6); board(S, B(13), b / 3, 'YOUR MOVE', 'WAIT', 0.09)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022))
    seq(S, half(CALL1 + ANS1), b, B(1), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.2), pan=-0.1)
    strum(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.025); bassline(S, B(1), bar, [43, 43, 48, 48, 40, 40, 43, 43], 0.14)
    seq(S, half(CALL2 + ANS2), b, B(9), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.18), pan=-0.1)
    strum(S, B(9), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.025); bassline(S, B(9), bar, [43, 43, 38, 38, 41, 41, 43, 43], 0.14)
    seq(S, half(AD1), b, B(17), lambda m, d: bell(m, max(d * 0.4, 0.6), vol=0.09), pan=0.4)
    seq(S, half(AD1), b, B(17) + b / 2, lambda m, d: kalimba(m, max(d * 0.4, 0.5), vol=0.08), pan=-0.3)
    strum(S, B(17), bar, [43, 43, 41, 41, 41, 41, 48, 48], 0.028); bassline(S, B(17), bar, [43, 43, 41, 41, 41, 41, 48, 48], 0.14)
    seq(S, half(ANS1 + ANS2), b, B(25), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.16), pan=0.1)
    strum(S, B(25), bar, [43, 43, 40, 43, 41, 41, 43, 43], 0.025)
    finish(S, 'Celhare_Night', t0, END, gain=0.75, echo=0.3, fb=0.36, reverb=0.34)

ALL = dict(afarohare=afarohare, afarohare_inside=afarohare_inside, afarohare_night=afarohare_night,
           namethare=namethare, namethare_inside=namethare_inside, namethare_night=namethare_night,
           celhare=celhare, celhare_inside=celhare_inside, celhare_night=celhare_night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
