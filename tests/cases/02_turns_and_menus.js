// Turn order (SI_TurnOrder), battle menus (SI_BattleMenu), party switching (SI_PartySwitch).

module.exports = {
    'faster battlers get more turns; action cost moves the preview': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            $gameActors.actor(4).addParam(6, 70);   // Lasa much faster
            $gameActors.actor(5).addParam(6, -20);  // Pada slower
            const count = (list, name) => list.filter(e => e.battler.name() === name).length;
            const preview = BattleManager.ctbPreview(30, 100);
            const pos = cost => BattleManager.ctbPreview(12, cost).findIndex(e => e.preview);
            return { lasa: count(preview, 'Lasa'), pada: count(preview, 'Pada'), quick: pos(30), slow: pos(250) };
        });
        t.ok(r.lasa > r.pada * 2, `Lasa (${r.lasa}) should act far more often than Pada (${r.pada})`);
        t.ok(r.quick < r.slow, `a cheap action lands sooner (${r.quick}) than a slow one (${r.slow})`);
    },

    'main menu: Fight, Talk, Tactics and their submenus': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const s = SceneManager._scene, w = s._actorCommandWindow;
            const main = w._list.map(c => c.name);
            const tactics = w._tacticsCommands.map(c => c.name);
            w.selectSymbol('skill'); w.processOk();
            const types = s._skillTypeWindow.visible ? s._skillTypeWindow._list.map(c => c.name) : [];
            s._skillTypeWindow.selectSymbol('skill'); s._skillTypeWindow.select(s._skillTypeWindow._list.findIndex(c => c.name === 'Physical')); s._skillTypeWindow.processOk();
            const physical = s._skillWindow._data.map(x => x && x.name);
            s._skillWindow.processCancel();
            s._skillTypeWindow.processCancel();
            w.selectSymbol('tactics'); w.processOk();
            s._tacticsWindow.selectSymbol('item'); s._tacticsWindow.processOk();
            const itemOpen = s._itemWindow.active;
            s._itemWindow.processCancel();
            const backToTactics = s._tacticsWindow.active;
            s._tacticsWindow.selectSymbol('rest'); s._tacticsWindow.processOk();
            const rest = s._skillWindow.active ? s._skillWindow._data.map(x => x && x.name) : [];
            s._skillWindow.processCancel();
            const restBack = s._tacticsWindow.active;
            const yoon2 = $gameActors.actor(2); ['Ahi', 'Burning Touch'].forEach(n => yoon2.learnSkill($dataSkills.find(x => x && x.name === n).id)); const yoonTypes = SmokingIsle.BattleMenu.skillTypes(yoon2).map(id => $dataSystem.skillTypes[id]);
            return { main, tactics, types, physical, itemOpen, backToTactics, rest, restBack, yoonTypes };
        });
        t.eq(r.main.join('/'), 'Fight/Talk/Tactics', 'main menu');
        t.eq(r.tactics.join('/'), 'Resting/Weapon Swap/Item/Escape', 'Tactics submenu (no reserve members, so no Switch)');
        t.eq(r.types.join('/'), 'Physical/Magical', 'Fight: only the types this character has skills in');
        t.eq(r.physical.slice(0, 2).join('/'), 'Punch/Guard', 'Physical starts with Punch and Guard: ' + r.physical);
        t.ok(r.rest.includes('Catch Breath'), 'Resting (under Tactics) lists the resting skills: ' + r.rest);
        t.ok(r.restBack, 'Cancel from Resting returns to Tactics');
        t.eq(r.yoonTypes.join('/'), 'Physical/Magical/Cultural/Innate', "Yoon's Fight menu (ghost skills are Innate)");
        t.ok(r.itemOpen, 'Item opens from Tactics');
        t.ok(r.backToTactics, 'Cancel from Item returns to Tactics');
    },

    'party switching hands over the turn': async (h, t) => {
        await h.battle();
        await h.eval(() => { $gameParty.addActor(7); $gameParty.addActor(8); $gameActors.actor(8).setHp(0); });
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const s = SceneManager._scene, w = s._actorCommandWindow;
            const before = BattleManager.actor().name();
            w.setup(BattleManager.actor());
            w.selectSymbol('tactics'); w.processOk();
            s._tacticsWindow.selectSymbol('switch'); s._tacticsWindow.processOk();
            const list = s._reserveWindow._data.map(a => a.name() + (a.isAlive() ? '' : '(KO)'));
            s._reserveWindow.select(1); s._reserveWindow.processOk();
            const koBlocked = s._reserveWindow.active;
            s._reserveWindow.select(0); s._reserveWindow.processOk();
            return { before, list, koBlocked, now: BattleManager.actor().name(), active: BattleManager._ctbActive.name(),
                     reserve: $gameParty.reserveMembers().map(a => a.name()), damaFatigue: $gameActors.actor(7).tp };
        });
        t.eq(r.list.join(','), 'Dama,Parl(KO)', 'reserve list');
        t.ok(r.koBlocked, 'a knocked-out member cannot switch in');
        t.eq(r.now, 'Dama', 'Dama takes the command menu');
        t.eq(r.active, 'Dama', 'Dama takes the turn');
        t.ok(r.reserve.includes(r.before), 'the outgoing character goes to the reserve');
        t.eq(r.damaFatigue, 0.5, 'switching in costs 0.5 Fatigue');
    },

    'escape from Tactics ends the battle on success': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            BattleManager._escapeRatio = 1;
            const s = SceneManager._scene, w = s._actorCommandWindow;
            w.selectSymbol('tactics'); w.processOk();
            s._tacticsWindow.selectSymbol('escape'); s._tacticsWindow.processOk();
            return { escaped: BattleManager._escaped };
        });
        t.eq(r.escaped, true, 'escaped');
    }
};
