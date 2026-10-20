// Wild foods, garden crops and fae food: who can eat them, how they're gathered and cooked, and growth.

module.exports = {
    'wild and fae food: taboos, gathering, cooking, and how far each character can grow': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n), out = {};
            const G = SmokingIsle.Gather, T = SmokingIsle.Time, C = SmokingIsle.Crafting, P = $gameParty, map = $gameMap.mapId();
            const eats = (id, n) => !A(id).tabooRefusal(IT(n));
            const who = n => [2, 3, 4, 5, 7, 8, 9, 10, 11, 12].filter(id => eats(id, n) && A(id).mealRefusal() === null).map(id => A(id).name()).join(',');
            out.nectar = who('Bellflower Nectar');
            out.goblin = who('Goblin\'s Gold');
            out.mould = who('Leaf Mould');
            out.honey = who('Wild Honey');
            out.sweetPotato = who('Baked Sweet Potato');
            out.faeLine = A(2).tabooRefusalText(IT('Leaf Mould')) + ' | ' + A(4).tabooRefusalText(IT('Leaf Mould'));
            // growth: every food each character may eat, up to its cap
            const meals = $dataItems.filter(i => i && SmokingIsle.Meals.isMeal(i));
            const grow = id => { const a = A(id), tot = [0, 0, 0, 0, 0, 0, 0, 0];
                meals.filter(f => !a.tabooRefusal(f)).forEach(f => f.effects.filter(e => e.code === 42).forEach(e => tot[e.dataId] += e.value1 * f.siMealCap));
                return [0, 1, 2, 3, 4, 6].map(k => tot[k]).join('/'); };
            out.growth = [2, 4, 9, 10].map(id => A(id).name() + ' ' + grow(id)).join(' | ');
            // gathering: a dawn-only fog, bees smoked out with a torch, Lasa's cave food
            [7, 10].forEach(id => P.addActor(id));
            const yoon = A(2), lasa = A(4), spot = $gameMap.events().find(e => e.event().name === 'Gather: Clay Pit').eventId();
            T.setPeriod(1); out.fogDay = G.gather(map, spot, 'Fog Laurel', yoon).text;
            T.sleep(); out.fogDawn = G.gather(map, spot, 'Fog Laurel', yoon).text;
            T.sleep(); P.loseItem(IT('Torch'), 99); out.noTorch = G.gather(map, spot, 'Bee Rock', yoon).text;
            P.gainItem(IT('Torch'), 1); const bees = G.gather(map, spot, 'Bee Rock', yoon);
            out.bees = bees.text + ' / ' + bees.worn + ' / ' + P.numItems(IT('Torch'));
            T.sleep(); out.goblinYoon = G.gatherers().filter(a => G.canGather(a, G.TABLE['Goblin\'s Gold'])).map(a => a.name()).join(',');
            // cooking: sweet potato in the earth oven, cosco flour with the quern
            P.gainItem(IT('Sweet Potato'), 1); P.gainItem(IT('Laurel Log'), 1); C.addFuel(IT('Laurel Log'), 'oven');
            out.baked = (C.craft(C.recipes.find(x => x.name === 'Baked Sweet Potato'), 'oven') || []).join();
            out.flourKnown = C.recipes.find(x => x.name === 'Cosco Seed Flour').known;
            out.wording = IT('Grilled Meat').description.indexOf('Star Mother') >= 0;
            // Tou lays remains to rest: all stats up; nobody else can
            out.remainsWho = who('Ancestral Remains') + '/' + who('Crew Remains');
            out.remainsLine = A(2).tabooRefusalText(IT('Crew Remains'));
            P.addActor(9); const tou = A(9), I = SmokingIsle.Idols;
            P.allMembers().forEach(a => { a._siFed = false; });
            P.gainItem(IT('Ancestral Remains'), 1);
            const before = [0, 1, 2, 3, 4, 5, 6, 7].map(p => tou.paramBase(p) + tou._paramPlus[p]);
            const plan = {}; plan[9] = IT('Ancestral Remains');
            out.rite = I.shareMeal(plan);
            out.riteGain = [0, 1, 2, 3, 4, 5, 6, 7].map((p, k) => tou.paramBase(p) + tou._paramPlus[p] - before[k]).join(',');
            out.caps = IT('Ancestral Remains').siMealCap + '/' + IT('Crew Remains').siMealCap;
            return out;
        });
        t.eq(r.nectar, 'Lasa,Falmi', 'fae food: only Lasa and Falmi');
        t.eq(r.goblin, 'Lasa', 'cave-fae food: only Lasa');
        t.eq(r.mould, 'Falmi', 'forest-fae food: only Falmi');
        t.eq(r.honey, 'Yoon,Sib,Lasa,Dama,Parl,Tou,Falmi,Thenmy,Patience', 'wild honey: everyone who eats (Tou offers it)');
        t.eq(r.sweetPotato, 'Yoon,Sib,Dama,Parl,Tou,Thenmy,Patience', 'baked sweet potato: not the fae (cooked; a domestic crop)');
        t.ok(/Nobody but the fae/.test(r.faeLine) && /another kind of fae\. Lasa can't/.test(r.faeLine), 'the fae food lines: ' + r.faeLine);
        t.eq(r.growth, 'Yoon 83/23/16/16/7/13 | Lasa 74/41/7/13/7/13 | Tou 67/21/13/16/13/19 | Falmi 79/32/10/14/10/13',
            'growth (Health/Mana/Might/Endurance/Spirit/Speed): the fae catch up; Tou with the remains');
        t.ok(/only comes at dawn/.test(r.fogDay), 'fog drip only at dawn');
        t.eq(r.fogDawn, 'Yoon fills a gourd with some Fog Drip.', 'at dawn, fog combed from the leaves');
        t.eq(r.noTorch, 'You need a Torch to smoke out the bees.', 'bees need smoking out');
        t.eq(r.bees, 'Yoon gathers some Wild Honey. / The Torch burns down, smoking out the bees. / 0', 'wild honey, and the torch burns down');
        t.eq(r.goblinYoon, 'Lasa', 'only Lasa can gather cave fae food');
        t.eq(r.baked, 'Baked Sweet Potato', 'sweet potato baked in the earth oven');
        t.ok(r.flourKnown, 'anyone can toast cosco seeds');
        t.ok(r.wording, 'meals now say they are shared at a Star Mother idol');
        t.eq(r.remainsWho, 'Tou/Tou', 'only Tou lays remains to rest');
        t.eq(r.remainsLine, 'Only Tou can lay them to rest.', 'others are told so');
        t.eq(r.rite, 'Tou lays a royal ancestor to rest.', 'the rite, at the Star Mother idol');
        t.eq(r.riteGain, '2,2,2,2,2,2,2,2', 'ancestral remains: all eight stats +2');
        t.eq(r.caps, '2/3', 'two ancestors and three Crew children count');
    }
};
