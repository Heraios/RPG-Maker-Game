// Body-part equipment slots (SI_Equipment).

module.exports = {
    'slots, paired hands, off-hand weapons and starting gear': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const AR = n => $dataArmors.find(a => a && a.name === n);
            const sib = A(3), th = A(11), juda = A(6);
            const names = a => a.equipSlots().map((e, i) => a.equipSlotName(i));
            const at = (a, name) => { const e = a.equips()[names(a).indexOf(name)]; return e ? e.name : ''; };
            const out = { sibNames: names(sib).join(','), thNames: names(th).slice(-2).join(',') };
            out.sibRing = at(sib, 'Left Hand'); out.sibTattoos = sib.equips().filter(e => e && e.etypeId === 7).length;
            out.thCuirass = at(th, 'Cuirass'); out.thCodex = at(th, 'Codex');
            out.judaTattoos = juda.equips().filter(e => e && e.etypeId === 7).length;
            const off = sib.slotOfType(2);
            $gameParty.gainItem($dataWeapons[6], 1); $gameParty.gainItem($dataWeapons[93], 1);
            sib.changeEquip(off, $dataWeapons[6]); out.knifeOffhand = (sib.equips()[off] || {}).name;
            sib.changeEquip(off, $dataWeapons[93]); out.spearRejected = (sib.equips()[off] || {}).name;
            sib.refresh(); out.knifeKept = (sib.equips()[off] || {}).name;
            out.mainOnly = sib.weapons().length;
            out.noStats = sib.atk === (() => { sib._equips[off].setObject(null); const a = sib.atk; sib._equips[off].setObject($dataWeapons[6]); return a; })();
            out.offMoves = sib.availableMoves().includes('offhand');
            // Two-handed: a spear sends the shield back to the bag and locks the off hand.
            const yoon = A(2), yoff = yoon.slotOfType(2), shields = $gameParty.numItems(AR('Wicker Buckler'));
            $gameParty.gainItem($dataWeapons[93], 1);
            yoon.changeEquip(yoon.slotOfType(1), $dataWeapons[93]);
            out.twoHanded = !yoon.equips()[yoff] && $gameParty.numItems(AR('Wicker Buckler')) === shields + 1 && !yoon.isEquipChangeOk(yoff);
            $gameParty.gainItem($dataWeapons[132], 1); $gameParty.gainItem($dataWeapons[172], 1); $gameParty.gainItem(AR('Wicker Buckler'), 1);
            const falmi = A(10);   // a club user who can carry a shield
            falmi.changeEquip(falmi.slotOfType(1), $dataWeapons[172]); falmi.changeEquip(falmi.slotOfType(2), AR('Wicker Buckler'));
            out.clubKeepsShield = (falmi.equips()[falmi.slotOfType(1)] || {}).name + '+' + (falmi.equips()[falmi.slotOfType(2)] || {}).name;
            $dataWeapons[132].siTwoHanded = false; falmi.changeEquip(falmi.slotOfType(1), $dataWeapons[132]);
            out.oneHandedAxe = falmi.isEquipChangeOk(falmi.slotOfType(2)) && !!falmi.equips()[falmi.slotOfType(2)]; $dataWeapons[132].siTwoHanded = true;
            out.ghost = A(1).equipSlots().length;
            out.patience = names(A(12)).join(',') + ':' + (A(12).equips()[0] || {}).name;
            $gameParty.gainItem(AR('Hide Gloves'), 1);
            sib.changeEquipById(13, AR('Hide Gloves').id); out.gloves = at(sib, 'Right Hand') + '/' + at(sib, 'Left Hand');
            return out;
        });
        t.eq(r.sibNames, 'Head,Neck,Shoulders,Body,Cuirass,Arms,Left Hand,Right Hand,Legs,Greaves,Feet,Melee,Ranged,Offhand,' +
            'Charm 1,Charm 2,Charm 3,Battery,Codex,Lower L Arm,Lower R Arm,Upper L Arm,Upper R Arm', 'Sib\'s slot list');
        t.eq(r.thNames, 'Charm 3,Codex', 'Theenmy ends with a codex slot and no tattoos');
        t.eq(r.sibRing, 'Silver Ring', 'the ring starts in the Left Hand');
        t.eq(r.sibTattoos, 2, 'Sib starts with two tattoos');
        t.eq(r.judaTattoos, 5, 'Juda starts with five tattoos');
        t.eq(r.thCuirass, 'Bronze Cuirass', 'bronze cuirass sits in the Cuirass slot');
        t.eq(r.thCodex, 'Codex of Mending', "Theenmy's codex");
        t.eq(r.knifeOffhand, 'Obsidian Knife', 'a knife fits the off hand');
        t.eq(r.spearRejected, 'Obsidian Knife', 'a spear does not');
        t.eq(r.knifeKept, 'Obsidian Knife', 'refreshing keeps the off-hand knife');
        t.eq(r.mainOnly, 1, 'weapons() is the main hand only');
        t.ok(r.noStats, 'an off-hand knife adds no stats');
        t.ok(r.offMoves, "an off-hand knife provides the 'offhand' move");
        t.ok(r.twoHanded, 'a two-handed spear returns the shield and locks the slot');
        t.eq(r.clubKeepsShield, 'Ebony Club+Wicker Buckler', 'a one-handed club keeps the shield');
        t.ok(r.oneHandedAxe, 'an axe marked one-handed leaves the off hand free');
        t.eq(r.ghost, 0, 'the Ghost has no equipment slots');
        t.eq(r.patience, 'Collar,Pack,Booties,Bell:Woven Collar', 'Patience has dog gear slots only');
        t.eq(r.gloves, 'Hide Gloves/Silver Ring', '"Change Equipment" fills the empty hand');
    },

    'who can use swords and staves; Yoon learns swords from Theenmy': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), W = n => $dataWeapons.find(w => w && w.name === n);
            const who = n => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(id => A(id).canEquip(W(n))).map(id => A(id).name()).join(',');
            const out = { swords: who('Bronze Leaf Sword'), staves: who('Heather Staff') };
            $gameSwitches.setValue(4, true); out.trained = A(2).canEquip(W('Bronze Leaf Sword')); $gameSwitches.setValue(4, false);
            return out;
        });
        t.eq(r.swords, 'Parl,Falmi,Thenmy', 'swords: Parl, Falmi and Theenmy');
        t.eq(r.staves, 'Yoon,Sib,Juda,Tou', 'staves: Yoon, Sib, Juda and Tou only');
        t.ok(r.trained, 'Yoon can use swords once switch 4 (Theenmy quest) is on');
    }
};
