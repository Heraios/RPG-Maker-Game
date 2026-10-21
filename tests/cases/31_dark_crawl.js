// Darkness (<Dark>, <Dark At Night>) and crawlways only the children fit through.

module.exports = {
    'darkness: tint, light, sight switch, gathering and fighting blind': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const T = SmokingIsle.Time, G = SmokingIsle.Gather, out = {}, P = $gameParty, yoon = $gameActors.actor(2);
            const tone = () => $gameScreen._toneTarget.join(','), map = $gameMap.mapId();
            const spot = $gameMap.events().find(e => e.event().name === 'Gather: Laurel').eventId();
            const note = $dataMap.note;
            T.setPeriod(1); T.state().light = 0;
            $dataMap.note = '<Dark>'; T.refreshTint(0);
            out.dark = T.isDark() + '/' + T.canSee() + '/' + $gameSwitches.value(8) + '/' + tone();
            out.gather = G.gather(map, spot, 'Bitterwood', yoon).text;
            // fighting blind: the party's hit drops
            const hit0 = (P._inBattle = false, yoon.hit); P._inBattle = true; const hitDark = yoon.hit; P._inBattle = false;
            out.blind = +(hit0 - hitDark).toFixed(2);
            // a light lifts it, and burns down as you walk in the dark (even where time stands still)
            T.lightFor(10);
            out.lit = T.canSee() + '/' + $gameSwitches.value(8) + '/' + tone();
            P._inBattle = true; out.litHit = +(hit0 - yoon.hit).toFixed(2); P._inBattle = false;
            for (let i = 0; i < 10; i++) P.increaseSteps();
            out.burnt = T.state().light + '/' + T.canSee() + '/' + T.periodName();
            // forests: dark only at night
            $dataMap.note = '<Dark At Night>';
            out.forestDay = T.isDark(); T.setPeriod(3); out.forestNight = T.isDark() + '/' + tone();
            $dataMap.note = note; T.setPeriod(1);
            out.indoorNight = (T.setPeriod(3), T.canSee());
            return out;
        });
        t.eq(r.dark, 'true/false/false/-150,-150,-130,110', '<Dark>: pitch dark, the Can See switch off');
        t.eq(r.gather, 'It\'s too dark to see. You need a light.', 'no gathering in the dark');
        t.eq(r.blind, 0.15, 'fighting in the dark: -15% hit');
        t.eq(r.lit, 'true/true/-60,-60,-75,40', 'a light lifts the dark and turns the switch on');
        t.eq(r.litHit, 0, 'with a light, no penalty');
        t.eq(r.burnt, '0/false/day', 'the light burns down as you walk; time still stands still underground');
        t.eq(r.forestDay, false, '<Dark At Night>: not dark by day');
        t.eq(r.forestNight, 'true/-150,-150,-130,110', '...but dark at night');
        t.ok(r.indoorNight, 'an ordinary indoor map isn\'t dark at night');
    },

    'crawlways: only the children fit; the adults wait and rejoin': async (h, t) => {
        await h.newGame();
        const r1 = await h.eval(() => {
            const C = SmokingIsle.Crawl, P = $gameParty, out = {};
            P.addActor(7);
            out.fits = P.allMembers().filter(a => C.fits(a)).map(a => a.name()).join(',');
            out.ce = $dataCommonEvents[8].name;
            C.goThrough({ mapId: 1, x: 2, y: 2, dir: 2 });
            out.party = P.allMembers().map(a => a.name()).join(',');
            out.waiting = C.waiting().mapId + ':' + C.waiting().actorIds.join(',');
            return out;
        });
        await h.page.waitForFunction(() => $gameMap.mapId() === 1 && SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted, null, { timeout: 10000 });
        await h.pumpMessages();
        const r2 = await h.eval(() => {
            const out = { away: $gameParty.allMembers().map(a => a.name()).join(',') };
            SmokingIsle.Crawl.goThrough({ mapId: 4, x: 10, y: 10, dir: 2 });
            return out;
        });
        await h.page.waitForFunction(() => $gameMap.mapId() === 4 && SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted, null, { timeout: 10000 });
        await h.page.waitForTimeout(300);
        const msg = await h.eval(() => $gameMessage._texts.join(' '));
        await h.pumpMessages();
        const r3 = await h.eval(() => ({ back: $gameParty.allMembers().map(a => a.name()).sort().join(','), waiting: SmokingIsle.Crawl.waiting() }));
        t.eq(r1.fits, 'Yoon,Sib,Lasa,Patience', 'children (and Patience) fit; Pada and Dama don\'t');
        t.eq(r1.ce, 'Crawlway', 'the Crawlway common event');
        t.eq(r1.party, 'Yoon,Sib,Lasa,Patience', 'through the crawlway with just the children');
        t.eq(r1.waiting, '4:5,7', 'Pada and Dama wait on the map they were on');
        t.eq(r2.away, 'Yoon,Sib,Lasa,Patience', 'still just the children on the other side');
        t.ok(/together again/.test(msg), 'back on that map, the grown-ups rejoin: ' + msg);
        t.eq(r3.back, 'Dama,Lasa,Pada,Patience,Sib,Yoon', 'everyone is together again');
        t.eq(r3.waiting, null, 'nobody waiting any more');
    }
};
