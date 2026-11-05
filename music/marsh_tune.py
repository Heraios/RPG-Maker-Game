# The Marsh tune: a reed-pipe melody for the salt marsh, shared by Salt_Marsh, Mansehare and Hag_Roost.
# E minor, slow and wavering; its second phrase leans on a B flat (a flattened fifth), the marsh's unease.
R = None
M1 = [(64, 1.5), (67, .5), (69, 2), (71, 1), (69, .5), (67, .5), (64, 2)]      # E G A | B A G E
M2 = [(67, 1.5), (69, .5), (70, 2), (69, 1), (67, .5), (64, .5), (64, 2)]      # G A B-flat | A G E
M3 = [(62, 1), (64, 1), (67, 1), (69, 1), (71, 1.5), (69, .5), (67, 2)]        # D E G A | B A G
M4 = [(64, 1), (62, 1), (59, 1), (62, 1), (64, 4)]                             # E D B D | E
MARSH = M1 + M2 + M3 + M4                                                       # 32 beats: 8 bars of 4/4
ROOTS = [40, 36, 40, 36, 38, 40, 38, 40]                                        # Em C Em C | D Em D Em
CH = {40: (52, 55, 59), 36: (48, 52, 55), 38: (50, 54, 57), 43: (55, 59, 62), 45: (57, 60, 64), 47: (59, 63, 66)}
# ... and in 3/4, as the Hags' lullaby
LULL1 = [(64, 2), (67, 1), (69, 3), (71, 2), (69, 1), (64, 3)]
LULL2 = [(67, 2), (69, 1), (70, 3), (69, 2), (67, 1), (64, 3)]
