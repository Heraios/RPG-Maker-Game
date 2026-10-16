// Islander electrical techniques (SI_Voltaic).

module.exports = {
    'charge, techniques, water and metal': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), S = n => $dataSkills.find(s => s && s.name === n), IT = n => $dataItems.find(i => i && i.name === n), out = {};
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.3; try { return f(); } finally { Math.random = rnd; } };
            const pile = $dataArmors.find(a => a && a.name === 'Voltaic Pile');
            const sib = A(3), pada = A(5), yoon = A(2);
            [sib, pada, yoon].forEach(a => { a.forceChangeEquip(a.slotOfType(5), pile); a._siCharge = undefined; });
            const use = (who, name, target) => fixed(() => { const sk = S(name); const x = new Game_Action(who); x.setSkill(sk.id); who.useItem(sk); target.clearResult(); x.apply(target); return target.result(); });
            out.start = pada.charge();
            const e = $gameTroop.members()[0];
            out.canLive = pada.canUse(S('Live Wire'));
            use(pada, 'Live Wire', e); out.afterOne = pada.charge();
            // metal bonus: the Marine wears bronze
            const marine = new Game_Enemy(13, 0, 0); $gameTroop._enemies.push(marine);
            const avg = (who, name, tgt) => { let s = 0; for (let i = 0; i < 300; i++) { const x = new Game_Action(who); x.setSkill(S(name).id); s += x.makeDamageValue(tgt, false); } return s / 300; };
            const plain = new Game_Enemy(13, 0, 0); plain.enemy = () => Object.assign({}, $dataEnemies[13], { siMetal: false });
            out.metalRatio = avg(pada, 'Live Wire', marine) / avg(pada, 'Live Wire', plain);
            // water conducts
            const dry = avg(pada, 'Live Wire', e); e.addState(16); const wet = avg(pada, 'Live Wire', e); out.wetRatio = wet / dry;
            e.removeState(16); e.addState(17); use(pada, 'Live Wire', e); out.soddenStun = e.isStateAffected(38);
            // Fire Wire feeds the elemental cycle
            e.clearStates(); use(pada, 'Fire Wire', e); out.fireWire = e.isStateAffected(14);
            // empty pile
            out.empty = pada.charge(); out.blocked = !pada.canUse(S('Live Wire'));
            // acid jar refills 2
            $gameParty.gainItem(IT('Acid Jar'), 1); fixed(() => { const x = new Game_Action(sib); x.setItem(IT('Acid Jar').id); x.apply(pada); }); out.refilled = pada.charge();
            // cautery stops bleed and venom at a small cost
            yoon.addState(28); yoon.addState(4); const hp = yoon.hp; use(sib, 'Electric Cautery', yoon);
            out.cautery = !yoon.isStateAffected(28) && !yoon.isStateAffected(4) && yoon.hp < hp;
            // quickening current
            yoon.addState(10); use(sib, 'Quickening Current', yoon); out.quicken = !yoon.isStateAffected(10);
            // galvanic jolt: needs 2+, spends all, revives
            sib._siCharge = 3; yoon.addState(1); use(sib, 'Galvanic Jolt', yoon); out.jolt = yoon.isAlive() && sib.charge() === 0;
            // tender
            SmokingIsle.Voltaic.rechargeAll(); out.tender = [sib.charge(), pada.charge()].join('/');
            // who knows what
            const knows = (id, n) => $gameActors.actor(id).isLearnedSkill(S(n).id);
            out.sibQuicken = knows(3, 'Quickening Current'); out.sibChlorine = knows(3, 'Chlorine Cloud');
            out.damaNet = knows(7, 'Shock Net') && knows(7, 'Lye Flask'); out.lasaNone = !knows(4, 'Live Wire');
            return out;
        });
        t.eq(r.start, 3, 'a Voltaic Pile starts with 3 charge');
        t.ok(r.canLive, 'Live Wire is usable with a pile');
        t.eq(r.afterOne, 2, 'a technique spends charge');
        t.between(r.metalRatio, 1.6, 1.9, 'Live Wire hits metal-wearing enemies much harder (x' + r.metalRatio.toFixed(2) + ')');
        t.between(r.wetRatio, 1.6, 1.9, 'electricity does +50% to a Wet target, on top of Wet\'s own +15% (x' + r.wetRatio.toFixed(2) + ')');
        t.ok(r.soddenStun, 'a Sodden target is stunned');
        t.ok(r.fireWire, 'Fire Wire sets the target Smoldering');
        t.eq(r.empty, 0, 'the pile runs dry');
        t.ok(r.blocked, "and techniques can't be used");
        t.eq(r.refilled, 2, 'an Acid Jar restores 2 charge');
        t.ok(r.cautery, 'Electric Cautery stops Bleed and Venom at a small HP cost');
        t.ok(r.quicken, 'Quickening Current wakes an ally');
        t.ok(r.jolt, 'Galvanic Jolt revives, spending all charge');
        t.eq(r.tender, '3/3', 'a battery tender recharges every pile');
        t.ok(r.sibQuicken && !r.sibChlorine, 'Sib starts with Quickening Current; Chlorine Cloud comes from Juda\'s notes');
        t.ok(r.damaNet, 'Dama knows Shock Net and Lye Flask');
        t.ok(r.lasaNone, 'non-Islanders have no techniques');
    },

    'a Wet user shocks themself (live battle)': async (h, t) => {
        await h.battle();
        // Lasa isn't an Islander and can't wear a pile, so let her turn pass.
        for (let k = 0; k < 6; k++) {
            t.eq(await h.toCommand(), 'input', 'reached a command menu');
            if (await h.eval(() => BattleManager.actor().name() !== 'Lasa')) break;
            await h.eval(() => { const sc = SceneManager._scene; BattleManager.inputtingAction().setGuard(); sc._actorCommandWindow.deactivate(); sc.selectNextCommand(); });
        }
        const r = await h.eval(() => {
            const a = BattleManager.actor(), pile = $dataArmors.find(x => x && x.name === 'Voltaic Pile');
            window.__log = []; const add = Window_BattleLog.prototype.addText; Window_BattleLog.prototype.addText = function(x) { window.__log.push(x); add.call(this, x); };
            a.forceChangeEquip(a.slotOfType(5), pile); a._siCharge = 3; a.addState(16);
            const act = a.inputtingAction(); act.setSkill($dataSkills.find(s => s && s.name === 'Live Wire').id); act.setTarget(0);
            const sc = SceneManager._scene; sc._actorCommandWindow.deactivate(); sc.selectNextCommand();
            return { name: a.name(), hp: a.hp };
        });
        for (let i = 0; i < 60; i++) { if (await h.eval(() => window.__log.some(x => /own current/.test(x)))) break; await h.page.waitForTimeout(50); }
        const after = await h.eval(n => ({ log: window.__log.join(' / '), hp: $gameParty.members().find(a => a.name() === n).hp }), r.name);
        t.ok(/shocked by their own current/.test(after.log), 'the log says so: ' + after.log);
        t.ok(after.hp < r.hp, 'and it costs HP');
    }
};
