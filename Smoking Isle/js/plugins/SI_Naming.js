//=============================================================================
// SI_Naming.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: the player names each party member when they
 * first join (Final Fantasy style).
 * @author Smoking Isle
 *
 * @param Name On Join
 * @desc Actor ids the player names the first time they join the party.
 * @default 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
 *
 * @param Shared Names
 * @desc Actor ids that are one person and share a name (Ghost and Human
 * Yoon).
 * @default 1, 2
 *
 * @param Max Length
 * @type number
 * @default 8
 *
 * @help
 * When an event's "Change Party Member" adds one of the Name On Join actors
 * for the first time, the name entry screen opens right after (not in
 * battle). Yoon is named in the "Choose Yoon" common event.
 *
 * Map note:  <No Name Entry>   no name entry on this map (the Test Room).
 *
 * Renaming either Yoon renames both. In dialogue, write \N[3] instead of
 * "Sib" (and so on) so a renamed character's name shows.
 */

var Imported = Imported || {};
Imported.SI_Naming = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Naming = SmokingIsle.Naming || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Naming');
    var list = function(s) { return String(s || '').split(',').map(function(x) { return Number(x.trim()); }).filter(Boolean); };
    $.onJoin = list(params['Name On Join'] || '3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14');
    $.shared = list(params['Shared Names'] || '1, 2');
    $.maxLength = Number(params['Max Length'] || 8);

    $.named = function() {
        $gameSystem._siNamed = $gameSystem._siNamed || {};
        return $gameSystem._siNamed;
    };

    $.wantsName = function(actorId) {
        return $.onJoin.indexOf(actorId) >= 0 && !$.named()[actorId] && !$gameParty.inBattle() &&
            !($dataMap && /<No Name Entry>/i.test($dataMap.note || ''));
    };

    $.askName = function(actorId) {
        $.named()[actorId] = true;
        SceneManager.push(Scene_Name);
        SceneManager.prepareNextScene(actorId, $.maxLength);
    };

    // Change Party Member: name a newcomer the first time they join.
    var _Game_Interpreter_command129 = Game_Interpreter.prototype.command129;
    Game_Interpreter.prototype.command129 = function() {
        var actorId = this._params[0];
        var adding = this._params[1] === 0 && $gameActors.actor(actorId) && !$gameParty.members().contains($gameActors.actor(actorId));
        var result = _Game_Interpreter_command129.call(this);
        if (adding && $.wantsName(actorId)) $.askName(actorId);
        return result;
    };

    // One person, one name: renaming either Yoon renames both.
    var _Game_Actor_setName = Game_Actor.prototype.setName;
    Game_Actor.prototype.setName = function(name) {
        _Game_Actor_setName.call(this, name);
        if ($.shared.indexOf(this.actorId()) < 0 || $._syncing) return;
        $._syncing = true;
        $.shared.forEach(function(id) { if (id !== this.actorId()) $gameActors.actor(id).setName(name); }, this);
        $._syncing = false;
    };

})(SmokingIsle.Naming);
