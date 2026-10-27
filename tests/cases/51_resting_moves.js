// Each character's own resting move (SI_Resting): Sib's Meditate, Lasa's Land and Fly, Dama's Diver's
// Breath, Parl's Slouch, Tou's Oil Joints, Falmi's Photosynthesize, Aday's Tinker, Kathrout's Take Notes
// and Thenmy's Parade Rest.

module.exports = {
    'resting moves': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, A = id => $gameActors.actor(id), SK = n => $dataSkills.find(s => s && s.name === n);
            const ST = n => SmokingIsle.Ailments.stateByName(n);
            const use = (a, name) => { const act = new Game_Action(a); act.setSkill(SK(name).id); a.useItem(act.item()); act.apply(a); };
            const can = (a, name) => a.canUse(SK(name));
            const turnEnd = a => { a.onTurnEnd(); };
            // who knows what
            const knows = { 3: 'Meditate', 4: 'Land', 7: "Diver's Breath", 8: 'Slouch', 9: 'Oil Joints', 10: 'Photosynthesize', 13: 'Tinker', 14: 'Take Notes', 11: 'Parade Rest' };
            out.known = Object.keys(knows).every(id => A(Number(id)).isLearnedSkill(SK(knows[id]).id));
            // Sib: Meditate
            const sib = A(3);
            sib.setTp(70); out.medLow = can(sib, 'Meditate');
            sib.setTp(80); sib.setMp(0); out.medHigh = can(sib, 'Meditate');
            use(sib, 'Meditate'); out.medSeal = !can(sib, 'Ahi') && sib.isSkillTypeSealed(1);
            turnEnd(sib); out.med = [sib.tp, sib.mp, sib.mmp];
            // Lasa: Land and Fly
            const lasa = A(4);
            out.flyingBefore = SmokingIsle.Ranged.isFlying(lasa);
            const def = lasa.def; use(lasa, 'Land');
            out.landed = !SmokingIsle.Ranged.isFlying(lasa) && lasa.def < def && !can(lasa, 'Land') && can(lasa, 'Fly');
            lasa.setTp(50); turnEnd(lasa); out.landTp = lasa.tp;
            use(lasa, 'Fly'); out.flies = SmokingIsle.Ranged.isFlying(lasa) && !lasa.isStateAffected(ST('Landed'));
            // Dama: Diver's Breath, only while Weary
            const dama = A(7);
            dama.setTp(90); out.diveNotWeary = can(dama, "Diver's Breath");
            dama.setTp(100); out.weary = dama.isWeary(); out.diveWeary = can(dama, "Diver's Breath");
            use(dama, "Diver's Breath"); out.dive = [dama.tp, dama.isWeary()];
            // Parl: Slouch
            const parl = A(8);
            parl.setTp(65); use(parl, 'Slouch');
            out.slouchOnly = can(parl, 'Guard') && can(parl, 'Stop Slouching') && !can(parl, 'Quick Jab') && !parl.canUse($dataItems.find(i => i && i.name === 'Bandage'));
            turnEnd(parl); turnEnd(parl); out.slouchTp = parl.tp;
            use(parl, 'Stop Slouching'); out.stopped = !parl.isStateAffected(ST('Slouching')) && can(parl, 'Quick Jab');
            // Tou: Oil Joints
            $gameParty.addActor(9); const tou = A(9); tou._siSkillUses = {};
            tou.setTp(60); const agi = tou.agi, fire = tou.elementRate(10), tps = [];
            for (let i = 0; i < 3; i++) { const b = tou.tp; use(tou, 'Oil Joints'); tps.push(b - tou.tp); }
            out.oil = tps.join('/'); out.oilAgi = tou.agi > agi; out.oilFire = (tou.elementRate(10) / fire).toFixed(2);
            out.oilOne = ['Oiled Joints I', 'Oiled Joints II', 'Oiled Joints III'].filter(n => tou.isStateAffected(ST(n))).join();
            out.oilFourth = can(tou, 'Oil Joints');
            // Falmi: Photosynthesize
            $gameParty.addActor(10); const falmi = A(10);
            falmi.setHp(falmi.mhp); out.photoFull = can(falmi, 'Photosynthesize');
            falmi.setHp(Math.floor(falmi.mhp / 3)); falmi.setTp(40); out.photoLow = can(falmi, 'Photosynthesize');
            use(falmi, 'Photosynthesize'); out.photo = [falmi.hp === falmi.mhp, falmi.tp];
            out.noMeal = !!falmi.mealRefusal() && SmokingIsle.Idols.mealProblem(falmi, $dataItems.find(i => i && i.name === 'Taro')) !== '';
            SmokingIsle.Idols.rest(); out.mealAgain = falmi.mealRefusal() === null;
            // Aday: Tinker
            $gameParty.addActor(13); const aday = A(13);
            aday.setTp(80); aday.gainCharge(-99); const ch = aday.charge();
            use(aday, 'Tinker'); out.tinker = [aday.tp, aday.charge() - ch, /<Turn Cost:\s*140>/.test(SK('Tinker').note)];
            out.recharge = !!SK('Recharge') && aday.isLearnedSkill(SK('Recharge').id);
            // Kathrout: Take Notes
            $gameParty.addActor(14); const kath = A(14);
            kath.setTp(75); use(kath, 'Take Notes');
            out.notes = [kath.tp, kath.skillMpCost(SK('Ahi')), SK('Ahi').mpCost];
            const spell = SK('Ahi'); kath.useItem(spell); out.notesGone = !kath.isStateAffected(ST('Notes in Hand'));
            // Thenmy: Parade Rest
            $gameParty.addActor(11); const thenmy = A(11);
            thenmy.setTp(80); use(thenmy, 'Parade Rest'); out.parade = [thenmy.tp, thenmy.isStateAffected(3)];
            return out;
        });
        t.eq(r.known, true, 'each character knows their resting move');
        t.eq(r.medLow + '/' + r.medHigh, 'false/true', 'Meditate: above 75 Fatigue');
        t.eq(r.medSeal, true, 'no Magical skills while meditating');
        t.eq(r.med[0] + '/' + r.med[1], '70/' + Math.floor(r.med[2] * 0.2), 'Meditate: 10 Fatigue and 20% Mana a turn');
        t.eq(r.flyingBefore, true, 'Lasa flies');
        t.eq(r.landed, true, 'Land: grounded, lower Endurance, Fly instead of Land');
        t.eq(r.landTp, 45, 'Landed: 5 Fatigue a turn');
        t.eq(r.flies, true, 'Fly ends it');
        t.eq(r.diveNotWeary + '/' + r.weary + '/' + r.diveWeary, 'false/true/true', "Diver's Breath: only while Weary");
        t.eq(r.dive.join('/'), '85/false', "Diver's Breath: 15 Fatigue and Weary gone");
        t.eq(r.slouchOnly, true, 'Slouching: only Guard or Stop Slouching, no items');
        t.eq(r.slouchTp, 35, 'Slouching: 15 Fatigue a turn');
        t.eq(r.stopped, true, 'Stop Slouching');
        t.eq(r.oil, '15/10/5', 'Oil Joints: 15, 10, 5');
        t.eq(r.oilAgi, true, 'Oil Joints: faster');
        t.eq(r.oilFire, '1.30', 'Oil Joints: +30% Fire after three');
        t.eq(r.oilOne, 'Oiled Joints III', 'one Oiled state at a time');
        t.eq(r.oilFourth, false, 'three times a battle');
        t.eq(r.photoFull + '/' + r.photoLow, 'false/true', 'Photosynthesize: below half Health');
        t.eq(r.photo.join('/'), 'true/15', 'Photosynthesize: full Health, 25 Fatigue');
        t.eq(r.noMeal, true, 'no meal until the next rest');
        t.eq(r.mealAgain, true, 'resting brings the appetite back');
        t.eq(r.tinker.join('/'), '65/1/true', 'Tinker: 15 Fatigue, a charge, a slower next turn');
        t.eq(r.recharge, true, 'the old Tinker is now Recharge');
        t.eq(r.notes[0] + '/' + r.notes[1], '55/' + Math.floor(r.notes[2] / 2), 'Take Notes: 20 Fatigue, half-price spell');
        t.eq(r.notesGone, true, 'only for the next spell');
        t.eq(r.parade.join('/'), '60/true', 'Parade Rest: 20 Fatigue and guarding');
    }
};
