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
 * @param Kind Music
 * @desc Rules in order, the first that matches wins: enemy tags or names
 * (separated by /), then = and the track. Rules are separated by ;
 * @default first-sailor/Owl of Ill Omen = Battle_Ancients; seafarer/soldier/sailor = Battle_Seafarers; spirit/fae = Battle_Spirits
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
 *   4. Otherwise the first Kind Music rule that matches any enemy in the
 *      troop: a word matches an enemy's Talk Type or Talk Tags (spirit, fae,
 *      first-sailor, seafarer...), or appears in its name (Owl of Ill Omen).
 *   5. Nothing matched: the database's battle music (Battle_Wild).
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
    $.rules = String(params['Kind Music'] || '').split(';').map(function(rule) {
        var bits = rule.split('=');
        if (bits.length < 2) return null;
        return { words: bits[0].split('/').map(function(w) { return w.trim().toLowerCase(); }).filter(Boolean), track: bits[1].trim() };
    }).filter(Boolean);

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
})(SmokingIsle.BattleMusic);
