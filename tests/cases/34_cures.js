// Raau (bodily ailments), Kami (mental ailments) and Keva (blinding), their glyphs and tiers;
// Blinded stops ranged attacks; Keva is stronger in the dark; Lasa knows Keva innately.

module.exports = {
    'Raau, Kami and Keva': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), SK = n => $dataSkills.find(s => s && s.name === n),
                  ST = n => SmokingIsle.Ailments.stateByName(n), out = {};
            const cast = (who, name, target) => { const a = new Game_Action(who); a.setSkill(SK(name).id); target.clearResult(); a.apply(target); };
            const yoon = A(2), sib = A(3), lasa = A(4), pada = A(5);
            // every tier exists, with a glyph
            const names = ['Raau', 'Raauben', 'Raaugun', 'Kami', 'Kamiben', 'Kamigun'];   // Keva is cave magic now: no glyph
            out.glyphs = names.filter(n => !SK(n) || !AR('Glyph: ' + n) || AR('Glyph: ' + n).traits[0].dataId !== SK(n).id).join(', ');
            // Raau: bodily ailments, not the elemental states
            ['Venom', 'Bleed', 'Tipsy', 'Wet'].forEach(n => sib.addState(ST(n)));
            cast(yoon, 'Raau', sib);
            out.raau = ['Venom', 'Bleed', 'Tipsy', 'Wet'].map(n => sib.isStateAffected(ST(n))).join();
            sib.removeState(ST('Wet'));
            sib.addState(ST('Salting')); cast(yoon, 'Raau', sib); const salted = sib.isStateAffected(ST('Salting'));
            cast(yoon, 'Raauben', sib); out.salting = salted + '/' + sib.isStateAffected(ST('Salting'));
            // Kami: mental ailments; Kamiben wards them for 2 turns
            pada.addState(ST('Panicked')); pada.addState(ST('Despair')); cast(yoon, 'Kami', pada);
            out.kami = pada.isStateAffected(ST('Panicked')) || pada.isStateAffected(ST('Despair'));
            cast(yoon, 'Kamiben', pada); pada.addState(ST('Confused'));
            out.ward = pada.isStateAffected(ST('Clear-Minded')) + '/' + pada.isStateAffected(ST('Confused'));
            out.gun = SK('Raaugun').scope + '/' + SK('Kamigun').scope + '/' + SK('Kevagun').scope;
            // Keva: Dazzled; Kevaben: Blinded, which stops ranged attacks
            const boar = $gameTroop.members()[0], rnd = Math.random;
            Math.random = () => 0.5;
            cast(lasa, 'Keva', boar); out.keva = boar.isStateAffected(ST('Dazzled'));
            const slingSkill = $dataSkills.find(s => s && s.siRanged);
            const sling = AR('Goat-Hair Sling'); yoon.forceChangeEquip(yoon.slotOfType(6), sling);
            const could = yoon.canUse(slingSkill);
            cast(lasa, 'Kevaben', yoon); out.blind = could + '/' + yoon.isStateAffected(ST('Blinded')) + '/' + yoon.canUse(slingSkill);
            // stronger in the dark: a roll that misses in daylight lands, and lasts a turn longer
            Math.random = () => 0.85; boar.removeState(ST('Blinded'));
            cast(lasa, 'Kevaben', boar); const day = boar.isStateAffected(ST('Blinded'));
            const T = SmokingIsle.Time, dark = T.darkBonus; T.darkBonus = item => /<Dark Bonus>/.test(item.note);
            cast(lasa, 'Kevaben', boar); out.dark = day + '/' + boar.isStateAffected(ST('Blinded')) + '/' + boar._stateTurns[ST('Blinded')];
            T.darkBonus = dark; Math.random = rnd;
            // Lasa knows Keva innately
            out.lasa = lasa.isLearnedSkill(SK('Keva').id) + '/' + [2, 3, 5].some(id => A(id).isLearnedSkill(SK('Keva').id));
            return out;
        });
        t.eq(r.glyphs, '', 'all six cure spells exist, each with its glyph');
        t.eq(r.raau, 'false,false,false,true', 'Raau cures Venom, Bleed and Tipsy, but leaves the elemental states alone');
        t.eq(r.salting, 'true/false', 'only Raauben cures Salting');
        t.eq(r.kami, false, 'Kami cures Panicked and Despair');
        t.eq(r.ward, 'true/false', 'Kamiben keeps the mind clear: no new Confusion');
        t.eq(r.gun, '8/8/2', 'the -gun tiers hit everyone');
        t.ok(r.keva, 'Keva dazzles');
        t.eq(r.blind, 'true/true/false', 'Kevaben blinds: no ranged attacks');
        t.eq(r.dark, 'false/true/4', 'in the dark Keva lands more often and lasts a turn longer');
        t.eq(r.lasa, 'true/false', 'Lasa knows Keva innately; the others need the glyph');
    }
};
