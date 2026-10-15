// Adult protection, Tou's revival (SI_BattleTraits), Patience (SI_PseudoMember), and the test room.

module.exports = {
    'adults protect children; Tou revives': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const yoon = A(2), sib = A(3), lasa = A(4), mino = $gameTroop.members()[0];
            BattleManager._logWindow.displaySubstitute = function() {};
            const rate = target => { let c = 0; for (let i = 0; i < 400; i++) { const a = new Game_Action(mino); a.setSkill(24); BattleManager._action = a; if (BattleManager.applySubstitute(target) !== target) c++; } return c / 400; };
            yoon.setHp(yoon.mhp); const full = rate(yoon);
            yoon.setHp(Math.floor(yoon.mhp * 0.3)); const low = rate(yoon);
            sib.setHp(3); const sibLow = rate(sib); lasa.setHp(3); const lasaLow = rate(lasa);
            $gameParty.addActor(9); $gameParty.swapOrder($gameParty._actors.indexOf(4), $gameParty._actors.indexOf(9));
            const tou = A(9); tou.addState(1);
            BattleManager._ctbActive = yoon; BattleManager.endTurn(); const after1 = tou.isDead();
            BattleManager._ctbActive = mino; BattleManager.endTurn();
            return { full, low, sibLow, lasaLow, after1, after2: tou.isDead(), touHp: tou.hp, touMhp: tou.mhp };
        });
        t.eq(r.full, 0, 'no protection above 30% HP');
        t.eq(r.low, 1, 'Pada always protects Yoon');
        t.between(r.sibLow, 0.7, 0.9, 'Pada protects Sib about 80%');
        t.eq(r.lasaLow, 0, 'Lasa (fae, not a child) is never protected');
        t.eq(r.after1, true, 'Tou is still down after one turn');
        t.eq(r.after2, false, 'Tou revives after two turns');
        t.eq(r.touHp, Math.floor(r.touMhp / 2), 'Tou revives at 50% HP');
    },

    'test room: setup, gear, Patience and an enemy talk event': async (h, t) => {
        await h.newGame();
        const setup = await h.eval(() => ({ map: $gameMap.displayName(), party: $gameParty.allMembers().map(a => a.name()) }));
        t.eq(setup.map, 'Test Room', 'New Game starts in the test room');
        t.eq(setup.party.join(','), 'Yoon,Sib,Lasa,Pada,Patience', 'test room party');
        await h.eval(() => $gameMap.event(2).start()); await h.pumpMessages();
        t.ok(await h.eval(() => $gameParty.weapons().length >= 7 && $gameParty.armors().length >= 6), 'the chest gives weapons and ranged gear');
        await h.eval(() => $gameMap.events().find(e => e.event().name.startsWith('Battle: Slime')).start());
        for (let i = 0; i < 20 && !(await h.eval(() => SceneManager._scene instanceof Scene_Battle)); i++) { await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(150); }
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Battle && SceneManager._sceneStarted);
        const battle = await h.eval(() => ({ members: $gameParty.battleMembers().map(a => a.name()), statusRows: SceneManager._scene._statusWindow.maxItems(), patienceWindow: !!SceneManager._scene._pseudoStatusWindow }));
        t.eq(battle.members.join(','), 'Yoon,Sib,Lasa,Pada,Patience', 'Patience fights as a fifth battler');
        t.eq(battle.statusRows, 4, 'the status window keeps four rows');
        await h.eval(() => $gameTroop.members().forEach(e => e._siMood = 60));
        let offered = false;
        for (let k = 0; k < 300; k++) {
            const s = await h.eval(() => ({ battle: SceneManager._scene instanceof Scene_Battle, choice: $gameMessage.isChoice(), cmd: BattleManager.isInputting() && !!BattleManager.actor() }));
            if (!s.battle) break;
            if (s.choice) { offered = true; await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(200); continue; }
            if (s.cmd) { await h.eval(() => { const sc = SceneManager._scene, a = BattleManager.actor(); a.inputtingAction().setGuard(); [sc._skillTypeWindow, sc._skillWindow, sc._itemWindow, sc._tacticsWindow, sc._enemyWindow, sc._actorWindow].forEach(w => w && (w.deactivate(), w.hide())); sc._actorCommandWindow.deactivate(); sc.selectNextCommand(); }); continue; }
            await h.page.waitForTimeout(80); if (await h.eval(() => $gameMessage.isBusy())) await h.page.keyboard.press('Enter');
        }
        t.ok(offered, 'the Slime offered passage');
        t.ok(await h.eval(() => SceneManager._scene instanceof Scene_Map && BattleManager._escaped), 'leaving peacefully ends the battle');
    }
};
