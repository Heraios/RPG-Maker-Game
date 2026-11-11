# Battle themes for the highlands and the shore, grown out of their areas' music (same key, a doubled pulse), for a
# 16-bit orchestra at war, each opening with its jingle.
#   Battle_Highlands (the alpine forest, Idekeu, Chafakeu and the snow line: Alpine_Forest is in F at 66, this is at
#       132): cold and open. Falmi's theme as the alpine forest plays it (Lydian, with the bright B natural) sung broad
#       over open fifths, no warm thirds; then the Lady of the Wind's motif (moved into F to sit with it) on the men's
#       choir and low brass while the strings whip round like wind; the theme again with the Shepherd's pipe
#       answering and the herds' bells; the Lady's high cold arc; the frost sprout climbing.
#   Battle_Shore (the beach near Mansehare: Beach is in G at 84, this is at 168): bright and surging. Jingle: Dama's
#       conch call on the brass. The waves' tune from Beach on horns and strings, a cymbal swell for each wave;
#       Mansehare's rowing song (the Island tune) called on brass and answered by the crew; the waves' tune up high
#       with Dama's call countering; everyone, and the conch call stacked in octaves.
# Usage: python3 battle_heights16.py highlands shore   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
from wind_tune import W1, W2, W3, W4
from island_tune import CALL1, ANS1, CALL2, ANS2, ROOTS as IROOTS
R = None
PLAIN = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)
broad = lambda ph: [(m, d * 2) for m, d in ph]
up = lambda ph, n: [(m + n if m is not None else None, d) for m, d in ph]

def finish(S, name, t0, end, drive=3.0):
    L, Rr = snes_master(S.L, S.R, echo=0.24, fb=0.28, reverb=0.28)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', drive=drive)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def bed(S, t, b, roots, minor, fig=PLAIN, vol=1.0, drums=march, chords=0.6, open_=False):
    bar = 4 * b
    for k, r in enumerate(roots):
        ostinato(S, t + k * bar, b, [r], fig, 0.06 * vol)
        if open_: openchord(S, t + k * bar, bar, r - 12, vol * chords)
        else: power(S, t + k * bar, bar, r - 12, minor.get(r, False), vol * chords)
    low_end(S, t, b, roots, 0.28 * vol); drums(S, t, b, len(roots), vol)

def openchord(S, t, dur, root, vol=1.0):                           # cold: root, fifth, ninth; no third
    for m in (root, root + 7): S.add(t, brass(m, dur * 0.97, vol=0.09 * vol), pan=-0.15)
    for m in (root, root + 7, root + 12): S.add(t, menchoir(m, dur * 0.98, vol=0.08 * vol), pan=0.1)
    for m in (root + 12, root + 19, root + 26, root + 31): S.add(t, strings(m, dur * 0.98, vol=0.07 * vol))
    S.add(t, slapbass(root if root >= 36 else root + 12, min(dur, 1.2), vol=0.18 * vol))

def whip(S, t, b, bars, root, vol=0.05):                           # the wind: strings racing up and down in sixteenths
    run = (0, 2, 3, 5, 7, 8, 10, 12, 14, 12, 10, 8, 7, 5, 3, 2)
    for i in range(bars * 16): S.add(t + i * b / 4, stab(root + 12 + run[i % 16], b / 4 * 0.9, vol=vol * (1 if i % 4 == 0 else 0.6)), pan=(-0.5 + i % 16 / 16))

# ------------------------------------------------------------------ the highlands
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (83, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
F2 = [(86, .5), (84, .5), (83, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
THEME = broad(F1 + F2)                                             # Falmi's theme, Lydian (as in Alpine_Forest): 8 bars
AR = [41, 41, 43, 41, 43, 48, 48, 41]                              # F F G F | G C C F
WIND = up(W1 + W2, 1); WIND2 = up(W3 + W4, 1)                      # the Lady of the Wind, moved into F
WR = [41, 39, 39, 44, 39, 48]; WR2 = [46, 46, 41, 39, 41, 41]       # Fm Eb Eb Ab Eb Cm | Bb Bb Fm Eb Fm Fm
WMIN = {41: True, 48: True, 39: False, 44: False, 46: False}
FROST = [(77, .25), (81, .25), (84, .25), (89, 1.25)]

def highlands():
    np.random.seed(1701)
    b = 60 / 132; bar = 4 * b; INTRO = 1; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    # the jingle (once): a hit; the frost sprout on brass with a high bell; a roll
    hit(S, 0, 41, 1.1, minor=False)
    seq(S, FROST, b, b, lambda m, d: brass(m, d * 0.95, vol=0.34), pan=-0.1)
    seq(S, FROST, b, b, lambda m, d: horn(m - 12, d * 0.95, vol=0.22), pan=0.2)
    S.add(2 * b, bell(95, 1.5, vol=0.1), pan=0.4)                                         # B natural: the Lydian glint
    roll(S, b, 3, b, 0.05, 0.4)
    for i in range(6): S.add((1 + i * 0.5) * b, drum('taiko', 0.3 + 0.07 * i))
    # 1-8: Falmi's theme, broad and cold, over open fifths
    hit(S, B(1), 41, 1.0, minor=False)
    bed(S, B(1), b, AR, {}, open_=True)
    tune(S, B(1), b, THEME, [(horn, 0, 0.36, -0.15, 0.97), (strings, 12, 0.22, 0.25, 0.97), (brass, -12, 0.18, 0.1, 0.95)])
    S.add(B(5), cymbal(0.1, 1.5), pan=0.3)
    # 9-14: the Lady of the Wind: her motif on the men's choir and low brass; the strings whip round like wind
    hit(S, B(9), 41, 1.0)
    bed(S, B(9), b, WR, WMIN, vol=1.05)
    tune(S, B(9), b, WIND, [(menchoir, -12, 0.36, 0.0, 0.97), (brass, -12, 0.26, -0.2, 0.95), (horn, 0, 0.16, 0.25, 0.97)])
    whip(S, B(9), b, 6, 53, 0.04)
    # 15-22: the theme again, sweeping; the Shepherd's pipe answering high; the herds' bells
    hit(S, B(15), 41, 1.0, minor=False)
    bed(S, B(15), b, AR, {}, vol=1.1, open_=True)
    tune(S, B(15), b, THEME, [(strings, 12, 0.32, 0.15, 0.97), (horn, 0, 0.26, -0.2, 0.97), (choir, 0, 0.12, 0.0, 0.97)])
    for k in (16, 18, 20, 22): seq(S, F1[:4], b, B(k) + 2 * b, lambda m, d: flute(m + 12, d * 0.85, vol=0.16), pan=0.45)
    for k in range(8):
        for j in (0, 2): S.add(B(15 + k) + j * b, bell(rnd_bell(k, j), 0.4, vol=0.04), pan=(-0.6, 0.6)[j // 2])
    S.add(B(19), cymbal(0.11, 2), pan=-0.3)
    # 23-28: the Lady's high, cold arc and her sigh, on strings and horns; the choir under it
    hit(S, B(23), 46, 0.95, minor=False)
    bed(S, B(23), b, WR2, WMIN, vol=1.1)
    tune(S, B(23), b, WIND2, [(strings, 0, 0.34, 0.15, 0.97), (horn, -12, 0.3, -0.2, 0.97), (menchoir, -24, 0.24, 0.0, 0.97)])
    whip(S, B(25), b, 2, 53, 0.04)
    # 29-32: the frost sprout climbing, a step a bar; a roll back to the top
    for k, r in enumerate((41, 43, 45, 47)):
        hit(S, B(29 + k), r, 0.85, minor=False)
        tune(S, B(29 + k) + 2 * b, b, up(FROST, r - 41), [(brass, 0, 0.3, (-0.2, 0.2)[k % 2], 0.92), (strings, 12, 0.16, 0.3, 0.95)])
    bed(S, B(29), b, [41, 43, 45, 47], {}, vol=1.1, open_=True, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False))
    for i in range(16): S.add(B(32) + i * b / 4, timpani(41, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Highlands', t0, END, drive=2.6)

def rnd_bell(k, j): return (89, 91, 93, 96)[(k * 2 + j) % 4]       # the herd bells, in no particular order

# ------------------------------------------------------------------ the shore
P1 = [(74, 1), (76, .5), (74, .5), (71, 2), (67, 2), (R, 2)]       # the waves' tune (as in Beach)
P2 = [(71, 1), (74, 1), (79, 2), (76, 1), (74, 1), (R, 2)]
P3 = [(79, 1.5), (81, .5), (79, 1), (76, 1), (74, 2), (R, 2)]
P4 = [(76, 1), (74, 1), (71, 1), (69, 1), (67, 2), (R, 2)]
WAVES = P1 + P2 + P3 + P4                                          # 8 bars
WR_S = [43, 48, 40, 43, 48, 43, 38, 43]                            # G C Em G | C G D G
DAMA = [(64, 1), (59, 1), (64, 1.5), (66, .5), (67, 2)]            # Dama's conch call (6 beats)

def shore():
    np.random.seed(1711)
    b = 60 / 168; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    MIN = {40: True}
    def surge(t, vol=0.1):                                          # a wave: a cymbal swelling into the next downbeat
        n = int(2 * b * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(4) / 4, 'same')
        S.add(t, x * np.linspace(0, 1, n) ** 3 * vol, pan=0.25)
    # the jingle (once, two bars): a hit, and Dama's conch call on the brass; a roll
    hit(S, 0, 43, 1.1, minor=False)
    tune(S, 0, b, DAMA, [(brass, 12, 0.34, -0.1, 0.92), (horn, 0, 0.24, 0.2, 0.95)])
    roll(S, 6 * b, 2, b, 0.08, 0.42)
    # 1-8: the waves' tune on horns and strings; a swell for every wave
    hit(S, B(1), 43, 1.0, minor=False)
    bed(S, B(1), b, WR_S, MIN)
    tune(S, B(1), b, WAVES, [(horn, 0, 0.36, -0.15, 0.97), (strings, 12, 0.22, 0.25, 0.97), (brass, -12, 0.18, 0.1, 0.95)])
    for k in (2, 4, 6, 8): surge(B(k) + 2 * b)
    # 9-16: Mansehare's rowing song: the call on brass, the crew answering in voices; the drums heave
    hit(S, B(9), 43, 0.9, minor=False)
    bed(S, B(9), b, IROOTS, MIN, vol=1.05)
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        tune(S, t, b, call, [(brass, 0, 0.4, -0.4, 0.9), (horn, -12, 0.3, -0.25, 0.92), (strings, 12, 0.14, -0.3, 0.95)])
        t += 2 * bar
        tune(S, t, b, ans, [(menchoir, -12, 0.44, 0.35, 0.95), (choir, 0, 0.24, 0.3, 0.97), (strings, 12, 0.3, 0.4, 0.97), (horn, 0, 0.18, 0.2, 0.95)])
        t += 2 * bar
    for k in range(8):
        for j in (0, 2): S.add(B(9 + k) + j * b, drum('taiko', 0.3), pan=-0.3)
    # 17-24: the waves' tune up high; Dama's call countering on the horns
    hit(S, B(17), 43, 1.0, minor=False)
    bed(S, B(17), b, WR_S, MIN, vol=1.1)
    tune(S, B(17), b, WAVES, [(strings, 12, 0.32, 0.15, 0.97), (flute, 12, 0.16, 0.35, 0.92), (brass, 0, 0.2, -0.1, 0.92)])
    for k in (17, 19, 21, 23): tune(S, B(k) + 2 * b, b, DAMA, [(horn, 0, 0.26, -0.35, 0.95)])
    for k in (18, 20, 22, 24): surge(B(k) + 2 * b, 0.12)
    S.add(B(21), cymbal(0.11, 2), pan=-0.3)
    # 25-28: everyone on the waves' second half; 29-32: the conch call stacked in octaves, hammered; a roll
    hit(S, B(25), 43, 1.0, minor=False)
    bed(S, B(25), b, WR_S[4:], MIN, vol=1.1)
    tune(S, B(25), b, P3 + P4, [(horn, 0, 0.32, -0.15, 0.97), (strings, 12, 0.28, 0.2, 0.97), (choir, 0, 0.14, 0.0, 0.97), (brass, -12, 0.2, 0.1, 0.95)])
    for k, r in enumerate((40, 43, 40, 38)):
        hit(S, B(29 + k), r, 0.85, minor=(r == 40))
    tune(S, B(29), b, DAMA + [(R, 2)] + DAMA, [(brass, 12, 0.3, -0.1, 0.9), (brass, 0, 0.24, 0.2, 0.9), (horn, -12, 0.24, 0.0, 0.95)])
    bed(S, B(29), b, [40, 43, 40, 38], MIN, vol=1.1, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False))
    surge(B(30) + 2 * b, 0.12)
    for i in range(16): S.add(B(32) + i * b / 4, timpani(43, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Shore', t0, END, drive=3.5)

ALL = dict(highlands=highlands, shore=shore)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
