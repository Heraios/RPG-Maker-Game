# The Lady of the Wind's leitmotif: strict, beautiful, and always moving, like the wind. E dorian (E minor
# with a bright C sharp): a falling gust, a rising gust, a high cold arc with the C sharp in it, and a sigh.
# For the peak (Snowy_Peak), and wherever she appears later (the marsh, the coasts, a fight).
# 4/4, four phrases of three bars (12 beats each).
R = None
W1 = [(76, 2), (83, 1), (81, 1), (79, 2), (78, 1), (76, 1), (74, 4)]       # E B A G F# E D: the gust falls
W2 = [(71, 1), (74, 1), (76, 2), (79, 1), (78, 1), (81, 2), (83, 4)]       # B D E G F# A B: it rises
W3 = [(88, 2), (85, 1), (83, 1), (81, 3), (79, 1), (78, 2), (76, 2)]       # E C# B A G F# E: high and cold
W4 = [(74, 1), (76, 1), (78, 2), (76, 4), (R, 4)]                          # D E F# E: a sigh, and still
WIND = W1 + W2 + W3 + W4                                                   # 12 bars
ROOTS = [40, 38, 38, 43, 38, 47, 45, 45, 40, 38, 40, 40]                    # Em D D | G D Bm | A A Em | D Em Em
CH = {40: (52, 55, 59), 38: (50, 54, 57), 43: (55, 59, 62), 47: (59, 62, 66), 45: (57, 61, 64)}
