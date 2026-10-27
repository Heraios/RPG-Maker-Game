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
 *   <Breaks Into: 5, 9> When it breaks (Degrades To: 0), items #5 and #9 are
 *                       added to the inventory: nothing that wears ever
 *                       breaks into nothing (stone leaves Stone Caltrops,
 *                       bone and shell Bonemeal, ceramic Potsherds, copper
 *                       Scrap, and a haft or shaft Scrap Wood).
 *   <Sheds: 9>          When it wears down to its next tier, item #9 is
 *                       added: the part that came off (coral studs leave
 *                       Bonemeal; a mahogany paddle's edging leaves its
 *                       stone or teeth, and the mahogany body remains).
 *
 *   <Wear Rate: 50>     (armor, e.g. a charm) the wearer's weapons wear half
 *                       as often (Basalt Whetstone).
 *   <Wear Reduce: 1>    (armor) weapon wear chances -1 point (Pumice Stone).
 *   <Shatter Hit: 150>  (weapon) the swing that breaks it deals 150% damage
 *                       and may cause Bleed (50%): flying shards (ceramic).
 *
 * Repair:
 *   <Repair Kind: sinew>   (worn weapon or armor) what repairs it, by how it was made:
 *                          sinew (lashed: knives, spears, harpoons), glue
 *                          (set in glue: axes, hammers, clubs, maces,
 *                          paddle-swords), or smith (bent copper: only a
 *                          smith straightens it, for a fee)
 *   <Repair: sinew>        (item) restores the target's equipped worn weapons and armor
 *                          of that kind to the tier they wore down from
 *                          (Sinew Binding: sinew; Glue: glue). Can't be used
 *                          if nothing needs it.
 *
 * Items without <Degrades To> never wear (bronze, unique items...).
 *
 * - A weapon is "used" when its owner performs a skill that needs one of the
 *   weapon's moves (<Requires Move>). Punch never wears weapons.
 * - Armor is "used" when its wearer takes physical HP damage: one piece that
 *   can wear, picked at random, rolls. Only real armor wears (shields,
 *   cuirasses, helms, bracers, greaves of wicker, wood, shell, bone or stone);
 *   clothes, jewellery and charms have no wear tags.
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
                    var remains = /<Breaks Into:\s*([\d,\s]+)>/i.exec(obj.note);
                    var sheds = /<Sheds:\s*(?:item\s*)?(\d+)>/i.exec(obj.note);
                    obj.siSheds = sheds ? Number(sheds[1]) : 0;
                    obj.siDegradesTo = to ? Number(to[1]) : -1;
                    obj.siWearChance = chance ? Number(chance[1]) : 0;
                    obj.siBreaksInto = remains ? remains[1].split(',').map(Number).filter(Boolean) : [];
                    var rk = /<Repair Kind:\s*(\w+)>/i.exec(obj.note);
                    obj.siRepairKind = rk ? rk[1].toLowerCase() : null;
                    var shatter = /<Shatter Hit:\s*(\d+)>/i.exec(obj.note);
                    obj.siShatterHit = shatter ? Number(shatter[1]) / 100 : 0;
                });
            });
            $dataItems.forEach(function(item) {
                if (!item) return;
                var r = /<Repair:\s*(\w+)>/i.exec(item.note || '');
                item.siRepair = r ? r[1].toLowerCase() : null;
            });
            // Worn tier -> the weapon (or armor) it wore down from.
            $.baseOf = {};
            $dataWeapons.forEach(function(w) {
                if (w && w.siDegradesTo > 0 && !$.baseOf[w.siDegradesTo]) $.baseOf[w.siDegradesTo] = w.id;
            });
            $.armorBaseOf = {};
            $dataArmors.forEach(function(a) {
                if (a && a.siDegradesTo > 0 && !$.armorBaseOf[a.siDegradesTo]) $.armorBaseOf[a.siDegradesTo] = a.id;
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
    // The tier a worn item wore down from (weapons and armor are numbered separately).
    $.baseFor = function(item) {
        if (DataManager.isWeapon(item)) return $.baseOf[item.id] ? $dataWeapons[$.baseOf[item.id]] : null;
        if (DataManager.isArmor(item)) return $.armorBaseOf[item.id] ? $dataArmors[$.armorBaseOf[item.id]] : null;
        return null;
    };

    // Equip slots holding a worn weapon or armor this kind of repair can fix.
    Game_Actor.prototype.repairableSlots = function(kind) {
        return this.equips().map(function(item, i) {
            return item && item.siRepairKind === kind && $.baseFor(item) ? i : -1;
        }).filter(function(i) { return i >= 0; });
    };

    // What the worn weapon in this slot is mended back into: the weapon it actually wore down from
    // (a Gold-Plated Knife and a Copper Knife both bend into a Bent Copper Knife), else the first one.
    Game_Actor.prototype.repairTarget = function(slotId) {
        var worn = this.equips()[slotId], from = this._siWornFrom && this._siWornFrom[slotId];
        var list = DataManager.isWeapon(worn) ? $dataWeapons : $dataArmors;
        if (from && list[from] && list[from].siDegradesTo === worn.id) return list[from];
        return $.baseFor(worn);
    };

    var _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        var item = this.item();
        if (DataManager.isItem(item) && item.siRepair) {
            return target.isActor() && target.repairableSlots(item.siRepair).length > 0;
        }
        return _Game_Action_testApply.call(this, target);
    };

    var _Game_Action_applyRepair = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_applyRepair.call(this, target);
        var item = this.item();
        if (!DataManager.isItem(item) || !item.siRepair || !target.isActor()) return;
        var messages = [];
        target.repairableSlots(item.siRepair).forEach(function(slotId) {
            var worn = target.equips()[slotId], fixed = target.repairTarget(slotId);
            target._equips[slotId].setObject(fixed);
            messages.push('%1\'s %2 is mended into a %3!'.format(target.name(), worn.name, fixed.name));
        });
        if (messages.length) {
            target.refresh();
            target.result().success = true;
            if ($gameParty.inBattle()) target._siWearMessages = (target._siWearMessages || []).concat(messages);
        }
    };

    // Wear chance after the wearer's whetstones and polishing stones (weapons only).
    Game_Actor.prototype.wearChanceFor = function(item) {
        var chance = item.siWearChance;
        if (!DataManager.isWeapon(item)) return chance;
        this.armors().forEach(function(a) {
            var r = /<Wear Rate:\s*(\d+)>/i.exec(a.note || ''), d = /<Wear Reduce:\s*(\d+)>/i.exec(a.note || '');
            if (r) chance *= Number(r[1]) / 100;
            if (d) chance -= Number(d[1]);
        });
        return Math.max(chance, 0);
    };

    // worn: a roll made earlier (see startAction); omitted = roll now.
    Game_Actor.prototype.rollWear = function(slotId, worn) {
        var item = this.equips()[slotId];
        if (!$.canWear(item)) return null;
        if (worn === undefined) worn = Math.random() * 100 < this.wearChanceFor(item);
        if (!worn) return null;
        var list = DataManager.isWeapon(item) ? $dataWeapons : $dataArmors;
        var next = item.siDegradesTo > 0 ? list[item.siDegradesTo] : null;
        this._equips[slotId].setObject(next);
        this._siWornFrom = this._siWornFrom || {};
        this._siWornFrom[slotId] = next ? item.id : 0;
        this.refresh();
        if (next) {
            var shed = item.siSheds > 0 ? $dataItems[item.siSheds] : null;
            if (shed) $gameParty.gainItem(shed, 1);
            return $.wornMessage.format(this.name(), item.name, next.name) + (shed ? ' (' + shed.name + ' left over)' : '');
        }
        var remains = (item.siBreaksInto || []).map(function(id) { return $dataItems[id]; }).filter(Boolean);
        if (remains.length) {
            remains.forEach(function(r) { $gameParty.gainItem(r, 1); });
            return $.brokenKeptMessage.format(this.name(), item.name, remains.map(function(r) { return r.name; }).join(' and '));
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

    // Weapon wear is rolled when the action starts, so a weapon that is about
    // to break can shatter on that very swing (<Shatter Hit>).
    var _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        var subject = this._subject;
        var action = subject ? subject.currentAction() : null;
        var item = action ? action.item() : null;
        if (subject && subject.isActor()) {
            subject._siPendingWear = null;
            var slotId = DataManager.isSkill(item) ? subject.weaponSlotForSkill(item) : -1;
            var weapon = slotId >= 0 ? subject.equips()[slotId] : null;
            if ($.canWear(weapon)) {
                subject._siPendingWear = { slotId: slotId, worn: Math.random() * 100 < subject.wearChanceFor(weapon) };
            }
        }
        _BattleManager_startAction.call(this);
    };

    // The pending wear will break this weapon, and it shatters (<Shatter Hit>).
    Game_Actor.prototype.isShattering = function() {
        var p = this._siPendingWear;
        var weapon = p && p.worn ? this.equips()[p.slotId] : null;
        return !!weapon && weapon.siShatterHit > 0 && (weapon.siDegradesTo === 0 || weapon.siSheds > 0) ? weapon : null;
    };

    var _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        var subject = this.subject();
        var weapon = subject.isActor() && this.isPhysical() ? subject.isShattering() : null;
        if (weapon && value > 0) value = Math.round(value * weapon.siShatterHit);
        _Game_Action_executeDamage.call(this, target, value);
        var bleed = SmokingIsle.Ailments ? SmokingIsle.Ailments.bleedStateId : 0;
        if (weapon && value > 0 && bleed && target.isAlive() && Math.random() < 0.5) target.addState(bleed);
    };

    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var subject = this._subject;
        var item = this._action ? this._action.item() : null;
        var pending = subject && subject.isActor() ? subject._siPendingWear : null;
        if (subject && subject.isActor()) subject._siPendingWear = null;
        if (subject && subject.isActor() && DataManager.isSkill(item)) {
            var slotId = subject.weaponSlotForSkill(item);
            var message = slotId >= 0 ? subject.rollWear(slotId, pending && pending.slotId === slotId ? pending.worn : undefined) : null;
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
            // One piece that can wear takes the hit.
            var slots = target.equips().map(function(item, i) {
                return DataManager.isArmor(item) && $.canWear(item) ? i : -1;
            }).filter(function(i) { return i >= 0; });
            var message = slots.length ? target.rollWear(slots[Math.floor(Math.random() * slots.length)]) : null;
            if (message) target._siWearMessages = (target._siWearMessages || []).concat([message]);
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
