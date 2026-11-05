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

# ---------------------------------------------------------------- water, marsh and shore
def _bed(n, start_fade):
    return np.clip(np.arange(n) / SR / start_fade, 0, 1)

def lap(S, start, end, fade, vol=0.04, pan=0.0):
    """Water lapping at reeds and stilts, all through (runs right up to the loop's end)."""
    n = int((end - start) * SR); x = lowpass(rnd(-1, 1, n), 700) * 8
    tt = np.arange(n) / SR
    swell = 0.3 + 0.7 * np.abs(np.sin(2 * np.pi * tt / 2.3) * np.sin(2 * np.pi * tt / 3.7))
    S.add(start, x * swell * _bed(n, fade) * vol, pan=pan)

def surf(S, start, end, fade, vol=0.08, period=7.0, pan=0.0):
    """Waves on a rocky shore: each one rising, breaking and drawing back (runs right up to the loop's end)."""
    n = int((end - start) * SR); tt = np.arange(n) / SR; x = rnd(-1, 1, n)
    x = np.convolve(x, np.ones(8) / 8, 'same')
    ph = (tt % period) / period
    env = np.where(ph < 0.6, (ph / 0.6) ** 3, np.exp(-(ph - 0.6) * 9)) + 0.12
    S.add(start, x * env * _bed(n, fade) * vol * 2, pan=pan)

def frogs(S, start, end, fade, vol=0.03, count=5, rate=0.5):
    """A chorus of frogs, all through: each croaks in its own rhythm (runs right up to the loop's end)."""
    n = int((end - start) * SR); out = np.zeros(n)
    for f in range(count):
        base = rnd(140, 320); pan_gain = rnd(0.4, 1.0); t = rnd(0, 2)
        while t < (end - start) - 0.5:
            d = rnd(0.12, 0.3); m = int(d * SR); tt = np.arange(m) / SR
            croak = np.sign(np.sin(2 * np.pi * base * tt)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rnd(18, 30) * tt)))
            i = int(t * SR); out[i:i + m] += lowpass(croak, 1200) * np.sin(np.pi * tt / d) * pan_gain
            t += d + rnd(0.15, 0.6) / rate * (3 if rnd() < 0.15 else 1)
    S.add(start, out * _bed(n, fade) * vol, pan=rnd(-0.4, 0.4))

def heron(S, t, vol=0.08):                        # a heron's harsh "fraank"
    pan = rnd(-0.8, 0.8); n = int(0.5 * SR); tt = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(260 * (1 - 0.2 * tt / 0.5)) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 14)) + rnd(-0.5, 0.5, n)
    S.add(t, lowpass(x, 1800) * adsr(n, a=0.01, d=0.15, s=0.6, r=0.15) * vol, pan=pan)

def crane(S, t, vol=0.07, calls=3, pan=None):     # a crane bugling: "garoo, garoo" (a Hag, perhaps)
    pan = rnd(-0.9, 0.9) if pan is None else pan
    for i in range(calls):
        n = int(0.4 * SR); tt = np.arange(n) / SR; f = np.where(tt < 0.12, 620, 760)
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = sum(np.sin(ph * k) / k for k in range(1, 9)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 22 * tt)))
        S.add(t + i * 0.55, lowpass(x, 3000) * adsr(n, a=0.02, d=0.1, s=0.8, r=0.1) * vol, pan=pan)

def gull(S, t, vol=0.06, calls=3):                # "kee-ow"
    pan = rnd(-0.9, 0.9)
    for i in range(calls):
        n = int(0.32 * SR); tt = np.arange(n) / SR; f = 1500 - 650 * tt / 0.32
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = sum(np.sin(ph * k) / k ** 1.5 for k in range(1, 6))
        S.add(t + i * rnd(0.3, 0.5), x * np.sin(np.pi * tt / 0.32) * vol, pan=pan)

def splash(S, t, vol=0.06):                       # something going into the water
    n = int(0.5 * SR); tt = np.arange(n) / SR; x = lowpass(rnd(-1, 1, n), 2500) * 3 * np.exp(-tt / 0.08)
    S.add(t, x * vol, pan=rnd(-0.7, 0.7))
    for i in range(4): bubble(S, t + 0.15 + i * rnd(0.05, 0.12), vol * 0.6)

def bubble(S, t, vol=0.05):
    n = int(0.06 * SR); tt = np.arange(n) / SR; f = rnd(300, 700) * (1 + 2 * tt / 0.06)
    S.add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.02) * vol, pan=rnd(-0.6, 0.6))

def reeds(S, t, dur, vol=0.04):                   # reeds rustling in a breath of wind
    n = int(dur * SR); x = rnd(-1, 1, n); x = x - np.convolve(x, np.ones(10) / 10, 'same')
    k = rnd(0, 1, int(dur * 20) + 2); flick = np.interp(np.arange(n) / SR * 20, np.arange(len(k)), k) ** 2
    S.add(t, x * flick * _env(n) * vol * 2, pan=rnd(-0.7, 0.7))

def mosquito(S, t, dur=2.0, vol=0.012):           # a whine that passes your ear
    n = int(dur * SR); tt = np.arange(n) / SR; f = 620 * (1 + 0.02 * np.sin(2 * np.pi * 6 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.3
    for half, pan in ((slice(0, n // 2), -0.7), (slice(n // 2, n), 0.7)):
        seg = (x * _env(n))[half]; S.add(t + (0 if pan < 0 else dur / 2), seg * vol, pan=pan)

def clacks(S, t, vol=0.05):                       # bone and shell chimes knocking in the wind
    pan = rnd(-0.6, 0.6)
    for i in range(np.random.randint(3, 7)):
        n = int(0.08 * SR); tt = np.arange(n) / SR; f = rnd(800, 1500)
        S.add(t + i * rnd(0.06, 0.2), (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt)) * np.exp(-tt / 0.015) * vol, pan=pan)
