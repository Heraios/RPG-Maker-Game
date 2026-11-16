# Sooty Bird's leitmotif: the god of the Birdmen, the glyphs (first drawn from the cracks in tern eggshells), and Sib's
# priesthood and the Lightning Clan. A tern's cry: a quick glide up, a wheeling fall, and a lift back up into the
# wind. In G, to sit with the Island tune. Played on a tern-bone whistle (whistle() below: a high pipe that slides
# into each note). First heard at Amentapu, the tern watch; its first notes are the fast-travel sound (Sooty_Flight).
import numpy as np
from synth16 import SR, hz, adsr, flute
import synth16
R = None
CRY = [(91, .25), (88, .25), (86, .5), (83, .5), (81, .5), (79, 1)]          # glide up, then the wheeling fall: 3 beats
LIFT = [(83, .5), (86, .5), (88, .5), (86, 1.5)]                             # ... and back up into the wind: 3 beats
SOOTY = CRY + LIFT + [(R, 2)]                                                # 8 beats: two bars of 4/4
SOOTY2 = [(91, .25), (93, .25), (91, .5), (88, .5), (86, .5), (83, 1), (86, .5), (88, .5), (91, .5), (93, 1.5), (R, 2)]

def whistle(m, dur, vol=1.0, slide=1.0):
    """A tern-bone whistle: a pure, high pipe that slides up into each note and wavers a little."""
    if not isinstance(synth16.flute(60, 0.05), np.ndarray): return synth16.flute(m, dur, vol=vol)   # (BeepBox)
    n = int(dur * SR); tt = np.arange(n) / SR
    f = hz(m) * 2 ** ((-1.2 * slide * np.exp(-tt / 0.04) + 0.08 * np.sin(2 * np.pi * 6 * tt)) / 12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.08 * np.sin(2 * ph) + np.random.uniform(-0.04, 0.04, n)
    return x * adsr(n, a=0.02, d=0.05, s=0.9, r=min(0.08, dur / 3)) * vol
