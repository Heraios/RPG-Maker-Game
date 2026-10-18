// Armor sets, size rules for children, charms (SI_Outfits and friends), cowries.

module.exports = {
    'size rules: heavy gear for adults; Falmi and Yoon get helms and greaves; small shields for all': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n);
            const who = n => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(id => A(id).canEquip(AR(n))).map(id => A(id).name()).join(',');
            return { cuirass: who('Bronze Cuirass'), helm: who('Bronze Helm'), big: who('Bronze Shield'), small: who('Wicker Buckler'),
                     feather: who('Feather Crown'), cw: TextManager.currencyUnit };
        });
        t.eq(r.cuirass, 'Pada,Juda,Dama,Parl,Thenmy', 'heavy body armor: adults only');
        t.eq(r.helm, 'Yoon,Pada,Juda,Dama,Parl,Falmi,Thenmy', 'bronze helms: adults, Falmi and Yoon');
        t.eq(r.big, 'Pada,Juda,Dama,Parl,Falmi,Thenmy', 'large shields: adults and Falmi');
        t.eq(r.small, 'Yoon,Sib,Lasa,Pada,Juda,Dama,Parl,Tou,Falmi,Thenmy', 'small shields: everyone');
        t.eq(r.feather, 'Yoon,Sib,Juda', 'the Feather set is for priests');
        t.eq(r.cw, 'CW', 'money is cowries (CW)');
    },

    'set bonuses: two pieces, the full set, the evasion cap and the help line': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const O = SmokingIsle.Outfits, A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n);
            const wear = (a, ...names) => names.forEach(n => { const x = AR(n); a.forceChangeEquip(a.equipSlots().indexOf(x.etypeId), x); });
            const yoon = A(2), out = {};
            const sets = a => a.setBonusStates().map(s => s.name).join(',');
            out.start = sets(yoon);                                   // starts in Tapa Headband + Tapa Wrap
            const eva0 = yoon.eva;
            wear(yoon, 'Tapa Cape', 'Tapa Leg Wraps'); out.full = sets(yoon); out.evaGain = +(yoon.eva - eva0).toFixed(3);
            out.line = O.setLine(yoon, AR('Tapa Cape'));
            const cap = O.evasionCap; O.evasionCap = 0.07; out.capped = +(yoon.eva - eva0).toFixed(3); O.evasionCap = cap;
            const pada = A(5); const hp0 = pada.mhp; wear(pada, 'Goat-Skin Tunic', 'Goat-Skin Leggings'); out.goat = pada.mhp / hp0;
            const juda = A(6); juda.clearEquipments(); wear(juda, 'Feather Crown'); out.featherOne = sets(juda);
            return out;
        });
        t.eq(r.start, 'Tapa (2)', 'Yoon starts in two Tapa pieces: the small bonus');
        t.eq(r.full, 'Tapa (2),Tapa (all)', 'the whole set adds the full bonus');
        t.eq(r.evaGain, 0.05, 'the full Tapa set adds another 5% evasion');
        t.ok(/^Tapa set 4\/4/.test(r.line) && /✓all|✓4:/.test(r.line), 'the help box shows set progress: ' + r.line);
        t.eq(r.capped, 0.02, 'evasion from sets is capped (cap lowered to 7% for the test: 5% + 2%)');
        t.between(r.goat, 1.08, 1.12, 'two Goat-Skin pieces: +10% max HP');
        t.eq(r.featherOne, 'Feather (1)', 'a two-piece set gives its small bonus with one piece');
    },

    'set and charm effects in Talk, Insight, stealing, Voltaic and wear': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), W = n => $dataWeapons.find(w => w && w.name === n), out = {};
            const put = (a, n, k = 0) => { const x = AR(n); const slots = a.equipSlots().map((e, i) => e === x.etypeId ? i : -1).filter(i => i >= 0); a.forceChangeEquip(slots[k], x); };
            const pada = A(5), yoon = A(2);
            const fresh = id => { const e = new Game_Enemy(id, 0, 0); $gameTroop._enemies.push(e); return e; };
            const boar0 = fresh(1).talkMood();
            ['Boar-Hide Cap', 'Boar-Hide Vest', 'Boar-Hide Bracers', 'Boar-Hide Greaves'].forEach(n => put(pada, n));
            out.boarMood = fresh(1).talkMood() - boar0; out.goatMood = fresh(6).talkMood() - $dataEnemies[6].siTalk.mood;
            out.threatVsBoar = pada.talkEquipBonus('threaten', fresh(1)); out.threatVsGoat = pada.talkEquipBonus('threaten', fresh(6));
            put(pada, 'Bronze Signet'); out.askSoldier = pada.talkEquipBonus('ask', fresh(13)); out.askBoar = pada.talkEquipBonus('ask', fresh(1));
            const ins0 = SmokingIsle.Talk.yoonInsight(); put(yoon, 'Raven Feather'); out.insight = SmokingIsle.Talk.yoonInsight() - ins0;
            // Lava-Tube set: thieves can't grab anything
            const sib = A(3); put(sib, 'Glow Headband'); put(sib, 'Dark Wraps');
            const boy = fresh(8); const x = new Game_Action(boy); x.setSkill($dataSkills.find(s => s && s.name === 'Pilfer').id);
            const rnd = Math.random; Math.random = () => 0.5; sib.clearResult(); x.apply(sib); Math.random = rnd;
            out.stealProof = (sib._siPrankMessages || []).join(' ') + '|' + sib.equips().some(e => e && e.name === 'Silver Ring');
            // Voltaic: Lodestone, Hot-Spring Sinter, bronze makes you metal
            put(pada, 'Voltaic Pile', 0); pada._siCharge = undefined; out.charge0 = pada.maxCharge();
            put(pada, 'Lodestone', 1); out.charge1 = pada.maxCharge();
            put(pada, 'Hot-Spring Sinter', 2); pada._siCharge = 0; pada.onBattleStart(); out.sinter = pada.charge();
            const th = A(11); th.clearEquipments(); out.metalBefore = SmokingIsle.Voltaic.isMetal(th);
            ['Bronze Helm', 'Bronze Cuirass', 'Bronze Greaves', 'Bronze Shield'].forEach(n => put(th, n)); out.metal = SmokingIsle.Voltaic.isMetal(th);
            // wear
            put(yoon, 'Basalt Whetstone', 1); out.whet = yoon.wearChanceFor(W('Obsidian Knife'));
            put(yoon, 'Pumice Stone', 2); out.pumice = yoon.wearChanceFor(W('Obsidian Knife'));
            out.drops = (put(yoon, 'Bone Fishhook Pendant'), $gameParty.hasDropItemDouble());
            out.noSurprise = (put(yoon, 'Cave-Cricket Cage', 0), $gameParty.hasCancelSurprise());
            return out;
        });
        t.eq(r.boarMood, 15, 'full Boar Hide: boars start 15 mood friendlier');
        t.eq(r.goatMood, 0, '...but not goats');
        t.eq(r.threatVsBoar + '/' + r.threatVsGoat, '25/0', 'Threaten +25% only on boars');
        t.eq(r.askSoldier + '/' + r.askBoar, '25/0', 'Bronze Signet: Ask +25% only on soldiers');
        t.eq(r.insight, 1, 'Raven Feather: +1 Insight');
        t.ok(/can't get a grip/.test(r.stealProof) && /true$/.test(r.stealProof), 'Lava-Tube set: thieves can\'t steal: ' + r.stealProof);
        t.eq(r.charge1 - r.charge0, 1, 'Lodestone: the pile holds 1 more charge');
        t.eq(r.sinter, 1, 'Hot-Spring Sinter restores 1 charge at battle start');
        t.ok(!r.metalBefore && r.metal, 'the full Bronze set makes the wearer metal');
        t.eq(r.whet, 2.5, 'Basalt Whetstone halves weapon wear (5% -> 2.5%)');
        t.eq(r.pumice, 1.5, 'Pumice Stone takes off another point');
        t.ok(r.drops, 'Bone Fishhook Pendant: double drops');
        t.ok(r.noSurprise, 'Cave-Cricket Cage: no surprise attacks');
    },

    'combat charms: first hits, ranged, criticals, caves, crumbling ward, whispers, escape': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), ST = n => $dataStates.find(s => s && s.name === n).id, out = {};
            const put = (a, n, k = 0) => { const x = AR(n); const slots = a.equipSlots().map((e, i) => e === x.etypeId ? i : -1).filter(i => i >= 0); a.forceChangeEquip(slots[k], x); };
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.5; try { return f(); } finally { Math.random = rnd; } };
            const e = $gameTroop.members()[0], th = A(11), yoon = A(2), pada = A(5);
            // Tortoise Shell: first physical hit halved
            th.clearEquipments(); put(th, 'Tortoise-Shell Cuirass'); put(th, 'Tortoise-Shell Shield'); th.onBattleStart();
            const hit = () => fixed(() => { th.setHp(th.mhp); th.clearResult(); const x = new Game_Action(e); x.setAttack(); x.apply(th); return th.mhp - th.hp; });
            const first = hit(), second = hit(); out.guard = first / second;
            // Tapa: the first attack is likelier to miss
            ['Tapa Cape', 'Tapa Leg Wraps'].forEach(n => put(yoon, n)); yoon.onBattleStart();
            const x = new Game_Action(e); x.setAttack(); const evaFirst = x.itemEva(yoon); yoon._siFirstHitDone = true; out.firstEva = +(evaFirst - x.itemEva(yoon)).toFixed(2);
            // ranged boost
            put(pada, 'Juniper Bow'); const shot = () => fixed(() => { pada.onBattleStart(); const a = new Game_Action(pada); a.setSkill($dataSkills.find(s => s && s.name === 'Aimed Shot').id); return a.makeDamageValue(e, false); });
            const s0 = shot(); put(pada, 'Yew Bead Bracelet'); out.ranged = shot() / s0;
            // criticals against the wounded
            put(pada, 'Vulture Feather', 1); const jab = new Game_Action(pada); jab.setAttack();
            e.setHp(e.mhp); const c0 = jab.itemCri(e); e.setHp(1); out.crit = +(jab.itemCri(e) - c0).toFixed(2); e.setHp(e.mhp);
            // caves
            put(pada, 'Cave-Glow Stone', 2); const h0 = jab.itemHit(e); const map = $dataMap; $dataMap = { note: '<Cave>' }; out.cave = +(jab.itemHit(e) - h0).toFixed(2); $dataMap = map;
            // prayer strip
            const sib = A(3); put(sib, 'Bark-Paper Prayer Strip'); sib.addState(ST('Confused'));
            out.ward = !sib.isStateAffected(ST('Confused')) && !sib.equips().some(q => q && q.name === 'Bark-Paper Prayer Strip') && /crumbles/.test((sib._siWearMessages || []).join(''));
            // coral eye whispers
            const lasa = A(4); put(lasa, 'Coral Eye Fragment'); const rnd = Math.random; Math.random = () => 0.01; lasa.onTurnEnd(); Math.random = rnd;
            out.whisper = lasa.isStateAffected(ST('Despair'));
            // escape
            BattleManager.makeEscapeRatio(); const r0 = BattleManager._escapeRatio; put(yoon, "Sailor's Compass", 1); BattleManager.makeEscapeRatio(); out.escape = +(BattleManager._escapeRatio - r0).toFixed(2);
            out.bell = AR('Phonolite Bell').siOutfit.enemyStartState === ST('Disoriented');
            return out;
        });
        t.between(r.guard, 0.45, 0.55, 'Tortoise Shell: the first physical hit is halved (x' + r.guard.toFixed(2) + ')');
        t.eq(r.firstEva, 0.25, 'full Tapa: +25% evasion against the first attack');
        t.between(r.ranged, 1.07, 1.13, 'Yew Bead Bracelet: ranged +10% (x' + r.ranged.toFixed(2) + ')');
        t.eq(r.crit, 0.15, 'Vulture Feather: +15% critical on the wounded');
        t.eq(r.cave, 0.1, 'Cave-Glow Stone: +10% hit in caves');
        t.ok(r.ward, 'the prayer strip blocks a mental ailment and crumbles');
        t.ok(r.whisper, 'the Coral Eye Fragment whispers Despair');
        t.between(r.escape, 0.2, 0.23, "Sailor's Compass: escape +20% (plus a little from its AGI)");
        t.ok(r.bell, 'the Phonolite Bell disorients enemies at battle start');
    }
};
