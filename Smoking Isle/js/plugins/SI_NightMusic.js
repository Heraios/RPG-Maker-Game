//=============================================================================
// SI_NightMusic.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: night music. At night a map's music switches to its
 * night version (Zonfahare -> Zonfahare_Night), fading across, and back by day.
 * @author Smoking Isle
 *
 * @param Night Tracks
 * @desc Tracks that have a night version, named the same with _Night on the
 * end (in audio/bgm). A map playing one of these switches at night.
 * @default Zonfahare, Mansehare, Aguerekeu, Laurel_Forest, Grasslands, Salt_Marsh
 *
 * @param Night Periods
 * @desc Which periods count as night for the music (0 Dawn, 1 Day, 2 Dusk,
 * 3 Night). "2, 3" would switch at dusk too.
 * @default 3
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

    // What this map should be playing now (null if it has no autoplay music).
    $.mapBgm = function() {
        if (!$dataMap || !$dataMap.autoplayBgm) return null;
        var day = $dataMap.bgm, night = $.nightName(day);
        if (night && $.isNightTime()) return { name: night, volume: day.volume, pitch: day.pitch, pan: day.pan };
        return day;
    };

    $.key = function() { return $gameMap.mapId() + ':' + $.isNightTime(); };

    // Entering a map: play the right version straight away.
    var _Game_Map_autoplay = Game_Map.prototype.autoplay;
    Game_Map.prototype.autoplay = function() {
        var day = $dataMap.bgm, now = $.mapBgm();
        if (now) $dataMap.bgm = now;
        try { _Game_Map_autoplay.call(this); } finally { $dataMap.bgm = day; }
        $.pending = null;
        $.lastKey = $.key();
    };

    // On the map: when night falls or day breaks, fade from one to the other.
    $.update = function() {
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
        _BattleManager_saveBgmAndBgs.call(this);
        if ($.pending) { this._mapBgm = $.pending.bgm; $.pending = null; }
    };

    var _Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        _Game_System_onBeforeSave.call(this);
        if ($.pending) this._bgmOnSave = $.pending.bgm;
    };
})(SmokingIsle.NightMusic);
