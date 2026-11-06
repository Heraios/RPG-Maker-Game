// Night music (SI_NightMusic): a map's day track swaps for its night version at night, fading across.
const fs = require('fs'), path = require('path');

module.exports = {
    'night music': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const N = SmokingIsle.NightMusic, T = SmokingIsle.Time, out = {}, calls = [];
            const AM = AudioManager, keep = { play: AM.playBgm, out: AM.fadeOutBgm, in: AM.fadeInBgm };
            AM.playBgm = function(bgm) { calls.push('play ' + bgm.name + ' ' + bgm.volume); this._currentBgm = { name: bgm.name }; };
            AM.fadeOutBgm = function() { calls.push('fade out'); this._currentBgm = null; };
            AM.fadeInBgm = function() { calls.push('fade in'); };
            const take = () => calls.splice(0).join(', ');
            const settle = () => { for (let i = 0; i < 400; i++) N.update(); };
            const note = $dataMap.note, auto = $dataMap.autoplayBgm, bgm = $dataMap.bgm;
            $dataMap.autoplayBgm = true; $dataMap.bgm = { name: 'Grasslands', volume: 80, pitch: 100, pan: 0 }; $dataMap.note = '';
            // entering by day, and by night
            T.state().period = 1; $gameMap.autoplay(); out.enterDay = take();
            T.state().period = 3; $gameMap.autoplay(); out.enterNight = take();
            // night falls while on the map: fade out, then the night track fades in
            T.state().period = 2; $gameMap.autoplay(); take();
            T.state().period = 3; N.update(); out.fall = take();
            settle(); out.fallEnd = take();
            // dawn: back to the day track
            T.state().period = 0; settle(); out.dawn = take();
            // dusk doesn't count as night (Night Periods: 3)
            T.state().period = 2; settle(); out.dusk = take();
            // an event's music is left alone
            T.state().period = 1; $gameMap.autoplay(); take();
            AM._currentBgm = { name: 'Grief' };
            T.state().period = 3; settle(); out.cutscene = take();
            // map notes
            $dataMap.note = '<Night BGM: none>'; $gameMap.autoplay(); out.none = take();
            $dataMap.note = '<Night BGM: Shrine>'; $gameMap.autoplay(); out.custom = take();
            // a track with no night version
            $dataMap.note = ''; $dataMap.bgm = { name: 'Lava_Tubes', volume: 90, pitch: 100, pan: 0 }; $gameMap.autoplay(); out.noNight = take();
            // a battle in the middle of the fade comes back to the night track, not silence
            $dataMap.bgm = { name: 'Grasslands', volume: 80, pitch: 100, pan: 0 };
            T.state().period = 1; $gameMap.autoplay(); take();
            T.state().period = 3; N.update(); BattleManager.saveBgmAndBgs(); out.battle = BattleManager._mapBgm.name + '/' + !!N.pending;
            out.tracks = N.tracks;
            AM.playBgm = keep.play; AM.fadeOutBgm = keep.out; AM.fadeInBgm = keep.in; AM._currentBgm = null;
            $dataMap.note = note; $dataMap.autoplayBgm = auto; $dataMap.bgm = bgm; T.state().period = 1;
            return out;
        });
        t.eq(r.enterDay, 'play Grasslands 80', 'by day a map plays its own track');
        t.eq(r.enterNight, 'play Grasslands_Night 80', 'at night it plays the night version, at the map\'s volume');
        t.eq(r.fall, 'fade out', 'when night falls on the map, the day track fades out');
        t.eq(r.fallEnd, 'play Grasslands_Night 80, fade in', '... and the night track fades in');
        t.eq(r.dawn, 'fade out, play Grasslands 80, fade in', 'at dawn it goes back to the day track');
        t.eq(r.dusk, '', 'dusk keeps the day track');
        t.eq(r.cutscene, '', 'music an event started is left alone');
        t.eq(r.none, 'play Grasslands 80', '<Night BGM: none> keeps the day track at night');
        t.eq(r.custom, 'play Shrine 80', '<Night BGM: Shrine> plays that instead at night');
        t.eq(r.noNight, 'play Lava_Tubes 90', 'a track without a night version plays at night too');
        t.eq(r.battle, 'Grasslands_Night/false', 'a battle mid-fade comes back to the night track');
        const bgm = path.join(__dirname, '..', '..', 'Smoking Isle', 'audio', 'bgm');
        const missing = r.tracks.filter(n => !['.ogg', '.m4a'].every(x => fs.existsSync(path.join(bgm, n + '_Night' + x))));
        t.eq(missing.join(', '), '', 'every night version is in audio/bgm (.ogg and .m4a)');
    },
};
