# Smoking Isle: Editor Guide

How to use the game's custom systems by hand in the RPG Maker MV editor. The design documents
(`concept.md`, `lore.md`) say *what* the systems are; this guide says *how to place them*.

**Before you start:** close RPG Maker before pulling changes from GitHub, and save in the editor
before pushing your own.

## Editor basics used below

- **Event mode:** click the **Event** button in the toolbar (or press **F6**), then double-click a
  tile to make a new event there, or an existing event to edit it.
- **Note box:** the **Note** field at the top of the event window, next to the event's Name. The
  game reads tags written there, like `<Gather: Laurel>`. Type tags exactly as shown, angle
  brackets included. Capital letters don't matter; spelling does.
- **Calling a common event:** in the event's **Contents** list, double-click the empty line, then
  on tab **1** choose **Common Event...** and pick one from the list.
- **Map notes:** right-click a map in the map list (bottom left) → **Map Properties...** → the
  **Note** box there. Map tags go in this box, not on an event.
- **The fastest way:** the **Test Room** (map 4) has working examples of everything here. Right-click
  an example event → **Copy**, then right-click where you want it → **Paste**, and change its note.

---

## Troubleshooting: crashes on a Mac

RPG Maker MV 1.6.1 ships with a very old NW.js (the small browser that runs the game). Current macOS no
longer supports it: playtests crash to the desktop, go to a black screen, or show "nwjs quit
unexpectedly". The game's own code isn't the cause.

**The fix:** replace the NW.js inside your RPG Maker MV install with a current version from nwjs.io.
After a reinstall, or on a new computer, it has to be done again. It also makes the game noticeably faster.

**"Required value 'name' is missing or invalid":** newer NW.js versions refuse a game whose
`Smoking Isle/package.json` has an empty name. Ours is set to `"name": "smoking-isle"`. If RPG Maker ever
blanks it again, open the file in TextEdit and put the name back (keep the quotes and the comma).

---

## What's safe to change in the editor

**Best done in the editor:** painting maps; placing events and choosing their graphics, movement and
triggers; writing dialogue, choices and cutscenes; anything you judge by eye (enemy positions in troops,
animations, faces, icons); and tuning numbers (stats, prices, Mana costs, drop rates, encounters).

**Safe:**
- Changing any number, description, icon or picture on an existing database entry.
- Making new entries by **copying** an existing one (its note tags come along).
- New maps, events, dialogue, troops and common events.
- Editing note tags, as long as you copy the exact spelling from a working example.

**Can break the plugins or tests (ask first):**
1. **Renaming** items, states and equipment. Some plugins find things **by name** (gathering gives
   "Laurel Branch"; states such as "Sodden", "Dragged Below" and "Brave" are looked up by name). A rename
   breaks them quietly. Say what you want renamed and the code gets updated with it.
2. **Deleting, moving or reusing an entry's slot.** Each category has blank slots after it for new
   entries (see concept.md, "Database layout"). Notes point at things **by ID number**
   (`<Recipe In: item 406>`, `<Start Equips: armor 627>`, `<Talk Likes: 73>`), so a reused slot makes
   them point at the wrong thing.
3. **Lowering "Change Maximum"** on any database list: everything above the new maximum is lost.
4. **The numbered lists in Database → Types** (elements, skill types, weapon types, armor types,
   equipment types). The plugins use their numbers. Adding new ones at the end is fine; reordering or
   renaming isn't.
5. **Reserved switches and variables.** Don't reuse these for anything else:

   | Switch | Used for | | Variable | Used for |
   |--------|----------|-|----------|----------|
   | 1 | Surrendered (enemy talk) | | 1 | Hoard recovered (test) |
   | 2 | Tattoo removal (late game) | | 2 | Time: period |
   | 3 | Parl joined the village | | 3 | Time: day |
   | 4 | Yoon trained in swords (Thenmy) | | 4 | Yoon's gender (1 boy, 2 girl, 3 third) |
   | 5 | Sib reads Seafarer script | | | |
   | 6 | Tou reads Seafarer script | | | |
   | 7 | Night | | | |
   | 8 | Can see | | | |
   | 9 | Juda half-risen (Act 3) | | | |
   | 13 | Tube: have the old rope (map 6) | | 5 | Story (Acts 1–2: 10 woke, 20 Lasa, 25 words, 30 face, 50 Sib, 60 the bone) |
   | | | | 6 | Words known (First Words) |
   | | | | 9–11 | Yoon's temperament: Sweet, Funny, Unhinged |
   | | | | 12–13 | Lasa: times floated away; first impression |

6. **Common events 3–10 and 15–22** (Star Mother Idol, Sundial, Gather, Red Bowl Idol, Sooty Bird Idol, Crawlway,
   Choose Yoon, Yoon's Room: Keepsakes; 15 Playtest: To the Test Room; 16–18 First Words; 19–22 the field spells and Moonmilk Paint).
   Their wording can change, but don't move or delete them. States 210–212 (Yoon's hidden gender
   effects), 213 (Ready to Toss, Aday's Toss) and 214–219 (the weapon-art stances: Braced, En Garde,
   Warding, Covered, Following Up, Brought Down) are also used by number.
   The characters' own resting moves are skills 11–21 (Meditate, Land, Fly, Diver's Breath, Slouch, Stop
   Slouching, Oil Joints, Photosynthesize, Tinker, Take Notes, Parade Rest) with states 7–13 (Meditating,
   Landed, Slouching, Oiled Joints I–III, Notes in Hand). States are found by name, so keep the names;
   Slouching's note lists skill 16 (Stop Slouching) by number.
7. **Plugin Manager order.** Changing a plugin's settings is fine; moving plugins up or down isn't.
8. **Troop 13 and the Test Room (map 4)** are used by the automated tests. Copy them instead of editing.

**Aday and Kathrout** (actors 13 and 14) use a few note tags of their own (`SI_Specialists.js`):
- Kathrout can't use glyph tattoos; her class note `<Codex Slots: 2>` gives her two codex slots (the only
  character with two). A First Sailor inscription can teach her a spell with the script call
  `SmokingIsle.Specialists.study(14, skillId)`.
- Gear with `<Taboo Tags: grave>` (the Crew clothes, the coral eye and pupil, the Crescent Pectoral) is grave
  goods: Kathrout won't wear it. Tag any new tomb find the same way.
- Aday's class note `<Item Power: 50>` and `<Item Saver: 25>` set how much better his items work and how
  often he saves one; change the numbers freely.
- Their portraits are placeholders from the faces folder (People15 for Aday, Actor3 for Kathrout): swap
  them in the Actors tab.
- In the Test Room, the **Recruiter** can add them.

**Weapon skills** each need a move from the equipped weapon (`<Requires Move: ...>` on the skill, `<Moves: ...>`
on the weapon). Characters start with a small kit (the class's Learnings); teach more in an event with
**Change Skills**. The Test Room's **Weapon Master** teaches everyone every weapon skill. A new weapon of an
existing type should copy its family's moves (for example `knife` on daggers, `ward` on staves), or its
family's own skills won't work with it.

---

## Writing dialogue: names and Yoon's pronouns

**Names.** The player names every party member, so don't type names into dialogue. Use **`\N[n]`**, the
character's actor number: `\N[2]` Yoon, `\N[3]` Sib, `\N[4]` Lasa, `\N[5]` Pada, `\N[6]` Juda,
`\N[7]` Dama, `\N[8]` Parl, `\N[9]` Tou, `\N[10]` Falmi, `\N[11]` Thenmy, `\N[12]` Patience.

**Yoon's pronouns.** Write the *they* form inside a code and the game swaps in the right word:

| Write | Boy | Girl | Third gender |
|-------|-----|------|--------------|
| `\YP[they]` | he | she | they |
| `\YP[them]` | him | her | them |
| `\YP[their]` | his | her | their |
| `\YP[theirs]` | his | hers | theirs |
| `\YP[themself]` | himself | herself | themself |
| `\YP[they're]` | he's | she's | they're |
| `\YP[They]` (capital) | He | She | They |

- **Verbs** that change with the pronoun: `\YV[are|is]`, `\YV[were|was]`, `\YV[have|has]`,
  `\YV[go|goes]` (the *they* form first).
- **Any other words:** `\YG[boy|girl|third]`, e.g. `\YG[son|daughter|child]`, `\YG[lad|lass|little one]`.

Example: `\N[7]: That \YP[they] \YV[are|is] back doesn't change what was done to \YP[them].`

**Sib is always they/them**: just write it. Everyone else's pronouns don't change.

**Branching on Yoon's gender:** in an event, use a **Conditional Branch** on variable 4 (1 boy, 2 girl,
3 third gender), or a Script condition `SmokingIsle.Yoon.isBoy()` / `isGirl()` / `isThird()`.

**The start of the game:** call common event **9 "Choose Yoon"** in the opening event. It asks boy, girl
or third gender and then Yoon's name. **Yoon's room:** an event there calls common event **10 "Yoon's
Room: Keepsakes"** (each gender finds different things), then turns its own Self Switch A on so it only
happens once. In the Test Room, **Yoon's Mirror** runs Choose Yoon again.

**Scenes as common events:** common event **11 "Scene: Yoon's New Body"** is the body-ritual scene, ready
to call from wherever the ritual happens. Common event **12 "Scene: The Bone"** is the moment Yoon, Sib and
Lasa take a bone from the remains and realise it was murder: call it from the remains event on map 6. It's written with the pronoun codes, so it already reads right
for every Yoon, and it's an example to copy for other scenes. Each answer has a `TODO` comment where
reactions can go.
Common event **13 "Scene: Keftiu"** is the first night at camp after Thenmy joins: call it from that camp
event. Parl's lines sit inside *Conditional Branch: Parl is in the party*, with an *Else* version where
Thenmy confesses the spy reports himself, a pattern to copy for any optional party member.
Common event **14 "Scene: Jogging Yoon's Memory"** is the morning after the body ritual (Sib, Pada and Lasa
try to jog Yoon's memory). Lines that differ by Yoon's gender sit in *Conditional Branch: Variable 4*
(1 boy, 2 girl, *Else* third), the pattern to copy when a whole line changes, not just a pronoun.

**Naming newcomers** happens by itself: the first time an event's *Change Party Member* adds someone,
the name screen opens. It never happens in battle, or on maps with `<No Name Entry>` in their note (the
Test Room).

---

## Leaving work for Claude: TODO events

You can mark a spot on a map and ask Claude to fill it in.

1. Make an event where it belongs and give it the graphic you want.
2. **Name** it `TODO`.
3. In its **Note** box (or a Comment command in its contents), say what you want, e.g.
   *"Sooty Bird idol for Mansehare"* or *"Uira at her telegraph key: greets Sib warmly, mentions the log
   book. Once the murder case starts, offers to check the logs."*
4. Mention anything that can't be guessed: which switch or story point it depends on, who should be in
   the party, what it should give.

Claude keeps the event's position and picture and replaces its contents (and may add pages).

**The handover**, because the editor and Claude can't work on the same map at once:
1. Save in RPG Maker, **close it**, and push your changes.
2. Tell Claude which maps have TODOs. Claude pulls, fills them in, tests what it can, and pushes.
3. Pull **before** opening RPG Maker again.

If RPG Maker is open while a map is being changed, its next save overwrites those changes. That's the
one real hazard.

---

## The opening

- **Map 5 "Prologue"** is black on purpose: its one event shows Thenmy's narration, fades out, plays three
  drips and moves the player to map 6. It also makes the party **the Ghost alone**. Add pictures (the sea,
  the fleet, the smoking peak) with *Show Picture* where the comment in the event says.
- **The Prologue plays the Prologue track** (map 5's Autoplay BGM); it fades out with the screen before
  the drips. Its narration is **centred**: each message starts with `\CT`, which centres every line of a
  message (wrapped lines too) and isn't shown. Use it in any Show Text.
- **Playtesting:** in a playtest (only), the Prologue puts a **Test Room Pass** (item 736, Key Items) in the
  bag. Use it from the menu to go to the Test Room with the test party (common event 15).
- **New Game starts on the Prologue.** The player starts invisible (Database → System → *Transparent*),
  so nothing shows on the black screen; the Ghost appears when it wakes. To test other things quickly,
  set the starting position to the Test Room for a while (right-click a tile → **Set Starting Position →
  Player**); the automated tests start in the Test Room on their own, whatever the start is.
- **Map 6 "Lava Tube: Waking"** is playable. The Ghost wakes over Yoon's remains (Story = 10). The Ghost's
  name is **???** for now.
  - **Act 1** (the Ghost; no combat; it starts with **no moves**): every object gives a wordless
    impression; the Ghost can't touch anything. **Yoon's blood** (the stain at 10, 9) gives a cold feeling
    the first time the Ghost steps on it. Then **"First Words"** (scenes.md), built:
    - **Lasa** drops in the first time the Ghost floats into the skylight's light (event "Lasa (First
      Words)": a parallel page watches, an autorun page plays the scene). Her theme plays while you talk to
      her; when the talk ends (she joins, or the Ghost floats away), **First_Words** plays. Until her name
      screen, her lines are labelled **???**. Her offer is **common event 16**:
      float closer, float away, or wail. Floating away, she waits in the garden (talk to her again); the
      fourth time she forces her way in. Joining is **common event 17** (her name screen; Mournful Wail;
      Story = 20).
    - **The lessons:** with Lasa in the party, each object teaches a word (its "lesson" page, then an
      "after" page on **Self Switch B**, where the Ghost's line uses the word). 13 words: bones, sleep, star,
      head, jar, rope, up, fire, sit, food, rock, down, remember. Each try is a choice that raises Sweet,
      Funny or Unhinged. **Common event 18** runs after each new word: Lasa cheers every third, and at 13
      the finale (the nickname, Snuggly, Flighty or Spooky, becomes the Ghost's name; Story = 25).
    - **The face:** the **still water** at (25, 10) starts to twinkle (`!$Twinkle.png`: copy its page's
      graphic and movement route for any other "look here" spot). Boy, girl or in between sets Yoon's
      gender; Story = 30. The ladder then offers the way out, floating up through the sky-hole.
    - Gathering spots and the Red Bowl teach their word first, then work as usual. **The first mushroom**
      (whichever teaches "food") runs Lasa's **gathering tutorial**: she picks it, explains tools, who can
      pick what, and regrowing, and Memory remembers it under **Know-how**. Every word can be learned
      inside the rocks that close off the starting area ("rock" from the two boulders there).
    - **Light:** the two lava pools beside Grave E glow and flicker (events "Lava Glow", `!$LavaGlow.png`,
      drawn additively, like the skylight).
    - **To change the words or lines:** each lesson is on its object's lesson page; Lasa's offer, joining
      and the finale are common events 16–18.
  - **Act 2** (Sib in the party and **Story ≥ 50**: every Act 2 page has those two conditions): the
    remains run *Scene: The Bone* (Story = 60); the skull on the spear gives Crew Remains and a Wooden
    Spear; the jars give embalming supplies; the rope (switch 13) mends the broken ladder; the log rests;
    the old campfire has a clue and crafts; an adult with a pick breaks the basalt boulder; the bats come
    out; mushrooms (Lasa), jasper and chalcedony are gathering spots. To try Act 2 in a playtest, add Sib
    and set variable 5 to 50.
  - **Still to do** (notes in each event): the star-metal sword stays put (no weapon yet); the ladder
    and the two exits lead to maps that don't exist yet; the rare mushroom needs its own item.

---

## Memory (Yoon's journal)

**Memory** opens from the main menu or with **J** on the map: three tabs, **Quests**, **Evidence** (it
appears after the Bone scene) and **Remembered** (Known Words so far). All its text is in
**`data/Journal.json`**, a plain text file you can open in any text editor (RPG Maker ignores it). Ask
Claude to add or change entries there, or edit it yourself: keep the quotes and commas.

Events switch entries on with one **Script** command (tab 3 → Script...):

| Script | What it does |
|---|---|
| `SmokingIsle.Journal.quest('pearl')` | A quest starts (its first step shows); a notice in the corner |
| `SmokingIsle.Journal.step('pearl', 2)` | It reaches step 2; step 1 ticks off |
| `SmokingIsle.Journal.complete('pearl')` | Done |
| `SmokingIsle.Journal.miss('pearl')` / `missGiver('Pada')` | Missed (greyed out): one quest, or every open quest from that giver |
| `SmokingIsle.Journal.clue('ball')` | A clue (adds 1 to the hidden Evidence count, variable 7, once) |
| `SmokingIsle.Journal.learnWord('bones', 0)` | A word (0 said carefully, 1 wrong, 2 wailed): the First Words lessons do this |
| `SmokingIsle.Journal.knowhow('gathering')` | A how-to under Remembered → **Know-how**, kept to re-read (tutorials) |

- The id in the quotes (`'pearl'`) is the entry's name in `Journal.json`.
- **Margin notes:** an entry's `"notes"` (by actor number, `"4"` for Lasa) show once that member has been
  in the party.
- **TODO text** (starting `TODO`) only shows in playtests.
- **The Body** is the first entry in Quests from Story 60: its ingredients light up as the party holds
  their key items (721–727). Its picture is a placeholder, `img/pictures/Memory_Body.png` (drawn by
  `art/memory_body.py`): nine frames side by side, the silhouette and then each ingredient's part.
- Already wired: Lasa's "Mouth-words" quest (she joins → the finale → the face) and then "Who am I?"; the
  Bone scene (common event 12) opens Evidence with the crushed skull and the cut marks; Sib's Act 2 line at
  Yoon's blood adds that clue.

## Field spells and secrets

Some spells are used **from the menu on the map** (`SI_FieldMagic.js`). Lasa learns them through story: give
them with **Change Skills**.

| Spell | Skill | Common event | What it does |
|---|---|---|---|
| **Pura** | 501 | 19 | A light for 200 steps, like a Torch |
| **Tikea** | 502 | 20 | Reveals **secrets** within 8 tiles |
| **Garo** | 454 | 21 | In battle as before; on the map, wandering enemies don't notice the party for 120 steps |

**Secrets:** put `<Secret>` in an event's Note (a hidden cache, a crack in a wall, something buried). It's
invisible, walk-through and can't be examined until Tikea reveals it (for good). A story moment can reveal
one with a Script: `SmokingIsle.FieldMagic.reveal(eventId)`. The steps and range are in the plugin's settings.

**The ghost-only crossing: Region 10.** Paint **Region 10** (the Region tab, R) on tiles only a spirit can
cross, like the warm crack through the old flow front on map 1. While the **Ghost (actor 1) leads** the party
it walks over them, even over walls; nobody else can (Yoon with a body, the living in Act 2, Lasa leading).
Events aren't affected. The number is a setting of `SI_FieldMagic`.

**Moonmilk Paint** (item 278) works the same way as a field spell: from the menu, wandering **spirits** (and the
dead) don't notice the party for 200 steps (common event 22); in battle, every spirit's Talk mood +20, the
dead's +30. It's made at a campfire from Moonmilk and Bonemeal (Mada's recipe); Moonmilk Eye-Wash (Moonmilk,
Fresh Water) cures Blinded. **Cricket Legs** drop from giant cave crickets: roast them (known from the start),
use them for a Bait Pouch, or offer them in Talk to bats, cave rats, ravens, owls, hawks and lizards.

**Lasa's Steal** takes one thing an enemy carries: its **drops**, plus anything listed in the enemy's Note as
`<Steal: item 5, weapon 3>`. Items tagged `<Shiny>` come easier. `<No Steal>` on an enemy (a boss) means
nothing to take. Once per enemy; it sours the enemy's Talk mood.

## Gathering spots

A gathering spot is a tree, plant, rock, pool and so on that the party can harvest once a day. When
the player examines it, they pick who gathers; that person needs the right tool equipped (or carried),
gets tired, and wears the tool down a little.

### Making one

1. In Event mode, double-click the tile where the plant or rock should be.
2. **Name:** anything; `Gather: Laurel` is a good habit, so you can find it later.
3. **Note:** the species, exactly as written in the table below, e.g. `<Gather: Laurel>`.
   This is what decides the resource. Nothing else in the event does.
4. **Graphic:** double-click the Image box and pick the tree, plant or rock picture.
5. **Options:** leave **Walking** on; **Priority:** *Same as characters* (so it blocks the way like a
   real tree); **Trigger:** *Action Button*.
6. **Contents:** one command, **Common Event... → Gather** (common event 5).
That's all. The common event and plugin handle choosing the gatherer, checking tools, darkness,
night-only plants, fatigue, tool wear and the daily reset. **No second page is needed:** once gathered,
the spot **vanishes until the next day** (dawn, or sleeping): hidden, walk-through, and it can't be
examined. Gathering also turns its Self Switch A on (and a new day off) for any event that wants to know.

### Things to know

- **Thenmy is a city boy:** he's only offered for strength jobs (wood, ore, stone, water). A story scene
  can teach him more with a **Script** command: `SmokingIsle.Gather.teach(11, 'fish')` (or `herb`,
  `food`, `dig`, `shore`; several at once like `'herb, food'`).

- **How spots come back** (the "Comes back" column): small things (herbs, food, shore finds) **vanish
  until the next day**; trees, bark and digging spots **stay visible** and take a few days ("Picked clean.
  It'll grow back in a few days."); **stone, ore and rare trees run out**: a few hauls, one a day, then
  worked out for good (loose stone vanishes; ore veins say "This vein is worked out."; Ebony, Mahogany,
  Sandalwood and the Dragon Tree leave "a stump"); springs and wells never run out. Traders restock stone,
  metal and wood.
- **Change one spot** with its Note: `<Regrow: 5>` (days), `<Hauls: 10>`, `<Vanishes>`, `<Stays>`,
  `<Always>`. A worked-out spot turns on its **Self Switch D**: give it a stump or rubble page if you like.
- Place several spots if you want more of something in an area.
- **The Ghost alone** can't gather: any spot gives "...your hand goes through it."
- **Spots only some can gather** ("Only Lasa can gather this.") name only people who have been in the
  party; before that: "Only someone who knows the caves could gather this." (fishers, priests the same).
- **Night:** gathering needs a light (a Torch, Myrtle Candle, Patience's Lamp Pack...), except for
  night-only plants (Moon Sorrel). In `<Dark>` maps it always needs a light.
- **Dawn spots** (Fog Laurel) only give at dawn.
- **Logs** (the rare extra on Laurel, Pine and so on) only come when an adult does the cutting.
- **Children** tire half as much on light work.
- **A new kind of resource** (a species not in the table) can't be added in the editor: it needs a
  line in the plugin's list (`js/plugins/SI_Gather.js`). Ask for it.

### Species list (what to type in the note)

| Type this | Gives | Rare extra | Tool | Who | Comes back | Notes |
|---|---|---|---|---|---|---|
| `<Gather: Laurel>` | Laurel Branch | Laurel Log (15%) | Axe (equipped) | Anyone | in 3 days | log needs an adult |
| `<Gather: Heather>` | Heather Branch | — | Axe (equipped) | Anyone | in 3 days | — |
| `<Gather: Ash>` | Ash Branch | — | Axe (equipped) | Anyone | in 3 days | — |
| `<Gather: Pine>` | Pine Branch | Pine Log (15%) | Axe (equipped) | Anyone | in 3 days | log needs an adult |
| `<Gather: Juniper>` | Juniper Branch | Juniper Berries (40%) | Axe (equipped) | Anyone | in 3 days | — |
| `<Gather: Yew>` | Yew Branch | — | Axe (equipped) | Anyone | in 3 days | — |
| `<Gather: Wax Myrtle>` | Wax Myrtle Branch | Faya Berries (40%) | Axe (equipped) | Anyone | in 3 days | — |
| `<Gather: Ebony>` | Ebony Branch | Ebony Log (10%) | Metal axe (equipped) | Adults only | 3 hauls (one a day), then a stump | — |
| `<Gather: Mahogany>` | Scrap Wood | Mahogany Log (30%) | Metal axe (equipped) | Adults only | 3 hauls (one a day), then a stump | — |
| `<Gather: Driftwood>` | Scrap Wood | Scrap Wood (50%) | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Pine Resin>` | Pine Pitch | — | Knife (equipped) | Anyone | in 3 days | — |
| `<Gather: Dragon Tree>` | Dragon's Blood | Dragonheart Branch (15%) | Knife (equipped) | Anyone | 3 hauls (one a day), then a stump | log needs an adult |
| `<Gather: Honey Palm>` | Palm Fronds | Palm Sap (25%) | Knife (equipped) | Anyone | in 3 days | — |
| `<Gather: Mulberry>` | Mulberry Bark | — | Knife (equipped) | Anyone | in 3 days | — |
| `<Gather: Rubber Tree>` | Latex | — | Knife (equipped) | Anyone | in 3 days | Latex + Sulfur Lump make Rubber (Lightning Clan electroplater) |
| `<Gather: Sandalwood>` | Sandalwood Branch | — | Knife (equipped) | Sacred gatherers (Yoon, Sib, Juda, Falmi) | 3 hauls (one a day), then a stump | 50% chance |
| `<Gather: Rain Tree>` | Rain-Tree Branch | — | By hand | Sacred gatherers (Yoon, Sib, Juda, Falmi) | next day | 10% chance; only fallen wood |
| `<Gather: Bitterwood>` | Bitterwood | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Cliff Mint>` | Cliff Mint | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Hill Thyme>` | Hill Thyme | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Ironwort>` | Ironwort | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Burnwort>` | Burnwort | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Ti Plant>` | Ti Leaves | Ti Root (25%) | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less); extra needs a Digging Stick |
| `<Gather: Yellowroot>` | Yellowroot | — | Digging Stick (carried) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Wart Fern>` | Wart Fern | — | By hand | Lasa | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Moon Sorrel>` | Moon Sorrel | — | By hand | Anyone | next day (vanishes meanwhile) | night only; light work (children tire less) |
| `<Gather: Kava>` | Kava | — | Digging Stick (carried) | Sacred gatherers (Yoon, Sib, Juda, Falmi) | next day (vanishes meanwhile) | — |
| `<Gather: Pennyroyal>` | Pennyroyal Sprig | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Ephedra>` | Ephedra Twigs | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Milo>` | Milo Bark | — | Knife (equipped) | Anyone | in 3 days | — |
| `<Gather: Spurge>` | Spurge Milk | — | Knife (equipped) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Orchil>` | Orchil Lichen | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Reed Bed>` | Marsh Reed | Marsh Reed (50%) | Knife (equipped) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Gourd Vine>` | Gourd | — | Knife (equipped) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Barley>` | Barley | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Lentils>` | Lentils | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Grapevine>` | Grapes | — | By hand | Anyone | in 3 days | light work (children tire less) |
| `<Gather: Syrup Berries>` | Syrup Berries | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Strawberry Tree>` | Strawberry-Tree Fruit | — | By hand | Anyone | in 3 days | light work (children tire less) |
| `<Gather: Bracken>` | Fern-Root Flour | — | Digging Stick (carried) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Bee Rock>` | Wild Honey | — | Torch (carried, used up) | Anyone | in 3 days | — |
| `<Gather: Pine Cones>` | Pine Nuts | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Cosco Patch>` | Cosco Seeds | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Bean Field>` | Broad Beans | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Sweet Potato Patch>` | Sweet Potato | — | Digging Stick (carried) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Taro Patch>` | Taro | — | Digging Stick (carried) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Cave Mushrooms>` | Cave Mushrooms | — | By hand | Lasa | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Skylight Fig>` | Wild Figs | Latex (25%) | By hand | Anyone | in 3 days | wild figs rooted in a skylight; fae-safe food (Lasa and Falmi eat them) |
| `<Gather: Moonmilk>` | Moonmilk | — | By hand | Anyone | in 7 days | soft white paste on tube walls: eye-wash and bone-white paint |
| `<Gather: Bellflower Bush>` | Bellflower Nectar | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Fog Laurel>` | Fog Drip | — | By hand | Anyone | next day | dawn only |
| `<Gather: Dead Laurel>` | Fairy Butter | — | By hand | Anyone | in 3 days | light work (children tire less) |
| `<Gather: Goblin's Gold>` | Goblin's Gold | — | By hand | Lasa | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Cave Pool>` | Cave Pearls | — | By hand | Lasa | in 3 days | — |
| `<Gather: Leaf Mould>` | Leaf Mould | — | By hand | Anyone | in 3 days | light work (children tire less) |
| `<Gather: Beard Lichen>` | Beard Lichen | — | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Obsidian>` | Obsidian Shard | — | Knapping Kit (carried) | Anyone | 5 hauls (one a day), then gone | — |
| `<Gather: Chalcedony>` | Chalcedony | — | Knapping Kit (carried) | Anyone | 5 hauls (one a day), then gone | — |
| `<Gather: Jasper>` | Jasper | — | Knapping Kit (carried) | Anyone | 5 hauls (one a day), then gone | — |
| `<Gather: Basalt>` | Basalt | — | Knapping Kit (carried) | Anyone | 6 hauls (one a day), then worked out | — |
| `<Gather: Andesite>` | Andesite | — | Knapping Kit (carried) | Anyone | 6 hauls (one a day), then worked out | — |
| `<Gather: Olivine>` | Volcano Tear | — | Knapping Kit (carried) | Anyone | 5 hauls (one a day), then gone | 30% chance |
| `<Gather: Trachyte Cliff>` | Fire Opal | — | Knapping Kit (carried) | Anyone | 4 hauls (one a day), then worked out | 5% chance |
| `<Gather: Scoria>` | Red Scoria | — | By hand | Anyone | 5 hauls (one a day), then gone | — |
| `<Gather: Pumice>` | Pumice Stone | — | By hand | Anyone | 5 hauls (one a day), then gone | 50% chance; light work (children tire less) |
| `<Gather: Snowline Quartz>` | Snow Quartz | — | By hand | Anyone | 5 hauls (one a day), then gone | 50% chance; light work (children tire less) |
| `<Gather: Hot Spring>` | Hot-Spring Sinter | Chalcedony (20%) | By hand | Anyone | in 2 days | 40% chance |
| `<Gather: Sulfur Vent>` | Sulfur Lump | — | By hand | Anyone | in 2 days | — |
| `<Gather: Copper Vein>` | Copper Ore | — | Pick (equipped) | Adults only | 6 hauls (one a day), then worked out | — |
| `<Gather: Lead Vein>` | Lead Ore | — | Pick (equipped) | Adults only | 6 hauls (one a day), then worked out | — |
| `<Gather: Lodestone>` | Lodestone | — | Pick (equipped) | Adults only | 3 hauls (one a day), then worked out | 30% chance |
| `<Gather: Coal Seam>` | Brown Coal | — | Pick (equipped) | Adults only | 8 hauls (one a day), then worked out | — |
| `<Gather: Deer Trail>` | Deer Hide | Antler (30%) | Knife (equipped) | Anyone (not Thenmy) | in 3 days | hunting: deer are taken, not fought |
| `<Gather: Clay Pit>` | Clay | White Clay (10%) | Digging Stick (carried) | Anyone | in 3 days | — |
| `<Gather: White Clay>` | White Clay | — | Digging Stick (carried) | Anyone | in 3 days | — |
| `<Gather: Ochre>` | Red Ochre | — | Digging Stick (carried) | Anyone | in 3 days | — |
| `<Gather: Salt Pan>` | Sea Salt | — | By hand | Anyone | in 2 days | light work (children tire less) |
| `<Gather: Peat Bog>` | Peat | — | Digging Stick (carried) | Anyone | in 3 days | — |
| `<Gather: Shore Rocks>` | Shellfish | Shell (25%) | Knife (equipped) | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Tide Pool>` | Shell | Coral (15%) | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Giant Clam>` | Shellfish | Pearl (25%) | Knife (equipped) | Adults only | next day (vanishes meanwhile) | — |
| `<Gather: Seabird Cliff>` | Seabird Feather | Seabird Eggs (25%) | By hand | Anyone | next day (vanishes meanwhile) | light work (children tire less) |
| `<Gather: Fishing Spot>` | Raw Fish | — | Harpoon (equipped) | Fishers (Dama, Parl) | next day | — |
| `<Gather: Eel Pool>` | Raw Eel | — | Harpoon (equipped) | Fishers (Dama, Parl) | next day | — |
| `<Gather: Spring>` | Fresh Water | — | By hand | Anyone | never runs out | — |
| `<Gather: Sacred Well>` | Well Water | — | By hand | Sacred gatherers (Yoon, Sib, Juda, Falmi) | never runs out | — |

Tools: an **equipped** tool must be in the gatherer's hands (a weapon slot). A **carried** tool only
needs to be in the bag. "By hand" needs nothing.

---

## Resting areas: idols

Each is an ordinary event (graphic of your choice, Priority *Same as characters*, Trigger *Action
Button*) whose only command calls a common event. A resting area can have any mix of these.

| Idol | Common event | Note box | What it does |
|------|--------------|----------|--------------|
| **Red Bowl Idol** | 6 Red Bowl Idol | — | The only place to **save** (the menu has no Save) |
| **Sooty Bird Idol** | 7 Sooty Bird Idol | `<Sooty Bird: Zonfahare>` (the place name shown in the travel list) | **Fast travel.** Touching it remembers it; from any one you can fly to any other you've touched. Takes a period of the day; not at night. The party lands on the tile **below** the idol, so keep that tile walkable |
| **Star Mother Idol** | 3 Star Mother Idol | — | **Rest** until dawn (restores Fatigue and Mana, not Health) or **share a meal** (restores Health) |
| **Sundial** | 4 Sundial | — | Tells the time of day |

Give every Sooty Bird idol a **different** name in its note.

## Crafting stations

A campfire, earth oven or crafter NPC is an event with one **Script** command (tab 3 → **Script...**):

| Station | Script |
|---------|--------|
| Campfire | `SmokingIsle.Crafting.open('campfire')` |
| Earth oven | `SmokingIsle.Crafting.open('oven')` |
| Smith, tanner, weaver, tattooist, herbalist, electroplater, priest | `SmokingIsle.Crafting.open('smith')` (use the crafter's word) |

Campfires need lighting with a Fire-Starting Kit; ovens are always lit. Several maps can share one fire
(a house and its village) if their map notes have the same `<Area: name>`.

## Crawlways

A narrow passage only children (and Patience) fit through.

1. Make an event at the opening (a hole or crack graphic, Trigger *Action Button*).
2. **Note:** where it leads: `<Crawlway: 5, 12, 8>` means map 5, x 12, y 8. Add a fourth number to set
   the facing: `<Crawlway: 5, 12, 8, 4>` (2 down, 4 left, 6 right, 8 up). To find a tile's x and y, click
   it in the map editor: the numbers show at the bottom of the window.
3. **Contents:** **Common Event... → Crawlway** (8).
4. Put a crawlway back at the other end too, so the children can return. The adults wait on the starting
   map and rejoin when the party comes back to it.

## A hole you can see down (map 1's sky-hole)

The sky-hole shows the real cave below: map 6's garden, through see-through tiles.
1. **The hole:** paint **Lava-A5's first tile** (top-left of the A5 tab; it's empty and blocks) over the hole.
   The parallax shows through only there.
2. **The rim:** on top of those tiles, paint the rim from **Lava-E** (tab E, rows 6-8, columns 5-7): corners 44,
   46, 60, 62; top edge 45 and bottom edge 61 (repeat them for a wider hole); sides 52 and 54 (repeat for a
   taller one). Leave the middle bare. The top edge is the far wall dropping into shadow. A stepped hole needs the
   inner corners too (47, 55, 63, 71). Easiest: close RPG Maker and run `python3 art/place_hole_rim.py 1`,
   which paints the whole rim from the hole's shape.
3. **The view:** Map Properties → Parallax Background: **SkyHole_Day**, and in the map's Note
   `<Parallax Anchor: x, y, 0.3>` with x, y the hole's middle tile. The image's centre sits under that tile and
   shifts a little as the camera moves, so it seems far below (0 = flat).
4. **Time of day and Act 2:** switch it with **Change Parallax**: SkyHole_Day / _Dusk / _Night, and the
   _Mended versions once the ladder is mended (Act 2).
5. **If map 6's garden changes,** re-run `art/sky_hole_view.py` (it renders map 6 and remakes the six images).

## Map tags (Map Properties → Note)

| Tag | Use it for | Effect |
|-----|-----------|--------|
| `<Indoors>` | Houses, temples | Time stands still; no day/night tint |
| `<Cave>` | Lava tubes, caves | Time stands still; no day/night tint (add `<Dark>` for darkness) |
| `<Dark>` | Caves, abandoned buildings | Always dark: needs a light to see, gather, and fight at full accuracy |
| `<Dark At Night>` | Forests | Dark only at night |
| `<No Time Tint>` | Special outdoor maps | Skips the day/night colouring |
| `<Night Troops: 14, 15>` | Outdoor maps | At night, these troop numbers replace the normal encounters |
| `<Area: Village>` | Maps sharing one campfire | Lit fires and fuel carry between them |

Several tags can go in the same Note box, one per line.

## Enemies on the map

Most fights are **visible enemies**: an event the player bumps into. For ordinary wandering enemies
the **SI_Wanderers** plugin does everything; you only place the event.

1. Make an event with the enemy's map graphic. Trigger and movement don't matter: the plugin takes over.
2. In the event's **Note** box (top of the event window), write the troop it fights:
   `<Wanderer: 12>` (troop 12). That's all. Optional tags in the same box:

   | Tag | Effect |
   |---|---|
   | `<Sight: 5>` | How far it sees, in a cone in front of it (default 5 tiles) |
   | `<Night Only>` / `<Day Only>` | Only out at night / by day |
   | `<Never Flees>` | Never runs from the party (bosses, demons, Black Hounds) |
   | `<Bold>` / `<Timid>` | Runs only from a much stronger party / from a less overwhelming one |
   | Page conditions | While none of its pages' conditions are met, it isn't out at all: give its page a story condition (map 6's bats need Sib and Story ≥ 50) |

What it does in game: it wanders near where you placed it, chases the party when they step into its
sight cone (giving up 8 tiles from home), and fights on contact. **Touching it from behind** gives the party
the first strike; **it touching the party from behind** gives it the first strike. A troop the party would
beat in about a round, losing under 10% Health, **runs away** (faster than the party; it can still be caught).
Beaten, talked down, or got away: **gone until the next day**. The Test Room has two to try (Wild Boars,
and timid Shore Crabs). Speeds, sight, leash and the "weak" line are in the plugin's parameters.

**Bosses and story fights** stay hand-made: an event with **Battle Processing** (tab 2 → Direct designation),
**Can Escape** off, and the story continuing **after** it. For one that should stay gone, add **Control Self
Switch → A = ON** under *If Win*, and a second page with Self Switch A as its condition and no graphic.

Random encounters (caves and dark places only) go in **Map Properties → Encounters**: add the troops
there. At night, a map's `<Night Troops: ...>` note replaces that list.

**Troops** (Database → Troops) are the groups you fight. Some have **battle events** at the bottom of the
Troops tab that change a fight as it goes: the false crane turning into a Marsh Hag (*Enemy Transform*),
vultures arriving on turn 2 (*Enemy Appear*: the vultures are ticked **Appear Halfway** in the troop), the
Shepherd's stags and the Bull's hounds arriving at half Health. Copy a troop to make a variant.

The animal troops (51–74) work the same way: the Spider Crab calls two more crabs at 70% Health, hurting the
Aurochs Calf brings the bull, and the **Wild Bees** troop checks each turn for a lit Torch and scatters the
swarm (put that troop on a Bee Rock event). **Shearwaters** only come at night: list their troop in the
coast map's `<Night Troops>` note.

Bosses whose defeat matters to the story (the Great Boar's flesh, the Daughter freed, Parl's fate) need
the story to continue in the event's commands **after** Battle Processing.

**Act 1 only:** `<Before Story: 50>` in a wanderer's note keeps it out only while Story (variable 5) is below
50, so the gully's fights for the Ghost and Lasa are gone once Yoon has a body (map 1's seven wanderers use it,
with a page that needs Lasa in the party and Story >= 30).

## Switches and variables you can use in event conditions

| Number | Name | Meaning |
|--------|------|---------|
| Switch 7 | Night | ON at night (e.g. the river ghost's page only appears at night) |
| Switch 8 | Can see | ON unless the party is in darkness without a light (things only found by lamplight) |
| Variable 2 | Period | 0 Dawn, 1 Day, 2 Dusk, 3 Night |
| Variable 3 | Day | The day number, starting at 1 |

---

*More sections to come (enemies and Talk, equipment and set tags, recipes, glyphs and spells, meals
and taboos). Ask for whichever you need next.*
