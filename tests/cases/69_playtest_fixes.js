// Fixes from playtesting: "Be silly", the arrival narration, words from gathering, flying melee, Landed Mana,
// and Mana in every enemy for Ghostly Touch to drain.
module.exports = {
    'lessons say "Be silly"; coming out of the hole is narrated': async (h, t) => {
        await h.newGame();
        const r = await h.page.evaluate(async () => {
            const get = f => fetch('data/' + f).then(x => x.text());
            const files = ['Map001.json', 'Map002.json', 'Map003.json', 'Map006.json', 'CommonEvents.json'];
            const texts = await Promise.all(files.map(get));
            const m1 = JSON.parse(texts[0]), arrival = m1.events.find(e => e && /Out of the Sky-Hole/.test(e.name));
            const lines = arrival.pages[0].list.filter(c => c.code === 401).map(c => c.parameters[0]);
            return { wrong: texts.some(s => s.includes('Say it wrong.')), silly: texts.filter(s => s.includes('Be silly.')).length,
                     narration: lines.slice(0, 3).join(' | '), bgs: arrival.pages[0].list.some(c => c.code === 245) };
        });
        t.ok(!r.wrong && r.silly >= 4, 'every lesson offers "Be silly." (no "Say it wrong." left)');
        t.ok(/out of the dark/.test(r.narration) && /no ceiling/.test(r.narration) && r.bgs, 'narration and wind as the Ghost rises out of the hole: ' + r.narration);
    },

    'words from gathering: plant (and Spirit Surge), fruit, lava, stink': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, J = SmokingIsle.Journal, lasa = $gameActors.actor(4), map = $gameMap.mapId(), out = {};
            const ev = $gameMap.events().find(e => /Gather:/.test(e.event().name)), real = Math.random; Math.random = () => 0.1;
            const pick = sp => { delete G.spent()[G.key(map, ev.eventId())]; G.pending = { mapId: map, eventId: ev.eventId(), species: sp, actors: [lasa], choice: 0 };
                G.finish({ setWaitMode() {} }); $gameMessage.clear(); const w = $gameTemp._siGatherWord; $gameTemp._siGatherWord = null; return w || ''; };
            out.words = ['Wart Fern', 'Skylight Fig', 'Scoria', 'Pumice', 'Sulfur Vent', 'Ephedra'].map(pick).join(',');
            Math.random = real;
            out.due = (() => { $gameTemp._siGatherWord = 'plant'; return G.lessonDue('plant') + '/' + G.lessonDue('plant'); })();
            out.hooked = [24, 25, 26, 27].every(id => $dataCommonEvents[5].list.some(c => c.code === 117 && c.parameters[0] === id));
            return out;
        });
        t.eq(r.words, 'plant,fruit,lava,lava,stink,', 'wart fern: plant; fig: fruit; scoria or pumice: lava; sulfur: stink; others: none');
        t.eq(r.due, 'true/false', 'a lesson is due once, then cleared');
        t.ok(r.hooked, 'the Gather event runs the lesson (common events 24-27)');
        await h.eval(() => $gameTemp.reserveCommonEvent(24)); await h.page.waitForTimeout(300); await h.pumpMessages(80);
        const after = await h.eval(() => {
            const G = SmokingIsle.Gather, lasa = $gameActors.actor(4), map = $gameMap.mapId(), ev = $gameMap.events().find(e => /Gather:/.test(e.event().name));
            delete G.spent()[G.key(map, ev.eventId())]; G.pending = { mapId: map, eventId: ev.eventId(), species: 'Wart Fern', actors: [lasa], choice: 0 };
            const real = Math.random; Math.random = () => 0.1; G.finish({ setWaitMode() {} }); Math.random = real; $gameMessage.clear();
            return { knows: SmokingIsle.Journal.knowsWord('plant'), surge: $gameActors.actor(1).isLearnedSkill(584), again: $gameTemp._siGatherWord || '' };
        });
        t.ok(after.knows && after.surge, 'the plant lesson: a new word, and the Ghost learns Spirit Surge');
        t.eq(after.again, '', 'picking a second wart fern: no lesson again');
    },

    'battle: flying Lasa reaches flyers; Landed she regains Mana; every enemy has Mana to drain': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const lasa = $gameActors.actor(4), raven = new Game_Enemy(14, 0, 0); $gameTroop._enemies.push(raven);
            const eva = (who, target) => { const a = new Game_Action(who); a.setSkill(80); return a.itemEva(target); };
            const flying = eva(lasa, raven);
            lasa.addState(8); const landed = eva(lasa, raven), mrg = lasa.mrg; lasa.removeState(8);
            const yoon = $gameActors.actor(2), fromGround = eva(yoon, raven);
            const noMana = $dataEnemies.filter(e => e && e.name && e.params[1] <= 0).map(e => e.name);
            const ghost = $gameActors.actor(1), a = new Game_Action(ghost); a.setSkill(588);
            raven.setMp(raven.mmp); const before = raven.mp; ghost.setMp(0); raven.clearResult(); a.apply(raven);
            $gameTroop._enemies.pop();
            return { flying, landed, fromGround, mrg, noMana: noMana.join(', '), drained: before - raven.mp, gained: ghost.mp };
        });
        t.ok(r.flying < 0.5, 'Lasa, flying, can hit a flying raven in melee (evasion ' + r.flying + ')');
        t.ok(r.landed >= 0.75 && r.fromGround >= 0.75, 'Landed (or from the ground), the raven dodges as before');
        t.ok(Math.abs(r.mrg - 0.1) < 0.001, 'Landed: Lasa regains 10% Mana a turn');
        t.eq(r.noMana, '', 'every enemy has some Mana');
        t.ok(r.drained > 0 && r.gained > 0, "Ghostly Touch drains a raven's Mana into the Ghost (" + r.drained + ')');
    }
};
