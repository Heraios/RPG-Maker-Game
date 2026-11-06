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
| `island_tune.py` | The Island tune itself (the notes, chords and harmony), shared by the town and village tracks |
| `zonfahare16.py` | **Zonfahare**: `Smoking Isle/audio/bgm/Zonfahare.ogg`, the main town (the Island tune at its fullest over a market crowd, goats, a hammer, and the telegraph tapping ZONFAHARE in Morse) |
| `laurel_forest16.py` | **Laurel_Forest**: `Smoking Isle/audio/bgm/Laurel_Forest.ogg`, about three minutes, mostly ambience (drizzle, drips, birds, pigs): Falmi's theme as the Lady of the Woods in her lowland aspect, warm, moody, with a trick from the Master of Deception |
| `alpine_forest16.py` | **Alpine_Forest**: `Smoking Isle/audio/bgm/Alpine_Forest.ogg`, about 3½ minutes, mostly ambience (wind in the pines, a stream, woodpecker, ravens): Falmi's theme slow and frosty for the Lady's goat-centaur aspect, her hooves and herd bells, and the Shepherd of the Deer's pipe |
| `grasslands16.py` | **Grasslands**: `Smoking Isle/audio/bgm/Grasslands.ogg`, about three minutes, mostly ambience (warm wind, crickets, skylarks, goat bells): the Island tune drifting in from over the hill, two herders whistling it across the valley, then walking with you |
| `ambience.py` | Shared nature sounds for the ambient tracks (wind, birds, insects, bells, hooves, a stream) |
| `grief16.py` | **Grief**: `Smoking Isle/audio/bgm/Grief.ogg` (the village mourning Yoon; later Pada): Yoon and Sib's music slow and broken, the village's lament (the Island tune's answer in the minor), Yoon answering Sib unheard |
| `marsh_tune.py` | The Marsh tune (E minor, a reed-pipe melody leaning on B flat), shared by the marsh tracks and Aguerekeu |
| `salt_marsh16.py` | **Salt_Marsh**: `Smoking Isle/audio/bgm/Salt_Marsh.ogg`, about 2¾ minutes, mostly ambience (frogs, lapping water, herons, cranes far off): the Marsh tune on a reed pipe over a wavering drone |
| `mansehare16.py` | **Mansehare**: `Smoking Isle/audio/bgm/Mansehare.ogg`, the shore town: the Island tune as a rowing song, the pearl divers' slow version, the Seafarer fanfare as a friendly counter-line (Seafarers live here too) and a horn on the docks; surf, gulls, the telegraph tapping MANSEHARE |
| `aguerekeu16.py` | **Aguerekeu**: `Smoking Isle/audio/bgm/Aguerekeu.ogg`, the marsh village on stilts: the Island tune as a poling song blended with the Marsh tune; frogs, water under the floors, a crane nobody reacts to; the telegraph tapping AGUEREKEU (and, faintly, another hand on the line) |
| `boss_parl16.py` | **Boss_Parl**: `Smoking Isle/audio/bgm/Boss_Parl.ogg`, Parl's jig crossed with Battle_Seafarers' riff in a driving 12/8; an intro built like the Great Boar's |
| `hag_roost16.py` | **Hag_Roost**: `Smoking Isle/audio/bgm/Hag_Roost.ogg`, the Marsh tune as a wrong lullaby in 3/4, with Tou's minuet faintly out of step under it |
| `inside16.py` | Inside versions of the settlements, in `Smoking Isle/audio/bgm/`: **Zonfahare_Inside**, **Mansehare_Inside**, **Aguerekeu_Inside** (the place's sounds muffled through the walls, a hearth, its tune small and homely; `python3 inside16.py mansehare` makes one) |
| `shrine16.py` | **Shrine** (inside a shrine or temple: a priest humming the Island tune over a drone, drips in a stone basin, chimes) and **Island_Chant** (the Island tune as a ceremony: a priest calls, the people answer, slit drums) |
| `dread16.py` | **Dread**: `Smoking Isle/audio/bgm/Dread.ogg`, discovering the murder: a sting, then Yoon's first four notes stuck on the wrong one, a heartbeat, cave drips; Juda's hymn, bent, barely there |
| `battle_ancients16.py` | **Battle_Ancients**: `Smoking Isle/audio/bgm/Battle_Ancients.ogg`, for First Sailor remnants (Hags, Owls, Stonemen): Tou's minuet as a dark, fast waltz; the Hags' lullaby with an owl; the Stonemen at half speed |
| `ritual16.py` | **Ritual**: `Smoking Isle/audio/bgm/Ritual.ogg`, building Yoon's body (the climax of Act 2): each friend's few notes (Pada's horn call, Sib's counting, Dama's call, Falmi's sprout, Lasa's skip, the Island tune) arrive one by one, gather, and become Yoon's theme; then the chord turns major and a heartbeat starts |
| `mystery16.py` | **Mystery**: `Smoking Isle/audio/bgm/Mystery.ogg`, everyday clue-hunting: a tiptoeing marimba tune over a plucked walking bass and a ticking clock; the telegraph taps WHO; low in the bass, Juda's hymn in a minor key (a quiet clue) |
| `campfire16.py` | **Campfire**: `Smoking Isle/audio/bgm/Campfire.ogg`, the party's evenings and resting at bothies: a lilting 6/8 tune by a crackling fire; a flute squeaks a sour note and someone chuckles; the Island tune hummed; someone falls asleep and snores |
| `ladys_table16.py` | **Ladys_Table**: `Smoking Isle/audio/bgm/Ladys_Table.ogg`, the Lady of the Woods' too-merry feast: Falmi's theme as an oom-pah band with a slightly sour organ, cups and laughter; a hush for Pada's horn call (asking leave to hunt) and the Lady's slow, grand answer; the Master of Deception starts it in the wrong key |
| `warrens16.py` | **Warrens**: `Smoking Isle/audio/bgm/Warrens.ogg`, the Children of the Caves' village, about 2¼ minutes, mostly ambience (drips, tunnels, little feet, giggles, whispers): they knock WARRENS in Morse on the stone; Tou's minuet on a far-off music box, then sung by the Children |
| `install.py` | Copies finished renders into the game (`python3 install.py Ritual` makes `audio/bgm/Ritual.ogg` and `.m4a`; `--me` for jingles) and prints how loud each one is (`--check` just measures) |
| `jingles16.py` | The short jingles, in `Smoking Isle/audio/me/`: **Defeat_Isle** (battle lost and game over), **Rest_Isle** (resting), **Item_Isle** (a key item, like each body ingredient), **Save_Isle** (a Red Bowl idol) |
| `title16.py` | **Title**: `Smoking Isle/audio/bgm/Title.ogg`, the title screen (Yoon's theme on a lone kalimba, then the island joins; the volcano breathing) |
| `prologue16.py` | **Prologue**: `Smoking Isle/audio/bgm/Prologue.ogg` (Thenmy telling the story: a lyre by a fire, his theme, the myth of the stolen star in the middle) |
| `lava_tubes16.py` | **Lava_Tubes**: `Smoking Isle/audio/bgm/Lava_Tubes.ogg` (about three minutes, mostly ambience: drone, drips, lava, a heartbeat, a far-off cave-fae melody) |
| `to_beepbox.py` | Every 16-bit track above as a **BeepBox** song in `beepbox/` (`Yoon.json` and so on). In BeepBox: **File → Import JSON**, then pick the file. BeepBox uses its own simple instruments, so it sounds chippier, but every note, bar and loop is there to edit |
| `victory16.py` | **Victory_Isle**, the victory jingle: `Smoking Isle/audio/me/Victory_Isle.ogg` (plays once) |

To rebuild (needs Python with numpy, and ffmpeg), from this folder: `python3 yoon_full.py` (and the others).
The generated files appear here; copy `Yoon.ogg` into `Smoking Isle/audio/bgm/`.

The soundtrack's style is **16-bit** (SNES); the 8-bit versions are kept as sketches.
