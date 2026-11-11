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
        await h.page.waitForFunction(() => $gameMessage.isBusy() && SceneManager._scene._messageWindow._textState, null, { timeout: 30000 });
        await h.page.waitForTimeout(800);
        const start = await h.eval(() => {
            const w = SceneManager._scene._messageWindow, line = SmokingIsle.Screen.lineFrom(w, w._textState.text, 0, w.contentsWidth());
            return { visible: !$gamePlayer.isTransparent(), bgm: AudioManager._currentBgm && AudioManager._currentBgm.name,
                     centred: w._siCenter, shown: !/CT/.test(w._textState.text), margin: Math.round((w.contentsWidth() - w.textWidth(line)) / 2) };
        });
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
        t.ok(start.centred && start.shown, 'the narration is centred (\\CT, not shown)');
        t.ok(start.margin > 40, 'its first line starts well in from the left (' + start.margin + ' px)');
        t.eq(r.pass, 1, 'in playtests the party starts with the Test Room Pass');
        t.eq(room.party, '2,3,4,5,12', 'the pass brings back the test party...');
        t.ok(room.visible, '...in the Test Room, visible');
        t.eq(r.party, '1', 'the Ghost alone');
        t.eq(r.name, '???', 'the Ghost has no name yet');
        t.eq(r.story, 10, 'waking sets the Story variable to 10');
        t.ok(r.visible, 'the Ghost is visible once awake');
        t.eq(r.pos, '8,5', 'standing over the remains');
    },

    'map 6: First Words (Lasa, the lessons, the face), and what waits for Act 2': async (h, t) => {
        await startGame(h, [6, 8, 5]);   // straight into the lava tube, as the Prologue leaves you
        await h.eval(() => { $gameParty._actors = [1]; $gamePlayer.refresh(); SmokingIsle.Naming.named()[4] = true; });
        await onMap(h, 6);
        await h.page.waitForTimeout(500);
        await h.pumpMessages();
        // Press OK through messages, answering choices from `picks`, until `done` holds (or give up).
        const play = async (picks, done, arg) => {
            picks = picks.slice();
            for (let i = 0; i < 200; i++) {
                const s = await h.eval(() => {
                    const w = SceneManager._scene._messageWindow, c = w && w._choiceWindow;
                    return { choice: !!(c && c.active), busy: $gameMessage.isBusy() || $gameMap.isEventRunning() };
                });
                if (s.choice) { const n = picks.shift(); await h.eval(n => { SceneManager._scene._messageWindow._choiceWindow.select(n); }, n); }
                if (s.choice || s.busy) await h.page.keyboard.press('Enter');
                if (!s.choice && !s.busy && await h.eval(done, arg)) return true;
                await h.page.waitForTimeout(120);
            }
            return false;
        };
        const act1 = await h.eval(() => {
            const bats = $gameMap.events().find(e => e.event().name === 'Wandering Enemy: Bats');
            return { batsAway: bats.isWanderAway(), skeletonPage: $gameMap.events().find(e => e.event().name === "Yoon's Skeleton").findProperPageIndex(),
                     noMoves: $gameActors.actor(1).skills().filter(s => s.stypeId === 6).length };
        });
        // Yoon's blood: stepping on the stain gives the Ghost an impression, once
        await h.eval(() => { $gamePlayer.locate(10, 8); $gamePlayer.moveStraight(2); });
        await h.page.waitForTimeout(500);
        await h.pumpMessages();
        const blood = await h.eval(() => ({ on: $gamePlayer.x + ',' + $gamePlayer.y, felt: $gameSelfSwitches.value([6, $gameMap.events().find(e => e.event().name === "Yoon's Blood").eventId(), 'A']) }));
        // before the lessons the water doesn't twinkle, and gives no face
        const water = await h.eval(() => $gameMap.event(45).findProperPageIndex());
        // Lasa drops in; the Ghost floats away three times (talking to her again each time), then she forces her way in
        await h.eval(() => { $gamePlayer.locate(24, 13); });
        const settled = "$gameSelfSwitches.value([6, 46, 'A']) && !$gamePlayer.isMoveRouteForcing() && !$gamePlayer.isMoving()";
        const away1 = await play([1], s => $gameVariables.value(12) === 1 && eval(s), settled);
        const waits = await h.eval(() => ({ party: $gameParty._actors.join(','), page: $gameMap.event(46).findProperPageIndex(), moved: $gamePlayer.x + ',' + $gamePlayer.y }));
        for (let k = 2; k <= 4; k++) {
            await h.eval(() => $gameMap.event(46).start());
            await play([1], a => $gameVariables.value(12) === a[0] && (a[0] < 4 ? eval(a[1]) : $gameVariables.value(5) === 20), [k, settled]);
        }
        const lasa = await h.eval(() => ({ party: $gameParty._actors.join(','), story: $gameVariables.value(5), funny: $gameVariables.value(10), first: $gameVariables.value(13),
                                           wail: $gameActors.actor(1).isLearnedSkill(591), bgm: AudioManager._currentBgm && AudioManager._currentBgm.name,
                                           unnamed: !JSON.stringify($dataCommonEvents[16].list).includes('N[4]'), gone: $gameMap.event(46).findProperPageIndex() }));
        // a lesson: the remains teach 'bones' (said carefully: Sweet)
        await h.eval(() => $gameMap.event(2).start());
        await play([0], () => $gameVariables.value(6) === 1);
        const lesson = await h.eval(() => ({ words: $gameVariables.value(6), sweet: $gameVariables.value(9), done: $gameSelfSwitches.value([6, 2, 'B']), page: $gameMap.event(2).findProperPageIndex() }));
        // the last word (wailed: Unhinged), then the finale: the nickname follows the highest count (Funny 4)
        await h.eval(() => { $gameSystem._siWords = ['bones', 'sleep', 'star', 'head', 'jar', 'rope', 'up', 'fire', 'sit', 'food', 'rock', 'down']; $gameMap.event(28).start(); });
        await play([2], () => $gameVariables.value(5) === 25);
        const finale = await h.eval(() => ({ words: $gameVariables.value(6), story: $gameVariables.value(5), name: $gameActors.actor(1).name(), unhinged: $gameVariables.value(11), twinkle: $gameMap.event(45).findProperPageIndex() }));
        // the face: a girl
        await h.eval(() => $gameMap.event(45).start());
        await play([1], () => $gameVariables.value(5) === 30);
        const face = await h.eval(() => ({ g: $gameVariables.value(4), story: $gameVariables.value(5) }));
        // Act 2: Sib along and Story >= 50
        const act2 = await h.eval(() => {
            $gameParty.addActor(3); $gameVariables.setValue(5, 50); $gameMap.refresh();
            const bats = $gameMap.events().find(e => e.event().name === 'Wandering Enemy: Bats');
            const skel = $gameMap.events().find(e => e.event().name === "Yoon's Skeleton");
            return { batsAway: bats.isWanderAway(), bone: skel.page().list.some(c => c.code === 117 && c.parameters[0] === 12) };
        });
        t.ok(act1.batsAway, 'Act 1: no bats (no fighting as a ghost)');
        t.eq(act1.skeletonPage, 0, 'Act 1: the remains only give the ghost an impression');
        t.eq(act1.noMoves, 0, 'the Ghost starts with no moves');
        t.eq(blood.on, '10,9', 'the Ghost steps onto the stain');
        t.ok(blood.felt, 'and feels it (Yoon\'s Blood, once)');
        t.eq(water, 0, 'the water is just water before the lessons');
        t.ok(away1, 'Lasa drops in; float away (1)');
        t.eq(waits.party, '1', '...she isn\'t in the party yet');
        t.eq(waits.page, 2, '...she waits in the garden');
        t.ok(waits.moved !== '24,13', '...and the Ghost has drifted back (' + waits.moved + ')');
        t.eq(lasa.party, '1,4', 'the fourth time she forces her way into the party');
        t.eq(lasa.story, 20, 'Story 20');
        t.eq(lasa.funny + '/' + lasa.first, '4/2', 'Funny 4, first impression funny');
        t.ok(lasa.wail, 'the Ghost wails and learns Mournful Wail');
        t.eq(lasa.bgm, 'First_Words', 'when the talk ends, First Words plays');
        t.ok(lasa.unnamed, 'before her name screen, Lasa\'s lines say ???, not her name');
        t.eq(lasa.gone, 3, 'Lasa\'s event is gone from the garden');
        t.eq(lesson.words + '/' + lesson.sweet, '1/1', 'a lesson: a new word; said carefully, Sweet +1');
        t.ok(lesson.done && lesson.page === 2, 'the remains now use the word');
        t.eq(finale.words + '/' + finale.story, '13/25', 'all 13 words: the finale (Story 25)');
        t.eq(finale.unhinged, 1, 'wailing the word: Unhinged +1');
        t.eq(finale.name, 'Flighty', 'Lasa\'s nickname follows the highest count (Funny)');
        t.eq(finale.twinkle, 1, 'the water twinkles now');
        t.eq(face.g + '/' + face.story, '2/30', 'the face: a girl; Story 30');
        t.ok(!act2.batsAway, 'Act 2: the bats are out');
        t.ok(act2.bone, 'Act 2: the remains run Scene: The Bone');
    },

    'temperament moves: learned in the lesson where a count reaches 5 / 10 / 20': async (h, t) => {
        await startGame(h, [6, 25, 15]);
        await onMap(h, 6);
        const run = async (setup) => {
            await h.eval(setup);
            await h.eval(() => $gameTemp.reserveCommonEvent(18));
            await h.page.waitForTimeout(300);
            await h.pumpMessages();
            return h.eval(() => [589, 590, 592, 597, 598, 599, 600, 607, 608, 609].filter(id => $gameActors.actor(1).isLearnedSkill(id)).join(','));
        };
        const start = await run(() => { $gameParty._actors = [1, 4]; $gameVariables.setValue(6, 1); $gameVariables.setValue(11, 4); });
        const u5 = await run(() => $gameVariables.setValue(11, 5));
        const again = await run(() => {});
        const both = await run(() => { $gameVariables.setValue(9, 20); $gameVariables.setValue(5, 30); });
        const odd = await run(() => { $gameVariables.setValue(10, 20); $gameVariables.setValue(11, 20); });
        t.eq(start, '', 'below 5: no move');
        t.eq(u5, '592', 'Unhinged 5: Terrifying Wail, in the lesson');
        t.eq(again, '592', 'only once');
        t.eq(both, '592,597,598,599,600', 'Sweet 20 at once: Calming, Joyful, then Rallying and Focusing Cry');
        t.eq(odd, '589,590,592,597,598,599,600,607,608,609', 'Funny 20: Bewildering Wail, Flitting Cry, Beguiling Wail; Unhinged 20: Maddening and Dragging Wail');
    },

    'the Ghost\'s Funny and Unhinged moves in battle': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const ghost = $gameActors.actor(1), lasa = $gameActors.actor(4), foe = $gameTroop.aliveMembers()[0];
            const use = (id, target) => { const a = new Game_Action(ghost); a.setSkill(id); target.clearResult(); a.apply(target); };
            const real = Math.random; Math.random = () => 0;
            use(607, lasa); use(609, foe);
            Math.random = real;
            return { flit: lasa.isStateAffected(226), below: foe.isStateAffected(114), by: foe._siInflicter && foe._siInflicter[114] === ghost,
                     scopes: [607, 608, 609].map(id => $dataSkills[id].scope).join(',') };
        });
        t.ok(r.flit, 'Flitting Cry: Lasa flits (the next melee attack misses)');
        t.ok(r.below && r.by, 'Dragging Wail: the enemy is dragged below by the Ghost (hit the Ghost to free it)');
        t.eq(r.scopes, '8,2,1', 'Flitting Cry all allies, Beguiling Wail all enemies, Dragging Wail one enemy');
    },

    'map 6: the ladder leads up the sky-hole to map 1 (the gully)': async (h, t) => {
        const climb = async (setup) => {
            await startGame(h, [6, 25, 15]);
            await onMap(h, 6);
            await h.eval(setup);
            await h.eval(() => $gameMap.events().find(e => e.event().name === 'Broken Ladder').start());
            await h.pumpMessages();   // Enter takes the first choice: up
            await onMap(h, 1);
            return h.eval(() => [$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction()].join(','));
        };
        const act1 = await climb(() => { $gameParty._actors = [1, 4]; $gameVariables.setValue(5, 30); $gameMap.refresh(); });
        const act2 = await climb(() => { $gameParty._actors = [2, 3]; $gameVariables.setValue(5, 50); $gameSelfSwitches.setValue([6, 8, 'A'], true); $gameMap.refresh(); });
        t.eq(act1, '1,12,204,8', 'Act 1: the Ghost and Lasa float up to the gully, on the rim north of the hole, facing north');
        t.eq(act2, '1,12,204,8', 'Act 2: the mended ladder climbs to the same spot');
        // the view down the hole: <Parallax Anchor: x, y, depth> pins the parallax's centre under the hole
        await h.eval(() => { $dataMap.note = '<Parallax Anchor: 13, 206, 0.3>'; $gameMap.changeParallax('SkyHole_Day', false, false, 0, 0); });
        await h.page.waitForFunction(() => { const p = SceneManager._scene._spriteset._parallax; return p.bitmap && p.bitmap.isReady() && p.bitmap.width > 0; });
        const view = await h.eval(() => {
            const S = SmokingIsle.Screen, w = SceneManager._scene._spriteset._parallax.bitmap.width;
            const centre = () => { $gameMap.setDisplayPos(13.5 - $gameMap.screenTileX() / 2, 0); return $gameMap.parallaxOx(); };
            const at = centre();
            $gameMap.setDisplayPos(13.5 - $gameMap.screenTileX() / 2 + 4, 0); const moved = $gameMap.parallaxOx();
            return { atCentre: Math.round(at - (w / 2 - 13.5 * 48 + $gameMap.displayX() * 48 - 4 * 48)), shift: Math.round(moved - at) };
        });
        t.eq(view.atCentre, 0, 'with the hole mid-screen, the image\'s centre is under it');
        t.eq(view.shift, Math.round(4 * 48 * 0.7), 'the camera moves 4 tiles: the view shifts 70% of that (it seems far below)');
    }
};
