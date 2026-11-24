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
                const W = $gameMap.events().filter(e => e.wanderer && e.wanderer());
                const out = (party, story) => { $gameParty._actors = party; $gameVariables.setValue(5, story); $gameMap.refresh();
                    return W.filter(e => !e.isWanderAway()).length; };
                // edge transfers: where each one leads
                const links = $gameMap.events().map(e => (e.event().pages[0].list.find(c => c.code === 201) || {}).parameters)
                    .filter(Boolean).map(p => p[1]);
                return { wanderers: W.length, troops: W.map(e => $dataTroops[e.wanderer().troopId].name).join('|'),
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
        t.eq([m1, m2, m3, m7].map(m => m.wanderers).join(','), '2,0,4,1', 'wanderers: 2 in the gully, 4 in the channels, 1 at the top');
        t.ok([m3, m7].every(m => m.troops.split('|').every(n => /^Gully:/.test(n))), 'Act 1 ones: Gully troops');
        t.eq(m1.troops, 'Cave Crickets*5|Bats*6', 'the gully\'s are Act 2 troops (the crickets and bats of the tubes)');
        t.eq([m1, m3, m7].map(m => m.before).join(','), '0,0,0', 'none out before Lasa joins');
        t.ok(m1.act1 === 0 && m3.act1 >= 3 && m7.act1 === 1, 'Act 1 (Lasa, Story 30): none in the gully; the channels and the top');
        t.eq(m1.act2 + ',' + m3.act2 + ',' + m7.act2, '1,0,0', 'Act 2 (Sib, Story 50): back in the gully, crickets by day or bats at night; the rest gone');
    }
};
