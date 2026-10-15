//=============================================================================
// SI_BattleMenu.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: Skills and Tactics submenus for the battle command menu.
 * @author Smoking Isle
 *
 * @param Skills Command
 * @desc Name of the battle command that opens the skill type list.
 * Leave empty to use the database's "Skill" term.
 * @default
 *
 * @param Tactics Command
 * @desc Name of the battle command that groups Swap, Item and Switch.
 * @default Tactics
 *
 * @param Tactics Symbols
 * @desc Commands moved under Tactics, by internal symbol, in order.
 * @default swap,item,switch
 *
 * @help
 * The actor command window shows a single Skills command instead of one
 * command per skill type (Magic, Physical, Rest...). Choosing it opens a
 * list of the character's skill types in the same place; choosing a type
 * opens that skill list. Cancel steps back one window at a time.
 *
 * A character with only one skill type goes straight to that skill list.
 * Sealed skill types (e.g. while Weary) are shown greyed out.
 *
 * Tactics works the same way for Swap (SI_Gear), Item and Switch
 * (SI_PartySwitch). It is greyed out when none of them can be used.
 */

var Imported = Imported || {};
Imported.SI_BattleMenu = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.BattleMenu = SmokingIsle.BattleMenu || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_BattleMenu');
    $.commandName = String(params['Skills Command'] || '');
    $.tacticsName = String(params['Tactics Command'] || 'Tactics');
    $.tacticsSymbols = String(params['Tactics Symbols'] || 'swap,item,switch').split(',').map(function(s) {
        return s.trim();
    });

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

    // Moves the Tactics commands (added by MV and other plugins) into a submenu.
    var _Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        _Window_ActorCommand_makeCommandList.call(this);
        this._tacticsCommands = [];
        if (!this._actor) return;
        var insertAt = -1;
        this._list = this._list.filter(function(command, i) {
            if ($.tacticsSymbols.indexOf(command.symbol) < 0) return true;
            if (insertAt < 0) insertAt = i;
            this._tacticsCommands.push(command);
            return false;
        }, this);
        this._tacticsCommands.sort(function(a, b) {
            return $.tacticsSymbols.indexOf(a.symbol) - $.tacticsSymbols.indexOf(b.symbol);
        });
        if (this._tacticsCommands.length > 0) {
            var enabled = this._tacticsCommands.some(function(c) { return c.enabled; });
            this._list.splice(Math.min(insertAt, this._list.length), 0,
                { name: $.tacticsName, symbol: 'tactics', enabled: enabled, ext: null });
        }
    };

    //-------------------------------------------------------------------------
    // Window_TacticsList
    //-------------------------------------------------------------------------

    function Window_TacticsList() {
        this.initialize.apply(this, arguments);
    }

    Window_TacticsList.prototype = Object.create(Window_Command.prototype);
    Window_TacticsList.prototype.constructor = Window_TacticsList;

    Window_TacticsList.prototype.initialize = function(x, y, width, height) {
        this._commands = [];
        this._windowWidth = width;
        this._windowHeight = height;
        Window_Command.prototype.initialize.call(this, x, y);
        this.hide();
        this.deactivate();
    };

    Window_TacticsList.prototype.windowWidth = function() {
        return this._windowWidth;
    };

    Window_TacticsList.prototype.windowHeight = function() {
        return this._windowHeight;
    };

    Window_TacticsList.prototype.setCommands = function(commands) {
        this._commands = commands || [];
        this.refresh();
    };

    Window_TacticsList.prototype.makeCommandList = function() {
        (this._commands || []).forEach(function(c) {
            this.addCommand(c.name, c.symbol, c.enabled, c.ext);
        }, this);
    };

    $.Window_TacticsList = Window_TacticsList;

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
        this._tacticsWindow = new Window_TacticsList(cmd.x, cmd.y, cmd.width, cmd.height);
        this._tacticsWindow.setHandler('cancel', this.onTacticsCancel.bind(this));
        this.addWindow(this._tacticsWindow);
        this._actorCommandWindow.setHandler('tactics', this.commandTactics.bind(this));
    };

    // Windows bind their cancel handlers when created, so wrap them before that.
    var _Scene_Battle_create = Scene_Battle.prototype.create;
    Scene_Battle.prototype.create = function() {
        $.wrapTacticsCancels();
        _Scene_Battle_create.call(this);
    };

    var _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return _Scene_Battle_isAnyInputWindowActive.call(this) ||
            this._skillTypeWindow.active || this._tacticsWindow.active;
    };

    Scene_Battle.prototype.hideSubmenus = function() {
        [this._skillTypeWindow, this._tacticsWindow].forEach(function(w) {
            w.hide();
            w.deactivate();
        });
    };

    // Whenever the main command menu takes focus, close any submenu.
    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        if (this._actorCommandWindow && this._actorCommandWindow.active) {
            this.hideSubmenus();
        }
        _Scene_Battle_update.call(this);
    };

    //-------------------------------------------------------------------------
    // Tactics
    //-------------------------------------------------------------------------

    Scene_Battle.prototype.commandTactics = function() {
        var commands = this._actorCommandWindow._tacticsCommands;
        var win = this._tacticsWindow;
        win.setCommands(commands);
        commands.forEach(function(c) {
            var handler = this._actorCommandWindow._handlers[c.symbol];
            if (handler) win.setHandler(c.symbol, handler);
        }, this);
        win.select(0);
        win.show();
        win.activate();
    };

    Scene_Battle.prototype.onTacticsCancel = function() {
        this._tacticsWindow.hide();
        this._actorCommandWindow.activate();
    };

    Scene_Battle.prototype.returnToTactics = function() {
        if (this._tacticsWindow.visible) {
            this._actorCommandWindow.deactivate();
            this._tacticsWindow.activate();
        }
    };

    // Wrapped when the first battle scene is created rather than at load time,
    // so commands added by plugins listed below this one (SI_PartySwitch) are
    // covered too.
    $.wrapTacticsCancels = function() {
        if ($._cancelsWrapped) return;
        $._cancelsWrapped = true;
        ['onItemCancel', 'onSwapCancel', 'onSwitchCancel'].forEach(function(name) {
            var original = Scene_Battle.prototype[name];
            if (!original) return;
            Scene_Battle.prototype[name] = function() {
                original.call(this);
                this.returnToTactics();
            };
        });
    };

    // MV decides where target-selection Cancel returns by the main menu's
    // current command; under Tactics that is 'tactics', so handle Item here.
    ['onEnemyCancel', 'onActorCancel'].forEach(function(name) {
        var original = Scene_Battle.prototype[name];
        Scene_Battle.prototype[name] = function() {
            if (this._actorCommandWindow.currentSymbol() === 'tactics' &&
                    this._tacticsWindow.currentSymbol() === 'item') {
                (name === 'onEnemyCancel' ? this._enemyWindow : this._actorWindow).hide();
                this._itemWindow.show();
                this._itemWindow.activate();
                return;
            }
            original.call(this);
        };
    });

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
        this.hideSubmenus();
    };

})(SmokingIsle.BattleMenu);
