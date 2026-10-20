// Armor and charm recipes: every recipe is sound, quantities, weaver or loom, tanner, oven, priest;
// the Firebrand Gear and Black Hound Regalia sets.

module.exports = {
    'armor and charm recipes': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const C = SmokingIsle.Crafting, IT = n => $dataItems.find(i => i && i.name === n), AR = n => $dataArmors.find(a => a && a.name === n), out = {};
            const P = $gameParty, give = (n, k = 1) => P.gainItem(IT(n) || AR(n), k), have = n => P.numItems(IT(n) || AR(n));
            const R = (out, at) => C.recipes.find(x => x.outs.length === 1 && C.object(x.outs[0]).name === out && x.at === at);
            // every recipe names real things
            out.broken = C.recipes.filter(x => x.ins.some(alts => alts.some(ref => !C.object(ref) || !C.object(ref).name)) ||
                x.outs.some(ref => !C.object(ref) || !C.object(ref).name) || (x.tool && !$dataItems[x.tool].name)).map(x => x.name).join(', ');
            // every set you can make has a recipe for each piece
            const craftable = ['Tapa', 'Reed and Palm', 'Goat-Skin', 'Seal Leather', 'Boar Hide', 'Pine Pitch', 'Slat Armor', 'Sharkskin', 'Deerskin',
                               'Linen Armor', 'Tortoise Shell', 'Firebrand Gear', 'Mouflon Wool'];
            const made = new Set(C.recipes.map(x => C.object(x.outs[0])));
            out.missing = $dataArmors.filter(a => a && a.siOutfit && a.siOutfit.sets.some(s => craftable.includes(s.name)) && !made.has(a)).map(a => a.name).join(', ');
            out.palmFound = !made.has(AR('Pufferfish Helm')) && made.has(AR('Palm-Fibre Cuirass'));
            out.featherNot = !made.has(AR('Feather Crown')) && !made.has(AR('Feather Cape'));
            out.count = C.recipes.filter(x => DataManager.isArmor(C.object(x.outs[0]))).length;
            // start from nothing
            P.allItems().slice().forEach(i => P.loseItem(i, 999)); $gameSystem._siCraft = null; P.gainGold(1000 - P.gold());
            // Tapa: bark beaten into cloth at an oven; a wrap takes two cloths and the Needle & Thread
            give('Recipe: Tapa Cloth'); give('Mulberry Bark', 2);
            C.craft(R('Tapa Cloth', 'oven'), 'oven'); C.craft(R('Tapa Cloth', 'oven'), 'oven'); out.cloth = have('Tapa Cloth');
            give('Fire-Starting Kit'); C.light(); give('Recipe: Tapa Wrap'); give('Needle & Thread');
            P.loseItem(IT('Tapa Cloth'), 1); out.oneCloth = C.problem(R('Tapa Wrap', 'campfire'), 'campfire');
            give('Tapa Cloth'); out.wrap = (C.craft(R('Tapa Wrap', 'campfire'), 'campfire') || []).join() + '/' + have('Tapa Cloth');
            // woven: the weaver knows it and charges; your own loom needs the recipe and the loom
            give('Palm Fronds', 3); give('Sinew', 2);
            out.weaver = (C.craft(R('Palm-Fibre Cuirass', 'weaver'), 'weaver') || []).join() + '/' + (1000 - P.gold());
            const loom = R('Palm-Fibre Greaves', 'campfire');
            out.loomUnknown = !C.recipesAt('campfire').includes(loom);
            give('Recipe: Palm-Fibre Greaves (loom)'); out.noLoom = C.problem(loom, 'campfire');
            give('Backstrap Loom'); out.loom = (C.craft(loom, 'campfire') || []).join();
            // tanner: two hides and a fee
            P.gainGold(1000 - P.gold()); give('Hide', 2);
            out.tanner = (C.craft(R('Boar-Hide Vest', 'tanner'), 'tanner') || []).join() + '/' + (1000 - P.gold());
            // carving is always known
            out.carved = C.recipesAt('campfire').some(x => x === R('Laurel Slat Cuirass', 'campfire'));
            // Firebrand: felt from the weaver, daubed with clay at an oven (uses the fire)
            give('Goat Wool'); give('Mouflon Wool'); give('Goat Wool', 2); give('Clay');
            C.craft(R('Wool Felt', 'weaver'), 'weaver'); C.craft(R('Wool Felt', 'weaver'), 'weaver');
            give('Recipe: Clay-Daubed Coat'); give('Laurel Log'); C.addFuel(IT('Laurel Log'), 'oven');
            const c0 = C.session().charges; out.coat = (C.craft(R('Clay-Daubed Coat', 'oven'), 'oven') || []).join() + '/' + (c0 - C.session().charges);
            // the priest makes prayer strips
            give('Tapa Cloth'); give('Red Ochre'); out.priest = (C.craft(R('Bark-Paper Prayer Strip', 'priest'), 'priest') || []).join();
            // the electroplater sets a Volcano Tear in silver
            give('Volcano Tear'); give('Silver Ingot'); out.peridot = (C.craft(R('Peridot Ring', 'electroplater'), 'electroplater') || []).join();
            return out;
        });
        t.eq(r.broken, '', 'every recipe names real ingredients, outputs and tools');
        t.eq(r.missing, '', 'every piece of every craftable set has a recipe');
        t.ok(r.palmFound, 'the Pufferfish Helm is found, not made');
        t.ok(r.featherNot, 'the Feather set is never crafted (grove priests consecrate it)');
        t.ok(r.count > 60, 'there are ' + r.count + ' armor and charm recipes');
        t.eq(r.cloth, 2, 'mulberry bark is beaten into Tapa Cloth at an earth oven');
        t.eq(r.oneCloth, 'Needs Tapa Cloth.', 'a Tapa Wrap needs two cloths');
        t.eq(r.wrap, 'Tapa Wrap/0', 'with two, both are used');
        t.eq(r.weaver, 'Palm-Fibre Cuirass/25', 'the weaver makes a palm-fibre cuirass for a fee');
        t.ok(r.loomUnknown, 'on your own loom you need the recipe');
        t.eq(r.noLoom, 'Needs a Backstrap Loom.', '...and the loom');
        t.eq(r.loom, 'Palm-Fibre Greaves', 'with both, you weave it yourself');
        t.eq(r.tanner, 'Boar-Hide Vest/40', 'the tanner makes a boar-hide vest from two hides');
        t.ok(r.carved, 'slat armor is carved: always known');
        t.eq(r.coat, 'Clay-Daubed Coat/1', 'felt daubed with clay at an oven makes the Firebrand coat (one charge)');
        t.eq(r.priest, 'Bark-Paper Prayer Strip', 'the priest makes prayer strips');
        t.eq(r.peridot, 'Peridot Ring', 'the electroplater sets a Volcano Tear in silver');
    },

    'Firebrand Gear and Black Hound Regalia': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n), ST = n => SmokingIsle.Ailments.stateByName(n), out = {};
            const wear = (a, names) => names.forEach(n => { const it = AR(n); a.forceChangeEquip(a.slotOfType(it.etypeId), it); });
            const yoon = A(2);
            out.kids = ['Wet-Felt Hood', 'Clay-Daubed Coat', 'Scoria-Plate Cuirass', 'Hound-Skull Helm'].every(n => yoon.canEquip(AR(n)));
            wear(yoon, ['Wet-Felt Hood', 'Clay-Daubed Coat']); out.fire2 = Math.round(yoon.elementRate(10) * 100);
            wear(yoon, ['Firebrand\'s Mitts', 'Felt Leggings', 'Felt Boots']);
            yoon.removeState(ST('Wet')); yoon.onBattleStart(); out.wet = yoon.isStateAffected(ST('Wet'));
            out.smolder = yoon.isStateResist(ST('Smoldering')) && yoon.isStateResist(ST('Enflamed'));
            yoon.removeState(ST('Wet'));
            const pada = A(5);
            wear(pada, ['Hound-Skull Helm', 'Black Hound Pelt', 'Scoria-Plate Cuirass', 'Ember-Vein Leggings', 'Ash-Walker Boots']);
            out.hound = SmokingIsle.Outfits.sets['Black Hound Regalia'] + '/' + pada.isStateResist(ST('Mired'));
            const real = Math.random; Math.random = () => 0; pada.removeState(ST('Panicked')); pada.removeState(ST('Enraged'));
            pada.onTurnEnd(); out.whispers = pada.isStateAffected(ST('Panicked')) || pada.isStateAffected(ST('Enraged'));
            Math.random = real; pada.removeState(ST('Panicked')); pada.removeState(ST('Enraged'));
            out.guard = SmokingIsle.Outfits.objects(pada, 'guardVs').some(o => o.siOutfit.guardVs.kind === 'destroyer');
            return out;
        });
        t.ok(r.kids, 'both late sets fit children too');
        t.eq(r.fire2, 75, 'Firebrand (2): 25% less Fire damage');
        t.ok(r.wet, 'Firebrand (all): you start every battle Wet');
        t.ok(r.smolder, 'Firebrand (all): immune to Smoldering and Enflamed');
        t.eq(r.hound, '5/true', 'Black Hound Regalia: five parts with the pelt; Ash-Walker Boots stop Mired');
        t.ok(r.whispers, 'the Black Hound Regalia whispers');
        t.ok(r.guard, 'Black Hound Regalia (all): less damage from the Destroyer\'s servants');
    }
};
