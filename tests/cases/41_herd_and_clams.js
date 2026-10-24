// Art-driven cuts: goats became sheep, deer are hunted (Deer Trail), Giant Clams are prised open (gathering),
// and the Shepherd calls his herd in two waves.

module.exports = {
    'sheep, deer trails, clams and the Shepherd\'s herd': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, E = n => $dataEnemies.find(e => e && e.name === n), out = {};
            out.names = ['Feral Sheep', 'Mouflon Ram'].every(n => !!E(n)) && !['Feral Goat', 'Ibex', 'Red Deer Stag', 'Giant Clam'].some(n => E(n));
            out.charm = !!$dataArmors.find(a => a && a.name === 'Ram Horn Charm') && E('Mouflon Ram').dropItems.some(d => d.kind === 3 && $dataArmors[d.dataId].name === 'Ram Horn Charm');
            const pada = $gameActors.actor(5), yoon = $gameActors.actor(2), th = $gameActors.actor(11);
            out.clam = G.whoCan(pada, G.TABLE['Giant Clam']) + '/' + G.whoCan(yoon, G.TABLE['Giant Clam']) + '/' + !!G.find('Pearl');
            out.deer = G.whoCan(yoon, G.TABLE['Deer Trail']) + '/' + G.whoCan(th, G.TABLE['Deer Trail']) + '/' + !!G.find('Deer Hide') + '/' + !!G.find('Antler');
            const tr = $dataTroops.find(x => x && x.name === 'Boss: Shepherd of the Deer');
            out.waves = tr.pages.filter(p => p.list.some(c => c.code === 335)).map(p => p.conditions.enemyHp + ':' + p.list.filter(c => c.code === 335).map(c => $dataEnemies[tr.members[c.parameters[0]].enemyId].name).join('+')).join(' | ');
            return out;
        });
        t.ok(r.names, 'Feral Sheep and Mouflon Ram exist; the goat, ibex, stag and clam enemies are gone');
        t.ok(r.charm, 'the Ram Horn Charm drops from Mouflon Rams');
        t.eq(r.clam, 'true/false/true', 'an adult with a knife can prise open a Giant Clam (sometimes a Pearl)');
        t.eq(r.deer, 'true/false/true/true', 'anyone with a knife can take a deer on a Deer Trail, but not the city boy');
        t.eq(r.waves, '70:Golden Eagle+Mouflon Ram | 35:Golden Eagle+Mouflon Ram', 'the Shepherd calls his herd in two waves');
    }
};
