// The lava flows between the sky-hole and town, split into four maps: 1 Sky-Hole Gully, 2 The Old Flow Front,
// 3 The Channels, 7 The Greening. Act 1's fights for the Ghost and Lasa (visible wanderers, <Before Story: 50>),
// and the edge transfers that chain the maps together.
module.exports = {
    'lava flows: four maps, chained, with Act 1 fights': async (h, t) => {
        await h.page.goto(h.base + '/index.html');
        await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
        await h.page.evaluate(() => { Object.assign($dataSystem, { startMapId: 1, startX: 20, startY: 14 }); SceneManager._scene.commandNewGame(); });
        const visit = async (id) => {
            await h.eval(i => $gamePlayer.reserveTransfer(i, 2, 2, 2, 0), id);
            await h.page.waitForFunction(i => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === i && !$gamePlayer.isTransferring(), id, { timeout: 30000 });
            return h.eval(() => {
                const arrival = $gameMap.events().find(e => /Out of the Sky-Hole/.test(e.event().name));   // the scene, not under test here
                if (arrival) $gameSelfSwitches.setValue([$gameMap.mapId(), arrival.eventId(), 'A'], true);
                const W = $gameMap.events().filter(e => e.wanderer && e.wanderer());
                const out = (party, story) => { $gameParty._actors = party; $gameVariables.setValue(5, story); $gameMap.refresh();
                    return W.filter(e => !e.isWanderAway()).length; };
                const C = $gameMap.events().filter(e => /Cairn/.test(e.event().name));
                const shown = (party, story) => { $gameParty._actors = party; $gameVariables.setValue(5, story); $gameMap.refresh();
                    return C.filter(e => e.findProperPageIndex() >= 0).length; };
                const cairns = shown([1, 4], 30) + '/' + shown([2, 3, 4], 50);
                // edge transfers: where each one leads
                const links = $gameMap.events().map(e => (e.event().pages[0].list.find(c => c.code === 201) || {}).parameters)
                    .filter(Boolean).map(p => p[1]);
                return { cairns, wanderers: W.length, troops: W.map(e => $dataTroops[e.wanderer().troopId].name).join('|'),
                         before: out([1], 25), act1: out([1, 4], 30), act2: out([2, 3, 4], 50),
                         links: [...new Set(links)].sort((a, b) => a - b).join(','), size: $gameMap.width() + 'x' + $gameMap.height(),
                         note: $dataMap.note, land: $gameMap.isPassable(20, 14, 8) };
            });
        };
        const m1 = await visit(1), m2 = await visit(2), m3 = await visit(3), m7 = await visit(7);
        t.eq(m1.size, '40x30', 'map 1 is now the Sky-Hole Gully, 40 x 30');
        t.ok(/<Hole View: SkyHole_\{period\}, 20, 16/.test(m1.note), 'its hole shows map 6 below');
        t.ok(m1.land, 'the ladder lands on open ground north of the hole (20, 14)');
        t.eq(m1.links, '2,6', 'map 1: north to the flow front (2), and down the hole to map 6 (Act 2)');
        t.eq(m2.links, '1,3', 'map 2: south to the gully, north to the channels');
        t.eq(m3.links, '2,7', 'map 3: south to the flow front, north to the greening');
        t.eq(m7.links, '3', 'map 7: south to the channels (north isn\'t built yet)');
        t.eq([m1, m2, m3, m7].map(m => m.wanderers).join(','), '3,0,4,1', 'wanderers: 3 in the gully (Act 2), 4 in the channels, 1 at the top');
        t.ok([m3, m7].every(m => m.troops.split('|').every(n => /^Gully:/.test(n))), 'Act 1 ones: Gully troops');
        t.eq(m1.cairns, '1/1', 'the children\'s cairn by the hole: there in Act 1 (Lasa teaches \'together\') and with Sib (Act 2)');
        t.eq([m1, m3, m7].map(m => m.before).join(','), '0,0,0', 'none out before Lasa joins');
        t.ok(m1.act1 === 0 && m3.act1 >= 3 && m7.act1 === 1, 'Act 1 (Lasa, Story 30): none in the gully; the channels and the top');
        t.ok(m1.act2 >= 1 && m3.act2 === 0 && m7.act2 === 0, 'Act 2 (Sib, Story 50): the gully\'s own wanderers come out; the Act 1 fights are gone');
    },

    'the gully: Lasa teaches "together" at the children\'s cairn': async (h, t) => {
        await h.page.goto(h.base + '/index.html');
        await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
        await h.page.evaluate(() => { Object.assign($dataSystem, { startMapId: 1, startX: 28, startY: 16 }); SceneManager._scene.commandNewGame(); });
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === 1, null, { timeout: 30000 });
        const before = await h.eval(() => {
            const arrival = $gameMap.events().find(e => /Out of the Sky-Hole/.test(e.event().name)); $gameSelfSwitches.setValue([1, arrival.eventId(), 'A'], true);
            $gameParty._actors = [1, 4]; $gameVariables.setValue(5, 30); $gameActors.actor(1).setName('Snuggly'); $gameMap.refresh();
            const c = $gameMap.events().find(e => /Cairn/.test(e.event().name));
            const said = c.page().list.filter(x => x.code === 401).map(x => x.parameters[0]).join(' | ');
            const sweet = $gameVariables.value(9); c.start(); return { said, sweet, id: c.eventId() };
        });
        await h.pumpMessages();      // Enter: "Say it carefully."
        const r = await h.eval(id => ({ knows: SmokingIsle.Journal.knowsWord('together'), sweet: $gameVariables.value(9),
            done: $gameSelfSwitches.value([1, id, 'B']), page: $gameMap.event(id).findProperPageIndex() }), before.id);
        t.ok(/Two kids stacked this together! Like you and me, \\N\[1\]!/.test(before.said), 'Lasa: "Two kids stacked this together! Like you and me, [nickname]!"');
        t.ok(r.knows, 'new word: together (in Memory)');
        t.eq(r.sweet - before.sweet, 1, 'said carefully: Sweet +1');
        t.ok(r.done && r.page === 1, 'afterwards the cairn says "...together. Two of them."');
    },

    'the gully: out of the sky-hole (sky, sun, Burning Touch), goat, grass and the gathering spots': async (h, t) => {
        await h.page.goto(h.base + '/index.html');
        await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
        await h.page.evaluate(() => { Object.assign($dataSystem, { startMapId: 1, startX: 20, startY: 14 }); SceneManager._scene.commandNewGame(); });
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === 1, null, { timeout: 30000 });
        // arriving with Lasa: the scene plays by itself (Enter: "Say it carefully" each time)
        await h.eval(() => { $gameParty._actors = [1, 4]; $gameVariables.setValue(5, 30); $gameMap.refresh(); });
        await h.page.waitForTimeout(300);
        await h.pumpMessages(120);
        const arrived = await h.eval(() => {
            const J = SmokingIsle.Journal, g = $gameActors.actor(1), a = $gameMap.events().find(e => /Out of the Sky-Hole/.test(e.event().name));
            return { words: ['sky', 'sun'].map(w => J.knowsWord(w)).join('/'), burning: g.isLearnedSkill(569), once: $gameSelfSwitches.value([1, a.eventId(), 'A']), running: $gameMap.isEventRunning() };
        });
        t.eq(arrived.words, 'true/true', 'coming out of the hole: sky and sun');
        t.ok(arrived.burning, 'the Ghost learns Burning Touch (sun)');
        t.ok(arrived.once && !arrived.running, 'it plays once');
        // Ladder: goat
        await h.eval(() => $gameMap.event(2).start()); await h.pumpMessages(60);
        // the kipuka grass: grass, and Spirit Surge
        await h.eval(() => $gameMap.events().find(e => /Kipuka Grass/.test(e.event().name)).start()); await h.pumpMessages(80);
        const r = await h.eval(() => {
            const J = SmokingIsle.Journal, G = SmokingIsle.Gather, g = $gameActors.actor(1);
            const grassEv = $gameMap.events().find(e => /Kipuka Grass/.test(e.event().name));
            const spots = $gameMap.events().filter(e => /^Gather:/.test(e.event().name)).map(e => G.speciesOf(e));
            return { goat: J.knowsWord('goat'), goatDone: $gameMap.event(2).findProperPageIndex(), grass: J.knowsWord('grass'),
                     surge: g.isLearnedSkill(584), grassDone: grassEv.findProperPageIndex(),
                     spots: spots.join(','), unknown: spots.filter(s => !G.TABLE[s]).join(','),
                     lasaCan: spots.filter(s => s !== 'Obsidian').every(s => { const e = G.TABLE[s]; return e.who !== 'adult' && !e.tool; }) };
        });
        t.ok(r.goat && r.goatDone === 2, 'Ladder teaches "goat"; then "...goat. Staring."');
        t.ok(r.grass && r.surge && r.grassDone === 2, 'the kipuka teaches "grass", and the Ghost learns Spirit Surge');
        t.eq(r.unknown, '', 'every gathering spot is a real species: ' + r.spots);
        t.ok(r.lasaCan, 'the plants (and scoria) Lasa can pick by hand in Act 1; the obsidian vein waits for the Knapping Kit');
    }
};
