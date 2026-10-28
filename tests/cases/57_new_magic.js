// The magic redo: Puaka, Ariki, Manu, Huki, Hakahepo, Hahikiri; the cultural moves (Steady Footing, Bail Out,
// Bull-Leap); the six codices in three tiers; innate magic (Lasa's cave magic, Falmi, Tou's First Sailor -sin
// spells); and the culture split (no -sin or -hari glyphs).

module.exports = {
    'new magic': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, SK = n => $dataSkills.find(s => s && s.name === n), AR = n => $dataArmors.find(a => a && a.name === n);
            const ST = n => $dataStates.find(s => s && s.name === n).id, A = id => $gameActors.actor(id);
            const sib = A(3), pada = A(5), boar = $gameTroop.members()[0];
            const cast = (user, name, target) => { const a = new Game_Action(user); a.setSkill(SK(name).id); target.clearResult(); a.apply(target); return a; };
            Math.random = () => 0;
            // Puaka: Might up
            const atk = pada.atk; cast(sib, 'Puaka', pada); out.puaka = pada.atk > atk;
            // Ariki: lowered stats and elemental states go, no removal states left
            pada.addDebuff(3, 3); pada.addState(ST('Sodden')); pada.addState(ST('Smoldering'));
            cast(sib, 'Ariki', pada);
            out.ariki = !pada.isDebuffAffected(3) && !pada.isStateAffected(ST('Sodden')) && !pada.isStateAffected(ST('Smoldering')) && !pada.isStateAffected(ST('Steam'));
            // Manu: no elemental states, less elemental damage
            cast(sib, 'Manu', pada); pada.addState(ST('Wet'));
            out.manu = !pada.isStateAffected(ST('Wet')) && pada.elementRate(10) <= 0.7;
            // Huki puts one enemy to sleep; Hakahepo then hurts and wakes it, adding a mental ailment
            cast(sib, 'Huki', boar); out.huki = boar.isStateAffected(ST('Sleep'));
            const mental = ['Confused', 'Hypnotized', 'Despair', 'Panicked', 'Enraged'].map(ST);
            boar.recoverAll(); boar.addState(ST('Sleep'));
            cast(sib, 'Hakahepo', boar);
            out.nightmare = boar.result().hpDamage > 0 && !boar.isStateAffected(ST('Sleep')) && mental.some(id => boar.isStateAffected(id));
            mental.forEach(id => boar.removeState(id));
            boar.recoverAll(); cast(sib, 'Hakahepo', boar); out.awake = boar.result().hpDamage === 0;
            // Hahikiri: Roots and Bark
            const falmi = A(10); const def = falmi.def; cast(falmi, 'Hahikiri', falmi);
            out.hahikiri = falmi.def > def && falmi.hrg >= 0.1;
            // cultural moves
            pada.addState(ST('Burdened')); cast(pada, 'Steady Footing', pada);
            out.footing = !pada.isStateAffected(ST('Burdened')) && pada.isStateAffected(ST('Sure-Footed'));
            pada.removeState(ST('White-Winged')); pada.addState(ST('Wet')); cast(pada, 'Bail Out', pada); out.bail = !pada.isStateAffected(ST('Wet'));
            cast(pada, 'Bull-Leap', pada);
            const swing = new Game_Action(boar); swing.setAttack();
            out.leap = swing.itemEva(pada) === 1;
            swing.apply(pada); out.leapOnce = !pada.isStateAffected(ST('Vaulting'));
            // codices: three tiers
            const codex = (actor, name) => { const s = actor.slotOfType(8); actor.forceChangeEquip(s, AR(name)); actor.refresh(); return actor.skills().map(x => x.name); };
            const th = A(11), thenmy = codex(th, 'Codex of the Bulls');
            out.bulls = ['Bull-Leap', 'Raau', 'Raauben', 'Puaka', 'Iku', 'Puakagun', 'Puhi', 'Raaugun'].every(n => thenmy.includes(n));
            out.codices = ['Codex of the Sun', 'Codex of the Moon', 'Codex of the Wind', 'Codex of the Mountains', 'Codex of the World', 'Codex of the Bulls']
                .filter(n => !AR(n)).join();
            out.oldCodices = ['Codex of Embers', 'Codex of Mending', "Sailor's Codex"].filter(n => AR(n)).join();
            // innate magic, all from the start
            const lasa = A(4).skills().map(s => s.name), tou = A(9).skills().map(s => s.name), fal = falmi.skills().map(s => s.name);
            out.lasa = ['Mahu', 'Raau', 'Keri', 'Keriben', 'Keva', 'Kevaben', 'Kevagun', 'Gau', 'Gauben'].every(n => lasa.includes(n)) && !lasa.includes('Kerigun');
            out.falmi = ['Raau', 'Geha', 'Hahikiri'].every(n => fal.includes(n));
            out.tou = ['Ahisin', 'Rarisin', 'Hagusin', 'Kerisin'].every(n => tou.includes(n) && /<School: first-sailor>/.test(SK(n).note));
            out.noLevelMagic = $dataClasses.every(c => !c || c.learnings.every(l => $dataSkills[l.skillId].stypeId !== 1 || l.level === 1));
            // culture split: no -sin or -hari tattoos; -gunben tattoos stay
            out.split = ['Ahisin', 'Kerihari', 'Rarisin', 'Haguhari'].every(n => !AR('Glyph: ' + n)) && !!AR('Glyph: Ahigunben');
            return out;
        });
        t.eq(r.puaka, true, 'Puaka: Might up');
        t.eq(r.ariki, true, 'Ariki: lowered stats and elemental states removed, no removal states left');
        t.eq(r.manu, true, 'Manu: no elemental states, 30% less elemental damage');
        t.eq(r.huki, true, 'Huki: one enemy sleeps');
        t.eq(r.nightmare, true, 'Hakahepo on a sleeper: Mind damage, wakes it, a mental ailment');
        t.eq(r.awake, true, 'Hakahepo on someone awake: no damage');
        t.eq(r.hahikiri, true, 'Hahikiri: Endurance up, regeneration doubled');
        t.eq(r.footing, true, 'Steady Footing: Burdened gone, Sure-Footed');
        t.eq(r.bail, true, 'Bail Out: Wet gone');
        t.eq(r.leap, true, 'Bull-Leap: the next melee attack misses');
        t.eq(r.leapOnce, true, 'only the one attack');
        t.eq(r.bulls, true, 'a master reads every tier of the Codex of the Bulls');
        t.eq(r.codices, '', 'six codices');
        t.eq(r.oldCodices, '', 'the old codex names are gone');
        t.eq(r.lasa, true, 'Lasa: cave magic, Keri up to Keriben');
        t.eq(r.falmi, true, 'Falmi: Raau, Geha, Hahikiri');
        t.eq(r.tou, true, 'Tou: the four First Sailor -sin spells');
        t.eq(r.noLevelMagic, true, 'nobody learns spells by levelling up');
        t.eq(r.split, true, 'no -sin or -hari glyphs; -gunben glyphs stay');
    }
};
