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
            out.glueRefused = !use('Glue', yoon);   // a knife is lashed with sinew, not glued
            out.bound = use('Sinew Binding', yoon) && yoon.equips()[slot].name;
            out.boundAgain = use('Sinew Binding', yoon);
            const pada = A(5); pada.forceChangeEquip(pada.slotOfType(1), W('Chipped Basalt Axe')); use('Glue', pada); out.glued = pada.equips()[pada.slotOfType(1)].name;
            pada.forceChangeEquip(pada.slotOfType(1), W('Bent Copper Axe')); out.copperByHand = use('Glue', pada) || use('Sinew Binding', pada);
            // rubber gloves stop the Wet self-shock
            out.insulated = (yoon.forceChangeEquip(yoon.equipSlots().indexOf(13), AR('Rubber-Coated Gloves')), SmokingIsle.Voltaic.isInsulated(yoon));
            const atk0 = yoon.atk; use('Orchil War Paint', yoon); out.paint = yoon.atk > atk0;
            out.keys = $dataItems.filter(i => i && i.itypeId === 2 && i.name && !i.name.startsWith('---') && !/^(Recipe\.|Crafting equipment\.)/.test(i.note)).length;
            out.bigShield = [5, 10, 3].map(id => A(id).canEquip(AR('Pine Shield'))).join(',');
            out.buckler = A(3).canEquip(AR('Hide Buckler'));
            out.zez = W("Heaven's Horn").traits.some(tr => tr.code === 32);
            const falmi = A(10); falmi.forceChangeEquip(falmi.slotOfType(2), AR('Painted Dragon-Tree Shield')); falmi.onBattleStart(); out.shieldResin = falmi.isStateAffected($dataStates.find(s => s && s.name === 'Resin').id);
            return out;
        });
        t.ok(r.glueRefused, 'Glue doesn\'t mend a sinew-lashed knife');
        t.eq(r.bound, 'Obsidian Knife', 'Sinew Binding mends a Chipped Obsidian Knife');
        t.ok(!r.boundAgain, 'nothing left to mend: the binding isn\'t used up');
        t.eq(r.glued, 'Basalt Axe', 'Glue re-sets a Chipped Basalt Axe');
        t.ok(!r.copperByHand, 'bent copper is only straightened by a smith');
        t.ok(r.insulated, 'Rubber-Coated Gloves insulate the wearer');
        t.ok(r.paint, 'Orchil War Paint raises ATK');
        t.eq(r.keys, 15, '15 key items (7 body ingredients, 6 clues, quern and boat)');
        t.eq(r.bigShield, 'true,true,false', 'large Pine Shield: adults and Falmi, not Sib');
        t.ok(r.buckler, 'anyone can use the Hide Buckler');
        t.ok(r.zez, "Heaven's Horn can set targets Smoldering");
        t.ok(r.shieldResin, 'the Painted Dragon-Tree Shield starts each battle in Resin');
    }
};
