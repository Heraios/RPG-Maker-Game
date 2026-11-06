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

**Made so far** (in `music/`, built in code): **Island** (the Island tune), **Island_Chant**, **Shrine**, inside versions (**Zonfahare_Inside**, **Mansehare_Inside**, **Aguerekeu_Inside**), **Dread**, **Battle_Ancients**, **Salt_Marsh**, **Mansehare**, **Aguerekeu**, **Hag_Roost**, **Boss_Parl**, **Grief** (the mourning; later Pada), **Laurel_Forest** (the Lady's lowland aspect), **Alpine_Forest** (her highland aspect), **Grasslands**, **Zonfahare** (the main town), **Title** (on the title screen), **Prologue** (Thenmy telling the
story), **Lava_Tubes** (long, mostly ambience), a leitmotif for every party member (**Yoon**, **Sib**, **Lasa**, **Pada**,
**Juda** and **Juda_Corrupted**, **Dama**, **Parl**, **Tou**, **Falmi**, **Thenmy**, **Patience**, **Aday**, **Kathrout**), **Yoon_and_Sib**, **Seafarers** and
**Meneswa** (themes), **Battle_Wild**, **Battle_Spirits** and **Battle_Seafarers** (in `audio/bgm`), and the
**Victory_Isle**, **Defeat_Isle**, **Rest_Isle**, **Item_Isle** and **Save_Isle** jingles (in `audio/me`), plus 8-bit sketches. For Acts 1 and 2: **Ritual**, **Mystery**, **Campfire**, **Ladys_Table**, **Warrens**, **Recognition**, **Sneaking**, **Wells**, **Forbidden_Lore**, **Hunt**, **Chase**, **Home**, **Home_Grieving**, **Living_Things**, **Comedy**, **Snowy_Peak**, **Beach**. Night versions: **Zonfahare_Night**, **Mansehare_Night**, **Aguerekeu_Night**, **Laurel_Forest_Night**, **Grasslands_Night**, **Salt_Marsh_Night**, **Beach_Night**.

**Leitmotif links:** the Seafarer fanfare (1-5-1-2-flat 3) runs through Seafarers and Battle_Seafarers;
Thenmy's opening fifth (C up to G) becomes a tritone (C up to G-flat) in Meneswa's theme; his dark D-flat
returns in both the battle and hers. Pada's theme is in D major: Yoon's home note (D minor) made warm, and opens
with a hunter's horn call in open fifths, for the Great Boar fight to quote. Juda_Corrupted is Juda's hymn with every
warm note flattened; a faint whole-tone chord at the end of the warm version hides the Navigator Lord. Patience's
theme quotes Yoon's slowly (the dog who waited); Falmi's stumbles over Tou's music-box minuet; Aday's taps
"ADAY" in Morse; Parl's quotes the Seafarer fanfare, homesick; Dread hides Juda's hymn, bent, low on an organ (a clue);
Battle_Ancients (Hags, Owls, Stonemen) is Tou's minuet as a fight; his boss fight crosses his jig with Battle_Seafarers' riff. The Island tune is a call (G A B D, D E D) and an answer
(B A G A, B A G); its last answer dips to a flat seventh (F), the island's own colour. The Prologue's myth section darkens on the same D-flat as
Thenmy's theme; the Children of the Caves' melody in Lava_Tubes is in D double harmonic (Yoon's D, made strange).
Moved down into D, Tou's minuet starts with the same five notes as Yoon's theme (D F A G-sharp A); the Warrens
plays it that way. The Ritual gathers every friend's motif into Yoon's theme; Mystery hides Juda's hymn in the bass.
Falmi's sprout (F A C) and Yoon's opening (D F A) share F and A: in Living_Things the sprout grows into Yoon's theme
a note at a time. The **Lady of the Wind** has her own leitmotif (`music/wind_tune.py`: E dorian, a falling gust, a
rising gust, a high cold arc with a C sharp, a sigh), first heard on Snowy_Peak.

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
are mostly ambience (like Lava_Tubes). Every settlement has a telegraph station, so each has faint
telegraph clicks tapping the place's name in Morse. Each also has an **inside** version (the outdoor sounds
muffled through the walls, a hearth, the tune small and homely). In Act 4, each town can have an occupied
version: thinner, the tune hesitant, a Seafarer drum in the distance.

**Towns** (the tune, full):
- **Zonfahare** (done): market crowd, goats, Tegue's hammer, the telegraph tapping ZONFAHARE; the full tune. Home.
- **Mansehare** (done): surf, gulls, creaking boats; the Island tune as a rowing song; the pearl divers' slow
  version; the Seafarer fanfare made major as a friendly counter-line (Seafarers live here too); a horn on the docks.
- **Afarohare:** wind in the barley, goat bells, the mill; slow and sunny, a harvest dance (Yeray's wine).
- **Namethare:** picks in the tunnels, the battery hum; low and dignified, chant for the tombs.
- **Celhare:** electroplating crackle, silver chimes; the richest, showiest version; Aday's tinkering motif.

**Villages** (sounds first, fragments of the tune):
- **Aguerekeu** (done): frogs, water under the stilts, the poling stroke; the Island tune **blended with the Marsh
  tune**; a Hag's crane call far off that nobody reacts to; faintly, a second hand on the telegraph line (Parl).
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

**Grasslands** (done; the terraces): warm wind, grasshoppers, goat bells far off; the tune drifting in now and then.

**The Forest: Falmi's theme.** The forests, the Lady of the Woods, her husbands (the Master of Deception and
the Shepherd of the Deer) and the forest "towns" all share **Falmi's leitmotif** (F major; she was grown for the
Lady). Each arranges it its own way:
- **Laurel rainforest** (done: Laurel_Forest): drips, birds, insects, something watching; Falmi's theme in fragments that stop when you
  stop. Warm and wet: the Lady's porcine aspect (temperamental, gregarious).
- **Alpine forest and meadows** (done: Alpine_Forest; the theme in Lydian over open fifths): cold wind in the pines; Falmi's theme slower and cooler: the Lady's
  goat-centaur aspect (polite, cold).
- **The Lady of the Woods:** the theme grand and old, as if Falmi's tune were really hers all along.
- **The Master of Deception:** the theme as a trick: it changes shape, starts in the wrong key, giggles.
- **The Shepherd of the Deer:** the theme on a lone shepherd's pipe, with bells; the songs priests teach him.
- **The Lady's Table:** a too-merry feast on it. **The Children's Garden:** whispers and giggles, the theme
  tiny and fragile (the Princess's fires come for it in Act 5). **The Maiden's Spring:** running water, a wordless
  song on it. **The Boar's Wallow:** mud, heavy drums, cheering; the theme as a stomp.

**The Buried Court and the dry side: Tou's theme.** The volcanic desert and Tou's palace each have **Tou's
leitmotif** (her music-box minuet, E minor, 3/4):
- **Volcanic desert:** heat shimmer, dry wind, stones settling; the minuet stretched into long notes;
  Stoneman steps that stop when you look.
- **Tou's palace:** the minuet in empty halls with long echoes; a frozen court.
- **The Warrens:** cave ambience (as in Lava_Tubes), with Tou's minuet faintly under it: the Children of the
  Caves are her subjects.
- **The Owl Towers:** the two themes **at war**: Falmi's (F major) and Tou's (E minor) a semitone apart,
  fighting over the ruins, as the Lady and Tou dispute the Owls' loyalty. (Falmi's own theme already stumbles
  over Tou's tune.)

**The other wilds** (ambience, their own music):
- **Beaches and coastal plain** (done: Beach and Beach_Night, the coast near Mansehare): surf, wind, gulls, shell
  chimes; a slow flute that comes and goes with the waves; Dama's conch far out; Mansehare's rowing song down the coast.
- **Salt marsh** (done: Salt_Marsh): frogs, insects, slow water, a heron; the **Marsh tune** (E minor, leaning on a
  B flat) on a reed pipe over a drone; uneasy.
- **Snowy peak** (done: Snowy_Peak): wind, a wind-choir singing the Lady of the Wind's own leitmotif, one high flute;
  Yoon's theme frozen on glass bells (the last ingredient).
- **Dry-side sea cliffs:** booming waves, seabirds, hard wind.
- **Lava tubes:** done (Lava_Tubes).

**Other homes:** the Hag Roost (done: the Marsh tune as a wrong lullaby, Tou's minuet faintly under it), the Seafarer camp (drills, snare, the fanfare; homesick
songs at night).

**Day and night:** each wild place can have a night version (forest birds become owls and frogs; the desert
turns to cold wind and stars). The **SI_NightMusic** plugin switches them by the game's time of day: a map whose
track has a night version (its name plus `_Night`) plays that at night, fading across when night falls or day
breaks. By day the wilds have daytime insects (grasshoppers, bees, cicadas); crickets are for the night.

## Still to make: Acts 1 and 2
**Already planned:**
- **The ritual** (done: Ritual): building Yoon's body, the climax of Act 2: every ingredient and every friend's theme gathering
  into Yoon's theme as they get a body.
- **Mystery** (done): everyday clue-hunting (questioning people, Dama's pearl case, Uira's telegraph logs); lighter than
  Dread, curious; it hints at Juda's theme.
- **Campfire** (done): the campfire scenes and resting at bothies; warm, quiet, a little funny.
- **The Lady's Table** (done: Ladys_Table): Falmi's theme as her feast (Pada asks permission for the hunt).
- **The Warrens** (done): the Children of the Caves' village: cave ambience with Tou's minuet faintly under it.
- **Snowy peak** (done: Snowy_Peak). **Beach** (done: Beach, Beach_Night).
- If the route goes there: **Idekeu**, **Chafakeu**, **Afarohare**, **Jarcotapu**.

**New ideas:**
- **First Words** (Act 1): Lasa teaching Yoon to speak: her theme and Yoon's taking turns, Yoon's starting as
  single notes and slowly joining into phrases.
- **Unseen** (Act 1): Yoon drifting among people who can't see them: Zonfahare's music thin and far away, or a
  lonely kalimba against the warm sounds of life.
- **Home** (done: Home and Home_Grieving; the house on the river eyot): Yoon's family house (the twins can see Yoon; the family grieving): Yoon's theme as a half-remembered
  music box, warmer than Grief.
- **Recognition** (done; end of Act 1): Sib realising who the ghost is: a bell, Sib's counting notes, then Yoon's,
  finally heard (Grief's unheard answer, reversed).
- **Sneaking** (done): the ritual is forbidden and Juda mustn't know: tiptoeing, plucked, comic pauses.
- **Forbidden Lore** (done: Forbidden_Lore): Sib reading the ritual in Juda's books by candlelight: his hymn hushed, something wrong in it.
- **The Chase** (done: Chase): hunting Parl down before his fight: his jig fast and slippery, running into Boss_Parl.
- **The Hunt** (done: Hunt): tracking the Great Boar with Pada: quiet and tense, his horn call held back, a heartbeat drum.
- **The Wells** (done: Wells): freeing one of the Lady's daughters from a First Sailor well: water, stone, echoes; Tou's minuet
  and Falmi's theme tangled together. A daughter could fight to Battle_Ancients.
- **Living Things** (done: Living_Things): harvesting the dragon tree and the living bellflower (the heart): Falmi's sprouting phrase
  growing into Yoon's theme.
- **Night versions** (done: Zonfahare_Night, Mansehare_Night, Aguerekeu_Night with Ana's night shift on the telegraph,
  Laurel_Forest_Night, Grasslands_Night, Salt_Marsh_Night). New towns and wilds can get theirs the same way, in `night16.py`.
- **A comedy cue** (done: Comedy) for the funny beats (Hupa flirting with an oblivious Pada, Ure naming his leeches).

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
| 12 | **Shrine / temple** (done: Shrine; Island_Chant for ceremonies) | Calm, sacred, chant-like: the Island tune hummed by a priest | Loop |
| 13 | **Tou's buried palace** | The First Sailors' eerie beauty; lonely and royal | Loop |
| 14 | **Seafarer camp / occupation** | The Seafarer fanfare, military and oppressive | Loop |
| 15 | **Battle** | Driving, upbeat, island percussion under a pulse melody | Loop |
| 16 | **Seafarer battle** | Marching snare and brass-like fanfare | Loop |
| 17 | **Boss** | Heavy, urgent; for the Ladies, the Bulls and the Great Boar | Loop |
| 18 | **Juda** | His warm theme turned dark; the betrayal and the fight on the mountain | Loop |
| 19 | **Final boss** | Every motif colliding; the Destroyer's drone underneath | Loop |
| 20 | **Sorrow** (done: Grief) | Yoon and Sib's theme, slow and broken; the village's lament (the Island answer in the minor); the mourning in Act 1, Pada's death | Loop |
| 21 | **Tension / mystery** (done: Dread, for the murder's discovery; Mystery, for clue-hunting) | Investigation, Dama's case, secrets | Loop |
| 22 | **Campfire** (done) | Warm, quiet, a little funny; the party's evening scenes | Loop |
| 23 | **Victory** | Short, bright fanfare | Jingle |
| 24 | **Defeat** (done: Defeat_Isle; also the game over) | Short, sad | Jingle |
| 25 | **Item get / rest / save** (done: Item_Isle, Rest_Isle, Save_Isle) | Tiny, cheerful | Jingle |

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
