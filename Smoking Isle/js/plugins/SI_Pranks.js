//=============================================================================
// SI_Pranks.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: prankster enemies (stealing to hidden hoards,
 * pantsing, nonlethal attacks) and evasion lost to states.
 * @author Smoking Isle
 *
 * @param Gold Steal
 * @desc Cowries taken when a thief finds nothing shiny: min-max.
 * @default 10-30
 *
 * @help
 * Enemy note:
 *   <Nonlethal>        its attacks never knock anyone out (they stop at 1 HP).
 *   <Runs When Beaten> at 0 HP it runs off instead of dying ("is slain" is
 *                      wrong for a prank fight with children).
 *   <Lose Evasion When: 16, 18>
 *                      its evasion drops to 0 while it has any of these
 *                      states (e.g. a leafy Green Horse when Wet or Burdened).
 *
 * Skill note (enemy skills):
 *   <Steal>            on a hit, takes one shiny thing and runs off with it:
 *                      an equipped <Shiny> item of the target, else a <Shiny>
 *                      item from the bag, else some cowries. Stolen things go
 *                      to the hidden hoard, not back to the party.
 *   <Strip: 4>         on a hit, pulls off the target's item in equipment
 *                      type 4 (Body) for the rest of the battle.
 *
 * Item / weapon / armor note:
 *   <Shiny>            thieves want it (copper, silver, bronze, pearls...).
 *
 * The hidden hoard (found later in a Children of the Caves stash):
 *   Script: SmokingIsle.Pranks.hoardSize()      number of stolen things
 *   Script: SmokingIsle.Pranks.recoverHoard()   gives everything back
 */

var Imported = Imported || {};
Imported.SI_Pranks = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Pranks = SmokingIsle.Pranks || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Pranks');
    var goldRange = String(params['Gold Steal'] || '10-30').split('-').map(Number);
    $.goldMin = goldRange[0] || 0;
    $.goldMax = goldRange[1] || $.goldMin;

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._loaded) {
            [$dataItems, $dataWeapons, $dataArmors].forEach(function(list) {
                list.forEach(function(obj) {
                    if (obj) obj.siShiny = /<Shiny>/i.test(obj.note || '');
                });
            });
            $dataSkills.forEach(function(skill) {
                if (!skill) return;
                var note = skill.note || '';
                skill.siSteal = /<Steal>/i.test(note);
                var strip = /<Strip:\s*(\d+)>/i.exec(note);
                skill.siStrip = strip ? Number(strip[1]) : 0;
            });
            $dataEnemies.forEach(function(enemy) {
                if (!enemy) return;
                var note = enemy.note || '';
                enemy.siNonlethal = /<Nonlethal>/i.test(note);
                enemy.siRunsWhenBeaten = /<Runs When Beaten>/i.test(note);
                var lose = /<Lose Evasion When:\s*([\d,\s]+)>/i.exec(note);
                enemy.siLoseEvasion = lose ? lose[1].split(',').map(Number).filter(function(n) { return n > 0; }) : [];
            });
            $._loaded = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Nonlethal
    //-------------------------------------------------------------------------

    var _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        var subject = this.subject();
        if (subject && subject.isEnemy() && subject.enemy().siNonlethal && value >= target.hp) {
            value = Math.max(target.hp - 1, 0);
        }
        _Game_Action_executeHpDamage.call(this, target, value);
    };

    // Beaten pranksters run off instead of dying.
    var _Game_Enemy_refresh = Game_Enemy.prototype.refresh;
    Game_Enemy.prototype.refresh = function() {
        if (this._hp === 0 && this.enemy().siRunsWhenBeaten && this.isAppeared() && $gameParty.inBattle()) {
            this._hp = 1;
            this.hide();
            this.clearActions();
            this._siPrankMessages = (this._siPrankMessages || []).concat(['%1 runs off in a huff!'.format(this.name())]);
        }
        _Game_Enemy_refresh.call(this);
    };

    //-------------------------------------------------------------------------
    // Evasion lost to states
    //-------------------------------------------------------------------------

    var _Game_BattlerBase_xparam = Game_BattlerBase.prototype.xparam;
    Game_BattlerBase.prototype.xparam = function(xparamId) {
        if (xparamId === 1 && this.isEnemy()) {
            var lose = this.enemy().siLoseEvasion;
            if (lose.length > 0 && lose.some(function(id) { return this.isStateAffected(id); }, this)) {
                return 0;
            }
        }
        return _Game_BattlerBase_xparam.call(this, xparamId);
    };

    //-------------------------------------------------------------------------
    // The hidden hoard
    //-------------------------------------------------------------------------

    Game_System.prototype.siHoard = function() {
        if (!this._siHoard) this._siHoard = { items: [], gold: 0 };
        return this._siHoard;
    };

    $.hoardSize = function() {
        var hoard = $gameSystem.siHoard();
        return hoard.items.length + (hoard.gold > 0 ? 1 : 0);
    };

    $.recoverHoard = function() {
        var hoard = $gameSystem.siHoard();
        hoard.items.forEach(function(entry) {
            var list = entry.kind === 'weapon' ? $dataWeapons : entry.kind === 'armor' ? $dataArmors : $dataItems;
            if (list[entry.id]) $gameParty.gainItem(list[entry.id], 1);
        });
        $gameParty.gainGold(hoard.gold);
        var count = $.hoardSize();
        hoard.items = [];
        hoard.gold = 0;
        return count;
    };

    $.kindOf = function(item) {
        return DataManager.isWeapon(item) ? 'weapon' : DataManager.isArmor(item) ? 'armor' : 'item';
    };

    //-------------------------------------------------------------------------
    // Steal and Strip
    //-------------------------------------------------------------------------

    // Picks something shiny: an equipped piece first, then the bag.
    $.stealFrom = function(target) {
        if (target.isActor()) {
            var slots = [];
            target.equips().forEach(function(item, i) {
                if (item && item.siShiny && target.isEquipChangeOk(i)) slots.push(i);
            });
            if (slots.length > 0) {
                var slotId = slots[Math.randomInt(slots.length)];
                var item = target.equips()[slotId];
                target._equips[slotId].setObject(null);
                target.refresh();
                return item;
            }
            var bag = $gameParty.allItems().filter(function(item) {
                return item.siShiny;
            });
            if (bag.length > 0) {
                var pick = bag[Math.randomInt(bag.length)];
                $gameParty.loseItem(pick, 1, false);
                return pick;
            }
        }
        return null;
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var item = this.item();
        var subject = this.subject();
        if (!item || !$gameParty.inBattle() || !target.result().isHit()) return;
        target._siPrankMessages = target._siPrankMessages || [];
        if (item.siStrip && target.isActor()) {
            var slotId = target.slotOfType ? target.slotOfType(item.siStrip) : target.equipSlots().indexOf(item.siStrip);
            var worn = slotId >= 0 ? target.equips()[slotId] : null;
            if (worn) {
                target._siStripped = target._siStripped || [];
                target._siStripped.push({ slotId: slotId, kind: $.kindOf(worn), id: worn.id });
                target._equips[slotId].setObject(null);
                target.refresh();
                target._siPrankMessages.push('%1\'s %2 is yanked off!'.format(target.name(), worn.name));
                target.result().success = true;
            }
        }
        if (item.siSteal && subject.isEnemy()) {
            var hoard = $gameSystem.siHoard();
            var stolen = $.stealFrom(target);
            if (stolen) {
                hoard.items.push({ kind: $.kindOf(stolen), id: stolen.id });
                target._siPrankMessages.push('%1 runs off with the %2!'.format(subject.name(), stolen.name));
            } else if ($gameParty.gold() > 0) {
                var gold = Math.min($gameParty.gold(), $.goldMin + Math.randomInt($.goldMax - $.goldMin + 1));
                $gameParty.loseGold(gold);
                hoard.gold += gold;
                target._siPrankMessages.push('%1 runs off with %2 %3!'.format(subject.name(), gold, TextManager.currencyUnit));
            } else {
                target._siPrankMessages.push('%1 finds nothing shiny.'.format(subject.name()));
                return;
            }
            target.result().success = true;
            subject.escape();
        }
    };

    var _Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        _Window_BattleLog_displayActionResults.call(this, subject, target);
        var messages = target._siPrankMessages || [];
        target._siPrankMessages = [];
        messages.forEach(function(text) {
            this.push('addText', text);
            this.push('wait');
        }, this);
    };

    // Pulled-off clothes go back on after the battle (or into the bag if
    // something else was put in that slot meanwhile).
    var _Game_Actor_onBattleEnd = Game_Actor.prototype.onBattleEnd;
    Game_Actor.prototype.onBattleEnd = function() {
        _Game_Actor_onBattleEnd.call(this);
        (this._siStripped || []).forEach(function(entry) {
            var list = entry.kind === 'weapon' ? $dataWeapons : $dataArmors;
            var item = list[entry.id];
            if (!item) return;
            if (!this.equips()[entry.slotId]) {
                this._equips[entry.slotId].setObject(item);
            } else {
                $gameParty.gainItem(item, 1);
            }
        }, this);
        this._siStripped = [];
        this.refresh();
    };

})(SmokingIsle.Pranks);
