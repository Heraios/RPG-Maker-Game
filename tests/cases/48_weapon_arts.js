// Weapon arts: starting kits, the Test Room's weapon master, new weapon moves, and the new rules:
// Hook Down grounds flyers, Brace counters, Ward Off parries, Cover takes the hits, Throw Knife (both
// hands), the off-hand follow-up, kind bonuses, Blood Offering's Mana, Haul In, Ground Pound and item costs.

module.exports = {
    'weapon arts': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, A = id => $gameActors.actor(id), SK = n => $dataSkills.find(s => s && s.name === n);
            const WE = n => $dataWeapons.find(w => w && w.name === n), EN = n => new Game_Enemy($dataEnemies.find(e => e && e.name === n).id, 0, 0);
            const ST = n => SmokingIsle.Ailments.stateByName(n), WA = SmokingIsle.WeaponArts;
            // starting kits (fresh actors)
            const fresh = id => { const a = new Game_Actor(id); return $dataSkills.filter(WA.isWeaponSkill).filter(s => a.isLearnedSkill(s.id)).map(s => s.name); };
            out.sib = fresh(3).join(', '); out.kath = fresh(14).join(', ');
            out.dama = fresh(7).includes('Brace') && fresh(7).includes('Cast Net') && !fresh(7).includes('Vital Strike');
            out.thenmy = ['Cover', 'Shield Bash', 'Pommel Strike'].every(n => fresh(11).includes(n));
            out.taught = $dataSkills.filter(WA.isWeaponSkill).every(s => A(2).isLearnedSkill(s.id));
            // new moves on weapons
            const moves = n => WE(n).siMoves.join(' ');
            out.moves = ['Copper Spear', 'Heather Staff', 'Copper Axe', 'Obsidian Paddle', 'Copper Knife', 'Basalt Hammer', 'Copper Mace'].map(moves).join(' | ');
            // Hook Down brings a flyer down
            const eagle = EN('Golden Eagle'), yoon = A(2), hook = new Game_Action(yoon); hook.setSkill(SK('Hook Down').id);
            const wasFlying = SmokingIsle.Ranged.isFlying(eagle); eagle.clearResult(); hook.itemHit = () => 1; hook.itemEva = () => 0; hook.apply(eagle);   // no lucky dodge
            out.hook = wasFlying + '/' + SmokingIsle.Ranged.isFlying(eagle);
            // Ground Pound skips flyers; Haul In needs an Entangled target
            const pound = new Game_Action(yoon); pound.setSkill(SK('Ground Pound').id);
            out.pound = pound.testApply(EN('Golden Eagle')) + '/' + pound.testApply(EN('Raven') ) + '/' + pound.testApply(EN('Shore Crab'));
            const haul = new Game_Action(A(7)); haul.setSkill(SK('Haul In').id); const crab = EN('Shore Crab');
            out.haul = haul.testApply(crab) + '/'; crab.addState(ST('Entangled')); out.haul += haul.testApply(crab);
            // bonus by kind: Shatter hits shelled things harder
            const rnd = Math.random; Math.random = () => 0.5;
            const shatter = new Game_Action(A(5)); shatter.setSkill(SK('Shatter').id);
            const c2 = EN('Shore Crab'), raven = EN('Raven'); c2._def = 0;
            out.shatter = WA.bonusVs(SK('Shatter'), c2) + '/' + WA.bonusVs(SK('Shatter'), raven) + '/' + WA.bonusVs(SK('Consecrate'), EN('Restless Bones'));
            // Blood Offering: half the damage comes back as Mana
            const sib = A(3); sib.setMp(0); const off = new Game_Action(sib); off.setSkill(SK('Blood Offering').id);
            const bones = EN('Raven'); bones.clearResult(); off.executeHpDamage(bones, 20); out.offering = sib.mp;
            Math.random = rnd;
            // stances: Brace counters, Ward Off parries (melee only)
            const troop = $gameTroop.members()[0], dama = A(7);
            $gameParty.battleMembers().forEach(a => a.recoverAll()); troop.recoverAll();
            const hit = () => { const x = new Game_Action(troop); x.setSkill(SK('Strike').id); return x; };
            const evaOff = Game_Action.prototype.itemEva, hitOff = Game_Action.prototype.itemHit; Game_Action.prototype.itemEva = () => 0; Game_Action.prototype.itemHit = () => 1;
            dama.addState(ST('Braced')); BattleManager._action = hit(); const before = troop.hp;
            BattleManager.invokeAction(troop, dama);
            out.brace = (troop.hp < before) + '/' + dama.isStateAffected(ST('Braced'));
            sib.recoverAll(); sib.addState(ST('Warding')); BattleManager._action = hit();
            BattleManager.invokeAction(troop, sib); out.ward = (sib.hp === sib.mhp) + '/' + sib.isStateAffected(ST('Warding'));
            sib.addState(ST('Warding')); const shot = new Game_Action(troop); shot.setSkill(SK('Sling Stone').id);
            out.wardRanged = WA.isMelee(shot);
            Game_Action.prototype.itemEva = evaOff; Game_Action.prototype.itemHit = hitOff;
            // Cover: single attacks on the covered ally go to the coverer, until the coverer's next turn
            const thenmy = A(11), cover = new Game_Action(thenmy); cover.setSkill(SK('Cover').id);
            out.coverSelf = cover.testApply(thenmy); sib.clearResult(); cover.apply(sib);
            BattleManager._action = hit(); out.cover = BattleManager.applySubstitute(sib) === thenmy;
            thenmy.onCtbTurnStart(); out.coverEnds = BattleManager.applySubstitute(sib) === sib && !sib.isStateAffected(ST('Covered'));
            // Ward Off ends at the holder's next turn
            sib.onCtbTurnStart(); out.wardEnds = !sib.isStateAffected(ST('Warding'));
            // Throw Knife: off hand first, then the main hand; both come back after the battle
            const parl = A(8), main = parl.equipSlots().indexOf(1), offSlot = parl.offhandSlotId();
            parl._equips[main].setObject(WE('Copper Knife')); parl._equips[offSlot].setObject(WE('Obsidian Knife')); parl.refresh();
            const first = parl.throwableKnifeSlot(); WA.throwKnife(parl, first);
            const second = parl.throwableKnifeSlot(); WA.throwKnife(parl, second);
            out.throw = (first === offSlot) + '/' + (second === main) + '/' + parl.throwableKnifeSlot() + '/' + parl.canUse(SK('Throw Knife'));
            parl.onBattleEnd(); out.back = parl.equips()[main].name + ' + ' + parl.equips()[offSlot].name;
            // Off-Hand Flurry: costs no turn, then can't be used again until the next turn is over
            out.flurryCost = SK('Off-Hand Flurry').siTurnCost;
            parl.addState(ST('Following Up')); out.flurrySealed = parl.isSkillSealed(SK('Off-Hand Flurry').id);
            // Pitch Arrow uses up a Pine Pitch
            const pitch = $dataItems.find(i => i && i.name === 'Pine Pitch'); $gameParty.gainItem(pitch, 1); const n = $gameParty.numItems(pitch);
            parl.paySkillCost(SK('Pitch Arrow')); out.pitch = n - $gameParty.numItems(pitch);
            return out;
        });
        t.eq(r.sib, 'Quick Jab, Trip, Sling Stone', 'Sib starts with a priest-child\'s few moves');
        t.eq(r.kath, 'Quick Jab', 'Kathrout knows one');
        t.ok(r.dama, 'Dama starts with a spearwife\'s drill, Brace included');
        t.ok(r.thenmy, 'Thenmy starts with shield work and the pommel');
        t.ok(r.taught, 'the weapon master (and the tests) teach everything');
        t.eq(r.moves, 'jab thrust sweep metal brace | jab vital bludgeon sweep ward | chop bludgeon metal hook | slash chop bludgeon paddle | jab thrust vital slash metal knife | bludgeon club pound | bludgeon metal club', 'new weapon moves');
        t.eq(r.hook, 'true/false', 'Hook Down brings a flyer down');
        t.eq(r.pound, 'false/false/true', 'Ground Pound doesn\'t touch flyers');
        t.eq(r.haul, 'false/true', 'Haul In needs a netted target');
        t.eq(r.shatter, '0.5/0/0.75', 'Shatter +50% on shelled, Consecrate +75% on the dead');
        t.eq(r.offering, 10, 'Blood Offering: half the damage as Mana');
        t.eq(r.brace, 'true/false', 'Brace strikes back, then ends');
        t.eq(r.ward, 'true/false', 'Ward Off turns the blow aside, then ends');
        t.ok(!r.wardRanged, 'a sling stone isn\'t melee');
        t.ok(!r.coverSelf, 'you can\'t cover yourself');
        t.ok(r.cover, 'Cover takes the covered ally\'s hits');
        t.ok(r.coverEnds, 'until the coverer\'s next turn');
        t.ok(r.wardEnds, 'stances end at the holder\'s next turn');
        t.eq(r.throw, 'true/true/null/false', 'two knives, two throws: off hand first');
        t.eq(r.back, 'Copper Knife + Obsidian Knife', 'thrown knives come back after the battle');
        t.eq(r.flurryCost, 0, 'Off-Hand Flurry costs no turn');
        t.ok(r.flurrySealed, 'and can\'t be chained');
        t.eq(r.pitch, 1, 'Pitch Arrow uses a Pine Pitch');
    },
};
