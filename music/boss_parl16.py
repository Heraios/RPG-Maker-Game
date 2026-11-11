import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from battle_kit import *
np.random.seed(411)
R = None
# Boss: Parl, the pearl thief: a Seafarer deserter, homesick, cornered in the marsh. Melody first: his jig (A minor,
# with its cheeky D sharp) sung as a sweeping sea shanty on horns and strings; the Seafarer riff from his old drill on
# low brass and the men's choir; and his homesick fanfare (A E A B C, the Seafarer fanfare made his own) as the heart of
# it, broad and passionate, not a breather. All in 12/8 at the Chase's speed and key (a dotted quarter = 112, A minor),
# so the Chase runs straight into the fight. War drums on every beat, no let-up.
#   The jingle (once, two bars): a hit; his whistle (the jig's first notes) answered by the Seafarer fanfare's chord.
#   A  (8 bars)  the jig on horns and strings, the drums galloping
#   B  (6 bars)  the Seafarer riff, his old drill, on low brass and the men's choir; his whistle darting above
#   C  (8 bars)  his homesick fanfare, broad: horns, choir and strings over everything; the last four bars a step up
#   D  (4 bars)  the jig against the riff; a roll back to the top
e = 60 / 112 / 3; bar = 12 * e; half = 6 * e                        # 12/8: an eighth, a bar, half a bar
A4, B4, C5, D5, Ds5, E5, G4, Gs4, Fs4, E4 = 69, 71, 72, 74, 75, 76, 67, 68, 66, 64
P1 = [(A4, 1), (C5, 1), (E5, 1), (Ds5, 1), (E5, 1), (C5, 1), (B4, 2), (G4, 1), (A4, 3),
      (E4, 1), (G4, 1), (A4, 1), (B4, 1), (C5, 1), (D5, 1), (E5, 2), (D5, 1), (B4, 3)]
P2 = [(C5, 1), (B4, 1), (A4, 1), (Gs4, 1), (A4, 1), (B4, 1), (C5, 2), (E5, 1), (A4, 3),
      (Fs4, 1), (G4, 1), (A4, 1), (C5, 2), (B4, 1), (A4, 6)]          # Parl's jig, in eighths: 4 bars
JR = [45, 45, 43, 40, 45, 45, 40, 45]                               # a root a half bar: Am Am G Em | Am Am Em Am
JR2 = [40, 45, 45, 45, 50, 50, 45, 45]                              # E Am Am Am Dm Dm Am Am
_q = [(72, .5), (67, .5), (72, .5), (73, .5), (75, 1), (72, 1), (79, 1.5), (77, .5), (75, .5), (73, .5), (72, 1),
      (70, .5), (72, .5), (73, .5), (75, .5), (77, .5), (75, .5), (73, 1), (72, 2), (67, 2)]
RIFF = [(m - 3, int(d * 2)) for m, d in _q] + [(R, 4)]               # the Seafarer riff (A phrygian): 3 bars
HOME = [(A4, 3), (E4, 3), (A4, 3), (B4, 3), (C5, 6), (B4, 3), (A4, 3),
        (C5, 3), (G4, 3), (C5, 3), (D5, 3), (E5, 9), (R, 3)]         # his homesick fanfare, broad: 4 bars
HR = [45, 45, 40, 40, 48, 48, 40, 40]                               # Am Am Em Em | C C E E
MINOR = {45: True, 40: True, 43: False, 48: False, 50: True, 47: True, 52: True, 46: False, 41: False}
WHISTLE = [(A4 + 24, 1), (C5 + 24, 1), (E5 + 24, 1)]
INTRO = 2; BARS = 26
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar

def drums(t, bars, vol=1.0):                                        # a galloping 12/8: war drums on every beat
    for k in range(bars):
        at = t + k * bar; last = k == bars - 1
        for j in range(4):
            S.add(at + j * 3 * e, drum('taiko', (0.5 if j % 2 == 0 else 0.38) * vol), pan=-0.1)
            S.add(at + (j * 3 + 2) * e, drum('taikohi', 0.26 * vol), pan=0.3)
            S.add(at + (j * 3 + 1) * e, drum('snare', 0.06 * vol), pan=0.15)
            if j % 2 == 1 and not (last and j == 3): S.add(at + j * 3 * e, drum('snare', 0.38 * vol), pan=0.15)
        if last: roll(S, at + 9 * e, 1, 3 * e, 0.1 * vol, 0.42 * vol, rate=6)

def gallop(t, roots, vol=1.0):                                     # strings driving in eighths, the bass galloping
    for k, r in enumerate(roots):
        at = t + k * half
        for i, iv in enumerate((0, 12, 7, 12, 7, 12)):
            S.add(at + i * e, stab(r + 12 + iv, e * 0.9, vol=0.06 * 1.5 * vol * (1 if i % 3 == 0 else 0.62)), pan=(-0.35, 0.35)[i % 2])
        for i, iv in ((0, 0), (2, 12), (3, 0), (5, 7)):
            S.add(at + i * e, slapbass((r - 12 if r >= 48 else r) + iv, e * 0.9, vol=0.28 * 0.7 * vol * (1 if i in (0, 3) else 0.8)))
        if k % 2 == 0: power(S, at, bar, r - 12, MINOR.get(r, False), vol * 0.6)

# ---------------------------------------------------------------- the jingle (once)
hit(S, 0, 45, 1.2)
seq(S, WHISTLE, e, 3 * e, lambda m, d: flute(m - 12, d * 0.85, vol=0.32), pan=0.45)      # his whistle
for iv in (0, 7, 12, 13): S.add(half, brass(57 + iv, half * 0.9, vol=0.18), pan=-0.1)     # the fanfare's chord answers
S.add(half, timpani(45, 0.4)); S.add(half, drum('taiko', 0.5))
tune(S, bar, e, [(A4, 3), (E4, 3), (A4, 3), (B4, 3)], [(brass, 0, 0.32, -0.1, 0.9), (horn, -12, 0.24, 0.2, 0.95)])
roll(S, bar, 4, 3 * e, 0.05, 0.42, rate=6)

# ---------------------------------------------------------------- A: the jig, a sea shanty for an orchestra
hit(S, B(1), 45)
tune(S, B(1), e, P1 + P2, [(horn, 0, 0.36, -0.15, 0.95), (strings, 12, 0.22, 0.25, 0.95), (brass, -12, 0.18, 0.1, 0.92)])
tune(S, B(5), e, P1 + P2, [(strings, 12, 0.32, 0.15, 0.95), (horn, 0, 0.3, -0.2, 0.95), (flute, 12, 0.14, 0.4, 0.85)])
gallop(B(1), JR + JR2); gallop(B(5), JR + JR2, 1.05); drums(B(1), 8)
S.add(B(5), cymbal(0.1, 1.5), pan=0.3)

# ---------------------------------------------------------------- B: the Seafarer riff, his old drill
hit(S, B(9), 45, 1.0)
tune(S, B(9), e, RIFF + RIFF, [(brass, 0, 0.34, -0.1, 0.88), (menchoir, -12, 0.3, 0.15, 0.9), (brass, -12, 0.2, 0.0, 0.88)])
RR = [45, 45, 41, 41, 43, 43, 45, 45, 41, 41, 40, 40]
gallop(B(9), RR, 1.05); drums(B(9), 6, 1.05)
for k in (10, 13): tune(S, B(k) + half, e, WHISTLE, [(flute, -12, 0.24, 0.5, 0.85)])

# ---------------------------------------------------------------- C: his homesick fanfare, broad (the last four bars a step up)
hit(S, B(15), 45, 1.0)
tune(S, B(15), e, HOME, [(horn, 0, 0.38, -0.15, 0.97), (strings, 12, 0.28, 0.2, 0.97), (choir, 0, 0.14, 0.0, 0.97), (brass, -12, 0.2, 0.1, 0.95)])
gallop(B(15), HR, 1.1); drums(B(15), 4, 1.1)
hit(S, B(19), 47, 1.05)
tune(S, B(19), e, [(m + 2 if m else None, d) for m, d in HOME], [(horn, 0, 0.38, -0.15, 0.97), (strings, 12, 0.3, 0.2, 0.97), (choir, 0, 0.16, 0.0, 0.97), (brass, 0, 0.22, 0.1, 0.92)])
gallop(B(19), [r + 2 for r in HR], 1.15); drums(B(19), 4, 1.15)
S.add(B(19), cymbal(0.12, 2), pan=-0.3)

# ---------------------------------------------------------------- D: the jig against the riff; back to the top
hit(S, B(23), 45, 1.05)
tune(S, B(23), e, P1 + P2, [(strings, 12, 0.3, 0.25, 0.95), (flute, 12, 0.16, 0.4, 0.85)])
tune(S, B(23), e, RIFF[:-1] + [(64, 2), (69, 2)], [(brass, -12, 0.28, -0.25, 0.88), (menchoir, -12, 0.2, -0.1, 0.9)])
gallop(B(23), JR + JR2, 1.15); drums(B(23), 4, 1.15)
for i in range(12): S.add(B(26) + i * e, timpani(45, 0.08 + 0.03 * i))

L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.24, reverb=0.2)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Boss_Parl16.ogg', loop=loop, preview='Boss_Parl16_preview.ogg', drive=3.0)
print('Boss_Parl16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
