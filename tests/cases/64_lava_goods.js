// Lava-country goods: Wild Figs (Skylight Fig), Moonmilk (and its Eye-Wash and Paint), Cricket Legs (and Roast
// Cricket, bait), and what bats and other animals like.

module.exports = {
    'lava goods: figs, moonmilk, crickets': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, F = SmokingIsle.FieldMagic, out = {}, map = $gameMap.mapId();
            const I = n => $dataItems.find(i => i && i.name === n);
            const ev = n => $gameMap.events().find(e => e.event().name === 'Gather: ' + n).eventId();
            // Wild Figs: Lasa and Falmi will eat them; Roast Cricket is cooked, so Lasa won't
            out.figs = [4, 10].map(id => !$gameActors.actor(id).tabooRefusal(I('Wild Figs'))).join('/');
            out.cricketLasa = !!$gameActors.actor(4).tabooRefusal(I('Roast Cricket'));
            // gathering: a skylight fig and moonmilk
            const yoon = $gameActors.actor(2), real = Math.random; Math.random = () => 0.1;
            out.fig = G.gather(map, ev('Laurel'), 'Skylight Fig', yoon).got.join(',');
            out.moon = G.gather(map, ev('Moon Sorrel'), 'Moonmilk', yoon).got.join(',');
            Math.random = real;
            const rf = G.rule('Skylight Fig'), rm = G.rule('Moonmilk');
            out.rules = rf.regrow + '/' + rf.vanish + ' ' + rm.regrow + '/' + rm.vanish;
            // crickets: the giant cricket drops legs; bats (and others) like them; bait takes them
            out.drop = $dataEnemies[20].dropItems.some(d => d.kind === 1 && d.dataId === I('Cricket Legs').id);
            out.bats = new Game_Enemy(19, 0, 0).talkData().likes.indexOf(I('Cricket Legs').id) >= 0;
            out.bait = /item 353/.test($dataItems.find(i => i && i.name === 'Recipe: Bait Pouch').note);
            out.roast = /<Recipe Known>/.test($dataItems.find(i => i && i.name === 'Recipe: Roast Cricket').note);
            // the eye-wash cures Blinded
            const sib = $gameActors.actor(3); sib.addState(122);
            const a = new Game_Action(sib); a.setItemObject(I('Moonmilk Eye-Wash')); a.apply(sib);
            out.eyes = !sib.isStateAffected(122);
            // the paint on the map: spirits (and the dead) don't notice; animals still do
            out.spiritTroop = F.isSpiritWanderer({ wanderer: () => ({ troopId: 22 }) }) + '/' + F.isSpiritWanderer({ wanderer: () => ({ troopId: 1 }) });
            const boar = $gameMap.events().find(e => e.wanderer && e.wanderer());
            boar.locate(8, 11); boar.setDirection(8); $gamePlayer.locate(8, 9);
            F.veil(); out.boarStill = boar.canSeeParty();
            out.paintMenu = I('Moonmilk Paint').occasion + ':' + I('Moonmilk Paint').effects.some(e => e.code === 44 && e.dataId === 22);
            return out;
        });
        t.eq(r.figs, 'true/true', 'Wild Figs: Lasa and Falmi both eat them');
        t.ok(r.cricketLasa, 'Roast Cricket is cooked: Lasa refuses it');
        t.eq(r.fig, 'Wild Figs,Latex', 'a skylight fig gives Wild Figs (and sometimes Latex)');
        t.eq(r.moon, 'Moonmilk', 'moonmilk is scraped off the tube wall');
        t.eq(r.rules, '3/false 7/false', 'the fig comes back in 3 days, moonmilk in 7; both stay visible');
        t.ok(r.drop, 'the giant cave cricket drops Cricket Legs');
        t.ok(r.bats, 'bats like Cricket Legs (Talk)');
        t.ok(r.bait, 'Bait Pouch: Cricket Legs will do');
        t.ok(r.roast, 'Roast Cricket is known from the start');
        t.ok(r.eyes, 'Moonmilk Eye-Wash cures Blinded');
        t.eq(r.spiritTroop, 'true/false', 'the paint knows spirit troops (the tomb dead) from animals');
        t.ok(r.boarStill, 'painted, the party is still seen by animals');
        t.eq(r.paintMenu, '0:true', 'Moonmilk Paint works in battle and from the menu (common event 22)');
    },

    'lava goods: Moonmilk Paint in battle': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const paint = $dataItems.find(i => i && i.name === 'Moonmilk Paint'), sib = $gameActors.actor(3);
            const mood = id => { const e = new Game_Enemy(id, 0, 0); const before = e.talkMood(); const a = new Game_Action(sib); a.setItemObject(paint); e.clearResult(); a.apply(e); return e.talkMood() - before; };
            return { dead: mood(21), owl: mood(12), boar: mood(1) };
        });
        t.eq(r.dead, 30, 'the dead: mood +30 (+20 spirit, +10 dead)');
        t.eq(r.owl, 20, 'other spirits (the Owl of Ill Omen): mood +20');
        t.eq(r.boar, 0, 'animals: no change');
    }
};
