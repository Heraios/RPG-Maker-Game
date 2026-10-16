//=============================================================================
// SI_Gear.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: weapon swapping in battle and equipment wear tiers.
 * @author Smoking Isle
 *
 * @param Swap Skill
 * @type skill
 * @desc Skill used as the action when swapping weapons costs the turn.
 * @default 6
 *
 * @param Swap Command
 * @desc Name of the battle command.
 * @default Swap
 *
 * @param Worn Message
 * @desc %1 = character, %2 = old item, %3 = new item.
 * @default %1's %2 wore down into %3!
 *
 * @param Broken Message
 * @desc %1 = character, %2 = item.
 * @default %1's %2 broke!
 *
 * @param Broken Kept Message
 * @desc When the remains are kept. %1 = character, %2 = item, %3 = remains.
 * @default %1's %2 broke! Kept the %3.
 *
 * @help
 * Requires SI_CombatCore (place this plugin below it).
 *
 * ============================================================================
 * Wear tiers
 * ============================================================================
 * Weapon / armor note:
 *   <Degrades To: 7>    Becomes weapon (or armor) #7 when it wears out.
 *                       Use 0 for "breaks and is gone".
 *   <Wear Chance: 15>   % chance to wear out each time it is used.
 *   <Breaks Into: 5>    When it breaks (Degrades To: 0), item #5 is added to
 *                       the inventory instead of nothing being left. Use it
 *                       for metal (copper) gear: an unusable broken item that
 *                       can be sold or repaired. Without it, broken stone,
 *                       bone and wood gear simply disappears.
 *
 * Items without <Degrades To> never wear (bronze, unique items...).
 *
 * - A weapon is "used" when its owner performs a skill that needs one of the
 *   weapon's moves (<Requires Move>). Punch never wears weapons.
 * - Armor is "used" when its wearer takes physical HP damage.
 * - The worn item replaces the equipped one directly. Repairing is up to
 *   events (shops, smiths...), e.g. with Change Equipment.
 *
 * ============================================================================
 * Weapon swapping
 * ============================================================================
 * The Swap battle command lists carried weapons the character can equip.
 * Swapping costs the turn: the character performs the Swap Skill (set its
 * <Turn Cost> to make swapping quicker or slower).
 *
 * Actor / class / equipment / state note:
 *   <Free Swap>   Swap once per turn without using the turn, then act.
 */

var Imported = Imported || {};
Imported.SI_Gear = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Gear = SmokingIsle.Gear || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Gear');
    $.swapSkillId = Number(params['Swap Skill'] || 0);
    $.swapCommand = String(params['Swap Command'] || 'Swap');
    $.wornMessage = String(params['Worn Message'] || '%1\'s %2 wore down into %3!');
    $.brokenMessage = String(params['Broken Message'] || '%1\'s %2 broke!');
    $.brokenKeptMessage = String(params['Broken Kept Message'] || '%1\'s %2 broke! Kept the %3.');

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            [$dataWeapons, $dataArmors].forEach(function(list) {
                list.forEach(function(obj) {
                    if (!obj) return;
                    var to = /<Degrades To:\s*(\d+)>/i.exec(obj.note);
                    var chance = /<Wear Chance:\s*(\d+)>/i.exec(obj.note);
                    var remains = /<Breaks Into:\s*(\d+)>/i.exec(obj.note);
                    obj.siDegradesTo = to ? Number(to[1]) : -1;
                    obj.siWearChance = chance ? Number(chance[1]) : 0;
                    obj.siBreaksInto = remains ? Number(remains[1]) : 0;
                });
            });
            $._notesParsed = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Wear
    //-------------------------------------------------------------------------

    $.canWear = function(item) {
        return item && item.siDegradesTo >= 0 && item.siWearChance > 0;
    };

    // Rolls wear for the item in the given equip slot. Returns a log message or null.
    Game_Actor.prototype.rollWear = function(slotId) {
        var item = this.equips()[slotId];
        if (!$.canWear(item) || Math.random() * 100 >= item.siWearChance) return null;
        var list = DataManager.isWeapon(item) ? $dataWeapons : $dataArmors;
        var next = item.siDegradesTo > 0 ? list[item.siDegradesTo] : null;
        this._equips[slotId].setObject(next);
        this.refresh();
        if (next) {
            return $.wornMessage.format(this.name(), item.name, next.name);
        }
        var remains = item.siBreaksInto > 0 ? $dataItems[item.siBreaksInto] : null;
        if (remains) {
            $gameParty.gainItem(remains, 1);
            return $.brokenKeptMessage.format(this.name(), item.name, remains.name);
        }
        return $.brokenMessage.format(this.name(), item.name);
    };

    // The equip slot of the weapon that provided a move for this skill, or -1.
    Game_Actor.prototype.weaponSlotForSkill = function(skill) {
        var required = (skill && skill.siRequiredMoves) || [];
        if (required.length === 0) return -1;
        var equips = this.equips();
        for (var i = 0; i < equips.length; i++) {
            var item = equips[i];
            if (DataManager.isWeapon(item) && (item.siMoves || []).some(function(m) {
                return required.indexOf(m) >= 0;
            })) {
                return i;
            }
        }
        return -1;
    };

    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var subject = this._subject;
        var item = this._action ? this._action.item() : null;
        if (subject && subject.isActor() && DataManager.isSkill(item)) {
            var slotId = subject.weaponSlotForSkill(item);
            var message = slotId >= 0 ? subject.rollWear(slotId) : null;
            if (message) {
                this._logWindow.push('addText', message);
                this._logWindow.push('wait');
                this.refreshStatus();
            }
        }
        _BattleManager_endAction.call(this);
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var result = target.result();
        if ($gameParty.inBattle() && target.isActor() && this.isPhysical() &&
                result.isHit() && result.hpDamage > 0) {
            var messages = [];
            target.equips().forEach(function(item, slotId) {
                if (DataManager.isArmor(item)) {
                    var message = target.rollWear(slotId);
                    if (message) messages.push(message);
                }
            });
            target._siWearMessages = (target._siWearMessages || []).concat(messages);
        }
    };

    var _Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        _Window_BattleLog_displayActionResults.call(this, subject, target);
        if (target._siWearMessages && target._siWearMessages.length > 0) {
            target._siWearMessages.forEach(function(message) {
                this.push('addText', message);
                this.push('wait');
            }, this);
            target._siWearMessages = [];
        }
    };

    //-------------------------------------------------------------------------
    // Swapping
    //-------------------------------------------------------------------------

    Game_Actor.prototype.weaponSlotId = function() {
        return this.equipSlots().indexOf(1);
    };

    Game_Actor.prototype.hasFreeSwap = function() {
        return this.traitObjects().some(function(obj) {
            return obj && /<Free Swap>/i.test(obj.note);
        });
    };

    Game_Actor.prototype.swappableWeapons = function() {
        return $gameParty.weapons().filter(function(weapon) {
            return this.canEquip(weapon);
        }, this);
    };

    Game_Actor.prototype.canSwapWeapon = function() {
        var slotId = this.weaponSlotId();
        return slotId >= 0 && this.isEquipChangeOk(slotId) &&
            !(this.hasFreeSwap() && this._siFreeSwapUsed) &&
            this.swappableWeapons().length > 0;
    };

    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.call(this);
        this._siFreeSwapUsed = false;
    };

    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        this._siFreeSwapUsed = false;
        this._siWearMessages = [];
    };

    var _Window_ActorCommand_addGuardCommand = Window_ActorCommand.prototype.addGuardCommand;
    Window_ActorCommand.prototype.addGuardCommand = function() {
        _Window_ActorCommand_addGuardCommand.call(this);
        this.addCommand($.swapCommand, 'swap', this._actor.canSwapWeapon());
    };

    function Window_BattleSwap() {
        this.initialize.apply(this, arguments);
    }

    Window_BattleSwap.prototype = Object.create(Window_ItemList.prototype);
    Window_BattleSwap.prototype.constructor = Window_BattleSwap;

    Window_BattleSwap.prototype.initialize = function(x, y, width, height) {
        Window_ItemList.prototype.initialize.call(this, x, y, width, height);
        this._actor = null;
        this.hide();
    };

    Window_BattleSwap.prototype.setActor = function(actor) {
        this._actor = actor;
        this.refresh();
    };

    Window_BattleSwap.prototype.includes = function(item) {
        return !!this._actor && DataManager.isWeapon(item) && this._actor.canEquip(item);
    };

    Window_BattleSwap.prototype.isEnabled = function(item) {
        return !!item;
    };

    $.Window_BattleSwap = Window_BattleSwap;

    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        var w = this._itemWindow;
        this._swapWindow = new Window_BattleSwap(w.x, w.y, w.width, w.height);
        this._swapWindow.setHelpWindow(this._helpWindow);
        this._swapWindow.setHandler('ok', this.onSwapOk.bind(this));
        this._swapWindow.setHandler('cancel', this.onSwapCancel.bind(this));
        this.addWindow(this._swapWindow);
    };

    var _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler('swap', this.commandSwap.bind(this));
    };

    var _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return _Scene_Battle_isAnyInputWindowActive.call(this) || this._swapWindow.active;
    };

    Scene_Battle.prototype.commandSwap = function() {
        this._swapWindow.setActor(BattleManager.actor());
        this._swapWindow.show();
        this._swapWindow.select(0);
        this._swapWindow.activate();
    };

    Scene_Battle.prototype.onSwapOk = function() {
        var actor = BattleManager.actor();
        var weapon = this._swapWindow.item();
        this._swapWindow.hide();
        actor.changeEquip(actor.weaponSlotId(), weapon);
        this.refreshStatus();
        if (actor.hasFreeSwap()) {
            actor._siFreeSwapUsed = true;
            this._actorCommandWindow.setup(actor);
        } else {
            BattleManager.inputtingAction().setSkill($.swapSkillId);
            this.selectNextCommand();
        }
    };

    Scene_Battle.prototype.onSwapCancel = function() {
        this._swapWindow.hide();
        this._actorCommandWindow.activate();
    };

    // Turn order preview while choosing a weapon (SI_TurnOrder).
    var _Scene_Battle_ctbPendingItem = Scene_Battle.prototype.ctbPendingItem;
    if (_Scene_Battle_ctbPendingItem) {
        Scene_Battle.prototype.ctbPendingItem = function() {
            if (this._swapWindow && this._swapWindow.active) {
                var actor = BattleManager.actor();
                return actor && actor.hasFreeSwap() ? null : $dataSkills[$.swapSkillId];
            }
            return _Scene_Battle_ctbPendingItem.call(this);
        };
    }

})(SmokingIsle.Gear);
