// Recipes for consumables: the Fire-Starting Kit (made before the fire is lit), food, remedies,
// battle items and supplies.

module.exports = {
    'Fire-Starting Kit, meals, remedies and battle items': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const C = SmokingIsle.Crafting, IT = n => $dataItems.find(i => i && i.name === n), out = {};
            const P = $gameParty, give = (n, k = 1) => P.gainItem(IT(n), k), have = n => P.numItems(IT(n));
            const R = (name, at) => C.recipes.find(x => C.object(x.outs[0]).name === name && (!at || x.at === at));
            out.broken = C.recipes.filter(x => x.ins.some(alts => alts.some(ref => !C.object(ref) || !C.object(ref).name)) ||
                x.outs.some(ref => !C.object(ref) || !C.object(ref).name) || (x.tool && !$dataItems[x.tool].name)).map(x => x.name).join(', ');
            P.allItems().slice().forEach(i => P.loseItem(i, 999)); $gameSystem._siCraft = null; P.gainGold(1000 - P.gold());
            // out of kits in the wild: carve a new one at the unlit campfire, then light it
            give('Heather Branch'); give('Sinew'); give('Palm Fronds');
            const kit = R('Fire-Starting Kit');
            out.kitKnown = C.recipesAt('campfire').includes(kit);
            out.unlit = C.problem(kit, 'campfire');
            out.kit = (C.craft(kit, 'campfire') || []).join();
            out.otherUnlit = C.problem(R('Torch'), 'campfire');
            out.lit = C.light();
            give('Laurel Log', 3); C.addFuel(IT('Laurel Log'), 'campfire'); C.addFuel(IT('Laurel Log'), 'campfire');
            // a staple: toasted barley needs the quern and the fire
            give('Barley', 2); out.noQuern = C.problem(R('Toasted Barley'), 'campfire');
            give('Trachyte Quern'); const c0 = C.session().charges;
            out.toasted = (C.craft(R('Toasted Barley'), 'campfire') || []).join() + '/' + (c0 - C.session().charges);
            // most recipes need their recipe item
            out.stewUnknown = !C.recipesAt('campfire').includes(R('Lentil Stew'));
            give('Recipe: Lentil Stew'); give('Lentils'); give('Fresh Water'); give('Cooking Pot');
            out.stew = (C.craft(R('Lentil Stew'), 'campfire') || []).join();
            // drying and salting happen in villages (the earth oven)
            give('Recipe: Dried Fish'); give('Raw Fish'); give('Sea Salt');
            out.fishAtCamp = C.recipesAt('campfire').includes(R('Dried Fish'));
            out.fish = (C.craft(R('Dried Fish'), 'oven') || []).join();
            // two bandages from a strip of tapa
            give('Recipe: Bandage'); give('Tapa Cloth'); give('Needle & Thread');
            C.craft(R('Bandage'), 'campfire'); out.bandages = have('Bandage');
            // linen makes three; raw bark makes one; a spare garment (never a worn one) tears into two
            const byName = n => C.recipes.find(x => x.name === n);
            P.loseItem(IT('Bandage'), 99); give('Linen Cloth'); C.craft(byName('Bandages from Linen'), 'campfire'); out.linen = have('Bandage');
            P.loseItem(IT('Bandage'), 99); give('Mulberry Bark'); C.craft(byName('Bark Bandage'), 'campfire'); out.bark = have('Bandage');
            P.loseItem(IT('Bandage'), 99);
            const yoon = $gameActors.actor(2), wrap = $dataArmors.find(a => a && a.name === 'Tapa Wrap'), tear = byName('Tear Up a Tapa Wrap');
            P.loseItem(wrap, 99, true); yoon.forceChangeEquip(yoon.slotOfType(4), wrap);
            out.wornSafe = C.problem(tear, 'campfire');
            P.gainItem(wrap, 1); C.craft(tear, 'campfire'); out.torn = have('Bandage') + '/' + P.numItems(wrap) + '/' + (yoon.equips().includes(wrap));
            out.allKnown = ['Bandage', 'Bandages from Linen', 'Bark Bandage', 'Tear Up a Tapa Wrap'].every(n => byName(n).known);
            P.loseItem(IT('Bandage'), 99); give('Bandage', 2);
            // a poultice wraps a herb in a bandage
            give('Recipe: Burnwort Poultice'); give('Burnwort');
            out.poultice = (C.craft(R('Burnwort Poultice'), 'campfire') || []).join() + '/' + have('Bandage');
            // battle items: lye from wood ash, paint from the quern
            give('Recipe: Lye Flask'); give('Scrap Wood', 2); give('Potsherds');
            out.lye = (C.craft(R('Lye Flask'), 'oven') || []).join();
            give('Recipe: Orchil War Paint'); give('Orchil Lichen'); give('Bonemeal');
            out.paint = (C.craft(R('Orchil War Paint'), 'campfire') || []).join();
            // NPCs: chlorine from brine, purifying salt from a priest
            give('Brine Jar'); out.chlorine = (C.craft(R('Chlorine Jar'), 'electroplater') || []).join();
            give('Sea Salt'); out.salt = (C.craft(R('Purifying Salt'), 'priest') || []).join();
            // every meal can be cooked or found; at least one cooked meal raises each of max Health, Might, Endurance, Speed, Spirit
            const made = new Set(C.recipes.map(x => C.object(x.outs[0])));
            const growth = { 0: 'max Health', 2: 'Might', 3: 'Endurance', 4: 'Spirit', 6: 'Speed' };
            out.growth = Object.keys(growth).filter(p => !$dataItems.some(i => i && made.has(i) && /<Meal>/.test(i.note) &&
                i.effects.some(e => e.code === 42 && e.dataId === Number(p)))).map(p => growth[p]).join(', ');
            out.count = C.recipes.filter(x => DataManager.isItem(C.object(x.outs[0]))).length;
            return out;
        });
        t.eq(r.broken, '', 'every recipe names real ingredients, outputs and tools');
        t.ok(r.kitKnown, 'everyone knows how to make a Fire-Starting Kit');
        t.eq(r.unlit, '', 'it can be made at a campfire that isn\'t lit yet');
        t.eq(r.kit, 'Fire-Starting Kit', 'a bow drill from a branch, sinew and tinder');
        t.eq(r.otherUnlit, 'Light the fire first.', 'other recipes still need the fire lit');
        t.ok(r.lit, 'the new kit lights the fire');
        t.eq(r.noQuern, 'Needs a Trachyte Quern.', 'toasted barley needs the quern');
        t.eq(r.toasted, 'Toasted Barley/1', 'with the quern, barley is toasted and ground (one charge)');
        t.ok(r.stewUnknown, 'Lentil Stew needs its recipe');
        t.eq(r.stew, 'Lentil Stew', 'lentils and water in the Cooking Pot make stew');
        t.ok(!r.fishAtCamp, 'drying fish is village work, not campfire work');
        t.eq(r.fish, 'Dried Fish', 'fish and salt at an earth oven make Dried Fish');
        t.eq(r.bandages, 2, 'a Tapa Cloth makes two bandages');
        t.eq(r.linen, 3, 'a Linen Cloth makes three bandages');
        t.eq(r.bark, 1, 'raw Mulberry Bark makes one, in the field');
        t.eq(r.wornSafe, 'Needs Tapa Wrap.', 'a worn garment is never torn up');
        t.eq(r.torn, '2/0/true', 'a spare Tapa Wrap tears into two bandages; the worn one stays on');
        t.ok(r.allKnown, 'everyone knows how to make bandages');
        t.eq(r.poultice, 'Burnwort Poultice/1', 'a poultice uses up a herb and a bandage');
        t.eq(r.lye, 'Lye Flask', 'wood ash and a pot make a Lye Flask');
        t.eq(r.paint, 'Orchil War Paint', 'orchil lichen and bonemeal, ground in the quern, make war paint');
        t.eq(r.chlorine, 'Chlorine Jar', 'the electroplater makes chlorine from brine');
        t.eq(r.salt, 'Purifying Salt', 'a priest blesses salt');
        t.eq(r.growth, '', 'some cooked meal raises each of max Health, Might, Endurance, Spirit and Speed');
        t.ok(r.count >= 50, r.count + ' recipes for consumables and materials');
    }
};
