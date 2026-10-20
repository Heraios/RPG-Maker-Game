// New clothing and armor: Seafarer, Islander and First Sailor sets; child- and adult-sized gear;
// the children's charms; cattle goods.

module.exports = {
    'sizes, Tou\'s regalia, and the new set bonuses': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), out = {};
            const wear = (a, names) => names.forEach(n => { const it = AR(n); a.forceChangeEquip(a.slotOfType(it.etypeId), it); });
            const strip = a => a.equips().forEach((e, i) => { if (e && DataManager.isArmor(e) && e.etypeId !== 20 && e.etypeId !== 7) a.forceChangeEquip(i, null); });
            // child-sized and adult-sized
            out.childSized = [2, 3, 4, 9, 10].every(id => A(id).canEquip(AR('Crew Tunic'))) && ![5, 6, 7, 8, 11].some(id => A(id).canEquip(AR('Crew Tunic')));
            out.adultSized = [5, 6, 7, 8, 11].every(id => A(id).canEquip(AR('Navigator\'s Robe'))) && ![2, 3, 4, 9, 10].some(id => A(id).canEquip(AR('Navigator\'s Robe')));
            out.anyone = [2, 3, 9, 10, 5, 11].every(id => A(id).canEquip(AR('Grown-Coral Cuirass')) && A(id).canEquip(AR('Linen Cuirass')));
            out.kidsCharms = A(2).canEquip(AR('Gourd Whistle')) && !A(5).canEquip(AR('Gourd Whistle'));
            // Tou starts in the diadem and robe; the rest is found in the palace
            const tou = A(9);
            out.touWears = tou.equips().filter(e => e && DataManager.isArmor(e)).map(e => e.name).filter(n => /Diadem|Robe|Mantle|Sandals/.test(n)).sort().join(',');
            const mp0 = tou.mmp; tou.forceChangeEquip(tou.slotOfType(3), null); out.royalMp = mp0 > tou.mmp;
            wear(tou, ['Queen\'s Feather Diadem']);
            // Slat armor: Cut and Pierce down, Crush and Fire up; pine cancels the fire
            const pada = A(5); strip(pada);
            wear(pada, ['Laurel Slat Cuirass', 'Carved Wooden Helm', 'Slat Bracers', 'Rod Greaves']);
            const rate = (a, e) => Math.round(a.elementRate(e) * 100);
            out.slat = [3, 4, 5, 10].map(e => rate(pada, e)).join(',');
            wear(pada, ['Pine Slat Cuirass']); out.pine = rate(pada, 10);
            wear(pada, ['Mahogany Slat Cuirass']); out.mahogany = rate(pada, 5);
            // Black bronze: less magic damage, but metal
            const dama = A(7); strip(dama);
            wear(dama, ['Black Bronze Helm', 'Black Bronze Cuirass', 'Black Bronze Bracers', 'Black Bronze Greaves']);
            out.blackBronze = Math.round(dama.mdr * 100) + '/' + SmokingIsle.Voltaic.isMetal(dama);
            // Sailor's Kit: two pieces resist Disoriented
            const parl = A(8); strip(parl);
            const dis = SmokingIsle.Ailments.stateByName('Disoriented');
            const d0 = parl.stateRate(dis); wear(parl, ['Linen Tunic', 'Sailor\'s Cap']); out.sailor = d0 > parl.stateRate(dis);
            // Sharkskin: one piece gives spikes, both make you immune to Bleed
            const yoon = A(2); strip(yoon);
            wear(yoon, ['Sharkskin Vest']); out.sharkOne = SmokingIsle.Outfits.sum(yoon, 'spikes');
            wear(yoon, ['Sharkskin Bracers']); out.sharkBleed = yoon.isStateResist(SmokingIsle.Ailments.stateByName('Bleed'));
            // Deerskin: ambush more often
            strip(yoon); wear(yoon, ['Deerskin Jerkin', 'Deerskin Armbands', 'Deerskin Leggings']);
            out.deer = $gameParty.members().includes(yoon) && $gameParty.hasRaisePreemptive();
            // Navigator's Raiment counts the Crescent Pectoral
            out.navSize = SmokingIsle.Outfits.sets['Navigator\'s Raiment'];
            out.sets = ['Sailor\'s Kit', 'Linen Armor', 'Court Dress', 'Charioteer\'s Gear', 'Palm-Fibre', 'Sharkskin', 'Deerskin', 'Slat Armor',
                        'Crew', 'Royal Regalia', 'Navigator\'s Raiment', 'Black Bronze', 'Grown Coral'].map(s => SmokingIsle.Outfits.sets[s]).join(',');
            return out;
        });
        t.ok(r.childSized, 'Crew clothing fits Yoon, Sib, Lasa, Tou and Falmi, and no adult');
        t.ok(r.adultSized, 'Navigator\'s Raiment fits the adults and no child');
        t.ok(r.anyone, 'grown coral and linen fit anyone');
        t.ok(r.kidsCharms, 'the children\'s charms are for children only');
        t.eq(r.touWears, 'Queen\'s Feather Diadem,Royal Tapa Robe', 'Tou starts in the diadem and robe');
        t.ok(r.royalMp, 'Royal Regalia (2): max MP +15%');
        t.eq(r.slat, '80,80,115,116', 'Slat Armor: 20% less Cut and Pierce, +15% Crush and Fire');
        t.eq(r.pine, 100, 'the pine cuirass cancels the Fire weakness');
        t.eq(r.mahogany, 100, 'the mahogany cuirass cancels the Crush weakness');
        t.eq(r.blackBronze, '75/true', 'Black Bronze: 25% less magic damage, but metal');
        t.ok(r.sailor, 'Sailor\'s Kit (2): resists Disoriented');
        t.eq(r.sharkOne, 0.1, 'Sharkskin (1): attackers take 10% back');
        t.ok(r.sharkBleed, 'Sharkskin (all): immune to Bleed');
        t.ok(r.deer, 'Deerskin (all): you ambush enemies more often');
        t.eq(r.navSize, 4, 'Navigator\'s Raiment counts the Crescent Pectoral as its fourth part');
        t.eq(r.sets, '4,3,4,3,3,2,3,4,4,4,4,4,3', 'every new set has the right number of parts');
    },

    'the children\'s charms, the coral whisper, and cattle goods': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), IT = n => $dataItems.find(i => i && i.name === n), out = {};
            const ST = n => SmokingIsle.Ailments.stateByName(n);
            const charm = (a, n, k = 0) => a.forceChangeEquip(a.equipSlots().map((e, i) => e === 5 ? i : -1).filter(i => i >= 0)[k], AR(n));
            const P = $gameParty; P.members().slice().forEach(m => P.removeActor(m.actorId()));
            P.addActor(2); P.addActor(5); P.addActor(3);
            const yoon = A(2), pada = A(5), sib = A(3), enemy = $gameTroop.members()[0];
            [yoon, pada, sib].forEach(a => { a.recoverAll(); a.onBattleStart(); });
            // Gourd Whistle: the first enemy attack on Yoon goes to the toughest adult
            charm(yoon, 'Gourd Whistle');
            const hit = new Game_Action(enemy); hit.setAttack(); hit.setTarget(0);
            BattleManager._action = hit;
            out.first = BattleManager.applySubstitute(yoon).name();
            out.second = BattleManager.applySubstitute(yoon).name();
            // Grandmother's Knot-Cord: the first ailment each battle is shrugged off
            charm(sib, 'Grandmother\'s Knot-Cord');
            sib.addState(ST('Bleed')); out.warded = !sib.isStateAffected(ST('Bleed'));
            sib.addState(ST('Bleed')); out.onlyOnce = sib.isStateAffected(ST('Bleed'));
            sib.removeState(ST('Bleed')); sib._siWearMessages = [];
            // Milk-Tooth Necklace: Wits +3
            const luk0 = yoon.luk; yoon.forceChangeEquip(yoon.slotOfType(9), AR('Milk-Tooth Necklace')); out.milkTooth = yoon.luk - luk0;
            // Grown coral whispers; the Scoria Pupil quiets it
            const real = Math.random; Math.random = () => 0;
            pada.forceChangeEquip(pada.slotOfType(3), AR('Grown-Coral Helm'));
            pada.removeState(ST('Despair')); pada.onTurnEnd(); out.whispers = pada.isStateAffected(ST('Despair'));
            pada.removeState(ST('Despair')); charm(pada, 'Scoria Pupil'); pada.onTurnEnd(); out.quiet = !pada.isStateAffected(ST('Despair'));
            Math.random = real;
            // Horsehair Plume: Brave at battle start
            charm(pada, 'Horsehair Plume', 1); pada.onBattleStart(); out.brave = pada.isStateAffected(ST('Brave'));
            // cattle goods
            out.goods = ['Cowhide', 'Horsehair', 'Ox Horn', 'Salt Beef', 'Cow\'s Milk', 'Seafarer Cheese'].every(n => !!IT(n));
            out.meal = /<Meal>/.test(IT('Salt Beef').note);
            return out;
        });
        t.eq(r.first, 'Pada', 'Gourd Whistle: the first enemy attack on the child is taken by an adult');
        t.eq(r.second, 'Yoon', 'Gourd Whistle: only once a battle');
        t.ok(r.warded, 'Knot-Cord: the first ailment is shrugged off');
        t.ok(r.onlyOnce, 'Knot-Cord: only the first one');
        t.eq(r.milkTooth, 3, 'Milk-Tooth Necklace: Wits +3');
        t.ok(r.whispers, 'grown coral whispers Despair');
        t.ok(r.quiet, 'the Scoria Pupil quiets grown coral too');
        t.ok(r.brave, 'Horsehair Plume: Brave at battle start');
        t.ok(r.goods, 'cowhide, horsehair, ox horn, salt beef, milk and cheese exist');
        t.ok(r.meal, 'Salt Beef is a meal');
    }
};
