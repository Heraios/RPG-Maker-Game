# Act 1 maps: open questions

A handover list: what's built, and what's still to decide or build for Act 1 (the Ghost, from waking to
contact with Sib). Answer or strike items as they're settled. Background: concept.md (Act 1), scenes.md
("First Words", "The Gully Walk"), lore.md (the sky-hole, the Rite for the Lost, why Juda chose Yoon),
acts-1-2-maps.md (the map plan), editor-guide.md (how the systems are placed).

## Where things stand

| Map | Name | State |
|---|---|---|
| 5 | Prologue | Done. New Game starts here (5, 8, 6). Centred narration, Prologue music |
| 6 | Lava Tube: Waking | Playable: First Words (Lasa, 13 words, the face), skylight, lava glow, Lava Tubes tileset. The ladder leads up the sky-hole to map 1 (12, 204), in Act 1 (float) and Act 2 (the mended ladder) |
| 1 | Lava Flows: Nearby Gully | Painting in progress (63 x 217, Lava Country tileset): the levees are in. **Layout decided** (acts-1-2-maps.md, map 1). **No events yet**, no music, no map note |

Built and ready to place: the Lava Country / Lava Tubes tilesets and the Lava-E sheet (telegraph poles and
wires, cairns, cracks, rubble, tumulus), gathering rules, Memory (quests, words), Lasa's skills.

## 1. Map numbering and the plan

1. ~~The plan numbered the Sky-Hole as map 7.~~ **Done:** the plan describes map 1, "Lava Flows: Nearby Gully".
2. **The edge of Zonfahare:** its own map, or the south edge of the Zonfahare map? Which map number?
3. ~~How many maps between the gully and the edge of town?~~ **Decided:** map 1 is the whole stretch, from the
   gully at the bottom to the exit at the top right.

## 2. Map 6 → map 1 (the way up)

4. ~~Where exactly is the sky-hole on map 1?~~ **Wired:** map 6's ladder transfers to **map 1 (12, 204), facing
   north**, on the rim just north of the hole, which goes at x 11-14, rows 205-207 (as in the mock-up). Both the
   Act 1 float (Story >= 30) and the Act 2 climb (mended ladder) land there. **Still to build on map 1:** paint
   the hole there, and an event on it to go back down to map 6 (Act 2, ladder mended).
5. **The sky-hole's rim** needs to read as a hole on dark basalt: a ring of kipuka grass, or a lighter lip?
6. **Do map 6's two side exits** (east and south passages) stay closed in Act 1? They currently say "This way
   isn't built yet." (In Act 2 the party goes back through the tubes, so one of them leads under the flow front.)

## 3. Map 1: the gully walk

Layout **decided** (acts-1-2-maps.md, map 1): the gully at the bottom; the **old flow front** (rows ~156-187)
crossed in Act 1 only by a **warm crack, the ghost-only crossing**; **in Act 2 the living go back through the
lava tubes** under it; then eight channels, climbed in a zigzag (the levees' west ends are open, breaches on the
east side); the land greens at the top; the exit at the top right.

7. ~~Ridge direction~~ **Done:** repainted, west-northwest to east-southeast, shallow.
8. **Exact places still to choose:** the east-side breaches, the crack, and the exit tile. The mock-up
   (docs/mockups/gully_mockup.png) proposes them all.
9. ~~The ghost-only crossing's region~~ **Done:** **Region 10**, in `SI_FieldMagic` (only the Ghost, leading,
   crosses it, even over walls). Mock-up placement: x 23, rows 161-173 (docs/mockups).
10. **Blocked branches** into the deep country (south-west of the flow front): rubble fields or lava walls, and
    where Lasa says "Not that way."
11. **Music:** what plays on map 1? (There's no lava-flows track: Lava_Tubes made thinner, the Grasslands near
    the top, wind and quiet?) And where does the lament (Grief) start drifting in?
12. **Time of day:** arrive at dusk, so the rite is lamp-lit? (A story event can set the period.)
13. **Map note:** `<Area: ...>`? Night troops? **Fights now begin in the gully** (concept.md, "The Ghost and
    Lasa in a fight"): which enemies (ravens, rock and giant lizards, cave crickets) and where. (Decided: animals
    can hurt the Ghost if they hit it.)
14. **Gathering spots:** which go on map 1? Act 1 finds Lasa can pick by hand (scoria, pumice, ephedra, orchil,
    cosco, Goblin's Gold, wart fern), and Act 2 ones seen now and come back for (obsidian, olivine, jasper,
    ochre, spurge, a skylight fig, moonmilk in a collapse)?
15. **Length:** about 14 screens of climbing. Is that right for Act 1, or trim a channel or two?

## 4. The Gully Walk's events (scenes.md)

16. **Build it:** sky and sun (scripted, coming out of the hole), the optional finds (goat, grass, water, tree,
    bird, float, wind, sing, road, smoke), home (scripted, first view of the town). Which objects exist on the
    map to carry them (a stream, a dead tree, ravens, the crack, a gusty spot, the wires, the road, the town's
    smoke)?
17. **Ladder the goat:** grazing at the rim, then following the Ghost all the way to the rite. How should he
    follow: a follower-style event, or one that appears at points along the way?
18. **The telegraph:** a soft **hum** near the poles (an ambient sound)? A Memory entry "The singing wires",
    rewritten once explained in town? And the bigger idea, **undecided: can the Ghost hear the wires** (voices,
    e.g. news of tonight's rite; later, Parl tapping the line)?
19. **Ravens** that caw at the Ghost (only animals notice it): an event, or a wanderer-style animal that never
    fights in Act 1?

## 5. The edge of Zonfahare and the Rite for the Lost

20. **Draft the rite as a scene script** (like First Words): who's there (Juda presiding, Mada, Pada?, the
    twins, Tinerfe, Tibiabin, villagers), what the Ghost overhears, the fond weird memories of Yoon (by gender),
    the rumours, the words learned ("Yoon" marked ?, Mada, Pada, dead, lost, Sib), and **Juda seeing the Ghost**
    (switch 10, Lasa pulls it away, Sneaking).
21. **Is Pada at the rite**, or out searching the tubes as every night?
22. **Where's the empty tomb niche:** at the edge of town where the fields meet the lava country? What does it
    look like?
23. **Ladder at the rite:** Mada notices the goat standing by the niche, staring at nothing?

## 6. After the rite (the rest of Act 1)

24. **The order:** town (unseen) → home (the twins see Yoon) → contact with Sib. Is that right?
25. **Where does contact with Sib happen?** (Juda's shrine at dusk, the telegraph station, or the sky-hole, their
    secret place, where Sib goes because they couldn't bear the rite?)
26. **What blocks the Ghost from wandering the whole island** in Act 1 once it's in town?

## 7. Lore still open (affects these maps)

27. **Juda sent Sib on an errand the morning Yoon vanished?** (A clue under "Juda's whereabouts".)
28. **Where do the rubber trees grow?** (The wet-side forest with the Lady's leave, planted groves, or are they the
    skylight figs, now that figs give latex?)
29. **Hidden secrets for Tikea:** any `<Secret>` events planned in Act 1 maps, for Act 2 revisits?
