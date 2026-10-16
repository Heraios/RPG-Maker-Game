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
                'Bitterwood Tea': cures('Bitterwood Tea', [21]), 'Hill Thyme Tea': cures('Hill Thyme Tea', [4]),
                'Burnwort Poultice': cures('Burnwort Poultice', [14, 15]), 'Burnwort Draught': cures('Burnwort Draught', [30, 12]),
                'Laurel Oil': cures('Laurel Oil', [18, 19, 24]), 'Cliff Mint Tea': cures('Cliff Mint Tea', [24, 16]),
                'Ti Leaf Wrap': cures('Ti Leaf Wrap', [21, 14]), 'Yellowroot Drops': cures('Yellowroot Drops', [20, 8]),
                'Milo Bark': cures('Milo Bark', [37]), 'Wart Fern Poultice': cures('Wart Fern Poultice', [5]), 'Bandage': cures('Bandage', [28])
            };
            out.teaNotVenom = (fresh(yoon), yoon.addState(4), yoon.clearResult(), use('Bitterwood Tea', yoon), yoon.isStateAffected(4));
            out.sorrelNoBleed = (fresh(yoon), yoon.addState(28), yoon.clearResult(), use('Moon Sorrel', yoon), yoon.isStateAffected(28) && yoon.isStateAffected(41));
            fresh(yoon); yoon.setTp(30); use('Laurel Oil', yoon); out.laurelFatigue = 30 - yoon.tp;
            fresh(yoon); yoon.setHp(10); yoon.clearResult(); use('Ti Leaf Wrap', yoon); const h0 = yoon.hp; yoon.onTurnEnd(); out.mendTick = yoon.hp - h0;
            // Dragon's Blood: revive + resin ward
            fresh(yoon); yoon.addState(1); use("Dragon's Blood", yoon);
            out.revived = yoon.isAlive() && Math.abs(yoon.hp - yoon.mhp * 0.1) <= 1.5 && yoon.isStateAffected(39);
            const hp1 = yoon.hp; const hit = new Game_Action(e); hit.setSkill(24); yoon.clearResult(); fixed(() => hit.apply(yoon));
            out.wardBlocked = yoon.hp === hp1 && !yoon.isStateAffected(39);
            yoon.clearResult(); fixed(() => hit.apply(yoon)); out.secondHits = yoon.hp < hp1;
            // Smudge: party clears Despair/Panicked, Rite +30%
            fresh(A(3)); A(3).addState(29); A(3).addState(30); A(3).clearResult(); use('Bitterwood Smudge', A(3));
            out.smudge = !A(3).isStateAffected(29) && !A(3).isStateAffected(30) && A(3).talkEquipBonus('rite') === 30;
            // Spurge
            e.clearResult(); use('Spurge Milk', e); out.spurgeMilk = e.isStateAffected(37);
            fresh(A(5)); use('Spurge Coating', A(5)); out.coating = A(5).attackStates().includes(4);
            // Yellowroot Paint: Calm; Ti Root: animals like it
            fresh(yoon); use('Yellowroot Paint', yoon); out.paint = yoon.isStateAffected(32);
            out.tiLiked = $dataEnemies[1].siTalk.likes.includes(IT('Ti Root').id);
            out.noBleedElsewhere = $dataItems.filter(i => i && i.effects.some(ef => ef.code === 22 && ef.dataId === 28)).map(i => i.name).join(',');
            return out;
        });
        Object.entries(r.cures).forEach(([n, ok]) => t.ok(ok, n + ' cures what it should'));
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
