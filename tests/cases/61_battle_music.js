// Battle music (SI_BattleMusic): bosses play their themes; other fights by what the party is fighting.
const fs = require('fs'), path = require('path');

module.exports = {
    'battle music': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const M = SmokingIsle.BattleMusic, out = {};
            const pick = id => { $gameTroop.setup(id); return M.choose(); };
            out.troops = {};
            [1, 8, 9, 11, 14, 22, 39, 40, 26, 27, 29, 30].forEach(id => { out.troops[id] = pick(id); });
            // a map note changes the ordinary fights, not the bosses
            const note = $dataMap.note;
            $dataMap.note = '<Battle BGM: Battle_Spirits>';
            out.noteWild = pick(1); out.noteBoss = pick(30);
            $dataMap.note = note;
            // an event's own choice wins
            $gameSystem.setBattleBgm({ name: 'Grief', volume: 90, pitch: 100, pan: 0 });
            out.event = pick(30);
            $gameSystem.setBattleBgm($dataSystem.battleBgm);
            // and it really plays (at the database's volume)
            const keep = AudioManager.playBgm; let played = null;
            AudioManager.playBgm = bgm => { played = bgm.name + ' ' + bgm.volume; };
            $gameTroop.setup(39); BattleManager.playBattleBgm();
            AudioManager.playBgm = keep;
            out.played = played; out.volume = $dataSystem.battleBgm.volume;
            out.tracks = Object.values(M.bosses).concat(M.rules.map(x => x.track), [$dataSystem.battleBgm.name]);
            return out;
        });
        const T = r.troops;
        t.eq(T[1], 'Battle_Wild', 'wild boars: Battle_Wild');
        t.eq(T[8], 'Battle_Spirits', 'the Children of the Caves (fae): Battle_Spirits');
        t.eq(T[9], 'Battle_Spirits', 'forest imps: Battle_Spirits');
        t.eq(T[22], 'Battle_Spirits', 'restless bones (spirits): Battle_Spirits');
        t.eq(T[11], 'Battle_Ancients', 'the Owls of Ill Omen: Battle_Ancients');
        t.eq(T[39], 'Battle_Ancients', 'Marsh Hags (First Sailor remnants): Battle_Ancients');
        t.eq(T[40], 'Battle_Ancients', 'Stonemen: Battle_Ancients');
        t.eq(T[14], 'Battle_Seafarers', 'All-Seafarer marines: Battle_Seafarers');
        t.eq(T[26], 'Boss_Daughter_Wells', 'boss: the Daughter of the Wells');
        t.eq(T[27], 'Boss_Great_Boar', 'boss: the Great Boar');
        t.eq(T[29], 'Boss_Lady_Woods', 'boss: the Lady of the Woods');
        t.eq(T[30], 'Boss_Parl', 'boss: Parl');
        t.eq(r.noteWild + '/' + r.noteBoss, 'Battle_Spirits/Boss_Parl', 'a <Battle BGM> map note changes ordinary fights, not bosses');
        t.eq(r.event, 'Grief', 'music an event chose for the battle wins');
        t.eq(r.played, 'Battle_Ancients ' + r.volume, 'the battle really plays it, at the database volume');
        const bgm = path.join(__dirname, '..', '..', 'Smoking Isle', 'audio', 'bgm');
        const missing = [...new Set(r.tracks)].filter(n => !['.ogg', '.m4a'].every(x => fs.existsSync(path.join(bgm, n + x))));
        t.eq(missing.join(', '), '', 'every battle track is in audio/bgm (.ogg and .m4a)');
    },
};
