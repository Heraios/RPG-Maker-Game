// Meal auto-pick: everyone gets the food that still grows them, the pickiest eaters choose first,
// taboos are respected, your own picks are kept, and once nothing grows anyone it only adds enough
// food to heal the party.

module.exports = {
    'meal auto-pick': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const out = {}, I = SmokingIsle.Idols, IT = n => $dataItems.find(i => i && i.name === n);
            $gameParty._actors = [2, 3, 4, 7]; $gameParty._items = {};
            const members = $gameParty.allMembers();
            members.forEach(a => { a.recoverAll(); a._siMeals = {}; a._siFed = false; });
            ['Grilled Meat', 'Dried Fish', 'Roast Chicken', 'Bellflower Nectar', 'Barley Bread'].forEach(n => $gameParty.gainItem(IT(n), 1));
            const name = p => Object.keys(p).sort().map(id => $gameActors.actor(Number(id)).name() + ':' + p[id].name).join(', ');
            // Yoon land, Sib birds, Lasa fae/raw, Dama sea; nobody hurt
            const plan = I.autoPlan({});
            out.plan = name(plan);
            out.taboo = Object.keys(plan).every(id => !I.mealProblem($gameActors.actor(Number(id)), plan[id]));
            // a pick you made yourself is kept
            const mine = { 2: IT('Barley Bread') }; I.autoPlan(mine); out.kept = mine[2].name;
            // once nothing grows anyone, it only adds food while the party needs healing
            members.forEach(a => { a._siMeals = {}; $dataItems.forEach(i => { if (i && SmokingIsle.Meals.isMeal(i)) a._siMeals[i.id] = 99; }); });
            out.fullAndCapped = Object.keys(I.autoPlan({})).length;
            members[0].setHp(1); out.hurtAndCapped = Object.keys(I.autoPlan({})).length >= 1;
            return out;
        });
        t.eq(r.plan, 'Yoon:Grilled Meat, Sib:Roast Chicken, Lasa:Bellflower Nectar, Dama:Dried Fish', 'each gets a food that grows them, within their taboos');
        t.ok(r.taboo, 'no taboo food is picked');
        t.eq(r.kept, 'Barley Bread', 'your own pick is kept');
        t.eq(r.fullAndCapped, 0, 'nothing picked when nobody grows and nobody is hurt');
        t.ok(r.hurtAndCapped, 'but food is added when someone needs healing');
    },
};
