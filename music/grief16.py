import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from yoon import A as YA, B as YB
np.random.seed(381)
R = None
# Grief: the village mourning Yoon, Yoon's family, and Yoon watching it unseen. (Later: Pada.)
# Yoon and Sib's music, slow and broken. Yoon's theme on a lone kalimba that stops before it ends; the
# village's lament, the Island tune's answer turned minor and sung low; Sib's counting tune on a flute,
# answered by Yoon so faintly it can hardly be heard (no one can hear a ghost); then both together, once,
# swelling, and breaking off on a chord that doesn't resolve.
C6, B5, A5, G5, F5, D6, E6, F6 = 84, 83, 81, 79, 77, 86, 88, 89
S1 = [(C6, .5), (C6, .5), (C6, .5), (R, .5), (B5, .5), (A5, .5), (G5, 1)]     # Sib's theme (as in sib.py)
S2 = [(A5, .5), (B5, .5), (C6, .5), (R, .5), (D6, .5), (C6, .5), (A5, 1)]
S3 = [(F5, .5), (G5, .5), (A5, .5), (B5, .5), (C6, 1), (R, .5), (C6, .5)]
LAMENT = [(65, 1), (64, 1), (62, 1), (64, 1), (65, 1.5), (64, .5), (62, 2)]   # the Island answer, in D minor
CH = {50: (62, 65, 69), 46: (58, 62, 65), 43: (55, 58, 62), 45: (57, 61, 64), 53: (65, 69, 72),
      48: (60, 64, 67), 41: (53, 57, 60), 44: (56, 60, 63)}
bpm = 58; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 32
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
Bn = lambda n: t0 + (n - 1) * bar

def pad(t, roots, inst=strings, vol=0.045, beats=4):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * beats * b, inst(m, beats * b * 0.98, vol=vol))

def low(t, roots, vol=0.25, beats=4):
    for k, r in enumerate(roots): S.add(t + k * beats * b, pluckbass(r - 12, beats * b * 0.9, vol=vol))

slow = lambda ph: [(m, d * 2) for m, d in ph]

# intro (once): one bell, and the mourners humming somewhere outside
S.add(0.5 * b, bell(86, 2.0, vol=0.1), pan=0.3)
for m in (50, 57): S.add(b, choir(m, (INTRO * bar - b) * 0.98, vol=0.04))

# 1-8: Yoon's theme on a lone kalimba, half speed; it lingers on the "wrong" note and stops before the end
broken = slow(YA)[:-1] + [(R, 4)]                        # the last note (home) never comes
seq(S, broken, b, Bn(1), lambda m, d: kalimba(m, max(d * 0.7, 0.8), vol=0.3), pan=-0.1)
seq(S, slow(YB[:6]), b, Bn(5), lambda m, d: kalimba(m, max(d * 0.7, 0.8), vol=0.24), pan=-0.1)   # tries again; stops
pad(Bn(1), [50, 46, 43, 45], beats=8, vol=0.04); low(Bn(1), [50, 46, 43, 45], beats=8, vol=0.2)

# 9-16: the village's lament: everyone singing the Island tune's answer, in the minor, low and slow;
# a log drum like a slow heartbeat; a flute weeping over it
for k in range(2):
    seq(S, slow(LAMENT), b, Bn(9 + 4 * k), lambda m, d: choir(m - 12, d * 0.97, vol=0.08))
    seq(S, slow(LAMENT), b, Bn(9 + 4 * k), lambda m, d: flute(m - 12, d * 0.97, vol=0.06 + 0.04 * k), pan=-0.2)
pad(Bn(9), [50, 46, 43, 45, 50, 46, 41, 45], vol=0.035); low(Bn(9), [50, 46, 43, 45, 50, 46, 41, 45])
for k in range(8): S.add(Bn(9 + k), drum('log', 0.12), pan=-0.3); S.add(Bn(9 + k) + 2 * b, drum('tom', 0.08), pan=0.2)
seq(S, [(R, 4), (81, 3), (79, 1), (77, 4), (76, 4)], b, Bn(13),
    lambda m, d: flute(m + 12, d * 0.95, vol=0.2), pan=0.3)

# 17-24: Sib's counting tune, alone, on a flute; Yoon answers so faintly you can hardly hear it
seq(S, slow(S1), b, Bn(17), lambda m, d: flute(m, d * 0.95, vol=0.3), pan=0.3)
seq(S, slow(YA[:4]), b, Bn(19), lambda m, d: bell(m + 12, max(d, 0.8), vol=0.025), pan=-0.6)   # unheard
seq(S, slow(S2), b, Bn(21), lambda m, d: flute(m, d * 0.95, vol=0.28), pan=0.3)
seq(S, slow(YA[:4]), b, Bn(23), lambda m, d: bell(m + 12, max(d, 0.8), vol=0.02), pan=-0.6)
pad(Bn(17), [53, 48, 50, 45], beats=8, vol=0.035); low(Bn(17), [53, 48, 50, 45], beats=8, vol=0.18)

# 25-32: both together, once: strings carry Yoon's theme, the flute Sib's; it swells, then breaks off
both = slow(YA + YB)[:-1]                                # 8 bars, less the last note
seq(S, both, b, Bn(25), lambda m, d: strings(m - 12, d * 0.97, vol=0.11), pan=-0.2)
seq(S, both, b, Bn(25), lambda m, d: kalimba(m, max(d * 0.6, 0.6), vol=0.12), pan=-0.4)
seq(S, slow(S1 + S2 + S3), b, Bn(25), lambda m, d: flute(m, d * 0.95, vol=0.22), pan=0.3)
roots = [50, 50, 53, 53, 50, 46, 45, 44]                  # ... and the last: B flat over A flat, unresolved
pad(Bn(25), roots, vol=0.045); pad(Bn(25), roots[:6], inst=choir, vol=0.035); low(Bn(25), roots[:7], vol=0.24)
S.add(Bn(32), strings(46 + 12, bar * 0.98, vol=0.05)); S.add(Bn(32), bell(86, 2.5, vol=0.06), pan=0.4)

L, Rr = snes_master(S.L, S.R, echo=0.34, fb=0.4, reverb=0.38)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Grief16.ogg', loop=loop, preview='Grief16_preview.ogg')
print('Grief16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
