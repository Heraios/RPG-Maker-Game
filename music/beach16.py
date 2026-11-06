# The beach on the wet-side coast near Mansehare, by day and by night. Mostly ambience.
#   Beach: bright and open (the marsh's opposite): surf, a sea breeze, gulls, shell chimes clinking, crabs
#       scuttling, grasshoppers in the dune grass. A slow flute that comes and goes with the waves (each phrase
#       starts as a wave rolls in and fades as it draws back), on the Island tune's notes. Far out, Dama's
#       spearfishers: her conch call. Down the coast, Mansehare's rowing song, faint.
#   Beach_Night: slow surf, the water lapping, crickets in the dunes, a night heron, stars; the flute sparser,
#       a kalimba; Mansehare's lights down the coast, its tune as a lullaby, far away.
# Usage: python3 beach16.py day night   (or no names for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import CALL1, ANS1, ANS2, LOG
from ambience import surf, lap, bed_wind, gull, clacks, grasshoppers, crickets, heron, twinkle, rnd
R = None
CH = {43: (55, 59, 62), 48: (60, 64, 67), 40: (52, 55, 59), 38: (50, 54, 57)}
P1 = [(74, 1), (76, .5), (74, .5), (71, 2), (67, 2), (R, 2)]       # the waves' tune: two bars a phrase,
P2 = [(71, 1), (74, 1), (79, 2), (76, 1), (74, 1), (R, 2)]         # G pentatonic, like the Island tune
P3 = [(79, 1.5), (81, .5), (79, 1), (76, 1), (74, 2), (R, 2)]
P4 = [(76, 1), (74, 1), (71, 1), (69, 1), (67, 2), (R, 2)]
PR = [(43, 48), (40, 43), (48, 43), (38, 43)]                      # two chords under each phrase
DAMA = [(64, 1), (59, 1), (64, 1.5), (66, .5), (67, 2)]            # Dama's conch call

def track(bpm, bars, seed, intro=1):
    np.random.seed(seed)
    b = 60 / bpm; bar = 4 * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0):
    L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.36, reverb=0.32)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def scuttle(S, t, vol=0.03):                                       # a crab across the stones
    pan = rnd(-0.8, 0.8)
    for i in range(np.random.randint(5, 10)):
        n = int(0.012 * SR); S.add(t + i * rnd(0.03, 0.06), np.random.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR / 0.002) * vol, pan=pan)

def waves(S, b, at, phrases, inst, vol, pan=0.15):                 # each phrase with a harp under it, two bars
    for k, ph in enumerate(phrases):
        t = at + k * 8 * b
        seq(S, ph, b, t, lambda m, d: inst(m, d, vol), pan=pan)
        for j, r in enumerate(PR[[P1, P2, P3, P4].index(ph)]):
            for i, m in enumerate(CH[r]): S.add(t + j * 4 * b + i * 0.06, harp(m + 12, 3 * b, vol=0.04), pan=-0.3 + i * 0.2)
            S.add(t + j * 4 * b, pluckbass(r - 12 if r > 40 else r, 3.5 * b, vol=0.14))

def far_row(S, b, bar, at, vol=0.08):                              # Mansehare's rowing song, down the coast
    seq(S, CALL1 + ANS1, b, at, lambda m, d: marimba(m, d * 0.8, vol=vol), pan=0.75)
    seq(S, ANS1, b, at + 2 * bar, lambda m, d: flute(m + 12, d * 0.9, vol=vol * 0.4), pan=0.75)
    for k in range(4):
        for j, kind in LOG: S.add(at + k * bar + j * b, drum(kind, vol * 0.5), pan=0.75)

# ------------------------------------------------------------------ by day
def day():
    S, b, bar, t0, END, B = track(84, 40, 861)
    period = 2 * bar                                               # a wave every two bars, so the flute can ride them
    surf(S, 0, END, 1.0, 0.1, period=period, pan=0.3)
    bed_wind(S, 0, END, 1.0, vol=0.045, smooth=35, pan=-0.3)
    grasshoppers(S, 0, END, vol=0.012, count=3)
    for k in range(1, 41, 3):
        if rnd() < 0.8: gull(S, B(k) + rnd(0, 2 * bar), 0.05, calls=np.random.randint(1, 4))
        if rnd() < 0.5: clacks(S, B(k) + rnd(0, 2 * bar), 0.035)
        if rnd() < 0.4: scuttle(S, B(k) + rnd(0, 2 * bar))
    # 5-12: the flute rides the waves; 13-16 Dama's conch, far out; 17-24 the flute and a kalimba
    waves(S, b, B(5), [P1, P2, P3, P4], lambda m, d, v: flute(m + 12, d * 0.95, vol=v), 0.2)
    seq(S, DAMA, b, B(13) + b, lambda m, d: brass(m - 12, d * 0.9, vol=0.1), pan=-0.7)
    seq(S, DAMA, b, B(15) + b, lambda m, d: brass(m - 12, d * 0.9, vol=0.08), pan=-0.75)
    waves(S, b, B(17), [P1, P2, P3, P4], lambda m, d, v: flute(m + 12, d * 0.95, vol=v), 0.18)
    seq(S, P1 + P2 + P3 + P4, b, B(17) + 0.5 * b, lambda m, d: kalimba(m + 12, max(d * 0.5, 0.4), vol=0.08), pan=-0.4)
    for i in range(64): S.add(B(17) + i * b / 2, drum('shaker', 0.025 if i % 2 else 0.015), pan=0.45)
    # 25-28: Mansehare's rowing song, down the coast; 29-36 the flute, sparser; 37-40 the sea
    far_row(S, b, bar, B(25))
    waves(S, b, B(29), [P3, P1, P4, P2], lambda m, d, v: flute(m + 12, d * 0.95, vol=v), 0.16)
    finish(S, 'Beach', t0, END, gain=0.8)

# ------------------------------------------------------------------ by night
def night():
    S, b, bar, t0, END, B = track(66, 32, 871)
    surf(S, 0, END, 1.0, 0.1, period=2 * bar, pan=0.3); lap(S, 0, END, 1.0, 0.03, pan=-0.4)
    bed_wind(S, 0, END, 1.0, vol=0.035, smooth=60, pan=-0.3); crickets(S, 0, END, 1.0, 0.012)
    for k in (7, 21): heron(S, B(k) + rnd(0, bar), 0.05)
    for k in range(1, 33):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.012)
    for k in range(2, 33, 5):
        if rnd() < 0.6: clacks(S, B(k) + rnd(0, 2 * bar), 0.025)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.022))
    # 5-8: the waves' tune, two phrases only, on a kalimba; 13-16: the flute, once
    waves(S, b, B(5), [P1, P3], lambda m, d, v: kalimba(m + 12, max(d * 0.6, 0.5), vol=v), 0.18)
    waves(S, b, B(13), [P4, P2], lambda m, d, v: flute(m + 12, d * 0.95, vol=v), 0.12)
    # 21-28: Mansehare's lights down the coast: its tune as a lullaby, far away, on a harp
    seq(S, [(m, d * 2) for m, d in ANS1 + ANS2], b, B(21), lambda m, d: harp(m + 12, max(d * 0.6, 0.8), vol=0.08), pan=0.7)
    finish(S, 'Beach_Night', t0, END, gain=0.91)

ALL = dict(day=day, night=night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
