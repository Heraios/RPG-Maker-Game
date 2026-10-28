// Seafarer codex spells (SI_SeafarerMagic): Tiho-uha protect, Mea-uha slow, Kiva silence, Tama dispel,
// Atua reflect, Vero haste and Hiero's pure percentage damage.

module.exports = {
    'seafarer spells': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, SK = n => $dataSkills.find(s => s && s.name === n), ST = n => $dataStates.find(s => s && s.name === n).id;
            const sib = $gameActors.actor(3), pada = $gameActors.actor(5), boar = $gameTroop.members()[0];
            const cast = (user, name, target) => { const a = new Game_Action(user); a.setSkill(SK(name).id); a.apply(target); return a; };
            const names = ['Tiho-uha', 'Tiho-uhagun', 'Mea-uha', 'Mea-uhagun', 'Kiva', 'Kivagun', 'Tama', 'Tamagun', 'Atua', 'Atuagun',
                'Vero', 'Verogun', 'Hiero', 'Hierogun', 'Puaka', 'Puakagun', 'Ariki', 'Arikigun'];
            out.gone = ['Mea-uhaben', 'Veroben', 'Hieroben', 'Hierosin', 'Verogunben'].filter(n => SK(n)).join();
            out.all = names.filter(n => !SK(n) || !/<School: seafarer>/.test(SK(n).note)).join();
            Math.random = () => 0;
            // Protect
            cast(sib, 'Tiho-uha', pada); out.protect = pada.isStateAffected(ST('Sheltered')) && pada.pdr === 0.7;
            // Slow / haste
            const d = boar.ctbDistance(); cast(sib, 'Mea-uha', boar); out.slow = boar.ctbDistance() - d;
            pada.setCtbDistance(300); const dp = pada.ctbDistance(); cast(sib, 'Vero', pada); out.haste = pada.ctbDistance() - dp;
            // Silence
            cast(sib, 'Kiva', boar); out.silence = boar.isSkillTypeSealed(1);
            // Dispel
            boar.addState(ST('Brave')); boar.addBuff(2, 3);
            cast(sib, 'Tama', boar); out.dispel = !boar.isStateAffected(ST('Brave')) && !boar.isBuffAffected(2);
            // Reflect: an enemy spell bounces back once; a heal passes through
            cast(sib, 'Atua', pada);
            const fire = new Game_Action(boar); fire.setSkill(SK('Ahi').id);
            const heal = new Game_Action(sib); heal.setSkill(SK('Mahu').id);
            out.reflect = [fire.itemMrf(pada), heal.itemMrf(pada)].join();
            BattleManager._logWindow = SceneManager._scene._logWindow; BattleManager._action = fire;
            BattleManager.invokeMagicReflection(boar, pada); out.reflectOnce = !pada.isStateAffected(ST('Mirrored'));
            // Hiero: a share of current Health, untouched by guard or element
            boar.setHp(100); boar.addState(ST('Guard'));
            const hiero = new Game_Action(sib); hiero.setSkill(SK('Hiero').id);
            out.hiero = hiero.makeDamageValue(boar, true);
            return out;
        });
        t.eq(r.all, '', 'every Seafarer spell exists');
        t.eq(r.gone, '', 'the middle tiers are gone: each is single and group now');
        t.eq(r.protect, true, 'Tiho-uha: 30% less physical damage');
        t.eq(r.slow, 100, 'Mea-uha pushes an enemy back a whole turn (100)');
        t.eq(r.haste, -100, 'Vero pulls an ally forward a whole turn (100)');
        t.eq(r.silence, true, 'Kiva seals Magical skills');
        t.eq(r.dispel, true, 'Tama strips boons and raised stats');
        t.eq(r.reflect, '1,0', 'Atua reflects an enemy\'s damaging spell, not a heal');
        t.eq(r.reflectOnce, true, 'the mirror ends after one reflection');
        t.eq(r.hiero, 40, 'Hiero: 40% of current Health, guarding or critical changes nothing');
    }
};
