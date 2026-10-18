// Spells (SI_Magic), damage types (SI_DamageTypes), elemental states (SI_ElementalStates).

module.exports = {
    'healing and revival spells': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), S = id => $dataSkills[id];
            const sib = A(3), yoon = A(2), pada = A(5), lasa = A(4);
            const cast = (id, targets) => { const a = new Game_Action(sib); a.setSkill(id); targets.forEach(x => { x.clearResult(); a.apply(x); }); };
            yoon.setHp(5); cast(266, [yoon]); const mahu = yoon.hp;
            const ara = []; for (let i = 0; i < 20; i++) { lasa.clearResult(); lasa.addState(1); cast(269, [lasa]); ara.push(lasa.hp); }
            lasa.clearResult(); lasa.addState(1); cast(270, [lasa]); const araben = lasa.hp;
            yoon.setHp(10); pada.setHp(50); lasa.clearResult(); lasa.addState(1);
            const ma = new Game_Action(sib); ma.setSkill(271); const targets = ma.makeTargets(); targets.forEach(x => ma.apply(x));
            const hits = {}; for (let i = 0; i < 300; i++) { const a = new Game_Action(sib); a.setSkill(247); const n = a.makeTargets().length; hits[n] = 1; }
            return { mahu, araMin: Math.min(...ara), araMax: Math.max(...ara), araben, maTargets: targets.length, pada: pada.hp, lasaUp: lasa.isAlive(), hariCounts: Object.keys(hits).map(Number).sort() };
        });
        t.eq(r.mahu, 30, 'Mahu heals 33% max HP + MAT (5 + 13 + 12)');
        t.ok(r.araMin >= 3 && r.araMax <= 32 && r.araMax > r.araMin, `Ara revives with 10-100% HP (${r.araMin}..${r.araMax})`);
        t.eq(r.araben, 24, 'Araben revives with 75%');
        t.eq(r.pada, 108, 'Mahu-Ara heals the living 20% + 3x MAT');
        t.ok(r.lasaUp, 'Mahu-Ara revives the fallen');
        t.eq(r.hariCounts.join(','), '2,3,4,5', '-hari spells hit 2-5 times');
    },

    'damage types, resistances and magic sources': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id);
            const pada = A(5), sib = A(3), tou = A(9), yoon = A(2), ghost = A(1);
            tou.clearEquipments();   // compare bodies, not gear
            [242, 248].forEach(id => sib.learnSkill(id));
            const avg = (a, id, x, n = 300) => { let s = 0; for (let i = 0; i < n; i++) { const act = new Game_Action(a); act.setSkill(id); s += act.makeDamageValue(x, false); } return s / n; };
            const out = { chopYoon: avg(pada, 73, yoon), chopTou: avg(pada, 73, tou), ahiYoon: avg(sib, 242, yoon), ahiTou: avg(sib, 242, tou),
                          rariTou: avg(sib, 248, tou), chopGhost: avg(pada, 73, ghost), ahiGhost: avg(sib, 242, ghost) };
            const slime = new Game_Enemy(9, 0, 0); $gameTroop._enemies.push(slime);   // any enemy, made fire-immune
            slime.elementRate = id => id === 10 ? 0 : 1;
            out.fireImmuneAhi = avg(sib, 242, slime); out.fireImmuneSpark = avg(sib, 206, slime);   // Live Wire
            return out;
        });
        t.ok(r.chopTou > r.chopYoon * 1.2, 'Heavy Chop (mostly Cut) hurts Tou more');
        t.ok(r.ahiTou > r.ahiYoon * 1.6, 'fire (Burn) hurts Tou about double');
        t.ok(r.rariTou < r.ahiTou / 2, 'water (Pierce/Crush) is resisted by Tou');
        t.ok(r.chopGhost <= 4, 'the Ghost shrugs off physical damage (' + r.chopGhost + ')');
        t.ok(r.ahiGhost > r.ahiYoon * 1.5, 'the Ghost takes heavy magic damage');
        t.eq(r.fireImmuneAhi, 0, 'a fire-immune enemy ignores fire-source magic');
        t.ok(r.fireImmuneSpark > 0, 'but still takes electric Burn');
    },

    'elemental state cycle and extra turns': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const sib = $gameActors.actor(3);
            const e = new Game_Enemy(11, 0, 0); $gameTroop._enemies.push(e); e.addParam(0, 500); e.setHp(e.mhp);
            const names = () => e.states().filter(s => s.name !== 'Enraged').map(s => s.name).sort().join(',');   // repeated hits enrage it
            const cast = id => { e.clearResult(); sib._siExtraTurn = false; const a = new Game_Action(sib); a.setSkill(id); a.apply(e); return names() + (sib._siExtraTurn ? '+EXTRA' : ''); };
            return [cast(242), cast(254), cast(242), cast(248), cast(260), cast(242)];
        });
        t.eq(r[0], 'Smoldering', 'fire inflicts Smoldering');
        t.eq(r[1], 'Disoriented,Enflamed', 'wind upgrades Smoldering and inflicts Disoriented');
        t.eq(r[2], 'Enflamed,Feverish', 'fire upgrades Disoriented');
        t.eq(r[3], 'Feverish,Steam,Wet+EXTRA', 'water washes off Enflamed into Steam, extra turn');
        t.eq(r[4], 'Burdened,Grounded,Sodden,Steam+EXTRA', 'earth upgrades Wet and purges Feverish, extra turn');
        t.eq(r[5], 'Cracked,Grounded,Smoldering,Sodden,Steam', 'fire purges Burdened into Cracked');
    },

    'elemental states over real turns: ticking, skipping, seals, messages and extra turns': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, e = $gameTroop.members()[0], sib = $gameActors.actor(3);
            e.addParam(0, 2000 - e.mhp); e.setHp(e.mhp);   // 2000 HP
            const ownTurn = () => { e.onCtbTurnStart(); const skip = BattleManager.ctbShouldSkipTurn(e); e.onTurnEnd(); return skip; };
            e.addState(72); const hp0 = e.hp, ticks = [];
            for (let i = 0, prev = hp0; i < 4; i++) { ownTurn(); ticks.push(prev - e.hp); prev = e.hp; }
            out.smolder = ticks.join(',') + (e.isStateAffected(72) ? ' still' : ' gone');
            e.setHp(e.mhp); e.addState(73); out.enflamedSkips = [ownTurn(), ownTurn(), ownTurn()].join(',');
            e.clearStates(); e.addState(77); out.miredStrike = e.canUse($dataSkills[372]);
            const jab = () => { let s = 0; for (let i = 0; i < 400; i++) { const x = new Game_Action($gameActors.actor(5)); x.setSkill(72); s += x.makeDamageValue(e, false); } return s; };
            e.clearStates(); const base = jab(); out.taken = [74, 75, 80].map(id => { e.addState(id); const v = jab() / base; e.removeState(id); return v; });
            e.addState(79); e._siFeverTurn = true; const lash = new Game_Action(e); lash.setConfusion(); out.lash = lash.item().name; e._siFeverTurn = false;
            e.clearStates(); e.clearResult(); e.setHp(5); e.addState(73); e.onTurnEnd(); out.burnKills = e.isDead(); e.revive(); e.setHp(e.mhp); e.clearStates();
            e.clearStates(); e.addState(72);
            const air = new Game_Action(sib); air.setSkill(254); e.clearResult(); air.apply(e);
            out.upgradeMsgs = e.result().addedStates.map(id => $dataStates[id].name).join(',') + ' / removed: ' + e.result().removedStates.map(id => $dataStates[id].name).join(',');
            return out;
        });
        t.eq(r.smolder, '100,100,100,0 gone', 'Smoldering takes 5% on each of 3 own turns, then ends');
        t.eq(r.enflamedSkips, 'true,false,true', 'Enflamed loses every other turn');
        t.eq(r.miredStrike, false, "a Mired enemy can't Strike");
        t.between(r.taken[0], 1.10, 1.20, 'Wet: about +15% physical damage taken');
        t.between(r.taken[1], 1.29, 1.41, 'Sodden: about +35%');
        t.between(r.taken[2], 1.52, 1.68, 'Cracked: about +60%');
        t.eq(r.lash, 'Boar Club', 'a Feverish enemy lashes out with its own attack');
        t.ok(r.burnKills, "burning can kill");
        t.eq(r.upgradeMsgs, 'Enflamed,Disoriented / removed: ', 'an upgrade shows no "wears off" line for the base state');

        // A live turn: removing Mired with fire hands the caster the very next turn.
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const first = await h.eval(() => {
            const a = BattleManager.actor(), e = $gameTroop.members()[0], sc = SceneManager._scene;
            e.addState(77); a.learnSkill(242); a.setMp(99);
            const act = a.inputtingAction(); act.setSkill(242); act.setTarget(0);
            sc._actorCommandWindow.deactivate(); sc.selectNextCommand(); return a.name();
        });
        t.eq(await h.toCommand(), 'input', 'the battle reached the next command menu');
        const next = await h.eval(() => ({ name: BattleManager.actor().name(), cracked: $gameTroop.members()[0].isStateAffected(80) }));
        t.ok(next.cracked, 'fire on Mired leaves Cracked');
        t.eq(next.name, first, 'the caster acts again at once');
    }
};
