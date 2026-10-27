// Talk (SI_Talk) and Insight (SI_Insight).

module.exports = {
    'conversation moods, offers, rage, stalking and outcomes': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const yoon = A(2), pada = A(5), sib = A(3);
            const fresh = id => { const e = new Game_Enemy(id, 0, 0); $gameTroop._enemies.push(e); return e; };
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.5; try { return f(); } finally { Math.random = rnd; } };
            const talk = (a, skillId, e, offer) => fixed(() => { const x = new Game_Action(a); x.setSkill(skillId); if (offer) x._siOfferItemId = offer; e.clearResult(); x.apply(e); return e._siTalkMessages.join(' / '); });
            const out = {};
            const boar = fresh(1); const start = boar.talkMood();          // Wild Boar
            talk(yoon, 281, boar); out.soothed = boar.talkMood() > start;
            $gameParty.gainItem($dataItems[73], 3);
            const before = boar.talkMood(), bread = $gameParty.numItems($dataItems[73]);
            talk(yoon, 282, boar, 73); out.offerGain = boar.talkMood() - before; out.breadSpent = bread - $gameParty.numItems($dataItems[73]);
            yoon.changeLevel(3, false);
            const bm = fresh(11); const expBefore = yoon.currentExp();      // Boar-Man: plain pleading works
            for (let i = 0; i < 12 && bm.isAppeared(); i++) talk(yoon, 286, bm);
            out.pacifiedLeft = !bm.isAppeared(); out.buffed = $gameParty.members()[0]._buffs[3] > 0; out.exp = yoon.currentExp() - expBefore;
            const bm2 = fresh(11); bm2._siMood = 95; const e2 = yoon.currentExp(); talk(yoon, 286, bm2); out.repeatExp = yoon.currentExp() - e2;
            const b3 = fresh(1); b3._siMood = 8; talk(pada, 285, b3); out.enraged = b3.isEnraged(); out.enragedRefuses = /too enraged/.test(talk(yoon, 281, b3));
            const b4 = fresh(1); talk(pada, 287, b4); talk(pada, 287, b4); out.hunted = b4.isHunted() && !b4.canMove();
            const fb = new Game_Action(pada); fb.setSkill(77); out.finishing = fb.makeDamageValue(b4, false) === b4.hp;
            const bm3 = fresh(11); bm3._siMood = 75; out.askInfo = /marked trees/.test(talk(yoon, 283, bm3)) && !bm3.isAppeared();
            const girl = fresh(7); yoon.setHp(10); girl._siMood = 95; talk(sib, 281, girl); out.healed = yoon.hp > 10;
            $dataEnemies[1].siTalk.instant = [9]; const b5 = fresh(1); talk(A(9), 281, b5); out.instant = !b5.isAppeared(); $dataEnemies[1].siTalk.instant = [];
            out.noBattleExp = $gameTroop.expTotal();
            return out;
        });
        t.ok(r.soothed, 'Soothe calms the Wild Boar');
        t.eq(r.breadSpent, 1, 'Offer gives the bread away');
        t.ok(r.offerGain >= 25, 'a liked offering counts double (+' + r.offerGain + ')');
        t.ok(r.pacifiedLeft, 'a pacified enemy leaves');
        t.ok(r.buffed, "the Boar-Man's outcome buffs the party's Defense");
        t.eq(r.exp, 25, 'the speaker earns the full Insight EXP');
        t.eq(r.repeatExp, 5, 'repeat successes earn 20%');
        t.ok(r.enraged && r.enragedRefuses, "a threatened, angry enemy becomes Enraged and won't listen");
        t.ok(r.hunted, 'two Stalks corner the animal');
        t.ok(r.finishing, 'Finishing Blow kills a Hunted animal outright');
        t.ok(r.askInfo, 'Ask gets information from a Calm enemy');
        t.ok(r.healed, "the Cave Girl's outcome heals the party");
        t.ok(r.instant, '<Talk Instant> enemies yield to that speaker at once');
        t.eq(r.noBattleExp, 0, 'winning a battle gives no EXP');
    },

    'calm enemies stop attacking; soldiers spare children unless enraged': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            $gameTroop.setup(13); const bm = $gameTroop.members()[0];
            const valid = e => e.enemy().actions.filter(a => e.isActionValid(a)).map(a => $dataSkills[a.skillId].name);
            bm._siMood = 20; const hostile = valid(bm); bm._siMood = 80; const calm = valid(bm);
            $gameTroop.setup(14); const marine = $gameTroop.members()[0];
            const targets = () => { const seen = {}; for (let i = 0; i < 300; i++) { const a = new Game_Action(marine); a.setSkill(656); a.makeTargets().forEach(x => seen[x.name()] = 1); } return Object.keys(seen); };
            const normal = targets();
            [4, 5].forEach(id => { $gameActors.actor(id).addState(1); });
            const onlyKids = valid(marine);
            marine.addState(42); const enragedTargets = targets();
            return { hostile, calm, normal, onlyKids, enragedTargets };
        });
        t.ok(r.hostile.includes('Boar Club') && !r.hostile.includes('Offer Passage'), 'a hostile Boar-Man fights: ' + r.hostile);
        t.ok(!r.calm.includes('Boar Club') && r.calm.includes('Offer Passage'), 'a calm Boar-Man only offers to let you leave: ' + r.calm);
        t.ok(!r.normal.includes('Yoon') && !r.normal.includes('Sib'), 'the Marine never targets children: ' + r.normal);
        t.eq(r.onlyKids.join(','), 'Demand Surrender', 'with only children left the Marine demands surrender');
        t.ok(r.enragedTargets.includes('Yoon') || r.enragedTargets.includes('Sib'), 'an Enraged Marine attacks children');
    },

    'hitting an enemy angers it; "Heel, Girl!" makes Patience guard': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const yoon = A(2), sib = A(3), lasa = A(4), patience = A(12);
            const fresh = id => { const e = new Game_Enemy(id, 0, 0); $gameTroop._enemies.push(e); return e; };
            const hit = (a, e) => { const x = new Game_Action(a); x.setSkill(1); e.clearResult(); e.setHp(e.mhp); const rnd = Math.random; Math.random = () => 0.5; x.apply(e); Math.random = rnd; };   // never misses
            const out = {};
            const m = fresh(4); m._siMood = 50; hit(yoon, m); out.afterHit = m.talkMood();
            for (let i = 0; i < 10 && !m.isEnraged(); i++) hit(yoon, m);
            out.enraged = m.isEnraged();
            out.noPatience = yoon.canUse($dataSkills[288]);
            $gameParty.addActor(12);
            out.canHeel = [yoon, sib, A(5)].every(a => a.canUse($dataSkills[288])) && !lasa.skills().some(s => s.id === 288);
            const heel = a => { const x = new Game_Action(a); x.setSkill(288); x.apply(a); };
            heel(sib); out.heeled = patience.isStateAffected(6);
            patience.makeActions(); out.guards = patience.action(0).isGuard();
            heel(sib); out.loose = !patience.isStateAffected(6);
            patience.makeActions(); out.attacks = !patience.action(0).isGuard();
            return out;
        });
        t.eq(r.afterHit, 40, 'a hit costs 10 mood');
        t.ok(r.enraged, 'enough hits enrage it');
        t.eq(r.noPatience, false, '"Heel, Girl!" needs Patience in the battle');
        t.ok(r.canHeel, 'Yoon, Sib and Pada can call her; Lasa cannot');
        t.ok(r.heeled && r.guards, 'a heeled Patience only guards');
        t.ok(r.loose && r.attacks, 'calling again lets her loose');
    },

    'Insight stats, caps and shared Yoon Insight': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const sib = A(3);
            const snap = a => ({ mhp: a.mhp, atk: a.atk, mdf: a.mdf, luk: a.luk, eva: a.eva, conf: a.stateRate(152), cri: a.cri, tcr: a.tcr });
            const s1 = snap(sib); sib.changeLevel(15, false); const s15 = snap(sib); sib.changeLevel(40, false);
            const yoon = A(2), ghost = A(1); yoon.gainExp(200);
            return { s1, s15, cap: sib.level, yoon: yoon.level, ghost: ghost.level };
        });
        t.eq(r.s15.mhp, r.s1.mhp, 'Insight does not raise HP');
        t.eq(r.s15.atk, r.s1.atk, 'Insight does not raise ATK');
        t.eq(r.s15.mdf - r.s1.mdf, 14, 'Spirit (MDF) +1 per Insight');
        t.eq(r.s15.luk - r.s1.luk, 14, 'Wits (LUK) +1 per Insight');
        t.between(r.s15.eva - r.s1.eva, 0.069, 0.071, 'evasion +0.5% per Insight');
        t.between(r.s15.conf, 0.71, 0.73, 'mental states land 28% less at Insight 15');
        t.between(r.s15.cri - r.s1.cri, 0.139, 0.141, 'critical chance +1% per Insight');
        t.eq(r.s15.tcr, r.s1.tcr, 'Insight no longer changes how fast Fatigue builds');
        t.eq(r.cap, 15, "Sib's Insight cap is 15");
        t.eq(r.ghost, r.yoon, 'Ghost and Human Yoon share Insight');
    }
};
