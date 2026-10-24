// Thenmy's Silvered Bronze: his own four-piece set, his starting gear, worn by no one else.

module.exports = {
    'Silvered Bronze': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), out = {};
            const names = ['Silvered War-Circlet', 'Silvered Bronze Cuirass', 'Silvered Bronze Bracers', 'Silvered Bronze Greaves'];
            const th = A(11); th.initEquips($dataActors[11].equips);
            out.wears = names.every(n => th.armors().includes(AR(n)));
            out.others = [2, 3, 5, 7, 8, 10].some(id => names.some(n => A(id).canEquip(AR(n))));
            out.size = SmokingIsle.Outfits.sets['Silvered Bronze'];
            out.bonus = th.states().filter(s => /^Silvered Bronze/.test(s.name)).map(s => s.name).sort().join(', ');
            out.metal = SmokingIsle.Voltaic.isMetal(th);
            return out;
        });
        t.ok(r.wears, 'Thenmy starts in the full set');
        t.eq(r.others, false, 'no one else can wear it');
        t.eq(r.size, 4, 'four parts: circlet, cuirass, bracers, greaves');
        t.eq(r.bonus, 'Silvered Bronze (2), Silvered Bronze (all)', 'both set bonuses are on');
        t.ok(r.metal, 'it counts as metal');
    }
};
