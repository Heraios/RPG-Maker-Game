// Tattoo and codex slots (SI_Glyphs).

module.exports = {
    'tattoo and codex slots grant spells; tattoos are permanent': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const AR = n => $dataArmors.find(a => a && a.name === n);
            const sib = A(3), yoon = A(2), th = A(11), tou = A(9), ghost = A(1);
            // Battle Test equips from its own setup screen; use each actor's database equipment.
            [sib, yoon, th, tou, ghost].forEach(a => a.initEquips($dataActors[a.actorId()].equips));
            const tattooSlots = a => a.equipSlots().filter(e => e === 7).length;
            const codexSlots = a => a.equipSlots().filter(e => e === 8).length;
            const spells = a => a.skills().filter(s => s.id >= 56 && s.id <= 85).map(s => s.name);   // the regular spell families
            const out = {
                sibTattoos: tattooSlots(sib), sibCodex: codexSlots(sib), thTattoos: tattooSlots(th), thCodex: codexSlots(th),
                touSlots: tattooSlots(tou) + codexSlots(tou), sibSpells: spells(sib), thSpells: spells(th),
                yoonSpells: spells(yoon), ghostSpells: spells(ghost), sibLearnedAhi: sib.isLearnedSkill(56)
            };
            const slot = i => sib.equipSlots().indexOf(7) + i;
            out.occupiedLocked = !sib.isEquipChangeOk(slot(0));
            out.emptyOpen = sib.isEquipChangeOk(slot(2));
            $gameParty.gainItem(AR('Glyph: Hagu'), 1);
            sib.changeEquip(slot(2), AR('Glyph: Hagu'));
            out.newGlyph = sib.skills().some(s => s.name === 'Hagu');
            sib.optimizeEquipments(); sib.clearEquipments();
            out.keptAfterClear = sib.equips().filter(e => e && e.etypeId === 7).length;
            $gameSwitches.setValue(2, true);
            out.removableWithSwitch = sib.isEquipChangeOk(slot(0));
            const hagu = AR('Glyph: Hagu'), before = $gameParty.numItems(hagu);
            sib.changeEquip(slot(2), null);
            out.destroyed = !sib.equips()[slot(2)] && $gameParty.numItems(hagu) === before;
            $gameSwitches.setValue(2, false);
            return out;
        });
        t.eq(r.sibTattoos, 8, 'Sib has 8 tattoo slots');
        t.eq(r.sibCodex, 0, 'Sib has no codex slot');
        t.eq(r.thTattoos, 0, 'Theenmy has no tattoo slots');
        t.eq(r.thCodex, 1, 'Theenmy has a codex slot');
        t.eq(r.touSlots, 0, 'Tou (innate caster) has neither');
        t.ok(r.sibSpells.includes('Mahu') && r.sibSpells.includes('Ahi'), "Sib's starting tattoos grant Mahu and Ahi: " + r.sibSpells);
        t.eq(r.sibLearnedAhi, false, 'Sib knows Ahi from the tattoo, not by learning it');
        t.ok(r.thSpells.includes('Mahu') && r.thSpells.includes('Ara'), "Theenmy's Codex of Mending grants its spells: " + r.thSpells);
        t.eq(r.yoonSpells.length, 0, "human Yoon's new body starts with no glyphs");
        t.eq(r.ghostSpells.length, 0, 'the Ghost has no regular spells');
        t.ok(r.occupiedLocked, 'an occupied tattoo slot cannot be changed');
        t.ok(r.emptyOpen, 'an empty tattoo slot can be filled');
        t.ok(r.newGlyph, 'a new tattoo grants its spell');
        t.eq(r.keptAfterClear, 3, 'Optimize and Clear never remove tattoos');
        t.ok(r.removableWithSwitch, 'tattoos become removable once the late-game switch is on');
        t.ok(r.destroyed, 'a removed tattoo is destroyed, not returned to the bag');
    }
};
