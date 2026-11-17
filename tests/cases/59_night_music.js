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
    'story music: <Story BGM> plays other music early in the story': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const N = SmokingIsle.NightMusic, T = SmokingIsle.Time, out = {}, calls = [];
            const AM = AudioManager, keep = { play: AM.playBgm, out: AM.fadeOutBgm, in: AM.fadeInBgm };
            AM.playBgm = function(bgm) { calls.push('play ' + bgm.name); this._currentBgm = { name: bgm.name }; };
            AM.fadeOutBgm = function() { calls.push('fade out'); this._currentBgm = null; };
            AM.fadeInBgm = function() { calls.push('fade in'); };
            const take = () => calls.splice(0).join(', ');
            const settle = () => { for (let i = 0; i < 400; i++) N.update(); };
            const note = $dataMap.note, auto = $dataMap.autoplayBgm, bgm = $dataMap.bgm, story = $gameVariables.value(5);
            $dataMap.autoplayBgm = true; $dataMap.bgm = { name: 'Zonfahare', volume: 90, pitch: 100, pan: 0 };
            $dataMap.note = '<Story BGM: Unseen, 50>';
            $gameVariables.setValue(5, 30);
            T.state().period = 1; $gameMap.autoplay(); out.act1Day = take();
            T.state().period = 3; settle(); out.act1Night = take();
            $gameVariables.setValue(5, 50); settle(); out.act2Night = take();
            T.state().period = 1; settle(); out.act2Day = take();
            // two notes: the lowest the story hasn't reached wins
            $dataMap.note = '<Story BGM: Eyot_Grieving, 50><Story BGM: Grief, 30>';
            $gameVariables.setValue(5, 10); $gameMap.autoplay(); out.first = take();
            $gameVariables.setValue(5, 40); $gameMap.autoplay(); out.second = take();
            AM.playBgm = keep.play; AM.fadeOutBgm = keep.out; AM.fadeInBgm = keep.in; AM._currentBgm = null;
            $dataMap.note = note; $dataMap.autoplayBgm = auto; $dataMap.bgm = bgm; $gameVariables.setValue(5, story); T.state().period = 1;
            return out;
        });
        t.eq(r.act1Day, 'play Unseen', 'in Act 1 (Story 30) the town plays Unseen');
        t.eq(r.act1Night, '', '... at night too (the night swap waits for Act 2)');
        t.eq(r.act2Night, 'fade out, play Zonfahare_Night, fade in', 'when the story reaches 50, it fades to the town\'s own music (here, its night version)');
        t.eq(r.act2Day, 'fade out, play Zonfahare, fade in', 'and by day, the town\'s day track');
        t.eq(r.first, 'play Grief', 'with two notes, the lowest unreached one plays');
        t.eq(r.second, 'play Eyot_Grieving', '... then the next');
    },
    'drift: <Drift BGM> fades a second track in across the map, and crossfade()': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const N = SmokingIsle.NightMusic, out = {}, made = [];
            const AM = AudioManager, keep = { create: AM.createBuffer, play: AM.playBgm, inn: AM.fadeInBgm, stop: AM.stopBgm, upd: AM.updateBgmParameters };
            const fake = (name) => ({ name, volume: 1, playing: false, faded: 0, play() { this.playing = true; }, stop() { this.playing = false; }, fadeOut(s) { this.faded = s; }, fadeIn() {}, seek() { return 0; } });
            AM.createBuffer = (folder, name) => { const b = fake(name); made.push(b); return b; };
            AM.playBgm = function(bgm) { if (!(this._currentBgm && this._currentBgm.name === bgm.name && this._bgmBuffer)) this._bgmBuffer = fake(bgm.name); this._currentBgm = { name: bgm.name, volume: bgm.volume }; this.updateBgmParameters(bgm); };
            AM.fadeInBgm = function(s) { out.fadeIn = s; };
            AM.stopBgm = function() { this._currentBgm = null; this._bgmBuffer = null; };
            AM.updateBgmParameters = function(bgm) { if (this._bgmBuffer) this._bgmBuffer.volume = this._bgmVolume * bgm.volume / 10000; };
            const vol = AM._bgmVolume; AM._bgmVolume = 100;
            const note = $dataMap.note, auto = $dataMap.autoplayBgm, bgm = $dataMap.bgm, story = $gameVariables.value(5), y = $gamePlayer._realY;
            $dataMap.autoplayBgm = true; $dataMap.bgm = { name: 'Lava_Tube_Country', volume: 80, pitch: 100, pan: 0 };
            $dataMap.note = '<Drift BGM: Grief, 40-10, until 50>'; $gameVariables.setValue(5, 0);
            AM.playBgm($dataMap.bgm); const main = AM._bgmBuffer;
            const at = (row) => { $gamePlayer._realY = row; N.updateDrift(); return [main.volume.toFixed(2), N.drift ? N.drift.buffer.volume.toFixed(2) : '-'].join('/'); };
            out.below = at(50); out.start = at(40); out.half = at(25); out.top = at(10);
            out.oneBuffer = made.length;
            out.back = at(45); out.stopped = made[0].faded + '/' + !N.drift;
            out.again = at(10);
            $gameVariables.setValue(5, 50); out.later = at(10);
            // walking off the top into a map that plays Grief: it carries straight on
            $gameVariables.setValue(5, 0); at(10); const g = N.drift.buffer;
            $dataMap.note = ''; $dataMap.bgm = { name: 'Grief', volume: 80, pitch: 100, pan: 0 };
            $gameMap.autoplay(); out.carry = (AM._bgmBuffer === g) + '/' + AM._currentBgm.name + '/' + g.volume.toFixed(2) + '/' + !N.drift;
            // a battle stops the drift (the area's music is what comes back)
            $dataMap.note = '<Drift BGM: Grief, 40-10>'; $dataMap.bgm = { name: 'Lava_Tube_Country', volume: 80, pitch: 100, pan: 0 };
            AM.playBgm($dataMap.bgm); at(20); const d = N.drift.buffer;
            BattleManager.saveBgmAndBgs(); out.battle = !d.playing + '/' + !N.drift + '/' + BattleManager._mapBgm.name;
            // a map with no music of its own: it rises out of silence
            AM.stopBgm(); $dataMap.note = '<Drift BGM: Grief, 40-10>'; $gamePlayer._realY = 25; N.updateDrift();
            out.silence = N.drift.buffer.volume.toFixed(2); N.stopDrift(0);
            // the script call: the old track fades out while the new one fades in
            $dataMap.note = ''; AM.playBgm({ name: 'Zonfahare', volume: 90 }); const old = AM._bgmBuffer;
            N.crossfade('Grief', 4); out.cross = old.faded + '/' + AM._currentBgm.name + '/' + AM._currentBgm.volume + '/' + out.fadeIn;
            Object.assign(AM, { createBuffer: keep.create, playBgm: keep.play, fadeInBgm: keep.inn, stopBgm: keep.stop, updateBgmParameters: keep.upd });
            AM._bgmVolume = vol; AM._currentBgm = null; AM._bgmBuffer = null; N.drift = null;
            $dataMap.note = note; $dataMap.autoplayBgm = auto; $dataMap.bgm = bgm; $gameVariables.setValue(5, story); $gamePlayer._realY = y;
            return out;
        });
        t.eq(r.below, '0.80/-', 'below the drift, only the map\'s music');
        t.eq(r.start, '0.80/-', 'at the "from" row, still none of it');
        t.eq(r.half, '0.57/0.57', 'halfway, both at once (an even crossfade)');
        t.eq(r.top, '0.00/0.80', 'at the "to" row, only the drift track');
        t.eq(r.oneBuffer, 1, 'the drift track is started once, not every step');
        t.eq(r.back, '0.80/-', 'walking back down, the map\'s music comes back');
        t.eq(r.stopped, '0.5/true', '... and the drift track fades away');
        t.eq(r.again, '0.00/0.80', 'it drifts in again going back up');
        t.eq(r.later, '0.80/-', '"until 50": later in the story there is no drift');
        t.eq(r.carry, 'true/Grief/0.80/true', 'into a map that plays Grief, the drift carries straight on at full volume');
        t.eq(r.battle, 'true/true/Lava_Tube_Country', 'a battle stops the drift and comes back to the area\'s music');
        t.eq(r.silence, '0.64', 'on a map with no music, it rises out of silence');
        t.eq(r.cross, '4/Grief/90/4', 'crossfade(\'Grief\', 4): the old track fades out as Grief fades in, over 4 seconds');
    },
};
