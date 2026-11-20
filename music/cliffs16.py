# The dry-side sea cliffs: the open cliffs between places, where the orchil gatherers hang on ropes over the sea.
# Sea_Cliffs (day) and Sea_Cliffs_Night. Corajakeu's brave little tune (the Island tune) carries it, opened out and
# called between the rope teams across the cliff face; and every so often a great gust breaks in and the Lady of the
# Wind's theme blows through on her wind choir (she rules the coasts), never whole, then the climbers take the tune
# back. The two share nearly every note (G major and E dorian), so they hand over cleanly.
# Day (84 bpm, 4/4):
#   1-4 the cliffs, a gust: her falling gust, far off   5-12 the tune plucked high, toms like boots on rock
#   13-15 a gust: her rising gust   16-23 the rope teams calling (horn above, flute below)
#   24-29 the big gust: her high cold arc and her sigh, strings under   30-37 the tune, braver, her gust under it
# Night (66 bpm): the wind dies down and the surf takes over; shearwaters, stars, a watch fire on a ledge; the tune as
#   a lullaby on the harp, and her theme hummed low between, half asleep.
# Usage: python3 cliffs16.py [day] [night]
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS
from wind_tune import W1, W2, W3, W4, ROOTS as WROOTS, CH as WCH
from ambience import bed_wind, gust, surf, gull, hearth, twinkle, crickets, rnd
from towns16 import track, finish, strum, bassline, half
from villages16 import ropes, shearwater, boom
R = None

def voice(m, dur, vol=0.1):
    """The Lady of the Wind's choir (as on Snowy_Peak): soft voices whose pitch bends and swells like the wind."""
    probe = choir(m, 0.01)
    if not isinstance(probe, np.ndarray): return choir(m, dur, vol=vol)     # (BeepBox)
    n = int(dur * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    for dt in (-0.004, 0.004):
        ph0 = rnd(0, 6.3)
        bend = 1 + 0.009 * np.sin(2 * np.pi * 0.31 * tt + ph0) + 0.005 * np.sin(2 * np.pi * 0.83 * tt + 2 * ph0)
        ph = 2 * np.pi * np.cumsum(hz(m) * (1 + dt) * bend) / SR
        out += sum(a * np.sin(ph * k) for k, a in ((1, 1.0), (2, 0.35), (3, 0.2), (4, 0.06)))
    breath = lowpass(np.random.uniform(-1, 1, n), 2500) * 0.15
    swell = 0.75 + 0.25 * np.sin(2 * np.pi * tt / rnd(3.5, 6) + rnd(0, 6.3))
    return (out / 2 + breath) * swell * adsr(n, a=min(0.6, dur / 3), d=0.2, s=0.9, r=min(0.9, dur / 3)) * vol

def wind_chords(S, t, bar, roots, vol=0.03):
    for k, r in enumerate(roots):
        for m in WCH[r]: S.add(t + k * bar, strings(m, bar * 0.98, vol=vol), pan=rnd(-0.3, 0.3))

def big_gust(S, t, dur, vol=0.12):                                 # the gust she rides in on
    gust(S, t - 0.8, dur + 1.6, vol, smooth=10, whistle=rnd(700, 1100))

def sea_wind(S, END, wind=1.0, sea=1.0):
    bed_wind(S, 0, END, 1.0, vol=0.12 * wind, smooth=16, pan=-0.2)
    for k in range(0, int(END / 9)): gust(S, k * 9 + rnd(0, 6), rnd(3, 6), 0.07 * wind, smooth=14, whistle=rnd(600, 1000))
    surf(S, 0, END, 1.0, 0.1 * sea, period=9.0, pan=0.3)
    at = 1.5
    while at < END - 2: boom(S, at, rnd(0.2, 0.3) * sea); at += rnd(5, 9)

def toms(S, t, bar, bars, b, vol=1.0):
    for k in range(bars): S.add(t + k * bar, drum('tom', 0.11 * vol), pan=-0.2); S.add(t + k * bar + 2 * b, drum('tom', 0.09 * vol), pan=0.2)

def day():
    S, b, bar, t0, END, B = track(84, 37, 2101)
    sea_wind(S, END)
    for k in range(1, 38, 3):
        if rnd() < 0.85: gull(S, B(k) + rnd(0, 2 * bar), 0.05, calls=np.random.randint(1, 4))
        if rnd() < 0.6: ropes(S, B(k) + rnd(0, 2 * bar))
    # 1-4: the cliffs; a gust, and her falling gust far off
    big_gust(S, B(2), 3 * bar, 0.1)
    seq(S, W1, b, B(2), lambda m, d: voice(m, d * 1.05, 0.07), pan=0.4)
    wind_chords(S, B(2), bar, WROOTS[0:3], 0.02)
    # 5-12: the brave little tune, plucked high, opened out
    seq(S, TUNE, b, B(5), lambda m, d: harp(m + 24, max(d * 0.6, 0.4), vol=0.22), pan=-0.15)
    seq(S, TUNE, b, B(5), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.3), vol=0.14), pan=0.35)
    strum(S, B(5), bar, ROOTS, 0.03); bassline(S, B(5), bar, ROOTS, 0.18); toms(S, B(5), bar, 8, b)
    # 13-15: a gust breaks in: her rising gust
    big_gust(S, B(13), 3 * bar)
    seq(S, W2, b, B(13), lambda m, d: voice(m, d * 1.05, 0.1), pan=-0.1)
    wind_chords(S, B(13), bar, WROOTS[3:6]); bassline(S, B(13), bar, WROOTS[3:6], 0.14)
    # 16-23: the rope teams call across the cliff face: a horn above, a flute answering from below
    t = B(16)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: horn(m, d * 0.9, vol=0.15), pan=-0.6)
        t = seq(S, ans, b, t, lambda m, d: flute(m + 12, d * 0.9, vol=0.17), pan=0.6)
    strum(S, B(16), bar, ROOTS, 0.03); bassline(S, B(16), bar, ROOTS, 0.17)
    # 24-29: the big gust: her high cold arc (the C sharp), and her sigh
    big_gust(S, B(24), 5 * bar, 0.14)
    seq(S, W3 + W4, b, B(24), lambda m, d: voice(m, d * 1.05, 0.11), pan=0.1)
    seq(S, W3, b, B(24), lambda m, d: flute(m + 12, d * 0.95, vol=0.07), pan=-0.35)
    wind_chords(S, B(24), bar, WROOTS[6:12], 0.035); bassline(S, B(24), bar, WROOTS[6:12], 0.15)
    # 30-37: the tune, braver: harp and strings, toms; her falling gust drifting under it
    seq(S, TUNE, b, B(30), lambda m, d: harp(m + 24, max(d * 0.6, 0.4), vol=0.22), pan=-0.15)
    seq(S, TUNE, b, B(30), lambda m, d: strings(m, d * 0.95, vol=0.07), pan=0.25)
    seq(S, W1, b, B(34), lambda m, d: voice(m - 12, d * 1.05, 0.05), pan=0.5)
    strum(S, B(30), bar, ROOTS, 0.03); bassline(S, B(30), bar, ROOTS, 0.19); toms(S, B(30), bar, 8, b, 1.1)
    finish(S, 'Sea_Cliffs', t0, END, gain=0.68)

def night():
    S, b, bar, t0, END, B = track(66, 32, 2111)
    sea_wind(S, END, wind=0.5, sea=1.25)
    crickets(S, 0, END, 1.0, 0.006)
    hearth(S, 0, END, 1.0, 0.05, pan=-0.55)                          # a watch fire on a ledge
    for k in range(1, 33, 3):
        if rnd() < 0.8: shearwater(S, B(k) + rnd(0, 2 * bar), rnd(0.03, 0.045))
    for k in range(1, 33):
        if rnd() < 0.45: twinkle(S, B(k) + rnd(0, bar), 0.012)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.02))
    # 3-10: the tune as a lullaby, the call and its answer, on the harp
    seq(S, half(CALL1 + ANS1), b, B(3), lambda m, d: harp(m + 24, max(d * 0.4, 0.6), vol=0.17), pan=-0.1)
    lull = [43, 43, 48, 48, 40, 40, 43, 43]
    strum(S, B(3), bar, lull, 0.022); bassline(S, B(3), bar, lull, 0.13)
    # 11-16: her falling and rising gust, hummed low, half asleep
    seq(S, W1 + W2, b, B(11), lambda m, d: voice(m - 12, d * 1.05, 0.08), pan=0.2)
    wind_chords(S, B(11), bar, WROOTS[0:6], 0.02)
    # 17-24: the tune's second half on the kalimba
    seq(S, half(CALL2 + ANS2), b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.15), pan=0.2)
    lull2 = [43, 43, 38, 38, 41, 41, 43, 43]
    strum(S, B(17), bar, lull2, 0.022); bassline(S, B(17), bar, lull2, 0.13)
    # 25-30: her cold arc and sigh, very low and far, the flute barely there
    seq(S, W3 + W4, b, B(25), lambda m, d: voice(m - 12, d * 1.05, 0.07), pan=-0.2)
    seq(S, W3, b, B(25), lambda m, d: flute(m, d * 0.95, vol=0.04), pan=0.4)
    wind_chords(S, B(25), bar, WROOTS[6:12], 0.018)
    finish(S, 'Sea_Cliffs_Night', t0, END, gain=0.7, echo=0.3, fb=0.36, reverb=0.34)

ALL = dict(day=day, night=night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
