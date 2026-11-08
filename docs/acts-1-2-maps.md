# Smoking Isle — Acts 1 and 2: Maps and Events (plan)

A working plan for building Acts 1 and 2 in the editor: which maps to make, what goes on each, and the
switches and variables that carry the story between them. It follows the story outline in
[concept.md](concept.md) and the overview map (`island-map.png`, the red route 1–6). How to place each kind
of event is in [editor-guide.md](editor-guide.md). **Draft: correct freely.** Proposed numbers (maps,
switches, variables, common events) are reserved only once they're built.

## Where things stand

| Map | Name | State |
|---|---|---|
| 1–3 | — | Deleted (they were early sketches) |
| 4 | TEST ROOM | Working examples of every system; the automated tests start here |
| 5 | Prologue | **Done**, and **New Game starts here**: Thenmy's narration, drips, moves to map 6 with the Ghost alone |
| 6 | Lava Tube: Waking | **Playable**: Act 1 and Act 2 pages for every object, the reflection (Yoon's gender), Lasa's arrival, the skylight. See editor-guide.md, "The opening" |

Ready to use: Star Mother, Red Bowl, Sooty Bird idols and the Sundial (CE 3, 6, 7, 4); Gather (CE 5);
Crawlway (CE 8); Choose Yoon (CE 9) and Yoon's Room: Keepsakes (CE 10); **Scene: Yoon's New Body (CE 11)**,
**Scene: The Bone (CE 12)**, **Scene: Jogging Yoon's Memory (CE 14)**; visible enemies (`<Wanderer: n>`);
the Act 2 troops and bosses (Parl 30, Great Boar 27, Daughter of the Wells 26, Lady of the Woods 29);
the body ingredients and clues as key items 721–733.

Music for every Act 1–2 place and scene now exists (see music-brief.md); SI_NightMusic swaps a map's day
track for its `_Night` version by itself. Clue-hunting can use Mystery, camp scenes Campfire, funny beats
Comedy, and beaches Beach / Beach_Night.

**Missing:** story switches and variables, a defeat/rescue common event (SI_Wanderers' *Defeat Common
Event* is `0`, so losing a fight is a game over), and every map past the waking tube.

## Who can see the Ghost (it shapes Act 1)

From lore.md, "Seeing the dead": priests and potential priests (twins, orphans, intersex and third-gender
people) can see ghosts. Everyone else looks straight through Yoon.

- **Can see Yoon:** Sib, the twins, **Juda**, Old Tinerfe, Tamonante (a twin), Brother Tibiabin, Tenesor
  (an orphan), Echedey, Guayasen. Lasa and the Children of the Caves are spirits themselves.
- **So Act 1 in town is not quite "unseen":** most people ignore Yoon, a few odd people notice, and Juda is
  a danger. Should he notice and say nothing? A small, creepy beat that pays off in Act 3.

## Story state (proposed)

One **Story** variable drives the main line, so each event page can use one condition (*Variable 5 ≥ n*).
Side progress lives in key items (already in the database) and self switches.

| Var | Name | Values |
|---|---|---|
| 5 | Story | see the beats below |
| 6 | Words (Act 1) | words Lasa has taught: unlocks Yoon's lines |
| 7 | Evidence | +1 per clue found (decides the Act 3 mountain fight) |
| 8 | Parl's fate | 0 unresolved, 1 dead, 2 enemy, 3 ally |

| Switch | Name | Use |
|---|---|---|
| 10 | Juda saw the Ghost | Act 1 slip; dialogue later |
| 11 | Lady's leave | Pada's bargain at the Lady's Table: lets the party hunt the Boar and cut the dragon tree |
| 12 | Daughter freed | Optional well boss beaten |
| 13–19 | (spare, Acts 1–2) | |

**Story beats** (gaps of 10 leave room for inserts):

| Story | Beat | Party after |
|---|---|---|
| 0 | Prologue | Ghost |
| 10 | Woke over the remains | Ghost |
| 20 | Lasa finds the Ghost | Ghost, Lasa |
| 30 | Out of the tube; drifting through Zonfahare | Ghost, Lasa |
| 40 | Home: the twins see Yoon; the family grieving | Ghost, Lasa |
| 50 | **Contact with Sib** (Recognition). End of Act 1 | Ghost, Lasa |
| 60 | The Bone (CE 12) at the remains: it was murder | Ghost, Lasa, Sib, Patience |
| 70 | Forbidden Lore: Sib finds the ritual in Juda's books (Juda's Notes, a clue) | |
| 80 | The hub opens: silver, pearl, blood in any order | |
| 90 | Parl dealt with (var 8 set) | (+ Parl, if ally? see questions) |
| 100 | **Pada joins** | + Pada |
| 110 | The Lady's Table: leave granted (switch 11) | |
| 120 | The Great Boar slain (Great Boar Flesh) | |
| 130 | Snow Urn from the snow line | |
| 140 | The ritual (CE 11), then the morning after (CE 14). End of Act 2 | Yoon (human) replaces the Ghost |

The forest's three ingredients (flesh, framework, bellflower) can come in any order once switch 11 is on.
The ritual checks all seven key items (721–727).

## Maps

Sizes are suggestions. Map notes use the tags from the editor guide. One house per map wastes map slots
and loading screens, so **towns put several small interiors on one "Interiors" map**.

### Act 1: The Ghost

**5 Prologue:** done.

**6 Lava Tube: Waking**: `<Cave>` `<Dark>`?, BGM Lava_Tubes. The remains chamber and a winding spine.
- `Waking` (autorun, exists).
- **Yoon's Remains** (the `TODO` at 8, 6): skeleton graphic. Page 1 (Story < 60): Yoon feels something,
  no words. Page 2 (Story = 50, Sib in the party): **call CE 12**, Story → 60. Page 3 (Story ≥ 60): bones only.
- **Lasa's first appearance** further down the tube: an autorun on a region or a touch event.
  Lasa joins, Story → 20.
- **Word spots** (First Words): rock, water, light, bones... Each examined *with Lasa* teaches a word:
  Words +1, self switch A. Yoon's dialogue elsewhere branches on Words.
- **Already placed (TODOs, no commands yet):** the **Star-Metal Sword** (16, 6), a meteoric iron sword
  in the ground; the **Skull on a Spear** (21, 13–14), giving **Crew Remains** (item 127) and the first
  **Wooden Spear** (weapon 131); two **mummification supplies** loot spots (27–28, 6); a **Broken Ladder**
  (26, 15). The Ghost can't hold things or equip weapons, so each gets a Ghost page ("your hand passes
  through it") and a pick-up page once Sib is along (Story ≥ 60). There's no meteoric-iron weapon in the
  database yet, and the mummy supplies need contents (Linen Cloth? Ochre Grave Paint? Pine Pitch?).
  Does the broken ladder block a way up until it's mended, or is it set dressing?
- Does the Ghost need darkness? With no light, a `<Dark>` map is very dark. Either skip `<Dark>` in Act 1,
  or let the Ghost glow faintly.

**7 The Sky-Hole** (decided): outdoors, a **hidden gully** outside Zonfahare, out of the way (why Juda chose
the tube below). Where the Ghost and Lasa **float up out of the skylight** at the end of First Words (the
ladder's Act 1 page transfers here). First daylight: grasses, a **wild garden** round the rim, the sky.
- **Yoon and Sib's secret place:** the top of their broken ladder; **their marks scratched in the rim**
  (tallies, a toy, a half-worn name: the Ghost can't read them; in Act 2 Sib can).
- **Ladder the goat** grazing at the rim (he follows the kids; he's been coming here since Yoon vanished).
- Paths out of the gully, towards town and the fields. In Act 2 the party comes back here to go down the
  mended ladder.
- Music: the fields or a quiet outdoor track after the cave. Daylight (or late-afternoon gold).

**8 The Warrens** (optional in Act 1, see questions): Lasa's people's tunnel town. Children of the Caves NPCs,
the Cave Hoard trader (buy back stolen things), more First Words spots. BGM Warrens.

**9 Yoon's Home (eyot)**: outdoor, `<Area: Home>`. The rocky eyot in the river just north of town, where
town, forest, grassland and marsh meet. Ladder the goat on the roof.
- The **twins**: they see Yoon (Story 30 → 40). Their blood later.
- **Mada**, grieving; she can't see Yoon. Later her own blood, then her shop.
- **Patience** wags at the empty air (she joins with Sib).
- Exits: town (south), marsh (east), fields (south-east), forest (north). This map is the Act 2 hub's heart.

**10 Yoon's Home (inside)**: `<Indoors>` `<Area: Home>`, BGM Home_Grieving in Act 1, then Home.
- **Keepsakes** in Yoon's room: CE 10 + self switch A.
- **Mada's free rest point** (Star Mother idol, or a bed scripted the same way).

**11 Zonfahare**: outdoor, no map tags needed. BGM Zonfahare (SI_NightMusic swaps in
Zonfahare_Night by itself). Sneaking for slipping past Juda. **Red Bowl idol** and **Sooty Bird idol** (`<Sooty Bird: Zonfahare>`) at the
telegraph station. NPCs from lore.md: Tazo, Acaymo, Tegue, Arminda, Uira and Poko, Chief Tama, Old Tinerfe.
- Act 1: people talk *about* Yoon and the search (mourning, the lava tubes, "Sib hasn't eaten").
  Seers react: Tinerfe squints, Tibiabin smiles. **Juda**: an event that sets switch 10 if Yoon walks into
  his line of sight (or a scripted moment).
- **Contact with Sib** (Story 50, BGM Recognition): where? Juda's shrine at dusk, the telegraph station, or the tube
  where they used to play. See questions.
- Act 2: **Acaymo** sells the silver; Uira's **Telegraph Log** (a clue, Evidence +1) once the case opens.

**12 Zonfahare Interiors**: `<Indoors>`. Several rooms on one map: **Juda's house and shrine** (Sib's room,
the books for Forbidden Lore (BGM Forbidden_Lore), sneaking past Juda at night (Sneaking)), the **telegraph station**, the **market**,
**Tegue's** smithy (repairs only: he can't make weapons any more),
**Arminda's** tattoo house (`open('tattooist')`), the **chief's hall**.

End of Act 1: maps 5–12.

### Act 2: The Body

**13 The Fields** (route 3): outdoor, BGM Grasslands. The terraces between town and Afarohare: Barley,
Lentils, Grapevine and Bean Field spots; **Feral Sheep** (troop 7) and Wild Boars (1). A bothy with a Star
Mother idol. An exit south to Afarohare (later or optional).

**14 Salt Marsh** (route 4): outdoor, `<Dark At Night>`, BGM Salt_Marsh. Reed Bed, Peat Bog, Salt Pan, Eel
Pool spots; Leeches (35), Marsh Eels (36), Cranes (37), Frogs (63), Herons (65, 66). The **copper ball** clue
(Copper Ball, Evidence +1) in a pool or a Children of the Caves hoard. Signs toward the **Hag Roost** that
should feel like a mistake (troops 38, 39: a sting area).

**15 Aguerekeu**: the stilt village at the river mouth. BGM Aguerekeu. Ure (salt, eels, leeches), **Riro**
the ferryman (knows where Parl is, for the right price), **Ana** the night telegraph operator (the voice on
the wire), Old Guacimara. Red Bowl idol and Sooty Bird idol.

**16 Parl's Hideout**: in the deep marsh. **The Chase** (BGM Chase), then **Boss: Parl (troop 30)**. After the battle:
the choice that sets variable 8 (dead / enemy / ally), Sea Pearl, **Parl's Notebook** (a clue).

**17 Mansehare** + **18 Mansehare Interiors**: the shore town past the marsh. BGM Mansehare /
Mansehare_Inside. **Dama** and the spearwives' headquarters: the stolen-pearl case (Dama investigating
for Chief Tama and Iras), so the Parl quest starts or ends here. Iras and Gara, Tamonante's temple (she can
see Yoon), Ico (pearls), Hotu, Vaiere, Warhus, Rapu. Shore enemies: Monk Seals and Crabs (6), Shore
Crabs (53), Gannets (52); Shearwaters (51) as `<Night Troops: 51>`.

**Blood from Yoon's kin**: on maps 9–10, not a map of its own: the twins give theirs, Mada keeps a vial
for ritual potions, Pada adds his once he joins. One event gives **Kin's Blood** when all three are in
(or two and Pada, see questions).

**Pada joins** (Story 90 → 100): an autorun at home or wherever the party next goes. He has heard from
the twins and followed Sib. The adult rescue now applies.

**19 Laurel Forest: Edge** (route 5): outdoor, `<Dark At Night>`, BGM Laurel_Forest. Laurel, Bitterwood,
Bracken, Strawberry Tree spots; Wild Boars (1), the laurel mix (2), Centipedes (3), Pigeons (60), Bee Rock
(61). The **broken staff** clue: Patience digs it up (a spot only Patience triggers? a Script check that
actor 12 is in the party). Places Pada can't go yet are blocked until switch 11.

**20 The Lady's Table**: her feasting hall. BGM Ladys_Table. Pada asks leave to hunt
the Great Boar and cut a dragon tree: switch 11 on. A failure or insult could lead to the lowland Lady boss
(troop 29), or keep her as a later fight.

**21 Laurel Forest: Deep**: Boar-Men (10), Imps and Green Horses (9), Owls (11), the Forest Patrol (12): the
"you broke the forest's rules" fights; the simulation says place these only after Pada joins. The
**Dragon Tree** (Dragon-Tree Framework: a story event, not CE 5, since it gives a key item once) and the
**living Bellflower** (the heart; BGM Living_Things). Exits to the forest homes (optional): the **Maiden's
Spring**, the **Children's Garden**, the **Boar's Wallow**, the **Owl Towers**.

**22 The Great Boar's Ground**: **The Hunt** (BGM Hunt: tracking, Pada's horn call), then **Boss: Great Boar
(troop 27)**, Can Escape off, then Great Boar Flesh and Story → 120.

**23 The Well** (optional): a First Sailor well; **Boss: Daughter of the Wells (troop 26)**, switch 12. BGM Wells.

**24 Highland Pines / Idekeu** (route 6): `<Dark At Night>`, BGM Alpine_Forest. The Idekeu loggers (Tuu,
Ayoze, Hupa flirting with an oblivious Pada). Pine, Pine Resin, Juniper spots; Ravens (15), Mouflon (17).

**25 Alpine Meadows / Chafakeu**: Nui, Yeh, Bentor (he saw the Shepherd of the Deer). Alpine Herd (18),
Golden Eagles (19), Hares (74). The Shepherd (troop 28) belongs to Act 3 or later unless you want it here.

**26 The Snow Line**: BGM Snowy_Peak. Wind, Snowline Quartz. The **Snow Urn**: a story event (the urn needs Sib's magic to
stay frozen) → Story 130.

**27 The Ritual Site**: where the body is made. **CE 11 Scene: Yoon's New Body** (BGM Ritual), then swap actor 1
(Ghost) for actor 2 (Yoon) in the party, Story 140, then **CE 14** the next morning. Where it happens is an
open question.

## Common events to add

| CE | Name | What it does |
|---|---|---|
| 22 | Defeat: Rescue | Set as SI_Wanderers' *Defeat Common Event*. Story < 100: fade, Sib wakes the party at home (map 10); Story ≥ 100: Pada carries everyone to the last Star Mother idol. Recover all; Pada's scolding line |
| 23 | Evidence +1 | Adds 1 to variable 7, plays a sound and shows "A clue: ..."; every clue event calls it |
| 24 | Ritual check | Counts key items 721–727 and tells the party what is still missing (Sib reads the list) |

## Clues found in Acts 1–2

| Clue | Where | Map |
|---|---|---|
| Crushed skull, cut marks | CE 12, the remains | 6 |
| Juda's Notes | His books, Forbidden Lore | 12 |
| Telegraph Log | Uira, once the case opens | 11/12 |
| Parl's Notebook | After his boss fight | 16 |
| Copper Ball | The marsh, or a hoard | 14 (or 8) |
| Broken Staff | Patience digs it up | 19 |

## Open questions

1. ~~**Maps 1–3**~~ **Deleted.**
2. **Act 1 length and content:** Act 1 has no combat. How is it played: First Words spots, eavesdropping on
   people in town, small ghost puzzles (passing through things? moving small objects?)? How many words does
   Yoon need before reaching Sib?
3. **The Warrens in Act 1:** does Lasa take Yoon home, or does the Warrens wait for a later act?
4. **Contact with Sib:** where and how? Grief over Yoon is the obvious draw: Sib alone at the tube where they
   played, or at the shrine.
5. **Forbidden Lore before or after the Bone?** Sib needs the ingredient list. Either Sib already knows the
   ritual (then the Bone is first, as concept.md says) or reads it first.
6. **The silver bracelet:** who works the silver? Acaymo sells it; Mahina (the jeweller) is in Celhare, far
   off. Tegue can't make things any more, so maybe Sib knaps a mould, or a Zonfahare jeweller is added.
7. **Parl as ally:** does he join the party in Act 2, or only become available later (Act 4)?
8. **Kin's Blood:** does it need Pada's blood (so after he joins), or are the twins and Mada enough?
9. **Afarohare and Mansehare:** are both in Act 2? Mansehare is needed for Dama and the pearl case;
   Afarohare could wait.
10. **The ritual site:** the waking tube (closing the circle), Juda's shrine at night (risky), or a hidden
    place Lasa knows.
