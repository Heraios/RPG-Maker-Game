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
            $gameParty.gainItem($dataWeapons[1], 1); $gameParty.gainItem($dataWeapons[2], 1);
            sib.changeEquip(off, $dataWeapons[1]); out.knifeOffhand = (sib.equips()[off] || {}).name;
            sib.changeEquip(off, $dataWeapons[2]); out.spearRejected = (sib.equips()[off] || {}).name;
            sib.refresh(); out.knifeKept = (sib.equips()[off] || {}).name;
            out.mainOnly = sib.weapons().length;
            out.noStats = sib.atk === (() => { sib._equips[off].setObject(null); const a = sib.atk; sib._equips[off].setObject($dataWeapons[1]); return a; })();
            out.offMoves = sib.availableMoves().includes('offhand');
            // Two-handed: a spear sends the shield back to the bag and locks the off hand.
            const yoon = A(2), yoff = yoon.slotOfType(2), shields = $gameParty.numItems(AR('Shield'));
            $gameParty.gainItem($dataWeapons[2], 1);
            yoon.changeEquip(yoon.slotOfType(1), $dataWeapons[2]);
            out.twoHanded = !yoon.equips()[yoff] && $gameParty.numItems(AR('Shield')) === shields + 1 && !yoon.isEquipChangeOk(yoff);
            $gameParty.gainItem($dataWeapons[4], 1); $gameParty.gainItem(AR('Shield'), 1);
            const falmi = A(10);   // a club user who can carry a shield
            falmi.changeEquip(falmi.slotOfType(1), $dataWeapons[5]); falmi.changeEquip(falmi.slotOfType(2), AR('Shield'));
            out.clubKeepsShield = (falmi.equips()[falmi.slotOfType(1)] || {}).name + '+' + (falmi.equips()[falmi.slotOfType(2)] || {}).name;
            $dataWeapons[4].siTwoHanded = false; falmi.changeEquip(falmi.slotOfType(1), $dataWeapons[4]);
            out.oneHandedAxe = falmi.isEquipChangeOk(falmi.slotOfType(2)) && !!falmi.equips()[falmi.slotOfType(2)]; $dataWeapons[4].siTwoHanded = true;
            out.ghost = A(1).equipSlots().length;
            out.patience = names(A(12)).join(',') + ':' + (A(12).equips()[0] || {}).name;
            $gameParty.gainItem(AR('Hide Gloves'), 1);
            sib.changeEquipById(13, AR('Hide Gloves').id); out.gloves = at(sib, 'Right Hand') + '/' + at(sib, 'Left Hand');
            return out;
        });
        t.eq(r.sibNames, 'Head,Neck,Shoulders,Body,Cuirass,Arms,Left Hand,Right Hand,Legs,Greaves,Feet,Melee,Ranged,Offhand,' +
            'Charm 1,Charm 2,Charm 3,Tattoo 1,Tattoo 2,Tattoo 3,Tattoo 4,Tattoo 5,Tattoo 6,Tattoo 7,Tattoo 8', 'Sib\'s slot list');
        t.eq(r.thNames, 'Charm 3,Codex', 'Theenmy ends with a codex slot and no tattoos');
        t.eq(r.sibRing, 'Ring', 'the ring starts in the Left Hand');
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
        t.eq(r.clubKeepsShield, 'Hardwood Club+Shield', 'a one-handed club keeps the shield');
        t.ok(r.oneHandedAxe, 'an axe marked one-handed leaves the off hand free');
        t.eq(r.ghost, 0, 'the Ghost has no equipment slots');
        t.eq(r.patience, 'Collar:Woven Collar', 'Patience has only a collar');
        t.eq(r.gloves, 'Hide Gloves/Ring', '"Change Equipment" fills the empty hand');
    }
};
