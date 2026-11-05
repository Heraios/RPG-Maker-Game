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
| `boss_great_boar16.py` | **Boss_Great_Boar**: `Smoking Isle/audio/bgm/Boss_Great_Boar.ogg` (Battle_Wild made epic; a 7/8 charge; Pada's theme in D major at battle speed) |
| `party16.py` | The rest of the party's leitmotifs, in `Smoking Isle/audio/bgm/`: **Lasa**, **Juda**, **Juda_Corrupted**, **Dama**, **Parl**, **Tou**, **Falmi**, **Patience**, **Aday**, **Kathrout** (`python3 party16.py tou` makes one) |
| `thenmy16.py` | **Thenmy** in 16-bit: `Smoking Isle/audio/bgm/Thenmy.ogg` (brass, strings, harp; the march; his kindness) |
| `island16.py` | **Island**: `Smoking Isle/audio/bgm/Island.ogg`, the Island tune everyone knows (call and answer; then all together, a dance, and a lullaby). Every town and village track will be built on it |
| `title16.py` | **Title**: `Smoking Isle/audio/bgm/Title.ogg`, the title screen (Yoon's theme on a lone kalimba, then the island joins; the volcano breathing) |
| `prologue16.py` | **Prologue**: `Smoking Isle/audio/bgm/Prologue.ogg` (Thenmy telling the story: a lyre by a fire, his theme, the myth of the stolen star in the middle) |
| `lava_tubes16.py` | **Lava_Tubes**: `Smoking Isle/audio/bgm/Lava_Tubes.ogg` (about three minutes, mostly ambience: drone, drips, lava, a heartbeat, a far-off cave-fae melody) |
| `to_beepbox.py` | Every 16-bit track above as a **BeepBox** song in `beepbox/` (`Yoon.json` and so on). In BeepBox: **File → Import JSON**, then pick the file. BeepBox uses its own simple instruments, so it sounds chippier, but every note, bar and loop is there to edit |
| `victory16.py` | **Victory_Isle**, the victory jingle: `Smoking Isle/audio/me/Victory_Isle.ogg` (plays once) |

To rebuild (needs Python with numpy, and ffmpeg), from this folder: `python3 yoon_full.py` (and the others).
The generated files appear here; copy `Yoon.ogg` into `Smoking Isle/audio/bgm/`.

The soundtrack's style is **16-bit** (SNES); the 8-bit versions are kept as sketches.
