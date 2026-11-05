# Smoking Isle — Music Brief

For a composer, or for judging free and paid music packs. Placeholder music in the game today: RPG Maker's
default tracks (`audio/bgm`).

## The sound in one line
**16-bit (SNES-era) with island colour** — somewhere between *EarthBound* / *Mother 3* and a myth told around a
fire on a volcanic island (the Canary Islands, Rapa Nui, Minoan Crete).

- **Core:** SNES-style sampled instruments: **marimba, kalimba, flute, string pads, slap and plucked bass, bells,
  brass stabs**, and wooden percussion (log drums, toms, shakers, claps). Stereo, with the SNES's echo and reverb
  and its warm, slightly muffled sound. Simple, catchy, memorable melodies.
- **Island colour:** the log drums in a 3-3-2 rhythm, chant-like flute lines, marimba and kalimba as the
  "island" voices; brass and strings for the Seafarers.
- **Tone:** sweet and funny on the surface (a school-trip friend group with a ghost, a fae, a doll queen and a
  forest prince in it), with grief and dread underneath (a murdered child, a betrayal, an invasion). The music
  should be able to be playful and then, with the same melody, break your heart.

**Reference points:** *EarthBound* and *Mother 3*, *Chrono Trigger*, *Secret of Mana*; for the island colour,
Polynesian log-drum and chant rhythms, Canarian folk (*tajaraste*, the *chácaras* castanets, the *silbo*
whistle), and Mediterranean modes for the invaders.

**Made so far** (in `music/`, built in code): **Island** (the Island tune), **Zonfahare** (the main town), **Title** (on the title screen), **Prologue** (Thenmy telling the
story), **Lava_Tubes** (long, mostly ambience), a leitmotif for every party member (**Yoon**, **Sib**, **Lasa**, **Pada**,
**Juda** and **Juda_Corrupted**, **Dama**, **Parl**, **Tou**, **Falmi**, **Thenmy**, **Patience**, **Aday**, **Kathrout**), **Yoon_and_Sib**, **Seafarers** and
**Meneswa** (themes), **Battle_Wild**, **Battle_Spirits** and **Battle_Seafarers** (in `audio/bgm`), and the
**Victory_Isle** jingle (in `audio/me`), plus 8-bit sketches.

**Leitmotif links:** the Seafarer fanfare (1-5-1-2-flat 3) runs through Seafarers and Battle_Seafarers;
Thenmy's opening fifth (C up to G) becomes a tritone (C up to G-flat) in Meneswa's theme; his dark D-flat
returns in both the battle and hers. Pada's theme is in D major: Yoon's home note (D minor) made warm, and opens
with a hunter's horn call in open fifths, for the Great Boar fight to quote. Juda_Corrupted is Juda's hymn with every
warm note flattened; a faint whole-tone chord at the end of the warm version hides the Navigator Lord. Patience's
theme quotes Yoon's slowly (the dog who waited); Falmi's stumbles over Tou's music-box minuet; Aday's taps
"ADAY" in Morse; Parl's quotes the Seafarer fanfare, homesick. The Island tune is a call (G A B D, D E D) and an answer
(B A G A, B A G); its last answer dips to a flat seventh (F), the island's own colour. The Prologue's myth section darkens on the same D-flat as
Thenmy's theme; the Children of the Caves' melody in Lava_Tubes is in D double harmonic (Yoon's D, made strange).

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

## Places: the plan
**The Island tune is the base of every town, village and sacred site, and of the grasslands.** Each place
arranges it its own way, over that place's own sounds. The rule: the more people live somewhere, the more
music. Towns are mostly music over everyday sounds; villages are sounds with a little of the tune; the wilds
are mostly ambience (like Lava_Tubes). Every settlement has a telegraph station, so each can have faint
telegraph clicks (perhaps tapping the place's name in Morse). In Act 4, each town can have an occupied
version: thinner, the tune hesitant, a Seafarer drum in the distance.

**Towns** (the tune, full):
- **Zonfahare** (done): market crowd, goats, Tegue's hammer, the telegraph tapping ZONFAHARE; the full tune. Home.
- **Mansehare:** surf, gulls, creaking boats; the tune as a rowing song; a Seafarer horn from the docks.
- **Afarohare:** wind in the barley, goat bells, the mill; slow and sunny, a harvest dance (Yeray's wine).
- **Namethare:** picks in the tunnels, the battery hum; low and dignified, chant for the tombs.
- **Celhare:** electroplating crackle, silver chimes; the richest, showiest version; Aday's tinkering motif.

**Villages** (sounds first, fragments of the tune):
- **Aguerekeu:** frogs, water under the stilts, Riro's pole; a Hag's crane call far off that nobody reacts to.
- **Idekeu:** axes, a falling tree, pitch fires, Tuu coughing; a rough work song.
- **Chafakeu:** sheep bells, wind; the tune whistled across the valley, answered by another whistle (*silbo*).
- **Tabonakeu:** chisels; the tune in stone clacks over desert wind; silence where the Stonemen stand.
- **Corajakeu:** great wind, seabirds, creaking ropes; a brave little tune plucked high over booming waves.
- **Tacandakeu:** bubbling springs, steam, the electric hum; the tune ticking like a machine.

**Sacred sites** (the tune slow and chant-like):
- **Tiltapu:** mist dripping off leaves; a choir from the tree; the tune slow, as if the tree answers.
- **Jarcotapu:** dry wind, low chant, scraping tools; quietly dark-funny; a hint of Juda's theme (a clue).
- **Amentapu:** terns, wind, the egg race's drum; the Birdmen's song over the water.
- **Banotapu:** almost silent; creaking dead wood; a tiny high melody for the sapling. Burning in Act 5.

**Grasslands** (the terraces): warm wind, crickets, goat bells far off; the tune drifting in now and then.

**The other wilds** (ambience, their own music):
- **Beaches and coastal plain:** surf, wind, gulls; a slow flute that comes and goes.
- **Laurel rainforest:** drips, birds, insects; something watching; a melody that stops when you stop.
- **Salt marsh:** frogs, insects, slow water, a heron; a reed-pipe drone; uneasy.
- **Volcanic desert:** heat shimmer, dry wind, stones settling; long notes; Stoneman steps that stop.
- **Alpine forest and meadows:** cold wind in pines; Juda's warm theme hidden in it, cooling later.
- **Snowy peak:** wind, a wind-choir (the Lady of the Wind), one high flute.
- **Dry-side sea cliffs:** booming waves, seabirds, hard wind.
- **Lava tubes:** done (Lava_Tubes).

**Other peoples' homes:** the Lady's Table (a too-merry forest feast), the Children's Garden (whispers,
giggles; fragile), the Maiden's Spring (water, wordless song), the Boar's Wallow (mud, drums, cheering),
Tou's palace (her minuet in empty halls), the Warrens (the cave-fae melody, busy and sly), the Hag Roost (a
wrong lullaby), the Owl Towers (owls, ruins, Tou's minuet broken), the Seafarer camp (drills, snare, the
fanfare; homesick songs at night).

**Day and night:** each wild place can have a night version (forest birds become owls and frogs; the desert
turns to cold wind and stars); a small plugin could switch tracks by the game's time of day.

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
**BeepBox** (free, in a browser) is the easiest way to sketch a melody. Every track made so far is in
`music/beepbox/` as a BeepBox song: open BeepBox, choose **File → Import JSON**, and pick one (for example
`Yoon.json`) to see and change its notes.
