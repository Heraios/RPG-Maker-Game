# Smoking Isle — Music Brief

For a composer, or for judging free and paid music packs. Placeholder music in the game today: RPG Maker's
default tracks (`audio/bgm`).

## The sound in one line
**NES-era chiptune with island colour, warmed by the odd real instrument** — somewhere between *Mother* /
*EarthBound* and a myth told around a fire on a volcanic island (the Canary Islands, Rapa Nui, Minoan Crete).

- **Core:** chiptune in the NES palette: two pulse channels, triangle bass, noise percussion. Simple, catchy,
  memorable melodies.
- **Colour (the EarthBound side):** now and then a real or sampled sound breaks through: a log drum, a conch
  call, a bone flute, a hand-clap, a sung syllable, a ship's bell. Use it sparingly, for character.
- **Tone:** sweet and funny on the surface (a school-trip friend group with a ghost, a fae, a doll queen and a
  forest prince in it), with grief and dread underneath (a murdered child, a betrayal, an invasion). The music
  should be able to be playful and then, with the same melody, break your heart.

**Reference points:** *Mother* (NES), *EarthBound* and *Mother 3*, the NES *Dragon Quest* and *Final Fantasy*
games; for the island colour, Polynesian log-drum and chant rhythms, Canarian folk (*tajaraste*, the *chácaras*
castanets, the *silbo* whistle), and Mediterranean modes for the invaders.

## Three peoples, three sounds
| Who | Sound | Notes |
|---|---|---|
| **Islanders** (Yoon, Sib, Pada, Dama, the villages) | Warm, communal, rhythmic: log and slit drums, clapping, chant-like melodies, flute | Pentatonic and folk modes. Music made by many people together |
| **All-Seafarers** (Thenmy, the invasion, Meneswa) | Grand and a little cold: brass-like fanfares, marching snare, lyre-like arpeggios | Phrygian and Dorian modes (Mediterranean, Minoan). Impressive, imperial, slightly hollow |
| **First Sailors** (Tou, the ruins, the Navigator Lords) | Eerie, glassy, ancient: slow arpeggios, long echoes, unresolved chords | Beautiful and wrong at the same time |
| **The caves and the Destroyer** | Low drones, dripping, heartbeat percussion, almost no melody | Silence is part of it |

## Leitmotifs
Short melodies (4–8 bars) that come back throughout, changed to fit the moment.
1. **Yoon's theme:** curious, a little off (a "wrong" note that resolves). Played sweetly on the title, eerily
   in the ghost scenes, triumphantly late on.
2. **Yoon and Sib:** gentle and hopeful, the heart of the game. Comes back in the sad scenes and the ending.
3. **The Island:** a simple folk tune everyone on the island knows (villages, festivals, the war council).
4. **The Seafarers:** a fanfare. Proud under Thenmy; cruel and distorted under Meneswa.
5. **Juda:** warm and wise at first; the same melody in a minor, broken form after the betrayal.

## Track list
Loop = loops in game; Jingle = plays once.

| # | Track | Mood and notes | Kind |
|---|---|---|---|
| 1 | **Title** | Yoon's theme, gentle and mysterious; the volcano smoking in the distance | Loop |
| 2 | **Yoon's theme** | Curious, a little uncanny; for the ghost's first wanderings | Loop |
| 3 | **Yoon and Sib** | Tender, hopeful; for quiet moments between them | Loop |
| 4 | **Zonfahare** (the main town) | Busy, friendly, communal; the Island tune | Loop |
| 5 | **Village** (smaller places) | A gentler, simpler arrangement of the Island tune | Loop |
| 6 | **Laurel forest** | Lush, green, playful, with hidden things watching; the Lady of the Woods' domain | Loop |
| 7 | **Salt marsh** | Wet, slow, slightly eerie; hags and herons | Loop |
| 8 | **Coast** | Open, breezy, waves (a noise-channel surf); the Birdmen's sea stack | Loop |
| 9 | **Lava tubes** | Dark, echoing, dripping; the caves' drone with a faint cave-fae melody | Loop |
| 10 | **Mountain / alpine forest** | Cold, high, lonely; the trek with Juda | Loop |
| 11 | **Volcanic desert** | Hot, harsh, shimmering; long notes | Loop |
| 12 | **Shrine / temple** | Calm, sacred, chant-like | Loop |
| 13 | **Tou's buried palace** | The First Sailors' eerie beauty; lonely and royal | Loop |
| 14 | **Seafarer camp / occupation** | The Seafarer fanfare, military and oppressive | Loop |
| 15 | **Battle** | Driving, upbeat, island percussion under a pulse melody | Loop |
| 16 | **Seafarer battle** | Marching snare and brass-like fanfare | Loop |
| 17 | **Boss** | Heavy, urgent; for the Ladies, the Bulls and the Great Boar | Loop |
| 18 | **Juda** | His warm theme turned dark; the betrayal and the fight on the mountain | Loop |
| 19 | **Final boss** | Every motif colliding; the Destroyer's drone underneath | Loop |
| 20 | **Sorrow** | Yoon and Sib's theme, slow and broken; Pada's death | Loop |
| 21 | **Tension / mystery** | Investigation, Dama's case, secrets | Loop |
| 22 | **Campfire** | Warm, quiet, a little funny; the party's evening scenes | Loop |
| 23 | **Victory** | Short, bright fanfare | Jingle |
| 24 | **Defeat** | Short, sad | Jingle |
| 25 | **Item get / rest / save** | Tiny, cheerful | Jingle |

Optional ambience (`audio/bgs`, no melody): surf, wind, marsh frogs, cave drips, crackling fire, telegraph clicks.

## Technical
- **Format:** `.ogg` (and `.m4a` copies), 44.1 kHz. Music goes in `audio/bgm`, jingles in `audio/me`,
  ambience in `audio/bgs`.
- **Loops:** seamless, with the loop points written into the file (`LOOPSTART` / `LOOPLENGTH` tags), or a clean
  end that runs straight back into the start.
- **Length:** most loops 1–2 minutes; jingles 2–6 seconds.
- **Licence:** for a commission, the right to use the music in the game and its trailer, and to sell the game;
  the composer keeps the right to show it in their portfolio.

## Doing it yourself
**FamiStudio** (free) writes real NES-style music and exports `.ogg` directly; **BeepBox** (free, in a browser)
is the easiest way to sketch a melody. A good first step either way: write **Yoon's theme** as a short melody,
then build other tracks around it.
