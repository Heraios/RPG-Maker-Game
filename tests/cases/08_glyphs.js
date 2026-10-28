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
            const spells = a => a.skills().filter(s => s.id >= 410 && s.id <= 567).map(s => s.name);   // the Magic section
            const out = {
                sibTattoos: tattooSlots(sib), sibCodex: codexSlots(sib), thTattoos: tattooSlots(th), thCodex: codexSlots(th),
                touSlots: tattooSlots(tou) + codexSlots(tou), sibSpells: spells(sib), thSpells: spells(th),
                yoonSpells: spells(yoon), ghostSpells: spells(ghost), sibLearnedAhi: sib.isLearnedSkill(410)
            };
            const slot = i => sib.equipSlots().indexOf(7) + i;
            out.occupiedLocked = !sib.isEquipChangeOk(slot(0));
            out.emptyOpen = sib.isEquipChangeOk(slot(3));
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
        t.eq(r.sibTattoos, 4, 'Sib has 4 tattoo slots (arms)');
        t.eq(r.sibCodex, 1, 'Sib reads, so has a codex slot');
        t.eq(r.thTattoos, 0, 'Thenmy has no tattoo slots');
        t.eq(r.thCodex, 1, 'Thenmy has a codex slot');
        t.eq(r.touSlots, 1, 'Tou (innate caster) has no tattoos, but reads: a codex slot');
        t.ok(r.sibSpells.includes('Mahu') && r.sibSpells.includes('Ahi'), "Sib's starting tattoos grant Mahu and Ahi: " + r.sibSpells);
        t.eq(r.sibLearnedAhi, false, 'Sib knows Ahi from the tattoo, not by learning it');
        t.ok(r.thSpells.includes('Mahu') && r.thSpells.includes('Vero'), "Thenmy's Codex of the Moon grants its spells: " + r.thSpells);
        t.eq(r.yoonSpells.length, 0, "human Yoon's new body starts with no glyphs");
        t.eq(r.ghostSpells.length, 0, 'the Ghost has no regular spells');
        t.ok(r.occupiedLocked, 'an occupied tattoo slot cannot be changed');
        t.ok(r.emptyOpen, 'an empty tattoo slot can be filled');
        t.ok(r.newGlyph, 'a new tattoo grants its spell');
        t.eq(r.keptAfterClear, 3, 'Optimize and Clear never remove tattoos');
        t.ok(r.removableWithSwitch, 'tattoos become removable once the late-game switch is on');
        t.ok(r.destroyed, 'a removed tattoo is destroyed, not returned to the bag');
    },
    'tattoo slots are body positions; Yoon\'s ??? glyph; growth': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), out = {};
            [2, 3, 5, 6, 7, 8].forEach(id => A(id).initEquips($dataActors[id].equips));
            const names = a => a.equipSlots().map((e, i) => i).filter(i => a.isTattooSlot(i)).map(i => a.equipSlotName(i));
            out.counts = [2, 3, 5, 6, 7, 8].map(id => A(id).tattooSlotCount()).join(',');
            out.yoon = names(A(2)).join(', '); out.juda = names(A(6)).join(', ');
            const yoon = A(2), faceSlot = yoon.equipSlots().map((e, i) => i).filter(i => yoon.isTattooSlot(i)).find(i => yoon.equipSlotName(i) === 'Face');
            out.faceGlyph = (yoon.equips()[faceSlot] || {}).name;
            out.ghostSkills = ['Burning Touch', 'Become Ethereal', 'Rallying Cry'].every(n => yoon.skills().some(s => s.name === n));
            $gameSwitches.setValue(2, true); out.permanent = !yoon.isEquipChangeOk(faceSlot); $gameSwitches.setValue(2, false);
            SmokingIsle.Glyphs.addArmSlot(2); out.yoonGrown = names(yoon).join(', ');
            out.faceKept = (yoon.equips()[yoon.equipSlots().map((e, i) => i).filter(i => yoon.isTattooSlot(i)).find(i => yoon.equipSlotName(i) === 'Face')] || {}).name;
            const sib = A(3), sibBefore = sib.equips().filter(e => e && e.etypeId === 7).map(e => e.name).join(',');
            SmokingIsle.Glyphs.grantFace(3); out.sibOrdained = names(sib).join(', ');
            out.sibKept = sib.equips().filter(e => e && e.etypeId === 7).map(e => e.name).join(',') === sibBefore;
            out.parlBefore = A(8).tattooSlotCount(); $gameSwitches.setValue(3, true); A(8).refresh(); out.parlAfter = names(A(8)).join(', ');
            return out;
        });
        t.eq(r.counts, '3,4,4,5,4,0', 'slots: Yoon 3, Sib 4, Pada 4, Juda 5, Dama 4, Parl 0');
        t.eq(r.yoon, 'Lower L Arm, Lower R Arm, Face', "Yoon's slots");
        t.eq(r.juda, 'Lower L Arm, Lower R Arm, Upper L Arm, Upper R Arm, Face', "Juda's slots (a priest's Face)");
        t.eq(r.faceGlyph, '??? Glyph', "Yoon's Face holds the ??? glyph");
        t.ok(r.ghostSkills, 'the glyph grants their ghost abilities');
        t.ok(r.permanent, 'it can never be removed, even late game');
        t.eq(r.yoonGrown, 'Lower L Arm, Lower R Arm, Upper L Arm, Face', 'Yoon grows to 4');
        t.eq(r.faceKept, '??? Glyph', 'and the glyph stays on the Face');
        t.eq(r.sibOrdained, 'Lower L Arm, Lower R Arm, Upper L Arm, Upper R Arm, Face', 'Sib is ordained: a Face slot (5)');
        t.ok(r.sibKept, "Sib's tattoos stay where they were");
        t.eq(r.parlBefore, 0, 'Parl has no tattoo slots...');
        t.eq(r.parlAfter, 'Lower L Arm, Lower R Arm', '...until he joins the village: 2');
    }
};
