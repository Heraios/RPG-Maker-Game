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
            out.restSleeps = $dataCommonEvents[3].list.some(c => c.code === 355 && /Idols\.rest/.test(c.parameters[0]));
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
        t.ok(r.restSleeps, 'resting at a Star Mother idol sleeps until dawn');
        t.ok(r.lamplight, 'Lamplight counts as a light');
    },

    'gathering: who gathers, with what tool, fatigue and wear': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, T = SmokingIsle.Time, out = {}, P = $gameParty, map = $gameMap.mapId();
            const A = id => $gameActors.actor(id), W = n => $dataWeapons.find(w => w && w.name === n);
            const ev = n => $gameMap.events().find(e => e.event().name === 'Gather: ' + n).eventId();
            const IT = n => G.find(n), have = n => P.numItems(IT(n));
            const arm = (a, n) => { const w = W(n); P.gainItem(w, 1); a.forceChangeEquip(a.slotOfType(1), w); };
            out.unknown = Object.keys(G.TABLE).filter(k => !IT(G.TABLE[k].gives) || (G.TABLE[k].extra && !IT(G.TABLE[k].extra[0]))).join(', ');
            [5, 6, 7, 8, 10].forEach(id => P.addActor(id));
            const yoon = A(2), sib = A(3), lasa = A(4), pada = A(5), juda = A(6), dama = A(7), parl = A(8), falmi = A(10);
            P.allItems().slice().forEach(i => P.loseItem(i, 999));
            P.allMembers().forEach(a => { a.setTp(0); a.equips().forEach((e, s) => { if (DataManager.isWeapon(e)) a.forceChangeEquip(s, null); }); });
            const able = sp => G.gatherers().filter(a => G.canGather(a, G.TABLE[sp])).map(a => a.name()).join(',');
            const real = Math.random; Math.random = () => 0;
            // nobody has an axe: the message says what's needed
            out.noAxe = able('Laurel') + '|' + G.gather(map, ev('Laurel'), 'Laurel', pada).text;
            // a child with an axe cuts a branch, but only an adult brings down a log
            arm(falmi, 'Basalt Axe');
            out.childCut = G.gather(map, ev('Laurel'), 'Laurel', falmi).text + '/' + have('Laurel Log');
            T.sleep(); arm(pada, 'Basalt Axe');
            out.adultCut = G.gather(map, ev('Laurel'), 'Laurel', pada).text;
            out.tired = pada.tp + '/' + falmi.tp;
            // hard woods: an adult with a metal axe
            out.ebony = able('Ebony'); arm(parl, 'Copper Axe'); out.ebonyMetal = able('Ebony');
            // plants: a knife; children tire less on light work
            arm(yoon, 'Obsidian Knife'); arm(juda, 'Obsidian Knife');
            out.knife = able('Spurge'); out.hand = able('Bitterwood').split(',').length >= 7;
            const y0 = yoon.tp, j0 = juda.tp;
            G.gather(map, ev('Clay Pit'), 'Bitterwood', yoon); T.sleep(); G.gather(map, ev('Clay Pit'), 'Bitterwood', juda);
            out.light = (yoon.tp - y0) + '/' + (juda.tp - j0);
            // sacred plants, cave plants, fishing
            out.sacredNoStick = G.gather(map, ev('Moon Sorrel'), 'Kava', yoon).text;
            P.gainItem(IT('Digging Stick'), 1); out.sacred = able('Kava');
            out.cave = able('Wart Fern');
            out.fishNoHarpoon = able('Fishing Spot');
            arm(dama, 'Fishing Harpoon'); out.fish = able('Fishing Spot');
            // ore: an adult with a pick; picks wear into bent picks, then scrap
            out.oreNone = able('Copper Vein');
            arm(pada, 'Copper Pick'); out.ore = able('Copper Vein');
            T.sleep(); const mined = G.gather(map, ev('Obsidian'), 'Copper Vein', pada);
            out.mined = mined.text + '/' + have('Copper Ore');
            out.worn = mined.worn + '/' + pada.equips()[pada.slotOfType(1)].name;
            T.sleep(); const broke = G.gather(map, ev('Obsidian'), 'Copper Vein', pada);
            out.broke = pada.equips()[pada.slotOfType(1)] === null && have('Scrap Copper') === 1;
            out.pickAxe = W('Copper Pick').wtypeId === 6 && /One-Handed/.test(W('Copper Pick').note) && W('Bronze Pick').note.indexOf('Degrades') < 0;
            // the knapping kit is carried, not equipped
            T.sleep(); out.kit = G.gather(map, ev('Obsidian'), 'Obsidian', yoon).text;
            Math.random = () => 0; T.sleep();
            const dug = G.gather(map, ev('Clay Pit'), 'Clay Pit', yoon);
            out.snap = dug.worn + '/' + have('Digging Stick') + '/' + have('Scrap Wood');
            Math.random = real;
            out.stickRecipe = SmokingIsle.Crafting.recipes.some(x => x.name === 'Digging Stick' && x.known);
            out.recipes = ['Copper Pick', 'Straighten a Bent Copper Pick'].every(n => SmokingIsle.Crafting.recipes.some(x => x.name === n && x.at === 'smith'));
            return out;
        });
        t.eq(r.unknown, '', 'every species gives real items');
        t.eq(r.noAxe, '|This needs someone with an axe equipped.', 'no axe: nobody can cut, and the message says why');
        t.eq(r.childCut, 'Falmi cuts a Laurel Branch./0', 'a child cuts a branch, but no log');
        t.eq(r.adultCut, 'Pada cuts a Laurel Branch and a Laurel Log.', 'an adult can bring down a log');
        t.eq(r.tired, '3/3', 'cutting wood tires the gatherer');
        t.eq(r.ebony, '', 'a stone axe can\'t cut ebony');
        t.eq(r.ebonyMetal, 'Parl', 'an adult with a metal axe can');
        t.eq(r.knife, 'Yoon,Juda', 'spurge and bark need a knife');
        t.ok(r.hand, 'soft herbs are picked by hand: anyone can');
        t.eq(r.light, '1/2', 'children tire half as much picking low plants');
        t.eq(r.sacredNoStick, 'You need a Digging Stick.', 'kava is a root: it needs a digging stick');
        t.eq(r.sacred, 'Yoon,Sib,Juda,Falmi', 'sacred plants: only Yoon, Sib, Juda or Falmi');
        t.eq(r.cave, 'Lasa', 'cave plants: only Lasa');
        t.eq(r.fishNoHarpoon, '', 'fishing needs a harpoon equipped');
        t.eq(r.fish, 'Dama', 'Dama (or Parl) with a harpoon fishes');
        t.eq(r.oreNone, '', 'ore needs a pick');
        t.eq(r.ore, 'Pada', 'an adult with a pick mines');
        t.eq(r.mined, 'Pada breaks off some Copper Ore./1', 'mining copper ore');
        t.ok(/Bent Copper Pick/.test(r.worn), 'mining wears the pick: ' + r.worn);
        t.ok(r.broke, 'a bent pick breaks into scrap copper');
        t.ok(r.pickAxe, 'picks are one-handed axes; the bronze one never wears');
        t.eq(r.kit, 'You need a Knapping Kit.', 'knapping stone needs the Knapping Kit carried');
        t.ok(r.recipes, 'the smith makes and straightens copper picks');
        t.eq(r.snap, 'The Digging Stick snaps (Scrap Wood left over)./0/2', 'a digging stick sometimes snaps into scrap wood (one more Scrap Wood)');
        t.ok(r.stickRecipe, 'anyone can carve a digging stick');
    },

    'gathering spots: once a day, night, light': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, T = SmokingIsle.Time, out = {}, map = $gameMap.mapId();
            const ev = n => $gameMap.events().find(e => e.event().name === 'Gather: ' + n).eventId();
            const yoon = $gameActors.actor(2), knife = $dataWeapons.find(w => w && w.name === 'Obsidian Knife');
            $gameParty.gainItem(knife, 1); yoon.forceChangeEquip(yoon.slotOfType(1), knife); $gameParty.gainItem(G.find('Digging Stick'), 1);
            const real = Math.random; Math.random = () => 0.5;
            const clay = G.gather(map, ev('Clay Pit'), 'Clay Pit', yoon);
            out.clay = clay.text + '/' + $gameSelfSwitches.value([map, ev('Clay Pit'), 'A']);
            out.again = G.gather(map, ev('Clay Pit'), 'Clay Pit', yoon).text;
            out.sorrelDay = G.gather(map, ev('Moon Sorrel'), 'Moon Sorrel', yoon).text;
            T.setPeriod(3);
            out.sorrelNight = G.gather(map, ev('Moon Sorrel'), 'Moon Sorrel', yoon).text;
            out.dark = G.gather(map, ev('Laurel'), 'Bitterwood', yoon).text;
            T.lightFor(100); out.lit = G.gather(map, ev('Laurel'), 'Bitterwood', yoon).ok;
            T.sleep(); out.regrown = !$gameSelfSwitches.value([map, ev('Clay Pit'), 'A']) + '/' + G.gather(map, ev('Clay Pit'), 'Clay Pit', yoon).ok;
            Math.random = () => 0.99; out.rainTree = G.gather(map, ev('Laurel'), 'Rain Tree', yoon).text;
            Math.random = real;
            return out;
        });
        t.eq(r.clay, 'Yoon digs up some Clay./true', 'digging clay; the spot is spent');
        t.eq(r.again, 'Nothing more here today.', 'once a day');
        t.ok(/only shows itself at night/.test(r.sorrelDay), 'moon sorrel only by night');
        t.eq(r.sorrelNight, 'Yoon picks some Moon Sorrel.', 'at night, without a light');
        t.eq(r.dark, 'It\'s too dark to see. You need a light.', 'other spots need a light at night');
        t.ok(r.lit, 'with a light, gathering works at night');
        t.eq(r.regrown, 'true/true', 'a new day: the spot regrows');
        t.eq(r.rainTree, 'Nothing has fallen today.', 'the rain tree is never cut: only fallen branches, rarely');
    },

    'a gathering spot from the map: choose who gathers': async (h, t) => {
        await h.newGame();
        await h.eval(() => { $gameParty.loseItem($dataItems.find(i => i && i.name === 'Clay'), 999); Math.random = () => 0.5;
            $gameParty.gainItem($dataItems.find(i => i && i.name === 'Digging Stick'), 1);
            $gameMap.events().find(e => e.event().name === 'Gather: Clay Pit').start(); });
        await h.page.waitForTimeout(400);
        const ask = await h.eval(() => ({ text: $gameMessage._texts.join(' '), choices: $gameMessage.choices().join('/') }));
        await h.page.waitForTimeout(400);
        await h.page.keyboard.press('Enter');   // the first choice
        await h.page.waitForTimeout(400);
        const text = await h.eval(() => $gameMessage._texts.join(' '));
        await h.pumpMessages();
        const r = await h.eval(() => ({ clay: $gameParty.numItems($dataItems.find(i => i && i.name === 'Clay')),
            page: $gameMap.events().find(e => e.event().name === 'Gather: Clay Pit')._pageIndex }));
        t.eq(ask.text, 'Who will dig?', 'the spot asks who will gather');
        t.ok(/^Yoon\/.*Never mind$/.test(ask.choices), 'the party is offered, plus Never mind: ' + ask.choices);
        t.eq(text, 'Yoon digs up some Clay.', 'the chosen one gathers');
        t.eq(r.clay, 1, 'and you have it');
        t.eq(r.page, 1, 'the spot switches to its spent page');
    }
};
