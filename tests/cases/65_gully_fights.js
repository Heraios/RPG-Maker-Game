// Map 1, the gully: Act 1's fights for the Ghost and Lasa (visible wanderers, <Before Story: 50>).
module.exports = {
    'gully fights: out in Act 1 with Lasa, gone once Yoon has a body': async (h, t) => {
        await h.page.goto(h.base + '/index.html');
        await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
        await h.page.evaluate(() => { Object.assign($dataSystem, { startMapId: 1, startX: 9, startY: 204 }); SceneManager._scene.commandNewGame(); });
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === 1, null, { timeout: 30000 });
        const r = await h.eval(() => {
            const W = $gameMap.events().filter(e => e.wanderer && e.wanderer());
            const out = (party, story) => { $gameParty._actors = party; $gameVariables.setValue(5, story); $gameMap.refresh();
                return W.filter(e => !e.isWanderAway()).map(e => e.wanderer().troopId).sort((a, b) => a - b).join(','); };
            const troops = W.map(e => $dataTroops[e.wanderer().troopId]);
            return { count: W.length, before: out([1], 25), act1: out([1, 4], 30), act2: out([2, 3, 4], 50),
                     sizes: troops.map(tr => tr.members.length).join(','), named: troops.every(tr => /^Gully:/.test(tr.name)) };
        });
        t.eq(r.count, 7, 'seven wanderers on map 1');
        t.eq(r.before, '', 'not before Lasa joins');
        t.ok(r.act1.split(',').length >= 5, 'Act 1 (Lasa, Story 30): out (day or night ones): ' + r.act1);
        t.eq(r.act2, '', 'Act 2 (Story 50): all gone');
        t.eq(r.sizes, '2,3,1,2,1,1,2', 'small troops: crickets 2, bats 3, lizard 1, ravens 2, vulture 1, owl 1, lizards 2');
        t.ok(r.named, 'their troops are the Gully ones');
    }
};
