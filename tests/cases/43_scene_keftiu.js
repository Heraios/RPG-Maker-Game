// Scene: Keftiu (common event 13): Parl's lines play only when he's in the party, and each of Yoon's
// three answers gets its own replies.

module.exports = {
    'Keftiu scene, with and without Parl': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const run = (parl, pick) => {
                if (parl) $gameParty.addActor(8); else $gameParty.removeActor(8);
                const text = [], i = new Game_Interpreter();
                i.setup($dataCommonEvents[13].list);
                for (let n = 0; n < 2000 && i.isRunning(); n++) {
                    if ($gameMessage.isChoice()) $gameMessage.onChoice(pick);
                    text.push(...$gameMessage._texts);
                    $gameMessage.clear();
                    i.update();
                }
                return { done: !i.isRunning(), text: text.join('\n') };
            };
            return [run(true, 0), run(false, 0), run(true, 2), run(false, 2), run(false, 1)];
        });
        const [withP, without, withP2, without2, funny] = r;
        r.forEach((x, n) => t.ok(x.done, 'run ' + n + ' finishes'));
        t.ok(withP.text.includes('\\N[8]:'), 'Parl speaks when he is in the party');
        t.ok(!without.text.includes('\\N[8]:'), 'and not when he isn\'t');
        t.ok(without.text.includes("Our spies' reports"), 'without Parl, Thenmy confesses the reports');
        t.ok(withP.text.includes('47,042'), 'the scribes\' count');
        t.ok(withP.text.includes('every street'), 'sweet answer');
        t.ok(funny.text.includes("It's the pelt."), 'funny answer');
        t.ok(withP2.text.includes('Someone write that down.') && !without2.text.includes('Someone write that down.'), 'uncanny answer, Parl\'s aside only with Parl');
    },
};
