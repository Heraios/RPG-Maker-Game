// Seafarer outfits: the Bull Cult (a weapon in a set: the Bull-Horn Staff), Silk Finery, and the
// Crossbowman's Gear (the Bronze Crossbow and the Wicker Pavise belong to it).

module.exports = {
    'seafarer sets': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, O = SmokingIsle.Outfits;
            const AR = n => $dataArmors.find(a => a && a.name === n), W = n => $dataWeapons.find(w => w && w.name === n);
            const juda = $gameActors.actor(6);
            const wear = (a, ...items) => items.forEach(x => { $gameParty.gainItem(x, 1); a.forceChangeEquip(a.equipSlots().indexOf(x.etypeId), x); });
            const sets = a => a.setBonusStates().map(s => s.name).filter(n => /Bull|Silk|Crossbow/.test(n)).join(',');
            out.sizes = ['Bull Cult', 'Silk Finery', "Crossbowman's Gear"].map(n => O.sets[n]).join('/');
            juda.clearEquipments();
            wear(juda, AR('Bull-Horn Headdress'), AR("Bull Priest's Robe"));
            out.bullTwo = sets(juda);
            wear(juda, W('Bull-Horn Staff'));
            out.bullThree = sets(juda);                    // the staff counts as a piece
            const mat = juda.mat;
            wear(juda, AR('Bull-Hide Bracers'), AR('Bull-Men Amulet'));
            out.bullAll = sets(juda);
            juda.clearEquipments();
            const mmp = juda.mmp;
            wear(juda, AR('Silk Veil'), AR('Silk Shawl'), AR('Silk Gown'), AR('Silk Gloves'), AR('Silk Slippers'));
            out.silk = sets(juda); out.silkMana = juda.mmp > mmp; out.silkCost = juda.mcr;
            const pada = $gameActors.actor(5);                // a hunter: large shields and crossbows
            pada.clearEquipments();
            const pierce = pada.elementRate(4);
            wear(pada, AR('Silk-Lined Leather Cap'), AR('Silk-and-Leather Jack'), AR("Crossbowman's Bracer"), AR('Wicker Pavise'), AR('Bronze Crossbow'));
            out.xbow = sets(pada); out.pierce = +(pada.elementRate(4) / pierce).toFixed(3);
            return out;
        });
        t.eq(r.sizes, '5/5/5', 'five pieces in each set');
        t.eq(r.bullTwo, '', 'two Bull Cult pieces: nothing yet');
        t.eq(r.bullThree, 'Bull Cult (3)', 'the staff makes three');
        t.eq(r.bullAll, 'Bull Cult (3),Bull Cult (all)', 'all five Bull Cult pieces');
        t.eq(r.silk, 'Silk Finery (3),Silk Finery (all)', 'all five silk pieces');
        t.eq(r.silkMana && r.silkCost === 0.85, true, 'silk: more Mana, spells 15% cheaper');
        t.eq(r.xbow, "Crossbowman's Gear (3),Crossbowman's Gear (all)", 'the crossbowman\'s full kit');
        t.eq(r.pierce, 0.648, 'jack, pavise and set: much less Pierce damage');
    }
};
