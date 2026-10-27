// The Birdman armor set: two pieces boost Air spells; all four start every battle flying (Smoke-Borne).

module.exports = {
    'birdman set': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const out = {}, AR = n => $dataArmors.find(a => a && a.name === n), O = SmokingIsle.Outfits;
            const pada = $gameActors.actor(5);
            const wear = (...names) => names.forEach(n => { const x = AR(n); $gameParty.gainItem(x, 1); pada.forceChangeEquip(pada.equipSlots().indexOf(x.etypeId), x); });
            const sets = () => pada.setBonusStates().map(s => s.name).join(',');
            out.size = O.sets['Birdman'];
            wear('Carved Bird Mask', 'Seabird-Feather Vest'); out.two = sets();
            wear('Tern-Feather Cape', 'Tern-Bone Whistle'); out.all = sets();
            pada.onBattleStart();
            out.flying = SmokingIsle.Ranged.isFlying(pada);
            out.recipes = ['Carved Bird Mask', 'Tern-Bone Whistle', 'Seabird-Feather Vest', 'Tern-Feather Cape']
                .every(n => $dataItems.some(i => i && i.name === 'Recipe: ' + n && /<Recipe Out: armor \d+>/.test(i.note)));
            return out;
        });
        t.eq(r.size, 4, 'four Birdman pieces');
        t.eq(r.two, 'Birdman (2)', 'two pieces: the small bonus');
        t.eq(r.all, 'Birdman (2),Birdman (all)', 'all four: the full bonus');
        t.eq(r.flying, true, 'the full set starts the battle flying');
        t.eq(r.recipes, true, 'every piece has a recipe');
    }
};
