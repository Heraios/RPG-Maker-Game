# Two boss themes for Act 2's optional fights, melody first, with war drums on every beat and no let-up.
#   Boss_Daughter_Wells: one of the Lady of the Woods' daughters, trapped in a First Sailor well. Ominous: a fast,
#       dark waltz in E minor (built like Battle_Ancients, on the Wells' music). Her tune (Falmi's theme bent into Tou's
#       key and 3/4) sung broad as a lament on strings, horns and choir over a relentless waltz; Tou's minuet (the First
#       Sailors built the well) on low brass and the men's choir, the bells chiming it back; then her tune a semitone
#       up, in F minor (her mother's key, pulling against the well); E against F hammered at the end.
#   Boss_Lady_Woods: the Lady of the Woods herself (the lowland fight; also fits her alpine one). Ancient and
#       powerful. A huge snort and her chord on organ and choir; Falmi's theme (her own tune, all along) in her temper,
#       the minor, broad on horns, low brass and the men's choir; her ancient self, the theme in F major on full choir,
#       organ and brass, at full tilt (not slowed); the temper again with the theme's second half against it; a step up
#       into G minor, the sprout climbing.
# Usage: python3 bosses16.py daughter lady   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
R = None
broad = lambda ph: [(m, d * 2) for m, d in ph]
up = lambda ph, n: [(m + n if m is not None else None, d) for m, d in ph]

def finish(S, name, t0, end, drive=3.4):
    L, Rr = snes_master(S.L, S.R, echo=0.22, fb=0.26, reverb=0.26)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', drive=drive)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

# ------------------------------------------------------------------ the Daughter of the Wells
FE = [(83, 1), (79, .5), (76, .5), (79, 1), (83, 2), (84, 1), (83, .5), (81, .5), (79, 1), (78, 1), (79, 1), (76, 2)]
FE2 = [(84, 1), (83, .5), (81, .5), (79, 1), (78, 2), (83, 1), (81, .5), (79, .5), (78, 1), (75, 1), (76, 3)]
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
FR = [40, 48, 47, 40, 45, 47, 47, 40]                              # her tune's chords, a bar each (3/4)
TR = [40, 42, 48, 47, 40, 43, 50, 40]                              # Tou's minuet's
DMIN = {40: True, 45: True, 41: True, 46: True, 48: False, 47: False, 42: False, 43: False, 50: False, 49: False}
WALTZ = (0, 7, 12, 7, 12, 7, 0, 7, 12, 7, 15, 12)                  # the strings' figure: sixteenths, three beats

def daughter():
    np.random.seed(1101)
    b = 60 / 156; bar = 3 * b; INTRO = 2; BARS = 44
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    def bed(t, roots, vol=1.0, slow=1):                             # the waltz: strings, bass, chords, drums on every beat
        for k, r in enumerate(roots):
            at = t + k * slow * bar
            for s_ in range(slow):
                ostinato(S, at + s_ * bar, b, [r], WALTZ, 0.06 * vol, beats=3)
            power(S, at, slow * bar, r - 12, DMIN.get(r, False), vol * 0.6)
        low_end(S, t, b, [r for r in roots for _ in range(slow)], 0.28 * vol, beats=3, pattern=(0, 12, 7, 12, 7, 12))
        drive(S, t, b, len(roots) * slow, vol, beats=3)
    def drops(t, notes, vol=0.12):                                  # the bells, chiming back like water in the well
        seq(S, notes, b, t, lambda m, d: bell(m + 12, max(d * 0.4, 0.5), vol=vol), pan=0.45)
    # the jingle (once, two bars): a hit; her tune's first notes on the brass, falling (B G E); an organ cluster; a roll
    hit(S, 0, 40, 1.2)
    tune(S, 0.5 * b, b, [(83, .5), (79, .5), (76, 1.5)], [(brass, 0, 0.34, -0.1, 0.9), (horn, -12, 0.26, 0.2, 0.95)])
    for m in (52, 53, 58, 59): S.add(bar, organ(m, bar * 0.98, vol=0.08))
    roll(S, bar, 3, b, 0.06, 0.45)
    # 1-16: her tune, broad, a lament on strings and horns over the waltz; the bells answer at the phrase ends
    hit(S, B(1), 40)
    tune(S, B(1), b, broad(FE + FE2), [(strings, 12, 0.3, 0.15, 0.97), (horn, 0, 0.3, -0.2, 0.97), (brass, -12, 0.16, 0.1, 0.95)])
    bed(B(1), FR, slow=2)
    for k in (4, 8, 12, 16): drops(B(k) + b, T1[:3], 0.1)
    S.add(B(9), cymbal(0.1, 1.5), pan=0.3)
    # 17-24: Tou's minuet on low brass and the men's choir; the bells chime it back
    hit(S, B(17), 40, 1.0)
    tune(S, B(17), b, T1 + T2, [(brass, -12, 0.34, -0.1, 0.92), (menchoir, -12, 0.32, 0.15, 0.95), (horn, 0, 0.16, 0.3, 0.95)])
    drops(B(17) + 1.5 * b, T1 + T2, 0.07)
    bed(B(17), TR, 1.05)
    # 25-40: her tune up a semitone, in F minor (her mother's key, pulling against the well): everyone
    hit(S, B(25), 41, 1.05)
    tune(S, B(25), b, up(broad(FE + FE2), 1), [(strings, 12, 0.32, 0.15, 0.97), (choir, 0, 0.16, -0.2, 0.97), (horn, 0, 0.3, -0.3, 0.97), (brass, -12, 0.2, 0.1, 0.95)])
    bed(B(25), [r + 1 for r in FR], 1.1, slow=2)
    for k in (28, 32, 36, 40): drops(B(k) + b, up(T1[:3], 1), 0.1)
    S.add(B(33), cymbal(0.11, 2), pan=-0.3)
    # 41-44: E against F, hammered; a roll back down into E minor
    for k, r in enumerate((41, 40, 41, 40)):
        hit(S, B(41 + k), r, 0.9)
        tune(S, B(41 + k) + b, b, [(m + (r - 40), d) for m, d in [(83, .5), (79, .5), (76, 1)]], [(brass, 0, 0.3, (-0.2, 0.2)[k % 2], 0.9)])
    bed(B(41), [41, 40, 41, 40], 1.1)
    for i in range(12): S.add(B(44) + i * b / 4, timpani(40, 0.08 + 0.03 * i))
    finish(S, 'Boss_Daughter_Wells', t0, END, drive=2.6)

# ------------------------------------------------------------------ the Lady of the Woods
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (82, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
F2 = [(86, .5), (84, .5), (82, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
THEME = broad(F1 + F2)                                             # 8 bars
TEMPER = [({81: 80, 86: 85}.get(m, m), d) for m, d in THEME]       # her temper: F minor (A flat, D flat)
SECOND = broad(F2 + F1)
FRM = [41, 41, 46, 46, 49, 48, 41, 41]                             # Fm Fm Bbm Bbm Db C Fm Fm
FRJ = [41, 41, 46, 46, 48, 48, 41, 41]                             # F F Bb Bb C C F F
LMIN = {41: True, 46: True, 49: False, 48: False, 43: True, 51: False, 50: False, 47: True}
SPROUT = [(77, .25), (80, .25), (84, .25), (89, 1.25)]             # the sprout, in her temper (F A flat C F)

def snort(S, t, vol=0.2, pan=0.0):
    for i, d in enumerate((0.12, 0.1, 0.3)):
        n = int(d * SR); tt = np.arange(n) / SR
        x = lowpass(np.random.uniform(-1, 1, n), 500) * 6 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 26 * tt)))
        if i == 2: x += np.sin(2 * np.pi * np.cumsum(80 * (1 - 0.25 * tt / d)) / SR) * 0.9
        S.add(t + i * 0.16, x * np.sin(np.pi * tt / d) * vol, pan=pan)

def lady():
    np.random.seed(1111)
    b = 60 / 144; bar = 4 * b; INTRO = 3; BARS = 28
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    PLAIN = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)
    def bed(t, roots, minor=LMIN, vol=1.0):
        for k, r in enumerate(roots):
            ostinato(S, t + k * bar, b, [r], PLAIN, 0.06 * vol)
            power(S, t + k * bar, bar, r - 12, minor.get(r, False), vol * 0.6)
            S.add(t + k * bar, organ(r, bar * 0.98, vol=0.05 * vol)); S.add(t + k * bar, organ(r + 7, bar * 0.98, vol=0.035 * vol))
        low_end(S, t, b, roots, 0.28 * vol); drive(S, t, b, len(roots), vol)
    # the jingle (once, three bars): a huge snort and her chord on organ and choir; the sprout in her temper; a roll
    hit(S, 0, 41, 1.2); snort(S, 0.05, 0.3)
    for m in (53, 56, 60, 65): S.add(0, organ(m, 2 * bar * 0.98, vol=0.08)); S.add(0, choir(m + 12, 2 * bar * 0.98, vol=0.06)); S.add(0, menchoir(m - 12, 2 * bar * 0.98, vol=0.08))
    tune(S, bar, b, SPROUT + [(R, .5)] + SPROUT, [(brass, 0, 0.34, -0.1, 0.92), (horn, -12, 0.26, 0.2, 0.95)])
    hit(S, 2 * bar, 41, 1.0); snort(S, 2 * bar + b, 0.22, 0.3)
    for i in range(16): S.add(2 * bar + i * b / 4, timpani(41, 0.1 + 0.025 * i))
    roll(S, 2 * bar + 2 * b, 2, b, 0.1, 0.45)
    # 1-8: her temper: the theme in the minor, broad, on horns, low brass and the men's choir
    hit(S, B(1), 41)
    tune(S, B(1), b, TEMPER, [(horn, 0, 0.36, -0.15, 0.97), (brass, -12, 0.26, 0.15, 0.95), (menchoir, -12, 0.24, 0.0, 0.97), (strings, 12, 0.12, 0.3, 0.97)])
    bed(B(1), FRM)
    for k in (2, 4, 6, 8): snort(S, B(k) + 3 * b, 0.12, (-0.5, 0.5)[k // 2 % 2])
    # 9-16: her ancient self: the theme in F major, on full choir, organ and brass, at full tilt
    hit(S, B(9), 41, 1.1, minor=False)
    tune(S, B(9), b, THEME, [(choir, 0, 0.26, 0.0, 0.97), (brass, 0, 0.3, -0.15, 0.95), (horn, -12, 0.3, 0.2, 0.97), (strings, 12, 0.24, 0.3, 0.97), (organ, -12, 0.1, -0.3, 0.97)])
    bed(B(9), FRJ, {41: False, 46: False, 48: False}, 1.1)
    for k in (9, 13): S.add(B(k), cymbal(0.12, 2.5), pan=(0.3, -0.3)[k // 13])
    # 17-24: the temper again, with the theme's second half against it on the horns
    hit(S, B(17), 41, 1.05)
    tune(S, B(17), b, TEMPER, [(strings, 12, 0.32, 0.2, 0.97), (brass, 0, 0.26, -0.15, 0.92), (menchoir, -12, 0.22, 0.0, 0.97)])
    tune(S, B(17), b, [({81: 80, 86: 85}.get(m, m), d) for m, d in SECOND], [(horn, -12, 0.26, -0.35, 0.95)])
    bed(B(17), FRM, vol=1.1)
    for k in (18, 20, 22, 24): snort(S, B(k) + 2 * b, 0.14, (-0.5, 0.5)[k // 2 % 2])
    # 25-28: a step up into G minor; the sprout climbing; the earth shakes; a roll back to the top
    for k, r in enumerate((43, 44, 45, 46)):
        hit(S, B(25 + k), r, 0.95, minor=True)
        tune(S, B(25 + k) + 2 * b, b, up(SPROUT, r - 41), [(brass, 0, 0.3, (-0.2, 0.2)[k % 2], 0.92), (strings, 12, 0.18, 0.3, 0.95)])
    bed(B(25), [43, 44, 45, 46], {43: True, 44: False, 45: False, 46: True}, 1.15)
    n = int(4 * bar * SR); x = lowpass(np.random.uniform(-1, 1, n), 80) * 12
    S.add(B(25), x * np.linspace(0, 1, n) ** 2 * 0.25)
    for i in range(16): S.add(B(28) + i * b / 4, timpani(41, 0.08 + 0.03 * i))
    finish(S, 'Boss_Lady_Woods', t0, END, drive=2.6)

ALL = dict(daughter=daughter, lady=lady)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
