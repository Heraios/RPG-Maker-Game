// Gold: from copper ore and Seafarer axe money; the Golden Disk Pile and Lightning Bolt; Golden Wire;
// gold-plated weapons; Sacred Metal (tumbaga) and the Telegrapher's Kit.

module.exports = {
    'gold, Lightning Bolt, Golden Wire, gold plating and Sacred Metal': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), W = n => $dataWeapons.find(w => w && w.name === n),
                  IT = n => $dataItems.find(i => i && i.name === n), SK = n => $dataSkills.find(s => s && s.name === n), ST = n => SmokingIsle.Ailments.stateByName(n);
            const C = SmokingIsle.Crafting, P = $gameParty, out = {};
            // copper ore sometimes gives gold
            out.oreBonus = C.recipes.filter(x => x.ins.some(a => a.some(ref => C.object(ref).name === 'Copper Ore')) && x.bonus && C.object(x.bonus.ref).name === 'Gold Ingot' && x.bonus.chance === 2).length;
            out.marine = $dataEnemies[13].dropItems.some(d => d.kind === 1 && $dataItems[d.dataId].name === 'Golden Axe Money');
            // the Golden Disk Pile: 6 charge and Lightning Bolt
            const yoon = A(2); yoon.forceChangeEquip(yoon.slotOfType(20), AR('Golden Disk Pile')); yoon.gainCharge(6);
            out.pile = yoon.maxCharge() + '/' + yoon.skills().some(s => s.name === 'Lightning Bolt') + '/' + yoon.canUse(SK('Lightning Bolt'));
            const plain = A(3); plain.forceChangeEquip(plain.slotOfType(20), AR('Voltaic Pile')); plain.gainCharge(3);
            out.plainPile = plain.canUse(SK('Lightning Bolt'));
            // it can't be dodged, and kills a Sodden target
            const owl = new Game_Enemy(12, 0, 0), bolt = new Game_Action(yoon); bolt.setSkill(SK('Lightning Bolt').id);
            out.eva = bolt.itemEva(owl);
            const boar = $gameTroop.members()[0]; boar.setHp(boar.mhp); boar.addState(ST('Sodden'));
            const rnd = Math.random; Math.random = () => 0.5; boar.clearResult(); bolt.apply(boar); Math.random = rnd;
            out.sodden = boar.isDead();
            // Golden Wire: 25% stronger, revives included
            const jolt = new Game_Action(yoon); jolt.setSkill(SK('Galvanic Jolt').id);
            const pada = A(5); pada.clearResult(); pada.addState(pada.deathStateId()); jolt.apply(pada); const plainRevive = pada.hp;
            yoon.forceChangeEquip(yoon.equipSlots().indexOf(5), AR('Golden Wire'));
            out.wire = yoon.armors().some(a => a.name === 'Golden Wire') + '/' + SmokingIsle.Voltaic.electricBoost(yoon, jolt.item());
            pada.clearResult(); pada.addState(pada.deathStateId()); jolt.apply(pada); out.revive = plainRevive + '/' + pada.hp;
            // gold plating
            const gk = W('Gold-Plated Knife');
            out.plated = (gk.note.match(/<Magic Edge:\s*(\d+)>/) || [])[1] + '/' + (gk.note.match(/<Wear Chance:\s*(\d+)>/) || [])[1] + '/' + $dataWeapons[gk.siDegradesTo].name;
            // Sacred Metal: its own set and the Telegrapher's Kit
            const O = SmokingIsle.Outfits;
            out.sets = O.sets['Sacred Metal'] + '/' + O.sets['Telegrapher\'s Kit'];
            const juda = A(6); juda.clearEquipments();
            ['Sacred Metal Ring', 'Sacred Metal Pectoral', 'Sacred Metal Earrings', 'Sacred Metal Bracelet'].forEach(n => { const it = AR(n); const slots = juda.equipSlots();
                const s = n.indexOf('Earrings') >= 0 ? slots.indexOf(5) : n.indexOf('Bracelet') >= 0 ? slots.lastIndexOf(5) : juda.slotOfType(it.etypeId); juda.forceChangeEquip(s, it); });
            out.sacred = juda.setPieceCounts()['Sacred Metal'] + '/' + juda.states().some(s => s.name === 'Sacred Metal (all)');
            out.recipes = ['Melt Down Golden Axe Money', 'Golden Disk Pile', 'Golden Wire', 'Gold-Plated Knife', 'Gold-Plated Axe', 'Gold-Plated Mace', 'Gold-Plated Spear',
                'Sacred Metal Ring', 'Sacred Metal Pectoral', 'Sacred Metal Earrings', 'Sacred Metal Bracelet'].filter(n => !C.recipes.some(x => x.name === n)).join(', ');
            return out;
        });
        t.eq(r.oreBonus, 2, 'melting copper ore (smith or crucible) gives a Gold Ingot 2% of the time');
        t.ok(r.marine, 'Seafarer marines can drop Golden Axe Money');
        t.eq(r.pile, '6/true/true', 'the Golden Disk Pile holds 6 and looses Lightning Bolt');
        t.eq(r.plainPile, false, 'an ordinary pile can\'t');
        t.eq(r.eva, 0, 'Lightning Bolt can\'t be dodged, even by a flyer');
        t.ok(r.sodden, 'Lightning Bolt kills a Sodden target outright');
        t.eq(r.wire, 'true/25', 'the Golden Wire is worn and boosts electric skills 25%');
        t.ok(Number(r.revive.split('/')[1]) > Number(r.revive.split('/')[0]), 'Golden Wire: a jolt revives with more Health (' + r.revive + ')');
        t.eq(r.plated, '20/1/Bent Copper Knife', 'gold plating: Magic Edge 20, wears half as often; bent, the plating cracks off');
        t.eq(r.sets, '4/3', 'Sacred Metal is a 4-piece set; the Telegrapher\'s Kit stays 3 parts (Sacred Metal counts as its charm and hands)');
        t.eq(r.sacred, '4/true', 'all four Sacred Metal pieces: the full bonus');
        t.eq(r.recipes, '', 'every gold recipe exists');
    }
};
