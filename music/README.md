# Smoking Isle music sketches

Music made in code. `chip.py` is a tiny NES-style synth (two pulse voices, a triangle bass, noise, and a
wooden "log drum"); `synth16.py` is a SNES-style one (marimba, kalimba, flute, strings, slap bass, bells,
drums, stereo, echo and reverb). The other scripts are compositions written with them. See `docs/music-brief.md` for the plan.

| Script | Makes |
|---|---|
| `yoon.py` | Yoon's theme in three moods: curious, eerie, sweet (`sketches/yoon_*.ogg`) |
| `sib.py` | Sib's theme: Sib, the little priest, and Yoon and Sib together (`sketches/sib_*.ogg`) |
| `yoon_full.py` | The full Yoon track: `Smoking Isle/audio/bgm/Yoon.ogg`, with loop points (intro plays once) |
| `battle.py` | Battle sketches A (earthy) and B (tense), and **Battle_Wild** (A with B's intro): `Smoking Isle/audio/bgm/Battle_Wild.ogg` |
| `battle_spirits.py` | **Battle_Spirits**: the spirits and fae battle theme (7/8, giggly), with the drum-roll intro |
| `battle_spirits16.py` | Battle_Spirits redone in the 16-bit style (`sketches/Battle_Spirits_16bit.ogg`) |

To rebuild (needs Python with numpy, and ffmpeg), from this folder: `python3 yoon_full.py` (and the others).
The generated files appear here; copy `Yoon.ogg` into `Smoking Isle/audio/bgm/`.
