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
            // an area with its own battle theme: the map's music decides (day or night); Seafarers and bosses still win
            const auto = $dataMap.autoplayBgm, bgm = $dataMap.bgm;
            $dataMap.autoplayBgm = true; $dataMap.bgm = { name: 'Salt_Marsh', volume: 90, pitch: 100, pan: 0 };
            out.area = [1, 39, 14, 30].map(pick).join(' ');
            $dataMap.bgm = { name: 'Salt_Marsh_Night', volume: 90, pitch: 100, pan: 0 }; out.areaNight = pick(63);
            $dataMap.bgm = { name: 'Lava_Tubes', volume: 90, pitch: 100, pan: 0 }; out.tubes = pick(8) + ' ' + pick(20);
            $dataMap.bgm = { name: 'Lava_Tube_Country_Night', volume: 90, pitch: 100, pan: 0 }; out.country = pick(1);
            $dataMap.bgm = { name: 'Zonfahare', volume: 90, pitch: 100, pan: 0 }; out.noArea = pick(39);
            $dataMap.autoplayBgm = auto; $dataMap.bgm = bgm;
            let swoosh = 0; const keepSe = AudioManager.playStaticSe; AudioManager.playStaticSe = () => { swoosh++; };
            SoundManager.playBattleStart(); AudioManager.playStaticSe = keepSe; out.swoosh = swoosh;
            // leaving the field: the field music fades (not a dead stop), the battle track starts at once
            const auto2 = $dataMap.autoplayBgm, bgm2 = $dataMap.bgm, AM = AudioManager, log = [];
            $dataMap.autoplayBgm = true; $dataMap.bgm = { name: 'Salt_Marsh', volume: 90, pitch: 100, pan: 0 };
            $gameTroop.setup(1);
            const keepPlay = AM.playBgm, keepStop = AM.stopBgm;
            AM._bgmBuffer = { fadeOut: s => log.push('fade ' + s), stop: () => log.push('stopped'), seek: () => 12.5, isPlaying: () => true };
            AM._currentBgm = { name: 'Salt_Marsh', volume: 90, pitch: 100, pan: 0 };
            AM.playBgm = bgm => { log.push('play ' + bgm.name); };
            AM.stopBgm = function() { if (this._bgmBuffer) log.push('dead stop'); this._bgmBuffer = null; this._currentBgm = null; };
            Scene_Map.prototype.stopAudioOnBattleStart.call({});
            AM.playBgm = keepPlay; AM.stopBgm = keepStop; AM._bgmBuffer = null; AM._currentBgm = null;
            out.contact = log.join(', ');
            $dataMap.autoplayBgm = auto2; $dataMap.bgm = bgm2;
            // ordinary fights end on the short victory, bosses (and an event's choice) on the full one
            $gameTroop.setup(1); out.winWild = M.victoryMe().name;
            $gameTroop.setup(27); out.winBoss = M.victoryMe().name;
            $gameSystem.setVictoryMe({ name: 'Item_Isle', volume: 90, pitch: 100, pan: 0 });
            $gameTroop.setup(1); out.winEvent = M.victoryMe().name;
            $gameSystem.setVictoryMe($dataSystem.victoryMe);
            out.shortVictory = M.shortVictory;
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
            out.tracks = Object.values(M.bosses).concat(M.rules.map(x => x.track), M.factions.map(x => x.track), M.areas.map(a => 'Battle_' + a), [$dataSystem.battleBgm.name]);
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
        t.eq(r.area, 'Battle_Salt_Marsh Battle_Salt_Marsh Battle_Seafarers Boss_Parl', 'in the salt marsh: boars and Hags fight to the marsh\'s battle theme; marines and bosses keep theirs');
        t.eq(r.areaNight, 'Battle_Salt_Marsh', 'the night version of the area counts too');
        t.eq(r.tubes, 'Battle_Lava_Tubes Battle_Lava_Tubes', 'in the lava tubes, the Children of the Caves and the bats alike fight to the tubes\' theme');
        t.eq(r.country, 'Battle_Lava_Tube_Country', 'the lava-tube country has its own (by night too)');
        t.eq(r.noArea, 'Battle_Ancients', 'a map with no area battle theme falls back to the enemy kind');
        t.eq(r.swoosh, 0, 'the battle-start sound effect is muted (the track\'s jingle replaces it)');
        t.eq(r.contact, 'fade 0.25, play Battle_Salt_Marsh', 'the field music fades over a quarter second and the battle track starts at once');
        t.eq(r.winWild + ' / ' + r.winBoss, 'Victory_Short / Victory_Isle', 'ordinary fights end on the short victory jingle, bosses on the full one');
        t.eq(r.winEvent, 'Item_Isle', 'a victory jingle an event chose wins');
        t.ok(['.ogg', '.m4a'].every(x => fs.existsSync(path.join(__dirname, '..', '..', 'Smoking Isle', 'audio', 'me', r.shortVictory + x))), 'the short victory jingle is in audio/me');
        const bgm = path.join(__dirname, '..', '..', 'Smoking Isle', 'audio', 'bgm');
        const missing = [...new Set(r.tracks)].filter(n => !['.ogg', '.m4a'].every(x => fs.existsSync(path.join(bgm, n + x))));
        t.eq(missing.join(', '), '', 'every battle track is in audio/bgm (.ogg and .m4a)');
    },
};
