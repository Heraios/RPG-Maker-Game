// Ranged weapons (SI_Ranged), mental states and Yoon's kit (SI_Ailments).

module.exports = {
    'ammo, volleys, accuracy and flying': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), S = id => $dataSkills[id], AR = n => $dataArmors.find(a => a && a.name === n);
            const pada = A(5), yoon = A(2), dama = A(7);
            pada.forceChangeEquip(pada.slotOfType(6), AR('Juniper Bow')); yoon.forceChangeEquip(yoon.slotOfType(6), AR('Sling'));
            pada.onBattleStart(); let arrows = 0; while (pada.canUse(S(33)) && arrows < 10) { pada.useItem(S(33)); arrows++; }
            pada.onBattleStart(); const refilled = pada.rangedAmmoForSkill(S(33));
            yoon.onBattleStart(); yoon.useItem(S(32)); yoon.useItem(S(32));
            const volley = new Game_Action(yoon); volley.setSkill(50); const volleyHits = volley.makeTargets().length; yoon.useItem(S(50));
            dama.forceChangeEquip(dama.slotOfType(1), $dataWeapons[12]); dama.forceChangeEquip(dama.slotOfType(6), AR('Fishing Net')); dama.onBattleStart();
            const harpoonThrows = dama.rangedAmmoForSkill(S(34)), nets = dama.rangedAmmoForSkill(S(35));
            const bat = new Game_Enemy(12, 0, 0); $gameTroop._enemies.push(bat);   // Owl of Ill Omen (flying)
            const eva = id => { const a = new Game_Action(yoon); a.setSkill(id); return a.itemEva(bat); };
            const mino = $gameTroop.members()[0]; const net = new Game_Action(dama); net.setSkill(35); mino.clearResult(); const rnd = Math.random; Math.random = () => 0.5; net.apply(mino); Math.random = rnd;   // no miss
            return { arrows, refilled, volleyHits, stonesLeft: yoon.rangedAmmoForSkill(S(32)), harpoonThrows, nets,
                     jabEva: eva(11), slingEva: eva(32), magicEva: eva(56), entangled: !mino.canMove() };
        });
        t.eq(r.arrows, 3, 'a Juniper Bow has 3 arrows per battle');
        t.eq(r.refilled, 3, 'ammo refills next battle');
        t.eq(r.volleyHits, 3, 'Stone Rain fires every stone left');
        t.eq(r.stonesLeft, 0, 'Stone Rain empties the sling');
        t.eq(r.harpoonThrows, 2, "Dama's harpoon gives 2 javelin throws");
        t.eq(r.nets, 1, '1 net per battle');
        t.eq(r.jabEva, 0.75, 'flyers dodge melee 75%');
        t.eq(r.slingEva, 0, 'ranged attacks ignore evasion');
        t.ok(r.magicEva < 0.75, 'magic is not affected by flying');
        t.ok(r.entangled, 'a net entangles');
    },

    "Yoon's spirit skills": async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const ghost = A(1), yoon = A(2);
            [ghost, yoon].forEach(a => a.setMp(999));
            $gameTroop.setup(2); $gameParty._inBattle = true;
            const [s1, s2] = $gameTroop.members();
            const names = x => x.states().map(s => s.name).sort().join(',');
            const use = (a, id, targets) => { a._siExtraTurn = false; const x = new Game_Action(a); x.setSkill(id); (targets || x.makeTargets()).forEach(y => { y.clearResult(); x.apply(y); }); };
            use(ghost, 86); const ghostTouch = [names(s1), names(s2)];
            use(yoon, 91, [s1]); const touch2 = names(s1);
            use(yoon, 103, [s1]); const writhe = names(s1);
            const hp = s1.hp; use(yoon, 102, [s1]); const surge = { dmg: hp - s1.hp, states: names(s1), extra: yoon._siExtraTurn };
            s2.clearResult(); s2.removeState(14); use(yoon, 100, [s2]); const infernal = names(s2);
            return { ghostTouch, touch2, writhe, surge, infernal, mat: yoon.mat, ghostSpark: ghost.isLearnedSkill(10) };
        });
        t.eq(r.ghostTouch.join('|'), 'Smoldering|Smoldering', "the Ghost's Touch hits all enemies");
        t.eq(r.touch2, 'Smoldering,Wet', 'Touches only add states (no cycle)');
        t.eq(r.writhe, 'Enflamed,Sodden', 'Writhe upgrades every base state');
        t.eq(r.surge.states, 'Chilled,Steam', 'Surge leaves the matching removal states');
        t.eq(r.surge.dmg, Math.round(r.mat * 0.5 * 2), 'Infernal Surge deals MAT/2 per state');
        t.eq(r.surge.extra, true, 'purging a second tier grants an extra turn');
        t.eq(r.infernal, 'Burdened,Disoriented,Smoldering,Wet', 'Infernal Touch inflicts all four');
        t.eq(r.ghostSpark, false, 'the Ghost has no damage spells');
    },

    'mental ailments and buffs': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const yoon = $gameActors.actor(2), sib = $gameActors.actor(3), th = $gameActors.actor(11);
            const names = x => x.states().map(s => s.name).join(',');
            let skip = 0, fled = 0;
            let seed = 7; const rnd = Math.random; Math.random = () => (seed = seed * 16807 % 2147483647) / 2147483647;   // repeatable rolls
            for (let i = 0; i < 600; i++) { const e = new Game_Enemy(4, 0, 0); $gameTroop._enemies.push(e); e.addState(8); if (BattleManager.ctbShouldSkipTurn(e)) { if (e.isHidden()) fled++; else skip++; } }
            Math.random = rnd;
            sib.addState(32); sib.addState(8); const calmWard = names(sib);
            sib.addState(8); sib.addState(33); const happyCure = names(sib);
            yoon.addState(34); yoon.makeActions(); const brave = yoon.numActions();
            th.forceChangeEquip(th.slotOfType(1), $dataWeapons[11]);
            const e = $gameTroop.members()[0];
            const crit = id => { let c = 0; for (let i = 0; i < 2000; i++) { const a = new Game_Action(th); a.setSkill(id); if (Math.random() < a.itemCri(e)) c++; } return c / 2000; };
            const base = crit(36), vital = crit(37); th.addState(31); const focused = crit(36);
            return { skip: skip / 600, fled: fled / 600, calmWard, happyCure, brave, base, vital, focused };
        });
        t.between(r.skip, 0.13, 0.27, 'Confused enemies hesitate about 20%');
        t.between(r.fled, 0.05, 0.15, 'Confused enemies flee about 10%');
        t.eq(r.calmWard, '', 'Calm absorbs one mental ailment');
        t.eq(r.happyCure, 'Happy', 'Happy cures mental ailments');
        t.eq(r.brave, 2, 'Brave acts twice');
        t.ok(r.vital > r.base + 0.15, 'Vital Strike has +25% crit chance');
        t.eq(r.focused, 1, 'Focused guarantees a critical');
    }
};
