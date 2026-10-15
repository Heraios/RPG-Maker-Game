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
            out.dualMoves = sib.weapons().length;
            $gameParty.gainItem(AR('Hide Gloves'), 1);
            sib.changeEquipById(13, AR('Hide Gloves').id); out.gloves = at(sib, 'Right Hand') + '/' + at(sib, 'Left Hand');
            return out;
        });
        t.eq(r.sibNames, 'Head,Neck,Shoulders,Body,Cuirass,Arms,Left Hand,Right Hand,Legs,Greaves,Feet,Melee,Ranged,Offhand,' +
            'Accessory 1,Accessory 2,Accessory 3,Tattoo 1,Tattoo 2,Tattoo 3,Tattoo 4,Tattoo 5,Tattoo 6,Tattoo 7,Tattoo 8', 'Sib\'s slot list');
        t.eq(r.thNames, 'Accessory 3,Codex', 'Theenmy ends with a codex slot and no tattoos');
        t.eq(r.sibRing, 'Ring', 'the ring starts in the Left Hand');
        t.eq(r.sibTattoos, 2, 'Sib starts with two tattoos');
        t.eq(r.judaTattoos, 5, 'Juda starts with five tattoos');
        t.eq(r.thCuirass, 'Bronze Cuirass', 'bronze cuirass sits in the Cuirass slot');
        t.eq(r.thCodex, 'Codex of Mending', "Theenmy's codex");
        t.eq(r.knifeOffhand, 'Flint Knife', 'a knife fits the off hand');
        t.eq(r.spearRejected, 'Flint Knife', 'a spear does not');
        t.eq(r.knifeKept, 'Flint Knife', 'refreshing keeps the off-hand knife');
        t.eq(r.dualMoves, 2, 'main and off-hand weapons both count');
        t.eq(r.gloves, 'Hide Gloves/Ring', '"Change Equipment" fills the empty hand');
    }
};
