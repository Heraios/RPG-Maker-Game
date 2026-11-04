# A SNES-flavoured synth: "sampled" instruments built from harmonics, stereo, echo, reverb, a warm muffle.
import numpy as np, wave, subprocess
SR = 44100

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def adsr(n, a=0.005, d=0.1, s=0.7, r=0.08, hold=None):
    t = np.arange(n) / SR; e = np.ones(n)
    e = np.where(t < a, t / max(a, 1e-4), e)
    dd = (t >= a) & (t < a + d); e[dd] = 1 - (1 - s) * (t[dd] - a) / d
    e[t >= a + d] = s
    R = int(min(r, n / SR / 2) * SR); e[-R:] *= np.linspace(1, 0, R)
    return e

def partials(m, dur, parts, vib=0.0, vib_delay=0.2, detune=0.0):
    """parts: list of (harmonic ratio, amplitude, decay seconds or None)"""
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(m) * (1 + detune) * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - vib_delay) / 0.3, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros(n)
    for ratio, amp, dec in parts:
        if hz(m) * ratio > 15000: continue
        w = np.sin(ph * ratio) * amp
        if dec: w *= np.exp(-t / dec)
        out += w
    return out

def marimba(m, dur, vol=1.0):
    d = max(dur, 0.6)
    s = partials(m, d, [(1, 1.0, 0.45), (3.9, 0.35, 0.08), (9.2, 0.12, 0.02)])
    return s * adsr(len(s), a=0.002, d=0.01, s=1, r=0.05) * vol

def kalimba(m, dur, vol=1.0):
    d = max(dur, 0.8)
    s = partials(m, d, [(1, 1.0, 0.7), (2, 0.15, 0.2), (5.4, 0.18, 0.03)])
    return s * adsr(len(s), a=0.001, d=0.01, s=1, r=0.08) * vol

def flute(m, dur, vol=1.0):
    s = partials(m, dur, [(1, 1.0, None), (2, 0.22, None), (3, 0.08, None)], vib=0.007, vib_delay=0.18)
    n = len(s); breath = np.convolve(np.random.uniform(-1, 1, n), np.ones(12) / 12, 'same') * 0.08
    return (s + breath) * adsr(n, a=0.05, d=0.1, s=0.85, r=0.09) * vol

def strings(m, dur, vol=1.0):
    parts = [(k, 1 / k * (0.8 ** k), None) for k in range(1, 12)]
    s = sum(partials(m, dur, parts, vib=0.004, detune=dt) for dt in (-0.004, 0, 0.004)) / 3
    return s * adsr(len(s), a=0.22, d=0.2, s=0.9, r=0.3) * vol

def slapbass(m, dur, vol=1.0):
    parts = [(k, 1 / k ** 1.2, 0.35 / k) for k in range(1, 10)]
    s = partials(m, dur, parts)
    return s * adsr(len(s), a=0.002, d=0.05, s=0.8, r=0.04) * vol

def pluckbass(m, dur, vol=1.0):
    s = partials(m, dur, [(1, 1.0, 0.6), (2, 0.4, 0.15), (3, 0.2, 0.08)])
    return s * adsr(len(s), a=0.003, d=0.05, s=0.9, r=0.04) * vol

def bell(m, dur, vol=1.0):
    d = max(dur, 1.2)
    s = partials(m, d, [(1, 1.0, 0.9), (2.76, 0.4, 0.4), (5.4, 0.25, 0.15), (8.9, 0.1, 0.06)])
    return s * adsr(len(s), a=0.001, d=0.01, s=1, r=0.1) * vol

def drum(kind, vol=1.0):
    if kind == 'kick':
        n = int(0.35 * SR); t = np.arange(n) / SR
        f = 55 * (1 + 2.5 * np.exp(-t / 0.03)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    elif kind in ('tom', 'tomhi'):
        n = int(0.4 * SR); t = np.arange(n) / SR; base = 110 if kind == 'tom' else 165
        f = base * (1 + 0.6 * np.exp(-t / 0.05)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    elif kind == 'log':
        n = int(0.3 * SR); t = np.arange(n) / SR
        f = 330 * (1 + 1.2 * np.exp(-t / 0.012)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07)
        s += np.sin(2 * np.pi * np.cumsum(f * 2.7) / SR) * np.exp(-t / 0.02) * 0.3
    elif kind == 'snare':
        n = int(0.25 * SR); t = np.arange(n) / SR
        s = np.random.uniform(-1, 1, n) * np.exp(-t / 0.07) * 0.8 + np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) * 0.5
    elif kind == 'shaker':
        n = int(0.08 * SR); t = np.arange(n) / SR
        x = np.random.uniform(-1, 1, n); x = x - np.convolve(x, np.ones(6) / 6, 'same')   # bright
        s = x * np.exp(-t / 0.025) * np.clip(t / 0.01, 0, 1)
    elif kind == 'clap':
        n = int(0.2 * SR); t = np.arange(n) / SR; x = np.random.uniform(-1, 1, n)
        s = x * (np.exp(-t / 0.05) + 0.6 * np.exp(-np.abs(t - 0.012) / 0.004) + 0.4 * np.exp(-np.abs(t - 0.024) / 0.004))
    return s * vol

class Stereo:
    def __init__(self, seconds):
        n = int(seconds * SR) + 3 * SR
        self.L = np.zeros(n); self.R = np.zeros(n)
    def add(self, at, sig, vol=1.0, pan=0.0):
        i = int(at * SR); sig = sig[:len(self.L) - i] * vol
        self.L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
        self.R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414

def seq(track, notes, beat, start, voice, vol=1.0, pan=0.0, gate=0.95):
    t = start
    for m, b in notes:
        if m is not None: track.add(t, voice(m, b * beat * gate), vol, pan)
        t += b * beat
    return t

def fft_convolve(x, ir):
    n = len(x) + len(ir); N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)]

def lowpass(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / cutoff) ** 4), len(x))

def snes_master(L, R, echo=0.24, fb=0.35, reverb=0.18, cutoff=9000):
    out = []
    for ch, off in ((L, 0), (R, 1)):
        y = ch.copy()
        d = int(echo * SR) + off * int(0.011 * SR)               # SNES echo, a hair wider on one side
        e = np.zeros_like(y)
        for k in range(1, 5): e[d * k:] += lowpass(ch, 3500)[:-d * k] * fb ** k
        y = y + e
        rng = np.random.default_rng(10 + off)
        n = int(1.4 * SR); t = np.arange(n) / SR
        ir = rng.uniform(-1, 1, n) * np.exp(-t / 0.35); ir[0] = 0
        y = y + fft_convolve(y, lowpass(ir, 5000)) * reverb * 0.06
        out.append(lowpass(y, cutoff))                           # the warm SNES muffle
    return out

def save_stereo(L, R, path, loop=None, preview=None):
    peak = max(np.max(np.abs(L)), np.max(np.abs(R))); L = L / peak; R = R / peak
    drive = 2.2                                   # a gentle limiter: louder, without clipping
    L = np.tanh(L * drive) / np.tanh(drive) * 0.9; R = np.tanh(R * drive) / np.tanh(drive) * 0.9
    def write(l, r, wav, ogg, meta):
        data = np.empty(len(l) * 2); data[0::2] = l; data[1::2] = r
        with wave.open(wav, 'w') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((data * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '6'] + meta + [ogg], check=True)
    meta = ['-metadata', 'LOOPSTART=%d' % loop[0], '-metadata', 'LOOPLENGTH=%d' % loop[1]] if loop else []
    write(L, R, path[:-4] + '.wav', path, meta)
    if preview:
        s = loop[0]; write(np.concatenate([L, L[s:]]), np.concatenate([R, R[s:]]), path[:-4] + '_p.wav', preview, [])

def finish_loop(L, R, start_s, end_s):
    """Wrap everything ringing past the loop's end back onto its start, so the loop is seamless."""
    s, e = int(round(start_s * SR)), int(round(end_s * SR))
    out = []
    for ch in (L, R):
        tail = ch[e:e + 3 * SR]; c = ch[:e].copy(); c[s:s + len(tail)] += tail; out.append(c)
    return out[0], out[1], (s, e - s)
