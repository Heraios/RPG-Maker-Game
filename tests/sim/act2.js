// Balance simulation: the Act 2 party against every Act 2 troop, fighting and talking.
// Run with:  node run.js --sim
// Battles run headless with the game's real rules (no animations, no messages).

module.exports = {
    'Act 2 party vs Act 2 troops': async (h) => {
        await h.battle();
        const report = await h.eval(() => {
            const RUNS = 40, MAX_TURNS = 400;
            const PARTIES = { 'full (Yoon, Sib, Lasa, Pada, Patience)': [2, 3, 4, 5, 12], 'early (Yoon, Sib, Lasa, Patience)': [2, 3, 4, 12] };
            const nop = new Proxy({}, { get: () => () => false });
            let PARTY = [2, 3, 4, 5, 12];
            Window_BattleLog.prototype.push = function() {};
            const T = SmokingIsle.Talk; T.questionChance = 0;

            const resetParty = () => {
                $gameParty._actors = PARTY.slice();
                PARTY.forEach(id => {
                    const a = $gameActors.actor(id);
                    a.initEquips($dataActors[id].equips);
                    a.clearStates(); a.clearBuffs(); a.recoverAll(); a.setTp(0);
                });
                $gameParty._items = {}; $gameParty.gainItem($dataItems[42], 3); $gameParty.gainItem($dataItems[43], 3);
            };

            const avgDamage = (a, skill, target) => { const x = new Game_Action(a); x.setSkill(skill.id); return x.makeDamageValue(target, false); };

            // Fight: each member uses its strongest usable damaging skill on the weakest enemy; rests when it must.
            const fightPolicy = a => {
                const act = a.inputtingAction(), foes = $gameTroop.aliveMembers();
                const target = foes.reduce((m, e) => (e.hp < m.hp ? e : m), foes[0]);
                const usable = a.skills().filter(s => a.canUse(s) && s.damage.type === 1 && !s.siApproach);
                const rest = a.skills().find(s => a.canUse(s) && /Catch Breath|Heavy Panting/.test(s.name));
                if (rest) { act.setSkill(rest.id); return; }
                if (!usable.length || !target) { act.setGuard(); return; }
                let best = usable[0], bestD = -1;
                usable.forEach(s => { let d = 0; for (let i = 0; i < 5; i++) d += avgDamage(a, s, target); if (d > bestD) { bestD = d; best = s; } });
                act.setSkill(best.id); act.setTarget(target.index());
            };

            // Talk: Heel Patience first; then each member uses its best approach on the calmest talking enemy.
            const talkPolicy = a => {
                const act = a.inputtingAction();
                const heel = a.skills().find(s => s.name === 'Heel, Girl!');
                const patience = $gameActors.actor(12);
                if (heel && a.canUse($dataSkills[heel.id]) && patience.isAlive() && !patience.isStateAffected(6)) { act.setSkill(heel.id); return; }
                const foes = $gameTroop.aliveMembers().filter(e => e.talkData().type && !e.isEnraged());
                if (!foes.length) { fightPolicy(a); return; }
                const target = foes.reduce((m, e) => (e.talkMood() > m.talkMood() ? e : m), foes[0]);
                const approaches = a.skills().filter(s => s.siApproach && a.canUse(s) && s.siApproach !== 'stalk');
                let best = null, bestD = -999, offer = 0;
                approaches.forEach(s => {
                    let d = target.talkBaseDelta(s.siApproach);
                    if (s.siApproach === 'offer') {
                        const liked = (target.talkData().likes || []).find(id => $gameParty.numItems($dataItems[id]) > 0);
                        if (!liked) return; d *= 2; if (d > bestD) offer = liked;
                    }
                    if (s.siApproach === 'ask' && target.talkMood() < 70) d = -5;
                    const res = target.talkData().results[s.siApproach];   // an approach that usually scares it off counts as a win
                    if (res) { const tot = res.reduce((x, r) => x + r.weight, 0), flee = res.filter(r => r.kind === 'flee').reduce((x, r) => x + r.weight, 0); if (flee / tot >= 0.5) d = 50; }
                    if (d > bestD) { bestD = d; best = s; }
                });
                if (!best || bestD <= 0) { act.setGuard(); return; }
                act.setSkill(best.id); act.setTarget(target.index());
                if (best.siApproach === 'offer') act._siOfferItemId = offer;
            };

            const runOne = (troopId, policy) => {
                resetParty();
                BattleManager.setup(troopId, true, true);
                BattleManager.setLogWindow(nop); BattleManager.setStatusWindow(nop); BattleManager.setSpriteset(nop);
                BattleManager.startBattle();
                const startHp = $gameParty.battleMembers().reduce((s, a) => s + a.mhp, 0);
                let partyTurns = 0, guard = 0;
                while (BattleManager._phase !== 'battleEnd' && guard++ < 20000) {
                    $gameMessage.clear();
                    if (BattleManager._phase === 'input' && BattleManager.actor()) {
                        const a = BattleManager.actor(); partyTurns++;
                        policy(a); BattleManager.selectNextCommand();
                        if (partyTurns > MAX_TURNS) break;
                        continue;
                    }
                    BattleManager.update();
                }
                const members = $gameParty.battleMembers().filter(a => a.actorId() !== 12);
                const endHp = $gameParty.battleMembers().reduce((s, a) => s + a.hp, 0);
                const won = $gameTroop.isAllDead();
                const talked = $gameTroop.members().filter(e => e.isHidden()).length;
                const res = { won, lost: $gameParty.isAllDead(), partyTurns, hpLost: 1 - endHp / startHp,
                    kos: members.filter(a => a.isDead()).length, fatigue: members.reduce((s, a) => s + a.tp, 0) / members.length,
                    worn: members.filter(a => { const w = a.weapons()[0], s = $dataActors[a.actorId()].equips[0]; return s && (!w || w.id !== s); }).length,
                    talked, enemyTurns: $gameTroop.members().reduce((s, e) => s + e.ctbTurnCount(), 0) };
                BattleManager._phase = 'init'; $gameParty.onBattleEnd(); $gameTroop.onBattleEnd && $gameTroop.onBattleEnd();
                return res;
            };

            const out = [];
            Object.keys(PARTIES).forEach(label => { PARTY = PARTIES[label];
            for (let troopId = 1; troopId <= 12; troopId++) {
                ['fight', 'talk'].forEach(mode => {
                    const runs = []; for (let i = 0; i < RUNS; i++) runs.push(runOne(troopId, mode === 'fight' ? fightPolicy : talkPolicy));
                    const avg = k => runs.reduce((s, r) => s + (typeof r[k] === 'boolean' ? (r[k] ? 1 : 0) : r[k]), 0) / runs.length;
                    out.push({ troop: $dataTroops[troopId].name, mode, win: avg('won'), loss: avg('lost'), turns: avg('partyTurns'), hpLost: avg('hpLost'),
                               kos: avg('kos'), fatigue: avg('fatigue'), worn: avg('worn'), talked: avg('talked'), enemyTurns: avg('enemyTurns'), party: label });
                });
            } });
            return out;
        });
        const pct = x => (x * 100).toFixed(0).padStart(4) + '%';
        let party = null;
        report.forEach(r => { if (r.party !== party) { party = r.party; console.log('\nParty: ' + party);
            console.log('Troop                       Mode   Win  Lose  Turns  Foe turns  HP lost  KOs  Fatigue  Gear worn  Talked away'); }
            console.log(r.troop.padEnd(27), r.mode.padEnd(5), pct(r.win), pct(r.loss), r.turns.toFixed(1).padStart(6), r.enemyTurns.toFixed(1).padStart(10),
            pct(r.hpLost).padStart(8), r.kos.toFixed(2).padStart(5), r.fatigue.toFixed(1).padStart(8), r.worn.toFixed(2).padStart(10), r.talked.toFixed(2).padStart(12)); });
    }
};
