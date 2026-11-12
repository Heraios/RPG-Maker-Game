# Run from the repository root:  NODE_PATH=$(npm root -g) python3 art/sky_hole_view.py
# Remakes map 1's sky-hole views (img/parallaxes/SkyHole_Day/_Dusk/_Night and the _Mended ones): map 6's skylight
# garden, centred on the ladder, with only the Broken Ladder (8) and the Skylight (35), in Cave Shade's tint.
# Re-run it whenever map 6's garden changes. See art/hole_view.py for other holes.
import subprocess, sys
base = [sys.executable, 'art/hole_view.py', '--map', '6', '--crop', '19,8,34,22', '--name', 'SkyHole',
        '--keep', '8,35', '--tone=-85,-80,-40,30']
subprocess.run(base + ['--setup', '$gameVariables.setValue(5, 30)'], check=True)
subprocess.run(base + ['--setup', '$gameVariables.setValue(5, 50); $gameSelfSwitches.setValue([6, 8, "A"], true)',
                       '--suffix', '_Mended'], check=True)
