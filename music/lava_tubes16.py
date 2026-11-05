import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
np.random.seed(321)
R = None
# Lava tubes: long and mostly ambience. A low drone that breathes, the mountain rumbling, water dripping
# in the dark, lava ticking and bubbling somewhere below, a heartbeat (the Destroyer's house is waking),
# and now and then, far off, a cave-fae melody: the Children of the Caves, glimpsed, then gone.
# D double harmonic (D Eb F# G A Bb C#): beautiful and wrong.
bpm = 60; b = 60 / bpm; bar = 4 * b
BARS = 48                                            # about three minutes, then it loops
S = Stereo(BARS * bar)
DRIP = [74, 75, 78, 81, 82, 85, 86, 87, 90, 93]
FAE1 = [(81, 1.5), (82, .5), (78, 1), (75, 1), (74, 4)]
FAE2 = [(74, 1), (75, 1), (78, 1), (79, 1), (81, 2), (78, 2)]
FAE3 = [(86, 1.5), (85, .5), (82, 1), (81, 1), (78, 2), (R, 2)]
FAE4 = [(75, 1), (74, 7)]

def swell(n, a, r):                                  # fade in over a, out over r (seconds)
    t = np.arange(n) / SR
    return np.clip(t / a, 0, 1) * np.clip((n / SR - t) / r, 0, 1)

def rumble(t, dur, vol=1.0):
    n = int(dur * SR); x = lowpass(np.random.uniform(-1, 1, n), 70) * 16
    tt = np.arange(n) / SR
    S.add(t, x * swell(n, dur / 3, dur / 3) * (0.6 + 0.4 * np.sin(2 * np.pi * tt / 5.3)) * vol)

def air(t, dur, vol=1.0):                            # the hollow tube's own sound: a soft, wide hiss
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(60) / 60, 'same') - np.convolve(x, np.ones(600) / 600, 'same')
    S.add(t, x * swell(n, 4, 4) * vol * 4, pan=np.random.uniform(-0.6, 0.6))

def drone(t, roots, dur, vol=0.06):
    for m in roots:
        S.add(t, strings(m, dur, vol=vol))
        S.add(t, organ(m - 12, dur, vol=vol * 0.5))

def drip(t, vol=0.07):
    m = int(np.random.choice(DRIP)); pan = np.random.uniform(-0.9, 0.9)
    S.add(t, kalimba(m + 12, 0.3, vol=vol), pan=pan)
    S.add(t + 0.02, bell(m + 24 if m < 82 else m + 12, 0.15, vol=vol * 0.4), pan=pan)

def bloop(t, vol=0.2):                               # lava bubbling: a low sine that bends up and pops
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 70 + 160 * (tt / 0.35) ** 2
    S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.12) * vol, pan=np.random.uniform(-0.4, 0.4))

def sizzle(t, dur, vol=1.0):                         # lava ticking and hissing
    n = int(dur * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(5) / 5, 'same')
    ticks = np.zeros(n); idx = np.random.randint(0, n, int(dur * 25)); ticks[idx] = 1
    ticks = np.convolve(ticks, np.exp(-np.arange(400) / 60), 'same')
    S.add(t, x * (0.15 + ticks) * swell(n, dur / 2, dur / 2) * vol * 0.12, pan=np.random.uniform(-0.7, 0.7))

def heartbeat(t, vol=0.3):
    S.add(t, drum('kick', vol)); S.add(t + 0.5 * b, drum('kick', vol * 0.6))
    S.add(t, timpani(26, vol * 0.25))

def fae(t, phrase, vol=0.16, pan=0.5):              # far off: quiet, wide, with its own late echo
    seq(S, phrase, b, t, lambda m, d: flute(m, d * 0.95, vol=vol), pan=pan)
    seq(S, phrase, b, t + 0.75 * b, lambda m, d: kalimba(m, max(d, 0.5), vol=vol * 0.4), pan=-pan)

# the bed, all the way through: drones that change slowly, rumbles, air (overlapping, so it never stops)
plan = [(0, (38, 45)), (8, (38, 45, 50)), (16, (38, 44)), (24, (39, 46)), (28, (38, 44)),
        (32, (38, 45, 49)), (40, (38, 45)), (48, None)]
for (s, roots), (e, _) in zip(plan, plan[1:]):
    drone(s * bar, roots, (e - s) * bar + 2 * b, vol=0.05)
for k in range(0, BARS, 3): rumble(k * bar, 4 * bar, 0.35 + 0.25 * np.random.rand())
for k in range(0, BARS, 4): air(k * bar + np.random.rand() * bar, 6 * bar, 0.08)

# drips: sparse, uneven, all through (fewer when the heartbeat comes in)
t = 0.5
while t < BARS * bar - 1:
    drip(t, 0.05 + 0.04 * np.random.rand())
    gap = np.random.choice([1, 1.5, 2, 3, 4, 6]) * b
    if 16 * bar <= t < 32 * bar: gap *= 1.5
    t += gap

# lava: bubbles and hissing, mostly in the middle
for k in range(6, 44):
    if np.random.rand() < (0.6 if 14 <= k < 36 else 0.25):
        for j in range(np.random.randint(1, 4)): bloop(k * bar + np.random.choice([0, 1, 1.5, 2.5, 3]) * b + j * 0.3, 0.12)
for k in (12, 18, 22, 27, 31, 36): sizzle(k * bar, 3 * bar, 0.8)

# the heartbeat: comes in at bar 17, quickens a little, fades out by bar 34
for k in range(16, 34):
    v = 0.12 + 0.18 * min(1, (k - 16) / 6) * min(1, (34 - k) / 4)
    heartbeat(k * bar, v)
    if 22 <= k < 30: heartbeat(k * bar + 2 * b, v * 0.8)

# the Children of the Caves: a glimpse at bar 9, then a whole phrase at 35-42, then gone
fae(9 * bar, FAE1, 0.08, pan=0.7)
fae(35 * bar, FAE1 + FAE2, 0.14, pan=0.5)
fae(39 * bar, FAE3 + FAE4, 0.14, pan=-0.4)
for k, r in enumerate((38, 38, 39, 38, 38, 45, 39, 38)):
    S.add((35 + k) * bar, harp(r + 24, 2 * b, vol=0.05), pan=0.3)
    S.add((35 + k) * bar + 2 * b, harp(r + 31, 2 * b, vol=0.035), pan=-0.3)

end = BARS * bar
L, Rr = snes_master(S.L, S.R, echo=0.42, fb=0.5, reverb=0.55, cutoff=7000)
L, Rr, loop = finish_loop(L, Rr, 0, end)
save_stereo(L, Rr, 'Lava_Tubes16.ogg', loop=loop, preview='Lava_Tubes16_preview.ogg')
print('Lava_Tubes16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
