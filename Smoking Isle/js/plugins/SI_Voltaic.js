//=============================================================================
// SI_Voltaic.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: Islander electrical techniques (Voltaic Pile charge,
 * shock damage, water conducts, metal draws the current).
 * @author Smoking Isle
 *
 * @param Stun State
 * @type state
 * @desc State for a Sodden target hit by an electric technique (loses its
 * next turn).
 * @default 38
 *
 * @param Wet States
 * @desc Wet and Sodden state ids (electricity +50% against them; a Wet user
 * shocks themself).
 * @default 16,17
 *
 * @param Sodden State
 * @type state
 * @default 17
 *
 * @param Self Shock
 * @desc Share of max HP a Wet user loses using an electric technique.
 * @default 0.1
 *
 * @help
 * Place after SI_Ranged and SI_Ailments, before SI_Layout.
 *
 * A Voltaic Pile (charm) holds charge. Techniques spend it; charge carries
 * over between battles and is refilled with acid jars or by a battery tender.
 *
 * Armor note (the pile):
 *   <Charge: 3>          how much charge it holds
 *   <Shock Power: 14>    strength of its current (a.shockDamage(b, rate))
 *
 * Skill note:
 *   <Charge Cost: 1>     charge it spends (needs that much to use)
 *   <Charge Cost: all>   needs at least 2 and spends everything
 *   <Electric>           an electric hit: +50% against Wet or Sodden targets,
 *                        a Sodden target is stunned, and a Wet user shocks
 *                        themself
 *   <Metal Bonus: 175>   175% damage against <Metal> enemies
 *
 * Item note:
 *   <Recharge: 2>        restores 2 charge to the target (acid jar)
 *
 * Enemy note:
 *   <Metal>              wears metal (bronze armor): draws the current
 *
 * Formula helper: a.shockDamage(b, 1.0) uses the user's pile's Shock Power,
 * reduced by the target's DEF like any physical hit.
 *
 * Script: SmokingIsle.Voltaic.rechargeAll()   (a battery tender)
 */

var Imported = Imported || {};
Imported.SI_Voltaic = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Voltaic = SmokingIsle.Voltaic || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Voltaic');
    $.stunState = Number(params['Stun State'] || 38);
    $.wetStates = String(params['Wet States'] || '16,17').split(',').map(Number);
    $.soddenState = Number(params['Sodden State'] || 17);
    $.selfShock = Number(params['Self Shock'] || 0.1);

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._loaded) {
            $dataArmors.forEach(function(a) {
                if (!a) return;
                var c = /<Charge:\s*(\d+)>/i.exec(a.note || ''), p = /<Shock Power:\s*(\d+)>/i.exec(a.note || '');
                a.siCharge = c ? Number(c[1]) : 0;
                a.siShockPower = p ? Number(p[1]) : 0;
            });
            $dataSkills.forEach(function(s) {
                if (!s) return;
                var c = /<Charge Cost:\s*(\w+)>/i.exec(s.note || ''), m = /<Metal Bonus:\s*(\d+)>/i.exec(s.note || '');
                s.siChargeCost = c ? (c[1].toLowerCase() === 'all' ? 'all' : Number(c[1])) : 0;
                s.siElectric = /<Electric>/i.test(s.note || '');
                s.siMetalBonus = m ? Number(m[1]) / 100 : 1;
            });
            $dataItems.forEach(function(i) {
                if (!i) return;
                var r = /<Recharge:\s*(\d+)>/i.exec(i.note || '');
                i.siRecharge = r ? Number(r[1]) : 0;
            });
            $dataEnemies.forEach(function(e) {
                if (e) e.siMetal = /<Metal>/i.test(e.note || '');
            });
            $._loaded = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Charge
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.pile = function() {
        if (!this.isActor()) return null;
        return this.armors().filter(function(a) { return a.siCharge > 0; })[0] || null;
    };

    Game_BattlerBase.prototype.maxCharge = function() {
        var pile = this.pile();
        return pile ? pile.siCharge : 0;
    };

    Game_BattlerBase.prototype.charge = function() {
        if (this._siCharge === undefined) this._siCharge = this.maxCharge();
        return Math.min(this._siCharge, this.maxCharge());
    };

    Game_BattlerBase.prototype.gainCharge = function(n) {
        this._siCharge = (this.charge() + n).clamp(0, Math.max(this.maxCharge(), 0));
    };

    $.chargeCost = function(battler, skill) {
        if (skill.siChargeCost === 'all') return Math.max(battler.charge(), 2);
        return skill.siChargeCost || 0;
    };

    $.rechargeAll = function() {
        $gameParty.allMembers().forEach(function(a) { a._siCharge = a.maxCharge(); });
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        if (skill.siChargeCost) {
            return this.isActor() && this.pile() && this.charge() >= $.chargeCost(this, skill);
        }
        return true;
    };

    var _Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
    Game_BattlerBase.prototype.paySkillCost = function(skill) {
        _Game_BattlerBase_paySkillCost.call(this, skill);
        if (skill.siChargeCost) this.gainCharge(-$.chargeCost(this, skill));
    };

    //-------------------------------------------------------------------------
    // Shock damage, water and metal
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.shockDamage = function(target, rate) {
        var pile = this.pile();
        var power = (pile ? pile.siShockPower : 10) * rate;
        return SmokingIsle.Combat.reduce(power, target.def);
    };

    $.isWet = function(battler) {
        return $.wetStates.some(function(id) { return battler.isStateAffected(id); });
    };

    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = _Game_Action_makeDamageValue.call(this, target, critical);
        var item = this.item();
        if (!DataManager.isSkill(item) || value <= 0) return value;
        if (item.siElectric && $.isWet(target)) value = Math.round(value * 1.5);
        if (item.siMetalBonus !== 1 && target.isEnemy() && target.enemy().siMetal) value = Math.round(value * item.siMetalBonus);
        return value;
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var item = this.item();
        if (!item) return;
        if (DataManager.isItem(item) && item.siRecharge && target.isActor() && target.pile()) {
            target.gainCharge(item.siRecharge);
            target.result().success = true;
        }
        if (DataManager.isSkill(item) && item.siElectric && target.result().isHit() &&
                target.isAlive() && target.isStateAffected($.soddenState) && $.stunState > 0) {
            target.addState($.stunState);
        }
    };

    // A Wet user shocks themself (once per technique).
    var _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        var subject = this._subject;
        var action = subject ? subject.currentAction() : null;
        var item = action ? action.item() : null;
        _BattleManager_startAction.call(this);
        if (item && DataManager.isSkill(item) && item.siElectric && $.isWet(subject)) {
            var dmg = Math.max(1, Math.floor(subject.mhp * $.selfShock));
            subject.gainHp(-Math.min(dmg, subject.hp - 1));
            subject.startDamagePopup && subject.startDamagePopup();
            this._logWindow.push('addText', '%1 is shocked by their own current!'.format(subject.name()));
        }
    };

    // Cost display: "1 Ch (2)" = spends 1, 2 left.
    $.costText = function(actor, skill) {
        if (!skill.siChargeCost || !actor) return null;
        var cost = skill.siChargeCost === 'all' ? 'All' : String(skill.siChargeCost);
        return cost + ' Ch (' + actor.charge() + ')';
    };

})(SmokingIsle.Voltaic);
