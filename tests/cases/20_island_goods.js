// Island goods: new foods, remedies, paints, lures, charms and ranged add-ons.

module.exports = {
    'island goods: remedies, lures, charms and ranged add-ons': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n),
                  AR = n => $dataArmors.find(a => a && a.name === n), ST = n => SmokingIsle.Ailments.stateByName(n), out = {};
            const use = (who, n, target) => { const x = new Game_Action(who); x.setItem(IT(n).id); target.clearResult(); x.apply(target); return target; };
            const slot = (a, etype, k = 0) => a.equipSlots().map((e, i) => e === etype ? i : -1).filter(i => i >= 0)[k];
            const yoon = A(2), sib = A(3), pada = A(5);
            // White Clay Draught cures Tipsy
            yoon.addState(ST('Tipsy')); use(sib, 'White Clay Draught', yoon); out.sober = !yoon.isStateAffected(ST('Tipsy'));
            // Fire Opal: spells of the last element cast are stronger
            sib.forceChangeEquip(slot(sib, 5), AR('Fire Opal'));
            const ahi = new Game_Action(sib); ahi.setSkill(242);
            sib._siLastSpellSource = 0; out.echoOff = ahi.spellBoost();
            sib._siLastSpellSource = $dataSkills[242].siSource; out.echo = Math.round((ahi.spellBoost() - out.echoOff) * 100);
            // Bows: wet strings lose power; waxed ones don't; arrow add-ons add ammo
            const rs = slot(pada, 6);
            pada.forceChangeEquip(rs, AR('Juniper Bow'));
            pada._siRangedSlot = rs; pada._siRangedMove = '';
            out.dry = pada.rangedPower();
            pada.addState(ST('Wet')); out.wet = pada.rangedPower();
            pada.forceChangeEquip(slot(pada, 5), AR('Waxed Bowstring')); out.waxed = pada.rangedPower();
            pada.forceChangeEquip(slot(pada, 5, 1), AR('Reed Arrows')); out.reedPower = pada.rangedPower(); out.reedAmmo = pada.ammoLeft(rs);
            pada.removeState(ST('Wet'));
            // Net Floats: nets also soak
            const dama = A(7), enemy = $gameTroop.members()[0];
            dama.forceChangeEquip(slot(dama, 6), AR('Palm-Fibre Net'));
            dama.forceChangeEquip(slot(dama, 5), AR('Net Floats'));
            enemy.removeState(ST('Wet')); enemy.setHp(enemy.mhp);
            const net = new Game_Action(dama); net.setSkill(125);
            for (let i = 0; i < 10 && !enemy.isStateAffected(ST('Wet')); i++) { enemy.clearResult(); net.apply(enemy); enemy.setHp(enemy.mhp); }
            out.soaked = enemy.isStateAffected(ST('Wet'));
            // Scoria Pupil quiets the Coral Eye's whisper
            yoon.forceChangeEquip(slot(yoon, 5), AR('Coral Eye Fragment'));
            yoon.forceChangeEquip(slot(yoon, 5, 1), AR('Scoria Pupil'));
            const real = Math.random; Math.random = () => 0;
            yoon.removeState(ST('Despair')); yoon.onTurnEnd(); out.quiet = !yoon.isStateAffected(ST('Despair'));
            yoon.forceChangeEquip(slot(yoon, 5, 1), null); yoon.onTurnEnd(); out.whispers = yoon.isStateAffected(ST('Despair'));
            Math.random = real; yoon.removeState(ST('Despair'));
            // Sandalwood Beads: mental ailments wear off sooner
            const conf = $dataStates[ST('Confused')];
            yoon.forceChangeEquip(slot(yoon, 9), AR('Sandalwood Beads'));
            yoon.addState(conf.id); out.shorter = yoon._stateTurns[conf.id] <= Math.max(conf.maxTurns - 1, 1);
            // Heated Scoria warms the whole party
            yoon.addState(ST('Chilled')); sib.useItem(IT('Heated Scoria')); out.warmed = !yoon.isStateAffected(ST('Chilled'));
            // Shearwater Oil's lamp lasts two battles
            sib.addState(ST('Lamplight')); sib.onBattleEnd(); out.lampOne = sib.isStateAffected(ST('Lamplight'));
            sib.onBattleEnd(); out.lampTwo = sib.isStateAffected(ST('Lamplight'));
            // Salt Lick lures grazers only; Mourning Paint lures spirits
            const goat = new Game_Enemy(6, 0, 0), boar = new Game_Enemy(1, 0, 0), owl = new Game_Enemy(12, 0, 0);
            const g0 = goat.talkMood(), b0 = boar.talkMood(), o0 = owl.talkMood();
            use(yoon, 'Salt Lick', goat); use(yoon, 'Salt Lick', boar); use(yoon, 'Mourning Paint', owl);
            out.goat = goat.talkMood() - g0; out.boar = boar.talkMood() - b0; out.owl = owl.talkMood() - o0;
            // Tapa set: two body pieces, still four slots
            out.tapaSize = SmokingIsle.Outfits.sets['Tapa'];
            // Opal Earring draws attacks; Eelskin makes the wearer slippery
            yoon.forceChangeEquip(slot(yoon, 5), AR('Opal Earring')); out.tgr = yoon.tgr;
            yoon.forceChangeEquip(slot(yoon, 13), AR('Eelskin Wraps')); out.slippery = yoon.isStateResist(ST('Entangled'));
            out.shellfish = !!IT('Shellfish') && !IT('Limpets');
            out.keys = $dataItems.filter(i => i && i.itypeId === 2 && i.name && !i.name.startsWith('---')).length;
            return out;
        });
        t.ok(r.sober, 'White Clay Draught cures Tipsy');
        t.eq(r.echo, 15, 'Fire Opal: +15% to the same element as the last spell, nothing before it');
        t.eq(r.dry, 12, 'Juniper Bow: power 12 when dry');
        t.eq(r.wet, 8, 'a Wet archer loses 30% bow power');
        t.eq(r.waxed, 12, 'a Waxed Bowstring keeps full power while Wet');
        t.eq(r.reedPower, 9, 'Reed Arrows: bows lose 3 power');
        t.eq(r.reedAmmo, 5, 'Reed Arrows: +2 arrows (3 + 2)');
        t.ok(r.soaked, 'Net Floats: a net hit soaks the target');
        t.ok(r.quiet, 'Scoria Pupil stills the Coral Eye\'s whisper');
        t.ok(r.whispers, 'without the pupil, the Coral Eye whispers');
        t.ok(r.shorter, 'Sandalwood Beads shorten mental ailments');
        t.ok(r.warmed, 'Heated Scoria cures Chilled on the whole party');
        t.ok(r.lampOne && !r.lampTwo, 'Lamplight lasts two battles');
        t.eq(r.goat, 20, 'Salt Lick: a goat\'s mood +20');
        t.eq(r.boar, 0, 'Salt Lick does nothing to a boar');
        t.eq(r.owl, 15, 'Mourning Paint: a spirit\'s mood +15');
        t.eq(r.tapaSize, 4, 'the Tapa set still counts four slots with two body pieces');
        t.ok(r.tgr > 1, 'Opal Earring draws enemy attacks');
        t.ok(r.slippery, 'Eelskin Wraps: immune to Entangled');
        t.ok(r.shellfish, 'Limpets are now Shellfish');
        t.eq(r.keys, 15, '15 key items');
    }
};
