//=============================================================================
// SI_BattleMusic.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: battle music. Each fight picks its own music: bosses
 * their themes, and the rest by what they're fighting (spirits, Seafarers...).
 * @author Smoking Isle
 *
 * @param Boss Music
 * @desc Troop number and track, for boss fights.
 * @default 26 Boss_Daughter_Wells, 27 Boss_Great_Boar, 29 Boss_Lady_Woods, 30 Boss_Parl, 50 Boss_Lady_Woods
 *
 * @param Area Tracks
 * @desc Area music that has its own battle theme, named the same with Battle_
 * in front (Salt_Marsh -> Battle_Salt_Marsh). Night versions count too.
 * @default Salt_Marsh, Lava_Tubes, Lava_Tube_Country
 *
 * @param Faction Music
 * @desc Enemies whose music beats the area's (an army, not part of a place).
 * Same form as Kind Music.
 * @default seafarer/soldier/sailor = Battle_Seafarers
 *
 * @param Kind Music
 * @desc For maps with no area battle theme. Rules in order, the first that
 * matches wins: enemy tags or names (separated by /), = and the track; rules separated by ;
 * @default first-sailor/Owl of Ill Omen = Battle_Ancients; spirit/fae = Battle_Spirits
 *
 * @param Start On Contact
 * @desc true: the battle music (and its jingle) starts the moment the fight
 * begins, on the first flash. false: halfway through the flash, as RPG Maker does.
 * @default true
 *
 * @param Field Fade
 * @desc Seconds for the field music to fade out as the battle music starts,
 * instead of stopping dead. 0 stops it dead.
 * @default 0.25
 *
 * @param Short Victory
 * @desc Victory jingle for ordinary fights (in audio/me). Boss fights, and
 * any victory jingle an event chose, play the database's (Victory_Isle).
 * Leave empty to always use the database's.
 * @default Victory_Short
 *
 * @param Mute Start Sound
 * @desc true: no "battle start" sound effect (each battle track opens with
 * its own jingle instead). false: play the database's sound as usual.
 * @default true
 *
 * @help
 * Place after SI_Talk (it reads the enemies' Talk Type and Talk Tags).
 *
 * When a battle starts, its music is chosen like this:
 *   1. If an event chose the battle music itself (Change Battle BGM, to
 *      something other than the database's default), that plays.
 *   2. A boss fight (its troop listed in Boss Music) plays its theme.
 *   3. A map note <Battle BGM: Battle_Spirits> makes every other fight on
 *      that map play that track.
 *   4. A Faction Music rule that matches an enemy in the troop (Seafarers
 *      bring their own music wherever they fight).
 *   5. The area's battle theme: if the map's own music is in Area Tracks
 *      (Salt_Marsh, or Salt_Marsh_Night), the fight plays Battle_Salt_Marsh:
 *      the same tune and key, so the battle grows out of the place.
 *   6. Otherwise the first Kind Music rule that matches any enemy in the
 *      troop: a word matches an enemy's Talk Type or Talk Tags (spirit, fae,
 *      first-sailor...), or appears in its name (Owl of Ill Omen).
 *   7. Nothing matched: the database's battle music (Battle_Wild).
 * Every battle track starts with its own short jingle (its play-once intro).
 *
 * The switch from the field: the moment a fight begins, the field music
 * fades out over a quarter of a second (Field Fade) while the battle track
 * starts at once (Start On Contact), so the jingle's opening hit lands on the
 * first flash. After the fight the field music comes back where it left
 * off, as usual. Ordinary fights end on the Short Victory jingle; bosses on
 * the full one.
 * Volume and pitch are the database battle music's own.
 *
 * Script call: SmokingIsle.BattleMusic.choose()  the track the current troop
 *              would get (for checking).
 */

var Imported = Imported || {};
Imported.SI_BattleMusic = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.BattleMusic = SmokingIsle.BattleMusic || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_BattleMusic');
    $.bosses = {};
    String(params['Boss Music'] || '').split(',').forEach(function(part) {
        var m = /(\d+)\s+(\S+)/.exec(part.trim());
        if (m) $.bosses[Number(m[1])] = m[2];
    });
    var parseRules = function(text) {
        return String(text || '').split(';').map(function(rule) {
            var bits = rule.split('=');
            if (bits.length < 2) return null;
            return { words: bits[0].split('/').map(function(w) { return w.trim().toLowerCase(); }).filter(Boolean), track: bits[1].trim() };
        }).filter(Boolean);
    };
    $.rules = parseRules(params['Kind Music']);
    $.factions = parseRules(params['Faction Music']);
    $.areas = String(params['Area Tracks'] || '').split(',').map(function(a) { return a.trim(); }).filter(Boolean);
    $.muteStart = String(params['Mute Start Sound'] || 'true') === 'true';
    $.onContact = String(params['Start On Contact'] || 'true') === 'true';
    $.fieldFade = Number(params['Field Fade'] || 0);
    $.shortVictory = String(params['Short Victory'] || '').trim();

    // The area battle theme for this map's music, or null.
    $.areaTrack = function() {
        if (!$dataMap || !$dataMap.autoplayBgm || !$dataMap.bgm) return null;
        var name = String($dataMap.bgm.name || '').replace(/_Night$/, '');
        return $.areas.indexOf(name) >= 0 ? 'Battle_' + name : null;
    };

    var defaultName = function() { return ($dataSystem.battleBgm && $dataSystem.battleBgm.name) || ''; };

    // What an enemy is, for the rules: its Talk Type and Tags, and its name.
    $.words = function(enemy) {
        var data = enemy.talkData ? enemy.talkData() : null;
        var kinds = (data && data.kinds) || [];
        return { kinds: kinds.map(function(k) { return String(k).toLowerCase(); }), name: enemy.name().toLowerCase() };
    };

    $.matches = function(rule, enemies) {
        return enemies.some(function(enemy) {
            var w = $.words(enemy);
            return rule.words.some(function(word) { return w.kinds.indexOf(word) >= 0 || w.name.indexOf(word) >= 0; });
        });
    };

    // The track for the current troop (a name), following the order in the help.
    $.choose = function() {
        var chosen = $gameSystem._battleBgm;
        if (chosen && chosen.name !== defaultName()) return chosen.name;
        var boss = $.bosses[$gameTroop._troopId];
        if (boss) return boss;
        var note = /<Battle BGM:\s*([^>]+)>/i.exec(($dataMap && $dataMap.note) || '');
        if (note) return note[1].trim();
        var enemies = $gameTroop.members();
        for (var f = 0; f < $.factions.length; f++) {
            if ($.matches($.factions[f], enemies)) return $.factions[f].track;
        }
        var area = $.areaTrack();
        if (area) return area;
        for (var i = 0; i < $.rules.length; i++) {
            if ($.matches($.rules[i], enemies)) return $.rules[i].track;
        }
        return chosen ? chosen.name : defaultName();
    };

    var _BattleManager_playBattleBgm = BattleManager.playBattleBgm;
    BattleManager.playBattleBgm = function() {
        var base = $gameSystem.battleBgm(), name = $.choose();
        if (!name || name === base.name) return _BattleManager_playBattleBgm.call(this);
        AudioManager.playBgm({ name: name, volume: base.volume, pitch: base.pitch, pan: base.pan });
        AudioManager.stopBgs();
    };

    // Leaving the field: fade the field music out (rather than stop it dead) and start the battle track at once.
    $.fadeOutField = function(seconds) {
        var buffer = AudioManager._bgmBuffer;
        if (!buffer || !AudioManager._currentBgm || seconds <= 0) return false;
        buffer.fadeOut(seconds);
        AudioManager._bgmBuffer = null; AudioManager._currentBgm = null;     // detached: the battle track gets a fresh one
        setTimeout(function() { buffer.stop(); }, seconds * 1000 + 50);
        return true;
    };

    var _Scene_Map_stopAudioOnBattleStart = Scene_Map.prototype.stopAudioOnBattleStart;
    Scene_Map.prototype.stopAudioOnBattleStart = function() {
        var current = AudioManager._currentBgm, next = $.choose();
        var same = current && current.name === next;                          // already playing it: leave it be
        if (!same) $.fadeOutField($.fieldFade);
        _Scene_Map_stopAudioOnBattleStart.call(this);
        if ($.onContact && !same) BattleManager.playBattleBgm();
    };

    // Ordinary fights end on the short victory jingle; bosses (and an event's own choice) on the full one.
    $.victoryMe = function() {
        var me = $gameSystem.victoryMe();
        var database = $dataSystem.victoryMe && $dataSystem.victoryMe.name;
        if (!$.shortVictory || me.name !== database || $.bosses[$gameTroop._troopId]) return me;
        return { name: $.shortVictory, volume: me.volume, pitch: me.pitch, pan: me.pan };
    };

    var _BattleManager_playVictoryMe = BattleManager.playVictoryMe;
    BattleManager.playVictoryMe = function() {
        var me = $.victoryMe();
        if (me === $gameSystem.victoryMe()) return _BattleManager_playVictoryMe.call(this);
        AudioManager.playMe(me);
    };

    // The battle track's own jingle replaces the "battle start" sound effect.
    var _SoundManager_playBattleStart = SoundManager.playBattleStart;
    SoundManager.playBattleStart = function() {
        if (!$.muteStart) _SoundManager_playBattleStart.call(this);
    };
})(SmokingIsle.BattleMusic);
