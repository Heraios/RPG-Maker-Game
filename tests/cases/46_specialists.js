// Aday the mechanist and Kathrout the scholar: who they are, what they won't eat or wear, Aday's item
// power, item saving, Toss, Tinker and Mend Gear; Kathrout's two codex slots (and no tattoos) and the spirits she can't see.

module.exports = {
    'Aday and Kathrout': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, IT = n => $dataItems.find(i => i && i.name === n), AR = n => $dataArmors.find(a => a && a.name === n);
            const WE = n => $dataWeapons.find(w => w && w.name === n), SK = n => $dataSkills.find(s => s && s.name === n);
            const ST = n => SmokingIsle.Ailments.stateByName(n);
            const aday = $gameActors.actor(13), kath = $gameActors.actor(14), sib = $gameActors.actor(3);
            out.who = [aday.name(), aday.currentClass().name, kath.name(), kath.currentClass().name, aday.faceName(), kath.faceName()].join('/');
            out.child = !!/<Child>/.test(aday.actor().note) && !/<Child>/.test(kath.actor().note);
            out.naming = [13, 14].every(id => SmokingIsle.Naming.onJoin.indexOf(id) >= 0);
            out.start = [aday.weapons()[0] && aday.weapons()[0].name, kath.weapons()[0] && kath.weapons()[0].name,
                kath.armors().some(a => a.name === 'Codex of Embers')].join('/');
            // taboos: Aday eats birds but never eggs; Kathrout no shells, no wine, no grave goods
            out.aday = [!!aday.tabooRefusal(IT('Seabird Eggs')), !aday.tabooRefusal(IT('Roast Chicken')), !!aday.tabooRefusal(IT('Raw Meat'))].join();
            out.kath = [!!kath.tabooRefusal(IT('Seabird Eggs')), !!kath.tabooRefusal(IT('Islander Wine')), !kath.tabooRefusal(IT('Barley Bread'))].join();
            out.grave = !kath.canEquip(AR('Coral Eye Fragment')) && !kath.canEquip(AR('Crescent Pectoral'));
            // item power: healing and damage from items work half again better
            out.pha = Math.round(aday.pha * 100) + '/' + Math.round(sib.pha * 100);
            const rnd = Math.random; Math.random = () => 0.5;
            const foe = $gameTroop.members()[0], pot = $dataItems.find(i => i && i.damage.type === 1 && i.damage.formula !== '0');
            const dmg = who => { const a = new Game_Action(who); a.setItemObject(pot); return a.makeDamageValue(foe, false); };
            out.itemDamage = (dmg(aday) / dmg(sib)).toFixed(2);
            // item saver: with a lucky roll, the item isn't used up
            $gameParty.gainItem(pot, 2); const had = $gameParty.numItems(pot);
            Math.random = () => 0; aday.consumeItem(pot); out.saved = $gameParty.numItems(pot) === had;
            Math.random = () => 0.99; aday.consumeItem(pot); out.used = $gameParty.numItems(pot) === had - 1;
            Math.random = rnd;
            // Toss: the next one-person item reaches the whole party, then the state ends
            $gameParty._actors = [2, 3, 13, 14]; $gameParty.members().forEach(a => a.recoverAll());
            const bread = IT('Barley Bread'), toss = new Game_Action(aday); toss.setSkill(SK('Toss').id); aday.addState(ST('Ready to Toss'));
            const use = new Game_Action(aday); use.setItemObject($dataItems.find(i => i && i.scope === 7 && i.occasion !== 3) || bread); use.setTarget(0);
            out.toss = use.makeTargets().length + '/' + aday.isStateAffected(ST('Ready to Toss'));
            const use2 = new Game_Action(aday); use2.setItemObject(use.item()); use2.setTarget(0); out.noToss = use2.makeTargets().length;
            // Tinker: +1 charge for anyone with a pile
            sib.gainCharge(-99); const before = sib.charge(), tink = new Game_Action(aday); tink.setSkill(SK('Tinker').id);
            sib.clearResult(); tink.apply(sib); out.tinker = sib.charge() - before;
            // Mend Gear: a bent copper knife is straightened, no smith needed
            const slot = sib.equipSlots().indexOf(1); sib._equips[slot].setObject(WE('Bent Copper Knife'));
            const mend = new Game_Action(aday); mend.setSkill(SK('Mend Gear').id); out.mendable = mend.testApply(sib);
            sib.clearResult(); mend.apply(sib); out.mended = sib.weapons()[0] && sib.weapons()[0].name;
            // a Gold-Plated Knife bent into copper is mended back into gold, not plain copper
            sib.changeEquip(slot, null); $gameParty.gainItem(WE('Gold-Plated Knife'), 1); sib.changeEquip(slot, WE('Gold-Plated Knife'));
            sib.rollWear(slot, true); out.bentGold = sib.weapons()[0] && sib.weapons()[0].name;
            sib.clearResult(); mend.apply(sib); out.gold = sib.weapons()[0] && sib.weapons()[0].name;
            // Kathrout: two codex slots, uniquely, and no tattoos at all (glyphs in the bag teach her nothing)
            const ahi = AR('Glyph: Ahi'), ahiSkill = ahi.traits.find(x => x.code === 43).dataId;
            $gameParty.gainItem(ahi, 1);
            const codexType = SmokingIsle.Glyphs.codexType, tattooType = SmokingIsle.Glyphs.tattooType;
            const count = (a, t) => a.equipSlots().filter(e => e === t).length;
            out.codex = count(kath, codexType) + '/' + count(aday, codexType) + '/' + count(kath, tattooType) + '/' + kath.isLearnedSkill(ahiSkill) + '/' + kath.canEquip(ahi);
            // she can't see spirits unless someone points them out
            const EN = n => new Game_Enemy($dataEnemies.find(e => e && e.name === n).id, 0, 0);
            const bones = EN('Restless Bones'), raven = EN('Raven'), spell = new Game_Action(kath); spell.setSkill(ahiSkill);
            const hit = target => spell.itemHit(target);
            out.unseen = (hit(bones) / hit(raven)).toFixed(2);
            bones.addState(ST('Pointed Out')); out.pointed = (hit(bones) / hit(raven)).toFixed(2);
            return out;
        });
        t.eq(r.who, 'Aday/Mechanist/Kathrout/Scholar/Fa_Actor3/Fa_Actor3', 'the two new party members');
        t.ok(r.child, 'Aday is a child, Kathrout an adult');
        t.ok(r.naming, 'both are named when they join');
        t.eq(r.start, 'Bronze Knife/Heather Staff/true', 'Aday starts with his bronze knife; Kathrout with a staff and the Codex of Embers');
        t.eq(r.aday, 'true,true,true', 'Aday: never eggs, yes to birds, no to land meat');
        t.eq(r.kath, 'true,true,true', 'Kathrout: no eggs, no wine, bread is fine');
        t.ok(r.grave, 'Kathrout won\'t wear grave goods');
        t.eq(r.pha, '150/100', 'items heal half again more in Aday\'s hands');
        t.eq(r.itemDamage, '1.50', 'and hit half again harder');
        t.ok(r.saved, 'a lucky roll saves the item');
        t.ok(r.used, 'otherwise it is used up');
        t.eq(r.toss, '4/false', 'Toss: the next item reaches all four, and the readiness ends');
        t.eq(r.noToss, 1, 'the item after that is back to one person');
        t.eq(r.tinker, 1, 'Tinker restores a charge');
        t.ok(r.mendable, 'Mend Gear can fix a bent copper knife');
        t.eq(r.mended, 'Copper Knife', 'and does');
        t.eq(r.bentGold + ' -> ' + r.gold, 'Bent Copper Knife -> Gold-Plated Knife', 'a mended weapon goes back to what it wore down from');
        t.eq(r.codex, '2/1/0/false/false', 'Kathrout has two codex slots (Aday one) and can\'t use tattoos');
        t.eq(r.unseen, '0.50', 'her spells land half as often on spirits');
        t.eq(r.pointed, '1.00', 'unless the spirit is Pointed Out');
    },
};
