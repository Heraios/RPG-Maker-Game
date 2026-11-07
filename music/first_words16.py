import sys; sys.path.insert(0, '.')
import numpy as np
from synth16 import *
from ambience import drip, rnd
np.random.seed(881)
R = None
# First Words (Act 1): Lasa teaching the ghost to speak, in her cave (a warmer, safer one than Lava_Tubes).
# A lesson in call and answer: Lasa says a "word" (a phrase from her theme, on her kalimba, with her bells);
# Yoon tries to say it back, in a soft wordless voice that starts wobbly and out of tune, sliding around the
# notes, and steadies a little every round.
#   The intro (once): 1. Lasa says a word; Yoon manages only a breath.  2. Again; one note, wobbly and wrong;
#   Lasa giggles.  3. "Rock!" ... and Yoon answers with Sib's three counting notes (C, C, C): the first word
#   Yoon remembers is "Sib". A bonk, a laugh, and Lasa plays the three notes back ("No, that's Sib").
#   The loop (practice): 4. Lasa's phrase, again and again; Yoon gets two notes, then three, then a whole bar
#   before trailing off.  5. Yoon holds one steady note, A, which is Lasa's home note and the heart of
#   Yoon's own key: the first thing they share. Then Yoon speaks: the opening of their own theme (D F A
#   G-sharp A), bent into Lasa's skipping 6/8. Lasa, delighted, plays her theme properly, bells and all; they
#   take turns, and land together on A.
#   And at the very end, so faint no one notices the first time: a bar of Lasa's guilt melody. She doesn't
#   know yet that the ghost she's teaching was the child she was meant to guard.
e = 0.27; bar = 6 * e                                              # 6/8, a little slower than Lasa's own theme
INTRO = 8; BARS = 28
S = Stereo((INTRO + BARS) * bar)
END = (INTRO + BARS) * bar
t0 = INTRO * bar
I = lambda n: (n - 1) * bar                                        # intro bars
B = lambda n: t0 + (n - 1) * bar                                   # loop bars
A5, B5, Cs6, E6, Fs6, A6, Gs6, Fs5, Gs5 = 81, 83, 85, 88, 90, 93, 92, 78, 80
L1 = [(E6, 1), (Cs6, 1), (A5, 1), (B5, 2), (Cs6, 1), (E6, 2), (Fs6, 1), (E6, 2), (R, 1),
      (A5, 1), (B5, 1), (Cs6, 1), (E6, 1), (Fs6, 1), (A6, 1), (Gs6, 3), (E6, 3)]            # Lasa's theme
GUILT = [(Cs6, 3), (B5, 3), (A5, 2), (Gs5, 1), (Fs5, 3)]                                    # ... and its sad part
WORD = [(E6, 1), (Cs6, 1), (A5, 1), (B5, 3)]                       # a word: the first notes of her theme
ROCK = [(E6, 1.5), (A5, 1.5), (R, 3)]                              # "Rock!"
LESSON = L1[:9]                                                    # a longer phrase: two bars
YOON = [(74, 2), (77, 1), (81, 2), (80, 1), (81, 6)]               # Yoon's opening, in 6/8 (an octave down below)
CH = {45: (57, 61, 64), 52: (56, 59, 64), 42: (54, 57, 61), 50: (62, 66, 69), 49: (56, 61, 64), 'dm': (62, 65, 69)}

def voice(m, dur, vol=0.2, wobble=0.5, trail=False):
    """Yoon's voice: a soft 'ooh'. With wobble it slides in from off the note and wavers; trail lets it sag
    away at the end, like losing the word."""
    probe = choir(m, 0.01)
    if not isinstance(probe, np.ndarray): return choir(m, dur, vol=vol)     # (writing the BeepBox version)
    n = int(dur * SR); tt = np.arange(n) / SR
    off = rnd(-1.5, 1.5) * wobble * np.exp(-tt / 0.12)                     # sliding in
    off = off + wobble * (0.45 * np.sin(2 * np.pi * 4.7 * tt) + 0.3 * np.sin(2 * np.pi * 1.3 * tt + rnd(0, 6)))
    if trail: off = off - 2.5 * (tt / dur) ** 2
    f = hz(m) * 2 ** (off / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    x = x + lowpass(np.random.uniform(-1, 1, n), 1500) * 0.12             # breath
    env = adsr(n, a=0.07, d=0.1, s=0.85, r=min(0.2, dur / 3))
    if trail: env = env * np.clip(1.2 - tt / dur, 0, 1)
    return x * env * vol

def say(t, notes, vol=0.3, glint=True):                            # Lasa: kalimba, her bells on the high notes
    seq(S, notes, e, t, lambda m, d: kalimba(m, max(d, 0.35), vol=vol), pan=0.3)
    if glint: seq(S, [(m if m and m >= E6 else None, d) for m, d in notes], e, t, lambda m, d: bell(m + 12, 0.6, vol=0.05), pan=0.6)

def answer(t, notes, wobble, keep=None, vol=0.32):                  # Yoon: an octave below; keep = how many notes before it trails
    k = 0
    for m, d in notes:
        if m is not None:
            last = keep is not None and k == keep - 1
            if keep is not None and k >= keep: break
            S.add(t, voice(m - 12, d * e * (2.2 if last else 0.95), vol, wobble, trail=last), pan=-0.25)
            k += 1
        t += d * e

def breath(t, vol=0.04):
    n = int(1.0 * SR); tt = np.arange(n) / SR
    S.add(t, lowpass(np.random.uniform(-1, 1, n), 1200) * 3 * np.sin(np.pi * tt / 1.0) ** 2 * vol, pan=-0.25)

def giggle(t, vol=0.07):
    top = rnd(93, 97)
    for i in range(6): S.add(t + i * 0.07, kalimba(top - (i % 2) * 2 - i // 2, 0.2, vol=vol * (1 - 0.1 * i)), pan=0.4)

def chord(t, r, bars=1, vol=0.035, inst=harp):                    # a soft harp chord (or held strings)
    for j, m in enumerate(CH[r]):
        S.add(t + j * 0.05, inst(m, bars * bar * 0.95, vol=vol), pan=-0.3 + j * 0.25)
    S.add(t, pluckbass((50 if r == 'dm' else r) - 12, bars * bar * 0.9, vol=0.14))

def air(t, dur, vol=0.05):                                        # the cave breathing, gently
    n = int(dur * SR); x = np.random.uniform(-1, 1, n)
    x = np.convolve(x, np.ones(60) / 60, 'same') - np.convolve(x, np.ones(600) / 600, 'same')
    tt = np.arange(n) / SR; sw = np.clip(tt / 3, 0, 1) * np.clip((dur - tt) / 3, 0, 1)
    S.add(t, x * sw * vol * 4, pan=rnd(-0.5, 0.5))

# ---------------------------------------------------------------- the cave, all the way through
for m in (45, 52): S.add(0, strings(m, END + 2 * e, vol=0.032))
for k in range(0, INTRO + BARS, 6): air(k * bar + rnd(0, bar), 8 * bar, 0.06)
t = 0.5
while t < END - 0.4: drip(S, t, rnd(0.02, 0.04)); t += rnd(1.0, 3.5)

# ---------------------------------------------------------------- the intro (once): the first lessons
say(I(1), WORD); chord(I(1), 45)
breath(I(2) + 0.2)                                                 # 1. only a breath
say(I(3), WORD); chord(I(3), 45)
answer(I(4), [(82, 3)], 1.0); giggle(I(4) + 4 * e)                # 2. one note, wobbly and wrong (B flat)
say(I(5), ROCK, 0.34); say(I(5) + 3 * e, ROCK[:2], 0.24, glint=False); chord(I(5), 52)    # 3. "Rock! Rock!"
answer(I(6), [(84, 1), (84, 1), (84, 1)], 0.6)                     # ... "Sib" (Sib's counting notes)
S.add(I(7), marimba(55, 0.3, vol=0.3), pan=0.3); S.add(I(7), drum('tomhi', 0.15), pan=0.3)   # bonk
giggle(I(7) + 0.25, 0.09)
say(I(7) + 3 * e, [(84, 1), (84, 1), (84, 1)], 0.24, glint=False)  # "No, that's Sib"
seq(S, [(83, .5), (81, .5), (78, .5), (76, 1.5)], e, I(8), lambda m, d: kalimba(m, 0.3, vol=0.16), pan=0.4)   # ...well. A little
chord(I(8), 45)

# ---------------------------------------------------------------- the loop: practice
for k, (keep, wob) in enumerate(((2, 0.7), (3, 0.5), (5, 0.35))):  # 1-12: two notes, three, a whole bar
    say(B(1 + 4 * k), LESSON); chord(B(1 + 4 * k), 45); chord(B(2 + 4 * k), 52)
    answer(B(3 + 4 * k), LESSON, wob, keep); chord(B(3 + 4 * k), 45, 2, 0.025)
    if k == 0: giggle(B(4) + 2 * e, 0.05)

# 13: one steady note, A: the note they share; Lasa's kalimba joins it
S.add(B(13), voice(69, bar * 0.98, 0.32, 0.25), pan=-0.25)
S.add(B(13) + 3 * e, kalimba(81, 1.0, vol=0.24), pan=0.3); S.add(B(13) + 3 * e, bell(93, 1.2, vol=0.06), pan=0.6)
chord(B(13), 45, 1, 0.03, strings)

# 14-15: Yoon speaks: their own opening, bent into Lasa's 6/8
answer(B(14), YOON, 0.2, vol=0.32)
chord(B(14), 'dm'); S.add(B(14) + 4.5 * e, harp(56, 1.0, vol=0.04)); chord(B(15), 45, 1, 0.04)

# 16-19: Lasa, delighted: her theme properly, bells and harp and a little drum
say(B(16), L1, 0.36)
for k, r in enumerate((45, 52, 42, 50)):
    at = B(16 + k); tri = CH[r]
    for j in range(6): S.add(at + j * e, harp(tri[(0, 1, 2, 1, 2, 1)[j]] + 12, e, vol=0.07), pan=(-0.5, 0.5)[j % 2])
    S.add(at, pluckbass(r - 12, 3 * e * 0.9, vol=0.26)); S.add(at + 3 * e, pluckbass(r - 5, 3 * e * 0.9, vol=0.2))
    S.add(at, drum('log', 0.18), pan=-0.3); S.add(at + 3 * e, drum('tomhi', 0.13), pan=0.3)
    for j in range(6): S.add(at + j * e, drum('shaker', 0.04), pan=0.5)

# 20-21: Yoon again, steadier, Lasa's bells answering
answer(B(20), YOON, 0.1, vol=0.32)
seq(S, YOON, e, B(20) + 0.5 * e, lambda m, d: bell(m + 12, 0.5, vol=0.03), pan=0.6)
chord(B(20), 'dm'); S.add(B(20) + 4.5 * e, harp(56, 1.0, vol=0.04)); chord(B(21), 45, 1, 0.04)

# 22-25: turns: Lasa's phrase, Yoon's phrase, and both land together on A
say(B(22), LESSON, 0.32); chord(B(22), 45); chord(B(23), 52)
answer(B(24), YOON[:4], 0.08, vol=0.32); chord(B(24), 'dm'); S.add(B(24) + 4.5 * e, harp(56, 1.0, vol=0.04))
S.add(B(25), voice(69, bar * 1.6, 0.32, 0.06), pan=-0.25)
S.add(B(25), kalimba(81, 1.5, vol=0.3), pan=0.3)
for j, m in enumerate((93, 97, 100, 105)): S.add(B(25) + j * e, bell(m, 0.8, vol=0.06), pan=(-0.6, 0.6)[j % 2])
chord(B(25), 45, 1, 0.05, strings); chord(B(25), 45, 1, 0.05)

# 26-27: so faint: a bar of Lasa's guilt (she doesn't know yet)
seq(S, GUILT, e, B(26), lambda m, d: strings(m - 12, d * 0.97, vol=0.03), pan=0.2)
for k, r in enumerate((42, 49)): chord(B(26 + k), r, 1, 0.018, strings)

# 28: settling: a harp chord; Lasa's glint, softly, and the lesson starts again
chord(B(28), 45, 1, 0.03)
for j, m in enumerate((93, 97, 100, 105)): S.add(B(28) + 2 * e + j * e * 0.7, bell(m, 0.6, vol=0.035), pan=(-0.6, 0.6)[j % 2])

L, Rr = snes_master(S.L, S.R, echo=0.32, fb=0.38, reverb=0.4)
L, Rr, loop = finish_loop(L, Rr, t0, END)
save_stereo(L, Rr, 'First_Words16.ogg', loop=loop, preview='First_Words16_preview.ogg', gain=0.85)
print('First_Words16 intro %.1fs loop %.1fs' % (loop[0] / SR, loop[1] / SR))
