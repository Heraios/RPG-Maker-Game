# Shared parts for the battle and boss themes: an orchestra at war, 16-bit. War drums, a marching snare, driving
# string figures, low brass and a men's choir holding the roots, and the big hit that opens every battle jingle.
# Each takes the Stereo track S first, a start time t in seconds, and the beat length b.
import numpy as np
from synth16 import *
_drum = drum
LOW, DRUMS, LEAD, STR = 0.7, 0.8, 1.4, 1.5        # the mix: bass and drums back, the tune and strings forward
def drum(kind, vol=1.0): return _drum(kind, vol * DRUMS)

def hit(S, t, root, vol=1.0, minor=True):
    """Everyone at once: war drum, timpani, cymbal, low brass and choir on the root and fifth."""
    S.add(t, drum('taiko', 0.6 * vol)); S.add(t, timpani(root + 12 if root < 40 else root, 0.35 * vol)); S.add(t, drum('kick', 0.18 * vol))
    S.add(t, cymbal(0.14 * vol, 2.2), pan=0.2)
    for m in (root, root + 7, root + 12): S.add(t, brass(m, 0.9, vol=0.16 * vol), pan=-0.1)
    for m in (root + 12, root + 12 + (3 if minor else 4), root + 19): S.add(t, stab(m + 12, 0.5, vol=0.07 * vol), pan=0.2)

def roll(S, t, beats, b, v0=0.04, v1=0.3, kind='snare', rate=8, pan=0.15):
    """A drum roll, swelling: `rate` strokes to the beat."""
    n = int(beats * rate)
    for i in range(n): S.add(t + i * b / rate, drum(kind, v0 + (v1 - v0) * (i / max(1, n - 1)) ** 1.5), pan=pan)

def march(S, t, b, bars, vol=1.0, fill=True):
    """A grim march in 4: war drums on one and three, the snare answering, ghost strokes between."""
    for k in range(bars):
        at = t + k * 4 * b; last = fill and k == bars - 1
        for j, v in ((0, 0.5), (1.5, 0.25), (2, 0.42), (3.5, 0.25)): S.add(at + j * b, drum('taiko', v * vol), pan=-0.1)
        S.add(at + 2.5 * b, drum('taikohi', 0.3 * vol), pan=0.3)
        for j in (1, 3):
            if not (last and j == 3): S.add(at + j * b, drum('snare', 0.34 * vol), pan=0.15)
        for j in (0.75, 1.75, 2.75):
            S.add(at + j * b, drum('snare', 0.08 * vol), pan=0.15)
        if last: roll(S, at + 3 * b, 1, b, 0.08 * vol, 0.36 * vol)

def drive(S, t, b, bars, vol=1.0, beats=4, fill=True):
    """For bosses: war drums on every beat and between, the snare cracking on two and four, no let-up."""
    for k in range(bars):
        at = t + k * beats * b; last = fill and k == bars - 1
        for j in range(int(beats)):
            S.add(at + j * b, drum('taiko', (0.5 if j % 2 == 0 else 0.36) * vol), pan=-0.1)
            S.add(at + (j + 0.5) * b, drum('taikohi', 0.3 * vol), pan=0.3)
            for q in (0.25, 0.75): S.add(at + (j + q) * b, drum('snare', 0.07 * vol), pan=0.15)
            if j % 2 == 1 and not (last and j == beats - 1): S.add(at + j * b, drum('snare', 0.4 * vol), pan=0.15)
        if last: roll(S, at + (beats - 1) * b, 1, b, 0.1 * vol, 0.42 * vol)

def ostinato(S, t, b, roots, pattern, vol=0.07, step=0.25, octave=12, beats=4, minor_third=3):
    """Driving strings: a short figure repeated under everything. pattern: scale steps above the bar's root
    (0 root, 3 third, 7 fifth, 12 octave...), one per `step` of a beat; the first of each beat is accented."""
    per = int(round(beats / step))
    for k, r in enumerate(roots):
        for i in range(per):
            iv = pattern[i % len(pattern)]
            if iv is None: continue
            accent = 1.0 if (i * step) % 1 == 0 else 0.62
            S.add(t + (k * beats + i * step) * b, stab(r + octave + iv, step * b * 0.9, vol=vol * accent * STR), pan=(-0.35, 0.35)[i % 2])

def power(S, t, dur, root, minor=True, vol=1.0, choir_too=True):
    """A held power chord: low brass and the men's choir on root and fifth, strings filling the chord."""
    for m in (root, root + 7): S.add(t, brass(m, dur * 0.97, vol=0.13 * vol * LOW), pan=-0.15)
    if choir_too:
        for m in (root, root + 7, root + 12): S.add(t, menchoir(m, dur * 0.98, vol=0.11 * vol * LOW), pan=0.1)
    for m in (root + 12, root + 12 + (3 if minor else 4), root + 19, root + 24): S.add(t, strings(m, dur * 0.98, vol=0.045 * vol * STR))
    S.add(t, slapbass(root if root >= 36 else root + 12, min(dur, 1.2), vol=0.26 * vol * LOW))

def low_end(S, t, b, roots, vol=0.34, beats=4, pattern=(0, 0, 12, 0, 0, 12, 0, 7)):
    """A pounding bass in eighths under the ostinato."""
    for k, r in enumerate(roots):
        n = int(beats * 2)
        for i in range(n):
            S.add(t + (k * beats + i * 0.5) * b, slapbass((r - 12 if r >= 48 else r) + pattern[i % len(pattern)], b * 0.42, vol=vol * LOW * (1 if i % 2 == 0 else 0.8)))

def tune(S, t, b, notes, voices, shift=0):
    """A melody on several instruments at once. voices: list of (instrument, octave shift, vol, pan, gate)."""
    for inst, octv, vol, pan, gate in voices:
        seq(S, [(m + shift + octv if m is not None else None, d) for m, d in notes], b, t,
            (lambda i, v, g: (lambda m, d: i(m, d * g / 0.95, vol=v * LEAD)))(inst, vol, gate), pan=pan)
