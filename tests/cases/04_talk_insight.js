// Talk (SI_Talk) and Insight (SI_Insight).

module.exports = {
    'conversation moods, offers, rage, stalking and outcomes': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const yoon = A(2), pada = A(5), sib = A(3);
            const fresh = id => { const e = new Game_Enemy(id, 0, 0); $gameTroop._enemies.push(e); return e; };
            const talk = (a, skillId, e, offer) => { const x = new Game_Action(a); x.setSkill(skillId); if (offer) x._siOfferItemId = offer; e.clearResult(); x.apply(e); return e._siTalkMessages.join(' / '); };
            const out = {};
            let m = fresh(4); const start = m.talkMood();
            talk(yoon, 17, m); out.soothed = m.talkMood() > start;
            const before = m.talkMood(); const potions = $gameParty.numItems($dataItems[1]);
            talk(yoon, 18, m, 1); out.offerGain = m.talkMood() - before; out.potionSpent = potions - $gameParty.numItems($dataItems[1]);
            yoon.changeLevel(3, false);
            const expBefore = yoon.currentExp();
            for (let i = 0; i < 12 && m.isAppeared(); i++) talk(yoon, 17, m);
            out.pacifiedLeft = !m.isAppeared(); out.buffed = $gameParty.members()[0]._buffs[2] > 0; out.exp = yoon.currentExp() - expBefore;
            const m2 = fresh(4); m2._siMood = 95; const e2 = yoon.currentExp(); talk(yoon, 17, m2); out.repeatExp = yoon.currentExp() - e2;
            const m3 = fresh(4); m3._siMood = 8; talk(pada, 21, m3); out.enraged = m3.isEnraged(); out.enragedRefuses = /too enraged/.test(talk(yoon, 17, m3));
            const m4 = fresh(4); const rnd = Math.random; Math.random = () => 0.5; talk(pada, 23, m4); talk(pada, 23, m4); Math.random = rnd; out.hunted = m4.isHunted() && !m4.canMove();
            const fb = new Game_Action(pada); fb.setSkill(16); out.finishing = fb.makeDamageValue(m4, false) === m4.hp;
            const orc = fresh(3); orc._siMood = 75; out.askInfo = /cave to the north/.test(talk(yoon, 19, orc)) && !orc.isAppeared();
            const slime = fresh(2); yoon.setHp(10); slime._siMood = 95; talk(sib, 20, slime); out.healed = yoon.hp > 10;
            $dataEnemies[4].siTalk.instant = [9]; const m5 = fresh(4); talk(A(9), 17, m5); out.instant = !m5.isAppeared(); $dataEnemies[4].siTalk.instant = [];
            out.noBattleExp = $gameTroop.expTotal();
            return out;
        });
        t.ok(r.soothed, 'Soothe calms the Minotaur');
        t.eq(r.potionSpent, 1, 'Offer gives the item away');
        t.ok(r.offerGain >= 25, 'a liked offering counts double (+' + r.offerGain + ')');
        t.ok(r.pacifiedLeft, 'a pacified enemy leaves');
        t.ok(r.buffed, "the Minotaur's outcome buffs the party");
        t.eq(r.exp, 40, 'the speaker earns the full Insight EXP');
        t.eq(r.repeatExp, 8, 'repeat successes earn 20%');
        t.ok(r.enraged && r.enragedRefuses, "a threatened, angry enemy becomes Enraged and won't listen");
        t.ok(r.hunted, 'two Stalks corner the animal');
        t.ok(r.finishing, 'Finishing Blow kills a Hunted animal outright');
        t.ok(r.askInfo, 'Ask gets information from a Calm enemy');
        t.ok(r.healed, "the Slime's outcome heals the party");
        t.ok(r.instant, '<Talk Instant> enemies yield to that speaker at once');
        t.eq(r.noBattleExp, 0, 'winning a battle gives no EXP');
    },

    'calm enemies stop attacking; soldiers spare children unless enraged': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            $gameTroop.setup(2); const slime = $gameTroop.members()[0];
            const valid = e => e.enemy().actions.filter(a => e.isActionValid(a)).map(a => $dataSkills[a.skillId].name);
            slime._siMood = 20; const hostile = valid(slime); slime._siMood = 80; const calm = valid(slime);
            $gameTroop.setup(3); const orc = $gameTroop.members()[0];
            const targets = () => { const seen = {}; for (let i = 0; i < 300; i++) { const a = new Game_Action(orc); a.setSkill(24); a.makeTargets().forEach(x => seen[x.name()] = 1); } return Object.keys(seen); };
            const normal = targets();
            [4, 5].forEach(id => { $gameActors.actor(id).addState(1); });
            const onlyKids = valid(orc);
            orc.addState(12); const enragedTargets = targets();
            return { hostile, calm, normal, onlyKids, enragedTargets };
        });
        t.ok(r.hostile.includes('Strike'), 'a hostile Slime attacks');
        t.ok(!r.calm.includes('Strike') && r.calm.includes('Offer Passage'), 'a calm Slime only offers passage: ' + r.calm);
        t.ok(!r.normal.includes('Yoon') && !r.normal.includes('Sib'), 'the Orc never targets children: ' + r.normal);
        t.eq(r.onlyKids.join(','), 'Demand Surrender', 'with only children left the Orc demands surrender');
        t.ok(r.enragedTargets.includes('Yoon') || r.enragedTargets.includes('Sib'), 'an Enraged Orc attacks children');
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
            out.noPatience = yoon.canUse($dataSkills[123]);
            $gameParty.addActor(12);
            out.canHeel = [yoon, sib, A(5)].every(a => a.canUse($dataSkills[123])) && !lasa.skills().some(s => s.id === 123);
            const heel = a => { const x = new Game_Action(a); x.setSkill(123); x.apply(a); };
            heel(sib); out.heeled = patience.isStateAffected(36);
            patience.makeActions(); out.guards = patience.action(0).isGuard();
            heel(sib); out.loose = !patience.isStateAffected(36);
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
            const snap = a => ({ mhp: a.mhp, atk: a.atk, mdf: a.mdf, luk: a.luk, eva: a.eva, conf: a.stateRate(8), tcr: a.tcr });
            const s1 = snap(sib); sib.changeLevel(15, false); const s15 = snap(sib); sib.changeLevel(40, false);
            const yoon = A(2), ghost = A(1); yoon.gainExp(200);
            return { s1, s15, cap: sib.level, yoon: yoon.level, ghost: ghost.level };
        });
        t.eq(r.s15.mhp, r.s1.mhp, 'Insight does not raise HP');
        t.eq(r.s15.atk, r.s1.atk, 'Insight does not raise ATK');
        t.eq(r.s15.mdf - r.s1.mdf, 14, 'MDF +1 per Insight');
        t.eq(r.s15.luk - r.s1.luk, 14, 'LUK +1 per Insight');
        t.between(r.s15.eva - r.s1.eva, 0.069, 0.071, 'evasion +0.5% per Insight');
        t.between(r.s15.conf, 0.71, 0.73, 'mental states land 28% less at Insight 15');
        t.between(r.s15.tcr / r.s1.tcr, 0.85, 0.87, 'Fatigue builds 14% slower at Insight 15');
        t.eq(r.cap, 15, "Sib's Insight cap is 15");
        t.eq(r.ghost, r.yoon, 'Ghost and Human Yoon share Insight');
    }
};
