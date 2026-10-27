// Crafting: stations, fire and fuel, recipes, NPC fees, metal, breakage remains, kits.

module.exports = {
    'campfire, oven and NPC crafting; fuel, recipes and metal': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const C = SmokingIsle.Crafting, IT = n => $dataItems.find(i => i && i.name === n), W = n => $dataWeapons.find(w => w && w.name === n), out = {};
            const R = n => C.recipes.find(x => x.name === n);
            const P = $gameParty, clear = n => P.loseItem(IT(n) || W(n), 999), give = (n, k = 1) => P.gainItem(IT(n) || W(n), k);
            // start from nothing (Battle Test gives 99 of every item)
            P.allItems().slice().forEach(i => P.loseItem(i, 999));
            $gameSystem._siCraft = null;
            // a campfire must be lit before fuel goes in
            give('Laurel Branch', 3); give('Heather Branch');
            out.unlitCarve = C.problem(C.recipes.find(x => x.name === 'Wooden Spear'), 'campfire');
            out.unlitFuel = C.addFuel(IT('Laurel Branch'), 'campfire');
            out.noKit = C.light();
            give('Fire-Starting Kit'); out.lit = C.light() && P.numItems(IT('Fire-Starting Kit')) === 0;
            out.branch = C.addFuel(IT('Laurel Branch'), 'campfire');
            // carving is always known; other recipes need the recipe item
            out.carveKnown = C.recipesAt('campfire').some(x => x.name === 'Wooden Spear');
            out.knifeUnknown = !C.recipesAt('campfire').some(x => x.name === 'Obsidian Knife');
            give('Recipe: Obsidian Knife'); out.knifeKnown = C.recipesAt('campfire').some(x => x.name === 'Obsidian Knife');
            // a knife: blade + sinew + leather, and the Knapping Kit
            ['Obsidian Shard', 'Sinew', 'Leather'].forEach(n => give(n));
            out.needsKit = C.problem(R('Obsidian Knife'), 'campfire');
            give('Knapping Kit'); out.knife = (C.craft(R('Obsidian Knife'), 'campfire') || []).join() + '/' + ['Obsidian Shard', 'Sinew', 'Leather'].map(n => P.numItems(IT(n))).join('');
            // fire-hardening uses a charge; with none left it waits for fuel
            give('Recipe: Fire-Hardened Spear'); give('Wooden Spear', 3);
            const c0 = C.session().charges; C.craft(R('Fire-Hardened Spear'), 'campfire'); out.charge = c0 - C.session().charges;
            C.session().charges = 0; out.noFuel = C.problem(R('Fire-Hardened Spear'), 'campfire');
            // melting needs peat or coal in this session
            give('Recipe: Melt copper ore'); give('Crucible & Mold'); give('Copper Ore'); give('Laurel Branch');
            C.addFuel(IT('Laurel Branch'), 'campfire'); out.noSmelt = C.problem(R('Melt copper ore'), 'campfire');
            give('Peat'); C.addFuel(IT('Peat'), 'campfire'); out.smelt = (C.craft(R('Melt copper ore'), 'campfire') || []).join();
            // leaving the area ends the session
            $gameSystem._siCraft.area = 'somewhere else'; out.newSession = C.session().charges + '/' + C.session().lit;
            // the oven is always lit and gets more from fuel; coal gives 2 more
            give('Brown Coal'); give('Laurel Log'); give('Scrap Wood');
            out.oven = [C.addFuel(IT('Brown Coal'), 'oven'), C.addFuel(IT('Laurel Log'), 'oven'), C.addFuel(IT('Scrap Wood'), 'oven')].join(',');
            out.ovenDoesCampfire = C.recipesAt('oven').some(x => x.name === 'Obsidian Knife') && !C.recipesAt('campfire').some(x => x.name === 'Ceramic Mace');
            // NPCs: materials and a fee; they know their own recipes
            P.gainGold(1000 - P.gold()); give('Copper Ingot');
            out.smith = (C.craft(R('Copper Knife'), 'smith') || []).join() + '/' + (1000 - P.gold());
            give('Bent Copper Knife'); const straighten = C.recipes.find(x => x.name === 'Straighten a Bent Copper Knife');
            out.straightened = (C.craft(straighten, 'smith') || []).join();
            give('Silver Ingot'); out.plated = (C.craft(R('Copper-Silver Knife'), 'electroplater') || []).join();
            P.loseGold(P.gold()); give('Hide'); out.broke = C.problem(R('Leather'), 'tanner');
            // lead sometimes gives silver too
            give('Lead Ore', 2); P.gainGold(100); const melt = C.recipes.find(x => x.name === 'Melt lead ore (smith)');
            const rnd = Math.random; Math.random = () => 0.05; C.craft(melt, 'smith'); Math.random = () => 0.5; C.craft(melt, 'smith'); Math.random = rnd;
            out.lead = P.numItems(IT('Lead Ingot')) + '/' + P.numItems(IT('Silver Ingot'));
            // "either" ingredients: a ceramic mace from clay or potsherds
            out.either = C.recipes.find(x => x.name === 'Ceramic Mace').ins.map(a => a.length).join(',');
            return out;
        });
        t.eq(r.unlitCarve, 'Light the fire first.', 'nothing is made at an unlit campfire, not even carving');
        t.eq(r.unlitFuel, 0, 'fuel can\'t go on an unlit campfire');
        t.eq(r.noKit, false, 'lighting needs a Fire-Starting Kit');
        t.ok(r.lit, 'the Fire-Starting Kit lights it and is used up');
        t.eq(r.branch, 2, 'a branch adds 2 charges to a campfire');
        t.ok(r.carveKnown, 'carving recipes are always known');
        t.ok(r.knifeUnknown && r.knifeKnown, 'other recipes need their recipe item');
        t.eq(r.needsKit, 'Needs a Knapping Kit.', 'knapping needs the Knapping Kit');
        t.eq(r.knife, 'Obsidian Knife/000', 'a knife from obsidian, sinew and leather, one of each');
        t.eq(r.charge, 1, 'fire-hardening uses one charge');
        t.eq(r.noFuel, 'The fire needs fuel.', 'with no charges left, it waits for fuel');
        t.eq(r.noSmelt, 'Melting metal needs peat or coal on the fire.', 'melting needs peat or coal');
        t.eq(r.smelt, 'Copper Ingot', 'with peat on the fire, copper ore melts into an ingot');
        t.eq(r.newSession, '0/false', 'leaving the area ends the session: no charges, not lit');
        t.eq(r.oven, '7,4,1', 'in an oven: coal 7, a log 4, scrap 1');
        t.ok(r.ovenDoesCampfire, 'an oven does every campfire recipe, plus its own');
        t.eq(r.smith, 'Copper Knife/60', 'the smith makes a copper knife from an ingot, for a fee');
        t.eq(r.straightened, 'Copper Knife', 'the smith straightens a bent copper knife');
        t.eq(r.plated, 'Copper-Silver Knife', 'the electroplater plates a copper knife with silver');
        t.eq(r.broke, 'Costs 20 CW.', 'no cowries, no NPC work');
        t.eq(r.lead, '2/1', 'lead ore melts into lead, and sometimes silver too');
        t.eq(r.either, '1,1,2', 'pottery takes clay or potsherds');
    },

    'breakage remains, mahogany, and the kits Sib and Pada bring': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), IT = n => $dataItems.find(i => i && i.name === n), W = n => $dataWeapons.find(w => w && w.name === n), out = {};
            const P = $gameParty;
            ['Stone Caltrops', 'Scrap Wood', 'Bonemeal', 'Potsherds'].forEach(n => P.loseItem(IT(n), 999));
            const n = name => P.numItems(IT(name));
            const yoon = A(10), s = yoon.slotOfType(1);   // Falmi can use every one of these
            const wearOut = name => { yoon.forceChangeEquip(s, W(name)); return yoon.rollWear(s, true); };
            wearOut('Cracked Obsidian Spear'); out.spear = n('Stone Caltrops') + '/' + n('Scrap Wood');
            wearOut('Gap-Toothed Shark-Tooth Paddle'); out.paddle = n('Bonemeal') + '/' + n('Scrap Wood');
            wearOut('Wooden Spear'); out.wood = n('Scrap Wood');
            out.mahogany = wearOut('Mahogany Obsidian Paddle') && yoon.equips()[s].name + '/' + n('Stone Caltrops');
            wearOut('Coral-Studded Club'); out.studs = yoon.equips()[s].name + '/' + n('Bonemeal');
            out.neverNothing = $dataWeapons.filter(w => w && /<Degrades To:\s*0>/.test(w.note) && !/<Breaks Into:/.test(w.note)).map(w => w.name).join(', ');
            out.kits = P.hasItem(IT('Knapping Kit')) + '/' + P.hasItem(IT('Fletching Kit'));
            return out;
        });
        t.eq(r.spear, '1/1', 'a broken stone spear leaves Stone Caltrops and Scrap Wood');
        t.eq(r.paddle, '1/2', 'a broken shark-tooth paddle leaves Bonemeal and Scrap Wood');
        t.eq(r.wood, 3, 'raw wood breaks into Scrap Wood');
        t.eq(r.mahogany, 'Mahogany Paddle/2', 'a mahogany paddle loses its edging (Stone Caltrops) and the mahogany is left');
        t.eq(r.studs, 'Ebony Club/2', 'coral studs come off as Bonemeal');
        t.eq(r.neverNothing, '', 'nothing that wears breaks into nothing');
        t.eq(r.kits, 'true/true', 'Sib brings the Knapping Kit and Pada the Fletching Kit');
    },

    'Star Mother idol and the tired warning': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const out = {}, ce = $dataCommonEvents[3];
            out.rest = ce.name + ': ' + ce.list.find(c => c.code === 102).parameters[0].join('/');
            out.restHeals = ce.list.some(c => c.code === 355 && /Idols\.rest/.test(c.parameters[0])) && !ce.list.some(c => c.code === 314);
            out.inTestRoom = ['Star Mother Idol', 'Red Bowl Idol', 'Sooty Bird Idol'].every(n => $gameMap.events().some(e => e.event().name === n));
            $gameSystem._siTiredWarned = false; $gameParty.members()[0].setTp(80);
            BattleManager.endBattle(0);
            return out;
        });
        await h.page.waitForTimeout(500);
        const msg = await h.eval(() => ({ text: $gameMessage._texts.join(' '), warned: $gameSystem._siTiredWarned }));
        await h.pumpMessages();
        const again = await h.eval(() => { $gameParty.members()[0].setTp(90); BattleManager.endBattle(0); return !!$gameTemp._siTiredPending; });
        t.eq(r.rest, 'Star Mother Idol: Rest until dawn/Share a meal/Leave', 'the Star Mother idol offers rest and a shared meal');
        t.ok(r.restHeals, 'resting is the idol\'s own rest, not a full recovery');
        t.ok(r.inTestRoom, 'the test room has the three idols');
        t.ok(/getting tired/.test(msg.text) && msg.warned, 'leaving a battle tired brings up the warning: ' + msg.text);
        t.eq(again, false, 'the warning only comes once');
    }
};
