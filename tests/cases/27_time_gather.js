// Day and night (SI_Time) and gathering spots (SI_Gather).

module.exports = {
    'day and night: steps, sleep, tints, light, night encounters, moods, sundial': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const T = SmokingIsle.Time, out = {}, P = $gameParty, IT = n => $dataItems.find(i => i && i.name === n);
            const tone = () => $gameScreen._toneTarget.join(',');
            const indoorNote = $dataMap.note;
            out.start = T.day() + '/' + T.periodName() + '/' + $gameVariables.value(3) + '/' + $gameVariables.value(2);
            // indoors (the test room) time stands still
            for (let i = 0; i < 500; i++) P.increaseSteps();
            out.indoors = T.periodName() + '/' + tone();
            // outdoors, 400 steps a period
            $dataMap.note = '';
            for (let i = 0; i < 400; i++) P.increaseSteps();
            out.dusk = T.periodName() + '/' + tone();
            BattleManager.endBattle(0); out.battleSteps = T.state().steps;
            for (let i = 0; i < 360; i++) P.increaseSteps();
            out.night = T.periodName() + '/' + $gameSwitches.value(7) + '/' + tone();
            // a torch from the menu lights the way
            const torch = new Game_Action(P.members()[0]); torch.setItem(IT('Torch').id); torch.applyGlobal();
            out.lit = T.hasLight() + '/' + tone() + '/' + T.state().light;
            // night encounters replace the map's list
            $dataMap.note = '<Night Troops: 10, 11>';
            out.nightTroops = $gameMap.encounterList().map(e => e.troopId).join(',');
            // spirits friendlier and animals warier at night
            const owl = new Game_Enemy(12, 0, 0), boar = new Game_Enemy(1, 0, 0);
            const mood = e => SmokingIsle.Talk.startMoodBonus(e), nightOwl = mood(owl), nightBoar = mood(boar);
            T.state().period = 1; out.nightMood = (nightOwl - mood(owl)) + '/' + (nightBoar - mood(boar)); T.state().period = 3;
            $dataMap.note = '';
            out.sundialNight = T.sundialText();
            // night turns to the next dawn
            for (let i = 0; i < 400; i++) P.increaseSteps();
            out.dawn = T.day() + '/' + T.periodName() + '/' + $gameSwitches.value(7);
            out.sundialDawn = T.sundialText();
            // sleeping always wakes at the next dawn
            T.setPeriod(1); T.sleep(); out.sleep = T.day() + '/' + T.periodName();
            $dataMap.note = indoorNote;
            out.sundialIndoors = T.sundialText();
            out.dayTroops = $gameMap.encounterList().length;
            const dial = IT('Sundial');
            out.dialItem = dial.itypeId + '/' + dial.effects.map(e => e.code + ':' + $dataCommonEvents[e.dataId].name).join();
            out.restSleeps = $dataCommonEvents[3].list.some(c => c.code === 355 && /Time\.sleep/.test(c.parameters[0]));
            out.lamplight = /<Light>/.test($dataStates[SmokingIsle.Ailments.stateByName('Lamplight')].note);
            return out;
        });
        t.eq(r.start, '1/day/1/1', 'the game starts on day 1, by day; the variables follow');
        t.eq(r.indoors, 'day/0,0,0,0', 'indoors time stands still and there is no tint');
        t.eq(r.dusk, 'dusk/40,-15,-45,0', '400 steps outdoors: dusk, with an orange tint');
        t.eq(r.battleSteps, 40, 'a battle outdoors counts as 40 steps');
        t.eq(r.night, 'night/true/-90,-70,-10,60', 'then night: the Night switch is on, and it\'s dark');
        t.eq(r.lit, 'true/-45,-35,-15,30/300', 'a torch lights the way for 300 steps, and the dark lifts');
        t.eq(r.nightTroops, '10,11', 'at night, <Night Troops> replace the encounters');
        t.eq(r.nightMood, '10/-10', 'spirits start friendlier at night, animals warier');
        t.ok(/No shadow at night/.test(r.sundialNight), 'the sundial has no shadow at night: ' + r.sundialNight);
        t.eq(r.dawn, '2/dawn/false', 'night turns to the dawn of day 2');
        t.ok(/dawn, on day 2/.test(r.sundialDawn), 'the sundial reads dawn: ' + r.sundialDawn);
        t.eq(r.sleep, '3/dawn', 'sleeping wakes you at the next dawn');
        t.ok(/no sun in here/.test(r.sundialIndoors), 'indoors the sundial is useless');
        t.eq(r.dayTroops, 0, 'by day the map\'s own encounters stay');
        t.eq(r.dialItem, '2/44:Sundial', 'the Sundial is a key item that runs the Sundial common event');
        t.ok(r.restSleeps, 'the Resting Point sleeps until dawn');
        t.ok(r.lamplight, 'Lamplight counts as a light');
    },

    'gathering spots': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, T = SmokingIsle.Time, out = {}, P = $gameParty, map = $gameMap.mapId();
            const ev = n => $gameMap.events().find(e => e.event().name === 'Gather: ' + n).eventId();
            const IT = n => G.find(n), have = n => P.numItems(IT(n));
            out.unknown = Object.keys(G.TABLE).filter(k => !IT(G.TABLE[k].gives) || (G.TABLE[k].extra && !IT(G.TABLE[k].extra[0])) ||
                (G.TABLE[k].tool || []).some(n => !IT(n))).join(', ');
            P.allItems().slice().forEach(i => P.loseItem(i, 999));
            P.members().forEach(a => a.setTp(0));
            const real = Math.random; Math.random = () => 0;
            const laurel = G.gather(map, ev('Laurel'), 'Laurel');
            out.laurel = laurel.text + '/' + have('Laurel Branch') + have('Laurel Log') + '/' + $gameSelfSwitches.value([map, ev('Laurel'), 'A']);
            out.tired = P.battleMembers().filter(a => !a.hasNoFatigue()).every(a => a.tp > 0);
            out.again = G.gather(map, ev('Laurel'), 'Laurel').text;
            out.sorrelDay = G.gather(map, ev('Moon Sorrel'), 'Moon Sorrel').text;
            out.noKit = G.gather(map, ev('Obsidian'), 'Obsidian').text;
            out.noNet = G.gather(map, ev('Fishing Spot'), 'Fishing Spot').text;
            // night: plants need a light, except night-only ones
            T.setPeriod(3);
            out.sorrelNight = G.gather(map, ev('Moon Sorrel'), 'Moon Sorrel').text + '/' + have('Moon Sorrel');
            out.dark = G.gather(map, ev('Clay Pit'), 'Clay Pit').text;
            T.lightFor(100);
            P.gainItem(IT('Knapping Kit'), 1);
            out.obsidian = G.gather(map, ev('Obsidian'), 'Obsidian').text;
            // a new day: everything regrows and Self Switch A goes off
            T.sleep();
            out.regrown = !$gameSelfSwitches.value([map, ev('Laurel'), 'A']) + '/' + G.gather(map, ev('Laurel'), 'Laurel').text;
            Math.random = () => 0.99;
            out.rainTree = G.gather(map, ev('Clay Pit'), 'Rain Tree').text;
            Math.random = real;
            return out;
        });
        t.eq(r.unknown, '', 'every species gives real items and needs real tools');
        t.eq(r.laurel, 'You cut a Laurel Branch and a Laurel Log./11/true', 'a laurel gives a branch (and rarely a log); the spot is spent');
        t.ok(r.tired, 'gathering tires the party a little');
        t.eq(r.again, 'Nothing more here today.', 'once a day');
        t.ok(/only shows itself at night/.test(r.sorrelDay), 'moon sorrel only by night');
        t.eq(r.noKit, 'You need a Knapping Kit.', 'stone needs the Knapping Kit');
        t.eq(r.noNet, 'You need a Fishing Gear or Palm-Fibre Net.', 'fishing needs gear or a net');
        t.eq(r.sorrelNight, 'You pick some Moon Sorrel./1', 'at night, moon sorrel can be picked without a light');
        t.eq(r.dark, 'It\'s too dark to see. You need a light.', 'other spots need a light at night');
        t.eq(r.obsidian, 'You chip off an Obsidian Shard.', 'with a light and the kit, obsidian');
        t.eq(r.regrown, 'true/You cut a Laurel Branch and a Laurel Log.', 'a new day: the spot regrows');
        t.eq(r.rainTree, 'Nothing has fallen today.', 'the rain tree is never cut: only fallen branches, rarely');
    },

    'a gathering spot from the map, through the common event': async (h, t) => {
        await h.newGame();
        await h.eval(() => { $gameParty.loseItem($dataItems.find(i => i && i.name === 'Clay'), 999); Math.random = () => 0.5;
            $gameMap.events().find(e => e.event().name === 'Gather: Clay Pit').start(); });
        await h.page.waitForTimeout(300);
        const text = await h.eval(() => $gameMessage._texts.join(' '));
        await h.pumpMessages();
        const r = await h.eval(() => ({ clay: $gameParty.numItems($dataItems.find(i => i && i.name === 'Clay')),
            page: $gameMap.events().find(e => e.event().name === 'Gather: Clay Pit')._pageIndex }));
        t.eq(text, 'You dig up some Clay.', 'the common event shows what you found');
        t.eq(r.clay, 1, 'and you have it');
        t.eq(r.page, 1, 'the spot switches to its spent page');
    }
};
