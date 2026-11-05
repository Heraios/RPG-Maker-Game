# The Island tune, shared by every town, village and sacred site (and the grasslands).
import numpy as np
from synth16 import flute, choir, drum
G4, A4, B4, D5, E5, G5, F4, D4 = 67, 69, 71, 74, 76, 79, 65, 62
CALL1 = [(G4, 1), (A4, .5), (B4, .5), (D5, 1), (D5, 1), (E5, 1), (D5, 1), (D5, 2)]
ANS1 = [(B4, 1), (A4, 1), (G4, 1), (A4, 1), (B4, 1.5), (A4, .5), (G4, 2)]
CALL2 = [(D5, 1), (E5, 1), (G5, 1), (E5, 1), (D5, 1), (B4, 1), (A4, 2)]
ANS2 = [(G4, 1), (F4, 1), (D4, 1), (F4, 1), (G4, 1.5), (A4, .5), (G4, 2)]
TUNE = CALL1 + ANS1 + CALL2 + ANS2                    # 8 bars
ROOTS = [43, 48, 40, 43, 43, 38, 41, 43]              # G C Em G | G D F G
CH = {43: (55, 59, 62), 48: (60, 64, 67), 40: (52, 55, 59), 38: (50, 54, 57), 41: (53, 57, 60)}
UP = {67: 71, 69: 72, 71: 74, 74: 79, 76: 79, 79: 83, 65: 69, 62: 67}         # a third (or so) above, in G
UP7 = {67: 72, 65: 69, 62: 65, 69: 72}                                       # ... and in the F bar
HARM = [(UP[m], d) for m, d in CALL1 + ANS1 + CALL2] + [(UP7[m], d) for m, d in ANS2]
LOG = ((0, 'tom'), (1.5, 'log'), (3, 'tomhi'))                               # the 3-3-2, in beats

def chant(m, d, vol=1.0):                             # many voices at once: a flute's edge on a choir
    x = flute(m, d, vol=vol * 0.5); y = choir(m, d, vol=vol)
    n = max(len(x), len(y)); return np.pad(x, (0, n - len(x))) + np.pad(y, (0, n - len(y)))
