# Two boss themes for Act 2's optional fights.
#   Boss_Daughter_Wells: one of the Lady of the Woods' daughters, trapped in a First Sailor well. Ominous: built
#       like Battle_Ancients (a dark, driving waltz in E minor) on the Wells' music: the daughter's tune (Falmi's
#       theme bent into Tou's key and 3/4) carries it, tangled with Tou's minuet on bells; water drips into the
#       deep, the old work hums, the stone grinds.
#   Boss_Lady_Woods: the Lady of the Woods herself (the lowland fight; also fits her alpine one). Ancient and
#       powerful. Falmi's theme in her temper (minor, as in Laurel_Forest's storm) over a driving battle groove;
#       then, in the middle, her true and ancient self: the theme in its own major key, slow and grand, on choir,
#       organ and low brass, as if Falmi's tune had been hers all along; then the fury again, and the earth shakes.
# Usage: python3 bosses16.py daughter lady   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import drip, rnd
R = None

def finish(S, name, t0, end, gain=1.0, **kw):
    m = dict(echo=0.24, fb=0.3, reverb=0.25); m.update(kw)
    L, Rr = snes_master(S.L, S.R, **m)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def triad(r, q): return (r + 12, r + 12 + (4 if q == 'M' else 3), r + 19)

# ------------------------------------------------------------------ the Daughter of the Wells
FE = [(83, 1), (79, .5), (76, .5), (79, 1), (83, 2), (84, 1), (83, .5), (81, .5), (79, 1), (78, 1), (79, 1), (76, 2)]
FE2 = [(84, 1), (83, .5), (81, .5), (79, 1), (78, 2), (83, 1), (81, .5), (79, .5), (78, 1), (75, 1), (76, 3)]
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
FCH = [(40, 'm'), (48, 'M'), (47, 'M'), (40, 'm'), (45, 'm'), (47, 'M'), (47, 'M'), (40, 'm')]
TCH = [(40, 'm'), (42, 'M'), (48, 'M'), (47, 'M'), (40, 'm'), (43, 'M'), (50, 'M'), (40, 'm')]

def daughter():
    np.random.seed(1101)
    b = 60 / 144; bar = 3 * b; INTRO = 2; BARS = 40
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def waltz(t, chords, vol=1.0, run=True):
        for k, (r, q) in enumerate(chords):
            at = t + k * bar; tri = triad(r, q)
            S.add(at, slapbass(r - 12, b * 0.9, vol=0.36 * vol)); S.add(at, timpani(r if r < 45 else r - 12, 0.24 * vol))
            for j in (1, 2):
                for m in tri: S.add(at + j * b, stab(m + 12, b * 0.4, vol=0.04 * vol), pan=(-0.4, 0.4)[j - 1])
            if run:
                for j, m in enumerate((tri[0] + 12, tri[1] + 12, tri[2] + 12, tri[0] + 24, tri[2] + 12, tri[1] + 12)):
                    S.add(at + j * b / 2, harp(m, b * 0.5, vol=0.05 * vol), pan=(-0.5, 0.5)[j % 2])
            S.add(at, drum('tom', 0.3 * vol), pan=-0.2)
            for j in (1, 2): S.add(at + j * b, drum('tomhi', 0.12 * vol), pan=0.3)
            for j in range(6): S.add(at + j * b / 2, drum('shaker', 0.045 * vol), pan=0.5)
    def hum(t, dur, vol=0.08):                                     # the old work, humming low
        n = int(dur * SR); tt = np.arange(n) / SR; ph = 2 * np.pi * 55 * (1 + 0.004 * np.sin(2 * np.pi * 0.3 * tt)) * tt
        S.add(t, (np.sin(ph) + 0.3 * np.sin(3 * ph)) * np.clip(tt / 2, 0, 1) * np.clip((dur - tt) / 2, 0, 1) * vol)
    def grind(t, vol=0.12):
        n = int(1.5 * SR); x = lowpass(np.random.uniform(-1, 1, n), 250) * 8
        S.add(t, x * np.sin(np.pi * np.arange(n) / n) ** 2 * vol, pan=rnd(-0.5, 0.5))
    tt = 0.3
    while tt < END - 0.4: drip(S, tt, rnd(0.03, 0.06)); tt += rnd(0.6, 2.5)
    for k in (1, 17, 33): hum(B(k), 16 * bar, 0.07)
    # intro (once): into the well: a splash and its echo, the stone grinds, then the court of the deep strikes
    n = int(0.6 * SR); x = lowpass(np.random.uniform(-1, 1, n), 2500) * 3 * np.exp(-np.arange(n) / SR / 0.1)
    S.add(0.1, x * 0.12, pan=-0.2); S.add(0.5, x * 0.05, pan=0.3); grind(0.6)
    for m in (40, 46, 47, 52): S.add(bar + b, organ(m, bar + 2 * b, vol=0.1))
    S.add(bar + b, timpani(28, 0.55)); S.add(bar + b, cymbal(0.14, 2), pan=-0.2)
    # 1-16: the daughter's tune: low strings and organ, then a flute an octave up with the choir
    seq(S, FE + FE2, b, B(1), lambda m, d: strings(m - 12, d * 0.9, vol=0.16), pan=-0.15)
    seq(S, FE + FE2, b, B(1), lambda m, d: organ(m - 12, d * 0.9, vol=0.08), pan=0.2)
    waltz(B(1), FCH)
    seq(S, FE + FE2, b, B(9), lambda m, d: flute(m, d * 0.85, vol=0.3), pan=0.2)
    seq(S, FE + FE2, b, B(9), lambda m, d: strings(m - 24, d * 0.9, vol=0.1), pan=-0.25)
    waltz(B(9), FCH, 1.1)
    for k, (r, q) in enumerate(FCH):
        for m in triad(r, q): S.add(B(9 + k), choir(m, bar * 0.98, vol=0.035))
    # 17-24: tangled: Tou's minuet on bells, against the daughter's tune on low brass
    seq(S, T1 + T2, b, B(17), lambda m, d: bell(m, max(d * 0.8, 0.3), vol=0.16), pan=-0.4)
    seq(S, FE + FE2, b, B(17), lambda m, d: brass(m - 24, d * 0.85, vol=0.22), pan=0.3)
    waltz(B(17), TCH, 1.05)
    grind(B(20)); grind(B(24) + b)
    # 25-32: deeper: her tune at half speed, heavy; timpani on every beat; the water rising
    seq(S, [(m, d * 2) for m, d in FE], b, B(25), lambda m, d: brass(m - 24, d * 0.9, vol=0.24), pan=-0.1)
    seq(S, [(m, d * 2) for m, d in FE], b, B(25), lambda m, d: choir(m - 12, d * 0.95, vol=0.1), pan=0.2)
    waltz(B(25), [FCH[0], FCH[0], FCH[1], FCH[1], FCH[2], FCH[2], FCH[3], FCH[3]], 1.05, run=False)
    for k in range(8):
        for j in range(3): S.add(B(25 + k) + j * b, timpani(28 if j == 0 else 35, 0.18 + 0.1 * (j == 0)))
    n = int(8 * bar * SR); sw = lowpass(np.random.uniform(-1, 1, n), 600) * 6
    S.add(B(25), sw * np.linspace(0, 1, n) ** 2 * 0.06)
    # 33-40: everyone: the tune high on flute and bells, Tou's T2 against it; a drum roll back to the start
    seq(S, FE + FE2, b, B(33), lambda m, d: flute(m + 12, d * 0.85, vol=0.26), pan=0.2)
    seq(S, T2 + T1, b, B(33), lambda m, d: bell(m, max(d * 0.8, 0.3), vol=0.13), pan=-0.4)
    seq(S, FE + FE2, b, B(33), lambda m, d: strings(m - 12, d * 0.9, vol=0.12), pan=-0.1)
    waltz(B(33), FCH, 1.15)
    for i in range(12): S.add(B(40) + i * b / 4, drum('tom', 0.12 + i * 0.03), pan=(-0.3, 0.3)[i % 2])
    finish(S, 'Boss_Daughter_Wells', t0, END, echo=0.3, fb=0.36, reverb=0.35)

# ------------------------------------------------------------------ the Lady of the Woods
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (82, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
F2 = [(86, .5), (84, .5), (82, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
THEME = F1 + F2                                                   # 16 beats
MINOR = {81: 80, 86: 85, 76: 76, 79: 79}
FURY = [(MINOR.get(m, m), d) for m, d in THEME]                   # her temper: F minor (A flat, D flat)
CHm = {41: (53, 56, 60), 46: (58, 61, 65), 48: (60, 64, 67), 49: (61, 65, 68)}
CHM = {41: (53, 57, 60), 46: (58, 62, 65), 48: (60, 64, 67)}

def snort(S, t, vol=0.2, pan=0.0):
    for i, d in enumerate((0.12, 0.1, 0.3)):
        n = int(d * SR); tt = np.arange(n) / SR
        x = lowpass(np.random.uniform(-1, 1, n), 500) * 6 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 26 * tt)))
        if i == 2: x += np.sin(2 * np.pi * np.cumsum(80 * (1 - 0.25 * tt / d)) / SR) * 0.9
        S.add(t + i * 0.16, x * np.sin(np.pi * tt / d) * vol, pan=pan)

def lady():
    np.random.seed(1111)
    b = 60 / 132; bar = 4 * b; INTRO = 2; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def rumble(t, dur, vol=0.35):
        n = int(dur * SR); x = lowpass(np.random.uniform(-1, 1, n), 80) * 14
        S.add(t, x * np.sin(np.pi * np.arange(n) / n) ** 2 * vol)
    def groove(t, roots, vol=1.0, ch=CHm):                         # driving: kick, snare, toms, a pounding bass
        for k, r in enumerate(roots):
            at = t + k * bar
            for j, iv in ((0, 0), (0.5, 0), (1.5, 12), (2, 0), (2.5, 7), (3.5, 12)):
                S.add(at + j * b, slapbass(r - 12 + iv, b * 0.45, vol=0.34 * vol))
            for j in (0, 1.5, 2.5): S.add(at + j * b, drum('kick', 0.38 * vol))
            for j in (1, 3): S.add(at + j * b, drum('snare', 0.3 * vol), pan=0.15)
            for j in range(8): S.add(at + j * b / 2, drum('shaker', 0.05 * vol), pan=0.5)
            S.add(at + 3.5 * b, drum('tom', 0.24 * vol), pan=-0.3)
            for m in ch[r]: S.add(at, stab(m + 12, b * 0.5, vol=0.06 * vol), pan=-0.3); S.add(at + 2.5 * b, stab(m + 12, b * 0.3, vol=0.05 * vol), pan=0.3)
    FR = [41, 46, 48, 41]
    # intro (once): a huge snort, the ground rumbles, then her chord, struck by everyone
    snort(S, 0.1, 0.3); rumble(0.1, 2 * bar, 0.4)
    for m in (41, 48, 53, 56, 60): S.add(bar, organ(m, bar, vol=0.09)); S.add(bar, choir(m + 12, bar, vol=0.06)); S.add(bar, brass(m, bar * 0.9, vol=0.1))
    S.add(bar, timpani(41, 0.6)); S.add(bar, cymbal(0.16, 2.5), pan=0.2)
    for i in range(8): S.add(bar + 2 * b + i * b / 4, timpani(41, 0.15 + 0.05 * i))
    # 1-8: her temper: the theme in the minor on brass and strings, over the groove
    seq(S, FURY + FURY, b, B(1), lambda m, d: brass(m - 12, d * 0.85, vol=0.3), pan=-0.1)
    seq(S, FURY + FURY, b, B(1), lambda m, d: strings(m, d * 0.9, vol=0.12), pan=0.25)
    groove(B(1), FR + FR)
    for k in (2, 6): snort(S, B(k) + 3 * b, 0.12, rnd(-0.5, 0.5))
    # 9-16: her ancient self: the theme in its own major key, slow and grand: choir, organ, low brass
    grand = [(m, d * 2) for m, d in THEME]
    seq(S, grand, b, B(9), lambda m, d: choir(m - 12, d * 0.97, vol=0.26), pan=0.0)
    seq(S, grand, b, B(9), lambda m, d: organ(m - 24, d * 0.97, vol=0.09), pan=-0.2)
    seq(S, grand, b, B(9), lambda m, d: brass(m - 24, d * 0.95, vol=0.18), pan=0.2)
    for k, r in enumerate([41, 41, 46, 46, 48, 48, 41, 41]):
        for m in CHM[r]: S.add(B(9 + k), strings(m, bar * 0.98, vol=0.05)); S.add(B(9 + k), choir(m, bar * 0.98, vol=0.03))
        S.add(B(9 + k), pluckbass(r - 12, bar * 0.9, vol=0.34)); S.add(B(9 + k), timpani(r, 0.3))
        S.add(B(9 + k) + 2 * b, timpani(r, 0.18)); S.add(B(9 + k), drum('tom', 0.2), pan=-0.2)
    S.add(B(9), cymbal(0.12, 3), pan=-0.2)
    # 17-24: the fury: the theme in the minor, fast, on marimba and flute, relentless drums; she snorts
    seq(S, FURY + FURY, b, B(17), lambda m, d: marimba(m, d * 0.7, vol=0.42), pan=-0.15)
    seq(S, FURY + FURY, b, B(17), lambda m, d: flute(m + 12, d * 0.8, vol=0.18), pan=0.3)
    seq(S, FURY + FURY, b, B(17), lambda m, d: brass(m - 24, d * 0.7, vol=0.16), pan=0.0)
    groove(B(17), [41, 49, 48, 46, 41, 49, 48, 41], 1.15)
    for k in (18, 20, 22, 24): snort(S, B(k) + rnd(0, 2) * b, 0.14, rnd(-0.6, 0.6))
    for k in (17, 21): S.add(B(k), cymbal(0.1, 1.5), pan=0.3)
    # 25-32: the earth shakes: a rumble, an organ cluster, timpani rolling; her minor chords, falling, back to the top
    rumble(B(25), 6 * bar, 0.35)
    for k, r in enumerate((41, 49, 46, 48)):
        for m in CHm[r]: S.add(B(25 + 2 * k), organ(m, 2 * bar * 0.98, vol=0.06)); S.add(B(25 + 2 * k), choir(m + 12, 2 * bar * 0.98, vol=0.05))
        S.add(B(25 + 2 * k), brass(r, 2 * bar * 0.9, vol=0.16))
        for i in range(16): S.add(B(25 + 2 * k) + i * b / 2, timpani(r, 0.1 + 0.012 * i))
    seq(S, [(m, d * 2) for m, d in FURY[:6]], b, B(25), lambda m, d: brass(m - 12, d * 0.9, vol=0.22), pan=-0.1)
    for i in range(16): S.add(B(32) + i * b / 4, drum('snare', 0.06 + i * 0.015), pan=0.15)
    finish(S, 'Boss_Lady_Woods', t0, END)

ALL = dict(daughter=daughter, lady=lady)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
