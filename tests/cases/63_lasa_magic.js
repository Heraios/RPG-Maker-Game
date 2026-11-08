// Lasa's own skills: Steal and Prank (innate), and the field spells Pura, Tikea and Garo (SI_FieldMagic).
// Also: the Status screen's profile wraps; Lasa turns to the Ghost after dropping in.

module.exports = {
    'Lasa: Steal and Prank in battle': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = {}, lasa = $gameActors.actor(4), foe = $gameTroop.members()[0];
            const P = SmokingIsle.Pranks, data = foe.enemy(), note = data.note, real = Math.random;
            const use = (name, target) => { const a = new Game_Action(lasa); a.setSkill($dataSkills.find(s => s && s.name === name).id); target.clearResult(); a.apply(target); };
            // Steal: something it carries (added for the test), once
            const drops = data.dropItems; data.dropItems = []; data.note = note + '\n<Steal: item 6>';   // only the test item to take
            $gameParty.loseItem($dataItems[6], 999);   // Battle Test fills the bag to the maximum
            const before = $gameParty.numItems($dataItems[6]), mood0 = foe.talkMood();
            Math.random = () => 0;
            use('Steal', foe);
            out.stole = $gameParty.numItems($dataItems[6]) - before;
            out.msg = (foe._siPrankMessages || []).slice(-1)[0];
            out.sour = mood0 - foe.talkMood();
            use('Steal', foe); out.again = foe._siPrankMessages.slice(-1)[0];
            // <No Steal>
            const foe2 = $gameTroop.members()[1] || foe; foe2._siStolenFrom = false; data.note = note + '\n<No Steal>';
            use('Steal', foe2); out.noSteal = foe2._siPrankMessages.slice(-1)[0];
            data.note = note; data.dropItems = drops;
            // Prank: Endurance down, and it may panic
            use('Prank', foe);
            out.prank = foe._buffs[3] + '/' + foe.isStateAffected(156);
            Math.random = real;
            out.innate = ['Prank', 'Steal'].map(n => $dataSkills.find(s => s && s.name === n).stypeId).join(',');
            return out;
        });
        t.eq(r.stole, 1, 'Steal takes something the enemy carries');
        t.ok(/steals/.test(r.msg), 'the log says so: ' + r.msg);
        t.eq(r.sour, 15, 'being robbed sours its Talk mood');
        t.ok(/nothing left to steal/.test(r.again), 'once per enemy');
        t.ok(/nothing to steal/.test(r.noSteal), '<No Steal>: nothing to take');
        t.eq(r.prank, '-1/true', 'Prank: Endurance down, and panic');
        t.eq(r.innate, '6,6', 'Prank and Steal are innate skills, not spells');
    },

    'Lasa: field spells, her start, the profile and her turn': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const F = SmokingIsle.FieldMagic, T = SmokingIsle.Time, out = {};
            const lasa = $gameActors.actor(4);
            lasa.initSkills && (lasa._skills = [], lasa.initSkills());
            const names = lasa.skills().map(s => s.name);
            out.start = ['Keri', 'Mahu', 'Kami', 'Keva', 'Gau', 'Prank', 'Steal'].every(n => names.includes(n)) && !['Pura', 'Tikea', 'Garo', 'Raau'].some(n => names.includes(n));
            // Pura: a light
            T.state().light = 0; F.pura(); out.light = T.state().light;
            // Garo: wanderers don't see the party; it wears off with steps
            const boar = $gameMap.events().find(e => e.wanderer && e.wanderer());
            boar.locate(8, 11); boar.setDirection(8); $gamePlayer.locate(8, 9);
            const sees = boar.canSeeParty();
            F.garo(); out.garo = sees + '/' + boar.canSeeParty();
            for (let i = 0; i < F.garoSteps; i++) $gameParty.increaseSteps();
            out.garoEnds = boar.canSeeParty();
            // Tikea: secrets are hidden until revealed, within range
            const evs = $gameMap.events().filter(e => !e.wanderer || !e.wanderer());
            const near = evs.find(e => Math.abs(e.x - 8) + Math.abs(e.y - 9) <= 3), far = evs.find(e => Math.abs(e.x - 8) + Math.abs(e.y - 9) > F.tikeaRange);
            near._siSecret = true; far._siSecret = true;
            out.hidden = near.isTransparent() + '/' + near.isThrough();
            out.found = F.tikea();
            out.revealed = !near.isTransparent() + '/' + far.isTransparent();
            // the field spells: from the menu, through common events
            out.menu = ['Pura', 'Tikea'].map(n => { const s = $dataSkills.find(x => x && x.name === n); return s.occasion + ':' + s.effects[0].dataId; }).join(',');
            const garo = $dataSkills.find(x => x && x.name === 'Garo');
            out.garoBoth = garo.occasion + ':' + garo.effects.some(e => e.code === 44 && e.dataId === 21);
            // the Status profile wraps inside the window
            const w = new Window_Status(); w.setActor(lasa);
            const lines = SmokingIsle.Screen.wrap(w, lasa.profile(), w.contentsWidth() - 6);
            out.wrap = lines.length + '/' + lines.every(l => w.textWidth(l) <= w.contentsWidth() - 6);
            return out;
        });
        const turn = await h.eval(() => {
            const xhr = new XMLHttpRequest(); xhr.open('GET', 'data/Map006.json', false); xhr.send();
            const ev = JSON.parse(xhr.responseText).events.find(e => e && e.id === 46);
            return ev.pages.some(p => p.list.some(c => c.code === 205 && c.parameters[1].list.some(m => m.code === 14) && c.parameters[1].list.some(m => m.code === 25)));
        });
        t.ok(r.start, 'Lasa starts with Keri, Mahu, Kami, Keva, Gau, Prank and Steal (Pura, Tikea, Garo come through story)');
        t.eq(r.light, 200, 'Pura: a light for 200 steps');
        t.eq(r.garo, 'true/false', 'Garo: wandering enemies stop noticing the party');
        t.eq(r.garoEnds, true, '...until it wears off');
        t.eq(r.hidden, 'true/true', 'a secret is hidden and walk-through');
        t.ok(r.found >= 1, 'Tikea reveals what is near (' + r.found + ')');
        t.eq(r.revealed, 'true/true', '...but not what is far');
        t.eq(r.menu, '2:19,2:20', 'Pura and Tikea are used from the menu (common events 19, 20)');
        t.eq(r.garoBoth, '0:true', 'Garo works in battle and from the menu (common event 21)');
        t.ok(/^[2-4]\/true$/.test(r.wrap), 'the Status profile wraps inside the window: ' + r.wrap);
        t.ok(turn, 'Lasa turns to the Ghost after dropping in');
    }
};
