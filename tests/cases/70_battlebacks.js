// Battle backgrounds by time of day (SI_Time): sky backdrops get their _Dusk / _Night versions outdoors.
module.exports = {
    'battlebacks: sky backdrops change with the time of day, rock ones take the tint': async (h, t) => {
        await h.newGame();
        const SP = '/tmp/claude-0/-home-user-RPG-Maker-Game/960be05b-c077-57ad-be26-fbaff82af080/scratchpad/';
        const run = async (b2, period, indoors, shot) => {
            await h.eval(([b2, period, indoors]) => { const T = SmokingIsle.Time; T.state().period = period; $dataMap.note = indoors ? '<Indoors>' : '';
                T.refreshTint(0); $gameParty._actors = [1, 4]; $gameMap.changeBattleback('LavaCountry', b2); BattleManager.setup(25, true, true); SceneManager.push(Scene_Battle); }, [b2, period, indoors]);
            await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Battle && SceneManager._sceneStarted && SceneManager._scene._spriteset && SceneManager._scene._spriteset._back2Sprite && SceneManager._scene._spriteset._back2Sprite.bitmap && (SceneManager._scene._spriteset._back2Sprite.bitmap.isReady() || SceneManager._scene._spriteset._back2Sprite.bitmap.isError()), null, { timeout: 30000 });
            await h.page.waitForTimeout(800);
            const r = await h.eval(() => ({ name: SceneManager._scene._spriteset.battleback2Name(), loaded: SceneManager._scene._spriteset._back2Sprite.bitmap.width > 0 }));
            if (shot) { for (let k = 0; k < 20 && await h.eval(() => $gameMessage.isBusy()); k++) { await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(150); }
                await (await h.page.$('canvas')).screenshot({ path: SP + shot, clip: { x: 0, y: 60, width: 920, height: 380 } }); }
            await h.eval(() => BattleManager.abort());
            await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted, null, { timeout: 30000 });
            return r;
        };
        const day = await run('LavaSky', 1, false, 'bb_day.png'), dusk = await run('LavaSky', 2, false, 'bb_dusk.png'), night = await run('LavaSky', 3, false, 'bb_night.png');
        const name = (b2, period, indoors) => h.eval(([b2, period, indoors]) => { SmokingIsle.Time.state().period = period; $dataMap.note = indoors ? '<Indoors>' : '';
            $gameMap.changeBattleback('LavaCountry', b2); return { name: Spriteset_Battle.prototype.battleback2Name.call(Object.create(Spriteset_Battle.prototype)) }; }, [b2, period, indoors]);
        const rock = await name('LavaRidges', 3, false), field = await name('field', 2, false), inside = await name('LavaSky', 3, true);
        t.eq([day.name, dusk.name, night.name].join(','), 'LavaSky,LavaSky_Dusk,LavaSky_Night', 'LavaSky: day, dusk and night skies');
        t.ok(dusk.loaded && night.loaded, 'the dusk and night images exist and load');
        t.eq(field.name, 'field_Dusk', 'field has them too');
        t.eq(rock.name, 'LavaRidges', 'rock backdrops stay (the night tint does the work)');
        t.eq(inside.name, 'LavaSky', 'indoors: no change');
    }
};
