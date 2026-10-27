// Talk reactions, weighted results and enemy questions (SI_Talk).

module.exports = {
    'distinct reactions and weighted results': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), T = SmokingIsle.Talk, out = {};
            const fresh = id => { const e = new Game_Enemy(id, 0, 0); $gameTroop._enemies.push(e); return e; };
            const withRoll = (v, f) => { const rnd = Math.random; Math.random = () => v; try { return f(); } finally { Math.random = rnd; } };
            const talk = (a, skillId, e, roll, offer) => withRoll(roll, () => { const x = new Game_Action(a); x.setSkill(skillId); if (offer) x._siOfferItemId = offer; e.clearResult(); x.apply(e); return e._siTalkMessages.join(' / '); });
            $gameParty.gainItem($dataItems[73], 9); $gameParty.gainItem($dataItems[74], 9);
            out.boarSoothe = talk(A(2), 281, fresh(1), 0.5);
            out.bmOffer = talk(A(2), 282, fresh(11), 0.5, 73);
            out.crabDefault = talk(A(2), 281, fresh(3), 0.5);          // no custom Soothe- line? uses its own Soothe+
            out.marineThreat = talk(A(5), 285, fresh(13), 0.5);
            // results: low roll = first entry (normal), high roll = the twist
            const seal = fresh(5); const hp = A(5).hp; out.sealLash = talk(A(5), 285, seal, 0.99); out.padaHurt = A(5).hp < hp;
            const crab = fresh(3); out.crabFlee = talk(A(2), 285, crab, 0.99); out.crabGone = crab.isHidden();
            const boar = fresh(1); out.boarLeave = talk(A(2), 282, boar, 0.99, 73); out.boarGone = boar.isHidden();
            T.prompts = []; const goat = fresh(6); talk(A(2), 282, goat, 0.99, 73);
            const p = T.prompts.find(x => x.enemy === goat); out.demand = p ? p.text + ' [' + p.answers.map(a => a.label).join(', ') + ']' : 'none';
            const before = goat.talkMood(); T.currentPrompt = p; $gameMessage.clear(); T.answer(0); out.demandGain = goat.talkMood() - before;
            // bad results are rarer for a specialist (Pada with animals): with a 0.6 roll, a hostile seal lashes at Yoon (46% chance) but not at Pada (30%)
            const s1 = fresh(5); s1._siMood = 20; const yoonRes = talk(A(2), 285, s1, 0.6);
            const s2 = fresh(5); s2._siMood = 20; const padaRes = talk(A(5), 285, s2, 0.6);
            out.yoonLashed = /lashes|lunges/.test(yoonRes); out.padaLashed = /lashes|lunges/.test(padaRes);
            return out;
        });
        t.ok(/stops pawing|bristles flatten/.test(r.boarSoothe), 'the Wild Boar has its own Soothe reaction: ' + r.boarSoothe);
        t.ok(/BOUGHT|knocks the offering/.test(r.bmOffer), 'a bribe offends a Boar-Man in his own words: ' + r.bmOffer);
        t.ok(/claws/.test(r.crabDefault), 'the crab reacts in its own words: ' + r.crabDefault);
        t.ok(/threat|kid/.test(r.marineThreat), 'the Marine answers a threat: ' + r.marineThreat);
        t.ok(/lunges/.test(r.sealLash) && r.padaHurt, 'a threatened seal can lash out at the speaker: ' + r.sealLash);
        t.ok(r.crabGone && /scuttles/.test(r.crabFlee), 'a threatened crab can flee');
        t.ok(r.boarGone && /trots off/.test(r.boarLeave), 'a boar can take the bread and leave');
        t.ok(/wants Barley Bread/.test(r.demand), 'a goat can demand more bread: ' + r.demand);
        t.eq(r.demandGain, 20, 'giving it more bread pleases it (+20)');
        t.ok(r.yoonLashed && !r.padaLashed, 'the right speaker (Pada with animals) gets fewer bad results');
    },

    'enemies ask questions; answers depend on who is there': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), T = SmokingIsle.Talk, out = {};
            const bm = new Game_Enemy(11, 0, 0); $gameTroop._enemies.push(bm);
            const q = bm.talkData().questions;
            out.count = q.length;
            const prompt = T.questionPrompt(bm, A(2), q[0]);
            out.labels = prompt.answers.map(a => a.label);             // Pada is in the battle party, so his answer shows
            $gameParty.removeActor(5); out.withoutPada = T.questionPrompt(bm, A(2), q[0]).answers.length; $gameParty.addActor(5);
            const m0 = bm.talkMood(); T.currentPrompt = prompt; $gameMessage.clear(); T.answer(0); out.honest = bm.talkMood() - m0;
            out.reply = $gameMessage._texts.join(' / ');
            const girl = new Game_Enemy(7, 0, 0); $gameTroop._enemies.push(girl); $gameParty.gainGold(50);
            const gp = T.questionPrompt(girl, A(2), girl.talkData().questions[0]); T.currentPrompt = gp; $gameMessage.clear(); T.answer(0);
            out.stolen = 50 - $gameParty.gold();
            return out;
        });
        t.eq(r.count, 2, 'the Boar-Man has two questions');
        t.ok(r.labels.some(l => /agreement/.test(l)), "Pada's answer is offered when he's there: " + r.labels.join(' / '));
        t.eq(r.withoutPada, 3, "and not when he isn't");
        t.eq(r.honest, 20, 'an honest answer pleases him (+20)');
        t.ok(/Honest/.test(r.reply), 'and he replies: ' + r.reply);
        t.eq(r.stolen, 10, '"Yes, want to see?" gets your cowries pinched');
    },

    'a question pops up in a real battle and is answered through the choice window': async (h, t) => {
        await h.battle();
        await h.eval(() => { SmokingIsle.Talk.questionChance = 100; $gameTroop.members()[0]._siMood = 40; });
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        await h.eval(() => {
            const sc = SceneManager._scene, a = BattleManager.actor(); a.learnSkill(281);
            const act = a.inputtingAction(); act.setSkill(281); act.setTarget(0);
            sc._actorCommandWindow.deactivate(); sc.selectNextCommand();
        });
        let seen = null;
        for (let i = 0; i < 200 && !seen; i++) {
            seen = await h.eval(() => $gameMessage.isChoice() ? { text: $gameMessage._texts.join(' '), choices: $gameMessage.choices() } : null);
            if (!seen) { if (await h.eval(() => $gameMessage.isBusy())) await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(50); }
        }
        t.ok(seen && /Boar-Man: "/.test(seen.text), 'the Boar-Man asks a question: ' + (seen && seen.text));
        t.ok(seen && seen.choices.length >= 3, 'with answers to choose from: ' + (seen && seen.choices.join(' / ')));
        const before = await h.eval(() => $gameTroop.members()[0].talkMood());
        await h.page.keyboard.press('Enter');
        for (let i = 0; i < 40 && await h.eval(() => $gameMessage.isBusy() || $gameTroop.isEventRunning()); i++) { await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(80); }
        const after = await h.eval(() => $gameTroop.members()[0].talkMood());
        t.ok(after !== before, 'the answer changed its mood (' + before + ' -> ' + after + ')');
        t.ok(await h.eval(() => SceneManager._scene instanceof Scene_Battle), 'the battle carries on');
    },
    'Insight decides what Yoon can read: mood, approaches, tells': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const yoon = $gameActors.actor(2), ghost = $gameActors.actor(1);
            const at = lvl => { yoon.changeLevel(lvl, false); ghost.changeLevel(lvl, false); const e = new Game_Enemy(11, 0, 0); e._siMood = 50; return e.talkHint(); };
            return { i1: at(1), i2: at(2), i4: at(4), i5: [0, 1, 2, 3, 4, 5].map(() => at(5)[1]) };
        });
        t.eq(r.i1[0], 'Boar-Man', 'Insight 1: just the name');
        t.eq(r.i1[1], '', 'and no tell');
        t.eq(r.i2[0], 'Boar-Man: Wary.', 'Insight 2: its mood');
        t.ok(/Responds to Soothe, Plead\. Not Offer\./.test(r.i4[0]), 'Insight 4: what it responds to and what offends it: ' + r.i4[0]);
        t.ok(/plain words/.test(r.i4[1]), 'and a tell: ' + r.i4[1]);
        t.ok(r.i5.some(x => /Gifts/.test(x)), 'Insight 5 unlocks a deeper tell');
    },

    'the hint box shows while choosing a Talk target, and Yoon points out tells': async (h, t) => {
        await h.battle();
        const start = await h.eval(() => { $gameActors.actor(2).changeLevel(5, false); $gameMessage.clear(); const e = $gameTroop.members()[0]; e._siTell = undefined; BattleManager.displayStartMessages(); return $gameMessage._texts.join(' / '); });
        t.ok(/Yoon notices: /.test(start), 'Yoon points out a tell at the start: ' + start);
        await h.eval(() => $gameMessage.clear());
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const sc = SceneManager._scene, a = BattleManager.actor(); a.learnSkill(281);
            sc._actorCommandWindow.selectSymbol('talk'); sc._actorCommandWindow.processOk();
            const w = sc._skillWindow; w.select(w._data.findIndex(s => s && s.id === 281)); w.processOk();
            const help = { visible: sc._helpWindow.visible, text: sc._helpWindow._text || '' };
            sc._enemyWindow.processCancel();
            const back = sc._helpWindow._text || '';
            return { help, back };
        });
        t.ok(r.help.visible && /Boar-Man: /.test(r.help.text), 'the hint box shows the target: ' + r.help.text.replace('\n', ' | '));
        t.ok(!/Boar-Man: /.test(r.back), 'cancelling goes back to the skill description');
    }
};
