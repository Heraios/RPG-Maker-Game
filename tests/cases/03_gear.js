// Weapon swapping and wear tiers (SI_Gear).

module.exports = {
    'weapon materials: copper-silver magic edge, paddle-swords, unbreakable bronze, two-handed maul': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const W = n => $dataWeapons.find(w => w && w.name === n), yoon = $gameActors.actor(2), pada = $gameActors.actor(5);
            const e = $gameTroop.members()[0];
            const jab = weapon => { yoon.forceChangeEquip(yoon.slotOfType(1), weapon); let s = 0; for (let i = 0; i < 400; i++) { const a = new Game_Action(yoon); a.setSkill(11); s += a.makeDamageValue(e, false); } return s / 400; };
            const out = { edge: jab(W('Copper-Silver Knife')) / jab(W('Copper Knife')) };
            out.yoonPaddle = yoon.canEquip(W('Obsidian Paddle'));
            out.sibPaddle = $gameActors.actor(3).canEquip(W('Obsidian Paddle'));
            out.bronzeWears = ['Bronze Knife', 'Bronze Spear', 'Bronze Axe', 'Bronze Mace', 'Bronze Khopesh', 'Bronze Leaf Blade'].some(n => W(n).siWearChance > 0);
            out.copperScrap = W('Bent Copper Mace').siBreaksInto === 5;
            pada.forceChangeEquip(pada.slotOfType(1), W('Basalt Hammer')); out.mawlLocks = !pada.isEquipChangeOk(pada.slotOfType(2));
            pada.forceChangeEquip(pada.slotOfType(1), W('Copper Axe')); out.hatchetFree = pada.isEquipChangeOk(pada.slotOfType(2));
            return out;
        });
        t.between(r.edge, 1.08, 1.22, 'copper-silver adds about 15% magic damage to weapon skills (x' + r.edge.toFixed(2) + ')');
        t.ok(r.yoonPaddle && !r.sibPaddle, 'Yoon can use a paddle-sword; Sib (junior priest) cannot');
        t.ok(!r.bronzeWears, 'bronze never wears');
        t.ok(r.copperScrap, 'copper weapons break into Scrap Copper');
        t.ok(r.mawlLocks, 'the Basalt Hammer needs both hands');
        t.ok(r.hatchetFree, 'the Copper Axe is a one-handed hatchet');
    },

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
        t.eq(r.after1, 'Chipped Obsidian Knife', 'Obsidian Knife wears into the chipped tier');
        t.eq(r.after2, 'none', 'the chipped knife then breaks');
        t.ok(/Kept the Scrap Copper/.test(r.m3), 'copper breaks into Scrap Copper: ' + r.m3);
        t.eq(r.remains, 1, 'the scrap copper is in the bag');
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
