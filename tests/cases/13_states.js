// The repurposed states: Venom, Salting, Dragged Below, Hypnotized, Sleep (SI_Ailments).

module.exports = {
    'venom, salting, dragged below, hypnosis and sleep': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), out = {};
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.1; try { return f(); } finally { Math.random = rnd; } };
            const use = (who, skillId, target, item) => fixed(() => { const x = new Game_Action(who); if (item) x.setItem(skillId); else x.setSkill(skillId); target.clearResult(); x.apply(target); });
            const turnEnd = b => { b.onTurnEnd(); };
            const pada = A(5), sib = A(3), yoon = A(2);
            const e = $gameTroop.members()[0];
            // Venom
            pada.clearResult(); pada.addState(112); const hp = pada.hp; turnEnd(pada); out.venomTick = hp - pada.hp;
            pada.setHp(50); use(sib, 2, pada, true); out.potionUnderVenom = pada.hp - 50;
            use(sib, $dataItems.find(i => i && i.name === 'Hill Thyme Tea').id, pada, true); out.herbCures = !pada.isStateAffected(112);
            // Salting: runs its course
            sib.clearResult(); sib.addState(113); for (let i = 0; i < 3; i++) { sib.clearResult(); turnEnd(sib); }
            out.salted = sib.isDead();
            sib.revive(); sib.setHp(sib.mhp); sib.clearResult();
            // Salting: washed off with Fresh Water
            sib.addState(113); turnEnd(sib); const fw = $dataItems.findIndex(i => i && i.name === 'Fresh Water');
            $gameParty.gainItem($dataItems[fw], 1); use(yoon, fw, sib, true); out.waterCures = !sib.isStateAffected(113);
            // ...and by a water spell on an enemy
            e.addState(113); yoon.learnSkill(416); yoon.setMp(99); use(yoon, 416, e); out.rariCures = !e.isStateAffected(113);
            // Dragged Below: freed by hitting the dragger
            use(e, 675, yoon); out.dragged = yoon.isStateAffected(114) && !yoon.canMove();
            const yhp = yoon.hp; const hit = new Game_Action(e); hit.setSkill(656); yoon.clearResult(); hit.apply(yoon); out.outOfReach = yoon.hp === yhp;
            use(pada, 1, e); out.freed = !yoon.isStateAffected(114);
            // ...or lost if nobody does
            use(e, 675, yoon); for (let i = 0; i < 3; i++) { yoon.clearResult(); turnEnd(yoon); } out.lost = yoon.isDead();
            yoon.revive(); yoon.setHp(yoon.mhp);
            // Hypnotized: attacks its own side
            pada.clearResult(); pada.addState(153); const conf = new Game_Action(pada); conf.setConfusion();
            out.hypnoTargets = [...new Set(Array.from({ length: 30 }, () => conf.makeTargets()[0]).map(x => x.isActor() ? 'party' : 'enemy'))].join(',');
            pada.removeState(153);
            // Sleep: can't act, a hit wakes it
            sib.clearResult(); sib.addState(154); out.asleep = !sib.canMove();
            const wake = new Game_Action(e); wake.setSkill(656); sib.clearResult(); fixed(() => wake.apply(sib)); out.woke = !sib.isStateAffected(154);
            out.mentalList = SmokingIsle.Insight ? String(PluginManager.parameters('SI_Insight')['Mental States']) : '';
            return out;
        });
        t.between(r.venomTick, 4, 6, 'Venom: about 5% HP per turn (' + r.venomTick + ')');
        t.eq(r.potionUnderVenom, 15, 'Venom halves healing (Potion 30 -> 15)');
        t.ok(r.herbCures, 'Hill Thyme Tea cures Venom');
        t.ok(r.salted, 'Salting that runs its course turns the victim to salt (knocked out)');
        t.ok(r.waterCures, 'Fresh Water washes the salt off');
        t.ok(r.rariCures, 'so does a water spell');
        t.ok(r.dragged, 'Drag Below takes Yoon out of the fight');
        t.ok(r.outOfReach, 'a dragged member is out of reach');
        t.ok(r.freed, 'hitting the dragger pulls them free');
        t.ok(r.lost, 'if nobody does, they are lost');
        t.eq(r.hypnoTargets, 'party', 'a Hypnotized member attacks their own side');
        t.ok(r.asleep && r.woke, 'Sleep stops a member acting until something hits them');
        t.ok(!/\b7\b/.test(r.mentalList), 'the cleared state is no longer counted as mental: ' + r.mentalList);
    }
};
