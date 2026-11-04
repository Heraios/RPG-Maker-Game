# Smoking Isle music sketches

Music made in code. `chip.py` is a tiny NES-style synth (two pulse voices, a triangle bass, noise, and a
wooden "log drum"); `synth16.py` is a SNES-style one (marimba, kalimba, flute, strings, slap bass, bells,
drums, stereo, echo and reverb). The other scripts are compositions written with them. See `docs/music-brief.md` for the plan.

| Script | Makes |
|---|---|
| `yoon.py` | Yoon's theme in three moods: curious, eerie, sweet (`sketches/yoon_*.ogg`) |
| `sib.py` | Sib's theme: Sib, the little priest, and Yoon and Sib together (`sketches/sib_*.ogg`) |
| `yoon_full.py` | The full Yoon track, 8-bit (`sketches/Yoon_8bit.ogg`) |
| `yoon_full16.py` | **Yoon** in 16-bit, the one in the game: `Smoking Isle/audio/bgm/Yoon.ogg` (loop points: the intro plays once) |
| `battle.py` | Battle sketches A (earthy) and B (tense), and Battle_Wild in 8-bit (`sketches/Battle_Wild_8bit.ogg`) |
| `battle_wild16.py` | **Battle_Wild** in 16-bit, the one in the game: `Smoking Isle/audio/bgm/Battle_Wild.ogg` |
| `battle_spirits.py` | Battle_Spirits in 8-bit (`sketches/Battle_Spirits_8bit.ogg`) |
| `battle_spirits16.py` | **Battle_Spirits** in 16-bit, the one in the game: `Smoking Isle/audio/bgm/Battle_Spirits.ogg` |
| `sib16.py` | An earlier Sib with the duet inside it (replaced) |
| `sib_alone16.py` | **Sib**: `Smoking Isle/audio/bgm/Sib.ogg` (Sib alone: the melody, the stubborn climb, the little priest) |
| `yoon_and_sib16.py` | **Yoon_and_Sib**: `Smoking Isle/audio/bgm/Yoon_and_Sib.ogg` (call and answer, then both themes together) |
| `seafarer16.py` | **Seafarers**: `Smoking Isle/audio/bgm/Seafarers.ogg` (the Seafarer fanfare leitmotif: brass, lyre, march) |
| `battle_seafarer16.py` | **Battle_Seafarers**: `Smoking Isle/audio/bgm/Battle_Seafarers.ogg` (the fanfare fast, with Thenmy's dark note) |
| `meneswa16.py` | **Meneswa**: `Smoking Isle/audio/bgm/Meneswa.ogg` (Thenmy's fifth twisted to a tritone; a cold waltz) |
| `pada16.py` | **Pada**: `Smoking Isle/audio/bgm/Pada.ogg` (the hunter's horn call; a warm folk tune in D major; the protector) |
| `thenmy16.py` | **Thenmy** in 16-bit: `Smoking Isle/audio/bgm/Thenmy.ogg` (brass, strings, harp; the march; his kindness) |
| `victory16.py` | **Victory_Isle**, the victory jingle: `Smoking Isle/audio/me/Victory_Isle.ogg` (plays once) |

To rebuild (needs Python with numpy, and ffmpeg), from this folder: `python3 yoon_full.py` (and the others).
The generated files appear here; copy `Yoon.ogg` into `Smoking Isle/audio/bgm/`.

The soundtrack's style is **16-bit** (SNES); the 8-bit versions are kept as sketches.
