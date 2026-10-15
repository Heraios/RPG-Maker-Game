//=============================================================================
// SI_PartySwitch.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: FFX-style party switching in battle.
 * @author Smoking Isle
 *
 * @param Switch Command
 * @desc Name of the battle command.
 * @default Switch
 *
 * @param Switch Fatigue
 * @desc Fatigue added to the character switching in (decimals allowed).
 * Scaled by their TP Charge Rate.
 * @default 1
 *
 * @help
 * Requires SI_TurnOrder and SI_CombatCore (place this plugin below them).
 *
 * The Switch battle command lists reserve party members (everyone beyond the
 * four battle slots). Switching is free: the chosen character takes the
 * current character's place and their turn, and acts immediately. They gain
 * a small amount of Fatigue so switching can't be spammed.
 *
 * Knocked-out reserve members can't be switched in.
 *
 * Actor note:
 *   <No Switch>   Never appears in the reserve list and can't be switched
 *                 out (e.g. pseudo party members).
 */

var Imported = Imported || {};
Imported.SI_PartySwitch = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.PartySwitch = SmokingIsle.PartySwitch || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_PartySwitch');
    $.commandName = String(params['Switch Command'] || 'Switch');
    $.fatigue = Number(params['Switch Fatigue'] || 0);

    //-------------------------------------------------------------------------
    // Party
    //-------------------------------------------------------------------------

    Game_Actor.prototype.isSwitchLocked = function() {
        return /<No Switch>/i.test(this.actor().note);
    };

    Game_Party.prototype.reserveMembers = function() {
        var active = this.battleMembers();
        return this.allMembers().filter(function(actor) {
            return active.indexOf(actor) < 0 && !actor.isSwitchLocked();
        });
    };

    Game_Party.prototype.canSwitchIn = function(actor) {
        return !!actor && actor.isAlive();
    };

    Game_Actor.prototype.canSwitchOut = function() {
        return !this.isSwitchLocked() && $gameParty.reserveMembers().some(function(actor) {
            return $gameParty.canSwitchIn(actor);
        });
    };

    // Puts `incoming` in `outgoing`'s battle slot and hands them the current turn.
    BattleManager.switchActor = function(outgoing, incoming) {
        var all = $gameParty._actors;
        var i = all.indexOf(outgoing.actorId());
        var j = all.indexOf(incoming.actorId());
        if (i < 0 || j < 0) return;
        $gameParty.swapOrder(i, j);
        outgoing.clearActions();
        outgoing.setActionState('');
        incoming.clearResult();
        incoming.setCtbDistance(0);
        if ($.fatigue > 0) incoming.gainSilentTp($.fatigue * incoming.tcr);
        this._ctbActive = incoming;
        incoming.makeActions();
        this._actorIndex = -1;
        this.changeActor(incoming.index(), 'undecided');
        $gameParty.requestMotionRefresh();
        this.refreshStatus();
    };

    //-------------------------------------------------------------------------
    // Window_BattleReserve
    //-------------------------------------------------------------------------

    function Window_BattleReserve() {
        this.initialize.apply(this, arguments);
    }

    Window_BattleReserve.prototype = Object.create(Window_Selectable.prototype);
    Window_BattleReserve.prototype.constructor = Window_BattleReserve;

    Window_BattleReserve.prototype.initialize = function(x, y, width, height) {
        this._data = [];
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.hide();
    };

    Window_BattleReserve.prototype.maxItems = function() {
        return this._data.length;
    };

    Window_BattleReserve.prototype.item = function() {
        return this._data[this.index()] || null;
    };

    Window_BattleReserve.prototype.isCurrentItemEnabled = function() {
        return $gameParty.canSwitchIn(this.item());
    };

    Window_BattleReserve.prototype.refresh = function() {
        this._data = $gameParty.reserveMembers();
        this.createContents();
        this.drawAllItems();
    };

    Window_BattleReserve.prototype.drawItem = function(index) {
        var actor = this._data[index];
        var rect = this.itemRectForText(index);
        this.changePaintOpacity($gameParty.canSwitchIn(actor));
        this.drawActorName(actor, rect.x, rect.y, 150);
        this.drawActorIcons(actor, rect.x + 156, rect.y, 96);
        var gaugeX = rect.x + 260;
        var gaugeW = Math.floor((rect.width - 260 - 24) / 3);
        this.drawActorHp(actor, gaugeX, rect.y, gaugeW);
        this.drawActorMp(actor, gaugeX + gaugeW + 12, rect.y, gaugeW);
        this.drawActorTp(actor, gaugeX + (gaugeW + 12) * 2, rect.y, gaugeW);
        this.changePaintOpacity(true);
    };

    $.Window_BattleReserve = Window_BattleReserve;

    //-------------------------------------------------------------------------
    // Scene_Battle
    //-------------------------------------------------------------------------

    var _Window_ActorCommand_addItemCommand = Window_ActorCommand.prototype.addItemCommand;
    Window_ActorCommand.prototype.addItemCommand = function() {
        _Window_ActorCommand_addItemCommand.call(this);
        if ($gameParty.reserveMembers().length > 0) {
            this.addCommand($.commandName, 'switch', this._actor.canSwitchOut());
        }
    };

    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        var w = this._itemWindow;
        this._reserveWindow = new Window_BattleReserve(w.x, w.y, w.width, w.height);
        this._reserveWindow.setHandler('ok', this.onSwitchOk.bind(this));
        this._reserveWindow.setHandler('cancel', this.onSwitchCancel.bind(this));
        this.addWindow(this._reserveWindow);
    };

    var _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler('switch', this.commandSwitch.bind(this));
    };

    var _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return _Scene_Battle_isAnyInputWindowActive.call(this) || this._reserveWindow.active;
    };

    Scene_Battle.prototype.commandSwitch = function() {
        this._reserveWindow.refresh();
        this._reserveWindow.show();
        this._reserveWindow.select(0);
        this._reserveWindow.activate();
    };

    Scene_Battle.prototype.onSwitchOk = function() {
        var incoming = this._reserveWindow.item();
        this._reserveWindow.hide();
        BattleManager.switchActor(BattleManager.actor(), incoming);
        this.refreshStatus();
        this.startActorCommandSelection();
    };

    Scene_Battle.prototype.onSwitchCancel = function() {
        this._reserveWindow.hide();
        this._actorCommandWindow.activate();
    };

})(SmokingIsle.PartySwitch);
