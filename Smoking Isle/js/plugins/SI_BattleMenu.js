//=============================================================================
// SI_BattleMenu.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: Fight / Talk / Tactics battle menu with submenus.
 * @author Smoking Isle
 *
 * @param Skills Command
 * @desc Name of the battle command that opens the fighting skill types.
 * @default Fight
 *
 * @param Fight Types
 * @desc Skill type ids listed under Fight, in order (Physical, Magical,
 * Cultural, Innate).
 * @default 2,1,5,6
 *
 * @param Rest Type
 * @desc Skill type id of resting skills (listed under Tactics as Rest).
 * @default 3
 *
 * @param Tactics Command
 * @desc Name of the battle command that groups Rest, Swap, Switch, Item and Escape.
 * @default Tactics
 *
 * @param Tactics Symbols
 * @desc Commands moved under Tactics, by internal symbol, in order.
 * @default rest,swap,switch,item,escape
 *
 * @help
 * The battle menu is Fight / Talk / Tactics.
 *
 * Fight opens the character's fighting skill types (Fight Types, in that
 * order: Physical, Magical, Cultural, Innate). A type only appears if the
 * character has a skill of it; with only one, Fight goes straight to that
 * list. Physical always holds Punch and Guard first. Sealed types (e.g.
 * while Weary) are greyed out.
 *
 * Tactics opens Rest (resting skills), Swap (SI_Gear), Switch
 * (SI_PartySwitch), Item and Escape. It is greyed out when none can be
 * used. Escape is shown when the battle allows escaping; a failed escape
 * uses up the current character's turn. Cancel steps back one window at a
 * time.
 */

var Imported = Imported || {};
Imported.SI_BattleMenu = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.BattleMenu = SmokingIsle.BattleMenu || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_BattleMenu');
    $.commandName = String(params['Skills Command'] || 'Fight');
    $.fightTypes = String(params['Fight Types'] || '2,1,5,6').split(',').map(Number);
    $.restType = Number(params['Rest Type'] || 3);
    $.tacticsName = String(params['Tactics Command'] || 'Tactics');
    $.tacticsSymbols = String(params['Tactics Symbols'] || 'rest,swap,switch,item,escape').split(',').map(function(s) {
        return s.trim();
    });

    $.hasSkillOfType = function(actor, stypeId) {
        return actor.skills().some(function(skill) { return skill.stypeId === stypeId; });
    };

    // Skill types shown under Fight, in Fight Types order: only the ones the
    // character has a skill of (Physical always: Punch and Guard live there).
    $.skillTypes = function(actor) {
        var added = actor.addedSkillTypes();
        return $.fightTypes.filter(function(id) {
            return added.indexOf(id) >= 0 && (id === 2 || $.hasSkillOfType(actor, id));
        });
    };

    // Physical lists Punch, then Guard, then the weapon skills.
    var _Window_BattleSkill_makeItemList = Window_BattleSkill.prototype.makeItemList;
    Window_BattleSkill.prototype.makeItemList = function() {
        _Window_BattleSkill_makeItemList.call(this);
        if (this._actor && this._stypeId === 2) {
            var guard = $dataSkills[this._actor.guardSkillId()];
            var punch = $dataSkills[this._actor.attackSkillId()];
            if (guard && this._data.indexOf(guard) < 0) {
                this._data.splice(this._data[0] === punch ? 1 : 0, 0, guard);
            }
        }
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
        if (this._actor.addedSkillTypes().indexOf($.restType) >= 0 && $.hasSkillOfType(this._actor, $.restType)) {
            this.addCommand($dataSystem.skillTypes[$.restType] || 'Rest', 'rest', !this._actor.isSkillTypeSealed($.restType));
        }
        if (BattleManager.canEscape()) {
            this.addCommand(TextManager.escape, 'escape', true);
        }
        // Guard is a Physical skill now, not a main command.
        this._list = this._list.filter(function(command) { return command.symbol !== 'guard'; });
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
        this._actorCommandWindow.setHandler('escape', this.commandEscape.bind(this));
        this._actorCommandWindow.setHandler('rest', this.commandRest.bind(this));
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

    // Rest (under Tactics): the resting skill list.
    Scene_Battle.prototype.commandRest = function() {
        this._skillTypeWindow.hide();
        this.openSkillList($.restType);
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
                    this._tacticsWindow.currentSymbol() === 'rest') {
                (name === 'onEnemyCancel' ? this._enemyWindow : this._actorWindow).hide();
                this._skillWindow.show();
                this._skillWindow.activate();
                return;
            }
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
        } else if (this._tacticsWindow.visible) {
            this._tacticsWindow.activate();
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
