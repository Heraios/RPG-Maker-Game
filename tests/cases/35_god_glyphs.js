// The god glyphs (Hiri, Gita, Emu, Iri, Ihi; the Ladies' Geha, Huhuti, Guhu, Huira; the husbands' Garo,
// Gogoro, Iku, Puhi; the Daughters' Viri)
// and Gau. Sib starts with Sooty Bird's Hiri.

module.exports = {
    'god glyphs': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), SK = n => $dataSkills.find(s => s && s.name === n),
                  ST = n => SmokingIsle.Ailments.stateByName(n), out = {};
            const cast = (who, name, target) => { const a = new Game_Action(who); a.setSkill(SK(name).id); target.clearResult(); a.apply(target); return a; };
            const yoon = A(2), sib = A(3), pada = A(5), boar = $gameTroop.members()[0], rnd = Math.random;
            const names = ['Hiri', 'Gita', 'Emu', 'Iri', 'Ihi', 'Garo', 'Gogoro', 'Iku', 'Puhi', 'Viri', 'Viriben', 'Virisin', 'Gau', 'Gauben', 'Gaugun'];
            out.glyphs = names.filter(n => !SK(n) || !AR('Glyph: ' + n) || AR('Glyph: ' + n).traits[0].dataId !== SK(n).id).join(', ');
            // Sib starts with Sooty Bird's glyph
            out.sib = sib.skills().some(s => s.name === 'Hiri');
            // Hiri: Cut and magic damage down, and flying
            cast(sib, 'Hiri', pada);
            out.hiri = Math.round(pada.elementRate(3) * 100) + '/' + Math.round(pada.mdr * 100) + '/' + SmokingIsle.Ranged.isFlying(pada);
            // Gita: no ailments; a killing blow leaves 1 Health, once
            cast(yoon, 'Gita', pada); pada.addState(ST('Bleed'));
            const hit = new Game_Action(boar); hit.setAttack();
            hit.executeHpDamage(pada, 9999); const first = pada.hp;
            out.gita = pada.isStateAffected(ST('Bleed')) + '/' + first + '/' + pada.isStateAffected(ST('Anchored'));
            // Iri: rise again at 25%
            pada.recoverAll(); cast(yoon, 'Iri', pada); hit.executeHpDamage(pada, 9999);
            out.iri = pada.isAlive() + '/' + (pada.hp === Math.floor(pada.mhp / 4)) + '/' + pada.isStateAffected(ST('Ascending'));
            pada.clearResult(); pada.addState(pada.deathStateId()); out.iriOnce = pada.isDead(); pada.removeState(pada.deathStateId()); pada.recoverAll();
            // Emu: a Sodden enemy sinks
            Math.random = () => 0.5;
            boar.recoverAll(); boar.addState(ST('Sodden')); cast(yoon, 'Emu', boar);
            out.emu = boar.isStateAffected(ST('Dragged Below')) + '/' + (boar._siInflicter && boar._siInflicter[ST('Dragged Below')] === yoon);
            boar.removeState(ST('Dragged Below')); boar.removeState(ST('Sodden')); boar.removeState(ST('Wet'));
            // Ihi: fire and Cracked
            boar.recoverAll(); cast(yoon, 'Ihi', boar); out.ihi = boar.result().hpDamage > 0 && boar.isStateAffected(ST('Cracked'));
            boar.recoverAll(); boar.removeState(ST('Cracked'));
            // Garo: evasion, and escape always works
            cast(yoon, 'Garo', sib); BattleManager._escapeRatio = 0;
            const esc = BattleManager.processEscape; let ratio = -1;
            const realMake = BattleManager.displayEscapeSuccessMessage; BattleManager.displayEscapeSuccessMessage = function () { ratio = this._escapeRatio; };
            const fail = BattleManager.displayEscapeFailureMessage; BattleManager.displayEscapeFailureMessage = function () { ratio = 0; };
            const proc = BattleManager.processAbort; BattleManager.processAbort = () => {};
            BattleManager.processEscape();
            BattleManager.displayEscapeSuccessMessage = realMake; BattleManager.displayEscapeFailureMessage = fail; BattleManager.processAbort = proc;
            out.garo = Math.round(sib.eva * 100) >= 50 && ratio === 1;
            sib.removeState(ST('Lost Trail')); $gameParty._inBattle = true;
            // Gogoro: sleep; Puhi: hypnotized; Viri: dragged below
            Math.random = () => 0.1;
            cast(yoon, 'Gogoro', boar); out.gogoro = boar.isStateAffected(ST('Sleep')); boar.removeState(ST('Sleep'));
            cast(yoon, 'Puhi', boar); out.puhi = boar.isStateAffected(ST('Hypnotized')); boar.removeState(ST('Hypnotized'));
            cast(yoon, 'Virisin', boar); out.viri = boar.isStateAffected(ST('Dragged Below')); boar.removeState(ST('Dragged Below'));
            // Iku: a critical with the best roll
            Math.random = () => 0.5;
            cast(yoon, 'Iku', pada); const strike = new Game_Action(pada); strike.setAttack();
            out.iku = strike.itemCri(boar) + '/' + (strike.applyVariance(100, 20) === 120);
            // Gau drains
            boar.recoverAll(); yoon.setHp(1); cast(yoon, 'Gau', boar); out.gau = yoon.hp > 1;
            // the Ladies: Geha, Huhuti, Guhu, Huira; Puhi is the Bull of Water's
            out.puhiGod = /Bull of Water/.test(AR('Glyph: Puhi').description);
            pada.recoverAll(); pada.setHp(10); pada.setTp(50); cast(yoon, 'Geha', pada); pada.regenerateAll();
            out.geha = (pada.hp > 10) + '/' + (pada.tp < 50);
            Math.random = () => 0.1;
            cast(yoon, 'Huhuti', boar); out.huhuti = boar.isStateAffected(ST('Entangled')); boar.removeState(ST('Entangled'));
            cast(yoon, 'Guhu', sib); const shot = new Game_Action(boar); shot.setSkill(SK('Sling Stone').id);
            out.guhu = shot.itemHit(sib) + '/' + (hit.itemHit(sib) > 0);
            const huira = new Game_Action(yoon); huira.setSkill(SK('Huira').id); yoon.useItem(SK('Huira')); boar.clearResult(); huira.apply(boar);
            out.huira = boar.isStateAffected(ST('Dazzled')) + '/' + sib.isStateAffected(ST('Brave')) + '/' + sib.isStateAffected(ST('Sunlit'));
            Math.random = rnd;
            return out;
        });
        t.eq(r.glyphs, '', 'every new spell exists, each with its glyph');
        t.ok(r.sib, 'Sib starts with Sooty Bird\'s glyph, Hiri');
        t.eq(r.hiri, '80/80/true', 'Hiri: 20% less Cut and magic damage, and flying');
        t.eq(r.gita, 'false/1/false', 'Gita: no ailments; the killing blow leaves 1 Health, then it ends');
        t.eq(r.iri, 'true/true/false', 'Iri: knocked out, they rise again at 25%');
        t.ok(r.iriOnce, 'only once');
        t.eq(r.emu, 'true/true', 'Emu: a Sodden enemy is Dragged Below by the caster');
        t.ok(r.ihi, 'Ihi: heavy damage and Cracked');
        t.ok(r.garo, 'Garo: Evasion +50% and escape always works');
        t.ok(r.gogoro, 'Gogoro puts an enemy to sleep');
        t.ok(r.puhi, 'Puhi turns an enemy against its allies');
        t.ok(r.viri, 'Virisin drags an enemy below');
        t.eq(r.iku, '1/true', 'Iku: a sure critical with the best roll');
        t.ok(r.gau, 'Gau drains Health');
        t.ok(r.puhiGod, 'Puhi is the Bull of Water\'s glyph');
        t.eq(r.geha, 'true/true', 'Geha: the party heals and sheds Fatigue each turn');
        t.ok(r.huhuti, 'Huhuti: roots entangle the enemies');
        t.eq(r.guhu, '0/true', 'Guhu: ranged attacks can\'t hit the party; melee still can');
        t.eq(r.huira, 'true/true/true', 'Huira: enemies Dazzled, the party Brave and lit');
    }
};
