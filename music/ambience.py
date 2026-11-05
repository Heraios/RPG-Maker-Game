# Nature sounds for the ambient tracks (wind, birds, insects, bells, hooves...). Each takes the Stereo track
# S first. They're noise and sweeps, not notes, so the BeepBox versions leave them out.
import numpy as np
from synth16 import SR, lowpass, adsr
rnd = np.random.uniform

def _env(n):
    return np.sin(np.pi * np.arange(n) / n) ** 2

def bed_wind(S, start, end, fade, vol=0.05, smooth=30, pan=0.0):
    """A wind that never stops: from start to end, fading in over `fade` seconds (runs right up to the loop's end)."""
    n = int((end - start) * SR); x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(smooth) / smooth, 'same') - np.convolve(x, np.ones(smooth * 12) / (smooth * 12), 'same')
    tt = np.arange(n) / SR
    sway = 0.6 + 0.25 * np.sin(2 * np.pi * tt / 9.3) + 0.15 * np.sin(2 * np.pi * tt / 3.1)
    S.add(start, x * sway * np.clip(tt / fade, 0, 1) * vol * 4, pan=pan)

def gust(S, t, dur, vol=0.06, smooth=20, whistle=None):
    n = int(dur * SR); x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(smooth) / smooth, 'same') - np.convolve(x, np.ones(smooth * 10) / (smooth * 10), 'same')
    if whistle:                                   # wind through pine needles: a faint, wavering tone
        tt = np.arange(n) / SR; f = whistle * (1 + 0.03 * np.sin(2 * np.pi * 0.7 * tt))
        x = x + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.04
    S.add(t, x * _env(n) * vol * 4, pan=rnd(-0.6, 0.6))

def chirp(S, t, f0, f1, dur, vol, pan):
    n = int(dur * SR); tt = np.arange(n) / SR; f = f0 + (f1 - f0) * tt / dur
    ph = 2 * np.pi * np.cumsum(f) / SR
    S.add(t, (np.sin(ph) + 0.2 * np.sin(2 * ph)) * np.sin(np.pi * tt / dur) * vol, pan=pan)

def trill(S, t, vol=0.05):
    pan = rnd(-0.8, 0.8); f = rnd(3000, 4200)
    for i in range(np.random.randint(6, 14)): chirp(S, t + i * 0.055, f, f * 1.25, 0.045, vol, pan)

def lark(S, t, dur=4.0, vol=0.035):               # a skylark high up: a long, tumbling warble
    pan = rnd(-0.5, 0.5); at = t
    while at < t + dur:
        f = rnd(2600, 5200); d = rnd(0.03, 0.09)
        chirp(S, at, f, f * rnd(0.8, 1.3), d, vol, pan); at += d + rnd(0.0, 0.03)

def crickets(S, start, end, fade, vol=0.02):
    """Crickets all through: pulses of a high tone, in a few voices (runs right up to the loop's end)."""
    n = int((end - start) * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    for f, rate, ph in ((4400, 2.6, 0.0), (4700, 3.1, 0.4), (4100, 2.2, 0.7)):
        pulse = (np.sin(2 * np.pi * (rate * tt + ph)) > 0.6) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * tt)))
        out += np.sin(2 * np.pi * f * tt) * pulse
    S.add(start, out * np.clip(tt / fade, 0, 1) * vol, pan=0.3)

def woodpecker(S, t, vol=0.15):
    pan = rnd(-0.9, 0.9); hits = np.random.randint(10, 18)
    for i in range(hits):
        n = int(0.02 * SR); tt = np.arange(n) / SR
        x = (np.sin(2 * np.pi * 900 * tt) + rnd(-0.5, 0.5, n)) * np.exp(-tt / 0.004)
        S.add(t + i * 0.045, x * vol * (1 - 0.4 * i / hits), pan=pan)

def raven(S, t, vol=0.1, caws=2):
    pan = rnd(-0.8, 0.8)
    for i in range(caws):
        n = int(0.35 * SR); tt = np.arange(n) / SR; f = 420 * (1 - 0.15 * tt / 0.35)
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = sum(np.sin(ph * k) / k for k in range(1, 12)) + rnd(-0.4, 0.4, n)
        S.add(t + i * 0.55, lowpass(x, 2200) * adsr(n, a=0.02, d=0.1, s=0.7, r=0.1) * vol, pan=pan)

def creak(S, t, vol=0.06):                        # a tall trunk swaying
    n = int(rnd(0.8, 1.6) * SR); tt = np.arange(n) / SR
    f = 70 + 25 * np.sin(np.pi * tt / (n / SR))
    clicks = (np.sin(2 * np.pi * np.cumsum(f) / SR) > 0.97).astype(float)
    x = lowpass(np.convolve(clicks, np.exp(-np.arange(120) / 20), 'same'), 1500)
    S.add(t, x / (np.abs(x).max() + 1e-9) * _env(n) * vol, pan=rnd(-0.7, 0.7))

def goatbell(S, t, vol=0.05, pan=None):           # a clanky little herd bell
    pan = rnd(-0.8, 0.8) if pan is None else pan
    n = int(0.6 * SR); tt = np.arange(n) / SR; f = rnd(900, 1400)
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / d) for r, a, d in
            ((1, 1, 0.25), (2.4, 0.6, 0.12), (3.9, 0.4, 0.06), (5.6, 0.25, 0.04)))
    S.add(t, x * vol, pan=pan)

def goatbells(S, t, dur, vol=0.04):               # a herd moving: bells at uneven gaps
    at = t; pan = rnd(-0.8, 0.8)
    while at < t + dur:
        goatbell(S, at, vol * rnd(0.5, 1), pan + rnd(-0.2, 0.2)); at += rnd(0.15, 0.7)

def hooves(S, t, steps, gap, vol=0.12, pan=0.0):  # unhurried steps on stone
    for i in range(steps):
        n = int(0.05 * SR); tt = np.arange(n) / SR
        x = (np.sin(2 * np.pi * 600 * tt) * 0.6 + rnd(-1, 1, n)) * np.exp(-tt / 0.008)
        S.add(t + i * gap + (0.12 if i % 2 else 0), lowpass(x, 3000) * vol, pan=pan)

def deer(S, t, vol=0.08):                         # a deer's short bark
    pan = rnd(-0.8, 0.8); n = int(0.25 * SR); tt = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(500 * (1 - 0.4 * tt / 0.25)) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 8)) + rnd(-0.6, 0.6, n)
    S.add(t, lowpass(x, 2500) * np.exp(-tt / 0.08) * vol, pan=pan)

def stream(S, start, end, fade, vol=0.03, pan=-0.5):
    """A mountain stream, all through: bubbling noise (runs right up to the loop's end)."""
    n = int((end - start) * SR); x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(4) / 4, 'same') - np.convolve(x, np.ones(40) / 40, 'same')
    k = rnd(0, 1, int((end - start) * 14) + 2)
    burble = np.interp(np.arange(n) / SR * 14, np.arange(len(k)), k)
    tt = np.arange(n) / SR
    S.add(start, x * (0.4 + burble) * np.clip(tt / fade, 0, 1) * vol * 3, pan=pan)
