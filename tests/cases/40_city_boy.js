// Thenmy, a city boy: only strength jobs (wood, ore, stone, water) until someone teaches him more.

module.exports = {
    'Thenmy gathers only what needs strength, until taught': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, T = G.TABLE, th = $gameActors.actor(11), pada = $gameActors.actor(5), out = {};
            out.can = ['Laurel', 'Copper Vein', 'Basalt', 'Spring'].map(n => G.whoCan(th, T[n])).join();
            out.cannot = ['Hill Thyme', 'Barley', 'Clay Pit', 'Shore Rocks', 'Fishing Spot'].map(n => G.whoCan(th, T[n])).join();
            out.others = G.whoCan(pada, T['Hill Thyme']);
            G.teach(11, 'fish'); out.fish = G.whoCan(th, T['Fishing Spot']) + '/' + G.whoCan(th, T['Eel Pool']);
            G.teach(11, 'herb, food'); out.herbs = G.whoCan(th, T['Hill Thyme']) + '/' + G.whoCan(th, T['Barley']) + '/' + G.whoCan(th, T['Clay Pit']);
            return out;
        });
        t.eq(r.can, 'true,true,true,true', 'he can fell trees, mine, gather stone and fetch water');
        t.eq(r.cannot, 'false,false,false,false,false', 'but not herbs, crops, digging, the shore or fishing');
        t.ok(r.others, 'everyone else is unaffected');
        t.eq(r.fish, 'true/true', 'once Dama teaches him, he can fish');
        t.eq(r.herbs, 'true/true/false', 'taught herbs and food, he can forage too; digging still not');
    }
};
