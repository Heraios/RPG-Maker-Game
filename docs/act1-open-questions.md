# Act 1 maps: open questions

A handover list: what's built, and what's still to decide or build for Act 1 (the Ghost, from waking to
contact with Sib). Answer or strike items as they're settled. Background: concept.md (Act 1), scenes.md
("First Words", "The Gully Walk"), lore.md (the sky-hole, the Rite for the Lost, why Juda chose Yoon),
acts-1-2-maps.md (the map plan), editor-guide.md (how the systems are placed).

## Where things stand

| Map | Name | State |
|---|---|---|
| 5 | Prologue | Done. New Game starts here (5, 8, 6). Centred narration, Prologue music |
| 6 | Lava Tube: Waking | Playable: First Words (Lasa, 13 words, the face), skylight, lava glow, Lava Tubes tileset. **Its way out isn't wired**: the ladder's Act 1 page says "(The way up isn't built yet.)" |
| 1 | Lava Flows: Nearby Gully | Painting in progress (62 x 80, Lava Country tileset). **No events yet**, no music, no map note |

Built and ready to place: the Lava Country / Lava Tubes tilesets and the Lava-E sheet (telegraph poles and
wires, cairns, cracks, rubble, tumulus), gathering rules, Memory (quests, words), Lasa's skills.

## 1. Map numbering and the plan

1. **The plan still numbers the Sky-Hole as map 7.** It's map 1 now ("Lava Flows: Nearby Gully"). Renumber the
   plan (acts-1-2-maps.md) to the maps as they really are?
2. **The edge of Zonfahare:** its own map, or the south edge of the Zonfahare map? Which map number?
3. **How many maps** between the gully and the edge of town: is map 1 the whole lava-flow stretch, or is there a
   second one?

## 2. Map 6 → map 1 (the way up)

4. **Where on map 1 do the Ghost and Lasa come up?** The sky-hole is around (18-26, 46-53); which tile do they
   land on, facing which way? Then the ladder's Act 1 page can transfer there (Story >= 30).
5. **The sky-hole's rim** needs to read as a hole on dark basalt: a ring of kipuka grass, or a lighter lip?
6. **Do map 6's two side exits** (east and south passages) stay closed in Act 1? They currently say "This way
   isn't built yet."

## 3. Map 1: the gully walk

7. **Ridge direction:** the overview map says the levees should run west-northwest to east-southeast, fairly
   shallow (about 25-30 degrees). Keep the current steeper diagonals, or flatten them?
8. **The route north-east to town:** where are the **breaches** (gaps in the levees) the player climbs through?
   Where's the **exit** (top right)?
9. **The ghost-only crossing:** which **region number** marks tiles only the Ghost can cross? Where's the crack?
   (In Act 2 the living go round.) Needs a small plugin rule once the region is chosen.
10. **Blocked branches** into the deep country (south-west): rubble fields or lava walls, and where Lasa says
    "Not that way."
11. **Music:** what plays on map 1? (There's no lava-flows track: Lava_Tubes made thinner, the Grasslands near
    the top, wind and quiet?) And where does the lament (Grief) start drifting in?
12. **Time of day:** arrive at dusk, so the rite is lamp-lit? (A story event can set the period.)
13. **Map note:** `<Area: ...>`? Night troops? (Act 1 has no combat, so wanderers stay off until Act 2.)
14. **Gathering spots:** which go on map 1? Act 1 finds Lasa can pick by hand (scoria, pumice, ephedra, orchil,
    cosco, Goblin's Gold, wart fern), and Act 2 ones seen now and come back for (obsidian, olivine, jasper,
    ochre, spurge, a skylight fig, moonmilk in a collapse)?

## 4. The Gully Walk's events (scenes.md)

15. **Build it:** sky and sun (scripted, coming out of the hole), the optional finds (goat, grass, water, tree,
    bird, float, wind, sing, road, smoke), home (scripted, first view of the town). Which objects exist on the
    map to carry them (a stream, a dead tree, ravens, the crack, a gusty spot, the wires, the road, the town's
    smoke)?
16. **Ladder the goat:** grazing at the rim, then following the Ghost all the way to the rite. How should he
    follow: a follower-style event, or one that appears at points along the way?
17. **The telegraph:** a soft **hum** near the poles (an ambient sound)? A Memory entry "The singing wires",
    rewritten once explained in town? And the bigger idea, **undecided: can the Ghost hear the wires** (voices,
    e.g. news of tonight's rite; later, Parl tapping the line)?
18. **Ravens** that caw at the Ghost (only animals notice it): an event, or a wanderer-style animal that never
    fights in Act 1?

## 5. The edge of Zonfahare and the Rite for the Lost

19. **Draft the rite as a scene script** (like First Words): who's there (Juda presiding, Mada, Pada?, the
    twins, Tinerfe, Tibiabin, villagers), what the Ghost overhears, the fond weird memories of Yoon (by gender),
    the rumours, the words learned ("Yoon" marked ?, Mada, Pada, dead, lost, Sib), and **Juda seeing the Ghost**
    (switch 10, Lasa pulls it away, Sneaking).
20. **Is Pada at the rite**, or out searching the tubes as every night?
21. **Where's the empty tomb niche:** at the edge of town where the fields meet the lava country? What does it
    look like?
22. **Ladder at the rite:** Mada notices the goat standing by the niche, staring at nothing?

## 6. After the rite (the rest of Act 1)

23. **The order:** town (unseen) → home (the twins see Yoon) → contact with Sib. Is that right?
24. **Where does contact with Sib happen?** (Juda's shrine at dusk, the telegraph station, or the sky-hole, their
    secret place, where Sib goes because they couldn't bear the rite?)
25. **What blocks the Ghost from wandering the whole island** in Act 1 once it's in town?

## 7. Lore still open (affects these maps)

26. **Juda sent Sib on an errand the morning Yoon vanished?** (A clue under "Juda's whereabouts".)
27. **Where do the rubber trees grow?** (The wet-side forest with the Lady's leave, planted groves, or are they the
    skylight figs, now that figs give latex?)
28. **Hidden secrets for Tikea:** any `<Secret>` events planned in Act 1 maps, for Act 2 revisits?
