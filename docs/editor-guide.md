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
2. **Deleting, moving or reusing an entry's slot.** Notes point at things **by ID number**
   (`<Recipe In: item 136>`, `<Start Equips: armor 322>`, `<Talk Likes: 42>`), so a reused slot makes
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

6. **Common events 3–10** (Star Mother Idol, Sundial, Gather, Red Bowl Idol, Sooty Bird Idol, Crawlway,
   Choose Yoon, Yoon's Room: Keepsakes).
   Their wording can change, but don't move or delete them. States 210–212 (Yoon's hidden gender
   effects) are also used by number.
7. **Plugin Manager order.** Changing a plugin's settings is fine; moving plugins up or down isn't.
8. **Troop 13 and the Test Room (map 4)** are used by the automated tests. Copy them instead of editing.

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
- **Map 6 "Lava Tube: Waking"** has a **placeholder** grey floor: repaint it as the lava tube. The `TODO`
  event under the Ghost is Yoon's remains; give it a skeleton graphic.
- **To make the real game start there:** in the editor, right-click a tile on the Prologue map →
  **Set Starting Position → Player**. While you're still testing other things, leave the start in the
  Test Room and use its **Play the Opening** door instead. (That door turns your test party into the
  Ghost alone.)

---

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
7. **Optional second page (the picked-clean look):** click **New Event Page**. Under **Conditions**,
   tick **Self Switch** and leave it on **A**. Give this page a stump, picked or empty graphic, and
   leave its Contents empty (or add a Show Text such as "Nothing left to pick today."). Gathering turns
   Self Switch A on; the next dawn (or sleeping at a Star Mother idol) turns it off, so the first page
   comes back.

That's all. The common event and plugin handle choosing the gatherer, checking tools, darkness,
night-only plants, fatigue, tool wear and the daily reset.

### Things to know

- **One harvest a day per spot.** Place several spots if you want more of something in an area.
- **Night:** gathering needs a light (a Torch, Myrtle Candle, Patience's Lamp Pack...), except for
  night-only plants (Moon Sorrel). In `<Dark>` maps it always needs a light.
- **Dawn spots** (Fog Laurel) only give at dawn.
- **Logs** (the rare extra on Laurel, Pine and so on) only come when an adult does the cutting.
- **Children** tire half as much on light work.
- **A new kind of resource** (a species not in the table) can't be added in the editor: it needs a
  line in the plugin's list (`js/plugins/SI_Gather.js`). Ask for it.

### Species list (what to type in the note)

| Type this | Gives | Rare extra | Tool | Who | Notes |
|---|---|---|---|---|---|
| `<Gather: Laurel>` | Laurel Branch | Laurel Log (15%) | Axe (equipped) | Anyone | log needs an adult |
| `<Gather: Heather>` | Heather Branch | — | Axe (equipped) | Anyone | — |
| `<Gather: Ash>` | Ash Branch | — | Axe (equipped) | Anyone | — |
| `<Gather: Pine>` | Pine Branch | Pine Log (15%) | Axe (equipped) | Anyone | log needs an adult |
| `<Gather: Juniper>` | Juniper Branch | Juniper Berries (40%) | Axe (equipped) | Anyone | — |
| `<Gather: Yew>` | Yew Branch | — | Axe (equipped) | Anyone | — |
| `<Gather: Wax Myrtle>` | Wax Myrtle Branch | Faya Berries (40%) | Axe (equipped) | Anyone | — |
| `<Gather: Ebony>` | Ebony Branch | Ebony Log (10%) | Metal axe (equipped) | Adults only | — |
| `<Gather: Mahogany>` | Scrap Wood | Mahogany Log (30%) | Metal axe (equipped) | Adults only | — |
| `<Gather: Driftwood>` | Scrap Wood | Scrap Wood (50%) | By hand | Anyone | light work (children tire less) |
| `<Gather: Pine Resin>` | Pine Pitch | — | Knife (equipped) | Anyone | — |
| `<Gather: Dragon Tree>` | Dragon's Blood | Dragonheart Branch (15%) | Knife (equipped) | Anyone | log needs an adult |
| `<Gather: Honey Palm>` | Palm Fronds | Palm Sap (25%) | Knife (equipped) | Anyone | — |
| `<Gather: Mulberry>` | Mulberry Bark | — | Knife (equipped) | Anyone | — |
| `<Gather: Sandalwood>` | Sandalwood Branch | — | Knife (equipped) | Sacred gatherers (Yoon, Sib, Juda, Falmi) | 50% chance |
| `<Gather: Rain Tree>` | Rain-Tree Branch | — | By hand | Sacred gatherers (Yoon, Sib, Juda, Falmi) | 10% chance; only fallen wood |
| `<Gather: Bitterwood>` | Bitterwood | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Cliff Mint>` | Cliff Mint | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Hill Thyme>` | Hill Thyme | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Ironwort>` | Ironwort | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Burnwort>` | Burnwort | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Ti Plant>` | Ti Leaves | Ti Root (25%) | By hand | Anyone | light work (children tire less); extra needs a Digging Stick |
| `<Gather: Yellowroot>` | Yellowroot | — | Digging Stick (carried) | Anyone | light work (children tire less) |
| `<Gather: Wart Fern>` | Wart Fern | — | By hand | Lasa | light work (children tire less) |
| `<Gather: Moon Sorrel>` | Moon Sorrel | — | By hand | Anyone | night only; light work (children tire less) |
| `<Gather: Kava>` | Kava | — | Digging Stick (carried) | Sacred gatherers (Yoon, Sib, Juda, Falmi) | — |
| `<Gather: Pennyroyal>` | Pennyroyal Sprig | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Ephedra>` | Ephedra Twigs | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Milo>` | Milo Bark | — | Knife (equipped) | Anyone | — |
| `<Gather: Spurge>` | Spurge Milk | — | Knife (equipped) | Anyone | light work (children tire less) |
| `<Gather: Orchil>` | Orchil Lichen | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Reed Bed>` | Marsh Reed | Marsh Reed (50%) | Knife (equipped) | Anyone | light work (children tire less) |
| `<Gather: Gourd Vine>` | Gourd | — | Knife (equipped) | Anyone | light work (children tire less) |
| `<Gather: Barley>` | Barley | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Lentils>` | Lentils | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Grapevine>` | Grapes | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Syrup Berries>` | Syrup Berries | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Strawberry Tree>` | Strawberry-Tree Fruit | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Bracken>` | Fern-Root Flour | — | Digging Stick (carried) | Anyone | light work (children tire less) |
| `<Gather: Bee Rock>` | Wild Honey | — | Torch (carried, used up) | Anyone | — |
| `<Gather: Pine Cones>` | Pine Nuts | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Cosco Patch>` | Cosco Seeds | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Bean Field>` | Broad Beans | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Sweet Potato Patch>` | Sweet Potato | — | Digging Stick (carried) | Anyone | light work (children tire less) |
| `<Gather: Taro Patch>` | Taro | — | Digging Stick (carried) | Anyone | light work (children tire less) |
| `<Gather: Cave Mushrooms>` | Cave Mushrooms | — | By hand | Lasa | light work (children tire less) |
| `<Gather: Bellflower Bush>` | Bellflower Nectar | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Fog Laurel>` | Fog Drip | — | By hand | Anyone | dawn only |
| `<Gather: Dead Laurel>` | Fairy Butter | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Goblin's Gold>` | Goblin's Gold | — | By hand | Lasa | light work (children tire less) |
| `<Gather: Cave Pool>` | Cave Pearls | — | By hand | Lasa | — |
| `<Gather: Leaf Mould>` | Leaf Mould | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Beard Lichen>` | Beard Lichen | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Obsidian>` | Obsidian Shard | — | Knapping Kit (carried) | Anyone | — |
| `<Gather: Chalcedony>` | Chalcedony | — | Knapping Kit (carried) | Anyone | — |
| `<Gather: Jasper>` | Jasper | — | Knapping Kit (carried) | Anyone | — |
| `<Gather: Basalt>` | Basalt | — | Knapping Kit (carried) | Anyone | — |
| `<Gather: Andesite>` | Andesite | — | Knapping Kit (carried) | Anyone | — |
| `<Gather: Olivine>` | Volcano Tear | — | Knapping Kit (carried) | Anyone | 30% chance |
| `<Gather: Trachyte Cliff>` | Fire Opal | — | Knapping Kit (carried) | Anyone | 5% chance |
| `<Gather: Scoria>` | Red Scoria | — | By hand | Anyone | — |
| `<Gather: Pumice>` | Pumice Stone | — | By hand | Anyone | 50% chance; light work (children tire less) |
| `<Gather: Snowline Quartz>` | Snow Quartz | — | By hand | Anyone | 50% chance; light work (children tire less) |
| `<Gather: Hot Spring>` | Hot-Spring Sinter | Chalcedony (20%) | By hand | Anyone | 40% chance |
| `<Gather: Sulfur Vent>` | Sulfur Lump | — | By hand | Anyone | — |
| `<Gather: Copper Vein>` | Copper Ore | — | Pick (equipped) | Adults only | — |
| `<Gather: Lead Vein>` | Lead Ore | — | Pick (equipped) | Adults only | — |
| `<Gather: Lodestone>` | Lodestone | — | Pick (equipped) | Adults only | 30% chance |
| `<Gather: Coal Seam>` | Brown Coal | — | Pick (equipped) | Adults only | — |
| `<Gather: Clay Pit>` | Clay | White Clay (10%) | Digging Stick (carried) | Anyone | — |
| `<Gather: White Clay>` | White Clay | — | Digging Stick (carried) | Anyone | — |
| `<Gather: Ochre>` | Red Ochre | — | Digging Stick (carried) | Anyone | — |
| `<Gather: Salt Pan>` | Sea Salt | — | By hand | Anyone | light work (children tire less) |
| `<Gather: Peat Bog>` | Peat | — | Digging Stick (carried) | Anyone | — |
| `<Gather: Shore Rocks>` | Shellfish | Shell (25%) | Knife (equipped) | Anyone | light work (children tire less) |
| `<Gather: Tide Pool>` | Shell | Coral (15%) | By hand | Anyone | light work (children tire less) |
| `<Gather: Seabird Cliff>` | Seabird Feather | Seabird Eggs (25%) | By hand | Anyone | light work (children tire less) |
| `<Gather: Fishing Spot>` | Raw Fish | — | Harpoon (equipped) | Fishers (Dama, Parl) | — |
| `<Gather: Eel Pool>` | Raw Eel | — | Harpoon (equipped) | Fishers (Dama, Parl) | — |
| `<Gather: Spring>` | Fresh Water | — | By hand | Anyone | — |
| `<Gather: Sacred Well>` | Well Water | — | By hand | Sacred gatherers (Yoon, Sib, Juda, Falmi) | — |

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

Most fights are **visible enemies**: an event the player bumps into.

1. Make an event with the enemy's map graphic. **Priority:** *Same as characters*; **Trigger:** *Event
   Touch* (it starts the fight when it reaches you) or *Action Button*. For a wandering enemy, set
   **Autonomous Movement** to *Approach* or *Random*.
2. **Contents:** tab 2 → **Battle Processing...** → **Direct designation**, and pick the troop
   (e.g. `Ibex*3`). Tick **Can Escape** for ordinary fights; leave it off
   for bosses.
3. **If Win** / **If Escape**: under *If Win*, add **Control Self Switch → A = ON**, and make a second
   event page with Self Switch A as its condition and no graphic, so the enemy stays gone.

Random encounters (caves and dark places only) go in **Map Properties → Encounters**: add the troops
there. At night, a map's `<Night Troops: ...>` note replaces that list.

**Troops** (Database → Troops) are the groups you fight. Some have **battle events** at the bottom of the
Troops tab that change a fight as it goes: the false crane turning into a Marsh Hag (*Enemy Transform*),
vultures arriving on turn 2 (*Enemy Appear*: the vultures are ticked **Appear Halfway** in the troop), the
Shepherd's stags and the Bull's hounds arriving at half Health. Copy a troop to make a variant.

Bosses whose defeat matters to the story (the Great Boar's flesh, the Daughter freed, Parl's fate) need
the story to continue in the event's commands **after** Battle Processing.

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
