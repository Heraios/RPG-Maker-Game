import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import *
np.random.seed(341)
# Zonfahare, the main town: the Island tune at its fullest, over a busy market. A crowd talking and haggling,
# goats, Tegue's hammer, and the telegraph hub tapping away (it spells ZONFAHARE in Morse).
# Friendly and warm: home. A quieter stretch in the middle so it doesn't wear you out.
bpm = 112; b = 60 / bpm; bar = 4 * b
INTRO = 2; BARS = 8 * 5
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar

# ---------------------------------------------------------------- the town's own sounds
def crowd(t, dur, vol=1.0, pan=0.0):           # people talking: voice-band noise, chopped into syllables
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(12) / 12, 'same') - np.convolve(x, np.ones(70) / 70, 'same')
    k = np.random.uniform(0, 1, int(dur * 5) + 2)                       # about five syllables a second
    syl = np.interp(np.arange(n) / SR * 5, np.arange(len(k)), k) ** 2
    fade = np.clip(np.arange(n) / SR / 2, 0, 1)                         # fades in; runs right to the end
    S.add(t, x * (0.25 + syl) * fade * vol * 3, pan=pan)

def goat(t, vol=0.1, pan=0.0):                 # "meh-eh-eh"
    n = int(0.7 * SR); tt = np.arange(n) / SR
    f = 380 * (1 + 0.04 * np.sign(np.sin(2 * np.pi * 9 * tt))) * (1 - 0.1 * tt)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 9))
    S.add(t, lowpass(x, 1800) * adsr(n, a=0.03, d=0.1, s=0.8, r=0.2) * vol, pan=pan)

def hammer(t, hits=4, vol=0.07):               # Tegue mending something copper: clink, clink
    for i in range(hits): S.add(t + i * b, bell(91 + (i % 2) * 2, 0.12, vol=vol), pan=0.6)

MORSE = {'Z': '--..', 'O': '---', 'N': '-.', 'F': '..-.', 'A': '.-', 'H': '....', 'R': '.-.', 'E': '.'}
def click(vol):
    n = int(0.012 * SR); return np.random.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR / 0.002) * vol
def telegraph(t, word='ZONFAHARE', unit=None, vol=0.18):
    unit = unit or b / 4
    for ch in word:
        for sym in MORSE[ch]:
            d = unit * (3 if sym == '-' else 1)
            S.add(t, click(vol), pan=-0.65); S.add(t + d, click(vol * 0.6), pan=-0.65)   # key down, key up
            t += d + unit
        t += 2 * unit
    return t

# ---------------------------------------------------------------- the band
def drums(t, bars, vol=1.0, claps=False):
    for k in range(bars):
        at = t + k * bar
        for j, kind in LOG: S.add(at + j * b, drum(kind, 0.28 * vol), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
        for j in range(8): S.add(at + j * b / 2, drum('shaker', (0.06 if j % 2 else 0.035) * vol), pan=0.45)
        if claps and k % 4 in (2, 3):
            for j in (1, 3): S.add(at + j * b, drum('clap', 0.2 * vol), pan=-0.15)

def bass(t, roots=ROOTS, vol=0.38):
    for k, r in enumerate(roots):
        at = t + k * bar; low = r - 12 if r > 40 else r
        for j, iv, d in ((0, 0, 1.5), (1.5, 7, 1), (2.5, 12, .5), (3, 7, 1)):    # a walking market bass
            S.add(at + j * b, pluckbass(low + iv, d * b * 0.9, vol=vol * (1 if j == 0 else 0.8)))

def pad(t, roots=ROOTS, inst=strings, vol=0.035):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * bar, inst(m, bar * 0.98, vol=vol))

def comp(t, roots=ROOTS, vol=0.09):            # marimba chords on the off-beats, like a strummed guitar
    for k, r in enumerate(roots):
        for j in (0.5, 1.5, 2.5, 3.5):
            for m in CH[r]: S.add(t + k * bar + j * b, marimba(m + 12, b * 0.3, vol=vol / 2), pan=0.35)

# ---------------------------------------------------------------- the track
# the market, all the way through, from left, middle and right
for pan, v in ((-0.6, 0.05), (0.0, 0.04), (0.6, 0.05)): crowd(0, END, v, pan)

# intro (once): the market, a goat, and the telegraph tapping the town's name
goat(0.5 * b, 0.08, pan=0.5)
telegraph(1.0 * b)
S.add(6 * b, drum('log', 0.3), pan=-0.3); S.add(7 * b, drum('log', 0.3), pan=0.3)
t0 = INTRO * bar

# A: the tune on marimba, the kalimba above it, the walking bass and the 3-3-2
seq(S, TUNE, b, t0, lambda m, d: marimba(m, d * 0.8, vol=0.4), pan=-0.2)
seq(S, HARM, b, t0, lambda m, d: kalimba(m, max(d, 0.4), vol=0.16), pan=0.45)
bass(t0); comp(t0); drums(t0, 8)
pad(t0, vol=0.03)

# B: the market calls: a flute (a seller) calls, the town answers in chant and marimba, with claps
t1 = t0 + 8 * bar
t = t1
for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
    t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.95, vol=0.36), pan=0.2)
    seq(S, ans, b, t, lambda m, d: marimba(m, d * 0.8, vol=0.36), pan=-0.2)
    t = seq(S, ans, b, t, lambda m, d: chant(m, d * 0.95, vol=0.07), pan=-0.1)
bass(t1); comp(t1); drums(t1, 8, claps=True)
goat(t1 + 3.5 * bar, 0.07, pan=-0.6)

# C: bustle: the answer passed around the market, over new chords; harp runs
t2 = t1 + 8 * bar
BUSY = [40, 48, 43, 38, 40, 48, 41, 43]                     # Em C G D | Em C F G
seq(S, [(m + 12, d) for m, d in ANS1 + ANS1 + CALL2 + ANS2], b, t2, lambda m, d: flute(m, d * 0.9, vol=0.28), pan=0.3)
seq(S, ANS1 + ANS1 + CALL2 + ANS2, b, t2 + b / 2, lambda m, d: marimba(m - 12, d * 0.6, vol=0.2), pan=-0.4)
for k, r in enumerate(BUSY):
    arp = list(CH[r]) + [CH[r][0] + 12]
    for j in range(8): S.add(t2 + k * bar + j * b / 2, harp(arp[(j if j < 4 else 7 - j)] + 12, b * 0.5, vol=0.07), pan=(-0.5, 0.5)[j % 2])
bass(t2, BUSY); pad(t2, BUSY, vol=0.03); drums(t2, 8, 0.9)
hammer(t2 + 2 * bar); hammer(t2 + 5 * bar + 2 * b, 3)

# D: a breather: the band drops out; a kalimba plays the tune slowly over the market and the telegraph
t3 = t2 + 8 * bar
half = [(m, d * 2) for m, d in CALL1 + ANS1]
seq(S, half, b, t3, lambda m, d: kalimba(m + 12, max(d * 0.5, 0.5), vol=0.22), pan=0.15)
for k, r in enumerate((43, 48, 40, 43, 43, 48, 38, 43)):
    for m in CH[r]: S.add(t3 + k * bar, strings(m, bar * 0.98, vol=0.03))
    S.add(t3 + k * bar, pluckbass(r - 12 if r > 40 else r, 2 * b * 0.9, vol=0.25))
    if k >= 2: S.add(t3 + k * bar, drum('log', 0.14), pan=-0.4)
telegraph(t3 + 2 * bar, vol=0.12)
goat(t3 + 5 * bar + b, 0.08, pan=0.6)
hammer(t3 + 6 * bar, 3, 0.05)
for i in range(4): S.add(t3 + 7 * bar + i * b, drum('tomhi' if i % 2 else 'log', 0.15 + 0.05 * i), pan=(-0.3, 0.3)[i % 2])

# E: everyone: the tune in marimba and flute octaves, chant on the answers, strings, the full drums
t4 = t3 + 8 * bar
seq(S, TUNE, b, t4, lambda m, d: marimba(m, d * 0.8, vol=0.4), pan=-0.2)
seq(S, TUNE, b, t4, lambda m, d: flute(m + 12, d * 0.95, vol=0.26), pan=0.25)
seq(S, HARM, b, t4, lambda m, d: kalimba(m, max(d, 0.4), vol=0.16), pan=0.5)
seq(S, ANS1, b, t4 + 2 * bar, lambda m, d: chant(m, d * 0.95, vol=0.06))
seq(S, ANS2, b, t4 + 6 * bar, lambda m, d: chant(m, d * 0.95, vol=0.06))
bass(t4); comp(t4); pad(t4, vol=0.04); drums(t4, 8, 1.05, claps=True)
S.add(t4 + 7 * bar + 3 * b, cymbal(0.05, 1.2), pan=0.3)

L, Rr = snes_master(S.L, S.R, echo=0.2, fb=0.25, reverb=0.18)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'Zonfahare16.ogg', loop=loop, preview='Zonfahare16_preview.ogg')
print('Zonfahare16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
