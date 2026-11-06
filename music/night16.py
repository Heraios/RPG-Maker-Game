# Night versions of the towns and the wilds. The same place after dark: slower, quieter, more ambience than
# music. In the towns, the day's crowd thins to a few voices, the telegraph's night operator still taps the
# place's name, and the tune turns into a lullaby. In the wilds, the day's birds give way to owls, frogs,
# crickets and a nightjar, and the tune comes in pieces.
# Usage: python3 night16.py zonfahare mansehare aguerekeu laurel grasslands marsh   (or no names for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
import marsh_tune as marsh
from ambience import *
R = None

def track(bpm, bars, seed, intro=1, beats=4):
    np.random.seed(seed)
    b = 60 / bpm; bar = beats * b
    S = Stereo((intro + bars) * bar)
    t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0, **master):
    kw = dict(echo=0.3, fb=0.36, reverb=0.34, cutoff=7500); kw.update(master)
    L, Rr = snes_master(S.L, S.R, **kw)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def chords(S, t, bar, roots, ch=CH, inst=strings, vol=0.03, bars_each=1):
    for k, r in enumerate(roots):
        for m in ch[r]: S.add(t + k * bars_each * bar, inst(m, bars_each * bar * 0.98, vol=vol))

def lowbass(S, t, bar, roots, vol=0.2, bars_each=1):
    for k, r in enumerate(roots): S.add(t + k * bars_each * bar, pluckbass(r - 12 if r > 40 else r, bars_each * bar * 0.9, vol=vol))

def strum(S, t, b, roots, ch=CH, vol=0.05, beats=4):                # a harp, slowly, up and back
    for k, r in enumerate(roots):
        tri = ch[r]
        for j in range(4): S.add(t + k * beats * b + j * b * beats / 4, harp(tri[(0, 1, 2, 1)[j]] + 12, b * 1.5, vol=vol), pan=(-0.4, 0.4)[j % 2])

half = lambda ph: [(m, d * 2) for m, d in ph]
H1 = [43, 43, 48, 48, 40, 40, 43, 43]                                 # the chords under CALL1 + ANS1, at half speed
H2 = [43, 43, 38, 38, 41, 41, 43, 43]                                 # ... and under CALL2 + ANS2

# ------------------------------------------------------------------ Zonfahare at night
def zonfahare():
    """The main town asleep: crickets, a few voices still talking, a goat bell, a dog far off, an owl on the roofs.
    The night operator taps ZONFAHARE. The Island tune as a lullaby: a kalimba at half speed, then a flute from
    an open window, then the whole tune on a harp, with a soft log drum like the town's slow heartbeat."""
    S, b, bar, t0, END, B = track(72, 32, 701)
    crickets(S, 0, END, 1.0, 0.012); bed_wind(S, 0, END, 1.0, vol=0.025, smooth=60)
    crowd(S, 0, END, 1.0, 0.012, pan=0.5)
    for k in (3, 14, 27): goatbell(S, B(k) + rnd(0, bar), 0.025)
    for k in (9, 22): dog(S, B(k) + rnd(0, bar), 0.035)
    for k in (6, 19, 30): owl(S, B(k) + rnd(0, bar), 0.04)
    for at in (0.2, B(13), B(23) + 2 * b): telegraph(S, at, 'ZONFAHARE', b / 3, 0.11, pan=-0.6)
    # 1-8: the tune's first half, slow, on a kalimba
    seq(S, half(CALL1 + ANS1), b, B(1), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.24), pan=0.15)
    chords(S, B(1), bar, H1, vol=0.03); lowbass(S, B(1), bar, H1)
    # 9-16: from an open window, a flute plays the second half; the harp answers
    seq(S, half(CALL2 + ANS2), b, B(9), lambda m, d: flute(m + 12, d * 0.92, vol=0.2), pan=-0.35)
    strum(S, B(9), b, H2, vol=0.045); lowbass(S, B(9), bar, H2, 0.18)
    # 17-22: only the night; 23-32: the whole tune on a harp, the kalimba's harmony faint above, a slow log drum
    chords(S, B(17), bar, [43, 48, 40, 43, 43, 43], vol=0.022)
    seq(S, TUNE, b, B(23), lambda m, d: harp(m, max(d, 0.8), vol=0.22), pan=-0.1)
    seq(S, HARM, b, B(23), lambda m, d: kalimba(m + 12, max(d * 0.6, 0.4), vol=0.06), pan=0.5)
    chords(S, B(23), bar, ROOTS, vol=0.028); lowbass(S, B(23), bar, ROOTS, 0.2)
    for k in range(10): S.add(B(23 + k), drum('log', 0.07), pan=-0.3)
    finish(S, 'Zonfahare_Night', t0, END, gain=0.66)

# ------------------------------------------------------------------ Mansehare at night
def mansehare():
    """The shore town after dark: slow surf, boats knocking at their moorings, rigging chiming, a lantern on the dock.
    The pearl divers' slow tune on bells; a Seafarer on the dock plays the friendly fanfare to himself, homesick, and
    a kalimba from a house answers with the Island tune. The station taps MANSEHARE."""
    S, b, bar, t0, END, B = track(66, 32, 711)
    surf(S, 0, END, 1.0, 0.12, period=8.5, pan=0.4); lap(S, 0, END, 1.0, 0.035, pan=-0.4)
    crickets(S, 0, END, 1.0, 0.006)
    for k in range(1, 33, 3):
        if rnd() < 0.8: creak(S, B(k) + rnd(0, 2 * bar), 0.05)
        if rnd() < 0.5: clacks(S, B(k) + rnd(0, 2 * bar), 0.03)
    gull(S, B(18) + b, 0.03, calls=1)
    for at in (0.2, B(21)): telegraph(S, at, 'MANSEHARE', b / 3, 0.1, pan=-0.6)
    # 1-8: the divers' tune, slow, on bells, the kalimba a beat behind it like an echo off the water
    seq(S, half(ANS1 + ANS2), b, B(1), lambda m, d: bell(m + 12, max(d * 0.5, 0.8), vol=0.11), pan=-0.2)
    seq(S, half(ANS1 + ANS2), b, B(1) + 0.75 * b, lambda m, d: kalimba(m + 12, max(d * 0.4, 0.5), vol=0.1), pan=0.4)
    dive = [40, 40, 43, 43, 41, 41, 43, 43]
    chords(S, B(1), bar, dive, vol=0.035); lowbass(S, B(1), bar, dive, 0.2)
    # 9-16: a Seafarer on the dock, the friendly fanfare, slow and alone; a kalimba answers from a window
    FAN = [(55, 1), (62, 1), (55, .5), (57, .5), (59, 3), (R, 2)]
    for k, (t, ans) in enumerate(((B(9), ANS1), (B(13), ANS2))):
        seq(S, FAN, b, t, lambda m, d: flute(m, d * 0.92, vol=0.2), pan=0.55)
        seq(S, ans, b, t + 2 * bar, lambda m, d: kalimba(m + 12, max(d * 0.6, 0.5), vol=0.2), pan=-0.4)
    chords(S, B(9), bar, [43, 43, 40, 43, 43, 43, 41, 43], vol=0.028); lowbass(S, B(9), bar, [43, 43, 40, 43, 43, 43, 41, 43], 0.18)
    # 17-22: the sea; 23-32: the rowing song as a lullaby on a harp, the surf keeping its slow time
    chords(S, B(17), bar, [40, 43, 40, 43, 41, 43], vol=0.03)
    seq(S, TUNE, b, B(23), lambda m, d: harp(m, max(d, 0.8), vol=0.2), pan=-0.1)
    seq(S, CALL1 + [(R, 8)] + CALL2, b, B(23), lambda m, d: flute(m, d * 0.9, vol=0.1), pan=0.5)
    chords(S, B(23), bar, ROOTS, vol=0.028); lowbass(S, B(23), bar, ROOTS, 0.2)
    finish(S, 'Mansehare_Night', t0, END, gain=0.8)

# ------------------------------------------------------------------ Aguerekeu at night
def aguerekeu():
    """The stilt village at night: frogs in full chorus, water under the floors, a mosquito, a crane far off.
    Ana's night shift at the telegraph: she taps AGUEREKEU, and the other hand on the line taps back, a little
    clearer than by day (IRAS). The Island tune on a kalimba and the Marsh tune on a low reed pipe, as a lullaby."""
    S, b, bar, t0, END, B = track(70, 32, 721)
    ch = dict(CH); ch.update(marsh.CH)
    frogs(S, 0, END, 1.0, 0.03, count=7); lap(S, 0, END, 1.0, 0.035, pan=-0.3); crickets(S, 0, END, 1.0, 0.008)
    for k in range(1, 33, 3):
        if rnd() < 0.6: reeds(S, B(k) + rnd(0, 2 * bar), rnd(2, 4) * b, 0.025)
        if rnd() < 0.5: creak(S, B(k) + rnd(0, 2 * bar), 0.04)
    mosquito(S, B(7)); mosquito(S, B(26))
    crane(S, B(18) + b, 0.04, calls=2, pan=0.9); owl(S, B(29), 0.035)
    telegraph(S, 0.2, 'AGUEREKEU', b / 3, 0.12, pan=-0.6)
    telegraph(S, B(11), 'AGUEREKEU', b / 3, 0.1, pan=-0.6)
    telegraph(S, B(12) + 3 * b, 'IRAS', b / 3, 0.06, pan=0.7)           # the other hand on the line
    telegraph(S, B(25), 'AGUEREKEU', b / 3, 0.1, pan=-0.6)
    telegraph(S, B(27), 'IRAS', b / 3, 0.05, pan=0.7)
    # 1-8: the Island tune's first half, slow, on a kalimba
    seq(S, half(CALL1 + ANS1), b, B(1), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.22), pan=0.15)
    chords(S, B(1), bar, H1, ch=ch, vol=0.028); lowbass(S, B(1), bar, H1, 0.18)
    # 9-16: the Marsh tune, low, on the reed pipe, over a drone
    seq(S, marsh.MARSH, b, B(9), lambda m, d: flute(m, d * 0.95, vol=0.2), pan=-0.2)
    chords(S, B(9), bar, marsh.ROOTS, ch=ch, vol=0.025); lowbass(S, B(9), bar, marsh.ROOTS, 0.18)
    for m in (40, 47): S.add(B(9), organ(m, 8 * bar * 0.98, vol=0.02))
    # 17-22: the frogs; 23-32: both, the river and the sea: the Island tune on a harp, the Marsh tune under it
    COUNTER = marsh.M1 + marsh.M2 + marsh.M3 + [(65, 1), (62, 1), (60, 1), (62, 1), (62, 4)]
    seq(S, TUNE, b, B(23), lambda m, d: harp(m, max(d, 0.8), vol=0.2), pan=-0.15)
    seq(S, COUNTER, b, B(23), lambda m, d: flute(m, d * 0.95, vol=0.13), pan=0.35)
    chords(S, B(23), bar, ROOTS, ch=ch, vol=0.025); lowbass(S, B(23), bar, ROOTS, 0.18)
    finish(S, 'Aguerekeu_Night', t0, END, gain=0.66)

# ------------------------------------------------------------------ the laurel forest at night
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (82, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
F2 = [(86, .5), (84, .5), (82, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
GROW = [[(77, .5), (81, .5)], [(77, .5), (81, .5), (84, .5)], [(77, .5), (81, .5), (84, .5), (89, 1.5)]]
FCH = {41: (53, 57, 60), 46: (58, 62, 65), 48: (60, 64, 67), 47: (59, 63, 66)}
FR = [41, 46, 48, 41]

def snore_pig(S, t, vol=0.06):                                          # a pig (or the Lady) snoring: in, out
    for i, (d, f0) in enumerate(((0.9, 70), (0.7, 0))):
        n = int(d * SR); tt = np.arange(n) / SR
        rattle = (0.4 + 0.6 * (np.sin(2 * np.pi * 24 * tt) > 0)) if f0 else 0.35     # rattling in, airy out
        x = lowpass(rnd(-1, 1, n), 450 if f0 else 900) * 6 * rattle
        S.add(t + i * 1.1, x * np.sin(np.pi * tt / d) ** 2 * vol, pan=0.3)

def laurel():
    """The Lady's lowland forest after dark: the drizzle lighter, owls and frogs instead of the day's birds,
    crickets, pigs snoring, fireflies (tiny glints). Falmi's theme as a lullaby, slow on a kalimba and harp; the
    forest dreaming it on a choir; and in the dark, the Master of Deception's wrong key and a giggle."""
    S, b, bar, t0, END, B = track(66, 48, 731)
    n = int(END * SR); x = rnd(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')
    S.add(0, x * np.clip(np.arange(n) / SR, 0, 1) * 0.035, pan=-0.2)          # the drizzle, lighter
    bed_wind(S, 0, END, 1.0, vol=0.03, smooth=40, pan=0.2)                  # the canopy
    for m in (41, 48): S.add(0, strings(m, END + 2 * b, vol=0.03)); S.add(0, organ(m - 12, END + 2 * b, vol=0.015))
    frogs(S, 0, END, 1.0, 0.04, count=5, rate=0.4); crickets(S, 0, END, 1.0, 0.022)
    t = 0.3
    while t < END - 0.5: drip(S, t, rnd(0.03, 0.06)); t += rnd(0.3, 2.0)
    for k in range(1, 49, 5):
        if rnd() < 0.8: owl(S, B(k) + rnd(0, 3 * bar), rnd(0.05, 0.08))
    for k in range(1, 49, 2):
        for j in range(np.random.randint(1, 4)): twinkle(S, B(k) + rnd(0, 2 * bar), 0.02)   # fireflies
    for k in (10, 30, 44): snore_pig(S, B(k) + rnd(0, bar), 0.05)
    # 1-8: the sprout, on bells, like fireflies coming on
    for i, g in enumerate(GROW): seq(S, g, b, B(2 + 2 * i), lambda m, d: bell(m + 12, max(d, 0.6), vol=0.07), pan=0.3)
    chords(S, B(1), bar, [41, 46], ch=FCH, vol=0.02, bars_each=4)
    # 9-16: Falmi's theme as a lullaby, half speed, kalimba over a harp
    HR = [41, 41, 46, 46, 48, 48, 41, 41]
    seq(S, half(F1 + F2), b, B(9), lambda m, d: kalimba(m, max(d * 0.5, 0.6), vol=0.2), pan=-0.15)
    strum(S, B(9), b, HR, ch=FCH, vol=0.04); lowbass(S, B(9), bar, HR, 0.16)
    # 17-24: only the forest; 25-32: the forest dreaming it: a low flute and a choir
    chords(S, B(17), bar, [41, 46], ch=FCH, vol=0.018, bars_each=4)
    seq(S, half(F1 + F2), b, B(25), lambda m, d: flute(m - 12, d * 0.95, vol=0.16), pan=0.2)
    chords(S, B(25), bar, HR, ch=FCH, inst=choir, vol=0.025); lowbass(S, B(25), bar, HR, 0.15)
    # 33-40: in the dark, the theme on bells in the wrong key (B, a tritone away); a giggle; then right
    seq(S, [(m + 6, d) for m, d in F1], b, B(33), lambda m, d: bell(m, max(d, 0.5), vol=0.07), pan=0.5)
    chords(S, B(33), bar, [47], ch=FCH, vol=0.018, bars_each=2)
    for i in range(5):
        m = int(0.08 * SR); tt = np.arange(m) / SR; y = rnd(-1, 1, m); y = y - np.convolve(y, np.ones(8) / 8, 'same')
        S.add(B(35) + b + i * 0.12, y * np.sin(np.pi * tt / 0.08) * 0.05, pan=0.6 - 0.25 * i)
    seq(S, F1, b, B(37), lambda m, d: bell(m, max(d, 0.5), vol=0.07), pan=-0.4)
    chords(S, B(37), bar, FR, ch=FCH, vol=0.02)
    # 41-48: the forest, and the sprout once more
    for i, g in enumerate(GROW): seq(S, g, b, B(42 + 2 * i), lambda m, d: kalimba(m, max(d, 0.5), vol=0.14), pan=-0.2)
    chords(S, B(41), bar, [41], ch=FCH, vol=0.018, bars_each=8)
    finish(S, 'Laurel_Forest_Night', t0, END, gain=0.89, echo=0.32, fb=0.4, reverb=0.4)

# ------------------------------------------------------------------ the grasslands at night
def grasslands():
    """The terraces at night: cool wind, crickets loud, a nightjar churring, an owl, one sleepy goat bell, stars.
    Far off, a herder by a fire plays the Island tune's call on a flute, and nobody whistles back; a kalimba
    plays the tune at half speed; then a long, still stretch under the stars."""
    S, b, bar, t0, END, B = track(66, 48, 741)
    bed_wind(S, 0, END, 1.0, vol=0.08, smooth=70, pan=-0.1); crickets(S, 0, END, 1.0, 0.035)
    for m in (43, 50): S.add(0, strings(m, END + 2 * b, vol=0.025))
    for k in range(1, 49, 4): gust(S, B(k) + rnd(0, 3 * bar), rnd(6, 10) * b, 0.06, smooth=60)
    for k in (5, 20, 37): nightjar(S, B(k) + rnd(0, bar), rnd(3, 5), 0.03)
    for k in (12, 29, 45): owl(S, B(k) + rnd(0, bar), 0.06)
    for k in (8, 33): goatbell(S, B(k) + rnd(0, bar), 0.02)
    for k in range(1, 49):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.01)               # stars
    # 1-8: the land; a held chord
    chords(S, B(1), bar, [43, 40], vol=0.02, bars_each=4)
    # 9-16: a herder by a far-off fire plays the call; nobody answers
    seq(S, CALL1, b, B(9), lambda m, d: flute(m + 12, d * 0.9, vol=0.08), pan=0.75)
    seq(S, CALL2, b, B(13), lambda m, d: flute(m + 12, d * 0.9, vol=0.07), pan=0.75)
    chords(S, B(9), bar, [43, 48], vol=0.02, bars_each=4)
    # 17-32: the tune, half speed, on a kalimba, over slow harp chords
    seq(S, half(TUNE), b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.6), vol=0.18), pan=0.15)
    HR = [43, 43, 48, 48, 40, 40, 43, 43, 43, 43, 38, 38, 41, 41, 43, 43]
    strum(S, B(17), b, HR, vol=0.035); lowbass(S, B(17), bar, HR, 0.14)
    # 33-48: under the stars: the answer once more, far away, then only the night
    seq(S, half(ANS2), b, B(37), lambda m, d: flute(m + 12, d * 0.92, vol=0.07), pan=-0.7)
    chords(S, B(33), bar, [43, 41, 43, 43], vol=0.018, bars_each=4)
    finish(S, 'Grasslands_Night', t0, END, gain=0.84)

# ------------------------------------------------------------------ the salt marsh at night
def marsh_night():
    """The salt marsh after dark: frogs everywhere, mosquitoes, a bittern booming in the reeds, a night heron's
    croak, the water. The cranes call nearer than by day (Hags?). Pale lights drift over the water (glints).
    The Marsh tune slower, on the low reed pipe; once, the Hags' lullaby in 3/4 on a far kalimba."""
    S, b, bar, t0, END, B = track(60, 40, 751)
    frogs(S, 0, END, 1.0, 0.05, count=8); lap(S, 0, END, 1.0, 0.06, pan=-0.3)
    bed_wind(S, 0, END, 1.0, vol=0.04, smooth=60, pan=0.2); crickets(S, 0, END, 1.0, 0.015)
    for k in range(1, 41, 4):
        if rnd() < 0.7: mosquito(S, B(k) + rnd(0, 3 * bar))
        if rnd() < 0.6: reeds(S, B(k) + rnd(0, 3 * bar), rnd(2, 4) * b, 0.03)
    for k in (4, 23): bittern(S, B(k) + rnd(0, bar), 0.1)
    for k in (11, 33): heron(S, B(k) + rnd(0, bar), 0.06)
    for k, p in ((15, 0.7), (16, -0.6), (35, 0.8)): crane(S, B(k) + rnd(0, bar), 0.06, calls=3, pan=p)
    for k in range(1, 41, 2):
        if rnd() < 0.5: twinkle(S, B(k) + rnd(0, bar), 0.015)               # lights over the water
    drone = lambda t, bars, v: [S.add(t, organ(m, bars * bar * 0.99, vol=v * w), pan=-0.2) for m, w in ((40, 1), (47, 0.6))]
    # 1-8: the drone rising out of the frogs
    drone(B(1), 8, 0.045)
    # 9-16: the Marsh tune on the reed pipe, slow
    seq(S, marsh.MARSH, b, B(9), lambda m, d: flute(m, d * 0.96, vol=0.15), pan=0.15)
    drone(B(9), 8, 0.035); lowbass(S, B(9), bar, marsh.ROOTS, 0.15)
    # 17-24: the Hags' lullaby, far off, in 3/4, on a kalimba (out of step with everything else)
    seq(S, marsh.LULL1 + marsh.LULL2, b * 4 / 3, B(17), lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.08), pan=0.7)
    for m in (52, 58): S.add(B(17), strings(m, 8 * bar * 0.98, vol=0.035))     # E and B flat, held
    # 25-32: the tune's second half again, lower, with the bell on its B flat
    seq(S, marsh.M3 + marsh.M4 + marsh.M1 + marsh.M2, b, B(25), lambda m, d: flute(m, d * 0.96, vol=0.13), pan=-0.15)
    S.add(B(31), bell(82, 1.5, vol=0.04), pan=0.6)
    drone(B(25), 8, 0.03); lowbass(S, B(25), bar, marsh.ROOTS[4:] + marsh.ROOTS[:4], 0.14)
    # 33-40: the frogs take it home
    drone(B(33), 8, 0.045)
    finish(S, 'Salt_Marsh_Night', t0, END, gain=0.75, echo=0.35, fb=0.42, reverb=0.4)

ALL = dict(zonfahare=zonfahare, mansehare=mansehare, aguerekeu=aguerekeu, laurel=laurel, grasslands=grasslands, marsh=marsh_night)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
