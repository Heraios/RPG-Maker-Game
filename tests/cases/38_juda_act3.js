// Act 3 Juda: optionally beatable; at 0 Health he rises in his partial Navigator Lord form, which can't
// fairly be beaten (it never knocks anyone out), and three turns later the battle ends with switch 9 ON.

module.exports = {
    'Juda rises half a Navigator Lord': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, nop = new Proxy({}, { get: () => () => false });
            Window_BattleLog.prototype.push = function() {};
            const troop = $dataTroops.find(x => x && x.name === 'Boss: Juda').id;
            $gameSwitches.setValue(9, false);
            BattleManager.setup(troop, false, true);
            BattleManager.setLogWindow(nop); BattleManager.setStatusWindow(nop); BattleManager.setSpriteset(nop);
            BattleManager.startBattle();
            const juda = () => $gameTroop.members()[0];
            const step = (n) => { for (let i = 0; i < n && BattleManager._phase !== 'battleEnd'; i++) { $gameMessage.clear();
                if (BattleManager._phase === 'input' && BattleManager.actor()) { const a = BattleManager.actor(); a.inputtingAction().setGuard(); BattleManager.selectNextCommand(); continue; }
                BattleManager.update(); } };
            let ended = null; const endBattle = BattleManager.endBattle; BattleManager.endBattle = function(result) { ended = result; return endBattle.call(this, result); };
            for (let i = 0; i < 200 && !(BattleManager._phase === 'input' && $gameTroop.turnCount() >= 1); i++) step(1);
            out.immortal = juda().isStateAffected(4);
            juda().setHp(0); out.aliveAtZero = juda().isAlive();
            for (let i = 0; i < 400 && juda().enemyId() === 49; i++) step(1);
            out.form = juda().enemyId() + '/' + juda().hp + '/' + $gameSwitches.value(9);
            let kos = 0; for (let i = 0; i < 60 && ended === null; i++) { step(20); kos = Math.max(kos, $gameParty.deadMembers().length); }
            out.kos = kos; out.ended = ended; out.turns = $gameTroop.turnCount();
            BattleManager.endBattle = endBattle;
            return out;
        });
        t.ok(r.immortal, 'Juda can\'t simply die');
        t.ok(r.aliveAtZero, 'at 0 Health he is still standing');
        t.ok(/^50\/9999\/true$/.test(r.form), 'he rises in his half-risen form at full Health, and switch 9 is ON (' + r.form + ')');
        t.eq(r.kos, 0, 'the half-risen form never knocks anyone out');
        t.eq(r.ended, 1, 'a few turns later the battle is broken off (aborted, not won or lost; ' + r.turns + ' turns)');
    }
};
