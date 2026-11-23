# Smoking Isle — Bestiary

Every creature the party can fight, **area by area in the order the player reaches them**. Each entry has
two halves:

1. **Design**: what it is in the database (stats, moves, Talk, drops) and how it **fights smart** with the
   tactics plugin (`SI_Tactics.js`; see "How enemies think" below).
2. **Remembered**: a draft of its in-game entry in the **Remembered → Creatures** tab of the Memory menu
   (concept.md, "Memory (the journal)"). Written in **Yoon's voice**, unlocked a line at a time by Insight
   and Talk, with **margin notes** from party members. When `SI_Journal.js` gets its Creatures tab, these
   drafts move into `data/Journal.json` (or the enemies' `<Remember:>` notes).

Companion to [concept.md](concept.md) (systems, balance) and [lore.md](lore.md) (who these creatures are).

---

## How enemies think

`SI_Tactics.js` scores each move against each possible target before acting, then picks among the
best (with some randomness, so enemies stay readable but not robotic). Database ratings stay the base weight.

- **Tiers** (`<Tactics: 0-3>`): **0–1 instinct** (animals: packs, grudges, fleeing, opportunism), **2 tactics**
  (soldiers, spirits, priests: setting up and cashing in states, buffing and healing well), **3 bosses** (full
  combos, reading the party). Early areas stay forgiving.
- **Telegraphing:** smart plans show (a line in the log, or a tell Yoon can read), so the player can always
  answer them.
- **Who can see the Ghost:** only priests and "potential priests" can see ghosts (lore.md, "Seeing the dead").
  **Ordinary animals never single out Ghost Yoon**; party-wide attacks still catch him. Omen creatures (ravens,
  the Owls of Ill Omen) and fae **can** see him (marked **Sees the Ghost** below).
- **Everyone can see Lasa** in battle, adults included, even though the lore says the Children of the Caves
  are seen only by children: whatever she bites can see her.

**Entry legend.** Stats are HP / ATK / DEF / AGI. *Tactics* is the planned behaviour; *Changes* are the database edits it
needed (`NEW` = a new skill or tag); all made, with the plugin. Remembered lines unlock: **First sight** (fought or
talked to once), **Insight 2–4**, **Insight 5+**, and **Talked down** (pacified once).

---

## 1. The lava tube (Act 1, Yoon wakes)

The Ghost and Lasa alone at first: the Ghost can't deal damage, so fights here are short and gentle.

### Bat
**Design**
- **Where:** the waking tube (troop 20, Bats ×6); the gully (troop 79); Act 2 tubes and the silver mine.
- **Stats:** 16 / 6 / 1 / 58. **Moves:** Bat Bite; Screech (the party may be Disoriented, 35%).
- **Talk:** animal; a threat scatters them. Likes Cricket Legs.
- **Drops:** Bonemeal 1/3, Cave Mushrooms 1/4, Cave Pearls 1/12.
- **Tactics (instinct):**
  - **Swarm:** bats pile onto whoever the last bat bit.
  - **Screech** only when at least half the party isn't Disoriented yet.
  - **Nerve:** a lone bat, or one below 50% Health, flees. Light scatters them (as now).
  - Doesn't see the Ghost.

**Remembered**
- *First sight:* "Small. Loud. Many."
- *Insight 2–4:* "They follow each other. Where one bites, all bite."
- *Insight 5+:* "They hate noise and light. Shout, and they go."
- *Margin, Lasa:* "Neighbours! Rude neighbours! Rude, rude, RUDE neighbours. Don't let them nibble Sib. Sib breaks."

---

## 2. The gully: lava-tube country (Act 1)

The climb out through the old lava channels (map 1). The Ghost, Lasa, and soon Sib.

### Giant Cave Cricket
**Design**
- **Where:** the gully (troop 16, ×2); the waking tube; Act 2 tubes (troop 21, ×5).
- **Stats:** 24 / 8 / 5 / 44. **Moves:** Leap Kick; Deafening Chirr (the party may be Disoriented, 25%).
- **Talk:** animal; scares easily. Likes Barley Bread, Sweet Potato.
- **Drops:** Cricket Legs 1/2, Leaf Mould 1/4, Cave-Cricket Cage 1/12.
- **Tactics (instinct):**
  - **Turn 1:** chirps if nobody is Disoriented yet.
  - **Then kicks whoever is Disoriented** (off balance): setup, then payoff.
  - **In the pair,** one chirps while the other kicks: the first taste of enemies working together.

**Remembered**
- *First sight:* "Big bug. Too loud."
- *Insight 2–4:* "It sings first. Then it kicks the one who's dizzy."
- *Insight 5+:* "It scares easy. Give it bread."
- *Margin, Sib:* "Um. Crickets are good luck. In a house. This one isn't in a house. Or lucky."

### Rock Lizard
**Design**
- **Where:** the gully (troop 25 alone; troop 78, ×2); Act 3 highlands and desert edge (troop 70, ×3).
- **Stats:** 55 / 13 / 8 / 46. **Moves:** Bite; Tail Lash; Bask (heals 15%, at or below half Health).
- **Talk:** animal. Likes Raw Meat, Cricket Legs.
- **Drops:** Hide 1/3, Raw Meat 1/3, Red Scoria 1/4.
- **Tactics (instinct):**
  - **Bask needs the sun:** only by day and outdoors. At night it can't heal.
  - **Grudge:** Tail Lash goes at whoever hit it last.
  - **In a pair,** the hurt one basks while the other fights.
- **Changes:** Bask gains a daytime condition (`NEW`: a day/outdoor check, from SI_Time's Night switch).

**Remembered**
- *First sight:* "Rock that runs."
- *Insight 2–4:* "Hurt it, and it lies in the sun to get better."
- *Insight 5+:* "Fast when it's warm. Slow when it's not. Fight it at night."
- *Margin, Lasa:* "It did push-ups at me! So I did push-ups back! We're friends now. Mostly. It bit Sib, so: mostly."

### Raven
**Design**
- **Where:** the gully (troop 75, ×2); Act 2 laurel forest (troop 15, ×4).
- **Stats:** 26 / 8 / 2 / 52. **Moves:** Peck; Ill Omen (Despair, 30%).
- **Talk:** animal. Likes Raw Meat, Cricket Legs.
- **Drops:** Raven Feather 1/8, Scrap Copper 1/6, Barley 1/4.
- **Sees the Ghost** (an omen bird; lore.md, "Seeing the dead").
- **Tactics (instinct):**
  - **Ill Omen** caws only at the Ghost, or at whoever isn't already in Despair. Unsettling, nearly harmless.
  - **Follows the Vulture:** with a Vulture in the fight, ravens peck whoever the Vulture picked.

**Remembered**
- *First sight:* "Black bird. It looks at me. Only it looks at me."
- *Insight 2–4:* "It sees me. Birds that see me are bad news, Sib says."
- *Insight 5+:* "It wants meat, not bread."
- *Margin, Sib:* "Ravens see the dead. That's in every rite. So, um. Please stop waving at them."

### Vulture
**Design**
- **Where:** the gully (troop 76, alone); Act 3 highlands and desert, arriving late (troop 33).
- **Stats:** 55 / 13 / 4 / 50. **Moves:** Rending Beak. Already picks on the weakest (`<Targets Weakest>`).
- **Talk:** animal. Likes Raw Meat.
- **Drops:** Vulture Feather 1/8, Bone 1/2, Raw Meat 1/4.
- **Tactics (instinct):**
  - **Patience:** circles (waits) while the party is healthy; dives once someone is at or below half
    Health, or Bleeding.
  - **Scavenger, not a fighter:** the last enemy standing and hurt, it flies off.
  - Doesn't see the Ghost (nothing to eat).
- **Changes:** a "circle" wait move (`NEW`, or the Wait skill with a line).

**Remembered**
- *First sight:* "Big bird. Waiting."
- *Insight 2–4:* "It waits for someone to fall. Then it comes."
- *Insight 5+:* "It doesn't want me. I've got nothing it wants."
- *Margin, Lasa:* "It won't even look at Yoon! Rude! ...No, wait, that's good. That's good! Keep Sib away from it. Sib's squishy."

### Owl of Ill Omen
**Design**
- **Where:** the gully (troop 77, alone); Act 2 laurel forest (troop 11, ×3; troop 12, the Forest Patrol).
- **Stats:** 55 / 12 / 4 / 50. **Moves:** Saber Beak (Bleed).
- **Talk:** spirit. Yields at once to Tou (Builder towers, a Builder queen).
- **Drops:** Owl Feather 1/2, Bone 1/4.
- **Sees the Ghost** (a spirit creature).
- **Tactics (instinct):**
  - **Blood-drinker:** goes for Bleeding targets first.
  - **Won't touch the Ghost:** it sees him and keeps away.
- **Changes:** gains **Ill Omen** (Despair) as a second move: it's in the name.

**Remembered**
- *First sight:* "Owl. Wrong eyes."
- *Insight 2–4:* "It drinks. It likes the ones who bleed."
- *Insight 5+:* "It won't look at me. It answers to something older, from the towers."
- *Margin, Sib:* "They're set on people who harm the forest. Um. So someone thinks we did. We didn't. ...Did we?"

---

## 3. The Fields: grassland (Act 2)

The terraces between Zonfahare and Afarohare (map 13). Still the Ghost, Sib and Lasa (Yoon gets a body at
the end of Act 2); Pada joins after the Parl quest.

### Feral Sheep
**Design**
- **Where:** the Fields (troop 7, ×4); the alpine herd (troop 18).
- **Stats:** 45 / 9 / 4 / 40. **Moves:** Headbutt; Escape (at or below 30% Health).
- **Talk:** animal. Likes Barley Bread, Ti Root.
- **Drops:** Raw Meat 1/2, Hide 1/3, Mouflon Wool 1/2.
- **Tactics (instinct):**
  - **Flock:** headbutts whoever hurt a flockmate.
  - **When one bolts, the rest are more likely to follow** (a softer, flock version of the Captain's
    `<Morale Leader>`).
  - Doesn't see the Ghost.

**Remembered**
- *First sight:* "Sheep. Wild ones. Rude ones."
- *Insight 2–4:* "Hit one and they all come. Scare one and they all run."
- *Insight 5+:* "It'll eat anything. Then want more. Bread works."
- *Margin, Pada:* "Old Yballa's strays. Don't tell her."

### Wild Boar
**Design**
- **Where:** the Fields (troop 1, ×3); the laurel forest (troop 2, with centipedes).
- **Stats:** 80 / 12 / 6 / 34. **Moves:** Gore.
- **Talk:** animal. Likes Barley Bread, Ti Root.
- **Drops:** Raw Meat 1/1, Hide 1/2, Boar Tusk 1/4.
- **Tactics (instinct):**
  - **Cornered, not scared:** at or below 30% Health it gets Brave (Paw the Ground) and gores harder;
    it never flees.
  - **Grudge:** charges whoever has hurt it most.
- **Changes:** gains **Paw the Ground** (at or below 30% Health).

**Remembered**
- *First sight:* "Pig. Angry pig."
- *Insight 2–4:* "Hurt it and it gets braver, not scared."
- *Insight 5+:* "It wants the bread in my bag."
- *Margin, Pada:* "Lady's beasts. Take what you need. No more."

### Barn Owl
**Design**
- **Where:** the forest and fields at night (troop 62, ×2).
- **Stats:** 42 / 12 / 3 / 50. **Moves:** Silent Swoop; Barn Screech (Disoriented, 35%).
- **Talk:** animal. Likes Raw Meat, Cricket Legs.
- **Drops:** Owl Feather 1/2, Bone 1/3.
- **Tactics (instinct):**
  - **Ambush:** Silent Swoop on turn 1, at the smallest party member.
  - **Then Barn Screech** to cover itself.

**Remembered**
- *First sight:* "Owl. A real one."
- *Insight 2–4:* "You don't hear it until it's on you. It goes for the small ones."
- *Insight 5+:* "Its eyes are only eyes."
- *Margin, Sib:* "Not every owl is an omen. Most owls are just... owls. That one's an owl. Probably."

---

## 4. The lava tubes (Act 2)

Sib can't cross the old flow front (only the Ghost could, and Lasa flies), so in Act 2 the party goes back
down through the tubes.

### Giant Cave Rat
**Design**
- **Where:** the tubes (troop 5, ×6).
- **Stats:** 18 / 6 / 2 / 40. **Moves:** Gnaw.
- **Talk:** animal. Likes Barley Bread, Dried Fish, Grilled Meat, Cricket Legs.
- **Drops:** Hide 1/4, Bone 1/3.
- **Tactics (instinct):**
  - **Pack:** they gang up on the most-hurt party member.
  - **Pack morale:** once half the pack is down, the rest flee.
- **Changes:** `NEW` idea: rats steal a **food** item, the way the cave children steal shiny things.

**Remembered**
- *First sight:* "Rats. Big. A lot."
- *Insight 2–4:* "They all bite the one who's bleeding most."
- *Insight 5+:* "Hungry, and greedy with it. Hold on to the food."
- *Margin, Lasa:* "They ate my beetles! All my beetles! My whole collection! I'm never talking to them. Never ever."

### Cave Spider
**Design**
- **Where:** the tubes, Acts 1–3 (troop 73, ×3).
- **Stats:** 36 / 10 / 4 / 44. **Moves:** Web Shot (Entangled, 50%); Spider Bite (Venom, 25%).
- **Talk:** animal.
- **Drops:** Venom Sac 1/3, Sinew 1/3.
- **Tactics (instinct):**
  - **Ambush:** webs the most dangerous party member first, then bites whoever is Entangled.
  - **No double-webbing:** re-webs only once its victim is free.

**Remembered**
- *First sight:* "Pale. Too many legs."
- *Insight 2–4:* "It ties one up. Then it bites the one it tied."
- *Insight 5+:* "Light bothers it. Its web is behind it."
- *Margin, Sib:* "Um. If it goes for my face I'm going to scream. That isn't a rite. I'm just telling you."

### Cave Girl and Cave Boy (Children of the Caves)
**Design**
- **Where:** the tubes (troop 8, ×4, two of each). Pranksters: never knock anyone out; steal shiny things
  to a hidden hoard (it can be bought back); run off when beaten.
- **Stats:** Girl 33 / 5 / 3 / 42 (MAT 10); Boy 39 / 6 / 4 / 38.
- **Moves:** Girl: Blinding Light, Pilfer, Strike. Boy: Pantsing, Pilfer, Strike.
- **Talk:** sapient; Lasa talks them down at once. Like Dried Figs.
- **Drops:** Girl: Lead Ore 1/5, Goblin's Gold 1/6, Cave Pearls 1/8. Boy: Lead Ore 1/8, Fairy Butter 1/5,
  Scrap Copper 1/6.
- **Sees the Ghost** (fae).
- **Tactics (instinct, teamwork):**
  - **Prank combo:** one Dazzles a victim with Blinding Light; the other Pilfers from them.
  - **They choose their marks:** Pilfer goes for whoever carries the most shiny gear ("Thieves want it");
    Pantsing for whoever is wearing the most.
  - **They tease the Ghost** (Mock, harmless).
- **Changes:** gain **Mock** (aimed at the Ghost).

**Remembered**
- *First sight:* "Kids. Underground kids. Laughing."
- *Insight 2–4:* "One blinds you. The other takes your shiny things."
- *Insight 5+:* "They hum an old tunnel song. Lasa knows it."
- *Margin, Lasa:* "Cousins! Sort-of cousins! Give the figs back, those are MY figs! ...Ours. Mostly mine."

---

## 5. The salt marsh (Act 2)

The marsh on the way to Aguerekeu and Parl's hideout (map 14). Ghost Yoon, Sib and Lasa. **The marsh's own
combo:** Frogs and Eels leave you **Wet**; the Hags' **Marsh Wind** (air) turns Wet into Chilled, and clearing
**Sodden** wins the caster an extra turn. Water everywhere also helps the party: Sib's Lightning Clan
electricity hits Wet targets harder.

### Leech
**Design**
- **Where:** the marsh (troop 35, ×5).
- **Stats:** 20 / 6 / 2 / 20. **Moves:** Latch (drinks blood).
- **Talk:** none yet (add: animal, no likes; it doesn't listen).
- **Drops:** Marsh Reed 1/3, Bonemeal 1/4, Leech Jar 1/12.
- **Tactics (instinct):**
  - **It holds on:** once it latches, it keeps biting the same victim until salt or fire makes it let go.
  - **It drinks:** heals itself by part of what it takes.
  - Doesn't see the Ghost (no blood).
- **Changes:** Latch drains Health (`NEW`: a drain on a physical skill); a "latched" target memory; Talk notes.

**Remembered**
- *First sight:* "Worm. On Sib. On SIB."
- *Insight 2–4:* "It won't let go. Salt makes it let go. Fire too."
- *Insight 5+:* "Mada keeps them in a jar. For medicine. Mada is brave."
- *Margin, Sib:* "Get it off—get it OFF—salt! Mada says salt! Who has salt?"

### Marsh Eel
**Design**
- **Where:** the marsh and the Aguerekeu eel pools (troop 36, ×3).
- **Stats:** 45 / 12 / 4 / 42. **Moves:** Eel Bite (Wet, 40%).
- **Talk:** animal; territorial ("It wants the reeds, not you"). Likes Raw Fish.
- **Drops:** Raw Eel 1/2, Eel Skin 1/3.
- **Tactics (instinct):**
  - **Bite and dive:** after a bite it slips under (harder to hit until its next turn).
  - **Spreads the wet:** bites whoever isn't Wet yet. In a troop with Hags, that's their setup.
- **Changes:** a short "submerged" evasion after biting (`NEW` state, like Bull-Leap's).

**Remembered**
- *First sight:* "Snake. Wet snake. Bites."
- *Insight 2–4:* "It bites, then it hides in the water. It makes you wet."
- *Insight 5+:* "It only wants its reeds. Leave the reeds."
- *Margin, Lasa:* "Slippy! Slippy, slippy. You humans can't even swim properly. It's adorable."

### Crane
**Design**
- **Where:** the marsh (troop 37, ×3).
- **Stats:** 40 / 11 / 3 / 48. Flying. **Moves:** Spear Beak.
- **Talk:** animal. Likes Raw Fish.
- **Drops:** Seabird Feather 1/3, Raw Fish 1/4, Marsh Reed 1/4.
- **Tactics (instinct):**
  - **Fishing:** it spears whoever is Wet first. Wet things look like fish.
  - Doesn't see the Ghost.

**Remembered**
- *First sight:* "Tall bird. Spear face."
- *Insight 2–4:* "It goes for the wet one. It thinks we're fish."
- *Insight 5+:* "Just a crane. Probably. Look at its eyes."
- *Margin, Sib:* "Old Guacimara says any crane might be a Hag. Any crane. Um. That's a lot of cranes."

### Heron
**Design**
- **Where:** the marsh (troop 65, ×2; troop 66, with Marsh Frogs ×2).
- **Stats:** 42 / 12 / 3 / 48. Flying. **Moves:** Spear Beak.
- **Talk:** animal. Likes Raw Fish.
- **Drops:** Seabird Feather 1/3, Raw Fish 1/3, Marsh Reed 1/4.
- **Tactics (instinct):**
  - **Fishing,** like the Crane: Wet targets first.
  - **Stillness:** it waits on one leg until someone is Wet, then strikes.
  - **With the frogs (troop 66):** the frogs soak, the heron spears. The marsh's first partnership.

**Remembered**
- *First sight:* "Another tall bird. Different."
- *Insight 2–4:* "It waits. The frogs make you wet. Then it comes."
- *Insight 5+:* "Just a heron. Really. Its eyes blink the right way."
- *Margin, Lasa:* "It stood on one leg for SO long! I tried! I fell in. Twice. Don't tell Sib."

### Marsh Frog
**Design**
- **Where:** the marsh (troop 63, ×3; troop 66, with a Heron).
- **Stats:** 60 / 11 / 6 / 40. **Moves:** Leaping Slam (Wet, 40%); Croak (Disoriented, 25%); Bite.
- **Talk:** animal. Likes Raw Eel.
- **Drops:** Raw Meat 1/3, Marsh Reed 1/4, Venom Sac 1/6.
- **Tactics (instinct):**
  - **Croak** on turn 1 if nobody is Disoriented.
  - **Leaping Slam** goes at whoever is dry (spreading the wet); **Bite** at whoever is already Wet.
  - **With a heron or Hags,** that wetting is their setup.

**Remembered**
- *First sight:* "Frog. Big as Patience."
- *Insight 2–4:* "It jumps on you and you get wet. Then the birds come."
- *Insight 5+:* "All it wants is to sit in the mud."
- *Margin, Lasa:* "I love him! I love him! Can we keep him? He's so squishy! Squishier than Sib!"

### Water Snake
**Design**
- **Where:** the marsh and streams (troop 64, ×2).
- **Stats:** 38 / 11 / 3 / 52. **Moves:** Venom Bite (Venom, 40%).
- **Talk:** animal; a threat sends it off.
- **Drops:** Venom Sac 1/3, Hide 1/3, Eel Skin 1/5.
- **Tactics (instinct):**
  - **Rather not:** it bites someone who isn't Venomed yet, then tries to slip away. Alone, or below half
    Health, it flees.

**Remembered**
- *First sight:* "Snake. Scared snake."
- *Insight 2–4:* "Make yourself big and it goes."
- *Insight 5+:* "It only bites once. It doesn't want more."
- *Margin, Sib:* "Venom. Mada makes a remedy for that. Remember that Mada makes a remedy. Please remember."

### Marsh Hag (and the false Crane)
**Design**
- **Where:** the Hag Roost, a sting area past Aguerekeu (troop 39, Hags ×2; troop 38, three Cranes, one of
  them a Hag that turns on turn 2). The Lady of the Wind's marsh witches, Builder remnants.
- **Stats:** 160 / 12 / 8 / 40 (MAT 18, MP 60). The false Crane: 40 HP, MAT 10.
- **Moves:** Draining Kiss (magic, drains); Hag's Curse (Despair, 50%); Marsh Wind (air, all, Disoriented 30%).
- **Talk:** spirit; Tou reaches her (Builder). Likes Islander Wine, Palm Wine.
- **Drops:** Hag-Crane Feather 1/4, Wart Fern 1/3, Spurge Milk 1/5.
- **Sees the Ghost,** and **dotes on Yoon**.
- **Tactics (tier 2, the first real schemers):**
  - **Elemental play:** Marsh Wind when the party is Wet (Chilled) or Sodden (an extra turn).
  - **Making her own setup:** without frogs or eels around, she soaks someone first.
  - **Never the Ghost:** she dotes on Yoon. She curses whoever stands closest to him instead.
  - **Draining Kiss** when she's hurt, on the healthiest living target.
  - **The pair:** one curses a victim with Despair, the other drains whoever is in Despair.
  - **The false Crane** fishes like a crane on turn 1, but only ever looks at the Ghost (its tell).
- **Changes:** gains **Rari** (a water spell) to soak a target when no one is Wet.

**Remembered**
- *First sight:* "Lady. Bird lady. She likes me. I don't like that she likes me."
- *Insight 2–4:* "She makes you wet, then cold. She kisses and you get weaker."
- *Insight 5+:* "She never hurts me. She hurts the ones near me."
- *Margin, Sib:* "Old Guacimara's rules: be polite, never say 'thank you', never eat what she offers. Um. I wrote them down."
- *Margin, Lasa:* "She called me a pretty little thing! ME! I'm older than her! ...Probably. Maybe."

### Parl (boss)
**Design**
- **Where:** Parl's Hideout in the deep marsh, after the Chase (troop 30). The Seafarer who stole the tribute
  pearls. The ending decides whether he dies, stays an enemy, or joins in Act 4. (A person, so his entry may
  belong under **People** rather than Creatures.)
- **Stats:** 520 / 18 / 10 / 50. **Moves:** Quick Shot (can't be dodged); Pinning Shot (Entangled, 40%);
  Arrow Volley (random hits); Throw Sand (Dazzled, 70%); Dirty Trick (Disoriented, 50%).
- **Talk:** sapient; can be talked down ("He doesn't want to hurt children. He just wants out.").
- **Doesn't see the Ghost** (a Seafarer, not a priest).
- **Tactics (tier 2, boss):**
  - **He wants out, not a fight:** with only children to fight, he favours moves that stop people rather than
    hurt them (Pinning Shot, Throw Sand, Dirty Trick), and Quick Shot only when cornered (below half Health).
  - **Kiting:** he pins whoever reaches him, then backs off.
  - **Throw Sand** at whoever just hurt him most.
  - **Arrow Volley** only when three or more targets are standing.

**Remembered**
- *First sight:* "Man with a bow. Running."
- *Insight 2–4:* "He doesn't want to hurt Sib. He keeps missing on purpose."
- *Insight 5+:* "The pearls are in his pouch."
- *Margin, Sib:* "He says he rowed for twenty years. That's... a long time to row. Um. We still need the pearl."

---

## Open questions

- **Built:** the tactics plugin and every change marked `NEW` above are in the game (test 68). Some plans
  are approximated by the general scoring rather than built exactly:
  - the false Crane doesn't stare at the Ghost in battle (its tell still says so);
  - the cave children's Mock and the Raven's Ill Omen aren't aimed at the Ghost on purpose (ravens can
    target him; the scoring decides);
  - the Hag doesn't single out whoever stands nearest the Ghost;
  - Parl doesn't kite or answer his worst attacker with sand (he is `<Reluctant>`: he holds back on
    children until he's below half Health);
  - "most dangerous" and "smallest" targets come from the scoring (fast or hard-hitting targets are worth
    more for disabling states; the Barn Owl `<Prefers: child>`).
- **Next areas,** in story order: the coast (Mansehare's shore), then the laurel forest.

**Decided:** the early enemies keep their stats (their data notes now give the right acts); ravens see the
dead; enemies can see Lasa; margin notes are in each character's voice (concept.md, "Voices").
