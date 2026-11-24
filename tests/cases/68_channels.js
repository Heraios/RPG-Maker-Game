// Map 3, the channels: the climb, its six lessons (water, tree, bird, wind, sing, road) and the combat tutorial.
const start = async (h, x, y) => {
    await h.page.goto(h.base + '/index.html');
    await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 60000 });
    await h.page.evaluate(([x, y]) => { Object.assign($dataSystem, { startMapId: 3, startX: x, startY: y }); SceneManager._scene.commandNewGame(); }, [x, y]);
    await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted && $gameMap.mapId() === 3, null, { timeout: 30000 });
    await h.eval(() => { $gameParty._actors = [1, 4]; $gameVariables.setValue(5, 30); $gameMap.refresh(); });
};
module.exports = {
    'the channels: the way through, and every find in reach': async (h, t) => {
        await start(h, 20, 43);
        const r = await h.eval(() => {
            // flood fill from the south edge with the game's own passability (events included)
            const W = $gameMap.width(), H = $gameMap.height(), seen = new Set(['20,43']), q = [[20, 43]];
            while (q.length) {
                const [x, y] = q.shift();
                [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]].forEach(([d, dx, dy]) => {
                    const k = (x + dx) + ',' + (y + dy);
                    if (seen.has(k)) return;
                    $gamePlayer.locate(x, y);
                    if ($gamePlayer.canPass(x, y, d)) { seen.add(k); q.push([x + dx, y + dy]); }
                });
            }
            const near = e => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => seen.has((e.x + dx) + ',' + (e.y + dy)));
            const things = $gameMap.events().filter(e => /^(Gather:|The |Ravens in)/.test(e.event().name));
            return { north: seen.has('20,1'), unreachable: things.filter(e => !near(e)).map(e => e.event().name).join(', '), n: things.length };
        });
        t.ok(r.north, 'from the south edge to the north exit, on foot');
        t.eq(r.unreachable, '', 'every lesson and gathering spot can be reached (' + r.n + ')');
    },

    'the channels: six lessons; four teach the Ghost a touch': async (h, t) => {
        await start(h, 20, 43);
        for (const name of ['The Spring', 'The Dead Tree', 'Ravens in the Dead Tree', 'The Gusty Saddle', 'The Singing Wires', 'The Road']) {
            await h.eval(n => $gameMap.events().find(e => e.event().name.startsWith(n)).start(), name);
            await h.pumpMessages(80);
        }
        const r = await h.eval(() => ({ words: ['water', 'tree', 'bird', 'wind', 'sing', 'road'].filter(w => SmokingIsle.Journal.knowsWord(w)).join(','),
            moves: [570, 572, 571, 588].map(id => $gameActors.actor(1).isLearnedSkill(id)).join('/') }));
        t.eq(r.words, 'water,tree,bird,wind,sing,road', 'six new words');
        t.eq(r.moves, 'true/true/true/true', 'water: Chilling, tree: Crushing, wind: Cutting, sing: Ghostly Touch');
    },

    'the combat tutorial: the first gully fight, once': async (h, t) => {
        await start(h, 20, 43);
        const fight = async () => {
            await h.eval(() => {
                window.__said = []; const add = Game_Message.prototype.add;
                if (!Game_Message.prototype.__siHooked) { Game_Message.prototype.__siHooked = true; Game_Message.prototype.add = function(text) { (window.__said || []).push(text); return add.call(this, text); }; }
                BattleManager.setup(25, true, true); SceneManager.push(Scene_Battle);
            });
            await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Battle && SceneManager._sceneStarted, null, { timeout: 30000 });
            for (let k = 0; k < 80; k++) {
                const s = await h.eval(() => ({ busy: $gameMessage.isBusy() || $gameTroop.isEventRunning(), input: BattleManager.isInputting() }));
                if (s.input && !s.busy) break;
                if (s.busy) await h.page.keyboard.press('Enter');
                await h.page.waitForTimeout(120);
            }
            const out = await h.eval(() => ({ said: window.__said.join(' | '), knows: SmokingIsle.Journal.knowsHow('fighting') }));
            await h.eval(() => { BattleManager.abort(); });
            await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted, null, { timeout: 30000 });
            return out;
        };
        const first = await fight(), second = await fight();
        t.ok(/A fight! It's seen us\./.test(first.said) && /Fight, then Innate/.test(first.said), 'first fight: Lasa explains the battle screen');
        t.ok(first.knows, 'and Memory keeps it (Know-how: Fighting)');
        t.ok(!/A fight! It's seen us\./.test(second.said), 'the next fight: not again');
    }
};
