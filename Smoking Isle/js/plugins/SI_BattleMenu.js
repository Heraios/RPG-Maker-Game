//=============================================================================
// SI_BattleMenu.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: groups skill types under one "Skills" battle command.
 * @author Smoking Isle
 *
 * @param Skills Command
 * @desc Name of the battle command that opens the skill type list.
 * Leave empty to use the database's "Skill" term.
 * @default
 *
 * @help
 * The actor command window shows a single Skills command instead of one
 * command per skill type (Magic, Physical, Rest...). Choosing it opens a
 * list of the character's skill types in the same place; choosing a type
 * opens that skill list. Cancel steps back one window at a time.
 *
 * A character with only one skill type goes straight to that skill list.
 * Sealed skill types (e.g. while Weary) are shown greyed out.
 */

var Imported = Imported || {};
Imported.SI_BattleMenu = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.BattleMenu = SmokingIsle.BattleMenu || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_BattleMenu');
    $.commandName = String(params['Skills Command'] || '');

    $.skillTypes = function(actor) {
        return actor.addedSkillTypes().slice().sort(function(a, b) {
            return a - b;
        });
    };

    //-------------------------------------------------------------------------
    // Actor command: one Skills entry (symbol 'skill', so MV's cancel logic
    // returning to the skill list keeps working).
    //-------------------------------------------------------------------------

    Window_ActorCommand.prototype.addSkillCommands = function() {
        if ($.skillTypes(this._actor).length > 0) {
            this.addCommand($.commandName || TextManager.skill, 'skill', true);
        }
    };

    //-------------------------------------------------------------------------
    // Window_SkillTypeList
    //-------------------------------------------------------------------------

    function Window_SkillTypeList() {
        this.initialize.apply(this, arguments);
    }

    Window_SkillTypeList.prototype = Object.create(Window_Command.prototype);
    Window_SkillTypeList.prototype.constructor = Window_SkillTypeList;

    Window_SkillTypeList.prototype.initialize = function(x, y, width, height) {
        this._actor = null;
        this._windowWidth = width;
        this._windowHeight = height;
        Window_Command.prototype.initialize.call(this, x, y);
        this.hide();
        this.deactivate();
    };

    Window_SkillTypeList.prototype.windowWidth = function() {
        return this._windowWidth;
    };

    Window_SkillTypeList.prototype.windowHeight = function() {
        return this._windowHeight;
    };

    Window_SkillTypeList.prototype.setActor = function(actor) {
        this._actor = actor;
        this.refresh();
    };

    Window_SkillTypeList.prototype.makeCommandList = function() {
        if (!this._actor) return;
        $.skillTypes(this._actor).forEach(function(stypeId) {
            this.addCommand($dataSystem.skillTypes[stypeId], 'stype',
                !this._actor.isSkillTypeSealed(stypeId), stypeId);
        }, this);
    };

    $.Window_SkillTypeList = Window_SkillTypeList;

    //-------------------------------------------------------------------------
    // Scene_Battle
    //-------------------------------------------------------------------------

    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        var cmd = this._actorCommandWindow;
        this._skillTypeWindow = new Window_SkillTypeList(cmd.x, cmd.y, cmd.width, cmd.height);
        this._skillTypeWindow.setHandler('stype', this.onSkillTypeOk.bind(this));
        this._skillTypeWindow.setHandler('cancel', this.onSkillTypeCancel.bind(this));
        this.addWindow(this._skillTypeWindow);
    };

    var _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return _Scene_Battle_isAnyInputWindowActive.call(this) || this._skillTypeWindow.active;
    };

    Scene_Battle.prototype.commandSkill = function() {
        var actor = BattleManager.actor();
        var types = $.skillTypes(actor);
        if (types.length === 1) {
            this._skillTypeWindow.hide();
            this.openSkillList(types[0]);
            return;
        }
        this._skillTypeWindow.setActor(actor);
        var last = actor.lastBattleSkill();
        this._skillTypeWindow.selectExt(last ? last.stypeId : types[0]);
        if (this._skillTypeWindow.index() < 0) this._skillTypeWindow.select(0);
        this._skillTypeWindow.show();
        this._skillTypeWindow.activate();
    };

    Scene_Battle.prototype.openSkillList = function(stypeId) {
        this._skillWindow.setActor(BattleManager.actor());
        this._skillWindow.setStypeId(stypeId);
        this._skillWindow.refresh();
        this._skillWindow.show();
        this._skillWindow.activate();
    };

    Scene_Battle.prototype.onSkillTypeOk = function() {
        this.openSkillList(this._skillTypeWindow.currentExt());
    };

    Scene_Battle.prototype.onSkillTypeCancel = function() {
        this._skillTypeWindow.hide();
        this._actorCommandWindow.activate();
    };

    Scene_Battle.prototype.onSkillCancel = function() {
        this._skillWindow.hide();
        if (this._skillTypeWindow.visible) {
            this._skillTypeWindow.activate();
        } else {
            this._actorCommandWindow.activate();
        }
    };

    // Close the type list once an action is chosen or input moves on.
    var _Scene_Battle_onSelectAction = Scene_Battle.prototype.onSelectAction;
    Scene_Battle.prototype.onSelectAction = function() {
        _Scene_Battle_onSelectAction.call(this);
        if (!BattleManager.inputtingAction() || !BattleManager.inputtingAction().needsSelection()) {
            this._skillTypeWindow.hide();
        }
    };

    var _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
    Scene_Battle.prototype.onEnemyOk = function() {
        this._skillTypeWindow.hide();
        _Scene_Battle_onEnemyOk.call(this);
    };

    var _Scene_Battle_onActorOk = Scene_Battle.prototype.onActorOk;
    Scene_Battle.prototype.onActorOk = function() {
        this._skillTypeWindow.hide();
        _Scene_Battle_onActorOk.call(this);
    };

    var _Scene_Battle_endCommandSelection = Scene_Battle.prototype.endCommandSelection;
    Scene_Battle.prototype.endCommandSelection = function() {
        _Scene_Battle_endCommandSelection.call(this);
        this._skillTypeWindow.hide();
        this._skillTypeWindow.deactivate();
    };

})(SmokingIsle.BattleMenu);
