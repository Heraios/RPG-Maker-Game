// Weapon swapping and wear tiers (SI_Gear).

module.exports = {
    'weapons and armor wear down, break, and copper leaves remains': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), W = id => $dataWeapons[id];
            const yoon = A(2), pada = A(5);
            [1, 7, 9, 10].forEach(id => W(id).siWearChance = 100);
            yoon.forceChangeEquip(yoon.slotOfType(1), W(1));
            const m1 = yoon.rollWear(yoon.slotOfType(1)), after1 = (yoon.weapons()[0] || {}).name;
            const m2 = yoon.rollWear(yoon.slotOfType(1)), after2 = yoon.weapons()[0] ? yoon.weapons()[0].name : 'none';
            $dataClasses[5].traits.push({ code: 51, dataId: 2, value: 0 });
            pada.forceChangeEquip(pada.slotOfType(1), W(9));
            const before = $gameParty.numItems($dataItems[5]); $gameParty.loseItem($dataItems[5], 99);
            const m3 = pada.rollWear(pada.slotOfType(1));
            const remains = $gameParty.numItems($dataItems[5]);
            pada.forceChangeEquip(pada.slotOfType(1), W(10)); const m4 = pada.rollWear(pada.slotOfType(1));
            return { m1, after1, m2, after2, m3, remains, m4 };
        });
        t.eq(r.after1, 'Chipped Flint Knife', 'Flint Knife wears into the chipped tier');
        t.eq(r.after2, 'none', 'the chipped knife then breaks');
        t.ok(/Kept the Broken Copper Khopesh/.test(r.m3), 'copper breaks into a kept item: ' + r.m3);
        t.eq(r.remains, 1, 'the broken copper item is in the bag');
        t.ok(/broke!$/.test(r.m4), 'stone breaks and disappears: ' + r.m4);
    },

    'swapping costs the turn; Free Swap does not': async (h, t) => {
        await h.battle();
        await h.eval(() => [1, 2, 4, 5, 6].forEach(id => $gameParty.gainItem($dataWeapons[id], 1)));
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const s = SceneManager._scene, actor = BattleManager.actor();
            actor._equips[actor.slotOfType(1)].setObject($dataWeapons[1]);
            const open = () => { const w = s._actorCommandWindow; w.setup(actor); w.selectSymbol('tactics'); w.processOk(); s._tacticsWindow.selectSymbol('swap'); s._tacticsWindow.processOk(); };
            $dataActors[actor.actorId()].note += '\n<Free Swap>';
            open();
            const list = s._swapWindow._data.map(w => w.name);
            s._swapWindow.select(0); s._swapWindow.processOk();
            const freeStillInput = s._actorCommandWindow.active && BattleManager.isInputting();
            const swapEnabled = s._actorCommandWindow._tacticsCommands.find(c => c.symbol === 'swap').enabled;
            return { name: actor.name(), list, weapon: actor.weapons()[0] && actor.weapons()[0].name, freeStillInput, swapEnabled };
        });
        t.ok(r.list.length > 0, 'swap list shows carried weapons');
        t.ok(r.freeStillInput, 'Free Swap keeps the turn');
        t.eq(r.swapEnabled, false, 'Free Swap only once per turn');
    }
};
