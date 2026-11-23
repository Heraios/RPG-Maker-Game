# Smoking Isle — Bestiary

Every creature the party can fight, **area by area in the order the player reaches them**. Each entry has
two halves:

1. **Design**: what it is in the database (stats, moves, Talk, drops) and how it should **fight smart** once
   the tactics plugin exists (`SI_Tactics.js`, planned; see "How enemies think" below).
2. **Remembered**: a draft of its in-game entry in the **Remembered → Creatures** tab of the Memory menu
   (concept.md, "Memory (the journal)"). Written in **Yoon's voice**, unlocked a line at a time by Insight
   and Talk, with **margin notes** from party members. When `SI_Journal.js` gets its Creatures tab, these
   drafts move into `data/Journal.json` (or the enemies' `<Remember:>` notes).

Companion to [concept.md](concept.md) (systems, balance) and [lore.md](lore.md) (who these creatures are).

---

## How enemies think

The planned `SI_Tactics.js` scores each move against each possible target before acting, then picks among the
best (with some randomness, so enemies stay readable but not robotic). Database ratings stay the base weight.

- **Tiers** (`<Tactics: 0-3>`): **0–1 instinct** (animals: packs, grudges, fleeing, opportunism), **2 tactics**
  (soldiers, spirits, priests: setting up and cashing in states, buffing and healing well), **3 bosses** (full
  combos, reading the party). Early areas stay forgiving.
- **Telegraphing:** smart plans show (a line in the log, or a tell Yoon can read), so the player can always
  answer them.
- **Who can see the Ghost:** only priests and "potential priests" can see ghosts (lore.md, "Seeing the dead").
  **Ordinary animals never single out Ghost Yoon**; party-wide attacks still catch him. Omen creatures and fae
  **can** see him (marked **Sees the Ghost** below).

**Entry legend.** Stats are HP / ATK / DEF / AGI. *Tactics* is the planned behaviour; *Changes* are edits to the
database this would need (`NEW` = a new skill or tag). Remembered lines unlock: **First sight** (fought or
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
- *Margin, Lasa:* "they're my neighbours!! they're RUDE neighbours"

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
- *Margin, Sib:* "Crickets are lucky. Not this one."

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
- *Margin, Lasa:* "it did push-ups at me. i did push-ups back. we're even"

### Raven
**Design**
- **Where:** the gully (troop 75, ×2); Act 2 laurel forest (troop 15, ×4).
- **Stats:** 26 / 8 / 2 / 52. **Moves:** Peck; Ill Omen (Despair, 30%).
- **Talk:** animal. Likes Raw Meat, Cricket Legs.
- **Drops:** Raven Feather 1/8, Scrap Copper 1/6, Barley 1/4.
- **Sees the Ghost** (an omen bird; a suggestion, not yet lore).
- **Tactics (instinct):**
  - **Ill Omen** caws only at the Ghost, or at whoever isn't already in Despair. Unsettling, nearly harmless.
  - **Follows the Vulture:** with a Vulture in the fight, ravens peck whoever the Vulture picked.

**Remembered**
- *First sight:* "Black bird. It looks at me. Only it looks at me."
- *Insight 2–4:* "It sees me. Birds that see me are bad news, Sib says."
- *Insight 5+:* "It wants meat, not bread."
- *Margin, Sib:* "Ravens see the dead. Everyone knows that. Please stop waving at them."

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
- *Margin, Lasa:* "rude!!!! yoon is DELICIOUS probably"

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
- *Margin, Sib:* "Set loose on people who hurt the forest. So what did we do?"

---

## 3. The Fields: grassland (Act 2)

The terraces between Zonfahare and Afarohare (map 13). Yoon has a body now; Pada is with the party.

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
- *Margin, Pada:* "Old Yballa's strays. Don't tell her we fought them."

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
- *Margin, Pada:* "The Lady's children, in a way. Take only what you need."

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
- *Margin, Sib:* "Not every owl is an omen. Most of them are just owls."

---

## 4. The lava tubes (Act 2)

The living party can't cross the old flow front, so they go back down through the tubes.

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
- *Margin, Lasa:* "they ate my beetle collection once. we are NOT friends"

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
- *Margin, Sib:* "Don't let it near your face. Please."

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
- *Margin, Lasa:* "my cousins!!! sort of!!! give the figs BACK"

---

## Open questions

- **Areas in the data notes:** some enemies' notes name a later act than where they're placed. The Rock
  Lizard (note: Act 3), Raven (Act 2) and Vulture (Act 3) all appear in the Act 1 gully, and the Bat
  (Act 2) in the Act 1 waking tube. Fine if intended, but they were balanced for later parties; the Act 1
  party is the Ghost, Lasa and Sib.
- **Ravens seeing the Ghost** is a suggestion, not lore yet.
- **Margin notes** are drafts in each character's voice.
- **Next areas,** in story order: the salt marsh, the coast, and the laurel forest.
