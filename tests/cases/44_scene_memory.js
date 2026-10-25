// Scene: Jogging Yoon's Memory (common event 14): each gender gets its own keepsake and first-hunt story,
// and each of Yoon's answers its own reply.

module.exports = {
    'memory scene, by gender and answer': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const w = new Window_Base(0, 0, 100, 100);
            const run = (g, pick) => {
                SmokingIsle.Yoon.setGender(g);
                const text = [], i = new Game_Interpreter();
                i.setup($dataCommonEvents[14].list);
                for (let n = 0; n < 2000 && i.isRunning(); n++) {
                    if ($gameMessage.isChoice()) $gameMessage.onChoice(pick);
                    text.push(...$gameMessage._texts.map(s => w.convertEscapeCharacters(s)));
                    $gameMessage.clear();
                    i.update();
                }
                return { done: !i.isRunning(), text: text.join(' ') };
            };
            return [run(1, 0), run(2, 1), run(3, 2), run(0, 0)];
        });
        const [boy, girl, third, unset] = r;
        r.forEach((x, n) => t.ok(x.done, 'run ' + n + ' finishes'));
        t.ok(boy.text.includes('goat-hair sling') && boy.text.includes("boar's tusk") && boy.text.includes('his guardian'), 'boy: sling, tusk, his');
        t.ok(girl.text.includes('jar of leeches') && girl.text.includes('rabbit') && girl.text.includes('her guardian'), 'girl: leeches, rabbit, her');
        t.ok(third.text.includes('gourd rattle') && third.text.includes('entrails') && third.text.includes('their guardian'), 'third: rattle, entrails, their');
        t.ok(unset.text.includes('gourd rattle') && !unset.text.includes('rabbit') && !unset.text.includes('tusk'), 'not chosen counts as third, one story only');
        t.ok(boy.text.includes('enough for both of us') && girl.text.includes("I've told everyone!") && third.text.includes('hand on Yoon'), 'each answer gets its reply');
        t.ok(boy.text.includes('Master Juda burns it'), 'the incense clue');
    },
};
