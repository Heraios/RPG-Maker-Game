# A tiny NES-style synth: pulse, triangle, noise, and a "log drum".
import numpy as np, wave, subprocess, sys
SR = 44100

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def env(n, a=0.004, r=0.03, decay=None):
    e = np.ones(n)
    A = max(1, int(a * SR)); R = max(1, int(min(r, n / SR / 2) * SR))
    e[:A] = np.linspace(0, 1, A); e[-R:] *= np.linspace(1, 0, R)
    if decay: e *= np.exp(-np.arange(n) / SR / decay)
    return e

def pulse(m, dur, duty=0.25, vib=0.0, decay=None, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(m) * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.25, 0, 1))
    ph = np.cumsum(f) / SR % 1.0
    return np.where(ph < duty, 1.0, -1.0) * env(n, decay=decay) * vol

def tri(m, dur, vol=1.0):
    n = int(dur * SR); ph = np.cumsum(np.full(n, hz(m))) / SR % 1.0
    w = 4 * np.abs(ph - 0.5) - 1
    return np.round(w * 7) / 7 * env(n) * vol          # 4-bit-ish steps, like the NES triangle

def noise(dur, decay=0.03, vol=1.0):
    n = int(dur * SR); return np.random.uniform(-1, 1, n) * env(n, a=0.001, decay=decay) * vol

def logdrum(m, dur=0.3, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(m) * (1 + 1.5 * np.exp(-t / 0.015))       # pitch drop: a hollow wooden knock
    ph = np.cumsum(f) / SR
    return np.sin(2 * np.pi * ph) * np.exp(-t / 0.09) * env(n, a=0.001) * vol

class Track:
    def __init__(self, seconds): self.buf = np.zeros(int(seconds * SR) + SR)
    def add(self, at, sig, vol=1.0):
        i = int(at * SR); self.buf[i:i + len(sig)] += sig[:len(self.buf) - i] * vol
    def echo(self, delay, fb=0.35):
        d = int(delay * SR); out = self.buf.copy()
        for k in range(1, 4): out[d * k:] += self.buf[:-d * k] * fb ** k
        self.buf = out

def seq(track, notes, beat, start, voice):
    """notes: (midi or None, beats). voice(m, seconds) -> signal"""
    t = start
    for m, b in notes:
        if m is not None: track.add(t, voice(m, b * beat * 0.92))
        t += b * beat
    return t

def save(buf, path_ogg):
    buf = buf / (np.max(np.abs(buf)) + 1e-9) * 0.85
    wav = path_ogg[:-4] + '.wav'
    with wave.open(wav, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '5', path_ogg], check=True)
