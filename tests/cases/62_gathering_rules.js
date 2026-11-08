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
    },

    'gathering: how spots come back (daily, slow, finite, felled, always)': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, T = SmokingIsle.Time, out = {}, map = $gameMap.mapId();
            const ev = n => $gameMap.events().find(e => e.event().name === 'Gather: ' + n).eventId();
            const pada = $gameActors.actor(5), yoon = $gameActors.actor(2), real = Math.random; Math.random = () => 0.5;
            const give = (a, name, type) => { const w = (type === 'w' ? $dataWeapons : $dataItems).find(x => x && x.name === name); $gameParty.gainItem(w, 1); if (type === 'w') a.forceChangeEquip(a.slotOfType(1), w); };
            give(pada, 'Copper Pick', 'w');
            // ore: six hauls, once a day, then worked out (the vein stays visible)
            const oreSpot = ev('Obsidian'), texts = [];
            for (let i = 0; i < 7; i++) { texts.push(G.gather(map, oreSpot, 'Copper Vein', pada).text); texts.push(G.gather(map, oreSpot, 'Copper Vein', pada).text); T.sleep(); }
            out.oreToday = texts[1]; out.oreLast = texts[10]; out.oreAfter = texts[12];
            out.oreD = $gameSelfSwitches.value([map, oreSpot, 'D']); out.oreShown = G.rule('Copper Vein').vanish === false;   // (this test borrows the Obsidian spot, which hides as loose stone)
            // a rare tree: three hauls, then a stump
            const axe = $dataWeapons.find(w => w && w.siMoves && w.siMoves.indexOf('metal') >= 0 && w.wtypeId === 6 && !/<Pick>/i.test(w.note));
            $gameParty.gainItem(axe, 1); pada.forceChangeEquip(pada.slotOfType(1), axe);
            const tree = ev('Laurel'), felled = [];
            for (let i = 0; i < 3; i++) { felled.push(G.gather(map, tree, 'Ebony', pada).text); T.sleep(); }
            out.felled = felled[2]; out.stump = G.gather(map, tree, 'Ebony', pada).text;
            // loose stone: vanishes once worked out, not before
            give(yoon, 'Knapping Kit'); const stone = ev('Clay Pit');
            G.gather(map, stone, 'Obsidian', yoon); out.stoneShownSpent = !$gameMap.event(stone).siGatherSpent();
            for (let i = 0; i < 5; i++) { T.sleep(); G.gather(map, stone, 'Obsidian', yoon); }
            $gameMap.event(stone)._siGatherSpecies = 'Obsidian'; $gameMap.event(stone)._siGatherRule = undefined;
            out.stoneGone = $gameMap.event(stone).siGatherSpent();
            // a spring never runs out
            const spring = ev('Fishing Spot');
            out.spring = G.gather(map, spring, 'Spring', yoon).ok && G.gather(map, spring, 'Spring', yoon).ok;
            // the rules, and a note override
            out.rules = ['Bitterwood', 'Laurel', 'Clay Pit', 'Copper Vein', 'Sandalwood', 'Obsidian', 'Basalt', 'Spring']
                .map(s => { const x = G.rule(s); return s + ':' + (x.always ? 'always' : (x.hauls ? x.hauls + 'x' : x.regrow + 'd')) + (x.felled ? '/felled' : '') + '/' + x.vanish; }).join(' ');
            const fake = { event: () => ({ note: '<Regrow: 7>\n<Stays>' }) };
            const o = G.rule('Bitterwood', fake); out.override = o.regrow + '/' + o.vanish;
            Math.random = real;
            return out;
        });
        t.eq(r.oreToday, "You've taken all you can for today.", 'ore: once a day');
        t.eq(r.oreLast, 'Pada breaks off some Copper Ore. The vein is worked out.', 'ore: the sixth haul works it out');
        t.eq(r.oreAfter, 'This vein is worked out.', 'ore: worked out for good, even days later');
        t.ok(r.oreD && r.oreShown, 'a worked-out vein turns on Self Switch D and stays visible');
        t.ok(/The tree comes down: only a stump is left\.$/.test(r.felled), 'a rare tree: the third haul fells it: ' + r.felled);
        t.eq(r.stump, 'Only a stump is left.', 'rare trees don\'t regrow');
        t.ok(r.stoneShownSpent && r.stoneGone, 'loose stone stays while it lasts, and vanishes once worked out');
        t.ok(r.spring, 'a spring never runs out');
        t.eq(r.rules, 'Bitterwood:1d/spent Laurel:3d/false Clay Pit:3d/false Copper Vein:6x/false Sandalwood:3x/felled/false Obsidian:5x/worked Basalt:6x/false Spring:always/false', 'the rules by kind and species');
        t.eq(r.override, '7/false', 'a spot\'s Note can override (<Regrow: 7>, <Stays>)');
    }
};
