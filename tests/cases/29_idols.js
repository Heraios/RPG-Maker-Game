// Idols of the resting areas: Red Bowl (save), Sooty Bird (fast travel), Star Mother (rest, shared meals).

module.exports = {
    'Star Mother: rest restores Fatigue and Mana, not Health; a shared meal heals everyone': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const I = SmokingIsle.Idols, T = SmokingIsle.Time, out = {}, P = $gameParty, A = id => $gameActors.actor(id);
            const IT = n => $dataItems.find(i => i && i.name === n);
            const yoon = A(2), sib = A(3), lasa = A(4), pada = A(5);
            P.allMembers().forEach(a => { a.setHp(5); a.setMp(0); a.setTp(80); });
            sib.addState(sib.deathStateId());
            const day0 = T.day();
            I.rest();
            out.rest = [yoon.hp, yoon.mp === yoon.mmp, yoon.tp, sib.isAlive() && sib.hp === 1, T.day() - day0, T.periodName()].join('/');
            // the meal: one food each, all into one pot
            P.loseItem(IT('Grilled Meat'), 99); P.loseItem(IT('Roast Chicken'), 99); P.loseItem(IT('Shellfish'), 99);
            P.gainItem(IT('Grilled Meat'), 1); P.gainItem(IT('Roast Chicken'), 1); P.gainItem(IT('Shellfish'), 1);
            out.taboo = I.mealProblem(yoon, IT('Roast Chicken')) + ' | ' + (I.mealProblem(sib, IT('Roast Chicken')) || 'ok');
            out.padaWont = /children/.test(I.mealProblem(pada, IT('Grilled Meat')));
            const atk0 = yoon.atk, hp0 = pada.hp;
            const plan = {}; plan[2] = IT('Grilled Meat'); plan[3] = IT('Roast Chicken'); plan[4] = IT('Shellfish');
            out.summary = I.shareMeal(plan);
            out.healed = pada.hp - hp0;   // Pada didn't eat, but the pot heals everyone
            out.grew = yoon.atk - atk0;
            out.used = [IT('Grilled Meat'), IT('Roast Chicken'), IT('Shellfish')].map(i => P.numItems(i)).join('');
            out.again = I.shareMeal(plan);
            I.rest(); out.hungry = !I.hasEaten();
            // a Full Health food fills everyone
            P.allMembers().forEach(a => a.setHp(5)); P.gainItem(IT('Turtle Stew'), 1);
            const plan2 = {}; plan2[7] = IT('Turtle Stew'); P.addActor(7);
            I.shareMeal(plan2); out.full = P.allMembers().every(a => a.hp === a.mhp);
            // meals can't be eaten from the menu
            SceneManager.push(Scene_Item); SceneManager.goto(Scene_Item);
            return out;
        });
        await h.page.waitForTimeout(400);
        const menu = await h.eval(() => { const w = SceneManager._scene._itemWindow; return w ? w.isEnabled($dataItems.find(i => i && i.name === 'Grilled Meat')) : 'no window'; });
        t.eq(r.rest, '5/true/0/true/1/dawn', 'resting: Fatigue and Mana back, Health not; the fallen wake with 1; it\'s the next dawn');
        t.ok(/Red Bowl/.test(r.taboo) && /ok$/.test(r.taboo), 'Yoon won\'t eat fowl; Sib will: ' + r.taboo);
        t.ok(r.padaWont, 'Pada still won\'t eat');
        t.eq(r.summary, 'Everyone shares the meal: +55 Health each.', 'the pot: 25 + 20 + 10 Health');
        t.eq(r.healed, 55, 'the pot heals even those who didn\'t eat');
        t.eq(r.grew, 1, 'each eater still grows from their own food');
        t.eq(r.used, '000', 'the food is used up');
        t.eq(r.again, null, 'one meal per rest');
        t.ok(r.hungry, 'resting makes everyone hungry again');
        t.ok(r.full, 'a Full Health food fills everyone');
        t.eq(menu, false, 'meals can\'t be eaten from the menu');
    },

    'Sooty Bird flies between idols by day; Red Bowl saves; no Save in the menu': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const I = SmokingIsle.Idols, T = SmokingIsle.Time, out = {};
            out.first = I.destinations('Test Room').length;
            I.remember('Zonfahare', 1, 5, 5);
            out.places = I.destinations('Test Room').join(',');
            T.setPeriod(3); out.night = I.fly('Zonfahare');
            T.setPeriod(0); const p0 = T.periodName();
            out.flew = I.fly('Zonfahare') + '/' + p0 + '>' + T.periodName() + '/' + $gamePlayer._newMapId + ',' + $gamePlayer._newX + ',' + $gamePlayer._newY;
            $gamePlayer.clearTransferInfo();
            out.redBowl = $dataCommonEvents[6].name + '/' + $dataCommonEvents[6].list.some(c => c.code === 352);
            out.sooty = $dataCommonEvents[7].name;
            const w = new Window_MenuCommand(0, 0);
            out.menuSave = w._list.some(c => c.symbol === 'save');
            return out;
        });
        t.eq(r.first, 0, 'the first idol has nowhere to fly yet');
        t.eq(r.places, 'Zonfahare', 'idols you have touched become destinations');
        t.eq(r.night, false, 'Sooty Bird doesn\'t fly at night');
        t.eq(r.flew, 'true/dawn>day/1,5,6', 'by day it carries you, landing below the idol, and time passes');
        t.eq(r.redBowl, 'Red Bowl Idol/true', 'the Red Bowl idol opens the save screen');
        t.eq(r.sooty, 'Sooty Bird Idol', 'the Sooty Bird idol common event');
        t.eq(r.menuSave, false, 'the menu has no Save command');
    }
};
