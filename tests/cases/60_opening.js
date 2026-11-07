// The real opening: New Game -> the Prologue (map 5) -> the Ghost waking in the lava tube (map 6),
// and map 6's Act 1 / Act 2 events.

const startGame = async (h, at, playtest) => {
    await h.page.goto(h.base + '/index.html' + (playtest ? '?test' : ''));   // ?test: an editor playtest
    await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
    await h.page.evaluate(([at, playtest]) => {
        if (at) Object.assign($dataSystem, { startMapId: at[0], startX: at[1], startY: at[2] });
        SceneManager._scene.commandNewGame();   // the real start (the Prologue) unless told otherwise
    }, [at || null, !!playtest]);
};
const onMap = (h, id) => h.page.waitForFunction(i => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === i, id, { timeout: 30000 });
const ev = name => $gameMap.events().find(e => e.event().name === name);

module.exports = {
    'the opening: the Prologue, then the Ghost wakes alone': async (h, t) => {
        await startGame(h, null, true);
        await onMap(h, 5);
        await h.page.waitForTimeout(500);
        const start = await h.eval(() => ({ visible: !$gamePlayer.isTransparent(), bgm: AudioManager._currentBgm && AudioManager._currentBgm.name }));
        for (let i = 0; i < 6; i++) { await h.pumpMessages(); if (await h.eval(() => $gameMap.mapId() === 6)) break; await h.page.waitForTimeout(500); }
        await onMap(h, 6);
        await h.page.waitForTimeout(800);
        await h.pumpMessages();
        const r = await h.eval(() => ({
            party: $gameParty._actors.join(','), name: $gameActors.actor(1).name(), story: $gameVariables.value(5),
            visible: !$gamePlayer.isTransparent(), pos: $gamePlayer.x + ',' + $gamePlayer.y,
            pass: $gameParty.numItems($dataItems[736])
        }));
        // the Test Room Pass: its common event puts back the test party and goes to the Test Room
        await h.eval(() => $gameTemp.reserveCommonEvent($dataItems[736].effects[0].dataId));
        await onMap(h, 4);
        await h.page.waitForTimeout(500);
        await h.pumpMessages();
        const room = await h.eval(() => ({ party: $gameParty._actors.slice().sort((a, b) => a - b).join(','), visible: !$gamePlayer.isTransparent() }));
        t.eq(start.visible, false, 'the player is invisible on the black Prologue');
        t.eq(start.bgm, 'Prologue', 'the Prologue plays its music');
        t.eq(r.pass, 1, 'in playtests the party starts with the Test Room Pass');
        t.eq(room.party, '2,3,4,5,12', 'the pass brings back the test party...');
        t.ok(room.visible, '...in the Test Room, visible');
        t.eq(r.party, '1', 'the Ghost alone');
        t.eq(r.name, '???', 'the Ghost has no name yet');
        t.eq(r.story, 10, 'waking sets the Story variable to 10');
        t.ok(r.visible, 'the Ghost is visible once awake');
        t.eq(r.pos, '8,5', 'standing over the remains');
    },

    'map 6: the reflection, Lasa, and what waits for Act 2': async (h, t) => {
        await startGame(h, [6, 8, 5]);   // straight into the lava tube, as the Prologue leaves you
        await h.eval(() => { $gameParty._actors = [1]; $gamePlayer.refresh(); });
        await onMap(h, 6);
        await h.page.waitForTimeout(500);
        await h.pumpMessages();
        const act1 = await h.eval(() => {
            const bats = $gameMap.events().find(e => e.event().name === 'Wandering Enemy: Bats');
            return { batsAway: bats.isWanderAway(), skeletonPage: $gameMap.events().find(e => e.event().name === "Yoon's Skeleton").findProperPageIndex() };
        });
        // Yoon's blood: stepping on the stain gives the Ghost an impression, once
        await h.eval(() => { $gamePlayer.locate(10, 8); $gamePlayer.moveStraight(2); });
        await h.page.waitForTimeout(500);
        await h.pumpMessages();
        const blood = await h.eval(() => ({ on: $gamePlayer.x + ',' + $gamePlayer.y, felt: $gameSelfSwitches.value([6, $gameMap.events().find(e => e.event().name === "Yoon's Blood").eventId(), 'A']) }));
        // the reflection: the first choice (a boy)
        await h.eval(() => { $gameParty._actors = [1]; $gamePlayer.locate(11, 11); $gamePlayer.setDirection(6); $gameMap.event(45).start(); });
        await h.pumpMessages();
        const gender = await h.eval(() => ({ g: $gameVariables.value(4), done: $gameSelfSwitches.value([6, 45, 'A']) }));
        // Lasa drops in when the Ghost walks into the skylight's light
        await h.eval(() => { SmokingIsle.Naming.named()[4] = true; $gamePlayer.locate(24, 13); });
        // a parallel event: press OK through its messages until Lasa has joined (or give up)
        for (let i = 0; i < 80; i++) {
            if (await h.eval(() => $gameVariables.value(5) >= 20 && !$gameMessage.isBusy())) break;
            if (await h.eval(() => $gameMessage.isBusy())) await h.page.keyboard.press('Enter');
            await h.page.waitForTimeout(150);
        }
        const lasa = await h.eval(() => ({ party: $gameParty._actors.join(','), story: $gameVariables.value(5) }));
        // Act 2: Sib along and Story >= 50
        const act2 = await h.eval(() => {
            $gameParty.addActor(3); $gameVariables.setValue(5, 50); $gameMap.refresh();
            const bats = $gameMap.events().find(e => e.event().name === 'Wandering Enemy: Bats');
            return { batsAway: bats.isWanderAway(), skeletonPage: $gameMap.events().find(e => e.event().name === "Yoon's Skeleton").findProperPageIndex() };
        });
        t.ok(act1.batsAway, 'Act 1: no bats (no fighting as a ghost)');
        t.eq(act1.skeletonPage, 0, 'Act 1: the remains only give the ghost an impression');
        t.eq(blood.on, '10,9', 'the Ghost steps onto the stain');
        t.ok(blood.felt, 'and feels it (Yoon\'s Blood, once)');
        t.eq(gender.g, 1, 'the reflection sets Yoon\'s gender');
        t.ok(gender.done, '...once');
        t.eq(lasa.party, '1,4', 'Lasa joins in the garden');
        t.eq(lasa.story, 20, 'Story 20 after meeting Lasa');
        t.ok(!act2.batsAway, 'Act 2: the bats are out');
        t.eq(act2.skeletonPage, 1, 'Act 2: the remains run Scene: The Bone');
    }
};
