import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import *
np.random.seed(551)
R = None
# Dread: the moment they learn Yoon was murdered (the bones laid out like a sacrifice, the skull broken from
# behind), and the uneasy stretch after it. A sting first (once); then a slow, low loop: cave drips, a
# heartbeat, a drone on a tritone (D and G sharp). Yoon's theme reduced to its first four notes, D F A and the
# "wrong" G sharp, which is held and never resolves. Strings creep up; a heartbeat quickens; then everything
# stops dead. And very faintly, low on an organ, a few notes of Juda's hymn, bent out of shape: a clue, for
# anyone who knows his theme.
bpm = 50; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 24
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
B = lambda n: t0 + (n - 1) * bar
YOON4 = [(74, 2), (77, 2), (81, 2), (80, 10)]               # D F A ... G sharp, held
JUDA_BENT = [(70, 2), (73, 2), (79, 4), (77, 2), (75, 2), (73, 4)]   # Juda's hymn's opening, corrupted

def heartbeat(t, vol=0.25):
    S.add(t, drum('kick', vol)); S.add(t, timpani(26, vol * 0.4)); S.add(t + 0.32, drum('kick', vol * 0.6))

def rumble(t, dur, vol=0.3):
    n = int(dur * SR); x = lowpass(rnd(-1, 1, n), 80) * 14
    S.add(t, x * np.sin(np.pi * np.arange(n) / n) ** 2 * vol)

def tremolo(t, notes, beats, vol=0.03, start=0.3):             # strings shivering: sixteenths, swelling
    steps = int(beats * 4)
    for i in range(steps):
        v = vol * (start + (1 - start) * i / steps)
        for m in notes: S.add(t + i * b / 4, stab(m, b / 4 * 0.95, vol=v), pan=(-0.3, 0.3)[i % 2])

# intro (once): the sting: a low cluster struck hard, a cymbal, then its ring dying away
for m in (38, 39, 44, 50): S.add(0.2, strings(m, 2 * bar - 0.5, vol=0.09))
for m in (26, 27): S.add(0.2, organ(m + 12, 2 * bar - 0.5, vol=0.08))
S.add(0.2, timpani(26, 0.6)); S.add(0.2, drum('kick', 0.5)); S.add(0.2, cymbal(0.2, 3), pan=0.2)
S.add(0.2, brass(50, 1.2, vol=0.2)); S.add(0.2, brass(56, 1.2, vol=0.16))

# ---------------------------------------------------------------- the cave, all the way through
bed_wind(S, 0, END, t0, vol=0.02, smooth=80)
t = 0.4
while t < END - 0.5: drip(S, t, rnd(0.02, 0.05)); t += rnd(0.7, 3.5)
for k in (3, 11, 22): rumble(B(k), 3 * bar, 0.25)
for m in (38, 44): S.add(B(1), strings(m, 16 * bar * 0.99, vol=0.035))      # D and G sharp: the tritone, held
S.add(B(1), organ(26, 16 * bar * 0.99, vol=0.025))

# 1-8: the heartbeat; Yoon's first four notes, the last one held, wrong
for k in range(8): heartbeat(B(1 + k), 0.2)
seq(S, YOON4, b, B(1), lambda m, d: kalimba(m, max(d * 0.6, 0.8), vol=0.2), pan=-0.2)
seq(S, YOON4, b, B(1) + 0.75 * b, lambda m, d: bell(m + 12, max(d * 0.4, 0.6), vol=0.03), pan=0.5)
seq(S, YOON4, b, B(5), lambda m, d: kalimba(m - 12, max(d * 0.6, 0.8), vol=0.2), pan=0.2)

# 9-16: the strings start to shiver and creep up; low on the organ, Juda's hymn, bent (barely there)
tremolo(B(9), (62, 63), 16, 0.025, 0.2)
tremolo(B(13), (68, 69), 16, 0.02, 0.2)
for k in range(8): heartbeat(B(9 + k), 0.2 + 0.01 * k)
seq(S, JUDA_BENT, b, B(13), lambda m, d: organ(m - 24, d * 0.97, vol=0.035))

# 17-20: the heartbeat doubles; a high cluster; then everything stops dead
for k in range(3):
    heartbeat(B(17 + k), 0.3); heartbeat(B(17 + k) + 2 * b, 0.28)
tremolo(B(17), (74, 75, 80), 12, 0.03, 0.4)
for m in (50, 56): S.add(B(17), strings(m, 3 * bar * 0.98, vol=0.05))
S.add(B(19) + 3 * b, timpani(26, 0.4))
# (bar 20: silence, but for a drip)

# 21-24: back to the drone; D, F, A on a bell... and the G sharp never comes
seq(S, [(74, 2), (77, 2), (81, 4), (R, 8)], b, B(21), lambda m, d: bell(m, max(d * 0.5, 1.0), vol=0.06), pan=-0.3)
for m in (38, 44): S.add(B(21), strings(m, 4 * bar * 0.98, vol=0.035))
for k in range(4): heartbeat(B(21 + k), 0.16)

L, Rr = snes_master(S.L, S.R, echo=0.4, fb=0.42, reverb=0.45, cutoff=7500)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Dread16.ogg', loop=loop, preview='Dread16_preview.ogg')
print('Dread16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
