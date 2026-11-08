# Music for the two vehicles (RPG Maker's "boat" and "ship"):
#   Raft: the portable wicker raft, for shallow water. Unhurried: water lapping right under the wicker, the wicker
#       creaking, a pole plunging and dripping once a bar; the Island tune's answers hummed on a low flute over a
#       harp, a kalimba catching the tune now and then.
#   Canoe: the dugout canoe, for deeper water. A paddling rhythm, splash and pull on alternate sides, water rushing
#       past, a log drum keeping the stroke; the Island tune as a rowing song: called on a flute, answered by a
#       marimba and voices (as on Mansehare's boats).
# Usage: python3 vehicles16.py raft canoe   (or none for both)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from island_tune import TUNE, CALL1, ANS1, CALL2, ANS2, ROOTS, CH, LOG, HARM, chant
from ambience import lap, stream, creak, bubble, rnd
R = None

def track(bpm, bars, seed, intro=1):
    np.random.seed(seed)
    b = 60 / bpm; bar = 4 * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0):
    L, Rr = snes_master(S.L, S.R, echo=0.26, fb=0.3, reverb=0.25)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def strum(S, t, b, roots, vol=0.045, beats=4):
    for k, r in enumerate(roots):
        for j, m in enumerate(CH[r]): S.add(t + k * beats * b + j * 0.05, harp(m + 12, beats * b * 0.9, vol=vol), pan=-0.3 + j * 0.25)

# ------------------------------------------------------------------ the raft
def pole(S, t, vol=0.08):                                          # the pole goes in (a soft thunk), and drips coming out
    n = int(0.2 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 120 * (1 + 0.5 * np.exp(-tt / 0.02)) * tt) * np.exp(-tt / 0.05) + lowpass(np.random.uniform(-1, 1, n), 900) * 2 * np.exp(-tt / 0.04)
    S.add(t, x * vol, pan=-0.3)
    for i in range(3): bubble(S, t + 0.15 + i * 0.12, 0.025)

def drips(S, t, vol=0.03):
    for i in range(np.random.randint(3, 6)):
        n = int(0.05 * SR); tt = np.arange(n) / SR; f = rnd(1200, 2400) * (1 - 0.3 * tt / 0.05)
        S.add(t + i * rnd(0.08, 0.2), np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.012) * vol, pan=0.3)

def raft():
    S, b, bar, t0, END, B = track(76, 24, 1301)
    lap(S, 0, END, 1.0, 0.06, pan=0.0); stream(S, 0, END, 1.0, 0.02, pan=0.5)
    for k in range(1, 25, 2): creak(S, B(k) + rnd(0, 2 * bar), 0.035)
    for k in range(1, 25):
        pole(S, B(k) + rnd(-0.03, 0.03)); drips(S, B(k) + 2 * b)
    # 1-8: the answers hummed on a low flute; a harp
    seq(S, [(m, d * 2) for m, d in ANS1 + ANS2], b, B(1), lambda m, d: flute(m - 12, d * 0.95, vol=0.2), pan=0.15)
    strum(S, B(1), b, [43, 48, 40, 43, 41, 38, 41, 43], 0.04)
    for k, r in enumerate((43, 48, 40, 43, 41, 38, 41, 43)): S.add(B(1 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.18))
    # 9-16: the whole tune on a kalimba, unhurried
    seq(S, TUNE, b, B(9), lambda m, d: kalimba(m + 12, max(d * 0.7, 0.4), vol=0.2), pan=-0.15)
    seq(S, HARM, b, B(9), lambda m, d: flute(m - 12, d * 0.9, vol=0.08), pan=0.3)
    strum(S, B(9), b, ROOTS, 0.035)
    for k, r in enumerate(ROOTS): S.add(B(9 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.18))
    # 17-24: drifting: the call, slow, on the flute; the water
    seq(S, [(m, d * 2) for m, d in CALL1], b, B(17), lambda m, d: flute(m, d * 0.95, vol=0.16), pan=0.1)
    seq(S, [(m, d * 2) for m, d in ANS1], b, B(21), lambda m, d: kalimba(m + 12, max(d * 0.6, 0.5), vol=0.18), pan=-0.2)
    strum(S, B(17), b, [43, 43, 48, 48, 40, 40, 43, 43], 0.035)
    for k, r in enumerate((43, 48, 40, 43)): S.add(B(17 + 2 * k), pluckbass(r - 12 if r > 40 else r, 2 * bar * 0.9, vol=0.16))
    finish(S, 'Raft', t0, END, gain=0.7)

# ------------------------------------------------------------------ the dugout canoe
def stroke(S, t, vol=0.1, pan=0.0):                                 # a paddle: catch (splash) and pull (a swoosh)
    n = int(0.15 * SR); tt = np.arange(n) / SR
    S.add(t, lowpass(np.random.uniform(-1, 1, n), 2200) * 3 * np.exp(-tt / 0.04) * vol, pan=pan)
    m = int(0.5 * SR); tt = np.arange(m) / SR; x = np.random.uniform(-1, 1, m)
    x = np.convolve(x, np.ones(15) / 15, 'same') - np.convolve(x, np.ones(150) / 150, 'same')
    S.add(t + 0.08, x * np.sin(np.pi * tt / 0.5) ** 2 * vol * 3, pan=pan)

def canoe():
    S, b, bar, t0, END, B = track(96, 32, 1311)
    stream(S, 0, END, 1.0, 0.05, pan=-0.3); lap(S, 0, END, 1.0, 0.03, pan=0.4)
    for k in range(1, 33):
        for j in (0, 2): stroke(S, B(k) + j * b, 0.09, (-0.5, 0.5)[j // 2])
    def row(t, roots, vol=1.0):
        for k, r in enumerate(roots):
            at = t + k * bar; low = r - 12 if r > 40 else r
            for j, iv in ((0, 0), (1.5, 7), (2, 0), (3.5, 7)):
                S.add(at + j * b, slapbass(low + iv, b * (1.2 if j in (0, 2) else 0.4), vol=0.3 * vol))
            for j in (0, 2): S.add(at + j * b, drum('log', 0.2 * vol), pan=-0.2)
            S.add(at + 3 * b, drum('tomhi', 0.1 * vol), pan=0.3)
    # intro (once): a bosun's knock on the hull, three times
    for at in (1, 2, 3): S.add(at * b, drum('log', 0.24), pan=-0.3)
    # 1-8: the rowing song: the call on a flute, the crew answering in marimba and voices
    t = B(1)
    for call, ans in ((CALL1, ANS1), (CALL2, ANS2)):
        t = seq(S, call, b, t, lambda m, d: flute(m + 12, d * 0.92, vol=0.28), pan=0.2)
        seq(S, ans, b, t, lambda m, d: marimba(m, d * 0.8, vol=0.28), pan=-0.2)
        t = seq(S, ans, b, t, lambda m, d: chant(m - 12, d * 0.95, vol=0.07), pan=-0.1)
    row(B(1), ROOTS)
    # 9-16: the whole tune on marimba, the flute above it in harmony
    seq(S, TUNE, b, B(9), lambda m, d: marimba(m, d * 0.8, vol=0.3), pan=-0.2)
    seq(S, HARM, b, B(9), lambda m, d: flute(m + 12, d * 0.9, vol=0.14), pan=0.35)
    row(B(9), ROOTS); strum(S, B(9), b, ROOTS, 0.03)
    # 17-24: easier water: just the stroke, the answers on a kalimba
    seq(S, ANS1 + [(R, 8)] + ANS2 + [(R, 8)], b, B(17), lambda m, d: kalimba(m + 12, max(d * 0.6, 0.4), vol=0.2), pan=0.1)
    for k, r in enumerate((43, 43, 40, 43, 43, 43, 41, 43)):
        S.add(B(17 + k), pluckbass(r - 12 if r > 40 else r, bar * 0.9, vol=0.2)); S.add(B(17 + k), drum('log', 0.14), pan=-0.2)
    # 25-32: everyone: the song with voices on every answer
    seq(S, TUNE, b, B(25), lambda m, d: marimba(m, d * 0.8, vol=0.3), pan=-0.2)
    seq(S, TUNE, b, B(25), lambda m, d: flute(m + 12, d * 0.92, vol=0.2), pan=0.25)
    seq(S, ANS1, b, B(27), lambda m, d: chant(m - 12, d * 0.95, vol=0.07))
    seq(S, ANS2, b, B(31), lambda m, d: chant(m - 12, d * 0.95, vol=0.07))
    row(B(25), ROOTS, 1.1)
    finish(S, 'Canoe', t0, END, gain=0.9)

ALL = dict(raft=raft, canoe=canoe)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
