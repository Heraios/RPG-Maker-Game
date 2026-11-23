// SI_Tactics: enemies choose by scoring. Situations with one right answer: animals never single out the
// Ghost; a Hag cashes in on Sodden with her wind; a Priest heals the hurt ally; a Vulture circles until
// someone is low; a Heron spears the Wet; a Spider doesn't re-web; a lone Bat flees; plans show only at
// enough Insight; Bask needs the sun; rats steal food; an Eel dives after biting.

module.exports = {
    'enemy tactics: situations with one right answer': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, TA = SmokingIsle.Tactics;
            const EN = n => $dataEnemies.find(e => e && e.name === n).id;
            const ST = n => $dataStates.find(s => s && s.name === n).id;
            const party = ids => { $gameParty._actors = ids.slice(); $gameParty.members().forEach(a => { a.recoverAll(); a.clearStates(); a._siMarks = {}; }); };
            const troop = names => { $gameTroop._enemies = names.map((n, i) => { const e = new Game_Enemy(EN(n), 100 + i * 150, 400); e._siWasSeen = true; return e; });
                $gameTroop._siHurtBy = {}; $gameTroop._siLastTarget = null; return $gameTroop._enemies; };
            const picks = (e, n) => { const res = []; for (let i = 0; i < n; i++) { e.makeActions(); const a = e.action(0);
                if (!a || !a.item()) { res.push(['-', '-']); continue; } const tg = a.isForOpponent() || a.isForFriend() ? a.makeTargets() : [];
                res.push([a.item().name, tg.length === 1 ? tg[0].name() + (tg[0].isEnemy() ? '#' + $gameTroop.members().indexOf(tg[0]) : '') : '*']); } return res; };
            const share = (list, f) => list.filter(f).length / list.length;

            // 1. Animals never single out the Ghost; ravens (omen birds) can
            party([1, 3, 4]);
            const ghost = $gameActors.actor(1).name();
            let [boar] = troop(['Wild Boar']);
            out.boarOnGhost = share(picks(boar, 120), p => p[1] === ghost);
            let [raven] = troop(['Raven']);
            out.ravenOnGhost = share(picks(raven, 200), p => p[1] === ghost);

            // 2. A Marsh Hag cashes in on Sodden with Marsh Wind (an extra turn), and never targets the Ghost
            party([1, 3, 4]);
            const sib = $gameActors.actor(3); sib.addState(ST('Sodden'));
            let [hag] = troop(['Marsh Hag']); hag._siMood = 10;
            const hp = picks(hag, 60);
            out.hagWind = share(hp, p => p[0] === 'Marsh Wind');
            out.hagOnGhost = share(hp, p => p[1] === ghost);
            const windScore = () => Math.max.apply(null, TA.options(hag, hag.enemy().actions.filter(a => hag.isActionValid(a)))
                .filter(o => $dataSkills[o.data.skillId].name === 'Marsh Wind').map(o => o.score));
            out.windSodden = windScore(); sib.clearStates(); out.windDry = windScore();

            // 3. A Seafarer Priest heals the hurt ally, not the healthy one
            party([2, 3, 7]);
            const [pr, m1, m2] = troop(['Seafarer Priest', 'Seafarer Marine', 'Seafarer Marine']);
            m1.setHp(Math.floor(m1.mhp * 0.3));
            const pp = picks(pr, 80).filter(p => p[0] === 'Mahu');
            out.mahuCount = pp.length;
            out.mahuOnHurt = pp.length ? share(pp, p => p[1].endsWith('#1')) : 0;

            // 4. A Vulture circles while the party is healthy, and dives once someone is low
            party([2, 3, 7]);
            let [vul] = troop(['Vulture']);
            out.vultureHealthy = share(picks(vul, 30), p => p[0] === 'Circle');
            $gameActors.actor(3).setHp(Math.floor($gameActors.actor(3).mhp * 0.4));
            const vd = picks(vul, 60);
            out.vultureLow = share(vd, p => p[0] === 'Circle');
            out.vultureOnLow = share(vd.filter(p => p[0] === 'Rending Beak'), p => p[1] === $gameActors.actor(3).name());   // its dives (Ill Omen goes elsewhere)

            // 5. A Heron (frog-and-heron troop) spears the Wet one
            party([2, 3, 7]);
            $gameTroop._troopId = $dataTroops.find(x => x && x.name === 'Marsh: Heron, Marsh Frogs*2').id;
            $dataTroops[$gameTroop._troopId]._siCombos = undefined;
            const [, heron] = troop(['Marsh Frog', 'Heron', 'Marsh Frog']);
            const wet = $gameActors.actor(2); wet.addState(ST('Wet'));   // Yoon, whom it otherwise passes over (Dama's buckler resists Wet)
            out.heronOnWet = share(picks(heron, 100), p => p[1] === wet.name());
            wet.clearStates();
            out.heronOnDama = share(picks(heron, 100), p => p[1] === wet.name());
            $gameTroop._troopId = 0;

            // 6. A Cave Spider doesn't re-web someone already Entangled
            party([2, 3, 7]);
            let [spi] = troop(['Cave Spider']);
            $gameActors.actor(2).addState(ST('Entangled'));
            const sp = picks(spi, 100).filter(p => p[0] === 'Web Shot');
            out.rewebs = sp.length ? share(sp, p => p[1] === $gameActors.actor(2).name()) : 0;

            // 7. A lone Bat below half Health flees
            party([2, 3, 7]);
            let [bat] = troop(['Bat']); bat.setHp(Math.floor(bat.mhp * 0.4));
            out.batFlees = picks(bat, 5).every(p => p[0] === $dataSkills[4].name);

            // 8. A plan shows only at enough Insight (tier 2: Insight 10)
            party([2, 3, 7]);
            $gameActors.actor(3).addState(ST('Sodden'));
            [hag] = troop(['Marsh Hag']); hag._siMood = 10;
            let planLow = null, planHigh = null;
            for (let i = 0; i < 30 && !(planLow !== null && planHigh); i++) {
                hag.makeActions(); const a = hag.action(0); if (!a._siTacticPlan || !a._siTacticPlan.setup) continue;
                $gameActors.actor(2).changeLevel(1, false); $gameActors.actor(1).changeLevel(1, false); planLow = TA.intentLine(hag, a);
                $gameActors.actor(2).changeLevel(12, false); $gameActors.actor(1).changeLevel(12, false); planHigh = TA.intentLine(hag, a);
            }
            $gameActors.actor(2).changeLevel(1, false); $gameActors.actor(1).changeLevel(1, false);
            out.planLow = planLow; out.planHigh = planHigh;

            // 9. Bask needs the sun
            const bask = $dataSkills.find(s => s && s.name === 'Bask');
            const T = SmokingIsle.Time, night = T.isNight;
            T.isNight = () => false; out.baskDay = TA.needsMet(bask);
            T.isNight = () => true; out.baskNight = TA.needsMet(bask);
            T.isNight = night;

            // 10. Rats steal food
            party([2, 3, 7]);
            $gameParty._items = {}; $gameParty.gainItem($dataItems.find(i => i && i.name === 'Barley Bread'), 2);
            const [rat] = troop(['Giant Cave Rat']);
            const snatch = new Game_Action(rat); snatch.setSkill($dataSkills.find(s => s && s.name === 'Snatch Food').id);
            const rnd = Math.random; Math.random = () => 0.1; const yoon = $gameActors.actor(2); yoon.clearResult(); snatch.apply(yoon); Math.random = rnd;
            out.breadLeft = $gameParty.numItems($dataItems.find(i => i && i.name === 'Barley Bread'));
            out.snatchLine = (yoon._siCommandMessages || []).join(' ');

            // 11. An Eel dives after biting
            const [eel] = troop(['Marsh Eel']);
            const bite = new Game_Action(eel); bite.setSkill($dataSkills.find(s => s && s.name === 'Eel Bite').id); bite.applyGlobal();
            out.submerged = eel.isStateAffected(ST('Submerged')) && eel.eva >= 0.5;

            // 12. A Green Horse (fae, tier 2) covers its hurt imp, not a healthy one
            party([2, 3, 7]);
            const [imp1, horse, imp2] = troop(['Forest Imp', 'Green Horse', 'Forest Imp']);
            const hp0 = picks(horse, 60).filter(p => p[0] === 'Cover').length;
            imp1.setHp(Math.floor(imp1.mhp * 0.3));
            const hc = picks(horse, 60).filter(p => p[0] === 'Cover');
            out.coverHealthy = hp0; out.coverHurt = hc.length; out.coverOnHurt = hc.length ? share(hc, p => p[1].endsWith('#0')) : 0;

            // 13. Default tiers
            out.tiers = ['Laurel Pigeon', 'Bat', 'Marsh Hag', 'Seafarer Marine'].map(n => TA.tier(new Game_Enemy(EN(n), 0, 0))).join(',');
            return out;
        });
        t.eq(r.boarOnGhost, 0, 'a Wild Boar never singles out the Ghost');
        t.ok(r.ravenOnGhost > 0, 'a Raven (an omen bird) can (' + r.ravenOnGhost + ')');
        t.ok(r.hagWind >= 0.6, 'a Marsh Hag mostly uses Marsh Wind when someone is Sodden (' + r.hagWind + ')');
        t.eq(r.hagOnGhost, 0, 'and never targets the Ghost she dotes on');
        t.ok(r.windSodden - r.windDry >= 50, 'Sodden makes Marsh Wind worth an extra turn more (' + Math.round(r.windSodden) + ' vs ' + Math.round(r.windDry) + ')');
        t.ok(r.mahuCount > 0 && r.mahuOnHurt >= 0.9, 'a Priest heals the hurt Marine, not the healthy one (' + r.mahuCount + ' heals, ' + r.mahuOnHurt + ' on the hurt one)');
        t.eq(r.vultureHealthy, 1, 'a Vulture circles while the party is healthy');
        t.ok(r.vultureLow < 0.2 && r.vultureOnLow >= 0.65, 'and dives mostly at the low one once someone is low (tier 1 varies) (' + r.vultureLow + ' circling, ' + r.vultureOnLow + ' on the low one)');
        t.ok(r.heronOnWet >= 0.6 && r.heronOnWet > r.heronOnDama + 0.2, 'a Heron spears the Wet one (' + r.heronOnWet + ' vs ' + r.heronOnDama + ' when dry)');
        t.eq(r.rewebs, 0, "a Cave Spider doesn't re-web someone already Entangled");
        t.ok(r.batFlees, 'a lone Bat below half Health flees');
        t.eq(r.planLow, null, 'a Hag\'s plan is hidden at Insight 1');
        t.ok(typeof r.planHigh === 'string' && r.planHigh.length > 0, 'and shows at Insight 12: ' + r.planHigh);
        t.eq(r.baskDay + '/' + r.baskNight, 'true/false', 'Bask works by day, not at night');
        t.eq(r.breadLeft, 1, 'a rat snatches food from the bag');
        t.ok(/snatches/.test(r.snatchLine), 'with a line: ' + r.snatchLine);
        t.ok(r.submerged, 'an Eel dives after biting (harder to hit)');
        t.eq(r.coverHealthy, 0, 'a Green Horse doesn\'t Cover while its imps are healthy');
        t.ok(r.coverHurt >= 20 && r.coverOnHurt >= 0.9, 'it covers the hurt imp (' + r.coverHurt + ' of 60, ' + r.coverOnHurt + ' on the hurt one)');
        t.eq(r.tiers, '0,1,2,2', 'default tiers: prey 0, animals 1, spirits and soldiers 2');
    },

    'enemy tactics in a real battle: no errors, and the battle ends': async (h, t) => {
        const names = ['Cranes (one false)', 'Marsh: Heron, Marsh Frogs*2', 'Seafarers: Priest, Marines*2 (+Marine)', 'Bats*6',
            'Spider Crab, Shore Crabs*2 (+2)', "Officer's Guard: Officer, Axemen*2, Priest (+Axeman)"];
        const results = [];
        for (const name of names) {
            await h.battle();   // a fresh page for every battle
            results.push(await h.eval(name => {
                const nop = new Proxy({}, { get: () => () => false });
                Window_BattleLog.prototype.push = function() {};
                // adults (no child-sparing stalemates), strong enough to finish
                $gameParty._actors = [5, 7, 8]; $gameParty.members().forEach(a => { a.changeLevel(5, false); a.recoverAll(); });
                BattleManager.setup($dataTroops.find(x => x && x.name === name).id, true, true);
                BattleManager.setLogWindow(nop); BattleManager.setStatusWindow(nop); BattleManager.setSpriteset(nop);
                BattleManager.startBattle();
                let err = null, guard = 0;
                try {
                    while (BattleManager._phase !== 'battleEnd' && guard++ < 30000) {
                        $gameMessage.clear();
                        if (BattleManager._phase === 'input' && BattleManager.actor()) {
                            // each attacks with its strongest damaging skill (Punch alone can't outpace a healer)
                            const a = BattleManager.actor(), act = a.inputtingAction(), foe = $gameTroop.aliveMembers()[0];
                            const usable = a.skills().filter(k => a.canUse(k) && k.damage.type === 1 && !k.siApproach);
                            let best = null, bestD = -1;
                            usable.forEach(k => { const x = new Game_Action(a); x.setSkill(k.id); const d = foe ? x.makeDamageValue(foe, false) : 0; if (d > bestD) { bestD = d; best = k; } });
                            if (best) { act.setSkill(best.id); if (foe) act.setTarget(foe.index()); } else act.setAttack();
                            BattleManager.selectNextCommand(); continue; }
                        BattleManager.update();
                    }
                } catch (e) { err = e.message; }
                return name + ': ' + (err || (BattleManager._phase === 'battleEnd' ? 'ended' : 'stuck'));
            }, name));
        }
        t.ok(results.every(x => /ended$/.test(x)), 'real battles run to the end with tactics on: ' + results.join(' | '));
    }
};
