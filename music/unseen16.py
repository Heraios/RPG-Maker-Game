import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, ROOTS, CH, LOG, ANS1
from yoon import A as YA, B as YB, C as YC, B_end as YB_END
from ambience import crowd, telegraph, Muffle, rnd
np.random.seed(901)
R = None
# Unseen (Act 1): the Ghost drifting through Zonfahare, among people who look straight through them. The
# town's own music (the Island tune, its band, the market, the telegraph tapping ZONFAHARE), heard as if
# through glass: muffled, a hair out of tune, out of reach. In front, close and clear, Yoon's theme on a
# lone kalimba (moved up into E minor so it sits against the town's G; its "wrong" note is still wrong).
# Now and then, under the market, someone hums the village's lament for Yoon (the Island tune's answer in
# the minor, as in Grief): Yoon hears them grieving and can't answer. A few times a bell rings and for a bar
# the town comes into focus, clear: a seer has looked straight at Yoon (Old Tinerfe, Brother Tibiabin, the
# twins). And once, the town drops away: a cold low organ plays Juda's hymn, bent (as in Dread). He has seen
# the Ghost too, and says nothing.
#   1-8 the town through glass; Yoon's theme   9-16 a seer looks; the lament   17-20 a seer again
#   21-24 Juda   25-32 the town again; the lament with a flute   33-40 Yoon tries the town's tune
bpm = 96; b = 60 / bpm; bar = 4 * b
INTRO = 1; BARS = 40
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
up2 = lambda ph: [(m + 2 if m else None, d) for m, d in ph]
slow = lambda ph: [(m, d * 2) for m, d in ph]
YOON = up2(YA + YB + YC + YB_END)                                 # Yoon's theme, in E minor
LAMENT = [(79, 1), (78, 1), (76, 1), (78, 1), (79, 1.5), (78, .5), (76, 2)]   # the Island answer, in E minor
JUDA_BENT = [(70, 2), (73, 2), (79, 4), (77, 2), (75, 2), (73, 4)]       # Juda's hymn, bent (as in Dread)
glass = Muffle(S, 550, 0.75)                                      # the town, heard through glass

def band(t, bars, vol=1.0):                                        # the town's band, muffled and a hair flat
    for k in range(bars):
        r = ROOTS[k % 8]; at = t + k * bar; low = r - 12 if r > 40 else r
        for j, iv in ((0, 0), (2, 7)): glass.add(at + j * b, pluckbass(low + iv - 0.3, 1.8 * b, vol=0.3 * vol))
        for j in (0.5, 1.5, 2.5, 3.5):
            for m in CH[r]: glass.add(at + j * b, marimba(m + 12 - 0.3, b * 0.3, vol=0.04 * vol), pan=0.3)
        for j, kind in LOG: glass.add(at + j * b, drum(kind, 0.22 * vol), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    melody = [(m - 0.3, d) for m, d in TUNE] * (bars // 8 + 1)
    end = t + bars * bar; tt = t
    for m, d in melody:
        if tt >= end - 0.01: break
        glass.add(tt, marimba(m, d * b * 0.8, vol=0.32 * vol), pan=-0.2); tt += d * b

def focus(t, vol=1.0):                                             # a seer looks: a bell; the town comes clear for a bar
    S.add(t, bell(88, 1.8, vol=0.09 * vol), pan=0.5); S.add(t + 0.06, bell(95, 1.4, vol=0.04 * vol), pan=0.5)
    k = int(round((t - t0) / bar)) % 8; beats = 0; tt = t0
    for m, d in TUNE:                                              # the tune's notes in this bar, clear
        if k * 4 <= beats < (k + 1) * 4: S.add(t + (beats - k * 4) * b, marimba(m, d * b * 0.8, vol=0.22 * vol), pan=-0.2)
        beats += d
    r = ROOTS[k]
    for m in CH[r]: S.add(t, harp(m + 12, bar * 0.9, vol=0.05 * vol), pan=0.2)
    n = int(bar * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(12) / 12, 'same') - np.convolve(x, np.ones(70) / 70, 'same')
    S.add(t, x * np.sin(np.pi * np.arange(n) / n) * 0.06, pan=0.4)          # voices, for a moment, clear

kal = lambda v: (lambda m, d: kalimba(m, max(d * 0.7, 0.5), vol=v))

# the market, through the glass, all the way through; the telegraph
crowd(glass, 0, END, 1.5, 0.05, pan=-0.4); crowd(glass, 0, END, 1.5, 0.045, pan=0.4)
for at in (0.3, B(14), B(30)): telegraph(glass, at, 'ZONFAHARE', b / 4, 0.18, pan=-0.6)

# 1-8: the town through glass; Yoon's theme, slow and close
band(B(1), 8)
seq(S, slow(YOON[:9]), b, B(1), kal(0.3), pan=0.15)               # (A, slowly: 4 bars)
seq(S, slow(YOON[9:19]), b, B(5), kal(0.28), pan=0.15)

# 9-16: a seer looks; the lament hummed somewhere in the market
band(B(9), 8, 0.95)
focus(B(10))
seq(glass, slow(LAMENT) * 2, b, B(11), lambda m, d: choir(m - 12, d * 0.97, vol=0.12), pan=-0.3)
seq(S, slow(YOON[19:28]), b, B(13), kal(0.26), pan=0.15)

# 17-20: another seer (a smile, this time); Yoon's first notes, answering
band(B(17), 4, 0.95)
focus(B(18), 0.85)
seq(S, YOON[:5], b, B(19), kal(0.3), pan=0.15)

# 21-24: Juda. The town drops away; a cold organ plays his hymn, bent; Yoon goes quiet
for m in (35, 41): S.add(B(21), organ(m, 2 * bar * 0.98, vol=0.05))
seq(S, JUDA_BENT, b, B(21), lambda m, d: organ(m - 24, d * 0.95, vol=0.07))
for i in range(32): S.add(B(21) + i * b / 4, stab((64, 65)[i % 2], b / 4 * 0.9, vol=0.006 + 0.0003 * i), pan=(-0.3, 0.3)[i % 2])
S.add(B(23) + 2 * b, kalimba(76, 0.6, vol=0.15), pan=0.15)        # one small note, after

# 25-32: the town again; the lament, with a flute weeping over it; Yoon's theme
band(B(25), 8)
seq(glass, slow(LAMENT), b, B(25), lambda m, d: choir(m - 12, d * 0.97, vol=0.12), pan=-0.3)
seq(S, slow(LAMENT), b, B(29), lambda m, d: flute(m, d * 0.95, vol=0.12), pan=-0.4)
seq(S, slow(YOON[:9]), b, B(25), kal(0.26), pan=0.2)
focus(B(30), 0.7)

# 33-40: Yoon tries to join the town's song: the Island tune's answer on the kalimba, clear, over the muffled band
band(B(33), 8)
for k, at in enumerate((B(35), B(39))):
    seq(S, ANS1, b, at, kal(0.24 - 0.04 * k), pan=0.15)
seq(S, slow(YOON[:5]), b, B(37), lambda m, d: bell(m + 12, max(d * 0.4, 0.6), vol=0.03), pan=-0.5)

L, Rr = snes_master(S.L, S.R, echo=0.3, fb=0.36, reverb=0.34)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Unseen16.ogg', loop=loop, preview='Unseen16_preview.ogg', gain=0.85)
print('Unseen16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
