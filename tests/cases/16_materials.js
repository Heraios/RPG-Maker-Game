// Grog and Tipsy, elemental materials, shattering ceramic, fire-hardened wood, Resin.

module.exports = {
    'All-Seafarer Grog heals and makes you Tipsy; a second drink disorients': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n), ST = n => $dataStates.find(s => s && s.name === n).id, out = {};
            const drink = who => { const x = new Game_Action(A(3)); x.setItem(IT('All-Seafarer Grog').id); who.clearResult(); x.apply(who); };
            const yoon = A(5); yoon.recoverAll(); yoon.setHp(1); const hit0 = yoon.hit;   // Pada: children are never given grog
            drink(yoon); out.healed = yoon.hp - 1; out.tipsy = yoon.isStateAffected(ST('Tipsy')); out.hitLoss = +(hit0 - yoon.hit).toFixed(2);
            yoon.clearResult(); yoon.addState(ST('Panicked')); out.brave = !yoon.isStateAffected(ST('Panicked'));
            drink(yoon); out.second = (yoon.isStateAffected(ST('Disoriented')) ? 'Disoriented' : '') + (yoon.isStateAffected(ST('Tipsy')) ? '+Tipsy' : '');
            out.marinesLike = $dataEnemies[13].siTalk.likes.includes(IT('All-Seafarer Grog').id);
            out.noPotion = !IT('Potion');
            return out;
        });
        t.eq(r.healed, 30, 'grog heals 30');
        t.ok(r.tipsy, 'and leaves you Tipsy');
        t.eq(r.hitLoss, 0.1, 'Tipsy: hit -10%');
        t.ok(r.brave, 'liquid courage: Tipsy resists Panicked');
        t.eq(r.second, 'Disoriented', 'a second drink while Tipsy turns it into Disoriented');
        t.ok(r.marinesLike, 'All-Seafarer Marines like being offered grog');
        t.ok(r.noPotion, 'the Potion is gone');
    },

    'elemental materials boost their spells; ceramic shatters on the breaking swing': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), S = n => $dataSkills.find(s => s && s.name === n), W = n => $dataWeapons.find(w => w && w.name === n), out = {};
            const sib = A(6), e = $gameTroop.members()[0];   sib.addParam(4, 300);   // Juda: a priest who can hold clubs; big numbers so rounding doesn't skew ratios
            const avg = (name, weapon) => { sib.forceChangeEquip(sib.slotOfType(1), W(weapon)); let s = 0; for (let i = 0; i < 400; i++) { const x = new Game_Action(sib); x.setSkill(S(name).id); s += x.makeDamageValue(e, false); } return s / 400; };
            out.fire = avg('Ahi', 'Obsidian Knife') / avg('Ahi', 'Chalcedony Knife');
            out.water = avg('Rari', 'Coral-Studded Club') / avg('Rari', 'Chalcedony Knife');
            out.earth = avg('Keri', 'Ceramic Mace') / avg('Keri', 'Chalcedony Knife');
            out.fireNotWater = avg('Rari', 'Obsidian Knife') / avg('Rari', 'Chalcedony Knife');
            // ceramic: the swing that breaks it hits 50% harder
            const pada = A(5), slot = pada.slotOfType(1);
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.5; try { return f(); } finally { Math.random = rnd; } };
            const smash = worn => { pada.forceChangeEquip(slot, W('Ceramic Mace')); pada._siPendingWear = { slotId: slot, worn };
                e.setHp(e.mhp); e.clearResult(); fixed(() => { const x = new Game_Action(pada); x.setSkill(S('Overhead Smash').id); x.apply(e); });
                pada._siPendingWear = null; return e.mhp - e.hp; };
            out.shatter = smash(true) / smash(false);
            out.coralWorn = $dataWeapons[W('Coral-Studded Club').siDegradesTo].name;
            out.ceramicBreaks = W('Ceramic Mace').siDegradesTo === 0 && W('Ceramic Mace').siWearChance === 10;
            return out;
        });
        t.between(r.fire, 1.08, 1.12, 'obsidian: fire spells +10% (x' + r.fire.toFixed(2) + ')');
        t.between(r.water, 1.08, 1.12, 'coral: water spells +10% (x' + r.water.toFixed(2) + ')');
        t.between(r.earth, 1.08, 1.12, 'ceramic: earth spells +10% (x' + r.earth.toFixed(2) + ')');
        t.between(r.fireNotWater, 0.97, 1.03, 'obsidian does nothing for water spells');
        t.between(r.shatter, 1.45, 1.55, 'the shattering swing hits 50% harder (x' + r.shatter.toFixed(2) + ')');
        t.eq(r.coralWorn, 'Ebony Club', 'a Coral-Studded Club wears back into an Ebony Club');
        t.ok(r.ceramicBreaks, 'the Ceramic Mace wears fast (10%) and breaks outright');
    },

    'raw wood wears, fire-hardened wood lasts and resists fire; Dragonheart starts in Resin': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), W = n => $dataWeapons.find(w => w && w.name === n), out = {};
            out.raw = ['Ebony Club', 'Heather Staff', 'Rain-Tree Staff', 'Wooden Spear', 'Juniper Club'].map(n => W(n).siWearChance).join(',');
            out.hardened = ['Fire-Hardened Ebony Club', 'Fire-Hardened Heather Staff', 'Fire-Hardened Rain-Tree Staff', 'Fire-Hardened Spear'].every(n => W(n).siDegradesTo < 0);
            const pada = A(5); pada.forceChangeEquip(pada.slotOfType(1), W('Fire-Hardened Spear')); out.fireRate = pada.elementRate(10);
            pada.forceChangeEquip(pada.slotOfType(1), W('Wooden Spear')); out.rawRate = pada.elementRate(10);
            const th = A(11); th.forceChangeEquip(th.slotOfType(1), W('Dragonheart Greatsword')); th.clearStates(); th.onBattleStart();
            out.resin = th.isStateAffected($dataStates.find(s => s && s.name === 'Resin').id); out.dhFire = th.elementRate(10);
            th.clearStates(); th.forceChangeEquip(th.slotOfType(1), W('Cracked Dragonheart Greatsword')); th.onBattleStart();
            out.crackedResin = th.isStateAffected($dataStates.find(s => s && s.name === 'Resin').id);
            // stone and jasper spears
            out.jasperWho = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(id => A(id).canEquip(W('Jasper Spear'))).map(id => A(id).name()).join(',');
            const sib = A(3); sib.forceChangeEquip(sib.slotOfType(1), W('Jasper Spear')); out.jasperLocks = !sib.isEquipChangeOk(sib.slotOfType(2));
            out.spears = ['Chalcedony Spear', 'Andesite Spear', 'Jasper Spear'].map(n => W(n).siWearChance + '>' + $dataWeapons[W(n).siDegradesTo].name).join('; ');
            return out;
        });
        t.eq(r.raw, '2,2,2,2,2', 'raw wood wears slowly (2%)');
        t.ok(r.hardened, 'fire-hardened wood never wears');
        t.eq(r.fireRate, 0.9, 'fire-hardened wood: 10% less Fire damage');
        t.eq(r.rawRate, 1, 'raw wood gives no fire resistance');
        t.ok(r.resin, 'the Dragonheart Greatsword starts each battle in Resin');
        t.eq(r.dhFire, 0.9, 'and resists Fire');
        t.ok(!r.crackedResin, 'the cracked one has lost its resin shell');
        t.eq(r.jasperWho, 'Yoon,Sib,Juda', 'only priests can hold the Jasper Spear');
        t.ok(r.jasperLocks, 'the Jasper Spear is two-handed');
        t.eq(r.spears, '2>Chipped Chalcedony Spear; 3>Chipped Andesite Spear; 2>Chipped Jasper Spear', 'stone spears wear into chipped tiers');
    }
};
