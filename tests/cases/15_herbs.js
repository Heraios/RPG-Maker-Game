// Herbal remedies (items) and their states: Resin ward, Mending, Smudged, Spurge-Coated.

module.exports = {
    'every remedy does its one job': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n), out = {};
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.1; try { return f(); } finally { Math.random = rnd; } };
            const use = (name, target, user) => fixed(() => { const x = new Game_Action(user || A(3)); x.setItem(IT(name).id); target.clearResult(); x.apply(target); });
            const fresh = a => { a.recoverAll(); a.clearStates(); a.clearResult(); a.setTp(0); };
            const yoon = A(2), e = $gameTroop.members()[0];
            const cures = (name, states) => { fresh(yoon); states.forEach(s => yoon.addState(s)); yoon.clearResult(); use(name, yoon); return states.every(s => !yoon.isStateAffected(s)); };
            out.cures = {
                'Bitterwood Tea': cures('Bitterwood Tea', [79, 82]), 'Hill Thyme Tea': cures('Hill Thyme Tea', [112]),
                'Burnwort Poultice': cures('Burnwort Poultice', [72, 73]), 'Burnwort Draught': cures('Burnwort Draught', [156, 42]),
                'Laurel Oil': cures('Laurel Oil', [76, 77, 82]), 'Cliff Mint Tea': cures('Cliff Mint Tea', [82, 74, 75]),
                'Ti Leaf Wrap': cures('Ti Leaf Wrap', [79, 72, 73]), 'Yellowroot Drops': cures('Yellowroot Drops', [78, 79, 152]),
                'Milo Bark': cures('Milo Bark', [117]), 'Bandage': cures('Bandage', [116])
            };
            out.fernWard = (fresh(yoon), use('Wart Fern Poultice', yoon), yoon.addState(113), !yoon.isStateAffected(113));
            const ST = n => $dataStates.find(x => x && x.name === n).id;
            fresh(yoon); use('Ti Leaf Wrap', yoon); use('Ironwort Tonic', yoon); out.stack = yoon.isStateAffected(ST('Mending')) && yoon.isStateAffected(ST('Tonic'));
            fresh(yoon); yoon.setMp(0); yoon.setTp(40); use('Berry Syrup', yoon); out.syrup = yoon.mp + '/' + yoon.tp;
            out.teaNotVenom = (fresh(yoon), yoon.addState(112), yoon.clearResult(), use('Bitterwood Tea', yoon), yoon.isStateAffected(112));
            out.sorrelNoBleed = (fresh(yoon), yoon.addState(116), yoon.clearResult(), use('Moon Sorrel', yoon), yoon.isStateAffected(116) && yoon.isStateAffected(234));
            fresh(yoon); yoon.setTp(30); use('Laurel Oil', yoon); out.laurelFatigue = 30 - yoon.tp;
            fresh(yoon); yoon.setHp(10); yoon.clearResult(); use('Ti Leaf Wrap', yoon); const h0 = yoon.hp; yoon.onTurnEnd(); out.mendTick = yoon.hp - h0;
            // Dragon's Blood: revive + resin ward
            fresh(yoon); yoon.addState(1); use("Dragon's Blood", yoon);
            out.revived = yoon.isAlive() && Math.abs(yoon.hp - yoon.mhp * 0.1) <= 1.5 && yoon.isStateAffected(232);
            const hp1 = yoon.hp; const hit = new Game_Action(e); hit.setSkill(656); yoon.clearResult(); fixed(() => hit.apply(yoon));
            out.wardBlocked = yoon.hp === hp1 && !yoon.isStateAffected(232);
            yoon.clearResult(); fixed(() => hit.apply(yoon)); out.secondHits = yoon.hp < hp1;
            // Smudge: party clears Despair/Panicked, Rite +30%
            fresh(A(3)); A(3).addState(155); A(3).addState(156); A(3).clearResult(); use('Bitterwood Smudge', A(3));
            out.smudge = !A(3).isStateAffected(155) && !A(3).isStateAffected(156) && A(3).talkEquipBonus('rite') === 30;
            // Spurge
            e.clearResult(); use('Spurge Milk', e); out.spurgeMilk = e.isStateAffected(117);
            fresh(A(5)); use('Spurge Coating', A(5)); out.coating = A(5).attackStates().includes(112);
            // Yellowroot Paint: Calm; Ti Root: animals like it
            fresh(yoon); use('Yellowroot Paint', yoon); out.paint = yoon.isStateAffected(194);
            out.tiLiked = $dataEnemies[1].siTalk.likes.includes(IT('Ti Root').id);
            out.noBleedElsewhere = $dataItems.filter(i => i && i.effects.some(ef => ef.code === 22 && ef.dataId === 116)).map(i => i.name).join(',');
            return out;
        });
        Object.entries(r.cures).forEach(([n, ok]) => t.ok(ok, n + ' cures what it should'));
        t.ok(r.fernWard, 'Wart Fern Poultice keeps Salting off');
        t.ok(r.stack, 'Ironwort Tonic and Ti Leaf Wrap heal over time together');
        t.eq(r.syrup, '10/25', 'Berry Syrup: 10 MP and Fatigue -15');
        t.ok(r.teaNotVenom, 'Bitterwood Tea cures only fever (not Venom)');
        t.ok(r.sorrelNoBleed, 'Moon Sorrel mends slowly but does not stop Bleed');
        t.eq(r.laurelFatigue, 20, 'Laurel Oil eases 20 Fatigue');
        t.ok(r.mendTick > 0, 'Ti Leaf Wrap mends each turn (+' + r.mendTick + ')');
        t.ok(r.revived, "Dragon's Blood revives at 10% HP inside a resin shell");
        t.ok(r.wardBlocked, 'the resin blocks one attack completely, then breaks');
        t.ok(r.secondHits, 'the next attack lands');
        t.ok(r.smudge, 'Bitterwood Smudge clears Despair and Panicked and strengthens Rite');
        t.ok(r.spurgeMilk, 'Spurge Milk dazzles');
        t.ok(r.coating, 'Spurge Coating makes attacks envenom');
        t.ok(r.paint, 'Yellowroot Paint calms');
        t.ok(r.tiLiked, 'boars like Ti Root');
        t.eq(r.noBleedElsewhere, 'Bandage', 'only Bandages stop Bleed (no redundant items)');
    }
};
