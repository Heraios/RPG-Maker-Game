//=============================================================================
// SI_NightMusic.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: night music. At night a map's music switches to its
 * night version (Zonfahare -> Zonfahare_Night), fading across, and back by day;
 * and <Story BGM> notes give a map other music early in the story.
 * @author Smoking Isle
 *
 * @param Night Tracks
 * @desc Tracks that have a night version, named the same with _Night on the
 * end (in audio/bgm). A map playing one of these switches at night.
 * @default Zonfahare, Mansehare, Aguerekeu, Laurel_Forest, Grasslands, Salt_Marsh, Beach, Eyot, Idekeu, Chafakeu, Alpine_Forest, Lava_Tube_Country, Afarohare, Namethare, Celhare, Tabonakeu, Corajakeu, Tacandakeu
 *
 * @param Night Periods
 * @desc Which periods count as night for the music (0 Dawn, 1 Day, 2 Dusk,
 * 3 Night). "2, 3" would switch at dusk too.
 * @default 3
 *
 * @param Story Variable
 * @desc The variable that holds the story's progress, for <Story BGM> map notes.
 * @default 5
 *
 * @param Fade Seconds
 * @desc When night falls (or day breaks) on a map: seconds for the old track
 * to fade out, and again for the new one to fade in.
 * @default 3
 *
 * @help
 * Place after SI_Time.
 *
 * Nothing to set up on the maps: give a map its day track as usual (the map's
 * "Autoplay BGM", for example Grasslands). If that track is in Night Tracks,
 * the map plays its night version (Grasslands_Night) at night instead:
 *   - entering the map at night starts the night version straight away;
 *   - if night falls while you are on the map (walking, a battle, an event
 *     that calls SmokingIsle.Time.setPeriod), the day track fades out and the
 *     night one fades in; at dawn it goes back the same way.
 * Volume, pitch and pan are the map's own settings.
 *
 * Music started by an event (a cutscene playing Grief, say) is left alone:
 * the plugin only swaps a map's own day track for its own night track.
 *
 * Map notes:
 *   <Night BGM: Shrine>   at night this map plays Shrine instead (any track)
 *   <Night BGM: none>     this map keeps its day track at night
 *   <Story BGM: Unseen, 50>
 *                         until the Story variable reaches 50, this map plays
 *                         Unseen instead, by day and by night (Act 1's ghost
 *                         in town); after that, its own track and night track.
 *                         A map can have several: the lowest number that the
 *                         story hasn't reached yet wins.
 *   <Drift BGM: Grief, 40-10>
 *   <Drift BGM: Grief, 40-10, until 50>
 *                         a second track drifts in as the player moves across
 *                         the map: at row 40 none of it, at row 10 all of it
 *                         (the map's own music fading out as it fades in), and
 *                         back again going the other way. Rows can run either
 *                         way. "until 50": only while the Story variable is
 *                         below 50. If the next map plays the same track, it
 *                         carries straight on there instead of starting over.
 *                         On a map with no music of its own, it rises out of
 *                         silence. (Map 1's climb: the lament at the top.)
 *
 * Script call, for events:
 *   SmokingIsle.NightMusic.crossfade('Grief', 4)
 *                         fade from whatever is playing into Grief over 4
 *                         seconds, both at once (RPG Maker's own commands can
 *                         only fade out, then start the next track cold).
 *
 * A new night version: add its name (without _Night) to Night Tracks.
 */

var Imported = Imported || {};
Imported.SI_NightMusic = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.NightMusic = SmokingIsle.NightMusic || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_NightMusic');
    var list = function(text) { return String(text || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean); };
    $.tracks = list(params['Night Tracks']);
    $.periods = list(params['Night Periods'] || '3').map(Number);
    $.fadeSeconds = Number(params['Fade Seconds'] || 3);
    $.storyVariable = Number(params['Story Variable'] || 5);
    $.pending = null;                       // a track waiting for the old one to fade out
    $.lastKey = null;                       // the map and day/night we last chose music for

    $.isNightTime = function() {
        return !!SmokingIsle.Time && $.periods.indexOf(SmokingIsle.Time.period()) >= 0;
    };

    // The night version of this map's track, or null if it has none.
    $.nightName = function(bgm) {
        if (!bgm || !bgm.name) return null;
        var m = /<Night BGM:\s*([^>]+)>/i.exec(($dataMap && $dataMap.note) || '');
        if (m) return /^none$/i.test(m[1].trim()) ? null : m[1].trim();
        return $.tracks.indexOf(bgm.name) >= 0 ? bgm.name + '_Night' : null;
    };

    // A <Story BGM: name, n> note the story hasn't passed yet (the lowest n), or null.
    $.storyName = function() {
        var re = /<Story BGM:\s*([^,>]+),\s*(\d+)\s*>/gi, note = ($dataMap && $dataMap.note) || '', m, best = null;
        var story = $.storyVariable ? $gameVariables.value($.storyVariable) : 0;
        while ((m = re.exec(note))) {
            var until = Number(m[2]);
            if (story < until && (!best || until < best.until)) best = { name: m[1].trim(), until: until };
        }
        return best ? best.name : null;
    };

    // What this map should be playing now (null if it has no autoplay music).
    $.mapBgm = function() {
        if (!$dataMap || !$dataMap.autoplayBgm) return null;
        var day = $dataMap.bgm, night = $.nightName(day), early = $.storyName();
        if (early) return { name: early, volume: day.volume, pitch: day.pitch, pan: day.pan };
        if (night && $.isNightTime()) return { name: night, volume: day.volume, pitch: day.pitch, pan: day.pan };
        return day;
    };

    $.key = function() { var want = $.mapBgm(); return $gameMap.mapId() + ':' + (want ? want.name : ''); };

    // Entering a map: play the right version straight away.
    var _Game_Map_autoplay = Game_Map.prototype.autoplay;
    Game_Map.prototype.autoplay = function() {
        var day = $dataMap.bgm, now = $.mapBgm();
        if ($.drift && now && $dataMap.autoplayBgm && now.name === $.drift.name) $.adoptDrift(now);   // it carries on
        else if ($.drift) $.stopDrift(0.5);
        if (now) $dataMap.bgm = now;
        try { _Game_Map_autoplay.call(this); } finally { $dataMap.bgm = day; }
        $.pending = null;
        $.lastKey = $.key();
    };

    //-------------------------------------------------------------------------
    // Drift: a second track fading in across the map (<Drift BGM: name, from-to, until n>)
    //-------------------------------------------------------------------------
    $.drift = null;                         // { name, buffer } while a drift track is playing

    $.driftNote = function() {
        var m = /<Drift BGM:\s*([^,>]+),\s*(\d+)\s*-\s*(\d+)(?:\s*,\s*until\s*(\d+))?\s*>/i.exec(($dataMap && $dataMap.note) || '');
        if (!m) return null;
        if (m[4] && $.storyVariable && $gameVariables.value($.storyVariable) >= Number(m[4])) return null;
        return { name: m[1].trim(), from: Number(m[2]), to: Number(m[3]) };
    };

    // How far into the drift the player is: 0 (none of it) to 1 (all of it).
    $.driftAmount = function(d) {
        var y = $gamePlayer._realY;
        return Math.max(0, Math.min(1, (y - d.from) / (d.to - d.from)));
    };

    $.stopDrift = function(seconds) {
        var d = $.drift;
        $.drift = null;
        if (!d) return;
        if (seconds > 0) { d.buffer.fadeOut(seconds); setTimeout(function() { d.buffer.stop(); }, seconds * 1000 + 50); }
        else d.buffer.stop();
        if (AudioManager._currentBgm && AudioManager._bgmBuffer) AudioManager.updateBgmParameters(AudioManager._currentBgm);
    };

    $.updateDrift = function() {
        var d = $.driftNote(), current = AudioManager._currentBgm;
        var p = d ? $.driftAmount(d) : 0;
        if (!d || p <= 0 || (current && current.name === d.name)) { if ($.drift) $.stopDrift(0.5); return; }
        if (!$.drift || $.drift.name !== d.name) {
            if ($.drift) $.stopDrift(0);
            var buffer = AudioManager.createBuffer('bgm', d.name);
            buffer.volume = 0; buffer.play(true, 0);
            $.drift = { name: d.name, buffer: buffer };
        }
        var volume = current ? current.volume : 90, level = AudioManager._bgmVolume * volume / 10000;
        if (current && AudioManager._bgmBuffer) AudioManager._bgmBuffer.volume = level * Math.cos(p * Math.PI / 2);
        $.drift.buffer.volume = level * Math.sin(p * Math.PI / 2);
        $.drift.volume = volume;
    };

    // Event script call: a true crossfade into another track.
    $.crossfade = function(name, seconds) {
        seconds = Number(seconds || 3);
        var current = AudioManager._currentBgm, old = AudioManager._bgmBuffer;
        if (current && current.name === name) return;
        var bgm = { name: name, volume: current ? current.volume : 90, pitch: 100, pan: 0 };
        if ($.drift && $.drift.name === name) return $.adoptDrift(bgm);
        if (old && current) {
            old.fadeOut(seconds);
            AudioManager._bgmBuffer = null; AudioManager._currentBgm = null;
            setTimeout(function() { old.stop(); }, seconds * 1000 + 50);
        }
        AudioManager.playBgm(bgm);
        AudioManager.fadeInBgm(seconds);
    };

    // The drift track becomes the music proper (carrying straight on, not starting over).
    $.adoptDrift = function(bgm) {
        var d = $.drift;
        $.drift = null;
        AudioManager.stopBgm();
        AudioManager._bgmBuffer = d.buffer;
        AudioManager._currentBgm = { name: bgm.name, volume: bgm.volume, pitch: bgm.pitch, pan: bgm.pan, pos: 0 };
        AudioManager.updateBgmParameters(AudioManager._currentBgm);
    };

    // On the map: when night falls or day breaks, fade from one to the other.
    $.update = function() {
        $.updateDrift();
        if ($.pending) {
            if (--$.pending.wait <= 0) {
                AudioManager.playBgm($.pending.bgm);
                AudioManager.fadeInBgm($.fadeSeconds);
                $.pending = null;
            }
            return;
        }
        var want = $.mapBgm();
        if (!want) return;
        var key = $.key();
        if (key === $.lastKey) return;
        $.lastKey = key;
        var current = AudioManager._currentBgm;
        if (!current || current.name === want.name) return;
        var mine = [$dataMap.bgm.name, $.nightName($dataMap.bgm)];
        var re = /<Story BGM:\s*([^,>]+),/gi, note = $dataMap.note || '', m;
        while ((m = re.exec(note))) mine.push(m[1].trim());
        if (mine.indexOf(current.name) < 0) return;            // an event's music: leave it alone
        AudioManager.fadeOutBgm($.fadeSeconds);
        $.pending = { bgm: want, wait: Math.round($.fadeSeconds * 60) };
    };

    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (this.isActive() && !$gameParty.inBattle()) $.update();
    };

    // A battle or a save in the middle of a fade remembers the new track, not silence.
    var _BattleManager_saveBgmAndBgs = BattleManager.saveBgmAndBgs;
    BattleManager.saveBgmAndBgs = function() {
        if ($.drift) $.stopDrift(0);                         // the area's own music is what comes back after
        _BattleManager_saveBgmAndBgs.call(this);
        if ($.pending) { this._mapBgm = $.pending.bgm; $.pending = null; }
    };

    var _Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        _Game_System_onBeforeSave.call(this);
        if ($.pending) this._bgmOnSave = $.pending.bgm;
    };
})(SmokingIsle.NightMusic);
