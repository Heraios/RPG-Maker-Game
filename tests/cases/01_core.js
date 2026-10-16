// Punch, weapon moves, Fatigue, Weary and resting (SI_CombatCore).

module.exports = {
    'weapon moves decide which skills can be used': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), S = id => $dataSkills[id], W = id => $dataWeapons[id];
            const usable = a => a.skills().filter(s => s.stypeId === 2 && a.canUse(s)).map(s => s.name);
            const yoon = A(2), th = A(11);
            yoon.forceChangeEquip(yoon.slotOfType(1), W(1)); const knife = usable(yoon);
            yoon.forceChangeEquip(yoon.slotOfType(1), W(6)); const staff = usable(yoon);
            th.forceChangeEquip(th.slotOfType(1), W(3)); const khopesh = usable(th);
            const conductNoPile = th.canUse(S(47));
            th.forceChangeEquip(th.slotOfType(5), $dataArmors.find(a => a && a.name === 'Voltaic Pile'));
            return { knife, staff, khopesh, conductNoPile, conductPile: th.canUse(S(47)) };
        });
        t.ok(r.knife.includes('Quick Jab') && r.knife.includes('Raking Cut') && !r.knife.includes('Overhead Smash'), 'knife moves: ' + r.knife);
        t.ok(r.staff.includes('Wide Sweep') && r.staff.includes('Vital Strike') && !r.staff.includes('Measured Thrust'), 'staff moves: ' + r.staff);
        t.ok(r.khopesh.includes('Heavy Chop') && !r.khopesh.includes('Quick Jab'), 'khopesh cannot jab: ' + r.khopesh);
        t.eq(r.conductNoPile, false, 'Conducting Edge without a Voltaic Pile');
        t.eq(r.conductPile, true, 'Conducting Edge with a Voltaic Pile');
    },

    'punch ignores weapon ATK and armor never blocks all damage': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const pada = $gameActors.actor(5);
            pada.forceChangeEquip(pada.slotOfType(1), $dataWeapons[4]);
            const mino = $gameTroop.members()[0];
            const a = new Game_Action(mino); a.setSkill(24);
            const strike = a.makeDamageValue(pada, false);
            return { atk: pada.atk, unarmed: pada.unarmedAtk(), strike };
        });
        t.eq(r.atk - r.unarmed, 12, 'unarmed ATK excludes the Basalt Axe');
        t.ok(r.strike > 0, 'enemy Strike still does damage through armor');
    },

    'fatigue, Weary and resting skills': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const yoon = $gameActors.actor(2), sib = $gameActors.actor(3), S = id => $dataSkills[id];
            const out = {};
            yoon.setTp(0); yoon.useItem(S(11)); out.jab = yoon.tp;
            sib.setTp(0); sib.useItem(S(11)); out.sibJab = sib.tp;
            yoon.setTp(80); out.catchAt80 = yoon.canUse(S(14));
            yoon.setTp(100); out.weary = yoon.isWeary(); out.catchWeary = yoon.canUse(S(14)); out.pantWeary = yoon.canUse(S(29)); out.jabWeary = yoon.canUse(S(11));
            yoon.useItem(S(29)); out.afterPant = yoon.tp; out.wearyAfterPant = yoon.isWeary();
            yoon.useItem(S(14)); out.afterCatch = yoon.tp;
            yoon.setTp(40); yoon.onBattleEnd(); out.kept = yoon.tp;
            yoon.recoverAll(); out.recovered = yoon.tp;
            const ghost = $gameActors.actor(1); ghost.setTp(60); out.ghost = ghost.tp;
            return out;
        });
        t.eq(r.jab, 1, 'Quick Jab costs 1 Fatigue');
        t.between(r.sibJab, 1.29, 1.31, "Sib's physical skills cost 30% more");
        t.eq(r.catchAt80, false, 'Catch Breath needs Fatigue above 85');
        t.eq(r.weary, true, 'Weary at 100');
        t.eq(r.catchWeary, false, 'Catch Breath blocked while Weary');
        t.eq(r.pantWeary, true, 'Heavy Panting works while Weary');
        t.eq(r.jabWeary, false, 'Weary blocks Physical skills');
        t.eq(r.afterPant, 95, 'Heavy Panting recovers 5');
        t.eq(r.wearyAfterPant, false, 'Weary lifts below 100');
        t.between(r.afterCatch, 75, 80, 'Catch Breath recovers 15-20');
        t.eq(r.kept, 40, 'Fatigue carries over after battle');
        t.eq(r.recovered, 0, 'Recover All clears Fatigue');
        t.eq(r.ghost, 0, 'the Ghost never gains Fatigue');
    },

    'conditioning: indoor/outdoor rest and bronze armor': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const falmi = A(10), tou = A(9), th = A(11);
            [10, 9, 11].forEach(id => $gameParty.addActor(id));
            th.forceChangeEquip(th.slotOfType(11), $dataArmors.find(a => a && a.name === 'Bronze Cuirass'));
            const turn = a => { a.setTp(50); a.onTurnEnd(); return a.tp; };
            const out = { falmiOut: turn(falmi), touOut: turn(tou), thTrained: turn(th) };
            th.forgetSkill(31); out.thUntrained = turn(th);
            $dataMap = { note: '<Indoors>' };
            out.falmiIn = turn(falmi); out.touIn = turn(tou);
            $dataMap = null;
            return out;
        });
        t.eq(r.falmiOut, 49, 'Falmi recovers outdoors');
        t.eq(r.touOut, 50, 'Tou does not recover outdoors');
        t.eq(r.falmiIn, 50, 'Falmi does not recover indoors');
        t.eq(r.touIn, 49, 'Tou recovers indoors');
        t.eq(r.thTrained, 50, 'Armor Training cancels bronze Fatigue');
        t.eq(r.thUntrained, 53, 'Bronze Helm + Cuirass add 3 Fatigue per turn');
    }
};
