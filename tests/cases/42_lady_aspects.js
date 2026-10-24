// The Lady of the Woods: two aspects with opposite talk rules, each shifting at half Health
// (lowland -> the Sacred Rain Pig, alpine -> the Stern Centaur), with her mood carried over.

module.exports = {
    'the Lady\'s two aspects and their true forms': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, nop = new Proxy({}, { get: () => () => false });
            Window_BattleLog.prototype.push = function() {};
            const run = (troopName) => {
                const troop = $dataTroops.find(x => x && x.name === troopName).id;
                BattleManager.setup(troop, false, true);
                BattleManager.setLogWindow(nop); BattleManager.setStatusWindow(nop); BattleManager.setSpriteset(nop);
                BattleManager.startBattle();
                const lady = () => $gameTroop.members()[0];
                const step = n => { for (let i = 0; i < n && BattleManager._phase !== 'battleEnd'; i++) { $gameMessage.clear();
                    if (BattleManager._phase === 'input' && BattleManager.actor()) { BattleManager.actor().inputtingAction().setGuard(); BattleManager.selectNextCommand(); continue; }
                    BattleManager.update(); } };
                for (let i = 0; i < 100 && !(BattleManager._phase === 'input' && $gameTroop.turnCount() >= 1); i++) step(1);
                const first = lady().enemy().name + ':' + lady().talkData().overrides.offer;
                lady().talkMood(); lady()._siMood = 60; lady().setHp(Math.floor(lady().mhp * 0.4));
                for (let i = 0; i < 300 && lady().enemyId() === $dataTroops[troop].members[0].enemyId; i++) step(1);
                const second = lady().enemy().name + ':' + lady().talkMood() + ':' + (lady().hp === lady().mhp);
                BattleManager._phase = 'init'; $gameParty.members().forEach(a => a.recoverAll());
                return first + ' -> ' + second;
            };
            out.lowland = run('Boss: Lady of the Woods (lowland)');
            out.alpine = run('Boss: Lady of the Woods (alpine)');
            const E = n => $dataEnemies.find(e => e && e.name === n);
            out.rules = [E('The Sacred Rain Pig'), E('The Stern Centaur')].map(e => e.siTalk.overrides.rite + '/' + e.siTalk.overrides.offer).join(' ');
            return out;
        });
        t.eq(r.lowland, 'Lady of the Woods:10 -> The Sacred Rain Pig:60:true', 'lowland: gifts welcome; at half Health she becomes the Sacred Rain Pig, mood kept, at full strength');
        t.eq(r.alpine, 'Lady of the Woods:-15 -> The Stern Centaur:60:true', 'alpine: gifts insult her; at half Health she becomes the Stern Centaur, mood kept');
        t.eq(r.rules, '25/10 15/-25', 'the rain pig answers rites and food; the centaur rites, and bribes offend her');
    }
};
