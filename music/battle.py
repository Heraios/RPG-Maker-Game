import sys; sys.path.insert(0, '.')
import numpy as np, subprocess, wave
from chip import *
np.random.seed(5)
R = None
D5, E5, F5, G5, Gs5, A5, B5, C6, D6, E6, F6 = 74, 76, 77, 79, 80, 81, 83, 84, 86, 88, 89

def clap(vol=0.3): return noise(0.12, decay=0.035, vol=vol)

def save_loop(buf, loop_start_s, end_s, name, preview_loops=1):
    end = int(round(end_s * SR)); start = int(round(loop_start_s * SR))
    tail = buf[end:end + SR]; buf = buf[:end].copy(); buf[start:start + len(tail)] += tail
    buf = buf / np.max(np.abs(buf)) * 0.85
    def write(data, wav, ogg, meta):
        with wave.open(wav, 'w') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((data * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '5'] + meta + [ogg], check=True)
    write(buf, name + '.wav', name + '.ogg', ['-metadata', 'LOOPSTART=%d' % start, '-metadata', 'LOOPLENGTH=%d' % (end - start)])
    write(np.concatenate([buf] + [buf[start:]] * preview_loops), name + '_p.wav', name + '_preview.ogg', [])
    print(name, 'intro %.1fs, loop %.1fs' % (start / SR, (end - start) / SR))

# =============== A: "Wild Thing" — earthy, drums forward, fun ===============
def earthy(intro='roll', name='battle_A_earthy'):
    bpm = 150; b = 60 / bpm; bar = 4 * b
    INTRO, BARS = 2, 24
    T = Track((INTRO + BARS) * bar + 2)
    # intro: a log-drum roll speeding up, and a rising whoop
    if intro == 'roll':
        hits = np.cumsum(np.linspace(0.32, 0.06, 18)); hits = hits / hits[-1] * (2 * bar - 0.05)
        for i, h in enumerate(hits): T.add(h, logdrum(50 + (i % 3) * 3, dur=0.2, vol=0.25 + i * 0.02))
        T.add(bar, pulse(62, bar * 0.9, duty=0.25, vib=0.06, vol=0.25))
    else:   # B's intro: stabs climbing into the fight, then a held note
        for k, m in enumerate([50, 50, 50, 53, 55, 56]):
            T.add(k * b * 1.33, pulse(m + 12, b * 0.5, duty=0.5, decay=0.15, vol=0.4))
            T.add(k * b * 1.33, logdrum(45, vol=0.4))
        T.add(6 * b, pulse(69, 2 * b, duty=0.25, vib=0.03, vol=0.35))
    t0 = INTRO * bar
    roots = [50, 50, 48, 48, 46, 46, 45, 45]                      # Dm Dm C C Bb Bb A A
    bass_riff = [0, 0, 12, 0, 10, 12, 7, 5]                      # eighths: a hopping riff
    for k in range(BARS):
        r = roots[k % 8]; at = t0 + k * bar
        for i, iv in enumerate(bass_riff): T.add(at + i * b / 2, tri(r - 12 + iv, b / 2 * 0.8, vol=0.6))
        breakdown = k % 8 == 7 and k >= 16                          # a drums-only breath near the end
        for i in range(8):                                          # 3-3-2 log drums, and claps on 2 and 4
            if i in (0, 3, 6): T.add(at + i * b / 2, logdrum(48 if i == 0 else 55, vol=0.55 if i == 0 else 0.4))
            T.add(at + i * b / 2, noise(0.04, decay=0.012, vol=0.08 + (0.04 if i % 2 else 0)))
        T.add(at + b, clap()); T.add(at + 3 * b, clap())
    # lead: Yoon's climb and wrong note, chopped into a riff (two bars), then a high chanting answer
    riff1 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (R, .5),
             (C6, .5), (R, .5), (A5, .5), (R, .5), (G5, .5), (F5, .5), (E5, .5), (R, .5)]
    riff2 = [(D5, .5), (R, .5), (F5, .5), (A5, .5), (R, .5), (Gs5, .5), (A5, .5), (D6, .5),
             (C6, 1), (A5, .5), (G5, .5), (A5, 2)]
    chant = [(A5, 1), (A5, .5), (C6, .5), (D6, 1), (C6, .5), (A5, .5), (G5, 1), (G5, .5), (A5, .5), (F5, 1), (E5, 1),
             (F5, 1), (F5, .5), (A5, .5), (C6, 1), (A5, .5), (G5, .5), (Gs5, 2), (A5, 2)]
    lead = lambda m, d: pulse(m, d * 0.75, duty=0.25, vol=0.45)
    high = lambda m, d: pulse(m + 12, d * 0.9, duty=0.125, vib=0.01, vol=0.3)
    t = t0
    for part, voice in ((riff1, lead), (riff2, lead), (riff1, lead), (riff2, lead),     # bars 1-8
                        (chant, high), (chant, high),                                      # bars 9-16
                        (riff1, lead), (riff2, lead), (riff1, lead), ([(D6, 2), (R, 6)], lead)):  # 17-24
        t = seq(T, part, b, t, voice)
    save_loop(T.buf, t0, (INTRO + BARS) * bar, name)

# =============== B: "Danger on the Isle" — catchy, melodic, tense ===============
def tense():
    bpm = 160; b = 60 / bpm; bar = 4 * b
    INTRO, BARS = 2, 16
    T = Track((INTRO + BARS) * bar + 2)
    for k, m in enumerate([50, 50, 50, 53, 55, 56]):              # stabs climbing into the fight
        T.add(k * b * 1.33, pulse(m + 12, b * 0.5, duty=0.5, decay=0.15, vol=0.4))
        T.add(k * b * 1.33, logdrum(45, vol=0.4))
    T.add(6 * b, pulse(69, 2 * b, duty=0.25, vib=0.03, vol=0.35))
    t0 = INTRO * bar
    melody = [(A5, 1), (D6, 1), (C6, .5), (A5, .5), (G5, 1),
              (A5, 1.5), (F5, .5), (E5, 1), (D5, 1),
              (F5, 1), (A5, 1), (Gs5, .5), (A5, .5), (C6, 1),
              (D6, 3), (R, 1),
              (C6, 1), (B5, .5), (A5, .5), (G5, 1), (A5, 1),
              (F5, 1.5), (G5, .5), (A5, 2),
              (D6, .5), (C6, .5), (A5, .5), (G5, .5), (F5, .5), (E5, .5), (D5, .5), (E5, .5),
              (Gs5, 2), (A5, 2),
              # the climb: the same shape a step higher each bar
              (E5, 1), (G5, 1), (A5, 1), (B5, 1),
              (F5, 1), (A5, 1), (B5, 1), (C6, 1),
              (G5, 1), (B5, 1), (C6, 1), (D6, 1),
              (A5, 1), (C6, 1), (D6, 1), (E6, 1),
              (F6, 2), (E6, 1), (D6, 1),
              (C6, 1), (A5, 1), (Gs5, 2),
              (A5, 4),
              (R, 4)]
    seq(T, melody, b, t0, lambda m, d: pulse(m, d * 0.9, duty=0.25, vol=0.42))
    seq(T, [(m - 12 if m else None, d) for m, d in melody], b, t0, lambda m, d: pulse(m, d * 0.9, duty=0.5, vol=0.14))
    roots = [50, 50, 53, 48, 46, 53, 45, 45, 48, 50, 52, 53, 46, 45, 45, 45]
    for k, r in enumerate(roots):
        at = t0 + k * bar
        for i in range(16):                                         # driving sixteenth-note bass arpeggio
            iv = (0, 12, 7, 12)[i % 4]
            T.add(at + i * b / 4, tri(r - 12 + iv, b / 4 * 0.85, vol=0.5))
        last = k == 15
        for i in range(4):
            if i in (0, 2) and not last: T.add(at + i * b, logdrum(45, vol=0.6))
            if i in (1, 3): T.add(at + i * b, clap(0.32))
        for i in range(8): T.add(at + i * b / 2, noise(0.035, decay=0.01, vol=0.09))
        if last:                                                    # a snare-roll fill back into the loop
            for i in range(16): T.add(at + i * b / 4, noise(0.05, decay=0.02, vol=0.1 + i * 0.015))
    save_loop(T.buf, t0, (INTRO + BARS) * bar, 'battle_B_tense')

if __name__ == '__main__':
    earthy(); tense()
    earthy(intro='stabs', name='Battle_Wild')
