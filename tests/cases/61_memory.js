// Memory (SI_Journal): Yoon's journal. Quests, Evidence, Remembered; notices; the menu command and J.

module.exports = {
    'memory: quests, clues, words and the Body': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const J = SmokingIsle.Journal, out = {};
            out.data = !!($dataJournal && $dataJournal.quests && $dataJournal.words);
            const kinds = tab => J.rows(tab).map(x => x.kind + (x.status ? ':' + x.status : '')).join(',');
            // quests
            $gameTemp._siJournalNotices = [];
            out.emptyQuests = kinds('quests');
            J.quest('words'); J.quest('words');
            out.notice = $gameTemp._siJournalNotices.join('|');
            J.step('words', 2); out.step = J.state().quests.words.step;
            J.quest('silver'); J.complete('words');
            out.quests = kinds('quests');
            J.quest('pearl'); J.missGiver('\\N[3]');
            out.missed = J.questStatus('pearl') + '/' + J.questStatus('silver') + '/' + J.questStatus('words');
            // evidence: hidden until it opens; a clue counts once
            out.tabsBefore = J.tabs().map(x => x[0]).join(',');
            const ev0 = $gameVariables.value(7);
            J.clue('skull'); J.clue('skull'); J.clue('nonsense');
            out.evidence = $gameVariables.value(7) - ev0;
            out.tabsAfter = J.tabs().map(x => x[0]).join(',');
            out.unknownClues = J.rows('evidence').filter(x => x.kind === 'unknown').length;
            out.clueRows = J.rows('evidence').filter(x => x.kind === 'clue').length;
            // words: known ones by name, the rest ???
            $gameSystem._siWords = [];
            J.learnWord('bones', 1); J.learnWord('bones', 2);
            out.said = J.state().said.bones;
            out.words = $gameVariables.value(6);
            out.wordRows = J.rows('remembered').filter(x => x.kind === 'word').map(x => x.text).join(',');
            out.unknownWords = J.rows('remembered').filter((x, i, all) => x.kind === 'unknown' && all.slice(0, i).filter(y => y.kind === 'header').length === 1).length;
            out.wailed = J.wailed('remember');
            // the Body: from Story 60; an ingredient counts while the party holds its key item
            $gameVariables.setValue(5, 50); out.bodyBefore = J.bodyOpen();
            $gameVariables.setValue(5, 60); out.bodyAfter = J.bodyOpen() && J.rows('quests')[0].kind === 'body';
            const parts = $dataJournal.body;
            out.bone = J.bodyHas(parts[0]); out.pearlBefore = J.bodyHas(parts[7]);
            $gameParty.gainItem($dataItems[725], 1); out.pearlAfter = J.bodyHas(parts[7]);
            // margin notes: members who've been in the party
            out.met = J.hasMet(4) + '/' + J.hasMet(9);
            return out;
        });
        t.ok(r.data, 'Journal.json loads with the database');
        t.eq(r.emptyQuests, 'empty', 'no quests yet');
        t.eq(r.notice, 'New quest: Mouth-words', 'a new quest gives one notice');
        t.eq(r.step, 2, 'a quest steps on');
        t.eq(r.quests, 'header,quest:now,header,quest:done', 'Now and Done sections');
        t.eq(r.missed, 'missed/missed/done', "a giver's open quests go to Missed; done ones stay done");
        t.eq(r.tabsBefore, 'quests,remembered', 'no Evidence tab until it opens');
        t.eq(r.evidence, 1, 'a clue adds 1 to the evidence count, once');
        t.eq(r.tabsAfter, 'quests,evidence,remembered', 'the first clue opens Evidence');
        t.ok(r.clueRows === 1 && r.unknownClues > 3, 'unfound clues show as ???');
        t.eq(r.said, 1, 'a word remembers how it was first said');
        t.eq(r.words, 1, 'the Words variable counts known words');
        t.eq(r.wordRows, 'bones', 'known words by name...');
        t.eq(r.unknownWords, 12, '...the rest as ???');
        t.eq(r.wailed, 'REEEEEMEMBER.', 'a wailed word');
        t.ok(!r.bodyBefore && r.bodyAfter, 'The Body shows from Story 60, first in Quests');
        t.ok(r.bone, 'the bone counts from Story 60');
        t.ok(!r.pearlBefore && r.pearlAfter, 'an ingredient counts once the party holds it');
        t.eq(r.met, 'true/false', 'party members who have been in the party are remembered');
    },

    'memory: the screen, the menu command, J and the notices': async (h, t) => {
        await h.newGame();
        await h.eval(() => {
            const J = SmokingIsle.Journal;
            $gameVariables.setValue(5, 60);
            J.quest('words'); J.quest('pearl'); J.miss('pearl'); J.complete('words'); J.quest('who');
            J.clue('skull'); J.clue('staff'); J.clue('ball');
            J.learnWord('bones', 0); J.learnWord('rock', 1); J.learnWord('down', 2);
        });
        // a notice shows on the map
        await h.page.waitForTimeout(800);
        const notice = await h.eval(() => SceneManager._scene._siNoticeWindow && SceneManager._scene._siNoticeWindow._text);
        // J opens Memory
        await h.eval(() => { $gameTemp._siJournalNotices = []; });
        await h.page.keyboard.press('j');
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Memory && SceneManager._sceneStarted, null, { timeout: 10000 });
        // draw every row of every tab (catches drawing errors)
        const drawn = await h.eval(() => {
            const s = SceneManager._scene, out = {};
            SmokingIsle.Journal.tabs().forEach((tab, ti) => {
                s._tabIndex = ti; s.showTab();
                const n = s._list.maxItems();
                for (let i = 0; i < n; i++) { s._list.select(i); s._list.updateHelp(); }
                out[tab[0]] = n;
            });
            s._tabIndex = 1; s.showTab();
            const staff = s._list._rows.findIndex(r => r.id === 'staff'); s._list.select(staff); s._list.updateHelp();
            out.fits = true;
            return out;
        });
        await h.page.keyboard.press('j');
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted, null, { timeout: 10000 });
        const menu = await h.eval(() => { const w = new Window_MenuCommand(0, 0); return w._list.some(c => c.symbol === 'siMemory' && c.name === 'Memory'); });
        t.eq(notice, 'New quest: Mouth-words', 'notices show in the corner, one after another');
        t.ok(drawn.quests >= 5 && drawn.evidence > 5 && drawn.remembered > 10, 'every tab draws: ' + JSON.stringify(drawn));
        t.ok(menu, 'a Memory command in the main menu');
        t.ok(true, 'J opens Memory and closes it again');
    }
};
