// Repair items, insulated gloves, war paints, key items, trophy gear and new shields.

module.exports = {
    'repairs, insulation, war paint, key items and new gear': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n), W = n => $dataWeapons.find(w => w && w.name === n),
                  AR = n => $dataArmors.find(a => a && a.name === n), out = {};
            const use = (n, target) => { const x = new Game_Action(A(3)); x.setItem(IT(n).id); const ok = x.testApply(target); if (ok) { target.clearResult(); x.apply(target); } return ok; };
            const yoon = A(2), slot = yoon.slotOfType(1);
            yoon.forceChangeEquip(slot, W('Chipped Obsidian Knife'));
            out.patchRefused = !use('Copper Patch', yoon);
            out.glue = use('Pine-Pitch Glue', yoon) && yoon.equips()[slot].name;
            out.glueAgain = use('Pine-Pitch Glue', yoon);
            const pada = A(5); pada.forceChangeEquip(pada.slotOfType(1), W('Bent Copper Axe')); use('Copper Patch', pada); out.patch = pada.equips()[pada.slotOfType(1)].name;
            // rubber gloves stop the Wet self-shock
            out.insulated = (yoon.forceChangeEquip(yoon.equipSlots().indexOf(13), AR('Rubber-Coated Gloves')), SmokingIsle.Voltaic.isInsulated(yoon));
            const atk0 = yoon.atk; use('Orchil War Paint', yoon); out.paint = yoon.atk > atk0;
            out.keys = $dataItems.filter(i => i && i.itypeId === 2 && i.name && !i.name.startsWith('---')).length;
            out.bigShield = [5, 10, 3].map(id => A(id).canEquip(AR('Pine Shield'))).join(',');
            out.buckler = A(3).canEquip(AR('Hide Buckler'));
            out.zez = W("Heaven's Horn").traits.some(tr => tr.code === 32);
            return out;
        });
        t.ok(r.patchRefused, 'a Copper Patch can\'t fix a stone knife');
        t.eq(r.glue, 'Obsidian Knife', 'Pine-Pitch Glue mends a Chipped Obsidian Knife');
        t.ok(!r.glueAgain, 'nothing left to mend: the glue isn\'t used up');
        t.eq(r.patch, 'Copper Axe', 'a Copper Patch hammers out a Bent Copper Axe');
        t.ok(r.insulated, 'Rubber-Coated Gloves insulate the wearer');
        t.ok(r.paint, 'Orchil War Paint raises ATK');
        t.eq(r.keys, 13, '13 key items (7 body ingredients, 6 clues)');
        t.eq(r.bigShield, 'true,true,false', 'large Pine Shield: adults and Falmi, not Sib');
        t.ok(r.buckler, 'anyone can use the Hide Buckler');
        t.ok(r.zez, "Heaven's Horn can set targets Smoldering");
    }
};
