// Gear reworked so no piece is just a worse copy of another: the Tin Bead's bonus against metal foes,
// the Ram Horn Charm's earth and the Volcano Tear's fire, the heavier Ebony Buckler, the Andesite Hammer.

module.exports = {
    'gear tweaks': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, AR = n => $dataArmors.find(a => a && a.name === n), W = n => $dataWeapons.find(w => w && w.name === n);
            const ST = n => SmokingIsle.Ailments.stateByName(n);
            const resists = (a, n) => a.traits.some(x => x.code === 13 && x.dataId === ST(n));
            out.ram = /<Spell Boost: earth 10>/.test(AR('Ram Horn Charm').note) && resists(AR('Ram Horn Charm'), 'Burdened');
            const tear = AR('Volcano Tear');
            out.tear = /<Spell Boost: fire 10>/.test(tear.note) && resists(tear, 'Smoldering') && resists(tear, 'Enflamed') && !resists(tear, 'Burdened');
            out.ebony = AR('Ebony Buckler').params[3] === 6;
            out.hammer = W('Andesite Hammer').params[2] === 11 && /pound/.test(W('Andesite Hammer').note);
            out.adze = !W('Andesite Adze').traits.some(x => x.code === 11);
            // The Tin Bead: +15% against a metal foe, nothing against others.
            const pada = $gameActors.actor(5), foe = $gameTroop.members()[0], enemy = foe.enemy(), note = enemy.note;
            const hit = () => { const a = new Game_Action(pada); a.setAttack(); return a.makeDamageValue(foe, false); };
            const slot = pada.equipSlots().indexOf(AR('Tin Bead').etypeId);
            Math.random = () => 0.5;
            pada.changeEquip(slot, null);
            enemy.note = note + '<Metal>';
            const plain = hit();
            $gameParty.gainItem(AR('Tin Bead'), 1); pada.changeEquip(slot, AR('Tin Bead'));
            out.metal = [plain, hit()];
            enemy.note = note;
            out.notMetal = hit() === plain;
            return out;
        });
        t.eq(r.ram, true, 'Ram Horn Charm: earth spells, Burdened and Mired');
        t.eq(r.tear, true, 'Volcano Tear: fire spells, Smoldering and Enflamed');
        t.eq(r.ebony, true, 'Ebony Buckler: Endurance 6');
        t.eq(r.hammer, true, 'Andesite Hammer: Might 11 and Ground Pound');
        t.eq(r.adze, true, 'no leftover element rate on the adze');
        t.eq(r.metal[1], Math.round(r.metal[0] * 1.15), 'Tin Bead: +15% against metal foes');
        t.eq(r.notMetal, true, 'Tin Bead: nothing extra against other foes');
    }
};
