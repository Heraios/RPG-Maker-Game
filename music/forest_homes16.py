# The forest homes: the Lady of the Woods' people (and one disputed ruin). All on Falmi's theme, the Lady's tune.
#   Maiden_Spring: the Stream Maidens' home (herb lore, a spirit-talking healer). Running water, drips, birds;
#       the Maidens singing the theme wordlessly, in rounds, so it flows like the spring; a harp like water.
#   Childrens_Garden: the herb beds where the forest people grow their children, imps half-sprouted in the soil.
#       Whispers and giggles, bees, leaves; little sprouting pops; the theme tiny and fragile on a music box,
#       its notes sometimes not quite there.
#   Boars_Wallow: the Boar-Men's warrior camp. Mud, heavy drums, snorts, cheering; the theme as a stomp on low
#       brass; a contest of strength (grunts, a drum roll, a roar of cheering).
#   Owl_Towers: the First Sailor ruins where the Owls of Ill Omen perch, their loyalty disputed between the Lady
#       and Queen Tou. The two themes at war: Falmi's (F major) and Tou's minuet (E minor), a semitone apart,
#       first in turns, then over each other, out of step; the owls screech; then both stop, and an owl hoots.
# Usage: python3 forest_homes16.py spring garden wallow owls   (or none for all)
import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import stream, drip, trill, bed_wind, owl, rnd
from ambience import crowd, creak, bee, twinkle
R = None
F5, G5, A5, Bb5, C6, D6, E5, F6 = 77, 79, 81, 82, 84, 86, 76, 89
F1 = [(C6, .5), (A5, .5), (F5, .5), (A5, .5), (C6, 1), (D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, .5), (A5, .5), (F5, 2)]
F2 = [(D6, .5), (C6, .5), (Bb5, .5), (A5, .5), (G5, 1), (C6, 1), (A5, .5), (F5, .5), (G5, .5), (E5, .5), (F5, 2)]
THEME = F1 + F2                                                   # 16 beats
GROW = [[(F5, .5), (A5, .5)], [(F5, .5), (A5, .5), (C6, .5)], [(F5, .5), (A5, .5), (C6, .5), (F6, 1.5)]]
FR = [41, 46, 48, 41]                                             # F Bb C F, a chord per 4 beats of the theme
CH = {41: (53, 57, 60), 46: (58, 62, 65), 48: (60, 64, 67), 40: (52, 55, 59), 42: (54, 58, 61), 47: (59, 63, 66),
      43: (55, 59, 62), 50: (62, 66, 69), 'em': (52, 55, 59)}
T1 = [(76, 1), (79, 1), (83, 1), (82, 1.5), (83, .5), (78, 1), (79, 1), (78, 1), (76, 1), (75, 3)]   # Tou's minuet
T2 = [(76, 1), (83, 1), (88, 1), (86, 1.5), (84, .5), (83, 1), (81, 1), (79, 1), (78, 1), (76, 3)]
slow = lambda ph: [(m, d * 2) for m, d in ph]

def track(bpm, bars, seed, intro=1, beats=4):
    np.random.seed(seed)
    b = 60 / bpm; bar = beats * b
    S = Stereo((intro + bars) * bar); t0 = intro * bar
    return S, b, bar, t0, (intro + bars) * bar, (lambda n: t0 + (n - 1) * bar)

def finish(S, name, t0, end, gain=1.0, **kw):
    m = dict(echo=0.3, fb=0.36, reverb=0.32); m.update(kw)
    L, Rr = snes_master(S.L, S.R, **m)
    L, Rr, loop = finish_loop(L, Rr, t0, end)
    save_stereo(L, Rr, name + '16.ogg', loop=loop, preview=name + '16_preview.ogg', gain=gain)
    print(name + '16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))

def chords(S, t, span, roots, inst=strings, vol=0.03):
    for k, r in enumerate(roots):
        for m in CH[r]: S.add(t + k * span, inst(m, span * 0.98, vol=vol))

def giggle(S, t, vol=0.05):
    pan = rnd(-0.8, 0.8); top = rnd(93, 98)
    for i in range(np.random.randint(4, 7)): S.add(t + i * 0.065, kalimba(top - (i % 2) * 2 - i // 2, 0.2, vol=vol), pan=pan)

def whisper(S, t, dur=1.0, vol=0.04):
    n = int(dur * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(8) / 8, 'same')
    tt = np.arange(n) / SR
    S.add(t, x * np.sin(np.pi * tt / dur) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * tt)) * vol, pan=rnd(-0.8, 0.8))

# ------------------------------------------------------------------ the Maiden's Spring
def spring():
    S, b, bar, t0, END, B = track(72, 32, 1001)
    stream(S, 0, END, 1.0, 0.05, pan=-0.3); stream(S, 0, END, 1.0, 0.035, pan=0.5)
    t = 0.4
    while t < END - 0.5: drip(S, t, rnd(0.03, 0.05)); t += rnd(0.5, 2.0)
    for k in range(1, 33, 3):
        if rnd() < 0.6: trill(S, B(k) + rnd(0, 2 * bar), rnd(0.03, 0.045))
    def water(t, roots):                                          # the harp like water: rippling arpeggios
        for k, r in enumerate(roots):
            for j in range(8): S.add(t + k * 2 * bar + j * b, harp(CH[r][(0, 1, 2, 1)[j % 4]] + (12, 24)[j // 4], b * 1.5, vol=0.045), pan=(-0.5, 0.5)[j % 2])
    # 1-8: the spring, and the harp
    water(B(1), FR); chords(S, B(1), 2 * bar, FR, vol=0.025)
    # 9-16: one Maiden sings the theme, slow and wordless
    seq(S, slow(THEME), b, B(9), lambda m, d: choir(m - 12, d * 0.97, vol=0.13), pan=-0.2)
    water(B(9), FR); chords(S, B(9), 2 * bar, FR, vol=0.025)
    for k, r in enumerate(FR): S.add(B(9 + 2 * k), pluckbass(r - 12, 2 * bar * 0.9, vol=0.16))
    # 17-24: the others join in a round, two bars behind each other, flowing
    for i, (lag, oct_, pan) in enumerate(((0, -12, -0.4), (2, 0, 0.3), (4, -12, 0.0))):
        seq(S, slow(THEME)[:20 - 4 * i] if i else slow(THEME), b, B(17) + lag * bar, lambda m, d, o=oct_: choir(m + o, d * 0.97, vol=0.1), pan=pan)
    water(B(17), FR); chords(S, B(17), 2 * bar, FR, vol=0.03)
    for k, r in enumerate(FR): S.add(B(17 + 2 * k), pluckbass(r - 12, 2 * bar * 0.9, vol=0.16))
    # 25-32: the healer: a flute plays the theme gently over the water; the sprout on bells at the end
    seq(S, slow(THEME), b, B(25), lambda m, d: flute(m, d * 0.95, vol=0.16), pan=0.2)
    water(B(25), FR); chords(S, B(25), 2 * bar, FR, vol=0.025)
    t = B(31)
    for g in GROW: t = seq(S, g, b, t, lambda m, d: bell(m + 12, max(d, 0.6), vol=0.05), pan=-0.4)
    finish(S, 'Maiden_Spring', t0, END, gain=0.67, echo=0.34, fb=0.4, reverb=0.4)

# ------------------------------------------------------------------ the Children's Garden
def garden():
    S, b, bar, t0, END, B = track(80, 32, 1011)
    n = int(END * SR); x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(5) / 5, 'same')
    k_ = np.random.uniform(0, 1, int(END * 3) + 2); flick = np.interp(np.arange(n) / SR * 3, np.arange(len(k_)), k_) ** 2
    S.add(0, x * (0.2 + flick) * 0.05, pan=0.2)                                # leaves stirring over the beds
    bed_wind(S, 0, END, 1.0, vol=0.055, smooth=40)
    for m in (41, 48): S.add(0, strings(m + 12, END + 2 * b, vol=0.02))
    for k in range(1, 33, 3):
        if rnd() < 0.6: bee(S, B(k) + rnd(0, 2 * bar), rnd(2.5, 4), 0.02)
        if rnd() < 0.6: giggle(S, B(k) + rnd(0, 2 * bar), rnd(0.03, 0.05))
        if rnd() < 0.5: whisper(S, B(k) + rnd(0, 2 * bar), rnd(0.7, 1.3), 0.035)
        if rnd() < 0.6: trill(S, B(k) + rnd(0, 2 * bar), 0.03)
    def pop(t, vol=0.06):                                          # a sprout opening
        m = int(0.08 * SR); tt = np.arange(m) / SR; f = rnd(500, 900) * (1 + 1.5 * tt / 0.08)
        S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.02) * vol, pan=rnd(-0.8, 0.8))
    for k in range(1, 33):
        if rnd() < 0.5: pop(B(k) + rnd(0, bar), rnd(0.03, 0.06))
    def musicbox(m, d, vol=0.14):
        x_ = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
        nn = max(len(x_), len(y)); return np.pad(x_, (0, nn - len(x_))) + np.pad(y, (0, nn - len(y)))
    # 1-8: the sprout, again and again, on pizzicato-ish kalimba, tiny
    for k in range(4):
        t = B(1 + 2 * k)
        for g in GROW[:1 + k % 3]: t = seq(S, g, b, t, lambda m, d: kalimba(m + 12, 0.3, vol=0.12), pan=rnd(-0.6, 0.6)) + b / 2
    chords(S, B(1), 4 * bar, [41, 46], vol=0.02)
    # 9-16: the theme, tiny and fragile, on a music box; some notes not quite there
    t = B(9)
    for i, (m, d) in enumerate(slow(THEME)):
        if i % 5 != 3: S.add(t, musicbox(m, d * b, 0.13 if i % 2 else 0.16), pan=0.2)
        t += d * b
    chords(S, B(9), 2 * bar, FR, vol=0.022)
    # 17-24: a twinkle of bells, giggles answering each phrase of the theme on a high flute
    for k in range(4):
        seq(S, THEME[4 * k:4 * k + 4], b, B(17 + 2 * k), lambda m, d: flute(m + 12, d * 0.8, vol=0.08), pan=0.4)
        giggle(S, B(18 + 2 * k), 0.045)
    chords(S, B(17), 2 * bar, FR, vol=0.022)
    # 25-32: the music box again, slower, and the sprout at the very end
    t = B(25)
    for i, (m, d) in enumerate(slow(F1)):
        if i % 4 != 2: S.add(t, musicbox(m, d * b * 1.2, 0.19), pan=0.2)
        t += d * b * 1.2
    chords(S, B(25), 4 * bar, [41, 46], vol=0.03)
    t = B(30)
    for g in GROW: t = seq(S, g, b, t, lambda m, d: kalimba(m + 12, max(d, 0.4), vol=0.16), pan=-0.3) + b / 2
    chords(S, B(30), 3 * bar, [41], vol=0.025); giggle(S, B(32) + b, 0.05)
    finish(S, 'Childrens_Garden', t0, END, gain=0.75)

# ------------------------------------------------------------------ the Boar's Wallow
def snort(S, t, vol=0.12, pan=None):
    pan = rnd(-0.6, 0.6) if pan is None else pan
    for i, d in enumerate((0.12, 0.1, 0.22)):
        n = int(d * SR); tt = np.arange(n) / SR
        x = lowpass(np.random.uniform(-1, 1, n), 500) * 6 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 28 * tt)))
        if i == 2: x += np.sin(2 * np.pi * np.cumsum(95 * (1 - 0.2 * tt / d)) / SR) * 0.8
        S.add(t + i * 0.16, x * np.sin(np.pi * tt / d) * vol, pan=pan)

def squelch(S, t, vol=0.06):                                       # a hoof in the mud
    n = int(0.25 * SR); tt = np.arange(n) / SR; f = 120 + 300 * tt / 0.25
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + lowpass(np.random.uniform(-1, 1, n), 700) * 3
    S.add(t, x * np.exp(-tt / 0.07) * vol, pan=rnd(-0.7, 0.7))

def roar(S, t, dur=1.8, vol=0.07):                                 # the camp cheering
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(9) / 9, 'same') - np.convolve(x, np.ones(50) / 50, 'same')
    S.add(t, x * np.sin(np.pi * np.arange(n) / n) ** 1.5 * vol * 4, pan=0.0)
    for i in range(3): snort(S, t + rnd(0, dur * 0.6), vol * 1.2)

def wallow():
    S, b, bar, t0, END, B = track(100, 32, 1021)
    crowd(S, 0, END, 1.0, 0.07, pan=-0.3); crowd(S, 0, END, 1.0, 0.055, pan=0.4)
    for k in range(1, 33):
        if rnd() < 0.6: squelch(S, B(k) + rnd(0, bar), rnd(0.04, 0.07))
        if rnd() < 0.3: snort(S, B(k) + rnd(0, bar), rnd(0.07, 0.11))
    def stomp(t, bars, vol=1.0):                                   # STOMP . stomp . STOMP stomp . clap
        for k in range(bars):
            at = t + k * bar
            for j, v in ((0, 0.4), (1, 0.25), (2, 0.4), (2.5, 0.28)):
                S.add(at + j * b, drum('kick', v * vol)); S.add(at + j * b, drum('tom', v * 0.7 * vol), pan=-0.2)
            S.add(at + 3 * b, drum('clap', 0.25 * vol)); S.add(at + 3 * b, drum('snare', 0.12 * vol), pan=0.2)
            r = (41, 46, 48, 41)[(k // 2) % 4]
            S.add(at, slapbass(r - 12, b * 0.8, vol=0.38 * vol)); S.add(at + 2 * b, slapbass(r - 12, b * 0.8, vol=0.34 * vol))
    # 1-8: the stomp, the camp
    stomp(B(1), 8, 0.9)
    # 9-16: the theme as a stomp: low brass, the camp grunting along on the downbeats
    seq(S, slow(THEME), b, B(9), lambda m, d: brass(m - 24, d * 0.8, vol=0.32), pan=-0.1)
    seq(S, slow(THEME), b, B(9), lambda m, d: brass(m - 12, d * 0.6, vol=0.12), pan=0.3)
    stomp(B(9), 8)
    for k in range(8): S.add(B(9 + k), choir(41 if k % 2 == 0 else 48, b * 0.5, vol=0.12))      # "hup!"
    # 17-24: a contest of strength: grunts, a drum roll building... and a roar of cheering
    for k in range(6):
        snort(S, B(17 + k) + rnd(0, 2 * b), 0.12)
        for j in (0, 2): S.add(B(17 + k) + j * b, drum('kick', 0.3)); S.add(B(17 + k) + j * b, drum('tom', 0.18), pan=-0.2)
        S.add(B(17 + k), timpani(41, 0.15 + 0.03 * k)); S.add(B(17 + k) + 2 * b, timpani(41, 0.12 + 0.03 * k))
    for i in range(48): S.add(B(21) + i * b / 6, drum('snare', 0.04 + i * 0.004), pan=0.15)
    for m in (53, 57, 60): S.add(B(17), strings(m - 12, 6 * bar * 0.98, vol=0.03))
    S.add(B(23), cymbal(0.12, 2)); S.add(B(23), timpani(41, 0.5)); roar(S, B(23), 2.5, 0.09)
    stomp(B(23), 2, 1.1)
    # 25-32: everyone: the theme on brass and marimba, the stomp at full weight
    seq(S, slow(THEME), b, B(25), lambda m, d: brass(m - 24, d * 0.8, vol=0.32), pan=-0.1)
    seq(S, slow(THEME), b, B(25), lambda m, d: marimba(m - 12, d * 0.7, vol=0.3), pan=0.3)
    stomp(B(25), 8, 1.1)
    for k in range(8): S.add(B(25 + k), choir(41 if k % 2 == 0 else 48, b * 0.5, vol=0.12))
    roar(S, B(32) + 2 * b, 1.4, 0.06)
    finish(S, 'Boars_Wallow', t0, END, gain=1.0, echo=0.2, fb=0.24, reverb=0.18)

# ------------------------------------------------------------------ the Owl Towers
def screech(S, t, vol=0.05):                                       # an owl of ill omen: a harsh, rising shriek
    n = int(0.7 * SR); tt = np.arange(n) / SR; f = 900 + 900 * tt / 0.7
    x = np.random.uniform(-1, 1, n) * 0.6 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    S.add(t, lowpass(x, 4000) * np.sin(np.pi * tt / 0.7) * vol, pan=rnd(-0.9, 0.9))

def wings(S, t, vol=0.05):
    pan = rnd(-0.8, 0.8)
    for i in range(np.random.randint(3, 6)):
        n = int(0.12 * SR); x = lowpass(np.random.uniform(-1, 1, n), 1200) * 3
        S.add(t + i * 0.18, x * np.sin(np.pi * np.arange(n) / n) * vol, pan=pan)

def owls():
    S, b, bar, t0, END, B = track(84, 36, 1031)
    bed_wind(S, 0, END, 1.0, vol=0.12, smooth=30, pan=-0.2)
    bed_wind(S, 0, END, 1.0, vol=0.07, smooth=90, pan=0.3)
    for k in range(1, 37, 2):
        if rnd() < 0.8: owl(S, B(k) + rnd(0, 2 * bar), rnd(0.07, 0.1))
        if rnd() < 0.5: wings(S, B(k) + rnd(0, 2 * bar), 0.04)
    for k in range(2, 37, 5): creak(S, B(k) + rnd(0, bar), 0.04)
    t = 0.4
    while t < END - 0.5: drip(S, t, rnd(0.02, 0.04)); t += rnd(1.0, 3.0)
    def musicbox(m, d, vol=0.18):
        x_ = bell(m + 12, max(d, 0.4), vol=vol * 0.6); y = kalimba(m + 12, max(d, 0.4), vol=vol)
        nn = max(len(x_), len(y)); return np.pad(x_, (0, nn - len(x_))) + np.pad(y, (0, nn - len(y)))
    tou = lambda v: (lambda m, d: musicbox(m, d, v))
    falmi = lambda v: (lambda m, d: marimba(m, d * 0.85, vol=v))
    for m in (40, 41): S.add(0, strings(m, END + 2 * b, vol=0.035)); S.add(0, organ(m, END + 2 * b, vol=0.015))   # E and F, a semitone, held
    # 1-8: the ruins, the owls
    # 9-16: Tou's minuet, from the left (her harp under it, in threes)
    seq(S, T1 + T2, b, B(9), tou(0.12), pan=-0.5)
    for k, r in enumerate([40, 42, 48, 47, 40, 43, 50, 40]):
        S.add(B(9) + k * 3 * b, harp(r, b, vol=0.1), pan=-0.5)
        for j in (1, 2):
            for m in CH[r]: S.add(B(9) + (k * 3 + j) * b, harp(m + 12, b * 0.5, vol=0.03), pan=-0.5)
    # 17-24: Falmi's theme, from the right, in its own bouncing two
    seq(S, THEME + THEME, b, B(17), falmi(0.21), pan=0.5)
    for k in range(16):
        r = FR[(k // 2) % 4]
        S.add(B(17) + k * 2 * b, pluckbass(r - 12, b * 0.8, vol=0.2)); S.add(B(17) + k * 2 * b + b, pluckbass(r - 5, b * 0.8, vol=0.16))
    # 25-32: both at once, out of step, a semitone apart; strings shiver; the owls screech
    seq(S, T1 + T2, b, B(25), tou(0.12), pan=-0.5)
    seq(S, THEME + THEME, b, B(25), falmi(0.19), pan=0.5)
    for i in range(int(8 * 16)): S.add(B(25) + i * b / 4, stab((64, 65)[i % 2], b / 4 * 0.9, vol=0.006 + 0.00012 * i), pan=(-0.3, 0.3)[i % 2])
    for k in (26, 28, 30, 31): screech(S, B(k) + rnd(0, bar), 0.06)
    for k in range(8): S.add(B(25 + k), timpani(40 if k % 2 == 0 else 41, 0.12))
    # 33-36: both stop at once. Silence, but for the wind... and an owl hoots, E then F
    S.add(B(33) + b, flute(64, 1.2, vol=0.1), pan=0.3); S.add(B(33) + 2.5 * b, flute(65, 1.6, vol=0.1), pan=0.3)
    finish(S, 'Owl_Towers', t0, END, gain=0.72, echo=0.36, fb=0.42, reverb=0.45)

ALL = dict(spring=spring, garden=garden, wallow=wallow, owls=owls)
if __name__ == '__main__':
    for name in (sys.argv[1:] or ALL): ALL[name]()
