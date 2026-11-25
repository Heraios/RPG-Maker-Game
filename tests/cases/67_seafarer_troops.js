// Seafarer troops (80-97): every one sets up; Seafarer fights play Battle_Seafarers and the bosses their
// own music; every troop with a Priest hides a soldier to call; Meneswa changes at half Health and
// surrenders at the end (switch 10), in a real battle.

module.exports = {
    'Seafarer troops set up, with the right music and a soldier for every Priest': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const M = SmokingIsle.BattleMusic, out = {};
            const troops = $dataTroops.filter(x => x && x.id >= 80 && x.id <= 97);
            out.count = troops.length;
            out.named = troops.every(x => x.name);
            out.bad = troops.filter(x => !x.members.length || x.members.some(m => !$dataEnemies[m.enemyId] || !$dataEnemies[m.enemyId].name)).map(x => x.name).join(', ');
            out.setup = troops.filter(x => { try { $gameTroop.setup(x.id); return !$gameTroop.aliveMembers().length; } catch (e) { return true; } }).map(x => x.name).join(', ');
            const priest = $dataEnemies.find(e => e && e.name === 'Seafarer Priest').id;
            out.priestHelp = troops.filter(x => x.members.some(m => m.enemyId === priest)).filter(x =>
                !x.members.some(m => m.hidden && ['Seafarer Marine', 'Seafarer Axeman'].includes($dataEnemies[m.enemyId].name))).map(x => x.name).join(', ');
            out.music = troops.map(x => { $gameTroop.setup(x.id); return M.choose(); });
            out.lady = $dataTroops.find(x => x && x.name === 'Boss: Lady of the Sword').id;
            out.meneswa = $dataTroops.find(x => x && x.name === 'Boss: Meneswa').id;
            out.switchName = $dataSystem.switches[10];
            return out;
        });
        t.eq(r.count, 18, '18 Seafarer troops');
        t.ok(r.named, 'every troop is named');
        t.eq(r.bad, '', 'every member is a real enemy');
        t.eq(r.setup, '', 'every troop sets up with someone to fight');
        t.eq(r.priestHelp, '', 'every troop with a Priest hides a Marine or Axeman to call for help');
        t.ok(r.music.slice(0, 16).every(m => m === 'Battle_Seafarers'), 'Seafarer fights play Battle_Seafarers: ' + r.music.slice(0, 16).join(','));
        t.eq(r.music[16] + '/' + r.music[17], 'Battle_Seafarers/Meneswa', 'the Lady of the Sword and Meneswa have their own boss music');
        t.eq(r.lady + '/' + r.meneswa, '96/97', 'boss troops 96 and 97');
        t.eq(r.switchName, 'Meneswa surrendered (Act 5)', 'switch 10 is named');
    },

    'Meneswa changes at half Health and surrenders at the end': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, nop = new Proxy({}, { get: () => () => false });
            Window_BattleLog.prototype.push = function() {};
            const troop = $dataTroops.find(x => x && x.name === 'Boss: Meneswa').id;
            const phase2 = $dataEnemies.filter(e => e && e.name === 'Meneswa')[1].id;
            $gameSwitches.setValue(10, false);
            BattleManager.setup(troop, false, true);
            BattleManager.setLogWindow(nop); BattleManager.setStatusWindow(nop); BattleManager.setSpriteset(nop);
            BattleManager.startBattle();
            const men = () => $gameTroop.members()[0];
            const step = (n) => { for (let i = 0; i < n && BattleManager._phase !== 'battleEnd'; i++) { $gameMessage.clear();
                if (BattleManager._phase === 'input' && BattleManager.actor()) { const a = BattleManager.actor(); a.inputtingAction().setGuard(); BattleManager.selectNextCommand(); continue; }
                BattleManager.update(); } };
            let ended = null; const endBattle = BattleManager.endBattle; BattleManager.endBattle = function(result) { ended = result; return endBattle.call(this, result); };
            for (let i = 0; i < 200 && !(BattleManager._phase === 'input' && $gameTroop.turnCount() >= 1); i++) step(1);
            out.immortal = men().isStateAffected(4);
            // a huge blow from full Health: she still changes rather than dies
            men().setHp(0); out.aliveAtZero = men().isAlive();
            for (let i = 0; i < 400 && men().enemyId() !== phase2; i++) step(1);
            out.phase2 = men().enemyId() === phase2 && men().hp === men().mhp && men().isStateAffected(4);
            out.switchEarly = $gameSwitches.value(10);
            men().setHp(0);
            for (let i = 0; i < 60 && ended === null; i++) step(20);
            out.ended = ended; out.surrendered = $gameSwitches.value(10);
            BattleManager.endBattle = endBattle;
            return out;
        });
        t.ok(r.immortal, "Meneswa can't simply die");
        t.ok(r.aliveAtZero, 'at 0 Health in phase 1 she is still standing');
        t.ok(r.phase2, 'she becomes phase 2 at full Health, still Immortal');
        t.eq(r.switchEarly, false, "the surrender switch isn't set by the change");
        t.eq(r.ended, 1, 'at the end she yields: the battle is broken off');
        t.eq(r.surrendered, true, 'switch 10 records her surrender');
    },

    'a Horseman troop: the rider is thrown in a real battle': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const nop = new Proxy({}, { get: () => () => false });
            Window_BattleLog.prototype.push = function() {};
            const troop = $dataTroops.find(x => x && x.name === 'Horseman').id;
            const foot = $dataEnemies.filter(e => e && e.name === 'Seafarer Horseman')[1].id;
            BattleManager.setup(troop, false, true);
            BattleManager.setLogWindow(nop); BattleManager.setStatusWindow(nop); BattleManager.setSpriteset(nop);
            BattleManager.startBattle();
            const rider = () => $gameTroop.members()[0];
            rider().setHp(Math.floor(rider().mhp * 0.5) + 5);
            // the party attacks until the rider is thrown (or the battle ends)
            for (let i = 0; i < 600 && rider().enemyId() !== foot && BattleManager._phase !== 'battleEnd'; i++) {
                $gameMessage.clear();
                if (BattleManager._phase === 'input' && BattleManager.actor()) { const a = BattleManager.actor(); a.inputtingAction().setAttack(); a.inputtingAction().setTarget(0); BattleManager.selectNextCommand(); continue; }
                BattleManager.update();
            }
            return { thrown: rider().enemyId() === foot, alive: rider().isAlive() || rider().isDead() };
        });
        t.ok(r.thrown, 'attacked below half Health in a real battle, the Horseman is unhorsed');
    }
};
