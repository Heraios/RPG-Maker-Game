# Battle themes for two of the open wilds, grown out of each area's own music (same key, a doubled pulse), for a
# 16-bit orchestra at war, each opening with its jingle.
#   Battle_Grasslands (the terraces: Grasslands is in G at 80, this is at 160): a sweeping charge on the Island
#       tune. Jingle: the tune's call climbing on the brass. The tune on horns and low brass over a march whose war
#       drums keep the island's 3-3-2; then the herders' call and answer across the valley (brass calls one side,
#       strings and choir answering from the other); the tune sweeping an octave up with its harmony on the horns;
#       at the end, G against F, the island's own flat seventh, hammered.
#   Battle_Laurel_Forest (the Lady's lowland forest: 88 there, 176 here): Falmi's theme (the Lady's tune), sung
#       broad at its own speed over double-time drums. Jingle: the sprouting notes (F A C F) as a brass fanfare.
#       The theme on horns and strings; the Lady's temper (the theme in the minor, as in Laurel_Forest's storm) on
#       low brass and the men's choir; the Master of Deception's trick (the theme in B, a tritone away, on bells,
#       then snapped back into F); the theme sweeping with its second half on the horns; the sprout climbing.
# Usage: python3 battle_wilds16.py grass laurel   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, HARM
R = None
PLAIN = (0, 12, 7, 12, 0, 12, 7, 12, 0, 12, 7, 12, 0, 7, 12, 19)
ISLE = (0, 12, 7, 0, 12, 7, 0, 12, 0, 12, 7, 0, 12, 7, 12, 19)      # the figure in 3-3-2 (sixteenths)

def finish(S, name, t0, end, drive=3.3):
    L, Rr = snes_master(S.L, S.R, echo=0.22, fb=0.26, reverb=0.26)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', drive=drive)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def bed(S, t, b, roots, minor, fig=PLAIN, vol=1.0, drums=march, chords=0.6):
    bar = 4 * b
    for k, r in enumerate(roots):
        ostinato(S, t + k * bar, b, [r], fig, 0.06 * vol)
        power(S, t + k * bar, bar, r - 12, minor.get(r, False), vol * chords)
    low_end(S, t, b, roots, 0.28 * vol); drums(S, t, b, len(roots), vol)

def isle_drums(S, t, b, bars, vol=1.0):                            # war drums in the island's 3-3-2, on top of the march
    for k in range(bars):
        for j, v in ((0, 0.34), (1.5, 0.3), (3, 0.3)): S.add(t + k * 4 * b + j * b, drum('taikohi', v * vol), pan=0.35)

# ------------------------------------------------------------------ the grasslands
def grass():
    np.random.seed(1601)
    b = 60 / 160; bar = 4 * b; INTRO = 1; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    MIN = {40: True}
    # the jingle (once): a hit; the call's first notes climbing on the brass, onto the high D; a roll
    hit(S, 0, 43, 1.1, minor=False)
    climb = [(67, .25), (69, .25), (71, .25), (74, .25), (79, 2)]
    seq(S, climb, b, b, lambda m, d: brass(m, d * 0.95, vol=0.34), pan=-0.1)
    seq(S, climb, b, b, lambda m, d: horn(m - 12, d * 0.95, vol=0.22), pan=0.2)
    roll(S, b, 3, b, 0.05, 0.4)
    for i in range(6): S.add((1 + i * 0.5) * b, drum('taiko', 0.3 + 0.07 * i))
    # 1-8: the tune on horns and low brass, the march keeping 3-3-2
    hit(S, B(1), 43, 1.0, minor=False)
    bed(S, B(1), b, ROOTS, MIN, ISLE); isle_drums(S, B(1), b, 8)
    tune(S, B(1), b, TUNE, [(horn, 0, 0.36, -0.15, 0.97), (brass, -12, 0.24, 0.15, 0.95), (strings, 12, 0.1, 0.3, 0.97)])
    S.add(B(5), cymbal(0.1, 1.5), pan=0.3)
    # 9-16: call and answer across the valley: brass calls on one side, strings and choir answer from the other
    hit(S, B(9), 43, 0.9, minor=False)
    bed(S, B(9), b, ROOTS, MIN, PLAIN, 1.05); isle_drums(S, B(9), b, 8, 0.9)
    t = B(9)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        tune(S, t, b, call, [(brass, 0, 0.36, -0.45, 0.9), (horn, -12, 0.3, -0.3, 0.92), (strings, 12, 0.12, -0.3, 0.95)])
        t += 2 * bar
        tune(S, t, b, ans, [(strings, 12, 0.36, 0.45, 0.97), (choir, 0, 0.2, 0.3, 0.97), (horn, 0, 0.2, 0.3, 0.95)])
        t += 2 * bar
    # 17-24: the sweep: the tune an octave up on strings, its harmony on the horns, the choir
    hit(S, B(17), 43, 1.0, minor=False)
    bed(S, B(17), b, ROOTS, MIN, ISLE, 1.1); isle_drums(S, B(17), b, 8, 1.1)
    tune(S, B(17), b, TUNE, [(strings, 12, 0.32, 0.15, 0.97), (brass, 0, 0.22, -0.15, 0.92), (choir, 0, 0.14, 0.0, 0.97)])
    tune(S, B(17), b, HARM, [(horn, -12, 0.24, -0.35, 0.95)])
    S.add(B(21), cymbal(0.11, 2), pan=-0.3)
    roll(S, B(24) + 2 * b, 2, b, 0.04, 0.24, kind='tomhi', rate=4, pan=-0.3)
    # 25-32: the island's flat seventh: G against F, hammered; the call's answer (on F) blazing; a roll back
    RD = [43, 41, 43, 41, 43, 41, 38, 43]
    for k, r in enumerate(RD):
        hit(S, B(25 + k), r, 0.8, minor=False)
        seq(S, [(m + (r - 43), d) for m, d in climb[:4]], b, B(25 + k) + 2 * b, lambda m, d: brass(m, d * 0.9, vol=0.24), pan=(-0.2, 0.2)[k % 2])
    bed(S, B(25), b, RD, MIN, ISLE, 1.1, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False)); isle_drums(S, B(25), b, 8, 1.1)
    tune(S, B(27), b, ANS2, [(horn, 0, 0.34, -0.1, 0.97), (strings, 12, 0.26, 0.25, 0.97)])
    tune(S, B(31), b, ANS2, [(brass, 0, 0.3, -0.1, 0.92), (choir, 0, 0.16, 0.2, 0.97), (strings, 12, 0.24, 0.3, 0.97)])
    for i in range(16): S.add(B(32) + i * b / 4, timpani(43, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Grasslands', t0, END, drive=3.7)

# ------------------------------------------------------------------ the laurel forest
F1 = [(84, .5), (81, .5), (77, .5), (81, .5), (84, 1), (86, .5), (84, .5), (82, .5), (81, .5), (79, .5), (81, .5), (77, 2)]
F2 = [(86, .5), (84, .5), (82, .5), (81, .5), (79, 1), (84, 1), (81, .5), (77, .5), (79, .5), (76, .5), (77, 2)]
broad = lambda ph: [(m, d * 2) for m, d in ph]                      # the theme at its own speed, over double-time drums
THEME = broad(F1 + F2)                                             # 32 beats: 8 bars here
MINOR = {81: 80, 86: 85}
TEMPER = [(MINOR.get(m, m), d) for m, d in THEME]                  # her temper (as in Laurel_Forest's storm)
FR = [41, 41, 46, 46, 48, 48, 41, 41]                              # F Bb C F, two bars each
SPROUT = [(77, .25), (81, .25), (84, .25), (89, 1.25)]

def laurel():
    np.random.seed(1611)
    b = 60 / 176; bar = 4 * b; INTRO = 1; BARS = 32
    S = Stereo((INTRO + BARS) * bar); END = (INTRO + BARS) * bar; t0 = INTRO * bar
    B = lambda n: t0 + (n - 1) * bar
    # the jingle (once): a hit; the sprout (F A C F) as a brass fanfare; a roll
    hit(S, 0, 41, 1.1, minor=False)
    seq(S, SPROUT, b, b, lambda m, d: brass(m, d * 0.95, vol=0.34), pan=-0.1)
    seq(S, SPROUT, b, b, lambda m, d: horn(m - 12, d * 0.95, vol=0.22), pan=0.2)
    roll(S, b, 3, b, 0.05, 0.4)
    for i in range(6): S.add((1 + i * 0.5) * b, drum('taiko', 0.3 + 0.07 * i))
    # 1-8: Falmi's theme, broad, on horns and strings
    hit(S, B(1), 41, 1.0, minor=False)
    bed(S, B(1), b, FR, {})
    tune(S, B(1), b, THEME, [(horn, 0, 0.36, -0.15, 0.97), (strings, 12, 0.22, 0.25, 0.97), (brass, -12, 0.2, 0.1, 0.95)])
    S.add(B(5), cymbal(0.1, 1.5), pan=0.3)
    # 9-16: the Lady's temper: the theme in the minor, on low brass and the men's choir
    RT = [41, 41, 46, 46, 49, 48, 41, 41]                          # Fm Bbm Db C Fm
    hit(S, B(9), 41, 1.0)
    bed(S, B(9), b, RT, {41: True, 46: True}, vol=1.05)
    tune(S, B(9), b, TEMPER, [(brass, -12, 0.3, -0.1, 0.95), (menchoir, -12, 0.3, 0.15, 0.95), (strings, 0, 0.22, 0.3, 0.97)])
    for k in (10, 12, 14, 16): S.add(B(k) + 3 * b, brass(53, b * 0.5, vol=0.22)); S.add(B(k) + 3 * b, brass(54, b * 0.5, vol=0.12))   # a snort
    # 17-20: the Master of Deception: the theme in B (a tritone away) on bells and strings... then snapped back
    tune(S, B(17), b, broad(F1)[:5], [(bell, 6, 0.16, 0.4, 0.9), (strings, 6, 0.2, 0.2, 0.95)])
    bed(S, B(17), b, [47, 47], {47: False}, vol=0.9)
    for i in range(8): S.add(B(18) + 2 * b + i * 0.06, flute(93 - (i % 2) * 2 - i // 3, 0.08, vol=0.12), pan=0.5)   # a giggle
    hit(S, B(19), 41, 1.0, minor=False)
    tune(S, B(19), b, SPROUT + [(R, .5)] + SPROUT, [(brass, 0, 0.32, -0.1, 0.92), (horn, -12, 0.22, 0.2, 0.95)])
    bed(S, B(19), b, [41, 41], {})
    # 21-28: the sweep: the theme on strings an octave up and the choir; its second half on the horns, under it
    hit(S, B(21), 41, 1.0, minor=False)
    bed(S, B(21), b, FR, {}, vol=1.1)
    tune(S, B(21), b, THEME, [(strings, 12, 0.32, 0.15, 0.97), (choir, 0, 0.14, -0.2, 0.97), (brass, 0, 0.2, -0.1, 0.92)])
    tune(S, B(21), b, broad(F2 + F1), [(horn, -12, 0.22, -0.35, 0.95)])
    S.add(B(25), cymbal(0.11, 2), pan=-0.3)
    # 29-32: the sprout climbing, a step each bar; a roll back to the top
    for k, r in enumerate((41, 43, 45, 46)):
        hit(S, B(29 + k), r, 0.85, minor=False)
        tune(S, B(29 + k) + 2 * b, b, [(m + (r - 41), d) for m, d in SPROUT], [(brass, 0, 0.3, (-0.2, 0.2)[k % 2], 0.92), (strings, 12, 0.16, 0.3, 0.95)])
    bed(S, B(29), b, [41, 43, 45, 46], {45: True}, vol=1.1, drums=lambda S, t, b, n, v: march(S, t, b, n, v, fill=False))
    for i in range(16): S.add(B(32) + i * b / 4, timpani(41, 0.08 + 0.025 * i))
    roll(S, B(32) + 2 * b, 2, b, 0.06, 0.42)
    finish(S, 'Battle_Laurel_Forest', t0, END, drive=2.6)

ALL = dict(grass=grass, laurel=laurel)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
