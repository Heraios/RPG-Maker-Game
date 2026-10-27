// Patience's orders, priorities and gear; the Islanders' Battery slot; codex literacy.

module.exports = {
    "Patience: orders, priority moves and her own gear": async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), SK = n => $dataSkills.find(s => s && s.name === n), AR = n => $dataArmors.find(a => a && a.name === n),
                  ST = n => SmokingIsle.Ailments.stateByName(n), out = {};
            $gameParty.removeActor(4); $gameParty.addActor(7); $gameParty.addActor(12);
            const sib = A(3), dama = A(7), pat = A(12), enemy = $gameTroop.members()[0];
            const order = (who, n, target) => { const x = new Game_Action(who); x.setSkill(SK(n).id); target.clearResult(); x.apply(target); };
            const plan = () => { pat.makeActions(); const a = pat.action(0); return a && a.item() ? a.item().name : 'guard'; };
            // left alone she only bites, growls and points
            const free = new Set(); for (let i = 0; i < 60; i++) free.add(plan());
            out.free = [...free].sort().join(',');
            // Sic 'Em!: Ankle Bite on the enemy Sib picked
            order(sib, "Sic 'Em!", enemy); pat.makeActions(); out.sic = pat.action(0).item().name + '@' + pat.action(0)._targetIndex;
            out.sicOnce = plan() !== 'Ankle Bite' || plan() !== 'Ankle Bite';
            order(sib, "Catch 'Em!", enemy); out.catch = plan();
            // Speak!: a sleeper first, else spirits, else Growl
            sib.addState(ST('Sleep')); order(A(2), 'Speak!', A(2)); out.speakSleep = plan(); sib.removeState(ST('Sleep'));
            order(A(2), 'Speak!', A(2)); out.speakNone = plan();
            // Fetch!: nothing thrown, she acts on her own; after Dama throws, she fetches for Dama
            order(sib, 'Fetch!', sib); out.fetchNothing = plan();
            const rs = dama.slotOfType(6); dama._siAmmoUsed = {}; dama._siAmmoUsed[rs + ':throw'] = 1;
            const left0 = dama.ammoLeft(rs, SK('Hurl Javelin'));
            order(sib, 'Fetch!', sib); pat.makeActions(); const fa = pat.action(0);
            out.fetch = fa.item().name + '>' + fa.makeTargets()[0].name();
            dama.clearResult(); fa.apply(dama); out.fetched = dama.ammoLeft(rs, SK('Hurl Javelin')) - left0;
            // priorities: wet first (Shake Off), then a frightened child (Nuzzle)
            pat.addState(ST('Wet')); out.wet = plan(); pat.useItem(SK('Shake Off')); out.dried = !pat.isStateAffected(ST('Wet'));
            sib.addState(ST('Despair')); pat.makeActions(); out.nuzzle = pat.action(0).item().name + '>' + pat.action(0).makeTargets()[0].name(); sib.removeState(ST('Despair'));
            // Heel: she guards, but an order still gets through
            pat.addState(6); out.heeled = plan(); order(sib, "Sic 'Em!", enemy); out.heeledOrder = plan(); pat.removeState(6);
            // Point: the party's next damaging hit is a critical; Hold: no dodging or fleeing
            enemy.addState(ST('Pointed Out')); const hit = new Game_Action(A(2)); hit.setSkill(1); out.crit = hit.itemCri(enemy);
            enemy.addState(ST('Held')); out.held = enemy.isHeld() && enemy.eva <= 0;
            // gear slots
            out.slots = pat.equipSlots().map((e, i) => pat.equipSlotName(i)).join(',');
            // Javelin Pack: everyone gets one more throw
            dama._siAmmoUsed = {}; const t0 = dama.ammoLeft(rs, SK('Hurl Javelin'));
            pat.forceChangeEquip(pat.slotOfType(17), AR('Javelin Pack')); out.pack = dama.ammoLeft(rs, SK('Hurl Javelin')) - t0;
            // Spiked collar bites back; Salt-Pouch collar guards against spirits
            pat.forceChangeEquip(pat.slotOfType(9), AR('Obsidian-Spiked Collar'));
            const boar = $gameTroop.members()[0]; boar.setHp(boar.mhp); const strike = new Game_Action(boar); strike.setSkill(656);
            const hp0 = boar.hp; strike.executeHpDamage(pat, 10); out.spikes = hp0 - boar.hp;
            const owl = new Game_Enemy(12, 0, 0); $gameTroop._enemies.push(owl); const claw = new Game_Action(owl); claw.setSkill(656);
            const rnd = Math.random; Math.random = () => 0.5;
            pat.forceChangeEquip(pat.slotOfType(9), null); const plain = claw.makeDamageValue(pat, false);
            pat.forceChangeEquip(pat.slotOfType(9), AR('Salt-Pouch Collar')); const salted = claw.makeDamageValue(pat, false);
            Math.random = rnd; out.salt = salted < plain;
            // Copper Bell: no ambushes
            pat.forceChangeEquip(pat.slotOfType(19), AR('Copper Bell')); out.noAmbush = $gameParty.hasCancelSurprise();
            // Medicine Pack: the first fallen ally is pulled back up, once
            pat.forceChangeEquip(pat.slotOfType(17), AR('Medicine Pack')); pat._siDragBackUsed = false;
            const phase = BattleManager._phase;
            sib.addState(sib.deathStateId()); BattleManager.endAction(); out.dragged = sib.isAlive() && sib.hp === 1;
            sib.clearResult(); sib.addState(sib.deathStateId()); BattleManager.endAction(); out.onlyOnce = sib.isDead();
            sib.removeState(sib.deathStateId()); sib.setHp(sib.mhp); BattleManager._phase = phase;
            return out;
        });
        t.eq(r.free, 'Bite,Growl,Point', 'left alone, Patience only bites, growls and points');
        t.eq(r.sic, 'Ankle Bite@0', "Sic 'Em!: Ankle Bite on the enemy picked");
        t.ok(r.sicOnce, 'an order is used once');
        t.eq(r.catch, 'Hold', "Catch 'Em!: Hold");
        t.eq(r.speakSleep, 'Alarm Bark', 'Speak!: Alarm Bark when someone is asleep');
        t.eq(r.speakNone, 'Growl', 'Speak!: Growl when nobody sleeps and there are no spirits');
        t.ok(['Bite', 'Growl', 'Point'].includes(r.fetchNothing), 'Fetch! with nothing thrown: she acts on her own');
        t.eq(r.fetch, 'Fetch>Dama', 'Fetch!: she fetches for whoever threw');
        t.eq(r.fetched, 1, 'Fetch gives back one throw');
        t.eq(r.wet, 'Shake Off', 'wet: Shake Off comes first');
        t.ok(r.dried, 'Shake Off dries her');
        t.eq(r.nuzzle, 'Nuzzle>Sib', 'a child in Despair: Nuzzle comes first');
        t.eq(r.heeled, 'Guard', 'heeled: she guards');
        t.eq(r.heeledOrder, 'Ankle Bite', 'heeled, an order still gets through');
        t.eq(r.crit, 1, 'Pointed Out: the next hit is a critical');
        t.ok(r.held, 'Held: no dodging, no fleeing');
        t.eq(r.slots, 'Collar,Pack,Booties,Bell', 'Patience has Collar, Pack, Booties and Bell slots');
        t.eq(r.pack, 1, 'Javelin Pack: +1 throw for Dama');
        t.eq(r.spikes, 3, 'Spiked collar: the biter takes 30% back');
        t.ok(r.salt, 'Salt-Pouch Collar: less damage from spirits');
        t.ok(r.noAmbush, 'Copper Bell: no surprise attacks');
        t.ok(r.dragged, 'Medicine Pack: a fallen ally is pulled up at 1 HP');
        t.ok(r.onlyOnce, 'Medicine Pack: once a battle');
    },

    'Battery slot for Islanders; codices by literacy': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), out = {};
            const names = a => a.skills().map(s => s.name);
            const codexOn = (a, n) => { const s = a.slotOfType(8); a.forceChangeEquip(s, AR(n)); a.refresh(); return names(a); };
            out.piles = [2, 3, 5, 6, 7].map(id => { const a = A(id), s = a.slotOfType(20); return s >= 0 && a.equips()[s] && a.equips()[s].name; }).join(',');
            out.noBattery = [4, 8, 9, 10, 11].every(id => A(id).slotOfType(20) < 0);
            const th = A(11), thSk = codexOn(th, 'Codex of Mending');
            out.theenmy = ['Mahu', 'Mahuben', 'Mahugun', 'Ara', 'Araben', 'Mahu-Ara', 'Field Dressing'].every(n => thSk.includes(n));
            const parl = A(8), pSk = codexOn(parl, "Sailor's Codex");
            out.parl = ['Rari', 'Hagu', 'Keri', 'Read the Wind'].every(n => pSk.includes(n)) && !pSk.includes('Rariben');
            const yoon = A(2), ySk = codexOn(yoon, 'Codex of Embers');
            out.yoon = ySk.includes('Fire Drill') && !ySk.includes('Ahigun');
            const sib = A(3); $gameSwitches.setValue(5, false); const s0 = codexOn(sib, 'Codex of Embers');
            $gameSwitches.setValue(5, true); sib.refresh(); const s1 = names(sib); $gameSwitches.setValue(5, false);
            out.sib = s0.includes('Fire Drill') && !s0.includes('Ahigun') && s1.includes('Ahigun') && !s1.includes('Ahisin');
            out.readers = [2, 3, 6, 8, 9, 10, 11].every(id => A(id).hasCodexSlot()) && ![4, 5, 7].some(id => A(id).hasCodexSlot());
            out.padaCant = !A(5).canEquip(AR('Codex of Embers'));
            return out;
        });
        t.eq(r.piles, 'Voltaic Pile,Voltaic Pile,Voltaic Pile,Voltaic Pile,Voltaic Pile', 'every Islander starts with a pile in the Battery slot');
        t.ok(r.noBattery, 'non-Islanders have no Battery slot');
        t.ok(r.theenmy, 'Thenmy: all six spells and the Cultural move from a codex');
        t.ok(r.parl, 'Parl: the three weaker spells and the move');
        t.ok(r.yoon, 'Yoon reads Islander only: just the move');
        t.ok(r.sib, 'Sib learns Seafarer script later: the weaker spells then');
        t.ok(r.readers, 'readers have a codex slot; Lasa, Pada and Dama do not');
        t.ok(r.padaCant, 'Pada can\'t equip a codex');
    }
};
