# The volcanic desert (the arid highlands on the rain-shadow side): Volcanic_Desert and Volcanic_Desert_Night.
# Heat, emptiness, something huge and old asleep. Two queens share this ground:
#   the Lady of the Sun (her own leitmotif, new: SUN below), proud and harsh, on low brass and a deep horn. A minor with
#       the "Phrygian dominant" bite (B flat up to C sharp): glare off rock. It keeps reaching up and being dragged back
#       down, and a chain clanks at the end of every phrase: Juda's chains still hold her in her grotto.
#   Tou, under the ground: her minuet (E minor, the fifth of A) seeping up from the buried palace, muffled through stone.
# Day (56 bpm): gritty dry wind, heat shimmer (tiny glassy notes flickering), scree sliding, a vulture's hiss, a lizard
#   scrabbling; a drone of A and E.
#   1-4 the desert   5-12 the Lady of the Sun   13-18 Tou's minuet through the stone   19-26 the Lady again, higher,
#   a flute above on her glare   27-32 the minuet's second half, and the desert
# Night (48 bpm): cold and starry, the wind dropped, a few crickets (it's too dry for many). The Lady is gone (she is the
#   summer and the sun), but her chain still clinks now and then, far off; and the Bull of Heaven, chained with her,
#   bellows in the distance. Tou's minuet slow on glass bells, like the stars.
# Usage: python3 desert16.py [day] [night]
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import bed_wind, gust, crickets, twinkle, Muffle, rnd
from towns16 import track, finish
R = None

# ------------------------------------------------------------------ the Lady of the Sun's leitmotif (8 bars of 4)
SUN1 = [(57, 1.5), (64, .5), (69, 2), (70, 1), (73, 1), (74, 2)]              # A E A | Bb C# D: she rises
SUN2 = [(76, 1.5), (77, .5), (76, 1), (73, 1), (70, 1), (69, 1), (64, 2)]     # E F E C# | Bb A E: and is dragged back
SUN3 = [(69, 1), (73, 1), (76, 1), (79, 3), (77, 1), (76, 1)]                 # A C# E G: higher, the glare
SUN4 = [(77, 1), (76, 1), (74, 1), (73, 1), (70, 1), (69, 1), (57, 2)]        # F E D C# Bb A, down to the low A
SUN = SUN1 + SUN2 + SUN3 + SUN4
SROOTS = [45, 46, 45, 45, 45, 'gm', 38, 45]                                   # A Bb | A A | A Gm | Dm A
SCH = {45: (57, 61, 64), 46: (58, 62, 65), 'gm': (55, 58, 62), 38: (50, 53, 57), 40: (52, 55, 59), 47: (59, 62, 66)}
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]   # Tou's minuet
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
SCALE = [57, 58, 61, 62, 64, 65, 67]                                          # A Bb C# D E F G

# ------------------------------------------------------------------ the desert's sounds
def chain(S, t, vol=0.06, links=4):
    """A heavy chain shifting: a few metal links clinking against each other, the last one dragging."""
    pan = rnd(-0.5, 0.5)
    for i in range(links):
        n = int(0.35 * SR); tt = np.arange(n) / SR; f = rnd(1300, 2100)
        x = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / d) for r, a, d in ((1, 1, 0.08), (2.43, 0.6, 0.05), (3.9, 0.4, 0.03), (5.3, 0.25, 0.02)))
        x += np.random.uniform(-1, 1, n) * np.exp(-tt / 0.004) * 0.6
        S.add(t + i * rnd(0.06, 0.14), x * vol * (1 - 0.15 * i), pan=pan)
    n = int(0.5 * SR); x = lowpass(np.random.uniform(-1, 1, n), 1800) * np.sin(np.pi * np.arange(n) / n)
    S.add(t + links * 0.1, x * vol * 0.5, pan=pan)

def shimmer(S, start, end, vol=0.012, rate=1.5):
    """Heat over the rock: tiny glassy notes from her scale, flickering in and out, never quite still in pitch."""
    at = start + rnd(0, 1)
    while at < end - 1.5:
        m = SCALE[np.random.randint(len(SCALE))] + 36; n = int(rnd(0.6, 1.4) * SR); tt = np.arange(n) / SR
        f = hz(m) * (1 + 0.004 * np.sin(2 * np.pi * rnd(5, 9) * tt))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / (n / SR)) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * rnd(9, 14) * tt))
        S.add(at, x * vol, pan=rnd(-0.9, 0.9)); at += rnd(0.3, 1.2) / rate

def scree(S, t, vol=0.05):                                         # loose stones sliding down a slope
    pan = rnd(-0.8, 0.8); at = t
    for i in range(np.random.randint(8, 18)):
        n = int(0.05 * SR); tt = np.arange(n) / SR
        S.add(at, lowpass(np.random.uniform(-1, 1, n), rnd(1500, 3500)) * np.exp(-tt / 0.01) * vol * rnd(0.4, 1), pan=pan)
        at += rnd(0.02, 0.12) * (1 + i * 0.08)

def vulture(S, t, vol=0.03):                                       # an Egyptian vulture: a dry hiss and a low croak, far up
    n = int(0.7 * SR); tt = np.arange(n) / SR
    x = np.random.uniform(-1, 1, n) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * tt)); x = x - np.convolve(x, np.ones(8) / 8, 'same')
    S.add(t, x * np.sin(np.pi * tt / 0.7) * vol, pan=rnd(-0.7, 0.7))

def lizard(S, t, vol=0.04):                                        # a giant lizard scrabbling over gravel, then still
    pan = rnd(-0.7, 0.7)
    for i in range(np.random.randint(6, 12)):
        n = int(0.03 * SR); S.add(t + i * rnd(0.04, 0.07), lowpass(np.random.uniform(-1, 1, n), 2500) * np.exp(-np.arange(n) / SR / 0.006) * vol, pan=pan)

def bellow(S, t, vol=0.07):
    """The Bull of Heaven, far off: a long, low bellow rising and sinking, heard across miles of desert."""
    n = int(3.0 * SR); tt = np.arange(n) / SR
    f = 70 + 30 * np.sin(np.pi * tt / 3.0) ** 1.5
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(a * np.sin(k * ph) for k, a in ((1, 1), (2, 0.7), (3, 0.5), (4, 0.3), (5, 0.2)))
    x = lowpass(x + np.random.uniform(-0.3, 0.3, n), 500)
    S.add(t, x * np.sin(np.pi * tt / 3.0) ** 0.7 * vol, pan=rnd(-0.6, 0.6))

def dry_wind(S, END, vol=1.0):
    bed_wind(S, 0, END, 1.0, vol=0.1 * vol, smooth=10, pan=-0.2)                  # gritty: a rougher, hissier wind
    bed_wind(S, 0, END, 1.0, vol=0.05 * vol, smooth=60, pan=0.3)
    for k in range(int(END / 10)): gust(S, k * 10 + rnd(0, 7), rnd(3, 6), 0.06 * vol, smooth=8)

def chords(S, t, bar, roots, inst=strings, vol=0.025):
    for k, r in enumerate(roots):
        for m in SCH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol), pan=rnd(-0.3, 0.3))

def sun(S, t, b, bar, high=False, vol=1.0):
    """Her theme: low brass and a deep horn, the strings' chords under; a timpani on each bar, a chain at each phrase end."""
    seq(S, SUN, b, t, lambda m, d: brass(m - 12, d * 0.95, vol=0.16 * vol), pan=-0.15)
    seq(S, SUN, b, t, lambda m, d: horn(m, d * 0.95, vol=(0.16 if high else 0.12) * vol), pan=0.15)
    if high:
        seq(S, SUN3, b, t + 4 * bar, lambda m, d: flute(m + 12, d * 0.9, vol=0.1 * vol), pan=0.4)    # the glare, above
        seq(S, SUN1, b, t, lambda m, d: strings(m + 12, d * 0.95, vol=0.05 * vol), pan=-0.3)
    chords(S, t, bar, SROOTS, vol=0.022 * vol)
    for k, r in enumerate(SROOTS):
        root = SCH[r][0] - 24
        S.add(t + k * bar, timpani(root if root >= 40 else root + 12, 0.16 * vol))
        S.add(t + k * bar, pluckbass(root, bar * 0.6, vol=0.14 * vol))
    for k in (1, 3, 5, 7): chain(S, t + k * bar + 3 * b, 0.05 * vol)

# ------------------------------------------------------------------ the tracks
def day():
    S, b, bar, t0, END, B = track(56, 32, 2201)
    dry_wind(S, END, 1.6); shimmer(S, 0, END, 0.02, 2.0)
    for k in range(1, 33, 3):
        if rnd() < 0.8: scree(S, B(k) + rnd(0, 2 * bar), 0.07)
        if rnd() < 0.6: lizard(S, B(k) + rnd(0, 2 * bar), 0.055)
    for k in (3, 11, 20, 28): vulture(S, B(k) + rnd(0, bar), 0.045)
    for m in (33, 40): S.add(0, strings(m + 12, END + 2 * b, vol=0.02))                     # A and E, held, the heat
    # 1-4: the desert; her first rise, far off on a horn
    seq(S, SUN1, b, B(3), lambda m, d: horn(m - 12, d * 0.95, vol=0.07), pan=0.5)
    # 5-12: the Lady of the Sun
    sun(S, B(5), b, bar)
    # 13-18: Tou's minuet through the stone: muffled marimba and bells, an E drone under the ground
    under = Muffle(S, 700, 0.9)
    seq(under, T1, b, B(13), lambda m, d: marimba(m - 12, max(d * 0.8, 0.5), vol=0.32), pan=0.0)
    seq(under, T1, b, B(13), lambda m, d: bell(m, max(d * 0.6, 0.5), vol=0.08), pan=0.2)
    S.add(B(13), strings(40, 6 * bar, vol=0.03)); S.add(B(13), menchoir(52, 6 * bar, vol=0.03))
    seq(under, T1[:5], b, B(16), lambda m, d: marimba(m - 24, max(d * 0.8, 0.5), vol=0.24), pan=-0.2)   # an echo, lower
    # 19-26: the Lady again, higher, a flute on her glare
    sun(S, B(19), b, bar, high=True)
    # 27-32: the minuet's second half, and the desert
    seq(under, T2, b, B(27), lambda m, d: marimba(m - 12, max(d * 0.8, 0.5), vol=0.3), pan=0.0)
    S.add(B(27), strings(40, 4 * bar, vol=0.028))
    seq(S, SUN4, b, B(30), lambda m, d: horn(m - 12, d * 0.95, vol=0.06), pan=0.5)              # dragged down, far off
    chain(S, B(31) + 2 * b, 0.04)
    finish(S, 'Volcanic_Desert', t0, END, gain=0.75, reverb=0.3)

def night():
    S, b, bar, t0, END, B = track(48, 24, 2211)
    bed_wind(S, 0, END, 1.0, vol=0.08, smooth=40, pan=-0.2)                                # the wind dropped
    crickets(S, 0, END, 1.0, 0.006)
    for k in range(1, 25):
        for j in range(2):
            if rnd() < 0.6: twinkle(S, B(k) + rnd(0, bar), 0.02)
    for k in (4, 13, 21): chain(S, B(k) + rnd(0, bar), 0.022, links=3)                     # her chain, far off
    for k in (7, 18): bellow(S, B(k) + rnd(0, bar))                                         # the Bull of Heaven
    for k in (2, 15): lizard(S, B(k) + rnd(0, bar), 0.025)
    for m in (40, 47): S.add(0, strings(m, END + 2 * b, vol=0.022))                         # E and B: Tou's ground
    # 3-8: Tou's minuet, slow, on glass bells like the stars
    seq(S, T1, b, B(3), lambda m, d: bell(m, max(d * 0.9, 1.2), vol=0.07), pan=-0.2)
    seq(S, T1, b, B(3), lambda m, d: kalimba(m - 12, max(d * 0.6, 0.6), vol=0.12), pan=0.25)
    # 9-14: the desert; a deep, cold choir
    S.add(B(9), menchoir(40, 6 * bar, vol=0.045)); S.add(B(9), menchoir(47, 6 * bar, vol=0.035))
    for k in range(6):                                                                    # a harp, slowly, like counting stars
        for j, m in enumerate((64, 71, 76, 79) if k % 2 == 0 else (62, 66, 71, 74)): S.add(B(9 + k) + j * b, harp(m, 2 * b, vol=0.06), pan=-0.4 + j * 0.25)
    seq(S, T1[:5], b, B(11), lambda m, d: flute(m - 12, d * 0.9, vol=0.06), pan=0.3)
    # 15-20: the minuet's second half, the bells answered by a low flute
    seq(S, T2, b, B(15), lambda m, d: bell(m, max(d * 0.9, 1.2), vol=0.06), pan=0.2)
    seq(S, T2, b, B(15) + b, lambda m, d: flute(m - 12, d * 0.9, vol=0.06), pan=-0.3)
    # 21-24: her first rise, once, very far: she's asleep, not gone
    seq(S, SUN1, b, B(21), lambda m, d: horn(m - 12, d * 0.95, vol=0.07), pan=0.5)
    for k in range(4): S.add(B(21 + k), bell((76, 74, 76, 71)[k], 2.5, vol=0.04), pan=-0.3)
    finish(S, 'Volcanic_Desert_Night', t0, END, gain=0.7, echo=0.3, fb=0.36, reverb=0.4)

ALL = dict(day=day, night=night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
