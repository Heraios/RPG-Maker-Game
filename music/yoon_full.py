import sys; sys.path.insert(0, '.')
import numpy as np, subprocess, wave
from chip import *
from yoon import A, B, C, B_end, ROOTS, third_below
np.random.seed(11)

BPM = 100; b = 60 / BPM
D5, E5, F5, Fs5, G5, Gs5, A5 = 74, 76, 77, 78, 79, 80, 81
# Bridge: the "wrong note" figure sinks a step at a time, then climbs back to A, ready for the loop.
BRIDGE = [(A5, 1), (Gs5, .5), (A5, .5), (F5, 2),
          (G5, 1), (Fs5, .5), (G5, .5), (E5, 2),
          (F5, 1), (E5, .5), (F5, .5), (D5, 1), (E5, 1),
          (Gs5, 2), (A5, 2)]
INTRO, SEC = 16, 32           # beats
loop_start = INTRO * b
total_beats = INTRO + SEC + SEC + 16 + SEC
T = Track(total_beats * b + 2)
E = Track(total_beats * b + 2)   # echoing parts, mixed in at the end

def curious_section(t0, extra=False):
    seq(T, A + B + C + B, b, t0, lambda m, d: pulse(m, d * 0.7, duty=0.25, vol=0.48))
    if extra:   # a high, quiet echo of the melody, half a beat behind
        seq(E, A + B + C + B, b, t0 + b / 2, lambda m, d: pulse(m + 12, d * 0.5, duty=0.125, vol=0.13))
    for bar, r in enumerate(ROOTS):
        for k, iv in enumerate((0, 12, 7, 12)):
            T.add(t0 + (bar * 4 + k) * b, tri(r - 12 + iv, b * 0.8, vol=0.55))
    for i in range(SEC * 2):
        at = t0 + i * b / 2
        if i % 2: T.add(at, noise(0.05, decay=0.015, vol=0.12))
        if i % 8 == 0: T.add(at, logdrum(52, vol=0.5))
        if i % 8 == 5: T.add(at, logdrum(57, vol=0.35))
        if extra and i % 8 == 3: T.add(at, logdrum(55, vol=0.25))

def sweet_section(t0):
    mel = A + B + C + B_end
    seq(T, mel, b, t0, lambda m, d: pulse(m, d, duty=0.5, decay=0.9, vol=0.42))
    seq(T, [(third_below(m), d) for m, d in mel], b, t0, lambda m, d: pulse(m, d, duty=0.25, decay=0.9, vol=0.2))
    for bar, r in enumerate(ROOTS):
        T.add(t0 + bar * 4 * b, tri(r - 12, 2 * b * 0.95, vol=0.55))
        T.add(t0 + (bar * 4 + 2) * b, tri(r - 5, 2 * b * 0.95, vol=0.5))
        chord = [r + 12, r + 15 if r in (50, 45) else r + 16, r + 19]
        for k in range(8):
            T.add(t0 + (bar * 4 + k / 2) * b, pulse(chord[k % 3] + 12, b * 0.4, duty=0.125, decay=0.15, vol=0.09))
        for k, p in ((0, 50), (1.5, 57), (3, 55)):
            T.add(t0 + (bar * 4 + k) * b, logdrum(p, vol=0.35))

def bridge_section(t0):
    seq(E, BRIDGE, b, t0, lambda m, d: pulse(m, d, duty=0.125, vib=0.012, vol=0.42))
    for bar, r in enumerate((50, 48, 46, 45)):                  # D C Bb A: a falling lament bass
        T.add(t0 + bar * 4 * b, tri(r - 12, 4 * b * 0.97, vol=0.6))
        T.add(t0 + bar * 4 * b, logdrum(45, dur=0.6, vol=0.4))
    for k in range(8):                                           # a log-drum roll back into the loop
        T.add(t0 + (12 + k / 2) * b, logdrum(50 + (k % 2) * 7, dur=0.25, vol=0.2 + k * 0.04))

# Intro: the theme slow and alone, over a drone (plays once)
seq(E, [(m, d * 2) for m, d in A], b, 0, lambda m, d: pulse(m, d, duty=0.125, vib=0.012, vol=0.4))
T.add(0, tri(38, INTRO * b * 0.98, vol=0.55))
for t in (3, 7.5, 12):
    E.add(t * b, pulse(93, 0.18, duty=0.5, decay=0.05, vol=0.13))

t = INTRO * b
curious_section(t); t += SEC * b
sweet_section(t); t += SEC * b
bridge_section(t); t += 16 * b
curious_section(t, extra=True); t += SEC * b

E.echo(0.3, fb=0.38)
buf = T.buf + E.buf
end = int(round(t * SR)); start = int(round(loop_start * SR))
tail = buf[end:end + SR]                       # sound ringing past the loop point wraps to the loop start
buf = buf[:end].copy(); buf[start:start + len(tail)] += tail
buf = buf / np.max(np.abs(buf)) * 0.85
with wave.open('yoon_full.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((buf * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'yoon_full.wav', '-c:a', 'libvorbis', '-q:a', '5',
                '-metadata', 'LOOPSTART=%d' % start, '-metadata', 'LOOPLENGTH=%d' % (end - start), 'Yoon.ogg'], check=True)
# A listening copy: the whole thing, then the loop once more, so the seam can be heard.
both = np.concatenate([buf, buf[start:]])
with wave.open('preview.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((both * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'preview.wav', '-c:a', 'libvorbis', '-q:a', '5', 'Yoon_preview_looped.ogg'], check=True)
print('loop start %.2fs, loop length %.2fs, file %.2fs' % (start / SR, (end - start) / SR, end / SR))
