// Gathering rules (SI_Gather): a spent spot vanishes until a new day; the Ghost alone can't gather;
// "Only X can gather this" names only people already met. And Lasa's gathering tutorial on map 6.

module.exports = {
    'gathering: spent spots vanish; the Ghost; unmet names; the tutorial': async (h, t) => {
        await h.page.goto(h.base + '/index.html');
        await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
        await h.page.evaluate(() => { Object.assign($dataSystem, { startMapId: 6, startX: 8, startY: 5, partyMembers: [1] }); SceneManager._scene.commandNewGame(); });   // the real start: the Ghost alone
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === 6);
        await h.page.waitForTimeout(500);
        await h.pumpMessages();
        const play = async (picks, done) => {
            picks = picks.slice();
            for (let i = 0; i < 200; i++) {
                const s = await h.eval(() => {
                    const w = SceneManager._scene._messageWindow, c = w && w._choiceWindow;
                    return { choice: !!(c && c.active), busy: $gameMessage.isBusy() || $gameMap.isEventRunning() };
                });
                if (s.choice) { const n = picks.shift(); await h.eval(n => SceneManager._scene._messageWindow._choiceWindow.select(n), n); }
                if (s.choice || s.busy) await h.page.keyboard.press('Enter');
                if (!s.choice && !s.busy && await h.eval(done)) return true;
                await h.page.waitForTimeout(120);
            }
            return false;
        };
        const spot = () => $gameMap.events().find(e => e.eventId() === 19);   // a Cave Mushrooms spot at (10, 10)
        // the Ghost alone: its hand goes through it (the gathering page, before any lesson)
        const ghost = await h.eval(() => {
            $gameParty._actors = [1]; $gamePlayer.refresh();
            const msgs = []; const add = $gameMessage.add; $gameMessage.add = function(t) { msgs.push(t); add.call(this, t); };
            SmokingIsle.Gather.ask({ eventId: () => 19, setWaitMode: () => {} });
            $gameMessage.add = add; $gameMessage.clear();
            return msgs.join('|');
        });
        // someone who can't pick cave things, and Lasa not met yet: no name
        const unmet = await h.eval(() => {
            $gameParty._actors = [1, 3]; $gamePlayer.refresh();
            return SmokingIsle.Gather.needs(SmokingIsle.Gather.TABLE['Cave Mushrooms']) + ' / met: ' +
                (SmokingIsle.Journal.hasMet(4), SmokingIsle.Gather.needs(SmokingIsle.Gather.TABLE['Cave Mushrooms']));
        });
        const met = await h.eval(() => { SmokingIsle.Journal.state().met[4] = true; return SmokingIsle.Gather.needs(SmokingIsle.Gather.TABLE['Cave Mushrooms']); });
        // with Lasa: the 'food' lesson, then her tutorial: pick Lasa, the spot vanishes
        await h.eval(() => {
            $gameParty._actors = [1, 4]; $gamePlayer.refresh(); $gameVariables.setValue(5, 20); $gameMap.refresh();
            $gamePlayer.locate(10, 11); $gamePlayer.setDirection(8);
            $gameMap.event(19).start();
        });
        await play([0, 0], () => SmokingIsle.Journal.knowsHow('gathering') && !$gameMap.isEventRunning());
        const after = await h.eval(() => {
            const e = $gameMap.event(19);
            return { food: SmokingIsle.Journal.knowsWord('food'), got: $gameParty.numItems($dataItems.find(i => i && i.name === 'Cave Mushrooms')),
                     hidden: e.isTransparent(), through: e.isThrough(), canStart: (e.start(), e._starting), howto: SmokingIsle.Journal.rows('remembered').some(r => r.kind === 'knowhow') };
        });
        // another mushroom: 'food' is known, so no second tutorial
        await h.eval(() => { $gamePlayer.locate(19, 13); $gamePlayer.setDirection(8); $gameMap.event(18).start(); });
        await play([], () => !$gameMap.isEventRunning() && $gameSelfSwitches.value([6, 18, 'B']));
        const second = await h.eval(() => $gameParty.numItems($dataItems.find(i => i && i.name === 'Cave Mushrooms')));
        // a new day: it's back
        const regrown = await h.eval(() => { SmokingIsle.Time.sleep(); const e = $gameMap.event(19); return !e.isTransparent() && !e.isThrough(); });
        t.eq(ghost, '...your hand goes through it.', 'the Ghost alone: its hand goes through it');
        t.ok(/^Only someone who knows the caves could gather this\./.test(unmet), "before meeting Lasa, no name: " + unmet);
        t.eq(met, 'Only Lasa can gather this.', 'once met, her name');
        t.ok(after.food, "the mushroom teaches 'food'");
        t.ok(after.got >= 1, 'Lasa picks the mushrooms in the tutorial (' + after.got + ')');
        t.ok(after.hidden && after.through && !after.canStart, 'the picked spot vanishes: hidden, walk-through, no examining');
        t.ok(after.howto, 'Memory remembers how to pick things (Know-how)');
        t.eq(second, after.got, "the next mushroom: 'You know this one!', no second tutorial");
        t.ok(regrown, 'a new day: the spot is back');
    }
};
