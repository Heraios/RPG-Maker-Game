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
- **Next area,** in story order: the highlands and the volcanic desert (Act 3).

**Decided:** the early enemies keep their stats (their data notes now give the right acts); ravens see the
dead; enemies can see Lasa; margin notes are in each character's voice (concept.md, "Voices").
