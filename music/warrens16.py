import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import drip, MORSE, rnd
np.random.seed(641)
R = None
# The Warrens: the Children of the Caves' village. Mostly ambience, like Lava_Tubes, but lived in: a warm
# drone, drips, the air in the tunnels; little feet pattering past, giggles, whispers. The Children have no
# telegraph, but they have heard one: they knock the village's name on the stone in Morse (WARRENS), a tick
# for a dot and a hollow "tonk" for a dash. And under it all, faintly, Tou's music-box minuet: they are her
# subjects. Moved down into D, her minuet starts with the same five notes as Yoon's theme (D F A G sharp A).
#   1-8 the caves; 9-16 the music box, far off; 17-24 the caves; 25-36 the Children's own song (the cave-fae
#   melody from Lava_Tubes, D double harmonic); 37-40 the caves; 41-48 the minuet nearer, the Children
#   singing it; 49-56 the music box again, running down and stopping; 57-64 the caves.
bpm = 84; b = 60 / bpm; bar = 3 * b                                # 3/4, as in Tou's minuet
BARS = 64
S = Stereo(BARS * bar)
END = BARS * bar
B = lambda n: (n - 1) * bar
T1 = [(74, 1), (77, 1), (81, 1), (80, 1.5), (81, .5), (76, 1), (77, 1), (76, 1), (74, 1), (73, 3)]   # Tou's minuet, in D
T2 = [(74, 1), (81, 1), (86, 1), (84, 1.5), (82, .5), (81, 1), (79, 1), (77, 1), (76, 1), (74, 3)]
TCH = [(38, 'm'), (40, 'M'), (46, 'M'), (45, 'M'), (38, 'm'), (41, 'M'), (48, 'M'), (38, 'm')]
FAE1 = [(81, 1.5), (82, .5), (78, 1), (75, 1), (74, 4)]                                            # the cave-fae song
FAE2 = [(74, 1), (75, 1), (78, 1), (79, 1), (81, 2), (78, 2)]
FAE3 = [(86, 1.5), (85, .5), (82, 1), (81, 1), (78, 2), (R, 2)]
FAE4 = [(75, 1), (74, 7)]

def triad(r, q): return (r + 12, r + 12 + (4 if q == 'M' else 3), r + 19)

def swell(n, a, r):
    t = np.arange(n) / SR
    return np.clip(t / a, 0, 1) * np.clip((n / SR - t) / r, 0, 1)

def air(t, dur, vol=1.0):                                          # the tunnels' own hollow hiss
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(60) / 60, 'same') - np.convolve(x, np.ones(600) / 600, 'same')
    S.add(t, x * swell(n, 4, 4) * vol * 4, pan=rnd(-0.6, 0.6))

def rumble(t, dur, vol=0.3):
    n = int(dur * SR); x = lowpass(np.random.uniform(-1, 1, n), 70) * 16
    S.add(t, x * swell(n, dur / 3, dur / 3) * vol)

def patter(t, vol=0.05):                                           # little bare feet running past
    steps = np.random.randint(8, 16); p0 = rnd(-0.9, 0.9); p1 = -p0
    for i in range(steps):
        n = int(0.025 * SR); tt = np.arange(n) / SR
        x = (np.random.uniform(-1, 1, n) + np.sin(2 * np.pi * rnd(500, 800) * tt)) * np.exp(-tt / 0.005)
        S.add(t + i * rnd(0.08, 0.11), lowpass(x, 2500) * vol * (0.6 + 0.4 * (i % 2)), pan=p0 + (p1 - p0) * i / steps)

def giggle(t, vol=0.04):                                           # tee-hee-hee
    pan = rnd(-0.8, 0.8); top = rnd(92, 98)
    for i in range(np.random.randint(4, 8)):
        S.add(t + i * 0.07, kalimba(top - (i % 2) * 2 - i // 2, 0.25, vol=vol), pan=pan)

def whisper(t, dur=1.2, vol=0.06):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(8) / 8, 'same')
    tt = np.arange(n) / SR
    S.add(t, x * np.sin(np.pi * tt / dur) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * tt)) * vol, pan=rnd(-0.8, 0.8))

def knock_morse(t, word, unit=0.13, vol=0.12, pan=0.55):           # the name, knocked on stone
    def tick(v):
        n = int(0.03 * SR); tt = np.arange(n) / SR
        return lowpass(np.random.uniform(-1, 1, n) * np.exp(-tt / 0.004) + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / 0.006), 3000) * v
    def tonk(v):
        n = int(0.3 * SR); tt = np.arange(n) / SR
        return (np.sin(2 * np.pi * 330 * tt) + 0.4 * np.sin(2 * np.pi * 830 * tt) * np.exp(-tt / 0.03)) * np.exp(-tt / 0.08) * v
    for ch in word:
        for sym in MORSE[ch]:
            S.add(t, tick(vol) if sym == '.' else tonk(vol * 0.8), pan=pan)
            t += unit * (1 if sym == '.' else 3) + unit
        t += 2 * unit
    return t

def musicbox(m, d, vol=0.2):
    x = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
    n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))

def minuet_bass(t, vol=0.05):                                      # her harp: bass on one, a chord on two and three
    for k, (r, q) in enumerate(TCH):
        at = t + k * bar
        S.add(at, harp(r + 12, b, vol=vol * 3), pan=-0.2)
        for j in (1, 2):
            for m in triad(r, q): S.add(at + j * b, harp(m + 12, b * 0.5, vol=vol), pan=(-0.4, 0.4)[j - 1])

# ---------------------------------------------------------------- the caves, all the way through
plan = [(0, (38, 45)), (16, (38, 45, 50)), (24, (38, 45)), (40, (38, 45, 50)), (56, (38, 45)), (64, None)]
for (s, roots), (e, _) in zip(plan, plan[1:]):
    for m in roots: S.add(B(s + 1), strings(m, (e - s) * bar + 2 * b, vol=0.045)); S.add(B(s + 1), organ(m - 12, (e - s) * bar + 2 * b, vol=0.02))
for k in range(0, BARS, 4): air(B(k + 1) + rnd(0, bar), 7 * bar, 0.07)
for k in (5, 21, 38, 58): rumble(B(k), 4 * bar, 0.25)
t = 0.4
while t < END - 0.5:
    drip(S, t, rnd(0.02, 0.05)); t += rnd(0.8, 3.5)
for k in range(1, BARS, 3):
    r = rnd()
    if r < 0.35: patter(B(k) + rnd(0, 2 * bar), rnd(0.03, 0.05))
    elif r < 0.6: giggle(B(k) + rnd(0, 2 * bar), rnd(0.025, 0.04))
    elif r < 0.75: whisper(B(k) + rnd(0, 2 * bar), rnd(0.8, 1.5), rnd(0.03, 0.05))
for at in (B(2), B(37) + b): knock_morse(at, 'WARRENS')

# 9-16: the music box, far off
seq(S, T1 + T2, b, B(9), lambda m, d: musicbox(m, d, 0.1), pan=-0.5)
minuet_bass(B(9), 0.02)

# 25-36: the Children's own song, the cave-fae melody, with a harp on D and A
seq(S, FAE1 + FAE2 + FAE3 + FAE4, b, B(25), lambda m, d: flute(m, d * 0.95, vol=0.16), pan=0.4)
seq(S, FAE1 + FAE2 + FAE3 + FAE4, b, B(25) + 0.75 * b, lambda m, d: kalimba(m, max(d, 0.5), vol=0.06), pan=-0.4)
for k in range(11):
    S.add(B(25 + k), harp(50 + (0, 7)[k % 2], 2 * b, vol=0.06), pan=0.3)
    S.add(B(25 + k) + 2 * b, harp(62 + (0, 3, 7)[k % 3], b, vol=0.04), pan=-0.3)
giggle(B(30), 0.035); giggle(B(36) + b, 0.04)

# 41-48: the minuet nearer; the Children singing it, wordless and high
seq(S, T1 + T2, b, B(41), lambda m, d: musicbox(m, d, 0.16), pan=-0.3)
seq(S, T1 + T2, b, B(41), lambda m, d: choir(m, d * 0.95, vol=0.07), pan=0.3)
minuet_bass(B(41), 0.035)
for k, (r, q) in enumerate(TCH):
    for m in triad(r, q): S.add(B(41 + k), strings(m, bar * 0.98, vol=0.025))

# 49-56: the music box once more, running down... and stopping
tt = B(49); slow = 1.0
for m, d in T1 + T2[:5]:
    if m: S.add(tt, musicbox(m, d * b * slow, 0.13), pan=-0.3)
    tt += d * b * slow; slow *= 1.06
for i in range(10): S.add(tt + 1.5 + i * 0.09, drum('shaker', 0.05), pan=0.3)       # ...someone winds it

L, Rr = snes_master(S.L, S.R, echo=0.42, fb=0.48, reverb=0.55, cutoff=7000)
L, Rr, loop = finish_loop(L, Rr, 0, END)
save_stereo(L, Rr, 'Warrens16.ogg', loop=loop, preview='Warrens16_preview.ogg', gain=0.6)
print('Warrens16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
