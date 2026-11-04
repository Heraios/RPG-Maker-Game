# Smoking Isle music sketches

Chiptune made in code: `chip.py` is a tiny NES-style synth (two pulse voices, a triangle bass, noise, and a
wooden "log drum"); the other scripts are compositions written with it. See `docs/music-brief.md` for the plan.

| Script | Makes |
|---|---|
| `yoon.py` | Yoon's theme in three moods: curious, eerie, sweet (`sketches/yoon_*.ogg`) |
| `sib.py` | Sib's theme: Sib, the little priest, and Yoon and Sib together (`sketches/sib_*.ogg`) |
| `yoon_full.py` | The full Yoon track: `Smoking Isle/audio/bgm/Yoon.ogg`, with loop points (intro plays once) |
| `battle.py` | Battle sketches A (earthy) and B (tense), and **Battle_Wild** (A with B's intro): `Smoking Isle/audio/bgm/Battle_Wild.ogg` |

To rebuild (needs Python with numpy, and ffmpeg), from this folder: `python3 yoon_full.py` (and the others).
The generated files appear here; copy `Yoon.ogg` into `Smoking Isle/audio/bgm/`.
