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
- **Where:** the gully (troop 25, alone); Act 3 highlands and desert edge (troop 70, ×3). Its big cousin, the
  Old Rock Lizard, is the gully's mini-boss (below).
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

### Old Rock Lizard (mini-boss)
**Design**
- **Where:** the gully, near the top of the climb (troop 78, alone). The Act 1 mini-boss.
- **Stats:** 120 / 15 / 9 / 44. **Moves:** Bite; Tail Lash; Tail Sweep (the whole party); Bask (heals 15%, by day
  only).
- **Talk:** animal; harder to calm than its cousins (a threat rarely sends it off). Likes Raw Meat, Cricket Legs.
- **Drops:** Hide 1/1, Raw Meat 1/1, Red Scoria 1/2.
- **Tactics (tier 2):** `<Grudge>`; basks when hurt, but only in the sun. **Fight it at night** and it can't heal.
- **Balance** (starting party, tactics on): won every time, about 45% of the party's Health, 16 turns.

**Remembered**
- *First sight:* "Big rock. Old rock. Angry rock."
- *Insight 2–4:* "It lies in the sun when it's hurt. Then it isn't hurt."
- *Insight 5+:* "At night the sun can't help it."
- *Margin, Lasa:* "It's the GRANDPA one! Grandpa, no! Grandpa, sit!"

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
- **Stats:** 55 / 13 / 4 / 50. **Moves:** Rending Beak; Circle (waits); Ill Omen (Despair). Picks on the weakest
  (`<Targets Weakest>`).
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
- **Where:** the Fields (troop 1, ×2: three were too many for the starting party); the laurel forest (troop 2,
  with centipedes).
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
- **Stats:** 45 / 12 / 4 / 42. **Moves:** Eel Bite (Wet, 40%); Drag Below (pulls a victim under; hit the eel
  to free them).
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
- **Stats:** 40 / 11 / 3 / 48. Flying. **Moves:** Spear Beak; Trip (a wing buffet: Disoriented).
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
- **Stats:** 42 / 12 / 3 / 48. Flying. **Moves:** Spear Beak; Trip (a wing buffet: Disoriented).
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
- **Stats:** 38 / 11 / 3 / 52. **Moves:** Venom Bite (Venom, 40%); Coil (Entangled). Bites whoever it
  holds (`<Follow Up: Entangled +30>`).
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
- **Where:** the Hag Roost, a **mistake area** past Aguerekeu: meant to be too much for the starting party (and
  the marsh's Cranes nearby are hard for the same reason) (troop 39, Hags ×2; troop 38, three Cranes, one of
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
- **Talk:** sapient. **He has to be talked down:** the starting party can't win this fight by fighting (by design;
  the sims agree). Talking wins every time ("He doesn't want to hurt children. He just wants out.").
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

## 6. The coast: Mansehare's shore (Acts 1–2)

The black-sand shore, the tide pools and the rocks below Mansehare (map 17), and the haunted coast at night.
Mostly Act 2 (the Ghost, Sib and Lasa; Pada once the Parl quest is done). **The coast's own combo:** the Monk
Seal's **Splash** soaks the party **Wet**, and Wet makes every physical hit land 15% harder (the tactics see it
in their damage sums). Fishing birds hunt the Wet. Water everywhere helps the party too: Sib's lightning hits Wet
things harder.

### Monk Seal
**Design**
- **Where:** the shore rocks (troop 6, ×2 with Red Rock Crabs ×2).
- **Stats:** 100 / 10 / 6 / 24. **Moves:** Body Slam; Bellow (the party may Panic, 25%); Splash (soaks everyone:
  Wet, 70%).
- **Talk:** animal; starts **Wary** (territorial in season). Likes Dried Fish, Shellfish.
- **Drops:** Raw Meat 1/1, Hide 1/2, Seal Skin 1/2.
- **Tactics (instinct):**
  - **Territory:** Bellow on turn 1 if nobody is Panicked yet.
  - **Splash** when the party is dry: it sets up its own Body Slams and the crabs' pinches.
  - **Body Slam** whoever is Wet.
- **Changes:** `<Follow Up: Wet +20>`.

**Remembered**
- *First sight:* "Big. Fat. Loud. Wet."
- *Insight 2–4:* "It shouts first. Then it splashes. Then it lands on you."
- *Insight 5+:* "It's only guarding the rocks. Back off and it stops."
- *Margin, Lasa:* "A dog that gave up on legs! I love it. It hates me. I still love it."
- *Margin, Dama (later):* "Seals. They steal from the nets and look sorry about it. They're not."

### Red Rock Crab
**Design**
- **Where:** the lava shore (troop 4, ×5; troop 6, with the Monk Seals).
- **Stats:** 24 / 9 / 14 / 28. **Moves:** Pinch; Withdraw (Endurance up, at or below half Health).
- **Talk:** animal. Likes Dried Fish, Shellfish.
- **Drops:** Shell 1/2, Raw Meat 1/3, Coral 1/6.
- **Tactics (instinct):**
  - **Shell:** it pulls in when hurt (Withdraw), so a hurt crab is a waste of a slashing attack.
  - **Pack:** crabs pinch whoever another crab just pinched.
- **Changes:** `<Pack>`.

**Remembered**
- *First sight:* "Red rock with pinchers."
- *Insight 2–4:* "Hurt it and it hides in its shell. Hit it hard, not fast."
- *Insight 5+:* "A loud noise sends it running."
- *Margin, Sib:* "Crush, not cut. Tinguaro says crabs taught the first smiths about armour. Um. I think that's a joke."

### Shore Crab
**Design**
- **Where:** the black-sand shore and tide pools (troop 53, ×3; troop 54, with the Spider Crab).
- **Stats:** 34 / 10 / 12 / 30. **Moves:** Pinch; Withdraw (at or below half Health).
- **Talk:** animal.
- **Drops:** Shellfish 1/2, Shell 1/3.
- **Tactics (instinct):** as the Red Rock Crab (`<Pack>`, withdraws when hurt). With a Spider Crab, it follows the
  big one.
- **Changes:** `<Pack>`.

**Remembered**
- *First sight:* "Crab. Another crab. More crabs."
- *Insight 2–4:* "Hard on top. Soft under. Crush it."
- *Insight 5+:* "They follow the big one."
- *Margin, Parl (later):* "Not touching it. Not even to fight it. My god takes shells very seriously."

### Spider Crab
**Design**
- **Where:** the shore (troop 54: with Shore Crabs ×2, and two more it calls in at 70% Health).
- **Stats:** 90 / 13 / 16 / 26. **Moves:** Long Claw (Entangled, 40%); Pinch; Scuttle Call (more crabs come).
- **Talk:** animal. Likes Raw Fish, Shellfish.
- **Drops:** Shellfish 1/1, Shell 1/2 (×2).
- **Tactics (instinct):**
  - **Hold and pinch:** Long Claw first, then Pinch whoever it holds.
  - **The leader:** beat it and the little crabs lose heart (its tell already says so).
- **Changes:** `<Follow Up: Entangled +30>`; `<Morale Leader: 25>` (the Captain's tag: its crabs gain mood when it
  falls).
- **Balance** (animal sim, Act 1 party, tactics on): always won, but about 78% of the party's Health. The coast's
  hardest fight early on.

**Remembered**
- *First sight:* "Crab with too-long legs. Too big."
- *Insight 2–4:* "It holds you with one claw and pinches with the other."
- *Insight 5+:* "The little crabs follow it. Beat it and they scatter."
- *Margin, Lasa:* "It looks like a spider and a crab had an argument. Both of them lost."

### Gannet
**Design**
- **Where:** the sea cliffs and shore (troop 52, ×2).
- **Stats:** 45 / 11 / 3 / 54. Flying. **Moves:** Plunge Dive; Peck.
- **Talk:** animal. Likes Raw Fish.
- **Drops:** Seabird Feather 1/2, Raw Fish 1/3.
- **Tactics (instinct):**
  - **Fishing:** it dives at whoever is Wet first (wet things look like fish), like the marsh's Cranes.
  - **Plunge Dive** for big hits; Peck when the target is already low.
- **Changes:** `<Prefers: Wet, Sodden>`.
- **Balance** (Act 1 party): won three fights in four. Hard for the Ghost, Sib and Lasa.

**Remembered**
- *First sight:* "White bird. Falls out of the sky. On purpose."
- *Insight 2–4:* "It goes for the wet one. It thinks we're fish."
- *Insight 5+:* "It's fishing. We're in the way."
- *Margin, Dama (later):* "Gannets show you where the fish are. Follow the gannets, not the men."

### Shearwater
**Design**
- **Where:** the haunted coast at night only (troop 51, ×4; a `<Night Troops>` encounter).
- **Stats:** 22 / 7 / 2 / 50. Flying. **Moves:** Peck; Crying Chorus (the party may Panic, 25%).
- **Talk:** animal. Likes Raw Fish.
- **Drops:** Seabird Feather 1/3, Seabird Eggs 1/4, Shearwater Oil 1/10.
- **Tactics (instinct):**
  - **The chorus first:** Crying Chorus while nobody is Panicked; then they peck the Panicked.
  - **Pack:** the flock follows the first bird's target.
- **Changes:** `<Pack>`; `<Follow Up: Panicked +20>`.
- **Balance** (Act 1 party): always won, about 68% of the party's Health. Night on the coast is meant to be eerie.

**Remembered**
- *First sight:* "Babies. Crying. In the dark. Birds?"
- *Insight 2–4:* "They cry until you're scared. Then they come."
- *Insight 5+:* "They're only birds. They only SOUND like babies."
- *Margin, Sib:* "The old stories say the Master of Deception wept like a child to lure people into the sea.
  Um. I'd rather not think about that right now."

### Jellyfish
**Design**
- **Where:** drifting in shallow water off the shore (troop 55, ×3).
- **Stats:** 30 / 8 / 1 / 20. **Moves:** Sting (Venom, 40%). Stings anyone who hits it with a weapon (`<Stings:
  Venom 30>`).
- **Talk:** none: it doesn't think.
- **Drops:** Venom Sac 1/4, Sea Salt 1/3.
- **Tactics (tier 0):** none. It drifts. The danger is touching it: magic, slings and nets are the answer.

**Remembered**
- *First sight:* "Water that bites."
- *Insight 2–4:* "Don't hit it with your hands. Or a knife. Or anything you're holding."
- *Insight 5+:* "It isn't angry. It isn't anything."
- *Margin, Lasa:* "I poked one. Don't poke one."

### Moray Eel
**Design**
- **Where:** the Mansehare tide pools (troop 23, ×3; troop 24, with an Octopus).
- **Stats:** 40 / 12 / 4 / 44. **Moves:** Moray Bite (Bleed, 30%); Grapple (Entangled, 50%).
- **Talk:** animal. Likes Raw Fish.
- **Drops:** Raw Eel 1/2, Eel Skin 1/4.
- **Tactics (instinct):**
  - **Grab and bite:** Grapple, then bite whoever it holds (`<Follow Up: Entangled +30>`, already in).
  - **Home:** it only wants its hole back; alone and hurt, it slips away.
- **Changes:** `<Flees When: alone & 30%>`.

**Remembered**
- *First sight:* "Snake in a hole. Lots of teeth."
- *Insight 2–4:* "It grabs, then it bites the one it's holding."
- *Insight 5+:* "It only wants its hole back."
- *Margin, Dama (later):* "Morays bite once and don't let go. Mind your fingers in the pools."

### Octopus
**Design**
- **Where:** the Mansehare shore (troop 24, with Moray Eels ×2).
- **Stats:** 55 / 10 / 4 / 40. **Moves:** Grapple (Entangled, 50%); Ink Cloud (Dazzled, 70%); Drag Below (pulls a
  victim down; hit the octopus to free them).
- **Talk:** animal; curious, not hungry. Likes Shellfish.
- **Drops:** Octopus Ink 1/2, Octopus 1/2, Shell 1/4.
- **Tactics (instinct, clever for an animal):**
  - **Ink first:** Ink Cloud at whoever hits hardest (the scoring already favours Dazzling hard hitters).
  - **Grab, then pull:** Grapple, then Drag Below whoever it holds: a combo inside one creature.
  - **Escape artist:** below 30% Health it jets away.
- **Changes:** `<Follow Up: Entangled +30>`; `<Flees When: 30%>`.

**Remembered**
- *First sight:* "Too many arms. All of them grabbing."
- *Insight 2–4:* "It squirts black. Then it holds you. Then it pulls you under."
- *Insight 5+:* "It's curious, not hungry. It likes shellfish."
- *Margin, Lasa:* "It took my shiny stone and gave me a different shiny stone. Fair trade!"
- *Margin, Parl (later):* "The one sea creature my god lets me eat. Don't tell it that."

---

## 7. The laurel forest (Act 2)

The Lady of the Woods' rainforest: the forest's edge (map 19), the Lady's Table (20), the deep forest (21) and
the Builder well. Ghost Yoon, Sib, Lasa and Pada. **Already in this bestiary:** the Wild Boar (with Centipedes
here, troop 2), the Raven (troop 15), the Owl of Ill Omen (troop 11, and the Forest Patrol) and the Barn Owl.
**The forest's own combo** belongs to its Lady: her rain soaks you **Wet**, her falling boughs (earth) turn Wet to
**Sodden** (no magic; physical hits land 35% harder), and then she gores.

### Giant Centipede
**Design**
- **Where:** the forest's edge (troop 3, ×4; troop 2, with Wild Boars).
- **Stats:** 30 / 9 / 3 / 46. **Moves:** Venom Bite (Venom, 40%); Trip (Disoriented).
- **Talk:** animal; gentle words don't reach it, a sharp threat might send it off.
- **Drops:** Venom Sac 1/2, Centipede Venom 1/4, Leaf Mould 1/4.
- **Tactics (instinct):** trips the steady, then bites the stumbling (`<Follow Up: Disoriented +30>`, already in).
  Doesn't waste Venom on the already Venomed.

**Remembered**
- *First sight:* "Long. Legs. All legs."
- *Insight 2–4:* "It trips you. Then it bites the one who fell."
- *Insight 5+:* "Shout at it. It doesn't like shouting."
- *Margin, Pada:* "Boots. Thick ones. Then step on its head."

### Forest Imp
**Design**
- **Where:** the deep forest (troop 9, ×2 with Green Horses ×2). The forest's child-fae: pranksters who never knock
  anyone out, and run when beaten.
- **Stats:** 27 / 5 / 3 / 48 (MAT 8). **Moves:** Trip (Disoriented); Mock (Panicked, 30%).
- **Talk:** spirit, starts Wary. A threat dissolves it into a puddle (no reward); pleading works (it feels bad
  when children cry). Falmi talks it down at once. Likes Dried Figs. Talked down, it leaves the party a gift: Speed
  up for 3 turns.
- **Drops:** Pine Pitch 1/3, Faya Berries 1/4, Bellflower Fruit 1/6.
- **Sees the Ghost** (fae).
- **Tactics (instinct, teamwork):** one trips a victim, the other mocks whoever is down. With the Green Horses,
  they keep the horse between them and you.
- **Changes:** `<Pack>`.

**Remembered**
- *First sight:* "Little green people. Laughing at us."
- *Insight 2–4:* "They trip you and then they laugh. They stop if you cry."
- *Insight 5+:* "One shout and they're puddles. That's sad. Don't shout."
- *Margin, Lasa:* "Forest cousins! They're not as funny as cave cousins. Don't tell them I said that."
- *Margin, Falmi (later):* "MY little brothers and sisters! Sort of! They grow in the Garden! I grew in a POT!"

### Green Horse
**Design**
- **Where:** the deep forest (troop 9, carrying the Forest Imps). The child-fae's near-invisible mount of leaves and
  boughs.
- **Stats:** 50 / 8 / 4 / 50. **Moves:** Hoof Strike.
- **Talk:** none (it doesn't answer). Very hard to hit (60% evasion) **until soaked or weighed down** (Wet, Sodden,
  Burdened, Mired); burns easily (Fire ×2).
- **Drops:** Green Horse Bough 1/4, Horsehair 1/3, Beard Lichen 1/4.
- **Sees the Ghost** (fae).
- **Tactics (tier 2: a fae creature, not a dumb beast):** guards its riders. When an imp is hurt, it steps in front
  of it (Cover, worth more the more hurt the imp is); otherwise it kicks.
- **Changes:** gains **Cover** (97: takes single attacks meant for an ally); `<Tactics: 2>`; `<Sees: ghost>`.

**Remembered**
- *First sight:* "A horse? Leaves in the shape of a horse."
- *Insight 2–4:* "You can't hit it. It's mostly not there."
- *Insight 5+:* "Wet leaves droop. Make it wet. Make it heavy."
- *Margin, Sib:* "Fire would work too. Please don't set the Lady's forest on fire."

### Boar-Man
**Design**
- **Where:** the deep forest (troop 10, ×3; troop 12, the Forest Patrol, with an Owl of Ill Omen). The People of
  the Forest's men, who enforce the forest agreements.
- **Stats:** 110 / 15 / 8 / 30. **Moves:** Boar Club; Boar Spear; Brace (counters the next melee blow); Skull Crack
  (Disoriented); Offer Passage (a talk move: lets the party leave).
- **Talk:** sapient. **Plain speaking works; bribes and cleverness backfire;** a threat is honest, so it doesn't
  offend. Likes Islander Wine. Pacified, it tells you the terms and the party's Defense goes up.
- **Drops:** Sinew 1/2, Bone 1/3.
- **Tactics (tier 2):**
  - **Honest fighters:** Brace (then counter) against a melee party; Skull Crack (Disoriented) on the hardest
    hitter, which the scoring favours.
  - **Patrol:** Boar-Men gang up on whoever an ally just hit.
  - Offer Passage once they're calm enough.
- **Changes:** `<Pack>`.

**Remembered**
- *First sight:* "Men. Pig men. Big."
- *Insight 2–4:* "Say it plain. Don't be clever. Don't give gifts."
- *Insight 5+:* "Cut only the marked trees. Burn only in the clearings. The owls are watching."
- *Margin, Pada:* "Good neighbours if you keep the agreements. I keep them."

### Laurel Pigeon
**Design**
- **Where:** the forest's edge (troop 60, ×2). The gentle fight that teaches Talk.
- **Stats:** 18 / 4 / 2 / 48. Flying. **Moves:** Flutter (nothing happens); Peck; Escape (when scared).
- **Talk:** animal, nearly Calm already. Likes Barley, Cosco Seeds, Pine Nuts.
- **Drops:** Seabird Feather 1/3, Pine Nuts 1/4, Laurel Branch 1/5.
- **Tactics (tier 0):** none on purpose. It flutters, pecks, and flies off when frightened.

**Remembered**
- *First sight:* "Bird. Soft bird. Scared bird."
- *Insight 2–4:* "Talk quiet. Give it seeds. It stays."
- *Insight 5+:* "It's more scared of us than we are of it."
- *Margin, Lasa:* "It let me hold it! It let me HOLD it! It weighs nothing! Is it hollow? Are birds hollow?"

### Wild Bees
**Design**
- **Where:** the Bee Rock gathering spots (troop 61, ×2). A swarm defending its honey.
- **Stats:** 40 / 9 / 2 / 62. **Moves:** Swarm Stings (Venom, 25%); Angry Buzz (the whole party).
- **Talk:** none. **Smoke drives them off:** with a Torch lit, they flee (troop event).
- **Drops:** Wild Honey 1/2, Venom Sac 1/6, Myrtle Wax 1/5.
- **Tactics (instinct):** the swarm follows the first sting (pack), and buzzes the whole party when several of you
  are close.
- **Changes:** `<Pack>`.

**Remembered**
- *First sight:* "Buzzing. Everywhere. Hurts."
- *Insight 2–4:* "They're guarding the honey. Smoke makes them go."
- *Insight 5+:* "Light a torch first. Then take the honey."
- *Margin, Pada:* "Smoke, then honey. Never honey, then smoke."

### Great Boar (boss)
**Design**
- **Where:** deep in the forest, with the Lady's leave (troop 27). The largest boar in the Lady's forest. Its flesh
  becomes Yoon's body.
- **Stats:** 900 / 24 / 12 / 36. **Moves:** Great Gore; Tusk Sweep (the whole party); Stampede (at or below half
  Health: a huge charge); Wallow (heals itself when hurt).
- **Talk:** animal; the showcase for **Stalk**: corner it (Hunted), then Pada's **Finishing Blow** ends it at once.
  Likes Sweet Potato.
- **Drops:** Raw Meat, Boar Tusk, Hide (all certain).
- **Tactics (tier 3):** gores whoever hurt it most; sweeps when the party bunches up; wallows when hurt and no one
  is close to falling; stampedes at the end.
- **Changes:** `<Grudge>`.
- **Balance** (Act 2 party, attacking only): won about a third of the time. **Stalking is the answer:** a hunter
  doesn't fight a boar like this head-on.

**Remembered**
- *First sight:* "Big. The biggest. Old."
- *Insight 2–4:* "Don't fight it. Hunt it. Pada knows how."
- *Insight 5+:* "It knows why we came. It's tired."
- *Margin, Pada:* "Old, scarred, and tired. It deserves a clean end. We give it one."

### Daughter of the Wells (boss)
**Design**
- **Where:** the Builder well (troop 26, optional). One of the Lady of the Woods' three daughters, trapped in the
  well by a Builder binding and made a snake woman. **A rescue:** beaten or calmed, she becomes a river maiden
  again.
- **Stats:** 700 / 19 / 10 / 38 (MAT 18). **Moves:** Coil (Entangled); Drag Below (pulls a victim under); Well
  Water (water, the whole party: Wet); Viri (water; may drag under).
- **Talk:** spirit.
- **Sees the Ghost** (a spirit).
- **Tactics (tier 3):**
  - **Coil, then drag:** whoever she holds goes under (`<Follow Up: Entangled +30>`).
  - **The well rises:** Well Water when the party is dry; then her water spells against the soaked.
- **Changes:** `<Follow Up: Entangled +30>`.
- **Balance** (Act 2 party): won 75–100% of the time, but at about 70% of the party's Health.

**Remembered**
- *First sight:* "Snake. Snake lady. In the dark water."
- *Insight 2–4:* "She holds you, then she pulls you down. Hit her and she lets go."
- *Insight 5+:* "Under the hissing she's crying for her mother."
- *Margin, Sib:* "The binding's carved round the rim. Builder glyphs. Um. I can read most of it. Most."
- *Margin, Falmi (later):* "My SISTER! ...Kind of! We're both the Lady's! She was stuck in a WELL! I'm so angry it's
  raining inside me!"

### Lady of the Woods, lowland aspect (boss) and the Sacred Rain Pig
**Design**
- **Where:** the Lady's Table (troop 29), if a bargain goes wrong or she's insulted. Temperamental but gregarious:
  **feed her, talk plainly, and she'd rather feast than fight.** At half Health she becomes the **Sacred Rain Pig**
  (troop event; her mood carries over).
- **The Lady:** 900 / 20 / 12 / 40 (MAT 20). **Moves:** Tusked Fury; Rainforest Deluge (water, the whole party);
  Falling Boughs (earth, the whole party); Temper (Brave, at or below half); Geha (her glyph: heals her).
- **The Sacred Rain Pig:** 440 / 22 / 13 / 36 (MAT 22). **Moves:** Mud Charge (Mired); Sacred Rain (soaks the whole
  party Wet); Geha. Wordless and holy: only a rain rite or food reaches it.
- **Talk:** spirit. The Lady: food and plain words (likes Sweet Potato, Islander Wine); Asked when Calm, she gives
  the forest's terms. The Pig: a rain rite or food only.
- **Sees the Ghost** (spirits).
- **Tactics (tier 3):**
  - **Her own combo:** Deluge soaks the party Wet; Falling Boughs (earth) then turns Wet to Sodden (no magic; hits
    land 35% harder); then Tusked Fury. The tactics see the upgrade on their own: no tags needed.
  - Geha when she's hurt; Temper at half Health.
  - **The Pig:** soaks the party, then Mud Charges whoever is still standing firm.
- **Changes:** none.
- **Balance** (Act 2 party, attacking only): won 5–30% of the time. **The fight is the failure:** feeding her and
  speaking plainly is the way.

**Remembered**
- *First sight:* "The Lady. Big. Hungry. Angry. Then laughing."
- *Insight 2–4:* "Rain, then branches, then tusks. Get dry. Get out of the way."
- *Insight 5+:* "She'd rather eat than fight. Feed her."
- *Margin, Pada:* "Never come to her table empty-handed. Never come hungry either: she'll notice."
- *Margin, Falmi (later):* "MOTHER! She's lovely when she's not trying to kill you. She's lovely then too, but
  louder."

---

## 8. The alpine meadows and the snow (Acts 2–3)

Up from the Highland Pines and Idekeu (map 24) through the Alpine Meadows and Chafakeu (25) to the Snow Line (26):
the Shepherd's herds, then the Lady's cold high-forest body. Act 2's party (Ghost Yoon, Sib, Lasa, Pada) on the way
to the Snow Urn; the Lady's alpine aspect may wait for Act 3 (with Juda). **Already in this bestiary:** the Raven
(the pines, troop 15) and the Feral Sheep (in the Alpine Herd, troop 18). **The high forest's combo** is the alpine
Lady's: her Snowfall (air) leaves you **Disoriented**, and her Falling Boughs (earth) turn Disoriented into
**Grounded** (attack halved).

### Mouflon Ram
**Design**
- **Where:** the Highland Pines (troop 17, ×3); the Alpine Herd (troop 18, with Feral Sheep ×2); the Shepherd's
  herd (troop 28).
- **Stats:** 85 / 13 / 9 / 32. **Moves:** Ram; Paw the Ground (Brave).
- **Talk:** animal. Likes Barley Bread, Salt Lick.
- **Drops:** Mouflon Wool 1/2, Raw Meat 1/2, Ram Horn Charm 1/10.
- **Tactics (instinct):** works itself up (Paw the Ground), then rams; charges whoever stands up to it (whoever has
  hurt it).
- **Changes:** `<Grudge>`.

**Remembered**
- *First sight:* "Sheep. Wrong sheep. Curly horns."
- *Insight 2–4:* "It stamps first. Then it comes. Move."
- *Insight 5+:* "It only charges what stands in front of it."
- *Margin, Pada:* "The Shepherd's flock. One beast per family per winter. Not this winter."

### Golden Eagle
**Design**
- **Where:** the alpine peaks (troop 19, ×2); the Shepherd's herd (troop 28).
- **Stats:** 50 / 13 / 4 / 56. Flying. **Moves:** Talon Dive (Bleed, 25%); Rending Beak.
- **Talk:** animal. Likes Raw Meat, Raw Fish.
- **Drops:** Eagle Feather 1/8, Bone 1/3, Hide 1/5.
- **Tactics (instinct):** dives to make you bleed, then rends the bleeding (`<Follow Up: Bleed +30>`, already in).
  It wants you gone from its nest, not dead: badly hurt, it leaves.
- **Changes:** `<Flees When: 30%>`.

**Remembered**
- *First sight:* "Bird. The biggest bird. Gold."
- *Insight 2–4:* "It cuts you from the sky. Then it tears where it cut."
- *Insight 5+:* "There's a nest up there. It wants us gone, not dead."
- *Margin, Lasa:* "It's so PRETTY. It's so pretty and it hates us. That's the worst kind of pretty."

### Snow-line Hare
**Design**
- **Where:** the alpine meadows up to the snow line (troop 74, ×3).
- **Stats:** 40 / 11 / 3 / 80. **Moves:** Hind Kick; Escape (it may bolt).
- **Talk:** animal; a threat sends it off. Likes Sweet Potato, Taro.
- **Drops:** Raw Meat 1/2, Hide 1/3.
- **Tactics (instinct):** kicks and runs. The fastest thing on the mountain: one loud noise and it's gone.
- **Changes:** none.

**Remembered**
- *First sight:* "White. Fast. Gone."
- *Insight 2–4:* "Big feet. It kicks."
- *Insight 5+:* "One loud noise and it's gone."
- *Margin, Pada:* "Snare, don't chase. You won't catch it running. Nobody does."

### Shepherd of the Deer (boss)
**Design**
- **Where:** the snow in the alpine forest (troop 28; Act 2, or later). The Lady's husband, guardian of the wild
  herds. **Calls his herd in two waves:** an eagle and a ram at 70% Health, two more at 35% (troop events).
- **Stats:** 800 / 20 / 10 / 48 (MAT 16). **Moves:** Crook Strike; Lead Astray (the whole party may be
  Disoriented, 60%); Garo (his stealth song, when hurt: he and his herd are hard to hit, Evasion +50%).
- **Talk:** spirit. **A rite works far better than a threat:** priests teach him songs. Asked when Calm, he gives the
  meadow's terms, and the party gets Speed up for 3 turns.
- **Sees the Ghost** (a spirit).
- **Tactics (tier 3):**
  - **Lead astray, then strike:** Lead Astray while the party is steady; Crook Strike whoever is lost.
  - **The herd fights for him:** the rams work themselves up and charge, the eagles cut and rend.
  - Garo when he's hurt: the whole herd melts into the snow (hard to hit).
- **Changes:** `<Follow Up: Disoriented +30>`.
- **Balance** (Act 2 party, attacking only): won nine fights in ten, at about 70% of the party's Health.

**Remembered**
- *First sight:* "A man with antlers. Or a deer with hands."
- *Insight 2–4:* "Everything looks the same when he sings. Then the crook comes."
- *Insight 5+:* "He wants a song, not a fight. Sib knows songs."
- *Margin, Sib:* "Priests teach him songs. That's in the oldest rites. I never thought I'd be the one singing."
- *Margin, Juda:* "He's always loved a new song. I taught him several, long ago. Ask him which."

### Lady of the Woods, alpine aspect (boss) and the Stern Centaur
**Design**
- **Where:** the high pines (troop 50). The Lady's cold high-forest body: polite but cold. **Courtesy works** (Ask,
  Rite); gifts insult her; tears don't move her; threats are unforgivable. At half Health she becomes the **Stern
  Centaur** (troop event).
- **The Lady:** 900 / 20 / 13 / 40 (MAT 20). **Moves:** Horned Rebuke; Snowfall (air, the whole party: Chilled,
  30%); Falling Boughs (earth, the whole party); Cold Composure (Endurance and Resolve up, when hurt); Huhuti (her
  glyph: Entangled, 60%).
- **The Stern Centaur:** 560 / 24 / 14 / 46 (MAT 22). **Moves:** Spear of the Pines; Hoofbeat (the whole party);
  Frost of the Heights (air, the whole party: Chilled, 50%); Huhuti. A judge with a spear: only formal questions and
  rites reach her now.
- **Talk:** spirit. Asked properly when Calm, she gives the high forest's stricter terms (no fire above the
  treeline, no felling the old pines, one beast of the herd per family per winter).
- **Sees the Ghost** (spirits).
- **Tactics (tier 3):**
  - **Her own combo:** Snowfall leaves the party Disoriented; Falling Boughs then turns that into Grounded (attack
    halved). The tactics find it by themselves.
  - **Bind, then strike:** Huhuti entangles; then Horned Rebuke (the Lady) or Spear of the Pines (the Centaur) on
    whoever is held.
  - Cold Composure when she's hurt.
- **Changes:** `<Follow Up: Entangled +30>` (both).
- **Balance** (attacking only): not won. **The fight is the failure:** courtesy and the right rite are the way.

**Remembered**
- *First sight:* "The Lady again. Cold now. Very polite."
- *Insight 2–4:* "Snow, then branches. Then you can't hit hard. Then she ties you up."
- *Insight 5+:* "Ask her properly. Don't give her food. Don't cry."
- *Margin, Pada:* "Bow. Ask. Wait. Then ask again, slower."
- *Margin, Falmi (later):* "This is Mother when she's being a JUDGE. I hate it when she's a judge. I love her. I
  hate it."

---

## 9. The highlands and the volcanic desert (Act 3)

The dry highlands, the volcanic desert where the Stonemen stand, and the crater lake on the way to the ritual site.
Yoon has a body now: the party is Yoon, Sib, Pada and Juda. **Already in this bestiary:** the Rock Lizard (troop
70, ×3) and the Vulture (arriving late in the desert, troop 33). **The desert's rules:** the sun heals what basks
(fight lizards at night); the Stonemen mire you and salt you; the crater lake soaks you and blinds you with steam.

### Giant Lizard
**Design**
- **Where:** the highlands and desert (troop 31, ×2; troop 33, with Vultures arriving late).
- **Stats:** 110 / 16 / 10 / 30. **Moves:** Tail Lash; Bite; Bask (heals 15%, by day and outdoors only).
- **Talk:** animal. Likes Raw Meat, Dried Figs, Cricket Legs.
- **Drops:** Hide 1/2, Raw Meat 1/2.
- **Tactics (instinct):** like its small cousins: lashes whoever hurt it, basks when hurt (in the sun only).
- **Changes:** `<Grudge>`.

**Remembered**
- *First sight:* "Lizard. Big. As long as Pada."
- *Insight 2–4:* "Slow until the sun warms it. Then it lies in the sun and gets better."
- *Insight 5+:* "Fight it at night."
- *Margin, Pada:* "Cold-blooded. Hunt them at dawn, before the rocks warm up."

### Giant Tortoise
**Design**
- **Where:** the highlands (troop 32, alone).
- **Stats:** 200 / 15 / 30 / 12. **Moves:** Snapping Bite; Withdraw (Endurance up).
- **Talk:** animal; ancient and in no hurry. Likes Dried Figs, Sweet Potato.
- **Drops:** Tortoise Scute 1/2, Raw Meat 1/2. (Seafarers won't wear its shell.)
- **Tactics (instinct, cautious):** pulls into its shell whenever it's hurt, then snaps when someone comes close.
  Crush it, don't cut it.
- **Changes:** `<Tactics Style: cautious>`.

**Remembered**
- *First sight:* "A rock that walks. Very slowly."
- *Insight 2–4:* "Cutting does nothing. Hit it like a door."
- *Insight 5+:* "It's old as the trail. Leave it be."
- *Margin, Sib:* "Tortoises carry the old roads on their backs. That's a story. Um. It's a nice story."

### Guardian Lizard
**Design**
- **Where:** pools and springs (troop 34, ×2), and the crater lake.
- **Stats:** 140 / 16 / 12 / 40 (MAT 14). **Moves:** Spring Spit (water: Wet); Bite; Scale Guard (Endurance up).
- **Talk:** spirit; a rite works. **Tou knows its oath:** it yields to her at once. Likes Cricket Legs.
- **Drops:** Lizard-Scale Charm 1/10, Hide 1/2, Bone 1/3.
- **Sees the Ghost** (a spirit).
- **Tactics (tier 2):** spits to soak, then bites the soaked; raises its scales when hurt. (It guards the water, not
  itself: on the map it's placed by a pool, and the tell warns you off.)
- **Changes:** `<Follow Up: Wet +20>`.

**Remembered**
- *First sight:* "Lizard. Shiny. Watching the water."
- *Insight 2–4:* "It spits water, then it bites. It guards the pool."
- *Insight 5+:* "Don't go near the pool."
- *Margin, Tou (later):* "We remember its oath. It guarded our wells when they were young. Stand down, old friend."

### Aurochs Calf, and the Aurochs
**Design**
- **Where:** the highlands (troop 67: a calf, and the herd bull who charges in when it's hurt; troop 68, a lone
  bull, rare).
- **The calf:** 80 / 6 / 6 / 30. **Moves:** Bleat (calls the herd). Harmless. Tier 0.
- **The bull:** 460 / 27 / 14 / 34. **Moves:** Aurochs Charge (Stunned, 20%); Trample (the whole party); Paw the
  Ground (Brave, when hurt).
- **Talk:** animal. The bull is guarding the herd: back away slowly and it may let you. Likes Salt Lick, Sea Salt.
- **Drops:** the calf: Cow's Milk 1/2, Raw Meat 1/3. The bull: Cowhide 1/1, Ox Horn 1/2, Raw Meat 1/1.
- **Tactics (instinct):** the bull charges whoever hurt its calf or itself, then tramples the party.
- **Changes:** `<Flock>` and `<Grudge>` (the bull).
- **Balance** (Act 3 party, attacking only): won almost always, at over half the party's Health. Hurting the calf
  is the mistake.

**Remembered**
- *First sight:* "Calf. Big calf. Its mother is somewhere."
- *Insight 2–4:* "Hurt the little one and the big one comes. The big one is VERY big."
- *Insight 5+:* "Back away slowly. It only wants its herd."
- *Margin, Pada:* "Wild cattle. The Seafarers' cows came from these, once. Theirs forgot how to charge."

### Desert Scorpion
**Design**
- **Where:** the volcanic desert, under every stone (troop 71, ×3).
- **Stats:** 60 / 14 / 14 / 40. **Moves:** Stinger (Venom, 50%); Pincers; Grapple (Entangled).
- **Talk:** animal; it doesn't understand kindness.
- **Drops:** Venom Sac 1/2, Red Scoria 1/4, Sulfur Lump 1/12.
- **Tactics (instinct):** grabs, then stings whoever it holds (`<Follow Up: Entangled +30>`, already in).
- **Changes:** none.

**Remembered**
- *First sight:* "Under the stone. Tail up."
- *Insight 2–4:* "It holds you with the claws. Then the tail."
- *Insight 5+:* "Watch the tail, not the claws."
- *Margin, Juda:* "Shake out your sandals in the morning, children. Always."

### Hawk
**Design**
- **Where:** the dry slopes (troop 72, ×2).
- **Stats:** 44 / 14 / 3 / 60. Flying. **Moves:** Talon Dive (Bleed, 25%); Rending Beak.
- **Talk:** animal. Likes Raw Meat, Cricket Legs.
- **Drops:** Seabird Feather 1/3, Bone 1/3.
- **Tactics (instinct):** dives to make you bleed, then rends the bleeding (already in). It wants food, not a fight:
  badly hurt, it leaves.
- **Changes:** `<Flees When: 30%>`.

**Remembered**
- *First sight:* "Small eagle. Faster."
- *Insight 2–4:* "Cut, then tear. Like the big one."
- *Insight 5+:* "It wants food, not us."
- *Margin, Lasa:* "Show-off! Show-OFF!"

### Stoneman
**Design**
- **Where:** the volcanic desert (troop 40, ×3; troop 41, with a Stoneman Priest; troop 42, with the Shaman).
  Unfinished moai of soft tuff, walking: Builder remnants waiting for orders.
- **Stats:** 150 / 17 / 22 / 18. **Moves:** Stone Fist; Ground Pound (the whole party: Mired, 30%); Brace.
- **Talk:** sapient; **they surrender to Tou** at once.
- **Drops:** Basalt 1/2, Andesite 1/3, Red Scoria 1/4.
- **Tactics (tier 2):** stamps the ground (Mired: slowed, no physical moves), then fists whoever is stuck; braces
  against melee.
- **Changes:** `<Follow Up: Mired +20>`.
- **Balance** (Act 3 party): about half the party's Health for three. Crush them; don't cut stone.

**Remembered**
- *First sight:* "Stone people. Not finished."
- *Insight 2–4:* "They stamp and the ground holds you. Then they hit."
- *Insight 5+:* "They're waiting for orders that never come."
- *Margin, Tou (later):* "Stand down. Your queen is here. ...They always did look so tired."

### Stoneman Priest
**Design**
- **Where:** the volcanic desert (troop 41, with Stonemen ×2).
- **Stats:** 120 / 10 / 16 / 22 (MAT 16). **Moves:** Salt Glyph (Salting, 80%); Mend Stone (heals an ally 25%);
  Stone Fist.
- **Talk:** sapient; a rite works, and Tou stops it at once.
- **Drops:** Jasper 1/3, Glyph Tablet Shard 1/6, Chalcedony 1/4.
- **Tactics (tier 2, support):** mends whichever Stoneman is most cracked; salts whoever isn't salted yet. Take it
  down first. **Water washes Salting off.**
- **Changes:** `<Tactics Style: support>`.

**Remembered**
- *First sight:* "Stone man with writing on it."
- *Insight 2–4:* "It fixes the others. It makes you salty. Hit it first."
- *Insight 5+:* "Water washes the salt off."
- *Margin, Sib:* "The glyphs are a rite. A Builder rite. I can read it. I don't like what it says."

### Stoneman Shaman (boss)
**Design**
- **Where:** the volcanic desert (troop 42, with a Stoneman). The oldest Stoneman, keeper of the salt glyphs.
- **Stats:** 600 / 17 / 20 / 24 (MAT 16). **Moves:** Stone Fist; Salt Storm (the whole party: Salting, 30%);
  Earthshaker (earth, the whole party: Mired, 30%); Mend Stone (when hurt).
- **Talk:** sapient; a rite reaches it, and Tou gives it the order it's been waiting for. Asked when Calm: "The
  Navigator Lords left. We were not finished. We wait."
- **Tactics (tier 3):**
  - **Earthshaker plays the cycle:** it turns Wet into Sodden and clears Disoriented into Grounded; the tactics find
    those on their own.
  - Salt Storm on an unsalted party; Mend Stone on itself or its Stoneman when they're cracked.
  - Stone Fist whoever is Mired.
- **Changes:** `<Follow Up: Mired +20>`.
- **Balance** (Act 3 party, attacking only): won about half the time.

**Remembered**
- *First sight:* "The oldest stone. Covered in writing."
- *Insight 2–4:* "Salt, then the ground shakes, then the fist."
- *Insight 5+:* "It's waiting for a Navigator's order. Tou could give one."
- *Margin, Juda:* "Such patient servants. It seems a shame no one gives them orders anymore."

### Guardian of the Crater Lake (boss)
**Design**
- **Where:** the crater lake, on the way to the ritual site (troop 43). The greatest Guardian Lizard.
- **Stats:** 800 / 19 / 14 / 40 (MAT 18). **Moves:** Spring Torrent (water, the whole party); Steam Burst (the whole
  party: Steam, 60%: blinding); Tail Sweep (the whole party); Scale Guard.
- **Talk:** spirit; a rite reaches it, and Tou knows its oath.
- **Sees the Ghost** (a spirit).
- **Tactics (tier 3):**
  - **Flood, then steam:** Spring Torrent soaks the party Wet; Steam Burst blinds (the scoring favours blinding
    hard hitters); Tail Sweep, then its Wet follow-up, against a soaked party.
  - Scale Guard when it's hurt.
- **Changes:** `<Follow Up: Wet +20>`.
- **Balance** (Act 3 party, attacking only): won a little over half the time.

**Remembered**
- *First sight:* "The lake has a lizard. The lizard IS the lake."
- *Insight 2–4:* "Water, then steam. You can't see. Then the tail."
- *Insight 5+:* "It guards the lake for someone long gone."
- *Margin, Sib:* "Who for, though? Who was it guarding it FOR?"
- *Margin, Tou (later):* "For us. For a queen who isn't coming back. ...Hello again, dear one."

---

## 10. The tombs, the deep tubes and the volcano (Acts 2–3)

The island's dark: the stone-cut tombs (Namethare, Jarcotapu) in Act 2, then in Act 3 the deep tubes and the
volcano, the Destroyer's house, where his servants run, and the mountain where Juda burns Pada. Act 2's party in the
tombs (Ghost Yoon, Sib, Lasa, Pada); Act 3's after (Yoon, Sib, Pada, Juda), and Yoon, Sib and Dama against Juda.
**The dark's rules:** the dead can be laid to rest with a rite; demons ride corpses and can be made to let go; the
Destroyer's own servants (the hounds, the Bull) won't listen at all.

### Restless Bones
**Design**
- **Where:** the tombs (troop 22, ×2 with a Bone Chanter).
- **Stats:** 70 / 14 / 9 / 30. **Moves:** Grave Blade; Brace (counters the next melee blow); Shield Bash (Stunned).
- **Talk:** spirit. **A rite or grave paint lays them down.**
- **Drops:** Bone 1/2, Bonemeal 1/3.
- **Sees the Ghost** (the dead see the dead).
- **Tactics (tier 2):** dead tomb guards, still guarding: they brace against a melee party and shield-bash the
  hardest hitter. With a Bone Chanter, they get back up.
- **Changes:** none.

**Remembered**
- *First sight:* "Bones. Standing up. Holding swords."
- *Insight 2–4:* "Hit them carelessly and they hit back first."
- *Insight 5+:* "Their graves were robbed of their paint. They want the rite done right."
- *Margin, Sib:* "Ochre paint, the right words, and they'll lie down. They're not angry. They're unfinished."

### Bone Chanter
**Design**
- **Where:** the tombs (troop 22, with Restless Bones ×2).
- **Stats:** 45 / 6 / 5 / 34 (MAT 14, MP 40). **Moves:** Grave Chill (magic: Chilled); Dirge (the whole party may
  fall into Despair, 40%); Raise Bones (stands a fallen skeleton back up, at half Health).
- **Talk:** spirit; a rite reaches it, and Sib might know its song's missing verse.
- **Drops:** Bone 1/2, Ochre Grave Paint 1/4.
- **Sees the Ghost.**
- **Tactics (tier 2, support):** raises a fallen skeleton the moment one falls (the scoring values bringing back the
  fallen); Dirge on a party not yet in Despair. **Take it down first.**
- **Changes:** `<Tactics Style: support>`.

**Remembered**
- *First sight:* "A dead priest. Singing."
- *Insight 2–4:* "It sings the bones back up. Stop the song first."
- *Insight 5+:* "Its song has a missing verse. Sib might know it."
- *Margin, Sib:* "It's the funeral verse for the Star Child. Someone left out the last line. That's why it can't stop."
- *Margin, Juda:* "A verse left out is a door left open. Remember that, Sib."

### Black Hound
**Design**
- **Where:** the volcano and the tubes (troop 44, ×3; troop 45, with an Alpha; troop 48, with the Bull of the Caves).
  The Destroyer's servants.
- **Stats:** 120 / 18 / 9 / 52. **Moves:** Hound Bite; Drag Below (pulls a victim into the dark; **hit the hound to
  pull them free**).
- **Talk:** none: it can't be talked to.
- **Drops:** Bone 1/2, Red Scoria 1/4, Hide 1/4.
- **Tactics (instinct):** the pack savages whoever one of them has dragged below (`<Pack>`, already in).
- **Changes:** `<Follow Up: Dragged Below +30>`.

**Remembered**
- *First sight:* "Black dogs. Red eyes. Hot breath."
- *Insight 2–4:* "One pulls you down. The others come for you there."
- *Insight 5+:* "Hit the one holding you. It lets go."
- *Margin, Pada:* "Not dogs. Don't let them make you think they're dogs. Patience knows."
- *Margin, Juda:* "They answer to an old master. Be careful in the deep tubes, children. Stay close to me."

### Black Hound Alpha
**Design**
- **Where:** leading a pack (troop 45, with Black Hounds ×2).
- **Stats:** 260 / 22 / 12 / 54. **Moves:** Rending Bite (Bleed, 40%); Drag Down (pulls a victim into the dark, 70%;
  hit the Alpha to pull them free); Howl of the Pit (the whole party may Panic, 40%).
- **Talk:** none.
- **Drops:** Bone 1/1, Black Hound Pelt 1/8, Sulfur Lump 1/8.
- **Tactics (instinct, a pack leader):** howls first (Panic), drags one down, and rends whoever is dragged or
  panicked.
- **Changes:** `<Follow Up: Dragged Below +30>`; `<Follow Up: Panicked +20>`.
- **Balance** (Act 3 party): about a third of the party's Health.

**Remembered**
- *First sight:* "The biggest dog. The others watch it."
- *Insight 2–4:* "It howls and you can't think. Then it takes someone."
- *Insight 5+:* "Kill it and the others are only dogs."
- *Margin, Pada:* "Lead hound. Take the lead hound."

### Hunched
**Design**
- **Where:** the tubes and graveyards (troop 46, ×3; troop 47, with a Defiler). A corpse ridden by a demon.
- **Stats:** 100 / 15 / 8 / 26 (MP 12). **Moves:** Corpse Claw; Grave Breath (Venom, 40%); Grave Chill (magic:
  Chilled).
- **Talk:** spirit. **Talk to free it:** the rider lets go, and the dead can be laid to rest.
- **Drops:** Bone 1/2, Ancestral Remains 1/4, Mourning Paint 1/8.
- **Sees the Ghost** (a spirit rides it).
- **Tactics (tier 2):** chills the healthy, rots the chilled with its breath, claws the slowed.
- **Changes:** none.

**Remembered**
- *First sight:* "A dead person. Walking wrong. Bent over."
- *Insight 2–4:* "Something is riding it. Something that isn't it."
- *Insight 5+:* "Someone is still in there, under the rider. Talk to it."
- *Margin, Sib:* "Every one of them was somebody's. We have to lay them down properly after."
- *Margin, Juda:* "Poor things. Someone really should lay them to rest."

### Hunched Defiler
**Design**
- **Where:** deeper in (troop 47, with Hunched ×2). A stronger demon in an older corpse: it uses magic.
- **Stats:** 180 / 12 / 10 / 30 (MAT 20, MP 60). **Moves:** Defile (magic, Despair 40%); Pyre Breath (fire, the whole
  party: Smoldering); Corpse Claw.
- **Talk:** spirit; a rite reaches it.
- **Drops:** Bone 1/1, Ochre Grave Paint 1/4, Skeletal Figurine 1/8.
- **Sees the Ghost.**
- **Tactics (tier 2, cunning):** Pyre Breath plays the cycle by itself (fire turns Disoriented into Feverish and
  cracks the Mired); Defile whoever isn't in Despair yet.
- **Changes:** `<Tactics Style: cunning>`.

**Remembered**
- *First sight:* "Old corpse. Fire in its mouth."
- *Insight 2–4:* "It burns you, then it makes you hopeless."
- *Insight 5+:* "Its grip on the body is old. It will be hard to talk it loose."
- *Margin, Sib:* "Fire from a dead mouth. I'm going to have nightmares. Um. More nightmares."

### The Bull of the Caves (optional boss)
**Design**
- **Where:** the Destroyer's tubes, guarding treasure (troop 48, with Black Hounds ×2 that join at half Health). The
  fire-breathing twin of the Bull of Heaven. Serves the Destroyer.
- **Stats:** 950 / 21 / 15 / 38 (MAT 15). **Moves:** Molten Gore (part fire); Fire Breath (fire, the whole party);
  Cave Stampede (the whole party, at or below 60% Health).
- **Talk:** none: it won't listen.
- **Tactics (tier 3):** breathes fire over the party, gores whoever hurt it most, stampedes when hurt; its hounds
  drag and savage.
- **Changes:** `<Grudge>`.
- **Balance** (Act 3 party, attacking only): not won. The island's hardest optional fight in Act 3, and meant to be:
  come back stronger.

**Remembered**
- *First sight:* "A bull made of the mountain. On fire."
- *Insight 2–4:* "Fire on all of us. Then the horns. Then everything at once."
- *Insight 5+:* "It belongs to the dark under the mountain. It won't listen."
- *Margin, Sib:* "The Bull of Heaven's twin. One judges the guilty. This one serves the Destroyer."

### Juda (Act 3 boss)
**Design**
- **Where:** the mountain, after he burns Pada (troop 49). He believes Yoon is the demon he summoned. **Optionally
  beatable:** at 0 Health he doesn't die but rises in his **partial Navigator Lord form** (coral eyes), which can't be
  fairly beaten: it never knocks anyone out, and after three turns the fire roars up and the battle ends (switch 9).
  (A person, so his entry may belong under **People**.)
- **Stats:** 550 / 13 / 12 / 34 (MAT 13, MP 150). **Moves:** Ritual Knife; Pyre (fire); Ahigun (fire, the whole party);
  Chlorine Cloud (the whole party: Venom 60%, Panicked 30%); Mahu (heals himself, when hurt).
- **The half-risen form:** 9999 Health. **Moves:** Unmaking Glyph; Coral Gaze (Hypnotized, 80%); Ashen Hand.
- **Talk:** none: he won't listen.
- **Sees the Ghost** (a priest, and more).
- **Tactics (tier 3):**
  - **He goes for Yoon:** he believes Yoon is the demon.
  - **Gas, then fire:** Chlorine Cloud on a steady party, then fire on the poisoned and panicked; Mahu when he's hurt.
- **Changes:** `<Prefers: actor 2>` (`NEW`: the tactics can prefer a particular party member); `<Tactics Style:
  cunning>`.
- **Balance** (Yoon, Sib and Dama, attacking only): not won. Beating him is optional, and it shows you the truth.

**Remembered**
- *First sight:* "Master Juda. Fire in his hands."
- *Insight 2–4:* "He wants me. Not the others. Me."
- *Insight 5+:* "You smell like the dark where I woke up."
- *Margin, Sib:* "I never suspected him. Not once. I should have. I should have."
- *Margin, Dama:* "Someone killed a child. That's my business. He made it my business."

### Ridden Aurochs (Act 4+)
**Design**
- **Where:** with the Destroyer's forces from Act 4 (troop 69). A dead aurochs ridden by a demon, used as a battering
  ram.
- **Stats:** 700 / 26 / 16 / 30. **Moves:** Battering Ram (the whole party: Stunned, 20%); Dead Horns (Venom, 40%);
  Grave Breath (Venom, 40%).
- **Talk:** spirit. **Talk like the Hunched:** a rite frees the carcass.
- **Drops:** Ox Horn 1/1, Bone 1/1.
- **Tactics (tier 2):** rams the whole party, then gores whoever hurt it most.
- **Changes:** `<Grudge>`.

**Remembered**
- *First sight:* "A dead bull. Something is wearing it."
- *Insight 2–4:* "It uses itself like a ram at a gate."
- *Insight 5+:* "A rite. Like the Hunched. Let the bull lie down."
- *Margin, Thenmy (later):* "Our cattle came from these. To see one used so... it is an obscenity."

---

## Open questions

- **Built:** the tactics plugin, every change marked `NEW` above and every section's **Changes** (the coast's too)
  are in the game (test 68). Some plans
  are approximated by the general scoring rather than built exactly:
  - the false Crane doesn't stare at the Ghost in battle (its tell still says so);
  - the cave children's Mock and the Raven's Ill Omen aren't aimed at the Ghost on purpose (ravens can
    target him; the scoring decides);
  - the Hag doesn't single out whoever stands nearest the Ghost;
  - Parl doesn't kite or answer his worst attacker with sand (he is `<Reluctant>`: he holds back on
    children until he's below half Health);
  - "most dangerous" and "smallest" targets come from the scoring (fast or hard-hitting targets are worth
    more for disabling states; the Barn Owl `<Prefers: child>`).
- **Next area,** in story order: the Seafarers (Acts 4–5).

**Decided:** the early enemies keep their stats (their data notes now give the right acts); ravens see the
dead; enemies can see Lasa; margin notes are in each character's voice (concept.md, "Voices").
