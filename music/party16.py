# Leitmotif tracks for the rest of the party (16-bit). Usage: python3 party16.py lasa juda ...
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
R = None

def triad(r, q):                      # r: a bass-octave root; q 'M' or 'm'
    return (r + 12, r + 12 + (4 if q == 'M' else 3), r + 19)

def pads(S, t, beat, chords, beats, inst=strings, vol=0.07):
    for k, (r, q) in enumerate(chords):
        for m in triad(r, q): S.add(t + k * beats * beat, inst(m, beats * beat * 0.98, vol=vol))

def finish(S, name, loop_start, end, **kw):
    L, Rr = snes_master(S.L, S.R, **kw)
    L, Rr, loop = finish_loop(L, Rr, loop_start, end)
    save_stereo(L, Rr, name + '.ogg', loop=loop, preview=name + '_preview.ogg')
    print(name, 'intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def waves(dur, vol=1.0):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(220) / 220, 'same') * 6
    t = np.arange(n) / SR
    return x * (0.35 + 0.65 * np.sin(np.pi * 2 * t / 5.5) ** 2) * adsr(n, a=1.0, r=1.0) * vol

def whisper(dur, vol=1.0):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = x - np.convolve(x, np.ones(8) / 8, 'same')
    t = np.arange(n) / SR
    return x * np.sin(np.pi * t / dur) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) * vol

# ------------------------------------------------------------------ Lasa
def lasa():
    np.random.seed(201)
    e = 0.2; bar = 6 * e                                         # 6/8, skipping
    A5, B5, Cs6, E6, Fs6, A6, Gs6, Fs5, Gs5 = 81, 83, 85, 88, 90, 93, 92, 78, 80
    L1 = [(E6, 1), (Cs6, 1), (A5, 1), (B5, 2), (Cs6, 1), (E6, 2), (Fs6, 1), (E6, 2), (R, 1),
          (A5, 1), (B5, 1), (Cs6, 1), (E6, 1), (Fs6, 1), (A6, 1), (Gs6, 3), (E6, 3)]
    L2 = [(Fs6, 1), (E6, 1), (Cs6, 1), (B5, 2), (A5, 1), (Cs6, 2), (B5, 1), (A5, 3),
          (Fs5, 1), (A5, 1), (B5, 1), (Cs6, 2), (E6, 1), (A5, 6)]
    GUILT = [(Cs6, 3), (B5, 3), (A5, 2), (Gs5, 1), (Fs5, 3), (A5, 3), (Cs6, 3), (B5, 6)]
    C1 = [(45, 'M'), (52, 'M'), (42, 'm'), (50, 'M')]; C2 = [(45, 'M'), (52, 'M'), (50, 'M'), (45, 'M')]
    CG = [(42, 'm'), (49, 'm'), (50, 'M'), (52, 'M')]
    INTRO = 2; secs = [(L1, C1), (L2, C2), (L1, C1), (L2, C2), (GUILT, CG)]
    S = Stereo((INTRO + 20) * bar)
    for j, m in enumerate((93, 97, 100, 105)): S.add(j * e, bell(m, 0.8, vol=0.12), pan=(-0.6, 0.6)[j % 2])   # a glint
    for j, m in enumerate((81, 85, 88)): S.add(bar + j * e * 2, kalimba(m, e * 2, vol=0.25), pan=0.3)
    t = INTRO * bar; t0 = t
    for idx, (mel, ch) in enumerate(secs):
        guilt = mel is GUILT
        lead = (lambda m, d: kalimba(m, d, vol=0.42)) if idx % 2 == 0 and not guilt else (lambda m, d: flute(m, d, vol=0.4))
        seq(S, mel, e, t, lead, pan=0.15 if idx % 2 else -0.15)
        if not guilt:
            seq(S, [(m, d) if m and m >= 88 else (None, d) for m, d in mel], e, t, lambda m, d: bell(m + 12, 0.6, vol=0.07), pan=0.6)
        for k, (r, q) in enumerate(ch):
            at = t + k * bar; tri = triad(r, q)
            for m in tri: S.add(at, strings(m, bar * 0.98, vol=0.06 if not guilt else 0.08))
            S.add(at, pluckbass(r - 12 + 12, 3 * e * 0.9, vol=0.33)); S.add(at + 3 * e, pluckbass(r - 5 + 12 - 12, 3 * e * 0.9, vol=0.28))
            if not guilt:
                for j in range(6): S.add(at + j * e, harp(tri[(0, 1, 2, 1, 2, 1)[j]] + 12, e, vol=0.1), pan=(-0.5, 0.5)[j % 2])
                S.add(at, drum('log', 0.3), pan=-0.3); S.add(at + 3 * e, drum('tomhi', 0.22), pan=0.3)
                for j in range(6): S.add(at + j * e, drum('shaker', 0.07), pan=0.5)
        t += 4 * bar
    finish(S, 'Lasa16', t0, t, echo=0.3, fb=0.38, reverb=0.3)

# ------------------------------------------------------------------ Juda (warm), and corrupted
JW1 = [(71, 1), (74, 1), (79, 2), (78, 1), (76, 1), (74, 2), (72, 1), (71, 1), (69, 1), (71, 1), (67, 4)]
JW2 = [(74, 1), (76, 1), (78, 1), (79, 1), (81, 2), (79, 1), (76, 1), (74, 1), (72, .5), (71, .5), (69, 1), (74, 1), (67, 4)]
JC1 = [(70, 1), (73, 1), (79, 2), (77, 1), (75, 1), (73, 2), (72, 1), (70, 1), (68, 1), (70, 1), (67, 4)]
JC2 = [(73, 1), (75, 1), (77, 1), (79, 1), (80, 2), (79, 1), (75, 1), (73, 1), (72, .5), (70, .5), (68, 1), (73, 1), (67, 4)]

def juda():
    np.random.seed(211)
    b = 60 / 66; bar = 4 * b; INTRO = 1
    CH = [(43, 'M'), (50, 'M'), (48, 'M'), (43, 'M'), (43, 'M'), (50, 'M'), (50, 'M'), (43, 'M')]
    S = Stereo((INTRO + 18) * bar)
    S.add(0, bell(79, 2.5, vol=0.18), pan=-0.2); S.add(2 * b, bell(74, 2, vol=0.1), pan=0.3)
    for m in (55, 62, 67): S.add(0, strings(m, bar * 0.98, vol=0.06))
    t0 = INTRO * bar
    def arps(t, vol=0.12):
        for k, (r, q) in enumerate(CH):
            tri = triad(r, q)
            for j in range(8): S.add(t + k * bar + j * b / 2, harp(tri[(0, 1, 2, 1)[j % 4]] + 12, b, vol=vol), pan=(-0.4, 0.4)[j % 2])
            S.add(t + k * bar, pluckbass(r - 12, 2 * b * 0.95, vol=0.32)); S.add(t + k * bar + 2 * b, pluckbass(r - 5, 2 * b * 0.95, vol=0.26))
    # A: the hymn, sung by the choir, a low flute doubling, harp arpeggios
    seq(S, JW1 + JW2, b, t0, lambda m, d: choir(m, d * 0.98, vol=0.3))
    seq(S, JW1 + JW2, b, t0, lambda m, d: flute(m - 12, d, vol=0.22), pan=0.25)
    pads(S, t0, b, CH, 4, vol=0.05); arps(t0)
    # B: the strings take it; the flute answers above
    t1 = t0 + 8 * bar
    seq(S, JW1 + JW2, b, t1, lambda m, d: strings(m, d * 0.98, vol=0.26), pan=-0.1)
    seq(S, JW1 + JW2, b, t1 + b, lambda m, d: flute(m + 12, d * 0.7, vol=0.18), pan=0.35)
    pads(S, t1, b, CH, 4, inst=choir, vol=0.04); arps(t1, 0.1)
    # coda: one faint, glassy, wrong chord (G B D# F: the Navigator Lord, hidden), then peace again
    t2 = t1 + 8 * bar
    for m in (79, 83, 87, 89): S.add(t2, bell(m, 3, vol=0.06), pan=0.4)
    S.add(t2 + 2 * b, flute(79, 2 * b, vol=0.2)); S.add(t2 + bar, choir(67, 4 * b, vol=0.2))
    for m in (55, 62, 67): S.add(t2 + bar, strings(m, bar * 0.98, vol=0.06))
    finish(S, 'Juda16', t0, t2 + 2 * bar, echo=0.32, fb=0.32, reverb=0.35)

def juda_corrupted():
    np.random.seed(221)
    b = 60 / 58; bar = 4 * b; INTRO = 1
    CH = [(43, 'm'), (49, 'M'), (44, 'M'), (43, 'm'), (43, 'm'), (49, 'M'), (44, 'M'), (43, 'm')]
    S = Stereo((INTRO + 17) * bar)
    def crackle(t, dur, vol):
        n = int(dur * SR); x = np.zeros(n); idx = np.random.randint(0, n, int(dur * 60))
        x[idx] = np.random.uniform(-1, 1, len(idx)); x = np.convolve(x, np.exp(-np.arange(200) / 30), 'same')
        S.add(t, x * vol, pan=np.random.uniform(-0.5, 0.5))
    def heartbeat(t, bars, vol=0.4):
        for k in range(bars):
            for j in (0, 0.4): S.add(t + k * bar + j * b, timpani(31, vol * (1 if j == 0 else 0.6)))
    S.add(0, bell(55, 3, vol=0.25)); S.add(0, organ(31, bar * 0.98, vol=0.3)); crackle(0, bar, 0.25)
    t0 = INTRO * bar
    # A: the hymn poisoned: organ, doubled a half-step apart (sickly), low brass, fire, a heartbeat
    seq(S, JC1 + JC2, b, t0, lambda m, d: organ(m, d * 0.97, vol=0.3), pan=-0.15)
    seq(S, JC1 + JC2, b, t0, lambda m, d: organ(m + 1, d * 0.97, vol=0.08), pan=0.3)
    seq(S, JC1 + JC2, b, t0, lambda m, d: brass(m - 24, d * 0.95, vol=0.2))
    pads(S, t0, b, CH, 4, inst=choir, vol=0.05); heartbeat(t0, 8); crackle(t0, 8 * bar, 0.2)
    for k, (r, q) in enumerate(CH): S.add(t0 + k * bar, pluckbass(r - 12, bar * 0.95, vol=0.38))
    # B: the choir sings it, dissonant; the fire louder, the heartbeat faster; bells on the tritones
    t1 = t0 + 8 * bar
    seq(S, JC1 + JC2, b, t1, lambda m, d: choir(m, d * 0.98, vol=0.3))
    seq(S, JC1 + JC2, b, t1, lambda m, d: choir(m - 6, d * 0.98, vol=0.12), pan=0.3)       # a tritone under it
    seq(S, [(m + 12 if m in (73, 80) else None, d) for m, d in JC1 + JC2], b, t1, lambda m, d: bell(m, 1.5, vol=0.12), pan=-0.4)
    pads(S, t1, b, CH, 4, vol=0.08); crackle(t1, 8 * bar, 0.32)
    for k in range(8):
        for j in (0, 0.35, 2, 2.35): S.add(t1 + k * bar + j * b, timpani(31, 0.35 if j in (0, 2) else 0.22))
        S.add(t1 + k * bar, pluckbass(CH[k][0] - 12, bar * 0.95, vol=0.38))
    finish(S, 'Juda_Corrupted16', t0, t1 + 8 * bar, echo=0.35, fb=0.38, reverb=0.4)

# ------------------------------------------------------------------ Dama
def dama():
    np.random.seed(231)
    b = 60 / 92; bar = 4 * b; INTRO = 2
    E5, Fs5, G5, A5, B5, D5, B4 = 76, 78, 79, 81, 83, 74, 71
    CALL1 = [(E5, 1), (B4, 1), (E5, 1.5), (Fs5, .5), (G5, 2), (Fs5, 1), (E5, 1)]
    ANS1 = [(D5, 1), (E5, 1), (Fs5, .5), (E5, .5), (D5, 1), (B4, 2), (E5, 2)]
    CALL2 = [(G5, 1), (A5, 1), (B5, 1.5), (A5, .5), (G5, 1), (Fs5, 1), (E5, 2)]
    ANS2 = [(D5, 1), (Fs5, 1), (E5, .5), (D5, .5), (B4, 1), (E5, 4)]
    CH = [(40, 'm'), (43, 'M'), (38, 'M'), (40, 'm'), (43, 'M'), (45, 'M'), (38, 'M'), (40, 'm')]
    S = Stereo((INTRO + 24) * bar)
    S.add(0, waves(2 * bar + 2, 0.5)); seq(S, CALL1[:4], b, bar * 0.5, lambda m, d: brass(m - 12, d * 0.95, vol=0.3), pan=-0.3)
    t0 = INTRO * bar
    def row(t, bars, vol=1.0):                       # heave on 1, pull on 3: a rowing beat
        for k in range(bars):
            r = CH[k % 8][0]; at = t + k * bar
            S.add(at, pluckbass(r - 12, 1.5 * b, vol=0.42 * vol)); S.add(at + 2 * b, pluckbass(r - 12, 1.5 * b, vol=0.32 * vol))
            S.add(at, drum('tom', 0.45 * vol), pan=-0.2); S.add(at + 2 * b, drum('tom', 0.3 * vol), pan=0.2)
            S.add(at + 1.5 * b, drum('log', 0.18 * vol), pan=0.4); S.add(at + 3.5 * b, drum('log', 0.18 * vol), pan=0.4)
    def callresp(t, call_inst, ans_inst):
        tt = t
        for c, a in ((CALL1, ANS1), (CALL2, ANS2)):
            tt = seq(S, c, b, tt, call_inst, pan=-0.25); tt = seq(S, a, b, tt, ans_inst, pan=0.25)
    # A: the call on a conch-like horn, the crew answering
    callresp(t0, lambda m, d: brass(m - 12, d * 0.95, vol=0.34), lambda m, d: choir(m - 12, d * 0.98, vol=0.32))
    pads(S, t0, b, CH, 4, vol=0.05); row(t0, 8); S.add(t0, waves(8 * bar, 0.25))
    # B: the hunt: higher, harpoon-strike stabs, timpani
    t1 = t0 + 8 * bar
    callresp(t1, lambda m, d: brass(m, d * 0.9, vol=0.3), lambda m, d: strings(m, d * 0.98, vol=0.24))
    pads(S, t1, b, CH, 4, vol=0.07); row(t1, 8, 1.15)
    for k in range(8):
        S.add(t1 + k * bar, timpani(40, 0.35))
        for m in triad(CH[k][0], CH[k][1]): S.add(t1 + k * bar + 3 * b, stab(m + 12, b * 0.3, vol=0.08))
    # C: calm water: her loyalty underneath: the answers alone on kalimba over the waves
    t2 = t1 + 8 * bar
    seq(S, ANS1 + [(R, 8)] + ANS2 + [(R, 8)], b, t2, lambda m, d: kalimba(m, d, vol=0.32), pan=0.2)
    seq(S, CALL1 + [(R, 8)] + CALL2, b, t2 + 8 * b, lambda m, d: flute(m, d, vol=0.26), pan=-0.2)
    pads(S, t2, b, CH, 4, vol=0.06); S.add(t2, waves(8 * bar, 0.45)); row(t2, 8, 0.5)
    finish(S, 'Dama16', t0, t2 + 8 * bar, echo=0.27, fb=0.3, reverb=0.25)

# ------------------------------------------------------------------ Parl
def parl():
    np.random.seed(241)
    e = 0.19; bar = 6 * e
    A5, B5, C6, D6, Ds6, E6, G5, Gs5, Fs5, E5 = 81, 83, 84, 86, 87, 88, 79, 80, 78, 76
    P1 = [(A5, 1), (C6, 1), (E6, 1), (Ds6, 1), (E6, 1), (C6, 1), (B5, 2), (G5, 1), (A5, 3),
          (E5, 1), (G5, 1), (A5, 1), (B5, 1), (C6, 1), (D6, 1), (E6, 2), (D6, 1), (B5, 3)]
    P2 = [(C6, 1), (B5, 1), (A5, 1), (Gs5, 1), (A5, 1), (B5, 1), (C6, 2), (E6, 1), (A5, 3),
          (Fs5, 1), (G5, 1), (A5, 1), (C6, 2), (B5, 1), (A5, 6)]
    HOME = [(A5, 3), (E5, 3), (A5, 3), (B5, 3), (C6, 6), (R, 6)]       # the Seafarer fanfare, slow and far away
    C1 = [(45, 'm'), (43, 'M'), (45, 'm'), (40, 'm')]; C2 = [(40, 'M'), (45, 'm'), (50, 'M'), (45, 'm')]
    CHOME = [(45, 'm'), (40, 'm'), (48, 'M'), (40, 'M')]
    S = Stereo(26 * bar)
    for j, m in enumerate((81, 84, 88)): S.add(j * e, flute(m, e * 0.9, vol=0.3), pan=0.3)    # a whistle
    S.add(3 * e, drum('clap', 0.25)); S.add(5 * e, drum('clap', 0.2))
    t0 = bar
    def jig(t, chords, vol=1.0):
        for k, (r, q) in enumerate(chords):
            at = t + k * bar; tri = triad(r, q)
            S.add(at, pluckbass(r - 12, 2 * e, vol=0.38 * vol)); S.add(at + 3 * e, pluckbass(r - 5, 2 * e, vol=0.3 * vol))
            for j in (1, 2, 4, 5):
                for m in tri: S.add(at + j * e, harp(m, e, vol=0.05 * vol), pan=(-0.4, 0.4)[j % 2])
            S.add(at, drum('log', 0.3 * vol), pan=-0.3); S.add(at + 3 * e, drum('log', 0.22 * vol), pan=0.3)
            for j in range(6): S.add(at + j * e, drum('shaker', 0.07 * vol), pan=0.5)
    t = t0
    for mel, ch, lead in ((P1, C1, 'f'), (P2, C2, 'f'), (P1, C1, 'm'), (P2, C2, 'm')):
        for half in range(2):
            pass
        st = t
        t = seq(S, mel, e, st, (lambda m, d: flute(m, d * 0.85, vol=0.4)) if lead == 'f' else (lambda m, d: marimba(m, d, vol=0.45)), pan=0.1)
        if lead == 'm': seq(S, mel, e, st + e, lambda m, d: flute(m + 12, d * 0.4, vol=0.12), pan=0.5)
        jig(st, ch + ch if len(mel) > 18 else ch)
    st = t
    t = seq(S, HOME, e, st, lambda m, d: flute(m - 12, d, vol=0.34))
    pads(S, st, e, CHOME, 6, vol=0.08)
    for k in range(4): S.add(st + k * bar, pluckbass(CHOME[k][0] - 12, 6 * e * 0.95, vol=0.28))
    finish(S, 'Parl16', t0, t, echo=0.25, fb=0.28, reverb=0.2)

# ------------------------------------------------------------------ Tou
def tou():
    np.random.seed(251)
    b = 60 / 84; bar = 3 * b
    E5, G5, B5, As5, Fs5, Ds5, E6, D6, C6, A5 = 76, 79, 83, 82, 78, 75, 88, 86, 84, 81
    T1 = [(E5, 1), (G5, 1), (B5, 1), (As5, 1.5), (B5, .5), (Fs5, 1), (G5, 1), (Fs5, 1), (E5, 1), (Ds5, 3)]
    T2 = [(E5, 1), (B5, 1), (E6, 1), (D6, 1.5), (C6, .5), (B5, 1), (A5, 1), (G5, 1), (Fs5, 1), (E5, 3)]
    C1 = [(40, 'm'), (42, 'M'), (48, 'M'), (47, 'M')]; C2 = [(40, 'm'), (43, 'M'), (50, 'M'), (40, 'm')]
    S = Stereo(30 * bar)
    def wind(t, clicks=10, vol=0.15):                       # a music box being wound
        for i in range(clicks): S.add(t + i * 0.09, drum('shaker', vol), pan=0.2)
    def musicbox(m, d, vol=0.32):
        x = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
        n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))
    wind(0); t0 = 1.2
    def minuet(t, chords, vol=1.0):
        for k, (r, q) in enumerate(chords):
            at = t + k * bar; tri = triad(r, q)
            S.add(at, harp(r, b, vol=0.28 * vol))
            for j in (1, 2):
                for m in tri: S.add(at + j * b, harp(m, b * 0.5, vol=0.06 * vol), pan=(-0.4, 0.4)[j - 1])
    # A: the music box plays her minuet
    t = seq(S, T1 + T2, b, t0, lambda m, d: musicbox(m, d))
    minuet(t0, C1 + C2, 0.8)
    # B: the court: flute and choir take it, strings, a soft timpani on the ones
    t1 = t
    t = seq(S, T1 + T2, b, t1, lambda m, d: flute(m, d, vol=0.38), pan=0.15)
    seq(S, T1 + T2, b, t1, lambda m, d: choir(m - 12, d * 0.98, vol=0.14), pan=-0.2)
    pads(S, t1, b, C1 + C2, 3, vol=0.06); minuet(t1, C1 + C2)
    for k in range(8): S.add(t1 + k * bar, timpani(40, 0.2))
    # C: lonely: the music box alone, slowing as it runs down... and stopping. Then it is wound again.
    t2 = t; tt = t2; slow = 1.0
    for m, d in T1:
        if m: S.add(tt, musicbox(m, d * b * slow, 0.3))
        tt += d * b * slow; slow *= 1.07
    wind(tt + 0.6, 12, 0.13)
    end = tt + 0.6 + 12 * 0.09 + 0.15
    finish(S, 'Tou16', t0, end, echo=0.3, fb=0.35, reverb=0.32)

# ------------------------------------------------------------------ Falmi
def falmi():
    np.random.seed(261)
    b = 60 / 128; bar = 2 * b
    F5, G5, A5, Bb5, B5, C6, D6, E5, F6 = 77, 79, 81, 82, 83, 84, 86, 76, 89
    GROW = [[(F5, .5), (A5, .5)], [(F5, .5), (A5, .5), (C6, .5)], [(F5, .5), (A5, .5), (C6, .5), (F6, 1.5)]]
    F1 = [(C6, .5), (A5, .5), (F5, .5), (A5, .5), (C6, 1), (D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, .5), (A5, .5), (F5, 2)]
    F2 = [(D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, 1), (C6, 1), (A5, .5), (F5, .5), (G5, .5), (E5, .5), (F5, 2)]
    FLUSTER = [(F5, .5), (A5, .5), (C6, .5), (B5, .5), (C6, .5), (R, .5), (A5, .25), (A5, .25), (A5, .5),
               (F5, 1), (R, 1), (G5, .25), (A5, .25), (Bb5, .5), (A5, 1)]                # Tou's tune, stumbled over
    CF = [(41, 'M'), (41, 'M'), (46, 'M'), (41, 'M'), (46, 'M'), (48, 'M'), (48, 'M'), (41, 'M')]
    S = Stereo(52 * bar)
    t = 0
    for i, g in enumerate(GROW):                                          # sprouting, a note longer each time
        t = seq(S, g, b, t, lambda m, d: kalimba(m, d, vol=0.35), pan=0.2) + b * 0.5
        S.add(t - b * 0.5, strings(53 + i * 4, b * 1.5, vol=0.05))
    t0 = t
    def groove(t, bars, vol=1.0):
        for k in range(bars):
            r, q = CF[k % 8]; at = t + k * bar
            S.add(at, slapbass(r - 12, b * 0.8, vol=0.4 * vol)); S.add(at + b, slapbass(r - 5, b * 0.8, vol=0.32 * vol))
            for m in triad(r, q): S.add(at + 0.5 * b, marimba(m + 12, b * 0.3, vol=0.06 * vol)); S.add(at + 1.5 * b, marimba(m + 12, b * 0.3, vol=0.06 * vol))
            S.add(at, drum('tom', 0.38 * vol), pan=-0.2); S.add(at + b, drum('log', 0.3 * vol), pan=0.3)
            S.add(at + 1.5 * b, drum('clap', 0.18 * vol))
            for j in range(4): S.add(at + j * b / 2, drum('shaker', 0.08 * vol), pan=0.5)
    t = seq(S, F1 + F2 + F1 + F2, b, t0, lambda m, d: marimba(m, d * 0.9, vol=0.48), pan=-0.15)
    seq(S, F1 + F2 + F1 + F2, b, t0, lambda m, d: flute(m - 12, d, vol=0.18), pan=0.3)
    groove(t0, 16)
    t1 = t
    t = seq(S, F1 + F2 + F1 + F2, b, t1, lambda m, d: flute(m, d * 0.9, vol=0.42), pan=0.15)
    seq(S, F1 + F2 + F1 + F2, b, t1 + b / 2, lambda m, d: kalimba(m + 12, d * 0.4, vol=0.12), pan=-0.45)
    pads(S, t1, b, CF + CF, 2, vol=0.05); groove(t1, 16, 1.15)
    t2 = t
    t = seq(S, FLUSTER, b, t2, lambda m, d: bell(m + 12, max(d, .3) * b, vol=0.2), pan=0.3)
    seq(S, FLUSTER, b, t2, lambda m, d: kalimba(m, d, vol=0.3), pan=-0.2)
    for k in range(4): S.add(t2 + k * bar, pluckbass(41 - 12 if k % 2 == 0 else 46 - 12, bar * 0.9, vol=0.3))
    S.add(t, drum('tomhi', 0.25)); t += bar
    for g in GROW:
        t = seq(S, g, b, t, lambda m, d: kalimba(m, d, vol=0.3), pan=0.2) + b * 0.5
    finish(S, 'Falmi16', t0, t, echo=0.22, fb=0.26, reverb=0.18)

# ------------------------------------------------------------------ Patience
def patience():
    np.random.seed(271)
    b = 60 / 116; bar = 2 * b
    C5, D5, E5, G5, A5, C6 = 72, 74, 76, 79, 81, 84
    PA1 = [(G5, .5), (E5, .5), (G5, .5), (A5, .5), (G5, 1), (E5, 1), (C5, .5), (D5, .5), (E5, .5), (G5, .5), (A5, 1), (G5, 1)]
    PA2 = [(C6, .5), (A5, .5), (G5, .5), (E5, .5), (D5, 1), (G5, 1), (E5, .5), (D5, .5), (C5, .5), (D5, .5), (C5, 2)]
    WAIT = [(74, 2), (77, 1), (81, 1), (80, 2), (81, 2), (R, 4), (74, 2), (77, 1), (81, 1), (80, 4)]   # Yoon's theme, slow
    CP = [(48, 'M'), (48, 'M'), (45, 'm'), (43, 'M'), (48, 'M'), (43, 'M'), (45, 'm'), (48, 'M')]
    S = Stereo(40 * bar)
    S.add(0, drum('log', 0.4), pan=-0.4); S.add(0.25 * b, drum('log', 0.35), pan=-0.4)     # woof woof
    t0 = bar
    def trot(t, bars, vol=1.0):
        for k in range(bars):
            r, q = CP[k % 8]; at = t + k * bar
            S.add(at, pluckbass(r - 12, b * 0.6, vol=0.38 * vol)); S.add(at + b, pluckbass(r - 5, b * 0.6, vol=0.3 * vol))
            for m in triad(r, q): S.add(at + 0.5 * b, harp(m, b * 0.4, vol=0.06 * vol)); S.add(at + 1.5 * b, harp(m, b * 0.4, vol=0.06 * vol))
            S.add(at, drum('tom', 0.3 * vol), pan=-0.2); S.add(at + b, drum('tomhi', 0.22 * vol), pan=0.2)
            for j in range(4): S.add(at + j * b / 2, drum('shaker', 0.08 * vol), pan=0.5)
            if k % 4 == 3: S.add(at + 1.5 * b, drum('log', 0.35 * vol), pan=-0.5); S.add(at + 1.75 * b, drum('log', 0.3 * vol), pan=-0.5)   # barks
    t = seq(S, PA1 + PA2, b, t0, lambda m, d: flute(m, d * 0.85, vol=0.4), pan=0.15)        # a whistle
    seq(S, PA1 + PA2, b, t0, lambda m, d: kalimba(m - 12, d * 0.6, vol=0.18), pan=-0.3)
    trot(t0, 8)
    t1 = t
    t = seq(S, PA1 + PA2, b, t1, lambda m, d: marimba(m, d * 0.85, vol=0.46), pan=-0.15)
    seq(S, PA1 + PA2, b, t1 + b / 4, lambda m, d: flute(m + 12, d * 0.4, vol=0.12), pan=0.45)
    trot(t1, 8, 1.1)
    t2 = t
    t = seq(S, PA1 + PA2, b, t2, lambda m, d: flute(m, d * 0.85, vol=0.38), pan=0.15)
    seq(S, PA1 + PA2, b, t2, lambda m, d: marimba(m - 12, d * 0.85, vol=0.22), pan=-0.3)
    trot(t2, 8)
    t3 = t                                                   # the dog who waited: Yoon's theme, alone, slowly
    t = seq(S, WAIT, b, t3, lambda m, d: harp(m, d * 1.2, vol=0.3), pan=0.1)
    for k, m in enumerate((50, 53, 50, 45)): S.add(t3 + k * 2 * bar, strings(m + 12, 2 * bar * 0.98, vol=0.06))
    S.add(t, drum('log', 0.35), pan=-0.4); S.add(t + 0.25 * b, drum('log', 0.3), pan=-0.4); t += bar
    finish(S, 'Patience16', t0, t, echo=0.24, fb=0.28, reverb=0.2)

# ------------------------------------------------------------------ Aday
def aday():
    np.random.seed(281)
    b = 60 / 112; bar = 4 * b
    G5, A5, B5, C6, D6, E6, F6, F5, E5, D5 = 79, 81, 83, 84, 86, 88, 89, 77, 76, 74
    AD1 = [(G5, .5), (B5, .5), (D6, 1), (C6, .5), (B5, .5), (A5, 1), (F5, 1), (G5, 2),
           (B5, .5), (C6, .5), (D6, .5), (E6, .5), (F6, 1), (E6, .5), (D6, .5), (C6, 2), (D6, 2)]
    AD2 = [(G5, 1), (A5, .5), (B5, .5), (C6, 1), (D6, 1), (F5, 2), (E5, 1), (D5, 1),
           (E5, .5), (F5, .5), (G5, .5), (A5, .5), (B5, 1), (F5, 1), (G5, 4)]
    CA = [(43, 'M'), (41, 'M'), (41, 'M'), (48, 'M'), (43, 'M'), (41, 'M'), (45, 'm'), (43, 'M')]
    MORSE = '.- -.. .- -.--'                                  # A D A Y
    S = Stereo(27 * bar)
    def tap(t, vol=0.2):
        tt = t
        for ch in MORSE:
            if ch == ' ': tt += 0.5 * b; continue
            d = 0.25 * b if ch == '.' else 0.6 * b
            S.add(tt, bell(96, d, vol=vol * 0.5) [:int(d * SR)], pan=0.5); tt += d + 0.2 * b
        return tt
    tap(0, 0.28); t0 = 2 * bar
    def clockwork(t, bars, vol=1.0):
        for k in range(bars):
            r, q = CA[k % 8]; at = t + k * bar; tri = triad(r, q)
            for j in range(16): S.add(at + j * b / 4, marimba((tri + (tri[0] + 12,))[(0, 2, 1, 3)[j % 4]] + 12, b / 4, vol=0.07 * vol), pan=(-0.45, 0.45)[j % 2])
            S.add(at, pluckbass(r - 12, b * 0.9, vol=0.36 * vol)); S.add(at + 2 * b, pluckbass(r - 5, b * 0.9, vol=0.3 * vol))
    def island(t, bars):
        for k in range(bars):
            for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')): S.add(t + k * bar + j * b, drum(kind, 0.3), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    def seafarer(t, bars):
        for k in range(bars):
            S.add(t + k * bar, drum('kick', 0.35))
            for j, v in ((1, 0.22), (3, 0.22), (3.5, 0.12)): S.add(t + k * bar + j * b, drum('snare', v), pan=0.15)
    mel = AD1 + AD2
    # A: island side: marimba tune, island drums, the telegraph ticking
    t = seq(S, mel, b, t0, lambda m, d: marimba(m, d * 0.85, vol=0.45), pan=-0.15)
    clockwork(t0, 8); island(t0, 8); tap(t0 + 3.5 * bar)
    # B: grandpa's side: bronze brass, the Seafarer snare
    t1 = t
    t = seq(S, mel, b, t1, lambda m, d: brass(m - 12, d * 0.85, vol=0.3), pan=-0.1)
    clockwork(t1, 8, 0.8); seafarer(t1, 8); tap(t1 + 7 * bar)
    # C: both halves at once: more, not less
    t2 = t
    t = seq(S, AD1, b, t2, lambda m, d: marimba(m, d * 0.85, vol=0.4), pan=-0.3)
    seq(S, AD1, b, t2, lambda m, d: brass(m - 12, d * 0.85, vol=0.24), pan=0.3)
    clockwork(t2, 4); island(t2, 4); seafarer(t2, 4); tap(t2 + 3 * bar, 0.3)
    finish(S, 'Aday16', t0, t2 + 4 * bar, echo=0.22, fb=0.25, reverb=0.18)

# ------------------------------------------------------------------ Kathrout
def kathrout():
    np.random.seed(291)
    b = 60 / 124; bar = 4 * b
    A5, B5, C6, D6, E6, Fs6, G5, Fs5, E5 = 81, 83, 84, 86, 88, 90, 79, 78, 76
    K1 = [(A5, .5), (B5, .5), (C6, .5), (E6, .5), (D6, 1), (B5, 1), (C6, .5), (B5, .5), (A5, .5), (G5, .5), (A5, 2),
          (E5, .5), (Fs5, .5), (G5, .5), (A5, .5), (B5, .5), (C6, .5), (D6, .5), (E6, .5), (Fs6, 2), (E6, 1), (R, 1)]
    K2 = [(D6, 1), (C6, .5), (B5, .5), (A5, 1), (G5, 1), (Fs5, 1), (G5, .5), (A5, .5), (B5, 2),
          (C6, .5), (D6, .5), (E6, .5), (C6, .5), (B5, 1), (G5, 1), (A5, 4)]
    CK = [(45, 'm'), (45, 'm'), (50, 'M'), (50, 'M'), (43, 'M'), (40, 'm'), (48, 'M'), (45, 'm')]
    S = Stereo(30 * bar)
    def scribble(t, bars, vol=1.0):                           # a quill: fast plucked strings
        for k in range(bars):
            r, q = CK[k % 8]; tri = triad(r, q); at = t + k * bar
            for j in range(16): S.add(at + j * b / 4, harp(tri[(0, 1, 2, 1)[j % 4]] + 12, b / 4, vol=0.06 * vol), pan=(-0.5, 0.5)[(j // 2) % 2])
            S.add(at, pluckbass(r - 12, b * 0.9, vol=0.35 * vol)); S.add(at + 2 * b, pluckbass(r - 5, b * 0.9, vol=0.28 * vol))
    for j in range(8): S.add(j * b / 4, harp(69 + (0, 4, 7, 4)[j % 4] + 12, b / 4, vol=0.1), pan=(-0.5, 0.5)[j % 2])
    t0 = 2 * b
    mel = K1 + K2
    t = seq(S, mel, b, t0, lambda m, d: flute(m, d * 0.9, vol=0.42), pan=0.15)
    scribble(t0, 8); pads(S, t0, b, CK, 4, vol=0.04)
    for k in range(8): S.add(t0 + k * bar + 3 * b, drum('shaker', 0.1), pan=0.5)
    # the voices: her informants, the crying coast: the tune half-remembered in echoes, whispers around it
    t1 = t
    t = seq(S, K1, b, t1, lambda m, d: bell(m, max(d, .4) * b, vol=0.14), pan=-0.3)
    seq(S, K1, b, t1 + b * 0.75, lambda m, d: choir(m - 12, d * 0.9, vol=0.12), pan=0.4)
    for i in range(6): S.add(t1 + i * 0.66 * bar, whisper(1.1, 0.12), pan=np.random.uniform(-0.8, 0.8))
    pads(S, t1, b, CK[:4], 4, inst=choir, vol=0.04)
    # she learns from them: the island drums join her own quill
    t2 = t
    t = seq(S, mel, b, t2, lambda m, d: marimba(m, d * 0.85, vol=0.44), pan=-0.15)
    seq(S, mel, b, t2, lambda m, d: flute(m + 12, d * 0.9, vol=0.16), pan=0.35)
    scribble(t2, 8, 0.8)
    for k in range(8):
        for j, kind in ((0, 'tom'), (1.5, 'log'), (3, 'tomhi')): S.add(t2 + k * bar + j * b, drum(kind, 0.28), pan=(-0.3, 0.3, 0.1)[int(j) % 3])
    finish(S, 'Kathrout16', t0, t, echo=0.24, fb=0.3, reverb=0.22)

ALL = dict(lasa=lasa, juda=juda, juda_corrupted=juda_corrupted, dama=dama, parl=parl, tou=tou,
           falmi=falmi, patience=patience, aday=aday, kathrout=kathrout)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
