//=============================================================================
// SI_Ranged.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: ranged weapons (ammo per battle, ranged power), flying, Steady Aim.
 * @author Smoking Isle
 *
 * @param Flying Evasion
 * @desc Evasion a <Flying> battler has against melee physical attacks.
 * @default 0.75
 *
 * @help
 * Requires SI_CombatCore (place below it).
 *
 * ============================================================================
 * Ranged weapons
 * ============================================================================
 * Ranged weapons are items in the Ranged equipment slot (armor entries with
 * a ranged armor type: Sling, Bow, Javelin, Net). Any equipment can also
 * carry ranged uses, e.g. Dama's harpoon in her melee slot.
 *
 * Equipment note:
 *   <Moves: sling>          the ranged move it allows (SI_CombatCore)
 *   <Ammo: 5>               uses per battle
 *   <Ranged Power: 8>       power added by ranged skills (not to melee ATK)
 *
 * Skill note:
 *   <Ammo Volley>           (ranged) spends ALL remaining ammo from the
 *                           item, hitting a random enemy once per shot
 *                           (Stone Rain). Use a "1 random enemy" scope.
 *   <Ranged>                a ranged skill: needs an equipped item with a
 *                           matching move and ammo left; each use spends 1
 *                           ammo from that item. Ignores evasion (accurate).
 *
 * Damage formula for ranged skills:
 *   a.rangedDamage(b, 1.0)  (unarmed ATK + the item's Ranged Power) x rate,
 *                           reduced by b.def like physDamage.
 *
 * Ammo resets at the start of every battle. The skill list shows how many
 * uses are left instead of a cost.
 *
 * ============================================================================
 * Flying
 * ============================================================================
 * Actor / enemy note:   <Flying>
 * Melee physical attacks against a flyer face at least the Flying Evasion.
 * Ranged and magical attacks are unaffected.
 *
 * ============================================================================
 * Until Ranged
 * ============================================================================
 * State note:   <Until Ranged>   removed after the battler's next ranged
 *                                attack (e.g. Steady Aim).
 */

var Imported = Imported || {};
Imported.SI_Ranged = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Ranged = SmokingIsle.Ranged || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Ranged');
    $.flyingEvasion = Number(params['Flying Evasion'] || 0.75);

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            [$dataWeapons, $dataArmors].forEach(function(list) {
                list.forEach(function(obj) {
                    if (!obj) return;
                    var ammo = /<Ammo:\s*(\d+)>/i.exec(obj.note);
                    var power = /<Ranged Power:\s*(\d+)>/i.exec(obj.note);
                    obj.siAmmo = ammo ? Number(ammo[1]) : 0;
                    obj.siRangedPower = power ? Number(power[1]) : 0;
                });
            });
            $dataSkills.forEach(function(skill) {
                if (!skill) return;
                skill.siRanged = /<Ranged>/i.test(skill.note);
                skill.siVolley = /<Ammo Volley>/i.test(skill.note);
            });
            $dataStates.forEach(function(state) {
                if (state) state.siUntilRanged = /<Until Ranged>/i.test(state.note);
            });
            $._notesParsed = true;
        }
        return true;
    };

    $.isRanged = function(item) {
        return DataManager.isSkill(item) && !!item.siRanged;
    };

    //-------------------------------------------------------------------------
    // Ammo
    //-------------------------------------------------------------------------

    Game_Actor.prototype.ammoUsed = function(slotId) {
        return (this._siAmmoUsed && this._siAmmoUsed[slotId]) || 0;
    };

    Game_Actor.prototype.ammoLeft = function(slotId) {
        var item = this.equips()[slotId];
        return item ? Math.max((item.siAmmo || 0) - this.ammoUsed(slotId), 0) : 0;
    };

    // The equip slot that would supply a ranged skill: matching move, ammo left.
    Game_Actor.prototype.rangedSourceSlot = function(skill) {
        var required = skill.siRequiredMoves || [];
        var equips = this.equips();
        for (var i = 0; i < equips.length; i++) {
            var item = equips[i];
            if (!item || !item.siAmmo) continue;
            var matches = required.length === 0 || (item.siMoves || []).some(function(m) {
                return required.indexOf(m) >= 0;
            });
            if (matches && this.ammoLeft(i) > 0) return i;
        }
        return -1;
    };

    Game_Actor.prototype.rangedAmmoForSkill = function(skill) {
        var required = skill.siRequiredMoves || [];
        var total = 0;
        this.equips().forEach(function(item, i) {
            if (item && item.siAmmo && (required.length === 0 || (item.siMoves || []).some(function(m) {
                return required.indexOf(m) >= 0;
            }))) {
                total += this.ammoLeft(i);
            }
        }, this);
        return total;
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        if ($.isRanged(skill) && this.isActor()) return this.rangedSourceSlot(skill) >= 0;
        return true;
    };

    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        if ($.isRanged(item) && this.isActor() && $gameParty.inBattle()) {
            var slot = this.rangedSourceSlot(item);
            this._siRangedSlot = slot;
            if (slot >= 0) {
                this._siAmmoUsed = this._siAmmoUsed || {};
                var spend = item.siVolley ? this.ammoLeft(slot) : 1;
                this._siAmmoUsed[slot] = this.ammoUsed(slot) + spend;
            }
        }
        _Game_Battler_useItem.call(this, item);
    };

    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        this._siAmmoUsed = {};
        this._siRangedSlot = -1;
    };

    var _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _Game_Battler_onBattleEnd.call(this);
        this._siAmmoUsed = {};
    };

    //-------------------------------------------------------------------------
    // Damage, accuracy, flying
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.rangedPower = function() {
        if (!this.isActor()) return 0;
        var item = this.equips()[this._siRangedSlot];
        return item ? item.siRangedPower || 0 : 0;
    };

    Game_BattlerBase.prototype.rangedDamage = function(target, rate) {
        var power = (this.unarmedAtk() + this.rangedPower()) * rate;
        return SmokingIsle.Combat.reduce(power, target.def);
    };

    // Damage previews (e.g. auto battle) before useItem: pick the slot now.
    var _Game_Action_evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        var subject = this.subject();
        if ($.isRanged(this.item()) && subject.isActor() && !(subject._siRangedSlot >= 0)) {
            subject._siRangedSlot = subject.rangedSourceSlot(this.item());
        }
        return _Game_Action_evalDamageFormula.call(this, target);
    };

    // Volley: one random hit per shot left (counted before the ammo is spent).
    var _Game_Action_numTargets = Game_Action.prototype.numTargets;
    Game_Action.prototype.numTargets = function() {
        var item = this.item();
        var subject = this.subject();
        if (item && item.siVolley && subject.isActor()) {
            var slot = subject.rangedSourceSlot(item);
            return slot >= 0 ? subject.ammoLeft(slot) : 1;
        }
        return _Game_Action_numTargets.call(this);
    };

    $.isFlying = function(battler) {
        var note = battler.isActor() ? battler.actor().note : battler.enemy().note;
        return /<Flying>/i.test(note);
    };

    var _Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        if ($.isRanged(this.item())) return 0;
        var eva = _Game_Action_itemEva.call(this, target);
        if (this.isPhysical() && $.isFlying(target)) eva = Math.max(eva, $.flyingEvasion);
        return eva;
    };

    // After a ranged attack: drop <Until Ranged> states and forget the slot.
    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var subject = this._subject;
        var item = this._action ? this._action.item() : null;
        if (subject && $.isRanged(item)) {
            subject.states().filter(function(s) { return s.siUntilRanged; }).forEach(function(s) {
                subject.removeState(s.id);
            });
            subject._siRangedSlot = -1;
        }
        _BattleManager_endAction.call(this);
    };

    //-------------------------------------------------------------------------
    // Skill list: show uses left for ranged skills.
    //-------------------------------------------------------------------------

    var _Window_SkillList_drawSkillCost = Window_SkillList.prototype.drawSkillCost;
    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        if ($.isRanged(skill) && this._actor && $gameParty.inBattle()) {
            this.changeTextColor(this.systemColor());
            this.drawText('x' + this._actor.rangedAmmoForSkill(skill), x, y, width, 'right');
            return;
        }
        _Window_SkillList_drawSkillCost.call(this, skill, x, y, width);
    };

})(SmokingIsle.Ranged);
