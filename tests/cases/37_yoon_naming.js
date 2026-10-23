// Yoon's gender: pronoun text codes, the passive effect for each, the keepsakes in Yoon's room.
// Naming: newcomers are named when they first join; Ghost and Human Yoon share a name.

module.exports = {
    'pronouns, effects and keepsakes': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const Y = SmokingIsle.Yoon, w = new Window_Base(0, 0, 100, 100), say = s => w.convertEscapeCharacters(s), out = {};
            const line = '\\YP[They] said \\YP[they] \\YV[were|was] coming. \\N[2] is \\YP[their] own \\YG[son|daughter|child], \\YP[they\'re] home.';
            out.unchosen = say(line);
            [1, 2, 3].forEach(g => { Y.setGender(g); out['g' + g] = say(line); });
            // Talk lines use names as codes now
            out.talkLine = $dataEnemies[8].note.includes('\\N[5]');
            // the passive effects
            const yoon = $gameActors.actor(2);
            Y.setGender(1); out.boy = yoon.talkEquipBonus('stalk') + '/' + Y.expectedJob() + '/' + Y.closerParent();
            Y.setGender(2); out.girl = Math.round(yoon.pha * 100) + '/' + Y.expectedJob();
            Y.setGender(3); out.third = yoon.talkEquipBonus('rite') + '/' + Y.expectedJob();
            out.hidden = yoon.stateIcons().length === 0 && !yoon.isStateAffected(212);
            yoon.clearStates(); out.stays = yoon.talkEquipBonus('rite');
            // keepsakes: each gender finds different things in Yoon's room
            const P = $gameParty, AR = n => $dataArmors.find(a => a && a.name === n);
            const run = g => { Y.setGender(g); const i = new Game_Interpreter(); i.setup($dataCommonEvents[10].list); while (i.isRunning()) { $gameMessage.clear(); i.update(); } };
            [1, 2, 3].forEach(g => run(g));
            out.keepsakes = ['Goat-Hair Sling', 'Leech Jar', 'Gourd Rattle'].map(n => P.numItems(AR(n))).join();
            return out;
        });
        t.eq(r.unchosen, 'They said they were coming. Yoon is their own child, they\'re home.', 'before the choice: they/them');
        t.eq(r.g1, 'He said he was coming. Yoon is his own son, he\'s home.', 'a boy');
        t.eq(r.g2, 'She said she was coming. Yoon is her own daughter, she\'s home.', 'a girl');
        t.eq(r.g3, 'They said they were coming. Yoon is their own child, they\'re home.', 'third gender: they/them');
        t.ok(r.talkLine, 'enemy talk lines name characters with \\N[n]');
        t.eq(r.boy, '20/hunter/Pada', 'a boy: Stalk +20, expected to hunt, closer to Pada');
        t.eq(r.girl, '120/herbalist', 'a girl: remedies heal 20% more, expected to be an herbalist');
        t.eq(r.third, '20/priest', 'third gender: Rite +20, expected to be a priest');
        t.ok(r.hidden, 'the passive effect shows no icon');
        t.eq(r.stays, 20, 'and clearing states doesn\'t remove it');
        t.eq(r.keepsakes, '1,1,1', 'each gender finds its own keepsakes in Yoon\'s room');
    },

    'naming on join': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const out = {}, P = $gameParty, note = $dataMap.note;
            out.testRoom = /<No Name Entry>/.test(note) && !SmokingIsle.Naming.wantsName(7);
            $dataMap.note = '';   // the Test Room switches name entry off
            P.removeActor(7);
            const i = new Game_Interpreter(); i.setup([{ code: 129, indent: 0, parameters: [7, 0, 0] }, { code: 0, indent: 0, parameters: [] }]);
            i.executeCommand();
            out.first = SceneManager._nextScene && SceneManager._nextScene.constructor === Scene_Name && SceneManager._nextScene._actorId === 7;
            SceneManager._nextScene = null; SceneManager._stack.pop();
            P.removeActor(7);
            const j = new Game_Interpreter(); j.setup([{ code: 129, indent: 0, parameters: [7, 0, 0] }, { code: 0, indent: 0, parameters: [] }]);
            j.executeCommand(); out.again = !SceneManager._nextScene;
            SceneManager._nextScene = null;
            $dataMap.note = note;
            $gameActors.actor(1).setName('Ari'); out.shared = $gameActors.actor(2).name();
            return out;
        });
        t.ok(r.testRoom, 'no name entry in the Test Room');
        t.ok(r.first, 'the first time Dama joins, the player names her');
        t.ok(r.again, 'only the first time');
        t.eq(r.shared, 'Ari', 'naming the Ghost names Human Yoon too');
    }
};
