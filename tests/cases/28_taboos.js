// Food taboos: who won't eat what, children and alcohol, and the Seafarers' shell taboo on gear.

module.exports = {
    'food taboos and the shell taboo': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n), AR = n => $dataArmors.find(a => a && a.name === n), out = {};
            const eats = (id, n) => !A(id).tabooRefusal(IT(n));
            const menu = ['Barley Bread', 'Grilled Meat', 'Roast Chicken', 'Dried Fish', 'Shellfish', 'Hen\'s Egg', 'Goat Milk', 'Grapes', 'Strawberry-Tree Fruit', 'Islander Wine'];
            const diet = id => menu.filter(n => eats(id, n)).join(', ');
            out.yoon = diet(2); out.sib = diet(3); out.lasa = diet(4); out.dama = diet(7); out.parl = diet(8);
            out.thenmy = diet(11); out.kath = diet(14);
            out.seafarerLines = [A(8).tabooRefusalText(IT('Goat Milk')), A(8).tabooRefusalText(IT('Shellfish')), A(14).tabooRefusalText(IT('Grilled Meat'))].join(' | ');
            out.tou = diet(9); out.falmi = diet(10); out.patience = diet(12);
            out.lines = [2, 3, 4, 9].map(id => A(id).tabooRefusalText(IT('Dried Fish')) || '-').join(' | ');
            out.childWine = A(2).tabooRefusalText(IT('Islander Wine')) + ' / ' + A(4).tabooRefusalText(IT('Palm Wine'));
            out.adultWine = eats(5, 'Islander Wine') && eats(7, 'All-Seafarer Grog');
            // in battle too: a child can't be given grog
            const grog = new Game_Action(A(5)); grog.setItem(IT('All-Seafarer Grog').id);
            out.battleGrog = grog.testApply(A(2)) + '/' + grog.testApply(A(5));
            // the Seafarers won't wear turtle shell or seashells; Islanders will
            out.shell = ['Tortoise-Shell Cuirass', 'Sea-Turtle Buckler', 'Shell Wind-Chime', 'Cowrie Anklet', 'Turtle-Shell Comb'].map(n =>
                (A(8).canEquip(AR(n)) ? 'P' : '-') + (A(11).canEquip(AR(n)) ? 'T' : '-')).join(' ');
            out.islanderShell = A(7).canEquip(AR('Sea-Turtle Buckler')) && A(2).canEquip(AR('Cowrie Anklet'));
            // Pada, Juda and the ghost still eat nothing
            out.refuseAll = [1, 5, 6].every(id => A(id).mealRefusal() !== null) && A(4).mealRefusal() === null;
            return out;
        });
        t.eq(r.yoon, 'Barley Bread, Grilled Meat, Hen\'s Egg, Goat Milk, Grapes, Strawberry-Tree Fruit', 'Yoon (Red Bowl): only land meat; no fish, no fowl');
        t.eq(r.sib, 'Barley Bread, Roast Chicken, Hen\'s Egg, Goat Milk, Grapes, Strawberry-Tree Fruit', 'Sib (Sooty Bird): only bird meat');
        t.eq(r.lasa, 'Shellfish, Hen\'s Egg, Goat Milk, Grapes, Strawberry-Tree Fruit', 'Lasa: nothing cooked or salted');
        t.eq(r.dama, 'Barley Bread, Dried Fish, Shellfish, Hen\'s Egg, Goat Milk, Grapes, Strawberry-Tree Fruit, Islander Wine', 'Dama (Star Mother): only sea meat');
        t.eq(r.parl, 'Barley Bread, Grilled Meat, Roast Chicken, Dried Fish, Grapes, Strawberry-Tree Fruit, Islander Wine', 'Parl (Seafarer man): nothing shelled, no milk');
        t.eq(r.thenmy, r.parl, 'Thenmy eats like Parl');
        t.eq(r.kath, 'Barley Bread, Roast Chicken, Dried Fish, Goat Milk, Grapes, Strawberry-Tree Fruit', 'Kathrout (Seafarer woman): no shells, no red meat, no wine');
        t.eq(r.seafarerLines, 'Parl: "Milk? I\'m a grown man. Milk\'s for mothers and babies." | Parl: "Something out of a shell? Never. The gods would sink my ship." | Kathrout: "Red meat is the bull\'s flesh. It is not for a woman to eat."', 'each taboo has its own reason');
        t.eq(r.tou, 'Barley Bread, Grapes, Strawberry-Tree Fruit', 'Tou: only what grows; no wine for a child');
        t.eq(r.falmi, 'Grilled Meat, Dried Fish, Shellfish, Strawberry-Tree Fruit', 'Falmi: only wild food');
        t.eq(r.patience, 'Barley Bread, Grilled Meat, Roast Chicken, Dried Fish, Hen\'s Egg, Goat Milk', 'Patience: dog-safe food');
        t.ok(/Yoon: "My family is sworn to the Red Bowl/.test(r.lines) && /Sib: "A priest of Sooty Bird/.test(r.lines), 'each says why: ' + r.lines);
        t.eq(r.childWine, 'The adults won\'t let a child drink that. / The adults won\'t let a child drink that.', 'children are never given alcohol');
        t.ok(r.adultWine, 'adults may drink');
        t.eq(r.battleGrog, 'false/true', 'not in battle either');
        t.eq(r.shell, '-- -- -- -- --', 'Parl and Thenmy won\'t wear turtle shell or seashells');
        t.ok(r.islanderShell, 'Islanders will');
        t.ok(r.refuseAll, 'Pada, Juda and the ghost still eat nothing; Lasa now eats');
    }
};
