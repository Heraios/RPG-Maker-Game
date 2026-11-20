# Up at the snow line: the crater lake (Crater_Lake, Crater_Lake_Night) and the peak at night (Snowy_Peak_Night).
#
# The crater lake is the Red Bowl itself: every Red Bowl idol is a bowl of red stone filled with pure water, a model of
# a crater filled with water; this is the one the idols copy, the god's most sacred place. Its music grows out of the
# save jingle (the sound of every Red Bowl idol): a wooden knock and the Island tune's last three notes, B A G. Here the
# knock is a slow heartbeat, as if the bowl were struck once and rings; the three notes grow into a whole slow piece on
# a wordless, genderless choir (the Red Bowl has no gender, nor do its priests) and glass bells with a long echo. And
# the island's tune reflected in the world's bowl: turned upside down, as a reflection is (B A G falls; its reflection,
# E F# G, rises).
#   Day (66 bpm): near-silence after the peak's wind: soft lapping, ice pinging across the lake, a drip echoing off the
#     crater walls, a Guardian Lizard moving slowly in the water. 1-4 the knock, the bowl ringing  5-8 the save's
#     closing grown, on the choir  9-12 its reflection, rising, on glass bells  13-20 the Island tune upside down, very
#     slow  21-28 both at once, the tune and its reflection  29-32 the knock; the three notes, exactly as at an idol
#   Night (54 bpm): stars doubled in the water: every bell answered by a blurred copy of itself, lower and softer.
#
# Snowy_Peak_Night (50 bpm): the Lady of the Wind asleep. The gale has dropped to a breath, the snow creaks, stars; her
#   theme hummed low and very slow by the wind choir, and her cold arc on a flute, barely there.
# Usage: python3 snow_line16.py [lake] [lake_night] [peak_night]
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import CALL1, ANS1, CALL2, ANS2
from wind_tune import W1, W2, W3, W4, ROOTS as WROOTS, CH as WCH
from ambience import bed_wind, gust, lap, drip, twinkle, rnd
from towns16 import track, finish, half
from cliffs16 import voice
R = None

# ------------------------------------------------------------------ the Red Bowl's music
G_MAJ = [55, 57, 59, 60, 62, 64, 66, 67, 69, 71, 72, 74, 76, 78, 79, 81, 83, 84, 86]
def mirror(ph, axis=67):
    """The phrase turned upside down in G major, step for step, around G: a reflection in the water."""
    a = G_MAJ.index(axis)
    return [(G_MAJ[2 * a - G_MAJ.index(m)] if m is not None else None, d) for m, d in ph]
BOWL = ANS1                                                       # B A G A B A G: the answer, closing as at an idol
REFLECT = mirror(ANS1)                                            # E F# G F# E F# G: its reflection, rising
SAVE = ANS1[-3:]                                                  # B A G: the save jingle's three notes

def knock(S, t, vol=0.3):                                         # the bowl struck: a wooden knock (the save jingle's)
    S.add(t, drum('log', vol), pan=-0.1)

def bowl(S, t, m=43, vol=0.05, dur=7.0):
    """The bowl ringing: a deep singing-bowl tone, its partials slowly beating."""
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * r * tt + rnd(0, 6)) * (1 + 0.3 * np.sin(2 * np.pi * bt * tt)) * np.exp(-tt / dc)
            for r, a, bt, dc in ((1, 1, 0.7, 3.5), (2.71, 0.5, 1.3, 2.5), (5.1, 0.25, 2.1, 1.5), (8.2, 0.1, 3, 0.8)))
    S.add(t, x * np.clip(tt / 0.02, 0, 1) * vol, pan=rnd(-0.2, 0.2))

def ice(S, t, vol=0.03):                                          # lake ice pinging: a falling, singing "pew"
    n = int(0.6 * SR); tt = np.arange(n) / SR
    f = 700 + 2600 * np.exp(-tt / 0.07)
    S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.18) * vol, pan=rnd(-0.9, 0.9))

def lizard_swim(S, t, vol=0.04):                                  # a Guardian Lizard moving slowly through the water
    n = int(rnd(2.5, 4) * SR); tt = np.arange(n) / SR
    x = lowpass(np.random.uniform(-1, 1, n), 500) * 6 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * tt)) ** 2
    S.add(t, x * np.sin(np.pi * tt / (n / SR)) * vol, pan=rnd(-0.6, 0.6))

def glass(S, t, m, d, vol=0.07, twin=False):
    """A glass bell with a long ring; with twin, its reflection: the same note a little later, lower and blurred."""
    pan = rnd(-0.5, 0.5)
    S.add(t, bell(m, max(d, 2.5), vol=vol), pan=pan)
    if twin:
        x = bell(m - 12, max(d, 2.5) * 1.2, vol=vol * 0.55)
        S.add(t + 0.35, lowpass(x, 1500) if isinstance(x, np.ndarray) else x, pan=-pan)   # (BeepBox: no blur)

def still_water(S, END, vol=1.0):
    lap(S, 0, END, 1.0, 0.03 * vol, pan=0.2)
    bed_wind(S, 0, END, 1.0, vol=0.025 * vol, smooth=80, pan=-0.3)          # the wind, only up on the rim

def lake():
    S, b, bar, t0, END, B = track(66, 32, 2301)
    still_water(S, END)
    for k in range(1, 33):
        if rnd() < 0.5: ice(S, B(k) + rnd(0, bar), rnd(0.02, 0.035))
        if rnd() < 0.3: drip(S, B(k) + rnd(0, bar), 0.03)
    for k in (6, 17, 26): lizard_swim(S, B(k) + rnd(0, bar))
    for k in range(1, 33, 2): knock(S, B(k), 0.26)                          # the heartbeat: the bowl struck
    for k in (1, 13, 29): bowl(S, B(k), 43, 0.05)
    S.add(0, strings(43, END + 2 * b, vol=0.016)); S.add(0, strings(50, END + 2 * b, vol=0.012))   # G and D, still
    # 5-8: the save's closing grown: the choir, slowly
    seq(S, half(BOWL), b, B(5), lambda m, d: choir(m, d * 1.02, vol=0.1), pan=-0.1)
    seq(S, half(BOWL), b, B(5), lambda m, d: kalimba(m + 12, max(d * 0.4, 0.8), vol=0.08), pan=0.3)
    # 9-12: its reflection, rising, on glass bells
    t = B(9)
    for m, d in half(REFLECT): glass(S, t, m + 12, d * b, 0.07); t += d * b
    S.add(B(9), choir(55, 4 * bar, vol=0.04))
    # 13-20: the Island tune upside down, very slow, on bells, the choir holding under it
    t = B(13)
    for m, d in half(mirror(CALL1 + ANS1)): glass(S, t, m + 12, d * b, 0.06); t += d * b
    for k, (r, n) in enumerate(((55, 2), (52, 2), (48, 2), (55, 2))): S.add(B(13 + 2 * k), choir(r, n * bar, vol=0.035))
    # 21-28: both at once: the answer on the choir, its reflection on the bells
    seq(S, half(BOWL) + half(BOWL), b, B(21), lambda m, d: choir(m, d * 1.02, vol=0.1), pan=-0.15)
    t = B(21)
    for m, d in half(REFLECT) + half(REFLECT): glass(S, t, m + 12, d * b, 0.055); t += d * b
    # 29-32: the knock, and the three notes, exactly as at an idol
    seq(S, SAVE, b, B(30), lambda m, d: choir(m - 12, d * 0.97, vol=0.07))
    seq(S, SAVE, b, B(30), lambda m, d: kalimba(m + 12, max(d, 0.5), vol=0.16), pan=0.2)
    S.add(B(31) + b, bell(91, 1.5, vol=0.06), pan=0.3)
    finish(S, 'Crater_Lake', t0, END, gain=0.78, echo=0.4, fb=0.45, reverb=0.5, cutoff=8000)

def lake_night():
    S, b, bar, t0, END, B = track(54, 24, 2311)
    still_water(S, END, 0.8)
    for k in range(1, 25):
        if rnd() < 0.35: ice(S, B(k) + rnd(0, bar), 0.02)
        for j in range(2):                                                   # stars, and their doubles in the water
            if rnd() < 0.5:
                at = B(k) + rnd(0, bar); twinkle(S, at, 0.016); twinkle(S, at + 0.3, 0.007)
    for k in range(1, 25, 4): knock(S, B(k), 0.18)
    for k in (1, 13): bowl(S, B(k), 43, 0.04, 9)
    S.add(0, strings(43, END + 2 * b, vol=0.014))
    # 3-6: the reflection, rising, on doubled bells
    t = B(3)
    for m, d in half(REFLECT): glass(S, t, m + 12, d * b, 0.06, twin=True); t += d * b
    # 7-14: the answer hummed low by the choir; the bells' doubles drifting over it
    seq(S, half(BOWL), b, B(7), lambda m, d: choir(m - 12, d * 1.02, vol=0.08), pan=0.1)
    seq(S, half(mirror(CALL1)), b, B(11), lambda m, d: choir(m - 12, d * 1.02, vol=0.07), pan=-0.1)
    for k in range(8): glass(S, B(7 + k) + 2 * b, (79, 76, 74, 71, 74, 76, 78, 79)[k] + 12, 2 * b, 0.03, twin=True)
    # 15-20: the reflection again, both at once with the answer
    t = B(15)
    for m, d in half(REFLECT): glass(S, t, m + 12, d * b, 0.055, twin=True); t += d * b
    seq(S, half(BOWL), b, B(15), lambda m, d: kalimba(m, max(d * 0.4, 0.8), vol=0.07), pan=0.3)
    S.add(B(15), choir(55, 6 * bar, vol=0.035))
    # 21-24: the three notes, softly, doubled
    t = B(22)
    for m, d in SAVE: glass(S, t, m + 12, d * b, 0.06, twin=True); t += d * b
    finish(S, 'Crater_Lake_Night', t0, END, gain=0.5, echo=0.42, fb=0.5, reverb=0.55, cutoff=7000)

# ------------------------------------------------------------------ the peak at night
def creak(S, t, vol=0.03):                                         # snow settling under its own weight
    n = int(0.8 * SR); tt = np.arange(n) / SR; f = 120 + 40 * tt
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.sin(2 * np.pi * 7 * tt) > 0.2) * np.sin(np.pi * tt / 0.8)
    S.add(t, lowpass(x, 700) * vol, pan=rnd(-0.6, 0.6))

def peak_night():
    S, b, bar, t0, END, B = track(50, 24, 2321)
    bed_wind(S, 0, END, 1.0, vol=0.06, smooth=40, pan=-0.2)                  # the gale dropped to a breath
    bed_wind(S, 0, END, 1.0, vol=0.04, smooth=120, pan=0.3)
    for k in range(1, 24, 3): gust(S, B(k) + rnd(0, 2 * bar), rnd(4, 7), 0.035, smooth=20, whistle=rnd(900, 1400))
    for k in range(1, 25):
        for j in range(2):
            if rnd() < 0.55: twinkle(S, B(k) + rnd(0, bar), 0.018)
        if rnd() < 0.3: creak(S, B(k) + rnd(0, bar))
    for m in (40, 47): S.add(0, strings(m, END + 2 * b, vol=0.018))          # E and B, held, frozen
    # 3-14: her falling and rising gust, hummed low and very slow: asleep
    seq(S, half(W1 + W2), b, B(3), lambda m, d: voice(m - 12, d * 1.05, 0.07), pan=0.1)
    for k, r in enumerate(WROOTS[:6]):
        for m in WCH[r]: S.add(B(3 + 2 * k), voice(m - 12, 2 * bar * 0.98, 0.012))
    # 15-20: her cold arc and her sigh on a flute, barely there; glass bells like frost
    seq(S, W3 + W4, b, B(15), lambda m, d: flute(m, d * 0.95, vol=0.06), pan=-0.3)
    for k in range(6): S.add(B(15 + k) + 2 * b, bell((88, 85, 83, 81, 79, 76)[k], 2.5, vol=0.03), pan=0.4)
    for k, r in enumerate(WROOTS[6:]):
        for m in WCH[r]: S.add(B(15 + k), voice(m - 12, bar * 0.98, 0.012))
    # 21-24: the wind, and one breath of her falling gust, far off
    seq(S, W1[:3], b, B(22), lambda m, d: voice(m, d * 1.05, 0.035), pan=0.5)
    for m in (52, 59, 64): S.add(B(21), voice(m - 12, 4 * bar * 0.98, 0.016))
    for k in range(4): S.add(B(21 + k) + b, bell((76, 71, 74, 71)[k] + 12, 2.5, vol=0.025), pan=-0.4)
    finish(S, 'Snowy_Peak_Night', t0, END, gain=0.5, echo=0.38, fb=0.45, reverb=0.5, cutoff=8000)

ALL = dict(lake=lake, lake_night=lake_night, peak_night=peak_night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
