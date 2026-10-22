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
